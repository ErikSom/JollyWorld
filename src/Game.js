import * as Box2D from "../libs/Box2D";
import {
    Key
} from "../libs/Key";
import {
    B2dEditor
} from "./b2Editor/B2dEditor";
import {
    getPIXIDebugDraw
} from "../libs/debugdraw";
const PIXI = require('pixi.js');
import $ from 'jquery';
import {
    ui
} from "./ui/UIManager";
import {
    firebaseManager
} from "./utils/FireBaseManager";
import {
    LoadCoreAssets
} from "./AssetList";
import {
    Settings
} from "./Settings";
import {
    levelsData
} from "./data/levelsData";
import * as emitterManager from './utils/EmitterManager';

const moment = require('moment');

import * as SaveManager from "./utils/SaveManager";
import * as PIXICuller from "./utils/PIXICuller";

const nanoid = require('nanoid');
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

    this.editor;
    this.app;
    this.stage;
    this.myContainer;
    this.newDebugGraphic;
    this.canvas;
    this.renderer;
    this.world;
    this.worldJSON;

    this.selectedBody;
    this.mouseJoint;
    this.run = false;
    this.pause = false;
    this.gameState = false;

    this.playerPrefabObject;
    this.character;
    this.vehicle;
    this.desiredVehicleSpeed = 0;
    this.desiredVehicleTorque = 0;

    this.cameraFocusObject;

    this.stats;

    this.currentLevelData;

    this.levelStartTime = 0;
    this.levelWon = false;
    this.gameOver = false;

    this.init = function () {

        this.stats = new Stats();
        this.stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(this.stats.dom);
        this.stats.dom.style.left = 'unset';
        this.stats.dom.style.right = '80px';

        this.canvas = document.getElementById("canvas");

        var w = $(window).width();
        var h = $(window).height();

        this.canvas.width = w;
        this.canvas.height = h;

        PIXICuller.renderArea.width = w;
        PIXICuller.renderArea.height = h;

        this.app = new PIXI.Application({
            view: this.canvas,
            backgroundColor: 0xD4D4D4,
            width: w,
            height: h
        });
        this.app.stop(); // do custom render step
        this.stage = this.app.stage;

        LoadCoreAssets(PIXI.loader);

        this.editor = B2dEditor;
        this.editor.load(PIXI.loader);

        PIXI.loader.load(this.setup.bind(this));

        this.prepareGameFonts();

        this.gameState = this.GAMESTATE_MENU;

    };

    this.setup = function () {

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
        this.myDebugDraw = getPIXIDebugDraw(this.newDebugGraphics, Settings.PTM);
        this.myDebugDraw.SetFlags(Box2D.b2DrawFlags.e_shapeBit | Box2D.b2DrawFlags.e_jointBit);
        this.myContainer.addChild(this.newDebugGraphics);
        this.world.SetDebugDraw(this.myDebugDraw);

        this.render();

        this.editor.assetLists.characters = Object.keys(PIXI.loader.resources["Characters_1.json"].textures);
        this.editor.assetLists.vehicles = Object.keys(PIXI.loader.resources["Vehicles_1.json"].textures);
        this.editor.assetLists.movement = Object.keys(PIXI.loader.resources["Movement.json"].textures);
        this.editor.assetLists.construction = Object.keys(PIXI.loader.resources["Construction.json"].textures);
        this.editor.assetLists.nature = Object.keys(PIXI.loader.resources["Nature.json"].textures);
        this.editor.assetLists.weapons = Object.keys(PIXI.loader.resources["Weapons.json"].textures);
        this.editor.assetLists.level = Object.keys(PIXI.loader.resources["Level.json"].textures);
        this.editor.assetLists.gore = Object.keys(PIXI.loader.resources["Characters_Gore.json"].textures);

        this.editor.tileLists = ["", "Dirt.jpg", "Grass.jpg", "Fence.png", "YellowCat.jpg", "RedWhiteBlock.jpg", "PixelatedWater.jpg", "PixelatedStone.jpg", "PixelatedDirt.jpg", "PixelatedGrass.jpg", "GoldenBlock.jpg", "Brick0.jpg", "Brick1.jpg", "Brick2.jpg", "WhiteBlock.jpg"];
        this.editor.init(this.myContainer, this.world, Settings.PTM);

        this.editor.contactCallBackListener = this.gameContactListener;

        this.openMainMenu();

        document.body.addEventListener("keydown", this.onKeyDown.bind(this), true);
        document.body.addEventListener("keyup", this.onKeyUp.bind(this), true);
        this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this), true);
        this.canvas.addEventListener("touchstart", this.onMouseDown.bind(this), true);
        this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this), true);
        this.canvas.addEventListener("touchend", this.onMouseUp.bind(this), true);
        this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this), true);
        this.canvas.addEventListener("touchmove", this.onMouseMove.bind(this), true);

        window.addEventListener('resize', this.handleResize.bind(this));

        emitterManager.init();


        PIXICuller.init(this.editor.textures);
    }


    //mouse
    this.onMouseDown = function (e) {
        if (Settings.allowMouseMovement && !this.mouseJoint && this.run) {
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
        Key.onMouseDown();
        this.onMouseMove(e);
        this.editor.onMouseDown(e);
    };



    this.onMouseUp = function (e) {
        Key.onMouseUp();
        this.editor.onMouseUp(e);
    };

    this.onMouseMove = function (e) {
        this.editor.onMouseMove(e);
    };

    this.handleResize = function (e) {
        const w = $(window).width();
        const h = $(window).height();

        this.canvas.width = w;
        this.canvas.height = h;
        this.app.renderer.resize(w, h);

        PIXICuller.renderArea.width = w;
        PIXICuller.renderArea.height = h;

        //        this.editor.resize();
    }

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
        this.ReportFixture = function (fixture) {
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
        if (this.gameState != this.GAMESTATE_MENU && this.character.alive) {
            if (this.vehicle && this.character.attachedToVehicle) {

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
                if (Key.isPressed(Key.Z)) {
                    this.character.detachFromVehicle(Settings.detachForce);
                };
            } else if (this.character && !this.character.attachedToVehicle) {
                if (Key.isDown(Key.W)) {
                    this.character.positionBody('up');
                    if (Key.isDown(Key.A)) this.character.lean(-1);
                    else if (Key.isDown(Key.D)) this.character.lean(1);
                } else if (Key.isDown(Key.S)) {
                    this.character.positionBody('down');
                    if (Key.isDown(Key.A)) this.character.lean(-1);
                    else if (Key.isDown(Key.D)) this.character.lean(1);
                } else if (Key.isPressed(Key.A)) {
                    this.character.positionBody('set-random');
                } else if (Key.isDown(Key.A)) {
                    this.character.positionBody('random');
                } else if (Key.isDown(Key.D)) {
                    this.character.positionBody('right');
                }
            }
        }
        if(this.gameState == this.GAMESTATE_NORMALPLAY){
            if(Key.isPressed(Key.P) && this.run){
                if(!this.pause) this.pauseGame();
            }
        }
    }

    this.onKeyDown = function (e) {
        if(document.activeElement != document.body && document.activeElement != this.canvas) return;
        if (e.keyCode == 84) { //t
            if (this.gameState == this.GAMESTATE_EDITOR) {
                if (this.run) {
                    if (e.shiftKey) this.editor.breakPrefabs = true; //TODO: REMOVE
                    this.stopTestingWorld(e);
                } else {
                    this.testWorld();
                }
            }
        }

        if (e.keyCode == 32) { //space
            if (this.gameOver && this.run) {
                this.resetWorld();
            }
        }
        Key.onKeydown(e);
        if (this.editor.editing && !this.run) this.editor.onKeyDown(e);
    }
    this.onKeyUp = function (e) {
        if(document.activeElement != document.body  && document.activeElement != this.canvas) return;
        this.editor.onKeyUp(e);

        if (e.keyCode == 87 || e.keyCode == 83 && this.run) {
            this.vehicle.stopAccelerate();
        }
        Key.onKeyUp(e);
    }
    this.openMainMenu = function () {
        //if(this.run) this.stopWorld();
        this.initLevel(levelsData.mainMenuLevel);
        ui.buildMainMenu();
        ui.hideGameOverMenu();
        this.runWorld();
        this.interactive = false;

    }
    this.runWorld = function () {
        this.editor.runWorld();
        this.run = true;
        this.findPlayableCharacter();

    }
    this.playWorld = function () {
        this.runWorld();
        this.gameState = this.GAMESTATE_NORMALPLAY;
    }

    this.testWorld = function () {
        this.editor.stringifyWorldJSON();
        this.editor.testWorld();
        this.run = true;
        this.findPlayableCharacter();
        this.stopAutoSave();
        this.levelStartTime = Date.now();
    }
    this.stopTestingWorld = function () {
        this.stopWorld();
        var worldJSON = JSON.parse(this.editor.worldJSON);
        this.editor.buildJSON(worldJSON);
        this.doAutoSave();
    }
    this.resetWorld = function () {
        this.resetGame();
        if (this.gameState == this.GAMESTATE_EDITOR) {
            this.stopTestingWorld();
            this.testWorld();
        }else if(this.gameState == this.GAMESTATE_NORMALPLAY){
            this.initLevel(this.currentLevelData);
            this.playWorld();
        }
    }
    this.stopWorld = function () {
        this.editor.resetEditor();
        emitterManager.reset();
        this.run = false;
        this.resetGame();
        ui.hideGameOverMenu();
    }
    this.openEditor = function () {
        this.gameState = this.GAMESTATE_EDITOR;
        this.stopWorld();
        this.initLevel(SaveManager.getTempEditorWorld());
        this.doAutoSave();
        ui.hide();
    }
    this.initLevel = function (data) {
        this.stopWorld();
        this.currentLevelData = data;
        this.editor.ui.setLevelSpecifics();
        this.editor.buildJSON(data.json);
    }
    this.pauseGame = function(){
        this.pause = true;
        this.run = false;
        ui.showPauseMenu();
    }
    this.unpauseGame = function(){
        this.pause = false;
        this.run = true;
        ui.hidePauseMenu();
    }
    this.resetGame = function(){
        this.levelWon = false;
        this.gameOver = false;
    }
    // playWorld/testWorld/editoWorld
    this.autoSaveTimeOutID;
    this.doAutoSave = function () {
        let self = this;
        this.stopAutoSave();
        this.autoSaveTimeOutID = setTimeout(() => {
            self.currentLevelData.json = this.editor.stringifyWorldJSON();
            SaveManager.saveTempEditorWorld(self.currentLevelData);
            self.doAutoSave();
        }, Settings.autoSaveInterval);
    }
    this.stopAutoSave = function () {
        clearTimeout(this.autoSaveTimeOutID);
        this.autoSaveTimeOutID = undefined;
    }
    this.newLevel = function () {
        let data = {
            json: '{"objects":[[4, 0, 0, 0, {"playableCharacter":false, "selectedVehicle":"Bike"}, "Bike", 0]]}',
            title: '',
            description: '',
            background: '#FFFFFF',
            crossPromos: [],
            creationDate: Date.now(),
            uid: nanoid(),
        }
        this.initLevel(data);
        SaveManager.saveTempEditorWorld(this.currentLevelData);
    }
    this.saveNewLevelData = function () {
        game.currentLevelData.uid = nanoid();
        game.currentLevelData.creationDate = Date.now();
        return this.saveLevelData();
    }
    this.saveLevelData = function () {
        return new Promise((resolve, reject) => {
            firebaseManager.uploadUserLevelData(game.currentLevelData, game.editor.stringifyWorldJSON(), game.editor.cameraShotData).then((levelData) => {
                this.currentLevelData = levelData;
                game.currentLevelData.saved = true;
                game.editor.cameraShotData.highRes = null;
                game.editor.cameraShotData.lowRes = null;
                SaveManager.saveTempEditorWorld(self.currentLevelData);
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }
    this.publishLevelData = function () {
        return new Promise((resolve, reject) => {
            firebaseManager.publishLevelData(game.currentLevelData).then((levelData) => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }
    this.deleteLevelData = function () {
        return firebaseManager.deleteUserLevelData(game.currentLevelData);
    }
    this.levelHasChanges = function () {
        if (game.currentLevelData.json != game.editor.stringifyWorldJSON()) return true;
        return false;
    }
    this.win = function () {
        if (!this.levelWon) {
            this.levelWon = true;
            var ms = moment(Date.now()).diff(moment(this.levelStartTime));
            var d = moment.duration(ms);
            var s = Math.floor(d.asMinutes()) + moment.utc(ms).format(":ss:SSS");

            alert(`You Won! Time:${s}!`)
        }
    }
    this.lose = function () {
        if (!this.gameOver) {
            ui.showGameOver();
            this.gameOver = true;
        }
    }
    this.loadUserLevelData = function (levelData) {
        return new Promise((resolve, reject) => {
            game.currentLevelData = levelData;
            game.currentLevelData.uid = levelData.uid;
            var self = this;
            $.getJSON(firebaseManager.baseDownloadURL + levelData.dataURL, function (data) {
                self.currentLevelData.json = JSON.stringify(data);
                self.currentLevelData.saved = true;
                self.initLevel(self.currentLevelData);
                SaveManager.saveTempEditorWorld(self.currentLevelData);
                return resolve();
            }).fail(function (jqXHR, textStatus, errorThrown) {
                return reject({
                    message: textStatus
                });
            });
        });
    }
    this.loadPublishedLevelData = function (levelData) {
        return new Promise((resolve, reject) => {
            game.currentLevelData = levelData.private;
            game.currentLevelData.uid = levelData.uid;
            var self = this;
            $.getJSON(firebaseManager.baseDownloadURL + game.currentLevelData.dataURL, function (data) {
                self.currentLevelData.json = JSON.stringify(data);
                self.initLevel(self.currentLevelData);
                firebaseManager.increasePlayCountPublishedLevel(levelData);
                return resolve();
            }).fail(function (jqXHR, textStatus, errorThrown) {
                console.log('fail', errorThrown);
                return reject({
                    message: textStatus
                });
            });
        });
    }

    this.findPlayableCharacter = function () {
        for (var key in this.editor.activePrefabs) {
            if (this.editor.activePrefabs.hasOwnProperty(key)) {
                if (this.editor.activePrefabs[key].class.constructor.playableCharacter) {
                    this.playerPrefabObject = this.editor.activePrefabs[key];

                    this.character = this.editor.activePrefabs[this.playerPrefabObject.class.lookupObject.character.body.mySprite.data.subPrefabInstanceName].class;
                    this.vehicle = this.editor.activePrefabs[this.playerPrefabObject.class.prefabObject.key].class;
                    this.cameraFocusObject = this.character.lookupObject.body;

                    var bodies = this.editor.lookupGroups[this.playerPrefabObject.key]._bodies;
                    bodies.map(body => {
                        body.mainCharacter = true;
                    });
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
        this.editor.camera.setZoom(cameraTargetPosition, currentZoom + (targetZoom - currentZoom) * zoomEase);

        cameraTargetPosition.x -= this.canvas.width / 2.0 / this.editor.container.scale.x;
        cameraTargetPosition.y -= this.canvas.height / 2.0 / this.editor.container.scale.y;
        cameraTargetPosition.x *= this.editor.container.scale.x;
        cameraTargetPosition.y *= this.editor.container.scale.y;


        this.editor.container.x += (-cameraTargetPosition.x - this.editor.container.x) * panEase;
        this.editor.container.y += (-cameraTargetPosition.y - this.editor.container.y) * panEase;

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
            if (body.isFlesh && (bodies[0].mySprite.data.prefabID != bodies[1].mySprite.data.prefabID || bodies[0].mySprite.data.prefabID == undefined)) {

                var force = 0;
                for (var j = 0; j < impulse.normalImpulses.length; j++)
                    if (impulse.normalImpulses[i] > force) force = impulse.normalImpulses[i];

                var velocityA = contact.GetFixtureA().GetBody().GetLinearVelocity().Length();
                var velocityB = contact.GetFixtureB().GetBody().GetLinearVelocity().Length();
                var impactAngle = (velocityA > velocityB) ? Math.atan2(contact.GetFixtureA().GetBody().GetLinearVelocity().y, contact.GetFixtureA().GetBody().GetLinearVelocity().x) : Math.atan2(contact.GetFixtureB().GetBody().GetLinearVelocity().y, contact.GetFixtureB().GetBody().GetLinearVelocity().x);
                impactAngle *= game.editor.RAD2DEG + 180;
                var velocitySum = velocityA + velocityB;
                if (velocitySum > 10.0) {
                    var worldManifold = new Box2D.b2WorldManifold();
                    contact.GetWorldManifold(worldManifold);
                    var worldCollisionPoint = worldManifold.points[0];
                    self.editor.addDecalToBody(body, worldCollisionPoint, "Decal10000", true);
                    emitterManager.playOnceEmitter("blood", body, worldCollisionPoint, impactAngle);
                }
            }
        }
    }

    let then, now;
    this.render = (newtime) => {
        if (!then) then = window.performance.now();
        requestAnimationFrame(self.render);
        now = newtime;
        const elapsed = now - then;
        if (elapsed > Settings.timeStep) {
            then = now - (elapsed % Settings.timeStep);
            self.update();
        }
    }

    this.update = function () {
        if (Settings.allowMouseMovement && this.mouseJoint) {
            if (Key.isDown(Key.MOUSE)) {
                this.mouseJoint.SetTarget(new b2Vec2(this.editor.mousePosWorld.x, this.editor.mousePosWorld.y));
            } else {
                this.world.DestroyJoint(this.mouseJoint);
                this.mouseJoint = null;
            }
        }
        if (this.run) {
            this.inputUpdate();
            this.stats.begin();
            this.world.Step(Settings.physicsTimeStep, 4, 3);
            this.stats.end();
            this.world.ClearForces();
            this.camera();
            emitterManager.update();
        }

        this.editor.run();
        this.newDebugGraphics.clear();
        if (this.gameState == this.GAMESTATE_EDITOR && this.editor.editorSettings.physicsDebug && !this.run) {
            this.world.DrawDebugData();
        }
        this.app.render();
        PIXICuller.update();
        Key.update();
    };

    this.prepareGameFonts = function () {
        const container = document.createElement('div');
        document.body.appendChild(container);
        for (let i = 0; i < Settings.availableFonts.length; i++) {
            const el = document.createElement('p');
            el.style.fontFamily = Settings.availableFonts[i];
            el.style.fontSize = "0px";
            el.style.visibility = "hidden";
            el.innerHTML = '.';
            container.appendChild(el);
        }
        setTimeout(() => {
            container.remove()
        }, 5000);
    }

    this.GAMESTATE_MENU = 'menu';
    this.GAMESTATE_EDITOR = 'editor';
    this.GAMESTATE_NORMALPLAY = 'play';
}
export var game = new Game();
setTimeout(() => {
    game.init();
}, 1); // guarantee all context is loaded and fix webpack order issue