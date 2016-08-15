define(["require", "exports", './list'], function (require, exports, L) {
    var Pool = (function () {
        function Pool(maxsize, allocator) {
            this.holes = new L.List();
            this.maxsize = maxsize;
            this.pool = new Array(0);
            this.allocator = allocator;
        }
        Pool.prototype.get = function () {
            if (!this.holes.isEmpty()) {
                return this.pool[this.holes.pop()];
            }
            if (this.pool.length == this.maxsize)
                throw new Error("Pool overflow");
            this.pool.push(this.allocator());
            return this.pool[this.pool.length - 1];
        };
        Pool.prototype.ret = function () {
            var vals = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                vals[_i - 0] = arguments[_i];
            }
            for (var i in vals) {
                var val = vals[i];
                var idx = this.pool.indexOf(val);
                if (idx == -1)
                    throw new Error('Object not from pool');
                this.holes.insertAfter(idx);
            }
        };
        return Pool;
    })();
    exports.Pool = Pool;
});
