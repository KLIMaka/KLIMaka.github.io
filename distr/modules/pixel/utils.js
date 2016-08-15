define(["require", "exports"], function(require, exports) {
    function euclidean_len(r1, g1, b1, r2, g2, b2) {
        return Math.abs(Math.sqrt(r1 * r1 + g1 * g1 + b1 * b1) - Math.sqrt(r2 * r2 + g2 * g2 + b2 * b2));
    }
    exports.euclidean_len = euclidean_len;

    function matchColor(r, g, b, pal, len) {
        if (typeof len === "undefined") { len = exports.euclidean_len; }
        var matched = 0;
        var minLen = len(r, g, b, pal[0], pal[1], pal[2]);
        var colors = pal.length;
        for (var i = 3; i < colors; i += 3) {
            var l = len(r, g, b, pal[i], pal[i + 1], pal[i + 2]);
            if (l < minLen) {
                matched = i / 3;
                minLen = l;
            }
        }
        return matched;
    }
    exports.matchColor = matchColor;

    function matchRGBAImage(img, pal, len) {
        if (typeof len === "undefined") { len = exports.euclidean_len; }
        var size = img.length / 4;
        var indexed = new Uint8Array(size);
        for (var i = 0; i < size; i++) {
            var off = i * 4;
            indexed[i] = exports.matchColor(img[off], img[off + 1], img[off + 2], pal, len);
        }
        return indexed;
    }
    exports.matchRGBAImage = matchRGBAImage;

    function print(x, y, wdst, w, buf, data) {
        var off = y * wdst + x;
        var len = data.length;
        var line = 0;
        for (var i = 0; i < len; i++, line++, off++) {
            if (line == w) {
                off += wdst - line;
                line = 0;
            }
            buf[off] = data[i];
        }
    }
    exports.print = print;

    function string2bytes(str) {
        var len = str.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++)
            bytes[i] = str.charCodeAt(i);
        return bytes;
    }
    exports.string2bytes = string2bytes;

    function printString(x, y, wdst, w, buf, str) {
        exports.print(x, y, wdst, w, buf, exports.string2bytes(str));
    }
    exports.printString = printString;
});
