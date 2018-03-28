

/*  DUMMY GUI FOR STYLING */
function initDummyDatGUI() {
    console.log("INIT DUMMY DAT GUI!")
    var customGUIContainer = document.getElementById('my-gui-container');
    var editorGUI = new dat.GUI({
        autoPlace: false,
        width: 150
    });
    customGUIContainer.appendChild(editorGUI.domElement);

    var dataJoint;
    var controller;
    var folder;

    var bodyObject = function () {
        this.type = 0;
        this.x = 50;
        this.y = 70;
        this.rotation = 0;
        this.groups = "group";
        this.refName = "ref";
        //
        this.ID = 0;
        this.colorFill = "#999999";
        this.colorLine = "#000";
        this.transparancy = 1.0;
        this.fixed = false;
        this.awake = true;
        this.vertices = [{
            x: 0,
            y: 0
        }, {
            x: 0,
            y: 0
        }];
        this.density = 1;
        this.collision = 0;
        this.radius = 0;
        this.tileTexture = "";
    }

    editorGUI.editData = new bodyObject;
    editorGUI.addFolder('body');
    //Populate default GUI Fields
    editorGUI.add(editorGUI.editData, "x").onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value - this.initialValue;
        this.initialValue = value;
    });

    editorGUI.add(editorGUI.editData, "y").onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value - this.initialValue;
        this.initialValue = value;
    });
    editorGUI.add(editorGUI.editData, "rotation").onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    });
    editorGUI.add(editorGUI.editData, "groups").onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value;
    });

    editorGUI.add(editorGUI.editData, "refName").onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value;
    });

    editorGUI.add(editorGUI.editData, "tileTexture", this.tileLists).onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value;
    });

    controller = editorGUI.addColor(editorGUI.editData, "colorFill");
    controller.onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value;
    }.bind(controller));
    controller = editorGUI.addColor(editorGUI.editData, "colorLine");
    controller.onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value;
    }.bind(controller));
    controller = editorGUI.add(editorGUI.editData, "transparancy", 0, 1);
    controller.onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value;
    }.bind(controller));
    editorGUI.add(editorGUI.editData, "fixed").onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    });
    editorGUI.add(editorGUI.editData, "awake").onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    });
    controller = editorGUI.add(editorGUI.editData, "density", 0, 1000).step(0.1);
    controller.onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    }.bind(controller));
    controller = editorGUI.add(editorGUI.editData, "collision", 0, 7).step(1);
    controller.onChange(function (value) {
        this.humanUpdate = true;
        this.targetValue = value
    }.bind(controller));

    gui.registerWindow(editorGUI.domElement);

}


function createToolGui(){
    var toolGui = document.createElement("div");
    toolGui.setAttribute('class', 'toolgui main');


    var header = document.createElement('div');
    header.setAttribute('class', 'dg');
    var ul = document.createElement('ul');
    header.appendChild(ul);
    var li = document.createElement('li');
    li.setAttribute('class', 'title')
    li.innerText = "tools";
    ul.appendChild(li);
    toolGui.appendChild(header);

    var icons = ['Icon_Zoom.png', 'Icon_Text.png','Icon_Specials.png', 'Icon_PolygonDrawing.png', 'Icon_PaintBucket.png', 'Icon_Joints.png', 'Icon_Hand.png', 'Icon_Geometry.png', 'Icon_Eraser.png'];
    var buttonElement;
    var imgElement;
    for(var i = 0; i<icons.length; i++){
        buttonElement = document.createElement("table");
        buttonElement.setAttribute('class', 'toolgui button');

        var row = document.createElement("tr");
        buttonElement.appendChild(row);

        imgElement = document.createElement('td');
        imgElement.setAttribute('class', 'toolgui img');
        row.appendChild(imgElement);

        toolGui.appendChild(buttonElement);
    }
    document.getElementById('uicontainer').appendChild(toolGui);
    var $buttons = $('.toolgui .img');
    for(var i = 0; i<$buttons.length; i++){
        console.log($($buttons[i]));
        $($buttons[i]).css('background-image', 'url(build/assets/images/gui/'+icons[i]+')');
        console.log($($buttons[i]).css('background-image'));
    }
    console.log($('.toolgui .button'));

    gui.registerWindow(toolGui);
}


function GUI(){
    this.windows = [];

    this.startDragPos = {x:0, y:0};
    this.startDragMouse = {x:0, y:0};

    var self = this;

    this.initDrag = function(event, _window){
        console.log('init drag');
        var self = this;
        $(document).on('mousemove', function(event){self.doDrag(event, _window)});
        self.startDragMouse.x = event.pageX;
        self.startDragMouse.y = event.pageY;
        self.startDragPos.x = parseInt($(_window).css('left'), 10) || 0;
        self.startDragPos.y = parseInt($(_window).css('top'), 10) || 0;
    }
    this.endDrag = function(event, _window){
        $(document).off('mousemove');
    }
    this.doDrag = function(event, _window){
        var difX = event.pageX-self.startDragMouse.x;
        var difY = event.pageY-self.startDragMouse.y;

        $(_window).css('left', self.startDragPos.x + difX);
        $(_window).css('top', self.startDragPos.y + difY);
    }

    this.registerWindow = function(_window){
        this.windows.push(_window);
        var $titleBar = $(_window).find('.dg .title');
        var self = this;
        $(_window).css('position', 'absolute');
        $titleBar.on('mousedown', function(event){self.initDrag(event, _window)});
        $(document).on('mouseup', function(event){self.endDrag(event, _window)});
    }
}

var gui = new GUI();

initDummyDatGUI();
initDummyDatGUI();

createToolGui();
