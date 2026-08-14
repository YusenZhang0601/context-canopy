---
type: system/ontology
created: 2026-06-25
updated: 2026-07-19
tags:
  - system/ontology
---

# 本体

本体文件定义主图谱节点类型、关系类型和受控标签。主图谱只显示 `01-Knowledge`、`02-Insights`、`03-Personal`。

## Node Types

### knowledge

客观知识、可验证方法、技术概念、学术概念、项目经验、踩坑教训。

常见子类：`academic`、`technical`、`project-learning`、`operational-experience`、`lesson`。

### insight

偏价值判断、世界观、人生观、社会和职场理解、政治经济观察、哲学理念。

常见子类：`philosophy`、`society`、`workplace`、`politics-economics`、`principle`。

### personal

关于用户本人的事实、经历、关系、地点、身份、时间线、自我画像和偏好。

常见子类：`profile`、`person`、`relationship`、`timeline-event`、`place`、`self-model`。

## Lifecycle And Freshness

- `seed`：概念有保留价值，但来源、内容或关系尚未达到稳定门槛。
- `active`：内容会继续演化，当前结论已有足够证据。
- `stable`：定义、边界、来源和关系均已成熟。
- `deprecated`：已由其他 canonical 页面替代；完成合并后应移出主图谱归档。
- `freshness: timeless`：稳定历史事实、方法或定义，不依赖实时状态。
- `freshness: current`：`last_checked` 当日已由本地权威文件或官方来源核验。
- `freshness: stale`：只确认到明确历史时点，正文不得无日期地声称“当前”。
- `freshness: blocked`：已尝试核验但权威来源不可访问，缺口必须进入 LINT。

## Relation Sections

主图谱页面统一使用 `## 关系`，允许以下显式关系：

- `上位概念`
- `组成部分`
- `支撑`
- `反例或限制`
- `应用场景`
- `相关人物或偏好`

关键关系应双向维护；弱关系可作为正文自然链接保留。

## Source Link Sections

主图谱页面可使用 `## 来源双链` 把本地 Markdown 来源显式接入 Obsidian 图谱。

- `## 关系` 表达 canonical 页面之间的语义关系。
- `## 来源双链` 表达 canonical 页面到 `04-Sources` Markdown 原文的可追溯关系。
- PDF、URL 和系统文件路径仍保留在 `sources:` 与 `来源与置信度` 中，不强行渲染为图谱边。
- 来源层保持不可变；不向 raw 文件写回链接。

## Controlled Tags

### domain

- `domain/knowledge`
- `domain/insight`
- `domain/personal`

### status

- `status/seed`
- `status/active`
- `status/stable`
- `status/deprecated`

### source

- `source/manual`
- `source/project-docs`
- `source/web`
- `source/live-verification`
- `source/local-authority`
- `source/conversation`
- `source/rfc-standards`

### privacy

- `privacy/private`
- `privacy/sensitive`
- `privacy/shareable`

### current topic tags

- `topic/ai`
- `topic/ai-agent`
- `topic/anti-pattern`
- `topic/api`
- `topic/architecture`
- `topic/authentication`
- `topic/browser-automation`
- `topic/bug`
- `topic/claude-code`
- `topic/collaboration`
- `topic/communication`
- `topic/data`
- `topic/data-quality`
- `topic/dataset`
- `topic/debugging`
- `topic/docx`
- `topic/engineering`
- `topic/epistemology`
- `topic/experiment`
- `topic/feishu`
- `topic/filesystem`
- `topic/finance`
- `topic/geography`
- `topic/git`
- `topic/governance`
- `topic/incident`
- `topic/infrastructure`
- `topic/institution`
- `topic/knowledge-management`
- `topic/learning-system`
- `topic/llm-wiki`
- `topic/macos`
- `topic/market-structure`
- `topic/mcp`
- `topic/methodology`
- `topic/metrics`
- `topic/minutes`
- `topic/network`
- `topic/oauth`
- `topic/onboarding`
- `topic/operator`
- `topic/pattern`
- `topic/performance`
- `topic/personal-ai`
- `topic/philosophy`
- `topic/planning`
- `topic/playwright`
- `topic/plot`
- `topic/preference`
- `topic/presentation`
- `topic/principle`
- `topic/profile`
- `topic/project`
- `topic/project-ingest`
- `topic/project-review`
- `topic/protocol`
- `topic/proxy`
- `topic/python`
- `topic/quality`
- `topic/quant`
- `topic/relationship`
- `topic/research`
- `topic/second-brain`
- `topic/server`
- `topic/simulation`
- `topic/skills`
- `topic/source-coverage`
- `topic/source-inventory`
- `topic/ssh`
- `topic/taxonomy`
- `topic/testing`
- `topic/timeline`
- `topic/tooling`
- `topic/tools`
- `topic/validation`
- `topic/verification`
- `topic/workflow`
- `topic/workplace`
- `topic/writing`

## Boundary Rules

- 项目任务本身不进主图谱；项目中沉淀出的经验、方法、知识和可复用资产概览才进入主图谱。
- 日记原文不进主图谱；从日记中抽象出的稳定感悟进入 `02-Insights`。
- 人物联系方式、隐私和事实记录进入 `03-Personal`，并使用 `privacy/*` 标签。
- 小说角色和设定属于创作 raw 来源，不属于 `03-Personal/People`。
- 对社会或职场现象的判断进入 `02-Insights`，支撑它的技术材料或理论材料进入 `01-Knowledge`。
