import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ConnectionState = "idle" | "connecting" | "connected" | "disconnected" | "error";

export interface UseRealtimeInterviewReturn {
  connect: (programName: string, university: string) => Promise<void>;
  disconnect: () => void;
  sendTextMessage: (text: string) => void;
  connectionState: ConnectionState;
  isConnected: boolean;
  isEvaSpeaking: boolean;
  isStudentSpeaking: boolean;
  evaTranscript: string;
  lastEvaUtterance: string;
  studentTranscript: string;
  error: string | null;
}

export const useRealtimeInterview = (): UseRealtimeInterviewReturn => {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [isEvaSpeaking, setIsEvaSpeaking] = useState(false);
  const [isStudentSpeaking, setIsStudentSpeaking] = useState(false);
  const [evaTranscript, setEvaTranscript] = useState("");
  const [lastEvaUtterance, setLastEvaUtterance] = useState("");
  const [studentTranscript, setStudentTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  const cleanupResources = () => {
    if (dcRef.current) {
      try { dcRef.current.close(); } catch {}
      dcRef.current = null;
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      if (audioElRef.current.parentNode) {
        audioElRef.current.parentNode.removeChild(audioElRef.current);
      }
      audioElRef.current = null;
    }
  };

  const disconnect = useCallback(() => {
    cleanupResources();
    setConnectionState("disconnected");
    setIsEvaSpeaking(false);
    setIsStudentSpeaking(false);
  }, []);

  const handleDataChannelMessage = useCallback((raw: string) => {
    let event: any;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }

    switch (event.type) {
      case "session.created":
        break;

      case "response.audio_transcript.delta":
        setEvaTranscript(prev => prev + (event.delta || ""));
        setIsEvaSpeaking(true);
        break;

      case "response.audio_transcript.done":
        setIsEvaSpeaking(false);
        if (event.transcript) {
          setLastEvaUtterance(event.transcript);
          setEvaTranscript("");
        }
        break;

      case "input_audio_buffer.speech_started":
        setIsStudentSpeaking(true);
        setStudentTranscript("");
        break;

      case "input_audio_buffer.speech_stopped":
        setIsStudentSpeaking(false);
        break;

      case "conversation.item.input_audio_transcription.completed":
        if (event.transcript) {
          setStudentTranscript(event.transcript);
        }
        break;

      case "response.done":
        setIsEvaSpeaking(false);
        break;

      case "error":
        console.error("OpenAI realtime error event:", event);
        toast.error("Interview session error", {
          description: event.error?.message || "An error occurred during the interview"
        });
        break;

      default:
        break;
    }
  }, []);

  const connect = useCallback(async (programName: string, university: string) => {
    try {
      setConnectionState("connecting");
      setError(null);
      setEvaTranscript("");
      setLastEvaUtterance("");
      setStudentTranscript("");

      // Step 1: Get ephemeral token from our edge function
      const { data: sessionData, error: fnError } = await supabase.functions.invoke(
        "interview-realtime-session",
        { body: { programName, university } }
      );

      if (fnError) {
        throw new Error(fnError.message || "Failed to get session token");
      }

      // Handle both beta ({ client_secret: { value } }) and GA ({ value }) response shapes
      const ephemeralKey = sessionData?.client_secret?.value || sessionData?.value;
      if (!ephemeralKey) {
        throw new Error("No ephemeral key returned from session endpoint");
      }

      // Step 2: Get microphone access
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = localStream;

      // Step 3: Create RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Step 4: Set up audio output element for Eva's voice
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      document.body.appendChild(audioEl);
      audioElRef.current = audioEl;

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          audioEl.srcObject = event.streams[0];
        }
      };

      // Step 5: Add microphone track to peer connection
      localStream.getAudioTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Step 6: Create data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setConnectionState("connected");
      };

      dc.onmessage = (event) => {
        handleDataChannelMessage(event.data);
      };

      dc.onerror = (err) => {
        console.error("Data channel error:", err);
        setError("Connection error — data channel failed");
        setConnectionState("error");
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
          setConnectionState("error");
          setError("WebRTC connection lost");
        }
      };

      // Step 7: Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Step 8: Exchange SDP with OpenAI using ephemeral key
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls?model=gpt-realtime-2", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) {
        const errText = await sdpResponse.text();
        throw new Error(`OpenAI SDP exchange failed (${sdpResponse.status}): ${errText}`);
      }

      // Step 9: Set remote description with OpenAI's SDP answer
      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      // Data channel onopen will fire and set connectionState to "connected"
    } catch (err) {
      console.error("connect() failed:", err);
      const message = err instanceof Error ? err.message : "Failed to connect to interview session";
      setError(message);
      setConnectionState("error");
      toast.error("Could not start interview session", { description: message });
      cleanupResources();
    }
  }, [handleDataChannelMessage]);

  const sendTextMessage = useCallback((text: string) => {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;

    const messageEvent = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }]
      }
    };
    dcRef.current.send(JSON.stringify(messageEvent));

    const responseEvent = { type: "response.create" };
    dcRef.current.send(JSON.stringify(responseEvent));
  }, []);

  return {
    connect,
    disconnect,
    sendTextMessage,
    connectionState,
    isConnected: connectionState === "connected",
    isEvaSpeaking,
    isStudentSpeaking,
    evaTranscript,
    lastEvaUtterance,
    studentTranscript,
    error,
  };
};
