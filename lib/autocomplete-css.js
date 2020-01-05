/**
 * Author: Zeta Ret
 * ProtoSS package autocomplete CSS
 **/

var words = ['auto', 'none',
	'-webkit-line-clamp', ':active', 'additive-symbols', '::after', 'align-content', 'align-items', 'align-self', 'all',
	'animation', 'animation-delay', 'animation-direction', 'animation-duration', 'animation-fill-mode', 'animation-iteration-count', 'animation-name',
	'animation-play-state', 'animation-timing-function',
	'annotation()', 'attr()', '::backdrop', 'backface-visibility',
	'background', 'background-attachment',
	'background-blend-mode', 'background-clip', 'background-color', 'background-image', 'background-origin', 'background-position', 'background-repeat', 'background-size',
	'::before', 'block-size', 'blur()',
	'border', 'border-block', 'border-block-color', 'border-block-end', 'border-block-end-color',
	'border-block-end-style', 'border-block-end-width', 'border-block-start', 'border-block-start-color', 'border-block-start-style', 'border-block-start-width',
	'border-block-style', 'border-block-width', 'border-bottom', 'border-bottom-color', 'border-bottom-left-radius', 'border-bottom-right-radius',
	'border-bottom-style', 'border-bottom-width', 'border-collapse', 'border-color', 'border-end-end-radius', 'border-end-start-radius',
	'border-image', 'border-image-outset', 'border-image-repeat', 'border-image-slice', 'border-image-source', 'border-image-width',
	'border-inline', 'border-inline-color', 'border-inline-end', 'border-inline-end-color', 'border-inline-end-style', 'border-inline-end-width',
	'border-inline-start', 'border-inline-start-color', 'border-inline-start-style', 'border-inline-start-width', 'border-inline-style', 'border-inline-width',
	'border-left', 'border-left-color', 'border-left-style', 'border-left-width', 'border-radius',
	'border-right', 'border-right-color', 'border-right-style', 'border-right-width',
	'border-spacing', 'border-start-end-radius', 'border-start-start-radius', 'border-style',
	'border-top', 'border-top-color', 'border-top-left-radius',
	'border-top-right-radius', 'border-top-style', 'border-top-width', 'border-width',
	'bottom', '@bottom-center', 'box-decoration-break', 'box-shadow', 'box-sizing', 'break-after',
	'break-before', 'break-inside', 'brightness()',
	'calc()', 'caption-side', 'caret-color', 'ch', 'character-variant()', '@charset', ':checked', 'circle()',
	'clamp()', 'clear', 'clip', 'clip-path', 'cm', 'color', 'color-adjust', 'column-count', 'column-fill', 'column-gap', 'column-rule', 'column-rule-color',
	'column-rule-style', 'column-rule-width', 'column-span', 'column-width', 'columns', 'conic-gradient()', 'content', 'contrast()',
	'counter-increment', 'counter-reset', 'counter-set', '@counter-style', 'counters()',
	'cross-fade()', 'cubic-bezier()', '::cue', 'cursor',
	':default', 'deg', ':dir', 'direction',
	':disabled', 'display', 'dpcm', 'dpi', 'dppx', 'drop-shadow()',
	'element()', 'ellipse()', 'em', ':empty', 'empty-cells', ':enabled', 'env()', 'ex',
	'fallback', 'filter', ':first', ':first-child', '::first-letter', '::first-line', ':first-of-type', 'fit-content()', 'flex', 'flex-basis', 'flex-direction', 'flex-flow',
	'flex-grow', 'flex-shrink', 'flex-wrap', 'float', ':focus', 'font', '@font-face', 'font-family', 'font-feature-settings',
	'@font-feature-values', 'font-kerning', 'font-language-override', 'font-optical-sizing', 'font-size', 'font-size-adjust',
	'font-stretch', 'font-style', 'font-synthesis', 'font-variant', 'font-variant-alternates',
	'font-variant-caps', 'font-variant-east-asian', 'font-variant-ligatures', 'font-variant-numeric', 'font-variant-position', 'font-variation-settings',
	'font-weight', 'format()', 'fr', ':fullscreen',
	'gap', 'grad', 'grayscale()', 'grid', 'grid-area',
	'grid-auto-columns', 'grid-auto-flow', 'grid-auto-rows', 'grid-column', 'grid-column-end', 'grid-column-start', 'grid-row', 'grid-row-end', 'grid-row-start', 'grid-template',
	'grid-template-areas', 'grid-template-columns', 'grid-template-rows', 'Hz', 'hanging-punctuation', 'height', '@historical-forms', ':hover', 'hsl()',
	'hsla()', 'hue-rotate()', 'hyphens', 'image()', 'image-orientation', 'image-rendering', 'image-set()', '@import', 'in', ':in-range', ':indeterminate',
	'inherit', 'initial', 'inline-size', 'inset', 'inset-block', 'inset-block-end', 'inset-block-start', 'inset-inline', 'inset-inline-end', 'inset-inline-start',
	':invalid', 'invert()', 'isolation', 'justify-content', 'justify-items', 'justify-self', 'kHz', '@keyframes', ':lang', ':last-child', ':last-of-type', 'leader()',
	':left', 'left', '@left-bottom', 'letter-spacing', 'line-break', 'line-height', 'linear-gradient()', ':link', 'list-style', 'list-style-image',
	'list-style-position', 'list-style-type', 'local()',
	'margin', 'margin-block', 'margin-block-end', 'margin-block-start', 'margin-bottom', 'margin-inline', 'margin-inline-end',
	'margin-inline-start', 'margin-left', 'margin-right', 'margin-top', '::marker',
	'mask', 'mask-clip', 'mask-composite', 'mask-image', 'mask-mode', 'mask-origin', 'mask-position', 'mask-repeat', 'mask-size', 'mask-type',
	'matrix()', 'matrix3d()', 'max()', 'max-height', 'max-width', 'max-zoom',
	'@media', 'min()', 'min-block-size', 'min-height', 'min-inline-size', 'min-width', 'min-zoom', 'minmax()',
	'mix-blend-mode', 'mm', 'ms', '@namespace', 'negative', ':not', ':nth-child', ':nth-last-child', ':nth-last-of-type', ':nth-of-type', 'object-fit',
	'object-position', ':only-child', ':only-of-type', 'opacity', ':optional', 'order', 'orientation', 'ornaments()', 'orphans',
	':out-of-range', 'outline', 'outline-color', 'outline-offset', 'outline-style', 'outline-width', 'overflow', 'overflow-wrap', 'overflow-x', 'overflow-y', 'pad',
	'padding', 'padding-block', 'padding-block-end', 'padding-block-start', 'padding-bottom', 'padding-inline', 'padding-inline-end', 'padding-inline-start', 'padding-left',
	'padding-right', 'padding-top', '@page', 'page-break-after', 'page-break-before', 'page-break-inside', 'pc', 'perspective', 'perspective-origin',
	'place-content', 'place-items', 'place-self', '::placeholder', 'pointer-events', 'polygon()', 'position', 'prefix', 'pt', 'px', 'quotes',
	'rad', 'radial-gradient()', 'range', ':read-only', ':read-write', 'rect()', 'rem', 'repeat()', 'repeating-linear-gradient()',
	'repeating-radial-gradient()', ':required', 'resize', 'revert', 'rgb()', 'rgba()', ':right', 'right', '@right-bottom', ':root',
	'rotate', 'rotate3d()', 'rotateX()', 'rotateY()', 'rotateZ()',
	'row-gap', 's', 'saturate()', 'scale', 'scale3d()', 'scaleX()', 'scaleY()', 'scaleZ()', ':scope', 'scroll-behavior',
	'scroll-margin', 'scroll-margin-block', 'scroll-margin-block-end', 'scroll-margin-block-start', 'scroll-margin-bottom', 'scroll-margin-inline', 'scroll-margin-inline-end',
	'scroll-margin-inline-start', 'scroll-margin-left', 'scroll-margin-right', 'scroll-margin-top', 'scroll-padding', 'scroll-padding-block', 'scroll-padding-block-end',
	'scroll-padding-block-start', 'scroll-padding-bottom', 'scroll-padding-inline', 'scroll-padding-inline-end', 'scroll-padding-inline-start', 'scroll-padding-left',
	'scroll-padding-right', 'scroll-padding-top', 'scroll-snap-align', 'scroll-snap-stop', 'scroll-snap-type', 'scrollbar-color', 'scrollbar-width', '::selection', 'selector()',
	'sepia()', 'shape-image-threshold', 'shape-margin', 'shape-outside', 'skew()', 'skewX()', 'skewY()', '::slotted', 'speak-as', 'src',
	'steps()', 'style', 'styleset()', 'stylistic()', 'suffix', '@supports', 'swash()', 'symbols',
	'system', 'tab-size', 'table-layout', ':target', 'target-counter()', 'target-counters()', 'target-text()', 'text-align', 'text-align-last',
	'text-combine-upright', 'text-decoration', 'text-decoration-color', 'text-decoration-line', 'text-decoration-style', 'text-emphasis', 'text-emphasis-color',
	'text-emphasis-position', 'text-emphasis-style', 'text-indent', 'text-justify', 'text-orientation', 'text-overflow', 'text-rendering', 'text-shadow', 'text-transform',
	'text-underline-position', 'top', '@top-center', 'touch-action', 'transform', 'transform-box',
	'transform-origin', 'transform-style', 'transition', 'transition-delay', 'transition-duration', 'transition-property', 'transition-timing-function',
	'translate', 'translate3d()', 'translateX()', 'translateY()', 'translateZ()', 'turn',
	'unicode-bidi', 'unicode-range', 'unset', 'url()', 'user-zoom',
	':valid', 'var()', 'vertical-align', 'vh', '@viewport', 'visibility', ':visited', 'vmax', 'vmin', 'vw', 'white-space', 'widows', 'width', 'will-change',
	'word-break', 'word-spacing', 'word-wrap', 'writing-mode', 'x', 'z-index', 'zoom'
];

