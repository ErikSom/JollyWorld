function Vehicle(){
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
          console.log("PEEEENIS");
        this.m_hit = true;
        this.m_point = point;
        this.m_normal = normal;
        this.m_fixture = fixture;
        return fraction;
    };


    this.accelerate = function(dir){
        //this.accelerateWheels(dir);

        var i;
        var wheel;
        var offset = 0.01;

        for(i = 0; i<this.wheels.length; i++){
            wheel = this.wheels[i];

            var rayStart = wheel.GetBody().GetPosition();
            var rayEnd = rayStart.Copy();
            rayEnd.Add(new b2Vec2(0, 5));

            var callback = new this.RaycastCallbackWheel();
            console.log(callback);
            wheel.GetBody().GetWorld().RayCast(callback, rayStart, rayEnd);
            if ( callback.m_hit ) {
                console.log("HOLY SHIT IM HITTING STUFF");
                console.log(callback.m_fixture.GetBody().myGraphic.data);
            }

        }


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

        var leanSpeed = 5.0;
        var velocity = leanSpeed*dir;
        this.frame.SetAngularVelocity(velocity*10);

    }

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