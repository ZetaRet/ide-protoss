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
	lefts: {},
	types: []
};

var main = {
	cfg: {}
};

var gjs, gkey, keytid, wordLength, reservedWords, nativeClasses, globalFunctions, labels, desc, udata, lefts, vtype, dictionary = {};

var data, setdata = [
	['css', 'autoCompleteCSS', './autocomplete-css.js'],
	['html', 'autoCompleteHTML', './autocomplete-html.js']
];

var regexWord = {
	def: '\\W',
	defInvert: '\\w',
	latin: 'A-Za-z',
	cyrillic: 'А-Яа-я',
	num: '0-9_'
};

const noSortChars = "[](){}<>+-*/=.,?!@#$%^&:;|~`'\"\\";

function getDefaultData() {
	return data;
}

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
	var xgkey = [xgjs.name, main.cfg.autoComplete, ...setdata.map(e => main.cfg[e[1]])].join(':');
	if (gkey !== xgkey) {
		clearTimeout(keytid);
		gjs = xgjs;
		gkey = xgkey;

		keytid = setTimeout(() => {
			if (main.cfg.autoComplete === 'yes') {
				if (!data) data = require('./autocomplete-data.js');
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

function getWordRegExCFG() {
	var rc = {},
		opt = main.cfg.wordRegOptions || {};
	rc.latin = opt.latin === 'yes';
	rc.cyrillic = opt.cyrillic === 'yes';
	rc.num = opt.num === 'yes';
	rc.list = opt.list !== 'None' ? opt.list.split(':')[1].trim() : null;
	rc.custom = (opt.custom || '').split(new RegExp('[\\s]+')).join('');
	rc.hasInput = rc.latin || rc.cyrillic || rc.num || rc.list || rc.custom;
	return rc;
}

function getWordSplitter(invert, wrcfg) {
	var regex, regseq = regexWord[invert ? 'defInvert' : 'def'],
		rc = wrcfg || getWordRegExCFG();
	if (rc.hasInput) {
		regseq = invert ? '' : '^';
		if (rc.latin) regseq += regexWord.latin;
		if (rc.cyrillic) regseq += regexWord.cyrillic;
		if (rc.num) regseq += regexWord.num;
		if (rc.list) regseq += rc.list.split('U+').join('\\u');
		if (rc.custom && !rc.custom.split(new RegExp('-|,')).find(e => !e.match(new RegExp("[U][+][0-9A-F][0-9A-F][0-9A-F][0-9A-F]"))))
			regseq += rc.custom.split('U+').join('\\u').split(',').join('');
	}
	regex = new RegExp('[' + regseq + ']+');
	return regex;
}

function clearBufferWords(editors) {
	if (!editors) editors = atom.workspace.getTextEditors();
	editors.forEach(te => {
		if (te.__bufferWords) {
			te.__bufferWords.changer.dispose();
			delete te.__bufferWords;
		}
	});
}

function bufferWords() {
	var words, editors, ted, tedg, wp = main.cfg.autoCompleteOptions.wordProvider,
		wl = parseInt(main.cfg.autoCompleteOptions.wordLength),
		desc = {},
		mwords = [];
	if (wp !== 'none') {
		ted = atom.workspace.getActiveTextEditor();
		tedg = ted.getGrammar();
		editors = wp !== 'active' ? atom.workspace.getTextEditors() : [ted];
		if (wp === 'same') editors = editors.filter(e => e.getGrammar().name === (tedg.name));
	}
	if (editors && editors.length > 0) {
		if (wordLength !== wl) {
			wordLength = wl;
			clearBufferWords(editors);
		}
		words = editors.map(te => {
			var ten = te.getFileName(),
				tebw = te.__bufferWords,
				bsplit = (tebw ? tebw.bsplit : null) || te.buffer.getText().split(getWordSplitter()),
				setw = tebw || Array.from(new Set(bsplit)).filter(w => w && w.length >= wl),
				countw = main.cfg.wordRegOptions.account === 'yes' ? {} : null;
			if (countw) {
				setw.bsplit = bsplit;
				bsplit.forEach(w => {
					var kw = '#' + w;
					countw[kw] = countw[kw] ? countw[kw] + 1 : 1;
				});
			} else {
				setw.bsplit = [];
			}
			setw.forEach(w => {
				var kw = '#' + w;
				if (!desc[kw]) desc[kw] = [];
				desc[kw].push(ten + (countw ? ' (' + countw[kw] + ')' : ''));
			});
			if (!setw.changer) setw.changer = te.buffer.onDidStopChanging(ec => delete te.__bufferWords);
			te.__bufferWords = setw;
			return setw;
		});
		words.forEach(e => mwords = mwords.concat(e));
		mwords = Array.from(new Set(mwords)).map(w => {
			return {
				text: w,
				description: "Word from TextEditor:\n" + desc['#' + w].join('\n'),
				rightLabelHTML: "Text Buffer Key",
				leftLabelHTML: "ProtoSS - Words",
				type: "keyword"
			}
		});
	}
	return mwords || [];
}

updateData(dollyData);

class CommonProvider {
	constructor() {
		this.selector = '*';
	}

	fuzzyReg(plc) {
		return new RegExp((plc ? '[' + plc.split('').join('][\\w|\\W]*[') + ']' : '') + '[\\w|\\W]*');
	}

	checkPrefix(prefix) {
		return noSortChars.indexOf(prefix.charAt(0)) === -1 ? prefix : '';
	}

	getWordPrefix(prefix, editor, bufferPosition) {
		var spl, line, wrc = getWordRegExCFG();
		if (wrc.hasInput) {
			line = editor.getTextInRange([
				[bufferPosition.row, 0], bufferPosition
			]);
			spl = line.split('').reverse().join('').match(getWordSplitter(true, wrc));
			if (spl && spl.index === 0) prefix = spl[0].split('').reverse().join('');
		}
		return prefix;
	}

	sorthem(plc, e, words) {
		if (words.length > 0 && main.cfg.autoCompleteSort === 'yes' && plc && noSortChars.indexOf(plc.charAt(0)) === -1)
			words.sort((e1, e2) => sorter(e1, e2, e, plc));
	}
}

class FileProvider extends CommonProvider {
	constructor() {
		super();
		this.suggestionPriority = 22;
	}

	getSuggestions(options) {
		if (main.cfg.autoComplete === 'no' || main.cfg.autoCompleteOptions.fileProvider === 'disable' || udata.noFile ||
			(main.cfg.autoCompleteOptions.fileProvider === 'basic' && udata.types.indexOf(main.cfg.activeGrammar.name) === -1)) return [];
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
		if (!trim.startsWith('./') && !trim.startsWith('../')) return [];
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
		} catch (err) {
			if (main.cfg.console === 'yes') console.log(err);
		}

		var ld = pp.split(path.sep),
			ldp = ld[ld.length - 1] ? ld.pop().toLowerCase() : "",
			sc = ld.join(path.sep);

		try {
			if (fs.existsSync(sc)) f = fs.readdirSync(sc, {
				withFileTypes: true
			});
			else f = [];
		} catch (err) {
			if (main.cfg.console === 'yes') console.log(err);
			f = [];
		}

		var sugg = f,
			e = this.fuzzyReg(ldp),
			words = !ldp ? sugg : sugg.filter(s => s.name.toLowerCase().match(e)),
			msugg = words.map(w => {
				return {
					text: w.name,
					description: "Located in folder:\n" + sc,
					rightLabelHTML: w.isFile() ? "File/Module" : "Folder",
					leftLabelHTML: "ProtoSS",
					type: "module"
				}
			});
		if (msugg.length > 0 && main.cfg.autoCompleteSort === 'yes') msugg.sort((e1, e2) => sorter(e1, e2, e, ldp));
		return msugg;
	}
}

class BasicProvider extends CommonProvider {
	constructor(merger) {
		super();
		this.merger = merger;
		this.suggestionPriority = 21;
	}

	getSuggestions(options) {
		if (main.cfg.autoComplete === 'no' || main.cfg.autoCompleteOptions.basicProvider === 'disable' ||
			udata.types.indexOf(main.cfg.activeGrammar.name) === -1) return [];
		return this.findMatchingSuggestions(options.prefix);
	}

	findMatchingSuggestions(prefix) {
		var sugg = reservedWords,
			sugg2 = nativeClasses,
			sugg3 = globalFunctions,
			plc = this.checkPrefix(prefix).toLowerCase(),
			e = this.fuzzyReg(plc),
			words = !plc ? sugg : sugg.filter(s => s.toLowerCase().match(e)),
			msugg = words.map(w => {
				return {
					text: w,
					description: (desc.constructor === Map ? desc.get(w) : desc[w]) || udata.wordDesc || "Lexical grammar",
					rightLabelHTML: (labels.constructor === Map ? labels.get(w) : labels[w]) || udata.wordRightLabel || "Reserved word",
					leftLabelHTML: (lefts.constructor === Map ? lefts.get(w) : lefts[w]) || udata.wordLeftLabel || "ProtoSS",
					type: (vtype ? (vtype.constructor === Map ? (vtype.get(w) || '').toString() : vtype[w]) : null) || "w"
				}
			});
		var words2 = !plc ? sugg2 : sugg2.filter(s => s.toLowerCase().match(e)),
			msugg2 = words2.map(w => {
				return {
					text: w,
					description: (desc.constructor === Map ? desc.get(w) : desc[w]) || udata.classDesc || "Standard built-in objects",
					rightLabelHTML: (labels.constructor === Map ? labels.get(w) : labels[w]) || udata.classRightLabel || "Native Classes",
					leftLabelHTML: (lefts.constructor === Map ? lefts.get(w) : lefts[w]) || udata.classLeftLabel || "ProtoSS",
					type: (vtype ? (vtype.constructor === Map ? (vtype.get(w) || '').toString() : vtype[w]) : null) || "class"
				}
			});
		var words3 = !plc ? sugg3 : sugg3.filter(s => s.toLowerCase().match(e)),
			msugg3 = words3.map(w => {
				return {
					text: w,
					description: (desc.constructor === Map ? desc.get(w) : desc[w]) || udata.funcDesc || "Global functions",
					rightLabelHTML: (labels.constructor === Map ? labels.get(w) : labels[w]) || udata.funcRightLabel || "Functions",
					leftLabelHTML: (lefts.constructor === Map ? lefts.get(w) : lefts[w]) || udata.funcLeftLabel || "ProtoSS",
					type: (vtype ? (vtype.constructor === Map ? (vtype.get(w) || '').toString() : vtype[w]) : null) || "function"
				}
			});
		var cwords = msugg.concat(msugg2).concat(msugg3);
		cwords = this.merger.merge('Basic', cwords);
		this.sorthem(plc, e, cwords);

		return cwords;
	}
}

class AsyncProvider extends CommonProvider {
	constructor(merger) {
		super();
		this.merger = merger;
		this.suggestionPriority = 20;
		this.fetchAsyncData = null;
	}

	getSuggestions(options) {
		if ((main.cfg.autoComplete === 'no' && main.cfg.autoCompleteNS === 'no') ||
			main.cfg.autoCompleteOptions.asyncProvider === 'disable' || udata.noAsync ||
			(main.cfg.autoCompleteOptions.asyncProvider === 'basic' && udata.types.indexOf(main.cfg.activeGrammar.name) === -1)) return [];
		return this.findMatchingSuggestions(options.prefix, options);
	}

	filterData(prefix, sugg) {
		var plc = this.checkPrefix(prefix).toLowerCase(),
			e = this.fuzzyReg(plc),
			words = !plc ? sugg : sugg.filter(s => ((main.cfg.autoCompleteNS === 'yes' ? s.leftLabelHTML + '.' : '') + s.text).toLowerCase().match(e));
		words = this.merger.merge('Async', words);
		this.sorthem(plc, e, words);
		return words;
	}

	asyncData(resolve, prefix, options) {
		if (this.fetchAsyncData) this.fetchAsyncData(resolve, prefix, options, this.filterData, this);
		else resolve([]);
	}

	findMatchingSuggestions(prefix, options) {
		var o = this;
		return new Promise(resolve => o.asyncData(resolve, prefix, options));
	}
}

class WordProvider extends CommonProvider {
	constructor(merger) {
		super();
		this.merger = merger;
		this.suggestionPriority = 19;
	}

	getSuggestions(options) {
		if (main.cfg.autoComplete === 'no' || main.cfg.autoCompleteOptions.wordProvider === 'none') return [];
		var prefix = this.getWordPrefix(options.prefix, options.editor, options.bufferPosition);
		return this.findMatchingSuggestions(prefix, options);
	}

	findMatchingSuggestions(prefix, options) {
		var plc = prefix.toLowerCase(),
			sugg = bufferWords(),
			e = this.fuzzyReg(plc),
			words = !plc ? sugg : sugg.filter(s => s.text.toLowerCase().match(e));
		words = this.merger.merge('Word', words);
		this.sorthem(plc, e, words);
		return words;
	}
}

class MergerProvider extends CommonProvider {
	constructor() {
		super();
		this.suggestionPriority = 18;
		this.words = [];
	}

	updatePriority(providers) {
		var sp, mp = main.cfg.autoCompleteOptions.mergerProvider,
			types = ['Basic', 'Async', 'Word'];
		if (mp !== 'None') {
			types.forEach((t, i) => {
				if (mp.indexOf(t) !== -1) {
					if (sp === undefined) sp = providers[i].suggestionPriority;
					else sp = Math.min(providers[i].suggestionPriority, sp);
				}
			});
			this.suggestionPriority = sp - 1;
		}
	}

	merge(type, words) {
		if (words.length > 0 && main.cfg.autoCompleteOptions.mergerProvider.indexOf(type) !== -1) {
			this.words = this.words.concat(words);
			words = [];
		}
		return words;
	}

	getPrefix(options) {
		var prefix = this.checkPrefix(options.prefix);
		if (main.cfg.autoCompleteOptions.mergerProvider.indexOf('Word') !== -1)
			prefix = this.getWordPrefix(prefix, options.editor, options.bufferPosition);
		return prefix;
	}

	getSuggestions(options) {
		if (main.cfg.autoComplete === 'no' || main.cfg.autoCompleteOptions.mergerProvider === 'None') return [];
		var plc = this.getPrefix(options).toLowerCase(),
			words = this.words,
			e = this.fuzzyReg(plc);
		this.words = [];
		this.sorthem(plc, e, words);
		return words;
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
module.exports.sorter = sorter;
module.exports.clearBufferWords = clearBufferWords;
module.exports.bufferWords = bufferWords;
module.exports.getDefaultData = getDefaultData;
module.exports.file = new FileProvider();
module.exports.merger = new MergerProvider();
module.exports.basic = new BasicProvider(module.exports.merger);
module.exports.async = new AsyncProvider(module.exports.merger);
module.exports.word = new WordProvider(module.exports.merger);