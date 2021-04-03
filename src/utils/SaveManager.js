import { JSONStringify } from "../b2Editor/utils/formatString";
import {
    levelsData
} from "../data/levelsData";
import * as idb from 'idb-keyval';

const nanoid = require('nanoid');
const saveKeyPrefix = 'JollyWorld';

export const SAVEKEYS = {
    tempEditorWorld:"tempEditorWorld",
    levelsVoted:"levelsVoted",
    userData:'userData',
}

export const getLocalUserdata = function(){
    let userData = loadData(SAVEKEYS.userData);

    const defaultData = {
        applePWAModals:0,
        demoScrolls:0,
        helpClosed:[],
        editorGuiPos:{x:50, y:50},
        sfxOn:true,
        tutorials:[],
    }

    if(userData){
        userData = Object.assign(defaultData, userData);
        return userData;
    }

    saveData(SAVEKEYS.userData, defaultData);
    return defaultData;
}
export const updateLocalUserData = function(data){
    saveData(SAVEKEYS.userData, data);
    return data;
}

export const saveTempEditorWorld = async function(data){
    try{
        await idb.set(SAVEKEYS.tempEditorWorld, data);
    }catch(err){
        // db error
    }
    return data;
}

export const getTempEditorWorld = async function(){
    let tempWorld;
    try{
        tempWorld = await idb.get(SAVEKEYS.tempEditorWorld);
    } catch(err){
        tempWorld = JSON.parse(JSON.stringify(levelsData.editorLevel));
        tempWorld.id = nanoid();
        tempWorld.creationDate = Date.now();
        saveTempEditorWorld(tempWorld);
    }

    // this can be removed later, backwards compatibility for old save system
    if(window.location.search.indexOf('localstorage=true')>=0){
        tempWorld = loadData(SAVEKEYS.tempEditorWorld);
        if(!tempWorld){
            tempWorld = saveData(SAVEKEYS.tempEditorWorld, levelsData.editorLevel);
            tempWorld.id = nanoid();
            tempWorld.creationDate = Date.now();
        }
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


