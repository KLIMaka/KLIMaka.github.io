var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", '../libs/mathutils', './anim'], function(require, exports, MU, Anim) {
    var AbstractPixelProvider = (function () {
        function AbstractPixelProvider(w, h) {
            this.w = w;
            this.h = h;
            if (w < 0 || h < 0)
                throw new Error('Invalid size');
        }
        AbstractPixelProvider.prototype.putToDst = function (x, y, dst, dstoff) {
        };

        AbstractPixelProvider.prototype.getPixel = function (x, y) {
            var dst = new Uint8Array(4);
            this.putToDst(x, y, dst, 0);
            return dst;
        };

        AbstractPixelProvider.prototype.getWidth = function () {
            return this.w;
        };

        AbstractPixelProvider.prototype.getHeight = function () {
            return this.h;
        };

        AbstractPixelProvider.prototype.render = function (dst) {
            var off = 0;
            for (var y = 0; y < this.h; y++) {
                for (var x = 0; x < this.w; x++) {
                    this.putToDst(x, y, dst, off);
                    off += 4;
                }
            }
        };

        AbstractPixelProvider.prototype.blend = function (dst) {
            var tmpdst = new Uint8Array(4);
            var off = 0;
            for (var y = 0; y < this.h; y++) {
                for (var x = 0; x < this.w; x++) {
                    this.putToDst(x, y, tmpdst, 0);
                    if (tmpdst[3] == 0) {
                        off += 4;
                        continue;
                    }
                    var a = tmpdst[3] / 255;
                    dst[off + 0] = MU.int(tmpdst[0] * a + dst[off + 0] * (1 - a));
                    dst[off + 1] = MU.int(tmpdst[1] * a + dst[off + 1] * (1 - a));
                    dst[off + 2] = MU.int(tmpdst[2] * a + dst[off + 2] * (1 - a));
                    dst[off + 3] = 255;
                    off += 4;
                }
            }
        };
        return AbstractPixelProvider;
    })();
    exports.AbstractPixelProvider = AbstractPixelProvider;

    var ConstPixelProvider = (function (_super) {
        __extends(ConstPixelProvider, _super);
        function ConstPixelProvider(color, w, h) {
            _super.call(this, w, h);
            this.color = color;
        }
        ConstPixelProvider.prototype.putToDst = function (x, y, dst, dstoff) {
            dst[dstoff] = this.color[0];
            dst[dstoff + 1] = this.color[1];
            dst[dstoff + 2] = this.color[2];
            dst[dstoff + 3] = this.color[3];
        };
        return ConstPixelProvider;
    })(AbstractPixelProvider);
    exports.ConstPixelProvider = ConstPixelProvider;

    var RGBAArrayPixelProvider = (function (_super) {
        __extends(RGBAArrayPixelProvider, _super);
        function RGBAArrayPixelProvider(arr, w, h) {
            _super.call(this, w, h);
            this.arr = arr;
            if (arr.length != w * h * 4)
                throw new Error('Invalid array size. Need ' + (w * h * 4) + ' but provided ' + arr.length);
        }
        RGBAArrayPixelProvider.prototype.putToDst = function (x, y, dst, dstoff) {
            var w = this.getWidth();
            dst[dstoff] = this.arr[(x + y * w) * 4];
            dst[dstoff + 1] = this.arr[(x + y * w) * 4 + 1];
            dst[dstoff + 2] = this.arr[(x + y * w) * 4 + 2];
            dst[dstoff + 3] = this.arr[(x + y * w) * 4 + 3];
        };
        return RGBAArrayPixelProvider;
    })(AbstractPixelProvider);
    exports.RGBAArrayPixelProvider = RGBAArrayPixelProvider;

    var RGBPalPixelProvider = (function (_super) {
        __extends(RGBPalPixelProvider, _super);
        function RGBPalPixelProvider(arr, pal, w, h, alpha, transIdx, shadow, shadowColor) {
            if (typeof alpha === "undefined") { alpha = 255; }
            if (typeof transIdx === "undefined") { transIdx = -1; }
            if (typeof shadow === "undefined") { shadow = -1; }
            if (typeof shadowColor === "undefined") { shadowColor = [0, 0, 0, 0]; }
            _super.call(this, w, h);
            this.arr = arr;
            this.pal = pal;
            this.alpha = alpha;
            this.transIdx = transIdx;
            this.shadow = shadow;
            this.shadowColor = shadowColor;
            if (arr.length != w * h)
                throw new Error('Invalid array size. Need ' + (w * h * 4) + ' but provided ' + arr.length);
        }
        RGBPalPixelProvider.prototype.putToDst = function (x, y, dst, dstoff) {
            var w = this.getWidth();
            var idx = this.arr[x + y * w];
            if (idx == this.shadow) {
                dst[dstoff + 0] = this.shadowColor[0];
                dst[dstoff + 1] = this.shadowColor[1];
                dst[dstoff + 2] = this.shadowColor[2];
                dst[dstoff + 3] = this.shadowColor[3];
                return;
            }
            var paloff = idx * 3;
            dst[dstoff] = this.pal[paloff];
            dst[dstoff + 1] = this.pal[paloff + 1];
            dst[dstoff + 2] = this.pal[paloff + 2];
            dst[dstoff + 3] = idx == this.transIdx ? 0 : this.alpha;
        };
        return RGBPalPixelProvider;
    })(AbstractPixelProvider);
    exports.RGBPalPixelProvider = RGBPalPixelProvider;

    var RectPixelProvider = (function (_super) {
        __extends(RectPixelProvider, _super);
        function RectPixelProvider(provider, sx, sy, ex, ey, paddColor) {
            if (typeof paddColor === "undefined") { paddColor = [0, 0, 0, 0]; }
            _super.call(this, ex - sx, ey - sy);
            this.provider = provider;
            this.sx = sx;
            this.sy = sy;
            this.ex = ex;
            this.ey = ey;
            this.paddColor = paddColor;
            this.origw = provider.getWidth();
            this.origh = provider.getHeight();
            if (sx >= ex || sy >= ey)
                throw new Error('Invalid subrect');
        }
        RectPixelProvider.prototype.putToDst = function (x, y, dst, dstoff) {
            var nx = this.sx + x;
            var ny = this.sy + y;
            if (nx < 0 || ny < 0 || nx >= this.origw || ny >= this.origh)
                this.putPadding(dst, dstoff);
            else
                this.provider.putToDst(nx, ny, dst, dstoff);
        };

        RectPixelProvider.prototype.putPadding = function (dst, dstoff) {
            dst[dstoff] = this.paddColor[0];
            dst[dstoff + 1] = this.paddColor[1];
            dst[dstoff + 2] = this.paddColor[2];
            dst[dstoff + 3] = this.paddColor[3];
        };
        return RectPixelProvider;
    })(AbstractPixelProvider);
    exports.RectPixelProvider = RectPixelProvider;

    var ResizePixelProvider = (function (_super) {
        __extends(ResizePixelProvider, _super);
        function ResizePixelProvider(provider, w, h) {
            _super.call(this, w, h);
            this.provider = provider;
            this.dx = provider.getWidth() / w;
            this.dy = provider.getHeight() / h;
        }
        ResizePixelProvider.prototype.putToDst = function (x, y, dst, dstoff) {
            this.provider.putToDst(MU.int(x * this.dx), MU.int(y * this.dy), dst, dstoff);
        };
        return ResizePixelProvider;
    })(AbstractPixelProvider);
    exports.ResizePixelProvider = ResizePixelProvider;

    var AxisSwapPixelProvider = (function (_super) {
        __extends(AxisSwapPixelProvider, _super);
        function AxisSwapPixelProvider(provider) {
            _super.call(this, provider.getHeight(), provider.getWidth());
            this.provider = provider;
        }
        AxisSwapPixelProvider.prototype.putToDst = function (x, y, dst, dstoff) {
            this.provider.putToDst(y, x, dst, dstoff);
        };
        return AxisSwapPixelProvider;
    })(AbstractPixelProvider);
    exports.AxisSwapPixelProvider = AxisSwapPixelProvider;

    var FlipPixelProvider = (function (_super) {
        __extends(FlipPixelProvider, _super);
        function FlipPixelProvider(provider, xswap, yswap) {
            _super.call(this, provider.getWidth(), provider.getHeight());
            this.provider = provider;
            this.xs = xswap ? provider.getWidth() - 1 : 0;
            this.ys = yswap ? provider.getHeight() - 1 : 0;
        }
        FlipPixelProvider.prototype.putToDst = function (x, y, dst, dstoff) {
            this.provider.putToDst(Math.abs(x - this.xs), Math.abs(y - this.ys), dst, dstoff);
        };
        return FlipPixelProvider;
    })(AbstractPixelProvider);
    exports.FlipPixelProvider = FlipPixelProvider;

    function fromPal(arr, pal, w, h, alpha, transIdx, shadow, shadowColor) {
        if (typeof alpha === "undefined") { alpha = 255; }
        if (typeof transIdx === "undefined") { transIdx = -1; }
        if (typeof shadow === "undefined") { shadow = -1; }
        if (typeof shadowColor === "undefined") { shadowColor = [0, 0, 0, 0]; }
        return new RGBPalPixelProvider(arr, pal, w, h, alpha, transIdx, shadow, shadowColor);
    }
    exports.fromPal = fromPal;

    function axisSwap(provider) {
        return new AxisSwapPixelProvider(provider);
    }
    exports.axisSwap = axisSwap;

    function xflip(provider) {
        return new FlipPixelProvider(provider, true, false);
    }
    exports.xflip = xflip;

    function yflip(provider) {
        return new FlipPixelProvider(provider, false, true);
    }
    exports.yflip = yflip;

    function xyflip(provider) {
        return new FlipPixelProvider(provider, true, true);
    }
    exports.xyflip = xyflip;

    function rect(provider, sx, sy, ex, ey, paddColod) {
        if (typeof paddColod === "undefined") { paddColod = [0, 0, 0, 0]; }
        if (sx == 0 && sy == 0 && provider.getHeight() == ey && provider.getWidth() == ex)
            return provider;
        return new RectPixelProvider(provider, sx, sy, ex, ey, paddColod);
    }
    exports.rect = rect;

    function center(provider, w, h, paddColod) {
        if (typeof paddColod === "undefined") { paddColod = [0, 0, 0, 0]; }
        var dw = MU.int((provider.getWidth() - w) / 2);
        var dh = MU.int((provider.getHeight() - h) / 2);
        return exports.rect(provider, dw, dh, w + dw, h + dh);
    }
    exports.center = center;

    function resize(provider, w, h) {
        if (provider.getHeight() == h && provider.getWidth() == w)
            return provider;
        return new ResizePixelProvider(provider, w, h);
    }
    exports.resize = resize;

    function fit(w, h, provider, paddColor) {
        if (typeof paddColor === "undefined") { paddColor = [0, 0, 0, 0]; }
        if (provider.getHeight() == h && provider.getWidth() == w)
            return provider;
        if (provider.getWidth() <= w && provider.getHeight() <= h) {
            var sx = (provider.getWidth() - w) / 2;
            var sy = (provider.getHeight() - h) / 2;
            return exports.rect(provider, sx, sy, w + sx, h + sy, paddColor);
        } else {
            var aspect = provider.getWidth() / provider.getHeight();
            var nw = provider.getWidth();
            var nh = provider.getHeight();
            var r = false;
            if (nw > w) {
                nw = w;
                nh = nw / aspect;
                r = true;
            }
            if (nh > h) {
                nh = h;
                nw = nw * aspect;
                r = true;
            }
            if (r) {
                var sx = (nw - w) / 2;
                var sy = (nh - h) / 2;
                return exports.rect(exports.resize(provider, nw, nh), sx, sy, w + sx, h + sy, paddColor);
            } else {
                return exports.resize(provider, w, h);
            }
        }
    }
    exports.fit = fit;

    var AnimatedPixelProvider = (function (_super) {
        __extends(AnimatedPixelProvider, _super);
        function AnimatedPixelProvider(frames, fps) {
            _super.call(this, frames, fps);
        }
        AnimatedPixelProvider.prototype.getWidth = function () {
            return this.animate(0).getWidth();
        };

        AnimatedPixelProvider.prototype.getHeight = function () {
            return this.animate(0).getHeight();
        };
        return AnimatedPixelProvider;
    })(Anim.DefaultAnimated);
    exports.AnimatedPixelProvider = AnimatedPixelProvider;
});
