/**
 * Author: Zeta Ret
 * ProtoSS package autocomplete providers
 **/

var fs = require('fs'),
	path = require('path');

var main = {
	cfg: {}
};

var reservedWords = ['break', 'switch', 'case', 'default', 'continue', 'debugger', 'delete',
	'import', 'export', 'extends', 'require', 'module', 'exports',
	'if', 'else', 'for', 'in', 'of', 'do', 'while', 'finally', 'with', 'yield',
	'class', 'instanceof', 'new', 'return', 'super', 'this', 'global', 'window', 'document',
	'throw', 'try', 'catch', 'typeof',
	'const', 'var', 'let', 'void',
	'implements', 'interface', 'package', 'private', 'protected', 'public', 'static',
	'function', 'async', 'await', 'constructor', 'arguments', 'get', 'set',
	'null', 'true', 'false', 'undefined', 'NaN', 'Infinity'
];
var nativeClasses = ['Array', 'Object', 'Function', 'Boolean', 'Symbol', 'String', 'RegExp',
	'Number', 'BigInt', 'Math', 'JSON', 'Date', 'Map', 'Set', 'WeakMap', 'WeakSet',
	'Int8Array', 'Int16Array', 'Int32Array',
	'Uint8Array', 'Uint16Array', 'Uint32Array', 'Uint8ClampedArray',
	'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array',
	'Error', 'EvalError', 'InternalError ', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError',
	'ArrayBuffer', 'SharedArrayBuffer', 'Atomics', 'DataView', 'Control', 'Promise', 'Generator', 'GeneratorFunction', 'AsyncFunction',
	'XMLHttpRequest', 'ReflectionSection', 'Reflect', 'Proxy'
];
var globalFunctions = ['eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt',
	'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape', 'unescape'
];

class FileProvider {
	constructor() {
		this.selector = '*';
		this.suggestionPriority = 20;
	}

	getSuggestions(options) {
		if (main.cfg.autoComplete === 'no') return [];
		var prefix = this.getPrefix(options.prefix, options.editor, options.bufferPosition);
		return this.findMatchingSuggestions(prefix, options);
	}

	getPrefix(prefix, editor, bufferPosition) {
		var line = editor.getTextInRange([
			[bufferPosition.row, 0], bufferPosition
		]);
		var spl = line.split(/\'|\"|\`|\(|\[|\{|\s/),
			l = spl.pop();
		return l || prefix;
	}

	findMatchingSuggestions(prefix, options) {
		var p = options.editor.getPath().split(path.sep);
		p.pop();
		var f, isDir, pp = path.resolve(p.join(path.sep), prefix);
		try {
			isDir = fs.statSync(pp).isDirectory();
			if (isDir) pp += path.sep;
		} catch (e) {}

		var ld = pp.split(path.sep),
			ldp = ld[ld.length - 1] ? ld.pop().toLowerCase() : "",
			sc = ld.join(path.sep);
		try {
			f = fs.readdirSync(sc);
		} catch (e) {
			f = [];
		}
		var sugg = f;

		var words = !ldp ? sugg : sugg.filter((s) => s.toLowerCase().startsWith(ldp)),
			msugg = words.map((w) => {
				return {
					text: w,
					description: "Located in folder " + sc,
					rightLabelHTML: "File/Folder/Module",
					leftLabelHTML: "ProtoSS",
					type: "module"
				}
			});
		return msugg;
	}
}

class BasicProvider {
	constructor() {
		this.selector = '*';
		this.suggestionPriority = 21;
	}

	getSuggestions(options) {
		if (main.cfg.autoComplete === 'no') return [];
		return this.findMatchingSuggestions(options.prefix);
	}

	findMatchingSuggestions(prefix) {
		var sugg = reservedWords,
			sugg2 = nativeClasses,
			sugg3 = globalFunctions,
			plc = prefix.toLowerCase();
		var words = sugg.filter((s) => s.toLowerCase().startsWith(plc)),
			msugg = words.map((w) => {
				return {
					text: w,
					description: "Lexical grammar",
					rightLabelHTML: "Reserved word",
					leftLabelHTML: "ProtoSS",
					type: "w"
				}
			});
		var words2 = sugg2.filter((s) => s.toLowerCase().startsWith(plc)),
			msugg2 = words2.map((w) => {
				return {
					text: w,
					description: "Standard built-in objects",
					rightLabelHTML: "Native Classes",
					leftLabelHTML: "ProtoSS",
					type: "class"
				}
			});
		var words3 = sugg3.filter((s) => s.toLowerCase().startsWith(plc)),
			msugg3 = words3.map((w) => {
				return {
					text: w,
					description: "Global functions",
					rightLabelHTML: "Functions",
					leftLabelHTML: "ProtoSS",
					type: "function"
				}
			});
		return msugg.concat(msugg2).concat(msugg3);
	}
}

class AsyncProvider {
	constructor() {
		this.selector = '*';
		this.suggestionPriority = 22;
	}

	getSuggestions(options) {
		if (main.cfg.autoComplete === 'no') return [];
		return this.findMatchingSuggestions(options.prefix);
	}

	findMatchingSuggestions(prefix) {
		var sugg = [];
		return sugg;
	}
}

function updateCFG(cfg) {
	main.cfg = cfg;
}

module.exports.updateCFG = updateCFG;
module.exports.file = new FileProvider();
module.exports.basic = new BasicProvider();
module.exports.async = new AsyncProvider();
