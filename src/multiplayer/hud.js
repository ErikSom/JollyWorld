import './hud.scss';

import * as PIXI from 'pixi.js';
import { game } from '../Game';
import { Settings } from '../Settings';
import { getModdedPortrait } from '../utils/ModManager';
import { adminReturnToLobby, LOBBY_STATE, multiplayerState, returnToLobby } from './multiplayerManager';
import { multiplayerAtlas } from './rippleCharacter';
import { backendManager } from '../utils/BackendManager';

export const HUD_STATES = {
	WAITING_PLAYERS: 'waitingPlayers',
	COUNTDOWN: 'countDown',
	GAME_END_COUNTDOWN: 'gameEndCountDown',
	GAME_WIN_CAM: 'gameWinCam',
	PICK_NEXT_LEVEL: 'pickNextLevel',
}

const customGUIContainer = document.getElementById('game-ui-container');

let hudState = '';
let multiplayerHud = null;
let multiPlayerHudLookup = {};

let leaderboardContainer = null;
const leaderboardProfiles = [];
const leaderboardNames = [];
const leaderboardIds = [];

export const setMultiplayerHud = (state, data) => {
	if(!multiplayerHud){
		multiplayerHud = document.createElement('div');
		multiplayerHud.classList.add('mp-hud');
		customGUIContainer.appendChild(multiplayerHud);
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
		lu.waitingText.innerText = `Waiting for other players ${playersReady} / ${playerCount}`;
	}else if(hudState === HUD_STATES.COUNTDOWN){
		const timeLeft = Math.max(0, Math.ceil(lu.countDownTime / 1000));

		lu.countDownTime -= game.editor.deltaTime;

		if(lu.countDownTime > 0){
			lu.countDownText.innerText = `Starting in ${timeLeft}..`;
		} else {
			lu.countDownText.innerText = 'GO!!!';
			game.run = true;

			if(lu.countDownTime < -1000){
				if(hudState === HUD_STATES.COUNTDOWN){
					setMultiplayerHud('');
				}
			}
		}
	} else if([HUD_STATES.GAME_WIN_CAM, HUD_STATES.GAME_END_COUNTDOWN].includes(hudState)){
		const timeLeft = Math.max(0, Math.ceil(multiplayerState.endTime / 1000));
		lu.gameEnds.innerText = `Game ends in ${timeLeft}s`;
	}
}

const buildState = data => {
	const lu = multiPlayerHudLookup;

	if(hudState === HUD_STATES.WAITING_PLAYERS){
		lu.waitingText = document.createElement('div');
		lu.waitingText.classList.add('content');
		lu.waitingText.innerText = 'Waiting for other players';
		multiplayerHud.appendChild(lu.waitingText);

		buildLeaderboard();

	} else if(hudState === HUD_STATES.COUNTDOWN){
		lu.countDownTime = Settings.startGameTimer - data.ping;
		lu.countDownText = document.createElement('div');
		lu.countDownText.classList.add('content');
		lu.countDownText.innerText = 'Starting in 3..';
		multiplayerHud.appendChild(lu.countDownText);
		// show time
	} else if(hudState === HUD_STATES.GAME_WIN_CAM){
		lu.winCam = document.createElement('div');
		lu.winCam.classList.add('content');
		multiplayerHud.appendChild(lu.winCam);


		const winText = document.createElement('div');
		winText.innerText = 'You Win!';

		const waitingText = document.createElement('div');
		waitingText.innerText = 'Waiting for other players to finish';
		waitingText.style.fontSize = '14px';

		const switchCameraBut = document.createElement('button');
		switchCameraBut.innerText = 'Switch Camera';
		switchCameraBut.classList.add('switch-cam');

		switchCameraBut.onclick = () => {
			console.log('BEAM! switched camera');
			const playerID = Object.keys(multiplayerState.players)[0];
			game.cameraFocusObject = {
				GetPosition: () => {
					const x = multiplayerState.players[playerID].sprite.x  / Settings.PTM;
					const y = multiplayerState.players[playerID].sprite.y  / Settings.PTM;
					return {x, y};
				},
				GetLinearVelocity: () => {
					const x = multiplayerState.players[playerID].sprite.velocity.x  / Settings.PTM;
					const y = multiplayerState.players[playerID].sprite.velocity.y  / Settings.PTM;;
					return {x, y};
				}
			}
		}

		lu.gameEnds = document.createElement('div');
		lu.gameEnds.innerText = 'Game ends in 60s';
		lu.gameEnds.style.margin = '60px 0px';

		lu.winCam.appendChild(winText);
		lu.winCam.appendChild(waitingText);
		lu.winCam.appendChild(switchCameraBut);
		lu.winCam.appendChild(lu.gameEnds);
	} else if(hudState === HUD_STATES.GAME_END_COUNTDOWN){
		lu.winCam = document.createElement('div');
		lu.winCam.classList.add('content');
		multiplayerHud.appendChild(lu.winCam);


		const endText = document.createElement('div');
		endText.innerText = 'Players finished, game is ending soon..';

		lu.gameEnds = document.createElement('div');
		lu.gameEnds.innerText = 'Game ends in 60s';
		lu.gameEnds.style.margin = '60px 0px';

		lu.winCam.appendChild(endText);
		lu.winCam.appendChild(lu.gameEnds);
	} else if(hudState === HUD_STATES.PICK_NEXT_LEVEL){
		lu.waitingText = document.createElement('div');
		lu.waitingText.classList.add('content');
		lu.waitingText.innerText = 'Game finished, vote for next level';
		multiplayerHud.appendChild(lu.waitingText);

		if(multiplayerState.admin){
			const exitToLobby = document.createElement('button');
			exitToLobby.innerText = 'Return to Lobby';
			exitToLobby.classList.add('return-lobby');

			exitToLobby.onclick = () => {
				adminReturnToLobby();
				returnToLobby();
			}

			lu.waitingText.appendChild(exitToLobby);
		}

	}
}


