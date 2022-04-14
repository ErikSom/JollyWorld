import { Key } from '../../libs/Key';
import { timeFormat } from '../b2Editor/utils/formatString';
import { game } from '../Game'
import { Settings } from '../Settings';
import { updateLobbyUI } from '../ui/lobby';
import { backendManager } from '../utils/BackendManager';
import { globalEvents } from '../utils/EventDispatcher';
import { getModdedPortrait } from '../utils/ModManager';
import { initHud, CHAT_AUTHOR_TYPES, HUD_STATES, processChatMessage, setMultiplayerHud, showChat, showLeaderboard, updateLeaderboard, hudState } from './hud';
import { characterFromBuffer, characterToBuffer, dataFromAdminIntroductionBuffer, dataFromChangeServerLevelBuffer, dataFromChatMessageBuffer, dataFromEndCountDownMessageBuffer, dataFromIntroductionBuffer, dataFromLevelVotesMessageBuffer, dataFromLevelWonBuffer, dataFromSimpleMessageBuffer, dataFromStartLoadLevelBuffer, dataToAdminIntroductionBuffer, dataToChangeServerLevelBuffer, dataToChatMessageBuffer, dataToEndCountDownMessageBuffer, dataToIntroductionBuffer, dataToLevelVotesMessageBuffer, dataToLevelWonBuffer, dataToSimpleMessageBuffer, dataToStartLoadLevelBuffer } from './messagePacker';
import { multiplayerAtlas, PLAYER_STATUS, RippleCharacter } from './rippleCharacter';
import { introductionModel, SIMPLE_MESSAGE_TYPES } from './schemas';
import server, { SERVER_EVENTS } from './server';

let tickID = 0
const ticksPerSecond = 20;
let syncInterval = null;

export const LOBBY_STATE = {
	OFFLINE: -1,
	CONNECTING: 0,
	WAITING: 1,
	READY: 2,
	LOADING_LEVEL: 3,
	FINISHED_LOADING_LEVEL: 4,
	PLAYING: 5,
	WON_LEVEL: 6,
	VOTING: 7,
}

export const multiplayerState = {
	debug: false,
	admin: false,
	ready: false,
	lobby: '',
	peersConnected: 0,
	misc: '',
	sendPackageID: -1,
	players: {},
	selectedLevel: '',
	selectedLevelData: null,
	lobbyState: LOBBY_STATE.OFFLINE,
	endTime: 0,
	vip: false,
	finishTime: -1,
	skinBlob: null,
	voteLevels: [],
	levelVoters: {},
	levelVotes: [0, 0, 0, 0],
	fakeUsername: `Jolly${(Math.floor(Math.random()*100000)).toString().padStart(5, '0')}`,
}

window.multiplayerState = multiplayerState;


export const startMultiplayer = () => {
	globalEvents.addEventListener(SERVER_EVENTS.JOINED_LOBBY, didJoinLobby);
	globalEvents.addEventListener(SERVER_EVENTS.LEFT_LOBBY, didLeaveLobby);
	globalEvents.addEventListener(SERVER_EVENTS.PLAYER_JOINED, playerJoined);
	globalEvents.addEventListener(SERVER_EVENTS.PLAYER_LEFT, playerLeft);
	globalEvents.addEventListener(SERVER_EVENTS.PLAYER_INTRODUCTION, playerIntroduction);
	globalEvents.addEventListener(SERVER_EVENTS.SIMPLE_MESSAGE, handleSimpleMessage);
	globalEvents.addEventListener(SERVER_EVENTS.CHANGE_LEVEL, handleChangeLevel);
	globalEvents.addEventListener(SERVER_EVENTS.START_LOAD_LEVEL, handleStartLoadLevel);
	globalEvents.addEventListener(SERVER_EVENTS.RECEIVE_SKIN, handleReceiveSkin);
	globalEvents.addEventListener(SERVER_EVENTS.LEVEL_WON, handleReceiveLevelWon);
	globalEvents.addEventListener(SERVER_EVENTS.CHAT_MESSAGE, handleReceiveChatMessage);
	globalEvents.addEventListener(SERVER_EVENTS.END_COUNTDOWN, handleEndCountDownMessage);
	globalEvents.addEventListener(SERVER_EVENTS.LEVEL_VOTES, handleLevelVotesMessage);
	globalEvents.addEventListener(SERVER_EVENTS.NETWORK_READY, networkReady);

	server.connect();

	initHud();
	prepareSkinForSending();
}

