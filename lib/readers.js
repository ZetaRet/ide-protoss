/**
 * Author: Zeta Ret
 * ProtoSS package readers
 **/

var fs = require('fs'),
	path = require('path');
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
	} catch (e) {}
	main.cfg.projson = projson;
	if (projson && projson.type === 'protossdox') {
		var jpath = main.cfg.jsonpath.split('/').join('\\').split('\\');
		jpath.pop();
		p = p.split('/').join('\\');
		jpath = jpath.join('\\') + '\\';
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
		packEl.className = 'icon icon-settings';
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

function readDescFile(e, b) {
	if (e) return;
	var descjson = null;
	try {
		descjson = JSON.parse(b.toString());
	} catch (e) {}
	main.cfg.descjson = descjson;
	var pc = 0,
		spc = 0,
		mc = 0,
		smc = 0,
		k, atxt;
	if (descjson) {
		var jpath = main.cfg.jsonpath.split('/').join('\\').split('\\');
		jpath.pop();
		jpath = jpath.join('\\') + '\\';
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
				} catch (e) {}
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
				} catch (e) {}
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
				} catch (e) {}
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
				} catch (e) {}
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
				} catch (e) {}
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
				} catch (e) {}
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
				} catch (e) {}
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
				} catch (e) {}
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
			var ns;
			try {
				ns = main.cfg.projson.namespace.split('.').join('\\');
			} catch (e) {
				ns = "";
			}
			var samens = false;
			if (fn.indexOf(ns) === 0) {
				fn = fn.replace(ns, '');
				samens = true;
			}
			if (fn.charAt(0) === '\\') fn = fn.substr(1);
			var fext = getFileExt();

			var pjp = main.cfg.projson.path || '',
				srcpath = jpath + (main.cfg.projson.src || ''),
				srcrepl = srcpath.split('/').join('\\'),
				doxpath = (main.cfg.projson.relative ? jpath + pjp : pjp),
				doxrepl = doxpath.split('/').join('\\'),
				isSrc = p.indexOf(srcrepl) === 0,
				isDox = p.indexOf(doxrepl) === 0;

			var inhp;
			if (isDox) inhp = doxrepl;
			else if (isSrc) inhp = srcrepl;
			else inhp = jpath;
			fn = (inhp + fn + (fext ? '.' + fext : '')).split('/').join('\\');

			if (samens) {
				if (!main.cfg.supersEl) main.cfg.supersEl = [];
				main.cfg.supersEl.push(ele);
				ele.style.cursor = 'pointer';
				ele.setAttribute('path', fn);
				ele.setAttribute('title', 'Click to open ' + fn);
				ele.addEventListener('click', function(e) {
					atom.open({
						pathsToOpen: [fn.split('\\').join(path.sep)],
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
		if (main.cfg.notifications !== 'no') pushNotification(jsonEl.getAttribute('cpath') + ' descriptor loaded', 'addSuccess', 'desc-' + main.cfg.jsonpath);
	}
}

module.exports.updateCFG = updateCFG;
module.exports.setElements = setElements;
module.exports.setUtils = setUtils;
module.exports.readDocJson = readDocJson;
module.exports.readDescFile = readDescFile;