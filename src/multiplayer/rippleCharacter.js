import {
	Container
} from "@pixi/display";
import * as PIXI from 'pixi.js';
import { game } from "../Game";
import { Settings } from "../Settings";
import { updateLeaderboard } from "./hud";
import { RippleVehicle } from "./rippleVehicle";
import * as emitterManager from '../utils/EmitterManager';
import * as AudioManager from '../utils/AudioManager';
import { generateGoreParticles } from "../utils/GenerateGoreParticles";


const DEG2RAD = 0.017453292519943296;


export const PLAYER_STATUS = {
	IDLE: 0,
	DEATH: 1,
	CHECKPOINT: 2,
}

export class RippleCharacter {
	constructor(id) {
		this.id = id;
		this.playerIndex = -1;
		this.sprite = new Container();
		this.sprite.velocity = {x: 0, y: 0};
		this.sprite.visible = false;
		this.sprite.rippleCharacterClass = this;
		this.state = {
			body: new SyncObject(),
			head: new SyncObject(),
			shoulderLeft: new SyncObject(),
			shoulderRight: new SyncObject(),
			armLeft: new SyncObject(),
			armRight: new SyncObject(),
			handLeft: new SyncObject(),
			handRight: new SyncObject(),
			belly: new SyncObject(),
			thighLeft: new SyncObject(),
			thighRight: new SyncObject(),
			legLeft: new SyncObject(),
			legRight: new SyncObject(),
			feetLeft: new SyncObject(),
			feetRight: new SyncObject(),
			cameraObject: new SyncObject(),
		}
		this.cloud = null;
		this.chatBox = null;

		this.state.body.overflow = true;

		this.playerState = {
			name: '...',
			lobbyState: 0,
			status: 0,
			finishTime: -1
		}

		this.admin = false;
		this.vip = false;
		this.lastPackageID = -1;
		this.ping = -1;
		this.connected = true;
		this.addedToGame = false;

		this.lastStatusChange = 0;

		this.stateKeys = Object.keys(this.state);
		this.stateProcessList = [this.state.head, this.state.shoulderLeft, this.state.shoulderRight, this.state.armLeft, this.state.armRight, this.state.handLeft, this.state.handRight, this.state.belly, this.state.thighLeft, this.state.thighRight, this.state.legLeft, this.state.legRight, this.state.feetLeft, this.state.feetRight];
		this.spriteSheet = null;
		this.spriteProcessList = [];
		this.mirror = false;
		this.hatTexture = "";

		this.vehicle = new RippleVehicle(this.sprite);
	}

	loadSkin(url){
		const texture = PIXI.Texture.from(url);
		this.spriteSheet = new PIXI.Spritesheet(texture, multiplayerAtlas);
		this.spriteSheet.parse(()=>{
			this.buildSprite();
			this.vehicle.buildSprite(this.spriteSheet);
		});
	}

