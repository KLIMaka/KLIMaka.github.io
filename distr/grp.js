define(["require", "exports", './modules/engines/build/art', './libs/imgutils', './modules/pixelprovider', './libs/getter', './libs/dataviewstream'], function(require, exports, ART, IU, pixel, getter, data) {
    var path = 'resources/engines/blood/';
    var artNames = [];
    for (var a = 0; a < 18; a++) {
        artNames[a] = path + 'TILES0' + ("00" + a).slice(-2) + '.ART';
        getter.loader.load(artNames[a]);
    }

    getter.loader.load('resources/engines/blood/palette.dat').finish(function () {
        var pal = new Uint8Array(getter.get('resources/engines/blood/palette.dat'));

        var arts = [];
        for (var a = 0; a < 18; a++)
            arts.push(ART.create(new data.DataViewStream(getter.get(artNames[a]), true)));
        var artFiles = ART.createArts(arts);
        for (var i = 0; i < 18 * 256; i++) {
            var info = artFiles.getInfo(i);
            if (info == null || info.w == 0 || info.h == 0)
                continue;
            var pp = pixel.axisSwap(pixel.fromPal(info.img, pal, info.w, info.h, 255, 255));
            document.body.appendChild(IU.createCanvas(pp));
        }
    });
});
