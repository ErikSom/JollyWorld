import {
    levelData
} from "../data/levelData";
const nanoid = require('nanoid');

export const SAVEKEYS = {
    tempEditorWorld:"tempEditorWorld",
}
export const saveLevel = function(){

}
export const saveTempEditorWorld = function(levelData){
    saveData(SAVEKEYS.tempEditorWorld, levelData);
}
export const getTempEditorWorld = function(){
    var tempWorld = loadData(SAVEKEYS.tempEditorWorld);
    if(!tempWorld){
        tempWorld = saveData(SAVEKEYS.tempEditorWorld, levelData.mainMenuLevel);
        tempWorld.uid = nanoid();
    }
    return tempWorld;
}

const saveData = function(key, value){
    if(window.localStorage){
        window.localStorage[key] = JSON.stringify(value);
        return value;
    }
    console.alert("Browser does not support saving of data");
}
const loadData = function(key){
    if(window.localStorage && window.localStorage[key]) return JSON.parse(window.localStorage[key]);
    return undefined;
}