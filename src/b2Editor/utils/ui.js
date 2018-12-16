import {
    B2dEditor
} from "../B2dEditor";
import * as scrollBars from "./scrollBars";
import * as dat from "../../../libs/dat.gui";
import {
    game
} from "../../Game";
import {
    firebaseManager
} from "../../utils/FireBaseManager";
import {
    Settings
} from "../../Settings";
import * as formatTimestamp from './formatTimestamp';

import * as uiHelper from './uiHelper';

const nanoid = require('nanoid');



let toolGUI;
export let assetGUI;
export let editorGUI;
let headerBar;
let levelEditScreen;
let loginScreen;
let registerScreen;
let usernameScreen;
let saveScreen;
let loadScreen;
let notice;
let prompt;
let textEditor;

let uiContainer = document.getElementById('uicontainer');
let customGUIContainer = document.getElementById('my-gui-container');
let windowHideTime = 500;

let levelList = undefined;

export const hide = function () {
    uiContainer.style.display = "none";
    scrollBars.hide();
}
export const show = function () {
    uiContainer.style.display = "block";
    scrollBars.show();
}

export const initGui = function () {
    initGuiAssetSelection();
    createToolGUI();
    this.showHeaderBar();
    B2dEditor.canvas.focus();
    scrollBars.update();

    firebaseManager.registerListener('login', handleLoginStatusChange);
    firebaseManager.registerListener('logout', handleLoginStatusChange);

    handleLoginStatusChange();
}
export const hideEditorPanels = function () {
    hidePanel(levelEditScreen);
    hidePanel(loginScreen);
    hidePanel(registerScreen);
    hidePanel(saveScreen);
    hidePanel(loadScreen);
    hidePanel(notice);
    hidePanel(prompt);
}
export const hidePanel = function (panel) {
    if (panel) $(panel.domElement).hide(windowHideTime);
}
export const setLevelSpecifics = function () {
    $('.editorHeader > span').text(game.currentLevelData.title);
}
export const setNewLevelData = function () {
    if (levelEditScreen) {
        game.currentLevelData.title = $(levelEditScreen.domElement).find('#levelEdit_title').val();
        console.log($(levelEditScreen.domElement).find('#levelEdit_title'));
        game.currentLevelData.description = $(levelEditScreen.domElement).find('#levelEdit_description').text();
        console.log($(levelEditScreen.domElement).find('#levelEdit_description'));
    }
}
const handleLoginStatusChange = function (event) {
    if (headerBar) {
        if (firebaseManager.isLoggedIn()) {
            $(headerBar).find('#loginButton').hide();
            $(headerBar).find('#profileButton').show();
        } else {
            $(headerBar).find('#loginButton').show();
            $(headerBar).find('#profileButton').hide();
        }
    }
    if ((event && event.type == 'login') || firebaseManager.isLoggedIn()) {
        firebaseManager.getUserData().then(() => {}).catch((error) => {
            showUsernameScreen();
        });
    }
}
const checkLevelDataForErrors = function(){
    const title = $(levelEditScreen.domElement).find('#levelEdit_title')[0];
    const description = $(levelEditScreen.domElement).find('#levelEdit_description')[0];
    const errorSpan = $(levelEditScreen.domElement).find('#levelEdit_errorText')[0];

    var errorStack = [];
    const textAreaDefaultColor = '#fff';
    const textAreaErrorColor = '#e8764b';

    title.style.backgroundColor = textAreaDefaultColor;
    description.style.backgroundColor = textAreaDefaultColor;

    if (title.value.length < 3) {
        title.style.backgroundColor = textAreaErrorColor;
        errorStack.push("Title must be at least 3 characters long");
    }

    errorSpan.innerText = '';
    if (errorStack.length == 0) return true;
    for (var i = 0; i < errorStack.length; i++) {
        errorSpan.innerText += errorStack[i] + '\n';
    }
    return false;
}
const doSaveLevelData = function (saveButton) {
    //save locally first

    if(!levelEditScreen){
         showLevelEditScreen();
         levelEditScreen.domElement.style.display = 'none';
    }
    if (!checkLevelDataForErrors()){
        showLevelEditScreen();
        return;
    }
    if (!firebaseManager.isLoggedIn()) return showNotice(Settings.DEFAULT_TEXTS.save_notLoggedIn);

    setNewLevelData();
    setLevelSpecifics();

    saveButton.style.backgroundColor = 'grey';
    saveButton.innerText = 'SAVING..';

    //try to save online
    game.saveLevelData().then(() => {
        saveButton.style.backgroundColor = '';
        saveButton.innerText = 'SAVE';
    }).catch((error) => {
        console.log(error);
        saveButton.style.backgroundColor = '';
        saveButton.innerText = 'SAVE';
    });
}
export const showHeaderBar = function () {
    headerBar = document.createElement('div');
    headerBar.setAttribute('class', 'editorHeader');
    customGUIContainer.appendChild(headerBar);

    let smallLogo = document.createElement('div');
    smallLogo.setAttribute('class', 'logoSmall');
    headerBar.appendChild(smallLogo);

    let button = document.createElement('div');
    button.setAttribute('class', 'headerButton test buttonOverlay dark');
    button.innerHTML = "TEST";
    headerBar.appendChild(button);

    $(button).on('click', () => {
        game.testWorld();
    });

    let self = this;

    let saveButton = document.createElement('div');
    saveButton.setAttribute('class', 'headerButton save buttonOverlay dark');
    saveButton.innerHTML = "SAVE";
    headerBar.appendChild(saveButton);

    $(saveButton).on('click', () => {
        //save locally first
        doSaveLevelData(saveButton);
    });

    button = document.createElement('div');
    button.setAttribute('class', 'headerButton login buttonOverlay dark');
    button.setAttribute('id', 'loginButton');
    button.innerHTML = "LOGIN";
    headerBar.appendChild(button);
    button.addEventListener('click', showLoginScreen);

    button = document.createElement('div');
    button.setAttribute('class', 'headerButton profile buttonOverlay dark');
    button.setAttribute('id', 'profileButton');
    headerBar.appendChild(button);
    button.style.width = '48px';
    button.style.height = '30px';
    button.addEventListener('click', () => {
        firebaseManager.signout();
    });


    button = document.createElement('div');
    button.setAttribute('class', 'headerButton exit buttonOverlay dark');
    button.innerHTML = "EXIT";
    headerBar.appendChild(button);

    button = document.createElement('div');
    button.setAttribute('class', 'headerButton load buttonOverlay dark');
    button.innerHTML = "LOAD";
    headerBar.appendChild(button);
    button.addEventListener('click', self.showLoadScreen.bind(self));

    button = document.createElement('div');
    button.setAttribute('class', 'headerButton new buttonOverlay dark');
    button.innerHTML = "NEW";
    headerBar.appendChild(button);

    button.addEventListener('click', () => {
        game.newLevel();
        hideEditorPanels();
        setLevelSpecifics();
    });

    button = document.createElement('div');
    button.setAttribute('class', 'headerIcon edit buttonOverlay dark');
    headerBar.appendChild(button);
    button.addEventListener('click', self.showLevelEditScreen.bind(self));


    let levelName = document.createElement('span');
    levelName.innerHTML = "TEST 123";
    button.setAttribute('id', 'levelName');
    headerBar.appendChild(levelName);


    handleLoginStatusChange();
}

