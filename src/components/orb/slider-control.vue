<script setup lang="ts">
/**
 * SliderControl —— 参数面板里的滑块控件（速度、半径、曝光、丝带宽度等所有数值参数）。
 *
 * 对应原 React 版 `toolcraft/ui/components/controls/slider/slider-control.tsx`。
 * 结构：字段标签 + 可编辑数值 + 滑块轨道。
 * 本迁移用原生 <input type="range"> 实现滑块，并实现「点击数值即可直接输入」的编辑交互
 * （替代原版的 EditableSliderValueLabel）。滑块支持「双击回到 baseValue（预设基准值）」。
 */
import { computed, nextTick, ref } from "vue";

const props = withDefaults(
  defineProps<{
    /** 参数名（标签与 aria-label） */
    name: string;
    /** 当前值（v-model） */
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
    /** 数值单位（如 s） */
    unit?: string;
    /** 预设基准值：双击滑块时回到该值 */
    baseValue?: number;
    /** 是否填充滑块已占部分（轨道高亮） */
    showFill?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 覆盖容器样式 */
    className?: string;
  }>(),
  { min: 0, max: 100, step: 1, unit: "", showFill: false, disabled: false },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
  (e: "change", value: number): void;
}>();

/** 格式化显示值（step 含小数时保留对应小数位） */
const displayLabel = computed(() => {
  const decimals = getDecimals(props.step);
  const text = props.modelValue.toFixed(decimals);
  return props.unit ? `${text}${props.unit}` : text;
});

/** 计算 step 的小数位数，用于数值格式化 */
function getDecimals(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0;
  const text = String(step);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

/** 是否正在编辑数值 */
const editing = ref(false);
const draft = ref("");
const draftInput = ref<HTMLInputElement | null>(null);

function startEdit(): void {
  if (props.disabled) return;
  editing.value = true;
  draft.value = String(props.modelValue);
  void nextTick(() => {
    draftInput.value?.focus();
    draftInput.value?.select();
  });
}

/** 提交编辑：解析并夹取到 [min, max] */
function commitEdit(): void {
  editing.value = false;
  const parsed = Number(draft.value);
  if (!Number.isFinite(parsed)) return;
  commit(clamp(parsed, props.min, props.max));
}

/** 提交值（夹取 + 上抛） */
function commit(value: number): void {
  const clamped = clamp(value, props.min, props.max);
  emit("update:modelValue", clamped);
  emit("change", clamped);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 双击滑块回到基准值 */
function resetToBase(): void {
  if (typeof props.baseValue === "number") commit(props.baseValue);
}

/** 计算滑块填充百分比（showFill 时高亮轨道已占部分） */
const fillPercent = computed(() => {
  const total = props.max - props.min;
  if (total <= 0) return 0;
  return Math.round(((props.modelValue - props.min) / total) * 100);
});
</script>

<template>
  <div
    class="flex min-w-0 flex-col gap-1"
    :class="className"
    :data-disabled="disabled"
    data-slot="field"
    data-orientation="vertical"
  >
    <!-- 标签行：字段名 + 可编辑数值 -->
    <div class="flex w-full min-w-0 items-center justify-between gap-3">
      <ControlFieldLabel>{{ name }}</ControlFieldLabel>
      <div class="inline-flex h-5 shrink-0 items-center gap-1.5">
        <input
          v-if="editing"
          ref="draftInput"
          v-model="draft"
          type="number"
          :aria-label="`编辑${name}数值`"
          class="h-5 w-16 rounded border border-border bg-background px-1 text-right text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          @blur="commitEdit"
          @keydown.enter.prevent="commitEdit"
          @keydown.esc.prevent="editing = false"
        />
        <button
          v-else
          type="button"
          :aria-label="`编辑${name}数值`"
          class="h-5 min-w-6 rounded px-1 font-mono text-xs tabular-nums text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          @click="startEdit"
        >
          {{ displayLabel }}
        </button>
      </div>
    </div>

    <!-- 滑块轨道 -->
    <div class="relative flex h-5 w-full items-center">
      <div class="relative h-1.5 w-full rounded-full bg-muted/60">
        <div
          v-if="showFill"
          class="absolute inset-y-0 left-0 rounded-full bg-accent"
          :style="{ width: `${fillPercent}%` }"
        />
        <div
          class="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full border border-background bg-foreground shadow transition-transform hover:scale-110"
          :style="{ left: `calc(${fillPercent}% - 7px)` }"
        />
      </div>
      <input
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        :aria-label="name"
        :disabled="disabled"
        class="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        @input="commit(Number(($event.target as HTMLInputElement).value))"
        @dblclick="resetToBase"
      />
    </div>
  </div>
</template>
