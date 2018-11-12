import * as Box2D from "../../libs/Box2D";
import {
    game
} from "../Game";

export class basePrefab {
    static settings = {};
    static settingsOptions = {};
    static forceUnique = false;
    constructor(target) {
        this.prefabObject = target;
        this.lookupObject = game.editor.lookupGroups[this.prefabObject.prefabName + "_" + this.prefabObject.instanceID];
        this.contactListener;
    }
    init() {
        this.lookupObject = game.editor.lookupGroups[this.prefabObject.prefabName + "_" + this.prefabObject.instanceID];
        this.initContactListener();
    }
    set(property, value) {}
    update() {}
    initContactListener() {
        this.contactListener = new Box2D.b2ContactListener();
        this.contactListener.BeginContact = function (contact, target) {}
        this.contactListener.EndContact = function (contact, target) {}
        this.contactListener.PreSolve = function (contact, oldManifold) {}
        this.contactListener.PostSolve = function (contact, impulse) {}
    }
}

export const LIBRARY_ADMIN = "admin";
export const LIBRARY_MOVEMENT = "movement";
export const LIBRARY_WEAPON = "weapon";
export const LIBRARY_LEVEL = "level";

export var prefabLibrary = {
    libraryKeys: [],
    libraryDictionary: {},
}
export const getLibraryKeys = function() {
    if(prefabLibrary.libraryKeys.length>0) return prefabLibrary.libraryKeys;
    for (let key in prefabLibrary) {
        if (prefabLibrary.hasOwnProperty(key)) {
            if (prefabLibrary[key].library) {
                if (!prefabLibrary.libraryDictionary[prefabLibrary[key].library]) prefabLibrary.libraryDictionary[prefabLibrary[key].library] = [];
                prefabLibrary.libraryDictionary[prefabLibrary[key].library].push(key);
            }
        }
    }
    prefabLibrary.libraryKeys = Object.keys(prefabLibrary.libraryDictionary);
    return prefabLibrary.libraryKeys;
}


export const timerReady = function (timer, target, singleCallback) {
    return singleCallback ? (timer < target && timer + game.editor.deltaTime >= target) : timer > target;
}
export const chancePercent = function(percent){
    return Math.random()*100<percent;
}

function importAll (r) {
    r.keys().forEach(r);
  }

importAll(require.context('./misc', true, /\.js$/));
importAll(require.context('./animals', true, /\.js$/));
importAll(require.context('./humanoids', true, /\.js$/));
importAll(require.context('./vehicles', true, /\.js$/));
importAll(require.context('./weapons', true, /\.js$/));
importAll(require.context('./movement', true, /\.js$/));
importAll(require.context('./level', true, /\.js$/));
