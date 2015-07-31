define(["require", "exports", '../../../libs/dataviewstream'], function(require, exports, data) {
    var Header = (function () {
        function Header() {
        }
        return Header;
    })();
    exports.Header = Header;

    var Size = (function () {
        function Size(width, height) {
            this.width = width;
            this.height = height;
        }
        return Size;
    })();
    exports.Size = Size;

    var icnStruct = data.struct(Object, [
        ['count', data.ushort],
        ['size', data.uint],
        [
            'headers', data.structArray(data.val('count'), data.struct(Header, [
                ['offsetX', data.short],
                ['offsetY', data.short],
                ['width', data.ushort],
                ['height', data.ushort],
                ['type', data.ubyte],
                ['offsetData', data.uint]
            ]))]
    ]);

    var IcnFile = (function () {
        function IcnFile(data) {
            this.data = data;
            this.globoff = this.data.mark();
            var info = icnStruct(this.data);
            this.count = info.count;
            this.headers = info.headers;
        }
        IcnFile.prototype.getCount = function () {
            return this.count;
        };

        IcnFile.prototype.getFrame = function (i) {
            var h = this.headers[i];
            this.data.setOffset(this.globoff + h.offsetData + 6);
            if (h.type == 0x20)
                return renderIcnFrame2(this.data, h.width, h.height);
            else
                return renderIcnFrame1(this.data, h.width, h.height);
        };

        IcnFile.prototype.getInfo = function (i) {
            var h = this.headers[i];
            return h;
        };
        return IcnFile;
    })();
    exports.IcnFile = IcnFile;

    function renderIcnFrame1(data, w, h) {
        var buf = new Uint8Array(w * h);
        var x = 0;
        var y = 0;
        for (; ;) {
            var b = data.readUByte();

            if (b == 0) {
                y++;
                x = 0;
            } else if (b < 0x80) {
                while (b--)
                    buf[y * w + x++] = data.readUByte();
            } else if (b == 0x80) {
                break;
            } else if (b < 0xc0) {
                x += b - 0x80;
            } else if (b == 0xc0) {
                b = data.readUByte();
                var c = (b % 4 == 0) ? data.readUByte() : b % 4;
                while (c--)
                    buf[y * w + x++] = 1;
            } else if (b == 0xc1) {
                var c = data.readUByte();
                var i = data.readUByte();
                while (c--)
                    buf[y * w + x++] = i;
            } else {
                var c = b - 0xc0;
                var i = data.readUByte();
                while (c--)
                    buf[y * w + x++] = i;
            }
        }
        return buf;
    }

    function renderIcnFrame2(data, w, h) {
        var buf = new Uint8Array(w * h);
        var x = 0;
        var y = 0;
        for (; ;) {
            var b = data.readUByte();

            if (b == 0) {
                y++;
                x = 0;
            } else if (b < 0x80) {
                while (b--)
                    buf[y * w + x++] = 1;
            } else if (b == 0x80) {
                break;
            } else {
                x += b - 0x80;
            }
        }
        return buf;
    }

    function create(data) {
        return new IcnFile(data);
    }
    exports.create = create;
});
