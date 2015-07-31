define(["require", "exports", './list'], function(require, exports, L) {
    var Particle = (function () {
        function Particle() {
            this.attr = {};
        }
        return Particle;
    })();
    exports.Particle = Particle;

    var ParticleSystem = (function () {
        function ParticleSystem(n, initf, updatef, dief) {
            this.initf = initf;
            this.updatef = updatef;
            this.dief = dief;
            this.pool = new L.List();
            this.active = new L.List();
            this.idMap = {};
            this.count = n;
            this.createPool(n);
        }
        ParticleSystem.prototype.createPool = function (n) {
            for (var i = 0; i < n; i++) {
                var p = new Particle();
                p.id = i;
                this.idMap[i] = p;
                this.pool.insertAfter(p);
            }
        };

        ParticleSystem.prototype.update = function (dt) {
            if (dt == 0)
                return;

            var node = this.active.first();
            var term = this.active.last().next;
            while (node != term) {
                var p = node.obj;

                p.t += dt / p.ttl;
                if (p.t >= 1) {
                    var remove = this.dief(p);
                    if (remove) {
                        var next = node.next;
                        this.pool.insertNodeAfter(this.active.remove(node));
                        node = next;
                    }
                    continue;
                }
                this.updatef(p, dt);
                node = node.next;
            }
        };

        ParticleSystem.prototype.getParticles = function () {
            return this.active;
        };

        ParticleSystem.prototype.getById = function (id) {
            return this.idMap[id];
        };

        ParticleSystem.prototype.emit = function () {
            if (this.pool.isEmpty())
                return;
            var node = this.pool.remove(this.pool.last());
            this.initf(node.obj);
            node.obj.t = 0;
            this.active.insertNodeAfter(node);
        };
        return ParticleSystem;
    })();
    exports.ParticleSystem = ParticleSystem;
});
