DOT.JS
======


Introduction
------------

DOT.JS is a library for drawing Graphviz graphs to a web browser canvas. It is
designed to be used by web applications that need to display or edit graphs, as
a replacement for sending graphs as bitmapped images and image maps.

This project is based on a September 2011 fork from Ryan Schmidt's Canviz project (http://canviz.org)

Installation
------------

To use Dot.js in your website, follow these steps
- Include Dot.js as a javascript import in your page
- Optionnaly, you can also include x11colors.js (after Dot.js) for full colors support, 
  and/or conditionnaliy include ExCanvas (before Dot.js) for IE6 compatibility.
  Node : Be careful not to include ExCanvas when the browser actually supports standard canvas.
  Dot.js will use ExCanvas as soon as it is available, without checking for alternate methods first.
- Place a <div> tag on the page where you want to place your graph
- In a javascript function, create an instance of the Dot class, specifying the container div and
  the url of the XDot file you want to display.
  
Demo and testing
----------------

If you want to run the demo (located in the "testing" folder) or just run some tests, all you have to do is
copy Dot.js and x11colors.js from the "dev" or root directory, then run index.html in a browser.

License
-------

Dot.js is provided under the terms of the MIT license. See the file LICENSE.txt.

Dot.js supports the use of some other software, including the Excanvas library, and the Graphviz 
software, which have licenses of their own.
