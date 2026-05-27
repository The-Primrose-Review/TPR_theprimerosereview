
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2 } from "lucide-react";
import { AnimatedText } from "./AnimatedText";

interface EvaInterviewerSideProps {
  isEvaSpeaking: boolean;
  evaTranscript: string;
  lastEvaUtterance: string;
  university?: string;
}

const EvaInterviewerSide: React.FC<EvaInterviewerSideProps> = ({
  isEvaSpeaking,
  evaTranscript,
  lastEvaUtterance,
  university,
}) => {
  // Always show lastEvaUtterance — never the raw delta stream.
  // Deltas arrive faster than audio plays, so showing them causes the transcript
  // to race ahead of Eva's voice. lastEvaUtterance is set once per utterance on
  // response.output_audio_transcript.done, so AnimatedText types it out once cleanly.
  const displayText = lastEvaUtterance;
  const placeholderText = "Eva is getting ready to speak...";

  const [pulseScale, setPulseScale] = useState(1);
  const animationRef = useRef<number>();

  useEffect(() => {
    let time = 0;
    const animate = () => {
      time += 0.05;
      if (isEvaSpeaking) {
        setPulseScale(1 + Math.sin(time * 3) * 0.15 + Math.sin(time * 7) * 0.05);
      } else {
        setPulseScale(1 + Math.sin(time) * 0.03);
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isEvaSpeaking]);

  const waveBars = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <h2 className="text-base font-semibold text-slate-700">
          Eva — {university || "Admissions"} Interviewer
        </h2>
      </div>

      <div className="flex-1 relative p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col">
        {/* Orb */}
        <div className="flex flex-col items-center mb-4">
          {/* Tight wrapper so rings anchor to the orb, not the whole column */}
          <div className="relative flex items-center justify-center w-20 h-20 mb-3">
            <AnimatePresence>
              {isEvaSpeaking && (
                <>
                  <motion.div
                    key="ring1"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-primary/20"
                    style={{ margin: "-20px" }}
                  />
                  <motion.div
                    key="ring2"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 2, 1], opacity: [0.15, 0, 0.15] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute inset-0 rounded-full bg-primary/10"
                    style={{ margin: "-36px" }}
                  />
                </>
              )}
            </AnimatePresence>

          <motion.div
            style={{ scale: pulseScale }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/80 via-primary to-blue-600 flex items-center justify-center shadow-xl shadow-primary/20 relative z-10"
          >
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
            <AnimatePresence mode="wait">
              {isEvaSpeaking ? (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-[2px]"
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [6, 18 + Math.random() * 8, 6] }}
                      transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                      className="w-1 bg-white/90 rounded-full"
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Volume2 className="w-7 h-7 text-white/90" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          </div>{/* end orb wrapper */}

          {/* Wave bars */}
          <div className="flex items-end justify-center gap-[2px] h-8 w-full">
            {waveBars.map((i) => (
              <motion.div
                key={i}
                animate={{
                  height: isEvaSpeaking ? [3, 6 + Math.random() * 18, 3] : [3, 5, 3],
                }}
                transition={{ duration: 0.3 + Math.random() * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.04 }}
                className={`w-1 rounded-full ${isEvaSpeaking ? "bg-primary/50" : "bg-slate-300"}`}
              />
            ))}
          </div>
        </div>

        {/* Transcript */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 min-h-[100px] flex items-start shadow-sm">
          {displayText ? (
            <AnimatedText
              text={displayText}
              className="text-sm text-slate-700 leading-relaxed"
              key={displayText}
            />
          ) : (
            <p className="text-xs text-slate-400 italic">{placeholderText}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaInterviewerSide;
