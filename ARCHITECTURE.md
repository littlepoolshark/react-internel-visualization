# 项目架构说明书

> **项目名称**：React Internals Visualization  
> **技术栈**：React 18 + TypeScript + Rsbuild + ReactFlow + CodeMirror 6 + Babel  
> **线上地址**：https://react-internel-visualization.vercel.app

---

## 一、项目概述

本项目是一个 **React 内部数据结构可视化工具**，用于将 React 组件代码解析为其内部对象结构（Fiber → Hook 链表 → Effect 对象），并以交互式图形方式展示。

**核心功能**：
1. 用户在左侧代码编辑器输入 React 组件代码
2. 系统通过 AST 解析提取 Hook 调用信息
3. 构建领域图模型（节点 + 边）
4. 在右侧 ReactFlow 画布中渲染可视化图形

---

## 二、整体架构

### 2.1 架构分层图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           UI 层 (ui/)                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐ │
│  │ InternalsVizPage│  │ CodeEditorPanel │  │     GraphCanvas      │ │
│  │   (主页面容器)   │  │  (代码编辑器)    │  │   (ReactFlow 画布)   │ │
│  └────────┬────────┘  └─────────────────┘  └──────────────────────┘ │
│           │                                                          │
│  ┌────────┴────────┐  ┌─────────────────┐                           │
│  │   toReactFlow   │  │  mergePositions │                           │
│  │ (模型→RF 转换)  │  │   (位置保留)     │                           │
│  └─────────────────┘  └─────────────────┘                           │
├─────────────────────────────────────────────────────────────────────┤
│                       Components 层 (components/)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐ │
│  │    ObjectNode   │  │    ValueNode    │  │    AttributeRow      │ │
│  │  (矩形对象节点)  │  │  (圆形值节点)    │  │     (属性行)         │ │
│  └─────────────────┘  └─────────────────┘  └──────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                        Parser 层 (parser/)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐ │
│  │    parseCode    │  │  collectHooks   │  │     buildGraph       │ │
│  │   (AST 解析)    │  │  (Hook 收集)    │  │    (图构建)          │ │
│  └─────────────────┘  └─────────────────┘  └──────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                        Domain 层 (domain/)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐ │
│  │      types      │  │     stableId    │  │       layout         │ │
│  │   (类型定义)    │  │   (ID 生成器)   │  │     (布局计算)       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐                           │
│  │    validate     │  │   exampleCode   │                           │
│  │   (契约校验)    │  │   (示例代码)    │                           │
│  └─────────────────┘  └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流向

```
用户输入代码
     │
     ▼
┌─────────────┐    Babel Parser    ┌─────────────┐
│ parseCode() │ ────────────────▶  │    AST      │
└─────────────┘                    └──────┬──────┘
                                          │
                                          ▼
                               ┌──────────────────┐
                               │ collectHooks()   │
                               │   Babel Traverse │
                               └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │   HookCall[]     │
                               │   (Hook 信息)    │
                               └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │  buildGraph()    │
                               │   构建领域图     │
                               └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │  GraphNode[]     │
                               │  GraphEdge[]     │
                               └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │  toReactFlow()   │
                               │  转换为 RF 格式  │
                               └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │  ReactFlow 渲染  │
                               │   可视化画布     │
                               └──────────────────┘
```

---

## 三、模块详解

### 3.1 Domain 层 —— 领域模型与核心逻辑

**职责**：定义领域类型、生成稳定 ID、计算布局、校验契约

#### 3.1.1 `types.ts` —— 类型系统

**核心技术点**：TypeScript 严格类型定义

| 类型 | 说明 |
|------|------|
| `NodeKind` | 节点类型枚举：`fiber` \| `hook` \| `effect` \| `value` \| `updateQueue` |
| `GraphNode` | 图节点：id、type、title、shape、attributes |
| `GraphEdge` | 图边：id、type、sourceNodeId、targetNodeId、sourceAnchorId |
| `AttributeRow` | 属性行：key、sourceAnchorId、displayValue、valueNodeId |
| `HookCall` | Hook 调用信息：hookType、id、index、initialValue、isEffect、memoValue |

**设计原则**：
- 所有类型与 `data-model.md` 和 `contracts/graph-schema.md` 保持同步
- 使用联合类型（Union Types）而非枚举，便于类型推导

#### 3.1.2 `stableId.ts` —— 确定性 ID 生成

**核心技术点**：确定性 ID 算法，保证相同输入产生相同输出

```typescript
fiberId()         → "fiber"
hookId(0)         → "hook-0"
effectId(1)       → "effect-1"
valueId("hook-0", "memoizedState") → "hook-0:val:memoizedState"
fieldAnchorId("hook-0", "next")    → "hook-0:anchor:next"
edgeId("fiber", "hook-0")          → "edge:fiber->hook-0"
```

