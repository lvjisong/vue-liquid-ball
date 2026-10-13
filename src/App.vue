<script setup lang="ts">
/**
 * App.vue —— 液态玻璃球编辑器的根组件。
 *
 * 对应原 React 版 `src/App.tsx`，逻辑与布局保持一一对应，仅将 JSX 改写为 Vue 模板、
 * React 状态钩子改写为 Vue 响应式 API（ref / computed / watch / 生命周期钩子）。
 *
 * 功能概览：
 *  - 左侧「预设面板」：选择 13 种液态玻璃风格（预设数据来自 core/presets.ts）；
 *  - 中间「预览舞台」：WebGPU 实时渲染（core/orb-renderer.ts）+ 场景文字叠加 + 缩放滚轮；
 *  - 右侧「参数面板」：状态/运动/颜色/形状/玻璃罩/边缘 等分组参数编辑；
 *  - 底部「代码导出」Sheet：一键导出独立 Web 页面或 SwiftUI 代码（core/code-export.ts）；
 *  - 音频响应：麦克风/音频文件驱动流动、形变与高光（AudioControls.vue）。
 *
 * URL hash 同步：参数、预设、预览模式、场景文字均通过 hash 持久化与分享。
 */
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { PhCode, PhCopySimple, PhGithubLogo } from "@phosphor-icons/vue";

/* ---------- UI 组件（shadcn 基础 + orb 专用） ---------- */
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ControlFieldLabel from "@/components/orb/control-field-label.vue";
import SwitchControl from "@/components/orb/switch-control.vue";
import SegmentedControl from "@/components/orb/segmented-control.vue";
import SliderControl from "@/components/orb/slider-control.vue";
import Panel from "@/components/orb/panel.vue";
import PanelSection from "@/components/orb/panel-section.vue";
import ColorControl from "@/components/orb/color-control.vue";
import AudioControls from "@/components/orb/AudioControls.vue";

/* ---------- 核心引擎（纯 TS，原样复用） ---------- */
import { createSwiftExport, createWebExport } from "@/core/code-export";
import {
  colorLabels,
  localeOptions,
  numericLabels,
  styleLabels,
  uiCopy,
  type ColorKey,
  type Locale,
  type NumericKey,
} from "@/core/editor-i18n";
import { createOrbRenderer } from "@/core/orb-renderer";
import { OrbAudioInput } from "@/core/orb-audio";
import {
  createOrbStateConfiguration,
  createPresetOrbStateConfiguration,
  defaultOrbActivationDuration,
  defaultOrbState,
  defaultOrbTransitionDuration,
  isOrbStateProfileKey,
  orbStateNames,
  orbStateProfileKeys,
  resolveOrbStateParams,
  updateOrbStateParam,
  type OrbStateConfiguration,
  type OrbStateName,
} from "@/core/orb-states";
import {
  effectDefaults,
  orbRadiusRange,
  styleNames,
  stylePresets,
  type OrbParams,
  type StyleName,
} from "@/core/presets";

/* ---------- 预设预览图 ---------- */
import siriPreviewUrl from "@/assets/presets/siri.png";
import voiceWavePreviewUrl from "@/assets/presets/voiceWave.png";
import spectrumPreviewUrl from "@/assets/presets/spectrum.png";
import auroraPreviewUrl from "@/assets/presets/aurora.png";
import frostPreviewUrl from "@/assets/presets/frost.png";
import plasmaPreviewUrl from "@/assets/presets/plasma.png";
import chromePreviewUrl from "@/assets/presets/chrome.png";
import opalPreviewUrl from "@/assets/presets/opal.png";
import blueDropPreviewUrl from "@/assets/presets/blueDrop.png";
import violetEmberPreviewUrl from "@/assets/presets/violetEmber.png";
import refractiveBlobPreviewUrl from "@/assets/presets/refractiveBlob.png";
import particleRibbonPreviewUrl from "@/assets/presets/particleRibbon.png";
import chromaticMetalPreviewUrl from "@/assets/presets/chromaticMetal.png";
import posterUrl from "@/assets/poster.png";

const stylePreviewUrls: Record<StyleName, string> = {
  siri: siriPreviewUrl,
  voiceWave: voiceWavePreviewUrl,
  spectrum: spectrumPreviewUrl,
  aurora: auroraPreviewUrl,
  frost: frostPreviewUrl,
  plasma: plasmaPreviewUrl,
  chrome: chromePreviewUrl,
  opal: opalPreviewUrl,
  blueDrop: blueDropPreviewUrl,
  violetEmber: violetEmberPreviewUrl,
  refractiveBlob: refractiveBlobPreviewUrl,
  particleRibbon: particleRibbonPreviewUrl,
  chromaticMetal: chromaticMetalPreviewUrl,
};
/** 需要更紧凑预览图排版的预设 */
const compactPreviewStyles = new Set<StyleName>([
  "particleRibbon",
  "blueDrop",
  "violetEmber",
  "refractiveBlob",
  "chromaticMetal",
]);

type PreviewMode = "orb" | "scene";

