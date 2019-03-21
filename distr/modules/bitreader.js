define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function toSigned(value, bits) {
        return value & (1 << (bits - 1))
            ? -(~value & ((1 << bits) - 1)) - 1
            : value;
    }
    class BitReader {
        constructor(data) {
            this.data = data;
            this.currentBit = 7;
            this.currentByte = 0;
            this.data = data;
        }
        readBit(reverse = false) {
            if (this.currentBit > 6) {
                this.currentByte = this.read();
                this.currentBit = 0;
            }
            else {
                this.currentBit++;
            }
            if (reverse) {
                return ((this.currentByte >> (this.currentBit)) & 1);
            }
            else {
                return ((this.currentByte >> (7 - this.currentBit)) & 1);
            }
        }
        read() {
            return this.data.readUByte();
        }
        readBits(bits, reverse = false) {
            var value = 0;
            var signed = bits < 0;
            bits = signed ? -bits : bits;
            for (var i = 0; i < bits; i++) {
                var b = this.readBit(reverse);
                if (reverse) {
                    value = value | (b << i);
                }
                else {
                    value = (value << 1) | b;
                }
            }
            return signed ? toSigned(value, bits) : value;
        }
    }
    exports.BitReader = BitReader;
});
