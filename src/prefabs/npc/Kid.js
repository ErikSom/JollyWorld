import * as PrefabManager from '../PrefabManager';
import {NPC} from './NPC'
import {KidHumanoid} from '../humanoids/KidHumanoid'

class Kid extends NPC {
    constructor(target) {
        super(target);
    }
}

delete Kid.settingsOptions.skin

PrefabManager.prefabLibrary.Kid = {
    json: KidHumanoid.JSON_KID,
    class: Kid,
    library: PrefabManager.LIBRARY_CHARACTERS
}
