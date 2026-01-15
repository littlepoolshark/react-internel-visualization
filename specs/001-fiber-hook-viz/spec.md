# Feature Specification: React Internals Object Visualization

**Feature Branch**: `001-fiber-hook-viz`  
**Created**: 2026-01-04  
**Status**: Draft  
**Input**: User description: "构建一个 React 内部数据结构（聚焦 fiber / hook / effect 对象）的可视化工具。单页：左侧代码输入区输入组件代码并提取对象链（fiber → hook 链表 → effect），右侧无限画布展示对象节点与连线；节点 UI=头部名称 + body 属性表；若字段有值则字段与值之间产生连线，连线起点必须从该字段行发出，最终指向代表值的那个对象节点的头部"

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - 从组件代码生成对象关系图 (Priority: P1)

用户在左侧输入一个 React 组件代码片段，点击「生成可视图」按钮，系统解析出该组件对应的内部对象关系（fiber → hook 链表 → effect 对象，以及字段值引用），并在右侧画布中以节点 + 连线方式展示，用户可直接通过图形理解结构。

**Why this priority**: 这是工具的核心价值：把“不可见的内部结构”变成可视化、可讲解、可对照原型的图。

**Independent Test**: 给定一段包含 `useState`、`useEffect` 的简单函数组件代码，用户点击「生成可视图」后能看到 fiber 节点、hook 链表节点、effect 节点及其连线关系，且字段值连线从字段行发出并指向值节点头部。

**Acceptance Scenarios**:

1. **Given** 页面已打开且左侧输入区为空，**When** 用户粘贴一段有效组件代码并点击「生成可视图」，**Then** 右侧画布出现对应节点与连线，且节点名称与属性表可阅读。
2. **Given** 右侧已展示一张图，**When** 用户再次点击「生成可视图」（代码未变），**Then** 图保持语义一致（节点/连线不应无故丢失或乱跳）。
3. **Given** 属性表中某字段存在非空值，**When** 系统渲染连线，**Then** 该连线起点位于该字段所在行的 UI 区域，且终点指向“代表该值的对象节点”的头部区域。

---

### User Story 2 - 在画布中自由浏览结构 (Priority: P2)

用户在右侧画布中拖拽、缩放、平移，查看复杂对象链；对象节点之间的连线清晰表达引用关系；用户可以在不丢失上下文的情况下定位某个节点与其关联字段。

**Why this priority**: 可视化能否“好用”取决于浏览体验；无限画布是理解复杂结构的必要条件。

**Independent Test**: 在已有图的情况下，用户可完成拖拽/缩放/平移操作，节点与连线仍保持可读且交互不中断。

**Acceptance Scenarios**:

1. **Given** 右侧已有图，**When** 用户进行拖拽/缩放/平移，**Then** 画布操作顺畅，节点与连线随视口变化正确显示。
2. **Given** 用户把两个节点拖远，**When** 用户缩放视图以同时看到两者，**Then** 连线仍能表达它们的关系（不中断、不消失）。

---

### User Story 3 - 编辑输入并快速迭代对照 (Priority: P3)

用户修改左侧组件代码（例如新增/删除一个 hook），再次生成后，右侧图能对应变化，便于对照“代码改动”与“内部结构变化”。

**Why this priority**: 这是教学/自查场景的高频用法：用最小改动观察结构变化。

**Independent Test**: 先点击「生成可视图」生成一次图，再在输入中新增一个 effect 类 hook 并再次点击「生成可视图」，能看到 effect 节点数量与连线随之变化。

**Acceptance Scenarios**:

1. **Given** 初始代码生成的图包含 N 个 hook 节点，**When** 用户新增一个 hook 并重新生成，**Then** 图中 hook 节点数量变为 N+1（或按规则变化），且新增节点可被识别。

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- 输入代码语法错误或不完整时，系统如何提示用户、以及右侧图是否保留上一次结果。
- 输入代码有效但不在支持范围内（例如不支持的组件形式/语法特性）时，系统如何提示“不可解析的原因”。
- 组件存在多个 hooks / 多个 effects 时，链表顺序如何展示、是否保持稳定。
- 字段值出现 `null/undefined`、循环引用、重复引用时，连线与节点如何表现。
- 大量节点时（例如 hooks 很多），画布浏览是否仍可用（可读性/操作流畅）。

