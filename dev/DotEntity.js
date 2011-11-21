// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

/*
	Class: DotEntity
	
	Base class for all entities found in XDot documents
*/
var DotEntity = DotUtils.createClass({

	/*
		Constructor: initialize
		
		Initializes new instances of the DotEntity class
		
		Parameters:
		
			defaultAttrHashName - {String} The identifier in XDot files for this entity type
			name - {String} The identifier of this entity instance
			dot - {<Dot>} The dot instance to which this entity is attached
			rootGraph - {<DotGraph>} The graph instance to whick this instance is attached
			parentGraph - To be determined. Maybe the direct container element ?
			immediateGraph - To be determined
	*/
	// TODO : Can't we refactor this to remove the dot param ? (infering it from the rootGraph or parentGraph)
	initialize: function(defaultAttrHashName, name, dot, rootGraph, parentGraph, immediateGraph) {
		this._defaultAttrHashName = defaultAttrHashName;
		this._name = name;
		this._dot = dot;
		this._rootGraph = rootGraph;
		this._parentGraph = parentGraph;
		this._immediateGraph = immediateGraph;
		this._attrs = {};
		this._drawAttrs = {};
	},
	_initBB: function() {
		var matches = this.getAttr('pos').match(/([0-9.]+),([0-9.]+)/);
		var x = Math.round(matches[1]);
		var y = Math.round(this._dot._height - matches[2]);
		this._bbRect = new Rect(x, y, x, y);
	},
	
	/*
		Method: getAttr
		
		Gets the value of an XDot attribute of this element
		
		Parameters:
		
			attrName - {String} The attribute name
			escString - {Boolean} (Optionnal) A boolean value indicating if the returned value should have
						escaped substrings (like \T, \H, ...) replaced by actual values. Default is false.
	*/
	getAttr: function(attrName, escString) {
		if (typeof escStrinng === 'undefined') escString = false;
		var attrValue = this._attrs[attrName];
		if (typeof attrValue === 'undefined') {
			var graph = this._parentGraph;
			while (typeof graph !== 'undefined') {
				attrValue = graph[this._defaultAttrHashName][attrName];
				if (typeof attrValue === 'undefined') {
					graph = graph._parentGraph;
				} else {
					break;
				}
			}
		}
		if (attrValue && escString) {
			attrValue = attrValue.replace(this._escStringMatchRe, function(match, p1) {
				switch (p1) {
					case 'N': // fall through
					case 'E': return this._name;
					case 'T': return this._tailNode;
					case 'H': return this._headNode;
					case 'G': return this._immediateGraph._name;
					case 'L': return this.getAttr('label', true);
				}
				return match;
			}.bind(this));
		}
		return attrValue;
	},
	_draw: function(ctx, ctxScale) {
		var i, tokens, fillColor, strokeColor;
		var fontSize = 12;
		//ctx.lineWidth = ctxScale;
		this._initBB();

		for(daKey in this._drawAttrs) {
			var command = this._drawAttrs[daKey];
//			debug(command);
			var tokenizer = new DotTokenizer(command);
			var token = tokenizer.takeChars();
			if (token) {
				var dashStyle = 'solid';
				ctx.save();
				while (token) {
//					debug('processing token ' + token);
					switch (token) {
						case 'E': // filled ellipse
						case 'e': // unfilled ellipse
							var filled = ('E' == token);
							var cx = tokenizer.takeNumber();
							var cy = (this._dot._height - tokenizer.takeNumber());
							var rx = tokenizer.takeNumber();
							var ry = tokenizer.takeNumber();
							var path = new Ellipse(cx, cy, rx, ry);
							break;
						case 'P': // filled polygon
						case 'p': // unfilled polygon
						case 'L': // polyline
							var filled = ('P' == token);
							var closed = ('L' != token);
							var numPoints = tokenizer.takeNumber();
							tokens = tokenizer.takeNumber(2 * numPoints); // points
							var path = new Path();
							for (i = 2; i < 2 * numPoints; i += 2) {
								path.addBezier([
									new Point(tokens[i - 2], (this._dot._height - tokens[i - 1])),
									new Point(tokens[i], (this._dot._height - tokens[i + 1]))
								]);
							}
							if (closed) {
								path.addBezier([
									new Point(tokens[2 * numPoints - 2], (this._dot._height - tokens[2 * numPoints - 1])),
									new Point(tokens[0], (this._dot._height - tokens[1]))
								]);
							}
							break;
						case 'B': // unfilled b-spline
						case 'b': // filled b-spline
							var filled = ('b' == token);
							var numPoints = tokenizer.takeNumber();
							tokens = tokenizer.takeNumber(2 * numPoints); // points
							var path = new Path();
							for (i = 2; i < 2 * numPoints; i += 6) {
								path.addBezier([
									new Point(tokens[i - 2], (this._dot._height - tokens[i - 1])),
									new Point(tokens[i],     (this._dot._height - tokens[i + 1])),
									new Point(tokens[i + 2], (this._dot._height - tokens[i + 3])),
									new Point(tokens[i + 4], (this._dot._height - tokens[i + 5]))
								]);
							}
							break;
						case 'I': // image
							var l = tokenizer.takeNumber();
							var b = (this._dot._height - tokenizer.takeNumber());
							var w = tokenizer.takeNumber();
							var h = tokenizer.takeNumber();
							var src = tokenizer.takeString();
							if (!this._dot._images[src]) {
								this._dot._images[src] = new DotImage(this._dot, src);
							}
							this._dot._images[src].draw(ctx, l, b - h, w, h);
							break;
						case 'T': // text
							// TODO : Texts seems better aligned without that padding. Should investigate why
							var l = Math.round(tokenizer.takeNumber()/* + this._dot._padding*/);
							var t = Math.round(this._dot._height /* + 2 * this._dot._padding */ - tokenizer.takeNumber() /*- fontSize*/);
							var textAlign = tokenizer.takeNumber();
							var textWidth = Math.round(ctxScale * tokenizer.takeNumber());
							var str = tokenizer.takeString();
							if (!/^\s*$/.test(str)) {
								str = DotUtils.escapeHtml(str);
								do {
									matches = str.match(/ ( +)/);
									if (matches) {
										var spaces = ' ';
										matches[1].length.times(function() {
											spaces += '&nbsp;';
										});
										str = str.replace(/  +/, spaces);
									}
								} while (matches);
								
								ctx.font = "normal normal normal " + fontSize + "px " + fontFamily;
								ctx.textAlign = (-1 == textAlign) ? 'left' : (1 == textAlign) ? 'right' : 'center';
								ctx.fillStyle = strokeColor.textColor;
								ctx.fillText(str, l, t);
							}
							break;
						case 'C': // set fill color
						case 'c': // set pen color
							var fill = ('C' == token);
							var color = this._parseColor(tokenizer.takeString());
							if (fill) {
								fillColor = color;
								ctx.fillStyle = color.canvasColor;
							} else {
								strokeColor = color;
								ctx.strokeStyle = color.canvasColor;
							}
							break;
						case 'F': // set font
							fontSize = tokenizer.takeNumber();
							fontFamily = tokenizer.takeString();
							switch (fontFamily) {
								case 'Times-Roman':
									fontFamily = 'Times New Roman';
									break;
								case 'Courier':
									fontFamily = 'Courier New';
									break;
								case 'Helvetica':
									fontFamily = 'Arial';
									break;
								default:
									// nothing
							}
//							debug('set font ' + fontSize + 'pt ' + fontFamily);
							break;
						case 'S': // set style
							var style = tokenizer.takeString();
							switch (style) {
								case 'solid':
								case 'filled':
									// nothing
									break;
								case 'dashed':
								case 'dotted':
									dashStyle = style;
									break;
								case 'bold':
									ctx.lineWidth = 2;
									break;
								default:
									matches = style.match(/^setlinewidth\((.*)\)$/);
									if (matches) {
										ctx.lineWidth = Number(matches[1]);
									} else {
										debug('unknown style ' + style);
									}
							}
							break;
						default:
							debug('unknown token ' + token);
							return;
					}
					if (path) {
						this._dot._drawPath(ctx, path, filled, dashStyle);
						 this._bbRect.expandToInclude(path.getBB());
						path = undefined;
					}
					token = tokenizer.takeChars();
				}

				ctx.restore();
			}
		}
	},
	_parseColor: function(color) {
		var parsedColor = {opacity: 1};
		// rgb/rgba
		if (/^#(?:[0-9a-f]{2}\s*){3,4}$/i.test(color)) {
			return this._dot._parseHexColor(color);
		}
		// hsv
		var matches = color.match(/^(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)$/);
		if (matches) {
			parsedColor.canvasColor = parsedColor.textColor = this._dot._hsvToRgbColor(matches[1], matches[2], matches[3]);
			return parsedColor;
		}
		// named color
		var colorScheme = this.getAttr('colorscheme') || 'X11';
		var colorName = color;
		matches = color.match(/^\/(.*)\/(.*)$/);
		if (matches) {
			if (matches[1]) {
				colorScheme = matches[1];
			}
			colorName = matches[2];
		} else {
			matches = color.match(/^\/(.*)$/);
			if (matches) {
				colorScheme = 'X11';
				colorName = matches[1];
			}
		}
		colorName = colorName.toLowerCase();
		var colorSchemeName = colorScheme.toLowerCase();
		var colorSchemeData = Dot.prototype.colors[colorSchemeName];
		if (colorSchemeData) {
			var colorData = colorSchemeData[colorName];
			if (colorData) {
				return this._dot._parseHexColor('#' + colorData);
			}
		}
		colorData = Dot.prototype.colors['fallback'][colorName];
		if (colorData) {
			return this._dot._parseHexColor('#' + colorData);
		}
		if (!colorSchemeData) {
			debug('unknown color scheme ' + colorScheme);
		}
		// unknown
		debug('unknown color ' + color + '; color scheme is ' + colorScheme);
		parsedColor.canvasColor = parsedColor.textColor = '#000000';
		return parsedColor;
	}
});
