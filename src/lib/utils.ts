/**
 * 通用工具函数（shadcn-vue 风格）。
 *
 * `cn()` 是 shadcn 组件体系的标准类名合并函数：
 *  - `clsx` 负责条件类名的拼接（数组、对象、真值判断）；
 *  - `tailwind-merge` 负责去重冲突的 Tailwind 工具类（例如同时传入 `px-2` 与 `px-4` 时保留后者）。
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
