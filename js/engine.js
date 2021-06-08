//load textures - called after map data is loaded
var TEXTURE = new Image(),
    texture_pixels;
function loadTexture() {
    TEXTURE.onload = () => {
        //get texture pixel data by drawing on a in-memory canvas
        var texture_canvas = document.createElement('canvas');
        texture_canvas.width = TEXTURE.width;
        texture_canvas.height = TEXTURE.height;
        var texture_context = texture_canvas.getContext('2d');
        texture_context.drawImage(TEXTURE, 0, 0);
        texture_pixels = new DataView(texture_context.getImageData(0, 0, TEXTURE.width, TEXTURE.height).data.buffer);
        //start the game after textures are loaded
        startGame();
    }
    TEXTURE.src = 'res/wolftextures.png'; //load textures and start game onload callback
}

// set up input controls, up/down/left/right or w/a/s/d. spacebar for doors
var KEYS = {}, //keeps track of key presses
    canPressSpace = true; // flag used to stop "auto firing" of spacebar key press when held
document.body.onkeydown = function(e) { return toggleKey(e, 1); }
document.body.onkeyup = function(e) { return toggleKey(e, 0); }
function toggleKey(e, active) {
    if (e.keyCode == 39 || e.keyCode == 68) KEYS['right'] = active;
    if (e.keyCode == 37 || e.keyCode == 65) KEYS['left'] = -active;
    if (e.keyCode == 38 || e.keyCode == 87) KEYS['up'] = active;
    if (e.keyCode == 40 || e.keyCode == 83) KEYS['down'] = -active;
    if (e.keyCode == 32) { //don't allow "auto-fire" of spacebar keypress
        if (!active) { //release key
            canPressSpace = true;
            KEYS['space'] = 0;
        } else if (!KEYS['space']) {
            canPressSpace = false;
            KEYS['space'] = 1;
        }
    }
    if ([37, 38, 39, 40, 65, 68, 84, 87, 32].indexOf(e.keyCode) >= 0) e.preventDefault();
}

// get screen pixel buffer to use as a backbuffer-- will draw to this by manipulating pixel values, then blit to canvas when done
var screen = document.getElementById('game'),
    screen_context = screen.getContext('2d', {alpha: false}),
    screen_pixels = screen_context.getImageData(0, 0, screen.width, screen.height),
    screen_pixel_data = new DataView(screen_pixels.data.buffer);
screen.half_height = screen.height / 2;
screen.vp_ratio = screen.width / screen.height;

// math shortcuts
Math.PI_DIV_2 = Math.PI / 2;
Math.PI_TIMES_2 = Math.PI * 2;
Math.distance = function(x1, y1, x2, y2) { return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)); }
Math.wrapRadians = function(radians) {
    if (radians > Math.PI_TIMES_2) radians -= Math.PI_TIMES_2;
    else if (radians < 0) radians += Math.PI_TIMES_2;
    return radians;
}
//camera position
var camera = { x: 4, y: 6, angle: 0 };
//geometry lookup tables
var RAY_ANGLES = [], FISH_EYE = [], ROW_DISTANCES = [];
var floor_casting = false;
// map and map things
var map, sprites = [], cast_sprites = [], doors = new Map(), active_doors = new Map();

function startGame() {
    //geometry look up tables- ray angle and fish eye correction for each pixel column of viewport 
    for (var column = -screen.width / 2; column < screen.width / 2; column++) {
        var angle = Math.atan2(column + 0.5, screen.width); // angle of ray through each column of screen pixels
        RAY_ANGLES.push(angle);
        FISH_EYE.push(Math.cos(angle));
    }
    //look up table for floor casting
    for (var row = screen.half_height; row < screen.height; row++) {
        ROW_DISTANCES.push(screen.width / ((2 * row) - screen.height)); //((screen.half_height / (row - screen.half_height)) * screen.vp_ratio)
    }
    window.requestAnimationFrame((d)=>{update(d)}); //begin the game loop
}
// sprite texture id helpers
var SPRITE = {
    BARREL: 9, COLUMN: 10, //blocking
    CEILING_LIGHT: 11, TREASURE_CROSS: 12, //walkable
    DOOR_NS: 13, DOOR_EW: 14 //doors
};
function loadMap(mapData) { //called with mapData loaded from res/map.js
    map = mapData;
    for (var y = 0; y < map.length; y++) {
        for (var x = 0; x < map[y].length; x++) {
            var tile = map[y][x];
            if (tile >= 9) { // sprites, everything below is a wall cell
                map[y][x] = -1;// something is (probably) here - block path without a wall texture id
                var sprite = {x: x+0.5, y: y+0.5, texture: tile-1, billboard: true};
                if ([SPRITE.CEILING_LIGHT, SPRITE.TREASURE_CROSS].indexOf(tile) >= 0) {
                    map[y][x] = 0;// nothing is on wall map - can walk through these sprites
                } else if ([SPRITE.DOOR_NS, SPRITE.DOOR_EW].indexOf(tile) >= 0) {
                    var key = (y * map[0].length) + x;
                    Object.assign(sprite, {
                        key: key, origin_x: sprite.x, origin_y: sprite.y, map_x: x, map_y: y,
                        billboard: false, texture: 12, timer: 0, state: 0, //closed state
                        rotation: (tile == SPRITE.DOOR_EW) ? 0 : -Math.PI_DIV_2, side: (tile == SPRITE.DOOR_EW)
                    });
                    doors.set(key, sprite); // remember this door
                }
                sprites.push(sprite);
            }
        }
    }
    loadTexture();
}