export const networkReady = () => {
	multiplayerState.ready = true;
}

export const autoConnectLobby = id => {
	multiplayerState.lobbyState = LOBBY_STATE.CONNECTING;
	game.gameState = game.GAMESTATE_LOBBY;

	if(multiplayerState.ready){
		server.joinLobby(id);
	}else{
		setTimeout(()=>{
			autoConnectLobby(id);
		}, 100);
	}
}

export const createLobby = () => {
	multiplayerState.lobbyState = LOBBY_STATE.CONNECTING;
	server.createLobby();
}

export const setLobbyStateReady = ready => {
	multiplayerState.lobbyState = ready ? LOBBY_STATE.READY : LOBBY_STATE.WAITING;

	const messageType = ready ? SIMPLE_MESSAGE_TYPES.PLAYER_READY : SIMPLE_MESSAGE_TYPES.PLAYER_NOT_READY;
	sendSimpleMessageAll(messageType);

	updateLobbyUI();
}

export const returnToLobby = () => {
	resetMultiplayer();

	setMultiplayerHud('');

	game.stopWorld();
	game.openMainMenu();
	game.ui.setMainMenuActive('lobby');
	game.gameState = game.GAMESTATE_LOBBY;

	showLeaderboard(false);

	updateLobbyUI();
}

export const returnToMultiplayer = () => {
	resetMultiplayer();

	setMultiplayerHud('');

	game.stopWorld();
	game.openMainMenu();
	game.ui.setMainMenuActive('multiplayer');
	game.gameState = game.GAMESTATE_MENU;

	showLeaderboard(false);

	updateLobbyUI();
}

export const leaveMultiplayer = () => {
	server.disconnect();
	showLeaderboard(false);
	showChat(false);
	multiplayerState.lobbyState = LOBBY_STATE.OFFLINE;
}

export const resetMultiplayer = () => {
	const players = Object.values(multiplayerState.players);
	players.forEach(player => {
		player.playerState.lobbyState = LOBBY_STATE.WAITING;
		player.playerState.ready = false;
		player.playerState.status = 0;
		player.playerState.finishTime = -1;
		player.lastStatusChange = 0;
	});
	multiplayerState.endTime = 0;
	multiplayerState.finishTime = -1;
	multiplayerState.lobbyState = LOBBY_STATE.WAITING;
	multiplayerState.levelVoters = {};
	multiplayerState.levelVotes = [0, 0, 0, 0];
}

export const selectMultiplayerLevel = levelData => {
	if(!multiplayerState.admin) return;
	multiplayerState.selectedLevel = levelData.id;
	multiplayerState.selectedLevelData = levelData;
	const messageBuffer = dataToChangeServerLevelBuffer(multiplayerState.selectedLevel);
	server.sendSimpleMessageAll(messageBuffer);
	game.openMainMenu();
}

export const sendSimpleMessageAll = messageType => {
	const simpleMessageBuffer = dataToSimpleMessageBuffer(messageType);
	server.sendSimpleMessageAll(simpleMessageBuffer);
}

export const sendChatMessage = message => {
	const chatMessageBuffer = dataToChatMessageBuffer(message);
	server.sendSimpleMessageAll(chatMessageBuffer);

	const name = backendManager.userData?.username || multiplayerState.fakeUsername;
	const type = CHAT_AUTHOR_TYPES.DEFAULT;
	if(multiplayerState.vip) type = CHAT_AUTHOR_TYPES.VIP;
	processChatMessage(name, type, multiplayerState.admin, message);
}


const didJoinLobby = ({code, admin}) => {
	// change UI
	multiplayerState.lobby = code;
	multiplayerState.admin = admin;

	// ******* TODO REMOVE:
	// if(admin){
	// 	// auto select level for development:
	// 	backendManager.getPublishedLevelInfo('Z~lbng9r4S5ZG55Rxjl3O').then(levelData => {
	// 		selectMultiplayerLevel(levelData);
	// 		game.ui.showSinglePlayer();
	// 		game.ui.hideSinglePlayer();
	// 		game.openMainMenu();
	// 		game.gameState = game.GAMESTATE_LOBBY;
	// 		game.ui.setMainMenuActive('lobby');
	// 	});
	// } else {
	// 	setTimeout(()=>{setLobbyStateReady(true);}, 1000);
	// }
	// ********************

	showChat(true);

	startSyncPlayer();

	updateLobbyUI();
}

