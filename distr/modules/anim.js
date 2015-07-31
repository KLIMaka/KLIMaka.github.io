define(["require", "exports", '../libs/mathutils'], function(require, exports, MU) {
    var DefaultAnimated = (function () {
        function DefaultAnimated(frames, fps) {
            this.frames = frames;
            this.fps = fps;
            this.start_t = -1;
            this.currentFrame = 0;
        }
        DefaultAnimated.prototype.start = function (secs) {
            this.start_t = secs;
        };

        DefaultAnimated.prototype.isStarted = function () {
            return this.start_t != -1;
        };

        DefaultAnimated.prototype.stop = function () {
            this.start_t = -1;
        };

        DefaultAnimated.prototype.animate = function (secs) {
            if (this.start_t == -1)
                return this.frames[this.currentFrame];
            var dt = secs - this.start_t;
            var df = MU.int(dt * this.fps);
            this.currentFrame = df % this.frames.length;
            return this.frames[this.currentFrame];
        };
        return DefaultAnimated;
    })();
    exports.DefaultAnimated = DefaultAnimated;
});
