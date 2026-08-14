---
type: insight
created: 2026-08-14
updated: 2026-08-14
status: active
summary: 统一通用个人规则与保留 Agent 宿主独特优势相协调的多 Agent 协作准则。
confidence: high
aliases:
  - Multi-Agent协作准则
freshness: timeless
last_checked: 2026-08-14
sources:
  - 04-Sources/Personal/Personal-AI-Onboarding-Specification.md
tags:
  - domain/insight
  - status/active
  - source/manual
  - topic/collaboration
  - topic/ai-agent
---

# 跨Agent协作规范

## 核心摘要

在多 Agent 协同工作流中，核心在于平衡“共同的我（用户画像与全局偏好）”与“各自的自己（Agent 宿主特色与角色定位）”。通过统一的规范将全局约束下沉到各 Agent，同时充分发挥各 Agent 在 IDE、CLI、长文本或规划上的特有优势。

## 协作准则

1. **统一规则唯一源**：全局行为与硬性约束仅由 `COMMON-RULES.md` 持有，各 Agent 不创建竞争性全局规则。
2. **角色分工清晰**：IDE 操作依赖可视化 Agent，终端批量构建依赖 CLI Agent，长篇洞察依赖分析型 Agent。
3. **上下文按需下沉**：委派子 Agent 时仅传递当前子任务所需的必要约束与事实，防止上下文污染。

## 关系

- **支撑**：[[个人AI协作体系]]
- **应用场景**：[[个人AI基底]]
- **反例或限制**：[[个人AI基底架构]]

## 来源双链

- [[04-Sources/Personal/Personal-AI-Onboarding-Specification.md|个人 AI 接入与配置规范]]

## 更新记录

- 2026-08-14：建立跨 Agent 协作规范认知。
