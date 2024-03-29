/**
 * Author: Zeta Ret
 * Date: 2018 - Today
 * ProtoSS package for Atom IDE
 **/

var fs = require('fs'),
	path = require('path'),
	events = require('events'),
	electron = require('electron'),
	utils = require('./utils.js'),
	readers = require('./readers.js'),
	writers = require('./writers.js'),
	providers = require('./autocomplete-providers.js'),
	putils = require('./ProtoSSUtil.js'),
	xutils = require('./ExternalUtil.js'),
	tutil = require('./TokenUtil.js'),
	mutil = require('./MarkerUtil.js'),
	symutil = require('./SymbolUtil.js'),
	processutil = require('./ProcessUtil.js'),
	ui = require('./ui.js'),
	footer = require('./footer.js');

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
			buildproject: 1,
			terminatebuildproject: 1,
			cmdsupername: 1,
			cmdts: 1,
			stopasync: 1,
			exefile: 1,
			exekill: 1,
			exekillactive: 1,
			clearcache: 1
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
			resolve: 'Resolve Token',
			resolveshell: 'Resolve Token in Shell',
			supers: 'Open Supers',
			buildproject: 'Build Project'
		}
	},
	nskey = cfg.packageid + '.',
	cfgkeys = [
		'autoComplete', 'autoCompleteTypes', 'autoCompleteNS', 'autoCompleteCSS', 'autoCompleteHTML',
		'autoCompleteSort', 'autoBuild',
		'project', 'xdescript', 'tokenTimeout', 'fileTimeout',
		'autoUpdateOnChange', 'breadcrumbs', 'console', 'splitpanel',
		'textColor', 'fontSize', 'notifications', 'groupdigits',
		'grammarId', 'findTokenCaseSensitivity', 'maxTokensPerLine',
		'useMultiviews', 'zetaret_omnipotency',
		'styleGroupMark', 'breadcrumbsOptions', 'asyncOptions', 'autoCompleteOptions', 'wordRegOptions', 'footerOptions',
		'importOptions', 'exportOptions', 'exeOptions'
	],
	css = ['.protoss-button { font-weight: bold; }',
		'.protoss-hover, .protoss-padright { margin-right: 10px; }',
		'.protoss-button:hover, .protoss-hover:hover, .protoss-ihover:hover { text-decoration: underline; }',
		'.protoss-tooltip-file { padding: 2px; border-radius: 2px; line-height: 16px !important; }',
		'.protoss-tooltip-file:hover { background: rgba(10,10,10,0.1); }',
		'.protoss-tooltip { text-align: left !important; overflow: overlay; padding: 5px 20px; }',
		'.protoss-browse-tip { padding: 2px; border-radius: 2px; font-weight: bold; cursor: pointer; line-height: 20px; }',
		'.protoss-browse-tip:hover { background: rgba(10,10,10,0.1); }',
		'.protoss-tooltip-row { cursor: pointer; padding: 2px; border-radius: 2px; font-size: 12px; line-height: 18px; white-space: normal; }',
		'.protoss-tooltip-row:hover { background: rgba(10,10,10,0.1); }',
		'.atom-project-btn { cursor: pointer; padding: 2px; border-radius: 2px; font-size: 12px; line-height: 18px; white-space: normal; }',
		'.atom-project-btn:hover { text-decoration: underline; background: rgba(10,10,10,0.1); }'
	],
	cfgobserve = {},
	disposables = null,
	gjs = null,
	stopProjectBuilder = null,
	bindings = {};

var titleEl, fileEl, linesEl, tokensEl, sepEl, packEl, jsonEl, analyEl,
	packagepanel, topEl, dynamicCSS,
	footerpanel, bottomEl,
	markerpanel, rightEl, markers, cpicon;