	buildSprite() {
		this.sprites = {
			body: new PIXI.Sprite(this.spriteSheet.textures['Normal_Core']),
			head: new PIXI.Sprite(this.spriteSheet.textures['Normal_Head_Idle']),
			shoulderLeft: new PIXI.Sprite(this.spriteSheet.textures['Normal_Shoulder']),
			shoulderRight: new PIXI.Sprite(this.spriteSheet.textures['Normal_Shoulder']),
			armLeft: new PIXI.Sprite(this.spriteSheet.textures['Normal_Arm']),
			armRight: new PIXI.Sprite(this.spriteSheet.textures['Normal_Arm']),
			handLeft: new PIXI.Sprite(this.spriteSheet.textures['Normal_Hand']),
			handRight: new PIXI.Sprite(this.spriteSheet.textures['Normal_Hand']),
			belly: new PIXI.Sprite(this.spriteSheet.textures['Normal_Belly']),
			thighLeft: new PIXI.Sprite(this.spriteSheet.textures['Normal_Thigh']),
			thighRight: new PIXI.Sprite(this.spriteSheet.textures['Normal_Thigh']),
			legLeft: new PIXI.Sprite(this.spriteSheet.textures['Normal_Leg']),
			legRight: new PIXI.Sprite(this.spriteSheet.textures['Normal_Leg']),
			feetLeft: new PIXI.Sprite(this.spriteSheet.textures['Normal_Feet']),
			feetRight: new PIXI.Sprite(this.spriteSheet.textures['Normal_Feet']),
			eyeLeft: new PIXI.Sprite(this.spriteSheet.textures['Normal_Eye']),
			eyeRight: new PIXI.Sprite(this.spriteSheet.textures['Normal_Eye']),
			mouth: new PIXI.Sprite(this.spriteSheet.textures['Mouth_Idle']),
		}


		for(let obj in this.sprites){
			this.sprites[obj].anchor.set(0.5, 0.5);
		}

		this.sprite.addChild(this.sprites.handLeft);
		this.sprite.addChild(this.sprites.armLeft);
		this.sprite.addChild(this.sprites.shoulderLeft);
		this.sprite.addChild(this.sprites.thighLeft);
		this.sprite.addChild(this.sprites.legLeft);
		this.sprite.addChild(this.sprites.feetLeft);
		this.sprite.addChild(this.sprites.belly);
		this.sprite.addChild(this.sprites.body);
		this.sprite.addChild(this.sprites.head);

		this.sprites.head.addChild(this.sprites.eyeLeft);
		this.sprites.eyeLeft.x = 5;
		this.sprites.eyeLeft.y = -1;
		this.sprites.head.addChild(this.sprites.eyeRight);
		this.sprites.eyeRight.x = 27;
		this.sprites.eyeRight.y = -1;
		this.sprites.head.addChild(this.sprites.mouth);
		this.sprites.mouth.x = 14.5;
		this.sprites.mouth.y = 26.5;

		this.sprite.addChild(this.sprites.thighRight);
		this.sprite.addChild(this.sprites.legRight);
		this.sprite.addChild(this.sprites.feetRight);
		this.sprite.addChild(this.sprites.shoulderRight);
		this.sprite.addChild(this.sprites.armRight);
		this.sprite.addChild(this.sprites.handRight);

		this.buildChatBox();

		const nameText = new PIXI.Text(this.playerState.name, new PIXI.TextStyle({fontFamily:'Montserrat', fontWeight: 400, lineJoin:'round', fontSize: 24, fill: 0xFFFFFF, stroke: 0x000000, strokeThickness: 4}))
		nameText.pivot.set(nameText.width / 2, nameText.height / 2);
		nameText.y = -140;
		this.sprite.nameText = nameText;
		this.sprite.addChild(nameText);

		this.buildCloud();

		this.spriteProcessList = [this.sprites.head, this.sprites.shoulderLeft, this.sprites.shoulderRight, this.sprites.armLeft, this.sprites.armRight, this.sprites.handLeft, this.sprites.handRight, this.sprites.belly, this.sprites.thighLeft, this.sprites.thighRight, this.sprites.legLeft, this.sprites.legRight, this.sprites.feetLeft, this.sprites.feetRight];
	}

	selectHat(texture, hatOffsetLength, hatOffsetAngle){
		this.hatTexture = texture;

		if(this.sprites.hat){
			this.sprites.hat.destroy();
			delete this.sprites.hat;
		}

		if(this.hatTexture && this.spriteProcessList.length){
			if(['DirtBikeHelmet', 'SkateHelmet'].includes(this.hatTexture)){
				this.sprites.hat = new PIXI.Sprite(this.spriteSheet.textures[this.hatTexture]);
			} else {
				this.sprites.hat = new PIXI.Sprite(PIXI.Texture.from(this.hatTexture));
			}
			this.sprites.hat.anchor.set(0.5, 0.5);

			this.sprites.hat.x = -hatOffsetLength * Math.cos(hatOffsetAngle);
			this.sprites.hat.y = -hatOffsetLength * Math.sin(hatOffsetAngle);

			this.sprites.head.addChild(this.sprites.hat)
		}
	}

