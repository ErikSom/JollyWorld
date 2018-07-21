import {
    B2dEditor
} from "../B2dEditor";
import * as Box2D from "../../../libs/Box2D";

export const getActionsForObject = function (object) {
    var actions = [];
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
    if (object.data.type != B2dEditor.object_JOINT) {
        //actions.push("SetPosition", "SetRotation")
    }
    return actions;
}
export const getAction = function (action) {
    return actionDictionary[`actionObject_${action}`];
}
export const getActionOptions = function (action) {
    return actionDictionary[`actionOptions_${action}`];
}
export const doAction = function(actionData, targets){
    if(!(target instanceof Array)) targets = [targets];

    switch(actionData.type){
        case "Impulse":
        targets.map(target => {
            const a = (acionData.direction*360) * B2dEditor.DEG2RAD;
            const impulse = new Box2D.b2Vec2(actionData.impulseForce*Math.cos(a), actionData.impulseForce*Math.sin(a))
            target.ApplyLinearImpulse(impulse, target.GetPosition(), true)
            target.ApplyTorque(actionData.rotationForce, true)
        });
        break;
    }
}
export const guitype_MINMAX = 0;
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
    }
    /******************/
}
export const addTriggerGUI = function (dataJoint) {
    var targetTypes = Object.keys(triggerTargetType);
    targetTypes.map(key => {
        if(triggerTargetType[key] == dataJoint.targetType){
            B2dEditor.editorGUI.editData.targetTypeDropDown = key;
        }
    })
    B2dEditor.editorGUI.add(B2dEditor.editorGUI.editData, "targetTypeDropDown", targetTypes).onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    });

    var repeatTypes = Object.keys(triggerRepeatType);
    repeatTypes.map(key => {
        if(triggerRepeatType[key] == dataJoint.repeatType){
            B2dEditor.editorGUI.editData.repeatTypeDropDown = key;
        }
    })
    B2dEditor.editorGUI.add(B2dEditor.editorGUI.editData, "repeatTypeDropDown", repeatTypes).onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    });
    B2dEditor.editorGUI.editData.selectTarget = function () {};
    var label = ">Add Target<";
    controller = B2dEditor.editorGUI.add(B2dEditor.editorGUI.editData, "selectTarget").name(label);
    B2dEditor.editorGUI.editData.selectTarget = function () {
        B2dEditor.selectingTriggerTarget = true;
    }


    var actionsString;
    var actionsFolder;
    for (var i = 0; i < dataJoint.triggerActions.length; i++) {
        actionsString = `_triggerActions_${i}`;
        actionsFolder = B2dEditor.editorGUI.addFolder(`Actions ${i}`);
        var actionString;
        var actionFolder;
        for (var j = 0; j < dataJoint.triggerActions[i].length; j++) {
            actionFolder = actionsFolder.addFolder(`-- Action ${j}`);
            actionString = `${actionsString}_action_${j}`
            var action = dataJoint.triggerActions[i][j];
            var actionVarString;
            var actionOptions = getActionOptions(action.type);
            for (var key in action) {
                if (action.hasOwnProperty(key) && key != "type") {
                    actionVarString = `${action}_${key}`;
                    B2dEditor.editorGUI.editData[actionVarString] = action[key];

                    var controller;
                    switch (actionOptions[key].type) {
                        case guitype_MINMAX:
                            controller = actionFolder.add(B2dEditor.editorGUI.editData, actionVarString, actionOptions[key].min, actionOptions[key].max)
                            controller.step(actionOptions[key].step);
                            controller.name(key);
                            controller.onChange(function (value) {
                                this.humanUpdate = true;
                                this.targetValue = value
                            });
                            break
                    }
                    controller.triggerActionKey = key;
                    controller.triggerTargetID = i;
                    controller.triggerActionID = j;
                }
            }
            B2dEditor.editorGUI.editData[actionString] = dataJoint.triggerActions[i][j];
        }
    }
}
export const triggerTargetType = {
    mainCharacter: 0,
    anyCharacter:1,
    anyButMainCharacter:2,
    groupName:3,
    allObjects:4,
    attachedTargetsOnly:5,
    click:6,
}
export const triggerRepeatType = {
    once:0,
    onceEveryContact:1,
    continuesOnContact:2,
    onActivation:3,
}
export const containsTargetType = function(targetType, body){
    switch(targetType){
        case triggerTargetType.mainCharacter:
            return body.mainCharacter;
        break;
    }
}
export class triggerCore {
    constructor() {
        this.data;
        this.activated = false;
        this.touchingTarget = false;
        this.destroy = false;
        this.contactListener;
    }
    init(trigger) {
        this.trigger = trigger;
        this.data = trigger.mySprite.data;
        this.actions = trigger.mySprite.data.triggerActions;
        this.targets = trigger.mySprite.targets;
        this.initContactListener();
    }
    update() {
        if(this.destroy){
            B2dEditor.deleteObjects(this.trigger);
        }else if(this.data.repeatType == triggerRepeatType.continuesOnContact){
            this.doTrigger();
        }
    }
    initContactListener() {
        var self = this;
        this.contactListener = new Box2D.b2ContactListener();
        this.contactListener.BeginContact = function (contact, target) {
            var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            for(var i = 0; i<bodies.length; i++){
                if(containsTargetType(self.data.targetType, bodies[i])){
                    console.log("HOLY SHEEEIT!!!");
                    this.touchingTarget = true;
                    if(self.data.triggerRepeat == triggerRepeatType.once || self.data.triggerRepeat == triggerRepeatType.onceEveryContact){
                        doTrigger();
                        if(self.data.triggerRepeat == triggerRepeatType.once){
                            this.destroy = true;
                        }
                    }
                }
            }
        }
        this.contactListener.EndContact = function (contact, target) {
            var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            for(var i = 0; i<bodies.length; i++){
                if(containsTargetType(self.data.targetType, bodies[i])){
                    this.touchingTarget = false;
                }
            }
        }
        this.contactListener.PreSolve = function (contact, oldManifold) {}
        this.contactListener.PostSolve = function (contact, impulse) {}
    }
    doTrigger(){
        for(var i = 0; i<this.targets.length; i++){
            var targetObject = this.targets[i];
            var actionData;
            for(var j = 0; j<this.data.triggerActions[i].length; j++){
                actionData = this.data.triggerActions[i][j];
                doAction(actionData, targetObject);
            }
        }
    }
}