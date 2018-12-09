import {
    firebaseManager
} from '../utils/FireBaseManager';
import {
    game
} from '../Game';
import $ from 'jquery';
import * as dat from '../../libs/dat.gui';
import * as uiHelper  from '../b2Editor/utils/uiHelper';


let levelItemHolder;
let levelItemElement;

let mainMenu;
let gameOver;
let levelLoader;

function UIManager() {

    var self = this;

    this.buildMainMenu = function () {
        mainMenu = document.createElement('div');
        mainMenu.setAttribute('id', 'mainMenu')
        document.body.appendChild(mainMenu);

        let button = document.createElement('div');
        button.setAttribute('id', 'startButton')
        button.classList.add('menuButton');
        button.innerHTML = 'Play';
        mainMenu.appendChild(button);

        button.addEventListener("click", () => {
            self.hideMainMenu();
            this.showLevelLoader();
        });

        button = document.createElement('div');
        button.setAttribute('id', 'editorButton')
        button.classList.add('menuButton');
        button.innerHTML = 'Editor';

        button.addEventListener("click", () => {
            self.hideMainMenu();
            game.openEditor();
        });
        mainMenu.appendChild(button);

    }

    this.hideMainMenu = function () {
        mainMenu.style.display = "none";
    }

    this.showGameOver = function () {
        if (!gameOver) {
            gameOver = document.createElement('div');
            gameOver.setAttribute('id', 'gameOverScreen');
            document.body.appendChild(gameOver);

            let textGroup = document.createElement('div');
            textGroup.setAttribute('class', 'textGroup');
            gameOver.appendChild(textGroup);

            let text = document.createElement('div');
            text.setAttribute('class', 'gameOverText');
            text.innerHTML = 'You are dead';
            textGroup.appendChild(text);

            text = document.createElement('div');
            text.setAttribute('class', 'spaceRestartText');
            text.innerHTML = 'Press space to restart';
            textGroup.appendChild(text);

            let buttonGroup = document.createElement('div');
            buttonGroup.setAttribute('class', 'buttonGroup');
            gameOver.appendChild(buttonGroup);

            let button = document.createElement('div');
            button.setAttribute('class', 'headerButton restart buttonOverlay dark');
            button.innerHTML = "RESTART";
            buttonGroup.appendChild(button);

            $(button).click(() => {
                game.resetWorld();
            });

            button = document.createElement('div');
            button.setAttribute('class', 'headerButton exit buttonOverlay dark');
            button.innerHTML = "EXIT";
            buttonGroup.appendChild(button);

            $(button).click(() => {
                game.openMainMenu();
            });
        }
        gameOver.style.display = 'block';
    }
    this.hideGameOverMenu = function () {
        if (gameOver && gameOver.style.display == 'block') {
            gameOver.style.display = 'none';
        }
    }
    this.showLevelLoader = function () {


        if (!levelLoader) {
            const loginGUIWidth = 640;

            levelLoader = new dat.GUI({
                autoPlace: false,
                width: loginGUIWidth
            });
            levelLoader.domElement.setAttribute('id', 'levelLoader');

            let folder = levelLoader.addFolder('Load Screen');
            folder.domElement.classList.add('custom');
            folder.domElement.style.textAlign = 'center';

            folder.open();


            const titleElement = $(levelLoader.domElement).find('.title');
            titleElement.replaceWith(titleElement.clone());

            $(levelLoader.domElement).find('.arrow').hide();


            var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

            let divWrapper = document.createElement('div');
            divWrapper.style.padding = '0px 5px';

            //fill here
            var filterBar = document.createElement('div');
            filterBar.setAttribute('class', 'filterBar');


            //Name Filter
            var levelNameFilter = document.createElement('div');
            levelNameFilter.setAttribute('class', 'levelNameFilter');
            filterBar.appendChild(levelNameFilter);

            var filterIcon = document.createElement('div');
            filterIcon.setAttribute('class', 'filterIcon green arrow');
            levelNameFilter.appendChild(filterIcon);

            let span = document.createElement('span');
            span.setAttribute('class', 'filterTitle');
            span.innerText = 'Title';
            levelNameFilter.appendChild(span);

            //Author Filter
            var levelAuthorFilter = document.createElement('div');
            levelAuthorFilter.setAttribute('class', 'levelAuthorFilter');
            filterBar.appendChild(levelAuthorFilter);

            var filterIcon = document.createElement('div');
            filterIcon.setAttribute('class', 'filterIcon green arrow');
            levelAuthorFilter.appendChild(filterIcon);

            span = document.createElement('span');
            span.setAttribute('class', 'filterTitle');
            span.innerText = 'Author';
            levelAuthorFilter.appendChild(span);

            // Plays Filter
            var levelPlaysFilter = document.createElement('div');
            levelPlaysFilter.setAttribute('class', 'levelPlaysFilter');
            filterBar.appendChild(levelPlaysFilter);

            span = document.createElement('span');
            span.setAttribute('class', 'filterTitle');
            span.innerText = 'Plays';
            levelPlaysFilter.appendChild(span);

            // Ratings Filter
            var levelRatingsFilter = document.createElement('div');
            levelRatingsFilter.setAttribute('class', 'levelRatingsFilter');
            filterBar.appendChild(levelRatingsFilter);

            span = document.createElement('span');
            span.setAttribute('class', 'filterTitle');
            span.innerText = 'Rating';
            levelRatingsFilter.appendChild(span);

            // Date Filter
            var levelDateFilter = document.createElement('div');
            levelDateFilter.setAttribute('class', 'levelDateFilter');
            filterBar.appendChild(levelDateFilter);

            span = document.createElement('span');
            span.setAttribute('class', 'filterTitle');
            span.innerText = 'Created on';
            levelDateFilter.appendChild(span);

            // Share
            var levelShare = document.createElement('div');
            levelShare.setAttribute('class', 'levelShare');
            filterBar.appendChild(levelShare);

            span = document.createElement('span');
            span.setAttribute('class', 'filterTitle');
            span.innerText = 'Share';
            levelShare.appendChild(span);

            // Play
            var levelPlay = document.createElement('div');
            levelPlay.setAttribute('class', 'levelPlay');
            filterBar.appendChild(levelPlay);

            span = document.createElement('span');
            span.setAttribute('class', 'filterTitle');
            span.innerText = 'Play';
            levelPlay.appendChild(span);


            levelNameFilter.style.width = '30%';
            levelAuthorFilter.style.width = '15%';
            levelPlaysFilter.style.width = '10%';
            levelRatingsFilter.style.width = '10%';
            levelDateFilter.style.width = '13%';
            levelShare.style.width = '7%';
            levelPlay.style.width = '15%';



            divWrapper.appendChild(filterBar);

            //*********************************/
            // Single item

            var itemBar = document.createElement('div');
            itemBar.setAttribute('class', 'listItem');

            var levelNameDiv = document.createElement('div');
            levelNameDiv.setAttribute('class', 'levelNameDiv');
            itemBar.appendChild(levelNameDiv);

            var thumb = document.createElement('div');
            thumb.setAttribute('class', 'thumb');
            levelNameDiv.appendChild(thumb);

            span = document.createElement('span');
            span.setAttribute('class', 'itemTitle');
            span.innerText = 'Level Title';
            uiHelper.clampDot('.itemTitle', 1, 14);
            levelNameDiv.appendChild(span);

            levelNameDiv.appendChild(document.createElement('br'));

            span = document.createElement('span');
            span.setAttribute('class', 'itemDescription');
            span.innerHTML = 'This is a very tidious text blablabaa and its way to long blabla bla...';
            levelNameDiv.appendChild(span);

            uiHelper.clampDot('.itemDescription', 3, 14);

            var levelDateDiv = document.createElement('div');
            levelDateDiv.setAttribute('class', 'levelDateDiv');
            itemBar.appendChild(levelDateDiv);

            span = document.createElement('span');
            span.setAttribute('class', 'itemDate');
            span.innerText = '31-12-2020';
            levelDateDiv.appendChild(span);

            var levelLoadDiv = document.createElement('div');
            levelLoadDiv.setAttribute('class', 'levelLoadDiv');
            itemBar.appendChild(levelLoadDiv);

            let button = document.createElement('div');
            button.setAttribute('class', 'headerButton save buttonOverlay dark');
            button.innerHTML = "LOAD";
            levelLoadDiv.appendChild(button);
            //*********************************/

            let itemList = document.createElement('div');
            itemList.setAttribute('class', 'itemList');
            divWrapper.appendChild(itemList);

            var self = this;


            const buildLevelList = (levels) => {
                for (let level_id in levels) {
                    if (levels.hasOwnProperty(level_id)) {

                        const level = levels[level_id];
                        let $itemBar = $(itemBar).clone();
                        $(itemList).append($itemBar);
                        $itemBar.find('.itemTitle').text(level.title);
                        $itemBar.find('.itemDescription').text(level.description);
                        $itemBar.find('.itemDate').text(formatTimestamp.formatDMY(level.creationDate));
                        let loadButton = $itemBar.find('.headerButton.save');
                        loadButton.on('click', () => {
                            const doLevelLoad = () => {
                                loadButton[0].style.backgroundColor = 'grey';
                                loadButton[0].innerText = 'LOADING..';
                                game.loadUserLevelData(levels[level_id]).then(() => {
                                    loadButton[0].style.backgroundColor = '';
                                    loadButton[0].innerText = 'LOAD';
                                    self.hideEditorPanels();
                                    self.setLevelSpecifics();
                                }).catch((error) => {
                                    loadButton[0].style.backgroundColor = '';
                                    loadButton[0].innerText = 'LOAD';
                                });
                            }
                            if (game.levelHasChanges()) {
                                self.showPrompt(Settings.DEFAULT_TEXTS.unsavedChanges, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
                                    doLevelLoad();
                                }).catch((error) => {});
                            } else doLevelLoad();
                        });
                    }
                }
            }

            // firebaseManager.getUserLevels().then((levels) => {
            //     buildLevelList(levels);
            // })


            //

            // end here

            targetDomElement.appendChild(divWrapper);



            targetDomElement.appendChild(document.createElement('br'));
            targetDomElement.appendChild(document.createElement('br'));


            document.body.appendChild(levelLoader.domElement);
            levelLoader.domElement.style.position = 'absolute';

        }
        $(levelLoader.domElement).show();

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