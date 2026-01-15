# React Internals Visualization

一个可视化 React 内部数据结构（Fiber → Hook 链表 → Effect 对象）的教学工具。

## 功能特性

- **代码输入**：左侧 CodeMirror 编辑器支持 TSX/JSX 语法高亮
- **可视化生成**：点击「生成可视图」按钮，右侧画布展示对象关系图
- **节点类型**：
  - Fiber 节点（蓝色）
  - Hook 节点（绿色）
  - Effect 节点（黄色）
  - Value 节点（粉色圆形，表示基础类型值）
- **交互操作**：
  - 拖拽节点自由布局
  - 缩放/平移画布
  - 修改代码后重新生成，已拖动的节点保持位置

## 支持的输入

- TSX/JSX 函数组件
- React 内置 Hooks：`useState`、`useEffect`、`useLayoutEffect` 等
- 不展开自定义 Hooks 内部实现

## 已知限制

- 仅解析 AST 结构，非运行时真实数据
- 连线使用 smoothstep 样式，可能经过节点边缘
- 暂不支持类组件

## Setup

Install the dependencies:

```bash
pnpm install
```

## Get Started

Start the dev server:

```bash
pnpm dev
```

Run tests:

```bash
pnpm test
```

Build the app for production:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```
