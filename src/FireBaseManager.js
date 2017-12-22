function FireBaseManager() {
    this.app;
    this.usernameUnique = false;
    this.doRegister = false;
    this.loginEmail;
    this.loginPassword;
    this.actionCode;

    this.init = function(config){
        this.app = firebase.initializeApp(config);
    }
    this.createUser = function (email, password, form) {
        console.log(email + "  " + password);
        var self = this;
        if (this.usernameUnique) {
            this.doRegister = false;
            firebase.auth().createUserWithEmailAndPassword(email, password).then(function (user) {
                self.onCreateUserSuccess(user)
            }, function (error) {
                self.onCreateUserError(error)
            });
        } else {
            this.doRegister = true;
            this.loginEmail = email;
            this.loginPassword = password;
        }
    }
    this.onCreateUserSuccess = function (user) {
        console.log("YAY YOU SIGNED IN!!!!")
        console.log(user);
        $('form').removeClass('loading');
        $('#uniquemiscerror').addClass('hidden');
    }
    this.onCreateUserError = function (error) {
        $('form').removeClass('loading');
        var errorCode = error.code;
        var errorMessage = error.message;

        console.log("ERROR!!!!");
        console.log("code" + errorCode + "  message:" + errorMessage);

        $('#uniquemiscerror').removeClass('hidden');
        $('#uniquemiscerror > p').text(errorMessage)
        //field.addClass('error');

    }
    this.doesUserNameExist = function (name, field) {

        console.log(name);
        this.usernameUnique = false;
        var self = this;
        var usernameRef = firebase.database().ref('/Users').orderByChild('username').equalTo(name);
        usernameRef.once('value').then(snapshot => {
            var username = snapshot.val();
            field.removeClass('loading');
            field.removeClass('error');
            $('#uniqueusernameerror').addClass('hidden');
            if (!username) {
                self.usernameUnique = true;
                if (self.doRegister) {
                    self.createUser(self.loginEmail, self.loginPassword);
                }
                field.removeClass('error');
            } else {
                field.addClass('error');
                $('#uniqueusernameerror').removeClass('hidden');
            }
        })

    }
    this.login = function (email, password) {
        console.log("logging in with email:" + email + " and password:" + password);

        var self = this;

        firebase.auth().signInWithEmailAndPassword(email, password).then(function (user) {
            self.onLoginSucccess(user);
        }, function (error) {
            self.onLoginError(error);
        });
    }
    this.signout = function () {
        firebase.auth().signOut().then(function () {
            console.log("signed out");
        }, function (error) {
            // An error happened.
            console.log("signout error" + error.message);
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
        $(".ui.negative.message:visible > p").text(error.message);
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
    this.checkURLParameters = function(){
        var urlParams = this.getUrlParams();
        var mode = urlParams.mode;
        this.actionCode = urlParams.oobCode;
        var accountEmail;
        // Verify the password reset code is valid.
        if(!mode) showLogin();
        else if(mode == "resetPassword"){
            showReset();
            this.app.auth().verifyPasswordResetCode(this.actionCode).then(function (email) {
                var accountEmail = email;
                console.log(accountEmail);
                console.log("check:"+ $(".ui.message:visible > p"));
                $(".ui.message:visible>p").text("Resetting password for "+accountEmail);
            }).catch(function (error) {
                $(".ui.negative.message:visible").removeClass('hidden');
                $(".ui.negative.message:visible > p").text(error.message);
            });
        }
    }
    this.resetPassword = function (newpassword) {
        $('form').addClass('loading');
        auth.confirmPasswordReset(this.actioncode, newpassword).then(function (resp) {
            // navigate back to login url.split('?')[0]
            $('form').removeClass('loading');
            console.log("BIG SUCCES, password reset succesful");
            $(".ui.positive.message:visible").removeClass('hidden');
        }).catch(function (error) {
            $('form').removeClass('loading');
            $(".ui.negative.message:visible").removeClass('hidden');
            $(".ui.negative.message:visible > p").text(error.message);
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