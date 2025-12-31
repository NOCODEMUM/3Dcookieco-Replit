import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema } from "@shared/schema";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Ensure directories exist
const ensureDirs = () => {
  const dirs = [
    path.join(process.cwd(), "runner", "input-images"),
    path.join(process.cwd(), "runner", "output"),
    path.join(process.cwd(), "server", "generated"),
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  ensureDirs();

  // Generate 3 images from prompt using OpenAI DALL·E
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Engineering prompt for CookieCAD-ready black and white line art
      const engineeredPrompt = `Create a simple black-and-white line drawing with uniform line thickness (no variation). The artwork must be clean, bold, and minimal, with closed shapes only. No colour, shading, gradients, grey tones, textures, or soft edges. Output as a transparent-background PNG, pure black lines (#000000) only. High resolution (2048 × 2048 px). Center the composition within a square frame. Subject: ${prompt}`;

      try {
        // Generate 3 images in parallel
        const imagePromises = Array.from({ length: 3 }, async (_, index) => {
          const result = await openai.images.generate({
            model: "gpt-image-1",
            prompt: engineeredPrompt,
            size: "1024x1024", // Note: gpt-image-1 supports up to 1024x1024
          }) as any;

          // Download image
          let imageBuffer: Buffer;
          
          if (result.data?.[0]?.url) {
            const fetch = (await import("node-fetch")).default;
            const response = await fetch(result.data[0].url);
            imageBuffer = await response.buffer();
          } else if (result.data?.[0]?.b64_json) {
            imageBuffer = Buffer.from(result.data[0].b64_json, "base64");
          } else {
            throw new Error(`Unexpected response format from OpenAI`);
          }

          // Save to server/generated/
          const timestamp = Date.now();
          const filename = `design_${timestamp}_${index}.png`;
          const filepath = path.join(process.cwd(), "server", "generated", filename);
          
          fs.writeFileSync(filepath, imageBuffer);

          return {
            file: filename,
            url: `/generated/${filename}`,
          };
        });

        const designs = await Promise.all(imagePromises);

        res.json({
          success: true,
          designs,
        });
      } catch (openaiError: any) {
        throw openaiError;
      }
    } catch (error: any) {
      console.error("Generate image error:", error);
      res.status(500).json({ 
        success: false,
        error: error.message || "Failed to generate images" 
      });
    }
  });

  // Send image to SimpleCookie to generate STLs
  app.post("/api/run", async (req, res) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      console.log("Processing image:", imageUrl);

      try {
        // Convert URL to file path (remove leading slash if present)
        const relativeImagePath = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
        const imagePath = path.join(process.cwd(), relativeImagePath.replace(/^generated\//, "server/generated/"));
        const outputDir = path.join(process.cwd(), "runner", "output");

        console.log("Image path:", imagePath);
        console.log("Output directory:", outputDir);

        if (!fs.existsSync(imagePath)) {
          throw new Error(`Image file not found: ${imagePath}`);
        }

        // Import the converter
        const { convertImageToSTL } = await import("./cookie-converter.js");
        
        // Convert image to STL using SimpleCookie
        const result = await convertImageToSTL(imagePath, outputDir);

        res.json({
          success: true,
          cutterStlUrl: `/output/${result.cutterStl}`,
          stampStlUrl: `/output/${result.stampStl}`,
          status: "ready",
        });
      } catch (runError: any) {
        console.error("Conversion error:", runError);
        throw runError;
      }
    } catch (error: any) {
      console.error("Run error:", error);
      res.status(500).json({ 
        success: false,
        error: error.message || "Failed to process cutter" 
      });
    }
  });

  // Get job status
  app.get("/api/job/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getJob(id);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      res.json(job);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
