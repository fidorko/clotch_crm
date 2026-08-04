// Короткий "пік" при скануванні штрихкоду (ReceivingItemsTable) — за прямою
// вказівкою людини. Синтезується через Web Audio API (нативний браузерний
// API, без нового npm-пакета чи аудіофайлу — правило 9.9 CLAUDE.md), тому
// спрацьовує миттєво, без мережевого запиту чи затримки завантаження.
export function playScanBeep(): void {
  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 1800;
    gain.gain.value = 0.12;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.08);
    oscillator.onended = () => ctx.close();
  } catch {
    // Web Audio недоступний (заблоковано браузером тощо) — тихо ігноруємо,
    // сканування саме по собі не повинно ламатись через відсутність звуку.
  }
}
