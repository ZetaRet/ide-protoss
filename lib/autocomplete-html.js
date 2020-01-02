/**
 * Author: Zeta Ret
 * ProtoSS package autocomplete HTML
 **/

var other = ['Element', 'Node', 'EventTarget',
	'DOMStringMap', 'History', 'ImageData', 'Location', 'MessageChannel',
	'MessagePort', 'Navigator',
	'Plugin', 'PluginArray', 'PromiseRejectionEvent',
	'RadioNodeList', 'ValidityState', 'Window',
	'RenderingContext', 'CanvasPattern', 'CanvasGradient', 'CanvasRenderingContext2D', 'CanvasImageSource', 'ImageBitmap',
	'Path2D', 'TextMetrics', 'OffscreenCanvas', 'ImageBitmapRenderingContext', 'WebGLRenderingContext', 'WebGL2RenderingContext'
].concat(['AnimationEvent', 'AudioProcessingEvent',
	'BeforeInputEvent', 'BeforeUnloadEvent', 'BlobEvent',
	'ClipboardEvent', 'CloseEvent', 'CompositionEvent', 'CSSFontFaceLoadEvent', 'CustomEvent',
	'DeviceLightEvent', 'DeviceMotionEvent', 'DeviceOrientationEvent', 'DeviceProximityEvent', 'DOMTransactionEvent', 'DragEvent',
	'EditingBeforeInputEvent', 'ErrorEvent',
	'FetchEvent', 'FocusEvent', 'GamepadEvent', 'HashChangeEvent',
	'IDBVersionChangeEvent', 'InputEvent', 'KeyboardEvent',
	'MediaStreamEvent', 'MessageEvent', 'MouseEvent', 'MutationEvent', 'OfflineAudioCompletionEvent',
	'PageTransitionEvent', 'PaymentRequestUpdateEvent', 'PointerEvent', 'PopStateEvent', 'ProgressEvent',
	'RelatedEvent', 'RTCDataChannelEvent', 'RTCIdentityErrorEvent', 'RTCIdentityEvent', 'RTCPeerConnectionIceEvent',
	'SensorEvent', 'StorageEvent', 'SVGEvent', 'SVGZoomEvent',
	'TimeEvent', 'TouchEvent', 'TrackEvent', 'TransitionEvent',
	'UIEvent', 'UserProximityEvent', 'WebGLContextEvent', 'WheelEvent'
]);

var html = ['HTMLAnchorElement', 'HTMLAreaElement', 'HTMLAudioElement',
	'HTMLBRElement', 'HTMLBaseElement', 'HTMLBodyElement', 'HTMLButtonElement', 'HTMLCanvasElement',
	'HTMLContentElement',
	'HTMLDListElement', 'HTMLDataElement', 'HTMLDataListElement', 'HTMLDialogElement', 'HTMLDivElement', 'HTMLDocument',
	'HTMLEmbedElement',
	'HTMLFieldSetElement', 'HTMLFormControlsCollection', 'HTMLFormElement', 'HTMLFrameSetElement',
	'HTMLHRElement', 'HTMLHeadElement', 'HTMLHeadingElement', 'HTMLHtmlElement',
	'HTMLIFrameElement', 'HTMLImageElement', 'HTMLInputElement',
	'HTMLLIElement', 'HTMLLabelElement', 'HTMLLegendElement', 'HTMLLinkElement',
	'HTMLMapElement', 'HTMLMediaElement', 'HTMLMetaElement', 'HTMLMeterElement', 'HTMLModElement',
	'HTMLOListElement', 'HTMLObjectElement', 'HTMLOptGroupElement', 'HTMLOptionElement', 'HTMLOptionsCollection', 'HTMLOutputElement',
	'HTMLParagraphElement', 'HTMLParamElement', 'HTMLPictureElement', 'HTMLPreElement', 'HTMLProgressElement',
	'HTMLQuoteElement',
	'HTMLScriptElement', 'HTMLSelectElement', 'HTMLShadowElement', 'HTMLSourceElement', 'HTMLSpanElement', 'HTMLStyleElement',
	'HTMLTableCaptionElement', 'HTMLTableCellElement', 'HTMLTableColElement', 'HTMLTableElement', 'HTMLTableRowElement', 'HTMLTableSectionElement',
	'HTMLTemplateElement', 'HTMLTextAreaElement', 'HTMLTimeElement', 'HTMLTitleElement', 'HTMLTrackElement',
	'HTMLUListElement', 'HTMLUnknownElement',
	'HTMLVideoElement'
];

