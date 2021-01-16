import * as PrefabManager from '../PrefabManager';
import {Humanoid} from '../humanoids/Humanoid'

class AdultNPC extends Humanoid {
    constructor(target) {
        super(target);
    }
}
PrefabManager.prefabLibrary.Adult = {
    json: Humanoid.JSON_ADULT,
    class: AdultNPC,
    library: PrefabManager.LIBRARY_CHARACTERS
}
