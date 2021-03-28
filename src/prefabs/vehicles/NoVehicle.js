import * as PrefabManager from '../PrefabManager';
import { BaseVehicle } from './BaseVehicle';
import * as Box2D from '../../../libs/Box2D'
import { Humanoid } from '../humanoids/Humanoid'
import {
    game
} from "../../Game";
import { Settings } from '../../Settings';
import * as MobileController from '../../utils/MobileController'


export class NoVehicle extends BaseVehicle {
    constructor(target) {
        super(target);
        this.character;
        this.vehicleName = 'NoVehicle';

		this.character.calculateJointOffsets();
        if(this.prefabObject.settings.limbs){
            for(let key in this.prefabObject.settings.limbs){
                this.positionLimb(key);
            }
        }
    }
    positionLimb(limb){
        let x = this.prefabObject.settings.limbs[limb][0];
        let y = this.prefabObject.settings.limbs[limb][1];
        const l = Math.sqrt(x*x+y*y);
        const a = Math.atan2(y,x);

        // must restore rotation with prefab rotation

        x = l * Math.cos(a + this.prefabObject.rotation*game.editor.DEG2RAD);
        y = l * Math.sin(a + this.prefabObject.rotation*game.editor.DEG2RAD);

        x += this.prefabObject.x / game.editor.PTM;
        y += this.prefabObject.y / game.editor.PTM;

        this.character.positionLimb(limb, x, y);
    }
    set(property, value) {
        switch (property) {
            case "selectJointTarget":
                this.prefabObject.class.jointTarget = value;
                break;
            default:
                super.set(property, value)
            break;
        }
    }
    init() {
        super.init();

        this.patchJoints();

        this.character = game.editor.activePrefabs[this.lookupObject.character.body.mySprite.data.subPrefabInstanceName].class;
        this.character.attachedToVehicle = false;
        MobileController.showCharacterControls();
    }
    patchJoints(){
        const calculateJointDistance = (joint1, joint2, joint3) =>{
            let length = 0;
            length += joint1.Clone().SelfSub(joint2).Length();
            if(joint3){
                length += joint3.Clone().SelfSub(joint2).Length();
            }
            return length;
        }

        [...Object.values(Humanoid.BODY_PARTS)].forEach(bodyPart => {
            const bodyObject = this.lookupObject[bodyPart];
            let jointEdge = bodyObject.GetJointList();
            while (jointEdge) {
                const joint = jointEdge.joint;

                const bodyA = joint.GetBodyA();
                const bodyB = joint.GetBodyB();

                let patchJoint = false;
                let otherBody = null;
                if(bodyA && bodyA.mySprite && !bodyA.mySprite.data.prefabInstanceName){
                    patchJoint = bodyB;
                    otherBody = bodyA;
                }else if(bodyB && bodyB.mySprite && !bodyB.mySprite.data.prefabInstanceName){
                    patchJoint = bodyA;
                    otherBody = bodyB;
                }

                if(patchJoint && bodyPart !== 'body' && joint.GetType() !== Box2D.b2JointType.e_distanceJoint){
                    let refJoint;
                    let maxLength = 0;
                    const bodyToPatch = this.lookupObject['body'];
                    let linkedBodies = [];
                    if([Humanoid.BODY_PARTS.HAND_LEFT, Humanoid.BODY_PARTS.ARM_LEFT, Humanoid.BODY_PARTS.SHOULDER_LEFT].includes(patchJoint.mySprite.data.refName)){
                        refJoint = this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_LEFT+'_joint'];
                        if(patchJoint.mySprite.data.refName === Humanoid.BODY_PARTS.HAND_LEFT){
                            maxLength = calculateJointDistance(this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_LEFT+'_joint'].GetAnchorA(new Box2D.b2Vec2), this.lookupObject[Humanoid.BODY_PARTS.ARM_LEFT+'_joint'].GetAnchorA(new Box2D.b2Vec2), this.lookupObject[Humanoid.BODY_PARTS.HAND_LEFT].GetPosition());
                            linkedBodies = [Humanoid.BODY_PARTS.SHOULDER_LEFT, Humanoid.BODY_PARTS.ARM_LEFT, Humanoid.BODY_PARTS.HAND_LEFT];
                        }else if(patchJoint.mySprite.data.refName === Humanoid.BODY_PARTS.ARM_LEFT){
                            maxLength = calculateJointDistance(this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_LEFT+'_joint'].GetAnchorA(new Box2D.b2Vec2), this.lookupObject[Humanoid.BODY_PARTS.ARM_LEFT].GetPosition());
                            linkedBodies = [Humanoid.BODY_PARTS.SHOULDER_LEFT, Humanoid.BODY_PARTS.ARM_LEFT];
                        }else{
                            linkedBodies = [Humanoid.BODY_PARTS.SHOULDER_LEFT];
                        }
                    } else if([Humanoid.BODY_PARTS.HAND_RIGHT, Humanoid.BODY_PARTS.ARM_RIGHT, Humanoid.BODY_PARTS.SHOULDER_RIGHT].includes(patchJoint.mySprite.data.refName)){
                        refJoint = this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_RIGHT+'_joint'];
                        if(patchJoint.mySprite.data.refName === Humanoid.BODY_PARTS.HAND_RIGHT){
                            maxLength = calculateJointDistance(this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_RIGHT+'_joint'].GetAnchorA(new Box2D.b2Vec2), this.lookupObject[Humanoid.BODY_PARTS.ARM_RIGHT+'_joint'].GetAnchorA(new Box2D.b2Vec2), this.lookupObject[Humanoid.BODY_PARTS.HAND_RIGHT].GetPosition());
                            linkedBodies = [Humanoid.BODY_PARTS.SHOULDER_RIGHT, Humanoid.BODY_PARTS.ARM_RIGHT, Humanoid.BODY_PARTS.HAND_RIGHT];
                        } else if(patchJoint.mySprite.data.refName === Humanoid.BODY_PARTS.ARM_RIGHT){
                            maxLength = calculateJointDistance(this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_RIGHT+'_joint'].GetAnchorA(new Box2D.b2Vec2), this.lookupObject[Humanoid.BODY_PARTS.ARM_RIGHT].GetPosition());
                            linkedBodies = [Humanoid.BODY_PARTS.SHOULDER_RIGHT, Humanoid.BODY_PARTS.ARM_RIGHT];
                        }
                    } else if([Humanoid.BODY_PARTS.FEET_LEFT, Humanoid.BODY_PARTS.LEG_LEFT, Humanoid.BODY_PARTS.THIGH_LEFT].includes(patchJoint.mySprite.data.refName)){
                        refJoint = this.lookupObject[Humanoid.BODY_PARTS.THIGH_LEFT+'_joint'];
                        if(patchJoint.mySprite.data.refName === Humanoid.BODY_PARTS.FEET_LEFT){
                            maxLength = calculateJointDistance(this.lookupObject[Humanoid.BODY_PARTS.THIGH_LEFT+'_joint'].GetAnchorA(new Box2D.b2Vec2), this.lookupObject[Humanoid.BODY_PARTS.LEG_LEFT+'_joint'].GetAnchorA(new Box2D.b2Vec2), this.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT].GetPosition());
                            linkedBodies = [Humanoid.BODY_PARTS.THIGH_LEFT, Humanoid.BODY_PARTS.LEG_LEFT, Humanoid.BODY_PARTS.FEET_LEFT];
                        }else if(patchJoint.mySprite.data.refName === Humanoid.BODY_PARTS.LEG_LEFT){
                            maxLength = calculateJointDistance(this.lookupObject[Humanoid.BODY_PARTS.THIGH_LEFT+'_joint'].GetAnchorA(new Box2D.b2Vec2), this.lookupObject[Humanoid.BODY_PARTS.LEG_LEFT].GetPosition());
                            linkedBodies = [Humanoid.BODY_PARTS.THIGH_LEFT, Humanoid.BODY_PARTS.LEG_LEFT];
                        }else{
                            linkedBodies = [Humanoid.BODY_PARTS.THIGH_LEFT];
                        }
                    } else if([Humanoid.BODY_PARTS.FEET_RIGHT, Humanoid.BODY_PARTS.LEG_RIGHT, Humanoid.BODY_PARTS.THIGH_RIGHT].includes(patchJoint.mySprite.data.refName)){
                        refJoint = this.lookupObject[Humanoid.BODY_PARTS.THIGH_RIGHT+'_joint'];
                        if(patchJoint.mySprite.data.refName === Humanoid.BODY_PARTS.FEET_RIGHT){
                            maxLength = calculateJointDistance(this.lookupObject[Humanoid.BODY_PARTS.THIGH_RIGHT+'_joint'].GetAnchorA(new Box2D.b2Vec2), this.lookupObject[Humanoid.BODY_PARTS.LEG_RIGHT+'_joint'].GetAnchorA(new Box2D.b2Vec2), this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT].GetPosition());
                            linkedBodies = [Humanoid.BODY_PARTS.THIGH_RIGHT, Humanoid.BODY_PARTS.LEG_RIGHT, Humanoid.BODY_PARTS.FEET_RIGHT];
                        }else if(patchJoint.mySprite.data.refName === Humanoid.BODY_PARTS.LEG_RIGHT){
                            maxLength = calculateJointDistance(this.lookupObject[Humanoid.BODY_PARTS.THIGH_RIGHT+'_joint'].GetAnchorA(new Box2D.b2Vec2), this.lookupObject[Humanoid.BODY_PARTS.LEG_RIGHT].GetPosition());
                            linkedBodies = [Humanoid.BODY_PARTS.THIGH_RIGHT, Humanoid.BODY_PARTS.LEG_RIGHT];
                        }else{
                            linkedBodies = [Humanoid.BODY_PARTS.THIGH_RIGHT];
                        }
                    } else if([Humanoid.BODY_PARTS.HEAD].includes(patchJoint.mySprite.data.refName)){
                        refJoint = this.lookupObject['head_joint'];
                    }else if([Humanoid.BODY_PARTS.BELLY].includes(patchJoint.mySprite.data.refName)){
                        refJoint = this.lookupObject['belly_joint'];
                    }

                    if(refJoint){

                        const refJointAnchor = refJoint.GetAnchorA(new Box2D.b2Vec2);

                        let anchorOnBody = null;
                        if(patchJoint === bodyA && joint.GetAnchorA){
                            anchorOnBody = joint.GetAnchorA(new Box2D.b2Vec2);
                        }else if(joint.GetAnchorB){
                            anchorOnBody = joint.GetAnchorB(new Box2D.b2Vec2);
                        }

                        if(anchorOnBody){
                            const ropeJointDef = new Box2D.b2RopeJointDef;

                            let jointAnchor = bodyToPatch.GetPosition();

                            if(bodyToPatch == this.lookupObject['body']) jointAnchor = anchorOnBody;

                            ropeJointDef.Initialize(bodyToPatch, otherBody, refJointAnchor, jointAnchor);
                            const xd = refJointAnchor.x - jointAnchor.x;
                            const yd = refJointAnchor.y - jointAnchor.y;

                            ropeJointDef.maxLength = Math.sqrt(xd * xd + yd * yd);
                            if(bodyToPatch == this.lookupObject['body']){
                                ropeJointDef.maxLength = maxLength ? maxLength : ropeJointDef.maxLength;
                            }
                            const newJoint = game.editor.world.CreateJoint(ropeJointDef);
                            newJoint.connectedJoints = [];

                            linkedBodies.forEach(linkedBodyKey => {
                                const linkedJoint = this.lookupObject[`${linkedBodyKey}_joint`]

                                if(!linkedJoint.linkedJoints) linkedJoint.linkedJoints = [];
                                linkedJoint.linkedJoints.push(newJoint);
                                newJoint.connectedJoints.push(linkedJoint)
                            });
                        }
                    }

                }

                jointEdge = jointEdge.next;
            }
        })
    }
    flip(){
        this.character.flip(true);
    }
    update() {
        super.update();
    }
}

