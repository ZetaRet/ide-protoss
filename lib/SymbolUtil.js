/**
 * Author: Zeta Ret
 * ProtoSS package SymbolUtil
 **/

var cfg, extScope = "js",
	defaultScopes = [
		'storage.type.var', 'storage.type.const', 'storage.type.class', 'storage.type.function',
		'entity.name.type.class', 'entity.name.function', 'entity.other.attribute-name.class', 'entity.name.function.constructor'
	];

function setExtScope(ext) {
	extScope = ext;
}

function updateCFG(c) {
	cfg = c;
}

class SymbolUtil {
	static extractSymbolsFromTokens(tokens, scopes) {
		if (!scopes) scopes = defaultScopes;
		var symbols = [],
			extscopes = scopes.map(e => e + "." + extScope);

		tokens.forEach((e, i) => {
			var chl = 0;
			e.forEach(ee => {
				var s = ee.scopes.find(eee => extscopes.indexOf(eee) !== -1);
				if (s) {
					symbols.push([ee, s, i, chl]);
					if (cfg.console === 'yes') console.log('Symbol:', ee.value, s, i, chl);
				}
				chl += ee.value.length;
			});
		});

		return symbols;
	}

	static loadGrammarBuffer(editor) {
		if (!editor) editor = atom.workspace.getActiveTextEditor();
		const grammarRegistry = atom.workspace.grammarRegistry;
		const grammar = grammarRegistry.treeSitterGrammarsById["source." + extScope];
		var buf, lan, res;
		if (editor && grammar) {
			buf = editor.buffer;
			lan = grammarRegistry.languageModeForGrammarAndBuffer(grammar, buf);
			try {
				res = lan.tree.rootNode;
			} catch (err) {}
		}
		return res;
	}
}

module.exports.defaultScopes = defaultScopes;
module.exports.setExtScope = setExtScope;
module.exports.updateCFG = updateCFG;
module.exports.SymbolUtil = SymbolUtil;