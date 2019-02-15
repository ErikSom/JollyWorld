
import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";

class Portal extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init(){
        super.init();
    }
    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
            // const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            // const target = (bodies[0] === self.lookupObject['bullet']) ? bodies[1] : bodies[0];
            // console.log("hit target:", tagret);
        }
    }
    setColor(color){
        console.log(color);
        this.color = color;
        this.lookupObject.portal.mySprite.data.colorFill[0] = color;
        game.editor.updateBodyShapes(this.lookupObject.portal);
    }
    update(){

    }
    destroy(){
        game.editor.deleteObjects([this.prefabObject]);
    }
}
PrefabManager.prefabLibrary.Portal = {
    json: '{"objects":[[0,0,0,0,"","portal",0,["#0093ff"],["#000"],[1],true,true,[[{"x":-0.7676813864695209,"y":5.66424374341025},{"x":-0.7676813864695209,"y":-5.66424374341025},{"x":0.7676813864695207,"y":-5.66424374341025},{"x":0.7676813864695207,"y":5.66424374341025}]],[1],2,[0],"",[1]]]}',
    class: Portal,
}
// PrefabManager.prefabLibrary.Portal = {
//     json: '{"objects":[[0,-0.06249997827993725,0.4166665218662454,0,"","portal",0,["#ffffff"],["#000"],[1],true,true,[[{"x":-0.7708330654525546,"y":5.624998045194317},{"x":-0.7708330654525546,"y":-5.624998045194317},{"x":0.7708330654525546,"y":-5.624998045194317},{"x":0.7708330654525546,"y":5.624998045194317}]],[1],0,[0],"",[1]],[6,24.999991311974743,3.7499986967962116,0,"","",1,"#ff0000","#000",1,14.740585273506932,[{"x":0,"y":0},{"x":0,"y":0}],0,28.26353781431091,0.31475766139130845,0,"",1]]}',
//     class: Portal,
// }
