
var   b2Vec2 = Box2D.Common.Math.b2Vec2
   ,  b2AABB = Box2D.Collision.b2AABB
   ,  b2BodyDef = Box2D.Dynamics.b2BodyDef
   ,  b2Body = Box2D.Dynamics.b2Body
   ,  b2FixtureDef = Box2D.Dynamics.b2FixtureDef
   ,  b2Fixture = Box2D.Dynamics.b2Fixture
   ,  b2World = Box2D.Dynamics.b2World
   ,  b2MassData = Box2D.Collision.Shapes.b2MassData
   ,  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
   ,  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
   ,  b2DebugDraw = Box2D.Dynamics.b2DebugDraw
   ,  b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
   ;

var game = new Game();


function Game(){

   this.PTM = 30;
   this.timeStep = 1000/60;
   this.physicsTimeStep = 1/60;
   this.editor;
   this.app;
   this.stage;
   this.newDebugGraphic;
   this.canvas;
   this.renderer;
   this.world; 

   this.isMouseDown
   this.selectedBody
   this.mouseJoint;
   this.run = false;


   this.vehicle;
   this.desiredVehicleSpeed = 0;
   this.desiredVehicleTorque = 0;


   this.init = function() {

      this.canvas = document.getElementById("canvas");

      var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

      this.canvas.width = w; //document.width is obsolete
      this.canvas.height = h; //document.height is obsolete

      this.app = new PIXI.Application({view:this.canvas, backgroundColor:0xD4D4D4, width:w, height:h});
      this.stage = this.app.stage;

      console.log(this.app);

      PIXI.loader
      .add("assets/images/bodyparts.json")
      .add("assets/images/vehicles.json");
      
      this.editor = new B2deEditor();
      this.editor.load(PIXI.loader);

      PIXI.loader.load(this.setup.bind(this));
   };

   this.setup = function(){
      console.log("load completed");
      this.world = new b2World(
      new b2Vec2(0, 10)    //gravity
         ,true               //allow sleep
      );
            
      //container
      var myContainer = new PIXI.Graphics();
      this.stage.addChild(myContainer);

      //Debug Draw
      this.newDebugGraphics = new PIXI.Graphics();
      this.myDebugDraw = getPIXIDebugDraw(this.newDebugGraphics, this.PTM);            
      this.myDebugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
      myContainer.addChild(this.newDebugGraphics);
      this.world.SetDebugDraw(this.myDebugDraw);

      window.setInterval(this.update.bind(this), this.timeStep);


      this.editor.assetLists.characters = ["1head.png", "2head.png", "3head.png"];
      this.editor.assetLists.vehicles = ["Bike1_Childseet.png", "Bike1_Frame.png", "Bike1_Tire.png"];
      this.editor.init(myContainer, this.world, this.PTM);


      this.canvas.addEventListener("keydown", this.onKeyDown.bind(this), true);
      this.canvas.addEventListener("keyup", this.onKeyUp.bind(this), true);
      this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this), true);
      this.canvas.addEventListener("touchstart", this.onMouseDown.bind(this), true);
      this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this), true);
      this.canvas.addEventListener("touchend", this.onMouseUp.bind(this), true);
      this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this), true);
      this.canvas.addEventListener("touchmove", this.onMouseMove.bind(this), true);

   }


   //mouse   
   this.onMouseDown = function(e) {
      this.isMouseDown = true;
      if(!this.mouseJoint && this.run) {
         var body = this.getBodyAtMouse();
         if(body) {
            var md = new b2MouseJointDef();
            md.bodyA = this.world.GetGroundBody();
            md.bodyB = body;
            md.target.Set(this.editor.mousePosWorld.x, this.editor.mousePosWorld.y);
            md.collideConnected = true;
            md.maxForce = 300.0 * body.GetMass();
            this.mouseJoint = this.world.CreateJoint(md);
            body.SetAwake(true);
         }

      }

      this.onMouseMove(e);
      this.editor.onMouseDown(e);
   };



   this.onMouseUp = function(e) {
      this.isMouseDown = false;
      this.editor.onMouseUp(e);

   };

   this.onMouseMove = function(e) {
      this.editor.onMouseMove(e);
   };

   this.getBodyAtMouse = function() {
      var aabb = new b2AABB();
      aabb.lowerBound.Set(this.editor.mousePosWorld.x - 0.001, this.editor.mousePosWorld.y - 0.001);
      aabb.upperBound.Set(this.editor.mousePosWorld.x + 0.001, this.editor.mousePosWorld.y + 0.001);
      
      // Query the world for overlapping shapes.

      this.selectedBody = null;
      this.world.QueryAABB(this.getBodyCB.bind(this), aabb);
      return this.selectedBody;
   };

   this.getBodyCB = function(fixture) {
      if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
         if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), this.editor.mousePosWorld)) {
            this.selectedBody = fixture.GetBody();
            return false;
         }
      }
      return true;
   };

   this.onKeyDown = function(e) {
      if (e.keyCode == 82){//r
         this.run = false;
         this.editor.resetEditor();

      }else if (e.keyCode == 80 ) {//p
         if(this.editor.editing){
            this.editor.stringifyWorldJSON();
            this.editor.runWorld();

            this.initVehicle();
         }

         this.run = !this.run;
      }

      //GAME
      if(this.vehicle){
         if(e.keyCode == 87){
            console.log("YES!!");
            this.vehicle.engine.SetMaxMotorTorque(this.desiredVehicleTorque);
            this.vehicle.engine.SetMotorSpeed(-this.desiredVehicleSpeed);
         }else if(e.keyCode == 83){
            this.vehicle.engine.SetMaxMotorTorque(this.desiredVehicleTorque);
            this.vehicle.engine.SetMotorSpeed(this.desiredVehicleSpeed*0.6);
         }
      }


      this.editor.onKeyDown(e);



   }
   this.onKeyUp = function(e){
      this.editor.onKeyUp(e);

      if(e.keyCode == 87 || e.keyCode == 83){
         this.vehicle.engine.SetMaxMotorTorque(0);
         this.vehicle.engine.SetMotorSpeed(0);
      }
   }


   this.initVehicle = function(){
      this.vehicle = this.editor.objectLookup.__vehicle;
      if(this.vehicle){

         console.log("yes vehicle");
         this.desiredVehicleTorque = this.vehicle.engine.GetMotorTorque();
         this.desiredVehicleSpeed = this.vehicle.engine.GetMotorSpeed();

         this.vehicle.engine.SetMaxMotorTorque(0);
         this.vehicle.engine.SetMotorSpeed(0);
      }
   }

   this.update = function() {
      
      if(this.mouseJoint) {
         if(this.isMouseDown) {
            this.mouseJoint.SetTarget(new b2Vec2(this.editor.mousePosWorld.x, this.editor.mousePosWorld.y));
         } else {
            this.world.DestroyJoint(this.mouseJoint);
            this.mouseJoint = null;
         }
      }
         
      if(this.run){
         this.world.Step(this.physicsTimeStep, 3, 2);
         this.world.ClearForces();
      }

      this.editor.run();

      this.newDebugGraphics.clear();
      this.world.DrawDebugData();
     
      this.app.render();
   };
}


