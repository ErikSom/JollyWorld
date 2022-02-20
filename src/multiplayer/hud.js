import * as PIXI from 'pixi.js';
import { game } from '../Game';
import { Settings } from '../Settings';
import { getModdedPortrait } from '../utils/ModManager';
import { LOBBY_STATE, multiplayerState } from './multiplayerManager';

export const HUD_STATES = {
	WAITING_PLAYERS: 'waitingPlayers',
	COUNTDOWN: 'countDown',
	GAME_END_COUNTDOWN: 'gameEndCountDown',
	GAME_WIN_CAM: 'gameWinCam',
	PICK_NEXT_LEVEL: 'pickNextLevel',
}
let hudState = '';
let multiplayerHud = null;
let multiPlayerHudLookup = {};

let leaderboardContainer = null;
let myProfile = null;
const leaderboardIcons = [];
const leaderboardNames = [];
const leaderboardIds = [];

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

	const basicTextHeight = 80;
	const basicTextStyle = new PIXI.TextStyle({fontFamily:'Montserrat', fontWeight: 800, align:'center', lineJoin:'round', fontSize: 32, fill: 0xFFFFFF, stroke: 0x000000, strokeThickness: 4, wordWrap: true, wordWrapWidth});

	if(hudState === HUD_STATES.WAITING_PLAYERS){
		lu.waitingText = new PIXI.Text('Waiting for other players', basicTextStyle);
		multiplayerHud.addChild(lu.waitingText);
		lu.waitingText.anchor.set(0.5, 0.5);
		lu.waitingText.x = window.innerWidth / 2;
		lu.waitingText.y = basicTextHeight;

		buildLeaderboard();

	} else if(hudState === HUD_STATES.COUNTDOWN){
		lu.countDownTime = 3000 - data.ping;
		lu.countDownText = new PIXI.Text('Starting in 3..', basicTextStyle);
		multiplayerHud.addChild(lu.countDownText);
		lu.countDownText.anchor.set(0.5, 0.5);
		lu.countDownText.x = window.innerWidth / 2;
		lu.countDownText.y = basicTextHeight;
		// show time
	} else if(hudState === HUD_STATES.GAME_WIN_CAM){
		lu.winText = new PIXI.Text('You Won!', basicTextStyle);
		multiplayerHud.addChild(lu.winText);
		lu.winText.x = window.innerWidth / 2;
		lu.countDownText.y = basicTextHeight;
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

const buildLeaderboard = () => {
	if(!leaderboardContainer){
		leaderboardContainer = new PIXI.Container();
		game.hudContainer.addChild(leaderboardContainer);
	}

	while(leaderboardContainer.children.length>0){
		leaderboardContainer.removeChild(leaderboardContainer.children[0]);
	}

	const leaderboardNameStyle = new PIXI.TextStyle({fontFamily:'Montserrat', fontWeight: 800, align:'left', lineJoin:'round', fontSize: 14, fill: 0xFFFFFF, stroke: 0x000000, strokeThickness: 2});
	const iconHeight = 28;
	const paddingX = 10;
	const paddingY = 56;
	for(let i = 0; i< Settings.maxMultiplayerPlayers; i++){
		const icon = new PIXI.Sprite();
		icon.anchor.set(0, 0.5);
		icon.scale.x = icon.scale.y = 0.36;
		leaderboardIcons.push(icon);
		leaderboardContainer.addChild(icon);
		const name = new PIXI.Text('Player', leaderboardNameStyle);
		name.anchor.set(0, 0.5);
		leaderboardNames.push(name);
		leaderboardContainer.addChild(name);

		icon.x = paddingX;
		icon.y = paddingY + i * iconHeight;
		name.x = paddingX + iconHeight * 1.1;
		name.y = icon.y;
	}

	for(let playerID in multiplayerState.players){
		leaderboardIds.push(playerID);
	}

	updateLeaderboard();
}

export const updateLeaderboard = () => {

	if(!myProfile && myProfile !== 'loading'){
		myProfile = 'loading';
		getModdedPortrait(`profile${game.selectedCharacter+1}.png`, 'assets/images/portraits/').then(url =>{
			if(leaderboardIcons[0]) leaderboardIcons[0].texture = PIXI.Texture.from(url);
			myProfile = url;
		});
	}

	for(let i = 0; i< Settings.maxMultiplayerPlayers - 1; i++){
		const id = leaderboardIds[i];
		if(id){
			const player = multiplayerState.players[id];
			if(player){
				if(player.spriteSheet){
					leaderboardIcons[i + 1].texture = player.spriteSheet.textures['profile'];
				}
				if(player.playerState.name){
					leaderboardNames[i + 1].text = player.playerState.name;
				}
			}else{
				// show disconnect
			}
			leaderboardIcons[i + 1].visible = true;
			leaderboardNames[i + 1].visible = true;
		}else{
			leaderboardIcons[i + 1].visible = false;
			leaderboardNames[i + 1].visible = false;
		}
	}
}
