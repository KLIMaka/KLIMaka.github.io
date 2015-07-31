define(["require", "exports", '../../../libs/mathutils', '../../../libs/vecmath'], function(require, exports, MU, VEC) {
    function getPlayerStart(board) {
        for (var i = 0; i < board.numsprites; i++) {
            var sprite = board.sprites[i];
            if (sprite.lotag == 1)
                return sprite;
        }
        return null;
    }
    exports.getPlayerStart = getPlayerStart;

    var MoveStruct = (function () {
        function MoveStruct() {
        }
        return MoveStruct;
    })();
    exports.MoveStruct = MoveStruct;

    function getSector(board, ms) {
        if (exports.inSector(board, ms.x, ms.y, ms.sec))
            return ms.sec;
        return -1;
    }
    exports.getSector = getSector;

    function inSector(board, x, y, secnum) {
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
            if (dy1 == 0 || dy2 == 0)
                continue;

            if (MU.sign(dy1) != MU.sign(dy2)) {
                var d = dy1 / (wall.y - wall2.y);
                var ix = wall.x + d * (wall2.x - wall.x);
                if (ix < x)
                    inter++;
            }
        }
        return inter % 2 != 0;
    }
    exports.inSector = inSector;

    function findSector(board, x, y, secnum) {
        if (typeof secnum === "undefined") { secnum = 0; }
        if (secnum == -1)
            secnum = 0;
        var secs = [secnum];
        for (var i = 0; i < secs.length; i++) {
            secnum = secs[i];
            var sec = board.sectors[secnum];
            if (exports.inSector(board, x, y, secnum))
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

    var UNITS2DEG = (1 / 4096);
    var SCALE = -16;

    function createSlopeCalculator(sector, walls) {
        var wall1 = walls[sector.wallptr];
        var wall2 = walls[wall1.point2];

        var normal = VEC.fromValues2d(-(wall2.y - wall1.y), wall2.x - wall1.x);
        normal = VEC.detach2d(normal);
        VEC.normalize2d(normal);
        var wall1Vec = VEC.fromValues2d(wall1.x, wall1.y);
        var w = -VEC.dot2d(normal, wall1Vec);
        VEC.release2d(wall1Vec);

        return function (x, y, rotation) {
            var vec = VEC.fromValues2d(x, y);
            var dist = VEC.dot2d(normal, vec) + w;
            VEC.release2d(vec);
            return -(rotation * UNITS2DEG) * dist * SCALE;
        };
    }
    exports.createSlopeCalculator = createSlopeCalculator;

    var SectorIntersect = (function () {
        function SectorIntersect(t, wall, point) {
            this.t = t;
            this.wall = wall;
            this.point = point;
        }
        return SectorIntersect;
    })();

    function traceSector(board, secnum, sx, sy, ex, ey) {
        var walls = board.walls;
        var sectors = board.sectors;
        var p1s = [sx, sy];
        var p1e = [ex, ey];
        var inter = new SectorIntersect(100.0, null, [0, 0]);

        var sec = sectors[secnum];
        var slope = exports.createSlopeCalculator(sec, walls);
        var ceilingheinum = sec.ceilingheinum;
        var ceilingz = sec.ceilingz;
        var floorheinum = sec.floorheinum;
        var floorz = sec.floorz;

        for (var w = 0; w < sec.wallnum; w++) {
            var wallidx = sec.wallptr + w;
            var wall = walls[wallidx];
            var wall2 = walls[wall.point2];
            var x1 = wall.x;
            var y1 = wall.y;
            var x2 = wall2.x;
            var y2 = wall2.y;

            var t = VEC.intersect2dT(p1s, p1e, [x1, y1], [x2, y2]);
            if (t == null)
                continue;

            if (t < inter.t) {
                inter.point = VEC.detach2d(VEC.lerp2d(p1s, p1e, t));
                inter.t = t;
                inter.wall = wall;
            }
        }
        return inter.t <= 1.0 ? inter : null;
    }

    function move(board, ms, dx, dy) {
        if (dx == 0 && dy == 0)
            return;

        var cursecnum = exports.getSector(board, ms);
        if (cursecnum == -1)
            return;

        var walls = board.walls;
        var sectors = board.sectors;
        var nx = ms.x + dx;
        var ny = ms.y + dy;

        var enterwallnum = null;
        while (cursecnum != -1) {
            ms.sec = cursecnum;
            var inter = traceSector(board, cursecnum, ms.x, ms.y, nx, ny);

            if (inter != null) {
                cursecnum = inter.wall.nextsector;
                enterwallnum = inter.wall.nextwall;

                if (cursecnum != -1) {
                    var nsector = sectors[cursecnum];
                    var nslope = exports.createSlopeCalculator(nsector, walls);
                    var nf = nslope(inter.point[0], inter.point[1], nsector.floorheinum) + nsector.floorz;
                    var diff = ms.z - nf;
                    if (diff > 8192)
                        cursecnum = -1;
                }

                if (cursecnum == -1) {
                    var interwall2 = walls[inter.wall.point2];
                    var normal = VEC.normal2d([inter.wall.x, inter.wall.y], [interwall2.x, interwall2.y]);
                    inter.point = VEC.add2d(inter.point, VEC.scale2d(normal, 64));
                    VEC.release2d(normal);
                }

                ms.x = inter.point[0];
                ms.y = inter.point[1];
            } else {
                ms.x = nx;
                ms.y = ny;
                break;
            }
        }
    }
    exports.move = move;

    function fall(board, ms, dz) {
        var secnum = exports.getSector(board, ms);
        if (secnum == -1)
            return;
        var walls = board.walls;
        var sectors = board.sectors;
        var sector = sectors[secnum];
        var slope = exports.createSlopeCalculator(sector, walls);
        var ceilingheinum = sector.ceilingheinum;
        var ceilingz = sector.ceilingz;
        var floorheinum = sector.floorheinum;
        var floorz = sector.floorz;

        var fz = slope(ms.x, ms.y, floorheinum) + floorz;
        var cz = slope(ms.x, ms.y, ceilingheinum) + ceilingz;

        var nz = ms.z + dz;
        if (nz < cz)
            nz = cz;
        else if (nz > fz)
            nz = fz;
        ms.z = nz;
    }
    exports.fall = fall;
});