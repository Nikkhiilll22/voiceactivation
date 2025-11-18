import { useEffect, useRef, useState } from "react";

/**
 * useMicrophoneVolume
 * - returns { volume, muted, start, stop, error }
 * - volume: number (0 to 1) — instant RMS-level of microphone input
 */
export default function useMicrophoneVolume() {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);

  const [volume, setVolume] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // cleanup on unmount
    return () => stop();
   
  }, []);

  async function start() {
    if (isRunning) return;
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      setIsRunning(true);
      monitor();
    } catch (err) {
      console.error("Microphone permission denied or error:", err);
      setError(err);
    }
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {}
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (e) {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
    sourceRef.current = null;
    audioContextRef.current = null;
    dataArrayRef.current = null;
    rafRef.current = null;
    setIsRunning(false);
    setVolume(0);
  }

  function monitor() {
    const analyser = analyserRef.current;
    const data = dataArrayRef.current;
    if (!analyser || !data) return;

    function loop() {
      // Use time domain data to compute RMS (better for amplitude)
      analyser.getByteTimeDomainData(data); // values 0..255 centered at 128
      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128; // -1..1
        sumSquares += v * v;
      }
      const rms = Math.sqrt(sumSquares / data.length);

      // smoothing to avoid jitter
      const smoothed = Math.max(rms, volume * 0.6); // basic smoothing using previous volume
      setVolume(smoothed);

      rafRef.current = requestAnimationFrame(loop);
    }
    loop();
  }

  function muteToggle() {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    const newMuted = !muted;
    setMuted(newMuted);
  }

  return {
    volume,
    muted,
    start,
    stop,
    muteToggle,
    error,
    isRunning
  };
}
