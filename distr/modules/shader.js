define(["require", "exports", '../libs/set'], function(require, exports, Set) {
    var Shader = (function () {
        function Shader(gl, prog, params) {
            this.uniforms = {};
            this.attribs = {};
            this.program = prog;
            this.uniformNames = params.uniforms.values();
            this.attributeNames = params.attributes.values();
            this.samplers = params.samplers.values();
            this.initUniformLocations(gl);
            this.initAttributeLocations(gl);
        }
        Shader.prototype.initUniformLocations = function (gl) {
            for (var i in this.uniformNames) {
                var uniform = this.uniformNames[i];
                this.uniforms[uniform] = gl.getUniformLocation(this.program, uniform);
            }
        };

        Shader.prototype.initAttributeLocations = function (gl) {
            for (var i in this.attributeNames) {
                var attrib = this.attributeNames[i];
                this.attribs[attrib] = gl.getAttribLocation(this.program, attrib);
            }
        };

        Shader.prototype.getUniformLocation = function (name, gl) {
            return this.uniforms[name];
        };

        Shader.prototype.getAttributeLocation = function (name, gl) {
            return this.attribs[name];
        };

        Shader.prototype.getProgram = function () {
            return this.program;
        };

        Shader.prototype.getUniforms = function () {
            return this.uniformNames;
        };

        Shader.prototype.getAttributes = function () {
            return this.attributeNames;
        };

        Shader.prototype.getSamplers = function () {
            return this.samplers;
        };
        return Shader;
    })();
    exports.Shader = Shader;

    function createShader(gl, vertexSrc, fragmentSrc) {
        function compileSource(type, source) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw 'compile error: ' + gl.getShaderInfoLog(shader);
            }
            return shader;
        }

        var params = processShaders(vertexSrc, fragmentSrc);

        var program = gl.createProgram();
        gl.attachShader(program, compileSource(gl.VERTEX_SHADER, vertexSrc));
        gl.attachShader(program, compileSource(gl.FRAGMENT_SHADER, fragmentSrc));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw 'link error: ' + gl.getProgramInfoLog(program);
        }

        return new Shader(gl, program, params);
    }
    exports.createShader = createShader;

    function processLine(line, params) {
        var m = line.match(/uniform +[a-zA-Z0-9_]+ +([a-zA-Z0-9_]+)/);
        if (m != null)
            params.uniforms.add(m[1]);
        m = line.match(/attribute +[a-zA-Z0-9_]+ +([a-zA-Z0-9_]+)/);
        if (m != null)
            params.attributes.add(m[1]);
        m = line.match(/uniform sampler2D +([a-zA-Z0-9_]+)/);
        if (m != null)
            params.samplers.add(m[1]);
    }

    function createParams() {
        var params = {};
        params.uniforms = Set.create();
        params.attributes = Set.create();
        params.samplers = Set.create();
        return params;
    }

    function processShaders(vsh, fsh) {
        var params = createParams();
        var shaders = [vsh, fsh];
        for (var i in shaders) {
            var shader = shaders[i];
            var lines = shader.split("\n");
            for (var l in lines) {
                var line = lines[l];
                processLine(line, params);
            }
        }
        return params;
    }
});
