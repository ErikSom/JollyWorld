
import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";

class PortalBullet extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init(){
        super.init();
        this.destroyMe = false;
    }
    initContactListener() {
        console.log("init contact listener");
        super.initContactListener();
        const self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
            // const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            // const target = (bodies[0] === self.lookupObject['bullet']) ? bodies[1] : bodies[0];
            self.destroyMe = true;
        }
    }
    update(){
        super.update();
        if(this.destroyMe){
            console.log("DESTROY ME!");
             game.editor.deleteObjects([this.prefabObject]);
        }
    }
}
PrefabManager.prefabLibrary.PortalBullet = {
    json: '{"objects":[[0,0,0,0,"","bullet",0,["#18d5ff"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],0,[14.273075971261724],"",[1]]]}',
    class: PortalBullet,
}