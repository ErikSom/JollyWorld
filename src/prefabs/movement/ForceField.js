
import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";


class ForceField extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);
		this.forceField = this.lookupObject['forcefield_body'];
		this.forceField.myTileSprite.fixTextureRotation = true;
		console.log(this.forceField);
    }
    init() {
		super.init();
		this.setDirection(this.prefabObject.settings.direction);
		this.setDisableGravity(this.prefabObject.settings.disableGravity);
		this.disableGravity = this.prefabObject.settings.disableGravity;
		this.direction = this.prefabObject.settings.direction;
		this.force = this.prefabObject.settings.force;

	}
	setDirection(direction){
		this.forceField.myTileSprite.fixedTextureRotationOffset = direction*game.editor.DEG2RAD;
		this.forceField.myTileSprite.updateMeshVerticeRotation(true);
	}
	setDisableGravity(disabled){
		if(disabled) this.forceField.myTileSprite.tint = 0x00d8ff;
		else this.forceField.myTileSprite.tint = 0xffd200;
	}
	set(property, value) {
		console.log(property, value);
		super.set(property, value);
        switch (property) {
            case 'direction':
                this.setDirection(value);
				break;
			case 'disableGravity':
				this.setDisableGravity(value);
				break;
        }
	}
	initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.BeginContact = function (contact) {
        }
        this.contactListener.EndContact = function (contact) {
		}
		this.contactListener.PostSolve = function (contact, impulse) {
		}
	}

    update() {
	}
}

ForceField.settings = Object.assign({}, ForceField.settings, {
    "disableGravity": true,
	"direction": 0,
	"force": 3.0,
	"width": 200,
	"height": 200,
});
ForceField.settingsOptions = Object.assign({}, ForceField.settingsOptions, {
	"disableGravity": true,
	"direction": {
        min: 0.0,
        max: 360.0,
        step: 1.0
    },
    "force": {
        min: 0.0,
        max: 20.0,
        step: 0.1
	},
});


PrefabManager.prefabLibrary.ForceField = {
    json: '{"objects":[[0,0,0,0,"forcefield","forcefield_body",0,["#FFFFFF"],["#FFFFFF"],[0.6],true,true,[[{"x":-3.3230424036184223,"y":3.319249149419366},{"x":-3.3230424036184223,"y":-3.3192491494193646},{"x":3.3230424036184223,"y":-3.3192491494193646},{"x":3.3230424036184223,"y":3.319249149419366}]],[1],2,[0],"TileArrow.jpg",[0]]]}',
    class: ForceField,
    library: PrefabManager.LIBRARY_MOVEMENT
}
