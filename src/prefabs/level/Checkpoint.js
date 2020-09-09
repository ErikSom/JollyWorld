import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";

class Checkpoint extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init() {
        super.init();
    }
    update() {
        super.update();
    }
    initContactListener() {
        super.initContactListener();
        this.contactListener.PostSolve = function (contact, impulse) {
            const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            let body = bodies[0].mainCharacter ? bodies[0] : bodies[1];
            let checkpoint = bodies[0].mainCharacter ? bodies[1] : bodies[0];
            if(body.mainCharacter){
                game.checkpoint(checkpoint);
            }
        }
    }
}

PrefabManager.prefabLibrary.Checkpoint = {
    json: '{"objects":[[0,8.35833303181125,-5.103651116991235,0,"","",0,["#999999"],["#000"],[0],false,true,[[[{"x":-6.103477081189789,"y":0.46654276250101745},{"x":-5.225278940011403,"y":-0.4555652857362884},{"x":5.2252789400114,"y":-0.4775202392657478},{"x":6.103477081189789,"y":0.46654276250101745}]]],[1],0,[0],"",[1]],[1,252.39661246904768,-153.450884903853,0,"","",1,"CheckPoint0000",0,1.6816311090638565,0.20440876851649906,0,false,"#FFFFFF",1,1,1,0,0,0]]}',
    class: Checkpoint,
    library: PrefabManager.LIBRARY_LEVEL
}
