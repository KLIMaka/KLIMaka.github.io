define(["require", "exports", '../libs/set', '../libs/getter'], function(require, exports, Set, getter) {
    var defaultFSH = 'void main(){gl_FragColor = vec4(0.0);}';
    var defaultVSH = 'void main(){gl_Position = vec4(0.0);}';
    var defaultProgram = null;

    var Shader = (function () {
        function Shader(prog) {
            this.uniforms = {};
            this.attribs = {};
            this.uniformNames = [];
            this.attributeNames = [];
            this.samplers = [];
            this.program = prog;
        }
        Shader.prototype.init = function (gl, prog, params) {
            this.program = prog;
            this.uniformNames = params.uniforms.values();
            this.attributeNames = params.attributes.values();
            this.samplers = params.samplers.values();
            this.initUniformLocations(gl);
            this.initAttributeLocations(gl);
        };

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

    var cache = {};

    function createShader(gl, name) {
        var shader = cache[name];
        if (shader != undefined)
            return shader;

        if (defaultProgram == null) {
            defaultProgram = compileProgram(gl, defaultVSH, defaultFSH);
        }

        var shader = new Shader(defaultProgram);
        var vsh = null;
        var fsh = null;
        getter.preloadString(name + '.vsh', function (s) {
            vsh = s;
            if (fsh != null)
                initShader(gl, shader, vsh, fsh);
        });
        getter.preloadString(name + '.fsh', function (s) {
            fsh = s;
            if (vsh != null)
                initShader(gl, shader, vsh, fsh);
        });

        cache[name] = shader;
        return shader;
    }
    exports.createShader = createShader;

    function createShaderFromSrc(gl, vsh, fsh) {
        var shader = new Shader(compileProgram(gl, vsh, fsh));
        initShader(gl, shader, vsh, fsh);
        return shader;
    }
    exports.createShaderFromSrc = createShaderFromSrc;

    function initShader(gl, shader, vsh, fsh) {
        var program = compileProgram(gl, vsh, fsh);
        var params = processShaders(vsh, fsh);
        shader.init(gl, program, params);
    }

    function compileProgram(gl, vsh, fsh) {
        var program = gl.createProgram();
        gl.attachShader(program, compileSource(gl, gl.VERTEX_SHADER, vsh));
        gl.attachShader(program, compileSource(gl, gl.FRAGMENT_SHADER, fsh));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw 'link error: ' + gl.getProgramInfoLog(program);
        }
        return program;
    }

    function compileSource(gl, type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw 'compile error: ' + gl.getShaderInfoLog(shader);
        }
        return shader;
    }

    function processLine(line, params) {
        var m = line.match(/^uniform +[a-zA-Z0-9_]+ +([a-zA-Z0-9_]+)/);
        if (m != null)
            params.uniforms.add(m[1]);
        m = line.match(/^attribute +[a-zA-Z0-9_]+ +([a-zA-Z0-9_]+)/);
        if (m != null)
            params.attributes.add(m[1]);
        m = line.match(/^uniform sampler2D +([a-zA-Z0-9_]+)/);
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