## Requirements _(mandatory)_

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

#### 输入与解析

- **FR-001**: 系统必须提供左侧代码输入区，允许用户输入或粘贴一个 React 组件代码片段，并提供「生成可视图」按钮。**页面首次加载时自动触发解析与渲染**，后续用户可点击按钮重新生成。
- **FR-002**: 系统必须在解析触发后输出可视化所需的对象关系数据：至少包含 fiber、hook 链表、effect 对象，以及字段到字段值的引用关系。
- **FR-003**: 当输入无法解析时，系统必须在页面上给出可理解的错误提示，并不得静默失败。
- **FR-004**: 系统必须明确支持的输入范围（语法/文件类型/组件形态）。
  - **FR-004a**: 系统必须支持解析 **TSX/JSX 函数组件**，并且仅识别 React 内置 hooks（例如 `useState`、`useEffect`、`useLayoutEffect`）；**不展开**自定义 hooks 的内部实现（自定义 hooks 视为普通函数调用）。
  - **FR-004b**: **useMemo 支持**：系统必须通过语法分析提取 useMemo 的依赖数组和计算函数，并执行计算函数得到 memoizedState 的初始值。依赖变量的值从同组件内 useState 的初始值推断。

#### 可视化与布局

- **FR-005**: 系统必须在右侧提供无限画布区域，展示节点与连线，且支持拖拽/缩放/平移。
  - **FR-005a**: 布局必须为**自由布局**：节点可由用户自由拖动，而非固定位置。
- **FR-006**: 每个对象节点 UI 必须包含"头部（对象名称）+ body（属性列表）"，属性列表展示字段名；当属性行存在目标节点引用时，属性行右侧**不显示任何文本**（仅通过连线表达关系）。
  - **FR-006b**: fiber、hook、effect、updateQueue 节点的属性列表**首部**必须包含一个占位字段（显示 "......"），用于表示被省略的其他字段。
  - **FR-006c**: **updateQueue 对象节点**：
    - 类型为 `updateQueue`，颜色为紫色（#722ed1）
    - 只展示 `lastEffect` 属性（指向 effect 循环链表的最后一个 effect 对象）
    - 布局：位于 fiber 节点**正下方**（垂直偏移 100px），中轴线对齐
    - **连线规则**：`lastEffect` 连线从底部 source handle（id="lastEffect-bottom"）发出，使用 `smoothstep` 边类型绕道，连接到 effect 节点**右侧**（id="header-right"）
  - **FR-006d**: **Fiber 节点的 updateQueue 属性**：
    - fiber 节点必须在属性列表**尾部**包含 `updateQueue` 属性
    - 该属性连接到 updateQueue 对象节点的**顶部**（id="top"）
    - 连线类型为 `default`（贝塞尔曲线），虚线 + 流动动画（指向引用类型）
- **FR-007**: 当某字段存在值时，系统必须为"字段 → 值"生成连线：连线起点必须定位在该字段行的 UI 区域，连线终点必须指向"代表该值的对象节点"的头部区域。
  - **FR-007a**: 连线路径样式规则：
    - **对象链接**（fiber→hook、hook→hook）：使用 `default`（贝塞尔曲线）
    - **Hook 的 memoizedState/next → 值节点**：使用 `straight`（直线）
    - **其他 field-value**：使用 `smoothstep`（阶梯折线）
  - **FR-007b**: 连线与连线之间通过不同路径样式自然分离。
  - **FR-007e**: **连线实/虚线规则**：
    - 指向**引用类型**（effect、hook、fiber、或 rect 形状的 value）→ **虚线**（strokeDasharray: 5 5）+ **流动动画**（animated）
    - 指向**原始类型**（circle 形状的 value，如 number/string/boolean/null）→ **实线**，无动画
  - **FR-007c**: **Hook 对象的 `memoizedState` 特殊布局**：
    - `memoizedState` 连线从 hook 节点**底部**发出（而非右侧）
    - 使用**直线**（straight）样式连接（而非 smoothstep）
    - 值节点/effect 节点置于 hook 对象**正下方**，与 hook 中轴线对齐
    - 值节点和 effect 节点的 target handle 在**顶部**
