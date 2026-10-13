<script setup lang="ts">
/**
 * TooltipProvider —— Tooltip 上下文提供者（shadcn-vue 风格）。
 *
 * 用于全局包裹需要 Tooltip 的区域（原 React 版 App 最外层 <TooltipProvider>）。
 * 提供默认的显示延迟等配置。
 */
import { TooltipProvider as RekaTooltipProvider } from "reka-ui";

withDefaults(
  defineProps<{
    /** 悬停多久后显示（毫秒） */
    delayDuration?: number;
    /** 多个 tooltip 间切换的延迟 */
    skipDelayDuration?: number;
    /** 是否禁用悬停交互 */
    disableHoverableContent?: boolean;
  }>(),
  { delayDuration: 300 },
);
</script>

<template>
  <RekaTooltipProvider v-bind="$attrs">
    <slot />
  </RekaTooltipProvider>
</template>
