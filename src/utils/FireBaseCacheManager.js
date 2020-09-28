import * as SaveManager from "./SaveManager";


export const KEYS = {
	USERDATA:'userDataCache',
	LEVELDATA:'levelDataCache',
	VOTEDATA:'voteCache',
}

export let userDataCache = SaveManager.loadData(KEYS.USERDATA) || {};
export let levelDataCache = SaveManager.loadData(KEYS.LEVELDATA) || {};
export let voteDataCache = SaveManager.loadData(KEYS.VOTEDATA) || {};

export const save = ()=>{
	SaveManager.saveData(KEYS.USERDATA, userDataCache);
	SaveManager.saveData(KEYS.LEVELDATA, levelDataCache);
	SaveManager.saveData(KEYS.VOTEDATA, voteDataCache);
}
