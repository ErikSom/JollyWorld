import {Settings} from './../../Settings';

export function parseArrObject(arr) {
	const type = arr[0];
	let obj;

	switch (type) {
		case this.object_BODY: {
			obj = new this.bodyObject();
			obj.ID = arr[6];
			obj.colorFill = arr[7];
			obj.colorLine = arr[8];
			obj.transparancy = arr[9];
			obj.fixed = arr[10];
			obj.awake = arr[11];
			obj.vertices = arr[12];
			obj.density = arr[13];
			obj.collision = arr[14];
			obj.radius = arr[15];
			obj.tileTexture = arr[16] || "";
			obj.lineWidth = arr[17] !== undefined ? arr[17] : 1.0;
			obj.visible = typeof arr[18] === "boolean" ? arr[18] : true;
			obj.instaKill = typeof arr[19] === "boolean" ? arr[19] : false;
			obj.isVehiclePart = typeof arr[20] === "boolean" ? arr[20] : false;
			obj.friction = arr[21] !== undefined ? arr[21] : Settings.defaultFriction;
			obj.restitution = arr[22] !== undefined ? arr[22] : Settings.defaultRestitution;
			break;
		}
		case this.object_TEXTURE: {
			obj = new this.textureObject();
			obj.ID = arr[6];
			obj.textureName = arr[7];
			obj.bodyID = arr[8];
			obj.texturePositionOffsetLength = arr[9];
			obj.texturePositionOffsetAngle = arr[10];
			obj.textureAngleOffset = arr[11];
			obj.isCarvable = arr[12];
			obj.tint = arr[13] !== undefined ? arr[13] : "#FFFFFF";
			obj.scaleX = arr[14] || 1;
			obj.scaleY = arr[15] || 1;
			obj.transparancy = arr[16] !== undefined ? arr[16] : 1;
			obj.parallax = arr[17] !== undefined ? arr[17] : 0;
			obj.repeatTeleportX = arr[18] !== undefined ? arr[18] : 0;
			obj.repeatTeleportY = arr[19] !== undefined ? arr[19] : 0;
			obj.visible = typeof arr[20] === "boolean" ? arr[20] : true;

			break;
		}
		case this.object_JOINT: {
			obj = new this.jointObject();
			obj.ID = arr[6];
			obj.bodyA_ID = arr[7];
			obj.bodyB_ID = arr[8];
			obj.jointType = arr[9];
			obj.collideConnected = arr[10];
			obj.enableMotor = arr[11];
			obj.maxMotorTorque = arr[12];
			obj.motorSpeed = arr[13];
			obj.enableLimit = arr[14];
			obj.upperAngle = arr[15];
			obj.lowerAngle = arr[16];
			obj.dampingRatio = arr[17];
			obj.frequencyHz = arr[18];
			obj.upperLimit = arr[19] !== undefined ? arr[19] : obj.upperLimit;
			obj.lowerLimit = arr[20] !== undefined ? arr[20] : obj.lowerLimit;
			obj.autoReferenceAngle = arr[21] !== undefined ? arr[21] : false;

			break;
		}
		case this.object_PREFAB: {
			obj = new this.prefabObject();
			obj.settings = arr[4];
			obj.prefabName = arr[5];

			break;
		}
		case this.object_GRAPHIC: {
			obj = new this.graphicObject();
			obj.ID = arr[6];
			obj.colorFill = arr[7];
			obj.colorLine = arr[8];
			obj.transparancy = arr[9];
			obj.radius = arr[10];
			obj.vertices = arr[11];
			obj.bodyID = arr[12];
			obj.texturePositionOffsetLength = arr[13];
			obj.texturePositionOffsetAngle = arr[14];
			obj.textureAngleOffset = arr[15];
			obj.tileTexture = arr[16] || "";
			obj.lineWidth = arr[17] !== undefined ? arr[17] : 1.0;
			obj.parallax = arr[18] !== undefined ? arr[18] : 0;
			obj.repeatTeleportX = arr[19] !== undefined ? arr[19] : 0;
			obj.repeatTeleportY = arr[20] !== undefined ? arr[20] : 0;
			obj.gradient = arr[21] !== undefined ? this.levelGradientsNames[arr[21]] || "" : "";
			obj.visible = typeof arr[22] === "boolean" ? arr[22] : true;

			break;
		}
		case this.object_GRAPHICGROUP: {
			obj = new this.graphicGroup();
			obj.ID = arr[6];
			obj.graphicObjects = arr[7];
			obj.bodyID = arr[8];
			obj.texturePositionOffsetLength = arr[9];
			obj.texturePositionOffsetAngle = arr[10];
			obj.textureAngleOffset = arr[11];
			obj.transparancy = arr[12] !== undefined ? arr[12] : 1;
			obj.parallax = arr[13] !== undefined ? arr[13] : 0;
			obj.repeatTeleportX = arr[14] !== undefined ? arr[14] : 0;
			obj.repeatTeleportY = arr[15] !== undefined ? arr[15] : 0;
			obj.visible = typeof arr[16] === "boolean" ? arr[16] : true;
			obj.mirrored = typeof arr[17] === "boolean" ? arr[17] : false;

			break;
		}
		case this.object_TRIGGER: {
			obj = new this.triggerObject();
			obj.vertices = arr[6];
			obj.radius = arr[7];
			obj.enabled = typeof arr[8] === "boolean" ? arr[8] : true;
			obj.targetType = arr[9];
			obj.repeatType = arr[10];
			obj.triggerObjects = arr[11];
			obj.triggerActions = arr[12];
			obj.followPlayer = typeof arr[13] === "boolean" ? arr[13] : false;
			obj.worldActions = arr[14] || [];
			obj.triggerKey = arr[15] || 32;
			obj.followFirstTarget = typeof arr[16] === "boolean" ? arr[16] : false;

			break;
		}
		case this.object_TEXT: {
			obj = new this.textObject();
			obj.ID = arr[6];
			obj.text = arr[7];
			obj.textColor = arr[8];
			obj.transparancy = arr[9];
			obj.fontSize = arr[10];
			obj.fontName = arr[11];
			obj.textAlign = arr[12];
			obj.bodyID = arr[13];
			obj.texturePositionOffsetLength = arr[14];
			obj.texturePositionOffsetAngle = arr[15];
			obj.textureAngleOffset = arr[16];
			obj.parallax = arr[17] !== undefined ? arr[17] : 0;
			obj.repeatTeleportX = arr[18] !== undefined ? arr[18] : 0;
			obj.repeatTeleportY = arr[19] !== undefined ? arr[19] : 0;
			obj.visible = typeof arr[20] === "boolean" ? arr[20] : true;

			break;
		}
		case this.object_SETTINGS: {
			obj = this.editorSettingsObject;
			obj.gravityX = arr[1];
			obj.gravityY = arr[2];
			obj.backgroundColor = arr[3] || 0xd4d4d4;
			obj.cameraZoom = arr[4] !== undefined ? arr[4] : Settings.defaultCameraZoom;
			return obj;
		}
		case this.object_ANIMATIONGROUP: {
			obj = new this.animationGroup();
			obj.ID = arr[6];
			obj.graphicObjects = arr[7];
			obj.bodyID = arr[8];
			obj.texturePositionOffsetLength = arr[9];
			obj.texturePositionOffsetAngle = arr[10];
			obj.textureAngleOffset = arr[11];
			obj.transparancy = arr[12] !== undefined ? arr[12] : 1;
			obj.parallax = arr[13] !== undefined ? arr[13] : 0;
			obj.repeatTeleportX = arr[14] !== undefined ? arr[14] : 0;
			obj.repeatTeleportY = arr[15] !== undefined ? arr[15] : 0;
			obj.fps = arr[16] !== undefined ? arr[16] : 12;
			obj.playing = arr[17] !== undefined ? arr[17] : true;
			obj.visible = typeof arr[18] === "boolean" ? arr[18] : true;
			obj.mirrored = typeof arr[19] === "boolean" ? arr[19] : false;
		}
	}
	obj.type = arr[0];

	//shared vars
	obj.x = arr[1];
	obj.y = arr[2];
	obj.rotation = arr[3] || 0;

	if (arr[0] != this.object_PREFAB) {
		obj.groups = arr[4];
		obj.refName = arr[5];
	}

	return obj;
}
