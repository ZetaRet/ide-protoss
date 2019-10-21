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
		jsonEl.innerHTML = cpath.split(new RegExp('<|>')).join('') + '.json';
		jsonEl.setAttribute('path', descpath);
		jsonEl.setAttribute('supername', sname);
		jsonEl.setAttribute('ext', cext);
		jsonEl.setAttribute('mdpath', mdpath);
		jsonEl.setAttribute('cpath', cpath);
		jsonEl.style.pointerEvents = 'inherit';
		var prnm = projson.name ? projson.name.trim().split(new RegExp('<|>')).join('') : "";
		packEl.innerHTML = prnm || '[Unknown Project]';
		packEl.classList.add('icon');
		packEl.classList.add('icon-settings');
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
	var jpath = main.cfg.jsonpath.split('/').join('\\').split('\\');
	jpath.pop();
	jpath = jpath.join('\\') + '\\';
	return jpath;
}

function updateFromDescFile(descjson) {
	if (!descjson) descjson = main.cfg.descjson;
	var pc = 0,
		spc = 0,
		mc = 0,
		smc = 0,
		k, atxt;
	if (descjson) {
		var p = main.cfg.editor.getPath();
		p = p.split('/').join('\\');
		var dspl, ret, jprop = [],
			jmeth = [],
			tst, fp;
		tst = 'font-size:13px;line-height:18px;display:inline;white-space:normal;';
		if (descjson.public_properties) {
			for (k in descjson.public_properties) {
				pc++;
				try {
					jprop.push('<div style="' + tst + '"><b>' + k + '</b> - ' + parsePropertyType(descjson.public_properties[k]).text + '</div>');
				} catch (e) {
					if (main.cfg.console === 'yes') console.log(e);
				}
			}
			if (jprop.length > 0) jprop.unshift('<h3># Properties:</h3>');
		}
		if (descjson.protected_properties) {
			fp = false;
			for (k in descjson.protected_properties) {
				pc++;
				if (!fp) {
					fp = true;
					jprop.push('<h3># Protected Properties:</h3>');
				}
				try {
					jprop.push('<div style="' + tst + '"><b>' + k + '</b> - ' + parsePropertyType(descjson.protected_properties[k]).text + '</div>');
				} catch (e) {
					if (main.cfg.console === 'yes') console.log(e);
				}
			}
		}
		if (descjson.public_methods) {
			for (k in descjson.public_methods) {
				mc++;
				try {
					dspl = descjson.public_methods[k].split(';');
					ret = dspl[1] ? dspl[1].trim() : '';
					if (ret.indexOf('return ') === 0) ret = ret.substr(7);
					jmeth.push('<div style="' + tst + '"><b>' + k + '</b>(' + parseArgumentsTypes(dspl[0]).text + ') : ' + (parseReturnType(ret).text || 'void') + '</div>');
				} catch (e) {
					if (main.cfg.console === 'yes') console.log(e);
				}
			}
			if (jmeth.length > 0) jmeth.unshift('<h3># Methods:</h3>');
		}
		if (descjson.protected_methods) {
			fp = false;
			for (k in descjson.protected_methods) {
				mc++;
				if (!fp) {
					fp = true;
					jmeth.push('<h3># Protected Methods:</h3>');
				}
				try {
					dspl = descjson.protected_methods[k].split(';');
					ret = dspl[1] ? dspl[1].trim() : '';
					if (ret.indexOf('return ') === 0) ret = ret.substr(7);
					jmeth.push('<div style="' + tst + '"><b>' + k + '</b>(' + parseArgumentsTypes(dspl[0]).text + ') : ' + (parseReturnType(ret).text || 'void') + '</div>');
				} catch (e) {
					if (main.cfg.console === 'yes') console.log(e);
				}
			}
		}
		if (descjson.static && descjson.static.public_properties) {
			fp = false;
			for (k in descjson.static.public_properties) {
				spc++;
				if (!fp) {
					fp = true;
					jprop.push('<h3># Static Properties:</h3>');
				}
				try {
					jprop.push('<div style="' + tst + '"><b>' + k + '</b> - ' + parsePropertyType(descjson.static.public_properties[k]).text + '</div>');
				} catch (e) {
					if (main.cfg.console === 'yes') console.log(e);
				}
			}
		}
		if (descjson.static && descjson.static.protected_properties) {
			fp = false;
			for (k in descjson.static.protected_properties) {
				spc++;
				if (!fp) {
					fp = true;
					jprop.push('<h3># Static Protected Properties:</h3>');
				}
				try {
					jprop.push('<div style="' + tst + '"><b>' + k + '</b> - ' + parsePropertyType(descjson.static.protected_properties[k]).text + '</div>');
				} catch (e) {
					if (main.cfg.console === 'yes') console.log(e);
				}
			}
		}
		if (descjson.static && descjson.static.public_methods) {
			fp = false;
			for (k in descjson.static.public_methods) {
				smc++;
				if (!fp) {
					fp = true;
					jmeth.push('<h3># Static Methods:</h3>');
				}
				try {
					dspl = descjson.static.public_methods[k].split(';');
					ret = dspl[1] ? dspl[1].trim() : '';
					if (ret.indexOf('return ') === 0) ret = ret.substr(7);
					jmeth.push('<div style="' + tst + '"><b>' + k + '</b>(' + parseArgumentsTypes(dspl[0]).text + ') : ' + (parseReturnType(ret).text || 'void') + '</div>');
				} catch (e) {
					if (main.cfg.console === 'yes') console.log(e);
				}
			}
		}
		if (descjson.static && descjson.static.protected_methods) {
			fp = false;
			for (k in descjson.static.protected_methods) {
				smc++;
				if (!fp) {
					fp = true;
					jmeth.push('<h3># Static Protected Methods:</h3>');
				}
				try {
					dspl = descjson.static.protected_methods[k].split(';');
					ret = dspl[1] ? dspl[1].trim() : '';
					if (ret.indexOf('return ') === 0) ret = ret.substr(7);
					jmeth.push('<div style="' + tst + '"><b>' + k + '</b>(' + parseArgumentsTypes(dspl[0]).text + ') : ' + (parseReturnType(ret).text || 'void') + '</div>');
				} catch (e) {
					if (main.cfg.console === 'yes') console.log(e);
				}
			}
		}
		var inh = descjson.inherits && descjson.inherits.constructor === Array ? descjson.inherits : [],
			newinh = [];
		atxt = '<span class="json-prop">Properties: ' + pc + '-' + spc + '</span>,' +
			' <span class="json-meth">Methods: ' + mc + '-' + smc +
			'</span>, Inherits: ';
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
			ele.innerHTML = e.split(new RegExp('<|>')).join('');
			ele.style.marginRight = '4px';

			if (samens) {
				if (!main.cfg.supersEl) main.cfg.supersEl = [];
				main.cfg.supersEl.push(ele);
				ele.style.cursor = 'pointer';
				ele.setAttribute('path', fn);
				ele.setAttribute('title', 'Click to open ' + fn + '\nCTRL+Click to open in explorer');
				ele.classList.add('protoss-ihover');
				ele.addEventListener('click', function(e) {
					if (e.ctrlKey) {
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
			propspan.classList.add('protoss-ihover');
		}
		if (methspan && jmeth.length > 0) {
			methspan.style.cursor = 'pointer';
			atom.tooltips.add(methspan, {
				title: '<div style="' + tooltipst + ';">' + jmeth.join('<br/>') + '</div>',
				trigger: 'click'
			});
			methspan.setAttribute('title', 'Click to view Methods Tooltip');
			methspan.classList.add('protoss-ihover');
		}
		if (main.cfg.notifications !== 'no') pushNotification(jsonEl.getAttribute('cpath') + ' descriptor loaded', 'addSuccess', 'desc-' + main.cfg.jsonpath);
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
	var sn, fn, e = parseReturnType(el).text;
	sn = e;
	e = e.split('::');
	if (e.length > 1) e = e[1];
	else e = e[0];
	fn = sn.split('.').join('\\').replace('::', '\\');
	if (!projson) projson = main.cfg.projson;
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
	var inh = descjson[key] && descjson[key].constructor === Array ? descjson[key] : [],
		newinh = [];
	inh.forEach(function(el) {
		newinh.push(getResolvedPathNameProject(el, 'json', true));
	});

	return newinh;
}

function readInheritance(descjson, callback, key, descKey, loader) {
	if (!key) key = "inhTree";
	if (!descjson[key]) {
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

function obtainDescAutoComplete(descjson) {
	var kd, dd, a, e, et, espl, md, k, v, d, rd = [],
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
			} catch (e) {
				if (main.cfg.console === 'yes') console.log(e);
				continue;
			}
			if (dd) {
				for (k in dd) {
					v = dd[k];
					d = descjson[(et ? et + '_' : '') + 'descriptions'][k];
					md = [];
					if (v) md.push(v);
					if (at[a][1]) md = md.concat(getMethodDescAutoComplete(d));
					else if (d) md.push(d);
					rd.push({
						text: k,
						description: md.join('\n'),
						rightLabelHTML: m[e][0] + " " + a,
						leftLabelHTML: descjson.supername || "ProtoSS",
						type: a
					});
				}
			}
		}
	}

	return rd;
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

module.exports.updateCFG = updateCFG;
module.exports.setElements = setElements;
module.exports.setUtils = setUtils;
module.exports.readDocJson = readDocJson;
module.exports.readDescFile = readDescFile;
module.exports.updateFromDescFile = updateFromDescFile;
module.exports.obtainDescAutoComplete = obtainDescAutoComplete;
module.exports.getResolvedPathName = getResolvedPathName;
module.exports.getResolvedPathNameProject = getResolvedPathNameProject;
module.exports.getInheritance = getInheritance;
module.exports.readInheritance = readInheritance;
module.exports.readProjectDox = readProjectDox;