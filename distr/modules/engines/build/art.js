define(["require", "exports", '../../../libs/dataviewstream'], function (require, exports, data) {
    var ArtInfo = (function () {
        function ArtInfo(w, h, anum, img) {
            this.w = w;
            this.h = h;
            this.anum = anum;
            this.img = img;
        }
        return ArtInfo;
    })();
    exports.ArtInfo = ArtInfo;
    var ArtFile = (function () {
        function ArtFile(stream) {
            this.stream = stream;
            var version = stream.readUInt();
            var numtiles = stream.readUInt();
            var start = stream.readUInt();
            var end = stream.readUInt();
            var size = end - start + 1;
            var hs = data.array(data.ushort, size).read(stream);
            var ws = data.array(data.ushort, size).read(stream);
            var anums = data.array(data.uint, size).read(stream);
            var offsets = new Array(size);
            var offset = stream.mark();
            for (var i = 0; i < size; i++) {
                offsets[i] = offset;
                offset += ws[i] * hs[i];
            }
            this.offsets = offsets;
            this.ws = ws;
            this.hs = hs;
            this.anums = anums;
            this.start = start;
            this.end = end;
            this.size = size;
        }
        ArtFile.prototype.getInfo = function (id) {
            var offset = this.offsets[id];
            this.stream.setOffset(offset);
            var w = this.ws[id];
            var h = this.hs[id];
            var anum = this.anums[id];
            var pixels = data.array(data.ubyte, w * h).read(this.stream);
            return new ArtInfo(w, h, anum, pixels);
        };
        ArtFile.prototype.getStart = function () {
            return this.start;
        };
        ArtFile.prototype.getEnd = function () {
            return this.end;
        };
        return ArtFile;
    })();
    exports.ArtFile = ArtFile;
    var ArtFiles = (function () {
        function ArtFiles(arts) {
            this.arts = arts;
        }
        ArtFiles.prototype.getArt = function (id) {
            for (var i in this.arts) {
                var art = this.arts[i];
                if (id >= art.getStart() && id <= art.getEnd())
                    return art;
            }
            return null;
        };
        ArtFiles.prototype.getInfo = function (id) {
            var art = this.getArt(id);
            if (art == null)
                return null;
            return art.getInfo(id - art.getStart());
        };
        return ArtFiles;
    })();
    exports.ArtFiles = ArtFiles;
    function create(stream) {
        return new ArtFile(stream);
    }
    exports.create = create;
    function createArts(arts) {
        return new ArtFiles(arts);
    }
    exports.createArts = createArts;
});
