import { useState } from "react";
import { Hero } from "@/components/hero";
import { GeneratorForm } from "@/components/generator-form";
import { DesignGallery } from "@/components/design-gallery";
import { StatusView } from "@/components/status-view";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type Status = 'idle' | 'generating' | 'selecting' | 'processing' | 'ready';

interface Design {
  file: string;
  url: string;
}

export default function Home() {
  const [status, setStatus] = useState<Status>('idle');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [cutterUrl, setCutterUrl] = useState<string | null>(null);
  const [stampUrl, setStampUrl] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: string; url: string; alt: string }>>([]);
  const { toast } = useToast();

  const handleGenerate = async (prompt: string) => {
    setStatus('generating');
    
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate images");
      }

      const result = await res.json();
      
      if (!result.success || !result.designs) {
        throw new Error("Invalid response from server");
      }

      // Map the designs to gallery format
      const images = result.designs.map((design: Design, index: number) => ({
        id: design.url,
        url: design.url,
        alt: `${prompt} - Design ${index + 1}`,
      }));
      
      setGeneratedImages(images);
      setStatus('selecting');
      
      toast({
        title: "Designs Generated!",
        description: `Created ${result.designs.length} designs. Select your favorite to continue.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setStatus('idle');
    }
  };

  const handleSelect = async (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setStatus('processing');

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate STL files");
      }

      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to generate STL files");
      }

      setCutterUrl(result.cutterStlUrl);
      setStampUrl(result.stampStlUrl);
      setStatus('ready');
      
      toast({
        title: "Files Ready!",
        description: "Your STL files have been generated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setStatus('selecting');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setSelectedImageUrl(null);
    setCutterUrl(null);
    setStampUrl(null);
    setGeneratedImages([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 md:p-8">
      <div className="max-w-5xl mx-auto pt-12 pb-24">
        <Hero />
        
        <GeneratorForm 
          onSubmit={handleGenerate} 
          isGenerating={status === 'generating'} 
        />

        <AnimatePresence mode="wait">
          {status === 'selecting' && generatedImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mt-16 text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground">Pick your favorite</h2>
                <p className="text-muted-foreground">Click on a design to convert to 3D cookie cutter</p>
              </div>
              <DesignGallery 
                images={generatedImages} 
                onSelect={handleSelect}
                selectedId={selectedImageUrl}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <StatusView 
          status={status} 
          onReset={handleReset} 
          cutterUrl={cutterUrl || undefined}
          stampUrl={stampUrl || undefined}
        />
      </div>
    </div>
  );
}
