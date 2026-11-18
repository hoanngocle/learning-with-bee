// Particle physics and synthesized fanfare ported from template/achivement/code.html.
export function createCelebrationEffects(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let audio: AudioContext | null = null;
  let width = 0;
  let height = 0;
  let previousTime = 0;
  const voices = new Set<OscillatorNode>();
  const colors = ["#FF8A35", "#F19B33", "#22A9C2", "#9871C3", "#6AAD63", "#FFD700", "#FF4081", "#00E676"];
  let particles: { x: number; y: number; w: number; h: number; color: string; vx: number; vy: number; rotation: number; vRot: number; opacity: number }[] = [];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    context?.clearRect(0, 0, width, height);
    particles = [];
    for (const voice of voices) voice.stop();
    voices.clear();
  }

  function render(time: number) {
    if (!context) return;
    const step = previousTime ? Math.min((time - previousTime) / (1000 / 60), 2) : 1;
    previousTime = time;
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      particle.vx *= Math.pow(.96, step);
      particle.vy = (particle.vy + .35 * step) * Math.pow(.96, step);
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      particle.rotation += particle.vRot * step;
      if (particle.y > height * .6) particle.opacity -= .012 * step;
      if (particle.opacity <= 0) continue;
      context.save();
      context.globalAlpha = Math.max(0, particle.opacity);
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation * Math.PI / 180);
      context.fillStyle = particle.color;
      context.fillRect(-particle.w / 2, -particle.h / 2, particle.w, particle.h);
      context.restore();
    }
    particles = particles.filter((particle) => particle.opacity > 0);
    frame = particles.length ? requestAnimationFrame(render) : 0;
  }

  function playVictoryChimes() {
    try {
      const Audio = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Audio) return;
      audio ??= new Audio();
      if (audio.state === "suspended") void audio.resume().catch(() => {});
      const now = audio.currentTime;
      const destination = audio.destination;

      function note(frequency: number, start: number, type: OscillatorType, harmonic: boolean) {
        if (!audio) return;
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(harmonic ? .2 : 0, start);
        if (!harmonic) gain.gain.linearRampToValueAtTime(.25, start + .04);
        gain.gain.exponentialRampToValueAtTime(harmonic ? .0001 : .001, start + (harmonic ? .7 : .55));
        oscillator.connect(gain);
        gain.connect(destination);
        voices.add(oscillator);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
          voices.delete(oscillator);
        };
        oscillator.start(start);
        oscillator.stop(start + (harmonic ? .75 : .6));
      }

      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((frequency, index) => note(frequency, now + index * .12, "triangle", false));
      [1046.50, 1318.51, 1567.98, 2093].forEach((frequency, index) => note(frequency, now + .65 + index * .08, "sine", true));
    } catch {
      // The visual celebration still works if Web Audio is unavailable.
    }
  }

  function play(withSound: boolean) {
    stop();
    resize();
    previousTime = 0;
    if (withSound) playVictoryChimes();
    if (!context || reducedMotion.matches) return;
    particles = Array.from({ length: 110 }, () => ({
      x: width * .5 + (Math.random() - .5) * 200,
      y: height * .4 + (Math.random() - .5) * 100,
      w: Math.random() * 10 + 6,
      h: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - .5) * 18,
      vy: Math.random() * -14 - 6,
      rotation: Math.random() * 360,
      vRot: (Math.random() - .5) * 12,
      opacity: 1,
    }));
    frame = requestAnimationFrame(render);
  }

  window.addEventListener("resize", resize);
  reducedMotion.addEventListener("change", stop);
  return {
    play,
    stop,
    dispose() {
      stop();
      window.removeEventListener("resize", resize);
      reducedMotion.removeEventListener("change", stop);
      if (audio) void audio.close().catch(() => {});
    },
  };
}