	buildCloud(){
		this.cloud = new PIXI.Container();
		const cloudSize = 50;
		this.cloud.bg = new PIXI.Graphics().lineStyle(4, 0x000000).beginFill(0xFFFFFF).drawCircle(0, 0, cloudSize);
		this.cloud.addChild(this.cloud.bg);

		this.cloud.arrow = new PIXI.Graphics();
		const arrowSpread = 12 * DEG2RAD;
		this.cloud.addChild(this.cloud.arrow);
		this.cloud.arrow.fixArrow = () => {

			this.sprite.nameText.scale.x = this.sprite.nameText.scale.y = 1 / game.editor.cameraHolder.scale.x;

			const point = game.editor.container.toGlobal(new PIXI.Point(this.state.cameraObject.x, this.state.cameraObject.y));
			if (game.editor.container.camera) {
				game.editor.container.camera.toScreenPoint(point, point);
			}

			this.cloud.x = point.x;
			this.cloud.y = point.y;

			const screenMargin = 60;
			let insideScreen = true;

			if(this.cloud.x < screenMargin){
				this.cloud.x = screenMargin;
				insideScreen = false;
			}
			if(this.cloud.x > window.innerWidth - screenMargin) {
				this.cloud.x = window.innerWidth - screenMargin;
				insideScreen = false;
			}

			if(this.cloud.y < screenMargin) {
				this.cloud.y = screenMargin;
				insideScreen = false;
			}
			if(this.cloud.y > window.innerHeight - screenMargin) {
				this.cloud.y = window.innerHeight - screenMargin;
				insideScreen = false;
			}

			this.cloud.arrow.clear();

			if(!insideScreen){
				this.cloud.visible = true;

				const fixedCloudSize = cloudSize - 2;
				this.cloud.arrow.lineStyle(4, 0x000000).beginFill(0xFFFFFF);


				const dx = point.x - this.cloud.x;
				const dy = point.y - this.cloud.y;
				const a = Math.atan2(dy, dx);

				const arrowLength = 50;
				this.cloud.arrow.moveTo(fixedCloudSize * Math.cos(a - arrowSpread), fixedCloudSize * Math.sin(a - arrowSpread));
				this.cloud.arrow.lineTo((fixedCloudSize + arrowLength) * Math.cos(a), (fixedCloudSize + arrowLength) * Math.sin(a));
				this.cloud.arrow.lineTo(fixedCloudSize * Math.cos(a + arrowSpread), fixedCloudSize * Math.sin(a + arrowSpread));

				const cameraDX = window.innerWidth / 2 - point.x;
				const cameraDY = window.innerHeight / 2 - point.y;
				const meterInPixels = 130;
				const distanceToCamera = Math.sqrt(cameraDX * cameraDX + cameraDY * cameraDY) / game.editor.cameraHolder.scale.x;
				const distanceInMeters = Math.round(distanceToCamera / meterInPixels);

				if(distanceInMeters < 10000){
					this.cloud.distanceText.text = `${distanceInMeters}m`;
				} else{
					this.cloud.distanceText.text = `9999+`;
				}

			}else{
				const minMargin = 10;
				if(Math.abs(this.state.cameraObject.x - this.state.body.x) < minMargin && Math.abs(this.state.cameraObject.y - this.state.body.y) < minMargin){
					this.cloud.visible = false;
				}else{
					this.cloud.visible = true;
				}
			}
		}

		this.cloud.head = new PIXI.Sprite(this.spriteSheet.textures['Normal_Head_Idle']);
		this.cloud.head.anchor.set(0.5, 0.5);
		this.cloud.addChild(this.cloud.head);
		this.cloud.head.scale.x = this.cloud.head.scale.y = .8;
		this.cloud.head.y = -10;

		const distanceTextStyle = {textColor:'#000', textAlign:'center', fontSize:18, fontName:'Verdana', text:'0m', wordWrap: true, wordWrapWidth: 200};
		this.cloud.distanceText = game.editor.buildTextGraphicFromObj(distanceTextStyle);
		this.cloud.distanceText.anchor.set(0.5, 0.5);
		this.cloud.distanceText.y = 30;
		this.cloud.addChild(this.cloud.distanceText);

		this.cloud.eyeLeft = new PIXI.Sprite(this.spriteSheet.textures['Normal_Eye']);
		this.cloud.eyeLeft.anchor.set(0.5, 0.5);
		this.cloud.eyeRight = new PIXI.Sprite(this.spriteSheet.textures['Normal_Eye']);
		this.cloud.eyeRight.anchor.set(0.5, 0.5);
		this.cloud.mouth = new PIXI.Sprite(this.spriteSheet.textures['Mouth_Idle']);
		this.cloud.mouth.anchor.set(0.5, 0.5);
		this.cloud.head.addChild(this.cloud.eyeLeft, this.cloud.eyeRight, this.cloud.mouth);
		this.cloud.eyeLeft.x = this.sprites.eyeLeft.x;
		this.cloud.eyeLeft.y = this.sprites.eyeLeft.y;
		this.cloud.eyeRight.x = this.sprites.eyeRight.x;
		this.cloud.eyeRight.y = this.sprites.eyeRight.y;
		this.cloud.mouth.x = this.sprites.mouth.x;
		this.cloud.mouth.y = this.sprites.mouth.y;
		this.cloud.scale.x = this.cloud.scale.y = .5;

		game.hudContainer.addChild(this.cloud);
	}

