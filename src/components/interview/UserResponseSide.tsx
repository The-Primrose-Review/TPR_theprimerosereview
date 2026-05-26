
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface UserResponseSideProps {
  isStudentSpeaking: boolean;
  studentTranscript: string;
  endInterview: () => void;
}

const UserResponseSide: React.FC<UserResponseSideProps> = ({
  isStudentSpeaking,
  studentTranscript,
  endInterview,
}) => {
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [streamTracks, setStreamTracks] = useState<MediaStreamTrack[]>([]);

  const toggleCamera = async () => {
    if (cameraOn) {
      try {
        streamTracks.forEach(track => track.stop());
        setStreamTracks([]);
        if (videoRef.current) videoRef.current.srcObject = null;
        setCameraOn(false);
        setIsVideoLoaded(false);
        setCameraError(null);
      } catch (err) {
        console.error("Error turning off camera:", err);
      }
    } else {
      try {
        setCameraError(null);
        setIsVideoLoaded(false);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false
        });
        const tracks = stream.getTracks();
        setStreamTracks(tracks);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current?.play();
              setIsVideoLoaded(true);
              setCameraOn(true);
              toast.success("Camera is now on");
            } catch {
              setCameraError("Error playing video feed");
            }
          };
        }
      } catch (err) {
        setCameraError(`Could not access camera: ${err instanceof Error ? err.message : 'Unknown error'}`);
        toast.error("Could not access camera. Please check permissions.");
      }
    }
  };

  useEffect(() => {
    return () => { streamTracks.forEach(track => track.stop()); };
  }, [streamTracks]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${isStudentSpeaking ? "bg-blue-500 animate-pulse" : "bg-slate-300"}`} />
          <span className="text-base font-semibold text-slate-700">Your Response</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleCamera}
          className="flex items-center gap-1 h-8 px-2 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          title={cameraOn ? "Turn off camera" : "Turn on camera"}
        >
          {cameraOn ? (
            <><CameraOff className="h-4 w-4" /><span className="text-xs">Hide</span></>
          ) : (
            <><Camera className="h-4 w-4" /><span className="text-xs">Show me</span></>
          )}
        </Button>
      </div>

      <div className="flex-1 relative">
        <div
          className={`h-full rounded-2xl transition-all duration-300 flex flex-col border ${
            isStudentSpeaking
              ? "border-blue-300 bg-blue-50/30 shadow-sm shadow-blue-100"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex-1 flex items-center justify-center relative overflow-hidden rounded-t-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform scale-x-[-1] absolute inset-0 ${isVideoLoaded && cameraOn ? "opacity-100" : "opacity-0"}`}
            />

            {!cameraOn && !isStudentSpeaking && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-3">
                  <Camera className="h-6 w-6 text-slate-400" />
                </div>
                <span className="text-slate-400 text-xs">Camera off — click above to enable</span>
              </div>
            )}

            {!cameraOn && isStudentSpeaking && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50/40">
                <AnimatePresence>
                  <motion.div
                    className="relative flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.25, 0, 0.25] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute w-16 h-16 rounded-full bg-blue-400/20"
                    />
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center relative z-10 shadow-lg shadow-blue-200">
                      <Mic className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>
                </AnimatePresence>
                <span className="text-blue-600 font-medium text-sm mt-8">Listening...</span>
              </div>
            )}

            {cameraOn && !isVideoLoaded && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
                <span className="text-slate-700 font-medium text-sm">Camera error</span>
                <span className="text-slate-400 text-xs mt-1">{cameraError}</span>
                <Button size="sm" className="mt-3" onClick={toggleCamera}>Try Again</Button>
              </div>
            )}

            {isStudentSpeaking && cameraOn && (
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full">
                <div className="relative w-2 h-2">
                  <div className="absolute inset-0 bg-white rounded-full animate-ping" />
                  <div className="absolute inset-0 bg-white rounded-full" />
                </div>
                <span className="text-xs font-medium">Listening</span>
              </div>
            )}
          </div>

          {studentTranscript && (
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-blue-600 italic truncate">"{studentTranscript}"</p>
            </div>
          )}

          <div className="flex justify-between p-4 border-t border-slate-100 bg-white rounded-b-2xl">
            <Button
              variant="outline"
              onClick={endInterview}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-300"
            >
              End Interview
            </Button>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${isStudentSpeaking ? "bg-blue-500 animate-pulse" : "bg-slate-200"}`} />
              <span className="text-xs text-slate-400">
                {isStudentSpeaking ? "Listening..." : "Waiting for Eva..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserResponseSide;
