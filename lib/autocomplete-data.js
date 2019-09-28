/**
 * Author: Zeta Ret
 * ProtoSS package autocomplete data
 **/

var reservedWords = [' ', 'break', 'switch', 'case', 'default', 'continue', 'debugger', 'delete',
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
var labels = {
	' ': 'SPACE'
};
var desc = {
	' ': 'Insert blank space',
};

module.exports.types = ['JavaScript'];
module.exports.reservedWords = reservedWords;
module.exports.nativeClasses = nativeClasses;
module.exports.globalFunctions = globalFunctions;
module.exports.labels = labels;
module.exports.desc = desc;