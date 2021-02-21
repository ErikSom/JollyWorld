import * as MD5 from 'md5';
import * as PIXI from 'pixi.js'
import {
    Settings
} from "../../Settings";

import {
    game
} from "../../Game";

const buildTextures = {};
export const optimiseGroup = (container, graphicGroupData) => {

	if(!graphicGroupData.hash) graphicGroupData.hash = MD5(graphicGroupData.graphicObjects);

	console.log(graphicGroupData.hash);


	if(buildTextures[graphicGroupData.hash]){
		// we han image, use it
	}else{

		const newContainer = new PIXI.Container();
		newContainer.data = graphicGroupData;
		game.editor.updateGraphicGroupShapes(newContainer);
		game.editor.updateGraphicGroupShapes(container);

		// check if we should make this
		console.log(Settings.pixelRatio, 'RATIO');
		const cachedBitmap = PIXI.RenderTexture.create({ width: newContainer.width * Settings.pixelRatio, height: newContainer.height * Settings.pixelRatio});
        game.app.renderer.render(newContainer, cachedBitmap);
	
		const sprite = new PIXI.Sprite(cachedBitmap);
		sprite.anchor.set(0.5, 0.5);

		container.addChild(sprite);

	}


	
	game.editor.textures.addChild(container);

	if (container.data.bodyID != undefined) {
		const body = game.editor.textures.getChildAt(container.data.bodyID).myBody;
		game.editor.setTextureToBody(body, container, graphicGroupData.texturePositionOffsetLength, graphicGroupData.texturePositionOffsetAngle, graphicGroupData.textureAngleOffset);
	}



}
