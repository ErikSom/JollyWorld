import {
    Key
} from "../libs/Key";
import {
    B2dEditor
} from "./b2Editor/B2dEditor";
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
import {MidiPlayer} from './utils/MidiPlayer'

import { timeFormat, JSONStringify } from "./b2Editor/utils/formatString";

import * as emitterManager from './utils/EmitterManager';
import * as PhysicsParticleEmitter from './utils/PhysicsParticleEmitter';
import * as SaveManager from "./utils/SaveManager";
import * as PIXICuller from "./utils/PIXICuller";
import * as EffectsComposer from './utils/EffectsComposer';
import * as MobileController from './utils/MobileController';
import * as AudioManager from './utils/AudioManager';
import * as TutorialManager from './utils/TutorialManager';
import * as SlowmoUI from './ui/Slomo';
import * as GameTimer from './utils/GameTimer'
import * as ReplayManager from './utils/ReplayManager';
import * as b2DebugDrawManager from './utils/b2DebugDrawManager'
import * as BodyBreaker from './b2Editor/utils/bodyBreaker'
import * as ModManager from './utils/ModManager'

import { Camera as PIXICamera } from './utils/PIXICameraV6';
import { YouTubePlayer } from "./utils/YouTubePlayer";

const nanoid = require('nanoid');

import GameStats from 'gamestats.js'; //TO DO PUBLISH NPM
import { countries } from "./utils/Localization";


import {b2CloneVec2, b2LinearStiffness, b2MulVec2} from '../libs/debugdraw'

const {getPointer, NULL, JSQueryCallback, JSContactListener} = Box2D;

