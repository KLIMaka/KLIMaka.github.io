export class Element {
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
    click(e) {
        this.element.onclick = e;
        return this;
    }
}
function create(tag) {
    return document.createElement(tag);
}
export class Table extends Element {
    constructor() {
        super(create('table'));
    }
    row(cols) {
        let tr = new Element(create('tr'));
        for (let i = 0; i < cols.length; i++) {
            let c = cols[i];
            let td = new Element(create('td')).append(c);
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
export class Properties extends Table {
    constructor() {
        super();
        this.labels = {};
        this.className('props');
    }
    prop(name, el) {
        this.row([div('property_name').text(name), el]);
        return this;
    }
    refresh(props) {
        let fields = Object.keys(props);
        for (let i = 0; i < fields.length; i++) {
            let field = fields[i];
            let l = this.labels[field];
            if (l == undefined) {
                l = label('');
                this.labels[field] = l;
                this.prop(field, l);
            }
            l.text(props[field] + '');
        }
        return this;
    }
}
export function tag(tag) {
    return new Element(create(tag));
}
export function div(className) {
    return new Element(create('div')).className(className);
}
export function table() {
    return new Table();
}
export function props() {
    return new Properties();
}
export function label(text) {
    return div('label').text(text);
}
export function button(caption) {
    return div('contour').append(div('button').text(caption));
}
export function panel(title) {
    return div('frame')
        .append(div('header').text(title))
        .append(div('hline'))
        .append(div('content'));
}
export class Progress extends Element {
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
export function progress(title, max = 100) {
    return new Progress(title, max);
}
export class VerticalPanel extends Element {
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
export function verticalPanel(className) {
    return new VerticalPanel(className);
}
export function dragElement(header, elment) {
    let startx = 0;
    let starty = 0;
    let onmouseup = null;
    let onmousemove = null;
    header.onmousedown = dragMouseDown;
    function dragMouseDown(e) {
        e.preventDefault();
        startx = e.clientX;
        starty = e.clientY;
        onmouseup = document.onmouseup;
        onmousemove = document.onmousemove;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
        e.preventDefault();
        let x = startx - e.clientX;
        let y = starty - e.clientY;
        startx = e.clientX;
        starty = e.clientY;
        elment.style.top = (elment.offsetTop - y) + "px";
        elment.style.left = (elment.offsetLeft - x) + "px";
    }
    function closeDragElement() {
        document.onmouseup = onmouseup;
        document.onmousemove = onmousemove;
    }
}
//# sourceMappingURL=ui.js.map