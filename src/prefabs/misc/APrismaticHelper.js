import { Key } from '../../../libs/Key';
import { game } from '../../Game';
import * as PrefabManager from '../PrefabManager';

export class APrismaticHelper extends PrefabManager.basePrefab {
    init(){
        super.init();
		console.log(this.lookupObject);
    }
	update(){
		if(Key.isPressed(Key.F)){
			// game.editor.deleteObjects([this.lookupObject.slide]);
			game.editor.mirrorPrefab(this, 'blue');
		}
	}
}

PrefabManager.prefabLibrary.APrismaticHelper = {
    json: '{"objects":[[0,-3.6985,0.0435,0,".obj","blue",0,["#0057dbff"],["#000"],[1],false,true,[[[{"x":-4.9833,"y":1.4833},{"x":-4.9833,"y":-1.4833},{"x":-1.5097,"y":-2.1077},{"x":4.9833,"y":-1.4833},{"x":4.9833,"y":1.4833}]]],[1],[0],[0],"",[0],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,3.8494,0.0285,-1.5708,".obj","center",1,["#18c434ff"],["#000"],[1],false,true,[[[{"x":1.3167,"y":-4.85},{"x":1.3167,"y":4.85},{"x":-1.3167,"y":4.85},{"x":-1.6735,"y":3.9649},{"x":-1.3167,"y":-4.85}]]],[1],[0],[0],"",[0],true,false,false,[0.5],[0.2],false,true,false,false,1],[2,-4.5241,-2.1624,1.5708,".obj","slide",2,1,0,1,false,false,1,10,true,0,0,0,0,50,-200,true]]}',
    class: APrismaticHelper,
    library: PrefabManager.LIBRARY_MISC
}
