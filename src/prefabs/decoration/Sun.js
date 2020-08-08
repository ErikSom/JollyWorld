

import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";

import {globalEvents, GLOBAL_EVENTS} from '../../utils/EventDispatcher'

class Sun extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);
		this.damageReceived = 0;
		this.damageResetTimer = 0;
    }
    init() {
		super.init();

		this.lookAtDamageFunction = this.lookAtDamage.bind(this);
		globalEvents.addEventListener(GLOBAL_EVENTS.CHARACTER_DAMAGE, this.lookAtDamageFunction)
		this.sunTexture = this.lookupObject["sunTexture"];
	}
	lookAtDamage(event){
		const damage = event.data;
		this.damageReceived += damage;
		const minimumShockDamage = 30;
		if(this.damageReceived > minimumShockDamage){
			this.setSunTexture('Sun_ouch');
		}else{
			this.setSunTexture('Sun_smerk');
		}
		this.damageResetTimer = 1000;
	}
    update() {
		super.update();
		this.damageResetTimer -= game.editor.deltaTime
		if(this.damageResetTimer<=0){
			this.damageReceived = 0;
			this.setSunTexture('Sun');
		}
	}
	setSunTexture(texture){
		this.sunTexture.children[0].texture = PIXI.Texture.fromFrame(texture+'0000');
	}
	reset(){
		globalEvents.removeEventListener(GLOBAL_EVENTS.CHARACTER_DAMAGE, this.lookAtDamageFunction)
	}
}

PrefabManager.prefabLibrary.Sun = {
    json: '{"objects":[[1,0,3.413090387086403,0,"sun","sunTexture",0,"Sun0000",null,null,null,null,false,"#FFFFFF",1,1,1,0.95,0,0]]}',
    class: Sun,
    library: PrefabManager.LIBRARY_DECORATION
}
