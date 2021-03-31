/**
 * Author: Zeta Ret
 * ProtoSS package TokenUtil
 **/

var path = require('path');

var cfg, gjs;
var updateTokens, updateLinesCount, pushNotification, groupDigits;
var tokensEl;

function updateCFG(c) {
	cfg = c;
}

function setGrammar(g) {
	gjs = g;
}

function setUtils(ut, ulc, pn, gd) {
	updateTokens = ut;
	updateLinesCount = ulc;
	pushNotification = pn;
	groupDigits = gd;
}

function setElements(t) {
	tokensEl = t;
}

function trimBufPos(tok) {
	var t0 = tok[0];
	return [t0.row, t0.start + t0.value.indexOf(t0.value.trim())]
}

class TokenUtil {
	static getActiveTokens() {
		return cfg.activeTokens;
	}

	static getGrammar() {
		return gjs;
	}

	static tokenizeLinesAsync(editor, handler) {
		var lines = editor.getLineCount(),
			lineText, lineTokens, ruleStack, tokens = [],
			i = 0,
			stime, etime, refreshTime = cfg.asyncOptions.tokenRefresh,
			processTime = cfg.asyncOptions.tokenProcess;

		cfg.emitter.emit('token_asyncStart', {
			line: 0,
			lines: lines
		});

		var iid = setInterval(function() {
			stime = (new Date()).getTime();
			for (i; i < lines; i++) {
				try {
					lineText = editor.lineTextForBufferRow(i);
					lineTokens = gjs.tokenizeLine(lineText, ruleStack, ruleStack ? false : true);
				} catch (e) {
					if (cfg.console === 'yes') console.log(e);
					break;
				}
				ruleStack = lineTokens.ruleStack;
				tokens.push(lineTokens.tokens);
				etime = (new Date()).getTime();
				if ((etime - stime) >= processTime) {
					i++;
					cfg.emitter.emit('token_asyncProcess', {
						line: i,
						lines: lines,
						tokens: tokens,
						ruleStack: ruleStack
					});
					if (i === lines) break
					else return;
				}
			}
			window.clearInterval(iid);
			delete cfg.asyncIteratorStop;
			cfg.emitter.emit('token_asyncEnd', {
				line: i,
				lines: lines,
				tokens: tokens
			});
			handler(tokens);
		}, refreshTime);

		cfg.asyncIteratorStop = function() {
			window.clearInterval(iid);
			delete cfg.asyncIteratorStop;
		};
	}

	static refreshTokensDefault(editor) {
		cfg.altered = false;
		cfg.activeTokens = gjs ? gjs.tokenizeLines(editor.getText()) : [];
		if (cfg.console === 'yes') {
			console.log('editor tokens: ');
			console.log(cfg.activeTokens);
		}
		var nt = TokenUtil.tokenCount();
		updateTokens(nt);
		updateLinesCount(editor);
		editor.element.dispatchEvent(new Event('tokenized'));
	}

	static refreshTokens(editor, asyncit, nonot) {
		if (cfg.asyncIteratorStop) cfg.asyncIteratorStop();
		if (!asyncit) TokenUtil.refreshTokensDefault(editor);
		else {
			TokenUtil.tokenizeLinesAsync(editor, function(tokens) {
				cfg.altered = false;
				cfg.activeTokens = tokens;
				if (cfg.console === 'yes') {
					console.log('editor tokens: ');
					console.log(cfg.activeTokens);
				}
				var nt = TokenUtil.tokenCount();
				updateTokens(nt);
				if (!nonot && cfg.notifications !== 'no') {
					pushNotification((cfg.groupdigits === 'yes' ? groupDigits(nt) : nt) +
						' tokens loaded in ' + editor.getPath().split(path.sep).join((path.sep === '\\' ? '\\' : '') + path.sep),
						"addInfo", "token-" + editor.getPath());
				}
				editor.element.dispatchEvent(new Event('tokenized'));
			});
			tokensEl.innerHTML = 'async tokens';
			tokensEl.className = 'protoss-hover';
			if (cfg.breadcrumbsOptions.icons === 'yes') {
				tokensEl.classList.add('icon');
				tokensEl.classList.add('icon-sync');
			}
			updateLinesCount(editor);
		}
	}

