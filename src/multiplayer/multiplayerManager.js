import { game } from '../Game'
import { globalEvents } from '../utils/EventDispatcher';
import { characterFromBuffer, characterToBuffer } from './messagePacker';
import { RippleCharacter } from './rippleCharacter';
import server, { SERVER_EVENTS } from './server';



const players = {};
let tickID = 0
const ticksPerSecond = 20;
let syncInterval = null;

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

let multiplayerDebug = true;

const debugData = {
	lobby: '',
	peersConnected: 0,
	misc: '',
	sendPackageID: -1,
	playerData: {},
}



export const startMultiplayer = () => {
	globalEvents.addEventListener(SERVER_EVENTS.JOINED_LOBBY, joinLobby);
	globalEvents.addEventListener(SERVER_EVENTS.LEFT_LOBBY, leaveLobby);
	globalEvents.addEventListener(SERVER_EVENTS.PLAYER_JOINED, playerJoined);
	globalEvents.addEventListener(SERVER_EVENTS.PLAYER_LEFT, playerLeft);

	if(multiplayerDebug) document.body.appendChild(debugWindow);
	console.log("DEBUG WINDOW:", debugWindow)
}

const joinLobby = ({code}) => {
	// change UI
	debugData.lobby = code;
	startSyncPlayer();
}

const leaveLobby = () => {
	// go back to main menu
	stopSyncPlayer();
}

const playerJoined = ({id}) => {
	const player = new RippleCharacter(id);
	player.loadSkin('./assets/images/characters/Multiplayer_Character.png');
	players[id] = player;

	debugData.peersConnected++;

	return player;
}

const playerLeft = ({id}) => {
	console.log("********** PLAYER LEFT:", id)
	debugData.peersConnected--;
	players[id].sprite.destroy(
		{
			children: true,
			texture: false, // TO DO MAKE THIS TRUE WHEN TEXTURES ARE TRANSFERRED
			baseTexture: false
		})
	delete players[id];
	// do something
}

export const startSyncPlayer = () => {
	stopSyncPlayer();

	console.log("** START SYNC PLAYER **")
	syncInterval = setInterval(()=> {
		debugData.misc = `hasChar:${(!!game.character).toString()}, gameRun:${game.run}`
		if(game.character && game.run){
			const buffer = characterToBuffer(game.character, tickID);
			server.sendCharacterData(buffer);

			tickID++;
			if(tickID > 255){
				tickID = 0;
			}

			debugData.sendPackageID = tickID;
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
			if(players[data.playerID]){
				const ping = 50;
				const time = Date.now() - ping;
				const characterData = characterFromBuffer(data.buffer);
				players[data.playerID].processServerData(characterData, time);
			}
		});

	try{
		if(game.character && game.run){
			for(let playerID in players){

				const player = players[playerID];

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
	lobbyText.innerText = debugData.lobby;
	peersConnectedText.innerText = debugData.peersConnected;
	miscText.innerText = debugData.misc;
	lastSendID.innerText = debugData.sendPackageID;

	playerList.innerHTML = '';

	const playerIds = Object.keys(players);
	playerIds.forEach(id => {
		const player = players[id];
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
