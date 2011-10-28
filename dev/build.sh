#!/bin/sh
MYDIR="$( cd "$( dirname "$0" )" && pwd )"

curl -d "compilation_level=SIMPLE_OPTIMIZATIONS" -d "output_format=text" -d "output_info=compiled_code" \
--data-urlencode "js_code@$MYDIR/DotUtils.js" \
--data-urlencode "js_code@$MYDIR/dot.js" \
--data-urlencode "js_code@$MYDIR/DotTokenizer.js" \
--data-urlencode "js_code@$MYDIR/DotEntity.js" \
--data-urlencode "js_code@$MYDIR/DotNode.js" \
--data-urlencode "js_code@$MYDIR/DotEdge.js" \
--data-urlencode "js_code@$MYDIR/DotGraph.js" \
--data-urlencode "js_code@$MYDIR/DotImage.js" \
--data-urlencode "js_code@$MYDIR/Primitives/Point.js" \
--data-urlencode "js_code@$MYDIR/Primitives/Bezier.js" \
--data-urlencode "js_code@$MYDIR/Primitives/Path.js" \
--data-urlencode "js_code@$MYDIR/Primitives/Polygon.js" \
--data-urlencode "js_code@$MYDIR/Primitives/Rect.js" \
--data-urlencode "js_code@$MYDIR/Primitives/Ellipse.js" \
-o "$MYDIR/comp-out.js" http://closure-compiler.appspot.com/compile

# Copy the code to root directory and test directory
cp "$MYDIR/comp-out.js" "$MYDIR/../dot.min.js"
cp "$MYDIR/comp-out.js" "$MYDIR/../testing/dot.min.js"

#same with the x11 colors file
curl -d "compilation_level=SIMPLE_OPTIMIZATIONS" -d "output_format=text" -d "output_info=compiled_code" --data-urlencode "js_code@$MYDIR/x11colors.js" -o "$MYDIR/comp-out-colors.js" http://closure-compiler.appspot.com/compile
cp "$MYDIR/comp-out-colors.js" "$MYDIR/../x11colors.min.js"
cp "$MYDIR/comp-out-colors.js" "$MYDIR/../testing/x11colors.min.js"

#Generate documentation
"$MYDIR/../docs/build-doc.sh"

