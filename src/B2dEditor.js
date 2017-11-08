function B2dEditor() {



	this.initialPTM;
	this.PTM;
	this.world;
	this.debugGraphics = null;
	this.textures = null;
	this.container = null;
	this.editorMode = ""
	this.editorGUI;
	this.customGUIContainer = document.getElementById('my-gui-container');

	this.selectedPhysicsBodies = [];
	this.selectedTextures = [];
	this.selectedBoundingBox;
	this.startSelectionPoint;

	this.canvas;
	this.mousePosPixel;
	this.mousePosWorld;
	this.oldMousePosWorld;

	this.assetLists = {};
	this.assetGUI;
	this.assetSelectedTexture = "";
	this.assetSelectedGroup = "";
	this.assetSelectedObject = "";

	this.editorIcons = [];

	/*this.worldJSON = '{"objects":[\
	{"x":13.5,"y":4.508333333333333,"rotation":0,"ID":0,"type":0,"textureID":null,"texturePositionOffsetLength":null,"texturePositionOffsetAngle":null,"textureAngleOffset":null,"colorFill":"#000000","colorLine":"#000000","fixed":false,"collision":0, "awake":true, "density":1, "group":"","refName":"", "vertices":[{"x":1.6999999999999993,"y":0.49166666666666714},{"x":-0.3333333333333339,"y":1.4250000000000007},{"x":-1.1333333333333329,"y":-0.24166666666666625},{"x":-0.2333333333333325,"y":-1.6749999999999994}]},\
	{"x":14.908333333333335,"y":4.0166666666666675,"rotation":0,"ID":1,"type":0,"textureID":null,"texturePositionOffsetLength":null,"texturePositionOffsetAngle":null,"textureAngleOffset":null,"colorFill":"#000000","colorLine":"#000000","fixed":false,"collision":0, "awake":true, "density":1, "group":"","refName":"","vertices":[{"x":2.658333333333335,"y":-2.3166666666666664},{"x":3.125,"y":-0.2833333333333323},{"x":-2.9749999999999996,"y":1.9166666666666679},{"x":-2.8083333333333336,"y":0.6833333333333336}]},\
	{"type":2,"jointType":0,"bodyA_ID":1,"bodyB_ID":0,"x":405,"y":134,"ID":2,"collideConnected":false,"motorSpeed":2,"maxMotorTorque":10,"enableMotor":true,"enableLimit":false,"upperAngle":0,"lowerAngle":0, "frequencyHz":0.0, "dampingRatio":0.0, "group":"","refName":""},\
	{"x":12.541666666666666,"y":11.691666666666666,"rotation":0,"ID":3,"type":0,"textureID":null,"texturePositionOffsetLength":null,"texturePositionOffsetAngle":null,"textureAngleOffset":null,"colorFill":"#000000","colorLine":"#000000","fixed":false,"collision":0, "awake":true, "density":1, "group":"","refName":"","vertices":[{"x":6.3583333333333325,"y":-1.1583333333333332},{"x":6.691666666666668,"y":0.9416666666666664},{"x":-6.675,"y":1.0083333333333329},{"x":-6.374999999999999,"y":-0.7916666666666661}]},\
	{"jointType":0,"x":222,"y":358,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"type":2,"bodyA_ID":3,"ID":4,"frequencyHz":0.0, "dampingRatio":0.0, "group":"","refName":""},\
	{"jointType":0,"x":537,"y":354,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"type":2,"bodyA_ID":3,"ID":5, "frequencyHz":0.0, "dampingRatio":0.0, "group":"","refName":""},\
	{"x":7.459999999999999,"y":5.253333333333333,"rotation":0,"ID":6,"type":0,"colorFill":"#000000","colorLine":"#000000","fixed":false,"collision":0, "awake":true, "density":1, "group":"","refName":"","vertices":[{"x":0.14000000000000057,"y":-0.45333333333333314},{"x":0.4733333333333345,"y":-0.3866666666666667},{"x":0.5400000000000009,"y":0.013333333333333641},{"x":0.4733333333333345,"y":0.3466666666666667},{"x":0.07333333333333414,"y":0.5466666666666669},{"x":-0.2599999999999989,"y":0.4800000000000004},\
	{"x":-0.4599999999999991,"y":0.21333333333333382},{"x":-0.4599999999999991,"y":-0.05333333333333279},{"x":-0.39333333333333265,"y":-0.25333333333333297},{"x":-0.12666666666666604,"y":-0.45333333333333314}]},{"x":223.98959350585932,"y":160.00000000000006,"rotation":0,"ID":7,"type":1,"textureName":"1head.png","bodyID":6,"texturePositionOffsetLength":2.4074770398623397,"texturePositionOffsetAngle":-1.4919627495569028,"textureAngleOffset":0, "group":"","refName":""}]}';
	*/
	this.worldJSON = '{"objects":[{"x":8.20833333333333,"y":10.341666666666669,"rotation":0,"ID":0,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":3.791666666666666,"y":-0.6416666666666675},{"x":3.658333333333333,"y":0.5583333333333336},{"x":-3.7416666666666663,"y":0.49166666666666536},{"x":-3.708333333333333,"y":-0.4083333333333332}],"density":1,"group":"","refName":"","collision":0},{"x":18.55833333333333,"y":10.475000000000001,"rotation":0,"ID":1,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":3.8416666666666686,"y":-0.375},{"x":3.908333333333335,"y":0.5916666666666668},{"x":-3.891666666666664,"y":0.3583333333333325},{"x":-3.8583333333333307,"y":-0.5749999999999993}],"density":1,"group":"","refName":"","collision":0},{"jointType":0,"x":142.99999999999994,"y":311.99999999999983,"rotation":0,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":0,"ID":2},{"x":15.341666666666661,"y":10.458333333333336,"rotation":0,"ID":3,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.7250000000000014,"y":-0.625},{"x":0.5249999999999986,"y":0.5416666666666661},{"x":-0.7083333333333339,"y":0.44166666666666643},{"x":-0.5416666666666661,"y":-0.3583333333333334}],"density":1,"group":"","refName":"","collision":0},{"jointType":0,"x":457.9999999999998,"y":309.99999999999983,"rotation":0,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":3,"bodyB_ID":1,"ID":4}, {"x":19.579913454194227,"y":14.999869961614188,"rotation":0,"ID":8,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":true,"awake":true,"vertices":[{"x":53.29272751269292,"y":-3.096296540382024},{"x":53.58414365767007,"y":2.2949021416949087},{"x":-53.65699769391434,"y":2.7320263591606064},{"x":-53.21987347644865,"y":-1.9306319604735016}],"density":1,"group":"","refName":"","collision":0}]}';
	this.vehicleJSON = '{"objects":[{"x":10.832343843531111,"y":1.5150202369891899,"rotation":0,"ID":0,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.45534230357671035,"y":-0.9410407607252083},{"x":-0.04553423035767068,"y":-1.214246142871236},{"x":0.31873961250370186,"y":-0.8499723000098651},{"x":0.4098080732190432,"y":0.06071230714356268},{"x":0.1366026910730156,"y":1.4039721026948673},{"x":-0.364273842861369,"y":1.540574793767881}],"density":1,"group":"","refName":"","collision":7},{"x":322.6234810732986,"y":50.68704360080786,"rotation":0,"ID":1,"type":1,"textureName":"1upleg.png","bodyID":0,"texturePositionOffsetLength":5.738283544852673,"texturePositionOffsetAngle":-1.992130640224259,"textureAngleOffset":0,"group":"","refName":""},{"x":10.666842094257767,"y":3.8600331004092756,"rotation":0,"ID":2,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.32253413170017,"y":-0.46293134196965813},{"x":-0.16316432544832082,"y":-1.1231776821558928},{"x":0.1783424022342146,"y":-1.1004105669770565},{"x":0.33771220848606376,"y":-0.531232687506165},{"x":0.2921779781283895,"y":1.6544103696620605},{"x":-0.32253413170017,"y":1.5633419089467173}],"density":1,"group":"","refName":"","collision":7},{"x":325.3555348947597,"y":125.50153714633103,"rotation":0,"ID":3,"type":1,"textureName":"1lowleg.png","bodyID":2,"texturePositionOffsetLength":11.078175286928426,"texturePositionOffsetAngle":-1.0667688592172224,"textureAngleOffset":0,"group":"","refName":""},{"x":10.995672382067408,"y":-1.4584194873266174,"rotation":0,"ID":4,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.3555555555555614,"y":-0.4111111111111114},{"x":-0.15555555555555856,"y":-0.8777777777777782},{"x":0.1777777777777736,"y":-0.8111111111111113},{"x":0.3777777777777729,"y":0.05555555555555536},{"x":0.11111111111110716,"y":1.0555555555555554},{"x":-0.15555555555555856,"y":0.9888888888888889}],"density":1,"group":"","refName":"","collision":7},{"x":331.2035047953555,"y":-40.08591795313181,"rotation":0,"ID":5,"type":1,"textureName":"1uparm.png","bodyID":4,"texturePositionOffsetLength":3.9015666369065602,"texturePositionOffsetAngle":-1.222025323211012,"textureAngleOffset":0,"group":"","refName":""},{"x":11.075525953814187,"y":0.5423114248776808,"rotation":0,"ID":6,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.1710527060768996,"y":-0.25657905911535295},{"x":-0.13684216486151968,"y":-1.0092109658537227},{"x":0.13684216486152323,"y":-0.9750004246383419},{"x":0.20526324729228307,"y":0.1197368942538315},{"x":0.10263162364614331,"y":1.0776320482844826},{"x":-0.13684216486151968,"y":1.0434215070691026}],"density":1,"group":"","refName":"","collision":7},{"x":332.26577861442587,"y":16.78250086456113,"rotation":0,"ID":7,"type":1,"textureName":"1lowarm.png","bodyID":6,"texturePositionOffsetLength":0.5131581182307059,"texturePositionOffsetAngle":-1.5707963267944536,"textureAngleOffset":0,"group":"","refName":""},{"x":17.37853355420043,"y":3.0581330066065946,"rotation":0,"ID":8,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0,"y":0},{"x":0,"y":0}],"density":1,"group":"__vehicle","refName":"","collision":0,"radius":52.98392360831555},{"x":521.3560066260127,"y":91.74399019819775,"rotation":0,"ID":9,"type":1,"textureName":"Bike1_Tire.png","bodyID":8,"texturePositionOffsetLength":2.9673135796061134e-13,"texturePositionOffsetAngle":2.8501358591119264,"textureAngleOffset":0,"group":"__vehicle","refName":""},{"x":14.694660705871263,"y":2.046077042927138,"rotation":0,"ID":10,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.42292693052404395,"y":1.7621955438501815},{"x":-3.3431366889043446,"y":1.158014214530119},{"x":-1.3795473686141424,"y":-2.0139377644002074},{"x":1.8427530544261899,"y":-2.0642862085102127},{"x":3.3028579336163375,"y":1.158014214530119}],"density":1,"group":"__vehicle","refName":"","collision":0},{"x":438.7251865235177,"y":50.80913802471307,"rotation":0,"ID":11,"type":1,"textureName":"Bike1_Frame.png","bodyID":10,"texturePositionOffsetLength":10.782563357829968,"texturePositionOffsetAngle":1.7681918866447732,"textureAngleOffset":0,"group":"__vehicle","refName":""},{"jointType":0,"x":520.8175971693768,"y":91.59240876288376,"rotation":0,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"__vehicle","refName":"","bodyA_ID":8,"bodyB_ID":10,"ID":12},{"x":12.076495538186682,"y":3.091819962434291,"rotation":0,"ID":13,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0,"y":0},{"x":0,"y":0}],"density":1,"group":"__vehicle","refName":"","collision":0,"radius":52.98392360831555},{"x":362.29486614560017,"y":92.75459887302864,"rotation":0,"ID":14,"type":1,"textureName":"Bike1_Tire.png","bodyID":13,"texturePositionOffsetLength":2.9673135796061134e-13,"texturePositionOffsetAngle":2.8501358591119264,"textureAngleOffset":0,"group":"__vehicle","refName":""},{"x":13.053795276522061,"y":-1.1641208562220369,"rotation":0,"ID":15,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.6285714285714263,"y":-0.5714285714285721},{"x":-0.16190476190476133,"y":-1.304761904761905},{"x":0.10476190476190439,"y":-1.5714285714285716},{"x":0.4380952380952401,"y":-1.4380952380952383},{"x":0.571428571428573,"y":0.2952380952380951},{"x":0.37142857142857366,"y":2.3619047619047615},{"x":-0.6952380952380928,"y":2.2285714285714286}],"density":1,"group":"","refName":"","collision":7},{"x":388.7567154385187,"y":-24.06648282951827,"rotation":0,"ID":16,"type":1,"textureName":"1body.png","bodyID":15,"texturePositionOffsetLength":11.226790116793472,"texturePositionOffsetAngle":-1.8281200417660084,"textureAngleOffset":0,"group":"","refName":""},{"x":13.19929573538847,"y":-2.9787367089527814,"rotation":0,"ID":17,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0,"y":0},{"x":0,"y":0}],"density":1,"group":"","refName":"","collision":7,"radius":14.000000000000057},{"x":395.978872061654,"y":-89.36210126858347,"rotation":0,"ID":18,"type":1,"textureName":"1head.png","bodyID":17,"texturePositionOffsetLength":1.1718571004216928e-13,"texturePositionOffsetAngle":2.896613990462929,"textureAngleOffset":0,"group":"","refName":""},{"x":13.034577178304945,"y":1.9412078159608974,"rotation":0,"ID":19,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.45534230357671035,"y":-0.9410407607252083},{"x":-0.04553423035767068,"y":-1.214246142871236},{"x":0.31873961250370186,"y":-0.8499723000098651},{"x":0.4098080732190432,"y":0.06071230714356268},{"x":0.1366026910730156,"y":1.4039721026948673},{"x":-0.364273842861369,"y":1.540574793767881}],"density":1,"group":"","refName":"","collision":7},{"x":388.6904811165136,"y":63.47267096995909,"rotation":0,"ID":20,"type":1,"textureName":"1upleg.png","bodyID":19,"texturePositionOffsetLength":5.738283544852673,"texturePositionOffsetAngle":-1.992130640224259,"textureAngleOffset":0,"group":"","refName":""},{"x":12.869075429031591,"y":4.286220679380987,"rotation":0,"ID":21,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.32253413170017,"y":-0.46293134196965813},{"x":-0.16316432544832082,"y":-1.1231776821558928},{"x":0.1783424022342146,"y":-1.1004105669770565},{"x":0.33771220848606376,"y":-0.531232687506165},{"x":0.2921779781283895,"y":1.6544103696620605},{"x":-0.32253413170017,"y":1.5633419089467173}],"density":1,"group":"","refName":"","collision":7},{"x":391.42253493797443,"y":138.28716451548237,"rotation":0,"ID":22,"type":1,"textureName":"1lowleg.png","bodyID":21,"texturePositionOffsetLength":11.078175286928426,"texturePositionOffsetAngle":-1.0667688592172224,"textureAngleOffset":0,"group":"","refName":""},{"x":12.91379117739144,"y":-1.169271013794953,"rotation":0,"ID":23,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.3555555555555614,"y":-0.4111111111111114},{"x":-0.15555555555555856,"y":-0.8777777777777782},{"x":0.1777777777777736,"y":-0.8111111111111113},{"x":0.3777777777777729,"y":0.05555555555555536},{"x":0.11111111111110716,"y":1.0555555555555554},{"x":-0.15555555555555856,"y":0.9888888888888889}],"density":1,"group":"","refName":"","collision":7},{"x":388.7470686550765,"y":-31.41146374718187,"rotation":0,"ID":24,"type":1,"textureName":"1uparm.png","bodyID":23,"texturePositionOffsetLength":3.9015666369065602,"texturePositionOffsetAngle":-1.222025323211012,"textureAngleOffset":0,"group":"","refName":""},{"x":12.97461054642372,"y":0.8113575480533707,"rotation":0,"ID":25,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.1710527060768996,"y":-0.25657905911535295},{"x":-0.13684216486151968,"y":-1.0092109658537227},{"x":0.13684216486152323,"y":-0.9750004246383419},{"x":0.20526324729228307,"y":0.1197368942538315},{"x":0.10263162364614331,"y":1.0776320482844826},{"x":-0.13684216486151968,"y":1.0434215070691026}],"density":1,"group":"","refName":"","collision":7},{"x":389.23831639271185,"y":24.853884559831826,"rotation":0,"ID":26,"type":1,"textureName":"1lowarm.png","bodyID":25,"texturePositionOffsetLength":0.5131581182307059,"texturePositionOffsetAngle":-1.5707963267944536,"textureAngleOffset":0,"group":"","refName":""},{"jointType":0,"x":361,"y":93,"rotation":0,"collideConnected":false,"enableMotor":true,"maxMotorTorque":158.69017632241813,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"__vehicle","refName":"engine","bodyA_ID":10,"bodyB_ID":13,"ID":27}]}'
	this.characterJSON = '{"objects":[{"x":22.553839909988955,"y":4.7969752794865474,"rotation":0,"ID":0,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.45534230357671035,"y":-0.9410407607252083},{"x":-0.04553423035767068,"y":-1.214246142871236},{"x":0.31873961250370186,"y":-0.8499723000098651},{"x":0.4098080732190432,"y":0.06071230714356268},{"x":0.1366026910730156,"y":1.4039721026948673},{"x":-0.364273842861369,"y":1.540574793767881}],"density":1,"group":"","refName":"","collision":7},{"x":674.2683630670339,"y":149.1456948757286,"rotation":0,"ID":1,"type":1,"textureName":"1upleg.png","bodyID":0,"texturePositionOffsetLength":5.738283544852673,"texturePositionOffsetAngle":-1.992130640224259,"textureAngleOffset":0,"group":"","refName":""},{"x":22.388338160715605,"y":7.141988142906628,"rotation":0,"ID":2,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.32253413170017,"y":-0.46293134196965813},{"x":-0.16316432544832082,"y":-1.1231776821558928},{"x":0.1783424022342146,"y":-1.1004105669770565},{"x":0.33771220848606376,"y":-0.531232687506165},{"x":0.2921779781283895,"y":1.6544103696620605},{"x":-0.32253413170017,"y":1.5633419089467173}],"density":1,"group":"","refName":"","collision":7},{"x":677.0004168884949,"y":223.96018842125162,"rotation":0,"ID":3,"type":1,"textureName":"1lowleg.png","bodyID":2,"texturePositionOffsetLength":11.078175286928426,"texturePositionOffsetAngle":-1.0667688592172224,"textureAngleOffset":0,"group":"","refName":""},{"jointType":0,"x":672.2193227009398,"y":186.71143492080748,"rotation":1.5999999999999943,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":0,"lowerAngle":-149.0176322418136,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":2,"bodyB_ID":0,"ID":4},{"x":22.745559912771213,"y":1.8235355551707402,"rotation":0,"ID":5,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.3555555555555614,"y":-0.4111111111111114},{"x":-0.15555555555555856,"y":-0.8777777777777782},{"x":0.1777777777777736,"y":-0.8111111111111113},{"x":0.3777777777777729,"y":0.05555555555555536},{"x":0.11111111111110716,"y":1.0555555555555554},{"x":-0.15555555555555856,"y":0.9888888888888889}],"density":1,"group":"","refName":"","collision":7},{"x":683.7001307164696,"y":58.37273332178892,"rotation":0,"ID":6,"type":1,"textureName":"1uparm.png","bodyID":5,"texturePositionOffsetLength":3.9015666369065602,"texturePositionOffsetAngle":-1.222025323211012,"textureAngleOffset":0,"group":"","refName":""},{"x":22.79702202027203,"y":3.824266467375038,"rotation":0,"ID":7,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.1710527060768996,"y":-0.25657905911535295},{"x":-0.13684216486151968,"y":-1.0092109658537227},{"x":0.13684216486152323,"y":-0.9750004246383419},{"x":0.20526324729228307,"y":0.1197368942538315},{"x":0.10263162364614331,"y":1.0776320482844826},{"x":-0.13684216486151968,"y":1.0434215070691026}],"density":1,"group":"","refName":"","collision":7},{"x":683.9106606081612,"y":115.24115213948184,"rotation":0,"ID":8,"type":1,"textureName":"1lowarm.png","bodyID":7,"texturePositionOffsetLength":0.5131581182307059,"texturePositionOffsetAngle":-1.5707963267944536,"textureAngleOffset":0,"group":"","refName":""},{"jointType":0,"x":683.9106606081614,"y":84.45166504563925,"rotation":1.5807274866610683,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":152,"lowerAngle":0,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":7,"bodyB_ID":5,"ID":9},{"x":22.792805088677298,"y":1.8130501313998035,"rotation":0,"ID":10,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.6285714285714263,"y":-0.5714285714285721},{"x":-0.16190476190476133,"y":-1.304761904761905},{"x":0.10476190476190439,"y":-1.5714285714285716},{"x":0.4380952380952401,"y":-1.4380952380952383},{"x":0.571428571428573,"y":0.2952380952380951},{"x":0.37142857142857366,"y":2.3619047619047615},{"x":-0.6952380952380928,"y":2.2285714285714286}],"density":1,"group":"","refName":"","collision":7},{"x":680.9270098031758,"y":65.24864679913694,"rotation":0,"ID":11,"type":1,"textureName":"1body.png","bodyID":10,"texturePositionOffsetLength":11.226790116793472,"texturePositionOffsetAngle":-1.8281200417660084,"textureAngleOffset":0,"group":"","refName":""},{"jointType":0,"x":680.4243861668929,"y":38.57692965716447,"rotation":1.5807274866610896,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":10,"lowerAngle":-180,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":10,"bodyB_ID":5,"ID":12},{"x":22.938305547543706,"y":-0.0015657213309401286,"rotation":0,"ID":13,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0,"y":0},{"x":0,"y":0}],"density":1,"group":"","refName":"","collision":7,"radius":14.000000000000057},{"x":688.1491664263111,"y":-0.04697163992823228,"rotation":0,"ID":14,"type":1,"textureName":"1head.png","bodyID":13,"texturePositionOffsetLength":1.1718571004216928e-13,"texturePositionOffsetAngle":2.896613990462929,"textureAngleOffset":0,"group":"","refName":""},{"jointType":0,"x":688.1491664263115,"y":9.60900368434497,"rotation":-1.5861250927131039,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":57.58186397984887,"lowerAngle":-64.38287153652392,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":10,"bodyB_ID":13,"ID":15},{"x":22.77358699046018,"y":4.918378803582737,"rotation":0,"ID":16,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.45534230357671035,"y":-0.9410407607252083},{"x":-0.04553423035767068,"y":-1.214246142871236},{"x":0.31873961250370186,"y":-0.8499723000098651},{"x":0.4098080732190432,"y":0.06071230714356268},{"x":0.1366026910730156,"y":1.4039721026948673},{"x":-0.364273842861369,"y":1.540574793767881}],"density":1,"group":"","refName":"","collision":7},{"x":680.8607754811707,"y":152.78780059861427,"rotation":0,"ID":17,"type":1,"textureName":"1upleg.png","bodyID":16,"texturePositionOffsetLength":5.738283544852673,"texturePositionOffsetAngle":-1.992130640224259,"textureAngleOffset":0,"group":"","refName":""},{"x":22.60808524118683,"y":7.263391667002825,"rotation":0,"ID":18,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.32253413170017,"y":-0.46293134196965813},{"x":-0.16316432544832082,"y":-1.1231776821558928},{"x":0.1783424022342146,"y":-1.1004105669770565},{"x":0.33771220848606376,"y":-0.531232687506165},{"x":0.2921779781283895,"y":1.6544103696620605},{"x":-0.32253413170017,"y":1.5633419089467173}],"density":1,"group":"","refName":"","collision":7},{"x":683.5928293026317,"y":227.60229414413752,"rotation":0,"ID":19,"type":1,"textureName":"1lowleg.png","bodyID":18,"texturePositionOffsetLength":11.078175286928426,"texturePositionOffsetAngle":-1.0667688592172224,"textureAngleOffset":0,"group":"","refName":""},{"jointType":0,"x":678.8117351150763,"y":190.353540643693,"rotation":1.5999999999999943,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":0,"lowerAngle":-149.0176322418136,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":18,"bodyB_ID":16,"ID":20},{"jointType":0,"x":680.2481124117094,"y":116.2185088835673,"rotation":1.600000000000005,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":149.47103274559194,"lowerAngle":-8.765743073047872,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":16,"bodyB_ID":10,"ID":21},{"jointType":0,"x":677.1673867717411,"y":116.44081546899827,"rotation":1.5523033076478931,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":16.4735516372796,"lowerAngle":-141.76322418136021,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":10,"bodyB_ID":0,"ID":22},{"x":22.652800989546677,"y":1.8078999738268875,"rotation":0,"ID":23,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.3555555555555614,"y":-0.4111111111111114},{"x":-0.15555555555555856,"y":-0.8777777777777782},{"x":0.1777777777777736,"y":-0.8111111111111113},{"x":0.3777777777777729,"y":0.05555555555555536},{"x":0.11111111111110716,"y":1.0555555555555554},{"x":-0.15555555555555856,"y":0.9888888888888889}],"density":1,"group":"","refName":"","collision":7},{"x":680.9173630197336,"y":57.90366588147334,"rotation":0,"ID":24,"type":1,"textureName":"1uparm.png","bodyID":23,"texturePositionOffsetLength":3.9015666369065602,"texturePositionOffsetAngle":-1.222025323211012,"textureAngleOffset":0,"group":"","refName":""},{"x":22.71362035857896,"y":3.7885285356752103,"rotation":0,"ID":25,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.1710527060768996,"y":-0.25657905911535295},{"x":-0.13684216486151968,"y":-1.0092109658537227},{"x":0.13684216486152323,"y":-0.9750004246383419},{"x":0.20526324729228307,"y":0.1197368942538315},{"x":0.10263162364614331,"y":1.0776320482844826},{"x":-0.13684216486151968,"y":1.0434215070691026}],"density":1,"group":"","refName":"","collision":7},{"x":681.408610757369,"y":114.16901418848701,"rotation":0,"ID":26,"type":1,"textureName":"1lowarm.png","bodyID":25,"texturePositionOffsetLength":0.5131581182307059,"texturePositionOffsetAngle":-1.5707963267944536,"textureAngleOffset":0,"group":"","refName":""},{"jointType":0,"x":680.1162993569685,"y":81.96678486677041,"rotation":1.5861250927131039,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":151.88916876574308,"lowerAngle":0,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":25,"bodyB_ID":23,"ID":27},{"jointType":0,"x":681.0374766150494,"y":37.06978761437075,"rotation":1.5071237677699827,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":18.89168765743073,"lowerAngle":-180,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":10,"bodyB_ID":23,"ID":28}]}'



	//P*N
	//{"objects":[{"x":14.251087384618318,"y":7.660068790898384,"rotation":0,"ID":0,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.8039477185614405,"y":-0.6328950124845383},{"x":0.7355266361306807,"y":0.6328950124845374},{"x":-0.7697371773460588,"y":0.5986844712691575},{"x":-0.7697371773460588,"y":-0.5986844712691575}],"density":1,"group":"","refName":"","collision":0},{"x":14.268192655226011,"y":6.667963095652352,"rotation":0,"ID":1,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.8039477185614405,"y":-0.6328950124845383},{"x":0.7355266361306807,"y":0.6328950124845374},{"x":-0.7697371773460588,"y":0.5986844712691575},{"x":-0.7697371773460588,"y":-0.5986844712691575}],"density":1,"group":"","refName":"","collision":0},{"jointType":2,"x":413.2824528890815,"y":209.47987597205378,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":1,"bodyB_ID":0,"ID":2},{"jointType":2,"x":447.3550256666383,"y":209.8022716073756,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":1,"bodyB_ID":0,"ID":3},{"x":14.298126878789466,"y":5.658752129798629,"rotation":0,"ID":4,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.8039477185614405,"y":-0.6328950124845383},{"x":0.7355266361306807,"y":0.6328950124845374},{"x":-0.7697371773460588,"y":0.5986844712691575},{"x":-0.7697371773460588,"y":-0.5986844712691575}],"density":1,"group":"","refName":"","collision":0},{"x":14.31523214939716,"y":4.6666464345525975,"rotation":0,"ID":5,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.8039477185614405,"y":-0.6328950124845383},{"x":0.7355266361306807,"y":0.6328950124845374},{"x":-0.7697371773460588,"y":0.5986844712691575},{"x":-0.7697371773460588,"y":-0.5986844712691575}],"density":1,"group":"","refName":"","collision":0},{"jointType":2,"x":410.47011410737883,"y":154.36782034703788,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":5,"bodyB_ID":4,"ID":6},{"jointType":2,"x":449.4701310929125,"y":155.3941365834993,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":5,"bodyB_ID":4,"ID":7},{"jointType":2,"x":409.0589292822442,"y":183.61783308618797,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":4,"bodyB_ID":1,"ID":8},{"jointType":2,"x":448.05894626777786,"y":185.1573074408801,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":4,"bodyB_ID":1,"ID":9},{"x":14.34516637296061,"y":3.669409158124259,"rotation":0,"ID":10,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.8039477185614405,"y":-0.6328950124845383},{"x":0.7355266361306807,"y":0.6328950124845374},{"x":-0.7697371773460588,"y":0.5986844712691575},{"x":-0.7697371773460588,"y":-0.5986844712691575}],"density":1,"group":"","refName":"","collision":0},{"x":14.362271643568304,"y":2.6773034628782253,"rotation":0,"ID":11,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.8039477185614405,"y":-0.6328950124845383},{"x":0.7355266361306807,"y":0.6328950124845374},{"x":-0.7697371773460588,"y":0.5986844712691575},{"x":-0.7697371773460588,"y":-0.5986844712691575}],"density":1,"group":"","refName":"","collision":0},{"jointType":2,"x":411.8812989325131,"y":94.68753119680662,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":11,"bodyB_ID":10,"ID":12},{"jointType":2,"x":450.88131591804677,"y":95.71384743326806,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":11,"bodyB_ID":10,"ID":13},{"jointType":2,"x":411.11156175516703,"y":124.60464948965675,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":5,"bodyB_ID":10,"ID":14},{"jointType":2,"x":448.57210438600856,"y":124.60464948965675,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":5,"bodyB_ID":10,"ID":15},{"x":14.279139924130396,"y":1.310339972752702,"rotation":0,"ID":16,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-1.0923804884350243,"y":0.9515963682071219},{"x":-1.0454524483590575,"y":0.34153184721954244},{"x":-0.8812043080931709,"y":-0.12774855354013415},{"x":-0.623100087675347,"y":-0.5970289542998108},{"x":-0.24767576706760686,"y":-0.7378130745277138},{"x":0.4562448340719065,"y":-0.6908850344517461},{"x":0.9255252348315839,"y":-0.4093167939959402},{"x":1.2540215153633572,"y":0.3180678271815587},{"x":1.2540215153633572,"y":0.9515963682071219}],"density":1,"group":"","refName":"","collision":0},{"jointType":2,"x":413.200798099349,"y":62.930646020818116,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":16,"bodyB_ID":11,"ID":17},{"jointType":2,"x":446.98898695404574,"y":63.63456662195763,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":16,"bodyB_ID":11,"ID":18},{"x":12.633888463550377,"y":8.968246568066073,"rotation":0,"ID":19,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.2947667517271704,"y":-1.4503697385978755},{"x":0.9517593127907169,"y":-1.2391935582560212},{"x":1.4210397135503925,"y":-0.6291290372684424},{"x":1.491431773664349,"y":-0.11292059643279817},{"x":1.2802555933224937,"y":0.4971439245547824},{"x":1.0925434330186228,"y":0.8725682451625225},{"x":0.764047152486846,"y":1.2010645256942967},{"x":0.15398263149926805,"y":1.2949206058462313},{"x":-0.3622258093363797,"y":1.2010645256942967},{"x":-0.7845781700200867,"y":1.0602804054663935},{"x":-1.1834665106658129,"y":0.7083201048966368},{"x":-1.3477146509316995,"y":0.21557568409897598},{"x":-1.418106711045649,"y":-0.20677667658473275},{"x":-1.2538585707797623,"y":-0.722985117420377},{"x":-0.8549702301340361,"y":-1.2391935582560212},{"x":-0.24490570914645815,"y":-1.4503697385978755}],"density":1,"group":"","refName":"","collision":0},{"jointType":0,"x":380.1165298457919,"y":266.3636997501379,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":0,"bodyB_ID":19,"ID":20},{"jointType":2,"x":409.6811950936514,"y":238.2068757045571,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":0,"bodyB_ID":19,"ID":21},{"jointType":2,"x":442.06154274606916,"y":233.98335209772014,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":0,"bodyB_ID":19,"ID":22},{"x":15.767801639873586,"y":9.01957411189915,"rotation":0,"ID":23,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.2947667517271704,"y":-1.4503697385978755},{"x":0.9517593127907169,"y":-1.2391935582560212},{"x":1.4210397135503925,"y":-0.6291290372684424},{"x":1.491431773664349,"y":-0.11292059643279817},{"x":1.2802555933224937,"y":0.4971439245547824},{"x":1.0925434330186228,"y":0.8725682451625225},{"x":0.764047152486846,"y":1.2010645256942967},{"x":0.15398263149926805,"y":1.2949206058462313},{"x":-0.3622258093363797,"y":1.2010645256942967},{"x":-0.7845781700200867,"y":1.0602804054663935},{"x":-1.1834665106658129,"y":0.7083201048966368},{"x":-1.3477146509316995,"y":0.21557568409897598},{"x":-1.418106711045649,"y":-0.20677667658473275},{"x":-1.2538585707797623,"y":-0.722985117420377},{"x":-0.8549702301340361,"y":-1.2391935582560212},{"x":-0.24490570914645815,"y":-1.4503697385978755}],"density":1,"group":"","refName":"","collision":0},{"jointType":0,"x":474.4418903984865,"y":267.0676203512772,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":0,"bodyB_ID":23,"ID":24},{"jointType":2,"x":409.6811950936511,"y":236.0951139011388,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":0,"bodyB_ID":23,"ID":25},{"jointType":2,"x":441.3576221449296,"y":234.68727269885972,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":0,"bodyB_ID":23,"ID":26}]}
	//P*N WORLD
	//'{"objects":[{"x":14.251087384618318,"y":7.660068790898384,"rotation":0,"ID":0,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.8039477185614405,"y":-0.6328950124845383},{"x":0.7355266361306807,"y":0.6328950124845374},{"x":-0.7697371773460588,"y":0.5986844712691575},{"x":-0.7697371773460588,"y":-0.5986844712691575}],"density":1,"group":"","refName":"","collision":0},{"x":14.268192655226011,"y":6.667963095652352,"rotation":0,"ID":1,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.8039477185614405,"y":-0.6328950124845383},{"x":0.7355266361306807,"y":0.6328950124845374},{"x":-0.7697371773460588,"y":0.5986844712691575},{"x":-0.7697371773460588,"y":-0.5986844712691575}],"density":1,"group":"","refName":"","collision":0},{"jointType":2,"x":447.3550256666383,"y":209.8022716073756,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":1,"bodyB_ID":0,"ID":2},{"x":14.298126878789466,"y":5.658752129798629,"rotation":0,"ID":3,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.8039477185614405,"y":-0.6328950124845383},{"x":0.7355266361306807,"y":0.6328950124845374},{"x":-0.7697371773460588,"y":0.5986844712691575},{"x":-0.7697371773460588,"y":-0.5986844712691575}],"density":1,"group":"","refName":"","collision":0},{"x":14.31523214939716,"y":4.6666464345525975,"rotation":0,"ID":4,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.8039477185614405,"y":-0.6328950124845383},{"x":0.7355266361306807,"y":0.6328950124845374},{"x":-0.7697371773460588,"y":0.5986844712691575},{"x":-0.7697371773460588,"y":-0.5986844712691575}],"density":1,"group":"","refName":"","collision":0},{"jointType":2,"x":410.47011410737883,"y":154.36782034703788,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":4,"bodyB_ID":3,"ID":5},{"jointType":2,"x":449.4701310929125,"y":155.3941365834993,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":4,"bodyB_ID":3,"ID":6},{"jointType":2,"x":409.0589292822442,"y":183.61783308618797,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":3,"bodyB_ID":1,"ID":7},{"jointType":2,"x":448.05894626777786,"y":185.1573074408801,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":3,"bodyB_ID":1,"ID":8},{"x":14.34516637296061,"y":3.669409158124259,"rotation":0,"ID":9,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.8039477185614405,"y":-0.6328950124845383},{"x":0.7355266361306807,"y":0.6328950124845374},{"x":-0.7697371773460588,"y":0.5986844712691575},{"x":-0.7697371773460588,"y":-0.5986844712691575}],"density":1,"group":"","refName":"","collision":0},{"x":14.362271643568304,"y":2.6773034628782253,"rotation":0,"ID":10,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.8039477185614405,"y":-0.6328950124845383},{"x":0.7355266361306807,"y":0.6328950124845374},{"x":-0.7697371773460588,"y":0.5986844712691575},{"x":-0.7697371773460588,"y":-0.5986844712691575}],"density":1,"group":"","refName":"","collision":0},{"jointType":2,"x":411.8812989325131,"y":94.68753119680662,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":10,"bodyB_ID":9,"ID":11},{"jointType":2,"x":450.88131591804677,"y":95.71384743326806,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":10,"bodyB_ID":9,"ID":12},{"jointType":2,"x":411.11156175516703,"y":124.60464948965675,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":4,"bodyB_ID":9,"ID":13},{"jointType":2,"x":448.57210438600856,"y":124.60464948965675,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":4,"bodyB_ID":9,"ID":14},{"x":14.279139924130396,"y":1.310339972752702,"rotation":0,"ID":15,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-1.0923804884350243,"y":0.9515963682071219},{"x":-1.0454524483590575,"y":0.34153184721954244},{"x":-0.8812043080931709,"y":-0.12774855354013415},{"x":-0.623100087675347,"y":-0.5970289542998108},{"x":-0.24767576706760686,"y":-0.7378130745277138},{"x":0.4562448340719065,"y":-0.6908850344517461},{"x":0.9255252348315839,"y":-0.4093167939959402},{"x":1.2540215153633572,"y":0.3180678271815587},{"x":1.2540215153633572,"y":0.9515963682071219}],"density":1,"group":"","refName":"","collision":0},{"jointType":2,"x":413.200798099349,"y":62.930646020818116,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":15,"bodyB_ID":10,"ID":16},{"jointType":2,"x":446.98898695404574,"y":63.63456662195763,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":15,"bodyB_ID":10,"ID":17},{"x":12.633888463550377,"y":8.968246568066073,"rotation":0,"ID":18,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.2947667517271704,"y":-1.4503697385978755},{"x":0.9517593127907169,"y":-1.2391935582560212},{"x":1.4210397135503925,"y":-0.6291290372684424},{"x":1.491431773664349,"y":-0.11292059643279817},{"x":1.2802555933224937,"y":0.4971439245547824},{"x":1.0925434330186228,"y":0.8725682451625225},{"x":0.764047152486846,"y":1.2010645256942967},{"x":0.15398263149926805,"y":1.2949206058462313},{"x":-0.3622258093363797,"y":1.2010645256942967},{"x":-0.7845781700200867,"y":1.0602804054663935},{"x":-1.1834665106658129,"y":0.7083201048966368},{"x":-1.3477146509316995,"y":0.21557568409897598},{"x":-1.418106711045649,"y":-0.20677667658473275},{"x":-1.2538585707797623,"y":-0.722985117420377},{"x":-0.8549702301340361,"y":-1.2391935582560212},{"x":-0.24490570914645815,"y":-1.4503697385978755}],"density":1,"group":"","refName":"","collision":0},{"jointType":0,"x":380.1165298457919,"y":266.3636997501379,"collideConnected":false,"enableMotor":false,"maxMotorTorque":561.5728395912048,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":0,"bodyB_ID":18,"ID":19},{"x":15.767801639873586,"y":9.01957411189915,"rotation":0,"ID":20,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0.2947667517271704,"y":-1.4503697385978755},{"x":0.9517593127907169,"y":-1.2391935582560212},{"x":1.4210397135503925,"y":-0.6291290372684424},{"x":1.491431773664349,"y":-0.11292059643279817},{"x":1.2802555933224937,"y":0.4971439245547824},{"x":1.0925434330186228,"y":0.8725682451625225},{"x":0.764047152486846,"y":1.2010645256942967},{"x":0.15398263149926805,"y":1.2949206058462313},{"x":-0.3622258093363797,"y":1.2010645256942967},{"x":-0.7845781700200867,"y":1.0602804054663935},{"x":-1.1834665106658129,"y":0.7083201048966368},{"x":-1.3477146509316995,"y":0.21557568409897598},{"x":-1.418106711045649,"y":-0.20677667658473275},{"x":-1.2538585707797623,"y":-0.722985117420377},{"x":-0.8549702301340361,"y":-1.2391935582560212},{"x":-0.24490570914645815,"y":-1.4503697385978755}],"density":25.185070278062028,"group":"","refName":"","collision":0},{"jointType":0,"x":474.4418903984865,"y":267.0676203512772,"collideConnected":false,"enableMotor":true,"maxMotorTorque":480.9683055861671,"motorSpeed":20,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":0,"bodyB_ID":20,"ID":21},{"x":13.988917068754317,"y":13.28981833415711,"rotation":0,"ID":22,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":true,"awake":true,"vertices":[{"x":6.419435447063096,"y":-1.3232262481411396},{"x":6.777064162776918,"y":1.072886147141464},{"x":-6.669775548062771,"y":1.215937633426993},{"x":-6.526724061777243,"y":-0.9655975324273189}],"density":1,"group":"","refName":"","collision":0},{"x":27.264387275567046,"y":22.348888180032553,"rotation":0,"ID":23,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":true,"awake":true,"vertices":[{"x":6.419435447063096,"y":-1.3232262481411396},{"x":6.777064162776918,"y":1.072886147141464},{"x":-6.669775548062771,"y":1.215937633426993},{"x":-6.526724061777243,"y":-0.9655975324273189}],"density":1,"group":"","refName":"","collision":0},{"x":44.24760614942456,"y":31.265172769418907,"rotation":0,"ID":24,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":true,"awake":true,"vertices":[{"x":6.419435447063096,"y":-1.3232262481411396},{"x":6.777064162776918,"y":1.072886147141464},{"x":-6.669775548062771,"y":1.215937633426993},{"x":-6.526724061777243,"y":-0.9655975324273189}],"density":1,"group":"","refName":"","collision":0},{"jointType":2,"x":408.42108185325833,"y":213.1102143681672,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":false,"upperAngle":0,"lowerAngle":0,"dampingRatio":0.5,"frequencyHz":10,"type":2,"group":"","refName":"","bodyA_ID":1,"bodyB_ID":0,"ID":25}]}';



	this.copiedJSON = '';
	this.copyCenterPoint = { x: 0, y: 0 };

	this.selectionBoxColor = "#5294AE";
	this.mouseDown = false;
	this.shiftDown = false;
	this.spaceDown = false;
	this.editing = true;

	this.editorObjectLookup = {}
	this.objectLookup = {};

	this.undoList = [];
	this.undoIndex = 0;
	this.undoing = false;
	this.undoTransformXY = {};
	this.undoTransformRot = 0;
	this.undoTransformDepthHigh = false;


	this.load = function (loader) {
		loader.add("assets/images/iconSet.json");
	}

	this.init = function (_container, _world, _PTM) {

		this.container = _container;
		this.world = _world;
		this.initialPTM = _PTM;
		this.PTM = _PTM;
		//Texture Draw
		this.textures = new PIXI.Graphics();
		this.container.addChild(this.textures);


		//Editor Draw
		this.debugGraphics = new PIXI.Graphics();
		this.container.parent.addChild(this.debugGraphics);

		this.editorMode = this.editorMode_SELECTION;

		this.mousePosPixel = new b2Vec2(0, 0);
		this.mousePosWorld = new b2Vec2(0, 0);

		this.canvas = document.getElementById("canvas");

		this.initGui();

	}

	this.initGui = function () {

		this.initGuiAssetSelection();

		this.canvas.focus();
		this.parseAndBuildJSON(this.worldJSON);
		this.parseAndBuildJSON(this.vehicleJSON);
		this.parseAndBuildJSON(this.characterJSON);



		/*var $container = $("#symanticui");

		$container.append('<div id="button" class="ui animated button" tabindex="0"> <div class="visible content">Next</div><div class="hidden content"><i class="right arrow icon"></i></div></div>');


		var $button = $("#button");
		console.log($button);

		$button.click(function() {

		    console.log("erik is een koning en eric ook");
		});*/





	}
	this.initGuiAssetSelection = function () {

		this.removeGuiAssetSelection();

		if (this.assetLists.__keys == undefined) this.assetLists.__keys = Object.keys(this.assetLists);

		if (this.assetLists.__keys.length > 0) {

			this.assetGUI = new dat.GUI({ autoPlace: false, width: 300 });
			this.customGUIContainer.appendChild(this.assetGUI.domElement);
			this.assetGUI.addFolder('Asset Selection');

			if (this.assetSelectedGroup == "") this.assetSelectedGroup = this.assetLists.__keys[0];
			this.assetSelectedTexture = this.assetLists[this.assetSelectedGroup][0];


			folder = this.assetGUI.addFolder('Textures');
			var self = this;
			folder.add(self, "assetSelectedGroup", this.assetLists.__keys).onChange(function (value) { self.initGuiAssetSelection(); });
			folder.add(self, "assetSelectedTexture", this.assetLists[this.assetSelectedGroup]).onChange(function (value) { }).name("Select");
			this.spawnTexture = function () { };
			var but = folder.add(self, "spawnTexture").name("Spawn -->");
			this.spawnTexture = function () {
				if (self.assetSelectedTexture != undefined && this.assetSelectedTexture != "") {
					var data = new self.textureObject;
					var rect = this.domElement.getBoundingClientRect();
					data.x = (rect.right + 50) / self.container.scale.x - self.container.x / self.container.scale.x;
					data.y = (rect.top + 20) / self.container.scale.y - self.container.y / self.container.scale.x;
					data.textureName = self.assetSelectedTexture;

					self.buildTextureFromObj(data);

				}
			}.bind(but);
			folder.open();
		}

	}
	this.removeGuiAssetSelection = function () {
		if (this.assetGUI != undefined) {
			this.customGUIContainer.removeChild(this.assetGUI.domElement);
			this.assetGUI = undefined;
		}
	}

	this.updateSelection = function () {
		//Joints
		var i;

		//reset
		if (this.editorGUI != undefined) {
			this.customGUIContainer.removeChild(this.editorGUI.domElement);
			this.editorGUI = null;
		}

		if (this.selectedPhysicsBodies.length > 0 && this.selectedTextures.length == 0) {
			// only holding physics bodies

			this.editorGUI = new dat.GUI({ autoPlace: false, width: 200 });
			this.customGUIContainer.appendChild(this.editorGUI.domElement);
			if (this.selectedPhysicsBodies.length > 1) this.editorGUI.addFolder('multiple bodies');
			else this.editorGUI.addFolder('body');

			this.editorGUI.editData = new this.bodyObject;

			var dataJoint;
			dataJoint = this.selectedPhysicsBodies[0].myGraphic.data;

			this.editorGUI.editData.x = dataJoint.x * this.PTM;
			this.editorGUI.editData.y = dataJoint.y * this.PTM;
			this.editorGUI.editData.rotation = dataJoint.rotation;
			this.editorGUI.editData.colorFill = dataJoint.colorFill;
			this.editorGUI.editData.colorLine = dataJoint.colorLine;
			this.editorGUI.editData.fixed = dataJoint.fixed;
			this.editorGUI.editData.awake = dataJoint.awake;
			this.editorGUI.editData.density = dataJoint.density;
			if (this.isSelectionPropertyTheSame("group")) {
				this.editorGUI.editData.group = dataJoint.group;
			} else {
				this.editorGUI.editData.group = "-";
			}
			this.editorGUI.editData.refName = dataJoint.refName;
			this.editorGUI.editData.collision = dataJoint.collision;

			var self = this;
			var controller;
			controller = this.editorGUI.add(self.editorGUI.editData, "x").onChange(function (value) { this.humanUpdate = true; this.targetValue = value - this.initialValue; this.initialValue = value; });
			//controller.domElement.style.pointerEvents = "none";

			this.editorGUI.add(self.editorGUI.editData, "y").onChange(function (value) { this.humanUpdate = true; this.targetValue = value - this.initialValue; this.initialValue = value; });
			this.editorGUI.add(self.editorGUI.editData, "rotation").onChange(function (value) { this.humanUpdate = true; this.targetValue = value });
			this.editorGUI.add(self.editorGUI.editData, "group").onChange(function (value) { this.humanUpdate = true; this.targetValue = value });
			if (this.selectedPhysicsBodies.length == 1) {
				this.editorGUI.add(self.editorGUI.editData, "refName").onChange(function (value) { this.humanUpdate = true; this.targetValue = value; });
			}


			controller = this.editorGUI.addColor(self.editorGUI.editData, "colorFill");
			controller.onChange(function (value) { this.humanUpdate = true; this.targetValue = value; }.bind(controller));
			controller = this.editorGUI.addColor(self.editorGUI.editData, "colorLine");
			controller.onChange(function (value) { this.humanUpdate = true; this.targetValue = value; }.bind(controller));

			this.editorGUI.add(self.editorGUI.editData, "fixed").onChange(function (value) { this.humanUpdate = true; this.targetValue = value });
			this.editorGUI.add(self.editorGUI.editData, "awake").onChange(function (value) { this.humanUpdate = true; this.targetValue = value });
			controller = this.editorGUI.add(self.editorGUI.editData, "density", 1, 1000);
			controller.onChange(function (value) { this.humanUpdate = true; this.targetValue = value }.bind(controller));
			controller = this.editorGUI.add(self.editorGUI.editData, "collision", 0, 7).step(1);
			controller.onChange(function (value) { this.humanUpdate = true; this.targetValue = value }.bind(controller));



		} else if (this.selectedTextures.length > 0 && this.selectedPhysicsBodies.length == 0) {

			var _selectedTextures = [];
			var _selectedPinJoints = [];
			var _selectedSlideJoints = [];
			var _selectedDistanceJoints = [];
			var _selectedTextureJoints = [];
			var _texture;
			for (i = 0; i < this.selectedTextures.length; i++) {
				_texture = this.selectedTextures[i];

				if (_texture.data && _texture.data.type == this.object_JOINT) {
					if (_texture.data.jointType == this.jointObject_TYPE_PIN) {
						_selectedPinJoints.push(_texture);
					} else if (_texture.data.jointType == this.jointObject_TYPE_SLIDE) {
						_selectedSlideJoints.push(_texture);
					} else if (_texture.data.jointType == this.jointObject_TYPE_DISTANCE) {
						_selectedDistanceJoints.push(_texture);
					}
				} else {
					_selectedTextures.push(_texture);
				}
			}

			var editingMultipleObjects = (_selectedTextures.length > 0 ? 1 : 0) + (_selectedPinJoints.length > 0 ? 1 : 0) + (_selectedSlideJoints.length > 0 ? 1 : 0) + (_selectedDistanceJoints.length > 0 ? 1 : 0) + (_selectedTextureJoints.length > 0 ? 1 : 0);

			if (editingMultipleObjects > 1) {
				// editing multipleCrap


			} else if (_selectedTextures.length > 0) {
				// editing just textures


			} else if (_selectedPinJoints.length > 0 || _selectedSlideJoints.length > 0 || _selectedDistanceJoints.length > 0) {
				// editing just pin joints

				this.editorGUI = new dat.GUI({ autoPlace: false, width: 200 });
				this.customGUIContainer.appendChild(this.editorGUI.domElement);
				if (this.selectedTextures.length > 1) this.editorGUI.addFolder('multiple joints');
				else this.editorGUI.addFolder('joint');

				this.editorGUI.editData = new this.jointObject;
				var jointTypes = ["Pin", "Slide", "Distance"];

				var dataJoint;
				if (_selectedPinJoints.length > 0) dataJoint = _selectedPinJoints[0].data;
				else if (_selectedSlideJoints.length > 0) dataJoint = _selectedSlideJoints[0].data;
				else if (_selectedDistanceJoints.length > 0) dataJoint = _selectedDistanceJoints[0].data;

				this.editorGUI.editData.typeName = jointTypes[dataJoint.jointType];

				this.editorGUI.editData.collideConnected = dataJoint.collideConnected;
				this.editorGUI.editData.x = dataJoint.x;
				this.editorGUI.editData.y = dataJoint.y;
				if (this.isSelectionPropertyTheSame("group")) {
					this.editorGUI.editData.group = dataJoint.group;
				} else {
					this.editorGUI.editData.group = "-";
				}
				this.editorGUI.editData.refName = dataJoint.refName;
				this.editorGUI.editData.enableMotor = dataJoint.enableMotor;
				this.editorGUI.editData.maxMotorTorque = dataJoint.maxMotorTorque;
				this.editorGUI.editData.motorSpeed = dataJoint.motorSpeed;
				this.editorGUI.editData.enableLimit = dataJoint.enableLimit;
				this.editorGUI.editData.upperAngle = dataJoint.upperAngle;
				this.editorGUI.editData.lowerAngle = dataJoint.lowerAngle;
				this.editorGUI.editData.frequencyHz = dataJoint.frequencyHz;
				this.editorGUI.editData.dampingRatio = dataJoint.dampingRatio;

				var self = this;
				this.editorGUI.add(self.editorGUI.editData, "typeName", jointTypes).onChange(function (value) { this.humanUpdate = true; this.targetValue = value });
				this.editorGUI.add(self.editorGUI.editData, "collideConnected").onChange(function (value) { this.humanUpdate = true; this.targetValue = value });
				this.editorGUI.add(self.editorGUI.editData, "x").onChange(function (value) { this.humanUpdate = true; this.targetValue = value - this.initialValue; this.initialValue = value; });
				this.editorGUI.add(self.editorGUI.editData, "y").onChange(function (value) { this.humanUpdate = true; this.targetValue = value - this.initialValue; this.initialValue = value; });
				this.editorGUI.add(self.editorGUI.editData, "group").onChange(function (value) { this.humanUpdate = true; this.targetValue = value; });
				if (this.selectedTextures.length == 1) {
					this.editorGUI.add(self.editorGUI.editData, "refName").onChange(function (value) { this.humanUpdate = true; this.targetValue = value; });
				}

				var folder;
				var controller;

				if (dataJoint.jointType == this.jointObject_TYPE_PIN || dataJoint.jointType == this.jointObject_TYPE_SLIDE) {

					folder = this.editorGUI.addFolder('enable motor');
					folder.add(self.editorGUI.editData, "enableMotor").onChange(function (value) { this.humanUpdate = true; this.targetValue = value; });

					controller = folder.add(self.editorGUI.editData, "maxMotorTorque", 0, 1000);
					controller.onChange(function (value) { this.humanUpdate = true; this.targetValue = value }.bind(controller));

					controller = folder.add(self.editorGUI.editData, "motorSpeed", -20, 20);
					controller.onChange(function (value) { this.humanUpdate = true; this.targetValue = value }.bind(controller));

					folder = this.editorGUI.addFolder('enable limits');
					folder.add(self.editorGUI.editData, "enableLimit").onChange(function (value) { this.humanUpdate = true; this.targetValue = value; });

					controller = folder.add(self.editorGUI.editData, "upperAngle", 0, 180);
					controller.onChange(function (value) { this.humanUpdate = true; this.targetValue = value; }.bind(controller));

					controller = folder.add(self.editorGUI.editData, "lowerAngle", -180, 0);
					controller.onChange(function (value) { this.humanUpdate = true; this.targetValue = value }.bind(controller));

				} else if (dataJoint.jointType == this.jointObject_TYPE_DISTANCE) {
					folder = this.editorGUI.addFolder('spring');

					controller = folder.add(self.editorGUI.editData, "frequencyHz", 0, 180);
					controller.onChange(function (value) { this.humanUpdate = true; this.targetValue = value; }.bind(controller));

					controller = folder.add(self.editorGUI.editData, "dampingRatio", 0.0, 1.0).step(0.25);
					controller.onChange(function (value) { this.humanUpdate = true; this.targetValue = value }.bind(controller));
				}

			}

		} else if (this.selectedTextures.length > 0 && this.selectedPhysicsBodies.length > 0) {
			//holding both bodies and textures
			this.editorGUI = new dat.GUI({ autoPlace: false, width: 200 });
			this.customGUIContainer.appendChild(this.editorGUI.domElement);
			this.editorGUI.addFolder('multiple objects');

			this.editorGUI.editData = new this.multiObject;

			var dataJoint;
			dataJoint = this.selectedPhysicsBodies[0].myGraphic.data;

			this.editorGUI.editData.x = dataJoint.x * this.PTM;
			this.editorGUI.editData.y = dataJoint.y * this.PTM;
			this.editorGUI.editData.rotation = dataJoint.rotation;
			if (this.isSelectionPropertyTheSame("group")) {
				this.editorGUI.editData.group = dataJoint.group;
			} else {
				this.editorGUI.editData.group = "-";
			}

			var self = this;
			this.editorGUI.add(self.editorGUI.editData, "x").onChange(function (value) { this.humanUpdate = true; this.targetValue = value - this.initialValue; this.initialValue = value; });
			this.editorGUI.add(self.editorGUI.editData, "y").onChange(function (value) { this.humanUpdate = true; this.targetValue = value - this.initialValue; this.initialValue = value; });
			this.editorGUI.add(self.editorGUI.editData, "rotation").onChange(function (value) { this.humanUpdate = true; this.targetValue = value });
			this.editorGUI.add(self.editorGUI.editData, "group").onChange(function (value) { this.humanUpdate = true; this.targetValue = value });


		} else {

			//holding nothing

			return;
		}
		if (this.assetGUI != undefined) {
			this.customGUIContainer.removeChild(this.assetGUI.domElement);
			this.assetGUI = undefined;
		}
	}

	this.isSelectionPropertyTheSame = function (property) {
		var data = null;
		var compareValue = null;
		var i;
		if (this.selectedPhysicsBodies.length > 0) {
			for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
				data = this.selectedPhysicsBodies[i].myGraphic.data;
				if (compareValue == null) compareValue = data[property];
				else if (data[property] != compareValue) {
					return false;
				}
			}
		}
		if (this.selectedTextures.length > 0) {
			for (i = 0; i < this.selectedTextures.length; i++) {
				data = this.selectedTextures[i].data;
				if (compareValue == null) compareValue = data[property];
				else if (data[property] != compareValue) {
					return false;
				}

			}
		}
		return true;
	}


	this.deleteSelection = function () {
		//Destroy selected bodies
		var i;

		for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
			var b = this.selectedPhysicsBodies[i];

			b.myGraphic.parent.removeChild(b.myGraphic);
			b.myGraphic.destroy({ children: true, texture: false, baseTexture: false });
			b.myGraphic = null;


			if (b.myJoints != undefined) {

				var j;
				var myJoint;
				var k;

				for (j = 0; j < b.myJoints.length; j++) {

					myJoint = b.myJoints[j];
					var alreadySelected = false;

					for (k = 0; k < this.selectedTextures.length; k++) {
						if (this.selectedTextures[k] == myJoint) {
							alreadySelected = true;
						}
					}
					if (!alreadySelected) this.selectedTextures.push(myJoint);
				}
			}

			if (b.myTexture) {
				var sprite = b.myTexture;
				sprite.parent.removeChild(sprite);
				sprite.destroy({ children: true, texture: false, baseTexture: false });
			}


			this.world.DestroyBody(b);
		}

		//Destroy all selected graphics

		for (i = 0; i < this.selectedTextures.length; i++) {
			var sprite = this.selectedTextures[i];
			if (sprite.data && sprite.data.type == this.object_JOINT) {



				var j;
				var myJoint;
				if (sprite.bodies[0] != undefined) {
					console.log(sprite.bodies[0].myJoints);
					for (j = 0; j < sprite.bodies[0].myJoints.length; j++) {
						console.log(j + " currentIndex");
						console.log(sprite.bodies[0].myJoints);
						myJoint = sprite.bodies[0].myJoints[j];
						if (myJoint == sprite) {
							sprite.bodies[0].myJoints.splice(j, 1);
							j--;
						}
					}
					if (sprite.bodies[0].myJoints.length == 0) sprite.bodies[0].myJoints = undefined;
				}
				if (sprite.bodies.length > 1 && sprite.bodies[1] != undefined) {
					for (j = 0; j < sprite.bodies[1].myJoints.length; j++) {
						myJoint = sprite.bodies[1].myJoints[j];
						if (myJoint == sprite) {
							sprite.bodies[1].myJoints.splice(j, 1);
							j--;
						}
					}
					if (sprite.bodies[1].myJoints.length == 0) sprite.bodies[1].myJoints = undefined;
				}


				for (j = 0; j < this.editorIcons.length; j++) {
					if (this.editorIcons[j] == sprite) {
						this.editorIcons.splice(j, 1);
					}
				}
			}


			sprite.parent.removeChild(sprite);
			sprite.destroy({ children: true, texture: false, baseTexture: false });
		}
		this.selectedPhysicsBodies = [];
		this.selectedTextures = [];
		this.updateSelection();

	}

	this.copySelection = function () {

		var i;
		var body;
		var copyArray = [];
		var cloneObject;

		if (this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0) return;


		// sort all objects based on childIndex
		for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
			body = this.selectedPhysicsBodies[i];
			this.updateObject(body.myGraphic, body.myGraphic.data);
			cloneObject = JSON.parse(JSON.stringify(body.myGraphic.data))
			copyArray.push({ ID: cloneObject.ID, data: cloneObject })

			if (body.myTexture) {
				this.updateObject(body.myTexture, body.myTexture.data);
				cloneObject = JSON.parse(JSON.stringify(body.myTexture.data))
				copyArray.push({ ID: cloneObject.ID, data: cloneObject });
			}

		}
		var sprite;
		for (i = 0; i < this.selectedTextures.length; i++) {
			sprite = this.selectedTextures[i];
			console.log(sprite.data);
			this.updateObject(sprite, sprite.data);
			cloneObject = JSON.parse(JSON.stringify(sprite.data))
			copyArray.push({ ID: cloneObject.ID, data: cloneObject })
		}

		copyArray.sort(function (a, b) { return a.ID - b.ID; });


		// Fix copied joints (make sure no anchor body is null)
		var data;
		var j;
		for (i = 0; i < copyArray.length; i++) {
			data = copyArray[i].data;
			if (data.type == this.object_JOINT) {
				//searching object A
				var foundBodyA = false;
				for (j = 0; j < copyArray.length; j++) {

					if (copyArray[j].ID == data.bodyA_ID) {
						foundBodyA = true;
						data.bodyA_ID = j;
						break;
					}
				}
				var foundBodyB = false;
				if (data.bodyB_ID != undefined) {
					for (j = 0; j < copyArray.length; j++) {

						if (copyArray[j].ID == data.bodyB_ID) {
							foundBodyB = true;
							data.bodyB_ID = j;
							break;
						}
					}

				} else {
					foundBodyB = true;
				}

				if (!foundBodyA || !foundBodyB) {
					copyArray.splice(i, 1);
					i--;
				}
			} else if (data.type == this.object_TEXTURE) {
				for (j = 0; j < copyArray.length; j++) {
					if (copyArray[j].ID == data.bodyID) {
						data.bodyID = j;
						break;
					}
				}
			}
		}
		var copyJSON = '{"objects":[';
		this.copyCenterPoint = { x: 0, y: 0 };

		for (i = 0; i < copyArray.length; i++) {
			if (i != 0) copyJSON += ',';
			data = copyArray[i].data;
			data.ID = i;
			copyJSON += JSON.stringify(data);
			if (data.type == this.object_BODY) {
				this.copyCenterPoint.x += data.x * this.PTM;
				this.copyCenterPoint.y += data.y * this.PTM;

			} else {
				this.copyCenterPoint.x += data.x;
				this.copyCenterPoint.y += data.y;
			}

		}
		this.copyCenterPoint.x = this.copyCenterPoint.x / copyArray.length;
		this.copyCenterPoint.y = this.copyCenterPoint.y / copyArray.length;
		copyJSON += ']}';


		if (copyArray.length == 0) this.copiedJSON = null;
		else this.copiedJSON = copyJSON;
		console.log("*******************COPY JSON*********************");
		console.log(copyJSON);
		console.log("*************************************************");
	}
	this.cutSelection = function () {
		this.copySelection();
		if (this.copiedJSON != null) this.deleteSelection();
	}

	this.pasteSelection = function () {
		if (this.copiedJSON != null) {
			var startChildIndex = this.textures.children.length;

			this.parseAndBuildJSON(this.copiedJSON);

			this.selectedPhysicsBodies = [];
			this.selectedTextures = [];

			var i;
			var sprite;
			var movX = this.copyCenterPoint.x - (this.mousePosWorld.x * this.PTM);
			var movY = this.copyCenterPoint.y - (this.mousePosWorld.y * this.PTM);

			if (this.shiftDown) {
				movX = 0;
				movY = 0;
			}


			for (i = startChildIndex; i < this.textures.children.length; i++) {
				sprite = this.textures.getChildAt(i);
				if (sprite.myBody != undefined && sprite.data.type != this.object_TEXTURE) {
					var pos = sprite.myBody.GetPosition();
					pos.x -= movX / this.PTM;
					pos.y -= movY / this.PTM;
					sprite.myBody.SetPosition(pos);
					this.selectedPhysicsBodies.push(sprite.myBody);
				}
				else {
					sprite.x -= movX;
					sprite.y -= movY;

					if (!sprite.originalGraphic && sprite.myBody == null) {

						this.selectedTextures.push(sprite);
					}
				}
			}
		}
	}
	this.doEditor = function () {
		this.debugGraphics.clear();

		if (this.editorMode == this.editorMode_SELECTION) {
			this.doSelection();
		} else if (this.editorMode == this.editorMode_DRAWVERTICES) {
			this.doVerticesDrawing();
		} else if (this.editorMode == this.editorMode_DRAWCIRCLES) {
			this.doCircleDrawing();
		}
	}
	this.run = function () {
		//update textures
		if (this.editing) {
			this.doEditor();
		}


		var body = this.world.GetBodyList();
		var i = 0
		while (body) {

			if (body.myTexture) {

				var angle = body.GetAngle() - body.myTexture.data.texturePositionOffsetAngle;
				body.myTexture.x = body.GetPosition().x * this.PTM + body.myTexture.data.texturePositionOffsetLength * Math.cos(angle);
				body.myTexture.y = body.GetPosition().y * this.PTM + body.myTexture.data.texturePositionOffsetLength * Math.sin(angle);
				body.myGraphic.x = body.GetPosition().x * this.PTM;
				body.myGraphic.y = body.GetPosition().y * this.PTM;

				body.myTexture.rotation = body.GetAngle() - body.myTexture.data.textureAngleOffset;

			} else if (body.myGraphic) {
				body.myGraphic.x = body.GetPosition().x * this.PTM;
				body.myGraphic.y = body.GetPosition().y * this.PTM;
				body.myGraphic.rotation = body.GetAngle();
			}
			i++;
			body = body.GetNext();
		}
	}



	var self = this;
	this.bodyObject = function () {
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.ID = 0;
		this.type = self.object_BODY;
		this.colorFill = "#999999";
		this.colorLine = "#000";
		this.fixed = false;
		this.awake = true;
		this.vertices = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
		this.density = 1;
		this.group = "";
		this.refName = "";
		this.collision = 0;
		this.radius;
	}
	this.textureObject = function () {
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.ID = 0;
		this.type = self.object_TEXTURE;
		this.textureName = null;
		this.bodyID = null;
		this.texturePositionOffsetLength = null;
		this.texturePositionOffsetAngle = null;
		this.textureAngleOffset = null;
		this.group = "";
		this.refName = "";
	}
	this.jointObject = function () {
		this.bodyA_ID;
		this.bodyB_ID;
		this.jointType = 0;
		this.x = null;
		this.y = null;
		this.rotation = 0;
		this.collideConnected = false;
		this.enableMotor = false;
		this.maxMotorTorque = 1.0;
		this.motorSpeed = 10.0;
		this.enableLimit = false;
		this.upperAngle = 0.0;
		this.lowerAngle = 0.0;
		this.dampingRatio = 0.0;
		this.frequencyHz = 0.0;
		this.type = self.object_JOINT;
		this.group = "";
		this.refName = "";
	}
	this.multiObject = function () {
		this.x = 0;
		this.y = 0;
		this.rotation = 0;
		this.group = "";
	}
	this.lookupObject = function () {
		this._bodies = [];
		this._textures = [];
		this._joints = [];
	}

	this.undoObjectMovement = function () {
		this.type = self.object_UNDO_MOVEMENT;
		this.transformType;
		this.transform;
		this.objects = [];
	}

	this.startVerticesDrawing = function () {
		this.editorMode = this.editorMode_DRAWVERTICES;
	}
	this.startCircleDrawing = function () {
		this.editorMode = this.editorMode_DRAWCIRCLES;
	}
	this.startSelectionMode = function () {
		this.editorMode = this.editorMode_SELECTION;
	}


	this.onMouseDown = function (evt) {

		if (this.editing) {
			if (this.editorMode == this.editorMode_SELECTION) {

				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.x, this.mousePosWorld.y);
				this.storeUndoMovement();
				this.undoTransformXY = { x: 0.0, y: 0.0 };
				this.undoTransformRot = 0.0;
				if (!this.spaceDown) {

					var aabb = new b2AABB;
					aabb.lowerBound.Set(this.mousePosWorld.x, this.mousePosWorld.y);
					aabb.upperBound.Set(this.mousePosWorld.x, this.mousePosWorld.y);


					if (!this.selectedBoundingBox.Contains(aabb) || this.shiftDown) {
						//reset selectionie
						var oldSelectedPhysicsBodies = [];
						var oldSelectedTextures = [];

						if (this.shiftDown) {
							oldSelectedPhysicsBodies = this.selectedPhysicsBodies;
							oldSelectedTextures = this.selectedTextures;
						}

						var i;
						var body;

						this.selectedPhysicsBodies = this.queryWorldForBodies(this.startSelectionPoint, this.mousePosWorld);
						if (this.selectedPhysicsBodies.length > 0) {

							var fixture;
							var pointInsideBody = false;
							for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
								body = this.selectedPhysicsBodies[i];
								fixture = body.GetFixtureList();

								while (fixture != null) {
									if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), this.mousePosWorld)) {
										pointInsideBody = true;
									}

									fixture = fixture.GetNext();
								}

								if (pointInsideBody) {
									this.selectedPhysicsBodies = [body];
									break;
								}

							}
							if (!pointInsideBody) this.selectedPhysicsBodies = [];

						}
						this.selectedTextures = this.queryWorldForGraphics(this.startSelectionPoint, this.mousePosWorld, true, 1);


						//limit selection to highest indexed child

						var highestObject;
						for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
							body = this.selectedPhysicsBodies[i];
							if (highestObject == undefined) highestObject = body.myGraphic;
							if (body.myGraphic.parent.getChildIndex(body.myGraphic) > highestObject.parent.getChildIndex(highestObject)) {
								highestObject = body.myGraphic;
							}
						}
						var sprite;
						for (i = 0; i < this.selectedTextures.length; i++) {
							sprite = this.selectedTextures[i];
							if (highestObject == undefined) highestObject = sprite;
							if (sprite.parent.getChildIndex(sprite) > highestObject.parent.getChildIndex(highestObject)) {
								highestObject = sprite;
							}
						}
						if (highestObject) {
							if (highestObject.data.type == this.object_BODY) {
								this.selectedTextures = [];
							} else {
								this.selectedPhysicsBodies = [];
							}
						}

						//


						if (this.shiftDown) {
							//push old selection
							var i;
							for (i = 0; i < oldSelectedPhysicsBodies.length; i++) {
								if (oldSelectedPhysicsBodies[i] != this.selectedPhysicsBodies[0]) {
									this.selectedPhysicsBodies.push(oldSelectedPhysicsBodies[i]);
								}
							}
							for (i = 0; i < oldSelectedTextures.length; i++) {
								if (oldSelectedTextures[i] != this.selectedTextures[0]) {
									this.selectedTextures.push(oldSelectedTextures[i]);
								}
							}
						}


						this.updateSelection();
					}
				}

			} else if (this.editorMode == this.editorMode_DRAWVERTICES) {
				if (!this.closeDrawing) {
					if (this.correctDrawVertice && this.activeVertices.length > 1) {
						this.activeVertices[this.activeVertices.length - 1] = { x: this.correctedDrawVerticePosition.x, y: this.correctedDrawVerticePosition.y };
					} else {
						this.activeVertices.push({ x: this.mousePosWorld.x, y: this.mousePosWorld.y });
					}
				} else {

					var bodyObject = this.createBodyObjectFromVerts(this.activeVertices);
					this.buildBodyFromObj(bodyObject);
					this.activeVertices = [];
					this.editorMode = this.editorMode_SELECTION;
				}
			} else if (this.editorMode == this.editorMode_DRAWCIRCLES) {
				this.startSelectionPoint = new b2Vec2(this.mousePosWorld.x, this.mousePosWorld.y);
			}
		}
		this.updateMousePosition(evt);
		this.mouseDown = true;
	}
	this.onMouseMove = function (evt) {
		this.updateMousePosition(evt);

		if (this.oldMousePosWorld == null) this.oldMousePosWorld = this.mousePosWorld;

		if (this.editing) {
			if (this.editorMode == this.editorMode_SELECTION) {
				if (this.mouseDown) {
					var move = new b2Vec2(this.mousePosWorld.x - this.oldMousePosWorld.x, this.mousePosWorld.y - this.oldMousePosWorld.y);
					if (this.spaceDown) {
						move.Multiply(this.container.scale.x);
						this.container.x += move.x * this.PTM;
						this.container.y += move.y * this.PTM;
						this.mousePosWorld.x -= move.x / this.container.scale.x;
						this.mousePosWorld.y -= move.y / this.container.scale.y;

					} else {
						if (this.mouseTransformType == this.mouseTransformType_Movement) {
							this.applyToSelectedObjects(this.TRANSFORM_MOVE, { x: move.x * this.PTM, y: move.y * this.PTM });
						} else if (this.mouseTransformType == this.mouseTransformType_Rotation) {
							this.applyToSelectedObjects(this.TRANSFORM_ROTATE, move.x * this.PTM / 10);
						}
					}
				}
			}
		}
		this.oldMousePosWorld = this.mousePosWorld;
	}

	this.applyToSelectedObjects = function (transformType, obj) {
		if (transformType == this.TRANSFORM_DEPTH) {
			this.applyToObjects(transformType, obj, this.selectedPhysicsBodies.concat(this.selectedTextures))
		} else {
			this.applyToObjects(transformType, obj, this.selectedPhysicsBodies);
			this.applyToObjects(transformType, obj, this.selectedTextures);
		}

		if (transformType == this.TRANSFORM_MOVE) {
			this.undoTransformXY = { x: this.undoTransformXY.x + obj.x, y: this.undoTransformXY.y + obj.y };
		} else if (transformType == this.TRANSFORM_ROTATE) {
			this.undoTransformRot += obj;
		} else if (transformType == this.TRANSFORM_DEPTH) {
			this.undoTransformDepthHigh = obj;
		}
	}

	this.applyToObjects = function (transformType, obj, objects) {
		var i;
		var body;
		var sprite;

		//TODO: fix body

		if (transformType == this.TRANSFORM_MOVE || transformType == this.TRANSFORM_ROTATE) {
			for (i = 0; i < objects.length; i++) {

				if (objects[i].myGraphic != undefined) {

					body = objects[i];
					if (transformType == this.TRANSFORM_MOVE) {
						var oldPosition = body.GetPosition();
						body.SetPosition(new b2Vec2(oldPosition.x + obj.x / this.PTM, oldPosition.y + obj.y / this.PTM));
					} else if (transformType == this.TRANSFORM_ROTATE) {
						var oldAngle = body.GetAngle();
						body.SetAngle(oldAngle + obj * this.DEG2RAD);
					}
				} else {
					sprite = objects[i];
					if (transformType == this.TRANSFORM_MOVE) {
						sprite.x = sprite.x + obj.x;
						sprite.y = sprite.y + obj.y;
					} else if (transformType == this.TRANSFORM_ROTATE) {
						sprite.rotation += obj;
					}

				}

			}
		} else if (transformType == this.TRANSFORM_DEPTH) {


			console.log("changing depth" + obj);

			var tarDepthIndexes = [];
			var depthArray = [];

			for (i = 0; i < objects.length; i++) {

				if (objects[i].myTexture != undefined) {
					depthArray.push(objects[i].myTexture);
					tarDepthIndexes.push(objects[i].myGraphic.parent.getChildIndex(objects[i].myTexture));
				} else if (objects[i].myGraphic != undefined) {
					depthArray.push(objects[i].myGraphic);
					tarDepthIndexes.push(objects[i].myGraphic.parent.getChildIndex(objects[i].myGraphic));
				} else {
					depthArray.push(objects[i]);
					tarDepthIndexes.push(objects[i].parent.getChildIndex(objects[i]));
				}
			}

			depthArray.sort(function (a, b) { return a.parent.getChildIndex(a) - b.parent.getChildIndex(b); });
			//if(obj) depthArray = depthArray.reverse();

			var neighbour;
			var child;

			for (i = 0; i < depthArray.length; i++) {
				child = depthArray[i];

				if ((obj && tarDepthIndexes[i] + 1 < child.parent.children.length) || (!obj && tarDepthIndexes[i] - 1 >= 0)) {

					if (obj) neighbour = child.parent.getChildAt(tarDepthIndexes[i] + 1);
					else neighbour = child.parent.getChildAt(tarDepthIndexes[i] - 1);
					child.parent.swapChildren(child, neighbour);
					console.log("SWAPPED:");
					console.log(child);
					console.log(neighbour);
				}
			}


		}

	}
	this.TRANSFORM_MOVE = "move";
	this.TRANSFORM_ROTATE = "rotate";
	this.TRANSFORM_DEPTH = "depth";

	this.storeUndoMovement = function () {
		if (this.undoTransformRot != 0 || this.undoTransformXY.x != 0 || this.undoTransformXY.y != 0) {
			var undoObject = new this.undoObjectMovement();
			if (this.undoTransformRot != 0) {
				undoObject.transformType = this.TRANSFORM_ROTATE;
				undoObject.transform = this.undoTransformRot;
			} else {
				undoObject.transformType = this.TRANSFORM_MOVE;
				undoObject.transform = this.undoTransformXY;
			}
			undoObject.objects = this.selectedPhysicsBodies.concat(this.selectedTextures);
			this.registerUndo(undoObject);
		}
	}

	this.registerUndo = function (obj) {
		if (!this.undoing) {
			this.undoList = this.undoList.slice(0, this.undoIndex + 1);
			this.undoList.push(obj);
			this.undoIndex = this.undoList.length - 1;
			this.undoTransformXY = { x: 0.0, y: 0.0 };
			this.undoTransformRot = 0.0;

			console.log("registering undo, displaying list:");
			var i;
			for (i = 0; i < this.undoList.length; i++) {
				console.log("Index:" + i);
				console.log(this.undoList[i]);
			}

		}
	}
	this.undoMove = function (backward) {
		if ((backward && this.undoIndex >= 0) || (!backward && this.undoIndex < this.undoList.length - 1)) {
			var obj = this.undoList[this.undoIndex];
			console.log(this.undoIndex + "  " + this.undoList.length);
			if (obj.type == this.object_UNDO_MOVEMENT) {

				console.log("doing undo, on index:" + this.undoIndex);
				var i;
				for (i = 0; i < this.undoList.length; i++) {
					console.log("Index:" + i);
					console.log(this.undoList[i]);
				}


				var transform = {};

				if (backward) {
					if (obj.transformType == this.TRANSFORM_MOVE) {
						transform.x = -obj.transform.x;
						transform.y = -obj.transform.y;
					} else if (obj.transformType == this.TRANSFORM_ROTATE) {
						transform = -obj.transform;
					}
				} else {
					transform = obj.transform;
				}

				this.applyToObjects(obj.transformType, transform, obj.objects);


			}
			if (backward) this.undoIndex--;
			else this.undoIndex++;
		}
	}

	this.updateMousePosition = function (e) {
		var clientX, clientY;
		if (e.clientX) {
			clientX = e.clientX;
			clientY = e.clientY;
		}
		else if (e.changedTouches && e.changedTouches.length > 0) {
			var touch = e.changedTouches[e.changedTouches.length - 1];
			clientX = touch.clientX;
			clientY = touch.clientY;
		}
		else {
			return;
		}

		var rect = this.canvas.getBoundingClientRect();

		this.mousePosPixel.x = e.clientX - rect.left;
		this.mousePosPixel.y = e.clientY - rect.top;

		this.mousePosWorld = this.getWorldPointFromPixelPoint(this.mousePosPixel);
	}





	this.onMouseUp = function (evt) {
		if (this.editing) {
			if (this.editorMode == this.editorMode_SELECTION) {
				if (this.selectedPhysicsBodies.length == 0 && this.selectedTextures.length == 0 && this.startSelectionPoint) {
					this.selectedPhysicsBodies = this.queryWorldForBodies(this.startSelectionPoint, this.mousePosWorld);
					this.selectedTextures = this.queryWorldForGraphics(this.startSelectionPoint, this.mousePosWorld, true, 0);
					this.updateSelection();
				} else {
					this.storeUndoMovement();
				}
			} else if (this.editorMode == this.editorMode_DRAWCIRCLES) {
				var radius = new b2Vec2(this.mousePosWorld.x - this.startSelectionPoint.x, this.mousePosWorld.y - this.startSelectionPoint.y).Length() / this.container.scale.x * this.PTM;
				if (radius * 2 * Math.PI > this.minimumBodySurfaceArea) {
					var bodyObject = new this.bodyObject;
					bodyObject.x = this.startSelectionPoint.x;
					bodyObject.y = this.startSelectionPoint.y;
					bodyObject.radius = radius;
					this.buildBodyFromObj(bodyObject);
				}
			}
		}
		this.mouseDown = false;
	}
	this.onKeyDown = function (e) {


		if (e.keyCode == 68) {//d
			console.log("draw! :)");
			this.startVerticesDrawing();
		} else if (e.keyCode == 67) {//c
			if (e.ctrlKey || e.metaKey) {
				this.copySelection();
			} else {
				console.log("circle! :)");
				this.startCircleDrawing();
			}


		} else if (e.keyCode == 77) {//d
			console.log("selection! :)");
			this.startSelectionMode();
		} else if (e.keyCode == 81) {//q
			this.anchorTextureToBody();
		} else if (e.keyCode == 74) {//j
			this.attachJointPlaceHolder();
		} else if (e.keyCode == 83) {//s
			this.stringifyWorldJSON();
		} else if (e.keyCode == 86) {// v
			if (e.ctrlKey || e.metaKey) {
				this.pasteSelection();
			}
		} else if (e.keyCode == 88) {// x
			if (e.ctrlKey || e.metaKey) {
				this.cutSelection();
			} else {
				this.applyToSelectedObjects(this.TRANSFORM_ROTATE, this.shiftDown ? 10 : 1);
				this.storeUndoMovement();
			}

		} else if (e.keyCode == 90) {// z
			if (e.ctrlKey || e.metaKey) {
				this.undoMove(true);
			} else {
				this.applyToSelectedObjects(this.TRANSFORM_ROTATE, this.shiftDown ? -10 : -1);
				this.storeUndoMovement();
			}
		} else if (e.keyCode == 46) { //delete
			this.deleteSelection();
		} else if (e.keyCode == 16) {//shift
			this.shiftDown = true;
			//this.mouseTransformType = this.mouseTransformType_Rotation;
		} else if (e.keyCode == 32) {//space
			this.spaceDown = true;
		} else if (e.keyCode == 187) {// +
			//zoomin
			this.zoom({ x: this.mousePosWorld.x * this.PTM, y: this.mousePosWorld.y * this.PTM }, true);
		} else if (e.keyCode == 189) {// -
			//zoomout
			this.zoom({ x: this.mousePosWorld.x * this.PTM, y: this.mousePosWorld.y * this.PTM }, false);
		} else if (e.keyCode == 112) { // F1
			if (this.assetGUI == undefined) {
				this.initGuiAssetSelection();
			} else {
				this.removeGuiAssetSelection();
			}
			e.preventDefault();
		} else if (e.keyCode == 38) { // up arrow
			if (e.ctrlKey || e.metaKey) {
				this.applyToSelectedObjects(this.TRANSFORM_DEPTH, true);
				this.storeUndoMovement();

			} else {
				this.applyToSelectedObjects(this.TRANSFORM_MOVE, { x: 0, y: this.shiftDown ? -10 : -1 });
				this.storeUndoMovement();
			}
		} else if (e.keyCode == 40) { // down arrow
			if (e.ctrlKey || e.metaKey) {
				this.applyToSelectedObjects(this.TRANSFORM_DEPTH, false);
				this.storeUndoMovement();

			} else {
				this.applyToSelectedObjects(this.TRANSFORM_MOVE, { x: 0, y: this.shiftDown ? 10 : 1 });
				this.storeUndoMovement();
			}
		} else if (e.keyCode == 37) { // left arrow
			this.applyToSelectedObjects(this.TRANSFORM_MOVE, { x: this.shiftDown ? -10 : -1, y: 0 });
			this.storeUndoMovement();
		} else if (e.keyCode == 39) { // right arrow
			this.applyToSelectedObjects(this.TRANSFORM_MOVE, { x: this.shiftDown ? 10 : 1, y: 0 });
			this.storeUndoMovement();
		}
	}
	this.onKeyUp = function (e) {
		if (e.keyCode == 16) {//shift
			this.shiftDown = false;
			this.mouseTransformType = this.mouseTransformType_Movement;
		} else if (e.keyCode == 32) {//space
			this.spaceDown = false;
		}
	}


	this.queryPhysicsBodies = [];
	this.queryWorldForBodies = function (lowerBound, upperBound) {
		var aabb = new b2AABB();

		aabb.lowerBound.Set((lowerBound.x < upperBound.x ? lowerBound.x : upperBound.x), (lowerBound.y < upperBound.y ? lowerBound.y : upperBound.y));
		aabb.upperBound.Set((lowerBound.x > upperBound.x ? lowerBound.x : upperBound.x), (lowerBound.y > upperBound.y ? lowerBound.y : upperBound.y));

		this.queryPhysicsBodies = [];
		this.world.QueryAABB(this.getBodyCB.bind(this), aabb);
		return this.queryPhysicsBodies;
	}
	this.queryWorldForGraphics = function (lowerBound, upperBound, onlyTextures, limitResult) {
		var aabb = new b2AABB();

		aabb.lowerBound.Set((lowerBound.x < upperBound.x ? lowerBound.x : upperBound.x), (lowerBound.y < upperBound.y ? lowerBound.y : upperBound.y));
		aabb.upperBound.Set((lowerBound.x > upperBound.x ? lowerBound.x : upperBound.x), (lowerBound.y > upperBound.y ? lowerBound.y : upperBound.y));

		var lowerBoundPixi = this.getPIXIPointFromWorldPoint(aabb.lowerBound);
		var upperBoundPixi = this.getPIXIPointFromWorldPoint(aabb.upperBound);

		//QueryTextures

		var queryGraphics = [];
		var i;
		for (i = this.textures.children.length - 1; i > 0; i--) {
			var sprite = this.textures.getChildAt(i);

			if (!onlyTextures || !sprite.myBody) {


				if ((sprite.x + sprite.width / 2 > upperBoundPixi.x
					&& sprite.x - sprite.width / 2 < lowerBoundPixi.x
					&& sprite.y + sprite.height / 2 > upperBoundPixi.y
					&& sprite.y - sprite.height / 2 < lowerBoundPixi.y)
					|| (lowerBoundPixi.x < sprite.x - sprite.width / 2
						&& upperBoundPixi.x > sprite.x + sprite.width / 2
						&& lowerBoundPixi.y < sprite.y - sprite.height / 2
						&& upperBoundPixi.y > sprite.y + sprite.height / 2)) {
					this.textureObject
					queryGraphics.push(sprite);
					if (queryGraphics.length == limitResult) break;
				}
			}
		}
		return queryGraphics;

	}



	this.getBodyCB = function (fixture) {
		this.queryPhysicsBodies.push(fixture.GetBody());
		return true;
	};



	this.computeSelectionAABB = function () {
		var aabb = new b2AABB;
		aabb.lowerBound = new b2Vec2(Number.MAX_VALUE, Number.MAX_VALUE);
		aabb.upperBound = new b2Vec2(-Number.MAX_VALUE, -Number.MAX_VALUE);
		var i;
		var j;
		var body;
		var fixture;
		for (i = 0; i < this.selectedPhysicsBodies.length; i++) {
			body = this.selectedPhysicsBodies[i];
			fixture = body.GetFixtureList();
			while (fixture != null) {
				aabb.Combine(aabb, fixture.GetAABB());
				fixture = fixture.GetNext();
			}
		}

		for (i = 0; i < this.selectedTextures.length; i++) {
			var sprite = this.selectedTextures[i];

			if (sprite.myBody) {
				fixture = sprite.myBody.GetFixtureList();
				while (fixture != null) {
					aabb.Combine(aabb, fixture.GetAABB());
					fixture = fixture.GetNext();
				}
			} else {
				//sprite.calculateBounds()

				//sprite = sprite.getLocalBounds();
				var bounds = sprite.getLocalBounds();
				var spriteAABB = new b2AABB;
				spriteAABB.lowerBound = new b2Vec2((sprite.position.x - (bounds.width / 2) * sprite.scale.x) / this.PTM, (sprite.position.y - (bounds.height / 2) * sprite.scale.x) / this.PTM);
				spriteAABB.upperBound = new b2Vec2((sprite.position.x + (bounds.width / 2) * sprite.scale.y) / this.PTM, (sprite.position.y + (bounds.height / 2) * sprite.scale.y) / this.PTM);
				aabb.Combine(aabb, spriteAABB);
			}
		}
		return aabb;
	}

	this.doSelection = function () {
		// DRAW outer selection lines

		var aabb;
		if (this.selectedPhysicsBodies.length > 0 || this.selectedTextures.length > 0) {

			aabb = this.computeSelectionAABB();

			var lowerBoundPixi = this.getPIXIPointFromWorldPoint(aabb.lowerBound);
			var upperBoundPixi = this.getPIXIPointFromWorldPoint(aabb.upperBound);

			//Showing selection
			this.drawBox(this.debugGraphics, this.container.x + lowerBoundPixi.x * this.container.scale.x, this.container.y + lowerBoundPixi.y * this.container.scale.y, (upperBoundPixi.x - lowerBoundPixi.x) * this.container.scale.y, (upperBoundPixi.y - lowerBoundPixi.y) * this.container.scale.x, this.selectionBoxColor);
		} else {
			aabb = new b2AABB;

			//Making selection
			if (this.mouseDown && !this.spaceDown && this.startSelectionPoint) this.drawBox(this.debugGraphics, this.container.x + this.startSelectionPoint.x * this.PTM * this.container.scale.x, this.container.y + this.startSelectionPoint.y * this.PTM * this.container.scale.y, (this.mousePosWorld.x * this.PTM - this.startSelectionPoint.x * this.PTM) * this.container.scale.x, (this.mousePosWorld.y * this.PTM - this.startSelectionPoint.y * this.PTM) * this.container.scale.y, "#000000");
		}
		this.selectedBoundingBox = aabb;


		//JOINTS draw upper and lower limits
		var i;
		var sprite;
		for (i = 0; i < this.selectedTextures.length; i++) {
			sprite = this.selectedTextures[i];
			if (sprite.data.type == this.object_JOINT) {
				if (sprite.data.enableLimit) {
					var lineLength = 50 / sprite.scale.x;


					//FOR OBJECT A
					var lowAngle = -sprite.data.lowerAngle * this.DEG2RAD + sprite.rotation;
					var upAngle = -sprite.data.upperAngle * this.DEG2RAD + sprite.rotation;

					var tarSprite = sprite.parent.getChildAt(sprite.data.bodyA_ID);

					this.debugGraphics.lineStyle(1, "0x707070", 1);
					this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
					this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x + lineLength * Math.cos(sprite.rotation), tarSprite.y * this.container.scale.y + this.container.y + lineLength * Math.sin(sprite.rotation));


					this.debugGraphics.lineStyle(1, "0xFF9900", 1);
					this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
					this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x + lineLength * Math.cos(upAngle), tarSprite.y * this.container.scale.y + this.container.y + lineLength * Math.sin(upAngle));

					this.debugGraphics.lineStyle(1, "0xFF3300", 1);
					this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
					this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x + lineLength * Math.cos(lowAngle), tarSprite.y * this.container.scale.y + this.container.y + lineLength * Math.sin(lowAngle));

					this.debugGraphics.lineStyle(1, "0x000000", 0);
					this.debugGraphics.beginFill("0xFF9900", 0.3);
					this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
					this.debugGraphics.arc(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y, lineLength, upAngle, lowAngle, false);
					this.debugGraphics.endFill();

					//FOR OBJECT B

					if (sprite.data.bodyB_ID != undefined) {
						lowAngle = sprite.data.lowerAngle * this.DEG2RAD + sprite.rotation;
						upAngle = sprite.data.upperAngle * this.DEG2RAD + sprite.rotation;

						tarSprite = sprite.parent.getChildAt(sprite.data.bodyB_ID);

						this.debugGraphics.lineStyle(1, "0x707070", 1);
						this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
						this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x + lineLength * Math.cos(sprite.rotation), tarSprite.y * this.container.scale.y + this.container.y + lineLength * Math.sin(sprite.rotation));

						this.debugGraphics.lineStyle(1, "0xC554FA", 1);
						this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
						this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x + lineLength * Math.cos(upAngle), tarSprite.y * this.container.scale.y + this.container.y + lineLength * Math.sin(upAngle));

						this.debugGraphics.lineStyle(1, "0x8105BB", 1);
						this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
						this.debugGraphics.lineTo(tarSprite.x * this.container.scale.x + this.container.x + lineLength * Math.cos(lowAngle), tarSprite.y * this.container.scale.y + this.container.y + lineLength * Math.sin(lowAngle));

						this.debugGraphics.lineStyle(1, "0x000000", 0);
						this.debugGraphics.beginFill("0xC554FA", 0.3);
						this.debugGraphics.moveTo(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y);
						this.debugGraphics.arc(tarSprite.x * this.container.scale.x + this.container.x, tarSprite.y * this.container.scale.y + this.container.y, lineLength, lowAngle, upAngle, false);
						this.debugGraphics.endFill();
					}
				}
			}
		}
		//





		if (this.editorGUI && this.editorGUI.editData) {
			//if(this.editorGUI.editData instanceof this.jointObject || this.editorGUI.editData instanceof this.bodyObject){
			var controller;
			var controllers = [];
			var body;
			var sprite;
			var j;
			controllers = controllers.concat(this.editorGUI.__controllers);

			for (var propt in this.editorGUI.__folders) {
				controllers = controllers.concat(this.editorGUI.__folders[propt].__controllers);
			}

			var i;
			for (i in controllers) {
				controller = controllers[i]

				if (controller.humanUpdate) {
					controller.humanUpdate = false;
					if (controller.property == "typeName") {
						//joint
						if (controller.targetValue == "Pin") {
							this.selectedTextures[0].data.jointType = this.jointObject_TYPE_PIN;
						} else if (controller.targetValue == "Slide") {
							this.selectedTextures[0].data.jointType = this.jointObject_TYPE_SLIDE;
						} else if (controller.targetValue == "Distance") {
							this.selectedTextures[0].data.jointType = this.jointObject_TYPE_DISTANCE;
						}
						this.updateSelection();
					} else if (controller.property == "x") {
						//bodies & sprites
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							var pos = body.GetPosition();
							pos.x += controller.targetValue / this.PTM;
							body.SetPosition(pos);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.x += controller.targetValue;
						}
					} else if (controller.property == "y") {
						//bodies & sprites
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							var pos = body.GetPosition();
							pos.y += controller.targetValue / this.PTM;
							body.SetPosition(pos);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.y += controller.targetValue;
						}
					} else if (controller.property == "collideConnected") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.collideConnected = controller.targetValue;
						}
					} else if (controller.property == "enableMotor") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.enableMotor = controller.targetValue;
						}
					} else if (controller.property == "maxMotorTorque") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.maxMotorTorque = controller.targetValue;
						}
					} else if (controller.property == "motorSpeed") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.motorSpeed = controller.targetValue;
						}
					} else if (controller.property == "enableLimit") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.enableLimit = controller.targetValue;
						}
					} else if (controller.property == "upperAngle") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.upperAngle = controller.targetValue;
						}
					} else if (controller.property == "lowerAngle") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.lowerAngle = controller.targetValue;
						}
					} else if (controller.property == "frequencyHz") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.frequencyHz = controller.targetValue;
						}
					} else if (controller.property == "dampingRatio") {
						//joint
						for (j = 0; j < this.selectedTextures.length; j++) {
							this.selectedTextures[j].data.dampingRatio = controller.targetValue;
						}
					} else if (controller.property == "rotation") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.SetAngle(controller.targetValue * this.DEG2RAD);
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.rotation = controller.targetValue;
						}
					} else if (controller.property == "group" && controller.targetValue != "-") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.group = controller.targetValue;
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.group = controller.targetValue;
						}
					} else if (controller.property == "refName" && controller.targetValue != "-") {
						//body & sprite
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.refName = controller.targetValue;
						}
						for (j = 0; j < this.selectedTextures.length; j++) {
							sprite = this.selectedTextures[j];
							sprite.data.refName = controller.targetValue;
						}
					} else if (controller.property == "colorFill") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.colorFill = controller.targetValue.toString();
							var fixture = body.GetFixtureList();

							if (body.myGraphic.data.radius) this.updateCircleShape(body.myGraphic, body.myGraphic.data.radius, body.myGraphic.data.colorFill, body.myGraphic.data.colorLine);
							else this.updatePolyShape(body.myGraphic, fixture.GetShape(), body.myGraphic.data.colorFill, body.myGraphic.data.colorLine);
						}
					} else if (controller.property == "colorLine") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.colorLine = controller.targetValue.toString();
							var fixture = body.GetFixtureList();
							if (body.myGraphic.data.radius) this.updateCircleShape(body.myGraphic, body.myGraphic.data.radius, body.myGraphic.data.colorFill, body.myGraphic.data.colorLine);
							else this.updatePolyShape(body.myGraphic, fixture.GetShape(), body.myGraphic.data.colorFill, body.myGraphic.data.colorLine);
						}
					} else if (controller.property == "fixed") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.fixed = controller.targetValue;
							if (body.myGraphic.data.fixed) body.SetType(b2Body.b2_staticBody);
							else body.SetType(b2Body.b2_dynamicBody);

							var oldPosition = new b2Vec2(body.GetPosition().x, body.GetPosition().y);
							body.SetPosition(new b2Vec2(1000, 1000));
							body.SetPosition(oldPosition);

							//update collision data
							this.setBodyCollision(body, body.myGraphic.data.collision);

							//awake fix
							if (body.GetType() == b2Body.b2_dynamicBody) body.SetAwake(body.myGraphic.data.awake);
						}

					} else if (controller.property == "awake") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.awake = controller.targetValue;
							body.SetAwake(false);
						}
					} else if (controller.property == "density") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.density = controller.targetValue;
							var fixture = body.GetFixtureList();
							fixture.SetDensity(controller.targetValue);
							body.ResetMassData();
						}
					} else if (controller.property == "collision") {
						//body
						for (j = 0; j < this.selectedPhysicsBodies.length; j++) {
							body = this.selectedPhysicsBodies[j];
							body.myGraphic.data.collision = controller.targetValue;
							this.setBodyCollision(body, controller.targetValue);
						}
					}

				}
				if (controller.__input !== document.activeElement &&
					(controller.domElement.children[0].children && controller.domElement.children[0].children[0] !== document.activeElement)) {
					controller.updateDisplay();
				}
			}
			if (this.editorGUI.editData.type == this.object_BODY) {
				var pos = this.selectedPhysicsBodies[0].GetPosition();
				this.editorGUI.editData.x = pos.x * this.PTM;
				this.editorGUI.editData.y = pos.y * this.PTM;
				this.editorGUI.editData.rotation = this.selectedPhysicsBodies[0].GetAngle() * this.RAD2DEG;
			} else {
				this.editorGUI.editData.x = this.selectedTextures[0].x;
				this.editorGUI.editData.y = this.selectedTextures[0].y;
				this.editorGUI.editData.rotation = this.selectedTextures[0].rotation;
			}
			//}
		}

	}

	this.correctedDrawVerticePosition;
	this.correctDrawVertice = false;
	this.closeDrawing = false;
	this.activeVertices = [];

	this.verticesLineColor = "#00FF00";
	this.verticesFillColor = "#0000FF";
	this.verticesBulletRadius = 5;

	this.doVerticesDrawing = function () {
		this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);
		this.debugGraphics.beginFill(this.verticesFillColor, 0.5);

		var i = 0;
		var newVertice;
		var activeVertice;
		var previousVertice;

		this.closeDrawing = false;

		if (this.activeVertices.length > 0) {
			newVertice = { x: this.mousePosWorld.x, y: this.mousePosWorld.y }
			activeVertice = this.activeVertices[this.activeVertices.length - 1];

			if (this.activeVertices.length > 1) {

				previousVertice = this.activeVertices[this.activeVertices.length - 2];
				// compare mouse base angle with mouse previous angle
				var difference1 = { x: newVertice.x - previousVertice.x, y: newVertice.y - previousVertice.y };
				var angle1 = Math.atan2(difference1.y, difference1.x) * this.RAD2DEG;

				var difference2 = { x: activeVertice.x - previousVertice.x, y: activeVertice.y - previousVertice.y };
				var angle2 = Math.atan2(difference2.y, difference2.x) * this.RAD2DEG;

				var d = Math.abs(angle1 - angle2) % 360;
				var r = d > 180 ? 360 - d : d;
				var sign = (angle1 - angle2 >= 0 && angle1 - angle2 <= 180) || (angle1 - angle2 <= -180 && angle1 - angle2 >= -360) ? 1 : -1;

				var angleDirection = r * sign;
				//now we know the angle direction

				// lets see now compared to our first vertice
				var difference3 = { x: newVertice.x - activeVertice.x, y: newVertice.y - activeVertice.y };
				var angle3 = Math.atan2(difference3.y, difference3.x) * this.RAD2DEG;

				var difference4 = { x: this.activeVertices[0].x - activeVertice.x, y: this.activeVertices[0].y - activeVertice.y };
				var angle4 = Math.atan2(difference4.y, difference4.x) * this.RAD2DEG;

				d = Math.abs(angle3 - angle4) % 360;
				r = d > 180 ? 360 - d : d;
				sign = (angle3 - angle4 >= 0 && angle3 - angle4 <= 180) || (angle3 - angle4 <= -180 && angle3 - angle4 >= -360) ? 1 : -1;

				var angleToBaseDirection = r * sign;

				this.correctDrawVertice = false;
				if (angleDirection >= 0) {

					//angle going in wrong direction
					this.debugGraphics.lineStyle(1, 0xFF0000, 1);

					var hypLength = Math.sqrt(difference3.x * difference3.x + difference3.y * difference3.y);
					var tarAdjucentLengthExtension = Math.cos((angle3 - angle2) * this.DEG2RAD) * hypLength;
					var tarAdjucentLength = Math.sqrt(difference2.x * difference2.x + difference2.y * difference2.y) + tarAdjucentLengthExtension;

					newVertice = { x: previousVertice.x + tarAdjucentLength * Math.cos(angle2 * this.DEG2RAD), y: previousVertice.y + tarAdjucentLength * Math.sin(angle2 * this.DEG2RAD) };
					this.correctedDrawVerticePosition = newVertice;
					this.correctDrawVertice = true;

				}


				//calculate if we can still close
				if (this.activeVertices.length > 2) {

					if (angleDirection < 0 && angleToBaseDirection <= 0) {
						this.debugGraphics.lineStyle(1, 0xFFFF00, 1);
						this.closeDrawing = true;
					}

					var ccw = function (A, B, C) { return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x) };
					var intersect = function (A, B, C, D) { return ccw(A, C, D) != ccw(B, C, D) && ccw(A, B, C) != ccw(A, B, D) };

					var checkBaseSegmentNextVertice = this.activeVertices[1];
					var checkBaseSegmentVertice = this.activeVertices[0];
					var checkBaseAngle = Math.atan2(checkBaseSegmentNextVertice.y - checkBaseSegmentVertice.y, checkBaseSegmentNextVertice.x - checkBaseSegmentVertice.x);
					var imaginaryDistance = 10000;
					var imaginaryVerticeOnBaseSegment = { x: checkBaseSegmentVertice.x - imaginaryDistance * Math.cos(checkBaseAngle), y: checkBaseSegmentVertice.y - imaginaryDistance * Math.sin(checkBaseAngle) };

					//this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(newVertice).x, this.getPIXIPointFromWorldPoint(newVertice).y);
					//this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(imaginaryVerticeOnBaseSegment).x, this.getPIXIPointFromWorldPoint(imaginaryVerticeOnBaseSegment).y);


					if (intersect(checkBaseSegmentNextVertice, imaginaryVerticeOnBaseSegment, newVertice, activeVertice)) {
						this.debugGraphics.lineStyle(1, 0xFF00FF, 1);
						this.closeDrawing = true;
					}
				}

			}
			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(newVertice).x * this.container.scale.x + this.container.x + this.verticesBulletRadius, this.getPIXIPointFromWorldPoint(newVertice).y * this.container.scale.y + this.container.y);

			this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(newVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(newVertice).y * this.container.scale.y + this.container.y, this.verticesBulletRadius, 0, 2 * Math.PI, false);

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(newVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(newVertice).y * this.container.scale.y + this.container.y);

			this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
		}
		previousVertice = null;


		for (i = 0; i < this.activeVertices.length; i++) {

			activeVertice = this.activeVertices[i];

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x + this.verticesBulletRadius, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
			this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y, this.verticesBulletRadius, 0, 2 * Math.PI, false);

			if (i > 0) previousVertice = this.activeVertices[i - 1];

			if (previousVertice) {
				this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(activeVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(activeVertice).y * this.container.scale.y + this.container.y);
				this.debugGraphics.lineTo(this.getPIXIPointFromWorldPoint(previousVertice).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(previousVertice).y * this.container.scale.y + this.container.y);
			}
		}

		this.debugGraphics.endFill();

	}
	this.doCircleDrawing = function () {
		if (this.mouseDown) {
			this.debugGraphics.lineStyle(1, this.verticesLineColor, 1);
			this.debugGraphics.beginFill(this.verticesFillColor, 0.5);
			var radius = new b2Vec2(this.mousePosWorld.x - this.startSelectionPoint.x, this.mousePosWorld.y - this.startSelectionPoint.y).Length() * this.PTM;
			console.log("YEESSSSS" + radius);

			this.debugGraphics.moveTo(this.getPIXIPointFromWorldPoint(this.startSelectionPoint).x * this.container.scale.x + this.container.x + radius, this.getPIXIPointFromWorldPoint(this.startSelectionPoint).y * this.container.scale.y + this.container.y);
			this.debugGraphics.arc(this.getPIXIPointFromWorldPoint(this.startSelectionPoint).x * this.container.scale.x + this.container.x, this.getPIXIPointFromWorldPoint(this.startSelectionPoint).y * this.container.scale.y + this.container.y, radius, 0, 2 * Math.PI, false);

			this.debugGraphics.endFill();
		}

	}

	this.createBodyObjectFromVerts = function (verts) {
		var bodyObject = new this.bodyObject;

		var i = 0;
		var centerPoint = { x: 0, y: 0 };
		var vert;
		for (i = 0; i < verts.length; i++) {
			vert = verts[i];
			centerPoint = { x: centerPoint.x + vert.x, y: centerPoint.y + vert.y };
		}
		centerPoint = { x: centerPoint.x / verts.length, y: centerPoint.y / verts.length };

		for (i = 0; i < verts.length; i++) {
			verts[i] = { x: verts[i].x - centerPoint.x, y: verts[i].y - centerPoint.y };
		}

		bodyObject.x = centerPoint.x;
		bodyObject.y = centerPoint.y;
		bodyObject.vertices = verts.reverse();

		console.log(JSON.stringify(bodyObject));

		return bodyObject;

	}
	this.buildTextureFromObj = function (obj) {
		var sprite = new PIXI.Sprite(PIXI.Texture.fromFrame(obj.textureName));
		sprite.pivot.set(sprite.width / 2, sprite.height / 2);
		this.textures.addChild(sprite);
		sprite.x = obj.x;
		sprite.y = obj.y;
		sprite.rotation = obj.rotation;
		sprite.data = obj;

		if (sprite.data.bodyID != undefined) {
			var body = this.textures.getChildAt(sprite.data.bodyID).myBody;
			this.setTextureToBody(body, sprite, obj.texturePositionOffsetLength, obj.texturePositionOffsetAngle, obj.textureAngleOffset);
		}
		//handle groups and ref names
		if (obj.group != "") {
			if (this.editorObjectLookup[obj.group] == undefined) {
				this.editorObjectLookup[obj.group] = new this.lookupObject;
			}
			this.editorObjectLookup[obj.group]._textures.push(sprite);
		}

	}
	this.buildBodyFromObj = function (obj) {

		var fixDef = new b2FixtureDef;
		fixDef.density = obj.density;
		fixDef.friction = 1;
		fixDef.restitution = 0.2;


		var bd = new b2BodyDef();

		if (obj.fixed) bd.type = b2Body.b2_staticBody;
		else bd.type = b2Body.b2_dynamicBody;

		var body = this.world.CreateBody(bd);

		body.SetAwake(obj.awake);

		if (!obj.radius) {
			var i = 0;
			var vert;
			var b2Vec2Arr = [];
			for (i = 0; i < obj.vertices.length; i++) {
				vert = obj.vertices[i];
				b2Vec2Arr.push(new b2Vec2(vert.x, vert.y));
			}

			fixDef.shape = new b2PolygonShape;
			fixDef.shape.SetAsArray(b2Vec2Arr, b2Vec2Arr.length);
		} else {
			fixDef.shape = new b2CircleShape;
			fixDef.shape.Set(new b2Vec2(0, 0));
			fixDef.shape.SetRadius(obj.radius / this.PTM);
		}

		var fixture = body.CreateFixture(fixDef);
		body.SetPositionAndAngle(new b2Vec2(obj.x, obj.y), 0);

		body.SetAngle(obj.rotation);

		var graphic = new PIXI.Graphics();
		this.textures.addChild(graphic);
		body.myGraphic = graphic

		if (!obj.radius) this.updatePolyShape(body.myGraphic, fixDef.shape, obj.colorFill, obj.colorLine);
		else this.updateCircleShape(body.myGraphic, obj.radius, obj.colorFill, obj.colorLine);

		body.myGraphic.myBody = body;
		body.myGraphic.data = obj;


		this.setBodyCollision(body, obj.collision);


		if (obj.group != "") {
			if (this.editorObjectLookup[obj.group] == undefined) {
				this.editorObjectLookup[obj.group] = new this.lookupObject;
			}
			this.editorObjectLookup[obj.group]._bodies.push(body);
		}


	}
	this.setBodyCollision = function (body, collision) {
		// DO COLLISION
		/*0) collides with everything
		- nothing

		1) collides with mostly everything but characters
		- mask bit set to CHARACTER_MASKBIT

		2) collides with nothing
		- setAsTrigger

		3) collides with everything except other shapes with collision set to this value.
		- catagory CUSTOM_MASKBIT, mask CUSTOM_MASKBIT

		4) collides only with other shapes with collision set to this value.
		- catagory CUSTOM_MASKBIT, mask CUSTOM_MASKBIT

		5) collides only with fixed shapes
		 - set mask to CHARACTER_MASKBIT, CUSTOM_MASKBIT, NORMAL_MASKBIT;

		6) collides only with characters
		- set mask to CUSTOM_MASKBIT, FIXED_MASKBIT, NORMAL_MASKBIT

		all bits:
		CHARACTER_MASKBIT;
		CUSTOM_MASKBIT;
		FIXED_MASKBIT;
		NORMAL_MASKBIT;

		if either fixture has a groupIndex of zero, use the category/mask rules as above
		if both groupIndex values are non-zero but different, use the category/mask rules as above
		if both groupIndex values are the same and positive, collide
		if both groupIndex values are the same and negative, don't collide*/

		//TODO Bug when selection collision 4 and reset - body falls through fixtures

		var fixture = body.GetFixtureList();
		var filterData = fixture.GetFilterData();


		if (body.GetType() == b2Body.b2_staticBody) filterData.categoryBits = this.MASKBIT_FIXED;
		else filterData.categoryBits = this.MASKBIT_NORMAL;
		filterData.maskBits = this.MASKBIT_NORMAL | this.MASKBIT_FIXED | this.MASKBIT_CHARACTER | this.MASKBIT_EVERYTHING_BUT_US;//this.MASKBIT_ONLY_US;
		fixture.SetSensor(false);

		if (collision == 1) {
			filterData.maskBits = this.MASKBIT_NORMAL | this.MASKBIT_FIXED | this.MASKBIT_EVERYTHING_BUT_US;// this.MASKBIT_CHARACTER | this.MASKBIT_ONLY_US;
		} else if (collision == 2) {
			fixture.SetSensor(true);
		} else if (collision == 3) {
			filterData.categoryBits = this.MASKBIT_EVERYTHING_BUT_US;
			filterData.maskBits = this.MASKBIT_NORMAL | this.MASKBIT_FIXED | this.MASKBIT_CHARACTER;//this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_ONLY_US;
		} else if (collision == 4) {
			filterData.categoryBits = this.MASKBIT_ONLY_US;
			filterData.maskBits = this.MASKBIT_ONLY_US; //this.MASKBIT_NORMAL | this.MASKBIT_FIXED  | this.MASKBIT_CHARACTER; this.MASKBIT_EVERYTHING_BUT_US;
		} else if (collision == 5) {
			filterData.maskBits = this.MASKBIT_FIXED;//this.MASKBIT_NORMAL | this.MASKBIT_CHARACTER | this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_ONLY_US;
		} else if (collision == 6) {
			filterData.maskBits = this.MASKBIT_CHARACTER;// this.MASKBIT_NORMAL| this.MASKBIT_FIXED | this.MASKBIT_EVERYTHING_BUT_US | this.MASKBIT_ONLY_US;
		} else if (collision == 7) {
			filterData.categoryBits = this.MASKBIT_CHARACTER;
			filterData.groupIndex = this.GROUPINDEX_CHARACTER;
		}

		fixture.SetFilterData(filterData);
		//
	}


	this.attachJointPlaceHolder = function (obj) {


		var tarObj;
		var bodies = [];

		if (obj) {
			tarObj = obj;
			bodies.push(this.textures.getChildAt(tarObj.bodyA_ID).myBody);

			if (tarObj.bodyB_ID != undefined) {
				bodies.push(this.textures.getChildAt(tarObj.bodyB_ID).myBody);
			}

		} else {
			tarObj = new this.jointObject;
			bodies = this.queryWorldForBodies(this.mousePosWorld, this.mousePosWorld);

			if (bodies.length == 0) return;

			tarObj.bodyA_ID = bodies[0].myGraphic.parent.getChildIndex(bodies[0].myGraphic);

			if (bodies.length > 1) {
				tarObj.bodyB_ID = bodies[1].myGraphic.parent.getChildIndex(bodies[1].myGraphic);
			}

			tarObj.jointType = this.jointObject_TYPE_PIN;
			tarObj.x = this.mousePosWorld.x * this.PTM;
			tarObj.y = this.mousePosWorld.y * this.PTM
		}

		var jointGraphics = new PIXI.Sprite(PIXI.Texture.fromFrame('pinJoint'));
		this.textures.addChild(jointGraphics);

		jointGraphics.pivot.set(jointGraphics.width / 2, jointGraphics.height / 2);

		jointGraphics.bodies = bodies;

		console.log(bodies[0].myJoints);

		if (bodies[0].myJoints == undefined) bodies[0].myJoints = [];
		bodies[0].myJoints.push(jointGraphics);

		if (bodies.length > 1) {
			if (bodies[1].myJoints == undefined) bodies[1].myJoints = [];
			bodies[1].myJoints.push(jointGraphics);
		}

		jointGraphics.data = tarObj;

		jointGraphics.x = tarObj.x;
		jointGraphics.y = tarObj.y;
		jointGraphics.rotation = tarObj.rotation;


		if (tarObj.group != "") {
			if (this.editorObjectLookup[tarObj.group] == undefined) {
				this.editorObjectLookup[tarObj.group] = new this.lookupObject;
			}
			this.editorObjectLookup[tarObj.group]._textures.push(jointGraphics);
		}

		this.editorIcons.push(jointGraphics);

	}

	this.attachJoint = function (jointPlaceHolder) {
		var bodyA = this.textures.getChildAt(jointPlaceHolder.bodyA_ID).myBody;
		var bodyB;
		if (jointPlaceHolder.bodyB_ID != null) {

			bodyB = this.textures.getChildAt(jointPlaceHolder.bodyB_ID).myBody;
		} else {
			//pin to background

			var fixDef = new b2FixtureDef;
			fixDef.density = 1.0;
			fixDef.friction = 0.5;
			fixDef.restitution = 0.2;

			var bd = new b2BodyDef();
			bd.type = b2Body.b2_staticBody;
			bodyB = this.world.CreateBody(bd);
			bodyB.SetPosition(new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM));


			fixDef.shape = new b2PolygonShape;
			fixDef.shape.SetAsBox(1, 1);

			var fixture = bodyB.CreateFixture(fixDef);
		}
		var joint;

		if (jointPlaceHolder.jointType == this.jointObject_TYPE_PIN || jointPlaceHolder.jointType == this.jointObject_TYPE_SLIDE) {
			var revoluteJointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef;

			revoluteJointDef.Initialize(bodyA, bodyB, new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM));
			revoluteJointDef.collideConnected = jointPlaceHolder.collideConnected;
			revoluteJointDef.referenceAngle = 0.0;
			revoluteJointDef.lowerAngle = jointPlaceHolder.lowerAngle * this.DEG2RAD;
			revoluteJointDef.upperAngle = jointPlaceHolder.upperAngle * this.DEG2RAD;
			revoluteJointDef.maxMotorTorque = jointPlaceHolder.maxMotorTorque;
			revoluteJointDef.motorSpeed = jointPlaceHolder.motorSpeed;
			revoluteJointDef.enableLimit = jointPlaceHolder.enableLimit;
			revoluteJointDef.enableMotor = jointPlaceHolder.enableMotor;


			joint = this.world.CreateJoint(revoluteJointDef);
		} else if (jointPlaceHolder.jointType == this.jointObject_TYPE_DISTANCE) {
			var distanceJointDef = new Box2D.Dynamics.Joints.b2DistanceJointDef;
			distanceJointDef.Initialize(bodyA, bodyB, new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM), new b2Vec2(jointPlaceHolder.x / this.PTM, jointPlaceHolder.y / this.PTM));
			distanceJointDef.frequencyHz = jointPlaceHolder.frequencyHz;
			distanceJointDef.dampingRatio = jointPlaceHolder.dampingRatio;

			joint = this.world.CreateJoint(distanceJointDef);
		}
		return joint;
	}


	this.anchorTextureToBody = function () {
		var bodies = this.queryWorldForBodies(this.mousePosWorld, this.mousePosWorld);
		var textures = this.queryWorldForGraphics(this.mousePosWorld, this.mousePosWorld, true, 1);

		if (bodies.length > 0 && textures.length > 0) {
			// lets mold these fuckers to eachother

			var body = bodies[0];
			var texture = textures[0];


			if (!body.myTexture && !texture.myBody) {
				var dif = new b2Vec2(texture.x - body.GetPosition().x * this.PTM, texture.y - body.GetPosition().y * this.PTM);
				var angleOffset = body.GetAngle() - Math.atan2(dif.y, dif.x);
				var angle = body.GetAngle() - texture.rotation;
				this.updateObject(body.myGraphic, body.myGraphic.data);
				this.updateObject(texture, texture.data);
				this.setTextureToBody(body, texture, dif.Length(), angleOffset, angle);

			} else if (body.myTexture && texture.myBody) {
				if (body.myTexture == texture) {
					this.removeTextureFromBody(body);
				}
			}

		}
	}
	this.setTextureToBody = function (body, texture, positionOffsetLength, positionOffsetAngle, offsetRotation) {
		body.myTexture = texture;
		texture.data.bodyID = body.myGraphic.data.ID;
		texture.data.texturePositionOffsetLength = positionOffsetLength;
		texture.data.texturePositionOffsetAngle = positionOffsetAngle;
		texture.data.textureAngleOffset = offsetRotation;
		body.myGraphic.visible = false;
		texture.myBody = body;
	}
	this.removeTextureFromBody = function (body) {
		body.myTexture = null;
		texture.data.bodyID = null;
		texture.data.texturePositionOffsetLength = null;
		texture.data.texturePositionOffsetAngle = null;
		texture.data.textureAngleOffset = null;
		body.myGraphic.visible = true;
		texture.myBody = null;
	}

	this.updatePolyShape = function (graphic, poly, colorFill, colorLine) {

		var color;
		color = colorFill.slice(1);
		var colorFillHex = parseInt(color, 16);
		color = colorLine.slice(1);
		var colorLineHex = parseInt(color, 16);


		graphic.clear();
		graphic.boundsPadding = 0;

		graphic.lineStyle(1, colorLineHex, 1);
		graphic.beginFill(colorFillHex, 1);

		var count = poly.GetVertexCount();

		var vertices = poly.GetVertices();

		var startPoint = vertices[0];

		graphic.moveTo(this.getPIXIPointFromWorldPoint(startPoint).x, this.getPIXIPointFromWorldPoint(startPoint).y);

		var i;
		var nextPoint;
		for (i = 1; i < count; i++) {
			nextPoint = vertices[i];
			graphic.lineTo(this.getPIXIPointFromWorldPoint(nextPoint).x, this.getPIXIPointFromWorldPoint(nextPoint).y);
		}
		graphic.lineTo(this.getPIXIPointFromWorldPoint(startPoint).x, this.getPIXIPointFromWorldPoint(startPoint).y);
		graphic.endFill();
		graphic.originalGraphic = true;

		return graphic;

	}
	this.updateCircleShape = function (graphic, radius, colorFill, colorLine) {
		var color;
		color = colorFill.slice(1);
		var colorFillHex = parseInt(color, 16);
		color = colorLine.slice(1);
		var colorLineHex = parseInt(color, 16);


		graphic.clear();
		graphic.boundsPadding = 0;

		graphic.lineStyle(1, colorLineHex, 1);
		graphic.beginFill(colorFillHex, 1);


		graphic.moveTo(radius, 0);
		graphic.arc(0, 0, radius, 0, 2 * Math.PI, false);
		graphic.endFill();


	}

	this.stringifyWorldJSON = function () {

		this.worldJSON = '{"objects":[';
		var sprite;
		var spriteData;
		for (i = 0; i < this.textures.children.length; i++) {
			if (i != 0) this.worldJSON += ',';
			sprite = this.textures.getChildAt(i);

			this.updateObject(sprite, sprite.data);
			this.worldJSON += JSON.stringify(sprite.data);
		}
		this.worldJSON += ']}';

		console.log(this.worldJSON);
	}

	this.updateObject = function (sprite, data) {

		if (data.type == this.object_BODY) {
			data.x = sprite.myBody.GetPosition().x;
			data.y = sprite.myBody.GetPosition().y;
			data.rotation = sprite.myBody.GetAngle();
		} else if (data.type == this.object_TEXTURE) {
			data.x = sprite.x;
			data.y = sprite.y;
			data.rotation = sprite.rotation;
			if (data.bodyID != undefined) data.bodyID = sprite.myBody.myGraphic.parent.getChildIndex(sprite.myBody.myGraphic);

		} else if (data.type == this.object_JOINT) {

			data.bodyA_ID = sprite.bodies[0].myGraphic.parent.getChildIndex(sprite.bodies[0].myGraphic);
			if (sprite.bodies.length > 1) data.bodyB_ID = sprite.bodies[1].myGraphic.parent.getChildIndex(sprite.bodies[1].myGraphic);
			data.x = sprite.x;
			data.y = sprite.y;
			data.rotation = sprite.rotation
		}
		data.ID = sprite.parent.getChildIndex(sprite);
	}

	this.parseAndBuildJSON = function (json) {

		var startChildIndex = this.textures.children.length;

		if (json != null && json != "") {
			var worldObjects = JSON.parse(json);

			var i;
			var obj;
			for (i = 0; i < worldObjects.objects.length; i++) {
				obj = worldObjects.objects[i];
				obj.ID += startChildIndex;

				if (obj.type == this.object_BODY) {
					this.buildBodyFromObj(obj);
				} else if (obj.type == this.object_TEXTURE) {
					if (obj.bodyID != undefined) {
						obj.bodyID += startChildIndex;
					}
					this.buildTextureFromObj(obj);
				} else if (obj.type == this.object_JOINT) {
					obj.bodyA_ID += startChildIndex;
					if (obj.bodyB_ID != undefined) obj.bodyB_ID += startChildIndex;

					this.attachJointPlaceHolder(obj);
				}

			}
		}

	}
	this.drawBox = function (target, x, y, width, height, lineColor, lineSize, lineAlpha, fillColor, fillAlpha) {

		if (lineSize == undefined) lineSize = 1;
		if (lineAlpha == undefined) lineAlpha = 1;
		if (fillAlpha == undefined) fillAlpha = 1;

		if (fillColor != undefined) target.beginFill(fillColor, fillAlpha);


		target.lineStyle(lineSize, lineColor, lineAlpha);
		target.moveTo(x, y);
		target.lineTo(x + width, y);
		target.lineTo(x + width, y + height);
		target.lineTo(x, y + height);
		target.lineTo(x, y);

		if (fillColor != undefined) target.endFill();
	}

	this.resetEditor = function () {
		this.editing = true;
		this.editorMode = this.editorMode_SELECTION;

		this.selectedPhysicsBodies = [];
		this.selectedTextures = [];
		this.selectedBoundingBox = null;
		this.startSelectionPoint = null;
		this.oldMousePosWorld = null;
		this.mouseDown = false;

		this.editorIcons = [];

		//Destroy all bodies
		var body = this.world.GetBodyList();
		var i = 0
		while (body) {
			var b = body;
			this.world.DestroyBody(b);
			body = body.GetNext();
		}

		//Destroy all graphics

		for (i = 0; i < this.textures.children.length; i++) {
			var sprite = this.textures.getChildAt(i);
			sprite.parent.removeChild(sprite);
			sprite.destroy({ children: true, texture: false, baseTexture: false });
			i--;
		}

		//reset gui
		if (this.editorGUI != undefined) {
			this.customGUIContainer.removeChild(this.editorGUI.domElement);
			this.editorGUI = null;
		}

		this.parseAndBuildJSON(this.worldJSON);
		this.parseAndBuildJSON(this.vehicleJSON);
		this.parseAndBuildJSON(this.characterJSON);

	}
	this.runWorld = function () {
		this.editorIcons = [];
		this.debugGraphics.clear();
		this.editing = false;

		var spritesToDestroy = [];
		var sprite;

		this.objectLookup = {};
		this.editorObjectLookup = {};

		for (i = 0; i < this.textures.children.length; i++) {
			sprite = this.textures.getChildAt(i);
			if (sprite.data.type == this.object_JOINT) {

				sprite.data.bodyA_ID = sprite.bodies[0].myGraphic.parent.getChildIndex(sprite.bodies[0].myGraphic);
				if (sprite.bodies.length > 1) sprite.data.bodyB_ID = sprite.bodies[1].myGraphic.parent.getChildIndex(sprite.bodies[1].myGraphic);
				this.updateObject(sprite, sprite.data);

				var joint = this.attachJoint(sprite.data);
				spritesToDestroy.push(sprite);

				//
				//add to live group
				if (sprite.data.group != "") {
					if (this.objectLookup[sprite.data.group] == undefined) {
						this.objectLookup[sprite.data.group] = new this.lookupObject;
					}
					this.objectLookup[sprite.data.group]._joints.push(joint);

					if (sprite.data.refName != "") {
						this.objectLookup[sprite.data.group][sprite.data.refName] = joint;
					}
				}
				//


			} else if (sprite.data.type == this.object_BODY) {
				//
				//add to live group
				if (sprite.data.group != "") {
					if (this.objectLookup[sprite.data.group] == undefined) {
						this.objectLookup[sprite.data.group] = new this.lookupObject;
					}
					this.objectLookup[sprite.data.group]._bodies.push(sprite.myBody);

					if (sprite.data.refName != "") {
						this.objectLookup[sprite.data.group][sprite.data.refName] = sprite.myBody;
					}
				}
				//

				var fixture = sprite.myBody.GetFixtureList();



			} else if (sprite.data.type == this.object_TEXTURE) {
				if (sprite.myBody == undefined) {
					//
					//add to live group
					if (sprite.data.group != "") {
						if (this.objectLookup[sprite.data.group] == undefined) {
							this.objectLookup[sprite.data.group] = new this.lookupObject;
						}
						this.objectLookup[sprite.data.group]._textures.push(sprite);

						if (sprite.data.refName != "") {
							this.objectLookup[sprite.data.group][sprite.data.refName] = sprite;
						}
					}
					//

				}

			}
		}
		for (i = 0; i < spritesToDestroy.length; i++) {
			sprite = spritesToDestroy[i];
			sprite.parent.removeChild(sprite);
			sprite.destroy({ children: true, texture: false, baseTexture: false });
		}
		this.editing = false;
	}

	this.zoom = function (pos, isZoomIn) {

		var direction = isZoomIn ? 1 : -1;

		var factor = (1 + direction * 0.1);

		var worldPos = { x: (pos.x), y: (pos.y) };
		var newScale = { x: this.container.scale.x * factor, y: this.container.scale.y * factor };

		var newScreenPos = { x: (worldPos.x) * newScale.x + this.container.x, y: (worldPos.y) * newScale.y + this.container.y };

		this.container.x -= (newScreenPos.x - (pos.x * this.container.scale.x + this.container.x));
		this.container.y -= (newScreenPos.y - (pos.y * this.container.scale.y + this.container.y));
		this.container.scale.x = newScale.x;
		this.container.scale.y = newScale.y;

		var i;
		for (i = 0; i < this.editorIcons.length; i++) {
			console.log("yes" + (1 / newScale.x));
			this.editorIcons[i].scale.x = 1.0 / newScale.x;
			this.editorIcons[i].scale.y = 1.0 / newScale.y;
		}
	}

	this.getWorldPointFromPixelPoint = function (pixelPoint) {
		return new b2Vec2(((pixelPoint.x - this.container.x) / this.container.scale.x) / this.PTM, ((pixelPoint.y - this.container.y) / this.container.scale.y) / this.PTM);
	}
	this.getPIXIPointFromWorldPoint = function (worldPoint) {
		return new b2Vec2(worldPoint.x * this.PTM, worldPoint.y * this.PTM);
	}



	//CONSTS
	this.editorMode_DRAWVERTICES = "drawVertices";
	this.editorMode_DRAWCIRCLES = "drawCircles";
	this.editorMode_SELECTION = "selection";


	this.object_typeToName = ["Physics Body", "Texture", "Joint"];

	this.object_BODY = 0;
	this.object_TEXTURE = 1;
	this.object_JOINT = 2;
	this.object_UNDO_MOVEMENT = 3;

	this.jointObject_TYPE_PIN = 0;
	this.jointObject_TYPE_SLIDE = 1;
	this.jointObject_TYPE_DISTANCE = 2;

	this.mouseTransformType = 0;
	this.mouseTransformType_Movement = 0;
	this.mouseTransformType_Rotation = 1;


	this.DEG2RAD = 0.017453292519943296;
	this.RAD2DEG = 57.29577951308232;

	this.MASKBIT_NORMAL = 0x0001;
	this.MASKBIT_FIXED = 0x0002;
	this.MASKBIT_CHARACTER = 0x0004;
	this.MASKBIT_EVERYTHING_BUT_US = 0x0008;
	this.MASKBIT_ONLY_US = 0x0010;
	this.GROUPINDEX_CHARACTER = -3;

	this.minimumBodySurfaceArea = 0.3;

}


