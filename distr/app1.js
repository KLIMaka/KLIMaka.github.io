define(["require", "exports", './modules/gl', './modules/shaders', './modules/meshbuilder', './libs/getter', './modules/engines/build/loader', './modules/engines/build/builder', './libs/dataviewstream', './modules/controller3d', './modules/engines/build/utils', 'libs_js/glmatrix', './modules/textures', './libs/mathutils', './libs/vecmath', './modules/texcoordpacker', './modules/rasterizer'], function(require, exports, GL, shaders, mb, getter, build, builder_, data, controller, buildutils, GLM, TEX, MU, VEC, tcpack, raster) {
    var w = 600;
    var h = 400;

    var base = null;
    var Mat = (function () {
        function Mat(shader, tex) {
            if (typeof tex === "undefined") { tex = {}; }
            this.shader = shader;
            this.tex = tex;
        }
        Mat.prototype.getShader = function () {
            return this.shader;
        };
        Mat.prototype.getTexture = function (sampler) {
            return (sampler == 'base' && this.tex[sampler] == undefined) ? base : this.tex[sampler];
        };
        return Mat;
    })();

    var SCALE = -16;
    function buildSprite(sprite, gl, shader) {
        var builder = new mb.MeshBuilderConstructor(4).buffer('pos', Float32Array, gl.FLOAT, 3).buffer('norm', Float32Array, gl.FLOAT, 2).index(Uint16Array, gl.UNSIGNED_SHORT).build();

        var x = sprite.x;
        var y = sprite.y;
        var z = sprite.z / SCALE;

        builder.start(mb.QUADS).attr('norm', [-1, 1]).vtx('pos', [x, z, y]).attr('norm', [1, 1]).vtx('pos', [x, z, y]).attr('norm', [1, -1]).vtx('pos', [x, z, y]).attr('norm', [-1, -1]).vtx('pos', [x, z, y]).end();
        return builder.build(gl, new Mat(shader));
    }

    function buildScreen(gl, shader, tex) {
        var builder = new mb.MeshBuilderConstructor(4).buffer('pos', Float32Array, gl.FLOAT, 2).buffer('norm', Float32Array, gl.FLOAT, 2).index(Uint16Array, gl.UNSIGNED_SHORT).build();

        builder.start(mb.QUADS).attr('norm', [0, 0]).vtx('pos', [0, 0]).attr('norm', [1, 0]).vtx('pos', [128, 0]).attr('norm', [1, 1]).vtx('pos', [128, 128]).attr('norm', [0, 1]).vtx('pos', [0, 128]).end();
        return builder.build(gl, new Mat(shader, { texture: tex }));
    }

    var MF = (function () {
        function MF(mat) {
            this.mat = mat;
        }
        MF.prototype.solid = function (tex) {
            return this.mat;
        };
        MF.prototype.sprite = function (tex) {
            return this.mat;
        };
        return MF;
    })();

    var TP = (function () {
        function TP() {
            this.tex = new TEX.TextureStub(1, 1);
        }
        TP.prototype.get = function (picnum) {
            return this.tex;
        };
        return TP;
    })();

    var traceContext = {
        MVP: GLM.mat4.create(),
        MV: GLM.mat4.create(),
        P: GLM.mat4.perspective(GLM.mat4.create(), MU.deg2rad(90), 1, 1, 0xFFFF),
        pos: null,
        dir: null,
        ms: new buildutils.MoveStruct(),
        processor: null,
        light: null
    };

    var traceBinder = new GL.UniformBinder();
    traceBinder.addResolver('MVP', GL.mat4Setter, function () {
        return traceContext.MVP;
    });
    traceBinder.addResolver('MV', GL.mat4Setter, function () {
        return traceContext.MV;
    });
    traceBinder.addResolver('P', GL.mat4Setter, function () {
        return traceContext.P;
    });
    traceBinder.addResolver('eyepos', GL.vec3Setter, function () {
        return traceContext.pos;
    });
    traceBinder.addResolver('eyedir', GL.vec3Setter, function () {
        return traceContext.dir;
    });
    traceBinder.addResolver('size', GL.float1Setter, function () {
        return 100;
    });

    function trace(gl) {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var models = traceContext.processor.get(traceContext.ms, traceContext.dir);
        GL.draw(gl, models, traceBinder);
        GL.draw(gl, [traceContext.light], traceBinder);
    }

    var up_ = [0, 1, 0];
    var right_ = [1, 0, 0];
    function rightVector(dir) {
        var right = GLM.vec3.cross(GLM.vec3.create(), dir, up_);
        if (GLM.vec3.len(right) < 1e-10)
            right = GLM.vec3.cross(right, dir, right_);
        return right;
    }

    function upVector(dir, right) {
        return GLM.vec3.cross(GLM.vec3.create(), dir, right);
    }

    function gather(gl, rt, pos, dir, up) {
        var center = GLM.vec3.add(GLM.vec3.create(), pos, dir);
        var P = traceContext.P;
        var MV = GLM.mat4.lookAt(traceContext.MV, pos, center, up);
        var MVP = GLM.mat4.mul(traceContext.MVP, P, MV);

        var data = rt.drawTo(gl, trace);
        var sum = 0;
        var count = 0;
        for (var i = 0; i < rt.getWidth() * rt.getHeight() * 4; i += 4) {
            sum += data[i];
            if (data[i] != 0)
                count++;
        }
        return [sum, count];
    }

    var pixel = [0, 0, 0, 255];
    function radiosity(gl, rt, pos, dir) {
        traceContext.pos = pos;
        traceContext.dir = dir;
        traceContext.ms.x = pos[0];
        traceContext.ms.y = pos[2];

        var right = rightVector(dir);
        var up = upVector(dir, right);
        var right_ = GLM.vec3.negate(GLM.vec3.create(), right);
        var up_ = GLM.vec3.negate(GLM.vec3.create(), up);

        var setup = [
            [dir, up],
            [right, dir],
            [right_, dir],
            [up, dir],
            [up_, dir]
        ];

        var g = [0, 0];
        for (var i = 0; i < setup.length; i++) {
            var s = setup[i];
            var res = gather(gl, rt, pos, s[0], s[1]);
            g[0] += res[0];
            g[1] += res[1];
        }
        var c = g[1] == 0 ? 0 : Math.min(g[0] / g[1], 255);
        pixel[0] = pixel[1] = pixel[2] = c;
        return pixel;
    }

    function processLM(lm, w, h, lm1) {
        if (typeof lm1 === "undefined") { lm1 = null; }
        var ret = new Uint8Array(w * h * 4);
        var dw = 4;
        var dh = w * 4;
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var idx = (y * w + x) * 4;
                var c = (lm[idx] + (lm1 == null ? 0 : lm1[idx])) / (lm1 == null ? 1 : 2);
                var a = lm[idx + 3];
                if (a == 0) {
                    var sum = 0;
                    var count = 0;
                    if (x > 0) {
                        sum += lm[idx - dw];
                        count += lm[idx - dw + 3] != 0 ? 1 : 0;
                    }
                    if (x < w - 1) {
                        sum += lm[idx + dw];
                        count += lm[idx + dw + 3] != 0 ? 1 : 0;
                    }
                    if (y > 0) {
                        sum += lm[idx - dh];
                        count += lm[idx - dh + 3] != 0 ? 1 : 0;
                    }
                    if (y < h - 1) {
                        sum += lm[idx + dh];
                        count += lm[idx + dh + 3] != 0 ? 1 : 0;
                    }
                    if (x > 0 && y > 0) {
                        sum += lm[idx - dw - dh];
                        count += lm[idx - dw - dh + 3] != 0 ? 1 : 0;
                    }
                    if (x > 0 && y < h - 1) {
                        sum += lm[idx - dw + dh];
                        count += lm[idx - dw + dh + 3] != 0 ? 1 : 0;
                    }
                    if (x < w - 1 && y > 0) {
                        sum += lm[idx + dw - dh];
                        count += lm[idx + dw - dh + 3] != 0 ? 1 : 0;
                    }
                    if (x < w - 1 && y < h - 1) {
                        sum += lm[idx + dw + dh];
                        count += lm[idx + dw + dh + 3] != 0 ? 1 : 0;
                    }
                    c = sum / count;
                }
                ret[idx] = c;
                ret[idx + 1] = c;
                ret[idx + 2] = c;
                ret[idx + 3] = a == 0 ? 0 : 255;
            }
        }
        return ret;
    }

    var S = 4096 * 5;
    var R = 128;
    var MyBoardBuilder = (function () {
        function MyBoardBuilder() {
            this.packer = new tcpack.Packer(S, S, S / R, S / R);
            this.buf = [];
            this.idxs = [];
            var gl = WebGLRenderingContext;
            this.builder = new mb.MeshBuilderConstructor().buffer('aPos', Float32Array, gl.FLOAT, 3).buffer('aNorm', Float32Array, gl.FLOAT, 3).buffer('aIdx', Uint8Array, gl.UNSIGNED_BYTE, 4, true).buffer('aTc', Float32Array, gl.FLOAT, 2).buffer('aLMTc', Float32Array, gl.FLOAT, 2).buffer('aShade', Int8Array, gl.BYTE, 1).index(Uint16Array, gl.UNSIGNED_SHORT).build();
        }
        MyBoardBuilder.prototype.addFace = function (type, verts, tcs, idx, shade) {
            var proj = VEC.project3d(verts);
            var hull = tcpack.getHull(proj);
            var r = this.packer.pack(new tcpack.Rect(hull.maxx - hull.minx, hull.maxy - hull.miny));
            if (r == null)
                throw new Error("Can not pack face");
            var lmtcs = [];
            for (var i = 0; i < verts.length; i++) {
                var u = (r.xoff + proj[i][0] - hull.minx) / S;
                var v = (r.yoff + proj[i][1] - hull.miny) / S;
                lmtcs.push([u, v]);
            }
            var normal = VEC.polygonNormal(verts);

            this.builder.start(type).attr('aNorm', normal).attr('aIdx', MU.int2vec4(idx)).attr('aShade', [shade]);
            for (var i = 0; i < verts.length; i++) {
                this.builder.attr('aTc', tcs[i]).attr('aLMTc', lmtcs[i]).vtx('aPos', verts[i]);

                this.buf.push(lmtcs[i][0]);
                this.buf.push(lmtcs[i][1]);
                this.buf.push(verts[i][0]);
                this.buf.push(verts[i][1]);
                this.buf.push(verts[i][2]);
                this.buf.push(normal[0]);
                this.buf.push(normal[1]);
                this.buf.push(normal[2]);
            }
            this.builder.end();
        };

        MyBoardBuilder.prototype.getOffset = function () {
            return this.builder.offset() * 2;
        };

        MyBoardBuilder.prototype.build = function (gl) {
            return this.builder.build(gl, null);
        };

        MyBoardBuilder.prototype.bake = function (gl, w, h) {
            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d');
            var img = ctx.getImageData(0, 0, w, h);
            var RT = new TEX.RenderTexture(128, 128, gl);
            var rast = new raster.Rasterizer(img, function (attrs) {
                return radiosity(gl, RT, [attrs[2], attrs[3], attrs[4]], [attrs[5], attrs[6], attrs[7]]);
            });
            rast.bindAttributes(0, this.buf, 8);
            rast.clear([0, 0, 0, 0], 0);
            rast.drawTriangles(this.builder.idxbuf().buf(), 0, this.builder.idxbuf().length());
            ctx.putImageData(img, 0, 0);
            return new Uint8Array(img.data);
        };
        return MyBoardBuilder;
    })();

    var MAP = 'resources/buildmaps/cube.map';

    getter.loader.load(MAP).loadString('resources/shaders/trace_base.vsh').loadString('resources/shaders/trace_base.fsh').loadString('resources/shaders/trace_sprite.vsh').loadString('resources/shaders/trace_sprite.fsh').finish(function () {
        var gl = GL.createContext(w, h);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        var board = build.loadBuildMap(new data.DataViewStream(getter.get(MAP), true));

        base = new TEX.DrawTexture(1, 1, gl);
        var lm = new TEX.DrawTexture(R, R, gl);
        var trace_baseShader = shaders.createShaderFromSrc(gl, getter.getString('resources/shaders/trace_base.vsh'), getter.getString('resources/shaders/trace_base.fsh'));
        var trace_spriteShader = shaders.createShaderFromSrc(gl, getter.getString('resources/shaders/trace_sprite.vsh'), getter.getString('resources/shaders/trace_sprite.fsh'));
        var builder = new MyBoardBuilder();
        var processor = new builder_.BoardProcessor(board).build(gl, new TP(), new MF(new Mat(trace_baseShader, { lm: lm })), builder);
        var control = new controller.Controller3D(gl);
        var light = buildSprite(board.sprites[0], gl, trace_spriteShader);

        traceContext.processor = processor;
        traceContext.light = light;
        var lmdata = processLM(builder.bake(gl, R, R), R, R);
        lm.putSubImage(0, 0, R, R, lmdata, gl);

        var base_shader = shaders.createShader(gl, 'resources/shaders/base');
        builder = new MyBoardBuilder();
        var processor1 = new builder_.BoardProcessor(board).build(gl, new TP(), new MF(new Mat(base_shader, { lm: lm })), builder);
        var screen = buildScreen(gl, shaders.createShader(gl, 'resources/shaders/base1'), lm);

        var binder = new GL.UniformBinder();
        binder.addResolver('MVP', GL.mat4Setter, function () {
            return control.getMatrix();
        });
        binder.addResolver('MV', GL.mat4Setter, function () {
            return control.getModelViewMatrix();
        });
        binder.addResolver('P', GL.mat4Setter, function () {
            return control.getProjectionMatrix();
        });
        binder.addResolver('eyepos', GL.vec3Setter, function () {
            return control.getCamera().getPos();
        });
        binder.addResolver('eyedir', GL.vec3Setter, function () {
            return control.getCamera().forward();
        });
        binder.addResolver('size', GL.float1Setter, function () {
            return 10;
        });

        var screenBinder = new GL.UniformBinder();
        var screenMat = GLM.mat4.ortho(GLM.mat4.create(), 0, w, h, 0, -0xFFFF, 0xFFFF);
        screenBinder.addResolver('MVP', GL.mat4Setter, function () {
            return screenMat;
        });

        var ms = new buildutils.MoveStruct();
        GL.animate(gl, function (gl, time) {
            control.move(time);
            ms.x = control.getCamera().getPos()[0];
            ms.y = control.getCamera().getPos()[2];

            gl.clearColor(0.1, 0.3, 0.1, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            var models = processor1.get(ms, control.getCamera().forward());
            GL.draw(gl, models, binder);
            GL.draw(gl, [light], binder);
            GL.draw(gl, [screen], screenBinder);
        });

        gl.canvas.oncontextmenu = function () {
            return false;
        };
    });
});
