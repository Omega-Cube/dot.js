#!/usr/bin/env python3.2

import http.client

#class InvalidResponse(http.client.HTTPException):
#    """ Exception raised when the Closure Compilder URL
#        returned an HTTP return code other than 200 """
#    def __init__(self, code, message):
#        self.code = code
#        self.message = message

#    def __str__(self):
#        return "%s : %s" % (self.code, self.message)

# That kinda sucks (see notes about the state var in ClosureResult's constructor)... Better idea anyone ?
class _Namespace: pass

class ServerError(http.client.HTTPException):
    """ Exception raised when the Closure Compiler 
        returned a server error 
        
        """
    def __init__(self, data):
        self.errors = data

class ClosureMessage:
    """ Represents a message sent by the Closure Compiler """
    def __init__(self, line, char, description, text, id, file, is_error):
        self.line = line
        self.char = char
        self.description = description
        self.text = text
        self.id = id
        self.file = file
        self.is_error = is_error

    def __str__(self):
        char_marker = ''.join(' ' for i in range(self.char)) + '^'
        return """%s: %s at line %d character %d\n%s\n%s""" % (self.id, self.description, self.line, self.char, self.text, char_marker)

class ClosureResult:
    """ Contains the Closure Compiler output, returned by 
        a call to the compile method
        
        """
    def __init__(self, closure_message):
        import xml.parsers.expat

        # Initialize state
        self.errors = []
        self.warnings = []
        self.compiled_code = None
        self.original_size = 0
        self.compressed_size = 0
        self.compile_time = 0

        # Reading state holders
        # Here I made this state object so xmlstart can modify 
        # current_section_type without creating its own local value
        # I don't really like creating a class just for that purpose,
        # but I don't see any other way yet
        state = _Namespace()
        state.current_section_type = None
        state.current_section_attrs = None
        state.server_error = False
        state.server_errors_list = []

        # XML handler functions
        def xmlstart(name, attrs):
            state.current_section_type = name
            state.current_section_attrs = attrs

        def xmlcontent(text):
            if state.current_section_type == "error":
                if state.server_error:
                    state.server_errors_list.append(state.current_section_attrs['code'], text)
                else:
                    csa = state.current_section_attrs
                    self.errors.append(ClosureMessage(
                        int(csa["lineno"]),
                        int(state.current_section_attrs['charno']),
                        text,
                        state.current_section_attrs['line'],
                        state.current_section_attrs['type'],
                        state.current_section_attrs['file'],
                        True))
            elif state.current_section_type == "warning":
                self.warnings.append(ClosureMessage(
                    int(state.current_section_attrs["lineno"]),
                    int(state.current_section_attrs['charno']),
                    text,
                    state.current_section_attrs['line'],
                    state.current_section_attrs['type'],
                    state.current_section_attrs['file'],
                    False))
            elif state.current_section_type == "compiledCode":
                self.compiled_code = self.compiled_code or ''
                self.compiled_code += text
            elif state.current_section_type == "serverErrors":
                state.server_error = True
            elif state.current_section_type == "originalSize":
                self.original_size = int(text)
            elif state.current_section_type == "compressedSize":
                self.compressed_size = int(text)
            elif state.current_section_type == "compileTime":
                self.compile_time = int(text)

        #self.section_managers[state.current_section_type](text)

        if state.server_error:
            raise ServerError(state.server_errors_list)

        parser = xml.parsers.expat.ParserCreate()

        parser.StartElementHandler = xmlstart
        parser.CharacterDataHandler = xmlcontent

        parser.Parse(closure_message)



def compile(files, debug=False):
    """ Shrinks the specified list of Javascript files into a single one.

        If the debug parameter is false, the script is processed by Google's
        Closure Compiler service, with a SIMPLE_OPTIMIZATIONS compilation level.
        
        If the debug parameter is True, then the files will only be joined
        without any minimizing. This was made to allow easier debugging during
        the developpement process. Note that this will still call the Closure
        Compiler service in order to get the statistics, warnings and errors.
        The compiled script, however, will not be the script minimized by 
        the compiler.
        
        """
    import urllib.parse
    import urllib.request

    if isinstance(files, str):
        files = files,

    # Static parameters
    params = [("compilation_level", "SIMPLE_OPTIMIZATIONS"),
        ("output_format", "xml"), ("output_info", "errors"),
        ("output_info", "warnings"), ("output_info", "compiled_code"), \
        ("output_info", "statistics")]
    # Source files
    params.extend(("js_code", open(f).read()) for f in files)
    params = urllib.parse.urlencode(params)
    params = params.encode('utf-8');

    # Setting up the request
    response = urllib.request.urlopen("http://closure-compiler.appspot.com/compile", params)

    result = ClosureResult(response.read().decode('utf-8'))

    if not result.errors and debug:
        result.compiled_code = ''.join(open(f).read() for f in files)

    return result