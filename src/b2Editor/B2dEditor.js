import * as Box2D from "../../libs/Box2D";
import * as PrefabManager from "../prefabs/PrefabManager";
import * as drawing from "./utils/drawing";
import * as scrollBars from "./utils/scrollBars";
import * as ui from "./utils/ui";
import * as verticeOptimize from "./utils/verticeOptimize";
import * as trigger from "./objects/trigger";
import * as dat from "../../libs/dat.gui";

import {
	lineIntersect,
	flatten,
	isConvex
} from './utils/extramath';

import {
	editorSettings
} from './utils/editorSettings';

import {
	game
} from "../Game";
import {
	Settings
} from "../Settings";


const camera = require("./utils/camera");
const PIXI = require('pixi.js');
const PIXIFILTERS = require('pixi-filters')

var b2Vec2 = Box2D.b2Vec2,
	b2AABB = Box2D.b2AABB,
	b2BodyDef = Box2D.b2BodyDef,
	b2Body = Box2D.b2Body,
	b2FixtureDef = Box2D.b2FixtureDef,
	b2Fixture = Box2D.b2Fixture,
	b2World = Box2D.b2World,
	b2MassData = Box2D.b2MassData,
	b2PolygonShape = Box2D.b2PolygonShape,
	b2CircleShape = Box2D.b2CircleShape,
	b2DebugDraw = Box2D.b2DebugDraw,
	b2MouseJointDef = Box2D.b2MouseJointDef;

