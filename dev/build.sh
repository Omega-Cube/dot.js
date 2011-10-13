#!/bin/sh
MYDIR="$( cd "$( dirname "$0" )" && pwd )"

#Download compiled code
curl -d "compilation_level=SIMPLE_OPTIMIZATIONS" -d "output_format=text" -d "output_info=compiled_code" --data-urlencode "js_code@$MYDIR/dot.js" -o "$MYDIR/comp-out.js" http://closure-compiler.appspot.com/compile

# Copy the code to root directory and test directory
cp "$MYDIR/comp-out.js" "$MYDIR/../dot.min.js"
mv "$MYDIR/comp-out.js" "$MYDIR/../testing/dot.min.js"

#same with the x11 colors file
curl -d "compilation_level=SIMPLE_OPTIMIZATIONS" -d "output_format=text" -d "output_info=compiled_code" --data-urlencode "js_code@$MYDIR/x11colors.js" -o "$MYDIR/comp-out.js" http://closure-compiler.appspot.com/compile
cp "$MYDIR/comp-out.js" "$MYDIR/../x11colors.min.js"
mv "$MYDIR/comp-out.js" "$MYDIR/../testing/x11colors.min.js"

#Generate documentation
"$MYDIR/../docs/build-doc.sh"

