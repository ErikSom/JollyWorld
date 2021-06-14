const Path = require("path");
const FS   = require("fs");
let Files  = [];

function ThroughDirectory(Directory) {
    FS.readdirSync(Directory).forEach(File => {
        const Absolute = Path.join(Directory, File);
        if (FS.statSync(Absolute).isDirectory()) return ThroughDirectory(Absolute);
        else return Files.push(Absolute);
    });
}

ThroughDirectory('./mod');

for(let i = 0; i<Files.length; i++){
	file = Files[i];
	var fileNameStart = file.substr(0, file.length-8);
	var fileNumber = file.substr(fileNameStart.length, 4);
	var newNumber = parseInt(fileNumber, 10);
	newNumber--;
	var newName = fileNameStart + newNumber.toString().padStart(4, '0')+'.png';
	FS.renameSync(file, newName, function(err) {
		if ( err ) console.log('ERROR: ' + err);
	});
}

console.log("Files renamed!");
