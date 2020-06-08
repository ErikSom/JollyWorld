import {
    levelsData
} from "../data/levelsData";
const nanoid = require('nanoid');

export const SAVEKEYS = {
    tempEditorWorld:"tempEditorWorld",
}
export const saveLevel = function(){

}
export const saveTempEditorWorld = function(data){
    saveData(SAVEKEYS.tempEditorWorld, data);
}
export const getTempEditorWorld = function(){
    var tempWorld = loadData(SAVEKEYS.tempEditorWorld);
    if(!tempWorld){
        tempWorld = saveData(SAVEKEYS.tempEditorWorld, levelsData.mainMenuLevel);
        tempWorld.uid = nanoid();
        tempWorld.creationDate = Date.now();
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
