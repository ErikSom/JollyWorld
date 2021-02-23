import * as MD5 from 'md5';
import * as PIXI from 'pixi.js'
import {
    Settings
} from "../../Settings";

import {
    game
} from "../../Game";

const cachedTextures = {};
const bypass = true;

export const optimiseGroup = (container, graphicGroupData) => {

	if(!graphicGroupData.hash) graphicGroupData.hash = MD5(JSON.stringify(graphicGroupData.graphicObjects));


	if(bypass){
		game.editor.updateGraphicGroupShapes(container);
	}else{
		if(!cachedTextures[graphicGroupData.hash]){
			const newContainer = new PIXI.Container();
			newContainer.data = graphicGroupData;
			game.editor.updateGraphicGroupShapes(newContainer);
			const padding = 4;
			const bounds = newContainer.getLocalBounds(null, true).clone();
			newContainer.pivot.set(-bounds.width/2-padding/2, -bounds.height/2-padding/2);
			const cachedBitmap = PIXI.RenderTexture.create({ width: bounds.width + padding, height: bounds.height + padding });
			game.app.renderer.render(newContainer, cachedBitmap);
			cachedTextures[graphicGroupData.hash] = cachedBitmap;
		}

		const sprite = new PIXI.Sprite(cachedTextures[graphicGroupData.hash]);
		sprite.anchor.set(0.5,0.5);
		container.addChild(sprite);
	}

	game.editor.textures.addChild(container);

	if (container.data.bodyID != undefined) {
		const body = game.editor.textures.getChildAt(container.data.bodyID).myBody;
		game.editor.setTextureToBody(body, container, graphicGroupData.texturePositionOffsetLength, graphicGroupData.texturePositionOffsetAngle, graphicGroupData.textureAngleOffset);
	}



}
