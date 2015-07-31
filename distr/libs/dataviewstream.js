define(["require", "exports"], function(require, exports) {
    var DataViewStream = (function () {
        function DataViewStream(buf, isLE) {
            this.view = new DataView(buf);
            this.offset = 0;
            this.littleEndian = isLE;
        }
        DataViewStream.prototype.buffer = function () {
            return this.view.buffer;
        };

        DataViewStream.prototype.eoi = function () {
            return this.offset >= this.view.byteLength;
        };

        DataViewStream.prototype.skip = function (n) {
            this.offset += n;
        };

        DataViewStream.prototype.setOffset = function (off) {
            this.offset = off;
        };

        DataViewStream.prototype.mark = function () {
            return this.offset;
        };

        DataViewStream.prototype.readByte = function () {
            return this.view.getInt8(this.offset++);
        };

        DataViewStream.prototype.readUByte = function () {
            return this.view.getUint8(this.offset++);
        };

        DataViewStream.prototype.readShort = function () {
            var ret = this.view.getInt16(this.offset, this.littleEndian);
            this.offset += 2;
            return ret;
        };

        DataViewStream.prototype.readUShort = function () {
            var ret = this.view.getUint16(this.offset, this.littleEndian);
            this.offset += 2;
            return ret;
        };

        DataViewStream.prototype.readInt = function () {
            var ret = this.view.getInt32(this.offset, this.littleEndian);
            this.offset += 4;
            return ret;
        };

        DataViewStream.prototype.readUInt = function () {
            var ret = this.view.getUint32(this.offset, this.littleEndian);
            this.offset += 4;
            return ret;
        };

        DataViewStream.prototype.readFloat = function () {
            var ret = this.view.getFloat32(this.offset, this.littleEndian);
            this.offset += 4;
            return ret;
        };

        DataViewStream.prototype.readByteString = function (len) {
            var str = new Array(len);
            for (var i = 0; i < len; i++) {
                var c = this.readByte();
                if (c == 0) {
                    this.skip(len - i - 1);
                    break;
                }
                str[i] = String.fromCharCode(c);
            }
            return str.join('');
        };

        DataViewStream.prototype.subView = function () {
            var ret = new DataViewStream(this.view.buffer, this.littleEndian);
            ret.setOffset(this.offset);
            return ret;
        };

        DataViewStream.prototype.array = function (bytes) {
            return new DataView(this.view.buffer, this.offset, bytes);
        };
        return DataViewStream;
    })();
    exports.DataViewStream = DataViewStream;

    var BasicReader = (function () {
        function BasicReader(f, size, arr) {
            this.f = f;
            this.size = size;
            this.arr = arr;
        }
        BasicReader.prototype.read = function (s) {
            return this.f(s);
        };
        BasicReader.prototype.sizeof = function () {
            return this.size;
        };
        BasicReader.prototype.arrType = function () {
            return this.arr;
        };
        return BasicReader;
    })();
    exports.BasicReader = BasicReader;

    function reader(rf, size, arr) {
        if (typeof arr === "undefined") { arr = null; }
        return new BasicReader(rf, size, arr);
    }
    exports.reader = reader;

    exports.byte = exports.reader(function (s) {
        return s.readByte();
    }, 1, Int8Array);
    exports.ubyte = exports.reader(function (s) {
        return s.readUByte();
    }, 1, Uint8Array);
    exports.short = exports.reader(function (s) {
        return s.readShort();
    }, 2, Int16Array);
    exports.ushort = exports.reader(function (s) {
        return s.readUShort();
    }, 2, Uint16Array);
    exports.int = exports.reader(function (s) {
        return s.readInt();
    }, 4, Int32Array);
    exports.uint = exports.reader(function (s) {
        return s.readUInt();
    }, 4, Uint32Array);
    exports.float = exports.reader(function (s) {
        return s.readFloat();
    }, 4, Float32Array);
    exports.string = function (len) {
        return exports.reader(function (s) {
            return s.readByteString(len);
        }, len);
    };

    exports.array_ = function (s, type, len) {
        var arrayType = type.arrType();
        if (arrayType == null) {
            var arr = [];
            for (var i = 0; i < len; i++)
                arr[i] = type.read(s);
            return arr;
        }
        var arr = new Array(len);
        for (var i = 0; i < len; i++)
            arr[i] = type.read(s);
        return new arrayType(arr);
    };
    exports.array = function (type, len) {
        return exports.reader(function (s) {
            return exports.array_(s, type, len);
        }, type.sizeof() * len);
    };

    exports.struct_ = function (s, fields, type) {
        var struct = new type();
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            struct[field[0]] = field[1].read(s);
        }
        return struct;
    };
    exports.struct = function (type, fields) {
        return exports.reader(function (s) {
            return exports.struct_(s, fields, type);
        }, fields.reduce(function (l, r) {
            return l + r[1].sizeof();
        }, 0));
    };
});
