const targetFPS = 60;
export var Settings = {
    /*REFRESHRATE*/
    targetFPS,
    timeStep:1000 / targetFPS,
    /*PHYSICS*/
    physicsTimeStep:1 / 30,
    PTM:30,
    /*GORE*/
    emittersPerBody:3,
    emitterMaxPoolTime:5000,
    bashMaxForceMultiplier:100,
    /*CHARACTER*/
    detachForce:300,
    characterLeanSpeed:2,
    /*EDITOR*/
    autoSaveInterval:5000,
    availableFonts:["Lily Script One", "Karla","Squada One","Arapey","Economica","Erica One","Trochut","Spinnaker"],
    /*CULLING SETTINGS*/

    /*LIMITS*/
    motorSpeedLimit:20,
    motorForceLimit:10000,
    slideJointDistanceLimit:5000,

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
