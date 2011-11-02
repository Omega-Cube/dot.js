// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

/*
	Class: DotImage
	
	An image that can be embedded in a graph
	
*/
var DotImage = DotUtils.createClass({
	/*
		Constructor: initialize
		
		Initializes new instances of the DotGraph class
		
		Parameters:

			dot - {Dot} The dot instance this image will be attached to
			src - {String} The path the image can be found at. This path 
					must be set relatively to the dot parameter's
					ImagePath property.

		See Also:
	
			<Dot.setImagePath>
	*/
	initialize: function(dot, src) {
		this._dot = dot;
		++this._dot.numImages;
		this._finished = this._loaded = false;
		this._img = new Image();
		this._img.onload = this._onLoad.bind(this);
		this._img.onerror = this._onFinish.bind(this);
		this._img.onabort = this._onFinish.bind(this);
		this._img.src = this._dot.imagePath + src;
	},
	
	_onLoad: function() {
		this._loaded = true;
		this.onFinish();
	},
	
	_onFinish: function() {
		this._finished = true;
		++this._dot._numImagesFinished;
		if (this._dot._numImages == this._dot._numImagesFinished) {
			this._dot._draw(true);
		}
	},
	
	_draw: function(ctx, l, t, w, h) {
		if (this._finished) {
			if (this._loaded) {
				ctx.drawImage(this._img, l, t, w, h);
			} else {
				debug('can\'t load image ' + this._img.src);
				this._drawBrokenImage(ctx, l, t, w, h);
			}
		}
	},
	
	_drawBrokenImage: function(ctx, l, t, w, h) {
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
