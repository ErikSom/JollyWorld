import {
    levelData
} from "../data/levelData";


export const SAVEKEYS = {
    tempEditorWorld:"tempEditorWorld",
}

export const saveTempEditorWorld = function(json){
    saveData(SAVEKEYS.tempEditorWorld, json);
}
export const getTempEditorWorld = function(){
    var tempWorld = loadData(SAVEKEYS.tempEditorWorld);
    if(!tempWorld) tempWorld = saveData(SAVEKEYS.tempEditorWorld, levelData.mainMenuLevel);
    return tempWorld;
}

const saveData = function(key, value){
    if(window.localStorage){
        window.localStorage[key] = value;
        return value;
    }
    console.alert("Browser does not support saving of data");
}
const loadData = function(key){
    if(window.localStorage){
        return window.localStorage[key];
    }
    return undefined;
}