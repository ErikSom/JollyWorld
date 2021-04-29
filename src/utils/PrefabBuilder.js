import { game } from '../Game';
import { Settings } from '../Settings';

export const generatePrefab = (worldPosition, rotation, prefabName, autoInit = true) =>{
	const prefabJSON = `{"objects":[[4,${worldPosition.get_x() * Settings.PTM},${worldPosition.get_y() * Settings.PTM},${rotation},{},"${prefabName}"]]}`;
	const lookupObject = game.editor.buildJSON(JSON.parse(prefabJSON));
	const prefabInstanceName = lookupObject._bodies[0].mySprite.data.prefabInstanceName;
	const prefabClass = game.editor.activePrefabs[prefabInstanceName].class;
	if(autoInit) prefabClass.init();
	return {lookupObject, prefabClass}
}