const clearState = () => {
	if(multiplayerHud){
		multiPlayerHudLookup = {};
		while(multiplayerHud.firstChild){
            multiplayerHud.removeChild(multiplayerHud.firstChild);
        }
	}
}

const buildLeaderboard = () => {
	if(!leaderboardContainer){
		leaderboardContainer = document.createElement('div');
		leaderboardContainer.classList.add('mp-leaderboard');
		customGUIContainer.appendChild(leaderboardContainer);
	}

	while(leaderboardContainer.firstChild){
		leaderboardContainer.removeChild(leaderboardContainer.firstChild);
	}


	for(let i = 0; i< Settings.maxMultiplayerPlayers; i++){

		const entry = document.createElement('div');
		entry.classList.add('entry');
		leaderboardContainer.appendChild(entry);

		const profile = document.createElement('div');
		profile.classList.add('profile');
		leaderboardProfiles.push(profile);
		entry.appendChild(profile);

		const name = document.createElement('div');
		name.classList.add('name');
		leaderboardNames.push(name);
		entry.appendChild(name);
	}

	for(let playerID in multiplayerState.players){
		leaderboardIds.push(playerID);
	}

	buildChat();

	updateLeaderboard();
}

export const updateLeaderboard = () => {
	leaderboardProfiles[0].style.backgroundImage = `url(${URL.createObjectURL(multiplayerState.skinBlob)})`;
	leaderboardNames[0].innerText = backendManager.userData?.username || multiplayerState.fakeUsername;

	for(let i = 0; i< Settings.maxMultiplayerPlayers - 1; i++){
		const id = leaderboardIds[i];
		if(id){
			const player = multiplayerState.players[id];
			if(player){
				if(player.skinBlob){
					leaderboardProfiles[i + 1].style.backgroundImage = `url(${URL.createObjectURL(player.skinBlob)})`;
				}
				if(player.playerState.name){
					leaderboardNames[i + 1].innerText = player.playerState.name;
				}
			}else{
				// show disconnect
			}
			leaderboardProfiles[i + 1].parentNode.style.display = 'flex';
		}else{
			leaderboardProfiles[i + 1].parentNode.style.display = 'none';
		}
	}
}

const buildChat = () => {
	const chatBox = document.createElement('div');
	chatBox.classList.add('mp-chat');

	chatBox.innerHTML = `
		<div class="icon">icon</div>
		<textarea class="chat-area"></textarea>
		<input class="input" maxlength=200 placheholder="To chat click here or press "/" key"></input>
	`;

	leaderboardContainer.appendChild(chatBox);
}
