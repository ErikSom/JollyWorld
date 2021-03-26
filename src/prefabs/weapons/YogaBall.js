import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import {
    Settings
} from '../../Settings';
import * as PIXI from 'pixi.js';


class YogaBall extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);
        this.base = this.lookupObject.base;
		this.handlePoint = this.lookupObject.b1;
		this.steps = 12;

		this.handleFront = null;
		this.handleBack = null;
		this.buildMesh();
		this.updateHandles();

	}

	update(){
		this.updateMesh();
		this.updateHandles();
	}


	buildMesh(){
		const t = PIXI.Texture.from('YogaBall0000')
		this.mesh = new PIXI.SimpleMesh(t, ...this.getMeshData());
		this.base.mySprite.addChild(this.mesh);


		this.handleFront = new PIXI.Sprite(PIXI.Texture.from('YogaBall_Handle_Front0000'));
		this.handleBack = new PIXI.Sprite(PIXI.Texture.from('YogaBallHandle_Back0000'));

		this.base.mySprite.addChild(this.handleFront);
		this.base.mySprite.addChildAt(this.handleBack, 0);
	}

	updateMesh(){

		const [vertices, uvs] = this.getMeshData();

		this.mesh.verticesBuffer.update(vertices);
		this.mesh.uvBuffer.update(uvs);
	}

	updateHandles(){
		this.handleFront.position.x = -20;
		this.handleBack.position.x = -6.5;
		this.baseYOffset = 34;
		this.handleFront.position.y = -this.handlePoint.GetPosition().Clone().SelfSub(this.base.GetPosition()).Length() * Settings.PTM - this.baseYOffset;
		this.handleBack.position.y = -this.handlePoint.GetPosition().Clone().SelfSub(this.base.GetPosition()).Length() * Settings.PTM - this.baseYOffset;
	}

	getMeshData(){
		const radiusAr = [];

		for(let i = 0; i<this.steps; i++){
			const targetBodyIndex = (i + 3) % this.steps + 1;
			const p = this.lookupObject[`b${targetBodyIndex}`];
			p.mySprite.visible = false;
			radiusAr.push(this.base.GetPosition().Clone().SelfSub(p.GetPosition()).Length()*Settings.PTM);
		}

		const rInc = 16;

		const vertices = [0,0];
		const indices = [];

		const step = 360 / this.steps;

		for(let i = 0; i < this.steps; i ++) {
			const r = radiusAr[i] + rInc;
			vertices.push( Math.cos(Math.PI * i * step / 180)*r, Math.sin(Math.PI * i * step / 180)*r);
			indices.push(0, i + 1, i);
		}

		indices.push(0, 1, this.steps);

		const uvs = vertices.map((e, i) => {
			let r;
			if(i <= 1){
				r = 75;
			}else{
				const vindex = Math.floor((i-2) / 2);
				r = radiusAr[vindex] + rInc;
			}
			return 0.5 + e / r / 2;
		});

		return [vertices, uvs, indices]
	}
}

PrefabManager.prefabLibrary.YogaBall = {
    json: '{"objects":[[0,0.0063,0.0013,0,"yogaball","base",0,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[20],"",[1],true,false,false,[0.5],[0.2],false],[0,-0.0011,-2.1001,0,"yogaball","b1",1,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[10],"",[1],true,false,false,[0.5],[0.2],false],[0,0.0063,2.1013,0,"yogaball","b7",2,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[10],"",[1],true,false,false,[0.5],[0.2],false],[0,2.073,0.0013,0,"yogaball","b4",3,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[10],"",[1],true,false,false,[0.5],[0.2],false],[0,-2.0937,0.0013,0,"yogaball","b10",4,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[10],"",[1],true,false,false,[0.5],[0.2],false],[2,0.1892,63.0403,0,"yogaball","j7",5,0,2,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,-62.8108,0.0403,0,"yogaball","j10",6,0,4,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,0.1892,-63.1578,0,"yogaball","j1",7,0,1,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,62.8319,0.0403,0,"yogaball","j4",8,0,3,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[0,-1.0512,-1.8183,-0.5236,"yogaball","b12",9,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[10],"",[1],true,false,false,[0.5],[0.2],false],[0,1.0559,1.8165,-0.5236,"yogaball","b6",10,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[10],"",[1],true,false,false,[0.5],[0.2],false],[0,1.7958,-1.0355,-0.5236,"yogaball","b3",11,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[10],"",[1],true,false,false,[0.5],[0.2],false],[0,-1.8127,1.0479,-0.5236,"yogaball","b9",12,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[10],"",[1],true,false,false,[0.5],[0.2],false],[2,31.6778,54.4974,-0.5236,"yogaball","j6",13,0,10,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,-54.3818,31.4378,-0.5236,"yogaball","j9",14,0,12,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,-31.4212,-54.7934,-0.5236,"yogaball","j12",15,0,9,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,54.428,-31.3836,-0.5236,"yogaball","j3",16,0,11,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[0,-1.8197,-1.0492,-1.0472,"yogaball","b11",17,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[10],"",[1],true,false,false,[0.5],[0.2],false],[0,1.8225,1.0451,-1.0472,"yogaball","b5",18,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[10],"",[1],true,false,false,[0.5],[0.2],false],[0,1.0372,-1.7947,-1.0472,"yogaball","b2",19,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[10],"",[1],true,false,false,[0.5],[0.2],false],[0,-1.046,1.8042,-1.0472,"yogaball","b8",20,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[10],"",[1],true,false,false,[0.5],[0.2],false],[2,54.6763,31.3547,-1.0472,"yogaball","j5",21,0,18,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,-31.3833,54.4143,-1.0472,"yogaball","j8",22,0,20,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,-54.6144,-31.7444,-1.0472,"yogaball","j11",23,0,17,2,false,false,1,10,false,0,0,0.5,4,0,0,true],[2,31.4381,-54.3955,-1.0472,"yogaball","j2",24,0,19,2,false,false,1,10,false,0,0,0.5,4,0,0,true]]}',
    class: YogaBall,
    library: PrefabManager.LIBRARY_WEAPON
}