/* ---------- 常量（与 App.tsx 一致） ---------- */
const defaultSceneText = "Thinking...";
const maxSceneTextLength = 20;
const hashSyncDelayMs = 500;
const localeStorageKey = "liquid-orb-editor-locale";
const activationDurationRange = { min: 0.05, max: 0.8, step: 0.01 } as const;
const transitionDurationRange = { min: 0.1, max: 2, step: 0.05 } as const;

type OrbEditorState = {
  configuration: OrbStateConfiguration;
  activeState: OrbStateName;
};

type NumericSpec = {
  key: NumericKey;
  min: number;
  max: number;
  step: number;
  enabledStyles?: readonly StyleName[];
};

/* 各样式对参数的启用范围（决定哪些滑块显示） */
const ridgeStyles: readonly StyleName[] = ["siri", "voiceWave", "spectrum", "aurora", "frost", "plasma", "blueDrop", "violetEmber", "refractiveBlob"];
const sharpStyles: readonly StyleName[] = ["frost", "plasma", "chrome", "blueDrop", "violetEmber", "refractiveBlob"];
const standardShapeStyles = styleNames.filter((style) => style !== "chromaticMetal" && style !== "particleRibbon");
const chromaticMetalStyles: readonly StyleName[] = ["chromaticMetal"];
const particleRibbonStyles: readonly StyleName[] = ["particleRibbon"];

const numericSpecs: readonly NumericSpec[] = [
  { key: "speed", min: 0, max: 3, step: 0.01 },
  { key: "radius", ...orbRadiusRange, step: 0.01 },
  { key: "contourDeform", min: 0, max: 1, step: 0.01, enabledStyles: standardShapeStyles },
  { key: "zoom", min: 0.05, max: 1, step: 0.01, enabledStyles: standardShapeStyles },
  { key: "warp", min: 0, max: 6, step: 0.05, enabledStyles: standardShapeStyles },
  { key: "ridgeAmt", min: 0, max: 1, step: 0.01, enabledStyles: ridgeStyles },
  { key: "sharp", min: 0.5, max: 6, step: 0.05, enabledStyles: sharpStyles },
  { key: "bandDensity", min: 1, max: 6, step: 0.1, enabledStyles: chromaticMetalStyles },
  { key: "metalDepth", min: 0, max: 1, step: 0.01, enabledStyles: chromaticMetalStyles },
  { key: "metalRoughness", min: 0, max: 1, step: 0.01, enabledStyles: chromaticMetalStyles },
  { key: "chromaticShift", min: 0, max: 1, step: 0.01, enabledStyles: chromaticMetalStyles },
  { key: "metalScale", min: 0.2, max: 2, step: 0.01, enabledStyles: chromaticMetalStyles },
  { key: "metalStretch", min: 0, max: 1, step: 0.01, enabledStyles: chromaticMetalStyles },
  { key: "metalAngle", min: -180, max: 180, step: 1, enabledStyles: chromaticMetalStyles },
  { key: "metalOffset", min: -1, max: 1, step: 0.01, enabledStyles: chromaticMetalStyles },
  { key: "metalPhase", min: 0, max: 1, step: 0.01, enabledStyles: chromaticMetalStyles },
  { key: "metalEvolution", min: 0, max: 2, step: 0.02, enabledStyles: chromaticMetalStyles },
  { key: "particleDensity", min: 0.2, max: 1, step: 0.01, enabledStyles: particleRibbonStyles },
  { key: "ribbonCount", min: 2, max: 6, step: 1, enabledStyles: particleRibbonStyles },
  { key: "ribbonWidth", min: 0.1, max: 0.8, step: 0.01, enabledStyles: particleRibbonStyles },
  { key: "ribbonTwist", min: 0.1, max: 3, step: 0.01, enabledStyles: particleRibbonStyles },
  { key: "ribbonFold", min: 0, max: 1.2, step: 0.01, enabledStyles: particleRibbonStyles },
  { key: "ribbonBreath", min: 0, max: 0.8, step: 0.01, enabledStyles: particleRibbonStyles },
  { key: "particleSize", min: 0.6, max: 2.5, step: 0.01, enabledStyles: particleRibbonStyles },
  { key: "particleBloom", min: 0, max: 2, step: 0.01, enabledStyles: particleRibbonStyles },
  { key: "shade", min: 0, max: 1.5, step: 0.01 },
  { key: "exposure", min: 0.2, max: 3, step: 0.02 },
  { key: "sheen", min: 0, max: 2, step: 0.02 },
  { key: "gloss", min: 0, max: 2, step: 0.02 },
  { key: "glassOpacity", min: 0, max: 1, step: 0.01 },
  { key: "shellMidAlpha", min: 0, max: 1, step: 0.01 },
  { key: "shellEdgeAlpha", min: 0, max: 1, step: 0.01 },
  { key: "edgeSoftness", min: 0.005, max: 0.15, step: 0.005 },
  { key: "edgeGlow", min: 0, max: 1, step: 0.01 },
];