const didLeaveLobby = () => {
	// go back to main menu
	stopSyncPlayer();
}

const playerJoined = async ({id}) => {
	const player = new RippleCharacter(id);
	multiplayerState.players[id] = player;

	player.playerIndex = Object.keys(multiplayerState.players).length;

	multiplayerState.peersConnected++;

	multiplayerState.lobbyState = LOBBY_STATE.WAITING;
	const name = backendManager.userData?.username || multiplayerState.fakeUsername;
	const lobbyState = multiplayerState.lobbyState;

	let introductionBuffer = null;
	if(multiplayerState.admin){
		introductionBuffer = dataToAdminIntroductionBuffer(name, multiplayerState.selectedLevel);
	}else{
		introductionBuffer = dataToIntroductionBuffer(name, lobbyState);
	}

	server.sendIntroduction(introductionBuffer, id);

	const skinBlob = await prepareSkinForSending();
	const skinBuffer = await skinBlob.arrayBuffer();
	server.sendSkinBuffer(skinBuffer, id);

	updateLobbyUI();

	return player;
}

const playerLeft = ({id}) => {
	console.log("********** PLAYER LEFT:", id)
	multiplayerState.peersConnected--;
	multiplayerState.players[id].sprite.destroy(
		{
			children: true,
			texture: false, // TO DO MAKE THIS TRUE WHEN TEXTURES ARE TRANSFERRED
			baseTexture: false
		})
	delete multiplayerState.players[id];

	updateLobbyUI();
	updateLeaderboard();
	// do something

}

const playerIntroduction = ({peer, buffer, admin}) => {
	let introductionData = null;

	if(!admin) introductionData = dataFromIntroductionBuffer(buffer);
	else introductionData = dataFromAdminIntroductionBuffer(buffer);

	const player = multiplayerState.players[peer];

	if(admin){
		player.playerState = {
			name: introductionData.name,
			lobbyState: LOBBY_STATE.WAITING,
		}
		player.admin = true;

		if(introductionData.levelID.trim()){
			fetchLevelInfo(introductionData.levelID);
		}
	} else {
		player.playerState = introductionData;

	}

	updateLobbyUI();
}

const handleChangeLevel = ({buffer}) => {
	const { levelID } = dataFromChangeServerLevelBuffer(buffer);
	fetchLevelInfo(levelID);
}

const handleStartLoadLevel = async ({buffer}) => {
	const { levelID } = dataFromStartLoadLevelBuffer(buffer);
	startLoadLevel(levelID);
}

export const adminStartLoadLevel = () => {
	let playersReady = 0;

	const players = Object.values(multiplayerState.players);
	players.forEach(player => {
		if(player.playerState.lobbyState === LOBBY_STATE.READY){
			playersReady++;
		}
	});

	if((playersReady === players.length && multiplayerState.selectedLevelData) || multiplayerState.lobbyState === LOBBY_STATE.VOTING){
		const startLoadLevelBuffer = dataToStartLoadLevelBuffer(multiplayerState.selectedLevel);
		server.sendSimpleMessageAll(startLoadLevelBuffer);

		startLoadLevel(multiplayerState.selectedLevel);
	}else{
		if(!multiplayerState.selectedLevelData){
			alert("First select a level before clicking start");
		}else{
			alert("Not all players are ready");
		}
	}
}

export const adminReturnToLobby = () => {
	sendSimpleMessageAll(SIMPLE_MESSAGE_TYPES.RETURN_TO_LOBBY);
}

export const kickPlayer = (id, messageType) => {
	const simpleMessageBuffer = dataToSimpleMessageBuffer(messageType);
	server.sendSimpleMessage(simpleMessageBuffer, id);
}

