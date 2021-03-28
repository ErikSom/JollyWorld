import * as Box2D from "../../../libs/Box2D"
import * as PrefabManager from '../PrefabManager';
import { BaseVehicle } from './BaseVehicle';

import {Humanoid} from '../humanoids/Humanoid';
import { SkateHelmet } from '../hats/skateHelmet'
import * as AudioManager from '../../utils/AudioManager';


import {
    game
} from "../../Game";
import { PropertyAnimator } from "../../b2Editor/utils/propertyAnimator";
import { drawCircle } from "../../b2Editor/utils/drawing";

class Skateboard extends BaseVehicle {
    constructor(target) {
        super(target);
        this.destroyConnectedJoints = {
            head:['neck_stabalize_joint', 'back_stabalize_joint', 'back_stand_joint', 'front_stand_joint', 'foot_left_d1', 'foot_left_rope', 'foot_left_d2'],
            body:['neck_stabalize_joint', 'back_stabalize_joint', 'back_stand_joint', 'front_stand_joint', 'foot_left_d1', 'foot_left_rope', 'foot_left_d2'],
            thigh_left:['neck_stabalize_joint', 'back_stabalize_joint', 'back_stand_joint', 'front_stand_joint', 'foot_left_d1', 'foot_left_rope', 'foot_left_d2'],
            thigh_right:['neck_stabalize_joint', 'back_stabalize_joint', 'back_stand_joint', 'front_stand_joint', 'foot_left_d1', 'foot_left_rope', 'foot_left_d2'],
            leg_left:['neck_stabalize_joint', 'back_stabalize_joint', 'back_stand_joint', 'front_stand_joint', 'foot_left_d1', 'foot_left_rope', 'foot_left_d2'],
            leg_right:['neck_stabalize_joint', 'back_stabalize_joint', 'back_stand_joint', 'front_stand_joint', 'foot_left_d1', 'foot_left_rope', 'foot_left_d2'],
            feet_left:['neck_stabalize_joint', 'back_stabalize_joint', 'back_stand_joint', 'front_stand_joint', 'foot_left_d1', 'foot_left_rope', 'foot_left_d2'],
            feet_right:['neck_stabalize_joint', 'back_stabalize_joint', 'back_stand_joint', 'front_stand_joint', 'foot_left_d1', 'foot_left_rope', 'foot_left_d2'],
            shoulder_left:[],
            shoulder_right:[],
            arm_left:[],
            arm_right:[],
            hand_left:[],
            hand_right:[],
        }
        this.vehicleName = 'Skateboard';
        this.legAnimation = new PropertyAnimator(
            [{x:0.6, y:3.0, l:0.4},
            {x:4.2, y:4.4, l:0.25},
            {x:1.5, y:7.0, l:0.25},
            {x:-2.1, y:5.5, l:0.25}], 1000
        );
        this.limbsObserver = [Humanoid.BODY_PARTS.BELLY, Humanoid.BODY_PARTS.FEET_RIGHT, Humanoid.BODY_PARTS.FEET_LEFT, Humanoid.BODY_PARTS.LEG_RIGHT, Humanoid.BODY_PARTS.LEG_LEFT, Humanoid.BODY_PARTS.THIGH_RIGHT, Humanoid.BODY_PARTS.THIGH_LEFT];
    }
    init() {
		super.init();
        this.leanSpeed = 0.3;
        this.desiredVehicleTorques = [200, 200];
        this.desiredVehicleSpeeds = [20, 20];
        const bodyDef = new Box2D.b2BodyDef();
        this.m_groundBody = game.world.CreateBody(bodyDef);
        this.m_groundBody.mySprite = {data:{prefabInstanceName:this.lookupObject.body.mySprite.data.prefabInstanceName}} // hack to not get deleted on mirroring

        const md = new Box2D.b2MouseJointDef();
        md.bodyA = this.m_groundBody;


        const footRight = this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT];
        md.bodyB = footRight;

        md.target = footRight.GetPosition();

        md.collideConnected = true;
        md.maxForce = 1000.0 * footRight.GetMass();
        this.legAnimator = game.world.CreateJoint(md);
        footRight.SetAwake(true);

