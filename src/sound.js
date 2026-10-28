// Ses: varsayılan kapalı; giriş ekranından açılır (state.sound). Dosya yok, Web Audio ile kısa tonlar üretilir.
// tik: parça yerleşti · can: köşe 360'ı buldu / doğru cevap · tok: yanlış aile, çakışma, yanlış cevap
let enabled = false, ac = null;

export const setSound = (on) => { enabled = !!on; };
export const soundOn = () => enabled;

export function play(kind) {
  if (!enabled) return;
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === "suspended") ac.resume();
    const t = ac.currentTime;
    const tone = (freq, start, dur, type = "sine", gain = 0.18) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t + start);
      g.gain.setValueAtTime(0.0001, t + start);
      g.gain.exponentialRampToValueAtTime(gain, t + start + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
      o.connect(g).connect(ac.destination); o.start(t + start); o.stop(t + start + dur + 0.02);
    };
    if (kind === "tik") tone(1500, 0, 0.05, "triangle", 0.12);
    else if (kind === "can") { tone(880, 0, 0.9); tone(1320, 0.02, 0.7, "sine", 0.09); tone(1760, 0.04, 0.5, "sine", 0.05); }
    else if (kind === "tok") { tone(190, 0, 0.12, "square", 0.08); tone(140, 0.01, 0.1, "triangle", 0.1); }
  } catch { /* ses yoksa sessiz devam */ }
}