const startLoadLevel = async id => {
	if (game.gameState !== game.GAMESTATE_LOBBY && multiplayerState.lobbyState !== LOBBY_STATE.VOTING) return;
	resetMultiplayer();

	game.gameState = game.GAMESTATE_LOADINGDATA;

	multiplayerState.lobbyState = LOBBY_STATE.LOADING_LEVEL;

	// reset all other params
	multiplayerState.endTime = 0;


	showLeaderboard(true);

	const players = Object.values(multiplayerState.players);
	players.forEach(player => {
		if(player.playerState.lobbyState !== LOBBY_STATE.PLAYING){
			player.playerState.lobbyState = LOBBY_STATE.LOADING_LEVEL;
		}
	});
	updateLobbyUI();

	await fetchLevelInfo(id);

	const progressFunction = progress => {
		progress = Math.max(0, Math.min(1, progress));
		const progressRounded = (progress*100).toFixed(2);
	}

	const finishLoading = ()=>{
		game.run = false;
	}

	const levelData = multiplayerState.selectedLevelData;

	game.loadPublishedLevelData(levelData, progressFunction).then(() => {
		if(levelData.forced_vehicle){
			game.selectedVehicle = levelData.forced_vehicle;
			game.ui.playLevelFromSinglePlayer();
		}else{
			game.ui.showVehicleSelect();
		}
		setMultiplayerHud(HUD_STATES.WAITING_PLAYERS);
		finishLoading();
	}).catch(error => {
		finishLoading();
	});
}

const handleSimpleMessage = ({peer, buffer}) => {
	const { type } = dataFromSimpleMessageBuffer(buffer);

	const player = multiplayerState.players[peer];

	switch(type){
		case SIMPLE_MESSAGE_TYPES.PLAYER_READY:
			player.playerState.lobbyState = LOBBY_STATE.READY;
			updateLobbyUI();
			break;
		case SIMPLE_MESSAGE_TYPES.PLAYER_NOT_READY:
			player.playerState.lobbyState = LOBBY_STATE.WAITING;
			updateLobbyUI();
			break;
		case SIMPLE_MESSAGE_TYPES.PLAYER_FINISHED_LOADING:
			player.playerState.lobbyState = LOBBY_STATE.FINISHED_LOADING_LEVEL;
			updateLobbyUI();
			break;
		case SIMPLE_MESSAGE_TYPES.START_COUNTDOWN:
			multiplayerState.lobbyState = LOBBY_STATE.PLAYING;
			setMultiplayerHud(HUD_STATES.COUNTDOWN, {ping: player.ping});
			updateLobbyUI();
			break;
		case SIMPLE_MESSAGE_TYPES.FINISH_END_COUNTDOWN:
			if(multiplayerState.endTime > 0){
				multiplayerState.endTime = 1;
			}
			break;
		case SIMPLE_MESSAGE_TYPES.RETURN_TO_LOBBY:
			returnToLobby();
			break;
		case SIMPLE_MESSAGE_TYPES.LEVEL_FAILED:
			player.setPlayerState(PLAYER_STATUS.DEATH);
			console.log("***** FAILED AT IT!");
			break;
		case SIMPLE_MESSAGE_TYPES.LEVEL_CHECKPOINT:
			player.setPlayerState(PLAYER_STATUS.CHECKPOINT);
			break;

		case SIMPLE_MESSAGE_TYPES.VOTE_LEVEL_1:
		case SIMPLE_MESSAGE_TYPES.VOTE_LEVEL_2:
		case SIMPLE_MESSAGE_TYPES.VOTE_LEVEL_3:
		case SIMPLE_MESSAGE_TYPES.VOTE_LEVEL_4:
			if(multiplayerState.admin){
				const levelVote = type - SIMPLE_MESSAGE_TYPES.VOTE_LEVEL_1;
				multiplayerState.levelVoters[peer] = levelVote;
				multiplayerState.levelVotes = [0, 0, 0, 0];
				Object.values(multiplayerState.levelVoters).forEach(val => {
					multiplayerState.levelVotes[val]++;
				});

				const messageBuffer = dataToLevelVotesMessageBuffer(multiplayerState.levelVotes);
				server.sendSimpleMessageAll(messageBuffer);
			}
			break;

		case SIMPLE_MESSAGE_TYPES.KICKED_BY_ADMIN:
			alert("You have been kicked by the admin");
			returnToMultiplayer();
			break;
		case SIMPLE_MESSAGE_TYPES.KICKED_GAME_FULL:
			alert("The game is full");
			returnToMultiplayer();
			break;
		case SIMPLE_MESSAGE_TYPES.KICKED_GAME_STARTED:
			alert("The game has already started");
			returnToMultiplayer();
			break;

		default:
			if(type > SIMPLE_MESSAGE_TYPES.SELECT_VEHICLE){
				const vehicleIndex = type - SIMPLE_MESSAGE_TYPES.SELECT_VEHICLE;
				player.vehicle.selectVehicle(vehicleIndex);
			}
	}
}