	static Alter() {
		cfg.altered = true;
		if (cfg.autotokentout) {
			window.clearTimeout(cfg.autotokentout);
			delete cfg.autotokentout;
		}
		if (cfg.autoUpdateOnChange !== 'disable') {
			var intz = parseFloat(cfg.autoUpdateOnChange) || 0;
			cfg.autotokentout = setTimeout(function() {
				if (cfg.altered)
					TokenUtil.refreshTokens(cfg.editor, true, true);
			}, intz * 1000);
		}
	}

	static tokenCount() {
		var nt = 0;
		cfg.activeTokens.forEach(function(tl) {
			nt += tl.length;
		});
		return nt;
	}

	static computeCursorToken(tokens, cp, withcursor) {
		var line = tokens[cp.row],
			l = line.length,
			column = cp.column,
			i, token, st, tv,
			cc = 0;
		if (cfg.console === 'yes') {
			console.log('cursor buffer position:');
			console.log(cp);
		}
		for (i = 0; i < l; i++) {
			token = line[i];
			tv = token.value;
			if (column >= cc && column < (cc + tv.length)) {
				st = token;
				st.start = cc;
				st.end = cc + tv.length;
				st.row = cp.row;
				if (withcursor) st.cursor = column - cc;
				break;
			}
			cc += tv.length;
		}
		return st;
	}

	static shiftClick() {
		if (cfg.altered) TokenUtil.altClick();
		var ct, cp, tl = cfg.editor.getTabLength();
		cfg.editor.setTabLength(1);
		try {
			while (!ct) {
				cp = cfg.editor.getCursorBufferPosition();
				ct = TokenUtil.computeCursorToken(cfg.activeTokens, cp);
				if (ct) {
					cfg.editor.setSelectedBufferRange([
						[ct.row, ct.end],
						[ct.row, ct.start]
					]);
					break;
				} else if (cp.row < cfg.editor.getLastBufferRow()) {
					cfg.editor.setCursorBufferPosition([cp.row + 1, 0]);
				} else {
					break;
				}
			}
		} catch (e) {
			if (cfg.console === 'yes') console.log(e);
			cfg.editor.setTabLength(tl);
		}
		cfg.editor.setTabLength(tl);
		if (cfg.console === 'yes') {
			console.log('selected cursor token:');
			console.log(ct);
		}
	}

	static ctrlClick() {
		if (cfg.altered) TokenUtil.altClick();
		var tl = cfg.editor.getTabLength();
		cfg.editor.setTabLength(1);
		try {
			var prev, lt, ct = TokenUtil.computeCursorToken(cfg.activeTokens, cfg.editor.getCursorBufferPosition());
			if (ct) {
				lt = {
					row: cfg.activeTokens.length,
					start: 0,
					end: 0,
					value: ct.value
				};
				prev = TokenUtil.findTokens(cfg.activeTokens, ct, 1, true);
				if (prev && prev.length > 0) cfg.editor.setCursorBufferPosition(trimBufPos(prev));
				else {
					prev = TokenUtil.findTokens(cfg.activeTokens, lt, 1, true);
					if (prev && prev.length > 0 && prev[0] !== ct) cfg.editor.setCursorBufferPosition(trimBufPos(prev));
				}
			}
		} catch (e) {
			if (cfg.console === 'yes') console.log(e);
			cfg.editor.setTabLength(tl);
		}
		cfg.editor.setTabLength(tl);
		if (cfg.console === 'yes') {
			console.log('cursor token:');
			console.log(ct);
			console.log('previous cursor token:');
			console.log(prev);
		}
	}

	static altClick() {
		TokenUtil.refreshTokens(cfg.editor);
	}

