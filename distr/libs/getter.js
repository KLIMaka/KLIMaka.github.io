define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var cache = {};
    class Loader {
        constructor() {
            this.toLoad = 0;
        }
        load(fname, progress = null) {
            var self = this;
            preload(fname, (b) => { cache[fname] = b; self.ready(fname); }, progress);
            this.toLoad++;
            return this;
        }
        loadString(fname) {
            var self = this;
            preloadString(fname, (s) => { cache[fname] = s; self.ready(fname); });
            this.toLoad++;
            return this;
        }
        finish(callback) {
            this.callback = callback;
        }
        ready(fname) {
            this.toLoad--;
            if (this.toLoad == 0)
                this.callback();
        }
    }
    exports.Loader = Loader;
    exports.loader = new Loader();
    function get(fname) {
        return cache[fname];
    }
    exports.get = get;
    function getString(fname) {
        return cache[fname];
    }
    exports.getString = getString;
    function preload(fname, callback, progressCallback = null) {
        var file = cache[fname];
        if (file != undefined) {
            callback(file);
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.onload = () => { callback(xhr.response); };
        if (progressCallback)
            xhr.onprogress = (evt) => { progressCallback(evt.loaded / evt.total); };
        xhr.open('GET', fname, true);
        xhr.responseType = 'arraybuffer';
        xhr.send();
    }
    exports.preload = preload;
    function preloadString(fname, callback) {
        var file = cache[fname];
        if (file != undefined) {
            callback(file);
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.responseType = "text";
        xhr.onload = () => { callback(xhr.response); };
        xhr.open('GET', fname, true);
        xhr.send();
    }
    exports.preloadString = preloadString;
});
