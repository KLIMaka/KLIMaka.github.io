define(["require", "exports", "../../../shaders", "../../../../libs_js/glmatrix", "../../../../modules/batcher", "./buffers", "./renderable"], function (require, exports, SHADER, GLM, BATCH, BUFF, renderable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class StateValue {
        constructor(value) {
            this.value = value;
            this.changed = false;
        }
        get() { return this.value; }
        set(v) { if (this.value != v) {
            this.value = v;
            this.changed = true;
        } }
        isChanged() { return this.changed; }
        setChanged(c) { this.changed = c; }
    }
    class State {
        constructor(gl) {
            this.textureMatrix = new StateValue(GLM.mat4.create());
            this.viewMatrix = new StateValue(GLM.mat4.create());
            this.projectionMatrix = new StateValue(GLM.mat4.create());
            this.eyePos = new StateValue(GLM.vec3.create());
            this.shade = new StateValue(0);
            this.color = new StateValue(GLM.vec4.fromValues(1, 1, 1, 1));
            this.plu = new StateValue(0);
            this.shader = new StateValue(null);
            this.texture = new StateValue(null);
            this.palTexture = new StateValue(null);
            this.pluTexture = new StateValue(null);
            this.vertexBuffers = {};
            this.indexBuffer = new StateValue(null);
            this.drawElements = new StateValue(null);
        }
        setShader(s) {
            var prev = this.shader.get();
            this.shader.set(s);
            return prev;
        }
        getTextureMatrix() {
            this.textureMatrix.setChanged(true);
            return this.textureMatrix.get();
        }
        getViewMatrix() {
            this.viewMatrix.setChanged(true);
            return this.viewMatrix.get();
        }
        getProjectionMatrix() {
            this.projectionMatrix.setChanged(true);
            return this.projectionMatrix.get();
        }
        setTexture(tex) {
            this.texture.set(tex);
        }
        setPalTexture(tex) {
            this.palTexture.set(tex);
        }
        setPluTexture(tex) {
            this.pluTexture.set(tex);
        }
        setIndexBuffer(b) {
            this.indexBuffer.set(b);
        }
        setVertexBuffer(name, b) {
            var state = this.vertexBuffers[name];
            if (state == undefined) {
                state = new StateValue(null);
                this.vertexBuffers[name] = state;
            }
            state.set(b);
        }
        setDrawElements(place) {
            this.drawElements.set(place);
        }
        setShade(s) {
            this.shade.set(s);
        }
        setColor(c) {
            var cc = this.color.get();
            if (cc == c || c[0] == cc[0] && c[1] == cc[1] && c[2] == cc[2] && c[3] == cc[3])
                return;
            this.color.set(c);
        }
        setPal(p) {
            this.plu.set(p);
        }
        setEyePos(pos) {
            this.eyePos.set(pos);
        }
        rebindShader(gl) {
            if (this.shader.isChanged()) {
                var shader = this.shader.get();
                gl.useProgram(shader.getProgram());
                gl.uniform1i(shader.getUniformLocation('base', gl), 0);
                gl.uniform1i(shader.getUniformLocation('pal', gl), 1);
                gl.uniform1i(shader.getUniformLocation('plu', gl), 2);
                this.shader.setChanged(false);
                return true;
            }
            return false;
        }
        rebindVertexBuffers(gl, rebindAll) {
            var shader = this.shader.get();
            var attributes = shader.getAttributes();
            for (var a = 0; a < attributes.length; a++) {
                var attr = attributes[a];
                var buf = this.vertexBuffers[attr];
                if (buf == undefined)
                    throw new Error('No buffer for shader attribute <' + attr + '>');
                if (!rebindAll && !buf.isChanged())
                    continue;
                var vbuf = buf.get();
                var location = shader.getAttributeLocation(attr, gl);
                if (location == -1)
                    continue;
                gl.bindBuffer(gl.ARRAY_BUFFER, vbuf.getBuffer());
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, vbuf.getSpacing(), vbuf.getType(), vbuf.getNormalized(), vbuf.getStride(), vbuf.getOffset());
                buf.setChanged(false);
            }
        }
        rebindIndexBuffer(gl, rebindAll) {
            if (rebindAll || this.indexBuffer.isChanged()) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer.get().getBuffer());
                this.indexBuffer.setChanged(false);
            }
        }
        rebindTexture(gl, rebindAll) {
            if (this.texture.get() != null && (rebindAll || this.texture.isChanged())) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, this.texture.get().get());
                this.texture.setChanged(false);
            }
            if (this.palTexture.get() != null && (rebindAll || this.palTexture.isChanged())) {
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, this.palTexture.get().get());
                this.palTexture.setChanged(false);
            }
            if (this.pluTexture.get() != null && (rebindAll || this.pluTexture.isChanged())) {
                gl.activeTexture(gl.TEXTURE2);
                gl.bindTexture(gl.TEXTURE_2D, this.pluTexture.get().get());
                this.pluTexture.setChanged(false);
            }
        }
        updateBuffers(gl, rebindAll) {
            BUFF.update(gl);
        }
        setUniform(gl, setter, name, value, rebindAll) {
            if (rebindAll || value.isChanged()) {
                var l = this.shader.get().getUniformLocation(name, gl);
                setter(gl, l, value.get());
                value.setChanged(false);
            }
        }
        updateUniforms(gl, rebindAll) {
            this.setUniform(gl, BATCH.setters.mat4, "T", this.textureMatrix, rebindAll);
            this.setUniform(gl, BATCH.setters.mat4, "V", this.viewMatrix, rebindAll);
            this.setUniform(gl, BATCH.setters.mat4, "P", this.projectionMatrix, rebindAll);
            this.setUniform(gl, BATCH.setters.vec3, "eyepos", this.eyePos, rebindAll);
            this.setUniform(gl, BATCH.setters.int1, "shade", this.shade, rebindAll);
            this.setUniform(gl, BATCH.setters.int1, "pluN", this.plu, rebindAll);
            this.setUniform(gl, BATCH.setters.vec4, "color", this.color, rebindAll);
        }
        draw(gl, mode = gl.TRIANGLES) {
            var rebindAll = this.rebindShader(gl);
            this.rebindVertexBuffers(gl, rebindAll);
            this.rebindIndexBuffer(gl, rebindAll);
            this.updateBuffers(gl, rebindAll);
            this.updateUniforms(gl, rebindAll);
            this.rebindTexture(gl, rebindAll);
            var count = mode == gl.TRIANGLES ? this.drawElements.get().triIdx.size : this.drawElements.get().lineIdx.size;
            var off = mode == gl.TRIANGLES ? this.drawElements.get().triIdx.offset : this.drawElements.get().lineIdx.offset;
            gl.drawElements(mode, count, gl.UNSIGNED_SHORT, off * 2);
        }
    }
    var state;
    function init(gl, pal, plu) {
        createShaders(gl);
        BUFF.init(gl, 1024 * 1024, 1024 * 1024);
        state = new State(gl);
        state.setIndexBuffer(BUFF.getIdxBuffer());
        state.setVertexBuffer('aPos', BUFF.getPosBuffer());
        state.setVertexBuffer('aNorm', BUFF.getNormBuffer());
        state.setPalTexture(pal);
        state.setPluTexture(plu);
    }
    exports.init = init;
    var baseShader;
    var spriteShader;
    var baseFlatShader;
    var spriteFlatShader;
    const SHADER_NAME = 'resources/shaders/build_base1';
    function createShaders(gl) {
        baseShader = SHADER.createShader(gl, SHADER_NAME);
        spriteShader = SHADER.createShader(gl, SHADER_NAME, ['SPRITE']);
        baseFlatShader = SHADER.createShader(gl, SHADER_NAME, ['FLAT']);
        spriteFlatShader = SHADER.createShader(gl, SHADER_NAME, ['SPRITE', 'FLAT']);
    }
    function setController(c) {
        GLM.mat4.copy(state.getProjectionMatrix(), c.getProjectionMatrix());
        GLM.mat4.copy(state.getViewMatrix(), c.getModelViewMatrix());
        state.setEyePos(c.getCamera().getPos());
    }
    exports.setController = setController;
    function draw(gl, renderable) {
        if (renderable.buff.get() == null)
            return;
        state.setShader(renderable.type == renderable_1.Type.SURFACE ? baseShader : spriteShader);
        state.setTexture(renderable.tex);
        state.setDrawElements(renderable.buff.get());
        state.setColor([1, 1, 1, renderable.trans]);
        state.setPal(renderable.pal);
        state.setShade(renderable.shade);
        GLM.mat4.copy(state.getTextureMatrix(), renderable.texMat);
        state.draw(gl);
    }
    exports.draw = draw;
});
