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
	bind: false,
	version: "1.0.0",
	license: "COPYRIGHT"
};
var notCounter = {};

function updateCFG(cfg) {
	main.cfg = cfg;
}

function getPipesWithoutMD(mdv) {
	var pipes = mdv.split('|');
	return pipes.map(p => {
		var prop;
		try {
			prop = p.split(']')[0].split('[');
			if (prop[1]) prop = prop[1].trim();
			else prop = prop[0].trim();
		} catch (e) {
			if (main.cfg.console === 'yes') console.log(e);
			prop = "";
		}
		return prop;
	}).join('|');
}

function parsePropertyType(str) {
	var r = {
		str: str
	};
	try {
		r.spl = str.split(':');
		r.prop = getPipesWithoutMD(r.spl[0]);
	} catch (e) {
		if (main.cfg.console === 'yes') console.log(e);
		r.spl = [];
		r.prop = "";
	}
	r.map = r.prop.split('|');
	r.val = r.spl.length > 1 ? r.spl[1] : null;
	r.text = r.prop;
	if (r.val !== null) r.text += ": " + r.val;
	return r;
}

function parseReturnType(str) {
	var r = {
		str: str
	};
	r.prop = getPipesWithoutMD(str);
	r.map = r.prop.split('|');
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
		if (main.cfg.console === 'yes') console.log(e);
		r.spl = [];
	}
	r.map = [];
	r.spl.forEach((el, i) => {
		if (el.trim()) {
			var mod = el.split(':');
			try {
				r.spl[i] = mod[0].trim() + ': ' + parseReturnType(mod[1]).text;
			} catch (err) {
				if (main.cfg.console === 'yes') console.log(err);
				r.spl[i] = '';
			}
		} else r.spl[i] = '';
		var k, t, at, et, e = r.spl[i];
		if (e) {
			et = e.split(':');
			k = et[0] || '';
			t = et[1];
			if (t) t = t.trim();
			at = (t || '').split('|');
		}
		if (k) r.map.push([k, at]);
	});
	r.text = r.spl.join(', ');
	return r;
}

function convertMethodTypes(k, v) {
	var cmt = {},
		dspl = v.split(';'),
		ret = dspl[1] ? dspl[1].trim() : '';
	if (ret.indexOf('return ') === 0) ret = ret.substr(7);
	cmt.name = k;
	cmt.args = parseArgumentsTypes(dspl[0]);
	cmt.ret = parseReturnType(ret);
	cmt.argstext = cmt.args.text;
	cmt.rettext = cmt.ret.text || 'void';
	return cmt;
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

function getFileExt(editor) {
	var p, f, ps, e = editor || main.cfg.editor;
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

function convertHTMLTypes(t) {
	return t.split('<').join('&lt;').split('>').join('&gt;');
}

module.exports.defDescriptor = defDescriptor;
module.exports.defDescX = defDescX;
module.exports.defProtodox = defProtodox;
module.exports.defProtoX = defProtoX;
module.exports.updateCFG = updateCFG;
module.exports.parsePropertyType = parsePropertyType;
module.exports.parseReturnType = parseReturnType;
module.exports.parseArgumentsTypes = parseArgumentsTypes;
module.exports.convertMethodTypes = convertMethodTypes;
module.exports.groupDigits = groupDigits;
module.exports.formatBytes = formatBytes;
module.exports.selectGrammar = selectGrammar;
module.exports.selectNullGrammar = selectNullGrammar;
module.exports.pushNotification = pushNotification;
module.exports.getFileExt = getFileExt;
module.exports.convertHTMLTypes = convertHTMLTypes;