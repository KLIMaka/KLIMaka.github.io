define(["require", "exports", '../../../libs/dataviewstream'], function(require, exports, data) {
    var headerStruct = data.struct(Object, [
        ['sign', data.string(4)],
        ['version', data.uint],
        ['offFat', data.uint],
        ['numFiles', data.uint]
    ]);
    var fatRecord = data.struct(Object, [
        ['_', data.array(data.byte, 16)],
        ['offset', data.uint],
        ['size', data.uint],
        ['_', data.uint],
        ['time', data.uint],
        ['flags', data.ubyte],
        ['filename', data.string(11)],
        ['_', data.uint]
    ]);

    var RffFile = (function () {
        function RffFile(buf) {
            this.namesTable = {};
            this.data = new data.DataViewStream(buf, true);
            this.header = headerStruct.read(this.data);
            this.data.setOffset(this.header.offFat);
            var len = this.header.numFiles * 48;
            var fat = data.array(data.ubyte, len).read(this.data);
            if (this.header.version >= 0x301) {
                var key = this.header.offFat & 0xff;
                for (var i = 0; i < len; i += 2) {
                    fat[i] ^= key;
                    fat[i + 1] ^= key;
                    key = (key + 1) % 256;
                }
            }
            var fatBuffer = new data.DataViewStream(fat.buffer, true);
            fatBuffer.setOffset(fat.byteOffset);
            this.loadFat(fatBuffer, this.header.numFiles);
        }
        RffFile.prototype.loadFat = function (stream, numFiles) {
            this.fat = data.array(fatRecord, numFiles).read(stream);
            for (var i in this.fat) {
                var r = this.fat[i];
                r.filename = this.convertFname(r.filename);
                this.namesTable[r.filename] = i;
            }
        };

        RffFile.prototype.convertFname = function (name) {
            return name.substr(3) + '.' + name.substr(0, 3);
        };

        RffFile.prototype.get = function (fname) {
            var record = this.fat[this.namesTable[fname]];
            this.data.setOffset(record.offset);
            var arr = data.array(data.ubyte, record.size).read(this.data);
            if (record.flags & 0x10)
                for (var i = 0; i < 256; i++)
                    arr[i] ^= (i >> 1);
            return arr;
        };
        return RffFile;
    })();
    exports.RffFile = RffFile;

    function create(buf) {
        return new RffFile(buf);
    }
    exports.create = create;
});
