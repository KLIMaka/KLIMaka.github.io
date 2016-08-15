define(["require", "exports", '../../../libs/mathutils', '../../../libs/vecmath'], function (require, exports, MU, VEC) {
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
                    inter ^= (dx1 * dy2 - dx2 * dy1) ^ dy2;
            }
        }
        return (inter >>> 31) == 1;
    }
    exports.inSector = inSector;
    function findSector(board, x, y, secnum) {
        if (secnum === void 0) { secnum = 0; }
        if (secnum == -1)
            secnum = 0;
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
        var slope = createSlopeCalculator(sec, walls);
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
        var cursecnum = getSector(board, ms);
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
                    var nslope = createSlopeCalculator(nsector, walls);
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
            }
            else {
                ms.x = nx;
                ms.y = ny;
                break;
            }
        }
    }
    exports.move = move;
    var ClipLine = (function () {
        function ClipLine(x1, y1, x2, y2, wallidx) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
            this.wallidx = wallidx;
        }
        return ClipLine;
    })();
    function move1(board, ms, gx, gy, enterwallnum, walldist) {
        if (enterwallnum === void 0) { enterwallnum = null; }
        if (walldist === void 0) { walldist = 128; }
        if (gx == 0 && gy == 0) {
            return;
        }
        var cursecnum = getSector(board, ms);
        if (cursecnum == -1) {
            console.log('Not in sector');
            return;
        }
        var walls = board.walls;
        var sectors = board.sectors;
        var x = ms.x;
        var y = ms.y;
        var nx = x + gx;
        var ny = y + gy;
        var cursec = sectors[cursecnum];
        var clipLines = [];
        for (var w = 0; w < cursec.wallnum; w++) {
            var wallidx = cursec.wallptr + w;
            var wall = walls[wallidx];
            var wall2 = walls[wall.point2];
            var x1 = wall.x;
            var y1 = wall.y;
            var x2 = wall2.x;
            var y2 = wall2.y;
            var dx = x2 - x1;
            var dy = y2 - x1;
            if (dx * (y - y1) < (x - x1) * dy)
                continue; //If wall's not facing you
            if (wall.nextsector == -1) {
                var bsz = walldist;
                if (gx < 0)
                    bsz = -bsz;
                clipLines.push(new ClipLine(x1 - bsz, y1 - bsz, x1 - bsz, y1 + bsz, wallidx));
                clipLines.push(new ClipLine(x2 - bsz, y2 - bsz, x2 - bsz, y2 + bsz, wallidx));
                bsz = walldist;
                if (gy < 0)
                    bsz = -bsz;
                clipLines.push(new ClipLine(x1 + bsz, y1 - bsz, x1 - bsz, y1 - bsz, wallidx));
                clipLines.push(new ClipLine(x2 + bsz, y2 - bsz, x2 - bsz, y2 - bsz, wallidx));
                var dax = walldist;
                if (dy > 0)
                    dax = -dax;
                var day = walldist;
                if (dx < 0)
                    day = -day;
                clipLines.push(new ClipLine(x1 + dax, y1 + day, x2 + dax, y2 + day, wallidx));
            }
        }
        var intx = nx;
        var inty = ny;
        for (var i = 0; i < clipLines.length; i++) {
            var cl = clipLines[i];
            var int = VEC.intersect2d([x, y], [intx, inty], [cl.x1, cl.y1], [cl.x2, cl.y2]);
            if (int != null) {
                intx = int[0];
                inty = int[1];
            }
        }
        if (intx != nx || inty != ny) {
            ms.x = intx;
            ms.y = inty;
            console.log('Clip ' + intx + ',' + inty);
            return;
        }
        var intwall = null;
        for (var w = 0; w < cursec.wallnum; w++) {
            var wallidx = cursec.wallptr + w;
            if (enterwallnum != null && wallidx == enterwallnum)
                continue;
            var wall = walls[wallidx];
            var wall2 = walls[wall.point2];
            var x1 = wall.x;
            var y1 = wall.y;
            var x2 = wall2.x;
            var y2 = wall2.y;
            var int = VEC.intersect2d([x, y], [intx, inty], [x1, y1], [x2, y2]);
            if (int != null) {
                intx = int[0];
                inty = int[1];
                intwall = wallidx;
            }
        }
        if (intwall != null) {
            ms.x = intx;
            ms.y = inty;
            ms.sec = walls[intwall].nextsector;
            var ngx = nx - intx;
            var ngy = ny - inty;
            console.log('Intersector. from:' + cursecnum + ' to:' + ms.sec + ' ' + ms.x + ',' + ms.y);
            move1(board, ms, ngx, ngy, walls[intwall].nextwall, walldist);
            return;
        }
        ms.x = nx;
        ms.y = ny;
        console.log('Move ' + intx + ',' + inty);
    }
    exports.move1 = move1;
    function fall(board, ms, dz) {
        var secnum = getSector(board, ms);
        if (secnum == -1)
            return;
        var walls = board.walls;
        var sectors = board.sectors;
        var sector = sectors[secnum];
        var slope = createSlopeCalculator(sector, walls);
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
