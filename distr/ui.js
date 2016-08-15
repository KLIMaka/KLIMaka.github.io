define(["require", "exports", './modules/ui/ui'], function(require, exports, UI) {
    var panel = UI.panel('Header');

    var info = {
        'X:': 0,
        'Y:': 0,
        'Dist:': 0
    };

    var props = UI.props(Object.keys(info));
    panel.append(props);

    document.body.onmousemove = function (e) {
        info['X:'] = e.x;
        info['Y:'] = e.y;
        props.refresh(info);
    };
    document.body.appendChild(panel.elem());
});
