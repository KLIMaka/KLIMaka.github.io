define(["require", "exports"], function (require, exports) {
    var cache = {};
    var Loader = (function () {
        function Loader() {
            this.toLoad = 0;
        }
        Loader.prototype.load = function (fname, progress) {
            if (progress === void 0) { progress = null; }
            var self = this;
            preload(fname, function (b) { cache[fname] = b; self.ready(fname); }, progress);
            this.toLoad++;
            return this;
        };
        Loader.prototype.loadString = function (fname) {
            var self = this;
            preloadString(fname, function (s) { cache[fname] = s; self.ready(fname); });
            this.toLoad++;
            return this;
        };
        Loader.prototype.finish = function (callback) {
            this.callback = callback;
        };
        Loader.prototype.ready = function (fname) {
            this.toLoad--;
            if (this.toLoad == 0)
                this.callback();
        };
        return Loader;
    })();
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
    function preload(fname, callback, progressCallback) {
        if (progressCallback === void 0) { progressCallback = null; }
        var file = cache[fname];
        if (file != undefined) {
            callback(file);
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.onload = function () { callback(xhr.response); };
        if (progressCallback)
            xhr.onprogress = function (evt) { progressCallback(evt.loaded / evt.total); };
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
        xhr.onload = function () { callback(xhr.response); };
        xhr.open('GET', fname, true);
        xhr.send();
    }
    exports.preloadString = preloadString;
});