const numericSpecByKey = new Map(numericSpecs.map((spec) => [spec.key, spec]));
const colorKeys: readonly ColorKey[] = ["colorA", "colorB", "colorC", "colorD", "highlightColor", "shellInner", "shellMid", "shellEdge", "sheenColor", "specColor", "canvasColor", "glowColor"];

/* 各参数面板分区的滑块清单（用于模板 v-for） */
const motionSliderKeys: NumericKey[] = ["speed"];
const colorSliderKeys: NumericKey[] = ["shade", "exposure"];
const shapeSliderKeys: NumericKey[] = ["radius", "contourDeform", "zoom", "warp", "ridgeAmt", "sharp", "metalDepth", "metalRoughness", "chromaticShift", "metalScale", "metalStretch", "metalAngle", "bandDensity", "metalOffset", "metalPhase", "metalEvolution", "particleDensity", "ribbonCount", "ribbonWidth", "ribbonTwist", "ribbonFold", "ribbonBreath", "particleSize", "particleBloom"];
const glassSliderKeys: NumericKey[] = ["glassOpacity", "sheen", "gloss", "shellMidAlpha", "shellEdgeAlpha"];
const edgeSliderKeys: NumericKey[] = ["edgeSoftness", "edgeGlow"];

/* ---------- 工具函数 ---------- */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
function normalizeColor(value: string): string | null {
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : null;
}
function limitSceneText(value: string): string {
  return Array.from(value).slice(0, maxSceneTextLength).join("");
}

function readInitialLocale(): Locale {
  try {
    const storedLocale = window.localStorage.getItem(localeStorageKey);
    if (storedLocale === "zh" || storedLocale === "en") return storedLocale;
  } catch (error) {
    console.warn("Unable to read the saved interface language.", error);
  }
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}
function readPreviewModeFromHash(): PreviewMode {
  return new URLSearchParams(window.location.hash.slice(1)).get("preview") === "scene" ? "scene" : "orb";
}
function readSceneTextFromHash(): string {
  const text = new URLSearchParams(window.location.hash.slice(1)).get("text");
  return text === null ? defaultSceneText : limitSceneText(text);
}
function stateHashKey(state: OrbStateName, key: string): string {
  if (state === "thinking") return key;
  return `idle${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}

/** 从 URL hash 读取编辑器状态（预设 + 参数 + 状态） */
function readEditorStateFromHash(): OrbEditorState {
  const search = new URLSearchParams(window.location.hash.slice(1));
  const style = search.get("style");
  const selectedStyle = style && styleNames.includes(style as StyleName) ? (style as StyleName) : effectDefaults.style;
  const params: OrbParams = { style: selectedStyle, ...stylePresets[selectedStyle] };

  const glass = search.get("glass");
  if (glass === "1") params.glassEnabled = true;
  if (glass === "0") params.glassEnabled = false;

  for (const spec of numericSpecs) {
    const raw = search.get(spec.key);
    if (raw === null) continue;
    const value = Number(raw);
    if (Number.isFinite(value)) params[spec.key] = clamp(value, spec.min, spec.max);
  }
  for (const key of colorKeys) {
    const raw = search.get(key);
    if (raw === null) continue;
    const value = normalizeColor(raw);
    if (value) params[key] = value;
  }

  const transitionRaw = search.get("transition");
  const transitionValue = transitionRaw === null ? null : Number(transitionRaw);
  const transitionDuration = transitionValue !== null && Number.isFinite(transitionValue)
    ? clamp(transitionValue, transitionDurationRange.min, transitionDurationRange.max)
    : defaultOrbTransitionDuration;
  const activationRaw = search.get("activation");
  const activationValue = activationRaw === null ? null : Number(activationRaw);
  const activationDuration = activationValue !== null && Number.isFinite(activationValue)
    ? clamp(activationValue, activationDurationRange.min, activationDurationRange.max)
    : defaultOrbActivationDuration;

  let configuration = createOrbStateConfiguration(params, transitionDuration, activationDuration);

  for (const key of orbStateProfileKeys) {
    const raw = search.get(stateHashKey("idle", key));
    if (raw === null) continue;
    if (typeof configuration.profiles.idle[key] === "number") {
      const spec = numericSpecByKey.get(key as NumericKey);
      const value = Number(raw);
      if (spec && Number.isFinite(value)) {
        configuration = updateOrbStateParam(configuration, "idle", key, clamp(value, spec.min, spec.max));
      }
    } else {
      const color = normalizeColor(raw);
      if (color) configuration = updateOrbStateParam(configuration, "idle", key, color);
    }
  }

  const state = search.get("state");
  const activeState = state && orbStateNames.includes(state as OrbStateName) ? (state as OrbStateName) : defaultOrbState;
  return { configuration, activeState };
}

/** 把当前状态写入 URL hash（带防抖） */
function writeHash(editorState: OrbEditorState, previewMode: PreviewMode, sceneText: string): void {
  const { configuration, activeState } = editorState;
  const params = resolveOrbStateParams(configuration, "thinking");
  const search = new URLSearchParams();
  search.set("effect", "orb-glass-liquid");
  search.set("style", params.style);
  search.set("glass", params.glassEnabled ? "1" : "0");
  search.set("state", activeState);
  search.set("activation", String(configuration.activationDuration));
  search.set("transition", String(configuration.transitionDuration));
  search.set("preview", previewMode);
  search.set("text", sceneText);
  for (const spec of numericSpecs) {
    search.set(spec.key, String(params[spec.key]));
    if (isOrbStateProfileKey(spec.key)) {
      search.set(stateHashKey("idle", spec.key), String(configuration.profiles.idle[spec.key]));
    }
  }
  for (const key of colorKeys) {
    search.set(key, params[key]);
    if (isOrbStateProfileKey(key)) {
      search.set(stateHashKey("idle", key), configuration.profiles.idle[key]);
    }
  }
  window.history.replaceState(null, "", `#${search.toString()}`);
}

