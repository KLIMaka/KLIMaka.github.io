define(["require", "exports"], function(require, exports) {
    var TempByteArray = (function () {
        function TempByteArray() {
            this.size = 0;
            this.recreate(1);
        }
        TempByteArray.prototype.recreate = function (size) {
            if (size > this.size) {
                this.buffer = new Uint8Array(size);
            }
            for (var i = 0; i < this.size; i++)
                this.buffer[i] = 0;
            return this.buffer;
        };

        TempByteArray.prototype.get = function () {
            return this.buffer;
        };
        return TempByteArray;
    })();
    exports.TempByteArray = TempByteArray;
});
