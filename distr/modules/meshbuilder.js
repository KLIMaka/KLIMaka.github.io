define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DynamicIndexBufferBuilder {
        constructor(maxSize, arrayType, type) {
            this.maxSize = maxSize;
            this.arrayType = arrayType;
            this.type = type;
            this.lastIdx = 0;
            this.buffer = new arrayType(maxSize);
        }
        push(data) {
            if (this.lastIdx >= this.maxSize)
                throw new Error('MaxSize limit exceeded');
            for (var i = 0; i < data.length; i++)
                this.buffer[this.lastIdx + i] = data[i];
            this.lastIdx += data.length;
        }
        tell() {
            return this.lastIdx;
        }
        goto(off) {
            this.lastIdx = off;
        }
        refresh(gl) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, this.buffer);
        }
        build(gl) {
            this.bufIdx = (this.bufIdx == null) ? gl.createBuffer() : this.bufIdx;
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.buffer, gl.STREAM_DRAW);
            return new IndexBufferImpl(this.bufIdx, this.type);
        }
    }
    exports.DynamicIndexBufferBuilder = DynamicIndexBufferBuilder;
    class DynamicVertexBufferBuilder {
        constructor(maxSize, arrayType, type, spacing, normalized) {
            this.maxSize = maxSize;
            this.arrayType = arrayType;
            this.type = type;
            this.spacing = spacing;
            this.normalized = normalized;
            this.lastIdx = 0;
            this.buffer = new arrayType(maxSize * spacing);
        }
        push(data) {
            if (this.lastIdx >= this.maxSize)
                throw new Error('MaxSize limit exceeded');
            var off = this.lastIdx * this.spacing;
            for (var i = 0; i < this.spacing; i++)
                this.buffer[off + i] = data[i];
            this.lastIdx++;
        }
        tell() {
            return this.lastIdx;
        }
        goto(off) {
            this.lastIdx = off;
        }
        refresh(gl) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufIdx);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.buffer);
        }
        build(gl) {
            this.bufIdx = (this.bufIdx == null) ? gl.createBuffer() : this.bufIdx;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufIdx);
            gl.bufferData(gl.ARRAY_BUFFER, this.buffer, gl.STREAM_DRAW);
            return new VertexBufferImpl(this.bufIdx, this.type, this.spacing, this.normalized);
        }
    }
    exports.DynamicVertexBufferBuilder = DynamicVertexBufferBuilder;
    class VertexBufferImpl {
        constructor(buffer, type, spacing = 3, normalized = false, stride = 0, offset = 0) {
            this.buffer = buffer;
            this.type = type;
            this.spacing = spacing;
            this.normalized = normalized;
            this.stride = stride;
            this.offset = offset;
        }
        getBuffer() {
            return this.buffer;
        }
        getType() {
            return this.type;
        }
        getSpacing() {
            return this.spacing;
        }
        getNormalized() {
            return this.normalized;
        }
        getStride() {
            return this.stride;
        }
        getOffset() {
            return this.offset;
        }
    }
    exports.VertexBufferImpl = VertexBufferImpl;
    class Mesh {
        constructor(material, vtxBuffers, idx, mode, length, offset = 0) {
            this.material = material;
            this.vtxBuffers = vtxBuffers;
            this.idx = idx;
            this.mode = mode;
            this.length = length;
            this.offset = offset;
        }
        getMaterial() {
            return this.material;
        }
        getMode() {
            return this.mode;
        }
        getVertexBuffer(attribute) {
            return this.vtxBuffers[attribute];
        }
        getAttributes() {
            return Object.keys(this.vtxBuffers);
        }
        getIndexBuffer() {
            return this.idx;
        }
        getVertexBuffers() {
            return this.vtxBuffers;
        }
        getLength() {
            return this.length;
        }
        getOffset() {
            return this.offset;
        }
    }
    exports.Mesh = Mesh;
    exports.NONE = 0;
    exports.TRIANGLES = 3;
    exports.QUADS = 4;
    class IndexBufferBuilder {
        constructor(arrayType, type) {
            this.arrayType = arrayType;
            this.type = type;
            this.buffer = [];
            this.idx = 0;
            this.mode = exports.NONE;
            this.vtxCounter = 0;
        }
        setMode(mode) {
            if (this.vtxCounter != 0)
                throw new Error('Incomplete primitive!');
            this.mode = mode;
            this.vtxCounter = 0;
        }
        vtx() {
            this.vtxCounter++;
            if (this.mode == exports.TRIANGLES && this.vtxCounter % exports.TRIANGLES == 0) {
                this.pushTriangle();
                this.vtxCounter = 0;
            }
            if (this.mode == exports.QUADS && this.vtxCounter % exports.QUADS == 0) {
                this.pushQuad();
                this.vtxCounter = 0;
            }
        }
        pushTriangle() {
            var idx = this.idx;
            this.buffer.push(idx, idx + 2, idx + 1);
            this.idx += 3;
        }
        pushQuad() {
            var idx = this.idx;
            this.buffer.push(idx, idx + 2, idx + 1, idx, idx + 3, idx + 2);
            this.idx += 4;
        }
        length() {
            return this.buffer.length;
        }
        buf() {
            return this.buffer;
        }
        build(gl) {
            this.bufIdx = (this.bufIdx == null) ? gl.createBuffer() : this.bufIdx;
            var data = new this.arrayType(this.buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
            return new IndexBufferImpl(this.bufIdx, this.type);
        }
    }
    exports.IndexBufferBuilder = IndexBufferBuilder;
    class IndexBufferImpl {
        getBuffer() {
            return this.buffer;
        }
        getType() {
            return this.type;
        }
        constructor(buffer, type) {
            this.buffer = buffer;
            this.type = type;
        }
    }
    class MeshBuilder {
        constructor(buffers, idx) {
            this.buffers = buffers;
            this.idx = idx;
            this.attrs = {};
        }
        offset() {
            return this.idx.length();
        }
        goto(mark) {
            for (var attr in this.buffers) {
                this.buffers[attr].goto(mark[attr]);
            }
        }
        start(mode) {
            this.idx.setMode(mode);
            return this;
        }
        attr(attr, data) {
            this.attrs[attr] = data;
            return this;
        }
        vtx(vtxAttr, data) {
            this.attrs[vtxAttr] = data;
            for (var attr in this.attrs) {
                //noinspection JSUnfilteredForInLoop
                this.buffers[attr].push(this.attrs[attr]);
            }
            this.idx.vtx();
            return this;
        }
        end() {
            this.idx.setMode(exports.NONE);
            this.attrs = {};
        }
        idxbuf() {
            return this.idx;
        }
        build(gl, material) {
            var bufs = {};
            for (var bufName in this.buffers) {
                //noinspection JSUnfilteredForInLoop
                bufs[bufName] = this.buffers[bufName].build(gl);
            }
            var idx = this.idx.build(gl);
            return new Mesh(material, bufs, idx, gl.TRIANGLES, this.idx.length());
        }
    }
    exports.MeshBuilder = MeshBuilder;
    class MeshBuilderConstructor {
        constructor(size = 64 * 1024) {
            this.buffers = {};
            this.size = size;
        }
        buffer(name, arrayType, type, spacing, normalized = false) {
            this.buffers[name] = new DynamicVertexBufferBuilder(this.size, arrayType, type, spacing, normalized);
            return this;
        }
        index(idxArrayType, idxType) {
            this.idx = new IndexBufferBuilder(idxArrayType, idxType);
            return this;
        }
        build() {
            return new MeshBuilder(this.buffers, this.idx);
        }
    }
    exports.MeshBuilderConstructor = MeshBuilderConstructor;
    function genIndexBuffer(gl, count, pattern) {
        var bufIdx = gl.createBuffer();
        var len = pattern.length;
        var size = Math.max.apply(null, pattern) + 1;
        var data = new Uint16Array(count * len);
        for (var i = 0; i < count; i++) {
            var off = i * len;
            var off1 = i * size;
            for (var j = 0; j < len; j++) {
                data[off + j] = off1 + pattern[j];
            }
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.buffer, gl.STATIC_DRAW);
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
    class VertexBufferDynamic extends VertexBufferImpl {
        constructor(gl, type, data, spacing, usage = WebGLRenderingContext.STREAM_DRAW, normalized = false) {
            super(gl.createBuffer(), type, spacing, normalized, 0, 0);
            this.data = data;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.getBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, this.data, usage);
        }
        getData() {
            return this.data;
        }
        update(gl) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.getBuffer());
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data);
        }
        updateRegion(gl, offset, length) {
            var sizeof = this.data.BYTES_PER_ELEMENT * this.getSpacing();
            var region = new Uint8Array(this.data.buffer, offset * sizeof, length * sizeof);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.getBuffer());
            gl.bufferSubData(gl.ARRAY_BUFFER, offset * sizeof, region);
        }
    }
    exports.VertexBufferDynamic = VertexBufferDynamic;
    function createVertexBuffer(gl, type, data, spacing, usage = WebGLRenderingContext.STREAM_DRAW, norm = false) {
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
    function wrap(gl, data, spacing, usage = WebGLRenderingContext.STREAM_DRAW, norm = false) {
        return new VertexBufferDynamic(gl, ArrayType2GlType(data.constructor), data, spacing, usage, norm);
    }
    exports.wrap = wrap;
    class DynamicIndexBuffer extends IndexBufferImpl {
        constructor(gl, data, type = WebGLRenderingContext.UNSIGNED_SHORT, usage = WebGLRenderingContext.STREAM_DRAW) {
            super(gl.createBuffer(), type);
            this.data = data;
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.getBuffer());
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.data, usage);
        }
        update(gl, length = 0) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.getBuffer());
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, this.data);
        }
        updateRegion(gl, offset, length) {
            var sizeof = 2;
            var region = new Uint8Array(this.data.buffer, offset * sizeof, length * sizeof);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.getBuffer());
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, offset * sizeof, region);
        }
        getData() {
            return this.data;
        }
    }
    exports.DynamicIndexBuffer = DynamicIndexBuffer;
    function createIndexBuffer(gl, type, data, usage = WebGLRenderingContext.STREAM_DRAW) {
        var arrtype = GlType2ArrayType(type);
        if (typeof data == 'number') {
            data = new arrtype(data);
        }
        else {
            if (arrtype != data.constructor)
                throw new Error('GL Type and ArrayBuffer is incompatible');
        }
        return new DynamicIndexBuffer(gl, data, type, usage);
    }
    exports.createIndexBuffer = createIndexBuffer;
    function wrapIndexBuffer(gl, data, usage = WebGLRenderingContext.STREAM_DRAW) {
        return new DynamicIndexBuffer(gl, data, ArrayType2GlType(data.constructor), usage);
    }
    exports.wrapIndexBuffer = wrapIndexBuffer;
});
