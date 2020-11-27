import {
    B2dEditor
} from "../B2dEditor";
import * as ui from "../utils/ui";
import * as Box2D from "../../../libs/Box2D";
import {
    Settings
} from "../../Settings";
import {
    Key
} from "../../../libs/Key";
import {
    game
} from "../../Game";
import { editorSettings } from "../utils/editorSettings";

export const getActionsForObject = function (object) {
    var actions = [];
    if (object.data.prefabInstanceName != undefined) {
        actions.push("Impulse") //, "SetAwake");
        const prefab = B2dEditor.activePrefabs[object.data.prefabInstanceName];
        if(prefab.class.isExplosive){
            actions.push("SetActive");
            actions.push("Explode");
        }
        if(prefab.class.isCrossBow){
            actions.push("Shoot");
        }
    } else {
        switch (object.data.type) {
            case B2dEditor.object_BODY:
                actions.push("Impulse") //, "SetAwake");
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
            default:
                break;
        }
    }
    if (object.data.type != B2dEditor.object_JOINT) {
        actions.push("SetPosition", "SetRotation")
    }
    actions.push("Destroy");
    return actions;
}
export const getAction = function (action) {
    return JSON.parse(JSON.stringify(actionDictionary[`actionObject_${action}`]));
}
export const getActionOptions = function (action) {
    return actionDictionary[`actionOptions_${action}`];
}
export const doAction = function (actionData, target) {

    let bodies;
    const prefab = target.data ? B2dEditor.activePrefabs[target.data.prefabInstanceName] : undefined;

    switch (actionData.type) {
        case "Impulse":
                if (target.data.prefabInstanceName) {
                    bodies = B2dEditor.lookupGroups[target.data.prefabInstanceName]._bodies;
                } else bodies = [target.myBody];
                bodies.map(body => {
                    const a = (actionData.direction * 360) * B2dEditor.DEG2RAD;
                    const impulse = new Box2D.b2Vec2(actionData.impulseForce * Math.cos(a), actionData.impulseForce * Math.sin(a))
                    body.ApplyLinearImpulse(impulse, body.GetPosition(), true)
                    body.ApplyTorque(actionData.rotationForce, true)
                });
            break;
        case "SetPosition":
                var objects;
                var targetPos;

                if (target.data.prefabInstanceName) {
                    objects = [].concat(B2dEditor.lookupGroups[target.data.prefabInstanceName]._bodies, B2dEditor.lookupGroups[target.data.prefabInstanceName]._textures);
                    targetPos = new Box2D.b2Vec2(target.x, target.y);
                } else if (target.myBody) {
                    objects = [target.myBody];
                    targetPos = new Box2D.b2Vec2(target.myBody.GetPosition().x * Settings.PTM, target.myBody.GetPosition().y * Settings.PTM);
                } else {
                    objects = [target];
                    targetPos = new Box2D.b2Vec2(target.x, target.y);
                }

                if (actionData.setAdd == "fixed") targetPos = new Box2D.b2Vec2(actionData.X - targetPos.x, actionData.Y - targetPos.y);
                else targetPos = new Box2D.b2Vec2(actionData.X, actionData.Y);

                B2dEditor.applyToObjects(B2dEditor.TRANSFORM_MOVE, targetPos, objects);
            break;
        case "SetRotation":
                let objects;
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
        case "MotorEnabled":
            target.EnableMotor(actionData.enabled);
            break;
        case "LimitEnabled":
            target.EnableLimit(actionData.enabled);
            break;
        case "SetAngleLimits":
            target.SetLimits(actionData.lowerAngle, actionData.upperAngle);
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
            if (actionData.setAdd == "fixed") targetMotorForce = actionData.force;
            else if (actionData.setAdd == "add") targetMotorForce = target.GetMaxMotorForce() + actionData.force;
            targetMotorForce = Math.min(Settings.motorForceLimit, Math.max(0, targetMotorForce));
            target.SetMaxMotorForce(targetMotorForce);
            break;
        case "SetSpring":
            target.SetFrequency(actionData.frequencyHz);
            target.SetDampingRatio(actionData.dampingRatio);
            break;
        case "Destroy":
            const toDestroy = target.myBody || target;
            B2dEditor.deleteObjects([toDestroy]);
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

    }
}
export const guitype_MINMAX = 0;
export const guitype_LIST = 1;
export const guitype_BOOL = 2;

