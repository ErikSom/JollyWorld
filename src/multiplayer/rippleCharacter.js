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

		this.vehicle = new RippleVehicle(this.sprite);
	}

	loadSkin(url){
		const texture = PIXI.Texture.from(url);
		this.spriteSheet = new PIXI.Spritesheet(texture, multiplayerAtlas);
		this.spriteSheet.parse(()=>{
			this.buildSprite();
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
			this.chatBox.bg.clear();
			this.chatBox.bg.lineStyle(4, 0x000000).beginFill(0xFFFFFF);
			const padding = 10;
			this.chatBox.bg.drawRect(-textSprite.width / 2 - padding, -textSprite.height / 2 - padding, textSprite.width + padding * 2, textSprite.height + padding * 2);

			this.chatBox.scale.x = this.chatBox.scale.y = 1 / game.editor.cameraHolder.scale.x;

			textSprite.y = this.chatBox.bg.y = - textSprite.height / 2 - padding;

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

	interpolatePosition() {
		// use time difference for interpolation
		// no data no interpolation
		if(this.previousPos.length < 2) return;

		const previousKnownPosition = this.previousPos[this.previousPos.length - 2];

		const lookForward = 0;
		let render_timestamp = performance.now() + lookForward;

		const x0 = previousKnownPosition.x;
		const x1 = this.serverPos.x;
		const y0 = previousKnownPosition.y;
		const y1 = this.serverPos.y;
		const r0 = previousKnownPosition.r;
		const r1 = this.serverPos.r;
		const t0 = previousKnownPosition.time;
		const t1 = this.serverPos.time;

		let td = (t1 - t0);

		const maxExtrapolation = this.ping + Settings.maxExtrapolation;
		const overFlowTime = render_timestamp - this.serverPos.time;

		const didOverflow = overFlowTime > maxExtrapolation;

		if(!this.overflow && didOverflow){
			render_timestamp = this.serverPos.time + maxExtrapolation;
			// show lag thingy?
		}

		if(td === 0){
			// i messed up?
			// debugger;
		}else{
			const interpolationTime = render_timestamp - t0;
			this.targetPos.x =	x0 + ((x1 - x0) / td) * interpolationTime;
			this.targetPos.y =	y0 + ((y1 - y0) / td) * interpolationTime;
			if(!didOverflow || !this.overflow) this.targetPos.r = (r0 + (this.angleDiff(r0, r1) / td) * interpolationTime) % 360;
		}

		this.x += (this.targetPos.x - this.x) * syncSmooth;
		this.y += (this.targetPos.y - this.y) * syncSmooth;
		this.r += this.angleDiff(this.r, this.targetPos.r) * syncSmooth;
	}
}

export const multiplayerAtlas = {
	"frames": {
		"Mouth_Idle":
		{
			"frame": {"x":156,"y":199,"w":43,"h":31},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":43,"h":31},
			"sourceSize": {"w":43,"h":31}
		},
		"Mouth_Pain":
		{
			"frame": {"x":108,"y":205,"w":43,"h":31},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":43,"h":31},
			"sourceSize": {"w":43,"h":31}
		},
		"Mouth_Special":
		{
			"frame": {"x":208,"y":185,"w":43,"h":31},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":43,"h":31},
			"sourceSize": {"w":43,"h":31}
		},
		"Normal_Arm":
		{
			"frame": {"x":208,"y":125,"w":36,"h":58},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":36,"h":58},
			"sourceSize": {"w":36,"h":58}
		},
		"Normal_Belly":
		{
			"frame": {"x":156,"y":75,"w":84,"h":48},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":84,"h":48},
			"sourceSize": {"w":84,"h":48}
		},
		"Normal_Core":
		{
			"frame": {"x":2,"y":2,"w":122,"h":111},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":122,"h":111},
			"sourceSize": {"w":122,"h":111}
		},
		"Normal_Eye":
		{
			"frame": {"x":126,"y":75,"w":23,"h":23},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":23,"h":23},
			"sourceSize": {"w":23,"h":23}
		},
		"Normal_Eye_Closed":
		{
			"frame": {"x":201,"y":218,"w":23,"h":23},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":23,"h":23},
			"sourceSize": {"w":23,"h":23}
		},
		"Normal_Feet":
		{
			"frame": {"x":44,"y":213,"w":62,"h":22},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":62,"h":22},
			"sourceSize": {"w":62,"h":22}
		},
		"Normal_Hand":
		{
			"frame": {"x":2,"y":213,"w":40,"h":36},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":40,"h":36},
			"sourceSize": {"w":40,"h":36}
		},
		"Normal_Head_Idle":
		{
			"frame": {"x":2,"y":115,"w":96,"h":96},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":96,"h":96},
			"sourceSize": {"w":96,"h":96}
		},
		"Normal_Leg":
		{
			"frame": {"x":156,"y":125,"w":50,"h":72},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":50,"h":72},
			"sourceSize": {"w":50,"h":72}
		},
		"Normal_Shoulder":
		{
			"frame": {"x":199,"y":2,"w":42,"h":70},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":42,"h":70},
			"sourceSize": {"w":42,"h":70}
		},
		"Normal_Thigh":
		{
			"frame": {"x":100,"y":115,"w":54,"h":88},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":54,"h":88},
			"sourceSize": {"w":54,"h":88}
		},
		"profile":
		{
			"frame": {"x":126,"y":2,"w":71,"h":71},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {"x":0,"y":0,"w":71,"h":71},
			"sourceSize": {"w":71,"h":71}
		}
	},
	"meta": {
		"app": "Adobe Animate",
		"version": "21.0.7.42652",
		"image": "Multiplayer_Character.png",
		"format": "RGBA8888",
		"size": {"w":256,"h":256},
		"scale": "1"
	}
}
