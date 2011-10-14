// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

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
