import * as PrefabManager from '../PrefabManager';
import {NPC} from './NPC'
import {KidHumanoid} from '../humanoids/KidHumanoid'

class Kid extends NPC {
    constructor(target) {
        super(target);
    }
}
Kid.settingsOptions = Object.assign({}, Kid.settingsOptions, {
    "skin": {
        min: 1.0,
        max: 3.0,
        step: 1.0
	},
});

PrefabManager.prefabLibrary.Kid = {
    json: KidHumanoid.JSON_KID,
    class: Kid,
    library: PrefabManager.LIBRARY_CHARACTERS
}
