import * as PrefabManager from '../PrefabManager'

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

        const fixDef = new Box2D.b2FixtureDef();
        fixDef.set_density(oldFixture.get_density());
        fixDef.set_friction(oldFixture.get_friction());
        fixDef.set_restitution(oldFixture.get_restitution());
        fixDef.set_filter(oldFixture.get_filter().Clone());

        const shape = new Box2D.b2CircleShape();
        shape.set_m_radius(this.particleSize / Settings.PTM);
        fixDef.set_shape(shape);

        body.CreateFixture(fixDef);
        body.DestroyFixture(oldFixture);

        Box2D.destroy(fixDef);
        Box2D.destroy(shape);

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
