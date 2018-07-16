import * as Box2D from "../libs/Box2D_NEW";
import * as prefab from "./PrefabData";
import {
	game
} from "./Game";

const PIXI = require('pixi.js');
const dat = require('dat.gui').default;

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

export function B2dEditor() {
	this.initialPTM;
	this.PTM;
	this.world;
	this.debugGraphics = null;
	this.textures = null;
	this.currentTime;
	this.deltaTime;
	this.contactCallBackListener;

	this.prefabs = {};
	this.prefabCounter = 0; //to ensure uniquenesss

	this.container = null;
	this.selectedTool = 0;
	this.admin = true; // for future to dissalow certain changes like naming
	this.breakPrefabs = false;
	this.editorGUI;
	this.editorGUIPos = {
		x: 0,
		y: 0
	};
	this.customGUIContainer = document.getElementById('my-gui-container');

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
	this.tileLists = {};
	// future this can be an opject with keys like bricks/green/etc.

	this.assetGUI;
	this.assetGUIPos = {
		x: 0,
		y: 0
	};
	this.assetSelectedTexture = "";
	this.assetSelectedGroup = "";
	this.assetSelectedObject = "";

	this.editorIcons = [];

	this.worldJSON;

	this.copiedJSON = '';
	this.copyCenterPoint = {
		x: 0,
		y: 0
	};

	this.mouseDown = false;
	this.shiftDown = false;
	this.spaceDown = false;
	this.spaceCameraDrag = false;
	this.altDown = false;
	this.editing = true;

	this.lookupGroups = {};

	this.undoList = [];
	this.undoIndex = 0;
	this.undoing = false;
	this.undoTransformXY = {};
	this.undoTransformRot = 0;
	this.undoTransformDepthHigh = false;

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
		this.prefabs = {};
		this.container.addChild(this.textures);


		//Editor Draw
		this.debugGraphics = new PIXI.Graphics();
		this.container.parent.addChild(this.debugGraphics);

		this.mousePosPixel = new b2Vec2(0, 0);
		this.mousePosWorld = new b2Vec2(0, 0);

		this.canvas = document.getElementById("canvas");

		this.initGui();
		this.selectTool(this.tool_SELECT);
	}
	this.windows = [];
	this.startDragPos = {
		x: 0,
		y: 0
	};
	this.startDragMouse = {
		x: 0,
		y: 0
	};
	this.initDrag = function (event, _window) {
		var self = this;
		$(document).on('mousemove', function (event) {
			self.doDrag(event, _window)
		});
		self.startDragMouse.x = event.pageX;
		self.startDragMouse.y = event.pageY;
		self.startDragPos.x = parseInt($(_window).css('left'), 10) || 0;
		self.startDragPos.y = parseInt($(_window).css('top'), 10) || 0;

	}
	this.endDrag = function (event, _window) {
		$(document).off('mousemove');
	}
	this.doDrag = function (event, _window) {
		var difX = event.pageX - self.startDragMouse.x;
		var difY = event.pageY - self.startDragMouse.y;

		$(_window).css('left', self.startDragPos.x + difX);
		$(_window).css('top', self.startDragPos.y + difY);
	}
	this.registerDragWindow = function (_window) {
		this.windows.push(_window);
		var $titleBar = $(_window).find('.dg .title');
		$(_window).css('position', 'absolute');
		$titleBar.on('mousedown', function (event) {
			self.initDrag(event, _window)
		});
		$(document).on('mouseup', function (event) {
			self.endDrag(event, _window)
		});
	}
	this.initGui = function () {
		this.initGuiAssetSelection();
		this.createToolGUI();
		this.canvas.focus();
	}
	this.initGuiAssetSelection = function () {
		this.removeGuiAssetSelection();

		if (this.assetLists.__keys == undefined) this.assetLists.__keys = Object.keys(this.assetLists);

		if (this.assetLists.__keys.length > 0) {

			this.assetGUI = new dat.GUI({
				autoPlace: false,
				width: 300
			});
			this.customGUIContainer.appendChild(this.assetGUI.domElement);
			this.assetGUI.addFolder('Asset Selection');

			if (this.assetSelectedGroup == "") this.assetSelectedGroup = this.assetLists.__keys[0];
			this.assetSelectedTexture = this.assetLists[this.assetSelectedGroup][0];


			var folder = this.assetGUI.addFolder('Textures');
			var self = this;
			folder.add(self, "assetSelectedGroup", this.assetLists.__keys).onChange(function (value) {
				self.initGuiAssetSelection();
			});
			folder.add(self, "assetSelectedTexture", this.assetLists[this.assetSelectedGroup]).onChange(function (value) {}).name("Select");
			this.spawnTexture = function () {};

			folder.open();
			$(folder.domElement).parent().parent().parent().hover(function () {
				$(this).addClass('hover');
			})

			for (var i = 0; i < this.assetLists[this.assetSelectedGroup].length; i++) {
				var textureName = this.assetLists[this.assetSelectedGroup][i];
				var texture = new PIXI.heaven.Sprite(PIXI.Texture.fromFrame(textureName));
				let image = game.app.renderer.plugins.extract.image(texture);
				var guiFunction = $($.parseHTML(`<li class="cr function"><div><img src=""></img><div class="c"><div class="button"></div></div></div></li>`));
				guiFunction.find('img').attr('src', image.src);
				guiFunction.find('img').attr('title', textureName);
				//guiFunction.find('img').attr('draggable', false);
				$(folder.domElement).append(guiFunction);
				guiFunction.css('height', texture.height);
				guiFunction.find('img').css('display', 'block');
				guiFunction.find('img').css('margin', 'auto');
				guiFunction.attr('textureName', textureName);

				guiFunction.on('click dragend', function (e) {
					var guiAsset = $(this).parent().parent().parent().parent();
					var rect = guiAsset[0].getBoundingClientRect();
					var x = Math.max(e.pageX, rect.right + image.width / 2);
					var y = e.pageY;

					var data = new self.textureObject;
					if (x == e.pageX) {
						data.x = (x - image.width / 2) / self.container.scale.x - self.container.x / self.container.scale.x;
						data.y = (y + image.height / 2) / self.container.scale.y - self.container.y / self.container.scale.x;
					} else {
						data.x = (x) / self.container.scale.x - self.container.x / self.container.scale.x;
						data.y = (y) / self.container.scale.y - self.container.y / self.container.scale.x;
					}
					data.textureName = $(this).attr('textureName');
					var texture = self.buildTextureFromObj(data);

				});
			}
			this.registerDragWindow(this.assetGUI.domElement);
			$(this.assetGUI.domElement).css('left', this.assetGUIPos.x);
			$(this.assetGUI.domElement).css('top', this.assetGUIPos.y);
		}
	}
	this.removeGuiAssetSelection = function () {
		if (this.assetGUI != undefined) {
			this.assetGUIPos = {
				x: parseInt($(this.assetGUI.domElement).css('left'), 10),
				y: parseInt($(this.assetGUI.domElement).css('top'), 10)
			};
			this.customGUIContainer.removeChild(this.assetGUI.domElement);
			this.assetGUI = undefined;
		}
	}
	this.createToolGUI = function () {
		var self = this;
		var toolGui = document.createElement("div");
		toolGui.setAttribute('class', 'toolgui main');
		var header = document.createElement('div');
		header.setAttribute('class', 'dg');
		var ul = document.createElement('ul');
		header.appendChild(ul);
		var li = document.createElement('li');
		li.setAttribute('class', 'title')
		li.innerText = "tools";
		ul.appendChild(li);
		toolGui.appendChild(header);
		const icons = ['Icon_Mouse.png', 'Icon_Geometry.png', 'Icon_PolygonDrawing.png', 'Icon_Joints.png', 'Icon_Specials.png', 'Icon_Text.png', 'Icon_Zoom.png', 'Icon_Hand.png', 'Icon_PaintBucket.png', 'Icon_Eraser.png'];

		var buttonElement;
		var imgElement;
		for (var i = 0; i < icons.length; i++) {
			buttonElement = document.createElement("table");
			buttonElement.setAttribute('class', 'toolgui button');
			var row = document.createElement("tr");
			buttonElement.appendChild(row);
			imgElement = document.createElement('td');
			imgElement.setAttribute('class', 'toolgui img');
			row.appendChild(imgElement);
			toolGui.appendChild(buttonElement);

			var clickFunction = function (_i) {
				return function () {
					self.selectTool(_i)
				}
			};
			$(buttonElement).on('click', clickFunction(i));
		}
		document.getElementById('uicontainer').appendChild(toolGui);
		var $buttons = $('.toolgui .img');
		for (var i = 0; i < $buttons.length; i++) {
			$($buttons[i]).css('background-image', 'url(assets/images/gui/' + icons[i] + ')');
		}
		self.registerDragWindow(toolGui);
	}
	this.buildEditorGUI = function () {
		this.editorGUI = new dat.GUI({
			autoPlace: false,
			width: this.editorGUIWidth
		});
		this.customGUIContainer.appendChild(this.editorGUI.domElement);
	}
	this.destroyEditorGUI = function () {
		if (this.editorGUI != undefined) {
			this.customGUIContainer.removeChild(this.editorGUI.domElement);
			this.editorGUI = undefined;
		}
		if (this.assetGUI != undefined) {
			this.customGUIContainer.removeChild(this.assetGUI.domElement);
			this.assetGUI = undefined;
		}
	}
	this.showPrefabList = function () {
		var prefabPages = prefab.prefabs.libraryKeys;
		if (this.admin) prefabPages.push("admin");
		this.editorGUI.addFolder('Prefab Selection');
		if (this.assetSelectedGroup == "" || !prefabPages.includes(this.assetSelectedGroup)) this.assetSelectedGroup = prefabPages[0];
		this.assetSelectedTexture = prefab.prefabs.libraryDictionary[this.assetSelectedGroup][0];
		var folder = this.editorGUI.addFolder('Prefabs');
		var self = this;
		folder.add(self, "assetSelectedGroup", prefabPages).onChange(function (value) {
			self.destroyEditorGUI();
			self.buildEditorGUI();
			self.showPrefabList();
		});
		folder.add(self, "assetSelectedTexture", prefab.prefabs.libraryDictionary[this.assetSelectedGroup]).onChange(function (value) {}).name("Select");
		this.spawnTexture = function () {};
		folder.open();
		$(folder.domElement).parent().parent().parent().hover(function () {
			$(this).addClass('hover');
		})
		for (var i = 0; i < prefab.prefabs.libraryDictionary[this.assetSelectedGroup].length; i++) {
			var prefabName = prefab.prefabs.libraryDictionary[this.assetSelectedGroup][i];

			let image = this.renderPrefabToImage(prefabName);
			var guiFunction = $($.parseHTML(`<li class="cr function"><div><img src=""></img><div class="c"><div class="button"></div></div></div></li>`));
			guiFunction.find('img').attr('src', image.src);
			guiFunction.find('img').attr('title', prefabName);
			$(folder.domElement).append(guiFunction);
			guiFunction.css('height', '100px');
			guiFunction.find('img').css('display', 'block');
			guiFunction.find('img').css('margin', 'auto');
			guiFunction.attr('prefabName', prefabName);

			guiFunction.on('click dragend', function (e) {
				var guiAsset = $(this).parent().parent().parent().parent();
				var rect = guiAsset[0].getBoundingClientRect();
				var x = Math.max(e.pageX, rect.right + 200);
				var y = e.pageY;

				var data = new self.prefabObject;
				data.instanceID = self.prefabCounter;

				data.x = (x) / self.container.scale.x - self.container.x / self.container.scale.x;
				data.y = (y) / self.container.scale.y - self.container.y / self.container.scale.x;

				data.prefabName = $(this).attr('prefabName');
				data.settings = JSON.parse(JSON.stringify(prefab.prefabs[data.prefabName].class.settings));
				var newPrefab = self.buildPrefabFromObj(data);

			});
		}
	}
	this.selectTool = function (i) {
		if (this.selectedTool == this.tool_MOVE) this.spaceCameraDrag = false;
		this.selectedTool = i;

		this.selectedTextures = [];
		this.selectedPhysicsBodies = [];
		this.selectedPrefabs = [];

		var $buttons = $('.toolgui .button');
		$buttons.css("background-color", "#999999");
		$($buttons[i]).css("background-color", "#4F4F4F");

		this.destroyEditorGUI();
		this.buildEditorGUI();

		var dataJoint;
		var self = this;
		var controller;
		var folder;

		switch (i) {
			case this.tool_SELECT:
				this.destroyEditorGUI();
				break
			case this.tool_GEOMETRY:
				this.editorGUI.editData = this.editorGeometryObject;
				this.editorGUI.addFolder('draw shapes');
				var shapes = ["Circle", "Box", "Triangle"];
				this.editorGUI.editData.shape = shapes[0];
				this.editorGUI.add(self.editorGUI.editData, "shape", shapes);
				this.editorGUI.addColor(self.editorGUI.editData, "colorFill");
				this.editorGUI.addColor(self.editorGUI.editData, "colorLine");
				this.editorGUI.add(self.editorGUI.editData, "transparancy", 0, 1);
				this.editorGUI.add(self.editorGUI.editData, "isPhysicsObject");
				break
			case this.tool_POLYDRAWING:
				this.destroyEditorGUI();
				break
			case this.tool_JOINTS:
				this.editorGUI.editData = this.editorJointObject;
				this.editorGUI.addFolder('add joints');

				this.addJointGUI(this.editorJointObject);

				break
			case this.tool_SPECIALS:
				this.showPrefabList();
				break
			case this.tool_TEXT:
				break
			case this.tool_ZOOM:
				break
			case this.tool_MOVE:
				this.destroyEditorGUI();
				this.spaceCameraDrag = true;
				break
			case this.tool_PAINTBUCKET:
				this.editorGUI.editData = this.editorGraphicDrawingObject;
				this.editorGUI.addFolder('draw graphics');
				//for (var key in this.editorGUI.editData) {
				//	if (this.editorGUI.editData.hasOwnProperty(key)) {
				//TODO:Load from saved data
				//	}
				//}
				this.editorGUI.addColor(self.editorGUI.editData, "colorFill");
				this.editorGUI.addColor(self.editorGUI.editData, "colorLine");
				this.editorGUI.add(self.editorGUI.editData, "transparancy", 0, 1);
				break
			case this.tool_ERASER:
				this.editorGUI.editData = this.editorTriggerObject;
				this.editorGUI.addFolder('add triggers');

				var shapes = ["Circle", "Box"];
				this.editorGUI.editData.shape = shapes[0];
				this.editorGUI.add(self.editorGUI.editData, "shape", shapes);

				break
		}
		if (this.editorGUI) this.registerDragWindow(this.editorGUI.domElement);
		this.canvas.focus();
	}

	this.updateSelection = function () {
		//Joints
		var i;

		this.destroyEditorGUI();


		var case_NOTHING = 0;
		var case_JUST_BODIES = 1;
		var case_JUST_TEXTURES = 2;
		var case_JUST_JOINTS = 3;
		var case_JUST_PREFABS = 4;
		var case_MULTIPLE = 5;
		var case_JUST_GRAPHICS = 6;
		var case_JUST_TRIGGERS = 7;

		var currentCase = case_NOTHING;
		var prefabKeys = Object.keys(this.selectedPrefabs);

		if (prefabKeys.length > 0 && this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0) {
			var uniqueSelectedPrefabs = {};
			for (var i = 0; i < prefabKeys.length; i++) {
				uniqueSelectedPrefabs[this.prefabs[prefabKeys[i]].prefabName] = true;
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
			var _selectedPinJoints = [];
			var _selectedSlideJoints = [];
			var _selectedDistanceJoints = [];
			var _selectedRopeJoints = [];
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
					}
				} else if (_texture.data && _texture.data.type == this.object_GRAPHIC) {
					_selectedGraphics.push(_texture);
				} else {
					_selectedTextures.push(_texture);
				}
			}
			var editingMultipleObjects = (_selectedTextures.length > 0 ? 1 : 0) + (_selectedGraphics.length > 0 ? 1 : 0) + (_selectedPinJoints.length > 0 ? 1 : 0) + (_selectedSlideJoints.length > 0 ? 1 : 0) + (_selectedDistanceJoints.length > 0 ? 1 : 0) + (_selectedRopeJoints.length > 0 ? 1 : 0);
			if (editingMultipleObjects > 1) {
				currentCase = case_MULTIPLE;
			} else if (_selectedTextures.length > 0) {
				currentCase = case_JUST_TEXTURES;
			} else if (_selectedGraphics.length > 0) {
				currentCase = case_JUST_GRAPHICS;
			} else {
				currentCase = case_JUST_JOINTS;
			}
		} else if (this.selectedPhysicsBodies.length > 0 || this.selectedTextures.length > 0 || prefabKeys.length > 0) {
			currentCase = case_MULTIPLE;
		}

		if (currentCase == case_NOTHING) return;

		this.editorGUI = new dat.GUI({
			autoPlace: false,
			width: this.editorGUIWidth
		});
		this.customGUIContainer.appendChild(this.editorGUI.domElement);
		var dataJoint;
		var self = this;
		var controller;
		var folder;

		//Init edit data;
		switch (currentCase) {
			case case_JUST_BODIES:
				this.editorGUI.editData = new this.bodyObject;
				dataJoint = this.selectedPhysicsBodies[0].mySprite.data;
				if (this.selectedPhysicsBodies.length > 1) this.editorGUI.addFolder('multiple bodies');
				else this.editorGUI.addFolder('body');
				break;
			case case_JUST_TEXTURES:
				dataJoint = _selectedTextures[0].data;
				this.editorGUI.editData = new this.textureObject;
				if (this.selectedTextures.length > 1) this.editorGUI.addFolder('multiple textures');
				else this.editorGUI.addFolder('texture');
				break;
			case case_JUST_GRAPHICS:
				dataJoint = _selectedGraphics[0].data;
				this.editorGUI.editData = new this.graphicObject;
				if (this.selectedTextures.length > 1) this.editorGUI.addFolder('multiple graphics');
				else this.editorGUI.addFolder('graphic');
				break;
			case case_JUST_JOINTS:
				var selectedType = ""
				this.editorGUI.editData = new this.jointObject;
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
				}
				if (this.selectedTextures.length > 1) this.editorGUI.addFolder('multiple joints');
				else this.editorGUI.addFolder(`${selectedType} joint`);
				break;
			case case_JUST_PREFABS:
				this.editorGUI.editData = new this.prefabObject;
				dataJoint = this.prefabs[prefabKeys[0]];
				if (this.selectedPrefabs.length > 1) this.editorGUI.addFolder('multiple prefabs');
				else this.editorGUI.addFolder('prefab ' + dataJoint.prefabName);
				break;
			case case_MULTIPLE:
				this.editorGUI.editData = new this.multiObject;

				if (this.selectedTextures.length > 0) dataJoint = this.selectedTextures[0].data;
				else if (this.selectedPhysicsBodies.length > 0) dataJoint = this.selectedPhysicsBodies[0].mySprite.data;
				else dataJoint = this.prefabs[prefabKeys[0]];

				this.editorGUI.addFolder('multiple objects');
				break;
			case case_JUST_TRIGGERS:
				this.editorGUI.editData = new this.triggerObject;
				dataJoint = this.selectedPhysicsBodies[0].mySprite.data;
				if (this.selectedPhysicsBodies.length > 1) this.editorGUI.addFolder('multiple triggers');
				else this.editorGUI.addFolder('trigger');
				break;
		}

		for (var key in this.editorGUI.editData) {
			if (this.editorGUI.editData.hasOwnProperty(key)) {
				this.editorGUI.editData[key] = dataJoint[key];

				if (dataJoint.type == this.object_BODY && (key == "x" || key == "y")) {
					this.editorGUI.editData[key] *= this.PTM;
				}
				if (key == "groups") {
					if (!this.isSelectionPropertyTheSame("groups")) this.editorGUI.editData.groups = "-";
				}
			}
		}

		//Populate default GUI Fields
		this.editorGUI.add(self.editorGUI.editData, "x").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value - this.initialValue;
			this.initialValue = value;
		});

		this.editorGUI.add(self.editorGUI.editData, "y").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value - this.initialValue;
			this.initialValue = value;
		});
		if (currentCase != case_MULTIPLE && currentCase != case_JUST_JOINTS) {
			this.editorGUI.add(self.editorGUI.editData, "rotation").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			});
		}
		if (prefabKeys.length == 0) {
			this.editorGUI.add(self.editorGUI.editData, "groups").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});
		}
		if (this.selectedTextures.length + this.selectedPhysicsBodies.length == 1 && prefabKeys.length == 0) {
			this.editorGUI.add(self.editorGUI.editData, "refName").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});
		}
		//Populate custom  fields
		switch (currentCase) {
			case case_JUST_BODIES:
				this.editorGUI.add(self.editorGUI.editData, "tileTexture", this.tileLists).onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});

				if (self.editorGUI.editData.colorFill instanceof Array) {
					//TODO: dont know yet ?
				} else {
					controller = this.editorGUI.addColor(self.editorGUI.editData, "colorFill");
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));
					controller = this.editorGUI.addColor(self.editorGUI.editData, "colorLine");
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));
					controller = this.editorGUI.add(self.editorGUI.editData, "transparancy", 0, 1);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));
				}
				this.editorGUI.add(self.editorGUI.editData, "fixed").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				});
				this.editorGUI.add(self.editorGUI.editData, "awake").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				});
				controller = this.editorGUI.add(self.editorGUI.editData, "density", 0, 1000).step(0.1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				}.bind(controller));
				controller = this.editorGUI.add(self.editorGUI.editData, "collision", 0, 7).step(1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				}.bind(controller));

				this.editorGUI.editData.convertToGraphic = function () {};
				var label = this.selectedTextures.length == 1 ? ">Convert to Graphic<" : ">Convert to Graphics<";
				controller = this.editorGUI.add(self.editorGUI.editData, "convertToGraphic").name(label);
				this.editorGUI.editData.convertToGraphic = (function (_c) {
					return function () {
						if (_c.domElement.previousSibling.innerText != ">Click to Confirm<") {
							_c.name(">Click to Confirm<");
						} else {
							_c.name(label);
							self.convertSelectedBodiesToGraphics();
						}
					}
				})(controller)
				break;
			case case_JUST_TEXTURES:
				controller = this.editorGUI.addColor(self.editorGUI.editData, "tint");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				break;
			case case_JUST_GRAPHICS:
				controller = this.editorGUI.addColor(self.editorGUI.editData, "colorFill");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = this.editorGUI.addColor(self.editorGUI.editData, "colorLine");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = this.editorGUI.add(self.editorGUI.editData, "transparancy", 0, 1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				this.editorGUI.editData.convertToBody = function () {};
				var label = this.selectedTextures.length == 1 ? ">Convert to PhysicsBody<" : ">Convert to PhysicsBodies<";
				controller = this.editorGUI.add(self.editorGUI.editData, "convertToBody").name(label);
				this.editorGUI.editData.convertToBody = (function (_c) {
					return function () {
						if (_c.domElement.previousSibling.innerText != ">Click to Confirm<") {
							_c.name(">Click to Confirm<");
						} else {
							_c.name(label);
							self.convertSelectedGraphicsToBodies();
						}
					}
				})(controller)

				break;
			case case_JUST_JOINTS:
				this.addJointGUI(dataJoint);
				break;
			case case_JUST_PREFABS:
				var prefabObject = this.prefabs[Object.keys(this.selectedPrefabs)[0]];
				var prefabClass = prefab.prefabs[prefabObject.prefabName].class;
				var prefabObjectSettings = prefabObject.settings;
				var prefabClassSettings = prefabClass.settings;
				var prefabClassOptions = prefabClass.settingsOptions;


				for (var key in prefabClassOptions) {
					if (prefabClassOptions.hasOwnProperty(key)) {
						var argument;
						this.editorGUI.editData[key] = prefabObjectSettings[key];
						if (prefabClassOptions[key] && prefabClassOptions[key] instanceof Object && !(prefabClassOptions[key] instanceof Array)) {
							argument = prefabClassOptions[key];
							this.editorGUI.add(self.editorGUI.editData, key, argument.min, argument.max).step(argument.step).onChange(function (value) {
								this.humanUpdate = true;
								this.targetValue = value
							});
						} else {
							if (prefabClassOptions[key] && prefabClassOptions[key] instanceof Array) argument = prefabClassOptions[key];
							else argument = null;
							this.editorGUI.add(self.editorGUI.editData, key, argument).onChange(function (value) {
								this.humanUpdate = true;
								this.targetValue = value
							});
						}
					}
				}

				break;
			case case_MULTIPLE:
				break;
			case case_JUST_TRIGGERS:
				this.editorGUI.editData.selectTarget = function () {};
				var label = ">Select Target<";
				controller = this.editorGUI.add(self.editorGUI.editData, "selectTarget").name(label);
				this.editorGUI.editData.selectTarget = function () {
					self.selectingTriggerTarget = true;
					console.log(self);
				}
				break;
		}
		//TODO:Maybe add admin mode / pro mode for lockselection
		if (self.editorGUI.editData.lockselection == undefined) self.editorGUI.editData.lockselection = false;
		this.editorGUI.add(self.editorGUI.editData, "lockselection").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value;
		});
		this.registerDragWindow(this.editorGUI.domElement);
	}
	this.addJointGUI = function (dataJoint) {
		var self = this;
		var controller;
		var folder;
		var jointTypes = ["Pin", "Slide", "Distance", "Rope"];
		this.editorGUI.editData.typeName = jointTypes[dataJoint.jointType];
		this.editorGUI.add(self.editorGUI.editData, "typeName", jointTypes).onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value
		});
		this.editorGUI.add(self.editorGUI.editData, "collideConnected").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value
		});

		if (dataJoint.jointType == this.jointObject_TYPE_PIN || dataJoint.jointType == this.jointObject_TYPE_SLIDE) {

			folder = this.editorGUI.addFolder('enable motor');
			folder.add(self.editorGUI.editData, "enableMotor").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});

			var lowerLimit = 0;
			var higherLimit = 0;

			if (dataJoint.jointType == this.jointObject_TYPE_PIN) {
				lowerLimit = 0;
				higherLimit = 10000;
			} else {
				lowerLimit = 0;
				higherLimit = 1000;
			}

			controller = folder.add(self.editorGUI.editData, "maxMotorTorque", lowerLimit, higherLimit);
			controller.onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			}.bind(controller));

			if (dataJoint.jointType == this.jointObject_TYPE_SLIDE) controller.name("maxMotorForce");

			controller = folder.add(self.editorGUI.editData, "motorSpeed", -20, 20);
			controller.onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			}.bind(controller));


			folder = this.editorGUI.addFolder('enable limits');
			folder.add(self.editorGUI.editData, "enableLimit").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});

			if (dataJoint.jointType == this.jointObject_TYPE_PIN) {
				controller = folder.add(self.editorGUI.editData, "upperAngle", 0, 180);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				controller = folder.add(self.editorGUI.editData, "lowerAngle", -180, 0);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				}.bind(controller));
			} else {
				controller = folder.add(self.editorGUI.editData, "upperLimit", 0, 5000);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				controller = folder.add(self.editorGUI.editData, "lowerLimit", -5000, 0);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				}.bind(controller));
			}
		} else if (dataJoint.jointType == this.jointObject_TYPE_DISTANCE) {
			folder = this.editorGUI.addFolder('spring');

			controller = folder.add(self.editorGUI.editData, "frequencyHz", 0, 180);
			controller.onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			}.bind(controller));

			controller = folder.add(self.editorGUI.editData, "dampingRatio", 0.0, 1.0).step(0.25);
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
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] instanceof this.prefabObject) {
				arr = arr.concat(this.lookupGroups[arr[i].key]._bodies, this.lookupGroups[arr[i].key]._textures, this.lookupGroups[arr[i].key]._joints);
				delete this.prefabs[arr[i].key];
			} else if (arr[i].data) {
				//graphic object
				var sprite = arr[i];
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
				sprite.parent.removeChild(sprite);
				sprite.destroy({
					children: true,
					texture: false,
					baseTexture: false
				});
			} else if (arr[i].mySprite.data) {
				var b = arr[i];
				this.removeObjectFromLookupGroups(b, b.mySprite.data);
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
				this.world.DestroyBody(b);
			}
		}
	}
	this.deleteSelection = function () {
		var toBeDeletedPrefabs = []
		for (var key in this.selectedPrefabs) {
			if (this.selectedPrefabs.hasOwnProperty(key)) {
				toBeDeletedPrefabs.push(this.prefabs[key]);
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
			if (!prefab.prefabs[this.prefabs[prefabKeys[i]].prefabName].class.forceUnique) {
				this.updateObject(null, this.prefabs[prefabKeys[i]]);
				cloneObject = this.parseArrObject(JSON.parse(this.stringifyObject(this.prefabs[prefabKeys[i]])));
				copyArray.push({
					ID: cloneObject.ID,
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
				for (j = 0; j < copyArray.length; j++) {

					if (copyArray[j].ID == data.bodyA_ID) {
						foundBodyA = true;
						data.bodyA_ID = j;
						break;
					}
				}
				var foundBodyB = false;
				if (data.bodyB_ID != undefined) {
					for (j = 0; j < copyArray.length; j++) {

						if (copyArray[j].ID == data.bodyB_ID) {
							foundBodyB = true;
							data.bodyB_ID = j;
							break;
						}
					}

				} else {
					foundBodyB = true;
				}

				if (!foundBodyA || !foundBodyB) {
					copyArray.splice(i, 1);
					i--;
				}
			} else if (data.type == this.object_TEXTURE || data.type == this.object_GRAPHIC || data.type == this.object_GRAPHICGROUP) {
				for (j = 0; j < copyArray.length; j++) {
					if (copyArray[j].ID == data.bodyID) {
						data.bodyID = j;
						break;
					}
				}
			}
		}
		var copyJSON = '{"objects":[';
		this.copyCenterPoint = {
			x: 0,
			y: 0
		};
		var copiedPrefabCount = 0;
		for (i = 0; i < copyArray.length; i++) {
			if (i != 0) copyJSON += ',';
			data = copyArray[i].data;
			data.ID = i;
			copyJSON += this.stringifyObject(data);
			if (data.type == this.object_BODY) {
				this.copyCenterPoint.x += data.x * this.PTM;
				this.copyCenterPoint.y += data.y * this.PTM;

			} else {
				this.copyCenterPoint.x += data.x;
				this.copyCenterPoint.y += data.y;

				if (data.type == this.object_PREFAB) {
					data.instanceID = copiedPrefabCount++;
				}
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
				if (sprite.myBody != undefined && sprite.data.type != this.object_TEXTURE && sprite.data.type != this.object_GRAPHIC && sprite.data.type != this.object_GRAPHICGROUP) {
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
				this.prefabs[prefabKeys[i]].x -= movX;
				this.prefabs[prefabKeys[i]].y -= movY;
			}


			this.updateSelection();
		}
	}
	this.doEditor = function () {
		this.debugGraphics.clear();

		if (this.selectedTool == this.tool_SELECT || this.selectedTool == this.tool_JOINTS) {
			if (this.selectingTriggerTarget) this.doTriggerTargetSelection();
			else this.doSelection();
		} else if (this.selectedTool == this.tool_POLYDRAWING) {
			this.doVerticesDrawing(true);
		} else if (this.selectedTool == this.tool_GEOMETRY) {
			this.doGeometryDrawing();
		} else if (this.selectedTool == this.tool_CAMERA) {
			this.doCamera();
		} else if (this.selectedTool == this.tool_PAINTBUCKET) {
			this.doVerticesDrawing(false);
		}

		// Draw 0,0 reference
		this.debugGraphics.lineStyle(3, "0x00FF00", 1);
		const crossSize = 100;
		this.debugGraphics.moveTo(this.container.x, -crossSize + this.container.y);
		this.debugGraphics.lineTo(this.container.x, crossSize + this.container.y);
		this.debugGraphics.moveTo(-crossSize + this.container.x, this.container.y);
		this.debugGraphics.lineTo(crossSize + this.container.x, this.container.y);

		this.doEditorGUI();
	}
	this.run = function () {
		//update textures
		if (this.editing) {
			this.doEditor();
		}

		this.deltaTime = Date.now() - this.currentTime;
		this.currentTime = Date.now();


		var body = this.world.GetBodyList();
		var i = 0
		while (body) {

			if (body.myTexture) {

				var angle = body.GetAngle() - body.myTexture.data.texturePositionOffsetAngle;
				body.myTexture.x = body.GetPosition().x * this.PTM + body.myTexture.data.texturePositionOffsetLength * Math.cos(angle);
				body.myTexture.y = body.GetPosition().y * this.PTM + body.myTexture.data.texturePositionOffsetLength * Math.sin(angle);
				// body.mySprite.x = body.GetPosition().x * this.PTM;
				// body.mySprite.y = body.GetPosition().y * this.PTM;
				body.myTexture.rotation = body.GetAngle() - body.myTexture.data.textureAngleOffset;

			}
			if (body.mySprite && body.mySprite.visible) {
				body.mySprite.x = body.GetPosition().x * this.PTM;
				body.mySprite.y = body.GetPosition().y * this.PTM;
				body.mySprite.rotation = body.GetAngle();
			}
			i++;
			body = body.GetNext();
		}

		//update prefabs
		if (!this.editing) {
			var key;
			for (key in this.prefabs) {
				if (this.prefabs.hasOwnProperty(key)) {
					this.prefabs[key].class.update();
				}
			}
		}
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
		this.fixed = false;
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
		this.radius;
		this.tileTexture = "";
		this.lockselection = false;
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
		this.lockselection = false;
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
		this.lockselection = false;
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
		this.lockselection = false;
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
		this.triggerType = 0;
		this.repeatType = 0;
		this.triggerObjects = [];
		this.triggerActions = [];
		this.lockselection = false;
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

	this.undoObjectMovement = function () {
		this.type = self.object_UNDO_MOVEMENT;
		this.transformType;
		this.transform;
		this.objects = [];
	}

	this.prefabObject = function () {
		this.x = 0;
		this.y = 0;
		this.rotation = 0;
		this.type = self.object_PREFAB;
		this.settings;
		this.prefabName;
		this.instanceID;
	}
	this.editorJointObject = new this.jointObject();

	this.editorGraphicDrawingObject = new function () {
		this.colorFill = "#999999";
		this.colorLine = "#000";
		this.transparancy = 1.0;
	}
	this.editorGeometryObject = new function () {
		this.shape = 0;
		this.colorFill = "#999999";
		this.colorLine = "#000";
		this.transparancy = 1.0;
		this.isPhysicsObject = true;
	}
	this.editorTriggerObject = new function () {
		this.shape = 0;
	}
	this.takeCameraShot = function () {
		//first clean up screen
		this.debugGraphics.clear();
		game.newDebugGraphics.clear();
		var i;
		for (i = 0; i < this.editorIcons.length; i++) {
			this.editorIcons[i].visible = false;
		}
		game.app.render();
		//
		var imageData = this.canvas.toDataURL('image/jpeg', 1);
		var image = new Image();
		image.src = imageData;
		var canvas = $("#canvas-helper")[0];
		var context = canvas.getContext("2d");
		var shotQuality = 0.8;
		var self = this;
		image.onload = function () {
			//highRes;
			var scale = 1;
			canvas.width = self.cameraSize.w * scale;
			canvas.height = self.cameraSize.h * scale;
			context.drawImage(image, self.mousePosPixel.x - self.cameraSize.w / 2, self.mousePosPixel.y - self.cameraSize.h / 2, self.cameraSize.w, self.cameraSize.h, 0, 0, canvas.width, canvas.height);
			var highResThumb = canvas.toDataURL('image/jpeg', shotQuality);
			/*var _image = new Image();
			_image.src = highResThumb;
			document.body.appendChild(_image);*/

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
			console.log("Camera Shot Succesfull");
		}
		for (i = 0; i < this.editorIcons.length; i++) {
			this.editorIcons[i].visible = true;
		}
	}

	this.onMouseDown = function (evt) {
		if (this.editing) {
			if (this.spaceDown) {
				this.spaceCameraDrag = true;
			} else if (this.selectingTriggerTarget) {
				var highestObject = this.retrieveHighestSelectedObject(this.startSelectionPoint, this.startSelectionPoint);
				if (highestObject) {
					for (var i = 0; i < this.selectedPhysicsBodies.length; i++) {
						if (this.selectedPhysicsBodies[i].mySprite && this.selectedPhysicsBodies[i].mySprite.data.type == this.object_TRIGGER) {
							if (!this.selectedPhysicsBodies[i].mySprite.targets) this.selectedPhysicsBodies[i].mySprite.targets = [];
							this.selectedPhysicsBodies[i].mySprite.targets.push(highestObject);
						}
					}
				} else this.selectingTriggerTarget = false;

			} else if (this.selectedTool == this.tool_SELECT) {

				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.x, this.mousePosWorld.y);
				this.storeUndoMovement();
				this.undoTransformXY = {
					x: 0.0,
					y: 0.0
				};
				this.undoTransformRot = 0.0;

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
					if (this.correctDrawVertice && this.activeVertices.length > 1) {
						this.activeVertices[this.activeVertices.length - 1] = {
							x: this.correctedDrawVerticePosition.x,
							y: this.correctedDrawVerticePosition.y
						};
					} else {
						this.activeVertices.push({
							x: this.mousePosWorld.x,
							y: this.mousePosWorld.y
						});
					}
				} else {

					var bodyObject = this.createBodyObjectFromVerts(this.activeVertices);
					if (bodyObject) this.buildBodyFromObj(bodyObject);
					this.activeVertices = [];
				}
			} else if (this.selectedTool == this.tool_GEOMETRY) {
				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.x, this.mousePosWorld.y);
			} else if (this.selectedTool == this.tool_CAMERA) {
				this.takeCameraShot();
			} else if (this.selectedTool == this.tool_PAINTBUCKET) {
				if (!this.closeDrawing) {
					this.activeVertices.push({
						x: this.mousePosWorld.x,
						y: this.mousePosWorld.y
					});
				} else {
					var graphicObject = this.createGraphicObjectFromVerts(this.activeVertices);
					graphicObject.colorFill = this.editorGUI.editData.colorFill;
					graphicObject.colorLine = this.editorGUI.editData.colorLine;
					graphicObject.transparany = this.editorGUI.editData.transparancy;
					this.buildGraphicFromObj(graphicObject);
					this.activeVertices = [];
				}
			} else if (this.selectedTool == this.tool_JOINTS) {
				var joint = this.attachJointPlaceHolder();
				if (joint) {
					var jointData = JSON.parse(JSON.stringify(this.editorGUI.editData))
					delete jointData.bodyA_ID;
					delete jointData.bodyB_ID;
					delete jointData.x;
					delete jointData.y;
					delete jointData.rotation;
					Object.assign(joint.data, jointData);
					this.selectedTextures.push(joint);
				}
			} else if (this.selectedTool == this.tool_ERASER) {
				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.x, this.mousePosWorld.y);
				var triggerObject = new this.triggerObject;
				triggerObject.x = this.startSelectionPoint.x;
				triggerObject.y = this.startSelectionPoint.y;
				const triggerStartSize = 50 / game.editor.PTM;
				if (this.editorGUI.editData.shape == "Circle") triggerObject.radius = triggerStartSize * game.editor.PTM;
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
				this.buildTriggerFromObj(triggerObject);
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
					this.container.x += move.x * this.PTM;
					this.container.y += move.y * this.PTM;
					this.mousePosWorld.x -= move.x / this.container.scale.x;
					this.mousePosWorld.y -= move.y / this.container.scale.y;
				} else if (this.selectedTool == this.tool_SELECT) {
					if (this.mouseTransformType == this.mouseTransformType_Movement) {
						this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
							x: move.x * this.PTM,
							y: move.y * this.PTM
						});
					} else if (this.mouseTransformType == this.mouseTransformType_Rotation) {
						this.applyToSelectedObjects(this.TRANSFORM_ROTATE, move.x * this.PTM / 10);
					}
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
					this.prefabs[key].x += obj.x;
					this.prefabs[key].y += obj.y;
				} else if (transformType == this.TRANSFORM_ROTATE) {
					this.prefabs[key].rotation += obj;
				}
			}
		}

		//if (transformType == this.TRANSFORM_DEPTH || transformType == this.TRANSFORM_UPDATE || transformType == this.TRANSFORM_ROTATE) {
		this.applyToObjects(transformType, obj, allObjects)
		//} else {
		//	this.applyToObjects(transformType, obj, bodies);
		//	this.applyToObjects(transformType, obj, textures);
		//}

		if (transformType == this.TRANSFORM_MOVE) {
			this.undoTransformXY = {
				x: this.undoTransformXY.x + obj.x,
				y: this.undoTransformXY.y + obj.y
			};
		} else if (transformType == this.TRANSFORM_ROTATE) {
			this.undoTransformRot += obj;
		} else if (transformType == this.TRANSFORM_DEPTH) {
			this.undoTransformDepthHigh = obj;
		}
	}

	this.applyToObjects = function (transformType, obj, objects) {
		var i;
		var body;
		var sprite;

		//TODO: fix body

		if (transformType == this.TRANSFORM_MOVE || transformType == this.TRANSFORM_ROTATE) {

			var centerPoints = {};
			var data;
			var group;
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
					group = (this.altDown) ? "__altDownGroup" : data.prefabInstanceName;
					if (group) {
						if (centerPoints[group] == undefined) centerPoints[group] = {
							x: 0,
							y: 0,
							n: 0
						};
						if (body || (!this.editing && data.type == this.jointObject)) {
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


			for (i = 0; i < objects.length; i++) {

				if (objects[i].mySprite != undefined) {

					body = objects[i];
					if (transformType == this.TRANSFORM_MOVE) {
						var oldPosition = body.GetPosition();
						body.SetPosition(new b2Vec2(oldPosition.x + obj.x / this.PTM, oldPosition.y + obj.y / this.PTM));
					} else if (transformType == this.TRANSFORM_ROTATE) {
						//split between per object / group rotation

						group = (this.altDown) ? "__altDownGroup" : body.mySprite.data.prefabInstanceName;

						var oldAngle = body.GetAngle();
						var rAngle = obj * this.DEG2RAD;
						body.SetAngle(oldAngle + rAngle);

						if (group) {
							var difX = (body.GetPosition().x * this.PTM) - centerPoints[group].x;
							var difY = (body.GetPosition().y * this.PTM) - centerPoints[group].y;
							var distanceToCenter = Math.sqrt(difX * difX + difY * difY);
							var angleToCenter = Math.atan2(difY, difX);
							var newX = centerPoints[group].x + distanceToCenter * Math.cos(angleToCenter + rAngle);
							var newY = centerPoints[group].y + distanceToCenter * Math.sin(angleToCenter + rAngle);
							body.SetPosition(new b2Vec2(newX / this.PTM, newY / this.PTM));
						}

					}
				} else {
					sprite = objects[i];
					if (transformType == this.TRANSFORM_MOVE) {
						sprite.x = sprite.x + obj.x;
						sprite.y = sprite.y + obj.y;
					} else if (transformType == this.TRANSFORM_ROTATE) {
						sprite.rotation += obj * this.DEG2RAD;

						if (group) {
							var difX = sprite.x - centerPoints[group].x;
							var difY = sprite.y - centerPoints[group].y;
							var distanceToCenter = Math.sqrt(difX * difX + difY * difY);
							var angleToCenter = Math.atan2(difY, difX);
							var newX = centerPoints[group].x + distanceToCenter * Math.cos(angleToCenter + rAngle);
							var newY = centerPoints[group].y + distanceToCenter * Math.sin(angleToCenter + rAngle);
							sprite.x = newX;
							sprite.y = newY;
						}
					}

				}

			}
		} else if (transformType == this.TRANSFORM_DEPTH) {
			var tarDepthIndexes = [];
			var depthArray = [];
			var jointArray = []

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

			var neighbour;
			var child;

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
				var joint = jointArray[i];
				var jointIndex = joint.parent.getChildIndex(joint);
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
			for (var i = 0; i < objects.length; i++) {
				var sprite = (objects[i].mySprite) ? objects[i].mySprite : objects[i];
				var container = sprite.parent;
				container.removeChild(sprite);
				container.addChildAt(sprite, obj + i);
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
		if (this.undoTransformRot != 0 || this.undoTransformXY.x != 0 || this.undoTransformXY.y != 0) {
			var undoObject = new this.undoObjectMovement();
			if (this.undoTransformRot != 0) {
				undoObject.transformType = this.TRANSFORM_ROTATE;
				undoObject.transform = this.undoTransformRot;
			} else {
				undoObject.transformType = this.TRANSFORM_MOVE;
				undoObject.transform = this.undoTransformXY;
			}
			undoObject.objects = this.selectedPhysicsBodies.concat(this.selectedTextures);
			this.registerUndo(undoObject);
		}
	}

	this.registerUndo = function (obj) {
		if (!this.undoing) {
			this.undoList = this.undoList.slice(0, this.undoIndex + 1);
			this.undoList.push(obj);
			this.undoIndex = this.undoList.length - 1;
			this.undoTransformXY = {
				x: 0.0,
				y: 0.0
			};
			this.undoTransformRot = 0.0;

			var i;
			for (i = 0; i < this.undoList.length; i++) {}

		}
	}
	this.undoMove = function (backward) {
		if ((backward && this.undoIndex >= 0) || (!backward && this.undoIndex < this.undoList.length - 1)) {
			var obj = this.undoList[this.undoIndex];
			if (obj.type == this.object_UNDO_MOVEMENT) {
				var transform = {};

				if (backward) {
					if (obj.transformType == this.TRANSFORM_MOVE) {
						transform.x = -obj.transform.x;
						transform.y = -obj.transform.y;
					} else if (obj.transformType == this.TRANSFORM_ROTATE) {
						transform = -obj.transform;
					}
				} else {
					transform = obj.transform;
				}

				this.applyToObjects(obj.transformType, transform, obj.objects);


			}
			if (backward) this.undoIndex--;
			else this.undoIndex++;
		}
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
			if (this.spaceCameraDrag && this.selectedTool != this.tool_MOVE) {
				this.spaceCameraDrag = false;
			} else if (this.selectedTool == this.tool_SELECT) {
				if (this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0 && Object.keys(this.selectedPrefabs).length == 0 && this.startSelectionPoint) {
					this.selectedPhysicsBodies = this.queryWorldForBodies(this.startSelectionPoint, this.mousePosWorld);
					this.selectedTextures = this.queryWorldForGraphics(this.startSelectionPoint, this.mousePosWorld, true, 0);

					this.applyToSelectedObjects(this.TRANSFORM_UPDATE);

					this.filterSelectionForPrefabs();
					this.updateSelection();
				} else {
					this.storeUndoMovement();
				}
			} else if (this.selectedTool == this.tool_GEOMETRY) {
				if (this.editorGUI.editData.shape == "Circle") {
					var radius = new b2Vec2(this.mousePosWorld.x - this.startSelectionPoint.x, this.mousePosWorld.y - this.startSelectionPoint.y).Length() / this.container.scale.x * this.PTM;
					if (radius * 2 * Math.PI > this.minimumBodySurfaceArea) {
						var bodyObject = new this.bodyObject;
						bodyObject.x = this.startSelectionPoint.x;
						bodyObject.y = this.startSelectionPoint.y;
						bodyObject.radius = radius;
						this.buildBodyFromObj(bodyObject);
					}
				} else {
					var bodyObject = this.createBodyObjectFromVerts(this.activeVertices);
					if (bodyObject) this.buildBodyFromObj(bodyObject);
				}
			}
		}
		this.mouseDown = false;
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
		} else if (e.keyCode == 81) { //q
			this.anchorTextureToBody();
		} else if (e.keyCode == 74) { //j
			if (e.ctrlKey || e.metaKey) {
				this.selectedTextures.push(this.attachJointPlaceHolder());
			} else this.selectTool(this.tool_JOINTS);
		} else if (e.keyCode == 83) { //s
			this.stringifyWorldJSON();
		} else if (e.keyCode == 84) { //t
			this.selectTool(this.tool_CAMERA);
		} else if (e.keyCode == 86) { // v
			if (e.ctrlKey || e.metaKey) {
				this.pasteSelection();
			}
		} else if (e.keyCode == 88) { // x
			if (e.ctrlKey || e.metaKey) {
				this.cutSelection();
			} else {
				this.applyToSelectedObjects(this.TRANSFORM_ROTATE, this.shiftDown ? 10 : 1);
				this.storeUndoMovement();
			}

		} else if (e.keyCode == 90) { // z
			if (e.ctrlKey || e.metaKey) {
				this.undoMove(true);
			} else {
				this.applyToSelectedObjects(this.TRANSFORM_ROTATE, this.shiftDown ? -10 : -1);
				this.storeUndoMovement();
			}
		} else if (e.keyCode == 46) { //delete
			this.deleteSelection();
		} else if (e.keyCode == 16) { //shift
			this.shiftDown = true;
			//this.mouseTransformType = this.mouseTransformType_Rotation;
		} else if (e.keyCode == 32) { //space
			this.spaceDown = true;
		} else if (e.keyCode == 18) { // alt
			this.altDown = true;
		} else if (e.keyCode == 187) { // +
			//zoomin
			this.zoom({
				x: this.mousePosWorld.x * this.PTM,
				y: this.mousePosWorld.y * this.PTM
			}, true);
		} else if (e.keyCode == 189) { // -
			//zoomout
			this.zoom({
				x: this.mousePosWorld.x * this.PTM,
				y: this.mousePosWorld.y * this.PTM
			}, false);
		} else if (e.keyCode == 112) { // F1
			if (this.assetGUI == undefined) {
				this.initGuiAssetSelection();
			} else {
				this.removeGuiAssetSelection();
			}
			e.preventDefault();
		} else if (e.keyCode == 38) { // up arrow
			if (e.ctrlKey || e.metaKey) {
				this.applyToSelectedObjects(this.TRANSFORM_DEPTH, true);
				this.storeUndoMovement();

			} else {
				this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
					x: 0,
					y: this.shiftDown ? -10 : -1
				});
				this.storeUndoMovement();
			}
		} else if (e.keyCode == 40) { // down arrow
			if (e.ctrlKey || e.metaKey) {
				this.applyToSelectedObjects(this.TRANSFORM_DEPTH, false);
				this.storeUndoMovement();

			} else {
				this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
					x: 0,
					y: this.shiftDown ? 10 : 1
				});
				this.storeUndoMovement();
			}
		} else if (e.keyCode == 37) { // left arrow
			this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
				x: this.shiftDown ? -10 : -1,
				y: 0
			});
			this.storeUndoMovement();
		} else if (e.keyCode == 39) { // right arrow
			this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
				x: this.shiftDown ? 10 : 1,
				y: 0
			});
			this.storeUndoMovement();
		}
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
		for (i = this.textures.children.length - 1; i > 0; i--) {
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
		var aabb = new b2AABB;
		aabb.lowerBound = new b2Vec2(Number.MAX_VALUE, Number.MAX_VALUE);
		aabb.upperBound = new b2Vec2(-Number.MAX_VALUE, -Number.MAX_VALUE);
		var i;
		var j;
		var body;
		var fixture;

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

		for (i = 0; i < computeBodies.length; i++) {
			body = computeBodies[i];
			fixture = body.GetFixtureList();
			while (fixture != null) {
				aabb.Combine1(fixture.GetAABB(0));
				fixture = fixture.GetNext();
			}
		}


		for (i = 0; i < computeTextures.length; i++) {
			var sprite = computeTextures[i];

			if (sprite.myBody) {
				fixture = sprite.myBody.GetFixtureList();
				while (fixture != null) {
					aabb.Combine1(fixture.GetAABB(0));
					fixture = fixture.GetNext();
				}
			}
			/*else if (sprite.data instanceof this.textureObject || sprite.data instanceof this.jointObject) {
				//sprite.calculateBounds()

				//sprite = sprite.getLocalBounds();
				// var bounds = sprite.getLocalBounds();
				// var spriteAABB = new b2AABB;
				// spriteAABB.lowerBound = new b2Vec2((sprite.position.x - (bounds.width / 2) * sprite.scale.x) / this.PTM, (sprite.position.y - (bounds.height / 2) * sprite.scale.x) / this.PTM);
				// spriteAABB.upperBound = new b2Vec2((sprite.position.x + (bounds.width / 2) * sprite.scale.y) / this.PTM, (sprite.position.y + (bounds.height / 2) * sprite.scale.y) / this.PTM);
				// aabb.Combine(aabb, spriteAABB);
				var bounds = sprite.getBounds(true);
				var spriteAABB = new b2AABB;
				var posX = bounds.x / this.container.scale.x - this.container.x / this.container.scale.x;
				var posY = bounds.y / this.container.scale.y - this.container.y / this.container.scale.y;
				spriteAABB.lowerBound = new b2Vec2(posX / this.PTM, posY / this.PTM);
				spriteAABB.upperBound = new b2Vec2((posX + bounds.width / this.container.scale.x) / this.PTM, (posY + bounds.height / this.container.scale.y) / this.PTM);
				aabb.Combine(aabb, spriteAABB);
			} */
			else {
				var bounds = sprite.getBounds();
				var spriteAABB = new b2AABB;
				var posX = bounds.x / this.container.scale.x - this.container.x / this.container.scale.x;
				var posY = bounds.y / this.container.scale.y - this.container.y / this.container.scale.y;
				spriteAABB.lowerBound = new b2Vec2(posX / this.PTM, posY / this.PTM);
				spriteAABB.upperBound = new b2Vec2((posX + bounds.width / this.container.scale.x) / this.PTM, (posY + bounds.height / this.container.scale.y) / this.PTM);
				aabb.Combine1(spriteAABB);
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
			if (this.selectedPhysicsBodies[i].mySprite.data.radius) {
				this.debugGraphics.drawDashedCircle(this.selectedPhysicsBodies[i].mySprite.data.radius * this.container.scale.x, this.selectedPhysicsBodies[i].mySprite.x * this.container.scale.x + this.container.x, this.selectedPhysicsBodies[i].mySprite.y * this.container.scale.y + this.container.y, this.selectedPhysicsBodies[i].mySprite.rotation, 20, 10, offset);
			} else {
				var polygons = [];
				for (var j = 0; j < this.selectedPhysicsBodies[i].mySprite.data.vertices.length; j++) polygons.push({
					x: (this.selectedPhysicsBodies[i].mySprite.data.vertices[j].x * this.PTM) * this.container.scale.x,
					y: (this.selectedPhysicsBodies[i].mySprite.data.vertices[j].y * this.PTM) * this.container.scale.y
				});
				this.debugGraphics.drawDashedPolygon(polygons, this.selectedPhysicsBodies[i].mySprite.x * this.container.scale.x + this.container.x, this.selectedPhysicsBodies[i].mySprite.y * this.container.scale.y + this.container.y, this.selectedPhysicsBodies[i].mySprite.rotation, 20, 10, offset);
			}
		}

		this.drawDebugJointHelpers();
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
	this.doEditorGUI = function () {
		if (this.editorGUI != undefined && this.editorGUI.editData) {
			var controller;
			var controllers = [];
			var body;
			var sprite;
			var j;
			controllers = controllers.concat(this.editorGUI.__controllers);

			for (var propt in this.editorGUI.__folders) {
				controllers = controllers.concat(this.editorGUI.__folders[propt].__controllers);
			}

			var i;
			for (i in controllers) {
				controller = controllers[i]

				if (controller.humanUpdate) {
					controller.humanUpdate = false;
					if (controller.property == "typeName") {
						if (this.selectedTool == this.tool_JOINTS) {
							var oldData = this.editorGUI.editData;
							if (controller.targetValue == "Pin") {
								oldData.jointType = this.jointObject_TYPE_PIN;
							} else if (controller.targetValue == "Slide") {
								oldData.jointType = this.jointObject_TYPE_SLIDE;
							} else if (controller.targetValue == "Distance") {
								oldData.jointType = this.jointObject_TYPE_DISTANCE;
							} else if (controller.targetValue == "Rope") {
								oldData.jointType = this.jointObject_TYPE_ROPE;
							}
							this.destroyEditorGUI();
							this.buildEditorGUI();
							this.editorGUI.editData = oldData;
							this.editorGUI.addFolder('add joints');
							this.addJointGUI(oldData);
							if (this.editorGUI) this.registerDragWindow(this.editorGUI.domElement);
						} else {
							//joint
							if (controller.targetValue == "Pin") {
								this.selectedTextures[0].data.jointType = this.jointObject_TYPE_PIN;
							} else if (controller.targetValue == "Slide") {
								this.selectedTextures[0].data.jointType = this.jointObject_TYPE_SLIDE;
							} else if (controller.targetValue == "Distance") {
								this.selectedTextures[0].data.jointType = this.jointObject_TYPE_DISTANCE;
							} else if (controller.targetValue == "Rope") {
								this.selectedTextures[0].data.jointType = this.jointObject_TYPE_ROPE;
							}
							this.updateSelection();
						}
					} else if (controller.property == "x") {
						//bodies & sprites & prefabs

						this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
							x: controller.targetValue,
							y: 0
						});
						this.storeUndoMovement();

					} else if (controller.property == "y") {
						//bodies & sprites & prefabs

						this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
							x: 0,
							y: controller.targetValue
						});
						this.storeUndoMovement();

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
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.SetAngle(controller.targetValue * this.DEG2RAD);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.rotation = controller.targetValue * this.DEG2RAD;
						}
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
							this.updateBodyTileSprite(body);
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
							body.mySprite.data.colorFill = controller.targetValue.toString();
							var fixture = body.GetFixtureList();
							if (body.mySprite.data.radius) this.updateCircleShape(body.originalGraphic, body.mySprite.data.radius, {
								x: 0,
								y: 0
							}, body.mySprite.data.colorFill, body.mySprite.data.colorLine, body.mySprite.data.transparancy);
							else this.updatePolyShape(body.originalGraphic, fixture.GetShape(), body.mySprite.data.colorFill, body.mySprite.data.colorLine, body.mySprite.data.transparancy);

						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.colorFill = controller.targetValue.toString();
							if (sprite.data.radius) this.updateCircleShape(sprite, sprite.data.radius, {
								x: 0,
								y: 0
							}, sprite.data.colorFill, sprite.data.colorLine, sprite.data.transparancy);
							else this.updatePolyGraphic(sprite, sprite.data.vertices, sprite.data.colorFill, sprite.data.colorLine, sprite.data.transparancy);
						}
					} else if (controller.property == "colorLine") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.colorLine = controller.targetValue.toString();
							var fixture = body.GetFixtureList();
							if (body.mySprite.data.radius) this.updateCircleShape(body.originalGraphic, body.mySprite.data.radius, {
								x: 0,
								y: 0
							}, body.mySprite.data.colorFill, body.mySprite.data.colorLine, body.mySprite.data.transparancy);
							else this.updatePolyShape(body.originalGraphic, fixture.GetShape(), body.mySprite.data.colorFill, body.mySprite.data.colorLine, body.mySprite.data.transparancy);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.colorLine = controller.targetValue.toString();
							if (sprite.data.radius) this.updateCircleShape(sprite, sprite.data.radius, {
								x: 0,
								y: 0
							}, sprite.data.colorFill, sprite.data.colorLine, sprite.data.transparancy);
							else this.updatePolyGraphic(sprite, sprite.data.vertices, sprite.data.colorFill, sprite.data.colorLine, sprite.data.transparancy);
						}
					} else if (controller.property == "transparancy") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.transparancy = controller.targetValue;
							var fixture = body.GetFixtureList();
							if (body.mySprite.data.transparancy == 0) body.originalGraphic.visible = false;
							else body.originalGraphic.visible = true;
							if (body.mySprite.data.radius) this.updateCircleShape(body.originalGraphic, body.mySprite.data.radius, {
								x: 0,
								y: 0
							}, body.mySprite.data.colorFill, body.mySprite.data.colorLine, body.mySprite.data.transparancy);
							else this.updatePolyShape(body.originalGraphic, fixture.GetShape(), body.mySprite.data.colorFill, body.mySprite.data.colorLine, body.mySprite.data.transparancy);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.transparancy = controller.targetValue.toString();
							if (sprite.data.radius) this.updateCircleShape(sprite, sprite.data.radius, {
								x: 0,
								y: 0
							}, sprite.data.colorFill, sprite.data.colorLine, sprite.data.transparancy);
							else this.updatePolyGraphic(sprite, sprite.data.vertices, sprite.data.colorFill, sprite.data.colorLine, sprite.data.transparancy);
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
					} else if (controller.property == "density") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.density = controller.targetValue;
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
					} else {
						//TODO: Its not part of the standard list, so probably a custom list. Lets check which prefab is connected and try to set somthing there
						var prefabKeys = Object.keys(this.selectedPrefabs);
						if (prefabKeys.length > 0) {
							this.prefabs[prefabKeys[0]].class.set(controller.property, controller.targetValue);
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

			if (this.editorGUI.editData.type == this.object_BODY) {
				syncObject = this.selectedPhysicsBodies[0];
			} else if (this.editorGUI.editData.type == this.object_TEXTURE || this.editorGUI.editData.type == this.object_JOINT || this.editorGUI.editData.type == this.object_GRAPHIC) {
				syncObject = this.selectedTextures[0];
			} else if (this.editorGUI.editData.type == this.object_PREFAB) {
				var key = Object.keys(this.selectedPrefabs)[0];
				syncObject = this.prefabs[key];
			} else if (this.editorGUI.editData.type == this.object_MULTIPLE) {
				if (this.selectedTextures.length > 0) syncObject = this.selectedTextures[0];
				else if (this.selectedPhysicsBodies.length > 0) syncObject = this.selectedPhysicsBodies[0];
				else syncObject = this.prefabs[key];
			}
			if (syncObject) {
				if (syncObject.mySprite) {
					var pos = syncObject.GetPosition();
					this.editorGUI.editData.x = pos.x * this.PTM;
					this.editorGUI.editData.y = pos.y * this.PTM;
					this.editorGUI.editData.rotation = syncObject.GetAngle() * this.RAD2DEG;
				} else {
					this.editorGUI.editData.x = syncObject.x;
					this.editorGUI.editData.y = syncObject.y;
					this.editorGUI.editData.rotation = syncObject.rotation;
				}
			}

			//new sync for mouse movements
			var i;
			for (i in controllers) {
				controller = controllers[i];
				if (controller.property == "x") {
					controller.initialValue = this.editorGUI.editData.x;
				} else if (controller.property == "y") {
					controller.initialValue = this.editorGUI.editData.y;
				}
			}
		}
	}

	this.correctedDrawVerticePosition;
	this.correctDrawVertice = false;
	this.closeDrawing = false;
	this.activeVertices = [];

	this.verticesLineColor = 0x000000;
	this.verticesFillColor = 0x000000;
	this.verticesFirstFillColor = 0xFFFF00;
	this.verticesDoneFillColor = 0x00FF00;
	this.verticesBulletRadius = 5;

	this.doVerticesDrawing = function (convex) {
		this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);

		var i = 0;
		var newVertice;
		var activeVertice;
		var previousVertice;

		this.closeDrawing = false;

		if (this.activeVertices.length > 0) {
			newVertice = {
				x: this.mousePosWorld.x,
				y: this.mousePosWorld.y
			}
			activeVertice = this.activeVertices[this.activeVertices.length - 1];

			if (this.activeVertices.length > 1 && convex) {

				previousVertice = this.activeVertices[this.activeVertices.length - 2];
				// compare mouse base angle with mouse previous angle
				var difference1 = {
					x: newVertice.x - previousVertice.x,
					y: newVertice.y - previousVertice.y
				};
				var angle1 = Math.atan2(difference1.y, difference1.x) * this.RAD2DEG;

				var difference2 = {
					x: activeVertice.x - previousVertice.x,
					y: activeVertice.y - previousVertice.y
				};
				var angle2 = Math.atan2(difference2.y, difference2.x) * this.RAD2DEG;

				var d = Math.abs(angle1 - angle2) % 360;
				var r = d > 180 ? 360 - d : d;
				var sign = (angle1 - angle2 >= 0 && angle1 - angle2 <= 180) || (angle1 - angle2 <= -180 && angle1 - angle2 >= -360) ? 1 : -1;

				var angleDirection = r * sign;
				//now we know the angle direction

				// lets see now compared to our first vertice
				var difference3 = {
					x: newVertice.x - activeVertice.x,
					y: newVertice.y - activeVertice.y
				};
				var angle3 = Math.atan2(difference3.y, difference3.x) * this.RAD2DEG;

				var difference4 = {
					x: this.activeVertices[0].x - activeVertice.x,
					y: this.activeVertices[0].y - activeVertice.y
				};
				var angle4 = Math.atan2(difference4.y, difference4.x) * this.RAD2DEG;

				d = Math.abs(angle3 - angle4) % 360;
				r = d > 180 ? 360 - d : d;
				sign = (angle3 - angle4 >= 0 && angle3 - angle4 <= 180) || (angle3 - angle4 <= -180 && angle3 - angle4 >= -360) ? 1 : -1;

				var angleToBaseDirection = r * sign;

				this.correctDrawVertice = false;
				if (angleDirection >= 0) {

					//angle going in wrong direction
					this.debugGraphics.lineStyle(1, 0xFF0000, 1);

					var hypLength = Math.sqrt(difference3.x * difference3.x + difference3.y * difference3.y);
					var tarAdjucentLengthExtension = Math.cos((angle3 - angle2) * this.DEG2RAD) * hypLength;
					var tarAdjucentLength = Math.sqrt(difference2.x * difference2.x + difference2.y * difference2.y) + tarAdjucentLengthExtension;

					newVertice = {
						x: previousVertice.x + tarAdjucentLength * Math.cos(angle2 * this.DEG2RAD),
						y: previousVertice.y + tarAdjucentLength * Math.sin(angle2 * this.DEG2RAD)
					};
					this.correctedDrawVerticePosition = newVertice;
					this.correctDrawVertice = true;

				}
				//calculate if we can still close
				if (this.activeVertices.length > 2) {

					if (angleDirection < 0 && angleToBaseDirection <= 0) {
						this.debugGraphics.lineStyle(1, 0xFFFF00, 1);
						this.closeDrawing = true;
					}

					var ccw = function (A, B, C) {
						return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x)
					};
					var intersect = function (A, B, C, D) {
						return ccw(A, C, D) != ccw(B, C, D) && ccw(A, B, C) != ccw(A, B, D)
					};

					var checkBaseSegmentNextVertice = this.activeVertices[1];
					var checkBaseSegmentVertice = this.activeVertices[0];
					var checkBaseAngle = Math.atan2(checkBaseSegmentNextVertice.y - checkBaseSegmentVertice.y, checkBaseSegmentNextVertice.x - checkBaseSegmentVertice.x);
					var imaginaryDistance = 10000;
					var imaginaryVerticeOnBaseSegment = {
						x: checkBaseSegmentVertice.x - imaginaryDistance * Math.cos(checkBaseAngle),
						y: checkBaseSegmentVertice.y - imaginaryDistance * Math.sin(checkBaseAngle)
					};

					//this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(newVertice).x, this.getPIXIPointFromWorldPoint(newVertice).y);
					//this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(imaginaryVerticeOnBaseSegment).x, this.getPIXIPointFromWorldPoint(imaginaryVerticeOnBaseSegment).y);

					if (intersect(checkBaseSegmentNextVertice, imaginaryVerticeOnBaseSegment, newVertice, activeVertice)) {
						this.debugGraphics.lineStyle(1, 0xFF00FF, 1);
						this.closeDrawing = true;
					}
				}
			} else if (this.activeVertices.length > 1 && !convex) {
				var firstVertice = this.activeVertices[0];
				var disX = newVertice.x - firstVertice.x;
				var disY = newVertice.y - firstVertice.y;
				var dis = Math.sqrt(disX * disX + disY * disY);
				const graphicClosingMargin = 1 / this.container.scale.x;
				if (dis <= graphicClosingMargin) {
					this.closeDrawing = true;
					newVertice = firstVertice;
				}
			}
			if (this.closeDrawing) this.debugGraphics.beginFill(this.verticesDoneFillColor, 0.5);
			else this.debugGraphics.beginFill(this.verticesFillColor, 0.5);

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(newVertice).x * this.container.scale.x + this.container.x + this.verticesBulletRadius, this.getPIXIPointFromWorldPoint(newVertice).y * this.container.scale.y + this.container.y);
			this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(newVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(newVertice).y * this.container.scale.y + this.container.y, this.verticesBulletRadius, 0, 2 * Math.PI, false);

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(newVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(newVertice).y * this.container.scale.y + this.container.y);
			this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
			this.debugGraphics.endFill();
		}
		previousVertice = null;


		for (i = 0; i < this.activeVertices.length; i++) {

			if (i == 0) this.debugGraphics.beginFill(this.verticesFirstFillColor, 0.5);
			else this.debugGraphics.beginFill(this.verticesFillColor, 0.5);

			activeVertice = this.activeVertices[i];

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x + this.verticesBulletRadius, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
			this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y, this.verticesBulletRadius, 0, 2 * Math.PI, false);

			if (i > 0) previousVertice = this.activeVertices[i - 1];

			if (previousVertice) {
				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(previousVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(previousVertice).y * this.container.scale.y + this.container.y);
			}
			this.debugGraphics.endFill();
		}
	}
	this.doGeometryDrawing = function () {
		if (this.mouseDown && !this.spaceCameraDrag) {
			this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);
			this.debugGraphics.beginFill(this.verticesFillColor, 0.5);

			if (this.editorGUI.editData.shape == "Circle") {
				var radius = new b2Vec2(this.mousePosWorld.x - this.startSelectionPoint.x, this.mousePosWorld.y - this.startSelectionPoint.y).Length() * this.PTM;
				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(this.startSelectionPoint).x * this.container.scale.x + this.container.x + radius, this.getPIXIPointFromWorldPoint(this.startSelectionPoint).y * this.container.scale.y + this.container.y);
				this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(this.startSelectionPoint).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(this.startSelectionPoint).y * this.container.scale.y + this.container.y, radius, 0, 2 * Math.PI, false);
			} else if (this.editorGUI.editData.shape == "Box") {
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
			} else if (this.editorGUI.editData.shape == "Triangle") {
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
		console.log("Trigger Target selection");
		console.log(this.retrieveHighestSelectedObject(this.mousePosWorld, this.mousePosWorld));
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
	this.createGraphicObjectFromVerts = function (verts) {
		var graphicObject = new this.graphicObject;
		for (var i = 0; i < verts.length; i++) {
			verts[i].x = verts[i].x * this.PTM;
			verts[i].y = verts[i].y * this.PTM;
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
				y: verts[i].y - centerPoint.y
			};
		}
		return [verts, centerPoint];
	}
	this.convertSelectedGraphicsToBodies = function () {
		var graphic;
		var body;
		var bodiesCreated = [];
		for (var i = 0; i < this.selectedTextures.length; i++) {
			graphic = this.selectedTextures[i];

			var verts = graphic.data.vertices;
			for (var j = 0; j < verts.length; j++) {
				verts[j].x /= this.PTM;
				verts[j].y /= this.PTM;
			}

			this.updateObject(graphic, graphic.data);
			var bodyObject = this.createBodyObjectFromVerts(verts);

			if (bodyObject) {
				bodyObject.colorFill = graphic.data.colorFill;
				bodyObject.colorLine = graphic.data.colorLine;
				bodyObject.transparancy = graphic.data.transparancy;
				bodyObject.radius = graphic.data.radius;
				bodyObject.x = graphic.data.x / this.PTM;
				bodyObject.y = graphic.data.y / this.PTM;
				bodyObject.rotation = graphic.data.rotation;
				body = this.buildBodyFromObj(bodyObject);
			}
			if (body) {
				body.mySprite.parent.swapChildren(graphic, body.mySprite);
				bodiesCreated.push(body);
			}
		}
		this.deleteSelection();
		this.selectedPhysicsBodies = bodiesCreated;
		this.updateSelection();
	}
	this.convertSelectedBodiesToGraphics = function () {
		var body;
		var graphic;
		var graphicsCreated = [];
		for (var i = 0; i < this.selectedPhysicsBodies.length; i++) {
			body = this.selectedPhysicsBodies[i];
			var verts = (body.mySprite.data.vertices[0] instanceof Array) ? body.mySprite.data.vertices : [body.mySprite.data.vertices];
			var colorFill = (body.mySprite.data.colorFill instanceof Array) ? body.mySprite.data.colorFill : [body.mySprite.data.colorFill];
			var colorLine = (body.mySprite.data.colorLine instanceof Array) ? body.mySprite.data.colorLine : [body.mySprite.data.colorLine];
			var transparancy = (body.mySprite.data.transparancy instanceof Array) ? body.mySprite.data.transparancy : [body.mySprite.data.transparancy];
			var radius = (body.mySprite.data.radius instanceof Array) ? body.mySprite.data.radius : [body.mySprite.data.radius];

			this.updateObject(body.mySprite, body.mySprite.data);

			var graphics = [];

			for (var j = 0; j < verts.length; j++) {
				var graphicObject;
				if (radius[j]) {
					graphicObject = new this.graphicObject();
					graphicObject.vertices = verts[j];
				} else {
					graphicObject = this.createGraphicObjectFromVerts(verts[j]);
				}
				graphicObject.colorFill = colorFill[j];
				graphicObject.colorLine = colorLine[j];
				graphicObject.transparancy = transparancy[j];
				graphicObject.radius = radius[j];

				graphicObject.x += body.mySprite.data.x * this.PTM;
				graphicObject.y += body.mySprite.data.y * this.PTM;
				graphicObject.rotation = body.mySprite.data.rotation;
				graphic = this.buildGraphicFromObj(graphicObject);
				if (graphic) {
					graphics.push(graphic);
				}
			}
			if (graphics.length > 1) graphic = this.groupGraphicObjects(graphics);

			if (graphic) {
				graphic.parent.swapChildren(body.mySprite, graphic);
				graphicsCreated.push(graphic);
			}

		}
		this.deleteSelection();
		this.selectedTextures = graphicsCreated;
		this.updateSelection();
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
					var instanceID = this.prefabs[data.prefabInstanceName].instanceID;
					var key = prefabName + "_" + instanceID;
					if (!this.prefabs[key]) {
						var newPrefabObj = new this.prefabObject();
						newPrefabObj.prefabName = prefabName;
						newPrefabObj.instanceID = instanceID;
						createdPrefabObject = newPrefabObj;
						newPrefabObj.key = key;
						this.prefabs[key] = newPrefabObj;
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
		if (createdPrefabObject) createdPrefabObject.class = new prefab.prefabs[className].class(createdPrefabObject);
	}
	this.removeObjectFromLookupGroups = function (obj, data) {
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
					if (this.prefabs[key] && this.lookupGroups[key]._bodies.length + this.lookupGroups[key]._textures.length + this.lookupGroups[key]._joints.length == 1) {
						delete this.prefabs[key];
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
				var tarArray;
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

		var color = obj.tint;
		color = color.slice(1);
		container.originalSprite.tint = parseInt(color, 16);

		if (container.data.bodyID != undefined) {
			var body = this.textures.getChildAt(container.data.bodyID).myBody;
			this.setTextureToBody(body, container, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}
		//handle groups and ref names
		this.addObjectToLookupGroups(container, container.data);

		return container;
	}
	this.buildTriggerFromObj = function (obj) {
		var bodyObject = JSON.parse(JSON.stringify(obj));
		bodyObject.fixed = true;
		bodyObject.density = 1;
		bodyObject.colorFill = '#FFFFFF';
		bodyObject.colorLine = '#FFFFFF';
		bodyObject.transparancy = 0.2;
		bodyObject.collision = 2;

		var body = this.buildBodyFromObj(bodyObject);
		this.removeObjectFromLookupGroups(body, body.mySprite.data);

		body.mySprite.data = obj;
		this.addObjectToLookupGroups(body, body.mySprite.data);
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

		//build fixtures
		var fixtureArray = obj.vertices;
		if (obj.vertices[0] instanceof Array == false) {
			fixtureArray = [];
			fixtureArray[0] = obj.vertices;
		}
		var fixDef;
		var fixture;
		for (var i = 0; i < fixtureArray.length; i++) {
			fixDef = new b2FixtureDef;
			fixDef.density = obj.density instanceof Array ? obj.density[i] : obj.density;
			fixDef.friction = 2000;
			fixDef.restitution = 0.001;
			var radius = obj.radius instanceof Array ? obj.radius[i] : obj.radius;
			if (!radius) {
				var vert;
				var b2Vec2Arr = [];
				var vertices = obj.vertices[0] instanceof Array ? obj.vertices[i] : obj.vertices;
				for (var j = 0; j < vertices.length; j++) {
					vert = vertices[j];
					b2Vec2Arr.push(new b2Vec2(vert.x, vert.y));
				}

				fixDef.shape = new b2PolygonShape;
				fixDef.shape.SetAsArray(b2Vec2Arr, b2Vec2Arr.length);
			} else {
				fixDef.shape = new b2CircleShape;
				if (obj.radius instanceof Array) {
					fixDef.shape.SetLocalPosition(new b2Vec2(obj.vertices[i][0].x, obj.vertices[i][0].y));
				} else fixDef.shape.SetLocalPosition(new b2Vec2(0, 0));
				fixDef.shape.SetRadius(radius / this.PTM);
			}
			fixture = body.CreateFixture(fixDef);

			var colorFill = obj.colorFill instanceof Array ? obj.colorFill[i] : obj.colorFill;
			var colorLine = obj.colorLine instanceof Array ? obj.colorLine[i] : obj.colorLine;
			var transparancy = obj.transparancy instanceof Array ? obj.transparancy[i] : obj.transparancy;
			if (!radius) this.updatePolyShape(body.originalGraphic, fixDef.shape, colorFill, colorLine, transparancy, (i != 0));
			else this.updateCircleShape(body.originalGraphic, radius, fixDef.shape.GetLocalPosition(), colorFill, colorLine, transparancy, (i != 0));
		}

		body.SetPositionAndAngle(new b2Vec2(obj.x, obj.y), 0);
		body.SetAngle(obj.rotation);


		body.mySprite = new PIXI.Sprite();
		this.textures.addChild(body.mySprite);

		body.mySprite.addChild(body.originalGraphic);

		body.mySprite.myBody = body;
		body.mySprite.data = obj;

		if (obj.tileTexture) this.updateBodyTileSprite(body);

		this.setBodyCollision(body, obj.collision);

		this.addObjectToLookupGroups(body, body.mySprite.data);

		return body;

	}
	this.buildGraphicFromObj = function (obj) {
		var graphic = new PIXI.Graphics();
		graphic.data = obj;
		graphic.x = obj.x;
		graphic.y = obj.y;
		graphic.rotation = obj.rotation;

		if (!obj.radius) this.updatePolyGraphic(graphic, obj.vertices, obj.colorFill, obj.colorLine, obj.transparancy);
		else this.updateCircleShape(graphic, obj.radius, obj.vertices[0], obj.colorFill, obj.colorLine, obj.transparancy);

		this.textures.addChild(graphic);

		if (graphic.data.bodyID != undefined) {
			var body = this.textures.getChildAt(graphic.data.bodyID).myBody;
			this.setTextureToBody(body, graphic, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}

		//if (obj.tileTexture) this.updateBodyTileSprite(body);

		this.addObjectToLookupGroups(graphic, graphic.data);
		return graphic;

	}
	this.buildGraphicGroupFromObj = function (obj) {
		var graphic = new PIXI.Container();
		graphic.data = obj;
		graphic.x = obj.x;
		graphic.y = obj.y;
		graphic.rotation = obj.rotation;

		var g;
		for (var i = 0; i < obj.graphicObjects.length; i++) {
			var gObj = this.parseArrObject(JSON.parse(obj.graphicObjects[i]));

			if (gObj instanceof this.graphicObject) {
				g = new PIXI.Graphics();
				/*for (var j = 0; j < graphicObject.vertices.length; j++) {
					graphicObject.vertices[j].x += graphicObject.x;
					graphicObject.vertices[j].y += graphicObject.y;
				}*/
				if (!gObj.radius) this.updatePolyGraphic(g, gObj.vertices, gObj.colorFill, gObj.colorLine, gObj.transparancy, true);
				else this.updateCircleShape(g, gObj.radius, gObj.vertices[0], gObj.colorFill, gObj.colorLine, gObj.transparancy, true);
			} else if (gObj instanceof this.textureObject) {
				g = new PIXI.heaven.Sprite(PIXI.Texture.fromFrame(gObj.textureName));
				g.pivot.set(g.width / 2, g.height / 2);
				g.x = gObj.x;
			}
			graphic.addChild(g);
			g.x = gObj.x;
			g.y = gObj.y;
			g.rotation = gObj.rotation;
		}
		this.textures.addChild(graphic);

		if (graphic.data.bodyID != undefined) {
			var body = this.textures.getChildAt(graphic.data.bodyID).myBody;
			this.setTextureToBody(body, graphic, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}

		this.addObjectToLookupGroups(graphic, graphic.data);
		return graphic;
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
		if (this.selectedTextures.length > 1) {
			var graphicsToGroup = [];
			for (var i = 0; i < this.selectedTextures.length; i++) {
				if (this.selectedTextures[i].data instanceof this.graphicObject) {
					graphicsToGroup.push(this.selectedTextures[i]);
				} else if (this.selectedTextures[i].data instanceof this.graphicGroup) {
					graphicsToGroup = graphicsToGroup.concat(this.ungroupGraphicObjects(this.selectedTextures[i]));
				}
			}
			combinedGraphics = this.groupGraphicObjects(graphicsToGroup);
		} else if (this.selectedTextures.length == 1) {
			combinedGraphics = this.selectedTextures[0];
		}
		if (this.selectedPhysicsBodies.length > 1) {
			combinedBodies = this.groupBodyObjects(this.selectedPhysicsBodies);
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
			this.ungroupBodyObjects(this.selectedPhysicsBodies[0]);
		}
		if (this.selectedTextures.length == 1) {
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
		groupedBodyObject.transparancy = [];
		groupedBodyObject.radius = [];

		var i;
		for (i = 0; i < bodyObjects.length; i++) {
			this.updateObject(bodyObjects[i].mySprite, bodyObjects[i].mySprite.data);
		}
		groupedBodyObject.x = bodyObjects[0].mySprite.data.x;
		groupedBodyObject.y = bodyObjects[0].mySprite.data.y;
		groupedBodyObject.rotation = bodyObjects[0].mySprite.data.rotation;

		for (i = 0; i < bodyObjects.length; i++) {
			if ((bodyObjects[i].mySprite.data.vertices[0] instanceof Array) || (bodyObjects[i].mySprite.data.radius instanceof Array)) {
				var vertices = [];
				for (var j = 0; j < bodyObjects[i].mySprite.data.vertices.length; j++) {
					var verts = [];
					for (var k = 0; k < bodyObjects[i].mySprite.data.vertices[j].length; k++) {
						var ox = bodyObjects[i].mySprite.data.x - bodyObjects[0].mySprite.data.x;
						var oy = bodyObjects[i].mySprite.data.y - bodyObjects[0].mySprite.data.y;

						var a = bodyObjects[0].mySprite.data.rotation;
						var atanO = Math.atan2(oy, ox);
						var sqrtO = Math.sqrt(ox * ox + oy * oy);

						ox = sqrtO * Math.cos(-a + atanO);
						oy = sqrtO * Math.sin(-a + atanO);

						var p = {
							x: bodyObjects[i].mySprite.data.vertices[j][k].x,
							y: bodyObjects[i].mySprite.data.vertices[j][k].y
						};
						var cosAngle = Math.cos(bodyObjects[i].mySprite.data.rotation - a);
						var sinAngle = Math.sin(bodyObjects[i].mySprite.data.rotation - a);
						var dx = p.x;
						var dy = p.y;
						p.x = (dx * cosAngle - dy * sinAngle);
						p.y = (dx * sinAngle + dy * cosAngle);

						verts.push({
							x: p.x + ox,
							y: p.y + oy
						});
					}
					vertices.push(verts);
				}
				groupedBodyObject.vertices = groupedBodyObject.vertices.concat(vertices);
				groupedBodyObject.radius = groupedBodyObject.radius.concat(bodyObjects[i].mySprite.data.radius)
				groupedBodyObject.colorFill = groupedBodyObject.colorFill.concat(bodyObjects[i].mySprite.data.colorFill);
				groupedBodyObject.colorLine = groupedBodyObject.colorLine.concat(bodyObjects[i].mySprite.data.colorLine);
				groupedBodyObject.transparancy = groupedBodyObject.transparancy.concat(bodyObjects[i].mySprite.data.transparancy);
			} else {
				var verts = [];
				var ox = bodyObjects[i].mySprite.data.x - bodyObjects[0].mySprite.data.x;
				var oy = bodyObjects[i].mySprite.data.y - bodyObjects[0].mySprite.data.y;
				var a = bodyObjects[0].mySprite.data.rotation;
				var atanO = Math.atan2(oy, ox);
				var sqrtO = Math.sqrt(ox * ox + oy * oy);

				ox = sqrtO * Math.cos(-a + atanO);
				oy = sqrtO * Math.sin(-a + atanO);
				if (i == 0) {
					verts = bodyObjects[i].mySprite.data.vertices;
				} else {
					for (var j = 0; j < bodyObjects[i].mySprite.data.vertices.length; j++) {
						var p = {
							x: bodyObjects[i].mySprite.data.vertices[j].x,
							y: bodyObjects[i].mySprite.data.vertices[j].y
						};
						var cosAngle = Math.cos(bodyObjects[i].mySprite.data.rotation - a);
						var sinAngle = Math.sin(bodyObjects[i].mySprite.data.rotation - a);
						var dx = p.x;
						var dy = p.y;
						p.x = (dx * cosAngle - dy * sinAngle);
						p.y = (dx * sinAngle + dy * cosAngle);

						verts.push({
							x: p.x + ox,
							y: p.y + oy
						});
					}
				}
				// TODO: Rotate arround groupedBodyObjectRotation
				if (bodyObjects[i].mySprite.data.radius) {
					var dx = bodyObjects[i].mySprite.x - bodyObjects[0].mySprite.x;
					var dy = bodyObjects[i].mySprite.y - bodyObjects[0].mySprite.y;
					groupedBodyObject.vertices.push([{
						x: ox,
						y: oy
					}]);
				} else groupedBodyObject.vertices.push(verts);

				groupedBodyObject.radius.push(bodyObjects[i].mySprite.data.radius);
				groupedBodyObject.colorFill.push(bodyObjects[i].mySprite.data.colorFill);
				groupedBodyObject.colorLine.push(bodyObjects[i].mySprite.data.colorLine);
				groupedBodyObject.transparancy.push(bodyObjects[i].mySprite.data.transparancy);
			}
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

		var verts = (bodyGroup.mySprite.data.vertices[0] instanceof Array) ? bodyGroup.mySprite.data.vertices : [bodyGroup.mySprite.data.vertices];
		var colorFill = (bodyGroup.mySprite.data.colorFill instanceof Array) ? bodyGroup.mySprite.data.colorFill : [bodyGroup.mySprite.data.colorFill];
		var colorLine = (bodyGroup.mySprite.data.colorLine instanceof Array) ? bodyGroup.mySprite.data.colorLine : [bodyGroup.mySprite.data.colorLine];
		var transparancy = (bodyGroup.mySprite.data.transparancy instanceof Array) ? bodyGroup.mySprite.data.transparancy : [bodyGroup.mySprite.data.transparancy];
		var radius = (bodyGroup.mySprite.data.radius instanceof Array) ? bodyGroup.mySprite.data.radius : [bodyGroup.mySprite.data.radius];

		for (var i = 0; i < verts.length; i++) {
			var bodyObject = new this.bodyObject;

			// var cosAngle = Math.cos(graphicGroup.rotation);
			// var sinAngle = Math.sin(graphicGroup.rotation);
			// var dx = graphicObject.x;
			// var dy = graphicObject.y;
			// graphicObject.x = (dx * cosAngle - dy * sinAngle);
			// graphicObject.y = (dx * sinAngle + dy * cosAngle);

			var centerPoint = {
				x: 0,
				y: 0
			};
			for (var j = 0; j < verts[i].length; j++) {
				centerPoint.x += verts[i][j].x;
				centerPoint.y += verts[i][j].y;
			}
			centerPoint.x = centerPoint.x / verts[i].length;
			centerPoint.y = centerPoint.y / verts[i].length;

			for (j = 0; j < verts[i].length; j++) {
				verts[i][j].x -= centerPoint.x;
				verts[i][j].y -= centerPoint.y;
			}

			var a = bodyGroup.mySprite.data.rotation;
			var atanO = Math.atan2(centerPoint.y, centerPoint.x);
			var sqrtO = Math.sqrt(centerPoint.x * centerPoint.x + centerPoint.y * centerPoint.y);

			centerPoint.x = sqrtO * Math.cos(a + atanO);
			centerPoint.y = sqrtO * Math.sin(a + atanO);

			bodyObject.x += bodyGroup.mySprite.x / this.PTM + centerPoint.x;
			bodyObject.y += bodyGroup.mySprite.y / this.PTM + centerPoint.y;
			bodyObject.rotation = bodyGroup.mySprite.rotation;
			bodyObject.vertices = verts[i];
			bodyObject.colorFill = colorFill[i];
			bodyObject.colorLine = colorLine[i];
			bodyObject.transparancy = transparancy[i];
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

		for (var i = 0; i < graphicGroup.data.graphicObjects.length; i++) {
			var graphicObject = this.parseArrObject(JSON.parse(graphicGroup.data.graphicObjects[i]));

			var cosAngle = Math.cos(graphicGroup.rotation);
			var sinAngle = Math.sin(graphicGroup.rotation);
			var dx = graphicObject.x;
			var dy = graphicObject.y;
			graphicObject.x = (dx * cosAngle - dy * sinAngle);
			graphicObject.y = (dx * sinAngle + dy * cosAngle);

			graphicObject.x += graphicGroup.x;
			graphicObject.y += graphicGroup.y;
			graphicObject.rotation = graphicGroup.rotation + graphicObject.rotation;

			var graphic = this.buildGraphicFromObj(graphicObject);

			var container = graphic.parent;
			container.removeChild(graphic);
			container.addChildAt(graphic, graphicGroup.data.ID + i);

			graphicObjects.push(graphic);
		}
		this.deleteObjects([graphicGroup]);

		return graphicObjects;
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
		var filterData = fixture.GetFilterData();


		//TODO: Set collision for all fixtures


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
		//
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


		if (tarObj.prefabInstanceName) jointGraphics.visible = false;

		this.addObjectToLookupGroups(jointGraphics, jointGraphics.data);

		this.editorIcons.push(jointGraphics);

		return jointGraphics;

	}

	this.attachJoint = function (jointPlaceHolder) {
		var bodyA = this.textures.getChildAt(jointPlaceHolder.bodyA_ID).myBody;
		var bodyB;
		if (jointPlaceHolder.bodyB_ID != null) {

			bodyB = this.textures.getChildAt(jointPlaceHolder.bodyB_ID).myBody;
		} else {
			//pin to background

			var fixDef = new b2FixtureDef;
			fixDef.density = 1.0;
			fixDef.friction = 0.5;
			fixDef.restitution = 0.2;

			var bd = new b2BodyDef();
			bd.type = Box2D.b2BodyType.b2_staticBody;
			bodyB = this.world.CreateBody(bd);
			bodyB.SetPosition(new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM));


			fixDef.shape = new b2PolygonShape;
			fixDef.shape.SetAsBox(1, 1);

			var fixture = bodyB.CreateFixture(fixDef);
			fixture.SetSensor(true);

		}
		var joint;

		if (jointPlaceHolder.jointType == this.jointObject_TYPE_PIN) {
			var revoluteJointDef = new Box2D.b2RevoluteJointDef;

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

			var axis = new b2Vec2(Math.cos(jointPlaceHolder.rotation + 90 * this.DEG2RAD), Math.sin(jointPlaceHolder.rotation + 90 * this.DEG2RAD));

			var prismaticJointDef = new Box2D.b2PrismaticJointDef;

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
			var distanceJointDef = new Box2D.b2DistanceJointDef;
			distanceJointDef.Initialize(bodyA, bodyB, new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM), new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM));
			distanceJointDef.frequencyHz = jointPlaceHolder.frequencyHz;
			distanceJointDef.dampingRatio = jointPlaceHolder.dampingRatio;

			joint = this.world.CreateJoint(distanceJointDef);
		} else if (jointPlaceHolder.jointType == this.jointObject_TYPE_ROPE) {
			var ropeJointDef = new Box2D.b2RopeJointDef;
			ropeJointDef.Initialize(bodyA, bodyB, bodyA.GetPosition(), bodyB.GetPosition());
			var xd = bodyA.GetPosition().x - bodyB.GetPosition().x;
			var yd = bodyA.GetPosition().y - bodyB.GetPosition().y;
			ropeJointDef.maxLength = Math.sqrt(xd * xd + yd * yd);

			joint = this.world.CreateJoint(ropeJointDef);
		}
		return joint;
	}

	this.buildPrefabFromObj = function (obj) {
		if (this.breakPrefabs) return this.buildJSON(JSON.parse(prefab.prefabs[obj.prefabName].json));
		var key = obj.prefabName + "_" + obj.instanceID;
		obj.key = key;
		this.prefabs[key] = obj;
		var createdBodies = this.buildJSON(JSON.parse(prefab.prefabs[obj.prefabName].json), key);
		if (obj.instanceID >= this.prefabCounter) this.prefabCounter = obj.instanceID + 1;
		obj.class = new prefab.prefabs[obj.prefabName].class(obj);

		this.applyToObjects(this.TRANSFORM_ROTATE, obj.rotation, [].concat(createdBodies._bodies, createdBodies._textures, createdBodies._joints));

		return createdBodies;
	}


	this.anchorTextureToBody = function () {
		var bodies = this.queryWorldForBodies(this.mousePosWorld, this.mousePosWorld);
		var textures = this.queryWorldForGraphics(this.mousePosWorld, this.mousePosWorld, true, 1);

		if (bodies.length > 0 && textures.length > 0) {
			// lets mold these fuckers to eachother

			var body = bodies[0];
			var texture = textures[0];


			if (!body.myTexture && !texture.myBody) {
				var dif = new b2Vec2(texture.x - body.GetPosition().x * this.PTM, texture.y - body.GetPosition().y * this.PTM);
				var angleOffset = body.GetAngle() - Math.atan2(dif.y, dif.x);
				var angle = body.GetAngle() - texture.rotation;


				if (body.mySprite.parent.getChildIndex(body.mySprite) > texture.parent.getChildIndex(texture)) {
					body.mySprite.parent.swapChildren(body.mySprite, texture);
				}

				this.updateObject(body.mySprite, body.mySprite.data);
				this.updateObject(texture, texture.data);

				this.setTextureToBody(body, texture, dif.Length(), angleOffset, angle);

			} else if (body.myTexture && texture.myBody) {
				if (body.myTexture == texture) {
					this.removeTextureFromBody(body, texture);
				}
			}

		}
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
			game.app.renderer.render(graphics, body.myMaskRT, false);
			game.app.renderer.render(drawGraphic, body.myMaskRT, false);
			body.myMask = new PIXI.heaven.Sprite(body.myMaskRT);
			body.myMask.renderable = false;

			body.myDecalSpriteRT = PIXI.RenderTexture.create(drawGraphic.width, drawGraphic.height, 1);
			body.myDecalSprite = new PIXI.heaven.Sprite(body.myDecalSpriteRT);
			body.myTexture.addChild(body.myDecalSprite);

			body.myDecalSprite.maskSprite = body.myMask;
			body.myDecalSprite.pluginName = 'spriteMasked';

			body.myTexture.addChild(body.myMask);
		}
	}
	this.addDecalToBody = function (body, worldPosition, textureName, carving) {
		if (!body.myDecalSprite) this.prepareBodyForDecals(body);

		let pixelPosition = this.getPIXIPointFromWorldPoint(worldPosition);

		let decal = new PIXI.heaven.Sprite(PIXI.Texture.fromFrame(textureName));
		decal.pivot.set(decal.width / 2, decal.height / 2);

		var localPosition = body.myTexture.toLocal(pixelPosition, body.myTexture.parent);
		decal.x = localPosition.x;
		decal.y = localPosition.y;

		game.app.renderer.render(decal, body.myDecalSpriteRT, false);

		if (carving) {
			let carveDecal = new PIXI.heaven.Sprite(PIXI.Texture.fromFrame(textureName));
			carveDecal.pivot.set(carveDecal.width / 2, carveDecal.height / 2);

			carveDecal.scale.x = 0.6;
			carveDecal.scale.y = 0.6;

			carveDecal.y = decal.y;
			carveDecal.x = decal.x;

			carveDecal.tint = 0x000000;
			carveDecal.color.dark[0] = carveDecal.color.light[0];
			carveDecal.color.dark[1] = carveDecal.color.light[1];
			carveDecal.color.dark[2] = carveDecal.color.light[2];
			carveDecal.color.invalidate();

			game.app.renderer.render(carveDecal, body.myMaskRT, false);

			body.myTexture.originalSprite.pluginName = 'spriteMasked';
			body.myTexture.originalSprite.maskSprite = body.myMask;
		}
	}
	this.updateBodyTileSprite = function (body) {

		var tileTexture = body.mySprite.data.tileTexture;

		if (tileTexture && tileTexture != "") {
			var tex;
			if (!body.myTileSprite) {

				tex = PIXI.Texture.fromImage(tileTexture);
				tex.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

				game.app.renderer.plugins.graphics.updateGraphics(body.originalGraphic);

				var verticesColor = body.originalGraphic._webGL[game.app.renderer.CONTEXT_UID].data[0].glPoints;
				var vertices = new Float32Array(verticesColor.length / 3);

				var i;
				var j = 0;
				for (i = 0; i < verticesColor.length; i += 6) {
					vertices[j] = verticesColor[i];
					vertices[j + 1] = verticesColor[i + 1];
					j += 2;
				}

				var indices = body.originalGraphic._webGL[game.app.renderer.CONTEXT_UID].data[0].glIndices;
				var uvs = new Float32Array(vertices.length);
				for (i = 0; i < vertices.length; i++) uvs[i] = vertices[i] * 2.0 / tex.width;

				var mesh = new PIXI.mesh.Mesh(tex, vertices, uvs, indices);
				body.mySprite.addChild(mesh);

				body.myTileSprite = mesh;
			} else if (tileTexture != body.myTileSprite.texture.textureCacheIds[0]) {
				tex = PIXI.Texture.fromImage(tileTexture);
				tex.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
				body.myTileSprite.texture = tex;
			}

		} else if (body.myTileSprite) {
			body.myTileSprite.mask = null;
			body.myTileSprite.parent.removeChild(body.myTileSprite);
			body.myTileSprite = undefined;
		}
	}

	this.updatePolyGraphic = function (graphic, verts, colorFill, colorLine, transparancy, dontClear) {
		var color;
		color = colorFill.slice(1);
		var colorFillHex = parseInt(color, 16);
		color = colorLine.slice(1);
		var colorLineHex = parseInt(color, 16);

		if (!dontClear) graphic.clear();
		graphic.boundsPadding = 0;

		graphic.lineStyle(1, colorLineHex, transparancy);
		graphic.beginFill(colorFillHex, transparancy);

		var count = verts.length;
		var startPoint = verts[0];

		graphic.moveTo(startPoint.x, startPoint.y);

		var i;
		var nextPoint;
		for (i = 1; i < count; i++) {
			nextPoint = verts[i];
			graphic.lineTo(nextPoint.x, nextPoint.y);
		}
		graphic.lineTo(startPoint.x, startPoint.y);
		graphic.endFill();

		return graphic;
	}
	this.updatePolyShape = function (graphic, poly, colorFill, colorLine, transparancy, dontClear) {
		var color;
		color = colorFill.slice(1);
		var colorFillHex = parseInt(color, 16);
		color = colorLine.slice(1);
		var colorLineHex = parseInt(color, 16);

		if (!dontClear) graphic.clear();
		graphic.boundsPadding = 0;

		graphic.lineStyle(1, colorLineHex, transparancy);
		graphic.beginFill(colorFillHex, transparancy);

		var count = poly.GetVertexCount();

		var vertices = poly.GetVertices();

		var startPoint = vertices[0];

		graphic.moveTo(this.getPIXIPointFromWorldPoint(startPoint).x, this.getPIXIPointFromWorldPoint(startPoint).y);

		var i;
		var nextPoint;
		for (i = 1; i < count; i++) {
			nextPoint = vertices[i];
			graphic.lineTo(this.getPIXIPointFromWorldPoint(nextPoint).x, this.getPIXIPointFromWorldPoint(nextPoint).y);
		}
		graphic.lineTo(this.getPIXIPointFromWorldPoint(startPoint).x, this.getPIXIPointFromWorldPoint(startPoint).y);
		graphic.endFill();
		graphic.originalGraphic = true;

		return graphic;
	}
	this.updateCircleShape = function (graphic, radius, pos, colorFill, colorLine, transparancy, dontClear) {
		var color;
		color = colorFill.slice(1);
		var colorFillHex = parseInt(color, 16);
		color = colorLine.slice(1);
		var colorLineHex = parseInt(color, 16);

		if (!dontClear) graphic.clear();
		graphic.boundsPadding = 0;

		graphic.lineStyle(1, colorLineHex, transparancy);
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
		var spriteData;
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
				this.worldJSON += this.stringifyObject(this.prefabs[sprite.data.prefabInstanceName]);
				stringifiedPrefabs[sprite.data.prefabInstanceName] = true;
			} else {
				this.worldJSON += this.stringifyObject(sprite.data);
			}
		}
		this.worldJSON += ']}';
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
		} else if (obj.type == this.object_TEXTURE) {
			arr[6] = obj.ID;
			arr[7] = obj.textureName;
			arr[8] = obj.bodyID;
			arr[9] = obj.texturePositionOffsetLength;
			arr[10] = obj.texturePositionOffsetAngle;
			arr[11] = obj.textureAngleOffset;
			arr[12] = obj.isCarvable;
			arr[13] = obj.tint;
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
			arr[6] = obj.instanceID
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
		} else if (arr[0] == this.object_GRAPHICGROUP) {
			arr[6] = obj.ID;
			arr[7] = obj.graphicObjects;
			arr[8] = obj.bodyID;
			arr[9] = obj.texturePositionOffsetLength;
			arr[10] = obj.texturePositionOffsetAngle;
			arr[11] = obj.textureAngleOffset;
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
		} else if (arr[0] == this.object_TEXTURE) {
			obj = new this.textureObject();
			obj.ID = arr[6];
			obj.textureName = arr[7];
			obj.bodyID = arr[8];
			obj.texturePositionOffsetLength = arr[9];
			obj.texturePositionOffsetAngle = arr[10];
			obj.textureAngleOffset = arr[11];
			obj.isCarvable = arr[12];
			obj.tint = arr[13] || '#FFFFFF';
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
			obj.upperLimit = arr[19] || obj.upperLimit;
			obj.lowerLimit = arr[20] || obj.lowerLimit;
		} else if (arr[0] == this.object_PREFAB) {
			obj = new this.prefabObject();
			obj.settings = arr[4];
			obj.prefabName = arr[5];
			obj.instanceID = arr[6];
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
		} else if (arr[0] == this.object_GRAPHICGROUP) {
			obj = new this.graphicGroup();
			obj.ID = arr[6];
			obj.graphicObjects = arr[7];
			obj.bodyID = arr[8];
			obj.texturePositionOffsetLength = arr[9];
			obj.texturePositionOffsetAngle = arr[10];
			obj.textureAngleOffset = arr[11];
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
		} else if (data.type == this.object_TEXTURE || data.type == this.object_GRAPHIC || data.type == this.object_GRAPHICGROUP) {
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
		var startPrefabIDIndex = this.prefabCounter;
		var prefabOffset = 0;

		if (json != null) {
			//clone json to not destroy old references
			var worldObjects = JSON.parse(JSON.stringify(json));

			var i;
			var obj;
			var worldObject;
			for (i = 0; i < worldObjects.objects.length; i++) {
				obj = this.parseArrObject(worldObjects.objects[i]);

				if (prefabInstanceName) {
					obj.prefabInstanceName = prefabInstanceName;

					var offsetX = this.prefabs[prefabInstanceName].x;
					var offsetY = this.prefabs[prefabInstanceName].y;

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
					obj.instanceID += startPrefabIDIndex;
					var prefabObjects = this.buildPrefabFromObj(obj);
					if (!this.breakPrefabs) {
						this.prefabs[obj.key].ID = prefabStartChildIndex;
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
				}
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
		this.prefabs = {};
		this.lookupGroups = {};

		//reset gui
		this.destroyEditorGUI();
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
				var tarPrefab = self.prefabs[body.mySprite.data.prefabInstanceName].class;
				if (tarPrefab && tarPrefab != selectedPrefab && tarPrefab.contactListener) {
					selectedPrefab = tarPrefab;
					if (secondParam) selectedPrefab.contactListener[name](contact, secondParam);
					else selectedPrefab.contactListener[name](contact);
				}
			}
			if (body.mySprite && body.mySprite.data.subPrefabInstanceName) {
				var tarPrefab = self.prefabs[body.mySprite.data.subPrefabInstanceName].class;
				if (tarPrefab && tarPrefab != selectedSubPrefab && tarPrefab.contactListener) {
					selectedSubPrefab = tarPrefab;
					if (secondParam) selectedSubPrefab.contactListener[name](contact, secondParam);
					else selectedSubPrefab.contactListener[name](contact);
				}
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
				spritesToDestroy.push(sprite);
				this.addObjectToLookupGroups(joint, sprite.data);
			} else if (sprite.data.type == this.object_BODY) {
				this.addObjectToLookupGroups(sprite.myBody, sprite.data);
			} else if (sprite.data.type == this.object_TEXTURE) {
				if (sprite.myBody == undefined) this.addObjectToLookupGroups(sprite, sprite.data);
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
		for (key in this.prefabs) {
			if (this.prefabs.hasOwnProperty(key)) {
				this.prefabs[key].class.init();
			}
		}
		this.editing = false;
	}

	this.zoom = function (pos, isZoomIn) {

		var direction = isZoomIn ? 1 : -1;
		var factor = (1 + direction * 0.1);
		this.setZoom(pos, this.container.scale.x * factor);

	}
	this.setZoom = function (pos, scale) {
		var worldPos = {
			x: (pos.x),
			y: (pos.y)
		};
		var newScale = {
			x: scale,
			y: scale
		};
		var newScreenPos = {
			x: (worldPos.x) * newScale.x + this.container.x,
			y: (worldPos.y) * newScale.y + this.container.y
		};
		this.container.x -= (newScreenPos.x - (pos.x * this.container.scale.x + this.container.x));
		this.container.y -= (newScreenPos.y - (pos.y * this.container.scale.y + this.container.y));
		this.container.scale.x = newScale.x;
		this.container.scale.y = newScale.y;

		var i;
		for (i = 0; i < this.editorIcons.length; i++) {
			this.editorIcons[i].scale.x = 1.0 / newScale.x;
			this.editorIcons[i].scale.y = 1.0 / newScale.y;
		}
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
		var prefabObject = this.prefabs[sprite.data.prefabInstanceName];
		var instanceName = sprite.data.prefabInstanceName;
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
	this.object_UNDO_MOVEMENT = 3;
	this.object_PREFAB = 4;
	this.object_MULTIPLE = 5;
	this.object_GRAPHIC = 6;
	this.object_GRAPHICGROUP = 7;
	this.object_TRIGGER = 8;

	this.jointObject_TYPE_PIN = 0;
	this.jointObject_TYPE_SLIDE = 1;
	this.jointObject_TYPE_DISTANCE = 2;
	this.jointObject_TYPE_ROPE = 3;

	this.mouseTransformType = 0;
	this.mouseTransformType_Movement = 0;
	this.mouseTransformType_Rotation = 1;

	this.DEG2RAD = 0.017453292519943296;
	this.RAD2DEG = 57.29577951308232;

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
	this.tool_ZOOM = 6;
	this.tool_MOVE = 7;
	this.tool_PAINTBUCKET = 8;
	this.tool_ERASER = 9;
	this.tool_CAMERA = 10;

	this.editorGUIWidth = 200;
	this.minimumBodySurfaceArea = 0.3;
}