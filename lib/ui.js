/**
 * Author: Zeta Ret
 * ProtoSS package ui
 **/

var fs = require('fs'),
	path = require('path'),
	electron = require('electron');

var titleEl, kbglobal, fileEl, linesEl, tokensEl, tokensElTooltip, sepEl, packEl, jsonEl, analyEl;
var groupDigits, gjs, cfg;

function setGrammar(g) {
	gjs = g;
}

function initUI(topEl, c, TokenUtil, ProtoSSUtil, updateProtoSSCrumbs, gd, formatBytes, readers, writers, xutils) {
	cfg = c;
	groupDigits = gd;

	titleEl = document.createElement('span');
	titleEl.innerText = 'ProtoSS';
	titleEl.style.marginRight = '10px';
	titleEl.style.cursor = 'pointer';

	kbglobal = ['Click to Refresh ProtoSS IDE. [SHIFT + Click] to open Settings.',
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
		'ALT + F8 - resolve token in file explorer',
		/*'SHIFT + F8 - reserved',
		'CTRL + F8 - reserved',
		'CTRL + ALT + F8 - reserved',*/
		'CTRL + SHIFT + F8 - open all files of class supers from inheritance in the current hierarchy, requires JSON descriptor',
		/*'ALT + SHIFT + F8 - reserved',*/
		'CTRL + SHIFT + ALT + F8 - build project'
	];
	titleEl.setAttribute('title', kbglobal.join('\n'));
	titleEl.addEventListener('click', function(e) {
		if (e.shiftKey) atom.workspace.open('atom://config/packages/' + cfg.packageid);
		else updateProtoSSCrumbs(atom.workspace.getActiveTextEditor());
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
				if (cfg.console === 'yes') console.log(e);
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
	tokensElTooltip = ['Click to next token [F7]',
		'CTRL + Click to previous token [CTRL+F7]',
		'SHIFT + Click to select token [SHIFT+F7]',
		'ALT + Click to refresh tokens [ALT+F7]'
	];
	tokensEl.addEventListener('click', function(e) {
		if (e.ctrlKey || e.metaKey) {
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

	var tooltipst = ['max-width:' + Math.round(window.innerWidth / 2) + 'px',
		'max-height:' + Math.round(window.innerHeight / 2) + 'px'
	].join(';') + ';';
	packEl = document.createElement('span');
	packEl.style.cursor = 'pointer';
	packEl.classList.add('protoss-package');
	packEl.classList.add('protoss-hover');
	packEl.addEventListener('mouseover', function(e) {
		var ps = ProtoSSUtil.projectSpace(),
			at = 'Click to Access ' + cfg.docjsonname + ' UI. Open in editor: [CTRL+SHIFT+ALT+F7] or [SHIFT+CLICK]';
		if (ps.namesp) at += '\nNamespace: ' + ps.namesp;
		if (ps.version) at += '\nVersion: ' + ps.version;
		if (ps.license) at += '\nLicense: ' + ps.license;
		if (ps.ap.length > 0 || ps.noap.length > 0) at += '\n' + ['-'].concat(ps.noap.join(', ')).concat(ps.ap).join('\n');
		packEl.setAttribute('title', at);
	});
	packEl.addEventListener('click', function(e) {
		if (e.shiftKey) ProtoSSUtil.projson();
	});
	readers.addTooltip(packEl, ['<div class="psbody"></div>'], tooltipst, null, (t, e) => {
		var ps = ProtoSSUtil.projectSpace(),
			tel = t.getTooltipElement();
		var html = [],
			psbody = tel.getElementsByClassName('psbody')[0];
		html.push('<div class="atom-project-btn current-project">' + ps.cpj.name + '</div>');
		if (ps.namesp) html.push('Namespace: ' + ps.namesp);
		if (ps.version) html.push('Version: ' + ps.version);
		if (ps.license) html.push('License: ' + ps.license);
		html.push(ps.cpj.relative ? 'Relative Path' : 'Absolute Path');
		html.push(ps.cpj.markdown ? 'Includes Markdown' : 'No Markdown');
		html.push(ps.cpj.bind === undefined || ps.cpj.bind ? 'Bound Project' : 'Unbound Project');
		html.push(ps.cpj.scripts === undefined ? 'No Scripts' : 'Includes Scripts');
		if (ps.cpj.ext) html.push('Known Extensions: ' + ps.cpj.ext.join(', '));
		html.push('<hr/>');
		psbody.innerHTML = html.join('<br/>');
		ps.capj.forEach(e => {
			var jsonpath = path.resolve(e[1][0], e[1][1]);
			var ap = document.createElement('div');
			ap.classList.add('atom-project-btn');
			ap.innerHTML = e[0].name + (e[0].namespace ? ': ' + e[0].namespace : '');
			ap.setAttribute('title', 'Click to open in editor or [SHIFT+Click] to Open in explorer:\n' + jsonpath);
			ap.addEventListener('click', se => {
				if (se.shiftKey) electron.shell.showItemInFolder(jsonpath);
				else {
					atom.open({
						pathsToOpen: [jsonpath],
						newWindow: false
					});
				}
				t.hide();
			});
			psbody.appendChild(ap);
		});
		var cbtn = psbody.getElementsByClassName('current-project')[0];
		cbtn.addEventListener('click', se => {
			ProtoSSUtil.projson();
			t.hide();
		});
	});
	topEl.appendChild(packEl);

	jsonEl = document.createElement('span');
	jsonEl.style.cursor = 'pointer';
	jsonEl.classList.add('protoss-hover');
	jsonEl.classList.add('protoss-jsondox');
	jsonEl.addEventListener('click', function(e) {
		if (e.shiftKey) {
			atom.commands.dispatch('atom-workspace', cfg.packageid + ':cmdsupername');
		} else if (e.altKey) {
			atom.commands.dispatch('atom-workspace', cfg.packageid + ':cmdts');
		} else ProtoSSUtil.jsonmd(e.ctrlKey || e.metaKey);
	});
	jsonEl.addEventListener('mouseover', function(e) {
		var jt = fileEl.getAttribute('title'),
			txt = [
				'Click to open JSON [CTRL+SHIFT+F7]',
				'CTRL + Click to open MD [ALT+SHIFT+F7]',
				'SHIFT + Click to copy Supername',
				'ALT + Click to generate TypeScript namespace/interface declaration as *.d.ts',
			];
		if (jt) {
			txt.push('-');
			txt.push(jt);
		}
		jsonEl.setAttribute('title', txt.join('\n'));
	});
	topEl.appendChild(jsonEl);

	analyEl = document.createElement('span');
	analyEl.style.marginRight = '10px';
	analyEl.style.cursor = 'default';
	topEl.appendChild(analyEl);

	readers.setElements(fileEl, packEl, jsonEl, analyEl);
	xutils.setElements(packEl, jsonEl);
	if (cfg.console === 'yes') console.log(cfg);

	return [titleEl, fileEl, linesEl, tokensEl, sepEl, packEl, jsonEl, analyEl];
}

function updateLinesCount(editor) {
	var lc = editor ? editor.getLineCount() : -1;
	if (cfg.groupdigits === 'yes' && lc !== -1) lc = groupDigits(lc);
	linesEl.innerText = lc !== -1 ? lc + ' lines' : 'no lines';
	linesEl.style.pointerEvents = lc === -1 ? 'none' : 'inherit';
}

function updateTokens(nt) {
	if (nt > 0) tokensEl.style.pointerEvents = 'inherit';
	if (cfg.groupdigits === 'yes') nt = groupDigits(nt);
	tokensEl.innerText = nt + ' tokens';
	tokensEl.className = 'protoss-hover';
	updateTokensElTooltip();
}

function updateTokensElTooltip() {
	tokensEl.setAttribute('title', tokensElTooltip.join('\n') + (gjs ? '\nActive Grammar: ' + gjs.name : ''));
}

module.exports.initUI = initUI;
module.exports.setGrammar = setGrammar;
module.exports.updateLinesCount = updateLinesCount;
module.exports.updateTokens = updateTokens;
module.exports.updateTokensElTooltip = updateTokensElTooltip;