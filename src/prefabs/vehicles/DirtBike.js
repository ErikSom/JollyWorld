import * as PrefabManager from '../PrefabManager';
import * as AudioManager from '../../utils/AudioManager';

import { BaseVehicle } from './BaseVehicle';
import { DirtBikeHelmet } from '../hats/dirtBikeHelmet'

import {
    game
} from "../../Game";
import { Humanoid } from '../humanoids/Humanoid';
import { b2SubVec2 } from '../../../libs/debugdraw';

const vec1 = new Box2D.b2Vec2(0, 0);
const vec2 = new Box2D.b2Vec2(0, 0);

class DirtBike extends BaseVehicle {
    constructor(target) {
        super(target);
        this.destroyConnectedJoints = {
            head:['pedal_right_joint', 'pedal_left_joint', 'grip_right_joint', 'grip_left_joint', 'back_joint', 'neck_joint', 'sit_joint'],
            body:['pedal_right_joint', 'pedal_left_joint', 'grip_right_joint', 'grip_left_joint', 'back_joint', 'neck_joint', 'sit_joint'],
            thigh_left:['pedal_left_joint', {ifno:'pedal_right_joint', destroy:['sit_joint', 'back_joint']}],
            thigh_right:['pedal_right_joint', {ifno:'pedal_left_joint', destroy:['sit_joint', 'back_joint']}],
            leg_left:['pedal_left_joint', {ifno:'pedal_right_joint', destroy:['sit_joint', 'back_joint']}],
            leg_right:['pedal_right_joint', {ifno:'pedal_left_joint', destroy:['sit_joint', 'back_joint']}],
            feet_left:['pedal_left_joint', {ifno:'pedal_right_joint', destroy:['sit_joint', 'back_joint']}],
            feet_right:['pedal_right_joint', {ifno:'pedal_left_joint', destroy:['sit_joint', 'back_joint']}],
            shoulder_left:['grip_left_joint', {ifno:'grip_right_joint', destroy:['back_joint']}],
            shoulder_right:['grip_right_joint', {ifno:'grip_left_joint', destroy:['back_joint']}],
            arm_left:['grip_left_joint', {ifno:'grip_right_joint', destroy:['back_joint']}],
            arm_right:['grip_right_joint', {ifno:'grip_left_joint', destroy:['back_joint']}],
            hand_left:['grip_left_joint', {ifno:'grip_right_joint', destroy:['back_joint']}],
            hand_right:['grip_right_joint', {ifno:'grip_left_joint', destroy:['back_joint']}],
            belly:['pedal_left_joint', 'pedal_right_joint', 'sit_joint', 'back_joint']
        }
        this.limbsObserver = [
            [[Humanoid.BODY_PARTS.FEET_LEFT, Humanoid.BODY_PARTS.LEG_LEFT, Humanoid.BODY_PARTS.THIGH_LEFT],
             [Humanoid.BODY_PARTS.FEET_RIGHT, Humanoid.BODY_PARTS.LEG_RIGHT, Humanoid.BODY_PARTS.THIGH_RIGHT]
            ]
        ]
        this.vehicleName = 'DirtBike';
    }
    init() {
        super.init();
        this.desiredVehicleTorques = [20000, 20000];
        this.desiredVehicleSpeeds = [20, 20];

        this.lookupObject.wheel_front.GetFixtureList().SetDensity(2.0);
        this.lookupObject.wheel_back.GetFixtureList().SetDensity(2.0);

        this.character.setHat(DirtBikeHelmet);

        this.leanSpeed = 0.38;

        this.refAccel = 0;
        this.destroyTires = [];
        this.snapJoints = [];
    }
    update() {
        super.update();

        const wheelRotationSpeed = Math.abs(this.lookupObject.wheel_back.GetAngularVelocity())/24;

        this.airOffset = this.grounded ? 0 : 0.2;

        if(this.accel == 0){
            this.refAccel = Math.max(0, this.refAccel - (game.editor.deltaTime / 500));
            AudioManager.playPrefabUniqueLoopSFX(this.prefabObject.key, 'dirtbike_gas_loop', 0.1 * this.refAccel+0.05, Math.max(0.6, wheelRotationSpeed *.6 + this.refAccel/2), this.lookupObject.frame.GetPosition());
        }else{
            AudioManager.playPrefabUniqueLoopSFX(this.prefabObject.key, 'dirtbike_gas_loop', 0.3, Math.max(0.6, wheelRotationSpeed)+this.airOffset, this.lookupObject.frame.GetPosition());
            this.refAccel = 1.0;
        }

        if(!this.prefabObject.settings.indestructible){
            if(this.destroyTires.length > 0){
                this.destroyTires.forEach(tire => this.destroyTire(tire));
                this.destroyTires.length = 0;
            }

            this.processWheelSeparation();

            if(this.snapJoints.length > 0){
                this.snapJoints.forEach(joint => this.snapWheelJoint(joint));
                this.snapJoints.length = 0;
            }
        }

    }

