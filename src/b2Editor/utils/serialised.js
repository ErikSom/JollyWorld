export const IS_SERIALISABLE = Symbol("This object is serialisable to array");
export const SCHEME = Symbol("Scheme for serialisation");

/**
 * Mark field serialisation rule
 * @param {number} offset 
 * @param { {to: (input, def) => any} | {to: (input, def) => any, from: (input, def) => any} | undefined } mapper 
 * @param {string | number | boolean | Object | function | undefined} def 
 */
export function serialise(offset, mapper, def = void 0) {
	return function (object, name) {
		object[SCHEME] = [].concat(object[SCHEME] || []);
		object[SCHEME].push({
			name,
			offset,
			mapper,
			def,
		});
	};
}

/**
 * Mark that class can be serialised
 * @param {{new(): Object} _class 
 */

export function serialisable(_class) {
	//for prevent collision of prototype scheme, every time overwrite it
	_class.prototype[SCHEME] = [].concat(_class.prototype[SCHEME] || []);
	_class.prototype[IS_SERIALISABLE] = true;
	_class.prototype.toArray = function () {
		const data = [];
		const fields = this[SCHEME];

		fields.sort((a, b) => a.offset - b.offset);

		for (const definition of fields) {
			const current = this[definition.name];
			const mapper = definition.mapper;
			const defaultVal = typeof definition.def === 'function'
				? definition.def()
				: definition.def;

			data[definition.offset] = mapper ? mapper.to.call(this, current, defaultVal) : current;
		}

		return data;
	};

	_class.prototype.fromArray = function (data) {
		const fields = this[SCHEME];

		fields.sort((a, b) => a.offset - b.offset);

		for (const definition of fields) {
			const current = data[definition.offset];
			const mapper = definition.mapper;
			const defaultVal = typeof definition.def === 'function' 
				? definition.def() 
				: definition.def;

			this[definition.name] = mapper
				? (mapper.from || mapper.to).call(this, current, defaultVal) 
				: current;
		}

		return this;
	};
}

export class BaseMapper {
	to (inputValue, defaultValue) {
		return inputValue;
	}

	from (inputValue, defaultValue) {
		return inputValue;
	}
}

export const MAP = {
	NUMBER: {
		to: (input, def) => typeof input === 'number' ? input : def
	},

	BOOL: {
		to: (input, def) => typeof input === 'boolean' ? input : def
	},

	STRING: {
		to: (input, def) => typeof input === 'string' ? input : def
	},

	ARRAY: {
		to: (input, def) => input && input.constructor === Array ? input : def
	},

	DEFINED: {
		to: (input, def) => input !== undefined ? input : def
	}
}