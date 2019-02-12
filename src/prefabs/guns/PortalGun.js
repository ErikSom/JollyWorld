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
}