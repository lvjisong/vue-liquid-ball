/**
 * buttonVariants —— shadcn-vue 风格按钮的 cva（class-variance-authority）变体定义。
 *
 * 对应原 React 版 `toolcraft/ui/components/primitives/button.tsx` 中的 buttonVariants。
 * 本迁移保留原项目深色配色（基于 CSS 变量 --primary/--border/--input 等，定义在 styles.css），
 * 但精简了原版 400+ 行的交互状态类，仅覆盖当前 App 用到的 variant/size，便于维护。
 *
 * 供两类使用：
 *  1. <Button> 组件内部调用；
 *  2. 需要把按钮样式应用在 <a> 等其他元素上时，直接取 `buttonVariants({...})` 作为 className。
 */
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  // 基础类：所有按钮共用的布局与交互
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-1 border border-transparent font-medium whitespace-nowrap rounded-lg transition-colors outline-none select-none focus-visible:border-[color:var(--ring)] focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_oklab,var(--ring)_30%,transparent)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // 主按钮：使用 --primary 强调色
        default:
          "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:color-mix(in_oklab,var(--primary)_88%,black)] active:bg-[color:color-mix(in_oklab,var(--primary)_82%,black)]",
        // 描边按钮：App 中预设选择 / 复制代码 / GitHub 链接均使用此变体
        outline:
          "border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] text-[color:var(--foreground)] hover:border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--input)_15%,transparent)]",
        // 幽灵按钮：面板头部工具按钮等
        ghost:
          "bg-clip-border text-[color:var(--foreground)] hover:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)]",
        secondary:
          "bg-[color:color-mix(in_oklab,var(--secondary)_8%,transparent)] text-[color:var(--secondary-foreground)] hover:bg-[color:color-mix(in_oklab,var(--secondary)_20%,transparent)]",
        destructive:
          "border-[color:color-mix(in_oklab,var(--destructive)_30%,transparent)] bg-[color:color-mix(in_oklab,var(--destructive)_15%,transparent)] text-[color:var(--destructive)] hover:bg-[color:color-mix(in_oklab,var(--destructive)_25%,transparent)]",
        link: "text-[color:var(--primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-7 gap-1 px-2 text-[13px] leading-[1.125rem] [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        lg: "h-[34px] gap-1 px-3.5 text-sm/relaxed tracking-tight [&_svg:not([class*='size-'])]:size-3.5",
        icon: "h-7 w-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "h-6 w-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-lg": "size-[34px] [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
