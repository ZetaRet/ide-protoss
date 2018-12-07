/**
 * Author: Zeta Ret
 * Date: 2018 - Today
 * ProtoSS package for Atom IDE
 **/
var fs = require('fs');

var cfg = {
		docjsonname: 'protossdox.json'
	},
	nskey = 'ide-protoss.',
	cfgkeys = ['breadcrumbs', 'console', 'textColor', 'fontSize'],
	cfgobserve = {};
var defDescriptor = {
	"author": "",
	"description": "",
	"text": "",
	"requires": "",
	"version": "",
	"date": "",
	"supername": "",
	"inherits": [],
	"interfaces": [],
	"static": {
		"public_properties": {},
		"protected_properties": {},
		"private_properties": {},
		"public_methods": {},
		"protected_methods": {},
		"private_methods": {}
	},
	"public_properties": {},
	"protected_properties": {},
	"private_properties": {},
	"public_methods": {},
	"protected_methods": {},
	"private_methods": {},
	"static_descriptions": {},
	"descriptions": {},
	"static_examples": {},
	"examples": {}
};
var defProtodox = {
	"name": "",
	"type": "protossdox",
	"path": "",
	"src": "",
	"namespace": "",
	"relative": true,
	"markdown": true
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
cfgkeys.forEach(function(el) {
	atom.config.observe(nskey + el, function(v) {
		cfgGet(el);
		if (cfgobserve[el]) cfgobserve[el](v);
	});
});

if (cfg.console === 'yes') console.log('#protoss ide#start');

var topEl = document.createElement('div');
topEl.classList.add('protoss-top-panel');
topEl.style.margin = '4px';
cfgobserve.textColor = function(v) {
	topEl.style.color = cfg.textColor === 'default' ? 'inherit' : cfg.textColor;
};
cfgobserve.textColor();
cfgobserve.fontSize = function(v) {
	topEl.style.fontSize = cfg.fontSize === 'default' ? 'inherit' : cfg.fontSize;
};
cfgobserve.fontSize();

atom.workspace.addTopPanel({
	item: topEl
});

function readDocJson(e, b) {
	var projson = JSON.parse(b.toString()),
		p = cfg.editor.getPath();
	cfg.projson = projson;
	if (projson && projson.type === 'protossdox') {
		var jpath = cfg.jsonpath.split('\\');
		jpath.pop();
		jpath = jpath.join('\\') + '\\';
		var srcpath = jpath + projson.src;
		var cpath = p.replace(srcpath.split('/').join('\\'), '').split('.');
		var cext = cpath.pop();
		cpath = cpath.join('.');
		var pjp = projson.path.split('/').join('\\');
		var descpath = (projson.relative ? jpath + pjp : pjp) + cpath + '.json';
		var mdpath = (projson.relative ? jpath + pjp : pjp) + cpath + '.md';
		var csplit = cpath.split('\\');
		var fname = csplit.pop();
		var sname = (projson.namespace ? projson.namespace + '.' : '') + (csplit.length > 0 ? csplit.join('.') + '.' : '') + fname.split('.').join('');
		var snamens = sname.split('.');
		var clsname = snamens.pop();
		sname = snamens.join('.') + '::' + clsname;
		jsonEl.innerHTML = cpath + '.json';
		jsonEl.setAttribute('path', descpath);
		jsonEl.setAttribute('supername', sname);
		jsonEl.setAttribute('ext', cext);
		jsonEl.setAttribute('mdpath', mdpath);
		jsonEl.style.pointerEvents = 'inherit';
		packEl.innerHTML = projson.name && projson.name.trim() ? projson.name : 'Unknown Project';
		packEl.setAttribute('path', cfg.jsonpath);
		packEl.style.pointerEvents = 'inherit';

		if (fs.existsSync(descpath)) {
			fs.readFile(descpath, readDescFile);
		}
	}

}

function readDescFile(e, b) {
	var descjson = JSON.parse(b.toString());
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

		for (k in descjson.public_properties) pc++;
		for (k in descjson.public_methods) mc++;
		for (k in descjson.static.public_properties) spc++;
		for (k in descjson.static.public_methods) smc++;
		var inh = descjson.inherits,
			newinh = [];
		atxt = 'Properties: ' + pc + '-' + spc + ', Methods: ' + mc + '-' +
			smc + ', Inherits: ';
		inh.forEach(function(el) {
			var sn, fn, e = el.split(']')[0].split('[');
			if (e.length > 1) e = e[1];
			else e = e[0];
			var ele = document.createElement('span');
			sn = e;
			ele.setAttribute('supername', sn);
			e = e.split('::');
			if (e.length > 1) e = e[1];
			else e = e[0];
			ele.innerHTML = e;
			ele.style.marginRight = '4px';
			fn = sn.split('.').join('\\').replace('::', '\\');
			var ns = cfg.projson.namespace.split('.').join('\\');
			var samens = false;
			if (fn.indexOf(ns) === 0) {
				fn = fn.replace(ns, '');
				samens = true;
			}
			if (fn.charAt(0) === '\\') fn = fn.substr(1);
			fn = jpath + fn + '.js';

			if (samens) {
				ele.style.cursor = 'pointer';
				ele.setAttribute('path', fn);
				ele.setAttribute('title', fn);
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
	}
}

function updateProtoSSCrumbs(editor) {
	var p, ps, jsfile;
	cfg.editor = editor;
	cfg.descjson = null;
	cfg.projson = null;
	cfg.jsonpath = null;
	cfg.activeTokens = null;
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
	fileEl.innerHTML = p || 'no editor';
	linesEl.innerHTML = editor ? editor.getLineCount() + ' lines' : 'no lines';
	tokensEl.innerHTML = 'no tokens';
	jsonEl.innerHTML = '';
	jsonEl.setAttribute('path', '');
	jsonEl.setAttribute('mdpath', '');
	jsonEl.setAttribute('ext', '');
	jsonEl.setAttribute('supername', '');
	jsonEl.style.pointerEvents = 'none';
	packEl.innerHTML = '';
	packEl.setAttribute('path', '');
	packEl.style.pointerEvents = 'none';
	analyEl.innerHTML = '';

	if (jsfile) {
		cfg.activeTokens = gjs ? gjs.tokenizeLines(editor.getText()) : [];
		if (cfg.console === 'yes') console.log('editor tokens: ');
		if (cfg.console === 'yes') console.log(cfg.activeTokens);
		var nt = 0;
		cfg.activeTokens.forEach(function(tl) {
			nt += tl.length;
		});
		tokensEl.innerHTML = nt + ' tokens';

		var docjson = cfg.docjsonname,
			docf;

		while (ps.length > 1) {
			docf = ps.join('\\') + '\\' + docjson;
			if (fs.existsSync(docf)) {
				cfg.jsonpath = docf;
				fs.readFile(docf, readDocJson);
				break;
			} else {
				ps.pop();
			}
		}
		if (!cfg.jsonpath) {
			packEl.innerHTML = '[Create ProtoSS Dox]';
			packEl.style.pointerEvents = 'inherit';
		}

	}
}

atom.workspace.onDidChangeActiveTextEditor(updateProtoSSCrumbs);

var titleEl = document.createElement('span');
titleEl.innerHTML = 'ProtoSS';
titleEl.style.paddingRight = '10px';
titleEl.style.cursor = 'pointer';
titleEl.setAttribute('title', 'Refresh ProtoSS Panel');
titleEl.addEventListener('click', function(e) {
	cfgobserve.breadcrumbs();
});
topEl.appendChild(titleEl);
var fileEl = document.createElement('span');
fileEl.style.paddingRight = '10px';
fileEl.style.cursor = 'default';
topEl.appendChild(fileEl);
var linesEl = document.createElement('span');
linesEl.style.paddingRight = '10px';
linesEl.style.cursor = 'default';
topEl.appendChild(linesEl);
var tokensEl = document.createElement('span');
tokensEl.style.paddingRight = '10px';
tokensEl.style.cursor = 'default';
topEl.appendChild(tokensEl);
var packEl = document.createElement('span');
packEl.style.paddingRight = '10px';
packEl.style.cursor = 'pointer';
packEl.setAttribute('title', 'Access protossdox.json');
packEl.addEventListener('click', function(e) {
	var p = packEl.getAttribute('path');
	if (p) {
		atom.open({
			pathsToOpen: [p],
			newWindow: false
		});
	} else {
		var prPaths = atom.project.getPaths(),
			found = 0,
			p = atom.workspace.getActiveTextEditor().getPath(),
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
				detail: 'Select path to create protossdox.json of this Project. Paths appear reversed.',
				buttons: ['Cancel'].concat(paths)
			}, response => {
				if (response !== 0) {
					var jp = prPaths[response - 1] + '\\' + cfg.docjsonname;
					packEl.setAttribute('path', jp);
					atom.workspace.open(jp).then(function(editor) {
						if (editor.getText().length === 0) {
							editor.setText(JSON.stringify(defProtodox));
							editor.setCursorScreenPosition([0, 9]);
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
});
topEl.appendChild(packEl);
var jsonEl = document.createElement('span');
jsonEl.style.paddingRight = '10px';
jsonEl.style.cursor = 'pointer';
jsonEl.setAttribute('title', 'Click to open JSON, CTRL+Click to open MD');
jsonEl.addEventListener('click', function(e) {
	var p = jsonEl.getAttribute('path'),
		sn = jsonEl.getAttribute('supername'),
		mp = jsonEl.getAttribute('mdpath');
	if (e.ctrlKey && mp) {
		atom.workspace.open(mp);
	} else if (p) {
		atom.workspace.open(p).then(function(editor) {
			var t = editor.getText();
			if (!t) {
				var jdesc = {};
				for (var k in defDescriptor) jdesc[k] = defDescriptor[k];
				jdesc['supername'] = sn;
				editor.setText(JSON.stringify(jdesc));
			}
		});
	}
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
atom.grammars.onDidAddGrammar(function(e) {
	gjs = atom.grammars.getGrammars().find(function(g) {
		return g.name === 'JavaScript';
	});
});

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
	updateProtoSSCrumbs(atom.workspace.getActiveTextEditor());
};
cfgobserve.breadcrumbs();

if (cfg.console === 'yes') console.log('#protoss ide#end');
