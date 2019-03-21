define(["require", "exports", "./renderable", "../structs", "../../../../libs_js/glutess", "../utils", "../../../../libs_js/glmatrix", "../../../../libs/mathutils"], function (require, exports, renderable_1, structs_1, glutess_1, U, GLM, MU) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const SCALE = -16;
    class SectorRenderable {
        constructor() {
            this.ceiling = new renderable_1.Renderable();
            this.floor = new renderable_1.Renderable();
        }
    }
    exports.SectorRenderable = SectorRenderable;
    class WallRenderable {
        constructor() {
            this.top = new renderable_1.Renderable();
            this.mid = new renderable_1.Renderable();
            this.bot = new renderable_1.Renderable();
        }
    }
    exports.WallRenderable = WallRenderable;
    class SpriteRenderable extends renderable_1.Renderable {
    }
    exports.SpriteRenderable = SpriteRenderable;
    class Entry {
        constructor(value, valid = false) {
            this.value = value;
            this.valid = valid;
        }
    }
    class Cache {
        constructor(board, art) {
            this.board = board;
            this.art = art;
            this.sectors = [];
            this.walls = [];
            this.sprites = [];
        }
        ensure(dir, id, create) {
            var ent = dir[id];
            if (ent == undefined) {
                ent = new Entry(create());
                dir[id] = ent;
            }
            return ent;
        }
        getSector(id) {
            var sector = this.ensure(this.sectors, id, () => new SectorRenderable());
            if (!sector.valid) {
                prepareSector(this.board, this.art, id, sector.value);
                sector.valid = true;
            }
            return sector.value;
        }
        getWall(wallId, sectorId) {
            var wall = this.ensure(this.walls, wallId, () => new WallRenderable());
            if (!wall.valid) {
                prepareWall(this.board, this.art, wallId, sectorId, wall.value);
                wall.valid = true;
            }
            return wall.value;
        }
        getSprite(spriteId) {
            var sprite = this.ensure(this.sprites, spriteId, () => new SpriteRenderable());
            if (!sprite.valid) {
                prepareSprite(this.board, this.art, spriteId, sprite.value);
                sprite.valid = true;
            }
            return sprite.value;
        }
        invalidateSectors(ids) {
            ids.map((id) => this.ensure(this.sectors, ids[id], () => new SectorRenderable()).valid = false);
        }
        invalidateWalls(ids) {
            ids.map((id) => this.ensure(this.walls, ids[id], () => new WallRenderable()).valid = false);
        }
        invalidateSprites(ids) {
            ids.map((id) => this.ensure(this.sprites, ids[id], () => new SpriteRenderable()).valid = false);
        }
    }
    exports.Cache = Cache;
    function applySectorTextureTransform(sector, ceiling, walls, info, texMat) {
        var xpan = ceiling ? sector.ceilingxpanning : sector.floorxpanning;
        var ypan = ceiling ? sector.ceilingypanning : sector.floorypanning;
        var stats = ceiling ? sector.ceilingstat : sector.floorstat;
        var scale = stats.doubleSmooshiness ? 8.0 : 16.0;
        var tcscalex = (stats.xflip ? -1.0 : 1.0) / (info.w * scale);
        var tcscaley = (stats.yflip ? -1.0 : 1.0) / (info.h * scale);
        GLM.mat4.identity(texMat);
        GLM.mat4.translate(texMat, texMat, [xpan / 256.0, ypan / 256.0, 0, 0]);
        GLM.mat4.scale(texMat, texMat, [tcscalex, tcscaley, 1, 1]);
        if (stats.swapXY) {
            GLM.mat4.rotateZ(texMat, texMat, -Math.PI / 2);
            GLM.mat4.scale(texMat, texMat, [-1, 1, 1, 1]);
        }
        if (stats.alignToFirstWall) {
            var w1 = walls[sector.wallptr];
            GLM.mat4.rotateZ(texMat, texMat, U.getFirstWallAngle(sector, walls));
            GLM.mat4.translate(texMat, texMat, [-w1.x, -w1.y, 0, 0]);
        }
        GLM.mat4.rotateX(texMat, texMat, -Math.PI / 2);
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
        return glutess_1.tesselate(contours);
    }
    var tricache = {};
    function cacheTriangulate(board, sec) {
        var res = tricache[sec.wallptr];
        if (res == undefined) {
            res = triangulate(sec, board.walls);
            tricache[sec.wallptr] = res;
        }
        return res;
    }
    function fillBuffersForSectorWireframe(ceil, board, sec, voff, buff) {
        var heinum = ceil ? sec.ceilingheinum : sec.floorheinum;
        var z = ceil ? sec.ceilingz : sec.floorz;
        var slope = U.createSlopeCalculator(sec, board.walls);
        var fw = sec.wallptr;
        var baseIdx = voff;
        var off = 0;
        for (var w = 0; w < sec.wallnum; w++) {
            var wid = sec.wallptr + w;
            var wall = board.walls[wid];
            var vx = wall.x;
            var vy = wall.y;
            var vz = (slope(vx, vy, heinum) + z) / SCALE;
            voff = buff.writePos(voff, vx, vz, vy);
            if (fw != wid) {
                off = buff.writeLine(off, baseIdx + w - 1, baseIdx + w);
            }
            if (wall.point2 == fw) {
                off = buff.writeLine(off, baseIdx + w, baseIdx + fw - sec.wallptr);
                fw = wid + 1;
            }
        }
    }
    function fillBuffersForSectorNormal(ceil, board, sec, buff, vtxs, vidxs) {
        var heinum = ceil ? sec.ceilingheinum : sec.floorheinum;
        var z = ceil ? sec.ceilingz : sec.floorz;
        var slope = U.createSlopeCalculator(sec, board.walls);
        var off = 0;
        for (var i = 0; i < vtxs.length; i++) {
            var vx = vtxs[i][0];
            var vy = vtxs[i][1];
            var vz = (slope(vx, vy, heinum) + z) / SCALE;
            off = buff.writePos(off, vx, vz, vy);
        }
        off = 0;
        for (var i = 0; i < vidxs.length; i += 3) {
            if (ceil) {
                off = buff.writeTriangle(off, vidxs[i + 0], vidxs[i + 1], vidxs[i + 2]);
            }
            else {
                off = buff.writeTriangle(off, vidxs[i + 2], vidxs[i + 1], vidxs[i + 0]);
            }
        }
    }
    function fillBuffersForSector(ceil, board, sec, renderable) {
        var [vtxs, vidxs] = cacheTriangulate(board, sec);
        var d = ceil ? renderable.ceiling : renderable.floor;
        d.buff.allocate(vtxs.length + sec.wallnum, vidxs.length, sec.wallnum * 2);
        fillBuffersForSectorNormal(ceil, board, sec, d.buff, vtxs, vidxs);
        fillBuffersForSectorWireframe(ceil, board, sec, vtxs.length, d.buff);
    }
    function prepareSector(board, art, secId, renderable) {
        var sec = board.sectors[secId];
        fillBuffersForSector(true, board, sec, renderable);
        renderable.ceiling.tex = art.get(sec.ceilingpicnum);
        renderable.ceiling.pal = sec.ceilingpal;
        renderable.ceiling.shade = sec.ceilingshade;
        var info = art.getInfo(sec.ceilingpicnum);
        applySectorTextureTransform(sec, true, board.walls, info, renderable.ceiling.texMat);
        fillBuffersForSector(false, board, sec, renderable);
        renderable.floor.tex = art.get(sec.floorpicnum);
        renderable.floor.pal = sec.floorpal;
        renderable.floor.shade = sec.floorshade;
        var info = art.getInfo(sec.floorpicnum);
        applySectorTextureTransform(sec, false, board.walls, info, renderable.floor.texMat);
    }
    function fillBuffersForWall(x1, y1, x2, y2, slope, nextslope, heinum, nextheinum, z, nextz, check, buff) {
        var z1 = (slope(x1, y1, heinum) + z) / SCALE;
        var z2 = (slope(x2, y2, heinum) + z) / SCALE;
        var z3 = (nextslope(x2, y2, nextheinum) + nextz) / SCALE;
        var z4 = (nextslope(x1, y1, nextheinum) + nextz) / SCALE;
        if (check && (z4 >= z1 && z3 >= z2))
            return false;
        buff.allocate(4, 6, 8);
        genWallQuad(x1, y1, x2, y2, z1, z2, z3, z4, buff);
        return true;
    }
    function fillBuffersForMaskedWall(x1, y1, x2, y2, slope, nextslope, ceilheinum, ceilnextheinum, ceilz, ceilnextz, floorheinum, floornextheinum, floorz, floornextz, buff) {
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
        buff.allocate(4, 6, 8);
        genWallQuad(x1, y1, x2, y2, z1, z2, z3, z4, buff);
    }
    function genWallQuad(x1, y1, x2, y2, z1, z2, z3, z4, buff) {
        var off = 0;
        off = buff.writePos(off, x1, z1, y1);
        off = buff.writePos(off, x2, z2, y2);
        off = buff.writePos(off, x2, z3, y2);
        off = buff.writePos(off, x1, z4, y1);
        var off = 0;
        off = buff.writeQuad(off, 0, 1, 2, 3);
        var off = 0;
        off = buff.writeLine(off, 0, 1);
        off = buff.writeLine(off, 1, 2);
        off = buff.writeLine(off, 2, 3);
        off = buff.writeLine(off, 3, 0);
    }
    function applyWallTextureTransform(wall, wall2, info, base, originalWall = wall, texMat) {
        var wall1 = wall;
        if (originalWall.cstat.xflip)
            [wall1, wall2] = [wall2, wall1];
        var flip = wall == originalWall ? 1 : -1;
        var tw = info.w;
        var th = info.h;
        var dx = wall2.x - wall1.x;
        var dy = wall2.y - wall1.y;
        var tcscalex = (originalWall.xrepeat * 8.0) / (flip * MU.len2d(dx, dy) * tw);
        var tcscaley = -(wall.yrepeat / 8.0) / (th * 16.0);
        var tcxoff = originalWall.xpanning / tw;
        var tcyoff = wall.ypanning / 256.0;
        GLM.mat4.identity(texMat);
        GLM.mat4.translate(texMat, texMat, [tcxoff, tcyoff, 0, 0]);
        GLM.mat4.scale(texMat, texMat, [tcscalex, tcscaley, 1, 1]);
        GLM.mat4.rotateY(texMat, texMat, -Math.atan2(-dy, dx));
        GLM.mat4.translate(texMat, texMat, [-wall1.x, -base / SCALE, -wall1.y, 0]);
    }
    function prepareWall(board, art, wallId, secId, renderable) {
        var wall = board.walls[wallId];
        var sector = board.sectors[secId];
        var wall2 = board.walls[wall.point2];
        var x1 = wall.x;
        var y1 = wall.y;
        var x2 = wall2.x;
        var y2 = wall2.y;
        var tex = art.get(wall.picnum);
        var info = art.getInfo(wall.picnum);
        var slope = U.createSlopeCalculator(sector, board.walls);
        var ceilingheinum = sector.ceilingheinum;
        var ceilingz = sector.ceilingz;
        var floorheinum = sector.floorheinum;
        var floorz = sector.floorz;
        var trans = (wall.cstat.translucent || wall.cstat.translucentReversed) ? 0.6 : 1;
        if (wall.nextwall == -1 || wall.cstat.oneWay) {
            fillBuffersForWall(x1, y1, x2, y2, slope, slope, ceilingheinum, floorheinum, ceilingz, floorz, false, renderable.mid.buff);
            var base = wall.cstat.alignBottom ? floorz : ceilingz;
            applyWallTextureTransform(wall, wall2, info, base, wall, renderable.mid.texMat);
            renderable.mid.tex = tex;
            renderable.mid.shade = wall.shade;
            renderable.mid.pal = wall.pal;
        }
        else {
            var nextsector = board.sectors[wall.nextsector];
            var nextslope = U.createSlopeCalculator(nextsector, board.walls);
            var nextfloorz = nextsector.floorz;
            var nextceilingz = nextsector.ceilingz;
            var nextfloorheinum = nextsector.floorheinum;
            if (fillBuffersForWall(x1, y1, x2, y2, nextslope, slope, nextfloorheinum, floorheinum, nextfloorz, floorz, true, renderable.bot.buff)) {
                var wall_ = wall.cstat.swapBottoms ? board.walls[wall.nextwall] : wall;
                var wall2_ = wall.cstat.swapBottoms ? board.walls[wall_.point2] : wall2;
                var tex_ = wall.cstat.swapBottoms ? art.get(wall_.picnum) : tex;
                var info_ = wall.cstat.swapBottoms ? art.getInfo(wall_.picnum) : info;
                var base = wall.cstat.alignBottom ? ceilingz : nextfloorz;
                applyWallTextureTransform(wall_, wall2_, info_, base, wall, renderable.bot.texMat);
                renderable.bot.tex = tex_;
                renderable.bot.shade = wall_.shade;
                renderable.bot.pal = wall_.pal;
            }
            var nextceilingheinum = nextsector.ceilingheinum;
            if (fillBuffersForWall(x1, y1, x2, y2, slope, nextslope, ceilingheinum, nextceilingheinum, ceilingz, nextceilingz, true, renderable.top.buff)) {
                var base = wall.cstat.alignBottom ? ceilingz : nextceilingz;
                applyWallTextureTransform(wall, wall2, info, base, wall, renderable.top.texMat);
                renderable.top.tex = tex;
                renderable.top.shade = wall.shade;
                renderable.top.pal = wall.pal;
            }
            if (wall.cstat.masking) {
                var tex1 = art.get(wall.overpicnum);
                var info1 = art.getInfo(wall.overpicnum);
                fillBuffersForMaskedWall(x1, y1, x2, y2, slope, nextslope, ceilingheinum, nextceilingheinum, ceilingz, nextceilingz, floorheinum, nextfloorheinum, floorz, nextfloorz, renderable.mid.buff);
                var base = wall.cstat.alignBottom ? Math.min(floorz, nextfloorz) : Math.max(ceilingz, nextceilingz);
                applyWallTextureTransform(wall, wall2, info1, base, wall, renderable.mid.texMat);
                renderable.mid.tex = tex1;
                renderable.mid.shade = wall.shade;
                renderable.mid.pal = wall.pal;
            }
        }
    }
    function fillbuffersForWallSprite(x, y, z, xo, yo, hw, hh, ang, xf, yf, onesided, renderable) {
        var dx = Math.sin(ang) * hw;
        var dy = Math.cos(ang) * hw;
        renderable.buff.allocate(4, onesided ? 6 : 12, 8);
        var off = 0;
        off = renderable.buff.writePos(off, x - dx, z - hh + yo, y - dy);
        off = renderable.buff.writePos(off, x + dx, z - hh + yo, y + dy);
        off = renderable.buff.writePos(off, x + dx, z + hh + yo, y + dy);
        off = renderable.buff.writePos(off, x - dx, z + hh + yo, y - dy);
        genSpriteQuad(renderable.buff, onesided);
        var xf = xf ? -1.0 : 1.0;
        var yf = yf ? -1.0 : 1.0;
        var texMat = renderable.texMat;
        GLM.mat4.identity(texMat);
        GLM.mat4.scale(texMat, texMat, [xf / (hw * 2), -yf / (hh * 2), 1, 1]);
        GLM.mat4.rotateY(texMat, texMat, -ang - Math.PI / 2);
        GLM.mat4.translate(texMat, texMat, [-x - xf * dx, -z - yf * hh - yo, -y - xf * dy, 0]);
    }
    function fillbuffersForFloorSprite(x, y, z, xo, yo, hw, hh, ang, xf, yf, onesided, renderable) {
        renderable.buff.allocate(4, onesided ? 6 : 12, 8);
        var dwx = Math.sin(-ang) * hw;
        var dwy = Math.cos(-ang) * hw;
        var dhx = Math.sin(-ang + Math.PI / 2) * hh;
        var dhy = Math.cos(-ang + Math.PI / 2) * hh;
        var off = 0;
        off = renderable.buff.writePos(off, x - dwx - dhx, z, y - dwy - dhy);
        off = renderable.buff.writePos(off, x + dwx - dhx, z, y + dwy - dhy);
        off = renderable.buff.writePos(off, x + dwx + dhx, z, y + dwy + dhy);
        off = renderable.buff.writePos(off, x - dwx + dhx, z, y - dwy + dhy);
        genSpriteQuad(renderable.buff, onesided);
        var xf = xf ? -1.0 : 1.0;
        var yf = yf ? -1.0 : 1.0;
        var texMat = renderable.texMat;
        GLM.mat4.identity(texMat);
        GLM.mat4.scale(texMat, texMat, [xf / (hw * 2), yf / (hh * 2), 1, 1]);
        GLM.mat4.translate(texMat, texMat, [hw, hh, 0, 0]);
        GLM.mat4.rotateZ(texMat, texMat, -ang - Math.PI / 2);
        GLM.mat4.translate(texMat, texMat, [-x, -y, 0, 0]);
        GLM.mat4.rotateX(texMat, texMat, -Math.PI / 2);
    }
    function fillBuffersForFaceSprite(x, y, z, xo, yo, hw, hh, xf, yf, renderable) {
        renderable.buff.allocate(4, 6, 8);
        var off = 0;
        off = renderable.buff.writePos(off, x, z, y);
        off = renderable.buff.writePos(off, x, z, y);
        off = renderable.buff.writePos(off, x, z, y);
        off = renderable.buff.writePos(off, x, z, y);
        var off = 0;
        off = renderable.buff.writeNormal(off, -hw + xo, +hh + yo);
        off = renderable.buff.writeNormal(off, +hw + xo, +hh + yo);
        off = renderable.buff.writeNormal(off, +hw + xo, -hh + yo);
        off = renderable.buff.writeNormal(off, -hw + xo, -hh + yo);
        genSpriteQuad(renderable.buff, 1);
        var texMat = renderable.texMat;
        GLM.mat4.identity(texMat);
        GLM.mat4.scale(texMat, texMat, [1 / (hw * 2), -1 / (hh * 2), 1, 1]);
        GLM.mat4.translate(texMat, texMat, [hw - xo, -hh - yo, 0, 0]);
    }
    function genSpriteQuad(buff, onesided) {
        var off = 0;
        off = buff.writeQuad(off, 0, 1, 2, 3);
        if (!onesided)
            off = buff.writeQuad(off, 3, 2, 1, 0);
        off = 0;
        off = buff.writeLine(off, 0, 1);
        off = buff.writeLine(off, 1, 2);
        off = buff.writeLine(off, 2, 3);
        off = buff.writeLine(off, 3, 0);
    }
    function prepareSprite(board, art, sprId, renderable) {
        var spr = board.sprites[sprId];
        if (spr.picnum == 0 || spr.cstat.invicible)
            return;
        var x = spr.x;
        var y = spr.y;
        var z = spr.z / SCALE;
        var info = art.getInfo(spr.picnum);
        var tex = art.get(spr.picnum);
        var w = (info.w * spr.xrepeat) / 4;
        var hw = w >> 1;
        var h = (info.h * spr.yrepeat) / 4;
        var hh = h >> 1;
        var ang = MU.PI2 - (spr.ang / 2048) * MU.PI2;
        var xo = (info.attrs.xoff * spr.xrepeat) / 4;
        var yo = (info.attrs.yoff * spr.yrepeat) / 4 + (spr.cstat.realCenter ? 0 : hh);
        var xf = spr.cstat.xflip;
        var yf = spr.cstat.yflip;
        var sec = board.sectors[spr.sectnum];
        var sectorShade = sec.floorshade;
        var shade = spr.shade == -8 ? sectorShade : spr.shade;
        var trans = (spr.cstat.translucent || spr.cstat.tranclucentReversed) ? 0.6 : 1;
        renderable.tex = tex;
        renderable.shade = shade;
        renderable.pal = spr.pal;
        renderable.trans = trans;
        if (spr.cstat.type == structs_1.FACE) {
            fillBuffersForFaceSprite(x, y, z, xo, yo, hw, hh, xf, yf, renderable);
            renderable.type = renderable_1.Type.FACE;
        }
        else if (spr.cstat.type == structs_1.WALL) {
            fillbuffersForWallSprite(x, y, z, xo, yo, hw, hh, ang, xf, yf, spr.cstat.onesided, renderable);
        }
        else if (spr.cstat.type == structs_1.FLOOR) {
            fillbuffersForFloorSprite(x, y, z, xo, yo, hw, hh, ang, xf, yf, spr.cstat.onesided, renderable);
        }
    }
});
