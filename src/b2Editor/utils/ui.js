import { B2dEditor } from "../B2dEditor";
import * as scrollBars from "./scrollBars";
import * as dat from "../../../libs/dat.gui";
import {
	game
} from "../../Game";


let toolGUI;
export let assetGUI;
export let editorGUI;
let headerBar;

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
    button.setAttribute('class', 'headerButton publish buttonOverlay dark');
    button.innerHTML = "PUBLISH";
    headerBar.appendChild(button);

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

    button = document.createElement('div');
    button.setAttribute('class', 'headerIcon edit buttonOverlay dark');
    headerBar.appendChild(button);

    let levelName = document.createElement('span');
    levelName.innerHTML = "TEST 123";
    button.setAttribute('id', 'levelName');
    headerBar.appendChild(levelName);









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
    registerDragWindow(toolGUI);
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
        assetGUI.addFolder('Asset Selection');

        if (assetSelection.assetSelectedGroup == "") assetSelection.assetSelectedGroup = B2dEditor.assetLists.__keys[0];
        assetSelection.assetSelectedTexture = B2dEditor.assetLists[assetSelection.assetSelectedGroup][0];


        var folder = assetGUI.addFolder('Textures');
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
            $(folder.domElement).append(guiFunction);
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
        registerDragWindow(assetGUI.domElement);
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
    startDragPos.x = parseInt($(_window).css('left'), 10) || 0;
    startDragPos.y = parseInt($(_window).css('top'), 10) || 0;

}
export const endDrag = function (event, _window) {
    $(document).off('mousemove');
}
export const doDrag = function (event, _window) {
    var difX = event.pageX - startDragMouse.x;
    var difY = event.pageY - startDragMouse.y;

    $(_window).css('left', startDragPos.x + difX);
    $(_window).css('top', startDragPos.y + difY);
}

export const registerDragWindow = function (_window) {
    windows.push(_window);
    var $titleBar = $(_window).find('.dg .title');
    $(_window).css('position', 'absolute');
    $titleBar.on('mousedown', function (event) {
        initDrag(event, _window)
    });
    $(document).on('mouseup', function (event) {
        endDrag(event, _window)
    });
}