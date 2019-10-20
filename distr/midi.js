var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var EventTable = (function () {
    function EventTable(steps) {
        this.steps = steps;
        this.table = null;
        this.step = 0;
        this.table = new Array(this.steps);
        for (var i = 0; i < this.steps; i++) {
            this.table[i] = new Array();
        }
    }
    EventTable.prototype.reset = function () {
        this.step = 0;
    };
    EventTable.prototype.next = function () {
        this.step = (this.step + 1) % this.steps;
    };
    EventTable.prototype.run = function (clock) {
        var handlers = this.table[this.step];
        for (var i = 0; i < handlers.length; i++) {
            var h = handlers[i];
            h(clock);
        }
    };
    EventTable.prototype.addHandler = function (step, handler) {
        this.table[step].push(handler);
        return this.table[step].length;
    };
    EventTable.prototype.clear = function () {
        for (var i = 0; i < this.steps; i++) {
            this.table[i] = new Array();
        }
    };
    return EventTable;
}());
var Clock = (function () {
    function Clock() {
        this.bpm = 75;
        this.scheduledBeat = -1;
        this.beatPage = 0;
        this.subBeat = 0;
        this.eventTable = new EventTable(32);
        this.beatEventTable = [new EventTable(32), new EventTable(32)];
    }
    Clock.prototype.start = function () {
        if (this.scheduledBeat != -1)
            return;
        this.scheduledBeat = Date.now();
        this.beat();
    };
    Clock.prototype.scheduleNextBeat = function () {
        var _this = this;
        var t = Date.now();
        var skipt = t - this.scheduledBeat;
        var timeout = (60 * 1000) / (this.bpm * 32) - skipt;
        this.nextBeatHandler = setTimeout(function () { return _this.beat(); }, timeout);
        this.scheduledBeat = t + timeout;
    };
    Clock.prototype.beat = function () {
        if (this.scheduledBeat == -1)
            return;
        this.eventTable.run(this);
        this.getCurrentBeatEventTable().run(this);
        this.eventTable.next();
        this.getCurrentBeatEventTable().next();
        this.subBeat = (this.subBeat + 1) % 32;
        if (this.subBeat == 0) {
            this.swapBeatEventTables();
        }
        this.scheduleNextBeat();
    };
    Clock.prototype.getCurrentBeatEventTable = function () {
        return this.beatEventTable[this.beatPage];
    };
    Clock.prototype.getNextBeatEventTable = function () {
        return this.beatEventTable[(this.beatPage + 1) % 2];
    };
    Clock.prototype.swapBeatEventTables = function () {
        this.getNextBeatEventTable().clear();
        this.beatPage = (this.beatPage + 1) % 2;
    };
    Clock.prototype.stop = function () {
        this.scheduledBeat = -1;
        clearTimeout(this.nextBeatHandler);
    };
    Clock.prototype.addHandler = function (step, handler) {
        return this.eventTable.addHandler(step, handler);
    };
    Clock.prototype.addBeatEvent = function (step, handler) {
        var s = this.subBeat + step + 1;
        if (s >= 32) {
            s -= 32;
            return this.getNextBeatEventTable().addHandler(s, handler);
        }
        else {
            return this.getCurrentBeatEventTable().addHandler(s, handler);
        }
    };
    return Clock;
}());
var Pattern = (function () {
    function Pattern(signature, beats) {
        this.signature = signature;
        this.beats = beats;
        this.slot = 0;
        this.slots = new Array(signature.length * beats);
    }
    Pattern.prototype.register = function (clock) {
        var _this = this;
        for (var i = 0; i < this.signature.length; i++) {
            var off = this.signature[i];
            clock.addHandler(off, function (c) { return _this.play(c); });
        }
    };
    Pattern.prototype.play = function (clock) {
        var action = this.slots[this.slot];
        this.slot = (this.slot + 1) % this.slots.length;
        if (action == null)
            return;
        action(clock);
    };
    Pattern.prototype.set = function (slot, h) {
        this.slots[slot] = h;
    };
    return Pattern;
}());
function note(note, vel, len) {
    return function (c) {
        out.send([0x80, note, 0]);
        out.send([0x90, note, vel]);
        c.addBeatEvent(len, function (c) {
            out.send([0x80, note, 0]);
        });
    };
}
function chord(notes, vel, len) {
    return function (c) {
        for (var i = 0; i < notes.length; i++) {
            out.send([0x80, notes[i], 0]);
            out.send([0x90, notes[i], vel]);
        }
        c.addBeatEvent(len, function (c) {
            for (var i = 0; i < notes.length; i++) {
                out.send([0x80, notes[i], 0]);
            }
        });
    };
}
var midi = null;
var out;
var pattern = null;
var clock = new Clock();
function onMIDISuccess(midiAccess) {
    var e_1, _a;
    document.writeln("MIDI ready!");
    midi = midiAccess;
    document.writeln(midi);
    var outs = midiAccess.outputs;
    var inputs = midiAccess.inputs;
    var _loop_1 = function (inp) {
        var i = inputs.get(inp);
        document.writeln('Connected MIDI Input: ' + i.name);
        i.onmidimessage = function (e) {
            var e_2, _a;
            document.writeln(e.data + '');
            try {
                for (var _b = (e_2 = void 0, __values(outs.keys())), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var out_1 = _c.value;
                    if (inp == out_1)
                        continue;
                    var o = outs.get(out_1);
                    o.send(e.data);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
        };
    };
    try {
        for (var _b = __values(inputs.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var inp = _c.value;
            _loop_1(inp);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
function onMIDIFailure(msg) {
    document.writeln("Failed to get MIDI access - " + msg);
}
navigator['requestMIDIAccess']().then(onMIDISuccess, onMIDIFailure);
//# sourceMappingURL=midi.js.map