PrefabManager.prefabLibrary.NoVehicle = {
    json: `{"objects":[[0,-0.1309,1.4021,-0.052,".character#Character , .flesh","thigh_left",0,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.0661,3.4011,-0.07,".character#Character , .flesh","leg_left",1,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-4.2072,42.3667,-0.052,"","",2,"Normal_Thigh0000",0,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.1951,4.5661,0.157,".character#Character , .flesh","feet_left",3,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,1.7841,102.0467,-0.07,"","",4,"Normal_Leg0000",1,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,6.5972,135.6635,0.157,"","",5,"Normal_Feet0000",3,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.0011,-1.8169,-0.07,".character#Character , .flesh","shoulder_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.2671,-0.3099,-0.297,".character#Character , .flesh","arm_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,0.6032,-54.455,-0.07,"","",8,"Normal_Shoulder0000",6,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,8.259,-9.1296,-0.297,"","",9,"Normal_Arm0000",7,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.3871,0.5541,-0.14,".character#Character , .flesh","hand_left",10,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true],[1,9.8221,16.4585,-0.14,"","",11,"Normal_Hand0000",10,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.3819,0.2351,-0.262,".character#Character , .flesh","belly",12,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.181],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.1889,-4.1139,-0.262,".character#Character , .flesh","head",13,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.393],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.2609,-1.5599,0.087,".character#Character , .flesh","body",14,["#999999"],["#000"],[0],false,true,[[{"x":-0.537,"y":1.202},{"x":-0.432,"y":-1.37},{"x":-0.15,"y":-1.828},{"x":0.132,"y":-1.793},{"x":0.555,"y":-1.123},{"x":0.555,"y":1.308},{"x":0.097,"y":1.801},{"x":-0.22,"y":1.801}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-10.1434,-1.5948,-0.062,"","",15,"Normal_Belly0000",12,8.747,1.158,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-6.7002,-50.8108,0.087,"","",16,"Normal_Core0000",14,4.169,1.384,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-4.1719,-126.0062,-0.262,"","",17,"Normal_Head_Idle0000",13,2.99,0.785,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.3289,1.4481,0,".character#Character , .flesh","thigh_right",18,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.2609,3.4161,-0.052,".character#Character , .flesh","leg_right",19,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.0024,-4.2882,-0.262,".character#Character","eye_left",20,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-10.1626,43.7318,0,"","",21,"Normal_Thigh0000",18,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-8.0262,102.4932,-0.052,"","",22,"Normal_Leg0000",19,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,0.0977,-129.2075,-0.262,"","",23,"Normal_Eye0000",20,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.0399,4.5701,0.017,".character#Character , .flesh","feet_right",24,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-0.6442,135.6925,0.017,"","",25,"Normal_Feet0000",24,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.1209,-1.6439,-0.087,".character#Character , .flesh","shoulder_right",26,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.0941,-0.1349,-0.175,".character#Character , .flesh","arm_right",27,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.6998,-4.4896,-0.262,".character#Character","eye_right",28,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true],[1,21.0177,-135.2475,-0.262,"","",29,"Normal_Eye0000",28,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,-3.056,-49.2747,-0.087,"","",30,"Normal_Shoulder0000",26,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,3.0468,-3.8508,-0.175,"","",31,"Normal_Arm0000",27,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.0861,0.7591,-0.209,".character#Character , .flesh","hand_right",32,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true],[1,0.785,22.7323,-0.209,"","",33,"Normal_Hand0000",32,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,-1.6414,73.3509,-0.541,".character#Character","leg_left_joint",34,1,0,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,1.6526,129.2899,-0.541,".character#Character","feet_left_joint",35,3,1,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,2.8366,-30.8591,-0.262,".character#Character","arm_left_joint",36,7,6,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,14.6626,8.6279,1.361,".character#Character","hand_left_joint",37,10,7,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-3.7724,14.1999,-0.262,".character#Character","thigh_left_joint",38,0,12,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-1.3534,-77.7601,-0.262,".character#Character","shoulder_left_joint",39,6,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-1.7554,-95.5901,-0.262,".character#Character","head_joint",40,13,14,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,-9.4164,75.3939,-0.262,".character#Character","leg_right_joint",41,19,18,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-6.8774,129.9709,-0.436,".character#Character","feet_right_joint",42,24,19,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,21.0656,-134.2321,-0.262,".character#Character","eye_right_joint",43,28,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-1.0364,-24.9121,-0.262,".character#Character","arm_right_joint",44,27,26,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,5.2466,15.2929,1.536,".character#Character","hand_right_joint",45,32,27,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-5.4764,-71.8781,-0.262,".character#Character","shoulder_right_joint",46,26,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-0.1804,-128.8341,-0.262,".character#Character","eye_left_joint",47,20,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-11.0894,0.9869,-0.262,".character#Character","belly_joint",48,14,12,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-10.3294,15.5049,-0.262,".character#Character","thigh_right_joint",49,18,12,0,false,false,1,10,true,142,-16,0,0,0,0,false]]}`,
    class: NoVehicle,
    library: PrefabManager.LIBRARY_ADMIN,
}


