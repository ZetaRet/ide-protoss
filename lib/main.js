/**
 * Author: Zeta Ret
 * Date: 2018 - Today
 * ProtoSS package for Atom IDE
 **/
var fs = require('fs');

var cfg = {
		packageid: 'ide-protoss',
		docjsonname: 'protossdox.json',
		tokenTimeout: 500,
		fileTimeout: 500
	},
	nskey = cfg.packageid + '.',
	cfgkeys = ['breadcrumbs', 'console', 'textColor', 'fontSize', 'notifications', 'groupdigits'],
	cfgobserve = {},
	disposables = null,
	bindings = {};
var defDescriptor = {
	author: "",
	description: "",
	text: "",
	requires: "",
	version: "",
	date: "",
	supername: "",
	inherits: [],
	interfaces: [],
	static: {
		public_properties: {},
		protected_properties: {},
		private_properties: {},
		public_methods: {},
		protected_methods: {},
		private_methods: {}
	},
	public_properties: {},
	protected_properties: {},
	private_properties: {},
	public_methods: {},
	protected_methods: {},
	private_methods: {},
	static_descriptions: {},
	descriptions: {},
	static_examples: {},
	examples: {}
};
var defProtodox = {
	name: "",
	type: "protossdox",
	path: "",
	src: "",
	namespace: "",
	relative: true,
	markdown: true
};

function cfgGet(name) {
	cfg[name] = atom.config.get(nskey + name);
}

function getAllCfg() {
	cfgkeys.forEach(function(el) {
		cfgGet(el);
	});
}

getAllCfg();

if (cfg.console === 'yes') console.log('#protoss ide#start');

var packagepanel, topEl = document.createElement('div');
topEl.classList.add('protoss-top-panel');
topEl.style.margin = '4px';
cfgobserve.textColor = function(v) {
	topEl.style.color = cfg.textColor === 'default' ? 'inherit' : cfg.textColor;
};
cfgobserve.fontSize = function(v) {
	topEl.style.fontSize = cfg.fontSize === 'default' ? 'inherit' : cfg.fontSize;
};

function initPackage() {
	var ideprotoss_pack = atom.packages.getActivePackage(cfg.packageid);
	if (ideprotoss_pack) {
		ideprotoss_pack.TokenUtil = TokenUtil;
		ideprotoss_pack.ExternalUtil = ExternalUtil;
	}
	if (!packagepanel) {
		packagepanel = atom.workspace.addTopPanel({
			item: topEl
		});
		cfgobserve.textColor();
		cfgobserve.fontSize();
	}
}

function destroyPackage() {
	if (packagepanel) {
		packagepanel.destroy();
		packagepanel = null;
	}
}

function unloadPackage() {
	destroyPackage();
	if (cfg.editor && cfg.editor.disposeChange) cfg.editor.disposeChange.dispose();
	for (var k in disposables) disposables[k].dispose();
	disposables = null;
}

function readDocJson(e, b) {
	if (e) return;
	var projson = null,
		p = cfg.editor.getPath();
	try {
		projson = JSON.parse(b.toString());
	} catch (e) {}
	cfg.projson = projson;
	if (projson && projson.type === 'protossdox') {
		var jpath = cfg.jsonpath.split('\\');
		jpath.pop();
		jpath = jpath.join('\\') + '\\';
		var srcpath = jpath + (projson.src || '');
		var cpath = p.replace(srcpath.split('/').join('\\'), '').split('.');
		var cext = cpath.pop();
		cpath = cpath.join('.');
		var pjp = projson.path ? projson.path.split('/').join('\\') : '';
		var descpath = (projson.relative ? jpath + pjp : pjp) + cpath + '.json';
		var mdpath = (projson.relative ? jpath + pjp : pjp) + cpath + '.md';
		var csplit = cpath.split('\\');
		var fname = csplit.pop();
		var sname = (projson.namespace ? projson.namespace + '.' : '') + (csplit.length > 0 ? csplit.join('.') + '.' : '') + fname.split('.').join('');
		var snamens = sname.split('.');
		var clsname = snamens.pop();
		sname = (snamens.length > 0 ? snamens.join('.') + '::' : '') + clsname;
		cfg.descpath = descpath;
		jsonEl.innerHTML = cpath.split(new RegExp('<|>')).join('') + '.json';
		jsonEl.setAttribute('path', descpath);
		jsonEl.setAttribute('supername', sname);
		jsonEl.setAttribute('ext', cext);
		jsonEl.setAttribute('mdpath', mdpath);
		jsonEl.setAttribute('cpath', cpath);
		jsonEl.style.pointerEvents = 'inherit';
		var prnm = projson.name ? projson.name.trim().split(new RegExp('<|>')).join('') : "";
		packEl.innerHTML = prnm || '[Unknown Project]';
		packEl.className = 'icon icon-settings';
		packEl.setAttribute('path', cfg.jsonpath);
		packEl.style.pointerEvents = 'inherit';

		if (fs.existsSync(descpath)) {
			fs.readFile(descpath, function(e, b) {
				if (cfg.descpath === descpath)
					readDescFile(e, b);
			});
		}
	}
}

