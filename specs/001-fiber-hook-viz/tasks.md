---
description: "Task list for implementing 001-fiber-hook-viz"
---

# Tasks: React Internals Object Visualization

**Input**: Design documents from `/Users/samliu/react-internel-visualization/specs/001-fiber-hook-viz/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Tests are **REQUIRED by default** (project constitution). Do not omit tests unless spec explicitly waives them.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, add scripts, create feature skeleton per plan

- [x] T001 Add dependencies for UI/editor/graph/AST in `/Users/samliu/react-internel-visualization/package.json` (antd, reactflow, @uiw/react-codemirror, @codemirror/lang-javascript, @babel/parser, @babel/traverse, @types/babel\_\_traverse)
- [x] T002 Add test dependencies in `/Users/samliu/react-internel-visualization/package.json` (vitest, jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom)
- [x] T003 Add scripts `typecheck`, `test`, `test:watch` to `/Users/samliu/react-internel-visualization/package.json`
- [x] T004 Create Vitest config in `/Users/samliu/react-internel-visualization/vitest.config.ts` (jsdom environment, setup file)
- [x] T005 Create Vitest setup in `/Users/samliu/react-internel-visualization/tests/setup.ts` (import @testing-library/jest-dom)
- [x] T006 Create feature directories per plan:
  - `/Users/samliu/react-internel-visualization/src/features/internals-viz/domain/`
  - `/Users/samliu/react-internel-visualization/src/features/internals-viz/parser/`
  - `/Users/samliu/react-internel-visualization/src/features/internals-viz/components/`
  - `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/`
  - `/Users/samliu/react-internel-visualization/tests/unit/`
  - `/Users/samliu/react-internel-visualization/tests/component/`
- [x] T007 Add initial feature entry component scaffold in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/InternalsVizPage.tsx`
- [x] T008 Wire app route/root to render the single page in `/Users/samliu/react-internel-visualization/src/App.tsx`
- [x] T009 Add global styles for antd/reactflow if needed in `/Users/samliu/react-internel-visualization/src/App.css` (include reactflow base styles import location as decided)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared domain schema + deterministic IDs + parser → graph contract + reactflow mapping utilities

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Define domain types (GraphNode/GraphEdge/ParseResult + enums) in `/Users/samliu/react-internel-visualization/src/features/internals-viz/domain/types.ts` (must match `specs/001-fiber-hook-viz/data-model.md` + `contracts/graph-schema.md`)
- [x] T011 Define validation helpers for graph contract in `/Users/samliu/react-internel-visualization/src/features/internals-viz/domain/validate.ts` (field-value edge rules: sourceAnchorId exists; target is value node; targetAnchor is node-header)
- [x] T012 Implement stable ID helpers in `/Users/samliu/react-internel-visualization/src/features/internals-viz/domain/stableId.ts` (deterministic, no random/uuid; stable across same input)
- [x] T013 Implement AST parse wrapper in `/Users/samliu/react-internel-visualization/src/features/internals-viz/parser/parseCode.ts` (Babel parser plugins: typescript + jsx; return ParseResult error with user-facing message)
- [x] T014 Implement traverse-based hook collector in `/Users/samliu/react-internel-visualization/src/features/internals-viz/parser/collectHooks.ts` (only built-in hooks; preserve call order; ignore custom hook internals)
- [x] T015 Implement graph builder (domain graph) in `/Users/samliu/react-internel-visualization/src/features/internals-viz/parser/buildGraph.ts` (fiber → hook chain → effect/value nodes; build attribute rows with unique sourceAnchorId per row)
- [x] T016 Implement layout/position strategy (deterministic) in `/Users/samliu/react-internel-visualization/src/features/internals-viz/domain/layout.ts` (initial positions for fiber/hooks/effects/values; stable across runs)
- [x] T017 Implement reactflow adapter in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/toReactFlow.ts` (map GraphNode/GraphEdge → ReactFlow Node/Edge; ensure field-value edges bind to sourceAnchorId and target header anchor)
- [x] T018 [P] Unit test stableId determinism in `/Users/samliu/react-internel-visualization/tests/unit/stableId.test.ts`
- [x] T019 [P] Unit test parse error contract (syntax error → status=error + message, no graph) in `/Users/samliu/react-internel-visualization/tests/unit/parseCode.test.ts`
- [x] T020 [P] Unit test graph contract validation for field-value edges in `/Users/samliu/react-internel-visualization/tests/unit/graphContract.test.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 从组件代码生成对象关系图 (Priority: P1) 🎯 MVP

