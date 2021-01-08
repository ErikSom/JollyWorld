import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";

class Trampoline extends PrefabManager.basePrefab {

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

PrefabManager.prefabLibrary.Trampoline = {
    json: '{"objects":[[0,-0.334,0.337,0,"trampoline","body",0,["#999999"],["#000"],[0],false,true,[[{"x":-6.184,"y":0.717},{"x":-6.184,"y":-0.717},{"x":6.184,"y":-0.717},{"x":6.184,"y":0.717}]],[1],0,[0],"",[1],true,false,false],[1,-10.408,4.887,0,"trampoline","texture",1,"Jumper0000",0,5.237,1.645,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Trampoline,
    library: PrefabManager.LIBRARY_MOVEMENT
}
