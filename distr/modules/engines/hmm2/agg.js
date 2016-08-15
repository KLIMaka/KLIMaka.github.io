define(["require", "exports", '../../../libs/dataviewstream'], function(require, exports, data) {
    var FileRecord = (function () {
        function FileRecord() {
        }
        return FileRecord;
    })();
    exports.FileRecord = FileRecord;

    var fat = data.struct(FileRecord, [
        ['hash', data.uint],
        ['offset', data.uint],
        ['size', data.uint]
    ]);

    var AggFile = (function () {
        function AggFile(buf) {
            this.nametable = {};
            this.data = new data.DataViewStream(buf, true);
            this.num_files = data.ushort.read(this.data);
            this.fat = data.array(fat, this.num_files).read(this.data);

            var offset = this.data.mark();
            for (var i = 0; i < this.num_files; i++) {
                offset += this.fat[i].size;
            }

            var nametable = this.nametable;
            this.data.setOffset(offset);
            for (var i = 0; i < this.num_files; i++) {
                nametable[data.string(15).read(this.data)] = i;
            }
        }
        AggFile.prototype.get = function (name) {
            var rec = this.nametable[name];
            if (rec == undefined)
                return null;
            this.data.setOffset(this.fat[rec].offset);
            return this.data.subView();
        };

        AggFile.prototype.getList = function () {
            return Object.keys(this.nametable);
        };
        return AggFile;
    })();
    exports.AggFile = AggFile;

    function create(buf) {
        return new AggFile(buf);
    }
    exports.create = create;

    function createPalette(data) {
        var pal = new Uint8Array(768);
        for (var i = 0; i < 768; i++)
            pal[i] = data.readUByte() << 2;
        return pal;
    }
    exports.createPalette = createPalette;

    function hash(str) {
        var a = 0;
        var b = 0;
        for (var i = str.length - 1; i >= 0; i--) {
            var c = str[i].toUpperCase().charCodeAt(0);
            a = (a << 5) + (a >> 25);
            b += c;
            a += b + c;
        }

        return a;
    }
    exports.hash = hash;
});
