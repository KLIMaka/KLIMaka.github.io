define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TextureStub {
        constructor(w, h) {
            this.w = w;
            this.h = h;
        }
        get() { return null; }
        getWidth() { return this.w; }
        getHeight() { return this.h; }
        getFormat() { return null; }
        getType() { return null; }
    }
    exports.TextureStub = TextureStub;
    class TextureImpl {
        constructor(width, height, gl, options = {}, img = null, format = gl.RGBA, bpp = 4) {
            this.id = gl.createTexture();
            this.width = width;
            this.height = height;
            this.format = format;
            this.type = gl.UNSIGNED_BYTE;
            gl.bindTexture(gl.TEXTURE_2D, this.id);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.filter || gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.filter || gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.repeat || gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.repeat || gl.CLAMP_TO_EDGE);
            if (img == null)
                img = new Uint8Array(width * height * bpp);
            this.data = img;
            gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, this.data);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        get() {
            return this.id;
        }
        getWidth() {
            return this.width;
        }
        getHeight() {
            return this.height;
        }
        getFormat() {
            return this.format;
        }
        getType() {
            return this.type;
        }
        reload(gl) {
            gl.bindTexture(gl.TEXTURE_2D, this.id);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.width, this.height, this.getFormat(), this.getType(), this.data);
        }
    }
    exports.TextureImpl = TextureImpl;
    function createTexture(width, height, gl, options = {}, img = null, format = gl.RGBA, bpp = 4) {
        return new TextureImpl(width, height, gl, options, img, format, bpp);
    }
    exports.createTexture = createTexture;
    class DrawTexture extends TextureImpl {
        constructor(width, height, gl, options = {}, img = null, format = gl.RGBA, bpp = 4) {
            super(width, height, gl, options, img, format, bpp);
        }
        putPixel(x, y, pixel, gl) {
            if (x < 0 || x >= this.width || y < 0 || y >= this.height)
                return;
            gl.bindTexture(gl.TEXTURE_2D, this.id);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, 1, 1, this.getFormat(), this.getType(), pixel);
        }
        putSubImage(x, y, w, h, img, gl) {
            gl.bindTexture(gl.TEXTURE_2D, this.id);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, w, h, this.getFormat(), this.getType(), img);
        }
    }
    exports.DrawTexture = DrawTexture;
    function createDrawTexture(width, height, gl, options = {}, img = null, format = gl.RGBA, bpp = 4) {
        return new DrawTexture(width, height, gl, options, img, format, bpp);
    }
    exports.createDrawTexture = createDrawTexture;
    class RenderTexture extends TextureImpl {
        constructor(width, height, gl, options = {}, img = null) {
            super(width, height, gl, options, img);
            this.framebuffer = gl.createFramebuffer();
            this.renderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.getWidth(), this.getHeight());
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }
        drawTo(gl, callback) {
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
        }
    }
    exports.RenderTexture = RenderTexture;
    function createRenderTexture(width, height, gl, options = {}, img = null) {
        return new RenderTexture(width, height, gl, options, img);
    }
    exports.createRenderTexture = createRenderTexture;
});
