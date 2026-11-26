
/**
 * Premium Splash Screen Controller
 * Smoothly animates loading bar and status messages over a pleasant duration (approx 2.5s)
 * before fading out cleanly.
 */

export async function runSplashScreen(durationMs = 2400) {
  const splashEl = document.getElementById("app-splash-screen");
  const progressFill = document.getElementById("splash-progress-bar");
  const statusText = document.getElementById("splash-status-text");

  if (!splashEl) return;

  const milestones = [
    { progress: 25, text: "Loading your wallets & data...", delay: durationMs * 0.2 },
    { progress: 60, text: "Preparing budgets & metrics...", delay: durationMs * 0.5 },
    { progress: 90, text: "Syncing offline cache...", delay: durationMs * 0.8 },
    { progress: 100, text: "Ready to go!", delay: durationMs * 0.95 }
  ];

  return new Promise(resolve => {
    milestones.forEach(({ progress, text, delay }) => {
      setTimeout(() => {
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (statusText) statusText.textContent = text;
      }, delay);
    });

    setTimeout(() => {
      splashEl.classList.add("fade-out");
      setTimeout(() => {
        splashEl.remove();
        resolve();
      }, 550);
    }, durationMs);
  });
}
