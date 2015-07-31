define(["require", "exports"], function(require, exports) {
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

    var VertexBufferImpl = (function () {
        function VertexBufferImpl(buffer, type, spacing, normalized, stride, offset) {
            if (typeof spacing === "undefined") { spacing = 3; }
            if (typeof normalized === "undefined") { normalized = false; }
            if (typeof stride === "undefined") { stride = 0; }
            if (typeof offset === "undefined") { offset = 0; }
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

    var Mesh = (function () {
        function Mesh(material, vtxBuffers, idx, mode, length, offset) {
            if (typeof offset === "undefined") { offset = 0; }
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
            if (typeof size === "undefined") { size = 64 * 1024; }
            this.buffers = {};
            this.size = size;
        }
        MeshBuilderConstructor.prototype.buffer = function (name, arrayType, type, spacing, normalized) {
            if (typeof normalized === "undefined") { normalized = false; }
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
});
