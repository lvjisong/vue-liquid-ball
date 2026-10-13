<script setup lang="ts">
/**
 * Button —— shadcn-vue 风格按钮组件。
 *
 * 对应原 React 版 `toolcraft/ui/components/primitives/button.tsx`。
 * 基于 `buttonVariants`（cva）组合变体样式；支持原生 button 的全部属性。
 * 若需要把按钮样式套用到 <a> 等其他元素，请直接使用导出的 `buttonVariants` 函数。
 */
import { computed } from "vue";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonVariants } from "./button-variants";

const props = withDefaults(
  defineProps<{
    /** 视觉变体 */
    variant?: ButtonVariants["variant"];
    /** 尺寸变体 */
    size?: ButtonVariants["size"];
    /** 覆盖样式（可额外传入任意 Tailwind 类） */
    class?: string;
  }>(),
  { variant: "default", size: "default" },
);

/** 组合后的 className */
const mergedClass = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: props.size }), props.class),
);
</script>

<template>
  <button
    type="button"
    v-bind="$attrs"
    :class="mergedClass"
  >
    <slot />
  </button>
</template>
