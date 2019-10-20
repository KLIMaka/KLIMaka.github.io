define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.radsInDeg = 180 / Math.PI;
    exports.degInRad = Math.PI / 180;
    exports.PI2 = Math.PI * 2;
    exports.EPS = 1e-9;
    function deg2rad(deg) {
        return deg * exports.degInRad;
    }
    exports.deg2rad = deg2rad;
    function rad2deg(rad) {
        return rad * exports.radsInDeg;
    }
    exports.rad2deg = rad2deg;
    function sign(x) {
        return x > 0 ? 1 : x < 0 ? -1 : 0;
    }
    exports.sign = sign;
    function int(x) {
        return x | 0;
    }
    exports.int = int;
    function ispow2(x) {
        return (x & (x - 1)) == 0;
    }
    exports.ispow2 = ispow2;
    function fract(x) {
        return x - int(x);
    }
    exports.fract = fract;
    function nextpow2(x) {
        --x;
        for (var i = 1; i < 32; i <<= 1) {
            x = x | x >> i;
        }
        return x + 1;
    }
    exports.nextpow2 = nextpow2;
    function sqrLen2d(x, y) {
        return x * x + y * y;
    }
    exports.sqrLen2d = sqrLen2d;
    function len2d(x, y) {
        return Math.sqrt(x * x + y * y);
    }
    exports.len2d = len2d;
    function len3d(x, y, z) {
        return Math.sqrt(x * x + y * y + z * z);
    }
    exports.len3d = len3d;
    function ang(x, y) {
        if (x > 0 && y >= 0)
            return Math.atan(x / y);
        else if (x > 0 && y < 0)
            return Math.atan(x / y) + 2 * Math.PI;
        else if (x < 0)
            return Math.atan(x / y) + Math.PI;
        else if (x == 0 && y > 0)
            return Math.PI / 2;
        else if (x == 0 && y < 0)
            return (3 * Math.PI) / 2;
        else
            return null;
    }
    exports.ang = ang;
    function cyclic(x, max) {
        return x > 0 ? (x % max) : (max + x % max);
    }
    exports.cyclic = cyclic;
    function ubyte2byte(n) {
        var minus = (n & 0x80) != 0;
        return minus ? -(~n & 0xFF) - 1 : n;
    }
    exports.ubyte2byte = ubyte2byte;
    class BBox {
        constructor(minx, maxx, miny, maxy, minz, maxz) {
            this.minx = minx;
            this.maxx = maxx;
            this.miny = miny;
            this.maxy = maxy;
            this.minz = minz;
            this.maxz = maxz;
        }
        grow(bbox) {
            this.minx = Math.min(this.minx, bbox.minx);
            this.miny = Math.min(this.miny, bbox.miny);
            this.minz = Math.min(this.minz, bbox.minz);
            this.maxx = Math.max(this.maxx, bbox.maxx);
            this.maxy = Math.max(this.maxy, bbox.maxy);
            this.maxz = Math.max(this.maxz, bbox.maxz);
            return this;
        }
    }
    exports.BBox = BBox;
    function bbox(vtxs) {
        var minx = vtxs[0][0];
        var maxx = vtxs[0][0];
        var miny = vtxs[0][1];
        var maxy = vtxs[0][1];
        var minz = vtxs[0][2];
        var maxz = vtxs[0][2];
        var len = vtxs.length;
        for (var i = 0; i < len; i++) {
            var v = vtxs[i];
            minx = Math.min(v[0], minx);
            miny = Math.min(v[1], miny);
            minz = Math.min(v[2], minz);
            maxx = Math.max(v[0], maxx);
            maxy = Math.max(v[1], maxy);
            maxz = Math.max(v[2], maxz);
        }
        return new BBox(minx, maxx, miny, maxy, minz, maxz);
    }
    exports.bbox = bbox;
    function int2vec4(int) {
        return [(int & 0xff), ((int >>> 8) & 0xff), ((int >>> 16) & 0xff), ((int >>> 24) & 0xff)];
    }
    exports.int2vec4 = int2vec4;
    function int2vec4norm(int) {
        return [(int & 0xff) / 256, ((int >>> 8) & 0xff) / 256, ((int >>> 16) & 0xff) / 256, ((int >>> 24) & 0xff) / 256];
    }
    exports.int2vec4norm = int2vec4norm;
});
