define(["require", "exports"], function(require, exports) {
    var Node = (function () {
        function Node(obj, next, prev) {
            if (typeof obj === "undefined") { obj = null; }
            if (typeof next === "undefined") { next = null; }
            if (typeof prev === "undefined") { prev = null; }
            this.obj = obj;
            this.next = next;
            this.prev = prev;
        }
        return Node;
    })();
    exports.Node = Node;

    var List = (function () {
        function List() {
            this.nil = new Node();
            this.nil.next = this.nil;
            this.nil.prev = this.nil;
        }
        List.prototype.first = function () {
            return this.nil.next;
        };

        List.prototype.last = function () {
            return this.nil.prev;
        };

        List.prototype.pop = function () {
            var ret = this.last().obj;
            this.remove(this.last());
            return ret;
        };

        List.prototype.isEmpty = function () {
            return this.nil.next == this.nil;
        };

        List.prototype.insertNodeBefore = function (node, ref) {
            if (typeof ref === "undefined") { ref = this.nil.next; }
            node.next = ref;
            node.prev = ref.prev;
            node.prev.next = node;
            ref.prev = node;
        };

        List.prototype.insertBefore = function (val, ref) {
            if (typeof ref === "undefined") { ref = this.nil.next; }
            this.insertNodeBefore(new Node(val), ref);
        };

        List.prototype.insertNodeAfter = function (node, ref) {
            if (typeof ref === "undefined") { ref = this.nil.prev; }
            node.next = ref.next;
            node.next.prev = node;
            ref.next = node;
            node.prev = ref;
        };

        List.prototype.insertAfter = function (val, ref) {
            if (typeof ref === "undefined") { ref = this.nil.prev; }
            this.insertNodeAfter(new Node(val), ref);
        };

        List.prototype.remove = function (ref) {
            if (ref == this.nil)
                return;

            ref.next.prev = ref.prev;
            ref.prev.next = ref.next;
            return ref;
        };
        return List;
    })();
    exports.List = List;
});
