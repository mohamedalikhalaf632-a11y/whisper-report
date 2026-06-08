import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // توجيه السيرفر للـ SSR wrapper الخاص بـ Cloudflare
    server: { entry: "server" },
  },
});