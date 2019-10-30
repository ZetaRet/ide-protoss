/**
 * Author: Zeta Ret
 * ProtoSS package autocomplete data
 **/

var reservedWords = [' ', '\n',
	'break', 'switch', 'case', 'default', 'continue', 'debugger', 'delete', 'console',
	'import', 'export', 'extends', 'require', 'module', 'exports', 'include', 'exclude',
	'if', 'else', 'for', 'in', 'of', 'do', 'while', 'finally', 'with', 'yield',
	'class', 'instanceof', 'new', 'return', 'super', 'this', 'global', 'globalThis', 'self',
	'window', 'document', 'body', 'name', 'parent', 'prototype', 'length',
	'throw', 'try', 'catch', 'typeof', 'is', 'as', 'from', 'has', 'add', 'clear',
	'const', 'var', 'let', 'void', 'type', 'declare', 'enum', 'readonly',
	'implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'namespace', 'internal', 'abstract', 'final',
	'function', 'async', 'await', 'constructor', 'arguments', 'callee', 'get', 'set', 'call', 'apply', 'bind',
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
var globalFunctions = ['isFinite', 'isNaN', 'isInteger', 'isSafeInteger', 'parseFloat', 'parseInt',
	'toFixed', 'toExponential', 'toPrecision',
	'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape', 'unescape', 'eval',
	'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
	'atob', 'btoa', 'stringify', 'parse',
	'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toString', 'toLocaleString', 'valueOf'
];
var labels = {
	' ': 'SPACE',
	'\n': 'NEW LINE',
	'constructor': 'Class/Function prototype',
	'hasOwnProperty': 'Object prototype function',
	'isPrototypeOf': 'Object prototype function',
	'propertyIsEnumerable': 'Object prototype function',
	'toString': 'Object prototype function',
	'toLocaleString': 'Object prototype function',
	'valueOf': 'Object prototype function'
};
var desc = {
	' ': 'Insert blank space',
	'\n': 'Insert new line',
	'atob': 'Base64 decode',
	'btoa': 'Base64 encode',
	'constructor': 'The constructor method is a special method for creating and initializing an object created within a class.\n' +
		'A constructor can use the `super` keyword to call the constructor of a parent class.',
	'hasOwnProperty': 'A Boolean indicating whether or not the object has the specified property as own property.',
	'isPrototypeOf': 'A Boolean indicating whether the calling object lies in the prototype chain of the specified object.',
	'propertyIsEnumerable': 'A Boolean indicating whether the specified property is enumerable.',
	'toString': 'A string representing the object.',
	'toLocaleString': 'A string representing the object.',
	'valueOf': 'The primitive value of the specified object.'
};
var lefts = {
	'constructor': 'ProtoSS - Object',
	'hasOwnProperty': 'ProtoSS - Object',
	'isPrototypeOf': 'ProtoSS - Object',
	'propertyIsEnumerable': 'ProtoSS - Object',
	'toString': 'ProtoSS - Object',
	'toLocaleString': 'ProtoSS - Object',
	'valueOf': 'ProtoSS - Object'
};

var arr = ['isArray', 'observe', 'copyWithin', 'entries', 'every',
	'fill', 'filter', 'find', 'findIndex', 'flat', 'flatMap', 'forEach',
	'join', 'keys', 'lastIndexOf', 'map', 'pop', 'push',
	'reduce', 'reduceRight', 'reverse', 'shift', 'some',
	'sort', 'splice', 'unshift', 'values',
	'move', 'subarray', 'unique'
];
arr.forEach(e => {
	desc[e] = 'Array method';
	lefts[e] = 'ProtoSS - Array';
});
var str = ['charAt', 'charCodeAt', 'codePointAt',
	'startsWith', 'endsWith', 'localeCompare', 'match', 'matchAll',
	'normalize', 'padEnd', 'padStart', 'repeat', 'replace', 'search',
	'substr', 'substring', 'toLocaleLowerCase', 'toLocaleUpperCase', 'toLowerCase', 'toUpperCase',
	'trim', 'trimEnd', 'trimStart'
];
str.forEach(e => {
	desc[e] = 'String method';
	lefts[e] = 'ProtoSS - String';
});
var mix = ['concat', 'includes', 'indexOf', 'slice', 'split'];
mix.forEach(e => {
	desc[e] = 'Array/String method';
	lefts[e] = 'ProtoSS - Array/String';
});
var math = ['abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh',
	'cbrt', 'ceil', 'clz32', 'cos', 'cosh', 'exp', 'expm1',
	'floor', 'fround', 'hypot', 'imul', 'log', 'log10', 'log1p', 'log2',
	'max', 'min', 'pow', 'random', 'round',
	'sign', 'sin', 'sinh', 'sqrt', 'tan', 'tanh', 'trunc'
];
math.forEach(e => {
	desc[e] = 'Math method';
	lefts[e] = 'ProtoSS - Math';
});
var date = ['UTC', 'now', 'parse',
	'getDate', 'getDay', 'getFullYear', 'getHours', 'getMilliseconds', 'getMinutes', 'getMonth', 'getSeconds',
	'getYear', 'getTime', 'getTimezoneOffset',
	'getUTCDate', 'getUTCDay', 'getUTCFullYear', 'getUTCHours', 'getUTCMilliseconds', 'getUTCMinutes', 'getUTCMonth', 'getUTCSeconds',
	'setDate', 'setYear', 'setFullYear', 'setHours', 'setMilliseconds', 'setMinutes', 'setMonth', 'setSeconds', 'setTime',
	'setUTCDate', 'setUTCFullYear', 'setUTCHours', 'setUTCMilliseconds', 'setUTCMinutes', 'setUTCMonth', 'setUTCSeconds',
	'toDateString', 'toGMTString', 'toISOString', 'toJSON',
	'toLocaleDateString', 'toLocaleFormat', 'toLocaleTimeString', 'toTimeString', 'toUTCString'
];
date.forEach(e => {
	desc[e] = 'Date method';
	lefts[e] = 'ProtoSS - Date';
});
var dview = ['getBigInt64', 'getBigUint64', 'setBigInt64', 'setBigUint64',
	'getFloat64', 'getFloat32', 'setFloat64', 'setFloat32',
	'getInt32', 'getInt16', 'getInt8', 'setInt32', 'setInt16', 'setInt8',
	'getUint32', 'getUint16', 'getUint8', 'setUint32', 'setUint16', 'setUint8'
];
dview.forEach(e => {
	desc[e] = 'DataView method';
	lefts[e] = 'ProtoSS - DataView';
});
var obj = ['assign', 'create', 'defineProperties', 'defineProperty',
	'freeze', 'fromEntries', 'getPrototypeOf', 'setPrototypeOf',
	'getOwnPropertyDescriptor', 'getOwnPropertyDescriptors', 'getOwnPropertyNames', 'getOwnPropertySymbols',
	'isExtensible', 'isFrozen', 'isSealed', 'seal', 'preventExtensions'
];
obj.forEach(e => {
	desc[e] = 'Object static method';
	lefts[e] = 'ProtoSS - Object';
});
globalFunctions = globalFunctions.concat(arr, str, mix, math, date, dview, obj);

module.exports.types = ['JavaScript', 'TypeScript', 'HTML'];
module.exports.reservedWords = reservedWords;
module.exports.nativeClasses = nativeClasses;
module.exports.globalFunctions = globalFunctions;
module.exports.labels = labels;
module.exports.desc = desc;
module.exports.lefts = lefts;