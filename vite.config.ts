import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // توجيه السيرفر
    server: { 
      entry: "server",
      preset: "vercel" // السطر ده السحري اللي هيخلي التاركت يروح لـ Vercel بديل لـ cloudflare
    },
  },
});