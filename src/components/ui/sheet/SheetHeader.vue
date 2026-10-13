<script setup lang="ts">
/**
 * SheetHeader —— 底部滑出面板的头部容器（居中标题）。
 */
defineProps<{ class?: string }>();
</script>

<template>
  <div
    class="flex shrink-0 flex-col items-center gap-1 border-b border-[color:color-mix(in_oklab,var(--border)_8%,transparent)] py-3 text-center"
    :class="$props.class"
  >
    <slot />
  </div>
</template>
