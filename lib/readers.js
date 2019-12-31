/**
 * Author: Zeta Ret
 * ProtoSS package readers
 **/

var fs = require('fs'),
	path = require('path'),
	electron = require('electron');
var main = {
	cfg: {}
};

var fileEl, packEl, jsonEl, analyEl;
var parsePropertyType, parseReturnType, parseArgumentsTypes, getFileExt, pushNotification;

function updateCFG(cfg) {
	main.cfg = cfg;
}

function setElements(f, p, j, a) {
	fileEl = f;
	packEl = p;
	jsonEl = j;
	analyEl = a;
}

function setUtils(pt, rt, at, fe, pn) {
	parsePropertyType = pt;
	parseReturnType = rt;
	parseArgumentsTypes = at;
	getFileExt = fe;
	pushNotification = pn;
}

function readDocJson(e, b) {
	if (e) return;
	var cpath, cext, projson = null,
		p = main.cfg.editor.getPath();
	try {
		projson = JSON.parse(b.toString());
	} catch (e) {
		if (main.cfg.console === 'yes') console.log(e);
	}
	main.cfg.projson = projson;
	if (projson && projson.type === 'protossdox') {
		var jpath = getJpath();
		p = p.split('/').join('\\');
		var pjp = projson.path || '',
			srcpath = jpath + (projson.src || ''),
			srcrepl = srcpath.split('/').join('\\'),
			doxpath = (projson.relative ? jpath + pjp : pjp),
			doxrepl = doxpath.split('/').join('\\'),
			isSrc = p.indexOf(srcrepl) === 0,
			isDox = p.indexOf(doxrepl) === 0;

		try {
			if (isDox) cpath = p.replace(doxrepl, '').split('.');
			else if (isSrc) cpath = p.replace(srcrepl, '').split('.');
			else cpath = p.replace(jpath, '').split('.');
		} catch (e) {
			if (main.cfg.console === 'yes') console.log(e);
			cpath = [];
		}

		cext = cpath.length > 1 ? cpath.pop() : '';
		cpath = cpath.join('.');

		var descpath = doxrepl + cpath + '.json',
			mdpath = doxrepl + cpath + '.md',
			csplit = cpath.split('\\'),
			fname = csplit.pop();
		var sname = (projson.namespace ? projson.namespace + '.' : '') + (csplit.length > 0 ? csplit.join('.') + '.' : '') + fname.split('.').join(''),
			snamens = sname.split('.'),
			clsname = snamens.pop();
		sname = (snamens.length > 0 ? snamens.join('.') + '::' : '') + clsname;
		main.cfg.descpath = descpath;
		jsonEl.innerText = cpath.split(new RegExp('<|>')).join('') + '.json';
		jsonEl.setAttribute('path', descpath);
		jsonEl.setAttribute('supername', sname);
		jsonEl.setAttribute('ext', cext);
		jsonEl.setAttribute('mdpath', mdpath);
		jsonEl.setAttribute('cpath', cpath);
		jsonEl.style.pointerEvents = 'inherit';
		var prnm = projson.name ? projson.name.trim().split(new RegExp('<|>')).join('') : "";
		packEl.innerText = prnm || '[Unknown Project]';
		if (main.cfg.breadcrumbsOptions.icons === 'yes') {
			packEl.classList.add('icon');
			packEl.classList.add('icon-settings');
		}
		packEl.setAttribute('path', main.cfg.jsonpath);
		packEl.style.pointerEvents = 'inherit';

		var descpathd = descpath.split('\\').join(path.sep);
		if (fs.existsSync(descpathd)) {
			fs.readFile(descpathd, function(e, b) {
				if (main.cfg.descpath === descpath)
					readDescFile(e, b);
			});
		}
	}
}

function getJpath() {
	var jpath = main.cfg.jsonpath ? main.cfg.jsonpath.split('/').join('\\').split('\\') : null;
	if (jpath) {
		jpath.pop();
		jpath = jpath.join('\\') + '\\';
	}
	return jpath;
}

