
import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";

class Portal extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
            const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            const target = (bodies[0] === self.lookupObject['bullet']) ? bodies[1] : bodies[0];
            console.log("hit target:", tagret);
        }
    }
    update(){
        
    }
}
PrefabManager.prefabLibrary.Portal = {
    json: '{"objects":[[0,0,0,0,".portal","portal",0,["#0093ff"],["#000"],[1],true,true,[[{"x":-0.7676813864695209,"y":5.66424374341025},{"x":-0.7676813864695209,"y":-5.66424374341025},{"x":0.7676813864695207,"y":-5.66424374341025},{"x":0.7676813864695207,"y":5.66424374341025}]],[1],2,[0],"",[1]]]}',
    class: Portal,
}