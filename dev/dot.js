// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

/*
	Class: DotUtils
	
	A class that contains internal support methods.
*/
var DotUtils = function() {
}

/*
	Field: escapeContainer
	
	{HTMLElement} Static, DOM div element used for HTML escaping
*/
DotUtils.escapeContainer = null;

/*
	Field: escapeText
	
	{DOMText} Static, DOM text element used for HTML escaping
*/
DotUtils.escapeText = null;

/*
	Method: escapeHtml
	
	Static, Escapes HTML code from a string
	
	Parameters:
	
		str - {String} The string you want to escape
	
	Returns:
	
		{String} The escaped string
*/
DotUtils.escapeHtml = (function() {
	DotUtils.escapeContainer = document.createElement('div');
	DotUtils.escapeText = document.createTextNode('');
	DotUtils.escapeContainer.appendChild(DotUtils.escapeText);
	
	realEscape = function(str) {
		DotUtils.escapeText.data = str;
		return DotUtils.escapeContainer.innerHTML;
	}
	
	return realEscape;
})()

/*
	Method: setHtml
	
	Static, Inserts the specified HTML code inside an element, without script tags
	
	Parameters:
	
		e - {HTMLElement} The element to write the content to
		content - {String} The HTML code to insert into the element
*/
DotUtils.setHtml = function(e, content) {
	// Bare minimum : escape JS tags
	content = content.replace(/<script[^>]*>([\\S\\s]*?)<\/script>/img, '');
	
	e.innerHTML = content;
}

/*
	Method: bind
	
	Static, Binds a function to a specified context
	
	Parameters:
	
		context - {mixed} The element to bind the function to
				  That means the function will be executed with this value in the this keyword
		func - {Function} The function to bind the context to
	
	Returns:
	
		{Function} The function bound to the context
*/
DotUtils.bind = function(context, func) {
    return function() {
      return func.apply(context, Array.prototype.slice.call(arguments));
    }
}

/*
	Function: ajaxGet
	
	Static, Sends a simple asynchronous GET request
	
	Parameters:
	
		url - {String} The URL to send the request to
		params - {object} An object containing a list of parameters that should be attached to the url before sending the request.
		         This parameter is optionnal (can be undefined or null)
		onComplete - {Function} A callback function that will be called when the request completes.
		             It will be called with a string parameter containing the raw response's body.
*/
DotUtils.ajaxGet = function(url, params, onComplete) {
	// This implementation should work in most cases...
	// Note that parameter support is minimal and may need some tweaking
	var xhr = null;
	
	function handlereadystatechange() {
		if(xhr.readyState == 4) {
			if(xhr.status == 200) {
				onComplete(xhr.responseText);
			}
			else if(xhr.status == 0) {
				// This typically happens when you execute local library tests, where 
				// browsers refuses to load local files asynchronously for security reasons. 
				// The funny thing is, most of them will still fill responseText with 
				// the actual contents of the file, ready to be used.
				alert("It seems you have some cross-domain access issues. Dot.js does not support cross-domain loading (yet ?). I'll still try to load your data but the app might get unstable.");
				onComplete(xhr.responseText);
			}
		}
		
	}
	
	if(window.XMLHttpRequest) {
		xhr = new window.XMLHttpRequest;
	}
	else {
		try {
			xhr = new ActiveXObject('MSXML2.XMLHTTP.3.0');
		}
		catch(ex) {
			xhr = null;
		}
	}
	
	if(xhr === null) {
		alert('Your browser does not support basic AJAX requests');
	}
	
	if(typeof params !== 'undefined' && params !== null) {
		var isFirst = false;
		if(url.indexOf('?') > -1)
			idFirst = false;
		for(p in params) {
			if(isFirst) {
				url += '?';
				isFirst = false;
			}
			else
				url += '&';
			
			url += escape(p) + '=' + escape(params[p]);
		}
	}
	
	xhr.open("GET", url, true);
	xhr.onreadystatechange = handlereadystatechange;
	xhr.send();
}

/*
	Function: extend
	
	Static, Extends an object with the contents of another one
	
	Parameters:
	
		destination - {object} The object that should receive the source's members
		source - {object} An object whose members should be copied to the destination object
		
	Returns:
	
		{object} The destination object
*/
DotUtils.extend = function(destination, source) {
  for (var property in source)
    destination[property] = source[property];
  return destination;
}

// As the original project's objet model is Prototype's one, this script actually 
// contains some bits of Prototype required to support the existing Dot classes.

