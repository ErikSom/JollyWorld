import { JSONStringify } from "../b2Editor/utils/formatString";
import {
    levelsData
} from "../data/levelsData";
const nanoid = require('nanoid');

const saveKeyPrefix = 'JollyWorld';
export const SAVEKEYS = {
    tempEditorWorld:"tempEditorWorld",
    levelsVoted:"levelsVoted",
    userData:'userData',
}

export const getLocalUserdata = function(){
    const userData = loadData(SAVEKEYS.userData);
    if(userData) return userData;
    const defaultData = {
        applePWAModals:0,
    }
    saveData(SAVEKEYS.userData, defaultData);
    return defaultData;
}
export const updateLocaluserData = function(data){
    saveData(SAVEKEYS.userData, data);
    return data;
}

export const saveTempEditorWorld = function(data){
    saveData(SAVEKEYS.tempEditorWorld, data);
}

export const getTempEditorWorld = function(){
    var tempWorld = loadData(SAVEKEYS.tempEditorWorld);
    if(!tempWorld){
        tempWorld = saveData(SAVEKEYS.tempEditorWorld, levelsData.mainMenuLevel);
        tempWorld.id = nanoid();
        tempWorld.creationDate = Date.now();
    }
    return tempWorld;
}

export const saveData = function(key, value){
    key = saveKeyPrefix+'_'+key;
    try{
        window.localStorage.setItem(key, JSONStringify(value));
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
