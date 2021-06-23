// in case localStorage is blocked
// https://www.chromium.org/for-testers/bug-reporting-guidelines/uncaught-securityerror-failed-to-read-the-localstorage-property-from-window-access-is-denied-for-this-document
// https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem#Exceptions
const fakeStorage = new (class FakeStorage{
	constructor() {
		this.storage = {};
	}
	getItem(key) {
		return this.storage.hasOwnProperty(key) ? this.storage[key] : null; // eslint-disable-line no-prototype-builtins
	}
	setItem(key, value) {
		this.storage[key] = value;
	}
	removeItem(key){
		delete this.storage[key];
	}
})();
export function getItem(key) {
	let value;
	try {
		value = window.localStorage.getItem(key);
		if (value === null) {
			// this is needed if the storage is full because values will be in put fakeStorage
			// but accessing localStorage won't throw
			value = fakeStorage.getItem(key);
		}
	} catch (err) {
		value = fakeStorage.getItem(key);
	}
	return value;
}
export function setItem(key, value) {
	try {
		window.localStorage.setItem(key, value);
	} catch (err) {
		fakeStorage.setItem(key, value);
	}
}
export function removeItem(key) {
	try {
		window.localStorage.removeItem(key);
	} catch (err) {
		fakeStorage.removeItem(key);
	}
}