export const showLoginScreen = function () {
    if (!loginScreen) {
        const loginGUIWidth = 300;

        loginScreen = new dat.GUI({
            autoPlace: false,
            width: loginGUIWidth
        });
        loginScreen.domElement.setAttribute('id', 'loginScreen');

        let folder = loginScreen.addFolder('Login Screen');
        folder.domElement.classList.add('custom');
        folder.domElement.style.textAlign = 'center';

        folder.open();

        const closeButton = document.createElement('div');
        closeButton.setAttribute('class', 'closeWindowIcon');
        folder.domElement.append(closeButton);
        $(closeButton).click(() => {
            hidePanel(loginScreen);
        });


        var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];



        let span = document.createElement('span');
        span.innerText = 'LOG IN';
        targetDomElement.appendChild(span);
        span.style.fontSize = '20px';
        span.style.marginTop = '20px';
        span.style.display = 'inline-block';


        let divWrapper = document.createElement('div');
        divWrapper.style.padding = '0px 20px';

        var textAreanStyle = 'font-size:18px;height:30px;margin:10px auto;text-align:center;font-weight:bold'

        let email = document.createElement('input');
        email.value = '1@1.nl'; //PLACEHOLDER
        email.setAttribute('placeholder', 'Email');
        email.setAttribute('tabindex', '0');
        divWrapper.appendChild(email);
        email.style = textAreanStyle;

        let password = document.createElement('input');
        password.setAttribute('placeholder', 'Password');
        password.value = 'appelsap'; //PLACEHOLDER
        password.setAttribute('tabindex', '0');
        password.setAttribute('type', 'password');
        divWrapper.appendChild(password);
        password.style = textAreanStyle;


        let errorSpan = document.createElement('span');
        errorSpan.innerText = '';
        errorSpan.style.display = 'block';
        errorSpan.style.color = '#ff4b00';
        errorSpan.style.margin = '20px auto';
        divWrapper.appendChild(errorSpan);


        const errorChecks = (noDefault = false) => {
            var errorStack = [];
            const textAreaDefaultColor = '#fff';
            const textAreaErrorColor = '#e8764b';

            email.style.backgroundColor = textAreaDefaultColor;
            password.style.backgroundColor = textAreaDefaultColor;

            if (email.value != '' || noDefault) {
                var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
                if (!re.test(String(email.value).toLowerCase())) {
                    errorStack.push("Email entered is not a valid email address");
                    email.style.backgroundColor = textAreaErrorColor;
                }
            }

            if (password.value != '' || noDefault) {
                if (password.value.length < 6) {
                    errorStack.push("Password must be at last 6 characters long");
                    password.style.backgroundColor = textAreaErrorColor;
                }
            }

            errorSpan.innerText = '';
            //errorSpan.style.margin = errorStack.length>0? '20px auto' : '0px';
            if (errorStack.length == 0) return true;
            for (var i = 0; i < errorStack.length; i++) {
                errorSpan.innerText += errorStack[i] + '\n';
            }
            return false;
        }
        let func = (textarea) => {
            let _text = textarea;
            var f = () => {
                const maxChars = 32;
                if (_text.value.length > maxChars) _text.value = _text.value.substr(0, maxChars);
                errorChecks();
            }
            f();
            return f;
        }

        $(email).on('input selectionchange propertychange', func(email));
        $(email).blur(errorChecks);

        $(password).on('input selectionchange propertychange', func(password));
        $(password).blur(errorChecks);

        targetDomElement.appendChild(divWrapper);

        span = document.createElement('span');
        span.innerText = 'No account? ';
        targetDomElement.appendChild(span);

        span = document.createElement('span');
        span.innerText = 'Sign Up!';
        targetDomElement.appendChild(span);
        span.setAttribute('class', 'text_button');
        $(span).on('click', () => {
            $(loginScreen.domElement).toggle();
            showRegisterScreen();
        });

        let button = document.createElement('div');
        button.setAttribute('id', 'acceptButton')
        button.setAttribute('tabindex', '0');
        button.classList.add('menuButton');
        button.innerHTML = 'Login!';
        targetDomElement.appendChild(button);
        button.style.margin = '10px auto';
        $(button).keypress(function (e) {
            if (e.keyCode == 13)
                $(button).click();
        });

        var dotShell = document.createElement('div');
        dotShell.setAttribute('class', 'dot-shell')
        button.appendChild(dotShell);
        var dots = document.createElement('div');
        dots.setAttribute('class', 'dot-pulse')
        dotShell.appendChild(dots);
        $(dotShell).hide();


        $(button).on('click', () => {
            if (errorChecks(true)) {
                let oldText = button.innerHTML;
                button.innerHTML = '';
                button.appendChild(dotShell);
                $(dotShell).show();
                firebaseManager.login(email.value, password.value).then(() => {
                    console.log("Succesfully logged in!!");
                    hidePanel(loginScreen);
                    button.innerHTML = oldText;
                    $(dotShell).hide();

                }).catch((error) => {
                    console.log("Firebase responded with", error.code);
                    errorSpan.innerText = error.message;
                    button.innerHTML = oldText;
                    $(dotShell).hide();
                });
            }
        });

        span = document.createElement('span');
        span.innerText = 'Forgot your password?';
        targetDomElement.appendChild(span);
        span.setAttribute('class', 'text_button');

        targetDomElement.appendChild(document.createElement('br'));
        targetDomElement.appendChild(document.createElement('br'));


        customGUIContainer.appendChild(loginScreen.domElement);


        registerDragWindow(loginScreen);

    }
    $(loginScreen.domElement).show();

    if (registerScreen) {
        loginScreen.domElement.style.top = registerScreen.domElement.style.top;
        loginScreen.domElement.style.left = registerScreen.domElement.style.left;
    }
}

