<script setup lang="ts">
/**
 * SwitchControl —— 布尔开关控件（如「开启玻璃罩」）。
 *
 * 对应原 React 版 `toolcraft/ui/components/controls/boolean/boolean-controls.tsx` 的 SwitchControl。
 * 本迁移用原生 checkbox + Tailwind 样式模拟开关外观，行为等价于受控 Switch。
 */
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    /** 是否选中 */
    modelValue?: boolean;
    /** 控件名称（标签与 aria-label） */
    name: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否显示文字标签 */
    showLabel?: boolean;
  }>(),
  { modelValue: false, disabled: false, showLabel: true },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "change", value: boolean): void;
}>();

function toggle(): void {
  if (props.disabled) return;
  const next = !props.modelValue;
  emit("update:modelValue", next);
  emit("change", next);
}
</script>

<template>
  <div
    class="flex h-fit min-w-0 flex-row items-center justify-start py-1"
    style="gap: 8px"
    data-slot="field"
    data-orientation="horizontal"
  >
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-label="name"
      :disabled="disabled"
      :data-state="modelValue ? 'checked' : 'unchecked'"
      :class="cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        modelValue ? 'bg-accent' : 'bg-muted',
      )"
      @click="toggle"
    >
      <span
        :class="cn(
          'pointer-events-none block size-3.5 rounded-full bg-white shadow-lg ring-0 transition-transform',
          modelValue ? 'translate-x-4' : 'translate-x-0.5',
        )"
      />
    </button>
    <ControlFieldLabel v-if="showLabel" textClassName="opacity-90">
      {{ name }}
    </ControlFieldLabel>
  </div>
</template>
