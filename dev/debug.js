// This file should be compiled into dot.js only for profiling purposes.
// It wraps native calls into custom functions, so that the profilers can
// measure their performances individually.

// The basic idea is explained here :
// http://andrewtwest.com/2011/03/26/profiling-built-in-javascript-functions-with-firebug/

if(window.console.firebug !== undefined) {
	// We put here a list of the native methods we want to profile
	
	//// CanvasRenderingContext2D
	var p = CanvasRenderingContext2D.prototype;
	
	p._fillRect = p.fillRect;
	p.fillRect = function(x, y, width, height) { 
		this._fillRect(x, y, width, height); 
	}
	
	p._drawImage = p.drawImage;
	p.drawImage = function(image, sx, sy, sw, sh, dx, dy, dw, dh) { 
		this._drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh); 
	}
	
	//// Math
	p = Math;
	
	p._round = p.round;
	p.round = function(number) { return this._round(number); }
	
	
	function __debug(message) {
		console.log(message);
	}
}