const handleEndCountDownMessage = ({peer, buffer}) => {
	const player = multiplayerState.players[peer];

	if(!player.admin) return;


	const { levelIds } = dataFromEndCountDownMessageBuffer(buffer);

	const promises = levelIds.map( id => backendManager.getPublishedLevelInfo(id));

	Promise.all(promises).then(voteLevels => {
		multiplayerState.voteLevels = [multiplayerState.selectedLevelData, ...voteLevels];
	})

	multiplayerState.endTime = Settings.endGameTimer - player.ping;
	if(multiplayerState.lobbyState !== LOBBY_STATE.WON_LEVEL){
		setMultiplayerHud(HUD_STATES.GAME_END_COUNTDOWN);
	}
	updateLobbyUI();
}

const handleLevelVotesMessage = ({peer, buffer}) => {
	const { votes } = dataFromLevelVotesMessageBuffer(buffer);
	multiplayerState.levelVotes = votes;
}

const handleReceiveSkin = ({peer, buffer}) => {
	const blob = new Blob( [ buffer ], { type: "image/png" } );
    const urlCreator = window.URL || window.webkitURL;
    const imageUrl = urlCreator.createObjectURL( blob );
	const player = multiplayerState.players[peer];
	player.skinBlob = blob;
	player.loadSkin(imageUrl);
	updateLobbyUI();
}

export const startSyncPlayer = () => {
	stopSyncPlayer();

	console.log("** START SYNC PLAYER **")
	syncInterval = setInterval(()=> {
		multiplayerState.misc = `hasChar:${(!!game.character).toString()}`
		if(game.character){
			const buffer = characterToBuffer(game.character, tickID);
			server.sendCharacterData(buffer);

			tickID++;
			if(tickID > 255){
				tickID = 0;
			}

			multiplayerState.sendPackageID = tickID;
		}
	}, 1000 / ticksPerSecond);
}

export const stopSyncPlayer = () => {
	console.log("** STOP SYNC PLAYER **");
	console.trace();
	clearInterval(syncInterval);
	syncInterval = null;
}

export const updateMultiplayer = () => {
	const data = server.getCharacterDataToProcess();
		data.forEach(data => {
			const player = multiplayerState.players[data.playerID];
			if(player){
				player.ping = data.ping;
				const time = data.time - data.ping;
				const characterData = characterFromBuffer(data.buffer);

				if(!game.run && [HUD_STATES.WAITING_PLAYERS, HUD_STATES.COUNTDOWN].includes(hudState)){
					// ************ offset player at the start of a match
					const spreadOffset = -4 * (player.playerIndex + 1);
					characterData.main.forEach(data => {
						data.x += spreadOffset * Math.cos(player.sprites.head.rotation);
						data.y += spreadOffset * Math.sin(player.sprites.head.rotation);
					});
					// ***************************************************
				}

				multiplayerState.players[data.playerID].processServerData(characterData, time);
			}
		});

	try{
		if(game.character){
			for(let playerID in multiplayerState.players){

				const player = multiplayerState.players[playerID];

				if(!player.addedToGame){
					const targetTexture = game.character.lookupObject._bodies[0]?.mySprite || game.editor.textures.children[game.editor.textures.children.length-1];
					const index = targetTexture.parent.getChildIndex(targetTexture);
					targetTexture.parent.addChildAt(player.sprite, index);
					player.addedToGame = true;
					console.log("** ADD PLAYER TO GAME **");
				}

				if(player.connected && player.addedToGame) player.interpolatePosition();
			}

			if([LOBBY_STATE.PLAYING, LOBBY_STATE.WON_LEVEL].includes(multiplayerState.lobbyState) && multiplayerState.endTime > 0){
				multiplayerState.endTime -= game.editor.deltaTime;
				if(multiplayerState.endTime < 0){
					multiplayerState.lobbyState = LOBBY_STATE.VOTING;
					setMultiplayerHud(HUD_STATES.PICK_NEXT_LEVEL);
				}
			}
		}
	} catch(e){
		console.log('ERROR MULTIPLAYER', e);
		// stopSyncPlayer();
	}



	if(multiplayerState.admin && multiplayerState.lobbyState === LOBBY_STATE.LOADING_LEVEL){
		let playersReady = true;
		for(let playerID in multiplayerState.players){
			if(multiplayerState.players[playerID].playerState.lobbyState !== LOBBY_STATE.FINISHED_LOADING_LEVEL){
				playersReady = false;
			}
		}
		if(playersReady){
			sendSimpleMessageAll(SIMPLE_MESSAGE_TYPES.START_COUNTDOWN);
			multiplayerState.lobbyState = LOBBY_STATE.PLAYING;
			setMultiplayerHud(HUD_STATES.COUNTDOWN, {ping:0});
		}
	}

	if(Key.isPressed(Key.I)){
		if(multiplayerState.debug){
			document.body.removeChild(debugWindow);
		}else{
			document.body.appendChild(debugWindow);
		}
		multiplayerState.debug = !multiplayerState.debug;
	}

	if(Key.isPressed(Key.U) && multiplayerState.lobbyState === LOBBY_STATE.PLAYING){
		sendLevelWon(game.gameFrame * (1/60) * 1000);
	}
	if(multiplayerState.debug) updateDebugData();
}


