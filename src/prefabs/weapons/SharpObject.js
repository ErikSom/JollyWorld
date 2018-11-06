import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D'
import {
    game
} from "../../Game";

export class SharpObject extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init() {
        this.minAngleOfAttack = -45;
        this.maxAngleOfAttack = 45;
        super.init();
    }
    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.PreSolve = function (contact, oldManifold) {
            var worldManifold = new Box2D.b2WorldManifold();
            contact.GetWorldManifold(worldManifold);
            var worldCollisionPoint = worldManifold.points[0];
            var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];

            const sharpBody = self.lookupObject['sharpBody'];

            const angleVector = sharpBody.GetPosition().Clone().SelfSub(worldCollisionPoint);
            let angleOfAttack = Math.atan2(angleVector.y, angleVector.x)*game.editor.RAD2DEG - sharpBody.GetAngle()*game.editor.RAD2DEG;

            while ( angleOfAttack < -180) angleOfAttack += 360;
            while ( angleOfAttack >  180) angleOfAttack -= 360;

            angleOfAttack += 45;

            console.log("SHARP CALC");
            console.log(angleOfAttack, self.minAngleOfAttack, self.maxAngleOfAttack);

            if(angleOfAttack>self.minAngleOfAttack && angleOfAttack<self.maxAngleOfAttack){
                console.log("ATTACH!!!!");
            }

        }
    }
}