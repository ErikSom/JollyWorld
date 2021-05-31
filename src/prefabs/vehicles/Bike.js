import * as PrefabManager from '../PrefabManager';
import * as AudioManager from '../../utils/AudioManager';
import {Humanoid} from '../humanoids/Humanoid';

import { BaseVehicle } from './BaseVehicle';

class Bike extends BaseVehicle {
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
        this.vehicleName = 'Bike';
        this.limbsObserver = [
                                [[Humanoid.BODY_PARTS.FEET_LEFT, Humanoid.BODY_PARTS.LEG_LEFT, Humanoid.BODY_PARTS.THIGH_LEFT],
                                 [Humanoid.BODY_PARTS.FEET_RIGHT, Humanoid.BODY_PARTS.LEG_RIGHT, Humanoid.BODY_PARTS.THIGH_RIGHT]
                                ]
                            ]
    }
    init() {
        super.init();
        this.desiredVehicleTorques = [100, 100];
        this.desiredVehicleSpeeds = [20, 20];
        this.destroyTires = [];
    }
    update() {
        super.update();

        const wheelRotationSpeed = Math.abs(this.lookupObject.wheel_back.GetAngularVelocity())/10 || 0;
        const pedalSpeed = Math.abs(this.lookupObject.pedal.GetAngularVelocity())/8 || 0;
        if(this.accel == 0){
            AudioManager.stopPrefabUniqueLoopSFX(this.prefabObject.key, 'bike_pedal_loop');
            let idleVolume = Math.min(wheelRotationSpeed/15, 0.1);
            if(idleVolume< 0.002) idleVolume = 0;
            AudioManager.playPrefabUniqueLoopSFX(this.prefabObject.key, 'bike_idle_loop', idleVolume, Math.max(0.8, wheelRotationSpeed*1.5), this.lookupObject.frame.GetPosition());
        }else{
            AudioManager.playPrefabUniqueLoopSFX(this.prefabObject.key, 'bike_pedal_loop', 0.3, Math.max(0.8, pedalSpeed), this.lookupObject.frame.GetPosition());
            AudioManager.stopPrefabUniqueLoopSFX(this.prefabObject.key, 'bike_idle_loop');
        }

        if(this.destroyTires.length > 0){
            this.destroyTires.forEach(tire => this.destroyTire(tire));
            this.destroyTires.length = 0;
        }

    }
    destroy(){
        AudioManager.stopPrefabUniqueLoopSFX(this.prefabObject.key, 'bike_pedal_loop');
        AudioManager.stopPrefabUniqueLoopSFX(this.prefabObject.key, 'bike_idle_loop');
        super.destroy();
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
    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.PreSolve = function (contact) {

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

            if([self.lookupObject[Humanoid.BODY_PARTS.LEG_LEFT], self.lookupObject[Humanoid.BODY_PARTS.LEG_RIGHT], self.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT], self.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT], self.lookupObject[Humanoid.BODY_PARTS.THIGH_LEFT], self.lookupObject[Humanoid.BODY_PARTS.THIGH_RIGHT],self.lookupObject[Humanoid.BODY_PARTS.BELLY]].includes(otherBody)){
                contact.SetEnabled(false);
            }
		}
        this.contactListener.PostSolve = function (contact, impulse) {
            let wheel = null;
            let otherBody = null;

            if(contact.GetFixtureA().GetBody() === self.lookupObject.wheel_front || contact.GetFixtureA().GetBody() === self.lookupObject.wheel_back){
                wheel = contact.GetFixtureA().GetBody();
                otherBody = contact.GetFixtureB().GetBody();
            }else if(contact.GetFixtureB().GetBody() === self.lookupObject.wheel_front || contact.GetFixtureB().GetBody() === self.lookupObject.wheel_back){
                wheel = contact.GetFixtureB().GetBody();
                otherBody = contact.GetFixtureA().GetBody();
            }

            if(!wheel || wheel.broken) return

            let force = 0;
            for (let j = 0; j < impulse.get_count(); j++){
                if (impulse.get_normalImpulses(j) > force){
                    force = impulse.get_normalImpulses(j);
                }
            }

            if(force>100){
                self.destroyTires.push(wheel);
            }
        }
    }
}

