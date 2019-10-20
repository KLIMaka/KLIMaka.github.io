define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function drag(e) {
        e.stopPropagation();
        e.preventDefault();
    }
    class DropFileReader {
        constructor(elem, validator, callback) {
            this.elem = elem;
            this.validator = validator;
            this.callback = callback;
            var self = this;
            elem.addEventListener("dragenter", drag, false);
            elem.addEventListener("dragover", drag, false);
            elem.addEventListener("drop", (e) => { self.drop(e); }, false);
        }
        drop(e) {
            e.stopPropagation();
            e.preventDefault();
            var file = e.dataTransfer.files[0];
            var valid = this.validator(file);
            if (!valid)
                return;
            e.target.classList.add('valid');
            var self = this;
            var reader = new FileReader();
            reader.onload = (e) => { self.callback(e.target.result); };
            reader.readAsArrayBuffer(file);
        }
    }
    exports.DropFileReader = DropFileReader;
});
