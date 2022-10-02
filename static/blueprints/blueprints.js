const minimum_blueprint_length = 150;
const maximum_blueprint_length = 500000;

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
				$('step1').innerHTML = "<h1 style='color:#D70000'>You must be logged into JollyWorld to use this page. Please Login and Reload this page.</h1><a href='/'><button class='button wide green'>Go to JollyWorld</button></a>"
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

var collectionReq = new XMLHttpRequest();
collectionReq.addEventListener("load", function() {
	collections = JSON.parse(this.responseText)

	for (i in collections) {
		$('collectiondropdown').innerHTML += `<option value="${collections[i]}">${collections[i]}</option>`
	}
});
collectionReq.open("GET", "https://warze.org/blueprints/collections?approved=0");
collectionReq.send();

function selectCollection(new_collection) {
	$('selectedcollection').innerHTML = new_collection
	$('continuebutton2').removeAttribute('disabled')
}

function triggerNotification(message) {
	var newNotification = document.createElement('div');
	newNotification.innerHTML = `<h1>🔔</h1><h1>${message}</h1>`
	newNotification.style.transition = 'all 1s ease-in-out';
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


var steps = [$('step1'), $('step2'), $('step3'), $('step4'), $('step5')];
var current_step = 0;
var selected_jollydata;

function goToStep(step) {
	if (step == current_step) return;

	$('stepbox').style.display = 'block';
	$('previewwindow').style.display = 'block';

	steps[current_step].style.transform = "translateY(-500px)";
	steps[current_step].style.opacity = 0;

	setTimeout(function() {
		steps[current_step].style.display = 'none';
		steps[current_step].style.opacity = 1;
		try {
			steps[step].style.display = 'block';
			$('navstep' + (step + 1)).removeAttribute('disabled')
		} catch (err) {}

		steps[current_step].style.transform = "translateY(0px)";
		current_step = step;
	}, 300);
}

var pngfile;
async function readData(data) {
	$('jollydataerror').style.display = 'block';
	$('continuebutton1').setAttribute('disabled', true)
	$('stepbox').style.display = 'none';

	if (!data.startsWith('<jollyData-') || !data.endsWith('>')) {
		$('jollydataerror').innerHTML = "Invalid Format"
		return
	}

	if (data.length < minimum_blueprint_length) {
		$('jollydataerror').innerHTML = "JollyData is too short"
		return
	}

	if (data.length > maximum_blueprint_length) {
		$('jollydataerror').innerHTML = "JollyData is too long"
		return
	}

	selected_jollydata = data
	$('jollydataerror').style.display = 'none';
	$('continuebutton1').removeAttribute('disabled')
	goToStep(1)

	await renderJollyDataToImage(iframe, data).then((value) => {
		$("previewimage").src = value.imageData
		pngfile = dataURLtoFile(value.imageData)
	})
}

function readName(value) {
	if (value.length > 3) {
		$('continuebutton3').removeAttribute('disabled');
		$('selectedname').innerHTML = value;
	} else {
		$('continuebutton3').setAttribute('disabled', true);
	}
}

function togglePreview(forceopen = false) {
	if (previewwindow.style.right == "-400px" || forceopen) {
		$('previewwindow').style.right = "0px";
		$('previewbutton').style.transform = "rotateZ(180deg)"
	} else {
		$('previewwindow').style.right = "-400px";
		$('previewbutton').style.transform = "rotateZ(0deg)"
	}
}

function goToConfirm() {
	togglePreview(true);
	$('uploadbutton').removeAttribute('disabled');
	goToStep(3);
}

function dataURLtoFile(dataurl) {
var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], 'file.png', {type:mime});
}

function uploadListener () {
	if (this.responseText == "Successfully uploaded blueprint") {
		showSuccess();
	} else {
		triggerNotification(this.responseText);
		$('uploadbutton').removeAttribute('disabled');
	}
}

function upload() {
	$('uploadbutton').setAttribute('disabled', true);

	var submitted_collection = $('selectedcollection').innerHTML;
	var submitted_name = $('blueprintname').value;

	var jollyform = new FormData();
	jollyform.append('data', selected_jollydata.replace("<jollyData-", "").replace(">", ""));
	jollyform.append('files[]', pngfile)
	jollyform.append('collection', submitted_collection);
	jollyform.append('name', submitted_name);
	jollyform.append('username', logged_in_as.user)
	jollyform.append('userid', logged_in_as.id)
	jollyform.append('oauth', localStorage.getItem('oauth-token'))
	
	var oReq = new XMLHttpRequest();
	oReq.addEventListener("load", uploadListener);
	oReq.open("POST", "https://warze.org/blueprints/submit");
	oReq.send(jollyform);
}

function showSuccess() {
	goToStep(4);
	togglePreview();
	$('confetti').play();
	$('previewwindow').style.display = 'none';
	$('stepbox').style.display = 'none';
}

const renderJollyDataToImage = (iframe, jollyData) => {
    return new Promise((resolve, reject) => {
        const sendJollyData = () => {
            iframe.contentWindow.postMessage({type:'renderJollyImage', jollyData}, '*');
        }

        const tempMessageListener = messageData => {
            if(messageData.data.type === 'jollyImageRenderingReady'){
                window.jollyImageRendering = true;
                clearInterval(window.tempJollyRenderReadyInterval);
                sendJollyData();
            }
            if(messageData.data.type === 'jollyImageRendered'){
                window.removeEventListener('message', tempMessageListener);
                resolve(messageData.data)
            }
        }
        window.addEventListener('message', tempMessageListener);
        if(!window.jollyImageRendering){
            window.tempJollyRenderReadyInterval = setInterval(()=>{
                iframe.contentWindow.postMessage({type:'jollyImageRenderingAckReady'}, '*');
            }, 200)
        }else{
            sendJollyData();
        }
    });
}

var iframe = document.createElement('iframe')
iframe.src = "https://jollyworld.app/"
iframe.width = 0;
iframe.height = 0;
iframe.style.display = "none"
document.body.appendChild(iframe)

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

function toggleTheme() {
	var new_theme = (document.documentElement.getAttribute('theme') == 'dark' ? 'main' : 'dark')
	document.documentElement.setAttribute('theme', new_theme);
	$('themebutton').src = '/blueprints/theme' + new_theme + '.png'
	localStorage.setItem('jwbpTheme', new_theme)
}

if (localStorage.getItem('jwbpTheme') == 'dark') {
	toggleTheme()
}

function setCustomCollection() {
	var new_name = prompt('Enter Collection Name')
	$('customcollectionplaceholder').innerHTML = new_name
	$('customcollectionplaceholder').value = new_name
	$('collectiondropdown').value = new_name
	selectCollection(new_name)
}