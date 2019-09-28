/**
 * Author: Zeta Ret
 * ProtoSS package autocomplete providers
 **/

var fs = require('fs'),
	path = require('path');

var main = {
	cfg: {}
};

class FileProvider {
	constructor() {
		this.selector = '*';
		this.suggestionPriority = 20;
	}

	getSuggestions(options) {
		if (main.cfg.autoComplete === 'no') return [];
		var prefix = this.getPrefix(options.prefix, options.editor, options.bufferPosition);
		return this.findMatchingSuggestions(prefix, options);
	}

	getPrefix(prefix, editor, bufferPosition) {
		var line = editor.getTextInRange([
			[bufferPosition.row, 0], bufferPosition
		]);
		var spl = line.split(/\'|\"|\`|\(|\s/),
			l = spl.pop();
		return l || prefix;
	}

	findMatchingSuggestions(prefix, options) {
		var p = options.editor.getPath().split(path.sep);
		p.pop();
		var f, isDir, pp = path.resolve(p.join(path.sep), prefix);
		try {
			isDir = fs.statSync(pp).isDirectory();
			if (isDir) pp += path.sep;
		} catch (e) {}

		var ld = pp.split(path.sep),
			ldp = ld[ld.length - 1] ? ld.pop().toLowerCase() : "",
			sc = ld.join(path.sep);
		try {
			f = fs.readdirSync(sc);
		} catch (e) {
			f = [];
		}
		var sugg = f;

		var words = !ldp ? sugg : sugg.filter((s) => s.toLowerCase().startsWith(ldp)),
			msugg = words.map((w) => {
				return {
					text: w,
					description: "Located in folder " + sc,
					rightLabelHTML: "File/Folder/Module",
					leftLabelHTML: "ProtoSS",
					type: "module"
				}
			});
		return msugg;
	}
}

class BasicProvider {
	constructor() {
		this.selector = '*';
		this.suggestionPriority = 21;
	}

	getSuggestions(options) {
		if (main.cfg.autoComplete === 'no') return [];
		return this.findMatchingSuggestions(options.prefix);
	}

	findMatchingSuggestions(prefix) {
		var sugg = ['cheese'];
		var words = sugg.filter((s) => s.startsWith(prefix)),
			msugg = words.map((w) => {
				return {
					text: w,
					description: "Insert cheese until we implement it all.",
					rightLabelHTML: "Property",
					leftLabelHTML: "ProtoSS",
					type: "p"
				}
			});
		return msugg;
	}
}

class AsyncProvider {
	constructor() {
		this.selector = '*';
		this.suggestionPriority = 22;
	}

	getSuggestions(options) {
		if (main.cfg.autoComplete === 'no') return [];
		return this.findMatchingSuggestions(options.prefix);
	}

	findMatchingSuggestions(prefix) {
		var sugg = [];
		return sugg;
	}
}

function updateCFG(cfg) {
	main.cfg = cfg;
}

module.exports.updateCFG = updateCFG;
module.exports.file = new FileProvider();
module.exports.basic = new BasicProvider();
module.exports.async = new AsyncProvider();