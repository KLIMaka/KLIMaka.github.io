define(["require", "exports", './modules/gl', './modules/textures', './libs/mathutils', './modules/controller2d', './modules/batcher', './modules/shaders', './modules/meshbuilder', './modules/ui/ui', './modules/pixel/canvas'], function (require, exports, GL, TEX, MU, ctrl, BATCHER, SHADERS, MB, UI, CANV) {
    var w = 800;
    var h = 600;
    var cw = w;
    var ch = h;
    function createImage() {
        var img = new Uint8Array(cw * ch);
        return img;
    }
    function createPal() {
        var pal = new Uint8Array(256 * 3);
        for (var i = 0; i < 256; i++) {
            var idx = i * 3;
            pal[idx + 0] = i;
            pal[idx + 1] = i;
            pal[idx + 2] = i;
        }
        return pal;
    }
    var refPalette = createPal();
    var pixel = 255;
    function cssColor(idx) {
        var r = ("0" + refPalette[idx * 3 + 0].toString(16)).slice(-2);
        var g = ("0" + refPalette[idx * 3 + 1].toString(16)).slice(-2);
        var b = ("0" + refPalette[idx * 3 + 2].toString(16)).slice(-2);
        return '#' + r + g + b;
    }
    var gl = GL.createContext(w, h);
    var info = {
        'X:': 0,
        'Y:': 0,
        'Color:': 0
    };
    var panel = UI.panel('Info');
    panel.pos('800', '0');
    var props = UI.props(['X:', 'Y:', 'Color:']);
    panel.append(props);
    document.body.appendChild(panel.elem());
    var palette = UI.div('frame');
    palette.pos('0', '600');
    var colors = UI.table();
    var colorProbes = [];
    for (var row = 0; row < 8; row++) {
        var colorRow = [];
        for (var col = 0; col < 32; col++) {
            var idx = row * 32 + col;
            var c = UI.div('pal_color')
                .size('16', '16')
                .css('background-color', cssColor(idx));
            c.elem().onclick = (function (idx) { return function (e) { setColor(idx); }; })(idx);
            colorRow.push(c);
            colorProbes.push(c);
        }
        colors.row(colorRow);
    }
    palette.append(colors);
    document.body.appendChild(palette.elem());
    var picker = UI.div('frame')
        .pos('646', '600')
        .size('162', '162');
    var primary = UI.div('primary')
        .size('100', '100')
        .pos('10', '10')
        .css('background-color', '#999')
        .css('position', 'absolute');
    picker.append(primary);
    var colorPicker = UI.tag('input')
        .attr('type', 'color')
        .pos('10', '120')
        .css('position', 'absolute');
    colorPicker.elem().onchange = function (e) {
        var value = colorPicker.elem().value;
        var rgba = MU.int2vec4(parseInt(value.substr(1), 16));
        var idx = pixel;
        refPalette[idx * 3 + 0] = rgba[2];
        refPalette[idx * 3 + 1] = rgba[1];
        refPalette[idx * 3 + 2] = rgba[0];
        pal.reload(gl);
        var probe = colorProbes[idx];
        probe.css('background-color', cssColor(idx));
        setColor(idx);
    };
    picker.append(colorPicker);
    document.body.appendChild(picker.elem());
    function setColor(col) {
        var prevCol = pixel;
        pixel = col;
        primary.css('background-color', cssColor(col));
        colorPicker.elem().value = cssColor(col);
        info['Color:'] = col;
        props.refresh(info);
    }
    function genPut(buf) {
        return function (x, y) {
            if (x >= 0 && y >= 0 && x < cw && y < ch) {
                buf[y * cw + x] = pixel;
                buf[y * cw + cw - x] = pixel;
                buf[(ch - y) * cw + x] = pixel;
                buf[(ch - y) * cw + cw - x] = pixel;
            }
        };
    }
    var over = new Uint8Array(cw * ch);
    var overPut = genPut(over);
    function redrawOverlay(x, y) {
        var ix = MU.int(x);
        var iy = MU.int(y);
        over.fill(0, 0, cw * ch);
        if (x >= 0 && y >= 0 && x < cw && y < ch)
            overPut(ix, iy);
        // var cx = cw/2-x;
        // var cy = ch/2-y;
        // var abs = Math.abs;
        // var r = Math.sqrt(cx*cx+cy*cy);
        // var k = abs(abs(cx) - abs(cy)) / r;
        // CANV.circle(overPut, cw/2, ch/2, r|0, -20+40*k);
        // CANV.line(over, cw, ch, cw/2, ch/2, x, y, 12);
    }
    var options = { filter: gl.NEAREST, repeat: gl.CLAMP_TO_EDGE };
    var img = createImage();
    var control = ctrl.create(gl);
    var tex = TEX.createDrawTexture(cw, ch, gl, options, img, gl.LUMINANCE, 1);
    var overlay = TEX.createDrawTexture(cw, ch, gl, options, over, gl.LUMINANCE, 1);
    var pal = TEX.createTexture(256, 1, gl, options, refPalette, gl.RGB, 3);
    control.setPos(cw / 2, ch / 2);
    var put = genPut(img);
    var px = 0;
    var py = 0;
    gl.canvas.onmousemove = function (e) {
        var pos = control.unproject(e.clientX, e.clientY);
        var x = pos[0] < 0 ? pos[0] - 1 : pos[0];
        var y = pos[1] < 0 ? pos[1] - 1 : pos[1];
        var ix = MU.int(x);
        var iy = MU.int(y);
        redrawOverlay(x, y);
        overlay.reload(gl);
        if ((e.buttons & 1) == 1) {
            CANV.line(put, ix, iy, px, py);
            tex.reload(gl);
        }
        px = ix;
        py = iy;
        info['X:'] = ix;
        info['Y:'] = iy;
        props.refresh(info);
    };
    gl.canvas.addEventListener("touchmove", function (e) {
        var touch = e.touches[0];
        var pos = control.unproject(touch.clientX, touch.clientY);
        var x = pos[0] < 0 ? pos[0] - 1 : pos[0];
        var y = pos[1] < 0 ? pos[1] - 1 : pos[1];
        var ix = MU.int(x);
        var iy = MU.int(y);
        redrawOverlay(x, y);
        overlay.reload(gl);
        CANV.line(put, ix, iy, px, py);
        tex.reload(gl);
        px = ix;
        py = iy;
        info['X:'] = ix;
        info['Y:'] = iy;
        props.refresh(info);
    });
    gl.canvas.addEventListener("touchstart", function (e) {
        var touch = e.touches[0];
        var pos = control.unproject(touch.clientX, touch.clientY);
        var x = pos[0] < 0 ? pos[0] - 1 : pos[0];
        var y = pos[1] < 0 ? pos[1] - 1 : pos[1];
        var ix = MU.int(x);
        var iy = MU.int(y);
        px = ix;
        py = iy;
    });
    document.onkeypress = function (e) {
        if (e.key == '`') {
            control.setPos(cw / 2, ch / 2);
            control.setUnitsPerPixel(1);
        }
    };
    var pos = new Float32Array([0, 0, cw, 0, cw, ch, 0, ch]);
    var tc = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    var aPos = MB.wrap(gl, pos, 2, gl.DYNAMIC_DRAW);
    var aTc = MB.wrap(gl, tc, 2, gl.DYNAMIC_DRAW);
    var vertexBufs = { 'aPos': aPos, 'aTc': aTc };
    var indexBuffer = MB.genIndexBuffer(gl, 4, [0, 1, 2, 0, 2, 3]);
    var shader = SHADERS.createShader(gl, 'resources/shaders/indexed');
    var uniforms = ['MVP', BATCHER.setters.mat4, control.getMatrix()];
    var cmds = [
        BATCHER.clear, [0.1, 0.1, 0.1, 1.0],
        BATCHER.shader, shader,
        BATCHER.vertexBuffers, vertexBufs,
        BATCHER.indexBuffer, indexBuffer,
        BATCHER.uniforms, uniforms,
        BATCHER.sampler, [0, 'base', tex.get()],
        BATCHER.sampler, [1, 'pal', pal.get()],
        BATCHER.sampler, [2, 'overlay', overlay.get()],
        BATCHER.drawCall, [gl.TRIANGLES, 6, 0]
    ];
    GL.animate(gl, function (gl, time) {
        uniforms[2] = control.getMatrix();
        BATCHER.exec(cmds, gl);
    });
});
