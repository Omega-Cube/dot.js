#/usr/bin/python

import pyclosure
import sys
import os.path
import shutil
import subprocess

def process_results(result, out_file_name):
    basePath = os.path.realpath(os.path.dirname(os.path.realpath(__file__)) + "/..")
    for w in result.warnings:
        print("WARN: " + str(w))

    for e in result.errors:
        print("ERROR: " + str(e))

    if result.errors:
        print("Errors occured. Output files will not be produced.");
    else:
        dest1 = os.path.abspath(basePath + '/' + out_file_name)
        dest2 = os.path.abspath(basePath + '/testing/' + out_file_name)
        open(dest1, 'w').write(result.compiled_code)
        shutil.copyfile(dest1, dest2)


if __name__ == "__main__":
    debug = "-d" in sys.argv
    basePath = os.path.dirname(os.path.realpath(__file__))

    if debug:
        print("Debug mode on")
    
    mainFiles = [
        basePath + "/DotUtils.js",
        basePath + "/dot.js",
        basePath + "/DotTokenizer.js",
        basePath + "/DotEntity.js",
        basePath + "/DotNode.js",
        basePath + "/DotEdge.js",
        basePath + "/DotGraph.js",
        basePath + "/DotImage.js",
        basePath + "/Primitives/Point.js",
        basePath + "/Primitives/Bezier.js",
        basePath + "/Primitives/Path.js",
        basePath + "/Primitives/Polygon.js",
        basePath + "/Primitives/Rect.js",
        basePath + "/Primitives/Ellipse.js"
        ]

    colorFiles = basePath + "/x11colors.js"

    try:
        print("Compiling main file...")
        result = pyclosure.compile(mainFiles, debug=debug)
        process_results(result, "dot.min.js")
        print("Done !")

        print("Compiling colors file...")
        result = pyclosure.compile(colorFiles, debug=debug)
        process_results(result, "x11colors.min.js")
        print("Done !")
    except pyclosure.ServerError as err:
        print("The Closure Compiler returned with a fatal error :")
        for e in err.errors:
            print(e)
    
    docDir = os.path.abspath(basePath + "/../docs")
    command = 'NaturalDocs --input "' + basePath + '" --output HTML "' + docDir + '" --project "' + os.path.abspath(docDir + '/project') + '"'
    print(command)
    subprocess.call(command, shell=True)