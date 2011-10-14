// Dot.js library
// Licenced under MIT terms (see joined LICENCE.txt file)

/*
	Class: DotNode
	
	Represents an XDot Node entity
*/
var DotNode = DotUtils.createClass(DotEntity, {
	initialize: function($super, name, dot, rootGraph, parentGraph) {
		$super('nodeAttrs', name, dot, rootGraph, parentGraph, parentGraph);
	}
});
DotUtils.extend(DotNode.prototype, {
	escStringMatchRe: /\\([NGL])/g
});
