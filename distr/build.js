define(["require", "exports", './modules/gl', './modules/shaders', './libs/getter', './libs/dataviewstream', './libs/mathutils', './modules/controller3d', './modules/engines/build/bloodloader', './modules/engines/build/builder', './modules/engines/build/utils', './modules/engines/build/art', './modules/pixelprovider', './modules/textures', './libs/config', './modules/engines/build/rff', './modules/ui/ui', './libs/imgutils'], function(require, exports, GL, shaders, getter, data, MU, controller, bloodloader, builder, BU, ART, pixel, TEX, CFG, RFF, UI, IU) {
    var rffFile = 'resources/engines/blood/blood.rff';
    var cfgFile = 'build.cfg';
    var selectPass = false;

    var Mat = (function () {
        function Mat(baseShader, selectShader, tex) {
            this.baseShader = baseShader;
            this.selectShader = selectShader;
            this.tex = tex;
        }
        Mat.prototype.getShader = function () {
            return selectPass ? this.selectShader : this.baseShader;
        };
        Mat.prototype.getTexture = function (sampler) {
            return this.tex[sampler];
        };
        return Mat;
    })();

    var MF = (function () {
        function MF(baseShader, selectShader, spriteShader, spriteSelectShader) {
            this.baseShader = baseShader;
            this.selectShader = selectShader;
            this.spriteShader = spriteShader;
            this.spriteSelectShader = spriteSelectShader;
        }
        MF.prototype.solid = function (tex) {
            return new Mat(this.baseShader, this.selectShader, { base: tex });
        };

        MF.prototype.sprite = function (tex) {
            return new Mat(this.spriteShader, this.spriteSelectShader, { base: tex });
        };
        return MF;
    })();

    var TP = (function () {
        function TP(arts, pal, gl) {
            this.arts = arts;
            this.pal = pal;
            this.gl = gl;
            this.textures = [];
        }
        TP.prototype.get = function (picnum) {
            var tex = this.textures[picnum];
            if (tex != undefined)
                return tex;

            var info = this.arts.getInfo(picnum);
            var arr = new Uint8Array(info.w * info.h * 4);
            var pp = pixel.axisSwap(pixel.fromPal(info.img, this.pal, info.w, info.h, 255, 255));
            pp.render(arr);
            tex = new TEX.TextureImpl(pp.getWidth(), pp.getHeight(), this.gl, arr);

            this.textures[picnum] = tex;
            return tex;
        };

        TP.prototype.getInfo = function (picnum) {
            var info = this.arts.getInfo(picnum);
            return info.anum;
        };
        return TP;
    })();

    function drawCompass(canvas, eye) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        var r = Math.min(w, h) / 2 - 1;
        var x = r + eye[0] * r;
        var y = r + eye[2] * r;
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.fillRect(0, 0, w, h);
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
    }

    function render(cfg, map, artFiles, pal) {
        var gl = GL.createContext(cfg.width, cfg.height, { alpha: false, antialias: false });
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        var info = {
            'X:': 0,
            'Y:': 0,
            'Batches:': 0,
            'Sector:': 0
        };

        var panel = UI.panel('Info');
        var props = UI.props(info);
        panel.append(props);
        var compass = IU.createEmptyCanvas(50, 50);
        panel.append(new UI.Element(compass));
        document.body.appendChild(panel.elem());

        var board = bloodloader.loadBloodMap(new data.DataViewStream(map, true));
        var processor = new builder.BoardProcessor(board);
        var baseShader = shaders.createShader(gl, 'resources/shaders/build_base');
        var selectShader = shaders.createShader(gl, 'resources/shaders/select');
        var spriteShader = shaders.createShader(gl, 'resources/shaders/build_sprite');
        var spriteSelectShader = shaders.createShader(gl, 'resources/shaders/select_sprite');
        var mf = new MF(baseShader, selectShader, spriteShader, spriteSelectShader);
        var tp = new TP(artFiles, pal, gl);
        processor.build(gl, tp, mf);

        var control = new controller.Controller3D(gl);
        var playerstart = BU.getPlayerStart(board);
        var ms = new BU.MoveStruct();
        ms.sec = playerstart.sectnum;
        ms.x = playerstart.x;
        ms.y = playerstart.y;
        ms.z = playerstart.z;
        control.getCamera().setPosXYZ(ms.x, ms.z / -16 + 1024, ms.y);

        var activeIdx = 0;

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
        binder.addResolver('activeIdx', GL.int1Setter, function () {
            return activeIdx;
        });

        GL.animate(gl, function (gl, time) {
            if (cfg.select) {
                selectPass = true;
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                var models = processor.get(ms, control.getCamera().forward());
                GL.draw(gl, models, binder);

                var id = GL.readId(gl, control.getX(), control.getY());
                activeIdx = id;
                if (control.isClick()) {
                    console.log(processor.getByIdx(activeIdx));
                }
            }

            selectPass = false;
            gl.clearColor(0.1, 0.3, 0.1, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            var pos = control.getCamera().getPos();
            ms.x = MU.int(pos[0]);
            ms.y = MU.int(pos[2]);

            var models = processor.get(ms, control.getCamera().forward());

            GL.draw(gl, models, binder);

            info['Batches:'] = models.length;
            info['Sector:'] = ms.sec;
            info['X:'] = ms.x;
            info['Y:'] = ms.y;
            drawCompass(compass, control.getCamera().forward());

            control.move(time);
        });

        gl.canvas.oncontextmenu = function () {
            return false;
        };
    }

    var path = 'resources/engines/blood/';
    var artNames = [];
    for (var a = 0; a < 18; a++) {
        artNames[a] = path + 'TILES0' + ("00" + a).slice(-2) + '.ART';
        getter.loader.load(artNames[a]);
    }

    getter.loader.loadString(cfgFile).load(rffFile).finish(function () {
        var cfg = CFG.create(getter.getString(cfgFile));
        var rff = RFF.create(getter.get(rffFile));
        var pal = rff.get('BLOOD.PAL');
        var arts = [];
        for (var a = 0; a < 18; a++)
            arts.push(ART.create(new data.DataViewStream(getter.get(artNames[a]), true)));
        var artFiles = ART.createArts(arts);

        var map = rff.get(cfg.map).buffer;
        render(cfg, map, artFiles, pal);
    });
});