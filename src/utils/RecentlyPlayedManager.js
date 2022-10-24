import * as SaveManager from "./SaveManager";

export const getRecentlyPlayed = function(){
	return SaveManager.loadData(SaveManager.SAVEKEYS.recentlyPlayed) || [];
}

export const saveRecentlyPlayed = function(levelData){
	const recentlyPlayed = getRecentlyPlayed();

	// remove old entry
	const index = recentlyPlayed.findIndex((level)=>{
		return level.id === levelData.id;
	});
	if(index>=0){
		recentlyPlayed.splice(index, 1);
	}

	// add new entry
	recentlyPlayed.unshift(levelData);

	// limit to 10 entries
	if(recentlyPlayed.length>50){
		recentlyPlayed.pop();
	}

	SaveManager.saveData(SaveManager.SAVEKEYS.recentlyPlayed, recentlyPlayed);
}