    accelerate(dir){
        super.accelerate(dir);
    }
    stopAccelerate(){
        super.stopAccelerate();
    }
    destroy(){
        AudioManager.stopPrefabUniqueLoopSFX(this.prefabObject.key, 'dirtbike_gas_loop');
        super.destroy()
    }
    destroyTire(tire){
        if(tire.broken) return;

        tire.broken = true;
        const textureName = tire.myTexture.data.textureName.split('0000')[0];
        tire.myTexture.originalSprite.texture = PIXI.Texture.from(`${textureName}_Bended0000`);
        tire.myTexture.originalSprite.x = -2;
        tire.myTexture.originalSprite.y = 20;

        let oldFixture = tire.GetFixtureList();

        const fixDef = new Box2D.b2FixtureDef();

        fixDef.set_density(oldFixture.GetDensity());
        fixDef.set_friction(oldFixture.GetFriction());
        fixDef.set_restitution(oldFixture.GetRestitution());

        const shape = new Box2D.b2PolygonShape();
        shape.SetAsBox(1.6, 0.8);

        fixDef.set_shape(shape);

        const filterData = new Box2D.b2Filter();
        filterData.set_categoryBits(oldFixture.GetFilterData().get_categoryBits());
		filterData.set_maskBits(oldFixture.GetFilterData().get_maskBits());

        fixDef.set_filter(filterData);

        const fixture = tire.CreateFixture(fixDef);

        this.wheels = this.wheels.filter(fixture => fixture != oldFixture);
        this.wheels.push(fixture);


        tire.DestroyFixture(oldFixture);

        const targetIndex = tire === this.lookupObject.wheel_front ? 1 : 0;
        this.desiredVehicleTorques[targetIndex] = 400;

        Box2D.destroy(shape);
        Box2D.destroy(fixDef);
    }

    snapWheelJoint(joint){
        this.engines = this.engines.filter(j => j != joint);

        if(joint.GetBodyA() === this.lookupObject.wheel_front || joint.GetBodyB() === this.lookupObject.wheel_front) this.lookupObject.wheel_front.snapped = true;
        if(joint.GetBodyA() === this.lookupObject.wheel_back || joint.GetBodyB() === this.lookupObject.wheel_back) this.lookupObject.wheel_back.snapped = true;

        if(joint.destroyed) return;

        if(joint === this.lookupObject.front_slide){
            game.editor.deleteObjects([this.lookupObject.front_spring1, this.lookupObject.front_spring2]);
            this.lookupObject.wheel_front.snapped = true;
            this.engines = this.engines.filter(j => j != this.lookupObject['engine2']);
        }else if(joint === this.lookupObject.back_spring2){
            game.editor.deleteObjects([this.lookupObject.back_spring]);
            this.lookupObject.wheel_back.snapped = true;
            this.engines = this.engines.filter(j => j != this.lookupObject['engine1']);
        }

        game.editor.deleteObjects([joint]);
    }

