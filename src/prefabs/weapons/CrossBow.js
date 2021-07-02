import * as PrefabManager from '../PrefabManager'
import * as PrefabBuilder from '../../utils/PrefabBuilder'

import { drawCircle } from '../../b2Editor/utils/drawing';


import {
    game
} from "../../Game";
import { Settings } from '../../Settings';
import { b2CloneVec2 } from '../../../libs/debugdraw';

const vec1 = new Box2D.b2Vec2();

class CrossBow extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);
		this.isCrossBow = true;
		this.flipped = false;
    }
    init() {
		this.loaded = true;
		this.reloadTime = this.prefabObject.settings.reloadTime*1000;
		this.reloadTimer = 0;
		this.shootDelay = this.prefabObject.settings.shootDelay*1000;
		this.shootTimer = 0;
		this.shootForce = this.prefabObject.settings.shootForce;
		this.crossbowBody = this.lookupObject["body"];
		this.crossbowBody.isCrossBow = true;
		this.arrowSprite = this.crossbowBody.myTexture.children[1];
		this.autoShoot = this.prefabObject.settings.autoShoot;
		this.shouldShoot = false;

		this.arrowSpawnPoint = new Box2D.b2Vec2( 1.4, -0.66 );

		if(this.flipped){
			this.arrowSpawnPoint.set_x(-Math.abs(this.arrowSpawnPoint.x));
		}else{
			this.arrowSpawnPoint.set_x(Math.abs(this.arrowSpawnPoint.x));
		}

		if(this.prefabObject.settings.isFixed){
            this.crossbowBody.SetType(Box2D.b2_staticBody);
        }else{
            this.crossbowBody.SetType(Box2D.b2_dynamicBody);
		}

		this.lastArrows = [];

		this.reload();
		super.init();
	}
	flip(flipped){
		if(this.flipped != flipped){
			this.flipped = flipped;
			game.editor.mirrorPrefab(this, 'body');
		}
	}
	set(property, value) {
		super.set(property, value);
        switch (property) {
            case 'isFlipped':
                this.flip(value);
                break;
        }
    }
	update() {
		super.update();
		if(this.lookupObject.body.InCameraView){
			if(!this.loaded){
				if (PrefabManager.timerReady(this.reloadTimer, this.reloadTime, true)) {
					this.reload();
				}
				this.reloadTimer += game.editor.deltaTime;
			}else if(this.autoShoot || this.shouldShoot){
				if (PrefabManager.timerReady(this.shootTimer, this.shootDelay, true)) {
					this.shoot();
				}
				this.shootTimer += game.editor.deltaTime;
			}
		}
	}
	setShouldShoot() {
		this.shouldShoot = true;
	}
	shoot() {
		let wp = this.crossbowBody.GetWorldPoint(this.arrowSpawnPoint);
		const pos = vec1;
		pos.Set(wp.x, wp.y);

		const angle = this.crossbowBody.GetAngle()+(this.flipped ? Math.PI : 0);

		const prefabData = PrefabBuilder.generatePrefab(pos, angle*game.editor.RAD2DEG, 'Arrow', true);

		const { lookupObject } = prefabData;
		const body = lookupObject._bodies[0];
		body.SetTransform(pos, angle);
		game.editor.updateBodyPosition(body);

		const impulse = vec1;
		impulse.Set(this.shootForce*Math.cos(angle), this.shootForce*Math.sin(angle));

		body.ApplyForceToCenter(impulse, true);

		this.lastArrows.push(prefabData.prefabClass);
		if(this.lastArrows.length>Settings.maxBulletsPrefab){
			const lastArrow = this.lastArrows.shift();
			if(!lastArrow.sticking)	lastArrow.destroy();
		}

		this.arrowSprite.alpha = 0;
		this.reloadTimer = 0;
		this.loaded = false;
		this.shouldShoot = false;
	}
	reload() {
		this.arrowSprite.alpha = 1.0;
		this.shootTimer = 0;
		this.loaded = true;
	}
}

CrossBow.settings = Object.assign({}, CrossBow.settings, {
	"isFixed": false,
	"isFlipped":false,
    "reloadTime": 2,
    "shootDelay": 1,
	"shootForce": 1500,
	"autoShoot": false,
});
CrossBow.settingsOptions = Object.assign({}, CrossBow.settingsOptions, {
	"isFixed": false,
	"isFlipped": false,
    "reloadTime": {
        min: 0.5,
        max: 10.0,
        step: 0.1
	},
	"shootDelay": {
        min: 0.5,
        max: 10.0,
        step: 0.1
	},
	"shootForce": {
        min: 0.0,
        max: 5000.0,
        step: 1.0
	},
	"autoShoot":false
});

PrefabManager.prefabLibrary.CrossBow = {
    json: JSON.stringify({"objects":[[0,-0.31998250510481513,0.40624253613936456,0,"crossbow","body",0,["#999999"],["#000"],[0],false,true,[[[{"x":-1.6325716862607298,"y":-0.5263482485758638},{"x":-1.5879659024831143,"y":0.7226136971973722},{"x":-1.2162510376696511,"y":0.7226136971973722},{"x":2.1143141510589776,"y":-0.28845073509524743},{"x":2.322474475354517,"y":-0.6304284107236334}]]],[1],0,[0],"",[1]],[7,1.1123679734323186,-0.7917361187589407,0,"","",1,["[1,-1.3630054032315568,6.029656491528054,0,\"crossbow\",\"bowTexture\",70,\"CrossBow0000\",null,null,null,null,false,\"#FFFFFF\",1,1,1]","[1,1.3630054032315577,-6.029656491528054,0,\"crossbow\",\"arrowTexture\",71,\"Arrow0000\",null,null,null,null,false,\"#FFFFFF\",1,1,1]"],0,16.828497881048452,0.8808056877633276,0,1]]}),
    class: CrossBow,
    library: PrefabManager.LIBRARY_WEAPON  ,
}