export const showRegisterScreen = function () {
    if (!registerScreen) {
        const loginGUIWidth = 300;

        registerScreen = new dat.GUI({
            autoPlace: false,
            width: loginGUIWidth
        });
        registerScreen.domElement.setAttribute('id', 'registerScreen');

        let folder = registerScreen.addFolder('Register Screen');
        folder.domElement.classList.add('custom');
        folder.domElement.style.textAlign = 'center';

        folder.open();


        var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];


        let span = document.createElement('span');
        span.innerText = 'SIGN UP';
        targetDomElement.appendChild(span);
        span.style.fontSize = '20px';
        span.style.marginTop = '20px';
        span.style.display = 'inline-block';


        let divWrapper = document.createElement('div');
        divWrapper.style.padding = '0px 20px';

        var textAreanStyle = 'font-size:18px;height:30px;margin:10px auto;text-align:center;font-weight:bold'

        let email = document.createElement('input');
        email.setAttribute('placeholder', 'Email');
        email.setAttribute('tabindex', '0');
        divWrapper.appendChild(email);
        email.style = textAreanStyle;

        let password = document.createElement('input');
        password.setAttribute('placeholder', 'Password');
        password.setAttribute('tabindex', '0');
        password.setAttribute('type', 'password');
        divWrapper.appendChild(password);
        password.style = textAreanStyle;

        let repassword = document.createElement('input');
        repassword.setAttribute('placeholder', 'Re-type Password');
        repassword.setAttribute('tabindex', '0');
        repassword.setAttribute('type', 'password');
        divWrapper.appendChild(repassword);
        repassword.style = textAreanStyle;

        let errorSpan = document.createElement('span');
        errorSpan.innerText = '';
        errorSpan.style.display = 'block';
        errorSpan.style.color = '#ff4b00';
        errorSpan.style.margin = '20px auto';
        divWrapper.appendChild(errorSpan);


        const errorChecks = (noDefault = false) => {
            var errorStack = [];
            const textAreaDefaultColor = '#fff';
            const textAreaErrorColor = '#e8764b';

            password.style.backgroundColor = textAreaDefaultColor;
            repassword.style.backgroundColor = textAreaDefaultColor;
            email.style.backgroundColor = textAreaDefaultColor;

            if (password.value != '' || noDefault) {
                if (password.value.length < 6) {
                    errorStack.push("Password must be at last 6 characters long");
                    password.style.backgroundColor = textAreaErrorColor;
                }
            }

            if (repassword.value != '' || noDefault) {
                if (repassword.value != password.value) {
                    errorStack.push("Your passwords do not match");
                    repassword.style.backgroundColor = textAreaErrorColor;
                }
            }

            if (email.value != '' || noDefault) {
                var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
                if (!re.test(String(email.value).toLowerCase())) {
                    errorStack.push("Email entered is not a valid email address");
                    email.style.backgroundColor = textAreaErrorColor;
                }
            }

            errorSpan.innerText = '';
            //errorSpan.style.margin = errorStack.length>0? '20px auto' : '0px';
            if (errorStack.length == 0) return true;
            for (var i = 0; i < errorStack.length; i++) {
                errorSpan.innerText += errorStack[i] + '\n';
            }
            return false;
        }
        let func = (textarea) => {
            let _text = textarea;
            var f = () => {
                const maxChars = 32;
                if (_text.value.length > maxChars) _text.value = _text.value.substr(0, maxChars);
                errorChecks();
            }
            f();
            return f;
        }


        $(password).on('input selectionchange propertychange', func(password));
        $(password).blur(errorChecks);

        $(repassword).on('input selectionchange propertychange', func(repassword));
        $(repassword).blur(errorChecks);

        $(email).on('input selectionchange propertychange', func(email));
        $(email).blur(errorChecks);


        targetDomElement.appendChild(divWrapper);


        span = document.createElement('span');
        span.innerText = 'Do you agree to our ';
        targetDomElement.appendChild(span);

        span = document.createElement('span');
        span.innerText = 'Terms of Use?';
        targetDomElement.appendChild(span);
        span.setAttribute('class', 'text_button');

        let button = document.createElement('div');
        button.setAttribute('id', 'acceptButton')
        button.setAttribute('tabindex', '0');
        button.classList.add('menuButton');
        button.innerHTML = 'Accept!';
        targetDomElement.appendChild(button);
        button.style.margin = '10px auto';
        $(button).keypress(function (e) {
            if (e.keyCode == 13)
                $(button).click();
        });

        var dotShell = document.createElement('div');
        dotShell.setAttribute('class', 'dot-shell')
        button.appendChild(dotShell);
        var dots = document.createElement('div');
        dots.setAttribute('class', 'dot-pulse')
        dotShell.appendChild(dots);
        $(dotShell).hide();


        $(button).on('click', () => {
            if (errorChecks(true)) {
                $(dotShell).show();
                let oldText = button.innerHTML;
                button.innerHTML = '';
                button.appendChild(dotShell);
                firebaseManager.registerUser(email.value, password.value).then(() => {
                    console.log("Succesfully registered!!");
                    hidePanel(registerScreen);
                    $(dotShell).hide();
                    button.innerHTML = oldText;
                }).catch((error) => {
                    console.log("Firebase responded with", error.code);
                    let errorMessage = error.message;
                    if (error.code == 'PERMISSION_DENIED') errorMessage = 'Username already claimed by other email';
                    errorSpan.innerText = errorMessage;
                    $(dotShell).hide();
                    button.innerHTML = oldText;
                });
            }
        });


        span = document.createElement('span');
        span.innerText = 'Have an account? ';
        targetDomElement.appendChild(span);

        span = document.createElement('span');
        span.innerText = 'Log In!';
        targetDomElement.appendChild(span);
        span.setAttribute('class', 'text_button');
        $(span).on('click', () => {
            $(registerScreen.domElement).hide();
            showLoginScreen();
        });

        targetDomElement.appendChild(document.createElement('br'));
        targetDomElement.appendChild(document.createElement('br'));

        customGUIContainer.appendChild(registerScreen.domElement);

        registerDragWindow(registerScreen);

    }
    registerScreen.domElement.style.display = "block";

    if (loginScreen) {
        registerScreen.domElement.style.top = loginScreen.domElement.style.top;
        registerScreen.domElement.style.left = loginScreen.domElement.style.left;
    }
}
export const showUsernameScreen = function () {
    if (!usernameScreen) {
        const loginGUIWidth = 300;

        usernameScreen = new dat.GUI({
            autoPlace: false,
            width: loginGUIWidth
        });
        usernameScreen.domElement.setAttribute('id', 'usernameScreen');

        let folder = usernameScreen.addFolder('Username Screen');
        folder.domElement.classList.add('custom');
        folder.domElement.style.textAlign = 'center';

        folder.open();

        var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];


        let span = document.createElement('span');
        span.innerText = 'USERNAME';
        targetDomElement.appendChild(span);
        span.style.fontSize = '20px';
        span.style.marginTop = '20px';
        span.style.display = 'inline-block';


        let divWrapper = document.createElement('div');
        divWrapper.style.padding = '0px 20px';

        var textAreanStyle = 'font-size:18px;height:30px;margin:10px auto;text-align:center;font-weight:bold'

        let username = document.createElement('input');
        username.value = Settings.DEFAULT_TEXTS.login_DefaultUsername;
        username.setAttribute('tabindex', '0');
        divWrapper.appendChild(username);
        username.style = textAreanStyle;

        let errorSpan = document.createElement('span');
        errorSpan.innerText = '';
        errorSpan.style.display = 'block';
        errorSpan.style.color = '#ff4b00';
        errorSpan.style.margin = '20px auto';
        divWrapper.appendChild(errorSpan);


        const errorChecks = (noDefault = false) => {
            var errorStack = [];
            const textAreaDefaultColor = '#fff';
            const textAreaErrorColor = '#e8764b';

            username.style.backgroundColor = textAreaDefaultColor;

            if (username.value != Settings.DEFAULT_TEXTS.login_DefaultUsername || noDefault) {
                if (username.value.length < 3) {
                    errorStack.push("Username must be at last 3 characters long");
                    username.style.backgroundColor = textAreaErrorColor;
                }
            }
            errorSpan.innerText = '';
            //errorSpan.style.margin = errorStack.length>0? '20px auto' : '0px';
            if (errorStack.length == 0) return true;
            for (var i = 0; i < errorStack.length; i++) {
                errorSpan.innerText += errorStack[i] + '\n';
            }
            return false;
        }
        let func = (textarea) => {
            let _text = textarea;
            var f = () => {
                const maxChars = 32;
                if (_text.value.length > maxChars) _text.value = _text.value.substr(0, maxChars);
                _text.value = _text.value.replace(/[^A-Z0-9_-]/ig, '');
                errorChecks();
            }
            f();
            return f;
        }
        let focus = (textarea, value) => {
            let _text = textarea;
            let _value = value;
            var f = () => {
                if (_text.value == _value) textarea.value = '';
            }
            f();
            return f;
        };
        let blur = (textarea, value) => {
            let _text = textarea;
            let _value = value;
            var f = () => {
                if (_text.value == '') {
                    textarea.value = _value;
                }
                errorChecks();
            }
            f();
            return f;
        };

        $(username).on('input selectionchange propertychange', func(username));
        $(username).focus(focus(username, Settings.DEFAULT_TEXTS.login_DefaultUsername));
        $(username).blur(blur(username, Settings.DEFAULT_TEXTS.login_DefaultUsername));

        targetDomElement.appendChild(divWrapper);


        let button = document.createElement('div');
        button.setAttribute('id', 'acceptButton')
        button.setAttribute('tabindex', '0');
        button.classList.add('menuButton');
        button.innerHTML = 'Accept!';
        targetDomElement.appendChild(button);
        button.style.margin = '10px auto';
        $(button).keypress(function (e) {
            if (e.keyCode == 13)
                $(button).click();
        });

        var dotShell = document.createElement('div');
        dotShell.setAttribute('class', 'dot-shell')
        button.appendChild(dotShell);
        var dots = document.createElement('div');
        dots.setAttribute('class', 'dot-pulse')
        dotShell.appendChild(dots);
        $(dotShell).hide();


        $(button).on('click', () => {
            if (errorChecks(true)) {
                $(dotShell).show();
                let oldText = button.innerHTML;
                button.innerHTML = '';
                button.appendChild(dotShell);

                var userData = {
                    username: username.value,
                    creationDate: Date.now(),
                }
                firebaseManager.claimUsername(username.value)
                    .then(firebaseManager.storeUserData(userData))
                    .then(() => {
                        hidePanel(usernameScreen);
                        $(dotShell).hide();
                        button.innerHTML = oldText;
                    }).catch((error) => {
                        console.log("Firebase responded with", error.code);
                        let errorMessage = error.message;
                        if (error.code == 'PERMISSION_DENIED') errorMessage = 'Username already claimed by other email';
                        errorSpan.innerText = errorMessage;
                        $(dotShell).hide();
                        button.innerHTML = oldText;
                    });
            }
        });


        targetDomElement.appendChild(document.createElement('br'));
        targetDomElement.appendChild(document.createElement('br'));


        customGUIContainer.appendChild(usernameScreen.domElement);

        registerDragWindow(usernameScreen);

    }
    usernameScreen.domElement.style.display = "block";
    if (loginScreen) {
        usernameScreen.domElement.style.top = loginScreen.domElement.style.top;
        usernameScreen.domElement.style.left = loginScreen.domElement.style.left;
    }
}

