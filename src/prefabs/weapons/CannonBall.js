import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";

class CannonBall extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);
		this.lifeTime = 8000;
        this.lifeTimer = 0;
        this.body = this.lookupObject.body;
		this.body.SetBullet(true);
	}
	update(){
		if (PrefabManager.timerReady(this.lifeTimer, this.lifeTime, true)) {
            this.destroy();
        }
        this.lifeTimer += game.editor.deltaTime;
	}
}

PrefabManager.prefabLibrary.CannonBall = {
    json: '{"objects":[[0,0,0,0,"cannonball","body",0,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[5],0,[16.04],"",[1],true,false,false,[0.5],[0.2]],[1,0,0,0,"","",1,"Cannon_Ball0000",0,0,0,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: CannonBall,
    library: PrefabManager.LIBRARY_WEAPON
}
