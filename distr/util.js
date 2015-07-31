var fs = require('fs');
var RFF = require('modules/engines/build/rff');

function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}

var file = RFF.create(toArrayBuffer(fs.readFileSync('./resources/engines/blood/blood.rff')));

console.log(file);
