import * as SaveManager from "./SaveManager";

export let voteDataCache = SaveManager.loadData(SaveManager.SAVEKEYS.levelsVoted) || {};
export let favoriteDataCache = SaveManager.loadData(SaveManager.SAVEKEYS.levelsFavorites) || {};

export const save = ()=>{
	SaveManager.saveData(SaveManager.SAVEKEYS.levelsVoted, voteDataCache);
	SaveManager.saveData(SaveManager.SAVEKEYS.levelsFavorites, favoriteDataCache);
}
