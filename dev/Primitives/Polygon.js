// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

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