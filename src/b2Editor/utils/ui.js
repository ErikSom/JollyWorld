import {
    B2dEditor
} from "../B2dEditor";
import * as scrollBars from "./scrollBars";
import * as dat from "../../../libs/dat.gui";
import {
    game
} from "../../Game";
import {
    backendManager
} from "../../utils/BackendManager";
import {
    Settings
} from "../../Settings";
import * as format from './formatString';

import * as uiHelper from './uiHelper';

import * as texts from '../utils/texts';
import * as drawing from './drawing';
import { hashName } from "../../AssetList";


let toolGUI;
export let assetGUI;
export let editorGUI;
let headerBar;
export let levelEditScreen;
let loginScreen;
let registerScreen;
let usernameScreen;
export let saveScreen;
export let loadScreen;
let notice;
let prompt;
let textEditor;
export let gradientEditor;
export let helpScreen;

let uiContainer = document.getElementById('editor-ui-container');
let customGUIContainer = document.getElementById('custom-gui');

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

    backendManager.registerListener('login', handleLoginStatusChange);
    backendManager.registerListener('logout', handleLoginStatusChange);
    backendManager.registerListener('username', showUsernameScreen);

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

        const youtubeIds = levelEditScreen.domElement.querySelectorAll('.levelEdit_youtubeLink');
        const values = Array.from(new Set([...youtubeIds].map(el=>el.value).filter(el=>el.length>0))); // deduplicate and filter empty
        game.currentLevelData.youtubelinks = values;
    }
}

