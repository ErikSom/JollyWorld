import * as SaveManager from "./SaveManager";

export let voteDataCache = SaveManager.loadData(SaveManager.SAVEKEYS.levelsVoted) || {};

export const save = ()=>{
	SaveManager.saveData(SaveManager.SAVEKEYS.levelsVoted, voteDataCache);
}
