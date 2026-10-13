<script setup lang="ts">
/**
 * Tabs —— 标签页容器（shadcn-vue 风格，基于 reka-ui TabsRoot）。
 *
 * 对应原 React 版 `toolcraft/ui/components/composites/tabs.tsx`。
 * App 中用于「代码导出」面板的 Web / SwiftUI 切换。
 * 控制方式：v-model（内部即 modelValue）。
 */
import { TabsRoot } from "reka-ui";

const props = defineProps<{
  /** 当前激活的标签值（v-model） */
  modelValue?: string;
  /** 初始激活值（非受控） */
  defaultValue?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <TabsRoot
    :model-value="props.modelValue"
    :default-value="props.defaultValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </TabsRoot>
</template>
