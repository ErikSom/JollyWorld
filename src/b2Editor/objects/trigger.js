import {
    B2dEditor
} from "../B2dEditor";

const self = this;

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
    console.log(B2dEditor, B2dEditor.editorGUI);
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
                    controller.triggerTargetID = i;
                    controller.triggerActionID = j;
                }
            }
            B2dEditor.editorGUI.editData[actionString] = dataJoint.triggerActions[i][j];
        }
    }
}
export const triggerTargetType = {
    mainCharacter: "maincharacter",
    anyCharacter:"anycharacter",
    anyButMainCharacter:"anybutmaincharacter",
    groupName:"groupname",
    allObjects:"anybody",
    attachedTargetsOnly:"attachedtargetsonly",
    click:"click",
}
export const triggerRepeat = {
    once:"once",
    onceEveryContact:"onceeverycontact",
    continuesOnContact:"continuesoncontact",
    onActivation:"onactivation"

}
export class triggerCore {
    //static xyz = {};
    constructor() {
        this.contactListener;
    }
    init(data) {
        this.initContactListener();
    }
    update() {}
    initContactListener() {
        this.contactListener = new Box2D.b2ContactListener();
        this.contactListener.BeginContact = function (contact, target) {}
        this.contactListener.EndContact = function (contact, target) {}
        this.contactListener.PreSolve = function (contact, oldManifold) {}
        this.contactListener.PostSolve = function (contact, impulse) {}
    }
}