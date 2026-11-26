
import "../css/main.css";

import { registerSW } from "virtual:pwa-register";
import { initApp } from "./app.js";
import { applyTheme, getTheme } from "./theme.js";
import { runSplashScreen } from "./components/splash.js";

// Apply current theme immediately so splash screen theme matches user preference
applyTheme(getTheme());

registerSW({
  immediate: true
});

// Run app init in parallel with fresh 2.5s premium splash animation
Promise.all([
  initApp(),
  runSplashScreen(2400)
]).then(() => {
  console.log("ExpenseFlow ready.");
});
