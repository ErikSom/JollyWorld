import { game } from '../Game'
import { backendManager } from '../utils/BackendManager';
import { globalEvents } from '../utils/EventDispatcher';
import { characterFromBuffer, characterToBuffer, dataFromIntroductionBuffer } from './messagePacker';
import { RippleCharacter } from './rippleCharacter';
import server, { SERVER_EVENTS } from './server';

const urlParams = new URLSearchParams(location.search);

let tickID = 0
const ticksPerSecond = 20;
let syncInterval = null;

export const LOBBY_STATE = {
	LOADING: 0,
	WAITING: 1,
	READY: 2,
	PLAYING: 3,
}

export const multiplayerState = {
	debug: false,
	lobby: '',
	peersConnected: 0,
	misc: '',
	sendPackageID: -1,
	players: {},
	selectedLevel: null,
	lobbyState: LOBBY_STATE.LOADING
}

export const startMultiplayer = () => {
	globalEvents.addEventListener(SERVER_EVENTS.JOINED_LOBBY, didJoinLobby);
	globalEvents.addEventListener(SERVER_EVENTS.LEFT_LOBBY, didLeaveLobby);
	globalEvents.addEventListener(SERVER_EVENTS.NETWORK_READY, networkReady);
	globalEvents.addEventListener(SERVER_EVENTS.PLAYER_JOINED, playerJoined);
	globalEvents.addEventListener(SERVER_EVENTS.PLAYER_LEFT, playerLeft);
	globalEvents.addEventListener(SERVER_EVENTS.PLAYER_INTRODUCTION, playerIntroduction);

	if(multiplayerState.debug) document.body.appendChild(debugWindow);
}

export const networkReady = () => {
	const lobbyID = urlParams.get('lobbyID');
	if(lobbyID){
		server.joinLobby(lobbyID)
	}
}

export const createLobby = () => {
	server.createLobby();
}

export const selectMultiplayerLevel = levelData => {
	multiplayerState.selectedLevel = levelData;
	game.openMainMenu();
}

const didJoinLobby = ({code}) => {
	// change UI
	multiplayerState.lobby = code;
	startSyncPlayer();
}

const didLeaveLobby = () => {
	// go back to main menu
	stopSyncPlayer();
}

const playerJoined = ({id}) => {
	const player = new RippleCharacter(id);
	player.loadSkin('./assets/images/characters/Multiplayer_Character.png');
	multiplayerState.players[id] = player;

	multiplayerState.peersConnected++;
	
	// send my introduction
	const name = backendManager.userData?.username;
	const lobbyState = multiplayerState.lobbyState;
	const introductionBuffer = dataToIntroductionBuffer({ name, lobbyState });
	server.sendIntroduction(introductionBuffer, id);

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
	// do something
}

const playerIntroduction = ({peer, buffer}) => {
	const introductionData = dataFromIntroductionBuffer(buffer);
	multiplayerState.players[peer].playerState = introductionData;
}

export const startSyncPlayer = () => {
	stopSyncPlayer();

	console.log("** START SYNC PLAYER **")
	syncInterval = setInterval(()=> {
		multiplayerState.misc = `hasChar:${(!!game.character).toString()}, gameRun:${game.run}`
		if(game.character && game.run){
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
			if(multiplayerState.players[data.playerID]){
				const ping = 50;
				const time = data.time - ping;
				const characterData = characterFromBuffer(data.buffer);
				multiplayerState.players[data.playerID].processServerData(characterData, time);
			}
		});

	try{
		if(game.character && game.run){
			for(let playerID in multiplayerState.players){

				const player = multiplayerState.players[playerID];

				if(!player.addedToGame){
					const targetTexture = game.character.lookupObject._bodies[0].mySprite;
					const index = targetTexture.parent.getChildIndex(targetTexture);
					targetTexture.parent.addChildAt(player.sprite, index);
					player.addedToGame = true;
					console.log("** ADD PLAYER TO GAME **");
				}

				if(player.connected) player.interpolatePosition();
			}
		}
	} catch(e){
		console.log('ERROR MULTIPLAYER', e);
		// stopSyncPlayer();
	}

	updateDebugData();

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
 <li>Position:<span class="positionText"></span></li>
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
		el.querySelector('.positionText').innerHTML = 
		`<ul>
			<li>X:${player.sprite.position.x}</li>
			<li>Y:${player.sprite.position.y}</li>
		</ul>`
	})

}

startMultiplayer();
