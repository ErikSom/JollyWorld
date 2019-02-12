import { game } from "../Game";
import * as Box2D from "../../libs/Box2D";


export class PortalGun{
    constructor(characterReference){
        this.characterReference = characterReference;
    }
    shoot(){
        var characterWeapon = this.characterReference.lookupObject.head;
        var bullet = this.createBullet();
        bullet.SetPositionAndAngle(characterWeapon.GetPosition(), characterWeapon.GetAngle());

        const bulletForce = 1000;
        const bodyAngleVector = new Box2D.b2Vec2(Math.cos(characterWeapon.GetAngle()), Math.sin(characterWeapon.GetAngle()));
        let dirFore = new Box2D.b2Vec2(bodyAngleVector.y, -bodyAngleVector.x);
        dirFore.SelfMul(bulletForce);
        bullet.ApplyForce(dirFore, bullet.GetPosition());

    }
    createBullet(){
        let bd = new Box2D.b2BodyDef();
		bd.type = Box2D.b2BodyType.b2_dynamicBody;
		bd.angularDamping = 0.9;

		const body = game.world.CreateBody(bd);

        let fixDef = new Box2D.b2FixtureDef;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;
        const radius = 10;

        fixDef.shape = new Box2D.b2CircleShape;
        fixDef.shape.SetLocalPosition(new Box2D.b2Vec2(0, 0));
        fixDef.shape.SetRadius(radius / game.editor.PTM);

        let fixture = body.CreateFixture(fixDef);


        var mySprite = {data:{}};
        body.mySprite = mySprite;
        return body;
    }
}