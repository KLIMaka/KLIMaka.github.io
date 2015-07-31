define(["require", "exports", '../../../libs/dataviewstream', './structs'], function(require, exports, data, build) {
    exports.sectorStruct = data.struct(build.Sector, [
        ['wallptr', data.ushort],
        ['wallnum', data.ushort],
        ['ceilingz', data.int],
        ['floorz', data.int],
        ['ceilingstat', data.ushort],
        ['floorstat', data.ushort],
        ['ceilingpicnum', data.ushort],
        ['ceilingheinum', data.short],
        ['ceilingshade', data.byte],
        ['ceilingpal', data.ubyte],
        ['ceilingxpanning', data.byte],
        ['ceilingypanning', data.byte],
        ['floorpicnum', data.ushort],
        ['floorheinum', data.short],
        ['floorshade', data.byte],
        ['floorpal', data.ubyte],
        ['floorxpanning', data.byte],
        ['floorypanning', data.byte],
        ['visibility', data.byte],
        ['filler', data.byte],
        ['lotag', data.ushort],
        ['hitag', data.ushort],
        ['extra', data.ushort]
    ]);

    exports.wallStruct = data.struct(build.Wall, [
        ['x', data.int],
        ['y', data.int],
        ['point2', data.ushort],
        ['nextwall', data.short],
        ['nextsector', data.short],
        ['cstat', data.ushort],
        ['picnum', data.ushort],
        ['overpicnum', data.ushort],
        ['shade', data.byte],
        ['pal', data.ubyte],
        ['xrepeat', data.ubyte],
        ['yrepeat', data.ubyte],
        ['xpanning', data.byte],
        ['ypanning', data.byte],
        ['lotag', data.ushort],
        ['hitag', data.ushort],
        ['extra', data.ushort]
    ]);

    exports.spriteStruct = data.struct(build.Sprite, [
        ['x', data.int],
        ['y', data.int],
        ['z', data.int],
        ['cstat', data.ushort],
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