**Goal**: 用户输入代码并点击「生成可视图」，右侧生成 fiber/hook/effect/value 图；字段 → 值连线从字段行出发并指向值节点头部；错误/空态可见

**Independent Test**: 运行 `pnpm dev`，粘贴示例函数组件代码，点击「生成可视图」后看到节点与连线；输入语法错误时出现错误提示且不静默失败

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T021 [P] [US1] Component test: clicking 「生成可视图」renders graph container state in `/Users/samliu/react-internel-visualization/tests/component/InternalsVizPage.generate.test.tsx`
- [x] T022 [P] [US1] Component test: syntax error shows user-facing error message in `/Users/samliu/react-internel-visualization/tests/component/InternalsVizPage.error.test.tsx`
- [x] T023 [P] [US1] Unit test: buildGraph produces fiber→hook chain and value nodes for primitives in `/Users/samliu/react-internel-visualization/tests/unit/buildGraph.basic.test.ts`

### Implementation for User Story 1

- [x] T024 [P] [US1] Implement CodeMirror editor panel in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/CodeEditorPanel.tsx` (TSX/JSX mode via @codemirror/lang-javascript)
- [x] T025 [P] [US1] Implement canvas panel shell with ReactFlow in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/GraphCanvas.tsx` (ReactFlowProvider, background/controls as needed)
- [x] T026 [P] [US1] Implement custom node renderer with header + attribute rows in `/Users/samliu/react-internel-visualization/src/features/internals-viz/components/ObjectNode.tsx`
- [x] T027 [P] [US1] Implement "field row → edge source" anchors in `/Users/samliu/react-internel-visualization/src/features/internals-viz/components/AttributeRow.tsx` (render handle/anchor per row using `sourceAnchorId`)
- [x] T028 [US1] Compose Splitter layout + generate button + state management in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/InternalsVizPage.tsx`
  - left: editor
  - toolbar/button: 「生成可视图」 only triggers parse/build
  - right: graph canvas
  - states: empty / error / success
- [x] T029 [US1] Add a default example snippet constant in `/Users/samliu/react-internel-visualization/src/features/internals-viz/domain/exampleCode.ts` and load it into editor on first render
- [x] T030 [US1] Wire parser pipeline on click in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/InternalsVizPage.tsx` (parseCode → collectHooks → buildGraph → validate → toReactFlow)
- [x] T031 [US1] Ensure field-value edges target "value node header" by defining a consistent target anchor in `/Users/samliu/react-internel-visualization/src/features/internals-viz/components/ObjectNode.tsx` (header handle) and using it in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/toReactFlow.ts`
- [x] T032 [US1] Add empty/error UI states in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/InternalsVizPage.tsx` (empty: prompt user to paste code; error: show message; success: show graph)

**Checkpoint**: User Story 1 functional and independently testable (meets quickstart rules)

---

## Phase 4: User Story 2 - 在画布中自由浏览结构 (Priority: P2)

**Goal**: 画布支持拖拽/缩放/平移；图在交互过程中保持可读与稳定

**Independent Test**: 生成图后，可拖拽节点、缩放与平移视图，连线不断裂且画布操作流畅

### Tests for User Story 2 (REQUIRED)

