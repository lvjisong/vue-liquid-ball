/**
 * Vite 构建配置（Vue3 + Tailwind CSS v4）
 *
 * - `@tailwindcss/vite`：Tailwind v4 的 Vite 插件（框架无关，替代原 React 版的同款插件）。
 * - `@vitejs/plugin-vue`：Vue SFC 编译。
 * - `@` 别名：指向 `./src`，与 tsconfig 的 paths 保持一致。
 * - `base: "./"`：相对路径，便于静态托管（如 GitHub Pages）。
 */
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [tailwindcss(), vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
