export var LoadCoreAssets = function (loader){
    loader.add("Characters_1.json", "assets/images/characters/Characters_1.json")
        .add("Vehicles_1.json", "assets/images/vehicles/Vehicles_1.json")
        .add("assets/images/particles/Decals.json")
        .add("Movement.json", "assets/images/prefabs/Movement.json")
        .add("Construction.json", "assets/images/prefabs/Construction.json")
        .add("Nature.json", "assets/images/prefabs/Nature.json")
        .add("Weapons.json", "assets/images/prefabs/Weapons.json")
        /*TILE DATA*/
        .add("dirt.jpg", "assets/images/textures/dirt.jpg")
        .add("grass.jpg", "assets/images/textures/grass.jpg")
        .add("fence.png", "assets/images/textures/fence.png")
        /*PARTICLE DATA*/
        .add("blood-particles-data", "data/emitter_blood.json")
        .add("particle.png", "assets/images/particles/particle.png")
        .add("particle-grey.png", "assets/images/particles/particle-grey.png")
        /*WORLD DATA*/
        .add("worldData", "data/worldData.json")
        .add("characterData1", "data/character1.json")
        .add("testData", "data/testData.json")
        .add("testData2", "data/testData2.json");
}