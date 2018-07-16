import * as Box2D from "../libs/Box2D_NEW";
import {
    Key
} from "../libs/Key";
import {
    B2dEditor
} from "./b2Editor/B2dEditor";
import {
    getPIXIDebugDraw
} from "../libs/debugdraw";
import {
    Vehicle
} from "./Vehicle";
const firebase = require('firebase');
const PIXI = require('pixi.js');
import $ from 'jquery';
import {
    ui
} from "./UIManager";
import {
    firebaseManager
} from "./FireBaseManager";
import {
    LoadCoreAssets
} from "./AssetList";
import { Settings } from "./Settings";

const particles = require('pixi-particles');
const Stats = require('stats.js');

var b2Vec2 = Box2D.b2Vec2,
	b2AABB = Box2D.b2AABB,
	b2BodyDef = Box2D.b2BodyDef,
	b2Body = Box2D.b2Body,
	b2FixtureDef = Box2D.b2FixtureDef,
	b2Fixture = Box2D.b2Fixture,
	b2World = Box2D.b2World,
	b2MassData = Box2D.b2MassData,
	b2PolygonShape = Box2D.b2PolygonShape,
	b2CircleShape = Box2D.b2CircleShape,
	b2DebugDraw = Box2D.b2DebugDraw,
	b2MouseJointDef = Box2D.b2MouseJointDef;

