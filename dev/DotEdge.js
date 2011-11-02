// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

/*
	Class: DotEdge
	
	Represents an XDot Edge entity
*/
var DotEdge = DotUtils.createClass(DotEntity, {
	initialize: function($super, name, dot, rootGraph, parentGraph, tailNode, headNode) {
		$super('_edgeAttrs', name, dot, rootGraph, parentGraph, parentGraph);
		this._tailNode = tailNode;
		this._headNode = headNode;
	}
});

DotEdge.prototype._escStringMatchRe = /\\([EGTHL])/g;