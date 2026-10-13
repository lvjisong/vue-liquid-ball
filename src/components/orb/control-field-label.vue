<script setup lang="ts">
/**
 * ControlFieldLabel —— 参数面板里的字段标签。
 *
 * 对应原 React 版 `toolcraft/ui/components/control-layout` 中的 ControlFieldLabel。
 * 本迁移做了简化：移除了原版的 help/action 上下文与 ScrollFade 渐隐，仅保留
 * 「标签文本 + 可选的 htmlFor」，满足当前 App 的实际使用（场景文字输入框标签）。
 */
import { cn } from "@/lib/utils";

defineProps<{
  /** 关联的表单控件 id（原生 label 语义） */
  htmlFor?: string;
  /** 覆盖默认文字样式 */
  textClassName?: string;
  /** 覆盖外层容器样式 */
  className?: string;
}>();
</script>

<template>
  <span
    :class="cn('inline-flex min-w-0 max-w-full items-center gap-0', className)"
    data-control-field-label=""
    data-slot="field-label"
  >
    <label
      v-if="htmlFor"
      :for="htmlFor"
      :class="cn(
        'block min-w-0 max-w-full whitespace-nowrap text-xs/relaxed leading-snug opacity-60',
        textClassName,
      )"
      data-slot="template-field-label-text"
    >
      <slot />
    </label>
    <span
      v-else
      :class="cn(
        'block min-w-0 max-w-full whitespace-nowrap text-xs/relaxed leading-snug opacity-60',
        textClassName,
      )"
      data-slot="template-field-label-text"
    >
      <slot />
    </span>
  </span>
</template>
