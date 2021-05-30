import * as PrefabManager from '../PrefabManager';
import * as AudioManager from '../../utils/AudioManager';

import { BaseVehicle } from './BaseVehicle';
import { DirtBikeHelmet } from '../hats/dirtBikeHelmet'

import {
    game
} from "../../Game";
import { Humanoid } from '../humanoids/Humanoid';

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

        this.character.setHat(DirtBikeHelmet);

        this.leanSpeed = 0.4;

        this.refAccel = 0;
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
    }
}

PrefabManager.prefabLibrary.DirtBike = {
    json: '{"objects":[[0,-4.3896,3.6015,0,".vehicle","wheel_back",0,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[60],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,3.6991,3.6062,0,".vehicle","wheel_front",1,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[60],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-0.7073,0.4688,-0.8203,".character#Character , .flesh","thigh_left",2,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,0.0102,2.1436,0.0349,".character#Character , .flesh","leg_left",3,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-21.2085,14.4774,-0.8203,"","",4,"Normal_Thigh0000",2,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,0.1076,64.3014,0.0349,"","",5,"Normal_Leg0000",3,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.2531,1.2866,0,".vehicle","frame",6,["#999999"],["#000"],[0],false,true,[[[{"x":-5.573,"y":-1.482},{"x":-2.4505,"y":0.2417},{"x":-1.2703,"y":2.3084},{"x":0.5395,"y":2.3084},{"x":1.6782,"y":-0.0277},{"x":3.272,"y":-0.9369},{"x":1.5761,"y":-2.3854},{"x":0.7122,"y":-1.3353}]]],[1],[0],[0],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-131.6877,108.0453,0,"","",7,"DirtBike_WheelBack0000",0,0,0,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,3.4958,2.6784,0,".vehicle","front_axis",8,["#999999"],["#000"],[0],false,true,[[[{"x":-0.6281,"y":-1.0694},{"x":0.4427,"y":1.1777},{"x":0.6237,"y":1.0721},{"x":-0.4383,"y":-1.1804}]]],[120],[7],[0],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-3.2807,3.3065,0,".vehicle","back_axis",9,["#999999"],["#000"],[0],false,true,[[[{"x":-2.1985,"y":0.7872},{"x":2.2268,"y":-0.3191},{"x":2.2363,"y":-0.7919},{"x":-2.2646,"y":0.3239}]]],[2],[7],[0],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,110.9733,108.1863,0,"","",10,"DirtBike_WheelFront0000",1,0,-1.5708,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,104.6185,79.9583,0,"","",11,"DirtBike_Axis0000",8,0.4698,2.1467,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-98.2355,99.4859,0,"","",12,"DirtBike_WheelSupport0000",9,0.3446,-1.0035,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.188,-2.2784,-0.7679,".character#Character , .flesh","shoulder_left",13,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,1.0494,-1.6103,-1.4661,".character#Character , .flesh","arm_left",14,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-5.1691,-68.6787,-0.7679,"","",15,"Normal_Shoulder0000",13,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,31.7325,-48.4699,-1.4661,"","",16,"Normal_Arm0000",14,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.9501,-1.3479,-1.501,".character#Character , .flesh","hand_left",17,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,57.9704,-38.72,-1.501,"","",18,"Normal_Hand0000",17,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.1967,3.2398,0.0175,".character#Character , .flesh","feet_left",19,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,6.4548,95.7839,0.0175,"","",20,"Normal_Feet0000",19,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-7.6964,29.8798,0,"","",21,"DirtBike_Body0000",6,17.5997,2.6234,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.7366,-0.3738,0,".character#Character , .flesh","belly",22,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.1815],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-0.3242,-4.3578,0,".character#Character , .flesh","head",23,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.3931],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-1.1441,-2.0889,0.3491,".character#Character , .flesh","body",24,["#999999"],["#000"],[0],false,true,[[{"x":-0.5373,"y":1.2023},{"x":-0.4316,"y":-1.3697},{"x":-0.1497,"y":-1.8277},{"x":0.1321,"y":-1.7925},{"x":0.5549,"y":-1.1231},{"x":0.5549,"y":1.3081},{"x":0.0969,"y":1.8013},{"x":-0.2202,"y":1.8013}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-48.5879,-19.2254,0.2,"","",25,"Normal_Belly0000",22,8.7468,1.1579,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-32.1922,-66.25,0.3491,"","",26,"Normal_Core0000",24,4.1688,1.3835,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-7.6116,-132.8477,0,"","",27,"Normal_Head_Idle0000",23,2.9897,0.7854,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.853,0.5881,-0.8378,".character#Character , .flesh","thigh_right",28,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-0.2335,2.1314,0.2443,".character#Character , .flesh","leg_right",29,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,-0.1016,-4.4533,0,".character#Character","eye_left",30,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-25.5723,18.0562,-0.8378,"","",31,"Normal_Thigh0000",28,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-7.1976,63.8942,0.2443,"","",32,"Normal_Leg0000",29,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-2.878,-134.1336,0,"","",33,"Normal_Eye0000",30,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.2656,3.2575,0,".character#Character , .flesh","feet_right",34,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,-7.4389,96.3055,0,"","",35,"Normal_Feet0000",34,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.4398,-2.1176,-0.5236,".character#Character , .flesh","shoulder_right",36,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,0.619,-1.3598,-1.4835,".character#Character , .flesh","arm_right",37,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[0,0.6155,-4.4434,0,".character#Character","eye_right",38,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,18.635,-133.8366,0,"","",39,"Normal_Eye0000",38,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,-12.6579,-63.7312,-0.5236,"","",40,"Normal_Shoulder0000",36,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,18.8177,-40.9592,-1.4835,"","",41,"Normal_Arm0000",37,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.4658,-1.2299,-1.7453,".character#Character , .flesh","hand_right",42,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true,false,false],[1,43.8725,-35.1021,-1.7453,"","",43,"Normal_Hand0000",42,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,1.6287,34.8106,0,".character#Character","leg_left_joint",44,3,2,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,12.965,-50.3002,0,".character#Character","arm_left_joint",45,14,13,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,52.0258,-44.8621,0,".character#Character","hand_left_joint",46,17,14,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,0.156,89.0761,0,".character#Character","feet_left_joint",47,19,3,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-13.146,-102.8382,0,".character#Character","head_joint",48,23,24,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,-0.4766,40.1393,0,".character#Character","leg_right_joint",49,29,28,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-40.7965,-3.9104,0,".character#Character","thigh_left_joint",50,2,22,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-14.3851,90.411,0,".character#Character","feet_right_joint",51,34,29,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,16.4487,-132.8432,0,".character#Character","eye_right_joint",52,38,23,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,0.0009,-42.1023,0,".character#Character","arm_right_joint",53,37,36,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,36.5955,-39.8159,0,".character#Character","hand_right_joint",54,42,37,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-17.3728,-85.5123,0,".character#Character","shoulder_left_joint",55,13,24,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-22.8776,-80.8977,0,".character#Character","shoulder_right_joint",56,36,24,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-4.2455,-133.8356,0,".character#Character","eye_left_joint",57,30,23,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-44.6065,-112.6283,0,".character#Character","neck_joint",58,24,23,2,false,false,1,10,false,0,0,0.25,3,0,0,false],[2,-47.158,-11.9683,0,".character#Character","belly_joint",59,24,22,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-45.8857,0.3305,0,".character#Character","thigh_right_joint",60,28,22,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-35.2066,82.9886,0,"","",61,6,9,0,false,false,1,10,true,45,-45,0,0,0,0,false],[2,75.7479,53.0861,0,".vehicle","front_spring1",62,6,8,2,false,true,5000,-10,true,0,0,0,2,40,0,false],[2,99.8816,47.5984,0,".vehicle","front_spring2",63,6,8,2,false,false,1,10,false,0,0,0,2,0,0,false],[2,90.4828,48.2048,2.7234,".vehicle","front_slide",64,6,8,1,false,true,1,10,true,0,0,0,0,50,0,false],[2,-114.4549,37.1532,0,".vehicle","back_spring",65,6,9,2,false,false,1,10,false,0,0,0,6,0,0,false],[2,-54.7115,-5.6909,0,".character#Character","sit_joint",66,22,6,2,false,false,1,10,false,0,0,0.5,10,0,0,false],[2,-11.1567,96.1394,0,".character#Character","pedal_right_joint",67,34,6,0,false,false,1,10,false,0,0,0.5,6,0,0,false],[2,5.0196,96.3672,0,".character#Character","pedal_left_joint",68,19,6,0,false,false,1,10,false,0,0,0.5,6,0,0,false],[2,57.8776,-42.3849,0,".character#Character","grip_left_joint",69,6,17,0,false,false,1,10,false,0,0,0,0,0,0,false],[2,43.5239,-37.8281,0,".character#Character","grip_right_joint",70,6,42,0,false,false,1,10,false,0,0,0,0,0,0,false],[2,19.3733,-21.424,0,".character#Character","back_joint",71,24,6,2,false,false,1,10,false,0,0,0.2,4,0,0,false],[2,110.9878,108.3459,0,".vehicle","engine2",72,1,8,0,false,false,100,10,false,0,0,0,0,0,0,false],[2,-132.0122,108.3459,0,".vehicle","engine1",73,0,9,0,false,true,100,10,false,0,0,0,0,0,0,false]]}',
    class: DirtBike,
    library: PrefabManager.LIBRARY_ADMIN,
}