const prepareSkinForSending = async () => {

	if(multiplayerState.skinBlob) return multiplayerState.skinBlob;

	const skinCanvas = document.createElement('canvas');
	skinCanvas.width = skinCanvas.height = 256;
	const skinContext = skinCanvas.getContext('2d', {alpha:true});

	const skin = game.selectedCharacter;

	//
	const profilePic = await getModdedPortrait(`profile${skin+1}.png`, 'assets/images/portraits/');
	const profileImage = new Image();
	await new Promise(resolve => {
		profileImage.src = profilePic;
		profileImage.onload = resolve;
	});

	// draw parts
	const targetFrame = String(skin).padStart(4, '0');
	Object.keys(multiplayerAtlas.frames).forEach(partKey => {
		const resourceName = `${partKey}${targetFrame}`;
		const {x, y} = multiplayerAtlas.frames[partKey].frame;

		let imageResource, sourceFrame;
		if(partKey === 'profile'){
			imageResource = profileImage;
			sourceFrame = profileImage;
		} else {
			const texture = PIXI.Texture.from(resourceName);
			imageResource = texture.baseTexture.resource.source;
			sourceFrame = texture.frame;
		}

		skinContext.drawImage(imageResource, sourceFrame.x, sourceFrame.y, sourceFrame.width, sourceFrame.height, x, y, sourceFrame.width, sourceFrame.height);
	});

	await new Promise(resolve => {
		skinCanvas.toBlob(blob => {
			multiplayerState.skinBlob = blob;
			resolve();
		}, 'image/png')
	});

	updateLobbyUI();

	return multiplayerState.skinBlob;
}

const fetchLevelInfo = async id => {
	multiplayerState.selectedLevel = id;

	try{
		const levelData = await backendManager.getPublishedLevelInfo(id);
		if(multiplayerState.selectedLevel === id){
			multiplayerState.selectedLevelData = levelData;
			updateLobbyUI();
		}
	}catch(err){
		// something went wrong fetching this level
	}
}

export const sendLevelWon = time => {
	console.log("SEND LEVEL WON!!!");
	setMultiplayerHud(HUD_STATES.GAME_WIN_CAM);
	const messageBuffer = dataToLevelWonBuffer(time);
	server.sendSimpleMessageAll(messageBuffer);

	multiplayerState.finishTime = time;

	multiplayerState.lobbyState = LOBBY_STATE.WON_LEVEL;

	updateLeaderboard();

	checkEndLevelTimer();
}

export const sendGameOver = () => {
	sendSimpleMessageAll(SIMPLE_MESSAGE_TYPES.LEVEL_FAILED);
}

export const sendCheckpoint = () => {
	sendSimpleMessageAll(SIMPLE_MESSAGE_TYPES.LEVEL_CHECKPOINT);
}

const handleReceiveLevelWon = ({peer, buffer}) => {
	const { time } = dataFromLevelWonBuffer(buffer);

	const d = timeFormat(time);
	const s = d.hh !== '00' ? `${d.hh}:${d.mm}:${d.ss}.` : `${d.mm}:${d.ss}.${d.ms}`;

	const player = multiplayerState.players[peer];

	player.playerState.lobbyState = LOBBY_STATE.WON_LEVEL;
	player.playerState.finishTime = time;

	console.log(`PLAYER ${player.playerState.name} FINISHED WITH TIME: ${s}`);

	updateLeaderboard();

	checkEndLevelTimer();
}

