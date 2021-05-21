import easing from "../b2Editor/utils/easing";

export const blood = {
	"alpha": {
		"start": 0.73,
		"end": 0.46
	},
	"scale": {
		"start": 0.2,
		"end": 0.05,
		"minimumScaleMultiplier": 0.5
	},
	"color": {
		"start": "#c90808",
		"end": "#570101"
	},
	"speed": {
		"start": 500,
		"end": 0,
		"minimumSpeedMultiplier": 0.3
	},
	"acceleration": {
		"x": 0,
		"y": 2000
	},
	"maxSpeed": 2000,
	"startRotation": {
		"min": -25,
		"max": 25
	},
	"noRotation": false,
	"rotationSpeed": {
		"min": 0,
		"max": 200
	},
	"lifetime": {
		"min": 0.5,
		"max": 1.0
	},
	"blendMode": "normal",
	"frequency": 0.0005,
	"emitterLifetime": 0.02,
	"maxParticles": 1000,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": false,
	"spawnType": "circle",
	"spawnCircle": {
		"x": 0,
		"y": 0,
		"r": 1
	},
	"emit":false
};
export const bloodSpray = {
	"alpha": {
		"start": 0.73,
		"end": 0.46
	},
	"scale": {
		"start": 0.2,
		"end": 0.05,
		"minimumScaleMultiplier": 0.5
	},
	"color": {
		"start": "#c90808",
		"end": "#570101"
	},
	"speed": {
		"start": 500,
		"end": 0,
		"minimumSpeedMultiplier": 0.3
	},
	"acceleration": {
		"x": 0,
		"y": 2000
	},
	"maxSpeed": 2000,
	"startRotation": {
		"min": -5,
		"max": 5
	},
	"noRotation": false,
	"rotationSpeed": {
		"min": 0,
		"max": 200
	},
	"lifetime": {
		"min": 0.5,
		"max": 1.0
	},
	"blendMode": "normal",
	"frequency": 0.002,
	"emitterLifetime": 3,
	"maxParticles": 1000,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": false,
	"spawnType": "circle",
	"spawnCircle": {
		"x": 0,
		"y": 0,
		"r": 1
	},
	"emit":false
};

export const gorecloud = {
	"alpha": {
		"start": 1,
		"end": 0
	},
	"scale": {
		"start": 0.6,
		"end": 1.5,
		"minimumScaleMultiplier": 1
	},
	"color": {
		"start": "#ffffff",
		"end": "#ffffff"
	},
	"speed": {
		"start": 0.1,
		"end": 10,
		"minimumSpeedMultiplier": 1
	},
	"acceleration": {
		"x": 0,
		"y": 0
	},
	"maxSpeed": 0,
	"startRotation": {
		"min": 0,
		"max": 360
	},
	"noRotation": false,
	"rotationSpeed": {
		"min": 0,
		"max": 0
	},
	"lifetime": {
		"min": 0.2,
		"max": 0.4
	},
	"blendMode": "normal",
	"frequency": 0.02,
	"emitterLifetime": 0.2,
	"maxParticles": 500,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": false,
	"spawnType": "circle",
	"spawnCircle": {
		"x": 0,
		"y": 0,
		"r": 0
    },
    "emit":false
};
export const explosion_layer1 =
{
	"alpha": {
		"start": 1,
		"end": 1
	},
	"scale": {
		"start": 0.6,
		"end": 1.2,
		"minimumScaleMultiplier": 0.05
	},
	"color": {
		"start": "#616161",
		"end": "#e5e7e8"
	},
	"speed": {
		"start": 200,
		"end": 10,
		"minimumSpeedMultiplier": 3
	},
	"acceleration": {
		"x": 8,
		"y": 8
	},
	"maxSpeed": 0,
	"startRotation": {
		"min": 0,
		"max": 360
	},
	"noRotation": true,
	"rotationSpeed": {
		"min": 0,
		"max": 0
	},
	"lifetime": {
		"min": 0.15,
		"max": 0.3
	},
	"blendMode": "normal",
	"frequency": 0.001,
	"emitterLifetime": 0.2,
	"maxParticles": 500,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": true,
	"spawnType": "burst",
	"particlesPerWave": 1,
	"particleSpacing": 0,
	"angleStart": 0,
	"emit":false
};

export const explosion_layer2 =
{
	"alpha": {
		"start": 1,
		"end": 1
	},
	"scale": {
		"start": 0.14,
		"end": 0.6,
		"minimumScaleMultiplier": 0.05
	},
	"color": {
		"start": "#ffff00",
		"end": "#e69705"
	},
	"speed": {
		"start": 80,
		"end": 10,
		"minimumSpeedMultiplier": 5
	},
	"acceleration": {
		"x": 8,
		"y": 8
	},
	"maxSpeed": 0,
	"startRotation": {
		"min": 0,
		"max": 360
	},
	"noRotation": true,
	"rotationSpeed": {
		"min": 0,
		"max": 0
	},
	"lifetime": {
		"min": 0.1,
		"max": 0.3
	},
	"blendMode": "normal",
	"frequency": 0.001,
	"emitterLifetime": 0.2,
	"maxParticles": 500,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": true,
	"spawnType": "circle",
	"spawnCircle": {
		"x": 0,
		"y": 0,
		"r": 30
	},
	"emit":false
}

