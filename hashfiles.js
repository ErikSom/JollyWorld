const md5File = require('md5-file')
const path = require("path");
const fs = require("fs");
const minify = require('html-minifier').minify;

let files = [];

const scriptPath = './build/assets/awesome-game.js';
const htmlPath = './build/index.html';
const swPath = './build/sw.js';

const getAllFiles = directory => {
	fs.readdirSync(directory).forEach(file => {
		const absolute = path.join(directory, file);
		if (fs.statSync(absolute).isDirectory()) return getAllFiles(absolute);
		else return files.push(absolute);
	});
}
getAllFiles('./build/assets');

const jsonLink = {};
const pngsToDelete = [];

const linkJSONwithPNG = () => {
	files.forEach(file => {
		if (file.endsWith('.json')) {
			const pngName = file.replace('.json', '.png');
			if (files.includes(pngName)) {
				jsonLink[file] = pngName;
				pngsToDelete.push(pngName);
			}
		}
	})
}
linkJSONwithPNG();



serviceWorkerFiles = files.filter(file => file.indexOf('.ttf') >= 0);

// remove all linked pngs
files = files.filter(file => !pngsToDelete.includes(file) && file.indexOf('.DS_Store') < 0 && file.indexOf('/instruments/') < 0 && file.indexOf('/terms/') < 0 && file.indexOf('/credits/') < 0 && file.indexOf('awesome-game.js') < 0 && file.indexOf('cycling.png') < 0 && file.indexOf('Logo.svg') < 0 && file.indexOf('.ttf') < 0 && path.basename(file).length<30);

const renamedFiles = {};

const hashFileNames = async () => {
	for (let i = 0; i < files.length; i++) {
		const file = files[i];

		const linkedPNG = jsonLink[file];
		if (linkedPNG) {
			const pngDir = path.dirname(linkedPNG);
			const pngMd5hash = await md5File(linkedPNG);
			const pngFileName = pngMd5hash + path.extname(linkedPNG);
			const newPNGName = path.join(pngDir, pngFileName);

			await fixPNGNameInJson(file, path.basename(linkedPNG), pngFileName);
			fs.renameSync(linkedPNG, newPNGName);
		}

		const md5hash = await md5File(file);
		const dir = path.dirname(file);
		const fileName = md5hash + path.extname(file);
		const newName = path.join(dir, fileName);
		renamedFiles[path.basename(file)] = fileName;
		fs.renameSync(file, newName);

	}
	console.log("Hashed file names");
}

const fixPNGNameInJson = (jsonPath, oldName, newName) => {

	console.log(jsonPath, oldName, newName)
	return new Promise((resolve, reject)=> {
		fs.readFile(jsonPath, 'utf8', function (err, data) {
			if (err) {
				return console.log(err);
			}
			const regex = new RegExp(oldName, 'g');
			let newData = data.replace(regex, newName);
			fs.writeFile(jsonPath, newData, 'utf8', function (err) {
				if (err) return reject(err);
				resolve();
			});
		});
	})
}

const patchHTML = async () => {
	const md5hash = await md5File(scriptPath);
	const dir = path.dirname(scriptPath);
	const fileName = md5hash + path.extname(scriptPath);
	const newName = path.join(dir, fileName);
	fs.renameSync(scriptPath, newName);

	fs.readFile(htmlPath, 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}
		const scriptName = path.basename(scriptPath);
		const regexFileName = new RegExp(scriptName, 'g');
		let newData = data.replace(regexFileName, fileName);

		const regexAssetHashList = new RegExp("'{{{ASSET_HASH_NAMES}}}'", 'g');
		newData = newData.replace(regexAssetHashList, JSON.stringify(renamedFiles));

		newData = minify(newData, {
			removeAttributeQuotes: true,
			collapseWhitespace:true,
			removeComments:true,
			removeOptionalTags:true,
			removeRedundantAttributes:true,
			removeScriptTypeAttributes:true,
			removeTagWhitespace:true,
			useShortDoctype:true,
			minifyCSS:true,
			minifyJS:true
		});

		fs.writeFile(htmlPath, newData, 'utf8', function (err) {
			if (err) return console.log(err);
			console.log("Hashed source script");
		});
	});
}

const patchServiceWorker = async () => {
	files.length = 0;
	getAllFiles('./build/assets');
	files = files.filter(file => file.indexOf('.DS_Store') < 0);
	files = files.map(file => file.replace('build/', './'));

	const md5Index = await md5File(htmlPath);

	fs.readFile(swPath, 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}

		const regexAssetHashList = new RegExp('"{{{SERVICE_WORKER_FILES}}}"', 'g');
		let newData = data.replace(regexAssetHashList, JSON.stringify(files));

		const regexVersionHashList = new RegExp('{{{SERVICE_WORKER_VERSION}}}', 'g');
		newData = newData.replace(regexVersionHashList, md5Index);

		fs.writeFile(swPath, newData, 'utf8', function (err) {
			if (err) return console.log(err);
			console.log("Created SW script");
		});
	});
}


hashFileNames()
.then(()=> patchHTML())
.then(()=> patchServiceWorker() );
