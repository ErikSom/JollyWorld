import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D';
import * as emitterManager from '../../utils/EmitterManager';

import {
    game
} from "../../Game";
import { drawLine } from '../../b2Editor/utils/drawing';

export class SharpObject extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init() {
        this.extent = 4.50;
        this.width = 2.25;
        this.maxEntryAngle = 30;
        this.offsetWidth = this.width;
        this.spread = 0.75;
        this.twoSided = false;
        this.resistance = 600.0;
        this.angleCorrection = 0;
        this.bodiesToStick = [];
        this.bodiesToSeperate = [];
        this.connectedBodies = [];
        this.connectedJoints = [];
        super.init();
        this.sharpBody = this.lookupObject['sharpBody'];

        let fixture = this.sharpBody.GetFixtureList();

        //Prepare sharp object to collide with fixed objects but not dynamic objects
		const fixDef = new Box2D.b2FixtureDef;
		fixDef.density = fixture.GetDensity();
		fixDef.friction = fixture.GetFriction();
		fixDef.restitution = fixture.GetRestitution();

		const shape = fixture.GetShape();
		fixDef.shape = shape.Clone();

		const newFixture = this.sharpBody.CreateFixture(fixDef);

		const filterData = fixture.GetFilterData();
		filterData.maskBits = game.editor.MASKBIT_FIXED;
        fixture.SetFilterData(filterData);
        fixture.SetDensity(0.001);
        this.sharpBody.ResetMassData();
        newFixture.FakeSensor = true;
        //



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
    debugDraw(){
		game.editor.debugGraphics.clear();


        const sharpBodyAngle = this.sharpBody.GetAngle()+this.angleCorrection*game.editor.DEG2RAD;
        // attach decals
        var basePosition = this.sharpBody.GetPosition();

        var startAngle = sharpBodyAngle+180*game.editor.DEG2RAD;
        var startPosition = new Box2D.b2Vec2(basePosition.x+this.offsetWidth*Math.cos(startAngle), basePosition.y+this.offsetWidth*Math.sin(startAngle));

        const numSpreadParts = Math.floor((this.width*2)/this.spread)+1;

        const spreadAngle = sharpBodyAngle;
        const bladeAngle = sharpBodyAngle-90*game.editor.DEG2RAD;

        const sides = this.twoSided ? [0, 180] : [0];
        sides.forEach(side =>{
            const sideBladeAngle = bladeAngle+side*game.editor.DEG2RAD;
            for(let j = 0; j<numSpreadParts; j++){
                const totalSpread = this.spread*j;
                let bladePosition = new Box2D.b2Vec2(startPosition.x + totalSpread*Math.cos(spreadAngle), startPosition.y + totalSpread*Math.sin(spreadAngle));
                let bladeEndPosition = new Box2D.b2Vec2(bladePosition.x + this.extent * Math.cos(sideBladeAngle),bladePosition.y + this.extent * Math.sin(sideBladeAngle));
                drawLine(game.editor.getPIXIPointFromWorldPoint(bladePosition), game.editor.getPIXIPointFromWorldPoint(bladeEndPosition));
            }
        })

    }