var extracts = ['HTMLDocument', 'HTMLElement', 'HTMLBodyElement', 'HTMLAnchorElement',
	'HTMLImageElement', 'HTMLInputElement',
	'HTMLAudioElement', 'HTMLVideoElement', 'HTMLCanvasElement',
	'HTMLDialogElement', 'HTMLFieldSetElement', 'HTMLFormElement', 'HTMLOptionElement',
	'HTMLIFrameElement', 'HTMLScriptElement',
	'HTMLTableElement', 'HTMLTableCellElement', 'HTMLTableRowElement',
	'Event', 'ErrorEvent', 'History', 'ImageData', 'Navigator',
	'CanvasRenderingContext2D', 'CanvasGradient', 'ImageBitmapRenderingContext', 'WebGLRenderingContext', 'WebGL2RenderingContext'
];

class Word extends String {
	constructor(v) {
		super(v);
	}
}

class DescSymCls extends String {
	constructor() {
		super('HTMLElements can be extended by new class.\nUse `document.createElement("shortname")` to create one.');
	}
}

class DescOSymCls extends String {
	constructor() {
		super('DOM structure supporting HTML Elements');
	}
}

class LabelHDSymCls extends String {
	constructor() {
		super('HTML Dom');
	}
}

class LabelSymCls extends String {
	constructor(n) {
		super(n + ' Property');
	}
}

class LabelFSymCls extends String {
	constructor(n) {
		super(n + ' Method');
	}
}

class LabelCls extends String {
	constructor(n) {
		super(n);
	}
}

class VTypePCls extends String {
	constructor() {
		super('property');
	}
}

class VTypeFCls extends String {
	constructor() {
		super('method');
	}
}

class VTypeCCls extends String {
	constructor() {
		super('class');
	}
}

class LeftSymCls extends String {
	constructor() {
		super('ProtoSS - HTML');
	}
}

class Extractor {
	static getFromPrototype(ele) {
		var t, e, k, desc, p = ele.prototype,
			ex = [];

		for (k in p) {
			desc = Object.getOwnPropertyDescriptor(p, k);
			e = {
				key: k,
				get: desc && desc.get ? true : false,
				set: desc && desc.set ? true : false,
				func: desc && desc.value && desc.value.constructor === Function ? true : false
			};
			try {
				t = p[k];
				if (t && t.constructor === Function) e.func = true;
			} catch (err) {}
			ex.push(e);
		}

		return ex;
	}
}

var reservedWords = [],
	nativeClasses = [],
	globalFunctions = [],
	labels = new Map(),
	desc = new Map(),
	lefts = new Map(),
	vtype = new Map(),
	labelHDSym = new LabelHDSymCls(),
	descSym = new DescSymCls(),
	descOSym = new DescOSymCls(),
	vtypePSym = new VTypePCls(),
	vtypeFSym = new VTypeFCls(),
	vtypeCSym = new VTypeCCls(),
	leftSym = new LeftSymCls();

html.forEach((e, i, a) => {
	if (window[e]) {
		var w = new Word(e);
		nativeClasses.push(w);
		labels.set(w, labelHDSym);
		desc.set(w, descSym);
		vtype.set(w, vtypeCSym);
		lefts.set(w, leftSym);
	}
});

other.forEach((e, i, a) => {
	if (window[e]) {
		var w = new Word(e);
		nativeClasses.push(w);
		labels.set(w, labelHDSym);
		desc.set(w, descOSym);
		vtype.set(w, vtypeCSym);
		lefts.set(w, leftSym);
	}
});

var syms = {},
	elmask = {};
extracts.forEach((e, i, a) => {
	if (window[e]) {
		if (!syms[e]) {
			syms[e] = [new LabelSymCls(e), new LabelFSymCls(e), new LabelCls(e + ' getter'), new LabelCls(e + ' setter'), new LabelCls(e + ' getter/setter')];
		}
		var extra = Extractor.getFromPrototype(window[e]);
		extra.forEach(ee => {
			if (elmask[ee.key]) return;
			elmask[ee.key] = true;
			var w = new Word(ee.key);
			if (ee.func) {
				globalFunctions.push(w);
				labels.set(w, syms[e][1]);
				desc.set(w, other.indexOf(e) >= 0 ? descOSym : descSym);
				vtype.set(w, vtypeFSym);
				lefts.set(w, leftSym);
			} else {
				reservedWords.push(w);
				if (ee.get && ee.set) labels.set(w, syms[e][4]);
				else if (ee.get) labels.set(w, syms[e][2]);
				else if (ee.set) labels.set(w, syms[e][3]);
				else labels.set(w, syms[e][0]);
				desc.set(w, other.indexOf(e) >= 0 ? descOSym : descSym);
				vtype.set(w, vtypePSym);
				lefts.set(w, leftSym);
			}
		});
	}
});

module.exports.types = ['HTML', 'JavaScript', 'TypeScript'];
module.exports.reservedWords = reservedWords;
module.exports.nativeClasses = nativeClasses;
module.exports.globalFunctions = globalFunctions;
module.exports.labels = labels;
module.exports.desc = desc;
module.exports.lefts = lefts;
module.exports.vtype = vtype;