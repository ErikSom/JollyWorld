import {
    ui
} from '../ui/UIManager';
import * as BackendCache from './BackendCacheManager'

import {
    game
} from '../Game';
import {
    Settings
} from '../Settings';
import nanoid from 'nanoid';


// static assets van een level:
// https://static.jollyworld.app/6d3c174811e2246ab9cb15eb76fda6f6.png
// gebruik de md5 url

// posten van een level:
// (POST) /level/update/id
// JSON Data: title / description / forced_vehicle / game_build / thumbnail / data
// thumbnail = Base64 encoded image
// data = Base64 encoded JSON

// publish een level:
// (POST) /level/publish/old-id/new-id (or existing new)

// get levels
// (GET) /level/id

// increase level count
// (POST) level/play/id

// level voting
// (POST) level/vote/id/up (or down)

// level search
// (GET) levels/?
/* QUERY PARAMS:
(req - niet nodig met search) 	sort=oldest|newest|mostplayed|best
(req) 	timespan=today|week|month|anytime
(req)	search=string
		forcedVehicle=nummer
		user=name
		featured=1
		limit=nummer
*/

function BackendManager() {
    this.app;
    this.user;
    this.userData;

    this.backendInit = function () {
		if(this.isLoggedIn()) this.getBackendUserData().catch(e=>{});
    }

    this.claimUsername = function (username) {
		return new Promise((resolve, reject) => {
			const body = {
				method: 'POST',
				withCredentials: true,
				headers: {
				'Authorization': `Bearer ${localStorage.getItem('oauth-token')}`,
				'Content-Type': 'application/json'
				},
				body: JSON.stringify({username})
			}
			fetch(`${Settings.API}/register`, body)
			.then(result => result.json())
			.then(data => {
				const { token, error } = data;

				// show error code
				if(error) return reject(error);

				localStorage.setItem('oauth-token', token);
				localStorage.removeItem('needsToRegister');

				this.dispatchEvent('login');

				resolve();
			});
		})
    }

    this.getBackendUserData = () => {
		return new Promise((resolve, reject) => {
			const body = {
				method: 'GET',
				withCredentials: true,
				headers: {
				'Authorization': `Bearer ${localStorage.getItem('oauth-token')}`,
				},
			}
			fetch(`${Settings.API}/me`, body)
			.then(result => result.json())
			.then(data => {

				const { error } = data;

				if(error){
					this.backendSignout();
					return reject();
				}


				this.userData = data;
				if(this.userData.is_admin) Settings.userAdmin = true;
				resolve(data);
			});
		})
    }

    this.isLoggedIn =  () => !!localStorage.getItem('oauth-token') && !localStorage.getItem('needsToRegister');

    this.backendLogin = function () {
		if(this.isLoggedIn()) return;

		const oauthhandshake = localStorage.getItem('oauth-handshake');
		if(!oauthhandshake) return;

		fetch(`${Settings.API}/login?code=${encodeURIComponent(oauthhandshake)}&redirect=${encodeURIComponent(Settings.REDIRECT)}`)
		.then(result => result.json())
		.then(data=> {
			localStorage.removeItem('oauth-handshake');

			const {token, needs_to_register} = data;
			localStorage.setItem('oauth-token', token);
			if(needs_to_register){
				localStorage.setItem('needsToRegister', needs_to_register);
			}

			if(needs_to_register){
				this.dispatchEvent('username');
			}else{
				this.dispatchEvent('login');
				this.getBackendUserData();
			}
		})
	}

    this.backendSignout = function () {
		localStorage.removeItem('oauth-handshake');
		localStorage.removeItem('oauth-token');
		localStorage.removeItem('needsToRegister');
		this.dispatchEvent('logout');
    }

    this.uploadUserLevelData = (details, levelJSON, cameraShotData) => {

		if(game.IS_ERROR) return Promise.reject();

		// posten van een level:
		// (POST) /level/update/id
		// JSON Data: title / description / forced_vehicle / game_build / thumbnail / data
		// thumbnail = Base64 encoded image
		// data = Base64 encoded JSON

		const bodyLevelData = {};
		bodyLevelData.title = details.title;
		bodyLevelData.description = details.description;
		bodyLevelData.forced_vehicle = details.forced_vehicle;
		bodyLevelData.game_build = __VERSION__;
		if(cameraShotData) bodyLevelData.thumbnail = cameraShotData.replace('data:image/png;base64,', '') // kan ik hier ook geen data sturen? overschrijf ik het dan niet?
        if(details.youtubelinks)  bodyLevelData.youtubelinks = details.youtubelinks;
		bodyLevelData.data = levelJSON;
		// creation data, is dat de date van eerste keer opslaan?
		// minimum string length title & description = 3;

		return new Promise((resolve, reject) => {
			const body = {
				method: 'POST',
				withCredentials: true,
				headers: {
				'Authorization': `Bearer ${localStorage.getItem('oauth-token')}`,
				'Content-Type': 'application/json'
				},
				body: JSON.stringify(bodyLevelData)
			}
			fetch(`${Settings.API}/level/update/${details.id}`, body)
			.then(result => result.json())
			.then(async data => {
				const {error} = data;
				if(error) return reject(error);

				// update local thumbnail cache
				details.thumb_big_md5 = data.thumb_big_md5;
				details.thumb_small_md5 = data.thumb_small_md5;

				resolve(data);
			});
		})
    }

    this.publishLevelData = (details) => {

		if(game.IS_ERROR) return Promise.reject();

		// (POST) /level/publish/old-id/new-id (or existing new)
		return new Promise(async (resolve, reject) => {

			const body = {
				method: 'POST',
				withCredentials: true,
				headers: {
				'Authorization': `Bearer ${localStorage.getItem('oauth-token')}`,
				'Content-Type': 'application/json'
				},
			}

			const userData = await this.getBackendUserData();

			const serverLevelData = Settings.admin ? details : userData.my_levels.find(level => level.id === details.id);

			if(!serverLevelData && !Settings.admin) return reject({error:'Level not found in userdata'});

			const publishLevelId = serverLevelData.published_id || nanoid();

			fetch(`${Settings.API}/level/publish/${details.id}/${publishLevelId}`, body)
			.then(result => result.json())
			.then(async data => {
				const {error} = data;
				if(error) return reject(error)

				// show level share screen

				resolve(publishLevelId);

			});
		})
	}

    this.voteLevel = function (levelid, vote) {
		// (POST) level/vote/id/up (or down)
		return new Promise((resolve, reject) => {
			const body = {
				method: 'POST',
				withCredentials: true,
				headers: {
				'Authorization': `Bearer ${localStorage.getItem('oauth-token')}`,
				},
			}

			const voteType = vote > 0 ? 'up' : 'down';

			fetch(`${Settings.API}/level/vote/${levelid}/${voteType}`, body)
			.then(result => result.json())
			.then(async data => {
				const {error} = data;
				if(error) return reject(error);

				// update local thumbnail cache
				BackendCache.voteDataCache[levelid] = vote;
				BackendCache.save();

				resolve();
			});
		});
	}

    this.increasePlayCountPublishedLevel = function (details) {
		// (POST) level/play/id
		const body = {
			method: 'POST',
		}

		fetch(`${Settings.API}/level/play/${details.id}`, body)
		.then(result => result.json())
		.then(async data => {
			const {error} = data;
			if(error){
				return console.log(error);
			}
		});

	}

    this.deleteUserLevelData = function (details) {
		//DELETE /level/:id
		return new Promise((resolve, reject) => {
			const body = {
				method: 'DELETE',
				withCredentials: true,
				headers: {
				'Authorization': `Bearer ${localStorage.getItem('oauth-token')}`,
				'Content-Type': 'application/json'
				},
			}
			fetch(`${Settings.API}/level/${details.id}`, body)
			.then(result => result.json())
			.then(async data => {
				const {error} = data;

				if(error) return reject(error)

				resolve();

			});
		})
    }
    this.getUserLevels = async () => {
		const userData = await this.getBackendUserData();
		const levels = userData.my_levels.filter(level=>!level.published);
		return levels;
    }
    this.getPublishedLevels = function (filter) {
		// level search
		// (GET) levels/?
		/* QUERY PARAMS:
		(req - niet nodig met search) 	sort=oldest|newest|mostplayed|best
		(req) 	timespan=today|week|month|anytime
		(req)	search=string
				forcedVehicle=nummer
				user=name
				featured=1
				limit=nummer
		*/

		const {featured, sort, range} = filter;

        return new Promise((resolve, reject) => {
			const featuredQuery = featured ? '&featured=1' : '';
			const query = `sort=${sort}&timespan=${range}${featuredQuery}&limit=${Settings.levelsPerRequest}`
			const body = {
				method: 'GET',
			}

			fetch(`${Settings.API}/levels/?${query}`, body)
			.then(result => result.json())
			.then(async data => {
				const {error} = data;
				if(error) return reject(error);

				resolve(data);

			});
        });
    }
    this.getPublishedLevelInfo = id =>{
		// (GET) /level/id

		return new Promise((resolve, reject) => {
			const body = {
				method: 'GET',
			}
			fetch(`${Settings.API}/level/${id}`, body)
			.then(result => result.json())
			.then(async data => {
				const {error} = data;
				if(error) return reject(error);

				resolve(data);
			});
		})
	}

	//SIMPLE CALLBACK SYSTEM
	this.callBacks = {};
	this.registerListener = function (type, func) {
		if (!this.callBacks[type]) this.callBacks[type] = [];
		this.callBacks[type].push(func);
	}
	this.removeListener = function (type, func) {
		if (!this.callBacks[type]) return;
		for (var i = 0; i < this.callBacks[type].length; i++) {
			if (this.callBacks[type][i] == func) {
				this.callBacks[type].splice(i, 1);
				break;
			}
		}
	}
	this.dispatchEvent = function (type, data = {}) {
		if (!this.callBacks[type]) return;
		data.type = type;
		for (var i = 0; i < this.callBacks[type].length; i++) {
			this.callBacks[type][i](data);
		}
	}

	this.submitTime = async levelid => {
		if(!this.isLoggedIn()) return;

        const data = await window.SVGCache[2]();

		// POST /leaderboard/:id/entry (encrypted body)
		const body = {
			method: 'POST',
			withCredentials: true,
			headers: {
			'Authorization': `Bearer ${localStorage.getItem('oauth-token')}`,
			'Content-Type': 'application/json'
			},
			body: data
		}

		fetch(`${Settings.API}/leaderboard/${levelid}/entry`, body)
		.then(result => result.json())
		.then(async data => {
			const {error} = data;

			console.log("Score submitted", data, "Posted data:", data);
			if(error){
				return console.log(error);
			}
		});
	}

	this.getLeaderboardPosition = async levelid => {
		if(!this.isLoggedIn()) return null;

		// GET /leaderboard/:id/my
		const body = {
			method: 'GET',
			withCredentials: true,
			headers: {
			'Authorization': `Bearer ${localStorage.getItem('oauth-token')}`,
			'Content-Type': 'application/json'
			},
		}

		const result = await fetch(`${Settings.API}/leaderboard/${levelid}/my`, body);

		if(result.status === 404) return null;

		const json = await result.json();

		const {error} = json;
		if(error){
			return null
		}else{
			return json
		}

	}
	this.getLeaderboard = async (levelid, limit) => {
		// GET /leaderboard/:id/get ?limit=10
		const body = {
			method: 'GET',
		}

		const result = await fetch(`${Settings.API}/leaderboard/${levelid}/get?limit=${limit}`, body);
		if(result.status === 404) return null;

		const json = await result.json();

		const {error} = json;
		if(error){
			return null
		}else{
			return json
		}

	}
}

export const backendManager = new BackendManager();
backendManager.backendInit();