/*
	Function: createClass
	
	Static, Creates a class with the provided members
	
	Parameters:
	
		parent - {class} (optionnal) The new class superclass
		members - {object} An object containing the new class fields and methods
	
	Returns:
		
		{class} The new class constructor
*/
DotUtils.createClass = function() {
    var parent = null, properties = Array.prototype.slice.call(arguments);
    if (typeof properties[0] === 'function')
      parent = properties.shift();

    function klass() {
      this.initialize.apply(this, arguments);
    }

    klass.superclass = parent;

    if (parent) {
      var subclass = function() { };
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
    }

    for (var i = 0; i < properties.length; i++)
      DotUtils.addMethods(klass, properties[i]);

    if (!klass.prototype.initialize)
      klass.prototype.initialize = DotUtils.emptyFunction;

    klass.prototype.constructor = klass;

    return klass;
}

// Object model support method
DotUtils.emptyFunction = function() {};

// Object model support method
DotUtils.addMethods = function(that, source) {
    var ancestor   = that.superclass && that.superclass.prototype;
	var properties = [];
	for(var property in source) {
		properties.push(property);
	}

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && (typeof value === 'function') &&
          DotUtils.argumentNames(value)[0] == "$super") {
        var method = value;
        value = (function(m) {
          return function() { return ancestor[m].apply(this, arguments) };
        })(property);
		value = DotUtils.wrap(value, method);
      }
      that.prototype[property] = value;
    }

    return that;
}

