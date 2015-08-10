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

        Element.prototype.attr = function (name, val) {
            this.element.setAttribute(name, val);
            return this;
        };

        Element.prototype.css = function (name, val) {
            this.element.style[name] = val;
            return this;
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

        Table.prototype.removeRow = function (row) {
            this.elem().deleteRow(row);
            return this;
        };
        return Table;
    })(Element);
    exports.Table = Table;

    var Properties = (function (_super) {
        __extends(Properties, _super);
        function Properties(keys) {
            _super.call(this);
            this.className('props');
            this.labels = {};
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var l = exports.label('');
                this.labels[k] = l;
                this.prop(k, l);
            }
        }
        Properties.prototype.prop = function (name, el) {
            this.row([div('property_name').text(name), el]);
            return this;
        };

        Properties.prototype.refresh = function (props) {
            var fields = Object.keys(this.labels);
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                this.labels[field].text(props[field] + '');
            }
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

    var Progress = (function (_super) {
        __extends(Progress, _super);
        function Progress(title, max) {
            if (typeof max === "undefined") { max = 100; }
            _super.call(this, create('div'));
            this.title = div('title').text(title);
            this.progress = new Element(create('progress')).attr('max', max);
            this.append(this.title).append(this.progress);
        }
        Progress.prototype.max = function (max) {
            this.progress.attr('max', max);
            return this;
        };

        Progress.prototype.setValue = function (val) {
            this.progress.attr('value', val);
            return this;
        };
        return Progress;
    })(Element);
    exports.Progress = Progress;

    function progress(title, max) {
        if (typeof max === "undefined") { max = 100; }
        return new Progress(title, max);
    }
    exports.progress = progress;

    var VerticalPanel = (function (_super) {
        __extends(VerticalPanel, _super);
        function VerticalPanel(className) {
            _super.call(this, create('div'));
            this.rows = 0;
            this.className(className);
        }
        VerticalPanel.prototype.add = function (elem) {
            this.append(elem);
            return this.rows++;
        };
        return VerticalPanel;
    })(Element);
    exports.VerticalPanel = VerticalPanel;

    function verticalPanel(className) {
        return new VerticalPanel(className);
    }
    exports.verticalPanel = verticalPanel;
});
