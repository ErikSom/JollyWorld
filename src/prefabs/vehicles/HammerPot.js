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
    json: '{"objects":[[0,-0.3789,2.2875,-0.7501,".character#Character , .flesh","thigh_left",0,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-11.3869,69.0362,-0.7501,"","",1,"Normal_Thigh0000",0,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.4805,3.4155,1.0121,".character#Character , .flesh","leg_left",2,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-1.4339,4.1774,1.2391,".character#Character , .flesh","feet_left",3,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-14.5213,102.2948,1.0121,"","",4,"Normal_Leg0000",2,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-41.5034,125.3587,1.2391,"","",5,"Normal_Feet0000",3,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.0451,-1.3372,-1.4139,".character#Character , .flesh","shoulder_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,1.3825,-1.477,-1.99,".character#Character , .flesh","arm_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-1.1748,-40.6617,-1.4139,"","",8,"Normal_Shoulder0000",6,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,41.6104,-44.5764,-1.99,"","",9,"Normal_Arm0000",7,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,2.2226,-1.7674,-2.0424,".character#Character , .flesh","hand_left",10,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,67.1045,-51.2769,-2.0424,"","",11,"Normal_Hand0000",10,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.0784,1.2962,-0.262,".character#Character , .flesh","belly",12,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.181],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.9101,-3.0465,-0.262,".character#Character , .flesh","head",13,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.393],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.9707,-0.4925,0.087,".character#Character , .flesh","body",14,["#999999"],["#000"],[0],false,true,[[{"x":-0.537,"y":1.202},{"x":-0.432,"y":-1.37},{"x":-0.15,"y":-1.828},{"x":0.132,"y":-1.793},{"x":0.555,"y":-1.123},{"x":0.555,"y":1.308},{"x":0.097,"y":1.801},{"x":-0.22,"y":1.801}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-31.0389,30.2369,-0.062,"","",15,"Normal_Belly0000",12,8.747,1.158,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-27.9946,-18.7901,0.087,"","",16,"Normal_Core0000",14,4.169,1.384,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-25.8084,-93.9855,-0.262,"","",17,"Normal_Head_Idle0000",13,2.99,0.785,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.2126,2.1057,-0.8727,".character#Character , .flesh","thigh_right",18,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.1987,3.2357,0.8556,".character#Character , .flesh","leg_right",19,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.7091,-3.2105,-0.262,".character#Character","eye_left",20,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-6.3473,63.5814,-0.8727,"","",21,"Normal_Thigh0000",18,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-6.0923,96.9193,0.8556,"","",22,"Normal_Leg0000",19,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-21.2488,-96.8768,-0.262,"","",23,"Normal_Eye0000",20,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.9437,4.1359,0.9246,".character#Character , .flesh","feet_right",24,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-26.8599,123.6433,0.9246,"","",25,"Normal_Feet0000",24,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.495,-1.0049,-0.8898,".character#Character , .flesh","shoulder_right",26,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,0.7735,-0.6446,-1.8156,".character#Character , .flesh","arm_right",27,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.0221,-3.4215,-0.262,".character#Character","eye_right",28,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-0.6388,-103.2068,-0.262,"","",29,"Normal_Eye0000",28,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,4.85,-6.1522,-1.0472,".vehicle","hammer",30,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":-6.5264,"y":0.1806},{"x":-6.5264,"y":-0.1708},{"x":2.3772,"y":-0.1708},{"x":2.3772,"y":0.1806}],[{"x":1.7179,"y":0.8686},{"x":1.7179,"y":-0.8784},{"x":2.4313,"y":-0.8784},{"x":2.4313,"y":0.8686}]],[1,1],[7,7],[0,0],"",[0,0],true,false,false,[0.5,0.5],[0.2,0.2],false,true,false,false,1],[1,115.4197,-130.4761,-1.0472,"","",31,"Hammer0000",30,61.8921,-3.1255,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-14.4234,-30.53,-0.8898,"","",32,"Normal_Shoulder0000",26,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,23.3843,-19.5767,-1.8156,"","",33,"Normal_Arm0000",27,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.6797,-0.8904,-2.3383,".character#Character , .flesh","hand_right",34,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,51.3082,-25.1674,-2.3383,"","",35,"Normal_Hand0000",34,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.0618,3.0138,0,".vehicle","pot",36,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":0.0083,"y":0.1014},{"x":0.0083,"y":0.1014}],[{"x":1.3151,"y":-2.674},{"x":1.3151,"y":2.4713},{"x":-1.3316,"y":2.4713},{"x":-1.3316,"y":-2.674}]],[1,1],[7,7],[70.9441,0],"",[0,0],true,false,false,[0.5,0.5],[0.2,0.2],false,true,false,false,1],[1,-31.3265,87.9359,0,"","",37,"Pot0000",36,2.5325,1.3606,0,false,"#FFFFFF",1,1,1,0,0,0,true],[2,9.3702,87.5537,0.5411,".character#Character","leg_left_joint",38,2,0,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-39.1359,115.61,0.5411,".character#Character","feet_left_joint",39,3,2,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,22.1154,-36.8274,-0.7856,".character#Character","arm_left_joint",40,7,6,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,58.3473,-52.7478,0.8374,".character#Character","hand_left_joint",41,10,7,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-25.4072,46.2214,-0.262,".character#Character","thigh_left_joint",42,0,12,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-22.3522,-45.1156,-0.262,".character#Character","shoulder_left_joint",43,6,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-23.3902,-63.5686,-0.262,".character#Character","head_joint",44,13,14,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,16.1056,79.833,0.6456,".character#Character","leg_right_joint",45,19,18,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-27.3511,115.3267,0.4716,".character#Character","feet_right_joint",46,24,19,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-2.5692,-100.2106,-0.262,".character#Character","eye_right_joint",47,28,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,4.0089,-14.3978,-1.3441,".character#Character","arm_right_joint",48,27,26,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,42.7261,-23.926,0.4539,".character#Character","hand_right_joint",49,34,27,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-29.8709,-43.167,-1.1172,".character#Character","shoulder_right_joint",50,26,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-22.8152,-95.8126,-0.262,".character#Character","eye_left_joint",51,20,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-32.7242,33.0084,-0.262,".character#Character","belly_joint",52,14,12,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-31.9642,47.5264,-0.262,".character#Character","thigh_right_joint",53,18,12,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-52.645,18.4318,0,".vehicle","pot_left_joint",54,36,14,2,false,false,1,10,false,0,0,0,4,0,0,true],[2,-6.6258,19.7829,0,".vehicle","pot_right_joint",55,36,14,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,-54.5728,-56.9489,0,".vehicle","neck_joint",56,14,13,2,false,false,1,10,false,0,0,0.5,3,0,0,true],[2,68.8096,-53.3244,0,".vehicle","hammer_left_joint",57,10,30,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,52.4641,-27.7943,0,".vehicle","hammer_right_joint",58,34,30,0,false,false,1,10,false,0,0,0,0,0,0,true]]}',
    class: HammerPot,
    library: PrefabManager.LIBRARY_ADMIN,
}
