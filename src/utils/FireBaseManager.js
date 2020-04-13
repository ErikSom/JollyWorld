import {
    ui
} from '../ui/UIManager';
const firebase = require('firebase/app');
require('firebase/functions');
require('firebase/storage');
require('firebase/auth');
require('firebase/database');

import {
    game
} from '../Game';
import {
    Settings
} from '../Settings';


const moment = require('moment');
const nanoid = require('nanoid');

function FireBaseManager() {
    this.app;
    this.user;
    this.userData;
    this.baseDownloadURL = "https://firebasestorage.googleapis.com/v0/b/jolly-ad424.appspot.com/o/";
    this.basePublicURL = "https://storage.googleapis.com/jolly-ad424.appspot.com/";




    this.init = function () {
        var config = {
            apiKey: "AIzaSyB1Lxy9TPif3lZyPRw6IZeWxMXvN5XK9p0",
            authDomain: "jolly-ad424.firebaseapp.com",
            databaseURL: "https://jolly-ad424.firebaseio.com",
            projectId: "jolly-ad424",
            storageBucket: "jolly-ad424.appspot.com",
            messagingSenderId: "186951023"
        };
        this.app = firebase.initializeApp(config);
        var self = this;
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                self.user = user;
                if (!user.isAnonymous) self.onLogin();
            } else {
                //no user, thus do anynomous login
                // console.log("sign in anonymous");
                firebase.auth().signInAnonymously()
                    .catch(function (error) {
                        console.log(error);
                    });
            }
        });
    }

    this.registerUser = function (email, password) {
        return new Promise((resolve, reject) => {
            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then(() => {
                    resolve()
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
    this.claimUsername = function (username) {
        username = username.toLowerCase();
        //Transaction to make sure a username is not claimed twice
        return new Promise((resolve, reject) => {
            var usernameRef = firebase.database().ref('/Usernames/' + username);
            usernameRef.transaction(function (currentData) {
                if (currentData === null) return firebase.auth().currentUser.uid;
                else return;
            }, function (error, committed, snapshot) {
                if (error) {
                    reject(error);
                } else if (!committed) {
                    reject({
                        code: "USERNAME_TAKEN"
                    });
                } else {
                    resolve();
                }
            });
        });

    }

    this.getUserData = function () {
        var self = this;
        return new Promise((resolve, reject) => {
            if (this.userData) return resolve();
            var usernameRef = firebase.database().ref('/Users/' + firebase.auth().currentUser.uid);
            usernameRef.once('value').then(snapshot => {
                self.userData = snapshot.val();
                if (!self.userData) {
                    reject({
                        message: "Username is not set"
                    });
                } else {
                    resolve();
                }
            })
        });
    }
    this.storeUserData = function (data) {
        return new Promise((resolve, reject) => {
            var self = this;
            var usernameRef = firebase.database().ref('/Users/' + firebase.auth().currentUser.uid);
            usernameRef.set(data, function (error) {
                if (error) reject(error);
                else {
                    self.userData = data;
                    resolve();
                };
            });
        });
    }
    this.isLoggedIn = function () {
        return this.user != undefined && !this.user.isAnonymous;
    }
    this.onLogin = function () {
        this.dispatchEvent('login');
    }
    this.login = function (email, password) {
        return new Promise((resolve, reject) => {
            firebase.auth().signInWithEmailAndPassword(email, password).then(function (user) {
                resolve();
            }, function (error) {
                reject(error);
            });
        });
    }
    this.signout = function () {
        var self = this;
        return new Promise((resolve, reject) => {
            firebase.auth().signOut().then(function () {
                self.user = undefined
                self.dispatchEvent('logout');
                self.userData = undefined;
                resolve();
            }, function (error) {
                reject(error);
            });
        });
    }

    this.requestResetPassword = function (email) {
        console.log("reset password for:" + email);
        this.app.auth().sendPasswordResetEmail(email).then(function () {
            // Email sent.
            document.querySelector('form').classList.remove('loading');
            document.querySelector(".ui.negative.message").classList.add('hidden');
            document.querySelector(".ui.positive.message").classList.remove('hidden');
        }).catch(function (error) {
            // An error happened.
            document.querySelector('form').classList.remove('loading');
            document.querySelector(".ui.positive.message").classList.add('hidden');
            document.querySelector(".ui.negative.message").classList.remove('hidden');
            document.querySelector(".ui.negative.message:visible > p").innerText = error.message;
        });
    }
    this.checkURLParameters = function () {
        var urlParams = this.getUrlParams();
        var mode = urlParams.mode;
        this.actionCode = urlParams.oobCode;
        var accountEmail;
        // Verify the password reset code is valid.
        if (!mode && !this.user); //READY
        else if (mode == "resetPassword") {
            ui.showBox('#reset-box')
            this.app.auth().verifyPasswordResetCode(this.actionCode).then(function (email) {
                var accountEmail = email;
                document.querySelector(".ui.message:visible>p").innerText = "Resetting password for " + accountEmail;
            }).catch(function (error) {
                document.querySelector(".ui.negative.message").classList.remove('hidden');
                document.querySelector(".ui.negative.message > p").innerText = error.message;
            });
        }
    }
    this.resetPassword = function (newpassword) {
        document.querySelector('form').classList.add('loading');
        this.app.auth().confirmPasswordReset(this.actionCode, newpassword).then(function (resp) {
            // navigate back to login url.split('?')[0]
            document.querySelector('form').classList.remove('loading');
            document.querySelector(".ui.positive.message").classList.remove('hidden');
        }).catch(function (error) {
            document.querySelector('form').classList.remove('loading');
            document.querySelector(".ui.negative.message").classList.remove('hidden');
            document.querySelector(".ui.negative.message > p").innerText = error.message;
        });
    }

    this.uploadFiles = function (files, UUID, completeCall, progressCall, errorCall) {
        this.currentIndex = 0;
        this.currentFile;
        this.totalFiles = files.length;
        this.currentFileProgress = 0;
        this.tokens = []
        this.uploadUUID = UUID;
        var self = this;

        this.uploadNext = function () {
            self.currentFile = files[self.currentIndex];
            self.uploadFile(self.currentFile.file, self.currentFile.dir, self.currentFile.name, self.currentFile.datatype);
            self.currentIndex++;
        }

        this.progress = function (snapshot) {
            self.currentFileProgress = snapshot.bytesTransferred / snapshot.totalBytes;
            var totalProgress = (self.currentIndex - 1 + self.currentFileProgress) / self.totalFiles;
            if (progressCall) progressCall(totalProgress);
        }
        this.error = function (error) {
            console.log(error.message);
            if (errorCall) errorCall(error);
        }
        this.complete = function (task) {
            task.snapshot.ref.getDownloadURL().then((downloadURL) => {
                var token = downloadURL.split(firebaseManager.baseDownloadURL)[1];
                self.tokens.push(token);
                self.currentFileProgress = 0;
                if (self.currentIndex == self.totalFiles) {
                    if (completeCall) completeCall(self.tokens);
                } else {
                    self.uploadNext();
                }
            });
        }

        this.uploadFile = function (file, dir, name, datatype) {
            var storageRef = firebase.storage().ref(dir + "/" + self.uploadUUID + "/" + name);
            var task;
            if (typeof file === 'string') {
                if (datatype && datatype == "data_url") {
                    task = storageRef.putString(file, datatype);
                } else {
                    task = storageRef.putString(file);
                }
            } else {
                task = storageRef.put(file);
            }
            task.on('state_changed',
                function progress(snapshot) {
                    self.progress(snapshot);
                },
                function error(error) {
                    self.error(error);
                },
                function complete() {
                    self.complete(task);
                }
            );
        }
        this.uploadNext();
    }

    this.levelsSnapshot;
    this.levelsLimitTo = 25;
    this.retreiveNextLevelList = function () {
        var levelRef = firebase.database().ref('/Levels/');
        //if(this.levelsSnapshot == undefined){
        levelRef.orderByChild("creationDate").limitToFirst(this.levelsLimitTo);
        //}
        levelRef.once('value').then(function (levelListSnapshot) {
            ui.displayLevels(levelListSnapshot.val());
        }, function (error) {
            console.log(error.message);
        });
    }
    this.uploadUserLevelData = function (details, levelData, cameraShotData) {
        return new Promise((resolve, reject) => {
            if (!this.userData) return reject({
                message: "Userdata not loaded"
            });
            var filesToUpload = [];
            filesToUpload.push({
                file: levelData,
                dir: "levels",
                name: "levelData.json"
            });
            if (cameraShotData.highRes != null) {
                filesToUpload.push({
                    file: cameraShotData.highRes,
                    dir: "levels",
                    name: "thumb_highRes.jpg",
                    datatype: "data_url"
                })
                filesToUpload.push({
                    file: cameraShotData.lowRes,
                    dir: "levels",
                    name: "thumb_lowRes.jpg",
                    datatype: "data_url"
                })
            }
            var self = this;
            var uploader = new this.uploadFiles(filesToUpload, details.uid,
                function (urls) {
                    self.storeUserLevelData(urls, details).then((levelData) => {
                        levelData.uid = details.uid;
                        resolve(levelData);
                    }).catch((error) => {
                        reject(error);
                    })
                },
                function (progress) {},
                function (error) {
                    reject(error);
                }
            );
        });
    }
    this.storeUserLevelData = function (urls, details) {
        return new Promise((resolve, reject) => {
            var levelObject = {};
            levelObject["dataURL"] = urls[0];
            if (urls.length > 1) {
                levelObject["thumbHighResURL"] = urls[1];
                levelObject["thumbLowResURL"] = urls[2];
            } else {
                if (details.thumbHighResURL) levelObject["thumbHighResURL"] = details.thumbHighResURL;
                if (details.thumbLowResURL) levelObject["thumbLowResURL"] = details.thumbLowResURL;
            }
            levelObject["creationDate"] = details.creationDate;
            levelObject["description"] = details.description;
            levelObject["title"] = details.title;
            levelObject["background"] = details.background;

            var levelRef = firebase.database().ref(`/Users_Private/${this.app.auth().currentUser.uid}/Levels/${details.uid}`);
            levelRef.set(levelObject, function (error) {
                levelObject.uid = details.uid;
                if (error) reject(error);
                else resolve(levelObject);
            });
        });
    }
    this.publishLevelData = function (levelData) {
        return new Promise((resolve, reject) => {

            // reupload to publish storage section
            if (!this.userData) return reject({
                message: "Userdata not loaded"
            });

            var self = this;

            firebase.functions().httpsCallable('publishLevel')({
                levelid: levelData.uid
            }).then(function (result) {
                console.log("Copy files success - !!!", result);

                var levelObject = {};
                levelObject['private'] = {};
                levelObject['private']["creationDate"] = levelData.creationDate;
                levelObject['private']["description"] = levelData.description;
                levelObject['private']["title"] = levelData.title;
                levelObject['private']["background"] = levelData.background;
                levelObject['private']["creator"] = self.userData.username;
                levelObject['private']["creatorID"] = firebase.auth().currentUser.uid;
                levelObject['public'] = {};
                levelObject['public']["playCount"] = 0;
                levelObject['public']["firstMonth_playCount"] = 'unset';
                levelObject['public']["firstWeek_playCount"] = 'unset';
                levelObject['public']["firstDay_playCount"] = 'unset';
                levelObject['public']["voteNum"] = 0;
                levelObject['public']["voteAvg"] = 0.5;
                levelObject['public']["firstMonth_voteAvg"] = 'unset';
                levelObject['public']["firstWeek_voteAvg"] = 'unset';
                levelObject['public']["firstDay_voteAvg"] = 'unset';

                var levelRef = firebase.database().ref(`/PublishedLevels/${levelData.uid}`);
                levelRef.set(levelObject, function (error) {
                    levelObject.uid = levelData.uid;
                    if (error) reject(error);
                    else resolve(levelObject);
                });

            });
        });
    }
    this.voteLevel = function (levelid, vote, _creationDate) {
        return new Promise((resolve, reject) => {
            let self = this;
            const data = vote;
            var voteRef = firebase.database().ref(`/PublishedLevelsVoters/${levelid}/${this.app.auth().currentUser.uid}`);
            voteRef.set(data, function (error) {
                if (error) reject(error);
                else {

                    const now = moment();
                    const creationDate = moment(_creationDate);
                    if (now.year() === creationDate.year() && now.month() == creationDate.month()) {
                        self.call_setRangedVotes(levelid);
                    }

                    resolve();
                }
            });
        });
    }
    this.increasePlayCountPublishedLevel = function (levelData) {
        var playCountRef = firebase.database().ref(`/PublishedLevels/${levelData.uid}/public/playCount`);
        playCountRef.transaction(count => {
            if (count === null) {
                return count = 0;
            } else {
                return count + 1;
            }
        });

        const now = moment();
        const creationDate = moment(levelData.private.creationDate);
        if (now.year() === creationDate.year() && now.month() == creationDate.month()) {
            this.call_setRangedPopularity(levelData.uid);
        }

    }
    this.deleteUserLevelData = function (details) {
        return new Promise((resolve, reject) => {
            var levelRef = firebase.database().ref(`/Users_Private/${this.app.auth().currentUser.uid}/Levels/${details.uid}`);
            levelRef.set(null, function (error) {
                if (error) reject(error);
                else resolve();
            });
        });
    }
    this.getUserLevels = function () {
        return new Promise((resolve, reject) => {
            var levelsRef = firebase.database().ref(`/Users_Private/${this.app.auth().currentUser.uid}/Levels/`);
            levelsRef.once('value', function (snapshot) {
                return resolve(snapshot.val());
            }, function (error) {
                return reject(error);
            });
        })
    }
    this.getPublishedLevels = function (filter) {

        var now = moment();
        let prefixedRangeValue = now.year();
        let paddedMonth, paddedWeek, paddedDay;

        switch (filter.range) {
            case game.ui.FILTER_RANGE_THISMONTH:
                //e.g. 201804_0.8483
                paddedMonth = now.month().toString().padStart(2, '0');
                prefixedRangeValue += paddedMonth;
                break;
            case game.ui.FILTER_RANGE_THISWEEK:
                ///e.g. 2018w03_0.8483
                paddedWeek = now.isoWeek().toString().padStart(2, '0');
                prefixedRangeValue += 'w' + paddedWeek;

                break;
            case game.ui.FILTER_RANGE_TODAY:
                //e.g. 2018w03d3_0.8483
                paddedWeek = now.isoWeek().toString().padStart(2, '0');
                paddedDay = now.isoWeekday();
                prefixedRangeValue += 'w' + paddedWeek + 'd' + paddedDay;
                break;
        }

        return new Promise((resolve, reject) => {
            let levelsRef;

            switch (filter.by) {
                case game.ui.FILTER_BY_FEATURED:
                    levelsRef = firebase.database().ref(`/PublishedLevels/`)
                    break;
                case game.ui.FILTER_BY_NEWEST:
                case game.ui.FILTER_BY_OLDEST:
                    const date = new Date();
                    date.setHours(0), date.setMinutes(0), date.setSeconds(0);
                    let firstDay;
                    let lastDay;
                    if (filter.range === game.ui.FILTER_RANGE_ANYTIME) {

                        levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('private/creationDate')

                    } else if (filter.range === game.ui.FILTER_RANGE_THISMONTH) {

                        firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

                        lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

                        levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('private/creationDate').startAt(firstDay.getTime()).endAt(lastDay.getTime())

                    } else if (filter.range === game.ui.FILTER_RANGE_THISWEEK) {

                        firstDay = new Date(date);
                        let day = firstDay.getDay() || 7;
                        if (day !== 1) firstDay.setHours(-24 * (day - 1));

                        lastDay = new Date(firstDay);
                        lastDay.setHours(24 * 7);

                        levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('private/creationDate').startAt(firstDay.getTime()).endAt(lastDay.getTime())

                    } else if (filter.range === game.ui.FILTER_RANGE_TODAY) {

                        firstDay = new Date(date);

                        lastDay = new Date(firstDay);
                        lastDay.setHours(24);

                        levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('private/creationDate').startAt(firstDay.getTime()).endAt(lastDay.getTime())
                    }

                    if(filter.by == game.ui.FILTER_BY_NEWEST) levelsRef.limitToFirst(Settings.levelsPerRequest);
                    else levelsRef.limitToLast(Settings.levelsPerRequest);
                    break;
                case game.ui.FILTER_BY_PLAYCOUNT:

                    if (filter.range === game.ui.FILTER_RANGE_ANYTIME) {

                        levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/playCount').limitToFirst(Settings.levelsPerRequest);

                    } else if (filter.range === game.ui.FILTER_RANGE_THISMONTH) {

                        levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/firstMonth_playCount').startAt(prefixedRangeValue+'_').endAt(prefixedRangeValue+'~').limitToFirst(Settings.levelsPerRequest);

                    } else if (filter.range === game.ui.FILTER_RANGE_THISWEEK) {
                        levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/firstWeek_playCount').startAt(prefixedRangeValue+'_').endAt(prefixedRangeValue+'~').limitToFirst(Settings.levelsPerRequest);

                    } else if (filter.range === game.ui.FILTER_RANGE_TODAY) {

                        levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/firstDay_playCount').startAt(prefixedRangeValue+'_').endAt(prefixedRangeValue+'~').limitToFirst(Settings.levelsPerRequest);

                    }

                    break;
                case game.ui.FILTER_BY_RATING:

                    if (filter.range === game.ui.FILTER_RANGE_ANYTIME) {

                        levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/voteAvg').limitToFirst(Settings.levelsPerRequest);

                    } else if (filter.range === game.ui.FILTER_RANGE_THISMONTH) {

                        levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/firstMonth_voteAvg').startAt(prefixedRangeValue+'_').endAt(prefixedRangeValue+'~').limitToFirst(Settings.levelsPerRequest);

                    } else if (filter.range === game.ui.FILTER_RANGE_THISWEEK) {

                        levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/firstWeek_voteAvg').startAt(prefixedRangeValue+'_').endAt(prefixedRangeValue+'~').limitToFirst(Settings.levelsPerRequest);

                    } else if (filter.range === game.ui.FILTER_RANGE_TODAY) {

                        levelsRef = firebase.database().ref(`/PublishedLevels/`).orderByChild('public/firstDay_voteAvg').startAt(prefixedRangeValue+'_').endAt(prefixedRangeValue+'~').limitToFirst(Settings.levelsPerRequest);

                    }

                    break;
            }

            levelsRef.once('value', function (snapshot) {
                let sortedLevelList = []
                snapshot.forEach((level) =>{
                    sortedLevelList.push(level);
                });
                if(filter.by !== game.ui.FILTER_BY_OLDEST) sortedLevelList.reverse();

                return resolve(sortedLevelList);
            }, function (error) {
                return reject(error);
            });
        })
    }

    //CLOUD FUNCTIONS
    this.call_setRangedPopularity = function (levelid) {
        firebase.functions().httpsCallable('setRangedPopularity')({
            levelid: levelid
        }).then(function (result) {
            // console.log("GREAT SUCCESS WITH CLOUD FUNCTIONSSSSS, POPULARITY");
        });
    }
    this.call_setRangedVotes = function (levelid) {
        firebase.functions().httpsCallable('setRangedVotes')({
            levelid: levelid
        }).then(function (result) {
            // console.log("GREAT SUCCESS WITH CLOUD FUNCTIONSSSSS, VOTES");
        });
    }

    //UTILS
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
    //URL PARAMS
    this.getUrlParams = function (prop) {
        var params = {};
        var search = decodeURIComponent(window.location.href.slice(window.location.href.indexOf('?') + 1));
        var definitions = search.split('&');
        definitions.forEach(function (val, key) {
            var parts = val.split('=', 2);
            params[parts[0]] = parts[1];
        });
        return (prop && prop in params) ? params[prop] : params;
    }

}

export var firebaseManager = new FireBaseManager();
firebaseManager.init();