	buildChatBox(){
		this.chatBox = new PIXI.Container();

		this.chatBox.lastChatMessage = 0;
		this.chatBox.alpha = 0;
		
		this.chatBox.bg = new PIXI.Graphics();
		this.chatBox.addChild(this.chatBox.bg);

		this.chatBox.textSprite = new PIXI.Text('', new PIXI.TextStyle({fontFamily:'Montserrat', fontWeight: 400, fontSize: 16, fill: 0x000000, wordWrap: true, wordWrapWidth: 360}))
		this.chatBox.textSprite.resolution = 2;
		this.chatBox.textSprite.anchor.set(0.5, 0.5);
		this.chatBox.addChild(this.chatBox.textSprite);
		
		this.chatBox.setText = text => {
			const textSprite = this.chatBox.textSprite;
			textSprite.text = text;

			if(this.chatBox.emoji) this.chatBox.emoji.destroy();
			delete this.chatBox.emoji;

			let targetSprite = textSprite;
			if(text.startsWith('%%')){
				const num = parseInt(text.split('%%')[1]);
				if(num < Settings.numEmojis){
					textSprite.text = '';
	
					const emojiTexture = PIXI.Texture.from(`emojis00${num.toString().padStart(2, '0')}`);
					this.chatBox.emoji = new PIXI.Sprite(emojiTexture);
					this.chatBox.emoji.anchor.set(0.5, 0.5);
					this.chatBox.emoji.scale.x = this.chatBox.emoji.scale.y = 0.6;
					this.chatBox.addChild(this.chatBox.emoji);
					targetSprite = this.chatBox.emoji;
				}
			}


			this.chatBox.bg.clear();
			this.chatBox.bg.lineStyle(4, 0x000000).beginFill(0xFFFFFF);
			const padding = 10;
			this.chatBox.bg.drawRect(-targetSprite.width / 2 - padding, -targetSprite.height / 2 - padding, targetSprite.width + padding * 2, targetSprite.height + padding * 2);

			this.chatBox.scale.x = this.chatBox.scale.y = 1 / game.editor.cameraHolder.scale.x;

			targetSprite.y = this.chatBox.bg.y = - targetSprite.height / 2 - padding;

			this.chatBox.alpha = 1;
			this.chatBox.lastChatMessage = performance.now();
		}

		this.chatBox.arrow = new PIXI.Graphics().lineStyle(4, 0x000000).beginFill(0xFFFFFF);
		this.chatBox.arrow.y = -2;
		const arrowSpread = 10;
		this.chatBox.addChild(this.chatBox.arrow);

		const arrowLength = 50;
		this.chatBox.arrow.moveTo(-arrowSpread, 0);
		this.chatBox.arrow.lineTo(0, arrowLength);
		this.chatBox.arrow.lineTo(arrowSpread, 0);

		this.chatBox.y = -210;

		this.sprite.addChild(this.chatBox);
	}

