function $(elem) {
	return document.getElementById(elem);
}

const getBackendUserData = () => {
	return new Promise((resolve, reject) => {
		const body = {
			method: 'GET',
			withCredentials: true,
			headers: {
			'Authorization': `Bearer ${localStorage.getItem('oauth-token')}`,
			},
		}
		fetch(`https://api.jollyworld.app/me`, body)
		.then(result => result.json())
		.then(data => {

			const { error } = data;

			if(error){
				triggerNotification("You are not logged in.")
			}
			resolve(data);
		});
	})
};
var logged_in_as = {};
getBackendUserData().then(userData => {
	if (userData.username != undefined) {
		logged_in_as.user = userData.username;
		logged_in_as.id = userData.id;
		triggerNotification("Logged in as " + userData.username)
	}
})

function triggerNotification(message) {
	var newNotification = document.createElement('div');
	newNotification.innerHTML = `<h1>🔔</h1><h1>${message}</h1>`
	newNotification.style.transition = 'bottom 1s ease-in-out, opacity 1s linear';
	newNotification.classList.add('notification')
	newNotification.style.bottom = '-35px';
	newNotification.style.opacity = '0';
	document.body.appendChild(newNotification)
	setTimeout(function() {
		newNotification.style.opacity = '1';
		newNotification.style.bottom = '5px';
		setTimeout(function() {
			newNotification.style.opacity = '0';
			newNotification.style.bottom = '45px';
		}, 3000)
	}, 10)
}

var collectionReq = new XMLHttpRequest();
collectionReq.addEventListener("load", function() {
	var collections = JSON.parse(this.responseText)
	const collection_dropdown = $('collectiondropdown')
	for (var i in collections) {
		collection_dropdown.innerHTML += `<option value="${collections[i]}">${collections[i]}</option>`
	}
});
collectionReq.open("GET", "https://warze.org/blueprints/collections?approved=0");
collectionReq.send();

var authorReq = new XMLHttpRequest();
authorReq.addEventListener("load", function() {
	var authors = JSON.parse(this.responseText)
	try {
		const author_dropdown = $('authordropdown')
		for (var i in authors) {
			author_dropdown.innerHTML += `<option value="${authors[i]}">${authors[i]}</option>`
		}
	} catch (err) {}
});
authorReq.open("GET", "https://warze.org/blueprints/authors");
authorReq.send();

$('searchblueprint').onkeydown = function() {
	if (event.key === 'Enter') {
		searchButton(1)
	}
}

function resultsListener() {
	var blueprints = JSON.parse(this.responseText)
	$('blueprintresults').innerHTML = "";
	$('pagination').style.display = 'block';
	$('pageprev').classList.remove('pagedisabled');
	$('pagenext').classList.remove('pagedisabled');
	render_queue = []
	for (var i in blueprints) {
		var bp = blueprints[i]
		$('blueprintresults').innerHTML +=
		`<div class="singletagsection" id="${bp[0]}" ${(displayType == 'compact' ? 'style="display:inline-block;margin:5px;"' : '')}>
			<div class="previewcontainer" onclick='getBlueprintData(${bp[0]});'>
				<img class="singletagimagecopyicon" src="/blueprints/copy.png">
				<div class="previewsubcontainer">
					<img id="image${bp[0]}" src="https://warze.org/blueprints/get/${bp[0]}" class="singletagimage">
				</div>
			</div>
			<div class="blueprintright" style="display:${(displayType == 'detailed' ? "inline-block" : "none")}">
				<div class="blueprintinformation">
					<div class="blueprintsingleinfo">
						<label>Name:</label>
						<input oninput="$('blueprintupdate${bp[0]}').classList.remove('disabled')" style="width:394px" type="text" class="inputfield" id="blueprintnameinput${bp[0]}" name="BlueprintName" value="${bp[1]}">
					</div>
					<div class="blueprintsingleinfo">
						<label>Collection:</label>
						<input oninput="$('blueprintupdate${bp[0]}').classList.remove('disabled')" style="width:350px" type="text" class="inputfield" id="blueprintcollectioninput${bp[0]}" name="BlueprintCollection" value="${bp[5]}">
					</div>
					<div class="blueprintsingleinfo">
						<label>Tags:</label>
						<input placeholder="Seperate tags with a comma" oninput="$('blueprintupdate${bp[0]}').classList.remove('disabled')" style="width:410px" type="text" class="inputfield" id="blueprinttagsinput${bp[0]}" name="BlueprintTags" value="${bp[6]}">
					</div>
					<div class="blueprintsingleinfo">
						<label>Author:</label>
						<span class="blueprintauthor">${bp[3]}</span>
					</div>
					<div class="blueprintsingleinfo">
						<label>Approved:</label>
						<input onchange="$('blueprintupdate${bp[0]}').classList.remove('disabled')" style="position:absolute;width:33px;height:33px" id="blueprintapproved${bp[0]}" type="checkbox" ${bp[7] ? 'checked' : ''}>
					</div>
					<button id="blueprintdelete${bp[0]}"class="blueprintdeletebutton" onclick="deleteBlueprint('${bp[0]}');this.classList.add('disabled');">Delete</button>
					<button id="blueprintupdate${bp[0]}"class="blueprintupdatebutton disabled" onclick="updateBlueprint('${bp[0]}');this.classList.add('disabled');">Save Changes</button>
				</div>
			</div>
		</div>`;
	}
	if (selected_page == 1) {
		$('pageprev').classList.add('pagedisabled');
	}
	if (blueprints.length < 20) {
		$('pagenext').classList.add('pagedisabled');
	}
	if (blueprints.length == 0) {
		$('blueprintresults').innerHTML = "<h1>Oops! No results.</h1>"
	} else {
		$('blueprintresults').innerHTML += "<br>" + $('pageprev').outerHTML + $('pagenext').outerHTML;
	}
}

