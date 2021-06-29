import * as PrefabManager from '../PrefabManager';
import * as AudioManager from '../../utils/AudioManager';
import {Humanoid} from '../humanoids/Humanoid';

import { BaseVehicle } from './BaseVehicle';
import { game } from '../../Game';
import { b2SubVec2 } from '../../../libs/debugdraw';


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
    }
    update() {
        super.update();
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
    json: '{"objects":[[0,-0.3682,2.1862,-0.7501,".character#Character , .flesh","thigh_left",0,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-11.0638,65.9982,-0.7501,"","",1,"Normal_Thigh0000",0,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.4698,3.3142,1.0121,".character#Character , .flesh","leg_left",2,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-1.4232,4.0761,1.2391,".character#Character , .flesh","feet_left",3,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-14.1982,99.2568,1.0121,"","",4,"Normal_Leg0000",2,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-41.1802,122.3206,1.2391,"","",5,"Normal_Feet0000",3,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.0344,-1.4385,-1.4139,".character#Character , .flesh","shoulder_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,1.3932,-1.5783,-1.99,".character#Character , .flesh","arm_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-0.8516,-43.6997,-1.4139,"","",8,"Normal_Shoulder0000",6,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,41.9335,-47.6144,-1.99,"","",9,"Normal_Arm0000",7,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,2.2333,-1.8687,-2.0424,".character#Character , .flesh","hand_left",10,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,67.4277,-54.3149,-2.0424,"","",11,"Normal_Hand0000",10,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.0677,1.1949,-0.262,".character#Character , .flesh","belly",12,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.181],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.8994,-3.1478,-0.262,".character#Character , .flesh","head",13,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.393],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.96,-0.5938,0.087,".character#Character , .flesh","body",14,["#999999"],["#000"],[0],false,true,[[{"x":-0.537,"y":1.202},{"x":-0.432,"y":-1.37},{"x":-0.15,"y":-1.828},{"x":0.132,"y":-1.793},{"x":0.555,"y":-1.123},{"x":0.555,"y":1.308},{"x":0.097,"y":1.801},{"x":-0.22,"y":1.801}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-30.7157,27.1989,-0.062,"","",15,"Normal_Belly0000",12,8.747,1.158,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-27.6715,-21.8281,0.087,"","",16,"Normal_Core0000",14,4.169,1.384,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-25.4852,-97.0235,-0.262,"","",17,"Normal_Head_Idle0000",13,2.99,0.785,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.2019,2.0044,-0.8727,".character#Character , .flesh","thigh_right",18,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.1893,3.1654,0.8556,".character#Character , .flesh","leg_right",19,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.6984,-3.3118,-0.262,".character#Character","eye_left",20,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-6.0242,60.5434,-0.8727,"","",21,"Normal_Thigh0000",18,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-5.8082,94.8103,0.8556,"","",22,"Normal_Leg0000",19,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-20.9256,-99.9148,-0.262,"","",23,"Normal_Eye0000",20,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.933,4.0346,0.9246,".character#Character , .flesh","feet_right",24,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-26.5368,120.6053,0.9246,"","",25,"Normal_Feet0000",24,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.4843,-1.1062,-0.8898,".character#Character , .flesh","shoulder_right",26,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,0.7842,-0.7459,-1.8156,".character#Character , .flesh","arm_right",27,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.0114,-3.5228,-0.262,".character#Character","eye_right",28,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-0.3156,-106.2448,-0.262,"","",29,"Normal_Eye0000",28,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,4.8607,-6.2535,-1.0472,".vehicle","hammer",30,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":-6.5264,"y":0.1806},{"x":-6.5264,"y":-0.1708},{"x":2.3772,"y":-0.1708},{"x":2.3772,"y":0.1806}],[{"x":1.7179,"y":0.8686},{"x":1.7179,"y":-0.8784},{"x":2.4313,"y":-0.8784},{"x":2.4313,"y":0.8686}]],[2,6],[7,7],[0,0],"",[0,0],true,false,false,[0.5,0.5],[0.2,0.2],false,true,false,false,1],[0,-0.9688,2.5969,0,".vehicle","pot",31,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":0.0083,"y":0.1014},{"x":0.0083,"y":0.1014}],[{"x":1.3151,"y":-2.674},{"x":1.3151,"y":2.4713},{"x":-1.3316,"y":2.4713},{"x":-1.3316,"y":-2.674}]],[0.1,0.1],[7,7],[70.9441,0],"",[0,0],true,false,false,[0.5,0.5],[0.2,0.2],true,true,false,false,1],[1,-28.535,75.4302,0,"","",32,"Pot0000",31,2.5325,1.3606,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,115.7429,-133.5141,-1.0472,"","",33,"Hammer0000",30,61.8921,-3.1255,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-14.1003,-33.568,-0.8898,"","",34,"Normal_Shoulder0000",26,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,23.7074,-22.6148,-1.8156,"","",35,"Normal_Arm0000",27,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.6904,-0.9917,-2.3383,".character#Character , .flesh","hand_right",36,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,51.6314,-28.2055,-2.3383,"","",37,"Normal_Hand0000",36,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,9.6925,84.5143,0.5411,".character#Character","leg_left_joint",38,2,0,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-38.8136,112.5706,0.5411,".character#Character","feet_left_joint",39,3,2,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,22.4377,-39.8668,-0.7856,".character#Character","arm_left_joint",40,7,6,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,58.6696,-55.7872,0.8374,".character#Character","hand_left_joint",41,10,7,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-25.0849,43.182,-0.262,".character#Character","thigh_left_joint",42,0,12,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-22.0299,-48.155,-0.262,".character#Character","shoulder_left_joint",43,6,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-23.0679,-66.608,-0.262,".character#Character","head_joint",44,13,14,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,16.4279,76.7936,0.6456,".character#Character","leg_right_joint",45,19,18,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-27.0288,112.2873,0.4716,".character#Character","feet_right_joint",46,24,19,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-2.2469,-103.25,-0.262,".character#Character","eye_right_joint",47,28,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,4.3312,-17.4372,-1.3441,".character#Character","arm_right_joint",48,27,26,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,43.0484,-26.9654,0.4539,".character#Character","hand_right_joint",49,36,27,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-29.5486,-46.2064,-1.1172,".character#Character","shoulder_right_joint",50,26,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-22.4929,-98.852,-0.262,".character#Character","eye_left_joint",51,20,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-32.4019,29.969,-0.262,".character#Character","belly_joint",52,14,12,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-31.6419,44.487,-0.262,".character#Character","thigh_right_joint",53,18,12,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-52.3227,15.3924,0,".vehicle","pot_left_joint",54,31,14,2,false,false,1,10,false,0,0,0,4,0,0,true],[2,-6.3035,16.7435,0,".vehicle","pot_right_joint",55,31,14,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,-54.2505,-59.9883,0,".vehicle","neck_joint",56,14,13,2,false,false,1,10,false,0,0,0.5,3,0,0,true],[2,69.1319,-56.3638,0,".vehicle","hammer_left_joint",57,10,30,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,52.7864,-30.8337,0,".vehicle","hammer_right_joint",58,36,30,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-7.4252,97.1448,0,".vehicle","leg_joint_right",59,19,31,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-16.4793,99.205,0,".vehicle","leg_joint_left",60,2,31,0,false,false,1,10,false,0,0,0,0,0,0,true]]}',
    class: HammerPot,
    library: PrefabManager.LIBRARY_ADMIN,
}
