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
import * as format from './formatString';

import * as uiHelper from './uiHelper';

import * as texts from '../utils/texts'

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
export let helpScreen;

let uiContainer = document.getElementById('editor-ui-container');
let customGUIContainer = document.getElementById('custom-gui');
let windowHideTime = 500;

let levelList = undefined;
export let helpClosed = [];

export const hide = function () {
    hideEditorPanels();
    toolGUI.style.display = 'none';
    headerBar.style.display = 'none';
    scrollBars.hide();
    destroyEditorGUI();
}
export const show = function () {
    toolGUI.style.display = 'block';
    headerBar.style.display = 'block';
    scrollBars.show();
}

export const initGui = function () {
    createToolGUI();
    showHeaderBar();
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
    removeNotice();
    removePrompt();
    removeTextEditor();
    removeShowHelp();
}
export const hidePanel = panel => {
    if (panel) panel.domElement.classList.add('fadedHide');
}
export const showPanel = panel => {
    if(panel){
        panel.domElement.classList.remove('fadedHide');
        setTimeout(()=>{
            if(!panel) return;
            panel.domElement.parentNode.appendChild(panel.domElement);
            panel.domElement.focus();
        }, 1);
    }
}
export const setLevelSpecifics = function () {
    headerbarLevelName.innerHTML = game.currentLevelData.title;
}
export const setNewLevelData = function () {
    if (levelEditScreen) {
        game.currentLevelData.title = levelEditScreen.domElement.querySelector('#levelEdit_title').value;
        game.currentLevelData.description = levelEditScreen.domElement.querySelector('#levelEdit_description').value;
    }
}

