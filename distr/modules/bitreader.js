define(["require", "exports"], function(require, exports) {
    var BitReader = (function () {
        function BitReader(data) {
            this.data = data;
            this.currentBit = 7;
            this.currentByte = 0;
            this.data = data;
        }
        BitReader.prototype.readBit = function (reverse) {
            if (typeof reverse === "undefined") { reverse = false; }
            if (this.currentBit > 6) {
                this.currentByte = this.read();
                this.currentBit = 0;
            } else {
                this.currentBit++;
            }

            if (reverse) {
                return ((this.currentByte >> (this.currentBit)) & 1);
            } else {
                return ((this.currentByte >> (7 - this.currentBit)) & 1);
            }
        };

        BitReader.prototype.read = function () {
            return this.data.readUByte();
        };

        BitReader.prototype.readBits = function (bits, reverse) {
            if (typeof reverse === "undefined") { reverse = false; }
            var value = 0;
            for (var i = 0; i < bits; i++) {
                var b = this.readBit(reverse);
                if (reverse) {
                    value = value | (b << i);
                } else {
                    value = (value << 1) | b;
                }
            }
            return value;
        };
        return BitReader;
    })();
    exports.BitReader = BitReader;
});