const hasUnsavedChanges = function () {
    if (game.levelHasChanges()) return true;
    if (!levelEditScreen) return false;
    else {
        if (game.currentLevelData.title != levelEditScreen.domElement.querySelector('#levelEdit_title').value) return true;
        if (game.currentLevelData.description != levelEditScreen.domElement.querySelector('#levelEdit_description').value) return true;
        if(game.editor.cameraShotData != null) return true;

    }
    return false;
}
const handleLoginStatusChange = function (event) {
    if (headerBar) {
        if (backendManager.isLoggedIn()) {
            headerBar.querySelector('#loginButton').style.visibility = 'hidden';
            headerBar.querySelector('#profileButton').style.visibility = 'visible';
        } else {
            headerBar.querySelector('#loginButton').style.visibility = 'visible';
            headerBar.querySelector('#profileButton').style.visibility = 'hidden';
        }
    }
}
const checkLevelDataForErrors = async function () {
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


    // youtube ids
    const youtubeIds = levelEditScreen.domElement.querySelectorAll('.levelEdit_youtubeLink');
    const values = Array.from(new Set([...youtubeIds].map(el=>el.value).filter(el=>el.length>0))); // deduplicate and filter empty

    [...youtubeIds].forEach((el, index)=> el.value = values[index] || '');
    for(let i = 0; i<youtubeIds.length; i++){
        const idElement = youtubeIds[i];
        idElement.style.backgroundColor = textAreaDefaultColor;
        if(idElement.value.length>0){
            if(idElement.value.length !== 11){
                idElement.style.backgroundColor = textAreaErrorColor;
                errorStack.push(`YouTube ID ${i+1} must be 11 characters`)
            }else{
                const API_KEY = 'AIzaSyB1Lxy9TPif3lZyPRw6IZeWxMXvN5XK9p0'
                const response = await fetch (`https://www.googleapis.com/youtube/v3/videos?id=${idElement.value}&key=${API_KEY}
                &part=status`)
                const json = await response.json();
                if(!json.items || json.items.length === 0){
                    errorStack.push(`YouTube ID ${i+1} is invalid`);
                }else if(!json.items[0].status || !json.items[0].status.embeddable){
                    errorStack.push(`YouTube ID ${i+1} is not embeddable`);
                }
            }
        }
    }

    errorSpan.innerText = '';
    errorSpan.style.display = (errorStack.length === 0) ? 'none' : 'block'
    if (errorStack.length == 0) return true;
    for (var i = 0; i < errorStack.length; i++) {
        errorSpan.innerText += errorStack[i] + '\n';
    }


    return false;
}
const doSaveLevelData = async function (saveButton) {
    //save locally first
    if (!levelEditScreen) {
        showLevelEditScreen();
        levelEditScreen.domElement.style.display = 'none';
    }
    if (!await checkLevelDataForErrors()) {
        showLevelEditScreen(true);
        return;
    }
    if (!backendManager.isLoggedIn()) return showNotice(Settings.DEFAULT_TEXTS.save_notLoggedIn);

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
    if (!backendManager.isLoggedIn()) return showNotice(Settings.DEFAULT_TEXTS.save_notLoggedIn);

    const publishLevel = () => {

        if (!game.currentLevelData.saved) return showNotice(Settings.DEFAULT_TEXTS.publish_notYetSaved);
        if (!game.currentLevelData.thumb_small_md5) return showNotice(Settings.DEFAULT_TEXTS.publish_noThumbnail);
        if (!game.currentLevelData.description) return showNotice(Settings.DEFAULT_TEXTS.publish_noDescription);


        showPrompt(`Are you sure you wish to publish the level data for  ${game.currentLevelData.title} live?`, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
            publishButton.style.backgroundColor = 'grey';
            publishButton.innerText = '...';
            console.log("Yeah publishing now..");
            game.publishLevelData().then(() => {
                publishButton.style.backgroundColor = '';
                publishButton.innerText = 'PUBLISH';
                console.log("PUBLISH SUCCESSSSSS");
            }).catch(error => {
                console.log(error);
                publishButton.style.backgroundColor = '';
                publishButton.innerText = 'PUBLISH';
            });
        }).catch(error => {
            console.log(error);
        });
    }

    if (hasUnsavedChanges()) {
        showPrompt(Settings.DEFAULT_TEXTS.unsavedChanges, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
            publishLevel();
        }).catch(error => {});
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

    saveButton.addEventListener('click', async () => {
        //save locally first
        await doSaveLevelData(saveButton);
    });

    button = document.createElement('div');
    button.setAttribute('class', 'headerButton login buttonOverlay dark');
    button.setAttribute('id', 'loginButton');
    button.innerHTML = "LOGIN";
    headerBar.appendChild(button);
    button.addEventListener('click', ()=>{showLoginScreen()});

    button = document.createElement('div');
    button.setAttribute('class', 'headerButton profile buttonOverlay dark');
    button.setAttribute('id', 'profileButton');
    headerBar.appendChild(button);
    button.style.width = '48px';
    button.style.height = '30px';
    button.addEventListener('click', () => {
        backendManager.signout();
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

        showPrompt(`${Settings.DEFAULT_TEXTS.new_level}`, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
            game.newLevel();
            hideEditorPanels();
            setLevelSpecifics();
        }).catch(error => {})
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

export const showLoginScreen = function (center) {
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

        const targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

        const discordButton = document.createElement('button');
        discordButton.setAttribute('id', 'discord')
        discordButton.setAttribute('tabindex', '0');
        discordButton.classList.add('menuButton');
        discordButton.innerHTML = '';
        targetDomElement.appendChild(discordButton);
        discordButton.style.margin = '10px auto';
        discordButton.style.backgroundColor = '#7289da';

        discordButton.style.backgroundPosition = 'center';
        discordButton.style.backgroundSize = '140px';
        discordButton.style.backgroundRepeat = 'no-repeat';
        discordButton.style.padding = '20px';
        discordButton.style.backgroundImage = `url("data:image/svg+xml,%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' x='0' y='0' viewBox='0 0 241.2 34' xml:space='preserve'%3E%3Cstyle%3E.st0%7Bfill:%23fff%7D%3C/style%3E%3Cpath class='st0' d='M39.6 3.8C35.6.6 29.3 0 29.1 0c-.4 0-.8.2-1 .6-.1.3-.2.5-.3.8 2.6.4 5.9 1.3 8.8 3.2.5.3.6.9.3 1.4s-.9.6-1.4.3C30.5 3.2 24.2 3 23 3s-7.5.2-12.5 3.3c-.5.3-1.1.1-1.4-.3-.3-.5-.1-1.1.3-1.4 2.9-1.8 6.2-2.7 8.8-3.2-.2-.5-.3-.8-.3-.8-.2-.4-.6-.6-1-.6-.3 0-6.6.6-10.6 3.8C4.2 5.8 0 17.2 0 27c0 .2 0 .3.1.5C3 32.6 11 33.9 12.8 34c.3 0 .6-.2.8-.4l1.8-2.5c-4.9-1.3-7.5-3.4-7.6-3.6-.4-.4-.5-1-.1-1.4s1-.5 1.4-.1c.1.1 4.7 4 13.8 4s13.8-4 13.8-4c.4-.4 1-.3 1.4.1.4.4.3 1-.1 1.4-.1.1-2.7 2.3-7.6 3.6l1.8 2.5c.2.3.5.4.8.4 1.8-.1 9.7-1.4 12.7-6.5.3-.2.3-.3.3-.5 0-9.8-4.2-21.2-6.4-23.2zM16.5 23c-1.9 0-3.5-1.8-3.5-4s1.6-4 3.5-4 3.5 1.8 3.5 4-1.6 4-3.5 4zm13 0c-1.9 0-3.5-1.8-3.5-4s1.6-4 3.5-4 3.5 1.8 3.5 4-1.6 4-3.5 4zM71.2.5H58.9v13.8l8.2 7.4V8.3h4.4c2.8 0 4.1 1.3 4.1 3.5V22c0 2.1-1.3 3.6-4.1 3.6H58.9v7.8h12.3c6.6 0 12.8-3.3 12.8-10.8v-11C84 3.9 77.8.5 71.2.5zm64.5 22.1V11.3c0-4.1 7.3-5 9.6-.9l6.8-2.7c-2.7-5.9-7.5-7.6-11.6-7.6-6.6 0-13.1 3.8-13.1 11.2v11.3c0 7.5 6.5 11.2 13 11.2 4.1 0 9.1-2 11.9-7.4l-7.3-3.3c-1.9 4.6-9.3 3.5-9.3-.5zm-22.4-9.8c-2.6-.6-4.3-1.5-4.4-3.1.1-3.8 6-4 9.5-.3l5.4-4.2c-3.4-4.1-7.3-5.3-11.2-5.3-6 0-11.9 3.4-11.9 9.9 0 6.3 4.8 9.6 10.1 10.4 2.7.4 5.7 1.4 5.6 3.3-.2 3.5-7.5 3.3-10.8-.7l-5.3 4.9c3.1 4 7.3 6 11.2 6 6 0 12.7-3.5 13-9.9.5-7.9-5.4-9.9-11.2-11zM88.5 33.4h8.3V.5h-8.3v32.9zM228.4.5h-12.3v13.8l8.2 7.4V8.3h4.4c2.8 0 4.1 1.3 4.1 3.5V22c0 2.1-1.3 3.6-4.1 3.6H216v7.8h12.3c6.6 0 12.8-3.3 12.8-10.8v-11C241.2 3.9 235 .5 228.4.5zM168 0c-6.8 0-13.6 3.7-13.6 11.3v11.2c0 7.5 6.8 11.3 13.7 11.3 6.8 0 13.6-3.8 13.6-11.3V11.3C181.7 3.8 174.8 0 168 0zm5.4 22.6c0 2.4-2.7 3.6-5.3 3.6-2.7 0-5.3-1.1-5.3-3.6V11.3c0-2.4 2.6-3.7 5.2-3.7 2.7 0 5.4 1.1 5.4 3.7v11.3zm38.1-11.3C211.3 3.6 206.1.5 199.3.5h-13.2v32.9h8.4V23h1.5l7.6 10.4H214l-9-11.3c4-1.2 6.5-4.7 6.5-10.8zm-12.1 4.5h-4.9V8.3h4.9c5.2 0 5.2 7.5 0 7.5z'/%3E%3C/svg%3E")`;

        discordButton.addEventListener('click', ()=>{
            openDiscordOauth();
            hidePanel(loginScreen);
        });

        targetDomElement.appendChild(document.createElement('br'));

        customGUIContainer.appendChild(loginScreen.domElement);

        registerDragWindow(loginScreen);

    }
    if(center){

    }else{
        loginScreen.domElement.style.top = '10px';
        loginScreen.domElement.style.left = '80px';
    }

    showPanel(loginScreen);

}

