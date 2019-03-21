define(["require", "exports", './list'], function (require, exports, L) {
    "use strict";
    class Pool {
        constructor(maxsize, allocator) {
            this.holes = new L.List();
            this.maxsize = maxsize;
            this.pool = new Array(0);
            this.allocator = allocator;
        }
        get() {
            if (!this.holes.isEmpty()) {
                return this.pool[this.holes.pop()];
            }
            if (this.pool.length == this.maxsize)
                throw new Error("Pool overflow");
            this.pool.push(this.allocator());
            return this.pool[this.pool.length - 1];
        }
        ret(...vals) {
            for (var i in vals) {
                var val = vals[i];
                var idx = this.pool.indexOf(val);
                if (idx == -1)
                    throw new Error('Object not from pool');
                this.holes.insertAfter(idx);
            }
        }
    }
    exports.Pool = Pool;
});