var parsePropertyType = utils.parsePropertyType,
	parseReturnType = utils.parseReturnType,
	parseArgumentsTypes = utils.parseArgumentsTypes,
	groupDigits = utils.groupDigits,
	formatBytes = utils.formatBytes,
	selectGrammar = utils.selectGrammar,
	selectNullGrammar = utils.selectNullGrammar,
	pushNotification = utils.pushNotification,
	getFileExt = utils.getFileExt,
	ProtoSSUtil = putils.ProtoSSUtil,
	ExternalUtil = xutils.ExternalUtil,
	TokenUtil = tutil.TokenUtil,
	MarkerUtil = mutil.MarkerUtil,
	SymbolUtil = symutil.SymbolUtil,
	updateTokens = ui.updateTokens,
	updateLinesCount = ui.updateLinesCount,
	exeFileCommand = processutil.exeFileCommand,
	exeKillCommand = processutil.exeKillCommand;

const acpr = [providers.file, providers.basic, providers.async, providers.word, providers.merger];

cfg.emitter = new events.EventEmitter();

[putils, utils, readers, writers, providers, xutils, tutil, mutil, symutil, footer, processutil].forEach(e => e.updateCFG(cfg));

putils.setUtils(utils, readers, TokenUtil);
readers.setUtils(parsePropertyType, parseReturnType, parseArgumentsTypes, getFileExt, pushNotification, utils);
writers.setUtils(utils);
tutil.setUtils(updateTokens, updateLinesCount, pushNotification, groupDigits);
mutil.setUtils(TokenUtil);
processutil.setUtils(pushNotification);

module.exports.getProvider = function() {
	return acpr;
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

function fetchAsyncData(resolve, prefix, options, filterData, scope) {
	if (cfg.descjson) {
		var rd = readers.obtainDescAutoComplete(cfg.descjson);
		if (!cfg.descjson.includes) {
			cfg.descjson.includes = [];
			cfg.descjson.includes.loader = {};
			if (cfg.descpath) cfg.descjson.includes.loader[cfg.descpath.split('\\').join(path.sep)] = true;
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
		resolve(filterData.call(scope, prefix, rd));
	} else resolve([]);
}
providers.async.fetchAsyncData = fetchAsyncData;

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
		ideprotoss_pack.MarkerUtil = MarkerUtil;
		ideprotoss_pack.SymbolUtil = SymbolUtil;
	}
	if (!packagepanel) {
		packagepanel = atom.workspace.addTopPanel({
			item: topEl
		});
		footerpanel = atom.workspace.addFooterPanel({
			item: bottomEl,
			priority: cfg.footerOptions.priority === 'default' ? 100 : cfg.footerOptions.priority
		});
		markerpanel = atom.workspace.addRightPanel({
			item: rightEl,
			visible: false,
			priority: 0
		});
		cfgobserve.textColor();
		cfgobserve.fontSize();
	}
}

