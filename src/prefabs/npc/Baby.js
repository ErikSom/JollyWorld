import * as PrefabManager from '../PrefabManager';
import {NPC} from './NPC'
import {BabyHumanoid} from '../humanoids/BabyHumanoid'

class Baby extends NPC {
    constructor(target) {
        super(target);
    }
}

Baby.settingsOptions = Object.assign({}, Baby.settingsOptions, {
    "skin": {
        min: 1.0,
        max: 2.0,
        step: 1.0
	},
});

PrefabManager.prefabLibrary.Baby = {
    json: BabyHumanoid.JSON_BABY,
    class: Baby,
    library: PrefabManager.LIBRARY_CHARACTERS
}
