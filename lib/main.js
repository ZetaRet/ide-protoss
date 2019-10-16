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
	xutils = require('./ExternalUtil.js'),
	tutil = require('./TokenUtil.js'),
	ui = require('./ui.js');

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
			buildproject: 1
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
			resolveshell: 'Resolve Token in Shell',
			buildproject: 'Build Project'
		}
	},
	nskey = cfg.packageid + '.',
	cfgkeys = [
		'autoComplete', 'autoCompleteNS', 'autoBuild',
		'project', 'xdescript',
		'autoUpdateOnChange', 'breadcrumbs', 'console', 'splitpanel',
		'textColor', 'fontSize', 'notifications', 'groupdigits',
		'grammarId', 'findTokenCaseSensitivity', 'maxTokensPerLine',
		'zetaret_omnipotency'
	],
	css = ['.protoss-button { font-weight: bold; }',
		'.protoss-hover, .protoss-padright { margin-right: 10px; }',
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
	ExternalUtil = xutils.ExternalUtil,
	TokenUtil = tutil.TokenUtil,
	updateTokens = ui.updateTokens,
	updateLinesCount = ui.updateLinesCount;
utils.updateCFG(cfg);
readers.updateCFG(cfg);
readers.setUtils(parsePropertyType, parseReturnType, parseArgumentsTypes, getFileExt, pushNotification);
providers.updateCFG(cfg);
xutils.updateCFG(cfg);
tutil.updateCFG(cfg);
tutil.setUtils(updateTokens, updateLinesCount, pushNotification, groupDigits);

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

var titleEl, fileEl, linesEl, tokensEl, tokensElTooltip, sepEl, packEl, jsonEl, analyEl, packagepanel, topEl;

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
			} catch (e) {
				if (cfg.console === 'yes') console.log(e);
			}
			if (dp && pr.indexOf(dp) === -1) pr.push(dp);
		});
		pr.forEach(e => ProtoSSUtil.createProtoSSDox(e + path.sep + cfg.docjsonname));
	};
	bindings[cfg.packageid + ':buildproject'] = function() {
		buildProject();
	};
}

function buildProject() {
	ExternalUtil.getProtoSSDoxInWorkspace(readers.readProjectDox, {
		loaded: onProjectLoad
	});
}

function onProjectLoad(files) {
	if (cfg.console === 'yes') console.log(files);
	cfg.atomprojsons = files;
	readers.updateFromDescFile();
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
	disposables.projectpaths = atom.project.onDidChangePaths(function(e) {
		if (cfg.autoBuild === 'yes') buildProject();
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
	tutil.setGrammar(gjs);
	ui.setGrammar(gjs);
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
				}, response => {});
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

	static openFile(rp, options, dirs) {
		var res = false;
		if (fs.existsSync(rp)) {
			var s = fs.statSync(rp);
			if (options.shell) {
				if (s.isFile() || dirs) {
					electron.shell.showItemInFolder(rp);
					res = true;
				}
			} else if (s.isFile()) {
				atom.workspace.open(rp);
				res = true;
			}
		}
		return res;
	}

	static resolve(options) {
		if (cfg.altered) TokenUtil.altClick();
		if (!options) options = {};
		try {
			var ct = TokenUtil.computeCursorToken(cfg.activeTokens, cfg.editor.getCursorBufferPosition(), true);
			if (cfg.console === 'yes') {
				console.log('resolve token:');
				console.log(ct);
			}
			var p = cfg.editor.getPath(),
				ptr = p.split('/').join('\\');
			if (ct) {
				var rp, f, res, v = ct.value,
					vtrim = v.trim();
				if (vtrim.length === 0) return false;
				var cv, c, ctspl = ct.value.split(new RegExp('\\s'));
				c = 0;
				cv = ctspl.find(e => {
					if (ct.cursor >= c && ct.cursor < (c + e.length)) return true;
					c += e.length + 1;
				});
				if (cv.startsWith('https://') || cv.startsWith('http://')) {
					if (options.shell) electron.shell.openExternal(cv);
					else window.open(cv);
					return true;
				}
				try {
					f = (p || "").split(path.sep);
					f.pop();
					f = f.join(path.sep);
					rp = path.resolve(f, v);
					res = ProtoSSUtil.openFile(rp, options, true);
				} catch (e) {
					if (cfg.console === 'yes') console.log(e);
				}
				if (!res) {
					try {
						ctspl = ct.value.split(new RegExp('\\s|,|;|=|\\|'));
						c = 0;
						cv = ctspl.find(e => {
							if (ct.cursor >= c && ct.cursor < (c + e.length)) return true;
							c += e.length + 1;
						});
						v = cv;
						if (!v) v = ct.value;
						else if (v.charAt(v.length - 1) === ':') v = v.substr(0, v.length - 1);

						f = readers.getResolvedPathNameProject(v, getFileExt(), false, ptr, null, null, true);
						if (f[0]) {
							rp = f[1].split('\\').join(path.sep);
							res = ProtoSSUtil.openFile(rp, options);
						}
						if (!res) {
							f = readers.getResolvedPathNameProject(v, '', false, ptr, null, null, true);
							if (f[0]) {
								rp = f[1].split('\\').join(path.sep);
								res = ProtoSSUtil.openFile(rp, options, true);
							}
						}
					} catch (e) {
						if (cfg.console === 'yes') console.log(e);
					}
				}
				return res;
			}
		} catch (e) {
			if (cfg.console === 'yes') console.log(e);
		}

		return false;
	}
}

function initUI() {
	[titleEl, fileEl, linesEl, tokensEl, tokensElTooltip, sepEl, packEl, jsonEl, analyEl] = ui.initUI(topEl, cfg, TokenUtil, ProtoSSUtil,
		updateProtoSSCrumbs, groupDigits, formatBytes, readers, xutils);

	ui.updateTokensElTooltip();
	tutil.setElements(tokensEl);
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
	if (cfg.autoBuild === 'yes') buildProject();
	if (cfg.console === 'yes') console.log('#protoss ide#end');
}

prefixInit();
initPackage();
initBindings();
initUI();
updateGrammar();
initDisposables();
suffixInit();