PrefabManager.prefabLibrary.Bike = {
    json: '{"objects":[[0,-1.4507,-0.0227,0,".character#Character , .flesh","belly",0,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.1815],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-2.8834,3.275,0,".vehicle","wheel_back",1,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[55.3426],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-0.0022,-2.094,-0.7679,".character#Character , .flesh","shoulder_left",2,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-0.3318,3.5987,0,".vehicle","pedal",3,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[2],[15.6959],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,0.035,1.9545,0,".vehicle","frame",4,["#999999"],["#000"],[0],false,true,[[{"x":-1.8667,"y":-1.6667},{"x":1.9667,"y":-2.7667},{"x":3.0667,"y":1.3},{"x":-0.2333,"y":1.7667},{"x":-2.9333,"y":1.3667}]],[1],[0],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,3.0681,3.2455,0,".vehicle","wheel_front",5,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[54.829],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,1.2353,-1.4259,-1.4661,".character#Character , .flesh","arm_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,0.4046,-63.1469,-0.7679,"","",7,"Normal_Shoulder0000",2,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,37.3091,-42.9381,-1.4661,"","",8,"Normal_Arm0000",6,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,2.1359,-1.1635,-1.501,".character#Character , .flesh","hand_left",9,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,63.5441,-33.1882,-1.501,"","",10,"Normal_Hand0000",9,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.5137,0.7819,-0.7854,".character#Character , .flesh","thigh_left",11,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-0.0493,2.3508,0.4014,".character#Character , .flesh","leg_left",12,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-15.4153,23.8703,-0.7854,"","",13,"Normal_Thigh0000",11,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.25,3.3774,0.1047,".character#Character , .flesh","feet_left",14,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-1.662,70.4464,0.4014,"","",15,"Normal_Leg0000",12,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-6.8258,99.9653,0.1047,"","",16,"Normal_Feet0000",14,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-9.5972,107.9096,0,"","",17,"Bicycle_Pedals0000",3,0.3605,0.1433,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,92.0375,97.3651,0,"","",18,"Bicycle_WheelFront0000",5,0.0055,-3.1416,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,-85.9196,97.7134,0,"","",19,"Bicycle_WheelBack0000",1,0.792,0.7446,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,2.0507,38.6351,0,"","",20,"Bicycle_Body0000",4,20.025,1.5208,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.1384,-4.1734,0,".character#Character , .flesh","head",21,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.3931],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-0.8583,-1.7378,0.3491,".character#Character , .flesh","body",22,["#999999"],["#000"],[0],false,true,[[{"x":-0.5373,"y":1.2023},{"x":-0.4316,"y":-1.3697},{"x":-0.1497,"y":-1.8277},{"x":0.1321,"y":-1.7925},{"x":0.5549,"y":-1.1231},{"x":0.5549,"y":1.3081},{"x":0.0969,"y":1.8013},{"x":-0.2202,"y":1.8013}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-40.0113,-8.6926,0.2,"","",23,"Normal_Belly0000",0,8.7468,1.1579,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-23.6186,-55.7172,0.3491,"","",24,"Normal_Core0000",22,4.1688,1.3835,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-2.038,-127.3159,0,"","",25,"Normal_Head_Idle0000",21,2.9897,0.7854,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.7566,1.0593,-0.6283,".character#Character , .flesh","thigh_right",26,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-0.3031,2.7404,0.1745,".character#Character , .flesh","leg_right",27,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,0.0872,-4.2689,0,".character#Character","eye_left",28,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-22.7669,32.1865,-0.6283,"","",29,"Normal_Thigh0000",26,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-9.2888,82.1776,0.1745,"","",30,"Normal_Leg0000",27,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,2.7857,-128.6018,0,"","",31,"Normal_Eye0000",28,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.272,3.8409,0,".character#Character , .flesh","feet_right",32,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-7.6313,113.8073,0,"","",33,"Normal_Feet0000",32,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.2539,-1.9332,-0.5236,".character#Character , .flesh","shoulder_right",34,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,0.8048,-1.1754,-1.4835,".character#Character , .flesh","arm_right",35,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,0.8014,-4.259,0,".character#Character","eye_right",36,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,24.2117,-128.3048,0,"","",37,"Normal_Eye0000",36,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,-7.0813,-58.1994,-0.5236,"","",38,"Normal_Shoulder0000",34,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,24.3913,-35.4274,-1.4835,"","",39,"Normal_Arm0000",35,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.6516,-1.0455,-1.7453,".character#Character , .flesh","hand_right",40,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,49.4461,-29.5703,-1.7453,"","",41,"Normal_Hand0000",40,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,18.5388,-44.7627,0,".character#Character","arm_left_joint",42,6,2,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,57.5996,-39.3246,0,".character#Character","hand_left_joint",43,9,6,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,8.5396,44.998,0,".character#Character","leg_left_joint",44,12,11,0,false,false,1,10,true,-10,-149,0,0,0,0,false],[2,-12.9284,95.5767,0,".character#Character","feet_left_joint",45,14,12,0,false,false,1,10,true,20,-20,0,0,0,0,false],[2,-86.362,96.946,0,".vehicle","engine1",46,1,4,0,false,true,100,20,false,0,0,0,0,0,0,false],[2,-10.2227,107.6958,0,".vehicle","pedal_engine",47,3,4,0,false,true,100,20,false,0,0,0,0,0,0,false],[2,91.9573,97.2151,0,".vehicle","engine2",48,5,4,0,false,true,100,20,false,0,0,0,0,0,0,false],[2,-7.5722,-97.3007,0,".character#Character","head_joint",49,21,22,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,-5.3483,57.1579,0,".character#Character","leg_right_joint",50,27,26,0,false,false,1,10,true,-10,-149,0,0,0,0,false],[2,-14.4227,110.8713,0,".character#Character","feet_right_joint",51,32,27,0,false,false,1,10,true,20,-20,0,0,0,0,false],[2,22.0225,-127.3057,0,".character#Character","eye_right_joint",52,36,21,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,5.5747,-36.5648,0,".character#Character","arm_right_joint",53,35,34,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,42.1693,-34.2784,0,".character#Character","hand_right_joint",54,40,35,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-17.3039,-75.3601,0,".character#Character","shoulder_right_joint",55,34,22,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,1.3282,-128.2981,0,".character#Character","eye_left_joint",56,28,21,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-11.799,-79.9748,0,".character#Character","shoulder_left_joint",57,2,22,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-10.1465,116.9464,0,".character#Character","pedal_right_joint",58,32,3,0,false,false,1,10,false,0,0,0,0,0,0,false],[2,-9.6433,103.4351,0,".character#Character","pedal_left_joint",59,14,3,0,false,false,1,10,false,0,0,0,0,0,0,false],[2,65.3309,-34.9116,0,".character#Character","grip_left_joint",60,4,9,0,false,false,1,10,false,0,0,0,0,0,0,false],[2,52.5984,-29.2989,0,".character#Character","grip_right_joint",61,4,40,0,false,false,1,10,false,0,0,0,0,0,0,false],[2,-39.0327,-107.0908,0,".character#Character","neck_joint",62,22,21,2,false,false,1,10,false,0,0,0.25,3,0,0,false],[2,-94.9335,-144.0323,0,".character#Character","back_joint",63,4,22,2,false,false,1,10,false,0,0,0.25,4,0,0,false],[2,-41.5842,-6.4308,0,".character#Character","belly_joint",64,22,0,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-45.8252,5.868,0,".character#Character","sit_joint",65,4,0,2,false,false,1,10,false,0,0,0.5,10,0,0,false],[2,-40.3119,5.868,0,".character#Character","thigh_right_joint",66,26,0,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-35.2227,1.6271,0,".character#Character","thigh_left_joint",67,11,0,0,false,false,1,10,true,142,-16,0,0,0,0,false]]}',
    class: Bike,
    library: PrefabManager.LIBRARY_ADMIN,
}
