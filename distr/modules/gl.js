define(["require", "exports", './batcher'], function(require, exports, BATCH) {
    function createContext(w, h, opts) {
        if (typeof opts === "undefined") { opts = {}; }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var gl = canvas.getContext('webgl', opts);

        document.body.appendChild(gl.canvas);
        document.body.style.overflow = 'hidden';
        gl.canvas.style.position = 'absolute';
        return gl;
    }
    exports.createContext = createContext;

    function animate(gl, callback) {
        var time = new Date().getTime();

        function update() {
            var now = new Date().getTime();
            callback(gl, (now - time) / 1000);
            requestAnimationFrame(update);
            time = now;
        }

        update();
    }
    exports.animate = animate;

    var UniformMatrix4fvSetter = (function () {
        function UniformMatrix4fvSetter() {
        }
        UniformMatrix4fvSetter.prototype.setUniform = function (gl, location, value) {
            gl.uniformMatrix4fv(location, false, value);
        };
        return UniformMatrix4fvSetter;
    })();
    exports.UniformMatrix4fvSetter = UniformMatrix4fvSetter;
    exports.mat4Setter = new UniformMatrix4fvSetter();

    var Uniform3fvSetter = (function () {
        function Uniform3fvSetter() {
        }
        Uniform3fvSetter.prototype.setUniform = function (gl, location, value) {
            gl.uniform3fv(location, value);
        };
        return Uniform3fvSetter;
    })();
    exports.Uniform3fvSetter = Uniform3fvSetter;
    exports.vec3Setter = new Uniform3fvSetter();

    var Uniform4fvSetter = (function () {
        function Uniform4fvSetter() {
        }
        Uniform4fvSetter.prototype.setUniform = function (gl, location, value) {
            gl.uniform4fv(location, value);
        };
        return Uniform4fvSetter;
    })();
    exports.Uniform4fvSetter = Uniform4fvSetter;
    exports.vec4Setter = new Uniform4fvSetter();

    var UniformIntSetter = (function () {
        function UniformIntSetter() {
        }
        UniformIntSetter.prototype.setUniform = function (gl, location, value) {
            gl.uniform1i(location, value);
        };
        return UniformIntSetter;
    })();
    exports.UniformIntSetter = UniformIntSetter;
    exports.int1Setter = new UniformIntSetter();

    var UniformFloatSetter = (function () {
        function UniformFloatSetter() {
        }
        UniformFloatSetter.prototype.setUniform = function (gl, location, value) {
            gl.uniform1f(location, value);
        };
        return UniformFloatSetter;
    })();
    exports.UniformFloatSetter = UniformFloatSetter;
    exports.float1Setter = new UniformFloatSetter();

    var UniformBinder = (function () {
        function UniformBinder() {
            this.resolvers = {};
            this.setters = {};
        }
        UniformBinder.prototype.bind = function (gl, shader) {
            var uniforms = shader.getUniforms();
            for (var i = 0; i < uniforms.length; i++) {
                var uniform = uniforms[i];
                if (this.resolvers[uniform] == undefined)
                    continue;
                var loc = shader.getUniformLocation(uniform, gl);
                if (!loc)
                    continue;
                var value = this.resolvers[uniform]();
                this.setters[uniform].setUniform(gl, loc, value);
            }
        };

        UniformBinder.prototype.addResolver = function (name, setter, resolver) {
            this.setters[name] = setter;
            this.resolvers[name] = resolver;
        };
        return UniformBinder;
    })();
    exports.UniformBinder = UniformBinder;

    function binder(resolvers) {
        var binder = new UniformBinder();
        for (var i = 0; i < resolvers.length; i++) {
            var r = resolvers[i];
            binder.addResolver(r[0], r[1], r[2]);
        }
        return binder;
    }
    exports.binder = binder;

    function globalUniforms(gl, shader, globalBinder) {
        globalBinder.bind(gl, shader);
        return shader;
    }

    function drawModel(gl, shader, model) {
        var samplers = shader.getSamplers();
        for (var unit = 0; unit < samplers.length; unit++) {
            var sampler = samplers[unit];
            gl.bindTexture(gl.TEXTURE_2D, model.getMaterial().getTexture(sampler).get());
        }
        gl.drawElements(model.getMode(), model.getLength(), gl.UNSIGNED_SHORT, model.getOffset());
        return shader;
    }

    function initTextures(gl, shader, data) {
        var samplers = shader.getSamplers();
        for (var unit = 0; unit < samplers.length; unit++) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            var sampler = samplers[unit];
            gl.uniform1i(shader.getUniformLocation(sampler, gl), unit);
        }
        return shader;
    }

    function draw(gl, models, globalBinder) {
        var cmds = [];
        var curshader = null;
        for (var m = 0; m < models.length; m++) {
            var model = models[m];
            if (curshader != model.getMaterial().getShader()) {
                cmds.push(BATCH.shader, model.getMaterial().getShader());
                cmds.push(BATCH.vertexBuffers, model.getVertexBuffers());
                cmds.push(BATCH.indexBuffer, model.getIndexBuffer());
                cmds.push(globalUniforms, globalBinder);
                cmds.push(initTextures, null);
                curshader = model.getMaterial().getShader();
            }
            cmds.push(drawModel, models[m]);
        }
        new BATCH.exec(cmds, gl);
    }
    exports.draw = draw;

    var pixel = new Uint8Array(4);
    function readId(gl, x, y) {
        gl.readPixels(x, gl.drawingBufferHeight - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        return pixel[0] | pixel[1] << 8 | pixel[2] << 16;
    }
    exports.readId = readId;
});
