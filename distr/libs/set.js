define(["require", "exports"], function(require, exports) {
    var Set = (function () {
        function Set(array) {
            if (typeof array === "undefined") { array = []; }
            this.table = {};
            for (var i in array)
                this.add(array[i]);
        }
        Set.prototype.add = function (val) {
            this.table[val] = 1;
        };

        Set.prototype.remove = function (val) {
            this.table[val] = 0;
        };

        Set.prototype.has = function (val) {
            return this.table[val] == 1;
        };

        Set.prototype.values = function () {
            var arr = [];
            for (var i in this.table)
                if (this.table[i] == 1)
                    arr.push(i);
            return arr;
        };
        return Set;
    })();
    exports.Set = Set;

    function create(array) {
        if (typeof array === "undefined") { array = []; }
        return new Set(array);
    }
    exports.create = create;
});