- **FR-008**: 系统必须定义"字段值节点"的生成规则（哪些值会被抽成独立节点）。
  - **FR-008a**: 对于 **所有非空值**（包含 number/string/boolean 等原始值，以及对象/数组/函数等引用值），系统都必须生成独立"值节点"并通过"字段 → 值"连线连接（与原型一致，例如 `0` 也作为节点）。
  - **FR-008b**: **JS 基础类型值节点**（number/string/boolean/null/undefined）必须使用**圆形**外观表示，以区别于对象节点的矩形外观。
  - **FR-008c**: **Hook 链表末尾的 `next: null`** 必须生成独立的 null 值节点（圆形），表示链表终止。
  - **FR-008d**: **Hook 的 `next` 字段连接到 null 值节点**时，连线必须是**水平直线**（从 hook 右侧 → null 节点左侧），null 节点放置在最后一个 hook 的右侧。
  - **FR-008e**: **Effect 对象循环链表**：所有 effect 对象通过 `next` 字段连接形成循环链表。最后一个 effect 的 `next` 指向第一个 effect；若只有一个 effect，则 `next` 指向自身。
  - **FR-008f**: **Effect → Effect 连线规则**：
    - 普通 effect → effect 连线：使用 `default`（贝塞尔曲线），目标 effect 的 target handle 位于节点头部**左侧**（id="header"）
    - **循环回指连线**（最后一个 effect → 第一个 effect）：
      - 连线从 effect 节点**底部** source handle（id="next-bottom"）发出
      - 使用 `smoothstep`（阶梯折线）样式，自动绕过节点下方
      - 连线终点为目标 effect 节点头部**左侧**（id="header"）
      - 全程不与任何 effect 节点区域在垂直空间重叠

#### 对象模型与一致性

- **FR-009**: 系统必须按确定性规则生成对象链与顺序，以保证同一输入多次生成结果语义一致（便于对照与测试）。
- **FR-010**: 系统必须定义对象模型的“精度等级”。
  - **FR-010a**: 系统必须采用 **两阶段精度策略**：
    - **阶段 1（MVP）**：教学化简化模型（fiber → hook 链表 → effect + 少量核心字段与引用关系），保证可视化与交互闭环。
    - **阶段 2（迭代）**：在不破坏阶段 1 语义与测试的前提下，逐步逼近 React 运行时字段/链表结构（例如 `memoizedState`、`updateQueue`、`lastEffect` 等），并以“增量扩展字段覆盖”方式演进。

### Key Entities _(include if feature involves data)_

- **CodeSnippet**: 用户输入的组件代码文本
- **ParseResult**: 解析结果（成功/失败、错误信息、对象关系数据）
- **GraphNode**: 可视化节点（fiber/hook/effect/字段值等类别、名称、属性集合）
- **GraphEdge**: 可视化连线（来源字段锚点、目标节点/值、连线类型：对象关系/字段值）
- **CanvasViewport**: 画布视口状态（缩放、偏移）

## Success Criteria _(mandatory)_

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 新用户在首次打开页面后，可在 30 秒内完成“粘贴示例组件 → 生成 → 看懂 fiber/hook/effect 关系”的主流程。
- **SC-002**: 对于“中等规模”输入（例如包含 3–10 个 hooks、1–5 个 effects 的组件），用户触发生成后在 2 秒内看到更新后的图。
- **SC-003**: 画布交互（拖拽/缩放/平移）在常见硬件上无明显卡顿；用户连续操作时不会频繁误触或丢失连线。
- **SC-004**: 在 10 次随机修改-生成循环中，生成结果保持确定性：相同输入的结构一致（节点/连线不无故漂移），便于回归测试。
