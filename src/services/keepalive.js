let audioCtx = null;
let oscillator = null;
let gainNode = null;

export function startKeepalive() {
  if (audioCtx) return;

  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.value = 0.001;
    oscillator.frequency.value = 1;
    oscillator.start();
  } catch (e) {
    // AudioContext not supported
  }
}

export function stopKeepalive() {
  if (oscillator) {
    oscillator.stop();
    oscillator = null;
  }
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
  gainNode = null;
}
