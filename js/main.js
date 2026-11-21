
import "../css/main.css";

import { registerSW } from "virtual:pwa-register";
import { initApp } from "./app.js";
import { applyTheme, getTheme } from "./theme.js";

applyTheme(getTheme());

registerSW({
  immediate: true
});

initApp();