function cast(cell_x, cell_y, ray_angle, cos_a, sin_a, column) {
    var tan_a = sin_a / cos_a,
        sign_sin_a = Math.sign(sin_a), sign_cos_a = Math.sign(cos_a), 
        b = camera.y - (tan_a * camera.x), //b = y - (m * x) (solving for b)
        door_cell, intersect_distance, side, wall_height, sprite_height, texture_coord, 
        step_dx, step_dy, last_x, last_y,
        x_intersection, y_intersection, x_intersect_distance = Infinity, y_intersect_distance = Infinity,
        wall_distance, hits = [];
    // check for wall hits by solving for grid line intersections with ray
    // while (!(last_x == cell_x && last_y == cell_y)) { //loop while algorithm is solvable (not looking directly down an x or y grid line)
    while (true) { //loop while algorithm is solvable (not looking directly down an x or y grid line)
        door_cell = doors.get((cell_y * map[0].length) + cell_x); //for rendering door metal around doors (not the door itself)
        wall_distance = Infinity;
        //find nearest grid line y intercept and distance to it
        if (last_x != cell_x) { //check if need to recalc this one
            last_x = cell_x;
            step_dx = Math.max(sign_cos_a, 0); //0 = left,top of cell, 1 = right,bottom of cell
            y_intersection = (tan_a * (cell_x + step_dx)) + b; // y = m * x + b
            y_intersect_distance = Math.distance(cell_x + step_dx, y_intersection, camera.x, camera.y);
        }
        //find nearest grid line x intercept and distance to it
        if (last_y != cell_y && tan_a) { //check if need to recalc this one (unsolvable if tan_a is zero)
            last_y = cell_y;
            step_dy = Math.max(sign_sin_a, 0);
            x_intersection = (cell_y + step_dy - b) / tan_a; // x = (y - b) / m
            x_intersect_distance = Math.distance(x_intersection, cell_y + step_dy, camera.x, camera.y);
        }
        //figure out which grid square is nearer
        side = (x_intersect_distance > y_intersect_distance) ? 0 : 1;
        if (!side) { //x gridline is nearer
            cell_x += sign_cos_a;
            if (cell_x >= map[0].length || cell_x < 0) break; //keep in map bounds
            texture_coord = Math.abs(step_dx - (y_intersection - Math.floor(y_intersection)));
            intersect_distance = y_intersect_distance;
        } else { // y gridline is nearest (or tied for nearest)
            cell_y += sign_sin_a;
            if (cell_y >= map.length || cell_y < 0) break; //keep in map bounds
            texture_coord = Math.abs(!step_dy - (x_intersection - Math.floor(x_intersection)));
            intersect_distance = x_intersect_distance;
        }
        //is this grid square a rendered wall? if yes, no need to go on since any walls behind wouldn't be rendered
        if (map[cell_y][cell_x] > 0) {
            wall_height = screen.width * (1 / (intersect_distance * FISH_EYE[column]));
            wall_distance = intersect_distance; //remember this for sprite hit optimization
            hits.push({
                x: cell_x, y: cell_y, distance: intersect_distance,
                texture_coord: Math.floor(64 * ((door_cell ? 14 : map[cell_y][cell_x]) - Math.max(texture_coord, 0.000001))), // draw door metal if this is a door tile
                texture_size: 64 / wall_height,
                side: side, half_height: wall_height >> 1
            });
            break;
        }
    }
    //calculate sprite projections for filtered sprite list
    for (var i = 0; i < cast_sprites.length; i++) {
        var sprite = cast_sprites[i],
            //use law of sines to triangulate sprite position (cancel out camera rotation)
            a = ray_angle - sprite.angle_to_camera,
            //how to rotate the sprite (billboarded: camera.angle, E/W door: 0, N/S door -Math.PI_DIV_2)
            b = sprite.angle_to_camera - sprite.rotation,
            c_ratio = sprite.distance_to_camera / Math.sin(Math.PI - a - b), 
            texture_coord = Math.sin(a) * c_ratio;
        intersect_distance = (Math.sin(b) * c_ratio);
        //only keep texture coords between texture bounds (1 grid unit (-0.5 to 0.5)) or behind a wall, ignore it
        if (Math.abs(texture_coord) >= 0.4999 || intersect_distance >= wall_distance) continue; 
        sprite_height = screen.width / (intersect_distance * FISH_EYE[column]);
        hits.push({
            distance: intersect_distance,
            texture_coord: Math.floor(64 * (sprite.texture + texture_coord + 0.5)),
            texture_size: 64 / sprite_height, 
            side: sprite.side, half_height: sprite_height >> 1 //half wall height
        });
    }
    //sort all ray hits by distance, farthest to nearest
    return hits.sort((a, b) => b.distance - a.distance);
}

