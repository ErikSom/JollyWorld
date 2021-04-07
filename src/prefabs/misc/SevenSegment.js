import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import { stopCustomBehaviour } from './CustomEditorBehavior';

class SevenSegment extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);

        this.base = this.lookupObject.base;
        this.base.isSevenSegment = true;
    }
    init() {
        super.init();
    }
    update() {
        super.update();
    }
}


export const drawObjectAdding = (prefab, type) => {

    const bodyObject = prefab.class.base;
    const sprite = bodyObject.mySprite ? bodyObject.mySprite : bodyObject;

    const editor = game.editor;

    let tarSprite = editor.getPIXIPointFromWorldPoint(editor.mousePosWorld);
    editor.debugGraphics.lineStyle(1, editor.jointLineColor, 1);

    const worldQuery = editor.queryWorldForBodies(editor.mousePosWorld, editor.mousePosWorld);
    prefab.class.linkObjectTarget = null;
    worldQuery.forEach(body => {
        if(body.mySprite && body[type]){
            tarSprite = body.mySprite;
            prefab.class.linkObjectTarget = body;
            editor.debugGraphics.lineStyle(1, "0xFFFF00", 1);
        }
    });

    editor.debugGraphics.moveTo(sprite.x * editor.cameraHolder.scale.x + editor.cameraHolder.x, sprite.y * editor.cameraHolder.scale.y + editor.cameraHolder.y);
    editor.debugGraphics.lineTo(tarSprite.x * editor.cameraHolder.scale.x + editor.cameraHolder.x, tarSprite.y * editor.cameraHolder.scale.y + editor.cameraHolder.y);

}
const linkSegment = prefab => {

    // add prefab.class.linkObjectTarget

    delete prefab.class.linkObjectTarget;
    stopCustomBehaviour();
}

const selectLinkTarget = prefab=>{
    game.editor.customPrefabMouseDown = ()=>{
        linkSegment(prefab);
    }
    game.editor.customDebugDraw = ()=>{
        drawObjectAdding(prefab, 'isSevenSegment');
    }
    game.editor.customPrefabMouseMove = null;
}

SevenSegment.settings = Object.assign({}, SevenSegment.settings, {
    "linkSevenSegment": prefab=>selectLinkTarget(prefab),
});
SevenSegment.settingsOptions = Object.assign({}, SevenSegment.settingsOptions, {
	"linkSevenSegment": '$function',
});

PrefabManager.prefabLibrary.SevenSegment = {
    json: '{"objects":[[0,0.0032,0.0061,0,"sevensegment","base",0,["#1c1c1c"],["#000"],[1,1],true,true,[[{"x":-0.7833,"y":1.221},{"x":-0.7833,"y":-1.221},{"x":0.7833,"y":-1.221},{"x":0.7833,"y":1.221}]],[1],[2],[0],"",[0],true,false,false,[0.5],[0.2],false,true],[7,-0.0946,-0.1829,0,"sevensegment","digits",1,[[6,14.2314,-14.0425,-1.5708,"sevensegment","s2",70,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true],[6,0.1314,-28.6425,-3.1416,"sevensegment","s1",71,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true],[6,14.2274,14.256,-1.5708,"sevensegment","s3",72,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true],[6,0.0274,28.2576,-3.1416,"sevensegment","s4",73,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true],[6,-14.3726,14.256,-4.7124,"sevensegment","s5",74,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true],[6,-0.2726,0.1576,-6.2832,"sevensegment","s7",75,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true],[6,-13.9726,-14.2424,-7.854,"sevensegment","s6",76,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true]],0,0.4118,2.0479,0,1,0,0,0,true,false,[]]]}',
    class: SevenSegment,
    library: PrefabManager.LIBRARY_MISC
}
