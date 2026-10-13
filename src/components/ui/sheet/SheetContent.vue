<script setup lang="ts">
/**
 * SheetContent —— 底部滑出面板的内容容器（含遮罩与动画）。
 *
 * 默认从底部滑出（side="bottom"）；通过 `class` 传入覆盖样式（App 中为 `code-sheet`）。
 * 结构：遮罩层 + 内容面板，内容面板支持滚动与关闭按钮插槽。
 */
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from "reka-ui";
import { PhX } from "@phosphor-icons/vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    /** 弹出方向（App 使用 bottom） */
    side?: "top" | "right" | "bottom" | "left";
    /** 覆盖样式 */
    class?: string;
  }>(),
  { side: "bottom" },
);
</script>

<template>
  <DialogPortal>
    <!-- 遮罩 -->
    <DialogOverlay
      class="fixed inset-0 z-50 bg-[color:color-mix(in_oklab,var(--background)_40%,transparent)] backdrop-blur-[2px]"
    />
    <!-- 内容面板：底部滑入动画 -->
    <DialogContent
      :class="cn(
        'fixed inset-x-0 bottom-0 z-50 flex max-h-[70dvh] w-full flex-col border-t border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:var(--popover)] shadow-2xl',
        'animate-in slide-in-from-bottom-2 duration-200 ease-out',
        props.class,
      )"
    >
      <slot />
      <!-- 右上角关闭按钮 -->
      <DialogClose
        class="absolute top-3 right-3 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        :aria-label="'关闭'"
      >
        <PhX class="size-4" />
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
