<script setup lang="ts">
/**
 * PanelSection —— 面板内的可折叠分区（如「动态」「颜色」「形状动画」「玻璃罩」「边缘与外发光」）。
 *
 * 对应原 React 版 `toolcraft/ui/components/panel/panel-section.tsx`。
 * 本迁移保留「标题 + 可折叠 + 内容列表」的核心行为，折叠用 CSS transition 实现平滑展开/收起；
 * 移除了原版复杂的 ControlItem 复合分隔线与 sticky footer 逻辑。
 */
import { ref, watch } from "vue";
import { PhCaretDown, PhCaretUp } from "@phosphor-icons/vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    /** 分区标题 */
    title?: string;
    /** 是否可折叠 */
    collapsible?: boolean;
    /** 折叠状态（v-model） */
    collapsed?: boolean;
    /** 折叠按钮文案 */
    collapseLabel?: string;
    /** 展开按钮文案 */
    expandLabel?: string;
    /** 覆盖容器样式 */
    className?: string;
  }>(),
  { collapsible: false, collapsed: false },
);

const emit = defineEmits<{
  (e: "update:collapsed", value: boolean): void;
  (e: "change", value: boolean): void;
}>();

/** 内部折叠状态（支持非受控用法） */
const innerCollapsed = ref(props.collapsed);
watch(
  () => props.collapsed,
  (value) => (innerCollapsed.value = value),
);

/** 实际折叠值：collapsible 时取受控值 */
const isCollapsed = () => props.collapsible && !!props.collapsed;

/** 展开/收起按钮的 aria-label */
const toggleLabel = () =>
  isCollapsed() ? props.expandLabel ?? `展开${props.title ?? ""}` : props.collapseLabel ?? `收起${props.title ?? ""}`;

function toggle(): void {
  const next = !isCollapsed();
  emit("update:collapsed", next);
  emit("change", next);
}
</script>

<template>
  <section
    class="group/control-section flex flex-col gap-[14px] border-t border-[color:color-mix(in_oklab,var(--border)_8%,transparent)] pt-2 pb-6 transition-colors duration-150 ease-out hover:bg-[color:color-mix(in_oklab,var(--foreground)_3%,transparent)]"
    :class="className"
  >
    <!-- 标题栏：点击可折叠（带键盘支持） -->
    <div
      v-if="title"
      role="button"
      tabindex="0"
      :aria-expanded="collapsible ? !isCollapsed() : undefined"
      :aria-label="collapsible ? toggleLabel() : undefined"
      :data-collapsed="collapsible ? String(isCollapsed()) : undefined"
      :data-collapsible="collapsible ? '' : undefined"
      :class="cn('flex h-9 min-w-0 items-center justify-between gap-2 px-3', collapsible && 'cursor-pointer select-none')"
      data-slot="control-section-header"
      @click="collapsible ? toggle() : undefined"
      @keydown.enter.prevent="collapsible ? toggle() : undefined"
      @keydown.space.prevent="collapsible ? toggle() : undefined"
    >
      <p class="m-0 min-w-0 text-[0.6875rem] leading-none font-semibold uppercase text-[color:color-mix(in_oklab,var(--foreground)_75%,transparent)]">
        {{ title }}
      </p>
      <button
        v-if="collapsible"
        type="button"
        :aria-label="toggleLabel()"
        class="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
        @click.stop="toggle"
      >
        <PhCaretUp v-if="!isCollapsed()" class="size-3.5" />
        <PhCaretDown v-else class="size-3.5" />
      </button>
    </div>

    <!-- 内容区：折叠时用 grid-rows 过渡平滑收起 -->
    <div
      :class="cn(
        'grid overflow-hidden transition-[grid-template-rows,opacity] duration-180 ease-out motion-reduce:transition-none',
        isCollapsed() ? 'pointer-events-none grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
      )"
      :data-collapsed="collapsible ? String(isCollapsed()) : undefined"
      data-slot="panel-section-collapsible-body"
    >
      <div class="min-h-0 overflow-hidden">
        <div class="flex min-w-0 flex-col gap-[14px]" data-control-list="">
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>
