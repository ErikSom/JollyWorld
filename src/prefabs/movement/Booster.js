import * as PrefabManager from '../PrefabManager';
;
import {
    game
} from "../../Game";
import { Settings } from '../../Settings';

class Booster extends PrefabManager.basePrefab {

    constructor(target) {
        super(target);
    }
    init(){
        super.init();
        this.base = this.lookupObject['base'];
        this.velocityBoost = 0.5 / Settings.timeStep;

        if(this.prefabObject.settings.isFixed){
            this.base.SetType(Box2D.b2_staticBody);
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
                if(body.GetType() !== Box2D.b2_staticBody){
                    const velocity = body.GetLinearVelocity();
                    velocity.x += velocityInc.x;
                    velocity.y += velocityInc.y;
                    body.SetLinearVelocity(velocity);
                }
            })

        }
    }
}

Booster.settings = Object.assign({}, Booster.settings, {
    "isFixed": false,
});
Booster.settingsOptions = Object.assign({}, Booster.settingsOptions, {
	"isFixed": false,
});

PrefabManager.prefabLibrary.Booster = {
    json: '{"objects":[[0,0,0.041,0,"slower","base",0,["#999999"],["#000"],[0],false,true,[[{"x":-5.218,"y":0.448},{"x":-5.218,"y":-0.448},{"x":5.218,"y":-0.448},{"x":5.218,"y":0.448}]],[1],0,[0],"",[1],true,false,false],[1,-0.611,1.223,0,"slower","texture",1,"Booster0000",0,0.611,-3.142,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Booster,
    library: PrefabManager.LIBRARY_MOVEMENT
}
