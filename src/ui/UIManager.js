import {
    firebaseManager
} from '../utils/FireBaseManager';
import {
    game
} from '../Game';
import $ from 'jquery';

let levelItemHolder;
let levelItemElement;

let mainMenu;

function UIManager() {

    var self = this;

    this.buildMainMenu = function(){
        mainMenu = document.createElement('div');
        mainMenu.setAttribute('id', 'mainMenu')
        document.body.appendChild(mainMenu);

        let button = document.createElement('div');
        button.setAttribute('id', 'startButton')
        button.classList.add('menuButton');
        button.innerHTML = 'Play';
        mainMenu.appendChild(button);

        button = document.createElement('div');
        button.setAttribute('id', 'editorButton')
        button.classList.add('menuButton');
        button.innerHTML = 'Editor';

        button.addEventListener("click", ()=>{
            self.hideMainMenu();
            game.openEditor();
        });
        mainMenu.appendChild(button);
    }

    this.hideMainMenu = function(){
        mainMenu.style.display = "none";
    }





















    

    // LEGACY STUFF, HAS TO BE DELETED AT SOME POINT BUT CAN BORROW CODE

    this.showBox = function (name) {
        self.showNothing();
        $(name).css("display", "inline");
    }

    this.showNothing = function () {
        $('.box').css("display", "none");
        $(".ui.positive.message").addClass('hidden');
        $(".ui.negative.message").addClass('hidden');
        $('form').removeClass('loading');
    }

    this.displayLevels = function (levelSnapshot) {
        levelItemHolder.empty();
        var itemClone;
        var level;
        var i = 0;
        var self = this;
        for (var key in levelSnapshot) {
            if (levelSnapshot.hasOwnProperty(key)) {

                level = levelSnapshot[key];
                itemClone = (i == 0) ? levelItemElement : levelItemElement.clone();
                itemClone.find("#creator").html(level.name + "<br>by <a href=" + "www.google.com" + ">" + level.creator + "</a>");
                if (level.thumbLowResURL) {
                    itemClone.find("img").attr("src", firebaseManager.baseDownloadURL + level.thumbLowResURL);
                }
                console.log("Level:" + key);
                console.log(levelSnapshot[key]);
                itemClone.appendTo(levelItemHolder);

                (key => {
                    itemClone.find("#playButton").click(function () {
                        $(this).parent().parent().parent().addClass('loading');
                        console.log('loading key:' + key);
                        console.log(levelSnapshot[key]);
                        game.loadLevel(levelSnapshot[key]);
                    })
                })(key)
                i++;
            }
        }
    }
    this.loggedIn = function () {
        this.showNothing();
        // $("#sidebar_loginout_btn").unbind("click");
        $("#sidebar_loginout_btn").text("Signout");
        $("#sidebar_loginout_btn").click(function () {
            firebaseManager.signout();
            console.log("menu loggedin");
        });

        $("#sidebar_loadlevel_btn").removeClass("disabled");
        $("#sidebar_publishlevel_btn").removeClass("disabled");
    }
    this.signedOut = function () {
        //$("#sidebar_loginout_btn").unbind("click");
        $("#sidebar_loginout_btn").text("Login");
        $("#sidebar_loginout_btn").click(function () {
            ui.showBox('#login-box');
            console.log("menu signedout!!");
        });
        $("#sidebar_loadlevel_btn").addClass("disabled");
        $("#sidebar_publishlevel_btn").addClass("disabled");
    }

    this.init = function () {
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
                },
                level_title: {
                    identifier: 'level_title',
                    rules: [{
                            type: 'empty',
                            prompt: 'Please enter a level title'
                        },
                        {
                            type: 'length[3]',
                            prompt: 'Level title must be at least 3 characters'
                        }
                    ]
                }
            },
            onSuccess: null
        };

        formRules.onSuccess = function () {
            self.formSuccesFunction($(this));
            return false;
        }
        $('.ui.form').form(formRules);

        //SIDEBAR FUNCTIONALITY
        $('#sidebar-btn').click(function () {
            $('.ui.sidebar').sidebar('toggle');
        });

        $('#sidebar_loadlevel_btn').click(function () {
            self.showBox("#loadlevel-box");
            game.retreiveNextLevelList();
        })
        $('#sidebar_publishlevel_btn').click(function () {
            self.showBox("#publishlevel-box");
        })

        levelItemHolder = $("#loadlevel-box .segments");
        levelItemElement = $("#loadlevel-box .segment").clone();
        levelItemHolder.empty();

        this.signedOut();
        firebaseManager.checkURLParameters();
    }
    this.formSuccesFunction = function ($form) {
        $('form').addClass('loading');
        var formName = $form.parent().attr('id');
        switch (formName) {
            case "login-box":
                console.log("LOGIN PRESS");
                $('form').addClass('loading');
                firebaseManager.login($form.closest('.ui.form').form('get value', 'email'), $form.closest(
                    '.ui.form').form('get value',
                    'password'));
                return false;
                break;

            case "register-box":
                firebaseManager.createUser($form.closest('.ui.form').form('get value', 'email'), $form.closest(
                    '.ui.form').form('get value',
                    'password'));
                break;

            case "reset-box":
                firebaseManager.requestResetPassword($form.closest('.ui.form').form('get value', 'email'));
                break;

            case "reset-box":
                firebaseManager.resetPassword($form.closest('.ui.form').form('get value', 'password'));
                break;

            case "userdata-box":
                var data = {
                    username: $form.closest('.ui.form').form('get value', 'username'),
                    creationDate: Date.now()
                }
                firebaseManager.checkUserData(data);
                break;

            case "signout-box":
                console.log("SIGN OUT");
                firebaseManager.signout();
                break;
            case "publishlevel-box":
                console.log("PUBLISH LEVEL");
                game.uploadLevelData({
                    name: $form.closest('.ui.form').form('get value', 'level_title'),
                    description: $form.closest('.ui.form').form('get value', 'level_description')
                });
                break;
            default:
                console.log("NO FUNCTION SET FOR: " + formName);
                break;

        }
    }
    this.levelPublishSuccess = function () {
        $('form').removeClass('loading');
        this.showNothing();
    }
}
export var ui = new UIManager();