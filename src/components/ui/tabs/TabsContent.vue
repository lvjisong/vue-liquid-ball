<script setup lang="ts">
/**
 * TabsContent —— 标签内容区，仅激活时渲染。
 */
import { TabsContent as RekaTabsContent } from "reka-ui";

defineProps<{
  /** 与 TabsTrigger 的 value 匹配 */
  value: string;
  class?: string;
}>();
</script>

<template>
  <RekaTabsContent
    :value="value"
    class="mt-2 min-w-0 focus-visible:outline-none"
    :class="$props.class"
  >
    <slot />
  </RekaTabsContent>
</template>
