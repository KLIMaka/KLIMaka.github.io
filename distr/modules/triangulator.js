define(["require", "exports", '../libs_js/poly2tri'], function(require, exports, p2t) {
    function point(p) {
        return new p2t.Point(p[0], p[1]);
    }

    function getTriangles(tris) {
        var ret = new Array(tris.length * 3);
        for (var i = 0; i < tris.length * 3; i += 3) {
            var tri = tris[i / 3];
            ret[i + 0] = [tri.GetPoint(0).x, tri.GetPoint(0).y];
            ret[i + 1] = [tri.GetPoint(1).x, tri.GetPoint(1).y];
            ret[i + 2] = [tri.GetPoint(2).x, tri.GetPoint(2).y];
        }
        return ret;
    }

    function triangulate(contour, holes) {
        var c = new Array(contour.length);
        for (var i = 0; i < contour.length; i++)
            c[i] = point(contour[i]);
        var ctx = new p2t.SweepContext(c);
        for (var i = 0; i < holes.length; i++) {
            var hole = holes[i];
            var h = new Array(hole.length);
            for (var j = 0; j < hole.length; j++)
                h[j] = point(hole[j]);
            ctx.addHole(h);
        }
        p2t.sweep.Triangulate(ctx);
        return getTriangles(ctx.getTriangles());
    }
    exports.triangulate = triangulate;
});