	static click() {
		if (cfg.altered) TokenUtil.altClick();
		var tl = cfg.editor.getTabLength();
		cfg.editor.setTabLength(1);
		try {
			var next, lt, ct = TokenUtil.computeCursorToken(cfg.activeTokens, cfg.editor.getCursorBufferPosition());
			if (ct) {
				lt = {
					row: -1,
					start: 0,
					end: 0,
					value: ct.value
				};
				next = TokenUtil.findTokens(cfg.activeTokens, ct, 1);
				if (next && next.length > 0) cfg.editor.setCursorBufferPosition(trimBufPos(next));
				else {
					next = TokenUtil.findTokens(cfg.activeTokens, lt, 1);
					if (next && next.length > 0 && next[0] !== ct) cfg.editor.setCursorBufferPosition(trimBufPos(next));
				}
			}
		} catch (e) {
			if (cfg.console === 'yes') console.log(e);
			cfg.editor.setTabLength(tl);
		}
		cfg.editor.setTabLength(tl);
		if (cfg.console === 'yes') {
			console.log('cursor token:');
			console.log(ct);
			console.log('next cursor token:');
			console.log(next);
		}
	}

	static findTokens(tokens, token, count, backwards) {
		if (!token) return null;
		var row = token.row,
			line = tokens[row],
			trimv = token.value.trim(),
			trimvl = trimv.toLowerCase(),
			trl = trimv.length,
			i = line ? line.indexOf(token) : -1,
			found = [],
			tv, st, cc;
		if (count < 0) count = 0;
		if (backwards) {
			if (i !== -1) {
				i--;
				cc = token.start;
				for (; i >= 0; i--) {
					st = line[i];
					tv = st.value;
					if (trl <= tv.length && (cfg.findTokenCaseSensitivity === 'yes' ? tv.trim() === trimv : tv.trim().toLowerCase() === trimvl)) {
						st.end = cc;
						st.start = cc - tv.length;
						st.row = row;
						found.push(st);
						if (count && found.length === count) break;
					}
					cc -= tv.length;
				}
			}
			row--;
			while (line = tokens[row]) {
				if (!count || found.length < count) {
					cc = 0;
					for (i = 0; i < line.length; i++) cc += line[i].value.length;
					for (i = line.length - 1; i >= 0; i--) {
						st = line[i];
						tv = st.value;
						if (trl <= tv.length && (cfg.findTokenCaseSensitivity === 'yes' ? tv.trim() === trimv : tv.trim().toLowerCase() === trimvl)) {
							st.end = cc;
							st.start = cc - tv.length;
							st.row = row;
							found.push(st);
							if (count && found.length === count) break;
						}
						cc -= tv.length;
					}
				} else {
					break;
				}
				row--;
			}
		} else {
			if (i !== -1) {
				cc = token.end;
				i++;
				for (; i < line.length; i++) {
					st = line[i];
					tv = st.value;
					if (trl <= tv.length && (cfg.findTokenCaseSensitivity === 'yes' ? tv.trim() === trimv : tv.trim().toLowerCase() === trimvl)) {
						st.start = cc;
						st.end = cc + tv.length;
						st.row = row;
						found.push(st);
						if (count && found.length === count) break;
					}
					cc += tv.length;
				}
			}
			row++;
			while (line = tokens[row]) {
				if (!count || found.length < count) {
					cc = 0;
					for (i = 0; i < line.length; i++) {
						st = line[i];
						tv = st.value;
						if (trl <= tv.length && (cfg.findTokenCaseSensitivity === 'yes' ? tv.trim() === trimv : tv.trim().toLowerCase() === trimvl)) {
							st.start = cc;
							st.end = cc + tv.length;
							st.row = row;
							found.push(st);
							if (count && found.length === count) break;
						}
						cc += tv.length;
					}
				} else {
					break;
				}
				row++;
			}
		}

		return found;
	}
}

module.exports.updateCFG = updateCFG;
module.exports.setGrammar = setGrammar;
module.exports.setUtils = setUtils;
module.exports.setElements = setElements;
module.exports.TokenUtil = TokenUtil;