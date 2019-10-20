define(["require", "exports", "../libs/mathutils", "./anim"], function (require, exports, MU, Anim) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BlendNormal = (dst, dstoff, src, srcoff) => {
        dst[dstoff] = src[srcoff];
        dst[dstoff + 1] = src[srcoff + 1];
        dst[dstoff + 2] = src[srcoff + 2];
        dst[dstoff + 3] = src[srcoff + 3];
    };
    exports.BlendAlpha = (dst, dstoff, src, srcoff) => {
        var a = src[srcoff + 3] / 255;
        var _a = 1 - a;
        dst[dstoff] = src[srcoff] * a + dst[dstoff] * _a;
        dst[dstoff + 1] = src[srcoff + 1] * a + dst[dstoff + 1] * _a;
        dst[dstoff + 2] = src[srcoff + 2] * a + dst[dstoff + 2] * _a;
        dst[dstoff + 3] = 255;
    };
    class AbstractPixelProvider {
        constructor(w, h) {
            this.w = w;
            this.h = h;
            if (w < 0 || h < 0)
                throw new Error('Invalid size');
        }
        putToDst(x, y, dst, dstoff, blend) { }
        getPixel(x, y) {
            var dst = new Uint8Array(4);
            this.putToDst(x, y, dst, 0, exports.BlendNormal);
            return dst;
        }
        getWidth() {
            return this.w;
        }
        getHeight() {
            return this.h;
        }
        render(dst, blend = exports.BlendNormal) {
            var off = 0;
            var tmp = new Uint8Array(4);
            for (var y = 0; y < this.h; y++) {
                for (var x = 0; x < this.w; x++) {
                    this.putToDst(x, y, dst, off, blend);
                    off += 4;
                }
            }
        }
    }
    exports.AbstractPixelProvider = AbstractPixelProvider;
    class ConstPixelProvider extends AbstractPixelProvider {
        constructor(color, w, h) {
            super(w, h);
            this.color = color;
        }
        putToDst(x, y, dst, dstoff, blend) {
            blend(dst, dstoff, this.color, 0);
        }
    }
    exports.ConstPixelProvider = ConstPixelProvider;
    class RGBAArrayPixelProvider extends AbstractPixelProvider {
        constructor(arr, w, h) {
            super(w, h);
            this.arr = arr;
            if (arr.length != w * h * 4)
                throw new Error('Invalid array size. Need ' + (w * h * 4) + ' but provided ' + arr.length);
        }
        putToDst(x, y, dst, dstoff, blend) {
            var w = this.getWidth();
            blend(dst, dstoff, this.arr, (x + y * w) * 4);
        }
    }
    exports.RGBAArrayPixelProvider = RGBAArrayPixelProvider;
    class RGBPalPixelProvider extends AbstractPixelProvider {
        constructor(arr, pal, w, h, alpha = 255, transIdx = -1, shadow = -1, shadowColor = new Uint8Array([0, 0, 0, 0])) {
            super(w, h);
            this.arr = arr;
            this.pal = pal;
            this.alpha = alpha;
            this.transIdx = transIdx;
            this.shadow = shadow;
            this.shadowColor = shadowColor;
            this.palTmp = new Uint8Array(4);
            if (arr.length != w * h)
                throw new Error('Invalid array size. Need ' + (w * h * 4) + ' but provided ' + arr.length);
        }
        putToDst(x, y, dst, dstoff, blend) {
            var w = this.getWidth();
            var idx = this.arr[x + y * w];
            if (idx == this.shadow) {
                blend(dst, dstoff, this.shadowColor, 0);
                return;
            }
            var paloff = idx * 3;
            this.palTmp[0] = this.pal[paloff];
            this.palTmp[1] = this.pal[paloff + 1];
            this.palTmp[2] = this.pal[paloff + 2];
            this.palTmp[3] = idx == this.transIdx ? 0 : this.alpha;
            blend(dst, dstoff, this.palTmp, 0);
        }
    }
    exports.RGBPalPixelProvider = RGBPalPixelProvider;
    class RectPixelProvider extends AbstractPixelProvider {
        constructor(provider, sx, sy, ex, ey, paddColor = new Uint8Array([0, 0, 0, 0])) {
            super(ex - sx, ey - sy);
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
        putToDst(x, y, dst, dstoff, blend) {
            var nx = this.sx + x;
            var ny = this.sy + y;
            if (nx < 0 || ny < 0 || nx >= this.origw || ny >= this.origh)
                blend(dst, dstoff, this.paddColor, 0);
            else
                this.provider.putToDst(nx, ny, dst, dstoff, blend);
        }
    }
    exports.RectPixelProvider = RectPixelProvider;
    class ResizePixelProvider extends AbstractPixelProvider {
        constructor(provider, w, h) {
            super(w, h);
            this.provider = provider;
            this.dx = provider.getWidth() / w;
            this.dy = provider.getHeight() / h;
        }
        putToDst(x, y, dst, dstoff, blend) {
            this.provider.putToDst(MU.int(x * this.dx), MU.int(y * this.dy), dst, dstoff, blend);
        }
    }
    exports.ResizePixelProvider = ResizePixelProvider;
    class AxisSwapPixelProvider extends AbstractPixelProvider {
        constructor(provider) {
            super(provider.getHeight(), provider.getWidth());
            this.provider = provider;
        }
        putToDst(x, y, dst, dstoff, blend) {
            this.provider.putToDst(y, x, dst, dstoff, blend);
        }
    }
    exports.AxisSwapPixelProvider = AxisSwapPixelProvider;
    class FlipPixelProvider extends AbstractPixelProvider {
        constructor(provider, xswap, yswap) {
            super(provider.getWidth(), provider.getHeight());
            this.provider = provider;
            this.xs = xswap ? provider.getWidth() - 1 : 0;
            this.ys = yswap ? provider.getHeight() - 1 : 0;
        }
        putToDst(x, y, dst, dstoff, blend) {
            this.provider.putToDst(Math.abs(x - this.xs), Math.abs(y - this.ys), dst, dstoff, blend);
        }
    }
    exports.FlipPixelProvider = FlipPixelProvider;
    class OffsetPixelProvider extends AbstractPixelProvider {
        constructor(provider, w, h, xo, yo, paddColor = new Uint8Array([0, 0, 0, 0])) {
            super(w, h);
            this.provider = provider;
            this.xo = xo;
            this.yo = yo;
            this.paddColor = paddColor;
        }
        putToDst(x, y, dst, dstoff, blend) {
            var rx = x - this.xo;
            var ry = y - this.yo;
            if (rx < 0 || ry < 0 || rx >= this.provider.getWidth() || ry >= this.provider.getHeight())
                blend(dst, dstoff, this.paddColor, 0);
            else
                this.provider.putToDst(rx, ry, dst, dstoff, blend);
        }
    }
    exports.OffsetPixelProvider = OffsetPixelProvider;
    function fromPal(arr, pal, w, h, alpha = 255, transIdx = -1, shadow = -1, shadowColor = new Uint8Array([0, 0, 0, 0])) {
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
    function rect(provider, sx, sy, ex, ey, paddColod = new Uint8Array([0, 0, 0, 0])) {
        if (sx == 0 && sy == 0 && provider.getHeight() == ey && provider.getWidth() == ex)
            return provider;
        return new RectPixelProvider(provider, sx, sy, ex, ey, paddColod);
    }
    exports.rect = rect;
    function center(provider, w, h, paddColod = new Uint8Array([0, 0, 0, 0])) {
        var dw = MU.int((provider.getWidth() - w) / 2);
        var dh = MU.int((provider.getHeight() - h) / 2);
        return rect(provider, dw, dh, w + dw, h + dh);
    }
    exports.center = center;
    function resize(provider, w, h) {
        if (provider.getHeight() == h && provider.getWidth() == w)
            return provider;
        return new ResizePixelProvider(provider, w, h);
    }
    exports.resize = resize;
    function fit(w, h, provider, paddColor = new Uint8Array([0, 0, 0, 0])) {
        if (provider.getHeight() == h && provider.getWidth() == w)
            return provider;
        if (provider.getWidth() <= w && provider.getHeight() <= h) {
            var sx = (provider.getWidth() - w) / 2;
            var sy = (provider.getHeight() - h) / 2;
            return rect(provider, sx, sy, w + sx, h + sy, paddColor);
        }
        else {
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
                return rect(resize(provider, nw, nh), sx, sy, w + sx, h + sy, paddColor);
            }
            else {
                return resize(provider, w, h);
            }
        }
    }
    exports.fit = fit;
    function offset(provider, w, h, xo, yo, paddColor = new Uint8Array([0, 0, 0, 0])) {
        return new OffsetPixelProvider(provider, w, h, xo, yo, paddColor);
    }
    exports.offset = offset;
    class AnimatedPixelProvider extends Anim.DefaultAnimated {
        constructor(frames, fps) {
            super(frames, fps);
        }
        getWidth() {
            return this.animate(0).getWidth();
        }
        getHeight() {
            return this.animate(0).getHeight();
        }
    }
    exports.AnimatedPixelProvider = AnimatedPixelProvider;
});
