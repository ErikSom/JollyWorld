const fs = require("fs");

const scriptPath = './build/assets/awesome-game.js';

const gameProps = ["levelStartTime","levelWon","gameOver","checkPointData","selectedCharacter","selectedVehicle", "openMainMenu", "runWorld", "playWorld", "findPlayableCharacter", "testWorld", "playLevelMidi", "stopTestingWorld", "resetWorld", "stopWorld", "openEditor", "initLevel", "pauseGame", "unpauseGame", "resetGame", "doAutoSave", "stopAutoSave", "saveNewLevelData", "saveLevelData", "publishLevelData", "deleteLevelData", "levelHasChanges", "currentLevelData", "gameCheckpoint", "gameWin", "gameLose", "loadUserLevelData", "loadPublishedLevelData", "gameRender", "gameCamera", "gameUpdate", "voteLevel", "prepareGameFonts", "toggleMute", "GAMESTATE_MENU", "GAMESTATE_EDITOR", "GAMESTATE_NORMALPLAY", "GAMESTATE_LOADINGDATA", "gameInit"];

let script =  fs.readFileSync(scriptPath, 'utf8');

const mangleArr = [...gameProps];

const idDictionary = {};

const prefix = "ಠ_ಠ"

const getRandomId = ()=> Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);

mangleArr.forEach( property => {
	const regex = new RegExp(property, 'g');

	let id = getRandomId();
	while(!id || idDictionary[id]){
		id = getRandomId()
	}
	idDictionary[id] = true;

	script = script.replace(regex, `${prefix}${id}`);
})

fs.writeFileSync(scriptPath, script, 'utf8');
