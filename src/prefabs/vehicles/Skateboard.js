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
                    AudioManager.playSFX ('skateboard_pedle', idleVolume, 1.0 + (Math.random()*pitchOffset - pitchOffset/2))
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

        AudioManager.playPrefabUniqueLoopSFX(this.prefabObject.key, 'skateboard_idle_loop', idleVolume, Math.max(0.8, wheelRotationSpeed * 0.5));

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
    json: '{"objects":[[0,0.0091,3.4471,0,"skateboard","frame",0,["#999999"],["#000"],[0],false,true,[[{"x":2.278,"y":-0.177},{"x":2.278,"y":0.177},{"x":-2.278,"y":0.177},{"x":-2.278,"y":-0.177}]],[8],[7],[0],"",[1],true,false,false,[0],[0.2]],[1,0.3776,107.582,0,"","",1,"SkateBoard_Board0000",0,4.17,-1.546,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,1.5476,3.9681,0,"skateboard","wheel_front",2,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[20],[7],[9.707],"",[1],true,false,false,[0.3],[0.2]],[1,46.8306,119.2066,0,"","",3,"Skateboard_Wheel0000",2,0.435,-0.384,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.5179,3.9721,0,"skateboard","wheel_back",4,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[20],[7],[9.707],"",[1],true,false,false,[0.3],[0.2]],[1,-45.1322,119.3266,0,"","",5,"Skateboard_Wheel0000",4,0.435,-0.384,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.0829,0.7921,-0.401,".character#Character , .flesh","thigh_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2]],[0,-0.3089,2.3621,0.768,".character#Character , .flesh","leg_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2]],[1,-2.6445,24.1448,-0.401,"","",8,"Normal_Thigh0000",6,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.7749,3.2201,0.035,".character#Character , .flesh","feet_left",9,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2]],[1,-9.4086,70.7253,0.768,"","",10,"Normal_Leg0000",7,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,9.1715,52.3806,-0.035,".character#Character","leg_left_joint",11,7,6,0,false,false,1,10,true,0,-149,0,0,0,0,false],[1,-22.667,95.2034,0.035,"","",12,"Normal_Feet0000",9,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,-30.7115,88.3536,-0.279,".character#Character","feet_left_joint",13,9,7,0,false,false,1,10,true,0,0,0,0,0,0,false],[0,0.2691,-2.3079,0.052,".character#Character , .flesh","shoulder_left",14,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2]],[0,0.3501,-0.7799,-0.175,".character#Character , .flesh","arm_left",15,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2]],[1,8.6346,-69.1153,0.052,"","",16,"Normal_Shoulder0000",14,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,10.7287,-23.2001,-0.175,"","",17,"Normal_Arm0000",15,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,8.0275,-45.3954,-0.14,".character#Character","arm_left_joint",18,15,14,0,false,false,1,10,true,152,0,0,0,0,0,false],[0,0.3631,0.0921,-0.018,".character#Character , .flesh","hand_left",19,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2]],[1,9.1374,2.3825,-0.018,"","",20,"Normal_Hand0000",19,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,14.9535,-4.7614,1.483,".character#Character","hand_left_joint",21,19,15,0,false,false,1,10,true,60,-60,0,0,0,0,false],[0,-0.3609,-0.3179,-0.14,".character#Character , .flesh","belly",22,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.181],"",[1],true,false,false,[0.5],[0.2]],[0,0.3601,-4.6109,-0.14,".character#Character , .flesh","head",23,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.393],"",[1],true,false,false,[0.5],[0.2]],[0,-0.0219,-2.0849,0.209,".character#Character , .flesh","body",24,["#999999"],["#000"],[0],false,true,[[{"x":-0.537,"y":1.202},{"x":-0.432,"y":-1.37},{"x":-0.15,"y":-1.828},{"x":0.132,"y":-1.793},{"x":0.555,"y":-1.123},{"x":0.555,"y":1.308},{"x":0.097,"y":1.801},{"x":-0.22,"y":1.801}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2]],[1,-8.4688,-17.9599,0.06,"","",25,"Normal_Belly0000",22,8.747,1.158,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[2,-5.3125,-1.3434,-0.262,".character#Character","thigh_left_joint",26,6,22,0,false,false,1,10,true,142,-16,0,0,0,0,false],[1,0.9518,-66.3931,0.209,"","",27,"Normal_Core0000",24,4.169,1.384,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,9.5845,-92.4574,-0.14,".character#Character","shoulder_left_joint",28,14,24,0,false,false,1,10,true,180,-19,0,0,0,0,false],[1,12.604,-140.7143,-0.14,"","",29,"Normal_Head_Idle0000",23,2.99,0.785,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,11.3585,-110.2034,-0.14,".character#Character","head_joint",30,23,24,0,false,false,1,10,true,58,-64,0,0,0,0,false],[0,0.1301,0.6791,-0.663,".character#Character , .flesh","thigh_right",31,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2]],[0,0.3991,2.2501,0.437,".character#Character , .flesh","leg_right",32,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2]],[0,0.5341,-4.7319,-0.14,".character#Character","eye_left",33,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2]],[1,3.8496,20.7829,-0.663,"","",34,"Normal_Thigh0000",31,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,11.7942,67.4193,0.437,"","",35,"Normal_Leg0000",32,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,16.1176,-142.5096,-0.14,"","",36,"Normal_Eye0000",33,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[2,23.3135,42.8856,0.227,".character#Character","leg_right_joint",37,32,31,0,false,false,1,10,true,-10,-149,0,0,0,0,false],[0,0.2691,3.2361,0.034,".character#Character , .flesh","feet_right",38,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2]],[1,8.6516,95.6828,0.034,"","",39,"Normal_Feet0000",38,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,1.6785,89.0866,-0.296,".character#Character","feet_right_joint",40,38,32,0,false,false,1,10,true,0,0,0,0,0,0,false],[0,0.1271,-2.1509,0.035,".character#Character , .flesh","shoulder_right",41,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2]],[0,0.1561,-0.6269,-0.053,".character#Character , .flesh","arm_right",42,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2]],[0,1.2141,-4.8169,-0.14,".character#Character","eye_right",43,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2]],[1,36.5176,-145.0596,-0.14,"","",44,"Normal_Eye0000",43,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[2,36.4905,-144.0344,-0.14,".character#Character","eye_right_joint",45,43,23,0,false,false,1,10,true,0,0,0,0,0,0,false],[1,4.3765,-64.4148,0.035,"","",46,"Normal_Shoulder0000",41,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,4.8832,-18.5843,-0.053,"","",47,"Normal_Arm0000",42,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,3.4585,-39.9644,-0.14,".character#Character","arm_right_joint",48,42,41,0,false,false,1,10,true,152,0,0,0,0,0,false],[0,0.0401,0.2591,-0.087,".character#Character , .flesh","hand_right",49,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2]],[1,-0.5747,7.5145,-0.087,"","",50,"Normal_Hand0000",49,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,4.7955,0.7066,1.658,".character#Character","hand_right_joint",51,49,42,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,4.7755,-87.1214,-0.14,".character#Character","shoulder_right_joint",52,41,24,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,15.8595,-142.1364,-0.14,".character#Character","eye_left_joint",53,33,23,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-9.6755,-15.4834,-0.14,".character#Character","belly_joint",54,24,22,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-11.8695,-0.0384,-0.262,".character#Character","thigh_right_joint",55,31,22,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-32.8765,98.1816,0,".character#Character","foot_left_d1",56,0,9,2,false,false,1,10,false,0,0,0.3,10,0,0,true],[2,-54.3855,34.1976,0,".character#Character","back_stand_joint",57,24,0,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,50.0835,31.8296,0,".character#Character","front_stand_joint",58,24,0,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[0,0.3631,-0.5529,0,"skateboard","stabalizer",59,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[0.6],[2],[34.639],"",[1],true,false,false,[0.5],[0.2]],[2,10.3385,-16.5764,0,"skateboard","stabalizer_joint",60,59,0,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-108.2515,-100.1734,0,".character#Character","back_stabalize_joint",61,24,59,2,false,false,1,10,false,0,0,0.3,3,0,0,true],[2,-88.1255,-151.6724,0,".character#Character","neck_stabalize_joint",62,23,59,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,-15.4245,98.9006,0,".character#Character","foot_left_d2",63,0,9,2,false,false,1,10,false,0,0,0.3,10,0,0,true],[2,-25.7915,95.8886,0,".character#Character","foot_left_rope",64,9,4,3,false,false,1,10,false,0,0,0,0,0,0,true],[2,-45.9955,119.0036,0,"skateboard","engine1",65,4,0,0,false,true,1,10,false,0,0,0,0,0,0,true],[2,46.0045,119.0036,0,"skateboard","engine2",66,2,0,0,false,true,1,10,false,0,0,0,0,0,0,true]]}',
    class: Skateboard,
    library: PrefabManager.LIBRARY_ADMIN,
}
