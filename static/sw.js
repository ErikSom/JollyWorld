var cacheName = 'JollyWorld-{{{SERVICE_WORKER_VERSION}}}';
var filesToCache = '{{{SERVICE_WORKER_FILES}}}';

self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(cacheName).then(function (cache) {
			return cache.addAll(filesToCache);
		}).catch(function (err) {
			console.log(err);
		})
	);
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request).then(function (response) {
			return response || fetch(event.request);
		}).catch(function (error) {
			console.log(error);
		})
	);
});

self.addEventListener('activate', function (event) {
	event.waitUntil(
		caches.keys().then(function (keyList) {
			return Promise.all(keyList.map(function (key) {
				if (key !== cacheName) {
					return caches.delete(key);
				}
			}));
		})
	);
});

self.addEventListener('message', function (event) {
	if (event.data.action === 'skipWaiting') {
		self.skipWaiting();
	}
});
