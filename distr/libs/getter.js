define(["require", "exports"], function(require, exports) {
    var cache = {};

    var Loader = (function () {
        function Loader() {
            this.toLoad = 0;
        }
        Loader.prototype.load = function (fname) {
            var self = this;
            exports.preload(fname, function (b) {
                cache[fname] = b;
                self.ready(fname);
            });
            this.toLoad++;
            return this;
        };

        Loader.prototype.loadString = function (fname) {
            var self = this;
            exports.preloadString(fname, function (s) {
                cache[fname] = s;
                self.ready(fname);
            });
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

    function preload(fname, callback) {
        var file = cache[fname];
        if (file != undefined) {
            callback(file);
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            callback(xhr.response);
        };
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
        xhr.onload = function () {
            callback(xhr.response);
        };
        xhr.open('GET', fname, true);
        xhr.send();
    }
    exports.preloadString = preloadString;
});
