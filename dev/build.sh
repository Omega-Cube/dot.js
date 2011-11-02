#!/bin/sh
MYDIR="$( cd "$( dirname "$0" )" && pwd )"

checkerrors() {
	errcount=`xmllint --xpath "count(//error)" "$1"`
	if [ $errcount -eq 0 ]
	then
		# No errors, proceed
		return 0
	else
		# Errors. Show them
		echo ""
		echo "$errcount ERRORS were found by the closure compiler :"
		
		for a in `seq $errcount`
		do
			text=`xmllint --xpath "//error[$a]/text()" "$1"`
			lineno=`xmllint --xpath "//error[$a]/@lineno" "$1" | cut -d'"' -f2`
			charno=`xmllint --xpath "//error[$a]/@charno" "$1" | cut -d'"' -f2`
			errtype=`xmllint --xpath "//error[$a]/@type" "$1" | cut -d'"' -f2`
			linetxt=`xmllint --xpath "//error[$a]/@line" "$1" | cut -d'"' -f2`
			filename=`xmllint --xpath "//error[$a]/@file" "$1" | cut -d'"' -f2`
			
			echo "$errtype in $filename, line $lineno, char $charno" 1>&2
			echo "   $linetxt" 1>&2
			echo "   $text" 1>&2
		done
		
		return $errcount
	fi
}

showwarnings() {
	warncount=`xmllint --xpath "count(//warning)" "$1"`
	
	if [ $warncount -ne 0 ]
	then
		echo "$warncount WARNINGS were found by the compiler"
		for a in `seq $warncount`
		do
			text=`xmllint --xpath "//warning[$a]/text()" "$1"`
			lineno=`xmllint --xpath "//warning[$a]/@lineno" "$1" | cut -d'"' -f2`
			charno=`xmllint --xpath "//warning[$a]/@charno" "$1" | cut -d'"' -f2`
			warntype=`xmllint --xpath "//warning[$a]/@type" "$1" | cut -d'"' -f2`
			linetxt=`xmllint --xpath "//warning[$a]/@line" "$1" | cut -d'"' -f2`
			filename=`xmllint --xpath "//warning[$a]/@file" "$1" | cut -d'"' -f2`

			echo "$warntype in $filename, line $lineno, char $charno"
			echo "   $linetxt"
			echo "   $text"		
		done
	fi
}

extractcode() {
	if [ -e "$2" ]
	then
		rm "$2"
	fi
	
	# Get the compiled element text, and unescape it
	xmllint --xpath "/compilationResult/compiledCode/text()" "$1" | sed "s/\&amp;/\&/g;s/\&gt;/>/g;s/\&lt;/</g;s/\&apos;/'/g" > "$2"
}

curl -d "compilation_level=SIMPLE_OPTIMIZATIONS" -d "output_format=xml" \
-d "output_info=errors" -d "output_info=warnings" -d "output_info=compiled_code" \
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
-o "$MYDIR/comp-out.xml" http://closure-compiler.appspot.com/compile

echo ""

# Show warnings if any
showwarnings "$MYDIR/comp-out.xml"

#Check for errors
checkerrors "$MYDIR/comp-out.xml"

if [ $? -ne 0 ]
then
	echo "Leaving. Fix the errors !"
	exit 1
fi

# Extract compiled code
extractcode "$MYDIR/comp-out.xml" "$MYDIR/comp-out.js"

# Copy the code to root directory and test directory
cp "$MYDIR/comp-out.js" "$MYDIR/../dot.min.js"
cp "$MYDIR/comp-out.js" "$MYDIR/../testing/dot.min.js"

echo "----"

#same with the x11 colors file
curl -d "compilation_level=SIMPLE_OPTIMIZATIONS" -d "output_format=xml" \
-d "output_info=errors" -d "output_info=warnings" -d "output_info=compiled_code" \
--data-urlencode "js_code@$MYDIR/x11colors.js" -o "$MYDIR/comp-out-colors.xml" http://closure-compiler.appspot.com/compile

echo ""

# Show warnings if any
showwarnings "$MYDIR/comp-out-colors.xml"

#Check for errors
checkerrors "$MYDIR/comp-out-colors.xml"

if [ $? -ne 0 ]
then
	echo "Leaving. Fix the errors !"
	exit 1
fi

# Extract compiled code
extractcode "$MYDIR/comp-out-colors.xml" "$MYDIR/comp-out-colors.js"

cp "$MYDIR/comp-out-colors.js" "$MYDIR/../x11colors.min.js"
cp "$MYDIR/comp-out-colors.js" "$MYDIR/../testing/x11colors.min.js"

#Generate documentation
"$MYDIR/../docs/build-doc.sh"