export const showLevelEditScreen = function () {
    if (!levelEditScreen) {
        const levelEditGUIWidth = 350;

        levelEditScreen = new dat.GUI({
            autoPlace: false,
            width: levelEditGUIWidth
        });
        levelEditScreen.domElement.setAttribute('id', 'levelEditScreen');

        let folder = levelEditScreen.addFolder('Level Settings');
        folder.domElement.classList.add('custom');

        folder.open();

        const closeButton = document.createElement('div');
        closeButton.setAttribute('class', 'closeWindowIcon');
        folder.domElement.append(closeButton);
        $(closeButton).click(() => {
            hidePanel(levelEditScreen);
        });


        var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

        let divWrapper = document.createElement('div');
        divWrapper.style.padding = '20px';

        let youtubeFeed = document.createElement('div');
        youtubeFeed.setAttribute('id', 'youtubeFeed');
        divWrapper.appendChild(youtubeFeed);

        let thumbNail;
        thumbNail = document.createElement('div');
        thumbNail.setAttribute('id', 'levelThumbnail');
        youtubeFeed.appendChild(thumbNail);

        let thumbNailImage;
        thumbNailImage = new Image();
        thumbNailImage.setAttribute('id', 'levelThumbnailImage');
        thumbNail.appendChild(thumbNailImage);


        let thumbnailShotComplete = () => {
            levelEditScreen.domElement.style.display = 'block';
            thumbNailImage.src = B2dEditor.cameraShotData.lowRes;
            thumbNailImage.style.display = 'block';
        }

        $(thumbNail).click(() => {
            B2dEditor.cameraShotCallBack = thumbnailShotComplete;
            B2dEditor.selectTool(B2dEditor.tool_CAMERA);
            levelEditScreen.domElement.style.display = 'none';
        });

        let youtubeLink;
        for (let i = 0; i < 2; i++) {
            youtubeLink = document.createElement('div');
            youtubeLink.setAttribute('id', 'youtubeLink');
            youtubeFeed.appendChild(youtubeLink);
        }


        let span = document.createElement('span');
        span.innerText = 'Add YouTube links';
        divWrapper.appendChild(span);


        divWrapper.appendChild(document.createElement('br'));
        divWrapper.appendChild(document.createElement('br'));


        let title = document.createElement('input');
        title.setAttribute('id', 'levelEdit_title');
        title.setAttribute('placeholder', 'Title');
        divWrapper.appendChild(title);
        title.style.fontSize = '18px';
        title.style.height = '30px';
        title.style.fontWeight = 'bold';


        span = document.createElement('span');
        span.innerText = 'Characters left:100';
        divWrapper.appendChild(span);


        let func = (textarea, span) => {
            let _text = textarea;
            let _span = span;
            var f = () => {
                const maxChars = 32;
                if (_text.value.length > maxChars) _text.value = _text.value.substr(0, maxChars);
                _span.innerText = `Characters left:${maxChars-_text.value.length}`;
            }
            f();
            return f;
        }
        $(title).on('input selectionchange propertychange', func(title, span));

        divWrapper.appendChild(document.createElement('br'));
        divWrapper.appendChild(document.createElement('br'));

        let description = document.createElement('textarea');
        description.setAttribute('id', 'levelEdit_description');
        description.setAttribute('placeholder', 'Description');
        divWrapper.appendChild(description);
        description.style.height = '100px';


        span = document.createElement('span');
        span.innerText = 'Characters left:300';
        divWrapper.appendChild(span);



        func = (textarea, span) => {
            let _text = textarea;
            let _span = span;
            var f = () => {
                const maxChars = 300;
                if (_text.value.length > maxChars) _text.value = _text.value.substr(0, maxChars);
                _span.innerText = `Characters left:${maxChars-_text.value.length}`;
            }
            f();
            return f;
        }
        $(description).on('input selectionchange propertychange', func(description, span));

        divWrapper.appendChild(document.createElement('br'));
        divWrapper.appendChild(document.createElement('br'));


        var levelOptions = {
            backgroundColor: '#FFFFFF'
        };
        var item = folder.addColor(levelOptions, "backgroundColor");
        divWrapper.appendChild(item.domElement.parentNode.parentNode);
        item.domElement.parentNode.parentNode.style.padding = '0px';

        divWrapper.appendChild(document.createElement('br'));
        divWrapper.appendChild(document.createElement('br'));



        let errorSpan = document.createElement('span');
        errorSpan.setAttribute('id', 'levelEdit_errorText');
        errorSpan.innerText = '';
        errorSpan.style.color = '#ff4b00';
        divWrapper.appendChild(errorSpan);

        let saveButton = document.createElement('div');
        saveButton.setAttribute('class', 'headerButton save buttonOverlay dark');
        saveButton.innerHTML = "SAVE";
        divWrapper.appendChild(saveButton);

        $(saveButton).on('click', () => {
            doSaveLevelData(saveButton);
        });

        let saveAsButton = document.createElement('div');
        saveAsButton.setAttribute('class', 'headerButton saveas buttonOverlay dark');
        saveAsButton.innerHTML = "SAVE AS";
        divWrapper.appendChild(saveAsButton);

        var self = this;
        saveAsButton.addEventListener('click', () => {
            console.log(self);
            if (!checkLevelDataForErrors()) return;
            self.showSaveScreen.bind(self)();
        });

        let publishButton = document.createElement('div');
        publishButton.setAttribute('class', 'headerButton publish buttonOverlay dark');
        publishButton.innerHTML = "PUBLISH";
        divWrapper.appendChild(publishButton);


        $(publishButton).on('click', () => {
            //save locally first
            if (!errorChecks()) return;
            if (!firebaseManager.isLoggedIn()) return showNotice(Settings.DEFAULT_TEXTS.save_notLoggedIn);

            console.log("PUBLISH LEVEL");
        });



        let deleteButton = document.createElement('div');
        deleteButton.setAttribute('class', 'headerButton delete buttonOverlay dark');
        deleteButton.innerHTML = "DELETE";
        deleteButton.style.float = 'right';
        divWrapper.appendChild(deleteButton);

        $(deleteButton).on('click', () => {
            self.showPrompt(`Are you sure you want to delete level ${game.currentLevelData.title}?`, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
                deleteButton.style.backgroundColor = 'grey';
                deleteButton.innerText = 'DELETING..';
                game.deleteLevelData().then(() => {
                    deleteButton.style.backgroundColor = '';
                    deleteButton.innerText = 'DELETE';
                    game.newLevel();
                    hideEditorPanels();
                    setLevelSpecifics();
                    showNotice("Level succesfully deleted!");
                }).catch((error) => {
                    deleteButton.style.backgroundColor = '';
                    deleteButton.innerText = 'DELETE';
                    showNotice("Error deleting level?");

                });
            }).catch((error) => {});
        });

        divWrapper.appendChild(document.createElement('br'));
        divWrapper.appendChild(document.createElement('br'));


        targetDomElement.appendChild(divWrapper);


        customGUIContainer.appendChild(levelEditScreen.domElement);


        registerDragWindow(levelEditScreen);

    }
    levelEditScreen.domElement.style.display = "block";
    // set values

    let thumbNailImage = $(levelEditScreen.domElement).find('#levelThumbnailImage')[0];
    if (game.currentLevelData.thumbLowResURL) {
        thumbNailImage.src = firebaseManager.baseDownloadURL + game.currentLevelData.thumbLowResURL;
        thumbNailImage.style.display = 'block';
    } else {
        thumbNailImage.style.display = 'none';
    }
    $(levelEditScreen.domElement).find('#levelEdit_title').val(game.currentLevelData.title);
    $(levelEditScreen.domElement).find('#levelEdit_description').text(game.currentLevelData.description);
}
export const showSaveScreen = function () {

    if (!firebaseManager.isLoggedIn()) return showNotice(Settings.DEFAULT_TEXTS.save_notLoggedIn);


    if (!saveScreen) {
        const loginGUIWidth = 400;

        saveScreen = new dat.GUI({
            autoPlace: false,
            width: loginGUIWidth
        });
        saveScreen.domElement.setAttribute('id', 'saveScreen');

        let folder = saveScreen.addFolder('Save Screen');
        folder.domElement.classList.add('custom');
        folder.domElement.style.textAlign = 'center';

        folder.open();

        const closeButton = document.createElement('div');
        closeButton.setAttribute('class', 'closeWindowIcon');
        folder.domElement.append(closeButton);
        $(closeButton).click(() => {
            hidePanel(saveScreen);
        });


        var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];


        let span = document.createElement('span');
        span.innerText = 'SAVE IN';
        targetDomElement.appendChild(span);
        span.style.fontSize = '20px';
        span.style.marginTop = '20px';
        span.style.display = 'inline-block';


        let new_button = document.createElement('div');
        new_button.setAttribute('id', 'saveButton')
        new_button.setAttribute('tabindex', '0');
        new_button.classList.add('menuButton');
        new_button.innerHTML = 'New!';
        targetDomElement.appendChild(new_button);
        new_button.style.margin = '10px auto';
        $(new_button).keypress(function (e) {
            if (e.keyCode == 13)
                $(new_button).click();
        });

        var dotShell = document.createElement('div');
        dotShell.setAttribute('class', 'dot-shell')
        new_button.appendChild(dotShell);
        var dots = document.createElement('div');
        dots.setAttribute('class', 'dot-pulse')
        dotShell.appendChild(dots);
        $(dotShell).hide();

        let self = this;

        $(new_button).on('click', () => {
            let oldText = new_button.innerHTML;
            new_button.innerHTML = '';
            new_button.appendChild(dotShell);
            $(dotShell).show();

            game.saveNewLevelData().then(() => {
                new_button.innerHTML = oldText;
                $(dotShell).hide();
                console.log("Uploading level was a success!!");
                self.hideEditorPanels();
            }).catch((error) => {
                new_button.innerHTML = oldText;
                $(dotShell).hide();
                console.log("Uploading error:", error.message);
            })

        });

        let divWrapper = document.createElement('div');
        divWrapper.setAttribute('id', 'levelList');
        divWrapper.style.padding = '0px 10px';
        targetDomElement.appendChild(divWrapper);


        targetDomElement.appendChild(document.createElement('br'));
        targetDomElement.appendChild(document.createElement('br'));


        customGUIContainer.appendChild(saveScreen.domElement);


        registerDragWindow(saveScreen);

    }
    // On every opn do:
    $(saveScreen.domElement).show();

    const buttonFunction = (button, level) => {
        self.showPrompt(`Are you sure you want to overwrite level ${level.title} with your new level?`, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
            game.currentLevelData.uid = level.uid;
            button.style.backgroundColor = 'grey';
            button.innerText = 'SAVING..';


            setNewLevelData();
            setLevelSpecifics();
            //TODO potentially more like background etc..


            game.saveLevelData().then(() => {
                button.style.backgroundColor = '';
                button.innerText = 'SAVE';
                self.hideEditorPanels();
            }).catch((error) => {
                button.style.backgroundColor = '';
                button.innerText = 'SAVE';
            });
        }).catch((error) => {});
    }
    const levelListDiv = $(saveScreen.domElement).find('#levelList');
    levelListDiv.empty();
    this.generateLevelList(levelListDiv[0], 'SAVE', buttonFunction);

    if (loadScreen) {
        saveScreen.domElement.style.top = loadScreen.domElement.style.top;
        saveScreen.domElement.style.left = loadScreen.domElement.style.left;
    }
}
export const generateLevelList = function (divWrapper, buttonName, buttonFunction) {

    //fill here
    var filterBar = document.createElement('div');
    filterBar.setAttribute('class', 'filterBar');

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

    var levelDateFilter = document.createElement('div');
    levelDateFilter.setAttribute('class', 'levelDateFilter');
    filterBar.appendChild(levelDateFilter);

    var filterIcon = document.createElement('div');
    filterIcon.setAttribute('class', 'filterIcon green arrow');
    levelDateFilter.appendChild(filterIcon);

    span = document.createElement('span');
    span.setAttribute('class', 'filterTitle');
    span.innerText = 'Date';
    levelDateFilter.appendChild(span);

    var levelPlayFilter = document.createElement('div');
    levelPlayFilter.setAttribute('class', 'levelPlayFilter');
    filterBar.appendChild(levelPlayFilter);

    span = document.createElement('span');
    span.setAttribute('class', 'filterTitle');
    span.innerText = 'Save';
    levelPlayFilter.appendChild(span);


    levelNameFilter.style.width = '60%';
    levelDateFilter.style.width = '20%';
    levelPlayFilter.style.width = '20%';



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

    var thumbImage = new Image();
    thumbImage.setAttribute('id', 'thumbImage');
    thumb.appendChild(thumbImage);

    span = document.createElement('span');
    span.setAttribute('class', 'itemTitle');
    span.innerText = 'Level Title';
    levelNameDiv.appendChild(span);
    uiHelper.clampDot('.itemTitle', 1, 14);

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

    var levelSaveDiv = document.createElement('div');
    levelSaveDiv.setAttribute('class', 'levelSaveDiv');
    itemBar.appendChild(levelSaveDiv);

    let button = document.createElement('div');
    button.setAttribute('class', 'headerButton save buttonOverlay dark');
    button.innerHTML = buttonName;
    levelSaveDiv.appendChild(button);
    //*********************************/

    let itemList = document.createElement('div');
    itemList.setAttribute('class', 'itemList');
    divWrapper.appendChild(itemList);

    const buildLevelList = (levels) => {
        for (let level_id in levels) {
            if (levels.hasOwnProperty(level_id)) {

                const level = levels[level_id];
                level.uid = level_id;
                let $itemBar = $(itemBar).clone();
                $(itemList).append($itemBar);
                $itemBar.find('.itemTitle').text(level.title);
                $itemBar.find('.itemDescription').text(level.description);
                $itemBar.find('.itemDate').text(formatTimestamp.formatDMY(level.creationDate));
                if (level.thumbLowResURL) $itemBar.find('#thumbImage')[0].src = firebaseManager.baseDownloadURL + level.thumbLowResURL;

                let saveButton = $itemBar.find('.headerButton.save');
                saveButton.on('click', () => {
                    buttonFunction(saveButton[0], level);
                });
            }
        }
    }

    firebaseManager.getUserLevels().then((levels) => {
        levelList = levels;
        buildLevelList(levels);
    })

    return divWrapper;
}
export const showLoadScreen = function () {

    if (!firebaseManager.isLoggedIn()) return showNotice(Settings.DEFAULT_TEXTS.load_notLoggedIn);


    if (!loadScreen) {
        const loginGUIWidth = 400;

        loadScreen = new dat.GUI({
            autoPlace: false,
            width: loginGUIWidth
        });
        loadScreen.domElement.setAttribute('id', 'loadScreen');

        let folder = loadScreen.addFolder('Load Screen');
        folder.domElement.classList.add('custom');
        folder.domElement.style.textAlign = 'center';

        folder.open();

        const closeButton = document.createElement('div');
        closeButton.setAttribute('class', 'closeWindowIcon');
        folder.domElement.append(closeButton);
        $(closeButton).click(() => {
            hidePanel(loadScreen);
        });


        var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];


        let span = document.createElement('span');
        span.innerText = 'LOAD';
        targetDomElement.appendChild(span);
        span.style.fontSize = '20px';
        span.style.marginTop = '20px';
        span.style.display = 'inline-block';

        const self = this;

        let divWrapper = document.createElement('div');
        divWrapper.setAttribute('id', 'levelList');
        divWrapper.style.padding = '0px 10px';
        targetDomElement.appendChild(divWrapper);


        targetDomElement.appendChild(document.createElement('br'));
        targetDomElement.appendChild(document.createElement('br'));


        customGUIContainer.appendChild(loadScreen.domElement);


        registerDragWindow(loadScreen);

    }
    //On every open screen
    $(loadScreen.domElement).show();

    const buttonFunction = (button, level) => {
        const doLevelLoad = () => {
            button.style.backgroundColor = 'grey';
            button.innerText = 'LOADING..';
            game.loadUserLevelData(level).then(() => {
                button.style.backgroundColor = '';
                button.innerText = 'LOAD';
                self.hideEditorPanels();
                self.setLevelSpecifics();
            }).catch((error) => {
                button.style.backgroundColor = '';
                button.innerText = 'LOAD';
            });
        }
        if (game.levelHasChanges()) {
            self.showPrompt(Settings.DEFAULT_TEXTS.unsavedChanges, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
                doLevelLoad();
            }).catch((error) => {});
        } else doLevelLoad();
    }

    const levelListDiv = $(loadScreen.domElement).find('#levelList');
    levelListDiv.empty();
    this.generateLevelList(levelListDiv[0], 'LOAD', buttonFunction);

    if (saveScreen) {
        loadScreen.domElement.style.top = saveScreen.domElement.style.top;
        loadScreen.domElement.style.left = saveScreen.domElement.style.left;
    }
}
let editorGUIPos = {
    x: 0,
    y: 0
};
export const buildEditorGUI = function () {
    const editorGUIWidth = 200;
    editorGUI = new dat.GUI({
        autoPlace: false,
        width: editorGUIWidth
    });
    editorGUI.domElement.style.top = '50px';
    editorGUI.domElement.style.left = '50px';
    customGUIContainer.appendChild(editorGUI.domElement);
}
export const destroyEditorGUI = function () {
    if (editorGUI != undefined) {
        customGUIContainer.removeChild(editorGUI.domElement);
        editorGUI = undefined;
    }
    removeGuiAssetSelection();
}

