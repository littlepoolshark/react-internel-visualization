# Research: React Internals Object Visualization

**Date**: 2026-01-04  
**Branch**: `001-fiber-hook-viz`  
**Spec**: `specs/001-fiber-hook-viz/spec.md`

本文件用于把计划中的关键决策写清楚（做什么/为什么/替代方案），并确保进入设计阶段前无待澄清点。

## Decisions

### 1) Layout: Ant Design 5 `Splitter`

- **Decision**: 使用 antd5 的 `Splitter` 实现左右分栏；左侧为代码编辑区，右侧为可视化画布区。
- **Rationale**: Splitter 原生支持可拖拽调整宽度，且与 antd 生态一致，减少自研布局与样式成本。
- **Alternatives considered**:
  - 纯 CSS + 自研拖拽：实现成本高、交互细节多
  - 其它分栏库：引入额外依赖且风格不统一

### 2) Graph Engine: `reactflow`

- **Decision**: 使用 `reactflow` 渲染节点/连线并提供无限画布能力（拖拽、缩放、平移）。
- **Rationale**: 能快速实现“节点 + edge”拓扑展示，且支持自定义节点、Handle/锚点扩展，满足“字段行发出连线”的强约束。
- **Alternatives considered**:
  - D3 自绘：自由度高但工程量大，交互与状态同步复杂
  - 其它图形库：与 React 结合度不如 reactflow

### 3) Editor: CodeMirror 6（`@uiw/react-codemirror` + `@codemirror/lang-javascript`）

- **Decision**: 左侧编辑器使用 CodeMirror 6 React 包装组件，语言模式使用 `@codemirror/lang-javascript` 并开启 JSX/TSX 相关能力。
- **Rationale**: 与 React 集成成熟、可扩展（lint、快捷键、主题），性能与体验优于简单 textarea。
- **Alternatives considered**:
  - Monaco：体积与加载成本更高
  - textarea：缺乏编辑体验与语法高亮

### 4) AST: Babel Parser + Traverse

- **Decision**: 使用 `@babel/parser` 解析 TSX/JSX 函数组件（开启 `typescript` + `jsx` plugins），通过 `@babel/traverse` 识别内置 hooks 调用并提取顺序与关键信息；不展开自定义 hooks。
- **Rationale**: Babel 生态成熟，对 TSX/JSX 支持强；traverse 易于实现“按调用顺序”收集 hooks。
- **Alternatives considered**:
  - TypeScript Compiler API：类型信息更强但 API 更重，前期成本更高
  - SWC：更快但遍历与生态习惯不同

### 5) Domain Model Precision: 两阶段精度（C）

- **Decision**: 阶段 1（MVP）采用教学化简化模型；阶段 2 逐步逼近 React 运行时字段/链表结构。
- **Rationale**: 先闭环“输入→生成→可视化→交互”，再逐步扩展字段覆盖，降低一次性复杂度与回归风险。
- **Alternatives considered**:
  - 一次性贴近运行时：字段与关系极多，静态解析难度大且容易失控

### 6) Value Node Strategy: 所有非空值节点化（A）

- **Decision**: 属性表中任何非空字段值都生成“值节点”，并创建“字段→值”连线。
- **Rationale**: 与原型一致（如 `0` 也作为节点），并且可统一连线规则，减少“有的连线、有的不连线”的理解成本。
- **Alternatives considered**:
  - 原始值不节点化：图更干净但偏离原型
  - 开关策略：体验更好但增加配置与测试面

## Key Implementation Patterns (for planning)

### Field-to-Value edge anchoring（字段行 → 值节点头部）

- **Decision**: 把“字段行”视为一个可挂载锚点的 UI 单元：每个字段行在节点内部渲染一个唯一的 source handle（或等价锚点标识），edge 的 source 绑定到该 handle。
- **Rationale**: 满足“连线起点必须在字段行那一格 UI 发出”的强约束。

### Triggering: 用户点击「生成可视图」才触发解析与渲染

- **Decision**: 编辑器内容变化不自动生成，避免频繁解析与画布抖动；只有点击按钮触发一次生成。
- **Rationale**: 与 spec 一致，且更利于性能与确定性（便于对照与测试）。

## Open Questions

- None.（本阶段不保留 NEEDS CLARIFICATION）


