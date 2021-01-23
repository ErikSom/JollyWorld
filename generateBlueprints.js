// Google Drive link:

const fs = require('fs');
const md5File = require('md5-file')
const path = require("path");
const BLUEPRINT_PATH = './BLUEPRINTS'

const categories = [];

const findCategories = () => {
	if (!fs.existsSync(BLUEPRINT_PATH)) {
		console.log("NO BLUEPRINTS FOLDER FOUND");
		return;
	}
	fs.readdirSync(BLUEPRINT_PATH).forEach(file => {
		if (file.indexOf('DS_Store') < 0) {
			console.log("Found catagory:", file);
			categories.push(file);
		}
	});
}

const findFilesForCategory = category => {
	const blueprints = [];
	fs.readdirSync(path.join(BLUEPRINT_PATH, category)).forEach(file => {
		if (file.indexOf('DS_Store') < 0 && file.indexOf('.txt') > 0) {
			console.log("Found blueprint:", file);
			blueprints.push(file);
		}
	});
	return blueprints;
}
const incorrectFiles = [];
const processCategories = async () => {
	return new Promise(async (resolve, reject) => {
		const jsonFiles = [];
		for(let i = 0; i<categories.length; i++){
			category = categories[i];
			const newJSON = {};
			const blueprints = findFilesForCategory(category);

			blueprints.forEach(fileName => {
				const blueprintPath = path.join(BLUEPRINT_PATH, category, fileName);
				let blueprint = fs.readFileSync(blueprintPath, 'utf8');
				blueprint = blueprint.trim();
				if(!blueprint.startsWith(`{\"objects\":`)){
					incorrectFiles.push(blueprintPath);
				}else if(!blueprint.endsWith(`}`)){
					incorrectFiles.push(blueprintPath);
				}else{
					const name = fileName.split('.txt')[0];
					newJSON[name] = blueprint;
				}
			})

			const data = JSON.stringify(newJSON);


			const jsonName = `${category}.json`;
			const jsonPath = `./static/assets/blueprints/${jsonName}`;
			fs.writeFileSync(jsonPath, data);

			const md5hash = await md5File(jsonPath);
			const dir = path.dirname(jsonPath);
			const newFileName = md5hash + path.extname(jsonPath);
			const newName = path.join(dir, newFileName);
			fs.renameSync(jsonPath, newName);

			jsonFiles.push([category, newFileName]);
		};

		const blueprints = {files:jsonFiles};
		const data = JSON.stringify(blueprints);
		fs.writeFileSync('./static/assets/blueprints/blueprints.json', data);
		console.log('Finalized blueprints creation');
		resolve();
	});
}

(async function() {
	findCategories();
	await processCategories();
	console.log("Incompatible files:");
	console.log(incorrectFiles);
}());
