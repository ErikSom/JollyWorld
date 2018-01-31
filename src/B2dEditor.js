function B2dEditor() {
	this.initialPTM;
	this.PTM;
	this.world;
	this.debugGraphics = null;
	this.textures = null;
	this.container = null;
	this.editorMode = "";
	this.admin = true; // for future to dissalow certain changes like naming
	this.editorGUI;
	this.customGUIContainer = document.getElementById('my-gui-container');

	this.selectedPhysicsBodies = [];
	this.selectedTextures = [];
	this.selectedBoundingBox;
	this.startSelectionPoint;

	this.canvas;
	this.mousePosPixel;
	this.mousePosWorld;
	this.oldMousePosWorld;

	this.assetLists = {};
	this.assetGUI;
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
	this.editing = true;

	this.editorObjectLookup = {}
	this.objectLookup = {};

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


	//COLORS
	this.selectionBoxColor = "0x5294AE";
	this.jointLineColor = "0x888888";


	this.load = function (loader) {
		loader.add("assets/images/iconSet.json");
	}

	this.init = function (_container, _world, _PTM) {

		this.container = _container;
		this.world = _world;
		this.initialPTM = _PTM;
		this.PTM = _PTM;
		//Texture Draw
		this.textures = new PIXI.Graphics();
		this.container.addChild(this.textures);


		//Editor Draw
		this.debugGraphics = new PIXI.Graphics();
		this.container.parent.addChild(this.debugGraphics);

		this.editorMode = this.editorMode_SELECTION;

		this.mousePosPixel = new b2Vec2(0, 0);
		this.mousePosWorld = new b2Vec2(0, 0);

		this.canvas = document.getElementById("canvas");

		this.initGui();

	}

	this.initGui = function () {

		this.initGuiAssetSelection();

		this.canvas.focus();

		/*var $container = $("#symanticui");

		$container.append('<div id="button" class="ui animated button" tabindex="0"> <div class="visible content">Next</div><div class="hidden content"><i class="right arrow icon"></i></div></div>');


		var $button = $("#button");
		console.log($button);

		$button.click(function() {

		    console.log("erik is een koning en eric ook");
		});*/





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


			folder = this.assetGUI.addFolder('Textures');
			var self = this;
			folder.add(self, "assetSelectedGroup", this.assetLists.__keys).onChange(function (value) {
				self.initGuiAssetSelection();
			});
			folder.add(self, "assetSelectedTexture", this.assetLists[this.assetSelectedGroup]).onChange(function (value) {}).name("Select");
			this.spawnTexture = function () {};
			var but = folder.add(self, "spawnTexture").name("Spawn -->");
			this.spawnTexture = function () {
				if (self.assetSelectedTexture != undefined && this.assetSelectedTexture != "") {
					var data = new self.textureObject;
					var rect = this.domElement.getBoundingClientRect();
					data.x = (rect.right + 50) / self.container.scale.x - self.container.x / self.container.scale.x;
					data.y = (rect.top + 20) / self.container.scale.y - self.container.y / self.container.scale.x;
					data.textureName = self.assetSelectedTexture;

					self.buildTextureFromObj(data);

				}
			}.bind(but);
			folder.open();
		}

	}
	this.removeGuiAssetSelection = function () {
		if (this.assetGUI != undefined) {
			this.customGUIContainer.removeChild(this.assetGUI.domElement);
			this.assetGUI = undefined;
		}
	}

	this.updateSelection = function () {
		//Joints
		var i;

		//reset
		if (this.editorGUI != undefined) {
			this.customGUIContainer.removeChild(this.editorGUI.domElement);
			this.editorGUI = null;
		}

		if (this.selectedPhysicsBodies.length > 0 && this.selectedTextures.length == 0) {
			// only holding physics bodies

			this.editorGUI = new dat.GUI({
				autoPlace: false,
				width: 200
			});
			this.customGUIContainer.appendChild(this.editorGUI.domElement);
			if (this.selectedPhysicsBodies.length > 1) this.editorGUI.addFolder('multiple bodies');
			else this.editorGUI.addFolder('body');

			this.editorGUI.editData = new this.bodyObject;

			var dataJoint;
			dataJoint = this.selectedPhysicsBodies[0].myGraphic.data;

			this.editorGUI.editData.x = dataJoint.x * this.PTM;
			this.editorGUI.editData.y = dataJoint.y * this.PTM;
			this.editorGUI.editData.rotation = dataJoint.rotation;
			this.editorGUI.editData.colorFill = dataJoint.colorFill;
			this.editorGUI.editData.colorLine = dataJoint.colorLine;
			this.editorGUI.editData.transparancy = dataJoint.transparancy;
			this.editorGUI.editData.fixed = dataJoint.fixed;
			this.editorGUI.editData.awake = dataJoint.awake;
			this.editorGUI.editData.density = dataJoint.density;
			if (this.isSelectionPropertyTheSame("group")) {
				this.editorGUI.editData.group = dataJoint.group;
			} else {
				this.editorGUI.editData.group = "-";
			}
			this.editorGUI.editData.refName = dataJoint.refName;
			this.editorGUI.editData.collision = dataJoint.collision;

			var self = this;
			var controller;
			controller = this.editorGUI.add(self.editorGUI.editData, "x").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value - this.initialValue;
				this.initialValue = value;
			});
			//controller.domElement.style.pointerEvents = "none";

			this.editorGUI.add(self.editorGUI.editData, "y").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value - this.initialValue;
				this.initialValue = value;
			});
			this.editorGUI.add(self.editorGUI.editData, "rotation").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			});
			this.editorGUI.add(self.editorGUI.editData, "group").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			});
			if (this.selectedPhysicsBodies.length == 1) {
				this.editorGUI.add(self.editorGUI.editData, "refName").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});
			}


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



			this.editorGUI.add(self.editorGUI.editData, "fixed").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			});
			this.editorGUI.add(self.editorGUI.editData, "awake").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			});
			controller = this.editorGUI.add(self.editorGUI.editData, "density", 0, 1000);
			controller.onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			}.bind(controller));
			controller = this.editorGUI.add(self.editorGUI.editData, "collision", 0, 7).step(1);
			controller.onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			}.bind(controller));



		} else if (this.selectedTextures.length > 0 && this.selectedPhysicsBodies.length == 0) {

			var _selectedTextures = [];
			var _selectedPinJoints = [];
			var _selectedSlideJoints = [];
			var _selectedDistanceJoints = [];
			var _selectedTextureJoints = [];
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
					}
				} else {
					_selectedTextures.push(_texture);
				}
			}

			var editingMultipleObjects = (_selectedTextures.length > 0 ? 1 : 0) + (_selectedPinJoints.length > 0 ? 1 : 0) + (_selectedSlideJoints.length > 0 ? 1 : 0) + (_selectedDistanceJoints.length > 0 ? 1 : 0) + (_selectedTextureJoints.length > 0 ? 1 : 0);

			if (editingMultipleObjects > 1) {
				// editing multipleCrap


			} else if (_selectedTextures.length > 0) {
				// editing just textures


			} else if (_selectedPinJoints.length > 0 || _selectedSlideJoints.length > 0 || _selectedDistanceJoints.length > 0) {
				// editing just pin joints

				this.editorGUI = new dat.GUI({
					autoPlace: false,
					width: 200
				});
				this.customGUIContainer.appendChild(this.editorGUI.domElement);
				if (this.selectedTextures.length > 1) this.editorGUI.addFolder('multiple joints');
				else this.editorGUI.addFolder('joint');

				this.editorGUI.editData = new this.jointObject;
				var jointTypes = ["Pin", "Slide", "Distance"];

				var dataJoint;
				if (_selectedPinJoints.length > 0) dataJoint = _selectedPinJoints[0].data;
				else if (_selectedSlideJoints.length > 0) dataJoint = _selectedSlideJoints[0].data;
				else if (_selectedDistanceJoints.length > 0) dataJoint = _selectedDistanceJoints[0].data;

				this.editorGUI.editData.typeName = jointTypes[dataJoint.jointType];

				this.editorGUI.editData.collideConnected = dataJoint.collideConnected;
				this.editorGUI.editData.x = dataJoint.x;
				this.editorGUI.editData.y = dataJoint.y;
				if (this.isSelectionPropertyTheSame("group")) {
					this.editorGUI.editData.group = dataJoint.group;
				} else {
					this.editorGUI.editData.group = "-";
				}
				this.editorGUI.editData.refName = dataJoint.refName;
				this.editorGUI.editData.enableMotor = dataJoint.enableMotor;
				this.editorGUI.editData.maxMotorTorque = dataJoint.maxMotorTorque;
				this.editorGUI.editData.motorSpeed = dataJoint.motorSpeed;
				this.editorGUI.editData.enableLimit = dataJoint.enableLimit;
				this.editorGUI.editData.upperAngle = dataJoint.upperAngle;
				this.editorGUI.editData.lowerAngle = dataJoint.lowerAngle;
				this.editorGUI.editData.frequencyHz = dataJoint.frequencyHz;
				this.editorGUI.editData.dampingRatio = dataJoint.dampingRatio;

				var self = this;
				this.editorGUI.add(self.editorGUI.editData, "typeName", jointTypes).onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				});
				this.editorGUI.add(self.editorGUI.editData, "collideConnected").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				});
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
				this.editorGUI.add(self.editorGUI.editData, "group").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});
				if (this.selectedTextures.length == 1) {
					this.editorGUI.add(self.editorGUI.editData, "refName").onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					});
				}

				var folder;
				var controller;

				if (dataJoint.jointType == this.jointObject_TYPE_PIN || dataJoint.jointType == this.jointObject_TYPE_SLIDE) {

					folder = this.editorGUI.addFolder('enable motor');
					folder.add(self.editorGUI.editData, "enableMotor").onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					});

					controller = folder.add(self.editorGUI.editData, "maxMotorTorque", 0, 1000);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value
					}.bind(controller));

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

		} else if (this.selectedTextures.length > 0 && this.selectedPhysicsBodies.length > 0) {
			//holding both bodies and textures
			this.editorGUI = new dat.GUI({
				autoPlace: false,
				width: 200
			});
			this.customGUIContainer.appendChild(this.editorGUI.domElement);
			this.editorGUI.addFolder('multiple objects');

			this.editorGUI.editData = new this.multiObject;

			var dataJoint;
			dataJoint = this.selectedPhysicsBodies[0].myGraphic.data;

			this.editorGUI.editData.x = dataJoint.x * this.PTM;
			this.editorGUI.editData.y = dataJoint.y * this.PTM;
			this.editorGUI.editData.rotation = dataJoint.rotation;
			if (this.isSelectionPropertyTheSame("group")) {
				this.editorGUI.editData.group = dataJoint.group;
			} else {
				this.editorGUI.editData.group = "-";
			}

			var self = this;
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
			this.editorGUI.add(self.editorGUI.editData, "rotation").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			});
			this.editorGUI.add(self.editorGUI.editData, "group").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			});


		} else {

			//holding nothing

			return;
		}
		if (this.assetGUI != undefined) {
			this.customGUIContainer.removeChild(this.assetGUI.domElement);
			this.assetGUI = undefined;
		}
	}

	this.isSelectionPropertyTheSame = function (property) {
		var data = null;
		var compareValue = null;
		var i;
		if (this.selectedPhysicsBodies.length > 0) {
			for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
				data = this.selectedPhysicsBodies[i].myGraphic.data;
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


	this.deleteSelection = function () {
		//Destroy selected bodies
		var i;

		for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
			var b = this.selectedPhysicsBodies[i];

			b.myGraphic.parent.removeChild(b.myGraphic);
			b.myGraphic.destroy({
				children: true,
				texture: false,
				baseTexture: false
			});
			b.myGraphic = null;


			if (b.myJoints != undefined) {

				var j;
				var myJoint;
				var k;

				for (j = 0; j < b.myJoints.length; j++) {

					myJoint = b.myJoints[j];
					var alreadySelected = false;

					for (k = 0; k < this.selectedTextures.length; k++) {
						if (this.selectedTextures[k] == myJoint) {
							alreadySelected = true;
						}
					}
					if (!alreadySelected) this.selectedTextures.push(myJoint);
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

		//Destroy all selected graphics

		for (i = 0; i < this.selectedTextures.length; i++) {
			var sprite = this.selectedTextures[i];
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
		}
		this.selectedPhysicsBodies = [];
		this.selectedTextures = [];
		this.updateSelection();

	}

	this.copySelection = function () {

		var i;
		var body;
		var copyArray = [];
		var cloneObject;

		if (this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0) return;


		// sort all objects based on childIndex
		for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
			body = this.selectedPhysicsBodies[i];
			this.updateObject(body.myGraphic, body.myGraphic.data);
			cloneObject = JSON.parse(JSON.stringify(body.myGraphic.data))
			copyArray.push({
				ID: cloneObject.ID,
				data: cloneObject
			})

			if (body.myTexture) {
				this.updateObject(body.myTexture, body.myTexture.data);
				cloneObject = JSON.parse(JSON.stringify(body.myTexture.data))
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
			cloneObject = JSON.parse(JSON.stringify(sprite.data))
			copyArray.push({
				ID: cloneObject.ID,
				data: cloneObject
			})
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
			} else if (data.type == this.object_TEXTURE) {
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
		if (this.copiedJSON != null) {
			var startChildIndex = this.textures.children.length;

			this.buildJSON(this.copiedJSON);

			this.selectedPhysicsBodies = [];
			this.selectedTextures = [];

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
				if (sprite.myBody != undefined && sprite.data.type != this.object_TEXTURE) {
					var pos = sprite.myBody.GetPosition();
					pos.x -= movX / this.PTM;
					pos.y -= movY / this.PTM;
					sprite.myBody.SetPosition(pos);
					this.selectedPhysicsBodies.push(sprite.myBody);
				} else {
					sprite.x -= movX;
					sprite.y -= movY;

					if (!sprite.originalGraphic && sprite.myBody == null) {

						this.selectedTextures.push(sprite);
					}
				}
			}
		}
	}
	this.doEditor = function () {
		this.debugGraphics.clear();

		if (this.editorMode == this.editorMode_SELECTION) {
			this.doSelection();
		} else if (this.editorMode == this.editorMode_DRAWVERTICES) {
			this.doVerticesDrawing();
		} else if (this.editorMode == this.editorMode_DRAWCIRCLES) {
			this.doCircleDrawing();
		} else if (this.editorMode == this.editorMode_CAMERA) {
			this.doCamera();
		}
	}
	this.run = function () {
		//update textures
		if (this.editing) {
			this.doEditor();
		}


		var body = this.world.GetBodyList();
		var i = 0
		while (body) {

			if (body.myTexture) {

				var angle = body.GetAngle() - body.myTexture.data.texturePositionOffsetAngle;
				body.myTexture.x = body.GetPosition().x * this.PTM + body.myTexture.data.texturePositionOffsetLength * Math.cos(angle);
				body.myTexture.y = body.GetPosition().y * this.PTM + body.myTexture.data.texturePositionOffsetLength * Math.sin(angle);
				body.myGraphic.x = body.GetPosition().x * this.PTM;
				body.myGraphic.y = body.GetPosition().y * this.PTM;

				body.myTexture.rotation = body.GetAngle() - body.myTexture.data.textureAngleOffset;

			} else if (body.myGraphic) {
				body.myGraphic.x = body.GetPosition().x * this.PTM;
				body.myGraphic.y = body.GetPosition().y * this.PTM;
				body.myGraphic.rotation = body.GetAngle();
			}
			i++;
			body = body.GetNext();
		}
	}



	var self = this;
	this.bodyObject = function () {
		this.type = self.object_BODY;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.group = "";
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
	}
	this.textureObject = function () {
		this.type = self.object_TEXTURE;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.group = "";
		this.refName = "";
		//
		this.ID = 0;
		this.textureName = null;
		this.bodyID = null;
		this.texturePositionOffsetLength = null;
		this.texturePositionOffsetAngle = null;
		this.textureAngleOffset = null;

	}
	this.jointObject = function () {
		this.type = self.object_JOINT;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.group = "";
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
	}
	this.multiObject = function () {
		this.x = 0;
		this.y = 0;
		this.rotation = 0;
		this.group = "";
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

	this.startVerticesDrawing = function () {
		this.editorMode = this.editorMode_DRAWVERTICES;
	}
	this.startCircleDrawing = function () {
		this.editorMode = this.editorMode_DRAWCIRCLES;
	}
	this.startSelectionMode = function () {
		this.editorMode = this.editorMode_SELECTION;
	}
	this.startCameraMode = function () {
		this.editorMode = this.editorMode_CAMERA;
	}
	this.takeCameraShot = function () {
		//first clean up screen
		this.debugGraphics.clear();
		game.newDebugGraphics.clear();
		var i;
		for(i = 0; i<this.editorIcons.length; i++){
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
			canvas.width = self.cameraSize.w*scale;
			canvas.height = self.cameraSize.h*scale;
			context.drawImage(image, self.mousePosPixel.x-self.cameraSize.w/2, self.mousePosPixel.y-self.cameraSize.h/2, self.cameraSize.w, self.cameraSize.h, 0, 0, canvas.width, canvas.height);
			var highResThumb = canvas.toDataURL('image/jpeg', shotQuality);
			/*var _image = new Image();
			_image.src = highResThumb;
			document.body.appendChild(_image);*/

			//lowRes
			scale = 0.25;
			canvas.width = self.cameraSize.w*scale;
			canvas.height = self.cameraSize.h*scale;
			context.drawImage(image, self.mousePosPixel.x-self.cameraSize.w/2, self.mousePosPixel.y-self.cameraSize.h/2, self.cameraSize.w, self.cameraSize.h, 0, 0, canvas.width, canvas.height);
			var lowResThumb = canvas.toDataURL('image/jpeg', shotQuality);
			/*var _image = new Image();
			_image.src = lowResThumb;
			document.body.appendChild(_image);*/

			self.cameraShotData.highRes = highResThumb;
			self.cameraShotData.lowRes = lowResThumb;
			console.log("Camera Shot Succesfull");
		}
		for(i = 0; i<this.editorIcons.length; i++){
			this.editorIcons[i].visible = true;
		}
	}

	this.onMouseDown = function (evt) {

		if (this.editing) {
			if (this.editorMode == this.editorMode_SELECTION) {

				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.x, this.mousePosWorld.y);
				this.storeUndoMovement();
				this.undoTransformXY = {
					x: 0.0,
					y: 0.0
				};
				this.undoTransformRot = 0.0;
				if (!this.spaceDown) {

					var aabb = new b2AABB;
					aabb.lowerBound.Set(this.mousePosWorld.x, this.mousePosWorld.y);
					aabb.upperBound.Set(this.mousePosWorld.x, this.mousePosWorld.y);


					if (!this.selectedBoundingBox.Contains(aabb) || this.shiftDown) {
						//reset selectionie
						var oldSelectedPhysicsBodies = [];
						var oldSelectedTextures = [];

						if (this.shiftDown) {
							oldSelectedPhysicsBodies = this.selectedPhysicsBodies;
							oldSelectedTextures = this.selectedTextures;
						}

						var i;
						var body;

						this.selectedPhysicsBodies = this.queryWorldForBodies(this.startSelectionPoint, this.mousePosWorld);
						if (this.selectedPhysicsBodies.length > 0) {

							var fixture;
							var pointInsideBody = false;
							for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
								body = this.selectedPhysicsBodies[i];
								fixture = body.GetFixtureList();

								while (fixture != null) {
									if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), this.mousePosWorld)) {
										pointInsideBody = true;
									}

									fixture = fixture.GetNext();
								}

								if (!pointInsideBody) {
									this.selectedPhysicsBodies.splice(i, 1);
									i--;
								}
							}
						}
						this.selectedTextures = this.queryWorldForGraphics(this.startSelectionPoint, this.mousePosWorld, true, 1);


						//limit selection to highest indexed child

						var highestObject;
						for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
							body = this.selectedPhysicsBodies[i];
							var texture = body.myGraphic;
							if (body.myTexture) texture = body.myTexture;
							if (highestObject == undefined) highestObject = texture;
							if (texture.parent.getChildIndex(texture) > highestObject.parent.getChildIndex(highestObject)) {
								highestObject = texture;
							}
						}
						var sprite;
						for (i = 0; i < this.selectedTextures.length; i++) {
							sprite = this.selectedTextures[i];
							if (highestObject == undefined) highestObject = sprite;
							if (sprite.parent.getChildIndex(sprite) > highestObject.parent.getChildIndex(highestObject)) {
								highestObject = sprite;
							}
						}
						if (highestObject) {
							if (highestObject.data.type == this.object_BODY || highestObject.myBody) {
								this.selectedTextures = [];
								if (highestObject.myBody) this.selectedPhysicsBodies = [highestObject.myBody];
								else this.selectedPhysicsBodies = [highestObject];
							} else {
								this.selectedPhysicsBodies = [];
								this.selectedTextures = [highestObject];
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
						}


						this.updateSelection();
					}
				}

			} else if (this.editorMode == this.editorMode_DRAWVERTICES) {
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
					this.buildBodyFromObj(bodyObject);
					this.activeVertices = [];
					this.editorMode = this.editorMode_SELECTION;
				}
			} else if (this.editorMode == this.editorMode_DRAWCIRCLES) {
				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.x, this.mousePosWorld.y);
			} else if (this.editorMode_CAMERA == this.editorMode_CAMERA) {
				this.takeCameraShot();
			}
		}
		this.updateMousePosition(evt);
		this.mouseDown = true;
	}
	this.onMouseMove = function (evt) {
		this.updateMousePosition(evt);

		if (this.oldMousePosWorld == null) this.oldMousePosWorld = this.mousePosWorld;

		if (this.editing) {
			if (this.editorMode == this.editorMode_SELECTION) {
				if (this.mouseDown) {
					var move = new b2Vec2(this.mousePosWorld.x - this.oldMousePosWorld.x, this.mousePosWorld.y - this.oldMousePosWorld.y);
					if (this.spaceDown) {
						move.Multiply(this.container.scale.x);
						this.container.x += move.x * this.PTM;
						this.container.y += move.y * this.PTM;
						this.mousePosWorld.x -= move.x / this.container.scale.x;
						this.mousePosWorld.y -= move.y / this.container.scale.y;

					} else {
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
		}
		this.oldMousePosWorld = this.mousePosWorld;
	}

	this.applyToSelectedObjects = function (transformType, obj) {
		if (transformType == this.TRANSFORM_DEPTH) {
			this.applyToObjects(transformType, obj, this.selectedPhysicsBodies.concat(this.selectedTextures))
		} else {
			this.applyToObjects(transformType, obj, this.selectedPhysicsBodies);
			this.applyToObjects(transformType, obj, this.selectedTextures);
		}

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
			for (i = 0; i < objects.length; i++) {

				if (objects[i].myGraphic != undefined) {

					body = objects[i];
					if (transformType == this.TRANSFORM_MOVE) {
						var oldPosition = body.GetPosition();
						body.SetPosition(new b2Vec2(oldPosition.x + obj.x / this.PTM, oldPosition.y + obj.y / this.PTM));
					} else if (transformType == this.TRANSFORM_ROTATE) {
						var oldAngle = body.GetAngle();
						body.SetAngle(oldAngle + obj * this.DEG2RAD);
					}
				} else {
					sprite = objects[i];
					if (transformType == this.TRANSFORM_MOVE) {
						sprite.x = sprite.x + obj.x;
						sprite.y = sprite.y + obj.y;
					} else if (transformType == this.TRANSFORM_ROTATE) {
						sprite.rotation += obj;
					}

				}

			}
		} else if (transformType == this.TRANSFORM_DEPTH) {
			var tarDepthIndexes = [];
			var depthArray = [];

			for (i = 0; i < objects.length; i++) {

				if (objects[i].myTexture != undefined) {
					depthArray.push(objects[i].myTexture);
					tarDepthIndexes.push(objects[i].myGraphic.parent.getChildIndex(objects[i].myTexture));
				} else if (objects[i].myGraphic != undefined) {
					depthArray.push(objects[i].myGraphic);
					tarDepthIndexes.push(objects[i].myGraphic.parent.getChildIndex(objects[i].myGraphic));
				} else {
					depthArray.push(objects[i]);
					tarDepthIndexes.push(objects[i].parent.getChildIndex(objects[i]));
				}
			}

			depthArray.sort(function (a, b) {
				return a.parent.getChildIndex(a) - b.parent.getChildIndex(b);
			});
			//if(obj) depthArray = depthArray.reverse();

			var neighbour;
			var child;

			for (i = 0; i < depthArray.length; i++) {
				child = depthArray[i];

				if ((obj && tarDepthIndexes[i] + 1 < child.parent.children.length) || (!obj && tarDepthIndexes[i] - 1 >= 0)) {

					if (obj) neighbour = child.parent.getChildAt(tarDepthIndexes[i] + 1);
					else neighbour = child.parent.getChildAt(tarDepthIndexes[i] - 1);
					child.parent.swapChildren(child, neighbour);
				}
			}


		}

	}
	this.TRANSFORM_MOVE = "move";
	this.TRANSFORM_ROTATE = "rotate";
	this.TRANSFORM_DEPTH = "depth";

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
			if (this.editorMode == this.editorMode_SELECTION) {
				if (this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0 && this.startSelectionPoint) {
					this.selectedPhysicsBodies = this.queryWorldForBodies(this.startSelectionPoint, this.mousePosWorld);
					this.selectedTextures = this.queryWorldForGraphics(this.startSelectionPoint, this.mousePosWorld, true, 0);
					this.updateSelection();
				} else {
					this.storeUndoMovement();
				}
			} else if (this.editorMode == this.editorMode_DRAWCIRCLES) {
				var radius = new b2Vec2(this.mousePosWorld.x - this.startSelectionPoint.x, this.mousePosWorld.y - this.startSelectionPoint.y).Length() / this.container.scale.x * this.PTM;
				if (radius * 2 * Math.PI > this.minimumBodySurfaceArea) {
					var bodyObject = new this.bodyObject;
					bodyObject.x = this.startSelectionPoint.x;
					bodyObject.y = this.startSelectionPoint.y;
					bodyObject.radius = radius;
					this.buildBodyFromObj(bodyObject);
				}
			}
		}
		this.mouseDown = false;
	}
	this.onKeyDown = function (e) {


		if (e.keyCode == 68) { //d
			console.log("draw! :)");
			this.startVerticesDrawing();
		} else if (e.keyCode == 67) { //c
			if (e.ctrlKey || e.metaKey) {
				this.copySelection();
			} else {
				console.log("circle! :)");
				this.startCircleDrawing();
			}


		} else if (e.keyCode == 77) { //m
			console.log("selection! :)");
			this.startSelectionMode();
		} else if (e.keyCode == 81) { //q
			this.anchorTextureToBody();
		} else if (e.keyCode == 74) { //j
			this.attachJointPlaceHolder();
		} else if (e.keyCode == 83) { //s
			this.stringifyWorldJSON();
		} else if (e.keyCode == 84) { //t
			this.startCameraMode();
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
		}
	}


	this.queryPhysicsBodies = [];
	this.queryWorldForBodies = function (lowerBound, upperBound) {
		var aabb = new b2AABB();

		aabb.lowerBound.Set((lowerBound.x < upperBound.x ? lowerBound.x : upperBound.x), (lowerBound.y < upperBound.y ? lowerBound.y : upperBound.y));
		aabb.upperBound.Set((lowerBound.x > upperBound.x ? lowerBound.x : upperBound.x), (lowerBound.y > upperBound.y ? lowerBound.y : upperBound.y));

		this.queryPhysicsBodies = [];
		this.world.QueryAABB(this.getBodyCB.bind(this), aabb);
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


				if ((sprite.x + sprite.width / 2 > upperBoundPixi.x &&
						sprite.x - sprite.width / 2 < lowerBoundPixi.x &&
						sprite.y + sprite.height / 2 > upperBoundPixi.y &&
						sprite.y - sprite.height / 2 < lowerBoundPixi.y) ||
					(lowerBoundPixi.x < sprite.x - sprite.width / 2 &&
						upperBoundPixi.x > sprite.x + sprite.width / 2 &&
						lowerBoundPixi.y < sprite.y - sprite.height / 2 &&
						upperBoundPixi.y > sprite.y + sprite.height / 2)) {
					this.textureObject
					queryGraphics.push(sprite);
					if (queryGraphics.length == limitResult) break;
				}
			}
		}
		return queryGraphics;

	}



	this.getBodyCB = function (fixture) {
		this.queryPhysicsBodies.push(fixture.GetBody());
		return true;
	};



	this.computeSelectionAABB = function () {
		var aabb = new b2AABB;
		aabb.lowerBound = new b2Vec2(Number.MAX_VALUE, Number.MAX_VALUE);
		aabb.upperBound = new b2Vec2(-Number.MAX_VALUE, -Number.MAX_VALUE);
		var i;
		var j;
		var body;
		var fixture;
		for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
			body = this.selectedPhysicsBodies[i];
			fixture = body.GetFixtureList();
			while (fixture != null) {
				aabb.Combine(aabb, fixture.GetAABB());
				fixture = fixture.GetNext();
			}
		}

		for (i = 0; i < this.selectedTextures.length; i++) {
			var sprite = this.selectedTextures[i];

			if (sprite.myBody) {
				fixture = sprite.myBody.GetFixtureList();
				while (fixture != null) {
					aabb.Combine(aabb, fixture.GetAABB());
					fixture = fixture.GetNext();
				}
			} else {
				//sprite.calculateBounds()

				//sprite = sprite.getLocalBounds();
				var bounds = sprite.getLocalBounds();
				var spriteAABB = new b2AABB;
				spriteAABB.lowerBound = new b2Vec2((sprite.position.x - (bounds.width / 2) * sprite.scale.x) / this.PTM, (sprite.position.y - (bounds.height / 2) * sprite.scale.x) / this.PTM);
				spriteAABB.upperBound = new b2Vec2((sprite.position.x + (bounds.width / 2) * sprite.scale.y) / this.PTM, (sprite.position.y + (bounds.height / 2) * sprite.scale.y) / this.PTM);
				aabb.Combine(aabb, spriteAABB);
			}
		}
		return aabb;
	}

	this.doSelection = function () {
		// DRAW outer selection lines

		var aabb;
		if (this.selectedPhysicsBodies.length > 0 || this.selectedTextures.length > 0) {

			aabb = this.computeSelectionAABB();

			var lowerBoundPixi = this.getPIXIPointFromWorldPoint(aabb.lowerBound);
			var upperBoundPixi = this.getPIXIPointFromWorldPoint(aabb.upperBound);

			//Showing selection
			this.drawBox(this.debugGraphics, this.container.x + lowerBoundPixi.x * this.container.scale.x, this.container.y + lowerBoundPixi.y * this.container.scale.y, (upperBoundPixi.x - lowerBoundPixi.x) * this.container.scale.y, (upperBoundPixi.y - lowerBoundPixi.y) * this.container.scale.x, this.selectionBoxColor);
		} else {
			aabb = new b2AABB;

			//Making selection
			if (this.mouseDown && !this.spaceDown && this.startSelectionPoint) this.drawBox(this.debugGraphics, this.container.x + this.startSelectionPoint.x * this.PTM * this.container.scale.x, this.container.y + this.startSelectionPoint.y * this.PTM * this.container.scale.y, (this.mousePosWorld.x * this.PTM - this.startSelectionPoint.x * this.PTM) * this.container.scale.x, (this.mousePosWorld.y * this.PTM - this.startSelectionPoint.y * this.PTM) * this.container.scale.y, "#000000");
		}
		this.selectedBoundingBox = aabb;


		//JOINTS draw upper and lower limits
		var i;
		var sprite;
		for (i = 0; i < this.selectedTextures.length; i++) {
			sprite = this.selectedTextures[i];
			if (sprite.data.type == this.object_JOINT) {

				var tarSprite;


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
		//





		if (this.editorGUI && this.editorGUI.editData) {
			//if(this.editorGUI.editData instanceof this.jointObject || this.editorGUI.editData instanceof this.bodyObject){
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
						//joint
						if (controller.targetValue == "Pin") {
							this.selectedTextures[0].data.jointType = this.jointObject_TYPE_PIN;
						} else if (controller.targetValue == "Slide") {
							this.selectedTextures[0].data.jointType = this.jointObject_TYPE_SLIDE;
						} else if (controller.targetValue == "Distance") {
							this.selectedTextures[0].data.jointType = this.jointObject_TYPE_DISTANCE;
						}
						this.updateSelection();
					} else if (controller.property == "x") {
						//bodies & sprites
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							var pos = body.GetPosition();
							pos.x += controller.targetValue / this.PTM;
							body.SetPosition(pos);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.x += controller.targetValue;
						}
					} else if (controller.property == "y") {
						//bodies & sprites
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							var pos = body.GetPosition();
							pos.y += controller.targetValue / this.PTM;
							body.SetPosition(pos);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.y += controller.targetValue;
						}
					} else if (controller.property == "collideConnected") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.collideConnected = controller.targetValue;
						}
					} else if (controller.property == "enableMotor") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.enableMotor = controller.targetValue;
						}
					} else if (controller.property == "maxMotorTorque") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.maxMotorTorque = controller.targetValue;
						}
					} else if (controller.property == "motorSpeed") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.motorSpeed = controller.targetValue;
						}
					} else if (controller.property == "enableLimit") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.enableLimit = controller.targetValue;
						}
					} else if (controller.property == "upperAngle") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.upperAngle = controller.targetValue;
						}
					} else if (controller.property == "lowerAngle") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.lowerAngle = controller.targetValue;
						}
					} else if (controller.property == "frequencyHz") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.frequencyHz = controller.targetValue;
						}
					} else if (controller.property == "dampingRatio") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.dampingRatio = controller.targetValue;
						}
					} else if (controller.property == "rotation") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.SetAngle(controller.targetValue * this.DEG2RAD);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.rotation = controller.targetValue;
						}
					} else if (controller.property == "group" && controller.targetValue != "-") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.group = controller.targetValue;
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.group = controller.targetValue;
						}
					} else if (controller.property == "refName" && controller.targetValue != "-") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.refName = controller.targetValue;
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.refName = controller.targetValue;
						}
					} else if (controller.property == "colorFill") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.colorFill = controller.targetValue.toString();
							var fixture = body.GetFixtureList();

							if (body.myGraphic.data.radius) this.updateCircleShape(body.myGraphic, body.myGraphic.data.radius, body.myGraphic.data.colorFill, body.myGraphic.data.colorLine, body.myGraphic.data.transparancy);
							else this.updatePolyShape(body.myGraphic, fixture.GetShape(), body.myGraphic.data.colorFill, body.myGraphic.data.colorLine, body.myGraphic.data.transparancy);
						}
					} else if (controller.property == "colorLine") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.colorLine = controller.targetValue.toString();
							var fixture = body.GetFixtureList();
							if (body.myGraphic.data.radius) this.updateCircleShape(body.myGraphic, body.myGraphic.data.radius, body.myGraphic.data.colorFill, body.myGraphic.data.colorLine, body.myGraphic.data.transparancy);
							else this.updatePolyShape(body.myGraphic, fixture.GetShape(), body.myGraphic.data.colorFill, body.myGraphic.data.colorLine, body.myGraphic.data.transparancy);
						}
					} else if (controller.property == "transparancy") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.transparancy = controller.targetValue;
							var fixture = body.GetFixtureList();
							if (body.myGraphic.data.radius) this.updateCircleShape(body.myGraphic, body.myGraphic.data.radius, body.myGraphic.data.colorFill, body.myGraphic.data.colorLine, body.myGraphic.data.transparancy);
							else this.updatePolyShape(body.myGraphic, fixture.GetShape(), body.myGraphic.data.colorFill, body.myGraphic.data.colorLine, body.myGraphic.data.transparancy);
						}
					} else if (controller.property == "fixed") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.fixed = controller.targetValue;
							if (body.myGraphic.data.fixed) body.SetType(b2Body.b2_staticBody);
							else body.SetType(b2Body.b2_dynamicBody);

							var oldPosition = new b2Vec2(body.GetPosition().x, body.GetPosition().y);
							body.SetPosition(new b2Vec2(1000, 1000));
							body.SetPosition(oldPosition);

							//update collision data
							this.setBodyCollision(body, body.myGraphic.data.collision);

							//awake fix
							if (body.GetType() == b2Body.b2_dynamicBody) body.SetAwake(body.myGraphic.data.awake);
						}

					} else if (controller.property == "awake") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.awake = controller.targetValue;
							body.SetAwake(false);
						}
					} else if (controller.property == "density") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.density = controller.targetValue;
							var fixture = body.GetFixtureList();
							fixture.SetDensity(controller.targetValue);
							body.ResetMassData();
						}
					} else if (controller.property == "collision") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.collision = controller.targetValue;
							this.setBodyCollision(body, controller.targetValue);
						}
					}

				}
				if (controller.__input !== document.activeElement &&
					(controller.domElement.children[0].children && controller.domElement.children[0].children[0] !== document.activeElement)) {
					controller.updateDisplay();
				}
			}
			if (this.editorGUI.editData.type == this.object_BODY) {
				var pos = this.selectedPhysicsBodies[0].GetPosition();
				this.editorGUI.editData.x = pos.x * this.PTM;
				this.editorGUI.editData.y = pos.y * this.PTM;
				this.editorGUI.editData.rotation = this.selectedPhysicsBodies[0].GetAngle() * this.RAD2DEG;
			} else {
				this.editorGUI.editData.x = this.selectedTextures[0].x;
				this.editorGUI.editData.y = this.selectedTextures[0].y;
				this.editorGUI.editData.rotation = this.selectedTextures[0].rotation;
			}
			//}
		}

	}

	this.correctedDrawVerticePosition;
	this.correctDrawVertice = false;
	this.closeDrawing = false;
	this.activeVertices = [];

	this.verticesLineColor = "#00FF00";
	this.verticesFillColor = "#0000FF";
	this.verticesBulletRadius = 5;

	this.doVerticesDrawing = function () {
		this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);
		this.debugGraphics.beginFill(this.verticesFillColor, 0.5);

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

			if (this.activeVertices.length > 1) {

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

			}
			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(newVertice).x * this.container.scale.x + this.container.x + this.verticesBulletRadius, this.getPIXIPointFromWorldPoint(newVertice).y * this.container.scale.y + this.container.y);

			this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(newVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(newVertice).y * this.container.scale.y + this.container.y, this.verticesBulletRadius, 0, 2 * Math.PI, false);

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(newVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(newVertice).y * this.container.scale.y + this.container.y);

			this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
		}
		previousVertice = null;


		for (i = 0; i < this.activeVertices.length; i++) {

			activeVertice = this.activeVertices[i];

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x + this.verticesBulletRadius, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
			this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y, this.verticesBulletRadius, 0, 2 * Math.PI, false);

			if (i > 0) previousVertice = this.activeVertices[i - 1];

			if (previousVertice) {
				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(previousVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(previousVertice).y * this.container.scale.y + this.container.y);
			}
		}

		this.debugGraphics.endFill();

	}
	this.doCircleDrawing = function () {
		if (this.mouseDown) {
			this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);
			this.debugGraphics.beginFill(this.verticesFillColor, 0.5);
			var radius = new b2Vec2(this.mousePosWorld.x - this.startSelectionPoint.x, this.mousePosWorld.y - this.startSelectionPoint.y).Length() * this.PTM;

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(this.startSelectionPoint).x * this.container.scale.x + this.container.x + radius, this.getPIXIPointFromWorldPoint(this.startSelectionPoint).y * this.container.scale.y + this.container.y);
			this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(this.startSelectionPoint).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(this.startSelectionPoint).y * this.container.scale.y + this.container.y, radius, 0, 2 * Math.PI, false);

			this.debugGraphics.endFill();
		}
	}

	this.createBodyObjectFromVerts = function (verts) {
		var bodyObject = new this.bodyObject;

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

		bodyObject.x = centerPoint.x;
		bodyObject.y = centerPoint.y;
		bodyObject.vertices = verts.reverse();

		return bodyObject;

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
	this.buildTextureFromObj = function (obj) {
		var sprite = new PIXI.Sprite(PIXI.Texture.fromFrame(obj.textureName));

		sprite.pivot.set(sprite.width / 2, sprite.height / 2);
		this.textures.addChild(sprite);
		sprite.x = obj.x;
		sprite.y = obj.y;
		sprite.rotation = obj.rotation;
		sprite.data = obj;
		console.log("ID:" + sprite.data.bodyID);

		if (sprite.data.bodyID != undefined) {

			if (sprite.data.bodyID == 12) console.log("array length:" + this.textures.children.length);

			var body = this.textures.getChildAt(sprite.data.bodyID).myBody;
			this.setTextureToBody(body, sprite, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}
		//handle groups and ref names
		if (obj.group != "") {
			if (this.editorObjectLookup[obj.group] == undefined) {
				this.editorObjectLookup[obj.group] = new this.lookupObject;
			}
			this.editorObjectLookup[obj.group]._textures.push(sprite);
		}

	}
	this.buildBodyFromObj = function (obj) {

		var fixDef = new b2FixtureDef;
		fixDef.density = obj.density;
		fixDef.friction = 2000;
		fixDef.restitution = 0.001;


		var bd = new b2BodyDef();

		if (obj.fixed) bd.type = b2Body.b2_staticBody;
		else bd.type = b2Body.b2_dynamicBody;

		var body = this.world.CreateBody(bd);

		body.SetAwake(obj.awake);

		if (!obj.radius) {
			var i = 0;
			var vert;
			var b2Vec2Arr = [];
			for (i = 0; i < obj.vertices.length; i++) {
				vert = obj.vertices[i];
				b2Vec2Arr.push(new b2Vec2(vert.x, vert.y));
			}

			fixDef.shape = new b2PolygonShape;
			fixDef.shape.SetAsArray(b2Vec2Arr, b2Vec2Arr.length);
		} else {
			fixDef.shape = new b2CircleShape;
			fixDef.shape.Set(new b2Vec2(0, 0));
			fixDef.shape.SetRadius(obj.radius / this.PTM);
		}

		var fixture = body.CreateFixture(fixDef);
		body.SetPositionAndAngle(new b2Vec2(obj.x, obj.y), 0);

		body.SetAngle(obj.rotation);

		var graphic = new PIXI.Graphics();
		this.textures.addChild(graphic);
		body.myGraphic = graphic

		if (!obj.radius) this.updatePolyShape(body.myGraphic, fixDef.shape, obj.colorFill, obj.colorLine, obj.transparancy);
		else this.updateCircleShape(body.myGraphic, obj.radius, obj.colorFill, obj.colorLine, obj.transparancy);

		body.myGraphic.myBody = body;
		body.myGraphic.data = obj;


		this.setBodyCollision(body, obj.collision);


		if (obj.group != "") {
			if (this.editorObjectLookup[obj.group] == undefined) {
				this.editorObjectLookup[obj.group] = new this.lookupObject;
			}
			this.editorObjectLookup[obj.group]._bodies.push(body);
		}


	}
	this.setBodyCollision = function (body, collision) {
		// DO COLLISION
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


		if (body.GetType() == b2Body.b2_staticBody) filterData.categoryBits = this.MASKBIT_FIXED;
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
			tarObj.bodyA_ID = bodies[0].myGraphic.parent.getChildIndex(bodies[0].myGraphic);
			if (bodies.length > 1) {
				tarObj.bodyB_ID = bodies[1].myGraphic.parent.getChildIndex(bodies[1].myGraphic);
			}

			tarObj.jointType = this.jointObject_TYPE_PIN;
			tarObj.x = this.mousePosWorld.x * this.PTM;
			tarObj.y = this.mousePosWorld.y * this.PTM
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


		if (tarObj.group != "") {
			if (this.editorObjectLookup[tarObj.group] == undefined) {
				this.editorObjectLookup[tarObj.group] = new this.lookupObject;
			}
			this.editorObjectLookup[tarObj.group]._textures.push(jointGraphics);
		}

		this.editorIcons.push(jointGraphics);

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
			bd.type = b2Body.b2_staticBody;
			bodyB = this.world.CreateBody(bd);
			bodyB.SetPosition(new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM));


			fixDef.shape = new b2PolygonShape;
			fixDef.shape.SetAsBox(1, 1);

			var fixture = bodyB.CreateFixture(fixDef);
		}
		var joint;

		if (jointPlaceHolder.jointType == this.jointObject_TYPE_PIN || jointPlaceHolder.jointType == this.jointObject_TYPE_SLIDE) {
			var revoluteJointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef;

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
		} else if (jointPlaceHolder.jointType == this.jointObject_TYPE_DISTANCE) {
			var distanceJointDef = new Box2D.Dynamics.Joints.b2DistanceJointDef;
			distanceJointDef.Initialize(bodyA, bodyB, new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM), new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM));
			distanceJointDef.frequencyHz = jointPlaceHolder.frequencyHz;
			distanceJointDef.dampingRatio = jointPlaceHolder.dampingRatio;

			joint = this.world.CreateJoint(distanceJointDef);
		}
		return joint;
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



				if(body.myGraphic.parent.getChildIndex(body.myGraphic) > texture.parent.getChildIndex(texture)){
					body.myGraphic.parent.swapChildren(body.myGraphic, texture);
				}


				this.updateObject(body.myGraphic, body.myGraphic.data);
				this.updateObject(texture, texture.data);

				this.setTextureToBody(body, texture, dif.Length(), angleOffset, angle);

			} else if (body.myTexture && texture.myBody) {
				if (body.myTexture == texture) {
					this.removeTextureFromBody(body);
				}
			}

		}
	}
	this.setTextureToBody = function (body, texture, positionOffsetLength, positionOffsetAngle, offsetRotation) {
		body.myTexture = texture;
		texture.data.bodyID = body.myGraphic.data.ID;
		texture.data.texturePositionOffsetLength = positionOffsetLength;
		texture.data.texturePositionOffsetAngle = positionOffsetAngle;
		texture.data.textureAngleOffset = offsetRotation;
		body.myGraphic.visible = false;
		texture.myBody = body;
	}
	this.removeTextureFromBody = function (body) {
		body.myTexture = null;
		texture.data.bodyID = null;
		texture.data.texturePositionOffsetLength = null;
		texture.data.texturePositionOffsetAngle = null;
		texture.data.textureAngleOffset = null;
		body.myGraphic.visible = true;
		texture.myBody = null;
	}

	this.updatePolyShape = function (graphic, poly, colorFill, colorLine, transparancy) {

		var color;
		color = colorFill.slice(1);
		var colorFillHex = parseInt(color, 16);
		color = colorLine.slice(1);
		var colorLineHex = parseInt(color, 16);


		graphic.clear();
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
	this.updateCircleShape = function (graphic, radius, colorFill, colorLine, transparancy) {
		var color;
		color = colorFill.slice(1);
		var colorFillHex = parseInt(color, 16);
		color = colorLine.slice(1);
		var colorLineHex = parseInt(color, 16);


		graphic.clear();
		graphic.boundsPadding = 0;

		graphic.lineStyle(1, colorLineHex, transparancy);
		graphic.beginFill(colorFillHex, transparancy);


		graphic.moveTo(radius, 0);
		graphic.arc(0, 0, radius, 0, 2 * Math.PI, false);
		graphic.endFill();


	}

	this.stringifyWorldJSON = function () {
		this.worldJSON = '{"objects":[';
		var sprite;
		var spriteData;
		for (i = 0; i < this.textures.children.length; i++) {
			if (i != 0) this.worldJSON += ',';
			sprite = this.textures.getChildAt(i);
			if (!sprite.data.excludeFromWorldJSON) {
				this.updateObject(sprite, sprite.data);
				this.worldJSON += this.stringifyObject(sprite.data);
			}
		}
		this.worldJSON += ']}';
	}
	/*this.bodyObject = function () {
		[0]this.type = self.object_BODY;
		[1]this.x = null;
		[2]this.y = null;
		[3]this.rotation = 0;
		[4]this.group = "";
		[5]this.refName = "";
		//
		[6]this.ID = 0;
		[7]this.colorFill = "#999999";
		[8]this.colorLine = "#000";
		[9]this.transparancy = 1.0;
		[10]this.fixed = false;
		[11]this.awake = true;
		[12]this.vertices = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
		[13]this.density = 1;
		[14]this.collision = 0;
		[15]this.radius;
	}*/
	/*
	this.textureObject = function () {
		[0]this.type = self.object_TEXTURE;
		[1]this.x = null;
		[2]this.y = null;
		[3]this.rotation = 0;
		[4]this.group = "";
		[5]this.refName = "";
		//
		[6]this.ID = 0;
		[7]this.textureName = null;
		[8]this.bodyID = null;
		[9]this.texturePositionOffsetLength = null;
		[10]this.texturePositionOffsetAngle = null;
		[11]this.textureAngleOffset = null;
	}*/
	/*
	this.jointObject = function () {
		[0]this.type = self.object_JOINT;
		[1]this.x = null;
		[2]this.y = null;
		[3]this.rotation = 0;
		[4]this.group = "";
		[5]this.refName = "";
		//
		[6]this.bodyA_ID;
		[7]this.bodyB_ID;
		[8]this.jointType = 0;
		[9]this.collideConnected = false;
		[10]this.enableMotor = false;
		[11]this.maxMotorTorque = 1.0;
		[12]this.motorSpeed = 10.0;
		[13]this.enableLimit = false;
		[14]this.upperAngle = 0.0;
		[15]this.lowerAngle = 0.0;
		[16]this.dampingRatio = 0.0;
		[17]this.frequencyHz = 0.0;
	}
	*/
	this.stringifyObject = function (obj) {
		var arr = [];
		arr[0] = obj.type;
		arr[1] = obj.x;
		arr[2] = obj.y;
		arr[3] = obj.rotation;
		arr[4] = obj.group;
		arr[5] = obj.refName;

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
		} else if (obj.type == this.object_TEXTURE) {
			arr[6] = obj.ID;
			arr[7] = obj.textureName;
			arr[8] = obj.bodyID;
			arr[9] = obj.texturePositionOffsetLength;
			arr[10] = obj.texturePositionOffsetAngle;
			arr[11] = obj.textureAngleOffset;
		} else if (obj.type == this.object_JOINT) {
			arr[6] = obj.bodyA_ID;
			arr[7] = obj.bodyB_ID;
			arr[8] = obj.jointType;
			arr[9] = obj.collideConnected;
			arr[10] = obj.enableMotor;
			arr[11] = obj.maxMotorTorque;
			arr[12] = obj.motorSpeed;
			arr[13] = obj.enableLimit;
			arr[14] = obj.upperAngle;
			arr[15] = obj.lowerAngle;
			arr[16] = obj.dampingRatio;
			arr[17] = obj.frequencyHz;
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
		} else if (arr[0] == this.object_TEXTURE) {
			obj = new this.textureObject();
			obj.ID = arr[6];
			obj.textureName = arr[7];
			obj.bodyID = arr[8];
			obj.texturePositionOffsetLength = arr[9];
			obj.texturePositionOffsetAngle = arr[10];
			obj.textureAngleOffset = arr[11];
		} else if (arr[0] == this.object_JOINT) {
			obj = new this.jointObject();
			obj.bodyA_ID = arr[6];
			obj.bodyB_ID = arr[7];
			obj.jointType = arr[8];
			obj.collideConnected = arr[9];
			obj.enableMotor = arr[10];
			obj.maxMotorTorque = arr[11];
			obj.motorSpeed = arr[12];
			obj.enableLimit = arr[13];
			obj.upperAngle = arr[14];
			obj.lowerAngle = arr[15];
			obj.dampingRatio = arr[16];
			obj.frequencyHz = arr[17];
		}
		obj.type = arr[0];
		obj.x = arr[1];
		obj.y = arr[2];
		obj.rotation = arr[3];
		obj.group = arr[4];
		obj.refName = arr[5];

		return obj;
	}

	this.updateObject = function (sprite, data) {

		if (data.type == this.object_BODY) {
			data.x = sprite.myBody.GetPosition().x;
			data.y = sprite.myBody.GetPosition().y;
			data.rotation = sprite.myBody.GetAngle();
		} else if (data.type == this.object_TEXTURE) {
			data.x = sprite.x;
			data.y = sprite.y;
			data.rotation = sprite.rotation;
			if (data.bodyID != undefined) data.bodyID = sprite.myBody.myGraphic.parent.getChildIndex(sprite.myBody.myGraphic);

		} else if (data.type == this.object_JOINT) {

			data.bodyA_ID = sprite.bodies[0].myGraphic.parent.getChildIndex(sprite.bodies[0].myGraphic);
			if (sprite.bodies.length > 1) data.bodyB_ID = sprite.bodies[1].myGraphic.parent.getChildIndex(sprite.bodies[1].myGraphic);
			data.x = sprite.x;
			data.y = sprite.y;
			data.rotation = sprite.rotation
		}
		data.ID = sprite.parent.getChildIndex(sprite);
	}

	this.buildJSON = function (json, excludeFromWorldJSON) {

		console.log(json);

		var startChildIndex = this.textures.children.length;

		if (json != null) {
			//clone json to not destroy old references
			var worldObjects = JSON.parse(JSON.stringify(json));

			console.log("START HERE" + startChildIndex);
			var i;
			var obj;
			for (i = 0; i < worldObjects.objects.length; i++) {
				console.log(i);
				obj = this.parseArrObject(worldObjects.objects[i]);
				obj.ID += startChildIndex;
				if(excludeFromWorldJSON) obj.excludeFromWorldJSON = true;

				if (obj.type == this.object_BODY) {
					this.buildBodyFromObj(obj);
				} else if (obj.type == this.object_TEXTURE) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex;
					}
					this.buildTextureFromObj(obj);
				} else if (obj.type == this.object_JOINT) {
					obj.bodyA_ID += startChildIndex;
					if (obj.bodyB_ID != undefined) obj.bodyB_ID += startChildIndex;

					this.attachJointPlaceHolder(obj);
				}

			}
		}

		console.log(this.textures.length);
		console.log("END HERE");


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
		this.editorMode = this.editorMode_SELECTION;

		this.selectedPhysicsBodies = [];
		this.selectedTextures = [];
		this.selectedBoundingBox = null;
		this.startSelectionPoint = null;
		this.oldMousePosWorld = null;
		this.mouseDown = false;

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
		console.log("Destroying all textures");
		console.log(this.textures.children.length);
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
		console.log(this.textures.children.length);

		//reset gui
		if (this.editorGUI != undefined) {
			this.customGUIContainer.removeChild(this.editorGUI.domElement);
			this.editorGUI = null;
		}
	}
	this.runWorld = function () {
		this.editorIcons = [];
		this.debugGraphics.clear();
		this.editing = false;

		var spritesToDestroy = [];
		var sprite;

		this.objectLookup = {};
		this.editorObjectLookup = {};

		for (i = 0; i < this.textures.children.length; i++) {
			sprite = this.textures.getChildAt(i);
			if (sprite.data.type == this.object_JOINT) {

				sprite.data.bodyA_ID = sprite.bodies[0].myGraphic.parent.getChildIndex(sprite.bodies[0].myGraphic);
				if (sprite.bodies.length > 1) sprite.data.bodyB_ID = sprite.bodies[1].myGraphic.parent.getChildIndex(sprite.bodies[1].myGraphic);
				this.updateObject(sprite, sprite.data);

				var joint = this.attachJoint(sprite.data);
				spritesToDestroy.push(sprite);

				//
				//add to live group
				if (sprite.data.group != "") {
					if (this.objectLookup[sprite.data.group] == undefined) {
						this.objectLookup[sprite.data.group] = new this.lookupObject;
					}
					this.objectLookup[sprite.data.group]._joints.push(joint);

					if (sprite.data.refName != "") {
						this.objectLookup[sprite.data.group][sprite.data.refName] = joint;
					}
				}
			} else if (sprite.data.type == this.object_BODY) {
				//
				//add to live group
				if (sprite.data.group != "") {
					if (this.objectLookup[sprite.data.group] == undefined) {
						this.objectLookup[sprite.data.group] = new this.lookupObject;
					}
					this.objectLookup[sprite.data.group]._bodies.push(sprite.myBody);

					if (sprite.data.refName != "") {
						this.objectLookup[sprite.data.group][sprite.data.refName] = sprite.myBody;
					}
				}
				//

				var fixture = sprite.myBody.GetFixtureList();



			} else if (sprite.data.type == this.object_TEXTURE) {
				if (sprite.myBody == undefined) {
					//
					//add to live group
					if (sprite.data.group != "") {
						if (this.objectLookup[sprite.data.group] == undefined) {
							this.objectLookup[sprite.data.group] = new this.lookupObject;
						}
						this.objectLookup[sprite.data.group]._textures.push(sprite);

						if (sprite.data.refName != "") {
							this.objectLookup[sprite.data.group][sprite.data.refName] = sprite;
						}
					}
					//

				}

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



	//CONSTS
	this.editorMode_CAMERA = "camera";
	this.editorMode_DRAWVERTICES = "drawVertices";
	this.editorMode_DRAWCIRCLES = "drawCircles";
	this.editorMode_SELECTION = "selection";

	this.object_typeToName = ["Physics Body", "Texture", "Joint"];

	this.object_BODY = 0;
	this.object_TEXTURE = 1;
	this.object_JOINT = 2;
	this.object_UNDO_MOVEMENT = 3;

	this.jointObject_TYPE_PIN = 0;
	this.jointObject_TYPE_SLIDE = 1;
	this.jointObject_TYPE_DISTANCE = 2;

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

	this.minimumBodySurfaceArea = 0.3;

}