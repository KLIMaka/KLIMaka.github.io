define(["require", "exports", './modules/rasterizer', 'modules/particles'], function(require, exports, __raster__, __P__) {
    
    var raster = __raster__;
    var P = __P__;

    function updateBuffers(ps, buffer) {
        var plist = ps.getParticles();
        var term = plist.last().next;
        var idx = 0;
        for (var node = plist.first(); node != term; node = node.next) {
            var p = node.obj;
            var hs = p.attr.size / 2;
            var id = p.id;
            buffer[idx + 0] = p.x - hs;
            buffer[idx + 1] = p.y - hs;
            buffer[idx + 2] = id;
            buffer[idx + 3] = p.x - hs;
            buffer[idx + 4] = p.y + hs;
            buffer[idx + 5] = id;
            buffer[idx + 6] = p.x + hs;
            buffer[idx + 7] = p.y + hs;
            buffer[idx + 8] = id;
            buffer[idx + 9] = p.x + hs;
            buffer[idx + 10] = p.y - hs;
            buffer[idx + 11] = id;
            idx += 12;
        }
        return 6 * idx / 12;
    }

    function createIdxs(n) {
        var idxs = [];
        for (var i = 0; i < n; i++) {
            var idx = i * 4;
            idxs.push(idx, idx + 1, idx + 2, idx, idx + 2, idx + 3);
        }
        return idxs;
    }

    function init(p) {
        p.x = x;
        p.y = y;
        p.ttl = Math.random() * 4;

        p.attr.size = (1 / h) + (8 / h) * Math.random();

        var ang = Math.random() * Math.PI * 2;
        var acc = Math.random();
        p.vx = (Math.random() - 0.5) * 0.01;
        p.vy = -Math.random() * 0.5;
    }

    function update(p, dt) {
        // p.attr.size += (4/h)*dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= (1 - dt);
        p.vx += (Math.random() - 0.5) * 0.05;
        p.vy -= dt * 0.5;
    }

    function die(p) {
        return true;
    }

    var count = 1000;
    var w = 300;
    var h = 300;
    var x = 0.5;
    var y = 0.5;

    var particles = new P.ParticleSystem(count, init, update, die);
    var buffer = new Array(count * 12);
    var idxs = createIdxs(count);

    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    document.body.appendChild(canvas);

    canvas.onmousemove = function (e) {
        x = e.x / w;
        y = e.y / h;
        for (var i = 0; i < 100; i++)
            particles.emit();
    };

    var bg = [128, 128, 128, 255];
    var pixel = [255, 255, 255, 255];
    var ctx = canvas.getContext('2d');
    var img = ctx.getImageData(0, 0, w, h);
    var rast = new raster.Rasterizer(img, function (attrs) {
        pixel[3] = (1 - particles.getById(attrs[2]).t) * 256;
        return pixel;
    });
    rast.bindAttributes(0, buffer, 3);

    var time = new Date().getTime();

    function update_frame() {
        var now = new Date().getTime();
        var dt = (now - time) / 1000;

        particles.update(dt);
        var size = updateBuffers(particles, buffer);

        rast.clear(bg, 0);
        rast.drawTriangles(idxs, 0, size);
        ctx.putImageData(img, 0, 0);
        requestAnimationFrame(update_frame);
        time = now;
    }

    update_frame();
});
