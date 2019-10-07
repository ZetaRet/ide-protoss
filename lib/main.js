/**
 * Author: Zeta Ret
 * Date: 2018 - Today
 * ProtoSS package for Atom IDE
 **/

var fs = require('fs'),
	path = require('path'),
	electron = require('electron'),
	utils = require('./utils.js'),
	readers = require('./readers.js'),
	providers = require('./autocomplete-providers.js'),
	xutils = require('./ExternalUtil.js');

var cfg = {
		packageid: 'ide-protoss',
		docjsonname: 'protossdox.json',
		tokenTimeout: 500,
		fileTimeout: 500,
		grammarId: 'JavaScript',
		editor: null,
		projson: null,
		jsonpath: null,
		descjson: null,
		descpath: null,
		supersEl: null,
		atomprojsons: [],
		commands: {
			token: 0,
			prevtoken: 0,
			seltoken: 0,
			retoken: 1,
			refresh: 1,
			json: 1,
			md: 1,
			projson: 1,
			supers: 1,
			resolve: 0,
			resolveshell: 0,
			openproject: 0,
			buildproject: 0
		},
		contextmenu: {
			token: 'Next Token',
			prevtoken: 'Previous Token',
			seltoken: 'Select Token',
			retoken: 'Retoken Database',
			refresh: 'Refresh IDE',
			json: 'JSON Descriptor',
			md: 'MD Documentation',
			projson: 'Project JSON',
			supers: 'Open Supers',
			resolve: 'Resolve Token',
			resolveshell: 'Resolve Token in Shell'
		}
	},
	nskey = cfg.packageid + '.',
	cfgkeys = [
		'autoComplete', 'autoCompleteNS', 'project', 'xdescript',
		'autoUpdateOnChange', 'breadcrumbs', 'console', 'splitpanel',
		'textColor', 'fontSize', 'notifications', 'groupdigits',
		'grammarId', 'findTokenCaseSensitivity', 'maxTokensPerLine',
		'zetaret_omnipotency'
	],
	css = ['.protoss-button { font-weight: bold; }',
		'.protoss-hover, .protoss-padright { padding-right: 10px; }',
		'.protoss-button:hover, .protoss-hover:hover, .protoss-ihover:hover { text-decoration: underline; }'
	],
	cfgobserve = {},
	disposables = null,
	gjs = null,
	bindings = {};
var parsePropertyType = utils.parsePropertyType,
	parseReturnType = utils.parseReturnType,
	parseArgumentsTypes = utils.parseArgumentsTypes,
	groupDigits = utils.groupDigits,
	formatBytes = utils.formatBytes,
	selectGrammar = utils.selectGrammar,
	selectNullGrammar = utils.selectNullGrammar,
	pushNotification = utils.pushNotification,
	getFileExt = utils.getFileExt,
	ExternalUtil = xutils.ExternalUtil;
utils.updateCFG(cfg);
readers.updateCFG(cfg);
readers.setUtils(parsePropertyType, parseReturnType, parseArgumentsTypes, getFileExt, pushNotification);
providers.updateCFG(cfg);
xutils.updateCFG(cfg);

module.exports.getProvider = function() {
	return [providers.file, providers.basic, providers.async];
};

function getDescInheritance(descjson, buffer) {
	function onRead(dj) {
		if (cfg.console === 'yes') console.log('Inherit/Import:', dj, buffer);
		var i, rd = readers.obtainDescAutoComplete(dj);
		for (i = 0; i < rd.length; i++) buffer.push(rd[i]);
		getDescInheritance(dj, buffer);
	}
	readers.readInheritance(descjson, onRead, null, null, buffer.loader);
	readers.readInheritance(descjson, onRead, 'impTree', 'imports', buffer.loader);
}

function fetchAsyncData(resolve, prefix, options, filterData) {
	if (cfg.descjson) {
		var rd = readers.obtainDescAutoComplete(cfg.descjson);
		if (!cfg.descjson.includes) {
			cfg.descjson.includes = [];
			cfg.descjson.includes.loader = {};
			getDescInheritance(cfg.descjson, cfg.descjson.includes);
			if ((cfg.descjson.inhTree && cfg.descjson.inhTree.length > 0) || (cfg.descjson.impTree && cfg.descjson.impTree.length > 0)) {
				rd.push({
					text: cfg.descjson.supername,
					description: 'Loading inherited/imported classes JSON descriptors.\nTry again in few milliseconds.',
					rightLabelHTML: 'Inheritance/Imports',
					leftLabelHTML: 'buffering...',
					type: 'module'
				});
			}
		}
		rd = rd.concat(cfg.descjson.includes);
		resolve(filterData(prefix, rd));
	} else resolve([]);
}
providers.async.fetchAsyncData = fetchAsyncData;