	processServerData(data, time){
		if(!this.sprites) return;

		if(this.lastPackageID === -1){
			this.sprite.visible = true;
		}

		let packedExpression = data.expression;
		const eyeBit = Math.floor(packedExpression / 100);
		packedExpression -= eyeBit * 100;
		const mouthBit = Math.floor(packedExpression / 10);

		if(eyeBit === 0){
			this.sprites.eyeLeft.texture = this.spriteSheet.textures['Normal_Eye'];
			this.sprites.eyeRight.texture = this.spriteSheet.textures['Normal_Eye'];
		}else if(eyeBit === 1){
			this.sprites.eyeLeft.texture = this.spriteSheet.textures['Normal_Eye_Closed'];
			this.sprites.eyeRight.texture = this.spriteSheet.textures['Normal_Eye_Closed'];
		}

		if(mouthBit === 0){
			this.sprites.mouth.texture = this.spriteSheet.textures['Mouth_Idle'];
		} else if(mouthBit === 1){
			this.sprites.mouth.texture = this.spriteSheet.textures['Mouth_Pain'];
		} else if(mouthBit === 2){
			this.sprites.mouth.texture = this.spriteSheet.textures['Mouth_Special'];
		}


		const flipped = this.mirror != data.mirror;
		this.mirror = data.mirror;


		const dX = data.main[0].x - this.state.body.x;
		const dY = data.main[0].y - this.state.body.y;
		const d = Math.sqrt(dX * dX + dY * dY);

		const teleport = d > 600;

		this.lastPackageID = data.id;
		this.state.body.ping = this.ping;
		if(this.lastPackageID === -1 || flipped || teleport){
			this.state.body.forcePosition(data.id, data.main[0].x, data.main[0].y, data.main[0].r, data.mirror, time);
			if(data.main[1]){
				this.state.cameraObject.forcePosition(data.id, data.main[1].x, data.main[1].y, data.main[1].r, data.mirror, time);
			} else{
				this.state.cameraObject.forcePosition(data.id, data.main[0].x, data.main[0].y, data.main[0].r, data.mirror, time);
			}
		} else {
			this.state.body.updateServerPosition(data.id, data.main[0].x, data.main[0].y, data.main[0].r, time);
			if(data.main[1]){
				this.state.cameraObject.updateServerPosition(data.id, data.main[1].x, data.main[1].y, data.main[1].r, time);
			} else {
				this.state.cameraObject.updateServerPosition(data.id, data.main[0].x, data.main[0].y, data.main[0].r, time);
			}
		}

		this.stateProcessList.forEach((state, i) => {
			const stateData = data.parts[i];

			state.ping = this.ping;
			if(this.lastPackageID === -1 || flipped || teleport){
				state.forcePosition(data.id, stateData.x, stateData.y, stateData.r, data.mirror, time);
			}else{
				state.updateServerPosition(data.id, stateData.x, stateData.y, stateData.r, time);
			}
		});

		if(data.vehicleParts.length){
			this.vehicle.processServerData(data.vehicleParts, data.id, data.mirror, time);
		}

	}

	setPlayerState(state){
		this.playerState.status = state;
		this.lastStatusChange = 0;

		updateLeaderboard();
	}

	explodePart(sprite){
		const pos = {x :0, y: 0};

		if(this.state.body.serverPos.x === Settings.destroyedPosition && this.state.body.serverPos.y === Settings.destroyedPosition && this.state.body.serverPos.r === 360){
			pos.x = (this.sprite.lastValidPos.x + sprite.lastValidPos.x) / Settings.PTM;
			pos.y = (this.sprite.lastValidPos.y + sprite.lastValidPos.y) / Settings.PTM;
		} else {
			pos.x = (this.sprite.x + sprite.x) / Settings.PTM;
			pos.y = (this.sprite.y + sprite.y) / Settings.PTM;
		}

		emitterManager.playOnceEmitter("gorecloud", null, pos);
		AudioManager.playSFX(['bash1', 'bash2', 'bash3', 'bash4'], 0.3, 1.0+Math.random()*.2-.1, pos);


		// add gore:

		let gorePartName = 'body';
		if(sprite === this.sprites.head) gorePartName = 'head';
		if(sprite === this.sprites.shoulderLeft) gorePartName = 'shoulderLeft';
		if(sprite === this.sprites.shoulderRight) gorePartName = 'shoulderRight';
		if(sprite === this.sprites.armLeft) gorePartName = 'arm_left';
		if(sprite === this.sprites.armRight) gorePartName = 'arm_right';
		if(sprite === this.sprites.handLeft) gorePartName = 'hand_left';
		if(sprite === this.sprites.handRight) gorePartName = 'hand_right';
		if(sprite === this.sprites.belly) gorePartName = 'belly';
		if(sprite === this.sprites.thighLeft) gorePartName = 'thigh_left';
		if(sprite === this.sprites.thighRight) gorePartName = 'thigh_right';
		if(sprite === this.sprites.legLeft) gorePartName = 'leg_left';
		if(sprite === this.sprites.legRight) gorePartName = 'leg_right';
		if(sprite === this.sprites.feetLeft) gorePartName = 'feet_left';
		if(sprite === this.sprites.feetRight) gorePartName = 'feet_right';

		const velocity = new Box2D.b2Vec2(this.sprite.velocity.x / 1000, this.sprite.velocity.y / 1000);
		generateGoreParticles(gorePartName, this.sprite, pos, sprite.rotation, velocity, false, -1);
	}

