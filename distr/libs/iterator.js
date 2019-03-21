define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function list(l) {
        var i = 0;
        return () => {
            if (i < l.length)
                return l[i++];
            return null;
        };
    }
    exports.list = list;
    function filtered(iter, pred) {
        return () => {
            for (;;) {
                var val = iter();
                if (val == null)
                    return null;
                if (pred(val))
                    return val;
            }
        };
    }
    exports.filtered = filtered;
    function toList(iter) {
        var list = new Array();
        for (;;) {
            var val = iter();
            if (val == null)
                break;
            list.push(val);
        }
        return list;
    }
    exports.toList = toList;
});
