import { game } from '../Game'
import { characterFromBuffer, characterToBuffer } from './messagePacker';
import { RippleCharacter } from './rippleCharacter';
import server from './server';

const players = {};
let tickID = 0
const ticksPerSecond = 20;
let syncInterval = null;

export const startSyncPlayer = () => {
	stopSyncPlayer();

	syncInterval = setInterval(()=> {
		const buffer = characterToBuffer(game.character, tickID);
		server.sendCharacterData(buffer);

		tickID++;
		if(tickID > 255){
			tickID = 0;
		}
	}, 1000 / ticksPerSecond);


}

export const stopSyncPlayer = () => {
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

	for(let playerID in players){
		players[playerID].interpolatePosition();
	}

}

document.addEventListener('keydown', e => {
	if(e.key === 'l'){
		const player = new RippleCharacter(server.getID());
		player.loadSkin('./assets/images/characters/Multiplayer_Character.png');
		players[server.getID()] = player;

		const targetTexture = game.character.lookupObject._bodies[0].mySprite;
		const index = targetTexture.parent.getChildIndex(targetTexture);
		targetTexture.parent.addChildAt(player.sprite, index);

		console.log(player.sprite);

		startSyncPlayer();
	}
})
