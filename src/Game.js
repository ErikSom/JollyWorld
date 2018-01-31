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

var game = new Game();


function Game() {

    this.PTM = 30;
    this.timeStep = 1000 / 60;
    this.physicsTimeStep = 1 / 60;
    this.editor;
    this.app;
    this.stage;
    this.newDebugGraphic;
    this.canvas;
    this.renderer;
    this.world;
    this.worldJSON;

    this.isMouseDown
    this.selectedBody
    this.mouseJoint;
    this.run = false;


    this.character;
    this.vehicle;
    this.desiredVehicleSpeed = 0;
    this.desiredVehicleTorque = 0;

    this.cameraFocusObject;


    this.init = function () {

        this.canvas = document.getElementById("canvas");

        var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        this.canvas.width = w; //document.width is obsolete
        this.canvas.height = h; //document.height is obsolete

        this.app = new PIXI.Application({
            view: this.canvas,
            backgroundColor: 0xD4D4D4,
            width: w,
            height: h
        });
        this.stage = this.app.stage;

        console.log(this.app);

        PIXI.loader
            .add("assets/images/bodyparts.json")
            .add("assets/images/vehicles.json")
            .add("assets/images/Characters1.json")
            .add("worldData", "data/worldData.json")
            .add("vehicleData", "data/vehicle.json")
            .add("characterData", "data/character.json")
            .add("characterData1", "data/character1.json");

        this.editor = new B2dEditor();
        this.editor.load(PIXI.loader);

        PIXI.loader.load(this.setup.bind(this));
    };

    this.setup = function () {
        console.log("load completed");
        this.world = new b2World(
            new b2Vec2(0, 10) //gravity
            , true //allow sleep
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


        this.editor.assetLists.characters = ["1head.png", "1body.png", "1uparm.png", "1lowarm.png", "1upleg.png", "1lowleg.png",
            "2head.png", "2body.png", "2uparm.png", "2lowarm.png", "2upleg.png", "2lowleg.png",
            "3head.png", "3body.png", "3uparm.png", "3lowarm.png", "3upleg.png", "3lowleg.png"
        ];
        this.editor.assetLists.maincharacters = ["Skin1_Head_Idle0000","Skin1_Head_Smile0000","Skin1_Head_Laugh0000","Skin1_Head_hurt10000","Skin1_Head_hurt20000","Skin1_Head_hurt30000","Skin1_Head_hurt40000","Skin1_Head_RnM0000","Skin1_Head_Oh0000", "Skin1_Head_Boring0000", "Skin1_Core0000", "Skin1_Thigh0000", "Skin1_Leg0000", "Skin1_Feet0000", "Skin1_Shoulder0000", "Skin1_Arm0000", "Skin1_Hand0000", "Skin1_Eye0000", "Skin1_Eye_Closed0000"];
        this.editor.assetLists.vehicles = ["Bike1_Childseet.png", "Bike1_Frame.png", "Bike1_Tire.png"];
        this.editor.init(myContainer, this.world, this.PTM);


        this.initWorld();

        this.canvas.addEventListener("keydown", this.onKeyDown.bind(this), true);
        this.canvas.addEventListener("keyup", this.onKeyUp.bind(this), true);
        this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this), true);
        this.canvas.addEventListener("touchstart", this.onMouseDown.bind(this), true);
        this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this), true);
        this.canvas.addEventListener("touchend", this.onMouseUp.bind(this), true);
        this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this), true);
        this.canvas.addEventListener("touchmove", this.onMouseMove.bind(this), true);

    }

    this.initWorld = function () {
        //this.editor.buildJSON(PIXI.loader.resources.worldData.data);
        this.editor.buildJSON(PIXI.loader.resources.vehicleData.data);
        this.editor.buildJSON(PIXI.loader.resources.characterData1.data);
    }
    this.loadLevel = function(levelData){
        console.log("Loading level..");
        this.editor.resetEditor();
        var self = this;
        $('form').removeClass('loading');
        $.getJSON(firebaseManager.baseDownloadURL+levelData.dataURL, function(data) {
            self.editor.buildJSON(data);
            self.initWorld();
            ui.showNothing();
            $('.sidebar').sidebar("hide");
            console.log("Loading level success!!!");
        });
    }


    //mouse
    this.onMouseDown = function (e) {
        this.isMouseDown = true;
        if (!this.mouseJoint && this.run) {
            var body = this.getBodyAtMouse();
            if (body) {
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



    this.onMouseUp = function (e) {
        this.isMouseDown = false;
        this.editor.onMouseUp(e);

    };

    this.onMouseMove = function (e) {
        this.editor.onMouseMove(e);
    };

    this.getBodyAtMouse = function () {
        var aabb = new b2AABB();
        aabb.lowerBound.Set(this.editor.mousePosWorld.x - 0.001, this.editor.mousePosWorld.y - 0.001);
        aabb.upperBound.Set(this.editor.mousePosWorld.x + 0.001, this.editor.mousePosWorld.y + 0.001);
        // Query the world for overlapping shapes.

        this.selectedBody = null;
        this.world.QueryAABB(this.getBodyCB.bind(this), aabb);
        return this.selectedBody;
    };

    this.getBodyCB = function (fixture) {
        if (fixture.GetBody().GetType() != b2Body.b2_staticBody) {
            if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), this.editor.mousePosWorld)) {
                this.selectedBody = fixture.GetBody();
                return false;
            }
        }
        return true;
    };


    this.inputUpdate = function () {
        if (this.vehicle) {

            if(Key.isDown(Key.W)){
                this.vehicle.accelerate(1);
            };
            if(Key.isDown(Key.S)){
                this.vehicle.accelerate(-1);
            };
            if(!Key.isDown(Key.W) && !Key.isDown(Key.S)){
                this.vehicle.stopAccelerate();
            };

            if(Key.isDown(Key.A)){
                this.vehicle.lean(-1);
            }
            if(Key.isDown(Key.D)){
                this.vehicle.lean(1);
            }
        }
    }

    this.onKeyDown = function (e) {
        if (e.keyCode == 82) { //r
            this.run = false;
            var worldJSON = JSON.parse(this.editor.worldJSON);
            this.editor.resetEditor();
            //this.initWorld();
            this.editor.buildJSON(worldJSON);

        } else if (e.keyCode == 80) { //p
            if (this.editor.editing) {
                this.startGame();
            }

            this.run = !this.run;
        }
        Key.onKeydown(e);
        this.editor.onKeyDown(e);
    }
    this.onKeyUp = function (e) {
        this.editor.onKeyUp(e);

        if (e.keyCode == 87 || e.keyCode == 83) {
            this.vehicle.stopAccelerate();
        }
        Key.onKeyup(e);
    }

    this.startGame = function () {
        this.editor.stringifyWorldJSON();
        this.editor.runWorld();

        this.character = this.editor.objectLookup.__character;
        this.vehicle = new Vehicle();

        this.vehicle.init(this.editor.objectLookup.__vehicle, this.character);
        this.cameraFocusObject = this.character.body;
    }

    this.camera = function () {
        var panEase = 0.1;
        var zoomEase = 0.1;
        var targetZoom = 0.3;

        var currentZoom = this.editor.container.scale.x;

        var cameraTargetPosition = this.editor.getPIXIPointFromWorldPoint(this.cameraFocusObject.GetPosition());
        this.editor.setZoom(cameraTargetPosition, currentZoom + (targetZoom - currentZoom) * zoomEase);

        cameraTargetPosition.x -= this.canvas.width / 2.0 / this.editor.container.scale.x;
        cameraTargetPosition.y -= this.canvas.height / 2.0 / this.editor.container.scale.y;
        cameraTargetPosition.x *= this.editor.container.scale.x;
        cameraTargetPosition.y *= this.editor.container.scale.y;


        this.editor.container.x += (-cameraTargetPosition.x - this.editor.container.x) * panEase;
        this.editor.container.y += (-cameraTargetPosition.y - this.editor.container.y) * panEase;

       // this.editor.container.x = -cameraTargetPosition.x;
        //this.editor.container.y = -cameraTargetPosition.y;

       // this.editor.container.position.x = 0;
        //this.editor.container.position.y = 0;

        //console.log(this.editor.container.position);
    }
    this.levelsSnapshot;
    this.levelsLimitTo = 25;
    this.retreiveNextLevelList = function(){
        var levelRef = firebase.database().ref('/Levels/');
        //if(this.levelsSnapshot == undefined){
            levelRef.orderByChild("creationDate").limitToFirst(this.levelsLimitTo);
        //}
        levelRef.once('value').then(function (levelListSnapshot) {
            console.log("Levels Loaded!!");
            console.log(levelListSnapshot.val());
            ui.displayLevels(levelListSnapshot.val());
        }, function (error) {
            console.log("ERROR!!");
            console.log(error.message);
        });
    }
    this.uploadLevelData = function(details){
        console.log("upload details:");
        console.log(details);
        this.editor.stringifyWorldJSON();
        var filesToUpload = [];
        var levelData = this.editor.worldJSON;
        filesToUpload.push({file:levelData, dir:"levels", name:"levelData.json"});
        if(this.editor.cameraShotData.highRes != null){
            filesToUpload.push({file:this.editor.cameraShotData.highRes, dir:"levels", name:"thumb_highRes.jpg", datatype:"data_url"})
            filesToUpload.push({file:this.editor.cameraShotData.highRes, dir:"levels", name:"thumb_lowRes.jpg", datatype:"data_url"})
        }
        details.levelID = firebaseManager.generateUUID();
        var self = this;
        var uploader = new firebaseManager.uploadFiles(filesToUpload, details.levelID,
        function(urls){
            console.log("ui manager complete");
            console.log(urls);
            self.storeLevelData(urls, details);
        },
        function(progress){
            console.log("ui manager progress");
            console.log(progress);
        },
        function(error){
            console.log("ui manager error");
            console.log(error);
        }
        );
    }
    this.storeLevelData = function(urls, details){
        var levelObject = {};
        levelObject["dataURL"] = urls[0];
        if(urls.length>1){
            levelObject["thumbHighResURL"] = urls[1];
            levelObject["thumbLowResURL"] = urls[2];
        }
        levelObject["creationDate"] = Date.now();
        levelObject["creator"] = firebaseManager.username;//username
        levelObject["creatorID"] = firebaseManager.app.auth().currentUser.uid;//userid
        levelObject["description"] = details.description;
        levelObject["name"] = details.name;
        levelObject["numVotes"] = 0;
        levelObject["playCount"] = 0;
        levelObject["sumVotes"] = 0;
        levelObject["voters"] = {};

        var levelRef = firebase.database().ref('/Levels/' + details.levelID);
        levelRef.set(levelObject);
        levelRef.once('value').then(function (snapshot) {
            console.log("Level upload big succes!");
            console.log(snapshot.val());
            ui.levelPublishSuccess();
        }, function (error) {
            console.log("ERROR!!");
            console.log(error.message);
        });

    }


    this.update = function () {
        if (this.mouseJoint) {
            if (this.isMouseDown) {
                this.mouseJoint.SetTarget(new b2Vec2(this.editor.mousePosWorld.x, this.editor.mousePosWorld.y));
            } else {
                this.world.DestroyJoint(this.mouseJoint);
                this.mouseJoint = null;
            }
        }
        if (this.run) {
            this.inputUpdate();
            this.world.Step(this.physicsTimeStep, 3, 2);
            this.world.ClearForces();
            this.camera();
        }

        this.editor.run();
        this.newDebugGraphics.clear();
        this.world.DrawDebugData();
        this.app.render();
        Key.update();

    };
}


var game = new Game();
window.addEventListener("load", function() { console.log("1 toto");game.init();}.bind(this));