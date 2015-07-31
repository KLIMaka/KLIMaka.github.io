define(["require", "exports", '../../../libs/dataviewstream'], function(require, exports, data) {
    var GrpFile = (function () {
        function GrpFile(buf) {
            this.files = {};
            this.data = new data.DataViewStream(buf, true);
            this.loadFiles();
        }
        GrpFile.prototype.loadFiles = function () {
            var d = this.data;
            d.setOffset(12);
            this.count = d.readUInt();
            var offset = this.count * 16 + 16;
            for (var i = 0; i < this.count; i++) {
                var fname = d.readByteString(12);
                var size = d.readUInt();
                this.files[fname] = offset;
                offset += size;
            }
        };

        GrpFile.prototype.get = function (fname) {
            var off = this.files[fname];
            if (off != undefined) {
                this.data.setOffset(off);
                return this.data.subView();
            }
            return null;
        };
        return GrpFile;
    })();
    exports.GrpFile = GrpFile;

    function create(buf) {
        return new GrpFile(buf);
    }
    exports.create = create;

    function createPalette(stream) {
        var pal = new Array(768);
        for (var i = 0; i < 256; i++) {
            pal[i * 3 + 0] = stream.readUByte() * 4;
            pal[i * 3 + 1] = stream.readUByte() * 4;
            pal[i * 3 + 2] = stream.readUByte() * 4;
        }
        return pal;
    }
    exports.createPalette = createPalette;
});