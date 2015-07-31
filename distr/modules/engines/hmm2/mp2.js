define(["require", "exports", '../../../libs/dataviewstream'], function(require, exports, data) {
    var Tile = (function () {
        function Tile() {
        }
        return Tile;
    })();
    exports.Tile = Tile;

    var tileStruct = data.struct(Tile, [
        ['tileIndex', data.ushort],
        ['objectName1', data.ubyte],
        ['indexName1', data.ubyte],
        ['quantity1', data.ubyte],
        ['quantity2', data.ubyte],
        ['objectName2', data.ubyte],
        ['indexName2', data.ubyte],
        ['shape', data.ubyte],
        ['generalObject', data.ubyte],
        ['indexAddon', data.ushort],
        ['uniqNumber1', data.uint],
        ['uniqNumber2', data.uint]
    ]);

    var Addon = (function () {
        function Addon() {
        }
        return Addon;
    })();
    exports.Addon = Addon;

    var addonStruct = data.struct(Addon, [
        ['indexAddon', data.ushort],
        ['objectNameN1', data.ubyte],
        ['indexNameN1', data.ubyte],
        ['quantityN', data.ubyte],
        ['objectNameN2', data.ubyte],
        ['indexNameN2', data.ubyte],
        ['uniqNumberN1', data.uint],
        ['uniqNumberN2', data.uint]
    ]);

    var Mp2File = (function () {
        function Mp2File(buf) {
            this.data = new data.DataViewStream(buf, true);
            var s = this.data;

            var sign = s.readUInt();
            if (sign != 0x0000005C)
                throw new Error('Wrong MP2 file');

            s.setOffset(420);
            this.width = s.readUInt();
            this.height = s.readUInt();
            this.tiles = data.structArray(this.width * this.height, tileStruct)(s);
            var addoncount = s.readUInt();
            this.addons = data.structArray(addoncount, addonStruct)(s);
        }
        return Mp2File;
    })();
    exports.Mp2File = Mp2File;

    function create(buf) {
        return new Mp2File(buf);
    }
    exports.create = create;
});