class Word extends String {
	constructor(v) {
		super(v);
	}
}

class DescSymCls extends String {
	constructor() {
		super('Keywords are recognized in different medium\nCSSStyleDeclaration class of JS Object reads camelCase\n*.css type of files read the dashed version');
	}
}

class DescPCESymCls extends String {
	constructor() {
		super('Pseudo-Classes and Pseudo-Elements have prefix of 1 or 2 colon [: or ::]');
	}
}

class DescVSymCls extends String {
	constructor(keywords) {
		super('Keywords value of [' + keywords.join(' | ') + ']');
	}
}

class LabelSymCls extends String {
	constructor() {
		super('CSS Property');
	}
}

class LabelVSymCls extends String {
	constructor() {
		super('CSS Value');
	}
}

class LabelFSymCls extends String {
	constructor() {
		super('CSS Function');
	}
}

class LabelPCESymCls extends String {
	constructor() {
		super('CSS Pseudo-Class/Element');
	}
}

class VTypePCls extends String {
	constructor() {
		super('property');
	}
}

class VTypeVCls extends String {
	constructor() {
		super('variable');
	}
}

class VTypeFCls extends String {
	constructor() {
		super('function');
	}
}

class VTypeCCls extends String {
	constructor() {
		super('class');
	}
}

class LeftSymCls extends String {
	constructor() {
		super('ProtoSS - CSS');
	}
}

