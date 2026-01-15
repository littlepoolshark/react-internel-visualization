# SDD 开发流程：基于 Speckit 的规格驱动开发实践

> 本文档基于 `react-internel-visualization` 项目的完整开发过程，总结提炼出一套基于 GitHub Speckit 的 **Specification-Driven Development (SDD)** 操作流程与方法论。

---

## 一、核心理念

### 1.1 什么是 SDD？

**Specification-Driven Development（规格驱动开发）** 是一种以"规格文档"为核心驱动力的开发方法论。与传统的"先写代码、后补文档"不同，SDD 强调：

```
需求 → 规格 → 计划 → 任务 → 实现 → 验证 → 文档同步
```

**核心价值**：

- **明确性**：所有需求、决策、边界条件在编码前就被明确定义
- **可追溯性**：每一行代码都能追溯到具体的规格条目
- **可验证性**：验收标准先于实现存在，避免"自我验收"
- **知识沉淀**：开发过程中的决策和权衡被文档化保留

### 1.2 Speckit 工具链

Speckit 提供了一套结构化的命令和模板，驱动 SDD 流程：

| 命令                    | 阶段        | 输出                                                                    |
| ----------------------- | ----------- | ----------------------------------------------------------------------- |
| `/speckit.constitution` | 0. 项目宪法 | `.specify/memory/constitution.md`                                       |
| `/speckit.specify`      | 1. 需求规格 | `specs/[feature]/spec.md`                                               |
| `/speckit.plan`         | 2. 技术方案 | `specs/[feature]/plan.md`, `research.md`, `data-model.md`, `contracts/` |
| `/speckit.tasks`        | 3. 任务分解 | `specs/[feature]/tasks.md`                                              |
| `/speckit.implement`    | 4. 代码实现 | 源代码 + 测试                                                           |

---

## 二、开发流程六阶段

### 阶段 0：项目宪法（Constitution）

**目标**：定义项目的核心原则、质量门禁和工程规范。

**触发命令**：`/speckit.constitution`

**产出物**：

```
.specify/memory/constitution.md
```

**宪法内容框架**：

1. **TypeScript 与架构边界**：类型要求、组件边界、状态管理原则
2. **代码质量与一致性**：最小改动原则、可读性要求、依赖管理
3. **测试标准**：分层测试要求、豁免条件
4. **用户体验与可访问性**：状态覆盖、交互可预测性、ARIA 标注
5. **性能与可观测性**：性能目标、优化实践、错误追踪

**实践要点**：

- 宪法是项目的"最高法律"，所有后续决策必须符合宪法原则
- 宪法可修订，但必须记录修订历史和影响范围
- 模板文件（`tasks-template.md`、`plan-template.md`）必须与宪法同步

---

### 阶段 1：需求规格（Specify）

**目标**：将用户需求转化为结构化的功能规格。

**触发命令**：`/speckit.specify [需求描述]`

**产出物**：

```
specs/[feature-name]/spec.md
```

**规格文档结构**：

```markdown
# Feature Specification: [FEATURE NAME]

## User Scenarios & Testing（用户场景与测试）

### User Story 1 - [标题] (Priority: P1)

- Why this priority: [优先级理由]
- Independent Test: [独立测试方法]
- Acceptance Scenarios: Given/When/Then

### Edge Cases（边界情况）

## Requirements（需求）

### Functional Requirements

- FR-001: 系统必须...
- FR-002: 系统必须...

### Key Entities（关键实体）

## Success Criteria（成功标准）
```

**实践要点**：

1. **用户故事优先级**：按 P1 > P2 > P3 排序，P1 必须能独立交付 MVP
2. **需求明确性**：使用 "系统必须..." 的确定性表述，避免模糊语言
3. **可测试性**：每个 FR 都应该能转化为具体的测试用例
4. **争议标记**：不确定的需求使用 `[NEEDS CLARIFICATION]` 标注，等待决策

**本项目实践**：

```markdown
- FR-007: 当某字段存在值时，系统必须为"字段 → 值"生成连线：
  连线起点必须定位在该字段行的 UI 区域，
  连线终点必须指向"代表该值的对象节点"的头部区域。
```

---

### 阶段 2：技术方案（Plan）

**目标**：确定技术选型、数据模型和内部契约。

