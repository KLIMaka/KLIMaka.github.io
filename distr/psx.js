var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", './libs/imgutils', './libs/mathutils', './modules/pixelprovider', './libs/getter', './libs/asyncbarrier'], function (require, exports, IU, MU, pixel, getter, AB) {
    var ab = AB.create(function (results) { return start(results); });
    getter.preload('resources/psx/vram1.bin', ab.callback('vram'));
    ab.wait();
    var PSX16PixelProvider = (function (_super) {
        __extends(PSX16PixelProvider, _super);
        function PSX16PixelProvider(arr) {
            _super.call(this, 1024, 512);
            this.arr = arr;
        }
        PSX16PixelProvider.prototype.putToDst = function (x, y, dst, dstoff) {
            var w = this.getWidth();
            var pixel = this.arr[x + y * w];
            dst[dstoff + 0] = (pixel & 0x1f) << 3;
            dst[dstoff + 1] = ((pixel >> 5) & 0x1f) << 3;
            dst[dstoff + 2] = ((pixel >> 10) & 0x1f) << 3;
            dst[dstoff + 3] = 255;
        };
        return PSX16PixelProvider;
    })(pixel.AbstractPixelProvider);
    var PSX8PixelProvider = (function (_super) {
        __extends(PSX8PixelProvider, _super);
        function PSX8PixelProvider(arr) {
            _super.call(this, 2048, 512);
            this.arr = arr;
        }
        PSX8PixelProvider.prototype.putToDst = function (x, y, dst, dstoff) {
            var w = this.getWidth();
            var pixel = this.arr[x + y * w];
            dst[dstoff + 0] = pixel;
            dst[dstoff + 1] = pixel;
            dst[dstoff + 2] = pixel;
            dst[dstoff + 3] = 255;
        };
        return PSX8PixelProvider;
    })(pixel.AbstractPixelProvider);
    var PSX4PixelProvider = (function (_super) {
        __extends(PSX4PixelProvider, _super);
        function PSX4PixelProvider(arr) {
            _super.call(this, 4096, 512);
            this.arr = arr;
        }
        PSX4PixelProvider.prototype.putToDst = function (x, y, dst, dstoff) {
            var pixel = this.arr[MU.int(x / 2) + y * 2048];
            pixel = x % 2 == 1 ? ((pixel >> 4) & 0xf) : pixel & 0xf;
            dst[dstoff + 0] = pixel << 4;
            dst[dstoff + 1] = pixel << 4;
            dst[dstoff + 2] = pixel << 4;
            dst[dstoff + 3] = 255;
        };
        return PSX4PixelProvider;
    })(pixel.AbstractPixelProvider);
    function start(res) {
        var vram16 = new Uint16Array(res.vram.slice(0x2733DF), 0, 1024 * 512);
        var vram8 = new Uint8Array(res.vram.slice(0x2733DF), 0, 1024 * 1024);
        var pp16 = new PSX16PixelProvider(vram16);
        var pp8 = new PSX8PixelProvider(vram8);
        var pp4 = new PSX4PixelProvider(vram8);
        document.body.appendChild(IU.createCanvas(pp16));
        document.body.appendChild(IU.createCanvas(pp8));
        document.body.appendChild(IU.createCanvas(pp4));
        document.onclick = function (e) {
            console.log(e.x, e.y);
        };
        var px = vram16[174 * 1024 + 33];
        vram16.forEach(function (value, index, arr) {
            if (value == px)
                console.log(index);
        });
        var len = 160;
        var off = 0x80500;
        while (len != 0) {
            console.log(vram8[off + 160 - len--].toString(16));
        }
    }
});