	interpolatePosition(){
		if(!this.sprites) return;

		this.stateKeys.forEach(key => {
			this.state[key].interpolatePosition();
		});

		// apply positions
		this.sprite.velocity.x = this.state.body.x - this.sprite.x;
		this.sprite.velocity.y = this.state.body.y - this.sprite.y;

		const wasVisible = this.sprites.body.visible;
		this.sprites.body.visible = !(this.state.body.serverPos.x === Settings.destroyedPosition && this.state.body.serverPos.y === Settings.destroyedPosition && this.state.body.serverPos.r === 360);
		if(wasVisible && !this.sprites.body.visible){
			this.sprite.lastValidPos = this.sprites.body.lastValidPos = {x: this.sprite.x, y: this.sprite.y};
			this.spriteProcessList.forEach(sprite => {
				sprite.lastValidPos = {x: sprite.x, y: sprite.y};
			});
			this.explodePart(this.sprites.body)
		}

		if(this.sprites && this.sprites.body) this.sprites.body.angle = this.state.body.r;

		this.spriteProcessList.forEach((sprite, i) => {
			const state = this.stateProcessList[i];

			const wasSpriteVisible = sprite.visible;
			sprite.visible = !(state.serverPos.x === Settings.destroyedPosition && state.serverPos.y === Settings.destroyedPosition && state.serverPos.r === 360);
			if(wasSpriteVisible && !sprite.visible){
				this.explodePart(sprite)
			}

			sprite.x = state.x;
			sprite.y = state.y;
			sprite.angle = state.r;
			sprite.scale.x = state.mirror ? -1 : 1;
		});

		// we must do this afterwards else we cant explode in right place
		this.sprite.x = this.state.body.x;
		this.sprite.y = this.state.body.y;
		this.sprites.body.scale.x = this.state.body.mirror ? -1 : 1;

		// correct IK
		this.vehicle.interpolatePosition();

		this.cloud.arrow.fixArrow();

		if(this.playerState.status){
			this.lastStatusChange += game.editor.deltaTime;
			if(this.lastStatusChange > 3000){
				this.setPlayerState(0);
			}
		}

		// update chatbox
		if(performance.now() > this.chatBox.lastChatMessage + Settings.chatBlurTimeout && this.chatBox.alpha > 0){
			this.chatBox.alpha = this.chatBox.alpha - 0.05;
		}
	}

	clear(){
		if(this.cloud){
			this.cloud.destroy();
		}
	}
}

const maxPreviousPosInterpolation = 10;
const syncSmooth = .2;

export class SyncObject {
	constructor(x = 0, y = 0, r = 0) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.overflow = false;
		this.mirror = false;
		this.ping = 0;
		this.previousPos = [];
		this.serverId = -1;
		this.serverTime = 0;
		this.serverPos = {
			x,
			y,
			r,
			time: -1,
		}
		this.targetPos = {
			x,
			y,
			r,
		}
	}

	forcePosition(id, x, y, r, mirror) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.mirror = mirror;
		this.previousPos = [];
		this.serverId = id;
		this.serverPos = {
			x,
			y,
			r
		}
		this.targetPos = {
			x,
			y,
			r,
		}
	}

	updateServerPosition(id, x, y, r, time) {
		// ids go from 0 - 255, so when the id goes from 255 to 0 we still want to process it as a new id
		// consider here extrapolation
		if (id > this.serverId || this.serverId - id > 100) {
			if (this.serverPos.time > 0) {
				this.previousPos.push({...this.serverPos});
				if (this.previousPos.length > maxPreviousPosInterpolation) {
					this.previousPos.shift();
				}
			}
			this.serverPos = {
				x,
				y,
				r,
				time
			}
			this.serverId = id;
			this.serverTime = time;
		}else{
			console.log("DROP ID:", id, 'MY ID:', this.serverId);
		}
	}

	angleDiff(sourceA, targetA) {
		const mod = (a, n) => a - Math.floor(a/n) * n;
		let a = targetA - sourceA
		return mod(a + 180, 360) - 180
	}


	estimateFuturePositions (){
		const positions = [];

		const x1 = this.serverPos.x;
		const y1 = this.serverPos.y;
		const r1 = this.serverPos.r;

		const pos = {};
		pos.x = x1;
		pos.y = y1;
		pos.r = r1;

		// can we do magic here?

		positions.push(pos);

		return pos;
	}

	interpolatePosition() {
		// use time difference for interpolation
		// no data no interpolation
		if(this.previousPos.length < 2) return;

		const pos = this.estimateFuturePositions();

		this.x += (pos.x - this.x) * syncSmooth;
		this.y += (pos.y - this.y) * syncSmooth;
		this.r += this.angleDiff(this.r, pos.r) * syncSmooth;
	}
}

