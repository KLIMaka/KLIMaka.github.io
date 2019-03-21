define(["require", "exports", "./../libs_js/glmatrix", "./../libs/mathutils"], function (require, exports, GLM, MU) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Camera {
        constructor(x, y, z, ax, ay) {
            this.needUpdate = true;
            this.transform = GLM.mat4.create();
            this.pos = GLM.vec3.fromValues(x, y, z);
            this.angleX = ax;
            this.angleY = ay;
        }
        setPos(pos) {
            this.pos = pos;
            this.needUpdate = true;
        }
        setPosXYZ(x, y, z) {
            GLM.vec3.set(this.pos, x, y, z);
            this.needUpdate = true;
        }
        getPos() {
            return this.pos;
        }
        forward() {
            var mat4 = this.getTransformMatrix();
            return GLM.vec3.fromValues(-mat4[2], -mat4[6], -mat4[10]);
        }
        side() {
            var mat4 = this.getTransformMatrix();
            return GLM.vec3.fromValues(mat4[0], mat4[4], mat4[8]);
        }
        updateAngles(dx, dy) {
            this.angleY -= dx;
            this.angleX -= dy;
            this.angleX = Math.max(-90, Math.min(90, this.angleX));
            this.needUpdate = true;
        }
        setAngles(ax, ay) {
            this.angleX = Math.max(-90, Math.min(90, ax));
            this.angleY = ay;
            this.needUpdate = true;
        }
        getTransformMatrix() {
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
        }
    }
    exports.Camera = Camera;
});
