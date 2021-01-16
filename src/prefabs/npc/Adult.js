import * as PrefabManager from '../PrefabManager';
import {NPC} from './NPC'
import {Humanoid} from '../humanoids/Humanoid'

class Adult extends NPC {
    constructor(target) {
        super(target);
    }
}
PrefabManager.prefabLibrary.Adult = {
    json: Humanoid.JSON_ADULT,
    class: Adult,
    library: PrefabManager.LIBRARY_CHARACTERS
}
