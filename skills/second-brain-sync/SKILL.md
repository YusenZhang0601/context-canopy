---
name: second-brain-sync
description: "在权威 Second Brain 与某个 Agent 的本地指令表面之间，同步可长期保留的通用个人规则和该 Agent 的独立角色配置；local-only 保留本地可恢复历史，private-remote 通过私有 GitHub PR 汇合 authority。用户要求同步、刷新、对齐、传播、拉取偏好、比较 Agent 规则，或修复 Codex、Claude、AntiGravity、Hermes 及其他已接入 Agent 的漂移时使用。"
metadata:
  display_name: "Second Brain - Sync（同步通用规则与 Agent 配置）"
---

# Second Brain - Sync（同步通用规则与 Agent 配置）

让当前 Agent 自己完成双向审计与受控同步。不要创建常驻同步服务、数据库、规则编译器或外部推理 API。

## 显式调用

- Codex：`$second-brain-sync`，或从 `/skills` 选择。
- Claude、Hermes、AntiGravity：`/second-brain-sync`。

## 两类 owner

- `90-System/Personal-AI/COMMON-RULES.md` 只拥有真正跨 Agent 的稳定规则。
- `90-System/Personal-AI/AGENTS/<agent-id>.md` 只拥有该 Agent 的角色、分工、能力边界和宿主差异。

不要建立标准角色库。两个表面相似的 Agent 可以保留完全不同的 profile。宿主全局规则文件只是这两个 owner 的短投影；自动记忆、会话摘要和本地 cache 不是 authority。

## 同步方向

一次同步同时检查两个方向：

1. **Agent → Second Brain**：识别当前宿主里尚未沉淀的稳定偏好、角色事实与冲突。
2. **Second Brain → Agent**：把当前 common 与本 Agent profile 的最新短投影更新到宿主。

不要扫描所有 Agent 的本地配置。跨 Agent 同步通过 Vault 中的 profile 页面完成：当前 Agent 读取所有已登记 profile 只为发现通用候选和冲突，但只修改自己的宿主投影。

## 工作流

### 1. 建立基线

1. 读取 Vault 根 `AGENTS.md`、COMMON-RULES、当前 Agent profile 和现有宿主管理块。
2. 检查 `90-System/.capture.lock`、Vault compiler 基线、Git 状态、authority 模式与授权账号；公开 Release remote 不得成为个人 authority 的 push target。
3. 记录各表面的 SHA-256；不要输出规则文件中的秘密。

### 2. 形成候选

逐项给候选标注：

- `common`：任何已接入 Agent 都应遵守。
- `agent-specific`：只属于当前 Agent 的定位、能力或宿主约束。
- `project-local`：应留在项目 AGENTS/CLAUDE 等局部规则。
- `skill-workflow`：应进入某个 Second Brain Skill，而非身份规则。
- `cache-only`：短期上下文，不应沉淀。
- `conflict`：与现有 owner 或高优先级规则冲突。

每个候选保留来源位置、原文或可核验摘要、风险级别和目标 owner。

### 3. 风险裁决

以下低风险项目可自动合并：

- 用户在当前或可追溯对话中明确表达的稳定输出偏好。
- 对既有规则的去重、错别字修复和不改变含义的压缩。
- 已有 profile 的版本、安装方式或验证状态更新。
- 多个 Agent profile 中直接一致、且不涉及权限的通用偏好。

以下高风险项目先询问用户：

- 权限、隐私、安全、自动外部写入或数据删除边界。
- 核心身份、价值观、长期方向 summit 或 Agent 职责重新划分。
- 证据互相矛盾，无法判断哪个规则仍有效。
- 将 Agent-specific 规则提升为全局 common。
- 会覆盖用户手写且不在 Second Brain 管理块内的规则。

不确定但低影响的推断可以保留为带证据和复核日期的候选，不得伪装成用户明确偏好。

### 4. 修改 authority

1. 先更新 COMMON-RULES 或当前 Agent profile 的唯一 owner；不要直接从一个宿主复制到另一个宿主。
2. 保留 Agent profile 的叙事性和独特定位，不按统一字段把角色削平成模板。
3. 更新来源、时间和变更说明。若涉及 Vault canonical，遵守完整 capture/原子性/关系门禁。
4. 所有 authority 变化先使用本地短任务分支、精确 diff、秘密扫描和门禁；`private-remote` 再经已验证为 private 的 `origin` PR 汇合，`local-only` 只保留本地 commit 与备份，不做远端写入。

### 5. 更新当前宿主投影

只重写 Second Brain 管理块，使其包含：

- owner 路径或 MCP 读取方式。
- COMMON-RULES 的当前摘要与 SHA。
- 当前 Agent profile 的角色摘要与 SHA。
- 本宿主 Skill 显式触发方式。
- “宿主记忆不是 authority”与委派传播要求。

保留管理块外内容。宿主只支持物理 Skill 副本时，按 authority 哈希补齐七个副本并记录漂移。

### 6. 验证与汇合

1. 运行 Vault compiler、lint 和图谱门禁。
2. 验证七个 Skill 可发现、MCP 连通、管理块哈希与 owner 一致。
3. 在全新宿主会话调用 `second-brain-doctor`。
4. `private-remote` 在 PR 合并后更新本地 main；`local-only` 在本地合并或快进已验收分支。两种模式都确认工作树不含意外文件。

## 冲突合并原则

Git 的文本 merge 只负责保留双方变更；当前 Agent 必须语义审查同一条规则是否重复、冲突或被错误分类。不要因为 Git 自动合并成功就宣布知识同步成功。冲突解决保留双方证据，并在高风险时交给用户裁决。

## 输出

报告：common 变更、当前 profile 变更、宿主投影变更、authority 模式、自动合并的低风险项、等待用户裁决的高风险项、本地 commit、适用时的私有 PR 与 fresh-session 验证。没有变更时明确报告 `no-op`，不要制造一次空同步。
