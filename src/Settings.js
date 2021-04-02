const targetFPS = 60;
export var Settings = {
    /*APP*/
    targetResolution:{x:1920, y:1080},
    minimumAspect:1.20,
    maximumAspect:2.60,
    aspectZoom:1,
    HDR:true,
    FPSLimiter:false,
    FPSFrameLimit:false,
    FPSLimitTarget:45,
    pixelRatio: 1,
    admin:(window.location.search.indexOf('editorAdmin=true')>=0),
    userAdmin:false,
    targetFPS,
    timeStep:1000 / targetFPS,
    allowMouseMovement:true,
    defaultCameraZoom:1.0,
    defaultPhysicsCameraSize:1.5,
    lineWidthCorrection:1.0,
    gameOverDelay:1000,
    minlevelVotes:10,
    /*SOUND*/
    sfxOn:true,
    midiMusicVolume: 1.0,
    /*PHYSICS*/
    physicsTimeStep:1 / 30,
    PTM:30,
    defaultRestitution:0.2,
    defaultFriction:0.5,
    prefabBounceLimiter:1.0,
    maxBullets:2,
    /*GORE*/
    emittersPerBody:3,
    emitterMaxPoolTime:5000,
    bashForce:10000,
    physicsParticleLifeTime:2000,
    physicsParticleLifeTimeRandomOffset:1000,
    /*CHARACTER*/
    detachForce:300,
    characterLeanSpeed:2,
    availableCharacters:4,
    availableVehicles:['Bike', 'DirtBike', 'NoVehicle', 'Skateboard', 'Skippyball'],
    vehicleLayers:{'Bike':68, 'DirtBike':74, 'NoVehicle':50, 'Skateboard':67, 'Skippyball':90}, // we need the layers if we want to be able to switch vehicles, so we can correct the level
    /*EDITOR*/
    autoSaveInterval:5000,
    availableFonts:["Lily Script One", "Karla","Squada One","Arapey","Economica","Erica One","Trochut","Spinnaker"],
    minimumArtToolMovement: 1/5,
    minimumArtToolAngle: Math.PI/45,
    maxAnimationFrames:120,
    geometrySnapScale:10,
    scalePrecision:5,
    levelBuildDelayTime:500,
    positionGridSize:2,
    /* first texture name is empty so that in the editor you can select no tile texture as index */
    textureNames: ['', 'Snow', 'Asphalt', 'Ice1', 'Ice2', 'DirtGrey', 'DirtGreen', 'Mud', 'DirtGold', 'PipeGreyHorizontal', 'PipeGreyVertical', 'PipeGreenHorizontal', 'PipeGreenVertical', 'PlankBrownHorizontal', 'PlankGreyHorizontal', 'PlankBrownVertical', 'PlankGreyVertical', 'Brick4', 'Brick5', 'Brick6', 'PanelPurple', 'PanelGrey', 'Stripe1', 'Stripe2', 'Stripe3', 'Stripe4', 'WoodVertical', 'WoodHorizontal', 'MudAndRocksBrown', 'MudAndRocksBlack', 'LavaAndRocks', 'Lava', 'Water', 'WaterBubbles', 'WaterGreen', 'WaterGreenBubbles', 'WhiteBLock', 'GoldenBlock', 'PixelatedStone', 'PixelatedGrass', 'PixelatedGrassAndBerries', 'PixelatedDirt', 'PixelatedWater', 'PixelatedLava', 'Grass', 'Sand', 'Brick1', 'Brick2', 'Brick3', 'ThemeEgyptWall', 'ThemeEgyptCeiling', 'ThemeEgyptColumn', 'ThemeEgyptDeco', 'ThemeEgyptFloor', 'ThemeWareHouseWall', 'ThemeWareHouseCeiling', 'ThemeWareHouseColumn', 'ThemeWareHouseFence', 'ThemeWareHouseFloor', 'ThemeLostWorldWall', 'ThemeLostWorldCeiling', 'ThemeLostWorldDeco0', 'ThemeLostWorldDeco1', 'ThemeLostWorldDeco2', 'ThemeLostWorldFloor', 'ThemeLostWorldIvy', 'ThemeCandyLandWall0', 'ThemeCandyLandWall1', 'ThemeCandyLandDeco', 'ThemeCandyLandFloor', 'ThemeCandyLandColumn', 'ThemeForest0', 'ThemeForest1', 'ThemeForest2', 'ThemeForest3', 'ThemeForest4', 'ThemeHellWall0', 'ThemeHellWall1', 'ThemeHellDeco', 'ThemeHellFence', 'ThemeHellFencePikes0', 'ThemeHellFencePikes1', 'ThemeHellFencePikes2', 'ThemeHellFloor', 'ThemeSkinCountry0', 'ThemeSkinCountry1', 'ThemeSkinCountry2', 'ThemeSkinCountry3', 'ThemeSkinCountry4', 'ThemeHeavenWall', 'ThemeHeavenColumn', 'ThemeHeavenCloud', 'ThemeHeavenFloor', 'ThemeHeavenFence', 'ThemeHeavenFencePikes', 'ThemeSpaceDeco', 'ThemeSpaceWall0', 'ThemeSpaceWall1', 'ThemeSpaceWall2', 'ThemeSpaceFloor0', 'ThemeSpaceFloor1', 'ThemeSpaceSky', 'ThemeToyWorld0', 'ThemeToyWorld1', 'ThemeToyWorld2', 'ThemeToyWorld3', 'ThemeToyWorldPet0', 'ThemeToyWorldPet1', 'ThemeToyWorldPet2', 'ThemeJapanRoof0', 'ThemeJapanRoof1', 'ThemeJapanRoof2', 'ThemeJapanWall0', 'ThemeJapanWall1', 'ThemeJapanWall2', 'ThemeJapanWall3', 'ThemeJapanBamboo', 'ThemeAfrica0', 'ThemeAfrica1', 'ThemeAfrica2', 'ThemeAfrica3', 'ThemeAfrica4', 'ThemeAfrica5', 'ThemeAfrica6', 'ThemeAfrica7', 'ThemeAfrica8', 'TileArrow'],
    collisionTypes: ["Everything", "Everything but characters", "Nothing", "Everything but similar", "Only similar", "Only fixed objects", "Only characters"],
    gradientTextureSize:256,
    doubleClickTime:300,
    handleClosestDistance:5,
    verticeBoxSize:10,
    /*MOBILE*/
    touchButtonSize:80,
    touchControlsAlpha:0.6,
    iosReflowInterval:500,

    /*LIMITS*/
    motorSpeedLimit:100,
    motorForceLimit:50000,
    slideJointDistanceLimit:5000,

    /*TELEPORTS*/
    timeBetweenTeleports:5000,

    /*BACKEND*/
    API:'https://api.jollyworld.app',
    STATIC:'https://static.jollyworld.app',
    // REDIRECT:'http://localhost:11009/login.html', // TODO change
    // REDIRECT:'https://newbackend--jollyworld.netlify.app/login.html', // TODO change
    REDIRECT:'https://jollyworld.app/login.html',
    GAMEURI: 'https://jollyworld.app',
    YTAPIKEY:'AIzaSyDjy-Fw9ocqXRL2Axjj5zvBhgIXTJLcLY0',
    levelsPerRequest:100,

    /*TEXT*/
    DEFAULT_TEXTS:{
        levelEditScreen_DefaultTitleText: 'Fill in Title',
        levelEditScreen_DefaultDescriptionText: 'Fill in Description',
        login_DefaultUsername: 'Username',
        login_DefaultPassword: 'Password',
        login_DefaultRePassword: 'Re-type Password',
        login_DefaultEmail: 'E-mail addres',
        save_notLoggedIn: 'You must be logged in to save levels in the cloud. Your current level is automatically saved to this PC.',
        publish_notYetSaved: 'You first need to save the level before you can publish / preview it.',
        publish_noThumbnail: 'Your level needs a thumbnail before you can publish / preview it.',
        publish_noDescription: 'Your level needs a description before you can publish / preview it.',
        load_notLoggedIn: 'You must be logged in to load levels from the cloud. Your current level is automatically loaded on the next boot.',
        unsavedChanges: 'You have unsaved changes to your level, are you sure you wish to proceed?',
        new_level: 'Are you sure you want to start a new level?',
        confirm:'Yes!',
        decline:'NOPE!',
        newGradient:'-new gradient-',
        error_message:`A <b>CRITICAL ERROR</b> HAS OCCURRED <br> PLEASE FOLLOW THESE STEPS: <br><br> 1) COPY THE ERROR TEXT BELOW <br> 2) PASTE IT IN THE DISCORD #BUGS CHANNEL<br> 3) EXPLAIN BRIEFLY WHAT YOU DID <br> 4) REFRESH THE PAGE AFTERWARDS</b>`,
        downloading_blueprints:'downloading...',
        publish_succes:'Your level is now LIVE!'
    },
    jollyDataPrefix:window.atob('PGpvbGx5RGF0YS0='),

    pidouble: Math.PI*2,
    pihalve: Math.PI/2,





}