const hasUnsavedChanges = function () {
    if (game.levelHasChanges()) return true;
    if (!levelEditScreen) return false;
    else {
        if (game.currentLevelData.title != levelEditScreen.domElement.querySelector('#levelEdit_title').value) return true;
        if (game.currentLevelData.description != levelEditScreen.domElement.querySelector('#levelEdit_description').value) return true;
        if(game.editor.cameraShotData.highRes != null) return true;

    }
    return false;
}
const handleLoginStatusChange = function (event) {
    if (headerBar) {
        if (firebaseManager.isLoggedIn()) {
            headerBar.querySelector('#loginButton').style.visibility = 'hidden';
            headerBar.querySelector('#profileButton').style.visibility = 'visible';
        } else {
            headerBar.querySelector('#loginButton').style.visibility = 'visible';
            headerBar.querySelector('#profileButton').style.visibility = 'hidden';
        }
    }
    if ((event && event.type == 'login') || firebaseManager.isLoggedIn()) {
        firebaseManager.getUserData().then(() => {}).catch((error) => {
            showUsernameScreen();
        });
    }
}
const checkLevelDataForErrors = function () {
    const title = levelEditScreen.domElement.querySelector('#levelEdit_title');
    const description = levelEditScreen.domElement.querySelector('#levelEdit_description');
    const errorSpan = levelEditScreen.domElement.querySelector('#levelEdit_errorText');

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
    if (!levelEditScreen) {
        showLevelEditScreen();
        levelEditScreen.domElement.style.display = 'none';
    }
    if (!checkLevelDataForErrors()) {
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
const doPublishLevelData = function (publishButton) {
    if (!firebaseManager.isLoggedIn()) return showNotice(Settings.DEFAULT_TEXTS.save_notLoggedIn);

    const publishLevel = () => {

        if (!game.currentLevelData.saved) return showNotice(Settings.DEFAULT_TEXTS.publish_notYetSaved);
        if (!game.currentLevelData.thumbLowResURL) return showNotice(Settings.DEFAULT_TEXTS.publish_noThumbnail);
        if (!game.currentLevelData.description) return showNotice(Settings.DEFAULT_TEXTS.publish_noDescription);


        showPrompt(`Are you sure you wish to publish the level data for  ${game.currentLevelData.title} live?`, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
            publishButton.style.backgroundColor = 'grey';
            publishButton.innerText = '...';
            console.log("Yeah publishing now..");
            game.publishLevelData().then(() => {
                publishButton.style.backgroundColor = '';
                publishButton.innerText = 'PUBLISH';
                console.log("PUBLISH SUCCESSSSSS");
            }).catch((error) => {
                console.log(error);
                publishButton.style.backgroundColor = '';
                publishButton.innerText = 'PUBLISH';
            });
        }).catch((error) => {
            console.log(error);
        });
    }

    if (hasUnsavedChanges()) {
        showPrompt(Settings.DEFAULT_TEXTS.unsavedChanges, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
            publishLevel();
        }).catch((error) => {});
    } else publishLevel();

}
let headerbarLevelName;
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

    button.addEventListener('click', () => {
        game.testWorld();
    });

    let self = this;

    let saveButton = document.createElement('div');
    saveButton.setAttribute('class', 'headerButton save buttonOverlay dark');
    saveButton.innerHTML = "SAVE";
    headerBar.appendChild(saveButton);

    saveButton.addEventListener('click', () => {
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
    button.addEventListener('click', ()=>{

        game.openMainMenu();

    })

    button = document.createElement('div');
    button.setAttribute('class', 'headerButton load buttonOverlay dark');
    button.innerHTML = "LOAD";
    headerBar.appendChild(button);
    button.addEventListener('click', showLoadScreen);

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
    button.addEventListener('click', showLevelEditScreen);


    headerbarLevelName = document.createElement('span');
    headerbarLevelName.innerHTML = "";
    button.setAttribute('id', 'levelName');
    headerBar.appendChild(headerbarLevelName);

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
        closeButton.addEventListener('click', () => {
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
        //email.value = '1@1.nl'; //PLACEHOLDER
        email.setAttribute('placeholder', 'Email');
        email.setAttribute('tabindex', '0');
        divWrapper.appendChild(email);
        email.style = textAreanStyle;

        let password = document.createElement('input');
        password.setAttribute('placeholder', 'Password');
        //password.value = 'appelsap'; //PLACEHOLDER
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

        const emailFunction = func(email);
        email.addEventListener('input', emailFunction);
        email.addEventListener('selectionchange', emailFunction);
        email.addEventListener('propertychange', emailFunction);
        email.addEventListener('blur', errorChecks);

        const passwordFunction = func(password);
        password.addEventListener('input', passwordFunction);
        password.addEventListener('selectionchange', passwordFunction);
        password.addEventListener('propertychange', passwordFunction);
        password.addEventListener('blur', errorChecks);

        targetDomElement.appendChild(divWrapper);

        span = document.createElement('span');
        span.innerText = 'No account? ';
        targetDomElement.appendChild(span);

        span = document.createElement('span');
        span.innerText = 'Sign Up!';
        targetDomElement.appendChild(span);
        span.setAttribute('class', 'text_button');
        span.addEventListener('click', () => {
            hidePanel(loginScreen);
            showRegisterScreen();
        });

        let button = document.createElement('div');
        button.setAttribute('id', 'acceptButton')
        button.setAttribute('tabindex', '0');
        button.classList.add('menuButton');
        button.innerHTML = 'Login!';
        targetDomElement.appendChild(button);
        button.style.margin = '10px auto';
        [email, password, button].forEach(el => el.addEventListener('keydown', (e) => {
            if (e.keyCode == 13)
                button.click();
        }));

        const dotShell = uiHelper.buildDotShell(true);
        button.appendChild(dotShell);

        button.addEventListener('click', () => {
            if (errorChecks(true)) {
                let oldText = button.innerHTML;
                button.innerHTML = '';
                button.appendChild(dotShell);
                dotShell.classList.remove('hidden');
                firebaseManager.login(email.value, password.value).then(() => {
                    console.log("Succesfully logged in!!");
                    hidePanel(loginScreen);
                    button.innerHTML = oldText;
                    dotShell.classList.add('hidden');;

                }).catch((error) => {
                    console.log("Firebase responded with", error.code);
                    errorSpan.innerText = error.message;
                    button.innerHTML = oldText;
                    dotShell.classList.add('hidden');;
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

    showPanel(loginScreen);

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


        const passwordFunction = func(password);
        password.addEventListener('input', passwordFunction);
        password.addEventListener('selectionchange', passwordFunction);
        password.addEventListener('propertychange', passwordFunction);
        password.addEventListener('blur', errorChecks);

        const repasswordFunction = func(repassword);
        repassword.addEventListener('input', repasswordFunction);
        repassword.addEventListener('selectionchange', repasswordFunction);
        repassword.addEventListener('propertychange', repasswordFunction);
        repassword.addEventListener('blur', errorChecks);

        const emailFunction = func(email);
        email.addEventListener('input', emailFunction);
        email.addEventListener('selectionchange', emailFunction);
        email.addEventListener('propertychange', emailFunction);
        email.addEventListener('blur', errorChecks);

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
        [email, password, repassword, button].forEach(el => el.addEventListener('keydown', (e) => {
            if (e.keyCode == 13)
                button.click();
        }));

        const dotShell = uiHelper.buildDotShell(true);
        button.appendChild(dotShell);

        button.addEventListener('click', () => {
            if (errorChecks(true)) {
                dotShell.classList.remove('hidden');
                let oldText = button.innerHTML;
                button.innerHTML = '';
                button.appendChild(dotShell);
                firebaseManager.registerUser(email.value, password.value).then(() => {
                    console.log("Succesfully registered!!");
                    hidePanel(registerScreen);
                    dotShell.classList.add('hidden');;
                    button.innerHTML = oldText;
                }).catch((error) => {
                    console.log("Firebase responded with", error.code);
                    let errorMessage = error.message;
                    if (error.code == 'PERMISSION_DENIED') errorMessage = 'Username already claimed by other email';
                    errorSpan.innerText = errorMessage;
                    dotShell.classList.add('hidden');;
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
        span.addEventListener('click', () => {
            hidePanel(registerScreen);
            showLoginScreen();
        });

        targetDomElement.appendChild(document.createElement('br'));
        targetDomElement.appendChild(document.createElement('br'));

        customGUIContainer.appendChild(registerScreen.domElement);

        registerDragWindow(registerScreen);

    }

    showPanel(registerScreen);

    if (registerScreen) {
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


        const usernameFunction = func(username);
        username.addEventListener('input', usernameFunction);
        username.addEventListener('selectionchange', usernameFunction);
        username.addEventListener('propertychange', usernameFunction);

        username.onfocus = focus(username, Settings.DEFAULT_TEXTS.login_DefaultUsername);
        username.onblur = blur(username, Settings.DEFAULT_TEXTS.login_DefaultUsername);

        targetDomElement.appendChild(divWrapper);

        let button = document.createElement('div');
        button.setAttribute('id', 'acceptButton')
        button.setAttribute('tabindex', '0');
        button.classList.add('menuButton');
        button.innerHTML = 'Accept!';
        targetDomElement.appendChild(button);
        button.style.margin = '10px auto';
        [username, button].forEach(el => el.addEventListener('keydown', (e) => {
            if (e.keyCode == 13)
                button.click();
        }));

        const dotShell = uiHelper.buildDotShell(true);
        button.appendChild(dotShell);

        button.addEventListener('click', () => {
            if (errorChecks(true)) {
                dotShell.classList.remove('hidden');
                let oldText = button.innerHTML;
                button.innerHTML = '';
                button.appendChild(dotShell);

                var userData = {
                    username: username.value,
                    creationDate: Date.now(),
                }
                firebaseManager.claimUsername(username.value)
                    .then(() => {
                        firebaseManager.storeUserData(userData)
                    })
                    .then(() => {
                        hidePanel(usernameScreen);
                        dotShell.classList.add('hidden');;
                        button.innerHTML = oldText;
                    }).catch((error) => {
                        console.log("Firebase responded with", error);
                        let errorMessage = error.message;
                        if (error.code == 'USERNAME_TAKEN') errorMessage = 'Username already claimed by other email';
                        errorSpan.innerText = errorMessage;
                        dotShell.classList.add('hidden');;
                        button.innerHTML = oldText;
                    });
            }
        });


        targetDomElement.appendChild(document.createElement('br'));
        targetDomElement.appendChild(document.createElement('br'));


        customGUIContainer.appendChild(usernameScreen.domElement);

        registerDragWindow(usernameScreen);

    }
    showPanel(usernameScreen);
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
        closeButton.addEventListener('click', () => {
            hidePanel(levelEditScreen);
        });


        var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

        let divWrapper = document.createElement('div');
        divWrapper.style.padding = '20px';

        let span = document.createElement('span');
        span.innerText = 'Thumbnail';
        divWrapper.appendChild(span);

        let youtubeFeed = document.createElement('div');
        youtubeFeed.setAttribute('id', 'youtubeFeed');
        divWrapper.appendChild(youtubeFeed);

        let thumbNail;
        thumbNail = document.createElement('div');
        thumbNail.setAttribute('id', 'levelThumbnail');
        youtubeFeed.appendChild(thumbNail);

        let clickToAddSpan = document.createElement('span');
        clickToAddSpan.classList.add('clickToAdd');
        clickToAddSpan.innerText = 'click to add';
        clickToAddSpan.style.margin = 'auto';
        clickToAddSpan.style.color = 'gray';
        thumbNail.appendChild(clickToAddSpan);

        let thumbNailImage;
        thumbNailImage = new Image();
        thumbNailImage.setAttribute('id', 'levelThumbnailImage');
        thumbNail.appendChild(thumbNailImage);

        let thumbnailShotComplete = () => {
            levelEditScreen.domElement.style.display = 'block';
            thumbNailImage.src = B2dEditor.cameraShotData.lowRes;
            thumbNailImage.style.display = 'block';
            clickToAddSpan.style.display = 'none';
        }

        thumbNail.addEventListener('click', () => {
            B2dEditor.cameraShotCallBack = thumbnailShotComplete;
            B2dEditor.selectTool(B2dEditor.tool_CAMERA);
            levelEditScreen.domElement.style.display = 'none';
        });

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
        const titleFunction = func(title, span);
        title.addEventListener('input', titleFunction);
        title.addEventListener('selectionchange', titleFunction);
        title.addEventListener('propertychange', titleFunction);

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
        const descriptionFunction = func(description, span);
        description.addEventListener('input', descriptionFunction);
        description.addEventListener('selectionchange', descriptionFunction);
        description.addEventListener('propertychange', descriptionFunction);

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

        saveButton.addEventListener('click', () => {
            doSaveLevelData(saveButton);
        });

        let saveAsButton = document.createElement('div');
        saveAsButton.setAttribute('class', 'headerButton saveas buttonOverlay dark');
        saveAsButton.innerHTML = "SAVE AS";
        divWrapper.appendChild(saveAsButton);

        saveAsButton.addEventListener('click', ()=>{
            if (!checkLevelDataForErrors()) return;
            showSaveScreen.bind(this)();
        });

        let publishButton = document.createElement('div');
        publishButton.setAttribute('class', 'headerButton publish buttonOverlay dark');
        publishButton.innerHTML = "PUBLISH";
        divWrapper.appendChild(publishButton);


        publishButton.addEventListener('click', () => {
            doPublishLevelData(publishButton);
        });



        let deleteButton = document.createElement('div');
        deleteButton.setAttribute('class', 'headerButton delete buttonOverlay dark');
        deleteButton.innerHTML = "DELETE";
        deleteButton.style.float = 'right';
        divWrapper.appendChild(deleteButton);

        deleteButton.addEventListener('click', () => {
            showPrompt(`Are you sure you want to delete level ${game.currentLevelData.title}?`, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
                deleteButton.style.backgroundColor = 'grey';
                deleteButton.innerText = '...';
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

    showPanel(levelEditScreen);

    let thumbNailImage = levelEditScreen.domElement.querySelector('#levelThumbnailImage');
    let clickToAdd = levelEditScreen.domElement.querySelector('.clickToAdd');
    if (game.currentLevelData.thumbLowResURL) {
        thumbNailImage.src = `${firebaseManager.baseDownloadURL}levels%2F${firebaseManager.getUserID()}%2F${game.currentLevelData.uid}%2Fthumb_lowRes.jpg?${game.currentLevelData.thumbLowResURL}`;
        thumbNailImage.style.display = 'block';
        clickToAdd.style.display = 'none';
        console.log("DAFUQQQQQ1");
    } else {
        thumbNailImage.style.display = 'none';
        clickToAdd.style.display = 'block';
        console.log("DAFUQQQQQ2");
    }
    levelEditScreen.domElement.querySelector('#levelEdit_title').value = game.currentLevelData.title;
    levelEditScreen.domElement.querySelector('#levelEdit_description').value = game.currentLevelData.description;
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
        closeButton.addEventListener('click', () => {
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
        new_button.addEventListener('keydown', (e) => {
            if (e.keyCode == 13)
                new_button.click();
        });

        const dotShell = uiHelper.buildDotShell(true);
        button.appendChild(dotShell);

        new_button.addEventListener('click', () => {
            let oldText = new_button.innerHTML;
            new_button.innerHTML = '';
            new_button.appendChild(dotShell);
            dotShell.classList.remove('hidden');


            setNewLevelData()

            game.saveNewLevelData().then(() => {
                new_button.innerHTML = oldText;
                dotShell.classList.add('hidden');;
                console.log("Uploading level was a success!!");
                hideEditorPanels();
            }).catch((error) => {
                new_button.innerHTML = oldText;
                dotShell.classList.add('hidden');;
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
    showPanel(saveScreen);

    const buttonFunction = (button, level) => {
        showPrompt(`Are you sure you want to overwrite level ${level.title} with your new level?`, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
            game.currentLevelData.uid = level.uid;
            button.style.backgroundColor = 'grey';
            button.innerText = 'SAVING..';


            setNewLevelData();
            setLevelSpecifics();
            //TODO potentially more like background etc..


            game.saveLevelData().then(() => {
                button.style.backgroundColor = '';
                button.innerText = 'SAVE';
                hideEditorPanels();
            }).catch((error) => {
                button.style.backgroundColor = '';
                button.innerText = 'SAVE';
            });
        }).catch((error) => {});
    }
    const levelListDiv = saveScreen.domElement.querySelector('#levelList');
    while(levelListDiv.firstChild) levelListDiv.removeChild(levelListDiv.firstChild)
    generateLevelList(levelListDiv, 'SAVE', buttonFunction);

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

    levelNameDiv.appendChild(document.createElement('br'));

    span = document.createElement('span');
    span.setAttribute('class', 'itemDescription');
    span.innerHTML = 'This is a very tidious text blablabaa and its way to long blabla bla...';
    levelNameDiv.appendChild(span);

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
                const itemBarClone = itemBar.cloneNode(true);
                itemList.appendChild(itemBarClone);

                const itemTitle = itemBarClone.querySelector('.itemTitle');
                const itemDescription = itemBarClone.querySelector('.itemDescription');

                itemTitle.innerText = level.title;
                uiHelper.clampDot(itemTitle, 1, 14);

                itemDescription.innerText = level.description;
                uiHelper.clampDot(itemDescription, 3, 14);

                itemBarClone.querySelector('.itemDate').innerText = format.formatDMY(level.creationDate);
                // using %2F because '/' does not work for private urls
                if (level.thumbLowResURL) itemBarClone.querySelector('#thumbImage').src = `${firebaseManager.baseDownloadURL}levels%2F${firebaseManager.getUserID()}%2F${level.uid}%2Fthumb_lowRes.jpg?${level.thumbLowResURL}`;

                let saveButton = itemBarClone.querySelector('.headerButton.save');
                saveButton.addEventListener('click', () => {
                    buttonFunction(saveButton, level);
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
        closeButton.addEventListener('click', () => {
            hidePanel(loadScreen);
        });


        var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];


        let span = document.createElement('span');
        span.innerText = 'LOAD';
        targetDomElement.appendChild(span);
        span.style.fontSize = '20px';
        span.style.marginTop = '20px';
        span.style.display = 'inline-block';


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

    showPanel(loadScreen);

    const self = this;

    const buttonFunction = (button, level) => {
        const doLevelLoad = () => {
            button.style.backgroundColor = 'grey';
            button.innerText = 'LOADING..';
            game.loadUserLevelData(level).then(() => {
                button.style.backgroundColor = '';
                button.innerText = 'LOAD';
                hideEditorPanels();
                setLevelSpecifics();
            }).catch((error) => {
                console.log(error);
                button.style.backgroundColor = '';
                button.innerText = 'LOAD';
            });
        }
        if (hasUnsavedChanges()) {
            showPrompt(Settings.DEFAULT_TEXTS.unsavedChanges, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
                doLevelLoad();
            }).catch((error) => {});
        } else doLevelLoad();
    }

    showPanel(loadScreen);

    const levelListDiv = loadScreen.domElement.querySelector('#levelList');
    while(levelListDiv.firstChild) levelListDiv.removeChild(levelListDiv.firstChild)

    generateLevelList(levelListDiv, 'LOAD', buttonFunction);

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
    const editorGUIWidth = 270;
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
const toolReferences = ['select', 'geometry', 'polydrawing', 'joints', 'prefabs', 'text', 'art', 'trigger', 'settings', 'camera', 'vertice editing'];

export const createToolGUI = function () {
    toolGUI = createEditorStyledGUI('tools');

    const icons = ['Icon_Mouse.png', 'Icon_Geometry.png', 'Icon_PolygonDrawing.png', 'Icon_Joints.png', 'Icon_Specials.png', 'Icon_Text.png'/*, 'Icon_Zoom.png'*/, 'Icon_Art.png', 'Icon_Trigger.png', 'Icon_Settings.png'];
    var buttonElement;
    var imgElement;
    for (var i = 0; i < icons.length; i++) {
        buttonElement = document.createElement("table");
        buttonElement.setAttribute('class', 'toolgui button');
        buttonElement.setAttribute('data-tt', toolReferences[i]);
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
        buttonElement.addEventListener('click', clickFunction(i));
    }
    uiContainer.appendChild(toolGUI);
    const buttons = document.querySelectorAll('.toolgui .img');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.backgroundImage = `url(assets/images/gui/${icons[i]})`;
    }
    const dgEls = document.querySelectorAll('.dg');
    dgEls.forEach(dgEl => dgEl.parentNode.removeChild(dgEl));
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

        for (var i = 0; i < B2dEditor.assetLists[assetSelection.assetSelectedGroup].length; i++) {
            var textureName = B2dEditor.assetLists[assetSelection.assetSelectedGroup][i];
            var texture = new PIXI.heaven.Sprite(PIXI.Texture.fromFrame(textureName));
            let image = game.app.renderer.plugins.extract.image(texture);
            const guiFunction = document.createElement('li');
            guiFunction.classList.add('cr', 'function');
            guiFunction.innerHTML = `<div><img src=""></img><div class="c"><div class="button"></div></div></div>`;

            guiFunction.querySelector('img').setAttribute('src', image.src);
            guiFunction.querySelector('img').setAttribute('title', textureName);
            //guiFunction.querySelector('img').setAttribute('draggable', false);
            targetDomElement.appendChild(guiFunction);
            guiFunction.style.height = `${texture.height}px`;
            guiFunction.querySelector('img').style.display = 'block';
            guiFunction.querySelector('img').style.margin = 'auto';
            guiFunction.setAttribute('textureName', textureName);

            const clickFunction = (e) => {
                const guiAsset = guiFunction.parentNode.parentNode.parentNode.parentNode;
                const rect = guiAsset.getBoundingClientRect();
                const x = Math.max(e.pageX, rect.right + image.width / 2);
                const y = e.pageY;

                const data = new B2dEditor.textureObject;
                if (x == e.pageX) {
                    data.x = (x - image.width / 2) / B2dEditor.container.scale.x - B2dEditor.container.x / B2dEditor.container.scale.x;
                    data.y = (y + image.height / 2) / B2dEditor.container.scale.y - B2dEditor.container.y / B2dEditor.container.scale.x;
                } else {
                    data.x = (x) / B2dEditor.container.scale.x - B2dEditor.container.x / B2dEditor.container.scale.x;
                    data.y = (y) / B2dEditor.container.scale.y - B2dEditor.container.y / B2dEditor.container.scale.x;
                }
                data.scaleX = data.scaleY = 1;
                data.textureName = guiFunction.getAttribute('textureName');
                B2dEditor.buildTextureFromObj(data);

            };
            guiFunction.addEventListener('click', clickFunction);
            guiFunction.addEventListener('dragend', clickFunction);
        }
        registerDragWindow(assetGUI);
        assetGUI.domElement.style.left = `${assetGUIPos.x}px`;
        assetGUI.domElement.style.top = `${assetGUIPos.y}px`;
    }
}
export const removeGuiAssetSelection = function () {
    if (assetGUI != undefined) {
        assetGUIPos = {
            x: parseInt(assetGUI.domElement.style.display.left, 10),
            y: parseInt(assetGUI.domElement.style.display.top, 10)
        };
        customGUIContainer.removeChild(assetGUI.domElement);
        assetGUI = undefined;
    }
}
export const showNotice = function (message) {
    removeNotice();

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
    closeButton.addEventListener('click', () => {
        removeNotice();
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
        removeNotice();
    })

    targetDomElement.appendChild(divWrapper);

    targetDomElement.appendChild(document.createElement('br'));


    customGUIContainer.appendChild(notice.domElement);


    const computedWidth = parseFloat(getComputedStyle(notice.domElement, null).width.replace("px", ""));
    const computedHeight = parseFloat(getComputedStyle(notice.domElement, null).height.replace("px", ""));
    notice.domElement.style.left = `${window.innerWidth / 2 - computedWidth / 2}px`;
    notice.domElement.style.top = `${window.innerHeight / 2 - computedHeight / 2}px`;


    registerDragWindow(notice);

    return false;
}
const removeNotice = ()=>{
    if(notice){
        notice.domElement.parentNode.removeChild(notice.domElement);
        notice = null;
    }
}
export const showTextEditor = function (startValue, callBack) {
    removeTextEditor();

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
        removeTextEditor();
    })

    targetDomElement.appendChild(divWrapper);


    targetDomElement.appendChild(document.createElement('br'));


    customGUIContainer.appendChild(textEditor.domElement);

    const computedWidth = parseFloat(getComputedStyle(textEditor.domElement, null).width.replace("px", ""));
    const computedHeight = parseFloat(getComputedStyle(textEditor.domElement, null).height.replace("px", ""));
    textEditor.domElement.style.left = `${window.innerWidth / 2 - computedWidth / 2}px`;
    textEditor.domElement.style.top = `${window.innerHeight / 2 - computedHeight / 2}px`;

    registerDragWindow(textEditor);

    return false;
}
const removeTextEditor = ()=>{
    if(textEditor){
        textEditor.domElement.parentNode.removeChild(textEditor.domElement);
        textEditor = null;
    }
}
const removePrompt = ()=>{
    if(prompt){
        prompt.domElement.parentNode.removeChild(prompt.domElement);
        prompt = null;
    }
}
export const fetchControllersFromGUI = function(gui){
    let controllers = [].concat(gui.__controllers);
    for (var propt in gui.__folders) {
        controllers = controllers.concat(gui.__folders[propt].__controllers);
        for (var _propt in gui.__folders[propt].__folders) {
            //folders in folders
            controllers = controllers.concat(gui.__folders[propt].__folders[_propt].__controllers);
            for (var __propt in gui.__folders[propt].__folders[_propt].__folders) {
                //folders in folders in folders..
                controllers = controllers.concat(gui.__folders[propt].__folders[_propt].__folders[__propt].__controllers);
            }
        }
    }
    return controllers;
}
export const showPrompt = function (message, positivePrompt, negativePrompt) {
    removePrompt();

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

    const computedWidth = parseFloat(getComputedStyle(prompt.domElement, null).width.replace("px", ""));
    const computedHeight = parseFloat(getComputedStyle(prompt.domElement, null).height.replace("px", ""));
    prompt.domElement.style.left = `${window.innerWidth / 2 - computedWidth / 2}px`;
    prompt.domElement.style.top = `${window.innerHeight / 2 - computedHeight / 2}px`;

    registerDragWindow(prompt);

    return new Promise((resolve, reject) => {
        yes_button.addEventListener('click', () => {
            removePrompt();
            return resolve();
        })
        no_button.addEventListener('click', () => {
            removePrompt();
            return reject();
        })
    });
}
export const showHelp = function(i){
    removeShowHelp();

    if(helpClosed[i]) return;

    const loginGUIWidth = 320;

    helpScreen = new dat.GUI({
        autoPlace: false,
        width: loginGUIWidth
    });
    helpScreen.domElement.setAttribute('id', 'helpScreen');

    const toolName = toolReferences[i];
    let targetFolder = helpScreen.addFolder(`${toolName} help`);
    targetFolder.open();
    const mainFolderDomElement = targetFolder.domElement.getElementsByTagName('ul')[0];

    const closeButton = document.createElement('div');
    closeButton.setAttribute('class', 'closeWindowIcon');
    targetFolder.domElement.append(closeButton);
    closeButton.addEventListener('click', () => {
        helpClosed[i] = true;
        removeShowHelp();
    });

    const textWrapper = document.createElement('div');
    textWrapper.classList.add('textWrapper');

    let textarea = document.createElement('div');
    textarea.innerHTML = texts.HELP[toolName];
    textWrapper.appendChild(textarea);

    mainFolderDomElement.appendChild(textWrapper);

    customGUIContainer.appendChild(helpScreen.domElement);

    helpScreen.domElement.style.right = '20px';
    helpScreen.domElement.style.top = '50px';

    registerDragWindow(helpScreen);

    return false;
}
const removeShowHelp = ()=>{
    if(helpScreen){
        helpScreen.domElement.parentNode.removeChild(helpScreen.domElement);
        helpScreen = null;
    }
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
    _window.domElement.querySelector('.title').removeAttribute('moved');
    _window.mouseMoveFunction = (event) => {
        doDrag(event, _window)
    };
    document.addEventListener('mousemove', _window.mouseMoveFunction);
    startDragMouse.x = event.pageX;
    startDragMouse.y = event.pageY;


    const computedLeft = parseFloat(getComputedStyle(_window.domElement, null).left.replace("px", ""));
    const computedTop = parseFloat(getComputedStyle(_window.domElement, null).top.replace("px", ""));

    startDragPos.x = parseInt(computedLeft, 10) || 0;
    startDragPos.y = parseInt(computedTop, 10) || 0;
}
export const endDrag = function (event, _window) {
    document.removeEventListener('mousemove', _window.mouseMoveFunction);
    setTimeout(()=>{_window.domElement.querySelector('.title').removeAttribute('moved');}, 0);
}
export const doDrag = function (event, _window) {
    var difX = event.pageX - startDragMouse.x;
    var difY = event.pageY - startDragMouse.y;

    if (Math.abs(difX) + Math.abs(difY) > 5 && !_window.domElement.querySelector('.title').getAttribute('moved') !== null) {
        _window.domElement.querySelector('.title').setAttribute('moved', '');
    }

    _window.domElement.style.left = `${startDragPos.x + difX}px`;
    _window.domElement.style.top = `${startDragPos.y + difY}px`;
}

export const registerDragWindow = (_window) => {


    windows.push(_window);
    const domElement = _window.domElement;
    var titleBar = domElement.querySelector('.dg .title');
    domElement.style.position = 'absolute';


    const setHighestWindow = ()=>{
        setTimeout(()=>{
            if(!domElement || !domElement.parentNode) return;
            if ([...domElement.parentNode.children].indexOf(_window.domElement) !== domElement.parentNode.children.length - 1) {
                domElement.parentNode.appendChild(domElement);
            }
        }, 0);
    }


    titleBar.addEventListener('mousedown', (event) => {
        initDrag(event, _window);
        event.stopPropagation();
    });

    domElement.addEventListener('mouseup', (event) => {
        setHighestWindow();
    })
    titleBar.addEventListener('mouseup', (event) => {
        endDrag(event, _window);
        setHighestWindow();
    });

    const clickFunction = (event) => {
        if (domElement.querySelector('.title').getAttribute('moved') !== null) {
            var tarFolder = _window.__folders[domElement.querySelector('.title').innerText]
            if (tarFolder.closed) tarFolder.open();
            else tarFolder.close();
        }
        endDrag(event, _window);
        if(!_window.domElement.parentNode) document.removeEventListener('click', clickFunction);
    }

    document.addEventListener('click', clickFunction);
}
