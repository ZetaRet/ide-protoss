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
	putils = require('./ProtoSSUtil.js'),
	xutils = require('./ExternalUtil.js'),
	tutil = require('./TokenUtil.js'),
	mutil = require('./MarkerUtil.js'),
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
		'autoComplete', 'autoCompleteTypes', 'autoCompleteNS', 'autoCompleteCSS', 'autoCompleteHTML',
		'autoCompleteSort', 'autoBuild',
		'project', 'xdescript', 'tokenTimeout', 'fileTimeout',
		'autoUpdateOnChange', 'breadcrumbs', 'console', 'splitpanel',
		'textColor', 'fontSize', 'notifications', 'groupdigits',
		'grammarId', 'findTokenCaseSensitivity', 'maxTokensPerLine',
		'useMultiviews', 'zetaret_omnipotency',
		'styleGroupMark', 'breadcrumbsOptions', 'autoCompleteOptions'
	],
	css = ['.protoss-button { font-weight: bold; }',
		'.protoss-hover, .protoss-padright { margin-right: 10px; }',
		'.protoss-button:hover, .protoss-hover:hover, .protoss-ihover:hover { text-decoration: underline; }',
		'.protoss-tooltip-span { padding: 2px; border-radius: 2px; line-height: 24px !important; }',
		'.protoss-tooltip-span:hover { background: rgba(10,10,10,0.1); }',
		'.protoss-tooltip { text-align: left !important; overflow: overlay; padding: 5px 20px; }',
		'.protoss-browse-tip { padding: 2px; border-radius: 2px; font-weight: bold; cursor: pointer; line-height: 24px; }',
		'.protoss-browse-tip:hover { background: rgba(10,10,10,0.1); }'
	],
	cfgobserve = {},
	disposables = null,
	gjs = null,
	bindings = {};

var titleEl, fileEl, linesEl, tokensEl, sepEl, packEl, jsonEl, analyEl, packagepanel, topEl, dynamicCSS, markers, cpicon;

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
	updateTokens = ui.updateTokens,
	updateLinesCount = ui.updateLinesCount;

const acpr = [providers.file, providers.basic, providers.async, providers.word, providers.merger];

putils.updateCFG(cfg);
putils.setUtils(utils, readers, TokenUtil);
utils.updateCFG(cfg);
readers.updateCFG(cfg);
readers.setUtils(parsePropertyType, parseReturnType, parseArgumentsTypes, getFileExt, pushNotification);
providers.updateCFG(cfg);
xutils.updateCFG(cfg);
tutil.updateCFG(cfg);
tutil.setUtils(updateTokens, updateLinesCount, pushNotification, groupDigits);
mutil.updateCFG(cfg);
mutil.setUtils(TokenUtil);

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

function fetchAsyncData(resolve, prefix, options, filterData) {
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
		resolve(filterData(prefix, rd));
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

function updateAutoCompletePriority() {
	providers.file.suggestionPriority = parseInt(cfg.autoCompleteOptions.filePriority);
	providers.basic.suggestionPriority = parseInt(cfg.autoCompleteOptions.basicPriority);
	providers.async.suggestionPriority = parseInt(cfg.autoCompleteOptions.asyncPriority);
	providers.word.suggestionPriority = parseInt(cfg.autoCompleteOptions.wordPriority);
	providers.merger.suggestionPriority = Math.min(providers.basic.suggestionPriority, providers.async.suggestionPriority, providers.word.suggestionPriority) - 1;
}

function buildProject() {
	ExternalUtil.getProtoSSDoxInWorkspace(readers.readProjectDox, {
		loaded: onProjectLoad
	});
}

function onProjectLoad(files) {
	if (cfg.console === 'yes') console.log(files);
	cfg.atomprojsons = files;
	readers.updateFromDescFile(null, true);
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
			'<span class="protoss-browse-tip" title="Click to Open in explorer:\n' + ct + '">' + last + '</span>',
			'---',
			'<div class="protoss-path-tooltip"></div>'
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
				spancls = 'protoss-tooltip-span';

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
					browser.innerHTML = browse.map(fe => '<span class="' + getFileDirentClass(fe, spancls) + '">' + fe.name + '</span>').join('<br/>');
					[].slice.call(browser.getElementsByTagName('span')).forEach((s, i) => {
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

function updateProtoSSCrumbs(editor, wait) {
	var p, ps, jsfile;
	if (cfg.editor) {
		if (cfg.editor.disposeChangeEach) cfg.editor.disposeChangeEach.dispose();
		if (cfg.editor.disposeChange) cfg.editor.disposeChange.dispose();
		if (cfg.editor.disposeCursor) cfg.editor.disposeCursor.dispose();
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

	updateLinesCount(editor);
	linesEl.style.display = cfg.breadcrumbsOptions.lines !== 'yes' ? 'none' : '';
	tokensEl.innerText = 'no tokens';
	tokensEl.className = '';
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
		});
		editor.disposeChange = editor.buffer.onDidStopChanging(function(changes) {
			editor.__changing = false;
			TokenUtil.Alter();
		});
		editor.disposeCursor = editor.onDidChangeCursorPosition((c, nbp, nsp, obp, osp, tc) => {
			if (!editor.__changing && !cfg.altered) {
				destroyMarkers();
				if (cfg.styleGroupMark.markerAllow === 'yes') markers = MarkerUtil.decorate(null, nbp);
			}
		});
		editor.element.addEventListener('tokenized', () => {
			destroyMarkers();
			if (cfg.styleGroupMark.markerAllow === 'yes') markers = MarkerUtil.decorate();
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
					if (cfg.breadcrumbsOptions.icons === 'yes') {
						packEl.classList.add('icon');
						packEl.classList.add('icon-settings');
					}
					packEl.style.pointerEvents = 'inherit';
				} else if (cfg.project === 'none') {
					packEl.innerText = '[Disabled ProtoSS Dox]';
					if (cfg.breadcrumbsOptions.icons === 'yes') {
						packEl.classList.add('icon');
						packEl.classList.add('icon-settings');
					}
				} else {
					readers.loadProjectJSON(ps, prpath);
					if (!cfg.jsonpath) {
						packEl.innerText = '[Create ProtoSS Dox]';
						if (cfg.breadcrumbsOptions.icons === 'yes') {
							packEl.classList.add('icon');
							packEl.classList.add('icon-settings');
						}
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
		topEl, cfg, TokenUtil, ProtoSSUtil, updateProtoSSCrumbs, groupDigits, formatBytes, readers, xutils
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

function suffixInit() {
	cfgobserve.breadcrumbs = function(v) {
		updateProtoSSCrumbs(atom.workspace.getActiveTextEditor(), true);
	};
	cfgobserve.breadcrumbsOptions = function(v) {
		updateProtoSSIcon();
		updateProtoSSCrumbs(atom.workspace.getActiveTextEditor());
	};
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