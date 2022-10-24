import { JSONStringify } from "../b2Editor/utils/formatString";
import {
    levelsData
} from "../data/levelsData";
import * as idb from 'idb-keyval';

import * as betterLocalStorage from './LocalStorageWrapper'

const nanoid = require('nanoid');
const saveKeyPrefix = 'JollyWorld';

export const SAVEKEYS = {
    tempEditorWorld:"tempEditorWorld",
    levelsVoted:"levelsVoted",
    levelsFavorites:"levelsFavorites",
    userData:'userData',
    recentlyPlayed:'recentlyPlayed',
}

export const getLocalUserdata = function(){
    let userData = loadData(SAVEKEYS.userData);

    const defaultData = {
        applePWAModals:0,
        helpClosed:[],
        showHelpButton: true,
        editorGuiPos:{x:50, y:50},
        sfxOn:true,
        musicOn:true,
        bloodOn:true,
        goreOn:true,
        tutorials:[],
        selectedCharacter: 0,
        selectedMask: 0,
        tutorialFinished: false,
        discordShown: false,
        levelsPlayed: 0,
        levelsPublished: false,
        country:'?',
        cheats: {},
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
        console.info("SAVE ERROR (saveTempEditorWorld):", err);
    }
    return data;
}

export const getTempEditorWorld = async function(){
    let tempWorld;
    try{
        tempWorld = await idb.get(SAVEKEYS.tempEditorWorld);
    } catch(err){
        tempWorld = JSON.parse(JSON.stringify(levelsData.editorLevel()));
        tempWorld.id = nanoid();
        tempWorld.creationDate = Date.now();
        saveTempEditorWorld(tempWorld);
    }

    // this can be removed later, backwards compatibility for old save system
    if(window.location.search.indexOf('localstorage=true')>=0){
        tempWorld = loadData(SAVEKEYS.tempEditorWorld);
        if(!tempWorld){
            tempWorld = saveData(SAVEKEYS.tempEditorWorld, levelsData.editorLevel());
            tempWorld.id = nanoid();
            tempWorld.creationDate = Date.now();
        }
    }

    return tempWorld;
}

export const saveData = function(key, value){
    key = saveKeyPrefix+'_'+key;
    betterLocalStorage.setItem(key, JSONStringify(value));
    return value;
}

export const loadData = function(key){
    key = saveKeyPrefix+'_'+key;
    const data = betterLocalStorage.getItem(key);
    return data ? JSON.parse(data) : undefined;
}


