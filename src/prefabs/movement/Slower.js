import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import { Settings } from '../../Settings';

class Slower extends PrefabManager.basePrefab {

    constructor(target) {
        super(target);
    }
    init(){
        super.init();
        this.base = this.lookupObject['base'];
        this.velocityBoost = -0.5 / Settings.timeStep;

        if(this.prefabObject.settings.isFixed){
            this.base.SetType(Box2D.b2BodyType.b2_staticBody);
        }else{
            this.base.SetType(Box2D.b2_dynamicBody);
        }
    }
    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.PostSolve = function(contact) {
            const otherBody = contact.GetFixtureA().GetBody() === self.base ? contact.GetFixtureB().GetBody() : contact.GetFixtureA().GetBody();

            let bodies = [otherBody];

            if(otherBody.mySprite && otherBody.mySprite.data.prefabInstanceName){
                const prefabKey = otherBody.mySprite.data.prefabInstanceName;
                bodies = game.editor.activePrefabs[prefabKey].class.lookupObject._bodies;
            }
            const direction = self.base.GetAngle();
            const deltaVelocityInc = self.velocityBoost*game.editor.deltaTime;
            const velocityInc = new Box2D.b2Vec2(deltaVelocityInc*Math.cos(direction), deltaVelocityInc*Math.sin(direction));

            bodies.forEach(body=> {
                if(body.GetType() !== Box2D.b2BodyType.b2_staticBody){
                    const velocity = body.GetLinearVelocity();
                    velocity.x += velocityInc.x;
                    velocity.y += velocityInc.y;
                    body.SetLinearVelocity(velocity);
                }
            })

        }
    }
}

Slower.settings = Object.assign({}, Slower.settings, {
    "isFixed": false,
});
Slower.settingsOptions = Object.assign({}, Slower.settingsOptions, {
	"isFixed": false,
});

PrefabManager.prefabLibrary.Slower = {
    json: '{"objects":[[0,-0.122,0.061,0,"booster","base",0,["#999999"],["#000"],[0],false,true,[[{"x":-5.218,"y":0.428},{"x":-5.218,"y":-0.428},{"x":5.218,"y":-0.428},{"x":5.218,"y":0.428}]],[1],0,[0],"",[1],true,false,false],[1,-4.28,1.223,0,"booster","texture",1,"Slower0000",0,0.865,2.356,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Slower,
    library: PrefabManager.LIBRARY_MOVEMENT
}
