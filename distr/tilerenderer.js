define(["require", "exports", 'modules/gl', 'modules/meshbuilder', './modules/controller2d', './modules/shaders', './modules/batcher', './libs/asyncbarrier', './libs/imgutils', './modules/textures', './modules/pixel/utils'], function(require, exports, GL, MB, C2D, SHADERS, BATCHER, AB, IU, TEX, PU) {
    var ab = AB.create(function (results) {
        return start(results);
    });
    IU.loadImage('resources/img/font.png', ab.callback('font'));
    ab.wait();

    var Atlas = (function () {
        function Atlas(gl, img, w, h, sw, sh) {
            this.w = w;
            this.h = h;
            this.sw = sw;
            this.sh = sh;
            this.tex = TEX.createTexture(w, h, gl, img);
        }
        return Atlas;
    })();

    var Plane = (function () {
        function Plane(gl, w, h, atlas) {
            this.w = w;
            this.h = h;
            this.atlas = atlas;
            this.data = new Uint8Array(w * h);
            this.tex = TEX.createTexture(w, h, gl, this.data, gl.LUMINANCE, 1);
        }
        return Plane;
    })();

    function start(res) {
        var gl = GL.createContext(600, 600, { alpha: false });
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);

        var w = 32;
        var h = 32;

        var pos = new Float32Array([0, 0, 0, h * 8, w * 8, h * 8, w * 8, 0]);
        var tc = new Float32Array([0, 0, 0, 1, 1, 1, 1, 0]);

        var vertexBufs = {};
        vertexBufs.aPos = MB.wrap(gl, pos, 2, gl.STATIC_DRAW);
        vertexBufs.aTc = MB.wrap(gl, tc, 2, gl.STATIC_DRAW);
        var indexBuffer = MB.genIndexBuffer(gl, 1, [0, 1, 2, 0, 2, 3]);
        var font = TEX.createTexture(128, 128, gl, res.font);
        var map = new Uint8Array(w * h);
        PU.printString(0, 0, w, 4, map, "Foo\n#$% Baz !!! ");
        PU.printString(10, 10, w, 22, map, "\1\2\3 Hello folks!!!");
        var mapTex = TEX.createTexture(w, h, gl, map, gl.LUMINANCE, 1);

        var control = C2D.create(gl);
        control.setPos(150, 150);
        control.setUnitsPerPixel(0.5);
        var shader = SHADERS.createShader(gl, 'resources/shaders/tile');
        var MVP = control.getMatrix();
        var struct = [gl.TRIANGLES, 6, 0];

        var cmds = [
            BATCHER.shader, shader,
            BATCHER.vertexBuffers, vertexBufs,
            BATCHER.indexBuffer, indexBuffer,
            BATCHER.uniforms, [
                'MVP', BATCHER.setters.mat4, MVP,
                'CELL', BATCHER.setters.vec2, [w, h],
                'TILE', BATCHER.setters.vec2, [16, 16]
            ],
            BATCHER.sampler, [0, 'tiles', font.get()],
            BATCHER.sampler, [1, 'map', mapTex.get()],
            BATCHER.drawCall, struct
        ];

        GL.animate(gl, function (gl, dt) {
            gl.clearColor(0.1, 0.1, 0.1, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            BATCHER.exec(cmds, gl);
        });
    }
});
