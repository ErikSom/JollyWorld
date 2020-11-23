Date.prototype.getWeek = function() {
	var date = new Date(this.getTime());
	date.setHours(0, 0, 0, 0);
	date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
	var week1 = new Date(date.getFullYear(), 0, 4);
	return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
						  - 3 + (week1.getDay() + 6) % 7) / 7);
}

//import 'FireBaseManager.js'
import 'AssetList.js'
//import 'Game-gui.js'
import './b2Editor/B2dEditor.js'
import 'Settings.js'
import '../libs/pixi-heaven.js'
import 'Game.js'

import 'css/B2dEditor.css'
import 'css/dat-gui-light-theme.css'
import 'css/tooltip.css'
