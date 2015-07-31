define(["require", "exports"], function(require, exports) {
    function createEmptyCanvas(width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    exports.createEmptyCanvas = createEmptyCanvas;

    function createCanvas(provider) {
        var canvas = document.createElement('canvas');
        canvas.width = provider.getWidth();
        canvas.height = provider.getHeight();
        exports.drawToCanvas(provider, canvas);
        return canvas;
    }
    exports.createCanvas = createCanvas;

    function drawToCanvas(provider, canvas, x, y) {
        if (typeof x === "undefined") { x = 0; }
        if (typeof y === "undefined") { y = 0; }
        var ctx = canvas.getContext('2d');
        var id = ctx.createImageData(provider.getWidth(), provider.getHeight());
        provider.render(id.data);
        ctx.putImageData(id, x, y);
    }
    exports.drawToCanvas = drawToCanvas;

    function blendToCanvas(provider, canvas, x, y) {
        if (typeof x === "undefined") { x = 0; }
        if (typeof y === "undefined") { y = 0; }
        var ctx = canvas.getContext('2d');
        var id = ctx.getImageData(x, y, provider.getWidth(), provider.getHeight());
        provider.blend(id.data);
        ctx.putImageData(id, x, y);
    }
    exports.blendToCanvas = blendToCanvas;

    function clearCanvas(canvas, style) {
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = style;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    exports.clearCanvas = clearCanvas;

    function copyRGBA(src, srcoff, dst, dstoff) {
        dst[dstoff] = src[srcoff];
        dst[dstoff + 1] = src[srcoff + 1];
        dst[dstoff + 2] = src[srcoff + 2];
        dst[dstoff + 3] = src[srcoff + 3];
    }
    exports.copyRGBA = copyRGBA;

    function blendRGBA(src, srcoff, dst, dstoff) {
        if (src[srcoff + 3] == 0)
            return;
        var t = src[srcoff + 3] / 255;
        var t_ = 1 - t;
        dst[dstoff + 0] = dst[dstoff + 0] * t_ + src[srcoff + 0] * t;
        dst[dstoff + 1] = dst[dstoff + 1] * t_ + src[srcoff + 1] * t;
        dst[dstoff + 2] = dst[dstoff + 2] * t_ + src[srcoff + 2] * t;
        dst[dstoff + 3] = Math.max(dst[dstoff + 3], src[srcoff + 3]);
    }
    exports.blendRGBA = blendRGBA;
});
