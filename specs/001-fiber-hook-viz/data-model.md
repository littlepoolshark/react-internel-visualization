# Data Model: React Internals Object Visualization

**Date**: 2026-01-04  
**Branch**: `001-fiber-hook-viz`

本文件定义本功能的领域对象与图数据模型（与实现细节无关），用于约束解析输出、可视化渲染与测试口径。

## Core Domain Objects（阶段 1 / MVP）

### 1) Fiber

- **Meaning**: 代表“组件实例”的根对象（教学化简化模型）
- **Key fields**:
  - `id`: 稳定标识（同一输入多次生成需稳定）
  - `name`: 节点展示名称（例如 `Fiber` 或包含组件名）
  - `props`: 属性表（键值对；值将映射为 Value 节点）
  - `links`:
    - `hookHeadId`: 指向 Hook 链表头

### 2) Hook

- **Meaning**: hook 链表中的一个节点（对应一次内置 hook 调用）
- **Key fields**:
  - `id`
  - `hookType`: `useState` / `useEffect` / `useLayoutEffect` / ...（内置 hooks）
  - `memoizedState`: 所有类型的 hook（包括 effect 类）都统一使用此字段存储状态/effect 对象引用
  - `links`:
    - `nextHookId`: 指向下一个 Hook（通过 `next` 属性行展示）；链表末尾的 `next` 指向独立的 null 值节点
- **Note**: effect 类 hook 与状态类 hook 数据结构一致，都使用 `memoizedState` 字段
- **Note**: 链表最后一个 hook 的 `next` 字段必须生成 null 值节点（圆形），表示链表终止
- **Note**: useMemo hook 通过执行计算函数得到 memoizedState 初始值，依赖变量从 useState 初始值推断

### 3) Effect

- **Meaning**: effect 对象（教学化简化模型）
- **Key fields**:
  - `id`
  - `tag`: effect 类型标记（教学化简化）
  - `create`: 对应 create 回调的"可展示摘要"
  - `links`:
    - `nextEffectId`: 指向下一个 effect 对象，形成**循环链表**
- **Note**: 所有 effect 对象通过 `next` 字段连接形成循环链表。最后一个 effect 的 `next` 指向第一个 effect；若只有一个 effect，则 `next` 指向自身。

### 4) UpdateQueue

- **Meaning**: fiber 的更新队列对象（教学化简化模型）
- **Key fields**:
  - `id`
  - `lastEffect`: 指向 effect 循环链表的最后一个 effect 对象
- **Layout**: 位于 fiber 节点正下方，中轴线对齐
- **Note**: 其他属性省略，用 `......` 占位表示

### 5) Value

- **Meaning**: 任意非空字段值（包含原始值与引用值）
- **Key fields**:
  - `id`
  - `kind`: `number|string|boolean|object|array|function|symbol|null|undefined|unknown`
  - `display`: 面向 UI 的字符串展示（例如 `"0"`, `"true"`, `"[Object]"`）
  - `shape`: 节点形状（`circle` for primitives: number/string/boolean/null/undefined；`rect` for others）

## Graph Model

### GraphNode

- **Fields**:
  - `id`: string
  - `type`: `fiber|hook|effect|value|updateQueue`
  - `title`: 节点头部显示文本
  - `shape`: 节点形状（`rect` 默认；`circle` for primitive value nodes）
  - `attributes`: `Array<{ key: string; valueNodeId?: string; displayValue?: string; sourceAnchorId: string }>`
    - `sourceAnchorId`: 用于满足"字段行发出连线"的锚点标识（每一行必须唯一）
    - `displayValue`: 可选的内联展示值
  - `meta`: 可选扩展信息（阶段 2 扩字段时使用）

### GraphEdge

- **Fields**:
  - `id`: string
  - `type`: `object-link|field-value`
  - `sourceNodeId`: string
  - `sourceAnchorId?`: string（field-value 必填；object-link 可选）
  - `targetNodeId`: string
  - `targetAnchor`: 固定语义为 `node-header`（指向值节点头部）；hook 的 memoizedState 连接到值/effect 节点时使用 `top`

### Hook `memoizedState` 布局语义

- hook 对象的 `memoizedState` 字段具有特殊布局语义：
  - **连线出口**：从 hook 节点底部发出（`Position.Bottom`）
  - **连线样式**：使用直线（`straight`）而非阶梯折线
  - **值节点定位**：memoizedState 对应的值节点/effect 对象置于 hook 对象正下方
  - **中轴线对齐**：值节点与 hook 节点水平中心对齐
  - **Target Handle**：值节点（圆形）和 effect 节点的 target handle 位于节点顶部

### ParseResult

- **Fields**:
  - `status`: `success|error`
  - `errorMessage?`: string
  - `graph?`: `{ nodes: GraphNode[]; edges: GraphEdge[] }`
  - `diagnostics?`: 可选诊断信息（例如识别到的 hooks 列表，用于测试）

## Validation Rules

- `GraphNode.id` 必须全局唯一
- 对于每条 `field-value` edge：
  - `sourceAnchorId` 必须存在且指向 sourceNode 的某个 attribute 行
  - `targetNodeId` 必须为 `value` 类型节点
  - `targetAnchor` 必须为 `node-header`
- 同一输入多次生成：
  - 结构语义一致（节点/连线不无故增删）
  - `id` 生成规则稳定（便于回归测试）

## Stage 2 Extensions（逐步逼近运行时字段）

- 在不破坏阶段 1 语义与测试的前提下，逐步引入：
  - Fiber: `memoizedState`, `updateQueue`
  - Hook: 更贴近真实字段与链表结构
  - Effect: `next`/环结构、`destroy` 等


