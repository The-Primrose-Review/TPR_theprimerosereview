
import React, { useState, useEffect } from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
  speed?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className = "",
  speed = 45
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);

    if (!text) return;

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <div className={`relative ${className}`}>
      <p>{displayedText}<span className={`inline-block w-0.5 h-5 bg-primary ml-0.5 ${isComplete ? "opacity-0" : "animate-pulse"}`}></span></p>
    </div>
  );
};
