
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",

      includeAssets: ["icons/icon.svg"],

      manifest: {
        id: "/",
        name: "Expense Tracker",
        short_name: "Expenses",
        description: "Personal college expense tracker",
        theme_color: "#10B981",
        background_color: "#F8FAFC",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          }
        ]
      },

      workbox: {
        globPatterns: [
          "**/*.{html,js,css,svg,png,ico,woff2}"
        ],
        navigateFallback: "index.html"
      }
    })
  ]
});
