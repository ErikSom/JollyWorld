import { game } from '../Game'
import { globalEvents } from '../utils/EventDispatcher';
import { characterFromBuffer, characterToBuffer } from './messagePacker';
import { RippleCharacter } from './rippleCharacter';
import server, { SERVER_EVENTS } from './server';



const players = {};
let tickID = 0
const ticksPerSecond = 20;
let syncInterval = null;

export const startMultiplayer = () => {
	globalEvents.addEventListener(SERVER_EVENTS.JOINED_LOBBY, joinLobby);
	globalEvents.addEventListener(SERVER_EVENTS.LEFT_LOBBY, leaveLobby);
	globalEvents.addEventListener(SERVER_EVENTS.PLAYER_JOINED, playerJoined);
	globalEvents.addEventListener(SERVER_EVENTS.PLAYER_LEFT, playerLeft);
}

const joinLobby = () => {
	// change UI
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

	return player;
}

const playerLeft = ({id}) => {
	// do something
}

export const startSyncPlayer = () => {
	stopSyncPlayer();

	console.log("** START SYNC PLAYER **")
	syncInterval = setInterval(()=> {
		if(game.character && game.run){
			const buffer = characterToBuffer(game.character, tickID);
			server.sendCharacterData(buffer);

			tickID++;
			if(tickID > 255){
				tickID = 0;
			}
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
		const ping = 50;
		const time = Date.now() - ping;
		const characterData = characterFromBuffer(data.buffer);
		players[data.playerID].processServerData(characterData, time);
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

				player.interpolatePosition();
			}
		}
	} catch(e){
		console.log('ERROR MULTIPLAYER', e);
		// stopSyncPlayer();
	}

}

startMultiplayer();
