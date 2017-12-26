function FireBaseManager() {
    this.app;
    this.user;
    this.username;
    this.usernameUnique = false;
    this.createdUserdata = false;
    this.loginEmail;
    this.loginPassword;
    this.actionCode;

    this.init = function (config) {
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
            }, function(error) {
                console.log("ERROR!!");
                console.log(error.message);
            });
        }, function (error){
            console.log("ERROR!!");
            console.log(error.message);
        });
    }
    this.onLogin = function () {
        var self = this;
        console.log(this.app.auth().currentUser.uid+"  MY UID");
        var userRef = firebase.database().ref('/Users/' + this.app.auth().currentUser.uid);
        userRef.once('value').then(function (snapshot) {
            if(snapshot.val()){
                showSignout();
            }else{
                showUserData();
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

        firebase.auth().signInWithEmailAndPassword(email, password).then(function (user) {
            self.onLoginSucccess(user);
        }, function (error) {
            self.onLoginError(error);
        });
    }
    this.onLoginComplete = function () {
        console.log("USER LOGGED IN!");
        showSignout();
        console.log(this.app.auth().currentUser);
        $(".ui.positive.message").removeClass('hidden');
        $(".ui.positive.message > p").text("Logged in as " + this.app.auth().currentUser);
    }
    this.signout = function () {
        firebase.auth().signOut().then(function () {
            console.log("signed out");
            showLogin();
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
        if (!mode) showLogin();
        else if (mode == "resetPassword") {
            showReset();
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

//fetchProvidersForEmail