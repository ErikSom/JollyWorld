import {
    levelsData
} from "../data/levelsData";
const nanoid = require('nanoid');

const saveKeyPrefix = 'JollyWorld';
export const SAVEKEYS = {
    tempEditorWorld:"tempEditorWorld",
    levelsVoted:"levelsVoted",
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

export const saveData = function(key, value){
    key = saveKeyPrefix+'_'+key;
    try{
        window.localStorage.setItem(key, JSON.stringify(value));
        return value;
    }catch(err){
        console.warn("Saving not working", err);
    }
}

export const loadData = function(key){
    key = saveKeyPrefix+'_'+key;
    try{
        const data = window.localStorage.getItem(key);
        return data ? JSON.parse(data) : undefined;
    }catch(err){
        console.warn("Saving not working", err);
    }
}
