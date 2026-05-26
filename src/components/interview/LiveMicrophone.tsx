
import React from "react";
import { Mic } from "lucide-react";

interface LiveMicrophoneProps {
  isActive: boolean;
  size?: "sm" | "md" | "lg";
  imageUrl?: string;
  altText?: string;
  className?: string;
}

const LiveMicrophone: React.FC<LiveMicrophoneProps> = ({
  isActive,
  size = "md",
  imageUrl,
  altText = "Microphone",
  className = ""
}) => {
  const sizes = {
    sm: { container: "h-12 w-12", icon: "h-5 w-5", image: "w-10 h-10" },
    md: { container: "h-16 w-16", icon: "h-6 w-6", image: "w-14 h-14" },
    lg: { container: "h-28 w-28", icon: "h-8 w-8", image: "w-24 h-24" }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size].container} rounded-full flex items-center justify-center transition-all duration-300 border-2 overflow-hidden shadow-sm ${
          isActive ? "bg-blue-50 border-blue-200" : "bg-slate-100 border-slate-200"
        }`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={altText} className={`${sizes[size].image} object-cover`} />
        ) : (
          <Mic className={`${sizes[size].icon} transition-all duration-300 ${isActive ? "text-blue-500 animate-pulse" : "text-slate-400"}`} />
        )}
      </div>

      {isActive && (
        <>
          <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-ping opacity-50" />
          <div className="absolute inset-0 rounded-full border border-blue-300/50 animate-pulse" />
        </>
      )}
    </div>
  );
};

export default LiveMicrophone;