const openDiscordOauth = ()=>{
    const shrink = .8;
    const w = Math.min(Math.floor(window.innerWidth * shrink), 600);
    const h = 800;
    const leftPosition = (window.innerWidth-w)/2;
    const topPosition = (window.innerHeight-h)/2;
    const settings = `height=${h},width=${w},top=${topPosition},left=${leftPosition},scrollbars=yes,directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no`;

    const url = `https://api.jollyworld.app/login?redirect=${encodeURIComponent(Settings.REDIRECT)}`;
    window.open(url, 'oAuthLogin', settings);
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
                backendManager.registerUser(email.value, password.value).then(() => {
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

                backendManager.claimUsername(username.value)
                    .then(() => {
                        hidePanel(usernameScreen);
                        dotShell.classList.add('hidden');;
                        button.innerHTML = oldText;
                    }).catch(error => {
                        /*console.log("Firebase responded with", error);
                        let errorMessage = error.message;
                        if (error.code == 'USERNAME_TAKEN')*/ 
                        const errorMessage = 'Username already claimed by other email';
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

export const showLevelEditScreen = function (dontReplace) {
    if (!levelEditScreen) {
        const levelEditGUIWidth = 350;

        levelEditScreen = new dat.GUI({
            autoPlace: false,
            width: levelEditGUIWidth
        });
        levelEditScreen.domElement.setAttribute('id', 'levelEditScreen');

        let folder = levelEditScreen.addFolder('Publish Settings');
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
        divWrapper.style.padding = '10px';

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
            thumbNailImage.src = B2dEditor.cameraShotData;
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
        title.style.marginBottom = '5px';

        span = document.createElement('span');
        span.innerText = 'Characters left: 100';
        span.style.marginLeft = '2px';
        divWrapper.appendChild(span);


        let func = (textarea, span) => {
            let _text = textarea;
            let _span = span;
            var f = () => {
                const maxChars = 32;
                if (_text.value.length > maxChars) _text.value = _text.value.substr(0, maxChars);
                _span.innerText = `Characters left: ${maxChars-_text.value.length}`;
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
        description.style.marginBottom = '2px';

        span = document.createElement('span');
        span.innerText = 'Characters left: 300';
        span.style.marginLeft = '2px';
        divWrapper.appendChild(span);

        func = (textarea, span) => {
            let _text = textarea;
            let _span = span;
            var f = () => {
                const maxChars = 300;
                if (_text.value.length > maxChars) _text.value = _text.value.substr(0, maxChars);
                _span.innerText = `Characters left: ${maxChars-_text.value.length}`;
            }
            f();
            return f;
        }
        const descriptionFunction = func(description, span);
        description.addEventListener('input', descriptionFunction);
        description.addEventListener('selectionchange', descriptionFunction);
        description.addEventListener('propertychange', descriptionFunction);

        targetDomElement.appendChild(divWrapper);


        // Youtube Folder
        const youtubeLinks = folder.addFolder('Link YouTube videos');
        const youtubeDomElement = youtubeLinks.domElement.getElementsByTagName('ul')[0];

        let youtubeDivWrapper = document.createElement('div');
        youtubeDivWrapper.style.padding = '10px';

        for(let i = 0; i<3; i++){
            let youtubeLink = document.createElement('input');
            youtubeLink.classList.add('levelEdit_youtubeLink');
            youtubeLink.setAttribute('placeholder', `YouTube Video ID #${i+1}`);
            youtubeLink.style.height = '30px';
            youtubeLink.style.fontSize = '14px';
            youtubeLink.style.fontWeight = 'bold';
            youtubeDivWrapper.appendChild(youtubeLink);
        }

        ///^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/

        youtubeDomElement.appendChild(youtubeDivWrapper);

        let errorSpan = document.createElement('span');
        errorSpan.setAttribute('id', 'levelEdit_errorText');
        errorSpan.innerText = '';
        errorSpan.style.color = '#ff4b00';
        errorSpan.style.padding = '10px';
        errorSpan.style.display = 'none';
        targetDomElement.appendChild(errorSpan);

        let saveButton = document.createElement('div');
        saveButton.setAttribute('class', 'headerButton save buttonOverlay dark');
        saveButton.innerHTML = "SAVE";
        targetDomElement.appendChild(saveButton);

        saveButton.addEventListener('click', async () => {
            await doSaveLevelData(saveButton);
        });

        let saveAsButton = document.createElement('div');
        saveAsButton.setAttribute('class', 'headerButton saveas buttonOverlay dark');
        saveAsButton.innerHTML = "SAVE AS";
        targetDomElement.appendChild(saveAsButton);

        saveAsButton.addEventListener('click', async ()=>{
            if (!await checkLevelDataForErrors()) return;
            showSaveScreen.bind(this)();
        });

        let publishButton = document.createElement('div');
        publishButton.setAttribute('class', 'headerButton publish buttonOverlay dark');
        publishButton.innerHTML = "PUBLISH";
        targetDomElement.appendChild(publishButton);


        publishButton.addEventListener('click', () => {
            doPublishLevelData(publishButton);
        });



        let deleteButton = document.createElement('div');
        deleteButton.setAttribute('class', 'headerButton delete buttonOverlay dark');
        deleteButton.innerHTML = "DELETE";
        deleteButton.style.float = 'right';
        deleteButton.style.marginRight = '10px';
        targetDomElement.appendChild(deleteButton);

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
                }).catch(error => {
                    deleteButton.style.backgroundColor = '';
                    deleteButton.innerText = 'DELETE';
                    showNotice("Error deleting level?");

                });
            }).catch(error => {});
        });

        targetDomElement.appendChild(document.createElement('br'));
        targetDomElement.appendChild(document.createElement('br'));

        customGUIContainer.appendChild(levelEditScreen.domElement);

        const computedWidth = parseFloat(getComputedStyle(levelEditScreen.domElement, null).width.replace("px", ""));
        const computedHeight = parseFloat(getComputedStyle(levelEditScreen.domElement, null).height.replace("px", ""));
        levelEditScreen.domElement.style.left = `${window.innerWidth / 2 - computedWidth / 2}px`;
        levelEditScreen.domElement.style.top = '50px';

        registerDragWindow(levelEditScreen);

    }
    levelEditScreen.domElement.style.display = "block";
    // set values

    showPanel(levelEditScreen);

    if(dontReplace !== true){
        let thumbNailImage = levelEditScreen.domElement.querySelector('#levelThumbnailImage');
        let clickToAdd = levelEditScreen.domElement.querySelector('.clickToAdd');
        if (game.currentLevelData.thumb_small_md5) {
            thumbNailImage.src = `${Settings.STATIC}/${game.currentLevelData.thumb_small_md5}.png`;
            thumbNailImage.style.display = 'block';
            clickToAdd.style.display = 'none';
        }else if (B2dEditor.cameraShotData) {
            thumbNailImage.src = B2dEditor.cameraShotData;
            thumbNailImage.style.display = 'block';
            clickToAdd.style.display = 'none';
        } else {
            thumbNailImage.style.display = 'none';
            clickToAdd.style.display = 'block';
        }
        levelEditScreen.domElement.querySelector('#levelEdit_title').value = game.currentLevelData.title;
        levelEditScreen.domElement.querySelector('#levelEdit_description').value = game.currentLevelData.description;

        const youtubeIds = levelEditScreen.domElement.querySelectorAll('.levelEdit_youtubeLink');
        youtubeIds.forEach(el=>el.value='');

        if(game.currentLevelData.youtubelinks && (game.currentLevelData.youtubelinks.length>1 || game.currentLevelData.youtubelinks[0])){
            game.currentLevelData.youtubelinks.forEach((id, index)=>{youtubeIds[index].value = id});
        }
    }
}
export const showSaveScreen = function () {

    if (!backendManager.isLoggedIn()) return showNotice(Settings.DEFAULT_TEXTS.save_notLoggedIn);


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

        // const dotShell = uiHelper.buildDotShell(true);
        // button.appendChild(dotShell);

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

        customGUIContainer.appendChild(saveScreen.domElement);


        registerDragWindow(saveScreen);

    }
    // On every opn do:
    showPanel(saveScreen);

    const buttonFunction = (button, level) => {
        showPrompt(`Are you sure you want to overwrite level ${level.title} with your new level?`, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
            game.currentLevelData.id = level.id;
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
    generateLevelList(levelListDiv, 'Save', buttonFunction);

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
    span.innerText = buttonName;
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
    button.innerHTML = buttonName.toUpperCase();
    levelSaveDiv.appendChild(button);
    //*********************************/

    let itemList = document.createElement('div');
    itemList.setAttribute('class', 'itemList');
    divWrapper.appendChild(itemList);

    const buildLevelList = (levels) => {
        for (let level_id in levels) {
            if (levels.hasOwnProperty(level_id)) {

                const level = levels[level_id];
                const itemBarClone = itemBar.cloneNode(true);
                itemList.appendChild(itemBarClone);

                const itemTitle = itemBarClone.querySelector('.itemTitle');
                const itemDescription = itemBarClone.querySelector('.itemDescription');

                itemTitle.innerText = level.title;
                uiHelper.clampDot(itemTitle, 1, 14);

                itemDescription.innerText = level.description;
                uiHelper.clampDot(itemDescription, 3, 14);

                itemBarClone.querySelector('.itemDate').innerText = format.formatDMY(level.created_at);
                // using %2F because '/' does not work for private urls

                if(level.title.indexOf('checkpoint') > 0){
                    console.log('***************', level);
                }

                if (level.thumb_small_md5) itemBarClone.querySelector('#thumbImage').src = `${Settings.STATIC}/${level.thumb_small_md5}.png`;

                let saveButton = itemBarClone.querySelector('.headerButton.save');
                saveButton.addEventListener('click', () => {
                    buttonFunction(saveButton, level);
                });
            }
        }
    }

    backendManager.getUserLevels().then((levels) => {
        buildLevelList(levels);
    })

    return divWrapper;
}
export const showLoadScreen = function () {

    if (!backendManager.isLoggedIn()) return showNotice(Settings.DEFAULT_TEXTS.load_notLoggedIn);


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

        const targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

        let divWrapper = document.createElement('div');
        divWrapper.setAttribute('id', 'levelList');
        divWrapper.style.padding = '10px';
        targetDomElement.appendChild(divWrapper);

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
            }).catch(error => {});
        } else doLevelLoad();
    }

    showPanel(loadScreen);

    const levelListDiv = loadScreen.domElement.querySelector('#levelList');
    while(levelListDiv.firstChild) levelListDiv.removeChild(levelListDiv.firstChild)

    generateLevelList(levelListDiv, 'Load', buttonFunction);

    loadScreen.domElement.style.top = '10px';
    loadScreen.domElement.style.left = `${window.innerWidth-400-20}px`
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
const toolReferences = ['select', 'geometry', 'polydrawing', 'pen', 'joints', 'prefabs', 'text', 'art', 'trigger', 'settings', 'camera', 'vertice editing'];