**触发命令**：`/speckit.plan [技术栈约束]`

**产出物**：

```
specs/[feature-name]/
├── plan.md           # 实现计划
├── research.md       # 技术决策记录
├── data-model.md     # 领域模型定义
├── contracts/        # 内部契约
│   └── graph-schema.md
└── quickstart.md     # 快速启动指南
```

**Plan.md 结构**：

```markdown
## Summary（概要）

## Technical Context（技术上下文）

## Constitution Check（宪法检查）

## Project Structure（项目结构）

## Complexity Tracking（复杂度追踪）
```

**Research.md 结构**：

```markdown
## Key Technical Decisions

### Decision 1: [决策标题]

- Context: [背景]
- Options: [选项]
- Decision: [决定]
- Rationale: [理由]
```

**实践要点**：

1. **Constitution Check**：方案必须通过宪法门禁检查
2. **技术决策记录**：每个重要决策都需要记录背景、选项、理由
3. **数据模型优先**：先定义领域模型，再定义 UI/API 契约
4. **争议上报**：遇到技术选型争议时，必须上报用户决策

**本项目实践**：

- 使用两阶段精度策略：MVP 阶段使用简化模型，后续迭代逐步逼近 React 运行时结构
- 所有技术选型（antd5、reactflow、CodeMirror 6、Babel）都记录了选择理由

---

### 阶段 3：任务分解（Tasks）

**目标**：将方案转化为可执行的任务列表。

**触发命令**：`/speckit.tasks`

**产出物**：

```
specs/[feature-name]/tasks.md
```

**任务分解原则**：

1. **按用户故事组织**：每个 US 的任务独立成组
2. **依赖排序**：基础设施 → 阻塞任务 → 各 US 并行
3. **测试先行**：测试任务在实现任务之前
4. **并行标记**：可并行的任务用 `[P]` 标注

**任务阶段划分**：

```
Phase 1: Setup（基础设施）
Phase 2: Foundational（阻塞性前置）
Phase 3: User Story 1 [P1] 🎯 MVP
Phase 4: User Story 2 [P2]
Phase 5: User Story 3 [P3]
Phase N: Polish（收尾优化）
```

**任务格式**：

```markdown
- [ ] T001 [P] [US1] 创建 GraphNode 类型定义 in src/domain/types.ts
- [ ] T002 [US1] 实现 parseCode 解析器 in src/parser/parseCode.ts
```

**实践要点**：

- 每个任务应该在 30 分钟内可完成
- 任务描述必须包含具体文件路径
- 每个 Phase 结束后有 Checkpoint 用于验证

---

### 阶段 4：代码实现（Implement）

**目标**：按任务列表逐步实现功能。

**触发命令**：`/speckit.implement`

**实现原则**：

1. **严格按任务顺序**：不允许跨步骤实现
2. **最小改动原则**：只做当前任务要求的修改
3. **测试先行**：先写测试，确保失败，再实现
4. **即时验证**：每个任务完成后运行 typecheck + test

**代码质量门禁**：

```bash
pnpm typecheck   # TypeScript 类型检查
pnpm test        # 单元测试 + 组件测试
pnpm lint        # 代码风格检查（如有）
```

**实践要点**：

- 每完成一个任务，更新 tasks.md 的 checkbox 状态
- 遇到阻塞问题时，优先添加日志定位
- Bug 修复超过 2 次失败时，必须添加调试日志

---

### 阶段 5：迭代优化（Iterate）

**目标**：根据验收反馈进行优化调整。

**迭代流程**：

```
验收测试 → 发现问题 → 讨论方案 → 更新 spec → 实现修改 → 再次验证
```

**关键规则**：

1. **文档同步**：任何功能变更必须同步更新对应的 spec 文档
2. **争议上报**：遇到需求边界不清时，必须上报用户决策
3. **增量交付**：每次迭代都应该有可验证的交付物

**本项目实践**：

- 用户反馈"属性行右侧不应显示目标节点 ID" → 更新 FR-006 → 修改代码
- 用户要求"连线终点改为右侧" → 更新 spec.md + contracts/graph-schema.md → 修改代码

---

### 阶段 6：部署上线（Deploy）

**目标**：将验收通过的功能部署到生产环境。