        this.character.setHat(SkateHelmet);

    }
    update() {
        super.update();

        let globalFrame;
        const wheelRotationSpeed = (Math.abs(this.lookupObject.wheel_back.GetAngularVelocity())/20 + Math.abs(this.lookupObject.wheel_front.GetAngularVelocity())/20)/2;
        let idleVolume = Math.min(wheelRotationSpeed/15, 0.1);
        if(idleVolume< 0.002) idleVolume = 0;

        if(this.character.alive && this.character.attachedToVehicle){
            if(this.accel != 0){
                this.legAnimation.update(game.editor.deltaTime*this.accel);
                const frame = this.legAnimation.getFrame();

                globalFrame = this.lookupObject.body.GetWorldPoint(frame, new Box2D.b2Vec2())
                // DEBUG DRAW EXAMPLE
                // game.editor.debugGraphics.clear();
                // const pixiPoint = game.editor.getPIXIPointFromWorldPoint(globalFrame);
                // game.levelCamera.matrix.apply(pixiPoint,pixiPoint);
                // drawCircle(pixiPoint, 3);

                if(this.grounded && this.legAnimation.currentFrame === 1 && this.lastLegFrame !== 1){
                    const pitchOffset = 0.3;
                    AudioManager.playSFX ('skateboard_pedle', idleVolume, 1.0 + (Math.random()*pitchOffset - pitchOffset/2), this.lookupObject.frame.GetPosition())
                }
                this.lastLegFrame = this.legAnimation.currentFrame;



            }else{
                globalFrame = this.lookupObject.frame.GetPosition().Clone();
                const offset = 1.0;
                const offsetAngle = -0.1;
                const angle = this.lookupObject.frame.GetAngle()+offsetAngle;
                globalFrame.x += offset*Math.cos(angle);
                globalFrame.y += offset*Math.sin(angle);
            }

            this.legAnimator.SetTarget(globalFrame);
        }else if(this.legAnimator){
            game.world.DestroyJoint(this.legAnimator);
            this.legAnimator = null;
        }

        AudioManager.playPrefabUniqueLoopSFX(this.prefabObject.key, 'skateboard_idle_loop', idleVolume, Math.max(0.8, wheelRotationSpeed * 0.5), this.lookupObject.frame.GetPosition());

    }
    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.PreSolve = function(contact) {
            // disable collision with right leg
            const skateboardPartsToIgnore = [self.lookupObject.frame, self.lookupObject.wheel_front, self.lookupObject.wheel_back];
            if(skateboardPartsToIgnore.includes(contact.GetFixtureA().GetBody()) || skateboardPartsToIgnore.includes(contact.GetFixtureB().GetBody())){
                const other = skateboardPartsToIgnore.includes(contact.GetFixtureA().GetBody()) ? contact.GetFixtureB().GetBody() : contact.GetFixtureA().GetBody();
                if(other.mainCharacter && other.mySprite && ["feet_right", 'leg_right', 'thigh_right'].includes(other.mySprite.data.refName)){
                    contact.SetEnabled(false);
                }
            }
        }
    }
}

