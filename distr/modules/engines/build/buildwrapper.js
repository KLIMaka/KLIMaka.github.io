define(["require", "exports", "./utils", "../../../libs/iterator"], function (require, exports, U, ITER) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Marked {
        constructor() {
            this.marker = -1;
        }
        mark(m) { this.marker = m; }
        match(m) { return this.marker == m; }
    }
    exports.Marked = Marked;
    function createMarkedIterator(list, m) {
        return ITER.filtered(ITER.list(list), (v) => v.match(m));
    }
    var globalId = 1;
    function genId() {
        return globalId++;
    }
    class SpriteWrapper extends Marked {
        constructor(ref, boardid, id = genId()) {
            super();
            this.ref = ref;
            this.boardid = boardid;
            this.id = id;
        }
    }
    exports.SpriteWrapper = SpriteWrapper;
    class SectorWrapper extends Marked {
        constructor(ref, boardid, id = genId()) {
            super();
            this.ref = ref;
            this.boardid = boardid;
            this.id = id;
        }
    }
    exports.SectorWrapper = SectorWrapper;
    class WallWrapper extends Marked {
        constructor(ref, sector, boardid, id = genId()) {
            super();
            this.ref = ref;
            this.sector = sector;
            this.boardid = boardid;
            this.id = id;
        }
    }
    exports.WallWrapper = WallWrapper;
    class BoardWrapper {
        constructor(ref) {
            this.ref = ref;
            this.sprites = [];
            this.walls = [];
            this.sectors = [];
            this.sector2sprites = {};
            this.id2object = {};
            for (var s = 0; s < ref.numsectors; s++) {
                var sec = ref.sectors[s];
                var secw = new SectorWrapper(sec, s);
                this.sectors.push(secw);
                this.id2object[secw.id] = secw;
                for (var w = 0; w < sec.wallnum; w++) {
                    var wallidx = sec.wallptr + w;
                    var wall = ref.walls[wallidx];
                    var wallw = new WallWrapper(wall, secw, wallidx);
                    this.walls[wallidx] = wallw;
                    this.id2object[wallw.id] = wallw;
                }
            }
            for (var s = 0; s < ref.numsprites; s++) {
                var spr = ref.sprites[s];
                var sprw = new SpriteWrapper(spr, s);
                this.sprites.push(sprw);
                this.id2object[sprw.id] = sprw;
                var sprsec = spr.sectnum;
                if (sprsec != -1) {
                    var sprites = this.sector2sprites[sprsec];
                    if (sprites == undefined) {
                        sprites = [];
                        this.sector2sprites[sprsec] = sprites;
                    }
                    sprites.push(sprw);
                }
            }
        }
        wallVisible(wall, ms) {
            var wall2 = this.walls[wall.ref.point2];
            return U.wallVisible(wall.ref, wall2.ref, ms);
        }
        markVisible(ms, m) {
            var pvs = [ms.sec];
            var sectors = this.sectors;
            var walls = this.walls;
            for (var i = 0; i < pvs.length; i++) {
                var cursecnum = pvs[i];
                var sec = sectors[cursecnum];
                if (sec != undefined) {
                    sec.mark(m);
                }
                for (var w = 0; w < sec.ref.wallnum; w++) {
                    var wallidx = sec.ref.wallptr + w;
                    var wall = walls[wallidx];
                    if (wall != undefined && this.wallVisible(wall, ms)) {
                        wall.mark(m);
                        var nextsector = wall.ref.nextsector;
                        if (nextsector == -1)
                            continue;
                        if (pvs.indexOf(nextsector) == -1)
                            pvs.push(nextsector);
                    }
                }
                var sprites = this.sector2sprites[cursecnum];
                if (sprites != undefined) {
                    sprites.map((s) => s.mark(m));
                }
            }
        }
        markedSectors(m) {
            return createMarkedIterator(this.sectors, m);
        }
        markedWalls(m) {
            return createMarkedIterator(this.walls, m);
        }
        markedSprites(m) {
            return createMarkedIterator(this.sprites, m);
        }
        allSectors() {
            return ITER.list(this.sectors);
        }
        allWalls() {
            return ITER.list(this.walls);
        }
        allSprites() {
            return ITER.list(this.sprites);
        }
    }
    exports.BoardWrapper = BoardWrapper;
});
