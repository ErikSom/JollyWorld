import './hud.scss';

import * as PIXI from 'pixi.js';
import { game } from '../Game';
import { Settings } from '../Settings';
import { getModdedPortrait } from '../utils/ModManager';
import { adminReturnToLobby, LOBBY_STATE, multiplayerState, returnToLobby, sendChatMessage } from './multiplayerManager';
import { multiplayerAtlas } from './rippleCharacter';
import { backendManager } from '../utils/BackendManager';
import { Key } from '../../libs/Key';

export const HUD_STATES = {
	WAITING_PLAYERS: 'waitingPlayers',
	COUNTDOWN: 'countDown',
	GAME_END_COUNTDOWN: 'gameEndCountDown',
	GAME_WIN_CAM: 'gameWinCam',
	PICK_NEXT_LEVEL: 'pickNextLevel',
}

export const CHAT_AUTHOR_TYPES = {
	DEFAULT: 0,
	VIP: 1,
	// VIP?
	// MODERATOR?
}

const customGUIContainer = document.getElementById('game-ui-container');

let hudState = '';
let multiplayerHud = null;
let multiPlayerHudLookup = {};

let leaderboardContainer = null;
const leaderboardProfiles = [];
const leaderboardNames = [];
const leaderboardIds = [];

let chat = null;
let chatArea = null;

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
	if(Key.isPressed(Key.SLASH)){
		if(chat){
			const input = chat.querySelector('.input');
			input.focus();
		}
	}

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

export const buildLeaderboard = () => {
	if(!leaderboardContainer){
		leaderboardContainer = document.createElement('div');
		leaderboardContainer.classList.add('mp-leaderboard');
		customGUIContainer.appendChild(leaderboardContainer);
	}

	while(leaderboardContainer.firstChild){
		leaderboardContainer.removeChild(leaderboardContainer.firstChild);
	}

	leaderboardIds.length = 0;
	leaderboardProfiles.length = 0;
	leaderboardNames.length = 0;

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
	if(multiplayerState.skinBlob){
		leaderboardProfiles[0].style.backgroundImage = `url(${URL.createObjectURL(multiplayerState.skinBlob)})`;
		leaderboardNames[0].innerText = backendManager.userData?.username || multiplayerState.fakeUsername;
	}

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

let disableChatAreaTimeout = -1;
const buildChat = () => {
	if(!chat){
		chat = document.createElement('div');
		chat.classList.add('mp-chat');

		chat.innerHTML = `
		<div class="chat-area"></div>
		<input class="input" maxlength=200 placeholder="To chat click here or press '/' key"></input>
		`;

		const input = chat.querySelector('.input');
		input.addEventListener("keydown", event => {
			if (event.key === "Enter") {
				if(input.value)	sendChatMessage(input.value);
				input.value = '';
			}else if(event.key === "Escape"){
				input.value = '';
				input.blur();
			}
		});

		const focusChat = () => {
			clearTimeout(disableChatAreaTimeout);
			chat.classList.add('active');
		}

		const blurChat = () => {
			if(document.activeElement !== input){
				disableChatAreaTimeout = setTimeout(()=>{
					chat.classList.remove('active');
				}, Settings.chatBlurTimeout);
			}
		}

		chat.onpointerover = focusChat;
		chat.onpointerleave = blurChat;
		input.onfocus = focusChat;
		input.onblur = blurChat;

		chatArea = chat.querySelector('.chat-area');

		focusChat();
		blurChat();
	}

	leaderboardContainer.appendChild(chat);
}

export const processChatMessage = (name, type, admin, message) => {
	if(chatArea){
		const messageDiv = document.createElement('div');
		messageDiv.classList.add('message');

		const author = document.createElement('div');
		author.innerText = `${name}:`;
		author.classList.add('author');

		if(admin) author.classList.add('admin');

		const text = document.createElement('div');
		text.innerText = message;
		author.classList.add('text');

		messageDiv.appendChild(author);
		messageDiv.appendChild(text);


		const rest = chatArea.scrollHeight - chatArea.scrollTop;
		let autoScroll = false;
		if(Math.abs(chatArea.clientHeight - rest) < 3){
			autoScroll = true;
		};

		chatArea.appendChild(messageDiv);

		if(chatArea.children.length > Settings.maxChatMessages){
			chatArea.removeChild(chatArea.firstChild);
		}

		if(autoScroll){
			chatArea.scrollTop = chatArea.scrollHeight;
		}
	}
}
