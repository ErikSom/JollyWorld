import {
    ui
} from '../ui/UIManager';
const firebase = require('firebase/app');
require('firebase/functions');
require('firebase/storage');
require('firebase/auth');
require('firebase/database');

import $ from 'jquery';

const moment = require('moment');
const nanoid = require('nanoid');

function FireBaseManager() {
    this.app;
    this.user;
    this.userData;
    this.baseDownloadURL = "https://firebasestorage.googleapis.com/v0/b/jolly-ad424.appspot.com/o/";

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
            console.log("Auth changed!", user);
            if (user) {
                self.user = user;
                if(!user.isAnonymous) self.onLogin();
            }else{
                //no user, thus do anynomous login
                // console.log("sign in anonymous");
                firebase.auth().signInAnonymously()
                .catch(function(error) {
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
                    reject({code:"USERNAME_TAKEN"});
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
                console.log("USER DATA", self.userData);
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
        console.log("Store userdata!");
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
            $('form').removeClass('loading');
            $(".ui.negative.message").addClass('hidden');
            $(".ui.positive.message").removeClass('hidden');
            console.log("great succes :D");
        }).catch(function (error) {
            // An error happened.
            $('form').removeClass('loading');
            $(".ui.positive.message").addClass('hidden');
            $(".ui.negative.message").removeClass('hidden');
            $(".ui.negative.message:visible > p").text(error.message);
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
                console.log(accountEmail);
                console.log("check:" + $(".ui.message:visible > p"));
                $(".ui.message:visible>p").text("Resetting password for " + accountEmail);
            }).catch(function (error) {
                console.log($(".ui.negative.message:visible"))
                $(".ui.negative.message").removeClass('hidden');
                $(".ui.negative.message > p").text(error.message);
            });
        }
    }
    this.resetPassword = function (newpassword) {
        $('form').addClass('loading');
        console.log(this.actionCode)
        this.app.auth().confirmPasswordReset(this.actionCode, newpassword).then(function (resp) {
            // navigate back to login url.split('?')[0]
            $('form').removeClass('loading');
            console.log("BIG SUCCES, password reset succesful");
            $(".ui.positive.message").removeClass('hidden');
        }).catch(function (error) {
            $('form').removeClass('loading');
            $(".ui.negative.message").removeClass('hidden');
            $(".ui.negative.message > p").text(error.message);
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
            var downloadURL = task.snapshot.downloadURL;
            var token = downloadURL.split(firebaseManager.baseDownloadURL)[1];
            self.tokens.push(token);
            self.currentFileProgress = 0;
            if (self.currentIndex == self.totalFiles) {
                if (completeCall) completeCall(self.tokens);
            } else {
                self.uploadNext();
            }
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
            if (!this.userData) return reject({
                message: "Userdata not loaded"
            });

            console.log(this.userData.username);
            var levelObject = {};
            levelObject['private'] = {};
            levelObject['private']["dataURL"] = levelData.dataURL;
            levelObject['private']["thumbHighResURL"] = levelData.thumbHighResURL;
            levelObject['private']["thumbLowResURL"] = levelData.thumbLowResURL;
            levelObject['private']["creationDate"] = levelData.creationDate;
            levelObject['private']["description"] = levelData.description;
            levelObject['private']["title"] = levelData.title;
            levelObject['private']["background"] = levelData.background;
            levelObject['private']["creator"] = this.userData.username;
            levelObject['private']["creatorID"] = firebase.auth().currentUser.uid;
            levelObject['public'] = {};
            levelObject['public']["playCount"] = 0;
            levelObject['public']["firstMonth_playCount"] = 'unset';
            levelObject['public']["firstWeek_playCount"] = 'unset';
            levelObject['public']["voteNum"] = 0;
            levelObject['public']["voteSum"] = 0;
            levelObject['public']["voteMax"] = 0;

            var levelRef = firebase.database().ref(`/PublishedLevels/${levelData.uid}`);
            levelRef.set(levelObject, function (error) {
                levelObject.uid = levelData.uid;
                if (error) reject(error);
                else resolve(levelObject);
            });
        });
    }
    this.voteLevel = function (levelid, vote) {
        return new Promise((resolve, reject) => {
            const data = vote;
            var voteRef = firebase.database().ref(`/PublishedLevelsVoters/${levelid}/${this.app.auth().currentUser.uid}`);
            voteRef.set(data, function (error) {
                if (error) reject(error);
                else{
                    resolve();
                    console.log("VOTE SUCCESFUL!");
                } 
            });
        });
    }
    this.increasePlayCountPublishedLevel = function(levelData){
        var playCountRef = firebase.database().ref(`/PublishedLevels/${levelData.uid}/public/playCount`);
        playCountRef.transaction(count => {
            console.log(count);
            if (count === null) {
                return count = 0;
            } else {
                return count+1;
            }
        });

        const now = moment();
        const creationDate = moment(levelData.private.creationDate);
        console.log(now.year(), creationDate.year(), now.month(), creationDate.month());
        if(now.year() === creationDate.year() && now.month() == creationDate.month()){
            console.log("Call Ranged Popularity");
            this.call_setRangedPopularity(levelData.uid);
        }

    }
    this.deleteUserLevelData = function (details) {
        console.log(details);
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
        return new Promise((resolve, reject) => {
            var levelsRef = firebase.database().ref(`/PublishedLevels/`).limitToFirst(100);
            levelsRef.once('value', function (snapshot) {
                return resolve(snapshot.val());
            }, function (error) {
                return reject(error);
            });
        })
    }

    //CLOUD FUNCTIONS
    this.call_setRangedPopularity = function(levelid){
        console.log("Call setRangedPopularity");
        firebase.functions().httpsCallable('setRangedPopularity')({levelid:levelid}).then(function(result) {
            console.log("GREAT SUCCESS WITH CLOUD FUNCTIONSSSSS");
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