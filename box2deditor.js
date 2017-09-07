function B2deEditor(){



	this.initialPTM;
	this.PTM;
	this.world;
	this.debugGraphics = null;
	this.textures = null;
	this.container = null;
	this.editorMode = ""
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
	this.assetSelectedTexture ="";
	this.assetSelectedGroup ="";
	this.assetSelectedObject ="";

	this.worldJSON = '{"objects":[\
	{"x":13.5,"y":4.508333333333333,"rotation":0,"ID":0,"type":0,"textureID":null,"texturePositionOffsetLength":null,"texturePositionOffsetAngle":null,"textureAngleOffset":null,"colorFill":"#000000","colorLine":"#000000","fixed":false,"collision":0, "awake":true, "density":1, "group":"","refName":"", "vertices":[{"x":1.6999999999999993,"y":0.49166666666666714},{"x":-0.3333333333333339,"y":1.4250000000000007},{"x":-1.1333333333333329,"y":-0.24166666666666625},{"x":-0.2333333333333325,"y":-1.6749999999999994}]},\
	{"x":14.908333333333335,"y":4.0166666666666675,"rotation":0,"ID":1,"type":0,"textureID":null,"texturePositionOffsetLength":null,"texturePositionOffsetAngle":null,"textureAngleOffset":null,"colorFill":"#000000","colorLine":"#000000","fixed":false,"collision":0, "awake":true, "density":1, "group":"","refName":"","vertices":[{"x":2.658333333333335,"y":-2.3166666666666664},{"x":3.125,"y":-0.2833333333333323},{"x":-2.9749999999999996,"y":1.9166666666666679},{"x":-2.8083333333333336,"y":0.6833333333333336}]},\
	{"type":2,"jointType":0,"bodyA_ID":1,"bodyB_ID":0,"x":405,"y":134,"ID":2,"collideConnected":false,"motorSpeed":2,"maxMotorTorque":10,"enableMotor":true,"enableLimit":false,"upperAngle":0,"lowerAngle":0, "frequencyHz":0.0, "dampingRatio":0.0, "group":"","refName":""},\
	{"x":12.541666666666666,"y":11.691666666666666,"rotation":0,"ID":3,"type":0,"textureID":null,"texturePositionOffsetLength":null,"texturePositionOffsetAngle":null,"textureAngleOffset":null,"colorFill":"#000000","colorLine":"#000000","fixed":false,"collision":0, "awake":true, "density":1, "group":"","refName":"","vertices":[{"x":6.3583333333333325,"y":-1.1583333333333332},{"x":6.691666666666668,"y":0.9416666666666664},{"x":-6.675,"y":1.0083333333333329},{"x":-6.374999999999999,"y":-0.7916666666666661}]},\
	{"jointType":0,"x":222,"y":358,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"type":2,"bodyA_ID":3,"ID":4,"frequencyHz":0.0, "dampingRatio":0.0, "group":"","refName":""},\
	{"jointType":0,"x":537,"y":354,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"type":2,"bodyA_ID":3,"ID":5, "frequencyHz":0.0, "dampingRatio":0.0, "group":"","refName":""},\
	{"x":7.459999999999999,"y":5.253333333333333,"rotation":0,"ID":6,"type":0,"colorFill":"#000000","colorLine":"#000000","fixed":false,"collision":0, "awake":true, "density":1, "group":"","refName":"","vertices":[{"x":0.14000000000000057,"y":-0.45333333333333314},{"x":0.4733333333333345,"y":-0.3866666666666667},{"x":0.5400000000000009,"y":0.013333333333333641},{"x":0.4733333333333345,"y":0.3466666666666667},{"x":0.07333333333333414,"y":0.5466666666666669},{"x":-0.2599999999999989,"y":0.4800000000000004},\
	{"x":-0.4599999999999991,"y":0.21333333333333382},{"x":-0.4599999999999991,"y":-0.05333333333333279},{"x":-0.39333333333333265,"y":-0.25333333333333297},{"x":-0.12666666666666604,"y":-0.45333333333333314}]},{"x":223.98959350585932,"y":160.00000000000006,"rotation":0,"ID":7,"type":1,"textureName":"1head.png","bodyID":6,"texturePositionOffsetLength":2.4074770398623397,"texturePositionOffsetAngle":-1.4919627495569028,"textureAngleOffset":0, "group":"","refName":""}]}';
	this.copiedJSON = '';
	this.copyCenterPoint = {x:0, y:0};

	this.selectionBoxColor = "#5294AE";
	this.mouseDown = false;
	this.shiftDown = false;
	this.spaceDown = false;
	this.editing = true;

	this.editorObjectLookup = {}
	this.objectLookup = {};


	this.load = function(loader){
		loader.add("assets/images/iconSet.json");
	}

	this.init = function(_container, _world, _PTM){

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

	this.initGui = function(){

		this.initGuiAssetSelection();
		
        this.canvas.focus();
        this.parseAndBuildJSON(this.worldJSON);
	}
	this.initGuiAssetSelection = function(){

		if(this.assetGUI != undefined){
			this.customGUIContainer.removeChild(this.assetGUI.domElement);
			this.assetGUI = null;
		}
		if(this.assetLists.__keys == undefined) this.assetLists.__keys = Object.keys(this.assetLists);

		if(this.assetLists.__keys.length>0){

			this.assetGUI = new dat.GUI({autoPlace:false, width:300});
			this.customGUIContainer.appendChild(this.assetGUI.domElement);
			this.assetGUI.addFolder('Asset Selection');

			if(this.assetSelectedGroup =="") this.assetSelectedGroup = this.assetLists.__keys[0];
			this.assetSelectedTexture = this.assetLists[this.assetSelectedGroup][0];


			folder = this.assetGUI.addFolder('Textures');
			var self = this;
			folder.add(self, "assetSelectedGroup", this.assetLists.__keys).onChange(function(value){self.initGuiAssetSelection();});
			folder.add(self, "assetSelectedTexture", this.assetLists[this.assetSelectedGroup]).onChange(function(value){}).name("Select");
			this.spawnTexture = function(){};
			var but = folder.add(self, "spawnTexture").name("Spawn -->");
			this.spawnTexture = function (){ 
				if(self.assetSelectedTexture!= undefined && this.assetSelectedTexture != ""){
					var data = new self.textureObject;
					var rect = this.domElement.getBoundingClientRect();
					data.x = (rect.right+50) / self.container.scale.x -  self.container.x/self.container.scale.x;
					data.y = (rect.top+20) /self.container.scale.y - self.container.y/self.container.scale.x; 
					data.textureName = self.assetSelectedTexture;

					self.buildTextureFromObj(data);

				}
			}.bind(but);
			folder.open();
		}

	}

	this.updateSelection = function(){
		//Joints
		var i;

		//reset
		if(this.editorGUI != undefined){
			this.customGUIContainer.removeChild(this.editorGUI.domElement);
			this.editorGUI = null;
		}

		if(this.selectedPhysicsBodies.length>0 && this.selectedTextures.length == 0){
			// only holding physics bodies

			this.editorGUI = new dat.GUI({autoPlace:false, width:200});
			this.customGUIContainer.appendChild(this.editorGUI.domElement);
			if(this.selectedPhysicsBodies.length>1) this.editorGUI.addFolder('multiple bodies');
			else this.editorGUI.addFolder('body');

			this.editorGUI.editData = new this.bodyObject;

			var dataJoint;
			dataJoint = this.selectedPhysicsBodies[0].myGraphic.data;

			this.editorGUI.editData.x = dataJoint.x*this.PTM;
			this.editorGUI.editData.y = dataJoint.y*this.PTM;
			this.editorGUI.editData.rotation = dataJoint.rotation;
			this.editorGUI.editData.colorFill = dataJoint.colorFill;
			this.editorGUI.editData.colorLine = dataJoint.colorLine;
			this.editorGUI.editData.fixed = dataJoint.fixed;
			this.editorGUI.editData.awake = dataJoint.awake;
			this.editorGUI.editData.density = dataJoint.density;
			if(this.isSelectionPropertyTheSame("group")){
				this.editorGUI.editData.group = dataJoint.group;
			}else{
				this.editorGUI.editData.group = "-";
			}
			this.editorGUI.editData.refName = dataJoint.refName;
			this.editorGUI.editData.collision = dataJoint.collision;

			var self = this;
			var controller;
			controller = this.editorGUI.add(self.editorGUI.editData, "x").onChange(function(value) {this.humanUpdate=true; this.targetValue=value-this.initialValue; this.initialValue = value;});
			//controller.domElement.style.pointerEvents = "none";

			this.editorGUI.add(self.editorGUI.editData, "y").onChange(function(value) {this.humanUpdate=true; this.targetValue=value-this.initialValue; this.initialValue = value;});
			this.editorGUI.add(self.editorGUI.editData, "rotation").onChange(function(value) {this.humanUpdate=true; this.targetValue=value});
			this.editorGUI.add(self.editorGUI.editData, "group").onChange(function(value) {this.humanUpdate=true; this.targetValue=value});
			if(this.selectedPhysicsBodies.length == 1){
				this.editorGUI.add(self.editorGUI.editData, "refName").onChange(function(value) {this.humanUpdate=true; this.targetValue=value;});
			}


			controller = this.editorGUI.addColor(self.editorGUI.editData, "colorFill");
			controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value;}.bind(controller));
			controller = this.editorGUI.addColor(self.editorGUI.editData, "colorLine");
			controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value;}.bind(controller));

			this.editorGUI.add(self.editorGUI.editData, "fixed").onChange(function(value) {this.humanUpdate=true; this.targetValue=value});
			this.editorGUI.add(self.editorGUI.editData, "awake").onChange(function(value) {this.humanUpdate=true; this.targetValue=value});
			controller = this.editorGUI.add(self.editorGUI.editData, "density", 1, 1000);
			controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value}.bind(controller));
			controller = this.editorGUI.add(self.editorGUI.editData, "collision", 0, 5).step(1);
			controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value}.bind(controller));



		}else if(this.selectedTextures.length>0 && this.selectedPhysicsBodies.length == 0){

			var _selectedTextures = [];
			var _selectedPinJoints = [];
			var _selectedSlideJoints = [];
			var _selectedDistanceJoints = [];
			var _selectedTextureJoints = [];
			var _texture;
			for(i = 0; i<this.selectedTextures.length; i++){
				_texture = this.selectedTextures[i];

				if(_texture.data && _texture.data.type == this.object_JOINT){
					if(_texture.data.jointType == this.jointObject_TYPE_PIN){
						_selectedPinJoints.push(_texture);
					}else if(_texture.data.jointType == this.jointObject_TYPE_SLIDE){
						_selectedSlideJoints.push(_texture);
					}else if(_texture.data.jointType == this.jointObject_TYPE_DISTANCE){
						_selectedDistanceJoints.push(_texture);
					}
				}else {
					_selectedTextures.push(_texture);
				}
			}

			var editingMultipleObjects = (_selectedTextures.length > 0 ? 1 : 0) + (_selectedPinJoints.length > 0 ? 1 : 0) + (_selectedSlideJoints.length > 0 ? 1 : 0)+ (_selectedDistanceJoints.length > 0 ? 1 : 0)  +(_selectedTextureJoints.length > 0 ? 1 : 0);

			if(editingMultipleObjects>1){
				// editing multipleCrap


			}else if(_selectedTextures.length>0){
				// editing just textures


			}else if(_selectedPinJoints.length>0 || _selectedSlideJoints.length>0 || _selectedDistanceJoints.length>0){
				// editing just pin joints

				this.editorGUI = new dat.GUI({autoPlace:false, width:200});
				this.customGUIContainer.appendChild(this.editorGUI.domElement);
				if(this.selectedTextures.length>1) this.editorGUI.addFolder('multiple joints');
				else this.editorGUI.addFolder('joint');

				this.editorGUI.editData = new this.jointObject;
				var jointTypes = ["Pin", "Slide", "Distance"];

				var dataJoint;
				if(_selectedPinJoints.length>0) dataJoint = _selectedPinJoints[0].data;
				else if(_selectedSlideJoints.length>0) dataJoint = _selectedSlideJoints[0].data;
				else if(_selectedDistanceJoints.length>0) dataJoint = _selectedDistanceJoints[0].data;

				this.editorGUI.editData.typeName = jointTypes[dataJoint.jointType];

				this.editorGUI.editData.collideConnected = dataJoint.collideConnected;
				this.editorGUI.editData.x = dataJoint.x;
				this.editorGUI.editData.y = dataJoint.y;
				if(this.isSelectionPropertyTheSame("group")){
					this.editorGUI.editData.group = dataJoint.group;
				}else{
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
				this.editorGUI.add(self.editorGUI.editData, "typeName", jointTypes).onChange(function(value) {this.humanUpdate=true; this.targetValue=value});
				this.editorGUI.add(self.editorGUI.editData, "collideConnected").onChange(function(value) {this.humanUpdate=true; this.targetValue=value});
				this.editorGUI.add(self.editorGUI.editData, "x").onChange(function(value) {this.humanUpdate=true; this.targetValue=value-this.initialValue; this.initialValue = value;});
				this.editorGUI.add(self.editorGUI.editData, "y").onChange(function(value) {this.humanUpdate=true; this.targetValue=value-this.initialValue; this.initialValue = value;});
				this.editorGUI.add(self.editorGUI.editData, "group").onChange(function(value) {this.humanUpdate=true; this.targetValue=value;});
				if(this.selectedTextures.length == 1){
					this.editorGUI.add(self.editorGUI.editData, "refName").onChange(function(value) {this.humanUpdate=true; this.targetValue=value;});
				}

				var folder;
				var controller;

				if(dataJoint.jointType == this.jointObject_TYPE_PIN || dataJoint.jointType == this.jointObject_TYPE_SLIDE){

					folder = this.editorGUI.addFolder('enable motor');
					folder.add(self.editorGUI.editData, "enableMotor").onChange(function(value) {this.humanUpdate=true; this.targetValue=value;});
					
					controller = folder.add(self.editorGUI.editData, "maxMotorTorque", 0, 1000);
					controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value}.bind(controller));

					controller = folder.add(self.editorGUI.editData, "motorSpeed", -20, 20);
					controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value}.bind(controller));

					folder = this.editorGUI.addFolder('enable limits');
					folder.add(self.editorGUI.editData, "enableLimit").onChange(function(value) {this.humanUpdate=true; this.targetValue=value;});

					controller = folder.add(self.editorGUI.editData, "upperAngle", 0, 180);
					controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value;}.bind(controller));

					controller = folder.add(self.editorGUI.editData, "lowerAngle", -180, 0);
					controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value}.bind(controller));

				}else if(dataJoint.jointType == this.jointObject_TYPE_DISTANCE){
					folder = this.editorGUI.addFolder('spring');

					controller = folder.add(self.editorGUI.editData, "frequencyHz", 0, 180);
					controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value;}.bind(controller));

					controller = folder.add(self.editorGUI.editData, "dampingRatio", 0.0, 1.0).step(0.25);
					controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value}.bind(controller));
				}

			}

		}else if(this.selectedTextures.length>0 && this.selectedPhysicsBodies.length >0){
			//holding both bodies and textures
			this.editorGUI = new dat.GUI({autoPlace:false, width:200});
			this.customGUIContainer.appendChild(this.editorGUI.domElement);
			this.editorGUI.addFolder('multiple objects');

			this.editorGUI.editData = new this.multiObject;

			var dataJoint;
			dataJoint = this.selectedPhysicsBodies[0].myGraphic.data;

			this.editorGUI.editData.x = dataJoint.x*this.PTM;
			this.editorGUI.editData.y = dataJoint.y*this.PTM;
			this.editorGUI.editData.rotation = dataJoint.rotation;
			if(this.isSelectionPropertyTheSame("group")){
				this.editorGUI.editData.group = dataJoint.group;
			}else{
				this.editorGUI.editData.group = "-";
			}

			var self = this;
			this.editorGUI.add(self.editorGUI.editData, "x").onChange(function(value) {this.humanUpdate=true; this.targetValue=value-this.initialValue; this.initialValue = value;});
			this.editorGUI.add(self.editorGUI.editData, "y").onChange(function(value) {this.humanUpdate=true; this.targetValue=value-this.initialValue; this.initialValue = value;});
			this.editorGUI.add(self.editorGUI.editData, "rotation").onChange(function(value) {this.humanUpdate=true; this.targetValue=value});
			this.editorGUI.add(self.editorGUI.editData, "group").onChange(function(value) {this.humanUpdate=true; this.targetValue=value});


		}else{

			//holding nothing

			return;
		}
		if(this.assetGUI != undefined){
			this.customGUIContainer.removeChild(this.assetGUI.domElement);
			this.assetGUI = undefined;
		}
	}

	this.isSelectionPropertyTheSame = function(property){
		var data = null;
		var compareValue = null;
		var i;
		if(this.selectedPhysicsBodies.length>0){
			for(i = 0; i<this.selectedPhysicsBodies.length; i++){
				data = this.selectedPhysicsBodies[i].myGraphic.data;
				if(compareValue == null) compareValue = data[property];
				else if(data[property] != compareValue){
					return false;
				} 
			}
		}
		if(this.selectedTextures.length>0){
			for(i = 0; i<this.selectedTextures.length; i++){
				data = this.selectedTextures[i].data;
				if(compareValue == null) compareValue = data[property];
				else if(data[property] != compareValue){
					return false;
				} 

			}
		}
		return true;
	}


	this.deleteSelection = function(){
		//Destroy selected bodies
	    var i;

	    for(i = 0; i<this.selectedPhysicsBodies.length; i++){
	    	var b = this.selectedPhysicsBodies[i];

	    	b.myGraphic.parent.removeChild(b.myGraphic);
			b.myGraphic.destroy({children:true, texture:false, baseTexture:false});
			b.myGraphic = null;


			if(b.myJoint != undefined){

				var j;
				var alreadySelected = false;
				for(j = 0; j<this.selectedTextures.length; j++){
					if(this.selectedTextures[j] == b.myJoint){
						alreadySelected = true;
					}
				}
				if(!alreadySelected) this.selectedTextures.push(b.myJoint);
			}

			if(b.myTexture){
				var sprite = b.myTexture;
				sprite.parent.removeChild(sprite);
				sprite.destroy({children:true, texture:false, baseTexture:false});
			}


	        this.world.DestroyBody(b);
	    }

	    //Destroy all selected graphics

	    for(i = 0; i<this.selectedTextures.length; i++){
			var sprite = this.selectedTextures[i];
			if(sprite.data && sprite.data.type == this.object_JOINT){
				if(sprite.bodies[0] != undefined) sprite.bodies[0].myJoint = null;
				if(sprite.bodies.length>1 && sprite.bodies[1] != undefined) sprite.bodies[1].myJoint = null;
			}


			sprite.parent.removeChild(sprite);
			sprite.destroy({children:true, texture:false, baseTexture:false});
		}
		this.selectedPhysicsBodies = [];
		this.selectedTextures = [];
		this.updateSelection();

	}

	this.copySelection = function(){

		var i;
		var body;
		var copyArray = [];
		var cloneObject;

		if(this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0) return;

		// sort all objects based on childIndex
		for(i = 0; i<this.selectedPhysicsBodies.length; i++){
			body = this.selectedPhysicsBodies[i];
			this.updateObject(body.myGraphic, body.myGraphic.data);
			cloneObject = JSON.parse(JSON.stringify(body.myGraphic.data))
			copyArray.push({ID:cloneObject.ID, data:cloneObject})

			if(body.myTexture){
				this.updateObject(body.myTexture, body.myTexture.data);
				cloneObject = JSON.parse(JSON.stringify(body.myTexture.data))
				copyArray.push({ID:cloneObject.ID, data:cloneObject});
			}

		}
		var sprite;
		for(i = 0; i<this.selectedTextures.length; i++){
			sprite = this.selectedTextures[i];
			this.updateObject(sprite, sprite.data);
			cloneObject = JSON.parse(JSON.stringify(sprite.data))
			copyArray.push({ID:cloneObject.ID, data:cloneObject})
		}

		copyArray.sort(function(a, b){ return a.ID-b.ID; });


		// Fix copied joints (make sure no anchor body is null)
		var data;
		var j;
		for(i = 0; i<copyArray.length; i++){
			data = copyArray[i].data;
			if(data.type == this.object_JOINT){
				//searching object A
				var foundBodyA = false;
				for(j = 0; j<copyArray.length; j++){

					if(copyArray[j].ID == data.bodyA_ID){
						foundBodyA = true;
						data.bodyA_ID = j;
						break;
					}
				}
				var foundBodyB = false;
				if(data.bodyB_ID != undefined){
					for(j = 0; j<copyArray.length; j++){

					if(copyArray[j].ID == data.bodyB_ID){
						foundBodyB = true;
						data.bodyB_ID = j;
						break;
					}
				}

				}else{
					foundBodyB = true;
				}

				if(!foundBodyA || !foundBodyB){
					copyArray.splice(i, 1);
					i--;
				}
			}else if(data.type == this.object_TEXTURE){
				for(j = 0; j<copyArray.length; j++){
					if(copyArray[j].ID == data.bodyID){
						data.bodyID = j;
						break;
					}
				}
			}
		}
		var copyJSON = '{"objects":[';
		this.copyCenterPoint = {x:0, y:0};

		for(i = 0; i<copyArray.length; i++){
			if(i != 0) copyJSON += ',';
			data = copyArray[i].data;
			data.ID = i;
			copyJSON += JSON.stringify(data);
			if(data.type == this.object_BODY){
				this.copyCenterPoint.x += data.x*this.PTM;
				this.copyCenterPoint.y += data.y*this.PTM;

			}else{
				this.copyCenterPoint.x += data.x;
				this.copyCenterPoint.y += data.y;
			}

		}
		this.copyCenterPoint.x = this.copyCenterPoint.x / copyArray.length;
		this.copyCenterPoint.y = this.copyCenterPoint.y / copyArray.length;
		copyJSON += ']}';

		this.copiedJSON = copyJSON;
	}
	this.cutSelection = function(){
		this.copySelection();
		this.deleteSelection();
	}

	this.pasteSelection = function(){
		var startChildIndex = this.textures.children.length;

		this.parseAndBuildJSON(this.copiedJSON);

		this.selectedPhysicsBodies = [];
		this.selectedTextures = [];

		var i;
		var sprite;
		var movX = this.copyCenterPoint.x-(this.mousePosWorld.x*this.PTM);
		var movY = this.copyCenterPoint.y-(this.mousePosWorld.y*this.PTM);

		for(i = startChildIndex; i<this.textures.children.length; i++){
			sprite = this.textures.getChildAt(i);
			if(sprite.myBody != undefined && sprite.data.type != this.object_TEXTURE){
				var pos = sprite.myBody.GetPosition();
				pos.x -= movX/this.PTM;
				pos.y -= movY/this.PTM;
				sprite.myBody.SetPosition(pos);
				this.selectedPhysicsBodies.push(sprite.myBody);
			}
			else{
				sprite.x -= movX;
				sprite.y -= movY;

				if(!sprite.originalGraphic && sprite.myBody == null){

					this.selectedTextures.push(sprite);
				}
			} 
		}

	}


	this.doEditor = function(){
		this.debugGraphics.clear();

		if(this.editorMode == this.editorMode_SELECTION){
			this.doSelection();
		}else if(this.editorMode == this.editorMode_DRAWVERTICES){
			this.doVerticesDrawing();
		}
		
	}


	this.run = function(){
		//update textures
		if(this.editing){
			this.doEditor();
		}


	   var body = this.world.GetBodyList();
	   var i = 0
	   while(body){

	      if(body.myTexture){

	         var angle = body.GetAngle()-body.myTexture.data.texturePositionOffsetAngle;
	         body.myTexture.x = body.GetPosition().x*this.PTM +body.myTexture.data.texturePositionOffsetLength * Math.cos(angle);
	         body.myTexture.y = body.GetPosition().y*this.PTM +body.myTexture.data.texturePositionOffsetLength * Math.sin(angle);

	         body.myTexture.rotation = body.GetAngle()-body.myTexture.data.textureAngleOffset;

	      }else if(body.myGraphic){
	         body.myGraphic.x = body.GetPosition().x*this.PTM;
	         body.myGraphic.y = body.GetPosition().y*this.PTM;
	         body.myGraphic.rotation = body.GetAngle();
	      }
	      i++;
	      body = body.GetNext();
	    }
	}



	var self = this;
	this.bodyObject = function(){
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.ID = 0;
		this.type = self.object_BODY;
		this.colorFill = "#999999";
		this.colorLine = "#000";
		this.fixed = false;
		this.awake = true;
		this.vertices = [{x:0, y:0}, {x:0, y:0}];
		this.density = 1;
		this.group = "";
		this.refName = "";
		this.collision = 0;
	}
	this.textureObject = function(){
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.ID = 0;
		this.type = self.object_TEXTURE;
		this.textureName = null;
		this.bodyID = null;
		this.texturePositionOffsetLength = null;
		this.texturePositionOffsetAngle = null;
		this.textureAngleOffset = null;
		this.group = "";
		this.refName ="";
	}
	this.jointObject = function(){
		this.bodyA_ID;
		this.bodyB_ID;
		this.jointType = 0;
		this.x = null;
		this.y = null;
		this.collideConnected = false;
		this.enableMotor = false;
		this.maxMotorTorque = 1.0;
		this.motorSpeed = 10.0;
		this.enableLimit = false;
		this.upperAngle = 0.0;
		this.lowerAngle = 0.0;
		this.dampingRatio = 0.0;
		this.frequencyHz = 0.0;
		this.type = self.object_JOINT;
		this.group = "";
		this.refName = "";
	}
	this.multiObject = function(){
		this.x = 0;
		this.y = 0;
		this.rotation = 0;
		this.group = "";
	}
	this.lookupObject = function(){
		this._bodies = [];
		this._textures = [];
		this._joints = [];
	}

	this.startVerticesDrawing = function(){
		this.resetEditor();
		this.editorMode = this.editorMode_DRAWVERTICES;
	}


	this.onMouseDown = function(evt) {

		if(this.editing){
			if(this.editorMode == this.editorMode_SELECTION){

				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.x, this.mousePosWorld.y);
				if(!this.spaceDown){

					var aabb = new b2AABB;
					aabb.lowerBound.Set(this.mousePosWorld.x, this.mousePosWorld.y);
					aabb.upperBound.Set(this.mousePosWorld.x, this.mousePosWorld.y);


					if(!this.selectedBoundingBox.Contains(aabb) || this.shiftDown){
						//reset selectionie
						var oldSelectedPhysicsBodies = [];
						var oldSelectedTextures = [];

						if(this.shiftDown){
							oldSelectedPhysicsBodies = this.selectedPhysicsBodies;
							oldSelectedTextures = this.selectedTextures;
						}


						this.selectedPhysicsBodies = this.queryWorldForBodies(this.startSelectionPoint, this.mousePosWorld);
						if(this.selectedPhysicsBodies.length>0){
							var i;
							var body;
							var fixture;
							var pointInsideBody = false;
							for(i = 0; i<this.selectedPhysicsBodies.length; i++){
								body = this.selectedPhysicsBodies[i];
								fixture = body.GetFixtureList();
								
								while(fixture != null){
									if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), this.mousePosWorld)) {
						        		pointInsideBody = true;
					  				}

									fixture = fixture.GetNext();
								}

								if(pointInsideBody){
									this.selectedPhysicsBodies = [body];
									break;
								}

							}
							if(!pointInsideBody) this.selectedPhysicsBodies = [];

						}
						this.selectedTextures = this.queryWorldForGraphics(this.startSelectionPoint, this.mousePosWorld, true, 1);


						if(this.selectedPhysicsBodies.length > 0 && this.selectedTextures.length > 0){
							//limit selection to highest indexed child
							if(this.selectedPhysicsBodies[0].myGraphic.parent.getChildIndex(this.selectedPhysicsBodies[0].myGraphic) > this.selectedTextures[0].parent.getChildIndex(this.selectedTextures[0])){
								this.selectedTextures = [];
							}else{
								this.selectedPhysicsBodies = [];
							}
						}

						if(this.shiftDown){
							//push old selection
							var i;
							for(i = 0; i<oldSelectedPhysicsBodies.length; i++){
								if(oldSelectedPhysicsBodies[i] != this.selectedPhysicsBodies[0]){
									this.selectedPhysicsBodies.push(oldSelectedPhysicsBodies[i]);
								}
							}
							for(i = 0; i<oldSelectedTextures.length; i++){
								if(oldSelectedTextures[i] != this.selectedTextures[0]){
									this.selectedTextures.push(oldSelectedTextures[i]);
								}
							}
						}


						this.updateSelection();
					}
				}

			}else if(this.editorMode == this.editorMode_DRAWVERTICES){
				if(!this.closeDrawing){
					if(this.correctDrawVertice && this.activeVertices.length>1){
						this.activeVertices[this.activeVertices.length-1] = {x:this.correctedDrawVerticePosition.x, y:this.correctedDrawVerticePosition.y};
					}else{
						this.activeVertices.push({x:this.mousePosWorld.x, y:this.mousePosWorld.y});
					}
				}else{

					var bodyObject = this.createBodyObjectFromVerts(this.activeVertices);
					this.buildBodyFromObj(bodyObject);
					this.activeVertices = [];
					this.editorMode = this.editorMode_SELECTION;
				}
			}
		}
		this.updateMousePosition(evt);
		this.mouseDown = true;
	}
	this.onMouseMove = function(evt) {
		this.updateMousePosition(evt);

		if(this.oldMousePosWorld == null) this.oldMousePosWorld = this.mousePosWorld;

		if(this.editing){
			if(this.editorMode == this.editorMode_SELECTION){
				if(this.mouseDown){
					var move = new b2Vec2(this.mousePosWorld.x-this.oldMousePosWorld.x, this.mousePosWorld.y-this.oldMousePosWorld.y);
					if(this.spaceDown){
						console.log(this.container.scale.x);
						move.Multiply(this.container.scale.x);
						this.container.x += move.x*this.PTM;
						this.container.y += move.y*this.PTM;
						this.mousePosWorld.x -= move.x/this.container.scale.x;
						this.mousePosWorld.y -= move.y/this.container.scale.y;

					}else{
						if(this.selectedPhysicsBodies.length>0 || this.selectedTextures.length>0){
							var i;
							var body;
							for(i = 0; i<this.selectedPhysicsBodies.length; i++){
								body = this.selectedPhysicsBodies[i];

								if(this.mouseTransformType == this.mouseTransformType_Movement){
									var oldPosition = body.GetPosition();
									body.SetPosition(new b2Vec2(oldPosition.x+move.x, oldPosition.y+move.y));
								}else if(this.mouseTransformType == this.mouseTransformType_Rotation){
									var oldAngle = body.GetAngle();
									body.SetAngle(oldAngle+move.x/10);
								}
							}
							var sprite;
							for(i = 0; i<this.selectedTextures.length; i++){
								sprite = this.selectedTextures[i];
								if(this.mouseTransformType == this.mouseTransformType_Movement){
									sprite.x = sprite.x+move.x*this.PTM;
									sprite.y = sprite.y+move.y*this.PTM;
								}else if(this.mouseTransformType == this.mouseTransformType_Rotation){
									sprite.rotation += move.x/10;
								}
							}
						}
					}
				}
			}
		}



		this.oldMousePosWorld = this.mousePosWorld;
	}
	this.updateMousePosition = function(e){
	   var clientX, clientY;
	   if(e.clientX)
	   {
	      clientX = e.clientX;
	      clientY = e.clientY;
	   }
	   else if(e.changedTouches && e.changedTouches.length > 0)
	   {
	      var touch = e.changedTouches[e.changedTouches.length - 1];
	      clientX = touch.clientX;
	      clientY = touch.clientY;
	   }
	   else
	   {
	      return;
	   }

	   var rect = this.canvas.getBoundingClientRect();

	   this.mousePosPixel.x = e.clientX - rect.left;
	   this.mousePosPixel.y = e.clientY - rect.top;

	   this.mousePosWorld = this.getWorldPointFromPixelPoint(this.mousePosPixel);
	}





	this.onMouseUp = function(evt){
		if(this.editing){
			if(this.editorMode == this.editorMode_SELECTION){
				if(this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0 && this.startSelectionPoint){
					this.selectedPhysicsBodies = this.queryWorldForBodies(this.startSelectionPoint, this.mousePosWorld);
					this.selectedTextures = this.queryWorldForGraphics(this.startSelectionPoint, this.mousePosWorld, true, 0);
					this.updateSelection();
				}
			}
		}
		this.mouseDown = false;
	}
	this.onKeyDown = function(e){
		if (e.keyCode == 68 ) {//d
	      this.startVerticesDrawing();
	   }else if (e.keyCode == 81 ) {//q
	      this.anchorTextureToBody();
	   }else if (e.keyCode == 74 ) {//j
	      this.attachJointPlaceHolder();
	   }else if (e.keyCode == 83 ) {//s
	      this.stringifyWorldJSON();
	   }else if(e.ctrlKey && e.keyCode == 67){ //c
	      this.copySelection();
	   }else if(e.ctrlKey && e.keyCode == 86){// v
	      this.pasteSelection();
	   }else if(e.ctrlKey && e.keyCode == 88){// x
	      this.cutSelection();
	   }else if (e.keyCode == 46){
	      this.deleteSelection();
	   }else if(e.keyCode == 16){//shift
	   		this.shiftDown = true;
	   		this.mouseTransformType = this.mouseTransformType_Rotation;
	   }else if(e.keyCode == 32){//space
	   		this.spaceDown = true;
	   }else if(e.keyCode == 187){//space
	   		//zoomin
	   		this.zoom({x:this.mousePosWorld.x*this.PTM, y:this.mousePosWorld.y*this.PTM}, true);
	   }else if(e.keyCode == 189){//space
	   		//zoomout
	   		this.zoom({x:this.mousePosWorld.x*this.PTM, y:this.mousePosWorld.y*this.PTM}, false);
	   }
	}
	this.onKeyUp = function(e){
		if(e.keyCode == 16){//shift
			this.shiftDown = false;
	   		this.mouseTransformType = this.mouseTransformType_Movement;
	   }else if(e.keyCode == 32){//space
	   		this.spaceDown = false;
	   }
	}


	this.queryPhysicsBodies = [];
	this.queryWorldForBodies = function(lowerBound, upperBound){
		var aabb = new b2AABB();

		aabb.lowerBound.Set((lowerBound.x < upperBound.x ?  lowerBound.x : upperBound.x), (lowerBound.y < upperBound.y ?  lowerBound.y : upperBound.y));
		aabb.upperBound.Set((lowerBound.x > upperBound.x ?  lowerBound.x : upperBound.x), (lowerBound.y > upperBound.y ?  lowerBound.y : upperBound.y));

		this.queryPhysicsBodies = [];
		this.world.QueryAABB(this.getBodyCB, aabb);
		return this.queryPhysicsBodies;
	}
	this.queryWorldForGraphics = function(lowerBound, upperBound, onlyTextures, limitResult){
		var aabb = new b2AABB();

		aabb.lowerBound.Set((lowerBound.x < upperBound.x ?  lowerBound.x : upperBound.x), (lowerBound.y < upperBound.y ?  lowerBound.y : upperBound.y));
		aabb.upperBound.Set((lowerBound.x > upperBound.x ?  lowerBound.x : upperBound.x), (lowerBound.y > upperBound.y ?  lowerBound.y : upperBound.y));

		var lowerBoundPixi = this.getPIXIPointFromWorldPoint(aabb.lowerBound);
		var upperBoundPixi = this.getPIXIPointFromWorldPoint(aabb.upperBound);

		//QueryTextures

		var queryGraphics = [];
		var i;
		for(i = 0; i<this.textures.children.length; i++){
			var sprite = this.textures.getChildAt(i);

			if(!onlyTextures || !sprite.myBody){


				if((   sprite.x+sprite.width/2 > upperBoundPixi.x
					&& sprite.x-sprite.width/2 < lowerBoundPixi.x
					&& sprite.y+sprite.height/2 > upperBoundPixi.y
					&& sprite.y-sprite.height/2 < lowerBoundPixi.y) 
				||(    lowerBoundPixi.x < sprite.x-sprite.width/2
					&& upperBoundPixi.x > sprite.x+sprite.width/2
					&& lowerBoundPixi.y < sprite.y-sprite.height/2
					&& upperBoundPixi.y > sprite.y+sprite.height/2))

				{this.textureObject
					queryGraphics.push(sprite);
					if(queryGraphics.length == limitResult) break;
				}
			}
		}
		return queryGraphics;

	}



	this.getBodyCB = function(fixture) {
		editor.queryPhysicsBodies.push(fixture.GetBody());
		return true;
	};



	this.computeSelectionAABB = function(){
		var aabb = new b2AABB;
		aabb.lowerBound = new b2Vec2(Number.MAX_VALUE,Number.MAX_VALUE);
		aabb.upperBound = new b2Vec2(-Number.MAX_VALUE,-Number.MAX_VALUE); 
		var i;
		var j;
		var body;
		var fixture;
		for(i = 0; i<this.selectedPhysicsBodies.length; i++){
			body = this.selectedPhysicsBodies[i];
			fixture = body.GetFixtureList();
			while(fixture != null){
				aabb.Combine(aabb, fixture.GetAABB());
				fixture = fixture.GetNext();
			}
		}

		for(i = 0; i<this.selectedTextures.length; i++){
			var sprite = this.selectedTextures[i];

			if(sprite.myBody){
				fixture = sprite.myBody.GetFixtureList();
				while(fixture != null){
					aabb.Combine(aabb, fixture.GetAABB());
					fixture = fixture.GetNext();
				}
			}else{
				//sprite.calculateBounds()

				//sprite = sprite.getLocalBounds();
				var bounds = sprite.getLocalBounds();
				var spriteAABB = new b2AABB;
				spriteAABB.lowerBound = new b2Vec2((sprite.position.x-bounds.width/2)/this.PTM, (sprite.position.y-bounds.height/2)/this.PTM);
				spriteAABB.upperBound = new b2Vec2((sprite.position.x+bounds.width/2)/this.PTM, (sprite.position.y+bounds.height/2)/this.PTM);
				aabb.Combine(aabb, spriteAABB);
			}
		}
		return aabb;
	}

	this.doSelection = function(){
		
		// DRAW outer selection lines

		var aabb;
		if(this.selectedPhysicsBodies.length>0 || this.selectedTextures.length>0){

			aabb = this.computeSelectionAABB();

			var lowerBoundPixi = this.getPIXIPointFromWorldPoint(aabb.lowerBound);
			var upperBoundPixi = this.getPIXIPointFromWorldPoint(aabb.upperBound);

			//Showing selection
			this.drawBox(this.debugGraphics, this.container.x+lowerBoundPixi.x*this.container.scale.x, this.container.y+lowerBoundPixi.y*this.container.scale.y, (upperBoundPixi.x-lowerBoundPixi.x)*this.container.scale.y, (upperBoundPixi.y-lowerBoundPixi.y)*this.container.scale.x, this.selectionBoxColor);
		}else{
			aabb = new b2AABB;

			//Making selection
			if(this.mouseDown && !this.spaceDown) this.drawBox(this.debugGraphics, this.container.x+this.startSelectionPoint.x*this.PTM*this.container.scale.x, this.container.y+this.startSelectionPoint.y*this.PTM*this.container.scale.y, (this.mousePosWorld.x*this.PTM-this.startSelectionPoint.x*this.PTM)*this.container.scale.x, (this.mousePosWorld.y*this.PTM-this.startSelectionPoint.y*this.PTM)*this.container.scale.y, "#000000");
		}
		this.selectedBoundingBox = aabb;


		if(this.editorGUI && this.editorGUI.editData){
			//if(this.editorGUI.editData instanceof this.jointObject || this.editorGUI.editData instanceof this.bodyObject){
			var controller;
			var controllers = [];
			var body;
			var sprite;
			var j;
			controllers = controllers.concat(this.editorGUI.__controllers);

			for(var propt in this.editorGUI.__folders){
				controllers = controllers.concat(this.editorGUI.__folders[propt].__controllers);
			}


			for (var i in controllers) {
			    controller = controllers[i]

			    if(controller.humanUpdate){
			    	controller.humanUpdate = false;
			    	if(controller.property == "typeName"){
			    		//joint
			    		if(controller.targetValue == "Pin"){
			    			this.selectedTextures[0].data.jointType = this.jointObject_TYPE_PIN;
			    		}else if(controller.targetValue == "Slide"){
			    			this.selectedTextures[0].data.jointType = this.jointObject_TYPE_SLIDE;
			    		}else if(controller.targetValue == "Distance"){
			    			this.selectedTextures[0].data.jointType = this.jointObject_TYPE_DISTANCE;
			    		}
			    		this.updateSelection();
			    	}else if(controller.property == "x"){
			    		//bodies & sprites
			    		for(j = 0; j<this.selectedPhysicsBodies.length; j++){
			    			body = this.selectedPhysicsBodies[j];
							var pos = body.GetPosition();
			    			pos.x +=  controller.targetValue/this.PTM;
			    			body.SetPosition(pos); 
			    		}
			    			
			    		for(j = 0; j<this.selectedTextures.length; j++){
			    			sprite = this.selectedTextures[j];
			    			sprite.x += controller.targetValue;
			    		}
			    	}else if(controller.property == "y"){
			    		//bodies & sprites
					    for(j = 0; j<this.selectedPhysicsBodies.length; j++){
			    			body = this.selectedPhysicsBodies[j];
							var pos = body.GetPosition();
			    			pos.y +=  controller.targetValue/this.PTM;
			    			body.SetPosition(pos); 
			    		}
			    			
			    		for(j = 0; j<this.selectedTextures.length; j++){
			    			sprite = this.selectedTextures[j];
			    			sprite.y += controller.targetValue;
			    		}
			    	}else if(controller.property == "collideConnected"){
			    		//joint
			    		this.selectedTextures[0].data.collideConnected = controller.targetValue; 
			    	}else if(controller.property == "enableMotor"){
			    		//joint
			    		this.selectedTextures[0].data.enableMotor = controller.targetValue; 
			    	}else if(controller.property == "maxMotorTorque"){
			    		//joint
			    		this.selectedTextures[0].data.maxMotorTorque = controller.targetValue; 
			    	}else if(controller.property == "motorSpeed"){
			    		//joint
			    		this.selectedTextures[0].data.motorSpeed = controller.targetValue; 
			    	}else if(controller.property == "enableLimit"){
			    		//joint
			    		this.selectedTextures[0].data.enableLimit = controller.targetValue; 
			    	}else if(controller.property == "upperAngle"){
			    		//joint
			    		this.selectedTextures[0].data.upperAngle = controller.targetValue; 
			    	}else if(controller.property == "lowerAngle"){
			    		//joint
			    		this.selectedTextures[0].data.lowerAngle = controller.targetValue; 
			    	}else if(controller.property == "frequencyHz"){
			    		//joint
			    		this.selectedTextures[0].data.frequencyHz = controller.targetValue;
			    	}else if(controller.property == "dampingRatio"){
			    		//joint
			    		this.selectedTextures[0].data.dampingRatio = controller.targetValue;
			    	}else if(controller.property == "rotation"){
			    		//body & sprite
			    		for(j = 0; j<this.selectedPhysicsBodies.length; j++){
			    			body = this.selectedPhysicsBodies[j];
			    			body.SetAngle(controller.targetValue*this.DEG2RAD); 
			    		}
			    			
			    		for(j = 0; j<this.selectedTextures.length; j++){
			    			sprite = this.selectedTextures[j];
			    			sprite.rotation = controller.targetValue;
			    		}
			    	}else if(controller.property == "group" && controller.targetValue != "-"){
			    		//body & sprite
			    		for(j = 0; j<this.selectedPhysicsBodies.length; j++){
			    			body = this.selectedPhysicsBodies[j];
			    			body.myGraphic.data.group = controller.targetValue;
			    		}
			    			
			    		for(j = 0; j<this.selectedTextures.length; j++){
			    			sprite = this.selectedTextures[j];
			    			sprite.data.group = controller.targetValue;
			    		}
			    	}else if(controller.property == "refName" && controller.targetValue != "-"){
			    		//body & sprite
			    		for(j = 0; j<this.selectedPhysicsBodies.length; j++){
			    			body = this.selectedPhysicsBodies[j];
			    			body.myGraphic.data.refName = controller.targetValue;
			    		}
			    			
			    		for(j = 0; j<this.selectedTextures.length; j++){
			    			sprite = this.selectedTextures[j];
			    			sprite.data.refName = controller.targetValue;
			    		}
			    	}else if(controller.property == "colorFill"){
			    		//body
			    		for(j = 0; j<this.selectedPhysicsBodies.length; j++){
				    		body = this.selectedPhysicsBodies[j];
				    		body.myGraphic.data.colorFill = controller.targetValue.toString();
				    		var fixture = body.GetFixtureList();
				    		this.updatePolyShape(body.myGraphic, fixture.GetShape(), body.myGraphic.data.colorFill, body.myGraphic.data.colorLine);
				    	}

			    	}else if(controller.property == "colorLine"){
			    		//body
			    		for(j = 0; j<this.selectedPhysicsBodies.length; j++){
					    	body = this.selectedPhysicsBodies[j];
				    		body.myGraphic.data.colorLine = controller.targetValue.toString();
				    		var fixture = body.GetFixtureList();
				    		this.updatePolyShape(body.myGraphic, fixture.GetShape(), body.myGraphic.data.colorFill, body.myGraphic.data.colorLine);
			    		}
			    	}else if(controller.property == "fixed"){
			    		//body
			    		for(j = 0; j<this.selectedPhysicsBodies.length; j++){
			    			body = this.selectedPhysicsBodies[j];
				    		body.myGraphic.data.fixed = controller.targetValue;
				    		if(body.myGraphic.data.fixed) body.SetType(b2Body.b2_staticBody);
				    		else body.SetType(b2Body.b2_dynamicBody);
				    		//awake fix
				    		body.SetAwake(body.myGraphic.data.awake);
			    		}

			    	}else if(controller.property == "awake"){
			    		//body
			    		for(j = 0; j<this.selectedPhysicsBodies.length; j++){
				    		body = this.selectedPhysicsBodies[j];
				    		body.myGraphic.data.awake = controller.targetValue;
				    		body.SetAwake(false);
				    	}
			    	}else if(controller.property == "density"){
			    		//body
			    		for(j = 0; j<this.selectedPhysicsBodies.length; j++){
					    	body = this.selectedPhysicsBodies[j];
				    		body.myGraphic.data.density = controller.targetValue;
				    		var fixture = body.GetFixtureList();
				    		fixture.SetDensity(controller.targetValue);
				    		body.ResetMassData();
				    	}
			    	}else if(controller.property == "collision"){
			    		//body
			    		for(j = 0; j<this.selectedPhysicsBodies.length; j++){
					    	body = this.selectedPhysicsBodies[j];
				    		body.myGraphic.data.collision = controller.targetValue;
				    		this.setBodyCollision(body, controller.targetValue);
				    	}
			    	}

			    }
			    if(controller.__input !== document.activeElement &&
			    	(controller.domElement.children[0].children && controller.domElement.children[0].children[0] !== document.activeElement)){
			   		controller.updateDisplay();
				}
			}
			if(this.editorGUI.editData.type == this.object_BODY){
				var pos = this.selectedPhysicsBodies[0].GetPosition();
				this.editorGUI.editData.x = pos.x*this.PTM;
				this.editorGUI.editData.y = pos.y*this.PTM;
				this.editorGUI.editData.rotation = this.selectedPhysicsBodies[0].GetAngle()*this.RAD2DEG;
			}else{
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

	this.doVerticesDrawing = function(){
		this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);
		this.debugGraphics.beginFill(this.verticesFillColor, 0.5);

		var i = 0;
		var newVertice;
		var activeVertice;
		var previousVertice;

		this.closeDrawing = false;

		if(this.activeVertices.length>0){
			newVertice = {x:this.mousePosWorld.x, y:this.mousePosWorld.y}
			activeVertice = this.activeVertices[this.activeVertices.length-1];

			if(this.activeVertices.length>1){

				previousVertice = this.activeVertices[this.activeVertices.length-2];
				// compare mouse base angle with mouse previous angle
				var difference1 = {x:newVertice.x-previousVertice.x, y:newVertice.y-previousVertice.y};
				var angle1 = Math.atan2(difference1.y, difference1.x)*this.RAD2DEG;

				var difference2 = {x:activeVertice.x-previousVertice.x, y:activeVertice.y-previousVertice.y};
				var angle2 = Math.atan2(difference2.y, difference2.x)*this.RAD2DEG;

				var d = Math.abs(angle1 - angle2) % 360; 
				var r = d > 180 ? 360 - d : d;
				var sign = (angle1 - angle2 >= 0 && angle1 - angle2 <= 180) || (angle1 - angle2 <=-180 && angle1- angle2>= -360) ? 1 : -1; 

		        var angleDirection = r*sign;
		        //now we know the angle direction

		       	// lets see now compared to our first vertice
		       	var difference3 = {x:newVertice.x-activeVertice.x, y:newVertice.y-activeVertice.y};
		        var angle3 = Math.atan2(difference3.y, difference3.x)*this.RAD2DEG;

		        var difference4 = {x:this.activeVertices[0].x-activeVertice.x, y:this.activeVertices[0].y-activeVertice.y};
		        var angle4 = Math.atan2(difference4.y, difference4.x)*this.RAD2DEG;

		        d = Math.abs(angle3 - angle4) % 360; 
				r = d > 180 ? 360 - d : d;
				sign = (angle3 - angle4 >= 0 && angle3 - angle4 <= 180) || (angle3 - angle4 <=-180 && angle3- angle4>= -360) ? 1 : -1; 

				var angleToBaseDirection = r*sign;

				this.correctDrawVertice = false;
		        if(angleDirection>=0){

		        	//angle going in wrong direction
		        	this.debugGraphics.lineStyle(1, 0xFF0000, 1);

		        	var hypLength = Math.sqrt(difference3.x*difference3.x+difference3.y*difference3.y);
		        	var tarAdjucentLengthExtension = Math.cos((angle3-angle2)*this.DEG2RAD)*hypLength;
		        	var tarAdjucentLength = Math.sqrt(difference2.x*difference2.x+difference2.y*difference2.y)+tarAdjucentLengthExtension;

		        	newVertice = {x:previousVertice.x+tarAdjucentLength*Math.cos(angle2 * this.DEG2RAD ), y:previousVertice.y+tarAdjucentLength*Math.sin(angle2*this.DEG2RAD)};
		        	this.correctedDrawVerticePosition = newVertice;
		        	this.correctDrawVertice = true;

		        }


		        //calculate if we can still close
		        if(this.activeVertices.length>2){

			        if(angleDirection < 0 && angleToBaseDirection <=0){
			        	this.debugGraphics.lineStyle(1, 0xFFFF00, 1);
			        	this.closeDrawing = true;
			        }

			        var ccw = function(A, B, C){ return (C.y-A.y) * (B.x-A.x) > (B.y-A.y) * (C.x-A.x)};
					var intersect = function(A,B,C,D){ return ccw(A,C,D) != ccw(B,C,D) && ccw(A,B,C) != ccw(A,B,D)};

					var checkBaseSegmentNextVertice = this.activeVertices[1];
					var checkBaseSegmentVertice = this.activeVertices[0];
					var checkBaseAngle = Math.atan2(checkBaseSegmentNextVertice.y-checkBaseSegmentVertice.y, checkBaseSegmentNextVertice.x-checkBaseSegmentVertice.x);
					var imaginaryDistance = 10000;
					var imaginaryVerticeOnBaseSegment = {x:checkBaseSegmentVertice.x-imaginaryDistance*Math.cos(checkBaseAngle), y:checkBaseSegmentVertice.y-imaginaryDistance*Math.sin(checkBaseAngle)};
			 			
					//this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(newVertice).x, this.getPIXIPointFromWorldPoint(newVertice).y);
					//this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(imaginaryVerticeOnBaseSegment).x, this.getPIXIPointFromWorldPoint(imaginaryVerticeOnBaseSegment).y);


		 			if(intersect(checkBaseSegmentNextVertice, imaginaryVerticeOnBaseSegment, newVertice, activeVertice)){
		 				this.debugGraphics.lineStyle(1, 0xFF00FF, 1);
		 				this.closeDrawing = true;
		 			}
				}

			}
			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(newVertice).x, this.getPIXIPointFromWorldPoint(newVertice).y);

			this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(newVertice).x, this.getPIXIPointFromWorldPoint(newVertice).y, this.verticesBulletRadius, 0, 2 * Math.PI, false);

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(newVertice).x, this.getPIXIPointFromWorldPoint(newVertice).y);

			this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(activeVertice).x, this.getPIXIPointFromWorldPoint(activeVertice).y);
		}
		previousVertice = null;


		for(i =0; i<this.activeVertices.length; i++){

			activeVertice = this.activeVertices[i];

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x+this.verticesBulletRadius, this.getPIXIPointFromWorldPoint(activeVertice).y);
			this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(activeVertice).x, this.getPIXIPointFromWorldPoint(activeVertice).y, this.verticesBulletRadius, 0, 2 * Math.PI, false);
			
			if(i>0) previousVertice = this.activeVertices[i-1];

			if(previousVertice){
				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x, this.getPIXIPointFromWorldPoint(activeVertice).y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(previousVertice).x, this.getPIXIPointFromWorldPoint(previousVertice).y);
			}
		}

		this.debugGraphics.endFill();

	}
	this.createBodyObjectFromVerts = function(verts){
		var bodyObject = new this.bodyObject;

		var i = 0;
		var centerPoint = {x:0, y:0};
		var vert;
		for(i = 0; i<verts.length; i++){
			vert = verts[i];
			centerPoint = {x:centerPoint.x+vert.x, y:centerPoint.y+vert.y};
		}
		centerPoint = {x:centerPoint.x/verts.length, y:centerPoint.y/verts.length};

		for(i = 0; i<verts.length; i++){
			verts[i] = {x:verts[i].x-centerPoint.x, y:verts[i].y-centerPoint.y}; 
		}

		bodyObject.x = centerPoint.x;
		bodyObject.y = centerPoint.y;
		bodyObject.vertices = verts.reverse();

       	console.log(JSON.stringify(bodyObject));

       	return bodyObject;

	}
	this.buildTextureFromObj = function(obj){
		var sprite = new PIXI.Sprite(PIXI.Texture.fromFrame(obj.textureName));
		sprite.pivot.set(sprite.width/2, sprite.height/2);
		this.textures.addChild(sprite);
		sprite.x = obj.x;
		sprite.y = obj.y;
		sprite.rotation = obj.rotation;
		sprite.data = obj;

		if(sprite.data.bodyID != undefined){
			var body = this.textures.getChildAt(sprite.data.bodyID).myBody;
			this.setTextureToBody(body, sprite, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}
		//handle groups and ref names
		if(obj.group != ""){
			if(this.editorObjectLookup[obj.group] == undefined){
				this.editorObjectLookup[obj.group] = new this.lookupObject;
			}
			this.editorObjectLookup[obj.group]._textures.push(sprite);
		}

	}
	this.buildBodyFromObj = function(obj){
		var i = 0;
		var vert;
		var b2Vec2Arr =[];

		for(i = 0; i<obj.vertices.length; i++){
			vert = obj.vertices[i];
			b2Vec2Arr.push(new b2Vec2(vert.x, vert.y));
		}


		var fixDef = new b2FixtureDef;
	    fixDef.density = obj.density;
	    fixDef.friction = 0.5;
	    fixDef.restitution = 0.2;


		var bd = new b2BodyDef();

		if(obj.fixed) bd.type = b2Body.b2_staticBody;
		else bd.type = b2Body.b2_dynamicBody;

    	var body = this.world.CreateBody(bd);

    	body.SetAwake(obj.awake);

        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsArray(b2Vec2Arr, b2Vec2Arr.length);

        var fixture = body.CreateFixture(fixDef);
        body.SetPositionAndAngle(new b2Vec2(obj.x, obj.y), 0);

        body.SetAngle(obj.rotation);

        var graphic = new PIXI.Graphics();
        this.textures.addChild(graphic);
		body.myGraphic = graphic
		this.updatePolyShape(body.myGraphic, fixDef.shape, obj.colorFill, obj.colorLine);

		body.myGraphic.myBody = body;
		body.myGraphic.data = obj;


		this.setBodyCollision(body, obj.collision);


		if(obj.group != ""){
			if(this.editorObjectLookup[obj.group] == undefined){
				this.editorObjectLookup[obj.group] = new this.lookupObject;
			}
			this.editorObjectLookup[obj.group]._bodies.push(body);
		}


	}
	this.setBodyCollision = function(body, collision){
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

		if(fixture.GetType() == b2Body.b2_staticBody) filterData.categoryBits = this.MASKBIT_FIXED;
		else filterData.categoryBits = this.MASKBIT_NORMAL;
		filterData.maskBits = this.MASKBIT_ONLY_US;
		
		if(collision == 1){
			filterData.maskBits = this.MASKBIT_CHARACTER | this.MASKBIT_ONLY_US;
		}else if(collision == 2){
			fixture.SetSensor(true);
		}else if(collision == 3){
			filterData.categoryBits = this.MASKBIT_EVERYTHING_BUT_US;
			filterData.maskBits = this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_ONLY_US;
		}else if(collision == 4){
			filterData.categoryBits = this.MASKBIT_ONLY_US;
		}else if(collision == 5){
			filterData.maskBits = this.MASKBIT_NORMAL | this.MASKBIT_CHARACTER | this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_ONLY_US;
		}else if(collision == 6){
			filterData.maskBits = this.MASKBIT_NORMAL | this.MASKBIT_FIXED | this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_ONLY_US;
		}

		fixture.SetFilterData(filterData);
		//
	}

 
	this.attachJointPlaceHolder = function(obj){


		var tarObj;
		var bodies = [];

		if(obj){
			tarObj = obj;
			bodies.push(this.textures.getChildAt(tarObj.bodyA_ID).myBody);

			if(tarObj.bodyB_ID != undefined){
				bodies.push(this.textures.getChildAt(tarObj.bodyB_ID).myBody);
			}

		}else{
			tarObj = new this.jointObject;
			bodies = this.queryWorldForBodies(this.mousePosWorld, this.mousePosWorld);

			if(bodies.length == 0) return;

			tarObj.bodyA_ID = bodies[0].myGraphic.parent.getChildIndex(bodies[0].myGraphic);

			if(bodies.length>1){
				tarObj.bodyB_ID = bodies[1].myGraphic.parent.getChildIndex(bodies[1].myGraphic);
			}

			tarObj.jointType = 	this.jointObject_TYPE_PIN;
			tarObj.x = this.mousePosWorld.x*this.PTM;
			tarObj.y = this.mousePosWorld.y*this.PTM
		}

		var jointGraphics = new PIXI.Sprite(PIXI.Texture.fromFrame('pinJoint'));
		this.textures.addChild(jointGraphics);

		jointGraphics.pivot.set(jointGraphics.width/2, jointGraphics.height/2);

		jointGraphics.bodies = bodies;

		bodies[0].myJoint = jointGraphics;
		if(bodies.length>1) bodies[1].myJoint = jointGraphics;

		jointGraphics.data = tarObj;

		jointGraphics.x = tarObj.x;
		jointGraphics.y = tarObj.y;


		if(tarObj.group != ""){
			if(this.editorObjectLookup[tarObj.group] == undefined){
				this.editorObjectLookup[tarObj.group] = new this.lookupObject;
			}
			this.editorObjectLookup[tarObj.group]._textures.push(jointGraphics);
		}

	}

	this.attachJoint = function(jointPlaceHolder){
		var bodyA = this.textures.getChildAt(jointPlaceHolder.bodyA_ID).myBody;
		var bodyB;
		if(jointPlaceHolder.bodyB_ID != null){

			bodyB = this.textures.getChildAt(jointPlaceHolder.bodyB_ID).myBody;
		}else{
			//pin to background

			var fixDef = new b2FixtureDef;
		    fixDef.density = 1.0;
		    fixDef.friction = 0.5;
		    fixDef.restitution = 0.2;

			var bd = new b2BodyDef();
			bd.type = b2Body.b2_staticBody;
	    	bodyB = this.world.CreateBody(bd);
	    	bodyB.SetPosition(new b2Vec2(jointPlaceHolder.x/this.PTM, jointPlaceHolder.y/this.PTM));


	        fixDef.shape = new b2PolygonShape;
	        fixDef.shape.SetAsBox(1, 1);

	        var fixture = bodyB.CreateFixture(fixDef);
		}
		var joint;

		if(jointPlaceHolder.jointType == this.jointObject_TYPE_PIN || jointPlaceHolder.jointType == this.jointObject_TYPE_SLIDE){
			var revoluteJointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef;
			
			revoluteJointDef.Initialize(bodyA, bodyB, new b2Vec2(jointPlaceHolder.x/this.PTM, jointPlaceHolder.y/this.PTM));
			revoluteJointDef.collideConnected = jointPlaceHolder.collideConnected;
			revoluteJointDef.referenceAngle = 0.0;
			revoluteJointDef.lowerAngle = jointPlaceHolder.lowerAngle*this.DEG2RAD;
			revoluteJointDef.upperAngle = jointPlaceHolder.upperAngle*this.DEG2RAD;
			revoluteJointDef.maxMotorTorque = jointPlaceHolder.maxMotorTorque;
			revoluteJointDef.motorSpeed = jointPlaceHolder.motorSpeed;
			revoluteJointDef.enableLimit = jointPlaceHolder.enableLimit;
			revoluteJointDef.enableMotor = jointPlaceHolder.enableMotor;


			joint = this.world.CreateJoint(revoluteJointDef);
		}else if(jointPlaceHolder.jointType == this.jointObject_TYPE_DISTANCE){
			var distanceJointDef = new Box2D.Dynamics.Joints.b2DistanceJointDef;
			distanceJointDef.Initialize(bodyA, bodyB, new b2Vec2(jointPlaceHolder.x/this.PTM, jointPlaceHolder.y/this.PTM), new b2Vec2(jointPlaceHolder.x/this.PTM, jointPlaceHolder.y/this.PTM));
			distanceJointDef.frequencyHz = jointPlaceHolder.frequencyHz;
      		distanceJointDef.dampingRatio = jointPlaceHolder.dampingRatio;

      		joint = this.world.CreateJoint(distanceJointDef);
		}
		return joint;
	}


	this.anchorTextureToBody = function(){
		var bodies = this.queryWorldForBodies(this.mousePosWorld, this.mousePosWorld);
		var textures = this.queryWorldForGraphics(this.mousePosWorld, this.mousePosWorld, true, 1);

		if(bodies.length >0 && textures.length>0){
			// lets mold these fuckers to eachother

			var body = bodies[0];
			var texture = textures[0];


			if(!body.myTexture && !texture.myBody){
				var dif = new b2Vec2(texture.x - body.GetPosition().x*this.PTM, texture.y - body.GetPosition().y*this.PTM);
				var angleOffset = body.GetAngle()-Math.atan2(dif.y, dif.x);				
				var angle = body.GetAngle()-texture.rotation;
				this.setTextureToBody(body, texture, dif.Length(), angleOffset, angle);

			}else if(body.myTexture && texture.myBody){
				if(body.myTexture == texture){
					this.removeTextureFromBody(body);
				}
			}

		}
	}
	this.setTextureToBody = function(body, texture, positionOffsetLength, positionOffsetAngle, offsetRotation){
		body.myTexture = texture;
		texture.data.bodyID = body.myGraphic.data.ID;
		texture.data.texturePositionOffsetLength = positionOffsetLength;
		texture.data.texturePositionOffsetAngle = positionOffsetAngle;
		texture.data.textureAngleOffset = offsetRotation;
		body.myGraphic.visible = false;
		texture.myBody = body;
	}
	this.removeTextureFromBody = function(body){
		body.myTexture = null;
		texture.data.bodyID = null;
		texture.data.texturePositionOffsetLength = null;
		texture.data.texturePositionOffsetAngle = null;
		texture.data.textureAngleOffset = null;
		body.myGraphic.visible = true;
		texture.myBody = null;
	}

	this.updatePolyShape = function (graphic, poly, colorFill, colorLine){

		var color;
		color = colorFill.slice(1);
		var colorFillHex = parseInt(color, 16); 
		color = colorLine.slice(1);
		var colorLineHex = parseInt(color, 16);


		graphic.clear();
		graphic.boundsPadding = 0;

		graphic.lineStyle(1, colorLineHex, 1);
		graphic.beginFill(colorFillHex, 1);

		var count = poly.GetVertexCount();

		var vertices = poly.GetVertices();

		var startPoint = vertices[0];

		graphic.moveTo(this.getPIXIPointFromWorldPoint(startPoint).x, this.getPIXIPointFromWorldPoint(startPoint).y);

		var i;
		var nextPoint;
		for(i = 1; i<count; i++){
			nextPoint = vertices[i];
			graphic.lineTo(this.getPIXIPointFromWorldPoint(nextPoint).x, this.getPIXIPointFromWorldPoint(nextPoint).y);
		}
		graphic.lineTo(this.getPIXIPointFromWorldPoint(startPoint).x, this.getPIXIPointFromWorldPoint(startPoint).y);
		graphic.endFill();
		graphic.originalGraphic = true;

		return graphic;

	}

	this.stringifyWorldJSON = function(){

		this.worldJSON = '{"objects":[';
		var sprite;
		var spriteData;
		for(i = 0; i<this.textures.children.length; i++){
			if(i != 0) this.worldJSON += ',';
			sprite = this.textures.getChildAt(i);
			
			this.updateObject(sprite, sprite.data);
			this.worldJSON += JSON.stringify(sprite.data);
		}
		this.worldJSON += ']}';

		console.log(this.worldJSON);
	}

	this.updateObject = function(sprite, data){

		if(data.type == this.object_BODY){
			data.x = sprite.myBody.GetPosition().x;
			data.y = sprite.myBody.GetPosition().y;
			data.rotation = sprite.myBody.GetAngle();			
		}else if(data.type == this.object_TEXTURE){
			data.x = sprite.x;
			data.y = sprite.y;
			data.rotation = sprite.rotation;
			if(data.bodyID != undefined) data.bodyID = sprite.myBody.myGraphic.parent.getChildIndex(sprite.myBody.myGraphic);
			
		}else if(data.type == this.object_JOINT){

			data.bodyA_ID = sprite.bodies[0].myGraphic.parent.getChildIndex(sprite.bodies[0].myGraphic);
			if(sprite.bodies.length>1) data.bodyB_ID = sprite.bodies[1].myGraphic.parent.getChildIndex(sprite.bodies[1].myGraphic);
			data.x = sprite.x;
			data.y = sprite.y;
		}
		data.ID = sprite.parent.getChildIndex(sprite);
	}

	this.parseAndBuildJSON = function(json){

		var startChildIndex = this.textures.children.length;

		if(json != null && json != ""){
			var worldObjects = JSON.parse(json);

			var i;
			var obj;
			for(i = 0; i<worldObjects.objects.length; i++){
				obj = worldObjects.objects[i];
				obj.ID += startChildIndex;

				if(obj.type == this.object_BODY){
					this.buildBodyFromObj(obj);	
				}else if(obj.type == this.object_TEXTURE){
					if(obj.bodyID != undefined){
						obj.bodyID += startChildIndex;
					}
					this.buildTextureFromObj(obj);
				}else if(obj.type == this.object_JOINT){
					obj.bodyA_ID += startChildIndex;
					if(obj.bodyB_ID != undefined) obj.bodyB_ID += startChildIndex;

					this.attachJointPlaceHolder(obj);
				}

			}
		}

	}
	this.drawBox = function(target, x, y, width, height, lineColor, lineSize, lineAlpha, fillColor, fillAlpha){

		if(lineSize == undefined) lineSize = 1;
		if(lineAlpha == undefined) lineAlpha = 1;
		if(fillAlpha == undefined) fillAlpha = 1;

		if(fillColor != undefined) target.beginFill(fillColor, fillAlpha);


		target.lineStyle(lineSize, lineColor, lineAlpha);
		target.moveTo(x, y);
		target.lineTo(x+width, y);
		target.lineTo(x+width, y+height);
		target.lineTo(x, y+height);
		target.lineTo(x, y);

		if(fillColor != undefined) target.endFill();
	}

	this.resetEditor = function(){
		this.editing = true;
		this.editorMode = this.editorMode_SELECTION;

		this.selectedPhysicsBodies = [];
		this.selectedTextures = [];
		this.selectedBoundingBox = null;
		this.startSelectionPoint = null;
		this.oldMousePosWorld = null;
		this.mouseDown = false;


		//Destroy all bodies
		var body = this.world.GetBodyList();
	    var i = 0
	    while(body){
	    	var b = body;
	        this.world.DestroyBody(b);
	       	body = body.GetNext();
	    }

	    //Destroy all graphics

	    for(i = 0; i<this.textures.children.length; i++){
			var sprite = this.textures.getChildAt(i);
			sprite.parent.removeChild(sprite);
			sprite.destroy({children:true, texture:false, baseTexture:false});
			i--;
		}

		//reset gui
		if(this.editorGUI != undefined){
			this.customGUIContainer.removeChild(this.editorGUI.domElement);
			this.editorGUI = null;
		}

		this.parseAndBuildJSON(this.worldJSON);

	}
	this.runWorld = function(){
		this.debugGraphics.clear();
		this.editing = false;

		var spritesToDestroy = [];
		var sprite;

		this.objectLookup = {};
		this.editorObjectLookup = {};

		for(i = 0; i<this.textures.children.length; i++){
			sprite = this.textures.getChildAt(i);
			if(sprite.data.type == this.object_JOINT){

				sprite.data.bodyA_ID = sprite.bodies[0].myGraphic.parent.getChildIndex(sprite.bodies[0].myGraphic);
				if(sprite.bodies.length>1) sprite.data.bodyB_ID = sprite.bodies[1].myGraphic.parent.getChildIndex(sprite.bodies[1].myGraphic);
				this.updateObject(sprite, sprite.data);

				var joint = this.attachJoint(sprite.data);
				spritesToDestroy.push(sprite);

				//
				//add to live group
				if(sprite.data.group != ""){
					if(this.objectLookup[sprite.data.group] == undefined){
						this.objectLookup[sprite.data.group] = new this.lookupObject;
					}
					this.objectLookup[sprite.data.group]._joints.push(joint);

					if(sprite.data.refName != ""){
						this.objectLookup[sprite.data.group][sprite.data.refName] = joint;
					}
				}
				//


			}else if(sprite.data.type == this.object_BODY){
				//
				//add to live group
				if(sprite.data.group != ""){
					if(this.objectLookup[sprite.data.group] == undefined){
						this.objectLookup[sprite.data.group] = new this.lookupObject;
					}
					this.objectLookup[sprite.data.group]._bodies.push(sprite.myBody);

					if(sprite.data.refName != ""){
						this.objectLookup[sprite.data.group][sprite.data.refName] = sprite.myBody;
					}
				}
				//

			}else if(sprite.data.type == this.object_TEXTURE){
				if(sprite.myBody == undefined){
					//
					//add to live group
					if(sprite.data.group != ""){
						if(this.objectLookup[sprite.data.group] == undefined){
							this.objectLookup[sprite.data.group] = new this.lookupObject;
						}
						this.objectLookup[sprite.data.group]._textures.push(sprite);

						if(sprite.data.refName != ""){
							this.objectLookup[sprite.data.group][sprite.data.refName] = sprite;
						}
					}
					//

				}

			}
		}
		for(i = 0; i<spritesToDestroy.length; i++){
			sprite = spritesToDestroy[i];
			sprite.parent.removeChild(sprite);
			sprite.destroy({children:true, texture:false, baseTexture:false});
		}
		this.editing = false;
	}

	this.zoom = function(pos, isZoomIn) {

	    var direction = isZoomIn ? 1 : -1;

	    var factor = (1 + direction * 0.1);

		  var worldPos = {x: (pos.x), y: (pos.y)};
		  var newScale = {x: this.container.scale.x * factor, y: this.container.scale.y * factor};
		  
		  var newScreenPos = {x: (worldPos.x ) * newScale.x + this.container.x, y: (worldPos.y) * newScale.y + this.container.y};

		  this.container.x -= (newScreenPos.x-(pos.x*this.container.scale.x+this.container.x)) ;
		  this.container.y -= (newScreenPos.y-(pos.y*this.container.scale.y+this.container.y)) ;
		  this.container.scale.x = newScale.x;
		  this.container.scale.y = newScale.y;
	}

	this.getWorldPointFromPixelPoint = function(pixelPoint) {
    	return new b2Vec2(((pixelPoint.x-this.container.x)/this.container.scale.x)/this.PTM,((pixelPoint.y-this.container.y)/this.container.scale.y)/this.PTM);
	}
	this.getPIXIPointFromWorldPoint = function(worldPoint){
	    return new b2Vec2(worldPoint.x * this.PTM, worldPoint.y*this.PTM);
	}



	//CONSTS
	this.editorMode_DRAWVERTICES = "drawVertices";
	this.editorMode_SELECTION = "selection";

	this.object_typeToName = ["Physics Body", "Texture", "Joint"];

	this.object_BODY = 0;
	this.object_TEXTURE = 1;
	this.object_JOINT = 2;

	this.jointObject_TYPE_PIN = 0;
	this.jointObject_TYPE_SLIDE = 1;
	this.jointObject_TYPE_DISTANCE = 2;

	this.mouseTransformType = 0;
	this.mouseTransformType_Movement = 0;
	this.mouseTransformType_Rotation = 1;


	this.DEG2RAD =  0.017453292519943296;
	this.RAD2DEG = 57.29577951308232;

	this.MASKBIT_NORMAL = 0x0001;
	this.MASKBIT_FIXED = 0x0002;
	this.MASKBIT_CHARACTER = 0x0003;
	this.MASKBIT_EVERYTHING_BUT_US = 0x0004;
	this.MASKBIT_ONLY_US = 0x0005;
	
}


