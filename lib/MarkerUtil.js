/**
 * Author: Zeta Ret
 * ProtoSS package MarkerUtil
 **/

var cfg, TokenUtil, cls = 'protoss-highlight-mark';

const properties = {
	type: "highlight",
	class: cls
};

const skipChars = "[](){}<>+-*/=.,?!@#$%^&_:;|~`'\"\\";

function updateCFG(xcfg) {
	cfg = xcfg;
}

function setUtils(_TokenUtil) {
	TokenUtil = _TokenUtil;
}

function updateDynamicCSS(dcss) {
	var cstring = [];
	if (cfg.styleGroupMark.markerAllow === 'yes') {
		var mbaa = cfg.styleGroupMark.markerBackAlpha,
			mbac = cfg.styleGroupMark.markerBackColor,
			mboa = cfg.styleGroupMark.markerBorderAlpha,
			mboc = cfg.styleGroupMark.markerBorderColor,
			mbor = cfg.styleGroupMark.markerBorderRadius,
			mbt = cfg.styleGroupMark.markerBorderType;

		mbac.alpha = mbaa / 100;
		mboc.alpha = mboa / 100;
		cstring.push('background-color: ' + mbac);
		cstring.push('border: 1px ' + mbt);
		cstring.push('border-color: ' + mboc);
		cstring.push('border-radius: ' + mbor + 'px');
		dcss.innerHTML = '.' + cls + ' .region {' + cstring.join(';') + ';}';
	} else dcss.innerHTML = '';
}

class MarkerUtil {

	static pushMarker(markers, token, ted, properties) {
		var mark, z, tfb, tv;

		if (token) {
			if (cfg.styleGroupMark.trimMarkers === 'yes') {
				tv = token.value.trim();
				if (tv) {
					tfb = [{
						row: token.row,
						column: token.start + token.value.indexOf(tv)
					}];
					tfb.push({
						row: token.row,
						column: tfb[0].column + tv.length
					});
				}
			} else {
				tfb = [{
					row: token.row,
					column: token.start
				}, {
					row: token.row,
					column: token.end
				}];
			}
		}
		if (tfb) {
			mark = ted.markBufferRange(tfb);
			z = ted.decorateMarker(mark, properties);
			markers.push(z);
		}
	}

	static checkToken(token) {
		var tv, res = true;
		if (token) {
			tv = token.value.trim();
			if (cfg.styleGroupMark.trimMarkers === 'yes' && !tv) res = false;
			else if (cfg.styleGroupMark.markerFindSkip === 'yes' && tv.length === 1 && skipChars.indexOf(tv) >= 0) res = false;
		} else res = false;
		return res;
	}

	static decorate(token, buffer, decProps, nofind) {
		var ft, ted = cfg.editor,
			at = cfg.activeTokens,
			markers = [];

		if (!ted || !at || at.length === 0) return [];

		try {
			if (!token) token = TokenUtil.computeCursorToken(at, buffer || ted.getCursorBufferPosition());
			if (cfg.console === 'yes') console.log('Mark token: ', token);
			MarkerUtil.pushMarker(markers, token, ted, decProps || properties);
			if (!nofind && MarkerUtil.checkToken(token) && cfg.styleGroupMark.markerFind === 'yes') {
				ft = TokenUtil.findTokens(at, token, cfg.styleGroupMark.markerRange);
				if (ft) ft.forEach(t => MarkerUtil.pushMarker(markers, t, ted, decProps || properties));
				ft = TokenUtil.findTokens(at, token, cfg.styleGroupMark.markerRange, true);
				if (ft) ft.forEach(t => MarkerUtil.pushMarker(markers, t, ted, decProps || properties));
			}
		} catch (err) {
			if (cfg.console === 'yes') console.log('Mark error: ', err);
		}

		return markers;
	}

	static filterMarkers(filterProps, ted) {
		var markers = [];
		if (!ted) ted = cfg.editor;
		if (!ted) return null;
		ted.getDecorations().forEach(d => {
			var f, p = d.properties,
				match = true;
			if (filterProps) {
				for (f in filterProps) {
					if (p[f] !== filterProps[f]) {
						match = false;
						break;
					}
				}
			}
			if (match) markers.push(d.marker);
		});
		return markers;
	}

	static getMarkerRanges(markers) {
		return (markers || cfg.editor.getMarkers()).map(m => m.getBufferRange());
	}

}

module.exports.MarkerUtil = MarkerUtil;
module.exports.updateCFG = updateCFG;
module.exports.setUtils = setUtils;
module.exports.updateDynamicCSS = updateDynamicCSS;