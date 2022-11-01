import { game } from '../../Game';
import * as PrefabManager from '../PrefabManager'

const generateGiphyURL = id => `https://i.giphy.com/media/${id}/giphy.mp4`

class GiphyPlayer extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);
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

		this.base = this.lookupObject.base;
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
		this.videoPlayer.pause();
		this.videoPlayer.currentTime = 0;
	}

	update(){
		if(!this.videoPlayer) return;
		this.videoPlayer.playbackRate = game.editor.editorSettingsObject.gameSpeed;
	}
}

GiphyPlayer.settings = Object.assign({}, GiphyPlayer.settings, {
	"giphy_id": 'IRFQYGCokErS0',
	loop: true,
	autoPlay: true,
	autoSize: true,
	width: 400,
    height: 300,
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
