define(["require", "exports", "./structs", "../../../libs/mathutils"], function (require, exports, BS, MU) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getPlayerStart(board) {
        for (var i = 0; i < board.numsprites; i++) {
            var sprite = board.sprites[i];
            if (sprite.lotag == 1)
                return sprite;
        }
        return null;
    }
    exports.getPlayerStart = getPlayerStart;
    class MoveStruct {
    }
    exports.MoveStruct = MoveStruct;
    function getSector(board, ms) {
        if (inSector(board, ms.x, ms.y, ms.sec))
            return ms.sec;
        return -1;
    }
    exports.getSector = getSector;
    function inSector(board, x, y, secnum) {
        x = MU.int(x);
        y = MU.int(y);
        var sec = board.sectors[secnum];
        if (sec == undefined)
            return false;
        var inter = 0;
        for (var w = 0; w < sec.wallnum; w++) {
            var wallidx = w + sec.wallptr;
            var wall = board.walls[wallidx];
            var wall2 = board.walls[wall.point2];
            var dy1 = wall.y - y;
            var dy2 = wall2.y - y;
            if ((dy1 ^ dy2) < 0) {
                var dx1 = wall.x - x;
                var dx2 = wall2.x - x;
                if ((dx1 ^ dx2) >= 0)
                    inter ^= dx1;
                else
                    inter ^= cross(dx1, dy1, dx2, dy2) ^ dy2;
            }
        }
        return (inter >>> 31) == 1;
    }
    exports.inSector = inSector;
    function findSector(board, x, y, secnum = 0) {
        if (secnum == -1)
            return findSectorAll(board, x, y);
        var secs = [secnum];
        for (var i = 0; i < secs.length; i++) {
            secnum = secs[i];
            var sec = board.sectors[secnum];
            if (inSector(board, x, y, secnum))
                return secnum;
            for (var w = 0; w < sec.wallnum; w++) {
                var wallidx = w + sec.wallptr;
                var wall = board.walls[wallidx];
                if (wall.nextsector != -1) {
                    var nextsector = wall.nextsector;
                    if (secs.indexOf(nextsector) == -1)
                        secs.push(nextsector);
                }
            }
        }
        return -1;
    }
    exports.findSector = findSector;
    function findSectorAll(board, x, y) {
        for (var s = 0; s < board.sectors.length; s++) {
            var sec = board.sectors[s];
            if (inSector(board, x, y, s))
                return s;
        }
        return -1;
    }
    function getSprites(board, secnum) {
        var ret = [];
        var sprites = board.sprites;
        for (var i = 0; i < sprites.length; i++) {
            if (sprites[i].sectnum == secnum)
                ret.push(i);
        }
        return ret;
    }
    exports.getSprites = getSprites;
    function groupSprites(sprites) {
        var sec2spr = {};
        for (var s = 0; s < sprites.length; s++) {
            var spr = sprites[s];
            var sprs = sec2spr[spr.sectnum];
            if (sprs == undefined) {
                sprs = [];
                sec2spr[spr.sectnum] = sprs;
            }
            sprs.push(s);
        }
        return sec2spr;
    }
    exports.groupSprites = groupSprites;
    var ANGSCALE = (1 / 4096);
    var ZSCALE = 16;
    function createSlopeCalculator(sector, walls) {
        var wall1 = walls[sector.wallptr];
        var wall2 = walls[wall1.point2];
        var dx = wall2.x - wall1.x;
        var dy = wall2.y - wall1.y;
        var ln = MU.len2d(dx, dy);
        dx /= ln;
        dy /= ln;
        return function (x, y, heinum) {
            var dx1 = x - wall1.x;
            var dy1 = y - wall1.y;
            var k = cross(dx, dy, dx1, dy1);
            return MU.int((heinum * ANGSCALE) * k * ZSCALE);
        };
    }
    exports.createSlopeCalculator = createSlopeCalculator;
    function lineIntersect(x1, y1, z1, x2, y2, z2, x3, y3, x4, y4) {
        var x21 = x2 - x1, x34 = x3 - x4;
        var y21 = y2 - y1, y34 = y3 - y4;
        var bot = cross(x21, y21, x34, y34);
        if (bot == 0)
            return null;
        var x31 = x3 - x1, y31 = y3 - y1;
        var topt = cross(x31, y31, x34, y34);
        if (bot > 0) {
            if ((topt < 0) || (topt >= bot))
                return null;
            var topu = cross(x21, y31, x31, y31);
            if ((topu < 0) || (topu >= bot))
                return null;
        }
        else {
            if ((topt > 0) || (topt <= bot))
                return null;
            var topu = cross(x21, y21, x31, y31);
            if ((topu > 0) || (topu <= bot))
                return null;
        }
        var t = topt / bot;
        var x = x1 + MU.int(x21 * t);
        var y = y1 + MU.int(y21 * t);
        var z = z1 + MU.int((z2 - z1) * t) * ZSCALE;
        return [x, y, z, t];
    }
    exports.lineIntersect = lineIntersect;
    function rayIntersect(x1, y1, z1, vx, vy, vz, x3, y3, x4, y4) {
        var x34 = x3 - x4;
        var y34 = y3 - y4;
        var bot = cross(vx, vy, x34, y34);
        if (bot == 0)
            return null;
        var x31 = x3 - x1;
        var y31 = y3 - y1;
        var topt = cross(x31, y31, x34, y34);
        if (bot > 0) {
            if (topt < 0)
                return null;
            var topu = cross(vx, vy, x31, y31);
            if ((topu < 0) || (topu >= bot))
                return null;
        }
        else {
            if (topt > 0)
                return null;
            var topu = cross(vx, vy, x31, y31);
            if ((topu > 0) || (topu <= bot))
                return null;
        }
        var t = topt / bot;
        var x = x1 + MU.int(vx * t);
        var y = y1 + MU.int(vy * t);
        var z = z1 + MU.int(vz * t) * ZSCALE;
        return [x, y, z, t];
    }
    exports.rayIntersect = rayIntersect;
    class Hitscan {
        constructor(hitx = -1, hity = -1, hitz = -1, hitt = -1, hitsect = -1, hitwall = -1, hitsprite = -1) {
            this.hitx = hitx;
            this.hity = hity;
            this.hitz = hitz;
            this.hitt = hitt;
            this.hitsect = hitsect;
            this.hitwall = hitwall;
            this.hitsprite = hitsprite;
        }
        reset() {
            this.hitsect = -1;
            this.hitwall = -1;
            this.hitsprite = -1;
            this.hitt = -1;
        }
        testHit(x, y, z, t) {
            if (this.hitt == -1 || this.hitt >= t) {
                this.hitx = x;
                this.hity = y;
                this.hitz = z;
                this.hitt = t;
                return true;
            }
            return false;
        }
        hitWall(x, y, z, t, wall) {
            if (this.testHit(x, y, z, t)) {
                this.hitwall = wall;
            }
        }
        hitSect(x, y, z, t, sec) {
            if (this.testHit(x, y, z, t)) {
                this.hitsect = sec;
            }
        }
        hitSprite(x, y, z, t, spr) {
            if (this.testHit(x, y, z, t)) {
                this.hitsprite = spr;
            }
        }
    }
    exports.Hitscan = Hitscan;
    function cross(x1, y1, x2, y2) {
        return x1 * y2 - y1 * x2;
    }
    function dot(x1, y1, x2, y2) {
        return x1 * x2 + y1 * y2;
    }
    function hitSector(board, secId, xs, ys, zs, vx, vy, vz, t, hit) {
        var x = xs + MU.int(vx * t);
        var y = ys + MU.int(vy * t);
        var z = zs + MU.int(vz * t) * ZSCALE;
        if (inSector(board, x, y, secId))
            hit.hitSect(x, y, z, t, secId);
    }
    function intersectSectorPlanes(board, sec, secId, xs, ys, zs, vx, vy, vz, hit) {
        var vl = MU.len2d(vx, vy);
        var nvx = vx / vl;
        var nvy = vy / vl;
        var wall1 = board.walls[sec.wallptr];
        var wall2 = board.walls[wall1.point2];
        var dx = wall2.x - wall1.x;
        var dy = wall2.y - wall1.y;
        var dl = MU.len2d(dx, dy);
        if (dl == 0)
            return;
        var ndx = dx / dl;
        var ndy = dy / dl;
        var angk = cross(ndx, ndy, nvx, nvy);
        var slope = createSlopeCalculator(sec, board.walls);
        var ceilk = sec.ceilingheinum * ANGSCALE * angk;
        var dk = ceilk - vz;
        if (dk > 0) {
            var ceilz = slope(xs, ys, sec.ceilingheinum) + sec.ceilingz;
            var ceildz = (zs - ceilz) / ZSCALE;
            var t = ceildz / dk;
            hitSector(board, secId, xs, ys, zs, vx, vy, vz, t, hit);
        }
        var floork = sec.floorheinum * ANGSCALE * angk;
        var dk = vz - floork;
        if (dk > 0) {
            var floorz = slope(xs, ys, sec.floorheinum) + sec.floorz;
            var floordz = (floorz - zs) / ZSCALE;
            var t = floordz / dk;
            hitSector(board, secId, xs, ys, zs, vx, vy, vz, t, hit);
        }
    }
    function intersectWall(board, sec, wall, wall2, wallId, xs, ys, zs, vx, vy, vz, hit) {
        var x1 = wall.x, y1 = wall.y;
        var x2 = wall2.x, y2 = wall2.y;
        if ((x1 - xs) * (y2 - ys) < (x2 - xs) * (y1 - ys))
            return -1;
        var intersect = rayIntersect(xs, ys, zs, vx, vy, vz, x1, y1, x2, y2);
        if (intersect == null)
            return -1;
        var [ix, iy, iz, it] = intersect;
        var nextsecId = wall.nextsector;
        if (nextsecId == -1 || wall.cstat.masking) {
            hit.hitWall(ix, iy, iz, it, wallId);
            return -1;
        }
        var nextsec = board.sectors[nextsecId];
        var nextslope = createSlopeCalculator(nextsec, board.walls);
        var floorz = nextslope(ix, iy, nextsec.floorheinum) + nextsec.floorz;
        var ceilz = nextslope(ix, iy, nextsec.ceilingheinum) + nextsec.ceilingz;
        if (iz <= ceilz || iz >= floorz) {
            hit.hitWall(ix, iy, iz, it, wallId);
            return -1;
        }
        return nextsecId;
    }
    function intersectSprite(board, artInfo, spr, sprId, xs, ys, zs, vx, vy, vz, hit) {
        var x = spr.x, y = spr.y, z = spr.z;
        var info = artInfo.getInfo(spr.picnum);
        if (spr.cstat.type == BS.FACE) {
            var dx = x - xs;
            var dy = y - ys;
            var vl = MU.sqrLen2d(vx, vy);
            if (vl == 0)
                return;
            var t = dot(vx, vy, dx, dy) / vl;
            if (t <= 0)
                return;
            var intz = zs + MU.int(vz * t) * ZSCALE;
            var h = info.h * spr.yrepeat << 2;
            if (spr.cstat.realCenter)
                z += (h >> 1);
            var yo = info.attrs.yoff;
            z -= yo * spr.yrepeat << 2;
            if ((intz > z) || (intz < z - h))
                return;
            var intx = xs + MU.int(vx * t);
            var inty = ys + MU.int(vy * t);
            var w = (info.w * spr.xrepeat) / 4;
            if (MU.len2d(x - intx, y - inty) > w >> 1)
                return;
            hit.hitSprite(intx, inty, intz, t, sprId);
        }
        else if (spr.cstat.type == BS.WALL) {
        }
        else if (spr.cstat.type == BS.FLOOR) {
        }
    }
    function hitscan(board, artInfo, xs, ys, zs, secId, vx, vy, vz, hit, cliptype) {
        hit.reset();
        if (secId < 0)
            return;
        var stack = [secId];
        var sprites = groupSprites(board.sprites);
        for (var i = 0; i < stack.length; i++) {
            var s = stack[i];
            var sec = board.sectors[s];
            if (sec == undefined)
                break;
            intersectSectorPlanes(board, sec, s, xs, ys, zs, vx, vy, vz, hit);
            var endwall = sec.wallptr + sec.wallnum;
            for (var w = sec.wallptr; w < endwall; w++) {
                var wall = board.walls[w];
                var wall2 = board.walls[wall.point2];
                if (wall == undefined || wall2 == undefined)
                    continue;
                var nextsec = intersectWall(board, sec, wall, wall2, w, xs, ys, zs, vx, vy, vz, hit);
                if (nextsec != -1 && stack.indexOf(nextsec) == -1) {
                    stack.push(nextsec);
                }
            }
            var sprs = sprites[s];
            if (sprs == undefined)
                continue;
            for (var j = 0; j < sprs.length; j++) {
                var sprId = sprs[j];
                var spr = board.sprites[sprId];
                intersectSprite(board, artInfo, spr, sprId, xs, ys, zs, vx, vy, vz, hit);
            }
        }
    }
    exports.hitscan = hitscan;
    function getFirstWallAngle(sector, walls) {
        var w1 = walls[sector.wallptr];
        var w2 = walls[w1.point2];
        var dx = w2.x - w1.x;
        var dy = w2.y - w1.y;
        return Math.atan2(-dy, dx);
    }
    exports.getFirstWallAngle = getFirstWallAngle;
    function wallVisible(wall1, wall2, ms) {
        var dx1 = wall2.x - wall1.x;
        var dy1 = wall2.y - wall1.y;
        var dx2 = ms.x - wall1.x;
        var dy2 = ms.y - wall1.y;
        return cross(dx1, dy1, dx2, dy2) >= 0;
    }
    exports.wallVisible = wallVisible;
});
