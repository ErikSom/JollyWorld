const all_asset_paths = [
	'mod/jollymod/vehicles/bike/Bicycle_Pedals0000.png',
	'mod/jollymod/vehicles/bike/Bicycle_WheelBack0000.png',
	'mod/jollymod/vehicles/bike/Bicycle_WheelFront0000.png',
	'mod/jollymod/vehicles/bike/Bicycle_Body0000.png',

	'mod/jollymod/vehicles/dirtbike/DirtBike_Axis0000.png',
	'mod/jollymod/vehicles/dirtbike/DirtBike_Body0000.png',
	'mod/jollymod/vehicles/dirtbike/DirtBike_WheelSupport0000.png',
	'mod/jollymod/vehicles/dirtbike/DirtBike_WheelBack0000.png',
	'mod/jollymod/vehicles/dirtbike/DirtBike_WheelFront0000.png',
	'mod/jollymod/vehicles/dirtbike/DirtBikeHelmet0000.png',

	'mod/jollymod/vehicles/skateboard/SkateBoard_Board0000.png',
	'mod/jollymod/vehicles/skateboard/Skateboard_Wheel0000.png',

	'mod/jollymod/vehicles/yogaball/YogaBall0000.png',
	'mod/jollymod/vehicles/yogaball/YogaBall_Handle_Front0000.png',
	'mod/jollymod/vehicles/yogaball/YogaBallHandle_Back0000.png',

	'mod/jollymod/vehicles/foddycan/Hammer0000.png',
	'mod/jollymod/vehicles/foddycan/Hammer_20000.png',
	'mod/jollymod/vehicles/foddycan/Pot0000.png',
	'mod/jollymod/vehicles/foddycan/Pot_20000.png',

	'mod/jollymod/masks/masks0000.png',

	'mod/wardrobe/Normal_Belly0000.png',
	'mod/wardrobe/Normal_Core0000.png',
	'mod/wardrobe/Normal_Thigh0000.png',
	'mod/wardrobe/Normal_Leg0000.png',
	'mod/wardrobe/Normal_Feet0000.png',
	'mod/wardrobe/Normal_Head_Idle0000.png',
	'mod/wardrobe/Mouth_Idle0000.png',
	'mod/wardrobe/Normal_Eye0000.png',
	'mod/wardrobe/Normal_Eye_Closed0000.png',
	'mod/wardrobe/Normal_Shoulder0000.png',
	'mod/wardrobe/Normal_Arm0000.png',
	'mod/wardrobe/Normal_Hand0000.png'
]
const all_asset_imgs = {}

const bundle = new Image();
bundle.src = 'mod/wardrobe/bundle.png';
bundle.onload = function() {
	fetch('mod/wardrobe/bundle.json').then((response) => {
		response.json().then((object) => {
			object.forEach((item) => {
				const cvs = document.createElement('canvas');
				const ctx = cvs.getContext('2d');
				cvs.width = item.w;
				cvs.height = item.h;
				ctx.drawImage(bundle, item.x, item.y, item.w, item.h, 0, 0, item.w, item.h)
				all_asset_imgs[item.name] = cvs;
			});
			updateModName();
			$('modwardrobesteps').innerHTML = ""
			for (var section = 0; section < total_wardrobe_steps; section ++) {
				var new_section = document.createElement('div')
				new_section.classList.add('modwardrobesection')
				new_section.id = 'modwardrobesection' + section;
				new_section.style.display = 'none'
				for (var item = 0; item < wardrobe_features[section].length; item ++) {
					var new_container = document.createElement('div');
					new_container.classList.add('wardrobeitem');
					var new_button = document.createElement('img');
					new_button.classList.add('wardrobeitemimg')
					new_button.src = all_asset_imgs[wardrobe_features[section][item].thumb].toDataURL();
					new_container.section = section;
					new_container.item = item;
					new_container.onclick = function() {
						wardrobeSaveState()
						var items_to_be_overwritten = wardrobe_features[this.section][this.item].overwrite
						var done_overwriting = 0;
						for (var overwritten_item = 0; overwritten_item < items_to_be_overwritten.length; overwritten_item ++) {
							const old_item = items_to_be_overwritten[overwritten_item][0]
							const new_item = all_asset_imgs[items_to_be_overwritten[overwritten_item][1]].toDataURL();
							const preserve_old_item = items_to_be_overwritten[overwritten_item][2]
							const old_img = all_wardrobe_modified_imgs[old_item]
							const new_img = new Image()
							const cvs = document.createElement('canvas')
							cvs.width = old_img.width;
							cvs.height = old_img.height;
							const ctx = cvs.getContext('2d')
							if (preserve_old_item) {
								ctx.drawImage(old_img, 0, 0)
							}
							new_img.dest = old_item
							new_img.src = new_item
							new_img.onload = function() {
								done_overwriting ++;
								ctx.drawImage(this, 0, 0)
								all_wardrobe_modified_imgs[this.dest] = cvs;
								if (done_overwriting >= items_to_be_overwritten.length) {
									updateWardrobePreview();
									nextWardrobePage()
								}
							}
						}
						if (items_to_be_overwritten.length == 0) {
							updateWardrobePreview();
							nextWardrobePage()
						}
					}
					new_container.appendChild(new_button)
					new_section.appendChild(new_container)
				}
				const random_button = document.createElement('button');
				random_button.classList.add('button')
				random_button.innerText = "Select random";
				random_button.style.backgroundColor = "#FF6600"
				random_button.onclick = function() {
					const all_options = document.querySelectorAll(`#${this.parentElement.id} .wardrobeitem`)
					all_options[Math.floor(Math.random() * all_options.length)].click();
				}
				new_section.appendChild(random_button)
				$('modwardrobesteps').appendChild(new_section)
			}
			initWardrobe();
			adjustBodySize();
		});
	});
}

