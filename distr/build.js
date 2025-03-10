define(["require", "exports", "./modules/gl", "./libs/getter", "./libs/dataviewstream", "./libs/mathutils", "./modules/controller3d", "./modules/engines/build/bloodloader", "./modules/engines/build/utils", "./modules/engines/build/art", "./modules/textures", "./libs/config", "./modules/engines/build/rff", "./modules/ui/ui", "./libs/imgutils", "./libs/browser", "./modules/engines/build/gl/boardrenderer", "./modules/profiler"], function (require, exports, GL, getter, data, MU, controller, bloodloader, BU, ART, TEX, CFG, RFF, UI, IU, browser, RENDERER, PROFILE) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var rffFile = 'resources/engines/blood/BLOOD.RFF';
    var cfgFile = 'build.cfg';
    class BuildArtProvider {
        constructor(arts, pal, PLUs, gl) {
            this.arts = arts;
            this.pal = pal;
            this.PLUs = PLUs;
            this.gl = gl;
            this.textures = [];
            this.infos = [];
            this.palTexture = null;
            this.pluTexture = null;
        }
        get(picnum) {
            var tex = this.textures[picnum];
            if (tex != undefined)
                return tex;
            var info = this.arts.getInfo(picnum);
            if (info.h <= 0 || info.w <= 0)
                return this.get(0);
            var arr = this.axisSwap(info.img, info.h, info.w);
            var repeat = WebGLRenderingContext.CLAMP_TO_EDGE;
            var filter = WebGLRenderingContext.NEAREST;
            tex = TEX.createTexture(info.w, info.h, this.gl, { filter: filter, repeat: repeat }, arr, this.gl.LUMINANCE);
            this.textures[picnum] = tex;
            return tex;
        }
        axisSwap(data, w, h) {
            var result = new Uint8Array(w * h);
            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    result[x * h + y] = data[y * w + x];
                }
            }
            return result;
        }
        getInfo(picnum) {
            var info = this.infos[picnum];
            if (info == undefined) {
                info = this.arts.getInfo(picnum);
                this.infos[picnum] = info;
            }
            return info;
        }
        getPalTexture() {
            if (this.palTexture == null)
                this.palTexture = TEX.createTexture(256, 1, this.gl, { filter: this.gl.NEAREST }, this.pal, this.gl.RGB, 3);
            return this.palTexture;
        }
        getPluTexture() {
            if (this.pluTexture == null) {
                var tex = new Uint8Array(256 * 64 * this.PLUs.length);
                for (var i = 0; i < this.PLUs.length; i++) {
                    tex.set(this.PLUs[i], 256 * 64 * i);
                }
                this.pluTexture = TEX.createTexture(256, 64 * this.PLUs.length, this.gl, { filter: this.gl.NEAREST }, tex, this.gl.LUMINANCE);
            }
            return this.pluTexture;
        }
    }
    function drawCompass(canvas, eye) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        var r = Math.min(w, h) / 2 - 1;
        var x = r + eye[0] * r;
        var y = r + eye[2] * r;
        var z = r - eye[1] * r;
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
        ctx.beginPath();
        ctx.arc(w, z, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
    }
    var loadPanel = UI.verticalPanel('loadPanel');
    document.body.appendChild(loadPanel.elem());
    var loaders = {};
    var index = [];
    function progress(fname) {
        return (p) => {
            var loader = loaders[fname];
            if (loader == undefined) {
                loader = UI.progress(fname);
                loadPanel.add(loader);
                loaders[fname] = loader;
            }
            loader.setValue(p * 100);
            if (p == 1)
                loader.css('display', 'none');
        };
    }
    function createMoveStruct(board, control) {
        var playerstart = BU.getPlayerStart(board);
        var ms = new BU.MoveStruct();
        ms.sec = playerstart.sectnum;
        ms.x = playerstart.x;
        ms.y = playerstart.y;
        ms.z = playerstart.z;
        control.getCamera().setPosXYZ(ms.x, ms.z / -16 + 1024, ms.y);
        return ms;
    }
    function render(cfg, map, artFiles, pal, PLUs) {
        var gl = GL.createContext(cfg.width, cfg.height, { alpha: false, antialias: true });
        var info = {
            'X:': 0,
            'Y:': 0,
            'Batches:': 0,
            'Sector:': 0,
            'Processing:': '',
            'Rendering:': '',
            'Sectors:': 0,
            'Walls:': 0,
            'Sprites:': 0,
            'FaceSprites:': 0,
            'BufferUpdates:': 0
        };
        var panel = UI.panel('Info');
        var props = UI.props(['X:', 'Y:', 'Batches:', 'Sector:', 'Processing:', 'Rendering:', 'Sectors:', 'Walls:', 'Sprites:', 'FaceSprites:', 'BufferUpdates:']);
        panel.append(props);
        var compass = IU.createEmptyCanvas(50, 50);
        panel.append(new UI.Element(compass));
        document.body.appendChild(panel.elem());
        var stream = new data.DataViewStream(map, true);
        var board = bloodloader.loadBloodMap(stream);
        console.log(board);
        var art = new BuildArtProvider(artFiles, pal, PLUs, gl);
        var control = new controller.Controller3D(gl);
        control.setFov(75);
        var ms = createMoveStruct(board, control);
        RENDERER.init(gl, art, board);
        GL.animate(gl, (gl, time) => {
            var pos = control.getCamera().getPos();
            ms.x = MU.int(pos[0]);
            ms.y = MU.int(pos[2]), ms.z = MU.int((pos[1]) * -16);
            PROFILE.start();
            RENDERER.draw(gl, board, ms, control);
            PROFILE.endProfile();
            info['Rendering:'] = PROFILE.get().subSections['draw'].time.toFixed(2) + 'ms';
            info['Processing:'] = PROFILE.get().subSections['processing'].time.toFixed(2) + 'ms';
            info['Sectors:'] = PROFILE.get().subSections['processing'].counts['sectors'];
            info['Walls:'] = PROFILE.get().subSections['processing'].counts['walls'];
            info['Sprites:'] = PROFILE.get().subSections['processing'].counts['sprites'];
            info['Sector:'] = ms.sec;
            info['X:'] = ms.x;
            info['Y:'] = ms.y;
            props.refresh(info);
            drawCompass(compass, control.getCamera().forward());
            control.move(time);
        });
        gl.canvas.oncontextmenu = () => false;
    }
    var path = 'resources/engines/blood/';
    var artNames = [];
    for (var a = 0; a < 18; a++) {
        artNames[a] = path + 'TILES0' + ("00" + a).slice(-2) + '.ART';
        getter.loader.load(artNames[a], progress(artNames[a]));
    }
    getter.loader
        .loadString(cfgFile)
        .load(rffFile, progress(rffFile))
        .finish(() => {
        var cfg = CFG.create(getter.getString(cfgFile));
        var rff = RFF.create(getter.get(rffFile));
        var pal = rff.get('BLOOD.PAL');
        var arts = [];
        for (var a = 0; a < 18; a++)
            arts.push(ART.create(new data.DataViewStream(getter.get(artNames[a]), true)));
        var artFiles = ART.createArts(arts);
        var PLUs = [
            rff.get('NORMAL.PLU'),
            rff.get('SATURATE.PLU'),
            rff.get('BEAST.PLU'),
            rff.get('TOMMY.PLU'),
            rff.get('SPIDER3.PLU'),
            rff.get('GRAY.PLU'),
            rff.get('GRAYISH.PLU'),
            rff.get('SPIDER1.PLU'),
            rff.get('SPIDER2.PLU'),
            rff.get('FLAME.PLU'),
            rff.get('COLD.PLU'),
            rff.get('P1.PLU'),
            rff.get('P2.PLU'),
            rff.get('P3.PLU'),
            rff.get('P4.PLU'),
        ];
        var map = rff.get(browser.getQueryVariable('map')).buffer;
        render(cfg, map, artFiles, pal, PLUs);
    });
});
