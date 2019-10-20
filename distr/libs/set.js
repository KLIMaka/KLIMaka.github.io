define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Set {
        constructor(array = []) {
            this.table = {};
            for (var i in array)
                this.add(array[i]);
        }
        add(val) {
            this.table[val.toString()] = 1;
        }
        remove(val) {
            this.table[val.toString()] = 0;
        }
        has(val) {
            return this.table[val.toString()] == 1;
        }
        values() {
            var arr = [];
            for (var i in this.table)
                if (this.table[i] == 1)
                    arr.push(i);
            return arr;
        }
    }
    exports.Set = Set;
    function create(array = []) {
        return new Set(array);
    }
    exports.create = create;
});
