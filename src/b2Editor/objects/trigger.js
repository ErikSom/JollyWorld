import {
    B2dEditor
} from "../B2dEditor";
import * as ui from "../utils/ui";
import * as Box2D from "../../../libs/Box2D";

export const getActionsForObject = function (object) {
    var actions = [];
    if (object.data.prefabInstanceName != undefined) {
        //detect if prefab
        actions.push("Impulse") //, "SetAwake");
        console.log("IS PREFAB");
    } else {
        switch (object.data.type) {
            case B2dEditor.object_BODY:
                actions.push("Impulse") //, "SetAwake");
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
    return actions;
}
export const getAction = function (action) {
    return JSON.parse(JSON.stringify(actionDictionary[`actionObject_${action}`]));
}
export const getActionOptions = function (action) {
    return actionDictionary[`actionOptions_${action}`];
}
export const doAction = function (actionData, targets) {
    if (!(targets instanceof Array)) targets = [targets];

    var bodies;


    switch (actionData.type) {
        case "Impulse":
            targets.map(target => {
                console.log(target);
                if (target.data.prefabInstanceName) {
                    bodies = B2dEditor.lookupGroups[target.data.prefabInstanceName]._bodies;
                } else bodies = [target.myBody];
                bodies.map(body => {
                    const a = (actionData.direction * 360) * B2dEditor.DEG2RAD;
                    const impulse = new Box2D.b2Vec2(actionData.impulseForce * Math.cos(a), actionData.impulseForce * Math.sin(a))
                    body.ApplyLinearImpulse(impulse, body.GetPosition(), true)
                    body.ApplyTorque(actionData.rotationForce, true)
                });
            });
            break;
        case "SetPosition":
            targets.map(target => {
                var objects;
                var targetPos;

                if (target.data.prefabInstanceName) {
                    objects = [].concat(B2dEditor.lookupGroups[target.data.prefabInstanceName]._bodies, B2dEditor.lookupGroups[target.data.prefabInstanceName]._textures);
                    targetPos = new Box2D.b2Vec2(target.x, target.y);
                } else if(target.myBody) {
                    objects = [target.myBody];
                    targetPos = new Box2D.b2Vec2(target.myBody.GetPosition().x*B2dEditor.PTM, target.myBody.GetPosition().y*B2dEditor.PTM);
                }else{
                    objects = [target];
                    targetPos = new Box2D.b2Vec2(target.x, target.y);
                }

                if(actionData.setAdd == "fixed") targetPos = new Box2D.b2Vec2(actionData.X-targetPos.x, actionData.Y-targetPos.y);
                else targetPos = new Box2D.b2Vec2(actionData.X, actionData.Y);

                B2dEditor.applyToObjects(B2dEditor.TRANSFORM_MOVE, targetPos, objects);
            });
            break;
    }
}
export const guitype_MINMAX = 0;
export const guitype_LIST = 1;

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
            min: -100,
            max: 100,
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
            min: -100,
            max: 100,
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
            min: -1000,
            max: 1000,
            step: 0.1,
        },
        Y: {
            type: guitype_MINMAX,
            min: -1000,
            max: 1000,
            step: 0.1
        },
    },
}
export const addTriggerGUI = function (dataJoint) {
    var targetTypes = Object.keys(triggerTargetType);
    targetTypes.map(key => {
        if (triggerTargetType[key] == dataJoint.targetType) {
            ui.editorGUI.editData.targetTypeDropDown = key;
        }
    })
    ui.editorGUI.add(ui.editorGUI.editData, "targetTypeDropDown", targetTypes).onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    });

    var repeatTypes = Object.keys(triggerRepeatType);
    repeatTypes.map(key => {
        if (triggerRepeatType[key] == dataJoint.repeatType) {
            ui.editorGUI.editData.repeatTypeDropDown = key;
        }
    })
    ui.editorGUI.add(ui.editorGUI.editData, "repeatTypeDropDown", repeatTypes).onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    });
    ui.editorGUI.editData.selectTarget = function () {};
    var label = ">Add Target<";
    controller = ui.editorGUI.add(ui.editorGUI.editData, "selectTarget").name(label);
    ui.editorGUI.editData.selectTarget = function () {
        B2dEditor.selectingTriggerTarget = true;
    }


    var actionsString;
    var actionsFolder;
    for (let i = 0; i < dataJoint.triggerActions.length; i++) {
        var targetObject = B2dEditor.selectedPhysicsBodies[0].mySprite.targets[i];
        actionsString = `_triggerActions_${i}`;
        actionsFolder = ui.editorGUI.addFolder(`Target ${i+1}`);
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
                this.targetValue = value
            });


            let targetID = i;
            let actionID = j;

            controller.name('actionType');
            controller.triggerActionKey = 'targetActionDropDown';
            controller.triggerTargetID = targetID;
            controller.triggerActionID = actionID;


            for (var key in action) {
                if (action.hasOwnProperty(key) && key != "type") {
                    actionVarString = `${actionString}_${key}`;
                    ui.editorGUI.editData[actionVarString] = action[key];

                    switch (actionOptions[key].type) {
                        case guitype_MINMAX:
                            controller = actionFolder.add(ui.editorGUI.editData, actionVarString, actionOptions[key].min, actionOptions[key].max)
                            controller.step(actionOptions[key].step);
                            controller.name(key);
                            controller.onChange(function (value) {
                                this.humanUpdate = true;
                                this.targetValue = value
                            }.bind(controller));
                        break
                        case guitype_LIST:
                            controller = actionFolder.add(ui.editorGUI.editData, actionVarString, actionOptions[key].items)
                            controller.name(key);
                            controller.onChange(function (value) {
                                this.humanUpdate = true;
                                this.targetValue = value
                            }.bind(controller));
                        break;
                    }
                    controller.triggerActionKey = key;
                    controller.triggerTargetID = targetID;
                    controller.triggerActionID = actionID;
                }
            }
            ui.editorGUI.editData[actionString] = dataJoint.triggerActions[i][j];

            ui.editorGUI.editData[`removeAction_${j}`] = function () {};
            var label = `>Remove Action ${j+1}<`;
            let targetIndex = i;
            let targetAction = j;
            controller = actionFolder.add(ui.editorGUI.editData, `removeAction_${j}`).name(label);
            ui.editorGUI.editData[`removeAction_${j}`] = function () {
                for(var i = 0; i<B2dEditor.selectedPhysicsBodies.length; i++){
                    if(B2dEditor.selectedPhysicsBodies[i].mySprite.data.triggerActions[targetIndex].length>1){
                        B2dEditor.selectedPhysicsBodies[i].mySprite.data.triggerActions[targetIndex].splice(targetAction, 1);
                        updateTriggerGUI();
                    }
                }
            }
        }
        ui.editorGUI.editData[`addAction_${i}`] = function () {};
        var label = `>Add Action<`;
        let targetIndex = i;
        controller = actionsFolder.add(ui.editorGUI.editData, `addAction_${i}`).name(label);
        ui.editorGUI.editData[`addAction_${i}`] = function () {
            for(var i = 0; i<B2dEditor.selectedPhysicsBodies.length; i++){
                const targetSprite = B2dEditor.selectedPhysicsBodies[i].mySprite;
                targetSprite.data.triggerActions[targetIndex].push(getAction(getActionsForObject(targetSprite.targets[targetIndex])[0]));
                updateTriggerGUI();
            }
        }

        ui.editorGUI.editData[`removeTarget_${i}`] = function () {};
        var label = `>Remove Target ${i+1}<`;
        controller = actionsFolder.add(ui.editorGUI.editData, `removeTarget_${i}`).name(label);
        ui.editorGUI.editData[`removeTarget_${i}`] = function () {
            for(var i = 0; i<B2dEditor.selectedPhysicsBodies.length; i++){
                B2dEditor.selectedPhysicsBodies[i].mySprite.targets.splice(targetIndex, 1);
                B2dEditor.selectedPhysicsBodies[i].mySprite.data.triggerActions.splice(targetIndex, 1);
                updateTriggerGUI();
            }
        }


    }
}
export const triggerGUIState = {};
export const updateTriggerGUI = function () {
    //save folder status
    let folder;
    for (var propt in ui.editorGUI.__folders) {
        folder = ui.editorGUI.__folders[propt];
        triggerGUIState[folder.domElement.innerText] = folder.closed;
        for(var _propt in ui.editorGUI.__folders[propt].__folders){
            folder = ui.editorGUI.__folders[propt].__folders[_propt];
            triggerGUIState[folder.domElement.innerText] = folder.closed;
        }
    }

    B2dEditor.updateSelection();

    //restore folder status
    for (var propt in ui.editorGUI.__folders) {
        folder = ui.editorGUI.__folders[propt];
        folder.closed = triggerGUIState[folder.domElement.innerText] || false;
        for(var _propt in ui.editorGUI.__folders[propt].__folders){
            folder = ui.editorGUI.__folders[propt].__folders[_propt];
            folder.closed = triggerGUIState[folder.domElement.innerText] || false;
        }
    }
}
export const triggerTargetType = {
    mainCharacter: 0,
    anyCharacter: 1,
    anyButMainCharacter: 2,
    groupName: 3,
    allObjects: 4,
    attachedTargetsOnly: 5,
    click: 6,
}
export const triggerRepeatType = {
    once: 0,
    onceEveryContact: 1,
    continuesOnContact: 2,
    onActivation: 3,
}
export const containsTargetType = function (targetType, body) {
    switch (targetType) {
        case triggerTargetType.mainCharacter:
            return body.mainCharacter;
            break;
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
        if(this.runTriggerOnce){
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
            var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            for (var i = 0; i < bodies.length; i++) {
                if (containsTargetType(self.data.targetType, bodies[i])) {
                    console.log("WHOOJOO contains target");
                    if (!self.touchingObjects.includes(bodies[i])) self.touchingObjects.push(bodies[i]);
                    self.touchingTarget = true;
                    if (self.data.repeatType == triggerRepeatType.once || self.data.repeatType == triggerRepeatType.onceEveryContact) {
                        console.log("WHOOJOO right type", self.touchingObjects.length);

                        if (self.touchingObjects.length == 1) {
                            console.log("WHOOJOO do trigger");
                            self.runTriggerOnce = true;
                            console.log(self.data.repeatType, triggerRepeatType.once);
                            if (self.data.repeatType == triggerRepeatType.once) {
                                self.destroy = true;
                            }
                        }
                    }
                }
            }
        }
        this.contactListener.EndContact = function (contact, target) {
            var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            for (var i = 0; i < bodies.length; i++) {
                if (containsTargetType(self.data.targetType, bodies[i])) {
                    for (var j = 0; j < self.touchingObjects.length; j++) {
                        if (self.touchingObjects[j] == bodies[i]) {
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
            for (var j = 0; j < this.data.triggerActions[i].length; j++) {
                actionData = this.data.triggerActions[i][j];
                doAction(actionData, targetObject);
            }
        }
    }
}