**部署流程**：

1. 确认所有测试通过
2. 创建部署配置（如 `vercel.json`）
3. 执行部署命令
4. 更新文档（quickstart.md）记录部署信息

**本项目实践**：

```bash
npm install -g vercel
vercel --yes
# Production: https://react-internel-visualization.vercel.app
```

---

## 三、关键方法论

### 3.1 需求边界主动质疑

**原则**：不要假设需求是完整的，主动识别边界条件。

**实践**：

- 解析器支持范围？→ 仅 TSX/JSX 函数组件，仅内置 hooks
- 值节点策略？→ 所有非空值都生成独立节点
- 连线锚点位置？→ 必须从字段行发出，指向值节点头部

### 3.2 争议必报、决策必录

**原则**：遇到技术或需求争议时，不自行决定，上报用户。

**实践**：

```
Q: 连线是否需要智能路由绕开节点？
A: 尝试 smart-edge 失败，回退到 smoothstep + z-index，记录到 research.md
```

### 3.3 文档即代码

**原则**：文档和代码保持同步，文档是代码的"单一真相来源"。

**实践**：

- 修改了 hook 的 memoizedState 布局规则 → 同步更新 spec.md FR-007c
- 新增 updateQueue 对象 → 同步更新 data-model.md + contracts/graph-schema.md

### 3.4 渐进式交付

**原则**：按用户故事优先级分阶段交付，每个阶段都有可用的 MVP。

**实践**：

```
P1: 从组件代码生成对象关系图（核心功能）
P2: 错误处理与用户反馈（健壮性）
P3: 编辑输入并快速迭代对照（用户体验）
```

### 3.5 测试分层策略

**原则**：根据风险和复杂度选择合适的测试层级。

**实践**：

```
单元测试：stableId、parseCode、buildGraph、graphContract
组件测试：InternalsVizPage.generate、error、regenerate
集成测试：GraphCanvas.interaction（pan/zoom）
```

---

## 四、项目结构规范

### 4.1 Speckit 配置目录

```
.specify/
├── memory/
│   └── constitution.md    # 项目宪法
├── scripts/               # 脚本工具
└── templates/             # 文档模板
    ├── spec-template.md
    ├── plan-template.md
    └── tasks-template.md
```

### 4.2 规格文档目录

```
specs/[feature-name]/
├── spec.md               # 需求规格
├── plan.md               # 实现计划
├── research.md           # 技术决策
├── data-model.md         # 领域模型
├── quickstart.md         # 快速启动
├── tasks.md              # 任务列表
├── contracts/            # 内部契约
│   └── *.md
└── checklists/           # 检查清单
    └── requirements.md
```

### 4.3 源代码目录（本项目）

```
src/
├── features/
│   └── [feature-name]/
│       ├── ui/           # 页面组件
│       ├── components/   # UI 组件
│       ├── domain/       # 领域模型、布局
│       └── parser/       # 解析逻辑
└── App.tsx

tests/
├── unit/                 # 单元测试
└── component/            # 组件测试
```

---

## 五、常用命令速查

| 阶段 | 命令                      | 说明           |
| ---- | ------------------------- | -------------- |
| 宪法 | `/speckit.constitution`   | 初始化项目宪法 |
| 规格 | `/speckit.specify [需求]` | 生成需求规格   |
| 方案 | `/speckit.plan [技术栈]`  | 生成技术方案   |
| 任务 | `/speckit.tasks`          | 生成任务列表   |
| 实现 | `/speckit.implement`      | 开始代码实现   |

---

## 六、总结

SDD 的核心价值在于：**让"规格"成为开发过程的驱动力，而非事后补充的文档**。

通过 Speckit 工具链，我们实现了：

1. **需求可追溯**：每个功能都有对应的 FR 编号
2. **决策可回溯**：每个技术选型都有记录的理由
3. **交付可验证**：每个用户故事都有明确的验收标准
4. **知识可传承**：开发过程中的经验被文档化保留

**最终成果**：

- 🎯 项目功能完整交付
- 📚 文档与代码同步一致
- 🚀 成功部署到 Vercel 生产环境
- ✅ 22 个自动化测试全部通过

---

**版本**: 1.0.0 | **项目**: react-internel-visualization | **日期**: 2026-01-05