const checkEndLevelTimer = () => {
	if(multiplayerState.admin){
		if(!multiplayerState.endTime){
			multiplayerState.endTime = Settings.endGameTimer;

			if(multiplayerState.lobbyState !== LOBBY_STATE.WON_LEVEL){
				setMultiplayerHud(HUD_STATES.GAME_END_COUNTDOWN);
			}

			backendManager.getRandomPublishedLevels(3).then(data => {
				console.log("RANDOM LEVELS:", data)
				multiplayerState.voteLevels = [multiplayerState.selectedLevelData, ...data];
				const voteLevelIds = data.map(level => level.id);
				const messageBuffer = dataToEndCountDownMessageBuffer(voteLevelIds);
				server.sendSimpleMessageAll(messageBuffer);
			})
		}else {

			let allPlayersFinished = true;
			const players = Object.values(multiplayerState.players);
			players.forEach(player => {
				if(player.playerState.lobbyState !== LOBBY_STATE.WON_LEVEL){
					allPlayersFinished = false;
				}
			});

			if(allPlayersFinished && multiplayerState.endTime > 1000){
				sendSimpleMessageAll(SIMPLE_MESSAGE_TYPES.FINISH_END_COUNTDOWN);

				multiplayerState.endTime = 1;
			}
		}
	}
}

const handleReceiveChatMessage = ({peer, buffer}) => {
	const { message } = dataFromChatMessageBuffer(buffer);

	const player = multiplayerState.players[peer];
	if(player && player.playerState.name){
		const name = player.playerState.name
		let type = CHAT_AUTHOR_TYPES.DEFAULT;
		if(player.vip) type = CHAT_AUTHOR_TYPES.VIP;

		processChatMessage(name, type, player.admin, message);

		player.chatBox?.setText?.(message);
	}
}

// DEBUG STUFF
const debugWindow = document.createElement('div');
debugWindow.classList.add('multiplayerDebug');
debugWindow.style = `
	position: absolute;
	z-index: 9999;
	top:0;
	left:0;
	background: white;
`;
debugWindow.innerHTML = `
	<div>Lobby:<span class="lobbyText"></span></div>
	<div>peersConnected:<span class="peersConnectedText"></span></div>
	<div>Misc data:<span class="miscDataText"></span></div>
	<div>Last Package Sent:<span class="lastPackageSent"></span></div>
	<ul class="playerList"></ul>
`


let lobbyText = null;
let peersConnectedText = null;
let miscText = null;
let lastSendID = null;
let playerList = null;
let playerElement = document.createElement('li');
playerElement.innerHTML = `
<ul>
 <li>Name:<span class="nameText"></span></li>
 <li>Connected:<span class="connectedText"></span></li>
 <li>PackageID:<span class="packageIDText"></span></li>
 <li>Info:<span class="infoText"></span></li>
 </ul>
`;


const updateDebugData = () =>{
	if(!lobbyText){
		lobbyText = debugWindow.querySelector('.lobbyText');
		peersConnectedText = debugWindow.querySelector('.peersConnectedText');
		miscText = debugWindow.querySelector('.miscDataText');
		lastSendID = debugWindow.querySelector('.lastPackageSent');
		playerList = debugWindow.querySelector('.playerList');
	}
	lobbyText.innerText = multiplayerState.lobby;
	peersConnectedText.innerText = multiplayerState.peersConnected;
	miscText.innerText = multiplayerState.misc;
	lastSendID.innerText = multiplayerState.sendPackageID;

	playerList.innerHTML = '';

	const playerIds = Object.keys(multiplayerState.players);
	playerIds.forEach(id => {
		const player = multiplayerState.players[id];
		const el = playerElement.cloneNode(true);
		playerList.appendChild(el);

		el.querySelector('.nameText').innerText = id;
		el.querySelector('.connectedText').innerText = player.connected.toString();
		el.querySelector('.packageIDText').innerText = player.lastPackageID.toString();
		el.querySelector('.infoText').innerHTML = 
		`<ul>
			<li>X:${player.sprite.position.x}</li>
			<li>Y:${player.sprite.position.y}</li>
			<li>Ping:${player.ping}</li>
		</ul>`
	})
}
