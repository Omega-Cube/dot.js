// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

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