import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DesignGalleryProps {
  images: Array<{ id: string; url: string; alt: string }>;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export function DesignGallery({ images, onSelect, selectedId }: DesignGalleryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      {images.map((image, index) => (
        <motion.div
          key={image.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(image.id)}
          className={cn(
            "group relative aspect-square rounded-2xl cursor-pointer overflow-hidden border-4 transition-all duration-300 bg-white shadow-md hover:shadow-xl",
            selectedId === image.id 
              ? "border-primary ring-4 ring-primary/20 scale-[1.02]" 
              : "border-transparent hover:border-primary/50"
          )}
        >
          <img 
            src={image.url} 
            alt={image.alt}
            className="w-full h-full object-contain p-8 group-hover:scale-110 transition-transform duration-500"
          />
          
          {selectedId === image.id && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full p-1 shadow-lg"
            >
              <CheckCircle2 className="w-6 h-6" />
            </motion.div>
          )}
          
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white text-center font-medium">Click to select</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
