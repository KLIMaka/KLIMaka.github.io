define(["require", "exports", "../libs/mathutils"], function (require, exports, MU) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DefaultAnimated {
        constructor(frames, fps) {
            this.frames = frames;
            this.fps = fps;
            this.start_t = -1;
            this.currentFrame = 0;
        }
        start(secs) {
            this.start_t = secs;
        }
        isStarted() {
            return this.start_t != -1;
        }
        stop() {
            this.start_t = -1;
        }
        animate(secs) {
            if (this.start_t == -1)
                return this.frames[this.currentFrame];
            var dt = secs - this.start_t;
            var df = MU.int(dt * this.fps);
            this.currentFrame = df % this.frames.length;
            return this.frames[this.currentFrame];
        }
    }
    exports.DefaultAnimated = DefaultAnimated;
});
