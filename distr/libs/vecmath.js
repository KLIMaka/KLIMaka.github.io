define(["require", "exports", '../libs_js/glmatrix', './pool', './mathutils'], function (require, exports, GLM, pool, MU) {
    var vec2dPool = new pool.Pool(100, GLM.vec2.create);
    var vec3dPool = new pool.Pool(100, GLM.vec3.create);
    function release2d(vec) {
        vec2dPool.ret(vec);
    }
    exports.release2d = release2d;
    function release3d(vec) {
        vec3dPool.ret(vec);
    }
    exports.release3d = release3d;
    function detach2d(vec) {
        var ret = GLM.vec2.clone(vec);
        vec2dPool.ret(vec);
        return ret;
    }
    exports.detach2d = detach2d;
    function detach3d(vec) {
        var ret = GLM.vec3.clone(vec);
        vec3dPool.ret(vec);
        return ret;
    }
    exports.detach3d = detach3d;
    function create2d() {
        return vec2dPool.get();
    }
    exports.create2d = create2d;
    function fromValues2d(x, y) {
        var vec = vec2dPool.get();
        GLM.vec2.set(vec, x, y);
        return vec;
    }
    exports.fromValues2d = fromValues2d;
    function create3d() {
        return vec3dPool.get();
    }
    exports.create3d = create3d;
    function fromValues3d(x, y, z) {
        var vec = vec3dPool.get();
        GLM.vec3.set(vec, x, y, z);
        return vec;
    }
    exports.fromValues3d = fromValues3d;
    function add2d(lh, rh) {
        return GLM.vec2.add(lh, lh, rh);
    }
    exports.add2d = add2d;
    function addCopy2d(lh, rh) {
        return GLM.vec2.add(vec2dPool.get(), lh, rh);
    }
    exports.addCopy2d = addCopy2d;
    function add3d(lh, rh) {
        return GLM.vec3.add(lh, lh, rh);
    }
    exports.add3d = add3d;
    function addCopy3d(lh, rh) {
        return GLM.vec3.add(vec3dPool.get(), lh, rh);
    }
    exports.addCopy3d = addCopy3d;
    function sub2d(lh, rh) {
        return GLM.vec2.sub(lh, lh, rh);
    }
    exports.sub2d = sub2d;
    function subCopy2d(lh, rh) {
        return GLM.vec2.sub(vec2dPool.get(), lh, rh);
    }
    exports.subCopy2d = subCopy2d;
    function sub3d(lh, rh) {
        return GLM.vec3.sub(lh, lh, rh);
    }
    exports.sub3d = sub3d;
    function subCopy3d(lh, rh) {
        return GLM.vec3.sub(vec3dPool.get(), lh, rh);
    }
    exports.subCopy3d = subCopy3d;
    function mul2d(lh, rh) {
        return GLM.vec2.mul(lh, lh, rh);
    }
    exports.mul2d = mul2d;
    function mulCopy2d(lh, rh) {
        return GLM.vec2.mul(vec2dPool.get(), lh, rh);
    }
    exports.mulCopy2d = mulCopy2d;
    function mul3d(lh, rh) {
        return GLM.vec3.mul(lh, lh, rh);
    }
    exports.mul3d = mul3d;
    function mulCopy3d(lh, rh) {
        return GLM.vec3.mul(vec3dPool.get(), lh, rh);
    }
    exports.mulCopy3d = mulCopy3d;
    function normalizeCopy2d(vec) {
        return GLM.vec2.normalize(vec2dPool.get(), vec);
    }
    exports.normalizeCopy2d = normalizeCopy2d;
    function normalize2d(vec) {
        return GLM.vec2.normalize(vec, vec);
    }
    exports.normalize2d = normalize2d;
    function normalizeCopy3d(vec) {
        return GLM.vec3.normalize(vec3dPool.get(), vec);
    }
    exports.normalizeCopy3d = normalizeCopy3d;
    function normalize3d(vec) {
        return GLM.vec3.normalize(vec, vec);
    }
    exports.normalize3d = normalize3d;
    function dot2d(lh, rh) {
        return GLM.vec2.dot(lh, rh);
    }
    exports.dot2d = dot2d;
    function dot3d(lh, rh) {
        return GLM.vec3.dot(lh, rh);
    }
    exports.dot3d = dot3d;
    function cross3d(lh, rh) {
        return GLM.vec3.cross(lh, lh, rh);
    }
    exports.cross3d = cross3d;
    function crossCopy3d(lh, rh) {
        return GLM.vec3.cross(vec3dPool.get(), lh, rh);
    }
    exports.crossCopy3d = crossCopy3d;
    function lerp2d(lh, rh, t) {
        return GLM.vec2.lerp(lh, lh, rh, t);
    }
    exports.lerp2d = lerp2d;
    function lerpCopy2d(lh, rh, t) {
        return GLM.vec2.lerp(vec2dPool.get(), lh, rh, t);
    }
    exports.lerpCopy2d = lerpCopy2d;
    function lerp3d(lh, rh, t) {
        return GLM.vec3.lerp(lh, lh, rh, t);
    }
    exports.lerp3d = lerp3d;
    function lerpCopy3d(lh, rh, t) {
        return GLM.vec3.lerp(vec3dPool.get(), lh, rh, t);
    }
    exports.lerpCopy3d = lerpCopy3d;
    function scale2d(vec, scale) {
        return GLM.vec2.scale(vec, vec, scale);
    }
    exports.scale2d = scale2d;
    function len3d(vec) {
        return GLM.vec3.len(vec);
    }
    exports.len3d = len3d;
    function intersect2d(p1s, p1e, p2s, p2e) {
        var t = intersect2dT(p1s, p1e, p2s, p2e);
        if (t == null)
            return null;
        return lerpCopy2d(p1s, p1e, t);
    }
    exports.intersect2d = intersect2d;
    function intersect2dT(p1s, p1e, p2s, p2e) {
        var d = (p1s[0] - p1e[0]) * (p2s[1] - p2e[1]) - (p1s[1] - p1e[1]) * (p2s[0] - p2e[0]);
        if (Math.abs(d) < MU.EPS)
            return null;
        var res0 = ((p1s[0] * p1e[1] - p1s[1] * p1e[0]) * (p2s[0] - p2e[0]) - (p1s[0] - p1e[0]) * (p2s[0] * p2e[1] - p2s[1] * p2e[0])) / d;
        var res1 = ((p1s[0] * p1e[1] - p1s[1] * p1e[0]) * (p2s[1] - p2e[1]) - (p1s[1] - p1e[1]) * (p2s[0] * p2e[1] - p2s[1] * p2e[0])) / d;
        var dx1 = p1e[0] - p1s[0];
        var dy1 = p1e[1] - p1s[1];
        var dot1 = ((res0 - p1s[0]) * dx1 + (res1 - p1s[1]) * dy1) / MU.sqrLen2d(dx1, dy1);
        if (dot1 < 0.0 || dot1 > 1.0)
            return null;
        var dx2 = p2e[0] - p2s[0];
        var dy2 = p2e[1] - p2s[1];
        var dot2 = ((res0 - p2s[0]) * dx2 + (res1 - p2s[1]) * dy2) / MU.sqrLen2d(dx2, dy2);
        if (dot2 < 0.0 || dot2 > 1.0)
            return null;
        return dot1;
    }
    exports.intersect2dT = intersect2dT;
    function direction3d(ps, pe) {
        return normalize3d(subCopy3d(pe, ps));
    }
    exports.direction3d = direction3d;
    function direction2d(ps, pe) {
        return normalize2d(subCopy2d(pe, ps));
    }
    exports.direction2d = direction2d;
    function projectXY(p) { return fromValues2d(p[0], p[1]); }
    exports.projectXY = projectXY;
    function projectXZ(p) { return fromValues2d(p[0], p[2]); }
    exports.projectXZ = projectXZ;
    function projectYZ(p) { return fromValues2d(p[1], p[2]); }
    exports.projectYZ = projectYZ;
    function intersect3d(p1s, p1e, p2s, p2e) {
        var dir1 = direction3d(p1s, p1e);
        var dir2 = direction3d(p2s, p2e);
        var p = (dir1[1] * dir2[0] - dir2[1] * dir1[0]) != 0 ? projectXY :
            (dir1[0] * dir2[1] - dir2[0] * dir1[1]) != 0 ? projectXZ :
                (dir1[1] * dir2[2] - dir2[1] * dir1[2]) != 0 ? projectYZ :
                    null;
        release3d(dir1);
        release3d(dir2);
        if (p == null)
            return null;
        var p1s_ = p(p1s);
        var p2s_ = p(p2s);
        var p1e_ = p(p1e);
        var p2e_ = p(p2e);
        var t = intersect2dT(p1s_, p1e_, p2s_, p2e_);
        release2d(p1s_);
        release2d(p2s_);
        release2d(p1e_);
        release2d(p2e_);
        if (t == null)
            return null;
        return lerpCopy3d(p1s, p1e, t);
    }
    exports.intersect3d = intersect3d;
    function normal2d(v1, v2) {
        var tmp = normalize2d(subCopy2d(v2, v1));
        var norm = fromValues2d(-tmp[1], tmp[0]);
        release2d(tmp);
        return norm;
    }
    exports.normal2d = normal2d;
    //
    //   p1     p3
    //    \ ang /
    //     \ ^ /
    //      \ /
    //      p2
    function ang2d(p1, p2, p3) {
        var toNext = subCopy2d(p3, p2);
        normalize2d(toNext);
        var toPrev = subCopy2d(p1, p2);
        normalize2d(toPrev);
        var angToNext = Math.acos(toNext[0]);
        angToNext = toNext[1] < 0 ? MU.PI2 - angToNext : angToNext;
        var angToPrev = Math.acos(toPrev[0]);
        angToPrev = toPrev[1] < 0 ? MU.PI2 - angToPrev : angToPrev;
        release2d(toNext);
        release2d(toPrev);
        var ang = angToNext - angToPrev;
        ang = (ang < 0 ? MU.PI2 + ang : ang);
        return ang;
    }
    exports.ang2d = ang2d;
    function isCW(polygon) {
        var angsum = 0;
        var N = polygon.length;
        for (var i = 0; i < N; i++) {
            var curr = polygon[i];
            var prev = polygon[i == 0 ? N - 1 : i - 1];
            var next = polygon[i == N - 1 ? 0 : i + 1];
            angsum += ang2d(prev, curr, next);
        }
        return MU.rad2deg(angsum) == 180 * (N - 2);
    }
    exports.isCW = isCW;
    function polygonNormal(verts) {
        var a = subCopy3d(verts[1], verts[0]);
        var b = subCopy3d(verts[2], verts[0]);
        var res = normalize3d(crossCopy3d(b, a));
        release3d(a);
        release3d(b);
        return res;
    }
    exports.polygonNormal = polygonNormal;
    function findOther(vtxs, start, v1, v2) {
        var vec = subCopy3d(vtxs[v1], vtxs[v2]);
        var len = vtxs.length;
        for (var i = 0; i < len; i++) {
            var v3 = MU.cyclic(start + i, len);
            var vec1 = subCopy3d(vtxs[v1], vtxs[v3]);
            var d = dot3d(vec1, vec) / (len3d(vec) * len3d(vec1));
            if (Math.abs(Math.abs(d) - 1.0) < MU.EPS)
                continue;
            release3d(vec);
            release3d(vec1);
            return v3;
        }
    }
    function findOrigin(vtxs) {
        var len = vtxs.length;
        var res = [2, 0, 1];
        var maxlen = 0;
        for (var i = 0; i < len; i++) {
            var next2 = MU.cyclic(i + 2, len);
            var next = MU.cyclic(i + 1, len);
            var vi = vtxs[i];
            var vn = vtxs[next];
            var d = subCopy3d(vi, vn);
            var dl = len3d(d);
            if (((d[0] == 0 && d[1] == 0) || (d[0] == 0 && d[2] == 0) || (d[1] == 0 && d[2] == 0)) && dl > maxlen) {
                maxlen = dl;
                res = [next2, i, next];
            }
            release3d(d);
        }
        return [findOther(vtxs, res[0], res[1], res[2]), res[1], res[2]];
    }
    function projectionSpace(vtxs) {
        var o = findOrigin(vtxs);
        var a = subCopy3d(vtxs[o[1]], vtxs[o[2]]);
        var b = subCopy3d(vtxs[o[1]], vtxs[o[0]]);
        var n = normalize3d(crossCopy3d(b, a));
        var c = normalize3d(crossCopy3d(n, a));
        normalize3d(a);
        var ret = [
            a[0], c[0], n[0],
            a[1], c[1], n[1],
            a[2], c[2], n[2]
        ];
        release3d(a);
        release3d(b);
        release3d(n);
        release3d(c);
        return ret;
    }
    exports.projectionSpace = projectionSpace;
    function project3d(vtxs) {
        var mat = projectionSpace(vtxs);
        var ret = [];
        for (var i = 0; i < vtxs.length; i++) {
            var vtx = GLM.vec3.transformMat3(GLM.vec3.create(), vtxs[i], mat);
            ret.push([vtx[0], vtx[1]]);
        }
        return ret;
    }
    exports.project3d = project3d;
});