export const actionDictionary = {
    //*** IMPULSE ***/
    actionObject_Impulse: {
        type: "Impulse",
        impulseForce: 0,
        direction: 0,
        rotationForce: 0,
    },
    actionOptions_Impulse: {
        impulseForce: {
            type: guitype_MINMAX,
            min: -1000,
            max: 1000,
            value: 0,
            step: 1,
        },
        direction: {
            type: guitype_MINMAX,
            min: 0,
            max: 360,
            value: 0,
            step: 0.1,
        },
        rotationForce: {
            type: guitype_MINMAX,
            min: -1000,
            max: 1000,
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
}
export const addTriggerGUI = function (dataJoint, _folder) {
    var targetTypes = Object.keys(triggerTargetType);
    
    targetTypes.map(key => {
        if (triggerTargetType[key] == dataJoint.targetType) {
            ui.editorGUI.editData.targetTypeDropDown = key;
        }
    })
    _folder.add(ui.editorGUI.editData, "targetTypeDropDown", targetTypes).onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    });
    if(![triggerTargetType.click].includes(dataJoint.targetType)){
        var repeatTypes = Object.keys(triggerRepeatType);
        repeatTypes.map(key => {
            if (triggerRepeatType[key] == dataJoint.repeatType) {
                ui.editorGUI.editData.repeatTypeDropDown = key;
            }
        })
        _folder.add(ui.editorGUI.editData, "repeatTypeDropDown", repeatTypes).onChange(function (value) {
            this.humanUpdate = true;
            this.targetValue = value
        });
    }
    ui.editorGUI.editData.selectTarget = function () {};
    var label = "Add Target";
    controller = _folder.add(ui.editorGUI.editData, "selectTarget").name(label);
    ui.editorGUI.editData.selectTarget = function () {
        B2dEditor.selectingTriggerTarget = true;
    }


    var actionsString;
    var actionsFolder;
    for (let i = 0; i < dataJoint.triggerActions.length; i++) {
        var targetObject = B2dEditor.selectedPhysicsBodies[0].mySprite.targets[i];
        actionsString = `_triggerActions_${i}`;
        actionsFolder = _folder.addFolder(`Target ${i+1}`);
        var actionString;
        var actionFolder;
        for (let j = 0; j < dataJoint.triggerActions[i].length; j++) {
            actionFolder = actionsFolder.addFolder(`-- Action ${j+1}`);
            actionString = `${actionsString}_action_${j}`
            var action = dataJoint.triggerActions[i][j];
            var actionVarString;
            var actionOptions = getActionOptions(action.type);

            actionVarString = `${actionString}_targetActionDropDown`;

            ui.editorGUI.editData[actionVarString] = action.type;
            var controller;
            controller = actionFolder.add(ui.editorGUI.editData, actionVarString, getActionsForObject(targetObject)).onChange(function (value) {
                this.humanUpdate = true;
                this.targetValue = value;
                this.triggerActionKey = 'targetActionDropDown';
                this.triggerTargetID = targetID;
                this.triggerActionID = actionID;
            }.bind(controller));

            let targetID = i;
            let actionID = j;

            controller.name('actionType');

            for (let key in action) {
                let actionController;
                if (action.hasOwnProperty(key) && key != "type") {
                    actionVarString = `${actionString}_${key}`;
                    ui.editorGUI.editData[actionVarString] = action[key];

                    switch (actionOptions[key].type) {
                        case guitype_MINMAX:
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
                            }.bind(actionController));
                            break;
                        case guitype_BOOL:
                            actionController = actionFolder.add(ui.editorGUI.editData, actionVarString)
                            actionController.name(key);
                            actionController.onChange(function (value) {
                                this.humanUpdate = true;
                                this.targetValue = value;
                                this.triggerActionKey = key;
                                this.triggerTargetID = targetID;
                                this.triggerActionID = actionID;
                            }.bind(actionController));
                            break;
                    }

                }
            }
            ui.editorGUI.editData[actionString] = dataJoint.triggerActions[i][j];

            ui.editorGUI.editData[`removeAction_${j}`] = function () {};
            var label = `Remove Action ${j+1}`;
            let targetIndex = i;
            let targetAction = j;
            controller = actionFolder.add(ui.editorGUI.editData, `removeAction_${j}`).name(label);
            ui.editorGUI.editData[`removeAction_${j}`] = function () {
                for (var i = 0; i < B2dEditor.selectedPhysicsBodies.length; i++) {
                    if (B2dEditor.selectedPhysicsBodies[i].mySprite.data.triggerActions[targetIndex].length > 1) {
                        B2dEditor.selectedPhysicsBodies[i].mySprite.data.triggerActions[targetIndex].splice(targetAction, 1);
                        updateTriggerGUI();
                    }
                }
            }
        }
        ui.editorGUI.editData[`addAction_${i}`] = function () {};
        var label = `Add Action`;
        let targetIndex = i;
        controller = actionsFolder.add(ui.editorGUI.editData, `addAction_${i}`).name(label);
        ui.editorGUI.editData[`addAction_${i}`] = function () {
            for (var i = 0; i < B2dEditor.selectedPhysicsBodies.length; i++) {
                const targetSprite = B2dEditor.selectedPhysicsBodies[i].mySprite;
                targetSprite.data.triggerActions[targetIndex].push(getAction(getActionsForObject(targetSprite.targets[targetIndex])[0]));
                updateTriggerGUI();
            }
        }

        ui.editorGUI.editData[`removeTarget_${i}`] = function () {};
        var label = `Remove Target ${i+1}`;
        controller = actionsFolder.add(ui.editorGUI.editData, `removeTarget_${i}`).name(label);
        ui.editorGUI.editData[`removeTarget_${i}`] = function () {
            for (var i = 0; i < B2dEditor.selectedPhysicsBodies.length; i++) {
                // B2dEditor.selectedPhysicsBodies[i].mySprite.targets.splice(targetIndex, 1);
                // B2dEditor.selectedPhysicsBodies[i].mySprite.data.triggerActions.splice(targetIndex, 1);

                const targetTrigger = B2dEditor.selectedPhysicsBodies[i];
                removeTargetFromTrigger(targetTrigger, targetTrigger.mySprite.targets[targetIndex]);
                updateTriggerGUI();

            }
        }


    }
}
export const triggerGUIState = {};
export const updateTriggerGUI = function () {
    //save folder status
    const title = ui.editorGUI.domElement.querySelector('.title');
    var targetFolder = ui.editorGUI.__folders[title.innerText];


    let folder;
    for (var propt in targetFolder.__folders) {
        folder = targetFolder.__folders[propt];
        triggerGUIState[propt] = folder.closed;
        for (var _propt in targetFolder.__folders[propt].__folders) {
            folder = targetFolder.__folders[propt].__folders[_propt];
            triggerGUIState[propt + _propt] = folder.closed;
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
        }
    }
}
export const triggerTargetType = {
    mainCharacter: 0,
    anyCharacter: 1,
    anyButMainCharacter: 2,
    allObjects: 3,
    attachedTargetsOnly: 4,
    click: 5,
}
export const triggerRepeatType = {
    once: 0,
    onceEveryContact: 1,
    continuesOnContact: 2,
    onActivation: 3,
}
export const containsTargetType = function (targetTrigger, body) {
    switch (targetTrigger.data.targetType) {
        case triggerTargetType.mainCharacter:
            return body.mainCharacter;
        case triggerTargetType.anyCharacter:
            return body.mainCharacter; //TODO
        case triggerTargetType.anyButMainCharacter:
            return !body.mainCharacter;
        case triggerTargetType.allObjects:
            return true;
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
        this.activated = false;
        this.touchingObjects = [];
        this.touchingTarget = false;
        this.destroy = false;
        this.contactListener;
        this.runTriggerOnce = false;
    }
    init(trigger) {
        this.trigger = trigger;
        this.data = trigger.mySprite.data;
        this.actions = trigger.mySprite.data.triggerActions;
        this.targets = trigger.mySprite.targets;
        this.initContactListener();
    }
    update() {
        if (this.data.targetType == triggerTargetType.click) {
            if (Key.isPressed(Key.MOUSE)) {
                let fixture = this.trigger.GetFixtureList();
                while (fixture != null) {
                    if (fixture.TestPoint(B2dEditor.mousePosWorld)) {
                        this.doTrigger();
                        break;
                    }
                    fixture = fixture.GetNext();
                }
            }
        }
        if (this.runTriggerOnce) {
            this.doTrigger();
            this.runTriggerOnce = false;
        }
        if (this.destroy) {
            B2dEditor.deleteObjects([this.trigger]);
        } else if (this.touchingTarget && this.data.repeatType == triggerRepeatType.continuesOnContact) {
            this.doTrigger();
        }
    }
    initContactListener() {
        var self = this;
        this.contactListener = new Box2D.b2ContactListener();
        this.contactListener.BeginContact = function (contact, target) {
            if (self.data.targetType == triggerTargetType.click) return;
            var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            for (var i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                if (body != self.trigger && containsTargetType(self, body)) {
                    if (!self.touchingObjects.includes(body)) self.touchingObjects.push(body);
                    self.touchingTarget = true;
                    if (self.data.repeatType == triggerRepeatType.once || self.data.repeatType == triggerRepeatType.onceEveryContact) {
                        if (self.touchingObjects.length == 1) {
                            self.runTriggerOnce = true;
                            if (self.data.repeatType == triggerRepeatType.once) {
                                self.destroy = true;
                            }
                        }
                    }
                }
            }
        }
        this.contactListener.EndContact = function (contact, target) {
            if (self.data.targetType == triggerTargetType.click) return;
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
    doTrigger() {
        if (!this.targets) return;
        for (var i = 0; i < this.targets.length; i++) {
            var targetObject = this.targets[i];
            var actionData;
            const triggerLength = this.data.triggerActions[i].length;
            for (var j = 0; j < triggerLength; j++) {
                actionData = this.data.triggerActions[i][j];
                doAction(actionData, targetObject);
                if(targetObject.destroyed){
                    i--;
                }
            }
        }
    }
}
export const addTargetToTrigger = function (_trigger, target) {

    if(target.data.prefabInstanceName){
        const prefab = game.editor.activePrefabs[target.data.prefabInstanceName]
        game.editor.updateObject(null, prefab);
        target = game.editor.textures.getChildAt(prefab.ID);
    }

    if(target.data.type === B2dEditor.object_TEXTURE && target.myBody) target = target.myBody.mySprite;

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