/* ---------- 组件状态 ---------- */
const audioInput = new OrbAudioInput();
const audioResetKey = ref(0);
const locale = ref<Locale>(readInitialLocale());
const editorState = ref<OrbEditorState>(readEditorStateFromHash());
const renderState = ref<"loading" | "ready" | "error">("loading");
const errorMessage = ref("");
const presetCollapsed = ref(false);
const propertiesCollapsed = ref(false);
const previewScale = ref(1);
const previewMode = ref<PreviewMode>(readPreviewModeFromHash());
const sceneText = ref(readSceneTextFromHash());
const codeOpen = ref(false);
const codePlatform = ref<"web" | "swift">("web");
const copiedPlatform = ref<"web" | "swift" | "error" | null>(null);
const codeState = ref<OrbEditorState | null>(null);

/* DOM 引用 */
const canvasRef = ref<HTMLCanvasElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const copyBufferRef = ref<HTMLTextAreaElement | null>(null);

/* 渲染目标：渲染器每帧读取的引用，避免重建渲染器 */
const renderTargetRef = ref({
  state: editorState.value.activeState,
  params: resolveOrbStateParams(editorState.value.configuration, editorState.value.activeState),
  activationDuration: editorState.value.configuration.activationDuration,
  transitionDuration: editorState.value.configuration.transitionDuration,
});

/* 当前解析后的参数（供模板与渲染目标使用） */
const params = computed(() =>
  resolveOrbStateParams(editorState.value.configuration, editorState.value.activeState),
);
/* 当前预设的出厂参数（作为滑块 baseValue，双击回到预设值） */
const presetStateParams = computed(() =>
  resolveOrbStateParams(createPresetOrbStateConfiguration(params.value.style), editorState.value.activeState),
);
/* i18n 文案 */
const copy = computed(() => uiCopy[locale.value]);

/* 分区折叠状态（state/motion/colors/shape/glass/edge/scene） */
const sectionCollapsed = reactive<Record<string, boolean>>({
  state: false,
  motion: false,
  colors: true,
  shape: true,
  glass: false,
  edge: false,
  scene: false,
});
function isSectionCollapsed(key: string): boolean {
  return sectionCollapsed[key] ?? false;
}
function onSectionCollapsedChange(key: string, value: boolean): void {
  sectionCollapsed[key] = value;
}

/* 响应式窄屏布局（<900px 时面板不可折叠） */
const stackedLayout = ref(false);
function updateStackedLayout(): void {
  stackedLayout.value = window.matchMedia("(max-width: 900px)").matches;
}

/* 分段选项 */
const previewModeOptions = computed(() => [
  { label: copy.value.orbMode, value: "orb" },
  { label: copy.value.sceneMode, value: "scene" },
]);
const orbStateOptions = computed(() => [
  { label: copy.value.idleState, value: "idle" },
  { label: copy.value.thinkingState, value: "thinking" },
]);

/* 导出的代码（仅打开时计算一次） */
const webCode = computed(() =>
  codeState.value ? createWebExport(codeState.value.configuration, codeState.value.activeState) : "",
);
const swiftCode = computed(() =>
  codeState.value ? createSwiftExport(codeState.value.configuration, codeState.value.activeState) : "",
);

/* ---------- 参数操作 ---------- */
function setParam<Key extends keyof OrbParams>(key: Key, value: OrbParams[Key]): void {
  const current = editorState.value;
  editorState.value = {
    ...current,
    configuration: updateOrbStateParam(current.configuration, current.activeState, key, value),
  };
}

function applyStyle(style: StyleName): void {
  const current = editorState.value;
  editorState.value = {
    activeState: current.activeState,
    configuration: {
      ...createPresetOrbStateConfiguration(style),
      activationDuration: current.configuration.activationDuration,
      transitionDuration: current.configuration.transitionDuration,
    },
  };
}

function resetAll(): void {
  audioResetKey.value++;
  editorState.value = {
    activeState: defaultOrbState,
    configuration: createPresetOrbStateConfiguration(effectDefaults.style),
  };
  sceneText.value = defaultSceneText;
  previewScale.value = 1;
}

function updatePreviewMode(value: string): void {
  if (value !== "orb" && value !== "scene") return;
  previewMode.value = value;
  previewScale.value = 1;
}

