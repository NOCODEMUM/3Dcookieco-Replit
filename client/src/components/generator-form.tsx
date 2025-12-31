import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface GeneratorFormProps {
  onSubmit: (prompt: string) => void;
  isGenerating: boolean;
}

export function GeneratorForm({ onSubmit, isGenerating }: GeneratorFormProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      onSubmit={handleSubmit} 
      className="w-full max-w-xl mx-auto flex gap-2 relative"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. cute sleeping cat, rocket ship, dinosaur"
          className="pl-10 h-14 text-lg rounded-full border-2 border-input focus-visible:ring-primary/20 focus-visible:border-primary transition-all shadow-sm"
          disabled={isGenerating}
        />
      </div>
      <Button 
        type="submit" 
        size="lg" 
        disabled={!prompt.trim() || isGenerating}
        className="h-14 px-8 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <Sparkles className="animate-spin h-5 w-5" />
            Dreaming...
          </span>
        ) : (
          "Generate"
        )}
      </Button>
    </motion.form>
  );
}
