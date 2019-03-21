define(["require", "exports", '../../../libs/mathutils', '../../../libs/vecmath', '../../../libs_js/glutess', '../../meshbuilder', './utils', '../../../libs_js/glmatrix'], function (require, exports, MU, VEC, GLU, mb, U, GLM) {
    "use strict";
    var SCALE = -16;
    class SolidInfo {
        constructor(bbox, ds) {
            this.bbox = bbox;
            this.ds = ds;
        }
    }
    class WallInfo {
        constructor(up, down, middle) {
            this.up = up;
            this.down = down;
            this.middle = middle;
        }
    }
    class SectorInfo {
        constructor(floor, ceiling) {
            this.floor = floor;
            this.ceiling = ceiling;
        }
    }
    class SpriteInfo {
        constructor(bbox, ds, face = false) {
            this.bbox = bbox;
            this.ds = ds;
            this.face = face;
        }
    }
    function triangulate(sector, walls) {
        var contour = [];
        var contours = [];
        var fw = sector.wallptr;
        for (var w = 0; w < sector.wallnum; w++) {
            var wid = sector.wallptr + w;
            var wall = walls[wid];
            contour.push(wall.x, wall.y);
            if (wall.point2 == fw) {
                contours.push(contour);
                contour = [];
                fw = wid + 1;
            }
        }
        return GLU.tesselate(contours);
    }
    function getWallTextureTransform(wall, wall2, tex, base) {
        var wall1 = wall;
        if (wall.cstat.xflip)
            [wall1, wall2] = [wall2, wall1];
        var tw = tex.getWidth();
        var th = tex.getHeight();
        var dx = wall2.x - wall1.x;
        var dy = wall2.y - wall1.y;
        var tcscalex = (wall.xrepeat * 8.0) / (MU.len2d(dx, dy) * tw);
        var tcscaley = -(wall.yrepeat / 8.0) / (th * 16.0);
        var tcxoff = wall.xpanning / tw;
        var tcyoff = wall.ypanning / 256.0;
        var trans = GLM.mat4.create();
        GLM.mat4.translate(trans, trans, [tcxoff, tcyoff, 0, 0]);
        GLM.mat4.scale(trans, trans, [tcscalex, tcscaley, 1, 1]);
        GLM.mat4.rotateY(trans, trans, -Math.atan2(-dy, dx));
        GLM.mat4.translate(trans, trans, [-wall1.x, -base, -wall1.y, 0]);
        return trans;
    }
    function addWall(wall, wall2, builder, quad, idx, tex, mat, base) {
        // a -> b
        // ^    |
        // |    v
        // d <- c
        var shade = wall.shade;
        var trans = getWallTextureTransform(wall, wall2, tex, base);
        var a = quad[0];
        var atc = GLM.vec4.transformMat4(GLM.vec4.create(), [a[0], a[1], a[2], 1], trans);
        var b = quad[1];
        var btc = GLM.vec4.transformMat4(GLM.vec4.create(), [b[0], b[1], b[2], 1], trans);
        var c = quad[2];
        var ctc = GLM.vec4.transformMat4(GLM.vec4.create(), [c[0], c[1], c[2], 1], trans);
        var d = quad[3];
        var dtc = GLM.vec4.transformMat4(GLM.vec4.create(), [d[0], d[1], d[2], 1], trans);
        builder.begin();
        if (a[1] == d[1]) {
            builder.addFace(mb.TRIANGLES, [a, b, c], [atc, btc, ctc], idx, shade);
        }
        else if (b[1] == c[1]) {
            builder.addFace(mb.TRIANGLES, [a, b, d], [atc, btc, dtc], idx, shade);
        }
        else if (a[1] < d[1] && b[1] < c[1]) {
            builder.addFace(mb.QUADS, [d, c, b, a], [dtc, ctc, btc, atc], idx, shade);
        }
        else if (a[1] < d[1]) {
            var e = VEC.intersect3d(a, b, c, d);
            var etc = GLM.vec4.transformMat4(GLM.vec4.create(), [e[0], e[1], e[2], 1], trans);
            builder.addFace(mb.TRIANGLES, [d, e, a], [dtc, etc, atc], idx, shade);
            builder.addFace(mb.TRIANGLES, [e, b, c], [etc, btc, ctc], idx, shade);
            VEC.release3d(e);
        }
        else if (b[1] < c[1]) {
            var e = VEC.intersect3d(a, b, c, d);
            var etc = GLM.vec4.transformMat4(GLM.vec4.create(), [e[0], e[1], e[2], 1], trans);
            builder.addFace(mb.TRIANGLES, [a, e, d], [atc, etc, dtc], idx, shade);
            builder.addFace(mb.TRIANGLES, [e, c, b], [etc, ctc, btc], idx, shade);
            VEC.release3d(e);
        }
        else {
            builder.addFace(mb.QUADS, quad, [atc, btc, ctc, dtc], idx, shade);
        }
        var mesh = builder.end(mat);
        var bbox = MU.bbox(quad);
        return new SolidInfo(bbox, mesh);
    }
    function getSectorTextureTransform(sector, ceiling, walls, tex) {
        var xpan = ceiling ? sector.ceilingxpanning : sector.floorxpanning;
        var ypan = ceiling ? sector.ceilingypanning : sector.floorypanning;
        var stats = ceiling ? sector.ceilingstat : sector.floorstat;
        var scale = stats.doubleSmooshiness ? 8.0 : 16.0;
        var tcscalex = (stats.xflip ? -1.0 : 1.0) / (tex.getWidth() * scale);
        var tcscaley = (stats.yflip ? -1.0 : 1.0) / (tex.getHeight() * scale);
        var trans = GLM.mat4.create();
        GLM.mat4.translate(trans, trans, [xpan / 256.0, ypan / 256.0, 0, 0]);
        GLM.mat4.scale(trans, trans, [tcscalex, tcscaley, 1, 1]);
        if (stats.swapXY) {
            GLM.mat4.rotateZ(trans, trans, -Math.PI / 2);
            GLM.mat4.scale(trans, trans, [-1, 1, 1, 1]);
        }
        if (stats.alignToFirstWall) {
            var w1 = walls[sector.wallptr];
            GLM.mat4.rotateZ(trans, trans, U.getFirstWallAngle(sector, walls));
            GLM.mat4.translate(trans, trans, [-w1.x, -w1.y, 0, 0]);
        }
        return trans;
    }
    function getVertex(x, y, slope, heinum, z) {
        z = slope(x, y, heinum) + z;
        return [x, z / SCALE, y];
    }
    function addSector(tris, ceiling, sector, walls, builder, idx, tex, mat) {
        var heinum = ceiling ? sector.ceilingheinum : sector.floorheinum;
        var z = ceiling ? sector.ceilingz : sector.floorz;
        var shade = ceiling ? sector.ceilingshade : sector.floorshade;
        var trans = getSectorTextureTransform(sector, ceiling, walls, tex);
        var slope = U.createSlopeCalculator(sector, walls);
        var vtxs = [];
        var tcs = [];
        builder.begin();
        var verts = tris[0];
        var indexes = tris[1];
        for (var i = 0; i < indexes.length; i += 3) {
            var v1 = getVertex(verts[indexes[i + 0]][0], verts[indexes[i + 0]][1], slope, heinum, z);
            var v2 = getVertex(verts[indexes[i + 1]][0], verts[indexes[i + 1]][1], slope, heinum, z);
            var v3 = getVertex(verts[indexes[i + 2]][0], verts[indexes[i + 2]][1], slope, heinum, z);
            var v1tc = GLM.vec4.transformMat4(GLM.vec4.create(), [v1[0], v1[2], 0, 1], trans);
            var v2tc = GLM.vec4.transformMat4(GLM.vec4.create(), [v2[0], v2[2], 0, 1], trans);
            var v3tc = GLM.vec4.transformMat4(GLM.vec4.create(), [v3[0], v3[2], 0, 1], trans);
            vtxs = vtxs.concat(ceiling ? [v3, v2, v1] : [v1, v2, v3]);
            tcs = tcs.concat(ceiling ? [v3tc, v2tc, v1tc] : [v1tc, v2tc, v3tc]);
        }
        builder.addFace(mb.TRIANGLES, vtxs, tcs, idx, shade);
        var mesh = builder.end(mat);
        var bbox = MU.bbox(vtxs);
        return new SolidInfo(bbox, mesh);
    }
    function getWallSpriteVtxs(x, y, z, xo, yo, hw, hh, ang) {
        var dx = Math.sin(ang) * hw;
        var dy = Math.cos(ang) * hw;
        var a = [x - dx, z - hh + yo, y - dy];
        var b = [x + dx, z - hh + yo, y + dy];
        var c = [x + dx, z + hh + yo, y + dy];
        var d = [x - dx, z + hh + yo, y - dy];
        return [a, b, c, d];
    }
    function getFloorSpriteVtxs(x, y, z, xo, yo, hw, hh, ang) {
        var dwx = Math.sin(ang) * hw;
        var dwy = Math.cos(ang) * hw;
        var dhx = Math.sin(ang + Math.PI / 2) * hh;
        var dhy = Math.cos(ang + Math.PI / 2) * hh;
        var a = [x - dwx - dhx, z + 1, y - dwy - dhy];
        var b = [x + dwx + dhx, z + 1, y - dwy - dhy];
        var c = [x + dwx + dhx, z + 1, y + dwy + dhy];
        var d = [x - dwx - dhx, z + 1, y + dwy + dhy];
        return [a, b, c, d];
    }
    function addSprite(spr, builder, tex, materials, tinfo, idx) {
        var x = spr.x;
        var y = spr.y;
        var z = spr.z / SCALE;
        var w = tex.getWidth();
        var hw = (w * spr.xrepeat) / 8;
        var h = tex.getHeight();
        var hh = (h * spr.yrepeat) / 8;
        var ang = MU.PI2 - (spr.ang / 2048) * MU.PI2;
        var xf = spr.cstat.xflip;
        var yf = spr.cstat.yflip;
        var xo = (tinfo >> 8) & 0xFF;
        xo = MU.ubyte2byte(xo) * 16 * (spr.xrepeat / 64);
        var yo = (tinfo >> 16) & 0xFF;
        yo = MU.ubyte2byte(yo) * 16 * (spr.yrepeat / 64);
        var tcs = [[xf ? 0 : 1, yf ? 0 : 1], [xf ? 1 : 0, yf ? 0 : 1], [xf ? 1 : 0, yf ? 1 : 0], [xf ? 0 : 1, yf ? 1 : 0]];
        var vtxs = null;
        var mat = null;
        if (spr.cstat.type == 0) {
            var pos = [x, z, y];
            var a = [+hw, -hh + yo, 0];
            var b = [-hw, -hh + yo, 0];
            var c = [-hw, +hh + yo, 0];
            var d = [+hw, +hh + yo, 0];
            vtxs = [a, b, c, d];
            mat = materials.sprite(tex);
            var bbox = MU.bbox(vtxs);
            builder.begin();
            builder.addSprite(vtxs, pos, tcs, idx, spr.shade);
            var mesh = builder.end(mat);
            return new SpriteInfo(bbox, mesh, true);
        }
        else if (spr.cstat.type == 1) {
            vtxs = getWallSpriteVtxs(x, y, z, xo, yo, hw, hh, ang);
            mat = materials.solid(tex);
        }
        else if (spr.cstat.type == 2) {
            vtxs = getFloorSpriteVtxs(x, y, z, xo, yo, hw, hh, ang);
            mat = materials.solid(tex);
        }
        var bbox = MU.bbox(vtxs);
        builder.begin();
        builder.addFace(mb.QUADS, vtxs, tcs, idx, spr.shade);
        if (!spr.cstat.onesided) {
            vtxs.reverse();
            tcs.reverse();
            builder.addFace(mb.QUADS, vtxs, tcs, idx, spr.shade);
        }
        var mesh = builder.end(mat);
        return new SpriteInfo(bbox, mesh);
    }
    class DrawStruct {
        constructor(offset, length, tex) {
            this.ptr = [WebGLRenderingContext.TRIANGLES, 0, 0];
            this.tex = {};
            this.ptr[1] = offset;
            this.ptr[2] = length;
            this.tex['base'] = tex;
        }
    }
    class DefaultBoardBuilder {
        constructor(gl) {
            this.off = 0;
            this.len = 0;
            this.builder = new mb.MeshBuilderConstructor()
                .buffer('aPos', Float32Array, gl.FLOAT, 3)
                .buffer('aNorm', Float32Array, gl.FLOAT, 3)
                .buffer('aIdx', Uint8Array, gl.UNSIGNED_BYTE, 4, true)
                .buffer('aTc', Float32Array, gl.FLOAT, 2)
                .buffer('aShade', Int8Array, gl.BYTE, 1)
                .index(Uint16Array, gl.UNSIGNED_SHORT)
                .build();
            var tmp = this.builder.build(gl, null);
            this.vtxBuf = tmp.getVertexBuffers();
            this.idxBuf = tmp.getIndexBuffer();
            this.mode = tmp.getMode();
        }
        addFace(type, verts, tcs, idx, shade) {
            this.builder.start(type)
                .attr('aNorm', VEC.detach3d(VEC.polygonNormal(verts)))
                .attr('aIdx', MU.int2vec4(idx))
                .attr('aShade', [shade]);
            for (var i = 0; i < verts.length; i++) {
                this.builder
                    .attr('aTc', tcs[i])
                    .vtx('aPos', verts[i]);
            }
            this.builder.end();
            this.len += (type == mb.QUADS ? (6 * verts.length / 4) : verts.length);
        }
        addSprite(verts, pos, tcs, idx, shade) {
            this.builder.start(mb.QUADS)
                .attr('aPos', pos)
                .attr('aIdx', MU.int2vec4(idx))
                .attr('aShade', [shade]);
            for (var i = 0; i < 4; i++) {
                this.builder
                    .attr('aTc', tcs[i])
                    .vtx('aNorm', verts[i]);
            }
            this.builder.end();
            this.len += 6;
        }
        begin() {
            this.off = this.builder.offset() * 2;
            this.len = 0;
        }
        end(mat) {
            return new mb.Mesh(mat, this.vtxBuf, this.idxBuf, this.mode, this.len, this.off);
        }
        finish(gl) {
            this.builder.build(gl, null);
        }
    }
    function getWallVtxs(x1, y1, x2, y2, slope, nextslope, heinum, nextheinum, z, nextz, check) {
        var z1 = (slope(x1, y1, heinum) + z) / SCALE;
        var z2 = (slope(x2, y2, heinum) + z) / SCALE;
        var z3 = (nextslope(x2, y2, nextheinum) + nextz) / SCALE;
        var z4 = (nextslope(x1, y1, nextheinum) + nextz) / SCALE;
        if (check && (z4 >= z1 && z3 >= z2))
            return null;
        var a = [x1, z1, y1];
        var b = [x2, z2, y2];
        var c = [x2, z3, y2];
        var d = [x1, z4, y1];
        return [a, b, c, d];
    }
    function getMaskedWallVtxs(x1, y1, x2, y2, slope, nextslope, ceilheinum, ceilnextheinum, ceilz, ceilnextz, floorheinum, floornextheinum, floorz, floornextz) {
        var currz1 = (slope(x1, y1, ceilheinum) + ceilz) / SCALE;
        var currz2 = (slope(x2, y2, ceilheinum) + ceilz) / SCALE;
        var currz3 = (slope(x2, y2, floorheinum) + floorz) / SCALE;
        var currz4 = (slope(x1, y1, floorheinum) + floorz) / SCALE;
        var nextz1 = (nextslope(x1, y1, ceilnextheinum) + ceilnextz) / SCALE;
        var nextz2 = (nextslope(x2, y2, ceilnextheinum) + ceilnextz) / SCALE;
        var nextz3 = (nextslope(x2, y2, floornextheinum) + floornextz) / SCALE;
        var nextz4 = (nextslope(x1, y1, floornextheinum) + floornextz) / SCALE;
        var z1 = Math.min(currz1, nextz1);
        var z2 = Math.min(currz2, nextz2);
        var z3 = Math.max(currz3, nextz3);
        var z4 = Math.max(currz4, nextz4);
        var a = [x1, z1, y1];
        var b = [x2, z2, y2];
        var c = [x2, z3, y2];
        var d = [x1, z4, y1];
        return [a, b, c, d];
    }
    class BoardProcessor {
        constructor(board) {
            this.board = board;
            this.walls = [];
            this.sectors = [];
            this.sprites = [];
            this.spritesBySector = [];
            this.index = [];
            this.dss = [];
        }
        build(gl, textureProvider, materials, builder = new DefaultBoardBuilder(gl)) {
            var idx = 1;
            var sectors = this.board.sectors;
            var walls = this.board.walls;
            for (var s = 0; s < sectors.length; s++) {
                var sectorIdx = idx++;
                var sector = sectors[s];
                this.index[sectorIdx] = [sector, s];
                var slope = U.createSlopeCalculator(sector, walls);
                var ceilingheinum = sector.ceilingheinum;
                var ceilingz = sector.ceilingz;
                var floorheinum = sector.floorheinum;
                var floorz = sector.floorz;
                var i = 0;
                while (i < sector.wallnum) {
                    var w = sector.wallptr + i;
                    var wall = walls[w];
                    this.index[idx] = [wall, w];
                    var wall2 = walls[wall.point2];
                    var x1 = wall.x;
                    var y1 = wall.y;
                    var x2 = wall2.x;
                    var y2 = wall2.y;
                    var tex = textureProvider.get(wall.picnum);
                    if (wall.nextwall == -1 || wall.cstat.oneWay) {
                        var vtxs = getWallVtxs(x1, y1, x2, y2, slope, slope, ceilingheinum, floorheinum, ceilingz, floorz, false);
                        var base = wall.cstat.alignBottom ? floorz : ceilingz;
                        var solid = addWall(wall, wall2, builder, vtxs, idx, tex, materials.solid(tex), base / SCALE);
                        this.walls[w] = new WallInfo(solid, null, null);
                    }
                    else {
                        var nextsector = sectors[wall.nextsector];
                        var nextslope = U.createSlopeCalculator(nextsector, walls);
                        var nextfloorz = nextsector.floorz;
                        var nextceilingz = nextsector.ceilingz;
                        var up = null;
                        var down = null;
                        var middle = null;
                        var nextfloorheinum = nextsector.floorheinum;
                        var vtxs = getWallVtxs(x1, y1, x2, y2, nextslope, slope, nextfloorheinum, floorheinum, nextfloorz, floorz, true);
                        if (vtxs != null) {
                            var wall_ = wall.cstat.swapBottoms ? walls[wall.nextwall] : wall;
                            var wall2_ = wall.cstat.swapBottoms ? walls[wall_.point2] : wall2;
                            var tex_ = textureProvider.get(wall_.picnum);
                            var base = wall.cstat.alignBottom ? ceilingz : nextfloorz;
                            up = addWall(wall_, wall2_, builder, vtxs, idx, tex_, materials.solid(tex_), base / SCALE);
                            this.dss.push(up.ds);
                        }
                        var nextceilingheinum = nextsector.ceilingheinum;
                        var vtxs = getWallVtxs(x1, y1, x2, y2, slope, nextslope, ceilingheinum, nextceilingheinum, ceilingz, nextceilingz, true);
                        if (vtxs != null) {
                            var base = wall.cstat.alignBottom ? ceilingz : nextceilingz;
                            down = addWall(wall, wall2, builder, vtxs, idx, tex, materials.solid(tex), base / SCALE);
                            this.dss.push(down.ds);
                        }
                        if (wall.cstat.masking) {
                            var tex1 = textureProvider.get(wall.overpicnum);
                            var vtxs = getMaskedWallVtxs(x1, y1, x2, y2, slope, nextslope, ceilingheinum, nextceilingheinum, ceilingz, nextceilingz, floorheinum, nextfloorheinum, floorz, nextfloorz);
                            var base = wall.cstat.alignBottom ? Math.min(floorz, nextfloorz) : Math.max(ceilingz, nextceilingz);
                            middle = addWall(wall, wall2, builder, vtxs, idx, tex1, materials.solid(tex1), base / SCALE);
                            this.dss.push(middle.ds);
                        }
                        if (up != null || down != null || middle != null) {
                            this.walls[w] = new WallInfo(up, down, middle);
                        }
                    }
                    i++;
                    idx++;
                }
                var tris = triangulate(sector, walls);
                if (tris[1].length == 0)
                    continue;
                var floortex = textureProvider.get(sector.floorpicnum);
                var ceilingtex = textureProvider.get(sector.ceilingpicnum);
                var floor = addSector(tris, false, sector, walls, builder, sectorIdx, floortex, materials.solid(floortex));
                var ceiling = addSector(tris, true, sector, walls, builder, sectorIdx, ceilingtex, materials.solid(ceilingtex));
                this.sectors[s] = new SectorInfo(floor, ceiling);
                this.dss.push(floor.ds, ceiling.ds);
                var sprites = U.getSprites(this.board, s);
                this.spritesBySector[s] = sprites;
                for (var i = 0; i < sprites.length; i++) {
                    var sprite = sprites[i];
                    var spr = this.board.sprites[sprite];
                    this.index[idx] = [spr, sprite];
                    if (spr.picnum == 0 || spr.cstat.invicible)
                        continue;
                    var tex = textureProvider.get(spr.picnum);
                    var tinfo = textureProvider.getInfo(spr.picnum);
                    var spriteInfo = addSprite(spr, builder, tex, materials, tinfo, idx);
                    this.sprites[sprite] = spriteInfo;
                    this.dss.push(spriteInfo.ds);
                    idx++;
                }
            }
            builder.finish(gl);
            return this;
        }
        getAll() {
            return this.dss;
        }
        getNotInSector(ms, eye) {
            var ds = [];
            var sectors = this.sectors;
            var walls = this.walls;
            var sprites = this.sprites;
            var fov = 0;
            for (var i = 0; i < sectors.length; i++) {
                var sector = sectors[i];
                if (sector == undefined)
                    continue;
                if (bboxVisible(ms, eye, sector.floor.bbox))
                    ds.push(sector.floor.ds);
                if (bboxVisible(ms, eye, sector.ceiling.bbox))
                    ds.push(sector.ceiling.ds);
            }
            for (var i = 0; i < walls.length; i++) {
                var wallinfo = walls[i];
                if (wallinfo == undefined)
                    continue;
                if (wallinfo.up != null && bboxVisible(ms, eye, wallinfo.up.bbox))
                    ds.push(wallinfo.up.ds);
                if (wallinfo.down != null && bboxVisible(ms, eye, wallinfo.down.bbox))
                    ds.push(wallinfo.down.ds);
            }
            for (var i = 0; i < sprites.length; i++) {
                var spriteInfo = sprites[i];
                if (spriteInfo == null)
                    continue;
                if (bboxVisible(ms, eye, spriteInfo.bbox))
                    ds.push(spriteInfo.ds);
            }
            return ds;
        }
        getInSector(ms) {
            var ds = [];
            var dss = [];
            var board = this.board;
            var sectors = this.sectors;
            var walls = this.walls;
            var pvs = [ms.sec];
            for (var i = 0; i < pvs.length; i++) {
                var cursecnum = pvs[i];
                if (sectors[cursecnum] != undefined) {
                    ds.push(sectors[cursecnum].floor.ds);
                    ds.push(sectors[cursecnum].ceiling.ds);
                }
                var cursec = board.sectors[cursecnum];
                for (var w = 0; w < cursec.wallnum; w++) {
                    var wallidx = cursec.wallptr + w;
                    if (!U.wallVisible(board.walls[wallidx], board.walls[board.walls[wallidx].point2], ms))
                        continue;
                    var wallinfo = walls[wallidx];
                    if (wallinfo != undefined) {
                        if (wallinfo.up != null)
                            ds.push(wallinfo.up.ds);
                        if (wallinfo.down != null)
                            ds.push(wallinfo.down.ds);
                        if (wallinfo.middle != null)
                            ds.push(wallinfo.middle.ds);
                    }
                    var nextsector = board.walls[wallidx].nextsector;
                    if (nextsector == -1)
                        continue;
                    if (pvs.indexOf(nextsector) == -1)
                        pvs.push(nextsector);
                }
                var sprites = this.spritesBySector[cursecnum];
                if (sprites != undefined) {
                    for (var s = 0; s < sprites.length; s++) {
                        var spr = this.sprites[sprites[s]];
                        if (spr != undefined) {
                            (spr.face ? dss : ds).push(spr.ds);
                        }
                    }
                }
            }
            return ds.concat(dss);
        }
        get(ms, eye) {
            if (!U.inSector(this.board, ms.x, ms.y, ms.sec)) {
                ms.sec = U.findSector(this.board, ms.x, ms.y, ms.sec);
            }
            return ms.sec == -1
                ? this.getNotInSector(ms, eye)
                : this.getInSector(ms);
        }
        getByIdx(idx) {
            return this.index[idx];
        }
    }
    exports.BoardProcessor = BoardProcessor;
    function bboxVisible(ms, eye, bbox) {
        var dmaxx = bbox.maxx - ms.x;
        var dmaxz = bbox.maxz - ms.y;
        var dminx = bbox.minx - ms.x;
        var dminz = bbox.minz - ms.y;
        if ((dmaxx * eye[0] + dmaxz * eye[2]) > 0)
            return true;
        if ((dmaxx * eye[0] + dminz * eye[2]) > 0)
            return true;
        if ((dminx * eye[0] + dmaxz * eye[2]) > 0)
            return true;
        if ((dminx * eye[0] + dminz * eye[2]) > 0)
            return true;
        return false;
    }
});
