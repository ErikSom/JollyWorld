import { B2dEditor } from "../B2dEditor";
import * as scrollBars from "./scrollBars";
import * as dat from "../../../libs/dat.gui";
import {
	game
} from "../../Game";
import { firebaseManager } from "../../FireBaseManager";


let toolGUI;
export let assetGUI;
export let editorGUI;
let headerBar;
let levelEditScreen;
let loginScreen;

let uiContainer = document.getElementById('uicontainer');
let customGUIContainer = document.getElementById('my-gui-container');

export const hide = function(){
    uiContainer.style.display = "none";
    scrollBars.hide();
}
export const show = function(){
    uiContainer.style.display = "block";
    scrollBars.show();
}

export const initGui = function () {
    initGuiAssetSelection();
    createToolGUI();
    buildHeaderBar();
    B2dEditor.canvas.focus();
    scrollBars.update();
}
const buildHeaderBar = function(){
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

    button = document.createElement('div');
    button.setAttribute('class', 'headerButton save buttonOverlay dark');
    button.innerHTML = "SAVE";
    headerBar.appendChild(button);

    button = document.createElement('div');
    button.setAttribute('class', 'headerButton login buttonOverlay dark');
    button.innerHTML = "LOGIN";
    headerBar.appendChild(button);
    button.addEventListener('click', showLoginScreen);

    button = document.createElement('div');
    button.setAttribute('class', 'headerButton exit buttonOverlay dark');
    button.innerHTML = "EXIT";
    headerBar.appendChild(button);

    button = document.createElement('div');
    button.setAttribute('class', 'headerButton load buttonOverlay dark');
    button.innerHTML = "LOAD";
    headerBar.appendChild(button);

    button = document.createElement('div');
    button.setAttribute('class', 'headerButton new buttonOverlay dark');
    button.innerHTML = "NEW";
    headerBar.appendChild(button);

    button.addEventListener('click', ()=>{
        game.newLevel();
    });

    button = document.createElement('div');
    button.setAttribute('class', 'headerIcon edit buttonOverlay dark');
    headerBar.appendChild(button);
    button.addEventListener('click', openLevelEditScreen);


    let levelName = document.createElement('span');
    levelName.innerHTML = "TEST 123";
    button.setAttribute('id', 'levelName');
    headerBar.appendChild(levelName);

}
export const updateStatusHeaderBar = function(){
    if(firebaseManager.user){

    }else{

    }

}

