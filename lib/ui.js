/**
 * Author: Zeta Ret
 * ProtoSS package ui
 **/

var fs = require('fs');

var titleEl, kbglobal, fileEl, linesEl, tokensEl, tokensElTooltip, sepEl, packEl, jsonEl, analyEl;
var groupDigits, gjs, cfg;

function setGrammar(g) {
	gjs = g;
}

function initUI(topEl, c, TokenUtil, ProtoSSUtil, updateProtoSSCrumbs, gd, formatBytes, readers, xutils) {
	cfg = c;
	groupDigits = gd;

	titleEl = document.createElement('span');
	titleEl.innerHTML = 'ProtoSS';
	titleEl.style.marginRight = '10px';
	titleEl.style.cursor = 'pointer';
	titleEl.classList.add('protoss-button');
	titleEl.classList.add('icon');
	titleEl.classList.add('icon-' + ['circuit-board', 'beaker'][Math.floor(Math.random() * 2)]);
	kbglobal = ['Click to Refresh ProtoSS IDE. [Shift + Click] to open Settings.',
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
	packEl = document.createElement('span');
	packEl.style.cursor = 'pointer';
	packEl.classList.add('protoss-package');
	packEl.classList.add('protoss-hover');
	packEl.addEventListener('mouseover', function(e) {
		var noap, ap, t = cfg.projson ? cfg.projson.namespace : '',
			at = 'Access ' + cfg.docjsonname + ' [CTRL+SHIFT+ALT+F7]' + (t ? '\nNamespace: ' + t : '');
		if (cfg.atomprojsons && cfg.atomprojsons.length > 0) {
			ap = [];
			noap = [];
			cfg.atomprojsons.forEach(e => e[0].bind !== false ? (e[0].namespace ? ap : noap).push(e[0].name + (e[0].namespace ? ': ' + e[0].namespace : '')) : null);
			noap = noap.join(', ');
			at += '\n' + ['-'].concat(noap).concat(ap).join('\n');
		}
		packEl.setAttribute('title', at);
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
		ProtoSSUtil.jsonmd(e.ctrlKey || e.metaKey);
	});
	jsonEl.addEventListener('mouseover', function(e) {
		var jt = fileEl.getAttribute('title');
		jsonEl.setAttribute('title', 'Click to open JSON [CTRL+SHIFT+F7]\nCTRL + Click to open MD [ALT+SHIFT+F7]' + (jt ? '\n-\n' + jt : ''));
	});
	topEl.appendChild(jsonEl);
	analyEl = document.createElement('span');
	analyEl.style.marginRight = '10px';
	analyEl.style.cursor = 'default';
	topEl.appendChild(analyEl);
	readers.setElements(fileEl, packEl, jsonEl, analyEl);
	xutils.setElements(packEl, jsonEl);
	if (cfg.console === 'yes') console.log(cfg);

	return [titleEl, fileEl, linesEl, tokensEl, tokensElTooltip, sepEl, packEl, jsonEl, analyEl];
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

function updateTokensElTooltip() {
	tokensEl.setAttribute('title', tokensElTooltip.join('\n') + (gjs ? '\nActive Grammar: ' + gjs.name : ''));
}

module.exports.initUI = initUI;
module.exports.setGrammar = setGrammar;
module.exports.updateLinesCount = updateLinesCount;
module.exports.updateTokens = updateTokens;
module.exports.updateTokensElTooltip = updateTokensElTooltip;