function UIManager() {

    var self = this;
    this.showLogin = function () {
        self.showNothing();
        $("#login-box").css("display", "inline");
    }

    this.showRegister = function () {
        self.showNothing();
        $("#register-box").css("display", "inline");
    }

    this.showForgot = function () {
        self.showNothing();
        $("#forgot-box").css("display", "inline");
    }

    this.showReset = function () {
        self.showNothing();
        $("#reset-box").css("display", "inline");
    }

    this.showUserData = function () {
        self.showNothing();
        $("#userdata-box").css("display", "inline");
    }

    this.showSignout = function () {
        self.showNothing();
        $("#signout-box").css("display", "inline");
    }

    this.showNothing = function () {
        $("#login-box").css("display", "none");
        $("#register-box").css("display", "none");
        $("#forgot-box").css("display", "none");
        $("#reset-box").css("display", "none");
        $("#userdata-box").css("display", "none");
        $("#signout-box").css("display", "none");
        $(".ui.positive.message").addClass('hidden');
        $(".ui.negative.message").addClass('hidden');
        $('form').removeClass('loading');
    }

    this.initForm = function () {
        console.log("init form!");
        var formRules = {
            on: 'blur',
            fields: {
                email: {
                    identifier: 'email',
                    rules: [{
                            type: 'empty',
                            prompt: 'Please enter your e-mail'
                        },
                        {
                            type: 'email',
                            prompt: 'Please enter a valid e-mail'
                        }
                    ],
                },
                password: {
                    identifier: 'password',
                    rules: [{
                            type: 'empty',
                            prompt: 'Please enter your password'
                        },
                        {
                            type: 'length[6]',
                            prompt: 'Your password must be at least 6 characters'
                        }
                    ]
                },
                name: {
                    identifier: 'username',
                    rules: [{
                            type: 'empty',
                            prompt: 'Please enter your name'
                        },
                        {
                            type: 'length[3]',
                            prompt: 'Your name must be at least 3 characters'
                        }
                    ]
                }
            },
            onSuccess: null
        };

        formRules.onSuccess = function () {
            console.log("LOGIN PRESS");
            $('form').addClass('loading');
            firebaseManager.login($(this).closest('.ui.form').form('get value', 'email'), $(this).closest(
                '.ui.form').form('get value',
                'password'));
            return false;
        };
        $('#login-box').children('.ui.form').form(formRules);

        console.log($('#login-box'));

        formRules.onSuccess = function () {
            $('form').addClass('loading');
            firebaseManager.createUser($(this).closest('.ui.form').form('get value', 'email'), $(this).closest(
                '.ui.form').form('get value',
                'password'));
            return false;
        }
        $('#register-box').children('.ui.form').form(formRules);

        formRules.onSuccess = function () {
            $('form').addClass('loading');
            firebaseManager.requestResetPassword($(this).closest('.ui.form').form('get value', 'email'));
            return false;
        }
        $('#forgot-box').children('.ui.form').form(formRules);

        formRules.onSuccess = function () {
            $('form').addClass('loading');
            firebaseManager.resetPassword($(this).closest('.ui.form').form('get value', 'password'));
            return false;
        }
        $('#reset-box').children('.ui.form').form(formRules);

        formRules.onSuccess = function () {
            $('form').addClass('loading');
            console.log("SIGN OUT");
            var data = {
                username: $(this).closest('.ui.form').form('get value', 'username'),
                creationDate: Date.now()
            }
            firebaseManager.checkUserData(data);
            return false;
        }
        $('#userdata-box').children('.ui.form').form(formRules);
        firebaseManager.checkURLParameters();

        formRules.onSuccess = function () {
            $('form').addClass('loading');
            console.log("SIGN OUT");
            firebaseManager.signout();
            return false;
        }
        $('#signout-box').children('.ui.form').form(formRules);
        firebaseManager.checkURLParameters();
    }
}
var ui = new UIManager();
window.addEventListener("load", function() { ui.initForm();}.bind(this));