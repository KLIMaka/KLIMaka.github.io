define(["require", "exports", "./camera", "../libs_js/glmatrix", "../libs/mathutils"], function (require, exports, camera, GLM, MU) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var named = {
        8: 'BACKSPACE',
        9: 'TAB',
        13: 'ENTER',
        16: 'SHIFT',
        27: 'ESCAPE',
        32: 'SPACE',
        37: 'LEFT',
        38: 'UP',
        39: 'RIGHT',
        40: 'DOWN'
    };
    function mapKeyCode(code) {
        return named[code] || (code >= 65 && code <= 90 ? String.fromCharCode(code) : null);
    }
    class Controller3D {
        constructor(gl) {
            this.camera = new camera.Camera(0, 0, 0, 0, 0);
            this.projection = GLM.mat4.create();
            this.drag = false;
            this.oldX = 0;
            this.oldY = 0;
            this.keys = {};
            this.fov = 90;
            this.click = false;
            this.moveVec = [0, 0];
            this.gl = gl;
            var self = this;
            this.gl.canvas.addEventListener('mousemove', (e) => self.mousemove(e));
            this.gl.canvas.addEventListener('mouseup', (e) => self.mouseup(e));
            this.gl.canvas.addEventListener('mousedown', (e) => self.mousedown(e));
            document.addEventListener('keyup', (e) => self.keyup(e));
            document.addEventListener('keydown', (e) => self.keydown(e));
        }
        mousemove(e) {
            var x = e.clientX;
            var y = e.clientY;
            if (this.drag) {
                this.camera.updateAngles(x - this.oldX, y - this.oldY);
            }
            this.oldX = x;
            this.oldY = y;
            return false;
        }
        mouseup(e) {
            this.drag = false;
            this.click = true;
            return false;
        }
        mousedown(e) {
            this.drag = true;
            return false;
        }
        keydown(e) {
            if (!e.altKey && !e.ctrlKey && !e.metaKey) {
                var key = mapKeyCode(e.keyCode);
                if (key)
                    this.keys[key] = true;
                this.keys[e.keyCode] = true;
            }
            return false;
        }
        keyup(e) {
            if (!e.altKey && !e.ctrlKey && !e.metaKey) {
                var key = mapKeyCode(e.keyCode);
                if (key)
                    this.keys[key] = false;
                this.keys[e.keyCode] = false;
            }
            return false;
        }
        getX() {
            return this.oldX;
        }
        getY() {
            return this.oldY;
        }
        setFov(fov) {
            this.fov = fov;
        }
        getFov() {
            return this.fov;
        }
        getMatrix() {
            var projection = this.projection;
            GLM.mat4.perspective(projection, MU.deg2rad(this.fov), this.gl.drawingBufferWidth / this.gl.drawingBufferHeight, 1, 0xFFFF);
            GLM.mat4.mul(projection, projection, this.camera.getTransformMatrix());
            return projection;
        }
        getProjectionMatrix() {
            return GLM.mat4.perspective(this.projection, MU.deg2rad(this.fov), this.gl.drawingBufferWidth / this.gl.drawingBufferHeight, 1, 0xFFFF);
        }
        getModelViewMatrix() {
            return this.camera.getTransformMatrix();
        }
        getCamera() {
            return this.camera;
        }
        isClick() {
            return this.click;
        }
        getKeys() {
            return this.keys;
        }
        getForwardMouse() {
            var invertTrans = GLM.mat4.invert(GLM.mat4.create(), this.getCamera().getTransformMatrix());
            var invTP = GLM.mat4.invert(GLM.mat4.create(), this.getProjectionMatrix());
            var invTP = GLM.mat4.mul(invTP, invertTrans, invTP);
            var dx = 2 * this.getX() / this.gl.drawingBufferWidth - 1;
            var dy = 2 * this.getY() / this.gl.drawingBufferHeight - 1;
            var forward = GLM.vec3.transformMat4(GLM.vec3.create(), [dx, -dy, -1], invTP);
            return GLM.vec3.sub(forward, forward, this.getCamera().getPos());
        }
        move(speed) {
            speed *= 8000;
            // Forward movement
            var up = this.keys['W'] | this.keys['UP'];
            var down = this.keys['S'] | this.keys['DOWN'];
            var forward = this.camera.forward();
            GLM.vec3.scale(forward, forward, speed * (up - down));
            var campos = this.camera.getPos();
            GLM.vec3.add(campos, campos, forward);
            // Sideways movement
            var left = this.keys['A'] | this.keys['LEFT'];
            var right = this.keys['D'] | this.keys['RIGHT'];
            var sideways = this.camera.side();
            GLM.vec3.scale(sideways, sideways, speed * (right - left));
            GLM.vec3.add(campos, campos, sideways);
            this.click = false;
            this.camera.setPos(campos);
        }
    }
    exports.Controller3D = Controller3D;
});
