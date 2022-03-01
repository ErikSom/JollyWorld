import './hud.scss';

import * as PIXI from 'pixi.js';
import { game } from '../Game';
import { Settings } from '../Settings';
import { getModdedPortrait } from '../utils/ModManager';
import { adminReturnToLobby, adminStartLoadLevel, LOBBY_STATE, multiplayerState, returnToLobby, sendChatMessage, sendSimpleMessageAll } from './multiplayerManager';
import { multiplayerAtlas } from './rippleCharacter';
import { backendManager } from '../utils/BackendManager';
import { Key } from '../../libs/Key';
import { SIMPLE_MESSAGE_TYPES } from './schemas';
import { localize } from '../utils/Localization';

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
	if(Key.isPressed(Key.ENTER)){
		if(chat){
			const input = chat.querySelector('.input');
			if(document.activeElement !== input){
				input.focus();
				Key.reset();
			}
		}
	}

	if(chat && !chat.classList.contains('active') && lastChatMessage && lastChatMessage + Settings.chatIdleHideTime < performance.now()){
		chat.classList.add('fadeout');
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
		lu.waitingText.innerText = `${localize('multiplayer_waitingplayers').replace('%%', playersReady).replace('**',playerCount)}`;
	}else if(hudState === HUD_STATES.COUNTDOWN){
		const timeLeft = Math.max(0, Math.ceil(lu.countDownTime / 1000));

		lu.countDownTime -= game.editor.deltaTime;

		if(lu.countDownTime > 0){
			lu.countDownText.innerText = `${localize('multiplayer_startingin').replace('%%', timeLeft)}`;
		} else {
			lu.countDownText.innerText = localize('multiplayer_go');
			game.run = true;

			if(lu.countDownTime < -1000){
				if(hudState === HUD_STATES.COUNTDOWN){
					setMultiplayerHud('');
				}
			}
		}
	} else if([HUD_STATES.GAME_WIN_CAM, HUD_STATES.GAME_END_COUNTDOWN].includes(hudState)){
		const timeLeft = Math.max(0, Math.ceil(multiplayerState.endTime / 1000));
		lu.gameEnds.innerText = `${localize('multiplayer_countdown').replace('%%', timeLeft)}`;
	} else if(hudState === HUD_STATES.PICK_NEXT_LEVEL){
		if(multiplayerState.levelVotes){
			lu.votesCounts.forEach((el, i) => {
				const count = multiplayerState.levelVotes[i];
				el.innerText = count;
				if(count>0){
					el.classList.add('not-zero');
				}else{
					el.classList.remove('not-zero');
				}
			});

			lu.voteButtonTexts.forEach((el, i) => {
				if(multiplayerState.admin){
					el.innerText = i === 0 ? localize('multiplayer_replay') : localize('levelbanner_select');
				}else{
					if(el.classList.contains('selected')){
						el.innerText = localize('multiplayer_voted');
					}else {
						el.innerText = i === 0 ? localize('multiplayer_replay') : localize('multiplayer_vote');
					}
				}
			});
		}
	}
}

