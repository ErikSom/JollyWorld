const targetFPS = 60;
export var Settings = {
    /*REFRESHRATE*/
    admin:(window.location.search.indexOf('editorAdmin=true')>=0),
    targetFPS,
    timeStep:1000 / targetFPS,
    allowMouseMovement:true,
    cameraZoom:0.8,
    /*PHYSICS*/
    physicsTimeStep:1 / 30,
    PTM:30,
    /*GORE*/
    emittersPerBody:3,
    emitterMaxPoolTime:5000,
    bashForce:2000,
    physicsParticleLifeTime:2000,
    physicsParticleLifeTimeRandomOffset:1000,
    /*CHARACTER*/
    detachForce:300,
    characterLeanSpeed:2,
    availableCharacters:4,
    availableVehicles:['Bike', 'DirtBike', 'NoVehicle'],
    vehicleLayers:{'Bike':68, 'DirtBike':74, 'NoVehicle':50}, // we need the layers if we want to be able to switch vehicles, so we can correct the level
    /*EDITOR*/
    autoSaveInterval:5000,
    availableFonts:["Lily Script One", "Karla","Squada One","Arapey","Economica","Erica One","Trochut","Spinnaker"],
    doubleClickTime:300,
    handleClosestDistance:5,
    verticeBoxSize:10,
    /*CULLING SETTINGS*/

    /*LIMITS*/
    motorSpeedLimit:100,
    motorForceLimit:50000,
    slideJointDistanceLimit:5000,

    //FIREBASE
    levelsPerRequest:100,

    /*TELEPORTS*/
    timeBetweenTeleports:5000,

    /*TEXT*/
    DEFAULT_TEXTS:{
        levelEditScreen_DefaultTitleText: 'Fill in Title',
        levelEditScreen_DefaultDescriptionText: 'Fill in Description',
        login_DefaultUsername: 'Username',
        login_DefaultPassword: 'Password',
        login_DefaultRePassword: 'Re-type Password',
        login_DefaultEmail: 'E-mail addres',
        save_notLoggedIn: 'You must be logged in to save levels in the cloud. Your current level is automatically saved to this PC.',
        publish_notYetSaved: 'You first need to save the level before you can publish it.',
        publish_noThumbnail: 'Your level needs a thumbnail before you can publish it.',
        publish_noDescription: 'Your level needs a description before you can publish it.',
        load_notLoggedIn: 'You must be logged in to load levels from the cloud. Your current level is automatically loaded on the next boot.',
        unsavedChanges: 'You have unsaved changes to your level, are you sure you wish to proceed?',
        confirm:'Yes!',
        decline:'NOPE!',
    }





}
