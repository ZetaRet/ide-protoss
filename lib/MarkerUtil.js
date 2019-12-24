/**
 * Author: Zeta Ret
 * ProtoSS package MarkerUtil
 **/

var cfg, TokenUtil, cls = 'protoss-highlight-mark';

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
			mbor = cfg.styleGroupMark.markerBorderRadius;

		mbac.alpha = mbaa / 100;
		mboc.alpha = mboa / 100;
		cstring.push('background-color: ' + mbac);
		cstring.push('border: ' + '1px solid');
		cstring.push('border-color: ' + mboc);
		cstring.push('border-radius: ' + mbor + 'px');
	}
	dcss.innerHTML = '.' + cls + ' { ' + cstring.join(';') + ' }';
}

class MarkerUtil {

	static decorate(token) {
		var mark, z, tfb, ted = cfg.editor,
			at = cfg.activeTokens;

		try {
			if (!token) token = TokenUtil.computeCursorToken(at, ted.getCursorBufferPosition());

			if (token) tfb = [{
				row: token.row,
				column: token.start
			}, {
				row: token.row,
				column: token.end
			}];
			if (tfb) {
				mark = ted.markBufferRange(tfb);
				z = ted.decorateMarker(mark, {
					type: "highlight",
					class: cls
				});
			}
		} catch (err) {}

		return [z];
	}

}

module.exports.MarkerUtil = MarkerUtil;
module.exports.updateCFG = updateCFG;
module.exports.setUtils = setUtils;
module.exports.updateDynamicCSS = updateDynamicCSS;