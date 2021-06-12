var LZString=function(){function o(o,r){if(!t[o]){t[o]={};for(var n=0;n<o.length;n++)t[o][o.charAt(n)]=n}return t[o][r]}var r=String.fromCharCode,n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",t={},i={compressToBase64:function(o){if(null==o)return"";var r=i._compress(o,6,function(o){return n.charAt(o)});switch(r.length%4){default:case 0:return r;case 1:return r+"===";case 2:return r+"==";case 3:return r+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(e){return o(n,r.charAt(e))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(o){return null==o?"":""==o?null:i._decompress(o.length,16384,function(r){return o.charCodeAt(r)-32})},compressToUint8Array:function(o){for(var r=i.compress(o),n=new Uint8Array(2*r.length),e=0,t=r.length;t>e;e++){var s=r.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null===o||void 0===o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;t>e;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(o){return null==o?"":i._compress(o,6,function(o){return e.charAt(o)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(n){return o(e,r.charAt(n))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(o,r,n){if(null==o)return"";var e,t,i,s={},p={},u="",c="",a="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<o.length;i+=1)if(u=o.charAt(i),Object.prototype.hasOwnProperty.call(s,u)||(s[u]=f++,p[u]=!0),c=a+u,Object.prototype.hasOwnProperty.call(s,c))a=c;else{if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++),s[c]=f++,a=String(u)}if(""!==a){if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==r-1){d.push(n(m));break}v++}return d.join("")},decompress:function(o){return null==o?"":""==o?null:i._decompress(o.length,32768,function(r){return o.charCodeAt(r)})},_decompress:function(o,n,e){var t,i,s,p,u,c,a,l,f=[],h=4,d=4,m=3,v="",w=[],A={val:e(0),position:n,index:1};for(i=0;3>i;i+=1)f[i]=i;for(p=0,c=Math.pow(2,2),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(t=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 2:return""}for(f[3]=l,s=l,w.push(l);;){if(A.index>o)return"";for(p=0,c=Math.pow(2,m),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(l=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 2:return w.join("")}if(0==h&&(h=Math.pow(2,m),m++),f[l])v=f[l];else{if(l!==d)return null;v=s+s.charAt(0)}w.push(v),f[d++]=s+v.charAt(0),h--,s=v,0==h&&(h=Math.pow(2,m),m++)}}};return i}();"function"==typeof define&&define.amd?define(function(){return LZString}):"undefined"!=typeof module&&null!=module&&(module.exports=LZString);

paper.setup();

var paths = [];

function importSVG(url){
	paper.project.importSVG(url, {
		expandShapes:false,
		onLoad: function(item) {
			console.log(item);
			findPaths(item.children[1]);
			const objects = convertPathsToJollyObjects(paths);
			serializeGraphics(objects);
		}
	})
}

function findPaths(item){
	if(item.segments != undefined){
		paths.push(item);
	}
	if(item.children){

		// var keys = Object.keys(item.children);

		// for(var i = 0; i<keys.length; i++){
		// 	var key = keys[i];
		// 	var child = item.children[key];
		// 	item.refName = key;

		// 	findPaths(child);
		// }

		for(var i = 0; i<item.children.length; i++){
			findPaths(item.children[i]);
		}


	}
}

var templateGraphic = function () {
	this.type = 6;
	this.x = null;
	this.y = null;
	this.rotation = 0;
	this.groups = "";
	this.refName = "";
	this.ID = 0;
	this.colorFill = "#999999";
	this.colorLine = "#000";
	this.transparancy = 1.0;
	this.radius;
	this.vertices = [{
		x: 0,
		y: 0
	}, {
		x: 0,
		y: 0
	}];
	this.bodyID = null;
	this.texturePositionOffsetLength = null;
	this.texturePositionOffsetAngle = null;
	this.textureAngleOffset = null;
	this.tileTexture = "";
	this.lockselection = false;
	this.lineWidth = 1.0;
	this.parallax = 0.0;
	this.repeatTeleportX = 0;
	this.repeatTeleportY = 0;
	this.gradient = '';
	this.visible = true;
}


