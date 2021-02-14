import * as PrefabManager from '../PrefabManager'
import { Explosive } from './Explosive';
import * as emitterManager from '../../utils/EmitterManager';

import {
    game
} from "../../Game";

class Grenade extends Explosive {
    constructor(target) {
        super(target);
    }
    init() {
		this.setActive(this.prefabObject.settings.active);
        super.init();
	}
	explode(){
		if(this.exploded) return;

		this.explodeTarget = this.lookupObject['grenadeBody'];
		super.explode();

		const pos = this.explodeTarget.GetPosition();
		emitterManager.playOnceEmitter("explosion_layer1", this.explodeTarget, pos, 0);
		emitterManager.playOnceEmitter("explosion_layer2", this.explodeTarget, pos, 0);
		this.destroy();
	}
	setActive(active){
		super.setActive(active);
		const grenadeTexture = this.lookupObject['grenadeTexture'];
		if(active){
			grenadeTexture.originalSprite.texture = PIXI.Texture.from(grenadeTexture.data.textureName.replace("off", "on"));
		}else{
			grenadeTexture.originalSprite.texture = PIXI.Texture.from(grenadeTexture.data.textureName.replace("on", "off"));
		}
	}
	set(property, value) {
		super.set(property, value);
        switch (property) {
            case 'active':
                this.setActive(value);
                break;
        }
    }
}

PrefabManager.prefabLibrary.Grenade = {
    json: '{"objects":[[0,0,0.00535623816714359,0,"grenade","grenadeBody",0,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],0,[12],"",[1]],[1,-4.238888270312005,-5.835413907232784,0,"grenade","grenadeTexture",1,"Grenade_off0000",0,7.343119336967593,2.186165349948268,0,false,"#FFFFFF",1,1,1]]}',
    class: Grenade,
    library: PrefabManager.LIBRARY_WEAPON,
}
