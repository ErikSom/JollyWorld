import * as PrefabManager from '../PrefabManager'
import { SharpObject } from './SharpObject';

class Spear extends SharpObject {
    constructor(target) {
        super(target);
    }
    init() {
		super.init();

		this.extent = 5.0;
		this.width = 0.2;
        this.spread = 0.2;
		this.offsetWidth = 0.2;
		this.twoSided = true;
    }
}

PrefabManager.prefabLibrary.Spear = {
    json: '{"objects":[[0,-0.003520691054219389,0.11831717513645601,0,"spear","sharpBody",0,["#999999"],["#000"],[0],false,true,[[{"x":-0.25658207735426103,"y":5.217125221459477},{"x":-0.25658207735426103,"y":-5.217125221459477},{"x":0.25658207735426103,"y":-5.217125221459477},{"x":0.25658207735426103,"y":5.217125221459477}]],[1],0,[0],"",[1]],[1,-0.4764357557237511,1.896795263062447,0,"spear","sharpTexture",1,"Spike0000",0,1.6938084752564158,1.7915077269373396,0,false,"#FFFFFF",1,1,1]]}',
    class: Spear,
    library: PrefabManager.LIBRARY_WEAPON  ,
}
