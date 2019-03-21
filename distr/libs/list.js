define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Node {
        constructor(obj = null, next = null, prev = null) {
            this.obj = obj;
            this.next = next;
            this.prev = prev;
        }
    }
    exports.Node = Node;
    class List {
        constructor() {
            this.nil = new Node();
            this.nil.next = this.nil;
            this.nil.prev = this.nil;
        }
        first() {
            return this.nil.next;
        }
        last() {
            return this.nil.prev;
        }
        terminator() {
            return this.nil;
        }
        pop() {
            var ret = this.last().obj;
            this.remove(this.last());
            return ret;
        }
        isEmpty() {
            return this.nil.next == this.nil;
        }
        insertNodeBefore(node, ref = this.nil.next) {
            node.next = ref;
            node.prev = ref.prev;
            node.prev.next = node;
            ref.prev = node;
        }
        insertBefore(val, ref = this.nil.next) {
            this.insertNodeBefore(new Node(val), ref);
        }
        insertNodeAfter(node, ref = this.nil.prev) {
            node.next = ref.next;
            node.next.prev = node;
            ref.next = node;
            node.prev = ref;
        }
        insertAfter(val, ref = this.nil.prev) {
            this.insertNodeAfter(new Node(val), ref);
        }
        remove(ref) {
            if (ref == this.nil)
                return;
            ref.next.prev = ref.prev;
            ref.prev.next = ref.next;
            return ref;
        }
    }
    exports.List = List;
});
