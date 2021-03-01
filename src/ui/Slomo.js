import {
    game
} from "../Game"
import * as PIXI from 'pixi.js';
import { color } from "../../libs/dat.gui";

export let ui;
let clock, arrows, text, textShadow;
let gameSpeed = null;
let hidden = true;
let alertTime = 0;
let colorToggle = false;

const ALERT_TICKS = 60;

export const init = ()=> {
	ui = new PIXI.Container();
	clock = new PIXI.Sprite(PIXI.Texture.from('Icon_SlowmoClock0000'));
	clock.pivot.set(clock.width/2, clock.height/2);
	clock.x = clock.width/2;
	clock.y = clock.height/2;
	ui.addChild(clock);

	arrows = new PIXI.Sprite(PIXI.Texture.from('Icon_Slowmo_Arrows0000'));
	arrows.pivot.set(arrows.width/2, arrows.height/2);

	ui.addChild(arrows);
	arrows.x = arrows.width/2 + 52;
	arrows.y = arrows.height/2 + 40;

	const slomoTextStyle = {textColor:'#FFF', textAlign:'left', fontSize:28, fontName:'Lily Script One', text:''};
	text = game.editor.buildTextGraphicFromObj(slomoTextStyle);
	text.pivot.set(text.width/2, text.height/2);

	ui.addChild(text);
	text.x = text.width/2 + 60;
	text.y = text.height/2;

	const slomoTextShadowStyle = {textColor:'#000', textAlign:'left', fontSize:28, fontName:'Lily Script One', text:''};
	textShadow = game.editor.buildTextGraphicFromObj(slomoTextShadowStyle);
	textShadow.pivot.set(textShadow.width/2, textShadow.height/2);
	ui.addChild(textShadow);

	const shadowPadding = 2;
	textShadow.x = textShadow.width/2 + 60 + shadowPadding;
	textShadow.y = textShadow.height/2 + shadowPadding;

	ui.swapChildren(textShadow, text);

	game.myEffectsContainer.addChild(ui);

	ui.pivot.set(ui.width/2, 0);
	ui.alpha = 0;
}
export const hide = ()=> {
	if(ui){
		hidden = true;
		ui.alpha = 0;
		alertTime = 0;
		colorToggle = false;
	}
}
export const update = () => {
	if(gameSpeed !== game.editor.editorSettingsObject.gameSpeed){
		gameSpeed = game.editor.editorSettingsObject.gameSpeed;
		text.text = gameSpeed.toFixed(1);
		textShadow.text = gameSpeed.toFixed(1);
		arrows.rotation = gameSpeed < 1 ? 0 : Math.PI;
		arrows.scale.y = gameSpeed < 1 ? 1.0 : -1.0;
		hidden = gameSpeed === 1.0;
		alertTime = ALERT_TICKS;
	}
	const alphaDec = 0.02;
	if(hidden && ui.alpha > 0.0) ui.alpha = Math.max(ui.alpha-alphaDec, 0);
	else if(ui.alpha < 1.0) ui.alpha = Math.min(ui.alpha + alphaDec, 1.0);


	if(alertTime > 0){
		alertTime--;
		if(alertTime % 10 === 0){
			colorToggle = !colorToggle;
		}
		if(colorToggle){
			 clock.tint = 0xFF0000;
			 clock.scale.x = clock.scale.y = 1.2;
			 arrows.tint = 0xFF0000;
			 arrows.scale.x = 1.2;
			 arrows.scale.y = gameSpeed < 1 ? 1.2 : -1.2;
			 text.tint = 0xFF0000;
			 text.scale.x = text.scale.y = 1.2;
			 textShadow.tint = 0xFF0000;
			 textShadow.scale.x = textShadow.scale.y = 1.2;
		}
	}
	if(alertTime <= 0 || !colorToggle){
		clock.tint = 0xFFFFFF;
		clock.scale.x = clock.scale.y = 1.0;
		arrows.tint = 0xFFFFFF;
		arrows.scale.x = 1.0;
		arrows.scale.y = gameSpeed < 1 ? 1.0 : -1.0;
		text.tint = 0xFFFFFF;
		text.scale.x = text.scale.y = 1.0;
		textShadow.tint = 0xFFFFFF;
		textShadow.scale.x = textShadow.scale.y = 1.0;
	}
}
