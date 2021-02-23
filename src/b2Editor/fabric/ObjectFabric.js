//@ts-check
import { b2BodyDef, b2BodyType, b2Vec2 } from './../../../libs/Box2D';
import { Settings } from "./../../Settings";
import { 
	GraphicsObject, 
	TextureObject, 
	GraphicsGroupObject, 
	TextObject
} from './../objects';

import * as PIXI from 'pixi.js';
import * as PrefabManager from './../../prefabs/PrefabManager';

export class ObjectFabric {
	constructor(editorServer, game) {
		this.editor = editorServer;
		this.game = game;

		this.BUILD_LOCATOR = {
			[GraphicsObject.TYPE]: this.buildGraphicFromObj.bind(this),
			[GraphicsGroupObject.TYPE]: this.buildGraphicGroupFromObj.bind(this),
			[TextureObject.TYPE]: this.buildTextGraphicFromObj.bind(this),
			[TextObject.TYPE]: this.buildTextFromObj.bind(this), 
		}
	}

	buildObjFromType(type = 0, data) {
		const fabricMetod = this.BUILD_LOCATOR[type];
		if (!fabricMetod) {
			throw 'Unknown type ' + type;
		}

		return fabricMetod(data);
	}

	buildBodyFromObj (obj) {
		const editor = this.editor;

		const bd = new b2BodyDef();
		if (obj.trigger) {
			bd.type = b2BodyType.b2_kinematicBody;
		} else if (obj.fixed) {
			bd.type = b2BodyType.b2_staticBody;
		} else {
			bd.type = b2BodyType.b2_dynamicBody;
		}

		bd.angularDamping = 0.9;

		const body = editor.world.CreateBody(bd);
		body.SetAwake(obj.awake);

		var graphic = new PIXI.Graphics();
		body.originalGraphic = graphic;


		if (obj.vertices[0] instanceof Array == false) {
			// A fix for backwards compatibility with old vertices system
			obj.vertices = [obj.vertices];
			obj.radius = [obj.radius];
			obj.colorFill = [obj.colorFill];
			obj.colorLine = [obj.colorLine];
			obj.lineWidth = [obj.lineWidth];
			obj.transparancy = [obj.transparancy];
			obj.density = [obj.density];
		}

		// backwards fix for restitution and friction
		obj.restitution = obj.restitution.slice();
		obj.friction = obj.friction.slice();
		obj.collision = obj.collision.slice();

		body.SetPositionAndAngle(new b2Vec2(obj.x, obj.y), 0);
		body.SetAngle(obj.rotation);

		body.mySprite = new PIXI.Sprite();
		editor.textures.addChild(body.mySprite);

		body.mySprite.addChild(body.originalGraphic);

		body.mySprite.myBody = body;
		body.mySprite.data = obj;

		body.mySprite.alpha = obj.transparancy[0];
		body.mySprite.visible = obj.visible;

		editor.updateBodyFixtures(body);
		editor.updateBodyShapes(body);

		body.mySprite.x = body.GetPosition().x * editor.PTM;
		body.mySprite.y = body.GetPosition().y * editor.PTM;
		body.mySprite.rotation = body.GetAngle();

		if (obj.tileTexture != "") {
			editor.updateTileSprite(body);
		}

		editor.setBodyCollision(body, obj.collision);

		editor.addObjectToLookupGroups(body, body.mySprite.data);

		body.instaKill = obj.instaKill;
		body.isVehiclePart = obj.isVehiclePart;

		return body;
	}

	buildTextGraphicFromObj (obj) {
		return new PIXI.Text
		(
			obj.text,
			new PIXI.TextStyle({
				fontFamily: obj.fontName,
				fontSize: obj.fontSize,
				fill: obj.textColor,
				align: obj.textAlign
			})
		);
	}

	buildTextFromObj (obj) {
		const editor = this.editor;
		const text = this.buildTextGraphicFromObj(obj);
		const container = new PIXI.Container();

		container.pivot.set(text.width / 2, text.height / 2);
		container.addChild(text);

		//@ts-ignore
		container.textSprite = text;

		editor.textures.addChild(container);

		container.x = obj.x;
		container.y = obj.y;
		container.rotation = obj.rotation;
		//@ts-ignore
		container.data = obj;

		container.alpha = obj.transparancy;
		container.visible = obj.visible;

		//@ts-ignore
		if (container.data.bodyID != undefined) {
			//@ts-ignore
			var body = this.editor.textures.getChildAt(container.data.bodyID).myBody;
			this.editor.setTextureToBody(
				body, 
				container, 
				obj.texturePositionOffsetLength, 
				obj.texturePositionOffsetAngle, 
				obj.textureAngleOffset);
		}

		//@ts-ignore
		//handle groups and ref names
		this.editor.addObjectToLookupGroups(container, container.data);

		return container;
	}

