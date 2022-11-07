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

	const options = {
		resourceOptions: {
			width: 1000,
			height: 1000,
		}
	}

	if(backgroundName){
		bg = new PIXI.Sprite(PIXI.Texture.from(`assets/images/backgrounds/${backgroundName}BG.svg`, options));
		bg.anchor.set(0.5);

		mg = new PIXI.Container();
		mg.innerSprite = new PIXI.Sprite(PIXI.Texture.from(`assets/images/backgrounds/${backgroundName}MG.svg`, options));
		mg.innerSprite.anchor.set(0.5);
		mg.addChild(mg.innerSprite);

		fg = new PIXI.Container();
		fg.innerSprite = new PIXI.Sprite(PIXI.Texture.from(`assets/images/backgrounds/${backgroundName}FG.svg`, options));
		fg.innerSprite.anchor.set(0.5);
		fg.addChild(fg.innerSprite);

		game.editor.background.addChild(bg);
		game.editor.background.addChild(mg);
		game.editor.background.addChild(fg);
	} 

	currentBackground = backgroundName;
}

export const updateBackground = () => {
	if(!currentBackground) return;

	// BG
	const camera = B2dEditor.container.camera || B2dEditor.container;

	const targetWidth = window.innerWidth / camera.scale.x;
	const targetHeight = window.innerHeight / camera.scale.x;

	let targetScale = targetWidth / (bg.width / bg.scale.x);

	if((bg.height / bg.scale.y) * targetScale < targetHeight){
		targetScale = targetHeight / (bg.height / bg.scale.y);
	}

	bg.scale.set(targetScale);

	const targetX = (-camera.x + window.innerWidth / 2) / camera.scale.x;
	const targetY = (-camera.y + window.innerHeight / 2) / camera.scale.x;

	bg.position.set(targetX, targetY);

	// MG
	const minZoom = 0.01;
	const maxZoom = 10;
	const zoomDiff = maxZoom - minZoom;
	const zoomProgress = (camera.scale.x - minZoom) / zoomDiff;

	const invCameraScale = 1 / camera.scale.x;

	const mgMinZoom = 1.5;
	const mgMaxZoom = 3;
	const mgZoom = mgMinZoom + (mgMaxZoom - mgMinZoom) * zoomProgress;

	const mgParralax = 0.99 + (0.01 * zoomProgress);

	mg.scale.set(invCameraScale);
	mg.innerSprite.scale.set(mgZoom);
	mg.position.set(targetX * mgParralax, targetY * mgParralax);

	// FG
	const fgMinZoom = 1.5;
	const fgMaxZoom = 5;
	const fgZoom = fgMinZoom + (fgMaxZoom - fgMinZoom) * zoomProgress;

	const fgParralax = 0.98 + (0.02 * zoomProgress);

	fg.scale.set(invCameraScale);
	fg.innerSprite.scale.set(fgZoom);
	fg.position.set(targetX * fgParralax, targetY * fgParralax);
}
