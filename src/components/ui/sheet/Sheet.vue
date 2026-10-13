<script setup lang="ts">
/**
 * Sheet —— 底部滑出面板（shadcn-vue 风格，基于 reka-ui Dialog）。
 *
 * 对应原 React 版 `toolcraft/ui/components/composites/sheet.tsx`。
 * App 中用于「代码导出」底部弹层：显示 Web / SwiftUI 导出的代码。
 * 控制方式：v-model:open（:open + @update:open）。
 */
import { DialogRoot } from "reka-ui";

const props = defineProps<{
  /** 是否打开（v-model） */
  open?: boolean;
  /** 是否模态（拦截点击外部） */
  modal?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

function onOpenChange(value: boolean): void {
  emit("update:open", value);
}
</script>

<template>
  <DialogRoot :open="props.open" :modal="props.modal" @update:open="onOpenChange">
    <slot />
  </DialogRoot>
</template>