var reservedWords = [],
	nativeClasses = [],
	globalFunctions = [],
	labels = new Map(),
	desc = new Map(),
	lefts = new Map(),
	vtype = new Map(),
	labelSym = new LabelSymCls(),
	labelVSym = new LabelVSymCls(),
	labelFSym = new LabelFSymCls(),
	labelPCESym = new LabelPCESymCls(),
	descSym = new DescSymCls(),
	descPCESym = new DescPCESymCls(),
	vtypePSym = new VTypePCls(),
	vtypeVSym = new VTypeVCls(),
	vtypeFSym = new VTypeFCls(),
	vtypeCSym = new VTypeCCls(),
	leftSym = new LeftSymCls();

words.forEach(v => {
	var fw = v.replace(new RegExp('[(]|[)]', 'g'), ''),
		cw = fw.replace(new RegExp('[:]', 'g'), ''),
		isFunc = fw.length !== v.length,
		isCls = cw.length !== v.length;
	if (isFunc) globalFunctions.push(fw);
	else if (isCls) nativeClasses.push(cw);
	else reservedWords.push(v);
});

var cs, cstyle = document.createElement('div').style;
for (cs in cstyle) {
	if (reservedWords.indexOf(cs) === -1) reservedWords.push(cs);
}

reservedWords.forEach((e, i, a) => {
	e = new Word(e);
	a[i] = e;
	labels.set(e, labelSym);
	desc.set(e, descSym);
	vtype.set(e, vtypePSym);
	lefts.set(e, leftSym);
});

nativeClasses.forEach((e, i, a) => {
	e = new Word(e);
	a[i] = e;
	labels.set(e, labelPCESym);
	desc.set(e, descPCESym);
	vtype.set(e, vtypeCSym);
	lefts.set(e, leftSym);
});

globalFunctions.forEach((e, i, a) => {
	e = new Word(e);
	a[i] = e;
	labels.set(e, labelFSym);
	desc.set(e, descSym);
	vtype.set(e, vtypeFSym);
	lefts.set(e, leftSym);
});

