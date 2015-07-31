define(["require", "exports", '../libs/mathutils', '../libs_js/glmatrix', './triangulator', './meshbuilder'], function(require, exports, MU, GLM, triangulator, mb) {
    var SCALE = -16;
    var UNITS2DEG = (1 / 4096);

    var TriangulationContext = (function () {
        function TriangulationContext() {
            this.holes = [];
        }
        TriangulationContext.prototype.addContour = function (contour) {
            if (!this.contour && !MU.isCW(contour)) {
                this.contour = contour;
            } else {
                this.holes.push(contour);
            }
        };

        TriangulationContext.prototype.getContour = function () {
            return this.contour;
        };

        TriangulationContext.prototype.getHoles = function () {
            return this.holes;
        };
        return TriangulationContext;
    })();

    function getContours(sector, walls) {
        var i = 0;
        var pairs = [];
        while (i < sector.wallnum) {
            var firstwallIdx = i + sector.wallptr;
            var wall = walls[sector.wallptr + i];
            while (wall.point2 != firstwallIdx) {
                wall = walls[wall.point2];
                i++;
            }
            i++;
            pairs.push([firstwallIdx, sector.wallptr + i]);
        }

        var ctx = new TriangulationContext();
        for (var i = 0; i < pairs.length; i++) {
            var contour = [];
            var pair = pairs[i];
            for (var j = pair[0]; j < pair[1]; j++) {
                contour.push([walls[j].x, walls[j].y]);
            }
            ctx.addContour(contour);
        }
        return ctx;
    }

    function createSlopeCalculator(sector, walls) {
        var wall1 = walls[sector.wallptr];
        var wall2 = walls[wall1.point2];

        var normal = GLM.vec2.fromValues(-(wall2.y - wall1.y), wall2.x - wall1.x);
        GLM.vec2.normalize(normal, normal);
        var w = -GLM.vec2.dot(normal, GLM.vec2.fromValues(wall1.x, wall1.y));
        var vec = GLM.vec2.create();

        return function (x, y, rotation) {
            GLM.vec2.set(vec, x, y);
            var dist = GLM.vec2.dot(normal, vec) + w;
            return -(rotation * UNITS2DEG) * dist * SCALE;
        };
    }

    function addFace(builder, type, verts, idx) {
        builder.start(type).attr('aNorm', MU.normal(verts)).attr('aIdx', MU.int2vec4(idx));
        for (var i = 0; i < type; i++)
            builder.vtx('aPos', verts[i]);
        builder.end();
    }

    function addWall(builder, quad, idx) {
        var a = quad[0];
        var b = quad[1];
        var c = quad[2];
        var d = quad[3];

        if (a[1] == d[1]) {
            addFace(builder, mb.TRIANGLES, [a, b, c], idx);
            return;
        }
        if (b[1] == c[1]) {
            addFace(builder, mb.TRIANGLES, [a, b, d], idx);
            return;
        }
        if (a[1] < d[1] && b[1] < c[1]) {
            addFace(builder, mb.QUADS, [d, c, b, a], idx);
            return;
        }

        var tmp = GLM.vec3.create();
        var left = Math.abs(a[1] - d[1]);
        var right = Math.abs(b[1] - c[1]);
        var k = left < right ? (left / right) * 0.5 : 1 - (right / left) * 0.5;

        if (a[1] < d[1]) {
            GLM.vec3.sub(tmp, c, d);
            GLM.vec3.scale(tmp, tmp, k);
            var e = GLM.vec3.add(GLM.vec3.create(), d, tmp);
            addFace(builder, mb.TRIANGLES, [d, e, a], idx);
            addFace(builder, mb.TRIANGLES, [e, b, c], idx);
            return;
        }
        if (b[1] < c[1]) {
            GLM.vec3.sub(tmp, b, a);
            GLM.vec3.scale(tmp, tmp, k);
            var e = GLM.vec3.add(GLM.vec3.create(), a, tmp);
            addFace(builder, mb.TRIANGLES, [a, e, d], idx);
            addFace(builder, mb.TRIANGLES, [e, c, b], idx);
            return;
        }
        addFace(builder, mb.QUADS, quad, idx);
    }

    var WallInfo = (function () {
        function WallInfo(front) {
            this.front = front;
        }
        return WallInfo;
    })();

    var SectorInfo = (function () {
        function SectorInfo(id) {
            this.id = id;
        }
        return SectorInfo;
    })();

    var BoardProcessor = (function () {
        function BoardProcessor(board) {
            this.board = board;
            this.sectors = [];
            this.walls = [];
            var sectors = board.sectors;
            var walls = board.walls;
            for (var s = 0; s < sectors.length; s++) {
                var sector = sectors[s];
                var sinfo = new SectorInfo(s);
                this.sectors[s] = sinfo;

                for (var i = 0; i < sector.wallnum; i++) {
                    var w = sector.wallptr + i;
                    var wall = walls[w];
                    var winfo = (wall.nextwall == -1 || this.walls[wall.nextwall] == undefined) ? new WallInfo(w) : this.walls[wall.nextwall];
                    if (winfo.front != w)
                        winfo.back = w;
                    this.walls[w] = winfo;
                }
            }
        }
        return BoardProcessor;
    })();
    exports.BoardProcessor = BoardProcessor;

    function buildBoard(board, gl) {
        var walls = board.walls;
        var sectors = board.sectors;
        var idx = 1;

        var builder = new mb.MeshBuilderConstructor().buffer('aPos', Float32Array, gl.FLOAT, 3).buffer('aNorm', Float32Array, gl.FLOAT, 3).buffer('aIdx', Uint8Array, gl.UNSIGNED_BYTE, 4, true).index(Uint16Array, gl.UNSIGNED_SHORT).build();

        for (var s = 0; s < sectors.length; s++) {
            var sectIdx = idx++;
            var sector = sectors[s];
            var contour = getContours(sector, walls);
            var tris = null;
            try  {
                tris = triangulator.triangulate(contour.getContour(), contour.getHoles());
            } catch (e) {
                console.log(e);
            }
            if (tris == null) {
                console.log(sector);
                continue;
            }

            var slope = createSlopeCalculator(sector, walls);
            var ceilingheinum = sector.ceilingheinum;
            var ceilingz = sector.ceilingz;
            var floorheinum = sector.floorheinum;
            var floorz = sector.floorz;

            var i = 0;
            while (i < sector.wallnum) {
                var wallidx = sector.wallptr + i;
                var wall = walls[wallidx];
                var wall2 = walls[wall.point2];
                var x1 = wall.x;
                var y1 = wall.y;
                var x2 = wall2.x;
                var y2 = wall2.y;

                if (wall.nextwall == -1) {
                    var z1 = slope(x1, y1, ceilingheinum) + ceilingz;
                    var z2 = slope(x2, y2, ceilingheinum) + ceilingz;
                    var z3 = slope(x2, y2, floorheinum) + floorz;
                    var z4 = slope(x1, y1, floorheinum) + floorz;

                    var a = [x1, z1 / SCALE, y1];
                    var b = [x2, z2 / SCALE, y2];
                    var c = [x2, z3 / SCALE, y2];
                    var d = [x1, z4 / SCALE, y1];
                    addWall(builder, [a, b, c, d], idx);
                } else {
                    var nextsector = sectors[wall.nextsector];
                    var nextslope = createSlopeCalculator(nextsector, walls);
                    var nextfloorz = nextsector.floorz;
                    var nextceilingz = nextsector.ceilingz;

                    var nextfloorheinum = nextsector.floorheinum;
                    var z1 = nextslope(x1, y1, nextfloorheinum) + nextfloorz;
                    var z2 = nextslope(x2, y2, nextfloorheinum) + nextfloorz;
                    var z3 = slope(x2, y2, floorheinum) + floorz;
                    var z4 = slope(x1, y1, floorheinum) + floorz;
                    if (z4 > z1 || z3 > z2) {
                        var a = [x1, z1 / SCALE, y1];
                        var b = [x2, z2 / SCALE, y2];
                        var c = [x2, z3 / SCALE, y2];
                        var d = [x1, z4 / SCALE, y1];
                        addWall(builder, [a, b, c, d], idx);
                    }

                    var nextceilingheinum = nextsector.ceilingheinum;
                    var z1 = slope(x1, y1, ceilingheinum) + ceilingz;
                    var z2 = slope(x2, y2, ceilingheinum) + ceilingz;
                    var z3 = nextslope(x2, y2, nextceilingheinum) + nextceilingz;
                    var z4 = nextslope(x1, y1, nextceilingheinum) + nextceilingz;
                    if (z1 < z4 || z2 < z3) {
                        var a = [x1, z1 / SCALE, y1];
                        var b = [x2, z2 / SCALE, y2];
                        var c = [x2, z3 / SCALE, y2];
                        var d = [x1, z4 / SCALE, y1];
                        addWall(builder, [a, b, c, d], idx);
                    }
                }
                i++;
                idx++;
            }

            for (var i = 0; i < tris.length; i += 3) {
                var t0x = tris[i + 0][0];
                var t1x = tris[i + 1][0];
                var t2x = tris[i + 2][0];
                var t0y = tris[i + 0][1];
                var t1y = tris[i + 1][1];
                var t2y = tris[i + 2][1];

                var z1f = slope(t0x, t0y, floorheinum) + floorz;
                var z2f = slope(t1x, t1y, floorheinum) + floorz;
                var z3f = slope(t2x, t2y, floorheinum) + floorz;

                var z1c = slope(t2x, t2y, ceilingheinum) + ceilingz;
                var z2c = slope(t1x, t1y, ceilingheinum) + ceilingz;
                var z3c = slope(t0x, t0y, ceilingheinum) + ceilingz;

                var v1f = [t0x, z1f / SCALE, t0y];
                var v2f = [t1x, z2f / SCALE, t1y];
                var v3f = [t2x, z3f / SCALE, t2y];

                var v1c = [t2x, z1c / SCALE, t2y];
                var v2c = [t1x, z2c / SCALE, t1y];
                var v3c = [t0x, z3c / SCALE, t0y];

                addFace(builder, mb.TRIANGLES, [v1f, v2f, v3f], sectIdx);
                addFace(builder, mb.TRIANGLES, [v1c, v2c, v3c], sectIdx);
            }
        }

        return builder.build(gl);
    }
    exports.buildBoard = buildBoard;
});