	buildGraphicFromObj (obj) {
		const container = new PIXI.Container();
		//@ts-ignore
		container.data = obj;
		container.x = obj.x;
		container.y = obj.y;
		container.rotation = obj.rotation;
		container.visible = obj.visible;

		const originalGraphic = new PIXI.Graphics();
		container.addChild(originalGraphic);
		//@ts-ignore
		container.originalGraphic = originalGraphic;

		if (!obj.radius) {
			this.editor.updatePolyGraphic(
				originalGraphic, 
				obj.vertices, 
				obj.colorFill, 
				obj.colorLine, 
				obj.lineWidth, 
				obj.transparancy
			);
		} else {
			this.editor.updateCircleGraphic(
				originalGraphic, 
				obj.radius, 
				obj.vertices[0], 
				obj.colorFill, 
				obj.colorLine, 
				obj.lineWidth, 
				obj.transparancy
			);
		}

		this.editor.textures.addChild(container);
		//@ts-ignore
		if (container.data.bodyID != undefined) {
			//@ts-ignore
			const body = this.editor.textures.getChildAt(container.data.bodyID).myBody;
			this.editor.setTextureToBody(
				body, container, 
				obj.texturePositionOffsetLength, 
				obj.texturePositionOffsetAngle, 
				obj.textureAngleOffset
			);
		}

		if (obj.tileTexture != "" || obj.gradient != "") {
			this.editor.updateTileSprite(container);
		}

		//@ts-ignore
		this.editor.addObjectToLookupGroups(container, container.data);
		return container;
	}

	buildGraphicGroupFromObj (obj) {
		const editor = this.editor;
		const graphic = new PIXI.Container();

		//@ts-ignore
		graphic.data = obj;
		graphic.x = obj.x;
		graphic.y = obj.y;
		graphic.rotation = obj.rotation;
		graphic.scale.x = obj.mirrored ? -1 : 1;

		editor.updateGraphicGroupShapes(graphic);
		editor.textures.addChild(graphic);

		//@ts-ignore
		if (graphic.data.bodyID != undefined) {
			//@ts-ignore
			const body = editor.textures.getChildAt(graphic.data.bodyID).myBody;
			editor.setTextureToBody(body, graphic, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}

		graphic.alpha = obj.transparancy;
		graphic.visible = obj.visible;

		//@ts-ignore
		editor.addObjectToLookupGroups(graphic, graphic.data);
		return graphic;
	}

	buildAnimationGroupFromObject (obj) {
		const graphic = new PIXI.Container();
		//@ts-ignore
		graphic.data = obj;
		graphic.x = obj.x;
		graphic.y = obj.y;
		graphic.rotation = obj.rotation;

		this.editor.updateGraphicGroupShapes(graphic);
		this.editor.textures.addChild(graphic);
		
		//@ts-ignore
		if (graphic.data.bodyID != undefined) {
			//@ts-ignore
			const body = this.editor.textures.getChildAt(graphic.data.bodyID).myBody;
			this.editor.setTextureToBody(
				body, 
				graphic, 
				obj.texturePositionOffsetLength, 
				obj.texturePositionOffsetAngle, 
				obj.textureAngleOffset
			);
		}

		graphic.alpha = obj.transparancy;
		graphic.visible = obj.visible;
		graphic.scale.x = obj.mirrored ? -1 : 1;

		this.editor.initAnimation(graphic);
		//@ts-ignore
		this.editor.addObjectToLookupGroups(graphic, graphic.data);
		return graphic;
	}

	buildPrefabFromObj (obj) {
		this.editor.createdSubPrefabClasses = [];

		if (this.editor.breakPrefabs) {
			return this.editor.buildJSON(JSON.parse(PrefabManager.prefabLibrary[obj.prefabName].json));
		}

		if(obj.instanceID !== -1) {
			obj.instanceID = this.editor.prefabCounter++;
		}

		const key = obj.prefabName + "_" + obj.instanceID;
		obj.key = key;
		this.editor.activePrefabs[key] = obj;

		const prefabLookupObject = this.editor.buildJSON(JSON.parse(PrefabManager.prefabLibrary[obj.prefabName].json), key);

		this.editor.applyToObjects(
			this.editor.TRANSFORM_ROTATE, 
			obj.rotation, 
			[].concat(prefabLookupObject._bodies, prefabLookupObject._textures, prefabLookupObject._joints)
		);

		prefabLookupObject._bodies.forEach(body =>{
			this.editor.updateBodyPosition(body);
		});

		obj.class = new PrefabManager.prefabLibrary[obj.prefabName].class(obj);
		obj.class.postConstructor();

		obj.class.subPrefabClasses = this.editor.createdSubPrefabClasses;
		this.editor.createdSubPrefabClasses.forEach(subClass => {
			subClass.postConstructor();
			subClass.mainPrefabClass = obj.class
		});

		if(obj.settings) {
			Object.keys(obj.settings).forEach(key => obj.class.set(key, obj.settings[key]));
		}

		return prefabLookupObject;
	}

	buildTriggerFromObj (obj) {
		const editor = this.editor;
		const bodyObject = JSON.parse(JSON.stringify(obj));

		bodyObject.trigger = true;
		bodyObject.density = 1;
		bodyObject.collision = 2;

		const body = this.buildBodyFromObj(bodyObject);

		body.SetSleepingAllowed(false);
		editor.removeObjectFromLookupGroups(body, body.mySprite.data);

		body.mySprite.data = obj;
		body.mySprite.targets = [];
		body.mySprite.targetPrefabs = [];
		editor.addObjectToLookupGroups(body, body.mySprite.data);

		editor.triggerObjects.push(body);

		return body;
	}
}