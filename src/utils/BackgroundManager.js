import * as PIXI from 'pixi.js';
import { B2dEditor } from '../b2Editor/B2dEditor';
import { game } from '../Game';

let currentBackground = '';

let bg;
let mg;
let fg;

export const setBackground = backgroundName => {
	if (currentBackground === backgroundName) return;

	if (currentBackground) {
		bg.destroy();
		mg.destroy();
		fg.destroy();
	}

	if(backgroundName){
		bg = new PIXI.Sprite(PIXI.Texture.from(`assets/images/backgrounds/${backgroundName}BG.svg`));
		bg.anchor.set(0.5);

		mg = new PIXI.Sprite(PIXI.Texture.from(`assets/images/backgrounds/${backgroundName}MG.svg`));
		mg.anchor.set(0.5);

		fg = new PIXI.Sprite(PIXI.Texture.from(`assets/images/backgrounds/${backgroundName}FG.svg`));
		fg.anchor.set(0.5);

		game.editor.background.addChild(bg);
		game.editor.background.addChild(mg);
		game.editor.background.addChild(fg);
	} 

	currentBackground = backgroundName;
}

export const updateBackground = () => {
	if(!currentBackground) return;

	const camera = B2dEditor.container.camera || B2dEditor.container;

	const targetWidth = window.innerWidth / camera.scale.x;
	const targetHeight = window.innerHeight / camera.scale.x;

	let targetScale = targetWidth / (bg.width / bg.scale.x);

	if((bg.height / bg.scale.y) * targetScale < targetHeight){
		targetScale = targetHeight / (bg.height / bg.scale.y);
	}


	const targetX = -camera.x + window.innerWidth / 2;
	const targetY = -camera.y + window.innerHeight / 2;

	console.log(targetX, targetY, camera.x, camera.y);

	bg.scale.set(targetScale);
	bg.position.set(targetX / camera.scale.x, targetY / camera.scale.y);
}