    update(){
        super.update();

        // this.debugDraw();

        if(this.bodiesToStick.length>0){
            const sharpBody = this.sharpBody;

            for(let i = 0; i<this.bodiesToStick.length; i++){

                if(!this.bodiesToStick[i].body.mySprite) continue;

                const sharpBodyAngle = this.sharpBody.GetAngle()+this.angleCorrection*game.editor.DEG2RAD;

                if(this.bodiesToSeperate.includes(this.bodiesToStick[i].body)) return;
                const prismaticJointDef = new Box2D.b2PrismaticJointDef;
                const axisRotation = sharpBodyAngle + 90 * game.editor.DEG2RAD;
                const axis = new Box2D.b2Vec2(Math.cos(axisRotation), Math.sin(axisRotation));
                prismaticJointDef.Initialize(this.bodiesToStick[i].body, sharpBody, this.sharpBody.GetPosition(), axis);
                prismaticJointDef.collideConnected = true;
                prismaticJointDef.maxMotorForce = this.resistance;
                prismaticJointDef.motorSpeed = 0;
                prismaticJointDef.enableMotor = true;

                this.bodiesToStick[i].body.ResetMassData();
                this.bodiesToStick[i].body.connectedSpike = this;

                // attach decals
                const basePosition = this.sharpBody.GetPosition();
                const extentAngle = sharpBodyAngle-90*game.editor.DEG2RAD;
                const startAngle = sharpBodyAngle+180*game.editor.DEG2RAD;
                const startPosition = new Box2D.b2Vec2(basePosition.x+this.offsetWidth*Math.cos(startAngle), basePosition.y+this.offsetWidth*Math.sin(startAngle));

                const numSpreadParts = Math.floor((this.width*2)/this.spread)+1;

                const spreadAngle = sharpBodyAngle;
                const bladeAngle = sharpBodyAngle-90*game.editor.DEG2RAD;

                const sides = this.twoSided ? [0, 180] : [0];
                sides.forEach(side =>{
                    const sideBladeAngle = bladeAngle+side*game.editor.DEG2RAD;
                    for(let j = 0; j<numSpreadParts; j++){
                        const totalSpread = this.spread*j;
                        let bladePosition = new Box2D.b2Vec2(startPosition.x + totalSpread*Math.cos(spreadAngle), startPosition.y + totalSpread*Math.sin(spreadAngle));
                        let bladeEndPosition = new Box2D.b2Vec2(bladePosition.x + this.extent * Math.cos(sideBladeAngle),bladePosition.y + this.extent * Math.sin(sideBladeAngle));

                        const callback = new this.RaycastCallbackSpike();
                        this.sharpBody.GetWorld().RayCast(callback, bladePosition, bladeEndPosition);
                        if (callback.m_hit) {
                            const body = callback.m_fixture.GetBody();
                            game.editor.addDecalToBody(body, callback.m_point, "Decal.png", true, 0.5);
                            game.editor.addDecalToBody(sharpBody, callback.m_point, "Decal.png", false, 1.3);

                            emitterManager.playOnceEmitter("blood", body, callback.m_point, extentAngle);
                        }
                    }
                });

                let joint = game.world.CreateJoint(prismaticJointDef);
                this.connectedBodies.push(this.bodiesToStick[i].body);
                this.connectedJoints.push(joint);
            }

            var lowestDepth = game.editor.getLowestChildIndex(this.connectedBodies);
            if(lowestDepth < this.sharpBody.myTexture.parent.getChildIndex(this.sharpBody.myTexture)){
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
    isContactAngleValid(contactPoint){
        const basePosition = this.sharpBody.GetPosition();
        const sharpBodyAngle = this.sharpBody.GetAngle()+this.angleCorrection*game.editor.DEG2RAD;
        const startAngle = sharpBodyAngle+180*game.editor.DEG2RAD;
        const startPosition = new Box2D.b2Vec2(basePosition.x+this.offsetWidth*Math.cos(startAngle), basePosition.y+this.offsetWidth*Math.sin(startAngle));
        const bladePosition = new Box2D.b2Vec2(startPosition.x + this.width*Math.cos(sharpBodyAngle), startPosition.y + this.width*Math.sin(sharpBodyAngle));

        const diff = bladePosition.Clone().SelfSub(contactPoint);
        const angle = Math.atan2(diff.y, diff.x) - game.editor.PI2;

        const angleDif = sharpBodyAngle - angle;
        const shortestDif = Math.atan2(Math.sin(angleDif), Math.cos(angleDif)) * game.editor.RAD2DEG;
        const otherSideAngleDif = (sharpBodyAngle+Math.PI) - angle;
        const otherShortestDif = Math.atan2(Math.sin(otherSideAngleDif), Math.cos(otherSideAngleDif)) * game.editor.RAD2DEG;

        if((Math.abs(shortestDif) < this.maxEntryAngle) || (this.twoSided && Math.abs(otherShortestDif) < this.maxEntryAngle)){
            return true;
        }
        return false;
    }
    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.BeginContact = function (contact) {

            let bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            const sharpBody = self.sharpBody;

            const sharpFixture = (bodies[0] == sharpBody) ? contact.GetFixtureA() : contact.GetFixtureB();
            if(!sharpFixture.FakeSensor) return;

            contact.SetEnabled(false);

            if(sharpFixture.GetBody() != sharpBody) return;

            let worldManifold = new Box2D.b2WorldManifold();
            contact.GetWorldManifold(worldManifold);

            let otherBody = (bodies[0] == sharpBody) ? bodies[1] : bodies[0];

            if(!otherBody.mySprite || otherBody.connectedSpike || otherBody.mySprite.data.collision == 2 || otherBody.GetType() != Box2D.b2BodyType.b2_dynamicBody) return;
            const allowedBodyParts = ['head', 'body'];
            if(otherBody.isFlesh && !allowedBodyParts.includes(otherBody.mySprite.data.refName)) return;

            const contactPoint = worldManifold.points[0];


            if(self.isContactAngleValid(contactPoint)){

                const bodyClass = game.editor.retrieveSubClassFromBody(otherBody);
                if(bodyClass && bodyClass.dealDamage){
                    let damage = 30;
                    if(otherBody.mySprite.data.refName === 'head' || otherBody.mySprite.data.refName === 'body') damage *= 100;
                    bodyClass.dealDamage(damage);
                }

                self.bodiesToStick.push({body:otherBody, pos:worldManifold.points[0]});
            }
        }
        this.contactListener.EndContact = function (contact) {
            let bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            let sharpBody = self.sharpBody;
            if(bodies[0] != sharpBody && bodies[1] != sharpBody) return;
            let otherBody = (bodies[0] == sharpBody) ? bodies[1] : bodies[0];
            if(!otherBody.mySprite || !otherBody.connectedSpike) return;
            self.bodiesToSeperate.push({body:otherBody});
        }
        this.contactListener.PreSolve = function(contact){
            let bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            let sharpBody = self.sharpBody;
            const sharpFixture = (bodies[0] == sharpBody) ? contact.GetFixtureA() : contact.GetFixtureB();
            if(!sharpFixture.FakeSensor) return;
            contact.SetEnabled(false);
        }
    }
}