var titleEl, kbglobal, fileEl, linesEl, tokensEl, tokensElTooltip, sepEl, packEl, jsonEl, analyEl, packagepanel, topEl;

function cfgGet(name) {
	cfg[name] = atom.config.get(nskey + name);
}

function getAllCfg() {
	cfgkeys.forEach(function(el) {
		cfgGet(el);
	});
}

function initPackage() {
	var ideprotoss_pack = atom.packages.getActivePackage(cfg.packageid);
	if (ideprotoss_pack) {
		ideprotoss_pack.ProtoSSUtil = ProtoSSUtil;
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
	stopAsync();
}

function initBindings() {
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
	bindings[cfg.packageid + ':resolve'] = function() {
		if (tokensEl.style.pointerEvents === 'inherit') ProtoSSUtil.resolve();
	};
	bindings[cfg.packageid + ':resolveshell'] = function() {
		if (tokensEl.style.pointerEvents === 'inherit') ProtoSSUtil.resolve({
			shell: true
		});
	};
	bindings[cfg.packageid + ':openproject'] = function() {
		var tree = document.getElementsByClassName('tree-view-root')[0],
			selected = [].slice.call(tree.getElementsByClassName('selected')),
			pr = [];
		selected.forEach(function(s) {
			var dp, dpspl;
			try {
				if (s.getAttribute('is') === 'tree-view-file') {
					dp = s.getElementsByClassName('name')[0].getAttribute('data-path');
					dpspl = dp.split(path.sep);
					dpspl.pop();
					dp = dpspl.join(path.sep);
				} else if (s.getAttribute('is') === 'tree-view-directory') {
					dp = s.getElementsByClassName('header')[0].getElementsByClassName('name')[0].getAttribute('data-path');
				}
			} catch (e) {}
			if (dp && pr.indexOf(dp) === -1) pr.push(dp);
		});
		pr.forEach(e => ProtoSSUtil.createProtoSSDox(e + path.sep + cfg.docjsonname));
	};
	bindings[cfg.packageid + ':buildproject'] = function() {
		ExternalUtil.getProtoSSDoxInWorkspace(readers.readProjectDox);
	};
}

function initDisposables() {
	if (disposables) return;
	var k;
	disposables = {};
	cfgkeys.forEach(function(el) {
		disposables['cfg.' + el] = atom.config.observe(nskey + el, function(v) {
			cfgGet(el);
			if (cfgobserve[el]) cfgobserve[el](v);
		});
	});
	disposables.activate = atom.packages.onDidActivatePackage(function(pack) {
		if (pack.name === cfg.packageid) {
			initPackage();
			initDisposables();
		}
	});
	disposables.deactivate = atom.packages.onDidDeactivatePackage(function(pack) {
		if (pack.name === cfg.packageid) {
			destroyPackage();
		}
	});
	disposables.unload = atom.packages.onDidUnloadPackage(function(pack) {
		if (pack.name === cfg.packageid) {
			unloadPackage();
		}
	});
	disposables.activeeditor = atom.workspace.onDidChangeActiveTextEditor(function(editor) {
		if (packagepanel)
			updateProtoSSCrumbs(editor, true);
	});
	disposables.matchbinding = atom.keymaps.onDidMatchBinding(function(e) {
		var b = e.binding,
			bc = b.command,
			bcid = bc.split(cfg.packageid + ':')[1];
		if (bindings[bc] && packagepanel && !cfg.commands[bcid]) {
			bindings[bc]();
		}
	});
	disposables.grammar = atom.grammars.onDidAddGrammar(function(e) {
		updateGrammar();
	});
	for (k in cfg.commands) {
		if (cfg.commands[k]) disposables['command_' + k] = atom.commands.add('atom-workspace', cfg.packageid + ':' + k, function(e) {});
	}
	disposables.commands = atom.commands.onDidDispatch(function(e) {
		var t = e.type;
		if (bindings[t] && packagepanel) {
			bindings[t]();
		}
	});
	var cmlist = [];
	for (k in cfg.contextmenu) {
		cmlist.push({
			label: cfg.contextmenu[k],
			command: cfg.packageid + ':' + k
		});
	}
	disposables.contextmenu = atom.contextMenu.add({
		"atom-text-editor, .overlayer": [{
			type: 'separator'
		}, {
			label: 'ProtoSS',
			submenu: cmlist
		}, {
			type: 'separator'
		}]
	});
	disposables.contextproject = atom.contextMenu.add({
		".tree-view-root": [{
			type: 'separator'
		}, {
			label: 'Open ProtoSS Project',
			command: cfg.packageid + ':openproject'
		}, {
			type: 'separator'
		}]
	});
}

function updateGrammar() {
	gjs = atom.grammars.getGrammars().find(selectGrammar);
	if (!gjs) {
		gjs = atom.grammars.getGrammars().find(selectNullGrammar);
	}
	cfg.activeGrammar = gjs;
	if (gjs) {
		if (cfg.maxTokensPerLine !== 'default') {
			var i = parseInt(cfg.maxTokensPerLine);
			if (!i || i <= 0) i = 100;
			gjs.maxTokensPerLine = i;
		} else {
			gjs.maxTokensPerLine = 100;
		}
	}
}

function updateLinesCount(editor) {
	var lc = editor ? editor.getLineCount() : -1;
	if (cfg.groupdigits === 'yes' && lc !== -1) lc = groupDigits(lc);
	linesEl.innerHTML = lc !== -1 ? lc + ' lines' : 'no lines';
	linesEl.style.pointerEvents = lc === -1 ? 'none' : 'inherit';
}

function updateTokens(nt) {
	if (nt > 0) tokensEl.style.pointerEvents = 'inherit';
	if (cfg.groupdigits === 'yes') nt = groupDigits(nt);
	tokensEl.innerHTML = nt + ' tokens';
	tokensEl.className = 'protoss-hover';
	updateTokensElTooltip();
}

function stopAsync() {
	if (cfg.asyncIteratorStop) cfg.asyncIteratorStop();
	if (cfg.tokenTimeoutId !== undefined) window.clearTimeout(cfg.tokenTimeoutId);
	delete cfg.tokenTimeoutId;
	if (cfg.fileTimeoutId !== undefined) window.clearTimeout(cfg.fileTimeoutId);
	delete cfg.fileTimeoutId;
	if (cfg.autotokentout !== undefined) window.clearTimeout(cfg.autotokentout);
	delete cfg.autotokentout;
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
	updateGrammar();
	stopAsync();
	if (editor) {
		p = (editor.getPath() || "").split('/').join('\\');
		if (cfg.console === 'yes') console.log('change editor: ' + p);
	}
	if (p) {
		ps = p.split('\\');
		jsfile = ps.pop();
		if (jsfile.split('.').pop() !== 'js' && cfg.zetaret_omnipotency !== 'yes') {
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
	var ftp = [],
		filet = (p || "").split(new RegExp('<|>')).join('');
	if (filet) filet = '<span>' + filet.split('\\').join('</span>' + path.sep + '<span>') + '</span>';
	fileEl.innerHTML = filet || 'no editor';
	if (filet) {
		[].slice.call(fileEl.getElementsByTagName('span')).forEach(function(el) {
			ftp.push(el.innerText);
			var ct = ftp.join(path.sep);
			el.addEventListener('click', e => electron.shell.showItemInFolder(ct));
			el.classList.add('protoss-ihover');
			el.style.cursor = 'pointer';
			el.addEventListener('mouseover', function() {
				var ftitle = fileEl.getAttribute('title');
				el.setAttribute('title', (ftitle ? ftitle + '\n-\n' : '') + 'Click to Open in explorer:\n' + ct);
			});
		});
	}
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
	packEl.classList.remove('icon');
	packEl.classList.remove('icon-settings');
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
			TokenUtil.Alter();
		});
		cfg.fileTimeoutId = setTimeout(function() {
			if (editor === atom.workspace.getActiveTextEditor()) {
				var docf, docfd, pss, docjson = cfg.docjsonname,
					found = 0,
					prpath = atom.project.getPaths();
				prpath.forEach(function(el) {
					el = el.split('/').join('\\');
					if (p.indexOf(el) === 0) found++;
				});

				function fileRead(e, b) {
					if (cfg.jsonpath === docf)
						readers.readDocJson(e, b);
				}
				if (cfg.project === 'project' && found === 0) {
					packEl.innerHTML = '[File not found in project]';
					packEl.classList.add('icon');
					packEl.classList.add('icon-settings');
					packEl.style.pointerEvents = 'inherit';
				} else if (cfg.project === 'none') {
					packEl.innerHTML = '[Disabled ProtoSS Dox]';
					packEl.classList.add('icon');
					packEl.classList.add('icon-settings');
				} else {
					while (ps.length > 1) {
						docf = ps.join('\\') + '\\' + docjson;
						pss = ps.join(path.sep);
						docfd = docf.split('\\').join(path.sep);
						if (fs.existsSync(docfd)) {
							cfg.jsonpath = docf;
							fs.readFile(docfd, fileRead);
							break;
						} else {
							ps.pop();
						}
						if (cfg.project === 'project' && prpath.indexOf(pss) !== -1) break;
					}
					if (!cfg.jsonpath) {
						packEl.innerHTML = '[Create ProtoSS Dox]';
						packEl.classList.add('icon');
						packEl.classList.add('icon-settings');
						packEl.style.pointerEvents = 'inherit';
					}
				}
			} else {
				if (cfg.console === 'yes') console.log('editor lingers file read');
			}
		}, wait ? cfg.fileTimeout || 0 : 0)
	}
}

