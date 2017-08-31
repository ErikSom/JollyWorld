function B2deEditor(){

	this.graphics = null;
	this.textures = null;
	this.editorMode_DRAWVERTICES = "drawVertices";
	this.editorMode_SELECTION = "selection";
	this.editorMode_DEFAULT = this.editorMode_SELECTION;
	this.editorMode = this.editorMode_DEFAULT;
	this.editorGUI;

	this.selectedPhysicsBodies = [];
	this.selectedTextures = [];
	this.selectedBoundingBox;
	this.startSelectionPoint;

	this.oldMousePosWorld;

	this.assetLists = {};

	this.worldJSON = '{"objects":[{"x":13.5,"y":4.508333333333333,"rotation":0,"ID":0,"type":0,"textureID":null,"texturePositionOffsetLength":null,"texturePositionOffsetAngle":null,"textureAngleOffset":null,"colorFill":null,"colorLine":null,"fixed":null,"vertices":[{"x":1.6999999999999993,"y":0.49166666666666714},{"x":-0.3333333333333339,"y":1.4250000000000007},{"x":-1.1333333333333329,"y":-0.24166666666666625},{"x":-0.2333333333333325,"y":-1.6749999999999994}]},{"x":14.908333333333335,"y":4.0166666666666675,"rotation":0,"ID":1,"type":0,"textureID":null,"texturePositionOffsetLength":null,"texturePositionOffsetAngle":null,"textureAngleOffset":null,"colorFill":null,"colorLine":null,"fixed":null,"vertices":[{"x":2.658333333333335,"y":-2.3166666666666664},{"x":3.125,"y":-0.2833333333333323},{"x":-2.9749999999999996,"y":1.9166666666666679},{"x":-2.8083333333333336,"y":0.6833333333333336}]},{"type":2,"jointType":0,"bodyA_ID":1,"bodyB_ID":0,"x":405,"y":134,"ID":2,"collideConnected":false,"motorSpeed":2,"maxMotorTorque":10,"enableMotor":true, "enableLimit":false,"upperAngle":0,"lowerAngle":0},{"x":12.541666666666666,"y":11.691666666666666,"rotation":0,"ID":3,"type":0,"textureID":null,"texturePositionOffsetLength":null,"texturePositionOffsetAngle":null,"textureAngleOffset":null,"colorFill":null,"colorLine":null,"fixed":null,"vertices":[{"x":6.3583333333333325,"y":-1.1583333333333332},{"x":6.691666666666668,"y":0.9416666666666664},{"x":-6.675,"y":1.0083333333333329},{"x":-6.374999999999999,"y":-0.7916666666666661}]},{"jointType":0,"x":222,"y":358,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"type":2,"bodyA_ID":3,"ID":4},{"jointType":0,"x":537,"y":354,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"type":2,"bodyA_ID":3,"ID":5}]}';



	this.object_typeToName = ["Physics Body", "Texture", "Joint"];

	this.object_BODY = 0;
	this.object_TEXTURE = 1;
	this.object_JOINT = 2;

	this.jointObject_TYPE_PIN = 0;
	this.jointObject_TYPE_SLIDE = 1;


	this.load = function(loader){
		loader.add("assets/images/iconSet.json");
	}

	this.init = function(graphics){

		this.graphics = graphics;
		this.initGui();

	}

	this.DEG2RAD =  0.017453292519943296;
	this.RAD2DEG = 57.29577951308232;


	this.selectionBoxColor = "0x5294AE";
	this.mouseDown = false;
	this.mouseDownOnInfo = false;

	this.initGui = function(){

        canvas.focus();
        this.parseAndBuildWorldJSON();


	}
	this.clickInsideGUI = function(){
		/*var i;
		var sprite;
		var bounds;

		for(i = 0; i<this.guiContainer.children.length; i++){
			sprite = this.guiContainer.getChildAt(i);
			bounds = sprite.getBounds();

			if(!sprite.visible) break;

			if(mousePosWorld.x > bounds.x / PTM &&
				mousePosWorld.x < (bounds.x+bounds.width) /PTM &&
				mousePosWorld.y > bounds.y /PTM &&
				mousePosWorld.y < (bounds.y+bounds.height) / PTM){
				return true;
			}

		}*/

		return false;
	}

	this.updateSelection = function(){
		//Joints
		var i;
		var customContainer = document.getElementById('my-gui-container');


		//reset
		if(this.editorGUI != undefined){
			customContainer.removeChild(this.editorGUI.domElement);
			this.editorGUI = null;
		}


		if(this.selectedPhysicsBodies.length>0 && this.selectedTextures.length == 0){
			// only holding physics bodies

		}else if(this.selectedTextures.length>0 && this.selectedPhysicsBodies.length == 0){
			var _selectedTextures = [];
			var _selectedPinJoints = [];
			var _selectedTextureJoints = [];
			var _texture;
			for(i = 0; i<this.selectedTextures.length; i++){
				_texture = this.selectedTextures[i];

				if(_texture.myBody){
					_selectedTextures.push(_texture);
				}else if(_texture.data && _texture.data.jointType == this.jointObject_TYPE_PIN){
					_selectedPinJoints.push(_texture);
				}else {
					_selectedTextures.push(_texture);
				}
			}

			var editingMultipleObjects = (_selectedTextures.length > 0 ? 1 : 0) + (_selectedPinJoints.length > 0 ? 1 : 0) + (_selectedTextureJoints.length > 0 ? 1 : 0);

			if(editingMultipleObjects>1){
				// editing multipleCrap


			}else if(_selectedTextures.length>0){
				// editing just textures


			}else if(_selectedPinJoints.length>0){
				// editing just pin joints
				this.editorGUI = new dat.GUI({autoPlace:false, width:200});
				customContainer.appendChild(this.editorGUI.domElement);
				this.editorGUI.addFolder('joint editor');

				this.editorGUI.editData = new this.jointObject;

				this.editorGUI.editData.collideConnected = _selectedPinJoints[0].data.collideConnected;
				this.editorGUI.editData.x = _selectedPinJoints[0].data.x;
				this.editorGUI.editData.y = _selectedPinJoints[0].data.y;
				this.editorGUI.editData.enableMotor = _selectedPinJoints[0].data.enableMotor;
				this.editorGUI.editData.maxMotorTorque = _selectedPinJoints[0].data.maxMotorTorque;
				this.editorGUI.editData.motorSpeed = _selectedPinJoints[0].data.motorSpeed;
				this.editorGUI.editData.enableLimit = _selectedPinJoints[0].data.enableLimit;
				this.editorGUI.editData.upperAngle = _selectedPinJoints[0].data.upperAngle;
				this.editorGUI.editData.lowerAngle = _selectedPinJoints[0].data.lowerAngle;

				console.log(_selectedPinJoints[0].data.enableLimit);

				var self = this.editorGUI;
				this.editorGUI.add(self.editData, "collideConnected").onChange(function(value) {this.humanUpdate=true; this.targetValue=value});
				this.editorGUI.add(self.editData, "x").onChange(function(value) {this.humanUpdate=true; this.targetValue=value});
				this.editorGUI.add(self.editData, "y").onChange(function(value) {this.humanUpdate=true; this.targetValue=value});

				var folder;
				var controller;

				folder = this.editorGUI.addFolder('enable motor');
				folder.add(self.editData, "enableMotor").onChange(function(value) {this.humanUpdate=true; this.targetValue=value;});
				
				controller = folder.add(self.editData, "maxMotorTorque", 0, 1000);
				controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value}.bind(controller));

				controller = folder.add(self.editData, "motorSpeed", -20, 20);
				controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value}.bind(controller));

				folder = this.editorGUI.addFolder('enable limits');
				folder.add(self.editData, "enableLimit").onChange(function(value) {this.humanUpdate=true; this.targetValue=value;});

				controller = folder.add(self.editData, "upperAngle", 0, 180);
				controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value; console.log("hotdamn");}.bind(controller));

				controller = folder.add(self.editData, "lowerAngle", -180, 0);
				controller.onChange(function(value) {this.humanUpdate=true; this.targetValue=value}.bind(controller));

				console.log(this.editorGUI);

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

				console.log("I HAVE A JOINT");
				var j;
				var alreadySelected = false;
				for(j = 0; j<this.selectedTextures.length; j++){
					if(this.selectedTextures[j] == b.myJoint){
						alreadySelected = true;
					}
				}
				if(!alreadySelected) this.selectedTextures.push(b.myJoint);
			}


	        world.DestroyBody(b);
	    }

	    //Destroy all selected graphics

	    for(i = 0; i<this.selectedTextures.length; i++){
	    	console.log(i+"  I");
			var sprite = this.selectedTextures[i];
			console.log(sprite.data);
			if(sprite.data && sprite.data.type == this.object_JOINT){
				console.log("IM A JOINT");
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

	         var angle = body.GetAngle()-body.myGraphic.data.texturePositionOffsetAngle;
	         body.myTexture.x = body.GetPosition().x*PTM +body.myGraphic.data.texturePositionOffsetLength * Math.cos(angle);
	         body.myTexture.y = body.GetPosition().y*PTM +body.myGraphic.data.texturePositionOffsetLength * Math.sin(angle);

	         body.myTexture.rotation = body.GetAngle()-body.myGraphic.data.textureAngleOffset;

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
		this.textureID = null;
		this.texturePositionOffsetLength = null;
		this.texturePositionOffsetAngle = null;
		this.textureAngleOffset = null;
		this.colorFill = null;
		this.colorLine = null;
		this.fixed = null;
		this.vertices = [{x:0, y:0}, {x:0, y:0}];
	}
	this.textureObject = function(){
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.ID = 0;
		this.type = myEditor.object_TEXTURE;
		this.textureName = null;
		this.resourceName = null;
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
		this.upperAngle = 0;
		this.lowerAngle = 0;
		this.type = myEditor.object_JOINT;
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


			var insideGui = this.clickInsideGUI();

			if(insideGui) this.mouseDownOnInfo = true;

			if(!insideGui && !this.selectedBoundingBox.Contains(aabb)){
				//reset selection
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
				this.editorMode = this.editorMode_DEFAULT;
			}
		}
		this.mouseDown = true;
	}
	this.onMouseMove = function(canvas, evt) {
		if(this.oldMousePosWorld == null) this.oldMousePosWorld = mousePosWorld;


		if(this.editorMode == this.editorMode_SELECTION){
			if(this.mouseDown && !this.mouseDownOnInfo){
				var move = new b2Vec2(mousePosWorld.x-this.oldMousePosWorld.x, mousePosWorld.y-this.oldMousePosWorld.y);
				console.log("dafuq "+move.x+"  "+move.y);
				var i;
				var body;
				for(i = 0; i<this.selectedPhysicsBodies.length; i++){
					body = this.selectedPhysicsBodies[i];
					var oldPosition = body.GetPosition();
					body.SetPosition(new b2Vec2(oldPosition.x+move.x, oldPosition.y+move.y));
				}
				var sprite;
				for(i = 0; i<this.selectedTextures.length; i++){
					sprite = this.selectedTextures[i];
					sprite.x = sprite.x+move.x*PTM;
					sprite.y = sprite.y+move.y*PTM;
				}
			}

		}



		this.oldMousePosWorld = mousePosWorld;
	}
	this.onMouseUp = function(canvas, evt){
		if(this.editorMode == this.editorMode_SELECTION){
			if(!this.clickInsideGUI() && this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0){
				this.selectedPhysicsBodies = this.queryWorldForBodies(this.startSelectionPoint, mousePosWorld);
				this.selectedTextures = this.queryWorldForGraphics(this.startSelectionPoint, mousePosWorld, true, 0);
				this.updateSelection();
			}
		}
		this.mouseDown = false;
		this.mouseDownOnInfo = false;
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
		for(i = 0; i<newTextureGraphics.children.length; i++){
			var sprite = newTextureGraphics.getChildAt(i);

			if(!onlyTextures || !sprite.myBody){


				if((   sprite.x+sprite.width/2 > upperBoundPixi.x
					&& sprite.x-sprite.width/2 < lowerBoundPixi.x
					&& sprite.y+sprite.height/2 > upperBoundPixi.y
					&& sprite.y-sprite.height/2 < lowerBoundPixi.y) 
				||(    lowerBoundPixi.x < sprite.x-sprite.width/2
					&& upperBoundPixi.x > sprite.x+sprite.width/2
					&& lowerBoundPixi.y < sprite.y-sprite.height/2
					&& upperBoundPixi.y > sprite.y+sprite.height/2))

				{
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


	this.doSelection = function(){
		
		// DRAW outer selection lines
		var aabb = new b2AABB;
		aabb.lowerBound = new b2Vec2(Number.MAX_VALUE,Number.MAX_VALUE);
		aabb.upperBound = new b2Vec2(-Number.MAX_VALUE,-Number.MAX_VALUE); 

		if(this.selectedPhysicsBodies.length>0){

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
		}

		if(this.selectedTextures.length>0){
			var i;
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
		}



		if(this.editorGUI && this.editorGUI.editData){
			if(this.editorGUI.editData instanceof this.jointObject){
				var controller;
				var controllers = [];
				controllers = controllers.concat(this.editorGUI.__controllers);

				for(var propt in this.editorGUI.__folders){
					controllers = controllers.concat(this.editorGUI.__folders[propt].__controllers);
				}


				for (var i in controllers) {
				    controller = controllers[i]

				    if(controller.humanUpdate){
				    	controller.humanUpdate = false;
				    	if(controller.property == "x"){
				    		this.selectedTextures[0].x = controller.targetValue; 
				    	}else if(controller.property == "y"){
				    		console.log(controller);
				    		this.selectedTextures[0].y = controller.targetValue; 
				    	}else if(controller.property == "collideConnected"){
				    		this.selectedTextures[0].data.collideConnected = controller.targetValue; 
				    	}else if(controller.property == "enableMotor"){
				    		console.log("fixing it on data");
				    		this.selectedTextures[0].data.enableMotor = controller.targetValue; 
				    	}else if(controller.property == "maxMotorTorque"){
				    		this.selectedTextures[0].data.maxMotorTorque = controller.targetValue; 
				    	}else if(controller.property == "motorSpeed"){
				    		this.selectedTextures[0].data.motorSpeed = controller.targetValue; 
				    	}else if(controller.property == "enableLimit"){
				    		console.log("fixing it on data");
				    		this.selectedTextures[0].data.enableLimit = controller.targetValue; 
				    	}else if(controller.property == "upperAngle"){
				    		console.log(controller);
				    		this.selectedTextures[0].data.upperAngle = controller.targetValue; 
				    	}else if(controller.property == "lowerAngle"){
				    		this.selectedTextures[0].data.lowerAngle = controller.targetValue; 
				    	}
				    }
				    if(controller.__input !== document.activeElement &&
				    	(controller.domElement.children[0].children && controller.domElement.children[0].children[0] !== document.activeElement)){
				   		controller.updateDisplay();
					}
				}

				this.editorGUI.editData.x = this.selectedTextures[0].x;
				this.editorGUI.editData.y = this.selectedTextures[0].y;
			}
		}





		this.selectedBoundingBox = aabb;

		var lowerBoundPixi = getPIXIPointFromWorldPoint(aabb.lowerBound);
		var upperBoundPixi = getPIXIPointFromWorldPoint(aabb.upperBound);

		this.drawBox(this.graphics, lowerBoundPixi.x, lowerBoundPixi.y, upperBoundPixi.x-lowerBoundPixi.x, upperBoundPixi.y-lowerBoundPixi.y, this.selectionBoxColor);

	}

	this.correctedDrawVerticePosition;
	this.correctDrawVertice = false;
	this.closeDrawing = false;
	this.activeVertices = [];

	this.verticesLineColor = 0x00FF00;
	this.verticesFillColor = 0x0000FF;
	this.verticesBulletRadius = 5;

	this.doVerticesDrawing = function(){
		this.graphics.lineStyle(1, this.verticesLineColor, 1);
		this.graphics.beginFill(this.verticesFillColor, 0.5);

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
		        	this.graphics.lineStyle(1, 0xFF0000, 1);

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
			        	this.graphics.lineStyle(1, 0xFFFF00, 1);
			        	this.closeDrawing = true;
			        }

			        var ccw = function(A, B, C){ return (C.y-A.y) * (B.x-A.x) > (B.y-A.y) * (C.x-A.x)};
					var intersect = function(A,B,C,D){ return ccw(A,C,D) != ccw(B,C,D) && ccw(A,B,C) != ccw(A,B,D)};

					var checkBaseSegmentNextVertice = this.activeVertices[1];
					var checkBaseSegmentVertice = this.activeVertices[0];
					var checkBaseAngle = Math.atan2(checkBaseSegmentNextVertice.y-checkBaseSegmentVertice.y, checkBaseSegmentNextVertice.x-checkBaseSegmentVertice.x);
					var imaginaryDistance = 10000;
					var imaginaryVerticeOnBaseSegment = {x:checkBaseSegmentVertice.x-imaginaryDistance*Math.cos(checkBaseAngle), y:checkBaseSegmentVertice.y-imaginaryDistance*Math.sin(checkBaseAngle)};
			 			
					//this.graphics.moveTo(getPIXIPointFromWorldPoint(newVertice).x, getPIXIPointFromWorldPoint(newVertice).y);
					//this.graphics.lineTo(getPIXIPointFromWorldPoint(imaginaryVerticeOnBaseSegment).x, getPIXIPointFromWorldPoint(imaginaryVerticeOnBaseSegment).y);


		 			if(intersect(checkBaseSegmentNextVertice, imaginaryVerticeOnBaseSegment, newVertice, activeVertice)){
		 				this.graphics.lineStyle(1, 0xFF00FF, 1);
		 				this.closeDrawing = true;
		 			}
				}

			}
			this.graphics.moveTo(getPIXIPointFromWorldPoint(newVertice).x, getPIXIPointFromWorldPoint(newVertice).y);

			this.graphics.arc(getPIXIPointFromWorldPoint(newVertice).x, getPIXIPointFromWorldPoint(newVertice).y, this.verticesBulletRadius, 0, 2 * Math.PI, false);

			this.graphics.moveTo(getPIXIPointFromWorldPoint(newVertice).x, getPIXIPointFromWorldPoint(newVertice).y);

			this.graphics.lineTo(getPIXIPointFromWorldPoint(activeVertice).x, getPIXIPointFromWorldPoint(activeVertice).y);
		}
		previousVertice = null;


		for(i =0; i<this.activeVertices.length; i++){

			activeVertice = this.activeVertices[i];

			this.graphics.moveTo(getPIXIPointFromWorldPoint(activeVertice).x+this.verticesBulletRadius, getPIXIPointFromWorldPoint(activeVertice).y);
			this.graphics.arc(getPIXIPointFromWorldPoint(activeVertice).x, getPIXIPointFromWorldPoint(activeVertice).y, this.verticesBulletRadius, 0, 2 * Math.PI, false);
			
			if(i>0) previousVertice = this.activeVertices[i-1];

			if(previousVertice){
				this.graphics.moveTo(getPIXIPointFromWorldPoint(activeVertice).x, getPIXIPointFromWorldPoint(activeVertice).y);
				this.graphics.lineTo(getPIXIPointFromWorldPoint(previousVertice).x, getPIXIPointFromWorldPoint(previousVertice).y);
			}
		}

		this.graphics.endFill();

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
	this.buildBodyFromObj = function(obj){
		var i = 0;
		var vert;
		var b2Vec2Arr =[];

		for(i = 0; i<obj.vertices.length; i++){
			vert = obj.vertices[i];
			b2Vec2Arr.push(new b2Vec2(vert.x, vert.y));
		}


		var fixDef = new b2FixtureDef;
	    fixDef.density = 1.0;
	    fixDef.friction = 0.5;
	    fixDef.restitution = 0.2;


		var bd = new b2BodyDef();
		bd.type = b2Body.b2_dynamicBody;
    	var body = world.CreateBody(bd);

        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsArray(b2Vec2Arr, b2Vec2Arr.length);

        var fixture = body.CreateFixture(fixDef);
        body.SetPositionAndAngle(new b2Vec2(obj.x, obj.y), 0);

		body.myGraphic = this.createPolyShape(fixDef.shape, fixture.GetAABB(), 0xFFF000, 0x0FFF00);
		body.myGraphic.myBody = body;
		body.myGraphic.data = obj;
	}

 
	this.attachJointPlaceHolder = function(obj){


		var tarObj;
		var bodies = [];

		if(obj){
			tarObj = obj;
			bodies.push(newTextureGraphics.getChildAt(tarObj.bodyA_ID).myBody);

			if(tarObj.bodyB_ID != undefined){
				bodies.push(newTextureGraphics.getChildAt(tarObj.bodyB_ID).myBody);
				console.log("WHAAZAAAAA");
			}
			console.log(bodies.length +"  LENGTH"+"  "+tarObj.bodyA_ID+"  "+tarObj.bodyB_ID+"  "+tarObj.enableLimit);



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
		newTextureGraphics.addChild(jointGraphics);

		jointGraphics.pivot.set(jointGraphics.width/2, jointGraphics.height/2);

		jointGraphics.bodies = bodies;

		console.log(bodies.length);

		bodies[0].myJoint = jointGraphics;
		if(bodies.length>1) bodies[1].myJoint = jointGraphics;

		jointGraphics.data = tarObj;

		jointGraphics.x = tarObj.x;
		jointGraphics.y = tarObj.y;

	}

	this.attachJoint = function(jointPlaceHolder){
		var bodyA = newTextureGraphics.getChildAt(jointPlaceHolder.bodyA_ID).myBody;
		var bodyB;
		if(jointPlaceHolder.bodyB_ID != null){

			bodyB = newTextureGraphics.getChildAt(jointPlaceHolder.bodyB_ID).myBody;
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


		if(jointPlaceHolder.jointType == this.jointObject_TYPE_PIN){
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


			console.log("COLLIDE CONNECTED?"+jointPlaceHolder.collideConnected)

			var joint = world.CreateJoint(revoluteJointDef);
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
		body.myGraphic.data.textureID = texture.myID;
		body.myGraphic.data.texturePositionOffsetLength = positionOffsetLength;
		body.myGraphic.data.texturePositionOffsetAngle = positionOffsetAngle;
		body.myGraphic.data.textureAngleOffset = offsetRotation;
		body.myGraphic.visible = false;
		texture.myBody = body;
	}
	this.removeTextureFromBody = function(body){
		body.myTexture = null;
		body.myGraphic.data.textureID = null;
		body.myGraphic.data.texturePositionOffsetLength = null;
		body.myGraphic.data.texturePositionOffsetAngle = null;
		body.myGraphic.data.textureAngleOffset = null;
		body.myGraphic.visible = true;
		texture.myBody = null;
	}

	this.createPolyShape = function (poly, colorLine, colorFill){

		var graphic = new PIXI.Graphics();
		graphic.boundsPadding = 0;

		graphic.lineStyle(1, colorLine, 1);
		graphic.beginFill(colorFill, 1);

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

		return newTextureGraphics.addChild(graphic);
	}

	this.stringifyWorldJSON = function(){

		worldJSON = '{"objects":[';
		var sprite;
		var spriteData;
		for(i = 0; i<newTextureGraphics.children.length; i++){
			if(i != 0) worldJSON += ',';
			sprite = newTextureGraphics.getChildAt(i);
			if(sprite.data.type == this.object_BODY){
				sprite.data.x = sprite.myBody.GetPosition().x;
				sprite.data.y = sprite.myBody.GetPosition().y;
				sprite.data.rotation = sprite.myBody.GetAngle();			
			}else if(sprite.data.type == this.object_TEXTURE){
				sprite.data.x = sprite.x;
				sprite.data.y = sprite.y;
				sprite.data.rotation = sprite.rotation;
				
			}else if(sprite.data.type == this.object_JOINT){

				sprite.data.bodyA_ID = sprite.bodies[0].myGraphic.parent.getChildIndex(sprite.bodies[0].myGraphic);
				if(sprite.bodies.length>1) sprite.data.bodyB_ID = sprite.bodies[1].myGraphic.parent.getChildIndex(sprite.bodies[1].myGraphic);
				sprite.data.x = sprite.x;
				sprite.data.y = sprite.y;
			}
			sprite.data.ID = i;
			worldJSON += JSON.stringify(sprite.data);
		}
		worldJSON += ']}';

		console.log(worldJSON);
	}
	this.parseAndBuildWorldJSON = function(){

		if(this.worldJSON != null && this.worldJSON != ""){
			var worldObjects = JSON.parse(this.worldJSON);

			var i;
			var obj;
			for(i = 0; i<worldObjects.objects.length; i++){
				obj = worldObjects.objects[i];

				if(obj.type == this.object_BODY){
					this.buildBodyFromObj(obj);	
				}else if(obj.type == this.object_TEXTURE){
					//create sprite
				}else if(obj.type == this.object_JOINT){
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
		this.editorMode = this.editorMode_DEFAULT;

		this.selectedPhysicsBodies = [];
		this.selectedTextures = [];
		this.selectedBoundingBox = null;
		this.startSelectionPoint = null;
		this.oldMousePosWorld = null;


		//Destroy all bodies
		var body = world.GetBodyList();
	    var i = 0
	    while(body){
	    	var b = body;
	        world.DestroyBody(b);
	       	body = body.GetNext();
	    }

	    //Destroy all graphics

	    for(i = 0; i<newTextureGraphics.children.length; i++){
			var sprite = newTextureGraphics.getChildAt(i);
			sprite.parent.removeChild(sprite);
			sprite.destroy({children:true, texture:false, baseTexture:false});
			i--;
		}

		this.parseAndBuildWorldJSON();

	}
	this.prepareWorld = function(){
		var spritesToDestroy = [];
		var sprite;

		for(i = 0; i<newTextureGraphics.children.length; i++){
			sprite = newTextureGraphics.getChildAt(i);
			if(sprite.data.type == this.object_JOINT){

				sprite.data.bodyA_ID = sprite.bodies[0].myGraphic.parent.getChildIndex(sprite.bodies[0].myGraphic);
				if(sprite.bodies.length>1) sprite.data.bodyB_ID = sprite.bodies[1].myGraphic.parent.getChildIndex(sprite.bodies[1].myGraphic);

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

}