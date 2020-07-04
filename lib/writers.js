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
	'Array': 'Array<object>'
};

function declareTS(desc, joiner, tab) {
	var dts = [],
		propsts = [],
		methodsts = [],
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
	if (!tab) tab = '';
	cls = snspl.pop();
	if (snspl.length > 0) ns = snspl[0];
	if (ns) dts.push('declare namespace ' + ns + ' {');
	else tabrep--;
	dts.push(tab.repeat(tabrep) + 'export interface ' + cls + ' {');
	props.forEach(e => {
		var k, p;
		for (k in e) {
			p = utils.parsePropertyType(e[k]);
			propsts.push(tab.repeat(tabrep + 1) + k + ': ' + p.map.map(pt => TSConvert[pt] || pt).join('|') + ';');
		}
	});
	methods.forEach(e => {
		var k, m, arg, ret;
		for (k in e) {
			m = utils.convertMethodTypes(k, e[k]);
			arg = m.args.map.map(a => (a[0].endsWith('*') ? a[0].substring(0, a[0].length - 1) : a[0] + '?') + ': ' + a[1].map(t => TSConvert[t] || t).join('|')).join(', ');
			ret = m.ret.map.map(r => TSConvert[r] || r.replace('::', '.')).join('|');
			if (k === cls) newsts.push(tab.repeat(tabrep + 1) + 'new(' + arg + '): ' + cls);
			else methodsts.push(tab.repeat(tabrep + 1) + k + '(' + arg + '): ' + (ret || 'void'));
		}
	});
	dts = dts.concat(propsts, newsts, methodsts);
	dts.push(tab.repeat(tabrep) + '}');
	if (ns) dts.push('}');
	return joiner ? dts.join(joiner) : dts;
}

module.exports.updateCFG = updateCFG;
module.exports.setUtils = setUtils;
module.exports.declareTS = declareTS;