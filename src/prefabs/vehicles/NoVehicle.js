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
    json: Humanoid.JSON_ADULT,
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
