import * as PrefabManager from '../PrefabManager'
import { SharpObject } from './SharpObject';
import * as Box2D from '../../../libs/Box2D';

import {
    game
} from "../../Game";

class Axe extends SharpObject {
    constructor(target) {
        super(target);
    }
    init() {
		super.init();

		this.extent = 2.0;
		this.width = 1.6;
        this.spread = 0.6;
		this.angleCorrection = -90;
        this.offsetWidth = 0.2;
        this.maxEntryAngle = 50;
        this.twoSided = true;
    }
}

PrefabManager.prefabLibrary.Axe = {
    json: '{"objects":[[0,0.008953186954979882,-1.0660725900263184,0,"axe","sharpBody",0,["#999999","#999999"],["#000","#000"],[0,0,0],false,true,[[{"x":-0.2841274162454086,"y":6.493613436984212},{"x":-0.2841274162454086,"y":-3.532855993418295},{"x":0.30566490319003276,"y":-3.532855993418295},{"x":0.30566490319003276,"y":6.493613436984212}],[{"x":-1.4123294424394404,"y":0.26540654374594874},{"x":-1.4123294424394406,"y":-3.2261639873118657},{"x":1.3907919554948158,"y":-3.2261639873118657},{"x":1.3907919554948158,"y":0.26540654374594874}]],[1,1],0,[0,0],"",[1,1]],[1,0.5535733937463545,12.706855166389428,0,"axe","sharpTexture",1,"Axe0000",0,44.68994149628976,-1.564419506710866,0,false,"#FFFFFF",1,1,1]]}',
    class: Axe,
    library: PrefabManager.LIBRARY_WEAPON  ,
}