function updateOrbState(value: string): void {
  if (!orbStateNames.includes(value as OrbStateName)) return;
  editorState.value = { ...editorState.value, activeState: value as OrbStateName };
}

function updateTransitionDuration(value: number): void {
  const current = editorState.value;
  editorState.value = {
    ...current,
    configuration: { ...current.configuration, transitionDuration: value },
  };
}

function updateActivationDuration(value: number): void {
  const current = editorState.value;
  editorState.value = {
    ...current,
    configuration: { ...current.configuration, activationDuration: value },
  };
}

/* ---------- 代码导出 ---------- */
function openCode(): void {
  codeState.value = {
    activeState: editorState.value.activeState,
    configuration: {
      ...editorState.value.configuration,
      shared: { ...editorState.value.configuration.shared },
      profiles: {
        idle: { ...editorState.value.configuration.profiles.idle },
        thinking: { ...editorState.value.configuration.profiles.thinking },
      },
    },
  };
  copiedPlatform.value = null;
  codeOpen.value = true;
}

async function copyCode(): Promise<void> {
  const code = codePlatform.value === "web" ? webCode.value : swiftCode.value;
  try {
    await navigator.clipboard.writeText(code);
    copiedPlatform.value = codePlatform.value;
  } catch {
    const copyBuffer = copyBufferRef.value;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!copyBuffer) {
      copiedPlatform.value = "error";
      return;
    }
    copyBuffer.value = code;
    copyBuffer.focus();
    copyBuffer.select();
    const copied = document.execCommand("copy");
    previousFocus?.focus();
    copiedPlatform.value = copied ? codePlatform.value : "error";
  }
}

function onSheetOpenChange(open: boolean): void {
  codeOpen.value = open;
  if (!open) copiedPlatform.value = null;
}

function onCodePlatformChange(value: string): void {
  if (value === "web" || value === "swift") {
    codePlatform.value = value;
    copiedPlatform.value = null;
  }
}

/* ---------- 滑块辅助 ---------- */
function sliderVisible(key: NumericKey): boolean {
  const spec = numericSpecByKey.get(key);
  if (!spec) return false;
  if (spec.enabledStyles && !spec.enabledStyles.includes(params.value.style)) return false;
  return true;
}
function sliderSpec(key: NumericKey) {
  return numericSpecByKey.get(key)!;
}

/* ---------- 颜色辅助 ---------- */
function colorInput(key: ColorKey) {
  const name = colorLabels[locale.value][key];
  return {
    hex: params.value[key],
    name,
    onValueChange: ({ hex }: { hex: string }) => setParam(key, hex),
    showLabel: true,
  };
}

/* ---------- 生命周期 ---------- */
let disposeRenderer: (() => void) | null = null;
let disposeStageWheel: (() => void) | null = null;

onMounted(() => {
  /* 1. 渲染器创建（仅一次；渲染器通过 getTarget 读取最新状态） */
  const canvas = canvasRef.value;
  if (canvas) {
    disposeRenderer = createOrbRenderer({
      canvas,
      getTarget: () => renderTargetRef.value,
      getAudioBands: (dt) => audioInput.read(dt),
      onError: (error) => {
        errorMessage.value = error.message;
        renderState.value = "error";
      },
      onReady: () => {
        renderState.value = renderState.value === "ready" ? "ready" : "ready";
      },
    });
  }

  /* 2. 舞台滚轮缩放（previewScale 0.6~1.6） */
  const stage = stageRef.value;
  if (stage) {
    const handleWheel = (event: WheelEvent) => {
      if (event.target instanceof Element && event.target.closest("[data-stage-controls]")) return;
      event.preventDefault();
      const modeScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? stage.clientHeight : 1;
      const delta = clamp(-event.deltaY * modeScale * 0.001, -0.1, 0.1);
      previewScale.value = Math.round(clamp(previewScale.value + delta, 0.6, 1.6) * 100) / 100;
    };
    stage.addEventListener("wheel", handleWheel, { passive: false });
    disposeStageWheel = () => stage.removeEventListener("wheel", handleWheel);
  }
});

onBeforeUnmount(() => {
  disposeRenderer?.();
  disposeStageWheel?.();
});

/* 语言变化：更新 <html lang>、文档标题并持久化 */
watch(locale, (value) => {
  document.documentElement.lang = value === "zh" ? "zh-CN" : "en";
  document.title = uiCopy[value].documentTitle;
  try {
    window.localStorage.setItem(localeStorageKey, value);
  } catch (error) {
    console.warn("Unable to save the interface language.", error);
  }
});
onMounted(() => {
  document.documentElement.lang = locale.value === "zh" ? "zh-CN" : "en";
  document.title = uiCopy[locale.value].documentTitle;
});

/* 参数变化：防抖写入 hash */
let hashTimer = 0;
watch(
  [editorState, previewMode, sceneText],
  () => {
    window.clearTimeout(hashTimer);
    hashTimer = window.setTimeout(() => {
      writeHash(editorState.value, previewMode.value, sceneText.value);
    }, hashSyncDelayMs);
  },
  { deep: true },
);