function addTooltip(span, props, tooltipst, title, onclick, trigger, cls, tooltipcls, maincls) {
	if (span && props.length > 0) {
		span.style.cursor = 'pointer';
		atom.tooltips.add(span, {
			title: '<div class="' + (tooltipcls || 'protoss-tooltip') + '" style="' + tooltipst + '">' + props.join('<br/>') + '</div>',
			trigger: trigger || 'click',
			class: maincls
		});
		var u = atom.tooltips.findTooltips(span)[0];
		if (trigger === 'manual') u.hide();
		if (title) span.setAttribute('title', title);
		if (cls !== false) span.classList.add(cls || 'protoss-ihover');
		if (onclick) span.addEventListener('click', e => onclick(u, e));
	}
}

function updateFromDescFile(descjson, nopush) {
	if (!descjson) descjson = main.cfg.descjson;
	var atxt, pc = 0,
		spc = 0,
		mc = 0,
		smc = 0;
	if (descjson) {
		var p = main.cfg.editor.getPath();
		p = p.split('/').join('\\');
		var jprop = [],
			jmeth = [],
			jimp = [],
			counter = {
				pc: 0,
				spc: 0,
				mc: 0,
				smc: 0
			},
			tst = 'font-size:13px;line-height:18px;display:inline;white-space:normal;';

		obtainDescData(descjson, null, adhocInnerTypes, [jprop, jmeth, tst, counter]);
		pc = counter.pc;
		spc = counter.spc;
		mc = counter.mc;
		smc = counter.smc;

		var inh = descjson.inherits && descjson.inherits.constructor === Array ? descjson.inherits : [],
			newinh = [];
		atxt = '<span class="json-prop">Properties: ' + pc + '-' + spc + '</span>';
		atxt += ', <span class="json-meth">Methods: ' + mc + '-' + smc + '</span>';
		if (descjson.imports && descjson.imports.length > 0) {
			descjson.imports.forEach(e => jimp.push('<span style="' + tst + '">' + e + '</span>'));
			atxt += ', <span class="json-imports">Imports: ' + descjson.imports.length + '</span>';
		}
		atxt += ', Inherits: ';
		var ft = [];
		if (descjson.name) ft.push('Name: ' + descjson.name);
		if (descjson.supername) ft.push('Supername: ' + descjson.supername);
		if (descjson.license) ft.push('License: ' + descjson.license);
		if (descjson.version) ft.push('Version: ' + descjson.version);
		if (descjson.date) ft.push('Date: ' + descjson.date);
		if (descjson.requires) ft.push('Requires: ' + descjson.requires);
		if (descjson.description) ft.push('Description: ' + descjson.description);
		if (descjson.text) ft.push('Text: ' + descjson.text);
		if (ft.length > 0) fileEl.setAttribute('title', ft.join('\n'));
		inh.forEach(function(el) {
			var sn, samens, fn, e;
			var rpn = getResolvedPathNameProject(el, getFileExt(), false, p);
			samens = rpn[0];
			fn = rpn[1];
			e = rpn[3];

			var ele = document.createElement('span');
			var fnp = fn.split('\\').join(path.sep);
			ele.setAttribute('supername', sn);
			ele.innerText = e.split(new RegExp('<|>')).join('');
			ele.style.marginRight = '4px';

			if (samens) {
				if (!main.cfg.supersEl) main.cfg.supersEl = [];
				main.cfg.supersEl.push(ele);
				ele.style.cursor = 'pointer';
				ele.setAttribute('path', fn);
				ele.setAttribute('title', parseReturnType(el).text + '\n-\nClick to Open in editor or [CTRL + Click] to Open in explorer:\n' + fn);
				ele.classList.add('protoss-ihover');
				ele.addEventListener('click', function(e) {
					if (e.ctrlKey || e.metaKey) {
						if (fs.existsSync(fnp)) electron.shell.showItemInFolder(fnp);
					} else {
						atom.open({
							pathsToOpen: [fnp],
							newWindow: false
						});
					}
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
		if (main.cfg.breadcrumbsOptions.icons === 'yes') analyEl.className = 'icon icon-info';
		var propspan = analyEl.getElementsByClassName("json-prop")[0],
			methspan = analyEl.getElementsByClassName("json-meth")[0],
			impspan = analyEl.getElementsByClassName("json-imports")[0];

		var tooltipst = ['max-width:' + Math.round(window.innerWidth / 2) + 'px',
			'max-height:' + Math.round(window.innerHeight / 2) + 'px'
		].join(';') + ';';
		addTooltip(impspan, jimp, tooltipst, 'Click to view Class Imports', (t, e) => {
			var tel = t.getTooltipElement();
			[].slice.call(tel.getElementsByTagName('span')).forEach(s => {
				s.classList.add('protoss-tooltip-span');
				s.style.cursor = 'pointer';
				s.setAttribute('title', 'Click to open ' + s.innerText);
				s.addEventListener('click', e => {
					var rpn = getResolvedPathNameProject(s.innerText, getFileExt());
					if (rpn[0]) {
						t.hide();
						atom.open({
							pathsToOpen: [rpn[1].split('\\').join(path.sep)],
							newWindow: false
						});
					}
				});
			});
		});
		addTooltip(propspan, jprop, tooltipst, 'Click to view Properties Tooltip');
		addTooltip(methspan, jmeth, tooltipst, 'Click to view Methods Tooltip');
		if (main.cfg.notifications !== 'no' && !nopush) pushNotification(jsonEl.getAttribute('cpath') + ' descriptor loaded', 'addSuccess', 'desc-' + main.cfg.descpath);
	}
}

function readDescFile(e, b) {
	if (e) return;
	var descjson = null;
	try {
		descjson = JSON.parse(b.toString());
	} catch (e) {
		if (main.cfg.console === 'yes') console.log(e);
	}
	main.cfg.descjson = descjson;
	updateFromDescFile();
}

function getResolvedPathName(el, ext, asdox, p, projson, jpath) {
	if (!jpath) jpath = getJpath();
	if (!jpath) return [];
	var sn, fn, e = parseReturnType(el).text;
	sn = e;
	e = e.split('::');
	if (e.length > 1) e = e[1];
	else e = e[0];
	fn = sn.split('.').join('\\').replace('::', '\\');
	if (!projson) projson = main.cfg.projson;
	if (!projson) return [];
	var ns;
	try {
		ns = projson.namespace.split('.').join('\\');
	} catch (e) {
		if (main.cfg.console === 'yes') console.log(e);
		ns = "";
	}
	var samens = false;
	if (fn.indexOf(ns) === 0) {
		fn = fn.replace(ns, '');
		samens = true;
	}
	if (fn.charAt(0) === '\\') fn = fn.substr(1);

	var pjp = projson.path || '',
		srcpath = jpath + (projson.src || ''),
		srcrepl = srcpath.split('/').join('\\'),
		doxpath = (projson.relative ? jpath + pjp : pjp),
		doxrepl = doxpath.split('/').join('\\'),
		isSrc = p ? p.indexOf(srcrepl) === 0 : false,
		isDox = p ? p.indexOf(doxrepl) === 0 : asdox;
	var inhp;
	if (isDox || asdox) inhp = doxrepl;
	else if (isSrc) inhp = srcrepl;
	else inhp = jpath;
	if (ext === true && projson.ext) {
		ext = projson.ext.find(e => {
			var autoextf = (inhp + fn + '.' + e).split('/').join('\\').split('\\').join(path.sep);
			if (fs.existsSync(autoextf)) {
				return true;
			}
		});
		if (ext === true) ext = null;
	}
	fn = (inhp + fn + (ext ? '.' + ext : '')).split('/').join('\\');

	return [samens, fn, ns, e];
}

function getResolvedPathNameProject(el, ext, asdox, p, projson, jpath, noguess) {
	var orpn, rpn = getResolvedPathName(el, ext, asdox, p, projson, jpath);
	if (main.cfg.atomprojsons && main.cfg.atomprojsons.length > 0 && (!rpn[0] || !fs.existsSync(rpn[1].split('\\').join(path.sep)))) {
		orpn = rpn;
		var crpn, crns, elns = el.split('::');
		if (elns.length > 1) elns = '.' + elns[0] + '.';
		else elns = '..';
		main.cfg.atomprojsons.find(e => {
			if (e[0].bind === false) return false;
			var irpn = getResolvedPathName(el, ext, asdox, p, e[0], e[1][0] + path.sep);
			var ns = '.' + irpn[2].split('\\').join('.') + '.';
			if (irpn[0] && fs.existsSync(irpn[1].split('\\').join(path.sep))) {
				rpn = irpn;
				return true;
			} else if (!noguess && irpn[0]) {
				if (!crpn || (elns.indexOf(ns) === 0 && (!crns || ns.split('.').length > crns.split('.').length))) {
					crpn = irpn;
					crns = ns;
				}
			}
		});
		if (crpn && orpn === rpn && !orpn[0]) rpn = crpn;
	}
	return rpn;
}

function getInheritance(descjson, key) {
	if (!key) key = "inherits";
	var inh = descjson && descjson[key] && descjson[key].constructor === Array ? descjson[key] : [],
		newinh = [];
	inh.forEach(function(el) {
		newinh.push(getResolvedPathNameProject(el, 'json', true));
	});

	return newinh;
}

function readInheritance(descjson, callback, key, descKey, loader) {
	if (!key) key = "inhTree";
	if (descjson && !descjson[key]) {
		descjson[key] = getInheritance(descjson, descKey);
		if (descjson[key] && descjson[key].length > 0) {
			setTimeout(function() {
				var i, f, fd;
				for (i = 0; i < descjson[key].length; i++) {
					f = descjson[key][i];
					if (!f[0]) continue;
					fd = f[1].split('\\').join(path.sep);
					if (loader && loader[fd]) continue;
					if (fs.existsSync(fd)) {
						if (loader) loader[fd] = true;
						fs.readFile(fd, function(e, b) {
							var j;
							try {
								j = JSON.parse(b);
							} catch (e) {
								if (main.cfg.console === 'yes') console.log(e);
							}
							callback(j);
						});
					} else {
						if (loader) loader[fd] = true;
						if (main.cfg.console === 'yes') console.log('no import:', fd);
					}
				}
			}, 5);
		}
	}
}

function getMethodDescAutoComplete(d) {
	var mk, md = [];
	if (d) {
		if (d['this']) md.push('# Description:\n' + d['this']);
		for (mk in d) {
			if (mk !== 'this' && mk !== 'return')
				md.push('@ ' + mk + ': ' + d[mk]);
		}
		if (d['return']) md.push('> return: ' + d['return']);
	}
	return md;
}

function obtainDescData(descjson, process, adhoc, adata) {
	var kd, dd, i, a, e, et, espl, k, v, d, rd = [],
		m = {
			'public': ['Public'],
			'private': ['Private'],
			'protected': ['Protected'],
			'static.public': ['Public static'],
			'static.private': ['Private static'],
			'static.protected': ['Protected static'],
		},
		at = {
			'property': ['properties'],
			'method': ['methods', 1]
		};

	for (a in at) {
		for (e in m) {
			espl = e.split('.');
			kd = espl[espl.length - 1] + '_' + at[a][0];
			et = espl.length > 1 ? espl[0] : null;
			try {
				dd = (et ? descjson[et] : descjson)[kd];
			} catch (er) {
				if (main.cfg.console === 'yes') console.log(er);
				continue;
			}
			if (dd) {
				i = 0;
				for (k in dd) {
					v = dd[k];
					d = descjson[(et ? et + '_' : '') + 'descriptions'][k];
					if (process) rd.push(process(descjson, k, v, d, e, m, a, at, i));
					if (adhoc) adhoc(rd, descjson, k, v, d, e, m, a, at, i, adata);
					i++;
				}
			}
		}
	}

	return rd;
}

function obtainAutoCompleteProcess(descjson, k, v, d, e, m, a, at, i) {
	var word, md = [];
	if (v) md.push(v);
	if (at[a][1]) md = md.concat(getMethodDescAutoComplete(d));
	else if (d) md.push(d);
	word = {
		text: k,
		description: md.join('\n'),
		rightLabelHTML: m[e][0] + " " + a,
		leftLabelHTML: descjson.supername || "ProtoSS",
		type: a
	};
	try {
		if (main.cfg.autoCompleteOptions.useMethodSnippets === 'yes' && a === 'method' && v) {
			word.snippet = k + '(' + v.split(';')[0].split(',').map((e, i) => '${' + (i + 1) + ':' + e.split(':')[0].trim() + '}').join(',') + ')';
		}
	} catch (err) {
		if (main.cfg.console === 'yes') console.log('Autocomplete snippet:', err);
	}
	return word;
}

function adhocInnerTypes(rd, descjson, k, v, d, e, m, a, at, i, adata) {
	var jprop = adata[0],
		jmeth = adata[1],
		tst = adata[2],
		counter = adata[3];
	if (a === 'property') {
		if (!e.startsWith('static.')) counter.pc++;
		else counter.spc++;
		if (i === 0) {
			if (e === 'public') jprop.push('<h3># Properties:</h3>');
			else if (e === 'private') jprop.push('<h3># Private Properties:</h3>');
			else if (e === 'protected') jprop.push('<h3># Protected Properties:</h3>');
			else if (e === 'static.public') jprop.push('<h3># Static Properties:</h3>');
			else if (e === 'static.private') jprop.push('<h3># Static Private Properties:</h3>');
			else if (e === 'static.protected') jprop.push('<h3># Static Protected Properties:</h3>');
		}
		try {
			jprop.push('<div style="' + tst + '"><b>' + k + '</b> - ' + parsePropertyType(v).text + '</div>');
		} catch (er) {
			if (main.cfg.console === 'yes') console.log(er, a, e, k, v);
		}
	} else {
		if (!e.startsWith('static.')) counter.mc++;
		else counter.smc++;
		var dspl, ret;
		if (i === 0) {
			if (e === 'public') jmeth.push('<h3># Methods:</h3>');
			else if (e === 'private') jmeth.push('<h3># Private Methods:</h3>');
			else if (e === 'protected') jmeth.push('<h3># Protected Methods:</h3>');
			else if (e === 'static.public') jmeth.push('<h3># Static Methods:</h3>');
			else if (e === 'static.private') jmeth.push('<h3># Static Private Methods:</h3>');
			else if (e === 'static.protected') jmeth.push('<h3># Static Protected Methods:</h3>');
		}
		try {
			dspl = v.split(';');
			ret = dspl[1] ? dspl[1].trim() : '';
			if (ret.indexOf('return ') === 0) ret = ret.substr(7);
			jmeth.push('<div style="' + tst + '"><b>' + k + '</b>(' + parseArgumentsTypes(dspl[0]).text + ') : ' + (parseReturnType(ret).text || 'void') + '</div>');
		} catch (er) {
			if (main.cfg.console === 'yes') console.log(er, a, e, k, v);
		}
	}
}

function adhocDescTypes(rd, descjson, k, v, d, e, m, a, at, i, adata) {
	try {
		if (a === 'property') {
			var p = parsePropertyType(v),
				cls, ta, t = p.prop ? p.prop.trim() : null;
			if (t) {
				if (!descjson.imports) descjson.imports = [];
				ta = t.split('|');
				ta.forEach(e => {
					if (t.indexOf('::') === -1) {
						t = t.split('.');
						cls = t.pop();
						if (t.length > 0) t = t.join('.') + '::' + cls;
						else t = cls;
					}
					if (t && descjson.imports.indexOf(t) === -1) descjson.imports.push(t);
				});
			}
		} else {
			var dspl = v.split(';'),
				ret = dspl[1] ? dspl[1].trim() : '';
			if (ret.indexOf('return ') === 0) ret = ret.substr(7);
			ret = parseReturnType(ret).text;
			dspl = parseArgumentsTypes(dspl[0]).spl;
			if (ret || dspl.length > 0) {
				if (!descjson.imports) descjson.imports = [];
				dspl.forEach(e => {
					var et = e.split(':');
					et = et[1];
					if (et) et = et.trim();
					var aet = et.split('|');
					aet.forEach(e => {
						if (e && descjson.imports.indexOf(e) === -1) descjson.imports.push(e);
					});
				});
				if (ret) {
					var aret = ret.split('|');
					aret.forEach(e => {
						if (e && descjson.imports.indexOf(e) === -1) descjson.imports.push(e);
					});
				}
			}
		}
	} catch (er) {
		if (main.cfg.console === 'yes') console.log(er, a, e, k, v);
	}
}

function obtainDescAutoComplete(descjson) {
	var acd = obtainDescData(descjson, obtainAutoCompleteProcess, main.cfg.autoCompleteTypes === 'yes' ? adhocDescTypes : null);
	if (descjson) {
		var desc = [];
		if (descjson.description) desc.push(descjson.description);
		if (descjson.text) desc.push(descjson.text);
		if (descjson.version) desc.push('Version: ' + descjson.version);
		if (descjson.date) desc.push('Date: ' + descjson.date);
		if (descjson.author) desc.push('Author: ' + descjson.author);
		acd.unshift({
			text: descjson.supername,
			description: desc.join('\n'),
			rightLabelHTML: 'Class',
			leftLabelHTML: 'ProtoSS',
			type: 'class'
		});
	}
	return acd;
}

function readProjectDox(files, cdata) {
	var loaded = files.length;
	if (!cdata) cdata = {};
	if (cdata.init) cdata.init(files);
	var projfiles = [];
	files.forEach(function(f) {
		var fd = f.join(path.sep);
		if (fs.existsSync(fd)) {
			fs.readFile(fd, function(e, b) {
				var j;
				try {
					j = JSON.parse(b);
				} catch (e) {
					if (main.cfg.console === 'yes') console.log(e);
				}
				loaded--;
				projfiles.push([j, f]);
				if (cdata.onread) cdata.onread(j, f);
				if (loaded === 0 && cdata.loaded) cdata.loaded(projfiles);
			});
		} else {
			loaded--;
			projfiles.push([null, f]);
			if (loaded === 0 && cdata.loaded) cdata.loaded(projfiles);
		}
	});
}

function loadProjectJSON(ps, prpath) {
	var docf, docfd, pss, docjson = main.cfg.docjsonname;

	function fileRead(e, b) {
		if (main.cfg.jsonpath === docf) readDocJson(e, b);
	}

	while (ps.length > 1) {
		docf = ps.join('\\') + '\\' + docjson;
		pss = ps.join(path.sep);
		docfd = docf.split('\\').join(path.sep);
		if (fs.existsSync(docfd)) {
			main.cfg.jsonpath = docf;
			fs.readFile(docfd, fileRead);
			break;
		} else {
			ps.pop();
		}
		if (main.cfg.project === 'project' && prpath.indexOf(pss) !== -1) break;
	}
}

module.exports.updateCFG = updateCFG;
module.exports.setElements = setElements;
module.exports.setUtils = setUtils;
module.exports.addTooltip = addTooltip;
module.exports.readDocJson = readDocJson;
module.exports.readDescFile = readDescFile;
module.exports.updateFromDescFile = updateFromDescFile;
module.exports.obtainDescAutoComplete = obtainDescAutoComplete;
module.exports.getResolvedPathName = getResolvedPathName;
module.exports.getResolvedPathNameProject = getResolvedPathNameProject;
module.exports.getInheritance = getInheritance;
module.exports.readInheritance = readInheritance;
module.exports.readProjectDox = readProjectDox;
module.exports.loadProjectJSON = loadProjectJSON;