export const createToolGUI = function () {
    toolGUI = createEditorStyledGUI('tools');

    const icons = ['Icon_Mouse.png', 'Icon_Geometry.png', 'Icon_PolygonDrawing.png', 'Icon_Pen.png', 'Icon_Joints.png', 'Icon_Specials.png', 'Icon_Text.png'/*, 'Icon_Zoom.png'*/, 'Icon_Art.png', 'Icon_Trigger.png', 'Icon_Settings.png'];
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
        buttons[i].style.backgroundImage = `url(assets/images/gui/${hashName(icons[i])})`;
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

				const camera = B2dEditor.container.camera || B2dEditor.container;

                const data = new B2dEditor.textureObject;
                if (x == e.pageX) {
                    data.x = (x - image.width / 2) / camera.scale.x - camera.x / camera.scale.x;
                    data.y = (y + image.height / 2) / camera.scale.y - camera.y / camera.scale.x;
                } else {
                    data.x = (x) / camera.scale.x - camera.x / camera.scale.x;
                    data.y = (y) / camera.scale.y - camera.y / camera.scale.x;
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

    let divWrapper = document.createElement('div');
    divWrapper.style.padding = '0px 20px';
    divWrapper.style.marginTop = '10px';

    let span = document.createElement('span');
    span.setAttribute('class', 'itemDate');
    span.innerText = message;
    divWrapper.appendChild(span);

    divWrapper.appendChild(document.createElement('br'));
    divWrapper.appendChild(document.createElement('br'));

    let button = document.createElement('div');
    button.setAttribute('class', 'headerButton save buttonOverlay dark');
    button.style.margin = 'auto';
    button.style.maxWidth = '100px';
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

    setHighestWindow(notice.domElement);

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

    const targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

    let divWrapper = document.createElement('div');
    divWrapper.style.padding = '0px 20px';
    divWrapper.style.marginTop = '10px';

    let span = document.createElement('span');
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

    setHighestWindow(prompt.domElement);

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

export const showGradientsEditor = function (name, oldGradientData) {
    //TODO: COUNT GRADIENTS!!
    removeGradientEditor();

    const loginGUIWidth = 400;

    gradientEditor = new dat.GUI({
        autoPlace: false,
        width: loginGUIWidth
    });

    gradientEditor.domElement.setAttribute('id', 'gradientEditor');

    const folder = gradientEditor.addFolder('gradient editor');
    folder.domElement.classList.add('custom');
    folder.domElement.querySelector('.title').style.width = `${loginGUIWidth}px`;

    folder.open();

    const gradientBox = document.createElement('canvas');
    gradientBox.style = `
        width: 100px;
        height: calc(100% - 26px);
        margin-top: 26px;
        background-color: #E5E5F7;
        opacity: 1.0;
        background-image: linear-gradient(135deg, #949494 25%, transparent 25%), linear-gradient(225deg, #949494 25%, transparent 25%), linear-gradient(45deg, #949494 25%, transparent 25%), linear-gradient(315deg, #949494 25%, rgb(229, 229, 247) 25%);
        background-position:  20px 0, 20px 0, 0 0, 0 0;
        background-size: 20px 20px;
        background-repeat: repeat;
        position: absolute;
        left: 300px;
        top: 0;
        border-left: 1px solid black;
    `;
    gradientBox.width = gradientBox.height = 256;
    gradientEditor.domElement.appendChild(gradientBox);

    const closeButton = document.createElement('div');
    closeButton.setAttribute('class', 'closeWindowIcon');
    folder.domElement.append(closeButton);
    closeButton.addEventListener('click', () => {
        removeGradientEditor();
    });

    // adding fields
    let gradientData = oldGradientData;
    if(!gradientData){
        if(name === Settings.DEFAULT_TEXTS.newGradient){
            if(oldGradientData){}
            let gradientCount = game.editor.levelGradients.length+1;
            while(game.editor.levelGradients.find(el=>el.n === `gradient${gradientCount}`)){
                gradientCount++;
            }
            gradientData = {
                n:`gradient${gradientCount}`,
                c:['#FFFFFF', '#000000'],
                a:[1, 1],
                p:[0, 1],
                r:0,
                l:true
            }
        }else{
            gradientData = game.editor.levelGradients.find(el=>el.n === name) || {};
            gradientData = JSON.parse(JSON.stringify(gradientData)); // clone
        }
    }

    let gradientEditData = {};
    gradientEditData.selectedGradient = name;
    gradientEditData.name = gradientData.n;

    const gradientNames = [Settings.DEFAULT_TEXTS.newGradient, ...game.editor.levelGradientsNames];
    folder.add(gradientEditData, "selectedGradient", gradientNames).onChange(function (value) {
        if(name !== value) showGradientsEditor(value);
    });

    const gradientTypes = ['linear', 'radial'];
    gradientEditData.gradientType = gradientData.l ? gradientTypes[0] : gradientTypes[1];
    folder.add(gradientEditData, "gradientType", gradientTypes).onChange(function (value) {
        gradientData.l = value === gradientTypes[0];
        showGradientsEditor(name, gradientData);
    });

    folder.add(gradientEditData, "name").onChange(function (value) {
        const nameNoSpecial = value.replace(/\W/g, '').substr(0, 20);
        gradientEditData.name = nameNoSpecial;
        gradientData.n = nameNoSpecial;
    });

    const colors = gradientData.c;
    colors.forEach((color, index) => {
        const colorName = `color${index}`
        gradientEditData[colorName] = color;
        const colorFolder = folder.addFolder(`Color ${index+1}`);
        colorFolder.addColor(gradientEditData, colorName).name('color').onChange(value=>{
            gradientData.c[index] = value;
            drawing.drawGradient(gradientBox, gradientData, gradientBox.width);
        });

        const alphaName = `alpha${index}`;
        gradientEditData[alphaName] = gradientData.a[index];
        colorFolder.add(gradientEditData, alphaName, 0, 1).name('alpha').step(0.01).onChange(value=>{
            gradientData.a[index] = value;
            drawing.drawGradient(gradientBox, gradientData, gradientBox.width);
        });

        const posName = `pos${index}`;
         gradientEditData[posName] = gradientData.p[index];
        colorFolder.add(gradientEditData, posName, 0, 1).name('position').step(0.01).onChange(value=>{
            gradientData.p[index] = value;
            drawing.drawGradient(gradientBox, gradientData, gradientBox.width);
        });
    })

    if(gradientData.l){
        gradientEditData.rotation = gradientData.r * game.editor.RAD2DEG;
        folder.add(gradientEditData, 'rotation', 0, 360).step(0.1).onChange(value=>{
            gradientData.r = value * game.editor.DEG2RAD;
            drawing.drawGradient(gradientBox, gradientData, gradientBox.width);
        });
    }

    if(gradientData.c.length<8){
        gradientEditData.addColor = ()=>{
            gradientData.c.push(gradientData.c[gradientData.c.length-1]);
            gradientData.a.push(gradientData.a[gradientData.a.length-1]);
            gradientData.p.push(gradientData.p[gradientData.p.length-1]);
            showGradientsEditor(name, gradientData);
        }
        folder.add(gradientEditData, "addColor").name('add color');
    }

    if(gradientData.c.length>2){
        gradientEditData.removeColor = ()=>{
            gradientData.c.pop();
            gradientData.a.pop();
            gradientData.p.pop();
            showGradientsEditor(name, gradientData);
        }
        folder.add(gradientEditData, "removeColor").name('remove color');
    }

    if(name !== Settings.DEFAULT_TEXTS.newGradient){
        gradientEditData.deleteGradient = ()=>{
            const gradientIndex = game.editor.levelGradientsNames.indexOf(name);
            game.editor.levelGradients.splice(gradientIndex, 1);
            game.editor.levelGradientsNames.splice(gradientIndex, 1);
            showGradientsEditor(gradientNames[0]);
        }
        folder.add(gradientEditData, "deleteGradient").name('delete gradient');
    }

    gradientEditData.saveGradient = ()=>{
        if(name === Settings.DEFAULT_TEXTS.newGradient){
            //force unique name;
            let gradientName = gradientData.n;
            let gradientNameCount = 0;
            while(game.editor.levelGradientsNames.includes(gradientName) || gradientName === ''){
                gradientNameCount++;
                gradientName = `${gradientData.n}${gradientNameCount}`;
            }
            gradientData.n = gradientName;

            game.editor.levelGradients.push(gradientData);
            game.editor.levelGradientsNames.push(gradientData.n);
            game.editor.parseLevelGradient(game.editor.levelGradientsNames.length-1);

            showGradientsEditor(gradientData.n);
        }else{
            // find index
            const gradientIndex = game.editor.levelGradientsNames.indexOf(name);

            if(name !== gradientData.n){
                let gradientName = gradientData.n;
                let gradientNameCount = 0;
                while(game.editor.levelGradientsNames.includes(gradientName) || gradientName === ''){
                    gradientNameCount++;
                    gradientName = `${gradientData.n}${gradientNameCount}`;
                }
                gradientData.n = gradientName;
            }

            game.editor.levelGradientsNames[gradientIndex] = gradientData.n;
            game.editor.levelGradients[gradientIndex] = gradientData;
            game.editor.parseLevelGradient(gradientIndex);

            showGradientsEditor(gradientData.n);
        }
    }
    folder.add(gradientEditData, "saveGradient").name('save gradient');

    drawing.drawGradient(gradientBox, gradientData, gradientBox.width);

    gradientEditor.domElement.getElementsByTagName('ul')[0].style.width = '300px';

    customGUIContainer.appendChild(gradientEditor.domElement);

    const computedWidth = parseFloat(getComputedStyle(gradientEditor.domElement, null).width.replace("px", ""));
    const computedHeight = parseFloat(getComputedStyle(gradientEditor.domElement, null).height.replace("px", ""));
    gradientEditor.domElement.style.left = `${window.innerWidth / 2 - computedWidth / 2}px`;
    gradientEditor.domElement.style.top = `${window.innerHeight / 2 - computedHeight / 2}px`;

    registerDragWindow(gradientEditor);

    return false;
}
const removeGradientEditor = ()=>{
    if(gradientEditor){
        gradientEditor.domElement.parentNode.removeChild(gradientEditor.domElement);
        gradientEditor = null;
        game.editor.updateSelection();
    }
}
const showErrorPrompt = (msg, url, lineNo, columnNo, error) => {
    const loginGUIWidth = 500;

    const errorScreen = new dat.GUI({
        autoPlace: false,
        width: loginGUIWidth
    });
    errorScreen.domElement.setAttribute('id', 'errorScreen');

    let targetFolder = errorScreen.addFolder('ERROR');
    targetFolder.open();
    const mainFolderDomElement = targetFolder.domElement.getElementsByTagName('ul')[0];


    const textWrapper = document.createElement('div');
    textWrapper.classList.add('textWrapper');

    let textarea = document.createElement('textarea');
    textarea.value = `${Settings.DEFAULT_TEXTS.error_message}\n\n ${msg},\n ${url},\n ${lineNo},\n ${columnNo},\n ${(error && error.stack) ? error.stack : ''}`
    textarea.style.width = '500px';
    textarea.style.height ='70vh';
    textWrapper.appendChild(textarea);

    mainFolderDomElement.appendChild(textWrapper);

    customGUIContainer.appendChild(errorScreen.domElement);

    const computedWidth = parseFloat(getComputedStyle(errorScreen.domElement, null).width.replace("px", ""));
    const computedHeight = parseFloat(getComputedStyle(errorScreen.domElement, null).height.replace("px", ""));
    errorScreen.domElement.style.left = `${window.innerWidth / 2 - computedWidth / 2}px`;
    errorScreen.domElement.style.top = `${window.innerHeight / 2 - computedHeight / 2}px`;

    registerDragWindow(errorScreen);

    setHighestWindow(errorScreen.domElement);

    window.onerror = ()=>{};

    return false;
}

window.onerror = showErrorPrompt;

export const createImageDropDown = (guiFolder, textureNames, selectedIndex, clickCallback) => {
    const targetDomElement = guiFolder.domElement.getElementsByTagName('ul')[0];

    const listItem = document.createElement('li');
    listItem.classList.add('cr-string')

    const imageDropDownContainer = document.createElement('div');
    const span = document.createElement('span');
    span.classList.add('property-name');
    span.innerText = 'tileTexture';
    imageDropDownContainer.appendChild(span);

    const imageDropDown = document.createElement('div');
    imageDropDown.classList.add('imageDropDown', 'c');

    imageDropDown.onmouseup = imageDropDownContainer.ontouchend = ()=>{
        if(imageDropDown.classList.contains('open')){
            // else we close the dropdown before we select an item
            setTimeout(()=>{
                imageDropDown.classList.remove('open');
                const elementIndex = Array.from(imageDropDown.children).find(element => element.checked).value;
                clickCallback(elementIndex);
            }, 0);
        }else{
            imageDropDown.classList.add('open');
        }
    }

    imageDropDownContainer.appendChild(imageDropDown);

    for(let i = 0; i<textureNames.length; i++){
        const input = document.createElement('input');
        if(i === selectedIndex) input.setAttribute('checked', 'checked');
        input.setAttribute('type', 'radio');
        const idName = `idd${i}`;
        input.setAttribute('id', idName);
        input.setAttribute('value', i);
        input.setAttribute('name', 'line-style');

        const label = document.createElement('label');
        label.setAttribute('for', idName)
        if(i === 0){
            label.style.background = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 100 100'><path d='M100 0 L0 100 ' stroke='black' stroke-width='1'/><path d='M0 0 L100 100 ' stroke='black' stroke-width='1'/></svg>")`;
            label.style.backgroundRepeat = 'no-repeat';
            label.style.backgroundPosition = 'center center';
            label.style.backgroundSize = '100% 100%, auto';
        }
        else{
            const base64Image = PIXI.utils.BaseTextureCache[Settings.textureNames[i]].source.src;
            label.style.background = `url(${base64Image})`;
            label.style.backgroundSize = 'contain';
        }

        imageDropDown.appendChild(input);
        imageDropDown.appendChild(label);
    }
    listItem.appendChild(imageDropDownContainer)
    targetDomElement.appendChild(listItem);
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

const setHighestWindow = domElement => {
    setTimeout(()=>{
        if(!domElement || !domElement.parentNode) return;
        if ([...domElement.parentNode.children].indexOf(domElement) !== domElement.parentNode.children.length - 1) {
            domElement.parentNode.appendChild(domElement);
        }
    }, 0);
}

export const registerDragWindow = (_window) => {


    windows.push(_window);
    const domElement = _window.domElement;
    var titleBar = domElement.querySelector('.dg .title');
    domElement.style.position = 'absolute';

    titleBar.addEventListener('mousedown', (event) => {
        initDrag(event, _window);
        event.stopPropagation();
    });

    domElement.addEventListener('mouseup', (event) => {
        setHighestWindow(domElement);
    })
    titleBar.addEventListener('mouseup', (event) => {
        endDrag(event, _window);
        setHighestWindow(domElement);
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
