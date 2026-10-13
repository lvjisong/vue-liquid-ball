# Orb Vue — 液态玻璃球编辑器（Vue3 版）

> 由 React 开源项目 [LerSent001/orb](https://github.com/LerSent001/orb) 迁移而来。
> 保留其核心：**WebGPU/WGSL 实时渲染、13 种液态玻璃预设、音频响应、Web/SwiftUI 代码导出**。
> UI 层按 **Vue 3 + shadcn-vue 风格组件（reka-ui 底层）** 重写。

---

## 一、这是什么

一个基于 WebGPU 的**液态玻璃球（liquid glass orb）实时渲染编辑器**，浏览器中运行（需 Chrome/Edge 等支持 WebGPU 的浏览器）。你可以：

- 🎨 在 **13 种预设风格** 间切换（Siri、极光、等离子、镀铬金属、粒子丝带等）；
- ⚙️ 精细调节 **形状、颜色、运动、玻璃罩、边缘发光** 等几十项参数；
- 🎵 用 **麦克风或音频文件** 驱动球体的流动、形变与高光；
- 🧪 一键导出 **独立 Web 页面** 或 **SwiftUI** 代码，脱离编辑器直接运行；
- 🔗 所有参数通过 **URL hash** 持久化与分享。

> ⚠️ **浏览器兼容性**：WebGPU 需要 Chrome 113+ / Edge / Safari 26+ 等较新浏览器。
> 若当前浏览器不支持，会显示静态海报图与降级提示。

---

## 二、技术栈与迁移说明

| 层 | 原 React 版 | 本 Vue 版 | 说明 |
| --- | --- | --- | --- |
| 框架 | React 19 | **Vue 3.5**（`<script setup>` + Composition API） | 全部 UI 层重写 |
| 构建 | Vite + TS | Vite 6 + TS | 保持 |
| 样式 | Tailwind CSS v4 | Tailwind CSS v4 | **样式文件原样复用** |
| 无头组件 | @base-ui/react | **reka-ui**（shadcn-vue 底层） | Button/Input/Tooltip/Sheet/Tabs |
| 图标 | @phosphor-icons/react | @phosphor-icons/vue | 同系列，改名 `Ph` 前缀 |
| 渲染引擎 | `orb-renderer.ts` 等 | **原样复用（纯 TS）** | 框架无关，未改动 |
| 导出 | `code-export.ts` | **原样复用** | 生成独立 Web / SwiftUI 代码 |
| i18n | `editor-i18n.ts` | **原样复用** | 中/英双语文案 |

### 迁移策略（为什么这样做）

1. **核心引擎零改动**：`src/core/` 下的渲染器、预设、状态系统、音频、着色器、代码导出
   都是**纯 TypeScript、无 React 依赖**，直接拷贝复用，只改导入路径。
2. **UI 层按 shadcn-vue 风格重写**：标准组件（Button/Input/Tooltip/Sheet/Tabs）用
   reka-ui 实现；orb 专用控件（颜色选择器、滑块、分段、面板、开关）在
   `src/components/orb/` 中用原生实现，保留原版外观与交互。
3. **详细注释**：每个组件头部都写明了「对应原 React 组件、功能、生命周期注意点」，
   方便后续对照原项目维护。

---

## 三、目录结构

```
orb-vue/
├── index.html
├── vite.config.ts            # Vite 配置（Tailwind v4 插件 + @ 别名）
├── src/
│   ├── main.ts               # Vue 应用入口
│   ├── App.vue               # 根组件：编辑器主界面（预设/舞台/参数/导出）
│   ├── styles.css            # 全局样式（Tailwind v4 + 主题变量 + 组件类，复用原项目）
│   ├── effect.wgsl           # WebGPU 着色器源码（原样）
│   ├── effect.metal          # SwiftUI 导出用的 Metal 着色器（原样）
│   ├── lib/utils.ts          # cn() 类名合并工具
│   ├── core/                 # 【核心引擎 · 纯 TS 复用】
│   │   ├── presets.ts        #   预设数据与参数模型
│   │   ├── orb-states.ts     #   双状态（idle/thinking）状态机
│   │   ├── orb-renderer.ts   #   WebGPU 渲染器（纯函数，框架解耦）
│   │   ├── orb-audio.ts      #   音频分析输入
│   │   ├── orb-uniforms.ts   #   参数→GPU uniform 映射
│   │   ├── particle-ribbon.ts
│   │   ├── shader-source.ts  #   WGSL 着色器字符串
│   │   ├── code-export.ts    #   Web / SwiftUI 代码导出
│   │   └── editor-i18n.ts    #   中/英文案
│   ├── components/
│   │   ├── ui/               # 【shadcn-vue 风格基础组件】
│   │   │   ├── button/       #   Button + buttonVariants
│   │   │   ├── input/        #   Input
│   │   │   ├── tooltip/      #   Tooltip 系列（reka-ui）
│   │   │   ├── sheet/        #   Sheet 底部弹层（reka-ui Dialog）
│   │   │   └── tabs/         #   Tabs 系列（reka-ui）
│   │   └── orb/              # 【orb 专用控件 · Vue 重写】
│   │       ├── App 相关入口组件
│   │       ├── panel.vue             # 可折叠参数面板
│   │       ├── panel-section.vue     # 面板内可折叠分区
│   │       ├── slider-control.vue    # 滑块（可编辑数值、双击回预设）
│   │       ├── segmented-control.vue # 分段选择器
│   │       ├── switch-control.vue    # 布尔开关
│   │       ├── color-control.vue     # 颜色选择器（HSV 板）
│   │       ├── control-field-label.vue
│   │       └── AudioControls.vue     # 音频响应控件
│   ├── toolcraft/ui/styles.css # 原 toolcraft 浮层/变体样式（复用）
│   └── assets/                 # 预设预览图 + 海报
```

---

## 四、快速开始

```bash
# 安装依赖
npm install

# 本地开发（默认 http://localhost:5173）
npm run dev

# 类型检查
npm run typecheck

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

> 需要 **Node.js 18+**，建议 20+。开发时请用支持 WebGPU 的 Chrome/Edge。

---

## 五、功能使用指南

### 5.1 预设选择（左侧）
点击预设缩略图即可切换风格。当前预设会在 URL hash 中记录（`#style=aurora` 等）。

### 5.2 参数调节（右侧）
- **状态**：`idle`（静止）/ `thinking`（思考），以及激活/过渡时长；
- **运动**：速度；
- **颜色**：A/B/C/D 四色 + 高光 + 画布色 + 明暗/曝光；
- **形状**：半径、轮廓变形、缩放、扭曲、脊状、锐利度，以及金属/粒子丝带系列参数（按预设动态显示）；
- **玻璃罩**：开启后调节透明度、光泽、内/中/外壳颜色等；
- **边缘**：柔和度、外发光、辉光色。

**交互小技巧**：滑块上的数值可**点击直接输入**；**双击滑块**回到该预设的出厂值；
面板可**折叠**；整体**滚轮缩放**舞台。

### 5.3 场景预览（中间）
右下切换「球体 / 场景」模式。场景模式下可编辑舞台中央显示的**文字**（最多 20 字符），
并在右侧「场景」分区调整显示文字。

### 5.4 代码导出（中间底部）
点击「复制代码」→ 底部弹出 Sheet，在 **Web / SwiftUI** 之间切换，一键复制独立可运行代码。

### 5.5 音频响应
右侧顶部「声音响应」：选择「麦克风」或「音频文件」，用声音驱动流动、形变与高光。
（仅部分预设支持，见 `core/orb-audio.ts` 的 `audioStyleStrengths`。）

---

## 六、架构：渲染器如何与 UI 解耦（重点）

原项目 `orb-renderer.ts` 是一个**框架无关的纯函数**，这是迁移能「核心零改动」的关键：

```ts
const dispose = createOrbRenderer({
  canvas,                       // <canvas> 元素
  getTarget: () => renderTarget, // 每帧读取最新参数与状态
  getAudioBands: (dt) => audioInput.read(dt),
  onError: (error) => { /* 渲染失败 */ },
  onReady: () => { /* 渲染就绪 */ },
});
// 返回 dispose() 用于销毁
```

在 **React** 里用 `useEffect` 创建、清理时 `dispose()`；
在 **Vue** 里（本工程 `App.vue`）：

```ts
onMounted(() => {
  disposeRenderer = createOrbRenderer({ /* ... */ });
});
onBeforeUnmount(() => {
  disposeRenderer?.();
});
```

渲染器不感知框架，UI 通过 `getTarget` 每次提供最新参数，从而做到**框架无关 + 零改动复用**。

---

## 七、开发与维护指南

### 7.1 想改 UI 样式？
- 主题色、字号、圆角等 CSS 变量定义在 `src/styles.css` 的 `@theme` / `:root` 中；
- 布局类（`.preset-grid`、`.orb-stage`、`.code-sheet` 等）也都在 `src/styles.css`；
- 组件级样式直接写在各组件的 Tailwind class 中。

### 7.2 想加一个新的数值参数？
1. 在 `src/core/presets.ts` 的 `OrbParams` 类型与默认值中加入字段；
2. 在 `App.vue` 的 `numericSpecs` 中加入该参数的 min/max/step（及 `enabledStyles`）；
3. 在对应 `PanelSection` 的滑块清单（`shapeSliderKeys` 等）中加入 key；
4. （可选）在 `editor-i18n.ts` 的 `numericLabels` 中补充中英文名。

### 7.3 想加一个预设？
在 `core/presets.ts` 的 `stylePresets` 增加条目，并在 `App.vue` 的 `stylePreviewUrls`
与 `src/assets/presets/` 中加入预览图（文件名与 key 对应）。

### 7.4 核心引擎能改吗？
可以，`src/core/` 是纯 TS，不依赖 Vue。改动后运行 `npm run typecheck` 确保类型正确。

---

## 八、已知差异（与原 React 版）

为控制迁移复杂度，以下原版增强细节在 Vue 版中做了简化（功能不受影响）：

| 原版 | Vue 版简化 |
| --- | --- |
| Color 颜色选择器（几十个文件，含调色板/通道） | 单文件 HSV 板 + 色相条 + hex 输入 |
| Slider 的「编辑数值」弹层 + marker | 数值点击直改 + 双击回预设 |
| Panel 的 sticky footer / ScrollFade 渐隐 | 去掉，保留折叠/重置 |
| TabsList 的 `variant="control"` | 使用 shadcn 默认样式 |
| 无障碍细节（部分 aria 逻辑） | 保留基础 aria，未逐项复刻 |

> 若需要还原某处原版细节，对照原项目 `src/toolcraft/` 对应组件即可。

---

## 九、许可与致谢

- 本工程为学习与二次开发目的迁移，UI 与代码结构大量参考原项目
  [LerSent001/orb](https://github.com/LerSent001/orb)（由其开源社区许可下使用）；
- WebGPU 渲染引擎、着色器与代码导出逻辑版权归原项目所有，本工程仅作 UI 框架迁移。
