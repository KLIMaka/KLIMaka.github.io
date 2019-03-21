define(["require", "exports", "../../../libs/dataviewstream"], function (require, exports, data) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ArtInfo {
        constructor(w, h, attrs, img) {
            this.w = w;
            this.h = h;
            this.attrs = attrs;
            this.img = img;
        }
    }
    exports.ArtInfo = ArtInfo;
    exports.NO_ANIMATION = 0;
    exports.OSCILLATING_ANIMATION = 1;
    exports.ANIMATE_FORWARD = 2;
    exports.ANIMATE_BACKWARD = 3;
    class Attributes {
    }
    exports.Attributes = Attributes;
    var anumStruct = data.struct(Attributes, [
        ['frames,type,xoff,yoff,speed,unused', data.bit_field([6, 2, -8, -8, 4, 4], true)]
    ]);
    class ArtFile {
        constructor(stream) {
            this.stream = stream;
            var version = stream.readUInt();
            var numtiles = stream.readUInt();
            var start = stream.readUInt();
            var end = stream.readUInt();
            var size = end - start + 1;
            var hs = data.array(data.ushort, size).read(stream);
            var ws = data.array(data.ushort, size).read(stream);
            var anums = data.array(anumStruct, size).read(stream);
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
        getInfo(id) {
            var offset = this.offsets[id];
            this.stream.setOffset(offset);
            var w = this.ws[id];
            var h = this.hs[id];
            var anum = this.anums[id];
            var pixels = data.atomic_array(data.ubyte, w * h).read(this.stream);
            return new ArtInfo(h, w, anum, pixels);
        }
        getStart() {
            return this.start;
        }
        getEnd() {
            return this.end;
        }
    }
    exports.ArtFile = ArtFile;
    class ArtFiles {
        constructor(arts) {
            this.arts = arts;
        }
        getArt(id) {
            for (var i in this.arts) {
                var art = this.arts[i];
                if (id >= art.getStart() && id <= art.getEnd())
                    return art;
            }
            return null;
        }
        getInfo(id) {
            var art = this.getArt(id);
            if (art == null)
                return null;
            return art.getInfo(id - art.getStart());
        }
    }
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
