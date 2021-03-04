
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
import * as PIXI from 'pixi.js'
import {
    ui
} from "./ui/UIManager";
import {
    backendManager
} from "./utils/BackendManager";
import {
    LoadCoreAssets, ExtractTextureAssets
} from "./AssetList";
import {
    Settings
} from "./Settings";
import {
    levelsData
} from "./data/levelsData";

import { dateDiff, JSONStringify } from "./b2Editor/utils/formatString";

import * as emitterManager from './utils/EmitterManager';
import * as PhysicsParticleEmitter from './utils/PhysicsParticleEmitter';
import * as SaveManager from "./utils/SaveManager";
import * as PIXICuller from "./utils/PIXICuller";
import * as EffectsComposer from './utils/EffectsComposer';
import * as MobileController from './utils/MobileController';
import * as AudioManager from './utils/AudioManager';
import * as TutorialManager from './utils/TutorialManager';
import * as SlowmoUI from './ui/Slomo';

import { Camera as PIXICamera } from './utils/PIXICameraV6';
import { YouTubePlayer } from "./utils/YouTubePlayer";

const nanoid = require('nanoid');

import GameStats from 'gamestats.js'; //TO DO PUBLISH NPM

var b2Vec2 = Box2D.b2Vec2,
    b2AABB = Box2D.b2AABB,
    b2Body = Box2D.b2Body,
    b2World = Box2D.b2World,
    b2MouseJointDef = Box2D.b2MouseJointDef;


// chech WebGL support
(function () {
    if(!document.createElement('canvas').getContext('webgl')) {
        alert("Jolly! What happened!? WebGL could not be initialized. Please free up GPU/CPU resources by closing tabs and other software. Click OK to retry.");
        window.location.reload();
    }
})();


