define(["require", "exports", "../modules/bitreader"], function (require, exports, B) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DataViewStream {
        constructor(buf, isLE) {
            this.view = new DataView(buf);
            this.offset = 0;
            this.littleEndian = isLE;
        }
        buffer() {
            return this.view.buffer;
        }
        eoi() {
            return this.offset >= this.view.byteLength;
        }
        skip(n) {
            this.offset += n;
        }
        setOffset(off) {
            this.offset = off;
        }
        mark() {
            return this.offset;
        }
        readByte() {
            return this.view.getInt8(this.offset++);
        }
        readUByte() {
            return this.view.getUint8(this.offset++);
        }
        readShort() {
            var ret = this.view.getInt16(this.offset, this.littleEndian);
            this.offset += 2;
            return ret;
        }
        readUShort() {
            var ret = this.view.getUint16(this.offset, this.littleEndian);
            this.offset += 2;
            return ret;
        }
        readInt() {
            var ret = this.view.getInt32(this.offset, this.littleEndian);
            this.offset += 4;
            return ret;
        }
        readUInt() {
            var ret = this.view.getUint32(this.offset, this.littleEndian);
            this.offset += 4;
            return ret;
        }
        readFloat() {
            var ret = this.view.getFloat32(this.offset, this.littleEndian);
            this.offset += 4;
            return ret;
        }
        readByteString(len) {
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
        }
        subView() {
            var ret = new DataViewStream(this.view.buffer, this.littleEndian);
            ret.setOffset(this.offset);
            return ret;
        }
        array(bytes) {
            var slice = this.view.buffer.slice(this.offset, this.offset + bytes);
            this.offset += bytes;
            return slice;
        }
    }
    exports.DataViewStream = DataViewStream;
    class BasicReader {
        constructor(f, size, arr) {
            this.f = f;
            this.size = size;
            this.arr = arr;
        }
        read(s) { return this.f(s); }
        sizeof() { return this.size; }
        arrType() { return this.arr; }
    }
    exports.BasicReader = BasicReader;
    function reader(rf, size, arr = null) {
        return new BasicReader(rf, size, arr);
    }
    exports.reader = reader;
    exports.byte = reader((s) => s.readByte(), 1, Int8Array);
    exports.ubyte = reader((s) => s.readUByte(), 1, Uint8Array);
    exports.short = reader((s) => s.readShort(), 2, Int16Array);
    exports.ushort = reader((s) => s.readUShort(), 2, Uint16Array);
    exports.int = reader((s) => s.readInt(), 4, Int32Array);
    exports.uint = reader((s) => s.readUInt(), 4, Uint32Array);
    exports.float = reader((s) => s.readFloat(), 4, Float32Array);
    exports.string = (len) => { return reader((s) => s.readByteString(len), len); };
    var array_ = (s, type, len) => {
        var arr = new Array();
        for (var i = 0; i < len; i++)
            arr[i] = type.read(s);
        return arr;
    };
    exports.array = (type, len) => { return reader((s) => array_(s, type, len), type.sizeof() * len); };
    var atomic_array_ = (s, type, len) => {
        var arrayType = type.arrType();
        if (arrayType == null)
            throw new Error('type is not atomic');
        var array = s.array(len * type.sizeof());
        return new arrayType(array, 0, len * type.sizeof());
    };
    exports.atomic_array = (type, len) => { return reader((s) => atomic_array_(s, type, len), type.sizeof() * len); };
    var bit_field_ = (s, fields, reverse) => {
        var br = new B.BitReader(s);
        return fields.map((val) => br.readBits(val, reverse));
    };
    exports.bit_field = (fields, reverse) => { return reader((s) => bit_field_(s, fields, reverse), (fields.reduce((l, r) => l + r, 0) / 8) | 0); };
    var struct_ = (s, fields, type) => {
        var struct = new type();
        for (var i = 0; i < fields.length; i++) {
            var [name, reader] = fields[i];
            var parts = name.split(',');
            if (parts.length == 1) {
                struct[name] = reader.read(s);
            }
            else {
                var values = reader.read(s);
                for (var r = 0; r < parts.length; r++) {
                    var pname = parts[r];
                    struct[pname] = values[r];
                }
            }
        }
        return struct;
    };
    exports.struct = (type, fields) => { return reader((s) => struct_(s, fields, type), fields.reduce((l, r) => l + r[1].sizeof(), 0)); };
});
