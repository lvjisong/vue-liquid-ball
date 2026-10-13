<script setup lang="ts">
/**
 * SegmentedControl —— 分段选择器（如语言切换：中/EN，预览模式：球体/场景，AI 状态：空闲/思考中）。
 *
 * 对应原 React 版 `toolcraft/ui/components/controls/segmented/segmented-control.tsx`。
 * 本迁移用原生 button 组实现（原版基于 ToggleGroup 无头组件），交互等价：
 * 点击选项切换选中态，并向上触发 `update:modelValue` / `change`。
 */
import { computed } from "vue";
import { cn } from "@/lib/utils";

export type SegmentedOption = {
  label: string;
  value: string;
  /** variant="dots" 时，选项前的小圆点颜色 */
  indicatorColor?: string;
};

const props = withDefaults(
  defineProps<{
    /** 控件名称（用作默认 aria-label 与标签） */
    name: string;
    /** 独立于 name 的 aria-label（无障碍） */
    ariaLabel?: string;
    /** 可选项 */
    options: readonly SegmentedOption[];
    /** 当前选中值 */
    modelValue?: string;
    /** 变体：default=纯文字，dots=带指示圆点 */
    variant?: "default" | "dots";
  }>(),
  { variant: "default", modelValue: "" },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();

/** 受控值：优先取外部 modelValue，否则回落为第一个选项 */
const selectedValue = computed(() =>
  props.modelValue || props.options[0]?.value || "",
);

function select(value: string): void {
  if (value === selectedValue.value) return;
  emit("update:modelValue", value);
  emit("change", value);
}
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2" data-slot="field" data-orientation="vertical">
    <ControlFieldLabel>{{ name }}</ControlFieldLabel>
    <div
      role="group"
      :aria-label="ariaLabel ?? name"
      class="flex w-full items-center rounded-md border border-border/20 bg-popover p-0.5"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :aria-label="option.label"
        :aria-pressed="option.value === selectedValue"
        :class="cn(
          'flex min-w-0 flex-1 items-center justify-center gap-[7px] rounded-[0.25rem] px-2 py-1 text-xs transition-colors',
          option.value === selectedValue
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
          variant === 'dots' && 'gap-[7px]',
        )"
        @click="select(option.value)"
      >
        <span
          v-if="variant === 'dots'"
          aria-hidden="true"
          class="size-2 shrink-0 rounded-full"
          :style="{ backgroundColor: option.indicatorColor ?? 'currentColor' }"
        />
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
