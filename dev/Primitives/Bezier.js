// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

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
