<script setup lang="ts">
/**
 * TooltipContent —— Tooltip 内容面板（shadcn-vue 风格）。
 *
 * 使用 reka-ui 的 Portal 渲染到 body，避免被裁剪；`force-mount` 保证在关闭状态下也能测量位置。
 */
import { TooltipContent as RekaTooltipContent, TooltipPortal } from "reka-ui";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    /** 弹出方向 */
    side?: "top" | "right" | "bottom" | "left";
    /** 与触发元素的偏移距离 */
    sideOffset?: number;
    /** 覆盖样式 */
    class?: string;
  }>(),
  { sideOffset: 4 },
);
</script>

<template>
  <TooltipPortal>
    <RekaTooltipContent
      v-bind="$attrs"
      :side="side"
      :side-offset="sideOffset"
      :force-mount="true"
      :class="cn(
        'z-50 overflow-hidden rounded-md bg-[color:var(--primary)] px-3 py-1.5 text-xs text-[color:var(--primary-foreground)]',
        props.class,
      )"
    >
      <slot />
    </RekaTooltipContent>
  </TooltipPortal>
</template>
