/**
 * Author: Zeta Ret
 * ProtoSS package External Util
 **/

var path = require('path'),
	fs = require('fs');

var main = {
	cfg: {}
};
var packEl, jsonEl;

function updateCFG(cfg) {
	main.cfg = cfg;
}

function setElements(p, j) {
	packEl = p;
	jsonEl = j;
}

class ExternalUtil {
	static getProjectJSONPath() {
		return packEl.getAttribute('path');
	}
	static getSupername() {
		return jsonEl.getAttribute('supername');
	}
	static getDescriptorPath() {
		return jsonEl.getAttribute('path');
	}
	static getMDPath() {
		return jsonEl.getAttribute('mdpath');
	}
	static getCPath() {
		return jsonEl.getAttribute('cpath');
	}
	static getSupersPaths() {
		var sp = [];
		if (main.cfg.supersEl) {
			main.cfg.supersEl.forEach(function(el) {
				var p = el.getAttribute('path');
				if (p) sp.push(p);
			})
		}
		return sp;
	}
	static getProjectJSON() {
		return main.cfg.projson;
	}
	static getDescriptorJSON() {
		return main.cfg.descjson;
	}
	static getLines() {
		return main.cfg.editor ? main.cfg.editor.getLineCount() : null;
	}
	static getFilePath() {
		return main.cfg.editor ? main.cfg.editor.getPath() : null;
	}
	static getEditor() {
		return main.cfg.editor;
	}
	static getCFG() {
		return main.cfg;
	}
	static scanPath(regex, fnames, callback, cdata) {
		var stop, links = [],
			files = [],
			r = 0,
			l = fnames.length,
			ign = atom.config.get('core.ignoredNames');

		function scanned() {
			fnames = [];
			r = 0;
			l = links.length;
			links.forEach(function(el) {
				var f = el[0] + '\\' + el[1],
					fd = f.split('\\').join(path.sep);

				fs.stat(fd, function(err, stats) {
					if (stop) return;
					if (stats && stats.isFile() && regex.test(el[1])) files.push(el);
					else if (stats && stats.isDirectory()) fnames.push(f);
					r++;
					if (r === l) reset();
				});
			});
		}

		function reset() {
			links = [];
			l = fnames.length;
			r = 0;
			if (l > 0) {
				scan();
			} else {
				files.forEach(e => e[0] = e[0].split('\\').join(path.sep));
				callback(files, cdata);
			}
		}

		function scan() {
			fnames.forEach(function(el) {
				el = el.split('/').join('\\');
				var els = el.split('\\').join(path.sep);
				fs.readdir(els, null, function(err, files) {
					if (stop) return;
					files.forEach(function(f) {
						if (!ign || !ign.find(e => e === f)) links.push([el, f]);
					});
					r++;
					if (r === l) scanned();
				});
			});
		}
		scan();

		return () => stop = true;
	}
	static getProtoSSDoxInWorkspace(callback, cdata) {
		return ExternalUtil.scanPath(new RegExp(main.cfg.docjsonname), atom.project.getPaths(), callback, cdata);
	}
}

module.exports.updateCFG = updateCFG;
module.exports.setElements = setElements;
module.exports.ExternalUtil = ExternalUtil;