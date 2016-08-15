define(["require", "exports"], function (require, exports) {
    var AsyncBarrier = (function () {
        function AsyncBarrier(cb) {
            this.cb = cb;
            this.results = {};
            this.requests = 0;
            this.isWaiting = false;
        }
        AsyncBarrier.prototype.callback = function (name) {
            var self = this;
            this.requests++;
            return function (val) {
                self.result(name, val);
            };
        };
        AsyncBarrier.prototype.result = function (name, value) {
            this.results[name] = value;
            this.requests--;
            if (this.requests == 0 && this.isWaiting)
                this.cb(this.results);
        };
        AsyncBarrier.prototype.wait = function () {
            if (this.requests == 0)
                this.cb(this.results);
            this.isWaiting = true;
        };
        return AsyncBarrier;
    })();
    exports.AsyncBarrier = AsyncBarrier;
    function create(cb) {
        return new AsyncBarrier(cb);
    }
    exports.create = create;
});
