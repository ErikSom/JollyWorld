import { Box2D } from "../libs/Box2D";
import { game } from "./Game";

var b2Vec2 = Box2D.Common.Math.b2Vec2,
    b2AABB = Box2D.Collision.b2AABB,
    b2BodyDef = Box2D.Dynamics.b2BodyDef,
    b2Body = Box2D.Dynamics.b2Body,
    b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
    b2Fixture = Box2D.Dynamics.b2Fixture,
    b2World = Box2D.Dynamics.b2World,
    b2MassData = Box2D.Collision.Shapes.b2MassData,
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
    b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
    b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
    b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef;

export function Vehicle(){
    this.engines = [];
    this.wheels = [];
    this.desiredVehicleTorques = [];
    this.desiredVehicleSpeeds = [];
    this.frame;
    this.vehicleBodies;
    this.characterBodies;

    this.init = function(_vehicleBodies, _characterBodies){
        this.vehicleBodies = _vehicleBodies;
        if(this.vehicleBodies){
           this.engine1 = this.vehicleBodies.engine1;
           this.engine2 = this.vehicleBodies.engine2;
           var i;
           var maxEngines = 4;
           for(i = 0; i<maxEngines; i++){
               var engine = this.vehicleBodies["engine"+i.toString()];
               if(engine != null){
                   this.engines.push(engine);
                   this.desiredVehicleTorques.push(engine.GetMotorTorque());
                   this.desiredVehicleSpeeds.push(engine.GetMotorSpeed());
                   var tarBody = engine.GetBodyA();
                   var fixture = tarBody.GetFixtureList();
                    while (fixture != null) {
                        if (fixture.GetShape() instanceof b2CircleShape) {
                            console.log("FOUND WHEEEL!!! :)");
                            this.wheels.push(fixture)

                        }
                        fixture = fixture.GetNext();
                    }
               }
           }


           this.frame = this.vehicleBodies.frame;
           this.frame.SetAngularDamping(0.8);
           this.stopAccelerateWheels();
        }
        this.characterBodies = _characterBodies;

    }

    this.RaycastCallbackWheel = function() {
        this.m_hit = false;
    }
    this.RaycastCallbackWheel.prototype.ReportFixture = function(fixture,point,normal,fraction) {
        //if ( ... not interested in this fixture ... )
          //  return -1;
        if(fixture.GetFilterData().groupIndex == game.editor.GROUPINDEX_CHARACTER) return -1;

        this.m_hit = true;
        this.m_point = point.Copy();
        this.m_normal = normal;
        this.m_fixture = fixture;
        return fraction;
    };


    this.accelerate = function(dir){
        //this.accelerateWheels(dir);

        var i;
        var j;
        var wheel;
        var offset = 0.5;

        for(i = 0; i<this.wheels.length; i++){
            wheel = this.wheels[i];

            var rayStart = wheel.GetBody().GetPosition();
            var rayEnd;
            // add 360 scope
            var wheelRadius = wheel.GetShape().GetRadius();
            var rayLength = wheelRadius+offset;
            var checkSlize = (360/20)*this.DEG2RAD;
            var totalCircleRad = 360*this.DEG2RAD;
            for(j = 0; j<totalCircleRad; j+=checkSlize){
                rayEnd = rayStart.Copy();
                rayEnd.Add(new b2Vec2(Math.cos(j)*rayLength, Math.sin(j)*rayLength));
                var callback = new this.RaycastCallbackWheel();
                wheel.GetBody().GetWorld().RayCast(callback, rayStart, rayEnd);
                if ( callback.m_hit ) {
                    console.log("HIT");
                    var forceDir = this.rotateVector(callback.m_normal, 90);
                    this.applyImpulse(this.desiredVehicleSpeeds[i]*dir, forceDir);
                    break;
                }
            }

        }


    }
    this.applyImpulse = function(force, angle){
        var i;
        var body;
        var dirFore = angle.Copy();
        dirFore.Multiply(force*10.0)
        for(i = 0; i<this.vehicleBodies._bodies.length; i++){
            body = this.vehicleBodies._bodies[i];
            body.ApplyForce(dirFore, body.GetPosition());
        }

    }
    this.rotateVector = function(vector, degrees){
        var radians = degrees * this.DEG2RAD;
        var sin = Math.sin(radians);
        var cos = Math.cos(radians);
        var tx = vector.x;
        var ty = vector.y;
        return new b2Vec2(cos * tx - sin * ty, sin * tx + cos * ty);
    }

    this.accelerateWheels = function(dir){
        var i;
        var engine;
        for(i = 0; i<this.engines.length; i++){
            engine = this.engines[i];
            engine.SetMaxMotorTorque(this.desiredVehicleTorques[i]);
            engine.SetMotorSpeed(dir*this.desiredVehicleSpeeds[i]);
        }
    }
    /*


var RaycastCallback = function() {
    this.m_hit = false;
}
RaycastCallback.prototype.ReportFixture = function(fixture,point,normal,fraction) {

    if ( ... not interested in this fixture ... ) 
        return -1;

    this.m_hit = true;
    this.m_point = point;
    this.m_normal = normal;
    return fraction;
};
Now make an instance of that to pass to the worlds RayCast function:

var rayStart = ...;
var rayEnd = ...;

var callback = new RaycastCallback();

world.RayCast(callback, rayStart, rayEnd);
if ( callback.m_hit ) {
    ... use callback.m_point etc ...
}

    */



    this.stopAccelerateWheels = function(){
        var i;
        var engine;
        for(i = 0; i<this.engines.length; i++){
            engine = this.engines[i];
            engine.SetMaxMotorTorque(0);
            engine.SetMotorSpeed(0);
        }
    }

    this.stopAccelerate = function(){
        this.stopAccelerateWheels();
    }
    this.lean = function(dir){

        var leanSpeed = 0.2;
        var velocity = leanSpeed*dir;
        this.frame.SetAngularVelocity(velocity*10);

    }

    this.DEG2RAD = 0.017453292519943296;
	this.RAD2DEG = 57.29577951308232;

}





  /*
  ROTATION EXAMPLE
  var i;
        var body;

        for(i = 0; i<toBeRotatedBodies.length; i++){
            body = toBeRotatedBodies[i];
            body.SetType(b2Body.b2_kinematicBody)
        }


        for(i = 0; i<toBeRotatedBodies.length; i++){
            body = toBeRotatedBodies[i];
            var o = body.GetPosition();


            var disX = (o.x-p.x);
            var disY = (o.y-p.y);

            var originalAngle = Math.atan2(disY, disX);

            var len = Math.sqrt(disX*disX+disY*disY);

            var tarAngle = originalAngle+angleChange;
            var tarX = p.x+len*Math.cos(tarAngle);
            var tarY = p.y+len*Math.sin(tarAngle)

            //console.log(angleChange+"  "+tarX+"   "+tarY);
            body.SetPosition(new b2Vec2(tarX, tarY));
            //body.SetPositionAndAngle(new b2Vec2(tarX, tarY), body.GetAngle()-angleChange);
        }

        for(i = 0; i<toBeRotatedBodies.length; i++){
            body = toBeRotatedBodies[i];
            body.SetType(b2Body.b2_dynamicBody);
        }

        */