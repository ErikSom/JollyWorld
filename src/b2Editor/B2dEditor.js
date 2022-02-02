import * as PrefabManager from "../prefabs/PrefabManager";
import * as drawing from "./utils/drawing";
import * as scrollBars from "./utils/scrollBars";
import * as ui from "./utils/ui";
import * as verticeOptimize from "./utils/verticeOptimize";
import * as trigger from "./objects/trigger";
import * as dat from "../../libs/dat.gui";
import * as SaveManager from "../utils/SaveManager";
import * as FPSManager from '../utils/FPSManager';
import * as jointTriggerLayer from './utils/jointTriggerLayer'

import * as DS from './utils/DecalSystem';
import * as camera from './utils/camera';
import * as PIXI from 'pixi.js';
import { MaxRectsPacker } from 'maxrects-packer'

import easing from './utils/easing';

import {
	lineIntersect,
	flatten,
	isConvex,
	linePointDistance,
	distanceFromCurve,
	nearestPointOnCurve,
	angleDifference
} from './utils/extramath';

import {
	editorSettings
} from './utils/editorSettings';

import {
	game
} from "../Game";
import {
	Settings
} from "../Settings";
import { hexToNumberHex, JSONStringify } from "./utils/formatString";
import LZString from 'lz-string'
import { copyStringToClipboard } from "./utils/copyToClipboard";
import { disableCulling } from '../utils/PIXICuller';
import { hashName } from "../AssetList";

import { attachGraphicsAPIMixin } from './pixiHack'
import { TiledMesh } from './classes/TiledMesh';
import  * as physicsCullCamera from './utils/physicsCullCamera';
import nanoid from "nanoid";
import { findObjectWithCopyHash } from "./utils/finder";
import { isBodyGroup, setBodyGroupOpacity, startEditingGroup, stopEditingGroup } from "./utils/groupEditing";
import { applyColorMatrix } from "./utils/colorMatrixParser";
import { MidiPlayer } from "../utils/MidiPlayer";
import { b2CloneVec2, b2LinearStiffness, b2MulVec2 } from "../../libs/debugdraw";
import * as BodyBreakable from './utils/bodyBreaker';
import { stopCustomBehaviour } from "../prefabs/misc/CustomEditorBehavior";
import {getDecalSystem, setDecalSystem} from "./utils/DecalSystem";
import { updateDisplayAds } from "../utils/AdManager";

const { getPointer, NULL, pointsToVec2Array, destroy, JSQueryCallback, getCache, getClass } = Box2D; // emscriptem specific
const {b2Vec2, b2AABB, b2BodyDef, b2FixtureDef, b2PolygonShape, b2CircleShape} = Box2D;

const PIXIHeaven = self.PIXI.heaven;

const vec1 = new b2Vec2();

const _B2dEditor = function () {

	this.initialPTM;
	this.PTM;
	this.world;
	this.debugGraphics = null;
	this.tracingTexture = null;
	this.textures = null;
	this.currentTime = performance.now();
	this.deltaTime;
	this.contactCallBackListener;


	this.activePrefabs = {};
	this.parallaxObject = [];
	this.animationGroups = [];
	this.decalQueue = [];
	this.prefabCounter = 0; //to ensure uniquenesss

	this.uniqueCollisions = -3;
	this.uniqueCollisionPrefabs = {};

	this.container = null;
	this.selectedTool = -1;
	this.breakPrefabs = false;

	this.selectedPhysicsBodies = [];
	this.selectedTextures = [];
	this.selectedPrefabs = {};

	this.selectedBoundingBox;
	this.startSelectionPoint;

	this.canvas;
	this.mousePosPixel;
	this.mouseDocumentPosPixel;
	this.mouseDocumentPosPixel;
	this.mousePosWorld;
	this.oldMousePosWorld;

	this.assetLists = {};
	this.tileLists = {}; // future this can be an opject with keys like bricks/green/etc.

	this.customGUIContainer = document.getElementById('custom-gui');

	this.editorIcons = [];
	this.triggerObjects = [];

	this.worldJSON;
	this.lastValidWorldJSON;
	this.lockSaving = false;

	this.copiedJSON = '';
	this.copiedCenterPosition = new Box2D.b2Vec2(0, 0);
	this.ui = ui;

	this.mouseDown = false;
	this.middleMouseDown = false;
	this.doubleClickTime = 0;
	this.shiftDown = false;
	this.spaceDown = false;
	this.spaceCameraDrag = false;
	this.spaceDownTime = 0;
	this.doubleSpaceTime = 0;
	this.altDown = false;
	this.editing = true;
	this.groupEditing = false;
	this.groupEditingObject = null;
	this.groupMinChildIndex = -1;
	this.groupEditingBlackOverlay;
	this.deepClickDetection = null;
	this.deepClickMinimumLayer = Number.POSITIVE_INFINITY;
	this.verticeEditingCallback = null;

	this.lookupGroups = {};

	this.undoList = [];
	this.undoIndex = 0;

	this.levelGradientsNames = [];
	this.levelGradients = [];
	this.levelGradientBaseTextures = [];
	this.levelColors = []; // every time you select an object it will push its colors to this stack, max stack size e.g. 10, need to add this to dat.gui

	this.editorSettings = editorSettings;
	this.camera = camera;
	this.cameraSize = {
		w: 400,
		h: 300
	};
	this.cameraShotData = null;
	this.playerHistory = [];
	this.fileUploadInput = null;

	this.selectingTriggerTarget = false;

	this.customPrefabMouseDown = null;
	this.customPrefabMouseMove = null;
	this.customDebugDraw = null;

	this.cameraHolder;
	this.physicsCamera;
	this.bulletBodyCount = 0;

	this.persistentTriggers = [];

	//emscripten specific
	this.bodiesDestroyedThisFrame = [];

	this.decalSystems = DS;

	Object.defineProperty(this, 'cameraHolder', {
		get: () => {
			 if (this.container.camera) {
				return this.container.camera;
			}

			return this.container;
		}
	});

	//COLORS
	this.selectionBoxColor = "0x5294AE";
	this.jointLineColor = "0x888888";

	this.init = function (_root, _container, _world, _PTM) {
		this.root = _root;
		this.container = _container;
		this.world = _world;
		this.initialPTM = _PTM;
		this.PTM = _PTM;
		this.world.SetContactListener(this.B2dEditorContactListener);
		//Texture Draw
		this.textures = new PIXI.Graphics();
		this.activePrefabs = {};
		this.container.addChild(this.textures);

		//Editor Draw
		this.debugGraphics = new PIXI.Graphics();
		this.root.addChild(this.debugGraphics);

		this.mousePosPixel = new b2Vec2(0, 0);
		this.mouseDocumentPosPixel = new b2Vec2(0, 0);
		this.mousePosWorld = new b2Vec2(0, 0);

		this.canvas = document.getElementById("canvas");

		ui.initGui();
		this.selectTool(this.tool_SELECT);
	}

	this.prefabListGuiState = {};
	this.prefabSelectedCategory = '';
	this.blueprintsSelectedCategory = '';
	this.blueprintsSearchQuery = '';
	this.bluePrintData = null;
	this.bluePrintDownloading = false;
	this.downloadBluePrintKeys = ()=>{
		const approved = !window.location.origin.includes('blueprints--') && !window.location.origin.includes('localhost:');
		if(this.bluePrintData !== null) return;
		fetch(`https://warze.org/blueprints/collections?approved=${+approved}`)
		.then(response => response.json())
		.then(categories => {
			this.bluePrintData = {categories, urls:[], page:{}, loadedAllPages:{}};
			categories.forEach((category, i) => {
				const url = `https://warze.org/blueprints/request?nodata=1&approved=${approved ? 1 : 2}&collection=${category}&page=`;
				this.bluePrintData.urls.push(url);
				this.bluePrintData.page[category] = 0;
				// PrefabManager.prefabLibrary.libraryDictionary[PrefabManager.LIBRARY_BLUEPRINTS+this.prefabSelectedCategory]
				// PrefabManager.prefabLibrary[PrefabManager.LIBRARY_BLUEPRINTS+obj.prefabName].json
			})
			// this is for search queries
			this.bluePrintData.page[-1] = 0;
			this.refreshPrefablist();
		});
		this.bluePrintData = false;
	}
	
	this.downloadBluePrints = (category, innerFolder, init) => {
		if(this.bluePrintsSearchedQuery && this.bluePrintsSearchedQuery !== category){
			delete this.bluePrintData.page[this.bluePrintsSearchedQuery];
			delete this.bluePrintData.loadedAllPages[this.bluePrintsSearchedQuery];
			delete this.bluePrintsSearchedQuery;

			// consider cleaning up data in PrefabManager.prefabLibrary (its a mess >_< );
		}

		if(init && Array.isArray(PrefabManager.prefabLibrary.libraryDictionary[PrefabManager.LIBRARY_BLUEPRINTS+category])) return;

		if(!this.bluePrintData.page[category]){
			this.bluePrintData.page[category] = 0;
		}

		const page = ++this.bluePrintData.page[category];
		let url;

		const categoryIndex = this.bluePrintData.categories.indexOf(category);
		if(categoryIndex >= 0){
			url = `${this.bluePrintData.urls[categoryIndex]}${page}`;
		} else {
			const approved = !window.location.origin.includes('blueprints--') && !window.location.origin.includes('localhost:');
			url= `https://warze.org/blueprints/request?nodata=1&approved=${approved ? 1 : 2}&search=${category}&page=${page}`;

			this.bluePrintsSearchedQuery = category;
		}

		this.bluePrintDownloading = true;

		fetch(url)
		.then(response => response.json())
		.then(prefabs => {
			this.bluePrintDownloading = false;
			if(!prefabs.length){
				this.bluePrintData.loadedAllPages[category] = true;
				const spinner = innerFolder.querySelector('.spinner');
				if(spinner){
					spinner.innerText = 'No more results..';
				}
				return;
			}

			const categoryTrimmed = category.replace(/\s+/g, '');
			const prefabKeys = [];

			if(page === 1) PrefabManager.prefabLibrary.libraryDictionary[PrefabManager.LIBRARY_BLUEPRINTS+categoryTrimmed] = [];

			prefabs.forEach(prefab => {
				const [id, blueprintName, fetchID] = prefab;

				const trimmedName = blueprintName.replace(/[ -!$%^&*()+|~=`{}\[\]:";'<>?\/]/g, '');
				const prefabKey = `${PrefabManager.LIBRARY_BLUEPRINTS}_${categoryTrimmed}_${trimmedName}`;
				prefabKeys.push(prefabKey);
				PrefabManager.prefabLibrary[prefabKey] = {json:fetchID, class:PrefabManager.basePrefab, img:`https://warze.org/static/jollyworld/blueprints/${id}.png`};
			});

			PrefabManager.prefabLibrary.libraryDictionary[PrefabManager.LIBRARY_BLUEPRINTS+categoryTrimmed].push(...prefabKeys);
			if(this.blueprintsSelectedCategory === category){
				this.refreshPrefablist();
				if(page !== 1){
					const elementContainer = ui.editorGUI.domElement.querySelector('.inner-blueprints-folder');
					const targetIndex = (page-1) * 20 + 2;
					const targetElement = elementContainer.children[targetIndex];
					if(targetElement){
						setTimeout(()=>{
							targetElement.scrollIntoView();
						}, 0);
					}
				}
			}
		});
		const loadingDiv = document.createElement('div');
		loadingDiv.innerText = page === 1 ? 'Loading...' : 'Loading more...';
		loadingDiv.style.marginLeft = '5px';
		loadingDiv.classList.add('spinner');

		innerFolder.appendChild(loadingDiv);

		if(page === 1) PrefabManager.prefabLibrary.libraryDictionary[PrefabManager.LIBRARY_BLUEPRINTS+category] = Settings.DEFAULT_TEXTS.downloading_blueprints;
	}

	this.refreshPrefablist = function(){
		ui.destroyEditorGUI();
		ui.buildEditorGUI();
		this.showPrefabList();
		ui.registerDragWindow(ui.editorGUI);
	}

	this.showPrefabList = function () {
		this.downloadBluePrintKeys();

		let targetFolder = ui.editorGUI.addFolder('Special Objects');
		targetFolder.open();

		const BLUEPRINTS = 'Blueprints';
		const PREFABS = 'Prefabs';

		[PREFABS, BLUEPRINTS].forEach(folderName=>{
			let folder = targetFolder.addFolder(folderName);
			let self = this;
			const prefabPages = folderName === PREFABS ? [...PrefabManager.getLibraryKeys()] : (this.bluePrintData ? [...this.bluePrintData.categories] : [Settings.DEFAULT_TEXTS.downloading_blueprints]);
			prefabPages.unshift('');

			folder.add(self, folderName === PREFABS ? "prefabSelectedCategory" : "blueprintsSelectedCategory", prefabPages).name('choose collection').onChange(function (value) {
				if(value === Settings.DEFAULT_TEXTS.downloading_blueprints) return;

				let folder;
				for (var propt in targetFolder.__folders) {
					folder = targetFolder.__folders[propt];
					self.prefabListGuiState[propt] = folder.closed;
				}
				self.blueprintsSearchQuery = '';
				if(folderName === PREFABS) self.blueprintsSelectedCategory = '';
				if(folderName === BLUEPRINTS) self.prefabSelectedCategory = '';
				self.refreshPrefablist();
			});

			if(folderName === BLUEPRINTS){
				folder.add(self, "blueprintsSearchQuery").name('search blueprints:').onFinishChange(function (value) {
						setTimeout(()=> {
							// prevent crash on clicking next to window
							if(self.blueprintsSelectedCategory !== value && self.selectedTool === self.tool_SPECIALS){
								self.blueprintsSelectedCategory = value;
								self.prefabSelectedCategory = '';
								ui.editorGUI.domElement.scrollTop = 0;
								self.refreshPrefablist();
							}
						}, 0);
				});
			}

			let innerFolder = folder.domElement.querySelector('ul');
			innerFolder.classList.add(`inner-${folderName.toLowerCase()}-folder`)

			let targetLibrary;

			if(folderName === PREFABS) targetLibrary = PrefabManager.prefabLibrary.libraryDictionary[this.prefabSelectedCategory];
			else if(folderName === BLUEPRINTS) targetLibrary = PrefabManager.prefabLibrary.libraryDictionary[PrefabManager.LIBRARY_BLUEPRINTS+(this.blueprintsSelectedCategory.replace(/\s+/g, ''))];

			if((folderName === PREFABS && this.prefabSelectedCategory == '') || folderName === BLUEPRINTS && this.blueprintsSelectedCategory == ''){
				// do nothing
			}else if(folderName === BLUEPRINTS && (!targetLibrary || targetLibrary === Settings.DEFAULT_TEXTS.downloading_blueprints)){
				// download blueprints for category
				this.downloadBluePrints(this.blueprintsSelectedCategory, innerFolder, true);
			}else{

				this.prefabImagesLoading = targetLibrary.length;
				for (let i = 0; i < targetLibrary.length; i++) {
					const prefabName = targetLibrary[i];

					let image;
					if(PrefabManager.prefabLibrary[prefabName].img){
						image = new Image();
						image.src = PrefabManager.prefabLibrary[prefabName].img;
					}else{
						image = this.renderPrefabToImage(prefabName);
					}
					const guiFunction = document.createElement('li');
					guiFunction.innerHTML = '<div><img src=""></img><div class="c"><div class="button"></div></div></div>';
					guiFunction.classList.add('cr', 'function');

					const guiFunctionImg = guiFunction.querySelector('img');
					guiFunctionImg.src = image.src;
					guiFunctionImg.setAttribute('title', prefabName);

					const maxImageHeight = 90;
					const maxImageWidth = 174;

					let functionHeight = 100;

					guiFunctionImg.onload = () => {
						this.prefabImagesLoading--;
						if(guiFunctionImg.width>guiFunctionImg.height){
							let targetWidth = guiFunctionImg.width;
							if(guiFunctionImg.width>maxImageWidth){
								guiFunctionImg.style.width = `${maxImageWidth}px`;
								targetWidth = maxImageWidth;
							}
							const scaleFactor = targetWidth/guiFunctionImg.width;
							functionHeight = guiFunctionImg.height*scaleFactor+10;
						}else{
							if(guiFunctionImg.height>maxImageHeight){
								guiFunctionImg.style.height = `${maxImageHeight}px`;
							}else{
								functionHeight = guiFunctionImg.height+10;
							}
						}
						guiFunction.style.height = `${functionHeight}px`;
					}

					innerFolder.appendChild(guiFunction);
					guiFunctionImg.style.display = 'block';
					guiFunctionImg.style.margin = 'auto';
					guiFunction.setAttribute('prefabName', prefabName);

					const clickFunction = (e) =>{
						const camera = B2dEditor.container.camera || B2dEditor.container;
						const guiAsset = guiFunction.parentNode.parentNode.parentNode.parentNode;
						const rect = guiAsset.getBoundingClientRect();
						const domx = Math.max(e.pageX, rect.right + 200);
						const domy = e.pageY;

						const x = domx / camera.scale.x - camera.x / camera.scale.x;
						const y = domy / camera.scale.y - camera.y / camera.scale.x;


						this.selectTool(this.tool_SELECT);

						self.selectedPhysicsBodies = [];
						self.selectedTextures = [];
						self.selectedPrefabs = {};

						if(folderName === 'Prefabs'){
							const data = new self.prefabObject;
							data.x = x;
							data.y = y;
							data.prefabName = guiFunction.getAttribute('prefabName');
							data.settings = JSON.parse(JSON.stringify(PrefabManager.prefabLibrary[data.prefabName].class.settings));
							self.buildPrefabFromObj(data);

							self.selectedPrefabs[data.key] = true;

						}else if(folderName === 'Blueprints'){
							const fetchID = PrefabManager.prefabLibrary[prefabName].json;

							fetch(`https://warze.org/blueprints/getdata?id=${fetchID}`).then(response => response.text()).then(blueprintData => {

								// exit if we are doing weird stuff during loading
								if (game.gameState !== game.GAMESTATE_EDITOR || game.run || this.selectedTool !== this.tool_SELECT) return;

								const jsonString = LZString.decompressFromEncodedURIComponent(blueprintData);
								console.log("*** DOWNLOADED JSON:", jsonString)

								const prefabLookupObject = this.buildJSON(JSON.parse(jsonString));
								const buildPrefabs = [];
								let allObjects = [].concat(prefabLookupObject._bodies, prefabLookupObject._textures, prefabLookupObject._joints)
								for(let j = 0; j<allObjects.length; j++){
									const object = allObjects[j];

									const prefabInstanceName = object.mySprite ? object.mySprite.data.prefabInstanceName : object.data.prefabInstanceName;
									if(prefabInstanceName){
										const targetPrefab = this.activePrefabs[prefabInstanceName];
										if(!buildPrefabs.includes(targetPrefab)){
											buildPrefabs.push(targetPrefab);
											targetPrefab.x += x;
											targetPrefab.y += y;
										}
										self.selectedPrefabs[prefabInstanceName] = true;

									}else if(object.mySprite){
										self.selectedPhysicsBodies.push(object);
									} else{
										self.selectedTextures.push(object);
									}
								}
								this.applyToObjects(this.TRANSFORM_MOVE, {x, y}, allObjects);
							})
						}

						this.updateSelection();
					}
					guiFunction.addEventListener('click', clickFunction);
					guiFunction.addEventListener('dragend', clickFunction);
				}

				if(this.blueprintsSelectedCategory && targetLibrary.length % 20 === 0 && !this.bluePrintData.loadedAllPages[this.blueprintsSelectedCategory]){
					// add scroll detection
					ui.editorGUI.domElement.addEventListener('scroll', ()=>{
						if(!this.bluePrintDownloading && !this.prefabImagesLoading){
							if (ui.editorGUI.domElement.offsetHeight + ui.editorGUI.domElement.scrollTop >= ui.editorGUI.domElement.scrollHeight) {
								this.downloadBluePrints(this.blueprintsSelectedCategory, innerFolder);
							}
						}
					})
				}
			}
		});
		for (let propt in targetFolder.__folders) {
			let folder = targetFolder.__folders[propt];
			folder.closed = self.prefabListGuiState[propt] === undefined ? false : self.prefabListGuiState[propt];
		}
	}
	this.openTextEditor = function () {
		const self = this;
		if (!self.selectedTextures[0].textSprite) return;
		const startValue = self.selectedTextures[0].textSprite.text;
		const callBack = (value) => {
			for (let j = 0; j < self.selectedTextures.length; j++) {
				let textContainer = self.selectedTextures[j];
				if (textContainer.textSprite) {
					textContainer.data.text = value;
					textContainer.textSprite.text = value;
					textContainer.pivot.set(textContainer.textSprite.width / 2, textContainer.textSprite.height / 2);

				}
			}

		}
		ui.showTextEditor(startValue, callBack);
	}

	this.selectTool = function (i) {

		if(this.groupEditing){
			if(!this.allowed_editing_TOOLS.includes(i)) i = this.selectedTool;
		}

		if (game.gameState == game.GAMESTATE_EDITOR) ui.showHelp(i);

		if(this.selectedTool === i) return;
		this.deselectTool(this.selectedTool);
		this.selectedTool = i;

		this.selectedTextures = [];
		this.selectedPhysicsBodies = [];
		this.selectedPrefabs = [];
		this.activeVertices = [];

		const buttons = document.querySelectorAll('.toolgui.button');
		buttons.forEach(button => { button.style.backgroundColor = '' });
		if(buttons[i]) buttons[i].style.backgroundColor = '#4F4F4F';

		ui.destroyEditorGUI();
		ui.buildEditorGUI();

		let targetFolder

		switch (i) {
			case this.tool_SELECT:
				ui.destroyEditorGUI();
				break;
			case this.tool_VERTICEEDITING:
				ui.destroyEditorGUI();

				this.verticeEditingBlackOverlay = new PIXI.Graphics();
				this.verticeEditingBlackOverlay.beginFill(0x000000);
				this.verticeEditingBlackOverlay.drawRect(-editorSettings.worldSize.width/2, -editorSettings.worldSize.height/2, editorSettings.worldSize.width, editorSettings.worldSize.height);
				this.verticeEditingBlackOverlay.alpha = 0.3;
				this.verticeEditingSprite.addChildAt(this.verticeEditingBlackOverlay, 0);
				// this.verticeEditingSprite.parent.addChild(this.verticeEditingBlackOverlay);
				this.verticeEditingSprite.oldIndex = this.verticeEditingSprite.parent.getChildIndex(this.verticeEditingSprite);
				this.verticeEditingSprite.parent.addChild(this.verticeEditingSprite);
				this.lockSaving = true;
				break
			case this.tool_GEOMETRY:
				ui.editorGUI.editData = this.editorGeometryObject;

				targetFolder = ui.editorGUI.addFolder('draw shapes');
				targetFolder.open();

				var shapes = ["Box", "Circle", "Triangle"];
				ui.editorGUI.editData.shape = ui.editorGUI.editData.shape || shapes[0];
				targetFolder.add(ui.editorGUI.editData, "shape", shapes);
				targetFolder.addColor(ui.editorGUI.editData, "colorFill");
				targetFolder.addColor(ui.editorGUI.editData, "colorLine");
				targetFolder.add(ui.editorGUI.editData, "lineWidth", 0.0, 10.0).step(1.0);
				targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1).name("opacity");
				targetFolder.add(ui.editorGUI.editData, "isBody");
				ui.editorGUI.domElement.style.minHeight = '220px';

				break
			case this.tool_POLYDRAWING:
			case this.tool_PEN:
				ui.editorGUI.editData = this.editorGeometryObject;

				if(i === this.tool_POLYDRAWING) targetFolder = ui.editorGUI.addFolder('draw poly shapes');
				if(i === this.tool_PEN) targetFolder = ui.editorGUI.addFolder('draw bezier graphics');
				targetFolder.open();

				targetFolder.addColor(ui.editorGUI.editData, "colorFill");
				targetFolder.addColor(ui.editorGUI.editData, "colorLine");
				targetFolder.add(ui.editorGUI.editData, "lineWidth", 0.0, 10.0).step(1.0);
				targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1).name("opacity");
				if(i === this.tool_POLYDRAWING) targetFolder.add(ui.editorGUI.editData, "isBody");

				ui.editorGUI.domElement.style.minHeight = '200px';

				break
			case this.tool_JOINTS:
				ui.editorGUI.editData = this.editorJointObject;

				targetFolder = ui.editorGUI.addFolder('add joints');
				targetFolder.open();

				this.addJointGUI(this.editorJointObject, targetFolder);

				break
			case this.tool_SPECIALS:
				this.showPrefabList();
				break
			case this.tool_TEXT:
				ui.editorGUI.editData = this.editorTextObject;

				targetFolder = ui.editorGUI.addFolder('add text');
				targetFolder.open();

				targetFolder.addColor(ui.editorGUI.editData, "textColor");
				targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1).name("opacity");
				targetFolder.add(ui.editorGUI.editData, "fontSize", 1, 1000);

				const fonts = Settings.availableFonts;
				ui.editorGUI.editData.fontName = fonts[0];
				targetFolder.add(ui.editorGUI.editData, "fontName", fonts);

				const alignments = ["left", "center", "right"];
				ui.editorGUI.editData.textAlign = alignments[0];
				targetFolder.add(ui.editorGUI.editData, "textAlign", alignments);

				break
			case this.tool_ART:
				ui.editorGUI.editData = this.editorGraphicDrawingObject;

				targetFolder = ui.editorGUI.addFolder('draw graphics');
				targetFolder.open();
				//for (var key in ui.editorGUI.editData) {
				//	if (ui.editorGUI.editData.hasOwnProperty(key)) {
				//TODO:Load from saved data
				//	}
				//}
				targetFolder.addColor(ui.editorGUI.editData, "colorFill");
				targetFolder.addColor(ui.editorGUI.editData, "colorLine");
				var realVal = ui.editorGUI.editData.transparancy;
				ui.editorGUI.editData.transparancy = 0.1;
				targetFolder.add(ui.editorGUI.editData, "lineWidth", 0.0, 10.0).step(1.0);
				ui.editorGUI.editData.transparancy = realVal;

				targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1).name("opacity");
				targetFolder.add(ui.editorGUI.editData, "smoothen");
				ui.editorGUI.domElement.style.minHeight = '200px';

				break
			case this.tool_TRIGGER:
				ui.editorGUI.editData = this.editorTriggerObject;

				targetFolder = ui.editorGUI.addFolder('add triggers');
				targetFolder.open();

				var shapes = ["Circle", "Box"];
				ui.editorGUI.editData.shape = ui.editorGUI.editData.shape || shapes[0];
				targetFolder.add(ui.editorGUI.editData, "shape", shapes).onChange(()=>{
					this.selectedTool = -1;
					this.selectTool(this.tool_TRIGGER);
				});

				game.triggerDebugDraw.debounceRedraw();

				break
			case this.tool_SETTINGS:
				ui.editorGUI.editData = this.editorSettingsObject;

				targetFolder = ui.editorGUI.addFolder('game settings');
				targetFolder.open();

				const onChange = key=> val=>{
					this.editorSettingsObject[key] = val;
				}
				targetFolder.addColor(ui.editorGUI.editData, "backgroundColor").onChange(val=>{
					this.editorSettingsObject.backgroundColor = val;
					game.app.renderer.backgroundColor = hexToNumberHex(val);
				});

				ui.editorGUI.editData.openColorMatrixEditor = () => {
					ui.showColorMatrixEditor(ui.editorGUI.editData.colorMatrix, this.container, colorMatrix=>{
						this.editorSettingsObject.colorMatrix = colorMatrix;
					})
				};
				targetFolder.add(ui.editorGUI.editData, "openColorMatrixEditor").name('edit camera color matrix');


				targetFolder.add(ui.editorGUI.editData, 'gravityX', -20, 20).step(0.1).onChange(onChange('gravityX'));
				targetFolder.add(ui.editorGUI.editData, 'gravityY', -20, 20).step(0.1).onChange(onChange('gravityY'));
				targetFolder.add(ui.editorGUI.editData, 'cameraZoom', 0.1, 2.0).step(0.1).onChange(onChange('cameraZoom'));
				targetFolder.add(ui.editorGUI.editData, 'cameraEase', 0.1, 1.0).step(0.1).onChange(onChange('cameraEase'));
				targetFolder.add(ui.editorGUI.editData, 'gameSpeed', 0.1, 2.0).step(0.1).onChange(onChange('gameSpeed'));


				// Handle MIDI file upload
				if(!this.fileUploadInput){
					this.fileUploadInput = document.createElement('input');
					this.fileUploadInput.setAttribute('type', 'file');
					this.fileUploadInput.style.visibility = 'hidden';
					document.body.appendChild(this.fileUploadInput);
				}

				this.fileUploadInput.setAttribute('accept', '.mid');
				this.fileUploadInput.onchange = event =>{
					const file = event.target.files[0];
					if(!file) return;
					const fileReader = new FileReader();
					fileReader.onload = progressEvent =>  {
						const arrayBuffer = progressEvent.target.result;
						const song = MidiPlayer.serializeMIDI(arrayBuffer, file.name);
						MidiPlayer.startLoad(song);
						this.editorSettingsObject.song = song;
						this.selectedTool = -1;
						this.selectTool(this.tool_SETTINGS);
					};
					fileReader.readAsArrayBuffer(file);
				}

				ui.editorGUI.editData.uploadMidi = ()=>{
					this.fileUploadInput.click();
				}
				targetFolder.add(ui.editorGUI.editData, "uploadMidi").name('upload midi song');
				//
				if(this.editorSettingsObject.song){
					ui.editorGUI.editData.deleteSong = ()=>{
						delete this.editorSettingsObject.song;
						this.selectedTool = -1;
						this.selectTool(this.tool_SETTINGS);
						this.fileUploadInput.value = null;
					}
					targetFolder.add(ui.editorGUI.editData, "deleteSong").name(`remove song ${this.editorSettingsObject.song[0].substr(0, 12)}...mid`);
					targetFolder.add(ui.editorGUI.editData, 'autoPlayMidi').onChange(onChange('autoPlayMidi'));
					targetFolder.add(ui.editorGUI.editData, 'resetMidiOnRetry').onChange(onChange('resetMidiOnRetry'));
				}

				const utilityFolder = ui.editorGUI.addFolder('utilities');
				utilityFolder.open();

				utilityFolder.add(ui.editorGUI.editData, 'physicsDebug').onChange(val=>this.editorSettingsObject.physicsDebug=val);
				utilityFolder.add(ui.editorGUI.editData, 'stats').onChange(val=> {
					editorSettings.stats=val;
					game.stats.show(val);
				});
				utilityFolder.add(ui.editorGUI.editData, 'showPlayerHistory').onChange(onChange('showPlayerHistory'));
				utilityFolder.add(ui.editorGUI.editData, 'showCameraLines').onChange(onChange('showCameraLines'));

				ui.editorGUI.editData.resetHelp = ()=>{
					const userData = SaveManager.getLocalUserdata();
					userData.helpClosed = [];
            		userData.showHelpButton = true;
					SaveManager.updateLocalUserData(userData);
					ui.showHelpButton();
				}
				utilityFolder.add(ui.editorGUI.editData, "resetHelp").name('reset help');

				ui.editorGUI.editData.findPlayer = ()=>{
					this.findPlayer();
				}
				utilityFolder.add(ui.editorGUI.editData, "findPlayer").name('find player');

				if(this.tracingTexture){
					ui.editorGUI.editData.traceTextureScale = this.tracingTexture.scale.x;
					utilityFolder.add(ui.editorGUI.editData, 'traceTextureScale', 0.1, 10.0).step(0.01).onChange(value=>{
						this.tracingTexture.scale.x = this.tracingTexture.scale.y = value;
					});
					ui.editorGUI.editData.destroyTraceTexture = ()=>{
						this.tracingTexture.destroy({texture:true, baseTexture:true});
						this.tracingTexture = null;
						this.selectedTool = -1;
						this.selectTool(this.tool_SETTINGS);
					}
					utilityFolder.add(ui.editorGUI.editData, 'destroyTraceTexture');
				}

				break
			case this.tool_CAMERA:
				if(this.tracingTexture) this.tracingTexture.renderable = false;
				ui.destroyEditorGUI();
				break
		}

		if (ui.editorGUI) ui.registerDragWindow(ui.editorGUI);
	}

	this.deselectTool = function(i){
		switch (i) {
			case this.tool_VERTICEEDITING:
				this.verticeEditingBlackOverlay.parent.removeChild(this.verticeEditingBlackOverlay);
				delete this.verticeEditingBlackOverlay;
				this.verticeEditingSprite.parent.addChildAt(this.verticeEditingSprite, this.verticeEditingSprite.oldIndex);
				this.verticeEditingSprite._cullingSizeDirty = true; // ADD THIS
				delete this.verticeEditingSprite.selectedVertice;
				delete this.verticeEditingSprite.oldIndex;

				if(this.verticeEditingCallback){
					this.verticeEditingCallback(this.verticeEditingSprite);
					this.verticeEditingCallback = null;
				}

				delete this.verticeEditingSprite;

				this.lockSaving = false;


			break;
			case this.tool_CAMERA:
				if(this.tracingTexture) this.tracingTexture.renderable = true;
			break;
		}
	}

	this.updateSelection = function () {
		//Joints
		var i;

		ui.destroyEditorGUI();

		const case_NOTHING = 0;
		const case_JUST_BODIES = 1;
		const case_JUST_TEXTURES = 2;
		const case_JUST_JOINTS = 3;
		const case_JUST_PREFABS = 4;
		const case_MULTIPLE = 5;
		const case_JUST_GRAPHICS = 6;
		const case_JUST_TRIGGERS = 7;
		const case_JUST_GRAPHICGROUPS = 8;
		const case_JUST_TEXTS = 9;
		const case_JUST_ANIMATIONGROUPS = 10;


		let currentCase = case_NOTHING;
		let prefabKeys = Object.keys(this.selectedPrefabs);

		let hideMirrorTransformGui = prefabKeys.length > 0;

		if (prefabKeys.length > 0 && this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0) {
			var uniqueSelectedPrefabs = {};
			for (var i = 0; i < prefabKeys.length; i++) {
				uniqueSelectedPrefabs[this.activePrefabs[prefabKeys[i]].prefabName] = true;
			}
			if (Object.keys(uniqueSelectedPrefabs).length == 1) currentCase = case_JUST_PREFABS;
			else currentCase = case_MULTIPLE;
		} else if (this.selectedPhysicsBodies.length > 0 && this.selectedTextures.length == 0 && prefabKeys.length == 0) {
			var _triggers = [];
			var _bodies = [];
			var _body;
			for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
				_body = this.selectedPhysicsBodies[i];
				if (_body.mySprite.data.type == this.object_BODY) _bodies.push(_body);
				else if (_body.mySprite.data.type == this.object_TRIGGER) _triggers.push(_body);
			}
			if(_triggers.length>0) hideMirrorTransformGui = true;
			var editingMultipleObjects = (_bodies.length > 0 ? 1 : 0) + (_triggers.length > 0 ? 1 : 0);
			if (editingMultipleObjects > 1) currentCase = case_MULTIPLE;
			else if (_triggers.length > 0) currentCase = case_JUST_TRIGGERS;
			else currentCase = case_JUST_BODIES;
		} else if (this.selectedTextures.length > 0 && this.selectedPhysicsBodies.length == 0 && prefabKeys.length == 0) {
			var _selectedTextures = [];
			var _selectedGraphics = [];
			var _selectedGraphicGroups = [];
			var _selectedAnimationGroups = [];
			var _selectedPinJoints = [];
			var _selectedSlideJoints = [];
			var _selectedDistanceJoints = [];
			var _selectedRopeJoints = [];
			var _selectedWheelJoints = [];
			var _selectedTexts = [];
			var _texture;
			for (i = 0; i < this.selectedTextures.length; i++) {
				_texture = this.selectedTextures[i];

				if (_texture.data && _texture.data.type == this.object_JOINT) {
					if (_texture.data.jointType == this.jointObject_TYPE_PIN) {
						_selectedPinJoints.push(_texture);
					} else if (_texture.data.jointType == this.jointObject_TYPE_SLIDE) {
						_selectedSlideJoints.push(_texture);
					} else if (_texture.data.jointType == this.jointObject_TYPE_DISTANCE) {
						_selectedDistanceJoints.push(_texture);
					} else if (_texture.data.jointType == this.jointObject_TYPE_ROPE) {
						_selectedRopeJoints.push(_texture);
					} else if (_texture.data.jointType == this.jointObject_TYPE_WHEEL) {
						_selectedWheelJoints.push(_texture);
					}
				} else if (_texture.data && _texture.data.type == this.object_GRAPHIC) {
					_selectedGraphics.push(_texture);
				} else if (_texture.data && _texture.data.type == this.object_GRAPHICGROUP) {
					_selectedGraphicGroups.push(_texture);
				} else if (_texture.data && _texture.data.type == this.object_ANIMATIONGROUP) {
					_selectedAnimationGroups.push(_texture);
				}else if (_texture.data && _texture.data.type == this.object_TEXT) {
					_selectedTexts.push(_texture);
				} else {
					_selectedTextures.push(_texture);
				}
			}
			var editingMultipleObjects = (_selectedTextures.length > 0 ? 1 : 0) + (_selectedGraphics.length > 0 ? 1 : 0) + (_selectedGraphicGroups.length > 0 ? 1 : 0) + (_selectedAnimationGroups.length > 0 ? 1 : 0) + (_selectedPinJoints.length > 0 ? 1 : 0) + (_selectedSlideJoints.length > 0 ? 1 : 0) + (_selectedDistanceJoints.length > 0 ? 1 : 0) + (_selectedRopeJoints.length > 0 ? 1 : 0) + (_selectedWheelJoints.length > 0 ? 1 : 0) + (_selectedTexts.length > 0 ? 1 : 0);
			if (editingMultipleObjects > 1) {
				currentCase = case_MULTIPLE;
			} else if (_selectedTextures.length > 0) {
				currentCase = case_JUST_TEXTURES;
			} else if (_selectedGraphics.length > 0) {
				currentCase = case_JUST_GRAPHICS;
			} else if (_selectedGraphicGroups.length > 0) {
				currentCase = case_JUST_GRAPHICGROUPS;
			} else if (_selectedAnimationGroups.length > 0) {
				currentCase = case_JUST_ANIMATIONGROUPS;
			}else if (_selectedTexts.length > 0) {
				currentCase = case_JUST_TEXTS;
			} else {
				currentCase = case_JUST_JOINTS;
			}

			if((_selectedPinJoints.length > 0 ? 1 : 0) + (_selectedSlideJoints.length > 0 ? 1 : 0) + (_selectedDistanceJoints.length > 0 ? 1 : 0) + (_selectedRopeJoints.length > 0 ? 1 : 0) + (_selectedWheelJoints.length > 0 ? 1 : 0) + (_selectedTexts.length > 0 ? 1 : 0)){
				hideMirrorTransformGui = true;
			}


		} else if (this.selectedPhysicsBodies.length > 0 || this.selectedTextures.length > 0 || prefabKeys.length > 0) {
			currentCase = case_MULTIPLE;
		}

		if (currentCase == case_NOTHING) return;


		// transform gui mirror
		this.transformGUI.mirrorX.visible = !hideMirrorTransformGui;
		this.transformGUI.mirrorY.visible = !hideMirrorTransformGui;


		ui.buildEditorGUI();
		var dataJoint;
		var self = this;
		var controller;

		let targetFolder;

		//Init edit data;
		switch (currentCase) {
			case case_JUST_BODIES:
				ui.editorGUI.editData = new this.bodyObject;
				dataJoint = this.selectedPhysicsBodies[0].mySprite.data;
				if (this.selectedPhysicsBodies.length > 1) targetFolder = ui.editorGUI.addFolder('multiple bodies');
				else{
					const body = this.selectedPhysicsBodies[0];
					if(isBodyGroup(body)){
						if(body.myTexture){
							targetFolder = ui.editorGUI.addFolder('mixed group');
						}else{
							targetFolder = ui.editorGUI.addFolder('body group');
						}
					} else {
						targetFolder = ui.editorGUI.addFolder('body');
					}
				}
				break;
			case case_JUST_TEXTURES:
				dataJoint = _selectedTextures[0].data;
				ui.editorGUI.editData = new this.textureObject;
				if (this.selectedTextures.length > 1) targetFolder = ui.editorGUI.addFolder('multiple textures');
				else targetFolder = ui.editorGUI.addFolder('texture');
				break;
			case case_JUST_GRAPHICS:
				dataJoint = _selectedGraphics[0].data;
				ui.editorGUI.editData = new this.graphicObject;
				if (this.selectedTextures.length > 1) targetFolder = ui.editorGUI.addFolder('multiple graphics');
				else targetFolder = ui.editorGUI.addFolder('graphic');
				break;
			case case_JUST_GRAPHICGROUPS:
				dataJoint = _selectedGraphicGroups[0].data;
				ui.editorGUI.editData = new this.graphicGroup;
				if (this.selectedTextures.length > 1) targetFolder = ui.editorGUI.addFolder('multiple graphicGroups');
				else targetFolder = ui.editorGUI.addFolder('graphicGroup');
				break;
			case case_JUST_ANIMATIONGROUPS:
				dataJoint = _selectedAnimationGroups[0].data;
				ui.editorGUI.editData = new this.animationGroup;
				if (this.selectedTextures.length > 1) targetFolder = ui.editorGUI.addFolder('multiple animations');
				else targetFolder = ui.editorGUI.addFolder('animation');
				break;
			case case_JUST_JOINTS:
				var selectedType = ""
				ui.editorGUI.editData = new this.jointObject;
				if (_selectedPinJoints.length > 0) {
					dataJoint = _selectedPinJoints[0].data;
					selectedType = "Pin";
				} else if (_selectedSlideJoints.length > 0) {
					dataJoint = _selectedSlideJoints[0].data;
					selectedType = "Slide";
				} else if (_selectedDistanceJoints.length > 0) {
					dataJoint = _selectedDistanceJoints[0].data;
					selectedType = "Spring";
				} else if (_selectedRopeJoints.length > 0) {
					dataJoint = _selectedRopeJoints[0].data;
					selectedType = "Rope";
				} else if (_selectedWheelJoints.length > 0) {
					dataJoint = _selectedWheelJoints[0].data;
					selectedType = "Wheel";
				}
				if (this.selectedTextures.length > 1) targetFolder = ui.editorGUI.addFolder('multiple joints');
				else targetFolder = ui.editorGUI.addFolder(`${selectedType} joint`);
				break;
			case case_JUST_PREFABS:
				ui.editorGUI.editData = new this.prefabObject;
				dataJoint = this.activePrefabs[prefabKeys[0]];
				if (prefabKeys.length > 1) targetFolder = ui.editorGUI.addFolder('multiple prefabs');
				else targetFolder = ui.editorGUI.addFolder('prefab ' + dataJoint.prefabName);
				break;
			case case_MULTIPLE:
				ui.editorGUI.editData = new this.multiObject;

				if (this.selectedTextures.length > 0) dataJoint = this.selectedTextures[0].data;
				else if (this.selectedPhysicsBodies.length > 0) dataJoint = this.selectedPhysicsBodies[0].mySprite.data;
				else dataJoint = this.activePrefabs[prefabKeys[0]];

				targetFolder = ui.editorGUI.addFolder('multiple objects');
				break;
			case case_JUST_TRIGGERS:
				ui.editorGUI.editData = new this.triggerObject;
				dataJoint = this.selectedPhysicsBodies[0].mySprite.data;
				if (this.selectedPhysicsBodies.length > 1) targetFolder = ui.editorGUI.addFolder('multiple triggers');
				else targetFolder = ui.editorGUI.addFolder('trigger');
				break;
			case case_JUST_TEXTS:
				dataJoint = _selectedTexts[0].data;
				ui.editorGUI.editData = new this.textObject;
				if (this.selectedTextures.length > 1) targetFolder = ui.editorGUI.addFolder('multiple texts');
				else targetFolder = ui.editorGUI.addFolder('text');
				break;
		}
		targetFolder.open();

		for (var key in ui.editorGUI.editData) {
			if (ui.editorGUI.editData.hasOwnProperty(key)) {
				ui.editorGUI.editData[key] = dataJoint[key];

				if (dataJoint.type == this.object_BODY && (key == "x" || key == "y")) {
					ui.editorGUI.editData[key] *= this.PTM;
				}
				if (key == "groups") {
					if (!this.isSelectionPropertyTheSame("groups")) ui.editorGUI.editData.groups = "-";
				}
			}
		}

		//Populate default GUI Fields
		const xController = targetFolder.add(ui.editorGUI.editData, "x").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value - this.initialValue;
			this.initialValue = value;
		});
		const xDiv = xController.domElement.parentNode;

		const yController = targetFolder.add(ui.editorGUI.editData, "y").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value - this.initialValue;
			this.initialValue = value;
		});
		const yDiv = yController.domElement.parentNode
		const oldYElement = yDiv.parentNode;

		xDiv.parentNode.appendChild(yDiv);
		oldYElement.parentNode.removeChild(oldYElement);
		xDiv.style.display = 'inline-block';
		xDiv.style.width = '50%';
		yDiv.style.display = 'inline-block';
		yDiv.style.width = '50%';

		if (currentCase != case_MULTIPLE && currentCase != case_JUST_JOINTS && currentCase != case_JUST_ANIMATIONGROUPS && currentCase != case_JUST_PREFABS) {

			var aabb = this.computeObjectsAABB(this.selectedPhysicsBodies, this.selectedTextures, true);
			var currentSize = {
				width: aabb.GetExtents().x * 2 * this.PTM,
				height: aabb.GetExtents().y * 2 * this.PTM
			}

			ui.editorGUI.editData.width = currentSize.width;
			ui.editorGUI.editData.height = currentSize.height;

			const widthController = targetFolder.add(ui.editorGUI.editData, "width").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});
			const widthDiv = widthController.domElement.parentNode;

			const heightController = targetFolder.add(ui.editorGUI.editData, "height").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});
			const heightDiv = heightController.domElement.parentNode
			const oldHeightElement = heightDiv.parentNode;

			widthDiv.parentNode.appendChild(heightDiv);
			oldHeightElement.parentNode.removeChild(oldHeightElement);
			widthDiv.style.display = 'inline-block';
			widthDiv.style.width = '50%';
			heightDiv.style.display = 'inline-block';
			heightDiv.style.width = '50%';
		}
		targetFolder.add(ui.editorGUI.editData, "rotation").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value - this.initialValue;
			this.initialValue = value;
		});
		if (prefabKeys.length == 0 && Settings.admin) {
			targetFolder.add(ui.editorGUI.editData, "groups").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});
		}
		if (this.selectedTextures.length + this.selectedPhysicsBodies.length == 1 && prefabKeys.length == 0) {
			targetFolder.add(ui.editorGUI.editData, "refName").name("name").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});
		}
		//Populate custom  fields
		let tileTextureGUI, selectedTextureIndex;
		let visualsFolder, advancedFolder
		switch (currentCase) {
			case case_JUST_BODIES:

				targetFolder.add(ui.editorGUI.editData, "fixed").name("static").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				});

				tileTextureGUI = targetFolder.add(ui.editorGUI.editData, "tileTexture", this.tileLists);
				tileTextureGUI.domElement.parentNode.parentNode.style.display = 'none';

				selectedTextureIndex = Settings.textureNames.indexOf(ui.editorGUI.editData.tileTexture);

				visualsFolder = targetFolder.addFolder('visuals');


				ui.createImageDropDown(visualsFolder, Settings.textureNames, selectedTextureIndex, index => {
					tileTextureGUI.humanUpdate = true;
					tileTextureGUI.targetValue = Settings.textureNames[index];
				});

				const multiBodyColor = ui.editorGUI.editData.colorFill.length > 1;

				if (multiBodyColor) {
					ui.editorGUI.editData.transparancy = ui.editorGUI.editData.transparancy[0];
					controller = visualsFolder.add(ui.editorGUI.editData, "groupOpacity", 0, 1).name("opacity");
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));
					controller = visualsFolder.add(ui.editorGUI.editData, "visible", 0, 1);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));


					advancedFolder = targetFolder.addFolder('advanced');
				} else {
					ui.editorGUI.editData.colorFill = ui.editorGUI.editData.colorFill[0];
					ui.editorGUI.editData.colorLine = ui.editorGUI.editData.colorLine[0];
					ui.editorGUI.editData.lineWidth = ui.editorGUI.editData.lineWidth[0];
					ui.editorGUI.editData.transparancy = ui.editorGUI.editData.transparancy[0];
					ui.editorGUI.editData.density = ui.editorGUI.editData.density[0];
					ui.editorGUI.editData.friction = ui.editorGUI.editData.friction[0];
					ui.editorGUI.editData.restitution = ui.editorGUI.editData.restitution[0];

					controller = visualsFolder.addColor(ui.editorGUI.editData, "colorFill");
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));
					controller = visualsFolder.addColor(ui.editorGUI.editData, "colorLine");
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));
					controller = visualsFolder.add(ui.editorGUI.editData, "lineWidth", 0.0, 10.0).step(1.0);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));

					if(isBodyGroup(this.selectedPhysicsBodies[0])){
						controller = visualsFolder.add(ui.editorGUI.editData, "groupOpacity", 0, 1).name("opacity");
						controller.onChange(function (value) {
							this.humanUpdate = true;
							this.targetValue = value;
						}.bind(controller));
					}else{
						controller = visualsFolder.add(ui.editorGUI.editData, "transparancy", 0, 1).name("opacity");
						controller.onChange(function (value) {
							this.humanUpdate = true;
							this.targetValue = value;
						}.bind(controller));
					}

					controller = visualsFolder.add(ui.editorGUI.editData, "visible", 0, 1);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));

					advancedFolder = targetFolder.addFolder('advanced');

					controller = advancedFolder.add(ui.editorGUI.editData, "density", 0.001, 1000).step(0.001);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value
					}.bind(controller));
					controller = advancedFolder.add(ui.editorGUI.editData, "friction", 0, 1).name("roughness").step(0.01);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value
					}.bind(controller));
					controller = advancedFolder.add(ui.editorGUI.editData, "restitution", 0, 2).name("bouncy").step(0.01);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value
					}.bind(controller));

					// is Character is an admin feature
					let collisionTypes = [...Settings.collisionTypes];
					if(!Settings.admin) collisionTypes = collisionTypes.filter(collision => collision !=="Is character");

					// is character is hidden
					ui.editorGUI.editData.collisionTypes = Settings.collisionTypes[ui.editorGUI.editData.collision];

					advancedFolder.add(ui.editorGUI.editData, "collisionTypes", collisionTypes).name("collision").onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = Settings.collisionTypes.indexOf(value);
					});

				}

				advancedFolder.add(ui.editorGUI.editData, "awake").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				});
				advancedFolder.add(ui.editorGUI.editData, "instaKill").name("kills player").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				});
				advancedFolder.add(ui.editorGUI.editData, "isVehiclePart").name("Is vehicle part").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value
				});
				advancedFolder.add(ui.editorGUI.editData, "fixedRotation").name("fixed rotation").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value 
				});
				advancedFolder.add(ui.editorGUI.editData, "optimizePhysics").name("optimize physics").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});
				advancedFolder.add(ui.editorGUI.editData, "bulletCollision").name("continuous collision detection").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});
				advancedFolder.add(ui.editorGUI.editData, "breakable").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});

				let bodyIsGroup = false;
				for (let i = 0; i < this.selectedPhysicsBodies.length; i++) {
					const body = this.selectedPhysicsBodies[i];
					if (body && isBodyGroup(body)) {
						bodyIsGroup = true;
						break;
					}
				}

				if (!bodyIsGroup) {
					ui.editorGUI.editData.convertToGraphic = function () {};
					var label = this.selectedPhysicsBodies.length == 1 ? "convert to graphic" : "convert to graphics";
					controller = targetFolder.add(ui.editorGUI.editData, "convertToGraphic").name(label);
					ui.editorGUI.editData.convertToGraphic = (function (_c) {
						return function () {
							if (_c.domElement.previousSibling.innerText != "click to confirm") {
								_c.name("click to confirm");
							} else {
								_c.name(label);
								self.convertSelectedBodiesToGraphics();
							}
						}
					})(controller);
				}
				break;
			case case_JUST_TEXTURES:

				visualsFolder = targetFolder.addFolder('visuals');

				controller = visualsFolder.addColor(ui.editorGUI.editData, "tint");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = visualsFolder.add(ui.editorGUI.editData, "transparancy", 0, 1).name("opacity");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = visualsFolder.add(ui.editorGUI.editData, "visible", 0, 1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				advancedFolder = targetFolder.addFolder('advanced');

				controller = advancedFolder.add(ui.editorGUI.editData, "parallax", -3, 3).step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = advancedFolder.add(ui.editorGUI.editData, "repeatTeleportX").step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = advancedFolder.add(ui.editorGUI.editData, "repeatTeleportY").step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				break;
			case case_JUST_GRAPHICS:

				visualsFolder = targetFolder.addFolder('visuals');

				tileTextureGUI = targetFolder.add(ui.editorGUI.editData, "tileTexture", this.tileLists);
				tileTextureGUI.domElement.parentNode.parentNode.style.display = 'none';

				selectedTextureIndex = Settings.textureNames.indexOf(ui.editorGUI.editData.tileTexture);
				
				ui.createImageDropDown(visualsFolder, Settings.textureNames, selectedTextureIndex, index => {
					tileTextureGUI.humanUpdate = true;
					tileTextureGUI.targetValue = Settings.textureNames[index];
				});

				visualsFolder.add(ui.editorGUI.editData, "gradient", ['', Settings.DEFAULT_TEXTS.newGradient, ...this.levelGradientsNames]).onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});
				controller = visualsFolder.addColor(ui.editorGUI.editData, "colorFill");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = visualsFolder.addColor(ui.editorGUI.editData, "colorLine");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = visualsFolder.add(ui.editorGUI.editData, "lineWidth", 0.0, 10.0).step(1.0);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = visualsFolder.add(ui.editorGUI.editData, "transparancy", 0, 1).name("opacity");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = visualsFolder.add(ui.editorGUI.editData, "visible", 0, 1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				advancedFolder = targetFolder.addFolder('advanced');

				controller = advancedFolder.add(ui.editorGUI.editData, "parallax", -3, 3).step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = advancedFolder.add(ui.editorGUI.editData, "repeatTeleportX").step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = advancedFolder.add(ui.editorGUI.editData, "repeatTeleportY").step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				ui.editorGUI.editData.convertToBody = function () {};
				var label = this.selectedTextures.length == 1 ? "convert to body" : "convert to bodies";
				controller = targetFolder.add(ui.editorGUI.editData, "convertToBody").name(label);
				ui.editorGUI.editData.convertToBody = (function (_c) {
					return function () {
						if (_c.domElement.previousSibling.innerText != "click to confirm") {
							_c.name("click to confirm");
						} else {
							_c.name(label);
							self.convertSelectedGraphicsToBodies();
						}
					}
				})(controller)

				if(this.selectedTextures.length>1){
					ui.editorGUI.editData.merge = function () {};
					const label = "merge graphics";
					controller = targetFolder.add(ui.editorGUI.editData, "merge").name(label);
					ui.editorGUI.editData.merge = (function (_c) {
						return function () {

							const booleanOperation = self.altDown ? 'subtract' : 'unite';

							const combinedVerticesData = verticeOptimize.combineShapes(self.selectedTextures, booleanOperation);

							const objectsToDelete = combinedVerticesData.merged.map(i=>self.selectedTextures[i]);
							self.selectedTextures = self.selectedTextures.filter((texture, i) => !combinedVerticesData.merged.includes(i));
							self.deleteObjects(objectsToDelete);

							if(combinedVerticesData.merged.length>0){
								const combinedSprite = self.selectedTextures[0];
								combinedSprite.data.vertices = combinedVerticesData.vertices;
								delete combinedSprite.data.radius;
								self.updateGraphicShapes(combinedSprite);
								self.updateSelection();
							}
						}
					})(controller)
				}

				break;
			case case_JUST_GRAPHICGROUPS:
				visualsFolder = targetFolder.addFolder('visuals');

				controller = visualsFolder.add(ui.editorGUI.editData, "transparancy", 0, 1).name("opacity");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = visualsFolder.add(ui.editorGUI.editData, "visible", 0, 1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = visualsFolder.add(ui.editorGUI.editData, "mirrored", 0, 1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				advancedFolder = targetFolder.addFolder('advanced');

				ui.editorGUI.editData.openColorMatrixEditor = () => {
					ui.showColorMatrixEditor(ui.editorGUI.editData.colorMatrix, this.selectedTextures, colorMatrix=>{
						this.selectedTextures.forEach(texture=>{
							texture.data.colorMatrix = colorMatrix;
						})
					})
				};
				controller = advancedFolder.add(ui.editorGUI.editData, "openColorMatrixEditor").name('edit color matrix');

				controller = advancedFolder.add(ui.editorGUI.editData, "parallax", -3, 3).step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = advancedFolder.add(ui.editorGUI.editData, "repeatTeleportX").step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = advancedFolder.add(ui.editorGUI.editData, "repeatTeleportY").step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				break;
			case case_JUST_ANIMATIONGROUPS:

				controller = targetFolder.add(ui.editorGUI.editData, "fps", 1, 60).step(1.0);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "playing");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "loop");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				visualsFolder = targetFolder.addFolder('visuals');

				controller = visualsFolder.add(ui.editorGUI.editData, "transparancy", 0, 1).name("opacity");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = visualsFolder.add(ui.editorGUI.editData, "visible", 0, 1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = visualsFolder.add(ui.editorGUI.editData, "mirrored", 0, 1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				advancedFolder = targetFolder.addFolder('advanced');

				controller = advancedFolder.add(ui.editorGUI.editData, "parallax", -3, 3).step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = advancedFolder.add(ui.editorGUI.editData, "repeatTeleportX").step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = advancedFolder.add(ui.editorGUI.editData, "repeatTeleportY").step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				break;
			case case_JUST_JOINTS:
				this.addJointGUI(dataJoint, targetFolder);
				break;
			case case_JUST_PREFABS:
				var prefabObject = this.activePrefabs[Object.keys(this.selectedPrefabs)[0]];
				var prefabClass = PrefabManager.prefabLibrary[prefabObject.prefabName].class;
				var prefabObjectSettings = prefabObject.settings;
				var prefabClassSettings = prefabClass.settings;
				var prefabClassOptions = prefabClass.settingsOptions;


				for (let key in prefabClassOptions) {
					if (prefabClassOptions.hasOwnProperty(key) && prefabClassOptions[key] !== undefined) {
						let argument;
						ui.editorGUI.editData[key] = prefabObjectSettings[key];

						if(ui.editorGUI.editData[key] === undefined) ui.editorGUI.editData[key] = prefabClassSettings[key];
						if (prefabClassOptions[key] == '$custom') {
							// allow custom gui creation for some prefabs (like SevenSegment);
							delete ui.editorGUI.editData[key];
							prefabClassSettings[key](prefabObject, ui.editorGUI.editData, targetFolder);
						}else if (prefabClassOptions[key] == '$function') {
							// create a new function that passes the prefab object
							ui.editorGUI.editData[key] = ()=>prefabClassSettings[key](prefabObject);
							controller = targetFolder.add(ui.editorGUI.editData, key);
							controller.onChange(function (value) {
								this.humanUpdate = true;
								this.targetValue = value
							}.bind(controller));
						}else if (prefabClassOptions[key] instanceof Object && !(prefabClassOptions[key] instanceof Array)) {
							argument = prefabClassOptions[key];
							controller = targetFolder.add(ui.editorGUI.editData, key, argument.min, argument.max).step(argument.step);
							controller.onChange(function (value) {
								this.humanUpdate = true;
								this.targetValue = value
							}.bind(controller));
						}else {
							if (prefabClassOptions[key] instanceof Array) argument = prefabClassOptions[key];
							else argument = null;
							controller = targetFolder.add(ui.editorGUI.editData, key, argument);
							controller.onChange(function (value) {
								this.humanUpdate = true;
								this.targetValue = value
							}.bind(controller));
						}
					}
				}

				break;
			case case_MULTIPLE:
				break;
			case case_JUST_TRIGGERS:
				trigger.addTriggerGUI(dataJoint, targetFolder);
				break;
			case case_JUST_TEXTS:

				ui.editorGUI.editData.openTextEditorCaller = function () {};
				controller = targetFolder.add(ui.editorGUI.editData, "openTextEditorCaller").name("Edit Text");
				ui.editorGUI.editData.openTextEditorCaller = self.openTextEditor.bind(this);


				controller = targetFolder.addColor(ui.editorGUI.editData, "textColor");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				controller = targetFolder.add(ui.editorGUI.editData, "transparancy", 0, 1).name("opacity");
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				controller = targetFolder.add(ui.editorGUI.editData, "visible", 0, 1);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				controller = targetFolder.add(ui.editorGUI.editData, "fontSize", 1, 1000).step(1.0);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));

				targetFolder.add(ui.editorGUI.editData, 'fontName', Settings.availableFonts).onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});
				targetFolder.add(ui.editorGUI.editData, 'textAlign', ['left', 'center', 'right']).onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});
				controller = targetFolder.add(ui.editorGUI.editData, "parallax", -3, 3).step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "repeatTeleportX").step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				controller = targetFolder.add(ui.editorGUI.editData, "repeatTeleportY").step(0.01);
				controller.onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				}.bind(controller));
				break;
		}

		if(prefabKeys.length === 0){
			const hasAnimation = this.selectedTextures.find(obj => obj.data.type === this.object_ANIMATIONGROUP);
			const hasOthers = this.selectedTextures.find(obj => obj.data.type !== this.object_ANIMATIONGROUP);
			const hasTriggers = this.selectedPhysicsBodies.find(obj => obj.mySprite.data.type === this.object_TRIGGER);
			const hasJoints = this.selectedTextures.find(obj => obj.data.type === this.object_JOINT);

			if (this.selectedPhysicsBodies.length + this.selectedTextures.length > 1) {
				let canGroup = true;
				if(hasTriggers || hasJoints) canGroup = false;
				if(hasAnimation && hasOthers) canGroup = false; // we cant group when we have mixed animations and other graphics
				if(canGroup && hasAnimation && this.selectedTextures.length > 1) canGroup = false; // we cant group multiple animations

				if(canGroup){
					ui.editorGUI.editData.groupObjects = () => {
						self.groupObjects();
					};
					controller = targetFolder.add(ui.editorGUI.editData, "groupObjects").name('group objects');
				}
			} else {
				if (this.selectedPhysicsBodies.length == 1) {
					if (this.selectedPhysicsBodies[0].myTexture || (Array.isArray(this.selectedPhysicsBodies[0].mySprite.data.density) && this.selectedPhysicsBodies[0].mySprite.data.density.length>1)) {
						ui.editorGUI.editData.ungroupObjects = () => {
							self.ungroupObjects();
						};
						controller = targetFolder.add(ui.editorGUI.editData, "ungroupObjects").name('ungroup objects');
					}
				} else if (this.selectedTextures.length == 1) {
					if (this.selectedTextures[0].data.type == this.object_GRAPHICGROUP) {
						ui.editorGUI.editData.ungroupObjects = () => {
							self.ungroupObjects();
						};
						controller = targetFolder.add(ui.editorGUI.editData, "ungroupObjects").name('ungroup objects');
					}else if (this.selectedTextures[0].data.type == this.object_ANIMATIONGROUP) {
						ui.editorGUI.editData.breakAnimation = () => {
							self.ungroupObjects();
						};
						controller = targetFolder.add(ui.editorGUI.editData, "breakAnimation").name('break animation');
					}
				}
			}

			if(this.selectedPhysicsBodies.length === 0 && this.selectedTextures.length > 1){
				if(!hasAnimation){
					ui.editorGUI.editData.animateObjects = () => {
						self.createAnimationGroup();
					};
					controller = targetFolder.add(ui.editorGUI.editData, "animateObjects").name('create animation');
				}
			}
		}

		// we mark trigger targets as dirty for a redraw
		game.triggerDebugDraw.debounceRedraw();

		//TODO:Maybe add admin mode / pro mode for lockselection
		if (ui.editorGUI.editData.lockselection == undefined) ui.editorGUI.editData.lockselection = false;
		targetFolder.add(ui.editorGUI.editData, "lockselection").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value;
		});
		ui.registerDragWindow(ui.editorGUI);
	}
	this.addJointGUI = function (dataJoint, _folder) {
		var self = this;
		var controller;
		var folder;
		var jointTypes = ["Pin", "Slide", "Spring", "Rope", "Wheel"];
		ui.editorGUI.editData.typeName = jointTypes[dataJoint.jointType];
		_folder.add(ui.editorGUI.editData, "typeName", jointTypes).onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value
		});
		_folder.add(ui.editorGUI.editData, "collideConnected").onChange(function (value) {
			this.humanUpdate = true;
			this.targetValue = value
		});
		if (dataJoint.jointType == this.jointObject_TYPE_PIN){
			_folder.add(ui.editorGUI.editData, "autoReferenceAngle").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			});
		}

		if (dataJoint.jointType == this.jointObject_TYPE_PIN || dataJoint.jointType == this.jointObject_TYPE_SLIDE || dataJoint.jointType == this.jointObject_TYPE_WHEEL) {

			folder = _folder.addFolder('enable motor');
			folder.add(ui.editorGUI.editData, "enableMotor").onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			});

			controller = folder.add(ui.editorGUI.editData, "maxMotorTorque", 0, Settings.motorForceLimit);
			controller.onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			}.bind(controller));

			if (dataJoint.jointType == this.jointObject_TYPE_SLIDE) controller.name("maxMotorForce");

			controller = folder.add(ui.editorGUI.editData, "motorSpeed", -Settings.motorSpeedLimit, Settings.motorSpeedLimit);
			controller.onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			}.bind(controller));

			if (dataJoint.jointType !== this.jointObject_TYPE_WHEEL) {

				folder = _folder.addFolder('enable limits');
				folder.add(ui.editorGUI.editData, "enableLimit").onChange(function (value) {
					this.humanUpdate = true;
					this.targetValue = value;
				});

				if (dataJoint.jointType == this.jointObject_TYPE_PIN) {
					controller = folder.add(ui.editorGUI.editData, "upperAngle", 0, 180);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));

					controller = folder.add(ui.editorGUI.editData, "lowerAngle", -180, 0);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value
					}.bind(controller));
				} else {
					controller = folder.add(ui.editorGUI.editData, "upperLimit", 0, Settings.slideJointDistanceLimit);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value;
					}.bind(controller));

					controller = folder.add(ui.editorGUI.editData, "lowerLimit", -Settings.slideJointDistanceLimit, 0);
					controller.onChange(function (value) {
						this.humanUpdate = true;
						this.targetValue = value
					}.bind(controller));
				}
			}
		}
		if (dataJoint.jointType == this.jointObject_TYPE_DISTANCE || dataJoint.jointType == this.jointObject_TYPE_WHEEL) {
			folder = _folder.addFolder('spring');

			controller = folder.add(ui.editorGUI.editData, "frequencyHz", 0, 10).step(0.1);
			controller.onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value;
			}.bind(controller));

			controller = folder.add(ui.editorGUI.editData, "dampingRatio", 0.0, 1.0).step(0.1);
			controller.onChange(function (value) {
				this.humanUpdate = true;
				this.targetValue = value
			}.bind(controller));
		}
	}

	this.isSelectionPropertyTheSame = function (property) {
		var data = null;
		var compareValue = null;
		var i;
		if (this.selectedPhysicsBodies.length > 0) {
			for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
				data = this.selectedPhysicsBodies[i].mySprite.data;
				if (compareValue == null) compareValue = data[property];
				else if (data[property] != compareValue) {
					return false;
				}
			}
		}
		if (this.selectedTextures.length > 0) {
			for (i = 0; i < this.selectedTextures.length; i++) {
				data = this.selectedTextures[i].data;
				if (compareValue == null) compareValue = data[property];
				else if (data[property] != compareValue) {
					return false;
				}

			}
		}
		return true;
	}

	this.deleteObjects = function (arr) {

		let i, obj;

		for (i = 0; i < arr.length; i++) {
			obj = arr[i];
			if (obj instanceof Box2D.b2Joint) {
				let joint = obj;
				if (joint.myTriggers != undefined) {
					var j;
					var myTrigger;
					for (j = 0; j < (joint.myTriggers ? joint.myTriggers.length : 0); j++) {
						myTrigger = joint.myTriggers[j];
						trigger.removeTargetFromTrigger(myTrigger, joint);
						j--;
					}
				}
				this.removeObjectFromLookupGroups(joint, joint.spriteData);
				this.DestroyJoint(joint);

				//TODO: remove joints from lookup object???


			} else if (obj instanceof this.prefabObject) {
				arr = arr.concat(this.lookupGroups[obj.key]._bodies, this.lookupGroups[obj.key]._textures, this.lookupGroups[obj.key]._joints);
				arr.forEach(arrEl=>{
					const sprite = arrEl.mySprite ? arrEl.mySprite : arrEl;
					for (j = 0; j < (sprite.myTriggers ? sprite.myTriggers.length : 0); j++) {
						let myTrigger = sprite.myTriggers[j];
						trigger.removeTargetFromTrigger(myTrigger, sprite);
						if(!sprite.myTriggers) break;
						j--;
					}
				});
				delete this.activePrefabs[obj.key];
			} else if (obj.data) {
				//graphic object
				var sprite = obj;
				this.removeObjectFromLookupGroups(sprite, sprite.data);
				if (sprite.data && sprite.data.type == this.object_JOINT) {
					var j;
					var myJoint;
					if (sprite.bodies[0] != undefined) {
						for (j = 0; j < sprite.bodies[0].myJoints.length; j++) {
							myJoint = sprite.bodies[0].myJoints[j];
							if (myJoint == sprite) {
								sprite.bodies[0].myJoints.splice(j, 1);
								j--;
							}
						}
						if (sprite.bodies[0].myJoints.length == 0) sprite.bodies[0].myJoints = undefined;
					}
					if (sprite.bodies.length > 1 && sprite.bodies[1] != undefined) {
						for (j = 0; j < sprite.bodies[1].myJoints.length; j++) {
							myJoint = sprite.bodies[1].myJoints[j];
							if (myJoint == sprite) {
								sprite.bodies[1].myJoints.splice(j, 1);
								j--;
							}
						}
						if (sprite.bodies[1].myJoints.length == 0) sprite.bodies[1].myJoints = undefined;
					}
					for (j = 0; j < this.editorIcons.length; j++) {
						if (this.editorIcons[j] == sprite) {
							this.editorIcons.splice(j, 1);
						}
					}
				}
				if (sprite.myTriggers != undefined) {
					for (let j = 0; j < sprite.myTriggers.length; j++) {
						let myTrigger = sprite.myTriggers[j];
						trigger.removeTargetFromTrigger(myTrigger, sprite);
						if(!sprite.myTriggers) break;
						j--;
					}
				}

				if (sprite.data && sprite.data.type == this.object_ANIMATIONGROUP) {
					this.animationGroups = this.animationGroups.filter(animation => animation != sprite);
				}

				if(sprite.data.parallax || sprite.data.repeatTeleportX || sprite.data.repeatTeleportY){
					this.parallaxObject = this.parallaxObject.filter(obj=> obj !== sprite);
				}

				sprite.destroy({
					children: true,
					texture: false,
					baseTexture: false
				});
			} else if (obj.mySprite.data) {
				var b = obj;
				this.removeObjectFromLookupGroups(b, b.mySprite.data);

				if (b.mySprite.data && b.mySprite.data.type == this.object_TRIGGER) {
					var j;
					var k;
					var myTrigger;
					for (j = 0; j < b.mySprite.targets.length; j++) {
						trigger.removeTargetFromTrigger(b, b.mySprite.targets[j]);
						j--;
					}
					for (j = 0; j < this.triggerObjects.length; j++) {
						if (this.triggerObjects[j] == b) {
							this.triggerObjects.splice(j, 1);
							break;
						}
					}
				}
				if (b.mySprite.myTriggers != undefined) {
					var j;
					var myTrigger;
					for (j = 0; j < (b.mySprite.myTriggers ? b.mySprite.myTriggers.length : 0); j++) {
						myTrigger = b.mySprite.myTriggers[j];
						trigger.removeTargetFromTrigger(myTrigger, b.mySprite);
						if(!b.mySprite.myTriggers) break;
						j--;
					}
				}
				b.mySprite.destroyed = true;
				b.mySprite.destroy({
					children: true,
					texture: false,
					baseTexture: false
				});
				b.mySprite = null;

				if (b.myJoints != undefined) {
					var j;
					var myJoint;
					var k;
					for (j = 0; j < b.myJoints.length; j++) {
						myJoint = b.myJoints[j];
						var alreadySelected = false;
						for (k = 0; k < arr.length; k++) {
							if (arr[k] == myJoint) {
								alreadySelected = true;
							}
						}
						if (!alreadySelected) arr.push(myJoint);
					}
				} else {
					for (let jointEdge = b.GetJointList(); getPointer(jointEdge) !== getPointer(NULL); jointEdge = jointEdge.get_next()) {
						if (jointEdge.joint.spriteData) arr.push(jointEdge.joint);
					}
				}
				if (b.myTexture) {
					var sprite = b.myTexture;
					sprite.destroy({
						children: true,
						texture: false,
						baseTexture: false
					});
					if (sprite.data && sprite.data.type == this.object_ANIMATIONGROUP) {
						this.animationGroups = this.animationGroups.filter(animation => animation != sprite);
					}
				}
				if (b.connectedSpike) {
					let tarIndex = b.connectedSpike.connectedBodies.indexOf(b);
					b.connectedSpike.connectedBodies.splice(tarIndex);
					b.connectedSpike.connectedJoints.splice(tarIndex);
				}
				this.DestroyBody(b);
			}
			obj.destroyed = true;
		}
	}
	this.DestroyBody = function(body){
		// mark this body as pooled
		body.destroyed = true;
		body.__emscripten_pool = true;

		if(body.queuedForDecals){
			this.decalQueue = this.decalQueue.filter(data => data[0] !== body);
		}

		for (let jointEdge = body.GetJointList(); getPointer(jointEdge) !== getPointer(NULL); jointEdge = jointEdge.get_next()) {
			let joint = this.CastJoint(jointEdge.joint);
			this.preDestroyJoint(joint);
		}

		if(game.cameraFocusObject === body) game.cameraFocusObject = null;

		this.world.DestroyBody(body);
	}
	this.CleanBody = function(body){
		// clean up all properties for Emscripten object recycle
		if(body.__emscripten_pool){
			delete body.myTexture;
			delete body.mySprite;
			delete body.myJoints;
			delete body.myTriggers;
			delete body.recentlyImpactedBodies;
			delete body.destroyed;
			delete body.ignorePhysicsCuller
			delete body.ignoreCollisionsTime;
			delete body.isFlesh;
			delete body.snapped;
			delete body.instaKill;
			delete body.isVehiclePart;
			delete body.noImpactDamage;
			delete body.myTileSprite;
			delete body.noDamage;
			delete body.__emscripten_pool;
			delete body.reFixture;
			delete body.cameraZoom;
			delete body.FakeSensor;
			delete body.connectedSpike;
			delete body.isPhysicsCamera;
			delete body.isHumanoid;
			delete body.isAffectedByForcefield;
			delete body.mainHumanoid;
			delete body.grabJoints;
			delete body.myRTCache;
			delete body.myDecalEntry;
			delete body.myDecalRT;
			delete body.myMaskRT;
			delete body.myMask;
			delete body.isHat;
			delete body.key;
			delete body.bounceIndex;
			delete body.yogaBody;
			delete body.skipPush;
			delete body.mainCharacter;
			delete body.InCameraView;
			delete body.destroyed;
			delete body.instaKill;
			delete body.originalGraphic;
			delete body.preSolveVelicity;
			delete body.preSolveVelicityCounter;
			delete body.emitterCount;
			delete body.decalTimeout;
			delete body.isVain;
			delete body.vainRopeJoint;
			delete body.jointCrawled;
			delete body.isArrow;
			delete body.isCrossBow;
			delete body.oldBounceManifest;
			delete body.copyHash;
			delete body.lockPositionForOneFrame;
			delete body.myFlesh;
			delete body.class;
			delete body.contactListener;
			delete body.edgeLeft;
			delete body.edgeRight;
			delete body.edgeBottom;
			delete body.edgeTop;
			delete body.isVehicle;
			delete body.yogaBody;
			delete body.bounceIndex;
			delete body.isCannon;
			delete body.emitterCount;
			delete body.isCharacter;
			delete body.queuedForDecals;
			delete body.isBeartrapSpike;
			delete body.ignoreTriggers;
			delete body.goingToBreak;
			delete body.broken;
			delete body.breakPenalty;
			delete body.oldDensities;
			delete body.decalLookupKey;
			delete body.isRopeEnd;
		}
	}

	this.CreateBody = function(bodyDef){
		// make sure we are not pooling an object
		const body = this.world.CreateBody(bodyDef);
		this.CleanBody(body);
		return body;
	}

	this.CastJoint = function(joint){
		if(joint.GetType() === Box2D.e_revoluteJoint){
			return Box2D.castObject(joint, Box2D.b2RevoluteJoint);
		}else if(joint.GetType() === Box2D.e_distanceJoint){
			return Box2D.castObject(joint, Box2D.b2DistanceJoint);
		}else if(joint.GetType() === Box2D.e_prismaticJoint){
			return Box2D.castObject(joint, Box2D.b2PrismaticJoint);
		}else if(joint.GetType() === Box2D.e_wheelJoint){
			return Box2D.castObject(joint, Box2D.b2WheelJoint);
		}else if(joint.GetType() === Box2D.e_weldJoint){
			return Box2D.castObject(joint, Box2D.b2WeldJoint);
		}else if(joint.GetType() === Box2D.e_mouseJoint){
			return Box2D.castObject(joint, Box2D.b2MouseJoint);
		}
		return joint;
	}

	this.preDestroyJoint = function(joint){
		joint.destroyed = true;
		joint.__emscripten_pool = true;

		this.removeObjectFromLookupGroups(joint, joint.spriteData);

		if(joint.linkedJoints){
			joint.linkedJoints.forEach(_joint => {
				if(!_joint.destroyed){
					_joint.innerLoopDestroyed = true;
					this.preDestroyJoint(_joint);
					this.world.DestroyJoint(_joint);
				}
			});
			delete joint.linkedJoints;
		}
		if(joint.connectedJoints){
			joint.connectedJoints.forEach(_joint => {
				if(_joint.linkedJoints){
					_joint.linkedJoints = _joint.linkedJoints.filter(_j=>_j != _joint);
					if(_joint.linkedJoints.length === 0) delete _joint.linkedJoints
				}
			});
		}
	}

	this.existsInEmscriptenCache = obj => getPointer(obj) in getCache(getClass(obj));

	this.DestroyJoint = function(joint){
		if(!joint || joint.destroyed) return;
		this.preDestroyJoint(joint);
		if(joint.innerLoopDestroyed) return;

		if(this.existsInEmscriptenCache(joint)){
			this.world.DestroyJoint(joint);
		}
	}
	this.CleanJoint = function(joint){
		// clean up all properties for Emscripten object recycle
		if(joint.__emscripten_pool){
			delete joint.__emscripten_pool;
			delete joint.linkedJoints;
			delete joint.connectedJoints;
			delete joint.destroyed;
			delete joint.innerLoopDestroyed;
			delete joint.snapTick;
			delete joint.myTriggers;
			delete joint.spriteData;
			delete joint.data;
			delete joint.isSharpJoint;
		}
	}

	this.CreateJoint = function(jointDef){
		// make sure we are not pooling an object
		let joint = this.world.CreateJoint(jointDef);
		joint =  this.CastJoint(joint);
		this.CleanJoint(joint);
		return joint;
	}

	this.deleteSelection = function (force) {

		stopCustomBehaviour();

		const toBeDeletedPrefabs = []
		for (var key in this.selectedPrefabs) {
			if (this.selectedPrefabs.hasOwnProperty(key) && (!this.activePrefabs[key].class.constructor.playableCharacter || (Settings.admin || force))) {
				toBeDeletedPrefabs.push(this.activePrefabs[key]);
			}
		}
        this.deleteObjects([].concat(this.selectedPhysicsBodies, this.selectedTextures, toBeDeletedPrefabs));
		this.selectedPhysicsBodies = [];
		this.selectedTextures = [];
		this.selectedPrefabs = {};
		this.updateSelection();
	}

	this.markedForUnidentifiedPasting = [];
	this.copySelection = function () {
		let i;
		let body;
		const copyArray = [];
		let cloneObject;

		const prefabKeys = Object.keys(this.selectedPrefabs);

		if (this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0 && prefabKeys.length == 0) return;

		// sort all objects based on childIndex
		for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
			body = this.selectedPhysicsBodies[i];
			this.updateObject(body.mySprite, body.mySprite.data);

			cloneObject = JSON.parse(JSON.stringify(body.mySprite.data))

			copyArray.push({
				ID: cloneObject.ID,
				data: cloneObject
			})

			if (body.myTexture) {
				this.updateObject(body.myTexture, body.myTexture.data);
				cloneObject = this.parseArrObject(this.serializeObject(body.myTexture.data));
				copyArray.push({
					ID: cloneObject.ID,
					data: cloneObject
				});
			}
		}
		let sprite;
		for (i = 0; i < this.selectedTextures.length; i++) {
			sprite = this.selectedTextures[i];
			this.updateObject(sprite, sprite.data);

			cloneObject = this.parseArrObject(this.serializeObject(sprite.data));
			copyArray.push({
				ID: cloneObject.ID,
				data: cloneObject
			})
		}
		for (i = 0; i < prefabKeys.length; i++) {
			const prefab = this.activePrefabs[prefabKeys[i]];
			if (!PrefabManager.prefabLibrary[prefab.prefabName].class.forceUnique) {
				this.updateObject(null, prefab);

				// count children
				const lookupObject = prefab.class.lookupObject
				let childCount = lookupObject._bodies.length+lookupObject._textures.length+lookupObject._joints.length;
				lookupObject._bodies.forEach(body=>{
					if(body.myTexture) childCount++;
				})

				cloneObject = this.parseArrObject(this.serializeObject(prefab));
				copyArray.push({
					ID: prefab.ID,
					childCount,
					data: cloneObject,
					key: prefab.key
				});
			}
		}

		copyArray.sort(function (a, b) {
			return a.ID - b.ID;
		});
		// Fix copied joints (make sure no anchor body is null)
		let data, j;
		for (i = 0; i < copyArray.length; i++) {
			data = copyArray[i].data;
			if (data.type == this.object_JOINT) {
				//searching object A
				let foundBodyA = false;
				let realIndex = 0;

				for (j = 0; j < copyArray.length; j++) {

					const targetSprite = this.textures.children[data.bodyA_ID];
					const isPrefab = targetSprite.data.prefabInstanceName;
					if(isPrefab && copyArray[j].key === targetSprite.data.prefabInstanceName){
						const lowestChild = this.textures.getChildIndex(this.retreivePrefabChildAt(targetSprite, false));
						const relativeChild = data.bodyA_ID-lowestChild;
						foundBodyA = true;
						data.bodyA_ID = realIndex+relativeChild;
						break;
					}else if (copyArray[j].ID == data.bodyA_ID) {
						foundBodyA = true;
						data.bodyA_ID = realIndex;
						break;
					}
					realIndex += copyArray[j].childCount || 1;

				}
				let foundBodyB = false;
				realIndex = 0;
				if (data.bodyB_ID != undefined) {
					for (j = 0; j < copyArray.length; j++) {

						const targetSprite = this.textures.children[data.bodyB_ID];
						const isPrefab = targetSprite.data.prefabInstanceName;
						if(isPrefab && copyArray[j].key === targetSprite.data.prefabInstanceName){
							const lowestChild = this.textures.getChildIndex(this.retreivePrefabChildAt(targetSprite, false));
							const relativeChild = data.bodyB_ID-lowestChild;
							foundBodyB = true;
							data.bodyB_ID = realIndex+relativeChild;
							break;
						}else if (copyArray[j].ID == data.bodyB_ID) {
							foundBodyB = true;
							data.bodyB_ID = realIndex;
							break;
						}
						realIndex += copyArray[j].childCount || 1;

					}

				} else {
					foundBodyB = true;
				}

				if (!foundBodyA){
					// nullify incorrect pastes
					const attachedBody = this.textures.getChildAt(data.bodyA_ID).myBody;
					if(!attachedBody.copyHash) attachedBody.copyHash = nanoid(10);

					data.bodyA_ID = attachedBody.copyHash;
				}
				if (!foundBodyB){
					const attachedBody = this.textures.getChildAt(data.bodyB_ID).myBody;
					if(!attachedBody.copyHash) attachedBody.copyHash = nanoid(10);

					data.bodyB_ID = attachedBody.copyHash;
				}
			} else if (data.type == this.object_TEXTURE || data.type == this.object_GRAPHIC || data.type == this.object_GRAPHICGROUP || data.type == this.object_TEXT || data.type == this.object_ANIMATIONGROUP) {
				let realIndex = 0;
				for (j = 0; j < copyArray.length; j++) {
					if (copyArray[j].ID == data.bodyID) {
						data.bodyID = realIndex;
						break;
					}
					realIndex += copyArray[j].childCount || 1;
				}
			}
		}

		//fix copied triggerObjects
		let k;
		for (i = 0; i < copyArray.length; i++) {
			data = copyArray[i].data;
			if (data.type == this.object_TRIGGER) {
				for (j = 0; j < data.triggerObjects.length; j++) {
					var foundBody = -1;
					let realIndex = 0;
					for (k = 0; k < copyArray.length; k++) {
						if (data.triggerObjects[j] == copyArray[k].ID) {
							// NEED TO ACCOUNT FOR EXTRA BODIES BEING CREATED
							foundBody = realIndex;
							break;
						}
						realIndex += copyArray[k].childCount || 1;
					}
					if (foundBody >= 0) data.triggerObjects[j] = foundBody;
					else {
						const attachedSprite = this.textures.getChildAt(data.triggerObjects[j]);
						if(!attachedSprite.copyHash) attachedSprite.copyHash = nanoid(10);
						data.triggerObjects[j] = attachedSprite.copyHash;
					}
				}
			}
		}

		// fixed copied prefabs
		for (i = 0; i < copyArray.length; i++) {
			data = copyArray[i].data;
			if (data.type == this.object_PREFAB) {
				const propertiesToFix = PrefabManager.copyFixProperties[data.prefabName] || [];
				propertiesToFix.forEach( property => {
					const targetObject = data.settings[property];
					if(targetObject && Array.isArray(targetObject)){
						const newArr = [];
						targetObject.forEach(pid => {
							let foundBody = -1;
							let realIndex = 0;
							for (k = 0; k < copyArray.length; k++) {
								if (pid == copyArray[k].ID) {
									foundBody = realIndex;
									break;
								}
								realIndex += copyArray[k].childCount || 1;
							}
							if (foundBody >= 0){
								newArr.push(foundBody);
							};
						});
						if(newArr.length){
							data.settings[property] = newArr;
						}else{
							data.settings[property] = null;
						}
					}
				})
			}
		}

		let copyJSON = '{"objects":[';
		const copyCenterPoint = {
			x: 0,
			y: 0
		};
		// find center
		for (i = 0; i < copyArray.length; i++) {
			data = copyArray[i].data;
			if (data.type == this.object_BODY || data.type == this.object_TRIGGER) {
				copyCenterPoint.x += data.x * this.PTM;
				copyCenterPoint.y += data.y * this.PTM;

			} else {
				copyCenterPoint.x += data.x;
				copyCenterPoint.y += data.y;
			}
		}

		copyCenterPoint.x = copyCenterPoint.x / copyArray.length;
		copyCenterPoint.y = copyCenterPoint.y / copyArray.length;


		this.copiedCenterPosition.set_x(copyCenterPoint.x);
		this.copiedCenterPosition.set_y(copyCenterPoint.y);

		b2MulVec2(this.copiedCenterPosition, 1/Settings.PTM);

		//adjust center and build string
		for (i = 0; i < copyArray.length; i++) {
			if (i != 0) copyJSON += ',';
			data = copyArray[i].data;
			data.ID = i;
			if (data.type == this.object_BODY || data.type == this.object_TRIGGER) {
				data.x -= copyCenterPoint.x / this.PTM;
				data.y -= copyCenterPoint.y / this.PTM;
			}else {
				data.x -= copyCenterPoint.x;
				data.y -= copyCenterPoint.y;
			}
			copyJSON += this.serializeObject(data, true);
		}

		copyJSON += ']}';
		if(Settings.admin){
			console.info("*******************COPY JSON*********************");
			console.info(copyJSON);
			console.info("*************************************************");
		}

		if (copyArray.length !== 0){
			try{
				copyStringToClipboard(`${Settings.jollyDataPrefix}${LZString.compressToEncodedURIComponent(copyJSON)}>`);
			}catch(e){

			}
		}
		return copyJSON;
	}

	this.cutSelection = function () {
		this.copiedJSON = this.copySelection();
		if (this.copiedJSON != null) this.deleteSelection();
	}
	this.pasteData = function(compressedString){
		try{
			const copyJsonString = LZString.decompressFromEncodedURIComponent(compressedString);
			const jsonData = JSON.parse(copyJsonString);
			if(jsonData){
				this.copiedJSON = jsonData;
				this.pasteSelection();
			}
		}catch(e){
			//
		}
	}

	this.pasteSelection = function (oldPosition) {
		if(this.groupEditing) return;

		if (this.copiedJSON != null && this.copiedJSON != '') {
			var startChildIndex = this.textures.children.length;

			this.buildJSON(this.copiedJSON);

			this.selectedPhysicsBodies = [];
			this.selectedTextures = [];
			this.selectedPrefabs = {};

			const targetPosition = (oldPosition || this.shiftDown) ? this.copiedCenterPosition : this.mousePosWorld;

			var i;
			var sprite;
			var movX = - targetPosition.get_x() * this.PTM;
			var movY = - targetPosition.get_y() * this.PTM;

			for (i = startChildIndex; i < this.textures.children.length; i++) {
				sprite = this.textures.getChildAt(i);
				if (sprite.myBody != undefined && sprite.data.type != this.object_TEXTURE && sprite.data.type != this.object_GRAPHIC && sprite.data.type != this.object_GRAPHICGROUP && sprite.data.type != this.object_TEXT && sprite.data.type != this.object_ANIMATIONGROUP) {
					const pos = b2CloneVec2(sprite.myBody.GetPosition());
					pos.set_x(pos.get_x() - movX / this.PTM);
					pos.set_y(pos.get_y() - movY / this.PTM);

					sprite.myBody.SetTransform(pos, sprite.myBody.GetAngle())

					if (sprite.data.prefabInstanceName) this.selectedPrefabs[sprite.data.prefabInstanceName] = true;
					else this.selectedPhysicsBodies.push(sprite.myBody);
				} else {
					sprite.x -= movX;
					sprite.y -= movY;

					if (sprite.myBody == null) {
						if (sprite.data.prefabInstanceName) this.selectedPrefabs[sprite.data.prefabInstanceName] = true;
						else this.selectedTextures.push(sprite);
					}
				}
			}

			var prefabKeys = Object.keys(this.selectedPrefabs);
			for (i = 0; i < prefabKeys.length; i++) {
				this.activePrefabs[prefabKeys[i]].x -= movX;
				this.activePrefabs[prefabKeys[i]].y -= movY;
			}

			this.selectTool(this.tool_SELECT);
			this.updateSelection();
		}
	}
	this.doEditor = function () {
		this.clearDebugGraphics();

		if (this.selectedTool == this.tool_SELECT || this.selectedTool == this.tool_JOINTS) {
			if (this.selectingTriggerTarget) this.doTriggerTargetSelection();
			this.doSelection();
		} else if (this.selectedTool == this.tool_POLYDRAWING || this.selectedTool == this.tool_PEN) {
			this.doVerticesLineDrawing(this.selectedTool == this.tool_POLYDRAWING);
		} else if (this.selectedTool == this.tool_GEOMETRY || this.selectedTool == this.tool_TRIGGER) {
			this.doGeometryDrawing();
		} else if (this.selectedTool == this.tool_CAMERA) {
			this.doCamera();
		} else if (this.selectedTool == this.tool_ART) {
			this.doVerticesDrawing();
		} else if (this.selectedTool == this.tool_VERTICEEDITING) {
			this.doVerticeEditing();
			if(this.verticeEditingSprite.selectedVertice === undefined && this.verticeEditingSprite.selectedVerticePoint === undefined) this.doSelection();
		}

		if(this.editorSettingsObject.showPlayerHistory) this.drawPlayerHistory();

		if(this.editorSettingsObject.showCameraLines && this.selectedTool !== this.tool_VERTICEEDITING){
			const camera = this.cameraHolder;
			// Draw 0,0 reference

			const colorLight = "0x0affff";
			const colorDark = "0x015d5d"
			const lineAlpha = 0.5;
			const lineWidth = 2;

			let crossSize = 20;
			this.debugGraphics.lineStyle(lineWidth, colorLight, lineAlpha);

			this.debugGraphics.moveTo(camera.x, -crossSize + camera.y);
			this.debugGraphics.lineTo(camera.x, crossSize + camera.y);
			this.debugGraphics.moveTo(-crossSize + camera.x, camera.y);
			this.debugGraphics.lineTo(crossSize + camera.x, camera.y);

			this.debugGraphics.moveTo(camera.x - editorSettings.worldSize.width / 2 * camera.scale.x, -crossSize + camera.y);
			this.debugGraphics.lineTo(camera.x - editorSettings.worldSize.width / 2 * camera.scale.x, crossSize + camera.y);
			this.debugGraphics.moveTo(-crossSize + camera.x - editorSettings.worldSize.width / 2 * camera.scale.x, camera.y);
			this.debugGraphics.lineTo(crossSize + camera.x - editorSettings.worldSize.width / 2 * camera.scale.x, camera.y);

			this.debugGraphics.moveTo(camera.x + editorSettings.worldSize.width / 2 * camera.scale.x, -crossSize + camera.y);
			this.debugGraphics.lineTo(camera.x + editorSettings.worldSize.width / 2 * camera.scale.x, crossSize + camera.y);
			this.debugGraphics.moveTo(-crossSize + camera.x + editorSettings.worldSize.width / 2 * camera.scale.x, camera.y);
			this.debugGraphics.lineTo(crossSize + camera.x + editorSettings.worldSize.width / 2 * camera.scale.x, camera.y);

			crossSize = 10;
			this.debugGraphics.lineStyle(lineWidth, colorDark, lineAlpha);

			this.debugGraphics.moveTo(camera.x, -crossSize + camera.y);
			this.debugGraphics.lineTo(camera.x, crossSize + camera.y);
			this.debugGraphics.moveTo(-crossSize + camera.x, camera.y);
			this.debugGraphics.lineTo(crossSize + camera.x, camera.y);

			this.debugGraphics.moveTo(camera.x - editorSettings.worldSize.width / 2 * camera.scale.x, -crossSize + camera.y);
			this.debugGraphics.lineTo(camera.x - editorSettings.worldSize.width / 2 * camera.scale.x, crossSize + camera.y);
			this.debugGraphics.moveTo(-crossSize + camera.x - editorSettings.worldSize.width / 2 * camera.scale.x, camera.y);
			this.debugGraphics.lineTo(crossSize + camera.x - editorSettings.worldSize.width / 2 * camera.scale.x, camera.y);

			this.debugGraphics.moveTo(camera.x + editorSettings.worldSize.width / 2 * camera.scale.x, -crossSize + camera.y);
			this.debugGraphics.lineTo(camera.x + editorSettings.worldSize.width / 2 * camera.scale.x, crossSize + camera.y);
			this.debugGraphics.moveTo(-crossSize + camera.x + editorSettings.worldSize.width / 2 * camera.scale.x, camera.y);
			this.debugGraphics.lineTo(crossSize + camera.x + editorSettings.worldSize.width / 2 * camera.scale.x, camera.y);


			const cameraRealWidth = Settings.targetResolution.x * camera.scale.x;
			const cameraRealHeight = Settings.targetResolution.y * camera.scale.x;

			const playerPosition = this.getPlayerPosition();

			if(playerPosition){

				playerPosition.x *= camera.scale.x;
				playerPosition.x += camera.x;
				playerPosition.y *= camera.scale.x;
				playerPosition.y += camera.y;

				this.debugGraphics.lineStyle(lineWidth, colorLight, lineAlpha);
				this.debugGraphics.drawRect(playerPosition.x - cameraRealWidth / 2, playerPosition.y - cameraRealHeight / 2, cameraRealWidth, cameraRealHeight);

				const cameraCornerSize = 200;
				this.debugGraphics.lineStyle(lineWidth, colorDark, lineAlpha);
				// TL
				this.debugGraphics.moveTo(playerPosition.x - cameraRealWidth / 2 + cameraCornerSize * camera.scale.x, playerPosition.y - cameraRealHeight / 2);
				this.debugGraphics.lineTo(playerPosition.x - cameraRealWidth / 2, playerPosition.y - cameraRealHeight / 2);
				this.debugGraphics.lineTo(playerPosition.x - cameraRealWidth / 2, playerPosition.y - cameraRealHeight / 2 + cameraCornerSize * camera.scale.x);

				// TR
				this.debugGraphics.moveTo(playerPosition.x + cameraRealWidth / 2 - cameraCornerSize * camera.scale.x, playerPosition.y - cameraRealHeight / 2);
				this.debugGraphics.lineTo(playerPosition.x + cameraRealWidth / 2, playerPosition.y - cameraRealHeight / 2);
				this.debugGraphics.lineTo(playerPosition.x + cameraRealWidth / 2, playerPosition.y - cameraRealHeight / 2 + cameraCornerSize * camera.scale.x);

				// BL
				this.debugGraphics.moveTo(playerPosition.x - cameraRealWidth / 2 + cameraCornerSize * camera.scale.x, playerPosition.y + cameraRealHeight / 2);
				this.debugGraphics.lineTo(playerPosition.x - cameraRealWidth / 2, playerPosition.y + cameraRealHeight / 2);
				this.debugGraphics.lineTo(playerPosition.x - cameraRealWidth / 2, playerPosition.y + cameraRealHeight / 2 - cameraCornerSize * camera.scale.x);

				// BR
				this.debugGraphics.moveTo(playerPosition.x + cameraRealWidth / 2 - cameraCornerSize * camera.scale.x, playerPosition.y + cameraRealHeight / 2);
				this.debugGraphics.lineTo(playerPosition.x + cameraRealWidth / 2, playerPosition.y + cameraRealHeight / 2);
				this.debugGraphics.lineTo(playerPosition.x + cameraRealWidth / 2, playerPosition.y + cameraRealHeight / 2 - cameraCornerSize * camera.scale.x);

			}
		}

		if(this.selectedTool === this.tool_TRIGGER){
			trigger.drawEditorTriggerTargets(this.triggerObjects);
		}

		trigger.drawEditorTriggers();

		this.doEditorGUI();
	}
	this.clearDebugGraphics = function(){
		// if(Settings.admin && this.shiftDown) return;
		this.debugGraphics.clear();
		while (this.debugGraphics.children.length > 0) {
			const child = this.debugGraphics.getChildAt(0);
			this.debugGraphics.removeChild(child);
		}
	}
	this.updateBodyPosition = function (body) {
		if (body.myTexture) {

			let textureOffsetAngle = body.myTexture.data.texturePositionOffsetAngle;

 			if(body.myTexture.data.mirrored){
				let x = 1*Math.cos(textureOffsetAngle);
				let y = 1*Math.sin(textureOffsetAngle);
				x *= -1;
				textureOffsetAngle = Math.atan2(y, x);
			}

			const angle = body.GetAngle() - textureOffsetAngle;
			body.myTexture.x = body.GetPosition().get_x() * this.PTM + body.myTexture.data.texturePositionOffsetLength * Math.cos(angle);
			body.myTexture.y = body.GetPosition().get_y() * this.PTM + body.myTexture.data.texturePositionOffsetLength * Math.sin(angle);

			// body.mySprite.x = body.GetPosition().get_x() * this.PTM;
			// body.mySprite.y = body.GetPosition().get_y() * this.PTM;
			//if(body.myTexture.rotation !=  body.GetAngle() - body.myTexture.data.textureAngleOffset) // pixi updatetransform fix
			body.myTexture.rotation = body.GetAngle() - body.myTexture.data.textureAngleOffset;

		}
		if (body.mySprite && body.mySprite.visible) {
			body.mySprite.x = body.GetPosition().get_x() * this.PTM;
			body.mySprite.y = body.GetPosition().get_y() * this.PTM;
			//if(body.mySprite.rotation != body.GetAngle()) // pixi updatetransform fix
			body.mySprite.rotation = body.GetAngle();

			if(body.myTileSprite && body.myTileSprite.fixTextureRotation) {
				body.myTileSprite.updateMeshVerticeRotation();
			}
		}
	}

	this.run = function () {
		//update textures

		// update decal task
		const all = DS.getAllSystems();
		all.forEach((e) => {
			e.flushDecalTasks();
		});
		const deltaTime = Settings.timeStep * this.editorSettingsObject.gameSpeed;
		this.deltaTime = deltaTime;
		this.deltaTimeSeconds = this.deltaTime / 1000;

		FPSManager.update(deltaTime);

		// clean emscripten bodies
		if(this.bodiesDestroyedThisFrame.length){
			this.bodiesDestroyedThisFrame.forEach( body => this.CleanBody(body));
			this.bodiesDestroyedThisFrame.length = 0;
		}

		if (game.gameState == game.GAMESTATE_EDITOR) {
			if(this.editing){
				this.doEditor();
			} else if(!game.pause){
				this.recordPlayerHistoryTime -= this.deltaTime;
				if(this.editorSettingsObject.showPlayerHistory && game.character && (this.recordPlayerHistoryTime<0 || this.playerHistory.length == 0)){
					const recordPerSecond = 4;
					const maxRecordTime = 30;
					const frame = [];
					const lookup = game.character.lookupObject
					const color = '0x'+Math.floor(Math.random()*16777215).toString(16);
					if(lookup.body) frame[0] = [color, lookup.body.GetPosition().get_x(), lookup.body.GetPosition().get_y(), lookup.body.GetAngle()];
					if(lookup.head) frame[1] = [color, lookup.head.GetPosition().get_x(), lookup.head.GetPosition().get_y()];
					this.playerHistory.push(frame);
					if(this.playerHistory.length>maxRecordTime*recordPerSecond) this.playerHistory.shift();
					this.recordPlayerHistoryTime = 1000/recordPerSecond;
				}
			}
		}

		for (let body = this.world.GetBodyList(); getPointer(body) !== getPointer(NULL); body = body.GetNext()) {
			if(body.lockPositionForOneFrame){
				// fixes PostSolve displacements (e.g. Arrow)
				body.SetTransform(body.lockPositionForOneFrame, body.GetAngle());
				delete body.lockPositionForOneFrame;
			}
			this.updateBodyPosition(body);
		}

		//update objects
		game.canvas.style.cursor = 'unset';
		if (!this.editing && !game.pause) {
			var key;
			for (key in this.activePrefabs) {
				if (this.activePrefabs.hasOwnProperty(key)) {
					this.activePrefabs[key].class.update();
				}
			}
			for (let i = 0; i < this.triggerObjects.length; i++) {
				this.triggerObjects[i].class.update();
			}
			this.handleParallax();
			//handle animations
			this.animationGroups.forEach(animationGroup=>{
				if(animationGroup.playing) animationGroup.updateAnimation(this.deltaTime);
			})
			physicsCullCamera.update();
			this.processQueueDecalToBody();
			BodyBreakable.update();
		}
	}

	this.handleParallax = function(){
		const camera = this.cameraHolder;

		for(const sprite of this.parallaxObject) {
			// never use a window value, because it can has side effects if window will embeded
			const oX = (camera.x - window.innerWidth / 2);
			const oY = (camera.y - window.innerHeight / 2);

			if (sprite.data.parallax){
				sprite.x = -oX / camera.scale.x * sprite.data.parallax + sprite.parallaxStartPosition.x;
				sprite.y = -oY / camera.scale.x * sprite.data.parallax + sprite.parallaxStartPosition.y;
			}

			if (sprite.data.repeatTeleportX){
				while (sprite.x + oX / camera.scale.x > sprite.data.repeatTeleportX)
					sprite.x -= sprite.data.repeatTeleportX * 2;

				while (sprite.x + oX / camera.scale.x < -sprite.data.repeatTeleportX)
					sprite.x += sprite.data.repeatTeleportX * 2;
			}

			if (sprite.data.repeatTeleportY) {
				while (sprite.y + oY / camera.scale.y > sprite.data.repeatTeleportY)
					sprite.y -= sprite.data.repeatTeleportY * 2;

				while (sprite.y + oY / camera.scale.y < -sprite.data.repeatTeleportY)
					sprite.y += sprite.data.repeatTeleportY * 2;
			}
		}
	}

	this.object_BODY = 0;
	this.object_TEXTURE = 1;
	this.object_JOINT = 2;
	this.object_PREFAB = 4;
	this.object_MULTIPLE = 5;
	this.object_GRAPHIC = 6;
	this.object_GRAPHICGROUP = 7;
	this.object_TRIGGER = 8;
	this.object_TEXT = 9;
	this.object_SETTINGS = 10;
	this.object_ANIMATIONGROUP = 11;

	const self = this;
	this.bodyObject = function () {
		this.type = self.object_BODY;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		//
		this.ID = 0;
		this.colorFill = "#999999";
		this.colorLine = "#000";
		this.transparancy = 1.0;
		this.fixed = true;
		this.awake = true;
		this.vertices = [{
			x: 0,
			y: 0
		}, {
			x: 0,
			y: 0
		}];
		this.density = 1;
		this.collision = 0;
		this.radius = 0;
		this.tileTexture = "";
		this.lockselection = false;
		this.lineWidth = 1.0;
		this.visible = true;
		this.instaKill = false;
		this.isVehiclePart = false;
		this.restitution = Settings.defaultRestitution;
		this.friction = Settings.defaultFriction;
		this.fixedRotation = false;
		this.optimizePhysics = true;
		this.bulletCollision = false;
		this.breakable = false;
		this.groupOpacity = 1.0;
	}
	this.textureObject = function () {
		this.type = self.object_TEXTURE;
		this.x = null;
		this.y = null;
		this.scaleX = 1.0;
		this.scaleY = 1.0;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		//
		this.ID = 0;
		this.textureName = null;
		this.bodyID = null;
		this.texturePositionOffsetLength = null;
		this.texturePositionOffsetAngle = null;
		this.textureAngleOffset = null;
		this.isCarvable = false;
		this.tint = '#FFFFFF';
		this.transparancy = 1.0;
		this.lockselection = false;
		this.parallax = 0.0;
		this.repeatTeleportX = 0;
		this.repeatTeleportY = 0;
		this.visible = true;
	}
	this.graphicGroup = function () {
		this.type = self.object_GRAPHICGROUP;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		this.ID = 0;
		this.graphicObjects = [];
		this.bodyID = null;
		this.texturePositionOffsetLength = null;
		this.texturePositionOffsetAngle = null;
		this.textureAngleOffset = null;
		this.transparancy = 1;
		this.tileTexture = '';
		this.lockselection = false;
		this.parallax = 0.0;
		this.repeatTeleportX = 0;
		this.repeatTeleportY = 0;
		this.visible = true;
		this.mirrored = false;
		this.colorMatrix = [];
	}
	this.animationGroup = function () {
		this.type = self.object_ANIMATIONGROUP;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		this.ID = 0;
		this.graphicObjects = [];
		this.bodyID = null;
		this.texturePositionOffsetLength = null;
		this.texturePositionOffsetAngle = null;
		this.textureAngleOffset = null;
		this.transparancy = 1;
		this.tileTexture = '';
		this.lockselection = false;
		this.parallax = 0.0;
		this.repeatTeleportX = 0;
		this.repeatTeleportY = 0;
		this.fps = 12;
		this.playing = true;
		this.loop = true;
		this.visible = true;
		this.mirrored = false;
	}
	this.graphicObject = function () {
		this.type = self.object_GRAPHIC;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		this.ID = 0;
		this.colorFill = "#999999";
		this.colorLine = "#000";
		this.transparancy = 1.0;
		this.radius;
		this.vertices = [{
			x: 0,
			y: 0
		}, {
			x: 0,
			y: 0
		}];
		this.bodyID = null;
		this.texturePositionOffsetLength = null;
		this.texturePositionOffsetAngle = null;
		this.textureAngleOffset = null;
		this.tileTexture = "";
		this.lockselection = false;
		this.lineWidth = 1.0;
		this.parallax = 0.0;
		this.repeatTeleportX = 0;
		this.repeatTeleportY = 0;
		this.gradient = '';
		this.visible = true;
	}
	this.jointObject = function () {
		this.type = self.object_JOINT;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		//
		this.bodyA_ID;
		this.bodyB_ID;
		this.jointType = 0;
		this.collideConnected = false;
		this.enableMotor = false;
		this.maxMotorTorque = 1.0;
		this.motorSpeed = 10.0;
		this.enableLimit = false;
		this.upperAngle = 0.0;
		this.lowerAngle = 0.0;
		this.dampingRatio = 0.0;
		this.frequencyHz = 5.0;
		this.upperLimit = 0.0;
		this.lowerLimit = 0.0;
		this.lockselection = false;
		this.autoReferenceAngle = true;
	}
	this.triggerObject = function () {
		this.type = self.object_TRIGGER;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		this.ID = 0;
		//
		this.vertices = [{
			x: 0,
			y: 0
		}, {
			x: 0,
			y: 0
		}];
		this.radius;
		this.enabled = true;
		this.targetType = 0;
		this.repeatType = 0;
		this.triggerObjects = [];
		this.triggerActions = [];
		this.followPlayer = false;
		this.worldActions = [];
		this.triggerKey = 32;
		this.followFirstTarget = false;
		this.lockselection = false;
		this.delay = 0;
		this.repeatDelay = 0;
		this.randomTarget = false;
		this.checkpointPersistent = false;
	}
	this.textObject = function () {
		this.type = self.object_TEXT;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.groups = "";
		this.refName = "";
		this.ID = 0;
		this.text = 'Write your text here';
		this.textColor = "#FFF";
		this.transparancy = 1.0;
		this.fontSize = 12;
		this.fontName = "Arial";
		this.textAlign = 'left';
		this.lockselection = false;
		this.parallax = 0.0;
		this.repeatTeleportX = 0;
		this.repeatTeleportY = 0;
		this.visible = true;
	}
	this.multiObject = function () {
		this.type = self.object_MULTIPLE;
		this.x = 0;
		this.y = 0;
		this.rotation = 0;
		this.groups = "";
		this.lockselection = false;
	}
	this.lookupObject = function () {
		this._bodies = [];
		this._textures = [];
		this._joints = [];
	}

	this.prefabObject = function () {
		this.x = 0;
		this.y = 0;
		this.rotation = 0;
		this.type = self.object_PREFAB;
		this.settings;
		this.prefabName;
	}
	this.editorSettingsObject = new function () {
		this.type = self.object_SETTINGS;
		this.physicsDebug = (window.location.search.indexOf('physicsDebug=true')>=0);
		this.stats = (window.location.search.indexOf('stats=true')>=0);
		this.gravityX = 0;
		this.gravityY = 10;
		this.showPlayerHistory = false;
		this.showCameraLines = true;
		this.backgroundColor = 0xD4D4D4;
		this.cameraZoom = Settings.defaultCameraZoom;
		this.cameraEase = Settings.defaultCameraEase;
		this.gameSpeed = 1.0;
		this.physicsCameraSize = Settings.defaultPhysicsCameraSize;
		this.colorMatrix = [];
		this.song = undefined;
		this.autoPlayMidi = true;
		this.resetMidiOnRetry = true;
	}
	this.editorJointObject = new this.jointObject();

	this.editorGraphicDrawingObject = new function () {
		this.colorFill = "#999999";
		this.colorLine = "#000";
		this.lineWidth = 0;
		this.transparancy = 1.0;
		this.smoothen = true;
	}
	this.editorGeometryObject = new function () {
		this.shape = 0;
		this.colorFill = "#999999";
		this.colorLine = "#000";
		this.lineWidth = 0;
		this.transparancy = 1.0;
		this.isBody = true;
	}
	this.editorTextObject = new function () {
		this.textColor = "#000";
		this.transparancy = 1.0;
		this.fontSize = 50;
		this.fontName = "Arial";
		this.textAlign = 'left';
	}
	this.editorTriggerObject = new function () {
		this.shape = 0;
		this.radius = 50;
		this.width = 50;
		this.height = 50;
	}
	this.cameraShotCallBack;
	this.takeCameraShot = function () {
		//first clean up screen
		this.debugGraphics.clear();
		game.newDebugGraphics.clear();
		let i;
		for (i = 0; i < this.editorIcons.length; i++) {
			this.editorIcons[i].visible = false;
		}
		game.app.render();
		//
		let imageData = this.canvas.toDataURL('image/png', 1);
		let image = new Image();
		image.src = imageData;
		const canvas = document.createElement('canvas');
		const context = canvas.getContext("2d");
		const self = this;
		image.onload = function () {
			//highRes;
			const scale = Settings.pixelRatio;
			canvas.width = self.cameraSize.w * scale;
			canvas.height = self.cameraSize.h * scale;
			context.drawImage(image, (self.mousePosPixel.x - self.cameraSize.w / 2) * Settings.pixelRatio, (self.mousePosPixel.y - self.cameraSize.h / 2) * Settings.pixelRatio, self.cameraSize.w*Settings.pixelRatio, self.cameraSize.h*Settings.pixelRatio, 0, 0, canvas.width, canvas.height);
			const highResThumb = canvas.toDataURL('image/png', 1.0);

			self.cameraShotData = highResThumb;

			self.cameraShotCallBack();

			self.selectTool(self.tool_SELECT);

			console.log("Camera Shot Succesfull");
		}
		for (i = 0; i < this.editorIcons.length; i++) {
			if (!this.editorIcons[i].isPrefabJointGraphic) this.editorIcons[i].visible = true;
		}
	}
	this.findPlayer = function(){
		const playerPosition = this.getPlayerPosition();
		const cameraHolder = B2dEditor.container.camera || B2dEditor.container;
		if(playerPosition){
			playerPosition.x -= window.innerWidth / 2.0 / cameraHolder.scale.x;
			playerPosition.y -= window.innerHeight / 2.0 / cameraHolder.scale.y;
			playerPosition.x *= cameraHolder.scale.x;
			playerPosition.y *= cameraHolder.scale.y;
			camera.set({x:-playerPosition.x, y:-playerPosition.y});

			scrollBars.update();
		}
	}
	this.getPlayerPosition = function(){
		for (let key in this.activePrefabs) {
            if (this.activePrefabs.hasOwnProperty(key)) {
                if (this.activePrefabs[key].class.constructor.playableCharacter) {

					const targetBody = this.activePrefabs[key].class.lookupObject['body'];

					let cameraTargetX = targetBody.GetPosition().get_x()*this.PTM;
					let cameraTargetY = targetBody.GetPosition().get_y()*this.PTM;

					return {x:cameraTargetX, y: cameraTargetY}
                }
            }
		}
		return null;
	}

	this.onMouseDown = function (evt) {
		const camera = B2dEditor.container.camera || B2dEditor.container;
		if (this.editing && evt.which !== 2) {
			if (this.spaceDown) {
				this.spaceCameraDrag = true;
			} else if (this.selectingTriggerTarget) {
				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.get_x(), this.mousePosWorld.get_y());
			} else if(this.customPrefabMouseDown){
				this.customPrefabMouseDown();
			} else if (this.selectedTool == this.tool_SELECT) {
				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.get_x(), this.mousePosWorld.get_y());

				// detect click on transformGUI
				if(this.transformGUI && this.transformGUI.visible && this.clickOnTransformGUI()) return;

				var aabb = new b2AABB();
				aabb.get_lowerBound().Set(this.mousePosWorld.get_x(), this.mousePosWorld.get_y());
				aabb.get_upperBound().Set(this.mousePosWorld.get_x(), this.mousePosWorld.get_y());
				if(!this.selectedBoundingBox) return;

				const clickInsideSelection = this.selectedBoundingBox.Contains(aabb);

				destroy(aabb);

				if (!clickInsideSelection || this.shiftDown || this.ctrlDown) {
					//reset selectionie
					let oldSelectedPhysicsBodies = [];
					let oldSelectedTextures = [];
					let oldSelectedPrefabs = {};

					if (this.shiftDown || this.ctrlDown) {
						oldSelectedPhysicsBodies = this.selectedPhysicsBodies;
						oldSelectedTextures = this.selectedTextures;
						oldSelectedPrefabs = JSON.parse(JSON.stringify(this.selectedPrefabs));
					}

					this.selectedPrefabs = {};
					this.selectedPhysicsBodies = [];
					this.selectedTextures = [];

					this.deepClickDetection = b2CloneVec2(this.mousePosWorld);

					let highestObject = this.retrieveHighestSelectedObject(this.startSelectionPoint, this.startSelectionPoint);
					if (highestObject) {
						if (highestObject.data.prefabInstanceName) {
							this.selectedPrefabs[highestObject.data.prefabInstanceName] = true;
						} else {
							if (highestObject.data.type == this.object_BODY || highestObject.myBody) {
								if (highestObject.myBody) this.selectedPhysicsBodies = [highestObject.myBody];
								else this.selectedPhysicsBodies = [highestObject];
							} else {
								this.selectedTextures = [highestObject];
							}
						}
					}
					//
					if (this.shiftDown) {
						//push old selection
						let i;
						for (i = 0; i < oldSelectedPhysicsBodies.length; i++) {
							if (oldSelectedPhysicsBodies[i] != this.selectedPhysicsBodies[0]) {
								this.selectedPhysicsBodies.unshift(oldSelectedPhysicsBodies[i]);
								this.selectedPhysicsBodies = [...new Set(this.selectedPhysicsBodies)]; // deduplicate
							}
						}
						for (i = 0; i < oldSelectedTextures.length; i++) {
							if (oldSelectedTextures[i] != this.selectedTextures[0]) {
								this.selectedTextures.unshift(oldSelectedTextures[i]);
								this.selectedTextures = [...new Set(this.selectedTextures)]; // deduplicate
							}
						}
						for (var key in oldSelectedPrefabs) {
							if (oldSelectedPrefabs.hasOwnProperty(key)) {
								this.selectedPrefabs[key] = true;
							}
						}
					}else if(this.ctrlDown){
						// filter selected object
						this.selectedPhysicsBodies = oldSelectedPhysicsBodies.filter(body=>!this.selectedPhysicsBodies.includes(body));
						this.selectedTextures = oldSelectedTextures.filter(texture=>!this.selectedTextures.includes(texture));
						Object.keys(this.selectedPrefabs).forEach(key=>delete oldSelectedPrefabs[key]);
						this.selectedPrefabs = oldSelectedPrefabs;
					}
					this.updateSelection();
				}else if(clickInsideSelection){

					const prefabKeys = Object.keys(this.selectedPrefabs);

					if(Date.now() < this.doubleClickTime){
						if(this.selectedTextures.length + this.selectedPhysicsBodies.length === 1){
							if(this.selectedTextures.length > 0){
								// editing sprite
								const targetSprite = this.selectedTextures[0];
								if(targetSprite.data.type === this.object_GRAPHIC && !targetSprite.data.radius){
									this.verticeEditingSprite = targetSprite;
									this.selectTool(this.tool_VERTICEEDITING);
								}else if(targetSprite.data.type === this.object_TEXT){
									this.openTextEditor();
								}else if(targetSprite.data.type === this.object_GRAPHICGROUP){
									startEditingGroup();
								}
							}else{
								// editing body
								const targetSprite = this.selectedPhysicsBodies[0].mySprite;
								if(targetSprite.data.vertices.length === 1 && !targetSprite.data.radius[0] && !targetSprite.myBody.myTexture){
									this.verticeEditingSprite = targetSprite;
									// convert convex right away to concave
									if(!Array.isArray(this.verticeEditingSprite.data.vertices[0][0])) this.verticeEditingSprite.data.vertices = [this.verticeEditingSprite.data.vertices];
									this.selectTool(this.tool_VERTICEEDITING);
								} else if(targetSprite.data.type === this.object_BODY && (targetSprite.data.vertices.length > 1 || targetSprite.myBody.myTexture)){
									startEditingGroup();
								}
							}
							this.doubleClickTime = 0;
						}else{
							const prefabKeys = Object.keys(this.selectedPrefabs);
							if(prefabKeys.length === 1){
								const prefabObject = this.activePrefabs[prefabKeys[0]];

								if(prefabObject.class.doubleClickCallback){
									prefabObject.class.doubleClickCallback();
								}
							}
							this.doubleClickTime = 0;
						}
					}else if(this.deepClickDetection !== null && (prefabKeys.length + this.selectedTextures.length + this.selectedPhysicsBodies.length === 1)){
						if(prefabKeys.length){
							const lookupObject = this.activePrefabs[prefabKeys[0]].class.lookupObject;
							const childs  = [].concat(lookupObject._bodies, lookupObject._textures);
							let targetSprite = childs[0].mySprite ? childs[0].mySprite : childs[0];

							const lowestPrefabChild = this.retreivePrefabChildAt(targetSprite, 0);
							const lowestIndex = lowestPrefabChild.parent.getChildIndex(lowestPrefabChild);

							this.deepClickMinimumLayer = lowestIndex;
						}else if(this.selectedPhysicsBodies.length > 0){
							const targetSprite = this.selectedPhysicsBodies[0].mySprite;
							this.deepClickMinimumLayer = targetSprite.parent.getChildIndex(targetSprite);

							const myTexture = targetSprite.myBody.myTexture;
						}else{
							const targetSprite = this.selectedTextures[0];
							this.deepClickMinimumLayer = targetSprite.parent.getChildIndex(targetSprite);
						}

						let highestObject = this.retrieveHighestSelectedObject(this.startSelectionPoint, this.startSelectionPoint, this.deepClickMinimumLayer);
						if (highestObject) {

							this.selectedPrefabs = {};
							this.selectedTextures.length = 0;
							this.selectedPhysicsBodies.length = 0;

							if (highestObject.data.prefabInstanceName) {
								this.selectedPrefabs[highestObject.data.prefabInstanceName] = true;
							} else {
								if (highestObject.data.type == this.object_BODY || highestObject.myBody) {
									if (highestObject.myBody) this.selectedPhysicsBodies = [highestObject.myBody];
									else this.selectedPhysicsBodies = [highestObject];
								} else {
									this.selectedTextures = [highestObject];
								}
							}

							this.updateSelection();
						}
					}else{
						let highestObject = this.retrieveHighestSelectedObject(this.startSelectionPoint, this.startSelectionPoint);
						if(!highestObject){
							this.selectedPrefabs = {};
							this.selectedTextures.length = 0;
							this.selectedPhysicsBodies.length = 0;
							this.updateSelection();
						}
					}

				}

			} else if (this.selectedTool == this.tool_POLYDRAWING || this.selectedTool == this.tool_PEN) {
				if (!this.closeDrawing) {
					if (!this.checkVerticeDrawingHasErrors()) {
						const newVertice = this.getCurrentMouseVertice();
						if (this.activeVertices.length < editorSettings.maxVertices) this.activeVertices.push(newVertice);
					}
				} else {
					if(this.selectedTool == this.tool_POLYDRAWING){
						this.activeVertices = verticeOptimize.simplifyPath(this.activeVertices, false, this.cameraHolder.scale.x);
						if (this.activeVertices && this.activeVertices.length > 2) {
							if(ui.editorGUI.editData.isBody){
								const bodyObject = this.createBodyFromEarcutResult(this.activeVertices);
								if (bodyObject){
									bodyObject.colorFill = [ui.editorGUI.editData.colorFill];
									bodyObject.colorLine = [ui.editorGUI.editData.colorLine];
									bodyObject.lineWidth = [ui.editorGUI.editData.lineWidth];
									bodyObject.transparancy = [ui.editorGUI.editData.transparancy];
									this.buildBodyFromObj(bodyObject);
								}
							}else{
								const graphicObject = this.createGraphicObjectFromVerts(this.activeVertices);
								if (graphicObject) {
									graphicObject.colorFill = ui.editorGUI.editData.colorFill;
									graphicObject.colorLine = ui.editorGUI.editData.colorLine;
									graphicObject.lineWidth = ui.editorGUI.editData.lineWidth;
									graphicObject.transparancy = ui.editorGUI.editData.transparancy;
									this.buildGraphicFromObj(graphicObject);
								}
							}
						}
					}else{
						if(this.activeVertices[0].tempPoint2){
							const lastVertice = this.activeVertices[this.activeVertices.length-1];
							lastVertice.point2 = this.activeVertices[0].tempPoint2;
							if(!lastVertice.point1){
								lastVertice.point1 = {x:lastVertice.x, y:lastVertice.y};
							}
							delete this.activeVertices[0].tempPoint2;
						}
						const graphicObject = this.createGraphicObjectFromVerts(this.activeVertices);
						if (graphicObject) {
							graphicObject.colorFill = ui.editorGUI.editData.colorFill;
							graphicObject.colorLine = ui.editorGUI.editData.colorLine;
							graphicObject.lineWidth = ui.editorGUI.editData.lineWidth;
							graphicObject.transparancy = ui.editorGUI.editData.transparancy;
							this.buildGraphicFromObj(graphicObject);
						}

					}
					this.activeVertices = [];
				}
			} else if (this.selectedTool == this.tool_GEOMETRY || this.selectedTool == this.tool_TRIGGER) {
				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.get_x(), this.mousePosWorld.get_y());
			} else if (this.selectedTool == this.tool_CAMERA) {
				this.takeCameraShot();
			} else if (this.selectedTool == this.tool_ART) {
				this.activeVertices.push({
					x: this.mousePosWorld.get_x(),
					y: this.mousePosWorld.get_y()
				});
			} else if (this.selectedTool == this.tool_JOINTS) {
				const joint = this.attachJointPlaceHolder();
				if(joint) jointTriggerLayer.add(joint);
			} else if (this.selectedTool == this.tool_TEXT) {
				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.get_x(), this.mousePosWorld.get_y());

				var textObject = new this.textObject;
				textObject.x = this.startSelectionPoint.x * this.PTM;
				textObject.y = this.startSelectionPoint.y * this.PTM;
				textObject.fontName = ui.editorGUI.editData.fontName;
				textObject.fontSize = ui.editorGUI.editData.fontSize;
				textObject.textColor = ui.editorGUI.editData.textColor;
				textObject.textColor = ui.editorGUI.editData.textColor;
				textObject.textAlign = ui.editorGUI.editData.textAlign;
				textObject.transparancy = ui.editorGUI.editData.transparancy;

				var _text = this.buildTextFromObj(textObject);

				this.selectedTextures = [_text];
				this.openTextEditor();

			} else if(this.selectedTool === this.tool_VERTICEEDITING){
				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.get_x(), this.mousePosWorld.get_y());

				delete this.verticeEditingSprite.selectedVerticePoint;
				const mousePixiPos = this.getPIXIPointFromWorldPoint(this.mousePosWorld);

				if(this.verticeEditingSprite.selectedVertice && this.verticeEditingSprite.data.type !== this.object_BODY){

					this.verticeEditingSprite.selectedVertice.forEach(verticeIndex => {
						const vertice = this.verticeEditingSprite.data.vertices[verticeIndex];
						let previousVertice = this.verticeEditingSprite.data.vertices[verticeIndex-1];
						if(verticeIndex === 0) previousVertice = this.verticeEditingSprite.data.vertices[this.verticeEditingSprite.data.vertices.length-1];

						const points = [];

						if(vertice.point1) points.push(vertice.point1);
						if(previousVertice.point2) points.push(previousVertice.point2);

						const closeDistance = Settings.handleClosestDistance;

						points.forEach( point => {

							const ignore = Math.abs(vertice.x-point.x) * this.cameraHolder.scale.x <= closeDistance && Math.abs(vertice.y-point.y) * this.cameraHolder.scale.x <= closeDistance;
							if(!ignore){
								const vpl = Math.sqrt(point.x*point.x + point.y*point.y);
								const vpa = this.verticeEditingSprite.rotation + Math.atan2(point.y, point.x);
								const vpx = vpl*Math.cos(vpa);
								const vpy = vpl*Math.sin(vpa);
								const verticePX = this.verticeEditingSprite.x + vpx;
								const verticePY = this.verticeEditingSprite.y + vpy;
								const difX = verticePX-mousePixiPos.x;
								const difY = verticePY-mousePixiPos.y;
								const minDistance = 5 / camera.scale.x;
								if(Math.abs(difX) < minDistance && Math.abs(difY) < minDistance){
									this.verticeEditingSprite.selectedVerticePointIndex = verticeIndex;
									this.verticeEditingSprite.selectedVerticePoint = point;
								}
							}
						})
					});
				}

				if(!this.verticeEditingSprite.selectedVerticePoint){
					// delete this.verticeEditingSprite.selectedVertice;

					const spriteData = this.verticeEditingSprite.data;
					let vertices = spriteData.type === this.object_BODY ? spriteData.vertices[0] : spriteData.vertices;
					if(spriteData.type === this.object_BODY){
						vertices = vertices.flat(2).map(point=> ({x:point.x*Settings.PTM, y:point.y*Settings.PTM}));
					}

					let clickVerticeIndex = -1;

					vertices.forEach((vertice, index) => {
						const vl = Math.sqrt(vertice.x*vertice.x + vertice.y*vertice.y);
						const va = this.verticeEditingSprite.rotation + Math.atan2(vertice.y, vertice.x);
						const vx = vl*Math.cos(va);
						const vy = vl*Math.sin(va);
						const verticeX = this.verticeEditingSprite.x + vx;
						const verticeY = this.verticeEditingSprite.y + vy;
						const difX = verticeX-mousePixiPos.x;
						const difY = verticeY-mousePixiPos.y;
						const minDistance = 5 / camera.scale.x;
						if(Math.abs(difX) < minDistance && Math.abs(difY) < minDistance){
							clickVerticeIndex = index;
						}
					});

					if(clickVerticeIndex === -1){
						delete this.verticeEditingSprite.selectedVertice;
					}else{
						if(this.verticeEditingSprite.selectedVertice){
							if(!this.verticeEditingSprite.selectedVertice.includes(clickVerticeIndex)){
								if(this.shiftDown){
									this.verticeEditingSprite.selectedVertice.push(clickVerticeIndex);
								}else{
									this.verticeEditingSprite.selectedVertice = [clickVerticeIndex];
								}
							}else if(this.ctrlDown){
								// included
								this.verticeEditingSprite.selectedVertice = this.verticeEditingSprite.selectedVertice.filter( index => index !== clickVerticeIndex );
							}
						}else{
							this.verticeEditingSprite.selectedVertice = [clickVerticeIndex];
						}
					}
				}

				if(!this.verticeEditingSprite.selectedVertice && this.verticeEditingSprite.highlightVertice){
					// add a new vertice

					const spriteData = this.verticeEditingSprite.data;
					let vertices = spriteData.type === this.object_BODY ? spriteData.vertices[0] : spriteData.vertices;
					if(Array.isArray(vertices[0])) vertices = vertices[0];

					if(spriteData.type === this.object_BODY){
						const vertice = this.verticeEditingSprite.highlightVertice;
						vertice.x /= Settings.PTM;
						vertice.y /= Settings.PTM;
						vertices.splice(this.verticeEditingSprite.highlightVerticeIndex+1, 0, vertice);
						this.updateBodyFixtures(this.verticeEditingSprite.myBody);
						this.updateBodyShapes(this.verticeEditingSprite.myBody);
						this.verticeEditingSprite.selectedVertice = [this.verticeEditingSprite.highlightVerticeIndex+1];
					}else{
						vertices.splice(this.verticeEditingSprite.highlightVerticeIndex+1, 0, this.verticeEditingSprite.highlightVertice);
						this.updateGraphicShapes(this.verticeEditingSprite);
						this.verticeEditingSprite.selectedVertice = [this.verticeEditingSprite.highlightVerticeIndex+1];
					}

					delete this.verticeEditingSprite.highlightVertice;
					delete this.verticeEditingSprite.highlightVerticeIndex;
				}

			}else if([this.tool_SPECIALS, this.tool_SETTINGS].includes(this.selectedTool)){

				const ignoreClickOnGUI = [ui.editorGUI, ui.helpScreen, ui.gradientEditor, ui.assetGUI];
				// detect mouse on gui
				ignoreClickOnGUI.forEach( gui => {
					if(gui && gui.domElement){
						if(!gui.cachedBounds){
							gui.cachedBounds = gui.domElement.getBoundingClientRect();
						}
						if(!(this.mouseDocumentPosPixel.x > gui.cachedBounds.x && this.mouseDocumentPosPixel.x < gui.cachedBounds.x+gui.cachedBounds.width 
							&& this.mouseDocumentPosPixel.y > gui.cachedBounds.y && this.mouseDocumentPosPixel.y < gui.cachedBounds.y+gui.cachedBounds.height)){
							this.selectTool(this.tool_SELECT);
							this.onMouseDown(evt);
							return;
						}
					}
				});

			}

		}
		this.updateMousePosition(evt);
		this.mouseDown = true;
		if(evt.which === 2) this.middleMouseDown = true;
	}
	this.onMouseMove = function (evt) {
		this.updateMousePosition(evt);
		if (this.oldMousePosWorld == null) this.oldMousePosWorld = this.mousePosWorld;

		let clearMousePos = true;

		if (this.editing) {
			if(this.customPrefabMouseMove){
				this.customPrefabMouseMove();
			}else if (this.mouseDown) {
				var move = new b2Vec2(this.mousePosWorld.get_x() - this.oldMousePosWorld.x, this.mousePosWorld.get_y() - this.oldMousePosWorld.y);

				if(this.shiftDown){
					move.x = Math.round((move.x * Settings.PTM) / Settings.positionGridSize) * Settings.positionGridSize;
					move.y = Math.round((move.y * Settings.PTM) / Settings.positionGridSize) * Settings.positionGridSize;

					if(Math.abs(move.x) < Settings.positionGridSize && Math.abs(move.y) < Settings.positionGridSize){
						clearMousePos = false;
					}
					move.x /= Settings.PTM;
					move.y /= Settings.PTM;
				}

				if (this.spaceCameraDrag || evt.which === 2) {
					b2MulVec2(move, this.cameraHolder.scale.x);
					camera.pan(move);
					scrollBars.update();
				} else if (this.selectedTool == this.tool_SELECT && !this.selectingTriggerTarget) {
					if (this.mouseTransformType == this.mouseTransformType_Movement) {
						this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
							x: move.x * this.PTM,
							y: move.y * this.PTM
						});
					} else if (this.mouseTransformType == this.mouseTransformType_Rotation) {
						this.applyToSelectedObjects(this.TRANSFORM_ROTATE, move.x * this.PTM / 10);
					}
					game.triggerDebugDraw.debounceRedraw();
				} else if(this.selectedTool == this.tool_PEN && this.activeVertices.length){

					const mouseVertice = this.getCurrentMouseVertice();

					const vertice = this.activeVertices[this.activeVertices.length-1];
					const previousVertice = this.activeVertices[this.activeVertices.length-2];
					const dx = vertice.x-mouseVertice.x;
					const dy = vertice.y-mouseVertice.y;
					const angle = Math.atan2(dy, dx);
					const dl = Math.sqrt(dx*dx + dy*dy);

					const minDistance = 0.5 / this.cameraHolder.scale.x;

					if(dl > minDistance && dl > minDistance){
						vertice.point1 = {x:vertice.x-dl*Math.cos(angle), y:vertice.y-dl*Math.sin(angle)}
					}else{
						delete vertice.point1;
					}

					if(previousVertice){
						if(dl > minDistance && dl > minDistance){
							previousVertice.point2 = {x:vertice.x+dl*Math.cos(angle), y:vertice.y+dl*Math.sin(angle)}
							if(!previousVertice.point1){
								previousVertice.point1 = {x:previousVertice.x, y:previousVertice.y};
							}
						}
					}else{
						if(dl > minDistance && dl > minDistance){
							vertice.tempPoint2 = {x:vertice.x+dl*Math.cos(angle), y:vertice.y+dl*Math.sin(angle)}
						}else{
							delete vertice.tempPoint2;
						}
					}


				}else if (this.selectedTool == this.tool_ART) {

					const camera = B2dEditor.container.camera || B2dEditor.container;

					let canPlace = this.activeVertices.length < editorSettings.maxVertices;

					const previousVertice = this.activeVertices[this.activeVertices.length-1];

					if(previousVertice){
						const dx = this.mousePosWorld.get_x()-previousVertice.x;
						const dy = this.mousePosWorld.get_y()-previousVertice.y;
						const dl = Math.sqrt(dx*dx + dy*dy);
						if(dl < Settings.minimumArtToolMovement/camera.scale.x){
							canPlace = false;
						}
					}

					if(canPlace){
						this.activeVertices.push({
							x: this.mousePosWorld.get_x(),
							y: this.mousePosWorld.get_y()
						});
					}
					this.preOptimizeArtVertices();

				}else if(this.selectedTool === this.tool_VERTICEEDITING){
					if(this.verticeEditingSprite.selectedVertice){
						const difX = (this.mousePosWorld.get_x()-this.oldMousePosWorld.x)*this.PTM;
						const difY = (this.mousePosWorld.get_y()-this.oldMousePosWorld.y)*this.PTM;
						const dA = Math.atan2(difY, difX)-this.verticeEditingSprite.rotation;
						const dL = Math.sqrt(difX*difX+difY*difY);
						const movX = dL*Math.cos(dA);
						const movY = dL*Math.sin(dA);

						const spriteData = this.verticeEditingSprite.data;
						let vertices = spriteData.type === this.object_BODY ? spriteData.vertices[0] : spriteData.vertices;

						if(spriteData.type === this.object_BODY){
							if(Array.isArray(vertices[0])) vertices = vertices[0]
						}

						if(this.verticeEditingSprite.selectedVerticePoint){
							const vertice = vertices[this.verticeEditingSprite.selectedVerticePointIndex];
							let previousVertice = vertices[this.verticeEditingSprite.selectedVerticePointIndex-1];
							if(this.verticeEditingSprite.selectedVerticePointIndex === 0) previousVertice = vertices[vertices.length-1];
							let pA, pB;
							if(this.verticeEditingSprite.selectedVerticePoint === vertice.point1){
								pA = vertice.point1;
								pB = previousVertice.point2;
							}else{
								pA = previousVertice.point2;
								pB = vertice.point1;
							}
							pA.x += movX;
							pA.y += movY;

							if(pB){
								const pADX = vertice.x-pA.x;
								const pADY = vertice.y-pA.y;
								const pAA = Math.atan2(pADY, pADX);
								const pBDX = vertice.x-pB.x;
								const pBDY = vertice.y-pB.y;
								const pBL = Math.sqrt(pBDX * pBDX + pBDY*pBDY);
								pB.x = vertice.x + pBL*Math.cos(pAA);
								pB.y = vertice.y + pBL*Math.sin(pAA);
							}

							const closeDistance = Settings.handleClosestDistance / this.cameraHolder.scale.x;

							const canClosePoint1 = !vertice.point1 || (Math.abs(vertice.point1.x-vertice.x) < closeDistance && Math.abs(vertice.point1.y-vertice.y) < closeDistance);
							const canClosePoint2 = !previousVertice.point2 || (Math.abs(previousVertice.point2.x-vertice.x) < closeDistance && Math.abs(previousVertice.point2.y-vertice.y) < closeDistance);

							if(canClosePoint1  && canClosePoint2){
								delete vertice.point1;
								delete vertice.point2;
								delete this.verticeEditingSprite.selectedVerticePoint;
								delete this.verticeEditingSprite.selectedVerticePointIndex;
							}
						}else{

							this.verticeEditingSprite.selectedVertice.forEach(verticeIndex=> {
								const vertice = vertices[verticeIndex];
								let previousVertice = vertices[verticeIndex-1];
								if(verticeIndex === 0) previousVertice = vertices[vertices.length-1];


								let verticeChangeX = movX;
								let verticeChangeY = movY;

								if(spriteData.type === this.object_BODY){
									vertice.x += movX / Settings.PTM;
									vertice.y += movY / Settings.PTM;

									if(this.shiftDown){
										vertice.x = Math.round((vertice.x * Settings.PTM) / Settings.positionGridSize) * Settings.positionGridSize;
										vertice.y = Math.round((vertice.y * Settings.PTM) / Settings.positionGridSize) * Settings.positionGridSize;
										vertice.x /= Settings.PTM;
										vertice.y /= Settings.PTM;
									}
								}else{
									const oldX = vertice.x;
									const oldY = vertice.y;

									vertice.x += movX;
									vertice.y += movY;

									if(this.shiftDown){
										vertice.x = Math.round(vertice.x / Settings.positionGridSize) * Settings.positionGridSize;
										verticeChangeX = vertice.x - oldX;
										vertice.y = Math.round(vertice.y / Settings.positionGridSize) * Settings.positionGridSize;
										verticeChangeY = vertice.y - oldY;
									}
								}

								if(vertice.point1){
									vertice.point1.x += verticeChangeX;
									vertice.point1.y += verticeChangeY;
								}
								if(previousVertice.point2){
									previousVertice.point2.x += verticeChangeX;
									previousVertice.point2.y += verticeChangeY;
								}
							});
						}
						if(spriteData.type === this.object_BODY){
							this.updateBodyFixtures(this.verticeEditingSprite.myBody);
							this.updateBodyShapes(this.verticeEditingSprite.myBody);
						}else{
							this.updateGraphicShapes(this.verticeEditingSprite);
						}
						this.verticeEditingSprite._cullingSizeDirty = true;
						this.verticeEditingSprite.position.x++;
						this.verticeEditingSprite.position.x--;
					}
				}
			}else if(!this.mouseDown){
				if(this.selectedTool === this.tool_VERTICEEDITING){
					const mousePixiPos = this.getPIXIPointFromWorldPoint(this.mousePosWorld);

					const localPosition = this.verticeEditingSprite.toLocal(mousePixiPos, this.verticeEditingSprite.parent);


					const spriteData = this.verticeEditingSprite.data;
					let vertices = spriteData.type === this.object_BODY ? spriteData.vertices[0] : spriteData.vertices;

					if(spriteData.type === this.object_BODY){
						vertices = vertices.flat(2).map(point=> ({x:point.x*Settings.PTM, y:point.y*Settings.PTM}));
					}

					const {point, distance, index} = this.getClosestPointDataToVertices(localPosition, vertices);

					delete this.verticeEditingSprite.highlightVertice;
					delete this.verticeEditingSprite.highlightVerticeIndex;

					if(distance >= 0 && distance * this.cameraHolder.scale.x < Settings.handleClosestDistance){

						let toClose = false;
						vertices.forEach((vertice, verticeIndex) => {
							const verticeX = this.cameraHolder.x + (this.verticeEditingSprite.x + vertice.x) * this.cameraHolder.scale.x;
							const verticeY = this.cameraHolder.y + (this.verticeEditingSprite.y + vertice.y) * this.cameraHolder.scale.y;
							const highlightX = this.cameraHolder.x + (this.verticeEditingSprite.x + point.x) * this.cameraHolder.scale.x;
							const highlightY = this.cameraHolder.y + (this.verticeEditingSprite.y + point.y) * this.cameraHolder.scale.y;
							if(Math.abs(highlightX-verticeX) < Settings.handleClosestDistance*2 && Math.abs(highlightY-verticeY) < Settings.handleClosestDistance*2){
								toClose = true;
							}
							if(this.verticeEditingSprite.selectedVertice !== undefined && this.verticeEditingSprite.selectedVertice.includes(verticeIndex)){
								[vertice.point1, vertice.point2].forEach(dragPoint=>{
									if(dragPoint){
										const verticeX = this.cameraHolder.x + (this.verticeEditingSprite.x + dragPoint.x) * this.cameraHolder.scale.x;
										const verticeY = this.cameraHolder.y + (this.verticeEditingSprite.y + dragPoint.y) * this.cameraHolder.scale.y;
										const highlightX = this.cameraHolder.x + (this.verticeEditingSprite.x + point.x) * this.cameraHolder.scale.x;
										const highlightY = this.cameraHolder.y + (this.verticeEditingSprite.y + point.y) * this.cameraHolder.scale.y;
										if(Math.abs(highlightX-verticeX) < Settings.handleClosestDistance*2 && Math.abs(highlightY-verticeY) < Settings.handleClosestDistance*2){
											toClose = true;
										}
									}
								})
							}
						});

						if(!toClose){
							this.verticeEditingSprite.highlightVertice = point;
							this.verticeEditingSprite.highlightVerticeIndex = index;

						}
					}
				}
			}

			if(this.deepClickDetection !== null){

				const distanceX = Math.abs(this.mousePosWorld.get_x() - this.deepClickDetection.x) * this.cameraHolder.scale.x * Settings.PTM;
				const distanceY = Math.abs(this.mousePosWorld.get_y() - this.deepClickDetection.y) * this.cameraHolder.scale.x * Settings.PTM;

				if(distanceX > Settings.deepClickDetectionMargin || distanceY > Settings.deepClickDetectionMargin){
					this.deepClickDetection = null;
					this.deepClickMinimumLayer = Number.POSITIVE_INFINITY;
				}
			}


		}
		if(clearMousePos) this.oldMousePosWorld = this.mousePosWorld;
	}
	this.onDocumentMouseMove = function(e){
		if(!this.editing) return;

		const movementSpeedX = Math.abs(this.mouseDocumentPosPixel.x-e.clientX);
		const movementSpeedY = Math.abs(this.mouseDocumentPosPixel.y-e.clientY);

		if(movementSpeedX+movementSpeedY <=3){
			// TODO DEBOUNCE THIS
			this.checkForTooltip();

		}

		this.mouseDocumentPosPixel.x = e.clientX;
		this.mouseDocumentPosPixel.y = e.clientY;
	}

	this.checkForTooltip = function(){
		const elementsUnderMouse = document.elementsFromPoint(this.mouseDocumentPosPixel.x, this.mouseDocumentPosPixel.y);
		this.showToolTip(false);

		let dataTooltip = undefined;
		for(let i = 0; i<elementsUnderMouse.length; i++){
			const element = elementsUnderMouse[i];
			dataTooltip = element.getAttribute('data-tt');
			if(dataTooltip){
				this.showToolTip(dataTooltip, true);
				break;
			}
		}

		if(!dataTooltip){
			const transformGUIElement = this.collidingWithTransformGui();
			if(transformGUIElement && this.transformGUI && this.transformGUI.visible){
				if([this.transformGUI.layerUp, this.transformGUI.layerDown].includes(transformGUIElement)){

					const prefabKeys = Object.keys(this.selectedPrefabs);

					let index = '';
					if(prefabKeys.length + this.selectedTextures.length + this.selectedPhysicsBodies.length === 1){
						let sprite = null;
						if(this.selectedTextures.length>0){
							sprite = this.selectedTextures[0];
						} else if(this.selectedPhysicsBodies.length>0){
							const body = this.selectedPhysicsBodies[0];
							sprite = body.mySprite;
							if(body.myTexture) sprite = body.myTexture;
						}else {
							const lookup = this.lookupGroups[prefabKeys[0]];
							if(lookup._bodies.length>0){
								const body = lookup._bodies[0];
								sprite = body.mySprite;
							}else if(lookup._textures.length>0){
								sprite = lookup._textures[0];
							}
						}
						if(sprite) index =  `(${sprite.parent.getChildIndex(sprite)})`;
					}

					if(transformGUIElement === this.transformGUI.layerUp){
						this.showToolTip(`layer up ${index}`, true);
					}else{
						this.showToolTip(`layer down ${index}`, true);
					}
				} else if(transformGUIElement === this.transformGUI.mirrorX){
					this.showToolTip('mirror horizontal', true);
				} else if(transformGUIElement === this.transformGUI.mirrorY){
					this.showToolTip('mirror vertical', true);
				}
			}
		}
	}

	this.showToolTip = function(reference, show){
		if(!this.toolTip){
			const domElement = document.createElement('div');
			domElement.classList.add('tooltip');
			const title = document.createElement('span');
			domElement.appendChild(title);
			document.body.appendChild(domElement);
			this.toolTip = {domElement, title};
		}

		if(!this.toolTip.bounds){
			this.toolTip.bounds = this.toolTip.domElement.getBoundingClientRect();
		}

		if(reference && this.toolTip.reference != reference){
			this.toolTip.bounds = undefined;
			this.toolTip.reference = reference;
			this.toolTip.title.innerText = reference;
		}

		if(this.toolTip.bounds){

			const yShift = -20;

			let offsetLeft = this.mouseDocumentPosPixel.x - this.toolTip.bounds.width/2;
			let offsetRight = this.mouseDocumentPosPixel.x + this.toolTip.bounds.width/2;
			let offsetTop = this.mouseDocumentPosPixel.y - yShift - this.toolTip.bounds.height/2;

			if(offsetLeft>0) offsetLeft = 0;
			if(offsetRight<window.innerWidth) offsetRight = 0;
			if(offsetTop>0) offsetTop = 0;

			const offsetX = offsetLeft+offsetRight;
			const offsetY = offsetTop-yShift;

			this.toolTip.domElement.style.left = (this.mouseDocumentPosPixel.x-offsetX)+'px';
			this.toolTip.domElement.style.top = (this.mouseDocumentPosPixel.y-offsetY)+'px';
		}

		if(!show){
			this.toolTip.domElement.style.display = 'none';
		} else {
			this.toolTip.domElement.style.display = 'block';
		}
	}

	this.collidingWithTransformGui = function(){
		if(!this.transformGUI || !this.transformGUI.visible) return;
		const mousePixiPos = this.getPIXIPointFromWorldPoint(this.mousePosWorld);
		const screenPosition = this.cameraHolder.toGlobal(mousePixiPos);
		let collidingChild = undefined;
		this.transformGUI.children.forEach(child=>{
			if(child.visible && child.containsPoint && child.containsPoint(new PIXI.Point(screenPosition.x, screenPosition.y))) collidingChild = child;
		});
		if(collidingChild){
			game.canvas.style.cursor = 'pointer';
		}else{
			game.canvas.style.cursor = 'unset';
		}
		return collidingChild;
	}

	this.clickOnTransformGUI = function(){
		const clickedChild =  this.collidingWithTransformGui();
		if([this.transformGUI.layerUp, this.transformGUI.layerDown].includes(clickedChild)){
			this.applyToSelectedObjects(this.TRANSFORM_DEPTH, clickedChild===this.transformGUI.layerUp);
			this.checkForTooltip();
		} else if([this.transformGUI.mirrorX, this.transformGUI.mirrorY].includes(clickedChild)){
			this.applyToSelectedObjects(this.TRANSFORM_MIRROR, clickedChild===this.transformGUI.mirrorX);
		}
		return clickedChild;
	}

	this.applyToSelectedObjects = function (transformType, obj) {
		let allObjects = this.selectedPhysicsBodies.concat(this.selectedTextures);
		let bodies = this.selectedPhysicsBodies;
		let textures = this.selectedTextures;

		let key;
		for (key in this.selectedPrefabs) {
			if (this.selectedPrefabs.hasOwnProperty(key)) {
				let lookup = this.lookupGroups[key];
				allObjects = allObjects.concat(lookup._bodies, lookup._textures, lookup._joints);
				bodies = bodies.concat(lookup._bodies);
				textures = textures.concat(lookup._textures, lookup._joints);
				if (transformType == this.TRANSFORM_MOVE) {
					this.activePrefabs[key].x += obj.x;
					this.activePrefabs[key].y += obj.y;
				} else if (transformType == this.TRANSFORM_ROTATE) {
					const prefab = this.activePrefabs[key];
					prefab.rotation += obj;
				}
			}
		}

		//if (transformType == this.TRANSFORM_DEPTH || transformType == this.TRANSFORM_UPDATE || transformType == this.TRANSFORM_ROTATE)
		this.applyToObjects(transformType, obj, allObjects)
		//} else {
		//	this.applyToObjects(transformType, obj, bodies);
		//	this.applyToObjects(transformType, obj, textures);
		//}//
	}

	this.applyToObjects = function (transformType, obj, objects, forceGroupRotation) {


		let i;
		let body;
		let sprite;

		//TODO: fix body

		if (transformType == this.TRANSFORM_MOVE || transformType == this.TRANSFORM_ROTATE) {

			const centerPoints = {};
			let data;
			let group;
			//prepare centerpoints for rotation
			if (transformType == this.TRANSFORM_ROTATE) {
				for (i = 0; i < objects.length; i++) {
					body = null;
					sprite = null;
					if (objects[i].mySprite != undefined) {
						body = objects[i];
						data = body.mySprite.data;
					} else {
						sprite = objects[i];
						data = sprite.data;
					}
					if (!data) continue;
					group = (this.altDown || forceGroupRotation) ? "__altDownGroup" : data.prefabInstanceName;
					if (group) {
						if (centerPoints[group] == undefined) centerPoints[group] = {
							x: 0,
							y: 0,
							n: 0
						};
						if(data.prefabInstanceName && this.editing){
							const prefab = this.activePrefabs[data.prefabInstanceName];
							centerPoints[group].x += prefab.x;
							centerPoints[group].y += prefab.y;
						}else if (body || (!this.editing && data.type == this.jointObject)) {
							centerPoints[group].x += body.GetPosition().get_x() * this.PTM;
							centerPoints[group].y += body.GetPosition().get_y() * this.PTM;
						} else {
							centerPoints[group].x += sprite.x;
							centerPoints[group].y += sprite.y;
						}
						centerPoints[group].n++;
					}
				}
				for (i in centerPoints) {
					if (centerPoints.hasOwnProperty(i)) {
						centerPoints[i].x /= centerPoints[i].n;
						centerPoints[i].y /= centerPoints[i].n;
					}
				}
			}

			const rAngle = obj * this.DEG2RAD;

			for (i = 0; i < objects.length; i++) {

				if (objects[i].mySprite !== undefined) {

					body = objects[i];
					if (transformType == this.TRANSFORM_MOVE) {
						const pos = b2CloneVec2(body.GetPosition());

						if(this.shiftDown){
							pos.set_x(Math.round((pos.x * Settings.PTM) / Settings.positionGridSize) * Settings.positionGridSize);
							pos.set_y(Math.round((pos.y * Settings.PTM) / Settings.positionGridSize) * Settings.positionGridSize);
							pos.set_x(pos.get_x() / Settings.PTM);
							pos.set_y(pos.get_y() / Settings.PTM);
						}

						pos.set_x(pos.get_x() + obj.x / this.PTM);
						pos.set_y(pos.get_y() + obj.y / this.PTM);
						body.SetTransform(pos, body.GetAngle());

					} else if (transformType == this.TRANSFORM_ROTATE) {
						//split between per object / group rotation
						group = (this.altDown || forceGroupRotation) ? "__altDownGroup" : body.mySprite.data.prefabInstanceName;

						const oldAngle = body.GetAngle();

						let newAngle = oldAngle + rAngle;

						body.SetTransform(body.GetPosition(), newAngle);

						if (group) {
							const difX = (body.GetPosition().get_x() * this.PTM) - centerPoints[group].x;
							const difY = (body.GetPosition().get_y() * this.PTM) - centerPoints[group].y;
							const distanceToCenter = Math.sqrt(difX * difX + difY * difY);
							const angleToCenter = Math.atan2(difY, difX);
							const newX = centerPoints[group].x + distanceToCenter * Math.cos(angleToCenter + rAngle);
							const newY = centerPoints[group].y + distanceToCenter * Math.sin(angleToCenter + rAngle);

							body.GetPosition().set_x(newX / this.PTM);
							body.GetPosition().set_y(newY / this.PTM);
						}
					}
					this.updateBodyPosition(body);
				} else {
					sprite = objects[i];
					if (transformType == this.TRANSFORM_MOVE) {

						if(this.shiftDown){
							sprite.x = Math.round(sprite.x / Settings.positionGridSize) * Settings.positionGridSize;
							sprite.y = Math.round(sprite.y / Settings.positionGridSize) * Settings.positionGridSize;
						}


						sprite.x += obj.x;
						sprite.y += obj.y;

					} else if (transformType == this.TRANSFORM_ROTATE) {
						sprite.rotation += obj * this.DEG2RAD;

						if (group) {
							const difX = sprite.x - centerPoints[group].x;
							const difY = sprite.y - centerPoints[group].y;
							const distanceToCenter = Math.sqrt(difX * difX + difY * difY);
							const angleToCenter = Math.atan2(difY, difX);
							const newX = centerPoints[group].x + distanceToCenter * Math.cos(angleToCenter + rAngle);
							const newY = centerPoints[group].y + distanceToCenter * Math.sin(angleToCenter + rAngle);
							sprite.x = newX;
							sprite.y = newY;
						}

					}

				}

			}
		} else if (transformType == this.TRANSFORM_DEPTH) {
			let depthArray = [];
			let jointArray = []

			// filter joints, we dont want to change depth with them
			objects = objects.filter(object => (object.mySprite || object.data.type != this.object_JOINT));

			if(objects.length === 0) return;

			for (i = 0; i < objects.length; i++) {

				if (objects[i].mySprite != undefined) {
					depthArray.push(objects[i].mySprite);
					if (objects[i].myTexture != undefined) {
						depthArray.push(objects[i].myTexture);
					}

					if (objects[i].myJoints) objects[i].myJoints.forEach(joint => {
						if (!(objects.includes(joint))) {
							depthArray.push(joint);
						}
						if (!(jointArray.includes(joint))) jointArray.push(joint);
					});

				} else {
					depthArray.push(objects[i]);
				}
			}

			depthArray.sort(function (a, b) {
				return a.parent.getChildIndex(a) - b.parent.getChildIndex(b);
			});


			let lowestIndex;
			let highestIndex;

			let nextIndex = null;
			if(obj){
				const lastItem = depthArray[depthArray.length-1];
				nextIndex = Math.min(lastItem.parent.getChildIndex(lastItem)+1, lastItem.parent.children.length-1);
				lowestIndex = depthArray[0].parent.getChildIndex(depthArray[0]);
			}else{
				nextIndex = Math.max(0, depthArray[0].parent.getChildIndex(depthArray[0])-1);
				highestIndex = depthArray[depthArray.length-1].parent.getChildIndex(depthArray[depthArray.length-1]);
			}

			let nextChild = depthArray[0].parent.children[nextIndex];

			if(nextChild.data.prefabInstanceName){
				nextChild = this.retreivePrefabChildAt(nextChild, obj);
			}else if(nextChild.data.type === this.object_BODY){
				if(obj> 0 && nextChild.myBody.myTexture){
					 nextChild = nextChild.myBody.myTexture;
				}
			}

			nextIndex = nextChild.parent.getChildIndex(nextChild);
			if(this.shiftDown && obj) nextIndex = this.textures.children.length;
			else if(this.shiftDown && !obj) nextIndex = 0;

			if(this.groupEditing){
				nextIndex = Math.max(this.groupMinChildIndex+2, nextIndex);
			}

			if(obj){
				highestIndex = nextIndex;
			}else{
				depthArray.reverse();
				lowestIndex = nextIndex;
			}

			depthArray.forEach(child=> {
				if(obj) depthArray[0].parent.addChildAt(child, nextIndex);
				if(!obj) depthArray[0].parent.addChildAt(child, nextIndex);
			});

			// post process joints to make sure they are always on top
			jointTriggerLayer.bringToFront();
		} else if (transformType == this.TRANSFORM_FORCEDEPTH) {
			objects = this.sortObjectsByIndex(objects);
			for (i = 0; i < objects.length; i++) {
				sprite = (objects[i].mySprite) ? objects[i].mySprite : objects[i];
				//sprite = (objects[i].myTexture) ? objects[i].myTexture : sprite;
				if(objects[i].myTexture) objects.splice(i+1, 0, objects[i].myTexture);
				const container = sprite.parent;
				const targetIndex = Math.min(obj + i, sprite.parent.children.length-1);
				container.removeChild(sprite);
				container.addChildAt(sprite, targetIndex);

				//TODO FIX THIS MESS, very likely due to mytexture being pushed in, setting the i to a higher number and results in an index > children
				//Temp fix with Math.min()
			}
		} else if(transformType === this.TRANSFORM_SCALE){
			const {scaleX, scaleY} = obj;

			let centerPoint = {
				x: 0,
				y: 0
			};

			for (i = 0; i < objects.length; i++) {
				if(objects[i].mySprite != undefined){
					let body = objects[i];
					centerPoint.x += body.GetPosition().get_x() * this.PTM;
					centerPoint.y += body.GetPosition().get_y() * this.PTM;
				}else{
					let sprite = objects[i];
					centerPoint.x += sprite.x;
					centerPoint.y += sprite.y;
	
				}
			}

			centerPoint.x /= objects.length;
			centerPoint.y /= objects.length;

			for (i = 0; i < objects.length; i++) {
				if(objects[i].mySprite != undefined){
					let body = objects[i];

					var xDif = body.GetPosition().get_x() * this.PTM - centerPoint.x;
					var yDif = body.GetPosition().get_y() * this.PTM - centerPoint.y;

					this.setScale(body, scaleX, scaleY);

					if(this.altDown){
						const scalePos = vec1;
						scalePos.Set((centerPoint.x + xDif * scaleX) / this.PTM, (centerPoint.y + yDif * scaleY) / this.PTM);
						body.SetTransform(scalePos, body.GetAngle());
					}
				}else{
					let sprite = objects[i];

					var xDif = sprite.x - centerPoint.x;
					var yDif = sprite.y - centerPoint.y;


					if(this.altDown){
						sprite.x = centerPoint.x + xDif * scaleX;
						sprite.y = centerPoint.y + yDif * scaleY;
					}

					this.setScale(sprite, scaleX, scaleY);
				}
			}
		}else if(transformType === this.TRANSFORM_MIRROR){
			let vertices = null;

			for (i = 0; i < objects.length; i++) {
				let object = objects[i];

				let data = null;
				if (object.mySprite != undefined) {
					data = object.mySprite.data;

					if(object.myTexture){

						let x = 1*Math.cos(object.myTexture.data.texturePositionOffsetAngle);
						let y = 1*Math.sin(object.myTexture.data.texturePositionOffsetAngle);
						if(obj) x *= -1;
						else y *= -1;
						object.myTexture.data.texturePositionOffsetAngle = Math.atan2(y, x);

						if([this.object_GRAPHICGROUP, this.object_ANIMATIONGROUP, this.object_GRAPHIC].includes(object.myTexture.data.type)) objects.push(object.myTexture);
					}
				} else {
					data = object.data;
				}

				if([this.object_GRAPHIC, this.object_BODY].includes(data.type)){

					vertices = data.vertices.flat(4);

					vertices.forEach(vertice => {
						if(obj) vertice.x *= -1;
						else vertice.y *= -1;

						if(vertice.point1){
							if(obj) vertice.point1.x *= -1;
							else vertice.point1.y *= -1;
						}
						if(vertice.point2){
							if(obj) vertice.point2.x *= -1;
							else vertice.point2.y *= -1;
						}
					})

					if (object.mySprite != undefined) {
						this.updateBodyFixtures(object);
						this.updateBodyShapes(object)
					}else{
						this.updateGraphicShapes(object);
					}
				}

				if ([this.object_GRAPHICGROUP, this.object_ANIMATIONGROUP].includes(data.type)) {
					data.graphicObjects.forEach(graphicObject => {

						switch (graphicObject[0]) {
							case this.object_GRAPHIC:
								const vertices = graphicObject[11];
								vertices.forEach(vertice => {
									if (obj) vertice.x *= -1;
									else vertice.y *= -1;

									if (vertice.point1) {
										if (obj) vertice.point1.x *= -1;
										else vertice.point1.y *= -1;
									}
									if (vertice.point2) {
										if (obj) vertice.point2.x *= -1;
										else vertice.point2.y *= -1;
									}
								})
								if (obj) graphicObject[1] *= -1;
								else graphicObject[2] *= -1;
								graphicObject.rotation = -graphicObject.rotation;
								break
							case this.object_TEXT:
							case this.object_TEXTURE:
								if (obj) graphicObject[1] *= -1;
								else graphicObject[2] *= -1;
								graphicObject.rotation = -graphicObject.rotation;
								break
							case this.object_GRAPHICGROUP:
								if (obj) graphicObject[1] *= -1;
								else graphicObject[2] *= -1;
								const innerGraphicObjects = graphicObject[7];
								innerGraphicObjects.forEach(graphicObject => {
									switch (graphicObject[0]) {
										case this.object_GRAPHIC:
											const vertices = graphicObject[11];
											vertices.forEach(vertice => {
												if (obj) vertice.x *= -1;
												else vertice.y *= -1;

												if (vertice.point1) {
													if (obj) vertice.point1.x *= -1;
													else vertice.point1.y *= -1;
												}
												if (vertice.point2) {
													if (obj) vertice.point2.x *= -1;
													else vertice.point2.y *= -1;
												}
											})
											if (obj) graphicObject[1] *= -1;
											else graphicObject[2] *= -1;
											graphicObject.rotation = -graphicObject.rotation;
											break
										case this.object_TEXT:
										case this.object_TEXTURE:
											if (obj) graphicObject[1] *= -1;
											else graphicObject[2] *= -1;
											graphicObject.rotation = -graphicObject.rotation;
											break
									}
								})
								break
						}

						this.updateGraphicGroupShapes(object);
					})
				}

			}

		}
		//update all objects
		if (this.editing) {
			for (i = 0; i < objects.length; i++) {
				if (objects[i].mySprite != undefined) {
					this.updateObject(objects[i].mySprite, objects[i].mySprite.data);
					if (objects[i].myTexture) this.updateObject(objects[i].myTexture, objects[i].myTexture.data);
				} else this.updateObject(objects[i], objects[i].data);
			}
		}
	}
	this.getLowestChildIndex = function (objects) {
		var childIndex = Number.POSITIVE_INFINITY;
		for (var i = 0; i < objects.length; i++) {
			var sprite = (objects[i].mySprite) ? objects[i].mySprite : objects[i];
			if(sprite.parent){
				var spriteIndex = sprite.parent.getChildIndex(sprite);
				if (spriteIndex < childIndex) childIndex = spriteIndex;
			}
		}
		return childIndex;
	}
	this.sortObjectsByIndex = function (objects) {
		objects.sort(function (a, b) {
			var aIndex = (a.mySprite) ? a.mySprite.parent.getChildIndex(a.mySprite) : a.parent.getChildIndex(a);
			var bIndex = (b.mySprite) ? b.mySprite.parent.getChildIndex(b.mySprite) : b.parent.getChildIndex(b);
			return aIndex - bIndex;
		});
		//objects.reverse();
		return objects;
	}
	this.TRANSFORM_MOVE = "move";
	this.TRANSFORM_ROTATE = "rotate";
	this.TRANSFORM_DEPTH = "depth";
	this.TRANSFORM_FORCEDEPTH = "forcedepth";
	this.TRANSFORM_UPDATE = "update";
	this.TRANSFORM_SCALE = "scale";
	this.TRANSFORM_MIRROR = "mirror";

	this.storeUndoMovement = function () {
		if(!this.editing) return;
		if(this.lockSaving) return;
 
		jointTriggerLayer.bringToFront();

		this.stringifyWorldJSON();
		if(this.lastValidWorldJSON === this.worldJSON) return;

		this.undoList.pop()

		//[current, //old1]
		//[current, //old, //old1]

		this.undoList.push(this.lastValidWorldJSON);
		this.lastValidWorldJSON = this.worldJSON;

		while(this.undoIndex<0){
			this.undoList.pop();
			this.undoIndex++;
		}

		this.undoList.push(this.worldJSON);

		if(this.undoList.length>50) this.undoList.shift();
	}
	this.storeUndoMovementDebounced =  dat.Common.debounce(()=>{this.storeUndoMovement()}, 100);

	this.undoMove = function (undo) {

		if(this.groupEditing){
			stopEditingGroup();
			return;
		}

		const oldSelectedTool = this.selectedTool;

		if(!undo && this.undoIndex === 0) return;
		if(!undo && this.undoIndex<0) this.undoIndex++;

		if(undo && this.undoList.length-1 === -this.undoIndex) return;
		if(undo) this.undoIndex--;

		const targetIndex = this.undoList.length-1+this.undoIndex;
		const json = this.undoList[targetIndex];

		camera.storeCurrentPosition();

		this.resetEditor();
		this.buildJSON(json);

		if(oldSelectedTool !== this.tool_VERTICEEDITING){
			this.selectTool(oldSelectedTool);
		}

	}

	this.updateMousePosition = function (e) {
		var rect = this.canvas.getBoundingClientRect();

		this.mousePosPixel.x = e.clientX - rect.left;
		this.mousePosPixel.y = e.clientY - rect.top;

		this.mousePosWorld = this.getWorldPointFromPixelPoint(this.mousePosPixel);
	}

	this.onMouseUp = function (evt) {
		const camera = B2dEditor.container.camera || B2dEditor.container;
		if (this.editing) {
			if(this.customPrefabMouseDown){
				// dont do any mouse up action if we are doing a custom prefab action
			}else if (this.spaceCameraDrag) {
				this.spaceCameraDrag = false;
			} else if(this.selectingTriggerTarget){
				if(this.startSelectionPoint){
					const minSelectPixi = 3/Settings.PTM;
					if(Math.abs(this.startSelectionPoint.x-this.mousePosWorld.get_x()) <= minSelectPixi && Math.abs(this.startSelectionPoint.y-this.mousePosWorld.get_y())<= minSelectPixi){
						const highestObject = this.retrieveHighestSelectedObject(this.mousePosWorld, this.mousePosWorld);
						if (highestObject) {
							for (var i = 0; i < this.selectedPhysicsBodies.length; i++) {
								var body = this.selectedPhysicsBodies[i];
								if (body.mySprite && body.mySprite.data.type == this.object_TRIGGER) {
									trigger.addTargetToTrigger(body, highestObject);
									trigger.updateTriggerGUI();
								}
							}
						}
					}else{
						let bodies = this.queryWorldForBodies(this.startSelectionPoint, this.mousePosWorld);
						const textures = this.queryWorldForGraphics(this.startSelectionPoint, this.mousePosWorld);

						for(let i = 0; i<textures.length; i++){
							const texture = textures[i];
							if(texture.myBody){
								if(!bodies.includes(texture.myBody)){
									bodies.push(texture.myBody);
								}
								textures.splice(i, 1);
								i--;
							}
						}
						[].concat(bodies.map(body => body.mySprite), textures).forEach(object =>{
							for (var i = 0; i < this.selectedPhysicsBodies.length; i++) {
								var body = this.selectedPhysicsBodies[i];
								if (body.mySprite && body.mySprite.data.type == this.object_TRIGGER) {
									trigger.addTargetToTrigger(body, object);
								}
							}
						});
						trigger.updateTriggerGUI();
					}
				}
				this.stopTriggerTargetSelecting();
			}else if (this.selectedTool == this.tool_SELECT) {

				if (this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0 && Object.keys(this.selectedPrefabs).length == 0 && this.startSelectionPoint) {

					const minSelectPixi = 3/Settings.PTM;
					if(Math.abs(this.startSelectionPoint.x-this.mousePosWorld.get_x()) <= minSelectPixi && Math.abs(this.startSelectionPoint.y-this.mousePosWorld.get_y())<= minSelectPixi){
						let highestObject = this.retrieveHighestSelectedObject(this.mousePosWorld, this.mousePosWorld);

						if (highestObject) {
							if ([this.object_BODY, this.object_TRIGGER].includes(highestObject.data.type)) {
								this.selectedPhysicsBodies.push(highestObject.myBody);
							}else{
								this.selectedTextures.push(highestObject);
							}
						}else if(this.groupEditing && Date.now() < this.doubleClickTime){
							stopEditingGroup();
						}
					}else{
						this.makeSelection(this.startSelectionPoint, this.mousePosWorld);
					}

					this.applyToSelectedObjects(this.TRANSFORM_UPDATE);
					this.filterSelectionForPrefabs();
					this.updateSelection();
				}
			} else if (this.selectedTool == this.tool_GEOMETRY) {
				if(!this.mouseDown) return;
				if(ui.editorGUI.editData.isBody){
					let bodyObject;
					if (ui.editorGUI.editData.shape == "Circle") {
						let radius = new b2Vec2(this.mousePosWorld.get_x() - this.startSelectionPoint.x, this.mousePosWorld.get_y() - this.startSelectionPoint.y).Length() * this.PTM;
						if(this.shiftDown){
							radius = Math.floor(radius / Settings.geometrySnapScale) * Settings.geometrySnapScale;
						}
						if ((radius * 2 * Math.PI / Settings.PTM / 10) > this.minimumBodySurfaceArea) {
							bodyObject = new this.bodyObject;
							bodyObject.x = this.startSelectionPoint.x;
							bodyObject.y = this.startSelectionPoint.y;


							bodyObject.colorFill = ui.editorGUI.editData.colorFill;
							bodyObject.colorLine = ui.editorGUI.editData.colorLine;
							bodyObject.lineWidth = ui.editorGUI.editData.lineWidth;
							bodyObject.transparancy = ui.editorGUI.editData.transparancy;

							bodyObject.radius = radius;
							this.buildBodyFromObj(bodyObject);
						}
					} else {
						bodyObject = this.createBodyObjectFromVerts(this.activeVertices);
						if (bodyObject) {
							bodyObject.colorFill = ui.editorGUI.editData.colorFill;
							bodyObject.colorLine = ui.editorGUI.editData.colorLine;
							bodyObject.lineWidth = ui.editorGUI.editData.lineWidth;
							bodyObject.transparancy = ui.editorGUI.editData.transparancy;
							this.buildBodyFromObj(bodyObject);
						}
					}
				}else{
					let graphicObject;
					if (ui.editorGUI.editData.shape == "Circle") {
						let radius = new b2Vec2(this.mousePosWorld.get_x() - this.startSelectionPoint.x, this.mousePosWorld.get_y() - this.startSelectionPoint.y).Length() * this.PTM;
						if(this.shiftDown){
							radius = Math.floor(radius / Settings.geometrySnapScale) * Settings.geometrySnapScale;
						}
						graphicObject = new this.graphicObject;
						graphicObject.x = this.startSelectionPoint.x*Settings.PTM;
						graphicObject.y = this.startSelectionPoint.y*Settings.PTM;


						graphicObject.colorFill = ui.editorGUI.editData.colorFill;
						graphicObject.colorLine = ui.editorGUI.editData.colorLine;
						graphicObject.lineWidth = ui.editorGUI.editData.lineWidth;
						graphicObject.transparancy = ui.editorGUI.editData.transparancy;

						graphicObject.radius = radius;
						this.buildGraphicFromObj(graphicObject);
					}else{
						// this.activeVertices = verticeOptimize.simplifyPath(this.activeVertices, false, this.cameraHolder.scale.x);
						graphicObject = this.createGraphicObjectFromVerts(this.activeVertices);
						if (graphicObject) {
							graphicObject.colorFill = ui.editorGUI.editData.colorFill;
							graphicObject.colorLine = ui.editorGUI.editData.colorLine;
							graphicObject.lineWidth = ui.editorGUI.editData.lineWidth;
							graphicObject.transparancy = ui.editorGUI.editData.transparancy;
							this.buildGraphicFromObj(graphicObject);
						}
					}

				}
			} else if(this.selectedTool == this.tool_TRIGGER){
				if(!this.mouseDown) return;
				const triggerObject = new this.triggerObject;
				triggerObject.x = this.startSelectionPoint.x;
				triggerObject.y = this.startSelectionPoint.y;
				if (ui.editorGUI.editData.shape == "Circle"){
					let radius = new b2Vec2(this.mousePosWorld.get_x() - this.startSelectionPoint.x, this.mousePosWorld.get_y() - this.startSelectionPoint.y).Length() * this.PTM;
					if(this.shiftDown){
						radius = Math.floor(radius / Settings.geometrySnapScale) * Settings.geometrySnapScale;
					}
					if ((radius * 2 * Math.PI / Settings.PTM / 10) > this.minimumBodySurfaceArea) {
						triggerObject.radius = radius;
						const _trigger = this.buildTriggerFromObj(triggerObject);
						_trigger.mySprite.triggerInitialized = true;
					}
				} else {
					const bodyObject = this.createBodyObjectFromVerts(this.activeVertices);
					if (bodyObject) {
						triggerObject.vertices = bodyObject.vertices;
						triggerObject.x = bodyObject.x;
						triggerObject.y = bodyObject.y;
						const _trigger = this.buildTriggerFromObj(triggerObject);
						_trigger.mySprite.triggerInitialized = true;
					}
				}
			} else if (this.selectedTool == this.tool_ART) {
				if(!this.mouseDown) return;

				this.activeVertices.push({
					x: this.mousePosWorld.get_x(),
					y: this.mousePosWorld.get_y()
				});

				this.activeVertices = verticeOptimize.simplifyPath(this.activeVertices, ui.editorGUI.editData.smoothen, this.cameraHolder.scale.x);
				if (this.activeVertices && this.activeVertices.length > 2) {
					var graphicObject = this.createGraphicObjectFromVerts(this.activeVertices);
					graphicObject.colorFill = ui.editorGUI.editData.colorFill;
					graphicObject.colorLine = ui.editorGUI.editData.colorLine;
					graphicObject.transparancy = ui.editorGUI.editData.transparancy;
					graphicObject.lineWidth = ui.editorGUI.editData.lineWidth;
					this.buildGraphicFromObj(graphicObject);
				}
				this.activeVertices = [];

			}else if(this.selectedTool === this.tool_VERTICEEDITING){
				if(!this.mouseDown) return;
				if(Date.now() < this.doubleClickTime){

					if(this.verticeEditingSprite.selectedVertice && this.verticeEditingSprite.data.type !== this.object_BODY){
						const mousePixiPos = this.getPIXIPointFromWorldPoint(this.mousePosWorld);

						let mouseVertice = -1;
						this.verticeEditingSprite.selectedVertice.forEach(verticeIndex => {
							const vertice = this.verticeEditingSprite.data.vertices[verticeIndex];
							const vl = Math.sqrt(vertice.x*vertice.x + vertice.y*vertice.y);
							const va = this.verticeEditingSprite.rotation + Math.atan2(vertice.y, vertice.x);
							const vx = vl*Math.cos(va);
							const vy = vl*Math.sin(va);
							const verticeX = this.verticeEditingSprite.x + vx;
							const verticeY = this.verticeEditingSprite.y + vy;
							const difX = verticeX-mousePixiPos.x;
							const difY = verticeY-mousePixiPos.y;
							const minDistance = Settings.handleClosestDistance;
							if(Math.abs(difX) < minDistance && Math.abs(difY) < minDistance){
								mouseVertice = verticeIndex;
							}
						})

						if(mouseVertice>=0){
							const vertice = this.verticeEditingSprite.data.vertices[mouseVertice];


							let previousVertice = this.verticeEditingSprite.data.vertices[mouseVertice-1];
							if(mouseVertice === 0) previousVertice = this.verticeEditingSprite.data.vertices[this.verticeEditingSprite.data.vertices.length-1];

							let nextVertice = this.verticeEditingSprite.data.vertices[mouseVertice+1];
							if(mouseVertice === this.verticeEditingSprite.data.vertices.length-1) nextVertice = this.verticeEditingSprite.data.vertices[0];

							const dx = nextVertice.x-previousVertice.x;
							const dy = nextVertice.y-previousVertice.y;
							const angle = Math.atan2(dy, dx);

							const defaultDistance = Settings.handleClosestDistance*8 / camera.scale.x ;
							const closeDistance = Settings.handleClosestDistance / camera.scale.x;

							const noPoint1 = !vertice.point1 || (Math.abs(vertice.x-vertice.point1.x) < closeDistance && Math.abs(vertice.y-vertice.point1.y) < closeDistance);
							const noPoint2 = !previousVertice.point2 || (Math.abs(vertice.x-previousVertice.point2.x) < closeDistance && Math.abs(vertice.y-previousVertice.point2.y) < closeDistance);

							if(noPoint1 || noPoint2 || true){
								vertice.point1 = {x:vertice.x+defaultDistance*Math.cos(angle), y:vertice.y+defaultDistance*Math.sin(angle)}
								if(!vertice.point2){
									vertice.point2 = {x:nextVertice.x, y:nextVertice.y}
								}
								previousVertice.point2 = {x:vertice.x-defaultDistance*Math.cos(angle), y:vertice.y-defaultDistance*Math.sin(angle)}
								if(!previousVertice.point1){
									previousVertice.point1 = {x:previousVertice.x, y:previousVertice.y}
								}
							}

							this.updateGraphicShapes(this.verticeEditingSprite);
						}

					}else{
						this.selectTool(this.tool_SELECT);
					}
				}else{
					if(this.verticeEditingSprite.selectedVertice === undefined){

						const mousePixiStartPos = this.getPIXIPointFromWorldPoint(this.startSelectionPoint);
						const mousePixiPos = this.getPIXIPointFromWorldPoint(this.mousePosWorld);

						const leftBound = mousePixiPos.x < mousePixiStartPos.x ? mousePixiPos.x : mousePixiStartPos.x;
						const rightBound = mousePixiPos.x < mousePixiStartPos.x ? mousePixiStartPos.x : mousePixiPos.x;

						const upBound = mousePixiPos.y < mousePixiStartPos.y ? mousePixiPos.y : mousePixiStartPos.y;
						const bottomBound = mousePixiPos.y < mousePixiStartPos.y ? mousePixiStartPos.y : mousePixiPos.y;

						const spriteData = this.verticeEditingSprite.data;
						let vertices = spriteData.type === this.object_BODY ? spriteData.vertices[0] : spriteData.vertices;
						if(spriteData.type === this.object_BODY){
							vertices = vertices.flat(2).map(point=> ({x:point.x*Settings.PTM, y:point.y*Settings.PTM}));
						}

						this.verticeEditingSprite.selectedVertice = [];

						vertices.forEach((vertice, index) => {
							const vl = Math.sqrt(vertice.x*vertice.x + vertice.y*vertice.y);
							const va = this.verticeEditingSprite.rotation + Math.atan2(vertice.y, vertice.x);
							const vx = vl*Math.cos(va);
							const vy = vl*Math.sin(va);
							const verticeX = this.verticeEditingSprite.x + vx;
							const verticeY = this.verticeEditingSprite.y + vy;
							if(verticeX > leftBound && verticeX < rightBound && verticeY > upBound && verticeY < bottomBound){
								this.verticeEditingSprite.selectedVertice.push(index);
							}
						});

						if(this.verticeEditingSprite.selectedVertice.length === 0) delete this.verticeEditingSprite.selectedVertice;

					}
				}
			}
			this.storeUndoMovementDebounced();
		}
		this.mouseDown = false;
		this.middleMouseDown = false;
		this.startSelectionPoint = null;
		this.doubleClickTime = Date.now()+Settings.doubleClickTime;

	}
	this.onMouseWheel = function(e){

		const getPath = e => {
			const path = [];
			let currentElem = e.target;
			while (currentElem) {
				path.push(currentElem);
				currentElem = currentElem.parentElement;
			}
			if (path.indexOf(window) === -1 && path.indexOf(document) === -1) path.push(document);
			if (path.indexOf(window) === -1) path.push(window);
			return path;
		}

		if(this.middleMouseDown) return;

		const guiToHaveMouseWheel = [ui.editorGUI, ui.helpScreen, ui.gradientEditor, ui.assetGUI, ui.loadScreen, ui.saveScreen, ui.levelEditScreen];
		// detect mouse on gui
		let uiScroll = false;
		guiToHaveMouseWheel.forEach( gui => {

			if(gui && gui.domElement && gui.domElement.offsetParent !== null){
				const guiOpacity = window.getComputedStyle(gui.domElement).getPropertyValue("opacity");
				if(guiOpacity > 0){
					if(!gui.cachedBounds){
						gui.cachedBounds = gui.domElement.getBoundingClientRect();
					}
					const path = getPath(e)
					const itemList = path.find(el => el.classList && el.classList.contains('itemList'));
					if(itemList){
						itemList.scrollBy(e.deltaX, e.deltaY);
						uiScroll = true;
					}else if(e.target.parentNode && e.target.parentNode.classList.contains('imageDropDown') && e.target.parentNode.classList.contains('open')){
						e.target.parentNode.scrollBy(e.deltaX, e.deltaY);
						uiScroll = true;
					}else  if(this.mouseDocumentPosPixel.x > gui.cachedBounds.x && this.mouseDocumentPosPixel.x < gui.cachedBounds.x+gui.cachedBounds.width 
						&& this.mouseDocumentPosPixel.y > gui.cachedBounds.y && this.mouseDocumentPosPixel.y < gui.cachedBounds.y+gui.cachedBounds.height ){
						gui.domElement.scrollBy(e.deltaX, e.deltaY);
						uiScroll = true;
					}
				}
			}
		});


		if(this.editing && !uiScroll){
			const zoom = e.deltaY>0;
			camera.zoom({
				x: this.mousePosWorld.get_x() * this.PTM,
				y: this.mousePosWorld.get_y() * this.PTM
			}, zoom);
			game.triggerDebugDraw.debounceRedraw();
		}

        e.preventDefault();

    }

	this.makeSelection = (startPos, endPos) => {
		this.selectedPhysicsBodies = this.queryWorldForBodies(startPos, endPos);
		this.selectedTextures = this.queryWorldForGraphics(startPos, endPos);

		for(let i = 0; i<this.selectedTextures.length; i++){
			const texture = this.selectedTextures[i];
			if(texture.myBody){
				if(!this.selectedPhysicsBodies.includes(texture.myBody)){
					this.selectedPhysicsBodies.push(texture.myBody);
				}
				this.selectedTextures.splice(i, 1);
				i--;
			}
		}
	}


	this.onKeyDown = function (e) {
		const gameContainer = B2dEditor.container.camera || B2dEditor.container;

		if (e.keyCode == 86) { //v
			if((e.ctrlKey || e.metaKey) && e.shiftKey){
				this.pasteSelection();
			}
		}else if (e.keyCode == 67) { //c
			if (e.ctrlKey || e.metaKey) {
				this.copiedJSON = this.copySelection();
			} else {
				this.copiedJSON = this.copySelection();
				this.pasteSelection();
			}
		} else if (e.keyCode == 71) { // g
			if (e.ctrlKey || e.metaKey) {

				if ((this.selectedTextures.length == 1 && this.selectedPhysicsBodies.length == 0) || (this.selectedTextures.length == 0 && this.selectedPhysicsBodies.length == 1)) {
					this.ungroupObjects();
				} else {
					this.groupObjects();
				}
			}
		}else if (e.key >= 1 && e.key<=9) { // 1-9
			this.selectTool(e.key-1);
		} else if (e.key === "0") { // 1-9
			this.selectTool(this.tool_SETTINGS);
		}else if (e.keyCode == 74) { //j
			if (e.ctrlKey || e.metaKey) {
				const joint = this.attachJointPlaceHolder();
				if(joint) jointTriggerLayer.add(joint);
			}
			e.preventDefault();
		} else if (e.keyCode == 88) { // x
			if (e.ctrlKey || e.metaKey) {
				this.cutSelection();
			} else {
				this.applyToSelectedObjects(this.TRANSFORM_ROTATE, this.shiftDown ? 10 : 1);
			}

		} else if (e.keyCode == 89) { // y
			if (e.ctrlKey || e.metaKey) {
				this.undoMove(false);
			}
		} else if(e.keyCode === 27){ // esc
			this.selectedPrefabs = {};
			this.selectedTextures.length = 0;
			this.selectedPhysicsBodies.length = 0;
			this.stopTriggerTargetSelecting();
			this.customPrefabMouseDown = null;
			this.customPrefabMouseMove = null;
			this.customDebugDraw = null;
			this.activeVertices = [];
			this.updateSelection();
			this.selectTool(this.tool_SELECT);
		}else if (e.keyCode == 90) { // z
			if (e.ctrlKey || e.metaKey) {
				if((this.selectedTool == this.tool_POLYDRAWING || this.selectedTool == this.tool_PEN) && this.activeVertices.length > 0){
					this.activeVertices.pop();
				}else{
					this.undoMove(true);
				}
			} else {
				this.applyToSelectedObjects(this.TRANSFORM_ROTATE, this.shiftDown ? -10 : -1);
			}
		}else if(e.keyCode == 65 && this.ctrlDown){
			if(this.altDown){
				if(this.selectedTextures.length > 0 && Object.keys(this.selectedPrefabs).length + this.selectedPhysicsBodies.length + this.selectedTextures.length === 1){

					const graphic = this.selectedTextures[0];
					if(graphic.data.type === this.object_GRAPHIC){

						const animatorPrefab = `{"objects":[[4,${graphic.x},${graphic.y},${graphic.rotation},{"duration":1,"easing":"linear","startProgress":0,"clockwise":true,"animating":true,"path":${JSON.stringify(graphic.data.vertices)},"linkedTargetId":null,"linkedReferenceId":null},"Animator"]]}`;
						const animatorBodies = game.editor.buildJSON(JSON.parse(animatorPrefab));
					}
				}
			}else {
				const lower = new Box2D.b2Vec2(-50000, -50000);
				const upper = new Box2D.b2Vec2(50000, 50000);

				this.makeSelection(lower, upper);
				this.applyToSelectedObjects(this.TRANSFORM_UPDATE);
				this.filterSelectionForPrefabs();
				this.updateSelection();

				destroy(lower);
				destroy(upper);
			}
		}else if (!this.ctrlDown && (e.keyCode == 87 || e.keyCode == 65 || e.keyCode == 83 || e.keyCode == 68) && Object.keys(this.selectedPrefabs).length === 0) { // W A S D
			const minScale = 0.01;
			const maxScale = 0.5;
			const scaleMinMaxDiff = maxScale-minScale;

			// 1 is fully zoomed out, 0 = zoomed in;
			const scaleProgress = easing.easeInQuint( 1 - (Math.min(maxScale, gameContainer.scale.x) - minScale) / scaleMinMaxDiff );
			const maxPixScale = Math.max(1, Math.round(20 * scaleProgress));

			let xInc = 0;
			let yInc = 0;
			if(e.keyCode === 65){
				xInc = -maxPixScale;
			}else if(e.keyCode === 68){
				xInc = maxPixScale;
			}

			if(e.keyCode === 87){
				yInc = maxPixScale;
			}else if(e.keyCode === 83){
				yInc = -maxPixScale;
			}

			if(this.shiftDown){
				xInc *= 10;
				yInc *= 10;
			}

			const aabb = this.computeObjectsAABB(this.selectedPhysicsBodies, this.selectedTextures, true);
			const currentSize = {
				width: aabb.GetExtents().x * 2 * this.PTM,
				height: aabb.GetExtents().y * 2 * this.PTM
			}
			let targetWidth = Math.max(1, Math.round(currentSize.width)+xInc);
			let targetHeight = Math.max(1, Math.round(currentSize.height)+yInc);

			const scaleX = targetWidth / currentSize.width;
			const scaleY = targetHeight / currentSize.height;

			this.applyToSelectedObjects(this.TRANSFORM_SCALE, {scaleX, scaleY});

			// hack to improve speed of dat gui
			if(ui?.editorGUI?.__folders){
				const key = Object.keys(ui?.editorGUI?.__folders)[0];
				if(ui?.editorGUI?.__folders[key].__controllers){
					ui?.editorGUI?.__folders[key].__controllers.forEach(controller => {
						if(controller.property === 'width'){
							controller.object.width = targetWidth;
						}else if(controller.property === 'height'){
							controller.object.height = targetHeight;
						}
					});
				}
			}
		}else if (this.ctrlDown && e.keyCode == 68){
			// duplicate
			this.copiedJSON = this.copySelection();
			this.pasteSelection(true);
			e.preventDefault();
		}else if (e.keyCode == 46 || e.keyCode == 8) { //delete || backspace
			if(e.keyCode == 8 && (this.selectedTool == this.tool_POLYDRAWING || this.selectedTool == this.tool_PEN)){
				this.activeVertices.pop();
			}
			if(this.selectedTool === this.tool_VERTICEEDITING && this.verticeEditingSprite.selectedVertice){

				const spriteData = this.verticeEditingSprite.data;
				let vertices = spriteData.type === this.object_BODY ? spriteData.vertices[0] : spriteData.vertices;
				if(Array.isArray(vertices[0])) vertices = vertices[0];

				const verticesToDelete = this.verticeEditingSprite.selectedVertice.map(verticeIndex => vertices[verticeIndex]);

				for(let i = 0; i< vertices.length; i++){
					if((spriteData.type === this.object_BODY && vertices.length>3) || (spriteData.type !== this.object_BODY && vertices.length>2)){
						// delete vertice
						const vertice = vertices[i];
						if(verticesToDelete.includes(vertice)){
							vertices.splice(i, 1);
							i--;
						}
					}
				}
				if(spriteData.type === this.object_BODY){
					this.updateBodyFixtures(this.verticeEditingSprite.myBody);
					this.updateBodyShapes(this.verticeEditingSprite.myBody);
				}else{
					this.updateGraphicShapes(this.verticeEditingSprite);
				}
				if(this.verticeEditingSprite.selectedVertice.length > 1){
					delete this.verticeEditingSprite.selectedVertice;
				}else{
					if(this.verticeEditingSprite.selectedVertice[0] === vertices.length) this.verticeEditingSprite.selectedVertice[0] = this.verticeEditingSprite.selectedVertice[0]-1;
					delete this.verticeEditingSprite.selectedVerticePoint;
					delete this.verticeEditingSprite.selectedVerticePointIndex;
				}
			}
			if(this.selectedTool === this.tool_SELECT) this.deleteSelection();
		} else if (e.keyCode == 16) { // shift
			this.shiftDown = true;
			e.preventDefault();
			//this.mouseTransformType = this.mouseTransformType_Rotation;
		}else if ([17, 93, 91, 224].includes(e.keyCode)) { // ctrl, meta keys
			this.ctrlDown = true;
			e.preventDefault();
			//this.mouseTransformType = this.mouseTransformType_Rotation;
		} else if (e.keyCode == 32) { //space
			if(!this.spaceDown) this.spaceDownTime = Date.now()+Settings.doubleClickTime;
			this.spaceDown = true;
			if(Date.now() < this.doubleSpaceTime) this.findPlayer();
		} else if (e.keyCode == 18) { // alt
			this.altDown = true;
		} else if (e.keyCode == 187 || e.keyCode == 61 || e.keyCode == 107 || e.keyCode == 171) { // +
			//zoomin
			camera.zoom({
				x: this.mousePosWorld.get_x() * this.PTM,
				y: this.mousePosWorld.get_y() * this.PTM
			}, true);
			game.triggerDebugDraw.debounceRedraw();
		} else if (e.keyCode == 189 || e.keyCode == 109 || e.keyCode == 173) { // -
			//zoomout
			camera.zoom({
				x: this.mousePosWorld.get_x() * this.PTM,
				y: this.mousePosWorld.get_y() * this.PTM
			}, false);
			game.triggerDebugDraw.debounceRedraw();
		} else if (e.keyCode == 112) { // F1
			if (ui.assetGUI == undefined) {
				ui.initGuiAssetSelection();
			} else {
				ui.removeGuiAssetSelection();
			}
			e.preventDefault();
		} if(e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40){ // left up right down
			let movX = 0;
			let movY = 0;

			if(e.keyCode == 38) movY = -1;
			if(e.keyCode == 40) movY = 1;
			if(e.keyCode == 37) movX = -1;
			if(e.keyCode == 39) movX = 1;

			if(this.shiftDown){
				movX *= 10;
				movY *= 10;
			}
			if(this.selectedTool === this.tool_SELECT){
				if ((e.ctrlKey || e.metaKey) && (e.keyCode === 38 || e.keyCode === 40)) {
					this.applyToSelectedObjects(this.TRANSFORM_DEPTH, e.keyCode === 38);
				}else{
					this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
						x: movX,
						y: movY
					});
				}
			}else if (this.selectedTool === this.tool_VERTICEEDITING){
		
				if(this.verticeEditingSprite.selectedVertice){
					const dA = Math.atan2(movY, movX)-this.verticeEditingSprite.rotation;
					const dL = Math.sqrt(movX*movX+movY*movY);
					const aMovX = dL*Math.cos(dA);
					const aMovY = dL*Math.sin(dA);

					const spriteData = this.verticeEditingSprite.data;
					let vertices = spriteData.type === this.object_BODY ? spriteData.vertices[0] : spriteData.vertices;

					if(spriteData.type === this.object_BODY){
						if(Array.isArray(vertices[0])) vertices = vertices[0]
					}

					this.verticeEditingSprite.selectedVertice.forEach(verticeIndex=> {
						const vertice = vertices[verticeIndex];
						let previousVertice = vertices[verticeIndex-1];
						if(verticeIndex === 0) previousVertice = vertices[vertices.length-1];

						if(spriteData.type === this.object_BODY){
							vertice.x += aMovX / Settings.PTM;
							vertice.y += aMovY / Settings.PTM;
						}else{
							vertice.x += aMovX;
							vertice.y += aMovY;
						}

						if(vertice.point1){
							vertice.point1.x += aMovX;
							vertice.point1.y += aMovY;
						}
						if(previousVertice.point2){
							previousVertice.point2.x += aMovX;
							previousVertice.point2.y += aMovY;
						}
					});

					if(spriteData.type === this.object_BODY){
						this.updateBodyFixtures(this.verticeEditingSprite.myBody);
						this.updateBodyShapes(this.verticeEditingSprite.myBody);
					}else{
						this.updateGraphicShapes(this.verticeEditingSprite);
					}
				}
			}
			e.preventDefault();
			game.triggerDebugDraw.debounceRedraw();
		} else if (e.keyCode == 9) { // TAB
			jointTriggerLayer.toggleHide();
			e.preventDefault();
		}
	}

	this.onKeyUp = function (e) {

		if (e.keyCode == 16) { // ctrl
			this.shiftDown = false;
			this.mouseTransformType = this.mouseTransformType_Movement;
		}if ([17, 93, 91, 224].includes(e.keyCode)) { // ctrl, meta keys
			this.ctrlDown = false;
		} else if (e.keyCode == 32) { //space
			this.spaceDown = false;
			if(Date.now() < this.spaceDownTime) this.doubleSpaceTime = Date.now()+Settings.doubleClickTime;
		} else if (e.keyCode == 18) {
			this.altDown = false;
		}

		this.storeUndoMovementDebounced();
	}

	this.queryPhysicsBodies = [];
	this.queryWorldForBodies = function (lowerBound, upperBound) {

		this.queryPhysicsAABB = new b2AABB();

		this.queryPhysicsAABB.get_lowerBound().Set((lowerBound.get_x() < upperBound.get_x() ? lowerBound.get_x() : upperBound.get_x()), (lowerBound.get_y() < upperBound.get_y() ? lowerBound.get_y() : upperBound.get_y()));
		this.queryPhysicsAABB.get_upperBound().Set((lowerBound.get_x() > upperBound.get_x() ? lowerBound.get_x() : upperBound.get_x()), (lowerBound.get_y() > upperBound.get_y() ? lowerBound.get_y() : upperBound.get_y()));

		this.queryPhysicsBodies = [];
		this.world.QueryAABB(this.getBodyCB, this.queryPhysicsAABB);
		var body;
		for (var i = 0; i < this.queryPhysicsBodies.length; i++) {
			body = this.queryPhysicsBodies[i];

			if(body.mySprite){

				let skipBody = false;

				if(this.groupEditing){
					const bodyIndex = body.mySprite.parent.getChildIndex(body.mySprite);
					if(bodyIndex<= this.groupMinChildIndex) skipBody = true;
				}
				if (body.mySprite.data && Boolean(body.mySprite.data.lockselection) != this.altDown) {
					skipBody = true;
				}

				if(skipBody){
					this.queryPhysicsBodies.splice(i, 1);
					i--;
				}
			}
		}

		return this.queryPhysicsBodies;
	}

	this.queryWorldForGraphics = function (lowerBound, upperBound) {
		const aabb = new b2AABB();
		aabb.lowerBound.Set((lowerBound.get_x() < upperBound.get_x() ? lowerBound.get_x() : upperBound.get_x()), (lowerBound.get_y() < upperBound.get_y() ? lowerBound.get_y() : upperBound.get_y()));
		aabb.upperBound.Set((lowerBound.get_x() > upperBound.get_x() ? lowerBound.get_x() : upperBound.get_x()), (lowerBound.get_y() > upperBound.get_y() ? lowerBound.get_y() : upperBound.get_y()));
		const lowerBoundPixi = this.getPIXIPointFromWorldPoint(aabb.lowerBound);
		const upperBoundPixi = this.getPIXIPointFromWorldPoint(aabb.upperBound);
		//QueryTextures

		let queryGraphics = [];
		let i;
		for (i = this.textures.children.length - 1; i >= 0; i--) {
			const sprite = this.textures.getChildAt(i);
			const spriteBounds = sprite.getBounds();

			const pos = new PIXI.Point(spriteBounds.x, spriteBounds.y);

			const spriteRect = new PIXI.Rectangle(pos.x, pos.y, spriteBounds.width, spriteBounds.height);
			const selectionRect = new PIXI.Rectangle(lowerBoundPixi.x, lowerBoundPixi.y, upperBoundPixi.x - lowerBoundPixi.x, upperBoundPixi.y - lowerBoundPixi.y);
			if (!(((spriteRect.y + spriteRect.height) < selectionRect.y) ||
					(spriteRect.y > (selectionRect.y + selectionRect.height)) ||
					((spriteRect.x + spriteRect.width) < selectionRect.x) ||
					(spriteRect.x > (selectionRect.x + selectionRect.width)))) {
				queryGraphics.push(sprite);
			}
		}


		let graphic;
		for (let i = 0; i < queryGraphics.length; i++) {
			graphic = queryGraphics[i];

			let skipGraphic = false;
			if(this.groupEditing){
				const graphicIndex = graphic.parent.getChildIndex(graphic);
				if(graphicIndex<= this.groupMinChildIndex) skipGraphic = true;
			}
			if (!graphic.data || graphic.data.type === undefined || Boolean(graphic.data.lockselection) != this.altDown || graphic.data.type === this.object_TRIGGER) {
				skipGraphic = true;
			}

			if(skipGraphic){
				queryGraphics.splice(i, 1);
				i--;
			}
		}



		if(Math.abs(lowerBoundPixi.x-upperBoundPixi.x) <=3 && Math.abs(lowerBoundPixi.y-upperBoundPixi.y)<=3){
			for(let i = 0; i<queryGraphics.length; i++){
				const graphic = queryGraphics[i];
				if(graphic.data.type === this.object_TEXTURE){
					// pixel perfect detection
					let pixels;
					try{
						pixels = game.app.renderer.plugins.extract.image(graphic);
					}catch(err){
						continue;
					}
					const localPosition = graphic.toLocal(lowerBoundPixi, graphic.parent);

					const oldRotation = graphic.rotation;
					graphic.rotation = 0;

					graphic.rotation = oldRotation;


					if(localPosition.x<0 || localPosition.y<0 || localPosition.x>graphic.width || localPosition.y>graphic.height){
						queryGraphics.splice(i, 1);
						i--;
						continue;
					}

					if(graphic.data.type === this.object_TEXT) continue; // we dont want pixel detection on text

					const x = Math.round(localPosition.x)*4;
					const y = Math.round(Math.round(localPosition.y)*Math.floor(graphic.width)*4);
					const a = pixels[x+y+3];

					if(a<10){
						queryGraphics.splice(i, 1);
						i--;
					}
				}else if(graphic.data.type !== this.object_JOINT && graphic.data.type !== this.object_ANIMATIONGROUP){
					const screenPosition = this.cameraHolder.toGlobal(lowerBoundPixi);
					game.levelCamera.matrix.applyInverse(screenPosition,screenPosition)
					let containsPoint = false;

					graphic.children.forEach(child=>{
						if(graphic.data.transparancy === 0) containsPoint = true;
						if(child.containsPoint && child.containsPoint(new PIXI.Point(screenPosition.x, screenPosition.y))){
							containsPoint = true;
						}else{
							let innerChild = child.children[0];
							if(child.alpha === 0) containsPoint = true;
							if(innerChild && innerChild.containsPoint && innerChild.containsPoint(new PIXI.Point(screenPosition.x, screenPosition.y))){
								containsPoint = true;
							}
						}
					})

					if(!containsPoint){
						queryGraphics.splice(i, 1);
						i--;
					}
				}
			}
		}

		return queryGraphics;

	}
	this.filterSelectionForPrefabs = function () {
		var i;
		for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
			if (this.selectedPhysicsBodies[i].mySprite.data.prefabInstanceName) {
				this.selectedPrefabs[this.selectedPhysicsBodies[i].mySprite.data.prefabInstanceName] = true;
				this.selectedPhysicsBodies.splice(i, 1);
				i--;
			}
		}
		for (i = 0; i < this.selectedTextures.length; i++) {
			if (this.selectedTextures[i].data.prefabInstanceName) {
				this.selectedPrefabs[this.selectedTextures[i].data.prefabInstanceName] = true;
				this.selectedTextures.splice(i, 1);
				i--;
			}
		}
	}


	this.getBodyCB = new JSQueryCallback();
	this.getBodyCB.ReportFixture = function (fixturePtr) {
		const fixture = Box2D.wrapPointer( fixturePtr, Box2D.b2Fixture );
		let isIncluded = false;
		for (let i = 0; i < self.queryPhysicsBodies.length; i++) {
			if (self.queryPhysicsBodies[i] == fixture.GetBody()) isIncluded = true;
		}
		if (!isIncluded){

			const maxClickDistance = 0.1;
			const isClick = Math.abs(self.queryPhysicsAABB.get_lowerBound().get_x()-self.queryPhysicsAABB.get_upperBound().get_x())<maxClickDistance || Math.abs(self.queryPhysicsAABB.get_lowerBound().get_y()-self.queryPhysicsAABB.get_upperBound().get_y())<maxClickDistance

			if (!isClick || fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), self.queryPhysicsAABB.get_lowerBound())) {
				self.queryPhysicsBodies.push(fixture.GetBody());
			}
		}
		return true;
	}

	this.computeSelectionAABB = function () {

		var computeBodies = this.selectedPhysicsBodies;
		var computeTextures = this.selectedTextures;

		//add elements from prefabs to selection
		for (var key in this.selectedPrefabs) {
			if (this.selectedPrefabs.hasOwnProperty(key)) {
				if (this.lookupGroups[key] instanceof this.lookupObject) {
					computeBodies = computeBodies.concat(this.lookupGroups[key]._bodies);
					computeTextures = computeTextures.concat(this.lookupGroups[key]._textures);
				}
			}
		}
		return this.computeObjectsAABB(computeBodies, computeTextures);
	}
	this.computeObjectsAABB = function (computeBodies, computeTextures, origin = false) {
		const aabb = new b2AABB();
		aabb.set_lowerBound(new b2Vec2(Number.MAX_VALUE, Number.MAX_VALUE));
		aabb.set_upperBound(new b2Vec2(-Number.MAX_VALUE, -Number.MAX_VALUE));
		let oldRot;

		const allElements = [...computeBodies, ...computeTextures];

		allElements.forEach(element => {
			let body, sprite;

			if(element.mySprite){
				body = element;
				sprite = body.myTexture;
			}else{
				sprite = element;
				body = element.myBody;
			}

			if(body){
				oldRot = body.GetAngle();
				if (origin) body.SetTransform(body.GetPosition(), 0);

				for (let fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
					const bAABB = new b2AABB();
					fixture.GetShape().ComputeAABB(bAABB, body.GetTransform());
					aabb.Combine(bAABB);
				}

				if (origin) body.SetTransform(body.GetPosition(), oldRot);
			}
			if(sprite){
				const camera = B2dEditor.container.camera || B2dEditor.container;

				oldRot = sprite.rotation;
				if (origin) sprite.rotation = 0;
				var bounds = sprite.getBounds();
				var spriteAABB = new b2AABB;

				const pos = new PIXI.Point(bounds.x, bounds.y);

				spriteAABB.set_lowerBound(new b2Vec2(pos.x / this.PTM, pos.y / this.PTM));
				spriteAABB.set_upperBound(new b2Vec2((pos.x + bounds.width) / this.PTM, (pos.y + bounds.height) / this.PTM));
				aabb.Combine(spriteAABB);
				if (origin) sprite.rotation = oldRot;
			}
		})

		return aabb;
	}

	this.doSelection = function () {
		// DRAW outer selection lines
		var i;
		var aabb;
		if (!this.selectingTriggerTarget && this.selectedPhysicsBodies.length > 0 || this.selectedTextures.length > 0 || Object.keys(this.selectedPrefabs).length > 0) {

			aabb = this.computeSelectionAABB();

			var lowerBoundPixi = this.getPIXIPointFromWorldPoint(aabb.get_lowerBound());
			var upperBoundPixi = this.getPIXIPointFromWorldPoint(aabb.get_upperBound());

			//Showing selection
			this.drawBox(this.debugGraphics, this.cameraHolder.x + lowerBoundPixi.x * this.cameraHolder.scale.x, this.cameraHolder.y + lowerBoundPixi.y * this.cameraHolder.scale.y, (upperBoundPixi.x - lowerBoundPixi.x) * this.cameraHolder.scale.y, (upperBoundPixi.y - lowerBoundPixi.y) * this.cameraHolder.scale.x, this.selectionBoxColor);
		} else {
			aabb = new b2AABB;

			//Making selection
			if (this.mouseDown && !this.spaceCameraDrag && this.startSelectionPoint) this.drawBox(this.debugGraphics, this.cameraHolder.x + this.startSelectionPoint.x * this.PTM * this.cameraHolder.scale.x, this.cameraHolder.y + this.startSelectionPoint.y * this.PTM * this.cameraHolder.scale.y, (this.mousePosWorld.get_x() * this.PTM - this.startSelectionPoint.x * this.PTM) * this.cameraHolder.scale.x, (this.mousePosWorld.get_y() * this.PTM - this.startSelectionPoint.y * this.PTM) * this.cameraHolder.scale.y, "#000000");
		}
		this.selectedBoundingBox = aabb;

		this.debugGraphics.lineStyle(6, 0x00FF00, 0.8);
		const offsetInterval = 500;
		var offset = (Date.now() % offsetInterval + 1) / offsetInterval;

		for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
			const selectedPhysicsBody = this.selectedPhysicsBodies[i];
			const data = selectedPhysicsBody.mySprite.data;
			if(data.type === this.object_TRIGGER) continue;

			const pos = b2MulVec2(b2CloneVec2(selectedPhysicsBody.GetPosition()), Settings.PTM);

			for (let j = 0; j < data.vertices.length; j++) {
				if (data.radius[j]) {

					let p = {
						x: data.vertices[j][0].x * this.PTM,
						y: data.vertices[j][0].y * this.PTM
					};
					const cosAngle = Math.cos(selectedPhysicsBody.mySprite.rotation);
					const sinAngle = Math.sin(selectedPhysicsBody.mySprite.rotation);
					const dx = p.x;
					const dy = p.y;
					p.x = (dx * cosAngle - dy * sinAngle);
					p.y = (dx * sinAngle + dy * cosAngle);


					this.debugGraphics.drawDashedCircle(data.radius[j] * this.cameraHolder.scale.x * selectedPhysicsBody.mySprite.scale.x, (pos.x + p.x) * this.cameraHolder.scale.x + this.cameraHolder.x, (pos.y + p.y) * this.cameraHolder.scale.y + this.cameraHolder.y, selectedPhysicsBody.mySprite.rotation, 20, 10, offset);
				} else {
					var polygons = [];
					let innerVertices;
					if (data.vertices[j][0] instanceof Array == false) innerVertices = data.vertices[j];
					else innerVertices = data.vertices[j][0];

					for (let k = 0; k < innerVertices.length; k++) {
						polygons.push({
							x: (innerVertices[k].x * this.PTM) * this.cameraHolder.scale.x * selectedPhysicsBody.mySprite.scale.x,
							y: (innerVertices[k].y * this.PTM) * this.cameraHolder.scale.y * selectedPhysicsBody.mySprite.scale.y
						});


					}
					this.debugGraphics.drawDashedPolygon(polygons, pos.get_x() * this.cameraHolder.scale.x + this.cameraHolder.x, pos.get_y() * this.cameraHolder.scale.y + this.cameraHolder.y, this.selectedPhysicsBodies[i].mySprite.rotation, 20, 10, offset);
				}
			}
		}
		this.drawTransformGui();
		this.drawDebugJointHelpers();
		this.drawDebugTriggerHelpers();
		this.drawDebugPrefabs();
		if(this.customDebugDraw) this.customDebugDraw();
	}
	this.drawPlayerHistory = function(){
		this.playerHistory.forEach(frame => {
			frame.forEach((part, i) => {
				if(part){
					const graphic = new PIXI.Graphics();

					let [color, x, y, angle] = part;
					graphic.lineStyle(1, color, 1);

					const size = 32*this.cameraHolder.scale.x;
					if(i == 0) graphic.drawRect(-size/2, -size*4/2, size, size*4);
					else graphic.drawCircle(0, 0, 30*this.cameraHolder.scale.x);

					x = this.cameraHolder.x + x*Settings.PTM * this.cameraHolder.scale.x;
					y = this.cameraHolder.y + y*Settings.PTM * this.cameraHolder.scale.y;
					graphic.x = x;
					graphic.y = y;
					if(angle) graphic.rotation = angle;

					this.debugGraphics.addChild(graphic);
				}
			});
		})
	}

	this.drawDebugTriggerHelpers = function () {
		let sprite;
		const selectedTriggers = [];
		for(var i = 0; i<this.selectedPhysicsBodies.length; i++){
			sprite = this.selectedPhysicsBodies[i].mySprite;
			if (sprite.data.type == this.object_TRIGGER) {
				selectedTriggers.push(this.selectedPhysicsBodies[i]);
			}
		}
		if(selectedTriggers.length>0){
			trigger.drawEditorTriggerTargets(selectedTriggers);
		}
	}
	this.drawDebugPrefabs = function () {
		const keys = Object.keys(this.selectedPrefabs);
		keys.forEach(key => {
			const prefab = this.activePrefabs[key];
			if(prefab.class && prefab.class.drawDebugEditor) prefab.class.drawDebugEditor();
		})
	}

	this.drawDebugJointHelpers = function () {
		//JOINTS draw upper and lower limits
		const camera = B2dEditor.container.camera || B2dEditor.container;

		var sprite;
		for (var i = 0; i < this.selectedTextures.length; i++) {
			sprite = this.selectedTextures[i];
			if (sprite.data.type == this.object_JOINT) {
				var tarSprite;

				if (sprite.data.jointType == this.jointObject_TYPE_PIN) {
					if (sprite.data.enableLimit) {
						var lineLength = 50 / sprite.scale.x;
						//FOR OBJECT A
						var lowAngle = -sprite.data.lowerAngle * this.DEG2RAD + sprite.rotation;
						var upAngle = -sprite.data.upperAngle * this.DEG2RAD + sprite.rotation;

						tarSprite = sprite.parent.getChildAt(sprite.data.bodyA_ID);

						this.debugGraphics.lineStyle(1, "0x707070", 1);
						this.debugGraphics.moveTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);
						this.debugGraphics.lineTo(tarSprite.x * camera.scale.x + camera.x + lineLength * Math.cos(sprite.rotation), tarSprite.y * camera.scale.y + camera.y + lineLength * Math.sin(sprite.rotation));


						this.debugGraphics.lineStyle(1, "0xFF9900", 1);
						this.debugGraphics.moveTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);
						this.debugGraphics.lineTo(tarSprite.x * camera.scale.x + camera.x + lineLength * Math.cos(upAngle), tarSprite.y * camera.scale.y + camera.y + lineLength * Math.sin(upAngle));

						this.debugGraphics.lineStyle(1, "0xFF3300", 1);
						this.debugGraphics.moveTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);
						this.debugGraphics.lineTo(tarSprite.x * camera.scale.x + camera.x + lineLength * Math.cos(lowAngle), tarSprite.y * camera.scale.y + camera.y + lineLength * Math.sin(lowAngle));

						this.debugGraphics.lineStyle(1, "0x000000", 0);
						this.debugGraphics.beginFill("0xFF9900", 0.3);
						this.debugGraphics.moveTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);
						this.debugGraphics.arc(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y, lineLength, upAngle, lowAngle, false);
						this.debugGraphics.endFill();

						//FOR OBJECT B

						if (sprite.data.bodyB_ID != undefined) {
							lowAngle = sprite.data.lowerAngle * this.DEG2RAD + sprite.rotation;
							upAngle = sprite.data.upperAngle * this.DEG2RAD + sprite.rotation;

							tarSprite = sprite.parent.getChildAt(sprite.data.bodyB_ID);

							this.debugGraphics.lineStyle(1, "0x707070", 1);
							this.debugGraphics.moveTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);
							this.debugGraphics.lineTo(tarSprite.x * camera.scale.x + camera.x + lineLength * Math.cos(sprite.rotation), tarSprite.y * camera.scale.y + camera.y + lineLength * Math.sin(sprite.rotation));

							this.debugGraphics.lineStyle(1, "0xC554FA", 1);
							this.debugGraphics.moveTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);
							this.debugGraphics.lineTo(tarSprite.x * camera.scale.x + camera.x + lineLength * Math.cos(upAngle), tarSprite.y * camera.scale.y + camera.y + lineLength * Math.sin(upAngle));

							this.debugGraphics.lineStyle(1, "0x8105BB", 1);
							this.debugGraphics.moveTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);
							this.debugGraphics.lineTo(tarSprite.x * camera.scale.x + camera.x + lineLength * Math.cos(lowAngle), tarSprite.y * camera.scale.y + camera.y + lineLength * Math.sin(lowAngle));

							this.debugGraphics.lineStyle(1, "0x000000", 0);
							this.debugGraphics.beginFill("0xC554FA", 0.3);
							this.debugGraphics.moveTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);
							this.debugGraphics.arc(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y, lineLength, lowAngle, upAngle, false);
							this.debugGraphics.endFill();
						}
					}
				} else if (sprite.data.jointType == this.jointObject_TYPE_SLIDE) {
					const drawArrow = (x, y, rotation, arrowLength, arrowAngle) => {
						arrowAngle = arrowAngle / this.DEG2RAD;
						const upArrowVec = {
							x: arrowLength * Math.cos(rotation + arrowAngle),
							y: arrowLength * Math.sin(rotation + arrowAngle)
						};
						const lowArrowVec = {
							x: arrowLength * Math.cos(rotation - arrowAngle),
							y: arrowLength * Math.sin(rotation - arrowAngle)
						};
						this.debugGraphics.moveTo((x + upArrowVec.x) * camera.scale.x + camera.x, (y + upArrowVec.y) * camera.scale.y + camera.y);
						this.debugGraphics.lineTo(x * camera.scale.x + camera.x, y * camera.scale.y + camera.y);
						this.debugGraphics.lineTo((x + lowArrowVec.x) * camera.scale.x + camera.x, (y + lowArrowVec.y) * camera.scale.y + camera.y);
						this.debugGraphics.lineTo((x + upArrowVec.x) * camera.scale.x + camera.x, (y + upArrowVec.y) * camera.scale.y + camera.y);
					}
					const spritesToDraw = [sprite.parent.getChildAt(sprite.data.bodyA_ID)];
					if(sprite.data.bodyB_ID) spritesToDraw.push(sprite.parent.getChildAt(sprite.data.bodyB_ID));
					else spritesToDraw.push(sprite);

					spritesToDraw.forEach((tarSprite, index) => {
						const rotationOffsetBodyB = index === 1 ? Math.PI : 0;
						const targetRotation = sprite.rotation + 270 * this.DEG2RAD + rotationOffsetBodyB;
						let lineAlpha = 1;


						if(tarSprite.data.type == this.object_JOINT || tarSprite.data.fixed) lineAlpha = 0;

						if (sprite.data.enableLimit) {
							const upperLengthVec = {
								x: sprite.data.upperLimit * Math.cos(targetRotation),
								y: sprite.data.upperLimit * Math.sin(targetRotation)
							};
							const lowerLengthVec = {
								x: sprite.data.lowerLimit * Math.cos(targetRotation),
								y: sprite.data.lowerLimit * Math.sin(targetRotation)
							};

							this.debugGraphics.lineStyle(1, "0xC554FA", lineAlpha);
							this.debugGraphics.moveTo((tarSprite.x + lowerLengthVec.x) * camera.scale.x + camera.x, (tarSprite.y + lowerLengthVec.y) * camera.scale.y + camera.y);
							this.debugGraphics.lineTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);

							drawArrow(tarSprite.x + lowerLengthVec.x, tarSprite.y + lowerLengthVec.y, targetRotation, 20, 45);
							var arrowPosition = 0.2;
							if (sprite.data.lowerLimit < -300) drawArrow(tarSprite.x + lowerLengthVec.x * arrowPosition, tarSprite.y + lowerLengthVec.y * arrowPosition, targetRotation, 20, 45);

							this.debugGraphics.lineStyle(1, "0xFF9900", lineAlpha);
							this.debugGraphics.moveTo((tarSprite.x + upperLengthVec.x) * camera.scale.x + camera.x, (tarSprite.y + upperLengthVec.y) * camera.scale.y + camera.y);
							this.debugGraphics.lineTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);

							drawArrow(tarSprite.x + upperLengthVec.x, tarSprite.y + upperLengthVec.y, targetRotation, 20, 45);
							var arrowPosition = 0.2;
							if (sprite.data.upperLimit > 300) drawArrow(tarSprite.x + upperLengthVec.x * arrowPosition, tarSprite.y + upperLengthVec.y * arrowPosition, targetRotation, 20, 45);

						} else {
							const length = 5000 / camera.scale.x;
							var lengthVec = {
								x: length * Math.cos(targetRotation),
								y: length * Math.sin(targetRotation)
							};
							var arrowPosition = 0.03;
							this.debugGraphics.lineStyle(1, "0xC554FA", lineAlpha);
							this.debugGraphics.moveTo((tarSprite.x - lengthVec.x) * camera.scale.x + camera.x, (tarSprite.y - lengthVec.y) * camera.scale.y + camera.y);
							this.debugGraphics.lineTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);
							drawArrow(tarSprite.x - lengthVec.x * arrowPosition, tarSprite.y - lengthVec.y * arrowPosition, targetRotation, 20, 45);

							this.debugGraphics.lineStyle(1, "0xFF9900", lineAlpha);
							this.debugGraphics.moveTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);
							this.debugGraphics.lineTo((tarSprite.x + lengthVec.x) * camera.scale.x + camera.x, (tarSprite.y + lengthVec.y) * camera.scale.y + camera.y);
							drawArrow(tarSprite.x + lengthVec.x * arrowPosition, tarSprite.y + lengthVec.y * arrowPosition, targetRotation, 20, 45);
						}
					});
				}
				// draw joint lines
				this.debugGraphics.lineStyle(1, this.jointLineColor, 1);
				tarSprite = sprite.parent.getChildAt(sprite.data.bodyA_ID);
				this.debugGraphics.moveTo(sprite.x * camera.scale.x + camera.x, sprite.y * camera.scale.y + camera.y);
				this.debugGraphics.lineTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);

				if (sprite.data.bodyB_ID != undefined) {
					tarSprite = sprite.parent.getChildAt(sprite.data.bodyB_ID);
					this.debugGraphics.moveTo(sprite.x * camera.scale.x + camera.x, sprite.y * camera.scale.y + camera.y);
					this.debugGraphics.lineTo(tarSprite.x * camera.scale.x + camera.x, tarSprite.y * camera.scale.y + camera.y);
				}

			}
		}
	}

	this.drawTransformGui = function () {
		const iconHeight = 32;
		const scale = 0.8;
		if(!this.transformGUI){
			this.transformGUI = new PIXI.Container();
			this.transformGUI.layerDown = new PIXIHeaven.Sprite(PIXI.Texture.from('layerDown0000'));
			this.transformGUI.layerDown.pivot.set(this.transformGUI.layerDown.width / 2, this.transformGUI.layerDown.height / 2);
			this.transformGUI.layerDown.scale.set(scale);
			this.transformGUI.addChild(this.transformGUI.layerDown);

			this.transformGUI.layerUp = new PIXIHeaven.Sprite(PIXI.Texture.from('layerUp0000'));
			this.transformGUI.layerUp.pivot.set(this.transformGUI.layerUp.width / 2, this.transformGUI.layerUp.height / 2);
			this.transformGUI.layerUp.scale.set(scale);
			this.transformGUI.layerUp.y-=iconHeight;
			this.transformGUI.addChild(this.transformGUI.layerUp);

			this.transformGUI.mirrorX = new PIXIHeaven.Sprite(PIXI.Texture.from('mirrorIcon0000'));
			this.transformGUI.mirrorX.pivot.set(this.transformGUI.mirrorX.width / 2, this.transformGUI.mirrorX.height / 2);
			this.transformGUI.mirrorX.scale.set(scale);
			this.transformGUI.addChild(this.transformGUI.mirrorX);
			this.transformGUI.mirrorX.y-=iconHeight*2;

			this.transformGUI.mirrorY = new PIXIHeaven.Sprite(PIXI.Texture.from('mirrorIcon0000'));
			this.transformGUI.mirrorY.pivot.set(this.transformGUI.mirrorY.width / 2, this.transformGUI.mirrorY.height / 2);
			this.transformGUI.mirrorY.scale.set(scale);
			this.transformGUI.addChild(this.transformGUI.mirrorY);
			this.transformGUI.mirrorY.y-=iconHeight*3;
			this.transformGUI.mirrorY.rotation = Math.PI/2;
		}
		this.transformGUI.visible = false;

		if(Object.keys(this.selectedPrefabs).length === 0 && this.selectedTextures.length === 0 && this.selectedPhysicsBodies.length === 0) return;
		if(this.selectedTextures.find(texture=>texture.data.type == this.object_JOINT)) return;

		this.transformGUI.visible = true;

		this.debugGraphics.addChild(this.transformGUI);

		const upperBoundPixi = this.getPIXIPointFromWorldPoint(this.selectedBoundingBox.upperBound);

		const borderOffset = 100;
		this.transformGUI.x = Math.max(borderOffset+iconHeight*4, Math.min(window.innerWidth-borderOffset, upperBoundPixi.x* this.cameraHolder.scale.x + this.cameraHolder.x))+iconHeight/2;
		this.transformGUI.y = Math.max(borderOffset, Math.min(window.innerHeight-borderOffset, upperBoundPixi.y* this.cameraHolder.scale.x + this.cameraHolder.y))-iconHeight/2;
	}

	this.fetchControllers
	this.doEditorGUI = function () {
		if (ui.editorGUI != undefined && ui.editorGUI.editData) {
			let controller;
			let controllers = ui.fetchControllersFromGUI(ui.editorGUI);
			let body;
			let sprite;
			let j;
			let i;
			for (i in controllers) {
				controller = controllers[i];
				if (controller.humanUpdate) {
					controller.humanUpdate = false;
					if (controller.property == "typeName") {
						if (this.selectedTool == this.tool_JOINTS) {
							var oldData = ui.editorGUI.editData;
							if (controller.targetValue == "Pin") {
								oldData.jointType = this.jointObject_TYPE_PIN;
							} else if (controller.targetValue == "Slide") {
								oldData.jointType = this.jointObject_TYPE_SLIDE;
							} else if (controller.targetValue == "Spring") {
								oldData.jointType = this.jointObject_TYPE_DISTANCE;
							} else if (controller.targetValue == "Rope") {
								oldData.jointType = this.jointObject_TYPE_ROPE;
							} else if (controller.targetValue == "Wheel") {
								oldData.jointType = this.jointObject_TYPE_WHEEL;
							}
							ui.destroyEditorGUI();
							ui.buildEditorGUI();
							ui.editorGUI.editData = oldData;

							let targetFolder = ui.editorGUI.addFolder('add joints');
							targetFolder.open();

							this.addJointGUI(oldData, targetFolder);
							if (ui.editorGUI) ui.registerDragWindow(ui.editorGUI);
						} else {
							//joint
							for (let j = 0; j < this.selectedTextures.length; j++) {
								if (controller.targetValue == "Pin") {
									this.selectedTextures[j].data.jointType = this.jointObject_TYPE_PIN;
									this.selectedTextures[j].texture = PIXI.Texture.from('pinJoint0000');
								} else if (controller.targetValue == "Slide") {
									this.selectedTextures[j].data.jointType = this.jointObject_TYPE_SLIDE;
									this.selectedTextures[j].texture = PIXI.Texture.from('slidingJoint0000');
								} else if (controller.targetValue == "Spring") {
									this.selectedTextures[j].data.jointType = this.jointObject_TYPE_DISTANCE;
									this.selectedTextures[j].texture = PIXI.Texture.from('distanceJoint0000');
								} else if (controller.targetValue == "Rope") {
									this.selectedTextures[j].data.jointType = this.jointObject_TYPE_ROPE;
									this.selectedTextures[j].texture = PIXI.Texture.from('ropeJoint0000');
								} else if (controller.targetValue == "Wheel") {
									this.selectedTextures[j].data.jointType = this.jointObject_TYPE_WHEEL;
									this.selectedTextures[j].texture = PIXI.Texture.from('wheelJoint0000');
								}

								if (this.selectedTextures[j].myTriggers) {
									const triggerLength = this.selectedTextures[j].myTriggers.length;
									for (let k = 0; k < triggerLength; k++) {
										trigger.removeTargetFromTrigger(this.selectedTextures[j].myTriggers[0], this.selectedTextures[j]);
									}
								}
							}

							this.updateSelection();
						}
					} else if (controller.property == "x") {
						//bodies & sprites & prefabs

						this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
							x: controller.targetValue,
							y: 0
						});
					} else if (controller.property == "y") {
						//bodies & sprites & prefabs

						this.applyToSelectedObjects(this.TRANSFORM_MOVE, {
							x: 0,
							y: controller.targetValue
						});

					} else if ((controller.property == "width" || controller.property == "height") && this.selectedPhysicsBodies.length+this.selectedTextures.length>0) {
						//bodies & sprites & ??prefabs

						for(let p = 0; p<Settings.scalePrecision; p++){
							const aabb = this.computeObjectsAABB(this.selectedPhysicsBodies, this.selectedTextures, true);
							const currentSize = {
								width: aabb.GetExtents().x * 2 * this.PTM,
								height: aabb.GetExtents().y * 2 * this.PTM
							}

							let targetWidth = currentSize.width;
							let targetHeight = currentSize.height;

							if (controller.property == "width") targetWidth = Math.min(Math.max(1, Math.abs(controller.targetValue)), editorSettings.worldSize.width);
							else targetHeight = Math.min(Math.max(1, Math.abs(controller.targetValue)), editorSettings.worldSize.height);

							const scaleX = targetWidth / currentSize.width;
							const scaleY = targetHeight / currentSize.height;

							this.applyToSelectedObjects(this.TRANSFORM_SCALE, {scaleX, scaleY});
						}
					} else if (controller.property == "collideConnected") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.collideConnected = controller.targetValue;
							}
						}
					} else if (controller.property == "autoReferenceAngle") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.autoReferenceAngle = controller.targetValue;
							}
						}
					} else if (controller.property == "enableMotor") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.enableMotor = controller.targetValue;
							}
						}
					} else if (controller.property == "maxMotorTorque") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.maxMotorTorque = controller.targetValue;
							}
						}
					} else if (controller.property == "motorSpeed") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.motorSpeed = controller.targetValue;
							}
						}
					} else if (controller.property == "enableLimit") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.enableLimit = controller.targetValue;
							}
						}
					} else if (controller.property == "upperAngle") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.upperAngle = controller.targetValue;
							}
						}
					} else if (controller.property == "lowerAngle") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.lowerAngle = controller.targetValue;
							}
						}
					} else if (controller.property == "frequencyHz") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.frequencyHz = controller.targetValue;
							}
						}
					} else if (controller.property == "dampingRatio") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.dampingRatio = controller.targetValue;
							}
						}
					} else if (controller.property == "upperLimit") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.upperLimit = controller.targetValue;
							}
						}
					} else if (controller.property == "lowerLimit") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							if (this.selectedTextures[j].data.type == this.object_JOINT) {
								this.selectedTextures[j].data.lowerLimit = controller.targetValue;
							}
						}
					} else if (controller.property == "rotation") {

						this.applyToSelectedObjects(this.TRANSFORM_ROTATE, controller.targetValue);


					} else if (controller.property == "groups" && controller.targetValue != "-") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.groups = controller.targetValue;
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.groups = controller.targetValue;
						}
					} else if (controller.property == "refName" && controller.targetValue != "-") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.refName = controller.targetValue;
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.refName = controller.targetValue;
						}
					} else if (controller.property == "tileTexture") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.tileTexture = controller.targetValue;
							this.updateTileSprite(body);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							if(controller.targetValue != ''){
								if(sprite.data.gradient != ''){
									sprite.data.gradient = '';
									this.updateTileSprite(sprite);
								}
							}
							sprite.data.tileTexture = controller.targetValue;
							this.updateTileSprite(sprite);
						}
					} else if (controller.property == "tint") {
						// sprite
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.tint = controller.targetValue;
							var color = sprite.data.tint;
							color = color.slice(1);
							sprite.originalSprite.tint = parseInt(color, 16);
						}
					}else if(controller.property == "gradient"){
						if(controller.targetValue === Settings.DEFAULT_TEXTS.newGradient){
							ui.showGradientsEditor(Settings.DEFAULT_TEXTS.newGradient);
							controller.targetValue = '';
						}else{
							for (j = 0; j < this.selectedTextures.length; j++) {
								sprite = this.selectedTextures[j];
								if(controller.targetValue != ''){
									if(sprite.data.tileTexture != ''){
										sprite.data.tileTexture = '';
										this.updateTileSprite(sprite);
									}
								}
								sprite.data.gradient = controller.targetValue;
								this.updateTileSprite(sprite);
							}
						}
					} else if (controller.property == "colorFill") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.colorFill[0] = controller.targetValue.toString();
							this.updateBodyShapes(body);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.colorFill = controller.targetValue.toString();
							this.updateGraphicShapes(sprite);
						}
					} else if (controller.property == "colorLine") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.colorLine[0] = controller.targetValue.toString();
							this.updateBodyShapes(body);
							this.updateTileSprite(body);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.colorLine = controller.targetValue.toString();
							this.updateGraphicShapes(sprite);
						}
					} else if (controller.property == "lineWidth") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.lineWidth[0] = controller.targetValue;
							this.updateBodyShapes(body);
							this.updateTileSprite(body);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.lineWidth = controller.targetValue;
							this.updateGraphicShapes(sprite);
							this.updateTileSprite(sprite);
						}
					} else if (controller.property == "transparancy") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];

							if(isBodyGroup(body)){
								body.mySprite.data.groupOpacity = controller.targetValue;
								setBodyGroupOpacity(body, body.mySprite.data.groupOpacity);
							}else{
								body.mySprite.data.transparancy[0] = controller.targetValue;
								body.mySprite.alpha = body.mySprite.data.transparancy[0];
							}
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.transparancy = controller.targetValue;
							if ([this.object_GRAPHICGROUP, this.object_TEXTURE, this.object_ANIMATIONGROUP, this.object_TEXT].includes(sprite.data.type)) {
								sprite.alpha = sprite.data.transparancy;
							} else {
								this.updateGraphicShapes(sprite);
								this.updateTileSprite(sprite);
							}
						}
					} else if(controller.property == "groupOpacity"){
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							if(isBodyGroup(body)){
								body.mySprite.data.groupOpacity = controller.targetValue;
								setBodyGroupOpacity(body, body.mySprite.data.groupOpacity);
							}
						}
					} else if (controller.property == "visible") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							if(!controller.targetValue){
								disableCulling(body.mySprite);
							}
							body.mySprite.data.visible = controller.targetValue;
							body.mySprite.renderable = controller.targetValue;
							if(body.myTexture){
								if(!controller.targetValue){
									disableCulling(body.myTexture);
								}
								body.myTexture.renderable = controller.targetValue;
							}
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.visible = controller.targetValue;
							if(!controller.targetValue){
								disableCulling(sprite);
							}
							sprite.renderable = controller.targetValue;
							sprite.forceRenderable = controller.targetValue;
						}
					} else if(controller.property == "mirrored"){
						for (j = 0; j < this.selectedTextures.length; j++) {
							const graphicGroup = this.selectedTextures[j];
							const currentScale = Math.abs(graphicGroup.scale.x);
							graphicGroup.scale.x = controller.targetValue ? -currentScale : currentScale;
							graphicGroup.data.mirrored = controller.targetValue;
						}
					} else if (controller.property == "fixed") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.fixed = controller.targetValue;
							if (body.mySprite.data.fixed) body.SetType(Box2D.b2_staticBody);
							else body.SetType(Box2D.b2_dynamicBody);

							var oldPosition = new b2Vec2(body.GetPosition().get_x(), body.GetPosition().get_y());
							body.SetTransform(new b2Vec2(1000, 1000), body.GetAngle());
							body.SetTransform(oldPosition, body.GetAngle());

							//update collision data
							this.setBodyCollision(body, body.mySprite.data.collision);

							//awake fix
							if (body.GetType() == Box2D.b2_dynamicBody) body.SetAwake(body.mySprite.data.awake);
						}

					} else if (controller.property == "awake") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.awake = controller.targetValue;
							body.SetAwake(false);
						}
						// prefab
						//Its not part of the standard list, so probably a custom list. Lets check which prefab is connected and try to set somthing there
						const prefabKeys = Object.keys(this.selectedPrefabs);
						if (prefabKeys.length > 0) {
							this.activePrefabs[prefabKeys[0]].class.set(controller.property, controller.targetValue);
						}
					} else if (controller.property == "density") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.density[0] = controller.targetValue;
							var fixture = body.GetFixtureList();
							fixture.SetDensity(controller.targetValue);
							body.ResetMassData();
						}
					} else if (controller.property == "friction") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.friction[0] = controller.targetValue;

							for (let fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
								fixture.SetFriction(controller.targetValue);
							}
						}
					} else if (controller.property == "restitution") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.restitution[0] = controller.targetValue;

							for (let fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
								fixture.SetRestitution(controller.targetValue);
							}
						}
					}else if (controller.property == "collisionTypes") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.collision[0] = controller.targetValue;
							this.setBodyCollision(body, body.mySprite.data.collision);
						}
					} else if(controller.property == "instaKill"){
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.instaKill = controller.targetValue;
							if(controller.targetValue) body.instaKill = true;
							else delete body.instaKill;
						}
					} else if(controller.property == "isVehiclePart"){
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.isVehiclePart = controller.targetValue;
							if(controller.targetValue) body.isVehiclePart = true;
							else delete body.isVehiclePart;
						}
					}else if(controller.property == "fixedRotation"){
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.fixedRotation = controller.targetValue;
							if(controller.targetValue) body.SetFixedRotation(true);
							else body.SetFixedRotation(false);
						}
					}else if(controller.property == "optimizePhysics"){
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.optimizePhysics = controller.targetValue;
							if(!body.mySprite.data.optimizePhysics){
								body.ignorePhysicsCuller = true;
								body.SetSleepingAllowed(false);
							}else{
								body.SetSleepingAllowed(true);
								delete body.ignorePhysicsCuller;
							}
						}
					}else if(controller.property == "bulletCollision"){
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.bulletCollision = controller.targetValue;
							body.SetBullet(controller.targetValue);
						}
					}else if(controller.property == "breakable"){
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.breakable = controller.targetValue;
						}
					}else if (controller.property == "tileTexture") {
						//do tileTexture
					} else if (controller.property == "lockselection") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.lockselection = controller.targetValue;
							if (body.mySprite.data.lockselection) body.mySprite.alpha /= 2;
							else body.mySprite.alpha = body.mySprite.data.transparancy || 1;
							if (body.myTexture) {
								body.myTexture.data.lockselection = controller.targetValue;
								if (body.mySprite.data.lockselection) body.myTexture.alpha /= 2;
								else body.myTexture.alpha = body.myTexture.data.transparancy || 1;
							}
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.lockselection = controller.targetValue;
							if (sprite.data.lockselection) sprite.alpha /= 2;
							else sprite.alpha = sprite.data.transparancy || 1;
						}
						var key;
						for (key in this.selectedPrefabs) {
							if (this.selectedPrefabs.hasOwnProperty(key)) {
								var lookup = this.lookupGroups[key];
								var allObjects = [].concat(lookup._bodies, lookup._textures, lookup._joints);
								for (j = 0; j < allObjects.length; j++) {
									if (allObjects[j].mySprite) sprite = allObjects[j].mySprite;
									else sprite = allObjects[j];
									sprite.data.lockselection = controller.targetValue;
									if (sprite.data.lockselection) sprite.alpha /= 2;
									else sprite.alpha = sprite.data.transparancy || 1;

									if (sprite.myBody && sprite.myBody.myTexture) {
										sprite.myBody.myTexture.data.lockselection = controller.targetValue;
										if (sprite.data.lockselection) sprite.myBody.myTexture.alpha /= 2;
										else sprite.myBody.myTexture.alpha = sprite.myBody.myTexture.data.transparancy || 1;
									}
								}
							}
						}
					} else if (controller.property == "targetTypeDropDown") {
						//trigger
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.targetType = trigger.triggerTargetType[controller.targetValue];
						}
						trigger.updateTriggerGUI();
					} else if (controller.property == "repeatTypeDropDown") {
						//trigger
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							const targetKeys = body.mySprite.data.targetType < trigger.triggerButtonIndex ? trigger.triggerRepeatType : trigger.triggerButtonRepeatType;
							body.mySprite.data.repeatType = targetKeys[controller.targetValue];
						}
						trigger.updateTriggerGUI();
					}else if (controller.property == "delay" && this.selectedPhysicsBodies.length>0) { // prefabs also use delay ..
						//trigger
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.delay = controller.targetValue;
						}
					}else if (controller.property == "repeatDelay") {
						//trigger
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.repeatDelay = controller.targetValue;
						}
					} else if (controller.property == "enabled") {
						//trigger
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.enabled = controller.targetValue;
							this.updateTriggerShape(body.mySprite);
						}
					} else if (controller.property == "follow") {
						//trigger
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							if(controller.targetValue === 1){
								body.mySprite.data.followPlayer = true;
								body.mySprite.data.followFirstTarget = false;
							} else if(controller.targetValue === 2){
								body.mySprite.data.followPlayer = false;
								body.mySprite.data.followFirstTarget = true;
							} else{
								body.mySprite.data.followPlayer = false;
								body.mySprite.data.followFirstTarget = false;
							}
						}
					} else if (controller.property == "followFirstTarget") {
						//trigger
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.followFirstTarget = controller.targetValue;
							if(controller.targetValue) body.mySprite.data.followPlayer = false;
						}
					} else if (controller.property == "randomTarget") {
						//trigger
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.randomTarget = controller.targetValue;
						}
					} else if (controller.property == "checkpointPersistent") {
						//trigger
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.checkpointPersistent = controller.targetValue;
						}
					}else if (controller.property == "triggerKey") {
						//trigger
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.mySprite.data.triggerKey = controller.targetValue;
						}
					} else if (controller.triggerActionKey != undefined) {
						//trigger action
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							if (controller.triggerActionKey == 'targetActionDropDown') {
								if(controller.triggerTargetID >= 0) body.mySprite.data.triggerActions[controller.triggerTargetID][controller.triggerActionID] = trigger.getAction(controller.targetValue);
								else body.mySprite.data.worldActions[controller.triggerActionID] = trigger.getAction(controller.targetValue);
								trigger.updateTriggerGUI();
							} else{
								if(controller.triggerTargetID >= 0){
									body.mySprite.data.triggerActions[controller.triggerTargetID][controller.triggerActionID][controller.triggerActionKey] = controller.targetValue;
									if(controller.forceUniqueBool){
										Object.keys(body.mySprite.data.triggerActions[controller.triggerTargetID][controller.triggerActionID]).forEach(key=>{
											if(key !== controller.triggerActionKey){
												body.mySprite.data.triggerActions[controller.triggerTargetID][key] = !controller.targetValue;
											}
										})
									trigger.updateTriggerGUI();
									}
								}
								else {
									body.mySprite.data.worldActions[controller.triggerActionID][controller.triggerActionKey] = controller.targetValue;
									if(controller.forceUniqueBool){
										Object.keys(body.mySprite.data.worldActions[controller.triggerActionID]).forEach(key=>{
											if(key !== controller.triggerActionKey && key !== 'type'){
												body.mySprite.data.worldActions[controller.triggerActionID][key] = !controller.targetValue;
											}
										})
										trigger.updateTriggerGUI();
									}
								}
							}
						}
					} else if (controller.property == "textColor") {
						//Text Object
						for (j = 0; j < this.selectedTextures.length; j++) {
							var textContainer = this.selectedTextures[j];
							textContainer.data.textColor = controller.targetValue;
							textContainer.textSprite.style.fill = textContainer.data.textColor;
						}
					} else if (controller.property == "fontSize") {
						//Text Object
						for (j = 0; j < this.selectedTextures.length; j++) {
							var textContainer = this.selectedTextures[j];

							textContainer.data.fontSize = controller.targetValue;
							textContainer.textSprite.style.fontSize = textContainer.data.fontSize;
							textContainer.pivot.x = -textContainer.textSprite.width/2;
							textContainer.pivot.y = -textContainer.textSprite.height/2;
							textContainer.updateTransform();
							textContainer.textSprite.x = -textContainer.textSprite.width;
							textContainer.textSprite.y = -textContainer.textSprite.height;

							// size 43 / width: 360/ x:
						}
					} else if (controller.property == "fontName") {
						//Text Object
						for (j = 0; j < this.selectedTextures.length; j++) {
							var textContainer = this.selectedTextures[j];
							textContainer.data.fontName = controller.targetValue;
							textContainer.textSprite.style.fontFamily = textContainer.data.fontName;
						}
					} else if (controller.property == "textAlign") {
						//Text Object
						for (j = 0; j < this.selectedTextures.length; j++) {
							const textContainer = this.selectedTextures[j];
							textContainer.data.textAlign = controller.targetValue;
							textContainer.textSprite.style.align = textContainer.data.textAlign;
						}
					} else if(controller.property == "parallax" || controller.property == "repeatTeleportX" || controller.property == "repeatTeleportY"){
						for (j = 0; j < this.selectedTextures.length; j++) {
							const textContainer = this.selectedTextures[j];
							textContainer.data[controller.property] = controller.targetValue;
						}
					}else if(controller.property == "fps" || controller.property == "playing" || controller.property == "loop"){
						for (j = 0; j < this.selectedTextures.length; j++) {
							const animationGraphic = this.selectedTextures[j];
							animationGraphic.data[controller.property] = controller.targetValue;
							this.initAnimation(animationGraphic);
						}
					}
						/* PREFAB SETTINGS */
					else {
						//Its not part of the standard list, so probably a custom list. Lets check which prefab is connected and try to set somthing there
						const prefabKeys = Object.keys(this.selectedPrefabs);
						if (prefabKeys.length > 0) {
							this.activePrefabs[prefabKeys[0]].class.set(controller.property, controller.targetValue);
						}

					}
				}
				if (controller.__input !== document.activeElement &&
					(controller.domElement.children[0].children && controller.domElement.children[0].children[0] !== document.activeElement)) {
					controller.updateDisplay();
				}
			}
			// DO SYNCING
			var syncObject;
			if (ui.editorGUI.editData.type == this.object_BODY || ui.editorGUI.editData.type == this.object_TRIGGER) {
				syncObject = this.selectedPhysicsBodies[0];
			}  else if (ui.editorGUI.editData.type == this.object_PREFAB) {
				var key = Object.keys(this.selectedPrefabs)[0];
				syncObject = this.activePrefabs[key];
			} else if (ui.editorGUI.editData.type == this.object_MULTIPLE) {
				if (this.selectedTextures.length > 0) syncObject = this.selectedTextures[0];
				else if (this.selectedPhysicsBodies.length > 0) syncObject = this.selectedPhysicsBodies[0];
				else syncObject = this.activePrefabs[key];
			}else {
				syncObject = this.selectedTextures[0];
			}
			if (syncObject) {
				if (syncObject.mySprite) {
					var pos = syncObject.GetPosition();
					ui.editorGUI.editData.x = pos.x * this.PTM;
					ui.editorGUI.editData.y = pos.y * this.PTM;
					ui.editorGUI.editData.rotation = syncObject.GetAngle() * this.RAD2DEG;
				} else {
					ui.editorGUI.editData.x = syncObject.x;
					ui.editorGUI.editData.y = syncObject.y;
					if(ui.editorGUI.editData.type == this.object_PREFAB) ui.editorGUI.editData.rotation = syncObject.rotation;
					else ui.editorGUI.editData.rotation = syncObject.rotation * this.RAD2DEG;

					if(ui.editorGUI.editData.type == this.object_TEXT){
						ui.editorGUI.editData.width = syncObject.width;
						ui.editorGUI.editData.height = syncObject.height;
					}
				}
			}

			//new sync for mouse movements
			for (i in controllers) {
				controller = controllers[i];
				if (controller.property == "x") {
					controller.initialValue = ui.editorGUI.editData.x;
				} else if (controller.property == "y") {
					controller.initialValue = ui.editorGUI.editData.y;
				} else if (controller.property == "rotation") {
					controller.initialValue = ui.editorGUI.editData.rotation;
				}
			}
		}
	}

	this.closeDrawing = false;
	this.activeVertices = [];

	this.verticesLineColor = 0x009DEC;
	this.verticesFillColor = 0xFFFFFF;
	this.verticesFirstFillColor = 0x004e64;
	this.verticesFirstShowFillColor = 0x004e64;
	this.verticesDoneFillColor = 0x7AE582;
	this.verticesAddFillColor = 0x00FF00;
	this.verticesBulletRadius = 3;
	this.verticesBoxSize = 3;

	this.verticesErrorLineColor = 0xFF0000;

	this.doVerticesLineDrawing = function (convex) {
		this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);

		let i = 0;
		let newVertice;
		let newVerticeScreen;
		let activeVertice;
		let activeVerticeScreen;

		this.closeDrawing = false;

		if (this.activeVertices.length > 0) {
			newVertice = this.getCurrentMouseVertice();
			activeVertice = this.activeVertices[this.activeVertices.length - 1];
			activeVerticeScreen = this.getScreenPointFromWorldPoint(activeVertice);

			if (this.activeVertices.length > 1) {
				let firstVertice = this.activeVertices[0];
				let disX = newVertice.x - firstVertice.x;
				let disY = newVertice.y - firstVertice.y;
				let dis = Math.sqrt(disX * disX + disY * disY);
				const graphicClosingMargin = 1 / this.cameraHolder.scale.x;
				let hasErrors = false;
				if (convex) {
					if (this.checkVerticeDrawingHasErrors()) {
						this.debugGraphics.lineStyle(1, this.verticesErrorLineColor, 1);
						hasErrors = true;
					}
				}
				if (dis <= graphicClosingMargin && !hasErrors) {
					this.closeDrawing = true;

					if(firstVertice.tempPoint2){
						activeVertice.point2 = firstVertice.tempPoint2;
						if(!activeVertice.point1){
							activeVertice.point1 = {x:activeVertice.x, y:activeVertice.y};
						}
					}
					newVertice = firstVertice;
				}

			}
			newVerticeScreen = this.getScreenPointFromWorldPoint(newVertice);

			this.debugGraphics.moveTo(activeVerticeScreen.x, activeVerticeScreen.y);

			if(!activeVertice.point1){
				this.debugGraphics.bezierCurveTo(activeVerticeScreen.x, activeVerticeScreen.y, newVerticeScreen.x, newVerticeScreen.y, newVerticeScreen.x, newVerticeScreen.y);
			}else{

				const point1Screen = this.getScreenPointFromWorldPoint(activeVertice.point1);
				if(!this.closeDrawing) activeVertice.point2 = {x:newVertice.x, y:newVertice.y};
				if(activeVertice.point2){
					const point2Screen = this.getScreenPointFromWorldPoint(activeVertice.point2);
					this.debugGraphics.bezierCurveTo(point1Screen.x, point1Screen.y, point2Screen.x, point2Screen.y, newVerticeScreen.x, newVerticeScreen.y);
				}
			}
		}

		for (i = 1; i < this.activeVertices.length; i++) {
			let currentPoint = this.activeVertices[i - 1];
			let nextPoint = this.activeVertices[i];

			let currentScreenPoint = this.getScreenPointFromWorldPoint(currentPoint);
			let nextScreenPoint = this.getScreenPointFromWorldPoint(nextPoint);

			this.debugGraphics.moveTo(currentScreenPoint.x, currentScreenPoint.y);

			if(!currentPoint.point1 || !currentPoint.point2){
				this.debugGraphics.bezierCurveTo(currentScreenPoint.x, currentScreenPoint.y, nextScreenPoint.x, nextScreenPoint.y, nextScreenPoint.x, nextScreenPoint.y);
			}else{

				const point1Screen = this.getScreenPointFromWorldPoint(currentPoint.point1);
				const point2Screen = this.getScreenPointFromWorldPoint(currentPoint.point2);

				this.debugGraphics.bezierCurveTo(point1Screen.x, point1Screen.y, point2Screen.x, point2Screen.y, nextScreenPoint.x, nextScreenPoint.y);
			}

		}

		for (i = 0; i < this.activeVertices.length; i++) {

			if (i == 0 && !this.closeDrawing) this.debugGraphics.beginFill(this.verticesFirstFillColor, 1.0);
			else if (i == 0 && this.closeDrawing) this.debugGraphics.beginFill(this.verticesDoneFillColor, 1.0);
			else this.debugGraphics.beginFill(this.verticesFillColor, 1.0);

			activeVertice = this.activeVertices[i];
			activeVerticeScreen = this.getScreenPointFromWorldPoint(activeVertice);

			this.debugGraphics.drawRect(activeVerticeScreen.x-Settings.verticeBoxSize/2, activeVerticeScreen.y-Settings.verticeBoxSize/2, Settings.verticeBoxSize, Settings.verticeBoxSize);

			this.debugGraphics.endFill();
		}

		// draw points
		if (this.activeVertices.length > 0) {
			if(activeVertice.point1){
				const previousVertice = this.activeVertices[this.activeVertices.length-2];
				const point2 = this.activeVertices.length > 1 ? (previousVertice.point2 || previousVertice) : activeVertice.tempPoint2;
				if(point2){

					this.debugGraphics.moveTo(activeVerticeScreen.x, activeVerticeScreen.y);
					const point1Screen = this.getScreenPointFromWorldPoint(activeVertice.point1);
					this.debugGraphics.lineTo(point1Screen.x, point1Screen.y);
					this.debugGraphics.moveTo(point1Screen.x + this.verticesBulletRadius, point1Screen.y);
					this.debugGraphics.arc(point1Screen.x, point1Screen.y, this.verticesBulletRadius, 0, 2 * Math.PI, false);
					this.debugGraphics.moveTo(activeVerticeScreen.x, activeVerticeScreen.y);

					const point2Screen = this.getScreenPointFromWorldPoint(point2);
					this.debugGraphics.lineTo(point2Screen.x, point2Screen.y);
					this.debugGraphics.moveTo(point2Screen.x + this.verticesBulletRadius, point2Screen.y);
					this.debugGraphics.arc(point2Screen.x, point2Screen.y, this.verticesBulletRadius, 0, 2 * Math.PI, false);
				}
			}
		}
	}

	this.preOptimizeArtVertices = function(){
		if(this.activeVertices.length>2){
			const p1 = this.activeVertices[this.activeVertices.length-3];
			const p2 = this.activeVertices[this.activeVertices.length-2];
			const p3 = this.activeVertices[this.activeVertices.length-1];

			const s1dx = p2.x-p1.x;
			const s1dy = p2.y-p1.y;
			const s1a = Math.atan2(s1dy, s1dx);

			const s2dx = p3.x-p2.x;
			const s2dy = p3.y-p2.y;
			const s2a = Math.atan2(s2dy, s2dx);

			if(Math.abs(angleDifference(s1a, s2a)) < Settings.minimumArtToolAngle){
				this.activeVertices.splice(this.activeVertices.length-2, 1);
			}

		}
	}

	this.checkVerticeDrawingHasErrors = function () {
		if(this.selectedTool === this.tool_PEN) return false;
		const minimumAngleDif = 0.05;
		const newVertice = this.getCurrentMouseVertice();
		const activeVertice = this.activeVertices[this.activeVertices.length - 1];
		let previousVertice;
		for (let i = 0; i < this.activeVertices.length - 1; i++) {
			if (lineIntersect(this.activeVertices[i], this.activeVertices[i + 1], newVertice, activeVertice)) {
				return true
			} else {
				previousVertice = this.activeVertices[this.activeVertices.length - 2];
				const activeSegmentAngle = Math.atan2(previousVertice.y - activeVertice.y, previousVertice.x - activeVertice.x);
				const newSegmentAngle = Math.atan2(newVertice.y - activeVertice.y, newVertice.x - activeVertice.x);
				const angleDif = activeSegmentAngle - newSegmentAngle;
				const shortestDif = Math.atan2(Math.sin(angleDif), Math.cos(angleDif));
				if (Math.abs(shortestDif) < minimumAngleDif) return true;

			}
		}
		return false;
	}
	this.getCurrentMouseVertice = function(){
		const newVertice = {
			x: this.mousePosWorld.get_x(),
			y: this.mousePosWorld.get_y()
		}

		if(this.activeVertices.length>0 && this.shiftDown){
			const previousVertice = this.activeVertices[this.activeVertices.length-1];

			const dx = newVertice.x-previousVertice.x;
			const dy = newVertice.y-previousVertice.y;
			const l = Math.sqrt(dx*dx+dy*dy);
			let a = Math.atan2(dy, dx);

			const angleStep = 15*this.DEG2RAD;

			a = Math.floor(a/angleStep)*angleStep;

			newVertice.x = previousVertice.x + l*Math.cos(a);
			newVertice.y = previousVertice.y + l*Math.sin(a);
		}

		return newVertice;
	}
	this.doVerticesDrawing = function () {
		this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);

		let i = 0;
		let activeVertice;
		let previousVertice;

		for (i = 0; i < this.activeVertices.length; i++) {

			if (i == 0) this.debugGraphics.beginFill(this.verticesFirstFillColor, 0.5);
			else this.debugGraphics.beginFill(this.verticesFillColor, 0.5);

			activeVertice = this.activeVertices[i];

			if (i > 0) previousVertice = this.activeVertices[i - 1];

			if (previousVertice) {
				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.cameraHolder.scale.x + this.cameraHolder.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.cameraHolder.scale.y + this.cameraHolder.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(previousVertice).x * this.cameraHolder.scale.x + this.cameraHolder.x, this.getPIXIPointFromWorldPoint(previousVertice).y * this.cameraHolder.scale.y + this.cameraHolder.y);
			}

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.cameraHolder.scale.x + this.cameraHolder.x + this.verticesBulletRadius, this.getPIXIPointFromWorldPoint(activeVertice).y * this.cameraHolder.scale.y + this.cameraHolder.y);
			this.drawBox(this.debugGraphics, this.getPIXIPointFromWorldPoint(activeVertice).x * this.cameraHolder.scale.x + this.cameraHolder.x - this.verticesBoxSize / 2, this.getPIXIPointFromWorldPoint(activeVertice).y * this.cameraHolder.scale.y + this.cameraHolder.y - this.verticesBoxSize / 2, this.verticesBoxSize, this.verticesBoxSize, this.verticesLineColor, 1, 1, 0xFFFFFF, 1);

			this.debugGraphics.endFill(); //fix

		}
	}
	this.doVerticeEditing = function () {
		const camera = B2dEditor.container.camera || B2dEditor.container;

		const spriteData = this.verticeEditingSprite.data;
		let vertices = spriteData.type === this.object_BODY ? spriteData.vertices[0] : spriteData.vertices;

		if(spriteData.type === this.object_BODY){
			vertices = vertices.flat(2).map(point=> ({x:point.x*Settings.PTM, y:point.y*Settings.PTM}));
		}

		vertices.forEach((vertice, index) => {
			this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);
			this.debugGraphics.beginFill(this.verticesFillColor, 0.5);

			const vl = Math.sqrt(vertice.x*vertice.x + vertice.y*vertice.y);
			const va = this.verticeEditingSprite.rotation + Math.atan2(vertice.y, vertice.x);

			const vx = vl*Math.cos(va);
			const vy = vl*Math.sin(va);

			const verticeX = this.cameraHolder.x + (this.verticeEditingSprite.x + vx) * this.cameraHolder.scale.x - Settings.verticeBoxSize/2;
			const verticeY = this.cameraHolder.y + (this.verticeEditingSprite.y + vy) * this.cameraHolder.scale.y - Settings.verticeBoxSize/2;

			const closeDistance = Settings.handleClosestDistance / camera.scale.x;


			if(this.verticeEditingSprite.selectedVertice){
				if(this.verticeEditingSprite.selectedVertice.includes(index)){
					this.debugGraphics.beginFill(this.verticesFillColor, 1.0);

					if(vertice.point1){
						if(Math.abs(vertice.x-vertice.point1.x) * this.cameraHolder.scale.x  > closeDistance || Math.abs(vertice.y-vertice.point1.y) * this.cameraHolder.scale.x > closeDistance){
							const vp1l = Math.sqrt(vertice.point1.x*vertice.point1.x + vertice.point1.y*vertice.point1.y);
							const vp1a = this.verticeEditingSprite.rotation + Math.atan2(vertice.point1.y, vertice.point1.x);
							const vp1x = vp1l*Math.cos(vp1a);
							const vp1y = vp1l*Math.sin(vp1a);
							const verticeP1X = this.cameraHolder.x + (this.verticeEditingSprite.x + vp1x) * this.cameraHolder.scale.x;
							const verticeP1Y = this.cameraHolder.y + (this.verticeEditingSprite.y + vp1y) * this.cameraHolder.scale.y;


							this.debugGraphics.moveTo(verticeX+Settings.verticeBoxSize/2, verticeY+Settings.verticeBoxSize/2);
							this.debugGraphics.lineTo(verticeP1X, verticeP1Y);

							this.debugGraphics.drawCircle(verticeP1X, verticeP1Y, Settings.verticeBoxSize/2);
						}
					}

					let previousVertice = vertices[index-1];
					if(index === 0) previousVertice = vertices[vertices.length-1];
					if(previousVertice.point2){
						if(Math.abs(vertice.x-previousVertice.point2.x) > closeDistance || Math.abs(vertice.y-previousVertice.point2.y) > closeDistance){
							const vp2l = Math.sqrt(previousVertice.point2.x*previousVertice.point2.x + previousVertice.point2.y*previousVertice.point2.y);
							const vp2a = this.verticeEditingSprite.rotation + Math.atan2(previousVertice.point2.y, previousVertice.point2.x);
							const vp2x = vp2l*Math.cos(vp2a);
							const vp2y = vp2l*Math.sin(vp2a);
							const verticeP2X = this.cameraHolder.x + (this.verticeEditingSprite.x + vp2x) * this.cameraHolder.scale.x;
							const verticeP2Y = this.cameraHolder.y + (this.verticeEditingSprite.y + vp2y) * this.cameraHolder.scale.y;

							this.debugGraphics.moveTo(verticeX+Settings.verticeBoxSize/2, verticeY+Settings.verticeBoxSize/2);
							this.debugGraphics.lineTo(verticeP2X, verticeP2Y);
							this.debugGraphics.drawCircle(verticeP2X, verticeP2Y, Settings.verticeBoxSize/2);
						}
					}
				}
			}

			if(index === 0 && this.verticeEditingCallback){
				this.debugGraphics.beginFill(this.verticesFirstShowFillColor, 1.0);
			}

			this.debugGraphics.drawRect(verticeX, verticeY, Settings.verticeBoxSize, Settings.verticeBoxSize);
		})

		if(this.verticeEditingSprite.highlightVertice){
			this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);
			this.debugGraphics.beginFill(this.verticesAddFillColor, 0.5);

			const vl = Math.sqrt(this.verticeEditingSprite.highlightVertice.x*this.verticeEditingSprite.highlightVertice.x + this.verticeEditingSprite.highlightVertice.y*this.verticeEditingSprite.highlightVertice.y);
			const va = this.verticeEditingSprite.rotation + Math.atan2(this.verticeEditingSprite.highlightVertice.y, this.verticeEditingSprite.highlightVertice.x);

			const vx = vl*Math.cos(va);
			const vy = vl*Math.sin(va);

			const verticeX = this.cameraHolder.x + (this.verticeEditingSprite.x + vx) * this.cameraHolder.scale.x - Settings.verticeBoxSize/2;
			const verticeY = this.cameraHolder.y + (this.verticeEditingSprite.y + vy) * this.cameraHolder.scale.y - Settings.verticeBoxSize/2;

			this.debugGraphics.drawRect(verticeX, verticeY, Settings.verticeBoxSize, Settings.verticeBoxSize);
		}
	}
	this.getClosestPointDataToVertices = function (point, vertices) {
		let closestDistance = Number.POSITIVE_INFINITY;
		let closestPoint = null;
		let closestIndex = null;
		vertices.forEach((vertice, index) => {
			let nextVertice = index === vertices.length-1 ? vertices[0] : vertices[index+1];
			if(vertice.point1){
				// point on curve
				const curve = [vertice, vertice.point1 || {x:vertice.x, y:vertice.y}, vertice.point2  || {x:vertice.x, y:vertice.y}, nextVertice];
				const distance = distanceFromCurve(point, curve).distance;
				if(distance<closestDistance){
					closestDistance = distance;
					const curvePointInfo = nearestPointOnCurve(point, curve);
					closestPoint = curvePointInfo.point;
					closestIndex = index;
				}
			}else{
				const pointData = linePointDistance(point.x, point.y, vertice.x, vertice.y, nextVertice.x, nextVertice.y);
				if(pointData.distance< closestDistance){
					closestDistance = pointData.distance;
					closestPoint = {x:pointData.x, y:pointData.y};
					closestIndex = index;
				}
			}
		});



		return {point:closestPoint, distance:closestDistance, index:closestIndex};
	}

	this.doGeometryDrawing = function () {
		const camera = B2dEditor.container.camera || B2dEditor.container;

		if (this.mouseDown && !this.spaceCameraDrag) {
			this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);
			this.debugGraphics.beginFill(this.verticesFillColor, 0.5);

			if (ui.editorGUI.editData.shape == "Circle") {
				let radius = new b2Vec2(this.mousePosWorld.get_x() - this.startSelectionPoint.x, this.mousePosWorld.get_y() - this.startSelectionPoint.y).Length() * this.PTM;
				if(this.shiftDown){
					radius = Math.floor(radius / Settings.geometrySnapScale) * Settings.geometrySnapScale;
				}

				radius *= camera.scale.x;

				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(this.startSelectionPoint).x * camera.scale.x + camera.x + radius, this.getPIXIPointFromWorldPoint(this.startSelectionPoint).y * camera.scale.y + camera.y );
				this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(this.startSelectionPoint).x * camera.scale.x + camera.x , this.getPIXIPointFromWorldPoint(this.startSelectionPoint).y * camera.scale.y + camera.y, radius, 0, 2 * Math.PI, false);
			} else if (ui.editorGUI.editData.shape == "Box") {

				let difX = this.mousePosWorld.get_x() - this.startSelectionPoint.x;
				let difY = this.mousePosWorld.get_y() - this.startSelectionPoint.y;

				if(this.shiftDown){
					difX *= Settings.PTM;
					difX = Math.floor(difX/Settings.geometrySnapScale) * Settings.geometrySnapScale-1;
					difX /= Settings.PTM;

					difY *= Settings.PTM;
					difY = Math.floor(difY/Settings.geometrySnapScale) * Settings.geometrySnapScale-1;
					difY /= Settings.PTM;
				}

				this.activeVertices = [];
				this.activeVertices.push({
					x: this.startSelectionPoint.x+difX,
					y: this.startSelectionPoint.y+difY
				});
				this.activeVertices.push({
					x: this.startSelectionPoint.x+difX,
					y: this.startSelectionPoint.y
				});
				this.activeVertices.push({
					x: this.startSelectionPoint.x,
					y: this.startSelectionPoint.y
				});
				this.activeVertices.push({
					x: this.startSelectionPoint.x,
					y: this.startSelectionPoint.y+difY
				});

				if (this.mousePosWorld.get_x() < this.startSelectionPoint.x) this.activeVertices.reverse();

				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(this.activeVertices[0]).x * this.cameraHolder.scale.x + this.cameraHolder.x, this.getPIXIPointFromWorldPoint(this.activeVertices[0]).y * this.cameraHolder.scale.y + this.cameraHolder.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[1]).x * this.cameraHolder.scale.x + this.cameraHolder.x, this.getPIXIPointFromWorldPoint(this.activeVertices[1]).y * this.cameraHolder.scale.y + this.cameraHolder.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[2]).x * this.cameraHolder.scale.x + this.cameraHolder.x, this.getPIXIPointFromWorldPoint(this.activeVertices[2]).y * this.cameraHolder.scale.y + this.cameraHolder.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[3]).x * this.cameraHolder.scale.x + this.cameraHolder.x, this.getPIXIPointFromWorldPoint(this.activeVertices[3]).y * this.cameraHolder.scale.y + this.cameraHolder.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[0]).x * this.cameraHolder.scale.x + this.cameraHolder.x, this.getPIXIPointFromWorldPoint(this.activeVertices[0]).y * this.cameraHolder.scale.y + this.cameraHolder.y);
			} else if (ui.editorGUI.editData.shape == "Triangle") {
				this.activeVertices = [];
	
				let difX = this.mousePosWorld.get_x() - this.startSelectionPoint.x;
				let difY = this.mousePosWorld.get_y() - this.startSelectionPoint.y;

				if(this.shiftDown){
					difX *= Settings.PTM;
					difX = Math.floor(difX/Settings.geometrySnapScale) * Settings.geometrySnapScale-1;
					difX /= Settings.PTM;

					difY *= Settings.PTM;
					difY = Math.floor(difY/Settings.geometrySnapScale) * Settings.geometrySnapScale-1;
					difY /= Settings.PTM;
				}

				this.activeVertices.push({
					x: this.startSelectionPoint.x+difX,
					y: this.startSelectionPoint.y
				});
				this.activeVertices.push({
					x: this.startSelectionPoint.x+difX/2,
					y: this.startSelectionPoint.y+difY
				});
				this.activeVertices.push({
					x: this.startSelectionPoint.x,
					y: this.startSelectionPoint.y
				});

				if (this.mousePosWorld.get_x() < this.startSelectionPoint.x) this.activeVertices.reverse();

				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(this.activeVertices[0]).x * this.cameraHolder.scale.x + this.cameraHolder.x, this.getPIXIPointFromWorldPoint(this.activeVertices[0]).y * this.cameraHolder.scale.y + this.cameraHolder.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[1]).x * this.cameraHolder.scale.x + this.cameraHolder.x, this.getPIXIPointFromWorldPoint(this.activeVertices[1]).y * this.cameraHolder.scale.y + this.cameraHolder.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[2]).x * this.cameraHolder.scale.x + this.cameraHolder.x, this.getPIXIPointFromWorldPoint(this.activeVertices[2]).y * this.cameraHolder.scale.y + this.cameraHolder.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(this.activeVertices[0]).x * this.cameraHolder.scale.x + this.cameraHolder.x, this.getPIXIPointFromWorldPoint(this.activeVertices[0]).y * this.cameraHolder.scale.y + this.cameraHolder.y);
			}
			this.debugGraphics.endFill();
		}
	}
	this.doTriggerTargetSelection = function () {
		let highestObject = this.retrieveHighestSelectedObject(this.mousePosWorld, this.mousePosWorld);
		if (highestObject) {

			if(this.previousHighestTriggerTargetObject){
				this.previousHighestTriggerTargetObject.alpha = this.previousHighestTriggerTargetObject.oldAlpha;
				delete this.previousHighestTriggerTargetObject.oldAlpha;
			}

			let tarPos;
			if (highestObject.data.prefabInstanceName) {
				const tarPrefab = this.activePrefabs[highestObject.data.prefabInstanceName];
				tarPos = new b2Vec2(tarPrefab.x, tarPrefab.y);
			} else if ([this.object_BODY, this.object_TRIGGER].includes(highestObject.data.type)) {
				tarPos = b2CloneVec2(highestObject.myBody.GetPosition());
				tarPos.x *= this.PTM;
				tarPos.y *= this.PTM;
			} else {
				tarPos = highestObject.position.clone();
			}
			let myPos;
			for (var i = 0; i < this.selectedPhysicsBodies.length; i++) {
				if (this.selectedPhysicsBodies[i] != highestObject) {
					myPos = this.selectedPhysicsBodies[i].GetPosition();
					myPos = this.getPIXIPointFromWorldPoint(myPos);

					game.levelCamera.matrix.apply(myPos,myPos);
					game.levelCamera.matrix.apply(tarPos,tarPos);


					drawing.drawLine(myPos, tarPos, {
						color: "0xFFFF00"
					});
				}
			}
			this.markTargetSprite(highestObject);
		}else {
			this.unmarkTargetSprite();
		}
	}

	this.markTargetSprite = function(targetSprite){

		if(this.markedTargetSprite && this.markedTargetSprite === targetSprite) return;
		if(this.markedTargetSprite) this.unmarkTargetSprite(this.markedTargetSprite);

		const allSprites = this.getAllRelatedSprites(targetSprite);

		allSprites.forEach(sprite => {
			if(sprite.alpha > 0){
				sprite.oldAlpha = sprite.alpha;
				sprite.alpha *= 0.5;
			}
		});

		this.markedTargetSprite = targetSprite;
	}

	this.unmarkTargetSprite = function(){

		if(!this.markedTargetSprite) return;

		const allSprites = this.getAllRelatedSprites(this.markedTargetSprite);

		allSprites.forEach(sprite => {
			if(sprite.oldAlpha){
				sprite.alpha = sprite.oldAlpha;
				delete sprite.oldAlpha;
			}
		});

		delete this.markedTargetSprite;
	}
	this.getAllRelatedSprites = function(sprite){
		let sprites = [sprite];

		if(sprite.data.prefabInstanceName){
			// we got a prefab, find the lowest or highest clip
			const prefab = this.activePrefabs[sprite.data.prefabInstanceName];
			const lookup = prefab.class ? prefab.class.lookupObject : null;
			if(lookup){
				sprites = [].concat(lookup._bodies, lookup._joints, lookup._textures);

				lookup._bodies.forEach(body=>{
					if(body.myTexture) sprites.push(body.myTexture);
				})
			}
		}else if(sprite.data.type === this.object_BODY){
			if(sprite.myBody.myTexture) sprites.push(sprite.myBody.myTexture);
		}
		return sprites;
	}

	this.stopTriggerTargetSelecting = function(){
		this.unmarkTargetSprite();
		this.selectingTriggerTarget = false;
	}
	this.retrieveHighestSelectedObject = function (lowerBound, upperBound, skipLayer=Number.POSITIVE_INFINITY) {
		let i;
		let body;
		const selectedPhysicsBodies = this.queryWorldForBodies(lowerBound, upperBound);
		const selectedTextures = this.queryWorldForGraphics(lowerBound, upperBound);

		if (selectedPhysicsBodies.length > 0) {

			var fixture;
			var pointInsideBody = false;
			for (i = 0; i < selectedPhysicsBodies.length; i++) {
				body = selectedPhysicsBodies[i];


				for (let fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
					if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), lowerBound)) {
						pointInsideBody = true;
					}
				}


				if (!pointInsideBody) {
					selectedPhysicsBodies.splice(i, 1);
					i--;
				}
			}
		}

		for(let i = 0; i<selectedTextures.length; i++){
			const texture = selectedTextures[i];
			if(texture.myBody){
				if(!selectedPhysicsBodies.includes(texture.myBody) && texture.data.type !== this.object_BODY){
					selectedPhysicsBodies.push(texture.myBody);
				}
				selectedTextures.splice(i, 1);
				i--;
			}
		}

		//limit selection to highest indexed child

		var highestObject;
		for (i = 0; i < selectedPhysicsBodies.length; i++) {
			body = selectedPhysicsBodies[i];
			var texture = body.mySprite;
			if (body.myTexture) texture = body.myTexture;
			const textureIndex = texture.parent.getChildIndex(texture);
			if(textureIndex < skipLayer){
				if (highestObject == undefined) highestObject = texture;
				// deep click detection
				if (textureIndex > highestObject.parent.getChildIndex(highestObject)) {
					highestObject = texture;
				}
			}
		}
		var sprite;
		for (i = 0; i < selectedTextures.length; i++) {
			sprite = selectedTextures[i];
			const spriteIndex = sprite.parent.getChildIndex(sprite);
			if(spriteIndex < skipLayer){
				if (highestObject == undefined) highestObject = sprite;
				if (spriteIndex > highestObject.parent.getChildIndex(highestObject)) {
					highestObject = sprite;
				}
			}
		}
		return highestObject;
	}

	this.retreivePrefabChildAt = function(initialSprite, highest){
		let targetIndex = initialSprite.parent.getChildIndex(initialSprite);
		let targetSprite = initialSprite;
		if(initialSprite.data.prefabInstanceName){
			// we got a prefab, find the lowest or highest clip
			const prefab = this.activePrefabs[initialSprite.data.prefabInstanceName];
			const lookup = prefab.class ? prefab.class.lookupObject : null;
			if(lookup){
				const allSprites = [].concat(lookup._bodies, lookup._joints, lookup._textures);
				allSprites.forEach(spriteObject => {
					const sprite = spriteObject.mySprite ? spriteObject.mySprite : spriteObject;
					let spriteIndex = sprite.parent.getChildIndex(sprite);
					if(highest){
						if(spriteIndex > targetIndex){
							targetIndex = spriteIndex;
							targetSprite = sprite;
						}
					}else{
						if(spriteIndex < targetIndex){
							targetIndex = spriteIndex;
							targetSprite = sprite;
						}
					}
				})
			}
		}
		return targetSprite;
	}

	this.createBodyObjectFromVerts = function (verts) {
		var bodyObject = new this.bodyObject;

		var vertsConversion = this.convertGlobalVertsToLocalVerts(verts);
		verts = vertsConversion[0];
		var centerPoint = vertsConversion[1];

		bodyObject.x = centerPoint.x;
		bodyObject.y = centerPoint.y;

		//check winding order
		const area = BodyBreakable.calculateBodyArea(verts);
		if (Math.abs(area) < this.minimumBodySurfaceArea) return false;

		bodyObject.vertices = area < 0 ? verts.reverse() : verts;

		return bodyObject;
	}
	this.createBodyFromEarcutResult = function (verts) {
		var bodyObject = new this.bodyObject;

		var vertsConversion = this.convertGlobalVertsToLocalVerts(verts);
		verts = vertsConversion[0];
		var centerPoint = vertsConversion[1];

		bodyObject.x = centerPoint.x;
		bodyObject.y = centerPoint.y;

		var area = 0
		for (var i = 0; i < verts.length; i++) {
			var x1 = verts[i].x;
			var y1 = verts[i].y;
			var x2 = verts[(i + 1) % verts.length].x;
			var y2 = verts[(i + 1) % verts.length].y;
			area += (x1 * y2 - x2 * y1);
		}
		if (Math.abs(area * this.PTM) < this.minimumBodySurfaceArea) return false;


		bodyObject.vertices = [
			[verts]
		];
		bodyObject.radius = [bodyObject.radius];
		bodyObject.colorFill = [bodyObject.colorFill];
		bodyObject.colorLine = [bodyObject.colorLine];
		bodyObject.lineWidth = [bodyObject.lineWidth];
		bodyObject.transparancy = [bodyObject.transparancy];
		bodyObject.density = [bodyObject.density];
		bodyObject.friction = [bodyObject.friction];
		bodyObject.restitution = [bodyObject.restitution];

		return bodyObject;
	}
	this.createGraphicObjectFromVerts = function (verts) {
		var graphicObject = new this.graphicObject;
		for (var i = 0; i < verts.length; i++) {
			verts[i].x = verts[i].x * this.PTM;
			verts[i].y = verts[i].y * this.PTM;
			verts[i].point1 = (verts[i].point1 == undefined) ? undefined : {
				x: verts[i].point1.x * this.PTM,
				y: verts[i].point1.y * this.PTM
			};
			verts[i].point2 = (verts[i].point2 == undefined) ? undefined : {
				x: verts[i].point2.x * this.PTM,
				y: verts[i].point2.y * this.PTM
			};
		}
		var lowX = 0;
		var lowY = 0;
		for (var i = 0; i < verts.length; i++) {
			if (verts[i].x < lowX) lowX = verts[i].x;
			if (verts[i].y < lowY) lowY = verts[i].y;
		}

		for (var i = 0; i < verts.length; i++) {
			verts[i].x += lowX;
			verts[i].y += lowY;
			verts[i].point1 = (verts[i].point1 == undefined) ? undefined : {
				x: verts[i].point1.x + lowX,
				y: verts[i].point1.y + lowY
			};
			verts[i].point2 = (verts[i].point2 == undefined) ? undefined : {
				x: verts[i].point2.x + lowX,
				y: verts[i].point2.y + lowY
			};
		}

		var vertsConversion = this.convertGlobalVertsToLocalVerts(verts);
		verts = vertsConversion[0];
		var centerPoint = vertsConversion[1];

		graphicObject.x = centerPoint.x - lowX;
		graphicObject.y = centerPoint.y - lowY;
		graphicObject.vertices = verts;

		return graphicObject;
	}
	this.convertGlobalVertsToLocalVerts = function (verts) {
		var i = 0;
		var centerPoint = {
			x: 0,
			y: 0
		};
		var vert;
		for (i = 0; i < verts.length; i++) {
			vert = verts[i];
			centerPoint = {
				x: centerPoint.x + vert.x,
				y: centerPoint.y + vert.y
			};
		}
		centerPoint = {
			x: centerPoint.x / verts.length,
			y: centerPoint.y / verts.length
		};

		for (i = 0; i < verts.length; i++) {
			verts[i] = {
				x: verts[i].x - centerPoint.x,
				y: verts[i].y - centerPoint.y,
				point1: (verts[i].point1 == undefined) ? undefined : {
					x: verts[i].point1.x - centerPoint.x,
					y: verts[i].point1.y - centerPoint.y
				},
				point2: (verts[i].point2 == undefined) ? undefined : {
					x: verts[i].point2.x - centerPoint.x,
					y: verts[i].point2.y - centerPoint.y
				},
			};
		}
		return [verts, centerPoint];
	}
	this.convertSelectedGraphicsToBodies = function () {
		const bodiesCreated = this.convertGraphicsToBodies(this.selectedTextures);

		this.selectedPhysicsBodies = [];
		this.deleteSelection();
		this.selectedPhysicsBodies = bodiesCreated;
		this.updateSelection();
	}
	this.convertGraphicsToBodies = function (arr) {
		var graphic;
		var bodiesCreated = [];
		for (var i = 0; i < arr.length; i++) {
			var innerGraphics = [];

			var graphicContainer = arr[i];

			if (graphicContainer.data.type == this.object_GRAPHIC) innerGraphics.push(graphicContainer.data);
			else graphicContainer.data.graphicObjects.forEach(g => {
				innerGraphics.push(this.parseArrObject(g));
			});

			this.updateObject(graphicContainer, graphicContainer.data);

			var innerBodies = [];
			for (var j = 0; j < innerGraphics.length; j++) {

				graphic = innerGraphics[j];

				var verts = graphic.vertices;
				for (var k = 0; k < verts.length; k++) {
					verts[k].x /= this.PTM;
					verts[k].y /= this.PTM;
				}
				let bodyObject;
				if (graphic.radius) {
					bodyObject = new this.bodyObject;
					bodyObject.vertices = [{
						x: 0,
						y: 0
					}];

				} else {
					if (isConvex(verts)) bodyObject = this.createBodyObjectFromVerts(verts);
					else bodyObject = this.createBodyFromEarcutResult(verts);
				}

				if (bodyObject) {
					bodyObject.colorFill = graphic.colorFill;
					bodyObject.colorLine = graphic.colorLine;
					bodyObject.lineWidth = graphic.lineWidth;
					bodyObject.transparancy = graphic.transparancy;
					bodyObject.radius = graphic.radius || 0;
					bodyObject.x = graphic.x / this.PTM;
					bodyObject.y = graphic.y / this.PTM;

					if (graphic.radius) {
						bodyObject.x += graphic.vertices[0].x * this.PTM;
						bodyObject.y += graphic.vertices[0].y * this.PTM;
					}
					bodyObject.tileTexture = graphic.tileTexture;

					bodyObject.rotation = 0;
					innerBodies.push(this.buildBodyFromObj(bodyObject));
				}
			}

			innerBodies.forEach(b => {
				this.updateObject(b.mySprite, b.mySprite.data);
			});


			var body = null;
			if (innerBodies.length >= 1) body = this.groupBodyObjects(innerBodies);
			else body = innerBodies[0];

			if (body) {
				body.mySprite.parent.swapChildren(graphicContainer, body.mySprite);
				if (graphicContainer.data.type == this.object_GRAPHICGROUP) {
					body.mySprite.alpha = graphicContainer.data.transparancy;
					body.mySprite.data.transparancy[0] = graphicContainer.data.transparancy;
				}
				bodiesCreated.push(body);

				var left = Number.POSITIVE_INFINITY;
				var down = Number.POSITIVE_INFINITY;
				var right = -Number.POSITIVE_INFINITY;
				var up = -Number.POSITIVE_INFINITY;

				for (k = 0; k < innerGraphics.length; k++) {
					if (innerGraphics[k].x < left) left = innerGraphics[k].x;
					if (innerGraphics[k].y < down) down = innerGraphics[k].y;
					if (innerGraphics[k].x > right) right = innerGraphics[k].x;
					if (innerGraphics[k].y > up) up = innerGraphics[k].y;
				}


				var xOffset = (left - right) / this.PTM;
				var yOffset = (down - up) / this.PTM;

				const pos = vec1;
				pos.Set(graphicContainer.x / this.PTM + xOffset, graphicContainer.y / this.PTM + yOffset);
				body.SetTransform(pos, graphicContainer.rotation);

			}
		}
		return bodiesCreated;
	}
	this.convertSelectedBodiesToGraphics = function () {
		var graphicsCreated = this.convertBodiesToGraphics(this.selectedPhysicsBodies);
		this.deleteSelection();
		this.selectedTextures = graphicsCreated;
		this.updateSelection();
	}
	this.convertBodiesToGraphics = function (arr) {

		var body;
		var graphic;
		var graphicsCreated = [];
		for (var i = 0; i < arr.length; i++) {
			body = arr[i];
			var verts = body.mySprite.data.vertices;
			var colorFill = body.mySprite.data.colorFill;
			var colorLine = body.mySprite.data.colorLine;
			var lineWidth = body.mySprite.data.lineWidth;
			var transparancy = body.mySprite.data.transparancy;
			var radius = body.mySprite.data.radius;

			this.updateObject(body.mySprite, body.mySprite.data);

			var graphics = [];

			for (var j = 0; j < verts.length; j++) {

				var graphicObject;
				if (radius[j]) {
					graphicObject = new this.graphicObject();
					graphicObject.vertices = verts[j];
				} else {

					let innerVerts;
					if (verts[j][0] instanceof Array == false) innerVerts = verts[j];
					else innerVerts = verts[j][0];

					graphicObject = this.createGraphicObjectFromVerts(innerVerts);
				}

				graphicObject.colorFill = colorFill[j];
				graphicObject.colorLine = colorLine[j];
				graphicObject.lineWidth = lineWidth[j];
				graphicObject.transparancy = transparancy[j];
				graphicObject.radius = radius[j];

				graphicObject.x += body.mySprite.data.x * this.PTM;
				graphicObject.y += body.mySprite.data.y * this.PTM;
				graphicObject.tileTexture = body.mySprite.data.tileTexture;
				graphic = this.buildGraphicFromObj(graphicObject);
				if (graphic) {
					graphics.push(graphic);
				}
			}

			if (graphics.length > 1) graphic = this.groupGraphicObjects(graphics);

			graphic.rotation = body.mySprite.data.rotation;

			if (graphic) {
				graphic.alpha = body.mySprite.data.transparancy[0];
				graphic.data.transparancy = body.mySprite.data.transparancy[0];
				graphic.parent.swapChildren(body.mySprite, graphic);
				graphicsCreated.push(graphic);
			}

		}
		return graphicsCreated;
	}

	this.cameraOverlayGUIColor = "#000000";
	this.cameraOverlayGUICircleRadius = 20;
	this.doCamera = function () {
		this.debugGraphics.lineStyle(1, this.cameraOverlayGUIColor, 1);

		var sX = this.mousePosPixel.x - this.cameraSize.w / 2;
		var sY = this.mousePosPixel.y - this.cameraSize.h / 2;

		this.drawBox(this.debugGraphics, sX, sY, this.cameraSize.w, this.cameraSize.h, this.cameraOverlayGUIColor, 1, 1);

		var miniBoxScale = 0.3;
		var cornerSizeScale = 0.2;

		var mbhW = this.cameraSize.w * miniBoxScale / 2;
		var mbhH = this.cameraSize.h * miniBoxScale / 2;
		var cornerSize = mbhW * cornerSizeScale;

		this.debugGraphics.moveTo(this.mousePosPixel.x - mbhW, this.mousePosPixel.y - mbhH + cornerSize);
		this.debugGraphics.lineTo(this.mousePosPixel.x - mbhW, this.mousePosPixel.y - mbhH);
		this.debugGraphics.lineTo(this.mousePosPixel.x - mbhW + cornerSize, this.mousePosPixel.y - mbhH);

		this.debugGraphics.moveTo(this.mousePosPixel.x + mbhW, this.mousePosPixel.y - mbhH + cornerSize);
		this.debugGraphics.lineTo(this.mousePosPixel.x + mbhW, this.mousePosPixel.y - mbhH);
		this.debugGraphics.lineTo(this.mousePosPixel.x + mbhW - cornerSize, this.mousePosPixel.y - mbhH);

		this.debugGraphics.moveTo(this.mousePosPixel.x - mbhW, this.mousePosPixel.y + mbhH - cornerSize);
		this.debugGraphics.lineTo(this.mousePosPixel.x - mbhW, this.mousePosPixel.y + mbhH);
		this.debugGraphics.lineTo(this.mousePosPixel.x - mbhW + cornerSize, this.mousePosPixel.y + mbhH);

		this.debugGraphics.moveTo(this.mousePosPixel.x + mbhW, this.mousePosPixel.y + mbhH - cornerSize);
		this.debugGraphics.lineTo(this.mousePosPixel.x + mbhW, this.mousePosPixel.y + mbhH);
		this.debugGraphics.lineTo(this.mousePosPixel.x + mbhW - cornerSize, this.mousePosPixel.y + mbhH);
	}





	// TODO: FIX GROUPS ON CHANGE OF INDIVIDUAL GROUP // SAME FOR INSTANCE LATER

	this.addObjectToLookupGroups = function (obj, data) {

		//character1#character, .character, .vehicle, test
		// subgroup + refname
		var groupNoSpaces = data.groups.replace(/[ -!$%^&*()+|~=`{}\[\]:";'<>?\/]/g, '');
		var arr = (group == "") ? [] : groupNoSpaces.split(",");
		var subGroups = [];
		if (data.prefabInstanceName) arr.push(data.prefabInstanceName);

		if (arr.length == 0) return;

		var createdPrefabObject;

		var i;
		for (i = 0; i < arr.length; i++) {
			if (arr[i].charAt(0) === ".") {
				var subGroup = arr.splice(i, 1)[0];
				var classIndex = subGroup.indexOf('#');
				if (classIndex > 0 && !this.breakPrefabs) {
					var className = subGroup.substr(classIndex + 1, subGroup.length);
					subGroup = subGroup.substr(0, classIndex);
					var prefabName = subGroup.substr(1, subGroup.length);
					var instanceID = this.activePrefabs[data.prefabInstanceName].instanceID;
					var key = prefabName + "_" + instanceID;
					if (!this.activePrefabs[key]) {
						var newPrefabObj = new this.prefabObject();
						newPrefabObj.prefabName = prefabName;
						newPrefabObj.instanceID = instanceID;
						createdPrefabObject = newPrefabObj;
						newPrefabObj.key = key;
						this.activePrefabs[key] = newPrefabObj;
					}
					arr.push(key);
					data.subPrefabInstanceName = key;
				}
				subGroups.push(subGroup);
				i--;
			}
		}
		var group;
		var subGroup;
		var j;
		for (i = 0; i < arr.length; i++) {
			group = arr[i].replace(/[ -!$%^&*()+|~=`{}\[\]:";'<>?\/]/g, '');
			if (group == "") continue;
			if (this.lookupGroups[group] == undefined) {
				this.lookupGroups[group] = new this.lookupObject;
			}

			if (data.type == this.object_TEXTURE && obj.myBody == undefined) this.lookupGroups[group]._textures.push(obj);
			else if (data.type == this.object_BODY) this.lookupGroups[group]._bodies.push(obj);
			else if (data.type == this.object_JOINT) this.lookupGroups[group]._joints.push(obj);

			if (data.refName && data.refName != "") {
				this.lookupGroups[group][data.refName] = obj;
			}

			for (j = 0; j < subGroups.length; j++) {
				subGroup = subGroups[j].replace(/[ -!$%^&*()+|~=`{}\[\]:";'<>?,.\/]/g, '');
				if (subGroup == "") continue;
				if (this.lookupGroups[group][subGroup] == undefined) {
					this.lookupGroups[group][subGroup] = new this.lookupObject;
				}
				if (this.lookupGroups[group][subGroup] instanceof this.lookupObject) {
					if (data.type == this.object_TEXTURE && obj.myBody == undefined) this.lookupGroups[group][subGroup]._textures.push(obj);
					else if (data.type == this.object_BODY) this.lookupGroups[group][subGroup]._bodies.push(obj);
					else if (data.type == this.object_JOINT) this.lookupGroups[group][subGroup]._joints.push(obj);
					if (data.refName && data.refName != "") {
						this.lookupGroups[group][subGroup][data.refName] = obj;
					}
				}
			}
		}
		if (createdPrefabObject) {
			createdPrefabObject.class = new PrefabManager.prefabLibrary[className].class(createdPrefabObject);
			this.createdSubPrefabClasses.push(createdPrefabObject.class);
		}
	}
	this.removeObjectFromLookupGroups = function (obj, data) {
		if (!data) return;
		var groupNoSpaces = data.groups.replace(/[ -!$%^&*()+|~=`{}\[\]:";'<>?\/]/g, '');
		var arr = (group == "") ? [] : groupNoSpaces.split(",");
		var subGroups = [];
		if (data.prefabInstanceName) arr.push(data.prefabInstanceName);

		if (arr.length == 0) return;

		var i;
		for (i = 0; i < arr.length; i++) {
			if (arr[i].charAt(0) === ".") {
				var subGroup = arr.splice(i, 1)[0];
				var classIndex = subGroup.indexOf('#');
				if (classIndex > 0 && !this.breakPrefabs) {
					subGroup = subGroup.substr(0, classIndex);
					var key = data.subPrefabInstanceName;
					if (this.activePrefabs[key] && this.lookupGroups[key]._bodies.length + this.lookupGroups[key]._textures.length + this.lookupGroups[key]._joints.length == 1) {
						delete this.activePrefabs[key];
					}
					arr.push(key);
				}
				subGroups.push(subGroup);
				i--;
			}
		}
		var group;
		var subGroup;
		var j;
		for (i = 0; i < arr.length; i++) {
			group = arr[i].replace(/[ -!$%^&*()+|~=`{}\[\]:";'<>?\/]/g, '');
			if (this.lookupGroups[group] != undefined) {
				let tarArray = [];
				if (data.type == this.object_TEXTURE && obj.myBody == undefined) tarArray = this.lookupGroups[group]._textures;
				else if (data.type == this.object_BODY) tarArray = this.lookupGroups[group]._bodies;
				else if (data.type == this.object_JOINT) tarArray = this.lookupGroups[group]._joints;


				var tarIndex = tarArray.indexOf(obj);
				if (tarIndex >= 0) tarArray.splice(tarIndex, 1);

				if (data.refName && data.refName != "") {
					delete this.lookupGroups[group][data.refName];
				}
				for (j = 0; j < subGroups; j++) {
					subGroup = subGroups[j].replace(/[ -!$%^&*()+|~=`{}\[\]:";'<>?,.\/]/g, '');
					if (this.lookupGroups[group][subGroup] != undefined && this.lookupGroups[group][subGroup] instanceof this.lookupObject) {
						if (data.type == this.object_TEXTURE && obj.myBody == undefined) tarArray = this.lookupGroups[group][subGroup]._textures;
						else if (data.type == this.object_BODY) tarArray = this.lookupGroups[group][subGroup]._bodies;
						else if (data.type == this.object_JOINT) tarArray = this.lookupGroups[group][subGroup]._joints;

						tarIndex = tarArray.indexOf(obj);
						if (tarIndex > 0) tarArray.splice(tarIndex, 1);

						if (data.refName && data.refName != "") {
							delete this.lookupGroups[group][subGroup][data.refName];
						}
					}
				}
				if (this.lookupGroups[group]._bodies.length + this.lookupGroups[group]._textures.length + this.lookupGroups[group]._joints.length == 0) delete this.lookupGroups[group];
			}
		}
	}

	this.buildTextureFromObj = function (obj) {

		var container;
		var sprite = new PIXIHeaven.Sprite(PIXI.Texture.from(obj.textureName));

		container = new PIXI.Container();
		container.pivot.set(sprite.width / 2, sprite.height / 2);
		container.addChild(sprite);

		container.originalSprite = sprite;

		this.textures.addChild(container);

		container.x = obj.x;
		container.y = obj.y;
		container.rotation = obj.rotation;
		container.data = obj;
		container.alpha = obj.transparancy;
		container.renderable = obj.visible;
		container.forceRenderable = obj.visible;

		container.width = container.width * obj.scaleX;
		container.height = container.height * obj.scaleY;

		var color = obj.tint;
		color = color.slice(1);
		container.originalSprite.tint = parseInt(color, 16);

		if (container.data.bodyID != undefined) {
			var body = this.textures.getChildAt(container.data.bodyID).myBody;
			this.setTextureToBody(body, container, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
			this.updateBodyPosition(body);
		}
		//handle groups and ref names
		this.addObjectToLookupGroups(container, container.data);

		return container;
	}
	this.buildTriggerFromObj = function (obj) {
		const bodyObject = JSON.parse(JSON.stringify(obj));
		bodyObject.trigger = true;
		bodyObject.density = 1;
		bodyObject.collision = 2;
		bodyObject.transparancy = 1.0;

		const body = this.buildBodyFromObj(bodyObject);
		this.setBodyCollision(body, [9]);

		body.SetSleepingAllowed(false);
		body.SetGravityScale(0);
		body.SetAwake(true);

		this.removeObjectFromLookupGroups(body, body.mySprite.data);

		body.mySprite.data = obj;

		body.mySprite.targets = [];
		body.mySprite.targetPrefabs = [];
		this.addObjectToLookupGroups(body, body.mySprite.data);

		body.mySprite.debugGraphic = new PIXI.Graphics();
		body.mySprite.addChild(body.mySprite.debugGraphic);
		body.mySprite.visible = true;

		this.updateTriggerShape(body.mySprite);

		this.triggerObjects.push(body);

		return body;
	}
	this.buildTextFromObj = function (obj) {
		let container;
		let text = this.buildTextGraphicFromObj(obj);

		container = new PIXI.Container();
		container.pivot.set(text.width / 2, text.height / 2);
		container.addChild(text);

		container.textSprite = text;

		this.textures.addChild(container);

		container.x = obj.x;
		container.y = obj.y;
		container.rotation = obj.rotation;
		container.data = obj;

		container.alpha = obj.transparancy;
		container.forceRenderable = obj.visible;

		if(!obj.visible){
			disableCulling(container);
		}
		container.renderable = obj.visible;


		if (container.data.bodyID != undefined) {
			var body = this.textures.getChildAt(container.data.bodyID).myBody;
			this.setTextureToBody(body, container, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}

		//handle groups and ref names
		this.addObjectToLookupGroups(container, container.data);

		return container;
	}
	this.buildTextGraphicFromObj = function (obj) {
		let text = new PIXI.Text();
		let style = new PIXI.TextStyle();
		style.fontFamily = obj.fontName;
		style.fontSize = obj.fontSize;
		style.fill = obj.textColor;
		style.align = obj.textAlign;

		text.text = obj.text;
		text.style = style;
		return text;
	}
	this.buildBodyFromObj = function (obj) {

		var bd = new b2BodyDef();
		if(obj.trigger) bd.set_type(Box2D.b2_dynamicBody);
		else if (obj.fixed) bd.set_type(Box2D.b2_staticBody);
		else bd.set_type(Box2D.b2_dynamicBody);
		bd.set_angularDamping(0.9);

		var body = this.CreateBody(bd);
		body.SetAwake(false);

		body.SetFixedRotation(obj.fixedRotation);

		if(!obj.optimizePhysics){
			body.ignorePhysicsCuller = true;
			body.SetSleepingAllowed(false);
		}
		if(obj.bulletCollision) body.SetBullet(obj.bulletCollision);

		var graphic = new PIXI.Graphics();
		body.originalGraphic = graphic;


		if (obj.vertices[0] instanceof Array == false) {
			// A fix for backwards compatibility with old vertices system
			obj.vertices = [obj.vertices];
			obj.radius = [obj.radius];
			obj.colorFill = [obj.colorFill];
			obj.colorLine = [obj.colorLine];
			obj.lineWidth = [obj.lineWidth];
			obj.transparancy = [obj.transparancy];
			obj.density = [obj.density];
		}
		// backwards fix for restitution and friction

		obj.restitution = [].concat(obj.restitution);
		obj.friction = [].concat(obj.friction);
		obj.collision = [].concat(obj.collision);


		body.SetTransform(new b2Vec2(obj.x, obj.y), obj.rotation);

		body.mySprite = new PIXI.Sprite();
		this.textures.addChild(body.mySprite);

		body.mySprite.addChild(body.originalGraphic);

		body.mySprite.myBody = body;
		body.mySprite.data = obj;


		this.updateBodyFixtures(body);
		this.updateBodyShapes(body);

		body.mySprite.x = body.GetPosition().get_x() * this.PTM;
		body.mySprite.y = body.GetPosition().get_y() * this.PTM;
		body.mySprite.rotation = body.GetAngle();

		if(!obj.fixed) disableCulling(body.mySprite);

		if(!obj.visible && obj.visible !== undefined){
			disableCulling(body.mySprite);
		}

		body.mySprite.renderable = obj.visible !== undefined ? obj.visible : true;

		if (obj.tileTexture != "") this.updateTileSprite(body);

		this.setBodyCollision(body, obj.collision);

		this.addObjectToLookupGroups(body, body.mySprite.data);

		body.instaKill = obj.instaKill;
		body.isVehiclePart = obj.isVehiclePart;

		if(isBodyGroup(body)){
			setBodyGroupOpacity(body, obj.groupOpacity);
		}else{
			body.mySprite.alpha = obj.transparancy[0];
		}

		return body;

	}
	this.buildGraphicFromObj = function (obj) {
		var container = new PIXI.Container();
		container.data = obj;
		container.x = obj.x;
		container.y = obj.y;
		container.rotation = obj.rotation;

		if(!obj.visible){
			disableCulling(container);
		}

		container.renderable = obj.visible;

		var originalGraphic = new PIXI.Graphics();
		container.addChild(originalGraphic);
		container.originalGraphic = originalGraphic;

		if (!obj.radius) this.updatePolyGraphic(originalGraphic, obj.vertices, obj.colorFill, obj.colorLine, obj.lineWidth, obj.transparancy);
		else this.updateCircleGraphic(originalGraphic, obj.radius, obj.vertices[0], obj.colorFill, obj.colorLine, obj.lineWidth, obj.transparancy);

		this.textures.addChild(container);

		if (container.data.bodyID != undefined) {
			var body = this.textures.getChildAt(container.data.bodyID).myBody;
			this.setTextureToBody(body, container, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}

		if (obj.tileTexture != "" || obj.gradient != "") this.updateTileSprite(container);

		this.addObjectToLookupGroups(container, container.data);
		return container;

	}
	this.buildGraphicGroupFromObj = function (obj) {
		var graphic = new PIXI.Container();
		graphic.data = obj;
		graphic.x = obj.x;
		graphic.y = obj.y;
		graphic.rotation = obj.rotation;
		graphic.scale.x = obj.mirrored ? -1 : 1;

		if(typeof obj.graphicObjects[0] === 'string'){
			obj.graphicObjects = obj.graphicObjects.map(obj => JSON.parse(obj));
		}

		this.updateGraphicGroupShapes(graphic);
		this.textures.addChild(graphic);

		graphic.alpha = obj.transparancy;
		graphic.forceRenderable = obj.visible;

		if(!obj.visible){
			disableCulling(graphic);
		}

		graphic.renderable = obj.visible;

		if (graphic.data.bodyID != undefined) {
			var body = this.textures.getChildAt(graphic.data.bodyID).myBody;
			this.setTextureToBody(body, graphic, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}

		applyColorMatrix(graphic, obj.colorMatrix);

		this.addObjectToLookupGroups(graphic, graphic.data);
		return graphic;
	}
	this.buildAnimationGroupFromObject = function (obj) {
		var graphic = new PIXI.Container();
		graphic.data = obj;
		graphic.x = obj.x;
		graphic.y = obj.y;
		graphic.rotation = obj.rotation;

		if(typeof obj.graphicObjects[0] === 'string'){
			obj.graphicObjects = obj.graphicObjects.map(obj => JSON.parse(obj));
		}

		this.updateGraphicGroupShapes(graphic);
		this.textures.addChild(graphic);

		graphic.alpha = obj.transparancy;
		graphic.forceRenderable = obj.visible;
		graphic.scale.x = obj.mirrored ? -1 : 1;

		if(!obj.visible){
			disableCulling(graphic);
		}

		graphic.renderable = obj.visible;

		if (graphic.data.bodyID != undefined) {
			var body = this.textures.getChildAt(graphic.data.bodyID).myBody;
			this.setTextureToBody(body, graphic, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}

		this.initAnimation(graphic);

		this.addObjectToLookupGroups(graphic, graphic.data);
		return graphic;
	}
	this.initAnimation = function(container){
		container.frameTime = 1000/container.data.fps;
		container.playing = container.data.playing;
		container.loop = container.data.loop;
		if(!container.isAnimation){
			container.isAnimation = true;
			container.totalFrames = container.children.length;
			for(let i = 1; i<container.totalFrames; i++){
				container.children[i].visible = false;
			}
			container.currentFrameTime = 0;
			container.currentFrame = 1;
			container.updateAnimation = delta=>{
				container.currentFrameTime+=delta;
				while(container.currentFrameTime>=container.frameTime){
					container.currentFrameTime -= container.frameTime;
					container.nextFrame();
				}
			}
			container.setFrame = index=>{
				if(index>container.totalFrames){
					if(container.loop){
						index = 1;
					}else{
						container.playing = false;
						return;
					}
				}
				if(index<1) index = container.totalFrames;
				container.children[container.currentFrame-1].visible = false;
				container.children[index-1].visible = true;
				container.currentFrame = index;
			}
			container.nextFrame = ()=>{
				container.setFrame(container.currentFrame+1);
			}
			container.prevFrame = ()=>{
				container.setFrame(container.currentFrame-1);
			}
		}
	}

	this.setScale = function (obj, scaleX, scaleY) {


		//do we include a circle?
		let data;
		if (obj.mySprite) data = obj.mySprite.data;
		else data = obj.data;

		// if (Math.round(scaleX * 100) / 100 == 1 && Math.round(scaleY * 100) / 100 == 1) return;

		if (data.type == this.object_BODY || data.type == this.object_TRIGGER) {

			let oldFixtures = []
			const body = obj;
			
			for (let fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
				oldFixtures.push(fixture);
				if (fixture.GetShape().GetType() === Box2D.b2Shape.e_circle) {
					//oh shit we have a circle, must scale with aspect ratio
					if (Math.round(scaleX * 100) / 100 != 1) {
						scaleY = scaleX;
					} else {
						scaleX = scaleY;
					}
				}
			}

			oldFixtures.reverse();

			for (let i = 0; i < oldFixtures.length; i++) {
				let fixture = oldFixtures[i];
				const shapeBase = fixture.GetShape();
				if (shapeBase.GetType() === Box2D.b2Shape.e_polygon) {
					const shape = Box2D.castObject(shapeBase, b2PolygonShape);
					const vertices = [];
					for (let vertexIx = 0; vertexIx < shape.get_m_count(); vertexIx++) {
						const vertex = shape.get_m_vertices(vertexIx);
						vertices.push({x:vertex.get_x()*scaleX, y:vertex.get_y()*scaleY});
					}

					shape.Set(pointsToVec2Array(vertices)[0], vertices.length);

					if(data.type === this.object_TRIGGER){
						obj.mySprite.data.vertices = vertices.map(vertice =>({x:vertice.x, y:vertice.y}));
					}
				} else if (shapeBase.GetType() ===  Box2D.b2Shape.e_circle) {
					const shape = Box2D.castObject(shapeBase, b2CircleShape);
					shape.set_m_radius(shape.get_m_radius() * scaleX);
					if(Array.isArray(body.mySprite.data.radius)) body.mySprite.data.radius = body.mySprite.data.radius.map(r => r* scaleX);
					else body.mySprite.data.radius = body.mySprite.data.radius* scaleX;
				}

			};

			let dataVertices = obj.mySprite.data.vertices.flat(10);
			for(let i = 0; i<dataVertices.length; i++){
				dataVertices[i].x = dataVertices[i].x * scaleX;
				dataVertices[i].y = dataVertices[i].y * scaleY;

				if(dataVertices[i].point1){
					dataVertices[i].point1.x = dataVertices[i].point1.x * scaleX;
					dataVertices[i].point1.y = dataVertices[i].point1.y * scaleY;
				}
				if(dataVertices[i].point2){
					dataVertices[i].point2.x = dataVertices[i].point2.x * scaleX;
					dataVertices[i].point2.y = dataVertices[i].point2.y * scaleY;
				}

			}

			if(data.type !== this.object_TRIGGER){
				this.updateBodyShapes(body);
				this.updateTileSprite(body, true);
				// needed to update the culling engine
				body.mySprite._cullingSizeDirty = true;
				body.mySprite.position.x++;
				body.mySprite.position.x--;
			}else{
				this.updateTriggerShape(body.mySprite);
			}

			if (body.myTexture) this.setScale(body.myTexture, scaleX, scaleY);

		} else {
			var sprite = obj;

			if (sprite.data.type == this.object_GRAPHICGROUP) {

				let centerPoint = {
					x: 0,
					y: 0
				};
				for (let j = 0; j < sprite.data.graphicObjects.length; j++) {
					const gObj = this.parseArrObject(sprite.data.graphicObjects[j]);

					if (gObj instanceof this.graphicObject) {
						if (gObj.radius) {
							if (Math.round(scaleX * 100) / 100 != 1) {
								scaleY = scaleX;
							} else {
								scaleX = scaleY;
							}
							gObj.radius *= scaleX;
						}
					}
					centerPoint.x += gObj.x;
					centerPoint.y += gObj.y;

					sprite.data.graphicObjects[j] = this.serializeObject(gObj);

				}

				centerPoint.x /= sprite.data.graphicObjects.length;
				centerPoint.y /= sprite.data.graphicObjects.length;

				for (let j = 0; j < sprite.data.graphicObjects.length; j++) {
					const gObj = this.parseArrObject(sprite.data.graphicObjects[j]);

					if (gObj instanceof this.graphicObject) {
						for (var k = 0; k < gObj.vertices.length; k++) {
							gObj.vertices[k].x *= scaleX;
							gObj.vertices[k].y *= scaleY;

							if(gObj.vertices[k].point1){
								gObj.vertices[k].point1.x *= scaleX;
								gObj.vertices[k].point1.y *= scaleY;
							}
							if(gObj.vertices[k].point2){
								gObj.vertices[k].point2.x *= scaleX;
								gObj.vertices[k].point2.y *= scaleY;
							}
						}
					}
					const xDif = gObj.x - centerPoint.x;
					const yDif = gObj.y - centerPoint.y;
					gObj.x = centerPoint.x + xDif * scaleX;
					gObj.y = centerPoint.y + yDif * scaleY;

					sprite.data.graphicObjects[j] = this.serializeObject(gObj);
				}
				this.updateGraphicGroupShapes(sprite);
				// needed to update the culling engine
			} else if (sprite.data.type == this.object_GRAPHIC) {
				for (let j = 0; j < sprite.data.vertices.length; j++) {
					sprite.data.vertices[j].x *= scaleX;
					sprite.data.vertices[j].y *= scaleY;

					if(sprite.data.vertices[j].point1){
						sprite.data.vertices[j].point1.x *= scaleX;
						sprite.data.vertices[j].point1.y *= scaleY;
					}
					if(sprite.data.vertices[j].point2){
						sprite.data.vertices[j].point2.x *= scaleX;
						sprite.data.vertices[j].point2.y *= scaleY;
					}
				}
				if (sprite.data.radius) sprite.data.radius *= scaleX;
				if (!sprite.data.radius) this.updatePolyGraphic(sprite.originalGraphic, sprite.data.vertices, sprite.data.colorFill, sprite.data.colorLine, sprite.data.lineWidth, sprite.data.transparancy);
				else this.updateCircleGraphic(sprite.originalGraphic, sprite.data.radius, sprite.data.vertices[0], sprite.data.colorFill, sprite.data.colorLine, sprite.data.lineWidth, sprite.data.transparancy);
				this.updateTileSprite(sprite, true);
			} else if (sprite.data.type == this.object_TEXTURE) {
				sprite.width = sprite.width * scaleX;
				sprite.height = sprite.height * scaleY;

				sprite.data.scaleX = sprite.scale.x;
				sprite.data.scaleY = sprite.scale.y;

				var xL = sprite.data.texturePositionOffsetLength * Math.cos(sprite.data.texturePositionOffsetAngle) * scaleX;
				var yL = sprite.data.texturePositionOffsetLength * Math.sin(sprite.data.texturePositionOffsetAngle) * scaleY;
				sprite.data.texturePositionOffsetLength = Math.sqrt(xL * xL + yL * yL);

			}
			//update culling shape
			sprite._cullingSizeDirty = true;
			sprite.x++;
			sprite.x--;

		}
	}

 	this.mirrorPrefab = function(prefabClass, centerObjectName){
		let objects = [].concat(prefabClass.lookupObject._bodies, prefabClass.lookupObject._textures);

		prefabClass.lookupObject._joints.forEach(joint=>{
			if(joint instanceof PIXI.Sprite) objects.push(joint);
		})

		if(prefabClass.isCharacter){
			objects = objects.concat(prefabClass.vehicleParts);
		}

		if(prefabClass.isVehicle){
			objects = objects.filter(body => !body.snapped);
		}

		const centerObject = prefabClass.lookupObject[centerObjectName];
		const flippedJoints = [];

		objects.forEach(object =>{
			if (object.mySprite){
				// body
				const body = object;
				for (let fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
					const shapeBase = fixture.GetShape();
					if(shapeBase.GetType() ===  Box2D.b2Shape.e_polygon){
						let shape = Box2D.castObject(shapeBase, b2PolygonShape);

						const vertices = [];
						for (let vertexIx = 0; vertexIx < shape.get_m_count(); vertexIx++) {
							const vertex = shape.get_m_vertices(vertexIx);
							vertices.push({x:vertex.get_x()*-1, y:vertex.get_y()});
						}

						vertices.reverse();
						shape.Set(pointsToVec2Array(vertices)[0], vertices.length);


					}else{
						let shape = Box2D.castObject(shapeBase, b2CircleShape);
						const position = shape.get_m_p();
						position.set_x(position.get_x() * -1);
					}
				}

				body.ResetMassData();
				body.mySprite.scale.x *= -1;

				if(body != centerObject){

					// make sure the initial object is not mirrored (object a)

					const objectAngleDiff = centerObject.GetAngle()-body.GetAngle();
					const reflectedAngle = centerObject.GetAngle()+objectAngleDiff

					const cdx = body.GetPosition().get_x()-centerObject.GetPosition().get_x();
					const cdy = body.GetPosition().get_y()-centerObject.GetPosition().get_y();
					const cda = Math.atan2(cdy, cdx);
					const cdl = Math.sqrt(cdx*cdx + cdy*cdy);

					let reflectAngle = cda-centerObject.GetAngle();
					let nx = - cdl * Math.cos(reflectAngle);
					let ny = cdl * Math.sin(reflectAngle);

					const na = Math.atan2(ny, nx);
					const ndl = Math.sqrt(nx*nx + ny*ny);

					reflectAngle = na+centerObject.GetAngle();

					nx = centerObject.GetPosition().get_x() + ndl * Math.cos(reflectAngle);
					ny = centerObject.GetPosition().get_y() + ndl * Math.sin(reflectAngle);

					// const nx = centerObject.GetPosition().get_x()+cdl*Math.cos(reflectedcda)
					// const ny = centerObject.GetPosition().get_y()+cdl*Math.sin(reflectedcda);

					const position = vec1;
					position.set_x(nx);
					position.set_y(ny);

					body.SetTransform(position, reflectedAngle);
				}

				if(body.myTexture){
					body.myTexture.scale.x *= -1;
					body.myTexture.data.texturePositionOffsetAngle = -(body.myTexture.data.texturePositionOffsetAngle+Math.PI/2) - Math.PI/2;
				}

				const destroyJoints = [];
				for (let jointEdge = body.GetJointList(); getPointer(jointEdge) !== getPointer(NULL); jointEdge = jointEdge.get_next()) {
					const joint = this.CastJoint(jointEdge.joint);

					let keyA = joint.GetBodyA().mySprite ? joint.GetBodyA().mySprite.data.prefabInstanceName : joint.GetBodyA().key;
					let keyB = joint.GetBodyB().mySprite ? joint.GetBodyB().mySprite.data.prefabInstanceName : joint.GetBodyB().key;

					let shouldDestroy = keyA !== keyB;

					if(prefabClass.isCharacter || prefabClass.isVehicle){
						shouldDestroy = false;
						if(joint.GetBodyA().mainCharacter){
							if((!joint.GetBodyB().mainCharacter && !joint.GetBodyB().isVain && !joint.GetBodyB().isVehiclePart && !joint.GetBodyB().isHat) || joint.GetBodyB().GetType() == Box2D.b2_staticBody) shouldDestroy = true;
						}else{
							if((!joint.GetBodyA().mainCharacter && !joint.GetBodyB().isVain && !joint.GetBodyA().isVehiclePart && !joint.GetBodyA().isHat) || joint.GetBodyA().GetType() == Box2D.b2_staticBody) shouldDestroy = true;
						}
					}

					if(shouldDestroy){
						destroyJoints.push(joint);
					}else if(!flippedJoints.includes(joint)){

						if(joint.GetType() !== Box2D.e_prismaticJoint){

							if(joint.GetLocalAnchorA !== undefined) joint.GetLocalAnchorA().Set(joint.GetLocalAnchorA().x * -1, joint.GetLocalAnchorA().y);
							if(joint.GetLocalAnchorB !== undefined) joint.GetLocalAnchorB().Set(joint.GetLocalAnchorB().x * -1, joint.GetLocalAnchorB().y);


							if(joint.GetLowerLimit !== undefined && joint.GetUpperLimit !== undefined) {
								const oldLower = joint.GetLowerLimit();
								const oldUpper = joint.GetUpperLimit();
								joint.SetLimits(-oldUpper, -oldLower);
							}

							flippedJoints.push(joint);
						}else{


							const prismaticJointDef = new Box2D.b2PrismaticJointDef();

							const localAnchorA = joint.GetLocalAnchorA();
							localAnchorA.Set(joint.GetLocalAnchorA().x * -1, joint.GetLocalAnchorA().y);

							const localAnchorB = joint.GetLocalAnchorB();
							localAnchorB.Set(joint.GetLocalAnchorB().x * -1, joint.GetLocalAnchorB().y);

							prismaticJointDef.set_bodyA(joint.GetBodyA());
							prismaticJointDef.set_bodyB(joint.GetBodyB());
							prismaticJointDef.set_localAnchorA(localAnchorA);
							prismaticJointDef.set_localAnchorB(localAnchorB);


							// mirror the axis

							const localVec = joint.GetLocalAxisA();
							joint.GetLocalAxisA().Set(localVec.x * -1, localVec.y);


							prismaticJointDef.set_localAxisA(joint.GetLocalAxisA());
							prismaticJointDef.set_collideConnected(joint.GetCollideConnected());
							prismaticJointDef.set_referenceAngle(joint.GetReferenceAngle() + 0);
							prismaticJointDef.set_lowerTranslation(joint.GetLowerLimit());
							prismaticJointDef.set_upperTranslation(joint.GetUpperLimit());
							prismaticJointDef.set_maxMotorForce(joint.GetMaxMotorForce());
							prismaticJointDef.set_motorSpeed(joint.GetMotorSpeed());
							prismaticJointDef.set_enableLimit(joint.IsLimitEnabled());
							prismaticJointDef.set_enableMotor(joint.IsMotorEnabled());

							const newJoint = Box2D.castObject(this.CreateJoint(prismaticJointDef), Box2D.b2PrismaticJoint);

							destroy(prismaticJointDef);

							flippedJoints.push(newJoint);

							newJoint.spriteData = joint.spriteData;

							this.deleteObjects([joint]);

							this.addObjectToLookupGroups(newJoint, newJoint.spriteData);
						}

					}

				}
				destroyJoints.forEach(joint => this.DestroyJoint(joint));

			}else{
				// sprite or joint
				object.scale.x *= -1;

				if(object.data.type === this.object_JOINT){
					if(object.data.lowerAngle !== undefined && object.data.upperAngle !== undefined) {
						const oldLower = object.data.lowerAngle;
						object.data.lowerAngle = -object.data.upperAngle;
						object.data.upperAngle = -oldLower;
					}
				}

				const objectAngleDiff = centerObject.GetAngle()-object.rotation;
				const reflectedAngle = centerObject.GetAngle()+objectAngleDiff
				object.rotation = reflectedAngle;

				const cdx = object.x-centerObject.GetPosition().get_x()*Settings.PTM;
				const cdy = object.y-centerObject.GetPosition().get_y()*Settings.PTM;
				const cda = Math.atan2(cdy, cdx);
				const cdl = Math.sqrt(cdx*cdx + cdy*cdy);

				let reflectAngle = cda-centerObject.GetAngle();
				let nx = - cdl * Math.cos(reflectAngle);
				let ny = cdl * Math.sin(reflectAngle);

				const na = Math.atan2(ny, nx);
				const ndl = Math.sqrt(nx*nx + ny*ny);

				reflectAngle = na+centerObject.GetAngle();

				nx = centerObject.GetPosition().get_x() * Settings.PTM + ndl * Math.cos(reflectAngle);
				ny = centerObject.GetPosition().get_y() * Settings.PTM + ndl * Math.sin(reflectAngle);

				object.x = nx;
				object.y = ny;
			}
		})
	}

	this.groupObjects = function () {
		var combinedGraphics;
		var combinedBodies;

		const hasAnimation = this.selectedTextures.find(obj => obj.data.type === this.object_ANIMATIONGROUP);
		const hasOthers = this.selectedTextures.find(obj => obj.data.type !== this.object_ANIMATIONGROUP);
		const hasTriggers = this.selectedPhysicsBodies.find(obj => obj.mySprite.data.type === this.object_TRIGGER);
		const hasJoints = this.selectedTextures.find(obj => obj.data.type === this.object_JOINT);

		if(hasTriggers || hasJoints) return;
		if(hasAnimation && hasOthers) return;

		if (this.selectedPhysicsBodies.length > 0) {
			combinedBodies = this.selectedPhysicsBodies[0];
			for (var i = 0; i < this.selectedPhysicsBodies.length; i++) {
				if (this.selectedPhysicsBodies[i].myTexture) {
					var texture = this.selectedPhysicsBodies[i].myTexture;
					this.removeTextureFromBody(this.selectedPhysicsBodies[i], texture);
					this.selectedTextures.push(texture);
				}
			}
		}

		if (this.selectedPhysicsBodies.length > 1) {
			for (let i = 0; i < this.selectedPhysicsBodies.length; i++) {
				if (this.selectedPhysicsBodies[i].mySprite.data.vertices.length > 1) {
					let bodies = this.ungroupBodyObjects(this.selectedPhysicsBodies[i]);
					this.selectedPhysicsBodies.splice(i, 1);
					this.selectedPhysicsBodies = this.selectedPhysicsBodies.concat(bodies);
					i--;
				}
			}
			combinedBodies = this.groupBodyObjects(this.selectedPhysicsBodies);
		}


		if (this.selectedTextures.length > 1) {
			var graphicsToGroup = [];
			for (var i = 0; i < this.selectedTextures.length; i++) {
				if (this.selectedTextures[i].data instanceof this.graphicGroup) {
					graphicsToGroup = graphicsToGroup.concat(this.ungroupGraphicObjects(this.selectedTextures[i]));
				} else {
					graphicsToGroup.push(this.selectedTextures[i]);
				}
			}
			combinedGraphics = this.groupGraphicObjects(graphicsToGroup);
		} else if (this.selectedTextures.length == 1) {
			combinedGraphics = this.selectedTextures[0];
		}

		if (combinedGraphics && combinedBodies) {
			//merge these two together yo
			var dif = new b2Vec2(combinedGraphics.x - combinedBodies.GetPosition().get_x() * this.PTM, combinedGraphics.y - combinedBodies.GetPosition().get_y() * this.PTM);
			var angleOffset = combinedBodies.GetAngle() - Math.atan2(dif.y, dif.x);
			var angle = combinedBodies.GetAngle() - combinedGraphics.rotation;
			if (combinedBodies.mySprite.parent.getChildIndex(combinedBodies.mySprite) > combinedGraphics.parent.getChildIndex(combinedGraphics)) {
				combinedBodies.mySprite.parent.swapChildren(combinedBodies.mySprite, combinedGraphics);
			}
			this.updateObject(combinedBodies.mySprite, combinedBodies.mySprite.data);
			this.updateObject(combinedGraphics, combinedGraphics.data);
			this.setTextureToBody(combinedBodies, combinedGraphics, dif.Length(), angleOffset, angle);
		}

		if(combinedGraphics && !combinedBodies){
			this.selectedTextures = [combinedGraphics];
			this.selectedPhysicsBodies = [];
		} else if(combinedBodies){
			this.selectedTextures = [];
			this.selectedPhysicsBodies = [combinedBodies];
		}else{
			this.selectedTextures = [];
			this.selectedPhysicsBodies = [];
		}

		this.updateSelection();
	}
	this.ungroupObjects = function () {

		let ungroupedBodies = [];
		let ungroupedGraphics = [];

		if (this.selectedPhysicsBodies.length == 1) {
			var myTexture = this.selectedPhysicsBodies[0].myTexture;
			if (myTexture) {
				this.removeTextureFromBody(this.selectedPhysicsBodies[0], myTexture);
				if (myTexture.data instanceof this.graphicGroup) {
					ungroupedGraphics = ungroupedGraphics.concat(this.ungroupGraphicObjects(myTexture));
				}else ungroupedGraphics = [myTexture];
			}
			if(this.selectedPhysicsBodies[0].mySprite.data.vertices.length>1) ungroupedBodies = this.ungroupBodyObjects(this.selectedPhysicsBodies[0]);
			else ungroupedBodies = [this.selectedPhysicsBodies[0]];
		}
		if (this.selectedTextures.length == 1 && [this.object_GRAPHICGROUP, this.object_ANIMATIONGROUP].includes(this.selectedTextures[0].data.type)) {
			ungroupedGraphics = ungroupedGraphics.concat(this.ungroupGraphicObjects(this.selectedTextures[0]));
		}
		this.selectedTextures = ungroupedGraphics;
		this.selectedPhysicsBodies = ungroupedBodies;
		this.updateSelection();
	}
	this.groupBodyObjects = function (bodyObjects) {

		bodyObjects.sort(function (a, b) {
			return a.mySprite.data.ID - b.mySprite.data.ID;
		});

		var groupedBodyObject = new this.bodyObject;
		groupedBodyObject.vertices = [];
		groupedBodyObject.colorFill = [];
		groupedBodyObject.colorLine = [];
		groupedBodyObject.lineWidth = [];
		groupedBodyObject.transparancy = [];
		groupedBodyObject.radius = [];
		groupedBodyObject.density = [];
		groupedBodyObject.friction = [];
		groupedBodyObject.restitution = [];
		groupedBodyObject.collision = [];

		// let bounds = {l:Number.POSITIVE_INFINITY, r:-Number.POSITIVE_INFINITY, u:-Number.POSITIVE_INFINITY, d:Number.POSITIVE_INFINITY};
		let centerPoint = {
			x: 0,
			y: 0
		};
		bodyObjects.forEach((body) => {
			this.updateObject(body.mySprite, body.mySprite.data);
			centerPoint.x += body.GetPosition().get_x();
			centerPoint.y += body.GetPosition().get_y();
			// if(body.GetPosition().get_x() < bounds.l) bounds.l = body.GetPosition().get_x();
			// if(body.GetPosition().get_y() < bounds.d) bounds.d = body.GetPosition().get_y();
			// if(body.GetPosition().get_x() > bounds.r) bounds.r = body.GetPosition().get_x();
			// if(body.GetPosition().get_y() > bounds.u) bounds.u = body.GetPosition().get_y();

		});
		centerPoint.x /= bodyObjects.length;
		centerPoint.y /= bodyObjects.length;

		//let centerOffset = {x:(bounds.l-bounds.r)/2, y:(bounds.d-bounds.u)/2};

		groupedBodyObject.x = centerPoint.x;
		groupedBodyObject.y = centerPoint.y;
		groupedBodyObject.rotation = 0;
		groupedBodyObject.tileTexture = bodyObjects[0].mySprite.data.tileTexture;

		for (let i = 0; i < bodyObjects.length; i++) {
			var vertices = [];
			for (var j = 0; j < bodyObjects[i].mySprite.data.vertices.length; j++) {
				var verts = [];

				let innerVerts;

				if (bodyObjects[i].mySprite.data.vertices[j][0] instanceof Array == false) innerVerts = [bodyObjects[i].mySprite.data.vertices[j]];
				else innerVerts = bodyObjects[i].mySprite.data.vertices[j];

				for (var k = 0; k < innerVerts.length; k++) {

					verts[k] = [];

					for (var l = 0; l < innerVerts[k].length; l++) {

						const offsetCenterPoint = {
							x: bodyObjects[i].GetPosition().get_x() - centerPoint.x,
							y: bodyObjects[i].GetPosition().get_y() - centerPoint.y
						}

						var p = {
							x: innerVerts[k][l].x,
							y: innerVerts[k][l].y
						};

						var pl = Math.sqrt(p.x * p.x + p.y * p.y);
						var pa = Math.atan2(p.y, p.x);
						var a = bodyObjects[i].GetAngle();
						p.x = pl * Math.cos(a + pa);
						p.y = pl * Math.sin(a + pa);

						verts[k].push({
							x: p.x + offsetCenterPoint.x,
							y: p.y + offsetCenterPoint.y,
						});
					}
				}
				if (bodyObjects[i].mySprite.data.vertices[j][0] instanceof Array == false) verts = flatten(verts);
				vertices.push(verts);
			}
			groupedBodyObject.vertices = groupedBodyObject.vertices.concat(vertices);
			groupedBodyObject.radius = groupedBodyObject.radius.concat(bodyObjects[i].mySprite.data.radius)
			groupedBodyObject.colorFill = groupedBodyObject.colorFill.concat(bodyObjects[i].mySprite.data.colorFill);
			groupedBodyObject.colorLine = groupedBodyObject.colorLine.concat(bodyObjects[i].mySprite.data.colorLine);
			groupedBodyObject.lineWidth = groupedBodyObject.lineWidth.concat(bodyObjects[i].mySprite.data.lineWidth);
			groupedBodyObject.transparancy = groupedBodyObject.transparancy.concat(bodyObjects[i].mySprite.data.transparancy);
			groupedBodyObject.density = groupedBodyObject.density.concat(bodyObjects[i].mySprite.data.density);
			groupedBodyObject.friction = groupedBodyObject.friction.concat(bodyObjects[i].mySprite.data.friction);
			groupedBodyObject.restitution = groupedBodyObject.restitution.concat(bodyObjects[i].mySprite.data.restitution);
			groupedBodyObject.collision = groupedBodyObject.collision.concat(bodyObjects[i].mySprite.data.collision);

		}
		groupedBodyObject.fixed = bodyObjects[0].mySprite.data.fixed;
		groupedBodyObject.awake = bodyObjects[0].mySprite.data.awake;

		const groupedBody = this.buildBodyFromObj(groupedBodyObject);

		groupedBody.mySprite.parent.swapChildren(groupedBody.mySprite, bodyObjects[0].mySprite);

		this.deleteObjects(bodyObjects);
		this.selectedPhysicsBodies = [groupedBody];
		return groupedBody;
	}
	this.ungroupBodyObjects = function (bodyGroup) {
		var bodies = [];

		this.updateObject(bodyGroup.mySprite, bodyGroup.mySprite.data);

		var verts = bodyGroup.mySprite.data.vertices;
		var colorFill = bodyGroup.mySprite.data.colorFill;
		var colorLine = bodyGroup.mySprite.data.colorLine;
		var lineWidth = bodyGroup.mySprite.data.lineWidth;
		var transparancy = bodyGroup.mySprite.data.transparancy;
		var radius = bodyGroup.mySprite.data.radius;
		var density = bodyGroup.mySprite.data.density;
		var friction = bodyGroup.mySprite.data.friction;
		var restitution = bodyGroup.mySprite.data.restitution;
		var collision = bodyGroup.mySprite.data.collision;

		for (var i = 0; i < verts.length; i++) {
			var bodyObject = new this.bodyObject;

			let innerVerts;

			if (verts[i][0] instanceof Array == false) innerVerts = [verts[i]];
			else innerVerts = verts[i];


			var centerPoint = {
				x: 0,
				y: 0
			};
			for (var j = 0; j < innerVerts.length; j++) {
				for (var k = 0; k < innerVerts[j].length; k++) {
					centerPoint.x += innerVerts[j][k].x;
					centerPoint.y += innerVerts[j][k].y;
				}
			}

			const innerVertsFlatLength = flatten(innerVerts).length;

			centerPoint.x = centerPoint.x / innerVertsFlatLength;
			centerPoint.y = centerPoint.y / innerVertsFlatLength;

			for (var j = 0; j < innerVerts.length; j++) {
				for (var k = 0; k < innerVerts[j].length; k++) {
					innerVerts[j][k].x -= centerPoint.x;
					innerVerts[j][k].y -= centerPoint.y;
				}
			}

			if (verts[i][0] instanceof Array == false) innerVerts = flatten(innerVerts);
			else innerVerts = [innerVerts];


			var a = bodyGroup.GetAngle();
			var atanO = Math.atan2(centerPoint.y, centerPoint.x);
			var sqrtO = Math.sqrt(centerPoint.x * centerPoint.x + centerPoint.y * centerPoint.y);

			centerPoint.x = sqrtO * Math.cos(a + atanO);
			centerPoint.y = sqrtO * Math.sin(a + atanO);

			bodyObject.x += bodyGroup.GetPosition().get_x() + centerPoint.x;
			bodyObject.y += bodyGroup.GetPosition().get_y() + centerPoint.y;
			bodyObject.rotation = bodyGroup.GetAngle();
			bodyObject.vertices = innerVerts;
			bodyObject.colorFill = colorFill[i];
			bodyObject.colorLine = colorLine[i];
			bodyObject.lineWidth = lineWidth[i];
			bodyObject.transparancy = transparancy[i];
			bodyObject.density = density[i];
			bodyObject.friction = friction[i];
			bodyObject.restitution = restitution[i];
			bodyObject.collision = collision[i] == undefined ? collision : collision[i];
			bodyObject.fixed = bodyGroup.mySprite.data.fixed;
			bodyObject.awake = bodyGroup.mySprite.data.awake;

			if (innerVerts[0] instanceof Array == true) { // a fix for earcut bodies being ungrouped
				bodyObject.colorFill = [bodyObject.colorFill];
				bodyObject.colorLine = [bodyObject.colorLine];
				bodyObject.lineWidth = [bodyObject.lineWidth];
				bodyObject.transparancy = [bodyObject.transparancy];
				bodyObject.density = [bodyObject.density];
				bodyObject.friction = [bodyObject.friction];
				bodyObject.restitution = [bodyObject.restitution];
				bodyObject.collision = [bodyObject.collision];
			}


			bodyObject.radius = radius[i];

			const body = this.buildBodyFromObj(bodyObject);

			const container = body.mySprite.parent;
			container.removeChild(body.mySprite);
			container.addChildAt(body.mySprite, bodyGroup.mySprite.data.ID + i);

			bodies.push(body);
		}

		this.deleteObjects([bodyGroup]);


		return bodies;
	}
	this.groupGraphicObjects = function (graphicObjects) {
		const graphicGroup = new this.graphicGroup();

		//sort by childIndex
		let graphic;
		let i;
		const centerPoint = {
			x: 0,
			y: 0
		}
		for (i = 0; i < graphicObjects.length; i++) {
			graphic = graphicObjects[i];
			this.updateObject(graphic, graphic.data);
			centerPoint.x += graphic.x;
			centerPoint.y += graphic.y;
		}
		centerPoint.x = centerPoint.x / graphicObjects.length;
		centerPoint.y = centerPoint.y / graphicObjects.length;

		graphicGroup.x = centerPoint.x;
		graphicGroup.y = centerPoint.y;

		graphicObjects.sort(function (a, b) {
			return a.data.ID - b.data.ID;
		});

		for (i = 0; i < graphicObjects.length; i++) {
			graphicObjects[i].data.x -= centerPoint.x;
			graphicObjects[i].data.y -= centerPoint.y;
			graphicGroup.graphicObjects.push(this.serializeObject(graphicObjects[i].data));
			this.deleteObjects([graphicObjects[i]]);
		}

		graphic = this.buildGraphicGroupFromObj(graphicGroup);

		const container = graphic.parent;
		container.removeChild(graphic);
		container.addChildAt(graphic, graphicObjects[0].data.ID);


		return graphic;

	}
	this.ungroupGraphicObjects = function (graphicGroup) {
		const graphicObjects = [];

		this.updateObject(graphicGroup, graphicGroup.data);

		for (let i = 0; i < graphicGroup.data.graphicObjects.length; i++) {
			const graphicObject = this.parseArrObject(graphicGroup.data.graphicObjects[i]);

			const cosAngle = Math.cos(graphicGroup.rotation);
			const sinAngle = Math.sin(graphicGroup.rotation);
			const dx = graphicObject.x;
			const dy = graphicObject.y;
			graphicObject.x = (dx * cosAngle - dy * sinAngle);
			graphicObject.y = (dx * sinAngle + dy * cosAngle);

			graphicObject.x += graphicGroup.x;
			graphicObject.y += graphicGroup.y;
			graphicObject.rotation = graphicGroup.rotation + graphicObject.rotation;

			let graphic;
			if(graphicObject.type == this.object_GRAPHIC){
				graphic = this.buildGraphicFromObj(graphicObject);
			}else if(graphicObject.type == this.object_TEXTURE){
				graphic = this.buildTextureFromObj(graphicObject);
			}else if(graphicObject.type == this.object_TEXT){
				graphic = this.buildTextFromObj(graphicObject);
			}else if(graphicObject.type == this.object_GRAPHICGROUP){
				graphic = this.buildGraphicGroupFromObj(graphicObject);
			}

			const container = graphic.parent;
			container.removeChild(graphic);
			container.addChildAt(graphic, graphicGroup.data.ID + i);

			graphicObjects.push(graphic);
		}
		this.deleteObjects([graphicGroup]);

		return graphicObjects;
	}
	this.createAnimationGroup = function(){

		const graphicGroup = new this.animationGroup();

		//sort by childIndex
		let graphic;
		let i;
		const centerPoint = {
			x: 0,
			y: 0
		}

		const graphicObjects = [];
		for(i = 0; i<this.selectedTextures.length; i++){
			graphicObjects.push(this.selectedTextures[i]);
		}

		for (i = 0; i < graphicObjects.length; i++) {
			graphic = graphicObjects[i];
			this.updateObject(graphic, graphic.data);
			centerPoint.x += graphic.x;
			centerPoint.y += graphic.y;
		}
		centerPoint.x = centerPoint.x / graphicObjects.length;
		centerPoint.y = centerPoint.y / graphicObjects.length;

		graphicGroup.x = centerPoint.x;
		graphicGroup.y = centerPoint.y;

		graphicObjects.sort(function (a, b) {
			return a.data.ID - b.data.ID;
		});

		for (i = 0; i < graphicObjects.length; i++) {
			graphicObjects[i].data.x -= centerPoint.x;
			graphicObjects[i].data.y -= centerPoint.y;
			graphicGroup.graphicObjects.push(this.serializeObject(graphicObjects[i].data));
			this.deleteObjects([graphicObjects[i]]);
		}

		graphic = this.buildGraphicGroupFromObj(graphicGroup);

		const container = graphic.parent;
		container.removeChild(graphic);
		container.addChildAt(graphic, graphicObjects[0].data.ID);


		this.selectedTextures = [];
		this.updateSelection();

		this.initAnimation(graphic);

		return graphic;


	}

	this.MASKBIT_NORMAL = 0x0001;
	this.MASKBIT_FIXED = 0x0002;
	this.MASKBIT_NOTHING = 0x0004;
	this.MASKBIT_CHARACTER = 0x0008;
	this.MASKBIT_NPC = 0x0010;
	this.MASKBIT_EVERYTHING_BUT_US = 0x00020;
	this.MASKBIT_ONLY_US = 0x0040;
	this.MASKBIT_TRIGGER = 0x0080;
	this.MASKBIT_PHYSICS_CULL = 0x0100;
	// 0x0200
	// 0x0400
	// 0x0800
	// 0x1000
	// 0x2000
	// 0x4000
	// 0x8000

	// I am a ...(categoryBits)	I collide with ... (maskBits)
	
	this.setBodyCollision = function (body, collisions) {
		// COLLISION HELP
		// http://localhost:11009/?lvl=JxbDcyf_PVqzl9fEK6FkP

		/*
		all bits:
		CHARACTER_MASKBIT;
		CUSTOM_MASKBIT;
		FIXED_MASKBIT;
		NORMAL_MASKBIT;

		if either fixture has a groupIndex of zero, use the category/mask rules as above
		if both groupIndex values are non-zero but different, use the category/mask rules as above
		if both groupIndex values are the same and positive, collide
		if both groupIndex values are the same and negative, don't collide*/

		//TODO Bug when selection collision 4 and reset - body falls through fixtures

		let index = collisions.length-1;

		for (let fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {

			const collision = collisions[index];
			//TODO: Set collision for all fixtures
			const filterData = new Box2D.b2Filter();

			// 0) collides with everything
			// - nothing*/

			if (body.GetType() == Box2D.b2_staticBody) filterData.set_categoryBits(this.MASKBIT_FIXED);
			else filterData.set_categoryBits(this.MASKBIT_NORMAL);
			filterData.set_maskBits(this.MASKBIT_NORMAL | this.MASKBIT_FIXED | this.MASKBIT_CHARACTER | this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_TRIGGER | this.MASKBIT_PHYSICS_CULL); //this.MASKBIT_ONLY_US;
			fixture.SetSensor(false);

			if (collision == 1) {
				// 1) collides with mostly everything but characters
				// - mask bit set to CHARACTER_MASKBIT
				filterData.set_maskBits(this.MASKBIT_NORMAL | this.MASKBIT_FIXED | this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_TRIGGER | this.MASKBIT_PHYSICS_CULL); // this.MASKBIT_CHARACTER | this.MASKBIT_ONLY_US;
			} else if (collision == 2) {
				// 2) collides with nothing
				// - setAsTrigger
				filterData.set_categoryBits(this.MASKBIT_NOTHING);
				filterData.set_maskBits(this.MASKBIT_PHYSICS_CULL);
			} else if (collision == 3) {
				// 3) collides with everything except other shapes with collision set to this value.
				// - catagory CUSTOM_MASKBIT, mask CUSTOM_MASKBIT

				if (body.GetType() == Box2D.b2_staticBody) filterData.set_categoryBits(this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_FIXED);
				else filterData.set_categoryBits(this.MASKBIT_EVERYTHING_BUT_US);

				filterData.set_maskBits(this.MASKBIT_NORMAL | this.MASKBIT_FIXED | this.MASKBIT_CHARACTER | this.MASKBIT_TRIGGER | this.MASKBIT_PHYSICS_CULL); //this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_ONLY_US;
			} else if (collision == 4) {
				// 4) collides only with other shapes with collision set to this value.
				// - catagory CUSTOM_MASKBIT, mask CUSTOM_MASKBIT
				filterData.set_categoryBits(this.MASKBIT_ONLY_US);
				filterData.set_maskBits(this.MASKBIT_ONLY_US | this.MASKBIT_TRIGGER | this.MASKBIT_PHYSICS_CULL); //this.MASKBIT_NORMAL | this.MASKBIT_FIXED  | this.MASKBIT_CHARACTER; this.MASKBIT_EVERYTHING_BUT_US;
			} else if (collision == 5) {
				// 5) collides only with fixed shapes
		 		// - set mask to CHARACTER_MASKBIT, CUSTOM_MASKBIT, NORMAL_MASKBIT;
				filterData.set_maskBits(this.MASKBIT_FIXED | this.MASKBIT_TRIGGER | this.MASKBIT_PHYSICS_CULL); //this.MASKBIT_NORMAL | this.MASKBIT_CHARACTER | this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_ONLY_US;
			} else if (collision == 6) {
				// 6) collides only with characters
				// - set mask to CUSTOM_MASKBIT, FIXED_MASKBIT, NORMAL_MASKBIT
				filterData.set_maskBits(this.MASKBIT_CHARACTER | this.MASKBIT_TRIGGER | this.MASKBIT_PHYSICS_CULL); // this.MASKBIT_NORMAL| this.MASKBIT_FIXED | this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_ONLY_US;
			} else if (collision == 7) {
				// 7) sets objects to be an character
				// -

				let targetGroup;
				if(body.mySprite.data.prefabInstanceName){
					if(this.uniqueCollisionPrefabs[body.mySprite.data.prefabInstanceName] !== undefined){
						targetGroup = this.uniqueCollisionPrefabs[body.mySprite.data.prefabInstanceName]
					}else{
						targetGroup = this.uniqueCollisions--;
						this.uniqueCollisionPrefabs[body.mySprite.data.prefabInstanceName] = targetGroup;
					}
				}
				filterData.set_categoryBits(this.MASKBIT_CHARACTER);
				filterData.set_groupIndex(targetGroup);
			}else if(collision == 8){
				// 8) only triggers
				filterData.set_categoryBits(this.MASKBIT_NOTHING);
				filterData.set_maskBits(this.MASKBIT_TRIGGER | this.MASKBIT_PHYSICS_CULL);
			}else if(collision == 9){
				// 9) Trigger collisions
				filterData.set_categoryBits(this.MASKBIT_TRIGGER);
				filterData.set_maskBits(this.MASKBIT_NORMAL | this.MASKBIT_FIXED | this.MASKBIT_ONLY_US | this.MASKBIT_CHARACTER | this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_NOTHING);
				fixture.SetSensor(true);
			}else if(collision == 10){
			// EVERYTHING
			}

			fixture.SetFilterData(filterData);

			if(index>0) index--;
			//
		}
	}


	this.attachJointPlaceHolder = function (obj) {

		if(this.groupEditing) return;

		var tarObj;
		var bodies = [];

		if (obj) {
			tarObj = obj;

			bodies.push(this.textures.getChildAt(tarObj.bodyA_ID).myBody);
			if (tarObj.bodyB_ID != undefined) {
				bodies.push(this.textures.getChildAt(tarObj.bodyB_ID).myBody);
			}

			if(!bodies[0]) return;

		} else {
			tarObj = new this.jointObject;

			const jointData = JSON.parse(JSON.stringify(this.editorJointObject));
			delete jointData.bodyA_ID;
			delete jointData.bodyB_ID;
			delete jointData.x;
			delete jointData.y;
			delete jointData.rotation;
			Object.assign(tarObj, jointData);

			if (this.selectedPhysicsBodies.length < 2) {
				bodies = this.queryWorldForBodies(this.mousePosWorld, this.mousePosWorld);
			} else {
				bodies = [this.selectedPhysicsBodies[0], this.selectedPhysicsBodies[1]];
			}

			if(!bodies[0]) return;
			// filter anything that is not allowed
			// NO TRIGGERS
			if(bodies[0].mySprite.data.type !== this.object_BODY || (bodies[1] && bodies[1].mySprite.data.type !== this.object_BODY)) return;
			// NO PREFABS WITH PREFABS
			if(bodies[0].mySprite.data.prefabInstanceName &&  (bodies[1] && bodies[1].mySprite.data.prefabInstanceName)) return;

			const bodyAVehicle = bodies[0] && this.retrieveClassFromBody(bodies[0]) && this.retrieveClassFromBody(bodies[0]).isVehicle;
			const bodyBVehicle = bodies[1] && this.retrieveClassFromBody(bodies[1]) && this.retrieveClassFromBody(bodies[1]).isVehicle;
			if((bodyAVehicle || bodyBVehicle) && !game.currentLevelData.forced_vehicle){
				ui.showNotice('You must set forceVehicle to true on the character if you want to attach joints to it');
				return;
			}

			tarObj.bodyA_ID = bodies[0].mySprite.parent.getChildIndex(bodies[0].mySprite);
			if (bodies.length > 1) {
				tarObj.bodyB_ID = bodies[1].mySprite.parent.getChildIndex(bodies[1].mySprite);
			}

			tarObj.x = this.mousePosWorld.get_x() * this.PTM;
			tarObj.y = this.mousePosWorld.get_y() * this.PTM;
		}

		var jointGraphics;
		if(tarObj.jointType === this.jointObject_TYPE_PIN) jointGraphics = new PIXI.Sprite(PIXI.Texture.from('pinJoint0000'));
		if(tarObj.jointType === this.jointObject_TYPE_DISTANCE) jointGraphics = new PIXI.Sprite(PIXI.Texture.from('distanceJoint0000'));
		if(tarObj.jointType === this.jointObject_TYPE_SLIDE) jointGraphics = new PIXI.Sprite(PIXI.Texture.from('slidingJoint0000'));
		if(tarObj.jointType === this.jointObject_TYPE_ROPE) jointGraphics = new PIXI.Sprite(PIXI.Texture.from('ropeJoint0000'));
		if(tarObj.jointType === this.jointObject_TYPE_WHEEL) jointGraphics = new PIXI.Sprite(PIXI.Texture.from('wheelJoint0000'));

		this.textures.addChild(jointGraphics);

		jointGraphics.pivot.set(jointGraphics.width / 2, jointGraphics.height / 2);

		jointGraphics.bodies = bodies;

		if (bodies[0].myJoints == undefined) bodies[0].myJoints = [];
		bodies[0].myJoints.push(jointGraphics);

		if (bodies.length > 1) {
			if (bodies[1].myJoints == undefined) bodies[1].myJoints = [];
			bodies[1].myJoints.push(jointGraphics);
		}

		jointGraphics.data = tarObj;

		jointGraphics.x = tarObj.x;
		jointGraphics.y = tarObj.y;
		jointGraphics.rotation = tarObj.rotation;

		jointGraphics.scale.x = 1.0 / this.cameraHolder.scale.x;
		jointGraphics.scale.y = 1.0 / this.cameraHolder.scale.y;


		if (tarObj.prefabInstanceName) {
			jointGraphics.visible = false;
			jointGraphics.isPrefabJointGraphic = true;
		}

		this.addObjectToLookupGroups(jointGraphics, jointGraphics.data);

		this.editorIcons.push(jointGraphics);

		return jointGraphics;

	}

	this.attachJoint = function (jointPlaceHolder) {
		let bodyA = this.textures.getChildAt(jointPlaceHolder.bodyA_ID).myBody;
		let bodyB;

		let addJointToCharacter = null;

		if (jointPlaceHolder.bodyB_ID != null) {

			bodyB = this.textures.getChildAt(jointPlaceHolder.bodyB_ID).myBody;

			if(bodyA === bodyB) return;

			if(bodyA.mySprite && bodyA.mySprite.data.prefabInstanceName && bodyB.mySprite && !bodyB.mySprite.data.prefabInstanceName){
				// this is an ancnhor created on a NoVehicle object that we want to force on the position of the actual body
				addJointToCharacter = this.retrieveSubClassFromBody(bodyA);

				if(jointPlaceHolder.jointType != this.jointObject_TYPE_DISTANCE){
					jointPlaceHolder.x = bodyA.GetPosition().get_x()*Settings.PTM;
					jointPlaceHolder.y = bodyA.GetPosition().get_y()*Settings.PTM;
				}
			}

		} else {
			//pin to background

			let fixDef = new b2FixtureDef();
			fixDef.set_density(1.0);
			fixDef.set_friction(Settings.defaultFriction);
			fixDef.set_restitution(Settings.defaultRestitution);
			fixDef.set_isSensor(true);

			let bd = new b2BodyDef();
			bd.type = Box2D.b2_staticBody;
			bodyB = this.CreateBody(bd);
			const pos = vec1;
			pos.Set(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM);
			bodyB.SetTransform(pos, bodyB.GetAngle());

			const shape = new b2PolygonShape();
			shape.SetAsBox(1, 1);

			fixDef.set_shape(shape);
			bodyB.CreateFixture(fixDef);

			destroy(fixDef);
			destroy(bd);
			destroy(shape);


			this.setBodyCollision(bodyB, [2]);

			for (let fixture = bodyB.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
				// force sensor on joint placeholder bodies
				fixture.SetSensor(true);
			}

		}
		let joint;

		if (jointPlaceHolder.jointType == this.jointObject_TYPE_PIN) {
			const revoluteJointDef = new Box2D.b2RevoluteJointDef();

			const anchor = new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM)

			revoluteJointDef.Initialize(bodyA, bodyB, anchor);

			revoluteJointDef.set_collideConnected(jointPlaceHolder.collideConnected);
			revoluteJointDef.set_referenceAngle(jointPlaceHolder.autoReferenceAngle ? bodyB.GetAngle()-bodyA.GetAngle() : 0);
			revoluteJointDef.set_lowerAngle(jointPlaceHolder.lowerAngle * this.DEG2RAD);
			revoluteJointDef.set_upperAngle(jointPlaceHolder.upperAngle * this.DEG2RAD);
			revoluteJointDef.set_maxMotorTorque(jointPlaceHolder.maxMotorTorque);
			revoluteJointDef.set_motorSpeed(jointPlaceHolder.motorSpeed);
			revoluteJointDef.set_enableLimit(jointPlaceHolder.enableLimit);
			revoluteJointDef.set_enableMotor(jointPlaceHolder.enableMotor);

			joint = Box2D.castObject(this.CreateJoint(revoluteJointDef), Box2D.b2RevoluteJoint);
			destroy(revoluteJointDef);
			destroy(anchor);
		} else if (jointPlaceHolder.jointType == this.jointObject_TYPE_SLIDE) {

			const rotation = jointPlaceHolder.rotation + 90.0 * this.DEG2RAD;
			const axis = new b2Vec2(Math.cos(rotation), Math.sin(rotation));

			let prismaticJointDef = new Box2D.b2PrismaticJointDef();

			const anchor = new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM);

			prismaticJointDef.Initialize(bodyA, bodyB, anchor, axis);
			prismaticJointDef.set_collideConnected(jointPlaceHolder.collideConnected);
			prismaticJointDef.set_referenceAngle(bodyB.GetAngle()-bodyA.GetAngle());
			prismaticJointDef.set_lowerTranslation(jointPlaceHolder.lowerLimit / this.PTM);
			prismaticJointDef.set_upperTranslation(jointPlaceHolder.upperLimit / this.PTM);
			prismaticJointDef.set_maxMotorForce(jointPlaceHolder.maxMotorTorque);
			prismaticJointDef.set_motorSpeed(jointPlaceHolder.motorSpeed);
			prismaticJointDef.set_enableLimit(jointPlaceHolder.enableLimit);
			prismaticJointDef.set_enableMotor(jointPlaceHolder.enableMotor);

			joint = Box2D.castObject(this.CreateJoint(prismaticJointDef), Box2D.b2PrismaticJoint);
			destroy(prismaticJointDef);
			destroy(anchor);
			destroy(axis);
		} else if (jointPlaceHolder.jointType == this.jointObject_TYPE_DISTANCE) {
			let distanceJointDef = new Box2D.b2DistanceJointDef();

			const anchor = new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM);

			distanceJointDef.Initialize(bodyA, bodyB, anchor, anchor);

			distanceJointDef.set_collideConnected(jointPlaceHolder.collideConnected);

			const length = distanceJointDef.get_length();

			distanceJointDef.set_length(length);
			distanceJointDef.set_minLength(0);
			distanceJointDef.set_maxLength(100); // arbitrary large number

			b2LinearStiffness(distanceJointDef, jointPlaceHolder.frequencyHz, jointPlaceHolder.dampingRatio, bodyA, bodyB);

			joint = Box2D.castObject(this.CreateJoint(distanceJointDef), Box2D.b2DistanceJoint);
			destroy(anchor);
			destroy(distanceJointDef);
		} else if (jointPlaceHolder.jointType == this.jointObject_TYPE_ROPE) {
			let ropeJointDef = new Box2D.b2DistanceJointDef();
			ropeJointDef.Initialize(bodyA, bodyB, bodyA.GetPosition(), bodyB.GetPosition());

			const length = ropeJointDef.get_length();
			ropeJointDef.set_minLength(0);
			ropeJointDef.set_maxLength(length);

			ropeJointDef.set_stiffness(0);
			ropeJointDef.set_damping(0);

			joint = Box2D.castObject(this.CreateJoint(ropeJointDef), Box2D.b2DistanceJoint);

			destroy(ropeJointDef);
		} else if (jointPlaceHolder.jointType == this.jointObject_TYPE_WHEEL) {
			const axis = new b2Vec2(Math.cos(jointPlaceHolder.rotation + 90 * this.DEG2RAD), Math.sin(jointPlaceHolder.rotation + 90 * this.DEG2RAD));

			let wheelJointDef = new Box2D.b2WheelJointDef();

			const anchor = new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM);

			wheelJointDef.Initialize(bodyA, bodyB, anchor, axis);
			b2LinearStiffness(wheelJointDef, jointPlaceHolder.frequencyHz, jointPlaceHolder.dampingRatio, bodyA, bodyB);
			wheelJointDef.set_maxMotorTorque(jointPlaceHolder.maxMotorTorque);
			wheelJointDef.set_motorSpeed(jointPlaceHolder.motorSpeed);
			wheelJointDef.set_enableMotor(jointPlaceHolder.enableMotor);

			joint = Box2D.castObject(this.CreateJoint(wheelJointDef), Box2D.b2WheelJoint);

			destroy(axis);
			destroy(anchor);
			destroy(wheelJointDef);
		}
		joint.data = jointPlaceHolder.data;
		bodyA.myJoints = undefined;
		if (bodyB) bodyB.myJoints = undefined;


		if(addJointToCharacter){
			addJointToCharacter.addJoint(joint, bodyB);
		}

		return joint;
	}

	this.buildPrefabFromObj = function (obj) {
		this.createdSubPrefabClasses = [];
		if (this.breakPrefabs) return this.buildJSON(JSON.parse(PrefabManager.prefabLibrary[obj.prefabName].json));
		if(obj.instanceID !== -1) obj.instanceID = this.prefabCounter++;

		const key = obj.prefabName + "_" + obj.instanceID;
		obj.key = key;
		this.activePrefabs[key] = obj;

		const prefabLookupObject = this.buildJSON(JSON.parse(PrefabManager.prefabLibrary[obj.prefabName].json), key);

		this.applyToObjects(this.TRANSFORM_ROTATE, obj.rotation, [].concat(prefabLookupObject._bodies, prefabLookupObject._textures, prefabLookupObject._joints));
		prefabLookupObject._bodies.forEach(body =>{
			this.updateBodyPosition(body);
		});

		obj.class = new PrefabManager.prefabLibrary[obj.prefabName].class(obj);
		obj.class.postConstructor();

		obj.class.subPrefabClasses = this.createdSubPrefabClasses;
		this.createdSubPrefabClasses.forEach(subClass => {
			subClass.postConstructor();
			subClass.mainPrefabClass = obj.class
		});

		if(obj.settings) Object.keys(obj.settings).forEach(key=>obj.class.set(key, obj.settings[key]));

		return prefabLookupObject;
	}
	// this.buildRuntimePrefab = function (prefabName, x, y, rotation) {
	// 	const prefabJSON = `{"objects":[[4,${x},${y},${(rotation || 0)},{},"${prefabName}",${(game.editor.prefabCounter++)}]]}`
	// 	const prefab = this.buildJSON(JSON.parse(prefabJSON));
	// 	this.retrieveClassFromPrefabLookup(prefab).init();
	// 	return prefab;
	// }
	this.retrieveClassFromPrefabLookup = function (prefabLookup) {
		return this.retrieveClassFromBody(prefabLookup._bodies[0]);
	}
	this.retrieveClassFromBody = function(body){
		if(body.mySprite && this.activePrefabs[body.mySprite.data.prefabInstanceName]){
			return this.activePrefabs[body.mySprite.data.prefabInstanceName].class
		}
		return null;
	}
	this.retrieveSubClassFromBody = function (body) {
		if(body.mySprite && this.activePrefabs[body.mySprite.data.subPrefabInstanceName]){
			return this.activePrefabs[body.mySprite.data.subPrefabInstanceName].class
		}
		return null;
	}

	this.setTextureToBody = function (body, texture, positionOffsetLength, positionOffsetAngle, offsetRotation) {
		body.myTexture = texture;
		texture.data.bodyID = body.mySprite.data.ID;
		texture.data.texturePositionOffsetLength = positionOffsetLength;
		texture.data.texturePositionOffsetAngle = positionOffsetAngle;
		texture.data.textureAngleOffset = offsetRotation;
		//body.mySprite.renderable = false;
		if(!body.mySprite.data.visible){
			disableCulling(body.myTexture);
		}
		body.myTexture.renderable = body.mySprite.data.visible;
		body.myTexture.forceRenderable  = body.mySprite.data.visible;

		setBodyGroupOpacity(body, body.mySprite.data.groupOpacity);

		texture.myBody = body;
	}

	this.removeTextureFromBody = function (body, texture) {
		body.myTexture = null;
		texture.data.bodyID = null;
		texture.data.texturePositionOffsetLength = null;
		texture.data.texturePositionOffsetAngle = null;
		texture.data.textureAngleOffset = null;
		body.mySprite.renderable = true;
		texture.myBody = null;
	}

	this.prepareBodyForDecals = function (body) {
		if (body.myRTCache)
			return;

		const bodyClass = this.retrieveSubClassFromBody(body) || this.retrieveClassFromBody(body);
		const bodyParts =
			(bodyClass ?  bodyClass.lookupObject._bodies : [body])
				.filter(e => !!e.myTexture);

		if (bodyParts.length === 0) {
			return;
		}

		const key = body.myTexture.data.prefabInstanceName;
		const rects = bodyParts.map(body => {
			// from is locator, it not create new texture - it get from cache
			// clone it
			let t = PIXI.Texture.from(body.myTexture.data.textureName).clone();
			t.key = body.myTexture.data.textureName +  '_' + body.mySprite.data.refName;
			body.decalLookupKey = t.key;

			return t;
		});

		const system = getDecalSystem(key) || new DS.PackedDecalSystem(game.app, key);
		setDecalSystem(key, system);

		system.generateLayerForGroup(rects);

		for(let body of bodyParts) {

			const decal = system.getDecalFor(body.decalLookupKey);

			body.myRTCache = system;
			body.myDecalEntry = decal;

			if (body.isFlesh && body.myFlesh) {
				body.myFlesh.pluginName = 'batchMasked';
			}

			// change plugin, this is workground for bugged devices
			// should solve
			//body.myTexture.originalSprite.pluginName = 'batchMasked';
			body.myTexture.originalSprite.texture = decal.decalRT;

		}
	}
	this.processQueueDecalToBody = function(){
		if(!this.decalQueue.length) return;

		for(let i = 0; i<Settings.decalProcessesPerFrame; i++){
			const decalProcess = this.decalQueue.shift();
			this.addDecalToBody(...decalProcess)
			if(this.decalQueue.length === 0) break;
		}

	}

	this.queueDecalToBody = function(body, worldPosition, textureName, carving, size, rotation, optional) {
		body.queuedForDecals = true;
		this.decalQueue.push([body, worldPosition, textureName, carving, size, rotation, optional]);
	}

	this.addDecalToBody = function (body, worldPosition, textureName, carving, size, rotation, optional) {
		if (body.destroyed || !body.myTexture || !Settings.goreEnabled)
			return;

//		return;
		delete body.queuedForDecals;

		size = size || 1;
		rotation = rotation || 0;

		this.prepareBodyForDecals(body);

		/**
		 * @type {DS.DecalSystem}
		 */
		const cache = body.myRTCache;

		/**
		 * @type {DS.Decal}
		 */
		const entry = body.myDecalEntry;

		// not all elements can have decals
		if (!cache || !entry) {
			return;
		}

		const pixelPosition = this.getPIXIPointFromWorldPoint(worldPosition);
		const tex = PIXI.Texture.from(textureName);
		// exist after preparation
		const template = new PIXIHeaven.Sprite(tex);

		template.texture = tex;
		template.anchor.set(0.5);
		template.scale.set(1);

		const localPosition = body.myTexture.toLocal(pixelPosition, body.myTexture.parent);

		if (!entry.sprite) {
			const texFrame = body.myTexture.originalSprite.texture.frame;

			//rest
			localPosition.x += texFrame.x;
			localPosition.y += texFrame.y;
		} else {
			localPosition.x += entry.sprite.x;
			localPosition.y += entry.sprite.y;
		}


		template.position = localPosition;
		template.rotation = rotation;
		
		template.carving = carving;
		template.carvingSize = size * 0.6;

		template.scale.set(size);
		template.color.setLight(1, 1, 1);
		template.color.setDark(0, 0, 0);

		cache.pushDecalUpdateTask(template);
		cache.flushDecalTexture();

		if(optional && optional.burn && body.isFlesh) {
			const targetFlesh = body.myTexture.myFlesh;

			if (targetFlesh.burn === undefined) 
				targetFlesh.burn = 0.0;
			
			targetFlesh.burn += Math.min(1.0, optional.burn);

			const burnRate = 0.7 * ( 1 - targetFlesh.burn);

			targetFlesh.color.setLight(0.3+burnRate, 0.3+burnRate, 0.3+burnRate);
			targetFlesh.color.invalidate();
		}
	}

	this.updateBodyFixtures = function (body) {
		//build fixtures

		let fixDef = undefined;

		const fixturesToDestroy = [];
		for (let fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
			fixturesToDestroy.push(fixture);
		}
		fixturesToDestroy.forEach(fixture => body.DestroyFixture(fixture));

		const data = body.mySprite.data;
		const vertices = data.vertices;

		for (var i = 0; i < vertices.length; i++) {
			let innerVertices;

			if (vertices[i][0] instanceof Array == false) innerVertices = [vertices[i]];
			else {
				let j;
				//lets build convex shapes
				let pointsArr = [];
				for (j = 0; j < vertices[i][0].length; j++) {
					pointsArr.push(vertices[i][0][j].x);
					pointsArr.push(vertices[i][0][j].y);
				}

				const earcutIndexes = PIXI.utils.earcut(pointsArr, [], 2);

				const earcutPoints = [];
				for (j = 0; j < earcutIndexes.length; j++) {
					earcutPoints.push(vertices[i][0][earcutIndexes[j]]);
				}

				let earcutTriangles = [];
				while (earcutPoints.length) {
					earcutTriangles.push(earcutPoints.splice(0, 3));
				}

				//
				innerVertices = earcutTriangles;
			}

			for (let j = 0; j < innerVertices.length; j++) {
				fixDef = new b2FixtureDef;

				let density = data.density[i];
				if(!density && density !== 0) density = 1.0;
				fixDef.set_density(Math.max(density, 0.001));

				let friction = data.friction[i];
				if(!friction && friction !== 0) friction = Settings.defaultFriction;
				fixDef.set_friction(friction);

				let restitution = data.restitution[i];
				if(!restitution && restitution !== 0) restitution = Settings.defaultRestitution;
				fixDef.set_restitution(restitution);

				const radius = data.radius[i];
				let shape;
				if (!radius) {
					let vert;
					let b2Vec2Arr = [];
					let vertices = innerVertices[j];
					for (var k = 0; k < vertices.length; k++) {
						vert = vertices[k];
						b2Vec2Arr.push({x: vert.x, y: vert.y});
					}

					shape = new b2PolygonShape();
					shape.Set(pointsToVec2Array(b2Vec2Arr)[0], b2Vec2Arr.length);
					fixDef.set_shape(shape);
				} else {
					shape = new b2CircleShape();
					shape.set_m_radius(radius / this.PTM);
					const pos = shape.get_m_p();
					pos.set_x(innerVertices[j][0].x);
					pos.set_y(innerVertices[j][0].y);
					fixDef.set_shape(shape)
				}
				const fixture = body.CreateFixture(fixDef);
				delete fixture.verticeRef;
				fixture.verticeRef = i;
				destroy(shape);
			}
		}
	}
	this.updateBodyShapes = function (body, dontUpdateTileTexture) {

		//change update body shapes with actual vertices

		for (let i = 0; i < body.mySprite.data.vertices.length; i++) {

			let radius = body.mySprite.data.radius[i];
			let colorFill = body.mySprite.data.colorFill[i];
			let colorLine = body.mySprite.data.colorLine[i];
			let lineWidth = body.mySprite.data.lineWidth[i];
			let transparancy = body.mySprite.data.transparancy[i];

			if (body.mySprite.data.type == this.object_TRIGGER) {
				//color trigger
				continue
			}

			let verts = [];
			let innerVerts;
			if (body.mySprite.data.vertices[i][0] instanceof Array == false) innerVerts = body.mySprite.data.vertices[i];
			else {
				innerVerts = body.mySprite.data.vertices[i][0];
			}
			for (var j = 0; j < innerVerts.length; j++) {
				verts.push({
					x: innerVerts[j].x * this.PTM,
					y: innerVerts[j].y * this.PTM
				});
			}

			if (!radius) this.updatePolyGraphic(body.originalGraphic, verts, colorFill, colorLine, lineWidth, transparancy, (i != 0));
			else this.updateCircleGraphic(body.originalGraphic, radius, innerVerts[0], colorFill, colorLine, lineWidth, transparancy, (i != 0));
		}
		if (!dontUpdateTileTexture && (body.mySprite.tileTexture != "" || body.mySprite.gradient != "")) this.updateTileSprite(body, true);
	}

	this.updateTriggerShape = function(sprite){
		if(sprite.debugGraphic){
			sprite.debugGraphic.clear();

			if(sprite.data.enabled){
				sprite.debugGraphic.beginFill(0xe0b300, 0.3);
			}else{
				sprite.debugGraphic.beginFill(0xfc1500, 0.3);
			}

			if(sprite.data.radius){
				sprite.debugGraphic.drawCircle(0, 0, sprite.data.radius)
			}else{
				const width1 = Math.abs((sprite.data.vertices[1].x-sprite.data.vertices[0].x)/2 * Settings.PTM);
				const width2 = Math.abs((sprite.data.vertices[2].x-sprite.data.vertices[1].x)/2 * Settings.PTM);
				const width = Math.max(width1, width2);

				const height1 = Math.abs((sprite.data.vertices[1].y-sprite.data.vertices[0].y)/2 * Settings.PTM);
				const height2 = Math.abs((sprite.data.vertices[2].y-sprite.data.vertices[1].y)/2 * Settings.PTM);
				const height = Math.max(height1, height2);

				sprite.debugGraphic.drawRect(-width, -height, width*2, height*2);
			}
			sprite.debugGraphic.endFill();
		}
	}

	this.updateGraphicGroupShapes = function (graphic) {
		while (graphic.children.length > 0) graphic.removeChild(graphic.getChildAt(0));

		let g;
		for (var i = 0; i < graphic.data.graphicObjects.length; i++) {
			const gObj = this.parseArrObject(graphic.data.graphicObjects[i]);

			if (gObj instanceof this.graphicObject) {
				g = new PIXI.Container();
				let inner_graphic = new PIXI.Graphics();
				if (!gObj.radius) this.updatePolyGraphic(inner_graphic, gObj.vertices, gObj.colorFill, gObj.colorLine, gObj.lineWidth, gObj.transparancy, true);
				else this.updateCircleGraphic(inner_graphic, gObj.radius, gObj.vertices[0], gObj.colorFill, gObj.colorLine, gObj.lineWidth, gObj.transparancy, true);
				g.data = gObj;
				g.addChild(inner_graphic);
				g.originalGraphic = inner_graphic;
				this.updateTileSprite(g);
				g.data = null;
			} else if (gObj instanceof this.textureObject) {
				g = new PIXIHeaven.Sprite(PIXI.Texture.from(gObj.textureName));
				g.pivot.set(g.width / 2, g.height / 2);
				g.alpha = gObj.transparancy;
			}else if(gObj instanceof this.textObject) {
				g = this.buildTextGraphicFromObj(gObj);
				g.pivot.set(g.width / 2, g.height / 2);
				g.alpha = gObj.transparancy;
			}else if (gObj instanceof this.graphicGroup) {
				g = new PIXI.Container();
				g.data = gObj;

				if(typeof gObj.graphicObjects[0] === 'string'){
					gObj.graphicObjects = gObj.graphicObjects.map(obj => JSON.parse(obj));
				}

				this.updateGraphicGroupShapes(g);
				g.data = null;
				g.alpha = gObj.transparancy;
			}
			graphic.addChild(g);
			g.x = gObj.x;
			g.y = gObj.y;
			g.rotation = gObj.rotation;
		}
	}
	this.updateGraphicShapes = function(target, dontUpdateTileTexture){
		if (target.data.radius) this.updateCircleGraphic(target.originalGraphic, target.data.radius, {
			x: 0,
			y: 0
		}, target.data.colorFill, target.data.colorLine, target.data.lineWidth, target.data.transparancy);
		else this.updatePolyGraphic(target.originalGraphic, target.data.vertices, target.data.colorFill, target.data.colorLine, target.data.lineWidth, target.data.transparancy);
		if (!dontUpdateTileTexture && (target.data.tileTexture != "" || target.data.gradient != "")) this.updateTileSprite(target, true);

	}

	this.updateTileSprite = function (target, forceNew = false) {
		//console.warn("METHOD NOT ALLOWED IN V6");
		//return;

		let tileTexture;

		let targetGraphic;
		let targetSprite;

		let gradientMode = false;

		if (target.mySprite) {
			tileTexture = target.mySprite.data.tileTexture;
			if(!tileTexture){
				tileTexture = target.mySprite.data.gradient;
				gradientMode = true;
			}
			targetGraphic = target.originalGraphic;
			targetSprite = target.mySprite;
		} else {
			tileTexture = target.data.tileTexture;
			if(!tileTexture){
				tileTexture = target.data.gradient;
				gradientMode = true;
			}
			targetGraphic = target.originalGraphic || target;
			targetSprite = target;
		}
		if (forceNew || tileTexture == undefined || tileTexture == "") {
			if (target.myTileSprite) {
				target.myTileSprite.parent.removeChild(target.myTileSprite);
				target.myTileSprite = undefined;
				targetSprite.filters = [];
				targetGraphic.alpha = 1;

				target.myTileSpriteOutline.parent.removeChild(target.myTileSpriteOutline);
				target.myTileSpriteOutline = undefined;
			}
			if (!forceNew) return;
		}

		if (tileTexture && tileTexture != "") {

			if (target.myTileSprite && target.myTileSprite.texture && tileTexture == target.myTileSprite.texture.textureCacheIds[0]) {
				target.myTileSprite.gradientMode = gradientMode;
				// REDRAW OUTLINE
				this.updateTileSpriteOutline(target, targetSprite.data);
				targetGraphic.alpha = 0;
				return;
			}
			let tex;
			if(!gradientMode){
				if(!game.app.loader.resources[tileTexture]){
					// legacy tile texture fix
					tileTexture = tileTexture.split('.')[0];
					if(!PIXI.utils.BaseTextureCache[tileTexture]) tileTexture = 'Sand';
				}

				tex = PIXI.Texture.from(tileTexture);
				tex.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
			}else{
				const gradientIndex = this.levelGradientsNames.indexOf(tileTexture);
				if(gradientIndex >= 0){
					tex = new PIXI.Texture(this.levelGradientBaseTextures[gradientIndex]);
				}else{
					return;
				}
			}

			if (!target.myTileSprite) {
				//game.app.renderer.plugins.graphics.updateGraphics(targetGraphic);

				/**
				 * @type {PIXI.GraphicsGeometry}
				 */
				const g = targetGraphic.geometry;
				g.updateBatches();

				const vertices = new Float32Array(g.points);
				const indices = new Int16Array(g.indices);
				const uvs = new Float32Array(vertices.length);

				let minX = Number.POSITIVE_INFINITY;
				let maxX = -Number.POSITIVE_INFINITY;
				let minY = Number.POSITIVE_INFINITY;
				let maxY = -Number.POSITIVE_INFINITY;

				for (let i = 0; i < vertices.length; i+=2) {
					uvs[i] = vertices[i] * 2.0 / tex.width+0.5;
					uvs[i+1] = vertices[i+1] * 2.0 / tex.width + 0.5;

					minX = Math.min(uvs[i], minX);
					maxX = Math.max(uvs[i], maxX);
					minY = Math.min(uvs[i+1], minY);
					maxY = Math.max(uvs[i+1], maxY);
				}

				if(gradientMode){
					for (let i = 0; i < uvs.length; i += 2) {
						uvs[i + 1] = (uvs[i + 1] - minY) / (maxY - minY);
						uvs[i + 0] = (uvs[i + 0] - minX) / (maxX - minX);
					}
				}

				const mesh = new TiledMesh(tex, vertices, uvs, indices);
				mesh.targetSprite = targetSprite;
				targetSprite.addChild(mesh);
				target.myTileSprite = mesh;
				target.myTileSprite.gradientMode = gradientMode;

				//console.log(mesh);
				// SCROLLING TEXTURE
				// setInterval(()=>{
				// 	temp1.texture.orig.x += 1;
				// 	temp1.texture.orig.x %=  temp1.texture.orig.width;
				// 	temp1.texture._updateUvs();
				// 	temp1.uploadUvTransform = true;
				// 	})

				const outline = new PIXI.Graphics();
				targetSprite.addChild(outline);
				target.myTileSpriteOutline = outline;

				this.updateTileSpriteOutline(target, targetSprite.data);
			}

			const transparency = Array.isArray(targetSprite.data.transparancy) ? targetSprite.data.transparancy[0] : targetSprite.data.transparancy;
			target.myTileSprite.alpha = transparency;
			target.myTileSprite.texture = tex;
			this.updateTileSpriteOutline(target, targetSprite.data);
			targetGraphic.alpha = 0;
		}
	}

	this.updateTileSpriteOutline = function(target, data){
		target.myTileSpriteOutline.clear();
		const oldTileTexture = data.tileTexture;
		data.tileTexture = "";
		const oldColorFill = data.colorFill;

		if(Array.isArray(data.colorFill)){
			data.colorFill = data.colorFill.map(()=> "transparent");
		}else{
			data.colorFill = "transparent";
		}

		const oldOriginalGraphic = target.originalGraphic;
		target.originalGraphic = target.myTileSpriteOutline;
		if(data.type === this.object_BODY){
			this.updateBodyShapes(target, true);
		}else{
			this.updateGraphicShapes(target, true);
		}
		target.originalGraphic = oldOriginalGraphic;
		data.tileTexture = oldTileTexture;
		data.colorFill = oldColorFill;

	}

	this.updatePolyGraphic = function (graphic, verts, colorFill, colorLine, lineWidth, transparancy, dontClear, fillTransparancy) {
		if(fillTransparancy === undefined) fillTransparancy = transparancy;

		let color;
		
		let lineTransparancy = transparancy;

		if(colorLine.length > 7){
			lineTransparancy = Math.max(parseInt('0x'+colorLine.substr(7), 0) / 255, 1/255) * transparancy;
			colorLine = colorLine.substr(0, 7);
		}

		color = colorLine.slice(1);
		let colorLineHex = parseInt(color, 16);

		if (!dontClear) graphic.clear();
		graphic.boundsPadding = 0;

		if(lineWidth) lineWidth += Settings.lineWidthCorrection;
		graphic.lineStyle(lineWidth, colorLineHex, lineTransparancy);

		if(colorFill !== 'transparent'){
			if(colorFill.length > 7){
				fillTransparancy = Math.max(parseInt('0x'+colorFill.substr(7), 0) / 255, 1/255) * transparancy;
				colorFill = colorFill.substr(0, 7);
			}

			color = colorFill.slice(1);
			let colorFillHex = parseInt(color, 16);
			graphic.beginFill(colorFillHex, fillTransparancy);
		}

		const count = verts.length;
		const startPoint = verts[0];

		graphic.moveTo(startPoint.x, startPoint.y);

		let i;
		let currentPoint;
		let nextPoint;

		for (i = 1; i < count; i++) {
			currentPoint = verts[i - 1];
			nextPoint = verts[i];

			if(!currentPoint.point1 || !currentPoint.point2){
				graphic.bezierCurveTo(currentPoint.x, currentPoint.y, nextPoint.x, nextPoint.y, nextPoint.x, nextPoint.y);
			}else{
				graphic.bezierCurveTo(currentPoint.point1.x, currentPoint.point1.y, currentPoint.point2.x, currentPoint.point2.y, nextPoint.x, nextPoint.y);
			}

		}

		if(!nextPoint.point1 || !nextPoint.point2){
			graphic.bezierCurveTo(nextPoint.x, nextPoint.y, startPoint.x, startPoint.y, startPoint.x, startPoint.y);
		}else{
			graphic.bezierCurveTo(nextPoint.point1.x, nextPoint.point1.y, nextPoint.point2.x, nextPoint.point2.y, startPoint.x, startPoint.y);
		}
		graphic.closePath();
		graphic.endFill();

		return graphic;
	}
	this.updateCircleGraphic = function (graphic, radius, pos, colorFill, colorLine, lineWidth, transparancy, dontClear) {
		let color;

		let lineTransparancy = transparancy;

		if(colorLine.length > 7){
			lineTransparancy = Math.max(parseInt('0x'+colorLine.substr(7), 0) / 255, 1/255) * transparancy;
			colorLine = colorLine.substr(0, 7);
		}

		color = colorLine.slice(1);
		const colorLineHex = parseInt(color, 16);

		if (!dontClear) graphic.clear();
		graphic.boundsPadding = 0;

		if(lineWidth) lineWidth += Settings.lineWidthCorrection;

		graphic.lineStyle(lineWidth, colorLineHex, lineTransparancy);

		let fillTransparancy = transparancy;

		if(colorFill !== 'transparent'){
			if(colorFill.length > 7){
				fillTransparancy = Math.max(parseInt('0x'+colorFill.substr(7), 0) / 255, 1/255) * transparancy;
				colorFill = colorFill.substr(0, 7);
			}
			color = colorFill.slice(1);
			const colorFillHex = parseInt(color, 16);
			graphic.beginFill(colorFillHex, fillTransparancy);
		}

		let x = this.getPIXIPointFromWorldPoint(pos).x;
		let y = this.getPIXIPointFromWorldPoint(pos).y;

		graphic.moveTo(x + radius, y);
		graphic.arc(x, y, radius, 0, 2 * Math.PI, false);
		graphic.endFill();
	}

	this.stringifyWorldJSON = function () {
		if(this.groupEditing) stopEditingGroup();
		if(this.selectedTool === this.tool_VERTICEEDITING) this.selectTool(this.tool_SELECT);

		this.worldJSON = '{"objects":[';
		var sprite;
		var i;
		var stringifiedPrefabs = {};

		const objects = []
		for (i = 0; i < this.textures.children.length; i++) {
			sprite = this.textures.children[i];
			this.updateObject(sprite, sprite.data);
			if (sprite.data.prefabInstanceName) {
				if (stringifiedPrefabs[sprite.data.prefabInstanceName]) {
					continue;
				}

				const prefabClass = this.activePrefabs[sprite.data.prefabInstanceName].class;
				if(prefabClass.serializeProps) prefabClass.serializeProps();

				objects.push(this.serializeObject(this.activePrefabs[sprite.data.prefabInstanceName]));
				stringifiedPrefabs[sprite.data.prefabInstanceName] = true;
			} else {
				objects.push(this.serializeObject(sprite.data));
			}
		}
		const settings = this.serializeObject(this.editorSettingsObject);
		const gradients = this.levelGradients;
		const colors = window.__guiusercolors;
		const song = this.editorSettingsObject.song;

		const worldObject = {objects, settings, gradients, colors, song}

		this.worldJSON = JSONStringify(worldObject);

		// console.log("********************** World Data **********************");
		// console.log(this.worldJSON);
		// console.log("********************************************************");
		return this.worldJSON;
	}
	this.serializeObject = function (obj, stringify=false) {
		const arr = [];
		arr[0] = obj.type;
		arr[1] = obj.x;
		arr[2] = obj.y;
		arr[3] = obj.rotation;

		if (obj.type != this.object_PREFAB) {
			arr[4] = obj.groups;
			arr[5] = obj.refName;
		}

		if (obj.type == this.object_BODY) {
			arr[6] = obj.ID;
			arr[7] = obj.colorFill;
			arr[8] = obj.colorLine;
			arr[9] = obj.transparancy;
			arr[10] = obj.fixed;
			arr[11] = obj.awake;
			arr[12] = obj.vertices;
			arr[13] = obj.density;
			arr[14] = obj.collision;
			arr[15] = obj.radius;
			arr[16] = obj.tileTexture;
			arr[17] = obj.lineWidth !== undefined ? obj.lineWidth : 1.0;
			arr[18] = obj.visible;
			arr[19] = obj.instaKill;
			arr[20] = obj.isVehiclePart;
			arr[21] = obj.friction;
			arr[22] = obj.restitution;
			arr[23] = obj.fixedRotation;
			arr[24] = obj.optimizePhysics;
			arr[25] = obj.bulletCollision;
			arr[26] = obj.breakable;
			arr[27] = obj.groupOpacity;
		} else if (obj.type == this.object_TEXTURE) {
			arr[6] = obj.ID;
			arr[7] = obj.textureName;
			arr[8] = obj.bodyID;
			arr[9] = obj.texturePositionOffsetLength;
			arr[10] = obj.texturePositionOffsetAngle;
			arr[11] = obj.textureAngleOffset;
			arr[12] = obj.isCarvable;
			arr[13] = obj.tint;
			arr[14] = obj.scaleX;
			arr[15] = obj.scaleY;
			arr[16] = obj.transparancy;
			arr[17] = obj.parallax;
			arr[18] = obj.repeatTeleportX;
			arr[19] = obj.repeatTeleportY;
			arr[20] = obj.visible;
		} else if (obj.type == this.object_JOINT) {
			arr[6] = obj.ID;
			arr[7] = obj.bodyA_ID;
			arr[8] = obj.bodyB_ID;
			arr[9] = obj.jointType;
			arr[10] = obj.collideConnected;
			arr[11] = obj.enableMotor;
			arr[12] = obj.maxMotorTorque;
			arr[13] = obj.motorSpeed;
			arr[14] = obj.enableLimit;
			arr[15] = obj.upperAngle;
			arr[16] = obj.lowerAngle;
			arr[17] = obj.dampingRatio;
			arr[18] = obj.frequencyHz;
			arr[19] = obj.upperLimit;
			arr[20] = obj.lowerLimit;
			arr[21] = obj.autoReferenceAngle;
		} else if (obj.type == this.object_PREFAB) {
			arr[4] = obj.settings
			arr[5] = obj.prefabName
		} else if (obj.type == this.object_GRAPHIC) {
			arr[6] = obj.ID;
			arr[7] = obj.colorFill;
			arr[8] = obj.colorLine;
			arr[9] = obj.transparancy;
			arr[10] = obj.radius;
			arr[11] = obj.vertices;
			arr[12] = obj.bodyID;
			arr[13] = obj.texturePositionOffsetLength;
			arr[14] = obj.texturePositionOffsetAngle;
			arr[15] = obj.textureAngleOffset;
			arr[16] = obj.tileTexture || "";
			arr[17] = obj.lineWidth !== undefined ? obj.lineWidth : 1.0;
			arr[18] = obj.parallax;
			arr[19] = obj.repeatTeleportX;
			arr[20] = obj.repeatTeleportY;
			const gradientIndex = this.levelGradientsNames.indexOf(obj.gradient);
			arr[21] = gradientIndex >= 0 ? gradientIndex : '';
			arr[22] = obj.visible;
		} else if (arr[0] == this.object_GRAPHICGROUP) {
			arr[6] = obj.ID;
			arr[7] = obj.graphicObjects;
			arr[8] = obj.bodyID;
			arr[9] = obj.texturePositionOffsetLength;
			arr[10] = obj.texturePositionOffsetAngle;
			arr[11] = obj.textureAngleOffset;
			arr[12] = obj.transparancy !== undefined ? obj.transparancy : 1.0;
			arr[13] = obj.parallax;
			arr[14] = obj.repeatTeleportX;
			arr[15] = obj.repeatTeleportY;
			arr[16] = obj.visible;
			arr[17] = obj.mirrored;
			arr[18] = obj.colorMatrix;
		} else if (arr[0] == this.object_TRIGGER) {
			arr[6] = obj.vertices;
			arr[7] = obj.radius;
			arr[8] = obj.enabled;
			arr[9] = obj.targetType;
			arr[10] = obj.repeatType;
			arr[11] = obj.triggerObjects;
			arr[12] = obj.triggerActions;
			arr[13] = obj.followPlayer;
			arr[14] = obj.worldActions;
			arr[15] = obj.triggerKey;
			arr[16] = obj.followFirstTarget;
			arr[17] = obj.delay;
			arr[18] = obj.repeatDelay;
			arr[19] = obj.randomTarget;
			arr[20] = obj.checkpointPersistent;
		} else if (arr[0] == this.object_TEXT) {
			arr[6] = obj.ID;
			arr[7] = obj.text;
			arr[8] = obj.textColor;
			arr[9] = obj.transparancy;
			arr[10] = obj.fontSize;
			arr[11] = obj.fontName;
			arr[12] = obj.textAlign;
			arr[13] = obj.bodyID;
			arr[14] = obj.texturePositionOffsetLength;
			arr[15] = obj.texturePositionOffsetAngle;
			arr[16] = obj.textureAngleOffset;
			arr[17] = obj.parallax;
			arr[18] = obj.repeatTeleportX;
			arr[19] = obj.repeatTeleportY;
			arr[20] = obj.visible;
		}else if(arr[0] == this.object_SETTINGS){
			arr.length = 0;
			arr[0] = obj.type;
			arr[1] = obj.gravityX;
			arr[2] = obj.gravityY;
			arr[3] = obj.backgroundColor;
			arr[4] = obj.cameraZoom;
			arr[5] = obj.gameSpeed;
			arr[6] = obj.colorMatrix;
			arr[7] = obj.autoPlayMidi;
			arr[8] = obj.resetMidiOnRetry;
			arr[9] = obj.cameraEase;
		}else if (arr[0] == this.object_ANIMATIONGROUP) {
			arr[6] = obj.ID;
			arr[7] = obj.graphicObjects;
			arr[8] = obj.bodyID;
			arr[9] = obj.texturePositionOffsetLength;
			arr[10] = obj.texturePositionOffsetAngle;
			arr[11] = obj.textureAngleOffset;
			arr[12] = obj.transparancy !== undefined ? obj.transparancy : 1.0;
			arr[13] = obj.parallax;
			arr[14] = obj.repeatTeleportX;
			arr[15] = obj.repeatTeleportY;
			arr[16] = obj.fps;
			arr[17] = obj.playing;
			arr[18] = obj.visible;
			arr[19] = obj.mirrored;
			arr[20] = obj.loop;
		}
		return stringify ? JSONStringify(arr) : arr;
	}
	this.parseArrObject = function (arr) {
		var obj;
		if (arr[0] == this.object_BODY) {
			obj = new this.bodyObject();
			obj.ID = arr[6];
			obj.colorFill = arr[7];
			obj.colorLine = arr[8];
			obj.transparancy = arr[9];
			obj.fixed = arr[10];
			obj.awake = arr[11];
			obj.vertices = arr[12];
			obj.density = arr[13];
			obj.collision = arr[14];
			obj.radius = arr[15];
			obj.tileTexture = arr[16] || "";
			obj.lineWidth = arr[17] !== undefined ? arr[17] : 1.0;
			obj.visible = typeof arr[18] === "boolean" ? arr[18] : true;
			obj.instaKill = typeof arr[19] === "boolean" ? arr[19] : false;
			obj.isVehiclePart = typeof arr[20] === "boolean" ? arr[20] : false;
			obj.friction = arr[21] !== undefined ? arr[21] : Settings.defaultFriction;
			obj.restitution = arr[22] !== undefined  ? arr[22] : Settings.defaultRestitution;
			obj.fixedRotation = arr[23] !== undefined  ? arr[23] : false;
			obj.optimizePhysics = arr[24] !== undefined  ? arr[24] : true;
			obj.bulletCollision = arr[25] !== undefined  ? arr[25] : false;
			obj.breakable = arr[26] !== undefined  ? arr[26] : false;
			obj.groupOpacity = arr[27] !== undefined  ? arr[27] : 1;
		} else if (arr[0] == this.object_TEXTURE) {
			obj = new this.textureObject();
			obj.ID = arr[6];
			obj.textureName = arr[7];
			obj.bodyID = arr[8];
			obj.texturePositionOffsetLength = arr[9];
			obj.texturePositionOffsetAngle = arr[10];
			obj.textureAngleOffset = arr[11];
			obj.isCarvable = arr[12];
			obj.tint = arr[13] !== undefined ? arr[13] : '#FFFFFF';
			obj.scaleX = arr[14] || 1;
			obj.scaleY = arr[15] || 1;
			obj.transparancy = arr[16] !== undefined ? arr[16] : 1;
			obj.parallax = arr[17] !== undefined ? arr[17] : 0;
			obj.repeatTeleportX = arr[18] !== undefined ? arr[18] : 0;
			obj.repeatTeleportY = arr[19] !== undefined ? arr[19] : 0;
			obj.visible = typeof arr[20] === "boolean" ? arr[20] : true;
		} else if (arr[0] == this.object_JOINT) {
			obj = new this.jointObject();
			obj.ID = arr[6];
			obj.bodyA_ID = arr[7];
			obj.bodyB_ID = arr[8];
			obj.jointType = arr[9];
			obj.collideConnected = arr[10];
			obj.enableMotor = arr[11];
			obj.maxMotorTorque = arr[12];
			obj.motorSpeed = arr[13];
			obj.enableLimit = arr[14];
			obj.upperAngle = arr[15];
			obj.lowerAngle = arr[16];
			obj.dampingRatio = arr[17];
			obj.frequencyHz = arr[18];
			obj.upperLimit = arr[19] !== undefined ? arr[19] : obj.upperLimit;
			obj.lowerLimit = arr[20] !== undefined ? arr[20] : obj.lowerLimit;
			obj.autoReferenceAngle = arr[21] !== undefined ? arr[21] : false;
		} else if (arr[0] == this.object_PREFAB) {
			obj = new this.prefabObject();
			obj.settings = arr[4];
			obj.prefabName = arr[5];
		} else if (arr[0] == this.object_GRAPHIC) {
			obj = new this.graphicObject();
			obj.ID = arr[6];
			obj.colorFill = arr[7];
			obj.colorLine = arr[8];
			obj.transparancy = arr[9];
			obj.radius = arr[10];
			obj.vertices = arr[11];
			obj.bodyID = arr[12];
			obj.texturePositionOffsetLength = arr[13];
			obj.texturePositionOffsetAngle = arr[14];
			obj.textureAngleOffset = arr[15];
			obj.tileTexture = arr[16] || "";
			obj.lineWidth = arr[17] !== undefined ? arr[17] : 1.0;
			obj.parallax = arr[18] !== undefined ? arr[18] : 0;
			obj.repeatTeleportX = arr[19] !== undefined ? arr[19] : 0;
			obj.repeatTeleportY = arr[20] !== undefined ? arr[20] : 0;
			obj.gradient = arr[21] !== undefined ? (this.levelGradientsNames[arr[21]] || '') : '';
			obj.visible = typeof arr[22] === "boolean" ? arr[22] : true;
		} else if (arr[0] == this.object_GRAPHICGROUP) {
			obj = new this.graphicGroup();
			obj.ID = arr[6];
			obj.graphicObjects = arr[7];
			obj.bodyID = arr[8];
			obj.texturePositionOffsetLength = arr[9];
			obj.texturePositionOffsetAngle = arr[10];
			obj.textureAngleOffset = arr[11];
			obj.transparancy = arr[12] !== undefined ? arr[12] : 1;
			obj.parallax = arr[13] !== undefined ? arr[13] : 0;
			obj.repeatTeleportX = arr[14] !== undefined ? arr[14] : 0;
			obj.repeatTeleportY = arr[15] !== undefined ? arr[15] : 0;
			obj.visible = typeof arr[16] === "boolean" ? arr[16] : true;
			obj.mirrored = typeof arr[17] === "boolean" ? arr[17] : false;
			obj.colorMatrix = Array.isArray(arr[18]) ? arr[18] : [];
		} else if (arr[0] == this.object_TRIGGER) {
			obj = new this.triggerObject();
			obj.vertices = arr[6];
			obj.radius = arr[7];
			obj.enabled = typeof arr[8] === "boolean" ? arr[8] : true;
			obj.targetType = arr[9];
			obj.repeatType = arr[10];
			obj.triggerObjects = arr[11];
			obj.triggerActions = arr[12];
			obj.followPlayer = typeof arr[13] === "boolean" ? arr[13] : false;
			obj.worldActions = arr[14] || [];
			obj.triggerKey = arr[15] || 32;
			obj.followFirstTarget = typeof arr[16] === "boolean" ? arr[16] : false;
			obj.delay = typeof arr[17] === "number" ? arr[17] : 0;
			obj.repeatDelay = typeof arr[18] === "number" ? arr[18] : 0;
			obj.randomTarget = typeof arr[19] === "boolean" ? arr[19] : false;
			obj.checkpointPersistent = typeof arr[20] === "boolean" ? arr[20] : false;
		} else if (arr[0] == this.object_TEXT) {
			obj = new this.textObject();
			obj.ID = arr[6];
			obj.text = arr[7];
			obj.textColor = arr[8];
			obj.transparancy = arr[9];
			obj.fontSize = arr[10];
			obj.fontName = arr[11];
			obj.textAlign = arr[12];
			obj.bodyID = arr[13];
			obj.texturePositionOffsetLength = arr[14];
			obj.texturePositionOffsetAngle = arr[15];
			obj.textureAngleOffset = arr[16];
			obj.parallax = arr[17] !== undefined ? arr[17] : 0;
			obj.repeatTeleportX = arr[18] !== undefined ? arr[18] : 0;
			obj.repeatTeleportY = arr[19] !== undefined ? arr[19] : 0;
			obj.visible = typeof arr[20] === "boolean" ? arr[20] : true;
		}else if (arr[0] == this.object_SETTINGS){
			obj = this.editorSettingsObject;
			obj.gravityX = arr[1];
			obj.gravityY = arr[2];
			obj.backgroundColor = arr[3] || '#D4D4D4';
			obj.cameraZoom = arr[4] !== undefined ? arr[4] : Settings.defaultCameraZoom;
			obj.gameSpeed = arr[5] !== undefined ? arr[5] : 1.0;
			obj.colorMatrix = Array.isArray(arr[6]) ? arr[6] : [];
			obj.autoPlayMidi = arr[7] !== undefined ? arr[7] : true;
			obj.resetMidiOnRetry = arr[8] !== undefined ? arr[8] : true;
			obj.cameraEase = arr[9] !== undefined ? arr[9] : Settings.defaultCameraEase;
			return obj;
		}else if (arr[0] == this.object_ANIMATIONGROUP) {
			obj = new this.animationGroup();
			obj.ID = arr[6];
			obj.graphicObjects = arr[7];
			obj.bodyID = arr[8];
			obj.texturePositionOffsetLength = arr[9];
			obj.texturePositionOffsetAngle = arr[10];
			obj.textureAngleOffset = arr[11];
			obj.transparancy = arr[12] !== undefined ? arr[12] : 1;
			obj.parallax = arr[13] !== undefined ? arr[13] : 0;
			obj.repeatTeleportX = arr[14] !== undefined ? arr[14] : 0;
			obj.repeatTeleportY = arr[15] !== undefined ? arr[15] : 0;
			obj.fps = arr[16] !== undefined ? arr[16] : 12;
			obj.playing = arr[17] !== undefined ? arr[17] : true;
			obj.visible = typeof arr[18] === "boolean" ? arr[18] : true;
			obj.mirrored = typeof arr[19] === "boolean" ? arr[19] : false;
			obj.loop = typeof arr[20] === "boolean" ? arr[20] : true;
		}

		obj.type = arr[0];

		//shared vars
		obj.x = arr[1];
		obj.y = arr[2];
		obj.rotation = arr[3] || 0;

		if (arr[0] != this.object_PREFAB) {
			obj.groups = arr[4];
			obj.refName = arr[5];
		}

		return obj;
	}

	this.updateObject = function (sprite, data) {
		if (data.type == this.object_BODY) {
			data.x = sprite.myBody.GetPosition().get_x();
			data.y = sprite.myBody.GetPosition().get_y();
			data.rotation = sprite.myBody.GetAngle();
		} else if (data.type == this.object_TEXTURE || data.type == this.object_GRAPHIC || data.type == this.object_GRAPHICGROUP || data.type == this.object_TEXT || data.type == this.object_ANIMATIONGROUP) {
			data.x = sprite.x;
			data.y = sprite.y;
			data.rotation = sprite.rotation;
			if (data.bodyID != undefined) data.bodyID = sprite.myBody.mySprite.parent.getChildIndex(sprite.myBody.mySprite);
		} else if (data.type == this.object_JOINT) {
			data.bodyA_ID = sprite.bodies[0].mySprite.parent.getChildIndex(sprite.bodies[0].mySprite);
			if (sprite.bodies.length > 1) data.bodyB_ID = sprite.bodies[1].mySprite.parent.getChildIndex(sprite.bodies[1].mySprite);
			data.x = sprite.x;
			data.y = sprite.y;
			data.rotation = sprite.rotation
		} else if (data.type == this.object_TRIGGER) {
			data.x = sprite.myBody.GetPosition().get_x();
			data.y = sprite.myBody.GetPosition().get_y();
			data.rotation = sprite.myBody.GetAngle();

			data.triggerObjects = [];
			for (var i = 0; i < sprite.targets.length; i++) {
				if (sprite.targets[i] instanceof this.prefabObject) data.triggerObjects.push(sprite.targets[i].key);
				else data.triggerObjects.push(sprite.targets[i].parent.getChildIndex(sprite.targets[i]));
			}
		}

		if (!sprite && data.type == this.object_PREFAB) {
			var prefabGroup = this.lookupGroups[data.key];
			var bodyIndex = (prefabGroup._bodies.length > 0) ? prefabGroup._bodies[0].mySprite.parent.getChildIndex(prefabGroup._bodies[0].mySprite) : Number.POSITIVE_INFINITY;
			var spriteIndex = (prefabGroup._textures.length > 0) ? prefabGroup._textures[0].parent.getChildIndex(prefabGroup._textures[0]) : Number.POSITIVE_INFINITY;
			var jointIndex = (prefabGroup._joints.length > 0) ? prefabGroup._joints[0].parent.getChildIndex(prefabGroup._joints[0]) : Number.POSITIVE_INFINITY;
			//to do add body, sprite and joint and compare childIndexes...
			data.ID = Math.min(bodyIndex, spriteIndex, jointIndex);
		} else data.ID = sprite.parent.getChildIndex(sprite);
	}

	this.buildJSON = function (json, prefabInstanceName) {
		//console.log(json);
		let createdObjects = new this.lookupObject();

		let startChildIndex = this.textures.children.length;
		let prefabOffset = 0;

		let jsonString = null;
		let vehicleOffset = 0;
		let characterStartLayer = 0;
		let characterOldEndLayer = 0;
		let characterNewEndLayer = 0;

		const vehicleCorrectLayer = id =>{
			if(id < characterStartLayer) return id;
			if(vehicleOffset > 0){
				if(id<characterNewEndLayer){
					// we are inside character range
					return characterNewEndLayer-1;
				}
			}else{
				if(id > characterOldEndLayer) return id - vehicleOffset;
			}
			return id - vehicleOffset;
		}

		if (json != null) {
			if (typeof json == 'string'){
				jsonString = json;
				json = JSON.parse(json);
			}
			//clone json to not destroy old references
			let worldObjects = JSON.parse(JSON.stringify(json));

			if(worldObjects.gradients){
				this.parseLevelGradients(worldObjects.gradients);
			}

	  		if(worldObjects.colors) window.__guiusercolors = worldObjects.colors;

			let i;
			let obj;
			let worldObject;
			for (i = 0; i < worldObjects.objects.length; i++) {
				obj = this.parseArrObject(worldObjects.objects[i]);

				if (prefabInstanceName) {
					obj.prefabInstanceName = prefabInstanceName;

					let offsetX = this.activePrefabs[prefabInstanceName].x;
					let offsetY = this.activePrefabs[prefabInstanceName].y;

					if (obj.type == this.object_BODY) {
						offsetX /= this.PTM;
						offsetY /= this.PTM;
					}

					obj.x += offsetX;
					obj.y += offsetY;
				}
				if (obj.type != this.object_PREFAB) obj.ID += startChildIndex + prefabOffset - vehicleOffset;

				if (obj.type == this.object_BODY) {
					worldObject = this.buildBodyFromObj(obj);
					createdObjects._bodies.push(worldObject);
				} else if (obj.type == this.object_TEXTURE) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex - vehicleOffset;
					}
					worldObject = this.buildTextureFromObj(obj);
					createdObjects._textures.push(worldObject);
				} else if (obj.type == this.object_JOINT) {
					let destroyMe = false;
					if(obj.bodyA_ID.length === 10){
						const foundSprite = findObjectWithCopyHash(obj.bodyA_ID);
						if(!foundSprite) destroyMe = true;
						else obj.bodyA_ID = foundSprite.parent.getChildIndex(foundSprite);
					}else{
						obj.bodyA_ID = vehicleCorrectLayer(obj.bodyA_ID+startChildIndex);
					}

					if(obj.bodyB_ID != undefined){
						if(obj.bodyB_ID.length === 10){
							const foundSprite = findObjectWithCopyHash(obj.bodyB_ID);
							if(!foundSprite) destroyMe = true;
							else obj.bodyB_ID = foundSprite.parent.getChildIndex(foundSprite);
						}else{
							obj.bodyB_ID = vehicleCorrectLayer(obj.bodyB_ID + startChildIndex);
						}
					}

					if(destroyMe){
						prefabOffset++;
					}else{
						if (this.editing){
							worldObject = this.attachJointPlaceHolder(obj);
							if(!prefabInstanceName) jointTriggerLayer.add(worldObject);
						}
						else worldObject = this.attachJoint(obj);
						createdObjects._joints.push(worldObject);



					}
				} else if (obj.type == this.object_PREFAB) {
					if(game.gameState != game.GAMESTATE_EDITOR && obj.settings.selectedVehicle && game.selectedVehicle){
						vehicleOffset = Settings.vehicleLayers[obj.prefabName];
						characterStartLayer = this.textures.children.length;
						characterOldEndLayer = this.textures.children.length + vehicleOffset;
						obj.prefabName = Settings.availableVehicles[game.selectedVehicle-1];
						obj.settings.selectedVehicle = obj.prefabName;
						// we get the difference between the old vehicleOffset and the new one
						vehicleOffset -= Settings.vehicleLayers[obj.prefabName];
						characterNewEndLayer = this.textures.children.length + vehicleOffset;
					}
					const prefabStartChildIndex = this.textures.children.length;
					const prefabObjects = this.buildPrefabFromObj(obj);

					// fix reference ids
					const propertiesToFix = PrefabManager.copyFixProperties[obj.prefabName] || [];
					propertiesToFix.forEach(property => {
						const targetObject = obj.settings[property];
						if(Array.isArray(targetObject)){
							targetObject.forEach( (obj, index) => {
								if(typeof obj === 'number'){
									targetObject[index] = vehicleCorrectLayer(obj + startChildIndex);
								}else {
									targetObject[index][0] = vehicleCorrectLayer(targetObject[index][0] + startChildIndex);
								}
							})
						}
					})

					if (!this.breakPrefabs) {
						this.activePrefabs[obj.key].ID = prefabStartChildIndex;
						createdObjects._bodies = createdObjects._bodies.concat(prefabObjects._bodies);
						createdObjects._textures = createdObjects._textures.concat(prefabObjects._textures);
						createdObjects._joints = createdObjects._joints.concat(prefabObjects._joints);
						prefabOffset = this.textures.children.length - prefabOffset;
					}
				} else if (obj.type == this.object_GRAPHIC) {

					if(obj.vertices.length === 1) continue;

					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex - vehicleOffset;
					}
					worldObject = this.buildGraphicFromObj(obj);
					createdObjects._textures.push(worldObject);
				} else if (obj.type == this.object_GRAPHICGROUP) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex - vehicleOffset;
					}
					worldObject = this.buildGraphicGroupFromObj(obj);
					createdObjects._textures.push(worldObject);
				}else if (obj.type == this.object_ANIMATIONGROUP) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex - vehicleOffset;
					}
					worldObject = this.buildAnimationGroupFromObject(obj);
					createdObjects._textures.push(worldObject);
				}  else if (obj.type == this.object_TRIGGER) {
					if(obj.triggerObjects.length !== obj.triggerActions.length){
						obj.triggerObjects.length = 0;
						obj.triggerActions.length = 0;
					}

					for (var j = 0; j < obj.triggerObjects.length; j++) {
						if(obj.triggerObjects[j].length === 10){
							const foundSprite = findObjectWithCopyHash(obj.triggerObjects[j]);
							if(!foundSprite){
								obj.triggerObjects.splice(j, 1);
								obj.triggerActions.splice(j, 1);
								j--;
							}else{
								obj.triggerObjects[j] = foundSprite.parent.getChildIndex(foundSprite);
							}
						}else{
							obj.triggerObjects[j] = vehicleCorrectLayer(obj.triggerObjects[j] + startChildIndex);
						}
					}
					worldObject = this.buildTriggerFromObj(obj);

					if(!prefabInstanceName) jointTriggerLayer.add(worldObject.mySprite);

					createdObjects._bodies.push(worldObject);
				} else if (obj.type == this.object_TEXT) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex - vehicleOffset;
					}
					worldObject = this.buildTextFromObj(obj);
					createdObjects._textures.push(worldObject);
				}
			}
			if(worldObjects.settings){
				worldObjects.settings = this.parseArrObject(worldObjects.settings);
				Object.keys(worldObjects.settings).forEach(key=> {
					const val = worldObjects.settings[key];
					if(key === 'backgroundColor') game.app.renderer.backgroundColor = hexToNumberHex(val);
					if(key === 'colorMatrix') applyColorMatrix(this.container, val)
					editorSettings[key] = val
				})
				this.lastValidWorldJSON = jsonString ? jsonString : JSON.stringify(json);
			}
			if(worldObjects.song){
				this.editorSettingsObject.song = worldObjects.song;
			}
		}

		//Fix trigger object targets & fix prefab object targets
		if(!prefabInstanceName && this.editing){
			for (var i = 0; i < this.triggerObjects.length; i++) {
				var _trigger = this.triggerObjects[i];
				if (_trigger.mySprite.triggerInitialized) continue;
				for (var j = 0; j < _trigger.mySprite.data.triggerObjects.length; j++) {
					var targetObject = this.textures.getChildAt(_trigger.mySprite.data.triggerObjects[j]);
					trigger.addTargetToTrigger(_trigger, targetObject);
				}
				_trigger.mySprite.triggerInitialized = true;
			}

			// fix prefabs
			Object.values(this.activePrefabs).forEach(prefab => {
				if(prefab.class && prefab.class.initializeProps){
					prefab.class.initializeProps();
				}
			});


		}

		return createdObjects;
		//console.log("END HERE");
	}
	this.drawBox = function (target, x, y, width, height, lineColor, lineSize, lineAlpha, fillColor, fillAlpha) {

		if (lineSize == undefined) lineSize = 1;
		if (lineAlpha == undefined) lineAlpha = 1;
		if (fillAlpha == undefined) fillAlpha = 1;

		if (fillColor != undefined) target.beginFill(fillColor, fillAlpha);

		target.lineStyle(lineSize, lineColor, lineAlpha);
		target.moveTo(x, y);
		target.lineTo(x + width, y);
		target.lineTo(x + width, y + height);
		target.lineTo(x, y + height);
		target.lineTo(x, y);

		if (fillColor != undefined) target.endFill();
	}
	this.parseLevelGradients = function(gradients){
		this.levelGradients = gradients;
		this.levelGradients.forEach((gradient, index) => {
			this.levelGradientsNames.push(gradient.n);
			this.parseLevelGradient(index);
		})
	}
	this.clearLevelGradients = function(){
		this.levelGradients = [];
		this.levelGradientsNames = [];
		this.levelGradientBaseTextures.forEach(gradient => gradient.destroy());
		this.levelGradientBaseTextures = [];
	}

	this.parseLevelGradient = function(index){
		let baseTexture = this.levelGradientBaseTextures[index];

		if(!baseTexture){
			const gradientCanvas = document.createElement('canvas');
			gradientCanvas.width = Settings.gradientTextureSize;
			gradientCanvas.height = Settings.gradientTextureSize;
			baseTexture = new PIXI.BaseTexture(gradientCanvas);
			this.levelGradientBaseTextures[index] = baseTexture;
		}
		drawing.drawGradient(baseTexture.resource.source, this.levelGradients[index], Settings.gradientTextureSize);
		baseTexture.update();
	}

	this.resetEditor = function () {
		camera.resetToStoredPosition();

		jointTriggerLayer.reset();
        game.triggerDebugDraw.debounceRedraw();

		this.editing = true;
		this.selectTool(this.tool_SELECT);

		this.selectedPhysicsBodies = [];
		this.selectedTextures = [];
		this.selectedPrefabs = {};

		if(this.groupEditing) stopEditingGroup();

		this.selectedBoundingBox = null;
		this.startSelectionPoint = null;
		this.oldMousePosWorld = null;
		this.mouseDown = false;
		this.middleMouseDown = false;
		this.prefabCounter = 0;
		this.deepClickDetection = null;
		this.deepClickMinimumLayer = Number.POSITIVE_INFINITY;

		this.editorIcons = [];
		this.triggerObjects = [];

		this.stopTriggerTargetSelecting();
		this.customPrefabMouseDown = null;
		this.customPrefabMouseMove = null;
		this.customDebugDraw = null;

		this.uniqueCollisions = -3;
		this.uniqueCollisionPrefabs = {};

		this.physicsCamera = null;
		this.bulletBodyCount = 0;
		window.__guiusercolors = [];
		delete this.editorSettingsObject.song;

		//Destroy all bodies
		for (let body = this.world.GetBodyList(); getPointer(body) !== getPointer(NULL); body = body.GetNext()) {
			this.DestroyBody(body);
		}

		//Destroy all graphics
		var i = 0
		for (i = 0; i < this.textures.children.length; i++) {
			const sprite = this.textures.getChildAt(i);

			if(sprite.myTileSprite){
				sprite.myTileSprite.parent.removeChild(sprite.myTileSprite);
			}

			if(sprite.myBody){
				if(sprite.myBody.myTileSprite){
					sprite.myBody.myTileSprite.parent.removeChild(sprite.myBody.myTileSprite);
					delete sprite.myBody.myTileSprite;
				}
			}

			let destroyAll = false;

			if(sprite.data){
				// make sure to first remove textures from graphic groups and animations
				if(sprite.data.type === this.object_GRAPHICGROUP || sprite.data.type === this.object_ANIMATIONGROUP){
					const toDestroy = [];
					sprite.children.forEach(s => {
						if(s.isSprite && !s._text){
							toDestroy.push(s);
						}else if(s.children.length > 0){
							// check if its a graphics group
							s.children.forEach(_s => {
								if(_s.isSprite && !_s._text){
									toDestroy.push(_s);
								}
							})
						}

					})
					toDestroy.forEach(s => {
						s.destroy({
							children: true,
							texture: false,
							baseTexture: false
						})
					});
				}

				if([this.object_TEXT, this.object_GRAPHIC, this.object_BODY, this.object_TRIGGER, this.object_GRAPHICGROUP, this.object_ANIMATIONGROUP].includes(sprite.data.type)
				&& !sprite.isMesh) destroyAll = true;
			}


			sprite.destroy({
				children: true,
				texture: destroyAll,
				baseTexture: destroyAll
			});
			i--;
		}

		Object.keys(this.activePrefabs).forEach(prefab =>{
			this.activePrefabs[prefab].class.reset();
		})

		DS.dropSystems();

		this.activePrefabs = {};
		this.lookupGroups = {};
		this.parallaxObject = [];
		this.animationGroups = [];
		this.decalQueue = [];
		this.persistentTriggers = [];

		BodyBreakable.reset();
		this.clearDebugGraphics();
		this.clearLevelGradients();
		//reset gui
		ui.destroyEditorGUI();
		ui.show();

        if(this.tracingTexture) this.tracingTexture.renderable = true;
	}

	this.B2dEditorContactListener = new Box2D.JSContactListener();
	this.B2dEditorContactListener.BubbleEvent = function (name, contact, secondParam) {
		if (self.contactCallBackListener) {
			if (secondParam) self.contactCallBackListener[name](contact, secondParam);
			else self.contactCallBackListener[name](contact);
		}
		var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
		var body;
		var selectedPrefab = null;
		var selectedSubPrefab = null
		for (var i = 0; i < bodies.length; i++) {
			body = bodies[i];
			if (body.mySprite && body.mySprite.data.prefabInstanceName && self.activePrefabs[body.mySprite.data.prefabInstanceName]) {
				var tarPrefab = self.activePrefabs[body.mySprite.data.prefabInstanceName].class;
				if (tarPrefab && tarPrefab != selectedPrefab && tarPrefab.contactListener) {
					selectedPrefab = tarPrefab;
					if (secondParam) selectedPrefab.contactListener[name](contact, secondParam);
					else selectedPrefab.contactListener[name](contact);
				}
			}
			if (body.mySprite && body.mySprite.data.subPrefabInstanceName) {
				var tarPrefab = self.activePrefabs[body.mySprite.data.subPrefabInstanceName].class;
				if (tarPrefab && tarPrefab != selectedSubPrefab && tarPrefab.contactListener) {
					selectedSubPrefab = tarPrefab;
					if (secondParam) selectedSubPrefab.contactListener[name](contact, secondParam);
					else selectedSubPrefab.contactListener[name](contact);
				}
			}
			if (body.mySprite && body.mySprite.data.type == self.object_TRIGGER) {
				if (secondParam) body.class.contactListener[name](contact, secondParam);
				else body.class.contactListener[name](contact);
			}

			if(body.contactListener){
				if (secondParam) body.contactListener[name](contact, secondParam);
				else body.contactListener[name](contact);
			}
		}
	}
	this.B2dEditorContactListener.BeginContact = function (contactPtr) {
        const contact = Box2D.wrapPointer( contactPtr, Box2D.b2Contact );
		if(contact.GetFixtureA().GetBody().isPhysicsCamera || contact.GetFixtureB().GetBody().isPhysicsCamera){
			physicsCullCamera.beginContact(contact);
		}else this.BubbleEvent("BeginContact", contact);
	}
	this.B2dEditorContactListener.EndContact = function (contactPtr) {
        const contact = Box2D.wrapPointer( contactPtr, Box2D.b2Contact );
		if(contact.GetFixtureA().GetBody().isPhysicsCamera || contact.GetFixtureB().GetBody().isPhysicsCamera){
			physicsCullCamera.endContact(contact);
		}else this.BubbleEvent("EndContact", contact);
	}
	this.B2dEditorContactListener.PreSolve = function (contactPtr, oldManifoldPtr) {
		const contact = Box2D.wrapPointer( contactPtr, Box2D.b2Contact );
		const oldManifold = Box2D.wrapPointer( oldManifoldPtr, Box2D.b2Manifold );

		this.BubbleEvent("PreSolve", contact, oldManifold);
	}
	this.B2dEditorContactListener.PostSolve = function (contactPtr, impulsePtr) {
		const contact = Box2D.wrapPointer( contactPtr, Box2D.b2Contact );
		const impulse = Box2D.wrapPointer(  impulsePtr, Box2D.b2ContactImpulse );
		this.BubbleEvent("PostSolve", contact, impulse);
	}
	this.testWorld = function () {
		this.selectTool(this.tool_SELECT);

		if(this.groupEditing) stopEditingGroup();
        this.stringifyWorldJSON();

		camera.storeCurrentPosition();
		this.selectTool(this.tool_SELECT);
		this.playerHistory.length = 0;
		this.runWorld();
	}

	this.runWorld = function () {
		this.editorIcons = [];
		this.clearDebugGraphics();

		if (game.gameState == game.GAMESTATE_EDITOR){
			const exitText = new PIXI.Text('Press T or ESC to exit test',{fontFamily : 'Arial', fontSize: 15, fill : 0xE0B300});
			exitText.x = exitText.y = 10;
			this.debugGraphics.addChild(exitText);
		}

		this.editing = false;

		var spritesToDestroy = [];
		var sprite;

		this.lookupGroups = {};
		this.deltaTime = 0;
		this.deltaTimeSeconds = 0;

		this.world.SetContactListener(this.B2dEditorContactListener);

		var i;
		for (i = 0; i < this.textures.children.length; i++) {
			sprite = this.textures.getChildAt(i);
			if (sprite.data.type == this.object_JOINT) {

				sprite.data.bodyA_ID = sprite.bodies[0].mySprite.parent.getChildIndex(sprite.bodies[0].mySprite);
				if (sprite.bodies.length > 1) sprite.data.bodyB_ID = sprite.bodies[1].mySprite.parent.getChildIndex(sprite.bodies[1].mySprite);
				this.updateObject(sprite, sprite.data);

				const joint = this.attachJoint(sprite.data);

				spritesToDestroy.push(sprite);

				if(joint){
					if (sprite.myTriggers != undefined) {
						for (var j = 0; j < sprite.myTriggers.length; j++) {
							trigger.replaceTargetOnTrigger(sprite.myTriggers[j], sprite, joint);
						}
					}
					this.addObjectToLookupGroups(joint, sprite.data);
					joint.spriteData = sprite.data;
				}
			} else if (sprite.data.type == this.object_BODY) {
				this.addObjectToLookupGroups(sprite.myBody, sprite.data);
				sprite.myBody.SetAwake(false);
				if(sprite.myBody.ignorePhysicsCuller && sprite.data.awake) sprite.myBody.SetAwake(true);
			} else if (sprite.data.type == this.object_TEXTURE) {
				this.addObjectToLookupGroups(sprite, sprite.data);
			} else if (sprite.data.type == this.object_TRIGGER) {
				sprite.debugGraphic.parent.removeChild(sprite.debugGraphic);
				delete sprite.debugGraphic;
				sprite.visible = false;
			}

			if(!sprite.myBody && (sprite.data.parallax || sprite.data.repeatTeleportX || sprite.data.repeatTeleportY)){
				sprite.parallaxStartPosition = sprite.position.clone();
				// disable cull for this sprite.
				disableCulling(sprite);
				this.parallaxObject.push(sprite);
			}

			if(sprite.data.type === this.object_ANIMATIONGROUP){
				this.animationGroups.push(sprite);
			}

		}
		for (i = 0; i < spritesToDestroy.length; i++) {
			sprite = spritesToDestroy[i];
			sprite.parent.removeChild(sprite);
			sprite.destroy({
				children: true,
				texture: false,
				baseTexture: false
			});
		}
		var key;
		for (key in this.activePrefabs) {
			if (this.activePrefabs.hasOwnProperty(key)) {
				this.activePrefabs[key].class.init();
			}
		}
		for (i = 0; i < this.triggerObjects.length; i++) {
			this.triggerObjects[i].class = new trigger.triggerCore();
			this.triggerObjects[i].class.init(this.triggerObjects[i]);
		}
		this.editing = false;
		ui.hide();

		game.world.SetGravity(new b2Vec2(this.editorSettingsObject.gravityX, this.editorSettingsObject.gravityY));

		physicsCullCamera.init();

        if(this.tracingTexture) this.tracingTexture.renderable = false;

	}

	this.resize = function () {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}

	this.getWorldPointFromPixelPoint = function (pixelPoint) {
		return new b2Vec2(((pixelPoint.x - this.cameraHolder.x) / this.cameraHolder.scale.x) / this.PTM, ((pixelPoint.y - this.cameraHolder.y) / this.cameraHolder.scale.y) / this.PTM);
	}
	this.getPIXIPointFromWorldPoint = function (worldPoint) {
		if(worldPoint.get_x !== undefined) return {x: worldPoint.get_x() * this.PTM, y: worldPoint.get_y() * this.PTM};
		else return {x: worldPoint.x * this.PTM, y: worldPoint.y * this.PTM};
	}
	this.getScreenPointFromWorldPoint = function(worldPoint){
		const point = this.getPIXIPointFromWorldPoint(worldPoint);
		point.x *= this.cameraHolder.scale.x;
		point.x += this.cameraHolder.x;
		point.y *= this.cameraHolder.scale.y;
		point.y += this.cameraHolder.y;
		return point;
	}
	this.renderPrefabToImage = function (prefabName) {
		var prefabObject = new this.prefabObject;
		prefabObject.prefabName = prefabName;
		prefabObject.instanceID = -1;
		var objects = this.buildPrefabFromObj(prefabObject);
		objects = this.sortObjectsByIndex([].concat(objects._bodies, objects._textures));
		var newContainer = new PIXI.Sprite();
		for (var i = 0; i < objects.length; i++) {
			var sprite = objects[i].mySprite ? objects[i].mySprite : objects[i];
			sprite.parent.removeChild(sprite);
			newContainer.addChild(sprite);
		}
		var image = game.app.renderer.plugins.extract.image(newContainer);
		var sprite = objects[0].mySprite ? objects[0].mySprite : objects[0];
		var prefabObject = this.activePrefabs[sprite.data.prefabInstanceName];

		// a hack to delete blueprint triggers
		const prefabTriggersCreated = objects.filter(obj=> obj.mySprite && obj.mySprite.data.type == this.object_TRIGGER);
		if(prefabTriggersCreated) this.deleteObjects(prefabTriggersCreated);

		this.deleteObjects([prefabObject]);

		return image;
	}

	window.renderJollyDataToImage = async compressedString => {
		try{
			const copyData = compressedString.substr(Settings.jollyDataPrefix.length, compressedString.length-Settings.jollyDataPrefix.length-1);

			const copyJsonString = LZString.decompressFromEncodedURIComponent(copyData);
			const jsonData = JSON.parse(copyJsonString);
			if(jsonData){
				let objects = this.buildJSON(jsonData);

				objects = this.sortObjectsByIndex([].concat(objects._bodies, objects._textures));
				const newContainer = new PIXI.Sprite();
				for (let i = 0; i < objects.length; i++) {
					const sprite = objects[i].mySprite ? objects[i].mySprite : objects[i];
					sprite.parent.removeChild(sprite);
					newContainer.addChild(sprite);
				}
				const image = game.app.renderer.plugins.extract.image(newContainer);
				this.deleteObjects(objects);
				return image;
			}
		}catch(err){
			console.warn("JOLLY IMAGE PARSING ERROR:", err);
			return null
		}
	}

	this.initRenderJollyRendering = ()=> {
		window.addEventListener('message', async messageObject => {
			const {type, jollyData} = messageObject.data;
			if(type === 'renderJollyImage'){
				const image = await window.renderJollyDataToImage(jollyData);
				window.parent.postMessage({type:'jollyImageRendered', imageData: image.src}, '*');
			}
			if(type === 'jollyImageRenderingAckReady'){
				window.parent.postMessage({type:'jollyImageRenderingReady'}, '*');
			}
		});
	}


	// mesh circular texture fix

	//CONSTS
	this.object_typeToName = ["Physics Body", "Texture", "Joint"];

	this.jointObject_TYPE_PIN = 0;
	this.jointObject_TYPE_SLIDE = 1;
	this.jointObject_TYPE_DISTANCE = 2;
	this.jointObject_TYPE_ROPE = 3;
	this.jointObject_TYPE_WHEEL = 4;

	this.mouseTransformType = 0;
	this.mouseTransformType_Movement = 0;
	this.mouseTransformType_Rotation = 1;

	this.DEG2RAD = 0.017453292519943296;
	this.RAD2DEG = 57.29577951308232;
	this.PI2 = Math.PI*0.5;;

	this.tool_SELECT = 0;
	this.tool_GEOMETRY = 1;
	this.tool_POLYDRAWING = 2;
	this.tool_PEN = 3;
	this.tool_JOINTS = 4;
	this.tool_SPECIALS = 5;
	this.tool_TEXT = 6;
	this.tool_ART = 7;
	this.tool_TRIGGER = 8;
	this.tool_SETTINGS = 9;
	this.tool_CAMERA = 10;
	this.tool_VERTICEEDITING = 11;
	this.allowed_editing_TOOLS = [-1, this.tool_SELECT, this.tool_GEOMETRY, this.tool_POLYDRAWING, this.tool_PEN, this.tool_TEXT, this.tool_ART, this.tool_SETTINGS, this.tool_VERTICEEDITING];

	this.minimumBodySurfaceArea = 0.1;
}

attachGraphicsAPIMixin();
export const B2dEditor = new _B2dEditor();

window.editor = B2dEditor;
