<script setup lang="ts">
/**
 * TabsList —— 标签条容器（激活项高亮）。
 */
import { TabsList as RekaTabsList } from "reka-ui";

defineProps<{ class?: string }>();
</script>

<template>
  <RekaTabsList
    class="inline-flex h-7 items-center justify-center rounded-md border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] p-0.5 text-muted-foreground"
    :class="$props.class"
  >
    <slot />
  </RekaTabsList>
</template>
