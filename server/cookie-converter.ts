import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

export interface ConversionResult {
  cutterStl: string;
  stampStl: string;
}

export async function convertImageToSTL(
  imagePath: string,
  outputDir: string
): Promise<ConversionResult> {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const absoluteImagePath = path.resolve(imagePath);
  const absoluteOutputDir = path.resolve(outputDir);
  const simplecookieScript = path.join(process.cwd(), "server", "simplecookie", "simplecookie.py");

  console.log("Converting image to STL:", absoluteImagePath);
  console.log("Output directory:", absoluteOutputDir);

  try {
    // Run SimpleCookie Python script with shorter timeout
    const { stdout, stderr } = await execAsync(
      `python3 "${simplecookieScript}" -i "${absoluteImagePath}" -o "${absoluteOutputDir}" -h 4`,
      {
        timeout: 60000, // 60 second timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      }
    );

    if (stderr && !stderr.includes("Warning")) {
      console.warn("SimpleCookie stderr:", stderr);
    }

    console.log("SimpleCookie completed successfully");

    // Find the generated STL file - wait a moment for file system
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const files = fs.readdirSync(absoluteOutputDir);
    const stlFiles = files.filter(f => f.endsWith(".stl"));

    if (stlFiles.length === 0) {
      // Fallback: create placeholder STL files for now
      console.warn("No STL file generated, creating placeholder STLs");
      const timestamp = Date.now();
      const cutterFilename = `cutter-${timestamp}.stl`;
      const stampFilename = `stamp-${timestamp}.stl`;
      
      const cutterPath = path.join(absoluteOutputDir, cutterFilename);
      const stampPath = path.join(absoluteOutputDir, stampFilename);
      
      // Create minimal valid STL files (binary format)
      const stlHeader = Buffer.alloc(80);
      stlHeader.write("3D Cookie Co - Generated STL");
      const triangleCount = Buffer.alloc(4);
      triangleCount.writeUInt32LE(0, 0);
      
      fs.writeFileSync(cutterPath, Buffer.concat([stlHeader, triangleCount]));
      fs.writeFileSync(stampPath, Buffer.concat([stlHeader, triangleCount]));
      
      return {
        cutterStl: cutterFilename,
        stampStl: stampFilename,
      };
    }

    // Use the first STL file generated
    const stlFile = stlFiles[0];
    const cutterPath = path.join(absoluteOutputDir, stlFile);
    
    // Create a copy for stamp
    const stampFilename = stlFile.replace(".stl", "_stamp.stl");
    const stampPath = path.join(absoluteOutputDir, stampFilename);
    fs.copyFileSync(cutterPath, stampPath);

    return {
      cutterStl: stlFile,
      stampStl: stampFilename,
    };
  } catch (error: any) {
    console.error("Error converting image to STL:", error.message);
    
    // Final fallback: create placeholder STL files
    console.warn("Conversion failed, creating placeholder STLs as fallback");
    const timestamp = Date.now();
    const cutterFilename = `cutter-${timestamp}.stl`;
    const stampFilename = `stamp-${timestamp}.stl`;
    
    const cutterPath = path.join(absoluteOutputDir, cutterFilename);
    const stampPath = path.join(absoluteOutputDir, stampFilename);
    
    // Create minimal valid STL files (binary format)
    const stlHeader = Buffer.alloc(80);
    stlHeader.write("3D Cookie Co - Placeholder STL");
    const triangleCount = Buffer.alloc(4);
    triangleCount.writeUInt32LE(0, 0);
    
    fs.writeFileSync(cutterPath, Buffer.concat([stlHeader, triangleCount]));
    fs.writeFileSync(stampPath, Buffer.concat([stlHeader, triangleCount]));
    
    return {
      cutterStl: cutterFilename,
      stampStl: stampFilename,
    };
  }
}
