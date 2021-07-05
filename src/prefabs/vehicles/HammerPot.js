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
                            ];
        this.postInit = false;
    }

    init() {
        super.init();

        this.character.ignoreJointDamage = true;

        this.lookupObject['move_joint'].EnableMotor(true);
        this.lookupObject['rotate_joint'].EnableMotor(true);
        this.lookupObject['rotate_joint'].SetMaxMotorTorque(10000);

        this.rotateAccel = 0;
        this.rotateAccelInc = 0.08;
        this.rotateAccelMul = 1.06;
        this.maxRotateAccel = 8;

        this.mouseControlled = true;
        this.currentMousePos = null;
        this.mouseEase = 0.1;

    }

    update() {

        if(!this.postInit){
            this.character.lookupObject.shoulder_left_joint.EnableLimit(false);
            this.character.lookupObject.arm_left_joint.EnableLimit(false);
            this.character.lookupObject.hand_left_joint.EnableLimit(false);

            this.character.lookupObject.shoulder_right_joint.EnableLimit(false);
            this.character.lookupObject.arm_right_joint.EnableLimit(false);
            this.character.lookupObject.hand_right_joint.EnableLimit(false);

            this.currentMousePos = {x:game.editor.mousePosWorld.x, y:game.editor.mousePosWorld.y};

            this.postInit = true;
        }


        const rotateJoint = this.lookupObject['rotate_joint'];
        
        const moveJoint = this.lookupObject['move_joint'];

        if(this.character && this.character.attachedToVehicle){
            if(this.mouseControlled){

                this.currentMousePos.x += (game.editor.mousePosWorld.x-this.currentMousePos.x) * this.mouseEase;
                this.currentMousePos.y += (game.editor.mousePosWorld.y-this.currentMousePos.y) * this.mouseEase;

                rotateJoint.EnableMotor(false);
                this.lookupObject['rotate_joint'].SetMaxMotorTorque(1);

                const rotator = this.lookupObject['rotator'];

                const dx = this.currentMousePos.x - this.lookupObject['frame'].GetPosition().x;
                const dy = this.currentMousePos.y - this.lookupObject['frame'].GetPosition().y;

                const l = Math.sqrt(dx * dx + dy * dy);

                if(l > 1.0){

                    const desiredAngle = Math.atan2(dy, dx) + Math.PI * 0.26; // arm offset
                    const nextAngle = rotator.GetAngle() + rotator.GetAngularVelocity() / 60.0;
                    let totalRotation = desiredAngle - nextAngle;
                    while ( totalRotation < -180 * game.editor.DEG2RAD ) totalRotation += 360 * game.editor.DEG2RAD;
                    while ( totalRotation >  180 * game.editor.DEG2RAD ) totalRotation -= 360 * game.editor.DEG2RAD;
                    let desiredAngularVelocity = totalRotation * 60;
                    const change = 200 * game.editor.DEG2RAD;
                    desiredAngularVelocity = Math.min( change, Math.max(-change, desiredAngularVelocity));
                    const impulse = rotator.GetInertia() * desiredAngularVelocity * 2 * ((Math.abs(totalRotation)/Math.PI) * 20);
                    rotator.ApplyAngularImpulse( impulse );
                    rotator.SetAngularDamping(0.8);
                }

            }else{
                if(Key.isDown(Key.LEFT)){
                    if(this.rotateAccel <0) this.rotateAccel = 0;
                    this.rotateAccel += this.rotateAccelInc;
                    this.rotateAccel *= this.rotateAccelMul;
                    this.rotateAccel = Math.min(this.maxRotateAccel, this.rotateAccel);
                    rotateJoint.SetMotorSpeed(this.rotateAccel);
                } else if(Key.isDown(Key.RIGHT)){
                    if(this.rotateAccel >0) this.rotateAccel = 0;
                    this.rotateAccel -= this.rotateAccelInc;
                    this.rotateAccel *= this.rotateAccelMul;
                    this.rotateAccel = Math.max(-this.maxRotateAccel, this.rotateAccel);
                    rotateJoint.SetMotorSpeed(this.rotateAccel);

                }else{
                    rotateJoint.SetMotorSpeed(0);
                    this.rotateAccel = 0;
                }

                if(Key.isDown(Key.UP)){
                    moveJoint.SetMaxMotorForce(10000);
                    moveJoint.SetMotorSpeed(-50);
                }else if(Key.isDown(Key.DOWN)){
                    moveJoint.SetMaxMotorForce(10000);
                    moveJoint.SetMotorSpeed(6);
                }else{
                    moveJoint.SetMaxMotorForce(3000);
                    moveJoint.SetMotorSpeed(0);
                }
            }
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
    json: '{"objects":[[0,-0.521,2.5031,-0.7501,".character#Character , .flesh","thigh_left",0,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-15.6478,75.5069,-0.7501,"","",1,"Normal_Thigh0000",0,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.6226,3.6311,1.0121,".character#Character , .flesh","leg_left",2,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-1.576,4.393,1.2391,".character#Character , .flesh","feet_left",3,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-18.7822,108.7656,1.0121,"","",4,"Normal_Leg0000",2,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-45.7642,131.8294,1.2391,"","",5,"Normal_Feet0000",3,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.2515,-1.04,-1.1696,".character#Character , .flesh","shoulder_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,1.107,-0.9614,-1.99,".character#Character , .flesh","arm_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-7.2403,-31.6854,-1.1696,"","",8,"Normal_Shoulder0000",6,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,33.3475,-29.1057,-1.99,"","",9,"Normal_Arm0000",7,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.9805,-1.2852,-2.0424,".character#Character , .flesh","hand_left",10,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,59.8437,-36.8082,-2.0424,"","",11,"Normal_Hand0000",10,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.2205,1.5118,-0.262,".character#Character , .flesh","belly",12,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.181],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-1.0522,-2.8309,-0.262,".character#Character , .flesh","head",13,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.393],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-1.1128,-0.2769,0.087,".character#Character , .flesh","body",14,["#999999"],["#000"],[0],false,true,[[{"x":-0.537,"y":1.202},{"x":-0.432,"y":-1.37},{"x":-0.15,"y":-1.828},{"x":0.132,"y":-1.793},{"x":0.555,"y":-1.123},{"x":0.555,"y":1.308},{"x":0.097,"y":1.801},{"x":-0.22,"y":1.801}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-35.2997,36.7076,-0.062,"","",15,"Normal_Belly0000",12,8.747,1.158,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-32.2555,-12.3193,0.087,"","",16,"Normal_Core0000",14,4.169,1.384,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-30.0692,-87.5147,-0.262,"","",17,"Normal_Head_Idle0000",13,2.99,0.785,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.3547,2.3213,-0.8727,".character#Character , .flesh","thigh_right",18,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.3421,3.4823,0.8556,".character#Character , .flesh","leg_right",19,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.8512,-2.9949,-0.262,".character#Character","eye_left",20,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-10.6082,70.0522,-0.8727,"","",21,"Normal_Thigh0000",18,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-10.3922,104.3201,0.8556,"","",22,"Normal_Leg0000",19,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-25.5096,-90.4061,-0.262,"","",23,"Normal_Eye0000",20,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.0858,4.3515,0.9246,".character#Character , .flesh","feet_right",24,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-31.1207,130.114,0.9246,"","",25,"Normal_Feet0000",24,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.7038,-0.756,-0.5407,".character#Character , .flesh","shoulder_right",26,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,0.4314,-0.2623,-1.8156,".character#Character , .flesh","arm_right",27,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.1642,-3.2059,-0.262,".character#Character","eye_right",28,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-4.8996,-96.7361,-0.262,"","",29,"Normal_Eye0000",28,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,4.2818,-5.3734,-1.0472,".vehicle","hammer",30,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":-6.5264,"y":0.1806},{"x":-6.5264,"y":-0.1708},{"x":2.3772,"y":-0.1708},{"x":2.3772,"y":0.1806}],[{"x":1.7179,"y":0.8686},{"x":1.7179,"y":-0.8784},{"x":2.4313,"y":-0.8784},{"x":2.4313,"y":0.8686}]],[1,3],[2,7],[0,0],"",[0,0],true,false,false,[1,1],[0.2,0.2],false,true,false,false,1],[0,-1.1215,2.9177,0,".vehicle","frame",31,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":0.0083,"y":0.0847},{"x":0.0083,"y":0.0847}],[{"x":1.3151,"y":-2.6574},{"x":1.3151,"y":2.4879},{"x":-1.3316,"y":2.4879},{"x":-1.3316,"y":-2.6574}]],[0.6,0.6],[7,7],[70.9441,0],"",[0,0],true,false,false,[0.5,0.8],[0.2,0.2],true,true,false,false,1],[1,-33.1184,84.5517,0,"","",32,"Pot0000",31,3.0245,1.3957,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,98.3749,-107.1094,-1.0472,"","",33,"Hammer0000",30,61.8921,-3.1255,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-20.5806,-22.891,-0.5407,"","",34,"Normal_Shoulder0000",26,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,13.1234,-8.105,-1.8156,"","",35,"Normal_Arm0000",27,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.3043,-0.4981,-2.3383,".character#Character , .flesh","hand_right",36,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,40.0484,-13.3957,-2.3383,"","",37,"Normal_Hand0000",36,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.0509,-0.3078,0,".vehicle","rotator",38,["#999999ff"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[2],[60],"",[0],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,5.2777,-7.1681,0,"","",39,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[2],[30],"",[0],true,false,false,[0.5],[0.2],false,true,false,false,1],[2,5.1104,94.0195,0.5411,".character#Character","leg_left_joint",40,2,0,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-43.3957,122.0758,0.5411,".character#Character","feet_left_joint",41,3,2,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,13.8556,-21.3616,-0.7856,".character#Character","arm_left_joint",42,7,6,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,51.0988,-37.8594,0.8374,".character#Character","hand_left_joint",43,10,7,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-29.667,52.6872,-0.262,".character#Character","thigh_left_joint",44,0,12,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-24.4799,-39.8682,-0.262,".character#Character","shoulder_left_joint",45,6,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-27.65,-57.1028,-0.262,".character#Character","head_joint",46,13,14,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,11.8458,86.2988,0.6456,".character#Character","leg_right_joint",47,19,18,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-31.6109,121.7925,0.4716,".character#Character","feet_right_joint",48,24,19,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-6.829,-93.7448,-0.262,".character#Character","eye_right_joint",49,28,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-6.2509,-2.932,-1.3441,".character#Character","arm_right_joint",50,27,26,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,31.4663,-12.1602,0.4539,".character#Character","hand_right_joint",51,36,27,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-29.5618,-39.7471,-1.1172,".character#Character","shoulder_right_joint",52,26,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-27.075,-89.3468,-0.262,".character#Character","eye_left_joint",53,20,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-36.984,39.4742,-0.262,".character#Character","belly_joint",54,14,12,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-36.224,53.9922,-0.262,".character#Character","thigh_right_joint",55,18,12,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-56.9048,24.8976,0,".vehicle","pot_left_joint",56,31,14,2,false,false,1,10,false,0,0,0.5,6,0,0,true],[2,-10.8856,26.2487,0,".vehicle","pot_right_joint",57,31,14,2,false,false,1,10,false,0,0,0.5,6,0,0,true],[2,-58.8326,-50.4831,0,".vehicle","neck_joint",58,14,13,2,false,false,1,10,false,0,0,0.5,3,0,0,true],[2,57.4857,-39.3301,0,".vehicle","hammer_left_joint",59,10,30,0,false,true,100,0,false,0,0,1,10,0,0,true],[2,38.9121,-14.5916,0,".vehicle","hammer_right_joint",60,36,30,0,false,true,100,0,false,0,0,1,10,0,0,true],[2,-12.0073,106.65,0,".vehicle","leg_joint_right",61,19,31,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-21.0614,108.7102,0,".vehicle","leg_joint_left",62,2,31,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-31.0279,-9.5286,0,".vehicle","rotate_joint",63,38,31,0,false,true,500,10,false,65,-135,0,0,0,0,true],[2,159.2146,-216.2037,0,".vehicle","hammer_move_joint",64,39,30,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,155.5756,-211.7911,0.576,".vehicle","move_joint",65,38,39,1,false,false,1,10,true,0,0,0,0,126,0,true],[2,-21.302,-21.6807,0,".vehicle","right_arm_hammer_spring",66,26,30,2,false,false,1,10,false,0,0,0.6,4,0,0,true],[2,-6.8427,-29.437,0,".vehicle","left_arm_hammer_spring",67,6,30,2,false,false,1,10,false,0,0,0.6,4,0,0,true]]}',
    class: HammerPot,
    library: PrefabManager.LIBRARY_ADMIN,
}
