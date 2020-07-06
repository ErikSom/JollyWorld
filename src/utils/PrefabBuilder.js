import { game } from '../Game';
import { Settings } from '../Settings';

export const generatePrefab = (worldPosition, prefabName, autoInit = true) =>{
	const prefabJSON = `{"objects":[[4,${worldPosition.x * Settings.PTM},${worldPosition.y * Settings.PTM},0,{},"${prefabName}"]]}`;
	const lookupObject = game.editor.buildJSON(JSON.parse(prefabJSON));
	const prefabInstanceName = lookupObject._bodies[0].mySprite.data.prefabInstanceName;
	const prefabClass = game.editor.activePrefabs[prefabInstanceName].class;
	if(autoInit) prefabClass.init();
	return {lookupObject, prefabClass}
}