export const createEditorStyledGUI = function (name) {
    var element = document.createElement("div");
    element.setAttribute('class', 'toolgui main');
    var header = document.createElement('div');
    header.setAttribute('class', 'dg');
    var ul = document.createElement('ul');
    header.appendChild(ul);
    var li = document.createElement('li');
    li.setAttribute('class', 'title')
    li.innerText = name;
    ul.appendChild(li);
    element.appendChild(header);
    return element;
}
export const createToolGUI = function () {
    toolGUI = createEditorStyledGUI('tools');

    const icons = ['Icon_Mouse.png', 'Icon_Geometry.png', 'Icon_PolygonDrawing.png', 'Icon_Joints.png', 'Icon_Specials.png', 'Icon_Text.png', 'Icon_Zoom.png', 'Icon_PaintBucket.png', 'Icon_Trigger.png'];

    var buttonElement;
    var imgElement;
    for (var i = 0; i < icons.length; i++) {
        buttonElement = document.createElement("table");
        buttonElement.setAttribute('class', 'toolgui button');
        var row = document.createElement("tr");
        buttonElement.appendChild(row);
        imgElement = document.createElement('td');
        imgElement.setAttribute('class', 'toolgui img');
        row.appendChild(imgElement);
        toolGUI.appendChild(buttonElement);

        var clickFunction = function (_i) {
            return function () {
                B2dEditor.selectTool(_i)
            }
        };
        $(buttonElement).on('click', clickFunction(i));
    }
    uiContainer.appendChild(toolGUI);
    var $buttons = $('.toolgui .img');
    for (var i = 0; i < $buttons.length; i++) {
        $($buttons[i]).css('background-image', 'url(assets/images/gui/' + icons[i] + ')');
    }

    $(toolGUI).find('.dg').remove();
}