function convertPathsToJollyObjects(paths){
	const objects = [];
	for(var i = 0; i<paths.length; i++){
		path = paths[i];

		var object = new templateGraphic();

		if(path.fillColor){
			object.colorFill = path.fillColor.toCSS(true);
			console.log(object.colorFill);

			if(object.colorFill.length < 7) object.colorFill = '#ffffff';

			if(path.fillColor.red === 0 && path.fillColor.green === 0 && path.fillColor.blue === 0){
				if(path.parent.fillColor && (path.parent.fillColor.red !== 0 && path.parent.fillColor.green !== 0 && path.parent.fillColor.blue !== 0)){
					object.colorFill = path.parent.fillColor.toCSS(true);
				}
			}

		}
		if(path.lineColor){
			object.colorLine = path.lineColor.toCSS(true);

			if(object.colorLine.length < 7) object.colorLine = '#ffffff';

			if(path.lineColor.red === 0 && path.lineColor.green === 0 && path.lineColor.blue === 0){
				if(path.parent.lineColor && (path.parent.lineColor.red !== 0 && path.parent.lineColor.green !== 0 && path.parent.lineColor.blue !== 0)){
					object.colorLine = path.parent.lineColor.toCSS(true);
				}
			}

			object.lineWidth = Math.ceil(path.strokeWidth);
		}else{
			object.lineWidth = 0;
		}

		object.rotation = path.rotation;
		object.x = 0;
		object.y = 0;

		// object.refName = path.refName;

		object.transparancy = path.opacity;

		var vertices = object.vertices = [];

		for(var j = 0; j<path.segments.length; j++){
			var p = path.segments[j];

			vertices.push({
				x: p.point.x,
				y: p.point.y,
				point1: {
					x: p.curve.points[1].x,
					y: p.curve.points[1].y
				},
				point2: {
					x: p.curve.points[2].x,
					y: p.curve.points[2].y
				}
			})

		}
		objects.push(object);
	}
	return objects;
}

function serializeGraphics(objects){
	var serialized = {objects:[]};
	for(var i = 0; i<objects.length; i++){
		var obj = objects[i];

		const arr = [];
		arr[0] = obj.type;
		arr[1] = obj.x;
		arr[2] = obj.y;
		arr[3] = obj.rotation;
		arr[4] = obj.groups;
		arr[5] = obj.refName;
		arr[6] = i;
		arr[7] = obj.colorFill;
		arr[8] = obj.colorLine;
		arr[9] = obj.transparancy;
		arr[10] = obj.radius;
		arr[11] = obj.vertices;
		arr[12] = obj.bodyID;
		arr[13] = obj.texturePositionOffsetLength;
		arr[14] = obj.texturePositionOffsetAngle;
		arr[15] = obj.textureAngleOffset;
		arr[16] = obj.tileTexture;
		arr[17] = obj.lineWidth;
		arr[18] = obj.parallax;
		arr[19] = obj.repeatTeleportX;
		arr[20] = obj.repeatTeleportY;
		arr[21] = '';
		arr[22] = obj.visible;

		serialized.objects.push(arr);
	}

	var copyJSON = stringifyJSON(serialized);

	var jollyData = window.atob('PGpvbGx5RGF0YS0=')+LZString.compressToEncodedURIComponent(copyJSON)+'>';

	console.log("******************** COPY DATA ********************");
	console.log(jollyData);
	console.log("***************************************************");


	document.querySelector('#label').innerText = 'JollyData copied to clipboard';

	copyStringToClipboard(jollyData);

}

function stringifyJSON(json){
	return JSON.stringify(json, function(key, val) {
		return (val && val.toFixed) ? Number(val.toFixed(4)) : val;
	})
}

function copyStringToClipboard(str) {
	var el = document.createElement('textarea');
	el.value = str;
	el.setAttribute('readonly', '');
	el.style = {position: 'absolute', left: '-9999px'};
	document.body.appendChild(el);
	el.select();
	document.execCommand('copy');
	document.body.removeChild(el);
}

function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	paths.length = 0;

	document.querySelector('#label').innerText = 'Drop svg here';

	var files = evt.dataTransfer ? evt.dataTransfer.files : evt.target.files; 

	var output = [];
	for (var i = 0, f; f = files[i]; i++) {
		var reader = new FileReader();
		reader.onloadend = () => {
			importSVG(reader.result);
		};
		reader.readAsDataURL(f);
	}
}
var dropZone = document.getElementById('files');
dropZone.addEventListener('change', handleFileSelect, false);

function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
}

dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);