**设计原则**：
- 禁止使用 UUID 或随机 ID
- ID 格式具有语义，便于调试和追溯
- 支持从 ID 反解出父节点和字段信息

#### 3.1.3 `layout.ts` —— 布局计算引擎

**核心技术点**：确定性布局算法

**布局规则**：
1. **Fiber 节点**：左上角原点 (0, 0)
2. **UpdateQueue 节点**：Fiber 正下方，中轴线对齐
3. **Hook 链**：水平排列，从左到右
4. **Effect 节点**：对应 Hook 的正下方
5. **Value 节点**：
   - `memoizedState` 值：父 Hook 正下方（垂直对齐）
   - `next: null` 值：父 Hook 右侧（水平对齐）

**关键常量**：
```typescript
const NODE_WIDTH = 240;
const NODE_HEIGHT = 160;
const GAP_X = 100;
const GAP_Y = 80;
const VALUE_NODE_SIZE = 60;
```

#### 3.1.4 `validate.ts` —— 契约校验

**核心技术点**：运行时契约验证

**校验规则**：
- `field-value` 类型边必须有 `sourceAnchorId`
- 所有边的 source/target 节点必须存在
- 节点 ID 必须唯一

---

### 3.2 Parser 层 —— AST 解析与 Hook 提取

**职责**：将 React 代码解析为 AST，提取 Hook 调用信息，构建领域图

#### 3.2.1 `parseCode.ts` —— Babel 解析器封装

**核心技术点**：Babel Parser + TSX/JSX 支持

```typescript
import { parse } from '@babel/parser';

export function parseCode(code: string): ParseCodeResult | ParseCodeError {
  const plugins: ParserPlugin[] = ['jsx', 'typescript'];
  const ast = parse(code, { sourceType: 'module', plugins });
  return { success: true, ast };
}
```

**错误处理**：
- 捕获 Babel 解析错误
- 转换为用户友好的中文错误消息

#### 3.2.2 `collectHooks.ts` —— Hook 收集器

**核心技术点**：Babel Traverse + 两阶段 AST 遍历

**支持的 Hook**：
```typescript
const BUILT_IN_HOOKS = new Set([
  'useState', 'useEffect', 'useLayoutEffect', 'useReducer',
  'useCallback', 'useMemo', 'useRef', 'useContext',
  'useImperativeHandle', 'useDebugValue', 'useDeferredValue',
  'useTransition', 'useId', 'useSyncExternalStore', 'useInsertionEffect',
]);
```

**两阶段遍历策略**：
1. **第一阶段**：收集 `useState` 变量绑定，构建变量环境
2. **第二阶段**：遍历所有 Hook 调用，对于 `useMemo` 执行计算函数

**useMemo 动态求值**：
```typescript
// 使用 @babel/generator 将 AST 转回代码
const code = generate(body).code;
// 使用 new Function() 在受控环境中执行
const fn = new Function(...varNames, code);
const result = fn(...varValues);
```

#### 3.2.3 `buildGraph.ts` —— 图构建器

**核心技术点**：领域模型构建 + 循环链表处理

**构建流程**：
1. 创建 Fiber 节点（包含 `memoizedState` 和 `updateQueue` 属性）
2. 创建 UpdateQueue 节点（包含 `lastEffect` 属性）
3. 遍历 Hook 列表，为每个 Hook 创建节点和边
4. 对于 Effect Hook，创建 Effect 对象并构建循环链表
5. 对于 State/Memo Hook，创建对应的 Value 节点

**Effect 循环链表**：
```typescript
// 最后一个 effect 的 next 指向第一个 effect
const nextEffectNodeId = effectNodeIds[(effectIndex + 1) % effectNodeIds.length];
// 单个 effect 时指向自己
if (effectNodeIds.length === 1) nextEffectNodeId = effNodeId;
```

---

### 3.3 Components 层 —— ReactFlow 自定义节点

**职责**：渲染可视化节点 UI

#### 3.3.1 `ObjectNode.tsx` —— 矩形对象节点

**核心技术点**：ReactFlow Custom Node + 多 Handle 管理

**节点结构**：
```
┌──────────────────────────────────┐
│ [Header Handle (left)]          │ ← Target Handle
│         节点标题                 │
│ [Header Handle (right)] (effect)│ ← Target Handle
├──────────────────────────────────┤
│ ...... (省略字段)                │
│ memoizedState    [Handle]────▶  │ ← Source Handle
│ next             [Handle]────▶  │ ← Source Handle
├──────────────────────────────────┤
│ [Bottom Handle] (hook/effect)   │ ← Source/Target Handle
└──────────────────────────────────┘
```

