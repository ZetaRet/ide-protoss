/**
 * Author: Zeta Ret
 * ProtoSS package ProtoSSUtil
 **/

var fs = require('fs'),
	path = require('path'),
	electron = require('electron');

var cfg, utils, readers, TokenUtil;

var packEl, jsonEl;

function updateCFG(_cfg) {
	cfg = _cfg;
}

function setUtils(_utils, _readers, _TokenUtil) {
	utils = _utils;
	readers = _readers;
	TokenUtil = _TokenUtil;
}

function setElements(_packEl, _jsonEl) {
	packEl = _packEl;
	jsonEl = _jsonEl;
}

class ProtoSSUtil {
	static projson() {
		var p = packEl.getAttribute('path'),
			prPaths, found = 0,
			paths;
		if (p) {
			atom.open({
				pathsToOpen: [p.split('\\').join(path.sep)],
				newWindow: false
			});
		} else {
			prPaths = atom.project.getPaths();
			p = (atom.workspace.getActiveTextEditor().getPath() || "").split('/').join('\\');
			paths = [];
			if (p) {
				prPaths.forEach(function(el) {
					el = el.split('/').join('\\');
					if (p.indexOf(el) === 0) found++;
					var sel = el.split('\\');
					sel.reverse();
					paths.push(sel.join('\\'));
				});
			}
			if (found) {
				atom.confirm({
					message: 'Create ProtoSS Documentation JSON of this Project',
					detail: 'Select path to create ' + cfg.docjsonname + ' of this Project. Paths appear reversed.',
					buttons: ['Cancel'].concat(paths)
				}, response => {
					if (response !== 0) {
						var jp = prPaths[response - 1].split('/').join('\\') + '\\' + cfg.docjsonname;
						packEl.setAttribute('path', jp);
						ProtoSSUtil.createProtoSSDox(jp);
					}
				});
			} else {
				atom.confirm({
					message: 'This file is not part of the Project structure',
					detail: 'Try creating new Project in IDE, or open the file in its Project space.',
					buttons: ['Cancel']
				}, response => {});
			}

		}
	}

	static createProtoSSDox(jp) {
		atom.workspace.open(jp.split('\\').join(path.sep)).then(function(editor) {
			if (editor.getText().length === 0) {
				var k, px = {};
				for (k in utils.defProtodox) px[k] = utils.defProtodox[k];
				if (cfg.xdescript === 'yes') {
					for (k in utils.defProtoX) px[k] = utils.defProtoX[k];
				}
				editor.setText(JSON.stringify(px));
				editor.setCursorBufferPosition([0, 9]);
			}
		});
	}

	static jsonmd(md) {
		var p = jsonEl.getAttribute('path'),
			sn = jsonEl.getAttribute('supername'),
			mp = jsonEl.getAttribute('mdpath');
		if (md && mp) {
			atom.workspace.open(mp.split('\\').join(path.sep));
		} else if (p) {
			atom.workspace.open(p.split('\\').join(path.sep)).then(function(editor) {
				var t = editor.getText();
				if (!t) {
					var k, jdesc = {};
					for (k in utils.defDescriptor) jdesc[k] = utils.defDescriptor[k];
					if (cfg.xdescript === 'yes') {
						for (k in utils.defDescX) jdesc[k] = utils.defDescX[k];
					}
					jdesc['supername'] = sn;
					editor.setText(JSON.stringify(jdesc));
				}
			});
		}
	}

	static openSupers() {
		if (cfg.supersEl) {
			cfg.supersEl.forEach(function(el) {
				var p = el.getAttribute('path');
				if (p) atom.workspace.open(p.split('\\').join(path.sep));
			})
		}
	}

	static sunderFile(rp) {
		var fses = fs.existsSync(rp),
			ftp = rp.split(path.sep),
			file = ftp[ftp.length - 1],
			filedot = (file || '').split('.'),
			ext = filedot.length > 1 ? filedot[filedot.length - 1] : '';
		return [fses, ftp, file, ext, filedot];
	}

	static openFile(rp, options, dirs, anyExt) {
		var fses, ftp, file, ext, res = false;
		[fses, ftp, file, ext] = ProtoSSUtil.sunderFile(rp);

		if (!fses && anyExt && !ext) {
			if (file) {
				ftp.pop();
				var tfile, tfold = ftp.join(path.sep),
					tfiles = fs.readdirSync(tfold),
					eext = utils.getFileExt(),
					projson = cfg.projson;
				if (tfiles.indexOf(file + '.' + eext) !== -1) {
					tfile = file + '.' + eext;
				} else if (projson && projson.ext) {
					eext = projson.ext.find(e => tfiles.indexOf(file + '.' + e) !== -1);
					if (eext) tfile = file + '.' + eext;
				}
				if (!tfile) {
					tfile = tfiles.find(e => {
						var edot = e.split('.'),
							ext = edot.length > 1 ? edot.pop() : '';
						if (ext && (file + '.' + ext) === e) return true;
					});
				}
				if (tfile) {
					fses = true;
					rp = ftp.join(path.sep) + path.sep + tfile;
					if (cfg.console === 'yes') console.log(rp);
				}
			}
		}
		if (fses) {
			var s = fs.statSync(rp);
			if (options.shell) {
				if (s.isFile() || dirs) {
					electron.shell.showItemInFolder(rp);
					res = true;
				}
			} else if (s.isFile()) {
				atom.workspace.open(rp);
				res = true;
			}
		}
		return res;
	}

