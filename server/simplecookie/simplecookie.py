import os
import sys
import getopt
from lxml import etree, objectify
import re
import subprocess

def generateCookieCutter(inputs, output, dimensions):
    svgFiles = imageToSvg(inputs, output, dimensions)
    svgToStl(svgFiles)


def strip_units(value):
    """Remove any units (px, pt, in, em, etc) from a string value"""
    if isinstance(value, str):
        return re.sub(r'[a-zA-Z%]+', '', value).strip()
    return str(value)


def imageToSvg(inputs, outputPath, dimensions):
    '''
    Takes an array of image files to process and returns an array of SVG files
    '''
    outputs = []
    scaleWidth = dimensions[0]
    scaleHeight = dimensions[1]
    if (scaleWidth == 'x'):
        scaleWidth = -1
    if (scaleHeight == 'y'):
        scaleHeight = -1

    for f in inputs:
        filename, ext = os.path.splitext(f)
        ext = ext[1:].strip().lower()
        tempName = f
        if (ext not in ("bmp","pnm")):
            tempName =  filename + ".bmp"
            os.system("convert -flatten '%s' '%s'" % (f, tempName))
        if not os.path.exists(outputPath):
            os.mkdir(outputPath)
        svgFile = os.path.join(outputPath, (filename + ".svg"))
        os.system("potrace -s -r 96 -o '%s' '%s'" % (svgFile, tempName))
        if os.path.exists(tempName):
            os.remove(tempName)
        outputFileName = svgFile

        try:
            tree = etree.parse(svgFile)
            root = tree.getroot()
            
            svgHeight = strip_units(root.get('height', '100'))
            svgWidth = strip_units(root.get('width', '100'))
                
            updatedHeight = svgHeight
            updatedWidth = svgWidth

            if (scaleHeight != -1 or scaleWidth != -1):
                scaleFactor = 1
                dpi = 96
                
                if (scaleHeight != -1):
                    updatedHeight = scaleHeight
                    root.set('height', str(updatedHeight) + "in")
                else:
                    scaleFactor = float(scaleWidth) / float(svgWidth)
                    updatedHeight = float(svgHeight) * scaleFactor
                    root.set('height', str(updatedHeight) + "in")

                if (scaleWidth != -1):
                    updatedWidth = scaleWidth
                    root.set('width', str(updatedWidth) + "in")
                else:
                    scaleFactor = float(scaleHeight) / float(svgHeight)
                    updatedWidth = float(svgWidth) * scaleFactor
                    root.set('width', str(updatedWidth) + "in")

                root.set('viewBox', "0 0 " + str(float(updatedWidth) * dpi) + " " + str(float(updatedHeight) * dpi))

                outputFileName = filename + " [" + str(round(float(updatedWidth), 1)).rstrip('0').rstrip('.') + "x" + str(round(float(updatedHeight), 1)).rstrip('0').rstrip('.') + "in].svg"

            ns = {'svg': 'http://www.w3.org/2000/svg'}
            paths = root.findall('.//svg:path', ns)
            if not paths:
                paths = root.findall('.//path')
            
            for path in paths:
                path.set('fill', 'none')
                path.set('stroke', 'black')
                path.set('stroke-width', '5')

            groups = root.findall('.//svg:g', ns)
            if not groups:
                groups = root.findall('.//g')
            
            for g in groups:
                g.set('fill', 'none')
                g.set('stroke', 'black')
                g.set('stroke-width', '5')
            
            tree.write(svgFile, encoding='UTF-8', xml_declaration=True, pretty_print=False)
            os.rename(svgFile, outputFileName)
            outputs.append(outputFileName)
        except Exception as e:
            print(f"Error processing SVG: {e}")
            if os.path.exists(svgFile):
                try:
                    os.remove(svgFile)
                except:
                    pass
            raise
    
    return outputs

def svgToStl(filesArray):
    bladeHeight = 20
    bladeWidth = 0.88
    baseHeight = 2
    baseWidth = 7.5
    importDpi = 96

    for file in filesArray:
        filePath = os.path.abspath(file)
        stlPath = os.path.splitext(filePath)[0] + ".stl"

        scadTemplate = 'filePath = "%s";\nbladeHeight = %s;\nbladeWidth = %s;\nbaseHeight = %s;\nbaseWidth = %s;\nimportDpi = %s;\n\nmodule svgPath(filePath) {\n  import(file = filePath, center = false, dpi = importDpi);\n}\n\nmodule cutterBody(extrudeHeight, extrudeWidth) {\n  linear_extrude(height = extrudeHeight) {\n    difference() {\n      offset(r=extrudeWidth){\n        svgPath(filePath);\n      }\n      offset(r=0){\n        svgPath(filePath);\n      }\n    }\n  };\n}\n\nunion() {\n  cutterBody(bladeHeight, bladeWidth);\n  cutterBody(baseHeight, baseWidth);\n}'

        # Format with escaping for shell
        scadContent = scadTemplate % (filePath.replace('\\', '\\\\'), bladeHeight, bladeWidth, baseHeight, baseWidth, importDpi)
        
        # Write to temp file instead of echo (more reliable)
        scadTempFile = stlPath.replace('.stl', '.scad')
        try:
            with open(scadTempFile, 'w') as f:
                f.write(scadContent)
            
            # Run OpenSCAD with timeout
            subprocess.run(['openscad', '-o', stlPath, scadTempFile], timeout=30, capture_output=True)
            
            # Clean up temp scad file
            if os.path.exists(scadTempFile):
                os.remove(scadTempFile)
        except subprocess.TimeoutExpired:
            print(f"OpenSCAD timeout for {file}")
            if os.path.exists(scadTempFile):
                os.remove(scadTempFile)
        except Exception as e:
            print(f"Error running OpenSCAD: {e}")
            if os.path.exists(scadTempFile):
                try:
                    os.remove(scadTempFile)
                except:
                    pass

def main(argv):
    inputs = []
    output = "./"
    dimensions = ['x', 'y']

    try:
        opts, args = getopt.getopt(argv,"i:o:h:w:", ["help","input","output","height","width"])
    except getopt.GetoptError as err:
        print(str(err))
        usage()
        sys.exit(2)
    for o, a in opts:
        if o == "--help":
            usage()
            sys.exit()
        elif o in ("-i", "--input"):
            if (os.path.isfile(a)):
                inputs.append(a)
            else:
                for root, dirs, files in os.walk(a):
                    for filename in files:
                        inputs.append(os.path.join(root, filename))
        elif o in ("-o", "--output"):
            if (os.path.isdir(a)):
                output = a
            else:
                print("Output is not a directory")
                sys.exit(2)
        elif o in ("-h", "--height"):
            dimensions[1] = a
        elif o in ("-w", "--width"):
            dimensions[0] = a
        else:
            assert False, "unhandled option"

    if not inputs:
        print("ERROR: no input file found. Specify using -i")
        sys.exit(10)
    if (dimensions[0] != 'x' and dimensions[1] != 'y'):
        print("ERROR: scaling both height and width is not currently supported")
        sys.exit(11)

    generateCookieCutter(inputs, output, dimensions)

def usage():
    usage = """
    Convert Images to SVG outlines

    --help          What you're reading

    -i, --input     Input file or folder (required)
    -o, --output    Output folder path ( Default is ./ )
    -h, --height    Scale to specified height (in inches)
    -w, --width     Scale to specified width (in inches)

    For scaling only height or width is needed. Which ever one is provided the 
    other will be scaled proportionately. 
    """
    print(usage)

if __name__ == '__main__':
    main(sys.argv[1:])
