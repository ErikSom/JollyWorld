import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D';
import * as EffectsComposer from '../../utils/EffectsComposer';

import {
    game
} from "../../Game";

import {
    Settings
} from "../../Settings";

export class Explosive extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);
		this.isExplosive = true;
    }
    init() {
		this.explosiveRadius = 250;
		this.explosivePower = this.prefabObject.settings.force;
		this.explodeTimer = 0;
		this.explodeDelay = this.prefabObject.settings.delay*1000;
		this.explosiveRays = 20;
		this.explodeTarget = null;
		this.active = this.prefabObject.settings.active;
		this.activateOn = this.prefabObject.settings.activateOn;
		this.impactForExplosion = 8;
		this.exploded = false;
		// this.clipWalls = false;
		// this.exploded = false;

        super.init();
	}
	explode(){
		if(this.exploded) return;
		this.exploded = true;
		let rayStartPosition = this.explodeTarget.GetPosition();
		let angleInc = (Math.PI*2)/this.explosiveRays;
		const radius = this.explosiveRadius/Settings.PTM;

		for(let i = 0; i<this.explosiveRays; i++){
			const angle = angleInc*i;
			const cosA = Math.cos(angle);
			const sinA = Math.sin(angle);
			const extentX = radius*cosA;
			const extentY = radius*sinA;
			let rayEndPosition = new Box2D.b2Vec2(rayStartPosition.x + extentX, rayStartPosition.y + extentY);

			var callback = new Explosive.RaycastCallbackExplosive();
			this.explodeTarget.GetWorld().RayCast(callback, rayStartPosition, rayEndPosition);
			if (callback.m_hit) {
				const power = (1-callback.m_fraction)*this.explosivePower;
				const force = new Box2D.b2Vec2(power*cosA, power*sinA);
				const body = callback.m_fixture.GetBody();
				if(body != this.explodeTarget){
					body.ApplyForce(force, callback.m_point);
					const powerRate = power/this.explosivePower;

					if(body.isFlesh){
						self.editor.addDecalToBody(body, callback.m_point, "skorch.png", true, powerRate*2.5, angle, {burn:powerRate*.6});
					}

					if (powerRate > .2 && body.mySprite && body.mySprite.data.prefabInstanceName) {
						const tarPrefab = game.editor.activePrefabs[body.mySprite.data.prefabInstanceName].class;
						if(tarPrefab.isExplosive){
							tarPrefab.explode();
						}
					}


				}
			}
		}
		EffectsComposer.addEffect(EffectsComposer.effectTypes.shockWave, {radius:this.explosiveRadius, x:this.explodeTarget.GetPosition().x*Settings.PTM, y:this.explodeTarget.GetPosition().y*Settings.PTM});
        EffectsComposer.addEffect(EffectsComposer.effectTypes.screenShake, {amplitude:this.explosivePower/200});



	}
    update(){
		super.update();
		if(this.active){
			if (PrefabManager.timerReady(this.explodeTimer, this.explodeDelay, true)) {
				this.explode();
			}
			this.explodeTimer += game.editor.deltaTime;
		}
	}
	set(property, value) {
        switch (property) {
			case 'active':
				this.explodeTimer = 0;
            default:
                this.prefabObject.settings[property] = value;
                break;
        }
    }
    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.BeginContact = function (contact) {
        }
        this.contactListener.EndContact = function (contact) {
		}
		this.contactListener.PostSolve = function (contact, impulse) {
			if(!self.active && self.activateOn !== Explosive.activateOnTypes.none){
				var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
				var body;
				for (var i = 0; i < bodies.length; i++) {
					body = bodies[i];
					if(self.activateOn == Explosive.activateOnTypes.impact){
						const count = contact.GetManifold().pointCount;
						let force = 0;
						for (var j = 0; j < count; j++) force = Math.max(force, impulse.normalImpulses[j]);
						if(force > self.impactForExplosion){
							self.set('active', true);
						}
					}else if(self.activateOn == Explosive.activateOnTypes.mainCharacter){
						if(body.mainCharacter){
							self.set('active', true);
						}
					}else if(self.activateOn == Explosive.activateOnTypes.anyCharacter){
						if(body.mainCharacter){
							self.set('active', true);
						}
					}

				}
			}
		}
	}
	setActive(bool){
		this.active = bool;
		// override me
	}
}
Explosive.activateOnTypes = {
	none:"None",
	impact:"Impact",
	mainCharacter:"Main Character",
	anyCharacter:"Any Character"
}
Explosive.settings = Object.assign({}, Explosive.settings, {
    "delay": 3,
	"force": 2500,
	"active": false,
	"activateOn": "None",
});
Explosive.settingsOptions = Object.assign({}, Explosive.settingsOptions, {
    "delay": {
        min: 0.0,
        max: 10.0,
        step: 0.1
    },
    "force": {
        min: 100,
        max: 10000,
        step: 100
	},
	"active": false,
	"activateOn":Object.values(Explosive.activateOnTypes),
});

Explosive.RaycastCallbackExplosive = function () {
	this.m_hit = false;
}
Explosive.RaycastCallbackExplosive.prototype.ReportFixture = function (fixture, point, normal, fraction) {
	if(fixture.GetBody() && fixture.GetBody().isFlesh){
		 if(fixture.GetBody().myTexture.data.textureName.indexOf('head') >= 0){
			 console.log(fixture.GetType(), Box2D.b2BodyType.b2_staticBody, fixture.IsSensor(), "<----");
		 };
	}
	if (fixture.IsSensor()) return -1;
	this.m_hit = true;
	this.m_point = point.Clone();
	this.m_normal = normal;
	this.m_fixture = fixture;
	this.m_fraction = fraction;
	return fraction;
};
