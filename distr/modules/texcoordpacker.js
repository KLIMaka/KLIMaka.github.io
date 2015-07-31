define(["require", "exports"], function(require, exports) {
    var Rect = (function () {
        function Rect(w, h, xoff, yoff) {
            if (typeof xoff === "undefined") { xoff = 0; }
            if (typeof yoff === "undefined") { yoff = 0; }
            this.w = w;
            this.h = h;
            this.xoff = xoff;
            this.yoff = yoff;
        }
        return Rect;
    })();
    exports.Rect = Rect;

    var Packer = (function () {
        function Packer(w, h, wpad, hpad, xoff, yoff) {
            if (typeof wpad === "undefined") { wpad = 1; }
            if (typeof hpad === "undefined") { hpad = 1; }
            if (typeof xoff === "undefined") { xoff = 0; }
            if (typeof yoff === "undefined") { yoff = 0; }
            this.sized = false;
            this.width = w;
            this.height = h;
            this.wpad = wpad;
            this.hpad = hpad;
            this.xoff = xoff;
            this.yoff = yoff;
        }
        Packer.prototype.pack = function (rect) {
            if (this.sized) {
                var r = null;
                if (this.p1 != null)
                    r = this.p1.pack(rect);
                if (r == null && this.p2 != null)
                    r = this.p2.pack(rect);
                return r;
            } else {
                var nw = rect.w + this.wpad * 2;
                var nh = rect.h + this.hpad * 2;
                if (nw <= this.width && nh <= this.height) {
                    rect.xoff = this.xoff + this.wpad;
                    rect.yoff = this.yoff + this.hpad;
                    this.sized = true;
                    if (nw != this.width) {
                        this.p1 = new Packer(this.width - nw, nh, this.wpad, this.hpad, this.xoff + nw, this.yoff);
                    }
                    if (nh != this.height) {
                        this.p2 = new Packer(this.width, this.height - nh, this.wpad, this.hpad, this.xoff, this.yoff + nh);
                    }
                    return rect;
                }
                return null;
            }
        };
        return Packer;
    })();
    exports.Packer = Packer;

    var Hull = (function () {
        function Hull(minx, maxx, miny, maxy) {
            this.minx = minx;
            this.maxx = maxx;
            this.miny = miny;
            this.maxy = maxy;
        }
        return Hull;
    })();
    exports.Hull = Hull;

    function getHull(vtxs) {
        var maxx = vtxs[0][0];
        var maxy = vtxs[0][1];
        var minx = vtxs[0][0];
        var miny = vtxs[0][1];
        for (var i = 0; i < vtxs.length; i++) {
            var vtx = vtxs[i];
            if (vtx[0] < minx)
                minx = vtx[0];
            if (vtx[0] > maxx)
                maxx = vtx[0];
            if (vtx[1] < miny)
                miny = vtx[1];
            if (vtx[1] > maxy)
                maxy = vtx[1];
        }
        return new Hull(minx, maxx, miny, maxy);
    }
    exports.getHull = getHull;
});