    processWheelSeparation(){
        const snapSeperation = 0.4;
        const maxSnapTicks = 30;
        let i;
        const jointsToAnalyse = ['back_spring2', 'front_slide'];

        // check num frames
        for (i = 0; i < jointsToAnalyse.length; i++) {
            let targetJoint = this.lookupObject[jointsToAnalyse[i]];
            if (!targetJoint || targetJoint.destroyed || !this.lookupObject[jointsToAnalyse[i]]) continue;

            vec1.Set(targetJoint.GetAnchorA().x, targetJoint.GetAnchorA().y);
            vec2.Set(targetJoint.GetAnchorB().x, targetJoint.GetAnchorB().y);

            const distance = vec1;
            b2SubVec2(distance, vec2);

            if(distance.Length() > snapSeperation){
                if(targetJoint.snapTick === undefined) targetJoint.snapTick = 0;
                targetJoint.snapTick++;

                if(targetJoint.snapTick>= maxSnapTicks){

                    this.snapJoints.push(targetJoint);

                    targetJoint.snapTick = 0;
                }
            }else{
                targetJoint.snapTick = 0;
            }
        }
    }
    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.PreSolve = function (contact, impulse) {

            let frame = null;
            let otherBody = null;
            if(contact.GetFixtureA().GetBody() === self.lookupObject.frame){
                frame = contact.GetFixtureA().GetBody();
                otherBody = contact.GetFixtureB().GetBody();
            }else if(contact.GetFixtureB().GetBody() === self.lookupObject.frame){
                frame = contact.GetFixtureB().GetBody();
                otherBody = contact.GetFixtureA().GetBody();
            }
            if(!frame || !otherBody.mainCharacter) return;

            if([self.lookupObject[Humanoid.BODY_PARTS.LEG_LEFT], self.lookupObject[Humanoid.BODY_PARTS.LEG_RIGHT], self.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT], self.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT], self.lookupObject[Humanoid.BODY_PARTS.THIGH_LEFT], self.lookupObject[Humanoid.BODY_PARTS.THIGH_RIGHT],self.lookupObject[Humanoid.BODY_PARTS.BELLY], self.lookupObject.wheel_front, self.lookupObject.wheel_back].includes(otherBody)){
                contact.SetEnabled(false);
            }
		}
        this.contactListener.PostSolve = function (contact, impulse) {
            let wheel = null;

            if(contact.GetFixtureA().GetBody() === self.lookupObject.wheel_front || contact.GetFixtureA().GetBody() === self.lookupObject.wheel_back){
                wheel = contact.GetFixtureA().GetBody();
            }else if(contact.GetFixtureB().GetBody() === self.lookupObject.wheel_front || contact.GetFixtureB().GetBody() === self.lookupObject.wheel_back){
                wheel = contact.GetFixtureB().GetBody();
            }

            if(!wheel || wheel.broken) return

            let force = 0;
            for (let j = 0; j < impulse.get_count(); j++){
                if (impulse.get_normalImpulses(j) > force){
                    force = impulse.get_normalImpulses(j);
                }
            }


            const destructionForce = 2000;

            if(force>destructionForce && !self.prefabObject.settings.indestructible){
                self.destroyTires.push(wheel);
            }
        }
    }
}

DirtBike.settings = Object.assign({}, BaseVehicle.settings, {
    "indestructible": false,
});

DirtBike.settingsOptions = Object.assign({}, BaseVehicle.settingsOptions, {
    "indestructible": false,
})

