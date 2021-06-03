
// https://github.com/vpoupet/wolfenstein/tree/master/js
class GameScene extends Scene {

    constructor(game) {
        super(game);

        Math.PI_2 = Math.PI / 2;
        Math.PI_180 = Math.PI / 180;
        this.texture_size = 64;
        this.texture_half_size = this.texture_size / 2;

        this.floor_casting = false;

        this.camera = { x: 3.5, y: 6.5, z: 0.5, a: 0, grid_x: Math.floor(3.5), grid_y: Math.floor(6.5), a_rad: this.radians(0) };


        this.map = [
            [1, 1, 0, 1, 8, 8, 8, 8, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1],
            [1, 1, -1, 1, 10, 10, 10, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 11, 12, 12, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 12, 12, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [-1, 0, 0, 0, 0, 9, 0, 9, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 3, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 10, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 9, 0, 9, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 3, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 4, 4, 4, 14, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 6, 14, 6, 0, 0, 0, 0, 0, 1],
            [1, 4, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 4, 0, 0, 0, 0, 5, 0, 4, 0, 0, 0, 0, 0, 0, 2, 14, 2, 0, 0, 0, 0, 0, 1],
            [1, 4, 0, 4, 0, 0, 0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 4, 0, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 5, 14, 5, 0, 0, 0, 0, 0, 1],
            [1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];

        this.sprites = [];
        this.doors = new Map();
        this.push_walls = new Map();
        //spawn sprites from map
        for (var y = 0; y < this.map.length; y++) {
            for (var x = 0; x < this.map[y].length; x++) {
                var tile = this.map[y][x];
                if (tile < 0) {
                    var push_wall = new PushWall(this, x, y, tile);
                    //push wall
                    this.push_walls.set((y * this.map[0].length) + x, push_wall);
                } else if (tile >= 9) {
                    var sprite;
                    switch (tile) {
                        case TILE.BARREL:
                        case TILE.COLUMN:
                            //unwalkable objects - barrel, column
                            sprite = new Sprite(this, x, y, 0, 0, 0);
                            this.map[y][x] = -1;// something is here - block path
                            break;
                        case TILE.CEILING_LIGHT:
                            //walk through objects - light
                            sprite = new Sprite(this, x, y, 0, 0, 0);
                            this.map[y][x] = 0;// nothing is on wall map - can walk through
                            break;
                        case TILE.TREASURE_CROSS:
                            sprite = new TreasureCross(this, x, y);
                            break;
                        case TILE.DOOR_NS:
                        case TILE.DOOR_EW:
                            //doors
                            sprite = new Door(this, x, y, tile === TILE.DOOR_NS ? -Math.PI_2 : -Math.PI);
                            // this.doors.push(sprite);
                            this.doors.set((y * this.map[0].length) + x, sprite);
                            break;
                    }
                    this.sprites.push(sprite);
                }
            }
        }

        //pixel backbuffer
        this.canvas_pixels = this.context.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        this.pixels = new DataView(this.canvas_pixels.data.buffer);

        //get texture pixel data
        this.texture_canvas = document.createElement('canvas');
        this.texture_canvas.width = TEXTURE.width;
        this.texture_canvas.height = TEXTURE.height;
        this.texture_context = this.texture_canvas.getContext('2d');
        this.texture_context.drawImage(TEXTURE, 0, 0);
        this.texture_pixels = this.texture_context.getImageData(0, 0, TEXTURE.width, TEXTURE.height);
        this.texture = new DataView(this.texture_pixels.data.buffer);

        //pre calculate casting angles and other perspective related maths that don't change
        this.vp_width = SCREEN_WIDTH;
        this.vp_height = SCREEN_HEIGHT;
        this.vp_width_half = this.vp_width / 2;
        this.vp_height_half = this.vp_height / 2;
        this.vp_ratio = this.vp_width / this.vp_height;

        this.floor_color = -9539986;
        this.ceiling_color = -13158601;

        //various lookup tables
        this.RAY_ANGLES = [];
        this.FISH_EYE = [];
        for (var column = -this.vp_width_half; column < this.vp_width_half; column++) {
            var angle = Math.atan2(column, this.vp_width)
            this.RAY_ANGLES.push(angle);
            this.FISH_EYE.push(Math.cos(angle));
        }

        this.ROW_DISTANCES = [];
        for (var row = this.vp_height_half; row < this.vp_height; row++) {
            this.ROW_DISTANCES.push((this.vp_height_half / (row - this.vp_height_half)) * this.vp_ratio);
        }
    }


    update(dt) {
        this.fps = (1 / dt) * 1000;
        var next_x, next_y, dir = 0, strafe = 0, radius = 0.25;
        if (Input.isKeyDown(Input.ARROW_UP)) { dir = 1; }
        if (Input.isKeyDown(Input.ARROW_DOWN)) { dir = -1; }
        if (Input.isKeyDown(Input.STRAFE_LEFT)) { dir = 1; strafe = -Math.PI_2; }
        if (Input.isKeyDown(Input.STRAFE_RIGHT)) { dir = 1; strafe = Math.PI_2; }

        if (dir) {
            var dir_a = this.camera.a_rad + strafe,
                speed = (dt / 1000) * 5,
                cos_a = dir * Math.cos(dir_a),
                sin_a = dir * Math.sin(dir_a);
            next_x = this.camera.x + (cos_a * speed);
            next_y = this.camera.y + (sin_a * speed);

            if (next_x + (radius * cos_a) >= 0 && next_x + (radius * cos_a) < this.map[0].length &&
                !this.map[Math.floor(this.camera.y)][Math.floor(next_x + (radius * cos_a))]) {
                this.camera.x = next_x;
            }
            if (next_y + (radius * sin_a) >= 0 && next_y + (radius * sin_a) < this.map.length &&
                !this.map[Math.floor(next_y + (radius * sin_a))][Math.floor(this.camera.x)]) {
                this.camera.y = next_y;
            }
            this.camera.grid_x = Math.floor(this.camera.x);
            this.camera.grid_y = Math.floor(this.camera.y);
        }

        //rotate to the right
        dir = 0;
        if (Input.isKeyDown(Input.ARROW_RIGHT)) { dir = 1; }
        //rotate to the left
        if (Input.isKeyDown(Input.ARROW_LEFT)) { dir = -1; }
        if (dir) {
            this.camera.a += dir * (dt / 1000) * 120;
            this.camera.a = (this.camera.a + 360) % 360;
            this.camera.a_rad = this.radians(this.camera.a);
        }

        if (Input.readKeyPress() === Input.ENTER) {
            var activate_x = Math.floor(this.camera.x + Math.cos(this.camera.a_rad)),
                activate_y = Math.floor(this.camera.y + Math.sin(this.camera.a_rad)),
                door = this.doors.get((activate_y * this.map[0].length) + activate_x);
            if (door) {
                door.toggle();
            }
        }

        //update doors
        this.doors.forEach(door => door.update(dt));

        //narrow down sprite list to those in FOV only (plus a little extra) for rendering
        this.cast_sprites = this.sprites.filter(sprite => {
            //prep sprites for ray casting
            sprite.angle_to_camera_rad = Math.atan2(sprite.y - this.camera.y, sprite.x - this.camera.x);
            sprite.angle_to_camera = this.degrees(sprite.angle_to_camera_rad);
            sprite.distance_to_camera = this.distance(sprite.x, sprite.y, this.camera.x, this.camera.y);
            var angle_minus_360 = sprite.angle_to_camera - 360, angle_plus_360 = sprite.angle_to_camera + 360,
                frustum_left = this.camera.a - 60, frustum_right = this.camera.a + 60,
                distance = this.distance(this.camera.x, this.camera.y, sprite.x, sprite.y);
            //TODO: distance limit?
            //only keep sprites within viewing range - with a little cushion
            return (sprite.angle_to_camera >= frustum_left && sprite.angle_to_camera <= frustum_right) ||
                (angle_plus_360 >= frustum_left && angle_plus_360 <= frustum_right) ||
                (angle_minus_360 >= frustum_left && angle_minus_360 <= frustum_right) ||
                (distance < 1);
        });
    }

    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }

    degrees(radians) {
        return ((radians * (180 / Math.PI) + 360) % 360); //returns a positive angle 0 - 359.999...
    }

    radians(degrees) {
        return degrees * Math.PI_180;
    }

    rayCast(step_x, step_y, ray_angle, cos_a, sin_a, column) {
        var tan_a = sin_a / cos_a, //Math.tan(ray_angle),
            inv_tan_a = cos_a / sin_a,
            b = this.camera.y - (tan_a * this.camera.x),
            door_tile, side,
            move_dx, move_dy,
            step_dx, step_dy,
            last_x, last_y,
            y_solution, x_solution,
            y_solution_distance = Infinity,
            x_solution_distance = Infinity,
            distance, wall_height, sprite_height, texture_coord,
            hits = [];

        // cast into walls TODO: distance cut off?
        while (true) {
            door_tile = this.doors.get((step_y * this.map[0].length) + step_x); //for rendering door metal around doors
            //find nearest grid line x intercept and distance to it
            if (last_x != step_x) { //check if need to recalc this one
                last_x = step_x;
                move_dx = Math.sign(cos_a);
                step_dx = Math.max(move_dx, 0);
                y_solution = (tan_a * (step_x + step_dx)) + b;
                y_solution_distance = this.distance(step_x + step_dx, y_solution, this.camera.x, this.camera.y);
            }
            //find nearest grid line y intercept and distance to it
            if (last_y != step_y) { //check if need to recalc this one
                last_y = step_y;
                move_dy = Math.sign(sin_a);
                step_dy = Math.max(move_dy, 0);
                x_solution = inv_tan_a * (step_y + step_dy - b);
                x_solution_distance = this.distance(x_solution, step_y + step_dy, this.camera.x, this.camera.y);
            }
            //figure out which grid square is nearer
            side = (x_solution_distance > y_solution_distance) ? 0 : 1;
            if (!side) { //x gridline is nearer
                step_x += move_dx;
                if (step_x >= this.map[0].length || step_x < 0) break; //keep in map bounds
                texture_coord = Math.abs(step_dx - (y_solution - Math.floor(y_solution)));
                distance = y_solution_distance;
            } else { // y gridline is nearest (or tied for nearest)
                step_y += move_dy;
                if (step_y >= this.map.length || step_y < 0) break; //keep in map bounds
                texture_coord = Math.abs(!step_dy - (x_solution - Math.floor(x_solution)));
                distance = x_solution_distance;
            }

            //is this grid square a rendered wall? if yes, no need to go on since any walls behind wouldn't be rendered
            if (this.map[step_y][step_x] > 0) {
                wall_height = this.vp_width * (1 / (distance * this.FISH_EYE[column]));
                hits.push({
                    x: step_x,
                    y: step_y,
                    t: Math.floor(this.texture_size * ((door_tile ? 14 : this.map[step_y][step_x]) - texture_coord)),
                    ts: this.texture_size / wall_height,
                    d: distance,
                    s: side,
                    h: wall_height,
                    hh: wall_height >> 1
                });
                break;
            }
        }

        //calculate sprite projections
        for (var i = 0; i < this.cast_sprites.length; i++) {
            var sprite = this.cast_sprites[i],
                //use law of sines to triangulate position (cancel out camera rotation)
                a = ray_angle - sprite.angle_to_camera_rad,
                //how to rotate the sprite (billboarded: this.camera.a_rad, N/S door: Math.PI, E/W door Math.PI_2)
                b = Math.PI_2 + sprite.angle_to_camera_rad - sprite.rotation,
                c_ratio = sprite.distance_to_camera / Math.sin(Math.PI_2 - ray_angle + sprite.rotation),
                texture_coord = Math.sin(a) * c_ratio;
            //texture coord is outside of sprite texture bounds (1 grid unit (-0.5 to 0.5) i.e. 64px)
            if (Math.abs(texture_coord) > sprite.relative_half_width) continue;
            distance = (Math.sin(b) * c_ratio);
            sprite_height = this.vp_width / (distance * this.FISH_EYE[column]);
            hits.push({
                d: distance,
                t: Math.floor(this.texture_size * (sprite.texture + texture_coord + 0.5)),
                ts: this.texture_size / sprite_height,
                h: sprite_height, //wall height
                hh: sprite_height >> 1 //half wall height
            });
        }

        //sort all ray hits by distance, farthest to nearest
        return hits.sort((a, b) => b.d - a.d);
    }


    copyPixels(screen_offset, texture_offset, tint) {
        var texture_alpha = this.texture.getUint8(texture_offset + 3, false) & 255;
        if (!texture_alpha) return; //don't copy over transparent pixels- optimization
        var tx = this.texture.getUint32(texture_offset, true);
        if (tint) {
            //darken the color
            var r = ~~((tx % 256) * 0.60),
                g = ~~(((tx >>> 8) % 256) * 0.60),
                b = ~~(((tx >>> 16) % 256) * 0.60);
            tx = (255 << 24) + (b << 16) + (g << 8) + r;
        }
        this.pixels.setUint32(screen_offset, tx, true);
    }


    draw() {

        for (var column = 0; column < this.vp_width; column++) {
            //wall / sprite casting
            var ray_angle = this.RAY_ANGLES[column] + this.camera.a_rad,
                cos_ra = Math.cos(ray_angle),
                sin_ra = Math.sin(ray_angle),
                hits = this.rayCast(this.camera.grid_x, this.camera.grid_y, ray_angle, cos_ra, sin_ra, column);

            //draw floor / ceiling for this column
            for (var row = this.vp_height_half; row < this.vp_height; row++) {
                var floor_offset = ((row * this.vp_width) + column) << 2,
                    ceiling_offset = (((this.vp_height - row - 1) * this.vp_width) + column) << 2;
                if (!this.floor_casting) {
                    this.pixels.setUint32(floor_offset, this.floor_color, true);
                    this.pixels.setUint32(ceiling_offset, this.ceiling_color, true);
                } else {
                    var ray_length = this.ROW_DISTANCES[row - this.vp_height_half] / Math.sin(Math.PI_2 - this.RAY_ANGLES[column]),
                        //where does this ray hit at that distance
                        gx = this.camera.x + (ray_length * cos_ra),
                        gy = this.camera.y + (ray_length * sin_ra);
                    if (!this.floor_casting || gx < 0 || gy < 0 || gx > this.map[0].length || gy > this.map.length) {
                        //don't render floor outside of map bounds
                        this.pixels.setUint32(floor_offset, this.floor_color, true);
                        this.pixels.setUint32(ceiling_offset, this.ceiling_color, true);
                        continue;
                    }
                    //apply floor / ceiling textures
                    var tx = Math.floor((gx - Math.floor(gx)) * this.texture_size),
                        ty = Math.floor((gy - Math.floor(gy)) * this.texture_size) * TEXTURE.width,
                        floor_texture_offset = (ty + (3 * this.texture_size) + tx) << 2, //TODO: choose floor texture (map)
                        ceiling_texture_offset = (ty + (6 * this.texture_size) + tx) << 2; //TODO: choose ceiling texture (map)
                    this.copyPixels(floor_offset, floor_texture_offset);
                    this.copyPixels(ceiling_offset, ceiling_texture_offset);
                }
            }

            //render ray hits to pixel buffer
            for (var i = 0; i < hits.length; i++) {
                // var wall_center = (this.vp_height_half) + ~~((this.camera.z - 0.5) * hits[i].h);
                //copy to pixel buffer - draw from middle of screen up and down simultaneously
                for (var y = 0; y < hits[i].hh; y++) {
                    var screen_px_bottom = (((this.vp_height_half + y) * this.vp_width) + column) << 2,
                        screen_px_top = (((this.vp_height_half - y - 1) * this.vp_width) + column) << 2;
                    if (screen_px_top < 0) break; //don't draw off screen
                    var texture_dy = (y * hits[i].ts),
                        texture_offset_bottom = ((Math.floor(this.texture_half_size + texture_dy) * TEXTURE.width) + hits[i].t) << 2, //TODO: Math.ceil or Math.floor?
                        texture_offset_top = ((Math.floor(this.texture_half_size - texture_dy) * TEXTURE.width) + hits[i].t) << 2;
                    //draw pixels on draw buffer. if pixel is drawn here, remove its coordinate from pixel draw mask
                    this.copyPixels(screen_px_bottom, texture_offset_bottom, hits[i].s);
                    this.copyPixels(screen_px_top, texture_offset_top, hits[i].s);
                }
            }
        }

        //blit the offscreen pixels to this.context canvas
        this.context.putImageData(this.canvas_pixels, 0, 0);
    }
}