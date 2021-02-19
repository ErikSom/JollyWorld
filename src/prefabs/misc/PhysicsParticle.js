import * as PrefabManager from '../PrefabManager'
;

import {
    game
} from "../../Game";
import { Settings } from '../../Settings';

class PhysicsParticle extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
        this.lifeTime = Settings.physicsParticleLifeTime + Math.round(Settings.physicsParticleLifeTimeRandomOffset*Math.random());
        this.lifeTimer = 0;
        this.particleSize = 0
        this.texture = 'Gore_Meat1';
        this.isParticle = true;
    }
    init() {
        super.init();

        const body = this.lookupObject['particleBody'];

        // resize particle
        const oldFixture = body.GetFixtureList();

        const fixDef = new Box2D.b2FixtureDef;
        fixDef.density = oldFixture.m_density;
        fixDef.friction = oldFixture.m_friction;
        fixDef.restitution = oldFixture.m_restitution;
        fixDef.filter = oldFixture.m_filter.Clone();

        fixDef.shape = new Box2D.b2CircleShape;
        fixDef.shape.SetRadius(this.particleSize / Settings.PTM);
        body.CreateFixture(fixDef);
        body.DestroyFixture(oldFixture);

        // set correct texture
        body.myTexture.children[0].texture = PIXI.Texture.from(`${this.texture}0000`);

    }
    update() {
        if (PrefabManager.timerReady(this.lifeTimer, this.lifeTime, true)) {
            this.destroy();
        }
        this.lifeTimer += game.editor.deltaTime;
    }
}

PrefabManager.prefabLibrary.PhysicsParticle = {
    json: '{"objects":[[0,-0.022355735727800773,0.014440055310474797,0,"physicsParticle","particleBody",0,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[0.1],3,[7.283725902221577],"",[1]],[1,0.6873498602603735,0.7048060457331102,0,"physicsParticle","particleTexture",1,"Gore_Meat10000",0,1.3849160663272584,-0.19739555984987153,0,false,"#FFFFFF",1,1,1]]}',
    class: PhysicsParticle,
}
