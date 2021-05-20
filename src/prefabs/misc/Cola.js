import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import {SoftBreakable} from './SoftBreakable'

class Cola extends SoftBreakable {
    constructor(target) {
	}
}

PrefabManager.prefabLibrary.CannonBall = {
    json: '{"objects":[[0,0.0024,-0.0092,0,"","",0,["#999999"],["#000"],[1],false,true,[[{"x":0.3228,"y":-1.19},{"x":0.3228,"y":1.19},{"x":-0.3228,"y":1.19},{"x":-0.3228,"y":-1.19}]],[1],[0],[0],"",[0],false,false,false,[0.5],[0.2],false,true,false],[1,-0.072,0.2759,0,"","",1,"Cola instance 10000",0,0.5703,-1.826,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Cola,
    library: PrefabManager.LIBRARY_MISC
}
