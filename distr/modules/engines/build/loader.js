define(["require", "exports", "../../../libs/dataviewstream", "./structs"], function (require, exports, data, build) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var sectorStats = data.struct(build.SectorStats, [[
            'parallaxing,slopped,swapXY,doubleSmooshiness,xflip,yflip,alignToFirstWall,_',
            data.bit_field([1, 1, 1, 1, 1, 1, 1, 9], true)
        ]]);
    exports.sectorStruct = data.struct(build.Sector, [
        ['wallptr', data.ushort],
        ['wallnum', data.ushort],
        ['ceilingz', data.int],
        ['floorz', data.int],
        ['ceilingstat', sectorStats],
        ['floorstat', sectorStats],
        ['ceilingpicnum', data.ushort],
        ['ceilingheinum', data.short],
        ['ceilingshade', data.byte],
        ['ceilingpal', data.ubyte],
        ['ceilingxpanning', data.ubyte],
        ['ceilingypanning', data.ubyte],
        ['floorpicnum', data.ushort],
        ['floorheinum', data.short],
        ['floorshade', data.byte],
        ['floorpal', data.ubyte],
        ['floorxpanning', data.ubyte],
        ['floorypanning', data.ubyte],
        ['visibility', data.byte],
        ['filler', data.byte],
        ['lotag', data.ushort],
        ['hitag', data.ushort],
        ['extra', data.ushort]
    ]);
    var wallStats = data.struct(build.WallStats, [[
            'blocking,swapBottoms,alignBottom,xflip,masking,oneWay,blocking2,translucent,yflip,translucentReversed,_',
            data.bit_field([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 6], true)
        ]]);
    exports.wallStruct = data.struct(build.Wall, [
        ['x', data.int],
        ['y', data.int],
        ['point2', data.ushort],
        ['nextwall', data.short],
        ['nextsector', data.short],
        ['cstat', wallStats],
        ['picnum', data.ushort],
        ['overpicnum', data.ushort],
        ['shade', data.byte],
        ['pal', data.ubyte],
        ['xrepeat', data.ubyte],
        ['yrepeat', data.ubyte],
        ['xpanning', data.ubyte],
        ['ypanning', data.ubyte],
        ['lotag', data.ushort],
        ['hitag', data.ushort],
        ['extra', data.ushort]
    ]);
    var spriteStats = data.struct(build.SpriteStats, [[
            'blocking,translucent,xflip,yflip,type,onesided,realCenter,blocking2,tranclucentReversed,noautoshading,_,invicible',
            data.bit_field([1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 4, 1], true)
        ]]);
    exports.spriteStruct = data.struct(build.Sprite, [
        ['x', data.int],
        ['y', data.int],
        ['z', data.int],
        ['cstat', spriteStats],
        ['picnum', data.ushort],
        ['shade', data.byte],
        ['pal', data.ubyte],
        ['clipdist', data.ubyte],
        ['filler', data.ubyte],
        ['xrepeat', data.ubyte],
        ['yrepeat', data.ubyte],
        ['xoffset', data.ubyte],
        ['yoffset', data.ubyte],
        ['sectnum', data.ushort],
        ['statnum', data.ushort],
        ['ang', data.ushort],
        ['owner', data.ushort],
        ['xvel', data.short],
        ['yvel', data.short],
        ['zvel', data.short],
        ['lotag', data.ushort],
        ['hitag', data.ushort],
        ['extra', data.ushort]
    ]);
    exports.boardStruct = data.struct(build.Board, [
        ['version', data.uint],
        ['posx', data.int],
        ['posy', data.int],
        ['posz', data.int],
        ['ang', data.ushort],
        ['cursectnum', data.ushort]
    ]);
    function loadBuildMap(stream) {
        var brd = exports.boardStruct.read(stream);
        brd.numsectors = data.ushort.read(stream);
        brd.sectors = data.array(exports.sectorStruct, brd.numsectors).read(stream);
        brd.numwalls = data.ushort.read(stream);
        brd.walls = data.array(exports.wallStruct, brd.numwalls).read(stream);
        brd.numsprites = data.ushort.read(stream);
        brd.sprites = data.array(exports.spriteStruct, brd.numsprites).read(stream);
        return brd;
    }
    exports.loadBuildMap = loadBuildMap;
});