export const showLoginScreen = function(){
    if(!loginScreen){
        const loginGUIWidth = 300;

        loginScreen =  new dat.GUI({
            autoPlace: false,
            width: loginGUIWidth
        });
        loginScreen.domElement.setAttribute('id', 'loginScreen');

        let folder = loginScreen.addFolder('Login Screen');
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

        let username = document.createElement('input');
        username.value = DEFAULT_TEXTS.login_DefaultUsername;
        divWrapper.appendChild(username);
        username.style = textAreanStyle;

        let password = document.createElement('input');
        password.value = DEFAULT_TEXTS.login_DefaultPassword;
        password.setAttribute('type', 'password');
        divWrapper.appendChild(password);
        password.style = textAreanStyle;

        let repassword = document.createElement('input');
        repassword.value = DEFAULT_TEXTS.login_DefaultRePassword;
        repassword.setAttribute('type', 'password');
        divWrapper.appendChild(repassword);
        repassword.style = textAreanStyle;

        let email = document.createElement('input');
        email.value = DEFAULT_TEXTS.login_DefaultEmail;
        divWrapper.appendChild(email);
        email.style = textAreanStyle;

        let errorSpan = document.createElement('span');
        errorSpan.innerText = '';
        errorSpan.style.display = 'block';
        errorSpan.style.color = '#ff4b00';
        divWrapper.appendChild(errorSpan);


        const errorChecks = (noDefault=false)=>{
            var errorStack = [];
            const textAreaDefaultColor = '#fff';
            const textAreaErrorColor = '#e8764b';

            username.style.backgroundColor = textAreaDefaultColor;
            password.style.backgroundColor = textAreaDefaultColor;
            repassword.style.backgroundColor = textAreaDefaultColor;
            email.style.backgroundColor = textAreaDefaultColor;

            if(username.value != DEFAULT_TEXTS.login_DefaultUsername || noDefault){
                if(username.value.length<3){
                     errorStack.push("Username must be at last 3 characters long");
                     username.style.backgroundColor = textAreaErrorColor;
                }
            }

            if(password.value != DEFAULT_TEXTS.login_DefaultPassword || noDefault){
                if(password.value.length<6){
                    errorStack.push("Password must be at last 6 characters long");
                    password.style.backgroundColor = textAreaErrorColor;
                }
            }

            if(repassword.value != DEFAULT_TEXTS.login_DefaultRePassword || noDefault){
                if(repassword.value != password.value){
                     errorStack.push("Your passwords do not match");
                     repassword.style.backgroundColor = textAreaErrorColor;
                }
            }

            if(email.value != DEFAULT_TEXTS.login_DefaultEmail || noDefault){
                var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
                if(!re.test(String(email.value).toLowerCase())){
                     errorStack.push("Email entered is not a valid email address");
                     email.style.backgroundColor = textAreaErrorColor;
                }
            }

            errorSpan.innerText = '';
            errorSpan.style.margin = errorStack.length>0? '20px auto' : '0px';
            if(errorStack.length == 0) return true;
            for(var i = 0; i<errorStack.length; i++){
                errorSpan.innerText += errorStack[i]+'\n';
            }
            return false;
        }
        let func = (textarea) =>{
            let _text = textarea;
            var f = () => {
                const maxChars = 32;
                if(_text.value.length>maxChars) _text.value = _text.value.substr(0, maxChars);
                errorChecks();
            }
            f();
            return f;
        }
        let focus = (textarea, value) =>{
            let _text = textarea;
            let _value = value;
            var f = () =>{
                if(_text.value == _value) textarea.value = '';
                if(_value == DEFAULT_TEXTS.login_DefaultPassword || _value == DEFAULT_TEXTS.login_DefaultRePassword) _text.setAttribute('type', 'password');
            }
            f();
            return f;
        };
        let blur = (textarea, value) =>{
            let _text = textarea;
            let _value = value;
            var f = () =>{
                if(_text.value == ''){
                     textarea.value = _value;
                     if(_value == DEFAULT_TEXTS.login_DefaultPassword || _value == DEFAULT_TEXTS.login_DefaultRePassword) _text.setAttribute('type', 'text');
                }
                errorChecks();
            }
            f();
            return f;
        };

        $(username).on('input selectionchange propertychange', func(username));
        $(username).focus(focus(username, DEFAULT_TEXTS.login_DefaultUsername));
        $(username).blur(blur(username, DEFAULT_TEXTS.login_DefaultUsername));

        $(password).on('input selectionchange propertychange', func(password));
        $(password).focus(focus(password, DEFAULT_TEXTS.login_DefaultPassword));
        $(password).blur(blur(password, DEFAULT_TEXTS.login_DefaultPassword));

        $(repassword).on('input selectionchange propertychange', func(repassword));
        $(repassword).focus(focus(repassword, DEFAULT_TEXTS.login_DefaultRePassword));
        $(repassword).blur(blur(repassword, DEFAULT_TEXTS.login_DefaultRePassword));

        $(email).on('input selectionchange propertychange', func(email));
        $(email).focus(focus(email, DEFAULT_TEXTS.login_DefaultEmail));
        $(email).blur(blur(email, DEFAULT_TEXTS.login_DefaultEmail));


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
        button.classList.add('menuButton');
        button.innerHTML = 'Accept!';
        targetDomElement.appendChild(button);
        button.style.margin = '10px auto';


        $(button).on('click', ()=>{
            if(errorChecks(true)){
                alert("Send registration!");
            }
        });


        span = document.createElement('span');
        span.innerText = 'Have an account? ';
        targetDomElement.appendChild(span);

        span = document.createElement('span');
        span.innerText = 'Log In!';
        targetDomElement.appendChild(span);
        span.setAttribute('class', 'text_button');

        targetDomElement.appendChild(document.createElement('br'));
        targetDomElement.appendChild(document.createElement('br'));



        customGUIContainer.appendChild(loginScreen.domElement);


        registerDragWindow(loginScreen);

    }
    loginScreen.domElement.style.display = "block";
}

