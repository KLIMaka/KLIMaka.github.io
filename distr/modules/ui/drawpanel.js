define(["require", "exports", '../pixelprovider', '../../libs/mathutils', '../../libs/imgutils'], function (require, exports, P, MU, IU) {
    var PixelDataProvider = (function () {
        function PixelDataProvider(s, f) {
            this.s = s;
            this.f = f;
        }
        PixelDataProvider.prototype.size = function () {
            return this.s;
        };
        PixelDataProvider.prototype.get = function (i) {
            return this.f(i);
        };
        return PixelDataProvider;
    })();
    exports.PixelDataProvider = PixelDataProvider;
    var noneImg = new Uint8Array([
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 0, 0, 0, 0, 1, 1,
        1, 0, 1, 0, 0, 1, 0, 1,
        1, 0, 0, 1, 1, 0, 0, 1,
        1, 0, 0, 1, 1, 0, 0, 1,
        1, 0, 1, 0, 0, 1, 0, 1,
        1, 1, 0, 0, 0, 0, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ]);
    var nonePal = new Uint8Array([
        255, 255, 255,
        255, 0, 0
    ]);
    var noneProvider = P.fromPal(noneImg, nonePal, 8, 8);
    var DrawPanel = (function () {
        function DrawPanel(canvas, provider) {
            this.canvas = canvas;
            this.provider = provider;
            this.firstId = 0;
        }
        DrawPanel.prototype.setCellSize = function (w, h) {
            this.cellW = w;
            this.cellH = h;
        };
        DrawPanel.prototype.setFirstId = function (id) {
            this.firstId = id;
        };
        DrawPanel.prototype.nextPage = function () {
            var cells = MU.int(this.canvas.width / this.cellW) * MU.int(this.canvas.height / this.cellH);
            if (this.firstId + cells >= this.provider.size())
                return;
            this.firstId += cells;
        };
        DrawPanel.prototype.prevPage = function () {
            var cells = MU.int(this.canvas.width / this.cellW) * MU.int(this.canvas.height / this.cellH);
            if (this.firstId - cells < 0)
                return;
            this.firstId -= cells;
        };
        DrawPanel.prototype.draw = function () {
            var provider = this.provider;
            var canvas = this.canvas;
            var w = canvas.width;
            var h = canvas.height;
            var ctx = canvas.getContext('2d');
            var wcells = MU.int(w / this.cellW);
            var hcells = MU.int(h / this.cellH);
            var cells = wcells * hcells;
            var firstId = this.firstId;
            var lastId = Math.min(firstId + cells, provider.size());
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, w, h);
            for (var i = firstId; i < lastId; i++) {
                var x = ((i - firstId) % wcells) * this.cellW;
                var y = MU.int((i - firstId) / wcells) * this.cellH;
                var img = provider.get(i);
                if (img == null)
                    img = noneProvider;
                var pixels = P.fit(this.cellW, this.cellH, img, [255, 255, 255, 255]);
                IU.drawToCanvas(pixels, canvas, x, y);
            }
        };
        return DrawPanel;
    })();
    exports.DrawPanel = DrawPanel;
});
