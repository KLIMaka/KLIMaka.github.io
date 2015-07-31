define(["require", "exports", '../../../libs/dataviewstream'], function(require, exports, data) {
    var TilFile = (function () {
        function TilFile(data) {
            this.data = data;
            this.count = data.readUShort();
            this.width = data.readUShort();
            this.height = data.readUShort();
            this.goff = data.mark();
        }
        TilFile.prototype.getTile = function (id) {
            this.data.setOffset(this.goff + id * this.width * this.height);
            return data.array(data.ubyte, this.width * this.height)(this.data);
        };
        return TilFile;
    })();
    exports.TilFile = TilFile;

    function create(data) {
        return new TilFile(data);
    }
    exports.create = create;
});
