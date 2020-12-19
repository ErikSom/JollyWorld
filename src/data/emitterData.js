export const blood = JSON.parse(`{
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
	"addAtBack": true,
	"spawnType": "circle",
	"spawnCircle": {
		"x": 0,
		"y": 0,
		"r": 1
	},
	"emit":false
}`);

export const gorecloud = JSON.parse(`{
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
}`);
export const explosion_layer1 = JSON.parse(`
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
}`)

export const explosion_layer2 = JSON.parse(`
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
}`)
