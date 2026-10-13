<script setup lang="ts">
/**
 * Input —— shadcn-vue 风格文本输入框。
 *
 * 对应原 React 版 `toolcraft/ui/components/primitives/input.tsx`。
 * 支持 v-model 双向绑定，并透传原生 input 属性。
 * App 中用于「场景预览」的显示文字输入框。
 */
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    /** v-model 值 */
    modelValue?: string;
    /** 覆盖样式 */
    class?: string;
  }>(),
  { modelValue: "" },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

/** 双向绑定代理：把 input 的 value 同步回 modelValue */
const value = computed({
  get: () => props.modelValue,
  set: (next: string) => emit("update:modelValue", next),
});
</script>

<template>
  <input
    v-model="value"
    v-bind="$attrs"
    :class="cn(
      'flex h-7 w-full min-w-0 rounded-md border border-[color:color-mix(in_oklab,var(--border)_40%,transparent)] bg-background px-2 py-1 text-sm shadow-sm transition-colors',
      'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
      props.class,
    )"
  />
</template>
