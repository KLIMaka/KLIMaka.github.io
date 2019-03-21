define(["require", "exports", "../../../../libs/bag", "../../../meshbuilder"], function (require, exports, BAG, MB) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BufferPointer {
        constructor(vtx, triIdx, lineIdx) {
            this.vtx = vtx;
            this.triIdx = triIdx;
            this.lineIdx = lineIdx;
        }
    }
    exports.BufferPointer = BufferPointer;
    var pos;
    var posBuf;
    var norm;
    var normBuf;
    var idxs;
    var idxBuf;
    var vtxBag;
    var idxBag;
    function init(gl, vCount, iCount) {
        pos = new Float32Array(vCount * 3);
        posBuf = MB.wrap(gl, pos, 3);
        norm = new Float32Array(vCount * 2);
        normBuf = MB.wrap(gl, norm, 2);
        vtxBag = BAG.createController(vCount, (place, noffset) => {
            pos.set(pos.subarray(place.offset * 3, place.offset * 3 + place.size * 3), noffset * 3);
            norm.set(norm.subarray(place.offset * 2, place.offset * 2 + place.size * 2), noffset * 2);
            var ptr = place.data;
            var offdiff = noffset - place.offset;
            for (var i = 0; i < ptr.triIdx.size; i++) {
                idxs[ptr.triIdx.offset + i] += offdiff;
            }
            for (var i = 0; i < ptr.lineIdx.size; i++) {
                idxs[ptr.lineIdx.offset + i] += offdiff;
            }
        });
        idxs = new Uint16Array(iCount);
        idxBuf = MB.wrapIndexBuffer(gl, idxs);
        idxBag = BAG.createController(iCount, (place, noffset) => {
            idxs.set(idxs.subarray(place.offset, place.offset + place.size), noffset);
        });
    }
    exports.init = init;
    function getPosBuffer() {
        return posBuf;
    }
    exports.getPosBuffer = getPosBuffer;
    function getNormBuffer() {
        return normBuf;
    }
    exports.getNormBuffer = getNormBuffer;
    function getIdxBuffer() {
        return idxBuf;
    }
    exports.getIdxBuffer = getIdxBuffer;
    var vtxRegions = [];
    var nrmRegions = [];
    var idxRegions = [];
    function updateBuffer(gl, buffer, regions) {
        if (regions.length == 0)
            return false;
        for (var i = 0; i < regions.length; i++) {
            var region = regions[i];
            while (i + 1 < regions.length && regions[i + 1][0] == region[0] + region[1]) {
                region[1] += regions[++i][1];
            }
            buffer.updateRegion(gl, region[0], region[1]);
        }
        return true;
    }
    function update(gl) {
        if (updateBuffer(gl, posBuf, vtxRegions))
            vtxRegions = [];
        if (updateBuffer(gl, normBuf, nrmRegions))
            nrmRegions = [];
        if (updateBuffer(gl, idxBuf, idxRegions))
            idxRegions = [];
    }
    exports.update = update;
    function allocate(vtxSize, idxSize, idxLineSize) {
        var vtx = vtxBag.get(vtxSize);
        var idx = idxBag.get(idxSize);
        var line = idxBag.get(idxLineSize);
        var ptr = new BufferPointer(vtx, idx, line);
        vtx.data = ptr;
        return ptr;
    }
    exports.allocate = allocate;
    function remove(ptr) {
        idxBag.put(ptr.triIdx);
        idxBag.put(ptr.lineIdx);
        vtxBag.put(ptr.vtx);
    }
    exports.remove = remove;
    function writePos(ptr, off, x, y, z) {
        var o = ptr.vtx.offset + off;
        pos[o * 3] = x;
        pos[o * 3 + 1] = y;
        pos[o * 3 + 2] = z;
        vtxRegions.push([o, 1]);
        return ++off;
    }
    exports.writePos = writePos;
    function writeNormal(ptr, off, x, y) {
        var o = ptr.vtx.offset + off;
        norm[o * 2] = x;
        norm[o * 2 + 1] = y;
        nrmRegions.push([o, 1]);
        return ++off;
    }
    exports.writeNormal = writeNormal;
    function writeTriangle(ptr, off, a, b, c) {
        var vtxoff = ptr.vtx.offset;
        var o = ptr.triIdx.offset + off;
        idxs[o] = vtxoff + a;
        idxs[o + 1] = vtxoff + b;
        idxs[o + 2] = vtxoff + c;
        idxRegions.push([o, 3]);
        return off + 3;
    }
    exports.writeTriangle = writeTriangle;
    function writeQuad(ptr, off, a, b, c, d) {
        var vtxoff = ptr.vtx.offset;
        var o = ptr.triIdx.offset + off;
        idxs[o] = vtxoff + a;
        idxs[o + 1] = vtxoff + c;
        idxs[o + 2] = vtxoff + b;
        idxs[o + 3] = vtxoff + a;
        idxs[o + 4] = vtxoff + d;
        idxs[o + 5] = vtxoff + c;
        idxRegions.push([o, 6]);
        return off + 6;
    }
    exports.writeQuad = writeQuad;
    function writeLine(ptr, off, a, b) {
        var vtxoff = ptr.vtx.offset;
        var o = ptr.lineIdx.offset + off;
        idxs[o] = vtxoff + a;
        idxs[o + 1] = vtxoff + b;
        idxRegions.push([o, 2]);
        return off + 2;
    }
    exports.writeLine = writeLine;
});
