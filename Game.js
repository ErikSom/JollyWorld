var PTM = 30;
var timeStep = 1000/60;
var physicsTimeStep = 1/60;
var myEditor;
var Container,
autoDetectRenderer,
loader,
resources,
TextureCache,
Texture,
Sprite,
stage,
renderer,
newDebugGraphic,
newTextureGraphics,
newEditorGraphics,
canvas;

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

var mousePosPixel, mousePosWorld;
var isMouseDown, selectedBody, mouseJoint;
var run = false;


function init() {

   Container = PIXI.Container;
   autoDetectRenderer = PIXI.autoDetectRenderer;
   loader = PIXI.loader;
   resources = PIXI.loader.resources;
   TextureCache = PIXI.utils.TextureCache;
   Texture = PIXI.Texture;
   Sprite = PIXI.Sprite;
   stage = new Container();

   canvas = document.getElementById("canvas");

   var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
   var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

   canvas.width = w; //document.width is obsolete
   canvas.height = h; //document.height is obsolete



   console.log(canvas.width +"  "+canvas.height);
   renderer = autoDetectRenderer(canvas.width, canvas.height, {view:document.getElementById("canvas")});


   loader
   .add("assets/images/bodyparts.json");
   
   myEditor = new B2deEditor();
   myEditor.load(loader);

   loader.load(setup);
};

function setup(){
   console.log("load completed");
   world = new b2World(
   new b2Vec2(0, 10)    //gravity
      ,true               //allow sleep
   );
         
   //BG
   var BG = new PIXI.Graphics();
   myEditor.drawBox(BG, -5, -5, canvas.width*2, canvas.height*2, "0x000000", 1, 1, "0xFFFFFF");
   stage.addChild(BG);


   //Debug Draw
   newDebugGraphics = new PIXI.Graphics();
   myDebugDraw = getPIXIDebugDraw(newDebugGraphics, PTM);            
   myDebugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
   stage.addChild(newDebugGraphics);

   world.SetDebugDraw(myDebugDraw);

   window.setInterval(update, timeStep);

   //Texture Draw
   newTextureGraphics = new PIXI.Graphics();
   stage.addChild(newTextureGraphics);


   //Editor Draw
   newEditorGraphics = new PIXI.Graphics();
   myEditor.init(newEditorGraphics, newTextureGraphics);
   myEditor.assetLists.characters = ["1head.png", "2head.png", "3head.png"];

   stage.addChild(newEditorGraphics)



   canvas.addEventListener("keydown", onKeyDown, true);
   canvas.addEventListener("mousedown", onMouseDown, true);
   canvas.addEventListener("touchstart", onMouseDown, true);
   canvas.addEventListener("mouseup", onMouseUp, true);
   canvas.addEventListener("touchend", onMouseUp, true);
   canvas.addEventListener("mousemove", onMouseMove, true);
   canvas.addEventListener("touchmove", onMouseMove, true);

   mousePosPixel = new b2Vec2(0, 0);
   mousePosWorld = new b2Vec2(0, 0);

}

function getWorldPointFromPixelPoint(pixelPoint) {
    return new b2Vec2((pixelPoint.x)/PTM,(pixelPoint.y)/PTM);
}
function getPIXIPointFromWorldPoint(worldPoint){
    return new b2Vec2(worldPoint.x *PTM - stage.position.x, worldPoint.y*PTM);
}
//mouse   
function onMouseDown(e) {
   isMouseDown = true;

   if(!mouseJoint) {
      var body = getBodyAtMouse();
      if(body) {
         var md = new b2MouseJointDef();
         md.bodyA = world.GetGroundBody();
         md.bodyB = body;
         md.target.Set(mousePosWorld.x, mousePosWorld.y);
         md.collideConnected = true;
         md.maxForce = 300.0 * body.GetMass();
         mouseJoint = world.CreateJoint(md);
         body.SetAwake(true);
      }

   }

   onMouseMove(e);
   if(!run)myEditor.onMouseDown(canvas, e);

};



function onMouseUp(e) {
   isMouseDown = false;
   if(!run)myEditor.onMouseUp(canvas, e);

};

function onMouseMove(e) {
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

   var rect = canvas.getBoundingClientRect();

   mousePosPixel.x = e.clientX - rect.left;
   mousePosPixel.y = e.clientY - rect.top;

   mousePosWorld = getWorldPointFromPixelPoint(mousePosPixel);
  
   if(!run)myEditor.onMouseMove(canvas, e);

};

function getBodyAtMouse() {
   var aabb = new b2AABB();
   aabb.lowerBound.Set(mousePosWorld.x - 0.001, mousePosWorld.y - 0.001);
   aabb.upperBound.Set(mousePosWorld.x + 0.001, mousePosWorld.y + 0.001);
   
   // Query the world for overlapping shapes.

   selectedBody = null;
   world.QueryAABB(getBodyCB, aabb);
   return selectedBody;
};

function getBodyCB(fixture) {
   if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
      if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePosWorld)) {
         selectedBody = fixture.GetBody();
         return false;
      }
   }
   return true;
};

function onKeyDown(e) {
   console.log(e);
   // a = 65
   if (e.keyCode == 80 ) {//p
      if(!run) myEditor.prepareWorld();
      run = !run;
   }else if (e.keyCode == 88 ) {//x
      myEditor.startVerticesDrawing();
   }else if (e.keyCode == 81 ) {//q
      myEditor.anchorTextureToBody();
   }else if (e.keyCode == 74 ) {//j
      myEditor.attachJointPlaceHolder();
   }else if (e.keyCode == 83 ) {//s
      myEditor.stringifyWorldJSON();
   }else if (e.keyCode == 82){
      myEditor.resetWorld();
      run = false;
   }else if(e.ctrlKey && e.keyCode == 67){
      myEditor.copySelection();
   }else if(e.ctrlKey && e.keyCode == 86){
      myEditor.pasteSelection();
   }
   else if (e.keyCode == 46){
      myEditor.deleteSelection();
   }
}
//update

function update() {
   
   if(mouseJoint) {
      if(isMouseDown) {
         mouseJoint.SetTarget(new b2Vec2(mousePosWorld.x, mousePosWorld.y));
      } else {
         world.DestroyJoint(mouseJoint);
         mouseJoint = null;
      }
   }
   
   newEditorGraphics.clear();
   
   if(run){
      world.Step(physicsTimeStep, 3, 2);
   }else{
      myEditor.doEditor();
   }


   myEditor.run();

   newDebugGraphics.clear();
   world.DrawDebugData();
   world.ClearForces();
   renderer.render(stage);
};