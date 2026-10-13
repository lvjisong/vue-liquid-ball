<script setup lang="ts">
/**
 * Panel —— 编辑器左右两侧的可折叠参数面板（预设面板 / 球体参数面板）。
 *
 * 对应原 React 版 `toolcraft/ui/components/panel/panel.tsx`。
 * 结构：PanelSurface（圆角浮层容器）+ PanelHeader（标题 / 重置 / 折叠按钮）+ 内容滚动区。
 * 本迁移保留核心行为，移除了原版 sticky footer、ScrollFade、过渡抑制等增强细节。
 */
import { computed, ref, watch } from "vue";
import {
  PhArrowCounterClockwise,
  PhCaretDown,
  PhCaretLeft,
  PhCaretRight,
  PhCaretUp,
} from "@phosphor-icons/vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    /** 面板标题 */
    title: string;
    /** 是否可折叠（窄屏自动不可折叠） */
    collapsible?: boolean;
    /** 折叠状态（v-model） */
    collapsed?: boolean;
    /** 折叠方向：left / right / up */
    collapseDirection?: "left" | "right" | "up";
    /** 折叠 / 展开按钮文案 */
    collapseLabel?: string;
    expandLabel?: string;
    /** 重置按钮文案与回调 */
    resetLabel?: string;
    onResetControls?: () => void;
    /** 折叠状态变化回调 */
    onCollapsedChange?: (collapsed: boolean) => void;
    /** 覆盖容器样式 */
    className?: string;
  }>(),
  { collapsible: true, collapsed: false, collapseDirection: "up" },
);

const emit = defineEmits<{
  (e: "update:collapsed", value: boolean): void;
}>();

const innerCollapsed = ref(props.collapsed);
watch(
  () => props.collapsed,
  (value) => (innerCollapsed.value = value),
);

/** 实际折叠状态（受控值） */
const isCollapsed = computed(() => props.collapsible && !!props.collapsed);

function toggleCollapsed(): void {
  const next = !isCollapsed.value;
  emit("update:collapsed", next);
  props.onCollapsedChange?.(next);
}

/** 根据折叠方向与状态，计算箭头图标方向（同原 React 版逻辑） */
const arrowDirection = computed(() => {
  const collapsed = isCollapsed.value;
  if (props.collapseDirection === "left") return collapsed ? "right" : "left";
  if (props.collapseDirection === "right") return collapsed ? "left" : "right";
  return collapsed ? "down" : "up";
});

const collapseToggleLabel = computed(() =>
  isCollapsed.value
    ? props.expandLabel ?? `展开${props.title}`
    : props.collapseLabel ?? `收起${props.title}`,
);
</script>

<template>
  <div
    class="floating-popup-surface toolcraft-panel-surface isolate border text-[color:var(--popover-foreground)] supports-backdrop-filter:backdrop-blur-2xl supports-backdrop-filter:backdrop-saturate-150 pointer-events-auto flex max-h-[calc(100dvh-1.25rem)] flex-col overflow-hidden rounded-lg p-0 w-[300px]"
    :class="className"
    :data-collapsed="String(isCollapsed)"
    data-panel-id="properties"
  >
    <!-- 面板头部：标题 + 重置 + 折叠 -->
    <div class="shrink-0" data-slot="properties-panel-header-shell">
      <div
        :class="cn(
          'flex h-9 touch-none items-center gap-3 pr-1 pl-3',
          isCollapsed ? 'justify-center px-1' : 'justify-between',
        )"
        data-slot="properties-panel-header"
      >
        <p
          :class="cn(
            'm-0 min-w-0 truncate text-[0.8125rem] font-medium text-[color:var(--foreground)]',
            isCollapsed && 'sr-only',
          )"
        >
          {{ title }}
        </p>
        <div class="inline-flex shrink-0 items-center gap-1">
          <button
            v-if="!isCollapsed && onResetControls"
            type="button"
            :aria-label="resetLabel ?? '重置全部参数'"
            class="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            @click="onResetControls"
          >
            <PhArrowCounterClockwise class="size-4" />
          </button>
          <button
            v-if="collapsible"
            type="button"
            :aria-label="collapseToggleLabel"
            class="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            @click="toggleCollapsed"
          >
            <PhCaretUp v-if="arrowDirection === 'up'" class="size-4" />
            <PhCaretDown v-else-if="arrowDirection === 'down'" class="size-4" />
            <PhCaretLeft v-else-if="arrowDirection === 'left'" class="size-4" />
            <PhCaretRight v-else class="size-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- 面板内容（折叠时不渲染） -->
    <template v-if="!isCollapsed">
      <div class="flex min-h-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain border-t border-[color:color-mix(in_oklab,var(--border)_8%,transparent)]">
        <slot />
      </div>
    </template>
  </div>
</template>
