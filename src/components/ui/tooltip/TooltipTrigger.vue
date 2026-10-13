<script setup lang="ts">
/**
 * TooltipTrigger —— 触发 Tooltip 的元素（shadcn-vue 风格）。
 *
 * 默认渲染为一个 button；若想用其他元素（如 <a>）触发，传 `as-child`，
 * 此时必须提供唯一的默认插槽子元素。
 */
import { TooltipTrigger as RekaTooltipTrigger } from "reka-ui";
</script>

<template>
  <RekaTooltipTrigger v-bind="$attrs">
    <slot />
  </RekaTooltipTrigger>
</template>
