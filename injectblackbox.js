const path = require("path");
const fs = require("fs");

const htmlPath = './build/index.html';
const blackboxDebugPath = './libs/blackbox-debug.js';

fs.readFile(htmlPath, 'utf8', function (err, data) {
	if (err) {
		return console.log(err);
	}

	const targetPath = blackboxDebugPath;
	fs.readFile(targetPath, 'utf8', function (err, blackboxText) {
		const regexBlackbox = new RegExp("{{{BLACKBOX}}}", 'g');
		const newData = data.replace(regexBlackbox, blackboxText);

		fs.writeFile(htmlPath, newData, 'utf8', function (err) {
			if (err) return console.log(err);
			console.log("Injected black box");
		});

	});
});