/* hash 变化（如浏览器前进后退 / 手动改链接）：重新读取状态 */
function syncFromHash(): void {
  editorState.value = readEditorStateFromHash();
  previewMode.value = readPreviewModeFromHash();
  sceneText.value = readSceneTextFromHash();
  previewScale.value = 1;
}
onMounted(() => window.addEventListener("hashchange", syncFromHash));
onBeforeUnmount(() => {
  window.removeEventListener("hashchange", syncFromHash);
  window.clearTimeout(hashTimer);
});

/* 画布背景色同步到 CSS 变量（供 orb-canvas 场景模式使用） */
watch(
  () => params.value.canvasColor,
  (value) => document.documentElement.style.setProperty("--orb-canvas-color", value),
);

/* 渲染目标每帧跟随最新状态 */
watch(
  [editorState, params],
  () => {
    renderTargetRef.value = {
      state: editorState.value.activeState,
      params: params.value,
      activationDuration: editorState.value.configuration.activationDuration,
      transitionDuration: editorState.value.configuration.transitionDuration,
    };
  },
  { immediate: true, deep: true },
);

/* 初始化窄屏布局监听 */
updateStackedLayout();
window.addEventListener("resize", updateStackedLayout);
</script>

<template>
  <TooltipProvider>
    <main
      class="orb-editor"
      :data-preset-collapsed="String(!stackedLayout && presetCollapsed)"
      :data-properties-collapsed="String(!stackedLayout && propertiesCollapsed)"
    >
      <!-- ============ 左侧：预设面板 ============ -->
      <aside class="preset-dock" :aria-label="copy.presets">
        <Panel
          class="preset-panel h-full max-h-none w-full rounded-lg"
          :collapsed="presetCollapsed"
          collapse-direction="left"
          :collapse-label="copy.collapsePresets"
          :collapsible="!stackedLayout"
          :expand-label="copy.expandPresets"
          @update:collapsed="presetCollapsed = $event"
          :title="copy.presets"
        >
          <PanelSection>
            <div class="preset-control">
              <div class="preset-grid" role="group" :aria-label="copy.animatedPresets">
                <Button
                  v-for="style in styleNames"
                  :key="style"
                  type="button"
                  variant="outline"
                  class="preset-button"
                  :aria-pressed="params.style === style"
                  @click="applyStyle(style)"
                >
                  <img
                    alt=""
                    aria-hidden="true"
                    :class="`preset-preview${compactPreviewStyles.has(style) ? ' preset-preview--compact' : ''}`"
                    :src="stylePreviewUrls[style]"
                  />
                  <span :title="styleLabels[locale][style]">{{ styleLabels[locale][style] }}</span>
                </Button>
              </div>
            </div>
          </PanelSection>
        </Panel>
      </aside>

      <!-- ============ 中间：预览舞台 ============ -->
      <section
        ref="stageRef"
        class="orb-stage"
        :aria-label="previewMode === 'scene' ? copy.scenePreview : copy.orbPreview"
        :data-preview-mode="previewMode"
        :style="{ '--preview-scale': previewScale }"
      >
        <div class="language-control" data-stage-controls>
          <SegmentedControl
            :aria-label="copy.switchLanguage"
            :name="copy.switchLanguage"
            :options="localeOptions"
            :model-value="locale"
            @update:model-value="(value: string) => { if (value === 'zh' || value === 'en') locale = value }"
          />
        </div>
        <div class="stage-mode-control" data-stage-controls>
          <SegmentedControl
            :aria-label="copy.switchPreviewMode"
            :name="copy.previewMode"
            :options="previewModeOptions"
            :model-value="previewMode"
            @update:model-value="updatePreviewMode"
          />
        </div>
        <div class="preview-surface">
          <div class="orb-visual">
            <img v-if="renderState === 'error'" class="orb-poster" :src="posterUrl" :alt="copy.staticOrbPreview" />
            <canvas
              ref="canvasRef"
              class="orb-canvas"
              :aria-label="copy.animatedOrbPreview"
              :data-ready="renderState === 'ready' ? 'true' : undefined"
            />
            <div v-if="renderState === 'loading'" class="orb-status" role="status" aria-live="polite">
              <span class="orb-spinner" aria-hidden="true" />
              <span class="sr-only">{{ copy.loadingOrb }}</span>
            </div>
            <p v-if="renderState === 'error'" class="orb-error" :title="locale === 'zh' ? errorMessage : copy.renderErrorTitle">
              {{ copy.renderFallback }}
            </p>
          </div>
          <div v-if="previewMode === 'scene'" class="scene-copy" :aria-label="copy.sceneText(sceneText)">
            <span class="scene-copy-text">{{ sceneText || "\u00a0" }}</span>
          </div>
        </div>
        <div class="stage-toolbar" data-stage-controls>
          <Button class="code-trigger" size="lg" type="button" variant="outline" @click="openCode">
            <PhCode data-icon="inline-start" />
            {{ copy.copyCode }}
          </Button>
          <Tooltip>
            <TooltipTrigger as-child>
              <a
                :class="`${buttonVariants({ size: 'icon-lg', variant: 'outline' })} github-link`"
                :aria-label="copy.viewSource"
                href="https://github.com/LerSent001/orb"
                rel="noopener noreferrer"
                target="_blank"
              >
                <PhGithubLogo weight="fill" aria-hidden="true" />
              </a>
            </TooltipTrigger>
            <TooltipContent side="top">{{ copy.viewSource }}</TooltipContent>
          </Tooltip>
        </div>
      </section>

      <!-- ============ 右侧：参数面板 ============ -->
      <aside class="panel-dock" :aria-label="copy.orbControls">
        <Panel
          class="orb-editor-panel h-full max-h-none w-full rounded-lg"
          :collapsed="propertiesCollapsed"
          collapse-direction="right"
          :collapse-label="copy.collapseControls"
          :collapsible="!stackedLayout"
          :expand-label="copy.expandControls"
          @update:collapsed="propertiesCollapsed = $event"
          :on-reset-controls="resetAll"
          :reset-label="copy.resetControls"
          :title="copy.orbControls"
        >
          <AudioControls
            :key="audioResetKey"
            :input="audioInput"
            :style="params.style"
            :locale="locale"
          />

          <!-- 场景文字（仅场景预览模式显示） -->
          <PanelSection
            v-if="previewMode === 'scene'"
            :collapsed="isSectionCollapsed('scene')"
            :collapse-label="copy.collapseSection(copy.sceneSection)"
            collapsible
            :expand-label="copy.expandSection(copy.sceneSection)"
            @update:collapsed="onSectionCollapsedChange('scene', $event)"
            :title="copy.sceneSection"
          >
            <div class="scene-text-field">
              <div class="scene-text-label-row">
                <ControlFieldLabel html-for="scene-text-input">{{ copy.displayText }}</ControlFieldLabel>
                <span aria-live="polite" class="scene-text-count">{{ Array.from(sceneText).length }}/{{ maxSceneTextLength }}</span>
              </div>
              <Input
                id="scene-text-input"
                :aria-describedby="'scene-text-limit'"
                :model-value="sceneText"
                @update:model-value="sceneText = limitSceneText($event)"
              />
              <span class="sr-only" id="scene-text-limit">{{ copy.sceneTextLimit }}</span>
            </div>
          </PanelSection>

          <!-- 状态 -->
          <PanelSection
            :collapsed="isSectionCollapsed('state')"
            :collapse-label="copy.collapseSection(copy.stateSection)"
            collapsible
            :expand-label="copy.expandSection(copy.stateSection)"
            @update:collapsed="onSectionCollapsedChange('state', $event)"
            :title="copy.stateSection"
          >
            <div class="orb-state-control">
              <SegmentedControl
                :aria-label="copy.switchOrbState"
                :name="copy.orbState"
                :options="orbStateOptions"
                :model-value="editorState.activeState"
                @update:model-value="updateOrbState"
              />
            </div>
            <SliderControl
              :name="copy.activationDuration"
              :model-value="editorState.configuration.activationDuration"
              @update:model-value="updateActivationDuration"
              :min="activationDurationRange.min"
              :max="activationDurationRange.max"
              :step="activationDurationRange.step"
              :base-value="defaultOrbActivationDuration"
              unit="s"
              show-fill
            />
            <SliderControl
              :name="copy.transitionDuration"
              :model-value="editorState.configuration.transitionDuration"
              @update:model-value="updateTransitionDuration"
              :min="transitionDurationRange.min"
              :max="transitionDurationRange.max"
              :step="transitionDurationRange.step"
              :base-value="defaultOrbTransitionDuration"
              unit="s"
              show-fill
            />
          </PanelSection>

          <!-- 运动 -->
          <PanelSection
            :collapsed="isSectionCollapsed('motion')"
            :collapse-label="copy.collapseSection(copy.motionSection)"
            collapsible
            :expand-label="copy.expandSection(copy.motionSection)"
            @update:collapsed="onSectionCollapsedChange('motion', $event)"
            :title="copy.motionSection"
          >
            <template v-for="key in motionSliderKeys" :key="key">
              <SliderControl
                v-if="sliderVisible(key)"
                :name="numericLabels[locale][key]"
                :model-value="params[key]"
                @update:model-value="setParam(key, $event)"
                :min="sliderSpec(key).min"
                :max="sliderSpec(key).max"
                :step="sliderSpec(key).step"
                :base-value="presetStateParams[key]"
                show-fill
              />
            </template>
          </PanelSection>

          <!-- 颜色 -->
          <PanelSection
            :collapsed="isSectionCollapsed('colors')"
            :collapse-label="copy.collapseSection(copy.colorsSection)"
            collapsible
            :expand-label="copy.expandSection(copy.colorsSection)"
            @update:collapsed="onSectionCollapsedChange('colors', $event)"
            :title="copy.colorsSection"
          >
            <ColorControl :inputs="[colorInput('colorA'), colorInput('colorB')]" />
            <ColorControl :inputs="[colorInput('colorC'), colorInput('colorD')]" />
            <ColorControl :inputs="[colorInput('highlightColor'), colorInput('canvasColor')]" />
            <template v-for="key in colorSliderKeys" :key="key">
              <SliderControl
                v-if="sliderVisible(key)"
                :name="numericLabels[locale][key]"
                :model-value="params[key]"
                @update:model-value="setParam(key, $event)"
                :min="sliderSpec(key).min"
                :max="sliderSpec(key).max"
                :step="sliderSpec(key).step"
                :base-value="presetStateParams[key]"
                show-fill
              />
            </template>
          </PanelSection>

          <!-- 形状 -->
          <PanelSection
            :collapsed="isSectionCollapsed('shape')"
            :collapse-label="copy.collapseSection(copy.shapeSection)"
            collapsible
            :expand-label="copy.expandSection(copy.shapeSection)"
            @update:collapsed="onSectionCollapsedChange('shape', $event)"
            :title="copy.shapeSection"
          >
            <template v-for="key in shapeSliderKeys" :key="key">
              <SliderControl
                v-if="sliderVisible(key)"
                :name="numericLabels[locale][key]"
                :model-value="params[key]"
                @update:model-value="setParam(key, $event)"
                :min="sliderSpec(key).min"
                :max="sliderSpec(key).max"
                :step="sliderSpec(key).step"
                :base-value="presetStateParams[key]"
                show-fill
              />
            </template>
          </PanelSection>

          <!-- 玻璃罩 -->
          <PanelSection
            :collapsed="isSectionCollapsed('glass')"
            :collapse-label="copy.collapseSection(copy.glassSection)"
            collapsible
            :expand-label="copy.expandSection(copy.glassSection)"
            @update:collapsed="onSectionCollapsedChange('glass', $event)"
            :title="copy.glassSection"
          >
            <div class="glass-switch">
              <SwitchControl
                :model-value="params.glassEnabled"
                @update:model-value="setParam('glassEnabled', $event)"
                :name="copy.enableGlass"
              />
            </div>
            <template v-if="params.glassEnabled">
              <template v-for="key in glassSliderKeys" :key="key">
                <SliderControl
                  v-if="sliderVisible(key)"
                  :name="numericLabels[locale][key]"
                  :model-value="params[key]"
                  @update:model-value="setParam(key, $event)"
                  :min="sliderSpec(key).min"
                  :max="sliderSpec(key).max"
                  :step="sliderSpec(key).step"
                  :base-value="presetStateParams[key]"
                  show-fill
                />
              </template>
              <ColorControl :inputs="[colorInput('shellInner'), colorInput('shellMid')]" />
              <ColorControl :inputs="[colorInput('shellEdge'), colorInput('sheenColor')]" />
              <ColorControl :inputs="[colorInput('specColor')]" />
            </template>
          </PanelSection>

          <!-- 边缘 -->
          <PanelSection
            :collapsed="isSectionCollapsed('edge')"
            :collapse-label="copy.collapseSection(copy.edgeSection)"
            collapsible
            :expand-label="copy.expandSection(copy.edgeSection)"
            @update:collapsed="onSectionCollapsedChange('edge', $event)"
            :title="copy.edgeSection"
          >
            <template v-for="key in edgeSliderKeys" :key="key">
              <SliderControl
                v-if="sliderVisible(key)"
                :name="numericLabels[locale][key]"
                :model-value="params[key]"
                @update:model-value="setParam(key, $event)"
                :min="sliderSpec(key).min"
                :max="sliderSpec(key).max"
                :step="sliderSpec(key).step"
                :base-value="presetStateParams[key]"
                show-fill
              />
            </template>
            <ColorControl :inputs="[colorInput('glowColor')]" />
          </PanelSection>
        </Panel>
      </aside>
    </main>

    <!-- ============ 代码导出底部弹层 ============ -->
    <Sheet :open="codeOpen" @update:open="onSheetOpenChange">
      <SheetContent class="code-sheet" side="bottom">
        <textarea ref="copyBufferRef" aria-hidden="true" class="code-copy-buffer" tabindex="-1" />
        <SheetHeader class="code-sheet-header">
          <SheetTitle>{{ copy.copyCode }}</SheetTitle>
        </SheetHeader>
        <Tabs :model-value="codePlatform" @update:model-value="onCodePlatformChange">
          <div class="code-sheet-toolbar">
            <TabsList>
              <TabsTrigger value="web">Web</TabsTrigger>
              <TabsTrigger value="swift">SwiftUI</TabsTrigger>
            </TabsList>
            <Button type="button" variant="outline" @click="copyCode">
              <PhCopySimple data-icon="inline-start" />
              {{
                copiedPlatform === "error"
                  ? copy.copyFailed
                  : copiedPlatform === codePlatform
                    ? copy.copied
                    : copy.copyCode
              }}
            </Button>
          </div>
          <TabsContent class="code-tab-content" value="web">
            <pre class="code-preview" :aria-label="copy.webCode"><code>{{ webCode }}</code></pre>
          </TabsContent>
          <TabsContent class="code-tab-content" value="swift">
            <pre class="code-preview" :aria-label="copy.swiftCode"><code>{{ swiftCode }}</code></pre>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  </TooltipProvider>
</template>
