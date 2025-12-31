import { motion } from "framer-motion";
import { Printer } from "lucide-react";

export function Hero() {
  return (
    <div className="text-center space-y-6 mb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="bg-primary/10 p-4 rounded-full mb-2">
          <Printer className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight">
          3D Cookie <span className="text-primary">Co</span>
        </h1>
      </motion.div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium"
      >
        Your printer or mine? Helping you 3D print your cookie cutters.
      </motion.p>
    </div>
  );
}
