// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

/*
	Class: DotGraph
	
	Represents an XDot Graph entity
*/
var DotGraph = DotUtils.createClass(DotEntity, {

	/*
		Constructor: initialize
		
		Initializes new instances of the DotGraph class
		
		Parameters:
		
			$super - {Function} The parent class constructor
			name - {String} The graph name
			dot - {Dot} The associated Dot instance
			rootgraph - To be determined
			parentGraph - To be determined
	*/
	initialize: function($super, name, dot, rootGraph, parentGraph) {
		$super('_attrs', name, dot, rootGraph, parentGraph, this);
		this._nodeAttrs = {};
		this._edgeAttrs = {};
		this._nodes = [];
		this._edges = [];
		this._subgraphs = [];
	},
	_initBB: function() {
		var coords = this.getAttr('bb').split(',');
		this._bbRect = new Rect(coords[0], this._dot._height - coords[1], coords[2], this._dot._height - coords[3]);
	},
	_draw: function($super, ctx, ctxScale, redrawCanvasOnly) {
		$super(ctx, ctxScale, redrawCanvasOnly);
		var entities = [this._subgraphs, this._nodes, this._edges];
		for(var i = 0, l = entities.length; i < l; ++i) {
			var type = entities[i];
			for(var j = 0, m = type.length; j < m; ++j) {
				var ent = type[j];
				ent._draw(ctx, ctxScale, redrawCanvasOnly);
			};
		};
	}
});

DotGraph.prototype.escStringMatchRe = /\\([GL])/g;