let assetSelection = {
    assetSelectedGroup: "",
    assetSelectedTexture: "",
}
let assetGUIPos = {
    x: 0,
    y: 0
};
export const initGuiAssetSelection = function () {
    removeGuiAssetSelection();

    if (B2dEditor.assetLists.__keys == undefined) B2dEditor.assetLists.__keys = Object.keys(B2dEditor.assetLists);

    if (B2dEditor.assetLists.__keys.length > 0) {

        assetGUI = new dat.GUI({
            autoPlace: false,
            width: 300
        });
        customGUIContainer.appendChild(assetGUI.domElement);
        let folder = assetGUI.addFolder('Asset Selection');
        folder.open();
        var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

        if (assetSelection.assetSelectedGroup == "") assetSelection.assetSelectedGroup = B2dEditor.assetLists.__keys[0];
        assetSelection.assetSelectedTexture = B2dEditor.assetLists[assetSelection.assetSelectedGroup][0];


        folder = folder.addFolder('Textures');
        folder.add(assetSelection, "assetSelectedGroup", B2dEditor.assetLists.__keys).onChange(function (value) {
            initGuiAssetSelection();
        });
        folder.add(assetSelection, "assetSelectedTexture", B2dEditor.assetLists[assetSelection.assetSelectedGroup]).onChange(function (value) {}).name("Select");

        folder.open();
        $(folder.domElement).parent().parent().parent().hover(function () {
            $(this).addClass('hover');
        })

        for (var i = 0; i < B2dEditor.assetLists[assetSelection.assetSelectedGroup].length; i++) {
            var textureName = B2dEditor.assetLists[assetSelection.assetSelectedGroup][i];
            var texture = new PIXI.heaven.Sprite(PIXI.Texture.fromFrame(textureName));
            let image = game.app.renderer.plugins.extract.image(texture);
            var guiFunction = $($.parseHTML(`<li class="cr function"><div><img src=""></img><div class="c"><div class="button"></div></div></div></li>`));
            guiFunction.find('img').attr('src', image.src);
            guiFunction.find('img').attr('title', textureName);
            //guiFunction.find('img').attr('draggable', false);
            $(targetDomElement).append(guiFunction);
            guiFunction.css('height', texture.height);
            guiFunction.find('img').css('display', 'block');
            guiFunction.find('img').css('margin', 'auto');
            guiFunction.attr('textureName', textureName);

            guiFunction.on('click dragend', function (e) {
                var guiAsset = $(this).parent().parent().parent().parent();
                var rect = guiAsset[0].getBoundingClientRect();
                var x = Math.max(e.pageX, rect.right + image.width / 2);
                var y = e.pageY;

                var data = new B2dEditor.textureObject;
                if (x == e.pageX) {
                    data.x = (x - image.width / 2) / B2dEditor.container.scale.x - B2dEditor.container.x / B2dEditor.container.scale.x;
                    data.y = (y + image.height / 2) / B2dEditor.container.scale.y - B2dEditor.container.y / B2dEditor.container.scale.x;
                } else {
                    data.x = (x) / B2dEditor.container.scale.x - B2dEditor.container.x / B2dEditor.container.scale.x;
                    data.y = (y) / B2dEditor.container.scale.y - B2dEditor.container.y / B2dEditor.container.scale.x;
                }
                data.textureName = $(this).attr('textureName');
                var texture = B2dEditor.buildTextureFromObj(data);

            });
        }
        registerDragWindow(assetGUI);
        $(assetGUI.domElement).css('left', assetGUIPos.x);
        $(assetGUI.domElement).css('top', assetGUIPos.y);
    }
}
export const removeGuiAssetSelection = function () {
    if (assetGUI != undefined) {
        assetGUIPos = {
            x: parseInt($(assetGUI.domElement).css('left'), 10),
            y: parseInt($(assetGUI.domElement).css('top'), 10)
        };
        customGUIContainer.removeChild(assetGUI.domElement);
        assetGUI = undefined;
    }
}
export const showNotice = function (message) {
    if (notice) $(notice.domElement).remove();


    const loginGUIWidth = 400;

    notice = new dat.GUI({
        autoPlace: false,
        width: loginGUIWidth
    });
    notice.domElement.setAttribute('id', 'notice');

    let folder = notice.addFolder('Notice');
    folder.domElement.classList.add('custom');
    folder.domElement.style.textAlign = 'center';

    folder.open();

    const closeButton = document.createElement('div');
    closeButton.setAttribute('class', 'closeWindowIcon');
    folder.domElement.append(closeButton);
    $(closeButton).click(() => {
        $(notice.domElement).remove();
    });

    var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

    let span = document.createElement('span');
    span.innerText = 'NOTICE';
    targetDomElement.appendChild(span);
    span.style.fontSize = '20px';
    span.style.marginTop = '20px';
    span.style.display = 'inline-block';

    let divWrapper = document.createElement('div');
    divWrapper.style.padding = '0px 20px';

    span = document.createElement('span');
    span.setAttribute('class', 'itemDate');
    span.innerText = message;
    divWrapper.appendChild(span);

    divWrapper.appendChild(document.createElement('br'));
    divWrapper.appendChild(document.createElement('br'));

    let button = document.createElement('div');
    button.setAttribute('class', 'headerButton save buttonOverlay dark');
    button.style.margin = 'auto';
    button.innerHTML = "OK";
    divWrapper.appendChild(button);

    button.addEventListener('click', () => {
        $(notice.domElement).remove();
    })

    targetDomElement.appendChild(divWrapper);


    targetDomElement.appendChild(document.createElement('br'));


    customGUIContainer.appendChild(notice.domElement);

    $(notice.domElement).css('left', $(window).width() / 2 - $(notice.domElement).width() / 2);
    $(notice.domElement).css('top', $(window).height() / 2 - $(notice.domElement).height() / 2);


    registerDragWindow(notice);

    return false;
}
export const showTextEditor = function (startValue, callBack) {
    if (textEditor) $(textEditor.domElement).remove();

    const loginGUIWidth = 400;

    textEditor = new dat.GUI({
        autoPlace: false,
        width: loginGUIWidth
    });
    textEditor.domElement.setAttribute('id', 'textEditor');

    let folder = textEditor.addFolder('text editor');
    folder.domElement.classList.add('custom');
    folder.domElement.style.textAlign = 'center';

    folder.open();

    var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

    let divWrapper = document.createElement('div');
    divWrapper.style.padding = '0px 20px';

    let textarea = document.createElement('textarea');
    textarea.value = startValue;
    textarea.setAttribute('tabindex', '0');
    textarea.style.height = '250px';
    divWrapper.appendChild(textarea);


    divWrapper.appendChild(document.createElement('br'));
    divWrapper.appendChild(document.createElement('br'));

    let button = document.createElement('div');
    button.setAttribute('class', 'headerButton save buttonOverlay dark');
    button.style.margin = 'auto';
    button.innerHTML = "SAVE";
    divWrapper.appendChild(button);

    button.addEventListener('click', () => {
        callBack(textarea.value);
        $(textEditor.domElement).remove();
    })

    targetDomElement.appendChild(divWrapper);


    targetDomElement.appendChild(document.createElement('br'));


    customGUIContainer.appendChild(textEditor.domElement);

    $(textEditor.domElement).css('left', $(window).width() / 2 - $(textEditor.domElement).width() / 2);
    $(textEditor.domElement).css('top', $(window).height() / 2 - $(textEditor.domElement).height() / 2);


    registerDragWindow(textEditor);

    return false;
}
export const showPrompt = function (message, positivePrompt, negativePrompt) {
    if (prompt) $(prompt.domElement).remove();

    const loginGUIWidth = 400;

    prompt = new dat.GUI({
        autoPlace: false,
        width: loginGUIWidth
    });
    prompt.domElement.setAttribute('id', 'prompt');

    let folder = prompt.addFolder('Prompt');
    folder.domElement.classList.add('custom');
    folder.domElement.style.textAlign = 'center';

    folder.open();

    var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

    let span = document.createElement('span');
    span.innerText = 'PROMPT';
    targetDomElement.appendChild(span);
    span.style.fontSize = '20px';
    span.style.marginTop = '20px';
    span.style.display = 'inline-block';

    let divWrapper = document.createElement('div');
    divWrapper.style.padding = '0px 20px';

    span = document.createElement('span');
    span.setAttribute('class', 'itemDate');
    span.innerText = message;
    divWrapper.appendChild(span);

    divWrapper.appendChild(document.createElement('br'));
    divWrapper.appendChild(document.createElement('br'));

    let yes_button = document.createElement('div');
    yes_button.setAttribute('class', 'headerButton save buttonOverlay dark');
    yes_button.innerHTML = positivePrompt;
    divWrapper.appendChild(yes_button);

    let no_button = document.createElement('div');
    no_button.setAttribute('class', 'headerButton save buttonOverlay dark');
    no_button.innerHTML = negativePrompt;
    divWrapper.appendChild(no_button);


    targetDomElement.appendChild(divWrapper);


    targetDomElement.appendChild(document.createElement('br'));


    customGUIContainer.appendChild(prompt.domElement);

    $(prompt.domElement).css('left', $(window).width() / 2 - $(prompt.domElement).width() / 2);
    $(prompt.domElement).css('top', $(window).height() / 2 - $(prompt.domElement).height() / 2);


    registerDragWindow(prompt);

    return new Promise((resolve, reject) => {
        yes_button.addEventListener('click', () => {
            $(prompt.domElement).remove();
            console.log("positive prompt");
            return resolve();
        })
        no_button.addEventListener('click', () => {
            $(prompt.domElement).remove();
            console.log("negative prompt");
            return reject();
        })
    });
}