export const stopCustomBehaviour = () => {
    game.editor.customPrefabMouseDown = null;
    game.editor.customPrefabMouseMove = null;
    game.editor.customDebugDraw = null;
}
export const setPositionLimb = (prefab, limb) => {
    let x = game.editor.mousePosWorld.x - prefab.x / game.editor.PTM;
    let y = game.editor.mousePosWorld.y - prefab.y / game.editor.PTM;
    const l = Math.sqrt(x*x+y*y);
    const a = Math.atan2(y,x);

    // rotate arround prefabRotation

    x = l * Math.cos(a-prefab.rotation*game.editor.DEG2RAD);
    y = l * Math.sin(a-prefab.rotation*game.editor.DEG2RAD);

    if(!prefab.settings.limbs) prefab.settings.limbs = {};
    prefab.settings.limbs[limb] = [x, y];
    prefab.class.positionLimb(limb);
}
export const startPositioningLimb = (prefab, limb) =>{
    game.editor.customPrefabMouseDown = ()=>{
        setPositionLimb(prefab, limb);
        stopCustomBehaviour();
    }
    game.editor.customPrefabMouseMove = ()=>{
        setPositionLimb(prefab, limb);
    }
    setPositionLimb(prefab, limb);
    game.editor.customDebugDraw = null;
}

