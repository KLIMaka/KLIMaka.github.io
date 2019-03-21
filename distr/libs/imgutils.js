define(["require", "exports", "../modules/pixelprovider"], function (require, exports, pixel) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createEmptyCanvas(width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    exports.createEmptyCanvas = createEmptyCanvas;
    function createCanvas(provider, blend = pixel.BlendNormal) {
        var canvas = document.createElement('canvas');
        canvas.width = provider.getWidth();
        canvas.height = provider.getHeight();
        drawToCanvas(provider, canvas, 0, 0, blend);
        return canvas;
    }
    exports.createCanvas = createCanvas;
    function drawToCanvas(provider, canvas, x = 0, y = 0, blend = pixel.BlendNormal) {
        var ctx = canvas.getContext('2d');
        var data;
        if (blend === pixel.BlendNormal) {
            data = new Uint8ClampedArray(provider.getWidth() * provider.getHeight() * 4);
            var id = new ImageData(data, provider.getWidth(), provider.getHeight());
        }
        provider.render(data, blend);
        ctx.putImageData(id, x, y);
    }
    exports.drawToCanvas = drawToCanvas;
    function clearCanvas(canvas, style) {
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = style;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    exports.clearCanvas = clearCanvas;
    function loadImageFromBuffer(buff, cb) {
        var blob = new Blob([buff]);
        var urlCreator = window.URL;
        var imageUrl = urlCreator.createObjectURL(blob);
        var img = new Image();
        img.src = imageUrl;
        img.onload = (evt) => {
            var img = evt.target;
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            var data = new Uint8Array(ctx.getImageData(0, 0, img.width, img.height).data);
            cb(new pixel.RGBAArrayPixelProvider(data, img.width, img.height));
        };
    }
    exports.loadImageFromBuffer = loadImageFromBuffer;
    function loadImage(name, cb) {
        var image = new Image();
        image.src = name;
        image.onload = (evt) => {
            var img = evt.target;
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            cb(new Uint8Array(ctx.getImageData(0, 0, img.width, img.height).data));
        };
    }
    exports.loadImage = loadImage;
});
