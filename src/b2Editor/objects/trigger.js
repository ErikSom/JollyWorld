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
            actionFolder = actionsFolder.addFolder(`Action ${j}`);
            actionString = `${actionsString}_action_${j}`
            var action = dataJoint.triggerActions[i][j];
            var actionVarString;
            var actionOptions = getActionOptions(action.type);
            for (var key in action) {
                if (action.hasOwnProperty(key) && key != "type") {
                    actionVarString = `${action}_${key}`;
                    B2dEditor.editorGUI.editData[actionVarString] = action[key];

                    var controller;
                    switch (actionOptions.type) {
                        case guitype_MINMAX:
                            controller = actionFolder.add(B2dEditor.editorGUI.editData, actionVarString, actionOptions.min, actionOptions.max)
                            controller.step(actionOptions.step);
                            constroller.name(key);
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

    // var controller;
    // var folder;
    // var jointTypes = ["Pin", "Slide", "Distance", "Rope"];


    // this.editorGUI.editData.typeName = jointTypes[dataJoint.jointType];

    // this.editorGUI.add(self.editorGUI.editData, "typeName", jointTypes).onChange(function (value) {
    // 	this.humanUpdate = true;
    // 	this.targetValue = value
    // });
    // this.editorGUI.add(self.editorGUI.editData, "collideConnected").onChange(function (value) {
    // 	this.humanUpdate = true;
    // 	this.targetValue = value
    // });

    // if (dataJoint.jointType == this.jointObject_TYPE_PIN || dataJoint.jointType == this.jointObject_TYPE_SLIDE) {

    // 	folder = this.editorGUI.addFolder('enable motor');
    // 	folder.add(self.editorGUI.editData, "enableMotor").onChange(function (value) {
    // 		this.humanUpdate = true;
    // 		this.targetValue = value;
    // 	});

    // 	var lowerLimit = 0;
    // 	var higherLimit = 0;

    // 	if (dataJoint.jointType == this.jointObject_TYPE_PIN) {
    // 		lowerLimit = 0;
    // 		higherLimit = 10000;
    // 	} else {
    // 		lowerLimit = 0;
    // 		higherLimit = 1000;
    // 	}

    // 	controller = folder.add(self.editorGUI.editData, "maxMotorTorque", lowerLimit, higherLimit);
    // 	controller.onChange(function (value) {
    // 		this.humanUpdate = true;
    // 		this.targetValue = value
    // 	}.bind(controller));

    // 	if (dataJoint.jointType == this.jointObject_TYPE_SLIDE) controller.name("maxMotorForce");

    // 	controller = folder.add(self.editorGUI.editData, "motorSpeed", -20, 20);
    // 	controller.onChange(function (value) {
    // 		this.humanUpdate = true;
    // 		this.targetValue = value
    // 	}.bind(controller));


    // 	folder = this.editorGUI.addFolder('enable limits');
    // 	folder.add(self.editorGUI.editData, "enableLimit").onChange(function (value) {
    // 		this.humanUpdate = true;
    // 		this.targetValue = value;
    // 	});

    // 	if (dataJoint.jointType == this.jointObject_TYPE_PIN) {
    // 		controller = folder.add(self.editorGUI.editData, "upperAngle", 0, 180);
    // 		controller.onChange(function (value) {
    // 			this.humanUpdate = true;
    // 			this.targetValue = value;
    // 		}.bind(controller));

    // 		controller = folder.add(self.editorGUI.editData, "lowerAngle", -180, 0);
    // 		controller.onChange(function (value) {
    // 			this.humanUpdate = true;
    // 			this.targetValue = value
    // 		}.bind(controller));
    // 	} else {
    // 		controller = folder.add(self.editorGUI.editData, "upperLimit", 0, 5000);
    // 		controller.onChange(function (value) {
    // 			this.humanUpdate = true;
    // 			this.targetValue = value;
    // 		}.bind(controller));

    // 		controller = folder.add(self.editorGUI.editData, "lowerLimit", -5000, 0);
    // 		controller.onChange(function (value) {
    // 			this.humanUpdate = true;
    // 			this.targetValue = value
    // 		}.bind(controller));
    // 	}
    // } else if (dataJoint.jointType == this.jointObject_TYPE_DISTANCE) {
    // 	folder = this.editorGUI.addFolder('spring');

    // 	controller = folder.add(self.editorGUI.editData, "frequencyHz", 0, 180);
    // 	controller.onChange(function (value) {
    // 		this.humanUpdate = true;
    // 		this.targetValue = value;
    // 	}.bind(controller));

    // 	controller = folder.add(self.editorGUI.editData, "dampingRatio", 0.0, 1.0).step(0.25);
    // 	controller.onChange(function (value) {
    // 		this.humanUpdate = true;
    // 		this.targetValue = value
    // 	}.bind(controller));
    // }
}

export const guitype_MINMAX = 0;