define(["require", "exports", './camera', '../libs_js/glmatrix', '../libs/mathutils'], function (require, exports, camera, GLM, MU) {
    var Controller2D = (function () {
        function Controller2D(gl) {
            this.camera = new camera.Camera(0, 0, 0, 0, 0);
            this.drag = false;
            this.dragStartX = 0;
            this.dragStartY = 0;
            this.cameraX = 0;
            this.cameraY = 0;
            this.scale = 1;
            this.projection = GLM.mat4.create();
            this.dragButton = 1;
            this.gl = gl;
            var self = this;
            this.gl.canvas.addEventListener('mousemove', function (e) { return self.mousemove(e); });
            this.gl.canvas.addEventListener('mouseup', function (e) { return self.mouseup(e); });
            this.gl.canvas.addEventListener('mousedown', function (e) { return self.mousedown(e); });
            this.gl.canvas.addEventListener('wheel', function (e) { return self.mousewheel(e); });
        }
        Controller2D.prototype.mousemove = function (e) {
            if (this.drag) {
                var dx = (e.clientX - this.dragStartX) * this.scale;
                var dy = (e.clientY - this.dragStartY) * this.scale;
                this.camera.setPosXYZ(this.cameraX - dx, this.cameraY - dy, 0);
            }
            return false;
        };
        Controller2D.prototype.mouseup = function (e) {
            if (e.button != this.dragButton)
                return;
            this.drag = false;
            return false;
        };
        Controller2D.prototype.mousedown = function (e) {
            if (e.button != this.dragButton)
                return;
            this.drag = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            var campos = this.camera.getPos();
            this.cameraX = campos[0];
            this.cameraY = campos[1];
            return false;
        };
        Controller2D.prototype.mousewheel = function (e) {
            var dx = e.clientX - this.gl.drawingBufferWidth / 2;
            var dy = e.clientY - this.gl.drawingBufferHeight / 2;
            var k = -MU.sign(e.deltaY) / 10;
            this.scale *= k + 1;
            var campos = this.camera.getPos();
            var koef = this.scale * -(k / (k + 1));
            var newX = campos[0] + dx * koef;
            var newY = campos[1] + dy * koef;
            this.camera.setPosXYZ(newX, newY, 0);
            return false;
        };
        Controller2D.prototype.setUnitsPerPixel = function (scale) {
            this.scale = scale;
        };
        Controller2D.prototype.setPos = function (x, y) {
            this.camera.setPosXYZ(x, y, 0);
        };
        Controller2D.prototype.getMatrix = function () {
            var projection = this.projection;
            var wscale = this.gl.drawingBufferWidth / 2 * this.scale;
            var hscale = this.gl.drawingBufferHeight / 2 * this.scale;
            GLM.mat4.ortho(projection, -wscale, wscale, hscale, -hscale, -0xFFFF, 0xFFFF);
            GLM.mat4.mul(projection, projection, this.camera.getTransformMatrix());
            return projection;
        };
        Controller2D.prototype.unproject = function (x, y) {
            var campos = this.camera.getPos();
            var dx = this.gl.drawingBufferWidth / 2;
            var dy = this.gl.drawingBufferHeight / 2;
            return [(x - dx) * this.scale + campos[0], (y - dy) * this.scale + campos[1]];
        };
        Controller2D.prototype.setDragButton = function (btn) {
            this.dragButton = btn;
        };
        return Controller2D;
    })();
    exports.Controller2D = Controller2D;
    function create(gl) {
        return new Controller2D(gl);
    }
    exports.create = create;
});
