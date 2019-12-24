/**
 * Author: Zeta Ret
 * ProtoSS package autocomplete providers
 **/

var fs = require('fs'),
	path = require('path');

var dollyData = {
	reservedWords: [],
	nativeClasses: [],
	globalFunctions: [],
	labels: {},
	desc: {},
	lefts: {}
};

var main = {
	cfg: {}
};

var gjs, gkey, keytid, reservedWords, nativeClasses, globalFunctions, labels, desc, udata, lefts, vtype, dictionary = {};

var data, setdata = [
	['css', 'autoCompleteCSS', './autocomplete-css.js'],
	['html', 'autoCompleteHTML', './autocomplete-html.js']
];

function updateData(bdata) {
	reservedWords = bdata.reservedWords;
	nativeClasses = bdata.nativeClasses;
	globalFunctions = bdata.globalFunctions;
	labels = bdata.labels;
	desc = bdata.desc;
	lefts = bdata.lefts;
	vtype = bdata.vtype;
	udata = bdata;
}

function loadDictionary(id, mod) {
	var did = dictionary[id],
		d = did || require(mod);
	if (!did) dictionary[id] = d;
	return d;
}

function setGrammar(xgjs) {
	var xgkey = xgjs.name + ':' + setdata.map(e => main.cfg[e[1]]).join(':');
	if (gkey !== xgkey) {
		clearTimeout(keytid);
		gjs = xgjs;
		gkey = xgkey;

		keytid = setTimeout(() => {
			if (main.cfg.autoComplete === 'yes') {
				data = require('./autocomplete-data.js');
				updateData(data);

				var dictionarylist = [];
				setdata.forEach(e => {
					if (main.cfg[e[1]] === 'yes') {
						loadDictionary(e[0], e[2]);
						dictionarylist.push(e[0]);
					}
				});
				if (dictionarylist.length > 0) updateData(getMerged(dictionarylist, true, gjs.name));
			} else updateData(dollyData);
		}, 0);
	}
}

function getMerged(ids, includeData, gid) {
	var k, i, d, m = {};
	m.reservedWords = [];
	m.nativeClasses = [];
	m.globalFunctions = [];
	m.labels = new Map();
	m.desc = new Map();
	m.lefts = new Map();
	m.vtype = new Map();
	m.types = [];
	if (includeData && (!gid || data.types.indexOf(gid) !== -1)) {
		m.reservedWords = m.reservedWords.concat(reservedWords);
		m.nativeClasses = m.nativeClasses.concat(nativeClasses);
		m.globalFunctions = m.globalFunctions.concat(globalFunctions);
		for (k in labels) m.labels.set(k, labels[k]);
		for (k in desc) m.desc.set(k, desc[k]);
		for (k in lefts) m.lefts.set(k, lefts[k]);
		for (k in vtype) m.vtype.set(k, vtype[k]);
		m.types = m.types.concat(data.types);
		if (data.noFile) m.noFile = true;
		if (data.noAsync) m.noAsync = true;
	}
	for (i = 0; i < ids.length; i++) {
		d = dictionary[ids[i]];
		if (!gid || d.types.indexOf(gid) !== -1) {
			m.reservedWords = m.reservedWords.concat(d.reservedWords);
			m.nativeClasses = m.nativeClasses.concat(d.nativeClasses);
			m.globalFunctions = m.globalFunctions.concat(d.globalFunctions);
			m.labels = new Map([...m.labels, ...d.labels]);
			m.desc = new Map([...m.desc, ...d.desc]);
			m.lefts = new Map([...m.lefts, ...d.lefts]);
			m.vtype = new Map([...m.vtype, ...d.vtype]);
		}
		m.types = m.types.concat(d.types);
		if (d.noFile) m.noFile = true;
		if (d.noAsync) m.noAsync = true;
	}
	return m;
}

