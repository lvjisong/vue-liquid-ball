<script setup lang="ts">
/**
 * ColorControl —— 颜色选择器（颜色 A/B/C/D、高光、背景、玻璃罩等所有颜色参数）。
 *
 * 对应原 React 版 `toolcraft/ui/components/controls/color/` 颜色控件族。
 * 原版是几十个文件组成的完整颜色拾取器；本迁移实现一个功能等价、单文件的自研版本：
 *  - 每个颜色项显示为「色块 + 名称」，点击打开编辑弹层；
 *  - 编辑弹层包含：饱和度/亮度二维板（HSV）、色相滑条、十六进制输入与预览；
 *  - 使用原生 pointer 事件实现拖拽，颜色在拖动过程中实时上抛（v-model 更新）。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

export type ColorInput = {
  hex: string;
  name: string;
  showLabel?: boolean;
  onValueChange?: (value: { hex: string }) => void;
};

const props = defineProps<{
  inputs: ColorInput[];
}>();

/* ------------------------------------------------------------------ *
 * 颜色工具函数（hex <-> HSV <-> RGB）
 * ------------------------------------------------------------------ */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const to2 = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`.toUpperCase();
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === rf) h = 60 * (((gf - bf) / delta) % 6);
    else if (max === gf) h = 60 * ((bf - rf) / delta + 2);
    else h = 60 * ((rf - gf) / delta + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : delta / max;
  return { h, s, v: max };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return {
    r: (rgb[0] + m) * 255,
    g: (rgb[1] + m) * 255,
    b: (rgb[2] + m) * 255,
  };
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsv(r, g, b);
}

function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

/* ------------------------------------------------------------------ *
 * 组件状态
 * ------------------------------------------------------------------ */

/** 当前打开编辑器的颜色项索引；-1 表示关闭 */
const activeIndex = ref(-1);
/** 弹层定位 */
const popoverPosition = ref({ top: 0, left: 0 });
/** 拖拽中的颜色模型（HSV）与 hex 草稿 */
const activeHsv = ref({ h: 0, s: 0, v: 1 });
const hexDraft = ref("");
const editing = ref(false);
const panelRef = ref<HTMLDivElement | null>(null);
const boardRef = ref<HTMLDivElement | null>(null);
const hueRef = ref<HTMLDivElement | null>(null);

const activeInput = computed(() =>
  activeIndex.value >= 0 ? props.inputs[activeIndex.value] : null,
);

function openInput(index: number, element: HTMLElement): void {
  // 计算色块按钮位置，用于弹层定位
  const rect = element.getBoundingClientRect();
  popoverPosition.value = {
    top: Math.round(rect.bottom + 6),
    left: Math.min(Math.round(rect.left), window.innerWidth - 260),
  };
  activeIndex.value = index;
  const hsv = hexToHsv(props.inputs[index].hex);
  activeHsv.value = hsv;
  hexDraft.value = props.inputs[index].hex;
  editing.value = false;
}

function close(): void {
  activeIndex.value = -1;
}

/** 提交一个颜色值到外部（调用 onValueChange 上抛） */
function commitColor(hex: string): void {
  const input = activeInput.value;
  if (!input) return;
  const normalized = hex.toUpperCase();
  if (normalized !== input.hex) {
    input.onValueChange?.({ hex: normalized });
  }
}

/** 拖动二维板：根据事件坐标换算 s（x）/ v（y） */
function handleBoard(event: PointerEvent): void {
  const board = boardRef.value;
  if (!board) return;
  const rect = board.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  activeHsv.value = { ...activeHsv.value, s: x, v: 1 - y };
  commitColor(hsvToHex(activeHsv.value.h, x, 1 - y));
}

/** 拖动色相条：根据 x 换算 h（0-360） */
function handleHue(event: PointerEvent): void {
  const hue = hueRef.value;
  if (!hue) return;
  const rect = hue.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  activeHsv.value = { ...activeHsv.value, h: x * 360 };
  commitColor(hsvToHex(x * 360, activeHsv.value.s, activeHsv.value.v));
}

/* 统一的拖拽起止处理（pointer capture） */
function startBoardDrag(event: PointerEvent): void {
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  handleBoard(event);
}
function startHueDrag(event: PointerEvent): void {
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  handleHue(event);
}

/** 点击弹层外部关闭 */
function onDocumentPointerDown(event: PointerEvent): void {
  if (panelRef.value && !panelRef.value.contains(event.target as Node)) {
    close();
  }
}

/** 提交 hex 草稿 */
function commitHex(): void {
  editing.value = false;
  const hex = normalizeHex(hexDraft.value);
  if (!hex) return;
  activeHsv.value = hexToHsv(hex);
  commitColor(hex);
}

function normalizeHex(value: string): string | null {
  const match = value.trim().match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return null;
  return `#${match[1].toUpperCase()}`;
}