export const jetfire = {
	"alpha": {
		"start": 0.52,
		"end": 0
	},
	"scale": {
		"start": 0.25,
		"end": 0.52,
		"minimumScaleMultiplier": 1
	},
	"color": {
		"start": "#ffffff",
		"end": "#29a9ff"
	},
	"speed": {
		"start": 300,
		"end": 300,
		"minimumSpeedMultiplier": 1
	},
	"acceleration": {
		"x": 0,
		"y": 0
	},
	"maxSpeed": 0,
	"startRotation": {
		"min": 265,
		"max": 275
	},
	"noRotation": false,
	"rotationSpeed": {
		"min": 50,
		"max": 50
	},
	"lifetime": {
		"min": 0.11,
		"max": 0.15
	},
	"blendMode": "normal",
	"frequency": 0.001,
	"emitterLifetime": -1,
	"maxParticles": 1000,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": false,
	"spawnType": "circle",
	"spawnCircle": {
		"x": 0,
		"y": 0,
		"r": 10
	},
	"emit":false
}

export const cannonShoot = {
	"alpha": {
		"start": 0.7,
		"end": 0
	},
	"scale": {
		"start": 1,
		"end": 0.8,
		"minimumScaleMultiplier": 1
	},
	"color": {
		"start": "#ff9900",
		"end": "#100f0c"
	},
	"speed": {
		"start": 400,
		"end": 0,
		"minimumSpeedMultiplier": 1
	},
	"acceleration": {
		"x": 0,
		"y": 0
	},
	"maxSpeed": 0,
	"startRotation": {
		"min": 0,
		"max": 360
	},
	"noRotation": false,
	"rotationSpeed": {
		"min": 0,
		"max": 200
	},
	"lifetime": {
		"min": 0.2,
		"max": 0.3
	},
	"blendMode": "normal",
	"ease": [
		{
			"s": 0,
			"cp": 0.329,
			"e": 0.548
		},
		{
			"s": 0.548,
			"cp": 0.767,
			"e": 0.876
		},
		{
			"s": 0.876,
			"cp": 0.985,
			"e": 1
		}
	],
	"frequency": 0.001,
	"emitterLifetime": 0.1,
	"maxParticles": 100,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": true,
	"spawnType": "circle",
	"spawnCircle": {
		"x": 2,
		"y": 0,
		"r": 0
	},
	"emit":false
}

export const sparksMetal = {
	"alpha": {
		"start": 1,
		"end": 0.31
	},
	"scale": {
		"start": 0.5,
		"end": 1,
		"minimumScaleMultiplier": 1
	},
	"color": {
		"start": "#fafa00",
		"end": "#ff7b00"
	},
	"speed": {
		"start": 1000,
		"end": 200,
		"minimumSpeedMultiplier": 1
	},
	"acceleration": {
		"x": 0,
		"y": 0
	},
	"maxSpeed": 0,
	"startRotation": {
		"min": -20,
		"max": 20
	},
	"noRotation": false,
	"rotationSpeed": {
		"min": 0,
		"max": 20
	},
	"lifetime": {
		"min": 0.1,
		"max": 0.3
	},
	"blendMode": "normal",
	"frequency": 0.007,
	"emitterLifetime": 0.1,
	"maxParticles": 1000,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": false,
	"spawnType": "point",
	"emit":false
}

export const confettiFrames = [
	{
		framerate: 20,
		loop: true,
		textures: [
			"Confetti0000",
			"Confetti0001",
			"Confetti0002",
			"Confetti0003",
			"Confetti0004",
		]
	},
	{
		framerate: 20,
		loop: true,
		textures: [
			"Confetti0002",
			"Confetti0003",
			"Confetti0004",
			"Confetti0000",
			"Confetti0001",
		]
	},
	{
		framerate: 20,
		loop: true,
		textures: [
			"Confetti0004",
			"Confetti0000",
			"Confetti0001",
			"Confetti0002",
			"Confetti0003",
		]
	}
];

export const confetti = {
	"alpha": {
		"start": 1,
		"end": 1
	},
	"scale": {
		"start": 1,
		"end": 1.0,
		"minimumScaleMultiplier": 0.6
	},
	"color": {
		"start": "#e4f9ff",
		"end": "#3fcbff"
	},
	"speed": {
		"start": 500,
		"end": 100,
		"minimumSpeedMultiplier": 0.001
	},
	"acceleration": {
		"x": -0.1,
		"y": -0.1
	},
	"maxSpeed": 0,
	"startRotation": {
		"min": 0,
		"max": 360
	},
	"noRotation": false,
	"rotationSpeed": {
		"min": 1,
		"max": 7
	},
	"lifetime": {
		"min": 0.5,
		"max": 1
	},
	"blendMode": "normal",
	"frequency": 0.002,
	"emitterLifetime": 0.3,
	"maxParticles": 500,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": false,
	"spawnType": "circle",
	"spawnCircle": {
		"x": 0,
		"y": 0,
		"r": 100
	},
	"ease":easing.easeInOutQuad,
	"emit":false
}

export const splash = {
	"alpha": {
		"start": 1,
		"end": 0
	},
	"scale": {
		"start": 0.1,
		"end": 0.59,
		"minimumScaleMultiplier": 2
	},
	"color": {
		"start": "#ffffff",
		"end": "#ffffff"
	},
	"speed": {
		"start": 30,
		"end": 0,
		"minimumSpeedMultiplier": 0.001
	},
	"acceleration": {
		"x": 0,
		"y": 0
	},
	"maxSpeed": 0,
	"startRotation": {
		"min": 0,
		"max": 360
	},
	"noRotation": false,
	"rotationSpeed": {
		"min": 0,
		"max": 0
	},
	"lifetime": {
		"min": 0.2,
		"max": 0.4
	},
	"blendMode": "normal",
	"frequency": 0.005,
	"emitterLifetime": 0.1,
	"maxParticles": 1000,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": false,
	"spawnType": "circle",
	"spawnCircle": {
		"x": 0,
		"y": 0,
		"r": 20
	}
}
