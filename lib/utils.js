/**
 * Author: Zeta Ret
 * ProtoSS package utils
 **/

var main = {
	cfg: {}
};
var defDescriptor = {
	author: "",
	description: "",
	text: "",
	requires: "",
	version: "",
	date: "",
	supername: "",
	inherits: [],
	interfaces: [],
	static: {
		public_properties: {},
		protected_properties: {},
		private_properties: {},
		public_methods: {},
		protected_methods: {},
		private_methods: {}
	},
	public_properties: {},
	protected_properties: {},
	private_properties: {},
	public_methods: {},
	protected_methods: {},
	private_methods: {},
	static_descriptions: {},
	descriptions: {},
	static_examples: {},
	examples: {}
};
var defDescX = {
	name: "",
	license: "",
	nohierarchy: false,
	static_label: "",
	imports: []
};
var defProtodox = {
	name: "",
	type: "protossdox",
	path: "",
	src: "",
	namespace: "",
	relative: true,
	markdown: true
};
var defProtoX = {
	ext: ["js", "html", "css"],
	bind: false
};
var notCounter = {};

function updateCFG(cfg) {
	main.cfg = cfg;
}

function parsePropertyType(str) {
	var r = {
		str: str
	};
	try {
		r.spl = str.split(':');
		r.prop = r.spl[0].split(']')[0].split('[').join('').trim();
	} catch (e) {
		r.spl = [];
		r.prop = "";
	}
	r.val = r.spl.length > 1 ? r.spl[1] : null;
	r.text = r.prop;
	if (r.val !== null) r.text += ": " + r.val;
	return r;
}

function parseReturnType(str) {
	var r = {
		str: str
	};
	try {
		r.prop = str.split(']')[0].split('[').join('').trim();
	} catch (e) {
		r.prop = "";
	}
	r.text = r.prop;
	return r;
}

function parseArgumentsTypes(str) {
	var r = {
		str: str
	};
	try {
		r.spl = str.split(',');
	} catch (e) {
		r.spl = [];
	}
	r.spl.forEach(function(el, i) {
		r.spl[i] = parseReturnType(el).text;
	});
	r.text = r.spl.join(', ');
	return r;
}

function groupDigits(gd) {
	return gd.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatBytes(bytes) {
	var i, sizes = ['Bytes', 'KB', 'MB'];
	if (bytes < 1024) i = 0;
	else if (bytes < Math.pow(1024, 2)) i = 1;
	else i = 2;
	return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
}

function selectGrammar(g) {
	return main.cfg.grammarId === 'Auto' ? g.name === (main.cfg.editor ? main.cfg.editor.getGrammar().name : 'JavaScript') : g.name === main.cfg.grammarId;
}

function selectNullGrammar(g) {
	return g.name === "Null Grammar";
}

function pushNotification(text, type, id, time, notifycfg) {
	var push = false;
	if (id) {
		if (!notCounter[id]) notCounter[id] = 1;
		else notCounter[id]++;
	}
	if (main.cfg.notifications === 'yes' || (main.cfg.notifications === 'once' && id && notCounter[id] === 1)) {
		push = true;
	}
	if (push) {
		if (time) setTimeout(() => atom.notifications[type](text, notifycfg), time);
		else atom.notifications[type](text, notifycfg);
	}
}

function getFileExt() {
	var p, f, ps, e = main.cfg.editor;
	if (e) {
		p = e.getPath().split('/').join('\\');
	}
	if (p) {
		ps = p.split('\\');
		f = ps.pop();
	}
	ps = f ? f.split('.') : [];
	return ps.length > 1 ? ps.pop() : '';
}

module.exports.defDescriptor = defDescriptor;
module.exports.defDescX = defDescX;
module.exports.defProtodox = defProtodox;
module.exports.defProtoX = defProtoX;
module.exports.updateCFG = updateCFG;
module.exports.parsePropertyType = parsePropertyType;
module.exports.parseReturnType = parseReturnType;
module.exports.parseArgumentsTypes = parseArgumentsTypes;
module.exports.groupDigits = groupDigits;
module.exports.formatBytes = formatBytes;
module.exports.selectGrammar = selectGrammar;
module.exports.selectNullGrammar = selectNullGrammar;
module.exports.pushNotification = pushNotification;
module.exports.getFileExt = getFileExt;