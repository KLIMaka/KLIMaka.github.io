define(["require", "exports"], function(require, exports) {
    function drag(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    var DropFileReader = (function () {
        function DropFileReader(elem, validator, callback) {
            this.elem = elem;
            this.validator = validator;
            this.callback = callback;
            var self = this;
            elem.addEventListener("dragenter", drag, false);
            elem.addEventListener("dragover", drag, false);
            elem.addEventListener("drop", function (e) {
                self.drop(e);
            }, false);
        }
        DropFileReader.prototype.drop = function (e) {
            e.stopPropagation();
            e.preventDefault();
            var file = e.dataTransfer.files[0];
            var valid = this.validator(file);
            if (!valid)
                return;
            e.target.classList.add('valid');

            var self = this;
            var reader = new FileReader();
            reader.onload = function (e) {
                self.callback(e.target.result);
            };
            reader.readAsArrayBuffer(file);
        };
        return DropFileReader;
    })();
    exports.DropFileReader = DropFileReader;
});