function readDescFile(e, b) {
	if (e) return;
	var descjson = null;
	try {
		descjson = JSON.parse(b.toString());
	} catch (e) {}
	cfg.descjson = descjson;
	var pc = 0,
		spc = 0,
		mc = 0,
		smc = 0,
		k, atxt;
	if (descjson) {
		var jpath = cfg.jsonpath.split('\\');
		jpath.pop();
		jpath = jpath.join('\\') + '\\';
		var dspl, ret, jprop = [],
			jmeth = [],
			tst, fp;
		tst = 'font-size:13px;line-height:18px;display:inline;white-space:normal;';
		if (descjson.public_properties) {
			for (k in descjson.public_properties) {
				pc++;
				jprop.push('<div style="' + tst + '"><b>' + k + '</b> - ' + parsePropertyType(descjson.public_properties[k]).text + '</div>');
			}
			if (jprop.length > 0) jprop.unshift('<h3>Properties:</h3>');
		}
		if (descjson.public_methods) {
			for (k in descjson.public_methods) {
				mc++;
				dspl = descjson.public_methods[k].split(';');
				ret = dspl[1] ? dspl[1].trim() : '';
				if (ret.indexOf('return ') === 0) ret = ret.substr(7);
				jmeth.push('<div style="' + tst + '"><b>' + k + '</b>(' + parseArgumentsTypes(dspl[0]).text + ') : ' + (parseReturnType(ret).text || 'void') + '</div>');
			}
			if (jmeth.length > 0) jmeth.unshift('<h3>Methods:</h3>');
		}
		if (descjson.static && descjson.static.public_properties) {
			fp = false;
			for (k in descjson.static.public_properties) {
				spc++;
				if (!fp) {
					fp = true;
					jprop.push('<h3>Static Properties:</h3>');
				}
				jprop.push('<div style="' + tst + '"><b>' + k + '</b> - ' + parsePropertyType(descjson.static.public_properties[k]).text + '</div>');
			}
		}
		if (descjson.static && descjson.static.public_methods) {
			fp = false;
			for (k in descjson.static.public_methods) {
				smc++;
				if (!fp) {
					fp = true;
					jmeth.push('<h3>Static Methods:</h3>');
				}
				dspl = descjson.static.public_methods[k].split(';');
				ret = dspl[1] ? dspl[1].trim() : '';
				if (ret.indexOf('return ') === 0) ret = ret.substr(7);
				jmeth.push('<div style="' + tst + '"><b>' + k + '</b>(' + parseArgumentsTypes(dspl[0]).text + ') : ' + (parseReturnType(ret).text || 'void') + '</div>');
			}
		}
		var inh = descjson.inherits && descjson.inherits.constructor === Array ? descjson.inherits : [],
			newinh = [];
		atxt = '<span class="json-prop">Properties: ' + pc + '-' + spc + '</span>,' +
			' <span class="json-meth">Methods: ' + mc + '-' + smc +
			'</span>, Inherits: ';
		var ft = [];
		if (descjson.supername) ft.push('Supername: ' + descjson.supername);
		if (descjson.version) ft.push('Version: ' + descjson.version);
		if (descjson.date) ft.push('Date: ' + descjson.date);
		if (descjson.requires) ft.push('Requires: ' + descjson.requires);
		if (descjson.description) ft.push('Description: ' + descjson.description);
		if (descjson.text) ft.push('Text: ' + descjson.text);
		if (ft.length > 0) fileEl.setAttribute('title', ft.join('\n'));
		inh.forEach(function(el) {
			var sn, fn, e = parseReturnType(el).text;
			var ele = document.createElement('span');
			sn = e;
			ele.setAttribute('supername', sn);
			e = e.split('::');
			if (e.length > 1) e = e[1];
			else e = e[0];
			ele.innerHTML = e.split(new RegExp('<|>')).join('');
			ele.style.marginRight = '4px';
			fn = sn.split('.').join('\\').replace('::', '\\');
			var ns = cfg.projson.namespace.split('.').join('\\');
			var samens = false;
			if (fn.indexOf(ns) === 0) {
				fn = fn.replace(ns, '');
				samens = true;
			}
			if (fn.charAt(0) === '\\') fn = fn.substr(1);
			fn = (jpath + (cfg.projson.src || '') + fn + '.js').split('/').join('\\');

			if (samens) {
				if (!cfg.supersEl) cfg.supersEl = [];
				cfg.supersEl.push(ele);
				ele.style.cursor = 'pointer';
				ele.setAttribute('path', fn);
				ele.setAttribute('title', 'Click to open ' + fn);
				ele.addEventListener('click', function(e) {
					atom.open({
						pathsToOpen: [fn],
						newWindow: false
					});
				});
			}
			newinh.push(ele);
		});
		if (newinh.length > 0) {
			analyEl.innerHTML = atxt;
			newinh.forEach(function(el) {
				analyEl.appendChild(el);
			});
		} else {
			analyEl.innerHTML = atxt + 'none';
		}
		analyEl.className = 'icon icon-info';
		var propspan = analyEl.getElementsByClassName("json-prop")[0],
			methspan = analyEl.getElementsByClassName("json-meth")[0],
			tooltipst;
		tooltipst = ['text-align: left !important',
			'max-width:' + Math.round(window.innerWidth / 2) + 'px',
			'overflow:overlay',
			'padding:5px 20px',
			'max-height:' + Math.round(window.innerHeight / 2) + 'px'
		].join(';') + ';';
		if (propspan && jprop.length > 0) {
			propspan.style.cursor = 'pointer';
			atom.tooltips.add(propspan, {
				title: '<div style="' + tooltipst + ';">' + jprop.join('<br/>') + '</div>',
				trigger: 'click'
			});
			propspan.setAttribute('title', 'Click to view Properties Tooltip');
		}
		if (methspan && jmeth.length > 0) {
			methspan.style.cursor = 'pointer';
			atom.tooltips.add(methspan, {
				title: '<div style="' + tooltipst + ';">' + jmeth.join('<br/>') + '</div>',
				trigger: 'click'
			});
			methspan.setAttribute('title', 'Click to view Methods Tooltip');
		}
		if (cfg.notifications === 'yes') atom.notifications.addSuccess(jsonEl.getAttribute('cpath') + ' descriptor loaded');
	}
}

