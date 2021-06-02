import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import { b2MulVec2 } from '../../../libs/debugdraw';
import { crawlJointsUtility } from '../level/Finish';
import { Settings } from '../../Settings';

class Jumppad extends PrefabManager.basePrefab {
    static JUMPPAD_RELEASE = 50;
    static JUMPPAD_RELEASED = 100;

    constructor(target) {
        super(target);
    }
    init() {
        super.init();
        this.jumppadTimer = Number.POSITIVE_INFINITY;
        this.jumppadDelay = this.prefabObject.settings.delay * 1000.0;
        this.ready = true;
        this.pad = this.lookupObject.pad;
        this.padEngine = this.lookupObject["pad_engine"];
        this.padEngine.EnableMotor(false);
        this.contactBodies = [];

        const fixDef = new Box2D.b2FixtureDef();
        fixDef.set_density(0.001);
        fixDef.set_friction(Settings.defaultFriction);
        fixDef.set_restitution(Settings.defaultRestitution);
        fixDef.set_isSensor(true);

        const shape = new Box2D.b2PolygonShape();
        shape.SetAsBox(5.2, 0.6);

        const vertices = [];
        for (let vertexIx = 0; vertexIx < shape.get_m_count(); vertexIx++) {
            const vertex = shape.get_m_vertices(vertexIx);
            vertices.push({x:vertex.get_x(), y:vertex.get_y()-0.2});
        }

        shape.Set(Box2D.pointsToVec2Array(vertices)[0], vertices.length);

        fixDef.set_shape(shape);
        this.pad.CreateFixture(fixDef);


        Box2D.destroy(fixDef);
        Box2D.destroy(shape);

        if(this.prefabObject.settings.isFixed){
            this.lookupObject.platform.SetType(Box2D.b2_staticBody);
        }else{
            this.lookupObject.platform.SetType(Box2D.b2_dynamicBody);
        }
    }
    update() {
        super.update();
        if (PrefabManager.timerReady(this.jumppadTimer, this.jumppadDelay, true)) {
            this.padEngine.EnableMotor(true);
            this.padEngine.SetMaxMotorForce(this.prefabObject.settings.force * 10.0);
            this.padEngine.SetMotorSpeed(50.0);

            // deduplicate array
            this.contactBodies = this.contactBodies.filter((body, i, a) => i === (a.indexOf(body) && !body.destroyed));

            this.contactBodies.forEach( body => {
                const bodyAngleVector = new Box2D.b2Vec2(Math.cos(this.pad.GetAngle()), Math.sin(this.pad.GetAngle()));
                const dirForce = new Box2D.b2Vec2(bodyAngleVector.y, -bodyAngleVector.x);
                b2MulVec2(dirForce,  this.prefabObject.settings.force)

                // add sensor

                const bodyDirForce = new Box2D.b2Vec2(0, 0);
                bodyDirForce.Set(dirForce.x, dirForce.y);
                b2MulVec2(bodyDirForce,  body.GetMass());
                const bodies = crawlJointsUtility(body, ()=>true);
                body.ApplyForceToCenter(bodyDirForce, body.GetPosition(), true);
		        bodies.forEach(b => {
                    bodyDirForce.Set(dirForce.x, dirForce.y);
                    b2MulVec2(bodyDirForce,  b.GetMass());
                    b.ApplyForceToCenter(bodyDirForce, b.GetPosition(), true);
                })
            })


        } else if (PrefabManager.timerReady(this.jumppadTimer, this.jumppadDelay + Jumppad.JUMPPAD_RELEASE, true)) {
            this.padEngine.EnableMotor(false);
        } else if (PrefabManager.timerReady(this.jumppadTimer, this.jumppadDelay + Jumppad.JUMPPAD_RELEASED, false)) {
            this.ready = true;
        }
        this.jumppadTimer += game.editor.deltaTime;
    }
    set(property, value) {
        switch (property) {
            default:
                this.prefabObject.settings[property] = value;
                break;
        }
    }
    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.BeginContact = function (contact) {
			const otherBody = (contact.GetFixtureA().GetBody() == self.pad) ? contact.GetFixtureB().GetBody() : contact.GetFixtureA().GetBody();

			if(otherBody.GetType() !== Box2D.b2_dynamicBody) return;
			if(otherBody.mySprite && otherBody.mySprite.data.type === game.editor.object_TRIGGER) return;

			self.contactBodies.push(otherBody);
        }
        this.contactListener.EndContact = function (contact) {
			const otherBody = (contact.GetFixtureA().GetBody() == self.pad) ? contact.GetFixtureB().GetBody() : contact.GetFixtureA().GetBody();
            if(!contact.GetFixtureA().GetBody() === self.pad && !contact.GetFixtureB().GetBody() === self.pad) return;
			self.contactBodies = self.contactBodies.filter(body => body !== otherBody);
		}
        this.contactListener.PostSolve = function (contact, impulse) {
            var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            var body;
            if (self.ready) {
                for (var i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (body === self.pad) {
                        self.jumppadTimer = -0.001;
                        self.ready = false;
                    }
                }
            }
        }
    }
}
Jumppad.settings = Object.assign({}, Jumppad.settings, {
    "delay": 0.0,
    "force": 1000,
    "isFixed": false
});
Jumppad.settingsOptions = Object.assign({}, Jumppad.settingsOptions, {
    "delay": {
        min: 0.1,
        max: 3.0,
        step: 0.1
    },
    "force": {
        min: 100,
        max: 10000,
        step: 1
    },
    "isFixed": false
});

PrefabManager.prefabLibrary.Jumppad = {
    json: '{"objects":[[0,-0.0019,-0.1019,0,"jumppad","pad",0,["#999999"],["#665656"],[0],false,true,[[{"x":-5.2233,"y":0.3904},{"x":-5.2233,"y":-0.3904},{"x":5.2233,"y":-0.3904},{"x":5.2233,"y":0.3904}]],[1],[0],[0],"",[0],true,false,false,[0.5],[0.2],false,true,false],[7,-0.7743,-4.9646,0,"","",1,[[6,-1.2265,6.5541,0,"","",7,"#707070","#000",1,null,[{"x":118.5,"y":12},{"x":118.5,"y":-12},{"x":-118.5,"y":-12},{"x":-118.5,"y":12}],null,null,null,null,"",0,0,0,0,"",true],[1,1.2265,-6.5541,0,"","",8,"Jumping_Pad0000",null,null,null,null,false,"#FFFFFF",1,1,1,0,0,0,true]],0,2.0382,1.9304,0,1,0,0,0,true,false,[]],[0,-0.0019,0.0953,0,"jumppad","platform",2,["#999999"],["#000"],[1],false,true,[[{"x":-5.2,"y":0.4},{"x":-5.2,"y":-0.4},{"x":5.2,"y":-0.4},{"x":5.2,"y":0.4}]],[10],[0],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,0.443,3.8592,0,"","",3,"Jumping0000",2,1.118,-1.1071,0,false,"#FFFFFF",1,1,1,0,0,0,true],[2,0.4453,1.303,0,"jumppad","pad_engine",4,0,2,1,false,false,1,10,true,0,0,0,0,23,0,true]]}',
    class: Jumppad,
    library: PrefabManager.LIBRARY_MOVEMENT
}