function trimBufPos(tok) {
	var t0 = tok[0];
	return [t0.row, t0.start + t0.value.indexOf(t0.value.trim())]
}

class ProtoSSUtil {
	static projson() {
		var p = packEl.getAttribute('path'),
			prPaths, found = 0,
			paths;
		if (p) {
			atom.open({
				pathsToOpen: [p.split('\\').join(path.sep)],
				newWindow: false
			});
		} else {
			prPaths = atom.project.getPaths();
			p = (atom.workspace.getActiveTextEditor().getPath() || "").split('/').join('\\');
			paths = [];
			if (p) {
				prPaths.forEach(function(el) {
					el = el.split('/').join('\\');
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
						var jp = prPaths[response - 1].split('/').join('\\') + '\\' + cfg.docjsonname;
						packEl.setAttribute('path', jp);
						ProtoSSUtil.createProtoSSDox(jp);
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

	static createProtoSSDox(jp) {
		atom.workspace.open(jp.split('\\').join(path.sep)).then(function(editor) {
			if (editor.getText().length === 0) {
				var k, px = {};
				for (k in utils.defProtodox) px[k] = utils.defProtodox[k];
				if (cfg.xdescript === 'yes') {
					for (k in utils.defProtoX) px[k] = utils.defProtoX[k];
				}
				editor.setText(JSON.stringify(px));
				editor.setCursorBufferPosition([0, 9]);
			}
		});
	}

	static jsonmd(md) {
		var p = jsonEl.getAttribute('path'),
			sn = jsonEl.getAttribute('supername'),
			mp = jsonEl.getAttribute('mdpath');
		if (md && mp) {
			atom.workspace.open(mp.split('\\').join(path.sep));
		} else if (p) {
			atom.workspace.open(p.split('\\').join(path.sep)).then(function(editor) {
				var t = editor.getText();
				if (!t) {
					var k, jdesc = {};
					for (k in utils.defDescriptor) jdesc[k] = utils.defDescriptor[k];
					if (cfg.xdescript === 'yes') {
						for (k in utils.defDescX) jdesc[k] = utils.defDescX[k];
					}
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
				if (p) atom.workspace.open(p.split('\\').join(path.sep));
			})
		}
	}

	static openFile(rp, options) {
		var res = false;
		if (fs.existsSync(rp)) {
			if (options.shell) electron.shell.showItemInFolder(rp);
			else atom.workspace.open(rp);
			res = true;
		}
		return res;
	}

	static resolve(options) {
		if (cfg.altered) TokenUtil.altClick();
		if (!options) options = {};
		try {
			var ct = TokenUtil.computeCursorToken(cfg.activeTokens, cfg.editor.getCursorBufferPosition());
			var p = cfg.editor.getPath(),
				ptr = p.split('/').join('\\');
			if (ct) {
				var rp, f, res, v = ct.value;
				try {
					f = (p || "").split(path.sep);
					f.pop();
					f = f.join(path.sep);
					rp = path.resolve(f, v);
					res = ProtoSSUtil.openFile(rp, options);
				} catch (e) {}
				if (!res) {
					try {
						f = readers.getResolvedPathName(ct.value, '', false, ptr);
						if (f[0]) {
							rp = f[1];
							res = ProtoSSUtil.openFile(rp + '.' + getFileExt(), options);
							if (!res) res = ProtoSSUtil.openFile(rp, options);
						}
					} catch (e) {}
				}
			}
		} catch (e) {}
		if (cfg.console === 'yes') {
			console.log('resolve token:');
			console.log(ct);
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
				try {
					lineTokens = gjs.tokenizeLine(editor.lineTextForBufferRow(i), ruleStack, ruleStack ? false : true);
				} catch (e) {
					break;
				}
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
		updateLinesCount(editor);
	}

	static refreshTokens(editor, asyncit, nonot) {
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
				if (!nonot && cfg.notifications !== 'no') {
					pushNotification((cfg.groupdigits === 'yes' ? groupDigits(nt) : nt) +
						' tokens loaded in ' + editor.getPath().split(path.sep).join('\\' + path.sep),
						"addInfo", "token-" + editor.getPath());
				}
			});
			tokensEl.innerHTML = 'async tokens';
			tokensEl.className = 'protoss-hover icon icon-sync';
			updateLinesCount(editor);
		}
	}

	static Alter() {
		cfg.altered = true;
		if (cfg.autotokentout) {
			window.clearTimeout(cfg.autotokentout);
			delete cfg.autotokentout;
		}
		if (cfg.autoUpdateOnChange !== 'disable') {
			var intz = parseInt(cfg.autoUpdateOnChange) || 0;
			cfg.autotokentout = setTimeout(function() {
				if (cfg.altered)
					TokenUtil.refreshTokens(cfg.editor, true, true);
			}, intz * 1000);
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
			var prev, lt, ct = TokenUtil.computeCursorToken(cfg.activeTokens, cfg.editor.getCursorBufferPosition());
			if (ct) {
				lt = {
					row: cfg.activeTokens.length,
					start: 0,
					end: 0,
					value: ct.value
				};
				prev = TokenUtil.findTokens(cfg.activeTokens, ct, 1, true);
				if (prev && prev.length > 0) cfg.editor.setCursorBufferPosition(trimBufPos(prev));
				else {
					prev = TokenUtil.findTokens(cfg.activeTokens, lt, 1, true);
					if (prev && prev.length > 0 && prev[0] !== ct) cfg.editor.setCursorBufferPosition(trimBufPos(prev));
				}
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
			var next, lt, ct = TokenUtil.computeCursorToken(cfg.activeTokens, cfg.editor.getCursorBufferPosition());
			if (ct) {
				lt = {
					row: -1,
					start: 0,
					end: 0,
					value: ct.value
				};
				next = TokenUtil.findTokens(cfg.activeTokens, ct, 1);
				if (next && next.length > 0) cfg.editor.setCursorBufferPosition(trimBufPos(next));
				else {
					next = TokenUtil.findTokens(cfg.activeTokens, lt, 1);
					if (next && next.length > 0 && next[0] !== ct) cfg.editor.setCursorBufferPosition(trimBufPos(next));
				}
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
			trimvl = trimv.toLowerCase(),
			trl = trimv.length,
			i = line ? line.indexOf(token) : -1,
			found = [],
			tv, st, cc;
		if (count < 0) count = 0;
		if (backwards) {
			if (i !== -1) {
				i--;
				cc = token.start;
				for (; i >= 0; i--) {
					st = line[i];
					tv = st.value;
					if (trl <= tv.length && (cfg.findTokenCaseSensitivity === 'yes' ? tv.trim() === trimv : tv.trim().toLowerCase() === trimvl)) {
						st.end = cc;
						st.start = cc - tv.length;
						st.row = row;
						found.push(st);
						if (count && found.length === count) break;
					}
					cc -= tv.length;
				}
			}
			row--;
			while (line = tokens[row]) {
				if (!count || found.length < count) {
					cc = 0;
					for (i = 0; i < line.length; i++) cc += line[i].value.length;
					for (i = line.length - 1; i >= 0; i--) {
						st = line[i];
						tv = st.value;
						if (trl <= tv.length && (cfg.findTokenCaseSensitivity === 'yes' ? tv.trim() === trimv : tv.trim().toLowerCase() === trimvl)) {
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
			if (i !== -1) {
				cc = token.end;
				i++;
				for (; i < line.length; i++) {
					st = line[i];
					tv = st.value;
					if (trl <= tv.length && (cfg.findTokenCaseSensitivity === 'yes' ? tv.trim() === trimv : tv.trim().toLowerCase() === trimvl)) {
						st.start = cc;
						st.end = cc + tv.length;
						st.row = row;
						found.push(st);
						if (count && found.length === count) break;
					}
					cc += tv.length;
				}
			}
			row++;
			while (line = tokens[row]) {
				if (!count || found.length < count) {
					cc = 0;
					for (i = 0; i < line.length; i++) {
						st = line[i];
						tv = st.value;
						if (trl <= tv.length && (cfg.findTokenCaseSensitivity === 'yes' ? tv.trim() === trimv : tv.trim().toLowerCase() === trimvl)) {
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

function updateTokensElTooltip() {
	tokensEl.setAttribute('title', tokensElTooltip.join('\n') + (gjs ? '\nActive Grammar: ' + gjs.name : ''));
}

function initUI() {
	titleEl = document.createElement('span');
	titleEl.innerHTML = 'ProtoSS';
	titleEl.style.paddingRight = '10px';
	titleEl.style.cursor = 'pointer';
	titleEl.classList.add('protoss-button');
	titleEl.classList.add('icon');
	titleEl.classList.add('icon-' + ['circuit-board', 'beaker'][Math.floor(Math.random() * 2)]);
	kbglobal = ['Refresh ProtoSS Panel',
		'',
		'Key Bindings:',
		'F7 - locate current token and navigate to next token in editor',
		'CTRL + F7 - locate current token and navigate to previous token in editor',
		'SHIFT + F7 - locate current token and execute selection from start to end of its buffer position, you may chain selection of tokens to trace them visually',
		'ALT + F7 - refresh token database and line count',
		'CTRL + ALT + F7 - refresh ProtoSS IDE',
		'CTRL + SHIFT + F7 - open JSON descriptor of current file',
		'ALT + SHIFT + F7 - open MD documentation of current file',
		'CTRL + SHIFT + ALT + F7 - access ProtoSS project protossdox.json',
		'F8 - resolve token',
		'ALT + F8 - show in explorer resolved token',
		/*'SHIFT + F8 - reserved',
		'CTRL + F8 - reserved',
		'CTRL + ALT + F8 - reserved',*/
		'CTRL + SHIFT + F8 - open all files of class supers from inheritance in the current hierarchy, requires JSON descriptor',
		/*'ALT + SHIFT + F8 - reserved',
		'CTRL + SHIFT + ALT + F8 - reserved'*/
	];
	titleEl.setAttribute('title', kbglobal.join('\n'));
	titleEl.addEventListener('click', function(e) {
		updateProtoSSCrumbs(atom.workspace.getActiveTextEditor());
	});
	topEl.appendChild(titleEl);
	fileEl = document.createElement('span');
	fileEl.style.cursor = 'default';
	fileEl.classList.add('protoss-padright');
	fileEl.classList.add('protoss-file');
	topEl.appendChild(fileEl);
	linesEl = document.createElement('span');
	linesEl.style.cursor = 'pointer';
	linesEl.classList.add('protoss-hover');
	linesEl.classList.add('protoss-lines');
	atom.tooltips.add(linesEl, {
		title: function() {
			var k, t, s, p = ['size', 'atime', 'mtime', 'ctime', 'birthtime', 'dev', 'mode', 'nlink', 'uid', 'gid', 'rdev', 'ino'],
				ep = cfg.editor.getPath();
			if (!ep) return 'Text editor must save the file';
			try {
				s = fs.statSync(ep);
			} catch (e) {
				return 'File does not exist';
			}
			if (s) {
				t = [];
				s.size = groupDigits(s.size) + ' [' + formatBytes(s.size) + ']';
				for (k in p) t.push('<b>' + p[k] + '</b>: ' + s[p[k]]);
				return '<div style="text-align: left !important; line-height: 120%">' + t.join('<br/>') + '</div>';
			}
			return null;
		},
		trigger: 'click'
	});
	linesEl.setAttribute('title', 'Click to view File Stats Tooltip');
	topEl.appendChild(linesEl);
	tokensEl = document.createElement('span');
	tokensEl.style.cursor = 'pointer';
	tokensEl.style.pointerEvents = 'none';
	tokensElTooltip = ['Click to next token [F7]', 'CTRL + Click to previous token [CTRL+F7]', 'SHIFT + Click to select token [SHIFT+F7]', 'ALT + Click to refresh tokens [ALT+F7]'];

	updateTokensElTooltip();
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
	sepEl = document.createElement('div');
	sepEl.style.width = '100%';
	sepEl.style.borderBottom = '1px solid #181a1f';
	sepEl.style.margin = '5px 0';
	sepEl.style.display = 'none';
	topEl.appendChild(sepEl);
	packEl = document.createElement('span');
	packEl.style.cursor = 'pointer';
	packEl.classList.add('protoss-package');
	packEl.classList.add('protoss-hover');
	packEl.addEventListener('mouseover', function(e) {
		var t = cfg.projson ? cfg.projson.namespace : '';
		packEl.setAttribute('title', 'Access ' + cfg.docjsonname + ' [CTRL+SHIFT+ALT+F7]' + (t ? '\nNamespace: ' + t : ''));
	});
	packEl.addEventListener('click', function(e) {
		ProtoSSUtil.projson();
	});
	topEl.appendChild(packEl);
	jsonEl = document.createElement('span');
	jsonEl.style.cursor = 'pointer';
	jsonEl.classList.add('protoss-hover');
	jsonEl.classList.add('protoss-jsondox');
	jsonEl.addEventListener('click', function(e) {
		ProtoSSUtil.jsonmd(e.ctrlKey);
	});
	jsonEl.addEventListener('mouseover', function(e) {
		var jt = fileEl.getAttribute('title');
		jsonEl.setAttribute('title', 'Click to open JSON [CTRL+SHIFT+F7]\nCTRL + Click to open MD [ALT+SHIFT+F7]' + (jt ? '\n-\n' + jt : ''));
	});
	topEl.appendChild(jsonEl);
	analyEl = document.createElement('span');
	analyEl.style.paddingRight = '10px';
	analyEl.style.cursor = 'default';
	topEl.appendChild(analyEl);
	readers.setElements(fileEl, packEl, jsonEl, analyEl);
	xutils.setElements(packEl, jsonEl);
	if (cfg.console === 'yes') console.log(cfg);
}

function prefixInit() {
	getAllCfg();

	if (cfg.console === 'yes') console.log('#protoss ide#start');

	topEl = document.createElement('div');
	topEl.classList.add('protoss-top-panel');
	topEl.style.margin = '4px';
	var cssEl = document.createElement('style');
	cssEl.innerText = css.join('');
	topEl.appendChild(cssEl);
	cfgobserve.textColor = function(v) {
		topEl.style.color = cfg.textColor === 'default' ? 'inherit' : cfg.textColor;
	};
	cfgobserve.fontSize = function(v) {
		topEl.style.fontSize = cfg.fontSize === 'default' ? 'inherit' : cfg.fontSize;
	};
	cfgobserve.splitpanel = function(v) {
		sepEl.style.display = cfg.splitpanel === 'yes' ? 'block' : 'none';
	};
	cfgobserve.grammarId = function(v) {
		updateGrammar();
	};
}

function suffixInit() {
	cfgobserve.breadcrumbs = function(v) {
		updateProtoSSCrumbs(atom.workspace.getActiveTextEditor(), true);
	};
	updateProtoSSCrumbs(atom.workspace.getActiveTextEditor(), true);

	if (cfg.notifications !== 'no') {
		pushNotification('Welcome to ProtoSS IDE', 'addSuccess', 'init', 1000, {
			icon: 'heart'
		});
	}
	if (cfg.console === 'yes') console.log('#protoss ide#end');
}

prefixInit();
initPackage();
initBindings();
initUI();
updateGrammar();
initDisposables();
suffixInit();