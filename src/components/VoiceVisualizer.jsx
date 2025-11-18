import React, { useEffect, useState, useRef } from "react";
import ProfileImage from "./ProfileImage";

const VoiceVisualizer = () => {
  const [volume, setVolume] = useState(0);
  const [micOn, setMicOn] = useState(true);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const scriptRef = useRef(null);

  useEffect(() => {
    if (micOn) startMic();
    else stopMic();

    return () => stopMic();
  }, [micOn]);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // Create new audio context only if not exists OR it's closed
      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed"
      ) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const microphone =
        audioContextRef.current.createMediaStreamSource(stream);
      const scriptProcessor =
        audioContextRef.current.createScriptProcessor(256, 1, 1);

      microphone.connect(analyserRef.current);
      analyserRef.current.connect(scriptProcessor);
      scriptProcessor.connect(audioContextRef.current.destination);

      scriptProcessor.onaudioprocess = () => {
        if (!micOn) return;

        const dataArray = new Uint8Array(
          analyserRef.current.frequencyBinCount
        );
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg =
          dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        setVolume(avg);
      };

      scriptRef.current = scriptProcessor;
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const stopMic = () => {
    setVolume(0);

    // Stop scriptProcessor
    if (scriptRef.current) {
      try {
        scriptRef.current.disconnect();
      } catch {}
    }

    // Stop analyser
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {}
    }

    // Stop media stream tracks
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    // Close AudioContext safely
    if (
      audioContextRef.current &&
      audioContextRef.current.state !== "closed"
    ) {
      audioContextRef.current.close().catch(() => {});
    }
  };

  return (
    <div className="voice-main">
      <div
        className="pulse-circle"
        style={{
          transform: micOn ? `scale(${1 + volume / 80})` : "scale(1)"
        }}
      >
        <ProfileImage />
      </div>

      <button
        className={`mic-btn ${micOn ? "on" : "off"}`}
        onClick={() => setMicOn(!micOn)}
      >
        {micOn ? "🎤 Mic On" : "🔇 Mic Off"}
      </button>
    </div>
  );
};

export default VoiceVisualizer;

