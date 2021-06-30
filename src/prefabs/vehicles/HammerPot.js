import * as PrefabManager from '../PrefabManager';
import * as AudioManager from '../../utils/AudioManager';
import {Humanoid} from '../humanoids/Humanoid';

import { BaseVehicle } from './BaseVehicle';
import { game } from '../../Game';
import { b2SubVec2 } from '../../../libs/debugdraw';
import { Key } from '../../../libs/Key';


const vec1 = new Box2D.b2Vec2(0, 0);
const vec2 = new Box2D.b2Vec2(0, 0);

class HammerPot extends BaseVehicle {
    constructor(target) {
        super(target);
        this.destroyConnectedJoints = {
            head:['neck_joint', 'pot_left_joint', 'pot_right_joint', 'hammer_left_joint', 'hammer_right_joint'],
            body:['neck_joint', 'pot_left_joint', 'pot_right_joint', 'hammer_left_joint', 'hammer_right_joint'],
            thigh_left:[],
            thigh_right:[],
            leg_left:[],
            leg_right:[],
            feet_left:[],
            feet_right:[],
            shoulder_left:['hammer_left_joint'],
            shoulder_right:['hammer_right_joint'],
            arm_left:['hammer_left_joint'],
            arm_right:['hammer_right_joint'],
            hand_left:['hammer_left_joint'],
            hand_right:['hammer_right_joint'],
            belly:['pot_left_joint', 'pot_right_joint']
        }
        this.vehicleName = 'HammerPot';
        this.limbsObserver = [
                                [[Humanoid.BODY_PARTS.FEET_LEFT, Humanoid.BODY_PARTS.LEG_LEFT, Humanoid.BODY_PARTS.THIGH_LEFT],
                                 [Humanoid.BODY_PARTS.FEET_RIGHT, Humanoid.BODY_PARTS.LEG_RIGHT, Humanoid.BODY_PARTS.THIGH_RIGHT]
                                ]
                            ]
    }
    init() {
        super.init();

        this.character.ignoreJointDamage = true;




        this.rotateJoint = this.lookupObject['rotate_joint'];
        this.moveJoint = this.lookupObject['move_joint'];

        this.rotateJoint.SetMaxMotorTorque(10000);
        this.moveJoint.EnableMotor(true);
        this.rotateJoint.EnableMotor(true);
        
    }
    update() {

        this.character.lookupObject.shoulder_left_joint.EnableLimit(false);
        this.character.lookupObject.arm_left_joint.EnableLimit(false);
        this.character.lookupObject.hand_left_joint.EnableLimit(false);

        this.character.lookupObject.shoulder_right_joint.EnableLimit(false);
        this.character.lookupObject.arm_right_joint.EnableLimit(false);
        this.character.lookupObject.hand_right_joint.EnableLimit(false);

        if(Key.isDown(Key.LEFT)){
            this.rotateJoint.SetMotorSpeed(3);
        }else if(Key.isDown(Key.RIGHT)){
            this.rotateJoint.SetMotorSpeed(-3);
        }else{
            this.rotateJoint.SetMotorSpeed(0);
        }

        if(Key.isDown(Key.UP)){
            this.moveJoint.SetMaxMotorForce(10000);
            this.moveJoint.SetMotorSpeed(-50);
        }else if(Key.isDown(Key.DOWN)){
            this.moveJoint.SetMaxMotorForce(10000);
            this.moveJoint.SetMotorSpeed(50);
        }else{
            this.moveJoint.SetMaxMotorForce(3000);
            this.moveJoint.SetMotorSpeed(0);
        }

        super.update();
    }

    lean() {
        // ignore
    }


    destroy(){
        super.destroy();
    }

    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.PreSolve = function (contact) {
		}
        this.contactListener.PostSolve = function (contact, impulse) {
        }
    }
}

