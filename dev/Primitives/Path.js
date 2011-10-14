// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

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
