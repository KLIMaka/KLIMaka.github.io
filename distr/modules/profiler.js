define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function now() {
        return window.performance.now();
    }
    class Section {
        constructor(parent, name, startTime = now(), time = 0, subSections = {}, counts = {}) {
            this.parent = parent;
            this.name = name;
            this.startTime = startTime;
            this.time = time;
            this.subSections = subSections;
            this.counts = counts;
            if (parent != null)
                parent.subSections[name] = this;
        }
        start() {
            if (this.startTime == -1)
                this.startTime = now();
        }
        stop() {
            if (this.startTime != -1) {
                this.time = now() - this.startTime;
                this.startTime = -1;
            }
            return this.time;
        }
        pause() {
            if (this.startTime != -1) {
                this.time += now() - this.startTime;
                this.startTime = -1;
            }
            return this.time;
        }
        currentTime() {
            return this.startTime == -1 ? this.time : now() - this.startTime;
        }
        createSubsection(name) {
            return new Section(this, name);
        }
        inc(name) {
            var count = this.counts[name];
            this.counts[name] = (count == undefined ? 0 : count) + 1;
        }
    }
    exports.Section = Section;
    var mainSection = new Section(null, 'Main');
    var currentSection = mainSection;
    function startProfile(name) {
        currentSection = new Section(currentSection, name);
    }
    exports.startProfile = startProfile;
    function incCount(name) {
        currentSection.inc(name);
    }
    exports.incCount = incCount;
    function endProfile() {
        var time = currentSection.stop();
        if (currentSection != mainSection)
            currentSection = currentSection.parent;
        return time;
    }
    exports.endProfile = endProfile;
    function start() {
        mainSection = new Section(null, 'Main');
        currentSection = mainSection;
    }
    exports.start = start;
    function get() {
        return mainSection;
    }
    exports.get = get;
});
