import { B2dEditor } from "../B2dEditor";
import * as Box2D from "../../../libs/Box2D_NEW";

var b2Vec2 = Box2D.b2Vec2;

const lineOptionBase = {
    color:0xFFFFFF,
    size:1.0,
    alpha:1.0,
    type: undefined,
    label: undefined,
    labelPosition: undefined
}

export const drawLine = function(sp, ep, _lineOptions){

    const lineOptions = Object.assign({}, lineOptionsDefault, _lineOptions);

    B2dEditor.debugGraphics.lineStyle(lineOptions.size, lineOptions.color, lineOptions.alpha);
    B2dEditor.debugGraphics.moveTo(sp.x * B2dEditor.container.scale.x + B2dEditor.container.x, sp.y * B2dEditor.container.scale.y + B2dEditor.container.y);
    B2dEditor.debugGraphics.lineTo(ep.x * B2dEditor.container.scale.x + B2dEditor.container.x, ep.y * B2dEditor.container.scale.y + B2dEditor.container.y);

    if(lineOptions.label){
        const v = new b2Vec2(ep.x-sp.x, ep.y-sp.y);
        const l = v.Length();
        const vn  = v.Normalize();
        const tl = l*lineOptions.labelPosition;
        vn.SelfMul(tl);
        drawCircle(vn, 10, lineOptions, {color:"0xFF0000"});
    }
}
export const drawCircle = function(point, radius, _lineOptions, _fillOptions){

    const lineOptions = Object.assign({}, lineOptionsDefault, _lineOptions);

    B2dEditor.debugGraphics.lineStyle(options.size, options.color, options.alpha);
    B2dEditor.debugGraphics.beginFill("0xC554FA", 0.3);
    B2dEditor.debugGraphics.arc(point.x * B2dEditor.container.scale.x + B2dEditor.container.x, point.y * B2dEditor.container.scale.y + B2dEditor.container.y, radius, 0, 2 * Math.PI, false);
    B2dEditor.debugGraphics.endFill();
}