const openLevelEditScreen = function(){
    if(!levelEditScreen){
        const levelEditGUIWidth = 300;

        levelEditScreen =  new dat.GUI({
            autoPlace: false,
            width: levelEditGUIWidth
        });
        levelEditScreen.domElement.setAttribute('id', 'levelEditScreen');

        let folder = levelEditScreen.addFolder('Level Settings');
        folder.domElement.classList.add('custom');

        folder.open();


        var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

        let divWrapper = document.createElement('div');
        divWrapper.style.padding = '20px';

        let youtubeFeed = document.createElement('div');
        youtubeFeed.setAttribute('id', 'youtubeFeed');
        divWrapper.appendChild(youtubeFeed);

        let youtubeLink;
        for(let i = 0; i<3; i++){
            youtubeLink = document.createElement('div');
            youtubeLink.setAttribute('id', 'youtubeLink');
            youtubeFeed.appendChild(youtubeLink);
        }



        let span = document.createElement('span');
        span.innerText = 'Add YouTube links';
        divWrapper.appendChild(span);


        divWrapper.appendChild(document.createElement('br'));
        divWrapper.appendChild(document.createElement('br'));


        let textarea = document.createElement('textarea');
        textarea.value = 'Title...';
        divWrapper.appendChild(textarea);
        textarea.style.fontSize = '18px';
        textarea.style.height = '30px';
        textarea.style.fontWeight = 'bold';

        span = document.createElement('span');
        span.innerText = 'Characters left:100';
        divWrapper.appendChild(span);


        let func = (textarea, span) =>{
            let _text = textarea;
            let _span = span;
            var f = () => {
                const maxChars = 32;
                if(_text.value.length>maxChars) _text.value = _text.value.substr(0, maxChars);
                _span.innerText = `Characters left:${maxChars-_text.value.length}`;
            }
            f();
            return f;
        }
        $(textarea).on('input selectionchange propertychange', func(textarea, span));

        divWrapper.appendChild(document.createElement('br'));
        divWrapper.appendChild(document.createElement('br'));

        textarea = document.createElement('textarea');
        textarea.value = 'Description...';
        divWrapper.appendChild(textarea);
        textarea.style.height = '100px';

        span = document.createElement('span');
        span.innerText = 'Characters left:500';
        divWrapper.appendChild(span);



        func = (textarea, span) =>{
            let _text = textarea;
            let _span = span;
            var f = () => {
                const maxChars = 300;
                if(_text.value.length>maxChars) _text.value = _text.value.substr(0, maxChars);
                _span.innerText = `Characters left:${maxChars-_text.value.length}`;
            }
            f();
            return f;
        }
        $(textarea).on('input selectionchange propertychange', func(textarea, span));

        divWrapper.appendChild(document.createElement('br'));
        divWrapper.appendChild(document.createElement('br'));


        var levelOptions = {backgroundColor:'#FFFFFF'};
        var item = folder.addColor(levelOptions, "backgroundColor");
        divWrapper.appendChild(item.domElement.parentNode.parentNode);
        item.domElement.parentNode.parentNode.style.padding = '0px';

        divWrapper.appendChild(document.createElement('br'));
        divWrapper.appendChild(document.createElement('br'));


        let button = document.createElement('div');
        button.setAttribute('class', 'headerButton save buttonOverlay dark');
        button.innerHTML = "SAVE";
        button.style.marginLeft = '0px';
        button.style.marginRight = '5px';
        divWrapper.appendChild(button);


        button = document.createElement('div');
        button.setAttribute('class', 'headerButton publish buttonOverlay dark');
        button.innerHTML = "PUBLISH";
        divWrapper.appendChild(button);

        divWrapper.appendChild(document.createElement('br'));
        divWrapper.appendChild(document.createElement('br'));


        targetDomElement.appendChild(divWrapper);


        customGUIContainer.appendChild(levelEditScreen.domElement);


        registerDragWindow(levelEditScreen);

    }
    levelEditScreen.domElement.style.display = "block";
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
    customGUIContainer.appendChild(editorGUI.domElement);
}
export const destroyEditorGUI = function () {
    if (editorGUI != undefined) {
        customGUIContainer.removeChild(editorGUI.domElement);
        editorGUI = undefined;
    }
    removeGuiAssetSelection();
}

export const createEditorStyledGUI  = function(name){
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

    const icons = ['Icon_Mouse.png', 'Icon_Geometry.png', 'Icon_PolygonDrawing.png', 'Icon_Joints.png', 'Icon_Specials.png', 'Icon_Text.png', 'Icon_Zoom.png', 'Icon_Hand.png', 'Icon_PaintBucket.png', 'Icon_Eraser.png'];

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
    assetSelectedGroup:"",
    assetSelectedTexture:"",
}
let assetGUIPos = {x:0, y:0};
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

    if(Math.abs(difX)+Math.abs(difY) > 5){
        $(_window.domElement).find('.title').data('moved', true);
    }

    $(_window.domElement).css('left', startDragPos.x + difX);
    $(_window.domElement).css('top', startDragPos.y + difY);

}

export const registerDragWindow = function (_window) {
    windows.push(_window);
    var $titleBar = $(_window.domElement).find('.dg .title');
    $(_window.domElement).css('position', 'absolute');
    $titleBar.on('mousedown', function (event) {
        initDrag(event, _window)
    });
    $(document).on('click', function (event) {

        if($(_window.domElement).find('.title').data('moved') == true){
            var tarFolder = _window.__folders[$(_window.domElement).find('.title')[0].innerText]
            if(tarFolder.closed) tarFolder.open();
            else tarFolder.close();
        }


        endDrag(event, _window)
    });
}


const DEFAULT_TEXTS = {
    levelEditScreen_DefaultTitleText:"Fill in Title",
    levelEditScreen_DefaultDescriptionText:"Fill in Description",
    login_DefaultUsername:"Username",
    login_DefaultPassword:"Password",
    login_DefaultRePassword:"Re-type Password",
    login_DefaultEmail:"E-mail addres",
}