function copyTexturePixels(screen_offset, texture_offset, tint) {
    var texture_alpha = texture_pixels.getUint8(texture_offset + 3, false) & 255;
    if (!texture_alpha) return; //don't copy over transparent pixels
    var tx = texture_pixels.getUint32(texture_offset, true);
    if (tint) {
        //darken the color
        var r = ~~((tx % 256) * 0.60),
            g = ~~(((tx >>> 8) % 256) * 0.60),
            b = ~~(((tx >>> 16) % 256) * 0.60);
        tx = (255 << 24) + (b << 16) + (g << 8) + r;
    }
    screen_pixel_data.setUint32(screen_offset, tx, true);
}

function readInputs(delta_sec) {
    // update camera position based on inputs
    var dir = 0, radius = 0.25;
    //walking and collision detection
    dir = KEYS['up'] || KEYS['down'];
    if (dir) {
        var speed = delta_sec * 5,
            cos_a = dir * Math.cos(camera.angle), sin_a = dir * Math.sin(camera.angle),
            next_x = camera.x + (cos_a * speed), next_y = camera.y + (sin_a * speed),
            radius_x = next_x + (radius * cos_a), radius_y = next_y + (radius * sin_a);
        if (radius_x >= 0 && radius_x < map[0].length && !map[Math.floor(camera.y)][Math.floor(radius_x)])
            camera.x = next_x;
        if (radius_y >= 0 && radius_y < map.length && !map[Math.floor(radius_y)][Math.floor(camera.x)])
            camera.y = next_y;
    }
    //turning
    dir = KEYS['left'] || KEYS['right'];
    if (dir) camera.angle = Math.wrapRadians(camera.angle + (dir * delta_sec * Math.PI)); //add angle and make sure to wrap angle-- 0 to 2*PI
    // doors
    if (KEYS['space']) {
        KEYS['space'] = 0; // deactivate the key press so it doesn't "auto-fire"
        //look ahead to activate door
        var activate_x = Math.floor(camera.x + Math.cos(camera.angle)),
            activate_y = Math.floor(camera.y + Math.sin(camera.angle)),
            door = doors.get((activate_y * map[0].length) + activate_x);
        if (door) { //0 = closed, 1 = closing, 2 = open, 3 = opening
            if (door.state <= 1) {
                if (door.state == 0) {
                    door.timer = 0; //only set timer if already closed
                    active_doors.set(door.key, door); //make active
                }
                door.state = 3; //if closed or closing, set state to opening
            } else if (door.state <= 3) {
                if (door.state == 2) door.timer = 0.5; //only set timer if already opened
                door.state = 1; //if open or opening, set state to closing
            }
        }
    }
}

function updateDoors(delta_sec) {
    active_doors.forEach(door => {
        if (door.state == 1) { //closing
            door.timer -= delta_sec;
            if (door.timer < 0) {   //closed
                Object.assign(door, {timer: 0, state: 0, x: door.origin_x, y: door.origin_y});
                active_doors.delete(door.key); //remove from active door list
            }
        } else if (door.state == 3) { // opening
            door.timer += delta_sec;
            if (door.timer > 0.5) { //open 
                //set 2 second open timer (cut countdown timedelta in half for open timer), set in place
                Object.assign(door, {timer: 1, state: 2, x: door.origin_x + Math.cos(door.rotation), y: door.origin_y + Math.sin(door.rotation)}); 
            }
        } else if (door.state == 2 && !(Math.floor(camera.x) == door.map_x && Math.floor(camera.y) == door.map_y)) {//door is open
            //when open, don't update open timer if camera occupies same cell
            door.timer -= (delta_sec / 2); //do countdown timer to close (2 seconds)
            if (door.timer <= 0) { //open timer is up, start closing
                Object.assign(door, {timer: 0.5, state: 1}); 
            }
        }
        if (door.state == 1 || door.state == 3) { //only update position if door is opening/closing
            door.x = door.origin_x - (2 * door.timer * Math.cos(door.rotation));
            door.y = door.origin_y - (2 * door.timer * Math.sin(door.rotation));
        }
        // make map cell walkable (0, open) or not (-1) depending on door state
        map[door.map_y][door.map_x] = -(door.state != 2);
    });
}

