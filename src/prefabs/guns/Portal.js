
import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import * as Box2D from "../../../libs/Box2D";
import { Settings } from '../../Settings';


class Portal extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init(){
        super.init();
        this.connectedPortal;
        this.incomingObjects = [];
    }
    initContactListener() {
        super.initContactListener();
        const self = this;
        this.color.contactListener.BeginContact = function(contact){
            if(!this.connectedPortal) return;
            const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            const target = (bodies[0] === self.lookupObject['holder']) ? bodies[1] : bodies[0];
            if(target.GetType() == Box2D.b2BodyType.b2_staticBody) return;

            contact.SetEnabled(false);

            let currentTime = Date.now();
            if(target.ignoreCollisionsTime && currentTime<target.ignoreCollisionsTime) return;

            let offsetPosition = target.GetPosition().Clone();
            offsetPosition.SelfSub(self.lookupObject['holder'].GetPosition());
            const offsetAngle = self.lookupObject['holder'].GetAngle()-target.GetAngle();

            target.ignoreCollisionsTime = currentTime+Settings.timeBetweenTeleports;

            var teleportData = {target, offsetPosition, offsetAngle, linearVelocity:target.GetLinearVelocity(), angularVelocity:target.GetAngularVelocity()};
            this.connectedPortal.teleport(teleportData);
        }
        this.contactListener.PostSolve = function (contact, impulse) {
            // const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            // const target = (bodies[0] === self.lookupObject['bullet']) ? bodies[1] : bodies[0];
            // console.log("hit target:", tagret);
        }
    }
    teleport(teleportData){

    }
    setColor(color){
        this.color = color;
        this.lookupObject.portal.mySprite.data.colorFill[0] = color;
        game.editor.updateBodyShapes(this.lookupObject.portal);
    }
    linkPortal(portal){
        this.connectedPortal = portal;
        portal.connectedPortal = this;
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
