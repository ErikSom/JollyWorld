import * as PrefabManager from '../PrefabManager'
import { SharpObject } from './SharpObject';

import {
    game
} from "../../Game";

class Spikes extends SharpObject {
    constructor(target) {
        super(target);
    }
}

PrefabManager.prefabLibrary.Spikes = {
    json: '{"objects":[[0,-0.14583333333333293,0.10416666666666616,0,".spike","sharpBody",0,"#999999","#000",0,false,true,[{"x":-2.333333333333332,"y":1.7083333333333321},{"x":-2.333333333333332,"y":-1.7083333333333321},{"x":2.333333333333332,"y":-1.7083333333333321},{"x":2.333333333333332,"y":1.7083333333333321}],1,0,null,"",1],[1,-4.3749999999999805,-6.874999999999901,0,".spike","sharpTexture",1,"Spikes0000",0,9.999999999999886,1.570796326794896,0,false,"#FFFFFF"]]}',
    class: Spikes,
    library: PrefabManager.LIBRARY_WEAPON  ,
}