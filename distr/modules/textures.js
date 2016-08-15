var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", '../libs/mathutils'], function (require, exports, MU) {
    function repeatMode(w, h) {
        return MU.ispow2(w) && MU.ispow2(h) ? WebGLRenderingContext.REPEAT : WebGLRenderingContext.CLAMP_TO_EDGE;
    }
    var TextureStub = (function () {
        function TextureStub(w, h) {
            this.w = w;
            this.h = h;
        }
        TextureStub.prototype.get = function () { return null; };
        TextureStub.prototype.getWidth = function () { return this.w; };
        TextureStub.prototype.getHeight = function () { return this.h; };
        TextureStub.prototype.getFormat = function () { return null; };
        TextureStub.prototype.getType = function () { return null; };
        return TextureStub;
    })();
    exports.TextureStub = TextureStub;
    var TextureImpl = (function () {
        function TextureImpl(width, height, gl, options, img, format, bpp) {
            if (options === void 0) { options = {}; }
            if (img === void 0) { img = null; }
            if (format === void 0) { format = gl.RGBA; }
            if (bpp === void 0) { bpp = 4; }
            this.id = gl.createTexture();
            this.width = width;
            this.height = height;
            this.format = format;
            this.type = gl.UNSIGNED_BYTE;
            gl.bindTexture(gl.TEXTURE_2D, this.id);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.filter || gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.filter || gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.repeat || repeatMode(width, height));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.repeat || repeatMode(width, height));
            if (img == null)
                img = new Uint8Array(width * height * bpp);
            this.data = img;
            gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, this.data);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        TextureImpl.prototype.get = function () {
            return this.id;
        };
        TextureImpl.prototype.getWidth = function () {
            return this.width;
        };
        TextureImpl.prototype.getHeight = function () {
            return this.height;
        };
        TextureImpl.prototype.getFormat = function () {
            return this.format;
        };
        TextureImpl.prototype.getType = function () {
            return this.type;
        };
        TextureImpl.prototype.reload = function (gl) {
            gl.bindTexture(gl.TEXTURE_2D, this.id);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.width, this.height, this.getFormat(), this.getType(), this.data);
        };
        return TextureImpl;
    })();
    exports.TextureImpl = TextureImpl;
    function createTexture(width, height, gl, options, img, format, bpp) {
        if (options === void 0) { options = {}; }
        if (img === void 0) { img = null; }
        if (format === void 0) { format = gl.RGBA; }
        if (bpp === void 0) { bpp = 4; }
        return new TextureImpl(width, height, gl, options, img, format, bpp);
    }
    exports.createTexture = createTexture;
    var DrawTexture = (function (_super) {
        __extends(DrawTexture, _super);
        function DrawTexture(width, height, gl, options, img, format, bpp) {
            if (options === void 0) { options = {}; }
            if (img === void 0) { img = null; }
            if (format === void 0) { format = gl.RGBA; }
            if (bpp === void 0) { bpp = 4; }
            _super.call(this, width, height, gl, options, img, format, bpp);
        }
        DrawTexture.prototype.putPixel = function (x, y, pixel, gl) {
            if (x < 0 || x >= this.width || y < 0 || y >= this.height)
                return;
            gl.bindTexture(gl.TEXTURE_2D, this.id);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, 1, 1, this.getFormat(), this.getType(), pixel);
        };
        DrawTexture.prototype.putSubImage = function (x, y, w, h, img, gl) {
            gl.bindTexture(gl.TEXTURE_2D, this.id);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, w, h, this.getFormat(), this.getType(), img);
        };
        return DrawTexture;
    })(TextureImpl);
    exports.DrawTexture = DrawTexture;
    function createDrawTexture(width, height, gl, options, img, format, bpp) {
        if (options === void 0) { options = {}; }
        if (img === void 0) { img = null; }
        if (format === void 0) { format = gl.RGBA; }
        if (bpp === void 0) { bpp = 4; }
        return new DrawTexture(width, height, gl, options, img, format, bpp);
    }
    exports.createDrawTexture = createDrawTexture;
    var RenderTexture = (function (_super) {
        __extends(RenderTexture, _super);
        function RenderTexture(width, height, gl, img) {
            if (img === void 0) { img = null; }
            _super.call(this, width, height, gl, img);
            this.framebuffer = gl.createFramebuffer();
            this.renderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.getWidth(), this.getHeight());
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }
        RenderTexture.prototype.drawTo = function (gl, callback) {
            var v = gl.getParameter(gl.VIEWPORT);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
            gl.viewport(0, 0, this.getWidth(), this.getHeight());
            callback(gl);
            gl.readPixels(0, 0, this.getWidth(), this.getHeight(), gl.RGBA, gl.UNSIGNED_BYTE, this.data);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.viewport(v[0], v[1], v[2], v[3]);
            return this.data;
        };
        return RenderTexture;
    })(TextureImpl);
    exports.RenderTexture = RenderTexture;
});
