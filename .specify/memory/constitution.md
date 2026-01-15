<!--
Sync Impact Report
- Version change: N/A (template placeholders) → 1.0.0
- Modified principles: N/A (template placeholders) → I~V（TypeScript/代码质量/测试/UX/性能）
- Added sections: 工程与质量门禁, 开发流程与协作约定
- Removed sections: None
- Templates requiring updates:
  - ✅ .specify/templates/tasks-template.md（测试从“可选”调整为“默认必需，可豁免”）
  - ✅ .specify/templates/plan-template.md（补充 Constitution Check 建议门禁）
  - ⚠ pending: None
- Follow-up TODOs:
  - TODO(RATIFICATION_DATE): 未知首次通过日期，建议在首次合并该文件的 PR 日期后补齐
-->

# react-internel-visualization Constitution

## Core Principles

### I. TypeScript 与架构边界（面向可视化）

- 必须用 TypeScript 明确表达领域模型与数据流：关键数据结构必须有明确类型（禁止随手 `any`）。
- 组件边界必须清晰：UI 展示、数据获取/转换、渲染计算分层；重计算逻辑必须可抽成纯函数（便于测试与性能优化）。
- 状态管理必须最小化：优先局部 state + props；跨组件共享状态必须有单一来源与清晰生命周期。
- 错误处理不可缺省：网络/解析/渲染错误必须有可见 UI 兜底（含重试/提示），禁止静默失败。

### II. 代码质量与一致性（最小改动 + 可读性优先）

- 所有变更必须遵守最小改动原则：不引入无关重构；如需重构必须单独提交并说明收益/风险。
- 代码必须可读且可维护：命名准确、逻辑可追踪、避免过度抽象；复杂逻辑必须写清楚“为什么这样做”。
- 一致性门禁：必须通过 TypeScript 类型检查与 lint/format 规则（工具与配置以仓库为准）。
- 依赖管理克制：新增依赖必须说明必要性、替代方案与体积/维护成本影响；可视化重依赖需优先考虑按需加载/拆包。

### III. 测试标准（NON-NEGOTIABLE）

- 任何对业务逻辑、数据转换、渲染计算、交互行为的改动，必须同时提供可自动化运行的测试用例。
- 测试分层要求：
  - 单元测试：纯函数/数据转换/布局计算等逻辑必须覆盖关键分支与边界条件。
  - 组件测试：关键交互（筛选、缩放、hover 提示、选择等）必须覆盖至少“主路径 + 1 个空/错态”。
  - 端到端测试：仅对关键用户旅程或高风险回归点引入，避免把所有细节都堆到 E2E。
- 允许豁免测试的唯一情况：变更完全是文案/样式且不影响交互与逻辑；必须在 PR/任务中写明豁免理由与验证方式。

### IV. 用户体验与可访问性（可视化默认高标准）

- 必须覆盖完整状态：加载中、空数据、错误态、部分失败（例如某条 series 失败）都必须有清晰反馈。
- 交互必须可预测：响应及时、操作可撤销/可重试；对危险操作必须二次确认或提供撤销。
- 可访问性为默认要求：键盘可操作、焦点可见、合适的 ARIA 标注；支持系统“减少动态效果”（reduced motion）。
- 视觉稳定性：避免不必要的布局抖动；优先使用骨架/占位降低 CLS 风险。

### V. 性能与可观测性（为 60fps 交互负责）

- 性能目标：可视化交互（缩放/拖拽/hover）必须以流畅为最高优先级之一；避免主线程长任务与无意义重渲染。
- 性能实践要求：
  - 大数据量渲染必须考虑虚拟化/抽样/分层绘制；重计算必须 memoize 或预计算。
  - 渲染行为必须可解释：避免隐式全局状态导致的级联重渲染；必要时用 React Profiler 定位。
  - 资源体积与加载：重型模块必须支持懒加载/按需加载；静态资源必须有压缩策略。
- 可观测性：关键交互与错误必须可定位（开发/测试环境可复现并可记录）；线上错误需有统一收集策略（工具选型由项目决策）。

## 工程与质量门禁

- 工程基线（基于 rsbuild React+TS 模板）：
  - 必须保持 TypeScript 严格类型检查能力（具体配置以仓库为准）。
  - 必须具备统一的 lint/format 与 typecheck 命令，并在 CI/预提交阶段执行。
  - 必须具备测试命令并可在无交互环境运行；测试失败必须阻断合并。
- 目录与分层建议（不强制，但作为评审基准）：
  - `src/` 下按 `components/`、`hooks/`、`services/`、`utils/`、`types/` 等分层，避免循环依赖。
  - 可视化计算逻辑优先下沉到可测试模块（例如 `src/utils/` 或 `src/lib/`），避免散落在组件内部。
- 文档要求：任何新增的“使用方式/约束/边界”必须同步更新 README 或 specs 文档。

## 开发流程与协作约定

- 需求与实现必须可追踪：每个变更必须能对应到 spec/任务/issue 描述。
- 交付方式：优先小步可回滚；功能尽量按“用户旅程切片”落地，避免一次性大改。
- 评审口径：评审必须检查——类型与 lint 门禁、测试是否齐全或豁免理由、UX 状态是否完整、性能风险是否被识别并有缓解措施。

## Governance

<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

- 本宪法高于日常习惯与口头约定；任何与本宪法冲突的做法必须以宪法为准。
- 修订流程：
  - 任何人可提出修订 PR；PR 必须包含：变更动机、影响面、迁移/落地方式（若涉及门禁变化）。
  - 修订合并后必须同步更新所有受影响的 `.specify/templates/*` 与相关文档，并在本文件顶部更新 Sync Impact Report。
- 版本策略（SemVer）：
  - MAJOR：移除/重定义核心原则或引入不向后兼容的门禁。
  - MINOR：新增原则/新增强制门禁或显著扩展约束。
  - PATCH：措辞澄清、示例补充、无语义变更的小修。
- 合规检查：所有 spec/plan/tasks 在生成或评审时都必须显式对照本宪法的“测试、UX、性能、代码质量”要求。
<!-- Example: All PRs/reviews must verify compliance; Complexity must be justified; Use README.md or specs docs for runtime guidance -->

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-01-04

<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->
