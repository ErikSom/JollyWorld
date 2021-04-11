const fs = require("fs");

const htmlPath = './build/index.html';
const blackboxPath = process.argv[2] === "true" ? './libs/blackbox.js' : './libs/blackbox.js';

const html =  fs.readFileSync(htmlPath, 'utf8');

const blackbox = fs.readFileSync(blackboxPath, 'utf8');

const parts = html.split('{{{BLACKBOX}}}');
const newData = parts[0] + blackbox.substr(0, blackbox.length - 1) + parts[1];

fs.writeFileSync(htmlPath, newData, 'utf8');