const character_positions = [
	// Bike
	{asset: 'Normal_Thigh0000.png', x: 135, y: 183, r: -0.71, w: 54, h: 88},
	{asset: 'Normal_Leg0000.png', x: 190, y: 203, r: 0.45, w: 49, h: 72},
	{asset: 'Normal_Feet0000.png', x: 158, y: 259, r: 0.2, w: 64, h: 21},

	{asset: 'Bicycle_Pedals0000.png', x: 169, y: 267, w: 33, h: 33},
	{asset: 'Bicycle_WheelBack0000.png', x: 55, y: 217, w: 113, h: 113},
	{asset: 'Bicycle_WheelFront0000.png', x: 234, y: 217, w: 113, h: 113},
	{asset: 'Bicycle_Body0000.png', x: 107, y: 140, w: 186, h: 148},

	{asset: 'Normal_Belly0000.png', x: 127, y: 135, r: 0.28, w: 83, h: 50},

	{asset: 'Normal_Thigh0000.png', x: 131, y: 185, r: -0.55, w: 54, h: 88},
	{asset: 'Normal_Leg0000.png', x: 172, y: 213, r: 0.35, w: 49, h: 72},
	{asset: 'Normal_Feet0000.png', x: 148, y: 283, r: -0.2, w: 64, h: 21},

	{asset: 'Normal_Shoulder0000.png', x: 163, y: 97, r: -0.6, w: 41, h: 70},
	{asset: 'Normal_Arm0000.png', x: 203, y: 152, r: -1.5, w: 36, h: 57},
	{asset: 'Normal_Hand0000.png', x: 248, y: 163, r: -1.7, w: 39, h: 35},

	{asset: 'Normal_Core0000.png', x: 131, y: 50, r: 0.28, w: 121, h: 113},

	{asset: 'Normal_Shoulder0000.png', x: 153, y: 97, r: -0.5, w: 41, h: 70},
	{asset: 'Normal_Arm0000.png', x: 190, y: 156, r: -1.5, w: 36, h: 57},
	{asset: 'Normal_Hand0000.png', x: 232, y: 167, r: -1.7, w: 39, h: 35},

	{asset: 'Normal_Head_Idle0000.png', x: 148, y: -1, r: 0.05, w: 96, h: 96},
	{asset: 'Mouth_Idle0000.png', x: 185, y: 59, r: 0.05, w: 42, h: 30},
	{asset: 'Normal_Eye0000.png', x: 186, y: 36, r: 0.05, w: 22, h: 22},
	{asset: 'Normal_Eye0000.png', x: 208, y: 37, r: 0.05, w: 22, h: 22},
	{asset: 'masks0000.png', x: 148, y: -1, r: 0.05, w: 96, h: 96},

	// Dirtbike
	{asset: 'Normal_Thigh0000.png', x: 541, y: 177, r: -0.70, w: 54, h: 88},
	{asset: 'Normal_Leg0000.png', x: 592, y: 200, r: 0.1, w: 49, h: 72},
	{asset: 'Normal_Feet0000.png', x: 585, y: 262, w: 64, h: 21},

	{asset: 'Normal_Shoulder0000.png', x: 563, y: 97, r: -0.6, w: 41, h: 70},
	{asset: 'Normal_Arm0000.png', x: 603, y: 152, r: -1.5, w: 36, h: 57},
	{asset: 'Normal_Hand0000.png', x: 648, y: 163, r: -1.7, w: 39, h: 35},

	{asset: 'DirtBike_WheelBack0000.png', x: 425, y: 204, w: 127, h: 127},
	{asset: 'DirtBike_WheelFront0000.png', x: 664, y: 204, w: 127, h: 127},
	{asset: 'DirtBike_WheelSupport0000.png', x: 460, y: 234, w: 136, h: 48},
	{asset: 'DirtBike_Axis0000.png', x: 664, y: 204, w: 40, h: 73},
	{asset: 'DirtBike_Body0000.png', x: 457, y: 127, w: 311, h: 159},

	{asset: 'Normal_Belly0000.png', x: 537, y: 122, r: 0.28, w: 83, h: 50},

	{asset: 'Normal_Thigh0000.png', x: 541, y: 177, r: -0.70, w: 54, h: 88},
	{asset: 'Normal_Leg0000.png', x: 592, y: 200, r: 0.3, w: 49, h: 72},
	{asset: 'Normal_Feet0000.png', x: 575, y: 262, w: 64, h: 21},

	{asset: 'Normal_Core0000.png', x: 541, y: 37, r: 0.28, w: 121, h: 113},

	{asset: 'Normal_Shoulder0000.png', x: 563, y: 84, r: -0.5, w: 41, h: 70},
	{asset: 'Normal_Arm0000.png', x: 600, y: 143, r: -1.5, w: 36, h: 57},
	{asset: 'Normal_Hand0000.png', x: 642, y: 154, r: -1.7, w: 39, h: 35},

	{asset: 'Normal_Head_Idle0000.png', x: 558, y: -14, r: 0.05, w: 96, h: 96},
	{asset: 'Mouth_Idle0000.png', x: 595, y: 46, r: 0.05, w: 42, h: 30},
	{asset: 'Normal_Eye0000.png', x: 596, y: 23, r: 0.05, w: 22, h: 22},
	{asset: 'Normal_Eye0000.png', x: 618, y: 24, r: 0.05, w: 22, h: 22},
	{asset: 'masks0000.png', x: 558, y: -14, r: 0.05, w: 96, h: 96},
	{asset: 'DirtBikeHelmet0000.png', x: 564, y: -10, w: 78, h: 91},

	// Skateboard
	{asset: 'Normal_Thigh0000.png', x: 931, y: 187, r: -0.4, w: 54, h: 88},
	{asset: 'Normal_Leg0000.png', x: 972, y: 223, r: 0.7, w: 49, h: 72},
	{asset: 'Normal_Feet0000.png', x: 922, y: 282, w: 64, h: 21},

	{asset: 'SkateBoard_Board0000.png', x: 914, y: 291, w: 139, h: 32},
	{asset: 'Skateboard_Wheel0000.png', x: 928, y: 310, w: 20, h: 20},
	{asset: 'Skateboard_Wheel0000.png', x: 1020, y: 310, w: 20, h: 20},

	{asset: 'Normal_Belly0000.png', x: 937, y: 142, r: 0.28, w: 83, h: 50},

	{asset: 'Normal_Thigh0000.png', x: 941, y: 187, r: -0.5, w: 54, h: 88},
	{asset: 'Normal_Leg0000.png', x: 985, y: 220, r: 0.4, w: 49, h: 72},
	{asset: 'Normal_Feet0000.png', x: 958, y: 282, w: 64, h: 21},

	{asset: 'Normal_Shoulder0000.png', x: 971, y: 95, r: 0, w: 41, h: 70},
	{asset: 'Normal_Arm0000.png', x: 973, y: 148, r: -0.12, w: 36, h: 57},
	{asset: 'Normal_Hand0000.png', x: 971, y: 181, r: 0, w: 39, h: 35},

	{asset: 'Normal_Core0000.png', x: 941, y: 57, r: 0.28, w: 121, h: 113},

	{asset: 'Normal_Shoulder0000.png', x: 963, y: 97, r: 0, w: 41, h: 70},
	{asset: 'Normal_Arm0000.png', x: 965, y: 150, r: -0.05, w: 36, h: 57},
	{asset: 'Normal_Hand0000.png', x: 960, y: 183, r: 0, w: 39, h: 35},

	{asset: 'Normal_Head_Idle0000.png', x: 958, y: 1, r: 0.05, w: 96, h: 96},
	{asset: 'Mouth_Idle0000.png', x: 995, y: 61, r: 0.05, w: 42, h: 30},
	{asset: 'Normal_Eye0000.png', x: 996, y: 38, r: 0.05, w: 22, h: 22},
	{asset: 'Normal_Eye0000.png', x: 1018, y: 39, r: 0.05, w: 22, h: 22},
	{asset: 'masks0000.png', x: 958, y: 1, r: 0.05, w: 96, h: 96},

	// Yogaball
	{asset: 'Normal_Thigh0000.png', x: 1335, y: 193, r: -0.81, w: 54, h: 88},

	{asset: 'YogaBallHandle_Back0000.png', x: 1400, y: 160, r: 0.4, w: 15, h: 34},
	{asset: 'YogaBall0000.png', x: 1330, y: 155, r: 0.4, w: 155, h: 155},
	{asset: 'YogaBall_Handle_Front0000.png', x: 1387, y: 157, r: 0.3, w: 15, h: 34},

	{asset: 'Normal_Belly0000.png', x: 1327, y: 135, r: 0.28, w: 83, h: 50},

	{asset: 'Normal_Thigh0000.png', x: 1331, y: 195, r: -0.75, w: 54, h: 88},
	{asset: 'Normal_Leg0000.png', x: 1382, y: 213, r: 0.35, w: 49, h: 72},
	{asset: 'Normal_Feet0000.png', x: 1360, y: 275, r: 0.1, w: 64, h: 21},

	{asset: 'Normal_Arm0000.png', x: 1345, y: 152, r: -1.2, w: 36, h: 57},
	{asset: 'Normal_Hand0000.png', x: 1375, y: 168, r: -1.0, w: 39, h: 35},

	{asset: 'Normal_Core0000.png', x: 1331, y: 50, r: 0.28, w: 121, h: 113},

	{asset: 'Normal_Shoulder0000.png', x: 1363, y: 77, r: 0.5, w: 41, h: 70},
	{asset: 'Normal_Arm0000.png', x: 1340, y: 152, r: -1.2, w: 36, h: 57},
	{asset: 'Normal_Hand0000.png', x: 1370, y: 168, r: -1.0, w: 39, h: 35},

	{asset: 'Normal_Head_Idle0000.png', x: 1348, y: -1, r: 0.05, w: 96, h: 96},
	{asset: 'Mouth_Idle0000.png', x: 1385, y: 59, r: 0.05, w: 42, h: 30},
	{asset: 'Normal_Eye0000.png', x: 1386, y: 36, r: 0.05, w: 22, h: 22},
	{asset: 'Normal_Eye0000.png', x: 1408, y: 37, r: 0.05, w: 22, h: 22},
	{asset: 'masks0000.png', x: 1348, y: -1, r: 0.05, w: 96, h: 96},

	// Foddycan
	{asset: 'Hammer_20000.png', x: 1723, y: 297, r: -0.08, w: 271, h: 54},
	{asset: 'Pot_20000.png', x: 1786, y: 277, r: -1.05, w: 139, h: 161},

	{asset: 'Normal_Arm0000.png', x: 1683, y: 172, r: -1.2, w: 36, h: 57},
	{asset: 'Normal_Hand0000.png', x: 1720, y: 195, r: -1.4, w: 39, h: 35},

	{asset: 'Normal_Core0000.png', x: 1636, y: 80, w: 121, h: 113},
	{asset: 'Pot0000.png', x: 1626, y: 172, w: 139, h: 161},
	{asset: 'Hammer0000.png', x: 1685, y: 168, r: -0.3, w: 271, h: 54},

	{asset: 'Normal_Shoulder0000.png', x: 1680, y: 95, r: 0.5, w: 41, h: 70},
	{asset: 'Normal_Arm0000.png', x: 1653, y: 168, r: -1.0, w: 36, h: 57},
	{asset: 'Normal_Hand0000.png', x: 1690, y: 201, r: -1.4, w: 39, h: 35},

	{asset: 'Normal_Head_Idle0000.png', x: 1650, y: 9, r: 0.05, w: 96, h: 96},
	{asset: 'Mouth_Idle0000.png', x: 1686, y: 69, r: 0.05, w: 42, h: 30},
	{asset: 'Normal_Eye0000.png', x: 1687, y: 46, r: 0.05, w: 22, h: 22},
	{asset: 'Normal_Eye0000.png', x: 1709, y: 47, r: 0.05, w: 22, h: 22},
	{asset: 'masks0000.png', x: 1650, y: 9, r: 0.05, w: 96, h: 96},
]

