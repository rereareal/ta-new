import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite-plus";

const apiProxy = {
  "/api": {
    target: "http://127.0.0.1:8000",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api/, ""),
  },
};

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": decodeURIComponent(new URL("./src", import.meta.url).pathname),
    },
  },
  test: {
    environment: "node",
  },
  server: {
    port: 5173,
    host: true,
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
  fmt: {
    printWidth: 100,
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        files: ["**/*.ts", "**/*.vue"],
        env: { browser: true },
      },
      {
        files: ["**/*.config.ts"],
        env: { node: true },
      },
    ],
  },
});
