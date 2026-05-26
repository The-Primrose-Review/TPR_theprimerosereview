
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";
import LiveMicrophone from "./LiveMicrophone";

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
        <Label className="text-lg font-semibold text-violet-900">Your Response</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleCamera}
          className="flex items-center gap-1 h-8 px-2 border-violet-200 hover:bg-violet-50"
          title={cameraOn ? "Turn off camera" : "Turn on camera"}
        >
          {cameraOn ? (
            <>
              <CameraOff className="h-4 w-4 text-violet-700" />
              <span className="text-xs text-violet-700">Hide</span>
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 text-violet-700" />
              <span className="text-xs text-violet-700">Show me</span>
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 relative">
        <div
          className={`h-full rounded-2xl transition-all duration-300 flex flex-col ${
            isStudentSpeaking
              ? 'border-2 border-violet-500 bg-white shadow-md pulse-border-violet'
              : 'border-2 border-violet-200 bg-violet-50'
          }`}
        >
          <div className="flex-1 flex items-center justify-center relative overflow-hidden rounded-t-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform scale-x-[-1] absolute inset-0 ${isVideoLoaded && cameraOn ? 'opacity-100' : 'opacity-0'}`}
            />

            {!cameraOn && !isStudentSpeaking && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-violet-50">
                <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-3">
                  <Camera className="h-7 w-7 text-violet-400" />
                </div>
                <span className="text-violet-500 text-sm">Camera off — click above to enable</span>
              </div>
            )}

            {!cameraOn && isStudentSpeaking && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-violet-50">
                <LiveMicrophone isActive={true} size="lg" />
                <span className="text-violet-700 font-medium text-base mt-8">Listening...</span>
              </div>
            )}

            {cameraOn && !isVideoLoaded && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-violet-50">
                <div className="w-10 h-10 border-2 border-violet-700 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-violet-50 bg-opacity-80 text-violet-800 p-4 text-center">
                <span className="font-medium">Camera error</span>
                <span className="text-xs mt-1">{cameraError}</span>
                <Button
                  size="sm"
                  className="mt-3 bg-violet-700 hover:bg-violet-800 text-white"
                  onClick={toggleCamera}
                >
                  Try Again
                </Button>
              </div>
            )}

            {isStudentSpeaking && cameraOn && (
              <div className="absolute top-4 right-4 flex items-center space-x-2 bg-violet-800 bg-opacity-80 text-white px-3 py-1 rounded-full">
                <div className="relative w-3 h-3">
                  <div className="absolute inset-0 bg-violet-200 rounded-full animate-ping"></div>
                  <div className="absolute inset-0 bg-violet-200 rounded-full"></div>
                </div>
                <span className="text-sm font-medium">Listening...</span>
              </div>
            )}
          </div>

          {/* Live transcript */}
          {studentTranscript && (
            <div className="px-4 py-2 bg-white border-t border-violet-100">
              <p className="text-sm text-violet-700 italic truncate">"{studentTranscript}"</p>
            </div>
          )}

          <div className="flex justify-between p-4 bg-white border-t border-violet-200 rounded-b-2xl">
            <Button
              variant="outline"
              onClick={endInterview}
              className="border-violet-200 text-violet-900 hover:bg-violet-50 transition-all duration-300"
            >
              End Interview
            </Button>

            <div className="flex items-center gap-2">
              <LiveMicrophone isActive={isStudentSpeaking} size="sm" />
              <span className="text-xs text-violet-500">
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
