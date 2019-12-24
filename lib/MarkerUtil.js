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
	dcss.innerHTML = '.' + cls + ' .region { ' + cstring.join(';') + ' }';
}

class MarkerUtil {

	static decorate(token, buffer) {
		var mark, z, tv, tfb, ted = cfg.editor,
			at = cfg.activeTokens;

		if (!ted || !at || at.length === 0) return [];

		try {
			if (!token) token = TokenUtil.computeCursorToken(at, buffer || ted.getCursorBufferPosition());
			if (cfg.console === 'yes') console.log('Mark token: ', token);
			if (token) {
				if (cfg.styleGroupMark.trimMarkers) {
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