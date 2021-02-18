import { b2BodyDef, b2BodyType } from './../../../libs/Box2D';
import { Settings } from "./../../Settings";

import * as PIXI from 'pixi.js';

export class ObjectFabric {
	constructor(editorServer, game) {
		this.editor = editorServer;
		this.game = game;
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
		const text = this.buildTextGraphicFromObj(obj);
		const container = new PIXI.Container();

		container.pivot.set(text.width / 2, text.height / 2);
		container.addChild(text);

		container.textSprite = text;

		this.textures.addChild(container);

		container.x = obj.x;
		container.y = obj.y;
		container.rotation = obj.rotation;
		container.data = obj;

		container.alpha = obj.transparancy;
		container.visible = obj.visible;

		if (container.data.bodyID != undefined) {
			var body = this.editor.textures.getChildAt(container.data.bodyID).myBody;
			this.editor.setTextureToBody(
				body, 
				container, 
				obj.texturePositionOffsetLength, 
				obj.texturePositionOffsetAngle, 
				obj.textureAngleOffset);
		}

		//handle groups and ref names
		this.editor.addObjectToLookupGroups(container, container.data);

		return container;
	}

	buildGraphicFromObj (obj) {
		const container = new PIXI.Container();
		container.data = obj;
		container.x = obj.x;
		container.y = obj.y;
		container.rotation = obj.rotation;
		container.visible = obj.visible;

		const originalGraphic = new PIXI.Graphics();
		container.addChild(originalGraphic);
		container.originalGraphic = originalGraphic;

		if (!obj.radius) {
			this.updatePolyGraphic(
				originalGraphic, 
				obj.vertices, 
				obj.colorFill, 
				obj.colorLine, 
				obj.lineWidth, 
				obj.transparancy
			);
		} else {
			this.updateCircleGraphic(
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

		if (container.data.bodyID != undefined) {
			var body = this.editor.textures.getChildAt(container.data.bodyID).myBody;
			this.editor.setTextureToBody(
				body, container, 
				obj.texturePositionOffsetLength, 
				obj.texturePositionOffsetAngle, 
				obj.textureAngleOffset
			);
		}

		if (obj.tileTexture != "" || obj.gradient != "") {
			this.updateTileSprite(container);
		}

		this.editor.addObjectToLookupGroups(container, container.data);
		return container;

	}

	buildAnimationGroupFromObject (obj) {
		const graphic = new PIXI.Container();
		graphic.data = obj;
		graphic.x = obj.x;
		graphic.y = obj.y;
		graphic.rotation = obj.rotation;

		this.updateGraphicGroupShapes(graphic);
		this.editor.textures.addChild(graphic);

		if (graphic.data.bodyID != undefined) {
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

		this.editor.addObjectToLookupGroups(graphic, graphic.data);
		return graphic;
	}

	buildPrefabFromObj (obj) {
		this.editor.createdSubPrefabClasses = [];

		if (this.editor.breakPrefabs) {
			return this.buildJSON(
				JSON.parse(
					PrefabManager.prefabLibrary[obj.prefabName].json
				)
			);
		}

		if(obj.instanceID !== -1) obj.instanceID = this.prefabCounter++;

		const key = obj.prefabName + "_" + obj.instanceID;
		obj.key = key;
		this.activePrefabs[key] = obj;

		const prefabLookupObject = this.buildJSON(JSON.parse(PrefabManager.prefabLibrary[obj.prefabName].json), key);

		this.applyToObjects(this.TRANSFORM_ROTATE, obj.rotation, [].concat(prefabLookupObject._bodies, prefabLookupObject._textures, prefabLookupObject._joints));
		prefabLookupObject._bodies.forEach(body =>{
			this.updateBodyPosition(body);
		});

		obj.class = new PrefabManager.prefabLibrary[obj.prefabName].class(obj);
		obj.class.postConstructor();

		obj.class.subPrefabClasses = this.createdSubPrefabClasses;
		this.createdSubPrefabClasses.forEach(subClass => {
			subClass.postConstructor();
			subClass.mainPrefabClass = obj.class
		});

		if(obj.settings) Object.keys(obj.settings).forEach(key=>obj.class.set(key, obj.settings[key]));

		return prefabLookupObject;
	}

	/**
	 * 
	 * @param {{}} json 
	 * @param {string} prefabInstanceName 
	 */
	buildJSON (json, prefabInstanceName) {
		//console.log(json);
		const createdObjects = {
			_bodies: [],
			_textures: [],
			_joints: [],
		};

		const editor = this.editor;
		const game = this.game;
		const textures = this.editor.textures;
		const startChildIndex = textures.children.length;
		let prefabOffset = 0;

		let jsonString = null;
		let vehicleOffset = 0;
		let characterStartLayer = 0;
		let characterOldEndLayer = 0;
		let characterNewEndLayer = 0;

		const vehicleCorrectLayer = (id, trigger) =>{
			if (id < characterStartLayer) {
				return id;
			}

			if (vehicleOffset > 0) {
				if(id<characterNewEndLayer){
					// we are inside character range
					return characterNewEndLayer-1;
				}
			} else if(id > characterOldEndLayer) {
				return id - vehicleOffset;
			}

			return id - vehicleOffset;
		}

		if (json != null) {
			if (typeof json === 'string'){
				jsonString = json;
				json = JSON.parse(json);
			}
			//clone json to not destroy old references
			let worldObjects = JSON.parse(JSON.stringify(json));

			if(worldObjects.gradients){
				this.editor.parseLevelGradients(worldObjects.gradients);
			}

	  		if(worldObjects.colors) {
				window.__guiusercolors = worldObjects.colors;
			}

			let worldObject;

			for (let i = 0; i < worldObjects.objects.length; i++) {
				const obj = this.parseArrObject(worldObjects.objects[i]);

				if (prefabInstanceName) {
					obj.prefabInstanceName = prefabInstanceName;

					let offsetX = this.activePrefabs[prefabInstanceName].x;
					let offsetY = this.activePrefabs[prefabInstanceName].y;

					if (obj.type === this.object_BODY) {
						offsetX /= this.editor.PTM;
						offsetY /= this.editor.PTM;
					}

					obj.x += offsetX;
					obj.y += offsetY;
				}

				if (obj.type !== this.object_PREFAB) {
					obj.ID += startChildIndex + prefabOffset - vehicleOffset;
				}

				if (obj.type === this.object_BODY) {
					worldObject = this.buildBodyFromObj(obj);
					createdObjects._bodies.push(worldObject);
				} else if (obj.type === this.object_TEXTURE) {

					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex - vehicleOffset;
					}

					worldObject = this.buildTextureFromObj(obj);
					createdObjects._textures.push(worldObject);
				} else if (obj.type === this.object_JOINT) {

					let duplicateJoint = false;

					if(obj.groups.startsWith(Settings.jsonDuplicateText)){
						obj.groups = obj.groups.substr(Settings.jsonDuplicateText.length);
						duplicateJoint = true;
					}

					if(!duplicateJoint){
						obj.bodyA_ID = vehicleCorrectLayer(obj.bodyA_ID+startChildIndex);
						if (obj.bodyB_ID != undefined) {
							obj.bodyB_ID = vehicleCorrectLayer(obj.bodyB_ID + startChildIndex);
						}
					}

					if (this.editor.editing) {
						worldObject = this.editor.attachJointPlaceHolder(obj);
					} else {
						worldObject = this.editor.attachJoint(obj);
					}

					createdObjects._joints.push(worldObject);
				} else if (obj.type === this.object_PREFAB) {
					if (
						game.gameState != game.GAMESTATE_EDITOR && 
						obj.settings.selectedVehicle && 
						game.selectedVehicle
					) {
						
						vehicleOffset = Settings.vehicleLayers[obj.prefabName];
						characterStartLayer = editor.textures.children.length;
						characterOldEndLayer = editor.textures.children.length + vehicleOffset;
						obj.prefabName = Settings.availableVehicles[game.selectedVehicle-1];
						obj.settings.selectedVehicle = obj.prefabName;
						// we get the difference between the old vehicleOffset and the new one
						vehicleOffset -= Settings.vehicleLayers[obj.prefabName];
						characterNewEndLayer = editor.textures.children.length + vehicleOffset;
					}

					const prefabStartChildIndex = editor.textures.children.length;
					const prefabObjects = this.buildPrefabFromObj(obj);

					if (!this.breakPrefabs) {
						this.activePrefabs[obj.key].ID = prefabStartChildIndex;
						createdObjects._bodies = createdObjects._bodies.concat(prefabObjects._bodies);
						createdObjects._textures = createdObjects._textures.concat(prefabObjects._textures);
						createdObjects._joints = createdObjects._joints.concat(prefabObjects._joints);
						prefabOffset = this.textures.children.length - prefabOffset;
					}
				} else if (obj.type == this.object_GRAPHIC) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex - vehicleOffset;
					}
					worldObject = this.buildGraphicFromObj(obj);
					createdObjects._textures.push(worldObject);
				} else if (obj.type == this.object_GRAPHICGROUP) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex - vehicleOffset;
					}
					worldObject = this.buildGraphicGroupFromObj(obj);
					createdObjects._textures.push(worldObject);
				}else if (obj.type == this.object_ANIMATIONGROUP) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex - vehicleOffset;
					}
					worldObject = this.buildAnimationGroupFromObject(obj);
					createdObjects._textures.push(worldObject);
				}  else if (obj.type == this.object_TRIGGER) {

					for (var j = 0; j < obj.triggerObjects.length; j++) {
						obj.triggerObjects[j] = vehicleCorrectLayer(obj.triggerObjects[j] + startChildIndex, true);
					}

					worldObject = this.buildTriggerFromObj(obj);
					createdObjects._bodies.push(worldObject);
				} else if (obj.type == this.object_TEXT) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex - vehicleOffset;
					}
					worldObject = this.buildTextFromObj(obj);
					createdObjects._textures.push(worldObject);
				}
			}

			if(worldObjects.settings){
				worldObjects.settings = this.parseArrObject(worldObjects.settings);

				Object.keys(worldObjects.settings).forEach(key=> {
					if (key === 'backgroundColor') {
						game.app.renderer.backgroundColor = worldObjects.settings[key];
					}
					editorSettings[key] = worldObjects.settings[key]
				});

				this.lastValidWorldJSON = jsonString ? jsonString : JSON.stringify(json);
			}
		}

		//Fix trigger object targets
		if(!prefabInstanceName){
			for (var i = 0; i < this.triggerObjects.length; i++) {
				var _trigger = this.triggerObjects[i];
				if (_trigger.mySprite.triggerInitialized) continue;
				for (var j = 0; j < _trigger.mySprite.data.triggerObjects.length; j++) {
					var targetObject = this.textures.getChildAt(_trigger.mySprite.data.triggerObjects[j]);
					trigger.addTargetToTrigger(_trigger, targetObject);
				}
				_trigger.mySprite.triggerInitialized = true;
			}
		}

		return createdObjects;
		//console.log("END HERE");
	}

}