function Game() {

    this.PTM = 30;
    this.timeStep = 1000 / 60;
    this.physicsTimeStep = 1 / 60;
    this.editor;
    this.app;
    this.stage;
    this.myContainer;
    this.newDebugGraphic;
    this.canvas;
    this.renderer;
    this.world;
    this.worldJSON;

    this.isMouseDown
    this.selectedBody
    this.mouseJoint;
    this.run = false;

    this.playerPrefabObject;
    this.character;
    this.vehicle;
    this.desiredVehicleSpeed = 0;
    this.desiredVehicleTorque = 0;

    this.cameraFocusObject;

    this.stats;

    this.emitters = [];
    this.emittersPool = {};

    this.init = function () {

        this.stats = new Stats();
        this.stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(this.stats.dom);

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
        LoadCoreAssets(PIXI.loader);

        this.editor = B2dEditor;
        this.editor.load(PIXI.loader);

        PIXI.loader.load(this.setup.bind(this));
    };

    this.setup = function () {
        console.log("load completed");

        this.world = new b2World(
            new b2Vec2(0, 10) //gravity
        );
        const bodyDef = new Box2D.b2BodyDef();
        this.m_groundBody = this.world.CreateBody(bodyDef);

        //container
        this.myContainer = new PIXI.Graphics();
        this.stage.addChild(this.myContainer);

        //Debug Draw
        this.newDebugGraphics = new PIXI.Graphics();
        this.myDebugDraw = getPIXIDebugDraw(this.newDebugGraphics, this.PTM);
        console.log(Box2D.b2DrawFlags.e_shapeBit, Box2D.b2DrawFlags.e_jointBit);
        this.myDebugDraw.SetFlags(Box2D.b2DrawFlags.e_shapeBit| Box2D.b2DrawFlags.e_jointBit);
        this.myContainer.addChild(this.newDebugGraphics);
        this.world.SetDebugDraw(this.myDebugDraw);

        //window.setInterval(this.update.bind(this), this.timeStep);
        startAnimating();

        this.editor.assetLists.characters = Object.keys(PIXI.loader.resources["Characters_1.json"].textures);
        this.editor.assetLists.vehicles = Object.keys(PIXI.loader.resources["Vehicles_1.json"].textures);
        this.editor.assetLists.movement = Object.keys(PIXI.loader.resources["Movement.json"].textures);
        this.editor.tileLists = ["", "tile1.jpg", "tile2.jpg", "tile3.jpg", "tile4.jpg", "tile5.jpg", "tile6.jpg", "tile7.jpg", "tile8.jpg", "tile9.jpg", "tile10.jpg", "tile11.jpg", "tile12.jpg", "tile13.jpg", "tile14.jpg", "tile15.jpg", "tile16.jpg", "tile16.jpg"]

        this.editor.init(this.myContainer, this.world, this.PTM);

        this.editor.contactCallBackListener = this.gameContactListener;

        this.initWorld();

        this.canvas.addEventListener("keydown", this.onKeyDown.bind(this), true);
        this.canvas.addEventListener("keyup", this.onKeyUp.bind(this), true);
        this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this), true);
        this.canvas.addEventListener("touchstart", this.onMouseDown.bind(this), true);
        this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this), true);
        this.canvas.addEventListener("touchend", this.onMouseUp.bind(this), true);
        this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this), true);
        this.canvas.addEventListener("touchmove", this.onMouseMove.bind(this), true);


        /*TODO
        1) Create proper pooler per available types
        */
        for(var i=0; i<Settings.emitterPool; i++) this.getEmitter('blood', null);
        for(var i=0; i<Settings.emitterPool; i++) this.emittersPool[this.emitters[i].type].push(this.emitters[i]);
    }
    this.initWorld = function () {
        console.log(PIXI.loader.resources);
        this.editor.buildJSON(PIXI.loader.resources.worldData.data);
        this.editor.buildJSON(PIXI.loader.resources.characterData1.data);
        this.editor.buildJSON(PIXI.loader.resources.testData.data);
        //this.editor.buildJSON(PIXI.loader.resources.testData2.data);
    }
    this.loadLevel = function (levelData) {
        console.log("Loading level..");
        console.log(levelData);
        console.log(firebaseManager.baseDownloadURL + levelData.dataURL);
        this.editor.resetEditor();
        var self = this;
        $('form').removeClass('loading');
        $.getJSON(firebaseManager.baseDownloadURL + levelData.dataURL, function (data) {
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
                md.bodyA = this.m_groundBody;
                md.bodyB = body;
                md.target = new Box2D.b2Vec2(this.editor.mousePosWorld.x, this.editor.mousePosWorld.y);
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
        this.world.QueryAABB(this.getBodyCB, aabb);
        return this.selectedBody;
    };
    
    this.getBodyCB = new function () {
        this.ReportFixture = function(fixture){
        if (fixture.GetBody().GetType() != b2Body.b2_staticBody) {
            if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), self.editor.mousePosWorld)) {
                self.selectedBody = fixture.GetBody();
                return false;
            }
        }
        return true;
        }
    };


    this.inputUpdate = function () {
        if (this.vehicle) {

            if (Key.isDown(Key.W)) {
                this.vehicle.accelerate(1);
            };
            if (Key.isDown(Key.S)) {
                this.vehicle.accelerate(-1);
            };
            if (!Key.isDown(Key.W) && !Key.isDown(Key.S)) {
                this.vehicle.stopAccelerate();
            };

            if (Key.isDown(Key.A)) {
                this.vehicle.lean(-1);
            }
            if (Key.isDown(Key.D)) {
                this.vehicle.lean(1);
            }
        }
    }

    this.onKeyDown = function (e) {
        if (e.keyCode == 82) { //r
            this.run = false;
            var worldJSON = JSON.parse(this.editor.worldJSON);
            if(e.shiftKey) this.editor.breakPrefabs = true;
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
        if (!this.run) this.editor.onKeyDown(e);
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

        this.findPlayableCharacter();

        this.character = this.editor.lookupGroups[this.playerPrefabObject.key].character;
        this.vehicle = new Vehicle();

        this.vehicle.init(this.playerPrefabObject);
        this.cameraFocusObject = this.character.body;
    }
    this.findPlayableCharacter = function(){
        for(var key in this.editor.prefabs){
            if(this.editor.prefabs.hasOwnProperty(key)){
                if(this.editor.prefabs[key].class.constructor.playableCharacter){
                    this.playerPrefabObject = this.editor.prefabs[key];
                    break;
                }
            }
        }
    }

    this.camera = function () {
        var panEase = 0.1;
        var zoomEase = 0.1;
        var targetZoom = 0.8;

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
    this.retreiveNextLevelList = function () {
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
    this.uploadLevelData = function (details) {
        console.log("upload details:");
        console.log(details);
        this.editor.stringifyWorldJSON();
        var filesToUpload = [];
        var levelData = this.editor.worldJSON;
        filesToUpload.push({
            file: levelData,
            dir: "levels",
            name: "levelData.json"
        });
        if (this.editor.cameraShotData.highRes != null) {
            filesToUpload.push({
                file: this.editor.cameraShotData.highRes,
                dir: "levels",
                name: "thumb_highRes.jpg",
                datatype: "data_url"
            })
            filesToUpload.push({
                file: this.editor.cameraShotData.highRes,
                dir: "levels",
                name: "thumb_lowRes.jpg",
                datatype: "data_url"
            })
        }
        details.levelID = firebaseManager.generateUUID();
        var self = this;
        var uploader = new firebaseManager.uploadFiles(filesToUpload, details.levelID,
            function (urls) {
                console.log("ui manager complete");
                console.log(urls);
                self.storeLevelData(urls, details);
            },
            function (progress) {
                console.log("ui manager progress");
                console.log(progress);
            },
            function (error) {
                console.log("ui manager error");
                console.log(error);
            }
        );
    }
    this.storeLevelData = function (urls, details) {
        var levelObject = {};
        levelObject["dataURL"] = urls[0];
        if (urls.length > 1) {
            levelObject["thumbHighResURL"] = urls[1];
            levelObject["thumbLowResURL"] = urls[2];
        }
        levelObject["creationDate"] = Date.now();
        levelObject["creator"] = firebaseManager.username; //username
        levelObject["creatorID"] = firebaseManager.app.auth().currentUser.uid; //userid
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
    var self = this;
    this.gameContactListener = new Box2D.b2ContactListener();
    this.gameContactListener.BeginContact = function (contact) {}
    this.gameContactListener.EndContact = function (contact) {}
    this.gameContactListener.PreSolve = function (contact, oldManifold) {}
    this.gameContactListener.PostSolve = function (contact, impulse) {

        var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
        var body;

        for (var i = 0; i < bodies.length; i++) {
            body = bodies[i];
            if (body.isFlesh && (bodies[0].mySprite.data.prefabID != bodies[1].mySprite.data.prefabID  || bodies[0].mySprite.data.prefabID == undefined)) {

                var force = 0;
                for(var j = 0; j<impulse.normalImpulses.length; j++) if(impulse.normalImpulses[i] > force) force = impulse.normalImpulses[i];

                var velocityA = contact.GetFixtureA().GetBody().GetLinearVelocity().Length();
                var velocityB = contact.GetFixtureB().GetBody().GetLinearVelocity().Length();
                var impactAngle = (velocityA > velocityB) ? Math.atan2(contact.GetFixtureA().GetBody().GetLinearVelocity().y,contact.GetFixtureA().GetBody().GetLinearVelocity().x) : Math.atan2(contact.GetFixtureB().GetBody().GetLinearVelocity().y,contact.GetFixtureB().GetBody().GetLinearVelocity().x);
                impactAngle *= game.editor.RAD2DEG + 180;
                var velocitySum = velocityA+velocityB;
                if(velocitySum > 10.0){
                    var worldManifold = new Box2D.b2WorldManifold();
                    contact.GetWorldManifold(worldManifold);
                    var worldCollisionPoint = worldManifold.points[0];
                    self.editor.addDecalToBody(body, worldCollisionPoint, "Decal10000", true);
                    self.playOnceEmitter("blood", body, worldCollisionPoint, impactAngle);
                }
            }
        }
    }
    this.playOnceEmitter = function (type, body, point, angle) {

        if(!body.emitterCount || body.emitterCount < Settings.emittersPerBody){
            let emitter = this.getEmitter(type, body);
            emitter.spawnPos = new PIXI.Point(point.x * game.editor.PTM, point.y * game.editor.PTM);
            emitter.body = body;
            if(!body.emitterCount) body.emitterCount = 0;
            body.emitterCount++;
            var self = this;
            function returnToPool() {
                emitter.body.emitterCount--;
                emitter.body = null;
                emitter.lastUsed = Date.now();
                emitter._completeCallback = null;
                self.emittersPool[emitter.type].push(emitter);

            }
            var angleOffset = (emitter.maxStartRotation-emitter.minStartRotation)/2;
            emitter.minStartRotation = angle-angleOffset;
            emitter.maxStartRotation = angle+angleOffset;
            emitter.playOnce(returnToPool);
        }
    }
    this.getEmitter = function (type, body) {
        if (!this.emittersPool[type]) this.emittersPool[type] = [];
        if (this.emittersPool[type].length > 0) return this.emittersPool[type].shift();

        var emitter;
        switch (type) {
            case "blood":
                emitter = new PIXI.particles.Emitter(
                    this.myContainer, [PIXI.Texture.fromImage('particle.png'), PIXI.Texture.fromImage('particle-grey.png')],
                    PIXI.loader.resources[type + '-particles-data'].data
                );
                break;
        }
        emitter.type = type;
        this.emitters.push(emitter);
        return emitter;
    }
    this.updateEmitters = function () {
        for (var i = 0; i < this.emitters.length; i++) {
            var emitter = this.emitters[i];
            if(!emitter.body && this.emittersPool[emitter.type]>Settings.emitterPool){
                if(Date.now() - emitter.lastUsed > Settings.emitterMaxPoolTime){
                    for(var j = 0; j<this.emittersPool[emitter.type].length; j++) if(this.emittersPool[emitter.type][j] == emitter) this.emittersPool[emitter.type].splice(j, 1);
                    emitter.destroy();
                    this.emitters.splice(i, 1);
                    i--;
                }
            }else emitter.update(this.timeStep * 0.001);
        }
    }






    var then, startTime, elapsed, now;
    var self = this;

    function startAnimating() {
        then = window.performance.now();
        animate();
    }
    function animate(newtime) {
        requestAnimationFrame(animate);
        now = newtime;
        elapsed = now - then;
        if (elapsed > self.timeStep) {
            then = now - (elapsed % self.timeStep);
            self.update();
        }
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
            this.stats.begin();
            this.world.Step(this.physicsTimeStep, 3, 2);
            this.stats.end();
            this.world.ClearForces();
            this.camera();
            this.updateEmitters();
        }

        this.editor.run();
        this.newDebugGraphics.clear();
        this.world.DrawDebugData();
        this.app.render();
        Key.update();

        

    };
}


export var game = new Game();
window.addEventListener("load", function () {
    game.init();
}.bind(this));