function parsePropertyType(str) {
	var r = {
		str: str
	};
	r.spl = str.split(':');
	r.prop = r.spl[0].split(']')[0].split('[').join('').trim();
	r.val = r.spl.length > 1 ? r.spl[1] : null;
	r.text = r.prop;
	if (r.val !== null) r.text += ": " + r.val;
	return r;
}

function parseReturnType(str) {
	var r = {
		str: str
	};
	r.prop = str.split(']')[0].split('[').join('').trim();
	r.text = r.prop;
	return r;
}

function parseArgumentsTypes(str) {
	var r = {
		str: str
	};
	r.spl = str.split(',');
	r.spl.forEach(function(el, i) {
		r.spl[i] = parseReturnType(el).text;
	});
	r.text = r.spl.join(', ');
	return r;
}

function groupDigits(gd) {
	return gd.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatBytes(bytes) {
	var i, sizes = ['Bytes', 'KB', 'MB'];
	if (bytes < 1024) i = 0;
	else if (bytes < Math.pow(1024, 2)) i = 1;
	else i = 2;
	return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function updateLinesCount(editor) {
	var lc = editor ? editor.getLineCount() : -1;
	if (cfg.groupdigits === 'yes' && lc !== -1) lc = groupDigits(lc);
	linesEl.innerHTML = lc !== -1 ? lc + ' lines' : 'no lines';
	linesEl.style.pointerEvents = lc === -1 ? 'none' : 'inherit';
}

function updateTokens(nt) {
	if (cfg.groupdigits === 'yes') nt = groupDigits(nt);
	tokensEl.innerHTML = nt + ' tokens';
	tokensEl.className = '';
}

function updateProtoSSCrumbs(editor, wait) {
	var p, ps, jsfile;
	if (cfg.editor && cfg.editor.disposeChange) {
		cfg.editor.disposeChange.dispose();
	}
	cfg.editor = editor;
	cfg.descjson = null;
	cfg.projson = null;
	cfg.jsonpath = null;
	cfg.descpath = null;
	cfg.activeTokens = null;
	cfg.supersEl = null;
	if (cfg.asyncIteratorStop) cfg.asyncIteratorStop();
	if (cfg.tokenTimeoutId !== undefined) window.clearTimeout(cfg.tokenTimeoutId);
	delete cfg.tokenTimeoutId;
	if (cfg.fileTimeoutId !== undefined) window.clearTimeout(cfg.fileTimeoutId);
	delete cfg.fileTimeoutId;
	if (editor) {
		p = editor.getPath();
		if (cfg.console === 'yes') console.log('change editor: ' + p);
	}
	if (p) {
		ps = p.split('\\');
		jsfile = ps.pop();
		if (jsfile.split('.').pop() !== 'js') {
			jsfile = null;
		}
	}
	if (cfg.breadcrumbs) {
		switch (cfg.breadcrumbs) {
			case 'yes':
				topEl.style.display = 'block';
				break;
			case 'no':
				topEl.style.display = 'none';
				break;
			case 'auto':
			default:
				topEl.style.display = jsfile ? 'block' : 'none';
		}
	}
	fileEl.setAttribute('title', '');
	fileEl.innerHTML = (p || "").split(new RegExp('<|>')).join('') || 'no editor';
	updateLinesCount(editor);
	tokensEl.innerHTML = 'no tokens';
	tokensEl.className = '';
	tokensEl.style.pointerEvents = 'none';
	jsonEl.innerHTML = '';
	jsonEl.setAttribute('path', '');
	jsonEl.setAttribute('mdpath', '');
	jsonEl.setAttribute('cpath', '');
	jsonEl.setAttribute('ext', '');
	jsonEl.setAttribute('supername', '');
	jsonEl.style.pointerEvents = 'none';
	packEl.innerHTML = '';
	packEl.className = '';
	packEl.setAttribute('path', '');
	packEl.style.pointerEvents = 'none';
	analyEl.innerHTML = '';
	analyEl.className = '';

	if (jsfile) {
		cfg.altered = true;
		if (!wait || !cfg.tokenTimeout) TokenUtil.refreshTokens(editor, true);
		else {
			tokensEl.innerHTML = 'wait tokens';
			tokensEl.className = 'icon icon-sync';
			cfg.tokenTimeoutId = setTimeout(function() {
				if (editor === atom.workspace.getActiveTextEditor()) TokenUtil.refreshTokens(editor, true);
				else {
					if (cfg.console === 'yes') console.log('editor lingers token refresh');
				}
			}, cfg.tokenTimeout);
		}
		editor.disposeChange = editor.onDidStopChanging(function() {
			cfg.altered = true;
		});
		cfg.fileTimeoutId = setTimeout(function() {
			if (editor === atom.workspace.getActiveTextEditor()) {
				var docf, docjson = cfg.docjsonname;

				function fileRead(e, b) {
					if (cfg.jsonpath === docf)
						readDocJson(e, b);
				}
				while (ps.length > 1) {
					docf = ps.join('\\') + '\\' + docjson;
					if (fs.existsSync(docf)) {
						cfg.jsonpath = docf;
						fs.readFile(docf, fileRead);
						break;
					} else {
						ps.pop();
					}
				}
				if (!cfg.jsonpath) {
					packEl.innerHTML = '[Create ProtoSS Dox]';
					packEl.className = 'icon icon-settings';
					packEl.style.pointerEvents = 'inherit';
				}
			} else {
				if (cfg.console === 'yes') console.log('editor lingers file read');
			}
		}, wait ? cfg.fileTimeout || 0 : 0)
	}
}

class ProtoSSUtil {
	static projson() {
		var p = packEl.getAttribute('path'),
			prPaths, found = 0,
			paths;
		if (p) {
			atom.open({
				pathsToOpen: [p],
				newWindow: false
			});
		} else {
			prPaths = atom.project.getPaths();
			p = atom.workspace.getActiveTextEditor().getPath();
			paths = [];
			if (p) {
				prPaths.forEach(function(el) {
					if (p.indexOf(el) === 0) found++;
					var sel = el.split('\\');
					sel.reverse();
					paths.push(sel.join('\\'));
				});
			}
			if (found) {
				atom.confirm({
					message: 'Create ProtoSS Documentation JSON of this Project',
					detail: 'Select path to create ' + cfg.docjsonname + ' of this Project. Paths appear reversed.',
					buttons: ['Cancel'].concat(paths)
				}, response => {
					if (response !== 0) {
						var jp = prPaths[response - 1] + '\\' + cfg.docjsonname;
						packEl.setAttribute('path', jp);
						atom.workspace.open(jp).then(function(editor) {
							if (editor.getText().length === 0) {
								editor.setText(JSON.stringify(defProtodox));
								editor.setCursorBufferPosition([0, 9]);
							}
						});
					}
				});
			} else {
				atom.confirm({
					message: 'This file is not part of the Project structure',
					detail: 'Try creating new Project in IDE, or open the file in its Project space.',
					buttons: ['Cancel']
				}, response => {

				});
			}

		}
	}

	static jsonmd(md) {
		var p = jsonEl.getAttribute('path'),
			sn = jsonEl.getAttribute('supername'),
			mp = jsonEl.getAttribute('mdpath');
		if (md && mp) {
			atom.workspace.open(mp);
		} else if (p) {
			atom.workspace.open(p).then(function(editor) {
				var t = editor.getText();
				if (!t) {
					var k, jdesc = {};
					for (k in defDescriptor) jdesc[k] = defDescriptor[k];
					jdesc['supername'] = sn;
					editor.setText(JSON.stringify(jdesc));
				}
			});
		}
	}

	static openSupers() {
		if (cfg.supersEl) {
			cfg.supersEl.forEach(function(el) {
				var p = el.getAttribute('path');
				if (p) atom.workspace.open(p);
			})
		}
	}
}

class TokenUtil {
	static getActiveTokens() {
		return cfg.activeTokens;
	}

	static getGrammar() {
		return gjs;
	}

	static tokenizeLinesAsync(editor, handler) {
		var lines = editor.getLineCount(),
			tokens = [],
			i = 0,
			lineTokens, ruleStack, refreshTime = 5,
			stime, etime;

		var iid = setInterval(function() {
			stime = (new Date()).getTime();
			for (i; i < lines; i++) {
				lineTokens = gjs.tokenizeLine(editor.getTextInBufferRange([
					[i, 0],
					[i, Number.MAX_SAFE_INTEGER]
				]), ruleStack, ruleStack ? false : true);
				ruleStack = lineTokens.ruleStack;
				tokens.push(lineTokens.tokens);
				etime = (new Date()).getTime();
				if ((etime - stime) >= refreshTime) {
					i++;
					return;
				}
			}
			window.clearInterval(iid);
			delete cfg.asyncIteratorStop;
			handler(tokens);
		}, refreshTime);
		cfg.asyncIteratorStop = function() {
			window.clearInterval(iid);
			delete cfg.asyncIteratorStop;
		};
	}

	static refreshTokensDefault(editor) {
		cfg.altered = false;
		cfg.activeTokens = gjs ? gjs.tokenizeLines(editor.getText()) : [];
		if (cfg.console === 'yes') {
			console.log('editor tokens: ');
			console.log(cfg.activeTokens);
		}
		var nt = TokenUtil.tokenCount();
		updateTokens(nt);
		if (nt > 0) {
			tokensEl.style.pointerEvents = 'inherit';
		}
		updateLinesCount(editor);
	}

	static refreshTokens(editor, asyncit) {
		if (cfg.asyncIteratorStop) cfg.asyncIteratorStop();
		if (!asyncit) TokenUtil.refreshTokensDefault(editor);
		else {
			TokenUtil.tokenizeLinesAsync(editor, function(tokens) {
				cfg.altered = false;
				cfg.activeTokens = tokens;
				if (cfg.console === 'yes') {
					console.log('editor tokens: ');
					console.log(cfg.activeTokens);
				}
				var nt = TokenUtil.tokenCount();
				updateTokens(nt);
				if (nt > 0) {
					tokensEl.style.pointerEvents = 'inherit';
				}
				if (cfg.notifications === 'yes') atom.notifications.addInfo((cfg.groupdigits === 'yes' ? groupDigits(nt) : nt) + ' tokens loaded in ' + editor.getPath());
			});
			tokensEl.innerHTML = 'async tokens';
			tokensEl.className = 'icon icon-sync';
			updateLinesCount(editor);
		}
	}

	static tokenCount() {
		var nt = 0;
		cfg.activeTokens.forEach(function(tl) {
			nt += tl.length;
		});
		return nt;
	}

	static computeCursorToken(tokens, cp) {
		var line = tokens[cp.row],
			l = line.length,
			column = cp.column,
			i, token, st, tv,
			cc = 0;
		if (cfg.console === 'yes') {
			console.log('cursor buffer position:');
			console.log(cp);
		}
		for (i = 0; i < l; i++) {
			token = line[i];
			tv = token.value;
			if (column >= cc && column < (cc + tv.length)) {
				st = token;
				st.start = cc;
				st.end = cc + tv.length;
				st.row = cp.row;
				break;
			}
			cc += tv.length;
		}
		return st;
	}

	static shiftClick() {
		if (cfg.altered) TokenUtil.altClick();
		var ct, cp, tl = cfg.editor.getTabLength();
		cfg.editor.setTabLength(1);
		try {
			while (!ct) {
				cp = cfg.editor.getCursorBufferPosition();
				ct = TokenUtil.computeCursorToken(cfg.activeTokens, cp);
				if (ct) {
					cfg.editor.setSelectedBufferRange([
						[ct.row, ct.end],
						[ct.row, ct.start]
					]);
					break;
				} else if (cp.row < cfg.editor.getLastBufferRow()) {
					cfg.editor.setCursorBufferPosition([cp.row + 1, 0]);
				} else {
					break;
				}
			}
		} catch (e) {
			cfg.editor.setTabLength(tl);
			throw (e);
		}
		cfg.editor.setTabLength(tl);
		if (cfg.console === 'yes') {
			console.log('selected cursor token:');
			console.log(ct);
		}
	}

	static ctrlClick() {
		if (cfg.altered) TokenUtil.altClick();
		var tl = cfg.editor.getTabLength();
		cfg.editor.setTabLength(1);
		try {
			var ct = TokenUtil.computeCursorToken(cfg.activeTokens, cfg.editor.getCursorBufferPosition()),
				prev;
			if (ct) {
				prev = TokenUtil.findTokens(cfg.activeTokens, ct, 1, true);
				if (prev && prev.length > 0) cfg.editor.setCursorBufferPosition([prev[0].row, prev[0].start + prev[0].value.indexOf(prev[0].value.trim())]);
			}
		} catch (e) {
			cfg.editor.setTabLength(tl);
			throw (e);
		}
		cfg.editor.setTabLength(tl);
		if (cfg.console === 'yes') {
			console.log('cursor token:');
			console.log(ct);
			console.log('previous cursor token:');
			console.log(prev);
		}
	}

	static altClick() {
		TokenUtil.refreshTokens(cfg.editor);
	}

	static click() {
		if (cfg.altered) TokenUtil.altClick();
		var tl = cfg.editor.getTabLength();
		cfg.editor.setTabLength(1);
		try {
			var ct = TokenUtil.computeCursorToken(cfg.activeTokens, cfg.editor.getCursorBufferPosition()),
				next;
			if (ct) {
				next = TokenUtil.findTokens(cfg.activeTokens, ct, 1);
				if (next && next.length > 0) cfg.editor.setCursorBufferPosition([next[0].row, next[0].start + next[0].value.indexOf(next[0].value.trim())]);
			}
		} catch (e) {
			cfg.editor.setTabLength(tl);
			throw (e);
		}
		cfg.editor.setTabLength(tl);
		if (cfg.console === 'yes') {
			console.log('cursor token:');
			console.log(ct);
			console.log('next cursor token:');
			console.log(next);
		}
	}

	static findTokens(tokens, token, count, backwards) {
		if (!token) return null;
		var row = token.row,
			line = tokens[row],
			trimv = token.value.trim(),
			i = line.indexOf(token),
			found = [],
			tv, st, cc;
		if (count < 0) count = 0;
		if (backwards) {
			i--;
			cc = token.start;
			for (; i >= 0; i--) {
				st = line[i];
				tv = st.value;
				if (tv.trim() === trimv) {
					st.end = cc;
					st.start = cc - tv.length;
					st.row = row;
					found.push(st);
					if (count && found.length === count) break;
				}
				cc -= tv.length;
			}
			row--;
			while (line = tokens[row]) {
				if (!count || found.length < count) {
					cc = 0;
					for (i = 0; i < line.length; i++) cc += line[i].value.length;
					for (i = line.length - 1; i >= 0; i--) {
						st = line[i];
						tv = st.value;
						if (tv.trim() === trimv) {
							st.end = cc;
							st.start = cc - tv.length;
							st.row = row;
							found.push(st);
							if (count && found.length === count) break;
						}
						cc -= tv.length;
					}
				} else {
					break;
				}
				row--;
			}
		} else {
			cc = token.end;
			i++;
			for (; i < line.length; i++) {
				st = line[i];
				tv = st.value;
				if (tv.trim() === trimv) {
					st.start = cc;
					st.end = cc + tv.length;
					st.row = row;
					found.push(st);
					if (count && found.length === count) break;
				}
				cc += tv.length;
			}
			row++;
			while (line = tokens[row]) {
				if (!count || found.length < count) {
					cc = 0;
					for (i = 0; i < line.length; i++) {
						st = line[i];
						tv = st.value;
						if (tv.trim() === trimv) {
							st.start = cc;
							st.end = cc + tv.length;
							st.row = row;
							found.push(st);
							if (count && found.length === count) break;
						}
						cc += tv.length;
					}
				} else {
					break;
				}
				row++;
			}
		}

		return found;
	}
}

class ExternalUtil {
	static getProjectJSONPath() {
		return packEl.getAttribute('path');
	}
	static getSupername() {
		return jsonEl.getAttribute('supername');
	}
	static getDescriptorPath() {
		return jsonEl.getAttribute('path');
	}
	static getMDPath() {
		return jsonEl.getAttribute('mdpath');
	}
	static getCPath() {
		return jsonEl.getAttribute('cpath');
	}
	static getSupersPaths() {
		var sp = [];
		if (cfg.supersEl) {
			cfg.supersEl.forEach(function(el) {
				var p = el.getAttribute('path');
				if (p) sp.push(p);
			})
		}
		return sp;
	}
	static getProjectJSON() {
		return cfg.projson;
	}
	static getDescriptorJSON() {
		return cfg.descjson;
	}
	static getLines() {
		return cfg.editor ? cfg.editor.getLineCount() : null;
	}
	static getFilePath() {
		return cfg.editor ? cfg.editor.getPath() : null;
	}
	static getEditor() {
		return cfg.editor;
	}
	static scanPath(regex, fnames, callback) {
		var links = [],
			files = [],
			r = 0,
			l = fnames.length;

		function scanned() {
			fnames = [];
			r = 0;
			l = links.length;
			links.forEach(function(el) {
				var f = el[0] + '\\' + el[1];
				fs.stat(f, function(err, stats) {
					if (stats.isFile() && regex.test(el[1])) files.push(el);
					else if (stats.isDirectory()) fnames.push(f);
					r++;
					if (r === l) reset();
				});
			});
		}

		function reset() {
			links = [];
			l = fnames.length;
			r = 0;
			if (l > 0) {
				scan();
			} else {
				callback(files);
			}
		}

		function scan() {
			fnames.forEach(function(el) {
				fs.readdir(el, null, function(err, files) {
					files.forEach(function(f) {
						links.push([el, f]);
					});
					r++;
					if (r === l) scanned();
				});
			});
		}
		scan();
	}
	static getProtoSSDoxInWorkspace(callback) {
		ExternalUtil.scanPath(new RegExp(cfg.docjsonname), atom.project.getPaths(), callback);
	}
}

initPackage();

bindings[cfg.packageid + ':token'] = function() {
	if (tokensEl.style.pointerEvents === 'inherit') TokenUtil.click();
};
bindings[cfg.packageid + ':prevtoken'] = function() {
	if (tokensEl.style.pointerEvents === 'inherit') TokenUtil.ctrlClick();
};
bindings[cfg.packageid + ':seltoken'] = function() {
	if (tokensEl.style.pointerEvents === 'inherit') TokenUtil.shiftClick();
};
bindings[cfg.packageid + ':retoken'] = function() {
	if (tokensEl.style.pointerEvents === 'inherit') TokenUtil.altClick();
};
bindings[cfg.packageid + ':refresh'] = function() {
	updateProtoSSCrumbs(atom.workspace.getActiveTextEditor());
};
bindings[cfg.packageid + ':json'] = function() {
	if (jsonEl.style.pointerEvents === 'inherit') ProtoSSUtil.jsonmd(false);
};
bindings[cfg.packageid + ':md'] = function() {
	if (jsonEl.style.pointerEvents === 'inherit') ProtoSSUtil.jsonmd(true);
};
bindings[cfg.packageid + ':projson'] = function() {
	if (packEl.style.pointerEvents === 'inherit') ProtoSSUtil.projson();
};
bindings[cfg.packageid + ':supers'] = function() {
	ProtoSSUtil.openSupers();
};

var titleEl = document.createElement('span');
titleEl.innerHTML = 'ProtoSS';
titleEl.style.paddingRight = '10px';
titleEl.style.cursor = 'pointer';
titleEl.classList.add('icon');
titleEl.classList.add('icon-' + ['circuit-board', 'beaker'][Math.floor(Math.random() * 2)]);
var kbglobal = ['',
	'Key Bindings:',
	'F7 - locate current token and navigate to next token in editor',
	'CTRL + F7 - locate current token and navigate to previous token in editor',
	'SHIFT + F7 - locate current token and execute selection from start to end of its buffer position, you may chain selection of tokens to trace them visually',
	'ALT + F7 - refresh token database and line count',
	'CTRL + ALT + F7 - refresh ProtoSS IDE',
	'CTRL + SHIFT + F7 - open json descriptor of current js file',
	'ALT + SHIFT + F7 - open md documentation of current js file',
	'CTRL + SHIFT + ALT + F7 - access ProtoSS project protossdox.json',
	'CTRL + SHIFT + F8 - open all js files of class supers from inheritance in the current hierarchy, requires json descriptor'
];
titleEl.setAttribute('title', 'Refresh ProtoSS Panel\n' + kbglobal.join('\n'));
titleEl.addEventListener('click', function(e) {
	updateProtoSSCrumbs(atom.workspace.getActiveTextEditor());
});
topEl.appendChild(titleEl);
var fileEl = document.createElement('span');
fileEl.style.paddingRight = '10px';
fileEl.style.cursor = 'default';
topEl.appendChild(fileEl);
var linesEl = document.createElement('span');
linesEl.style.paddingRight = '10px';
linesEl.style.cursor = 'pointer';
atom.tooltips.add(linesEl, {
	title: function() {
		var t, s = fs.statSync(fileEl.innerText),
			p = ['size', 'atime', 'mtime', 'ctime', 'birthtime', 'dev', 'mode', 'nlink', 'uid', 'gid', 'rdev', 'ino'];
		if (s) {
			t = [];
			s.size = groupDigits(s.size) + ' [' + formatBytes(s.size) + ']';
			for (k in p) t.push('<b>' + p[k] + '</b>: ' + s[p[k]]);
			return '<div style="text-align: left !important;">' + t.join('<br/>') + '</div>';
		}
		return null;
	},
	trigger: 'click'
});
linesEl.setAttribute('title', 'Click to view File Stats Tooltip');
topEl.appendChild(linesEl);
var tokensEl = document.createElement('span');
tokensEl.style.paddingRight = '10px';
tokensEl.style.cursor = 'pointer';
tokensEl.style.pointerEvents = 'none';
tokensEl.setAttribute('title', 'Click to next token, CTRL+Click to previous token, SHIFT+Click to select token, ALT+Click to refresh tokens');
tokensEl.addEventListener('click', function(e) {
	if (e.ctrlKey) {
		TokenUtil.ctrlClick();
	} else if (e.shiftKey) {
		TokenUtil.shiftClick();
	} else if (e.altKey) {
		TokenUtil.altClick();
	} else {
		TokenUtil.click();
	}
});
topEl.appendChild(tokensEl);
var packEl = document.createElement('span');
packEl.style.paddingRight = '10px';
packEl.style.cursor = 'pointer';
packEl.setAttribute('title', 'Access ' + cfg.docjsonname);
packEl.addEventListener('click', function(e) {
	ProtoSSUtil.projson();
});
topEl.appendChild(packEl);
var jsonEl = document.createElement('span');
jsonEl.style.paddingRight = '10px';
jsonEl.style.cursor = 'pointer';
jsonEl.setAttribute('title', 'Click to open JSON, CTRL+Click to open MD');
jsonEl.addEventListener('click', function(e) {
	ProtoSSUtil.jsonmd(e.ctrlKey);
});
topEl.appendChild(jsonEl);
var analyEl = document.createElement('span');
analyEl.style.paddingRight = '10px';
analyEl.style.cursor = 'default';
topEl.appendChild(analyEl);

if (cfg.console === 'yes') console.log(cfg);

var gjs = atom.grammars.getGrammars().find(function(g) {
	return g.name === 'JavaScript';
});

function initDisposables() {
	if (disposables) return;
	disposables = {};
	cfgkeys.forEach(function(el) {
		disposables['cfg.' + el] = atom.config.observe(nskey + el, function(v) {
			cfgGet(el);
			if (cfgobserve[el]) cfgobserve[el](v);
		});
	});
	disposables.activate = atom.packages.onDidActivatePackage(function(package) {
		if (package.name === cfg.packageid) {
			initPackage();
			initDisposables();
		}
	});
	disposables.deactivate = atom.packages.onDidDeactivatePackage(function(package) {
		if (package.name === cfg.packageid) {
			destroyPackage();
		}
	});
	disposables.unload = atom.packages.onDidUnloadPackage(function(package) {
		if (package.name === cfg.packageid) {
			unloadPackage();
		}
	});
	disposables.activeeditor = atom.workspace.onDidChangeActiveTextEditor(function(editor) {
		if (packagepanel)
			updateProtoSSCrumbs(editor, true);
	});
	disposables.matchbinding = atom.keymaps.onDidMatchBinding(function(e) {
		var b = e.binding;
		if (bindings[b.command] && packagepanel) {
			bindings[b.command]();
		}
	});
	disposables.grammar = atom.grammars.onDidAddGrammar(function(e) {
		gjs = atom.grammars.getGrammars().find(function(g) {
			return g.name === 'JavaScript';
		});
	});
}

initDisposables();

if (cfg.console === 'yes') {
	var testTokens =
		'window.package("zetaret.ide.packages.atom").internal(function ProtoSSIdeTest() {\n' +
		'	var o = this,a=arguments;	o.testb=false;	o.testobj={};	o.super(a,true);	var m = {};\n' +
		'  m.testMethod=function(ar1, ar2){\n' +
		'		var iar3=o.testobj[ar1];		if(iar3 && ar2){			o.testb=true;		}		return o;	};\n' +
		'  o.superize(a, m, true, true);	return o;});';
	var tokenArr = gjs ? gjs.tokenizeLines(testTokens) : [];
	console.log('test tokenize:');
	console.log(tokenArr);
}

cfgobserve.breadcrumbs = function(v) {
	updateProtoSSCrumbs(atom.workspace.getActiveTextEditor(), true);
};
updateProtoSSCrumbs(atom.workspace.getActiveTextEditor(), true);

if (cfg.notifications === 'yes') {
	setTimeout(function() {
		atom.notifications.addSuccess('Welcome to ProtoSS IDE', {
			icon: 'heart'
		});
	}, 1000);
}
if (cfg.console === 'yes') console.log('#protoss ide#end');
