define(["require", "exports", './libs/getter', './libs/dataviewstream', './libs/browser', './libs/imgutils', './modules/pixelprovider'], function(require, exports, getter, data, browser, IU, PP) {
    var resnum = browser.getQueryVariable('res');

    var P = 'resources/engines/anvil/ANVIL0.PAL';
    var R = 'resources/engines/anvil/RES.00' + resnum;

    getter.loader.load(R).load(P).finish(function () {
        var createTmpBuffer = function () {
            var buffer = new Uint8Array(0);
            return function (size) {
                if (buffer.length < size) {
                    buffer = new Uint8Array(size);
                }
                for (var i = 0; i < size; i++)
                    buffer[i] = 0;
                return buffer;
            };
        }();

        function createImage(w, h, data, off, trans, pal) {
            var canvas = IU.createCanvas(PP.resize(PP.fromPal(data.subarray(0, w * h), pal, w, h, 255, trans), w * 2, h * 2));
            document.body.appendChild(canvas);
        }

        function LZSS(r, size) {
            var ret = createTmpBuffer(size);
            var retoff = 0;

            var blocks = r.readUInt();
            var start = r.readUInt();

            while (retoff < size) {
                var bits = r.readUShort();
                for (var i = 0; i < 16; i++) {
                    var b = (bits >> i) & 1;
                    if (b) {
                        var _ = r.readUShort();
                        var y = (_ >> 13) & 7;
                        var x = _ & 0x1fff;
                        var off = retoff - 2 * x;
                        for (var o = 0; o < (y + 2) * 2; o++) {
                            ret[retoff++] = ret[off + o];
                        }
                    } else {
                        var _ = r.readUShort();
                        ret[retoff++] = _ & 0xff;
                        ret[retoff++] = (_ >> 8) & 0xff;
                    }
                }
            }
            return ret;
        }

        function read(r, size, compressed) {
            if (compressed) {
                return LZSS(r, size);
            } else {
                var ret = createTmpBuffer(size);
                for (var i = 0; i < size; i++)
                    ret[i] = r.readUByte();
                return ret;
            }
        }

        function readFile(r, pal) {
            var begin = r.mark();
            var sign = r.readByteString(4);
            if (sign != 'D3GR')
                return;

            var flags = r.readUInt();
            var pagesOff = r.readUInt();
            var palOff = r.readUInt();
            var unk0 = r.readUInt();
            var unk1 = r.readUInt();
            var pagesCount = r.readUInt();
            var offsets = new Array(pagesCount);
            for (var i = 0; i < pagesCount; i++)
                offsets[i] = r.readUInt();

            if (palOff != 0) {
                r.setOffset(palOff + begin);
                var pal = new Uint8Array(pal);
                var colors = r.readUShort();
                var start = r.readUShort() - 0x100;
                for (var i = start; i < start + colors; i++) {
                    pal[i * 3 + 0] = r.readUByte() * 4;
                    pal[i * 3 + 1] = r.readUByte() * 4;
                    pal[i * 3 + 2] = r.readUByte() * 4;
                }
            }

            for (var i = 0; i < pagesCount; i++) {
                r.setOffset(pagesOff + offsets[i] + begin);

                var size = r.readUInt();
                var type = r.readUInt();
                var compressed = type == 4;
                var left = r.readUShort();
                var top = r.readUShort();
                var h = r.readUShort();
                var w = r.readUShort();

                if (w * h == 0)
                    continue;

                var data = read(r, h * w, compressed);
                createImage(w, h, data, 0, 255, pal);
            }
        }

        function readPal(r, off) {
            r.setOffset(off);
            var pal = new Uint8Array(256 * 3);
            for (var i = 0; i < 256; i++) {
                pal[i * 3 + 0] = r.readUByte() * 4;
                pal[i * 3 + 1] = r.readUByte() * 4;
                pal[i * 3 + 2] = r.readUByte() * 4;
            }
            return pal;
        }

        var pal = readPal(new data.DataViewStream(getter.get(P), true), 0);
        var res = new data.DataViewStream(getter.get(R), true);
        var size = res.readUInt();
        console.log("size = " + size);
        var offsets = new Array(size);
        for (var i = 0; i < size; i++) {
            offsets[i] = res.readUInt();
        }

        for (var i = 0; i < size - 1; i++) {
            res.setOffset(offsets[i]);
            readFile(res, pal);
        }
    });
});