PrefabManager.prefabLibrary.Skateboard = {
    json: '{"objects":[[0,0.0047,3.4471,0,"skateboard","frame",0,["#999999"],["#000"],[0],false,true,[[{"x":2.278,"y":-0.177},{"x":2.278,"y":0.177},{"x":-2.278,"y":0.177},{"x":-2.278,"y":-0.177}]],[8],[7],[0],"",[1],true,false,false,[0],[0.2],false,true],[1,0.2429,107.5821,0,"","",1,"SkateBoard_Board0000",0,4.17,-1.546,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,1.5432,3.9681,0,"skateboard","wheel_front",2,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[30],[7],[9.707],"",[1],true,false,false,[0.3],[0.2],false,true],[1,46.6978,119.2063,0,"","",3,"Skateboard_Wheel0000",2,0.435,-0.384,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.5223,3.9721,0,"skateboard","wheel_back",4,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[30],[7],[9.707],"",[1],true,false,false,[0.3],[0.2],false,true],[1,-45.2672,119.3263,0,"","",5,"Skateboard_Wheel0000",4,0.435,-0.384,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.0873,0.7921,-0.401,".character#Character , .flesh","thigh_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.3133,2.3621,0.768,".character#Character , .flesh","leg_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-2.7795,24.1445,-0.401,"","",8,"Normal_Thigh0000",6,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.7793,3.2201,0.035,".character#Character , .flesh","feet_left",9,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-9.5436,70.725,0.768,"","",10,"Normal_Leg0000",7,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-22.802,95.2031,0.035,"","",11,"Normal_Feet0000",9,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.2647,-2.3079,0.052,".character#Character , .flesh","shoulder_left",12,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.3457,-0.7799,-0.175,".character#Character , .flesh","arm_left",13,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,8.4996,-69.1155,0.052,"","",14,"Normal_Shoulder0000",12,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,10.5937,-23.2004,-0.175,"","",15,"Normal_Arm0000",13,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.3587,0.0921,-0.018,".character#Character , .flesh","hand_left",16,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true],[1,9.0024,2.3822,-0.018,"","",17,"Normal_Hand0000",16,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.3653,-0.3179,-0.14,".character#Character , .flesh","belly",18,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.181],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.3557,-4.6109,-0.14,".character#Character , .flesh","head",19,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.393],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.0263,-2.0849,0.209,".character#Character , .flesh","body",20,["#999999"],["#000"],[0],false,true,[[{"x":-0.537,"y":1.202},{"x":-0.432,"y":-1.37},{"x":-0.15,"y":-1.828},{"x":0.132,"y":-1.793},{"x":0.555,"y":-1.123},{"x":0.555,"y":1.308},{"x":0.097,"y":1.801},{"x":-0.22,"y":1.801}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-8.6038,-17.9602,0.06,"","",21,"Normal_Belly0000",18,8.747,1.158,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,0.8168,-66.3934,0.209,"","",22,"Normal_Core0000",20,4.169,1.384,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,12.469,-140.7145,-0.14,"","",23,"Normal_Head_Idle0000",19,2.99,0.785,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.1257,0.6791,-0.663,".character#Character , .flesh","thigh_right",24,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.3947,2.2501,0.437,".character#Character , .flesh","leg_right",25,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.563,-4.7319,-0.14,".character#Character","eye_left",26,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true],[1,3.7147,20.7827,-0.663,"","",27,"Normal_Thigh0000",24,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,11.6592,67.419,0.437,"","",28,"Normal_Leg0000",25,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,16.9826,-142.5099,-0.14,"","",29,"Normal_Eye0000",26,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,0.2647,3.2361,0.034,".character#Character , .flesh","feet_right",30,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,8.5166,95.6826,0.034,"","",31,"Normal_Feet0000",30,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.1227,-2.1509,0.035,".character#Character , .flesh","shoulder_right",32,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.1517,-0.6269,-0.053,".character#Character , .flesh","arm_right",33,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,1.2763,-4.8169,-0.14,".character#Character","eye_right",34,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true],[1,38.3826,-145.0599,-0.14,"","",35,"Normal_Eye0000",34,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,4.2415,-64.4151,0.035,"","",36,"Normal_Shoulder0000",32,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,4.7482,-18.5846,-0.053,"","",37,"Normal_Arm0000",33,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.0357,0.2591,-0.087,".character#Character , .flesh","hand_right",38,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-0.7097,7.5143,-0.087,"","",39,"Normal_Hand0000",38,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.3587,-0.5529,0,"skateboard","stabalizer",40,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[0.6],[2],[34.639],"",[1],true,false,false,[0.5],[0.2],false,true],[2,9.038,52.3809,-0.035,".character#Character","leg_left_joint",41,7,6,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-30.845,88.3539,-0.279,".character#Character","feet_left_joint",42,9,7,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,7.894,-45.3951,-0.14,".character#Character","arm_left_joint",43,13,12,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,14.82,-4.7611,1.483,".character#Character","hand_left_joint",44,16,13,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-5.446,-1.3431,-0.262,".character#Character","thigh_left_joint",45,6,18,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,9.451,-92.4571,-0.14,".character#Character","shoulder_left_joint",46,12,20,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,11.225,-110.2031,-0.14,".character#Character","head_joint",47,19,20,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,23.18,42.8859,0.227,".character#Character","leg_right_joint",48,25,24,0,false,false,1,10,true,-10,-149,0,0,0,0,false],[2,1.545,89.0869,-0.296,".character#Character","feet_right_joint",49,30,25,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,38.357,-144.0341,-0.14,".character#Character","eye_right_joint",50,34,19,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,3.325,-39.9641,-0.14,".character#Character","arm_right_joint",51,33,32,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,4.662,0.7069,1.658,".character#Character","hand_right_joint",52,38,33,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,4.642,-87.1211,-0.14,".character#Character","shoulder_right_joint",53,32,20,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,16.726,-142.1361,-0.14,".character#Character","eye_left_joint",54,26,19,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-9.809,-15.4831,-0.14,".character#Character","belly_joint",55,20,18,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-12.003,-0.0381,-0.262,".character#Character","thigh_right_joint",56,24,18,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-33.01,98.1819,0,".character#Character","foot_left_d1",57,0,9,2,false,false,1,10,false,0,0,0.3,10,0,0,true],[2,-54.519,34.1979,0,".character#Character","back_stand_joint",58,20,0,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,49.95,31.8299,0,".character#Character","front_stand_joint",59,20,0,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,10.205,-16.5761,0,"skateboard","stabalizer_joint",60,40,0,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-108.385,-100.1731,0,".character#Character","back_stabalize_joint",61,20,40,2,false,false,1,10,false,0,0,0.3,3,0,0,true],[2,-88.259,-151.6721,0,".character#Character","neck_stabalize_joint",62,19,40,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,-15.558,98.9009,0,".character#Character","foot_left_d2",63,0,9,2,false,false,1,10,false,0,0,0.3,10,0,0,true],[2,-25.925,95.8889,0,".character#Character","foot_left_rope",64,9,4,3,false,false,1,10,false,0,0,0,0,0,0,true],[2,-46.129,119.0039,0,"skateboard","engine1",65,4,0,0,false,true,1,10,false,0,0,0,0,0,0,true],[2,45.871,119.0039,0,"skateboard","engine2",66,2,0,0,false,true,1,10,false,0,0,0,0,0,0,true]]}',
    class: Skateboard,
    library: PrefabManager.LIBRARY_ADMIN,
}
