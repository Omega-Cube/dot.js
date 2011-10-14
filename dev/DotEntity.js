// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

/*
	Class: DotEntity
	
	Base class for all entities found in XDot documents
*/
var DotEntity = DotUtils.createClass({
	initialize: function(defaultAttrHashName, name, dot, rootGraph, parentGraph, immediateGraph) {
		this.defaultAttrHashName = defaultAttrHashName;
		this.name = name;
		this.dot = dot;
		this.rootGraph = rootGraph;
		this.parentGraph = parentGraph;
		this.immediateGraph = immediateGraph;
		this.attrs = {};
		this.drawAttrs = {};
	},
	initBB: function() {
		var matches = this.getAttr('pos').match(/([0-9.]+),([0-9.]+)/);
		var x = Math.round(matches[1]);
		var y = Math.round(this.dot.height - matches[2]);
		this.bbRect = new Rect(x, y, x, y);
	},
	getAttr: function(attrName, escString) {
		if (typeof escStrinng === 'undefined') escString = false;
		var attrValue = this.attrs[attrName];
		if (typeof attrValue === 'undefined') {
			var graph = this.parentGraph;
			while (typeof graph !== 'undefined') {
				attrValue = graph[this.defaultAttrHashName][attrName];
				if (typeof attrValue === 'undefined') {
					graph = graph.parentGraph;
				} else {
					break;
				}
			}
		}
		if (attrValue && escString) {
			attrValue = attrValue.replace(this.escStringMatchRe, function(match, p1) {
				switch (p1) {
					case 'N': // fall through
					case 'E': return this.name;
					case 'T': return this.tailNode;
					case 'H': return this.headNode;
					case 'G': return this.immediateGraph.name;
					case 'L': return this.getAttr('label', true);
				}
				return match;
			}.bind(this));
		}
		return attrValue;
	},
	draw: function(ctx, ctxScale, redrawCanvasOnly) {
		var i, tokens, fillColor, strokeColor;
		if (!redrawCanvasOnly) {
			this.initBB();
			var bbDiv = document.createElement('div');
			this.dot.elements.appendChild(bbDiv);
		}
		for(daKey in this.drawAttrs) {
			var command = this.drawAttrs[daKey];
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
							var cy = this.dot.height - tokenizer.takeNumber();
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
									new Point(tokens[i - 2], this.dot.height - tokens[i - 1]),
									new Point(tokens[i],     this.dot.height - tokens[i + 1])
								]);
							}
							if (closed) {
								path.addBezier([
									new Point(tokens[2 * numPoints - 2], this.dot.height - tokens[2 * numPoints - 1]),
									new Point(tokens[0],                  this.dot.height - tokens[1])
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
									new Point(tokens[i - 2], this.dot.height - tokens[i - 1]),
									new Point(tokens[i],     this.dot.height - tokens[i + 1]),
									new Point(tokens[i + 2], this.dot.height - tokens[i + 3]),
									new Point(tokens[i + 4], this.dot.height - tokens[i + 5])
								]);
							}
							break;
						case 'I': // image
							var l = tokenizer.takeNumber();
							var b = this.dot.height - tokenizer.takeNumber();
							var w = tokenizer.takeNumber();
							var h = tokenizer.takeNumber();
							var src = tokenizer.takeString();
							if (!this.dot.images[src]) {
								this.dot.images[src] = new DotImage(this.dot, src);
							}
							this.dot.images[src].draw(ctx, l, b - h, w, h);
							break;
						case 'T': // text
							var l = Math.round(ctxScale * tokenizer.takeNumber() + this.dot.padding);
							var t = Math.round(ctxScale * this.dot.height + 2 * this.dot.padding - (ctxScale * (tokenizer.takeNumber() + this.dot.bbScale * fontSize) + this.dot.padding));
							var textAlign = tokenizer.takeNumber();
							var textWidth = Math.round(ctxScale * tokenizer.takeNumber());
							var str = tokenizer.takeString();
							if (!redrawCanvasOnly && !/^\s*$/.test(str)) {
//								debug('draw text ' + str + ' ' + l + ' ' + t + ' ' + textAlign + ' ' + textWidth);
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
								var text;
								var href = this.getAttr('URL', true) || this.getAttr('href', true);
								if (href) {
									var target = this.getAttr('target', true) || '_self';
									var tooltip = this.getAttr('tooltip', true) || this.getAttr('label', true);
//									debug(this.name + ', href ' + href + ', target ' + target + ', tooltip ' + tooltip);
									text = document.createElement('a');
									text.href = href;
									text.target = target;
									text.title = tooltip;
									var events = ['onclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout'];
									for(var attrName in events) {
										var attrValue = this.getAttr(attrName, true);
										if (attrValue) {
											text.setAttribute(attrName, attrValue);
										}
									}

									text.style.textDecoration = 'none';
								} else {
									text = document.createElement('span');
								}
								DotUtils.setHtml(text, str);
								
								text.style.fontSize = Math.round(fontSize * ctxScale * this.dot.bbScale) + 'px';
								text.style.fontFamily = fontFamily;
								text.style.color = strokeColor.textColor;
								text.style.position = 'absolute';
								text.style.textAlign = (-1 == textAlign) ? 'left' : (1 == textAlign) ? 'right' : 'center';
								text.style.left = (l - (1 + textAlign) * textWidth) + 'px';
								text.style.top = t + 'px';
								text.style.width = (2 * textWidth) + 'px';

								if (1 != strokeColor.opacity) 
									text.style.opacity = strokeColor.opacity;
								this.dot.elements.appendChild(text);
							}
							break;
						case 'C': // set fill color
						case 'c': // set pen color
							var fill = ('C' == token);
							var color = this.parseColor(tokenizer.takeString());
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
						this.dot.drawPath(ctx, path, filled, dashStyle);
						if (!redrawCanvasOnly) this.bbRect.expandToInclude(path.getBB());
						path = undefined;
					}
					token = tokenizer.takeChars();
				}
				if (!redrawCanvasOnly) {
					bbDiv.style.position = 'absolute';
					bbDiv.style.left = Math.round(ctxScale * this.bbRect.l + this.dot.padding) + 'px';
					bbDiv.style.top = Math.round(ctxScale * this.bbRect.t + this.dot.padding) + 'px';
					bbDiv.style.width = Math.round(ctxScale * this.bbRect.getWidth()) + 'px';
					bbDiv.style.height = Math.round(ctxScale * this.bbRect.getHeight()) + 'px';
				}
				ctx.restore();
			}
		}
	},
	parseColor: function(color) {
		var parsedColor = {opacity: 1};
		// rgb/rgba
		if (/^#(?:[0-9a-f]{2}\s*){3,4}$/i.test(color)) {
			return this.dot.parseHexColor(color);
		}
		// hsv
		var matches = color.match(/^(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)$/);
		if (matches) {
			parsedColor.canvasColor = parsedColor.textColor = this.dot.hsvToRgbColor(matches[1], matches[2], matches[3]);
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
				return this.dot.parseHexColor('#' + colorData);
			}
		}
		colorData = Dot.prototype.colors['fallback'][colorName];
		if (colorData) {
			return this.dot.parseHexColor('#' + colorData);
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
