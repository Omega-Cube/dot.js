// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

/*
	Class: Dot
	
	Main entry point of Dot.js
	
	Instances of this class can be used to place and configure Dot graphs on the page
*/
var Dot = DotUtils.createClass({
	/*
		Field: maxXdotVersion
		
		{string} Determines the maximum version of XDot supported
	*/
	maxXdotVersion: '1.2',
	
	/*
		Field: colors
		
		{object} Contains a map of all available color schemes for the current graph
	*/
	colors: {
		fallback:{
			black:'000000',
			lightgrey:'d3d3d3',
			white:'ffffff'
		}
	},
	
	/*
		Constructor: initialize
		
		Initializes a new instance of the <Dot> class
		
		Parameters:
		
			container - {HTMLElement} A DOM element (typically a div) in which the graph will be placed
			url - {String} Optionnal. The URL of the initial XDot file. If not provided, the user
				  should call the <load> method after creating the instance.
			urlParams - {object} Optionnal GET parameters set when requesting the initial XDot file
	*/
	initialize: function(container, url, urlParams) {
		this._canvas = document.createElement('canvas');
		this._canvas.style.position = 'absolute';
		if (!Dot._canvasCounter)
			Dot._canvasCounter = 0;
		this._canvas.id = 'dot_canvas_' + ++Dot._canvasCounter;
		this._elements = document.createElement('div');
		this._elements.style.position = 'absolute';
		this._container = document.getElementById(container);
		this._container.style.position = 'relative';
		this._container.appendChild(this._canvas);
		
		if (typeof G_vmlCanvasManager !== 'undefined') {
			G_vmlCanvasManager.initElement(this._canvas);
			this._canvas = document.getElementById(this._canvas.id);
		}
		this._container.appendChild(this._elements);
		this._ctx = this._canvas.getContext('2d');
		
		this._scale = 1;
		this._minimumScale = 0.5;
		this._maximumScale = 2;
		this._padding = 8;
		this._dashLength = 6;
		this._dotSpacing = 4;
		this._graphs = [];
		this._images = {};
		this._numImages = 0;
		this._numImagesFinished = 0;
		this._imagePath = '';
		this._graphLoaded = false;
		this._allowMouseScrolling = true;
		
		if (url) {
			this.load(url, urlParams);
		}
		
		DotUtils.addEventHandler(this._container, 'mousewheel', DotUtils.bind(this, this._handleMouseWheel));
	},
	
	/*
		Method: setScale
		
		Sets the display scale of the graph.
		
		Calling this method will trigger a graph update.
		
		Parameters:
		
			scale - {Number} The new scale to apply. 1 is original size.
					If the provided value is greater the maximumScale, the new scale
					will be the maximumScale value. If it is smaller than minimumScale,
					the new scale will be the minimumScale value.
		
		See Also:
			
			<setMaximumScale>
			<getMaximumScale>
			<setMinimumScale>
			<getMinimumScale>
			<getScale>
	*/
	setScale: function(scale) {
		this._scale = (+scale);
		
		if(this._scale < this._minimumScale)
			this._scale = this._minimumScale;
		
		if(this._scale > this._maximumScale)
			this._scale = this._maximumScale;
		
		if(this._graphLoaded)
			this._draw();
	},
	
	/*
		Method: getScale
		
		Gets the display scale of the graph
		
		Returns:
		
			{Number} The current graph scale, 1 being the graph's original size.
			
		See Also:
		
			<setScale>
	*/
	getScale: function() {
		return this._scale;
	},
	
	/*
		Method: setMinimumScale
		
		Sets the minimum display scale of the graph.
		The provided value cannot be smaller than 0.001.
		
		Parameters:
			
			value - {Number} The minimum possible scale.
		
		See Also:
		
			<getMinimumScale>
			<setScale>
	*/
	setMinimumScale: function(value) {
		value = (+value);
	
		if(value > this._maximumScale)
			value = this._maximumScale;
		
		if(value <= 0)
			value = 0.001;

		this._minimumScale = value;

		if(this._scale < value)
			this.setScale(value);			
	},
	
	/*
		Method: getMinimumScale
		
		Gets the minimum scale of the graph.
		
		Returns:
		
			{Number} The minimum scale of the graph.
		
		See Also:
			
			<setMinimumScale>
			<setScale>
	*/
	getMinimumScale: function() {
		return this._minimumScale;
	},
	
	/*
		Method: setMaximumScale
		
		Sets the maximum display scale of the graph.
		If the parameter is smaller than the current minimumValue,
		the minimum value will be saved instead of the parameter.
		
		Parameters:
			
			value - {Number} The maximum possible scale.
		
		See Also:
		
			<getMaximumScale>
			<setScale>
	*/
	setMaximumScale: function(value) {
		value = (+value);
		
		if(value < this._minimumScale)
			value = this._minimumScale;
		
		this._maximumScale = value;
		
		if(this._scale > this._maximumScale)
			this.setScale(this._maximumScale);
	},
	
	/*
		Method: getMaximumScale
		
		Gets the current maximum scale of the graph.
		
		Returns:
		
			{Number} The current maximum scale of the graph.
		
		See Also:
			
			<setMaximumScale>
			<setScale>
	*/
	getMaximumScale: function() {
		return this._maximumScale;
	},
	
	/*
		Method: setAllowMouseScrolling
		
		Sets a boolean indicating whether the graph scale is automatically 
		changed by the user's mouse scroll.
		
		Parameters:
			
			value - {Boolean} True if the scale should be updated by the mouse's scroll wheel, false otherwise.
	*/
	setAllowMouseScrolling: function(value) {
		this._allowMouseScrolling = !!value;
	},
	
	/*
		Method: getAllowMouseScrolling
		
		Gets a boolean indicating whether the graph scale is automatically 
		changed by the user's mouse scroll.
		
		Returns:
		
			{Boolean} True if the mouse's scroll wheel updates the scale, false otherwise.
	*/
	getAllowMouseScrolling: function() {
		return this._allowMouseScrolling;
	},
	
	/*
		Method: setImagePath
		
		Sets the base path where images specified by XDot files will be searched for.
		
		Parameters:
		
			imagePath - {String} The base directory containing the graph images.
		
		See Also:
		
			<getImagePath>
			<DotImage>
	*/
	setImagePath: function(imagePath) {
		this._imagePath = imagePath;
	},
	
	/*
		Method: getImagePath
		
		Gets the base path of images used in the graph.
		
		Returns:
		
			{String} The path where graph images can be found.
		
		See Also:
		
			<setImagePath>
			<DotImage>
	*/
	getImagePath: function() {
		return this._imagePath;
	},
	
	/*
		Method: load
		
		Loads a new XDot source for the graph
		
		Note that this method will automatically parse the XDot file and update the graph.
		
		Parameters:
		
			url - {String} The XDot file URL
			urlParams - {object} An optionnal object containing key/value pairs that
						will added as URL parameters before the XDot request is sent
	*/
	load: function(url, urlParams) {
		document.getElementById('debug_output').innerHTML = '';
		
		var callback = DotUtils.bind(this, function(response) { 
				this.parse(response); 
			}
		);

		DotUtils.ajaxGet(
			url,
			urlParams,
			callback
		);
	},
	
	/*
		Method: parse
		
		Parses the provided XDot instructions and updates the graph according to them
		
		Parameters:
		
			xdot - {String} The contents of an XDot file
	*/
	parse: function(xdot) {
		this._graphs = [];
		this._width = 0;
		this._height = 0;
		this._maxWidth = false;
		this._maxHeight = false;
		this._bbEnlarge = false;
		this._bbScale = 1;
		this._dpi = 96;
		this._bgcolor = {opacity: 1};
		this._bgcolor.canvasColor = this._bgcolor.textColor = '#ffffff';
		var lines = xdot.split(/\r?\n/);
		var i = 0;
		var line, lastChar, matches, rootGraph, isGraph, entity, entityName, attrs, attrName, attrValue, attrHash, drawAttrHash;
		var containers = [];
		while (i < lines.length) {
			line = lines[i++].replace(/^\s+/, '');
			if ('' != line && '#' != line.substr(0, 1)) {
				while (i < lines.length && ';' != (lastChar = line.substr(line.length - 1, line.length)) && '{' != lastChar && '}' != lastChar) {
					if ('\\' == lastChar) {
						line = line.substr(0, line.length - 1);
					}
					line += lines[i++];
				}
//				debug(line);
				if (0 == containers.length) {
					matches = line.match(this._graphMatchRe);
					if (matches) {
						rootGraph = new DotGraph(matches[3], this);
						containers.unshift(rootGraph);
						containers[0]._strict = (typeof matches[1] !== 'undefined');
						containers[0]._type = ('graph' == matches[2]) ? 'undirected' : 'directed';
						containers[0]._attrs['xdotversion'] = '1.0';
						this._graphs.push(containers[0]);
//						debug('graph: ' + containers[0].name);
					}
				} else {
					matches = line.match(this._subgraphMatchRe);
					if (matches) {
						containers.unshift(new DotGraph(matches[1], this, rootGraph, containers[0]));
						containers[1]._subgraphs.push(containers[0]);
//						debug('subgraph: ' + containers[0].name);
					}
				}
				if (matches) {
//					debug('begin container ' + containers[0].name);
				} else if ('}' == line) {
//					debug('end container ' + containers[0].name);
					containers.shift();
					if (0 == containers.length) {
						break;
					}
				} else {
					matches = line.match(this._nodeMatchRe);
					if (matches) {
						entityName = matches[2];
						attrs = matches[5];
						drawAttrHash = containers[0]._drawAttrs;
						isGraph = false;
						switch (entityName) {
							case 'graph':
								attrHash = containers[0]._attrs;
								isGraph = true;
								break;
							case 'node':
								attrHash = containers[0]._nodeAttrs;
								break;
							case 'edge':
								attrHash = containers[0]._edgeAttrs;
								break;
							default:
								entity = new DotNode(entityName, this, rootGraph, containers[0]);
								attrHash = entity._attrs;
								drawAttrHash = entity._drawAttrs;
								containers[0]._nodes.push(entity);
						}
//						debug('node: ' + entityName);
					} else {
						matches = line.match(this._edgeMatchRe);
						if (matches) {
							entityName = matches[1];
							attrs = matches[8];
							entity = new DotEdge(entityName, this, rootGraph, containers[0], matches[2], matches[5]);
							attrHash = entity._attrs;
							drawAttrHash = entity._drawAttrs;
							containers[0]._edges.push(entity);
//							debug('edge: ' + entityName);
						}
					}
					if (matches) {
						do {
							if (0 == attrs.length) {
								break;
							}
							matches = attrs.match(this._attrMatchRe);
							if (matches) {
								attrs = attrs.substr(matches[0].length);
								attrName = matches[1];
								attrValue = this._unescape(matches[2]);
								if (/^_.*draw_$/.test(attrName)) {
									drawAttrHash[attrName] = attrValue;
								} else {
									attrHash[attrName] = attrValue;
								}
//								debug(attrName + ' ' + attrValue);
								if (isGraph && 1 == containers.length) {
									switch (attrName) {
										case 'bb':
											var bb = attrValue.split(/,/);
											this._width  = Number(bb[2]);
											this._height = Number(bb[3]);
											break;
										case 'bgcolor':
											this._bgcolor = rootGraph.parseColor(attrValue);
											break;
										case 'dpi':
											this._dpi = attrValue;
											break;
										case 'size':
											var size = attrValue.match(/^(\d+|\d*(?:\.\d+)),\s*(\d+|\d*(?:\.\d+))(!?)$/);
											if (size) {
												this._maxWidth  = 72 * Number(size[1]);
												this._maxHeight = 72 * Number(size[2]);
												this._bbEnlarge = ('!' == size[3]);
											} else {
												debug('can\'t parse size');
											}
											break;
										case 'xdotversion':
											if (0 > this._versionCompare(this.maxXdotVersion, attrHash['xdotversion'])) {
												debug('unsupported xdotversion ' + attrHash['xdotversion'] + '; this script currently supports up to xdotversion ' + this.maxXdotVersion);
											}
											break;
									}
								}
							} else {
								debug('can\'t read attributes for entity ' + entityName + ' from ' + attrs);
							}
						} while (matches);
					}
				}
			}
		}
		this._draw();
		
		this._graphLoaded = true;
	},
	
	/*
		Method: _draw
		
		Updates the graph graphics
		
		This method is generally triggered from other methods, so you should not have to call it explicitely
		
		Parameters:
		
			redrawCanvasOnly - {Boolean} Optionnal. Defines if the method should only redraw the canvas contents
								or if the entire DOM tree should be updated. Default is false.
	*/
	_draw: function(redrawCanvasOnly) {
		if (typeof redrawCanvasOnly === 'undefined') redrawCanvasOnly = false;
		var ctxScale = this._scale * this._dpi / 72;
		var width  = Math.round(ctxScale * this._width  + 2 * this._padding);
		var height = Math.round(ctxScale * this._height + 2 * this._padding);
		if (!redrawCanvasOnly) {
			this._canvas.width  = width;
			this._canvas.height = height;
			this._canvas.style.width = width + 'px';
			this._canvas.style.height = height + 'px';
			this._container.style.width = width + 'px';
			while (this._elements.firstChild) {
				this._elements.removeChild(this._elements.firstChild);
			}
		}
		this._ctx.save();
		this._ctx.lineCap = 'round';
		this._ctx.fillStyle = this._bgcolor.canvasColor;
		this._ctx.fillRect(0, 0, width, height);
		this._ctx.translate(this._padding, this._padding);
		this._ctx.scale(ctxScale, ctxScale);
		this._graphs[0]._draw(this._ctx, ctxScale, redrawCanvasOnly);
		this._ctx.restore();
	},
	
	/*
		Method: _drawPath
		
		Draws the specified path on the graph surface
	*/
	_drawPath: function(ctx, path, filled, dashStyle) {
		if (filled) {
			ctx.beginPath();
			path.makePath(ctx);
			ctx.fill();
		}
		if (ctx.fillStyle != ctx.strokeStyle || !filled) {
			switch (dashStyle) {
				case 'dashed':
					ctx.beginPath();
					path.makeDashedPath(ctx, this._dashLength);
					break;
				case 'dotted':
					var oldLineWidth = ctx.lineWidth;
					ctx.lineWidth *= 2;
					ctx.beginPath();
					path.makeDottedPath(ctx, this._dotSpacing);
					break;
				case 'solid':
				default:
					if (!filled) {
						ctx.beginPath();
						path.makePath(ctx);
					}
			}
			ctx.stroke();
			if (oldLineWidth) ctx.lineWidth = oldLineWidth;
		}
	},
	
	/*
		Method: _unescape
		
		Unescapes quotes in XDot files
	*/
	_unescape: function(str) {
		var matches = str.match(/^"(.*)"$/);
		if (matches) {
			return matches[1].replace(/\\"/g, '"');
		} else {
			return str;
		}
	},
	
	/*
		Method: _parseHexColor
		
		Parses RGBA colors from XDot files
	*/
	_parseHexColor: function(color) {
		var matches = color.match(/^#([0-9a-f]{2})\s*([0-9a-f]{2})\s*([0-9a-f]{2})\s*([0-9a-f]{2})?$/i);
		if (matches) {
			var canvasColor, textColor = '#' + matches[1] + matches[2] + matches[3], opacity = 1;
			if (matches[4]) { // rgba
				opacity = parseInt(matches[4], 16) / 255;
				canvasColor = 'rgba(' + parseInt(matches[1], 16) + ',' + parseInt(matches[2], 16) + ',' + parseInt(matches[3], 16) + ',' + opacity + ')';
			} else { // rgb
				canvasColor = textColor;
			}
		}
		return {canvasColor: canvasColor, textColor: textColor, opacity: opacity};
	},
	
	/*
		Method: _hsvToRgbColor
		
		Converts H/S/V color values to a RGB css string
	*/
	_hsvToRgbColor: function(h, s, v) {
		var i, f, p, q, t, r, g, b;
		h *= 360;
		i = Math.floor(h / 60) % 6;
		f = h / 60 - i;
		p = v * (1 - s);
		q = v * (1 - f * s);
		t = v * (1 - (1 - f) * s);
		switch (i) {
			case 0: r = v; g = t; b = p; break;
			case 1: r = q; g = v; b = p; break;
			case 2: r = p; g = v; b = t; break;
			case 3: r = p; g = q; b = v; break;
			case 4: r = t; g = p; b = v; break;
			case 5: r = v; g = p; b = q; break;
		}
		return 'rgb(' + Math.round(255 * r) + ',' + Math.round(255 * g) + ',' + Math.round(255 * b) + ')';
	},
	
	/*
		Method: _versionCompare
		
		Compares two XDot versions, telling if one is greater than the other.
	*/
	_versionCompare: function(a, b) {
		a = a.split('.');
		b = b.split('.');
		var a1, b1;
		while (a.length || b.length) {
			a1 = a.length ? a.shift() : 0;
			b1 = b.length ? b.shift() : 0;
			if (a1 < b1) return -1;
			if (a1 > b1) return 1;
		}
		return 0;
	},
	
	// Handles the mouse wheel event
	_handleMouseWheel: function(event) {
		if(!this._allowMouseScrolling)
			return;
	
		if(!event)
			event = window.event;
			
		var delta = 0;
		if(event.wheelDelta) {
			delta = event.wheelDelta / 120;
			if(window.opera)
				delta = -delta;
		}
		else if(event.detail) {
			delta = -event.detail / 3;
		}
		
		if(delta) {
			this.setScale(this.getScale() + delta / 10);
		}
		
		return DotUtils.preventDefault(event);
	},
	
	/*
		Field: _idMatch
		
		A regular expression representing an alphanumeric string or a number or a double-quoted string or an HTML string
	*/
	_idMatch: '([a-zA-Z\u0080-\uFFFF_][0-9a-zA-Z\u0080-\uFFFF_]*|-?(?:\\.\\d+|\\d+(?:\\.\\d*)?)|"(?:\\\\"|[^"])*"|<(?:<[^>]*>|[^<>]+?)+>)'
});

Dot.prototype._nodeIdMatch = Dot.prototype._idMatch + '(?::' + Dot.prototype._idMatch + ')?(?::' + Dot.prototype._idMatch + ')?';
Dot.prototype._graphMatchRe = new RegExp('^(strict\\s+)?(graph|digraph)(?:\\s+' + Dot.prototype._idMatch + ')?\\s*{$', 'i');
Dot.prototype._subgraphMatchRe = new RegExp('^(?:subgraph\\s+)?' + Dot.prototype._idMatch + '?\\s*{$', 'i');
Dot.prototype._nodeMatchRe = new RegExp('^(' + Dot.prototype._nodeIdMatch + ')\\s+\\[(.+)\\];$');
Dot.prototype._edgeMatchRe = new RegExp('^(' + Dot.prototype._nodeIdMatch + '\\s*-[->]\\s*' + Dot.prototype._nodeIdMatch + ')\\s+\\[(.+)\\];$');
Dot.prototype._attrMatchRe = new RegExp('^' + Dot.prototype._idMatch + '=' + Dot.prototype._idMatch + '(?:[,\\s]+|$)');

