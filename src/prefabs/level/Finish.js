import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D'
import {
    game
} from "../../Game";
import { Humanoid } from '../humanoids/Humanoid';

class Finish extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
        this.base = this.lookupObject['base'];

        const fixDef = new Box2D.b2FixtureDef;
		fixDef.density = 0.001;

        const shape = new Box2D.b2PolygonShape;
        const plateauSize = 5.3;
        shape.SetAsBox(plateauSize, plateauSize, new Box2D.b2Vec2(0, -plateauSize));
        fixDef.shape = shape;
        fixDef.isSensor = true;

		this.hitCheck = this.base.CreateFixture(fixDef);
    }
    init() {
        super.init();

        if(this.prefabObject.settings.isFixed){
            this.base.SetType(Box2D.b2BodyType.b2_staticBody);
        }else{
            this.base.SetType(Box2D.b2BodyType.b2_dynamicBody);
        }

    }
    update() {
        super.update();
    }

    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.BeginContact = function(contact){
            if(contact.GetFixtureA() != self.hitCheck && contact.GetFixtureB() != self.hitCheck) return;

            const otherBody = contact.GetFixtureA() == self.hitCheck ? contact.GetFixtureB().GetBody() : contact.GetFixtureA().GetBody();
            if(otherBody.mainCharacter){
                const prefabClass = game.editor.retrieveClassFromBody(otherBody);
                if(prefabClass && prefabClass.character) prefabClass.character.setExpression(Humanoid.EXPRESSION_SPECIAL);

                game.win();
            }
        }
    }


}

Finish.settings = Object.assign({}, Finish.settings, {
    "isFixed": false,
});
Finish.settingsOptions = Object.assign({}, Finish.settingsOptions, {
	"isFixed": false,
});

PrefabManager.prefabLibrary.Finish = {
    json: '{"objects":[[0,-0.009,0.007,0,"finish","base",0,["#999999"],["#000"],[0],false,true,[[[{"x":-6.103,"y":0.467},{"x":-5.225,"y":-0.456},{"x":5.225,"y":-0.478},{"x":6.103,"y":0.467}]]],[1],0,[0],"",[1],true,false,false,[0.5],[0.2]],[1,0.28,-0.197,0,"","",1,"Finish0000",0,0.684,0.612,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Finish,
    library: PrefabManager.LIBRARY_LEVEL
}
