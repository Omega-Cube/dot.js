// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

/*
	Class: DotGraph
	
	Represents an XDot Graph entity
*/
var DotGraph = DotUtils.createClass(DotEntity, {
	initialize: function($super, name, dot, rootGraph, parentGraph) {
		$super('attrs', name, dot, rootGraph, parentGraph, this);
		this.nodeAttrs = {};
		this.edgeAttrs = {};
		this.nodes = [];
		this.edges = [];
		this.subgraphs = [];
	},
	initBB: function() {
		var coords = this.getAttr('bb').split(',');
		this.bbRect = new Rect(coords[0], this.dot.height - coords[1], coords[2], this.dot.height - coords[3]);
	},
	draw: function($super, ctx, ctxScale, redrawCanvasOnly) {
		$super(ctx, ctxScale, redrawCanvasOnly);
		var entities = [this.subgraphs, this.nodes, this.edges];
		for(var i = 0, l = entities.length; i < l; ++i) {
			var type = entities[i];
			for(var j = 0, m = type.length; j < m; ++j) {
				var ent = type[j];
				ent.draw(ctx, ctxScale, redrawCanvasOnly);
			};
		};
	}
});
DotUtils.extend(DotGraph.prototype, {
	escStringMatchRe: /\\([GL])/g
});
