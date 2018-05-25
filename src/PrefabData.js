import { Box2D } from "../libs/Box2D";
import { game } from "./Game";

const characterModels = ["character", "baby"];



let basePrefab = function() {
    basePrefab.settings = {};
    this.prefabObject;
    this.lookupObject;
    this.init = function(target){
    }
    this.settings = function(target){
    }
    this.set = function(target, property, value){
    }
    this.update = function(target){
    }
    this.contactListener = new Box2D.Dynamics.b2ContactListener();
	this.contactListener.BeginContact = function (contact, target) {
	}
	this.contactListener.EndContact = function (contact, target) {
	}
	this.contactListener.PreSolve = function (contact, oldManifold, target) {
	}
	this.contactListener.PostSolve = function (contact, impulse, target) {
    }
}





let characterFunctions = new function(){
    const self = this;
    const TIME_EYES_CLOSE = 3000;
    const TIME_EYES_OPEN = 3100;
    this.init = function(target, group){

        var targetGroup = target.lookupObject[group];
        targetGroup.__eyesTimer = 0.0;
        targetGroup.__collisionUpdates = [];


        var i;
        for(i=0; i<targetGroup._bodies.length; i++){
            var body = targetGroup._bodies[i];
            if(body.mySprite.data.groups.indexOf('.flesh') >= 0){

                body.isFlesh = true;
                game.editor.prepareBodyForDecals(body);

                var texture = body.myTexture;
                //fix gore for Skin2, Skin3 etc

                var fleshName = texture.data.textureName.split('0000')[0];
                if(fleshName.indexOf('Head')>0) fleshName = fleshName.substr(0, fleshName.indexOf('_'))+"_Head";

                var sprite = new PIXI.Sprite(PIXI.Texture.fromFrame(fleshName+"_Flesh0000"));
                texture.addChildAt(sprite, 0);
            }
        }
    }
    this.update = function(target, group){
        var targetGroup = target.lookupObject[group];
        if(timerReady(targetGroup.__eyesTimer, TIME_EYES_CLOSE, true)){
            targetGroup.eye_left.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(targetGroup.eye_left.myTexture.data.textureName.replace("0000","_Closed0000"));
            targetGroup.eye_right.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(targetGroup.eye_left.myTexture.data.textureName.replace("0000","_Closed0000"));
        }else if(timerReady(targetGroup.__eyesTimer, TIME_EYES_OPEN, false)){
            targetGroup.eye_left.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(targetGroup.eye_left.myTexture.data.textureName);
            targetGroup.eye_right.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(targetGroup.eye_right.myTexture.data.textureName);
            targetGroup.__eyesTimer = -game.editor.deltaTime;
        }

        for(var i = 0; i<targetGroup.__collisionUpdates.length; i++){
             self.doCollisionUpdate(targetGroup.__collisionUpdates[i], target, group);
        }
        targetGroup.__collisionUpdates = [];
        targetGroup.__eyesTimer += game.editor.deltaTime;
    }
    const GORE_BASH = 0;
    const GORE_SNAP = 1;

    this.contactListener = new Box2D.Dynamics.b2ContactListener();
	this.contactListener.BeginContact = function (contact, target, group) {
	}
	this.contactListener.EndContact = function (contact, target, group) {
	}
	this.contactListener.PreSolve = function (contact, oldManifold, target, group) {
	}
	this.contactListener.PostSolve = function (contact, impulse, target, group) {
        var targetGroup = target.lookupObject[group];

        var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
        var body;

        for(var i = 0; i<bodies.length; i++){
            body = bodies[i];

            if(body == targetGroup["head"] && (bodies[0].mySprite.data.prefabID != bodies[1].mySprite.data.prefabID  || bodies[0].mySprite.data.prefabID == undefined)){
                var force = 0;
                for(var j = 0; j<impulse.normalImpulses.length; j++) force = Math.max(force, impulse.normalImpulses[j]);
                if(force > 8){
                    targetGroup.__collisionUpdates.push({type:GORE_SNAP, target:"eye_right"});
                    targetGroup.__collisionUpdates.push({type:GORE_SNAP, target:"eye_left"});
                    targetGroup.__collisionUpdates.push({type:GORE_SNAP, target:"arm_left"});
                }
            }
        }
    }
    this.doCollisionUpdate = function(update, target, group){
        var targetGroup = target.lookupObject[group];
        switch (update.type){
            case GORE_BASH:
            break;
            case GORE_SNAP:
                var targetJoint = targetGroup[update.target+"_joint"];
                if(targetJoint){

                    var revoluteJointDef;
                    var joint;

                    var vainPrefab = '{"objects":[[4,'+targetJoint.GetAnchorA().x*game.editor.PTM+','+targetJoint.GetAnchorA().y*game.editor.PTM+',0,{},"vain",'+(game.editor.prefabCounter++)+']]}'

                    var vainBodies = game.editor.buildJSON(JSON.parse(vainPrefab));

                    var vainSize = (vainBodies._bodies[0].originalGraphic.height*vainBodies._bodies.length)/game.editor.PTM;

                    revoluteJointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef;
                    revoluteJointDef.Initialize(targetJoint.GetBodyA(), vainBodies._bodies[0], targetJoint.GetAnchorA());
                    revoluteJointDef.collideConnected = false;
                    joint = game.world.CreateJoint(revoluteJointDef);

                    revoluteJointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef;
                    revoluteJointDef.Initialize(targetJoint.GetBodyB(), vainBodies._bodies[3], targetJoint.GetAnchorA());
                    revoluteJointDef.collideConnected = false;
                    joint = game.world.CreateJoint(revoluteJointDef);

                    var ropeJointDef;

                    ropeJointDef = new Box2D.Dynamics.Joints.b2RopeJointDef;
                    ropeJointDef.Initialize(targetJoint.GetBodyA(), targetJoint.GetBodyB(), targetJoint.GetAnchorA(), targetJoint.GetAnchorA());
                    ropeJointDef.maxLength = vainSize;

                    joint = game.world.CreateJoint(ropeJointDef);

                    game.world.DestroyJoint(targetJoint);
                    targetGroup[update.target+"_joint"] = undefined;

                    //fix display positions:
                    var swapBodies = vainBodies._bodies.concat().reverse();
                    var tarSprite;
                    var tarIndex = targetGroup[update.target].myTexture.parent.getChildIndex(targetGroup[update.target].myTexture);
                    for(var i = 0; i<swapBodies.length; i++){
                        tarSprite = swapBodies[i].mySprite;
                        tarSprite.parent.removeChild(tarSprite);
                        targetGroup[update.target].myTexture.parent.addChildAt(tarSprite, tarIndex);
                    }
                }
            break;
        }
    }
}