const {b2Vec2, b2AABB, b2Body, b2World, b2MouseJointDef} = Box2D;

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
    this.lastKnownCameraPoint;
    this.cameraFocusCharacterObject;

    this.stats;

    this.currentLevelData;

    this.levelStartTime = 0;
    this.gameFrame = 0;
    this.levelWon = false;
    this.gameOver = false;
    this.checkPointData = null;
    this.selectedCharacter = 0;
    this.selectedVehicle = 0;

    this.needScreenshot = false;
    this.screenShotData = null;

    this.ui = ui;

    this.preloader = document.getElementById('preloader');
    this.tutorialMode = false;
    this.showLevelAfterTutorial = null;

    // path pixi for camera support
    // PathRenderTarget();

    this.gameInit = function () {
        this.stats = new GameStats()
        document.body.appendChild(this.stats.dom);
        this.stats.dom.style.left = '0px';
        this.stats.dom.style.top = 'unset';
        this.stats.dom.style.bottom = '0px';
        this.stats.dom.style.zIndex = '999';
        const showStats = (window.location.search.indexOf('stats=true')>=0)
        this.stats.show(showStats);

        Settings.levelAdmin = window.location.search.indexOf('levelAdmin=true')>=0;

        this.canvas = document.getElementById("canvas");

        const userData = SaveManager.getLocalUserdata();


        if(userData.country === '?'){
            let country = 'us';
            let userLang = navigator.language || navigator.userLanguage;
            if(userLang){
                const userCountry = userLang.split('-')[1];
                if(userCountry){
                    countries.forEach(c => {
                        if(c === userCountry.toLowerCase()){
                            country = c;
                        }
                    })
                }
            }

            userData.country = country;
            SaveManager.updateLocalUserData(userData);
        }
        Settings.currentCountry = userData.country;


        if(Settings.HDR && window.devicePixelRatio >= 2){
            // max 2K
            // if(window.innerHeight * 2 > 1440) Settings.pixelRatio = 1.5;
            // else Settings.pixelRatio = 2;
        }
        Settings.sfxOn = userData.sfxOn;
        Settings.bloodEnabled = userData.bloodOn;
        Settings.goreEnabled = userData.goreOn;

        this.app = new PIXI.Application({
            view: this.canvas,
            backgroundColor: 0xD4D4D4,
            resolution: Settings.pixelRatio
        });

        this.app.view.addEventListener('webglcontextlost', _event => {
            this.IS_ERROR = true;
            alert("Jolly Goodness! I almost fried your PC, Sorry.. (kidding) Something stressed out the browser and I'm forced to restart the game! Click OK to restart.");
            window.location.reload();
        });

        this.stats.enableExtension('pixi', [PIXI, this.app]);

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

        this.app.loader.onProgress.add(()=>{
            const startProgress = 0.8;
            const leftProgress = 1.0-startProgress;
            window.setLoaderProgress(0.8 + leftProgress * (this.app.loader.progress / 100));
        })

        this.editor = B2dEditor;

        this.app.loader.load(
            async ()=> {
                await ExtractTextureAssets(this.app.loader);
                window.setLoaderProgress(1.0);
                PokiSDK.gameLoadingFinished();
                this.gameSetup();
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

    this.gameSetup = function () {
        // first thing we do is mod the textures
        ModManager.init();

        this.world = new b2World(
            new b2Vec2(0, 10) //gravity
        );

        b2DebugDrawManager.init();

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

        this.triggerDebugDraw = new PIXI.Graphics();
        this.triggerDebugDraw.debounceRedraw = ()=>{
            while(game.triggerDebugDraw.children.length > 0){
                const child = game.triggerDebugDraw.getChildAt(0);
                child.destroy(true);
            }
            game.triggerDebugDraw.clear();
            this.triggerDebugDraw.redrawTimer = 6;
        }
        this.stage.addChild(this.triggerDebugDraw);

        this.newDebugGraphics = new PIXI.Graphics();

        this.gameRender();

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
        assets.misc = Object.keys(res["Misc.json"].textures);

        this.editor.tileLists = Settings.textureNames;
        this.editor.init(this.stage, this.myContainer, this.world, Settings.PTM);
        this.myContainer.addChild(this.newDebugGraphics);

        this.editor.contactCallBackListener = this.gameContactListener;



        const urlParams = new URLSearchParams(window.location.search);
        const forceTutorial = urlParams.get('forceTutorial');
        let uidHash = urlParams.get('lvl');

        if(!uidHash) uidHash = location.hash.split('/')[0].substr(1);

        const userData = SaveManager.getLocalUserdata();
        game.selectedCharacter = userData.selectedCharacter;

        this.openMainMenu();

        if(uidHash && uidHash.length===21){
            backendManager.getPublishedLevelInfo(uidHash).then(levelData => {
                ui.showLevelBanner(levelData);
                this.showLevelAfterTutorial = levelData;
            }).catch(_err =>{
                history.replaceState({}, document.title, '')
            });
        }else{
            const username = urlParams.get('user');
            if(username){
                ui.showUserPage(username);
            }
        }

        if(window.dafadfgjiwrgj || urlParams.get('disableAds')) Settings.disableAds = true;

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

        window.onbeforeunload = function(e) {
            if(this.editor.editing && window.location.href.indexOf('localhost:') < 0){
                const dialogText = 'Are you sure you want to close the editor?';
                e.returnValue = dialogText;
                return dialogText;
            };
        };

        if(MobileController.isMobile() && MobileController.isIos()){
            // ios reflow fix
            setInterval(()=>{
                this.handleResize();
            }, Settings.iosReflowInterval);
        }

        window.addEventListener('paste', (e)=> {
            if(this.editor.shiftDown) return;
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

                        const texture = PIXI.Texture.from(src, {scaleMode:PIXI.SCALE_MODES.NEAREST});
                        game.editor.tracingTexture = new PIXI.Sprite(texture);
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
            backendManager.backendLogin();
        })

        emitterManager.init();
        PhysicsParticleEmitter.init();

        PIXICuller.init(this.editor.textures, this.levelCamera);


        SlowmoUI.init();
        this.handleResize();

        if((!userData.tutorialFinished && !backendManager.isLoggedIn() && !MobileController.isMobile()) || forceTutorial){
            this.showInitialTutorial();
        }else{
            this.preloader.classList.add('hide');
            this.preloader.querySelector('.cycling').classList.add('fall');
            delete this.showLevelAfterTutorial;
        }
    }

    this.showInitialTutorial = ()=>{
        const tutorialLevel = {...levelsData.tutorialLevel}
        game.loadPublishedLevelData(tutorialLevel, ()=>{}).then(() => {
            this.tutorialMode = true;
            ui.showSkipTutorialButton();
            ui.playLevelFromMainMenu();
            this.preloader.querySelector('.cycling').classList.add('fall');
            ui.hideLevelBanner();
        }).catch(error => {
            // skip tutorial
            this.preloader.classList.add('hide');
        });
    }


    //mouse
    this.onMouseDown = function (e) {

        this.fixTouchEvent(e);

        if (Settings.allowMouseMovement && this.gameState == this.GAMESTATE_EDITOR && this.editor.editorSettingsObject.physicsDebug &&  !this.mouseJoint && this.run) {
            const body = this.getBodyAtMouse();
            if (body) {
                const md = new b2MouseJointDef();
                md.set_bodyA(this.m_groundBody);
                md.set_bodyB(body);
                const targetPosition = new Box2D.b2Vec2(this.editor.mousePosWorld.get_x(), this.editor.mousePosWorld.get_y());

                md.set_target(targetPosition);
                md.set_collideConnected(true);
                md.set_maxForce(300.0 * body.GetMass());

                b2LinearStiffness(md, 5.0, 0.7, this.m_groundBody, body);

                this.mouseJoint = this.editor.CreateJoint(md);

                body.SetAwake(true);

                Box2D.destroy(targetPosition);
                Box2D.destroy(md);
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

        b2DebugDrawManager.resize();
    }

    this.getBodyAtMouse = function () {
        var aabb = new b2AABB();
        aabb.get_lowerBound().Set(this.editor.mousePosWorld.get_x() - 0.001, this.editor.mousePosWorld.get_y() - 0.001);
        aabb.get_upperBound().Set(this.editor.mousePosWorld.get_x() + 0.001, this.editor.mousePosWorld.get_y() + 0.001);
        // Query the world for overlapping shapes.

        this.selectedBody = null;
        this.world.QueryAABB(this.getBodyCB, aabb);
        return this.selectedBody;
    };

    this.getBodyCB = new JSQueryCallback();
	this.getBodyCB.ReportFixture = function (fixturePtr) {
        const fixture = Box2D.wrapPointer( fixturePtr, Box2D.b2Fixture );
        if (fixture.GetBody().GetType() != b2Body.b2_staticBody && !fixture.GetBody().isPhysicsCamera) {
            if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), self.editor.mousePosWorld)) {
                self.selectedBody = fixture.GetBody();
                return false;
            }
        }
        return true;
    }


    this.inputUpdate = function () {
        if (this.gameState != this.GAMESTATE_MENU && (this.character && this.character.alive) && !this.pause && !this.levelWon) {
            if (this.vehicle && !this.vehicle.destroyed && this.character.attachedToVehicle) {

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

            } else if (this.character && !this.character.destroyed && !this.character.attachedToVehicle) {
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
                    this.testWorld(true);
                }
            }
        }

        if (e.keyCode == Key.SPACE || e.keyCode == Key.R) { //space
            if (this.gameOver && this.run) {
                this.resetWorld(true);
            }
        }

        if(this.gameState == this.GAMESTATE_NORMALPLAY){
            if(e.keyCode == Key.R && e.shiftKey){
                this.resetWorld(false);
            }else if((e.keyCode == Key.P || e.keyCode == Key.R || e.keyCode == Key.ESCAPE || e.keyCode == Key.TAB)){
                if(!this.pause){
                     this.pauseGame();
                } else{
                    this.unpauseGame();
                    if(e.keyCode == Key.R){
                        // retry
                        game.resetWorld(true);
                    }
                }
            }
        }

        if((this.editor.editing && !this.run) && ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.keyCode == 86 )) { // v
            return;
        }

        Key.onKeydown(e);
        if (this.editor.editing && !this.run) this.editor.onKeyDown(e);
        if(!this.gameState === this.GAMESTATE_MENU) e.preventDefault();
    }
    this.onKeyUp = function (e) {
        if(document.activeElement != document.body  && document.activeElement != this.canvas) return;
        this.editor.onKeyUp(e);

        if ((e.keyCode == 87 || e.keyCode == 83) && this.run) {
            this.vehicle.stopAccelerate();
        }
        Key.onKeyUp(e);
        e.preventDefault();
    }
    this.openMainMenu = function (levelData) {
        //if(this.run) this.stopWorld();

        this.initLevel(levelsData.mainMenuLevel);
        this.editor.ui.hide();
        ui.show();
        ui.showMainMenu();
        ui.hideGameOverMenu();
        this.gameState = this.GAMESTATE_MENU;
        this.interactive = false;
        this.editor.editing = false;
        this.stopAutoSave();

        if(levelData){
            ui.showLevelBanner(levelData);
        }

        const userdata = SaveManager.getLocalUserdata();

        if(!userdata.discordShown){
            if(userdata.levelsPlayed >=3 || userdata.levelsPublished){
                ui.showDiscordJoin();
            }
        }

        this.triggerDebugDraw.debounceRedraw();
        GameTimer.show(false);

        history.replaceState({}, 'JollyWorld', '/');
    }

    this.runWorld = function () {
        this.editor.runWorld();
        this.run = true;
        this.findPlayableCharacter();
    }
    this.playWorld = function (firstEntry) {
        ReplayManager.startRecording();

        this.movementBuffer = [];
        MobileController.openFullscreen();
        MobileController.showVehicleControls();
        this.runWorld();
        this.gameState = this.GAMESTATE_NORMALPLAY;
        if(firstEntry){
            this.levelStartTime = performance.now();
            this.gameFrame = 0;
            MidiPlayer.reset();
            window.SVGCache[1]();

            const userData = SaveManager.getLocalUserdata();
            userData.levelsPlayed++;
            SaveManager.updateLocalUserData(userData);

        }
        PokiSDK.gameplayStart();
        MobileController.show();
        ui.showSmallLogo();
        this.playLevelMidi();
        GameTimer.show(true);
    }

    this.testWorld = function (firstEntry) {
        this.movementBuffer = [];
        this.editor.testWorld();
        this.run = true;
        this.findPlayableCharacter();
        this.stopAutoSave();
        this.levelStartTime = performance.now();
        this.gameFrame = 0;
        MobileController.show();
        if(firstEntry){
            MidiPlayer.reset();
        }
        this.playLevelMidi();
        this.triggerDebugDraw.debounceRedraw();
        GameTimer.show(true);
    }
    this.playLevelMidi = function (){
        const userdata = SaveManager.getLocalUserdata();
        if(this.editor.editorSettingsObject.song && editor.editorSettingsObject.autoPlayMidi && userdata.musicOn){
            MidiPlayer.play();
        }
    }
    this.stopTestingWorld = function () {
        this.stopWorld();
        ui.hideWinScreen();
        var worldJSON = JSON.parse(this.editor.worldJSON);
        this.editor.buildJSON(worldJSON);
        this.doAutoSave();
        GameTimer.show(false);
    }
    this.resetWorld = function (doCheckpoint) {
        game.preloader.classList.remove('hide');
        setTimeout(()=>{
            const checkPointData = this.checkPointData;
            this.resetGame();

            if(doCheckpoint && this.editor.editorSettingsObject.song && !this.editor.editorSettingsObject.resetMidiOnRetry){
                MidiPlayer.pause();
            }else{
                MidiPlayer.stop();
            }

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
                    const position = b2CloneVec2(hatBody.GetPosition());
                    position.set_x(position.get_x() + positionDiff.x / Settings.PTM);
                    position.set_y(position.get_y() + positionDiff.y / Settings.PTM);

                    hatBody.SetTransform(position, hatBody.GetAngle());
                    Box2D.destroy(position);
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
                ui.hideWinScreen();
                ui.hideGameOverMenu();

                game.preloader.classList.add('hide');

                if(doCheckpoint && checkPointData){
                    this.levelStartTime = performance.now() - checkPointData.time;
                    this.gameFrame = checkPointData.frame;
                }else{
                    this.levelStartTime = performance.now();
                    this.gameFrame = 0;
                }

                window.SVGCache[1](doCheckpoint);

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
        MidiPlayer.stop();
        ReplayManager.stopRecording();
        PokiSDK.gameplayStop();
    }
    this.openEditor = async function () {
        this.gameState = this.GAMESTATE_EDITOR;

        this.stopWorld();

        let levelData;
        try{
            levelData = await SaveManager.getTempEditorWorld();
        }catch(err){
            // error
            levelData = null;
        }
        if(!levelData){
            levelData = levelsData.editorLevel();
            levelData.id = nanoid();
            levelData.creationDate = Date.now();
        }

        this.initLevel(levelData);
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
        this.editor.worldJSON = data.json;
        this.editor.ui.setLevelSpecifics();
        this.editor.buildJSON(data.json);
        if(this.editor.editorSettingsObject.song) MidiPlayer.startLoad(this.editor.editorSettingsObject.song);

        if(backendManager.isLoggedIn() && backendManager.userData && data.id){
            window.SVGCache[0](backendManager.userData.id, data.id, game.selectedCharacter)
        }
    }
    this.pauseGame = function(){
        if(this.gameOver || this.levelWon || this.tutorialMode) return;
        this.pause = true;
        this.run = false;
        ui.showPauseMenu();
        AudioManager.stopAllSounds();
        MobileController.hide();
        PokiSDK.gameplayStop();
    }
    this.unpauseGame = function(){
        this.pause = false;
        this.run = true;
        ui.hidePauseMenu();
        MobileController.show();
        PokiSDK.gameplayStart();
    }
    this.resetGame = function(){
        this.levelWon = false;
        this.gameOver = false;
        this.checkPointData = null;
    }
    
    this.autoSaveTimeOutID;
    this.doAutoSave = function () {
        let self = this;
        this.stopAutoSave();
        this.autoSaveTimeOutID = setTimeout(() => {
            if(!self.editor.lockSaving && !self.IS_ERROR){
                self.currentLevelData.json = game.editor.worldJSON;
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
            backendManager.publishLevelData(game.currentLevelData).then(levelData => {
                resolve(levelData);
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
    this.gameCheckpoint = function (object) {
        if(!this.checkPointData || ( Math.abs(this.checkPointData.x - object.GetPosition().x) > 1 || Math.abs(this.checkPointData.y - object.GetPosition().y) > 1)){
            const confettiPosition = b2CloneVec2(object.GetPosition());
            const confettiOffset = 3.0;
            const offsetAngle = object.GetAngle() - Settings.pihalve;

            confettiPosition.set_x(confettiPosition.get_x() + confettiOffset * Math.cos(offsetAngle));
            confettiPosition.set_y(confettiPosition.get_y() + confettiOffset * Math.sin(offsetAngle));

            emitterManager.playOnceEmitter("confetti", object, confettiPosition, 0, ['#27cdcb', '#333333']);
		    AudioManager.playSFX('checkpoint', 0.2, 1.0 + 0.4 * Math.random()-0.2, object.GetPosition());

            this.checkPointData = {
                x:object.GetPosition().x,
                y:object.GetPosition().y,
                rotation:object.GetAngle(),
                object,
                flipped:this.character.flipped,
                time: performance.now() - this.levelStartTime,
                frame: this.gameFrame,
                // save checkpoint time
            }

            Box2D.destroy(confettiPosition);

            window.SVGCache[3]();
        }
    }
    this.gameWin = async function () {
        if (!this.gameOver && !this.levelWon) {
            this.levelWon = true;
            // GAME STATE NORMAL
            if(this.gameState == this.GAMESTATE_NORMALPLAY){
                await backendManager.submitTime(game.currentLevelData.id);
            }

            let d;
            if(window.wqhjfu){
               d = timeFormat(window.wqhjfu);
            }else{
               d = timeFormat(this.gameFrame * (1/60) * 1000);
            }

            const s = d.hh !== '00' ? `${d.hh}:${d.mm}:${d.ss}.` : `${d.mm}:${d.ss}.`;
            if(this.gameState == this.GAMESTATE_EDITOR){
                ui.show();
                ui.showWinScreen(s, d.ms);
            }else if(this.gameState == this.GAMESTATE_NORMALPLAY){;
                ui.showWinScreen(s, d.ms);
            }
            this.editor.ui.showConfetti();
            MobileController.hide();
            GameTimer.show(false);

        }
    }
    this.gameLose = function () {
        if (!this.gameOver && !this.levelWon && (this.gameState === this.GAMESTATE_NORMALPLAY || this.gameState === this.GAMESTATE_EDITOR)) {
            const d = timeFormat(this.gameFrame * (1/60) * 1000);
            const s = d.hh !== '00' ? `${d.hh}:${d.mm}:${d.ss}.` : `${d.mm}:${d.ss}.`;
            ui.show();
            ui.showGameOver(s, d.ms);
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

            // fetch(`${Settings.STATIC}/6e785dcebe185763a81fdb29f677dd59.json`, body)
            fetch(`${Settings.STATIC}/${levelData.level_md5}.json`, body)
            .then(response => response.json())
            .then(data => {
                this.currentLevelData.json = JSONStringify(data);
                this.currentLevelData.saved = true;
                this.initLevel(this.currentLevelData);
                SaveManager.saveTempEditorWorld(this.currentLevelData);
                return resolve();
            }).catch((err)=>{
                throw err;
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
                        PIXICuller.disableCulling(body.mySprite);
                    });
                    break;
                }
            }
        }
    }
    this.movementBufferSize = 60;
    this.movementBuffer = [];
    this.gameCamera = function (instant) {
        const panEase = !instant ? this.editor.editorSettingsObject.cameraEase : 1.0;
        const zoomEase = !instant ? this.editor.editorSettingsObject.cameraEase : 1.0;
        const camera = this.editor.cameraHolder;

        const currentZoom = camera.scale.x;
        const targetZoom = Settings.aspectZoom * this.editor.editorSettingsObject.cameraZoom;

        let cameraTargetPosition;
        if(this.cameraFocusObject && !this.cameraFocusObject.destroyed){
            cameraTargetPosition = this.editor.getPIXIPointFromWorldPoint(this.cameraFocusObject.GetPosition());
            this.lastKnownCameraPoint = {x:cameraTargetPosition.x, y:cameraTargetPosition.y};
        }else if(this.lastKnownCameraPoint){
            cameraTargetPosition = {x:this.lastKnownCameraPoint.x, y:this.lastKnownCameraPoint.y};
        }

        if(!cameraTargetPosition) return;

        this.editor.camera.setZoom(cameraTargetPosition, currentZoom + (targetZoom - currentZoom) * zoomEase);

        cameraTargetPosition.x -= window.innerWidth / 2.0 / camera.scale.x;
        cameraTargetPosition.y -= window.innerHeight / 2.0 / camera.scale.y;
        cameraTargetPosition.x *= camera.scale.x;
        cameraTargetPosition.y *= camera.scale.y;

        let offsetX = 0;
        let offsetY = 0;
        if(this.cameraFocusObject){
            this.movementBuffer.push(b2CloneVec2(this.cameraFocusObject.GetLinearVelocity()));
        }else{
            this.movementBuffer.push(new Box2D.b2Vec2(0,0));
        }
        if(this.movementBuffer.length > this.movementBufferSize){
             Box2D.destroy(this.movementBuffer.shift());
        }

        if(this.movementBuffer.length){
            for(let i = 0; i<this.movementBuffer.length; i++){
                offsetX += this.movementBuffer[i].get_x();
                offsetY += this.movementBuffer[i].get_y();
            }
            offsetX /= this.movementBufferSize;
            offsetY /= this.movementBufferSize;
        }

        const speedBuffer = 20 * (1 - this.editor.editorSettingsObject.cameraEase - 0.1 / 0.9);
        const movementBufferScale = speedBuffer * camera.scale.x;

        cameraTargetPosition.x += offsetX * movementBufferScale;
        cameraTargetPosition.y += offsetY * movementBufferScale;

        const movX = (-cameraTargetPosition.x - camera.x) * panEase;
        const movY = (-cameraTargetPosition.y - camera.y) * panEase;

        camera.x += movX;
        camera.y += movY;

        window.SVGCache[4]();

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
    this.gameContactListener = new JSContactListener();
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

    this.gameContactListener.PreSolve = function (contact) {
        const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
        let body;
        let otherBody;

        if(!bodies[0].mySprite || !bodies[1].mySprite) return;

        for (let i = 0; i < bodies.length; i++) {
            body = bodies[i];
            otherBody = i == 0 ? bodies[1] : bodies[0];
            if(body.mySprite.data.prefabInstanceName && body.mySprite.data.prefabInstanceName != otherBody.mySprite.data.prefabInstanceName){
                body.oldBounceManifest = b2CloneVec2(body.GetLinearVelocity());
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

                    const velocityBoostX = (body.GetLinearVelocity().get_x() - body.oldBounceManifest.x);
                    const velocityBoostY = (body.GetLinearVelocity().get_y() - body.oldBounceManifest.y);

                    if(Math.sqrt(velocityBoostX*velocityBoostX + velocityBoostY * velocityBoostY) > 5){
                        for (let jointEdge = body.GetJointList(); getPointer(jointEdge) !== getPointer(NULL); jointEdge = jointEdge.get_next()) {
                            const joint = jointEdge.joint;
                            const connectedBody = joint.GetBodyA() === body ? joint.GetBodyB() : joint.GetBodyA();
                            const velocity = connectedBody.GetLinearVelocity();
                            if(Math.abs(velocity.x-body.GetLinearVelocity().get_x()) > Math.abs(velocityBoostX)/2) velocity.x += velocityBoostX*Settings.prefabBounceLimiter;
                            if(Math.abs(velocity.y-body.GetLinearVelocity().get_y()) > Math.abs(velocityBoostY)/2) velocity.y += velocityBoostY*Settings.prefabBounceLimiter;

                            for (let innerJointEdge = connectedBody.GetJointList(); getPointer(innerJointEdge) !== getPointer(NULL); innerJointEdge = innerJointEdge.get_next()) {
                                const innerConnectedBody = innerJointEdge.joint.GetBodyA() === connectedBody ? innerJointEdge.joint.GetBodyB() : innerJointEdge.joint.GetBodyA();
                                if(innerConnectedBody != body){
                                    const innerVelocity = innerConnectedBody.GetLinearVelocity();
                                    if(Math.abs(innerVelocity.x-body.GetLinearVelocity().get_x()) > Math.abs(velocityBoostX)/2) innerVelocity.x += velocityBoostX*Settings.prefabBounceLimiter;
                                    if(Math.abs(innerVelocity.y-body.GetLinearVelocity().get_y()) > Math.abs(velocityBoostY)/2) innerVelocity.y += velocityBoostY*Settings.prefabBounceLimiter;
                                }
                            }
                        }

                    }
                    Box2D.destroy(body.oldBounceManifest);
                    delete body.oldBounceManifest;
                }
            }

            let force = 0;
            for (let j = 0; j < impulse.get_count(); j++){
                if (impulse.get_normalImpulses(j) > force){
                    force = impulse.get_normalImpulses(j);
                }
            }

            BodyBreaker.checkBodyBreak(body, force);
            BodyBreaker.checkBodyBreak(otherBody, force);

            if ((body.isFlesh && !body.snapped) && (bodies[0].mySprite.data.prefabID != bodies[1].mySprite.data.prefabID || bodies[0].mySprite.data.prefabID == undefined)) {
                if(otherBody.instaKill){
                    const bodyClass = self.editor.retrieveSubClassFromBody(body);
                    if(bodyClass && bodyClass.dealDamage){
                        bodyClass.dealDamage(10000);
                    }
                }else if(!otherBody.isVehiclePart && !otherBody.noImpactDamage) {
 

                    const bodyA = contact.GetFixtureA().GetBody();
                    const bodyB = contact.GetFixtureB().GetBody();

                    const velocityA = contact.GetFixtureA().GetBody().GetLinearVelocity().Length();
                    const velocityB = contact.GetFixtureB().GetBody().GetLinearVelocity().Length();
                    let impactAngle = (velocityA > velocityB) ? Math.atan2(contact.GetFixtureA().GetBody().GetLinearVelocity().get_y(), contact.GetFixtureA().GetBody().GetLinearVelocity().get_x()) : Math.atan2(contact.GetFixtureB().GetBody().GetLinearVelocity().get_y(), contact.GetFixtureB().GetBody().GetLinearVelocity().get_x());
                    impactAngle *= game.editor.RAD2DEG + 180;
                    const velocitySum = velocityA + velocityB;

                    let allowSound = true;
                    if(bodyA.recentlyImpactedBodies && bodyA.recentlyImpactedBodies.includes(bodyB)) allowSound = false;
                    if(bodyB.recentlyImpactedBodies && bodyB.recentlyImpactedBodies.includes(bodyA)) allowSound = false;

                    const skipBecauseToLight = contact.GetFixtureA().GetDensity() === 0.001 || contact.GetFixtureB().GetDensity() === 0.001;

                    if (velocitySum > 10.0 && !skipBecauseToLight && (!body.decalTimeout || performance.now() > body.decalTimeout)) {
                        body.decalTimeout = performance.now() + Settings.decalTimeout
                        const worldManifold = new Box2D.b2WorldManifold();
                        contact.GetWorldManifold(worldManifold);
                        const worldCollisionPoint = worldManifold.get_points(0);

                        const slidingDecalSlider = 50;
                        const goreSize = Math.min(2, velocitySum/slidingDecalSlider);
                        self.editor.queueDecalToBody(body, worldCollisionPoint, "Decal.png", true, goreSize);

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
                const bodyA = contact.GetFixtureA().GetBody();
                const bodyB = contact.GetFixtureB().GetBody();

                const velocityA = bodyA.GetLinearVelocity().Length();
                const velocityB = bodyB.GetLinearVelocity().Length();
                // let impactAngle = (velocityA > velocityB) ? Math.atan2(bodyA.GetLinearVelocity().get_y(), bodyA.GetLinearVelocity().get_x()) : Math.atan2(bodyB.GetLinearVelocity().get_y(), bodyB.GetLinearVelocity().get_x());
                // impactAngle *= game.editor.RAD2DEG + 180;

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
    this.gameRender = (newtime) => {
        if (!then) then = window.performance.now();
        requestAnimationFrame(self.gameRender);
        now = newtime;
        const elapsed = now - then;
        if (elapsed > Settings.timeStep) {
            then = now - (elapsed % Settings.timeStep);
            self.gameUpdate();
        }
    }

    this.gameUpdate = function () {

        this.stats.begin();

        if (Settings.allowMouseMovement && this.mouseJoint) {
            if (Key.isDown(Key.MOUSE)) {
                this.mouseJoint.SetTarget(new b2Vec2(this.editor.mousePosWorld.get_x(), this.editor.mousePosWorld.get_y()));
            } else {
                this.editor.DestroyJoint(this.mouseJoint);
                this.mouseJoint = null;
            }
        }


        this.stats.begin('physics', '#ecbc4d');
        if (this.run) {
            ReplayManager.update();

            this.inputUpdate();
            this.world.Step(Settings.physicsTimeStep * game.editor.editorSettingsObject.gameSpeed, 4, 3);
            this.gameFrame++;
            this.world.ClearForces();
            this.gameCamera();
            PhysicsParticleEmitter.update();
            GameTimer.update();
        }
        this.stats.end('physics');
        emitterManager.update();

        EffectsComposer.update();
        SlowmoUI.update();
        this.editor.run();
        AudioManager.update();

        this.newDebugGraphics.clear();
        b2DebugDrawManager.clear();
        if ((this.gameState == this.GAMESTATE_EDITOR || Settings.admin) && this.editor.editorSettingsObject.physicsDebug) {
            b2DebugDrawManager.update(this.editor.cameraHolder.x / Settings.PTM, this.editor.cameraHolder.y / Settings.PTM);
        }

        // move our trigger debug draw
        this.triggerDebugDraw.x = this.editor.cameraHolder.x;
        this.triggerDebugDraw.y = this.editor.cameraHolder.y;
        this.triggerDebugDraw.scale.x = this.editor.cameraHolder.scale.x;
        this.triggerDebugDraw.scale.y = this.editor.cameraHolder.scale.y;

        this.stats.begin('render', '#4399fa');
        if(!Settings.FPSLimiter || (Settings.FPSLimiter && !Settings.FPSFrameLimit)) this.app.render();
        Settings.FPSFrameLimit = !Settings.FPSFrameLimit;
        this.stats.end('render');

        if(this.needScreenshot) this.screenShotData = game.app.renderer.plugins.extract.canvas();
        PIXICuller.update();
        Key.update();

        this.stats.end();
    };

    this.voteLevel = function(levelData, vote){

        if(!backendManager.isLoggedIn()){
            game.ui.showLoginPrompt();
            return Promise.reject();
        }

        // have i even played this level?  //return Promise.reject()
        return backendManager.voteLevel(levelData.id, vote);
    }

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

    this.toggleMute = function(){
        const userData = SaveManager.getLocalUserdata();
        userData.sfxOn = !userData.sfxOn;
        SaveManager.updateLocalUserData(userData);

        Settings.sfxOn = userData.sfxOn;

        if(!Settings.sfxOn){
            AudioManager.stopAllSounds();
        }
    }


    this.GAMESTATE_MENU = 0;
    this.GAMESTATE_EDITOR = 1;
    this.GAMESTATE_NORMALPLAY = 2;
    this.GAMESTATE_LOADINGDATA = 3;
}
export var game = new Game();
setTimeout(() => {
    game.gameInit();
}, 1); // guarantee all context is loaded and fix webpack order issue
