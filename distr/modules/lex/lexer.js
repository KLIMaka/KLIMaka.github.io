define(["require", "exports"], function(require, exports) {
    var id = function (s) {
        return s;
    };

    var LexerRule = (function () {
        function LexerRule(pattern, name, mid, conv) {
            if (typeof mid === "undefined") { mid = 0; }
            if (typeof conv === "undefined") { conv = id; }
            this.pattern = pattern;
            this.name = name;
            this.mid = mid;
            this.conv = conv;
            this.id = null;
        }
        return LexerRule;
    })();
    exports.LexerRule = LexerRule;

    var Lexer = (function () {
        function Lexer() {
            this.rulesByName = {};
            this.rulesByPatt = {};
            this.rules = [];
            this.offset = 0;
            this.lastOffset = 0;
            this.eoi = false;
            this.matchedRule = null;
            this.matchedValue = null;
        }
        Lexer.prototype.addRule = function (rule) {
            var r = this.rulesByName[rule.name];
            if (r == undefined) {
                rule.id = this.rules.length;
                this.rules.push(rule);
            } else {
                throw new Error('Rule ' + rule.name + ' already exist');
            }

            this.rulesByName[rule.name] = rule;

            //this.rulesByPatt[rule.pattern] = rule;
            return this;
        };

        Lexer.prototype.mark = function () {
            return this.lastOffset;
        };

        Lexer.prototype.reset = function (offset) {
            if (typeof offset === "undefined") { offset = 0; }
            this.offset = offset;
            this.lastOffset = offset;
            this.eoi = false;
            return this.next();
        };

        Lexer.prototype.setSource = function (src) {
            this.src = src;
            this.offset = 0;
            this.eoi = false;
        };

        Lexer.prototype.exec = function () {
            if (this.eoi)
                return null;

            var len = 0;
            var matchedValue = null;
            var matchedRule = null;
            var subsrc = this.src.substr(this.offset);
            for (var i = 0; i < this.rules.length; i++) {
                var rule = this.rules[i];
                var match = rule.pattern.exec(subsrc);
                if (match != null && match[0].length >= len) {
                    matchedValue = match;
                    matchedRule = rule;
                    len = match[0].length;
                }
            }

            this.matchedRule = matchedRule;
            this.matchedValue = matchedValue;
            this.lastOffset = this.offset;
            this.offset += len;

            if (this.offset >= this.src.length)
                this.eoi = true;

            if (matchedRule == null)
                throw new Error('Unexpected input "' + subsrc.substr(0, 10) + '..."');

            return matchedRule.name;
        };

        Lexer.prototype.next = function () {
            return this.exec();
        };

        Lexer.prototype.rule = function () {
            return this.matchedRule;
        };

        Lexer.prototype.value = function () {
            return this.rule().conv(this.matchedValue[this.rule().mid]);
        };
        return Lexer;
    })();
    exports.Lexer = Lexer;
});
