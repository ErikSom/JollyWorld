import * as PIXI from 'pixi.js';
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


	// position the background
}
