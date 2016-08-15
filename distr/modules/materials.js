define(["require", "exports"], function (require, exports) {
    var SimpleMaterial = (function () {
        function SimpleMaterial(shader, textures) {
            this.shader = shader;
            this.textures = textures;
        }
        SimpleMaterial.prototype.getShader = function () { return this.shader; };
        SimpleMaterial.prototype.getTexture = function (sampler) { return this.textures[sampler]; };
        return SimpleMaterial;
    })();
    exports.SimpleMaterial = SimpleMaterial;
    function create(shader, textures) {
        return new SimpleMaterial(shader, textures);
    }
    exports.create = create;
});
