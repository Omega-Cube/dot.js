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
		this.canvas = document.createElement('canvas');
		this.canvas.style.position = 'absolute';
		if (!Dot.canvasCounter) Dot.canvasCounter = 0;
		this.canvas.id = 'dot_canvas_' + ++Dot.canvasCounter;
		this.elements = document.createElement('div');
		this.elements.style.position = 'absolute';
		this.container = document.getElementById(container);
		this.container.style.position = 'relative';
		this.container.appendChild(this.canvas);
		
		if (typeof G_vmlCanvasManager !== 'undefined') {
			G_vmlCanvasManager.initElement(this.canvas);
			this.canvas = document.getElementById(this.canvas.id);
		}
		this.container.appendChild(this.elements);
		this.ctx = this.canvas.getContext('2d');
		
		this.scale = 1;
		this.minimumScale = 0.5;
		this.maximumScale = 2;
		this.padding = 8;
		this.dashLength = 6;
		this.dotSpacing = 4;
		this.graphs = [];
		this.images = {};
		this.numImages = 0;
		this.numImagesFinished = 0;
		this.graphLoaded = false;
		this.allowMouseScrolling = true;
		
		if (url) {
			this.load(url, urlParams);
		}
		
		DotUtils.addEventHandler(this.container, 'mousewheel', DotUtils.bind(this, this._handleMouseWheel));
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
		this.scale = (+scale);
		
		if(this.scale < this.minimumScale)
			this.scale = this.minimumScale;
		
		if(this.scale > this.maximumScale)
			this.scale = this.maximumScale;
		
		if(this.graphLoaded)
			this.draw();
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
		return this.scale;
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
	
		if(value > this.maximumScale)
			value = this.maximumScale;
		
		if(value <= 0)
			value = 0.001;

		this.minimumScale = value;

		if(this.scale < value)
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
		return this.minimumScale;
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
		
		if(value < this.minimumScale)
			value = this.minimumScale;
		
		this.maximumScale = value;
		
		if(this.scale > this.maximumScale)
			this.setScale(this.maximumScale);
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
		return this.maximumScale;
	},
	
	/*
		Method: setAllowMouseScrolling
		
		Sets a boolean indicating whether the graph scale is automatically 
		changed by the user's mouse scroll.
		
		Parameters:
			
			value - {Boolean} True if the scale should be updated by the mouse's scroll wheel, false otherwise.
	*/
	setAllowMouseScrolling: function(value) {
		this.allowMouseScrolling = !!value;
	},
	
	/*
		Method: getAllowMouseScrolling
		
		Gets a boolean indicating whether the graph scale is automatically 
		changed by the user's mouse scroll.
		
		Returns:
		
			{Boolean} True if the mouse's scroll wheel updates the scale, false otherwise.
	*/
	getAllowMouseScrolling: function() {
		return this.allowMouseScrolling;
	},
	
	/*
		Method: setImagePath
		
		Sets the base path where images specified by XDot files will be searched for.
		
		Parameters:
		
			imagePath - {String} The base directory containing the graph images.
	*/
	setImagePath: function(imagePath) {
		this.imagePath = imagePath;
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
		this.graphs = [];
		this.width = 0;
		this.height = 0;
		this.maxWidth = false;
		this.maxHeight = false;
		this.bbEnlarge = false;
		this.bbScale = 1;
		this.dpi = 96;
		this.bgcolor = {opacity: 1};
		this.bgcolor.canvasColor = this.bgcolor.textColor = '#ffffff';
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
					matches = line.match(this.graphMatchRe);
					if (matches) {
						rootGraph = new DotGraph(matches[3], this);
						containers.unshift(rootGraph);
						containers[0].strict = (typeof matches[1] !== 'undefined');
						containers[0].type = ('graph' == matches[2]) ? 'undirected' : 'directed';
						containers[0].attrs['xdotversion'] = '1.0';
						this.graphs.push(containers[0]);
//						debug('graph: ' + containers[0].name);
					}
				} else {
					matches = line.match(this.subgraphMatchRe);
					if (matches) {
						containers.unshift(new DotGraph(matches[1], this, rootGraph, containers[0]));
						containers[1].subgraphs.push(containers[0]);
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
					matches = line.match(this.nodeMatchRe);
					if (matches) {
						entityName = matches[2];
						attrs = matches[5];
						drawAttrHash = containers[0].drawAttrs;
						isGraph = false;
						switch (entityName) {
							case 'graph':
								attrHash = containers[0].attrs;
								isGraph = true;
								break;
							case 'node':
								attrHash = containers[0].nodeAttrs;
								break;
							case 'edge':
								attrHash = containers[0].edgeAttrs;
								break;
							default:
								entity = new DotNode(entityName, this, rootGraph, containers[0]);
								attrHash = entity.attrs;
								drawAttrHash = entity.drawAttrs;
								containers[0].nodes.push(entity);
						}
//						debug('node: ' + entityName);
					} else {
						matches = line.match(this.edgeMatchRe);
						if (matches) {
							entityName = matches[1];
							attrs = matches[8];
							entity = new DotEdge(entityName, this, rootGraph, containers[0], matches[2], matches[5]);
							attrHash = entity.attrs;
							drawAttrHash = entity.drawAttrs;
							containers[0].edges.push(entity);
//							debug('edge: ' + entityName);
						}
					}
					if (matches) {
						do {
							if (0 == attrs.length) {
								break;
							}
							matches = attrs.match(this.attrMatchRe);
							if (matches) {
								attrs = attrs.substr(matches[0].length);
								attrName = matches[1];
								attrValue = this.unescape(matches[2]);
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
											this.width  = Number(bb[2]);
											this.height = Number(bb[3]);
											break;
										case 'bgcolor':
											this.bgcolor = rootGraph.parseColor(attrValue);
											break;
										case 'dpi':
											this.dpi = attrValue;
											break;
										case 'size':
											var size = attrValue.match(/^(\d+|\d*(?:\.\d+)),\s*(\d+|\d*(?:\.\d+))(!?)$/);
											if (size) {
												this.maxWidth  = 72 * Number(size[1]);
												this.maxHeight = 72 * Number(size[2]);
												this.bbEnlarge = ('!' == size[3]);
											} else {
												debug('can\'t parse size');
											}
											break;
										case 'xdotversion':
											if (0 > this.versionCompare(this.maxXdotVersion, attrHash['xdotversion'])) {
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
		this.draw();
		
		this.graphLoaded = true;
	},
	
	/*
		Method: draw
		
		Updates the graph graphics
		
		This method is generally triggered from other methods, so you should not have to call it explicitely
		
		Parameters:
		
			redrawCanvasOnly - {Boolean} Optionnal. Defines if the method should only redraw the canvas contents
								or if the entire DOM tree should be updated. Default is false.
	*/
	draw: function(redrawCanvasOnly) {
		if (typeof redrawCanvasOnly === 'undefined') redrawCanvasOnly = false;
		var ctxScale = this.scale * this.dpi / 72;
		var width  = Math.round(ctxScale * this.width  + 2 * this.padding);
		var height = Math.round(ctxScale * this.height + 2 * this.padding);
		if (!redrawCanvasOnly) {
			this.canvas.width  = width;
			this.canvas.height = height;
			this.canvas.style.width = width + 'px';
			this.canvas.style.height = height + 'px';
			this.container.style.width = width + 'px';
			while (this.elements.firstChild) {
				this.elements.removeChild(this.elements.firstChild);
			}
		}
		this.ctx.save();
		this.ctx.lineCap = 'round';
		this.ctx.fillStyle = this.bgcolor.canvasColor;
		this.ctx.fillRect(0, 0, width, height);
		this.ctx.translate(this.padding, this.padding);
		this.ctx.scale(ctxScale, ctxScale);
		this.graphs[0].draw(this.ctx, ctxScale, redrawCanvasOnly);
		this.ctx.restore();
	},
	
	/*
		Method: drawPath
		
		Draws the specified path on the graph surface
	*/
	drawPath: function(ctx, path, filled, dashStyle) {
		if (filled) {
			ctx.beginPath();
			path.makePath(ctx);
			ctx.fill();
		}
		if (ctx.fillStyle != ctx.strokeStyle || !filled) {
			switch (dashStyle) {
				case 'dashed':
					ctx.beginPath();
					path.makeDashedPath(ctx, this.dashLength);
					break;
				case 'dotted':
					var oldLineWidth = ctx.lineWidth;
					ctx.lineWidth *= 2;
					ctx.beginPath();
					path.makeDottedPath(ctx, this.dotSpacing);
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
		Method: unescape
		
		Unescapes quotes in XDot files
	*/
	unescape: function(str) {
		var matches = str.match(/^"(.*)"$/);
		if (matches) {
			return matches[1].replace(/\\"/g, '"');
		} else {
			return str;
		}
	},
	
	/*
		Method: parseHexColor
		
		Parses RGBA colors from XDot files
	*/
	parseHexColor: function(color) {
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
		Method: hsvToRgbColor
		
		Converts H/S/V color values to a RGB css string
	*/
	hsvToRgbColor: function(h, s, v) {
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
		Method: versionCompare
		
		Compares two XDot versions, telling if one is greater than the other.
	*/
	versionCompare: function(a, b) {
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
		if(!this.allowMouseScrolling)
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
		Field: idMatch
		
		A regular expression representing an alphanumeric string or a number or a double-quoted string or an HTML string
	*/
	idMatch: '([a-zA-Z\u0080-\uFFFF_][0-9a-zA-Z\u0080-\uFFFF_]*|-?(?:\\.\\d+|\\d+(?:\\.\\d*)?)|"(?:\\\\"|[^"])*"|<(?:<[^>]*>|[^<>]+?)+>)'
});

/*
	Field: nodeIdMatch
	
	Regex looking up ID or ID:port or ID:compassPoint or ID:port:compassPoint
*/
Dot.prototype.nodeIdMatch = Dot.prototype.idMatch + '(?::' + Dot.prototype.idMatch + ')?(?::' + Dot.prototype.idMatch + ')?';
Dot.prototype.graphMatchRe = new RegExp('^(strict\\s+)?(graph|digraph)(?:\\s+' + Dot.prototype.idMatch + ')?\\s*{$', 'i');
Dot.prototype.subgraphMatchRe = new RegExp('^(?:subgraph\\s+)?' + Dot.prototype.idMatch + '?\\s*{$', 'i');
Dot.prototype.nodeMatchRe = new RegExp('^(' + Dot.prototype.nodeIdMatch + ')\\s+\\[(.+)\\];$');
Dot.prototype.edgeMatchRe = new RegExp('^(' + Dot.prototype.nodeIdMatch + '\\s*-[->]\\s*' + Dot.prototype.nodeIdMatch + ')\\s+\\[(.+)\\];$');
Dot.prototype.attrMatchRe = new RegExp('^' + Dot.prototype.idMatch + '=' + Dot.prototype.idMatch + '(?:[,\\s]+|$)');

