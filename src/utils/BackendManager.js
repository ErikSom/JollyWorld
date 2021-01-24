import {
    ui
} from '../ui/UIManager';

import {
    game
} from '../Game';
import {
    Settings
} from '../Settings';


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

    this.init = function () {
    }
    this.getUserID = function(){
        // return firebase.auth().currentUser.uid;
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

				localStorage.setItem('oauth-token', token);
				localStorage.removeItem('needsToRegister');

				this.dispatchEvent('login');

				resolve();
			});
		})
    }

    this.getUserData = function () {
		console.trace();
		return new Promise((resolve, reject) => {
			if(this.userData) return resolve(this.userData);
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
				console.log("Userdata:", data);
				this.userData = data;
				resolve(data);
			});
		})
    }

    this.isLoggedIn = function () {
		return !!localStorage.getItem('oauth-token') && !localStorage.getItem('needsToRegister');
    }

    this.login = function () {
		const oauthhandshake = localStorage.getItem('oauth-handshake');
		if(!oauthhandshake) return;

		fetch(`${Settings.API}/login?code=${encodeURIComponent(oauthhandshake)}`)
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
				this.getUserData();
			}
		})
	}

    this.signout = function () {
		localStorage.removeItem('oauth-handshake');
		localStorage.removeItem('oauth-token');
		localStorage.removeItem('needsToRegister');
    }

    this.uploadFiles = function (files, UUID, completeCall, progressCall, errorCall) {
        // this.currentIndex = 0;
        // this.currentFile;
        // this.totalFiles = files.length;
        // this.currentFileProgress = 0;
        // this.tokens = []
        // this.uploadUUID = UUID;
        // var self = this;

        // this.uploadNext = function () {
        //     self.currentFile = files[self.currentIndex];
        //     self.uploadFile(self.currentFile.file, self.currentFile.dir, self.currentFile.name, self.currentFile.datatype);
        //     self.currentIndex++;
        // }

        // this.progress = function (snapshot) {
        //     self.currentFileProgress = snapshot.bytesTransferred / snapshot.totalBytes;
        //     var totalProgress = (self.currentIndex - 1 + self.currentFileProgress) / self.totalFiles;
        //     if (progressCall) progressCall(totalProgress);
        // }
        // this.error = function (error) {
        //     console.log(error.message);
        //     if (errorCall) errorCall(error);
        // }
        // this.complete = function (task) {
        //     task.snapshot.ref.getDownloadURL().then((downloadURL) => {
        //         var token = downloadURL.split(backendManager.baseDownloadURL)[1];
        //         self.tokens.push(token);
        //         self.currentFileProgress = 0;
        //         if (self.currentIndex == self.totalFiles) {
        //             if (completeCall) completeCall(self.tokens);
        //         } else {
        //             self.uploadNext();
        //         }
        //     });
        // }

        // this.uploadFile = function (file, dir, name, datatype) {
        //     const storageRef = firebase.storage().ref(`${dir}/${backendManager.getUserID()}/${self.uploadUUID}/${name}`);

        //     let task;
        //     if (typeof file === 'string') {
        //         if (datatype && datatype == "data_url") {
        //             task = storageRef.putString(file, datatype);
        //         } else {
        //             task = storageRef.putString(file);
        //         }
        //     } else {
        //         task = storageRef.put(file);
        //     }
        //     task.on('state_changed',
        //         function progress(snapshot) {
        //             self.progress(snapshot);
        //         },
        //         function error(error) {
        //             self.error(error);
        //         },
        //         function complete() {
        //             self.complete(task);
        //         }
        //     );
        // }
        // this.uploadNext();
    }

    this.uploadUserLevelData = function (details, levelJSON, cameraShotData) {


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
		bodyLevelData.data = window.btoa(levelJSON);
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
			.then(data => {
				const {error} = data;

				if(error){
					reject(error)
				}else{
					const levelData = data[0];
					console.log("SUCCESSS :)!");
					console.log(data);

					// const { token, error } = data;

					// // show error code

					// localStorage.setItem('oauth-token', token);
					// localStorage.removeItem('needsToRegister');

					// this.dispatchEvent('login');

					resolve(levelData);
				}
			});
		})
    }

    this.publishLevelData = function (levelData) {
        // return new Promise((resolve, reject) => {

        //     // reupload to publish storage section
        //     if (!this.userData) return reject({
        //         message: "Userdata not loaded"
        //     });

        //     var self = this;

        //     firebase.functions().httpsCallable('publishLevel')({
        //         levelid: levelData.uid,
        //         creatorid: backendManager.getUserID()
        //     }).then(function (result) {
        //         if(result.data === "success"){

        //             var levelObject = {};
        //             levelObject['private'] = {};
        //             levelObject['private']["creationDate"] = Date.now();
        //             levelObject['private']["description"] = levelData.description;
        //             levelObject['private']["title"] = levelData.title;
        //             levelObject['private']["creator"] = self.userData.username;
        //             levelObject['private']["creatorID"] = backendManager.getUserID();
        //             levelObject['private']["forcedVehicle"] = levelData.forcedVehicle || 0;
        //             levelObject['public'] = {};
        //             levelObject['public']["playCount"] = 0;
        //             levelObject['public']["firstMonth_playCount"] = 'unset';
        //             levelObject['public']["firstWeek_playCount"] = 'unset';
        //             levelObject['public']["firstDay_playCount"] = 'unset';
        //             levelObject['public']["voteNum"] = 0;
        //             levelObject['public']["voteAvg"] = 0.5;
        //             levelObject['public']["firstMonth_voteAvg"] = 'unset';
        //             levelObject['public']["firstWeek_voteAvg"] = 'unset';
        //             levelObject['public']["firstDay_voteAvg"] = 'unset';

        //             var levelRef = firebase.database().ref(`/PublishedLevels/${levelData.uid}`);
        //             levelRef.set(levelObject, function (error) {
        //                 levelObject.uid = levelData.uid;
        //                 if (error) reject(error);
        //                 else resolve(levelObject);
        //             });
        //         }else{
        //             reject(result.data);
        //         }

        //     }).catch(error=>{
        //         reject(error);
        //     });
        // });
    }
    this.voteLevel = function (levelid, vote, _creationDate) {
        // return new Promise(resolve => {

        //     if(!this.isLoggedIn()){
        //         game.editor.ui.showLoginScreen();
        //         return resolve(false);
        //     }
        //     const self = this;
        //     const data = vote;
        //     const voteRef = firebase.database().ref(`/PublishedLevelsVoters/${levelid}/${this.app.auth().currentUser.uid}`);
        //     voteRef.set(data, function (error) {

        //         if (error){
        //             console.log('Vote error:', error);
        //         } else {

        //             FireBaseCache.voteDataCache[levelid] = vote;
        //             FireBaseCache.save();

        //             const now = new Date()
        //             const creationDate = new Date(_creationDate);
        //             if (now.getFullYear() === creationDate.getFullYear() && now.getMonth() == creationDate.getMonth()) {
        //                 self.call_setRangedVotes(levelid);
        //             }
        //         }
        //         resolve();

        //     });
        // });
    }
    this.increasePlayCountPublishedLevel = function (levelData) {
        // var playCountRef = firebase.database().ref(`/PublishedLevels/${levelData.uid}/public/playCount`);
        // playCountRef.transaction(count => {
        //     if (count === null) {
        //         return count = 0;
        //     } else {
        //         return count + 1;
        //     }
        // });

        // const now = new Date();
        // const creationDate = new Date(levelData.creationDate);
        // if (now.getFullYear() === creationDate.getFullYear() && now.getMonth() == creationDate.getMonth()) {
        //     this.call_setRangedPopularity(levelData.uid);
        // }

    }
    this.deleteUserLevelData = function (details) {
        // return new Promise((resolve, reject) => {
        //     var levelRef = firebase.database().ref(`/Users_Private/${this.app.auth().currentUser.uid}/Levels/${details.uid}`);
        //     levelRef.set(null, function (error) {
        //         if (error) reject(error);
        //         else resolve();
        //     });
        // });
    }
    this.getUserLevels = async () => {
		const userData = await this.getUserData();
		const levels = userData.my_levels;
		return levels;
    }
    this.getPublishedLevels = function (filter) {

        // var now = new Date();
        // let prefixedRangeValue = now.getFullYear();
        // let paddedMonth, paddedWeek, paddedDay;

        // switch (filter.range) {
        //     case game.ui.FILTER_RANGE_THISMONTH:
        //         //e.g. 201804_0.8483
        //         paddedMonth = now.getMonth().toString().padStart(2, '0');
        //         prefixedRangeValue += paddedMonth;
        //         break;
        //     case game.ui.FILTER_RANGE_THISWEEK:
        //         ///e.g. 2018w03_0.8483
        //         paddedWeek = now.getWeek().toString().padStart(2, '0');
        //         prefixedRangeValue += 'w' + paddedWeek;

        //         break;
        //     case game.ui.FILTER_RANGE_TODAY:
        //         //e.g. 2018w03d3_0.8483
        //         paddedWeek = now.getWeek().toString().padStart(2, '0');
        //         paddedDay = now.getDay();
        //         prefixedRangeValue += 'w' + paddedWeek + 'd' + paddedDay;
        //         break;
        // }

        // return new Promise((resolve, reject) => {
        //     let levelsRef;

        //     switch (filter.by) {
        //         case game.ui.FILTER_BY_FEATURED:
        //             levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('private/featured').equalTo(true);
        //             break;
        //         case game.ui.FILTER_BY_NEWEST:
        //         case game.ui.FILTER_BY_OLDEST:
        //             const date = new Date();
        //             date.setHours(0), date.setMinutes(0), date.setSeconds(0);
        //             let firstDay;
        //             let lastDay;
        //             if (filter.range === game.ui.FILTER_RANGE_ANYTIME) {

        //                 levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('private/creationDate');

        //             } else if (filter.range === game.ui.FILTER_RANGE_THISMONTH) {

        //                 firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

        //                 lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        //                 levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('private/creationDate').startAt(firstDay.getTime()).endAt(lastDay.getTime());

        //             } else if (filter.range === game.ui.FILTER_RANGE_THISWEEK) {

        //                 firstDay = new Date(date);
        //                 let day = firstDay.getDay() || 7;
        //                 if (day !== 1) firstDay.setHours(-24 * (day - 1));

        //                 lastDay = new Date(firstDay);
        //                 lastDay.setHours(24 * 7);

        //                 levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('private/creationDate').startAt(firstDay.getTime()).endAt(lastDay.getTime());

        //             } else if (filter.range === game.ui.FILTER_RANGE_TODAY) {

        //                 firstDay = new Date(date);

        //                 lastDay = new Date(firstDay);
        //                 lastDay.setHours(24);

        //                 levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('private/creationDate').startAt(firstDay.getTime()).endAt(lastDay.getTime());
        //             }

        //             if(filter.by == game.ui.FILTER_BY_NEWEST) levelsRef.limitToFirst(Settings.levelsPerRequest);
        //             else levelsRef.limitToLast(Settings.levelsPerRequest);
        //             break;
        //         case game.ui.FILTER_BY_PLAYCOUNT:

        //             if (filter.range === game.ui.FILTER_RANGE_ANYTIME) {

        //                 levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/playCount').limitToFirst(Settings.levelsPerRequest);

        //             } else if (filter.range === game.ui.FILTER_RANGE_THISMONTH) {

        //                 levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/firstMonth_playCount').startAt(prefixedRangeValue+'_').endAt(prefixedRangeValue+'~').limitToFirst(Settings.levelsPerRequest);

        //             } else if (filter.range === game.ui.FILTER_RANGE_THISWEEK) {
        //                 levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/firstWeek_playCount').startAt(prefixedRangeValue+'_').endAt(prefixedRangeValue+'~').limitToFirst(Settings.levelsPerRequest);

        //             } else if (filter.range === game.ui.FILTER_RANGE_TODAY) {

        //                 levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/firstDay_playCount').startAt(prefixedRangeValue+'_').endAt(prefixedRangeValue+'~').limitToFirst(Settings.levelsPerRequest);

        //             }

        //             break;
        //         case game.ui.FILTER_BY_RATING:

        //             if (filter.range === game.ui.FILTER_RANGE_ANYTIME) {

        //                 levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/voteAvg').limitToFirst(Settings.levelsPerRequest);

        //             } else if (filter.range === game.ui.FILTER_RANGE_THISMONTH) {

        //                 levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/firstMonth_voteAvg').startAt(prefixedRangeValue+'_').endAt(prefixedRangeValue+'~').limitToFirst(Settings.levelsPerRequest);

        //             } else if (filter.range === game.ui.FILTER_RANGE_THISWEEK) {

        //                 levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/firstWeek_voteAvg').startAt(prefixedRangeValue+'_').endAt(prefixedRangeValue+'~').limitToFirst(Settings.levelsPerRequest);

        //             } else if (filter.range === game.ui.FILTER_RANGE_TODAY) {

        //                 levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/firstDay_voteAvg').startAt(prefixedRangeValue+'_').endAt(prefixedRangeValue+'~').limitToFirst(Settings.levelsPerRequest);

        //             }

        //             break;
        //     }

        //     levelsRef.once('value', function (snapshot) {
        //         let sortedLevelList = []
        //         snapshot.forEach((levelSnapshot) =>{
        //             const level = levelSnapshot.val();
        //             level.uid = levelSnapshot.key;
        //             sortedLevelList.push(level);
        //         });

        //         if(filter.by === game.ui.FILTER_BY_NEWEST || filter.by === game.ui.FILTER_BY_FEATURED){
        //             sortedLevelList.sort((a,b)=> (a.private.creationDate<b.private.creationDate) ? 1 : -1);
        //         }else if(filter.by === game.ui.FILTER_BY_OLDEST){
        //             sortedLevelList.sort((a,b)=> (a.private.creationDate<b.private.creationDate) ? -1 : 1);
        //         }else if(filter.by === game.ui.FILTER_BY_PLAYCOUNT){
        //             sortedLevelList.sort((a,b)=> (a.public.playCount<b.public.playCount) ? 1 : -1);
        //         }else if(filter.by === game.ui.FILTER_BY_RATING){
        //             sortedLevelList.sort((a,b)=> (a.public.voteAvg<b.public.voteAvg) ? 1 : -1);
        //         }

        //         return resolve(sortedLevelList);
        //     }, function (error) {
        //         return reject(error);
        //     });
        // })
    }
    this.getPublishedLevelInfo = id =>{
		// get level endpoint gebruiken

        // return new Promise((resolve, reject) => {
        //     firebase.database().ref(`/PublishedLevels/${id}`).once('value', function (snapshot) {
        //         resolve(snapshot);
        //     },function (error) {
        //         reject(error);
        //     })
        // });
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
}

export const backendManager = new BackendManager();
backendManager.init();
