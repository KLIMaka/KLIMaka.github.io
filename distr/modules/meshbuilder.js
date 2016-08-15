var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports"], function (require, exports) {
    var DynamicVertexBufferBuilder = (function () {
        function DynamicVertexBufferBuilder(maxSize, arrayType, type, spacing, normalized) {
            this.maxSize = maxSize;
            this.arrayType = arrayType;
            this.type = type;
            this.spacing = spacing;
            this.normalized = normalized;
            this.lastIdx = 0;
            this.buffer = new arrayType(maxSize * spacing);
        }
        DynamicVertexBufferBuilder.prototype.push = function (data) {
            if (this.lastIdx >= this.maxSize)
                throw new Error('MaxSize limit exceeded');
            var off = this.lastIdx * this.spacing;
            for (var i = 0; i < this.spacing; i++)
                this.buffer[off + i] = data[i];
            this.lastIdx++;
        };
        DynamicVertexBufferBuilder.prototype.tell = function () {
            return this.lastIdx;
        };
        DynamicVertexBufferBuilder.prototype.goto = function (off) {
            this.lastIdx = off;
        };
        DynamicVertexBufferBuilder.prototype.refresh = function (gl) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufIdx);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.buffer);
        };
        DynamicVertexBufferBuilder.prototype.build = function (gl) {
            this.bufIdx = (this.bufIdx == null) ? gl.createBuffer() : this.bufIdx;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufIdx);
            gl.bufferData(gl.ARRAY_BUFFER, this.buffer, gl.STREAM_DRAW);
            return new VertexBufferImpl(this.bufIdx, this.type, this.spacing, this.normalized);
        };
        return DynamicVertexBufferBuilder;
    })();
    exports.DynamicVertexBufferBuilder = DynamicVertexBufferBuilder;
    var VertexBufferImpl = (function () {
        function VertexBufferImpl(buffer, type, spacing, normalized, stride, offset) {
            if (spacing === void 0) { spacing = 3; }
            if (normalized === void 0) { normalized = false; }
            if (stride === void 0) { stride = 0; }
            if (offset === void 0) { offset = 0; }
            this.buffer = buffer;
            this.type = type;
            this.spacing = spacing;
            this.normalized = normalized;
            this.stride = stride;
            this.offset = offset;
        }
        VertexBufferImpl.prototype.getBuffer = function () {
            return this.buffer;
        };
        VertexBufferImpl.prototype.getType = function () {
            return this.type;
        };
        VertexBufferImpl.prototype.getSpacing = function () {
            return this.spacing;
        };
        VertexBufferImpl.prototype.getNormalized = function () {
            return this.normalized;
        };
        VertexBufferImpl.prototype.getStride = function () {
            return this.stride;
        };
        VertexBufferImpl.prototype.getOffset = function () {
            return this.offset;
        };
        return VertexBufferImpl;
    })();
    exports.VertexBufferImpl = VertexBufferImpl;
    var Mesh = (function () {
        function Mesh(material, vtxBuffers, idx, mode, length, offset) {
            if (offset === void 0) { offset = 0; }
            this.material = material;
            this.vtxBuffers = vtxBuffers;
            this.idx = idx;
            this.mode = mode;
            this.length = length;
            this.offset = offset;
        }
        Mesh.prototype.getMaterial = function () {
            return this.material;
        };
        Mesh.prototype.getMode = function () {
            return this.mode;
        };
        Mesh.prototype.getVertexBuffer = function (attribute) {
            return this.vtxBuffers[attribute];
        };
        Mesh.prototype.getAttributes = function () {
            return Object.keys(this.vtxBuffers);
        };
        Mesh.prototype.getIndexBuffer = function () {
            return this.idx;
        };
        Mesh.prototype.getVertexBuffers = function () {
            return this.vtxBuffers;
        };
        Mesh.prototype.getLength = function () {
            return this.length;
        };
        Mesh.prototype.getOffset = function () {
            return this.offset;
        };
        return Mesh;
    })();
    exports.Mesh = Mesh;
    exports.NONE = 0;
    exports.TRIANGLES = 3;
    exports.QUADS = 4;
    var IndexBufferBuilder = (function () {
        function IndexBufferBuilder(arrayType, type) {
            this.arrayType = arrayType;
            this.type = type;
            this.buffer = [];
            this.idx = 0;
            this.mode = exports.NONE;
            this.vtxCounter = 0;
        }
        IndexBufferBuilder.prototype.setMode = function (mode) {
            if (this.vtxCounter != 0)
                throw new Error('Incomplete primitive!');
            this.mode = mode;
            this.vtxCounter = 0;
        };
        IndexBufferBuilder.prototype.vtx = function () {
            this.vtxCounter++;
            if (this.mode == exports.TRIANGLES && this.vtxCounter % exports.TRIANGLES == 0) {
                this.pushTriangle();
                this.vtxCounter = 0;
            }
            if (this.mode == exports.QUADS && this.vtxCounter % exports.QUADS == 0) {
                this.pushQuad();
                this.vtxCounter = 0;
            }
        };
        IndexBufferBuilder.prototype.pushTriangle = function () {
            var idx = this.idx;
            this.buffer.push(idx, idx + 2, idx + 1);
            this.idx += 3;
        };
        IndexBufferBuilder.prototype.pushQuad = function () {
            var idx = this.idx;
            this.buffer.push(idx, idx + 2, idx + 1, idx, idx + 3, idx + 2);
            this.idx += 4;
        };
        IndexBufferBuilder.prototype.length = function () {
            return this.buffer.length;
        };
        IndexBufferBuilder.prototype.buf = function () {
            return this.buffer;
        };
        IndexBufferBuilder.prototype.build = function (gl) {
            this.bufIdx = (this.bufIdx == null) ? gl.createBuffer() : this.bufIdx;
            var data = new this.arrayType(this.buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
            return new IndexBufferImpl(this.bufIdx, this.type);
        };
        return IndexBufferBuilder;
    })();
    exports.IndexBufferBuilder = IndexBufferBuilder;
    var IndexBufferImpl = (function () {
        function IndexBufferImpl(buffer, type) {
            this.buffer = buffer;
            this.type = type;
        }
        IndexBufferImpl.prototype.getBuffer = function () {
            return this.buffer;
        };
        IndexBufferImpl.prototype.getType = function () {
            return this.type;
        };
        return IndexBufferImpl;
    })();
    var MeshBuilder = (function () {
        function MeshBuilder(buffers, idx) {
            this.buffers = buffers;
            this.idx = idx;
            this.attrs = {};
        }
        MeshBuilder.prototype.offset = function () {
            return this.idx.length();
        };
        MeshBuilder.prototype.goto = function (mark) {
            for (var attr in this.buffers) {
                this.buffers[attr].goto(mark[attr]);
            }
        };
        MeshBuilder.prototype.start = function (mode) {
            this.idx.setMode(mode);
            return this;
        };
        MeshBuilder.prototype.attr = function (attr, data) {
            this.attrs[attr] = data;
            return this;
        };
        MeshBuilder.prototype.vtx = function (vtxAttr, data) {
            this.attrs[vtxAttr] = data;
            for (var attr in this.attrs) {
                //noinspection JSUnfilteredForInLoop
                this.buffers[attr].push(this.attrs[attr]);
            }
            this.idx.vtx();
            return this;
        };
        MeshBuilder.prototype.end = function () {
            this.idx.setMode(exports.NONE);
            this.attrs = {};
        };
        MeshBuilder.prototype.idxbuf = function () {
            return this.idx;
        };
        MeshBuilder.prototype.build = function (gl, material) {
            var bufs = {};
            for (var bufName in this.buffers) {
                //noinspection JSUnfilteredForInLoop
                bufs[bufName] = this.buffers[bufName].build(gl);
            }
            var idx = this.idx.build(gl);
            return new Mesh(material, bufs, idx, gl.TRIANGLES, this.idx.length());
        };
        return MeshBuilder;
    })();
    exports.MeshBuilder = MeshBuilder;
    var MeshBuilderConstructor = (function () {
        function MeshBuilderConstructor(size) {
            if (size === void 0) { size = 64 * 1024; }
            this.buffers = {};
            this.size = size;
        }
        MeshBuilderConstructor.prototype.buffer = function (name, arrayType, type, spacing, normalized) {
            if (normalized === void 0) { normalized = false; }
            this.buffers[name] = new DynamicVertexBufferBuilder(this.size, arrayType, type, spacing, normalized);
            return this;
        };
        MeshBuilderConstructor.prototype.index = function (idxArrayType, idxType) {
            this.idx = new IndexBufferBuilder(idxArrayType, idxType);
            return this;
        };
        MeshBuilderConstructor.prototype.build = function () {
            return new MeshBuilder(this.buffers, this.idx);
        };
        return MeshBuilderConstructor;
    })();
    exports.MeshBuilderConstructor = MeshBuilderConstructor;
    function getMax(arr) {
        var max = arr[0];
        for (var i = 1; i < arr.length; i++)
            max = Math.max(max, arr[i]);
        return max;
    }
    function genIndexBuffer(gl, count, pattern) {
        var bufIdx = gl.createBuffer();
        var len = pattern.length;
        var size = getMax(pattern) + 1;
        var data = new Uint16Array(count * len);
        for (var i = 0; i < count; i++) {
            var off = i * len;
            var off1 = i * size;
            for (var j = 0; j < len; j++) {
                data[off + j] = off1 + pattern[j];
            }
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
        return new IndexBufferImpl(bufIdx, gl.UNSIGNED_SHORT);
    }
    exports.genIndexBuffer = genIndexBuffer;
    function GlType2ArrayType(glType) {
        switch (glType) {
            case WebGLRenderingContext.BYTE:
                return Int8Array;
            case WebGLRenderingContext.UNSIGNED_BYTE:
                return Uint8Array;
            case WebGLRenderingContext.SHORT:
                return Int16Array;
            case WebGLRenderingContext.UNSIGNED_SHORT:
                return Uint16Array;
            case WebGLRenderingContext.INT:
                return Int32Array;
            case WebGLRenderingContext.UNSIGNED_INT:
                return Uint32Array;
            case WebGLRenderingContext.FLOAT:
                return Float32Array;
            default:
                throw new Error('Unknown GL Type: ' + glType);
        }
    }
    exports.GlType2ArrayType = GlType2ArrayType;
    function ArrayType2GlType(arrayType) {
        switch (arrayType) {
            case Int8Array:
                return WebGLRenderingContext.BYTE;
            case Uint8Array:
                return WebGLRenderingContext.UNSIGNED_BYTE;
            case Int16Array:
                return WebGLRenderingContext.SHORT;
            case Uint16Array:
                return WebGLRenderingContext.UNSIGNED_SHORT;
            case Int32Array:
                return WebGLRenderingContext.INT;
            case Uint32Array:
                return WebGLRenderingContext.UNSIGNED_INT;
            case Float32Array:
                return WebGLRenderingContext.FLOAT;
            default:
                throw new Error('Unknown Array Type: ' + arrayType);
        }
    }
    exports.ArrayType2GlType = ArrayType2GlType;
    var VertexBufferDynamic = (function (_super) {
        __extends(VertexBufferDynamic, _super);
        function VertexBufferDynamic(gl, type, data, spacing, usage, normalized) {
            if (usage === void 0) { usage = WebGLRenderingContext.STREAM_DRAW; }
            if (normalized === void 0) { normalized = false; }
            _super.call(this, gl.createBuffer(), type, spacing, normalized, 0, 0);
            this.data = data;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.getBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, this.data, usage);
        }
        VertexBufferDynamic.prototype.getData = function () {
            return this.data;
        };
        VertexBufferDynamic.prototype.update = function (gl) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.getBuffer());
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data);
        };
        return VertexBufferDynamic;
    })(VertexBufferImpl);
    exports.VertexBufferDynamic = VertexBufferDynamic;
    function createVertexBuffer(gl, type, data, spacing, usage, norm) {
        if (usage === void 0) { usage = WebGLRenderingContext.STREAM_DRAW; }
        if (norm === void 0) { norm = false; }
        var arrtype = GlType2ArrayType(type);
        if (typeof data == 'number') {
            data = new arrtype(data * spacing);
        }
        else {
            if (arrtype != data.constructor)
                throw new Error('GL Type and ArrayBuffer is incompatible');
        }
        return new VertexBufferDynamic(gl, type, data, spacing, usage, norm);
    }
    exports.createVertexBuffer = createVertexBuffer;
    function wrap(gl, data, spacing, usage, norm) {
        if (usage === void 0) { usage = WebGLRenderingContext.STREAM_DRAW; }
        if (norm === void 0) { norm = false; }
        return new VertexBufferDynamic(gl, ArrayType2GlType(data.constructor), data, spacing, usage, norm);
    }
    exports.wrap = wrap;
});
