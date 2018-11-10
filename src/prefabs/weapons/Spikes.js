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
    json: '{"objects":[[0,-0.017553874552765074,0.008526635933739007,0,"spike","sharpBody",0,"#999999","#000",0,false,true,[{"x":-2.3049824736225455,"y":1.4964284121947404},{"x":-2.3049824736225455,"y":-1.4964284121947413},{"x":2.304982473622545,"y":-1.4964284121947413},{"x":2.304982473622545,"y":1.4964284121947404}],1,2,null,"",1],[0,-0.011519889019721945,1.8006203392476015,0,"spike","spikeFloor",1,"#999999","#000",0,false,true,[{"x":-2.5282399383451475,"y":0.2715293489869488},{"x":-2.5282399383451475,"y":-0.2715293489869488},{"x":2.5282399383451475,"y":-0.2715293489869488},{"x":2.5282399383451475,"y":0.2715293489869488}],1,0,null,"",1],[1,0.006551139790375582,0.5248857212882672,0,"spike","sharpTexture",2,"Spikes0000",0,0.597222799982063,-0.4673961536525235,0,false,"#FFFFFF"],[2,-0.5266162365829203,47.32088623574992,0,"spike","",3,1,0,0,false,false,1,10,true,0,0,0,0,0,0]]}',
    class: Spikes,
    library: PrefabManager.LIBRARY_WEAPON  ,
}