- [x] T033 [P] [US2] Component test: user can pan/zoom without losing nodes in `/Users/samliu/react-internel-visualization/tests/component/GraphCanvas.interaction.test.tsx`

### Implementation for User Story 2

- [x] T034 [US2] Configure ReactFlow interaction options in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/GraphCanvas.tsx` (panOnDrag, zoomOnScroll, min/max zoom)
- [x] T035 [US2] Add fitView behavior after generation in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/GraphCanvas.tsx` (only when new graph generated)
- [x] T036 [US2] Improve visual readability (node spacing / edge style) in `/Users/samliu/react-internel-visualization/src/features/internals-viz/domain/layout.ts` and `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/toReactFlow.ts`

**Checkpoint**: 用户可自由浏览结构，交互不中断

---

## Phase 5: User Story 3 - 编辑输入并快速迭代对照 (Priority: P3)

**Goal**: 用户修改代码并再次点击「生成可视图」后，图按确定性规则更新；相同输入重复生成不乱跳；尽量保留已有节点位置

**Independent Test**: 先生成一次图，修改代码新增一个 hook，再次生成能看到新增节点；对同一输入重复生成结果稳定

### Tests for User Story 3 (REQUIRED)

- [x] T037 [P] [US3] Unit test: deterministic graph IDs for same input in `/Users/samliu/react-internel-visualization/tests/unit/determinism.sameInput.test.ts`
- [x] T038 [P] [US3] Component test: regenerate with same code preserves node positions (by stable IDs) in `/Users/samliu/react-internel-visualization/tests/component/InternalsVizPage.regenerate.test.tsx`

### Implementation for User Story 3

- [x] T039 [US3] Implement "preserve positions by node id" merge in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/mergePositions.ts` (existing nodes keep position; new nodes use layout default)
- [x] T040 [US3] Apply merge on regenerate in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/InternalsVizPage.tsx`
- [x] T041 [US3] Ensure same-input repeat generation is stable by removing any non-deterministic ordering in `/Users/samliu/react-internel-visualization/src/features/internals-viz/parser/collectHooks.ts` and `/Users/samliu/react-internel-visualization/src/features/internals-viz/parser/buildGraph.ts`

**Checkpoint**: 迭代对照体验达标（稳定、可预期）

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, docs alignment, performance improvements

- [x] T042 [P] Add README section for this feature in `/Users/samliu/react-internel-visualization/README.md` (how to use, supported input, known limitations)
- [x] T043 Add quickstart validation checklist items in `/Users/samliu/react-internel-visualization/specs/001-fiber-hook-viz/quickstart.md` if behavior changes during implementation
- [x] T044 [P] Performance pass: avoid unnecessary re-renders in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/GraphCanvas.tsx` (memoize nodeTypes/edgeTypes, stable callbacks)
- [x] T045 [P] Accessibility pass: keyboard focus and ARIA labels for generate button/editor panels in `/Users/samliu/react-internel-visualization/src/features/internals-viz/ui/InternalsVizPage.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - no dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (needs graph rendered)
- **User Story 3 (P3)**: Depends on US1 (needs regenerate pipeline + stable IDs); benefits from US2 but not strictly required

### Parallel Opportunities

- Setup tasks T001–T005 are mostly sequential; after scaffolding, many [P] tasks can run in parallel
- In Phase 2: unit tests T018–T020 can run in parallel once implementations land
- In each story: component tests and independent UI component tasks marked [P] can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# In parallel (different files):
Task: "Component test generate click in tests/component/InternalsVizPage.generate.test.tsx"
Task: "Implement CodeEditorPanel in src/features/internals-viz/ui/CodeEditorPanel.tsx"
Task: "Implement GraphCanvas in src/features/internals-viz/ui/GraphCanvas.tsx"
Task: "Implement ObjectNode in src/features/internals-viz/components/ObjectNode.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Follow `specs/001-fiber-hook-viz/quickstart.md`
