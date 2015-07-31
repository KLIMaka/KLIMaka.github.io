define(["require", "exports"], function(require, exports) {
    

    var NoopCapture = (function () {
        function NoopCapture() {
        }
        NoopCapture.prototype.put = function (value) {
        };
        return NoopCapture;
    })();
    exports.NoopCapture = NoopCapture;

    var SetCapture = (function () {
        function SetCapture(name, map) {
            if (typeof map === "undefined") { map = {}; }
            this.name = name;
            this.map = map;
        }
        SetCapture.prototype.put = function (value) {
            this.map[this.name] = value;
        };
        return SetCapture;
    })();
    exports.SetCapture = SetCapture;

    var AddCapture = (function () {
        function AddCapture(name, map) {
            if (typeof map === "undefined") { map = {}; }
            this.name = name;
            this.map = map;
        }
        AddCapture.prototype.put = function (value) {
            var arr = this.map[this.name];
            if (arr == undefined) {
                arr = [value];
                this.map[this.name] = arr;
            } else {
                arr.push(value);
            }
        };
        return AddCapture;
    })();
    exports.AddCapture = AddCapture;

    var Capture = (function () {
        function Capture(value, name) {
            if (typeof value === "undefined") { value = null; }
            if (typeof name === "undefined") { name = null; }
            this.value = value;
            this.name = name;
        }
        Capture.prototype.isValid = function () {
            return this.value != null;
        };
        return Capture;
    })();
    exports.Capture = Capture;

    exports.InvalidCapture = new Capture();

    var Parser = (function () {
        function Parser(lexer, skipper) {
            this.lexer = lexer;
            this.skipper = skipper;
        }
        Parser.prototype.exec = function (rule) {
            this.next();
            return rule.match(this);
        };

        Parser.prototype.next = function () {
            var lex = this.lexer;
            var skipper = this.skipper;
            while (skipper(lex.next()))
                ;
        };

        Parser.prototype.lex = function () {
            return this.lexer;
        };
        return Parser;
    })();
    exports.Parser = Parser;

    var SimpleParserRule = (function () {
        function SimpleParserRule(id) {
            this.id = id;
        }
        SimpleParserRule.prototype.match = function (parser) {
            if (parser.lex().rule().name != this.id)
                return exports.InvalidCapture;
            return new Capture(parser.lex().value());
        };
        return SimpleParserRule;
    })();
    exports.SimpleParserRule = SimpleParserRule;

    var BindingParserRule = (function () {
        function BindingParserRule(name, rule) {
            this.name = name;
            this.rule = rule;
        }
        BindingParserRule.prototype.match = function (parser) {
            var res = this.rule.match(parser);
            if (!res.isValid())
                return res;
            return new Capture(res, this.name);
        };
        return BindingParserRule;
    })();
    exports.BindingParserRule = BindingParserRule;

    var OrParserRule = (function () {
        function OrParserRule(rules) {
            this.rules = rules;
        }
        OrParserRule.prototype.match = function (parser) {
            for (var i = 0; i < this.rules.length; i++) {
                var rule = this.rules[i];
                var res = rule.match(parser);
                if (!res.isValid())
                    continue;
                return new Capture(res);
            }
            return exports.InvalidCapture;
        };
        return OrParserRule;
    })();
    exports.OrParserRule = OrParserRule;

    var AndParserRule = (function () {
        function AndParserRule(rules) {
            this.rules = rules;
        }
        AndParserRule.prototype.match = function (parser) {
            var arr = [];
            var mark = parser.lex().mark();
            for (var i = 0; i < this.rules.length; i++) {
                var rule = this.rules[i];
                var res = rule.match(parser);
                if (!res.isValid()) {
                    parser.lex().reset(mark);
                    return res;
                }
                arr.push(res);
                if (i != this.rules.length - 1)
                    parser.next();
            }
            return new Capture(arr);
        };
        return AndParserRule;
    })();
    exports.AndParserRule = AndParserRule;

    var CountParserRule = (function () {
        function CountParserRule(rule, from, to) {
            if (typeof from === "undefined") { from = 0; }
            if (typeof to === "undefined") { to = 0; }
            this.rule = rule;
            this.from = from;
            this.to = to;
        }
        CountParserRule.prototype.match = function (parser) {
            var arr = [];
            var i = 0;
            var begin = parser.lex().mark();
            var mark = begin;
            var capt = {};
            while (true) {
                if (this.to > 0 && this.to == i) {
                    parser.lex().reset(mark);
                    break;
                }
                var lastMark = parser.lex().mark();
                var res = this.rule.match(parser);
                if (!res.isValid()) {
                    if (i < this.from) {
                        parser.lex().reset(begin);
                        return res;
                    } else {
                        parser.lex().reset(mark);
                        return new Capture(arr);
                    }
                }
                arr.push(res);
                mark = parser.lex().mark();
                parser.next();
                i++;
            }
            return new Capture(arr);
        };
        return CountParserRule;
    })();
    exports.CountParserRule = CountParserRule;
});