var wordValues = [{
	types: ['font-weight'],
	values: ['normal', 'bold', 'lighter', 'bolder']
}, {
	types: ['font-style'],
	values: ['italic', 'normal', 'oblique']
}, {
	types: ['text-align'],
	values: ['center', 'left', 'right', 'justify']
}, {
	types: ['text-decoration'],
	values: ['line-through', 'none', 'overline', 'underline']
}, {
	types: ['text-transform'],
	values: ['capitalize', 'full-width', 'lowercase', 'none', 'uppercase']
}, {
	types: ['text-overflow'],
	values: ['clip', 'ellipsis']
}, {
	types: ['white-space'],
	values: ['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap']
}, {
	types: ['vertical-align'],
	values: ['baseline', 'bottom', 'middle', 'sub', 'super', 'text-bottom', 'text-top', 'top']
}, {
	types: ['overflow', 'overflow-x', 'overflow-y'],
	values: ['auto', 'visible', 'hidden', 'scroll']
}, {
	types: ['position'],
	values: ['relative', 'absolute', 'static', 'fixed', 'sticky']
}, {
	types: ['background-blend-mode', 'mix-blend-mode'],
	values: ['color', 'color-burn', 'color-dodge', 'darken', 'difference', 'exclusion', 'hard-light', 'hue',
		'lighten', 'luminosity', 'multiply', 'normal', 'overlay', 'saturation', 'screen', 'soft-light'
	]
}, {
	types: ['background-position'],
	values: ['left', 'center', 'right', 'top', 'bottom']
}, {
	types: ['background-repeat'],
	values: ['no-repeat', 'repeat', 'repeat-x', 'repeat-y', 'round', 'space']
}, {
	types: ['outline-width', 'border-width', 'border-left-width', 'border-right-width', 'border-top-width', 'border-bottom-width', 'column-rule-width'],
	values: ['medium', 'thin', 'thick']
}, {
	types: ['outline-style', 'border-style', 'border-left-style', 'border-right-style', 'border-top-style', 'border-bottom-style', 'column-rule-style'],
	values: ['dashed', 'dotted', 'double', 'groove', 'hidden', 'inset', 'none', 'outset', 'ridge', 'solid']
}, {
	types: ['list-style'],
	values: ['none', 'unset', 'url()', 'armenian', 'circle', 'decimal', 'decimal-leading-zero', 'disc', 'georgian', 'inside', 'outside', 'square',
		'lower-alpha', 'lower-greek', 'lower-latin', 'lower-roman',
		'upper-alpha', 'upper-latin', 'upper-roman'
	]
}, {
	types: ['pointer-events'],
	values: ['auto', 'none', 'visiblePainted', 'visibleFill', 'visibleStroke', 'visible', 'painted', 'fill', 'stroke', 'all']
}, {
	types: ['cursor'],
	values: ['auto', 'none', 'default', 'context-menu', 'help', 'pointer', 'progress', 'cell', 'crosshair', 'text', 'vertical-text',
		'alias', 'copy', 'move', 'no-drop', 'not-allowed', 'grab', 'grabbing',
		'all-scroll', 'col-resize', 'row-resize',
		'n-resize', 'e-resize', 's-resize', 'w-resize', 'ne-resize', 'nw-resize', 'se-resize', 'sw-resize', 'ew-resize', 'ns-resize', 'nesw-resize', 'nwse-resize',
		'zoom-in', 'zoom-out'
	]
}, {
	types: ['display'],
	values: ['block', 'inline', 'run-in', 'none', 'contents', 'inline-block', 'inline-table', 'inline-flex', 'inline-grid',
		'flow', 'flow-root', 'table', 'flex', 'grid', 'ruby', 'list-item',
		'table-row-group', 'table-header-group', 'table-footer-group', 'table-row', 'table-cell', 'table-column-group', 'table-column', 'table-caption',
		'ruby-base', 'ruby-text', 'ruby-base-container', 'ruby-text-container'
	]
}];

function groupValues() {
	var a, types, mask = {},
		addin = {};
	wordValues.forEach(e => {
		e.values.forEach(v => {
			if (!mask[v]) mask[v] = [e];
			else addin[v] = (addin[v] || mask[v]).concat(e);
		});
	});

	for (a in addin) {
		types = [];
		addin[a].forEach(e => {
			types = types.concat(e.types);
			e.values.splice(e.values.indexOf(a), 1);
		});
		wordValues.push({
			types: types,
			values: [a]
		})
	}
}

groupValues();

wordValues.forEach(e => {
	var sym = new DescVSymCls(e.types);
	e.values.forEach(v => {
		var fw = v.replace(new RegExp('[(]|[)]', 'g'), ''),
			isFunc = fw.length !== v.length,
			w = new Word(fw);
		(!isFunc ? reservedWords : globalFunctions).push(w);
		labels.set(w, !isFunc ? labelVSym : labelFSym);
		desc.set(w, sym);
		vtype.set(w, !isFunc ? vtypeVSym : vtypeFSym);
		lefts.set(w, leftSym);
	});
});

module.exports.types = ['CSS', 'HTML', 'JavaScript', 'TypeScript'];
module.exports.reservedWords = reservedWords;
module.exports.nativeClasses = nativeClasses;
module.exports.globalFunctions = globalFunctions;
module.exports.labels = labels;
module.exports.desc = desc;
module.exports.lefts = lefts;
module.exports.vtype = vtype;