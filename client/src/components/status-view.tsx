import { motion } from "framer-motion";
import { Loader2, Check, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Status = 'idle' | 'generating' | 'selecting' | 'processing' | 'ready';

interface StatusViewProps {
  status: Status;
  onReset: () => void;
  cutterUrl?: string;
  stampUrl?: string;
}

export function StatusView({ status, onReset, cutterUrl, stampUrl }: StatusViewProps) {
  if (status === 'processing') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md mx-auto mt-12 text-center space-y-6"
      >
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <Printer className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-foreground">Baking your Files...</h3>
          <p className="text-muted-foreground mt-2">Converting sketch to 3D printable geometry</p>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Design Analyzed</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating Cutter Wall...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (status === 'ready') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto mt-12"
      >
        <Card className="p-8 text-center border-2 border-primary/20 bg-white/50 backdrop-blur-sm shadow-xl rounded-3xl">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8" />
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-2">Ready to Print!</h2>
          <p className="text-muted-foreground mb-8">Your custom cookie cutter files are ready for download.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Button 
              size="lg" 
              className="w-full h-14 text-lg rounded-xl" 
              variant="default"
              asChild
            >
              <a href={cutterUrl} download>
                <Download className="mr-2 h-5 w-5" />
                Cutter STL
              </a>
            </Button>
            <Button 
              size="lg" 
              className="w-full h-14 text-lg rounded-xl" 
              variant="secondary"
              asChild
            >
              <a href={stampUrl} download>
                <Download className="mr-2 h-5 w-5" />
                Stamp STL
              </a>
            </Button>
          </div>
          
          <Button variant="ghost" onClick={onReset} className="text-muted-foreground hover:text-foreground">
            Make Another One
          </Button>
        </Card>
      </motion.div>
    );
  }

  return null;
}
