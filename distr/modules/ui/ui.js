var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports"], function(require, exports) {
    var Element = (function () {
        function Element(element) {
            this.element = element;
        }
        Element.prototype.className = function (name) {
            this.element.className = name;
            return this;
        };

        Element.prototype.text = function (text) {
            this.element.textContent = text;
            return this;
        };

        Element.prototype.append = function (element) {
            this.element.appendChild(element.element);
            return this;
        };

        Element.prototype.pos = function (x, y) {
            this.element.style.left = x;
            this.element.style.top = y;
            return this;
        };

        Element.prototype.size = function (w, h) {
            this.element.style.width = w;
            this.element.style.height = h;
            return this;
        };

        Element.prototype.width = function (w) {
            this.element.style.width = w;
            return this;
        };

        Element.prototype.height = function (h) {
            this.element.style.height = h;
            return this;
        };

        Element.prototype.elem = function () {
            return this.element;
        };
        return Element;
    })();
    exports.Element = Element;

    function create(tag) {
        return document.createElement(tag);
    }

    var Table = (function (_super) {
        __extends(Table, _super);
        function Table() {
            _super.call(this, create('table'));
        }
        Table.prototype.row = function (cols) {
            var tr = new Element(create('tr'));
            for (var i = 0; i < cols.length; i++) {
                var c = cols[i];
                var td = new Element(create('td')).append(c);
                tr.append(td);
            }
            this.append(tr);
            return this;
        };
        return Table;
    })(Element);
    exports.Table = Table;

    var Properties = (function (_super) {
        __extends(Properties, _super);
        function Properties(props) {
            _super.call(this);
            this.className('props');
            var keys = Object.keys(props);
            var labels = {};
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var l = exports.label(props[k]);
                labels[k] = l;
                this.prop(k, l);
            }
            Object.observe(props, function (changes) {
                for (var i = 0; i < changes.length; i++) {
                    var c = changes[i];
                    labels[c.name].text(props[c.name] + '');
                }
            });
        }
        Properties.prototype.prop = function (name, el) {
            this.row([div('property_name').text(name), el]);
            return this;
        };
        return Properties;
    })(Table);
    exports.Properties = Properties;

    function div(className) {
        return new Element(create('div')).className(className);
    }

    function table() {
        return new Table();
    }
    exports.table = table;

    function props(obj) {
        return new Properties(obj);
    }
    exports.props = props;

    function label(text) {
        return div('label').text(text);
    }
    exports.label = label;

    function button(caption) {
        return div('contour').append(div('button').text(caption));
    }
    exports.button = button;

    function panel(title) {
        return div('frame').append(div('header').text(title)).append(div('hline')).append(div('content'));
    }
    exports.panel = panel;
});
