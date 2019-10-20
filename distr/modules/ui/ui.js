define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Element {
        constructor(element) {
            this.element = element;
        }
        className(name) {
            this.element.className = name;
            return this;
        }
        text(text) {
            this.element.textContent = text;
            return this;
        }
        append(element) {
            this.element.appendChild(element.element);
            return this;
        }
        pos(x, y) {
            this.element.style.left = x;
            this.element.style.top = y;
            return this;
        }
        size(w, h) {
            this.element.style.width = w;
            this.element.style.height = h;
            return this;
        }
        width(w) {
            this.element.style.width = w;
            return this;
        }
        height(h) {
            this.element.style.height = h;
            return this;
        }
        elem() {
            return this.element;
        }
        attr(name, val) {
            this.element.setAttribute(name, val);
            return this;
        }
        css(name, val) {
            this.element.style[name] = val;
            return this;
        }
    }
    exports.Element = Element;
    function create(tag) {
        return document.createElement(tag);
    }
    class Table extends Element {
        constructor() {
            super(create('table'));
        }
        row(cols) {
            var tr = new Element(create('tr'));
            for (var i = 0; i < cols.length; i++) {
                var c = cols[i];
                var td = new Element(create('td')).append(c);
                tr.append(td);
            }
            this.append(tr);
            return this;
        }
        removeRow(row) {
            this.elem().deleteRow(row);
            return this;
        }
    }
    exports.Table = Table;
    class Properties extends Table {
        constructor(keys) {
            super();
            this.className('props');
            this.labels = {};
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var l = label('');
                this.labels[k] = l;
                this.prop(k, l);
            }
        }
        prop(name, el) {
            this.row([div('property_name').text(name), el]);
            return this;
        }
        refresh(props) {
            var fields = Object.keys(this.labels);
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                this.labels[field].text(props[field] + '');
            }
            return this;
        }
    }
    exports.Properties = Properties;
    function tag(tag) {
        return new Element(create(tag));
    }
    exports.tag = tag;
    function div(className) {
        return new Element(create('div')).className(className);
    }
    exports.div = div;
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
        return div('frame')
            .append(div('header').text(title))
            .append(div('hline'))
            .append(div('content'));
    }
    exports.panel = panel;
    class Progress extends Element {
        constructor(title, max = 100) {
            super(create('div'));
            this.title = div('title').text(title);
            this.progress = new Element(create('progress')).attr('max', max);
            this.append(this.title).append(this.progress);
        }
        max(max) {
            this.progress.attr('max', max);
            return this;
        }
        setValue(val) {
            this.progress.attr('value', val);
            return this;
        }
    }
    exports.Progress = Progress;
    function progress(title, max = 100) {
        return new Progress(title, max);
    }
    exports.progress = progress;
    class VerticalPanel extends Element {
        constructor(className) {
            super(create('div'));
            this.rows = 0;
            this.className(className);
        }
        add(elem) {
            this.append(elem);
            return this.rows++;
        }
    }
    exports.VerticalPanel = VerticalPanel;
    function verticalPanel(className) {
        return new VerticalPanel(className);
    }
    exports.verticalPanel = verticalPanel;
});
