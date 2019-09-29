/**
 * Author: Zeta Ret
 * ProtoSS package autocomplete data
 **/

var reservedWords = [' ', '\n',
	'break', 'switch', 'case', 'default', 'continue', 'debugger', 'delete', 'console', 'log',
	'import', 'export', 'extends', 'require', 'module', 'exports', 'include', 'exclude',
	'if', 'else', 'for', 'in', 'of', 'do', 'while', 'finally', 'with', 'yield',
	'class', 'instanceof', 'new', 'return', 'super', 'this', 'global', 'globalThis', 'window', 'document', 'body',
	'throw', 'try', 'catch', 'typeof', 'is', 'as', 'from',
	'const', 'var', 'let', 'void', 'type', 'declare', 'enum',
	'implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'namespace', 'internal', 'abstract', 'final',
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
var labels = {
	' ': 'SPACE',
	'\n': 'NEW LINE',
	'constructor': 'class/function prototype'
};
var desc = {
	' ': 'Insert blank space',
	'\n': 'Insert new line',
	'constructor': 'The constructor method is a special method for creating and initializing an object created within a class.\n' +
		'A constructor can use the `super` keyword to call the constructor of a parent class.'
};

module.exports.types = ['JavaScript', 'TypeScript', 'HTML'];
module.exports.reservedWords = reservedWords;
module.exports.nativeClasses = nativeClasses;
module.exports.globalFunctions = globalFunctions;
module.exports.labels = labels;
module.exports.desc = desc;