watch(activeIndex, (value) => {
  if (value >= 0) {
    window.addEventListener("pointerdown", onDocumentPointerDown);
  } else {
    window.removeEventListener("pointerdown", onDocumentPointerDown);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", onDocumentPointerDown);
});

/* HSV 板 / 色相条 背景样式 */
const boardStyle = computed(() => {
  const { h } = activeHsv.value;
  return {
    background: [
      `linear-gradient(to top, #000, rgba(0,0,0,0))`,
      `linear-gradient(to right, #fff, rgba(255,255,255,0))`,
      `hsl(${h}, 100%, 50%)`,
    ].join(", "),
  };
});

const indicatorStyle = computed(() => {
  const { s, v } = activeHsv.value;
  return { left: `${s * 100}%`, top: `${(1 - v) * 100}%` };
});

const hueIndicatorStyle = computed(() => {
  return { left: `${(activeHsv.value.h / 360) * 100}%` };
});

const previewStyle = computed(() => {
  return { backgroundColor: hsvToHex(activeHsv.value.h, activeHsv.value.s, activeHsv.value.v) };
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-[14px]" data-control-list="">
    <div
      v-for="(input, index) in inputs"
      :key="input.name"
      class="flex min-w-0 items-center gap-2"
    >
      <button
        type="button"
        :aria-label="`选择${input.name}`"
        class="relative size-8 shrink-0 overflow-hidden rounded-md border border-border/40 transition-colors hover:border-border"
        :style="{ backgroundColor: input.hex }"
        @click="openInput(index, ($event.currentTarget as HTMLElement))"
      >
        <span class="absolute inset-0 opacity-0 hover:opacity-10" />
      </button>
      <ControlFieldLabel v-if="input.showLabel !== false" :text-class-name="'opacity-90'">
        {{ input.name }}
      </ControlFieldLabel>
      <span class="ml-auto font-mono text-xs text-muted-foreground">{{ input.hex }}</span>
    </div>

    <!-- 颜色编辑弹层（Teleport 到 body 固定定位） -->
    <Teleport to="body">
      <div
        v-if="activeInput && activeIndex >= 0"
        ref="panelRef"
        class="floating-popup-surface fixed z-50 w-[260px] rounded-lg border p-3 shadow-xl"
        :style="{ top: `${popoverPosition.top}px`, left: `${popoverPosition.left}px` }"
        role="dialog"
        :aria-label="`选择${activeInput.name}`"
      >
        <div class="mb-2 text-xs font-medium text-muted-foreground">{{ activeInput.name }}</div>

        <!-- 饱和度/亮度二维板 -->
        <div
          ref="boardRef"
          class="relative h-36 w-full cursor-crosshair touch-none rounded-md"
          :style="boardStyle"
          @pointerdown="startBoardDrag"
          @pointermove="activeIndex >= 0 && ($event.buttons & 1) ? handleBoard($event) : undefined"
        >
          <div
            class="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
            :style="indicatorStyle"
          />
        </div>

        <!-- 色相滑条 -->
        <div
          ref="hueRef"
          class="relative mt-3 h-3 w-full cursor-pointer touch-none rounded-full"
          style="background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"
          @pointerdown="startHueDrag"
          @pointermove="activeIndex >= 0 && ($event.buttons & 1) ? handleHue($event) : undefined"
        >
          <div
            class="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
            :style="hueIndicatorStyle"
          />
        </div>

        <!-- 预览 + hex 输入 -->
        <div class="mt-3 flex items-center gap-2">
          <div class="size-6 shrink-0 rounded border border-border/40" :style="previewStyle" />
          <input
            v-if="editing"
            v-model="hexDraft"
            type="text"
            maxlength="7"
            class="h-6 w-full min-w-0 rounded border border-border bg-background px-1 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            @keydown.enter.prevent="commitHex"
            @keydown.esc.prevent="editing = false"
            @blur="commitHex"
          />
          <button
            v-else
            type="button"
            class="h-6 w-full min-w-0 rounded border border-transparent px-1 text-left font-mono text-xs text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            @click="(editing = true), nextTick(() => {})"
          >
            {{ hexDraft }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
