define(["require", "exports", './camera', '../libs_js/glmatrix', '../libs/mathutils'], function(require, exports, camera, GLM, MU) {
    function mapKeyCode(code) {
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
        return named[code] || (code >= 65 && code <= 90 ? String.fromCharCode(code) : null);
    }

    var Controller3D = (function () {
        function Controller3D(gl) {
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
            this.gl.canvas.addEventListener('mousemove', function (e) {
                return self.mousemove(e);
            });
            this.gl.canvas.addEventListener('mouseup', function (e) {
                return self.mouseup(e);
            });
            this.gl.canvas.addEventListener('mousedown', function (e) {
                return self.mousedown(e);
            });
            this.gl.canvas.addEventListener('mousewheel', function (e) {
                return self.mousewheel(e);
            });

            document.addEventListener('keyup', function (e) {
                return self.keyup(e);
            });
            document.addEventListener('keydown', function (e) {
                return self.keydown(e);
            });
        }
        Controller3D.prototype.mousemove = function (e) {
            if (this.drag) {
                this.camera.updateAngles(e.x - this.oldX, e.y - this.oldY);
            }
            this.oldX = e.x;
            this.oldY = e.y;
            return false;
        };

        Controller3D.prototype.mouseup = function (e) {
            this.drag = false;
            this.click = true;
            return false;
        };

        Controller3D.prototype.mousedown = function (e) {
            this.drag = true;
            return false;
        };

        Controller3D.prototype.mousewheel = function (e) {
            this.fov += -e.wheelDelta / 60;
            return false;
        };

        Controller3D.prototype.keydown = function (e) {
            if (!e.altKey && !e.ctrlKey && !e.metaKey) {
                var key = mapKeyCode(e.keyCode);
                if (key)
                    this.keys[key] = true;
                this.keys[e.keyCode] = true;
            }
            return false;
        };

        Controller3D.prototype.keyup = function (e) {
            if (!e.altKey && !e.ctrlKey && !e.metaKey) {
                var key = mapKeyCode(e.keyCode);
                if (key)
                    this.keys[key] = false;
                this.keys[e.keyCode] = false;
            }
            return false;
        };

        Controller3D.prototype.getX = function () {
            return this.oldX;
        };

        Controller3D.prototype.getY = function () {
            return this.oldY;
        };

        Controller3D.prototype.getMatrix = function () {
            var projection = this.projection;
            GLM.mat4.perspective(projection, MU.deg2rad(this.fov), this.gl.drawingBufferWidth / this.gl.drawingBufferHeight, 1, 0xFFFF);
            GLM.mat4.mul(projection, projection, this.camera.getTransformMatrix());
            return projection;
        };

        Controller3D.prototype.getProjectionMatrix = function () {
            return GLM.mat4.perspective(this.projection, MU.deg2rad(this.fov), this.gl.drawingBufferWidth / this.gl.drawingBufferHeight, 1, 0xFFFF);
        };

        Controller3D.prototype.getModelViewMatrix = function () {
            return this.camera.getTransformMatrix();
        };

        Controller3D.prototype.getCamera = function () {
            return this.camera;
        };

        Controller3D.prototype.isClick = function () {
            return this.click;
        };

        Controller3D.prototype.move = function (speed) {
            speed *= 8000;

            var up = this.keys['W'] | this.keys['UP'];
            var down = this.keys['S'] | this.keys['DOWN'];
            var forward = this.camera.forward();
            GLM.vec3.scale(forward, forward, speed * (up - down));
            var campos = this.camera.getPos();
            GLM.vec3.add(campos, campos, forward);

            var left = this.keys['A'] | this.keys['LEFT'];
            var right = this.keys['D'] | this.keys['RIGHT'];
            var sideways = this.camera.side();
            GLM.vec3.scale(sideways, sideways, speed * (right - left));
            GLM.vec3.add(campos, campos, sideways);

            this.click = false;
            this.camera.setPos(campos);
        };

        Controller3D.prototype.move1 = function (speed) {
            speed *= 8000;
            var moveVec = this.moveVec;

            var forward = this.camera.forward();
            moveVec[0] = forward[0];
            moveVec[1] = forward[2];
            var up = this.keys['W'] | this.keys['UP'];
            var down = this.keys['S'] | this.keys['DOWN'];
            GLM.vec2.normalize(moveVec, moveVec);
            GLM.vec2.scale(moveVec, moveVec, speed * (up - down));

            var left = this.keys['A'] | this.keys['LEFT'];
            var right = this.keys['D'] | this.keys['RIGHT'];
            this.camera.updateAngles(-(left * speed / 70) + (right * speed / 70), 0);

            this.click = false;
            return moveVec;
        };
        return Controller3D;
    })();
    exports.Controller3D = Controller3D;
});