// WINDOW DRAGING

let windows = [];
let startDragPos = {
    x: 0,
    y: 0
};
let startDragMouse = {
    x: 0,
    y: 0
};
export const initDrag = function (event, _window) {

    $(document).on('mousemove', function (event) {
        doDrag(event, _window)
    });
    startDragMouse.x = event.pageX;
    startDragMouse.y = event.pageY;
    startDragPos.x = parseInt($(_window.domElement).css('left'), 10) || 0;
    startDragPos.y = parseInt($(_window.domElement).css('top'), 10) || 0;

}
export const endDrag = function (event, _window) {
    $(document).off('mousemove');
    $(_window.domElement).find('.title').data('moved', false);

}
export const doDrag = function (event, _window) {
    var difX = event.pageX - startDragMouse.x;
    var difY = event.pageY - startDragMouse.y;

    if (Math.abs(difX) + Math.abs(difY) > 5 && !$(_window.domElement).find('.title').data('moved')) {
        $(_window.domElement).find('.title').data('moved', true);
        $(_window.domElement).parent().append($(_window.domElement));
    }

    $(_window.domElement).css('left', startDragPos.x + difX);
    $(_window.domElement).css('top', startDragPos.y + difY);
}

export const registerDragWindow = function (_window) {
    windows.push(_window);
    var $titleBar = $(_window.domElement).find('.dg .title');
    $(_window.domElement).css('position', 'absolute');
    $titleBar.on('mousedown', function (event) {
        initDrag(event, _window);
        event.stopPropagation();
    });
    $(_window.domElement).on('mousedown', function (event) {
        if ($(_window.domElement).parent().children().index(_window.domElement) !== $(_window.domElement).parent().children().length - 1) {
            $(_window.domElement).parent().append($(_window.domElement));
        }
    })
    $titleBar.on('mouseup', function (event) {
        endDrag(event, _window);
    });
    $(document).on('click', function (event) {
        if ($(_window.domElement).find('.title').data('moved') == true) {
            var tarFolder = _window.__folders[$(_window.domElement).find('.title')[0].innerText]
            if (tarFolder.closed) tarFolder.open();
            else tarFolder.close();
        }
        endDrag(event, _window);
    });
}