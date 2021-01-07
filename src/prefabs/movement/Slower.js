import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";

class Slower extends PrefabManager.basePrefab {

    constructor(target) {
        super(target);
    }
    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
        }
    }
}

PrefabManager.prefabLibrary.Slower = {
    json: '{"objects":[[0,0,0.041,0,"slower","base",0,["#999999"],["#000"],[0],false,true,[[{"x":-5.218,"y":0.448},{"x":-5.218,"y":-0.448},{"x":5.218,"y":-0.448},{"x":5.218,"y":0.448}]],[1],0,[0],"",[1],true,false,false],[1,-0.611,1.223,0,"slower","texture",1,"Booster0000",0,0.611,-3.142,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Slower,
    library: PrefabManager.LIBRARY_MOVEMENT
}
