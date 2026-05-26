
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";

interface LoadingScreenProps {
  programName: string;
  university?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ programName, university }) => {
  const [pulseScale, setPulseScale] = useState(1);
  const animationRef = useRef<number>();

  useEffect(() => {
    let time = 0;
    const animate = () => {
      time += 0.04;
      setPulseScale(1 + Math.sin(time) * 0.06);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, []);

  const waveBars = Array.from({ length: 24 }, (_, i) => i);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm"
    >
      <h2 className="text-xl font-semibold text-slate-800 mb-1">Connecting to Eva</h2>
      <p className="text-slate-400 text-sm mb-10">
        {university || "University"} — {programName || "your program"}
      </p>

      {/* Orb */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative flex items-center justify-center mb-4">
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.25, 0, 0.25] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-24 h-24 rounded-full bg-primary/15"
          />
          <motion.div
            animate={{ scale: [1, 1.8, 1], opacity: [0.12, 0, 0.12] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute w-24 h-24 rounded-full bg-primary/10"
          />
          <motion.div
            style={{ scale: pulseScale }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/80 via-primary to-blue-600 flex items-center justify-center shadow-xl shadow-primary/20 relative z-10"
          >
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
            <Volume2 className="w-7 h-7 text-white/90" />
          </motion.div>
        </div>

        {/* Wave bars */}
        <div className="flex items-end justify-center gap-[2px] h-8 w-48">
          {waveBars.map((i) => (
            <motion.div
              key={i}
              animate={{ height: [3, 5 + Math.random() * 10, 3] }}
              transition={{ duration: 0.6 + Math.random() * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
              className="w-1 rounded-full bg-primary/30"
            />
          ))}
        </div>
      </div>

      <p className="text-slate-700 text-base mb-1">Setting up your interview session...</p>
      <p className="text-slate-400 text-sm">Eva will greet you and guide you through the interview</p>

      {/* Progress bar */}
      <div className="mt-8 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
        />
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
