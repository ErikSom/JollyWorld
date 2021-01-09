import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D';

class Trampoline extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init(){
        super.init();
        this.base = this.lookupObject['base'];
        this.bounce = this.lookupObject['bounce'];

        this.bounce.noImpactDamage = true;

        if(this.prefabObject.settings.isFixed){
            this.base.SetType(Box2D.b2BodyType.b2_staticBody);
        }else{
            this.base.SetType(Box2D.b2BodyType.b2_dynamicBody);
        }
    }
}

Trampoline.settings = Object.assign({}, Trampoline.settings, {
    "isFixed": false,
});
Trampoline.settingsOptions = Object.assign({}, Trampoline.settingsOptions, {
	"isFixed": false,
});

PrefabManager.prefabLibrary.Trampoline = {
    json: '{"objects":[[0,-0.467,0.535,0,"trampoline","base",0,["#999999"],["#000"],[0],false,true,[[{"x":-6.318,"y":0.32},{"x":-6.318,"y":-0.32},{"x":6.318,"y":-0.32},{"x":6.318,"y":0.32}]],[1],1,[0],"",[1],true,false,false,[0.5],[0.2]],[1,-12.546,-2.1,0,"trampoline","texture",1,"Jumper0000",0,18.223,1.491,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.489,0.109,0,"trampoline","bounce",2,["#999999"],["#000"],[0],false,true,[[{"x":-5.985,"y":0.654},{"x":-5.985,"y":-0.654},{"x":5.985,"y":-0.654},{"x":5.985,"y":0.654}]],[1],0,[0],"",[1],true,false,false,[0.5],[1]],[2,-1.355,12.57,0,"trampoline","baseJoint",3,2,0,0,false,false,1,10,true,0,0,0,0,0,0]]}',
    class: Trampoline,
    library: PrefabManager.LIBRARY_MOVEMENT
}
