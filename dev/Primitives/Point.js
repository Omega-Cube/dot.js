// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

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
