
import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import {RopeHat} from '../hats/ropeHat'
import {DirtBikeHelmet} from '../hats/dirtBikeHelmet'
import {SkateHelmet} from '../hats/skateHelmet'
import {HelicopterHelmet} from '../hats/helicopterHelmet'
import { Sprite } from 'pixi.js';

const HAT_TYPES = {
	ROPE:'Rope',
	DIRTBIKEHELMET:'DirtBike',
	SKATE:'Skate',
	HELICOPTER:'Helicopter',
}
const HAT_VISUAL_OFFSET = {
    [HAT_TYPES.ROPE]:-75,
    [HAT_TYPES.DIRTBIKEHELMET]: 0,
    [HAT_TYPES.SKATE]: 0,
    [HAT_TYPES.HELICOPTER]: 0,
}

const HAT_TYPES_ARR = Object.values(HAT_TYPES);

const hatTypeToClass = {
    [HAT_TYPES.ROPE]:RopeHat,
	[HAT_TYPES.DIRTBIKEHELMET]:DirtBikeHelmet,
	[HAT_TYPES.SKATE]:SkateHelmet,
	[HAT_TYPES.HELICOPTER]:HelicopterHelmet,
}

class HatUpgrade extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
        this.hatType = HAT_TYPES.ROPE;
        this.shouldUpgrade = null;
        this.hatBody = this.lookupObject['hatBody'];
        this.extraSprites = [];
    }
    init() {
        super.init();
		this.setHatType(this.prefabObject.settings.hatType || HAT_TYPES.ROPE);
        this.hatBody.GetFixtureList().SetSensor(true);
    }
    update() {
        super.update();
        if(this.shouldUpgrade){
			this.shouldUpgrade.setHat(hatTypeToClass[this.hatType]);
			this.destroy();
		}
    }
    set(property, value) {
		super.set(property, value);
        switch (property) {
            case 'hatType':
                this.setHatType(value);
                break;
        }
    }

    setHatType(type){

        if(this.extraSprites.length){
            this.extraSprites.forEach(sprite => sprite.destroy());
            this.extraSprites.length = 0;;
        }

        this.hatType = type;
        this.hatBody.myTexture.originalSprite.texture = PIXI.Texture.from(type+'Helmet0000');
        this.hatBody.myTexture.originalSprite.y = HAT_VISUAL_OFFSET[type];

        if(type === HAT_TYPES.HELICOPTER){
            const heliSprite = new Sprite(PIXI.Texture.from("HelicopterHelmet_Heli0000"));
            this.hatBody.myTexture.originalSprite.addChild(heliSprite);
            heliSprite.x = -13;
            heliSprite.y = -14;

            const hatSprite = new Sprite(PIXI.Texture.from("HelicopterHelmet0000"));
            this.hatBody.myTexture.originalSprite.addChild(hatSprite);
            this.extraSprites.push(heliSprite, hatSprite);
        }

    }

    initContactListener() {
        super.initContactListener();
        this.contactListener.BeginContact = contact => {
			if(this.shouldDestroy) return;

            const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            const body = bodies[0].mainCharacter ? bodies[0] : bodies[1];
            if(body.mainCharacter){
				const characterClass = game.editor.retrieveSubClassFromBody(body);
				this.shouldUpgrade = characterClass;
            }
        }
    }
}

HatUpgrade.settings = Object.assign({}, HatUpgrade.settings, {
    "hatType": HAT_TYPES.ROPE,
});
HatUpgrade.settingsOptions = Object.assign({}, HatUpgrade.settingsOptions, {
    "hatType": HAT_TYPES_ARR
});


PrefabManager.prefabLibrary.HatUpgrade = {
    json: '{"objects":[[0,0,0,0,"hatUpgrade","hatBody",0,["#999999"],["#000"],[0],true,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],0,[63.579923817390195],"",[1]],[1,0,0,0,"hatUpgrade","hatTexture",1,"RopeHelmet0000",0,0,0,0,false,"#FFFFFF",1,1,1,0,0,0]]}',
    class: HatUpgrade,
    library: PrefabManager.LIBRARY_MOVEMENT
}
