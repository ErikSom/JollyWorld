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
    json: `{"objects":[[0,0.493,-0.16,-0.052,".character#Character , .flesh","thigh_left",0,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],7,[null],"",[1],true,false],[0,0.69,1.839,-0.07,".character#Character , .flesh","leg_left",1,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],7,[null],"",[1],true,false],[1,14.51,-4.496,-0.052,"","",2,"Normal_Thigh0000",0,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.819,3.004,0.157,".character#Character , .flesh","feet_left",3,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],7,[null],"",[1],true,false],[1,20.501,55.184,-0.07,"","",4,"Normal_Leg0000",1,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,17.076,26.488,-0.541,".character#Character","leg_left_joint",5,1,0,0,false,false,1,10,true,0,-149,0,0,0,0],[1,25.315,88.801,0.157,"","",6,"Normal_Feet0000",3,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,20.37,82.427,-0.541,".character#Character","feet_left_joint",7,3,1,0,false,false,1,10,true,0,0,0,0,0,0],[0,0.625,-3.379,-0.07,".character#Character , .flesh","shoulder_left",8,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],7,[null],"",[1],true,false],[0,0.891,-1.872,-0.297,".character#Character , .flesh","arm_left",9,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],7,[null],"",[1],true,false],[1,19.321,-101.318,-0.07,"","",10,"Normal_Shoulder0000",8,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,26.976,-55.992,-0.297,"","",11,"Normal_Arm0000",9,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,21.554,-77.722,-0.262,".character#Character","arm_left_joint",12,9,8,0,false,false,1,10,true,152,0,0,0,0,0],[0,1.011,-1.008,-0.14,".character#Character , .flesh","hand_left",13,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],7,[7.513],"",[1],true,false],[1,28.54,-30.404,-0.14,"","",14,"Normal_Hand0000",13,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,33.38,-38.235,1.361,".character#Character","hand_left_joint",15,13,9,0,false,false,1,10,true,60,-60,0,0,0,0],[0,0.242,-1.327,-0.262,".character#Character , .flesh","belly",16,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],7,[14.181],"",[1],true,false],[0,0.435,-5.676,-0.262,".character#Character , .flesh","head",17,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],7,[30.393],"",[1],true,false],[0,0.363,-3.122,0.087,".character#Character , .flesh","body",18,["#999999"],["#000"],[0],false,true,[[{"x":-0.537,"y":1.202},{"x":-0.432,"y":-1.37},{"x":-0.15,"y":-1.828},{"x":0.132,"y":-1.793},{"x":0.555,"y":-1.123},{"x":0.555,"y":1.308},{"x":0.097,"y":1.801},{"x":-0.22,"y":1.801}]],[1],7,[null],"",[1],true,false],[1,8.574,-48.458,-0.062,"","",19,"Normal_Belly0000",16,8.747,1.158,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[2,14.945,-32.663,-0.262,".character#Character","thigh_left_joint",20,0,16,0,false,false,1,10,true,142,-16,0,0,0,0],[1,12.017,-97.674,0.087,"","",21,"Normal_Core0000",18,4.169,1.384,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,17.364,-124.623,-0.262,".character#Character","shoulder_left_joint",22,8,18,0,false,false,1,10,true,180,-19,0,0,0,0],[1,14.546,-172.869,-0.262,"","",23,"Normal_Head_Idle0000",17,2.99,0.785,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,16.962,-142.453,-0.262,".character#Character","head_joint",24,17,18,0,false,false,1,10,true,58,-64,0,0,0,0],[0,0.295,-0.114,0,".character#Character , .flesh","thigh_right",25,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],7,[null],"",[1],true,false],[0,0.363,1.854,-0.052,".character#Character , .flesh","leg_right",26,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],7,[null],"",[1],true,false],[0,0.593,-5.817,-0.262,".character#Character","eye_left",27,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],7,[7.534],"",[1],true,false],[1,8.555,-3.131,0,"","",28,"Normal_Thigh0000",25,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,10.691,55.63,-0.052,"","",29,"Normal_Leg0000",26,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,17.815,-175.07,-0.262,"","",30,"Normal_Eye0000",27,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[2,9.301,28.531,-0.262,".character#Character","leg_right_joint",31,26,25,0,false,false,1,10,true,0,-149,0,0,0,0],[0,0.584,3.008,0.017,".character#Character , .flesh","feet_right",32,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],7,[null],"",[1],true,false],[1,18.073,88.83,0.017,"","",33,"Normal_Feet0000",32,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,11.84,83.108,-0.436,".character#Character","feet_right_joint",34,32,26,0,false,false,1,10,true,0,0,0,0,0,0],[0,0.503,-3.206,-0.087,".character#Character , .flesh","shoulder_right",35,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],7,[null],"",[1],true,false],[0,0.718,-1.697,-0.175,".character#Character , .flesh","arm_right",36,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],7,[null],"",[1],true,false],[0,1.257,-5.985,-0.262,".character#Character","eye_right",37,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],7,[7.534],"",[1],true,false],[1,37.735,-180.11,-0.262,"","",38,"Normal_Eye0000",37,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[2,37.783,-179.095,-0.262,".character#Character","eye_right_joint",39,37,17,0,false,false,1,10,true,0,0,0,0,0,0],[1,15.661,-96.138,-0.087,"","",40,"Normal_Shoulder0000",35,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,21.764,-50.714,-0.175,"","",41,"Normal_Arm0000",36,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,17.681,-71.775,-0.262,".character#Character","arm_right_joint",42,36,35,0,false,false,1,10,true,152,0,0,0,0,0],[0,0.71,-0.803,-0.209,".character#Character , .flesh","hand_right",43,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],7,[7.513],"",[1],true,false],[1,19.502,-24.131,-0.209,"","",44,"Normal_Hand0000",43,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,23.964,-31.57,1.536,".character#Character","hand_right_joint",45,43,36,0,false,false,1,10,true,60,-60,0,0,0,0],[2,13.241,-118.741,-0.262,".character#Character","shoulder_right_joint",46,35,18,0,false,false,1,10,true,180,-19,0,0,0,0],[2,17.537,-174.697,-0.262,".character#Character","eye_left_joint",47,27,17,0,false,false,1,10,true,0,0,0,0,0,0],[2,7.628,-45.876,-0.262,".character#Character","belly_joint",48,18,16,0,false,false,1,10,true,10,-10,0,0,0,0],[2,8.388,-31.358,-0.262,".character#Character","thigh_right_joint",49,25,16,0,false,false,1,10,true,142,-16,0,0,0,0]]}`,
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
