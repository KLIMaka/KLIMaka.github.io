define(["require", "exports", './../libs_js/glmatrix', './../libs/mathutils'], function(require, exports, GLM, MU) {
    var Camera = (function () {
        function Camera(x, y, z, ax, ay) {
            this.needUpdate = true;
            this.transform = GLM.mat4.create();
            this.pos = GLM.vec3.fromValues(x, y, z);
            this.angleX = ax;
            this.angleY = ay;
        }
        Camera.prototype.setPos = function (pos) {
            this.pos = pos;
            this.needUpdate = true;
        };

        Camera.prototype.setPosXYZ = function (x, y, z) {
            GLM.vec3.set(this.pos, x, y, z);
            this.needUpdate = true;
        };

        Camera.prototype.getPos = function () {
            return this.pos;
        };

        Camera.prototype.forward = function () {
            var mat4 = this.getTransformMatrix();
            return GLM.vec3.fromValues(-mat4[2], -mat4[6], -mat4[10]);
        };

        Camera.prototype.side = function () {
            var mat4 = this.getTransformMatrix();
            return GLM.vec3.fromValues(mat4[0], mat4[4], mat4[8]);
        };

        Camera.prototype.updateAngles = function (dx, dy) {
            this.angleY -= dx;
            this.angleX -= dy;
            this.angleX = Math.max(-90, Math.min(90, this.angleX));
            this.needUpdate = true;
        };

        Camera.prototype.setAngles = function (ax, ay) {
            this.angleX = Math.max(-90, Math.min(90, ax));
            this.angleY = ay;
            this.needUpdate = true;
        };

        Camera.prototype.getTransformMatrix = function () {
            var mat = this.transform;
            var pos = this.pos;
            if (this.needUpdate) {
                GLM.mat4.identity(mat);
                GLM.mat4.rotateX(mat, mat, MU.deg2rad(-this.angleX));
                GLM.mat4.rotateY(mat, mat, MU.deg2rad(-this.angleY));
                GLM.vec3.negate(pos, pos);
                GLM.mat4.translate(mat, mat, pos);
                GLM.vec3.negate(pos, pos);
                this.needUpdate = false;
            }
            return mat;
        };
        return Camera;
    })();
    exports.Camera = Camera;
});
