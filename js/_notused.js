//floor casting code
this.vp_ratio = this.vp_width / this.vp_height;

this.ROW_DISTANCES = [];
for (var row = this.vp_height_half; row < this.vp_height; row++) {
    this.ROW_DISTANCES.push((this.vp_height_half / (row - this.vp_height_half)) * this.vp_ratio);
}

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
