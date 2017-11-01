 var assetSelectionJSON = 
 {
    id: 'mainAssetSelection',
    component: 'Window',
    header: { id: 'headerAssetSelection', skin: 'blueheader', position: { x: 0, y: 0 }, height: 20, text: 'Asset Selection' },
    draggable: true,
    padding: 4,
    position: { x: 0, y: 0 },
    width: 300,
    height: 130,


    layout: [1, 2],
    children: [
        {
        id: 'hlist1',
        component: 'List',

        padding: 3,
        position: 'left',
        width: 300,
        height: 106,
        layout: [3],
        children: []
    }
    ]
}

var smallTextFont = {size: '14px',family: 'Arial', color:'0x000000'};

 var jointPinEditorJSON = 
 {
    id: 'jointPinEditor',
    component: 'Window',
    header: { id: 'jointPinEditor_header', skin: 'blueheader', position: { x: 0, y: 0 }, height: 20, text: 'Joint Editor'},
    draggable: true,
    padding: 20,
    position: { x: 0, y: 0 },
    width: 300,
    height: 450,


    layout: [2, 14],
    children: [
        { id:'jointPinEditor_pinButton', text:'Pin Joint', component:'bluebutton', position:'center left', width:100, height:30, selected:true, font:smallTextFont},
        { id:'jointPinEditor_slideButton', text:'Slide Joint', component:'Button', position:'center left', width:100, height:30, font:smallTextFont},
        { id:'jointPinEditor_collideConnected', text: '  collide connected', component: 'Checkbox', position: 'center left', width: 20, height: 20,  font: smallTextFont,}, null,
        { id:'jointPinEditor_enableMotor', text: '  enable motor', component: 'Checkbox', position: 'center left', width: 20, height: 20 , font: smallTextFont}, null,


        //Motor speed
        {text: 'motor speed:', component: 'Label_', position: 'left', width: 100, height: 30, font: smallTextFont},null,
        {component: 'Layout',

        z: 1, //the Z index allow to bring the navigation to the top so it can receive events (this is a workaround to the way PIXI handles events)

        position: { x: 0, y: -10 },
        width: 300,
        height: 30,
        layout: [6, 1],
        children: [
            {
                id: 'jointPinEditor_MotorSpeed_Slider',
                component: 'Slider',
                slide: { width: 18, height: 25 },
                position: 'left',
                width: 200,
                height: 25,
                valuePercentage: false,
                minSlideValue: -10,
                maxSlideValue: 10,
                defaultSlideValue: 0,
                slideScalar:"normal"
            },null,null,null,
            { id:'jointPinEditor_MotorSpeed_Slider_Text', text: '100', component: 'Label_', position: 'left', width: 30, height: 30, forceText:"100", font: smallTextFont}
        ]},null,

        // maxMotorTorque
        {text: 'motor torque:', component: 'Label_', position: 'left', width: 100, height: 30, font: smallTextFont}, null,
        {component: 'Layout',

        z: 1, //the Z index allow to bring the navigation to the top so it can receive events (this is a workaround to the way PIXI handles events)

        position: { x: 0, y: -10 },
        width: 300,
        height: 30,
        layout: [6, 1],
        children: [
            {
                id: 'jointPinEditor_MaxMotorTorque_Slider',
                component: 'Slider',
                slide: { width: 18, height: 25 },
                position: 'left',
                width: 200,
                height: 25,
                defaultSlideValue: 0
            },null,null,null,
            { id:'jointPinEditor_MaxMotorTorque_Slider_Text', text: '100', component: 'Label_', position: 'left', width: 30, height: 30, forceText:"100", font: smallTextFont}
        ]}, null,




         { id:'jointPinEditor_limitRotation', text: '  limit rotation', component: 'Checkbox', position: 'center left', width: 20, height: 20 , font: smallTextFont}, null,


        //Motor speed
        {text: 'upper limit:', component: 'Label_', position: 'left', width: 100, height: 30, font: smallTextFont},null,
        {component: 'Layout',

        z: 1, //the Z index allow to bring the navigation to the top so it can receive events (this is a workaround to the way PIXI handles events)

        position: { x: 0, y: -10 },
        width: 300,
        height: 30,
        layout: [6, 1],
        children: [
            {
                id: 'jointPinEditor_UpperLimit_Slider',
                component: 'Slider',
                slide: { width: 18, height: 25 },
                position: 'left',
                width: 200,
                height: 25,
                valuePercentage: false,
                minSlideValue: -10,
                maxSlideValue: 10,
                defaultSlideValue: 0,
                slideScalar:"normal"
            },null,null,null,
            { id:'jointPinEditor_UpperLimit_Slider_Text', text: '100', component: 'Label_', position: 'left', width: 30, height: 30, forceText:"100", font: smallTextFont}
        ]}, null,

        // maxMotorTorque
        {text: 'lower limit:', component: 'Label_', position: 'left', width: 100, height: 30, font: smallTextFont}, null,
        {component: 'Layout',

        z: 1, //the Z index allow to bring the navigation to the top so it can receive events (this is a workaround to the way PIXI handles events)

        position: { x: 0, y: -10 },
        width: 300,
        height: 30,
        layout: [6, 1],
        children: [
            {
                id: 'jointPinEditor_LowerLimit_Slider',
                component: 'Slider',
                slide: { width: 18, height: 25 },
                position: 'left',
                width: 200,
                height: 25,
                defaultSlideValue: 0
            },null,null,null,
            { id:'jointPinEditor_LowerLimit_Slider_Text', text: '100', component: 'Label_', position: 'left', width: 30, height: 30, forceText:"100", font: smallTextFont}
        ]},null,

        {component: 'Layout',

        z: 1, //the Z index allow to bring the navigation to the top so it can receive events (this is a workaround to the way PIXI handles events)

        padding: 3,
        position: { x: 0, y: 0 },
        width: 300,
        height: 50,
        layout: [12, 1],
        children: [
            {text: 'x:', component: 'Label_', position: 'left', width: 10, height: 30, font: smallTextFont},
            { id:'jointPinEditor_posX', text: '100', component: 'Input', position: 'left', width: 80, height: 30, z:1, forceText:"0-9", charLimit:3, font: smallTextFont}
        ]
         },
        {component: 'Layout',

        z: 1, //the Z index allow to bring the navigation to the top so it can receive events (this is a workaround to the way PIXI handles events)

        padding: 3,
        position: { x: 0, y: 0 },
        width: 300,
        height: 50,
        layout: [12, 1],
        children: [
            {text: 'y:', component: 'Label_', position: 'left', width: 10, height: 30, font: smallTextFont},
            { id:'jointPinEditor_posY', text: '100', component: 'Input', position: 'left', width: 80, height: 30, z:1, forceText:"0-9", charLimit:3, font: smallTextFont}
        ]
         }

    ]
}

//helper
EZGUI_addCloseButton = function (header, size, padding){
    var closeButton = EZGUI.create({id: 'closeButton', component: 'Button', position: { x:header.parent.width-size-padding, y:padding}, width: size, height: size }, 'kenney');
    header.addChild(closeButton);

    closeButton.on('click', function () {
                    header.parent.visible = false;
                }); 
}