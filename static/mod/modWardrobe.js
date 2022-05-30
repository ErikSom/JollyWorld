var current_wardrobe_page;
var current_wardrobe_vehicle;
function openModWardrobe() {
	lockScrolling()
	document.querySelectorAll('.wardrobeitemselected').forEach((item) => item.classList.remove('wardrobeitemselected'))
	$('modwardrobefinal').style.display = 'none'
	$('modwardrobestepcounter').style.display = 'block'
	$('modwardrobepreviewcanvas').style.animation = ''
	document.querySelectorAll('.vehiclePreviewButton').forEach((elem) => elem.style.display = 'inline-block')
	wardrobe_saved_states = []

	current_wardrobe_page = 0;
	viewSetVehicle(0)
	loadWardrobeContents();

	$('modwardrobewindow').style.top = "0px";
	$('modwardrobewindow').style.opacity = 1;
	$('modwardrobewindow').style.display = 'block';
}
function closeModWardrobe() {
	unlockScrolling();
	$('modwardrobewindow').style.top = "100vh";
	$('modwardrobewindow').style.opacity = 0
	setTimeout(function() {
		$('modwardrobewindow').style.display = 'none'
	}, 400)
}

function updateWardrobePreview() {
	$('modwardrobepreviewcanvas').style.backgroundImage = 'url(' + generateModPreview(all_asset_imgs, all_wardrobe_modified_imgs).toDataURL() + ')'
}

var modWardrobeDoorColor;
var modWardrobePreloaderColor;
var modWardrobeCharacterName;
function initWardrobe() {
	sendDefaultChar()
	$('modwardrobetotalsteps').innerText = total_wardrobe_steps

	current_wardrobe_page = -1;
	modWardrobeDoorColor = '#3d7d1e';
	$('doorcolor').value = modWardrobeDoorColor;
	modWardrobePreloaderColor = '#d70201';
	$('preloadercolor').value = modWardrobePreloaderColor;
	modWardrobeCharacterName = 'Billy Joel';

	$('modwardrobeadditionalsettingsbutton').style.display = 'block';
	$('modwardrobeadditionalsettings').style.display = 'none';

	nextWardrobePage();

	all_wardrobe_modified_imgs = {}

	const valid_files = [];
	all_asset_paths.forEach((key) => {
		valid_files.push(key.split("/")[key.split("/").length - 1])
	})
	const all_keys = Object.keys(all_asset_imgs)
	all_keys.forEach((key) => {
		if (valid_files.includes(key)) {
			all_wardrobe_modified_imgs[key] = all_asset_imgs[key];
		}
	})

	setTimeout(updateWardrobePreview, 50)
}

var loaded_wardrobe = false;
function loadWardrobeContents() {
	if (loaded_wardrobe) {
		initWardrobe()
	} else {
		// Turn all the gore into images
		for (var i = 0; i < gore_item_paths.length; i ++) {
			const img = new Image()
			img.src = gore_path + gore_item_paths[i];
			img.num = i;
			img.onload = function() {
				const cvs = document.createElement('canvas');
				const ctx = cvs.getContext('2d');
				cvs.width = this.width;
				cvs.height = this.height;
				ctx.drawImage(this, 0, 0)
				gore_item_imgs[this.num] = cvs.toDataURL().split(',')[1];
			}
		}
		
		loaded_wardrobe = true;
	}
}

var wardrobe_saved_states = []

function wardrobeSaveState() {
	var saved_data = {}
	const all_wardrobe_keys = Object.keys(all_wardrobe_modified_imgs)
	for (var item = 0; item < all_wardrobe_keys.length; item ++) {
		var img = all_wardrobe_modified_imgs[all_wardrobe_keys[item]]
		if (!img instanceof HTMLImageElement) {
			img = img.toDataURL()
		}
		saved_data[all_wardrobe_keys[item]] = all_wardrobe_modified_imgs[all_wardrobe_keys[item]];
	}
	wardrobe_saved_states.push(saved_data)
}
function wardrobeLoadState() {
	const all_wardrobe_keys = Object.keys(all_asset_imgs)
	const loaded_state = wardrobe_saved_states.pop()
	for (var item = 0; item < all_wardrobe_keys.length; item ++) {
		var img = new Image();
		if (loaded_state[all_wardrobe_keys[item]] instanceof HTMLImageElement) {
			img = loaded_state[all_wardrobe_keys[item]];
		} else {
			img.src = loaded_state[all_wardrobe_keys[item]].toDataURL();
		}
		all_wardrobe_modified_imgs[all_wardrobe_keys[item]] = img;
	}
	setTimeout(function() {
		updateWardrobePreview()
	}, 100)
}

function previousWardrobePage() {
	if (current_wardrobe_page == 0) return
	wardrobeLoadState();
	current_wardrobe_page --;
	$('modwardrobestep').innerText = current_wardrobe_page + 1;
	document.querySelectorAll('.modwardrobesection').forEach((section) => section.style.display = 'none')
	if (current_wardrobe_page == total_wardrobe_steps) {
		$('modwardrobefinal').style.display = 'block';
		$('modwardrobestepcounter').style.display = 'none';
	} else {
		$('modwardrobesection' + current_wardrobe_page).style.display = 'block';
	}
}

