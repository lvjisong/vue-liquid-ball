<script setup lang="ts">
/**
 * AudioControls —— 声音响应控件。
 *
 * 对应原 React 版 `src/AudioControls.tsx`，逻辑与文案保持一一对应。
 * 功能：
 *  - 通过 Web Audio API 采集麦克风或音频文件；
 *  - 调整响应强度（gain）并实时显示输入音量（meter）；
 *  - 仅部分预设支持声音响应（见 orb-audio.ts 的 audioStyleStrengths）。
 *
 * 生命周期注意：
 *  - 组件挂载后持续用 requestAnimationFrame 刷新音量表（避免在模板中高频渲染）；
 *  - 卸载时调用 input.stop() 并取消动画帧。
 */
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import PanelSection from "@/components/orb/panel-section.vue";
import {
  audioStyleStrengths,
  type OrbAudioInput,
} from "@/core/orb-audio";
import type { StyleName } from "@/core/presets";

const props = defineProps<{
  /** 音频输入控制器（由 App 单例持有） */
  input: OrbAudioInput;
  /** 当前预设名（决定是否支持声音响应） */
  style: StyleName;
  /** 界面语言 */
  locale: "zh" | "en";
}>();

const zh = props.locale === "zh";
/** 当前预设是否支持声音响应 */
const supported = audioStyleStrengths[props.style] !== undefined;

type Source = "off" | "pending" | "mic" | "file";
const source = ref<Source>("off");
const error = ref(false);
const gain = ref(70);

/* DOM 引用 */
const fileRef = ref<HTMLInputElement | null>(null);
const playerRef = ref<HTMLDivElement | null>(null);
const meterRef = ref<HTMLMeterElement | null>(null);

/** 递增的请求号，用于避免异步竞态：仅最新一次请求可提交结果 */
const request = ref(0);

/** 停止当前音频源并复位 UI */
function stop(): void {
  request.value++;
  props.input.stop();
  if (playerRef.value) playerRef.value.replaceChildren();
  source.value = "off";
  error.value = false;
}

/** 启动音频源（可传文件，否则走麦克风） */
async function start(file?: File): Promise<void> {
  stop();
  const id = request.value;
  source.value = "pending";
  try {
    const active = file
      ? await props.input.file(file, playerRef.value!)
      : await props.input.microphone(stop);
    if (id === request.value && active) {
      source.value = file ? "file" : "mic";
    }
  } catch {
    if (id !== request.value) return;
    props.input.stop();
    if (playerRef.value) playerRef.value.replaceChildren();
    source.value = "off";
    error.value = true;
  }
}

/** 文件选择触发 */
function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file) void start(file);
}

/* 挂载：初始化增益、启动音量表刷新、监听 pagehide */
let rafId = 0;
const onPagehide = () => stop();

onMounted(() => {
  props.input.gain = 0.7;
  const paint = () => {
    if (meterRef.value) meterRef.value.value = props.input.level;
    rafId = requestAnimationFrame(paint);
  };
  paint();
  window.addEventListener("pagehide", onPagehide);
});

onBeforeUnmount(() => {
  request.value++;
  cancelAnimationFrame(rafId);
  props.input.stop();
  window.removeEventListener("pagehide", onPagehide);
});

/* 当预设切到不支持声音响应时自动停止 */
watch(
  () => props.style,
  () => {
    if (!audioStyleStrengths[props.style]) stop();
  },
);

/** 灵敏度滑动同步到 input.gain（0-100% 归一化到 0-1） */
function onGainInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  gain.value = value;
  props.input.gain = value / 100;
}
</script>

<template>
  <PanelSection :title="zh ? '声音响应' : 'Audio response'">
    <div class="orb-audio-controls">
      <p class="orb-audio-hint">
        {{
          supported
            ? zh
              ? "声音驱动流动、形变与高光"
              : "Sound drives motion, shape and highlights"
            : zh
              ? "此预设暂不支持声音响应"
              : "Audio response is unavailable for this preset"
        }}
      </p>

      <template v-if="supported">
        <div class="orb-audio-actions">
          <Button
            variant="outline"
            :aria-pressed="source === 'mic'"
            :disabled="source === 'pending'"
            @click="start()"
          >
            {{ zh ? "麦克风" : "Microphone" }}
          </Button>
          <Button
            variant="outline"
            :disabled="source === 'pending'"
            @click="fileRef?.click()"
          >
            {{ zh ? "音频文件" : "Audio file" }}
          </Button>
          <Button v-if="source !== 'off'" variant="outline" @click="stop">
            {{ zh ? "关闭" : "Stop" }}
          </Button>
        </div>

        <input
          ref="fileRef"
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
          hidden
          @change="onFileChange"
        />

        <label class="orb-audio-gain">
          {{ zh ? "响应强度" : "Sensitivity" }}
          <output>{{ gain }}%</output>
          <input
            type="range"
            min="0"
            max="100"
            :value="gain"
            :aria-label="zh ? '响应强度' : 'Sensitivity'"
            @input="onGainInput"
          />
        </label>

        <meter
          ref="meterRef"
          min="0"
          max="1"
          value="0"
          :aria-label="zh ? '输入音量' : 'Input level'"
        />
      </template>

      <div
        ref="playerRef"
        class="orb-audio-player"
        :hidden="!supported || (source !== 'file' && source !== 'pending')"
      />

      <p class="orb-audio-hint" role="status">
        {{
          error
            ? zh
              ? "无法打开声音，请检查麦克风权限或更换音频文件。"
              : "Unable to open audio. Check microphone permission or try another file."
            : source === "pending"
              ? zh
                ? "正在打开声音…"
                : "Opening audio…"
              : source === "mic"
                ? zh
                  ? "正在使用麦克风"
                  : "Microphone is active"
                : ""
        }}
      </p>
    </div>
  </PanelSection>
</template>
