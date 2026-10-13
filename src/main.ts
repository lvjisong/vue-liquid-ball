/**
 * Vue3 应用入口。
 *
 * 对应原 React 版 `src/main.tsx`。职责：
 *  - 创建 Vue 应用实例；
 *  - 挂载根组件 App.vue 到 #app；
 *  - 引入全局样式（Tailwind v4 + toolcraft 变量 + 组件类）。
 */
import { createApp } from "vue";
import App from "./App.vue";
import "./styles.css";

createApp(App).mount("#app");
