define(["require", "exports"], function(require, exports) {
    function shader(gl, shader, data) {
        var shader = data;
        gl.useProgram(shader.getProgram());
        return shader;
    }
    exports.shader = shader;

    function vertexBuffers(gl, shader, data) {
        if (shader == null)
            throw new Error('Attempt to set buffers wo shader');
        var attributes = shader.getAttributes();
        for (var a = 0; a < attributes.length; a++) {
            var attr = attributes[a];
            var buf = data[attr];
            if (buf == undefined)
                throw new Error('No buffer for shader attribute <' + attr + '>');
            var location = shader.getAttributeLocation(attr, gl);
            if (location == -1)
                continue;
            gl.bindBuffer(gl.ARRAY_BUFFER, buf.getBuffer());
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, buf.getSpacing(), buf.getType(), buf.getNormalized(), buf.getStride(), buf.getOffset());
        }
        return shader;
    }
    exports.vertexBuffers = vertexBuffers;

    function indexBuffer(gl, shader, data) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, data.getBuffer());
        return shader;
    }
    exports.indexBuffer = indexBuffer;

    function drawCall(gl, shader, data) {
        gl.drawElements(data[0], data[1], gl.UNSIGNED_SHORT, data[2]);
        return shader;
    }
    exports.drawCall = drawCall;

    exports.setters = {
        mat4: function (gl, loc, val) {
            return gl.uniformMatrix4fv(loc, false, val);
        },
        vec3: function (gl, loc, val) {
            return gl.uniform3fv(loc, val);
        },
        vec4: function (gl, loc, val) {
            return gl.uniform4fv(loc, val);
        },
        int1: function (gl, loc, val) {
            return gl.uniform1i(loc, val);
        },
        flt1: function (gl, loc, val) {
            return gl.uniform1f(loc, val);
        }
    };

    function uniforms(gl, shader, data) {
        for (var i = 0; i < data.length; i += 3) {
            var name = data[i];
            var setter = data[i + 1];
            var val = data[i + 2];
            var loc = shader.getUniformLocation(name, gl);
            if (!loc)
                continue;
            setter(gl, loc, val);
        }
        return shader;
    }
    exports.uniforms = uniforms;

    function exec(cmds, gl) {
        var shader = null;
        for (var i = 0; i < cmds.length; i += 2) {
            var f = cmds[i];
            var args = cmds[i + 1];
            shader = f(gl, shader, args);
        }
    }
    exports.exec = exec;
});
