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
		func - {Method} The function to bind the context to
	
	Returns:
	
		{Method} The function bound to the context
*/
DotUtils.bind = function(context, func) {
    return function() {
      return func.apply(context, Array.prototype.slice.call(arguments));
    }
}

/*
	Method: ajaxGet
	
	Static, Sends a simple asynchronous GET request
	
	Parameters:
	
		url - {String} The URL to send the request to
		params - {object} An object containing a list of parameters that should be attached to the url before sending the request.
		         This parameter is optionnal (can be undefined or null)
		onComplete - {Method} A callback function that will be called when the request completes.
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
	
	try {
		xhr.open("GET", url, true);
	}
	catch(e) {
		xhr = new ActiveXObject('Microsoft.XMLHTTP');
		xhr.open("GET", url, true);
	}
	xhr.onreadystatechange = handlereadystatechange;
	xhr.send();
}

/*
	Method: extend
	
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

/*
	Method: addEventHandler
	
	Static, registers a function with the specified event on the specified element
	
	Parameters:
	
		element - {HTMLElement} The element to register the function on
		event - {String} The name of the event
		callback - {Method} A function that will be called when the event occurs.
		
	See Also:
	
		<removeEventHandler>
*/
DotUtils.addEventHandler = function(element, event, callback) {
	if(element.addEventListener) {
		if(event == 'mousewheel')
			element.addEventListener('DOMMouseScroll', callback, false);
		element.addEventListener(event, callback, false);
	}
	else if(element.attachEvent)
		element.attachEvent('on' + event, callback);
}

/*
	Method: removeEventHandler
	
	Static, unregisters a function that was registered with <addEventHandler> earlier
	
	Parameters:
	
		element - {HTMLElement} The element to register the function on
		event - {String} The name of the event
		callback - {Method} A function that will be called when the event occurs.
	
	See Also:
	
		<addEventHandler>
*/
DotUtils.removeEventHandler = function(element, event, callback) {
	if(element.removeEventHandler) {
		if(event == 'mousewheel')
			element.removeEventHandler('DOMMouseScroll', callback, false);
		element.removeEventHandler(event, callback, false);
	}
	else if(element.detachEvent)
		element.detachEvent('on' + event, callback);
		
}

DotUtils.preventDefault = function(event) {
	if(event.preventDefault)
		event.preventDefault();
	if(event.stopPropagation)
		event.stopPropagation();
	event.cancelBubble = true;
	event.cancel = true;
	event.returnValue = true;
	return false;
}

// As the original project's objet model is Prototype's one, this script actually 
// contains some bits of Prototype required to support the existing Dot classes.

/*
	Method: createClass
	
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
      klass.prototype.initialize = DotUtils.emptyMethod;

    klass.prototype.constructor = klass;

    return klass;
}

// Object model support method
DotUtils.emptyMethod = function() {};

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