let vehicle1 = new function(){ //Vehicle
    const self = this;
    this.vehicleCharacters = ["character"];

    this.settings = new function(){
        this._options = {};
        // this.showVehicle = false;
        // this.skin = "Normal";
        // this._options["skin"] = ["Normal", "skin2", "skin3"];
        // this.speed = 10;
        // this._options["speed"] = {min:0, max:10, step:0.1};
        // this.skin_options;
        this.selectedVehicle = "vehicle1";
        this._options["selectedVehicle"] = ["vehicle1", "vehicle2"];
        this._playableCharacter = true;
        this._forceUnique = true;
    }

    this.init = function(target){
        target.lookupObject = game.editor.lookupGroups[target.prefabName+"_"+target.instanceID];
        for(var i = 0; i<self.vehicleCharacters.length; i++){ 
            characterFunctions.init(target, self.vehicleCharacters[i]);
        }

        var targetGroup = target.lookupObject;
        var i;
        for(i=0; i<targetGroup._bodies.length; i++){
            var body = targetGroup._bodies[i];
                body.mySprite.data.prefabID = target.instanceID;
        }
    }
    this.update = function(target){
        for(var i = 0; i<self.vehicleCharacters.length; i++) characterFunctions.update(target, self.vehicleCharacters[i]);
    }
    this.set = function(target, property, value){
        var lookupObject = game.editor.lookupGroups[target.prefabName+"_"+target.instanceID];
        console.log("setting:", property, "with value", value, "on:", target);
        switch(property){
            case "selectedVehicle":
                if(target.settings.selectedVehicle != value){
                    target.settings.selectedVehicle = value;

                    var vehicleDepth = game.editor.getLowestChildIndex([].concat(lookupObject._bodies, lookupObject._textures, lookupObject._joints));
                    console.log("Vehicle Depth :",vehicleDepth);

                    var vehiclePrefab = `{"objects":[[4,${target.x},${target.y},${target.rotation},${JSON.stringify(target.settings)},"${value}",${target.instanceID}]]}`;
                    var newObjects = game.editor.buildJSON(JSON.parse(vehiclePrefab));
                    game.editor.applyToObjects(game.editor.TRANSFORM_FORCEDEPTH, vehicleDepth, [].concat(newObjects._bodies, newObjects._textures, newObjects._joints));

                    game.editor.deleteSelection();
                    console.log("SELECTION DESTROYED!", game.editor.editorGUI);

                    var instanceName;
                    if(newObjects._bodies.length>0) instanceName = newObjects._bodies[0].mySprite.data.prefabInstanceName;
                    else if(newObjects._textures.length>0) instanceName = newObjects._textures[0].data.prefabInstanceName;

                    game.editor.selectedPrefabs[instanceName] = true;
                    game.editor.updateSelection();

                }
            break;
        }
    }

    this.contactListener = new Box2D.Dynamics.b2ContactListener();
	this.contactListener.BeginContact = function (contact, target) {
	}
	this.contactListener.EndContact = function (contact, target) {
	}
	this.contactListener.PreSolve = function (contact, oldManifold, target) {
	}
	this.contactListener.PostSolve = function (contact, impulse, target) {
        var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
        var body;
        for(var i = 0; i<bodies.length; i++){
            body = bodies[i];
            var foundGroup = false;
            for(var j = 0; j<self.vehicleCharacters.length; j++){
                if(body.mySprite.data.groups.indexOf(self.vehicleCharacters[j])>=0){
                    characterFunctions.contactListener.PostSolve(contact, impulse, target, self.vehicleCharacters[j]);
                    foundGroup = true;
                    break;
                }
            }
            if(foundGroup) break;
        }
    }
}
let vehicle2 = new vehicle1.constructor();
vehicle2.vehicleCharacters = ["character", "baby"];
vehicle2.update_super = vehicle2.update;
vehicle2.update = function(target){
    vehicle2.update_super(target);
    var drone = target.lookupObject["drone"];
    console.log(drone);
    var dirFore = new Box2D.Common.Math.b2Vec2(0, -1);
    dirFore.Multiply(400.0);
    drone.ApplyForce(dirFore, drone.GetPosition());

    var desiredAngle = 0;
    var nextAngle = drone.GetAngle() + drone.GetAngularVelocity() / 60.0;
    var totalRotation = desiredAngle - nextAngle;
    while ( totalRotation < -180 * game.editor.DEG2RAD ) totalRotation += 360 * game.editor.DEG2RAD;
    while ( totalRotation >  180 * game.editor.DEG2RAD ) totalRotation -= 360 * game.editor.DEG2RAD;
    var desiredAngularVelocity = totalRotation * 60;
    var change = 100 * game.editor.DEG2RAD; 
    desiredAngularVelocity = Math.min( change, Math.max(-change, desiredAngularVelocity));
    var impulse = drone.GetInertia() * desiredAngularVelocity;
    drone.m_angularVelocity += drone.m_invI * impulse;
}

let vain = new function(){
    this.init = function(target){
        //swap childs
    }
}

let jumppad = new function(){
    var self = this;
    this.init = function(target){
        target.lookupObject = game.editor.lookupGroups[target.prefabName+"_"+target.instanceID];
        target.__jumpPadTimer = 0;
    }
    this.settings = function(target){
        this._options = {};
        this.delay = 0;

    }
    this.set = function(target, property, value){
    }
    this.update = function(target){
        target_jumpPadTimer += game.editor.deltaTime;
    }
    this.contactListener = new Box2D.Dynamics.b2ContactListener();
	this.contactListener.BeginContact = function (contact, target) {
	}
	this.contactListener.EndContact = function (contact, target) {
	}
	this.contactListener.PreSolve = function (contact, oldManifold, target) {
	}
	this.contactListener.PostSolve = function (contact, impulse, target) {
    }
}

