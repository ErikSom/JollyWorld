import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";

class Booster extends PrefabManager.basePrefab {

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

PrefabManager.prefabLibrary.Booster = {
    json: '{"objects":[[0,-0.122,0.061,0,"booster","base",0,["#999999"],["#000"],[0],false,true,[[{"x":-5.218,"y":0.428},{"x":-5.218,"y":-0.428},{"x":5.218,"y":-0.428},{"x":5.218,"y":0.428}]],[1],0,[0],"",[1],true,false,false],[1,-4.28,1.223,0,"booster","texture",1,"Slower0000",0,0.865,2.356,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Booster,
    library: PrefabManager.LIBRARY_MOVEMENT
}
