
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
    <div className={`relative flex items-center justify-center ${isActive ? "mic-active" : ""} ${className}`}>
      <div
        className={`${sizes[size].container} rounded-full ${isActive ? 'bg-violet-200 micro-pulse' : 'bg-violet-100'} flex items-center justify-center transition-all duration-300 border-2 border-violet-300 overflow-hidden shadow-md`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={altText}
            className={`${sizes[size].image} object-cover ${isActive ? 'interviewer-speaking' : ''}`}
          />
        ) : (
          <Mic
            className={`${sizes[size].icon} ${isActive ? 'text-violet-600 animate-pulse' : 'text-violet-500'} transition-all duration-300`}
          />
        )}
      </div>

      {isActive && (
        <>
          <div className="absolute inset-0 rounded-full bg-violet-100 animate-ping opacity-25"></div>
          <div className="absolute inset-0 rounded-full border-2 border-violet-300 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border border-violet-200 scale-110 animate-pulse delay-100"></div>
          <div className="absolute inset-0 rounded-full border border-violet-100 scale-125 animate-pulse delay-200"></div>
          <div className="absolute inset-0 rounded-full border border-violet-50 scale-140 animate-pulse delay-300"></div>
        </>
      )}

      {isActive && (
        <div className="absolute -bottom-6 flex items-end justify-center w-full h-4 space-x-0.5">
          <div className="w-0.5 h-1 bg-violet-500 animate-sound-wave-1"></div>
          <div className="w-0.5 h-2 bg-violet-500 animate-sound-wave-2"></div>
          <div className="w-0.5 h-3 bg-violet-500 animate-sound-wave-3"></div>
          <div className="w-0.5 h-4 bg-violet-500 animate-sound-wave-4"></div>
          <div className="w-0.5 h-3 bg-violet-500 animate-sound-wave-5"></div>
          <div className="w-0.5 h-2 bg-violet-500 animate-sound-wave-2"></div>
          <div className="w-0.5 h-1 bg-violet-500 animate-sound-wave-1"></div>
        </div>
      )}
    </div>
  );
};

export default LiveMicrophone;
