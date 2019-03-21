define(["require", "exports", "./buffers", "../../../../libs_js/glmatrix"], function (require, exports, BUFF, GLM) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Buffer {
        get() {
            return this.ptr;
        }
        allocate(vtxCount, triIndexCount, lineIndexCount) {
            if (this.ptr != null) {
                if (this.ptr.vtx.size <= vtxCount && this.ptr.triIdx.size <= triIndexCount && this.ptr.lineIdx.size <= lineIndexCount)
                    return;
                BUFF.remove(this.ptr);
            }
            this.ptr = BUFF.allocate(vtxCount, triIndexCount, lineIndexCount);
        }
        writePos(off, x, y, z) {
            return BUFF.writePos(this.ptr, off, x, y, z);
        }
        writeNormal(off, x, y) {
            return BUFF.writeNormal(this.ptr, off, x, y);
        }
        writeTriangle(off, a, b, c) {
            return BUFF.writeTriangle(this.ptr, off, a, b, c);
        }
        writeQuad(off, a, b, c, d) {
            return BUFF.writeQuad(this.ptr, off, a, b, c, d);
        }
        writeLine(off, a, b) {
            return BUFF.writeLine(this.ptr, off, a, b);
        }
    }
    exports.Buffer = Buffer;
    var Type;
    (function (Type) {
        Type[Type["SURFACE"] = 0] = "SURFACE";
        Type[Type["FACE"] = 1] = "FACE";
    })(Type = exports.Type || (exports.Type = {}));
    class Drawable {
        constructor() {
            this.type = Type.SURFACE;
            this.buff = new Buffer();
            this.trans = 1;
            this.texMat = GLM.mat4.create();
        }
    }
    exports.Drawable = Drawable;
});
