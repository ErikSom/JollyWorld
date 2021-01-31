import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D'
import {
    game
} from "../../Game";

class Checkpoint extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init() {
        super.init();
        this.base = this.lookupObject['base'];

        if(this.prefabObject.settings.isFixed){
            this.base.SetType(Box2D.b2BodyType.b2_staticBody);
        }else{
            this.base.SetType(Box2D.b2BodyType.b2_dynamicBody);
        }


		const fixDef = new Box2D.b2FixtureDef;
		fixDef.density = 0.001;

        const shape = new Box2D.b2PolygonShape;
        const plateauSize = 5.3;
        shape.SetAsBox(plateauSize, plateauSize, new Box2D.b2Vec2(0, -plateauSize));
        fixDef.shape = shape;
        fixDef.isSensor = true;

		this.hitCheck = this.base.CreateFixture(fixDef);


    }
    update() {
        super.update();
    }
    initContactListener() {
        super.initContactListener();
        this.contactListener.PostSolve = function (contact, impulse) {
            const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            let body = bodies[0].mainCharacter ? bodies[0] : bodies[1];
            let checkpoint = bodies[0].mainCharacter ? bodies[1] : bodies[0];
            if(body.mainCharacter){
                game.checkpoint(checkpoint);
            }
        }
    }
}

Checkpoint.settings = Object.assign({}, Checkpoint.settings, {
    "isFixed": false,
});
Checkpoint.settingsOptions = Object.assign({}, Checkpoint.settingsOptions, {
	"isFixed": false,
});

PrefabManager.prefabLibrary.Checkpoint = {
    json: '{"objects":[[0,-0.027,0.006,0,"checkpoint","base",0,["#999999"],["#000"],[0],false,true,[[[{"x":-6.103,"y":0.467},{"x":-5.225,"y":-0.456},{"x":5.225,"y":-0.478},{"x":6.103,"y":0.467}]]],[1],0,[0],"",[1],true,false,false,[0.5],[0.2]],[1,0.824,-0.171,0,"","",1,"CheckPoint0000",0,1.682,0.204,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Checkpoint,
    library: PrefabManager.LIBRARY_LEVEL
}
