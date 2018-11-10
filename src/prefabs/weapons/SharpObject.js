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
        this.bodiesToStick = [];
        this.bodiesToSeperate = [];
        this.connectedBodies = {};
        super.init();
    }
    update(){
        super.update();

        if(this.bodiesToStick.length>0){
            const sharpBody = this.lookupObject['sharpBody'];

            for(let i = 0; i<this.bodiesToStick.length; i++){

                var prismaticJointDef = new Box2D.b2PrismaticJointDef;
                const axisRotation = sharpBody.GetAngle() + 90 * game.editor.DEG2RAD;
                var axis = new Box2D.b2Vec2(Math.cos(axisRotation), Math.sin(axisRotation));
                prismaticJointDef.Initialize(this.bodiesToStick[i].body, sharpBody, this.bodiesToStick[i].pos, axis);
                prismaticJointDef.collideConnected = true;
                // prismaticJointDef.referenceAngle = 0.0;
                // prismaticJointDef.maxMotorForce = 0;
                // prismaticJointDef.motorSpeed = 0;
                // prismaticJointDef.enableMotor = false;
                let joint = game.world.CreateJoint(prismaticJointDef);
                this.connectedBodies[this.bodiesToStick[i].body] = joint;
                console.log("ATTACH BODY");
            }
            this.bodiesToStick = [];
        }
        if(this.bodiesToSeperate.length>0){
            for(let i = 0; i<this.bodiesToSeperate.length; i++){
                var joint = this.connectedBodies[this.bodiesToSeperate[i].body];
                console.log(joint);
                if(!joint) continue;
                game.world.DestroyJoint(joint);
                delete this.connectedBodies[this.bodiesToSeperate[i].body];

                console.log("DETACH BODY");

            }
            this.bodiesToSeperate = [];
        }
    }
    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.BeginContact = function (contact) {
            const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            const sharpBody = self.lookupObject['sharpBody'];
            if(bodies[0] != sharpBody && bodies[1] != sharpBody) return;

            const worldManifold = new Box2D.b2WorldManifold();
            contact.GetWorldManifold(worldManifold);

            const otherBody = (bodies[0] == sharpBody) ? bodies[1] : bodies[0];

            if(self.connectedBodies[otherBody] != undefined) return;
            self.bodiesToStick.push({body:otherBody, pos:worldManifold.points[0]});
        }
        this.contactListener.EndContact = function (contact) {
            const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            const sharpBody = self.lookupObject['sharpBody'];
            if(bodies[0] != sharpBody && bodies[1] != sharpBody) return;
            const otherBody = (bodies[0] == sharpBody) ? bodies[1] : bodies[0];
            if(self.connectedBodies[otherBody] == undefined) return;
            self.bodiesToSeperate.push({body:otherBody});
        }
    }
}