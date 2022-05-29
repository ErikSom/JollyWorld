const allDefaultCharacters = ["Billy Joel", "Jeroen", "Marique", "Damien", "Sean Bro", "Col. Jackson", "Brittany", "Xenot", "Ronda", "Jack Lee", "The Zuck!", "Hank", "Crashy", "Bob Zombie", "Mrs. Kat", "Machote"]
const allDefaultCharactersTrimmed = ["billyjoel", "jeroen", "marique", "damien", "seanbro", "coljackson", "brittany", "xenot", "ronda", "jacklee", "thezuck", "hank", "crashy", "bobzombie", "mrskat", "machote"]
const customOrder = [0,1,2,3,12,9,14,6,7,8,4,10,13,5,11,15];

const portraits = new Image()
portraits.src = "mod/pageassets/allportraits.png"
portraits.onload = loadCharacters
function loadCharacters() {
	$('defaultCharacterSelection').innerHTML = ""
	const ps = 90 // portrait size
	for (var i = 0; i < allDefaultCharacters.length; i ++) {
		var button = document.createElement('div');
		button.classList.add('singleDefaultCharacter');
		button.num = i;
		button.onclick = function() {
			clearOldMods();
			localStorage.removeItem('jollyModCustomPreview')
			localStorage.setItem('jollyModName', allDefaultCharacters[this.num])
			sendDefaultChar(customOrder[this.num])
			updateModName()
		}
		
		var thumb = document.createElement('canvas');
		thumb.width = 100;
		thumb.height = 100;
		var ctx = thumb.getContext('2d');
		var x = i % 4 * ps
		var y = Math.floor(i / 4) * ps
		ctx.drawImage(portraits, x, y, ps, ps, 5, 5, ps, ps)
		thumb.classList.add('singleDefaultCharacterThumb')

		var characterName = document.createElement('h1');
		characterName.innerText = allDefaultCharacters[i];
		characterName.classList.add('singleDefaultCharacterName')

		button.appendChild(thumb);
		button.appendChild(characterName);

		$('defaultCharacterSelection').appendChild(button);
	}
}

function changeModCharacter(id = 0) {
	localStorage.setItem('jollyModCharacter', id);
	sendDefaultChar(id);
	generateModPreviewFromIDB(false);
}