// Joint behaviour

export const tryAndAddJoint = prefab => {
    if(prefab.class.jointTarget && prefab.class.jointTargetConnection){

        const editor = game.editor;

        const jointObject = new editor.jointObject;


        const jointTargetBody = prefab.class.lookupObject[prefab.class.jointTarget];


        jointObject.bodyA_ID = jointTargetBody.mySprite.parent.getChildIndex(jointTargetBody.mySprite);
        jointObject.bodyB_ID = prefab.class.jointTargetConnection.mySprite.parent.getChildIndex(prefab.class.jointTargetConnection.mySprite);

        jointObject.jointType = editor.jointObject_TYPE_PIN;
        jointObject.x = jointTargetBody.mySprite.x;
        jointObject.y = jointTargetBody.mySprite.y;

        editor.attachJointPlaceHolder(jointObject);

        stopCustomBehaviour();
    }
}

export const drawJointAdding = prefab => {

    const bodyObject = prefab.class.lookupObject[prefab.class.jointTarget];
    const sprite = bodyObject.mySprite ? bodyObject.mySprite : bodyObject;

    const editor = game.editor;

    let tarSprite = editor.getPIXIPointFromWorldPoint(editor.mousePosWorld);
    editor.debugGraphics.lineStyle(1, editor.jointLineColor, 1);

    const worldQuery = editor.queryWorldForBodies(editor.mousePosWorld, editor.mousePosWorld);
    prefab.class.jointTargetConnection = null;
    worldQuery.forEach(body => {
        const bodyClass = game.editor.retrieveClassFromBody(body);
        if(body.mySprite && (!bodyClass || !bodyClass.isVehicle)){
            tarSprite = body.mySprite;
            prefab.class.jointTargetConnection = body;
            editor.debugGraphics.lineStyle(1, "0xFFFF00", 1);
        }
    });

    editor.debugGraphics.moveTo(sprite.x * editor.cameraHolder.scale.x + editor.cameraHolder.x, sprite.y * editor.cameraHolder.scale.y + editor.cameraHolder.y);
    editor.debugGraphics.lineTo(tarSprite.x * editor.cameraHolder.scale.x + editor.cameraHolder.x, tarSprite.y * editor.cameraHolder.scale.y + editor.cameraHolder.y);

}

