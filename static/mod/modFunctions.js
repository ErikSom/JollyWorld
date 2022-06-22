const {get, set, keys, del} = window.idbKeyval;

function $(element) {
	return document.getElementById(element)
}

function blobToImage(blob) {
	const url = URL.createObjectURL(blob);
	const image = new Image();
	image.src = url;
	return image;
}

const promiseBlobToImage = function(blob) {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(blob);
		const image = new Image();
		image.src = url;
		image.onload = function() {
			resolve(this);
		};
	});
}