define(["require", "exports", "../libs_js/glmatrix", "./mathutils"], function (require, exports, GLM, MU) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function intersect2d(p1s, p1e, p2s, p2e) {
        var t = intersect2dT(p1s, p1e, p2s, p2e);
        if (t == null)
            return null;
        return GLM.vec2.lerp(GLM.vec2.create(), p1s, p1e, t);
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
        var dir = GLM.vec3.sub(GLM.vec3.create(), pe, ps);
        return GLM.vec3.normalize(dir, dir);
    }
    exports.direction3d = direction3d;
    function direction2d(ps, pe) {
        var dir = GLM.vec2.sub(GLM.vec2.create(), pe, ps);
        return GLM.vec2.normalize(dir, dir);
    }
    exports.direction2d = direction2d;
    function projectXY(p) { return GLM.vec2.fromValues(p[0], p[1]); }
    exports.projectXY = projectXY;
    function projectXZ(p) { return GLM.vec2.fromValues(p[0], p[2]); }
    exports.projectXZ = projectXZ;
    function projectYZ(p) { return GLM.vec2.fromValues(p[1], p[2]); }
    exports.projectYZ = projectYZ;
    function intersect3d(p1s, p1e, p2s, p2e) {
        var dir1 = direction3d(p1s, p1e);
        var dir2 = direction3d(p2s, p2e);
        var p = (dir1[1] * dir2[0] - dir2[1] * dir1[0]) != 0 ? projectXY :
            (dir1[0] * dir2[1] - dir2[0] * dir1[1]) != 0 ? projectXZ :
                (dir1[1] * dir2[2] - dir2[1] * dir1[2]) != 0 ? projectYZ :
                    null;
        if (p == null)
            return null;
        var p1s_ = p(p1s);
        var p2s_ = p(p2s);
        var p1e_ = p(p1e);
        var p2e_ = p(p2e);
        var t = intersect2dT(p1s_, p1e_, p2s_, p2e_);
        if (t == null)
            return null;
        return GLM.vec3.lerp(GLM.vec3.create(), p1s, p1e, t);
    }
    exports.intersect3d = intersect3d;
});
/*
export function normal2d(v1:GLM.Vec2Array, v2:GLM.Vec2Array):GLM.Vec2Array {
  var tmp = normalize2d(subCopy2d(v2, v1));
  var norm = fromValues2d(-tmp[1], tmp[0]);
  release2d(tmp);
  return norm;
}

//
//   p1     p3
//    \ ang /
//     \ ^ /
//      \ /
//      p2
export function ang2d(p1:GLM.Vec2Array, p2:GLM.Vec2Array, p3:GLM.Vec2Array):number {
  var toNext = subCopy2d(p3, p2); normalize2d(toNext);
  var toPrev = subCopy2d(p1, p2); normalize2d(toPrev);
  var angToNext = Math.acos(toNext[0]);
  angToNext = toNext[1] < 0 ? MU.PI2 - angToNext : angToNext;
  var angToPrev = Math.acos(toPrev[0]);
  angToPrev = toPrev[1] < 0 ? MU.PI2 - angToPrev : angToPrev;
  release2d(toNext); release2d(toPrev);
  var ang = angToNext - angToPrev;
  ang = (ang < 0 ? MU.PI2 + ang : ang);
  return ang;
}

export function isCW(polygon:GLM.VecArray[]):boolean {
  var angsum = 0;
  var N = polygon.length;
  for (var i = 0; i < N; i++) {
    var curr = polygon[i];
    var prev = polygon[i == 0 ? N - 1 : i - 1];
    var next = polygon[i == N - 1 ? 0 : i + 1];
    angsum += ang2d(prev, curr, next);
  }
  return MU.rad2deg(angsum) == 180*(N-2);
}

export function polygonNormal(verts:GLM.Vec3Array[]) {
  var a = subCopy3d(verts[1], verts[0]);
  var b = subCopy3d(verts[2], verts[0]);
  var res = normalize3d(crossCopy3d(b, a));
  release3d(a); release3d(b);
  return res;
}

export function projectionSpace(vtxs:GLM.Vec3Array[], n:GLM.Vec3Array) {
  var a = normalize3d(subCopy3d(vtxs[0], vtxs[1]));
  var c = normalize3d(crossCopy3d(n, a));
  var ret = [
    a[0], c[0], n[0],
    a[1], c[1], n[1],
    a[2], c[2], n[2]
  ];
  release3d(a); release3d(c);
  return ret;
}

export function project3d(vtxs:GLM.Vec3Array[], normal:GLM.Vec3Array):GLM.Vec2Array[] {
  var mat = projectionSpace(vtxs, normal);
  var ret = [];
  for (var i = 0; i < vtxs.length; i++) {
    var vtx = GLM.vec3.transformMat3(GLM.vec3.create(), vtxs[i], mat);
    ret.push([vtx[0], vtx[1]]);
  }
  return ret;
}
*/