export const startAddingJoint = prefab => {
    if(!prefab.class.jointTarget) prefab.class.jointTarget = 'body';
    game.editor.customPrefabMouseDown = ()=>{
        tryAndAddJoint(prefab);
    }
    game.editor.customDebugDraw = ()=>{
        drawJointAdding(prefab);
    }
    game.editor.customPrefabMouseMove = null;
}


NoVehicle.settings = Object.assign({}, BaseVehicle.settings, {
    "positionLeftArm": prefab=>startPositioningLimb(prefab, Humanoid.BODY_PARTS.ARM_LEFT),
    "positionRightArm": prefab=>startPositioningLimb(prefab, Humanoid.BODY_PARTS.ARM_RIGHT),
    "positionLeftLeg": prefab=>startPositioningLimb(prefab, Humanoid.BODY_PARTS.LEG_LEFT),
    "positionRightLeg": prefab=>startPositioningLimb(prefab, Humanoid.BODY_PARTS.LEG_RIGHT),
    "positionHead": prefab=>startPositioningLimb(prefab, Humanoid.BODY_PARTS.HEAD),
    "selectJointTarget": "body",
    "addJoint": prefab=>startAddingJoint(prefab),
});
NoVehicle.settingsOptions = Object.assign({}, BaseVehicle.settingsOptions, {
    "positionLeftArm": '$function',
    "positionRightArm": '$function',
    "positionLeftLeg": '$function',
    "positionRightLeg": '$function',
    "positionHead": '$function',
    "selectJointTarget": [...Object.values(Humanoid.BODY_PARTS)],
    "addJoint": '$function',
});
