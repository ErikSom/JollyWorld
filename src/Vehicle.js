function Vehicle(){
    this.engine1;
    this.engine2;
    this.frame;
    this.vehicleBodies;
    this.characterBodies;
    this.balanceBody;

    this.desiredVehicleSpeed;
    this.desiredVehicleTorque;

    this.init = function(_vehicleBodies, _characterBodies){
        this.vehicleBodies = _vehicleBodies;
        if(this.vehicleBodies){
           this.engine1 = this.vehicleBodies.engine1;
           this.engine2 = this.vehicleBodies.engine2;
           this.frame = this.vehicleBodies.frame;
           this.frame.SetAngularDamping(0.8);
           this.desiredVehicleTorque = this.engine1.GetMotorTorque();
           this.desiredVehicleSpeed = this.engine1.GetMotorSpeed();
           this.stopAccelerateWheels();
           this.buildBalanceWeight();
        }
        this.characterBodies = _characterBodies;

    }
    this.accelerate = function(dir){
        this.accelerateWheels(dir);
    }

    this.accelerateWheels = function(dir){
        this.engine1.SetMaxMotorTorque(this.desiredVehicleTorque);
        this.engine1.SetMotorSpeed(dir*this.desiredVehicleSpeed);
        this.engine2.SetMaxMotorTorque(this.desiredVehicleTorque);
        this.engine2.SetMotorSpeed(dir*this.desiredVehicleSpeed);
    }
    this.stopAccelerateWheels = function(){
        this.engine1.SetMaxMotorTorque(0);
        this.engine1.SetMotorSpeed(0);
        this.engine2.SetMaxMotorTorque(0);
        this.engine2.SetMotorSpeed(0);
    }

    this.stopAccelerate = function(){
        this.stopAccelerateWheels();
    }
    this.lean = function(dir){


        var leanSpeed = 5.0;
        var velocity = leanSpeed*dir;

        var chasis = this.engine1.GetBodyB();

        var toBeRotatedBodies = this.vehicleBodies._bodies.concat(this.characterBodies._bodies);
        toBeRotatedBodies.push(this.balanceBody);
        var p = chasis.GetPosition();
        var angleChange = velocity * game.editor.DEG2RAD;
        var q = (chasis.GetAngle()+ angleChange);

        var disX = (this.balanceBody.GetPosition().x-p.x);
        var disY = (this.balanceBody.GetPosition().y-p.y);

        var originalAngle = Math.atan2(disY, disX);

        var len = Math.sqrt(disX*disX+disY*disY);
        var tarAngle = originalAngle+angleChange;
        var tarX = p.x+len*Math.cos(tarAngle);
        var tarY = p.y+len*Math.sin(tarAngle)


        //console.log(angleChange+"  "+tarX+"   "+tarY);

        var historyArray = [];
        var i;
        var body;
        for(i = 0; i<this.vehicleBodies.length; i++){
            historyArray.push({body:this.vehicleBodies[i], velocity:this.vehicleBodies[i].GetLinearVelocity()})
        }


        this.balanceBody.SetType(b2Body.b2_kinematicBody);
        this.balanceBody.SetPosition(new b2Vec2(tarX, tarY));
        this.balanceBody.SetType(b2Body.b2_dynamicBody);
        this.frame.SetAngularVelocity(velocity*10);

        for(i = 0; i<historyArray.length; i++){
            body = historyArray[i].body;
            body.SetLinearVelocity(historyArray[i].velocity);
        }

        this.balanceBody.SetLinearVelocity(chasis.GetLinearVelocity().Multiply(0.3));



       /* var i;
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


    }

    this.buildBalanceWeight = function(){
        var wheel1 = this.engine1.GetBodyA();
        var wheel2 = this.engine2.GetBodyA();

        var distanceWheels = wheel1.GetPosition().Copy();
        distanceWheels.Subtract(wheel2.GetPosition());

        var distanceWheelsLength = distanceWheels.Length();
        var centerWheels = new b2Vec2(wheel1.GetPosition().x-distanceWheels.x/2.0, wheel1.GetPosition().y-distanceWheels.y/2.0);

        console.log(centerWheels);

        var chasis = this.engine1.GetBodyB();

        var world = wheel1.GetWorld();

        var radius = distanceWheelsLength/2;

        var bd = new b2BodyDef();
        bd.type = b2Body.b2_dynamicBody;
        var body = world.CreateBody(bd);

        var fixDef = new b2FixtureDef;
		fixDef.density = 0.01;
		fixDef.friction = 2000;
        fixDef.restitution = 0.001;
        fixDef.shape = new b2CircleShape;
        fixDef.shape.SetRadius(radius);
        var localPointBelowWheels = chasis.GetLocalPoint(new b2Vec2(centerWheels.x, centerWheels.y/*+radius*2*/));

        //fixDef.shape.SetLocalPosition(localPointBelowWheels);

        var fixture = body.CreateFixture(fixDef);
        body.SetPositionAndAngle(new b2Vec2(centerWheels.x, centerWheels.y+radius*3));
        fixture.SetSensor(true);
        var ad = 0;
        wheel1.SetAngularDamping(ad);
        wheel2.SetAngularDamping(ad);
        body.SetAngularDamping(ad);

        this.balanceBody = body;

        //fixture.dontDraw = true;


        var revoluteJointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef;
        revoluteJointDef.Initialize(body, chasis, chasis.GetPosition());
        revoluteJointDef.collideConnected = false;
        revoluteJointDef.referenceAngle = 0.0;
        revoluteJointDef.lowerAngle = 0;
        revoluteJointDef.upperAngle = 0;
        revoluteJointDef.enableLimit = true;
        revoluteJointDef.enableMotor = false;


        var joint = world.CreateJoint(revoluteJointDef);


        console.log("FIXTURE");
        console.log(fixture);



    }

}