PrefabManager.prefabLibrary.DirtBike = {
    json: '{"objects":[[0,-4.3898,3.6015,0,".vehicle","wheel_back",0,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[60],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,3.6989,3.6062,0,".vehicle","wheel_front",1,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[60],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-0.7075,0.4688,-0.8203,".character#Character , .flesh","thigh_left",2,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,0.01,2.1436,0.0349,".character#Character , .flesh","leg_left",3,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-21.215,14.4772,-0.8203,"","",4,"Normal_Thigh0000",2,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,0.1011,64.3011,0.0349,"","",5,"Normal_Leg0000",3,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.2529,1.2866,0,".vehicle","frame",6,["#999999"],["#000"],[0],false,true,[[[{"x":-5.573,"y":-1.482},{"x":-2.4505,"y":0.2417},{"x":-1.2703,"y":2.3084},{"x":0.5395,"y":2.3084},{"x":1.6782,"y":-0.0277},{"x":3.272,"y":-0.9369},{"x":1.5761,"y":-2.3854},{"x":0.7122,"y":-1.3353}]]],[1],[0],[0],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-131.6942,108.0451,0,"","",7,"DirtBike_WheelBack0000",0,0,0,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,3.4956,2.6784,0,".vehicle","front_axis",8,["#999999"],["#000"],[0],false,true,[[[{"x":-0.6281,"y":-1.0694},{"x":0.4427,"y":1.1777},{"x":0.6237,"y":1.0721},{"x":-0.4383,"y":-1.1804}]]],[120],[7],[0],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-3.2809,3.3065,0,".vehicle","back_axis",9,["#999999"],["#000"],[0],false,true,[[[{"x":-2.1985,"y":0.7872},{"x":2.2268,"y":-0.3191},{"x":2.2363,"y":-0.7919},{"x":-2.2646,"y":0.3239}]]],[6],[7],[0],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,110.9668,108.1861,0,"","",10,"DirtBike_WheelFront0000",1,0,-1.5708,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,104.612,79.9581,0,"","",11,"DirtBike_Axis0000",8,0.4698,2.1467,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-98.242,99.4857,0,"","",12,"DirtBike_WheelSupport0000",9,0.3446,-1.0035,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.1882,-2.2784,-0.7679,".character#Character , .flesh","shoulder_left",13,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,1.0492,-1.6103,-1.4661,".character#Character , .flesh","arm_left",14,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-5.1756,-68.679,-0.7679,"","",15,"Normal_Shoulder0000",13,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,31.726,-48.4701,-1.4661,"","",16,"Normal_Arm0000",14,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.9499,-1.3479,-1.501,".character#Character , .flesh","hand_left",17,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,57.9639,-38.7202,-1.501,"","",18,"Normal_Hand0000",17,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.1965,3.2398,0.0175,".character#Character , .flesh","feet_left",19,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,6.4483,95.7837,0.0175,"","",20,"Normal_Feet0000",19,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-7.7023,29.8808,0,"","",21,"DirtBike_Body0000",6,17.5997,2.6234,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.7368,-0.3738,0,".character#Character , .flesh","belly",22,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.1815],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-0.3244,-4.3578,0,".character#Character , .flesh","head",23,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.3931],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-1.1443,-2.0889,0.3491,".character#Character , .flesh","body",24,["#999999"],["#000"],[0],false,true,[[{"x":-0.5373,"y":1.2023},{"x":-0.4316,"y":-1.3697},{"x":-0.1497,"y":-1.8277},{"x":0.1321,"y":-1.7925},{"x":0.5549,"y":-1.1231},{"x":0.5549,"y":1.3081},{"x":0.0969,"y":1.8013},{"x":-0.2202,"y":1.8013}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-48.5944,-19.2257,0.2,"","",25,"Normal_Belly0000",22,8.7468,1.1579,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-32.1988,-66.2502,0.3491,"","",26,"Normal_Core0000",24,4.1688,1.3835,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-7.6182,-132.848,0,"","",27,"Normal_Head_Idle0000",23,2.9897,0.7854,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.8532,0.5881,-0.8378,".character#Character , .flesh","thigh_right",28,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-0.2337,2.1314,0.2443,".character#Character , .flesh","leg_right",29,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-0.1018,-4.4533,0,".character#Character","eye_left",30,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-25.5788,18.0559,-0.8378,"","",31,"Normal_Thigh0000",28,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-7.2041,63.894,0.2443,"","",32,"Normal_Leg0000",29,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-2.8845,-134.1338,0,"","",33,"Normal_Eye0000",30,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.2658,3.2575,0,".character#Character , .flesh","feet_right",34,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-7.4454,96.3052,0,"","",35,"Normal_Feet0000",34,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.44,-2.1176,-0.5236,".character#Character , .flesh","shoulder_right",36,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,0.6188,-1.3598,-1.4835,".character#Character , .flesh","arm_right",37,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,0.6153,-4.4434,0,".character#Character","eye_right",38,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,18.6285,-133.8368,0,"","",39,"Normal_Eye0000",38,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,-12.6644,-63.7314,-0.5236,"","",40,"Normal_Shoulder0000",36,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,18.8111,-40.9594,-1.4835,"","",41,"Normal_Arm0000",37,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.4656,-1.2299,-1.7453,".character#Character , .flesh","hand_right",42,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,43.866,-35.1023,-1.7453,"","",43,"Normal_Hand0000",42,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,1.6227,34.8109,0,".character#Character","leg_left_joint",44,3,2,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,12.959,-50.2999,0,".character#Character","arm_left_joint",45,14,13,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,52.0198,-44.8618,0,".character#Character","hand_left_joint",46,17,14,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,0.15,89.0764,0,".character#Character","feet_left_joint",47,19,3,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-13.152,-102.8379,0,".character#Character","head_joint",48,23,24,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,-0.4826,40.1396,0,".character#Character","leg_right_joint",49,29,28,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-40.8025,-3.9101,0,".character#Character","thigh_left_joint",50,2,22,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-14.3911,90.4113,0,".character#Character","feet_right_joint",51,34,29,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,16.4427,-132.8429,0,".character#Character","eye_right_joint",52,38,23,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-0.0051,-42.102,0,".character#Character","arm_right_joint",53,37,36,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,36.5895,-39.8156,0,".character#Character","hand_right_joint",54,42,37,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-17.3788,-85.512,0,".character#Character","shoulder_left_joint",55,13,24,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-22.8836,-80.8974,0,".character#Character","shoulder_right_joint",56,36,24,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-4.2515,-133.8353,0,".character#Character","eye_left_joint",57,30,23,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-44.6125,-112.628,0,".character#Character","neck_joint",58,24,23,2,false,false,1,10,false,0,0,0.25,3,0,0,false],[2,-47.164,-11.968,0,".character#Character","belly_joint",59,24,22,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-45.8917,0.3308,0,".character#Character","thigh_right_joint",60,28,22,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-35.2126,82.9889,0,".vehicle","back_spring2",61,6,9,0,false,false,1,10,true,45,-45,0,0,0,0,false],[2,75.7419,53.0864,0,".vehicle","front_spring1",62,6,8,2,false,true,5000,-10,true,0,0,0,2,40,0,false],[2,99.8756,47.5987,0,".vehicle","front_spring2",63,6,8,2,false,false,1,10,false,0,0,0,2,0,0,false],[2,90.4768,48.2051,2.7234,".vehicle","front_slide",64,6,8,1,false,true,1,10,true,0,0,0,0,50,0,false],[2,-113.9944,37.1535,0,".vehicle","back_spring",65,6,9,2,false,false,1,10,false,0,0,0.6,4,0,0,false],[2,-54.7175,-5.6906,0,".character#Character","sit_joint",66,22,6,2,false,false,1,10,false,0,0,0.5,10,0,0,false],[2,-11.1627,96.1397,0,".character#Character","pedal_right_joint",67,34,6,0,false,false,1,10,false,0,0,0.5,6,0,0,false],[2,5.0136,96.3675,0,".character#Character","pedal_left_joint",68,19,6,0,false,false,1,10,false,0,0,0.5,6,0,0,false],[2,57.8716,-42.3846,0,".character#Character","grip_left_joint",69,6,17,0,false,false,1,10,false,0,0,0,0,0,0,false],[2,43.5179,-37.8278,0,".character#Character","grip_right_joint",70,6,42,0,false,false,1,10,false,0,0,0,0,0,0,false],[2,19.3673,-21.4237,0,".character#Character","back_joint",71,24,6,2,false,false,1,10,false,0,0,0.2,4,0,0,false],[2,110.9818,108.3462,0,".vehicle","engine2",72,1,8,0,false,false,100,10,false,0,0,0,0,0,0,false],[2,-132.0182,108.3462,0,".vehicle","engine1",73,0,9,0,false,true,100,10,false,0,0,0,0,0,0,false]]}',
    class: DirtBike,
    library: PrefabManager.LIBRARY_ADMIN,
}
