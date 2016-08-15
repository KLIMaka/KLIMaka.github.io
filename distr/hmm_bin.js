define(["require", "exports", './modules/engines/hmm2/agg', './modules/engines/hmm2/icn', './modules/engines/hmm2/bin', './libs/getter', './libs/browser'], function(require, exports, AGG, ICN, BIN, getter, BROWSER) {
    var IP = (function () {
        function IP(aggFile) {
            this.aggFile = aggFile;
        }
        IP.prototype.get = function (name) {
            return ICN.create(this.aggFile.get(name.toUpperCase()));
        };
        return IP;
    })();

    var RES = 'resources/engines/h2/heroes2.agg';

    getter.loader.load(RES).finish(function () {
        var aggFile = AGG.create(getter.get(RES));
        var pal = AGG.createPalette(aggFile.get('KB.PAL'));
        var ip = new IP(aggFile);
        var bin = BIN.create(aggFile.get(BROWSER.getQueryVariable('name')), pal);
        var canvas = bin.render(ip);
        document.body.appendChild(canvas);
    });
});