function Game() {

    this.editor;
    this.app;
    this.stage;
    this.myContainer;
    this.levelCamera;
    this.myEffectsContainer;
    this.traceImage;
    this.newDebugGraphic;
    this.canvas;
    this.renderer;
    this.world;
    this.worldJSON;
    this.slowmoUI;
    this.slowmoUI_Text;

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
    this.cameraFocusCharacterObject;

    this.stats;

    this.currentLevelData;

    this.levelStartTime = 0;
    this.levelWon = false;
    this.gameOver = false;
    this.checkPointData = null;
    this.selectedCharacter = 0;
    this.selectedVehicle = 0;

    this.needScreenshot = false;
    this.screenShotData = null;

    this.ui = ui;

    this.preloader = document.getElementById('preloader');

    // path pixi for camera support
    // PathRenderTarget();

    this.init = function () {
        this.stats = new GameStats()
        document.body.appendChild(this.stats.dom);
        this.stats.dom.style.left = '0px';
        this.stats.dom.style.top = 'unset';
        this.stats.dom.style.bottom = '0px';
        const showStats = (window.location.search.indexOf('stats=true')>=0)
        this.stats.show(showStats);

        this.canvas = document.getElementById("canvas");

        const userData = SaveManager.getLocalUserdata();

        if(Settings.HDR && window.devicePixelRatio >= 2){
            // max 2K
            if(window.innerHeight * 2 > 1440) Settings.pixelRatio = 1.5;
            else Settings.pixelRatio = 2;
        }
        Settings.sfxOn = userData.sfxOn;

        this.app = new PIXI.Application({
            view: this.canvas,
            backgroundColor: 0xD4D4D4,
            resolution: Settings.pixelRatio
        });
        this.handleResize();

        this.app.view.addEventListener('webglcontextlost', (_event) => {
            alert("Jolly Goodness! I almost fried your PC, Sorry.. (kidding) Something stressed out the browser and I'm forced to restart the game! Click OK to restart.");
            window.location.reload();
        });


        window.__pixiScreenshot = ()=>{
            this.needScreenshot = true;
            return new Promise((resolve, _reject) => {
                let interval = setInterval(()=>{
                    if(this.screenShotData){
                        clearInterval(interval);
                        resolve(this.screenShotData);
                        this.needScreenshot = false;
                        this.screenShotData = null;
                    }
                }, 1)
            });
        }

        this.app.stop(); // do custom render step
        this.stage = this.app.stage;
        this.app.renderer.plugins.interaction.removeEvents();

        PIXI.Ticker.shared.stop();

        this.stage.interactiveChildren=false;
        this.app.renderer.plugins.accessibility.destroy();

        LoadCoreAssets(this.app.loader);

        this.editor = B2dEditor;

        this.app.loader.load(
            async ()=> {
                await ExtractTextureAssets(this.app.loader);
                this.setup();
            }
        );

        this.prepareGameFonts();

        this.gameState = this.GAMESTATE_MENU;

        EffectsComposer.init(this.stage)
        // because a this.app.screen is object getter,
        // rectangle should updates automatically
        this.stage.filterArea = this.app.screen;

        if(MobileController.isMobile()) {
            MobileController.init();
        }

        YouTubePlayer.preload();
        AudioManager.init();
        TutorialManager.init();

    };

    this.setup = function () {

        this.world = new b2World(
            new b2Vec2(0, 10) //gravity
        );
        const bodyDef = new Box2D.b2BodyDef();
        this.m_groundBody = this.world.CreateBody(bodyDef);

        //container
        this.myContainer = new PIXI.Container();

        this.levelCamera = new PIXICamera(this.myContainer);
        //this.levelCamera.disable();

        this.myContainer.camera = this.levelCamera;

        // inser rela camera to container, and now container broke transformation =)
        // render order:
        // stage (noraml update) 
        //   => levelCamera_init_viewport 
        //        => levelContaner (matix is shift it) 
        //                => levelCamer_restore_viewport (normalUpdate)
        this.stage.addChild(this.levelCamera);

        //this.myContainer.addChild(this.levelContainer);


        //container
        this.myEffectsContainer = new PIXI.Container();
        this.stage.addChild(this.myEffectsContainer);

        //Debug Draw
        this.newDebugGraphics = new PIXI.Graphics();
        this.myDebugDraw = getPIXIDebugDraw(this.newDebugGraphics, Settings.PTM);
        this.myDebugDraw.SetFlags(Box2D.b2DrawFlags.e_shapeBit | Box2D.b2DrawFlags.e_jointBit);
        this.world.SetDebugDraw(this.myDebugDraw);

        this.render();

        const res = this.app.loader.resources;
        const assets = this.editor.assetLists;

        assets.characters = Object.keys(res["Characters_1.json"].textures);
        assets.vehicles = [].concat(Object.keys(res["Vehicles_1.json"].textures), Object.keys(res["Mech.json"].textures));
        assets.movement = Object.keys(res["Movement.json"].textures);
        assets.construction = Object.keys(res["Construction.json"].textures);
        assets.nature = Object.keys(res["Nature.json"].textures);
        assets.weapons = Object.keys(res["Weapons.json"].textures);
        assets.level = Object.keys(res["Level.json"].textures);
        assets.gore = Object.keys(res["Characters_Gore.json"].textures);

        this.editor.tileLists = Settings.textureNames;
        this.editor.init(this.stage, this.myContainer, this.world, Settings.PTM);
        this.myContainer.addChild(this.newDebugGraphics);

        this.editor.contactCallBackListener = this.gameContactListener;


        const uidHash = location.hash.split('/')[0].substr(1);

        this.openMainMenu();
        this.ui.showSettingsButtons();


        if(uidHash && uidHash.length===21){
            ui.disableMainMenu(true);
            backendManager.getPublishedLevelInfo(uidHash).then(levelData => {

                this.loadPublishedLevelData(levelData);
            }).catch(_err =>{
                location.hash = '';
                ui.disableMainMenu(false);
            });
        }

        document.body.addEventListener("keydown", this.onKeyDown.bind(this), {passive:false});
        document.body.addEventListener("keyup", this.onKeyUp.bind(this), {passive:false});
        this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this), {passive:false});
        this.canvas.addEventListener("touchstart", this.onMouseDown.bind(this), {passive:false});
        document.addEventListener("mouseup", this.onMouseUp.bind(this), {passive:false});
        document.addEventListener("touchend", this.onMouseUp.bind(this), {passive:false});
        this.canvas.addEventListener("blur", ()=>{
            game.editor.shiftDown = false;
            game.editor.ctrlDown = false;
            Key.reset();
        })


        document.addEventListener("mouseup", ()=>{
            if(this.editor.editing) this.editor.storeUndoMovementDebounced();
        }, {passive:false});

        document.addEventListener("touchend", ()=>{
            if(this.editor.editing) this.editor.storeUndoMovementDebounced();
        }, {passive:false});


        document.addEventListener("mousemove", this.onMouseMove.bind(this), {passive:false});
        document.addEventListener("touchmove", this.onMouseMove.bind(this), {passive:false});

        document.addEventListener("mousemove", this.onDocumentMouseMove.bind(this), {passive:false});
        document.addEventListener("touchmove", this.onDocumentMouseMove.bind(this), {passive:false});

        window.addEventListener('wheel', this.onMouseWheel.bind(this), {passive:false});
        window.addEventListener('resize', this.handleResize.bind(this));

        if(MobileController.isMobile() && MobileController.isIos()){
            // ios reflow fix
            setInterval(()=>{
                this.handleResize();
            }, Settings.iosReflowInterval);
        }

        window.addEventListener('hashchange', ()=>{
            const id = location.hash.split('/')[0].substr(1);
            if(id.length === 21  && this.currentLevelData && id !== this.currentLevelData.id){
                location.reload();
            }
        })
        window.addEventListener('paste', (e)=> {
            try{
            if(e.clipboardData == false) return false;
            e.clipboardData.items.forEach( el => {
                if(el.type == 'text/plain'){
                el.getAsString(s=>{
                        s = s.trim();
                        if(s && s.startsWith(Settings.jollyDataPrefix) && s.endsWith('>')){
                            const copyData = s.substr(Settings.jollyDataPrefix.length, s.length-Settings.jollyDataPrefix.length-1);
                            this.editor.pasteData(copyData);
                        }
                    });
                }else if(el.type.indexOf("image")>=0){
                    const imageFile =  el.getAsFile();
                    const src = URL.createObjectURL(imageFile);
                    const texture = PIXI.Texture.from(src);
                    texture.baseTexture.addListener('loaded', ()=> {

                        if(game.editor.tracingTexture){
                            game.editor.tracingTexture.destroy({texture:true, baseTexture:true});
                        }

                        game.editor.tracingTexture = new PIXI.Sprite(PIXI.Texture.from(src));
                        game.editor.tracingTexture.pivot.set(game.editor.tracingTexture.width/2, game.editor.tracingTexture.height/2);
                        game.editor.container.addChildAt(game.editor.tracingTexture, 0);
                        if(game.editor.selectedTool === game.editor.tool_SETTINGS){
                            game.editor.selectedTool = -1;
                            game.editor.selectTool(game.editor.tool_SETTINGS);
                        }
                        game.editor.camera.set({ x:window.innerWidth/2, y:window.innerHeight/2 });
                    });
                }
            })
            }catch(e){
                console.log("Copy Paste error:", e);
            }
        })

        window.addEventListener('focus', ()=>{
            backendManager.login();
        })

        emitterManager.init();
        PhysicsParticleEmitter.init();

        PIXICuller.init(this.editor.textures, this.levelCamera);

        // SITELOCK
        (function checkInit() {
            const hosts = ['bG9jYWxob3N0', 'LnBva2kuY29t', 'LnBva2ktZ2RuLmNvbQ==', 'am9sbHl3b3JsZC5uZXRsaWZ5LmFwcA==', 'am9sbHl3b3JsZC5hcHA='];
            // localhost, .poki.com, .poki-gdn.com

            let allowed = false;
            const liveHost = window.location.hostname;

            for (let i = 0; i < hosts.length; i++) {
                const host = atob(hosts[i]);
                if (liveHost.indexOf(host, liveHost.length - host.length) !== -1) { // endsWith()
                    allowed = true;
                    break;
                }
            }
            if (!allowed) {
                const targetURL = 'aHR0cHM6Ly9wb2tpLmNvbS9zaXRlbG9jaw==';
                const url = atob(targetURL);
                window.location.href = url;
                window.top.location !== window.location && (window.top.location = window.location);
            }
        }());

        this.preloader.classList.add('hide');

        SlowmoUI.init();

        //this.myContainer.updateTransform = function() {};
    }


    //mouse
    this.onMouseDown = function (e) {

        this.fixTouchEvent(e);

        if (Settings.allowMouseMovement && this.gameState == this.GAMESTATE_EDITOR && this.editor.editorSettings.physicsDebug &&  !this.mouseJoint && this.run) {
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
        if(this.gameState == this.GAMESTATE_EDITOR) this.editor.onMouseDown(e);
    };

    this.onMouseUp = function (e) {
        this.fixTouchEvent(e);
        Key.onMouseUp();
        this.editor.onMouseUp(e);
    };

    this.onMouseWheel = function(e){
        if(this.gameState == this.GAMESTATE_EDITOR) this.editor.onMouseWheel(e);
        if(e.target === this.canvas) e.preventDefault(); // no zooming on the canvas
    }

    this.onMouseMove = function (e) {
        this.fixTouchEvent(e);
        this.editor.onMouseMove(e);
    };
    this.onDocumentMouseMove = function (e) {
        this.fixTouchEvent(e);
        if(this.gameState == this.GAMESTATE_EDITOR) this.editor.onDocumentMouseMove(e);
    };
    this.fixTouchEvent = e => {
        if(e.changedTouches){
            const touch = e.changedTouches[0];
            e.clientX = touch.clientX;
            e.clientY = touch.clientY;
        }
    }

    this.handleResize = function (e) {
        const w = window.innerWidth;
        const h = window.innerHeight;

        if(w === this.oldInnerWidth && h === this.oldInnerHeight) return;

        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.app.renderer.resize(w, h);

        PIXICuller.renderArea.width = w;
        PIXICuller.renderArea.height = h;

        const aspect = window.innerWidth/window.innerHeight;

        if(aspect<Settings.minimumAspect){
            const targetHeight = Settings.targetResolution.y;
            Settings.aspectZoom = window.innerHeight / targetHeight;
        } else if(aspect>Settings.maximumAspect){
            const targetWidth = Settings.targetResolution.x;
            Settings.aspectZoom = window.innerWidth / targetWidth;
        }else{
            const targetWidth = Settings.targetResolution.x;
            Settings.aspectZoom = window.innerWidth / targetWidth;

            if(window.innerHeight / Settings.aspectZoom < Settings.targetResolution.y){
                const targetHeight = Settings.targetResolution.y
                Settings.aspectZoom = window.innerHeight / targetHeight;
            }
        }
        MobileController.resize();

        this.oldInnerWidth = window.innerWidth;
        this.oldInnerHeight = window.innerHeight;
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
            if (fixture.GetBody().GetType() != b2Body.b2_staticBody && !fixture.isPhysicsCamera) {
                if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), self.editor.mousePosWorld)) {
                    self.selectedBody = fixture.GetBody();
                    return false;
                }
            }
            return true;
        }
    };

    this.inputUpdate = function () {
        if (this.gameState != this.GAMESTATE_MENU && this.character.alive && !this.pause && !this.levelWon) {
            if (this.vehicle && this.character.attachedToVehicle) {

                if (Key.isDown(Key.W) || Key.isDown(Key.UP)) {
                    this.vehicle.accelerate(1);
                };
                if (Key.isDown(Key.S) || Key.isDown(Key.DOWN)) {
                    this.vehicle.accelerate(-1);
                };
                if (!Key.isDown(Key.W) && !Key.isDown(Key.S) &&  !Key.isDown(Key.UP) &&  !Key.isDown(Key.DOWN)) {
                    this.vehicle.stopAccelerate();
                };

                if (Key.isDown(Key.A) || Key.isDown(Key.LEFT)) {
                    this.vehicle.lean(-1);
                    this.character.lean(-1);
                }
                if (Key.isDown(Key.D) || Key.isDown(Key.RIGHT)) {
                    this.vehicle.lean(1);
                    this.character.lean(1);
                }
                if (Key.isPressed(Key.Z)) {
                    this.character.detachFromVehicle(Settings.detachForce);
                };
                if(Key.isPressed(Key.SPACE)){
                    this.character.flip();
                }

            } else if (this.character && !this.character.attachedToVehicle) {
                if (Key.isDown(Key.W) || Key.isDown(Key.UP)) {
                    this.character.positionBody('up');
                    if (Key.isDown(Key.A)  || Key.isDown(Key.LEFT)) this.character.lean(-1);
                    else if (Key.isDown(Key.D) || Key.isDown(Key.RIGHT)) this.character.lean(1);
                } else if (Key.isDown(Key.S) || Key.isDown(Key.DOWN)) {
                    this.character.positionBody('down');
                    if (Key.isDown(Key.A) || Key.isDown(Key.LEFT)) this.character.lean(-1);
                    else if (Key.isDown(Key.D)  || Key.isDown(Key.RIGHT)) this.character.lean(1);
                } else if (Key.isDown(Key.A) || Key.isDown(Key.LEFT)) {
                    this.character.positionBody('left');
                    this.character.lean(-0.3);
                } else if (Key.isDown(Key.D) || Key.isDown(Key.RIGHT)) {
                    this.character.positionBody('right');
                    this.character.lean(0.3);
                }

                if(Key.isPressed(Key.SPACE)){
                    this.character.flip();
                }
            }

            if(this.character.hat){
                if (Key.isPressed(Key.E)) {
                    this.character.hat.activate();
                };
                if (Key.isDown(Key.W) || Key.isDown(Key.UP)) {
                    this.character.hat.accelerate(-1);
                }else if (Key.isDown(Key.S) || Key.isDown(Key.DOWN)) {
                    this.character.hat.accelerate(1);
                }else{
                    this.character.hat.accelerate(0);
                }
                if (Key.isDown(Key.A) || Key.isDown(Key.LEFT)) {
                    this.character.hat.lean(-1);
                }else if (Key.isDown(Key.D) || Key.isDown(Key.RIGHT)) {
                    this.character.hat.lean(1);
                }
            }

        }
        if(this.gameState == this.GAMESTATE_NORMALPLAY){
            if((Key.isPressed(Key.P) || Key.isPressed(Key.R) || Key.isPressed(Key.ESCAPE) || Key.isPressed(Key.TAB)) && this.run){
                if(!this.pause) this.pauseGame();
            }
        }
    }

    this.onKeyDown = function (e) {
        if(document.activeElement != document.body && document.activeElement != this.canvas) return;
        if (this.gameState == this.GAMESTATE_EDITOR) {
            if (e.keyCode == 84 || e.keyCode == 27) { // t esc enter
                if (this.run) {
                    if (e.shiftKey && e.ctrlKey) this.editor.breakPrefabs = true; //TODO: REMOVE
                    this.stopTestingWorld(e);
                    return;
                } else if(e.keyCode !== 27){
                    this.testWorld();
                }
            }
        }

        if (e.keyCode == 32) { //space
            if (this.gameOver && this.run) {
                this.resetWorld(true);
            }
        }
        if((this.editor.editing && !this.run) && (e.ctrlKey || e.metaKey) && e.keyCode == 86) { // v
            return;
        }

        Key.onKeydown(e);
        if (this.editor.editing && !this.run) this.editor.onKeyDown(e);
        e.preventDefault();
    }
    this.onKeyUp = function (e) {
        if(document.activeElement != document.body  && document.activeElement != this.canvas) return;
        this.editor.onKeyUp(e);

        if (e.keyCode == 87 || e.keyCode == 83 && this.run) {
            this.vehicle.stopAccelerate();
        }
        Key.onKeyUp(e);
        e.preventDefault();
    }
    this.openMainMenu = function (showLevelList) {
        //if(this.run) this.stopWorld();

        this.resetGameSelection();

        this.initLevel(levelsData.mainMenuLevel);
        ui.showMainMenu();
        ui.hideGameOverMenu();
        this.gameState = this.GAMESTATE_MENU;
        this.runWorld();
        this.interactive = false;
        this.editor.editing = false;
        this.stopAutoSave();

        if(showLevelList && ui.hasLevelLoader){
            ui.hideMainMenu();
            ui.showLevelLoader();
        }
    }
    this.resetGameSelection = function(){
        this.selectedCharacter = 0;
        this.selectedVehicle = 0;
    }

    this.runWorld = function () {
        this.editor.runWorld();
        this.run = true;
        this.findPlayableCharacter();
    }
    this.playWorld = function (firstEntry) {
        this.movementBuffer = [];
        MobileController.openFullscreen();
        MobileController.showVehicleControls();
        this.runWorld();
        this.gameState = this.GAMESTATE_NORMALPLAY;
        if(firstEntry) this.levelStartTime = Date.now();
        MobileController.show();
        ui.showSmallLogo();
    }

    this.testWorld = function () {
        this.movementBuffer = [];
        this.editor.testWorld();
        this.run = true;
        this.findPlayableCharacter();
        this.stopAutoSave();
        this.levelStartTime = Date.now();
        MobileController.show();
        TutorialManager.showTutorial(TutorialManager.TUTORIALS.WELCOME);
    }
    this.stopTestingWorld = function () {
        this.stopWorld();
        ui.hideWinScreen();
        var worldJSON = JSON.parse(this.editor.worldJSON);
        this.editor.buildJSON(worldJSON);
        this.doAutoSave();
    }
    this.resetWorld = function (doCheckpoint) {
        game.preloader.classList.remove('hide');
        setTimeout(()=>{
            const checkPointData = this.checkPointData;
            this.resetGame();
            if (this.gameState == this.GAMESTATE_EDITOR) {
                this.stopTestingWorld();
                this.testWorld();
            }else if(this.gameState == this.GAMESTATE_NORMALPLAY){
                this.initLevel(this.currentLevelData);
                this.playWorld(!doCheckpoint);
            }

            if(doCheckpoint && checkPointData){
                const prefabLookupObject = this.editor.lookupGroups[this.playerPrefabObject.key];
                const allObjects = [].concat(prefabLookupObject._bodies, prefabLookupObject._textures, prefabLookupObject._joints);

                const positionDiff = {x:checkPointData.x*this.editor.PTM-this.playerPrefabObject.x, y:checkPointData.y*this.editor.PTM-this.playerPrefabObject.y, }

                const perpendularAngle = checkPointData.rotation - Math.PI/2;
                const checkPointOffset = 200;
                positionDiff.x += checkPointOffset*Math.cos(perpendularAngle);
                positionDiff.y += checkPointOffset*Math.sin(perpendularAngle);

                if(this.playerPrefabObject.class.character.hat){
                    const hatBody = this.playerPrefabObject.class.character.hat.hatBody;
                    const position = hatBody.GetPosition();
                    position.x += positionDiff.x / Settings.PTM;
                    position.y += positionDiff.y / Settings.PTM;
                    hatBody.SetPosition(position);
                }

                this.editor.applyToObjects(this.editor.TRANSFORM_MOVE, positionDiff, allObjects);
                this.editor.applyToObjects(this.editor.TRANSFORM_ROTATE, checkPointData.rotation, allObjects);

                prefabLookupObject._bodies.forEach(body =>{
                    this.editor.updateBodyPosition(body);
                });
                this.checkPointData = checkPointData;

                if(this.checkPointData.flipped) this.character.flip();
            }


            setTimeout(()=>{
                game.preloader.classList.add('hide');
                TutorialManager.showTutorial(TutorialManager.TUTORIALS.WELCOME);
            }, Settings.levelBuildDelayTime);
        }, Settings.levelBuildDelayTime);
    }
    this.stopWorld = function () {
        this.movementBuffer = [];
        emitterManager.reset();
        this.editor.resetEditor();
        this.run = false;
        this.resetGame();
        ui.hideGameOverMenu();
        PhysicsParticleEmitter.update(true);
        MobileController.hide();
        AudioManager.stopAllSounds();
        SlowmoUI.hide();
        ui.hideSmallLogo();
    }
    this.openEditor = function () {
        this.gameState = this.GAMESTATE_EDITOR;
        this.stopWorld();
        this.initLevel(SaveManager.getTempEditorWorld());
        this.doAutoSave();
        this.editor.editing = true;
        ui.hide();

        if(localStorage.getItem('needsToRegister')){
			backendManager.dispatchEvent('username');
		}
    }
    this.initLevel = function (data) {

        this.stopWorld();
        this.currentLevelData = data;
        this.editor.ui.setLevelSpecifics();
        this.editor.buildJSON(data.json);
        //this.editor.buildJSON(this.app.resources["characterData1"].data);
    }
    this.pauseGame = function(){
        if(this.gameOver) return;
        this.pause = true;
        this.run = false;
        ui.showPauseMenu();
        AudioManager.stopAllSounds();
        MobileController.hide();
    }
    this.unpauseGame = function(){
        this.pause = false;
        this.run = true;
        ui.hidePauseMenu();
        MobileController.show();
    }
    this.resetGame = function(){
        this.levelWon = false;
        this.gameOver = false;
        this.checkPointData = null;
    }
    // playWorld/testWorld/editoWorld
    this.autoSaveTimeOutID;
    this.doAutoSave = function () {
        let self = this;
        this.stopAutoSave();
        this.autoSaveTimeOutID = setTimeout(() => {
            if(self.editor.groupEditing){
                self.currentLevelData.json = this.editor.stringifyWorldJSON();
                SaveManager.saveTempEditorWorld(self.currentLevelData);
            }
            self.doAutoSave();
        }, Settings.autoSaveInterval);
    }
    this.stopAutoSave = function () {
        clearTimeout(this.autoSaveTimeOutID);
        this.autoSaveTimeOutID = undefined;
    }
    this.newLevel = function () {
        let data = {
            json: '{"objects":[[4,0,0,0,{"selectedVehicle":"Bike","life":300},"Bike",0]],"settings":[10,0,10]}',
            title: '',
            description: '',
            crossPromos: [],
            creationDate: Date.now(),
            forced_vehicle:0,
            id: nanoid(),
        }
        this.initLevel(data);
        SaveManager.saveTempEditorWorld(this.currentLevelData);
    }
    this.saveNewLevelData = function () {
        game.currentLevelData.id = nanoid();
        return this.saveLevelData();
    }
    this.saveLevelData = function () {
        return new Promise((resolve, reject) => {
            backendManager.uploadUserLevelData(game.currentLevelData, game.editor.stringifyWorldJSON(), game.editor.cameraShotData).then((levelData) => {
                this.currentLevelData = levelData;
                game.currentLevelData.saved = true;
                game.editor.cameraShotData = null;
                SaveManager.saveTempEditorWorld(self.currentLevelData);
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }
    this.publishLevelData = function () {
        return new Promise((resolve, reject) => {
            backendManager.publishLevelData(game.currentLevelData).then((levelData) => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }
    this.deleteLevelData = function () {
        return backendManager.deleteUserLevelData(game.currentLevelData);
    }
    this.levelHasChanges = function () {
        if (game.currentLevelData.json != game.editor.stringifyWorldJSON()) return true;
        return false;
    }
    this.checkpoint = function (object) {
        if(!this.checkPointData || this.checkPointData.object !== object){
            const confettiPosition = object.GetPosition().Clone();
            const confettiOffset = 3.0;
            const offsetAngle = object.GetAngle() - Settings.pihalve;

            confettiPosition.x += confettiOffset * Math.cos(offsetAngle);
            confettiPosition.y += confettiOffset * Math.sin(offsetAngle);

            emitterManager.playOnceEmitter("confetti", object, confettiPosition, 0, ['#27cdcb', '#333333']);
		    AudioManager.playSFX('checkpoint', 0.2, 1.0 + 0.4 * Math.random()-0.2, object.GetPosition());

            this.checkPointData = {
                x:object.GetPosition().x,
                y:object.GetPosition().y,
                rotation:object.GetAngle(),
                object,
                flipped:this.character.flipped,
            }
        }
    }
    this.win = function () {
        if (!this.gameOver && !this.levelWon) {
            this.levelWon = true;
            const d = dateDiff(Date.now(), this.levelStartTime);
            const s = `${d.hh}:${d.mm}:${d.ss}:${d.ms}`;
            if(this.gameState == this.GAMESTATE_EDITOR){
                ui.show();
                ui.showWinScreen(s);
            }else if(this.gameState == this.GAMESTATE_NORMALPLAY){;
                ui.showWinScreen(s);
            }
            this.editor.ui.showConfetti();
            MobileController.hide();
        }
    }
    this.lose = function () {
        if (!this.gameOver && !this.levelWon && (this.gameState === this.GAMESTATE_NORMALPLAY || this.gameState === this.GAMESTATE_EDITOR)) {
            ui.show();
            ui.showGameOver();
            MobileController.hide();
            this.gameOver = true;
        }
    }
    this.loadUserLevelData = function (levelData) {
        return new Promise((resolve, reject) => {
            game.currentLevelData = levelData;

			const body = {
				method: 'GET',
			}

            fetch(`${Settings.STATIC}/${levelData.level_md5}.json`, body)
            .then(response => response.json())
            .then(data => {
                this.currentLevelData.json = JSONStringify(data);
                this.currentLevelData.saved = true;
                this.initLevel(this.currentLevelData);
                SaveManager.saveTempEditorWorld(this.currentLevelData);
                return resolve();
            }).catch((err)=>{
                return reject({
                    message: err
                });
            })
        });
    }
    this.loadPublishedLevelData = function (levelData, progressFunction) {
        return new Promise(async (resolve, reject) => {
            game.currentLevelData = levelData;
            const self = this;
            try{
                let response = await fetch(`${Settings.STATIC}/${levelData.level_md5}.json`);
                const reader = response.body.getReader();
                const contentLength = +response.headers.get('Content-Length') || 1000000; // TODO: x-compressed-content-length
                let receivedLength = 0;
                let chunks = [];
                if(progressFunction) progressFunction(0);

                while(true) {
                    const {done, value} = await reader.read();
                    if (done) {
                        break;
                    }

                    chunks.push(value);
                    receivedLength += value.length;
                    const progress = receivedLength/contentLength
                    if(progressFunction) progressFunction(progress);
                }
                let chunksAll = new Uint8Array(receivedLength); // (4.1)
                let position = 0;
                for(let chunk of chunks) {
                    chunksAll.set(chunk, position); // (4.2)
                    position += chunk.length;
                }
                let result = new TextDecoder("utf-8").decode(chunksAll);

                if(progressFunction) progressFunction(0);

                self.currentLevelData.json = result;
                this.previewLevel();
                return resolve();
            }catch(err){
                console.log('fail', err);
                game.gameState = game.GAMESTATE_MENU;
                return reject({
                    message: err
                });
            }
        });
    }
    this.previewLevel = function(){
        ui.hideMainMenu();
        ui.showLevelBanner();
        this.editor.ui.hide();
        this.resetGame();

        MobileController.hide();

        game.gameState = game.GAMESTATE_PREVIEW;
    }

    this.findPlayableCharacter = function () {
        for (var key in this.editor.activePrefabs) {
            if (this.editor.activePrefabs.hasOwnProperty(key)) {
                if (this.editor.activePrefabs[key].class.constructor.playableCharacter) {
                    this.playerPrefabObject = this.editor.activePrefabs[key];

                    this.character = this.editor.activePrefabs[this.playerPrefabObject.class.lookupObject.character.body.mySprite.data.subPrefabInstanceName].class;
                    this.vehicle = this.editor.activePrefabs[this.playerPrefabObject.class.prefabObject.key].class;
                    this.cameraFocusObject = this.cameraFocusCharacterObject = this.character.lookupObject.body;

                    var bodies = this.editor.lookupGroups[this.playerPrefabObject.key]._bodies;
                    bodies.forEach(body => {
                        body.mainCharacter = true;
                    });
                    break;
                }
            }
        }
    }
    this.movementBufferSize = 60;
    this.movementBuffer = [];
    this.camera = function (instant) {
        const panEase = !instant ? 0.1 : 1.0;
        const zoomEase = !instant ? 0.1 : 1.0;
        const camera = this.editor.cameraHolder;

        const currentZoom = camera.scale.x;
        const targetZoom = Settings.aspectZoom * this.editor.editorSettingsObject.cameraZoom;
        const cameraTargetPosition = this.editor.getPIXIPointFromWorldPoint(this.cameraFocusObject.GetPosition());

        this.editor.camera.setZoom(cameraTargetPosition, currentZoom + (targetZoom - currentZoom) * zoomEase);

        cameraTargetPosition.x -= window.innerWidth / 2.0 / camera.scale.x;
        cameraTargetPosition.y -= window.innerHeight / 2.0 / camera.scale.y;
        cameraTargetPosition.x *= camera.scale.x;
        cameraTargetPosition.y *= camera.scale.y;


        const movX = (-cameraTargetPosition.x - camera.x) * panEase;
        const movY = (-cameraTargetPosition.y - camera.y) * panEase;


        let offsetX = 0;
        let offsetY = 0;
        this.movementBuffer.push(this.cameraFocusObject.GetLinearVelocity().Clone());
        if(this.movementBuffer.length > this.movementBufferSize) this.movementBuffer.shift();

        if(this.movementBuffer.length){
            for(let i = 0; i<this.movementBuffer.length; i++){
                offsetX += this.movementBuffer[i].x;
                offsetY += this.movementBuffer[i].y;
            }
            offsetX /= this.movementBufferSize;
            offsetY /= this.movementBufferSize;
        }

        const maxOffset = window.innerWidth * 0.03 / camera.scale.x;
        offsetX = Math.min(Math.max(offsetX, -maxOffset), maxOffset);
        offsetY = Math.min(Math.max(offsetY, -maxOffset), maxOffset)

        const offsetScale = 1.0 * game.editor.editorSettingsObject.gameSpeed;

        camera.x += (movX-offsetX*offsetScale);
        camera.y += (movY-offsetY*offsetScale);

        this.myEffectsContainer.scale.x = camera.scale.x;
        this.myEffectsContainer.scale.y = camera.scale.y;
        this.myEffectsContainer.x = camera.x;
        this.myEffectsContainer.y = camera.y;

        // position slowmotion UI
        SlowmoUI.ui.x = (-this.myEffectsContainer.x + window.innerWidth / 2.0) / camera.scale.x;
        SlowmoUI.ui.y = (-this.myEffectsContainer.y  + 20) / camera.scale.x;
        SlowmoUI.ui.scale.x = SlowmoUI.ui.scale.y = (1/camera.scale.x) * 0.5;
    }

    var self = this;
    this.gameContactListener = new Box2D.b2ContactListener();
    this.gameContactListener.BeginContact = function (contact) {

        const currentTime = Date.now();
        let target = contact.GetFixtureA().GetBody();
        if(target.ignoreCollisionsTime && target.ignoreCollisionsTime>currentTime) contact.SetEnabled(false);
        else if(target.ignoreCollisionsTime && target.ignoreCollisionsTime<currentTime) target.ignoreCollisionsTime = undefined;

        target = contact.GetFixtureB().GetBody();
        if(target.ignoreCollisionsTime && target.ignoreCollisionsTime>currentTime) contact.SetEnabled(false);
        else if(target.ignoreCollisionsTime && target.ignoreCollisionsTime<currentTime) target.ignoreCollisionsTime = undefined;
    }
    this.gameContactListener.EndContact = function (contact) {
        const bodyA = contact.GetFixtureA().GetBody();
        const bodyB = contact.GetFixtureB().GetBody();

        if(bodyA.recentlyImpactedBodies && bodyA.recentlyImpactedBodies.includes(bodyB)){
            if(bodyA.recentlyImpactedBodies.length === 1) delete bodyA.recentlyImpactedBodies;
            else bodyA.recentlyImpactedBodies = bodyA.recentlyImpactedBodies.filter(body=>body != bodyB);
        }
        if(bodyB.recentlyImpactedBodies && bodyB.recentlyImpactedBodies.includes(bodyA)){
            if(bodyB.recentlyImpactedBodies.length === 1) delete bodyB.recentlyImpactedBodies;
            else bodyB.recentlyImpactedBodies = bodyB.recentlyImpactedBodies.filter(body=>body != bodyA);
        }
    }

    this.gameContactListener.PreSolve = function (contact, oldManifold) {
        const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
        let body;
        let otherBody;

        if(!bodies[0].mySprite || !bodies[1].mySprite) return;

        for (let i = 0; i < bodies.length; i++) {
            body = bodies[i];
            otherBody = i == 0 ? bodies[1] : bodies[0];
            if(body.mySprite.data.prefabInstanceName && body.mySprite.data.prefabInstanceName != otherBody.mySprite.data.prefabInstanceName){
                body.oldBounceManifest = body.GetLinearVelocity().Clone();
            }
        }
    }
    this.gameContactListener.PostSolve = function (contact, impulse) {

        const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
        let body;
        let otherBody;

        if(!bodies[0].mySprite || !bodies[1].mySprite) return;


        for (let i = 0; i < bodies.length; i++) {
            body = bodies[i];
            otherBody = i == 0 ? bodies[1] : bodies[0];
            const otherFixture = i == 0 ? contact.GetFixtureB() : contact.GetFixtureA();

            if(body.mySprite.data.prefabInstanceName && body.mySprite.data.prefabInstanceName != otherBody.mySprite.data.prefabInstanceName){
                if(body.oldBounceManifest && otherFixture.GetRestitution()>=0.5){

                    const velocityBoostX = (body.GetLinearVelocity().x - body.oldBounceManifest.x);
                    const velocityBoostY = (body.GetLinearVelocity().y - body.oldBounceManifest.y);

                    if(Math.sqrt(velocityBoostX*velocityBoostX + velocityBoostY * velocityBoostY) > 5){
                        let jointEdge = body.GetJointList();
                        while (jointEdge) {
                            const joint = jointEdge.joint;
                            const connectedBody = joint.GetBodyA() === body ? joint.GetBodyB() : joint.GetBodyA();
                            const velocity = connectedBody.GetLinearVelocity();
                            if(Math.abs(velocity.x-body.GetLinearVelocity().x) > Math.abs(velocityBoostX)/2) velocity.x += velocityBoostX*Settings.prefabBounceLimiter;
                            if(Math.abs(velocity.y-body.GetLinearVelocity().y) > Math.abs(velocityBoostY)/2) velocity.y += velocityBoostY*Settings.prefabBounceLimiter;

                            let innerJointEdge = connectedBody.GetJointList();

                            while(innerJointEdge){
                                const innerConnectedBody = innerJointEdge.joint.GetBodyA() === connectedBody ? innerJointEdge.joint.GetBodyB() : innerJointEdge.joint.GetBodyA();
                                if(innerConnectedBody != body){
                                    const innerVelocity = innerConnectedBody.GetLinearVelocity();
                                    if(Math.abs(innerVelocity.x-body.GetLinearVelocity().x) > Math.abs(velocityBoostX)/2) innerVelocity.x += velocityBoostX*Settings.prefabBounceLimiter;
                                    if(Math.abs(innerVelocity.y-body.GetLinearVelocity().y) > Math.abs(velocityBoostY)/2) innerVelocity.y += velocityBoostY*Settings.prefabBounceLimiter;
                                }
                                innerJointEdge = innerJointEdge.next;
                            }

                            jointEdge = jointEdge.next;

                        }
                    }
                    delete body.oldBounceManifest;
                }
            }


            if ((body.isFlesh && !body.snapped) && (bodies[0].mySprite.data.prefabID != bodies[1].mySprite.data.prefabID || bodies[0].mySprite.data.prefabID == undefined)) {
                if(otherBody.instaKill){
                    const bodyClass = self.editor.retrieveSubClassFromBody(body);
                    if(bodyClass && bodyClass.dealDamage){
                        bodyClass.dealDamage(10000);
                    }
                }else if(!otherBody.isVehiclePart && !otherBody.noImpactDamage) {
                    let force = 0;
                    for (let j = 0; j < impulse.normalImpulses.length; j++)
                        if (impulse.normalImpulses[i] > force) force = impulse.normalImpulses[i];

                    const bodyA = contact.GetFixtureA().GetBody();
                    const bodyB = contact.GetFixtureB().GetBody();

                    const velocityA = contact.GetFixtureA().GetBody().GetLinearVelocity().Length();
                    const velocityB = contact.GetFixtureB().GetBody().GetLinearVelocity().Length();
                    let impactAngle = (velocityA > velocityB) ? Math.atan2(contact.GetFixtureA().GetBody().GetLinearVelocity().y, contact.GetFixtureA().GetBody().GetLinearVelocity().x) : Math.atan2(contact.GetFixtureB().GetBody().GetLinearVelocity().y, contact.GetFixtureB().GetBody().GetLinearVelocity().x);
                    impactAngle *= game.editor.RAD2DEG + 180;
                    const velocitySum = velocityA + velocityB;

                    let allowSound = true;
                    if(bodyA.recentlyImpactedBodies && bodyA.recentlyImpactedBodies.includes(bodyB)) allowSound = false;
                    if(bodyB.recentlyImpactedBodies && bodyB.recentlyImpactedBodies.includes(bodyA)) allowSound = false;


                    if (velocitySum > 10.0) {
                        const worldManifold = new Box2D.b2WorldManifold();
                        contact.GetWorldManifold(worldManifold);
                        const worldCollisionPoint = worldManifold.points[0];

                        const slidingDecalSlider = 50;
                        const goreSize = Math.min(2, velocitySum/slidingDecalSlider);
                        self.editor.addDecalToBody(body, worldCollisionPoint, "Decal.png", true, goreSize);

                        emitterManager.playOnceEmitter("blood", body, worldCollisionPoint, impactAngle);

                        if(allowSound) AudioManager.playSFX(['bodyhit1', 'bodyhit2','bodyhit3'], 0.1, 1.4 + 0.4 * Math.random()-0.2, body.GetPosition());

                        if(!bodyA.recentlyImpactedBodies) bodyA.recentlyImpactedBodies = [];
                        bodyA.recentlyImpactedBodies.push(bodyB);

                        const bodyClass = self.editor.retrieveSubClassFromBody(body);
                        if(bodyClass && bodyClass.dealDamage && !body.noDamage){
                            const slidingDamageScalar = 50;
                            bodyClass.dealDamage(velocitySum/slidingDamageScalar);
                        }
                    }
                }
            }else{
                let force = 0;
                for (let j = 0; j < impulse.normalImpulses.length; j++)
                    if (impulse.normalImpulses[i] > force) force = impulse.normalImpulses[i];
                const bodyA = contact.GetFixtureA().GetBody();
                const bodyB = contact.GetFixtureB().GetBody();

                const velocityA = bodyA.GetLinearVelocity().Length();
                const velocityB = bodyB.GetLinearVelocity().Length();
                let impactAngle = (velocityA > velocityB) ? Math.atan2(bodyA.GetLinearVelocity().y, bodyA.GetLinearVelocity().x) : Math.atan2(bodyB.GetLinearVelocity().y, bodyB.GetLinearVelocity().x);
                impactAngle *= game.editor.RAD2DEG + 180;

                const fastestBody = velocityA > velocityB ? bodyA : bodyB;

                const velocitySum = velocityA + velocityB;

                let allowSound = true;
                if(bodyA.recentlyImpactedBodies && bodyA.recentlyImpactedBodies.includes(bodyB)) allowSound = false;
                if(bodyB.recentlyImpactedBodies && bodyB.recentlyImpactedBodies.includes(bodyA)) allowSound = false;

                if (velocitySum > 10.0 && force > 10 * fastestBody.GetMass() && allowSound) {
                    let targetSounds = ['impact-small1', 'impact-small2'];

                    if(!bodyA.recentlyImpactedBodies) bodyA.recentlyImpactedBodies = [];
                    bodyA.recentlyImpactedBodies.push(bodyB);

                    if(fastestBody.GetMass() > 1000) targetSounds = ['impact-heavy1', 'impact-heavy2'];
                    if(fastestBody.GetMass() > 100) targetSounds = ['impact-medium1', 'impact-medium2'];
                    AudioManager.playSFX(targetSounds, 0.1, 1.4 + 0.4 * Math.random()-0.2, fastestBody.GetPosition());
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

        this.stats.begin();

        if (Settings.allowMouseMovement && this.mouseJoint) {
            if (Key.isDown(Key.MOUSE)) {
                this.mouseJoint.SetTarget(new b2Vec2(this.editor.mousePosWorld.x, this.editor.mousePosWorld.y));
            } else {
                this.world.DestroyJoint(this.mouseJoint);
                this.mouseJoint = null;
            }
        }
        this.stats.begin('physics', '#ecbc4d');
        if (this.run) {
            this.inputUpdate();
            this.world.Step(Settings.physicsTimeStep * game.editor.editorSettingsObject.gameSpeed, 4, 3);
            this.world.ClearForces();
            this.camera();
            PhysicsParticleEmitter.update();
        }
        this.stats.end('physics');
        emitterManager.update();

        EffectsComposer.update();
        SlowmoUI.update();
        AudioManager.update();
        this.editor.run();

        this.newDebugGraphics.clear();
        if ((this.gameState == this.GAMESTATE_EDITOR || Settings.admin) && this.editor.editorSettings.physicsDebug) {
            this.world.DrawDebugData();
        }

        this.stats.begin('render', '#4399fa');
        if(!Settings.FPSLimiter || (Settings.FPSLimiter && !Settings.FPSFrameLimit)) this.app.render();
        Settings.FPSFrameLimit = !Settings.FPSFrameLimit;
        this.stats.end('render');

        if(this.needScreenshot) this.screenShotData = game.app.renderer.plugins.extract.canvas();
        PIXICuller.update();
        Key.update();

        this.stats.end();
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
    this.GAMESTATE_PREVIEW = 'preview';
    this.GAMESTATE_LOADINGDATA = 'loadingdata';
}
export var game = new Game();
setTimeout(() => {
    game.init();
}, 1); // guarantee all context is loaded and fix webpack order issue
