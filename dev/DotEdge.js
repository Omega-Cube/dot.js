// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

/*
	Class: DotEdge
	
	Represents an XDot Edge entity
*/
var DotEdge = DotUtils.createClass(DotEntity, {
	initialize: function($super, name, dot, rootGraph, parentGraph, tailNode, headNode) {
		$super('edgeAttrs', name, dot, rootGraph, parentGraph, parentGraph);
		this.tailNode = tailNode;
		this.headNode = headNode;
	}
});
DotUtils.extend(DotEdge.prototype, {
	escStringMatchRe: /\\([EGTHL])/g
});
