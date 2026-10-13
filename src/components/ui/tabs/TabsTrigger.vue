<script setup lang="ts">
/**
 * TabsTrigger —— 单个标签项。
 * 通过 reka-ui 的 data-state="active/inactive" 控制选中态高亮。
 */
import { TabsTrigger as RekaTabsTrigger } from "reka-ui";

defineProps<{
  /** 标签对应的值（与 TabsContent 的 value 匹配） */
  value: string;
  class?: string;
}>();
</script>

<template>
  <RekaTabsTrigger
    :value="value"
    class="inline-flex h-6 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded px-2 text-xs transition-colors data-[state=active]:bg-[color:var(--background)] data-[state=active]:text-[color:var(--foreground)] data-[state=active]:shadow-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    :class="$props.class"
  >
    <slot />
  </RekaTabsTrigger>
</template>
