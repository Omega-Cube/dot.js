// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

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