function nextWardrobePage() {
	current_wardrobe_page ++;
	$('modwardrobestep').innerText = current_wardrobe_page + 1;
	document.querySelectorAll('.modwardrobesection').forEach((section) => section.style.display = 'none')
	try {
		$('modwardrobesection' + current_wardrobe_page).style.display = 'block';
	} catch (err) {}
	switch (current_wardrobe_page) {
		case 9:
			viewSetVehicle(0)
			break;
		case 10:
			viewSetVehicle(1)
			break;
		case 11:
			viewSetVehicle(2)
			break;
		case 12:
			viewSetVehicle(3)
			break;
		case 13:
			viewSetVehicle(4)
			break;
		case total_wardrobe_steps:
			$('modwardrobefinal').style.display = 'block';
			$('modwardrobestepcounter').style.display = 'none';
			$('modwardrobepreviewcanvas').style.animation = 'cyclethroughcharacters 8s cubic-bezier(.26,-0.01,.01,1.01) infinite'
			document.querySelectorAll('.vehiclePreviewButton').forEach((elem) => elem.style.display = 'none')
			if (!mobile_view) {
				$('confetti').play();
			}
			break;
	}
}

function viewPreviousVehicle() {
	if (current_wardrobe_vehicle > 0) {
		current_wardrobe_vehicle --;
		setVehiclePage();
	}
}
function viewNextVehicle() {
	if (current_wardrobe_vehicle < 4) {
		current_wardrobe_vehicle ++;
		setVehiclePage();
	}
}
function viewSetVehicle(num) {
	current_wardrobe_vehicle = num;
	setVehiclePage();
}
function setVehiclePage() {
	if (current_wardrobe_vehicle <= 0) {
		$('vehiclePreviewButtonLeft').style.opacity = 0.1;
	} else {
		$('vehiclePreviewButtonLeft').style.opacity = 1;
	}
	if (current_wardrobe_vehicle >= 4) {
		$('vehiclePreviewButtonRight').style.opacity = 0.1;
	} else {
		$('vehiclePreviewButtonRight').style.opacity = 1;
	}
	$('modwardrobepreviewcanvas').style.backgroundPositionX = current_wardrobe_vehicle * -400 + "px"
}

function showAdditionalSettings() {
	$('modwardrobeadditionalsettingsbutton').style.display = 'none';
	$('modwardrobeadditionalsettings').style.display = 'inline-block';
}

const total_wardrobe_steps = wardrobe_features.length;

function processWardrobe(apply, importEditor = false) {
	const zip = new JSZip();
	const main_folder = zip.folder('jollymod')
	const character_folder = main_folder.folder('characters').folder('billyjoel');
	const vehicles_folder = main_folder.folder('vehicles');
	const bike_folder = vehicles_folder.folder('bike')
	const dirtbike_folder = vehicles_folder.folder('dirtbike')
	const skateboard_folder = vehicles_folder.folder('skateboard')
	const yogaball_folder = vehicles_folder.folder('yogaball')
	const foddycan_folder = vehicles_folder.folder('foddycan')
	const masks_folder = main_folder.folder('masks');

	const gore_folder = main_folder.folder('gore');
	const chunks_folder = gore_folder.folder('chunks').folder('billyjoel')
	for (let item = 0; item < 9; item ++) {
		chunks_folder.file(gore_item_paths[item].split("/")[gore_item_paths[item].split("/").length - 1], gore_item_imgs[item], {base64: true})
	}

	const settings_json = `{
		"doorColor": "${modWardrobeDoorColor}",
		"doorPreloaderColor": "${modWardrobePreloaderColor}",
		"doorlogoURL": "https://i.imgur.com/Zz4tyyG.png",
		"charNames": ["${modWardrobeCharacterName}", "Jeroen", "Marique", "Damien", "The Zuck!", "Bob Zombie", "Xenot", "Ronda", "Jack Lee", "Col. Jackson", "Hank", "Mrs. Kat", "Sean Bro", "Crashy", "Brittany", "Machote"]
	}`
	main_folder.file('theme/settings.json', settings_json)

	const cvs = document.createElement('canvas')
	const ctx = cvs.getContext('2d');
	const all_wardrobe_keys = Object.keys(all_wardrobe_modified_imgs)
	for (let item = 0; item < all_wardrobe_keys.length; item ++) {
		const img_name = all_wardrobe_keys[item]
		const img = all_wardrobe_modified_imgs[img_name]
		cvs.width = img.width;
		cvs.height = img.height;
		ctx.drawImage(img, 0, 0);
		file = cvs.toDataURL("image/png").split(',')[1]
		var dest_folder
		switch (img_name[0]) {
			case "B":
				dest_folder = bike_folder;
				break;
			case "D":
				dest_folder = dirtbike_folder;
				break;
			case "S":
				dest_folder = skateboard_folder;
				break;
			case "Y":
				dest_folder = yogaball_folder;
				break;
			case "H":
			case "P":
				dest_folder = foddycan_folder;
				break;
			case "m":
				dest_folder = masks_folder;
				break;
			default:
				dest_folder = character_folder;
		}
		dest_folder.file(img_name, file, {base64: true});
	}
	if (importEditor) {
		zipEditorInit();
		loaded_zip = zip;
		zipEditorImportFile(zip)
		closeModWardrobe();
		setTimeout(function() {
			updateZipEditorPreview();
		}, 1000)
	} else {
		if (apply) {
			localStorage.setItem('jollyModName', "Created in Wardrobe")
			processFiles(zip.files)
			wearing_mask = 1;
			sendDefaultChar();
			setTimeout(function() {
				const preview_img = generateModPreview(all_asset_imgs, all_wardrobe_modified_imgs).toDataURL();
				closeModWardrobe();
				updateModName();
			}, 100)
		} else {
			zip.generateAsync({type:"blob"})
			.then(function(content) {
				saveAs(content, "jollymod-" + modWardrobeCharacterName + ".zip");
			});
		}
	}
}