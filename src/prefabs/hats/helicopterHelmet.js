import Hat from './hat'
import { Sprite } from 'pixi.js';
import { Settings } from '../../Settings';
import {
	game
} from "../../Game";
import { crawlJointsUtility } from '../level/Finish';
import { b2MulVec2 } from '../../../libs/debugdraw';
import setTint from '../../utils/setTint';

const BOOSTING_TICKS = 100;
const BOOSTING_COOLDOWN_TICKS = 180;

const FLASH_TICKS = 24;

const vec1 = new Box2D.b2Vec2();
const vec2 = new Box2D.b2Vec2();

export class HelicopterHelmet extends Hat {
	constructor(character, head, body){
		super(character, head, body);
		this.texture = "HelicopterHelmet0000";
		this.hatOffsetLength = 20;
		this.hatOffsetAngle = 1.2;
		this.heliSprite = null;
		this.boosting = 0;
		this.boostingBodies = [];
		this.boostingCooldown = 0;
		this.frameSwitch = 0;
		this.currentFlashTicks = 0;
		this.attach();
	}

	attach(){
		super.attach();

		this.heliSprite = new Sprite(PIXI.Texture.from("HelicopterHelmet_Heli0000"));
		this.hatBody.myTexture.originalSprite.addChild(this.heliSprite);
		this.heliSprite.x = -13;
		this.heliSprite.y = -14;

		const hatSprite = new Sprite(PIXI.Texture.from("HelicopterHelmet0000"));
		this.hatBody.myTexture.originalSprite.addChild(hatSprite);
	}

	activate(){
		if(this.boosting <= 0 && this.boostingCooldown <= 0){
			this.boosting = BOOSTING_TICKS;
			this.boostingCooldown = BOOSTING_COOLDOWN_TICKS;

			const body = this.character.lookupObject['body'];
		   	this.boostingBodies = crawlJointsUtility(body, ()=>true);
			this.boostingBodies.push(body);
		}
	}

	update(){
		if(this.boosting){
			this.frameSwitch++;
			if(this.frameSwitch === 2){
				if(this.heliSprite.texture.textureCacheIds[0].indexOf('0001') > 0){
					this.heliSprite.texture = PIXI.Texture.from('HelicopterHelmet_Heli0002');
				}else{
					this.heliSprite.texture = PIXI.Texture.from('HelicopterHelmet_Heli0001');
				}
				this.frameSwitch = 0;
			}

			const force = 36 / Settings.timeStep * game.editor.deltaTime;
			const body = this.character.lookupObject['head'];
			const hatAngle = body.GetAngle()-Settings.pihalve;
			const dirForce = vec1;
			dirForce.Set(Math.cos(hatAngle), Math.sin(hatAngle));
			b2MulVec2(dirForce, force)
			this.boostingBodies.forEach(body => {
                body.ApplyForce(dirForce, body.GetPosition(), true);
			})

			this.boosting--;
		}else{
			if(this.heliSprite.texture.textureCacheIds[0].indexOf('0000') < 0){
				this.heliSprite.texture = PIXI.Texture.from('HelicopterHelmet_Heli0000');
			}
			this.boostingCooldown--;
			if(this.boostingCooldown === 0){
				this.currentFlashTicks = FLASH_TICKS
			}
		}

		if(this.currentFlashTicks){
			const flashProgress = this.currentFlashTicks / FLASH_TICKS;
			setTint(this.hatBody.myTexture, 0xFFFFFF, flashProgress*flashProgress);
			this.currentFlashTicks--;
		}else if(this.hatBody.myTexture.activeCM){
			this.hatBody.myTexture.filters = this.hatBody.myTexture.filters.filter(cm => cm !== this.hatBody.myTexture.activeCM);
		}

	}
}
