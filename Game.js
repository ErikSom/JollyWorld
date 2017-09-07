var PTM = 30;
var timeStep = 1000/60;
var physicsTimeStep = 1/60;
var editor;
var app;
var stage;
var newDebugGraphic;
var canvas;
var renderer;

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
var world; 

var isMouseDown, selectedBody, mouseJoint;
var run = false;


function init() {

   canvas = document.getElementById("canvas");

   var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
   var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

   canvas.width = w; //document.width is obsolete
   canvas.height = h; //document.height is obsolete

   app = new PIXI.Application({view:canvas, backgroundColor:0xFF0000, width:w, height:h});
   stage = app.stage;

   PIXI.loader
   .add("assets/images/bodyparts.json")
   .add("assets/images/vehicles.json");
   
   editor = new B2deEditor();
   editor.load(PIXI.loader);

   PIXI.loader.load(setup);
};

function setup(){
   console.log("load completed");
   world = new b2World(
   new b2Vec2(0, 10)    //gravity
      ,true               //allow sleep
   );
         
   //BG
   var BG = new PIXI.Graphics();
   editor.drawBox(BG, -15000, -15000, 30000, 30000, "0x000000", 1, 1, "0xFFFFFF");
   //stage.addChild(BG);

   //container
   var myContainer = new PIXI.Graphics();
   stage.addChild(myContainer);

   //Debug Draw
   newDebugGraphics = new PIXI.Graphics();
   myDebugDraw = getPIXIDebugDraw(newDebugGraphics, PTM);            
   myDebugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
   myContainer.addChild(newDebugGraphics);
   world.SetDebugDraw(myDebugDraw);

   window.setInterval(update, timeStep);


   editor.assetLists.characters = ["1head.png", "2head.png", "3head.png"];
   editor.assetLists.vehicles = ["Bike1_Childseet.png", "Bike1_Frame.png", "Bike1_Tire.png"];
   editor.init(myContainer, world, PTM);



   canvas.addEventListener("keydown", onKeyDown, true);
   canvas.addEventListener("keyup", onKeyUp, true);
   canvas.addEventListener("mousedown", onMouseDown, true);
   canvas.addEventListener("touchstart", onMouseDown, true);
   canvas.addEventListener("mouseup", onMouseUp, true);
   canvas.addEventListener("touchend", onMouseUp, true);
   canvas.addEventListener("mousemove", onMouseMove, true);
   canvas.addEventListener("touchmove", onMouseMove, true);

}


//mouse   
function onMouseDown(e) {
   isMouseDown = true;
   if(!mouseJoint && run) {
      var body = getBodyAtMouse();
      if(body) {
         var md = new b2MouseJointDef();
         md.bodyA = world.GetGroundBody();
         md.bodyB = body;
         md.target.Set(editor.mousePosWorld.x, editor.mousePosWorld.y);
         md.collideConnected = true;
         md.maxForce = 300.0 * body.GetMass();
         mouseJoint = world.CreateJoint(md);
         body.SetAwake(true);
      }

   }

   onMouseMove(e);
   editor.onMouseDown(e);
};



function onMouseUp(e) {
   isMouseDown = false;
   editor.onMouseUp(e);

};

function onMouseMove(e) {
  
   editor.onMouseMove(e);
};

function getBodyAtMouse() {
   var aabb = new b2AABB();
   aabb.lowerBound.Set(editor.mousePosWorld.x - 0.001, editor.mousePosWorld.y - 0.001);
   aabb.upperBound.Set(editor.mousePosWorld.x + 0.001, editor.mousePosWorld.y + 0.001);
   
   // Query the world for overlapping shapes.

   selectedBody = null;
   world.QueryAABB(getBodyCB, aabb);
   return selectedBody;
};

function getBodyCB(fixture) {
   if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
      if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), editor.mousePosWorld)) {
         selectedBody = fixture.GetBody();
         return false;
      }
   }
   return true;
};

function onKeyDown(e) {
   if (e.keyCode == 82){//r
      run = false;
      editor.resetEditor();

   }else if (e.keyCode == 80 ) {//p
      if(editor.editing){
         editor.stringifyWorldJSON();
         editor.runWorld();
      }

      run = !run;
     
   }

   editor.onKeyDown(e);
}
function onKeyUp(e){
   editor.onKeyUp(e);
}
//update

function update() {
   
   if(mouseJoint) {
      if(isMouseDown) {
         mouseJoint.SetTarget(new b2Vec2(editor.mousePosWorld.x, editor.mousePosWorld.y));
      } else {
         world.DestroyJoint(mouseJoint);
         mouseJoint = null;
      }
   }
      
   if(run){
      world.Step(physicsTimeStep, 3, 2);
      world.ClearForces();
   }

   editor.run();

   newDebugGraphics.clear();
   world.DrawDebugData();
  
   app.render();
};