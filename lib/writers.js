/**
 * Author: Zeta Ret
 * ProtoSS package writers
 **/

var cfg;

var utils;

function updateCFG(xcfg) {
	cfg = xcfg;
}

function setUtils(ut) {
	utils = ut;
}

const TSConvert = {
	'Boolean': 'boolean',
	'Number': 'number',
	'String': 'string',
	'Object': 'object',
	'Symbol': 'symbol',
	'Array': 'Array<object>',
	'Promise': 'Promise<object>',
	'Map': 'Map<object, object>'
};

const TSAccess = ['', 'protected ', 'private '];

function getPropertyTypes(p) {
	return p.map.map(pt => TSConvert[pt] || pt);
}

function getRetTypes(m) {
	return m.ret.map.map(r => TSConvert[r] || r.replace('::', '.'));
}

function getArgTypes(a) {
	return a[1].map(t => TSConvert[t] || t);
}

function formatArgKey(a) {
	return a[0].endsWith('*') ? a[0].substring(0, a[0].length - 1) : a[0] + '?';
}

function declareTS(desc, joiner, tab, pipe) {
	var dts = [],
		propsts = [],
		methodsts = [],
		spropsts = [],
		smethodsts = [],
		newsts = [],
		tabrep = 1;
	var ns, cls, snspl = desc.supername.split('::');
	var props = [
		desc.public_properties || {},
		desc.protected_properties || {},
		desc.private_properties || {}
	];
	var methods = [
		desc.public_methods || {},
		desc.protected_methods || {},
		desc.private_methods || {}
	];
	const staticobj = desc.static || {};
	var sprops = [
		staticobj.public_properties || {},
		staticobj.protected_properties || {},
		staticobj.private_properties || {}
	];
	var smethods = [
		staticobj.public_methods || {},
		staticobj.protected_methods || {},
		staticobj.private_methods || {}
	];
	if (!tab) tab = '';
	if (!pipe) pipe = ' | ';
	cls = snspl.pop();
	if (snspl.length > 0) ns = snspl[0];
	if (ns) dts.push('declare namespace ' + ns + ' {');
	else tabrep--;

	props.forEach((e, i) => {
		var k, p, aa = (cfg.exportOptions.accessor === 'yes' ? TSAccess[i] : '');
		for (k in e) {
			p = utils.parsePropertyType(e[k]);
			propsts.push(tab.repeat(tabrep + 1) + aa + k + ': ' + getPropertyTypes(p).join(pipe) + ';');
		}
	});
	sprops.forEach(e => {
		var k, p;
		for (k in e) {
			p = utils.parsePropertyType(e[k]);
			spropsts.push(tab.repeat(tabrep + 1) + k + ': ' + getPropertyTypes(p).join(pipe) + ';');
		}
	});
	methods.forEach((e, i) => {
		var k, m, arg, ret, aa = (cfg.exportOptions.accessor === 'yes' ? TSAccess[i] : '');
		for (k in e) {
			m = utils.convertMethodTypes(k, e[k]);
			arg = m.args.map.map(a => formatArgKey(a) + ': ' + getArgTypes(a).join(pipe)).join(', ');
			ret = getRetTypes(m).join(pipe);
			if (k === cls) newsts.push(tab.repeat(tabrep + 1) + 'new(' + arg + '): ' + cls);
			else methodsts.push(tab.repeat(tabrep + 1) + aa + k + '(' + arg + '): ' + (ret || 'void'));
		}
	});
	smethods.forEach(e => {
		var k, m, arg, ret;
		for (k in e) {
			m = utils.convertMethodTypes(k, e[k]);
			arg = m.args.map.map(a => formatArgKey(a) + ': ' + getArgTypes(a).join(pipe)).join(', ');
			ret = getRetTypes(m).join(pipe);
			smethodsts.push(tab.repeat(tabrep + 1) + k + '(' + arg + '): ' + (ret || 'void'));
		}
	});

	dts.push(tab.repeat(tabrep) + 'export interface ' + cls + 'CTOR {');
	dts = dts.concat(newsts);
	dts.push(tab.repeat(tabrep) + '}');

	dts.push(tab.repeat(tabrep) + 'export interface ' + cls + ' {');
	dts = dts.concat(propsts, [''], methodsts);
	dts.push(tab.repeat(tabrep) + '}');

	dts.push(tab.repeat(tabrep) + 'export interface ' + cls + 'Static {');
	dts = dts.concat(spropsts, [''], smethodsts);
	dts.push(tab.repeat(tabrep) + '}');

	if (ns) dts.push('}');
	return joiner ? dts.join(joiner) : dts;
}

module.exports.updateCFG = updateCFG;
module.exports.setUtils = setUtils;
module.exports.declareTS = declareTS;