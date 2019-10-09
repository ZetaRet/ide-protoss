/**
 * Author: Zeta Ret
 * ProtoSS package autocomplete data
 **/

var reservedWords = [' ', '\n',
	'break', 'switch', 'case', 'default', 'continue', 'debugger', 'delete', 'console', 'log',
	'import', 'export', 'extends', 'require', 'module', 'exports', 'include', 'exclude',
	'if', 'else', 'for', 'in', 'of', 'do', 'while', 'finally', 'with', 'yield',
	'class', 'instanceof', 'new', 'return', 'super', 'this', 'global', 'globalThis', 'self',
	'window', 'document', 'body', 'name', 'parent', 'prototype', 'length',
	'throw', 'try', 'catch', 'typeof', 'is', 'as', 'from',
	'const', 'var', 'let', 'void', 'type', 'declare', 'enum', 'readonly',
	'implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'namespace', 'internal', 'abstract', 'final',
	'function', 'async', 'await', 'constructor', 'arguments', 'get', 'set', 'call', 'apply', 'bind',
	'null', 'true', 'false', 'undefined', 'NaN', 'Infinity'
];
var nativeClasses = ['Array', 'Object', 'Function', 'Boolean', 'Symbol', 'String', 'RegExp',
	'Number', 'BigInt', 'Math', 'JSON', 'Date', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Blob',
	'Int8Array', 'Int16Array', 'Int32Array',
	'Uint8Array', 'Uint16Array', 'Uint32Array', 'Uint8ClampedArray',
	'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array',
	'Error', 'EvalError', 'InternalError', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError',
	'ArrayBuffer', 'SharedArrayBuffer', 'Atomics', 'DataView', 'Control', 'Promise', 'Generator', 'GeneratorFunction', 'AsyncFunction',
	'XMLHttpRequest', 'ReflectionSection', 'Reflect', 'Proxy',
	'WebSocket', 'Worker', 'SharedWorker'
];
var globalFunctions = ['eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt',
	'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape', 'unescape',
	'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
	'atob', 'btoa', 'stringify', 'parse', 'toString', 'valueOf'
];
var labels = {
	' ': 'SPACE',
	'\n': 'NEW LINE',
	'constructor': 'Class/Function prototype',
	'toString': 'Object prototype function',
	'valueOf': 'Object prototype function'
};
var desc = {
	' ': 'Insert blank space',
	'\n': 'Insert new line',
	'atob': 'Base64 decode',
	'btoa': 'Base64 encode',
	'constructor': 'The constructor method is a special method for creating and initializing an object created within a class.\n' +
		'A constructor can use the `super` keyword to call the constructor of a parent class.',
	'toString': 'A string representing the object.',
	'valueOf': 'The primitive value of the specified object.'
};
var arr = ['isArray', 'observe', 'concat', 'copyWithin', 'entries', 'every',
	'fill', 'filter', 'find', 'findIndex', 'flat', 'flatMap', 'forEach', 'includes',
	'indexOf', 'join', 'keys', 'lastIndexOf', 'map', 'pop', 'push',
	'reduce', 'reduceRight', 'reverse', 'shift', 'slice', 'some',
	'sort', 'splice', 'toLocaleString', 'unshift', 'values'
];
arr.forEach(e => desc[e] = 'Array method');
globalFunctions = arr.concat(globalFunctions);

module.exports.types = ['JavaScript', 'TypeScript', 'HTML'];
module.exports.reservedWords = reservedWords;
module.exports.nativeClasses = nativeClasses;
module.exports.globalFunctions = globalFunctions;
module.exports.labels = labels;
module.exports.desc = desc;