function destroyPackage() {
	if (packagepanel) {
		packagepanel.destroy();
		packagepanel = null;
		footerpanel.destroy();
		footerpanel = null;
		markerpanel.destroy();
		markerpanel = null;
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
		if (tokensEl.style.pointerEvents === 'inherit') TokenUtil.refreshTokens(cfg.editor, true);
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
	bindings[cfg.packageid + ':terminatebuildproject'] = function() {
		terminateBuildProject();
	};
	bindings[cfg.packageid + ':cmdsupername'] = function() {
		navigator.clipboard.writeText((cfg.descjson ? cfg.descjson.supername : '') || jsonEl.getAttribute('supername') || 'No::Supername');
	};
	bindings[cfg.packageid + ':cmdts'] = function() {
		var descts = (cfg.descjson ? writers.declareTS(cfg.descjson, '\n', '\t') : '');
		navigator.clipboard.writeText(descts || 'declare namespace no.json.descriptor {}');
		if (descts && cfg.exportOptions.declareTS === 'yes') {
			var editor = atom.workspace.getActiveTextEditor();
			if (editor) atom.workspace.open(editor.getPath() + '.d.ts').then(e => e.setText(descts));
		}
	};
	bindings[cfg.packageid + ':stopasync'] = function() {
		stopAsyncCommand();
	};
	bindings[cfg.packageid + ':exefile'] = function() {
		exeFileCommand();
	};
	bindings[cfg.packageid + ':exekill'] = function() {
		exeKillCommand();
	};
	bindings[cfg.packageid + ':exekillactive'] = function() {
		var editor = atom.workspace.getActiveTextEditor();
		if (editor) processutil.exeKillActiveCommand(editor.getPath());
	};
	bindings[cfg.packageid + ':clearcache'] = function() {
		clearCache();
	};
}

function stopAsyncCommand() {
	stopAsync();
	tokensEl.innerText = 'async stop';
	tokensEl.className = '';
	tokensEl.style.pointerEvents = 'inherit';
}

function clearCache() {
	ProtoSSUtil.clearCache();
	TokenUtil.clearTokenCache();
}

function updateAutoCompletePriority() {
	providers.file.suggestionPriority = parseInt(cfg.autoCompleteOptions.filePriority);
	providers.basic.suggestionPriority = parseInt(cfg.autoCompleteOptions.basicPriority);
	providers.async.suggestionPriority = parseInt(cfg.autoCompleteOptions.asyncPriority);
	providers.word.suggestionPriority = parseInt(cfg.autoCompleteOptions.wordPriority);
	providers.merger.updatePriority([providers.basic, providers.async, providers.word]);
}

function buildProject() {
	terminateBuildProject();
	stopProjectBuilder = ExternalUtil.getProtoSSDoxInWorkspace(readers.readProjectDox, {
		loaded: onProjectLoad
	});
}

function onProjectLoad(files) {
	if (cfg.console === 'yes') console.log(files);
	stopProjectBuilder = null;
	cfg.atomprojsons = files;
	readers.updateFromDescFile(null, true);
}

function terminateBuildProject() {
	if (stopProjectBuilder) stopProjectBuilder();
	stopProjectBuilder = null;
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
	providers.setGrammar(gjs);
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

function destroyMarkers() {
	if (markers) markers.forEach(e => {
		if (e) {
			e.marker.destroy();
			e.destroy();
		}
	});
	markers = null;
}

function getFileDirentClass(d, cls) {
	const ix = cfg.breadcrumbsOptions.icons === 'yes';
	return cls + (ix ? ' icon icon-file' + (!d.isFile ? '-directory' : '') : '');
}

function createPathTooltip(el, ct) {
	var tooltipst = ['max-width:' + Math.round(window.innerWidth / 2) + 'px',
		'max-height:' + Math.round(window.innerHeight / 2) + 'px'
	].join(';') + ';';

	var last = ct.split(path.sep).pop() || '',
		tiphtml = ['Browse:',
			'',
			'<div class="protoss-browse-tip" title="Click to Open in explorer:\n' + ct + '">' + last + '</div><hr/><div class="protoss-path-tooltip"></div>'
		];
	readers.addTooltip(el, tiphtml, tooltipst, null, (tip, e) => {
		if (e.shiftKey) electron.shell.showItemInFolder(ct);
		else {
			tip.hideOnClickOutsideOfTooltip = function(he) {
				if (t !== he.target && !t.contains(he.target)) tip.hide();
			};
			tip.show();

			var browse, t = tip.getTooltipElement(),
				browsetip = t.getElementsByClassName('protoss-browse-tip')[0],
				browser = t.getElementsByClassName('protoss-path-tooltip')[0],
				filecls = 'protoss-tooltip-file';

			browsetip.addEventListener('click', ce => {
				electron.shell.showItemInFolder(ct);
				tip.hide();
			});
			if (atom.project.getPaths().find(pp => ct.indexOf(pp) === 0)) {
				try {
					browse = fs.readdirSync(ct, {
						withFileTypes: true
					}).map(fe => {
						return {
							name: fe.name,
							isFile: fe.isFile()
						}
					});
					browser.innerHTML = browse.map(fe => '<div class="' + getFileDirentClass(fe, filecls) + '">' + fe.name + '</div>').join('');
					[].slice.call(browser.getElementsByTagName('div')).forEach((s, i) => {
						var file = browse[i].isFile,
							sepa = ct + path.sep + s.innerText;
						s.style.cursor = 'pointer';
						s.setAttribute('title', 'Click to Open in ' + (file ? 'editor' : 'explorer') + ':\n' + sepa);
						s.addEventListener('click', se => {
							if (file) {
								atom.open({
									pathsToOpen: [sepa],
									newWindow: false
								});
							} else electron.shell.showItemInFolder(sepa);
							tip.hide();
						});
					});
				} catch (err) {
					browser.innerHTML = '<i>Can not browse this path</i>';
				}
			} else browser.innerHTML = '<i>Folder is not in the Project Paths</i>';
		}
	}, 'manual');
}

function nullConfig() {
	if (cfg.editor) {
		if (cfg.editor.disposeChangeEach) cfg.editor.disposeChangeEach.dispose();
		if (cfg.editor.disposeChange) cfg.editor.disposeChange.dispose();
		if (cfg.editor.disposeCursor) cfg.editor.disposeCursor.dispose();
	}
	cfg.descjson = null;
	cfg.projson = null;
	cfg.jsonpath = null;
	cfg.descpath = null;
	cfg.activeTokens = null;
	cfg.supersEl = null;
}

function updateVisibility(jsfile) {
	if (cfg.breadcrumbs && packagepanel && topEl) {
		switch (cfg.breadcrumbs) {
			case 'yes':
				topEl.style.display = 'block';
				packagepanel.show();
				break;
			case 'no':
				topEl.style.display = 'none';
				packagepanel.hide();
				break;
			case 'auto':
			default:
				topEl.style.display = jsfile ? 'block' : 'none';
				packagepanel[jsfile ? 'show' : 'hide']();
		}
	}
}

function setBreadcrumbsPath(p) {
	fileEl.setAttribute('title', '');
	var ftpsplit, ftp = [],
		filet = (p || "").split(new RegExp('<|>')).join('');
	if (cfg.breadcrumbsOptions.filePath === 'none') {
		fileEl.style.display = 'none';
	} else {
		fileEl.style.display = '';
		ftpsplit = filet.split('\\');
		if (filet) filet = '<span>' + ftpsplit.join(path.sep + '</span>' + '<span>') + '</span>';
		fileEl.innerHTML = filet || 'no editor';
		if (filet) {
			[].slice.call(fileEl.getElementsByTagName('span')).forEach((el, i) => {
				ftp.push(ftpsplit[i]);
				var ct = ftp.join(path.sep);
				if (cfg.breadcrumbsOptions.filePath === 'last') {
					if (i !== (ftpsplit.length - 1)) {
						el.remove();
						return;
					}
				} else if (cfg.breadcrumbsOptions.filePath === 'relative') {
					if (!atom.project.getPaths().find(pp => ct.indexOf(pp) === 0)) {
						el.remove();
						return;
					}
				}

				if (i !== (ftpsplit.length - 1)) {
					createPathTooltip(el, ct);
					el.addEventListener('mouseover', function() {
						var ftitle = fileEl.getAttribute('title');
						el.setAttribute('title', (ftitle ? ftitle + '\n-\n' : '') + 'Click to open Browse UI or [SHIFT + Click] to Open in explorer:\n' + ct);
					});
				} else {
					el.style.cursor = 'pointer';
					el.classList.add('protoss-ihover');
					el.addEventListener('click', e => electron.shell.showItemInFolder(ct));
					el.addEventListener('mouseover', function() {
						var ftitle = fileEl.getAttribute('title');
						el.setAttribute('title', (ftitle ? ftitle + '\n-\n' : '') + 'Click to Open in explorer:\n' + ct);
					});
				}
			});
		}
	}
}

function nullElements() {
	linesEl.style.display = cfg.breadcrumbsOptions.lines !== 'yes' ? 'none' : '';
	tokensEl.innerText = 'no tokens';
	tokensEl.className = 'protoss-padright';
	tokensEl.style.pointerEvents = 'none';
	tokensEl.style.display = cfg.breadcrumbsOptions.tokens !== 'yes' ? 'none' : '';
	jsonEl.innerHTML = '';
	jsonEl.setAttribute('path', '');
	jsonEl.setAttribute('mdpath', '');
	jsonEl.setAttribute('cpath', '');
	jsonEl.setAttribute('ext', '');
	jsonEl.setAttribute('supername', '');
	jsonEl.style.pointerEvents = 'none';
	packEl.innerHTML = '';
	modPackIcon();
	packEl.setAttribute('path', '');
	packEl.style.pointerEvents = 'none';
	analyEl.innerHTML = '';
	analyEl.className = '';
	cfg.emitter.emit('protoss_nullElements');
}

function modPackIcon(remove) {
	if (cfg.breadcrumbsOptions.icons !== 'yes') remove = true;
	packEl.classList[remove ? 'remove' : 'add']('icon');
	packEl.classList[remove ? 'remove' : 'add']('icon-settings');
}

function updateProtoSSCrumbs(editor, wait) {
	var p, ps, jsfile;
	nullConfig();
	cfg.editor = editor;
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
	updateVisibility(jsfile);
	setBreadcrumbsPath(p);
	updateLinesCount(editor);
	nullElements();
	cfg.emitter.emit('changeEditor');

	if (jsfile) {
		cfg.altered = true;
		if (!wait || !cfg.tokenTimeout) TokenUtil.refreshTokens(editor, true);
		else {
			tokensEl.innerText = 'wait tokens';
			if (cfg.breadcrumbsOptions.icons === 'yes') tokensEl.className = 'icon icon-sync';
			cfg.tokenTimeoutId = setTimeout(function() {
				if (editor === atom.workspace.getActiveTextEditor()) TokenUtil.refreshTokens(editor, true);
				else {
					if (cfg.console === 'yes') console.log('editor lingers token refresh');
				}
			}, cfg.tokenTimeout);
		}
		editor.__changing = false;
		editor.disposeChangeEach = editor.buffer.onDidChange(function(changeEvent) {
			editor.__changing = true;
			destroyMarkers();
			cfg.emitter.emit('accountMarkers');
		});
		editor.disposeChange = editor.buffer.onDidStopChanging(function(changes) {
			editor.__changing = false;
			TokenUtil.Alter();
		});
		editor.disposeCursor = editor.onDidChangeCursorPosition((c, nbp, nsp, obp, osp, tc) => {
			if (!editor.__changing && !cfg.altered) {
				destroyMarkers();
				if (cfg.styleGroupMark.markerAllow === 'yes') markers = MarkerUtil.decorate(null, nbp);
				cfg.emitter.emit('accountMarkers');
			}
		});
		editor.element.addEventListener('tokenized', () => {
			destroyMarkers();
			if (cfg.styleGroupMark.markerAllow === 'yes') markers = MarkerUtil.decorate();
			cfg.emitter.emit('accountMarkers');
		});
		cfg.fileTimeoutId = setTimeout(function() {
			if (editor === atom.workspace.getActiveTextEditor()) {
				var found = 0,
					prpath = atom.project.getPaths();
				prpath.forEach(function(el) {
					el = el.split('/').join('\\');
					if (p.indexOf(el) === 0) found++;
				});

				if (cfg.project === 'project' && found === 0) {
					packEl.innerText = '[File not found in project]';
					modPackIcon();
					packEl.style.pointerEvents = 'inherit';
				} else if (cfg.project === 'none') {
					packEl.innerText = '[Disabled ProtoSS Dox]';
					modPackIcon();
				} else {
					readers.loadProjectJSON(ps, prpath);
					if (!cfg.jsonpath) {
						packEl.innerText = '[Create ProtoSS Dox]';
						modPackIcon();
						packEl.style.pointerEvents = 'inherit';
					}
				}
			} else {
				if (cfg.console === 'yes') console.log('editor lingers file read');
			}
		}, wait ? cfg.fileTimeout || 0 : 0)
	}
}

function initUI() {
	[titleEl, fileEl, linesEl, tokensEl, sepEl, packEl, jsonEl, analyEl] = ui.initUI(
		topEl, cfg, TokenUtil, ProtoSSUtil, updateProtoSSCrumbs, groupDigits, formatBytes, readers, writers, xutils
	);

	ui.updateTokensElTooltip();
	tutil.setElements(tokensEl);
	putils.setElements(packEl, jsonEl);
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
	dynamicCSS = document.createElement('style');
	dynamicCSS.setAttribute('id', 'protoss-dynamic-css');
	topEl.appendChild(dynamicCSS);

	bottomEl = document.createElement('div');
	bottomEl.classList.add('protoss-bottom-panel');
	bottomEl.style.margin = '4px';
	var ficon = document.createElement('span');
	ficon.innerHTML = '<b class="icon icon-terminal" style="padding-right: 25px">IDE</b>';
	var stopAsyncIcon = document.createElement('a');
	stopAsyncIcon.classList.add('protoss-button');
	stopAsyncIcon.innerHTML = '<i class="icon icon-diff-ignored" style="padding-right: 15px">Stop Async</i>';
	stopAsyncIcon.addEventListener('click', e => {
		stopAsyncCommand();
		e.preventDefault();
		return false;
	});
	var tokenStatus = document.createElement('span');
	var markerStatus = document.createElement('span');
	var processStatus = document.createElement('span');

	function getAsyncStatusText(td) {
		return td.line + ' of ' + td.lines + ' lines | ' + Math.round(100 * td.line / td.lines) + '% tokenized';
	}
	cfg.emitter.on('token_asyncStart', td => {
		tokenStatus.innerText = getAsyncStatusText(td);
	});
	cfg.emitter.on('token_asyncProcess', td => {
		tokenStatus.innerText = getAsyncStatusText(td);
	});
	cfg.emitter.on('token_asyncEnd', td => {
		tokenStatus.innerText = getAsyncStatusText(td);
	});
	cfg.emitter.on('accountMarkers', () => {
		if (markers && markers.length > 0) {
			markerStatus.innerText = ' | ' + (markers[0]._index + 1) + ' of ' + markers.length + ' markers';
		} else {
			markerStatus.innerText = ' | 0 markers';
		}
	});
	cfg.emitter.on('protoss_nullElements', () => {
		tokenStatus.innerText = '';
		markerStatus.innerText = '';
		processStatus.innerText = '';
	});
	cfg.emitter.on('changeEditor', () => {
		cfg.emitter.emit('updateProcessStatus');
	});
	cfg.emitter.on('updateProcessStatus', () => {
		var p;
		try {
			p = atom.workspace.getActiveTextEditor().getPath();
		} catch (e) {}
		processStatus.innerText = p && processutil.hasProcess(p) ? ' | Node Process' : '';
	});

	bottomEl.appendChild(ficon);
	bottomEl.appendChild(stopAsyncIcon);
	bottomEl.appendChild(tokenStatus);
	bottomEl.appendChild(markerStatus);
	bottomEl.appendChild(processStatus);

	rightEl = document.createElement('div');

	prefixObservers();
}

function prefixObservers() {
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
	cfgobserve.styleGroupMark = function(v) {
		mutil.updateDynamicCSS(dynamicCSS);
	};
	cfgobserve.autoCompleteOptions = function(v) {
		updateAutoCompletePriority();
	};
	cfgobserve.wordRegOptions = function(v) {
		providers.clearBufferWords();
	};
	cfgobserve.footerOptions = function(v) {
		updateFooter();
	};
}

function updateFooter() {
	if (cfg.footerOptions && footerpanel) {
		switch (cfg.footerOptions.visibility) {
			case 'yes':
				footerpanel.show();
				break;
			case 'no':
			default:
				footerpanel.hide();
				break;
		}
	}
}

function updateProtoSSIcon() {
	var picon = cfg.breadcrumbsOptions.icons === 'yes';
	if (picon !== cpicon) {
		cpicon = picon;
		titleEl.className = 'protoss-button';
		if (picon) {
			titleEl.classList.add('icon');
			titleEl.classList.add('icon-' + ['circuit-board', 'beaker'][Math.floor(Math.random() * 2)]);
		}
	}
}

function suffixObservers() {
	cfgobserve.breadcrumbs = function(v) {
		updateProtoSSCrumbs(atom.workspace.getActiveTextEditor(), true);
	};
	cfgobserve.breadcrumbsOptions = function(v) {
		updateProtoSSIcon();
		updateProtoSSCrumbs(atom.workspace.getActiveTextEditor());
	};
}

function suffixInit() {
	suffixObservers();
	updateProtoSSIcon();
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