const _B2dEditor = function () {

	this.initialPTM;
	this.PTM;
	this.world;
	this.debugGraphics = null;
	this.textures = null;
	this.currentTime;
	this.deltaTime;
	this.contactCallBackListener;

	this.activePrefabs = {};
	this.parallaxObject = [];
	this.animationGroups = [];
	this.prefabCounter = 0; //to ensure uniquenesss

	this.container = null;
	this.selectedTool = 0;
	this.admin = true; // for future to dissalow certain changes like naming
	this.breakPrefabs = false;

	this.selectedPhysicsBodies = [];
	this.selectedTextures = [];
	this.selectedPrefabs = {};

	this.selectedBoundingBox;
	this.startSelectionPoint;

	this.canvas;
	this.mousePosPixel;
	this.mousePosWorld;
	this.oldMousePosWorld;

	this.assetLists = {};
	this.tileLists = {}; // future this can be an opject with keys like bricks/green/etc.

	this.customGUIContainer = document.getElementById('custom-gui');

	this.editorIcons = [];
	this.triggerObjects = [];

	this.worldJSON;
	this.lastValidWorldJSON;

	this.copiedJSON = '';
	this.copyCenterPoint = {
		x: 0,
		y: 0
	};
	this.ui = ui;

	this.mouseDown = false;
	this.shiftDown = false;
	this.spaceDown = false;
	this.spaceCameraDrag = false;
	this.altDown = false;
	this.editing = true;

	this.lookupGroups = {};

	this.undoList = [];
	this.undoIndex = 0;

	this.editorSettings = editorSettings;
	this.camera = camera;
	this.cameraSize = {
		w: 400,
		h: 300
	};
	this.cameraShotData = {
		highRes: null,
		lowRes: null
	}

	this.selectingTriggerTarget = false;

	//COLORS
	this.selectionBoxColor = "0x5294AE";
	this.jointLineColor = "0x888888";


	this.load = function (loader) {
		loader.add("assets/images/gui/iconSet.json");
	}

	this.init = function (_container, _world, _PTM) {

		this.container = _container;
		this.world = _world;
		this.initialPTM = _PTM;
		this.PTM = _PTM;
		this.world.SetContactListener(this.B2dEditorContactListener);
		//Texture Draw
		this.textures = new PIXI.Graphics();
		this.activePrefabs = {};
		this.container.addChild(this.textures);

		//Editor Draw
		this.debugGraphics = new PIXI.Graphics();
		this.container.parent.addChild(this.debugGraphics);

		this.mousePosPixel = new b2Vec2(0, 0);
		this.mousePosWorld = new b2Vec2(0, 0);

		this.canvas = document.getElementById("canvas");

		ui.initGui();
		this.selectTool(this.tool_SELECT);
	}

	this.prefabListGuiState = {};
	this.showPrefabList = function () {
		const prefabPages = PrefabManager.getLibraryKeys();

		let targetFolder = ui.editorGUI.addFolder('Special Objects');
		targetFolder.open();

		['Prefabs', 'Blueprints'].forEach(folderName=>{
			if (this.assetSelectedGroup == "" || !prefabPages.includes(this.assetSelectedGroup)) this.assetSelectedGroup = prefabPages[0];
			let folder = targetFolder.addFolder(folderName);
			let self = this;

			if(folderName === 'Prefabs'){
				folder.add(self, "assetSelectedGroup", prefabPages).onChange(function (value) {

					let folder;
					for (var propt in targetFolder.__folders) {
						folder = targetFolder.__folders[propt];
						self.prefabListGuiState[propt] = folder.closed;
					}

					ui.destroyEditorGUI();
					ui.buildEditorGUI();

					self.showPrefabList();

					ui.registerDragWindow(ui.editorGUI);
				});
			}

			let innerFolder = folder.domElement.querySelector('ul');

			let targetLibrary;

			if(folderName === 'Prefabs') targetLibrary = PrefabManager.prefabLibrary.libraryDictionary[this.assetSelectedGroup];
			else if(folderName === 'Blueprints') targetLibrary = PrefabManager.prefabLibrary.libraryDictionary[PrefabManager.LIBRARY_BLUEPRINTS];

			for (let i = 0; i < targetLibrary.length; i++) {
				const prefabName = targetLibrary[i];

				let image = this.renderPrefabToImage(prefabName);
				const guiFunction = document.createElement('li');
				guiFunction.innerHTML = '<div><img src=""></img><div class="c"><div class="button"></div></div></div>';
				guiFunction.classList.add('cr', 'function');

				const guiFunctionImg = guiFunction.querySelector('img');
				guiFunctionImg.src = image.src;
				guiFunctionImg.setAttribute('title', prefabName);

				const maxImageHeight = 90;
				const maxImageWidth = 174;

				let functionHeight = 100;

				guiFunctionImg.onload = () => {
					if(guiFunctionImg.width>guiFunctionImg.height){
						if(guiFunctionImg.width>maxImageWidth){
							guiFunctionImg.style.width = `${maxImageWidth}px`;
						}
						const scaleFactor = parseFloat(guiFunctionImg.style.width)/guiFunctionImg.width;
						functionHeight = guiFunctionImg.height*scaleFactor+10;
					}else{
						if(guiFunctionImg.height>maxImageHeight){
							guiFunctionImg.style.height = `${maxImageHeight}px`;
						}else{
							functionHeight = guiFunctionImg.height+10;
						}
					}
					guiFunction.style.height = `${functionHeight}px`;
				}

				innerFolder.appendChild(guiFunction);
				guiFunctionImg.style.display = 'block';
				guiFunctionImg.style.margin = 'auto';
				guiFunction.setAttribute('prefabName', prefabName);

				const clickFunction = (e) =>{
					const guiAsset = guiFunction.parentNode.parentNode.parentNode.parentNode;
					const rect = guiAsset.getBoundingClientRect();
					const domx = Math.max(e.pageX, rect.right + 200);
					const domy = e.pageY;

					const x = domx / self.container.scale.x - self.container.x / self.container.scale.x;
					const y = domy / self.container.scale.y - self.container.y / self.container.scale.x;

					if(folderName === 'Prefabs'){
						const data = new self.prefabObject;
						data.x = x;
						data.y = y;
						data.prefabName = guiFunction.getAttribute('prefabName');
						data.settings = JSON.parse(JSON.stringify(PrefabManager.prefabLibrary[data.prefabName].class.settings));
						self.buildPrefabFromObj(data);
					}else if(folderName === 'Blueprints'){
						const prefabLookupObject = this.buildJSON(JSON.parse(PrefabManager.prefabLibrary[prefabName].json));
						const buildPrefabs = [];
						let allObjects = [].concat(prefabLookupObject._bodies, prefabLookupObject._textures, prefabLookupObject._joints)
						for(let j = 0; j<allObjects.length; j++){
							const object = allObjects[j];
							const prefabInstanceName = object.mySprite ? object.mySprite.data.prefabInstanceName : object.data.prefabInstanceName;
							if(prefabInstanceName){
								const targetPrefab = this.activePrefabs[prefabInstanceName];
								if(!buildPrefabs.includes(targetPrefab)){
									buildPrefabs.push(targetPrefab);
									targetPrefab.x += x;
									targetPrefab.y += y;
								}
							}
						}
						this.applyToObjects(this.TRANSFORM_MOVE, {x, y}, allObjects);
					}
				}
				guiFunction.addEventListener('click', clickFunction);
				guiFunction.addEventListener('dragend', clickFunction);
			}
		});
		for (let propt in targetFolder.__folders) {
			let folder = targetFolder.__folders[propt];
			folder.closed = self.prefabListGuiState[propt] === undefined ? true : self.prefabListGuiState[propt];
		}
	}
	this.openTextEditor = function () {
		const self = this;
		if (!self.selectedTextures[0].textSprite) return;
		const startValue = self.selectedTextures[0].textSprite.text;
		const callBack = (value) => {
			for (let j = 0; j < self.selectedTextures.length; j++) {
				let textContainer = self.selectedTextures[j];
				if (textContainer.textSprite) {
					textContainer.data.text = value;
					textContainer.textSprite.text = value;
				}
			}

		}
		ui.showTextEditor(startValue, callBack);
	}
	this.selectTool = function (i) {
		this.selectedTool = i;

		this.selectedTextures = [];
		this.selectedPhysicsBodies = [];
		this.selectedPrefabs = [];
		this.activeVertices = [];

		const buttons = document.querySelectorAll('.toolgui.button');
		buttons.forEach(button => { button.style.backgroundColor = '' });
		if(buttons[i]) buttons[i].style.backgroundColor = '#4F4F4F';

		ui.destroyEditorGUI();
		ui.buildEditorGUI();

		let targetFolder

		switch (i) {
			case this.tool_SELECT:
				ui.destroyEditorGUI();
				break
			case this.tool_GEOMETRY:
				ui.editorGUI.editData = this.editorGeometryObject;

				targetFolder = ui.editorGUI.addFolder('draw shapes');
				targetFolder.open();

				var shapes = ["Box", "Circle", "Triangle"];
				ui.editorGUI.editData.shape = shapes[0];
				targetFolder.add(ui.editorGUI.editData, "shape", shapes);
				targetFolder.addColor(ui.editorGUI.editData, "colorFill");
				targetFolder.addColor(ui.editorGUI.editData, "colorLine");
				targetFolder.add(ui.editorGUI.editData, "lineWidth", 0.0, 10.0).step(1.0);
				targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1);
				targetFolder.add(ui.editorGUI.editData, "isPhysicsObject");
				break
			case this.tool_POLYDRAWING:
				ui.destroyEditorGUI();
				break
			case this.tool_JOINTS:
				ui.editorGUI.editData = this.editorJointObject;

				targetFolder = ui.editorGUI.addFolder('add joints');
				targetFolder.open();

				this.addJointGUI(this.editorJointObject, targetFolder);

				break
			case this.tool_SPECIALS:
				this.showPrefabList();
				break
			case this.tool_TEXT:
				ui.editorGUI.editData = this.editorTextObject;

				targetFolder = ui.editorGUI.addFolder('add text');
				targetFolder.open();

				targetFolder.addColor(ui.editorGUI.editData, "textColor");
				targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1);
				targetFolder.add(ui.editorGUI.editData, "fontSize", 1, 100);

				var fonts = Settings.availableFonts;
				ui.editorGUI.editData.fontName = fonts[0];
				targetFolder.add(ui.editorGUI.editData, "fontName", fonts);

				var alignments = ["left", "center", "right"];
				ui.editorGUI.editData.textAlign = alignments[0];
				targetFolder.add(ui.editorGUI.editData, "textAlign", alignments);

				break
			case this.tool_ART:
				ui.editorGUI.editData = this.editorGraphicDrawingObject;

				targetFolder = ui.editorGUI.addFolder('draw graphics');
				targetFolder.open();
				//for (var key in ui.editorGUI.editData) {
				//	if (ui.editorGUI.editData.hasOwnProperty(key)) {
				//TODO:Load from saved data
				//	}
				//}
				targetFolder.addColor(ui.editorGUI.editData, "colorFill");
				targetFolder.addColor(ui.editorGUI.editData, "colorLine");
				var realVal = ui.editorGUI.editData.transparancy;
				ui.editorGUI.editData.transparancy = 0.1;
				targetFolder.add(ui.editorGUI.editData, "lineWidth", 0.0, 10.0).step(1.0);
				ui.editorGUI.editData.transparancy = realVal;

				targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1);
				targetFolder.add(ui.editorGUI.editData, "smoothen");
				break
			case this.tool_TRIGGER:
				ui.editorGUI.editData = this.editorTriggerObject;

				targetFolder = ui.editorGUI.addFolder('add triggers');
				targetFolder.open();

				var shapes = ["Circle", "Box"];
				ui.editorGUI.editData.shape = shapes[0];
				targetFolder.add(ui.editorGUI.editData, "shape", shapes);

				break
			case this.tool_SETTINGS:
				ui.editorGUI.editData = this.editorSettingsObject;

				targetFolder = ui.editorGUI.addFolder('game settings');
				targetFolder.open();

				const onChange = key=> val=>{
					editorSettings[key] = val;
				}

				targetFolder.add(ui.editorGUI.editData, 'physicsDebug').onChange(onChange('physicsDebug'));
				targetFolder.add(ui.editorGUI.editData, 'gravityX', -20, 20).step(0.1).onChange(onChange('gravityX'));
				targetFolder.add(ui.editorGUI.editData, 'gravityY', -20, 20).step(0.1).onChange(onChange('gravityY'));

				this.editorSettingsObject.type = self.object_SETTINGS;
				break
			case this.tool_CAMERA:
				ui.destroyEditorGUI();
				break
		}
		if (ui.editorGUI) ui.registerDragWindow(ui.editorGUI);
	}

	this.updateSelection = function () {
		//Joints
		var i;

		ui.destroyEditorGUI();


		var case_NOTHING = 0;
		var case_JUST_BODIES = 1;
		var case_JUST_TEXTURES = 2;
		var case_JUST_JOINTS = 3;
		var case_JUST_PREFABS = 4;
		var case_MULTIPLE = 5;
		var case_JUST_GRAPHICS = 6;
		var case_JUST_TRIGGERS = 7;
		var case_JUST_GRAPHICGROUPS = 8;
		var case_JUST_TEXTS = 9;
		var case_JUST_ANIMATIONGROUPS = 10;


		var currentCase = case_NOTHING;
		var prefabKeys = Object.keys(this.selectedPrefabs);

		if (prefabKeys.length > 0 && this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0) {
			var uniqueSelectedPrefabs = {};
			for (var i = 0; i < prefabKeys.length; i++) {
				uniqueSelectedPrefabs[this.activePrefabs[prefabKeys[i]].prefabName] = true;
			}
			if (Object.keys(uniqueSelectedPrefabs).length == 1) currentCase = case_JUST_PREFABS;
			else currentCase = case_MULTIPLE;
		} else if (this.selectedPhysicsBodies.length > 0 && this.selectedTextures.length == 0 && prefabKeys.length == 0) {
			var _triggers = []
			var _bodies = []
			var _body;
			for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
				_body = this.selectedPhysicsBodies[i];
				if (_body.mySprite.data.type == this.object_BODY) _bodies.push(_body);
				else if (_body.mySprite.data.type == this.object_TRIGGER) _triggers.push(_body);

				var editingMultipleObjects = (_bodies.length > 0 ? 1 : 0) + (_triggers.length > 0 ? 1 : 0);
				if (editingMultipleObjects > 1) currentCase = case_MULTIPLE;
				else if (_triggers.length > 0) currentCase = case_JUST_TRIGGERS;
				else currentCase = case_JUST_BODIES;
			}
		} else if (this.selectedTextures.length > 0 && this.selectedPhysicsBodies.length == 0 && prefabKeys.length == 0) {
			var _selectedTextures = [];
			var _selectedGraphics = [];
			var _selectedGraphicGroups = [];
			var _selectedAnimationGroups = [];
			var _selectedPinJoints = [];
			var _selectedSlideJoints = [];
			var _selectedDistanceJoints = [];
			var _selectedRopeJoints = [];
			var _selectedWheelJoints = [];
			var _selectedTexts = [];
			var _texture;
			for (i = 0; i < this.selectedTextures.length; i++) {
				_texture = this.selectedTextures[i];

				if (_texture.data && _texture.data.type == this.object_JOINT) {
					if (_texture.data.jointType == this.jointObject_TYPE_PIN) {
						_selectedPinJoints.push(_texture);
					} else if (_texture.data.jointType == this.jointObject_TYPE_SLIDE) {
						_selectedSlideJoints.push(_texture);
					} else if (_texture.data.jointType == this.jointObject_TYPE_DISTANCE) {
						_selectedDistanceJoints.push(_texture);
					} else if (_texture.data.jointType == this.jointObject_TYPE_ROPE) {
						_selectedRopeJoints.push(_texture);
					} else if (_texture.data.jointType == this.jointObject_TYPE_WHEEL) {
						_selectedWheelJoints.push(_texture);
					}
				} else if (_texture.data && _texture.data.type == this.object_GRAPHIC) {
					_selectedGraphics.push(_texture);
				} else if (_texture.data && _texture.data.type == this.object_GRAPHICGROUP) {
					_selectedGraphicGroups.push(_texture);
				} else if (_texture.data && _texture.data.type == this.object_ANIMATIONGROUP) {
					_selectedAnimationGroups.push(_texture);
				}else if (_texture.data && _texture.data.type == this.object_TEXT) {
					_selectedTexts.push(_texture);
				} else {
					_selectedTextures.push(_texture);
				}
			}
			var editingMultipleObjects = (_selectedTextures.length > 0 ? 1 : 0) + (_selectedGraphics.length > 0 ? 1 : 0) + (_selectedGraphicGroups.length > 0 ? 1 : 0) + (_selectedAnimationGroups.length > 0 ? 1 : 0) + (_selectedPinJoints.length > 0 ? 1 : 0) + (_selectedSlideJoints.length > 0 ? 1 : 0) + (_selectedDistanceJoints.length > 0 ? 1 : 0) + (_selectedRopeJoints.length > 0 ? 1 : 0) + (_selectedWheelJoints.length > 0 ? 1 : 0) + (_selectedTexts.length > 0 ? 1 : 0);
			if (editingMultipleObjects > 1) {
				currentCase = case_MULTIPLE;
			} else if (_selectedTextures.length > 0) {
				currentCase = case_JUST_TEXTURES;
			} else if (_selectedGraphics.length > 0) {
				currentCase = case_JUST_GRAPHICS;
			} else if (_selectedGraphicGroups.length > 0) {
				currentCase = case_JUST_GRAPHICGROUPS;
			} else if (_selectedAnimationGroups.length > 0) {
				currentCase = case_JUST_ANIMATIONGROUPS;
			}else if (_selectedTexts.length > 0) {
				currentCase = case_JUST_TEXTS;
			} else {
				currentCase = case_JUST_JOINTS;
			}
		} else if (this.selectedPhysicsBodies.length > 0 || this.selectedTextures.length > 0 || prefabKeys.length > 0) {
			currentCase = case_MULTIPLE;
		}

		if (currentCase == case_NOTHING) return;

		ui.buildEditorGUI();
		var dataJoint;
		var self = this;
		var controller;

		let targetFolder;

		//Init edit data;
		switch (currentCase) {
			case case_JUST_BODIES:
				ui.editorGUI.editData = new this.bodyObject;
				dataJoint = this.selectedPhysicsBodies[0].mySprite.data;
				if (this.selectedPhysicsBodies.length > 1) targetFolder = ui.editorGUI.addFolder('multiple bodies');
				else targetFolder = ui.editorGUI.addFolder('body');
				break;
			case case_JUST_TEXTURES:
				dataJoint = _selectedTextures[0].data;
				ui.editorGUI.editData = new this.textureObject;
				if (this.selectedTextures.length > 1) targetFolder = ui.editorGUI.addFolder('multiple textures');
				else targetFolder = ui.editorGUI.addFolder('texture');
				break;
			case case_JUST_GRAPHICS:
				dataJoint = _selectedGraphics[0].data;
				ui.editorGUI.editData = new this.graphicObject;
				if (this.selectedTextures.length > 1) targetFolder = ui.editorGUI.addFolder('multiple graphics');
				else targetFolder = ui.editorGUI.addFolder('graphic');
				break;
			case case_JUST_GRAPHICGROUPS:
				dataJoint = _selectedGraphicGroups[0].data;
				ui.editorGUI.editData = new this.graphicGroup;
				if (this.selectedTextures.length > 1) targetFolder = ui.editorGUI.addFolder('multiple graphicGroups');
				else targetFolder = ui.editorGUI.addFolder('graphicGroup');
				break;
			case case_JUST_ANIMATIONGROUPS:
				dataJoint = _selectedAnimationGroups[0].data;
				ui.editorGUI.editData = new this.animationGroup;
				if (this.selectedTextures.length > 1) targetFolder = ui.editorGUI.addFolder('multiple animations');
				else targetFolder = ui.editorGUI.addFolder('animation');
				break;
			case case_JUST_JOINTS:
				var selectedType = ""
				ui.editorGUI.editData = new this.jointObject;
				if (_selectedPinJoints.length > 0) {
					dataJoint = _selectedPinJoints[0].data;
					selectedType = "Pin";
				} else if (_selectedSlideJoints.length > 0) {
					dataJoint = _selectedSlideJoints[0].data;
					selectedType = "Slide";
				} else if (_selectedDistanceJoints.length > 0) {
					dataJoint = _selectedDistanceJoints[0].data;
					selectedType = "Distance";
				} else if (_selectedRopeJoints.length > 0) {
					dataJoint = _selectedRopeJoints[0].data;
					selectedType = "Rope";
				} else if (_selectedWheelJoints.length > 0) {
					dataJoint = _selectedWheelJoints[0].data;
					selectedType = "Wheel";
				}
				if (this.selectedTextures.length > 1) targetFolder = ui.editorGUI.addFolder('multiple joints');
				else targetFolder = ui.editorGUI.addFolder(`${selectedType} joint`);
				break;
			case case_JUST_PREFABS:
				ui.editorGUI.editData = new this.prefabObject;
				dataJoint = this.activePrefabs[prefabKeys[0]];
				if (this.selectedPrefabs.length > 1) targetFolder = ui.editorGUI.addFolder('multiple prefabs');
				else targetFolder = ui.editorGUI.addFolder('prefab ' + dataJoint.prefabName);
				break;
			case case_MULTIPLE:
				ui.editorGUI.editData = new this.multiObject;

				if (this.selectedTextures.length > 0) dataJoint = this.selectedTextures[0].data;
				else if (this.selectedPhysicsBodies.length > 0) dataJoint = this.selectedPhysicsBodies[0].mySprite.data;
				else dataJoint = this.activePrefabs[prefabKeys[0]];

				targetFolder = ui.editorGUI.addFolder('multiple objects');
				break;
			case case_JUST_TRIGGERS:
				ui.editorGUI.editData = new this.triggerObject;
				dataJoint = this.selectedPhysicsBodies[0].mySprite.data;
				if (this.selectedPhysicsBodies.length > 1) targetFolder = ui.editorGUI.addFolder('multiple triggers');
				else targetFolder = ui.editorGUI.addFolder('trigger');
				break;
			case case_JUST_TEXTS:
				dataJoint = _selectedTexts[0].data;
				ui.editorGUI.editData = new this.textObject;
				if (this.selectedTextures.length > 1) targetFolder = ui.editorGUI.addFolder('multiple texts');
				else targetFolder = ui.editorGUI.addFolder('text');
				break;
		}
		targetFolder.open();

		for (var key in ui.editorGUI.editData) {
			if (ui.editorGUI.editData.hasOwnProperty(key)) {
				ui.editorGUI.editData[key] = dataJoint[key];

				if (dataJoint.type == this.object_BODY && (key == "x" || key == "y")) {
					ui.editorGUI.editData[key] *= this.PTM;
				}
				if (key == "groups") {
					if (!this.isSelectionPropertyTheSame("groups")) ui.editorGUI.editData.groups = "-";
				}
			}
		}

		//Populate default GUI Fields
		targetFolder.add(ui.editorGUI.editData, "x").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value - this.initialValue;
			this.initialValue = value;
		});

		targetFolder.add(ui.editorGUI.editData, "y").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value - this.initialValue;
			this.initialValue = value;
		});
		targetFolder.add(ui.editorGUI.editData, "rotation").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value - this.initialValue;
			this.initialValue = value;
		});
		if (currentCase != case_MULTIPLE && currentCase != case_JUST_JOINTS && currentCase != case_JUST_ANIMATIONGROUPS && currentCase != case_JUST_PREFABS) {

			var aabb = this.computeObjectsAABB(this.selectedPhysicsBodies, this.selectedTextures, true);
			var currentSize = {
				width: aabb.GetExtents().x * 2 * this.PTM,
				height: aabb.GetExtents().y * 2 * this.PTM
			}

			ui.editorGUI.editData.width = currentSize.width;
			ui.editorGUI.editData.height = currentSize.height;


			targetFolder.add(ui.editorGUI.editData, "width").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});
			targetFolder.add(ui.editorGUI.editData, "height").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});
		}
		if (prefabKeys.length == 0) {
			targetFolder.add(ui.editorGUI.editData, "groups").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});
		}
		if (this.selectedTextures.length + this.selectedPhysicsBodies.length == 1 && prefabKeys.length == 0) {
			targetFolder.add(ui.editorGUI.editData, "refName").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});
		}
		//Populate custom  fields
		switch (currentCase) {
			case case_JUST_BODIES:
				targetFolder.add(ui.editorGUI.editData, "tileTexture", this.tileLists).onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});
				if (ui.editorGUI.editData.colorFill.length > 1) {
					ui.editorGUI.editData.transparancy = ui.editorGUI.editData.transparancy[0];
					controller = targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));
				} else {
					ui.editorGUI.editData.colorFill = ui.editorGUI.editData.colorFill[0];
					ui.editorGUI.editData.colorLine = ui.editorGUI.editData.colorLine[0];
					ui.editorGUI.editData.lineWidth = ui.editorGUI.editData.lineWidth[0];
					ui.editorGUI.editData.transparancy = ui.editorGUI.editData.transparancy[0];
					ui.editorGUI.editData.density = ui.editorGUI.editData.density[0];



					controller = targetFolder.addColor(ui.editorGUI.editData, "colorFill");
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));
					controller = targetFolder.addColor(ui.editorGUI.editData, "colorLine");
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));
					controller = targetFolder.add(ui.editorGUI.editData, "lineWidth", 0.0, 10.0).step(1.0);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));
					controller = targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));
					controller = targetFolder.add(ui.editorGUI.editData, "density", 0, 1000).step(0.1);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value
					}.bind(controller));
				}
				targetFolder.add(ui.editorGUI.editData, "fixed").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				});
				targetFolder.add(ui.editorGUI.editData, "awake").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				});
				controller = targetFolder.add(ui.editorGUI.editData, "collision", 0, 7).step(1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				}.bind(controller));


				let bodyIsGroup = false;
				for (let i = 0; i < this.selectedPhysicsBodies.length; i++) {
					if (this.selectedPhysicsBodies[i].mySprite.data.vertices.length > 1 || this.selectedPhysicsBodies[i].myTexture) {
						bodyIsGroup = true;
						break;
					}
				}
				if (!bodyIsGroup) {
					ui.editorGUI.editData.convertToGraphic = function () {};
					var label = this.selectedPhysicsBodies.length == 1 ? "Convert to Graphic" : "Convert to Graphics";
					controller = targetFolder.add(ui.editorGUI.editData, "convertToGraphic").name(label);
					ui.editorGUI.editData.convertToGraphic = (function (_c) {
						return function () {
							if (_c.domElement.previousSibling.innerText != "Click to Confirm") {
								_c.name("Click to Confirm");
							} else {
								_c.name(label);
								self.convertSelectedBodiesToGraphics();
							}
						}
					})(controller);
				}
				break;
			case case_JUST_TEXTURES:
				controller = targetFolder.addColor(ui.editorGUI.editData, "tint");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "parallax", -3, 3).step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "repeatTeleportX").step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "repeatTeleportY").step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				break;
			case case_JUST_GRAPHICS:
				targetFolder.add(ui.editorGUI.editData, "tileTexture", this.tileLists).onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});
				controller = targetFolder.addColor(ui.editorGUI.editData, "colorFill");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.addColor(ui.editorGUI.editData, "colorLine");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "lineWidth", 0.0, 10.0).step(1.0);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "parallax", -3, 3).step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "repeatTeleportX").step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "repeatTeleportY").step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				ui.editorGUI.editData.convertToBody = function () {};
				var label = this.selectedTextures.length == 1 ? "Convert to PhysicsBody" : "Convert to PhysicsBodies";
				controller = targetFolder.add(ui.editorGUI.editData, "convertToBody").name(label);
				ui.editorGUI.editData.convertToBody = (function (_c) {
					return function () {
						if (_c.domElement.previousSibling.innerText != "Click to Confirm") {
							_c.name("Click to Confirm");
						} else {
							_c.name(label);
							self.convertSelectedGraphicsToBodies();
						}
					}
				})(controller)

				break;
			case case_JUST_GRAPHICGROUPS:
				controller = targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "parallax", -3, 3).step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "repeatTeleportX").step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "repeatTeleportY").step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				break;
			case case_JUST_ANIMATIONGROUPS:
				controller = targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "parallax", -3, 3).step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "repeatTeleportX").step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "repeatTeleportY").step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "fps", 1, 60).step(1.0);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "playing");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				break;
			case case_JUST_JOINTS:
				this.addJointGUI(dataJoint, targetFolder);
				break;
			case case_JUST_PREFABS:
				var prefabObject = this.activePrefabs[Object.keys(this.selectedPrefabs)[0]];
				var prefabClass = PrefabManager.prefabLibrary[prefabObject.prefabName].class;
				var prefabObjectSettings = prefabObject.settings;
				var prefabClassSettings = prefabClass.settings;
				var prefabClassOptions = prefabClass.settingsOptions;


				for (var key in prefabClassOptions) {
					if (prefabClassOptions.hasOwnProperty(key) && prefabClassOptions[key] !== undefined) {
						var argument;
						ui.editorGUI.editData[key] = prefabObjectSettings[key];

						if(ui.editorGUI.editData[key] === undefined) ui.editorGUI.editData[key] = prefabClassSettings[key];

						if (prefabClassOptions[key] instanceof Object && !(prefabClassOptions[key] instanceof Array)) {
							argument = prefabClassOptions[key];
							controller = targetFolder.add(ui.editorGUI.editData, key, argument.min, argument.max).step(argument.step)
							controller.onChange(function (value) {
								this.humanUpdate = true;
								this.targetValue = value
							}.bind(controller));
						} else {
							if (prefabClassOptions[key] instanceof Array) argument = prefabClassOptions[key];
							else argument = null;
							controller = targetFolder.add(ui.editorGUI.editData, key, argument);
							controller.onChange(function (value) {
								this.humanUpdate = true;
								this.targetValue = value
							}.bind(controller));
						}
					}
				}

				break;
			case case_MULTIPLE:
				break;
			case case_JUST_TRIGGERS:
				trigger.addTriggerGUI(dataJoint, targetFolder);
				break;
			case case_JUST_TEXTS:

				ui.editorGUI.editData.openTextEditorCaller = function () {};
				controller = targetFolder.add(ui.editorGUI.editData, "openTextEditorCaller").name("Edit Text");
				ui.editorGUI.editData.openTextEditorCaller = self.openTextEditor.bind(this);


				controller = targetFolder.addColor(ui.editorGUI.editData, "textColor");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				controller = targetFolder.add(ui.editorGUI.editData, "fontSize", 1, 100).step(1.0);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				targetFolder.add(ui.editorGUI.editData, 'fontName', Settings.availableFonts).onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});
				targetFolder.add(ui.editorGUI.editData, 'textAlign', ['left', 'center', 'right']).onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});
				controller = targetFolder.add(ui.editorGUI.editData, "parallax", -3, 3).step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "repeatTeleportX").step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "repeatTeleportY").step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				break;
		}

		const hasAnimation = this.selectedTextures.find(obj => obj.data.type === this.object_ANIMATIONGROUP);
		const hasOthers = this.selectedTextures.find(obj => obj.data.type !== this.object_ANIMATIONGROUP);

		if (this.selectedPhysicsBodies.length + this.selectedTextures.length > 1) {
			
			let canGroup = true;
			if(hasAnimation && hasOthers) canGroup = false; // we cant group when we have mixed animations and other graphics
			if(canGroup && hasAnimation && this.selectedTextures.length > 1) canGroup = false; // we cant group multiple animations

			if(canGroup){
				ui.editorGUI.editData.groupObjects = () => {
					self.groupObjects();
				};
				controller = targetFolder.add(ui.editorGUI.editData, "groupObjects").name('Group Objects');
			}
		} else {
			if (this.selectedPhysicsBodies.length == 1) {
				if (this.selectedPhysicsBodies[0].myTexture) {
					ui.editorGUI.editData.ungroupObjects = () => {
						self.ungroupObjects();
					};
					controller = targetFolder.add(ui.editorGUI.editData, "ungroupObjects").name('UnGroup Objects');
				}
			} else if (this.selectedTextures.length == 1) {
				if (this.selectedTextures[0].data.type == this.object_GRAPHICGROUP) {
					ui.editorGUI.editData.ungroupObjects = () => {
						self.ungroupObjects();
					};
					controller = targetFolder.add(ui.editorGUI.editData, "ungroupObjects").name('UnGroup Objects');
				}else if (this.selectedTextures[0].data.type == this.object_ANIMATIONGROUP) {
					ui.editorGUI.editData.breakAnimation = () => {
						self.ungroupObjects();
					};
					controller = targetFolder.add(ui.editorGUI.editData, "breakAnimation").name('Break Animation');
				}
			}
		}
		if(this.selectedPhysicsBodies.length === 0 && this.selectedTextures.length > 1){
			if(!hasAnimation){
				ui.editorGUI.editData.animateObjects = () => {
					self.createAnimationGroup();
				};
				controller = targetFolder.add(ui.editorGUI.editData, "animateObjects").name('Create Animation');
			}
		}


		//TODO:Maybe add admin mode / pro mode for lockselection
		if (ui.editorGUI.editData.lockselection == undefined) ui.editorGUI.editData.lockselection = false;
		targetFolder.add(ui.editorGUI.editData, "lockselection").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value;
		});
		ui.registerDragWindow(ui.editorGUI);
	}
	this.addJointGUI = function (dataJoint, _folder) {
		var self = this;
		var controller;
		var folder;
		var jointTypes = ["Pin", "Slide", "Distance", "Rope", "Wheel"];
		ui.editorGUI.editData.typeName = jointTypes[dataJoint.jointType];
		_folder.add(ui.editorGUI.editData, "typeName", jointTypes).onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value
		});
		_folder.add(ui.editorGUI.editData, "collideConnected").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value
		});

		if (dataJoint.jointType == this.jointObject_TYPE_PIN || dataJoint.jointType == this.jointObject_TYPE_SLIDE || dataJoint.jointType == this.jointObject_TYPE_WHEEL) {

			folder = _folder.addFolder('enable motor');
			folder.add(ui.editorGUI.editData, "enableMotor").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});

			controller = folder.add(ui.editorGUI.editData, "maxMotorTorque", 0, Settings.motorForceLimit);
			controller.onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			}.bind(controller));

			if (dataJoint.jointType == this.jointObject_TYPE_SLIDE) controller.name("maxMotorForce");

			controller = folder.add(ui.editorGUI.editData, "motorSpeed", -Settings.motorSpeedLimit, Settings.motorSpeedLimit);
			controller.onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			}.bind(controller));

			if (dataJoint.jointType !== this.jointObject_TYPE_WHEEL) {

				folder = _folder.addFolder('enable limits');
				folder.add(ui.editorGUI.editData, "enableLimit").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});

				if (dataJoint.jointType == this.jointObject_TYPE_PIN) {
					controller = folder.add(ui.editorGUI.editData, "upperAngle", 0, 180);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));

					controller = folder.add(ui.editorGUI.editData, "lowerAngle", -180, 0);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value
					}.bind(controller));
				} else {
					controller = folder.add(ui.editorGUI.editData, "upperLimit", 0, Settings.slideJointDistanceLimit);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));

					controller = folder.add(ui.editorGUI.editData, "lowerLimit", -Settings.slideJointDistanceLimit, 0);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value
					}.bind(controller));
				}
			}
		}
		if (dataJoint.jointType == this.jointObject_TYPE_DISTANCE || dataJoint.jointType == this.jointObject_TYPE_WHEEL) {
			folder = _folder.addFolder('spring');

			controller = folder.add(ui.editorGUI.editData, "frequencyHz", 0, 10).step(0.1);
			controller.onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			}.bind(controller));

			controller = folder.add(ui.editorGUI.editData, "dampingRatio", 0.0, 1.0).step(0.1);
			controller.onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			}.bind(controller));
		}
	}

	this.isSelectionPropertyTheSame = function (property) {
		var data = null;
		var compareValue = null;
		var i;
		if (this.selectedPhysicsBodies.length > 0) {
			for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
				data = this.selectedPhysicsBodies[i].mySprite.data;
				if (compareValue == null) compareValue = data[property];
				else if (data[property] != compareValue) {
					return false;
				}
			}
		}
		if (this.selectedTextures.length > 0) {
			for (i = 0; i < this.selectedTextures.length; i++) {
				data = this.selectedTextures[i].data;
				if (compareValue == null) compareValue = data[property];
				else if (data[property] != compareValue) {
					return false;
				}

			}
		}
		return true;
	}

	this.deleteObjects = function (arr) {

		let i, obj;

		for (i = 0; i < arr.length; i++) {
			obj = arr[i];
			obj.destroyed = true;
			if (obj instanceof Box2D.b2Joint) {
				let joint = obj;
				if (joint.myTriggers != undefined) {
					var j;
					var myTrigger;
					for (j = 0; j < (joint.myTriggers ? joint.myTriggers.length : 0); j++) {
						myTrigger = joint.myTriggers[j];
						trigger.removeTargetFromTrigger(myTrigger, joint);
						j--;
					}
				}
				this.removeObjectFromLookupGroups(joint, joint.spriteData);
				this.world.DestroyJoint(joint);

				//TODO: remove joints from lookup object???


			} else if (obj instanceof this.prefabObject) {
				arr = arr.concat(this.lookupGroups[obj.key]._bodies, this.lookupGroups[obj.key]._textures, this.lookupGroups[obj.key]._joints);
				delete this.activePrefabs[obj.key];
			} else if (obj.data) {
				//graphic object
				var sprite = obj;
				this.removeObjectFromLookupGroups(sprite, sprite.data);
				if (sprite.data && sprite.data.type == this.object_JOINT) {
					var j;
					var myJoint;
					if (sprite.bodies[0] != undefined) {
						for (j = 0; j < sprite.bodies[0].myJoints.length; j++) {
							myJoint = sprite.bodies[0].myJoints[j];
							if (myJoint == sprite) {
								sprite.bodies[0].myJoints.splice(j, 1);
								j--;
							}
						}
						if (sprite.bodies[0].myJoints.length == 0) sprite.bodies[0].myJoints = undefined;
					}
					if (sprite.bodies.length > 1 && sprite.bodies[1] != undefined) {
						for (j = 0; j < sprite.bodies[1].myJoints.length; j++) {
							myJoint = sprite.bodies[1].myJoints[j];
							if (myJoint == sprite) {
								sprite.bodies[1].myJoints.splice(j, 1);
								j--;
							}
						}
						if (sprite.bodies[1].myJoints.length == 0) sprite.bodies[1].myJoints = undefined;
					}
					for (j = 0; j < this.editorIcons.length; j++) {
						if (this.editorIcons[j] == sprite) {
							this.editorIcons.splice(j, 1);
						}
					}
				}
				if (sprite.myTriggers != undefined) {
					for (let j = 0; j < sprite.myTriggers.length; j++) {
						let myTrigger = sprite.myTriggers[j];
						trigger.removeTargetFromTrigger(myTrigger, sprite);
						if(!sprite.myTriggers) break;
						j--;
					}
				}


				sprite.parent.removeChild(sprite);
				sprite.destroy({
					children: true,
					texture: false,
					baseTexture: false
				});
			} else if (obj.mySprite.data) {
				var b = obj;
				this.removeObjectFromLookupGroups(b, b.mySprite.data);

				if (b.mySprite.data && b.mySprite.data.type == this.object_TRIGGER) {
					var j;
					var k;
					var myTrigger;
					for (j = 0; j < b.mySprite.targets.length; j++) {
						trigger.removeTargetFromTrigger(b, b.mySprite.targets[j]);
						j--;
					}
					for (j = 0; j < this.triggerObjects.length; j++) {
						if (this.triggerObjects[j] == b) {
							this.triggerObjects.splice(j, 1);
							break;
						}
					}
				}
				if (b.mySprite.myTriggers != undefined) {
					var j;
					var myTrigger;
					for (j = 0; j < (b.mySprite.myTriggers ? b.mySprite.myTriggers.length : 0); j++) {
						myTrigger = b.mySprite.myTriggers[j];
						trigger.removeTargetFromTrigger(myTrigger, b.mySprite);
					}
				}
				b.mySprite.destroyed = true;
				b.mySprite.parent.removeChild(b.mySprite);
				b.mySprite.destroy({
					children: true,
					texture: false,
					baseTexture: false
				});
				b.mySprite = null;

				if (b.myJoints != undefined) {
					var j;
					var myJoint;
					var k;
					for (j = 0; j < b.myJoints.length; j++) {
						myJoint = b.myJoints[j];
						var alreadySelected = false;
						for (k = 0; k < arr.length; k++) {
							if (arr[k] == myJoint) {
								alreadySelected = true;
							}
						}
						if (!alreadySelected) arr.push(myJoint);
					}
				} else {
					var jointEdge = b.GetJointList();
					while (jointEdge) {
						if (jointEdge.joint.spriteData) arr.push(jointEdge.joint);
						jointEdge = jointEdge.next;
					}

				}
				if (b.myTexture) {
					var sprite = b.myTexture;
					sprite.parent.removeChild(sprite);
					sprite.destroy({
						children: true,
						texture: false,
						baseTexture: false
					});
				}
				if (b.connectedSpike) {
					let tarIndex = b.connectedSpike.connectedBodies.indexOf(b);
					b.connectedSpike.connectedBodies.splice(tarIndex);
					b.connectedSpike.connectedJoints.splice(tarIndex);
				}
				this.world.DestroyBody(b);
			}
		}
	}
	this.deleteSelection = function () {
		var toBeDeletedPrefabs = []
		for (var key in this.selectedPrefabs) {
				if (this.selectedPrefabs.hasOwnProperty(key)) {
				toBeDeletedPrefabs.push(this.activePrefabs[key]);
			}
		}
        this.deleteObjects([].concat(this.selectedPhysicsBodies, this.selectedTextures, toBeDeletedPrefabs));
		this.selectedPhysicsBodies = [];
		this.selectedTextures = [];
		this.selectedPrefabs = {};
		this.updateSelection();
	}

	this.copySelection = function () {

		var i;
		var body;
		var copyArray = [];
		var cloneObject;

		if (this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0 && Object.keys(this.selectedPrefabs).length == 0) return;

		// sort all objects based on childIndex
		for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
			body = this.selectedPhysicsBodies[i];
			this.updateObject(body.mySprite, body.mySprite.data);

			cloneObject = this.parseArrObject(JSON.parse(this.stringifyObject(body.mySprite.data)));

			cloneObject = JSON.parse(JSON.stringify(body.mySprite.data))

			copyArray.push({
				ID: cloneObject.ID,
				data: cloneObject
			})

			if (body.myTexture) {
				this.updateObject(body.myTexture, body.myTexture.data);
				cloneObject = this.parseArrObject(JSON.parse(this.stringifyObject(body.myTexture.data)));
				copyArray.push({
					ID: cloneObject.ID,
					data: cloneObject
				});
			}
		}
		var sprite;
		for (i = 0; i < this.selectedTextures.length; i++) {
			sprite = this.selectedTextures[i];
			this.updateObject(sprite, sprite.data);

			cloneObject = this.parseArrObject(JSON.parse(this.stringifyObject(sprite.data)), true);
			copyArray.push({
				ID: cloneObject.ID,
				data: cloneObject
			})
		}
		var prefabKeys = Object.keys(this.selectedPrefabs);
		for (i = 0; i < prefabKeys.length; i++) {
			const prefab = this.activePrefabs[prefabKeys[i]];
			if (!PrefabManager.prefabLibrary[prefab.prefabName].class.forceUnique) {
				this.updateObject(null, prefab);

				// count children
				const lookupObject = prefab.class.lookupObject
				let childCount = lookupObject._bodies.length+lookupObject._textures.length+lookupObject._joints.length;
				lookupObject._bodies.forEach(body=>{
					if(body.myTexture) childCount++;
				})

				cloneObject = this.parseArrObject(JSON.parse(this.stringifyObject(prefab)));
				copyArray.push({
					ID: prefab.ID,
					childCount,
					data: cloneObject
				});
			}
		}

		copyArray.sort(function (a, b) {
			return a.ID - b.ID;
		});
		// Fix copied joints (make sure no anchor body is null)
		var data;
		var j;
		for (i = 0; i < copyArray.length; i++) {
			data = copyArray[i].data;
			if (data.type == this.object_JOINT) {
				//searching object A
				var foundBodyA = false;
				let realIndex = 0;

				for (j = 0; j < copyArray.length; j++) {

					if (copyArray[j].ID == data.bodyA_ID) {
						foundBodyA = true;
						data.bodyA_ID = realIndex;
						break;
					}
					realIndex += copyArray[j].childCount || 1;

				}
				var foundBodyB = false;
				realIndex = 0;
				if (data.bodyB_ID != undefined) {
					for (j = 0; j < copyArray.length; j++) {

						if (copyArray[j].ID == data.bodyB_ID) {
							foundBodyB = true;
							data.bodyB_ID = realIndex;
							break;
						}
						realIndex += copyArray[j].childCount || 1;

					}

				} else {
					foundBodyB = true;
				}

				if (!foundBodyA || !foundBodyB) {
					copyArray.splice(i, 1);
					i--;
				}
			} else if (data.type == this.object_TEXTURE || data.type == this.object_GRAPHIC || data.type == this.object_GRAPHICGROUP || data.type == this.object_TEXT || data.type == this.object_ANIMATIONGROUP) {
				let realIndex = 0;
				for (j = 0; j < copyArray.length; j++) {
					if (copyArray[j].ID == data.bodyID) {
						data.bodyID = realIndex;
						break;
					}
					realIndex += copyArray[j].childCount || 1;
				}
			}
		}

		//fix copied triggerObjects
		let k;
		for (i = 0; i < copyArray.length; i++) {
			data = copyArray[i].data;
			if (data.type == this.object_TRIGGER) {
				for (j = 0; j < data.triggerObjects.length; j++) {
					var foundBody = -1;
					let realIndex = 0;
					for (k = 0; k < copyArray.length; k++) {
						if (data.triggerObjects[j] == copyArray[k].ID) {
							// NEED TO ACCOUNT FOR EXTRA BODIES BEING CREATED
							foundBody = realIndex;
							break;
						}
						realIndex += copyArray[k].childCount || 1;
					}
					if (foundBody >= 0) data.triggerObjects[j] = foundBody;
					else {
						data.triggerObjects.splice(j, 1);
						data.triggerActions.splice(j, 1);
						j--;
					}
				}
			}
		}

		var copyJSON = '{"objects":[';
		this.copyCenterPoint = {
			x: 0,
			y: 0
		};
		for (i = 0; i < copyArray.length; i++) {
			if (i != 0) copyJSON += ',';
			data = copyArray[i].data;
			data.ID = i;
			copyJSON += this.stringifyObject(data);
			if (data.type == this.object_BODY || data.type == this.object_TRIGGER) {
				this.copyCenterPoint.x += data.x * this.PTM;
				this.copyCenterPoint.y += data.y * this.PTM;

			} else {
				this.copyCenterPoint.x += data.x;
				this.copyCenterPoint.y += data.y;
			}

		}
		this.copyCenterPoint.x = this.copyCenterPoint.x / copyArray.length;
		this.copyCenterPoint.y = this.copyCenterPoint.y / copyArray.length;
		copyJSON += ']}';


		if (copyArray.length == 0) this.copiedJSON = null;
		else this.copiedJSON = JSON.parse(copyJSON);
		console.log("*******************COPY JSON*********************");
		console.log(copyJSON);
		console.log("*************************************************");
	}
	this.cutSelection = function () {
		this.copySelection();
		if (this.copiedJSON != null) this.deleteSelection();
	}

	this.pasteSelection = function () {
		if (this.copiedJSON != null && this.copiedJSON != '') {
			var startChildIndex = this.textures.children.length;

			this.buildJSON(this.copiedJSON);

			this.selectedPhysicsBodies = [];
			this.selectedTextures = [];
			this.selectedPrefabs = {};

			var i;
			var sprite;
			var movX = this.copyCenterPoint.x - (this.mousePosWorld.x * this.PTM);
			var movY = this.copyCenterPoint.y - (this.mousePosWorld.y * this.PTM);

			if (this.shiftDown) {
				movX = 0;
				movY = 0;
			}

			for (i = startChildIndex; i < this.textures.children.length; i++) {
				sprite = this.textures.getChildAt(i);
				if (sprite.myBody != undefined && sprite.data.type != this.object_TEXTURE && sprite.data.type != this.object_GRAPHIC && sprite.data.type != this.object_GRAPHICGROUP && sprite.data.type != this.object_TEXT && sprite.data.type != this.object_ANIMATIONGROUP) {
					var pos = sprite.myBody.GetPosition();
					pos.x -= movX / this.PTM;
					pos.y -= movY / this.PTM;
					sprite.myBody.SetPosition(pos);

					if (sprite.data.prefabInstanceName) this.selectedPrefabs[sprite.data.prefabInstanceName] = true;
					else this.selectedPhysicsBodies.push(sprite.myBody);
				} else {
					sprite.x -= movX;
					sprite.y -= movY;

					if (!sprite.originalGraphic && sprite.myBody == null) {
						if (sprite.data.prefabInstanceName) this.selectedPrefabs[sprite.data.prefabInstanceName] = true;
						else this.selectedTextures.push(sprite);
					}
				}
			}

			var prefabKeys = Object.keys(this.selectedPrefabs);
			for (i = 0; i < prefabKeys.length; i++) {
				this.activePrefabs[prefabKeys[i]].x -= movX;
				this.activePrefabs[prefabKeys[i]].y -= movY;
			}

			this.updateSelection();
		}
	}
	this.doEditor = function () {
		this.debugGraphics.clear();
		while (this.debugGraphics.children.length > 0) {
			var child = this.debugGraphics.getChildAt(0);
			this.debugGraphics.removeChild(child);
		}

		if (this.selectedTool == this.tool_SELECT || this.selectedTool == this.tool_JOINTS) {
			if (this.selectingTriggerTarget) this.doTriggerTargetSelection();
			else this.doSelection();
		} else if (this.selectedTool == this.tool_POLYDRAWING) {
			this.doVerticesLineDrawing(true);
		} else if (this.selectedTool == this.tool_GEOMETRY) {
			this.doGeometryDrawing();
		} else if (this.selectedTool == this.tool_CAMERA) {
			this.doCamera();
		} else if (this.selectedTool == this.tool_ART) {
			this.doVerticesDrawing();
		}

		// Draw 0,0 reference
		this.debugGraphics.lineStyle(3, "0x00FF00", 1);
		const crossSize = 100;
		this.debugGraphics.moveTo(this.container.x, -crossSize + this.container.y);
		this.debugGraphics.lineTo(this.container.x, crossSize + this.container.y);
		this.debugGraphics.moveTo(-crossSize + this.container.x, this.container.y);
		this.debugGraphics.lineTo(crossSize + this.container.x, this.container.y);

		this.debugGraphics.moveTo(this.container.x - editorSettings.worldSize.width / 2 * this.container.scale.x, -crossSize + this.container.y);
		this.debugGraphics.lineTo(this.container.x - editorSettings.worldSize.width / 2 * this.container.scale.x, crossSize + this.container.y);
		this.debugGraphics.moveTo(-crossSize + this.container.x - editorSettings.worldSize.width / 2 * this.container.scale.x, this.container.y);
		this.debugGraphics.lineTo(crossSize + this.container.x - editorSettings.worldSize.width / 2 * this.container.scale.x, this.container.y);

		this.debugGraphics.moveTo(this.container.x + editorSettings.worldSize.width / 2 * this.container.scale.x, -crossSize + this.container.y);
		this.debugGraphics.lineTo(this.container.x + editorSettings.worldSize.width / 2 * this.container.scale.x, crossSize + this.container.y);
		this.debugGraphics.moveTo(-crossSize + this.container.x + editorSettings.worldSize.width / 2 * this.container.scale.x, this.container.y);
		this.debugGraphics.lineTo(crossSize + this.container.x + editorSettings.worldSize.width / 2 * this.container.scale.x, this.container.y);


		this.doEditorGUI();
	}
	this.updateBodyPosition = function (body) {
		if (body.myTexture) {

			var angle = body.GetAngle() - body.myTexture.data.texturePositionOffsetAngle;
			body.myTexture.x = body.GetPosition().x * this.PTM + body.myTexture.data.texturePositionOffsetLength * Math.cos(angle);
			body.myTexture.y = body.GetPosition().y * this.PTM + body.myTexture.data.texturePositionOffsetLength * Math.sin(angle);
			// body.mySprite.x = body.GetPosition().x * this.PTM;
			// body.mySprite.y = body.GetPosition().y * this.PTM;
			//if(body.myTexture.rotation !=  body.GetAngle() - body.myTexture.data.textureAngleOffset) // pixi updatetransform fix
			body.myTexture.rotation = body.GetAngle() - body.myTexture.data.textureAngleOffset;

		}
		if (body.mySprite && body.mySprite.visible) {
			body.mySprite.x = body.GetPosition().x * this.PTM;
			body.mySprite.y = body.GetPosition().y * this.PTM;
			//if(body.mySprite.rotation != body.GetAngle()) // pixi updatetransform fix
			body.mySprite.rotation = body.GetAngle();
			if(body.myTileSprite && body.myTileSprite.fixTextureRotation) body.myTileSprite.updateMeshVerticeRotation();
		}
	}
	this.run = function () {
		//update textures
		if (this.editing && game.gameState == game.GAMESTATE_EDITOR) {
			this.doEditor();
		}

		this.deltaTime = Date.now() - this.currentTime;
		this.currentTime = Date.now();

		var body = this.world.GetBodyList();
		var i = 0
		while (body) {
			if(body.lockPositionForOneFrame){
				// fixes PostSolve displacements (e.g. Arrow)
				body.SetPosition(body.lockPositionForOneFrame);
				body.lockPositionForOneFrame = undefined;
			}
			this.updateBodyPosition(body);
			i++;
			body = body.GetNext();
		}

		//update objects
		if (!this.editing) {
			var key;
			for (key in this.activePrefabs) {
				if (this.activePrefabs.hasOwnProperty(key)) {
					this.activePrefabs[key].class.update();
				}
			}
			for (i = 0; i < this.triggerObjects.length; i++) {
				this.triggerObjects[i].class.update();
			}
			this.handleParallax();
			//handle animations
			this.animationGroups.forEach(animationGroup=>{
				if(animationGroup.playing) animationGroup.updateAnimation(this.deltaTime);
			})

		}
	}

	this.handleParallax = function(){
		this.parallaxObject.forEach(sprite=>{
			if(sprite.data.parallax){
				sprite.x = -(this.container.x-window.innerWidth/2)/this.container.scale.x*sprite.data.parallax+sprite.parallaxStartPosition.x
				sprite.y = -(this.container.y-window.innerHeight/2)/this.container.scale.x*sprite.data.parallax+sprite.parallaxStartPosition.y
			}
			if(sprite.data.repeatTeleportX){
				while(sprite.x+(this.container.x-window.innerWidth/2)/this.container.scale.x > sprite.data.repeatTeleportX) sprite.x-=sprite.data.repeatTeleportX*2
				while(sprite.x+(this.container.x-window.innerWidth/2)/this.container.scale.x <-sprite.data.repeatTeleportX) sprite.x+=sprite.data.repeatTeleportX*2
			}
			if(sprite.data.repeatTeleportY){
				while(sprite.y+(this.container.y-window.innerWidth/2)/this.container.scale.y > sprite.data.repeatTeleportY) sprite.y-=sprite.data.repeatTeleportY*2
				while(sprite.y+(this.container.y-window.innerWidth/2)/this.container.scale.y <-sprite.data.repeatTeleportY) sprite.y+=sprite.data.repeatTeleportY*2
			}
		});
	}



	var self = this;
	this.bodyObject = function () {
		this.type = self.object_BODY;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		//
		this.ID = 0;
		this.colorFill = "#999999";
		this.colorLine = "#000";
		this.transparancy = 1.0;
		this.fixed = true;
		this.awake = true;
		this.vertices = [{
			x: 0,
			y: 0
		}, {
			x: 0,
			y: 0
		}];
		this.density = 1;
		this.collision = 0;
		this.radius = 0;
		this.tileTexture = "";
		this.lockselection = false;
		this.lineWidth = 1.0;
	}
	this.textureObject = function () {
		this.type = self.object_TEXTURE;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		//
		this.ID = 0;
		this.textureName = null;
		this.bodyID = null;
		this.texturePositionOffsetLength = null;
		this.texturePositionOffsetAngle = null;
		this.textureAngleOffset = null;
		this.isCarvable = false;
		this.tint = '#FFFFFF';
		this.transparancy = 1.0;
		this.lockselection = false;
		this.parallax = 0.0;
		this.repeatTeleportX = 0;
		this.repeatTeleportY = 0;
	}
	this.graphicGroup = function () {
		this.type = self.object_GRAPHICGROUP;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		this.ID = 0;
		this.graphicObjects = [];
		this.bodyID = null;
		this.texturePositionOffsetLength = null;
		this.texturePositionOffsetAngle = null;
		this.textureAngleOffset = null;
		this.transparancy = 1;
		this.tileTexture = '';
		this.lockselection = false;
		this.parallax = 0.0;
		this.repeatTeleportX = 0;
		this.repeatTeleportY = 0;
	}
	this.animationGroup = function () {
		this.type = self.object_ANIMATIONGROUP;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		this.ID = 0;
		this.graphicObjects = [];
		this.bodyID = null;
		this.texturePositionOffsetLength = null;
		this.texturePositionOffsetAngle = null;
		this.textureAngleOffset = null;
		this.transparancy = 1;
		this.tileTexture = '';
		this.lockselection = false;
		this.parallax = 0.0;
		this.repeatTeleportX = 0;
		this.repeatTeleportY = 0;
		this.fps = 12;
		this.playing = true;
	}
	this.graphicObject = function () {
		this.type = self.object_GRAPHIC;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		this.ID = 0;
		this.colorFill = "#999999";
		this.colorLine = "#000";
		this.transparancy = 1.0;
		this.radius;
		this.vertices = [{
			x: 0,
			y: 0
		}, {
			x: 0,
			y: 0
		}];
		this.bodyID = null;
		this.texturePositionOffsetLength = null;
		this.texturePositionOffsetAngle = null;
		this.textureAngleOffset = null;
		this.tileTexture = "";
		this.lockselection = false;
		this.lineWidth = 1.0;
		this.parallax = 0.0;
		this.repeatTeleportX = 0;
		this.repeatTeleportY = 0;
	}
	this.jointObject = function () {
		this.type = self.object_JOINT;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		//
		this.bodyA_ID;
		this.bodyB_ID;
		this.jointType = 0;
		this.collideConnected = false;
		this.enableMotor = false;
		this.maxMotorTorque = 1.0;
		this.motorSpeed = 10.0;
		this.enableLimit = false;
		this.upperAngle = 0.0;
		this.lowerAngle = 0.0;
		this.dampingRatio = 0.0;
		this.frequencyHz = 0.0;
		this.upperLimit = 0.0;
		this.lowerLimit = 0.0;
		this.lockselection = false;
	}
	this.triggerObject = function () {
		this.type = self.object_TRIGGER;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		this.ID = 0;
		//
		this.vertices = [{
			x: 0,
			y: 0
		}, {
			x: 0,
			y: 0
		}];
		this.radius;
		this.enabled = true;
		this.targetType = 0;
		this.repeatType = 0;
		this.triggerObjects = [];
		this.triggerActions = [];
		this.lockselection = false;
	}
	this.textObject = function () {
		this.type = self.object_TEXT;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		this.ID = 0;
		this.text = 'Write your text here';
		this.textColor = "#FFF";
		this.transparancy = 1.0;
		this.fontSize = 12;
		this.fontName = "Arial";
		this.textAlign = 'left';
		this.lockselection = false;
		this.parallax = 0.0;
		this.repeatTeleportX = 0;
		this.repeatTeleportY = 0;
	}
	this.multiObject = function () {
		this.type = self.object_MULTIPLE;
		this.x = 0;
		this.y = 0;
		this.rotation = 0;
		this.groups = "";
		this.lockselection = false;
	}
	this.lookupObject = function () {
		this._bodies = [];
		this._textures = [];
		this._joints = [];
	}

	this.prefabObject = function () {
		this.x = 0;
		this.y = 0;
		this.rotation = 0;
		this.type = self.object_PREFAB;
		this.settings;
		this.prefabName;
	}
	this.editorSettingsObject = new function () {
		this.type = self.object_SETTINGS;
		this.physicsDebug = false;
		this.gravityX = 0;
		this.gravityY = 10;
		this.backgroundColor = 0xD4D4D4;
	}
	this.editorJointObject = new this.jointObject();

	this.editorGraphicDrawingObject = new function () {
		this.colorFill = "#999999";
		this.colorLine = "#000";
		this.lineWidth = 1;
		this.transparancy = 1.0;
		this.smoothen = true;
	}
	this.editorGeometryObject = new function () {
		this.shape = 0;
		this.colorFill = "#999999";
		this.colorLine = "#000";
		this.lineWidth = 1;
		this.transparancy = 1.0;
		this.isPhysicsObject = true;
	}
	this.editorTextObject = new function () {
		this.textColor = "#999999";
		this.transparancy = 1.0;
		this.fontSize = 12;
		this.fontName = "Arial";
		this.textAlign = 'left';
	}
	this.editorTriggerObject = new function () {
		this.shape = 0;
	}
	this.cameraShotCallBack;
	this.takeCameraShot = function () {
		//first clean up screen
		this.debugGraphics.clear();
		game.newDebugGraphics.clear();
		let i;
		for (i = 0; i < this.editorIcons.length; i++) {
			this.editorIcons[i].visible = false;
		}
		game.app.render();
		//
		let imageData = this.canvas.toDataURL('image/jpeg', 1);
		let image = new Image();
		image.src = imageData;
		const canvas = document.createElement('canvas');
		const context = canvas.getContext("2d");
		const shotQuality = 0.8;
		const self = this;
		image.onload = function () {
			//highRes;
			var scale = 0.5;
			canvas.width = self.cameraSize.w * scale;
			canvas.height = self.cameraSize.h * scale;
			context.drawImage(image, self.mousePosPixel.x - self.cameraSize.w / 2, self.mousePosPixel.y - self.cameraSize.h / 2, self.cameraSize.w, self.cameraSize.h, 0, 0, canvas.width, canvas.height);
			var highResThumb = canvas.toDataURL('image/jpeg', shotQuality);
			// var _image = new Image();
			// _image.src = highResThumb;
			// document.body.appendChild(_image);

			//lowRes
			scale = 0.25;
			canvas.width = self.cameraSize.w * scale;
			canvas.height = self.cameraSize.h * scale;
			context.drawImage(image, self.mousePosPixel.x - self.cameraSize.w / 2, self.mousePosPixel.y - self.cameraSize.h / 2, self.cameraSize.w, self.cameraSize.h, 0, 0, canvas.width, canvas.height);
			var lowResThumb = canvas.toDataURL('image/jpeg', shotQuality);
			/*var _image = new Image();
			_image.src = lowResThumb;
			document.body.appendChild(_image);*/

			self.cameraShotData.highRes = highResThumb;
			self.cameraShotData.lowRes = lowResThumb;

			self.cameraShotCallBack();

			self.selectTool(self.tool_SELECT);

			console.log("Camera Shot Succesfull");
		}
		for (i = 0; i < this.editorIcons.length; i++) {
			if (!this.editorIcons[i].isPrefabJointGraphic) this.editorIcons[i].visible = true;
		}
	}

	this.onMouseDown = function (evt) {
		if (this.editing) {
			if (this.spaceDown) {
				this.spaceCameraDrag = true;
			} else if (this.selectingTriggerTarget) {
				var highestObject = this.retrieveHighestSelectedObject(this.mousePosWorld, this.mousePosWorld);
				if (highestObject) {
					for (var i = 0; i < this.selectedPhysicsBodies.length; i++) {
						var body = this.selectedPhysicsBodies[i];
						if (body.mySprite && body.mySprite.data.type == this.object_TRIGGER) {
							trigger.addTargetToTrigger(body, highestObject);
							trigger.updateTriggerGUI();
						}
					}
				}
				this.selectingTriggerTarget = false;
			} else if (this.selectedTool == this.tool_SELECT) {

				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.x, this.mousePosWorld.y);

				var aabb = new b2AABB;
				aabb.lowerBound.Set(this.mousePosWorld.x, this.mousePosWorld.y);
				aabb.upperBound.Set(this.mousePosWorld.x, this.mousePosWorld.y);


				if (!this.selectedBoundingBox.Contains(aabb) || this.shiftDown) {
					//reset selectionie
					var oldSelectedPhysicsBodies = [];
					var oldSelectedTextures = [];
					var oldSelectedPrefabs = {};

					if (this.shiftDown) {
						oldSelectedPhysicsBodies = this.selectedPhysicsBodies;
						oldSelectedTextures = this.selectedTextures;
						oldSelectedPrefabs = JSON.parse(JSON.stringify(this.selectedPrefabs));
					}

					this.selectedPrefabs = {};
					this.selectedPhysicsBodies = [];
					this.selectedTextures = [];

					var i;
					var highestObject = this.retrieveHighestSelectedObject(this.startSelectionPoint, this.startSelectionPoint);
					if (highestObject) {
						if (highestObject.data.prefabInstanceName) {
							this.selectedPrefabs[highestObject.data.prefabInstanceName] = true;
						} else {
							if (highestObject.data.type == this.object_BODY || highestObject.myBody) {
								if (highestObject.myBody) this.selectedPhysicsBodies = [highestObject.myBody];
								else this.selectedPhysicsBodies = [highestObject];
							} else {
								this.selectedTextures = [highestObject];
							}
						}
					}
					//
					if (this.shiftDown) {
						//push old selection
						var i;
						for (i = 0; i < oldSelectedPhysicsBodies.length; i++) {
							if (oldSelectedPhysicsBodies[i] != this.selectedPhysicsBodies[0]) {
								this.selectedPhysicsBodies.push(oldSelectedPhysicsBodies[i]);
							}
						}
						for (i = 0; i < oldSelectedTextures.length; i++) {
							if (oldSelectedTextures[i] != this.selectedTextures[0]) {
								this.selectedTextures.push(oldSelectedTextures[i]);
							}
						}
						for (var key in oldSelectedPrefabs) {
							if (oldSelectedPrefabs.hasOwnProperty(key)) {
								this.selectedPrefabs[key] = true;
							}
						}

					}

					this.updateSelection();
				}

			} else if (this.selectedTool == this.tool_POLYDRAWING) {
				if (!this.closeDrawing) {
					if (!this.checkVerticeDrawingHasErrors()) {
						this.activeVertices.push({
							x: this.mousePosWorld.x,
							y: this.mousePosWorld.y
						});
						if (this.activeVertices.length > editorSettings.maxLineVertices) this.activeVertices.shift();
					}
				} else {
					this.activeVertices = verticeOptimize.simplifyPath(this.activeVertices, false, this.container.scale.x);
					if (this.activeVertices && this.activeVertices.length > 2) {
						var bodyObject = this.createBodyFromEarcutResult(this.activeVertices);
						if (bodyObject) this.buildBodyFromObj(bodyObject);
					}
					this.activeVertices = [];
				}
			} else if (this.selectedTool == this.tool_GEOMETRY) {
				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.x, this.mousePosWorld.y);
			} else if (this.selectedTool == this.tool_CAMERA) {
				this.takeCameraShot();
			} else if (this.selectedTool == this.tool_ART) {
				this.activeVertices.push({
					x: this.mousePosWorld.x,
					y: this.mousePosWorld.y
				});
			} else if (this.selectedTool == this.tool_JOINTS) {
				var joint = this.attachJointPlaceHolder();
				if (joint) {
					var jointData = JSON.parse(JSON.stringify(ui.editorGUI.editData))
					delete jointData.bodyA_ID;
					delete jointData.bodyB_ID;
					delete jointData.x;
					delete jointData.y;
					delete jointData.rotation;
					Object.assign(joint.data, jointData);
					this.selectedTextures.push(joint);
				}
			} else if (this.selectedTool == this.tool_TRIGGER) {
				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.x, this.mousePosWorld.y);
				var triggerObject = new this.triggerObject;
				triggerObject.x = this.startSelectionPoint.x;
				triggerObject.y = this.startSelectionPoint.y;
				const triggerStartSize = 50 / game.editor.PTM;
				if (ui.editorGUI.editData.shape == "Circle") triggerObject.radius = triggerStartSize * game.editor.PTM;
				else triggerObject.vertices = [{
						x: -triggerStartSize,
						y: -triggerStartSize
					},
					{
						x: triggerStartSize,
						y: -triggerStartSize
					},
					{
						x: triggerStartSize,
						y: triggerStartSize
					},
					{
						x: -triggerStartSize,
						y: triggerStartSize
					}
				]
				var _trigger = this.buildTriggerFromObj(triggerObject);
				_trigger.mySprite.triggerInitialized = true;
			} else if (this.selectedTool == this.tool_TEXT) {
				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.x, this.mousePosWorld.y);

				var textObject = new this.textObject;
				textObject.x = this.startSelectionPoint.x * this.PTM;
				textObject.y = this.startSelectionPoint.y * this.PTM;
				textObject.fontName = ui.editorGUI.editData.fontName;
				textObject.fontSize = ui.editorGUI.editData.fontSize;
				textObject.textColor = ui.editorGUI.editData.textColor;
				textObject.textColor = ui.editorGUI.editData.textColor;
				textObject.textAlign = ui.editorGUI.editData.textAlign;
				textObject.transparancy = ui.editorGUI.editData.transparancy;

				var _text = this.buildTextFromObj(textObject);
			}

		}
		this.updateMousePosition(evt);
		this.mouseDown = true;
	}
	this.onMouseMove = function (evt) {
		this.updateMousePosition(evt);

		if (this.oldMousePosWorld == null) this.oldMousePosWorld = this.mousePosWorld;

		if (this.editing) {
			if (this.mouseDown) {
				var move = new b2Vec2(this.mousePosWorld.x - this.oldMousePosWorld.x, this.mousePosWorld.y - this.oldMousePosWorld.y);
				if (this.spaceCameraDrag) {
					move.SelfMul(this.container.scale.x);
					camera.pan(move);
					scrollBars.update();
				} else if (this.selectedTool == this.tool_SELECT) {
					if (this.mouseTransformType == this.mouseTransformType_Movement) {
						this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
							x: move.x * this.PTM,
							y: move.y * this.PTM
						});
					} else if (this.mouseTransformType == this.mouseTransformType_Rotation) {
						this.applyToSelectedObjects(this.TRANSFORM_ROTATE, move.x * this.PTM / 10);
					}
				} else if (this.selectedTool == this.tool_ART) {
					this.activeVertices.push({
						x: this.mousePosWorld.x,
						y: this.mousePosWorld.y
					});
					if (this.activeVertices.length > editorSettings.maxVertices) this.activeVertices.shift();
				}
			}
		}
		this.oldMousePosWorld = this.mousePosWorld;
	}

	this.applyToSelectedObjects = function (transformType, obj) {
		var allObjects = this.selectedPhysicsBodies.concat(this.selectedTextures);
		var bodies = this.selectedPhysicsBodies;
		var textures = this.selectedTextures;

		var key;
		for (key in this.selectedPrefabs) {
			if (this.selectedPrefabs.hasOwnProperty(key)) {
				var lookup = this.lookupGroups[key];
				allObjects = allObjects.concat(lookup._bodies, lookup._textures, lookup._joints);
				bodies = bodies.concat(lookup._bodies);
				textures = textures.concat(lookup._textures, lookup._joints);
				if (transformType == this.TRANSFORM_MOVE) {
					this.activePrefabs[key].x += obj.x;
					this.activePrefabs[key].y += obj.y;
				} else if (transformType == this.TRANSFORM_ROTATE) {
					const prefab = this.activePrefabs[key];
					prefab.rotation += obj;
					while(prefab.rotation<-360) prefab.rotation += 360;
					while(prefab.rotation>360) prefab.rotation -= 360;
				}
			}
		}


		//if (transformType == this.TRANSFORM_DEPTH || transformType == this.TRANSFORM_UPDATE || transformType == this.TRANSFORM_ROTATE)
		this.applyToObjects(transformType, obj, allObjects)
		//} else {
		//	this.applyToObjects(transformType, obj, bodies);
		//	this.applyToObjects(transformType, obj, textures);
		//}//
	}

	this.applyToObjects = function (transformType, obj, objects, forceGroupRotation) {
		let i;
		let body;
		let sprite;

		//TODO: fix body

		if (transformType == this.TRANSFORM_MOVE || transformType == this.TRANSFORM_ROTATE) {

			const centerPoints = {};
			let data;
			let group;
			//prepare centerpoints for rotation
			if (transformType == this.TRANSFORM_ROTATE) {
				for (i = 0; i < objects.length; i++) {
					body = null;
					sprite = null;
					if (objects[i].mySprite != undefined) {
						body = objects[i];
						data = body.mySprite.data;
					} else {
						sprite = objects[i];
						data = sprite.data;
					}
					if (!data) continue;
					group = (this.altDown || forceGroupRotation) ? "__altDownGroup" : data.prefabInstanceName;
					if (group) {
						if (centerPoints[group] == undefined) centerPoints[group] = {
							x: 0,
							y: 0,
							n: 0
						};
						if(data.prefabInstanceName){
							const prefab = this.activePrefabs[data.prefabInstanceName];
							centerPoints[group].x += prefab.x;
							centerPoints[group].y += prefab.y;
						}else if (body || (!this.editing && data.type == this.jointObject)) {
							centerPoints[group].x += body.GetPosition().x * this.PTM;
							centerPoints[group].y += body.GetPosition().y * this.PTM;
						} else {
							centerPoints[group].x += sprite.x;
							centerPoints[group].y += sprite.y;
						}
						centerPoints[group].n++;
					}
				}
				for (i in centerPoints) {
					if (centerPoints.hasOwnProperty(i)) {
						centerPoints[i].x /= centerPoints[i].n;
						centerPoints[i].y /= centerPoints[i].n;
					}
				}
			}

			const rAngle = obj * this.DEG2RAD;

			for (i = 0; i < objects.length; i++) {

				if (objects[i].mySprite != undefined) {

					body = objects[i];
					if (transformType == this.TRANSFORM_MOVE) {
						const oldPosition = body.GetPosition();
						body.SetPosition(new b2Vec2(oldPosition.x + obj.x / this.PTM, oldPosition.y + obj.y / this.PTM));
					} else if (transformType == this.TRANSFORM_ROTATE) {
						//split between per object / group rotation

						group = (this.altDown || forceGroupRotation) ? "__altDownGroup" : body.mySprite.data.prefabInstanceName;

						const oldAngle = body.GetAngle();

						let newAngle = oldAngle + rAngle;
						const pi_double = Math.PI*2;
						while(newAngle<-pi_double) newAngle += pi_double;
						while(newAngle>pi_double) newAngle -= pi_double;
						body.SetAngle(newAngle);

						if (group) {
							const difX = (body.GetPosition().x * this.PTM) - centerPoints[group].x;
							const difY = (body.GetPosition().y * this.PTM) - centerPoints[group].y;
							const distanceToCenter = Math.sqrt(difX * difX + difY * difY);
							const angleToCenter = Math.atan2(difY, difX);
							const newX = centerPoints[group].x + distanceToCenter * Math.cos(angleToCenter + rAngle);
							const newY = centerPoints[group].y + distanceToCenter * Math.sin(angleToCenter + rAngle);
							body.SetPosition(new b2Vec2(newX / this.PTM, newY / this.PTM));
						}
					}
					this.updateBodyPosition(body);
				} else {
					sprite = objects[i];
					if (transformType == this.TRANSFORM_MOVE) {
						sprite.x += obj.x;
						sprite.y += obj.y;
					} else if (transformType == this.TRANSFORM_ROTATE) {
						sprite.rotation += obj * this.DEG2RAD;
						const pi_double = Math.PI*2;
						while(sprite.rotation<-pi_double) sprite.rotation += pi_double;
						while(sprite.rotation>pi_double) sprite.rotation -= pi_double;

						if (group) {
							const difX = sprite.x - centerPoints[group].x;
							const difY = sprite.y - centerPoints[group].y;
							const distanceToCenter = Math.sqrt(difX * difX + difY * difY);
							const angleToCenter = Math.atan2(difY, difX);
							const newX = centerPoints[group].x + distanceToCenter * Math.cos(angleToCenter + rAngle);
							const newY = centerPoints[group].y + distanceToCenter * Math.sin(angleToCenter + rAngle);
							sprite.x = newX;
							sprite.y = newY;
						}

					}

				}

			}
		} else if (transformType == this.TRANSFORM_DEPTH) {
			let tarDepthIndexes = [];
			let depthArray = [];
			let jointArray = []

			for (i = 0; i < objects.length; i++) {

				if (objects[i].mySprite != undefined) {
					depthArray.push(objects[i].mySprite);
					tarDepthIndexes.push(objects[i].mySprite.parent.getChildIndex(objects[i].mySprite));
					if (objects[i].myTexture != undefined) {
						depthArray.push(objects[i].myTexture);
						tarDepthIndexes.push(objects[i].mySprite.parent.getChildIndex(objects[i].myTexture));
					}

					if (objects[i].myJoints) objects[i].myJoints.map(joint => {
						if (!(objects.includes(joint))) {
							depthArray.push(joint);
							tarDepthIndexes.push(joint.parent.getChildIndex(joint));
						}
						if (!(jointArray.includes(joint))) jointArray.push(joint);
					});

				} else {
					depthArray.push(objects[i]);
					tarDepthIndexes.push(objects[i].parent.getChildIndex(objects[i]));
				}
			}

			depthArray.sort(function (a, b) {
				return a.parent.getChildIndex(a) - b.parent.getChildIndex(b);
			});
			tarDepthIndexes.sort(function (a, b) {
				return a - b;
			});
			if (!obj) {
				depthArray = depthArray.reverse();
				tarDepthIndexes = tarDepthIndexes.reverse();
			}

			let neighbour;
			let child;

			//while depthArray[i]+1 difference == 1 && [i] != d, check next depthArray, if distance > 1, swapChildren

			for (i = 0; i < depthArray.length; i++) {
				child = depthArray[i];
				if ((obj && tarDepthIndexes[i] + 1 < child.parent.children.length) || (!obj && tarDepthIndexes[i] - 1 >= 0)) {
					if (obj) neighbour = child.parent.getChildAt(tarDepthIndexes[i] + 1);
					else neighbour = child.parent.getChildAt(tarDepthIndexes[i] - 1);
					var allowed = true;
					var j;
					if (obj) {
						for (j = i + 1; j < depthArray.length; j++) {
							if (j < depthArray.length && tarDepthIndexes[j] - tarDepthIndexes[j - 1] > 1) {
								break;
							}
							if (j == depthArray.length - 1 && tarDepthIndexes[j] == depthArray[depthArray.length - 1].parent.children.length - 1) allowed = false;
						}
					} else {
						for (j = i + 1; j < depthArray.length; j++) {
							if (j < depthArray.length && tarDepthIndexes[j] - tarDepthIndexes[j - 1] > 1) {
								break;
							}
							if (j == depthArray.length - 1 && tarDepthIndexes[j] == 0) allowed = false
						}
					}

					if (allowed) {
						child.parent.swapChildren(child, neighbour);
					}
				}
			}


			// post process joints to make sure they are always on top
			for (i = 0; i < jointArray.length; i++) {
				const joint = jointArray[i];
				const jointIndex = joint.parent.getChildIndex(joint);
				joint.bodies.map(body => {
					if (body.mySprite && body.mySprite.parent.getChildIndex(body.mySprite) > jointIndex) {
						joint.parent.swapChildren(joint, body.mySprite);
					}
					if (body.myTexture && body.myTexture.parent.getChildIndex(body.myTexture) > jointIndex) {
						joint.parent.swapChildren(joint, body.myTexture);
					}
				});
			}
		} else if (transformType == this.TRANSFORM_FORCEDEPTH) {
			objects = this.sortObjectsByIndex(objects);
			for (i = 0; i < objects.length; i++) {
				sprite = (objects[i].mySprite) ? objects[i].mySprite : objects[i];
				//sprite = (objects[i].myTexture) ? objects[i].myTexture : sprite;
				if(objects[i].myTexture) objects.splice(i+1, 0, objects[i].myTexture);
				const container = sprite.parent;
				const targetIndex = Math.min(obj + i, sprite.parent.children.length-1);
				container.removeChild(sprite);
				container.addChildAt(sprite, targetIndex);

				//TODO FIX THIS MESS, very likely due to mytexture being pushed in, setting the i to a higher number and results in an index > children
				//Temp fix with Math.min()
			}
		}
		//update all objects
		if (this.editing) {
			for (i = 0; i < objects.length; i++) {
				if (objects[i].mySprite != undefined) {
					this.updateObject(objects[i].mySprite, objects[i].mySprite.data);
					if (objects[i].myTexture) this.updateObject(objects[i].myTexture, objects[i].myTexture.data);
				} else this.updateObject(objects[i], objects[i].data);
			}
		}
	}
	this.getLowestChildIndex = function (objects) {
		var childIndex = Number.POSITIVE_INFINITY;
		for (var i = 0; i < objects.length; i++) {
			var sprite = (objects[i].mySprite) ? objects[i].mySprite : objects[i];
			var spriteIndex = sprite.parent.getChildIndex(sprite);
			if (spriteIndex < childIndex) childIndex = spriteIndex;
		}
		return childIndex;
	}
	this.sortObjectsByIndex = function (objects) {
		objects.sort(function (a, b) {
			var aIndex = (a.mySprite) ? a.mySprite.parent.getChildIndex(a.mySprite) : a.parent.getChildIndex(a);
			var bIndex = (b.mySprite) ? b.mySprite.parent.getChildIndex(b.mySprite) : b.parent.getChildIndex(b);
			return aIndex - bIndex;
		});
		//objects.reverse();
		return objects;
	}
	this.TRANSFORM_MOVE = "move";
	this.TRANSFORM_ROTATE = "rotate";
	this.TRANSFORM_DEPTH = "depth";
	this.TRANSFORM_FORCEDEPTH = "forcedepth";
	this.TRANSFORM_UPDATE = "update";

	this.storeUndoMovement = function () {
		if(!this.editing) return;

		this.stringifyWorldJSON();
		if(this.lastValidWorldJSON === this.worldJSON) return;

		this.undoList.pop()

		//[current, //old1]
		//[current, //old, //old1]

		this.undoList.push(this.lastValidWorldJSON);
		this.lastValidWorldJSON = this.worldJSON;

		while(this.undoIndex<0){
			this.undoList.pop();
			this.undoIndex++;
		}

		this.undoList.push(this.worldJSON);

		if(this.undoList.length>50) this.undoList.shift();
	}
	this.storeUndoMovementDebounced =  dat.Common.debounce(()=>{this.storeUndoMovement()}, 100);

	this.undoMove = function (undo) {

		if(!undo && this.undoIndex === 0) return;
		if(!undo && this.undoIndex<0) this.undoIndex++;

		if(undo && this.undoList.length-1 === -this.undoIndex) return;
		if(undo) this.undoIndex--;

		const targetIndex = this.undoList.length-1+this.undoIndex;
		const json = this.undoList[targetIndex];

		this.resetEditor();
		this.buildJSON(json);

	}

	this.updateMousePosition = function (e) {
		var clientX, clientY;
		if (e.clientX) {
			clientX = e.clientX;
			clientY = e.clientY;
		} else if (e.changedTouches && e.changedTouches.length > 0) {
			var touch = e.changedTouches[e.changedTouches.length - 1];
			clientX = touch.clientX;
			clientY = touch.clientY;
		} else {
			return;
		}

		var rect = this.canvas.getBoundingClientRect();

		this.mousePosPixel.x = e.clientX - rect.left;
		this.mousePosPixel.y = e.clientY - rect.top;

		this.mousePosWorld = this.getWorldPointFromPixelPoint(this.mousePosPixel);
	}





	this.onMouseUp = function (evt) {
		if (this.editing) {
			if (this.spaceCameraDrag) {
				this.spaceCameraDrag = false;
			} else if (this.selectedTool == this.tool_SELECT) {
				if (this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0 && Object.keys(this.selectedPrefabs).length == 0 && this.startSelectionPoint) {
					this.selectedPhysicsBodies = this.queryWorldForBodies(this.startSelectionPoint, this.mousePosWorld);
					this.selectedTextures = this.queryWorldForGraphics(this.startSelectionPoint, this.mousePosWorld, true, 0);

					this.applyToSelectedObjects(this.TRANSFORM_UPDATE);

					this.filterSelectionForPrefabs();
					this.updateSelection();
				}
			} else if (this.selectedTool == this.tool_GEOMETRY) {
				let bodyObject;
				if (ui.editorGUI.editData.shape == "Circle") {
					var radius = new b2Vec2(this.mousePosWorld.x - this.startSelectionPoint.x, this.mousePosWorld.y - this.startSelectionPoint.y).Length() / this.container.scale.x * this.PTM;
					if (radius * 2 * Math.PI > this.minimumBodySurfaceArea) {
						bodyObject = new this.bodyObject;
						bodyObject.x = this.startSelectionPoint.x;
						bodyObject.y = this.startSelectionPoint.y;


						bodyObject.colorFill = ui.editorGUI.editData.colorFill;
						bodyObject.colorLine = ui.editorGUI.editData.colorLine;
						bodyObject.lineWidth = ui.editorGUI.editData.lineWidth;
						bodyObject.transparancy = ui.editorGUI.editData.transparancy;

						bodyObject.radius = radius;
						this.buildBodyFromObj(bodyObject);
					}
				} else {
					bodyObject = this.createBodyObjectFromVerts(this.activeVertices);
					if (bodyObject) {
						bodyObject.colorFill = ui.editorGUI.editData.colorFill;
						bodyObject.colorLine = ui.editorGUI.editData.colorLine;
						bodyObject.lineWidth = ui.editorGUI.editData.lineWidth;
						bodyObject.transparancy = ui.editorGUI.editData.transparancy;
						this.buildBodyFromObj(bodyObject);
					}
				}

				if (ui.editorGUI.editData.isPhysicsObject) {
					//convert body to graphic

				}
			} else if (this.selectedTool == this.tool_ART) {

				this.activeVertices.push({
					x: this.mousePosWorld.x,
					y: this.mousePosWorld.y
				});

				this.activeVertices = verticeOptimize.simplifyPath(this.activeVertices, ui.editorGUI.editData.smoothen, this.container.scale.x);
				if (this.activeVertices && this.activeVertices.length > 2) {
					var graphicObject = this.createGraphicObjectFromVerts(this.activeVertices);
					graphicObject.colorFill = ui.editorGUI.editData.colorFill;
					graphicObject.colorLine = ui.editorGUI.editData.colorLine;
					graphicObject.transparany = ui.editorGUI.editData.transparancy;
					this.buildGraphicFromObj(graphicObject);
				}
				this.activeVertices = [];

			}
			this.storeUndoMovementDebounced();
		}
		this.mouseDown = false;
	}
	this.onMouseWheel = function(e){
		if(this.editing){
			const zoom = e.deltaY>0;
			camera.zoom({
				x: this.mousePosWorld.x * this.PTM,
				y: this.mousePosWorld.y * this.PTM
			}, zoom);
		}
    }
	this.onKeyDown = function (e) {
		if (e.keyCode == 68) { //d
			this.selectTool(this.tool_POLYDRAWING);
		} else if (e.keyCode == 67) { //c
			if (e.ctrlKey || e.metaKey) {
				this.copySelection();
			} else {
				this.selectTool(this.tool_GEOMETRY);
			}
		} else if (e.keyCode == 71) { // g
			if (e.ctrlKey || e.metaKey) {

				if ((this.selectedTextures.length == 1 && this.selectedPhysicsBodies.length == 0) || (this.selectedTextures.length == 0 && this.selectedPhysicsBodies.length == 1)) {
					this.ungroupObjects();
				} else {
					this.groupObjects();
				}
			}
		} else if (e.keyCode == 77) { //m
			this.selectTool(this.tool_SELECT);
		} else if (e.keyCode == 74) { //j
			if (e.ctrlKey || e.metaKey) {
				this.selectedTextures.push(this.attachJointPlaceHolder());
			} else this.selectTool(this.tool_JOINTS);
		} else if (e.keyCode == 83) { //s
			this.stringifyWorldJSON();
		} else if (e.keyCode == 86) { // v
			if (e.ctrlKey || e.metaKey) {
				this.pasteSelection();
			}
		} else if (e.keyCode == 88) { // x
			if (e.ctrlKey || e.metaKey) {
				this.cutSelection();
			} else {
				this.applyToSelectedObjects(this.TRANSFORM_ROTATE, this.shiftDown ? 10 : 1);
			}

		} else if (e.keyCode == 89) { // y
			if (e.ctrlKey || e.metaKey) {
				this.undoMove(false);
			}
		}else if (e.keyCode == 90) { // z
			if (e.ctrlKey || e.metaKey) {
				this.undoMove(true);
			} else {
				this.applyToSelectedObjects(this.TRANSFORM_ROTATE, this.shiftDown ? -10 : -1);
			}
		} else if (e.keyCode == 46 || e.keyCode == 8) { //delete || backspace
			this.deleteSelection();
		} else if (e.keyCode == 16) { //shift
			this.shiftDown = true;
			//this.mouseTransformType = this.mouseTransformType_Rotation;
		} else if (e.keyCode == 32) { //space
			this.spaceDown = true;
		} else if (e.keyCode == 18) { // alt
			this.altDown = true;
		} else if (e.keyCode == 187 || e.keyCode == 61 || e.keyCode == 107) { // +
			//zoomin
			camera.zoom({
				x: this.mousePosWorld.x * this.PTM,
				y: this.mousePosWorld.y * this.PTM
			}, true);
		} else if (e.keyCode == 189 || e.keyCode == 109 || e.keyCode == 173) { // -
			//zoomout
			camera.zoom({
				x: this.mousePosWorld.x * this.PTM,
				y: this.mousePosWorld.y * this.PTM
			}, false);
		} else if (e.keyCode == 112) { // F1
			if (ui.assetGUI == undefined) {
				ui.initGuiAssetSelection();
			} else {
				ui.removeGuiAssetSelection();
			}
			e.preventDefault();
		} else if (e.keyCode == 38) { // up arrow
			if (e.ctrlKey || e.metaKey) {
				this.applyToSelectedObjects(this.TRANSFORM_DEPTH, true);
			} else {
				this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
					x: 0,
					y: this.shiftDown ? -10 : -1
				});
			}
		} else if (e.keyCode == 40) { // down arrow
			if (e.ctrlKey || e.metaKey) {
				this.applyToSelectedObjects(this.TRANSFORM_DEPTH, false);
			} else {
				this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
					x: 0,
					y: this.shiftDown ? 10 : 1
				});
			}
		} else if (e.keyCode == 37) { // left arrow
			this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
				x: this.shiftDown ? -10 : -1,
				y: 0
			});
		} else if (e.keyCode == 39) { // right arrow
			this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
				x: this.shiftDown ? 10 : 1,
				y: 0
			});
		}
		this.storeUndoMovementDebounced();
	}
	this.onKeyUp = function (e) {

		if (e.keyCode == 16) { //shift
			this.shiftDown = false;
			this.mouseTransformType = this.mouseTransformType_Movement;
		} else if (e.keyCode == 32) { //space
			this.spaceDown = false;
		} else if (e.keyCode == 18) {
			this.altDown = false;
		}
	}


	this.queryPhysicsBodies = [];
	this.queryWorldForBodies = function (lowerBound, upperBound) {
		var aabb = new b2AABB();

		aabb.lowerBound.Set((lowerBound.x < upperBound.x ? lowerBound.x : upperBound.x), (lowerBound.y < upperBound.y ? lowerBound.y : upperBound.y));
		aabb.upperBound.Set((lowerBound.x > upperBound.x ? lowerBound.x : upperBound.x), (lowerBound.y > upperBound.y ? lowerBound.y : upperBound.y));

		this.queryPhysicsBodies = [];
		this.world.QueryAABB(this.getBodyCB, aabb);
		var body;
		for (var i = 0; i < this.queryPhysicsBodies.length; i++) {
			body = this.queryPhysicsBodies[i];
			if (Boolean(body.mySprite.data.lockselection) != this.altDown) {
				this.queryPhysicsBodies.splice(i, 1);
				i--;
			}
		}

		return this.queryPhysicsBodies;
	}
	this.queryWorldForGraphics = function (lowerBound, upperBound, onlyTextures, limitResult) {
		var aabb = new b2AABB();

		aabb.lowerBound.Set((lowerBound.x < upperBound.x ? lowerBound.x : upperBound.x), (lowerBound.y < upperBound.y ? lowerBound.y : upperBound.y));
		aabb.upperBound.Set((lowerBound.x > upperBound.x ? lowerBound.x : upperBound.x), (lowerBound.y > upperBound.y ? lowerBound.y : upperBound.y));
		var lowerBoundPixi = this.getPIXIPointFromWorldPoint(aabb.lowerBound);
		var upperBoundPixi = this.getPIXIPointFromWorldPoint(aabb.upperBound);
		//QueryTextures

		var queryGraphics = [];
		var i;
		for (i = this.textures.children.length - 1; i >= 0; i--) {
			var sprite = this.textures.getChildAt(i);

			if (!onlyTextures || !sprite.myBody) {
				var spriteBounds = sprite.getBounds();
				var posX = spriteBounds.x / this.container.scale.x - this.container.x / this.container.scale.x;
				var posY = spriteBounds.y / this.container.scale.y - this.container.y / this.container.scale.y;
				var spriteRect = new PIXI.Rectangle(posX, posY, spriteBounds.width / this.container.scale.x, spriteBounds.height / this.container.scale.y);
				var selectionRect = new PIXI.Rectangle(lowerBoundPixi.x, lowerBoundPixi.y, upperBoundPixi.x - lowerBoundPixi.x, upperBoundPixi.y - lowerBoundPixi.y);
				if (!(((spriteRect.y + spriteRect.height) < selectionRect.y) ||
						(spriteRect.y > (selectionRect.y + selectionRect.height)) ||
						((spriteRect.x + spriteRect.width) < selectionRect.x) ||
						(spriteRect.x > (selectionRect.x + selectionRect.width)))) {
					queryGraphics.push(sprite);
					if (queryGraphics.length == limitResult && limitResult != 0) break;
				}
			} else {}
		}

		var graphic;
		for (var i = 0; i < queryGraphics.length; i++) {
			graphic = queryGraphics[i];
			if (Boolean(graphic.data.lockselection) != this.altDown) {
				queryGraphics.splice(i, 1);
				i--;
			}
		}

		return queryGraphics;

	}
	this.filterSelectionForPrefabs = function () {
		var i;
		for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
			if (this.selectedPhysicsBodies[i].mySprite.data.prefabInstanceName) {
				this.selectedPrefabs[this.selectedPhysicsBodies[i].mySprite.data.prefabInstanceName] = true;
				this.selectedPhysicsBodies.splice(i, 1);
				i--;
			}
		}
		for (i = 0; i < this.selectedTextures.length; i++) {
			if (this.selectedTextures[i].data.prefabInstanceName) {
				this.selectedPrefabs[this.selectedTextures[i].data.prefabInstanceName] = true;
				this.selectedTextures.splice(i, 1);
				i--;
			}
		}
	}


	this.getBodyCB = new function () {
		this.ReportFixture = function (fixture) {
			var isIncluded = false;
			for (var i = 0; i < self.queryPhysicsBodies.length; i++) {
				if (self.queryPhysicsBodies[i] == fixture.GetBody()) isIncluded = true;
			}
			if (!isIncluded) self.queryPhysicsBodies.push(fixture.GetBody());
			return true;
		}
	};



	this.computeSelectionAABB = function () {

		var computeBodies = this.selectedPhysicsBodies;
		var computeTextures = this.selectedTextures;

		//add elements from prefabs to selection
		for (var key in this.selectedPrefabs) {
			if (this.selectedPrefabs.hasOwnProperty(key)) {
				if (this.lookupGroups[key] instanceof this.lookupObject) {
					computeBodies = computeBodies.concat(this.lookupGroups[key]._bodies);
					computeTextures = computeTextures.concat(this.lookupGroups[key]._textures);
				}
			}
		}
		return this.computeObjectsAABB(computeBodies, computeTextures);
	}
	this.computeObjectsAABB = function (computeBodies, computeTextures, origin = false) {
		var aabb = new b2AABB;
		aabb.lowerBound = new b2Vec2(Number.MAX_VALUE, Number.MAX_VALUE);
		aabb.upperBound = new b2Vec2(-Number.MAX_VALUE, -Number.MAX_VALUE);
		var i;
		var j;
		var body;
		var fixture;

		let oldRot;

		if (computeBodies) {
			for (i = 0; i < computeBodies.length; i++) {
				body = computeBodies[i];
				oldRot = body.GetAngle();
				if (origin) body.SetAngle(0);
				fixture = body.GetFixtureList();
				while (fixture != null) {
					aabb.Combine1(fixture.GetAABB(0));
					fixture = fixture.GetNext();
				}
				if (origin) body.SetAngle(oldRot);
			}
		}
		if (computeTextures) {
			for (i = 0; i < computeTextures.length; i++) {
				var sprite = computeTextures[i];

				if (sprite.myBody) {
					oldRot = sprite.myBody.GetAngle();
					if (origin) sprite.myBody.SetAngle(0);
					fixture = sprite.myBody.GetFixtureList();
					while (fixture != null) {
						aabb.Combine1(fixture.GetAABB(0));
						fixture = fixture.GetNext();
					}
					if (origin) sprite.myBody.SetAngle(oldRot);
				} else {
					oldRot = sprite.rotation;
					if (origin) sprite.rotation = 0;
					var bounds = sprite.getBounds();
					var spriteAABB = new b2AABB;
					var posX = bounds.x / this.container.scale.x - this.container.x / this.container.scale.x;
					var posY = bounds.y / this.container.scale.y - this.container.y / this.container.scale.y;
					spriteAABB.lowerBound = new b2Vec2(posX / this.PTM, posY / this.PTM);
					spriteAABB.upperBound = new b2Vec2((posX + bounds.width / this.container.scale.x) / this.PTM, (posY + bounds.height / this.container.scale.y) / this.PTM);
					aabb.Combine1(spriteAABB);
					if (origin) sprite.rotation = oldRot;
				}
			}
		}
		return aabb;
	}

	this.doSelection = function () {
		// DRAW outer selection lines
		var i;
		var aabb;
		if (this.selectedPhysicsBodies.length > 0 || this.selectedTextures.length > 0 || Object.keys(this.selectedPrefabs).length > 0) {

			aabb = this.computeSelectionAABB();

			var lowerBoundPixi = this.getPIXIPointFromWorldPoint(aabb.lowerBound);
			var upperBoundPixi = this.getPIXIPointFromWorldPoint(aabb.upperBound);

			//Showing selection
			this.drawBox(this.debugGraphics, this.container.x + lowerBoundPixi.x * this.container.scale.x, this.container.y + lowerBoundPixi.y * this.container.scale.y, (upperBoundPixi.x - lowerBoundPixi.x) * this.container.scale.y, (upperBoundPixi.y - lowerBoundPixi.y) * this.container.scale.x, this.selectionBoxColor);
		} else {
			aabb = new b2AABB;

			//Making selection
			if (this.mouseDown && !this.spaceCameraDrag && this.startSelectionPoint) this.drawBox(this.debugGraphics, this.container.x + this.startSelectionPoint.x * this.PTM * this.container.scale.x, this.container.y + this.startSelectionPoint.y * this.PTM * this.container.scale.y, (this.mousePosWorld.x * this.PTM - this.startSelectionPoint.x * this.PTM) * this.container.scale.x, (this.mousePosWorld.y * this.PTM - this.startSelectionPoint.y * this.PTM) * this.container.scale.y, "#000000");
		}
		this.selectedBoundingBox = aabb;

		this.debugGraphics.lineStyle(6, 0x00FF00, 0.8);
		const offsetInterval = 500;
		var offset = (Date.now() % offsetInterval + 1) / offsetInterval;

		for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
			const selectedPhysicsBody = this.selectedPhysicsBodies[i];
			const data = selectedPhysicsBody.mySprite.data;
			if(data.type === this.object_TRIGGER) continue;

			for (let j = 0; j < data.vertices.length; j++) {
				if (data.radius[j]) {

					let p = {
						x: data.vertices[j][0].x * this.PTM,
						y: data.vertices[j][0].y * this.PTM
					};
					const cosAngle = Math.cos(selectedPhysicsBody.mySprite.rotation);
					const sinAngle = Math.sin(selectedPhysicsBody.mySprite.rotation);
					const dx = p.x;
					const dy = p.y;
					p.x = (dx * cosAngle - dy * sinAngle);
					p.y = (dx * sinAngle + dy * cosAngle);


					this.debugGraphics.drawDashedCircle(data.radius[j] * this.container.scale.x * selectedPhysicsBody.mySprite.scale.x, (selectedPhysicsBody.mySprite.x + p.x) * this.container.scale.x + this.container.x, (selectedPhysicsBody.mySprite.y + p.y) * this.container.scale.y + this.container.y, selectedPhysicsBody.mySprite.rotation, 20, 10, offset);
				} else {
					var polygons = [];
					let innerVertices;
					if (data.vertices[j][0] instanceof Array == false) innerVertices = data.vertices[j];
					else innerVertices = data.vertices[j][0];

					for (let k = 0; k < innerVertices.length; k++) {
						polygons.push({
							x: (innerVertices[k].x * this.PTM) * this.container.scale.x * selectedPhysicsBody.mySprite.scale.x,
							y: (innerVertices[k].y * this.PTM) * this.container.scale.y * selectedPhysicsBody.mySprite.scale.y
						});


					}
					this.debugGraphics.drawDashedPolygon(polygons, selectedPhysicsBody.mySprite.x * this.container.scale.x + this.container.x, selectedPhysicsBody.mySprite.y * this.container.scale.y + this.container.y, this.selectedPhysicsBodies[i].mySprite.rotation, 20, 10, offset);
				}
			}
		}

		this.drawDebugJointHelpers();
		drawing.drawDebugTriggerHelpers();
	}
	this.drawDebugJointHelpers = function () {
		//JOINTS draw upper and lower limits
		var sprite;
		for (var i = 0; i < this.selectedTextures.length; i++) {
			sprite = this.selectedTextures[i];
			if (sprite.data.type == this.object_JOINT) {
				var tarSprite;

				if (sprite.data.jointType == this.jointObject_TYPE_PIN) {
					if (sprite.data.enableLimit) {
						var lineLength = 50 / sprite.scale.x;
						//FOR OBJECT A
						var lowAngle = -sprite.data.lowerAngle * this.DEG2RAD + sprite.rotation;
						var upAngle = -sprite.data.upperAngle * this.DEG2RAD + sprite.rotation;

						tarSprite = sprite.parent.getChildAt(sprite.data.bodyA_ID);

						this.debugGraphics.lineStyle(1, "0x707070", 1);
						this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
						this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x + lineLength * Math.cos(sprite.rotation), tarSprite.y * this.container.scale.y + this.container.y + lineLength * Math.sin(sprite.rotation));


						this.debugGraphics.lineStyle(1, "0xFF9900", 1);
						this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
						this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x + lineLength * Math.cos(upAngle), tarSprite.y * this.container.scale.y + this.container.y + lineLength * Math.sin(upAngle));

						this.debugGraphics.lineStyle(1, "0xFF3300", 1);
						this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
						this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x + lineLength * Math.cos(lowAngle), tarSprite.y * this.container.scale.y + this.container.y + lineLength * Math.sin(lowAngle));

						this.debugGraphics.lineStyle(1, "0x000000", 0);
						this.debugGraphics.beginFill("0xFF9900", 0.3);
						this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
						this.debugGraphics.arc(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y, lineLength, upAngle, lowAngle, false);
						this.debugGraphics.endFill();

						//FOR OBJECT B

						if (sprite.data.bodyB_ID != undefined) {
							lowAngle = sprite.data.lowerAngle * this.DEG2RAD + sprite.rotation;
							upAngle = sprite.data.upperAngle * this.DEG2RAD + sprite.rotation;

							tarSprite = sprite.parent.getChildAt(sprite.data.bodyB_ID);

							this.debugGraphics.lineStyle(1, "0x707070", 1);
							this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
							this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x + lineLength * Math.cos(sprite.rotation), tarSprite.y * this.container.scale.y + this.container.y + lineLength * Math.sin(sprite.rotation));

							this.debugGraphics.lineStyle(1, "0xC554FA", 1);
							this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
							this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x + lineLength * Math.cos(upAngle), tarSprite.y * this.container.scale.y + this.container.y + lineLength * Math.sin(upAngle));

							this.debugGraphics.lineStyle(1, "0x8105BB", 1);
							this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
							this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x + lineLength * Math.cos(lowAngle), tarSprite.y * this.container.scale.y + this.container.y + lineLength * Math.sin(lowAngle));

							this.debugGraphics.lineStyle(1, "0x000000", 0);
							this.debugGraphics.beginFill("0xC554FA", 0.3);
							this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
							this.debugGraphics.arc(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y, lineLength, lowAngle, upAngle, false);
							this.debugGraphics.endFill();
						}
					}
				} else if (sprite.data.jointType == this.jointObject_TYPE_SLIDE) {
					var self = this;
					const drawArrow = function (x, y, rotation, arrowLength, arrowAngle) {
						arrowAngle = arrowAngle / self.DEG2RAD;
						var upArrowVec = {
							x: arrowLength * Math.cos(rotation + arrowAngle),
							y: arrowLength * Math.sin(rotation + arrowAngle)
						};
						var lowArrowVec = {
							x: arrowLength * Math.cos(rotation - arrowAngle),
							y: arrowLength * Math.sin(rotation - arrowAngle)
						};
						self.debugGraphics.moveTo((x + upArrowVec.x) * self.container.scale.x + self.container.x, (y + upArrowVec.y) * self.container.scale.y + self.container.y);
						self.debugGraphics.lineTo(x * self.container.scale.x + self.container.x, y * self.container.scale.y + self.container.y);
						self.debugGraphics.lineTo((x + lowArrowVec.x) * self.container.scale.x + self.container.x, (y + lowArrowVec.y) * self.container.scale.y + self.container.y);
						self.debugGraphics.lineTo((x + upArrowVec.x) * self.container.scale.x + self.container.x, (y + upArrowVec.y) * self.container.scale.y + self.container.y);
					}
					var spritesToDraw = [sprite.parent.getChildAt(sprite.data.bodyA_ID), sprite];

					spritesToDraw.map(tarSprite => {
						if (sprite.data.enableLimit) {
							const upperLengthVec = {
								x: sprite.data.upperLimit * Math.cos(sprite.rotation + 270 * this.DEG2RAD),
								y: sprite.data.upperLimit * Math.sin(sprite.rotation + 270 * this.DEG2RAD)
							};
							const lowerLengthVec = {
								x: sprite.data.lowerLimit * Math.cos(sprite.rotation + 270 * this.DEG2RAD),
								y: sprite.data.lowerLimit * Math.sin(sprite.rotation + 270 * this.DEG2RAD)
							};

							this.debugGraphics.lineStyle(1, "0xC554FA", 1);
							this.debugGraphics.moveTo((tarSprite.x + lowerLengthVec.x) * this.container.scale.x + this.container.x, (tarSprite.y + lowerLengthVec.y) * this.container.scale.y + this.container.y);
							this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);

							drawArrow(tarSprite.x + lowerLengthVec.x, tarSprite.y + lowerLengthVec.y, sprite.rotation + 270 * this.DEG2RAD, 20, 45);
							var arrowPosition = 0.2;
							if (sprite.data.lowerLimit < -300) drawArrow(tarSprite.x + lowerLengthVec.x * arrowPosition, tarSprite.y + lowerLengthVec.y * arrowPosition, sprite.rotation + 270 * this.DEG2RAD, 20, 45);

							this.debugGraphics.lineStyle(1, "0xFF9900", 1);
							this.debugGraphics.moveTo((tarSprite.x + upperLengthVec.x) * this.container.scale.x + this.container.x, (tarSprite.y + upperLengthVec.y) * this.container.scale.y + this.container.y);
							this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);

							drawArrow(tarSprite.x + upperLengthVec.x, tarSprite.y + upperLengthVec.y, sprite.rotation + 270 * this.DEG2RAD, 20, 45);
							var arrowPosition = 0.2;
							if (sprite.data.upperLimit > 300) drawArrow(tarSprite.x + upperLengthVec.x * arrowPosition, tarSprite.y + upperLengthVec.y * arrowPosition, sprite.rotation + 270 * this.DEG2RAD, 20, 45);

						} else {
							const length = 5000 / this.container.scale.x;
							var lengthVec = {
								x: length * Math.cos(sprite.rotation + 270 * this.DEG2RAD),
								y: length * Math.sin(sprite.rotation + 270 * this.DEG2RAD)
							};
							var arrowPosition = 0.03;
							this.debugGraphics.lineStyle(1, "0xC554FA", 1);
							this.debugGraphics.moveTo((tarSprite.x - lengthVec.x) * this.container.scale.x + this.container.x, (tarSprite.y - lengthVec.y) * this.container.scale.y + this.container.y);
							this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
							drawArrow(tarSprite.x - lengthVec.x * arrowPosition, tarSprite.y - lengthVec.y * arrowPosition, sprite.rotation + 270 * this.DEG2RAD, 20, 45);

							this.debugGraphics.lineStyle(1, "0xFF9900", 1);
							this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
							this.debugGraphics.lineTo((tarSprite.x + lengthVec.x) * this.container.scale.x + this.container.x, (tarSprite.y + lengthVec.y) * this.container.scale.y + this.container.y);
							drawArrow(tarSprite.x + lengthVec.x * arrowPosition, tarSprite.y + lengthVec.y * arrowPosition, sprite.rotation + 270 * this.DEG2RAD, 20, 45);
						}
					});
				}
				// draw joint lines
				this.debugGraphics.lineStyle(1, this.jointLineColor, 1);
				tarSprite = sprite.parent.getChildAt(sprite.data.bodyA_ID);
				this.debugGraphics.moveTo(sprite.x * this.container.scale.x + this.container.x, sprite.y * this.container.scale.y + this.container.y);
				this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);

				if (sprite.data.bodyB_ID != undefined) {
					tarSprite = sprite.parent.getChildAt(sprite.data.bodyB_ID);
					this.debugGraphics.moveTo(sprite.x * this.container.scale.x + this.container.x, sprite.y * this.container.scale.y + this.container.y);
					this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
				}

			}
		}
	}
	this.fetchControllers
	this.doEditorGUI = function () {
		if (ui.editorGUI != undefined && ui.editorGUI.editData) {
			let controller;
			let controllers = ui.fetchControllersFromGUI(ui.editorGUI);
			let body;
			let sprite;
			let j;
			let i;
			for (i in controllers) {
				controller = controllers[i];
				if (controller.humanUpdate) {
					controller.humanUpdate = false;
					if (controller.property == "typeName") {
						if (this.selectedTool == this.tool_JOINTS) {
							var oldData = ui.editorGUI.editData;
							if (controller.targetValue == "Pin") {
								oldData.jointType = this.jointObject_TYPE_PIN;
							} else if (controller.targetValue == "Slide") {
								oldData.jointType = this.jointObject_TYPE_SLIDE;
							} else if (controller.targetValue == "Distance") {
								oldData.jointType = this.jointObject_TYPE_DISTANCE;
							} else if (controller.targetValue == "Rope") {
								oldData.jointType = this.jointObject_TYPE_ROPE;
							} else if (controller.targetValue == "Wheel") {
								oldData.jointType = this.jointObject_TYPE_WHEEL;
							}
							ui.destroyEditorGUI();
							ui.buildEditorGUI();
							ui.editorGUI.editData = oldData;

							let targetFolder = ui.editorGUI.addFolder('add joints');
							targetFolder.open();

							this.addJointGUI(oldData, targetFolder);
							if (ui.editorGUI) ui.registerDragWindow(ui.editorGUI);
						} else {
							//joint
							for (let j = 0; j < this.selectedTextures.length; j++) {
								if (controller.targetValue == "Pin") {
									this.selectedTextures[j].data.jointType = this.jointObject_TYPE_PIN;
								} else if (controller.targetValue == "Slide") {
									this.selectedTextures[j].data.jointType = this.jointObject_TYPE_SLIDE;
								} else if (controller.targetValue == "Distance") {
									this.selectedTextures[j].data.jointType = this.jointObject_TYPE_DISTANCE;
								} else if (controller.targetValue == "Rope") {
									this.selectedTextures[j].data.jointType = this.jointObject_TYPE_ROPE;
								} else if (controller.targetValue == "Wheel") {
									this.selectedTextures[j].data.jointType = this.jointObject_TYPE_WHEEL;
								}
								if (this.selectedTextures[j].myTriggers) {
									const triggerLength = this.selectedTextures[j].myTriggers.length;
									for (let k = 0; k < triggerLength; k++) {
										trigger.removeTargetFromTrigger(this.selectedTextures[j].myTriggers[0], this.selectedTextures[j]);
									}
								}
							}

							this.updateSelection();
						}
					} else if (controller.property == "x") {
						//bodies & sprites & prefabs

						this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
							x: controller.targetValue,
							y: 0
						});
						
					} else if (controller.property == "y") {
						//bodies & sprites & prefabs

						this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
							x: 0,
							y: controller.targetValue
						});

					} else if ((controller.property == "width" || controller.property == "height") && this.selectedPhysicsBodies.length+this.selectedTextures.length>0) {
						//bodies & sprites & ??prefabs
						var aabb = this.computeObjectsAABB(this.selectedPhysicsBodies, this.selectedTextures, true);
						var currentSize = {
							width: aabb.GetExtents().x * 2 * this.PTM,
							height: aabb.GetExtents().y * 2 * this.PTM
						}

						let targetWidth = currentSize.width;
						let targetHeight = currentSize.height;

						if (controller.property == "width") targetWidth = controller.targetValue;
						else targetHeight = controller.targetValue;

						let scaleX = targetWidth / currentSize.width;
						let scaleY = targetHeight / currentSize.height;


						let centerPoint = {
							x: 0,
							y: 0
						};

						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							centerPoint.x += body.GetPosition().x * this.PTM;
							centerPoint.y += body.GetPosition().y * this.PTM;
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							centerPoint.x += sprite.x;
							centerPoint.y += sprite.y;

						}
						centerPoint.x /= (this.selectedPhysicsBodies.length + this.selectedTextures.length);
						centerPoint.y /= (this.selectedPhysicsBodies.length + this.selectedTextures.length);

						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];

							var xDif = body.GetPosition().x * this.PTM - centerPoint.x;
							var yDif = body.GetPosition().y * this.PTM - centerPoint.y;

							this.setScale(body, scaleX, scaleY);

							body.SetPosition(new b2Vec2((centerPoint.x + xDif * scaleX) / this.PTM, (centerPoint.y + yDif * scaleY) / this.PTM))
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];

							var xDif = sprite.x - centerPoint.x;
							var yDif = sprite.y - centerPoint.y;

							sprite.x = centerPoint.x + xDif * scaleX;
							sprite.y = centerPoint.y + yDif * scaleY;

							this.setScale(sprite, scaleX, scaleY);
						}

					} else if (controller.property == "collideConnected") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.collideConnected = controller.targetValue;
							}
						}
					} else if (controller.property == "enableMotor") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.enableMotor = controller.targetValue;
							}
						}
					} else if (controller.property == "maxMotorTorque") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.maxMotorTorque = controller.targetValue;
							}
						}
					} else if (controller.property == "motorSpeed") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.motorSpeed = controller.targetValue;
							}
						}
					} else if (controller.property == "enableLimit") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.enableLimit = controller.targetValue;
							}
						}
					} else if (controller.property == "upperAngle") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.upperAngle = controller.targetValue;
							}
						}
					} else if (controller.property == "lowerAngle") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.lowerAngle = controller.targetValue;
							}
						}
					} else if (controller.property == "frequencyHz") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.frequencyHz = controller.targetValue;
							}
						}
					} else if (controller.property == "dampingRatio") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.dampingRatio = controller.targetValue;
							}
						}
					} else if (controller.property == "upperLimit") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.upperLimit = controller.targetValue;
							}
						}
					} else if (controller.property == "lowerLimit") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.lowerLimit = controller.targetValue;
							}
						}
					} else if (controller.property == "rotation") {

						this.applyToSelectedObjects(this.TRANSFORM_ROTATE, controller.targetValue);


					} else if (controller.property == "groups" && controller.targetValue != "-") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.groups = controller.targetValue;
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.groups = controller.targetValue;
						}
					} else if (controller.property == "refName" && controller.targetValue != "-") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.refName = controller.targetValue;
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.refName = controller.targetValue;
						}
					} else if (controller.property == "tileTexture") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.tileTexture = controller.targetValue;
							this.updateTileSprite(body);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.tileTexture = controller.targetValue;
							this.updateTileSprite(sprite);
						}
					} else if (controller.property == "tint") {
						// sprite
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.tint = controller.targetValue;
							var color = sprite.data.tint;
							color = color.slice(1);
							sprite.originalSprite.tint = parseInt(color, 16);
						}
					} else if (controller.property == "colorFill") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.colorFill[0] = controller.targetValue.toString();
							this.updateBodyShapes(body);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.colorFill = controller.targetValue.toString();
							if (sprite.data.radius) this.updateCircleGraphic(sprite.originalGraphic, sprite.data.radius, {
								x: 0,
								y: 0
							}, sprite.data.colorFill, sprite.data.colorLine, sprite.data.transparancy);
							else this.updatePolyGraphic(sprite.originalGraphic, sprite.data.vertices, sprite.data.colorFill, sprite.data.colorLine, sprite.data.transparancy);
						}
					} else if (controller.property == "colorLine") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.colorLine[0] = controller.targetValue.toString();
							this.updateBodyShapes(body);
							this.updateTileSprite(body);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.colorLine = controller.targetValue.toString();
							if (sprite.data.radius) this.updateCircleGraphic(sprite.originalGraphic, sprite.data.radius, {
								x: 0,
								y: 0
							}, sprite.data.colorFill, sprite.data.colorLine, sprite.data.transparancy);
							else this.updatePolyGraphic(sprite.originalGraphic, sprite.data.vertices, sprite.data.colorFill, sprite.data.colorLine, sprite.data.transparancy);
						}
					} else if (controller.property == "lineWidth") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.lineWidth[0] = controller.targetValue;
							this.updateBodyShapes(body);
							this.updateTileSprite(body);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.lineWidth = controller.targetValue;
							if (sprite.data.radius) this.updateCircleGraphic(sprite.originalGraphic, sprite.data.radius, {
								x: 0,
								y: 0
							}, sprite.data.colorFill, sprite.data.colorLine, sprite.data.lineWidth, sprite.data.transparancy);
							else this.updatePolyGraphic(sprite.originalGraphic, sprite.data.vertices, sprite.data.colorFill, sprite.data.colorLine, sprite.data.lineWidth, sprite.data.transparancy);
							this.updateTileSprite(sprite);
						}
					} else if (controller.property == "transparancy") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.transparancy[0] = controller.targetValue;
							body.mySprite.alpha = body.mySprite.data.transparancy[0];
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.transparancy = controller.targetValue.toString();
							if ([this.object_GRAPHICGROUP, this.object_TEXTURE, this.object_ANIMATIONGROUP].includes(sprite.data.type)) {
								sprite.alpha = sprite.data.transparancy;
							} else {
								if (sprite.data.radius) this.updateCircleGraphic(sprite.originalGraphic, sprite.data.radius, {
									x: 0,
									y: 0
								}, sprite.data.colorFill, sprite.data.colorLine, sprite.data.lineWidth, sprite.data.transparancy);
								else this.updatePolyGraphic(sprite.originalGraphic, sprite.data.vertices, sprite.data.colorFill, sprite.data.colorLine, sprite.data.lineWidth, sprite.data.transparancy);
								this.updateTileSprite(sprite);
							}
						}
					} else if (controller.property == "fixed") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.fixed = controller.targetValue;
							if (body.mySprite.data.fixed) body.SetType(Box2D.b2BodyType.b2_staticBody);
							else body.SetType(Box2D.b2BodyType.b2_dynamicBody);

							var oldPosition = new b2Vec2(body.GetPosition().x, body.GetPosition().y);
							body.SetPosition(new b2Vec2(1000, 1000));
							body.SetPosition(oldPosition);

							//update collision data
							this.setBodyCollision(body, body.mySprite.data.collision);

							//awake fix
							if (body.GetType() == Box2D.b2BodyType.b2_dynamicBody) body.SetAwake(body.mySprite.data.awake);
						}

					} else if (controller.property == "awake") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.awake = controller.targetValue;
							body.SetAwake(false);
						}
						// prefab
						//Its not part of the standard list, so probably a custom list. Lets check which prefab is connected and try to set somthing there
						const prefabKeys = Object.keys(this.selectedPrefabs);
						if (prefabKeys.length > 0) {
							this.activePrefabs[prefabKeys[0]].class.set(controller.property, controller.targetValue);
						}
					} else if (controller.property == "density") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.density[0] = controller.targetValue;
							var fixture = body.GetFixtureList();
							fixture.SetDensity(controller.targetValue);
							body.ResetMassData();
						}
					} else if (controller.property == "collision") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.collision = controller.targetValue;
							this.setBodyCollision(body, controller.targetValue);
						}
					} else if (controller.property == "tileTexture") {
						//do tileTexture
					} else if (controller.property == "lockselection") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.lockselection = controller.targetValue;
							if (body.mySprite.data.lockselection) body.mySprite.alpha /= 2;
							else body.mySprite.alpha = body.mySprite.data.alpha || 1;
							if (body.myTexture) {
								if (body.mySprite.data.lockselection) body.myTexture.alpha /= 2;
								else body.myTexture.alpha = body.myTexture.data.alpha || 1;
							}
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.lockselection = controller.targetValue;
							if (sprite.data.lockselection) sprite.alpha /= 2;
							else sprite.alpha = sprite.data.alpha || 1;
						}
						var key;
						for (key in this.selectedPrefabs) {
							if (this.selectedPrefabs.hasOwnProperty(key)) {
								var lookup = this.lookupGroups[key];
								var allObjects = [].concat(lookup._bodies, lookup._textures, lookup._joints);
								var sprite;
								for (j = 0; j < allObjects.length; j++) {
									if (allObjects[j].mySprite) sprite = allObjects[j].mySprite;
									else sprite = allObjects[j];
									sprite.data.lockselection = controller.targetValue;
									if (sprite.data.lockselection) sprite.alpha /= 2;
									else sprite.alpha = sprite.data.alpha || 1;

									if (sprite.myBody && sprite.myBody.myTexture) {
										if (sprite.data.lockselection) sprite.myBody.myTexture.alpha /= 2;
										else sprite.myBody.myTexture.alpha = sprite.myBody.myTexture.data.alpha || 1;
									}
								}
							}
						}
					} else if (controller.property == "targetTypeDropDown") {
						//trigger
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.targetType = trigger.triggerTargetType[controller.targetValue];
						}
						trigger.updateTriggerGUI();
					} else if (controller.property == "repeatTypeDropDown") {
						//trigger
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.repeatType = trigger.triggerRepeatType[controller.targetValue];
						}
					} else if (controller.triggerActionKey != undefined) {
						//trigger action
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							if (controller.triggerActionKey == 'targetActionDropDown') {
								body.mySprite.data.triggerActions[controller.triggerTargetID][controller.triggerActionID] = trigger.getAction(controller.targetValue);
								trigger.updateTriggerGUI();
							} else body.mySprite.data.triggerActions[controller.triggerTargetID][controller.triggerActionID][controller.triggerActionKey] = controller.targetValue;
						}
					} else if (controller.property == "textColor") {
						//Text Object
						for (j = 0; j < this.selectedTextures.length; j++) {
							var textContainer = this.selectedTextures[j];
							textContainer.data.textColor = controller.targetValue;
							textContainer.textSprite.style.fill = textContainer.data.textColor;
						}
					} else if (controller.property == "fontSize") {
						//Text Object
						for (j = 0; j < this.selectedTextures.length; j++) {
							var textContainer = this.selectedTextures[j];

							textContainer.data.fontSize = controller.targetValue;
							textContainer.textSprite.style.fontSize = textContainer.data.fontSize;
							textContainer.pivot.x = -textContainer.textSprite.width/2;
							textContainer.pivot.y = -textContainer.textSprite.height/2;
							textContainer.updateTransform();
							textContainer.textSprite.x = -textContainer.textSprite.width;
							textContainer.textSprite.y = -textContainer.textSprite.height;

							// size 43 / width: 360/ x:
						}
					} else if (controller.property == "fontName") {
						//Text Object
						for (j = 0; j < this.selectedTextures.length; j++) {
							var textContainer = this.selectedTextures[j];
							textContainer.data.fontName = controller.targetValue;
							textContainer.textSprite.style.fontFamily = textContainer.data.fontName;
						}
					} else if (controller.property == "textAlign") {
						//Text Object
						for (j = 0; j < this.selectedTextures.length; j++) {
							const textContainer = this.selectedTextures[j];
							textContainer.data.textAlign = controller.targetValue;
							textContainer.textSprite.style.align = textContainer.data.textAlign;
						}
					} else if(controller.property == "parallax" || controller.property == "repeatTeleportX" || controller.property == "repeatTeleportY"){
						for (j = 0; j < this.selectedTextures.length; j++) {
							const textContainer = this.selectedTextures[j];
							textContainer.data[controller.property] = controller.targetValue;
						}
					}else if(controller.property == "fps" || controller.property == "playing"){
						for (j = 0; j < this.selectedTextures.length; j++) {
							const animationGraphic = this.selectedTextures[j];
							animationGraphic.data[controller.property] = controller.targetValue;
							this.initAnimation(animationGraphic);
						}
					}
						/* PREFAB SETTINGS */
					else {
						console.log("Dafuq...", controller.property, controller.targetValue)
						//Its not part of the standard list, so probably a custom list. Lets check which prefab is connected and try to set somthing there
						const prefabKeys = Object.keys(this.selectedPrefabs);
						if (prefabKeys.length > 0) {
							this.activePrefabs[prefabKeys[0]].class.set(controller.property, controller.targetValue);
						}

					}
				}
				if (controller.__input !== document.activeElement &&
					(controller.domElement.children[0].children && controller.domElement.children[0].children[0] !== document.activeElement)) {
					controller.updateDisplay();
				}
			}
			// DO SYNCING
			var syncObject;
			if (ui.editorGUI.editData.type == this.object_BODY || ui.editorGUI.editData.type == this.object_TRIGGER) {
				syncObject = this.selectedPhysicsBodies[0];
			}  else if (ui.editorGUI.editData.type == this.object_PREFAB) {
				var key = Object.keys(this.selectedPrefabs)[0];
				syncObject = this.activePrefabs[key];
			} else if (ui.editorGUI.editData.type == this.object_MULTIPLE) {
				if (this.selectedTextures.length > 0) syncObject = this.selectedTextures[0];
				else if (this.selectedPhysicsBodies.length > 0) syncObject = this.selectedPhysicsBodies[0];
				else syncObject = this.activePrefabs[key];
			}else {
				syncObject = this.selectedTextures[0];
			}
			if (syncObject) {
				if (syncObject.mySprite) {
					var pos = syncObject.GetPosition();
					ui.editorGUI.editData.x = pos.x * this.PTM;
					ui.editorGUI.editData.y = pos.y * this.PTM;
					ui.editorGUI.editData.rotation = syncObject.GetAngle() * this.RAD2DEG;
				} else {
					ui.editorGUI.editData.x = syncObject.x;
					ui.editorGUI.editData.y = syncObject.y;
					if(ui.editorGUI.editData.type == this.object_PREFAB) ui.editorGUI.editData.rotation = syncObject.rotation;
					else ui.editorGUI.editData.rotation = syncObject.rotation * this.RAD2DEG;

					if(ui.editorGUI.editData.type == this.object_TEXT){
						ui.editorGUI.editData.width = syncObject.width;
						ui.editorGUI.editData.height = syncObject.height;
					}
				}
			}

			//new sync for mouse movements
			var i;
			for (i in controllers) {
				controller = controllers[i];
				if (controller.property == "x") {
					controller.initialValue = ui.editorGUI.editData.x;
				} else if (controller.property == "y") {
					controller.initialValue = ui.editorGUI.editData.y;
				} else if (controller.property == "rotation") {
					controller.initialValue = ui.editorGUI.editData.rotation;
				}
			}
		}
	}

	this.closeDrawing = false;
	this.activeVertices = [];

	this.verticesLineColor = 0x009DEC;
	this.verticesFillColor = 0xFFFFFF;
	this.verticesFirstFillColor = 0x004e64;
	this.verticesDoneFillColor = 0x7AE582;
	this.verticesBulletRadius = 3;
	this.verticesBoxSize = 3;

	this.verticesErrorLineColor = 0xFF0000;

	this.doVerticesLineDrawing = function (convex) {
		this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);

		let i = 0;
		let newVertice;
		let activeVertice;
		let previousVertice;

		this.closeDrawing = false;

		if (this.activeVertices.length > 0) {
			newVertice = {
				x: this.mousePosWorld.x,
				y: this.mousePosWorld.y
			}
			activeVertice = this.activeVertices[this.activeVertices.length - 1];

			if (this.activeVertices.length > 1) {
				let firstVertice = this.activeVertices[0];
				let disX = newVertice.x - firstVertice.x;
				let disY = newVertice.y - firstVertice.y;
				let dis = Math.sqrt(disX * disX + disY * disY);
				const graphicClosingMargin = 1 / this.container.scale.x;
				let hasErrors = false;
				if (convex) {
					if (this.checkVerticeDrawingHasErrors()) {
						this.debugGraphics.lineStyle(1, this.verticesErrorLineColor, 1);
						hasErrors = true;
					}
				}
				if (dis <= graphicClosingMargin && !hasErrors) {
					this.closeDrawing = true;
					newVertice = firstVertice;
				}

			}
			this.debugGraphics.beginFill(this.verticesFillColor, 1.0);

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(newVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(newVertice).y * this.container.scale.y + this.container.y);
			this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(newVertice).x * this.container.scale.x + this.container.x + this.verticesBulletRadius, this.getPIXIPointFromWorldPoint(newVertice).y * this.container.scale.y + this.container.y);
			this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(newVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(newVertice).y * this.container.scale.y + this.container.y, this.verticesBulletRadius, 0, 2 * Math.PI, false);

			this.debugGraphics.endFill();
		}
		previousVertice = null;


		for (i = 0; i < this.activeVertices.length; i++) {
			activeVertice = this.activeVertices[i];

			if (i > 0) previousVertice = this.activeVertices[i - 1];

			if (previousVertice) {
				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(previousVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(previousVertice).y * this.container.scale.y + this.container.y);
			}

		}
		for (i = 0; i < this.activeVertices.length; i++) {

			if (i == 0 && !this.closeDrawing) this.debugGraphics.beginFill(this.verticesFirstFillColor, 1.0);
			else if (i == 0 && this.closeDrawing) this.debugGraphics.beginFill(this.verticesDoneFillColor, 1.0);
			else this.debugGraphics.beginFill(this.verticesFillColor, 1.0);

			activeVertice = this.activeVertices[i];

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x + this.verticesBulletRadius, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
			this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y, this.verticesBulletRadius, 0, 2 * Math.PI, false);

			this.debugGraphics.endFill();
		}
	}
	this.checkVerticeDrawingHasErrors = function () {
		const minimumAngleDif = 0.2;
		const newVertice = {
			x: this.mousePosWorld.x,
			y: this.mousePosWorld.y
		}
		const activeVertice = this.activeVertices[this.activeVertices.length - 1];
		let previousVertice;
		for (let i = 0; i < this.activeVertices.length - 1; i++) {
			if (lineIntersect(this.activeVertices[i], this.activeVertices[i + 1], newVertice, activeVertice)) {
				return true
			} else {
				previousVertice = this.activeVertices[this.activeVertices.length - 2];
				const activeSegmentAngle = Math.atan2(previousVertice.y - activeVertice.y, previousVertice.x - activeVertice.x);
				const newSegmentAngle = Math.atan2(newVertice.y - activeVertice.y, newVertice.x - activeVertice.x);
				const angleDif = activeSegmentAngle - newSegmentAngle;
				const shortestDif = Math.atan2(Math.sin(angleDif), Math.cos(angleDif));
				if (Math.abs(shortestDif) < minimumAngleDif) return true;

			}
		}
		return false;
	}
	this.doVerticesDrawing = function () {
		this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);

		let i = 0;
		let activeVertice;
		let previousVertice;

		for (i = 0; i < this.activeVertices.length; i++) {

			if (i == 0) this.debugGraphics.beginFill(this.verticesFirstFillColor, 0.5);
			else this.debugGraphics.beginFill(this.verticesFillColor, 0.5);

			activeVertice = this.activeVertices[i];

			if (i > 0) previousVertice = this.activeVertices[i - 1];

			if (previousVertice) {
				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(previousVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(previousVertice).y * this.container.scale.y + this.container.y);
			}

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x + this.verticesBulletRadius, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
			this.drawBox(this.debugGraphics, this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x - this.verticesBoxSize / 2, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y - this.verticesBoxSize / 2, this.verticesBoxSize, this.verticesBoxSize, this.verticesLineColor, 1, 1, 0xFFFFFF, 1);

			this.debugGraphics.endFill(); //fix

		}
	}
	this.doGeometryDrawing = function () {
		if (this.mouseDown && !this.spaceCameraDrag) {
			this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);
			this.debugGraphics.beginFill(this.verticesFillColor, 0.5);

			if (ui.editorGUI.editData.shape == "Circle") {
				var radius = new b2Vec2(this.mousePosWorld.x - this.startSelectionPoint.x, this.mousePosWorld.y - this.startSelectionPoint.y).Length() * this.PTM;
				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(this.startSelectionPoint).x * this.container.scale.x + this.container.x + radius, this.getPIXIPointFromWorldPoint(this.startSelectionPoint).y * this.container.scale.y + this.container.y);
				this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(this.startSelectionPoint).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(this.startSelectionPoint).y * this.container.scale.y + this.container.y, radius, 0, 2 * Math.PI, false);
			} else if (ui.editorGUI.editData.shape == "Box") {
				this.activeVertices = [];
				this.activeVertices.push({
					x: this.mousePosWorld.x,
					y: this.mousePosWorld.y
				});
				this.activeVertices.push({
					x: this.mousePosWorld.x,
					y: this.startSelectionPoint.y
				});
				this.activeVertices.push({
					x: this.startSelectionPoint.x,
					y: this.startSelectionPoint.y
				});
				this.activeVertices.push({
					x: this.startSelectionPoint.x,
					y: this.mousePosWorld.y
				});

				if (this.mousePosWorld.x < this.startSelectionPoint.x) this.activeVertices.reverse();

				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(this.activeVertices[0]).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(this.activeVertices[0]).y * this.container.scale.y + this.container.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[1]).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(this.activeVertices[1]).y * this.container.scale.y + this.container.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[2]).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(this.activeVertices[2]).y * this.container.scale.y + this.container.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[3]).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(this.activeVertices[3]).y * this.container.scale.y + this.container.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[0]).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(this.activeVertices[0]).y * this.container.scale.y + this.container.y);
			} else if (ui.editorGUI.editData.shape == "Triangle") {
				this.activeVertices = [];
				var difX = this.mousePosWorld.x - this.startSelectionPoint.x;
				this.activeVertices.push({
					x: this.mousePosWorld.x,
					y: this.startSelectionPoint.y
				});
				this.activeVertices.push({
					x: this.mousePosWorld.x - difX / 2,
					y: this.mousePosWorld.y
				});
				this.activeVertices.push({
					x: this.startSelectionPoint.x,
					y: this.startSelectionPoint.y
				});

				if (this.mousePosWorld.x < this.startSelectionPoint.x) this.activeVertices.reverse();

				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(this.activeVertices[0]).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(this.activeVertices[0]).y * this.container.scale.y + this.container.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[1]).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(this.activeVertices[1]).y * this.container.scale.y + this.container.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[2]).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(this.activeVertices[2]).y * this.container.scale.y + this.container.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[0]).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(this.activeVertices[0]).y * this.container.scale.y + this.container.y);
			}
			this.debugGraphics.endFill();
		}
	}
	this.doTriggerTargetSelection = function () {
		let highestObject = this.retrieveHighestSelectedObject(this.mousePosWorld, this.mousePosWorld);
		if (highestObject) {
			let tarPos;
			if (highestObject.mySprite) {
				if (highestObject.mySprite.data.prefabInstanceName) {
					const tarPrefab = this.activePrefabs[highestObject.mySprite.data.prefabInstanceName];
					tarPos = new b2Vec2(tarPrefab.x, tarPrefab.y);
				} else {
					tarPos = highestObject.GetPosition();
					tarPos = this.getPIXIPointFromWorldPoint(tarPos.x, tarPos.y);
				}
			} else {
				if (highestObject.data.prefabInstanceName) {
					const tarPrefab = this.activePrefabs[highestObject.data.prefabInstanceName];
					tarPos = new b2Vec2(tarPrefab.x, tarPrefab.y);
				} else {
					tarPos = highestObject.position;
				}
			}
			let myPos;
			for (var i = 0; i < this.selectedPhysicsBodies.length; i++) {
				if (this.selectedPhysicsBodies[i] != highestObject) {
					myPos = this.selectedPhysicsBodies[i].GetPosition();
					myPos = this.getPIXIPointFromWorldPoint(myPos);
					drawing.drawLine(myPos, tarPos, {
						color: "0xFFFF00"
					});
				}
			}
		}
	}
	this.retrieveHighestSelectedObject = function (lowerBound, upperBound) {
		var i;
		var body;
		var selectedPhysicsBodies = this.queryWorldForBodies(lowerBound, upperBound);
		if (selectedPhysicsBodies.length > 0) {

			var fixture;
			var pointInsideBody = false;
			for (i = 0; i < selectedPhysicsBodies.length; i++) {
				body = selectedPhysicsBodies[i];
				fixture = body.GetFixtureList();

				while (fixture != null) {
					if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), lowerBound)) {
						pointInsideBody = true;
					}

					fixture = fixture.GetNext();
				}
				if (!pointInsideBody) {
					selectedPhysicsBodies.splice(i, 1);
					i--;
				}
			}
		}
		var selectedTextures = this.queryWorldForGraphics(lowerBound, upperBound, true, 1);

		//limit selection to highest indexed child

		var highestObject;
		for (i = 0; i < selectedPhysicsBodies.length; i++) {
			body = selectedPhysicsBodies[i];
			var texture = body.mySprite;
			if (body.myTexture) texture = body.myTexture;
			if (highestObject == undefined) highestObject = texture;
			if (texture.parent.getChildIndex(texture) > highestObject.parent.getChildIndex(highestObject)) {
				highestObject = texture;
			}
		}
		var sprite;
		for (i = 0; i < selectedTextures.length; i++) {
			sprite = selectedTextures[i];
			if (highestObject == undefined) highestObject = sprite;
			if (sprite.parent.getChildIndex(sprite) > highestObject.parent.getChildIndex(highestObject)) {
				highestObject = sprite;
			}
		}
		return highestObject;
	}

	this.createBodyObjectFromVerts = function (verts) {
		var bodyObject = new this.bodyObject;

		var vertsConversion = this.convertGlobalVertsToLocalVerts(verts);
		verts = vertsConversion[0];
		var centerPoint = vertsConversion[1];

		bodyObject.x = centerPoint.x;
		bodyObject.y = centerPoint.y;

		//check winding order

		var area = 0
		for (var i = 0; i < verts.length; i++) {
			var x1 = verts[i].x;
			var y1 = verts[i].y;
			var x2 = verts[(i + 1) % verts.length].x;
			var y2 = verts[(i + 1) % verts.length].y;
			area += (x1 * y2 - x2 * y1);
		}
		if (Math.abs(area * this.PTM) < this.minimumBodySurfaceArea) return false;

		bodyObject.vertices = area < 0 ? verts.reverse() : verts;

		return bodyObject;
	}
	this.createBodyFromEarcutResult = function (verts) {
		var bodyObject = new this.bodyObject;

		var vertsConversion = this.convertGlobalVertsToLocalVerts(verts);
		verts = vertsConversion[0];
		var centerPoint = vertsConversion[1];

		bodyObject.x = centerPoint.x;
		bodyObject.y = centerPoint.y;

		var area = 0
		for (var i = 0; i < verts.length; i++) {
			var x1 = verts[i].x;
			var y1 = verts[i].y;
			var x2 = verts[(i + 1) % verts.length].x;
			var y2 = verts[(i + 1) % verts.length].y;
			area += (x1 * y2 - x2 * y1);
		}
		if (Math.abs(area * this.PTM) < this.minimumBodySurfaceArea) return false;


		bodyObject.vertices = [
			[verts]
		];
		bodyObject.radius = [bodyObject.radius];
		bodyObject.colorFill = [bodyObject.colorFill];
		bodyObject.colorLine = [bodyObject.colorLine];
		bodyObject.lineWidth = [bodyObject.lineWidth];
		bodyObject.transparancy = [bodyObject.transparancy];
		bodyObject.density = [bodyObject.density];

		return bodyObject;
	}
	this.createGraphicObjectFromVerts = function (verts) {
		var graphicObject = new this.graphicObject;
		for (var i = 0; i < verts.length; i++) {
			verts[i].x = verts[i].x * this.PTM;
			verts[i].y = verts[i].y * this.PTM;
			verts[i].point1 = (verts[i].point1 == undefined) ? undefined : {
				x: verts[i].point1.x * this.PTM,
				y: verts[i].point1.y * this.PTM
			};
			verts[i].point2 = (verts[i].point2 == undefined) ? undefined : {
				x: verts[i].point2.x * this.PTM,
				y: verts[i].point2.y * this.PTM
			};
		}
		var lowX = 0;
		var lowY = 0;
		for (var i = 0; i < verts.length; i++) {
			if (verts[i].x < lowX) lowX = verts[i].x;
			if (verts[i].y < lowY) lowY = verts[i].y;
		}

		for (var i = 0; i < verts.length; i++) {
			verts[i].x += lowX;
			verts[i].y += lowY;
			verts[i].point1 = (verts[i].point1 == undefined) ? undefined : {
				x: verts[i].point1.x + lowX,
				y: verts[i].point1.y + lowY
			};
			verts[i].point2 = (verts[i].point2 == undefined) ? undefined : {
				x: verts[i].point2.x + lowX,
				y: verts[i].point2.y + lowY
			};
		}

		var vertsConversion = this.convertGlobalVertsToLocalVerts(verts);
		verts = vertsConversion[0];
		var centerPoint = vertsConversion[1];

		graphicObject.x = centerPoint.x - lowX;
		graphicObject.y = centerPoint.y - lowY;
		graphicObject.vertices = verts;

		return graphicObject;
	}
	this.convertGlobalVertsToLocalVerts = function (verts) {
		var i = 0;
		var centerPoint = {
			x: 0,
			y: 0
		};
		var vert;
		for (i = 0; i < verts.length; i++) {
			vert = verts[i];
			centerPoint = {
				x: centerPoint.x + vert.x,
				y: centerPoint.y + vert.y
			};
		}
		centerPoint = {
			x: centerPoint.x / verts.length,
			y: centerPoint.y / verts.length
		};

		for (i = 0; i < verts.length; i++) {
			verts[i] = {
				x: verts[i].x - centerPoint.x,
				y: verts[i].y - centerPoint.y,
				point1: (verts[i].point1 == undefined) ? undefined : {
					x: verts[i].point1.x - centerPoint.x,
					y: verts[i].point1.y - centerPoint.y
				},
				point2: (verts[i].point2 == undefined) ? undefined : {
					x: verts[i].point2.x - centerPoint.x,
					y: verts[i].point2.y - centerPoint.y
				},
			};
		}
		return [verts, centerPoint];
	}
	this.convertSelectedGraphicsToBodies = function () {
		const bodiesCreated = this.convertGraphicsToBodies(this.selectedTextures);

		this.selectedPhysicsBodies = [];
		this.deleteSelection();
		this.selectedPhysicsBodies = bodiesCreated;
		this.updateSelection();
	}
	this.convertGraphicsToBodies = function (arr) {
		var graphic;
		var bodiesCreated = [];
		for (var i = 0; i < arr.length; i++) {
			var innerGraphics = [];

			var graphicContainer = arr[i];

			if (graphicContainer.data.type == this.object_GRAPHIC) innerGraphics.push(graphicContainer.data);
			else graphicContainer.data.graphicObjects.map(g => {
				innerGraphics.push(this.parseArrObject(JSON.parse(g)));
			});

			this.updateObject(graphicContainer, graphicContainer.data);

			var innerBodies = [];
			for (var j = 0; j < innerGraphics.length; j++) {

				graphic = innerGraphics[j];

				var verts = graphic.vertices;
				for (var k = 0; k < verts.length; k++) {
					verts[k].x /= this.PTM;
					verts[k].y /= this.PTM;
				}
				let bodyObject;
				if (graphic.radius) {
					bodyObject = new this.bodyObject;
					bodyObject.vertices = [{
						x: 0,
						y: 0
					}];

				} else {
					if (isConvex(verts)) bodyObject = this.createBodyObjectFromVerts(verts);
					else bodyObject = this.createBodyFromEarcutResult(verts);
				}

				if (bodyObject) {
					bodyObject.colorFill = graphic.colorFill;
					bodyObject.colorLine = graphic.colorLine;
					bodyObject.lineWidth = graphic.lineWidth;
					bodyObject.transparancy = graphic.transparancy;
					bodyObject.radius = graphic.radius || 0;
					bodyObject.x = graphic.x / this.PTM;
					bodyObject.y = graphic.y / this.PTM;

					if (graphic.radius) {
						bodyObject.x += graphic.vertices[0].x * this.PTM;
						bodyObject.y += graphic.vertices[0].y * this.PTM;
					}
					bodyObject.tileTexture = graphic.tileTexture;

					bodyObject.rotation = 0;
					innerBodies.push(this.buildBodyFromObj(bodyObject));
				}
			}

			innerBodies.map(b => {
				this.updateObject(b.mySprite, b.mySprite.data);
			});


			var body = null;
			if (innerBodies.length >= 1) body = this.groupBodyObjects(innerBodies);
			else body = innerBodies[0];

			if (body) {
				body.mySprite.parent.swapChildren(graphicContainer, body.mySprite);
				if (graphicContainer.data.type == this.object_GRAPHICGROUP) {
					body.mySprite.alpha = graphicContainer.data.transparancy;
					body.mySprite.data.transparancy[0] = graphicContainer.data.transparancy;
				}
				bodiesCreated.push(body);

				var left = Number.POSITIVE_INFINITY;
				var down = Number.POSITIVE_INFINITY;
				var right = -Number.POSITIVE_INFINITY;
				var up = -Number.POSITIVE_INFINITY;

				for (k = 0; k < innerGraphics.length; k++) {
					if (innerGraphics[k].x < left) left = innerGraphics[k].x;
					if (innerGraphics[k].y < down) down = innerGraphics[k].y;
					if (innerGraphics[k].x > right) right = innerGraphics[k].x;
					if (innerGraphics[k].y > up) up = innerGraphics[k].y;
				}


				var xOffset = (left - right) / this.PTM;
				var yOffset = (down - up) / this.PTM;

				body.SetPosition(new b2Vec2(graphicContainer.x / this.PTM + xOffset, graphicContainer.y / this.PTM + yOffset));
				body.SetAngle(graphicContainer.rotation);

			}
		}
		return bodiesCreated;
	}
	this.convertSelectedBodiesToGraphics = function () {
		var graphicsCreated = this.convertBodiesToGraphics(this.selectedPhysicsBodies);
		this.deleteSelection();
		this.selectedTextures = graphicsCreated;
		this.updateSelection();
	}
	this.convertBodiesToGraphics = function (arr) {
		var body;
		var graphic;
		var graphicsCreated = [];
		for (var i = 0; i < arr.length; i++) {
			body = arr[i];
			var verts = body.mySprite.data.vertices;
			var colorFill = body.mySprite.data.colorFill;
			var colorLine = body.mySprite.data.colorLine;
			var lineWidth = body.mySprite.data.lineWidth;
			var transparancy = body.mySprite.data.transparancy;
			var radius = body.mySprite.data.radius;

			this.updateObject(body.mySprite, body.mySprite.data);

			var graphics = [];

			for (var j = 0; j < verts.length; j++) {

				var graphicObject;
				if (radius[j]) {
					graphicObject = new this.graphicObject();
					graphicObject.vertices = verts[j];
				} else {

					let innerVerts;
					if (verts[j][0] instanceof Array == false) innerVerts = verts[j];
					else innerVerts = verts[j][0];

					graphicObject = this.createGraphicObjectFromVerts(innerVerts);
				}

				graphicObject.colorFill = colorFill[j];
				graphicObject.colorLine = colorLine[j];
				graphicObject.lineWidth = lineWidth[j];
				graphicObject.transparancy = transparancy[j + 1];
				graphicObject.radius = radius[j];

				graphicObject.x += body.mySprite.data.x * this.PTM;
				graphicObject.y += body.mySprite.data.y * this.PTM;
				graphicObject.tileTexture = body.mySprite.data.tileTexture;
				graphic = this.buildGraphicFromObj(graphicObject);
				if (graphic) {
					graphics.push(graphic);
				}
			}

			if (graphics.length > 1) graphic = this.groupGraphicObjects(graphics);

			graphic.rotation = body.mySprite.data.rotation;

			if (graphic) {
				graphic.alpha = body.mySprite.data.transparancy[0];
				graphic.data.transparancy = body.mySprite.data.transparancy[0];
				graphic.parent.swapChildren(body.mySprite, graphic);
				graphicsCreated.push(graphic);
			}

		}
		return graphicsCreated;
	}

	this.cameraOverlayGUIColor = "#000000";
	this.cameraOverlayGUICircleRadius = 20;
	this.doCamera = function () {
		this.debugGraphics.lineStyle(1, this.cameraOverlayGUIColor, 1);

		var sX = this.mousePosPixel.x - this.cameraSize.w / 2;
		var sY = this.mousePosPixel.y - this.cameraSize.h / 2;

		this.drawBox(this.debugGraphics, sX, sY, this.cameraSize.w, this.cameraSize.h, this.cameraOverlayGUIColor, 1, 1);

		var miniBoxScale = 0.3;
		var cornerSizeScale = 0.2;

		var mbhW = this.cameraSize.w * miniBoxScale / 2;
		var mbhH = this.cameraSize.h * miniBoxScale / 2;
		var cornerSize = mbhW * cornerSizeScale;

		this.debugGraphics.moveTo(this.mousePosPixel.x - mbhW, this.mousePosPixel.y - mbhH + cornerSize);
		this.debugGraphics.lineTo(this.mousePosPixel.x - mbhW, this.mousePosPixel.y - mbhH);
		this.debugGraphics.lineTo(this.mousePosPixel.x - mbhW + cornerSize, this.mousePosPixel.y - mbhH);

		this.debugGraphics.moveTo(this.mousePosPixel.x + mbhW, this.mousePosPixel.y - mbhH + cornerSize);
		this.debugGraphics.lineTo(this.mousePosPixel.x + mbhW, this.mousePosPixel.y - mbhH);
		this.debugGraphics.lineTo(this.mousePosPixel.x + mbhW - cornerSize, this.mousePosPixel.y - mbhH);

		this.debugGraphics.moveTo(this.mousePosPixel.x - mbhW, this.mousePosPixel.y + mbhH - cornerSize);
		this.debugGraphics.lineTo(this.mousePosPixel.x - mbhW, this.mousePosPixel.y + mbhH);
		this.debugGraphics.lineTo(this.mousePosPixel.x - mbhW + cornerSize, this.mousePosPixel.y + mbhH);

		this.debugGraphics.moveTo(this.mousePosPixel.x + mbhW, this.mousePosPixel.y + mbhH - cornerSize);
		this.debugGraphics.lineTo(this.mousePosPixel.x + mbhW, this.mousePosPixel.y + mbhH);
		this.debugGraphics.lineTo(this.mousePosPixel.x + mbhW - cornerSize, this.mousePosPixel.y + mbhH);
	}





	// TODO: FIX GROUPS ON CHANGE OF INDIVIDUAL GROUP // SAME FOR INSTANCE LATER

	this.addObjectToLookupGroups = function (obj, data) {

		//character1#character, .character, .vehicle, test
		// subgroup + refname
		var groupNoSpaces = data.groups.replace(/[ -!$%^&*()+|~=`{}\[\]:";'<>?\/]/g, '');
		var arr = (group == "") ? [] : groupNoSpaces.split(",");
		var subGroups = [];
		if (data.prefabInstanceName) arr.push(data.prefabInstanceName);

		if (arr.length == 0) return;

		var createdPrefabObject;

		var i;
		for (i = 0; i < arr.length; i++) {
			if (arr[i].charAt(0) === ".") {
				var subGroup = arr.splice(i, 1)[0];
				var classIndex = subGroup.indexOf('#');
				if (classIndex > 0 && !this.breakPrefabs) {
					var className = subGroup.substr(classIndex + 1, subGroup.length);
					subGroup = subGroup.substr(0, classIndex);
					var prefabName = subGroup.substr(1, subGroup.length);
					var instanceID = this.activePrefabs[data.prefabInstanceName].instanceID;
					var key = prefabName + "_" + instanceID;
					if (!this.activePrefabs[key]) {
						var newPrefabObj = new this.prefabObject();
						newPrefabObj.prefabName = prefabName;
						newPrefabObj.instanceID = instanceID;
						createdPrefabObject = newPrefabObj;
						newPrefabObj.key = key;
						this.activePrefabs[key] = newPrefabObj;
					}
					arr.push(key);
					data.subPrefabInstanceName = key;
				}
				subGroups.push(subGroup);
				i--;
			}
		}
		var group;
		var subGroup;
		var j;
		for (i = 0; i < arr.length; i++) {
			group = arr[i].replace(/[ -!$%^&*()+|~=`{}\[\]:";'<>?\/]/g, '');
			if (group == "") continue;
			if (this.lookupGroups[group] == undefined) {
				this.lookupGroups[group] = new this.lookupObject;
			}

			if (data.type == this.object_TEXTURE && obj.myBody == undefined) this.lookupGroups[group]._textures.push(obj);
			else if (data.type == this.object_BODY) this.lookupGroups[group]._bodies.push(obj);
			else if (data.type == this.object_JOINT) this.lookupGroups[group]._joints.push(obj);

			if (data.refName && data.refName != "") {
				this.lookupGroups[group][data.refName] = obj;
			}

			for (j = 0; j < subGroups.length; j++) {
				subGroup = subGroups[j].replace(/[ -!$%^&*()+|~=`{}\[\]:";'<>?,.\/]/g, '');
				if (subGroup == "") continue;
				if (this.lookupGroups[group][subGroup] == undefined) {
					this.lookupGroups[group][subGroup] = new this.lookupObject;
				}
				if (this.lookupGroups[group][subGroup] instanceof this.lookupObject) {
					if (data.type == this.object_TEXTURE && obj.myBody == undefined) this.lookupGroups[group][subGroup]._textures.push(obj);
					else if (data.type == this.object_BODY) this.lookupGroups[group][subGroup]._bodies.push(obj);
					else if (data.type == this.object_JOINT) this.lookupGroups[group][subGroup]._joints.push(obj);
					if (data.refName && data.refName != "") {
						this.lookupGroups[group][subGroup][data.refName] = obj;
					}
				}
			}
		}
		if (createdPrefabObject) {
			createdPrefabObject.class = new PrefabManager.prefabLibrary[className].class(createdPrefabObject);
			this.createdSubPrefabClasses.push(createdPrefabObject.class);
		}
	}
	this.removeObjectFromLookupGroups = function (obj, data) {
		if (!data) return;
		var groupNoSpaces = data.groups.replace(/[ -!$%^&*()+|~=`{}\[\]:";'<>?\/]/g, '');
		var arr = (group == "") ? [] : groupNoSpaces.split(",");
		var subGroups = [];
		if (data.prefabInstanceName) arr.push(data.prefabInstanceName);

		if (arr.length == 0) return;

		var i;
		for (i = 0; i < arr.length; i++) {
			if (arr[i].charAt(0) === ".") {
				var subGroup = arr.splice(i, 1)[0];
				var classIndex = subGroup.indexOf('#');
				if (classIndex > 0 && !this.breakPrefabs) {
					subGroup = subGroup.substr(0, classIndex);
					var key = data.subPrefabInstanceName;
					if (this.activePrefabs[key] && this.lookupGroups[key]._bodies.length + this.lookupGroups[key]._textures.length + this.lookupGroups[key]._joints.length == 1) {
						delete this.activePrefabs[key];
					}
					arr.push(key);
				}
				subGroups.push(subGroup);
				i--;
			}
		}
		var group;
		var subGroup;
		var j;
		for (i = 0; i < arr.length; i++) {
			group = arr[i].replace(/[ -!$%^&*()+|~=`{}\[\]:";'<>?\/]/g, '');
			if (this.lookupGroups[group] != undefined) {
				let tarArray = [];
				if (data.type == this.object_TEXTURE && obj.myBody == undefined) tarArray = this.lookupGroups[group]._textures;
				else if (data.type == this.object_BODY) tarArray = this.lookupGroups[group]._bodies;
				else if (data.type == this.object_JOINT) tarArray = this.lookupGroups[group]._joints;


				var tarIndex = tarArray.indexOf(obj);
				if (tarIndex >= 0) tarArray.splice(tarIndex, 1);

				if (data.refName && data.refName != "") {
					delete this.lookupGroups[group][data.refName];
				}
				for (j = 0; j < subGroups; j++) {
					subGroup = subGroups[j].replace(/[ -!$%^&*()+|~=`{}\[\]:";'<>?,.\/]/g, '');
					if (this.lookupGroups[group][subGroup] != undefined && this.lookupGroups[group][subGroup] instanceof this.lookupObject) {
						if (data.type == this.object_TEXTURE && obj.myBody == undefined) tarArray = this.lookupGroups[group][subGroup]._textures;
						else if (data.type == this.object_BODY) tarArray = this.lookupGroups[group][subGroup]._bodies;
						else if (data.type == this.object_JOINT) tarArray = this.lookupGroups[group][subGroup]._joints;

						tarIndex = tarArray.indexOf(obj);
						if (tarIndex > 0) tarArray.splice(tarIndex, 1);

						if (data.refName && data.refName != "") {
							delete this.lookupGroups[group][subGroup][data.refName];
						}
					}
				}
				if (this.lookupGroups[group]._bodies.length + this.lookupGroups[group]._textures.length + this.lookupGroups[group]._joints.length == 0) delete this.lookupGroups[group];
			}
		}
	}

	this.buildTextureFromObj = function (obj) {

		var container;
		var sprite = new PIXI.heaven.Sprite(PIXI.Texture.fromFrame(obj.textureName));

		container = new PIXI.Container();
		container.pivot.set(sprite.width / 2, sprite.height / 2);
		container.addChild(sprite);

		container.originalSprite = sprite;

		this.textures.addChild(container);

		container.x = obj.x;
		container.y = obj.y;
		container.rotation = obj.rotation;
		container.data = obj;
		container.alpha = obj.transparancy;

		container.width = container.width * obj.scaleX;
		container.height = container.height * obj.scaleY;

		var color = obj.tint;
		color = color.slice(1);
		container.originalSprite.tint = parseInt(color, 16);

		if (container.data.bodyID != undefined) {
			var body = this.textures.getChildAt(container.data.bodyID).myBody;
			this.setTextureToBody(body, container, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
			this.updateBodyPosition(body);
		}
		//handle groups and ref names
		this.addObjectToLookupGroups(container, container.data);

		return container;
	}
	this.buildTriggerFromObj = function (obj) {
		var bodyObject = JSON.parse(JSON.stringify(obj));
		bodyObject.fixed = true;
		bodyObject.density = 1;
		bodyObject.collision = 2;

		var body = this.buildBodyFromObj(bodyObject);
		this.removeObjectFromLookupGroups(body, body.mySprite.data);

		body.mySprite.data = obj;
		body.mySprite.targets = [];
		body.mySprite.targetPrefabs = [];
		this.addObjectToLookupGroups(body, body.mySprite.data);

		this.triggerObjects.push(body);

		return body;
	}
	this.buildTextFromObj = function (obj) {
		let container;
		let text = this.buildTextGraphicFromObj(obj);

		container = new PIXI.Container();
		container.pivot.set(text.width / 2, text.height / 2);
		container.addChild(text);

		container.textSprite = text;

		this.textures.addChild(container);

		container.x = obj.x;
		container.y = obj.y;
		container.rotation = obj.rotation;
		container.data = obj;

		if (container.data.bodyID != undefined) {
			var body = this.textures.getChildAt(container.data.bodyID).myBody;
			this.setTextureToBody(body, container, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}

		//handle groups and ref names
		this.addObjectToLookupGroups(container, container.data);

		return container;
	}
	this.buildTextGraphicFromObj = function (obj) {
		let text = new PIXI.Text();
		let style = new PIXI.TextStyle();
		style.fontFamily = obj.fontName;
		style.fontSize = obj.fontSize;
		style.fill = obj.textColor;
		style.align = obj.textAlign;

		text.text = obj.text;
		text.style = style;
		return text;
	}
	this.buildBodyFromObj = function (obj) {

		var bd = new b2BodyDef();
		if (obj.fixed) bd.type = Box2D.b2BodyType.b2_staticBody;
		else bd.type = Box2D.b2BodyType.b2_dynamicBody;
		bd.angularDamping = 0.9;

		var body = this.world.CreateBody(bd);
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

		//build fixtures
		let fixDef;
		let fixture;
		for (var i = 0; i < obj.vertices.length; i++) {
			let innerVertices;

			if (obj.vertices[i][0] instanceof Array == false) innerVertices = [obj.vertices[i]];
			else {
				let j;
				//lets build convex shapes
				let pointsArr = [];
				for (j = 0; j < obj.vertices[i][0].length; j++) {
					pointsArr.push(obj.vertices[i][0][j].x);
					pointsArr.push(obj.vertices[i][0][j].y);
				}

				const earcutIndexes = PIXI.utils.earcut(pointsArr, [], 2);

				const earcutPoints = [];
				for (j = 0; j < earcutIndexes.length; j++) {
					earcutPoints.push(obj.vertices[i][0][earcutIndexes[j]]);
				}

				let earcutTriangles = [];
				while (earcutPoints.length) {
					earcutTriangles.push(earcutPoints.splice(0, 3));
				}

				//
				innerVertices = earcutTriangles;
			}

			for (let j = 0; j < innerVertices.length; j++) {
				fixDef = new b2FixtureDef;
				fixDef.density = obj.density[i];
				fixDef.friction = 0.5;
				fixDef.restitution = 0.2;
				const radius = obj.radius[i];
				if (!radius) {
					let vert;
					let b2Vec2Arr = [];
					let vertices = innerVertices[j];
					for (var k = 0; k < vertices.length; k++) {
						vert = vertices[k];
						b2Vec2Arr.push(new b2Vec2(vert.x, vert.y));
					}

					fixDef.shape = new b2PolygonShape;
					fixDef.shape.SetAsArray(b2Vec2Arr, b2Vec2Arr.length);
				} else {
					fixDef.shape = new b2CircleShape;
					fixDef.shape.SetLocalPosition(new b2Vec2(innerVertices[j][0].x, innerVertices[j][0].y));
					fixDef.shape.SetRadius(radius / this.PTM);
				}
				fixture = body.CreateFixture(fixDef);
			}
		}

		body.SetPositionAndAngle(new b2Vec2(obj.x, obj.y), 0);
		body.SetAngle(obj.rotation);


		body.mySprite = new PIXI.Sprite();
		this.textures.addChild(body.mySprite);

		body.mySprite.addChild(body.originalGraphic);

		body.mySprite.myBody = body;
		body.mySprite.data = obj;

		body.mySprite.alpha = obj.transparancy[0];


		this.updateBodyShapes(body);

		body.mySprite.x = body.GetPosition().x * this.PTM;
		body.mySprite.y = body.GetPosition().y * this.PTM;
		body.mySprite.rotation = body.GetAngle();

		if (obj.tileTexture != "") this.updateTileSprite(body);

		this.setBodyCollision(body, obj.collision);

		this.addObjectToLookupGroups(body, body.mySprite.data);

		return body;

	}
	this.buildGraphicFromObj = function (obj) {
		var container = new PIXI.Container();
		container.data = obj;
		container.x = obj.x;
		container.y = obj.y;
		container.rotation = obj.rotation;


		var originalGraphic = new PIXI.Graphics();
		container.addChild(originalGraphic);
		container.originalGraphic = originalGraphic;

		if (!obj.radius) this.updatePolyGraphic(originalGraphic, obj.vertices, obj.colorFill, obj.colorLine, obj.lineWidth, obj.transparancy);
		else this.updateCircleGraphic(originalGraphic, obj.radius, obj.vertices[0], obj.colorFill, obj.colorLine, obj.lineWidth, obj.transparancy);

		this.textures.addChild(container);

		if (container.data.bodyID != undefined) {
			var body = this.textures.getChildAt(container.data.bodyID).myBody;
			this.setTextureToBody(body, container, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}

		if (obj.tileTexture != "") this.updateTileSprite(container);


		this.addObjectToLookupGroups(container, container.data);
		return container;

	}
	this.buildGraphicGroupFromObj = function (obj) {
		var graphic = new PIXI.Container();
		graphic.data = obj;
		graphic.x = obj.x;
		graphic.y = obj.y;
		graphic.rotation = obj.rotation;

		this.updateGraphicShapes(graphic);
		this.textures.addChild(graphic);

		if (graphic.data.bodyID != undefined) {
			var body = this.textures.getChildAt(graphic.data.bodyID).myBody;
			this.setTextureToBody(body, graphic, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}

		graphic.alpha = obj.transparancy;

		this.addObjectToLookupGroups(graphic, graphic.data);
		return graphic;
	}
	this.buildAnimationGroupFromObject = function (obj) {
		var graphic = new PIXI.Container();
		graphic.data = obj;
		graphic.x = obj.x;
		graphic.y = obj.y;
		graphic.rotation = obj.rotation;

		this.updateGraphicShapes(graphic);
		this.textures.addChild(graphic);

		if (graphic.data.bodyID != undefined) {
			var body = this.textures.getChildAt(graphic.data.bodyID).myBody;
			this.setTextureToBody(body, graphic, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}

		graphic.alpha = obj.transparancy;

		this.initAnimation(graphic);

		this.addObjectToLookupGroups(graphic, graphic.data);
		return graphic;
	}
	this.initAnimation = function(container){
		container.frameTime = 1000/container.data.fps;
		container.playing = container.data.playing;
		if(!container.isAnimation){
			container.isAnimation = true;
			container.totalFrames = container.children.length;
			for(let i = 1; i<container.totalFrames; i++){
				container.children[i].visible = false;
			}
			container.currentFrameTime = 0;
			container.currentFrame = 1;
			container.updateAnimation = delta=>{
				container.currentFrameTime+=delta;
				while(container.currentFrameTime>=container.frameTime){
					container.currentFrameTime -= container.frameTime;
					container.nextFrame();
				}
			}
			container.setFrame = index=>{
				if(index>container.totalFrames) index = 1;
				if(index<1) index = container.totalFrames;
				container.children[container.currentFrame-1].visible = false;
				container.children[index-1].visible = true;
				container.currentFrame = index;
			}
			container.nextFrame = ()=>{
				container.setFrame(container.currentFrame+1);
			}
			container.prevFrame = ()=>{
				container.setFrame(container.currentFrame-1);
			}
		}
	}
	this.setScale = function (obj, scaleX, scaleY) {

		//do we include a circle?
		let data;
		if (obj.mySprite) data = obj.mySprite.data;
		else data = obj.data;

		if (Math.round(scaleX * 100) / 100 == 1 && Math.round(scaleY * 100) / 100 == 1) return;

		if (data.type == this.object_BODY || data.type == this.object_TRIGGER) {

			let oldFixtures = []
			const body = obj;
			let fixture = body.GetFixtureList();
			while (fixture != null) {
				oldFixtures.push(fixture);
				if (fixture.GetShape() instanceof b2CircleShape) {
					//oh shit we have a circle, must scale with aspect ratio
					if (Math.round(scaleX * 100) / 100 != 1) {
						scaleY = scaleX;
					} else {
						scaleX = scaleY;
					}
				}
				fixture = fixture.GetNext();
			}

			oldFixtures.reverse();

			for (let i = 0; i < oldFixtures.length; i++) {
				let fixture = oldFixtures[i];
				var shape = fixture.GetShape();
				if (shape instanceof Box2D.b2PolygonShape) {
					let oldVertices = shape.GetVertices();

					for (let j = 0; j < oldVertices.length; j++) {
						oldVertices[j].x = oldVertices[j].x * scaleX;
						oldVertices[j].y = oldVertices[j].y * scaleY;
					}
					shape.Set(oldVertices);

					if(data.type === this.object_TRIGGER){
						obj.mySprite.data.vertices = oldVertices.map(vertice =>({x:vertice.x, y:vertice.y}));
					}

					oldVertices = obj.mySprite.data.vertices[i];
					for (let j = 0; j < oldVertices.length; j++) {
						oldVertices[j].x = oldVertices[j].x * scaleX;
						oldVertices[j].y = oldVertices[j].y * scaleY;
					}

				} else if (shape instanceof Box2D.b2CircleShape) {
					shape.SetRadius(shape.GetRadius() * scaleX);
					if(Array.isArray(body.mySprite.data.radius)) body.mySprite.data.radius = body.mySprite.data.radius.map(r => r* scaleX);
					else body.mySprite.data.radius = body.mySprite.data.radius* scaleX;
				}
				fixture.DestroyProxies();
				fixture.CreateProxies(body.m_xf);

			};
			if(data.type !== this.object_TRIGGER){
				this.updateBodyShapes(body);
				this.updateTileSprite(body, true);
				// needed to update the culling engine
				body.mySprite._cullingSizeDirty = true;
				body.mySprite.position.x++;
				body.mySprite.position.x--;
			}

			if (body.myTexture) this.setScale(body.myTexture, scaleX, scaleY);

		} else {
			var sprite = obj;

			if (sprite.data.type == this.object_GRAPHICGROUP) {

				let centerPoint = {
					x: 0,
					y: 0
				};
				for (let j = 0; j < sprite.data.graphicObjects.length; j++) {
					const gObj = this.parseArrObject(JSON.parse(sprite.data.graphicObjects[j]));

					if (gObj instanceof this.graphicObject) {
						if (gObj.radius) {
							if (Math.round(scaleX * 100) / 100 != 1) {
								scaleY = scaleX;
							} else {
								scaleX = scaleY;
							}
						}
					}
					centerPoint.x += gObj.x;
					centerPoint.y += gObj.y;
				}

				centerPoint.x /= sprite.data.graphicObjects.length;
				centerPoint.y /= sprite.data.graphicObjects.length;

				for (let j = 0; j < sprite.data.graphicObjects.length; j++) {
					const gObj = this.parseArrObject(JSON.parse(sprite.data.graphicObjects[j]));

					if (gObj instanceof this.graphicObject) {
						for (var k = 0; k < gObj.vertices.length; k++) {
							gObj.vertices[k].x *= scaleX;
							gObj.vertices[k].y *= scaleY;
						}
					}
					const xDif = gObj.x - centerPoint.x;
					const yDif = gObj.y - centerPoint.y;
					gObj.x = centerPoint.x + xDif * scaleX;
					gObj.y = centerPoint.y + yDif * scaleY;

					sprite.data.graphicObjects[j] = this.stringifyObject(gObj);
				}
				this.updateGraphicShapes(sprite);
				// needed to update the culling engine
			} else if (sprite.data.type == this.object_GRAPHIC) {
				for (let j = 0; j < sprite.data.vertices.length; j++) {
					sprite.data.vertices[j].x *= scaleX;
					sprite.data.vertices[j].y *= scaleY;
				}
				if (sprite.data.radius) sprite.data.radius *= scaleX;
				if (!sprite.data.radius) this.updatePolyGraphic(sprite.originalGraphic, sprite.data.vertices, sprite.data.colorFill, sprite.data.colorLine, sprite.data.lineWidth, sprite.data.transparancy);
				else this.updateCircleGraphic(sprite.originalGraphic, sprite.data.radius, sprite.data.vertices[0], sprite.data.colorFill, sprite.data.colorLine, sprite.data.lineWidth, sprite.data.transparancy);
				this.updateTileSprite(sprite, true);
			} else if (sprite.data.type == this.object_TEXTURE) {
				sprite.width = sprite.width * scaleX;
				sprite.height = sprite.height * scaleY;

				sprite.data.scaleX = sprite.scale.x;
				sprite.data.scaleY = sprite.scale.y;

				var xL = sprite.data.texturePositionOffsetLength * Math.cos(sprite.data.texturePositionOffsetAngle) * scaleX;
				var yL = sprite.data.texturePositionOffsetLength * Math.sin(sprite.data.texturePositionOffsetAngle) * scaleY;
				sprite.data.texturePositionOffsetLength = Math.sqrt(xL * xL + yL * yL);

			}
			//update culling shape
			sprite._cullingSizeDirty = true;
			sprite.x++;
			sprite.x--;

		}

	}

	this.groupObjects = function () {
		var combinedGraphics;
		var combinedBodies;
		if (this.selectedPhysicsBodies.length > 0) {
			combinedBodies = this.selectedPhysicsBodies[0];
			for (var i = 0; i < this.selectedPhysicsBodies.length; i++) {
				if (this.selectedPhysicsBodies[i].myTexture) {
					var texture = this.selectedPhysicsBodies[i].myTexture;
					this.removeTextureFromBody(this.selectedPhysicsBodies[i], texture);
					this.selectedTextures.push(texture);
				}
			}
		}

		if (this.selectedPhysicsBodies.length > 1) {
			for (let i = 0; i < this.selectedPhysicsBodies.length; i++) {
				if (this.selectedPhysicsBodies[i].mySprite.data.vertices.length > 1) {
					let bodies = this.ungroupBodyObjects(this.selectedPhysicsBodies[i]);
					this.selectedPhysicsBodies.splice(i, 1);
					this.selectedPhysicsBodies = this.selectedPhysicsBodies.concat(bodies);
					i--;
				}
			}
			combinedBodies = this.groupBodyObjects(this.selectedPhysicsBodies);
		}


		if (this.selectedTextures.length > 1) {
			var graphicsToGroup = [];
			for (var i = 0; i < this.selectedTextures.length; i++) {
				if (this.selectedTextures[i].data instanceof this.graphicGroup) {
					graphicsToGroup = graphicsToGroup.concat(this.ungroupGraphicObjects(this.selectedTextures[i]));
				} else {
					graphicsToGroup.push(this.selectedTextures[i]);
				}
			}
			combinedGraphics = this.groupGraphicObjects(graphicsToGroup);
		} else if (this.selectedTextures.length == 1) {
			combinedGraphics = this.selectedTextures[0];
		}

		if (combinedGraphics && combinedBodies) {
			//merge these two together yo
			var dif = new b2Vec2(combinedGraphics.x - combinedBodies.GetPosition().x * this.PTM, combinedGraphics.y - combinedBodies.GetPosition().y * this.PTM);
			var angleOffset = combinedBodies.GetAngle() - Math.atan2(dif.y, dif.x);
			var angle = combinedBodies.GetAngle() - combinedGraphics.rotation;
			if (combinedBodies.mySprite.parent.getChildIndex(combinedBodies.mySprite) > combinedGraphics.parent.getChildIndex(combinedGraphics)) {
				combinedBodies.mySprite.parent.swapChildren(combinedBodies.mySprite, combinedGraphics);
			}
			this.updateObject(combinedBodies.mySprite, combinedBodies.mySprite.data);
			this.updateObject(combinedGraphics, combinedGraphics.data);
			this.setTextureToBody(combinedBodies, combinedGraphics, dif.Length(), angleOffset, angle);
		}

		this.selectedTextures = [];
		this.selectedPhysicsBodies = [];
		this.updateSelection();
	}
	this.ungroupObjects = function () {
		if (this.selectedPhysicsBodies.length == 1) {
			var myTexture = this.selectedPhysicsBodies[0].myTexture;
			if (myTexture) {
				this.removeTextureFromBody(this.selectedPhysicsBodies[0], myTexture);
				if (myTexture.data instanceof this.graphicGroup) {
					this.ungroupGraphicObjects(myTexture);
				}
			}
			if(this.selectedPhysicsBodies[0].mySprite.data.vertices.length>1) this.ungroupBodyObjects(this.selectedPhysicsBodies[0]);
		}
		if (this.selectedTextures.length == 1 && [this.object_GRAPHICGROUP, this.object_ANIMATIONGROUP].includes(this.selectedTextures[0].data.type)) {
			this.ungroupGraphicObjects(this.selectedTextures[0]);
		}
		this.selectedTextures = [];
		this.selectedPhysicsBodies = [];
		this.updateSelection();
	}
	this.groupBodyObjects = function (bodyObjects) {

		bodyObjects.sort(function (a, b) {
			return a.mySprite.data.ID - b.mySprite.data.ID;
		});

		var groupedBodyObject = new this.bodyObject;
		groupedBodyObject.vertices = [];
		groupedBodyObject.colorFill = [];
		groupedBodyObject.colorLine = [];
		groupedBodyObject.lineWidth = [];
		groupedBodyObject.transparancy = [1];
		groupedBodyObject.radius = [];
		groupedBodyObject.density = [];

		// let bounds = {l:Number.POSITIVE_INFINITY, r:-Number.POSITIVE_INFINITY, u:-Number.POSITIVE_INFINITY, d:Number.POSITIVE_INFINITY};
		let centerPoint = {
			x: 0,
			y: 0
		};
		bodyObjects.map((body) => {
			this.updateObject(body.mySprite, body.mySprite.data);
			centerPoint.x += body.GetPosition().x;
			centerPoint.y += body.GetPosition().y;
			// if(body.GetPosition().x < bounds.l) bounds.l = body.GetPosition().x;
			// if(body.GetPosition().y < bounds.d) bounds.d = body.GetPosition().y;
			// if(body.GetPosition().x > bounds.r) bounds.r = body.GetPosition().x;
			// if(body.GetPosition().y > bounds.u) bounds.u = body.GetPosition().y;

		});
		centerPoint.x /= bodyObjects.length;
		centerPoint.y /= bodyObjects.length;

		//let centerOffset = {x:(bounds.l-bounds.r)/2, y:(bounds.d-bounds.u)/2};

		groupedBodyObject.x = centerPoint.x;
		groupedBodyObject.y = centerPoint.y;
		groupedBodyObject.rotation = 0;
		groupedBodyObject.tileTexture = bodyObjects[0].mySprite.data.tileTexture;

		for (let i = 0; i < bodyObjects.length; i++) {
			var vertices = [];
			for (var j = 0; j < bodyObjects[i].mySprite.data.vertices.length; j++) {
				var verts = [];

				let innerVerts;

				if (bodyObjects[i].mySprite.data.vertices[j][0] instanceof Array == false) innerVerts = [bodyObjects[i].mySprite.data.vertices[j]];
				else innerVerts = bodyObjects[i].mySprite.data.vertices[j];

				for (var k = 0; k < innerVerts.length; k++) {

					verts[k] = [];

					for (var l = 0; l < innerVerts[k].length; l++) {

						const offsetCenterPoint = {
							x: bodyObjects[i].GetPosition().x - centerPoint.x,
							y: bodyObjects[i].GetPosition().y - centerPoint.y
						}

						var p = {
							x: innerVerts[k][l].x,
							y: innerVerts[k][l].y
						};

						var pl = Math.sqrt(p.x * p.x + p.y * p.y);
						var pa = Math.atan2(p.y, p.x);
						var a = bodyObjects[i].GetAngle();
						p.x = pl * Math.cos(a + pa);
						p.y = pl * Math.sin(a + pa);

						verts[k].push({
							x: p.x + offsetCenterPoint.x,
							y: p.y + offsetCenterPoint.y,
						});
					}
				}
				if (bodyObjects[i].mySprite.data.vertices[j][0] instanceof Array == false) verts = flatten(verts);
				vertices.push(verts);
			}
			groupedBodyObject.vertices = groupedBodyObject.vertices.concat(vertices);
			groupedBodyObject.radius = groupedBodyObject.radius.concat(bodyObjects[i].mySprite.data.radius)
			groupedBodyObject.colorFill = groupedBodyObject.colorFill.concat(bodyObjects[i].mySprite.data.colorFill);
			groupedBodyObject.colorLine = groupedBodyObject.colorLine.concat(bodyObjects[i].mySprite.data.colorLine);
			groupedBodyObject.lineWidth = groupedBodyObject.lineWidth.concat(bodyObjects[i].mySprite.data.lineWidth);
			groupedBodyObject.transparancy = groupedBodyObject.transparancy.concat(bodyObjects[i].mySprite.data.transparancy);
			groupedBodyObject.density = groupedBodyObject.density.concat(bodyObjects[i].mySprite.data.density);

		}

		var groupedBody = this.buildBodyFromObj(groupedBodyObject);

		groupedBody.mySprite.parent.swapChildren(groupedBody.mySprite, bodyObjects[0].mySprite);

		this.deleteObjects(bodyObjects);
		this.selectedPhysicsBodies = [groupedBody];
		return groupedBody;
	}
	this.ungroupBodyObjects = function (bodyGroup) {
		var bodies = [];

		this.updateObject(bodyGroup.mySprite, bodyGroup.mySprite.data);

		var verts = bodyGroup.mySprite.data.vertices;
		var colorFill = bodyGroup.mySprite.data.colorFill;
		var colorLine = bodyGroup.mySprite.data.colorLine;
		var lineWidth = bodyGroup.mySprite.data.lineWidth;
		var transparancy = bodyGroup.mySprite.data.transparancy;
		var radius = bodyGroup.mySprite.data.radius;
		var density = bodyGroup.mySprite.data.density;

		for (var i = 0; i < verts.length; i++) {
			var bodyObject = new this.bodyObject;

			let innerVerts;

			if (verts[i][0] instanceof Array == false) innerVerts = [verts[i]];
			else innerVerts = verts[i];


			var centerPoint = {
				x: 0,
				y: 0
			};
			for (var j = 0; j < innerVerts.length; j++) {
				for (var k = 0; k < innerVerts[j].length; k++) {
					centerPoint.x += innerVerts[j][k].x;
					centerPoint.y += innerVerts[j][k].y;
				}
			}

			const innerVertsFlatLength = flatten(innerVerts).length;

			centerPoint.x = centerPoint.x / innerVertsFlatLength;
			centerPoint.y = centerPoint.y / innerVertsFlatLength;

			for (var j = 0; j < innerVerts.length; j++) {
				for (var k = 0; k < innerVerts[j].length; k++) {
					innerVerts[j][k].x -= centerPoint.x;
					innerVerts[j][k].y -= centerPoint.y;
				}
			}

			if (verts[i][0] instanceof Array == false) innerVerts = flatten(innerVerts);
			else innerVerts = [innerVerts];


			var a = bodyGroup.mySprite.data.rotation;
			var atanO = Math.atan2(centerPoint.y, centerPoint.x);
			var sqrtO = Math.sqrt(centerPoint.x * centerPoint.x + centerPoint.y * centerPoint.y);

			centerPoint.x = sqrtO * Math.cos(a + atanO);
			centerPoint.y = sqrtO * Math.sin(a + atanO);

			bodyObject.x += bodyGroup.mySprite.x / this.PTM + centerPoint.x;
			bodyObject.y += bodyGroup.mySprite.y / this.PTM + centerPoint.y;
			bodyObject.rotation = bodyGroup.mySprite.rotation;
			bodyObject.vertices = innerVerts;
			bodyObject.colorFill = colorFill[i];
			bodyObject.colorLine = colorLine[i];
			bodyObject.lineWidth = lineWidth[i];
			bodyObject.transparancy = transparancy[i + 1];
			bodyObject.density = density[i];

			if (innerVerts[0] instanceof Array == true) { // a fix for earcut bodies being ungrouped
				bodyObject.colorFill = [bodyObject.colorFill];
				bodyObject.colorLine = [bodyObject.colorLine];
				bodyObject.lineWidth = [bodyObject.lineWidth];
				bodyObject.transparancy = [bodyObject.transparancy];
				bodyObject.density = [bodyObject.density];
			}


			bodyObject.radius = radius[i];

			var body = this.buildBodyFromObj(bodyObject);

			var container = body.mySprite.parent;
			container.removeChild(body.mySprite);
			container.addChildAt(body.mySprite, bodyGroup.mySprite.data.ID + i);

			bodies.push(body);
		}

		this.deleteObjects([bodyGroup]);


		return bodies;
	}
	this.groupGraphicObjects = function (graphicObjects) {
		var graphicGroup = new this.graphicGroup();
		var sortArray = [];

		//sort by childIndex
		var graphic;
		var i;
		var centerPoint = {
			x: 0,
			y: 0
		}
		for (i = 0; i < graphicObjects.length; i++) {
			graphic = graphicObjects[i];
			this.updateObject(graphic, graphic.data);
			centerPoint.x += graphic.x;
			centerPoint.y += graphic.y;
		}
		centerPoint.x = centerPoint.x / graphicObjects.length;
		centerPoint.y = centerPoint.y / graphicObjects.length;

		graphicGroup.x = centerPoint.x;
		graphicGroup.y = centerPoint.y;

		graphicObjects.sort(function (a, b) {
			return a.data.ID - b.data.ID;
		});

		for (i = 0; i < graphicObjects.length; i++) {
			graphicObjects[i].data.x -= centerPoint.x;
			graphicObjects[i].data.y -= centerPoint.y;
			graphicGroup.graphicObjects.push(this.stringifyObject(graphicObjects[i].data));
			this.deleteObjects([graphicObjects[i]]);
		}

		var graphic = this.buildGraphicGroupFromObj(graphicGroup);

		var container = graphic.parent;
		container.removeChild(graphic);
		container.addChildAt(graphic, graphicObjects[0].data.ID);


		return graphic;

	}
	this.ungroupGraphicObjects = function (graphicGroup) {
		var graphicObjects = [];

		this.updateObject(graphicGroup, graphicGroup.data);

		for (let i = 0; i < graphicGroup.data.graphicObjects.length; i++) {
			const graphicObject = this.parseArrObject(JSON.parse(graphicGroup.data.graphicObjects[i]));

			const cosAngle = Math.cos(graphicGroup.rotation);
			const sinAngle = Math.sin(graphicGroup.rotation);
			const dx = graphicObject.x;
			const dy = graphicObject.y;
			graphicObject.x = (dx * cosAngle - dy * sinAngle);
			graphicObject.y = (dx * sinAngle + dy * cosAngle);

			graphicObject.x += graphicGroup.x;
			graphicObject.y += graphicGroup.y;
			graphicObject.rotation = graphicGroup.rotation + graphicObject.rotation;

			let graphic;
			if(graphicObject.type == this.object_GRAPHIC){
				graphic = this.buildGraphicFromObj(graphicObject);
			}else if(graphicObject.type == this.object_TEXTURE){
				graphic = this.buildTextureFromObj(graphicObject);
			}else if(graphicObject.type == this.object_TEXT){
				graphic = this.buildTextFromObj(graphicObject);
			}else if(graphicObject.type == this.object_GRAPHICGROUP){
				graphic = this.buildGraphicGroupFromObj(graphicObject);
			}

			const container = graphic.parent;
			container.removeChild(graphic);
			container.addChildAt(graphic, graphicGroup.data.ID + i);

			graphicObjects.push(graphic);
		}
		this.deleteObjects([graphicGroup]);

		return graphicObjects;
	}
	this.createAnimationGroup = function(){

		var graphicGroup = new this.animationGroup();

		//sort by childIndex
		var graphic;
		var i;
		var centerPoint = {
			x: 0,
			y: 0
		}
		
		const graphicObjects = [];
		for(i = 0; i<this.selectedTextures.length; i++){
			graphicObjects.push(this.selectedTextures[i]);
		}

		for (i = 0; i < graphicObjects.length; i++) {
			graphic = graphicObjects[i];
			this.updateObject(graphic, graphic.data);
			centerPoint.x += graphic.x;
			centerPoint.y += graphic.y;
		}
		centerPoint.x = centerPoint.x / graphicObjects.length;
		centerPoint.y = centerPoint.y / graphicObjects.length;

		graphicGroup.x = centerPoint.x;
		graphicGroup.y = centerPoint.y;

		graphicObjects.sort(function (a, b) {
			return a.data.ID - b.data.ID;
		});

		for (i = 0; i < graphicObjects.length; i++) {
			graphicObjects[i].data.x -= centerPoint.x;
			graphicObjects[i].data.y -= centerPoint.y;
			graphicGroup.graphicObjects.push(this.stringifyObject(graphicObjects[i].data));
			this.deleteObjects([graphicObjects[i]]);
		}

		var graphic = this.buildGraphicGroupFromObj(graphicGroup);

		var container = graphic.parent;
		container.removeChild(graphic);
		container.addChildAt(graphic, graphicObjects[0].data.ID);


		this.selectedTextures = [];
		this.updateSelection();

		this.initAnimation(graphic);

		return graphic;


	}


	this.setBodyCollision = function (body, collision) {
		// COLLISION HELP
		/*0) collides with everything
		- nothing

		1) collides with mostly everything but characters
		- mask bit set to CHARACTER_MASKBIT

		2) collides with nothing
		- setAsTrigger

		3) collides with everything except other shapes with collision set to this value.
		- catagory CUSTOM_MASKBIT, mask CUSTOM_MASKBIT

		4) collides only with other shapes with collision set to this value.
		- catagory CUSTOM_MASKBIT, mask CUSTOM_MASKBIT

		5) collides only with fixed shapes
		 - set mask to CHARACTER_MASKBIT, CUSTOM_MASKBIT, NORMAL_MASKBIT;

		6) collides only with characters
		- set mask to CUSTOM_MASKBIT, FIXED_MASKBIT, NORMAL_MASKBIT

		7) does not collide with character
		-

		all bits:
		CHARACTER_MASKBIT;
		CUSTOM_MASKBIT;
		FIXED_MASKBIT;
		NORMAL_MASKBIT;

		if either fixture has a groupIndex of zero, use the category/mask rules as above
		if both groupIndex values are non-zero but different, use the category/mask rules as above
		if both groupIndex values are the same and positive, collide
		if both groupIndex values are the same and negative, don't collide*/

		//TODO Bug when selection collision 4 and reset - body falls through fixtures

		var fixture = body.GetFixtureList();

		while (fixture) {
			//TODO: Set collision for all fixtures
			var filterData = fixture.GetFilterData();

			if (body.GetType() == Box2D.b2BodyType.b2_staticBody) filterData.categoryBits = this.MASKBIT_FIXED;
			else filterData.categoryBits = this.MASKBIT_NORMAL;
			filterData.maskBits = this.MASKBIT_NORMAL | this.MASKBIT_FIXED | this.MASKBIT_CHARACTER | this.MASKBIT_EVERYTHING_BUT_US; //this.MASKBIT_ONLY_US;
			fixture.SetSensor(false);

			if (collision == 1) {
				filterData.maskBits = this.MASKBIT_NORMAL | this.MASKBIT_FIXED | this.MASKBIT_EVERYTHING_BUT_US; // this.MASKBIT_CHARACTER | this.MASKBIT_ONLY_US;
			} else if (collision == 2) {
				fixture.SetSensor(true);
			} else if (collision == 3) {
				filterData.categoryBits = this.MASKBIT_EVERYTHING_BUT_US;
				filterData.maskBits = this.MASKBIT_NORMAL | this.MASKBIT_FIXED | this.MASKBIT_CHARACTER; //this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_ONLY_US;
			} else if (collision == 4) {
				filterData.categoryBits = this.MASKBIT_ONLY_US;
				filterData.maskBits = this.MASKBIT_ONLY_US; //this.MASKBIT_NORMAL | this.MASKBIT_FIXED  | this.MASKBIT_CHARACTER; this.MASKBIT_EVERYTHING_BUT_US;
			} else if (collision == 5) {
				filterData.maskBits = this.MASKBIT_FIXED; //this.MASKBIT_NORMAL | this.MASKBIT_CHARACTER | this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_ONLY_US;
			} else if (collision == 6) {
				filterData.maskBits = this.MASKBIT_CHARACTER; // this.MASKBIT_NORMAL| this.MASKBIT_FIXED | this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_ONLY_US;
			} else if (collision == 7) {
				filterData.categoryBits = this.MASKBIT_CHARACTER;
				filterData.groupIndex = this.GROUPINDEX_CHARACTER;
			}

			fixture.SetFilterData(filterData);
			fixture = fixture.GetNext();
			//
		}
	}


	this.attachJointPlaceHolder = function (obj) {

		var tarObj;
		var bodies = [];

		if (obj) {
			tarObj = obj;
			bodies.push(this.textures.getChildAt(tarObj.bodyA_ID).myBody);

			if (tarObj.bodyB_ID != undefined) {
				bodies.push(this.textures.getChildAt(tarObj.bodyB_ID).myBody);
			}

		} else {
			tarObj = new this.jointObject;

			if (this.selectedPhysicsBodies.length < 2) {
				bodies = this.queryWorldForBodies(this.mousePosWorld, this.mousePosWorld);
			} else {
				bodies = [this.selectedPhysicsBodies[0], this.selectedPhysicsBodies[1]];
			}

			if (bodies.length == 0) return;
			tarObj.bodyA_ID = bodies[0].mySprite.parent.getChildIndex(bodies[0].mySprite);
			if (bodies.length > 1) {
				tarObj.bodyB_ID = bodies[1].mySprite.parent.getChildIndex(bodies[1].mySprite);
			}

			tarObj.jointType = this.jointObject_TYPE_PIN;
			tarObj.x = this.mousePosWorld.x * this.PTM;
			tarObj.y = this.mousePosWorld.y * this.PTM;
		}

		var jointGraphics = new PIXI.Sprite(PIXI.Texture.fromFrame('pinJoint'));
		this.textures.addChild(jointGraphics);

		jointGraphics.pivot.set(jointGraphics.width / 2, jointGraphics.height / 2);

		jointGraphics.bodies = bodies;

		if (bodies[0].myJoints == undefined) bodies[0].myJoints = [];
		bodies[0].myJoints.push(jointGraphics);

		if (bodies.length > 1) {
			if (bodies[1].myJoints == undefined) bodies[1].myJoints = [];
			bodies[1].myJoints.push(jointGraphics);
		}

		jointGraphics.data = tarObj;

		jointGraphics.x = tarObj.x;
		jointGraphics.y = tarObj.y;
		jointGraphics.rotation = tarObj.rotation;

		jointGraphics.scale.x = 1.0 / this.container.scale.x;
		jointGraphics.scale.y = 1.0 / this.container.scale.y;


		if (tarObj.prefabInstanceName) {
			jointGraphics.visible = false;
			jointGraphics.isPrefabJointGraphic = true;
		}

		this.addObjectToLookupGroups(jointGraphics, jointGraphics.data);

		this.editorIcons.push(jointGraphics);

		return jointGraphics;

	}

	this.attachJoint = function (jointPlaceHolder) {
		let bodyA = this.textures.getChildAt(jointPlaceHolder.bodyA_ID).myBody;
		let bodyB;
		if (jointPlaceHolder.bodyB_ID != null) {

			bodyB = this.textures.getChildAt(jointPlaceHolder.bodyB_ID).myBody;
		} else {
			//pin to background

			let fixDef = new b2FixtureDef;
			fixDef.density = 1.0;
			fixDef.friction = 0.5;
			fixDef.restitution = 0.2;

			let bd = new b2BodyDef();
			bd.type = Box2D.b2BodyType.b2_staticBody;
			bodyB = this.world.CreateBody(bd);
			bodyB.SetPosition(new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM));


			fixDef.shape = new b2PolygonShape;
			fixDef.shape.SetAsBox(1, 1);

			let fixture = bodyB.CreateFixture(fixDef);
			fixture.SetSensor(true);

		}
		let joint;

		if (jointPlaceHolder.jointType == this.jointObject_TYPE_PIN) {
			let revoluteJointDef = new Box2D.b2RevoluteJointDef;

			revoluteJointDef.Initialize(bodyA, bodyB, new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM));

			revoluteJointDef.collideConnected = jointPlaceHolder.collideConnected;
			revoluteJointDef.referenceAngle = 0.0;
			revoluteJointDef.lowerAngle = jointPlaceHolder.lowerAngle * this.DEG2RAD;
			revoluteJointDef.upperAngle = jointPlaceHolder.upperAngle * this.DEG2RAD;
			revoluteJointDef.maxMotorTorque = jointPlaceHolder.maxMotorTorque;
			revoluteJointDef.motorSpeed = jointPlaceHolder.motorSpeed;
			revoluteJointDef.enableLimit = jointPlaceHolder.enableLimit;
			revoluteJointDef.enableMotor = jointPlaceHolder.enableMotor;

			joint = this.world.CreateJoint(revoluteJointDef);
		} else if (jointPlaceHolder.jointType == this.jointObject_TYPE_SLIDE) {

			const axis = new b2Vec2(Math.cos(jointPlaceHolder.rotation + 90 * this.DEG2RAD), Math.sin(jointPlaceHolder.rotation + 90 * this.DEG2RAD));

			let prismaticJointDef = new Box2D.b2PrismaticJointDef;

			prismaticJointDef.Initialize(bodyA, bodyB, new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM), axis);
			prismaticJointDef.collideConnected = jointPlaceHolder.collideConnected;
			prismaticJointDef.referenceAngle = 0.0;
			prismaticJointDef.lowerTranslation = jointPlaceHolder.lowerLimit / this.PTM;
			prismaticJointDef.upperTranslation = jointPlaceHolder.upperLimit / this.PTM;
			prismaticJointDef.maxMotorForce = jointPlaceHolder.maxMotorTorque;
			prismaticJointDef.motorSpeed = jointPlaceHolder.motorSpeed;
			prismaticJointDef.enableLimit = jointPlaceHolder.enableLimit;
			prismaticJointDef.enableMotor = jointPlaceHolder.enableMotor;

			joint = this.world.CreateJoint(prismaticJointDef);



		} else if (jointPlaceHolder.jointType == this.jointObject_TYPE_DISTANCE) {
			let distanceJointDef = new Box2D.b2DistanceJointDef;
			distanceJointDef.Initialize(bodyA, bodyB, new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM), new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM));
			distanceJointDef.frequencyHz = jointPlaceHolder.frequencyHz;
			distanceJointDef.dampingRatio = jointPlaceHolder.dampingRatio;

			joint = this.world.CreateJoint(distanceJointDef);
		} else if (jointPlaceHolder.jointType == this.jointObject_TYPE_ROPE) {
			let ropeJointDef = new Box2D.b2RopeJointDef;
			ropeJointDef.Initialize(bodyA, bodyB, bodyA.GetPosition(), bodyB.GetPosition());
			const xd = bodyA.GetPosition().x - bodyB.GetPosition().x;
			const yd = bodyA.GetPosition().y - bodyB.GetPosition().y;
			ropeJointDef.maxLength = Math.sqrt(xd * xd + yd * yd);

			joint = this.world.CreateJoint(ropeJointDef);
		} else if (jointPlaceHolder.jointType == this.jointObject_TYPE_WHEEL) {
			const axis = new b2Vec2(Math.cos(jointPlaceHolder.rotation + 90 * this.DEG2RAD), Math.sin(jointPlaceHolder.rotation + 90 * this.DEG2RAD));

			let wheelJointDef = new Box2D.b2WheelJointDef;
			wheelJointDef.Initialize(bodyA, bodyB, new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM), axis);
			wheelJointDef.frequencyHz = jointPlaceHolder.frequencyHz;
			wheelJointDef.dampingRatio = jointPlaceHolder.dampingRatio;
			wheelJointDef.maxMotorForce = jointPlaceHolder.maxMotorTorque;
			wheelJointDef.motorSpeed = jointPlaceHolder.motorSpeed;
			wheelJointDef.enableMotor = jointPlaceHolder.enableMotor;


			joint = this.world.CreateJoint(wheelJointDef);
		}
		joint.data = jointPlaceHolder.data;
		bodyA.myJoints = undefined;
		if (bodyB) bodyB.myJoints = undefined;
		return joint;
	}

	this.buildPrefabFromObj = function (obj) {
		this.createdSubPrefabClasses = [];
		if (this.breakPrefabs) return this.buildJSON(JSON.parse(PrefabManager.prefabLibrary[obj.prefabName].json));
		if(obj.instanceID !== -1) obj.instanceID = this.prefabCounter++;

		var key = obj.prefabName + "_" + obj.instanceID;
		obj.key = key;
		this.activePrefabs[key] = obj;
		var prefabLookupObject = this.buildJSON(JSON.parse(PrefabManager.prefabLibrary[obj.prefabName].json), key);

		obj.class = new PrefabManager.prefabLibrary[obj.prefabName].class(obj);

		if(obj.settings) Object.keys(obj.settings).forEach(key=>obj.class.set(key, obj.settings[key]));

		obj.class.subPrefabClasses = this.createdSubPrefabClasses;
		this.createdSubPrefabClasses.map((prefab) => {
			prefab.mainPrefabClass = obj.class
		});

		this.applyToObjects(this.TRANSFORM_ROTATE, obj.rotation, [].concat(prefabLookupObject._bodies, prefabLookupObject._textures, prefabLookupObject._joints));
		prefabLookupObject._bodies.forEach(body =>{
			this.updateBodyPosition(body);
		});

		return prefabLookupObject;
	}
	// this.buildRuntimePrefab = function (prefabName, x, y, rotation) {
	// 	const prefabJSON = `{"objects":[[4,${x},${y},${(rotation || 0)},{},"${prefabName}",${(game.editor.prefabCounter++)}]]}`
	// 	const prefab = this.buildJSON(JSON.parse(prefabJSON));
	// 	this.retrieveClassFromPrefabLookup(prefab).init();
	// 	return prefab;
	// }
	this.retrieveClassFromPrefabLookup = function (prefabLookup) {
		return this.retrieveClassFromBody(prefabLookup._bodies[0]);
	}
	this.retrieveClassFromBody = function(body){
		if(this.activePrefabs[body.mySprite.data.prefabInstanceName]){
			return this.activePrefabs[body.mySprite.data.prefabInstanceName].class
		}
		return null;
	}
	this.retrieveSubClassFromBody = function (body) {
		if(this.activePrefabs[body.mySprite.data.subPrefabInstanceName]){
			return this.activePrefabs[body.mySprite.data.subPrefabInstanceName].class
		}
		return null;
	}

	this.setTextureToBody = function (body, texture, positionOffsetLength, positionOffsetAngle, offsetRotation) {
		body.myTexture = texture;
		texture.data.bodyID = body.mySprite.data.ID;
		texture.data.texturePositionOffsetLength = positionOffsetLength;
		texture.data.texturePositionOffsetAngle = positionOffsetAngle;
		texture.data.textureAngleOffset = offsetRotation;


		//body.mySprite.renderable = false;
		texture.myBody = body;
	}
	this.removeTextureFromBody = function (body, texture) {
		body.myTexture = null;
		texture.data.bodyID = null;
		texture.data.texturePositionOffsetLength = null;
		texture.data.texturePositionOffsetAngle = null;
		texture.data.textureAngleOffset = null;
		body.mySprite.renderable = true;
		texture.myBody = null;
	}
	this.prepareBodyForDecals = function (body) {
		if (!body.myDecalSprite) {
			//prepare mask
			let drawGraphic = new PIXI.heaven.Sprite(PIXI.Texture.fromFrame(body.myTexture.data.textureName));
			drawGraphic.tint = 0xffffff;
			drawGraphic.color.dark[0] = drawGraphic.color.light[0];
			drawGraphic.color.dark[1] = drawGraphic.color.light[1];
			drawGraphic.color.dark[2] = drawGraphic.color.light[2];
			drawGraphic.color.invalidate();

			let graphics = new PIXI.Graphics();
			graphics.beginFill(0x000000);
			graphics.drawRect(0, 0, drawGraphic.width, drawGraphic.height);

			body.myMaskRT = PIXI.RenderTexture.create(drawGraphic.width, drawGraphic.height, 1);
			game.app.renderer.render(graphics, body.myMaskRT, true);
			game.app.renderer.render(drawGraphic, body.myMaskRT, false);
			body.myMask = new PIXI.heaven.Sprite(body.myMaskRT);
			body.myMask.renderable = false;

			body.myDecalSpriteRT = PIXI.RenderTexture.create(drawGraphic.width, drawGraphic.height, 1);
			body.myDecalSprite = new PIXI.heaven.Sprite(body.myDecalSpriteRT);
			body.myTexture.addChild(body.myDecalSprite);

			body.myDecalSprite.maskSprite = body.myMask;
			body.myDecalSprite.pluginName = 'spriteMasked';

			body.myTexture.addChild(body.myMask);

			body.myTexture.originalSprite.pluginName = 'spriteMasked';
			body.myTexture.originalSprite.maskSprite = body.myMask;
		}
	}
	this.addDecalToBody = function (body, worldPosition, textureName, carving, size, rotation, optional) {
		if (!size) size = 1;
		if(!rotation) rotation = 0;
		// size = 1;
		if (!body.myDecalSprite) this.prepareBodyForDecals(body);

		let pixelPosition = this.getPIXIPointFromWorldPoint(worldPosition);

		let decal = new PIXI.heaven.Sprite(PIXI.Texture.fromFrame(textureName));
		decal.pivot.set(decal.width / 2, decal.height / 2);

		const localPosition = body.myTexture.toLocal(pixelPosition, body.myTexture.parent);
		decal.x = localPosition.x;
		decal.y = localPosition.y;
		decal.rotation = rotation;

		decal.scale.x = size;
		decal.scale.y = size;

		game.app.renderer.render(decal, body.myDecalSpriteRT, false);

		if(optional){
			if(optional.burn){
				if(body.isFlesh){
					const targetFlesh = body.myTexture.myFlesh;
					if(targetFlesh.burn === undefined) targetFlesh.burn = 0.0;
					targetFlesh.burn += Math.min(1.0, optional.burn);


					const burnRate = 0.7*(1-targetFlesh.burn);
					targetFlesh.color.setLight(0.3+burnRate, 0.3+burnRate, 0.3+burnRate);
					targetFlesh.color.invalidate();


				}
			}
		}

		if (carving) {
			let carveDecal = new PIXI.heaven.Sprite(PIXI.Texture.fromFrame(textureName));
			carveDecal.pivot.set(carveDecal.width / 2, carveDecal.height / 2);

			carveDecal.scale.x = size * 0.6;
			carveDecal.scale.y = size * 0.6;

			carveDecal.y = decal.y;
			carveDecal.x = decal.x;
			carveDecal.rotation = rotation;

			carveDecal.tint = 0x000000;
			carveDecal.color.dark[0] = carveDecal.color.light[0];
			carveDecal.color.dark[1] = carveDecal.color.light[1];
			carveDecal.color.dark[2] = carveDecal.color.light[2];
			carveDecal.color.invalidate();

			game.app.renderer.render(carveDecal, body.myMaskRT, false);


		}
	}
	this.updateBodyShapes = function (body) {

		//change update body shapes with actual vertices

		for (let i = 0; i < body.mySprite.data.vertices.length; i++) {

			let radius = body.mySprite.data.radius[i];
			let colorFill = body.mySprite.data.colorFill[i];
			let colorLine = body.mySprite.data.colorLine[i];
			let lineWidth = body.mySprite.data.lineWidth[i];
			let transparancy = body.mySprite.data.transparancy[i + 1]; //TODO:what is this?

			if (body.mySprite.data.type == this.object_TRIGGER) {
				//color trigger
				colorFill = '#FFFFFF';
				colorLine = '#FFFFFF';
				lineWidth = 1;
				transparancy = 0.2;
			}

			let verts = [];
			let innerVerts;
			if (body.mySprite.data.vertices[i][0] instanceof Array == false) innerVerts = body.mySprite.data.vertices[i];
			else {
				innerVerts = body.mySprite.data.vertices[i][0];
			}
			for (var j = 0; j < innerVerts.length; j++) {
				verts.push({
					x: innerVerts[j].x * this.PTM,
					y: innerVerts[j].y * this.PTM
				});
			}

			if (!radius) this.updatePolyGraphic(body.originalGraphic, verts, colorFill, colorLine, lineWidth, transparancy, (i != 0));
			else this.updateCircleGraphic(body.originalGraphic, radius, innerVerts[0], colorFill, colorLine, lineWidth, transparancy, (i != 0));
		}
	}
	this.updateGraphicShapes = function (graphic) {
		while (graphic.children.length > 0) graphic.removeChild(graphic.getChildAt(0));

		let g;
		for (var i = 0; i < graphic.data.graphicObjects.length; i++) {
			const gObj = this.parseArrObject(JSON.parse(graphic.data.graphicObjects[i]));

			if (gObj instanceof this.graphicObject) {
				g = new PIXI.Container();
				let inner_graphic = new PIXI.Graphics();
				if (!gObj.radius) this.updatePolyGraphic(inner_graphic, gObj.vertices, gObj.colorFill, gObj.colorLine, gObj.lineWidth, gObj.transparancy, true);
				else this.updateCircleGraphic(inner_graphic, gObj.radius, gObj.vertices[0], gObj.colorFill, gObj.colorLine, gObj.lineWidth, gObj.transparancy, true);
				g.data = gObj;
				g.addChild(inner_graphic);
				g.originalGraphic = inner_graphic;
				this.updateTileSprite(g);
				g.data = null;
			} else if (gObj instanceof this.textureObject) {
				g = new PIXI.heaven.Sprite(PIXI.Texture.fromFrame(gObj.textureName));
				g.pivot.set(g.width / 2, g.height / 2);
			}else if(gObj instanceof this.textObject) {
				g = this.buildTextGraphicFromObj(gObj);
				g.pivot.set(g.width / 2, g.height / 2);
			}else if (gObj instanceof this.graphicGroup) {
				g = new PIXI.Container();
				g.data = gObj;
				this.updateGraphicShapes(g);
				g.data = null;
			}
			graphic.addChild(g);
			g.x = gObj.x;
			g.y = gObj.y;
			g.rotation = gObj.rotation;
			g.alpha = gObj.transparancy;
		}
	}
	this.updateTileSprite = function (target, forceNew = false) {

		let tileTexture;
		let targetGraphic;
		let targetSprite;

		if (target.mySprite) {
			tileTexture = target.mySprite.data.tileTexture;
			targetGraphic = target.originalGraphic;
			targetSprite = target.mySprite;
		} else {
			tileTexture = target.data.tileTexture;
			targetGraphic = target.originalGraphic || target;
			targetSprite = target;
		}
		if (forceNew || tileTexture == undefined || tileTexture == "") {
			if (target.myTileSprite) {
				target.myTileSprite.parent.removeChild(target.myTileSprite);
				target.myTileSprite = undefined;
				targetSprite.filters = [];
				targetGraphic.alpha = 1;
			}
			if (!forceNew) return;
		}

		if (tileTexture && tileTexture != "") {

			if (target.myTileSprite && target.myTileSprite.texture && tileTexture == target.myTileSprite.texture.textureCacheIds[0]) {


				const color = parseInt([].concat(targetSprite.data.colorLine)[0].slice(1), 16);
				target.myTileSprite.alpha = targetSprite.data.transparancy;
				let outlineFilter = new PIXIFILTERS.OutlineFilter([].concat(targetSprite.data.lineWidth)[0], color, 0.1);
				outlineFilter.padding = [].concat(targetSprite.data.lineWidth)[0]+2; // added 2 to fix line flickering
				targetSprite.filters = [outlineFilter]
				targetGraphic.alpha = 0;
				return;
			}

			let tex = PIXI.Texture.fromImage(tileTexture);
			tex.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

			if (!target.myTileSprite) {
				game.app.renderer.plugins.graphics.updateGraphics(targetGraphic);

				const verticesColor = targetGraphic._webGL[game.app.renderer.CONTEXT_UID].data[0].glPoints;
				let vertices = new Float32Array(verticesColor.length / 3);

				let i;
				let j = 0;
				for (i = 0; i < verticesColor.length; i += 6) {
					vertices[j] = verticesColor[i];
					vertices[j + 1] = verticesColor[i + 1];
					j += 2;
				}

				const indices = targetGraphic._webGL[game.app.renderer.CONTEXT_UID].data[0].glIndices;
				let uvs = new Float32Array(vertices.length);
				for (i = 0; i < vertices.length; i++) {
					uvs[i] = vertices[i] * 2.0 / tex.width;
					if (i & 1) {
						uvs[i] = vertices[i] * 2.0 / tex.width + 0.5;
					}
				}

				const mesh = new PIXI.mesh.Mesh(tex, vertices, uvs, indices);
				targetSprite.addChild(mesh);
				target.myTileSprite = mesh;

				// find center vertice
				mesh.cachedSpriteRotation = 0;
				mesh.verticesClone = Float32Array.from(mesh.vertices);
				// mesh.fixedTextureRotationOffset = Math.PI/2;
				mesh.updateMeshVerticeRotation = force=>{
					if(mesh.cachedSpriteRotation != targetSprite.rotation || force){
						for(let i = 0; i<vertices.length; i+=2){
							let x = mesh.verticesClone[i];
							let y = mesh.verticesClone[i+1];
							let l = Math.sqrt(x*x+y*y);
							let a = Math.atan2(y, x);
							a += targetSprite.rotation;
							a += mesh.fixedTextureRotationOffset;
							mesh.vertices[i] = l*Math.cos(a);
							mesh.vertices[i+1] = l*Math.sin(a);
						}
						const uvs = new Float32Array(mesh.vertices.length);
						for (i = 0; i < mesh.vertices.length; i++) {
							uvs[i] = mesh.vertices[i] * 2.0 / tex.width;
							if (i & 1) {
								uvs[i] = mesh.vertices[i] * 2.0 / tex.width + 0.5;
							}
						}
						mesh.uvs = uvs;
						mesh.rotation = -targetSprite.rotation-mesh.fixedTextureRotationOffset;
						mesh.cachedSpriteRotation = targetSprite.rotation
						mesh.dirty++;
					}
				}
			}

			target.myTileSprite.texture = tex;
			const color = parseInt([].concat(targetSprite.data.colorLine)[0].slice(1), 16);
			let outlineFilter = new PIXIFILTERS.OutlineFilter([].concat(targetSprite.data.lineWidth)[0], color, 0.1);
			outlineFilter.padding = [].concat(targetSprite.data.lineWidth)[0]+2; // added 2 to fix line flickering
			targetSprite.filters = [outlineFilter];
			targetGraphic.alpha = 0;
		}
	}

	this.updatePolyGraphic = function (graphic, verts, colorFill, colorLine, lineWidth, transparancy, dontClear) {
		var color;
		color = colorFill.slice(1);
		var colorFillHex = parseInt(color, 16);
		color = colorLine.slice(1);
		var colorLineHex = parseInt(color, 16);

		if (!dontClear) graphic.clear();
		graphic.boundsPadding = 0;

		graphic.lineStyle(lineWidth, colorLineHex, transparancy);
		graphic.beginFill(colorFillHex, transparancy);

		var count = verts.length;
		var startPoint = verts[0];

		graphic.moveTo(startPoint.x, startPoint.y);

		var i;
		var currentPoint;
		var nextPoint;
		const curves = startPoint.point1 != undefined;

		for (i = 1; i < count; i++) {
			currentPoint = verts[i - 1];
			nextPoint = verts[i];
			if (curves) {
				graphic.bezierCurveTo(currentPoint.point1.x, currentPoint.point1.y, currentPoint.point2.x, currentPoint.point2.y, nextPoint.x, nextPoint.y);
			} else graphic.lineTo(nextPoint.x, nextPoint.y);
		}
		if (curves) graphic.bezierCurveTo(nextPoint.point1.x, nextPoint.point1.y, nextPoint.point2.x, nextPoint.point2.y, startPoint.x, startPoint.y);
		else graphic.lineTo(startPoint.x, startPoint.y);

		graphic.endFill();


		return graphic;
	}
	this.updateCircleGraphic = function (graphic, radius, pos, colorFill, colorLine, lineWidth, transparancy, dontClear) {
		var color;
		color = colorFill.slice(1);
		var colorFillHex = parseInt(color, 16);
		color = colorLine.slice(1);
		var colorLineHex = parseInt(color, 16);

		if (!dontClear) graphic.clear();
		graphic.boundsPadding = 0;

		graphic.lineStyle(lineWidth, colorLineHex, transparancy);
		graphic.beginFill(colorFillHex, transparancy);

		var x = this.getPIXIPointFromWorldPoint(pos).x;
		var y = this.getPIXIPointFromWorldPoint(pos).y;

		graphic.moveTo(x + radius, y);
		graphic.arc(x, y, radius, 0, 2 * Math.PI, false);
		graphic.endFill();
	}

	this.stringifyWorldJSON = function () {
		this.worldJSON = '{"objects":[';
		var sprite;
		var i;
		var stringifiedPrefabs = {};

		for (i = 0; i < this.textures.children.length; i++) {
			if (i != 0) this.worldJSON += ',';
			sprite = this.textures.getChildAt(i);
			this.updateObject(sprite, sprite.data);
			if (sprite.data.prefabInstanceName) {
				if (stringifiedPrefabs[sprite.data.prefabInstanceName]) {
					this.worldJSON = this.worldJSON.slice(0, -1);
					continue;
				}
				this.worldJSON += this.stringifyObject(this.activePrefabs[sprite.data.prefabInstanceName]);
				stringifiedPrefabs[sprite.data.prefabInstanceName] = true;
			} else {
				this.worldJSON += this.stringifyObject(sprite.data);
			}
		}
		this.worldJSON += '],'
		this.worldJSON += '"settings":';
		Object.keys(this.editorSettingsObject).forEach(key => this.editorSettingsObject[key] = editorSettings[key]);
		this.editorSettingsObject.type = this.object_SETTINGS;
		this.worldJSON += this.stringifyObject(this.editorSettingsObject);
		this.worldJSON += '}';

		// console.log("********************** World Data **********************");
		// console.log(this.worldJSON);
		// console.log("********************************************************");
		return this.worldJSON;
	}

	this.stringifyObject = function (obj) {
		var arr = [];
		arr[0] = obj.type;
		arr[1] = obj.x;
		arr[2] = obj.y;
		arr[3] = obj.rotation;

		if (obj.type != this.object_PREFAB) {
			arr[4] = obj.groups;
			arr[5] = obj.refName;
		}

		if (obj.type == this.object_BODY) {
			arr[6] = obj.ID;
			arr[7] = obj.colorFill;
			arr[8] = obj.colorLine;
			arr[9] = obj.transparancy;
			arr[10] = obj.fixed;
			arr[11] = obj.awake;
			arr[12] = obj.vertices;
			arr[13] = obj.density;
			arr[14] = obj.collision;
			arr[15] = obj.radius;
			arr[16] = obj.tileTexture;
			arr[17] = obj.lineWidth !== undefined ? obj.lineWidth : 1.0;

		} else if (obj.type == this.object_TEXTURE) {
			arr[6] = obj.ID;
			arr[7] = obj.textureName;
			arr[8] = obj.bodyID;
			arr[9] = obj.texturePositionOffsetLength;
			arr[10] = obj.texturePositionOffsetAngle;
			arr[11] = obj.textureAngleOffset;
			arr[12] = obj.isCarvable;
			arr[13] = obj.tint;
			arr[14] = obj.scaleX;
			arr[15] = obj.scaleY;
			arr[16] = obj.transparancy;
			arr[17] = obj.parallax;
			arr[18] = obj.repeatTeleportX;
			arr[19] = obj.repeatTeleportY;
			
		} else if (obj.type == this.object_JOINT) {
			arr[6] = obj.ID;
			arr[7] = obj.bodyA_ID;
			arr[8] = obj.bodyB_ID;
			arr[9] = obj.jointType;
			arr[10] = obj.collideConnected;
			arr[11] = obj.enableMotor;
			arr[12] = obj.maxMotorTorque;
			arr[13] = obj.motorSpeed;
			arr[14] = obj.enableLimit;
			arr[15] = obj.upperAngle;
			arr[16] = obj.lowerAngle;
			arr[17] = obj.dampingRatio;
			arr[18] = obj.frequencyHz;
			arr[19] = obj.upperLimit;
			arr[20] = obj.lowerLimit;
		} else if (obj.type == this.object_PREFAB) {
			arr[4] = obj.settings
			arr[5] = obj.prefabName
		} else if (obj.type == this.object_GRAPHIC) {
			arr[6] = obj.ID;
			arr[7] = obj.colorFill;
			arr[8] = obj.colorLine;
			arr[9] = obj.transparancy;
			arr[10] = obj.radius;
			arr[11] = obj.vertices;
			arr[12] = obj.bodyID;
			arr[13] = obj.texturePositionOffsetLength;
			arr[14] = obj.texturePositionOffsetAngle;
			arr[15] = obj.textureAngleOffset;
			arr[16] = obj.tileTexture || "";
			arr[17] = obj.lineWidth !== undefined ? obj.lineWidth : 1.0;
			arr[18] = obj.parallax;
			arr[19] = obj.repeatTeleportX;
			arr[20] = obj.repeatTeleportY;
		} else if (arr[0] == this.object_GRAPHICGROUP) {
			arr[6] = obj.ID;
			arr[7] = obj.graphicObjects;
			arr[8] = obj.bodyID;
			arr[9] = obj.texturePositionOffsetLength;
			arr[10] = obj.texturePositionOffsetAngle;
			arr[11] = obj.textureAngleOffset;
			arr[12] = obj.transparancy !== undefined ? obj.transparancy : 1.0;
			arr[13] = obj.parallax;
			arr[14] = obj.repeatTeleportX;
			arr[15] = obj.repeatTeleportY;
		} else if (arr[0] == this.object_TRIGGER) {
			arr[6] = obj.vertices;
			arr[7] = obj.radius;
			arr[8] = obj.enabled;
			arr[9] = obj.targetType;
			arr[10] = obj.repeatType;
			arr[11] = obj.triggerObjects;
			arr[12] = obj.triggerActions;
		} else if (arr[0] == this.object_TEXT) {
			arr[6] = obj.ID;
			arr[7] = obj.text;
			arr[8] = obj.textColor;
			arr[9] = obj.transparancy;
			arr[10] = obj.fontSize;
			arr[11] = obj.fontName;
			arr[12] = obj.textAlign;
			arr[13] = obj.bodyID;
			arr[14] = obj.texturePositionOffsetLength;
			arr[15] = obj.texturePositionOffsetAngle;
			arr[16] = obj.textureAngleOffset;
		}else if(arr[0] == this.object_SETTINGS){
			arr = [];
			arr[0] = obj.type;
			arr[1] = obj.gravityX;
			arr[2] = obj.gravityY;
		}else if (arr[0] == this.object_ANIMATIONGROUP) {
			arr[6] = obj.ID;
			arr[7] = obj.graphicObjects;
			arr[8] = obj.bodyID;
			arr[9] = obj.texturePositionOffsetLength;
			arr[10] = obj.texturePositionOffsetAngle;
			arr[11] = obj.textureAngleOffset;
			arr[12] = obj.transparancy !== undefined ? obj.transparancy : 1.0;
			arr[13] = obj.parallax;
			arr[14] = obj.repeatTeleportX;
			arr[15] = obj.repeatTeleportY;
			arr[16] = obj.fps;
			arr[17] = obj.playing;
		} 
		return JSON.stringify(arr);
	}
	this.parseArrObject = function (arr) {
		var obj;
		if (arr[0] == this.object_BODY) {
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
		} else if (arr[0] == this.object_TEXTURE) {
			obj = new this.textureObject();
			obj.ID = arr[6];
			obj.textureName = arr[7];
			obj.bodyID = arr[8];
			obj.texturePositionOffsetLength = arr[9];
			obj.texturePositionOffsetAngle = arr[10];
			obj.textureAngleOffset = arr[11];
			obj.isCarvable = arr[12];
			obj.tint = arr[13] !== undefined ? arr[13] : '#FFFFFF';
			obj.scaleX = arr[14] || 1;
			obj.scaleY = arr[15] || 1;
			obj.transparancy = arr[16] !== undefined ? arr[16] : 1;
			obj.parallax = arr[17] !== undefined ? arr[17] : 0;
			obj.repeatTeleportX = arr[18] !== undefined ? arr[18] : 0;
			obj.repeatTeleportY = arr[19] !== undefined ? arr[19] : 0;
		} else if (arr[0] == this.object_JOINT) {
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
		} else if (arr[0] == this.object_PREFAB) {
			obj = new this.prefabObject();
			obj.settings = arr[4];
			obj.prefabName = arr[5];
		} else if (arr[0] == this.object_GRAPHIC) {
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
		} else if (arr[0] == this.object_GRAPHICGROUP) {
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
		} else if (arr[0] == this.object_TRIGGER) {
			obj = new this.triggerObject();
			obj.vertices = arr[6];
			obj.radius = arr[7];
			obj.enabled = arr[8];
			obj.targetType = arr[9];
			obj.repeatType = arr[10];
			obj.triggerObjects = arr[11];
			obj.triggerActions = arr[12];
		} else if (arr[0] == this.object_TEXT) {
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
		}else if (arr[0] == this.object_SETTINGS){
			obj = this.editorSettingsObject;
			obj.gravityX = arr[1];
			obj.gravityY = arr[2];
			obj.backgroundColor = arr[3] || 0xD4D4D4;
			return obj;
		}else if (arr[0] == this.object_ANIMATIONGROUP) {
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

	this.updateObject = function (sprite, data) {
		if (data.type == this.object_BODY) {
			data.x = sprite.myBody.GetPosition().x;
			data.y = sprite.myBody.GetPosition().y;
			data.rotation = sprite.myBody.GetAngle();
		} else if (data.type == this.object_TEXTURE || data.type == this.object_GRAPHIC || data.type == this.object_GRAPHICGROUP || data.type == this.object_TEXT || data.type == this.object_ANIMATIONGROUP) {
			data.x = sprite.x;
			data.y = sprite.y;
			data.rotation = sprite.rotation;
			if (data.bodyID != undefined) data.bodyID = sprite.myBody.mySprite.parent.getChildIndex(sprite.myBody.mySprite);
		} else if (data.type == this.object_JOINT) {
			data.bodyA_ID = sprite.bodies[0].mySprite.parent.getChildIndex(sprite.bodies[0].mySprite);
			if (sprite.bodies.length > 1) data.bodyB_ID = sprite.bodies[1].mySprite.parent.getChildIndex(sprite.bodies[1].mySprite);
			data.x = sprite.x;
			data.y = sprite.y;
			data.rotation = sprite.rotation
		} else if (data.type == this.object_TRIGGER) {
			data.x = sprite.myBody.GetPosition().x;
			data.y = sprite.myBody.GetPosition().y;
			data.rotation = sprite.myBody.GetAngle();

			data.triggerObjects = [];
			for (var i = 0; i < sprite.targets.length; i++) {
				if (sprite.targets[i] instanceof this.prefabObject) data.triggerObjects.push(sprite.targets[i].key);
				else data.triggerObjects.push(sprite.targets[i].parent.getChildIndex(sprite.targets[i]));
			}
		}

		if (!sprite && data.type == this.object_PREFAB) {
			var prefabGroup = this.lookupGroups[data.key];
			var bodyIndex = (prefabGroup._bodies.length > 0) ? prefabGroup._bodies[0].mySprite.parent.getChildIndex(prefabGroup._bodies[0].mySprite) : Number.POSITIVE_INFINITY;
			var spriteIndex = (prefabGroup._textures.length > 0) ? prefabGroup._textures[0].parent.getChildIndex(prefabGroup._textures[0]) : Number.POSITIVE_INFINITY;
			var jointIndex = (prefabGroup._joints.length > 0) ? prefabGroup._joints[0].parent.getChildIndex(prefabGroup._joints[0]) : Number.POSITIVE_INFINITY;
			//to do add body, sprite and joint and compare childIndexes...
			data.ID = Math.min(bodyIndex, spriteIndex, jointIndex);
		} else data.ID = sprite.parent.getChildIndex(sprite);
	}

	this.buildJSON = function (json, prefabInstanceName) {
		//console.log(json);
		var createdObjects = new this.lookupObject();

		var startChildIndex = this.textures.children.length;
		var prefabOffset = 0;

		let jsonString = null;

		if (json != null) {
			if (typeof json == 'string'){
				jsonString = json;
				json = JSON.parse(json);
			}
			//clone json to not destroy old references
			var worldObjects = JSON.parse(JSON.stringify(json));

			var i;
			var obj;
			var worldObject;
			for (i = 0; i < worldObjects.objects.length; i++) {
				obj = this.parseArrObject(worldObjects.objects[i]);

				if (prefabInstanceName) {
					obj.prefabInstanceName = prefabInstanceName;

					var offsetX = this.activePrefabs[prefabInstanceName].x;
					var offsetY = this.activePrefabs[prefabInstanceName].y;

					if (obj.type == this.object_BODY) {
						offsetX /= this.PTM;
						offsetY /= this.PTM;
					}

					obj.x += offsetX;
					obj.y += offsetY;
				}
				if (obj.type != this.object_PREFAB) obj.ID += startChildIndex + prefabOffset;

				if (obj.type == this.object_BODY) {
					worldObject = this.buildBodyFromObj(obj);
					createdObjects._bodies.push(worldObject);
				} else if (obj.type == this.object_TEXTURE) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex;
					}
					worldObject = this.buildTextureFromObj(obj);
					createdObjects._textures.push(worldObject);
				} else if (obj.type == this.object_JOINT) {
					obj.bodyA_ID += startChildIndex;
					if (obj.bodyB_ID != undefined) obj.bodyB_ID += startChildIndex;

					if (this.editing) worldObject = this.attachJointPlaceHolder(obj);
					else worldObject = this.attachJoint(obj);
					createdObjects._joints.push(worldObject);
				} else if (obj.type == this.object_PREFAB) {
					var prefabStartChildIndex = this.textures.children.length;
					var prefabObjects = this.buildPrefabFromObj(obj);
					if (!this.breakPrefabs) {
						this.activePrefabs[obj.key].ID = prefabStartChildIndex;
						createdObjects._bodies = createdObjects._bodies.concat(prefabObjects._bodies);
						createdObjects._textures = createdObjects._textures.concat(prefabObjects._textures);
						createdObjects._joints = createdObjects._joints.concat(prefabObjects._joints);
						prefabOffset = this.textures.children.length - prefabOffset;
					}
				} else if (obj.type == this.object_GRAPHIC) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex;
					}
					worldObject = this.buildGraphicFromObj(obj);
					createdObjects._textures.push(worldObject);
				} else if (obj.type == this.object_GRAPHICGROUP) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex;
					}
					worldObject = this.buildGraphicGroupFromObj(obj);
					createdObjects._textures.push(worldObject);
				}else if (obj.type == this.object_ANIMATIONGROUP) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex;
					}
					worldObject = this.buildAnimationGroupFromObject(obj);
					createdObjects._textures.push(worldObject);
				}  else if (obj.type == this.object_TRIGGER) {
					for (var j = 0; j < obj.triggerObjects.length; j++) {
						obj.triggerObjects[j] += startChildIndex;
					}
					worldObject = this.buildTriggerFromObj(obj);
					createdObjects._bodies.push(worldObject);
				} else if (obj.type == this.object_TEXT) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex;
					}
					worldObject = this.buildTextFromObj(obj);
					createdObjects._textures.push(worldObject);
				}
			}
			if(worldObjects.settings){
				worldObjects.settings = this.parseArrObject(worldObjects.settings);
				Object.keys(worldObjects.settings).forEach(key=> {
					if(key === 'backgroundColor') game.app.renderer.backgroundColor = worldObjects.settings[key];
					editorSettings[key] = worldObjects.settings[key]
				})
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
	this.drawBox = function (target, x, y, width, height, lineColor, lineSize, lineAlpha, fillColor, fillAlpha) {

		if (lineSize == undefined) lineSize = 1;
		if (lineAlpha == undefined) lineAlpha = 1;
		if (fillAlpha == undefined) fillAlpha = 1;

		if (fillColor != undefined) target.beginFill(fillColor, fillAlpha);

		target.lineStyle(lineSize, lineColor, lineAlpha);
		target.moveTo(x, y);
		target.lineTo(x + width, y);
		target.lineTo(x + width, y + height);
		target.lineTo(x, y + height);
		target.lineTo(x, y);

		if (fillColor != undefined) target.endFill();
	}

	this.resetEditor = function () {
		camera.resetToStoredPosition();

		this.editing = true;
		this.selectTool(this.tool_SELECT);

		this.selectedPhysicsBodies = [];
		this.selectedTextures = [];
		this.selectedPrefabs = {};

		this.selectedBoundingBox = null;
		this.startSelectionPoint = null;
		this.oldMousePosWorld = null;
		this.mouseDown = false;
		this.prefabCounter = 0;

		this.editorIcons = [];
		this.triggerObjects = [];

		//Destroy all bodies
		var body = this.world.GetBodyList();
		var i = 0
		while (body) {
			var b = body;
			this.world.DestroyBody(b);
			body = body.GetNext();
		}

		//Destroy all graphics
		for (i = 0; i < this.textures.children.length; i++) {
			var sprite = this.textures.getChildAt(i);
			sprite.parent.removeChild(sprite);
			sprite.destroy({
				children: true,
				texture: false,
				baseTexture: false
			});
			i--;
		}

		Object.keys(this.activePrefabs).forEach(prefab =>{
			this.activePrefabs[prefab].class.reset();
		})

		this.activePrefabs = {};
		this.lookupGroups = {};
		this.parallaxObject = [];
		this.animationGroups = [];

		//reset gui
		ui.destroyEditorGUI();
		ui.show();
	}
	var self = this;
	this.B2dEditorContactListener = new Box2D.b2ContactListener();
	this.B2dEditorContactListener.BubbleEvent = function (name, contact, secondParam) {
		if (self.contactCallBackListener) {
			if (secondParam) self.contactCallBackListener[name](contact, secondParam);
			else self.contactCallBackListener[name](contact);
		}
		var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
		var body;
		var selectedPrefab = null;
		var selectedSubPrefab = null
		for (var i = 0; i < bodies.length; i++) {
			body = bodies[i];
			if (body.mySprite && body.mySprite.data.prefabInstanceName) {
				var tarPrefab = self.activePrefabs[body.mySprite.data.prefabInstanceName].class;
				if (tarPrefab && tarPrefab != selectedPrefab && tarPrefab.contactListener) {
					selectedPrefab = tarPrefab;
					if (secondParam) selectedPrefab.contactListener[name](contact, secondParam);
					else selectedPrefab.contactListener[name](contact);
				}
			}
			if (body.mySprite && body.mySprite.data.subPrefabInstanceName) {
				var tarPrefab = self.activePrefabs[body.mySprite.data.subPrefabInstanceName].class;
				if (tarPrefab && tarPrefab != selectedSubPrefab && tarPrefab.contactListener) {
					selectedSubPrefab = tarPrefab;
					if (secondParam) selectedSubPrefab.contactListener[name](contact, secondParam);
					else selectedSubPrefab.contactListener[name](contact);
				}
			}
			if (body.mySprite && body.mySprite.data.type == self.object_TRIGGER) {
				if (secondParam) body.class.contactListener[name](contact, secondParam);
				else body.class.contactListener[name](contact);
			}
		}
	}
	this.B2dEditorContactListener.BeginContact = function (contact) {
		this.BubbleEvent("BeginContact", contact);
	}
	this.B2dEditorContactListener.EndContact = function (contact) {
		this.BubbleEvent("EndContact", contact);
	}
	this.B2dEditorContactListener.PreSolve = function (contact, oldManifold) {
		this.BubbleEvent("PreSolve", contact, oldManifold);
	}
	this.B2dEditorContactListener.PostSolve = function (contact, impulse) {
		this.BubbleEvent("PostSolve", contact, impulse);
	}
	this.testWorld = function () {
		camera.storeCurrentPosition();
		this.runWorld();
	}

	this.runWorld = function () {
		this.editorIcons = [];
		this.debugGraphics.clear();
		this.editing = false;

		var spritesToDestroy = [];
		var sprite;

		this.lookupGroups = {};
		this.currentTime = Date.now();
		this.deltaTime = 0;

		this.world.SetContactListener(this.B2dEditorContactListener);

		var i;
		for (i = 0; i < this.textures.children.length; i++) {
			sprite = this.textures.getChildAt(i);
			if (sprite.data.type == this.object_JOINT) {

				sprite.data.bodyA_ID = sprite.bodies[0].mySprite.parent.getChildIndex(sprite.bodies[0].mySprite);
				if (sprite.bodies.length > 1) sprite.data.bodyB_ID = sprite.bodies[1].mySprite.parent.getChildIndex(sprite.bodies[1].mySprite);
				this.updateObject(sprite, sprite.data);

				var joint = this.attachJoint(sprite.data);

				if (sprite.myTriggers != undefined) {
					for (var j = 0; j < sprite.myTriggers.length; j++) {
						trigger.replaceTargetOnTrigger(sprite.myTriggers[j], sprite, joint);
					}
				}

				spritesToDestroy.push(sprite);
				this.addObjectToLookupGroups(joint, sprite.data);
				joint.spriteData = sprite.data;
			} else if (sprite.data.type == this.object_BODY) {
				this.addObjectToLookupGroups(sprite.myBody, sprite.data);
			} else if (sprite.data.type == this.object_TEXTURE) {
				this.addObjectToLookupGroups(sprite, sprite.data);
			}
			if(!sprite.myBody && (sprite.data.parallax || sprite.data.repeatTeleportX || sprite.data.repeatTeleportY)){
				sprite.parallaxStartPosition = sprite.position.clone();
				this.parallaxObject.push(sprite);
			}
			if(sprite.data.type === this.object_ANIMATIONGROUP){
				this.animationGroups.push(sprite);
			}

		}
		for (i = 0; i < spritesToDestroy.length; i++) {
			sprite = spritesToDestroy[i];
			sprite.parent.removeChild(sprite);
			sprite.destroy({
				children: true,
				texture: false,
				baseTexture: false
			});
		}
		var key;
		for (key in this.activePrefabs) {
			if (this.activePrefabs.hasOwnProperty(key)) {
				this.activePrefabs[key].class.init();
			}
		}
		for (i = 0; i < this.triggerObjects.length; i++) {
			this.triggerObjects[i].class = new trigger.triggerCore();
			this.triggerObjects[i].class.init(this.triggerObjects[i]);
		}
		this.editing = false;
		ui.hide();

		game.world.SetGravity(new b2Vec2(editorSettings.gravityX, editorSettings.gravityY));
	}
	this.resize = function () {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}

	this.getWorldPointFromPixelPoint = function (pixelPoint) {
		return new b2Vec2(((pixelPoint.x - this.container.x) / this.container.scale.x) / this.PTM, ((pixelPoint.y - this.container.y) / this.container.scale.y) / this.PTM);
	}
	this.getPIXIPointFromWorldPoint = function (worldPoint) {
		return new b2Vec2(worldPoint.x * this.PTM, worldPoint.y * this.PTM);
	}
	this.renderPrefabToImage = function (prefabName) {
		var prefabObject = new this.prefabObject;
		prefabObject.prefabName = prefabName;
		prefabObject.instanceID = -1;
		var objects = this.buildPrefabFromObj(prefabObject);
		objects = this.sortObjectsByIndex([].concat(objects._bodies, objects._textures));
		var newContainer = new PIXI.Sprite();
		for (var i = 0; i < objects.length; i++) {
			var sprite = objects[i].mySprite ? objects[i].mySprite : objects[i];
			sprite.parent.removeChild(sprite);
			newContainer.addChild(sprite);
		}
		var image = game.app.renderer.plugins.extract.image(newContainer);
		var sprite = objects[0].mySprite ? objects[0].mySprite : objects[0];
		var prefabObject = this.activePrefabs[sprite.data.prefabInstanceName];


		// a hack to delete blueprint triggers
		const prefabTriggersCreated = objects.filter(obj=> obj.mySprite && obj.mySprite.data.type == this.object_TRIGGER);
		if(prefabTriggersCreated) this.deleteObjects(prefabTriggersCreated);

		this.deleteObjects([prefabObject]);

		return image;
	}
	PIXI.Graphics.prototype.drawDashedCircle = function (radius, x, y, rotation, dash, gap, offsetPercentage) {
		var circum = radius * 2 * Math.PI;
		var stepSize = dash + gap;
		var chunks = Math.ceil(circum / stepSize);
		var chunkAngle = (2 * Math.PI) / chunks;
		var dashAngle = (dash / stepSize) * chunkAngle;
		var offsetAngle = offsetPercentage * chunkAngle;
		var a = offsetAngle;
		var p = {
			x: radius * Math.cos(a),
			y: radius * Math.sin(a)
		};
		this.moveTo(x + p.x, y + p.y);
		for (var i = 0; i < chunks; i++) {
			a = chunkAngle * i + offsetAngle;
			this.arc(x, y, radius, a, a + dashAngle);
			p = {
				x: radius * Math.cos(a + chunkAngle),
				y: radius * Math.sin(a + chunkAngle)
			};
			this.moveTo(x + p.x, y + p.y);
		}
	}
	PIXI.Graphics.prototype.drawDashedPolygon = function (polygons, x, y, rotation, dash, gap, offsetPercentage) {
		var i;
		var p1;
		var p2;
		var dashLeft = 0;
		var gapLeft = 0;
		if (offsetPercentage > 0) {
			var progressOffset = (dash + gap) * offsetPercentage;
			if (progressOffset <= dash) dashLeft = dash - progressOffset;
			else gapLeft = gap - (progressOffset - dash);
		}
		var rotatedPolygons = [];
		for (i = 0; i < polygons.length; i++) {
			var p = {
				x: polygons[i].x,
				y: polygons[i].y
			};
			var cosAngle = Math.cos(rotation);
			var sinAngle = Math.sin(rotation);
			var dx = p.x;
			var dy = p.y;
			p.x = (dx * cosAngle - dy * sinAngle);
			p.y = (dx * sinAngle + dy * cosAngle);
			rotatedPolygons.push(p);
		}
		for (i = 0; i < rotatedPolygons.length; i++) {
			p1 = rotatedPolygons[i];
			if (i == rotatedPolygons.length - 1) p2 = rotatedPolygons[0];
			else p2 = rotatedPolygons[i + 1];
			var dx = p2.x - p1.x;
			var dy = p2.y - p1.y;
			var len = Math.sqrt(dx * dx + dy * dy);
			var normal = {
				x: dx / len,
				y: dy / len
			};
			var progressOnLine = 0;
			this.moveTo(x + p1.x + gapLeft * normal.x, y + p1.y + gapLeft * normal.y);
			while (progressOnLine <= len) {
				progressOnLine += gapLeft;
				if (dashLeft > 0) progressOnLine += dashLeft;
				else progressOnLine += dash;
				if (progressOnLine > len) {
					dashLeft = progressOnLine - len;
					progressOnLine = len;
				} else {
					dashLeft = 0;
				}
				this.lineTo(x + p1.x + progressOnLine * normal.x, y + p1.y + progressOnLine * normal.y);
				progressOnLine += gap;
				if (progressOnLine > len && dashLeft == 0) {
					gapLeft = progressOnLine - len;
				} else {
					gapLeft = 0;
					this.moveTo(x + p1.x + progressOnLine * normal.x, y + p1.y + progressOnLine * normal.y);
				}
			}
		}
	}
	PIXI.Graphics.prototype._calculateBounds = function () {
		var minX = Infinity;
		var maxX = -Infinity;
		var minY = Infinity;
		var maxY = -Infinity;

		//this.rotation = 0;
		if (this.graphicsData.length) {
			this._recursivePostUpdateTransform();
			var mat = this.transform.worldTransform;

			for (var i = 0; i < this.graphicsData.length; i++) {
				var data = this.graphicsData[i];
				var type = data.type;
				if (type === PIXI.SHAPES.RECT || type === PIXI.SHAPES.RREC) {
					x = shape.x - lineWidth / 2;
					y = shape.y - lineWidth / 2;
					w = shape.width + lineWidth;
					h = shape.height + lineWidth;

					minX = x < minX ? x : minX;
					maxX = x + w > maxX ? x + w : maxX;

					minY = y < minY ? y : minY;
					maxY = y + h > maxY ? y + h : maxY;
				} else if (type === PIXI.SHAPES.CIRC) {
					x = shape.x;
					y = shape.y;
					w = shape.radius + lineWidth / 2;
					h = shape.radius + lineWidth / 2;

					minX = x - w < minX ? x - w : minX;
					maxX = x + w > maxX ? x + w : maxX;

					minY = y - h < minY ? y - h : minY;
					maxY = y + h > maxY ? y + h : maxY;
				} else if (type === PIXI.SHAPES.ELIP) {
					x = shape.x;
					y = shape.y;
					w = shape.width + lineWidth / 2;
					h = shape.height + lineWidth / 2;

					minX = x - w < minX ? x - w : minX;
					maxX = x + w > maxX ? x + w : maxX;

					minY = y - h < minY ? y - h : minY;
					maxY = y + h > maxY ? y + h : maxY;
				} else if (type === PIXI.SHAPES.POLY) {
					var lineWidth = data.lineWidth;
					var shape = data.shape;
					var points = shape.points;

					for (var j = 0; j + 2 < points.length; j += 2) {
						var u1 = points[j];
						var v1 = points[j + 1];
						var u2 = points[j + 2];
						var v2 = points[j + 3];

						var x = u1 * mat.a + v1 * mat.c + mat.tx;
						var y = u1 * mat.b + v1 * mat.d + mat.ty;
						var x2 = u2 * mat.a + v2 * mat.c + mat.tx;
						var y2 = u2 * mat.b + v2 * mat.d + mat.ty;

						var dx = Math.abs(x2 - x);
						var dy = Math.abs(y2 - y);
						var h = lineWidth;
						var w = Math.sqrt((dx * dx) + (dy * dy));

						if (w < 1e-9) {
							continue;
						}

						var rw = ((h / w * dy) + dx) / 2;
						var rh = ((h / w * dx) + dy) / 2;
						var cx = (x2 + x) / 2;
						var cy = (y2 + y) / 2;

						minX = cx - rw < minX ? cx - rw : minX;
						maxX = cx + rw > maxX ? cx + rw : maxX;

						minY = cy - rh < minY ? cy - rh : minY;
						maxY = cy + rh > maxY ? cy + rh : maxY;

					}
				}
			}
		} else {
			minX = 0;
			maxX = 0;
			minY = 0;
			maxY = 0;
		}

		var padding = this.boundsPadding;
		minX = minX - padding;
		maxX = maxX + padding;
		minY = minY - padding;
		maxY = maxY + padding;

		this._bounds.minX = minX;
		this._bounds.maxX = maxX;
		this._bounds.minY = minY;
		this._bounds.maxY = maxY;
	}

	//CONSTS
	this.object_typeToName = ["Physics Body", "Texture", "Joint"];

	this.object_BODY = 0;
	this.object_TEXTURE = 1;
	this.object_JOINT = 2;
	this.object_PREFAB = 4;
	this.object_MULTIPLE = 5;
	this.object_GRAPHIC = 6;
	this.object_GRAPHICGROUP = 7;
	this.object_TRIGGER = 8;
	this.object_TEXT = 9;
	this.object_SETTINGS = 10;
	this.object_ANIMATIONGROUP = 11;


	this.jointObject_TYPE_PIN = 0;
	this.jointObject_TYPE_SLIDE = 1;
	this.jointObject_TYPE_DISTANCE = 2;
	this.jointObject_TYPE_ROPE = 3;
	this.jointObject_TYPE_WHEEL = 4;

	this.mouseTransformType = 0;
	this.mouseTransformType_Movement = 0;
	this.mouseTransformType_Rotation = 1;

	this.DEG2RAD = 0.017453292519943296;
	this.RAD2DEG = 57.29577951308232;
	this.PI2 = Math.PI*0.5;

	this.MASKBIT_NORMAL = 0x0001;
	this.MASKBIT_FIXED = 0x0002;
	this.MASKBIT_CHARACTER = 0x0004;
	this.MASKBIT_EVERYTHING_BUT_US = 0x0008;
	this.MASKBIT_ONLY_US = 0x0010;
	this.GROUPINDEX_CHARACTER = -3;

	this.tool_SELECT = 0;
	this.tool_GEOMETRY = 1;
	this.tool_POLYDRAWING = 2;
	this.tool_JOINTS = 3;
	this.tool_SPECIALS = 4;
	this.tool_TEXT = 5;
	this.tool_ART = 6;
	this.tool_TRIGGER = 7;
	this.tool_SETTINGS = 8;
	this.tool_CAMERA = 9;

	this.minimumBodySurfaceArea = 0.3;
}
export const B2dEditor = new _B2dEditor();

window.editor = B2dEditor;
