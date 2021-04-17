import {
    B2dEditor
} from "../../b2Editor/B2dEditor"
import * as Box2D from '../../../libs/Box2D'
import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import { stopCustomBehaviour } from './CustomEditorBehavior';
import * as drawing from '../../b2Editor/utils/drawing';
import { Settings } from "../../Settings";

import { calculateBezierLength } from '../../b2Editor/utils/extramath'

const DEFAULT_PATH = [{"x":95,"y":45.5,"point1":{"x":131.0757,"y":28.2216},"point2":{"x":131.0757,"y":-28.2216}},{"x":95,"y":-45.5,"point1":{"x":58.9243,"y":-62.7784},"point2":{"x":-58.9243,"y":-62.7784}},{"x":-95,"y":-45.5,"point1":{"x":-131.0757,"y":-28.2216},"point2":{"x":-131.0757,"y":27.2216}},{"x":-95,"y":44.5,"point1":{"x":-58.9243,"y":61.7784},"point2":{"x":58.9243,"y":62.7784}}];

class Animator extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);

        this.base = this.lookupObject.base;
        this.base.isAnimator = true;
	}

	postConstructor(){
		if(this.prefabObject.settings && this.prefabObject.settings.path === undefined){
			this.prefabObject.settings.path = DEFAULT_PATH;
		}
	}
    editPathCallback(newPathGraphic){
        game.editor.deleteObjects([newPathGraphic]);
        this.calculatePathLength();
    }

    calculatePathLength(){
        console.log(this.prefabObject.settings.path);

        let totalLength = 0;
        const verts = this.prefabObject.settings.path;
        const count = verts.length;
        let currentPoint;
		let nextPoint;
        for(let i = 1; i<= count; i++){
            if(i !== count){
				currentPoint = verts[i - 1];
				nextPoint = verts[i];
			}else{
				currentPoint = verts[i - 1];
				nextPoint = verts[0];
			}

            let length = 0;

            if(!currentPoint.point1 || !currentPoint.point2){
                const dx = nextPoint.x - currentPoint.x;
                const dy = nextPoint.y - currentPoint.y;
                length = Math.sqrt(dx*dx + dy*dy);
            }else{
                length = calculateBezierLength(currentPoint, currentPoint.point1, currentPoint.point2, nextPoint);
            }

            totalLength += length;

            console.log("Length for point:", i, 'is', length);
        }

        console.log("Total length:", totalLength);

    }

    init() {
        super.init();
    }
    update() {
        super.update();
    }
}

const editPath = prefab => {
    const graphicObject = new game.editor.graphicObject;
    graphicObject.vertices = prefab.settings.path
    graphicObject.x = prefab.class.base.GetPosition().x * Settings.PTM;
    graphicObject.y = prefab.class.base.GetPosition().y * Settings.PTM;

    const graphic = game.editor.buildGraphicFromObj(graphicObject);

    game.editor.verticeEditingSprite = graphic;
    game.editor.selectTool(game.editor.tool_VERTICEEDITING);
    game.editor.verticeEditingCallback = prefab.class.editPathCallback.bind(prefab.class);
}

Animator.settings = Object.assign({}, Animator.settings, {
    "editPath": prefab=>editPath(prefab),
});
Animator.settingsOptions = Object.assign({}, Animator.settingsOptions, {
	"editPath": '$function',
});

PrefabManager.prefabLibrary.Animator = {
    json: '{"objects":[[0,0.0114,0.0124,0,"animator","base",0,["#999999"],["#000"],[0],true,true,[[{"x":-2.3022,"y":1.0019},{"x":-2.3022,"y":-1.0019},{"x":2.3022,"y":-1.0019},{"x":2.3022,"y":1.0019}]],[1],[2],[0],"",[0],true,false,false,[0.5],[0.2],false,true],[7,-0.3433,-0.3725,0,"","",1,[[6,-40,-0.092,0,"","",71,"#10c5ff","#000",1,30,[{"x":0,"y":0},{"x":0,"y":0}],null,null,null,null,"",0,0,0,0,"",true],[6,-20,-0.092,0,"","",72,"#0894f9","#000",1,30,[{"x":0,"y":0},{"x":0,"y":0}],null,null,null,null,"",0,0,0,0,"",true],[6,0,-0.092,0,"","",73,"#0065ff","#000",1,30,[{"x":0,"y":0},{"x":0,"y":0}],null,null,null,null,"",0,0,0,0,"",true],[6,20,0.368,0,"","",74,"#034ee2","#000",1,30,[{"x":0,"y":0},{"x":0,"y":0}],null,null,null,null,"",0,0,0,0,"",true],[6,40,-0.092,0,"","",75,"#003fa0","#000",1,30,[{"x":0,"y":0},{"x":0,"y":0}],null,null,null,null,"",0,0,0,0,"",true]],0,1.0131,2.3154,0,1,0,0,0,true,false,[]]]}',
    class: Animator,
    library: PrefabManager.LIBRARY_MISC
}

