import * as PrefabManager from '../PrefabManager';
import * as EffectsComposer from '../../utils/EffectsComposer';

import {
    game
} from "../../Game";

import {
    Settings
} from "../../Settings";
import { b2CloneVec2, b2SubVec2 } from '../../../libs/debugdraw';

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
		this.impactForExplosion = 10000;
		this.exploded = false;
		// this.clipWalls = false;
		// this.exploded = false;

        super.init();
	}
	explode(){
		if(this.exploded) return;
		this.exploded = true;

		const aabb = new Box2D.b2AABB();
		const rayStartPosition = this.explodeTarget.GetPosition();
		const radius = this.explosiveRadius/Settings.PTM;
		aabb.get_lowerBound().Set(rayStartPosition.x-radius, rayStartPosition.y-radius);
		aabb.get_upperBound().Set(rayStartPosition.x+radius, rayStartPosition.y+radius);

		getBodies.clean();
		this.explodeTarget.GetWorld().QueryAABB(getBodies, aabb);

		[...getBodies.bodies].forEach(body=>{

			rayCallback.m_hit = false;
			this.explodeTarget.GetWorld().RayCast(rayCallback, rayStartPosition, body.GetPosition());

			if (!rayCallback.m_hit) {

				rayCallback.target = body;
				this.explodeTarget.GetWorld().RayCast(rayCallback, rayStartPosition, body.GetPosition());

				const diff = b2CloneVec2(rayStartPosition);
				b2SubVec2(diff, body.GetPosition());
				diff.Normalize();

				const power = (1-rayCallback.m_fraction)*this.explosivePower*5;
				const force = new Box2D.b2Vec2(power*-diff.x, power*-diff.y);

				if(rayCallback.m_point){

					body.ApplyForce(force, rayCallback.m_point, true);
					const powerRate = power/this.explosivePower;

					if(body.isFlesh){
						self.editor.addDecalToBody(body, rayCallback.m_point, "skorch.png", true, powerRate*5, Math.atan2(diff.y, diff.x), {burn:powerRate*.6});
					}

					if (powerRate > .2 && body.mySprite && body.mySprite.data.prefabInstanceName) {


						const tarPrefab = game.editor.activePrefabs[body.mySprite.data.prefabInstanceName].class;

						if(tarPrefab.isExplosive){
							tarPrefab.explode();
						}

						const bodyClass = game.editor.retrieveSubClassFromBody(body);
						if(bodyClass && bodyClass.dealDamage){
							const slidingPowerScalar = 50;
							bodyClass.dealDamage(power/slidingPowerScalar);
						}

					}
				}

			}

		})

        const pixiPoint = game.editor.getPIXIPointFromWorldPoint(rayStartPosition);
		EffectsComposer.addEffect(EffectsComposer.effectTypes.shockWave, {radius:this.explosiveRadius*10, point:pixiPoint});
        EffectsComposer.addEffect(EffectsComposer.effectTypes.screenShake, {amplitude:this.explosivePower/200, point:pixiPoint});

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
				if(!this.active){
					this.explodeTimer = 0;
					this.active = true;
				}
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
						const count = contact.GetManifold().get_pointCount();
						let force = 0;
						for (var j = 0; j < count; j++) force = Math.max(force, impulse.get_normalImpulses(j));
						force *= Math.min(body.GetMass(), 50);

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

const getBodies = Object.assign(new Box2D.JSQueryCallback(), {
	bodies: [],
	ReportFixture: function(fixturePtr){
		const fixture = Box2D.wrapPointer( fixturePtr, Box2D.b2Fixture );
		const body = fixture.GetBody();
		const bodyClass = game.editor.retrieveClassFromBody(body);
		let ignore = false;
		if(bodyClass){
			if(bodyClass.isExplosive && bodyClass.exploded) ignore = true;
			if(bodyClass.isParticle) ignore = true;
		}
		if(!ignore) this.bodies.push(body);
		return true;
	},
	clean: function(){
		this.bodies.length = 0;
	}
});

const rayCallback = Object.assign(new Box2D.JSRayCastCallback(), {
	target: null,
	m_fraction: 0,
	m_point: null,
	m_hit: false,
	ReportFixture: function (fixture_p,	point_p, normal, fraction) {

		const fixture = Box2D.wrapPointer(fixture_p, Box2D.b2Fixture);
		const point = Box2D.wrapPointer(point_p, Box2D.b2Vec2);
		// const normal = Box2D.wrapPointer(normal_p, Box2D.b2Vec2);

		const body = fixture.GetBody();
		if(!this.target){
			if(body.GetType() !== Box2D.b2_staticBody) return -1;
			if (fixture.IsSensor()) return -1;
		}else{
			if(body !== this.target) return -1;
			this.target = null;
		}
		this.m_hit = true;
		this.m_point = point;
		this.m_fraction = fraction;
	}
});