export const multiplayerAtlas = {"frames": {

	"Bicycle_Body":
	{
		"frame": {"x":315,"y":1,"w":187,"h":149},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":187,"h":149},
		"sourceSize": {"w":187,"h":149}
	},
	"Bicycle_Pedals":
	{
		"frame": {"x":903,"y":356,"w":34,"h":34},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":34,"h":34},
		"sourceSize": {"w":34,"h":34}
	},
	"Bicycle_WheelBack":
	{
		"frame": {"x":116,"y":219,"w":114,"h":114},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":114,"h":114},
		"sourceSize": {"w":114,"h":114}
	},
	"Bicycle_WheelBack_Bended":
	{
		"frame": {"x":231,"y":280,"w":117,"h":79},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":117,"h":79},
		"sourceSize": {"w":117,"h":79}
	},
	"Bicycle_WheelFront":
	{
		"frame": {"x":1,"y":219,"w":114,"h":114},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":114,"h":114},
		"sourceSize": {"w":114,"h":114}
	},
	"Bicycle_WheelFront_Bended":
	{
		"frame": {"x":823,"y":276,"w":117,"h":79},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":117,"h":79},
		"sourceSize": {"w":117,"h":79}
	},
	"DirtBikeHelmet":
	{
		"frame": {"x":942,"y":1,"w":79,"h":92},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":79,"h":92},
		"sourceSize": {"w":79,"h":92}
	},
	"DirtBike_Axis":
	{
		"frame": {"x":773,"y":306,"w":41,"h":74},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":41,"h":74},
		"sourceSize": {"w":41,"h":74}
	},
	"DirtBike_Body":
	{
		"frame": {"x":1,"y":1,"w":313,"h":160},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":313,"h":160},
		"sourceSize": {"w":313,"h":160}
	},
	"DirtBike_WheelBack":
	{
		"frame": {"x":444,"y":158,"w":128,"h":128},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":128,"h":128},
		"sourceSize": {"w":128,"h":128}
	},
	"DirtBike_WheelBack_Bended":
	{
		"frame": {"x":573,"y":220,"w":127,"h":97},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":127,"h":97},
		"sourceSize": {"w":127,"h":97}
	},
	"DirtBike_WheelFront":
	{
		"frame": {"x":315,"y":151,"w":128,"h":128},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":128,"h":128},
		"sourceSize": {"w":128,"h":128}
	},
	"DirtBike_WheelFront_Bended":
	{
		"frame": {"x":701,"y":220,"w":121,"h":85},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":121,"h":85},
		"sourceSize": {"w":121,"h":85}
	},
	"DirtBike_WheelSupport":
	{
		"frame": {"x":446,"y":318,"w":137,"h":49},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":137,"h":49},
		"sourceSize": {"w":137,"h":49}
	},
	"Hammer":
	{
		"frame": {"x":573,"y":164,"w":272,"h":55},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":272,"h":55},
		"sourceSize": {"w":272,"h":55}
	},
	"Hammer_2":
	{
		"frame": {"x":1,"y":162,"w":289,"h":56},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":289,"h":56},
		"sourceSize": {"w":289,"h":56}
	},
	"Mouth_Idle":
	{
		"frame": {"x":859,"y":356,"w":43,"h":31},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":43,"h":31},
		"sourceSize": {"w":43,"h":31}
	},
	"Mouth_Pain":
	{
		"frame": {"x":185,"y":334,"w":43,"h":31},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":43,"h":31},
		"sourceSize": {"w":43,"h":31}
	},
	"Mouth_Special":
	{
		"frame": {"x":815,"y":356,"w":43,"h":31},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":43,"h":31},
		"sourceSize": {"w":43,"h":31}
	},
	"Normal_Arm":
	{
		"frame": {"x":231,"y":219,"w":36,"h":58},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":36,"h":58},
		"sourceSize": {"w":36,"h":58}
	},
	"Normal_Belly":
	{
		"frame": {"x":584,"y":318,"w":84,"h":48},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":84,"h":48},
		"sourceSize": {"w":84,"h":48}
	},
	"Normal_Core":
	{
		"frame": {"x":846,"y":164,"w":122,"h":111},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":122,"h":111},
		"sourceSize": {"w":122,"h":111}
	},
	"Normal_Eye":
	{
		"frame": {"x":942,"y":131,"w":23,"h":23},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":23,"h":23},
		"sourceSize": {"w":23,"h":23}
	},
	"Normal_Eye_Closed":
	{
		"frame": {"x":268,"y":256,"w":23,"h":23},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":23,"h":23},
		"sourceSize": {"w":23,"h":23}
	},
	"Normal_Feet":
	{
		"frame": {"x":446,"y":287,"w":62,"h":22},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":62,"h":22},
		"sourceSize": {"w":62,"h":22}
	},
	"Normal_Hand":
	{
		"frame": {"x":268,"y":219,"w":40,"h":36},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":40,"h":36},
		"sourceSize": {"w":40,"h":36}
	},
	"Normal_Head_Idle":
	{
		"frame": {"x":349,"y":287,"w":96,"h":96},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":96,"h":96},
		"sourceSize": {"w":96,"h":96}
	},
	"Normal_Leg":
	{
		"frame": {"x":969,"y":183,"w":50,"h":72},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":50,"h":72},
		"sourceSize": {"w":50,"h":72}
	},
	"Normal_Shoulder":
	{
		"frame": {"x":142,"y":334,"w":42,"h":70},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":42,"h":70},
		"sourceSize": {"w":42,"h":70}
	},
	"Normal_Thigh":
	{
		"frame": {"x":969,"y":94,"w":54,"h":88},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":54,"h":88},
		"sourceSize": {"w":54,"h":88}
	},
	"Pot":
	{
		"frame": {"x":801,"y":1,"w":140,"h":162},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":140,"h":162},
		"sourceSize": {"w":140,"h":162}
	},
	"Pot_2":
	{
		"frame": {"x":660,"y":1,"w":140,"h":162},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":140,"h":162},
		"sourceSize": {"w":140,"h":162}
	},
	"SkateBoard_Board":
	{
		"frame": {"x":1,"y":334,"w":140,"h":32},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":140,"h":32},
		"sourceSize": {"w":140,"h":32}
	},
	"SkateHelmet":
	{
		"frame": {"x":941,"y":276,"w":79,"h":90},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":79,"h":90},
		"sourceSize": {"w":79,"h":90}
	},
	"Skateboard_Wheel":
	{
		"frame": {"x":823,"y":220,"w":21,"h":21},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":21,"h":21},
		"sourceSize": {"w":21,"h":21}
	},
	"YogaBall":
	{
		"frame": {"x":503,"y":1,"w":156,"h":156},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":156,"h":156},
		"sourceSize": {"w":156,"h":156}
	},
	"YogaBallHandle_Back":
	{
		"frame": {"x":291,"y":162,"w":16,"h":36},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":16,"h":36},
		"sourceSize": {"w":16,"h":36}
	},
	"YogaBall_Handle_Front":
	{
		"frame": {"x":942,"y":94,"w":18,"h":36},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":18,"h":36},
		"sourceSize": {"w":18,"h":36}
	},
	"profile":
	{
		"frame": {"x":701,"y":306,"w":71,"h":71},
		"rotated": false,
		"trimmed": false,
		"spriteSourceSize": {"x":0,"y":0,"w":71,"h":71},
		"sourceSize": {"w":71,"h":71}
	}},
	"meta": {
		"app": "Adobe Animate",
		"version": "21.0.7.42652",
		"image": "Multiplayer_Character.png",
		"format": "RGBA8888",
		"size": {"w":1024,"h":1024},
		"scale": "1"
	}
}
