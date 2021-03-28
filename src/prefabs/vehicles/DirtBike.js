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
}

PrefabManager.prefabLibrary.DirtBike = {
    json: '{"objects":[[0,-4.3907,3.6011,0,".vehicle","wheel_back",0,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[60],"",[1],true,false,false,[0.5],[0.2],false,true],[0,3.698,3.6058,0,".vehicle","wheel_front",1,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[60],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.7083,0.4683,-0.8203,".character#Character , .flesh","thigh_left",2,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.0091,2.1432,0.0349,".character#Character , .flesh","leg_left",3,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-21.2399,14.4633,-0.8203,"","",4,"Normal_Thigh0000",2,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,0.0739,64.2888,0.0349,"","",5,"Normal_Leg0000",3,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.2328,1.3017,0,".vehicle","frame",6,["#999999"],["#000"],[0],false,true,[[[{"x":-5.573,"y":-1.482},{"x":-1.2703,"y":2.3084},{"x":0.5395,"y":2.3084},{"x":4.6715,"y":-0.2527},{"x":1.4615,"y":-2.8821}]]],[1],[7],[0],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-131.7201,108.0322,0,"","",7,"DirtBike_WheelBack0000",0,0,0,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,3.4948,2.6779,0,".vehicle","front_axis",8,["#999999"],["#000"],[0],false,true,[[[{"x":-0.6281,"y":-1.0694},{"x":0.4427,"y":1.1777},{"x":0.6237,"y":1.0721},{"x":-0.4383,"y":-1.1804}]]],[100],[7],[0],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-3.2818,3.3061,0,".vehicle","back_axis",9,["#999999"],["#000"],[0],false,true,[[[{"x":-2.1985,"y":0.7872},{"x":2.2268,"y":-0.3191},{"x":2.2363,"y":-0.7919},{"x":-2.2646,"y":0.3239}]]],[1],[7],[0],"",[1],true,false,false,[0.5],[0.2],false,true],[1,110.9413,108.1741,0,"","",10,"DirtBike_WheelFront0000",1,0,-1.5708,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,104.587,79.9444,0,"","",11,"DirtBike_Axis0000",8,0.4698,2.1467,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-98.2678,99.4726,0,"","",12,"DirtBike_WheelSupport0000",9,0.3446,-1.0035,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.1891,-2.2788,-0.7679,".character#Character , .flesh","shoulder_left",13,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,1.0483,-1.6107,-1.4661,".character#Character , .flesh","arm_left",14,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-5.2017,-68.6914,-0.7679,"","",15,"Normal_Shoulder0000",13,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,31.7003,-48.4824,-1.4661,"","",16,"Normal_Arm0000",14,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.949,-1.3483,-1.501,".character#Character , .flesh","hand_left",17,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true],[1,57.9363,-38.7335,-1.501,"","",18,"Normal_Hand0000",17,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.1956,3.2394,0.0175,".character#Character , .flesh","feet_left",19,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,6.4212,95.772,0.0175,"","",20,"Normal_Feet0000",19,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-7.7338,30.3337,0,"","",21,"DirtBike_Body0000",6,17.1042,2.6068,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.7377,-0.3742,0,".character#Character , .flesh","belly",22,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.1815],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.3253,-4.3582,0,".character#Character , .flesh","head",23,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.3931],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-1.1452,-2.0893,0.3491,".character#Character , .flesh","body",24,["#999999"],["#000"],[0],false,true,[[{"x":-0.5373,"y":1.2023},{"x":-0.4316,"y":-1.3697},{"x":-0.1497,"y":-1.8277},{"x":0.1321,"y":-1.7925},{"x":0.5549,"y":-1.1231},{"x":0.5549,"y":1.3081},{"x":0.0969,"y":1.8013},{"x":-0.2202,"y":1.8013}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-48.6199,-19.2377,0.2,"","",25,"Normal_Belly0000",22,8.7468,1.1579,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-32.2257,-66.2621,0.3491,"","",26,"Normal_Core0000",24,4.1688,1.3835,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-7.6458,-132.86,0,"","",27,"Normal_Head_Idle0000",23,2.9897,0.7854,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.8541,0.5877,-0.8378,".character#Character , .flesh","thigh_right",28,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.2346,2.131,0.2443,".character#Character , .flesh","leg_right",29,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.1027,-4.4537,0,".character#Character","eye_left",30,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-25.6042,18.0425,-0.8378,"","",31,"Normal_Thigh0000",28,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-7.231,63.8811,0.2443,"","",32,"Normal_Leg0000",29,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-2.9101,-134.1472,0,"","",33,"Normal_Eye0000",30,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.2666,3.257,0,".character#Character , .flesh","feet_right",34,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-7.4704,96.2911,0,"","",35,"Normal_Feet0000",34,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.4408,-2.118,-0.5236,".character#Character , .flesh","shoulder_right",36,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.6179,-1.3602,-1.4835,".character#Character , .flesh","arm_right",37,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.6152,-4.4438,0,".character#Character","eye_right",38,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true],[1,18.6245,-133.8501,0,"","",39,"Normal_Eye0000",38,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,-12.6895,-63.7433,-0.5236,"","",40,"Normal_Shoulder0000",36,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,18.7839,-40.9722,-1.4835,"","",41,"Normal_Arm0000",37,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.4647,-1.2304,-1.7453,".character#Character , .flesh","hand_right",42,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true],[1,43.8394,-35.1164,-1.7453,"","",43,"Normal_Hand0000",42,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,1.5945,34.7987,0,".character#Character","leg_left_joint",44,3,2,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,12.9309,-50.3122,0,".character#Character","arm_left_joint",45,14,13,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,51.9917,-44.8741,0,".character#Character","hand_left_joint",46,17,14,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,0.1218,89.0641,0,".character#Character","feet_left_joint",47,19,3,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-13.1801,-102.8501,0,".character#Character","head_joint",48,23,24,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,-0.5108,40.1274,0,".character#Character","leg_right_joint",49,29,28,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-40.8307,-3.9224,0,".character#Character","thigh_left_joint",50,2,22,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-14.4193,90.3991,0,".character#Character","feet_right_joint",51,34,29,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,18.4146,-132.8551,0,".character#Character","eye_right_joint",52,38,23,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-0.0333,-42.1142,0,".character#Character","arm_right_joint",53,37,36,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,36.5614,-39.8278,0,".character#Character","hand_right_joint",54,42,37,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-17.4069,-85.5242,0,".character#Character","shoulder_left_joint",55,13,24,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-22.9118,-80.9096,0,".character#Character","shoulder_right_joint",56,36,24,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-3.2797,-133.8476,0,".character#Character","eye_left_joint",57,30,23,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-44.6407,-112.6402,0,".character#Character","neck_joint",58,24,23,2,false,false,1,10,false,0,0,0.25,3,0,0,false],[2,-47.1922,-11.9802,0,".character#Character","belly_joint",59,24,22,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-45.9199,0.3186,0,".character#Character","thigh_right_joint",60,28,22,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-35.2408,82.9767,0,"","",61,6,9,0,false,false,1,10,true,45,-45,0,0,0,0,false],[2,75.7137,53.0742,0,".vehicle","front_spring1",62,6,8,2,false,true,5000,-10,true,0,0,0,2,40,0,false],[2,99.8475,47.5865,0,".vehicle","front_spring2",63,6,8,2,false,false,1,10,false,0,0,0,2,0,0,false],[2,90.4487,48.1929,2.7234,".vehicle","front_slide",64,6,8,1,false,true,1,10,true,0,0,0,0,50,0,false],[2,-114.4891,37.1413,0,".vehicle","back_spring",65,6,9,2,false,false,1,10,false,0,0,0,6,0,0,false],[2,-54.7457,-5.7028,0,".character#Character","sit_joint",66,22,6,2,false,false,1,10,false,0,0,0.5,10,0,0,false],[2,-11.1909,96.1274,0,".character#Character","pedal_right_joint",67,34,6,0,false,false,1,10,false,0,0,0.5,6,0,0,false],[2,4.9854,96.3553,0,".character#Character","pedal_left_joint",68,19,6,0,false,false,1,10,false,0,0,0.5,6,0,0,false],[2,57.8434,-42.3968,0,".character#Character","grip_left_joint",69,6,17,0,false,false,1,10,false,0,0,0,0,0,0,false],[2,43.4897,-37.8401,0,".character#Character","grip_right_joint",70,6,42,0,false,false,1,10,false,0,0,0,0,0,0,false],[2,19.3391,-21.4359,0,".character#Character","back_joint",71,24,6,2,false,false,1,10,false,0,0,0.2,4,0,0,false],[2,110.9536,108.334,0,".vehicle","engine2",72,1,8,0,false,false,100,10,false,0,0,0,0,0,0,false],[2,-132.0464,108.334,0,".vehicle","engine1",73,0,9,0,false,true,100,10,false,0,0,0,0,0,0,false]]}',
    class: DirtBike,
    library: PrefabManager.LIBRARY_ADMIN,
}
