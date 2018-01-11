function FireBaseManager() {
    this.app;
    this.user;
    this.username;
    this.usernameUnique = false;
    this.createdUserdata = false;
    this.loginEmail;
    this.loginPassword;
    this.actionCode;
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
            if (user) {
                self.user = user;
                self.onLogin();
            }
        });
    }

    this.createUser = function (email, password, form) {
        console.log(email + "  " + password);
        var self = this;
        firebase.auth().createUserWithEmailAndPassword(email, password).then(function (user) {
            self.onCreateUserSuccess(user)
        }, function (error) {
            self.onCreateUserError(error)
        });
    }
    this.onCreateUserSuccess = function (user) {
        console.log("YAY YOU SIGNED IN!!!!")
        console.log(user);
        $('form').removeClass('loading');
        $(".ui.negative.message").addClass('hidden');
    }
    this.onCreateUserError = function (error) {
        $('form').removeClass('loading');
        $(".ui.negative.message").removeClass('hidden');
        $(".ui.negative.message > p").text(error.message)
    }
    this.checkUserData = function (data) {
        var self = this;
        var usernameRef = firebase.database().ref('/Usernames').orderByKey().equalTo(data.username);
        usernameRef.once('value').then(snapshot => {
            var username = snapshot.val();
            $(".ui.negative.message").addClass('hidden');
            if (!username) {
                self.usernameUnique = true;
                self.username = name;
                self.storeUserData(data);
            } else {
                $('form').removeClass('loading');
                $(".ui.negative.message").removeClass('hidden');
                $(".ui.negative.message > p").text("Someone else already picked that");
            }
        })
    }
    this.storeUserData = function (data) {
        console.log(this.app.auth());
        var self = this;
        var userRef = firebase.database().ref('/Users/' + this.app.auth().currentUser.uid);
        userRef.set(data);
        userRef.once('value').then(function (snapshot) {
            var usernameRef = firebase.database().ref('/Usernames/' + data.username);
            usernameRef.set(self.app.auth().currentUser.uid);
            usernameRef.once('value').then(function (snapshot) {
                console.log("username successfully stored!!");
                self.onLoginComplete();
            }, function (error) {
                console.log("ERROR!!");
                console.log(error.message);
            });
        }, function (error) {
            console.log("ERROR!!");
            console.log(error.message);
        });
    }
    this.onLogin = function () {
        var self = this;
        console.log(this.app.auth().currentUser.uid + "  MY UID");
        var userRef = firebase.database().ref('/Users/' + this.app.auth().currentUser.uid);
        userRef.once('value').then(function (snapshot) {
            self.username = snapshot.val().username;
            if (self.username) {
                self.onLoginComplete();
            } else {
                ui.showBox('#userdata-box')
            }
        }, function (error) {
            console.log(error.message);
            $(".ui.negative.message").removeClass('hidden');
            $(".ui.negative.message > p").text(error.message);
            self.signout();
        });
    }
    this.login = function (email, password) {
        var self = this;
        console.log("LOGGING IN:");
        console.log(firebase.auth());
        firebase.auth().signInWithEmailAndPassword(email, password).then(function (user) {
            self.onLoginSucccess(user);
        }, function (error) {
            self.onLoginError(error);
        });
    }
    this.onLoginComplete = function () {
        console.log("USER LOGGED IN!");
        ui.showBox('#signout-box')
        console.log(this.app.auth().currentUser);
        $(".ui.positive.message").removeClass('hidden');
        $(".ui.positive.message > p").text("Logged in as " + this.app.auth().currentUser);
    }
    this.signout = function () {
        firebase.auth().signOut().then(function () {
            console.log("signed out");
            ui.showBox('#login-box')
        }, function (error) {
            // An error happened.
            console.log("signout error" + error.message);
            $(".ui.negative.message").removeClass('hidden');
            $(".ui.negative.message > p").text(error.message);
        });
    }
    this.onLoginSucccess = function (user) {
        console.log("LOGIN SUCCES")
        console.log(user);
        // go to application
        $('form').removeClass('loading');
        $(".ui.negative.message:visible").addClass('hidden');
    }
    this.onLoginError = function (error) {
        $('form').removeClass('loading');
        console.log($(".ui.negative.message:visible"));
        $(".ui.negative.message").removeClass('hidden');
        $(".ui.negative.message > p").text(error.message);
        console.log("ERROR" + error.message);
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
        if (!mode && !this.user) ui.showBox('#login-box');
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
        console.log("uploadFiles class init");
        this.currentIndex = 0;
        this.currentFile;
        this.totalFiles = files.length;
        this.currentFileProgress = 0;
        this.tokens = []
        this.uploadUUID = UUID;
        var self = this;

        this.uploadNext = function(){
            console.log("Upload files uploadNext");
            self.currentFile = files[self.currentIndex];
            self.uploadFile(self.currentFile.file, self.currentFile.dir, self.currentFile.name);
            self.currentIndex++;
        }

        this.progress = function(snapshot){
            self.currentFileProgress = snapshot.bytesTransferred / snapshot.totalBytes;
            var totalProgress = (self.currentIndex-1+self.currentFileProgress) / self.totalFiles;
            console.log("Upload files progress");
            console.log(totalProgress);
            if(progressCall) progressCall(totalProgress);
        }
        this.error = function(error){
            console.log("Upload files error");
            console.log(error.message);
            if(errorCall) errorCall(error);
        }
        this.complete = function(task){
            var downloadURL = task.snapshot.downloadURL;
            var token = downloadURL.split(firebaseManager.baseDownloadURL)[1];
            console.log("Upload files complete file");
            console.log(token);
            self.tokens.push(token);
            self.currentFileProgress = 0;
            if(self.currentIndex == self.totalFiles){
                if(completeCall) completeCall(self.tokens);
            } else{
                self.uploadNext();
            }
        }

        this.uploadFile = function (file, dir, name) {
            console.log("Upload files uploadFile");
            var storageRef = firebase.storage().ref(dir + "/" + self.uploadUUID + "/" + name);

            var task;
            if (typeof file === 'string') {
                task = storageRef.putString(file);
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
    this.generateUUID = function () {
        var d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            d += performance.now();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }


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

var firebaseManager = new FireBaseManager();
firebaseManager.init();