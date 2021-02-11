import * as Box2D from "../../../libs/Box2D"
import * as PrefabManager from '../PrefabManager';
import { BaseVehicle } from './BaseVehicle';

import {Humanoid} from '../humanoids/Humanoid';
import { SkateHelmet } from '../hats/skateHelmet'


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
        this.limbsObserver = [Humanoid.BODY_PARTS.BELLY, Humanoid.BODY_PARTS.FEET_RIGHT, Humanoid.BODY_PARTS.FEET_LEFT, Humanoid.BODY_PARTS.LEG_RIGHT, Humanoid.BODY_PARTS.LEG_LEFT, Humanoid.BODY_PARTS.THIGH_RIGHT, Humanoid.BODY_PARTS.THIGH_LEFT]
    }
    init() {
		super.init();
		this.inverseEngines = true;
        this.desiredVehicleTorques = [200, 200];
        this.desiredVehicleSpeeds = [120, 120];
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
        if(this.character.alive){
            if(this.accel != 0){
                this.legAnimation.update(game.editor.deltaTime*this.accel);
                const frame = this.legAnimation.getFrame();

                globalFrame = this.lookupObject.body.GetWorldPoint(frame, new Box2D.b2Vec2())
                // DEBUG DRAW EXAMPLE
                // game.editor.debugGraphics.clear();
                // const pixiPoint = game.editor.getPIXIPointFromWorldPoint(globalFrame);
                // game.levelCamera.matrix.apply(pixiPoint,pixiPoint);
                // drawCircle(pixiPoint, 3);

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
    json: '{"objects":[[0,0.005,3.443,0,"skateboard","frame",0,["#999999"],["#000"],[0],false,true,[[{"x":2.278,"y":-0.177},{"x":2.278,"y":0.177},{"x":-2.278,"y":0.177},{"x":-2.278,"y":-0.177}]],[8],0,[0],"",[1],true,false,false,[0],[0.2]],[1,0.249,107.459,0,"","",1,"SkateBoard_Board0000",0,4.17,-1.546,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,1.541,3.968,0,"skateboard","wheel_front",2,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[20],7,[9.707],"",[1],true,false,false,[0.3],[0.2]],[1,46.629,119.203,0,"","",3,"Skateboard_Wheel0000",2,0.435,-0.384,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.518,3.972,0,"skateboard","wheel_back",4,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[20],0,[9.707],"",[1],true,false,false,[0.3],[0.2]],[1,-45.141,119.323,0,"","",5,"Skateboard_Wheel0000",4,0.435,-0.384,0,false,"#FFFFFF",1,1,1,0,0,0,true],[2,46.31,119.116,0,"skateboard","engine2",6,0,2,0,false,true,1,10,false,0,0,0,0,0,0,true],[0,-0.083,0.792,-0.401,".character#Character , .flesh","thigh_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],7,[null],"",[1],true,false,false,[0.5],[0.2]],[0,-0.309,2.362,0.768,".character#Character , .flesh","leg_left",8,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],7,[null],"",[1],true,false,false,[0.5],[0.2]],[1,-2.643,24.141,-0.401,"","",9,"Normal_Thigh0000",7,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,-45.546,119.354,0,"skateboard","engine1",10,0,4,0,false,true,1,10,false,0,0,0,0,0,0,true],[0,-0.775,3.22,0.035,".character#Character , .flesh","feet_left",11,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],7,[null],"",[1],true,false,false,[0.5],[0.2]],[1,-9.407,70.722,0.768,"","",12,"Normal_Leg0000",8,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,9.167,52.377,-0.035,".character#Character","leg_left_joint",13,8,7,0,false,false,1,10,true,0,-149,0,0,0,0,false],[1,-22.665,95.2,0.035,"","",14,"Normal_Feet0000",11,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,-30.716,88.35,-0.279,".character#Character","feet_left_joint",15,11,8,0,false,false,1,10,true,0,0,0,0,0,0,false],[0,0.269,-2.308,0.052,".character#Character , .flesh","shoulder_left",16,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],7,[null],"",[1],true,false,false,[0.5],[0.2]],[0,0.35,-0.78,-0.175,".character#Character , .flesh","arm_left",17,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],7,[null],"",[1],true,false,false,[0.5],[0.2]],[1,8.636,-69.119,0.052,"","",18,"Normal_Shoulder0000",16,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,10.73,-23.204,-0.175,"","",19,"Normal_Arm0000",17,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,8.023,-45.399,-0.14,".character#Character","arm_left_joint",20,17,16,0,false,false,1,10,true,152,0,0,0,0,0,false],[0,0.363,0.092,-0.018,".character#Character , .flesh","hand_left",21,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],7,[7.513],"",[1],true,false,false,[0.5],[0.2]],[1,9.139,2.379,-0.018,"","",22,"Normal_Hand0000",21,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,14.949,-4.765,1.483,".character#Character","hand_left_joint",23,21,17,0,false,false,1,10,true,60,-60,0,0,0,0,false],[0,-0.361,-0.318,-0.14,".character#Character , .flesh","belly",24,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],7,[14.181],"",[1],true,false,false,[0.5],[0.2]],[0,0.36,-4.611,-0.14,".character#Character , .flesh","head",25,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],7,[30.393],"",[1],true,false,false,[0.5],[0.2]],[0,-0.022,-2.085,0.209,".character#Character , .flesh","body",26,["#999999"],["#000"],[0],false,true,[[{"x":-0.537,"y":1.202},{"x":-0.432,"y":-1.37},{"x":-0.15,"y":-1.828},{"x":0.132,"y":-1.793},{"x":0.555,"y":-1.123},{"x":0.555,"y":1.308},{"x":0.097,"y":1.801},{"x":-0.22,"y":1.801}]],[1],7,[null],"",[1],true,false,false,[0.5],[0.2]],[1,-8.467,-17.964,0.06,"","",27,"Normal_Belly0000",24,8.747,1.158,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[2,-5.317,-1.347,-0.262,".character#Character","thigh_left_joint",28,7,24,0,false,false,1,10,true,142,-16,0,0,0,0,false],[1,0.953,-66.397,0.209,"","",29,"Normal_Core0000",26,4.169,1.384,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,9.58,-92.461,-0.14,".character#Character","shoulder_left_joint",30,16,26,0,false,false,1,10,true,180,-19,0,0,0,0,false],[1,12.605,-140.718,-0.14,"","",31,"Normal_Head_Idle0000",25,2.99,0.785,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,11.354,-110.207,-0.14,".character#Character","head_joint",32,25,26,0,false,false,1,10,true,58,-64,0,0,0,0,false],[0,0.13,0.679,-0.663,".character#Character , .flesh","thigh_right",33,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],7,[null],"",[1],true,false,false,[0.5],[0.2]],[0,0.399,2.25,0.437,".character#Character , .flesh","leg_right",34,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],7,[null],"",[1],true,false,false,[0.5],[0.2]],[0,0.534,-4.732,-0.14,".character#Character","eye_left",35,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],7,[7.534],"",[1],true,false,false,[0.5],[0.2]],[1,3.851,20.779,-0.663,"","",36,"Normal_Thigh0000",33,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,11.796,67.416,0.437,"","",37,"Normal_Leg0000",34,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,16.119,-142.513,-0.14,"","",38,"Normal_Eye0000",35,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[2,23.309,42.882,0.227,".character#Character","leg_right_joint",39,34,33,0,false,false,1,10,true,-10,-149,0,0,0,0,false],[0,0.269,3.236,0.034,".character#Character , .flesh","feet_right",40,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],7,[null],"",[1],true,false,false,[0.5],[0.2]],[1,8.653,95.679,0.034,"","",41,"Normal_Feet0000",40,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,1.674,89.083,-0.296,".character#Character","feet_right_joint",42,40,34,0,false,false,1,10,true,0,0,0,0,0,0,false],[0,0.127,-2.151,0.035,".character#Character , .flesh","shoulder_right",43,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],7,[null],"",[1],true,false,false,[0.5],[0.2]],[0,0.156,-0.627,-0.053,".character#Character , .flesh","arm_right",44,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],7,[null],"",[1],true,false,false,[0.5],[0.2]],[0,1.214,-4.817,-0.14,".character#Character","eye_right",45,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],7,[7.534],"",[1],true,false,false,[0.5],[0.2]],[1,36.519,-145.063,-0.14,"","",46,"Normal_Eye0000",45,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[2,36.486,-144.038,-0.14,".character#Character","eye_right_joint",47,45,25,0,false,false,1,10,true,0,0,0,0,0,0,false],[1,4.378,-64.418,0.035,"","",48,"Normal_Shoulder0000",43,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,4.885,-18.588,-0.053,"","",49,"Normal_Arm0000",44,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,3.454,-39.968,-0.14,".character#Character","arm_right_joint",50,44,43,0,false,false,1,10,true,152,0,0,0,0,0,false],[0,0.04,0.259,-0.087,".character#Character , .flesh","hand_right",51,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],7,[7.513],"",[1],true,false,false,[0.5],[0.2]],[1,-0.573,7.511,-0.087,"","",52,"Normal_Hand0000",51,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,4.791,0.703,1.658,".character#Character","hand_right_joint",53,51,44,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,4.771,-87.125,-0.14,".character#Character","shoulder_right_joint",54,43,26,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,15.855,-142.14,-0.14,".character#Character","eye_left_joint",55,35,25,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-9.68,-15.487,-0.14,".character#Character","belly_joint",56,26,24,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-11.874,-0.042,-0.262,".character#Character","thigh_right_joint",57,33,24,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-32.881,98.178,0,".character#Character","foot_left_d1",58,0,11,2,false,false,1,10,false,0,0,0.3,10,0,0,true],[2,-54.39,34.194,0,".character#Character","back_stand_joint",59,26,0,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,50.079,31.826,0,".character#Character","front_stand_joint",60,26,0,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[0,0.363,-0.553,0,"skateboard","stabalizer",61,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[0.6],2,[34.639],"",[1],true,false,false,[0.5],[0.2]],[2,10.334,-16.58,0,"skateboard","stabalizer_joint",62,61,0,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-108.256,-100.177,0,".character#Character","back_stabalize_joint",63,26,61,2,false,false,1,10,false,0,0,0.3,3,0,0,true],[2,-88.13,-151.676,0,".character#Character","neck_stabalize_joint",64,25,61,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,-15.429,98.897,0,".character#Character","foot_left_d2",65,0,11,2,false,false,1,10,false,0,0,0.3,10,0,0,true],[2,-25.796,95.885,0,".character#Character","foot_left_rope",66,11,4,3,false,false,1,10,false,0,0,0,0,0,0,true]]}',
    class: Skateboard,
    library: PrefabManager.LIBRARY_ADMIN,
}
