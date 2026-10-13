/// <reference types="vite/client" />

// WebGPU 类型声明：依赖 @webgpu/types 提供 GPUDevice / GPUBuffer 等全局类型。
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
