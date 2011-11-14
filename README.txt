DOT.JS
======


Introduction
------------

DOT.JS is a library for drawing Graphviz graphs to a web browser canvas. It is
designed to be used by web applications that need to display or edit graphs, as
a replacement for sending graphs as bitmapped images and image maps.


Installation
------------

To use Dot.js in your website, follow these steps
- Include dot.min.js as a javascript import in your page
- Optionnaly, you can also include x11colors.min.js (after dot.min.js) for full
  colors support, and/or conditionnaly include ExCanvas (before dot.min.js) for
  IE6 compatibility.
  Note : Be careful not to include ExCanvas when the browser actually supports 
  standard canvas. Dot.js will use ExCanvas as soon as it is available, without
  checking for alternate methods first.
- Place a <div> tag on the page where you want to place your graph
- In a javascript function, create an instance of the Dot class, specifying the
  container div and the url of the XDot file you want to display.
  

Demo and testing
----------------

If you want to run the demo (located in the "testing" folder) or just run some
tests, all you have to do is copy Dot.min.js and x11colors.min.js from the
root directory, then run index.html in a browser.


Changing the script
-------------------

If you need to change something in the existing script, the preferred way is to
apply your changes in /dev/dot.js or the other Javascript files in this folder.
When you are done, run the build.py script in order to update the minimized
scripts at the root of the project (and in the testing folder). This script
requires python 3.2 to run.
Note that the build script requires a working internet connection. It is also
recommended that you have NaturalDoc installed and available in your PATH, so
the build script can update the documentation files as well.
If you want to use the testing page with your new version of the script, but
wish to have a human readable version of the script for debugging purposes, 
you can provide the -d switch to the build script. In that case the script
will just merge the files, without minimizing them. The Closure compiler will
still be used to detect warnings and errors.

License
-------

Dot.js is provided under the terms of the MIT license. See the file LICENSE.txt

Dot.js supports the use of some other software, including the Excanvas library,
and the Graphviz software, which have licenses of their own.


Disclaimers & Contributors
--------------------------

This project is based on a September 2011 fork from Ryan Schmidt's Canviz
project (http://canviz.org)

Canviz itself used Oliver Steele's Bezier.js library for Bezier path
computation (http://osteele.com/sources/javascript/docs/bezier)

The build script uses Google's Closure Compiler
http://code.google.com/closure/compiler/

Technical documentation is formatted to work with the Natural Docs generator
http://www.naturaldocs.org/