PrefabManager.prefabLibrary.HammerPot = {
    json: '{"objects":[[0,-0.5367,2.4776,-0.7501,".character#Character , .flesh","thigh_left",0,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-16.1194,74.7403,-0.7501,"","",1,"Normal_Thigh0000",0,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.6383,3.6056,1.0121,".character#Character , .flesh","leg_left",2,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-1.5917,4.3675,1.2391,".character#Character , .flesh","feet_left",3,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-19.2538,107.9989,1.0121,"","",4,"Normal_Leg0000",2,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-46.2359,131.0627,1.2391,"","",5,"Normal_Feet0000",3,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.2363,-1.0471,-1.1696,".character#Character , .flesh","shoulder_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,1.0913,-0.9869,-1.99,".character#Character , .flesh","arm_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-6.783,-31.8981,-1.1696,"","",8,"Normal_Shoulder0000",6,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,32.8758,-29.8723,-1.99,"","",9,"Normal_Arm0000",7,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.9648,-1.3107,-2.0424,".character#Character , .flesh","hand_left",10,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,59.372,-37.5748,-2.0424,"","",11,"Normal_Hand0000",10,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.2362,1.4863,-0.262,".character#Character , .flesh","belly",12,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.181],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-1.0679,-2.8564,-0.262,".character#Character , .flesh","head",13,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.393],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-1.1285,-0.3024,0.087,".character#Character , .flesh","body",14,["#999999"],["#000"],[0],false,true,[[{"x":-0.537,"y":1.202},{"x":-0.432,"y":-1.37},{"x":-0.15,"y":-1.828},{"x":0.132,"y":-1.793},{"x":0.555,"y":-1.123},{"x":0.555,"y":1.308},{"x":0.097,"y":1.801},{"x":-0.22,"y":1.801}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-35.7714,35.941,-0.062,"","",15,"Normal_Belly0000",12,8.747,1.158,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-32.7272,-13.086,0.087,"","",16,"Normal_Core0000",14,4.169,1.384,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-30.5409,-88.2814,-0.262,"","",17,"Normal_Head_Idle0000",13,2.99,0.785,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.3704,2.2958,-0.8727,".character#Character , .flesh","thigh_right",18,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.3578,3.4568,0.8556,".character#Character , .flesh","leg_right",19,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.8669,-3.0204,-0.262,".character#Character","eye_left",20,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-11.0798,69.2855,-0.8727,"","",21,"Normal_Thigh0000",18,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-10.8638,103.5534,0.8556,"","",22,"Normal_Leg0000",19,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-25.9813,-91.1727,-0.262,"","",23,"Normal_Eye0000",20,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.1015,4.326,0.9246,".character#Character , .flesh","feet_right",24,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-31.5924,129.3474,0.9246,"","",25,"Normal_Feet0000",24,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.7195,-0.7815,-0.5407,".character#Character , .flesh","shoulder_right",26,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,0.4157,-0.2878,-1.8156,".character#Character , .flesh","arm_right",27,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.1799,-3.2314,-0.262,".character#Character","eye_right",28,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-5.3713,-97.5027,-0.262,"","",29,"Normal_Eye0000",28,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,4.2857,-5.4205,-1.0472,".vehicle","hammer",30,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":-6.5264,"y":0.1806},{"x":-6.5264,"y":-0.1708},{"x":2.3772,"y":-0.1708},{"x":2.3772,"y":0.1806}],[{"x":1.7179,"y":0.8686},{"x":1.7179,"y":-0.8784},{"x":2.4313,"y":-0.8784},{"x":2.4313,"y":0.8686}]],[1,3],[7,7],[0,0],"",[0,0],true,false,false,[1,1],[0.2,0.2],false,true,false,false,1],[0,-1.1373,2.8883,0,".vehicle","frame",31,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":0.0083,"y":0.1014},{"x":0.0083,"y":0.1014}],[{"x":1.3151,"y":-2.674},{"x":1.3151,"y":2.4713},{"x":-1.3316,"y":2.4713},{"x":-1.3316,"y":-2.674}]],[0.6,0.6],[7,7],[70.9441,0],"",[0,0],true,false,false,[0.5,0.5],[0.2,0.2],true,true,false,false,1],[1,-33.59,84.172,0,"","",32,"Pot0000",31,2.5325,1.3606,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,98.4922,-108.524,-1.0472,"","",33,"Hammer0000",30,61.8921,-3.1255,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-21.0522,-23.6577,-0.5407,"","",34,"Normal_Shoulder0000",26,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,12.6518,-8.8717,-1.8156,"","",35,"Normal_Arm0000",27,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.2886,-0.5236,-2.3383,".character#Character , .flesh","hand_right",36,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,39.5767,-14.1623,-2.3383,"","",37,"Normal_Hand0000",36,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.0679,-0.3656,0,".vehicle","rotator",38,["#999999ff"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[2],[60],"",[0],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,5.262,-7.1936,0,"","",39,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[2],[30],"",[0],true,false,false,[0.5],[0.2],false,true,false,false,1],[2,4.6383,93.2534,0.5411,".character#Character","leg_left_joint",40,2,0,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-43.8678,121.3097,0.5411,".character#Character","feet_left_joint",41,3,2,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,13.3835,-22.1277,-0.7856,".character#Character","arm_left_joint",42,7,6,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,50.6267,-38.6255,0.8374,".character#Character","hand_left_joint",43,10,7,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-30.1391,51.9211,-0.262,".character#Character","thigh_left_joint",44,0,12,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-24.952,-40.6343,-0.262,".character#Character","shoulder_left_joint",45,6,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-28.1221,-57.8689,-0.262,".character#Character","head_joint",46,13,14,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,11.3737,85.5327,0.6456,".character#Character","leg_right_joint",47,19,18,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-32.083,121.0264,0.4716,".character#Character","feet_right_joint",48,24,19,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-7.3011,-94.5109,-0.262,".character#Character","eye_right_joint",49,28,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-6.723,-3.6981,-1.3441,".character#Character","arm_right_joint",50,27,26,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,30.9942,-12.9263,0.4539,".character#Character","hand_right_joint",51,36,27,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-30.0339,-40.5132,-1.1172,".character#Character","shoulder_right_joint",52,26,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-27.5471,-90.1129,-0.262,".character#Character","eye_left_joint",53,20,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-37.4561,38.7081,-0.262,".character#Character","belly_joint",54,14,12,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-36.6961,53.2261,-0.262,".character#Character","thigh_right_joint",55,18,12,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-57.3769,24.1315,0,".vehicle","pot_left_joint",56,31,14,2,false,false,1,10,false,0,0,0.5,6,0,0,true],[2,-11.3577,25.4826,0,".vehicle","pot_right_joint",57,31,14,2,false,false,1,10,false,0,0,0.5,6,0,0,true],[2,-59.3047,-51.2492,0,".vehicle","neck_joint",58,14,13,2,false,false,1,10,false,0,0,0.5,3,0,0,true],[2,57.0136,-39.7455,0,".vehicle","hammer_left_joint",59,10,30,2,false,false,1,10,false,0,0,1,10,0,0,true],[2,38.44,-15.3577,0,".vehicle","hammer_right_joint",60,36,30,2,false,false,1,10,false,0,0,1,10,0,0,true],[2,-12.4794,105.8839,0,".vehicle","leg_joint_right",61,19,31,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-21.5335,107.9441,0,".vehicle","leg_joint_left",62,2,31,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-31.5,-10.2947,0,".vehicle","rotate_joint",63,38,31,0,false,true,500,10,false,65,-135,0,0,0,0,true],[2,158.7425,-216.9698,0,".vehicle","hammer_move_joint",64,39,30,0,false,false,1,10,true,0,0,0,0,0,0,true],[2,155.1035,-212.5572,0.576,".vehicle","move_joint",65,38,39,1,false,false,1,10,true,0,0,0,0,100,0,true]]}',
    class: HammerPot,
    library: PrefabManager.LIBRARY_ADMIN,
}
