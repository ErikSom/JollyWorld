import * as PIXI from 'pixi.js';
import { game } from '../Game';
import { LOBBY_STATE, multiplayerState } from './multiplayerManager';

export const HUD_STATES = {
	WAITING_PLAYERS: 'waitingPlayers',
	COUNTDOWN: 'waitingPlayers',
}
let hudState = '';
let multiplayerHud = null;
let multiPlayerHudLookup = {};

export const setMultiplayerHud = state => {
	if(!multiplayerHud){
		multiplayerHud = new PIXI.Container();
		game.hudContainer.addChild(multiplayerHud);
	}
	if(hudState !== state){
		clearState();
		hudState = state;
		buildState();
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
		lu.waitingText.text = `Waiting for other players ${playerCount} / ${playersReady}`
	}

}

const buildState = () => {
	const lu = multiPlayerHudLookup;
	if(hudState === HUD_STATES.WAITING_PLAYERS){
		const wordWrapWidth = 300;
		const style = new PIXI.TextStyle({fontFamily:'Montserrat', fontWeight: 800, align:'center', lineJoin:'round', fontSize: 32, fill: 0xFFFFFF, stroke: 0x000000, strokeThickness: 4, wordWrap: true, wordWrapWidth});
		lu.waitingText = new PIXI.Text('Waiting for other players', style);
		multiplayerHud.addChild(lu.waitingText);
		lu.waitingText.x = window.innerWidth / 2 - (wordWrapWidth / 2);
		lu.waitingText.y = 80;
	}
}


const clearState = () => {
	if(multiplayerHud){
		multiPlayerHudLookup = {};
		while(multiplayerHud.children.length>1){
            multiplayerHud.removeChild(multiplayerHud.children[1]);
        }
	}
}
