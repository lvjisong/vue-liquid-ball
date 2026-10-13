<script setup lang="ts">
/**
 * Tooltip —— 提示气泡根容器（shadcn-vue 风格，基于 reka-ui TooltipRoot）。
 *
 * 用法：
 *   <Tooltip>
 *     <TooltipTrigger as-child>
 *       <button>悬停目标</button>
 *     </TooltipTrigger>
 *     <TooltipContent side="top">提示文案</TooltipContent>
 *   </Tooltip>
 */
import { TooltipRoot } from "reka-ui";
</script>

<template>
  <TooltipRoot v-bind="$attrs">
    <slot />
  </TooltipRoot>
</template>
