import { game } from '../../Game';
import * as PrefabManager from '../PrefabManager'

const { getPointer, NULL, pointsToVec2Array } = Box2D; // emscriptem specific

const generateGiphyURL = id => `https://i.giphy.com/media/${id}/giphy.mp4`

class GiphyPlayer extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);
		this.base = this.lookupObject.base;
		this.textureContainer = this.lookupObject.texture;
    }
    init() {
		const { giphy_id, loop, autoPlay, autoSize, width, height, isFixed, collisions  } = this.prefabObject.settings;
		if(!giphy_id) return;

		this.textureSprite = this.lookupObject.texture.children[0];

		const initialWidth = this.textureSprite.width;
		const initialHeight = this.textureSprite.height;

		this.textureSprite.texture = PIXI.Texture.from(generateGiphyURL(giphy_id), {crossOrigin: true});

		this.videoPlayer = this.textureSprite.texture.baseTexture.resource.source;
		this.videoPlayer.loop = loop;
		this.videoPlayer.autoPlay = autoPlay;


		if(autoSize){
			this.textureSprite.width = initialWidth;
			this.textureSprite.height = initialHeight;
		} else {
			this.textureSprite.width = width;
			this.textureSprite.height = height;
		}

		if(autoPlay){
			try{
				this.videoPlayer.play();
			}catch(e){
				// blabla promise shit not working always
			}
		}

		if(isFixed){
            this.base.SetType(Box2D.b2_staticBody);
        }else{
            this.base.SetType(Box2D.b2_dynamicBody);
        }

		game.editor.setBodyCollision(this.base, [collisions ? 0 : 2]);
	}
	play(){
		this.videoPlayer.play();
	}

	pause(){
		this.videoPlayer.pause();
	}

	reset(){
		if(this.videoPlayer){
			this.videoPlayer.pause();
			this.videoPlayer.currentTime = 0;
		}
	}

	update(){
		if(!this.videoPlayer) return;
		this.videoPlayer.playbackRate = game.editor.editorSettingsObject.gameSpeed;
	}

	set(property, value) {
		super.set(property, value);
        switch (property) {
			case 'width':
				this.setWidthHeight(value, this.height);
			break
			case 'height':
				this.setWidthHeight(this.width, value);
			break
        }
	}

	setWidthHeight(width, height){

		const body = this.base;

		const aabb = new Box2D.b2AABB();
		aabb.get_lowerBound().Set(Number.MAX_VALUE, Number.MAX_VALUE);
		aabb.get_upperBound().Set(-Number.MAX_VALUE, -Number.MAX_VALUE);

		const oldRot = body.GetAngle();
		body.SetTransform(body.GetPosition(), 0);

		for (let fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
			aabb.Combine(fixture.GetAABB(0));
		}

		body.SetTransform(body.GetPosition(), oldRot);

		this.width = width;
		this.height = height;

		var currentSize = {
			width: aabb.GetExtents().x * 2 * game.editor.PTM,
			height: aabb.GetExtents().y * 2 * game.editor.PTM
		}

		Box2D.destroy(aabb);

		let scaleX = width / currentSize.width;
		let scaleY = height / currentSize.height;

		let oldFixtures = []

		for (let fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
			fixture.SetSensor(true);
			oldFixtures.push(fixture);
		}

		oldFixtures.reverse();

		for (let i = 0; i < oldFixtures.length; i++) {
			let fixture = oldFixtures[i];
			const baseShape = fixture.GetShape();
			if (baseShape.GetType() === Box2D.b2Shape.e_polygon) {
				const shape = Box2D.castObject(baseShape, Box2D.b2PolygonShape);

				const vertices = [];
				for (let vertexIx = 0; vertexIx < shape.get_m_count(); vertexIx++) {
					const vertex = shape.get_m_vertices(vertexIx);
					vertices.push({x:vertex.get_x()*scaleX, y:vertex.get_y()*scaleY});
				}

				shape.Set(pointsToVec2Array(vertices)[0], vertices.length);

				let oldVertices = body.mySprite.data.vertices[i];

				for (let j = 0; j < oldVertices.length; j++) {
					oldVertices[j].x = oldVertices[j].x * scaleX;
					oldVertices[j].y = oldVertices[j].y * scaleY;
				}

			}
		};

		this.textureContainer.width = width;
		this.textureContainer.height = height;

		body.SetTransform(body.GetPosition(), body.GetAngle());

		game.editor.updateBodyShapes(body);
	}
}

GiphyPlayer.settings = Object.assign({}, GiphyPlayer.settings, {
	"giphy_id": 'IRFQYGCokErS0',
	loop: true,
	autoPlay: true,
	autoSize: true,
	width: 335,
    height: 196,
	"isFixed": true,
	"collisions": false,
});

GiphyPlayer.settingsOptions = Object.assign({}, GiphyPlayer.settingsOptions, {
	"giphy_id": 'IRFQYGCokErS0',
	loop: true,
	autoPlay: true,
	autoSize: true,
	width: {
        min: 0,
        max: 10000.0,
        step: 1
	},
	height: {
        min: 0,
        max: 10000.0,
        step: 1
	},
	"isFixed": true,
	"collisions": false,
});

PrefabManager.prefabLibrary.GiphyPlayer = {
    json: '{"objects":[[0,-0.0167,-0.0166,0,"giphy_player","base",0,["#999999"],["#000"],[1],false,true,[[{"x":-5.5733,"y":3.2567},{"x":-5.5733,"y":-3.2567},{"x":5.5733,"y":-3.2567},{"x":5.5733,"y":3.2567}]],[0.1],[0],[0],"",[0],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,0.5005,0.4995,0,"giphy_player","texture",1,"GiphyPlayer instance 10000",0,1.4142,-0.7844,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: GiphyPlayer,
    library: PrefabManager.LIBRARY_MISC,
}
