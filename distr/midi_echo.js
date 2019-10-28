import { table, label, div } from "./modules/ui/ui.js";
function onMIDISuccess(midiAccess) {
    createChannelsTable(midiAccess);
    let outs = midiAccess.outputs;
    let inputs = midiAccess.inputs;
    for (let inp of inputs.keys()) {
        let i = inputs.get(inp);
        i.onmidimessage = (e) => {
            activeChannel(inp, e.data);
            for (let out of outs.keys()) {
                if (inputs.get(inp).name == outs.get(out).name)
                    continue;
                let o = outs.get(out);
                activeChannel(out, e.data);
                o.send(e.data, e.timeStamp);
            }
        };
    }
}
function onMIDIFailure(reason) {
}
let indicatorsMap = {};
function activeChannel(device, data) {
    let channel = data[0] & 0xf;
    let ind = indicatorsMap[`${device}_${channel}`];
    ind.css('background', 'green');
    setTimeout(() => { ind.css('background', 'gray'); }, 100);
}
function createHeaderChannelRow() {
    let columns = [];
    columns.push(label('Name'));
    for (let i = 0; i < 16; i++) {
        let header = label('' + (i + 1));
        columns.push(header);
    }
    return columns;
}
function createChannelRow(name, id) {
    let columns = [];
    columns.push(label(name));
    for (let i = 0; i < 16; i++) {
        let indicator = div('indicator');
        let indicatorId = `${id}_${i}`;
        indicatorsMap[indicatorId] = indicator;
        indicator.attr('id', id);
        indicator.size('10px', '10px');
        indicator.css('background', 'gray');
        columns.push(indicator);
    }
    return columns;
}
function createChannelsTable(midiAccess) {
    let outs = midiAccess.outputs;
    let inputs = midiAccess.inputs;
    let inputTable = table();
    inputTable.row(createHeaderChannelRow());
    for (let inp of inputs.keys()) {
        let input = inputs.get(inp);
        inputTable.row(createChannelRow(input.name, inp));
    }
    document.body.appendChild(inputTable.elem());
    let outputTable = table();
    outputTable.row(createHeaderChannelRow());
    for (let outp of outs.keys()) {
        let output = outs.get(outp);
        outputTable.row(createChannelRow(output.name, outp));
    }
    document.body.appendChild(outputTable.elem());
}
navigator['requestMIDIAccess']().then(onMIDISuccess, onMIDIFailure);
//# sourceMappingURL=midi_echo.js.map