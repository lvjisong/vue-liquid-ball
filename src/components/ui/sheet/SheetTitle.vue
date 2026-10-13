<script setup lang="ts">
/**
 * SheetTitle —— 底部滑出面板的标题（无障碍语义标题）。
 */
import { DialogTitle } from "reka-ui";

defineProps<{ class?: string }>();
</script>

<template>
  <DialogTitle
    class="m-0 text-sm font-medium text-[color:var(--foreground)]"
    :class="$props.class"
  >
    <slot />
  </DialogTitle>
</template>