// Object model support method
DotUtils.argumentNames = function(value) {
	var names = value.toString().match(/^[\s\(]*function[^(]*\(([^\)]*)\)/)[1].replace(/\s+/g, '').split(',');
	return names.length == 1 && !names[0] ? [] : names;
}

// Object model support method
DotUtils.wrap = function(that, wrapper) {
    return function() {
      return wrapper.apply(this, [DotUtils.bind(this, that)].concat(Array.prototype.slice.call(arguments)));
    }
}

/*
	Class: DotTokenizer
	
	XDot tokenizer implementation
*/
var DotTokenizer = DotUtils.createClass({
	/*
		Constructor: initialize
		
		Initializes the tokenizer with a text to parse
		
		Parameters:
		
			str - {string} The XDot file contents
	*/
	initialize: function(str) {
		this.str = str;
	},
	takeChars: function(num) {
		if (!num) {
			num = 1;
		}
		var tokens = new Array();
		while (num--) {
			var matches = this.str.match(/^(\S+)\s*/);
			if (matches) {
				this.str = this.str.substr(matches[0].length);
				tokens.push(matches[1]);
			} else {
				tokens.push(false);
			}
		}
		if (1 == tokens.length) {
			return tokens[0];
		} else {
			return tokens;
		}
	},
	takeNumber: function(num) {
		if (!num) {
			num = 1;
		}
		if (1 == num) {
			return Number(this.takeChars());
		} else {
			var tokens = this.takeChars(num);
			while (num--) {
				tokens[num] = Number(tokens[num]);
			}
			return tokens;
		}
	},
	takeString: function() {
		var byteCount = Number(this.takeChars()), charCount = 0, charCode;
		if ('-' != this.str.charAt(0)) {
			return false;
		}
		while (0 < byteCount) {
			++charCount;
			charCode = this.str.charCodeAt(charCount);
			if (0x80 > charCode) {
				--byteCount;
			} else if (0x800 > charCode) {
				byteCount -= 2;
			} else {
				byteCount -= 3;
			}
		}
		var str = this.str.substr(1, charCount);
		this.str = this.str.substr(1 + charCount).replace(/^\s+/, '');
		return str;
	}
});

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

/*
	Class: DotNode
	
	Represents an XDot Node entity
*/
var DotNode = DotUtils.createClass(DotEntity, {
	initialize: function($super, name, dot, rootGraph, parentGraph) {
		$super('nodeAttrs', name, dot, rootGraph, parentGraph, parentGraph);
	}
});
DotUtils.extend(DotNode.prototype, {
	escStringMatchRe: /\\([NGL])/g
});

/*
	Class: DotEdge
	
	Represents an XDot Edge entity
*/
var DotEdge = DotUtils.createClass(DotEntity, {
	initialize: function($super, name, dot, rootGraph, parentGraph, tailNode, headNode) {
		$super('edgeAttrs', name, dot, rootGraph, parentGraph, parentGraph);
		this.tailNode = tailNode;
		this.headNode = headNode;
	}
});
DotUtils.extend(DotEdge.prototype, {
	escStringMatchRe: /\\([EGTHL])/g
});

/*
	Class: DotGraph
	
	Represents an XDot Graph entity
*/
var DotGraph = DotUtils.createClass(DotEntity, {
	initialize: function($super, name, dot, rootGraph, parentGraph) {
		$super('attrs', name, dot, rootGraph, parentGraph, this);
		this.nodeAttrs = {};
		this.edgeAttrs = {};
		this.nodes = [];
		this.edges = [];
		this.subgraphs = [];
	},
	initBB: function() {
		var coords = this.getAttr('bb').split(',');
		this.bbRect = new Rect(coords[0], this.dot.height - coords[1], coords[2], this.dot.height - coords[3]);
	},
	draw: function($super, ctx, ctxScale, redrawCanvasOnly) {
		$super(ctx, ctxScale, redrawCanvasOnly);
		var entities = [this.subgraphs, this.nodes, this.edges];
		for(var i = 0, l = entities.length; i < l; ++i) {
			var type = entities[i];
			for(var j = 0, m = type.length; j < m; ++j) {
				var ent = type[j];
				ent.draw(ctx, ctxScale, redrawCanvasOnly);
			};
		};
	}
});
DotUtils.extend(DotGraph.prototype, {
	escStringMatchRe: /\\([GL])/g
});

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
			url - {string} The URL of the initial XDot file
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
		this.padding = 8;
		this.dashLength = 6;
		this.dotSpacing = 4;
		this.graphs = [];
		this.images = {};
		this.numImages = 0;
		this.numImagesFinished = 0;
		if (url) {
			this.load(url, urlParams);
		}
	},
	
	/*
		Method: setScale
		
		Sets the display scale of the graph
		
		Parameters:
		
			scale - {float} The new scale to apply. 1 is original size.
	*/
	setScale: function(scale) {
		this.scale = scale;
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

/*
	Class: DotImage
	
	An image that can be embedded in a graph
*/
var DotImage = DotUtils.createClass({
	initialize: function(dot, src) {
		this.dot = dot;
		++this.dot.numImages;
		this.finished = this.loaded = false;
		this.img = new Image();
		this.img.onload = this.onLoad.bind(this);
		this.img.onerror = this.onFinish.bind(this);
		this.img.onabort = this.onFinish.bind(this);
		this.img.src = this.dot.imagePath + src;
	},
	onLoad: function() {
		this.loaded = true;
		this.onFinish();
	},
	onFinish: function() {
		this.finished = true;
		++this.dot.numImagesFinished;
		if (this.dot.numImages == this.dot.numImagesFinished) {
			this.dot.draw(true);
		}
	},
	draw: function(ctx, l, t, w, h) {
		if (this.finished) {
			if (this.loaded) {
				ctx.drawImage(this.img, l, t, w, h);
			} else {
				debug('can\'t load image ' + this.img.src);
				this.drawBrokenImage(ctx, l, t, w, h);
			}
		}
	},
	drawBrokenImage: function(ctx, l, t, w, h) {
		ctx.save();
		ctx.beginPath();
		new Rect(l, t, l + w, t + w).draw(ctx);
		ctx.moveTo(l, t);
		ctx.lineTo(l + w, t + w);
		ctx.moveTo(l + w, t);
		ctx.lineTo(l, t + h);
		ctx.strokeStyle = '#f00';
		ctx.lineWidth = 1;
		ctx.stroke();
		ctx.restore();
	}
});

function debug(str, escape) {
	str = String(str);
	if (typeof escape === 'undefined') {
		escape = true;
	}
	if (escape) {
		str = str.escapeHTML();
	}
	document.getElementById('debug_output').innerHTML += '&raquo;' + str + '&laquo;<br />';
}

/*
	Class: Point

	Represents a point in a graph
*/
var Point = DotUtils.createClass({
	initialize: function(x, y) {
		this.x = x;
		this.y = y;
	},
	offset: function(dx, dy) {
		this.x += dx;
		this.y += dy;
	},
	distanceFrom: function(point) {
		var dx = this.x - point.x;
		var dy = this.y - point.y;
		return Math.sqrt(dx * dx + dy * dy);
	},
	makePath: function(ctx) {
		ctx.moveTo(this.x, this.y);
		ctx.lineTo(this.x + 0.001, this.y);
	}
});

/*
	Class: Bezier
	
	A set of <Point> instances joined by Bezier curves.
	
	Note that this class caches some of it's metrics. This means that two consecutive 
	calls to resource-intensive methods wll return the same result, even if you manually changed
	the points data between the two. Such cached methods are identified in the documentation
	as "Caching methods". If you need to force these methods to update their values, call the
	<reset> method.
	
	Some method descriptions may be inaccurate on a mathematical point of view. Feel free to
	send fixes if needed.
	
	Most of this class was taken or inspired by Oliver Steele's bezier.js library.
	(http://osteele.com/sources/javascript/docs/bezier)
*/
var Bezier = DotUtils.createClass({
	/*
		Constructor: initialize
		
		Initializes a new Bezier instance with the specified points
		
		Parameters:
		
			points - {array} An array of <Point> instances
	*/
	initialize: function(points) {
		this.points = points;
		this.order = points.length;
	},
	
	/*
		Field: pathCommands
		
		{array} Wrapper functions to work around Safari, in which, up to at least 2.0.3,
		fn.apply isn't defined on the context primitives.
	*/
	pathCommands: [
		null,
		// This will have an effect if there's a line thickness or end cap.
		function(x, y) {
			this.lineTo(x + 0.001, y);
		},
		function(x, y) {
			this.lineTo(x, y);
		},
		function(x1, y1, x2, y2) {
			this.quadraticCurveTo(x1, y1, x2, y2);
		},
		function(x1, y1, x2, y2, x3, y3) {
			this.bezierCurveTo(x1, y1, x2, y2, x3, y3);
		}
	],
	

	
	/*
		Method: reset
		
		Clears all the cached values of this instance.
		
		This method forces all the methods caching their results to fully recompute the next time they're called.
		Such methods are marked as "caching methods" in the documentation.
	*/
	reset: function() {
		with (Bezier.prototype) {
			this.controlPolygonLength = controlPolygonLength;
			this.chordLength = chordLength;
			this.triangle = triangle;
			this.chordPoints = chordPoints;
			this.coefficients = coefficients;
		}
	},
	
	/*
		Method: offset
		
		Translates all the points of this figure by the specified coordinates.
		
		Note that calling this method will clear this instance's cached values.
		
		Parameters:
		
			dx - {Number} The translation vector length along the X axis
			dy - {Number} The translation vector length along the Y axis
	*/
	offset: function(dx, dy) {
		for(var i = 0, l = this.points.length; i < l; ++i) {
			this.points[i].offset(dx, dy);
		}
		this.reset();
	},
	
	/*
		Method: getBB
		
		Returns the bounding box of this shape
		
		Returns:
			
			{Rect} A <Rect> instance representing the Bezier bounding box
	*/
	getBB: function() {
		if (!this.order) return undefined;
		var l, t, r, b, p = this.points[0];
		l = r = p.x;
		t = b = p.y;
		for(var i = 0, l = this.points.length; i < l; ++i) {
			var point = this.points[i];
			l = Math.min(l, point.x);
			t = Math.min(t, point.y);
			r = Math.max(r, point.x);
			b = Math.max(b, point.y);
		};
		var rect = new Rect(l, t, r, b);
		return (this.getBB = function() {return rect;})();
	},
	
	/*
		Method: isPointInBB
		
		Indicates whether a specified point is inside or outside the Bezier's bounding box
		
		Parameters:
		
			x - {Number} The X coordinate of the tested point
			y - {Number} The Y coordinate of the tested point
			tolerance - {Number} Optionnal. The maximum distance between the tested point and the bounding
						box edge before the point is considered outside. Default is 0.
						
		Returns:
		
			{Boolean} True if the point hits the bouding box, false otherwise.
	*/
	isPointInBB: function(x, y, tolerance) {
		if (typeof tolerance === 'undefined') tolerance = 0;
		var bb = this.getBB();
		if (0 < tolerance) {
			bb = DotUtils.extend({}, bb); // clone
			bb.inset(-tolerance, -tolerance);
		}
		return !(x < bb.l || x > bb.r || y < bb.t || y > bb.b);
	},
	
	/*
		Method: isPointOnBezier
		
		Determines whether a specified point is located inside or outside the Bezier's shape
		
		Parameters:
		
			x - {Number} The X coordinates of the tested point
			y - {Number} The Y coordinates of the tested point
			tolerance - {Number} Optionnal. The maximum distance between the tested point and the
						shape's edge before the point is considered outside. Default is 0.
		
		Returns:
		
			{Boolean} True if the point hits the bouding box, false otherwise.
	*/
	isPointOnBezier: function(x, y, tolerance) {
		if (typeof tolerance === 'undefined') tolerance = 0;
		if (!this.isPointInBB(x, y, tolerance)) return false;
		var segments = this.chordPoints();
		var p1 = segments[0].p;
		var p2, x1, y1, x2, y2, bb, twice_area, base, height;
		for (var i = 1; i < segments.length; ++i) {
			p2 = segments[i].p;
			x1 = p1.x;
			y1 = p1.y;
			x2 = p2.x;
			y2 = p2.y;
			bb = new Rect(x1, y1, x2, y2);
			if (bb.isPointInBB(x, y, tolerance)) {
				twice_area = Math.abs(x1 * y2 + x2 * y + x * y1 - x2 * y1 - x * y2 - x1 * y);
				base = p1.distanceFrom(p2);
				height = twice_area / base;
				if (height <= tolerance) return true;
			}
			p1 = p2;
		}
		return false;
	},
	
	/*
		Method: controlPolygonLength
		
		Returns the length of the most direct path between each point 
		of the shape. This is a cached method.
		
		Returns:
		
			{Number} The cumulative distance between all the shape's points.
	*/
	controlPolygonLength: function() {
		var len = 0;
		for (var i = 1; i < this.order; ++i) {
			len += this.points[i - 1].distanceFrom(this.points[i]);
		}
		return (this.controlPolygonLength = function() {return len;})();
	},

	/*
		Method: chordLength
		
		Returns the length of the chord. This is a cached method.
		
		Returns:
		
			{Number} The length of the chord, which is the distance 
			between the forst and the last point of the shape.
	*/
	chordLength: function() {
		var len = this.points[0].distanceFrom(this.points[this.order - 1]);
		return (this.chordLength = function() {return len;})();
	},
	
	/*
		Method: triangle
		
		Return the Schneider triangle of successive midpoints.
		This is a cached method.
		
		The left and right edges are the points of the two
		Beziers that split this one at the midpoint.
	*/
	triangle: function() {
		var upper = this.points;
		var m = [upper];
		for (var i = 1; i < this.order; ++i) {
			var lower = [];
			for (var j = 0; j < this.order - i; ++j) {
				var c0 = upper[j];
				var c1 = upper[j + 1];
				lower[j] = new Point((c0.x + c1.x) / 2, (c0.y + c1.y) / 2);
			}
			m.push(lower);
			upper = lower;
		}
		return (this.triangle = function() {return m;})();
	},
	
	/*
		Method: trangleAtT
		
		Returns the Schneider triangle with a specified parametric midpoint.
		
		Parameters :
			t - {Number} Optionnal. Default is 0.5.
	*/
	triangleAtT: function(t) {
		var s = 1 - t;
		var upper = this.points;
		var m = [upper];
		for (var i = 1; i < this.order; ++i) {
			var lower = [];
			for (var j = 0; j < this.order - i; ++j) {
				var c0 = upper[j];
				var c1 = upper[j + 1];
				lower[j] = new Point(c0.x * s + c1.x * t, c0.y * s + c1.y * t);
			}
			m.push(lower);
			upper = lower;
		}
		return m;
	},
	
	/*
		Method: split
		
		Returns two beziers resulting from splitting this bezier at 
		the specified parametric midpoint.
		
		Parameters:
		
			t - {Number} Optionnal. Default is 0.5
			
		Returns: 
		
			An object containing two properties :
		
				left - A <Bezier> instance containing the points on the left of the midpoint.
				right - A <Bezier> instance containing the points on the right of the midpoint.
	*/
	split: function(t) {
		if ('undefined' == typeof t) t = 0.5;
		var m = (0.5 == t) ? this.triangle() : this.triangleAtT(t);
		var leftPoints  = new Array(this.order);
		var rightPoints = new Array(this.order);
		for (var i = 0; i < this.order; ++i) {
			leftPoints[i]  = m[i][0];
			rightPoints[i] = m[this.order - 1 - i][i];
		}
		return {left: new Bezier(leftPoints), right: new Bezier(rightPoints)};
	},
	
	/*
		Method: mid
		
		Returns a bezier which is the portion of this bezier from t1 to t2.
		
		Thanks to Peter Zin on comp.graphics.algorithms.
		
		Parameters:
		
			t1 - {Number} The left limit of the fragment
			t2 - {Number} The right limit of the fragment
			
		Returns:
			
			{Bezier} A <Bezier> instance containing the points 
			between the specified left and right limits.
	*/
	mid: function(t1, t2) {
		return this.split(t2).left.split(t1 / t2).right;
	},
	
	/*
		Method: chordPoints
		
		Returns points (and their corresponding times in the bezier) that form
		an approximate polygonal representation of the bezier.
		This is a cached method.
	
		Based on the algorithm described in Jeremy Gibbons' dashed.ps.gz
		
		Returns:
		
			{array} An array of objects containing the following properties :
			
				tStart - {Number}
				tEnd - {Number}
				dt - {Number} Distance between tStart and tEnd
				p - {Point} A <Point> instance
	*/
	chordPoints: function() {
		var p = [{tStart: 0, tEnd: 0, dt: 0, p: this.points[0]}].concat(this._chordPoints(0, 1));
		return (this.chordPoints = function() {return p;})();
	},
	
	// Internal.
	_chordPoints: function(tStart, tEnd) {
		var tolerance = 0.001;
		var dt = tEnd - tStart;
		if (this.controlPolygonLength() <= (1 + tolerance) * this.chordLength()) {
			return [{tStart: tStart, tEnd: tEnd, dt: dt, p: this.points[this.order - 1]}];
		} else {
			var tMid = tStart + dt / 2;
			var halves = this.split();
			return halves.left._chordPoints(tStart, tMid).concat(halves.right._chordPoints(tMid, tEnd));
		}
	},
	
	/*
		Method: markedEvery
		
		Returns an array of times between 0 and 1 that mark the bezier evenly
		in space.
		
		Based in part on the algorithm described in Jeremy Gibbons' dashed.ps.gz
		
		Parameters:
			distance - {Number} The distance between each point on the bezier
			firstDistance - {Number} The distance between the first Bezier's 
							point and the first returned point 
		
		Returns:
		
			{object} An object containing the following properties :
			
				times - {array} An array of times
				nextDistance - {Number} The distance between the last returned 
							   time and the end of the bezier shape
	*/
	markedEvery: function(distance, firstDistance) {
		var nextDistance = firstDistance || distance;
		var segments = this.chordPoints();
		var times = [];
		var t = 0; // time
		var dt; // delta t
		var segment;
		var remainingDistance;
		for (var i = 1; i < segments.length; ++i) {
			segment = segments[i];
			segment.length = segment.p.distanceFrom(segments[i - 1].p);
			if (0 == segment.length) {
				t += segment.dt;
			} else {
				dt = nextDistance / segment.length * segment.dt;
				segment.remainingLength = segment.length;
				while (segment.remainingLength >= nextDistance) {
					segment.remainingLength -= nextDistance;
					t += dt;
					times.push(t);
					if (distance != nextDistance) {
						nextDistance = distance;
						dt = nextDistance / segment.length * segment.dt;
					}
				}
				nextDistance -= segment.remainingLength;
				t = segment.tEnd;
			}
		}
		return {times: times, nextDistance: nextDistance};
	},

	/*
		Method: coefficients
		
		Return the coefficients of the polynomials for x and y in t.
		This is a cached method.
		
		Returns:
		
			{object} An object containing the following properties :
			
				xs - {Number}
				ys - {Number}
	*/
	coefficients: function() {
		// This function deals with polynomials, represented as
		// arrays of coefficients.  p[i] is the coefficient of n^i.
		
		// p0, p1 => p0 + (p1 - p0) * n
		// side-effects (denormalizes) p0, for convienence
		function interpolate(p0, p1) {
			p0.push(0);
			var p = new Array(p0.length);
			p[0] = p0[0];
			for (var i = 0; i < p1.length; ++i) {
				p[i + 1] = p0[i + 1] + p1[i] - p0[i];
			}
			return p;
		}
		// folds +interpolate+ across a graph whose fringe is
		// the polynomial elements of +ns+, and returns its TOP
		function collapse(ns) {
			while (ns.length > 1) {
				var ps = new Array(ns.length-1);
				for (var i = 0; i < ns.length - 1; ++i) {
					ps[i] = interpolate(ns[i], ns[i + 1]);
				}
				ns = ps;
			}
			return ns[0];
		}
		// xps and yps are arrays of polynomials --- concretely realized
		// as arrays of arrays
		var xps = [];
		var yps = [];
		for (var i = 0, pt; pt = this.points[i++]; ) {
			xps.push([pt.x]);
			yps.push([pt.y]);
		}
		var result = {xs: collapse(xps), ys: collapse(yps)};
		return (this.coefficients = function() {return result;})();
	},
	
	// Return the point at time t.
	// From Oliver Steele's bezier.js library.
	/*
		Method: pointAtT
		
		Returns the point at a specified time along the path.
		This is a cached method.
		
		Parameters:
		
			t - {Number} The parametric position along the path of the point
			
		Returns:
		
			{Point} The coordinates of the point
	*/
	pointAtT: function(t) {
		var c = this.coefficients();
		var cx = c.xs, cy = c.ys;
		// evaluate cx[0] + cx[1]t +cx[2]t^2 ....
		
		// optimization: start from the end, to save one
		// muliplicate per order (we never need an explicit t^n)
		
		// optimization: special-case the last element
		// to save a multiply-add
		var x = cx[cx.length - 1], y = cy[cy.length - 1];
		
		for (var i = cx.length - 1; --i >= 0; ) {
			x = x * t + cx[i];
			y = y * t + cy[i];
		}
		return new Point(x, y);
	},
	
	/*
		Method: makePath
		
		Render the Bezier to a WHATWG 2D canvas context, 
		using a solid line style.
		
		Parameters:
		
			ctx - {CanvasRenderingContext2D} A 2D canvas rendering context
			moveTo - {Boolean} Optionnal. Determines if the shape should be 
					drawn on the absolute position defined by its points (true)
					or relatively to the current context position (false).
	*/
	makePath: function (ctx, moveTo) {
		if ('undefined' == typeof moveTo) moveTo = true;
		if (moveTo) ctx.moveTo(this.points[0].x, this.points[0].y);
		var fn = this.pathCommands[this.order];
		if (fn) {
			var coords = [];
			for (var i = 1 == this.order ? 0 : 1; i < this.points.length; ++i) {
				coords.push(this.points[i].x);
				coords.push(this.points[i].y);
			}
			fn.apply(ctx, coords);
		}
	},
	
	
	/*
		Method: makeDashedPath
		
		Render the Bezier to a WHATWG 2D canvas context, 
		using a dashed line style.
		
		Parameters:
		
			ctx - {CanvasRenderingContext2D} A 2D canvas rendering context
			dashLength - {Number} Length of a dash
			firstDistance - {Number} Optionnal. Distance between the start 
							of the path and the first point. Default is the
							value of the dashLength parameter.
			drawFirst - {Boolean} Optionnal. Specifies whether the distance
						between the start of the path and the first point 
						should be filled or empty. Default is true.
	*/
	makeDashedPath: function(ctx, dashLength, firstDistance, drawFirst) {
		if (!firstDistance) firstDistance = dashLength;
		if ('undefined' == typeof drawFirst) drawFirst = true;
		var markedEvery = this.markedEvery(dashLength, firstDistance);
		if (drawFirst) markedEvery.times.unshift(0);
		var drawLast = (markedEvery.times.length % 2);
		if (drawLast) markedEvery.times.push(1);
		for (var i = 1; i < markedEvery.times.length; i += 2) {
			this.mid(markedEvery.times[i - 1], markedEvery.times[i]).makePath(ctx);
		}
		return {firstDistance: markedEvery.nextDistance, drawFirst: drawLast};
	},

	/*
		Method: makeDashedPath
		
		Render the Bezier to a WHATWG 2D canvas context, 
		using a dashed line style.
		
		Parameters:
		
			ctx - {CanvasRenderingContext2D} A 2D canvas rendering context
			dotSpacing - {Number} Space between each dot
			firstDistance - {Number} Optionnal. Distance between the start 
							of the path and the first dot. Default is the
							value of the dotSpacing parameter.
	*/
	makeDottedPath: function(ctx, dotSpacing, firstDistance) {
		if (!firstDistance) firstDistance = dotSpacing;
		var markedEvery = this.markedEvery(dotSpacing, firstDistance);
		if (dotSpacing == firstDistance) markedEvery.times.unshift(0);
		for(var i = 0, l = markedEvery.times.length; i < l; ++i) {
			this.pointAtT(markedEvery.times[i]).makePath(ctx);
		};
		return markedEvery.nextDistance;
	}
});

var Path = DotUtils.createClass({
	initialize: function(segments) {
		this.segments = segments || [];
	},
	setupSegments: function() {},
	// Based on Oliver Steele's bezier.js library.
	addBezier: function(pointsOrBezier) {
		this.segments.push(pointsOrBezier instanceof Array ? new Bezier(pointsOrBezier) : pointsOrBezier);
	},
	offset: function(dx, dy) {
		if (0 == this.segments.length) this.setupSegments();
		for(var i = 0, l = this.segments.length; i < l; ++i) {
			this.segments[i].offset(dx, dy);
		};
	},
	getBB: function() {
		if (0 == this.segments.length) this.setupSegments();
		var l, t, r, b, p = this.segments[0].points[0];
		l = r = p.x;
		t = b = p.y;
		for(var i = 0, m = this.segments.length; i < m; ++i) {
			var points = this.segments[i].points;
			for(var j = 0, n = points.length; j < n; ++j) {
				var point = points[j];
				l = Math.min(l, point.x);
				t = Math.min(t, point.y);
				r = Math.max(r, point.x);
				b = Math.max(b, point.y);
			};
		};
		var rect = new Rect(l, t, r, b);
		return (this.getBB = function() {return rect;})();
	},
	isPointInBB: function(x, y, tolerance) {
		if (typeof tolerance === 'undefined') tolerance = 0;
		var bb = this.getBB();
		if (0 < tolerance) {
			bb = DotUtils.extend({}, bb);
			bb.inset(-tolerance, -tolerance);
		}
		return !(x < bb.l || x > bb.r || y < bb.t || y > bb.b);
	},
	isPointOnPath: function(x, y, tolerance) {
		if (typeof tolerance === 'undefined') tolerance = 0;
		if (!this.isPointInBB(x, y, tolerance)) return false;
		var result = false;
		for(var i = 0, l = this.segments.length; i < l; ++i) {
			if (this.segments[i].isPointOnBezier(x, y, tolerance)) {
				result = true;
				throw $break;
			}
		};
		return result;
	},
	isPointInPath: function(x, y) {
		return false;
	},
	// Based on Oliver Steele's bezier.js library.
	makePath: function(ctx) {
		if (0 == this.segments.length) this.setupSegments();
		var moveTo = true;
		for(var i = 0, l = this.segments.length; i < l; ++i) {
			this.segments[i].makePath(ctx, moveTo);
			moveTo = false;
		};
	},
	makeDashedPath: function(ctx, dashLength, firstDistance, drawFirst) {
		if (0 == this.segments.length) this.setupSegments();
		var info = {
			drawFirst: ('undefined' == typeof drawFirst) ? true : drawFirst,
			firstDistance: firstDistance || dashLength
		};
		for(var i = 0, l = this.segments.length; i < l; ++i) {
			info = this.segments[i].makeDashedPath(ctx, dashLength, info.firstDistance, info.drawFirst);
		};
	},
	makeDottedPath: function(ctx, dotSpacing, firstDistance) {
		if (0 == this.segments.length) this.setupSegments();
		if (!firstDistance) firstDistance = dotSpacing;
		for(var i = 0, l = this.segments.length; i < l; ++i) {
			firstDistance = this.segments[i].makeDottedPath(ctx, dotSpacing, firstDistance);
		};
	}
});

var Polygon = DotUtils.createClass(Path, {
	initialize: function($super, points) {
		this.points = points || [];
		$super();
	},
	setupSegments: function() {
		for(var i = 0, l = this.points.length; i < l; ++i) {
			var next = i + 1;
			if (l == next) next = 0;
			this.addBezier([
				this.points[i],
				this.points[next]
			]);
		}
	}
});

var Rect = DotUtils.createClass(Polygon, {
	initialize: function($super, l, t, r, b) {
		this.l = l;
		this.t = t;
		this.r = r;
		this.b = b;
		$super();
	},
	inset: function (ix, iy) {
		this.l += ix;
		this.t += iy;
		this.r -= ix;
		this.b -= iy;
		return this;
	},
	expandToInclude: function(rect) {
		this.l = Math.min(this.l, rect.l);
		this.t = Math.min(this.t, rect.t);
		this.r = Math.max(this.r, rect.r);
		this.b = Math.max(this.b, rect.b);
	},
	getWidth: function() {
		return this.r - this.l;
	},
	getHeight: function() {
		return this.b - this.t;
	},
	setupSegments: function($super) {
		var w = this.getWidth();
		var h = this.getHeight();
		this.points = [
			new Point(this.l, this.t),
			new Point(this.l + w, this.t),
			new Point(this.l + w, this.t + h),
			new Point(this.l, this.t + h)
		];
		$super();
	}
});

var Ellipse = DotUtils.createClass(Path, {
	KAPPA: 0.5522847498,
	initialize: function($super, cx, cy, rx, ry) {
		this.cx = cx; // center x
		this.cy = cy; // center y
		this.rx = rx; // radius x
		this.ry = ry; // radius y
		$super();
	},
	setupSegments: function() {
		this.addBezier([
			new Point(this.cx, this.cy - this.ry),
			new Point(this.cx + this.KAPPA * this.rx, this.cy - this.ry),
			new Point(this.cx + this.rx, this.cy - this.KAPPA * this.ry),
			new Point(this.cx + this.rx, this.cy)
		]);
		this.addBezier([
			new Point(this.cx + this.rx, this.cy),
			new Point(this.cx + this.rx, this.cy + this.KAPPA * this.ry),
			new Point(this.cx + this.KAPPA * this.rx, this.cy + this.ry),
			new Point(this.cx, this.cy + this.ry)
		]);
		this.addBezier([
			new Point(this.cx, this.cy + this.ry),
			new Point(this.cx - this.KAPPA * this.rx, this.cy + this.ry),
			new Point(this.cx - this.rx, this.cy + this.KAPPA * this.ry),
			new Point(this.cx - this.rx, this.cy)
		]);
		this.addBezier([
			new Point(this.cx - this.rx, this.cy),
			new Point(this.cx - this.rx, this.cy - this.KAPPA * this.ry),
			new Point(this.cx - this.KAPPA * this.rx, this.cy - this.ry),
			new Point(this.cx, this.cy - this.ry)
		]);
	}
});