function sorter(e1, e2, e, prefix) {
	var ei, ei1, ei2, r = 0,
		e1c = e1.text.toLowerCase().match(e),
		e2c = e2.text.toLowerCase().match(e);

	if (!e1c && e2c) r = 1;
	else if (e1c && !e2c) r = -1;
	else if (e1c) {
		ei1 = e1c[0].indexOf(prefix);
		ei2 = e2c[0].indexOf(prefix);
		ei = (e1c.index + (ei1 > 0 ? ei1 : 0)) - (e2c.index + (ei2 > 0 ? ei2 : 0));
		ei1 = ei1 >= 0;
		ei2 = ei2 >= 0;

		if (ei1 && prefix.length === e1.text.length) r = -1;
		else if (ei2 && prefix.length === e2.text.length) r = 1;
		else if (ei1 && ei2 && ei < 0) r = -1;
		else if (ei1 && ei2 && ei > 0) r = 1;
		else if (ei1 && ei2 && e1.text.length < e2.text.length) r = -1;
		else if (ei1 && ei2 && e1.text.length > e2.text.length) r = 1;
		else if (ei1 && !ei2) r = -1;
		else if (ei2 && !ei1) r = 1;
		else if (ei < 0) r = -1;
		else if (ei > 0) r = 1;
	}
	return r;
}

updateData(dollyData);

class FileProvider {
	constructor() {
		this.selector = '*';
		this.suggestionPriority = 22;
	}

	getSuggestions(options) {
		if (main.cfg.autoComplete === 'no' || udata.types.indexOf(main.cfg.activeGrammar.name) === -1 || udata.noFile) return [];
		var prefix = this.getPrefix(options.prefix, options.editor, options.bufferPosition);
		return this.findMatchingSuggestions(prefix, options);
	}

	getPrefix(prefix, editor, bufferPosition) {
		var line = editor.getTextInRange([
			[bufferPosition.row, 0], bufferPosition
		]);
		var spl = line.split(/\'|\"|\`|\(|\[|\{|\<|\=|\:|\s/),
			l = spl.pop();
		return l || prefix;
	}

	findMatchingSuggestions(prefix, options) {
		var ep = options.editor.getPath();
		if (!ep) return [];
		var p = ep.split(path.sep);
		p.pop();
		var trim = prefix.trim();
		if (trim.charAt(0) !== '.') return [];
		var f, isDir, pp = path.resolve(p.join(path.sep), trim),
			found = 0,
			prpath = atom.project.getPaths();
		prpath.forEach(function(el) {
			if (pp.indexOf(el) === 0) found++;
		});

		if (!found) return [];

		try {
			isDir = fs.statSync(pp).isDirectory();
			if (isDir) pp += path.sep;
		} catch (e) {
			if (main.cfg.console === 'yes') console.log(e);
		}

		var ld = pp.split(path.sep),
			ldp = ld[ld.length - 1] ? ld.pop().toLowerCase() : "",
			sc = ld.join(path.sep);

		try {
			if (fs.existsSync(sc)) f = fs.readdirSync(sc);
			else f = [];
		} catch (e) {
			if (main.cfg.console === 'yes') console.log(e);
			f = [];
		}

		var sugg = f;
		var e = new RegExp('[' + ldp.split('').join('][\\w|\\W]*[') + '][\\w|\\W]*');
		var words = !ldp ? sugg : sugg.filter((s) => s.toLowerCase().match(e)),
			msugg = words.map((w) => {
				return {
					text: w,
					description: "Located in folder:\n" + sc,
					rightLabelHTML: "File/Folder/Module",
					leftLabelHTML: "ProtoSS",
					type: "module"
				}
			});
		if (main.cfg.autoCompleteSort === 'yes') msugg.sort((e1, e2) => sorter(e1, e2, e, ldp));
		return msugg;
	}
}

class BasicProvider {
	constructor() {
		this.selector = '*';
		this.suggestionPriority = 21;
	}

	getSuggestions(options) {
		if (main.cfg.autoComplete === 'no' || udata.types.indexOf(main.cfg.activeGrammar.name) === -1) return [];
		return this.findMatchingSuggestions(options.prefix);
	}

