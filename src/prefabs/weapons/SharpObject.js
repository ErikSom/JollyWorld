import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D';
import * as emitterManager from '../../utils/EmitterManager';


import {
    game
} from "../../Game";

export class SharpObject extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init() {
        this.extent = 4.50;
        this.width = 2.25;
        this.spread = 0.75;
        this.resistance = 600.0;
        this.bodiesToStick = [];
        this.bodiesToSeperate = [];
        this.connectedBodies = [];
        this.connectedJoints = [];
        super.init();

        this.RaycastCallbackSpike = function () {
            this.m_hit = false;
        }
        this.RaycastCallbackSpike.prototype.ReportFixture = function (fixture, point, normal, fraction) {
            if (!fixture.GetBody().isFlesh) return -1;
            if (fixture.IsSensor()) return -1;
            this.m_hit = true;
            this.m_point = point.Clone();
            this.m_normal = normal;
            this.m_fixture = fixture;
            return fraction;
        };
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
                prismaticJointDef.maxMotorForce = this.resistance;
                prismaticJointDef.motorSpeed = 0;
                prismaticJointDef.enableMotor = true;
                let fixture = this.bodiesToStick[i].body.GetFixtureList();
                // while (fixture != null) {
                //     fixture.SetDensity(0.001);
                //     fixture = fixture.GetNext();
                // }
                this.bodiesToStick[i].body.ResetMassData();
                this.bodiesToStick[i].body.connectedSpike = this;

                // attach decals
                var basePosition = sharpBody.GetPosition();
                var extentAngle = sharpBody.GetAngle()-90*game.editor.DEG2RAD;
                var extentPosition = new Box2D.b2Vec2(basePosition.x+this.extent*Math.cos(extentAngle), basePosition.y+this.extent*Math.sin(extentAngle));
                extentPosition = basePosition;

                var startAngle = sharpBody.GetAngle()+180*game.editor.DEG2RAD;
                var startPosition = new Box2D.b2Vec2(extentPosition.x+this.width*Math.cos(startAngle), extentPosition.y+this.width*Math.sin(startAngle));


                const numSpreadParts = Math.floor((this.width*2)/this.spread)+1;

                const spreadAngle = sharpBody.GetAngle();
                const bladeAngle = sharpBody.GetAngle()-90*game.editor.DEG2RAD;


                for(var j = 0; j<numSpreadParts; j++){
                    const totalSpread = this.spread*j;
                    let bladePosition = new Box2D.b2Vec2(startPosition.x + totalSpread*Math.cos(spreadAngle), startPosition.y + totalSpread*Math.sin(spreadAngle));
                    let bladeEndPosition = new Box2D.b2Vec2(bladePosition.x + this.extent * Math.cos(bladeAngle),bladePosition.y + this.extent * Math.sin(bladeAngle));

                    var callback = new this.RaycastCallbackSpike();
                    sharpBody.GetWorld().RayCast(callback, bladePosition, bladeEndPosition);
                    if (callback.m_hit) {
                        var body = callback.m_fixture.GetBody();
                        game.editor.addDecalToBody(body, callback.m_point, "Decal10000", true, 0.5);
                        game.editor.addDecalToBody(sharpBody, callback.m_point, "Decal10000", false, 1.3);

                        emitterManager.playOnceEmitter("blood", body, callback.m_point, extentAngle);
                    }
                }

                let joint = game.world.CreateJoint(prismaticJointDef);
                this.connectedBodies.push(this.bodiesToStick[i].body);
                this.connectedJoints.push(joint);
            }

            var lowestDepth = game.editor.getLowestChildIndex(this.connectedBodies);
            if(lowestDepth < this.lookupObject['sharpBody'].myTexture.parent.getChildIndex(this.lookupObject['sharpBody'].myTexture)){
                game.editor.applyToObjects(game.editor.TRANSFORM_FORCEDEPTH, lowestDepth, [].concat(this.lookupObject._bodies, this.lookupObject._textures, this.lookupObject._joints));
            };

            this.bodiesToStick = [];
        }
        if(this.bodiesToSeperate.length>0){
            for(var i = 0; i<this.bodiesToSeperate.length; i++){
                const tarIndex = this.connectedBodies.indexOf(this.bodiesToSeperate[i].body);
                var joint = this.connectedJoints[tarIndex];
                if(!joint) continue;
                game.world.DestroyJoint(joint);

                this.bodiesToSeperate[i].body.connectedSpike = undefined;
                this.connectedBodies.splice(tarIndex, 1);
                this.connectedJoints.splice(tarIndex, 1);

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