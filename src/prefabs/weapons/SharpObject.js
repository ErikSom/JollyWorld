import * as PrefabManager from '../PrefabManager';
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
            let vel1 = bodies[0].GetLinearVelocityFromWorldPoint( worldCollisionPoint );
            let vel2 = bodies[1].GetLinearVelocityFromWorldPoint( worldCollisionPoint );
            let impactVelocity = vel1.Clone().SelfSub(vel2);
            let collisionAngle = Math.atan2(impactVelocity.y, impactVelocity.x);

            const sharpBody = this.lookupObject['sharpBody'];
            console.log("SHARP CALC");
            console.log(collisionAngle, sharpBody.GetAngle());
        }
    }
}