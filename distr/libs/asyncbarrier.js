define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AsyncBarrier {
        constructor() {
            this.results = {};
            this.requests = 0;
            this.isWaiting = false;
        }
        callback(name) {
            var self = this;
            this.requests++;
            return (val) => {
                self.result(name, val);
            };
        }
        result(name, value) {
            this.results[name] = value;
            this.requests--;
            if (this.requests == 0 && this.isWaiting)
                this.cb(this.results);
        }
        wait(cb) {
            this.cb = cb;
            if (this.requests == 0)
                this.cb(this.results);
            this.isWaiting = true;
        }
    }
    exports.AsyncBarrier = AsyncBarrier;
    function create() {
        return new AsyncBarrier();
    }
    exports.create = create;
});