const wardrobe_path = "./mod/wardrobe/"
const wardrobe_features = [
	// Skintones
	[
		{
			thumb: "Normal_Head_Idle0001.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0001.png"],
				["Normal_Hand0000.png", "Normal_Hand0001.png"],
				["Normal_Arm0000.png", "Normal_Arm0001.png"],
				["Normal_Shoulder0000.png", "Normal_Shoulder0001.png"],
				["Normal_Belly0000.png", "Normal_Belly0001.png"],
				["Normal_Leg0000.png", "Normal_Leg0001.png"],
				["Normal_Thigh0000.png", "Normal_Thigh0001.png"],
				["Normal_Eye0000.png", "Normal_Eye0001.png"],
				["Normal_Eye_Closed0000.png", "Normal_Eye_Closed0001.png"],
				["Normal_Core0000.png", "Normal_Core0001.png"]
			]
		},
		{
			thumb: "Normal_Head_Idle0002.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0002.png"],
				["Normal_Hand0000.png", "Normal_Hand0002.png"],
				["Normal_Arm0000.png", "Normal_Arm0002.png"],
				["Normal_Shoulder0000.png", "Normal_Shoulder0002.png"],
				["Normal_Belly0000.png", "Normal_Belly0002.png"],
				["Normal_Leg0000.png", "Normal_Leg0002.png"],
				["Normal_Thigh0000.png", "Normal_Thigh0002.png"],
				["Normal_Eye0000.png", "Normal_Eye0002.png"],
				["Normal_Eye_Closed0000.png", "Normal_Eye_Closed0002.png"],
				["Normal_Core0000.png", "Normal_Core0002.png"]
			]
		},
		{
			thumb: "Normal_Head_Idle0003.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0003.png"],
				["Normal_Hand0000.png", "Normal_Hand0003.png"],
				["Normal_Arm0000.png", "Normal_Arm0003.png"],
				["Normal_Shoulder0000.png", "Normal_Shoulder0003.png"],
				["Normal_Belly0000.png", "Normal_Belly0003.png"],
				["Normal_Leg0000.png", "Normal_Leg0003.png"],
				["Normal_Thigh0000.png", "Normal_Thigh0003.png"],
				["Normal_Eye0000.png", "Normal_Eye0003.png"],
				["Normal_Eye_Closed0000.png", "Normal_Eye_Closed0003.png"],
				["Normal_Core0000.png", "Normal_Core0003.png"]
			]
		},
		{
			thumb: "Normal_Head_Idle0004.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0004.png"],
				["Normal_Hand0000.png", "Normal_Hand0004.png"],
				["Normal_Arm0000.png", "Normal_Arm0004.png"],
				["Normal_Shoulder0000.png", "Normal_Shoulder0004.png"],
				["Normal_Belly0000.png", "Normal_Belly0004.png"],
				["Normal_Leg0000.png", "Normal_Leg0004.png"],
				["Normal_Thigh0000.png", "Normal_Thigh0004.png"],
				["Normal_Eye0000.png", "Normal_Eye0004.png"],
				["Normal_Eye_Closed0000.png", "Normal_Eye_Closed0004.png"],
				["Normal_Core0000.png", "Normal_Core0004.png"]
			]
		},
		{
			thumb: "Normal_Head_Idle1000.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle1000.png"],
				["Normal_Hand0000.png", "Normal_Hand1000.png"],
				["Normal_Arm0000.png", "Normal_Arm1000.png"],
				["Normal_Shoulder0000.png", "Normal_Shoulder1000.png"],
				["Normal_Belly0000.png", "Normal_Belly1000.png"],
				["Normal_Leg0000.png", "Normal_Leg1000.png"],
				["Normal_Thigh0000.png", "Normal_Thigh1000.png"],
				["Normal_Eye0000.png", "Normal_Eye1000.png"],
				["Normal_Eye_Closed0000.png", "Normal_Eye_Closed1000.png"],
				["Normal_Core0000.png", "Normal_Core1000.png"],
			]
		},
		{
			thumb: "Normal_Head_Idle1001.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle1001.png"],
				["Normal_Hand0000.png", "Normal_Hand1001.png"],
				["Normal_Arm0000.png", "Normal_Arm1001.png"],
				["Normal_Shoulder0000.png", "Normal_Shoulder1001.png"],
				["Normal_Belly0000.png", "Normal_Belly1001.png"],
				["Normal_Leg0000.png", "Normal_Leg1001.png"],
				["Normal_Thigh0000.png", "Normal_Thigh1001.png"],
				["Normal_Eye0000.png", "Normal_Eye1001.png"],
				["Normal_Eye_Closed0000.png", "Normal_Eye_Closed1001.png"],
				["Normal_Core0000.png", "Normal_Core1001.png"],
			]
		},
		{
			thumb: "Normal_Head_Idle1002.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle1002.png"],
				["Normal_Hand0000.png", "Normal_Hand1002.png"],
				["Normal_Arm0000.png", "Normal_Arm1002.png"],
				["Normal_Shoulder0000.png", "Normal_Shoulder1002.png"],
				["Normal_Belly0000.png", "Normal_Belly1002.png"],
				["Normal_Leg0000.png", "Normal_Leg1002.png"],
				["Normal_Thigh0000.png", "Normal_Thigh1002.png"],
				["Normal_Eye0000.png", "Normal_Eye1002.png"],
				["Normal_Eye_Closed0000.png", "Normal_Eye_Closed1002.png"],
				["Normal_Core0000.png", "Normal_Core1002.png"],
			]
		},
		{
			thumb: "Normal_Head_Idle1003.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle1003.png"],
				["Normal_Hand0000.png", "Normal_Hand1003.png"],
				["Normal_Arm0000.png", "Normal_Arm1003.png"],
				["Normal_Shoulder0000.png", "Normal_Shoulder1003.png"],
				["Normal_Belly0000.png", "Normal_Belly1003.png"],
				["Normal_Leg0000.png", "Normal_Leg1003.png"],
				["Normal_Thigh0000.png", "Normal_Thigh1003.png"],
				["Normal_Eye0000.png", "Normal_Eye1003.png"],
				["Normal_Eye_Closed0000.png", "Normal_Eye_Closed1003.png"],
				["Normal_Core0000.png", "Normal_Core1003.png"],
			]
		},
		{
			thumb: "Normal_Head_Idle1004.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle1004.png"],
				["Normal_Hand0000.png", "Normal_Hand1004.png"],
				["Normal_Arm0000.png", "Normal_Arm1004.png"],
				["Normal_Shoulder0000.png", "Normal_Shoulder1004.png"],
				["Normal_Belly0000.png", "Normal_Belly1004.png"],
				["Normal_Leg0000.png", "Normal_Leg1004.png"],
				["Normal_Thigh0000.png", "Normal_Thigh1004.png"],
				["Normal_Eye0000.png", "Normal_Eye1004.png"],
				["Normal_Eye_Closed0000.png", "Normal_Eye_Closed1004.png"],
				["Normal_Core0000.png", "Normal_Core1004.png"],
			]
		},
		{
			thumb: "Normal_Head_Idle1005.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle1005.png"],
				["Normal_Hand0000.png", "Normal_Hand1005.png"],
				["Normal_Arm0000.png", "Normal_Arm1005.png"],
				["Normal_Shoulder0000.png", "Normal_Shoulder1005.png"],
				["Normal_Belly0000.png", "Normal_Belly1005.png"],
				["Normal_Leg0000.png", "Normal_Leg1005.png"],
				["Normal_Thigh0000.png", "Normal_Thigh1005.png"],
				["Normal_Eye0000.png", "Normal_Eye1005.png"],
				["Normal_Eye_Closed0000.png", "Normal_Eye_Closed1005.png"],
				["Normal_Core0000.png", "Normal_Core1005.png"],
			]
		},
		{
			thumb: "Normal_Head_Idle1006.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle1006.png"],
				["Normal_Hand0000.png", "Normal_Hand1006.png"],
				["Normal_Arm0000.png", "Normal_Arm1006.png"],
				["Normal_Shoulder0000.png", "Normal_Shoulder1006.png"],
				["Normal_Belly0000.png", "Normal_Belly1006.png"],
				["Normal_Leg0000.png", "Normal_Leg1006.png"],
				["Normal_Thigh0000.png", "Normal_Thigh1006.png"],
				["Normal_Eye0000.png", "Normal_Eye1006.png"],
				["Normal_Eye_Closed0000.png", "Normal_Eye_Closed1006.png"],
				["Normal_Core0000.png", "Normal_Core1006.png"],
			]
		},
	],
	// Nose
	[
		{
			thumb: "empty.png",
			overwrite: []
		},
		{
			thumb: "Normal_Head_Nose0000.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Nose0000.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Nose0001.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Nose0001.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Nose0002.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Nose0002.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Nose0003.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Nose0003.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Nose0004.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Nose0004.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Nose0005.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Nose0005.png", 1]
			]
		}
	],
	// Mouth
	[
		{
			thumb: "empty.png",
			overwrite: [
				["Mouth_Idle0000.png", "Mouth_Idle9998.png"]
			]
		},
		{
			thumb: "Mouth_Idle0000.png",
			overwrite: [
				["Mouth_Idle0000.png", "Mouth_Idle0000.png"]
			]
		},
		{
			thumb: "Mouth_Idle0001.png",
			overwrite: [
				["Mouth_Idle0000.png", "Mouth_Idle0001.png"]
			]
		},
		{
			thumb: "Mouth_Idle0002.png",
			overwrite: [
				["Mouth_Idle0000.png", "Mouth_Idle0002.png"]
			]
		},
		{
			thumb: "Mouth_Idle0003.png",
			overwrite: [
				["Mouth_Idle0000.png", "Mouth_Idle0003.png"]
			]
		},
		{
			thumb: "Mouth_Idle0004.png",
			overwrite: [
				["Mouth_Idle0000.png", "Mouth_Idle0004.png"]
			]
		},
		{
			thumb: "Mouth_Idle0005.png",
			overwrite: [
				["Mouth_Idle0000.png", "Mouth_Idle0005.png"]
			]
		},
		{
			thumb: "Mouth_Idle0006.png",
			overwrite: [
				["Mouth_Idle0000.png", "Mouth_Idle0006.png"]
			]
		},
		{
			thumb: "Mouth_Idle0007.png",
			overwrite: [
				["Mouth_Idle0000.png", "Mouth_Idle0007.png"]
			]
		},
		{
			thumb: "Mouth_Idle0008.png",
			overwrite: [
				["Mouth_Idle0000.png", "Mouth_Idle0008.png"]
			]
		}
	],
	// Eyes
	[
		{
			thumb: "empty.png",
			overwrite: [
				["Normal_Eye0000.png", "Normal_Eye9998.png"]
			]
		},
		{
			thumb: "Normal_Eye0005.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle9998.png", 1],
				["Normal_Eye0000.png", "Normal_Eye0005.png", 1]
			]
		},
		{
			thumb: "Normal_Eye0006.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle9998.png", 1],
				["Normal_Eye0000.png", "Normal_Eye0006.png", 1]
			]
		},
		{
			thumb: "Normal_Eye0007.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle9998.png", 1],
				["Normal_Eye0000.png", "Normal_Eye0007.png", 1]
			]
		},
		{
			thumb: "Normal_Eye0012.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle9998.png", 1],
				["Normal_Eye0000.png", "Normal_Eye0012.png", 1]
			]
		},
		{
			thumb: "Normal_Eye0008.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle9998.png", 1],
				["Normal_Eye0000.png", "Normal_Eye0008.png", 1]
			]
		},
		{
			thumb: "Normal_Eye0009.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle9998.png", 1],
				["Normal_Eye0000.png", "Normal_Eye0009.png", 1]
			]
		},
		{
			thumb: "Normal_Eye0010.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle9998.png", 1],
				["Normal_Eye0000.png", "Normal_Eye0010.png", 1]
			]
		},
		{
			thumb: "Normal_Eye0014.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle9998.png", 1],
				["Normal_Eye0000.png", "Normal_Eye0014.png", 1]
			]
		},
		{
			thumb: "Normal_Eye0015.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle9998.png", 1],
				["Normal_Eye0000.png", "Normal_Eye0015.png", 1]
			]
		},
		{
			thumb: "Normal_Eye0013.png",
			overwrite: [
				["Normal_Eye0000.png", "Normal_Eye0013.png"],
				["Normal_Eye_Closed0000.png", "Normal_Eye_Closed0005.png"],
			]
		},
		{
			thumb: "Normal_Eye0016.png",
			overwrite: [
				["Normal_Eye0000.png", "Normal_Eye0016.png"],
				["Normal_Eye_Closed0000.png", "Normal_Eye_Closed0005.png"],
			]
		}
	],
	// Hair
	[
		{
			thumb: "empty.png",
			overwrite: []
		},
		{
			thumb: "Normal_Head_Idle0005.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0005.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0006.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0006.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0007.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0007.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0008.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0008.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0009.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0009.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0010.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0010.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0011.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0011.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0012.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0012.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0013.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0013.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0014.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0014.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0015.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0015.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0017.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0017.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0018.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0018.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0019.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0019.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0020.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0020.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0021.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0021.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0022.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0022.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0023.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0023.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0024.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0024.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0025.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0025.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0026.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0026.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0027.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0027.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0028.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0028.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0029.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0029.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0030.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0030.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0031.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0031.png", 1]
			]
		},
		{
			thumb: "Normal_Head_Idle0032.png",
			overwrite: [
				["Normal_Head_Idle0000.png", "Normal_Head_Idle0032.png", 1]
			]
		}
	],
	// Pants
	[
		{
			thumb: "Normal_Belly0011.png",
			overwrite: [
				["Normal_Belly0000.png", "Normal_Belly0011.png"],
				["Normal_Leg0000.png", "Normal_Leg0014.png"],
				["Normal_Thigh0000.png", "Normal_Thigh0011.png"]
			]
		},
		{
			thumb: "Normal_Belly0005.png",
			overwrite: [
				["Normal_Belly0000.png", "Normal_Belly0005.png"],
				["Normal_Leg0000.png", "Normal_Leg0005.png"],
				["Normal_Thigh0000.png", "Normal_Thigh0005.png"]
			]
		},
		{
			thumb: "Normal_Belly0006.png",
			overwrite: [
				["Normal_Belly0000.png", "Normal_Belly0006.png"],
				["Normal_Leg0000.png", "Normal_Leg0006.png"],
				["Normal_Thigh0000.png", "Normal_Thigh0006.png"]
			]
		},
		{
			thumb: "Normal_Belly0007.png",
			overwrite: [
				["Normal_Belly0000.png", "Normal_Belly0007.png"],
				["Normal_Leg0000.png", "Normal_Leg0007.png"],
				["Normal_Thigh0000.png", "Normal_Thigh0007.png"]
			]
		},
		{
			thumb: "Normal_Belly0008.png",
			overwrite: [
				["Normal_Belly0000.png", "Normal_Belly0008.png"],
				["Normal_Leg0000.png", "Normal_Leg0008.png"],
				["Normal_Thigh0000.png", "Normal_Thigh0008.png"]
			]
		},
		{
			thumb: "Normal_Belly0009.png",
			overwrite: [
				["Normal_Belly0000.png", "Normal_Belly0009.png"],
				["Normal_Leg0000.png", "Normal_Leg0009.png"],
				["Normal_Thigh0000.png", "Normal_Thigh0009.png"]
			]
		},
		{
			thumb: "Normal_Leg0010.png",
			overwrite: [
				["Normal_Belly0000.png", "Normal_Belly0008.png"],
				["Normal_Leg0000.png", "Normal_Leg0010.png", 1],
				["Normal_Thigh0000.png", "Normal_Thigh0008.png"]
			]
		},
		{
			thumb: "Normal_Leg0011.png",
			overwrite: [
				["Normal_Belly0000.png", "Normal_Belly0007.png"],
				["Normal_Leg0000.png", "Normal_Leg0011.png", 1],
				["Normal_Thigh0000.png", "Normal_Thigh0007.png"]
			]
		},
		{
			thumb: "Normal_Belly0010.png",
			overwrite: [
				["Normal_Belly0000.png", "Normal_Belly0010.png"],
				["Normal_Thigh0000.png", "Normal_Thigh0010.png", 1]
			]
		}
	],
	// Shoes
	[
		{
			thumb: "Normal_Feet0005.png",
			overwrite: [
				["Normal_Feet0000.png", "Normal_Feet0005.png"]
			]
		},
		{
			thumb: "Normal_Feet0001.png",
			overwrite: [
				["Normal_Feet0000.png", "Normal_Feet0001.png"]
			]
		},
		{
			thumb: "Normal_Feet0002.png",
			overwrite: [
				["Normal_Feet0000.png", "Normal_Feet0002.png"]
			]
		},
		{
			thumb: "Normal_Feet0003.png",
			overwrite: [
				["Normal_Feet0000.png", "Normal_Feet0003.png"]
			]
		},
		{
			thumb: "Normal_Feet0004.png",
			overwrite: [
				["Normal_Feet0000.png", "Normal_Feet0004.png"]
			]
		}
	],
	// Top
	[
		{
			thumb: "Normal_Core0020.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0020.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0020.png", 1]
			]
		},
		{
			thumb: "Normal_Core0005.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0005.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0005.png", 1]
			]
		},
		{
			thumb: "Normal_Core0006.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0006.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0006.png", 1]
			]
		},
		{
			thumb: "Normal_Core0007.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0007.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0007.png", 1]
			]
		},
		{
			thumb: "Normal_Core0008.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0008.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0008.png", 1]
			]
		},
		{
			thumb: "Normal_Core0009.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0009.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0009.png", 1]
			]
		},
		{
			thumb: "Normal_Core0010.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0010.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0010.png", 1]
			]
		},
		{
			thumb: "Normal_Core0011.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0011.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0011.png", 1]
			]
		},
		{
			thumb: "Normal_Core0012.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0012.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0012.png", 1]
			]
		},
		{
			thumb: "Normal_Core0013.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0013.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0013.png", 1]
			]
		},
		{
			thumb: "Normal_Core0014.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0014.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0014.png", 1]
			]
		},
		{
			thumb: "Normal_Core0015.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0015.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0015.png", 1]
			]
		},
		{
			thumb: "Normal_Core0016.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0016.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0016.png", 1]
			]
		},
		{
			thumb: "Normal_Core0017.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0017.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0017.png", 1]
			]
		},
		{
			thumb: "Normal_Core0018.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0018.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0018.png", 1]
			]
		},
		{
			thumb: "Normal_Core0019.png",
			overwrite: [
				["Normal_Core0000.png", "Normal_Core0019.png", 1],
				["Normal_Shoulder0000.png", "Normal_Shoulder0019.png", 1]
			]
		}
	],
	// Masks
	[
		{
			thumb: "empty.png",
			overwrite: []
		},
		{
			thumb: "masks0000.png",
			overwrite: [
				["masks0000.png", "masks0000.png"]
			]
		},
		{
			thumb: "masks0001.png",
			overwrite: [
				["masks0000.png", "masks0001.png"]
			]
		},
		{
			thumb: "masks0002.png",
			overwrite: [
				["masks0000.png", "masks0002.png"]
			]
		},
		{
			thumb: "masks0003.png",
			overwrite: [
				["masks0000.png", "masks0003.png"],
			]
		},
		{
			thumb: "masks0004.png",
			overwrite: [
				["masks0000.png", "masks0004.png"],
			]
		},
		{
			thumb: "masks0005.png",
			overwrite: [
				["masks0000.png", "masks0005.png"]
			]
		},
		{
			thumb: "masks0006.png",
			overwrite: [
				["masks0000.png", "masks0006.png"]
			]
		},
		{
			thumb: "masks0007.png",
			overwrite: [
				["masks0000.png", "masks0007.png"]
			]
		},
		{
			thumb: "masks0008.png",
			overwrite: [
				["masks0000.png", "masks0008.png"]
			]
		},
		{
			thumb: "masks0009.png",
			overwrite: [
				["masks0000.png", "masks0009.png"]
			]
		},
		{
			thumb: "masks0010.png",
			overwrite: [
				["masks0000.png", "masks0010.png"]
			]
		},
		{
			thumb: "masks0011.png",
			overwrite: [
				["masks0000.png", "masks0011.png"]
			]
		},
		{
			thumb: "masks0012.png",
			overwrite: [
				["masks0000.png", "masks0012.png"]
			]
		},
		{
			thumb: "masks0013.png",
			overwrite: [
				["masks0000.png", "masks0013.png"]
			]
		},
		{
			thumb: "masks0014.png",
			overwrite: [
				["masks0000.png", "masks0014.png"]
			]
		},
		{
			thumb: "masks0015.png",
			overwrite: [
				["masks0000.png", "masks0015.png"]
			]
		},
		{
			thumb: "masks0016.png",
			overwrite: [
				["masks0000.png", "masks0016.png"]
			]
		},
		{
			thumb: "masks0017.png",
			overwrite: [
				["masks0000.png", "masks0017.png"]
			]
		},
		{
			thumb: "masks0018.png",
			overwrite: [
				["masks0000.png", "masks0018.png"]
			]
		},
		{
			thumb: "masks0019.png",
			overwrite: [
				["masks0000.png", "masks0019.png"]
			]
		},
		{
			thumb: "masks0020.png",
			overwrite: [
				["masks0000.png", "masks0020.png"]
			]
		},
		{
			thumb: "masks0021.png",
			overwrite: [
				["masks0000.png", "masks0021.png"]
			]
		},
		{
			thumb: "masks0022.png",
			overwrite: [
				["masks0000.png", "masks0022.png"]
			]
		},
		{
			thumb: "masks0023.png",
			overwrite: [
				["masks0000.png", "masks0023.png"]
			]
		},
		{
			thumb: "masks0024.png",
			overwrite: [
				["masks0000.png", "masks0024.png"]
			]
		},
		{
			thumb: "masks0025.png",
			overwrite: [
				["masks0000.png", "masks0025.png"]
			]
		},
		{
			thumb: "masks0026.png",
			overwrite: [
				["masks0000.png", "masks0026.png"]
			]
		},
		{
			thumb: "masks0027.png",
			overwrite: [
				["masks0000.png", "masks0027.png"]
			]
		}
	],
	// Bicycle Body
	[
		{
			thumb: "Bicycle_Body0000.png",
			overwrite: [
				["Bicycle_Body0000.png", "Bicycle_Body0000.png"]
			]
		},
		{
			thumb: "Bicycle_Body0001.png",
			overwrite: [
				["Bicycle_Body0000.png", "Bicycle_Body0001.png"]
			]
		},
		{
			thumb: "Bicycle_Body0002.png",
			overwrite: [
				["Bicycle_Body0000.png", "Bicycle_Body0002.png"]
			]
		},
		{
			thumb: "Bicycle_Body0003.png",
			overwrite: [
				["Bicycle_Body0000.png", "Bicycle_Body0003.png"]
			]
		},
		{
			thumb: "Bicycle_Body0004.png",
			overwrite: [
				["Bicycle_Body0000.png", "Bicycle_Body0004.png"]
			]
		}
	],
	// Motorbike
	[
		{
			thumb: "DirtBike_Body0000.png",
			overwrite: [
				["DirtBike_Body0000.png", "DirtBike_Body0000.png"],
				["DirtBikeHelmet0000.png", "DirtBikeHelmet0000.png"],
				["DirtBike_WheelSupport0000.png", "DirtBike_WheelSupport0000.png"]
			]
		},
		{
			thumb: "DirtBike_Body0001.png",
			overwrite: [
				["DirtBike_Body0000.png", "DirtBike_Body0001.png"],
				["DirtBikeHelmet0000.png", "DirtBikeHelmet0001.png"],
				["DirtBike_WheelSupport0000.png", "DirtBike_WheelSupport0001.png"]
			]
		}
	],
	// Skateboard
	[
		{
			thumb: "SkateBoard_Board0000.png",
			overwrite: [
				["SkateBoard_Board0000.png", "SkateBoard_Board0000.png"],
				["Skateboard_Wheel0000.png", "Skateboard_Wheel0000.png"]
			]
		},
		{
			thumb: "SkateBoard_Board0001.png",
			overwrite: [
				["SkateBoard_Board0000.png", "SkateBoard_Board0001.png"],
				["Skateboard_Wheel0000.png", "Skateboard_Wheel0001.png"]
			]
		},
		{
			thumb: "SkateBoard_Board0002.png",
			overwrite: [
				["SkateBoard_Board0000.png", "SkateBoard_Board0002.png"],
				["Skateboard_Wheel0000.png", "Skateboard_Wheel0000.png"]
			]
		}
	],
	// Skippyball
	[
		{
			thumb: "YogaBall0000.png",
			overwrite: [
				["YogaBall0000.png", "YogaBall0000.png"],
				["YogaBallHandle_Back0000.png", "YogaBallHandle_Back0000.png"],
				["YogaBall_Handle_Front0000.png", "YogaBall_Handle_Front0000.png"]
			]
		},
		{
			thumb: "YogaBall0001.png",
			overwrite: [
				["YogaBall0000.png", "YogaBall0001.png"],
				["YogaBallHandle_Back0000.png", "YogaBallHandle_Back0001.png"],
				["YogaBall_Handle_Front0000.png", "YogaBall_Handle_Front0001.png"]
			]
		},
		{
			thumb: "YogaBall0002.png",
			overwrite: [
				["YogaBall0000.png", "YogaBall0002.png"],
				["YogaBallHandle_Back0000.png", "YogaBallHandle_Back0002.png"],
				["YogaBall_Handle_Front0000.png", "YogaBall_Handle_Front0002.png"]
			]
		},
		{
			thumb: "YogaBall0003.png",
			overwrite: [
				["YogaBall0000.png", "YogaBall0003.png"],
				["YogaBallHandle_Back0000.png", "YogaBallHandle_Back0003.png"],
				["YogaBall_Handle_Front0000.png", "YogaBall_Handle_Front0003.png"]
			]
		}
	],
	// Foddycan
	[
		{
			thumb: "Pot0000.png",
			overwrite: [
				["Pot0000.png", "Pot0000.png"],
				["Hammer0000.png", "Hammer0000.png"]
			]
		},
		{
			thumb: "Pot0001.png",
			overwrite: [
				["Pot0000.png", "Pot0001.png"],
				["Hammer0000.png", "Hammer0000.png"]
			]
		},
		{
			thumb: "Pot0002.png",
			overwrite: [
				["Pot0000.png", "Pot0002.png"],
				["Hammer0000.png", "Hammer0001.png"]
			]
		}
	],
]

const gore_path = "./mod/jollymod/gore/chunks/billyjoel/"
const gore_item_paths = [
	"Normal_Arm_Gore10000.png",
	"Normal_Belly_Gore10000.png",
	"Normal_Core_Gore10000.png",
	"Normal_Core_Gore20000.png",
	"Normal_Head_Gore10000.png",
	"Normal_Head_Gore20000.png",
	"Normal_Leg_Gore10000.png",
	"Normal_Shoulder_Gore10000.png",
	"Normal_Thigh_Gore10000.png",
];
const gore_item_imgs = [0,0,0,0,0,0,0,0,0,0];