**Handle 配置**：

| Handle ID | 类型 | 位置 | 适用节点 | 用途 |
|-----------|------|------|----------|------|
| `header` | target | 左侧 | 所有 | 接收普通连线 |
| `header-right` | target | 右侧 | effect | 接收 updateQueue 连线 |
| `top` | target | 顶部 | effect, updateQueue | 接收垂直连线 |
| `{fieldAnchorId}` | source | 右侧 | 所有 | 属性行连线起点 |
| `{memoizedState anchor}` | source | 底部 | hook | memoizedState 连线起点 |
| `next-bottom` | source | 底部 | effect | 循环链表回指 |
| `lastEffect-bottom` | source | 底部 | updateQueue | lastEffect 连线起点 |

#### 3.3.2 `ValueNode.tsx` —— 圆形值节点

**核心技术点**：圆形 CSS 样式 + 多方向 Handle

**样式**：
```typescript
width: 60, height: 60, borderRadius: '50%'
```

**Handle 配置**：
- `header`：顶部，接收 hook 的 memoizedState 垂直连线
- `left`：左侧，接收 hook 的 next 水平连线

#### 3.3.3 `AttributeRow.tsx` —— 属性行组件

**核心技术点**：条件渲染 Source Handle

**渲染规则**：
- 如果有 `valueNodeId`：隐藏 `displayValue`，显示 Source Handle
- 如果是 hook 的 `memoizedState`：不渲染右侧 Handle（使用底部 Handle）
- 如果是 `......` 占位行：无交互

---

### 3.4 UI 层 —— 页面与交互

**职责**：组装页面、管理状态、处理用户交互

#### 3.4.1 `InternalsVizPage.tsx` —— 主页面

**核心技术点**：状态管理 + 数据流编排

**状态管理**：
```typescript
const [code, setCode] = useState(EXAMPLE_CODE);
const [status, setStatus] = useState<Status>("empty");
const [nodes, setNodes, onNodesChange] = useNodesState([]);
const [edges, setEdges, onEdgesChange] = useEdgesState([]);
```

**数据流编排**（handleGenerate）：
```
parseCode → collectHooks → buildGraph → validateGraph → toReactFlow → setNodes/setEdges
```

**自动生成**：
```typescript
useEffect(() => {
  handleGenerate();
}, []); // 首次加载时自动渲染
```

#### 3.4.2 `toReactFlow.ts` —— 模型转换器

**核心技术点**：领域模型到 ReactFlow 格式的适配

**边类型决策**：

| 场景 | 边类型 | 虚线 | 动画 |
|------|--------|------|------|
| fiber→hook, hook→hook | `default` (Bezier) | ✓ | ✓ |
| hook.memoizedState→value/effect | `straight` | 值:✗ effect:✓ | 值:✗ effect:✓ |
| hook.next→null | `straight` | ✗ | ✗ |
| effect→effect (普通) | `default` | ✓ | ✓ |
| effect→effect (回指) | `smoothstep` | ✓ | ✓ |
| updateQueue→effect | `smoothstep` | ✓ | ✓ |
| fiber→updateQueue | `default` | ✓ | ✓ |

**引用类型判断**：
```typescript
function isReferenceType(targetNodeId: string, nodeMap: Map<string, GraphNode>): boolean {
  const targetNode = nodeMap.get(targetNodeId);
  if (targetNode.type !== 'value') return true;  // effect, hook, fiber
  return targetNode.shape === 'rect';  // rect = reference, circle = primitive
}
```

#### 3.4.3 `mergePositions.ts` —— 位置保留

**核心技术点**：增量更新，保留用户拖拽位置

```typescript
export function mergePositions(currentNodes, newNodes) {
  const currentMap = new Map(currentNodes.map(n => [n.id, n.position]));
  return newNodes.map(n => ({
    ...n,
    position: currentMap.get(n.id) ?? n.position, // 保留已存在节点的位置
  }));
}
```

#### 3.4.4 `CodeEditorPanel.tsx` —— 代码编辑器

**核心技术点**：CodeMirror 6 + React 集成

```typescript
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

<CodeMirror
  value={value}
  height="100%"
  extensions={[javascript({ jsx: true, typescript: true })]}
  onChange={onChange}
/>
```

#### 3.4.5 `GraphCanvas.tsx` —— ReactFlow 画布

**核心技术点**：ReactFlow 配置 + 自定义节点注册

```typescript
const nodeTypes = useMemo(() => ({
  objectNode: ObjectNode,
  valueNode: ValueNode,
}), []);

<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  nodesDraggable={true}
  nodesConnectable={false}
  panOnDrag
  zoomOnScroll
  minZoom={0.1}
  maxZoom={4}
>
  <Background />
  <Controls />
</ReactFlow>
```

