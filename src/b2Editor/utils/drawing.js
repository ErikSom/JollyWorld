import { B2dEditor } from "../B2dEditor";
import * as Box2D from "../../../libs/Box2D";
import { Settings } from "../../Settings";

var b2Vec2 = Box2D.b2Vec2;

const lineOptionsBase = {
    color:0xFFFFFF,
    size:1.0,
    alpha:1.0,
    type: undefined,
    label: undefined,
    labelPosition: 0.5,
    labelColor: "0xFFF",
}
const fillOptionsBase = {
    color:"0xFFFFFF",
    alpha:1.0,
}
const textOptionsBase = {
    fontFamily : 'Helvetica',
    fontSize: 14,
    fill : 0xFFFFFF,
    align : 'center'
}


export const drawDebugTriggerHelpers = function(){
	for(var i = 0; i<B2dEditor.selectedPhysicsBodies.length; i++){
        var body = B2dEditor.selectedPhysicsBodies[i];
        if(body.mySprite && body.mySprite.data && body.mySprite.data.type == B2dEditor.object_TRIGGER){
            if(body.mySprite.targets){
                var myPos = body.GetPosition();
                myPos = B2dEditor.getPIXIPointFromWorldPoint(myPos);
                for(var i = 0; i<body.mySprite.targets.length; i++){
                    var target = body.mySprite.targets[i];
                    var tarPos;
                    if(target.mySprite) tarPos = B2dEditor.getPIXIPointFromWorldPoint(target.GetPosition());
                    else tarPos = new b2Vec2(target.x, target.y);
                    drawLine(myPos, tarPos, {color: "0x000", label:i, labelPosition:0.5, labelColor:"0x999"});
                };
            }
        }
    }
}

// ESSENTIALS
export const drawLine = function(sp, ep, _lineOptions){

    const lineOptions = Object.assign({}, lineOptionsBase, _lineOptions);

    B2dEditor.debugGraphics.lineStyle(lineOptions.size, lineOptions.color, lineOptions.alpha);
    B2dEditor.debugGraphics.moveTo(sp.x * B2dEditor.container.scale.x + B2dEditor.container.x, sp.y * B2dEditor.container.scale.y + B2dEditor.container.y);
    B2dEditor.debugGraphics.lineTo(ep.x * B2dEditor.container.scale.x + B2dEditor.container.x, ep.y * B2dEditor.container.scale.y + B2dEditor.container.y);

    if(lineOptions.label != undefined){
        const v = new b2Vec2(ep.x-sp.x, ep.y-sp.y);
        const l = v.Length();
        v.SelfNormalize();
        const tl = l*lineOptions.labelPosition;
        v.SelfMul(tl);
        const tp = sp.Clone().SelfAdd(v);
        drawCircle(tp, 10, lineOptions, {color:lineOptions.labelColor});
        tp.SelfMul(B2dEditor.container.scale.x);
        tp.SelfAdd(B2dEditor.container.position);
        addText(lineOptions.label, B2dEditor.debugGraphics, tp)
    }
}
export const drawCircle = function(point, radius, _lineOptions, _fillOptions){

    const lineOptions = Object.assign({}, lineOptionsBase, _lineOptions);
    const fillOptions = Object.assign({}, fillOptionsBase, _fillOptions);
    B2dEditor.debugGraphics.moveTo(radius+point.x * B2dEditor.container.scale.x + B2dEditor.container.x, point.y * B2dEditor.container.scale.y + B2dEditor.container.y);

    B2dEditor.debugGraphics.lineStyle(lineOptions.size,  lineOptions.color, lineOptions.alpha);
    B2dEditor.debugGraphics.beginFill(fillOptions.color, fillOptions.alpha);
    B2dEditor.debugGraphics.arc(point.x * B2dEditor.container.scale.x + B2dEditor.container.x, point.y * B2dEditor.container.scale.y + B2dEditor.container.y, radius, 0, 2 * Math.PI, false);
    B2dEditor.debugGraphics.endFill();
}

export const addText = function(string, target, position, _textOptions){
    const textOptions = Object.assign({}, textOptionsBase, _textOptions);
    let text = new PIXI.Text(string, textOptions);
    if(textOptions.align == "center") text.pivot.set(text.width/2, text.height/2);
    text.x = position.x;
    text.y = position.y;
    target.addChild(text);
}