const buildState = data => {
	const lu = multiPlayerHudLookup;

	const content = document.createElement('div');
	content.classList.add('content');
	if(hudState) multiplayerHud.appendChild(content);

	if(hudState === HUD_STATES.WAITING_PLAYERS){
		lu.waitingText = document.createElement('div');
		lu.waitingText.classList.add('header');
		lu.waitingText.innerText = localize('multiplayer_waitingplayers').replace('%%', '?').replace('**', '?');
		content.appendChild(lu.waitingText);

		updateLeaderboard();
	} else if(hudState === HUD_STATES.COUNTDOWN){
		lu.countDownTime = Settings.startGameTimer - data.ping;
		lu.countDownText = document.createElement('div');
		lu.countDownText.classList.add('header');
		lu.countDownText.innerText = localize('multiplayer_startingin').replace('%%', Settings.startGameTimer / 1000);
		content.appendChild(lu.countDownText);
		// show time
	} else if(hudState === HUD_STATES.GAME_WIN_CAM){
		const winText = document.createElement('div');
		winText.innerText = localize('levelgui_youwin');
		winText.classList.add('header');

		const waitingText = document.createElement('div');
		waitingText.innerText = localize('multiplayer_waitingforothers');
		waitingText.classList.add('header');
		waitingText.style.fontSize = '14px';


		const switchCameraBut = document.createElement('button');
		switchCameraBut.innerText = localize('multiplayer_switchcamera');
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
		lu.gameEnds.innerText = localize('multiplayer_countdown').replace('%%', Settings.endGameTimer / 1000);
		lu.gameEnds.style.margin = '60px 0px';
		lu.gameEnds.classList.add('header');


		content.appendChild(winText);
		content.appendChild(waitingText);
		content.appendChild(switchCameraBut);
		content.appendChild(lu.gameEnds);
	} else if(hudState === HUD_STATES.GAME_END_COUNTDOWN){

		const endText = document.createElement('div');
		endText.innerText = localize('multiplayer_gameendssoon');
		endText.classList.add('header');

		lu.gameEnds = document.createElement('div');
		lu.gameEnds.innerText = localize('multiplayer_countdown').replace('%%', Settings.endGameTimer / 1000);
		lu.gameEnds.style.margin = '60px 0px';
		lu.gameEnds.classList.add('header');


		content.appendChild(endText);
		content.appendChild(lu.gameEnds);
	} else if(hudState === HUD_STATES.PICK_NEXT_LEVEL){
		lu.waitingText = document.createElement('div');
		lu.waitingText.classList.add('header');
		lu.waitingText.innerText = multiplayerState.admin ? localize('multiplayer_gamefinished_admin') : localize('multiplayer_gamefinished_client');
		content.appendChild(lu.waitingText);

		const voteContainer = document.createElement('div');
		voteContainer.classList.add('vote-container');
		content.appendChild(voteContainer);

		const voteInnerContainers = [];
		const gameTemplates = [];

		const singlePlayer = customGUIContainer.querySelector('.singleplayer');
        const gameTemplate = singlePlayer.querySelector('.game-template');


		for(let i = 0; i<4; i++){
			let innerContainer = null;
			if(i % 2 === 0){
				innerContainer = document.createElement('div');
				innerContainer.classList.add('vote-inner-container');
				voteContainer.appendChild(innerContainer);
				voteInnerContainers.push(innerContainer);
			}else{
				innerContainer = voteInnerContainers[Math.floor(i/2)];
			}
			const voteLevel = document.createElement('div');
			voteLevel.classList.add('vote-level');
			innerContainer.appendChild(voteLevel);

			const levelInfo = gameTemplate.cloneNode(true)
            levelInfo.style.display = 'block';
            levelInfo.classList.remove('game-template');
			gameTemplates.push(levelInfo);

			voteLevel.appendChild(levelInfo);

			if(!lu.voteButtonTexts){
				lu.voteButtonTexts = [];
				lu.votesCounts = [];
			}

			const voteButtonContainer = document.createElement('div');
			voteButtonContainer.classList.add('vote-button-container');
			voteLevel.appendChild(voteButtonContainer);

			const voteButton = document.createElement('div');
			voteButton.classList.add('vote-button');
			voteButton.innerText = i === 0 ? localize('multiplayer_replay') : localize('multiplayer_vote');
			voteButtonContainer.appendChild(voteButton);
			lu.voteButtonTexts.push(voteButton);

			voteLevel.onclick = () => {
				if(multiplayerState.admin && game.gameState !== game.GAMESTATE_LOADINGDATA){
					// TODO: put multiple prompts here
					multiplayerState.selectedLevelData = multiplayerState.voteLevels[i];
					multiplayerState.selectedLevel = multiplayerState.selectedLevelData.id;

					adminStartLoadLevel();
				} else {
					if(!voteButton.classList.contains('selected')){
						sendSimpleMessageAll(SIMPLE_MESSAGE_TYPES[`VOTE_LEVEL_${i+1}`]);
						lu.voteButtonTexts.forEach(but => but.classList.remove('selected'));
						voteButton.classList.add('selected');
					}
				}
			}

			const voteCount = document.createElement('div');
			voteCount.classList.add('vote-count-container');
			voteCount.innerText = `${localize('levelbanner_votes')}:`;
			voteButtonContainer.appendChild(voteCount);

			const votes = document.createElement('div');
			votes.classList.add('vote-count')
			votes.innerText = '0';
			voteCount.appendChild(votes);
			lu.votesCounts.push(votes);
		}

		const buildVoteLevels = () => {
			if(hudState === HUD_STATES.PICK_NEXT_LEVEL){
				if(multiplayerState.voteLevels.length){
					multiplayerState.voteLevels.forEach((levelData, i) => {
						const gameTemplate = gameTemplates[i];
						game.ui.setLevelDataOnGameTile(gameTemplate, levelData);

						const thumb = gameTemplate.querySelector('.thumb');
						thumb.style.backgroundImage = `url(${thumb.getAttribute('data-src')})`;
						gameTemplate.classList.add('loaded')
					});
				} else {
					setTimeout(buildVoteLevels, 100); // try again in 100ms
				}
			}
		}

		buildVoteLevels();

		if(multiplayerState.admin){
			const exitToLobby = document.createElement('button');
			exitToLobby.innerText = localize('multiplayer_returntolobby');
			exitToLobby.classList.add('return-lobby');

			exitToLobby.onclick = () => {
				adminReturnToLobby();
				returnToLobby();
			}

			content.appendChild(exitToLobby);
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

	showLeaderboard(false);
	showChat(false);
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

export const showLeaderboard = bool => {
	if(bool) leaderboardContainer.style.display = 'block';
	else leaderboardContainer.style.display = 'none';
}


let disableChatAreaTimeout = -1;
const buildChat = () => {
	if(!chat){
		chat = document.createElement('div');
		chat.classList.add('mp-chat');

		chat.innerHTML = `
		<div class="chat-area"></div>
		<input class="input" maxlength=200 placeholder="${localize('multiplayer_tochat')}"></input>
		`;

		const input = chat.querySelector('.input');
		input.addEventListener("keydown", event => {
			if (event.key === "Enter") {
				if(input.value)	sendChatMessage(input.value);
				input.value = '';
			}else if(event.key === "Escape"){
				input.value = '';
				input.blur();
				event.stopPropagation();
			}
		});

		const focusChat = () => {
			clearTimeout(disableChatAreaTimeout);
			chat.classList.add('active');
			chat.classList.remove('fadeout');
		}

		const blurChat = () => {
			if(document.activeElement !== input){
				disableChatAreaTimeout = setTimeout(()=>{
					chat.classList.remove('active');
					lastChatMessage = performance.now();
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
	customGUIContainer.appendChild(chat);
}

let lastChatMessage = 0;
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

		chat.classList.remove('fadeout');
		lastChatMessage = performance.now();
	}
}

export const showChat = bool => {
	if(bool) chat.style.display = 'block';
	else chat.style.display = 'none';
}
