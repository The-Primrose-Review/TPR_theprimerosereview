
import React from "react";
import { GraduationCap } from "lucide-react";

interface LoadingScreenProps {
  programName: string;
  university?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ programName, university }) => {
  return (
    <div className="max-w-xl mx-auto backdrop-blur-sm bg-white/90 p-8 rounded-2xl shadow-lg border border-violet-200 text-center transition-all duration-500 animate-fade-in">
      <div className="flex items-center justify-center mb-6">
        <GraduationCap className="h-7 w-7 text-violet-700 mr-3" />
        <h2 className="text-2xl font-semibold text-violet-900">Connecting to Eva</h2>
      </div>

      <div className="flex justify-center my-10">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-violet-100 animate-ping opacity-75"></div>
          <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-r from-violet-700 to-purple-900 shadow-lg">
            <div className="flex items-end h-6 space-x-1">
              <div className="w-1 bg-white rounded-t animate-sound-wave-1"></div>
              <div className="w-1 bg-white rounded-t animate-sound-wave-2"></div>
              <div className="w-1 bg-white rounded-t animate-sound-wave-3"></div>
              <div className="w-1 bg-white rounded-t animate-sound-wave-4"></div>
              <div className="w-1 bg-white rounded-t animate-sound-wave-5"></div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-violet-900 text-lg">Setting up your interview session...</p>
      <p className="mt-2 text-neutral-600">
        {university ? `${university}` : "University"} — {programName || "your program"}
      </p>
      <p className="mt-4 text-neutral-500 text-sm">Eva will greet you and guide you through the interview</p>

      <div className="mt-8 flex justify-center">
        <div className="w-full max-w-md h-2 bg-violet-100 rounded-full overflow-hidden">
          <div className="h-full bg-violet-700 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
