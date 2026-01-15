# Contracts: Graph Schema (Internal)

**Date**: 2026-01-04  
**Branch**: `001-fiber-hook-viz`  
**Scope**: 前端内部数据契约（无后端 API）

本文件定义“解析输出 → 可视化渲染”的内部契约，确保 parser 与 UI 解耦，并可独立测试。

## Contract 1: `ParseResult`

- **Input**: `code: string`（TSX/JSX 函数组件；仅识别内置 hooks；不展开自定义 hooks）
- **Output**: `ParseResult`
  - `status: "success" | "error"`
  - `errorMessage?: string`
  - `graph?: { nodes: GraphNode[]; edges: GraphEdge[] }`

### Error Contract

- `status="error"` 时：
  - `errorMessage` 必须可直接展示给用户（简明、可行动）
  - `graph` 必须为空/缺省（避免 UI 使用半成品数据）

## Contract 2: `GraphNode`

- **Required**:
  - `id: string`（稳定且唯一）
  - `type: "fiber" | "hook" | "effect" | "value" | "updateQueue"`
  - `title: string`（节点头部展示）
  - `shape: "rect" | "circle"`（默认 `rect`；primitive value 节点为 `circle`）
  - `attributes: Array<AttributeRow>`

### `AttributeRow`

- `key: string`（字段名）
- `sourceAnchorId: string`（字段行锚点；必须唯一）
- `displayValue?: string`（可选的内联展示值）
- `valueNodeId?: string`（当该字段值对应一个 Value 节点时使用）

## Contract 3: `GraphEdge`

- **Common**:
  - `id: string`
  - `type: "object-link" | "field-value"`
  - `sourceNodeId: string`
  - `targetNodeId: string`

### Field-to-Value Edge (关键约束)

- `type="field-value"` 时：
  - `sourceAnchorId` 必填，且必须对应 sourceNode 的某一条 `attributes[*].sourceAnchorId`
  - `targetNodeId` 必须指向 `type="value"` 的节点
  - 终点语义固定：指向 targetNode 的"头部区域"（node header）

### 连线渲染约束

**路径样式：**
- **对象链接**（fiber→hook、hook→hook）：使用 `default`（贝塞尔曲线）
- **Hook 的 memoizedState/next → 值节点/effect**：使用 `straight`（直线）
- **其他 field-value 连线**：使用 `smoothstep`（阶梯折线）
- 连线与连线之间通过不同路径样式自然分离

**实/虚线规则：**
- 指向**引用类型**（effect、hook、fiber、或 rect 形状的 value）→ **虚线**（strokeDasharray: 5 5）+ **流动动画**（animated: true）
- 指向**原始类型**（circle 形状的 value，如 number/string/boolean/null）→ **实线**，无动画

### Hook `memoizedState` 特殊布局规则

- **连线出口**：hook 节点的 `memoizedState` 字段连线从节点**底部**发出（而非右侧属性行）
- **连线样式**：使用 `straight`（直线）样式，形成垂直连接
- **值节点定位**：memoizedState 对应的值节点（原始值/effect 对象）置于 hook 对象**正下方**
- **中轴线对齐**：值节点与 hook 节点保持水平中轴线对齐
- **Target Handle**：值节点和 effect 节点的 target handle 位于节点**顶部**（接收垂直向下的连线）

### Hook `next` → null 特殊布局规则

- **连线方向**：hook 链表末尾的 `next` 字段连接到 null 值节点时，连线为**水平直线**
- **连线样式**：使用 `straight`（直线）样式
- **null 节点定位**：null 值节点放置在最后一个 hook 的**右侧**（与 hook 垂直居中对齐）
- **Target Handle**：null 值节点的 target handle 位于节点**左侧**（接收水平连线）

### Effect → Effect 循环链表连线规则

- **连线语义**：effect 对象通过 `next` 字段形成循环链表
- **Target Handle**：目标 effect 的 target handle 位于节点头部**左侧**（id="header"）

**普通 effect → effect 连线：**
- **连线样式**：使用 `default`（贝塞尔曲线），虚线 + 流动动画
- **Source Handle**：使用 `next` 字段行的右侧 source handle

**循环回指连线（最后一个 effect → 第一个 effect）：**
- **连线样式**：使用 `smoothstep`（阶梯折线），虚线 + 流动动画
- **Source Handle**：从 effect 节点**底部**发出（id="next-bottom"）
- **路径**：连线从源 effect 下方绕过，向左连接到目标 effect 左侧
- **约束**：全程不与任何 effect 节点区域在垂直空间重叠

### updateQueue → Effect 连线规则

- **连线语义**：updateQueue 的 `lastEffect` 字段指向 effect 循环链表的最后一个 effect
- **连线样式**：使用 `smoothstep`（阶梯折线），虚线 + 流动动画
- **Source Handle**：从 updateQueue 节点**底部**发出（id="lastEffect-bottom"）
- **Target Handle**：目标 effect 的 target handle 位于节点头部**右侧**（id="header-right"）
- **路径**：连线从 updateQueue 下方绕过，向右水平延伸，连接到 effect 右侧

### Fiber → updateQueue 连线规则

- **连线语义**：fiber 节点的 `updateQueue` 属性指向 updateQueue 对象节点
- **Fiber 节点属性**：`updateQueue` 属性位于 fiber 属性列表**尾部**
- **连线样式**：使用 `default`（贝塞尔曲线），虚线 + 流动动画（指向引用类型）
- **Source Handle**：从 fiber 节点的 `updateQueue` 属性行右侧发出
- **Target Handle**：连接到 updateQueue 节点**顶部**（id="top"）

## Determinism（确定性要求）

- 同一输入多次点击「生成可视图」，在不变更代码的情况下：
  - 节点/连线数量与语义一致
  - `id` 规则稳定（便于测试与 diff）


