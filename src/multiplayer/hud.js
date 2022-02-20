import * as PIXI from 'pixi.js';
import { game } from '../Game';
import { LOBBY_STATE, multiplayerState } from './multiplayerManager';

export const HUD_STATES = {
	WAITING_PLAYERS: 'waitingPlayers',
	COUNTDOWN: 'countDown',
}
let hudState = '';
let multiplayerHud = null;
let multiPlayerHudLookup = {};

export const setMultiplayerHud = (state, data) => {
	if(!multiplayerHud){
		multiplayerHud = new PIXI.Container();
		game.hudContainer.addChild(multiplayerHud);
	}
	if(hudState !== state){
		clearState();
		hudState = state;
		buildState(data);
	}
}


export const updateMultiplayerHud = () => {
	if(!hudState) return;

	const lu = multiPlayerHudLookup;
	if(hudState === HUD_STATES.WAITING_PLAYERS){
		let playerCount = 1;
		let playersReady = 1;
		for(let playerID in multiplayerState.players){
			playerCount++;
			if(multiplayerState.players[playerID].playerState.lobbyState === LOBBY_STATE.FINISHED_LOADING_LEVEL){
				playersReady++;
			}
		}
		lu.waitingText.text = `Waiting for other players ${playersReady} / ${playerCount}`;
	}else if(hudState === HUD_STATES.COUNTDOWN){
		const timeLeft = Math.max(0, Math.ceil(lu.countDownTime / 1000));

		lu.countDownTime -= game.editor.deltaTime;

		if(lu.countDownTime > 0){
			lu.countDownText.text = `Starting in ${timeLeft}..`;
		} else {
			lu.countDownText.text = 'GO!!!';
			game.run = true;

			if(lu.countDownTime < -1000){
				setMultiplayerHud('');
			}
		}
	}

}

const buildState = data => {
	const lu = multiPlayerHudLookup;
	const wordWrapWidth = 300;

	if(hudState === HUD_STATES.WAITING_PLAYERS){
		const style = new PIXI.TextStyle({fontFamily:'Montserrat', fontWeight: 800, align:'center', lineJoin:'round', fontSize: 32, fill: 0xFFFFFF, stroke: 0x000000, strokeThickness: 4, wordWrap: true, wordWrapWidth});
		lu.waitingText = new PIXI.Text('Waiting for other players', style);
		multiplayerHud.addChild(lu.waitingText);
		lu.waitingText.anchor.set(0.5, 0.5);
		lu.waitingText.x = window.innerWidth / 2;
		lu.waitingText.y = 80;
	} else if(hudState === HUD_STATES.COUNTDOWN){
		lu.countDownTime = 3000 - data.ping;
		const style = new PIXI.TextStyle({fontFamily:'Montserrat', fontWeight: 800, align:'center', lineJoin:'round', fontSize: 32, fill: 0xFFFFFF, stroke: 0x000000, strokeThickness: 4, wordWrap: true, wordWrapWidth});
		lu.countDownText = new PIXI.Text('Starting in 3..', style);
		multiplayerHud.addChild(lu.countDownText);
		lu.countDownText.anchor.set(0.5, 0.5);
		lu.countDownText.x = window.innerWidth / 2;
		lu.countDownText.y = 80;
		// show time
	}
}


const clearState = () => {
	if(multiplayerHud){
		multiPlayerHudLookup = {};
		while(multiplayerHud.children.length>0){
            multiplayerHud.removeChild(multiplayerHud.children[0]);
        }
	}
}
