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
        this.connectedBodies = [];
        this.connectedJoints = [];
        super.init();
    }
    update(){
        super.update();

        if(this.bodiesToStick.length>0){
            const sharpBody = this.lookupObject['sharpBody'];

            for(var i = 0; i<this.bodiesToStick.length; i++){

                if(this.bodiesToSeperate.includes(this.bodiesToStick[i].body)) return;
                var prismaticJointDef = new Box2D.b2PrismaticJointDef;
                const axisRotation = sharpBody.GetAngle() + 90 * game.editor.DEG2RAD;
                var axis = new Box2D.b2Vec2(Math.cos(axisRotation), Math.sin(axisRotation));
                prismaticJointDef.Initialize(this.bodiesToStick[i].body, sharpBody, sharpBody.GetPosition(), axis);
                prismaticJointDef.collideConnected = true;
                // prismaticJointDef.referenceAngle = 0.0;
                // prismaticJointDef.maxMotorForce = 0;
                // prismaticJointDef.motorSpeed = 0;
                // prismaticJointDef.enableMotor = false;
                // let fixture = this.bodiesToStick[i].body.GetFixtureList();
                // while (fixture != null) {
                //     fixture.SetDensity(0.001);
                //     fixture = fixture.GetNext();
                // }
                this.bodiesToStick[i].body.ResetMassData();
                this.bodiesToStick[i].body.connectedSpike = this;


                let joint = game.world.CreateJoint(prismaticJointDef);
                this.connectedBodies.push(this.bodiesToStick[i].body);
                this.connectedJoints.push(joint);
                console.log("ATTACH", this.bodiesToStick[i].body.mySprite.data.refName, joint);
                //debugger;
            }
            this.bodiesToStick = [];
        }
        if(this.bodiesToSeperate.length>0){
            for(var i = 0; i<this.bodiesToSeperate.length; i++){
                const tarIndex = this.connectedBodies.indexOf(this.bodiesToSeperate[i].body);
                var joint = this.connectedJoints[tarIndex];
                if(!joint) continue;
                game.world.DestroyJoint(joint);
                console.log("DETACH", this.bodiesToSeperate[i].body.mySprite.data.refName);

                this.bodiesToSeperate[i].body.connectedSpike = undefined;
                this.connectedBodies.splice(tarIndex, 1);
                this.connectedJoints.splice(tarIndex, 1);
                console.log(this.connectedBodies);

            }
            this.bodiesToSeperate = [];
        }
    }
    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.BeginContact = function (contact) {
            let bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            const sharpBody = self.lookupObject['sharpBody'];
            const sharpFixture = (bodies[0] == sharpBody) ? contact.GetFixtureA() : contact.GetFixtureB();
            if(!sharpFixture.IsSensor()) return;
            if(bodies[0] != sharpBody && bodies[1] != sharpBody) return;

            let worldManifold = new Box2D.b2WorldManifold();
            contact.GetWorldManifold(worldManifold);

            let otherBody = (bodies[0] == sharpBody) ? bodies[1] : bodies[0];

            if(otherBody.connectedSpike || otherBody.mySprite.data.collision == 2 || otherBody.GetType() != Box2D.b2BodyType.b2_dynamicBody) return;
            const allowedBodyParts = ['head', 'body'];
            if(otherBody.isFlesh && !allowedBodyParts.includes(otherBody.mySprite.data.refName)) return;
            self.bodiesToStick.push({body:otherBody, pos:worldManifold.points[0]});
        }
        this.contactListener.EndContact = function (contact) {
            let bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            let sharpBody = self.lookupObject['sharpBody'];
            if(bodies[0] != sharpBody && bodies[1] != sharpBody) return;
            let otherBody = (bodies[0] == sharpBody) ? bodies[1] : bodies[0];
            if(!otherBody.connectedSpike) return;
            self.bodiesToSeperate.push({body:otherBody});
        }
    }
}