---

## 四、测试架构

### 4.1 测试分层

```
tests/
├── unit/                         # 单元测试
│   ├── stableId.test.ts          # ID 生成器测试
│   ├── parseCode.test.ts         # 解析器测试
│   ├── buildGraph.basic.test.ts  # 图构建测试
│   ├── graphContract.test.ts     # 契约校验测试
│   └── determinism.sameInput.test.ts  # 确定性测试
└── component/                    # 组件测试
    ├── InternalsVizPage.generate.test.tsx    # 生成流程测试
    ├── InternalsVizPage.error.test.tsx       # 错误处理测试
    ├── InternalsVizPage.regenerate.test.tsx  # 重新生成测试
    └── GraphCanvas.interaction.test.tsx      # 交互测试
```

### 4.2 测试技术栈

| 工具 | 用途 |
|------|------|
| Vitest | 测试运行器 |
| @testing-library/react | 组件测试 |
| @testing-library/user-event | 用户交互模拟 |
| jsdom | DOM 环境模拟 |

### 4.3 测试覆盖策略

- **单元测试**：覆盖纯函数逻辑（ID 生成、解析、构建、校验）
- **组件测试**：覆盖关键用户交互（生成、错误、重新生成）
- **确定性测试**：验证相同输入产生相同输出

---

## 五、技术决策记录

| 决策项 | 选择 | 理由 |
|--------|------|------|
| UI 框架 | React 18 | 项目定位为 React 内部可视化，使用 React 开发一致性高 |
| 构建工具 | Rsbuild | Rust 编写，构建速度快，开箱即用 |
| 类型系统 | TypeScript | 严格类型保障，减少运行时错误 |
| 图渲染引擎 | ReactFlow | React 生态，自定义节点/边能力强 |
| 代码编辑器 | CodeMirror 6 | 现代架构，TypeScript 支持好 |
| AST 解析 | Babel | React 代码标准解析器，生态成熟 |
| UI 组件库 | Ant Design 5 | Splitter 组件满足布局需求 |
| 边路由策略 | smoothstep + z-index | smart-edge 兼容性问题，回退到内置方案 |

---

## 六、文件清单

```
src/
├── App.tsx                        # 应用入口
├── App.css                        # 全局样式
├── index.tsx                      # 渲染入口
└── features/internals-viz/
    ├── components/
    │   ├── AttributeRow.tsx       # 属性行组件 (57 lines)
    │   ├── ObjectNode.tsx         # 矩形节点组件 (188 lines)
    │   └── ValueNode.tsx          # 圆形节点组件
    ├── domain/
    │   ├── exampleCode.ts         # 示例代码 (29 lines)
    │   ├── layout.ts              # 布局计算 (132 lines)
    │   ├── stableId.ts            # ID 生成器 (59 lines)
    │   ├── types.ts               # 类型定义 (94 lines)
    │   └── validate.ts            # 契约校验
    ├── parser/
    │   ├── buildGraph.ts          # 图构建器 (311 lines)
    │   ├── collectHooks.ts        # Hook 收集器 (237 lines)
    │   └── parseCode.ts           # AST 解析器 (35 lines)
    └── ui/
        ├── CodeEditorPanel.tsx    # 代码编辑器
        ├── GraphCanvas.tsx        # ReactFlow 画布
        ├── InternalsVizPage.tsx   # 主页面 (150 lines)
        ├── mergePositions.ts      # 位置保留
        └── toReactFlow.ts         # 模型转换器 (180 lines)
```

---

## 七、扩展指南

### 7.1 新增 Hook 支持

1. 在 `collectHooks.ts` 的 `BUILT_IN_HOOKS` 中添加 Hook 名称
2. 如果是 Effect 类 Hook，添加到 `EFFECT_HOOKS`
3. 如果需要特殊处理（如 useMemo），在 `collectHooks` 中添加逻辑
4. 更新 `buildGraph.ts` 中的处理逻辑

### 7.2 新增节点类型

1. 在 `types.ts` 的 `NodeKind` 中添加新类型
2. 在 `stableId.ts` 中添加 ID 生成函数
3. 在 `buildGraph.ts` 中添加节点创建逻辑
4. 在 `ObjectNode.tsx` 的 `TYPE_COLORS` 中添加颜色
5. 在 `layout.ts` 中添加布局规则

### 7.3 自定义边样式

1. 在 `toReactFlow.ts` 中添加边类型判断逻辑
2. 配置 `edgeType`、`sourceHandle`、`targetHandle`
3. 设置 `style.strokeDasharray` 和 `animated` 属性

---

**版本**: 1.0.0 | **最后更新**: 2026-01-05

