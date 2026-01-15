# Implementation Plan: React Internals Object Visualization

**Branch**: `001-fiber-hook-viz` | **Date**: 2026-01-04 | **Spec**: `specs/001-fiber-hook-viz/spec.md`
**Input**: Feature specification from `specs/001-fiber-hook-viz/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

构建一个单页可视化工具：左侧输入 React TSX/JSX 函数组件代码，用户点击「生成可视图」后解析得到内部对象关系（fiber → hook 链表 → effect + 字段值引用），右侧使用无限画布展示对象节点与连线。节点 UI=头部名称 + body 属性表；字段有值则产生“字段 → 值”连线，起点从字段行发出，终点指向值节点头部。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript + React 18  
**Primary Dependencies**:

- Build: rsbuild（react-ts 模板）
- UI: Ant Design 5 `Splitter`
- Graph: `reactflow`（react-flow）
- Editor: CodeMirror 6 via `@uiw/react-codemirror` + `@codemirror/lang-javascript`
- AST: `@babel/parser` + `@babel/traverse`
  **Storage**: N/A（单页；如需可后续用 localStorage 保存输入与视口）  
  **Testing**: 单元测试（解析/建图纯函数）+ 组件测试（按钮触发、错误态、关键连线锚点）  
  **Target Platform**: Modern browsers  
  **Project Type**: 单前端项目（Single project）  
  **Performance Goals**: 画布交互流畅；中等规模输入（3–10 hooks）生成 ≤ 2s  
  **Constraints**:
- 输入范围：TSX/JSX 函数组件 + 内置 hooks，不展开自定义 hooks
- 字段 → 值连线：起点在字段行，终点指向值节点头部（强 UI 约束）
  **Scale/Scope**: 单页两栏：左 Code Editor + 右 Graph Canvas

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Gates derived from `/.specify/memory/constitution.md`（v1.0.0），适用于本功能如下：

- **Type Safety Gate**: Graph schema / AST parse result / node props 必须有明确 TypeScript 类型；核心数据路径禁止 `any`
- **Quality Gate**: 严格最小改动；复杂逻辑必须可追踪（必要注释说明“为什么”）
- **Testing Gate (NON-NEGOTIABLE)**:
  - 解析/建图纯函数：单元测试覆盖关键分支与边界（语法错误、空输入、多个 hooks/effects、原始值节点）
  - 关键交互：组件测试覆盖点击「生成可视图」触发、错误提示、连线锚点约束
- **UX Gate**: 必须覆盖 loading / error / empty 状态（输入为空、解析失败、解析结果为空）
- **Performance Gate**: 识别并规避无意义重渲染；节点 body 渲染需可控（必要时折叠/按需渲染）

<!--
  For this repository (rsbuild React + TypeScript), ensure the gates cover at least:
  - TypeScript typecheck passes (no unsafe any introduced for core data paths)
  - Lint/format gates pass (repo standard)
  - Tests present for logic/interaction changes (or explicit waiver + validation plan)
  - UX gates: loading/empty/error states are defined for the feature
  - Performance risks identified for visualization interactions (re-render / large dataset strategy)
-->

## Project Structure

### Documentation (this feature)

```text
specs/001-fiber-hook-viz/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── components/          # 基础 UI（按钮、面板容器）
├── features/
│   └── internals-viz/   # 本功能聚合：editor + parser + graph + state
│       ├── components/  # ReactFlow nodes/edges + 业务组件
│       ├── domain/      # Fiber/Hook/Effect/Value 模型与 Graph schema
│       ├── parser/      # Babel parse + traverse，输出 domain 模型
│       └── ui/          # 页面布局（Splitter）与交互编排
├── styles/
└── utils/

tests/
├── unit/                # 解析/建图纯函数单测
└── component/           # 关键交互与渲染约束测试
```

**Structure Decision**: 单前端项目；本功能集中在 `src/features/internals-viz/`，解析与 domain 下沉以满足“可测试/可复用/可性能优化”。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A（当前无已知宪法门禁违规，无需复杂度豁免说明）
