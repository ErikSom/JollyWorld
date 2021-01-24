import * as SaveManager from "./SaveManager";

export const KEYS = {
	VOTEDATA:'voteCache',
}

export let voteDataCache = SaveManager.loadData(KEYS.VOTEDATA) || {};

export const save = ()=>{
	SaveManager.saveData(KEYS.VOTEDATA, voteDataCache);
}
