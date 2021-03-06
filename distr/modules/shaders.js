define(["require", "exports", "../libs/set", "../libs/getter", "../libs/asyncbarrier"], function (require, exports, Set, getter, AB) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var defaultFSH = 'void main(){gl_FragColor = vec4(0.0);}';
    var defaultVSH = 'void main(){gl_Position = vec4(0.0);}';
    var defaultProgram = null;
    class Shader {
        constructor(prog, initCallback = null) {
            this.uniforms = {};
            this.attribs = {};
            this.uniformNames = [];
            this.attributeNames = [];
            this.samplers = [];
            this.program = prog;
            this.initCallback = initCallback;
        }
        init(gl, prog, params) {
            this.program = prog;
            this.uniformNames = params.uniforms.values();
            this.attributeNames = params.attributes.values();
            this.samplers = params.samplers.values();
            this.initUniformLocations(gl);
            this.initAttributeLocations(gl);
            if (this.initCallback != null)
                this.initCallback(this);
        }
        initUniformLocations(gl) {
            for (var i in this.uniformNames) {
                var uniform = this.uniformNames[i];
                this.uniforms[uniform] = gl.getUniformLocation(this.program, uniform);
            }
        }
        initAttributeLocations(gl) {
            for (var i in this.attributeNames) {
                var attrib = this.attributeNames[i];
                this.attribs[attrib] = gl.getAttribLocation(this.program, attrib);
            }
        }
        getUniformLocation(name, gl) {
            return this.uniforms[name];
        }
        getAttributeLocation(name, gl) {
            return this.attribs[name];
        }
        getProgram() {
            return this.program;
        }
        getUniforms() {
            return this.uniformNames;
        }
        getAttributes() {
            return this.attributeNames;
        }
        getSamplers() {
            return this.samplers;
        }
    }
    exports.Shader = Shader;
    var cache = {};
    function createShader(gl, name, defines = [], initCallback = null) {
        // var shader = cache[name];
        // if (shader != undefined)
        //   return shader;
        if (defaultProgram == null) {
            defaultProgram = compileProgram(gl, defaultVSH, defaultFSH);
        }
        var shader = new Shader(defaultProgram);
        var barrier = AB.create();
        var deftext = prepareDefines(defines);
        getter.preloadString(name + '.vsh', barrier.callback('vsh'));
        getter.preloadString(name + '.fsh', barrier.callback('fsh'));
        barrier.wait((res) => { initShader(gl, shader, deftext + res.vsh, deftext + res.fsh); });
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
        var barrier = AB.create();
        preprocess(vsh, barrier.callback('vsh'));
        preprocess(fsh, barrier.callback('fsh'));
        barrier.wait((res) => {
            var program = compileProgram(gl, res.vsh, res.fsh);
            var params = processShaders(res.vsh, res.fsh);
            shader.init(gl, program, params);
        });
    }
    function prepareDefines(defines) {
        var result = '';
        for (var i = 0; i < defines.length; i++) {
            result += "#define " + defines[i] + ";\n";
        }
        return result;
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
            throw 'compile error: ' + gl.getShaderInfoLog(shader) + '\nin source:\n' + source;
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
    function preprocess(shader, cb) {
        var lines = shader.split("\n");
        var barrier = AB.create();
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i];
            var m = l.match(/^#include +"([^"]+)"/);
            if (m != null) {
                getter.preloadString(m[1], barrier.callback(i + ''));
            }
        }
        barrier.wait((incs) => {
            var res = [];
            for (var i = 0; i < lines.length; i++) {
                var inc = incs[i + ''];
                res.push(inc == undefined ? lines[i] : inc);
            }
            cb(res.join("\n"));
        });
    }
});
