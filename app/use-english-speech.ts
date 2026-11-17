"use client";

import { useEffect, useRef, useState } from "react";

const stopEvent = "vocabulary-stop-audio";

export function useEnglishSpeech() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");

  useEffect(() => {
    function stopCurrent() {
      const player = audio.current;
      if (player) {
        audio.current = null;
        player.pause();
        player.removeAttribute("src");
        player.load();
      }
      setStatus("idle");
    }

    window.addEventListener(stopEvent, stopCurrent);
    return () => {
      window.removeEventListener(stopEvent, stopCurrent);
      stopCurrent();
    };
  }, []);

  function stop() {
    window.dispatchEvent(new Event(stopEvent));
  }

  async function speak(text: string, rate = 1) {
    stop();
    const player = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
    player.playbackRate = rate;
    audio.current = player;
    setStatus("loading");

    function finish(nextStatus: "idle" | "error") {
      if (audio.current !== player) return;
      audio.current = null;
      setStatus(nextStatus);
    }

    player.onended = () => finish("idle");
    player.onerror = () => finish("error");
    try {
      await player.play();
      if (audio.current === player) setStatus("playing");
    } catch {
      finish("error");
    }
  }

  return { speak, stop, audioLoading: status === "loading", audioError: status === "error" };
}