	static resolve(options) {
		if (cfg.altered) TokenUtil.altClick();
		if (!options) options = {};
		try {
			var ct = TokenUtil.computeCursorToken(cfg.activeTokens, cfg.editor.getCursorBufferPosition(), true);
			if (cfg.console === 'yes') {
				console.log('resolve token:');
				console.log(ct);
			}
			var p = cfg.editor.getPath(),
				fext = utils.getFileExt(),
				ptr = p.split('/').join('\\');
			if (ct) {
				var rp, f, res, v = ct.value,
					vtrim = v.trim();
				if (vtrim.length === 0) return false;
				var cv, c, ctspl = ct.value.split(new RegExp('\\s'));
				c = 0;
				cv = ctspl.find(e => {
					if (ct.cursor >= c && ct.cursor < (c + e.length)) return true;
					c += e.length + 1;
				});
				if (cv.startsWith('https://') || cv.startsWith('http://')) {
					if (options.shell) electron.shell.openExternal(cv);
					else window.open(cv);
					return true;
				}
				try {
					f = (p || "").split(path.sep);
					f.pop();
					f = f.join(path.sep);
					rp = path.resolve(f, v);
					res = ProtoSSUtil.openFile(rp, options, true, cfg.useMultiviews === 'yes');
					if (!res && cfg.useMultiviews === 'yes') {
						rp = path.resolve(f, v + '/index');
						res = ProtoSSUtil.openFile(rp, options, true, true);
					}
				} catch (err) {
					if (cfg.console === 'yes') console.log(err);
				}
				if (!res) {
					try {
						ctspl = ct.value.split(new RegExp('\\s|,|;|=|\\|'));
						c = 0;
						cv = ctspl.find(e => {
							if (ct.cursor >= c && ct.cursor < (c + e.length)) return true;
							c += e.length + 1;
						});
						v = cv;
						if (!v) v = ct.value;
						else if (v.charAt(v.length - 1) === ':') v = v.substr(0, v.length - 1);

						f = readers.getResolvedPathNameProject(v, fext, false, ptr, null, null, true);
						if (!f[0] && fext === 'json') f = readers.getResolvedPathNameProject(v, fext, true, ptr, null, null, true);
						if (f[0]) {
							rp = f[1].split('\\').join(path.sep);
							if (p !== rp) res = ProtoSSUtil.openFile(rp, options);
						}

						if (!res) {
							f = readers.getResolvedPathNameProject(v, true, false, ptr, null, null, true);
							if (f[0]) {
								rp = f[1].split('\\').join(path.sep);
								if (p !== rp) res = ProtoSSUtil.openFile(rp, options);
							}
						}
						if (!res) {
							f = readers.getResolvedPathNameProject(v, '', false, ptr, null, null, true);
							if (f[0]) {
								rp = f[1].split('\\').join(path.sep);
								res = ProtoSSUtil.openFile(rp, options, true);
							}
						}
					} catch (err) {
						if (cfg.console === 'yes') console.log(err);
					}
				}
				return res;
			}
		} catch (err) {
			if (cfg.console === 'yes') console.log(err);
		}

		return false;
	}

	static projectSpace() {
		var noap, ap, ps, cpj = cfg.projson,
			capj = cfg.atomprojsons,
			namesp = cpj ? cpj.namespace : '',
			version = cpj ? cpj.version : '',
			license = cpj ? cpj.license : '';

		ps = {
			namesp, version, license, cpj, capj
		};
		if (capj && capj.length > 0) {
			ap = [];
			noap = [];
			capj.forEach(e => {
				var e0 = e[0],
					ens = e0.namespace;
				return e0.bind !== false ? (ens ? ap : noap).push(e0.name + (ens ? ': ' + ens : '')) : null;
			});
			ps.ap = ap;
			ps.noap = noap;
		}

		return ps;
	}
}

module.exports.updateCFG = updateCFG;
module.exports.setUtils = setUtils;
module.exports.setElements = setElements;
module.exports.ProtoSSUtil = ProtoSSUtil;