function updateSprites(delta_sec) {
    // filter out sprites that don't need to be rendered and update sprites' geometry
    cast_sprites = sprites.filter(sprite => {
        sprite.angle_to_camera = Math.wrapRadians(Math.atan2(sprite.y - camera.y, sprite.x - camera.x));
        sprite.distance_to_camera = Math.distance(sprite.x, sprite.y, camera.x, camera.y);
        if (sprite.billboard) sprite.rotation = camera.angle - Math.PI_DIV_2; //if billboarded, rotate sprite with camera rotation, keep perpendicular
        // filter out sprites outside of approximate FOV unless really close
        var view_angle = Math.wrapRadians(sprite.angle_to_camera - camera.angle); //viewing angle of sprite
        return sprite.distance_to_camera < 2 || view_angle > 5.5 || view_angle < 0.8;
    });
}

function drawScreen() {
    //origin cell to draw line cast from
    var cell_x = Math.floor(camera.x), cell_y = Math.floor(camera.y);
    // cast ray for each column of screen pixels and draw
    for (var column = 0; column < screen.width; column++) {
        var ray_angle = RAY_ANGLES[column] + camera.angle,
            cos_a = Math.cos(ray_angle), sin_a = Math.sin(ray_angle)
            hits = cast(cell_x, cell_y, ray_angle, cos_a, sin_a, column);
        //draw floor / ceiling for this column - draw from middle of screen up and down simultaneously
        for (var row = screen.half_height; row < screen.height; row++) {
            var floor_px_offset = ((row * screen.width) + column) << 2,
                ceiling_px_offset = (((screen.height - row - 1) * screen.width) + column) << 2,
                ray_length = ROW_DISTANCES[row - screen.half_height] / FISH_EYE[column],
                //where does this ray hit at that distance and angle
                floor_x = camera.x + (ray_length * cos_a), floor_y = camera.y + (ray_length * sin_a);
            if (!floor_casting || floor_x < 0 || floor_y < 0 || floor_x >= map[0].length || floor_y >= map.length) {
                //don't render floor/ceiling textures outside of map bounds or at all if floor casting is off
                screen_pixel_data.setUint32(floor_px_offset, -9539986, true);  //fill floor color
                screen_pixel_data.setUint32(ceiling_px_offset, -13158601, true); //fill ceiling color
            } else {
                //apply floor / ceiling textures - better algo would be to calc apparent pixel area and average texture color over it
                var tx = Math.floor((floor_x - Math.floor(floor_x)) * 64),
                    ty = Math.floor((floor_y - Math.floor(floor_y)) * 64) * TEXTURE.width,
                    floor_texture_offset = (ty + (3 * 64) + tx) << 2, //TODO: choose floor texture (map)
                    ceiling_texture_offset = (ty + (6 * 64) + tx) << 2; //TODO: choose ceiling texture (map)
                copyTexturePixels(floor_px_offset, floor_texture_offset);
                copyTexturePixels(ceiling_px_offset, ceiling_texture_offset);
            }
        }
        //draw ray hits with walls and sprites
        for (var i = 0; i < hits.length; i++) {
            //copy to pixel buffer - draw from middle of screen up and down simultaneously
            for (var y = 0; y < hits[i].half_height; y++) {
                var screen_px_bottom = (((screen.half_height + y) * screen.width) + column) << 2,
                    screen_px_top = (((screen.half_height - y - 1) * screen.width) + column) << 2;
                if (screen_px_top < 0) break; //don't draw off screen
                var texture_dy = (y * hits[i].texture_size),
                    texture_offset_bottom = ((Math.floor(32 + texture_dy) * TEXTURE.width) + hits[i].texture_coord) << 2,
                    texture_offset_top = ((Math.floor(32 - texture_dy) * TEXTURE.width) + hits[i].texture_coord) << 2;
                //draw pixels on draw buffer. if pixel is drawn here, remove its coordinate from pixel draw mask
                copyTexturePixels(screen_px_bottom, texture_offset_bottom, hits[i].side);
                copyTexturePixels(screen_px_top, texture_offset_top, hits[i].side);
            }
        }
    }
    //blit the offscreen pixels to screen canvas context
    screen_context.putImageData(screen_pixels, 0, 0);
}
// game loop
var last_time = 0;
function update(time) {
    var delta = time - last_time,
        delta_sec = delta / 1000;
    readInputs(delta_sec);
    updateDoors(delta_sec);
    updateSprites(delta_sec);
    drawScreen();
    last_time = time;
    window.requestAnimationFrame((d)=>{update(d)}); //continue looping
}