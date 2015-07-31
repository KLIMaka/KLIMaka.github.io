define(["require", "exports", './modules/gl', './modules/textures', './modules/materials', './libs/mathutils', './modules/meshbuilder', './modules/controller2d', './modules/shaders'], function(require, exports, GL, TEX, MAT, MU, mb, ctrl, shaders) {
    var w = 800;
    var h = 600;

    function buildScreen(gl, shader, tex, pal) {
        var builder = new mb.MeshBuilderConstructor(4).buffer('aPos', Float32Array, gl.FLOAT, 2).buffer('aTc', Float32Array, gl.FLOAT, 2).index(Uint16Array, gl.UNSIGNED_SHORT).build();

        builder.start(mb.QUADS).attr('aTc', [0, 0]).vtx('aPos', [0, 0]).attr('aTc', [1, 0]).vtx('aPos', [16, 0]).attr('aTc', [1, 1]).vtx('aPos', [16, 16]).attr('aTc', [0, 1]).vtx('aPos', [0, 16]).end();
        return builder.build(gl, MAT.create(shader, { base: tex, pal: pal }));
    }

    function createImage() {
        var img = new Uint8Array(16 * 16);
        for (var i = 0; i < 256; i++) {
            img[i] = i;
        }
        return img;
    }

    function createPal() {
        var pal = new Uint8Array(256 * 3);
        for (var i = 0; i < 256; i++) {
            var idx = i * 3;
            pal[idx + 0] = MU.int(Math.random() * 256);
            pal[idx + 1] = MU.int(Math.random() * 256);
            pal[idx + 2] = MU.int(Math.random() * 256);
        }
        return pal;
    }

    var pixel = new Uint8Array(4);
    var gl = GL.createContext(w, h);
    var control = ctrl.create(gl);
    var tex = TEX.createDrawTexture(16, 16, gl, createImage(), gl.LUMINANCE, 1);
    var pal = TEX.createTexture(256, 1, gl, createPal(), gl.RGB, 3);
    var screen = buildScreen(gl, shaders.createShader(gl, 'resources/shaders/indexed'), tex, pal);
    control.setPos(16 / 2, 16 / 2);

    gl.canvas.onmousemove = function (e) {
        var pos = control.unproject(e.layerX, e.layerY);
        var x = MU.int(pos[0]);
        var y = MU.int(pos[1]);
        if (e.button == 1)
            tex.putPixel(x, y, pixel, gl);
    };

    var binder = GL.binder([
        ['MVP', GL.mat4Setter, function () {
                return control.getMatrix();
            }]
    ]);

    GL.animate(gl, function (gl, time) {
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        GL.draw(gl, [screen], binder);
    });
});