export var prefabs = {
    vehicle1:{/*Character Bike*/
        json:'{"objects":[[0,-1.4881290485477856,-0.20601457546639562,0,".character","belly",0,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,14.181497764354457,""],[0,-2.920810985896667,3.0917373915784503,0,".vehicle","wheel_back",1,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,55.342622382700604,""],[0,-0.03955553222104535,-2.277293681725032,-0.7679448708775047,".character , .flesh","shoulder_left",2,"#999999","#000",0,false,true,[{"x":-0.18491373990083915,"y":-0.8588215919838902},{"x":0.19313212834087423,"y":-0.8423848151038147},{"x":0.11094824394050207,"y":0.8506032035438524},{"x":-0.11916663238053715,"y":0.8506032035438524}],1,7,null,""],[0,-0.3691781484732874,3.415442212226376,0,".vehicle","pedal",3,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,15.695946924915829,""],[0,-0.0024367989173880167,1.7711747161382954,0,".vehicle","frame",4,"#999999","#000",0,false,true,[{"x":-1.866666666666669,"y":-1.666666666666667},{"x":1.966666666666665,"y":-2.7666666666666666},{"x":3.066666666666663,"y":1.299999999999999},{"x":-0.23333333333333428,"y":1.7666666666666657},{"x":-2.9333333333333353,"y":1.3666666666666671}],1,7,null,""],[0,3.0307281006448505,3.0622425654175935,0,".vehicle","wheel_front",5,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,54.82895314162905,""],[0,1.1978604828584272,-1.609188225246529,-1.4660765716752366,".character , .flesh","arm_left",6,"#999999","#000",0,false,true,[{"x":-0.13560340926061798,"y":-0.6862354347431072},{"x":0.14382179770064596,"y":-0.7026722116231809},{"x":0.12738502082057224,"y":0.6944538231831459},{"x":-0.13560340926061798,"y":0.6944538231831459}],1,7,null,""],[1,-0.7160443489714556,-68.645859238965,-0.7679448708775047,"","",7,"Normal_Shoulder0000",2,0.5731017503262358,-0.16063012257496162,0,true],[1,36.1859955572582,-48.436827005807,-1.4660765716752366,"","",8,"Normal_Arm0000",6,0.29760652045521085,-0.8937510689744023,0,true],[2,17.416513728842347,-50.266620396764175,0,".character","arm_left_joint",6,2,0,false,false,1,10,true,152,0,0,0],[0,2.0984960915311635,-1.3468220706618923,-1.5009831567151235,".character , .flesh","hand_left",10,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.512582183874799,""],[1,62.42196782222551,-38.68795758796856,-1.5009831567151235,"","",11,"Normal_Hand0000",10,1.7975185021906417,2.9104087855451417,0,true],[2,56.47732156051728,-44.82853576963867,0,".character","hand_left_joint",10,6,0,false,false,1,10,true,60,-60,0,0],[0,-0.5588139425124747,0.5365243275043186,-0.9075712110370522,".character , .flesh","thigh_left",13,"#999999","#000",0,false,true,[{"x":-0.20241022695050503,"y":-1.031328299223996},{"x":0.1959845054600109,"y":-1.0441797422049808},{"x":0.17028161949803788,"y":1.0377540207144893},{"x":-0.16385589800755085,"y":1.0377540207144893}],1,7,null,""],[0,0.09544964279849022,2.0289178508961574,0.24434609527920528,".character , .flesh","leg_left",14,"#999999","#000",0,false,true,[{"x":-0.16064303726230378,"y":-0.9124524516498909},{"x":0.16064303726230378,"y":-0.9253038946308756},{"x":0.08353437937639896,"y":0.9124524516498909},{"x":-0.08353437937639896,"y":0.9253038946308738}],1,7,null,""],[1,-16.718291009464384,16.506359197979467,-0.9075712110370522,"","",15,"Normal_Thigh0000",13,0.4132120599733628,-2.3665034033387577,0,true],[0,0.02931587646287237,3.1040822873389744,0.10471975511965961,".character , .flesh","feet_right",16,"#999999","#000",0,false,true,[{"x":-0.3532003169100655,"y":-0.2334193398709985},{"x":0.3593429311171974,"y":0},{"x":0.3593429311171974,"y":0.12285228414263472},{"x":-0.3654855453243293,"y":0.11056705572837089}],1,7,null,""],[1,2.670598608971157,60.819442480124174,0.24434609527920528,"","",17,"Normal_Leg0000",14,0.19879575861250487,-3.1415926535889356,0,true],[2,6.080191949668233,34.84420049102433,0,".character","leg_left_joint",14,13,0,false,false,1,10,true,0,-149,0,0],[1,1.553752298147555,91.76572057838662,0.10471975511965961,"","",19,"Normal_Feet0000",16,1.515062169946712,1.2142877670861258,0,true],[1,-10.718575303802261,102.41178466834725,0,"","",20,"Bicycle_Pedals0000",3,0.36046441148776853,0.1433105210885714,0,null],[1,90.91636655216612,91.86727696252792,0,"","",21,"Bicycle_WheelFront0000",5,0.005476467179391875,-3.141592653569034,0,null],[1,-87.04193017482575,92.21545703335131,0,"","",22,"Bicycle_WheelBack0000",1,0.7919583819819808,0.7445522010315536,0,null],[1,0.926896032478245,33.13524148414858,0,"","",23,"Bicycle_Body0000",4,20.024984394501065,1.5208379310729603,0,null],[2,-4.550705044708593,87.37277584095949,0,".character","feet_left_joint",16,14,0,false,false,1,10,true,0,0,0,0],[2,-87.4842532404466,91.4420717514557,0,".vehicle","engine1",1,4,0,false,true,100,20,false,0,0,0,0],[2,-11.344974603786795,102.19192260910702,0,".vehicle","pedal_engine",3,4,0,false,true,100,20,false,0,0,0,0],[2,90.83504076225108,91.71118831367843,0,".vehicle","engine2",5,4,0,false,true,100,20,false,0,0,0,0],[0,-0.17580386243077534,-4.356680473333219,0,".character , .flesh","head",28,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,30.393075689479595,""],[0,-0.8956772643041511,-1.9211056898254968,0.3490658503988659,".character , .flesh","body",29,"#999999","#000",0,false,true,[{"x":-0.5373137876370677,"y":1.2023497051222813},{"x":-0.4316127146592841,"y":-1.3697097373371037},{"x":-0.1497431867185277,"y":-1.82774772024083},{"x":0.1321263412222251,"y":-1.7925140292482356},{"x":0.5549306331333597,"y":-1.1230739003889436},{"x":0.5549306331333597,"y":1.308050778100065},{"x":0.09689265022963056,"y":1.801322451996385},{"x":-0.2202105687037168,"y":1.801322451996385}],1,7,null,""],[1,-41.13422078907006,-14.192199759023456,0.2,"","",30,"Normal_Belly0000",0,8.746770037203438,1.1579140652818587,-0.2,false],[1,-24.74000283543914,-61.216582791160576,0.3490658503988659,"","",31,"Normal_Core0000",29,4.16882293351236,1.3835014335302833,0,true],[1,-3.1600944133683404,-132.81443565955223,0,"","",32,"Normal_Head_Idle0000",28,2.989677819250855,0.785398163397623,0,true],[2,-8.694490254222274,-102.80460570208368,0,".character","head_joint",28,29,0,false,false,1,10,true,58,-64,0,0],[0,-0.9747147864807904,0.9190024212953947,-0.45378560551852554,".character , .flesh","thigh_right",34,"#999999","#000",0,false,true,[{"x":-0.20241022695050503,"y":-1.031328299223996},{"x":0.1959845054600109,"y":-1.0441797422049808},{"x":0.17028161949803788,"y":1.0377540207144893},{"x":-0.16385589800755085,"y":1.0377540207144893}],1,7,null,""],[0,-0.6535186114599003,2.730751467419776,0.17453292519943295,".character , .flesh","leg_right",35,"#999999","#000",0,false,true,[{"x":-0.16064303726230378,"y":-0.9124524516498909},{"x":0.16064303726230378,"y":-0.9253038946308756},{"x":0.08353437937639896,"y":0.9124524516498909},{"x":-0.08353437937639896,"y":0.9253038946308738}],1,7,null,""],[0,0.013527587320195766,-4.45222602219477,0,".character","eye_left",36,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.534037070968986,""],[1,-29.379992751533365,27.95936473687005,-0.45378560551852554,"","",37,"Normal_Thigh0000",34,0.4132120599733628,-2.3665034033387577,0,true],[1,-19.801333948144578,81.88802350138246,0.17453292519943295,"","",38,"Normal_Leg0000",35,0.19879575861250487,-3.1415926535889356,0,true],[1,0.5755116198004658,-134.1016627995932,0,"","",39,"Normal_Eye0000",36,0.5611519909321366,1.2636024235635333,0,null],[2,-15.604603771833126,55.962843746038146,0,".character","leg_right_joint",35,34,0,false,false,1,10,true,0,-149,0,0],[0,-0.6013410814276934,3.800669590829147,0,".character , .flesh","feet_right",41,"#999999","#000",0,false,true,[{"x":-0.3532003169100655,"y":-0.2334193398709985},{"x":0.3593429311171974,"y":0},{"x":0.3593429311171974,"y":0.12285228414263472},{"x":-0.3654855453243293,"y":0.11056705572837089}],1,7,null,""],[1,-17.51146898092036,112.60029105627989,0,"","",42,"Normal_Feet0000",41,1.515062169946712,1.2142877670861258,0,true],[2,-24.30243173046574,108.76090925482245,0,".character","feet_right_joint",41,35,0,false,false,1,10,true,0,0,0,0],[0,-0.29131890831604274,-2.116475866987431,-0.5235987755982988,".character , .flesh","shoulder_right",44,"#999999","#000",0,false,true,[{"x":-0.18491373990083915,"y":-0.8588215919838902},{"x":0.19313212834087423,"y":-0.8423848151038147},{"x":0.11094824394050207,"y":0.8506032035438524},{"x":-0.11916663238053715,"y":0.8506032035438524}],1,7,null,""],[0,0.7674060221504146,-1.3587035285866276,-1.4835298641951802,".character , .flesh","arm_right",45,"#999999","#000",0,false,true,[{"x":-0.13560340926061798,"y":-0.6862354347431072},{"x":0.14382179770064596,"y":-0.7026722116231809},{"x":0.12738502082057224,"y":0.6944538231831459},{"x":-0.13560340926061798,"y":0.6944538231831459}],1,7,null,""],[1,-8.20380484261639,-63.69775637628599,-0.5235987755982988,"","",46,"Normal_Shoulder0000",44,0.5731017503262358,-0.16063012257496162,0,true],[1,23.26951064902393,-40.92662781922026,-1.4835298641951802,"","",47,"Normal_Arm0000",45,0.29760652045521085,-0.8937510689744023,0,true],[2,4.452407532936377,-42.06868058388569,0,".character","arm_right_joint",45,44,0,false,false,1,10,true,152,0,0,0],[0,1.6142293071474496,-1.2288497792194542,-1.7453292519943295,".character , .flesh","hand_right",49,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.512582183874799,""],[1,48.3251025560185,-35.070858517476736,-1.7453292519943295,"","",50,"Normal_Hand0000",49,1.7975185021906417,2.9104087855451417,0,true],[2,41.047027389191896,-39.782258786761524,0,".character","hand_right_joint",49,45,0,false,false,1,10,true,60,-60,0,0],[2,-18.426156553864757,-80.86404422851663,0,".character","shoulder_right_joint",44,29,0,false,false,1,10,true,180,-19,0,0],[2,0.20593900816288624,-133.80202874938874,0,".character","eye_left_joint",36,28,0,false,false,1,10,true,0,0,0,0],[0,0.698014487908662,-4.442322400630781,0,".character","eye_right",54,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.534037070968986,""],[1,21.110118637454455,-133.80455415267352,0,"","",55,"Normal_Eye0000",54,0.5611519909321366,1.2636024235635333,0,null],[2,20.900219512693866,-132.8095744769817,0,".character","eye_right_joint",54,28,0,false,false,1,10,true,0,0,0,0],[2,-12.921286659664474,-85.47865823194277,0,".character","shoulder_left_joint",2,29,0,false,false,1,10,true,180,-19,0,0],[2,-18.49355094501061,113.74126702226283,0,".character","pedal_right_joint",41,3,0,false,false,1,10,false,0,0,0,0],[2,-0.8655909460089788,92.6312408506183,0,".character","pedal_left_joint",16,3,0,false,false,1,10,false,0,0,0,0],[2,64.20863172995291,-40.41550229109624,0,".character","grip_left_joint",4,10,0,false,false,1,10,false,0,0,0,0],[2,51.47605901568875,-34.80283447309619,0,".character","grip_right_joint",4,49,0,false,false,1,10,false,0,0,0,0],[2,-40.15504316702885,-112.59470576523498,0,".character","neck_joint",29,28,2,false,false,1,10,false,0,0,0.25,3],[2,-96.05584504862952,-149.53615887833575,0,".character","back_joint",4,29,2,false,false,1,10,false,0,0,0.25,4],[2,-42.70650479921926,-11.93468248655901,0,".character","core_joint",29,0,0,false,false,1,10,true,10,-10,0,0],[2,-46.94748098294406,0.36414844624303555,0,".character","sit_joint",4,0,2,false,false,1,10,false,0,0,0.5,10],[2,-41.43421194410138,0.3641484462430604,0,".character","thigh_right_joint",34,0,0,false,false,1,10,true,142,-16,0,0],[2,-36.34504052363036,-3.8768277374817988,0,".character","thigh_left_joint",13,0,0,false,false,1,10,true,142,-16,0,0]]}',
        settings:vehicle1.settings,
        init:vehicle1.init,
        update:vehicle1.update,
        set:vehicle1.set,
        contactListener:vehicle1.contactListener
    },
    vehicle2:{
        json:'{"objects":[[0,1.8770804670953565,2.8395801032592605,-0.8726646259971647,".baby, .flesh","belly",0,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,12.528310919669748,""],[0,1.1167177515019886,2.0652995179453058,-0.8377580409572781,".baby, .flesh","body",0,"#999999","#000",1,false,true,[{"x":-0.3386843580322676,"y":-0.7855595526581733},{"x":0.22578957202151173,"y":-0.766743754989714},{"x":0.48921073937993853,"y":0.7761516538239436},{"x":-0.3763159533691862,"y":0.7761516538239436}],1,7,null,""],[0,0.2944821108611123,1.0331424301521883,-0.5235987755982988,".baby, .flesh","head",2,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,18.818110580123538,""],[0,2.3196402170090478,3.0742435644329404,-1.1519173063162573,".baby, .flesh","thigh_right",3,"#999999","#000",0,false,true,[{"x":-0.14457873353607198,"y":-0.40803331464625425},{"x":0.13815301204558494,"y":-0.40803331464625425},{"x":0.13815301204558494,"y":0.4144590361367464},{"x":-0.13172729055508725,"y":0.40160759315576167}],1,7,null,""],[0,2.727912414193561,3.607067892598617,0,".baby, .flesh","leg_right",4,"#999999","#000",0,false,true,[{"x":-0.13494015130033432,"y":-0.3534146819770707},{"x":0.13494015130033432,"y":-0.340563238996086},{"x":0.10923726533836842,"y":0.35341468197707027},{"x":-0.10923726533836842,"y":0.340563238996086}],1,7,null,""],[0,2.882129729965378,4.169318523016688,0,".baby, .flesh","feet_right",5,"#999999","#000",0,false,true,[{"x":-0.2506031381291933,"y":-0.26024172036493365},{"x":0.2506031381291933,"y":-0.02891574670721475},{"x":0.2506031381291933,"y":0.13815301204558228},{"x":-0.2506031381291933,"y":0.151004455026567}],1,7,null,""],[0,0.9720826796484815,2.132906847514917,-0.8726646259971648,".baby, .flesh","shoulder_right",6,"#999999","#000",0,false,true,[{"x":-0.1542173157718132,"y":-0.34698896048657835},{"x":0.1542173157718132,"y":-0.34698896048657835},{"x":0.10281154384787783,"y":0.3469889604865781},{"x":-0.10281154384787428,"y":0.3469889604865781}],1,7,null,""],[0,1.454531052900018,2.540826570553649,-0.8726646259971648,".baby, .flesh","arm_right",7,"#999999","#000",0,false,true,[{"x":-0.08674724012164603,"y":-0.3277117960151017},{"x":0.08032151863115189,"y":-0.3277117960151017},{"x":0.08032151863115189,"y":0.3277117960151018},{"x":-0.07389579714065775,"y":0.3277117960151018}],1,7,null,""],[0,1.8266667433789108,2.8386413154055834,-1.5707963267948966,".baby, .flesh","hand_right",8,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,4.140732332099213,""],[0,0.3451112041529584,1.0398872675320971,-0.5235987755982988,".baby","eye_left",9,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,4.90749138418765,""],[0,2.4292370432257995,3.0209243500071423,-1.1519173063162573,".baby, .flesh","thigh_left",10,"#999999","#000",0,false,true,[{"x":-0.14457873353607198,"y":-0.40803331464625425},{"x":0.13815301204558494,"y":-0.40803331464625425},{"x":0.13815301204558494,"y":0.4144590361367464},{"x":-0.13172729055508725,"y":0.40160759315576167}],1,7,null,""],[0,2.829952284837468,3.553748678172819,0,".baby, .flesh","leg_left",11,"#999999","#000",0,false,true,[{"x":-0.13494015130033432,"y":-0.3534146819770707},{"x":0.13494015130033432,"y":-0.340563238996086},{"x":0.10923726533836842,"y":0.35341468197707027},{"x":-0.10923726533836842,"y":0.340563238996086}],1,7,null,""],[0,2.9841696006092846,4.11599930859089,0,".baby, .flesh","feet_left",12,"#999999","#000",0,false,true,[{"x":-0.2506031381291933,"y":-0.26024172036493365},{"x":0.2506031381291933,"y":-0.02891574670721475},{"x":0.2506031381291933,"y":0.13815301204558228},{"x":-0.2506031381291933,"y":0.151004455026567}],1,7,null,""],[0,1.1010460510108344,1.9777619105218038,-0.8726646259971648,".baby, .flesh","shoulder_left",13,"#999999","#000",0,false,true,[{"x":-0.1542173157718132,"y":-0.34698896048657835},{"x":0.1542173157718132,"y":-0.34698896048657835},{"x":0.10281154384787783,"y":0.3469889604865781},{"x":-0.10281154384787428,"y":0.3469889604865781}],1,7,null,""],[0,1.6416813405833492,2.3899215087333747,-0.8726646259971648,".baby, .flesh","arm_left",14,"#999999","#000",0,false,true,[{"x":-0.08674724012164603,"y":-0.3277117960151017},{"x":0.08032151863115189,"y":-0.3277117960151017},{"x":0.08032151863115189,"y":0.3277117960151018},{"x":-0.07389579714065775,"y":0.3277117960151018}],1,7,null,""],[0,2.0040032463891206,2.700583527625744,-1.3962634015954636,".baby, .flesh","hand_left",15,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,4.140732332099213,""],[1,34.45786286805267,59.222730661984635,-0.8726646259971648,"","",16,"Baby_Shoulder0000",13,1.4307259998803614,-0.7956158475446496,0,false],[1,50.00233002192356,71.69776261540433,-0.8726646259971648,"","",17,"Baby_Arm0000",14,0.7518898135812221,-0.8728207039243283,0,false],[1,60.8500539159126,80.68002101360972,-1.3962634015954636,"","",18,"Baby_Hand0000",15,0.8041968215209448,-0.9631987539716846,0,false],[2,41.41927889452309,65.97445678888367,0,".baby","arm_left_joint",14,13,0,false,false,1,10,true,152,0,0,0],[2,56.558705023512786,77.61921485242561,0,".baby","hand_left_joint",15,14,0,false,false,1,10,true,90,-90,0,0],[1,70.1997710748372,90.34803862642542,-1.1519173063162573,"","",21,"Baby_Thigh0000",10,2.6919097697107235,1.8855865816231236,0,false],[2,26.365028589808112,53.66264761711045,0,".baby","shouler_left_joint",13,1,0,false,false,1,10,true,180,-19,0,0],[1,85.12535145765209,106.2816245558569,0,"","",23,"Baby_Leg0000",11,0.4011019931573195,0.9698786643381986,0,false],[1,90.37839040396032,125.45022416407843,0,"","",24,"Baby_Feet0000",12,2.1470887155437106,-1.1620895257072459,0,false],[2,84.383245505536,95.87379915351814,0,".baby","leg_left_joint",11,10,0,false,false,1,10,true,0,-149,0,0],[2,85.09134018983897,118.371530672786,0,".baby","feet_left_joint",12,11,0,false,false,1,10,true,60,-60,0,0],[1,52.72326750999713,78.23891546154144,-0.8726646259971647,"","",27,"Baby_Belly0000",0,7.820706684817398,1.1749207109300004,0,false],[1,29.517596980450413,61.56239920680639,-0.8377580409572781,"","",28,"Baby_Core0000",1,4.003626268938311,2.2046151169642796,0,false],[1,9.920941261372603,32.13400361043709,-0.5235987755982988,"","",29,"Baby_Head_Idle0000",2,1.5746175365211126,-1.3329132133449955,0,false],[1,66.91186628833465,91.94761505919936,-1.1519173063162573,"","",30,"Baby_Thigh0000",3,2.6919097697107235,1.8855865816231236,0,false],[1,82.06415533833488,107.88120098863084,0,"","",31,"Baby_Leg0000",4,0.4011019931573195,0.9698786643381986,0,false],[1,87.31719428464312,127.04980059685238,0,"","",32,"Baby_Feet0000",5,2.1470887155437106,-1.1620895257072459,0,false],[1,9.33572023465158,30.515829036590826,-0.5235987755982988,"","",33,"Baby_Eye0000",9,1.2243429860553319,2.0283749414039507,0,false],[1,30.588961727182078,63.87707877177803,-0.8726646259971648,"","",34,"Baby_Shoulder0000",6,1.4307259998803614,-0.7956158475446496,0,false],[1,44.38782139142363,76.22491447001255,-0.8726646259971648,"","",35,"Baby_Arm0000",7,0.7518898135812221,-0.8728207039243283,0,false],[1,55.46026552265648,84.70012617946131,-1.5707963267948966,"","",36,"Baby_Hand0000",8,0.8041968215209448,-0.9631987539716846,0,false],[2,80.86863205184977,98.15350158784833,0,".baby","leg_right_joint",4,3,0,false,false,1,10,true,0,-149,0,0],[2,82.03014407052183,119.97110710555994,0,".baby","feet_right_joint",5,4,0,false,false,1,10,true,60,-60,0,0],[2,36.226380059402075,70.43252920521421,0,".baby","arm_right_joint",7,6,0,false,false,1,10,true,152,0,0,0],[2,51.72216600115297,82.43364708151539,0,".baby","hand_right_joint",8,7,0,false,false,1,10,true,90,-90,0,0],[2,16.871009837940342,49.50574863608818,0,".baby","head_joint",2,1,0,false,false,1,10,true,64,-58,0,0],[2,51.75704550455356,78.02321861138586,0,".baby","core_joint",0,1,0,false,false,1,10,true,20,-20,0,0],[0,0.7715602559158526,0.7904325781211758,-0.5235987755982988,".baby","eye_right",43,"#999999","#000",1,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,4.90749138418765,""],[1,22.129191787538407,23.032188354263187,-0.5235987755982988,"","",44,"Baby_Eye0000",43,1.2243429860553319,2.0283749414039507,0,false],[2,10.902845294333195,30.900379124195418,0,".baby","eye_left_joint",9,2,0,false,false,1,10,true,0,0,0,0],[2,23.31974404923785,23.84804292743746,0,".baby","eye_right_joint",43,2,0,false,false,1,10,true,0,0,0,0],[2,62.375951885129155,82.01471940619375,0,".baby","thigh_right_joint",3,0,0,false,false,1,10,true,142,-16,0,0],[2,58.7101425553149,84.28180607804718,0,".baby","thigh_left_joint",10,0,0,false,false,1,10,true,142,-16,0,0],[2,23.054753106747,58.91398119629813,0,".baby","shoulder_right_joint",6,1,0,false,false,1,10,true,180,-19,0,0],[0,0.029258558270379487,-3.164106997061139,0,".vehicle","",50,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,""],[0,0.03430294773733933,-2.691733440880233,0,".vehicle","",51,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,""],[2,0.7896963827467407,-88.04263115895098,0,".vehicle","",51,50,0,false,false,1,10,false,0,0,0,0],[0,0.03359993308569087,-2.1929568343282364,0,".vehicle","",53,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,""],[0,0.03864432255265782,-1.7162324248840077,0,".vehicle","",54,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,""],[2,0.9199376272064796,-58.77760067906489,0,".vehicle","",54,53,0,false,false,1,10,false,0,0,0,0],[2,0.7896963827467407,-73.20032409806304,0,".vehicle","",53,51,0,false,false,1,10,false,0,0,0,0],[0,0.040238844595757106,-1.2285365296221227,0,".vehicle","",57,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,""],[0,0.045283234062724054,-0.7518121201778851,0,".vehicle","",58,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,""],[2,1.1191049725086373,-29.844991537881214,0,".vehicle","",58,57,0,false,false,1,10,false,0,0,0,0],[0,-0.0066249332828914875,-3.6436866475341794,0,".vehicle","drone",60,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":-0.8579563683010285,"y":-0.6193802658857717},{"x":0.867132372240075,"y":-0.6377322737638682},{"x":0.8304283564838819,"y":0.6469082777029147},{"x":-0.839604360422932,"y":0.6102042619467216}],[{"x":-2.326116998548784,"y":-1.3534605810096458},{"x":2.39034902612212,"y":-1.3351085731315493},{"x":1.7113247346325338,"y":-0.6193802658857717},{"x":-1.738852746449684,"y":-0.6927882973981578}]],1,0,[null,null],""],[0,0.044580219411075594,-0.25303551362588994,0,".vehicle","",61,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,""],[0,0.04962460887803544,0.2236888958183405,0,".vehicle","",62,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,""],[0,0.015289176886051581,2.7060988766065,0,".vehicle","frame",63,"#999999","#000",0,false,true,[{"x":-1.8999999999999986,"y":-2.2750000000000004},{"x":0.466666666666665,"y":-2.408333333333334},{"x":2.4333333333333336,"y":2.3249999999999993},{"x":-1,"y":2.358333333333333}],1,7,null,""],[0,1.855916785196217,5.154638355582085,0,".vehicle","wheel_front",64,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],45,7,14.270921975981269,""],[1,56.33496865734764,154.94787732108614,0,"","",65,"Trolley_WheelFront0000",64,0.726341865994865,-0.439009584300533,0,false],[0,-0.862267421127426,5.075638979290257,0,".vehicle","wheel_back",66,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,17.067622731811838,""],[1,-24.94142249602853,152.9301832468329,0,"","",67,"Trolley_WheelBack0000",66,1.1382122601756437,-0.6196465395626374,0,false],[1,9.958675306581377,81.932966298195,0,"","",68,"Trolley_Body0000",63,9.529559276272789,-0.07878396098914521,0,false],[2,-25.341360125214546,151.21584436148402,0,".vehicle","engine1",66,63,0,false,false,1,10,false,0,0,0,0],[2,55.29132870966981,154.11248815885068,0,".vehicle","engine2",64,63,0,false,false,1,10,false,0,0,0,0],[2,1.2493462169683767,-0.579961057994403,0,".vehicle","",62,61,0,false,false,1,10,false,0,0,0,0],[2,1.1191049725086373,-15.002684476993116,0,".vehicle","",61,58,0,false,false,1,10,false,0,0,0,0],[2,1.3400616250780217,-44.16230498080213,0,".vehicle","",57,54,0,false,false,1,10,false,0,0,0,0],[2,13.828277400476672,-45.313446380282386,0,".vehicle","",62,50,3,false,false,1,10,false,0,0,0,0],[1,0.810220205016086,-121.00615882483045,0,"","",75,"Trolley_Drone0000",60,11.73900023369356,1.4847400519934932,0,false],[2,0.7407509906831256,-100.94961599381195,0,".vehicle","",50,60,0,false,false,1,10,false,0,0,0,0],[2,1.2100707139276778,14.80546468358241,0,".vehicle","",62,63,0,false,false,1,10,false,0,0,0,0],[0,-3.811232574563851,1.0289922937129319,-0.2617993877991494,".character","belly",78,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,14.181497764354457,""],[0,-3.4147711509547607,-1.013294769398382,-0.06981317007977322,".character , .flesh","shoulder_left",79,"#999999","#000",0,false,true,[{"x":-0.18491373990083915,"y":-0.8588215919838902},{"x":0.19313212834087423,"y":-0.8423848151038147},{"x":0.11094824394050207,"y":0.8506032035438524},{"x":-0.11916663238053715,"y":0.8506032035438524}],1,7,null,""],[0,-2.6631870174206025,0.005612214073403621,-1.3439035240356332,".character , .flesh","arm_left",80,"#999999","#000",0,false,true,[{"x":-0.13560340926061798,"y":-0.6862354347431072},{"x":0.14382179770064596,"y":-0.7026722116231809},{"x":0.12738502082057224,"y":0.6944538231831459},{"x":-0.13560340926061798,"y":0.6944538231831459}],1,7,null,""],[1,-101.8723945454386,-30.34686724334315,-0.06981317007977322,"","",81,"Normal_Shoulder0000",79,0.5731017503262358,-0.16063012257496162,0,true],[1,-79.62765133183815,0.03887698983781157,-1.3439035240356332,"","",82,"Normal_Arm0000",80,0.29760652045521085,-0.8937510689744023,0,true],[2,-100.0294327953265,-7.035972942706177,-0.2617993877991494,".character","arm_left_joint",80,79,0,false,false,1,10,true,152,0,0,0],[0,-1.8543739201670726,0.33344896386552314,-1.1868238913561437,".character , .flesh","hand_left",84,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.512582183874799,""],[1,-56.66854069051087,11.471472179589162,-1.1868238913561437,"","",85,"Normal_Hand0000",84,1.7975185021906417,2.9104087855451417,0,true],[2,-61.424692241353405,2.794438565677428,0.31415926535897937,".character","hand_left_joint",84,80,0,false,false,1,10,true,60,-60,0,0],[0,-2.601611998780638,1.6247641670309356,-1.0995574287564283,".character , .flesh","thigh_left",87,"#999999","#000",0,false,true,[{"x":-0.20241022695050503,"y":-1.031328299223996},{"x":0.1959845054600109,"y":-1.0441797422049808},{"x":0.17028161949803788,"y":1.0377540207144893},{"x":-0.16385589800755085,"y":1.0377540207144893}],1,7,null,""],[0,-1.6598826638866426,2.932102212092822,-0.0349065850398874,".character , .flesh","leg_left",88,"#999999","#000",0,false,true,[{"x":-0.16064303726230378,"y":-0.9124524516498909},{"x":0.16064303726230378,"y":-0.9253038946308756},{"x":0.08353437937639896,"y":0.9124524516498909},{"x":-0.08353437937639896,"y":0.9253038946308738}],1,7,null,""],[1,-77.9247284071983,49.13720846837188,-1.0995574287564283,"","",89,"Normal_Thigh0000",87,0.4132120599733628,-2.3665034033387577,0,true],[0,-1.3790913273097227,3.9778797708570837,-0.10471975511965992,".character , .flesh","feet_right",90,"#999999","#000",0,false,true,[{"x":-0.3532003169100655,"y":-0.2334193398709985},{"x":0.3593429311171974,"y":0},{"x":0.3593429311171974,"y":0.12285228414263472},{"x":-0.3654855453243293,"y":0.11056705572837089}],1,7,null,""],[1,-49.995154574206914,87.97000423470699,-0.0349065850398874,"","",91,"Normal_Leg0000",88,0.19879575861250487,-3.1415926535889356,0,true],[2,-52.34827190830062,58.816623976511416,-0.3665191429188093,".character","leg_left_joint",88,87,0,false,false,1,10,true,0,-149,0,0],[1,-40.99528214287174,117.86910341971873,-0.10471975511965992,"","",93,"Normal_Feet0000",90,1.515062169946712,1.2142877670861258,0,true],[2,-50.147314443673835,111.7383300655483,-0.3665191429188093,".character","feet_left_joint",90,88,0,false,false,1,10,true,0,0,0,0],[0,-3.6178951690292944,-3.319897844868739,-0.2617993877991494,".character , .flesh","head",95,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,30.393075689479595,""],[0,-3.6828663398140957,-0.780996313152651,0.08726646259971638,".character , .flesh","body",96,"#999999","#000",0,false,true,[{"x":-0.5373137876370677,"y":1.2023497051222813},{"x":-0.4316127146592841,"y":-1.3697097373371037},{"x":-0.1497431867185277,"y":-1.82774772024083},{"x":0.1321263412222251,"y":-1.7925140292482356},{"x":0.5549306331333597,"y":-1.1230739003889436},{"x":0.5549306331333597,"y":1.308050778100065},{"x":0.09689265022963056,"y":1.801322451996385},{"x":-0.2202105687037168,"y":1.801322451996385}],1,7,null,""],[1,-113.02051173460872,22.222636068972356,-0.0617993877991494,"","",97,"Normal_Belly0000",78,8.746770037203438,1.1579140652818587,-0.2,false],[1,-109.35571912429668,-27.442565803039898,0.08726646259971638,"","",98,"Normal_Core0000",96,4.16882293351236,1.3835014335302833,0,true],[1,-107.04201616125385,-102.18607228666453,-0.2617993877991494,"","",99,"Normal_Head_Idle0000",95,2.989677819250855,0.785398163397623,0,true],[2,-104.62071650356022,-71.76639544145299,-0.2617993877991494,".character","head_joint",95,96,0,false,false,1,10,true,58,-64,0,0],[0,-2.857469987755504,1.682793876849109,-1.0646508437165412,".character , .flesh","thigh_right",101,"#999999","#000",0,false,true,[{"x":-0.20241022695050503,"y":-1.031328299223996},{"x":0.1959845054600109,"y":-1.0441797422049808},{"x":0.17028161949803788,"y":1.0377540207144893},{"x":-0.16385589800755085,"y":1.0377540207144893}],1,7,null,""],[0,-1.9449698155809214,3.016344050612415,-0.08726646259971645,".character , .flesh","leg_right",102,"#999999","#000",0,false,true,[{"x":-0.16064303726230378,"y":-0.9124524516498909},{"x":0.16064303726230378,"y":-0.9253038946308756},{"x":0.08353437937639896,"y":0.9124524516498909},{"x":-0.08353437937639896,"y":0.9253038946308738}],1,7,null,""],[0,-3.4597440397062273,-3.461190343133497,-0.2617993877991494,".character","eye_left",103,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.534037070968986,""],[1,-85.61430368367084,50.88217425517664,-1.0646508437165412,"","",104,"Normal_Thigh0000",101,0.4132120599733628,-2.3665034033387577,0,true],[1,-58.547133748160526,90.50764771036957,-0.08726646259971645,"","",105,"Normal_Leg0000",102,0.19879575861250487,-3.1415926535889356,0,true],[1,-103.76685671619042,-104.39628421191428,-0.2617993877991494,"","",106,"Normal_Eye0000",103,0.5611519909321366,1.2636024235635333,0,null],[2,-63.13105040043212,62.83748017899221,-0.2617993877991494,".character","leg_right_joint",102,101,0,false,false,1,10,true,0,-149,0,0],[0,-1.6509883380654684,4.0363010595295155,-0.10471975511965978,".character , .flesh","feet_right",108,"#999999","#000",0,false,true,[{"x":-0.3532003169100655,"y":-0.2334193398709985},{"x":0.3593429311171974,"y":0},{"x":0.3593429311171974,"y":0.12285228414263472},{"x":-0.3654855453243293,"y":0.11056705572837089}],1,7,null,""],[1,-49.15219246554411,119.62174207989169,-0.10471975511965978,"","",109,"Normal_Feet0000",108,1.515062169946712,1.2142877670861258,0,true],[2,-57.86736216005059,114.1599423116002,-0.2617993877991494,".character","feet_right_joint",108,102,0,false,false,1,10,true,0,0,0,0],[0,-3.549666518126136,-0.8594621988899322,-0.08726646259971674,".character , .flesh","shoulder_right",111,"#999999","#000",0,false,true,[{"x":-0.18491373990083915,"y":-0.8588215919838902},{"x":0.19313212834087423,"y":-0.8423848151038147},{"x":0.11094824394050207,"y":0.8506032035438524},{"x":-0.11916663238053715,"y":0.8506032035438524}],1,7,null,""],[0,-2.8218539132611475,0.05013514733789126,-1.3962634015954631,".character , .flesh","arm_right",112,"#999999","#000",0,false,true,[{"x":-0.13560340926061798,"y":-0.6862354347431072},{"x":0.14382179770064596,"y":-0.7026722116231809},{"x":0.12738502082057224,"y":0.6944538231831459},{"x":-0.13560340926061798,"y":0.6944538231831459}],1,7,null,""],[1,-105.91843538358343,-25.741858830418515,-0.08726646259971674,"","",113,"Normal_Shoulder0000",111,0.5731017503262358,-0.16063012257496162,0,true],[1,-84.39480238907879,1.3607185480555934,-1.3962634015954631,"","",114,"Normal_Arm0000",112,0.29760652045521085,-0.8937510689744023,0,true],[2,-104.7102880226859,-5.399504217728499,-0.2617993877991494,".character","arm_right_joint",112,111,0,false,false,1,10,true,152,0,0,0],[0,-1.9847277773349132,0.3626672808649234,-1.4311699866353498,".character , .flesh","hand_right",116,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.512582183874799,""],[1,-60.19320134439192,12.555366885993909,-1.4311699866353498,"","",117,"Normal_Hand0000",116,1.7975185021906417,2.9104087855451417,0,true],[2,-65.65915940737598,5.825510046128613,0.31415926535897937,".character","hand_right_joint",116,112,0,false,false,1,10,true,60,-60,0,0],[2,-108.34214914561012,-48.054699891921786,-0.2617993877991494,".character","shoulder_right_joint",111,96,0,false,false,1,10,true,180,-19,0,0],[2,-104.04628544770542,-104.01120751394585,-0.2617993877991494,".character","eye_left_joint",103,95,0,false,false,1,10,true,0,0,0,0],[0,-2.7960172187950185,-3.6287824252865413,-0.2617993877991494,".character","eye_right",121,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.534037070968986,""],[1,-83.85505208885417,-109.4240466765056,-0.2617993877991494,"","",122,"Normal_Eye0000",121,0.5611519909321366,1.2636024235635333,0,null],[2,-83.80027938481619,-108.40864422008359,-0.2617993877991494,".character","eye_right_joint",121,95,0,false,false,1,10,true,0,0,0,0],[2,-104.21920313432422,-53.936839905616836,-0.2617993877991494,".character","shoulder_left_joint",79,96,0,false,false,1,10,true,180,-19,0,0],[2,-137.5431414211764,-73.08031567111529,-0.2617993877991494,".character","neck_joint",96,95,2,false,false,1,10,false,0,0,0.25,3],[2,-113.95493300151007,24.810167351876032,-0.2617993877991494,".character","core_joint",96,78,0,false,false,1,10,true,10,-10,0,0],[2,-109.54282079624443,36.360632161180256,-0.2617993877991494,".character","thigh_right_joint",101,78,0,false,false,1,10,true,142,-16,0,0],[2,-105.72470409297325,30.9469892492341,-0.2617993877991494,".character","thigh_left_joint",87,78,0,false,false,1,10,true,142,-16,0,0],[2,25.39259214481462,75.7048701825143,0,".vehicle","baby_joint",1,63,2,false,false,1,10,false,0,0,0,2],[2,-8.814934154589924,45.050575584841376,0,".vehicle","neck_joint",2,1,2,false,false,1,10,false,0,0,0.25,3],[0,1.939490365443933,3.348464244309956,0,".vehicle","seatHitBox",131,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":-0.9229672686343307,"y":-0.2161379046801919},{"x":0.7009877989627853,"y":-0.0759403448876359},{"x":0.7477203188936343,"y":0.05257408492220961},{"x":-0.5257408492220961,"y":0.2395041646456164}],[{"x":-0.537423979204803,"y":0.22782103466290438},{"x":-3.1193957053843917,"y":-2.155537481810563},{"x":-2.803951195851134,"y":-2.4008832114475362},{"x":-0.2920782495678296,"y":-0.18108851473205134}]],1,6,[null,null],""],[2,-17.521971324663316,37.54027237238892,0,".vehicle","",63,131,0,false,false,1,10,false,0,0,0,0],[2,45.56693058198715,101.68065597748357,0,".vehicle","",63,131,0,false,false,1,10,false,0,0,0,0],[2,-48.10483270647429,122.7314727743819,0,".vehicle","pedal_right_joint",63,108,0,false,false,1,10,false,0,0,0,0],[2,-39.94156382298817,122.73147277438184,0,".vehicle","pedal_left_joint",63,90,0,false,false,1,10,false,0,0,0,0],[2,-57.58475786149327,13.18567098305277,0,".vehicle","grip_right_joint",63,116,0,false,false,1,10,false,0,0,0,0],[2,-54.42478280982256,10.815689694298129,0,".vehicle","grip_left_joint",63,84,0,false,false,1,10,false,0,0,0,0],[2,-109.52275380983554,82.03713302254458,0,"","",96,108,2,false,false,1,10,false,0,0,0.25,5],[2,-64.75644057780217,-15.658762325011017,0,"","",63,96,2,false,false,1,10,false,0,0,0.25,5],[0,5.254286412574671,3.2219547823428725,0,".vehicle","balanceBody",140,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,26.832815729997368,""],[2,11.212260330032628,116.50555857741826,0,".vehicle","balanceBody_joint",140,63,0,false,false,1,10,true,0,0,0,0]]}',
        settings:vehicle2.settings,
        init:vehicle2.init,
        update:vehicle2.update,
        set:vehicle2.set,
        contactListener:vehicle2.contactListener
    },
    vain:{
        json:'{"objects":[[0,0.003154367820629632,-0.07136374712007679,0,"","part1",0,"#890808","#630606",1,false,true,[{"x":0.028477641735626946,"y":-0.09142821820385016},{"x":0.02248234873865229,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":-0.08543292520687551}],10,7,null,""],[0,-0.048945224052909055,-0.21267429024827236,-0.7679448708775056,"","part2",1,"#890808","#6b0909",1,false,true,[{"x":0.028477641735626946,"y":-0.09142821820385016},{"x":0.02248234873865229,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":-0.08543292520687551}],10,7,null,""],[0,-0.05108297945339905,-0.22011994128041493,2.4260076602721177,"","part3",3,"#890808","#600303",1,false,true,[{"x":0.028477641735626946,"y":-0.09142821820385016},{"x":0.02248234873865229,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":-0.08543292520687551}],10,7,null,""],[0,0.003347876330606313,-0.06824396020197912,0,"","part4",2,"#890808","#660505",1,false,true,[{"x":0.028477641735626946,"y":-0.09142821820385016},{"x":0.02248234873865229,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":-0.08543292520687551}],10,7,null,""],[2,0.2604863299759831,-4.6079468327877935,0,"","part1_joint",1,0,0,false,false,1,10,false,0,0,0,0],[2,-3.3082859975393926,-8.384121948799184,0,"","part2_joint",2,1,0,false,false,1,10,false,0,0,0,0],[2,0.2729742921443762,-4.3639657228591675,0,"","part3_joint",2,3,0,false,false,1,10,false,0,0,0,0]]}',
        settings:undefined,
        init:vain.init,
        update:undefined,
        set:undefined
    },
    jumppad:{
        json:'{"objects":[[0,18.101371061146075,7.110018799757279,0,"","pad",0,["#707070","#999999"],["#423f3f","#000"],[1,1],false,true,[[{"x":-3.942850401425633,"y":0.4035988599884508},{"x":-3.942850401425633,"y":-0.4035988599884508},{"x":3.942850401425633,"y":-0.4035988599884508},{"x":3.942850401425633,"y":0.4035988599884508}],[{"x":-5.146081262043283,"y":-0.37157711946319416},{"x":-5.146081262043283,"y":-0.5382437861298603},{"x":5.353918737956719,"y":-0.5382437861298603},{"x":5.353918737956719,"y":-0.37157711946319416}]],1,0,[null,null],""],[0,18.217690462441496,7.177991029756618,0,"","platform",1,"#999999","#000",1,false,true,[{"x":-5.2,"y":0.3999999999999999},{"x":-5.2,"y":-0.3999999999999999},{"x":5.2,"y":-0.3999999999999999},{"x":5.2,"y":0.3999999999999999}],1,0,null,""],[1,547.0307138732447,216.33973089269867,0,"","",2,"Jumping0000",1,1.1180339887499458,-1.107148717794227,0,false],[1,546.1586939730835,199.1532504088225,0,"","",3,"Jumping_Pad0000",0,14.486741363389783,1.353898614790059,0,false],[2,546.940732062234,217.98024402074498,-0.01745329251994333,"","pad_joint",0,1,1,false,false,1,10,true,0,0,0,0,23,0]]}',
        settings:jumppad.settings,
        init:jumppad.init,
        update:jumppad.update,
        set:jumppad.set,
        contactListener:jumppad.contactListener
    }
}


const timerReady = function(timer, target, singleCallback){return singleCallback ?  (timer < target && timer+game.editor.deltaTime >= target) : timer>target;}

