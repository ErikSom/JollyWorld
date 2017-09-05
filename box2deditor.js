function B2deEditor(){

	this.debugGraphics = null;
	this.textures = null;
	this.editorMode = ""
	this.editorGUI;
	this.customGUIContainer = document.getElementById('my-gui-container');

	this.selectedPhysicsBodies = [];
	this.selectedTextures = [];
	this.selectedBoundingBox;
	this.startSelectionPoint;

	this.oldMousePosWorld;

	this.assetLists = {};
	this.assetGUI;
	this.assetSelectedTexture ="";
	this.assetSelectedObject ="";
	this.worldJSON = '{"objects":[\
	{"x":13.5,"y":4.508333333333333,"rotation":0,"ID":0,"type":0,"textureID":null,"texturePositionOffsetLength":null,"texturePositionOffsetAngle":null,"textureAngleOffset":null,"colorFill":"#000000","colorLine":"#000000","fixed":false, "awake":true, "density":1, "group":"", "vertices":[{"x":1.6999999999999993,"y":0.49166666666666714},{"x":-0.3333333333333339,"y":1.4250000000000007},{"x":-1.1333333333333329,"y":-0.24166666666666625},{"x":-0.2333333333333325,"y":-1.6749999999999994}]},\
	{"x":14.908333333333335,"y":4.0166666666666675,"rotation":0,"ID":1,"type":0,"textureID":null,"texturePositionOffsetLength":null,"texturePositionOffsetAngle":null,"textureAngleOffset":null,"colorFill":"#000000","colorLine":"#000000","fixed":false, "awake":true, "density":1, "group":"","vertices":[{"x":2.658333333333335,"y":-2.3166666666666664},{"x":3.125,"y":-0.2833333333333323},{"x":-2.9749999999999996,"y":1.9166666666666679},{"x":-2.8083333333333336,"y":0.6833333333333336}]},\
	{"type":2,"jointType":0,"bodyA_ID":1,"bodyB_ID":0,"x":405,"y":134,"ID":2,"collideConnected":false,"motorSpeed":2,"maxMotorTorque":10,"enableMotor":true,"enableLimit":false,"upperAngle":0,"lowerAngle":0, "frequencyHz":0.0, "dampingRatio":0.0},\
	{"x":12.541666666666666,"y":11.691666666666666,"rotation":0,"ID":3,"type":0,"textureID":null,"texturePositionOffsetLength":null,"texturePositionOffsetAngle":null,"textureAngleOffset":null,"colorFill":"#000000","colorLine":"#000000","fixed":false, "awake":true, "density":1, "group":"","vertices":[{"x":6.3583333333333325,"y":-1.1583333333333332},{"x":6.691666666666668,"y":0.9416666666666664},{"x":-6.675,"y":1.0083333333333329},{"x":-6.374999999999999,"y":-0.7916666666666661}]},\
	{"jointType":0,"x":222,"y":358,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"type":2,"bodyA_ID":3,"ID":4,"frequencyHz":0.0, "dampingRatio":0.0},\
	{"jointType":0,"x":537,"y":354,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"type":2,"bodyA_ID":3,"ID":5, "frequencyHz":0.0, "dampingRatio":0.0},\
	{"x":7.459999999999999,"y":5.253333333333333,"rotation":0,"ID":6,"type":0,"colorFill":"#000000","colorLine":"#000000","fixed":false, "awake":true, "density":1, "group":"","vertices":[{"x":0.14000000000000057,"y":-0.45333333333333314},{"x":0.4733333333333345,"y":-0.3866666666666667},{"x":0.5400000000000009,"y":0.013333333333333641},{"x":0.4733333333333345,"y":0.3466666666666667},{"x":0.07333333333333414,"y":0.5466666666666669},{"x":-0.2599999999999989,"y":0.4800000000000004},\
	{"x":-0.4599999999999991,"y":0.21333333333333382},{"x":-0.4599999999999991,"y":-0.05333333333333279},{"x":-0.39333333333333265,"y":-0.25333333333333297},{"x":-0.12666666666666604,"y":-0.45333333333333314}]},{"x":223.98959350585932,"y":160.00000000000006,"rotation":0,"ID":7,"type":1,"textureName":"1head.png","bodyID":6,"texturePositionOffsetLength":2.4074770398623397,"texturePositionOffsetAngle":-1.4919627495569028,"textureAngleOffset":0}]}';
	this.copiedJSON = '';
	this.copyCenterPoint = {x:0, y:0};

	this.selectionBoxColor = "#5294AE";
	this.mouseDown = false;
	this.shiftDown = false;
	this.mouseDownOnInfo = false;



	this.load = function(loader){
		loader.add("assets/images/iconSet.json");
	}

	this.init = function(debugGraphics, textures){

		this.debugGraphics = debugGraphics;
		this.textures = textures;
		this.editorMode = this.editorMode_SELECTION;
		this.initGui();

	}

	this.initGui = function(){

		this.assetGUI = new dat.GUI({autoPlace:false, width:200});
		this.customGUIContainer.appendChild(this.assetGUI.domElement);
		this.assetGUI.addFolder('Asset Selection');

		folder = this.assetGUI.addFolder('Textures');
		var self = this;

		this.spawnTexture = function(){
		}

		folder.add(self, "assetSelectedTexture", this.assetLists.characters).onChange(function(value){}).name("Select");
		var but = folder.add(self, "spawnTexture").name("Spawn -->");
		this.spawnTexture = function (){ 
			if(self.assetSelectedTexture!= undefined && this.assetSelectedTexture != ""){
				var data = new self.textureObject;
				var rect = this.domElement.getBoundingClientRect();
				data.x = rect.right+50;
				data.y = rect.top+20; 
				data.textureName = self.assetSelectedTexture;

				self.buildTextureFromObj(data);

			}
		}.bind(but);
		
        canvas.focus();
        this.parseAndBuildJSON(this.worldJSON);
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

			this.editorGUI.editData.x = dataJoint.x*PTM;
			this.editorGUI.editData.y = dataJoint.y*PTM;
			this.editorGUI.editData.rotation = dataJoint.rotation;
			this.editorGUI.editData.colorFill = dataJoint.colorFill;
			this.editorGUI.editData.colorLine = dataJoint.colorLine;
			this.editorGUI.editData.fixed = dataJoint.fixed;
			this.editorGUI.editData.awake = dataJoint.awake;
			this.editorGUI.editData.density = dataJoint.density;

			var self = this;
			var controller;
			controller = this.editorGUI.add(self.editorGUI.editData, "x").onChange(function(value) {this.humanUpdate=true; this.targetValue=value-this.initialValue; this.initialValue = value;});
			//controller.domElement.style.pointerEvents = "none";
			console.log(controller);

			this.editorGUI.add(self.editorGUI.editData, "y").onChange(function(value) {this.humanUpdate=true; this.targetValue=value-this.initialValue; this.initialValue = value;});
			this.editorGUI.add(self.editorGUI.editData, "rotation").onChange(function(value) {this.humanUpdate=true; this.targetValue=value});

			controller = this.editorGUI.addColor(self.editorGUI.editData, "colorFill");
			controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value;}.bind(controller));
			controller = this.editorGUI.addColor(self.editorGUI.editData, "colorLine");
			controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value;}.bind(controller));

			this.editorGUI.add(self.editorGUI.editData, "fixed").onChange(function(value) {this.humanUpdate=true; this.targetValue=value});
			this.editorGUI.add(self.editorGUI.editData, "awake").onChange(function(value) {this.humanUpdate=true; this.targetValue=value});
			controller = this.editorGUI.add(self.editorGUI.editData, "density", 1, 1000);
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


			}else if(_selectedTextureJoints.length>0){
				// editing just texture joints


			}else{
				//only holding textures

			}

		}else if(this.selectedTextures.lenght>0 && this.selectedPhysicsBodies.length >0){
			//holding both bodies and textures
		}else{
			//holding nothing

			return;
		}

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


	        world.DestroyBody(b);
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
				this.copyCenterPoint.x += data.x*PTM;
				this.copyCenterPoint.y += data.y*PTM;

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
		var movX = this.copyCenterPoint.x-(mousePosWorld.x*PTM);
		var movY = this.copyCenterPoint.y-(mousePosWorld.y*PTM);

		for(i = startChildIndex; i<this.textures.children.length; i++){
			sprite = this.textures.getChildAt(i);
			if(sprite.myBody != undefined && sprite.data.type != this.object_TEXTURE){
				var pos = sprite.myBody.GetPosition();
				pos.x -= movX/PTM;
				pos.y -= movY/PTM;
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

		if(this.editorMode == this.editorMode_SELECTION){
			this.doSelection();
		}else if(this.editorMode == this.editorMode_DRAWVERTICES){
			this.doVerticesDrawing();
		}
		
	}


	this.run = function(){
		//update textures
	   var body = world.GetBodyList();
	   var i = 0
	   while(body){

	      if(body.myTexture){

	         var angle = body.GetAngle()-body.myTexture.data.texturePositionOffsetAngle;
	         body.myTexture.x = body.GetPosition().x*PTM +body.myTexture.data.texturePositionOffsetLength * Math.cos(angle);
	         body.myTexture.y = body.GetPosition().y*PTM +body.myTexture.data.texturePositionOffsetLength * Math.sin(angle);

	         body.myTexture.rotation = body.GetAngle()-body.myTexture.data.textureAngleOffset;

	      }else if(body.myGraphic){
	         body.myGraphic.x = body.GetPosition().x*PTM;
	         body.myGraphic.y = body.GetPosition().y*PTM;
	         body.myGraphic.rotation = body.GetAngle();
	      }
	      i++;
	      body = body.GetNext();
	    }
	}



	this.resetEditor = function(){
		this.editorMode = this.editorMode_IDLE;
	}

	this.bodyObject = function(){
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.ID = 0;
		this.type = myEditor.object_BODY;
		this.colorFill = "#999999";
		this.colorLine = "#000";
		this.fixed = false;
		this.awake = true;
		this.vertices = [{x:0, y:0}, {x:0, y:0}];
		this.density = 1;
		this.group = "";
	}
	this.textureObject = function(){
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.ID = 0;
		this.type = myEditor.object_TEXTURE;
		this.textureName = null;
		this.bodyID = null;
		this.texturePositionOffsetLength = null;
		this.texturePositionOffsetAngle = null;
		this.textureAngleOffset = null;
		this.group = "";
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
		this.type = myEditor.object_JOINT;
		this.group = "";
	}

	this.startVerticesDrawing = function(){
		this.resetEditor();
		this.editorMode = this.editorMode_DRAWVERTICES;
	}


	this.onMouseDown = function(canvas, evt) {

		if(this.editorMode == this.editorMode_SELECTION){

			this.startSelectionPoint = new b2Vec2(mousePosWorld.x, mousePosWorld.y);

			var aabb = new b2AABB;
			aabb.lowerBound.Set(mousePosWorld.x, mousePosWorld.y);
			aabb.upperBound.Set(mousePosWorld.x, mousePosWorld.y);


			if(!this.selectedBoundingBox.Contains(aabb) || this.shiftDown){
				//reset selectionie
				var oldSelectedPhysicsBodies = [];
				var oldSelectedTextures = [];

				if(this.shiftDown){
					oldSelectedPhysicsBodies = this.selectedPhysicsBodies;
					oldSelectedTextures = this.selectedTextures;
				}


				this.selectedPhysicsBodies = this.queryWorldForBodies(this.startSelectionPoint, mousePosWorld);
				if(this.selectedPhysicsBodies.length>0){
					var i;
					var body;
					var fixture;
					var pointInsideBody = false;
					for(i = 0; i<this.selectedPhysicsBodies.length; i++){
						body = this.selectedPhysicsBodies[i];
						fixture = body.GetFixtureList();
						
						while(fixture != null){
							if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePosWorld)) {
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
				this.selectedTextures = this.queryWorldForGraphics(this.startSelectionPoint, mousePosWorld, true, 1);


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

		}else if(this.editorMode == this.editorMode_DRAWVERTICES){
			if(!this.closeDrawing){
				if(this.correctDrawVertice && this.activeVertices.length>1){
					this.activeVertices[this.activeVertices.length-1] = {x:this.correctedDrawVerticePosition.x, y:this.correctedDrawVerticePosition.y};
				}else{
					this.activeVertices.push({x:mousePosWorld.x, y:mousePosWorld.y});
				}
			}else{

				var bodyObject = this.createBodyObjectFromVerts(this.activeVertices);
				this.buildBodyFromObj(bodyObject);
				this.activeVertices = [];
				this.editorMode = this.editorMode_SELECTION;
			}
		}
		this.mouseDown = true;
	}
	this.onMouseMove = function(canvas, evt) {
		if(this.oldMousePosWorld == null) this.oldMousePosWorld = mousePosWorld;


		if(this.editorMode == this.editorMode_SELECTION){
			if(this.mouseDown && !this.mouseDownOnInfo){
				if(this.selectedPhysicsBodies.length>0 || this.selectedTextures.length>0){
					var move = new b2Vec2(mousePosWorld.x-this.oldMousePosWorld.x, mousePosWorld.y-this.oldMousePosWorld.y);
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
							sprite.x = sprite.x+move.x*PTM;
							sprite.y = sprite.y+move.y*PTM;
						}else if(this.mouseTransformType == this.mouseTransformType_Rotation){
							sprite.rotation += move.x/10;
						}
					}
				}
			}
		}



		this.oldMousePosWorld = mousePosWorld;
	}
	this.onMouseUp = function(canvas, evt){
		if(this.editorMode == this.editorMode_SELECTION){
			if(this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0){
				this.selectedPhysicsBodies = this.queryWorldForBodies(this.startSelectionPoint, mousePosWorld);
				this.selectedTextures = this.queryWorldForGraphics(this.startSelectionPoint, mousePosWorld, true, 0);
				this.updateSelection();
			}
		}
		this.mouseDown = false;
		this.mouseDownOnInfo = false;
	}
	this.onKeyDown = function(e){
		if (e.keyCode == 80 ) {//p
	      if(!run){
	         this.stringifyWorldJSON();
	         this.prepareWorld();
	      }
	      run = !run;
	   }else if (e.keyCode == 68 ) {//d
	      this.startVerticesDrawing();
	   }else if (e.keyCode == 81 ) {//q
	      this.anchorTextureToBody();
	   }else if (e.keyCode == 74 ) {//j
	      this.attachJointPlaceHolder();
	   }else if (e.keyCode == 83 ) {//s
	      this.stringifyWorldJSON();
	   }else if (e.keyCode == 82){
	      this.resetWorld();
	      run = false;
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
	   }
	}
	this.onKeyUp = function(e){
		if(e.keyCode == 16){
			this.shiftDown = false;
	   		this.mouseTransformType = this.mouseTransformType_Movement;
	   }
	}


	this.queryPhysicsBodies = [];
	this.queryWorldForBodies = function(lowerBound, upperBound){
		var aabb = new b2AABB();

		aabb.lowerBound.Set((lowerBound.x < upperBound.x ?  lowerBound.x : upperBound.x), (lowerBound.y < upperBound.y ?  lowerBound.y : upperBound.y));
		aabb.upperBound.Set((lowerBound.x > upperBound.x ?  lowerBound.x : upperBound.x), (lowerBound.y > upperBound.y ?  lowerBound.y : upperBound.y));

		this.queryPhysicsBodies = [];
		world.QueryAABB(this.getBodyCB, aabb);
		return this.queryPhysicsBodies;
	}
	this.queryWorldForGraphics = function(lowerBound, upperBound, onlyTextures, limitResult){
		var aabb = new b2AABB();

		aabb.lowerBound.Set((lowerBound.x < upperBound.x ?  lowerBound.x : upperBound.x), (lowerBound.y < upperBound.y ?  lowerBound.y : upperBound.y));
		aabb.upperBound.Set((lowerBound.x > upperBound.x ?  lowerBound.x : upperBound.x), (lowerBound.y > upperBound.y ?  lowerBound.y : upperBound.y));

		var lowerBoundPixi = getPIXIPointFromWorldPoint(aabb.lowerBound);
		var upperBoundPixi = getPIXIPointFromWorldPoint(aabb.upperBound);

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
		myEditor.queryPhysicsBodies.push(fixture.GetBody());
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
				sprite = sprite.getBounds();
				var spriteAABB = new b2AABB;
				spriteAABB.lowerBound = new b2Vec2(sprite.x/PTM, sprite.y/PTM);
				spriteAABB.upperBound = new b2Vec2((sprite.x+sprite.width)/PTM, (sprite.y+sprite.height)/PTM);
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

			var lowerBoundPixi = getPIXIPointFromWorldPoint(aabb.lowerBound);
			var upperBoundPixi = getPIXIPointFromWorldPoint(aabb.upperBound);

			//Showing selection
			this.drawBox(this.debugGraphics, lowerBoundPixi.x, lowerBoundPixi.y, upperBoundPixi.x-lowerBoundPixi.x, upperBoundPixi.y-lowerBoundPixi.y, this.selectionBoxColor);
		}else{
			aabb = new b2AABB;

			//Making selection
			if(this.mouseDown) this.drawBox(this.debugGraphics, this.startSelectionPoint.x*PTM, this.startSelectionPoint.y*PTM, mousePosWorld.x*PTM-this.startSelectionPoint.x*PTM, mousePosWorld.y*PTM-this.startSelectionPoint.y*PTM, "#000000");
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
			    		console.log(controller.targetValue);
			    		for(j = 0; j<this.selectedPhysicsBodies.length; j++){
			    			body = this.selectedPhysicsBodies[j];
							var pos = body.GetPosition();
			    			pos.x +=  controller.targetValue/PTM;
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
			    			pos.y +=  controller.targetValue/PTM;
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
			    	}

			    }
			    if(controller.__input !== document.activeElement &&
			    	(controller.domElement.children[0].children && controller.domElement.children[0].children[0] !== document.activeElement)){
			   		controller.updateDisplay();
				}
			}
			if(this.editorGUI.editData.type == this.object_BODY){
				var pos = this.selectedPhysicsBodies[0].GetPosition();
				this.editorGUI.editData.x = pos.x*PTM;
				this.editorGUI.editData.y = pos.y*PTM;
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
			newVertice = {x:mousePosWorld.x, y:mousePosWorld.y}
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
			 			
					//this.debugGraphics.moveTo(getPIXIPointFromWorldPoint(newVertice).x, getPIXIPointFromWorldPoint(newVertice).y);
					//this.debugGraphics.lineTo(getPIXIPointFromWorldPoint(imaginaryVerticeOnBaseSegment).x, getPIXIPointFromWorldPoint(imaginaryVerticeOnBaseSegment).y);


		 			if(intersect(checkBaseSegmentNextVertice, imaginaryVerticeOnBaseSegment, newVertice, activeVertice)){
		 				this.debugGraphics.lineStyle(1, 0xFF00FF, 1);
		 				this.closeDrawing = true;
		 			}
				}

			}
			this.debugGraphics.moveTo(getPIXIPointFromWorldPoint(newVertice).x, getPIXIPointFromWorldPoint(newVertice).y);

			this.debugGraphics.arc(getPIXIPointFromWorldPoint(newVertice).x, getPIXIPointFromWorldPoint(newVertice).y, this.verticesBulletRadius, 0, 2 * Math.PI, false);

			this.debugGraphics.moveTo(getPIXIPointFromWorldPoint(newVertice).x, getPIXIPointFromWorldPoint(newVertice).y);

			this.debugGraphics.lineTo(getPIXIPointFromWorldPoint(activeVertice).x, getPIXIPointFromWorldPoint(activeVertice).y);
		}
		previousVertice = null;


		for(i =0; i<this.activeVertices.length; i++){

			activeVertice = this.activeVertices[i];

			this.debugGraphics.moveTo(getPIXIPointFromWorldPoint(activeVertice).x+this.verticesBulletRadius, getPIXIPointFromWorldPoint(activeVertice).y);
			this.debugGraphics.arc(getPIXIPointFromWorldPoint(activeVertice).x, getPIXIPointFromWorldPoint(activeVertice).y, this.verticesBulletRadius, 0, 2 * Math.PI, false);
			
			if(i>0) previousVertice = this.activeVertices[i-1];

			if(previousVertice){
				this.debugGraphics.moveTo(getPIXIPointFromWorldPoint(activeVertice).x, getPIXIPointFromWorldPoint(activeVertice).y);
				this.debugGraphics.lineTo(getPIXIPointFromWorldPoint(previousVertice).x, getPIXIPointFromWorldPoint(previousVertice).y);
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
		bd.type = b2Body.b2_dynamicBody;
    	var body = world.CreateBody(bd);

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
			bodies = this.queryWorldForBodies(mousePosWorld, mousePosWorld);

			if(bodies.length == 0) return;

			tarObj.bodyA_ID = bodies[0].myGraphic.parent.getChildIndex(bodies[0].myGraphic);

			if(bodies.length>1){
				tarObj.bodyB_ID = bodies[1].myGraphic.parent.getChildIndex(bodies[1].myGraphic);
			}

			tarObj.jointType = 	this.jointObject_TYPE_PIN;
			tarObj.x = mousePosWorld.x*PTM;
			tarObj.y = mousePosWorld.y*PTM
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
	    	bodyB = world.CreateBody(bd);
	    	bodyB.SetPosition(new b2Vec2(jointPlaceHolder.x/PTM, jointPlaceHolder.y/PTM));


	        fixDef.shape = new b2PolygonShape;
	        fixDef.shape.SetAsBox(1, 1);

	        var fixture = bodyB.CreateFixture(fixDef);
		}


		if(jointPlaceHolder.jointType == this.jointObject_TYPE_PIN || jointPlaceHolder.jointType == this.jointObject_TYPE_SLIDE){
			var revoluteJointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef;
			
			revoluteJointDef.Initialize(bodyA, bodyB, new b2Vec2(jointPlaceHolder.x/PTM, jointPlaceHolder.y/PTM));
			revoluteJointDef.collideConnected = jointPlaceHolder.collideConnected;
			revoluteJointDef.referenceAngle = 0.0;
			revoluteJointDef.lowerAngle = jointPlaceHolder.lowerAngle*this.DEG2RAD;
			revoluteJointDef.upperAngle = jointPlaceHolder.upperAngle*this.DEG2RAD;
			revoluteJointDef.maxMotorTorque = jointPlaceHolder.maxMotorTorque;
			revoluteJointDef.motorSpeed = jointPlaceHolder.motorSpeed;
			revoluteJointDef.enableLimit = jointPlaceHolder.enableLimit;
			revoluteJointDef.enableMotor = jointPlaceHolder.enableMotor;


			var joint = world.CreateJoint(revoluteJointDef);
		}else if(jointPlaceHolder.jointType == this.jointObject_TYPE_DISTANCE){
			var distanceJointDef = new Box2D.Dynamics.Joints.b2DistanceJointDef;
			distanceJointDef.Initialize(bodyA, bodyB, new b2Vec2(jointPlaceHolder.x/PTM, jointPlaceHolder.y/PTM), new b2Vec2(jointPlaceHolder.x/PTM, jointPlaceHolder.y/PTM));
			distanceJointDef.frequencyHz = jointPlaceHolder.frequencyHz;
      		distanceJointDef.dampingRatio = jointPlaceHolder.dampingRatio;

      		var joint = world.CreateJoint(distanceJointDef);
		}
	}


	this.anchorTextureToBody = function(){
		var bodies = this.queryWorldForBodies(mousePosWorld, mousePosWorld);
		var textures = this.queryWorldForGraphics(mousePosWorld, mousePosWorld, true, 1);

		if(bodies.length >0 && textures.length>0){
			// lets mold these fuckers to eachother

			var body = bodies[0];
			var texture = textures[0];


			if(!body.myTexture && !texture.myBody){
				var dif = new b2Vec2(texture.x - body.GetPosition().x*PTM, texture.y - body.GetPosition().y*PTM);
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

		console.log(colorFill);

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

		graphic.moveTo(getPIXIPointFromWorldPoint(startPoint).x, getPIXIPointFromWorldPoint(startPoint).y);

		var i;
		var nextPoint;
		for(i = 1; i<count; i++){
			nextPoint = vertices[i];
			graphic.lineTo(getPIXIPointFromWorldPoint(nextPoint).x, getPIXIPointFromWorldPoint(nextPoint).y);
		}
		graphic.lineTo(getPIXIPointFromWorldPoint(startPoint).x, getPIXIPointFromWorldPoint(startPoint).y);
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

	this.resetWorld = function(){
		this.editorMode = this.editorMode_SELECTION;

		this.selectedPhysicsBodies = [];
		this.selectedTextures = [];
		this.selectedBoundingBox = null;
		this.startSelectionPoint = null;
		this.oldMousePosWorld = null;
		this.mouseDown = false;


		//Destroy all bodies
		var body = world.GetBodyList();
	    var i = 0
	    while(body){
	    	var b = body;
	        world.DestroyBody(b);
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
	this.prepareWorld = function(){
		var spritesToDestroy = [];
		var sprite;

		for(i = 0; i<this.textures.children.length; i++){
			sprite = this.textures.getChildAt(i);
			if(sprite.data.type == this.object_JOINT){

				sprite.data.bodyA_ID = sprite.bodies[0].myGraphic.parent.getChildIndex(sprite.bodies[0].myGraphic);
				if(sprite.bodies.length>1) sprite.data.bodyB_ID = sprite.bodies[1].myGraphic.parent.getChildIndex(sprite.bodies[1].myGraphic);
				this.updateObject(sprite, sprite.data);

				this.attachJoint(sprite.data);
				spritesToDestroy.push(sprite);
			}
		}
		for(i = 0; i<spritesToDestroy.length; i++){
			sprite = spritesToDestroy[i];
			sprite.parent.removeChild(sprite);
			sprite.destroy({children:true, texture:false, baseTexture:false});
		}
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
}

