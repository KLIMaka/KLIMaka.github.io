define(["require", "exports", './modules/ui/ui'], function(require, exports, UI) {
    var panel = UI.panel('Header');

    var props = UI.props();
    var x = UI.label('0');
    var y = UI.label('0');
    props.prop('X:', x).prop('Y:', y);
    panel.append(props);

    document.body.onmousemove = function (e) {
        x.text(e.x + '');
        y.text(e.y + '');
    };
    document.body.appendChild(panel.elem());
});
