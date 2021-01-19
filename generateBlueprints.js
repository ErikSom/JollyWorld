// Spreadsheet URL: https://docs.google.com/spreadsheets/d/19HYk5LIGRJhbTi2sCJKI4MMpsYokztD1BivN7B50zkY/edit#gid=0
// More info here: https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');

(async function() {

	const creds = require('./CREDS_GoogleSpreadSheets.json');
	const doc = new GoogleSpreadsheet('19HYk5LIGRJhbTi2sCJKI4MMpsYokztD1BivN7B50zkY');
	await doc.useServiceAccountAuth(creds);
	await doc.loadInfo();

	const maxRows = 20;

	const jsonFiles = [];

	for(let i = 0; i<doc.sheetsByIndex.length; i++){
		const sheet = doc.sheetsByIndex[i];
		if(sheet.title.startsWith('__')) continue;

		const newJSON = {};

		const jsonTitle = `${sheet.title}.json`;
		if(jsonFiles.includes(jsonTitle)){
			console.log("DUPLICATE SHEET NAME")
			return;
		}
		await sheet.loadCells(`A1:B${maxRows}`);
		console.log('Parsing sheet:', sheet.title);
		for(let j = 0; j<maxRows; j++){
			const cellA = sheet.getCell(j, 0);
			const cellB = sheet.getCell(j, 1);
			if(!cellA.value) break;
			console.log('Reading cell:', cellA.value);
			newJSON[cellA.value] = cellB.value;
		}

		let data = JSON.stringify(newJSON);
		fs.writeFileSync(`./static/assets/blueprints/${jsonTitle}`, data);
		console.log('Sheet created');

	};

}());
