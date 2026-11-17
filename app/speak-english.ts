export function speakEnglish(text: string) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