function requestBlueprints(name = false, author = false, collection = false, approved = 0) {
	if (name) {
		search_name = "&search=" + name;
	} else {
		search_name = "";
	}
	if (collection) {
		search_collection = "&collection=" + collection;
	} else {
		search_collection = "";
	}
	if (author) {
		search_author = "&authorsearch=" + author;
	} else {
		search_author = "";
	}
	var bpReq = new XMLHttpRequest();
	bpReq.addEventListener("load", resultsListener);
	bpReq.open("GET", `https://warze.org/blueprints/request?page=${selected_page}&approved=${approved}${search_name}${search_collection}${search_author}&nodata=1`);
	bpReq.send();
}

var selected_page = 1;
function searchButton(page) {
	page = Math.min(1000, Math.max(1, parseInt(page)))
	entering_page_num = false;
	$('blueprintresults').innerHTML = "<h1>Loading</h1>"
	name = $('searchblueprint').value
	try {
		author = $('searchauthor').value
	} catch (err) {
		author = ($('authordropdown').value == "All" ? 0 : $('authordropdown').value)
	}
	collection = ($('collectiondropdown').value == "All" ? 0 : $('collectiondropdown').value)
	unapproved = ($('unapproved').checked ? 0 : 2);
	selected_page = page
	$('pagenumber').innerHTML = "Page " + page

	requestBlueprints(name, author, collection, unapproved, selected_page)
}
if (location.search) {
	$('searchblueprint').value = location.search.split("=")[1].replaceAll("%20", " ")
}
searchButton(1);

var entering_page_num = false;
function enterPageNum() {
	if (!entering_page_num) {
		entering_page_num = true;
		$('pagenumber').innerHTML = `<input id='pagenumberinput' onkeydown="if(event.code==='Enter'){searchButton(this.value)}" placeholder='${selected_page}' type='number'></input>`
		$('pagenumberinput').focus()
	}
}

var displayType = "detailed"
function toggleDisplay() {
	displayType = (displayType == "detailed" ? "compact" : "detailed")
	$('displayicon').src = "/blueprints/format" + displayType + ".png";
	var all_elems = document.querySelectorAll('.singletagsection')
	for (var i = 0; i < all_elems.length; i ++){
		all_elems[i].style.display = (displayType == "detailed" ? "block" : "inline-block")
		all_elems[i].style.marginRight = (displayType == "detailed" ? "0px" : "5px")
	}
	var all_elems = document.querySelectorAll('.blueprintright')
	for (var i = 0; i < all_elems.length; i ++) {
		all_elems[i].style.display = (displayType == "detailed" ? "inline-block" : "none")
	}
}

function toggleTheme() {
	var new_theme = (document.documentElement.getAttribute('theme') == 'dark' ? 'main' : 'dark')
	document.documentElement.setAttribute('theme', new_theme);
	$('themebutton').src = '/blueprints/theme' + new_theme + '.png'
	localStorage.setItem('jwbpTheme', new_theme)
}

if (localStorage.getItem('jwbpTheme') == 'dark') {
	toggleTheme()
}

function updateBlueprint(bpid) {
	var jollyform = new FormData();
	jollyform.append('bpid', bpid);
	jollyform.append('collection', $("blueprintcollectioninput" + bpid).value);
	jollyform.append('tags', $("blueprinttagsinput" + bpid).value);
	jollyform.append('name', $("blueprintnameinput" + bpid).value);
	jollyform.append('username', logged_in_as.user)
	jollyform.append('userid', logged_in_as.id)
	jollyform.append('oauth', localStorage.getItem('oauth-token'))
	jollyform.append('approved', ($('blueprintapproved' + bpid).checked ? '1' : '0'))
		
	var oReq = new XMLHttpRequest();
	oReq.addEventListener("load", function() {
		triggerNotification(this.responseText)
	});
	oReq.open("POST", "https://warze.org/blueprints/update");
	oReq.send(jollyform);
}

function deleteBlueprint(bpid) {
	if (!confirm("Are you sure you want to delete this blueprint?")) return
		
	var jollyform = new FormData();
	jollyform.append('bpid', bpid);
	jollyform.append('username', logged_in_as.user)
	jollyform.append('userid', logged_in_as.id)
	jollyform.append('oauth', localStorage.getItem('oauth-token'))
		
	var oReq = new XMLHttpRequest();
	oReq.addEventListener("load", function() {
		triggerNotification(this.responseText)
		if (this.responseText == "Successfully deleted blueprint") {
			$(bpid).remove();
		}
	});
	oReq.open("POST", "https://warze.org/blueprints/delete");
	oReq.send(jollyform);
}

function getBlueprintData(bpid) {
	var bpReq = new XMLHttpRequest();
	bpReq.addEventListener("load", function() {
		navigator.clipboard.writeText(`<jollyData-${this.responseText}>`)
		triggerNotification("Successfully copied JollyData")
	});
	bpReq.open("GET", `https://warze.org/blueprints/getdata?id=${bpid}`);
	bpReq.send();
}