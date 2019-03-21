define(["require", "exports", "./list"], function (require, exports, L) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Place {
        constructor(offset, size, data = null) {
            this.offset = offset;
            this.size = size;
            this.data = data;
        }
    }
    exports.Place = Place;
    class Bag {
        constructor(size) {
            this.size = size;
            this.reset();
        }
        getSuitablePlace(size) {
            for (var hole = this.holes.first(); hole != this.holes.terminator(); hole = hole.next) {
                if (hole.obj.size >= size)
                    return hole;
            }
            return null;
        }
        tryMerge(node) {
            if (node != this.holes.terminator() && node.next != this.holes.terminator()) {
                if (node.obj.offset + node.obj.size == node.next.obj.offset) {
                    node.obj.size += node.next.obj.size;
                    this.holes.remove(node.next);
                    this.tryMerge(node);
                }
            }
        }
        put(offset, size) {
            var hole = this.holes.first();
            if (hole == this.holes.terminator()) {
                this.holes.insertAfter(new Place(offset, size));
                return;
            }
            while (hole.next != this.holes.terminator()) {
                var next = hole.next;
                if (next.obj.offset >= size + offset)
                    break;
                hole = next;
            }
            var end = hole.obj.offset + hole.obj.size;
            if (end > offset)
                throw new Error('Object does not fit in hole');
            if (end == offset) {
                hole.obj.size += size;
                this.tryMerge(hole);
            }
            else if (hole.next != this.holes.terminator() && offset + size == hole.next.obj.offset) {
                hole.next.obj.offset -= size;
                hole.next.obj.size += size;
            }
            else {
                this.holes.insertAfter(new Place(offset, size), hole);
            }
        }
        get(size) {
            var hole = this.getSuitablePlace(size);
            if (hole == null)
                return null;
            if (hole.obj.size == size) {
                var prev = hole.prev;
                this.holes.remove(hole);
                this.tryMerge(prev);
                return hole.obj.offset;
            }
            else {
                var off = hole.obj.offset;
                hole.obj.offset += size;
                hole.obj.size -= size;
                return off;
            }
        }
        reset() {
            this.holes = new L.List();
            this.holes.insertAfter(new Place(0, this.size));
        }
    }
    exports.Bag = Bag;
    class BagController {
        constructor(size, updater) {
            this.places = {};
            this.bag = new Bag(size);
            this.updater = updater;
        }
        get(size) {
            var offset = this.bag.get(size);
            if (offset == null) {
                this.optimize();
                offset = this.bag.get(size);
            }
            if (offset == null)
                throw new Error('No space');
            var result = new Place(offset, size);
            this.places[offset] = result;
            return result;
        }
        put(place) {
            this.bag.put(place.offset, place.size);
            delete this.places[place.offset];
        }
        optimize() {
            var places = this.places;
            var keys = Object.keys(places);
            this.places = {};
            this.bag.reset();
            var offset = 0;
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var place = places[key];
                this.places[offset] = place;
                if (place.offset == offset)
                    continue;
                this.updater(place, offset);
                place.offset = offset;
                offset += place.size;
            }
            this.bag.get(offset);
        }
    }
    exports.BagController = BagController;
    function create(size) {
        return new Bag(size);
    }
    exports.create = create;
    function createController(size, updater) {
        return new BagController(size, updater);
    }
    exports.createController = createController;
});