	findMatchingSuggestions(prefix) {
		var sugg = reservedWords,
			sugg2 = nativeClasses,
			sugg3 = globalFunctions,
			plc = prefix.toLowerCase();
		var e = new RegExp('[' + plc.split('').join('][\\w|\\W]*[') + '][\\w|\\W]*');
		var words = !plc ? sugg : sugg.filter((s) => s.toLowerCase().match(e)),
			msugg = words.map((w) => {
				return {
					text: w,
					description: (desc.constructor === Map ? desc.get(w) : desc[w]) || udata.wordDesc || "Lexical grammar",
					rightLabelHTML: (labels.constructor === Map ? labels.get(w) : labels[w]) || udata.wordRightLabel || "Reserved word",
					leftLabelHTML: (lefts.constructor === Map ? lefts.get(w) : lefts[w]) || udata.wordLeftLabel || "ProtoSS",
					type: (vtype ? (vtype.constructor === Map ? (vtype.get(w) || '').toString() : vtype[w]) : null) || "w"
				}
			});
		var words2 = !plc ? sugg2 : sugg2.filter((s) => s.toLowerCase().match(e)),
			msugg2 = words2.map((w) => {
				return {
					text: w,
					description: (desc.constructor === Map ? desc.get(w) : desc[w]) || udata.classDesc || "Standard built-in objects",
					rightLabelHTML: (labels.constructor === Map ? labels.get(w) : labels[w]) || udata.classRightLabel || "Native Classes",
					leftLabelHTML: (lefts.constructor === Map ? lefts.get(w) : lefts[w]) || udata.classLeftLabel || "ProtoSS",
					type: (vtype ? (vtype.constructor === Map ? (vtype.get(w) || '').toString() : vtype[w]) : null) || "class"
				}
			});
		var words3 = !plc ? sugg3 : sugg3.filter((s) => s.toLowerCase().match(e)),
			msugg3 = words3.map((w) => {
				return {
					text: w,
					description: (desc.constructor === Map ? desc.get(w) : desc[w]) || udata.funcDesc || "Global functions",
					rightLabelHTML: (labels.constructor === Map ? labels.get(w) : labels[w]) || udata.funcRightLabel || "Functions",
					leftLabelHTML: (lefts.constructor === Map ? lefts.get(w) : lefts[w]) || udata.funcLeftLabel || "ProtoSS",
					type: (vtype ? (vtype.constructor === Map ? (vtype.get(w) || '').toString() : vtype[w]) : null) || "function"
				}
			});
		var cwords = msugg.concat(msugg2).concat(msugg3);
		if (main.cfg.autoCompleteSort === 'yes' && prefix && prefix.charAt(0).match(new RegExp('\\w'))) cwords.sort((e1, e2) => sorter(e1, e2, e, plc));
		return cwords;
	}
}

class AsyncProvider {
	constructor() {
		this.selector = '*';
		this.suggestionPriority = 20;
		this.fetchAsyncData = null;
	}

	getSuggestions(options) {
		if ((main.cfg.autoComplete === 'no' && main.cfg.autoCompleteNS === 'no') || udata.types.indexOf(main.cfg.activeGrammar.name) === -1 || udata.noAsync) return [];
		return this.findMatchingSuggestions(options.prefix, options);
	}

	filterData(prefix, sugg) {
		prefix = prefix.toLowerCase();
		var e = new RegExp('[' + prefix.split('').join('][\\w|\\W]*[') + '][\\w|\\W]*');
		var words = !prefix ? sugg : sugg.filter((s) => ((main.cfg.autoCompleteNS === 'yes' ? s.leftLabelHTML + '.' : '') + s.text).toLowerCase().match(e));
		if (main.cfg.autoCompleteSort === 'yes' && prefix && prefix.charAt(0).match(new RegExp('\\w'))) words.sort((e1, e2) => sorter(e1, e2, e, prefix));
		return words;
	}

	asyncData(resolve, prefix, options) {
		if (this.fetchAsyncData) this.fetchAsyncData(resolve, prefix, options, this.filterData);
		else resolve([]);
	}

	findMatchingSuggestions(prefix, options) {
		var o = this;
		return new Promise(resolve => o.asyncData(resolve, prefix, options));
	}
}

function updateCFG(cfg) {
	main.cfg = cfg;
}

module.exports.updateCFG = updateCFG;
module.exports.updateData = updateData;
module.exports.getMerged = getMerged;
module.exports.loadDictionary = loadDictionary;
module.exports.setGrammar = setGrammar;
module.exports.defaultData = data;
module.exports.file = new FileProvider();
module.exports.basic = new BasicProvider();
module.exports.async = new AsyncProvider();