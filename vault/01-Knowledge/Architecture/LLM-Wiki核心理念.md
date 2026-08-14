---
type: knowledge
created: 2026-08-14
updated: 2026-08-14
status: stable
summary: 将原始资料持续编译为结构化 Markdown Wiki，替代传统临时 RAG 检索。
confidence: high
aliases:
  - LLM-Wiki架构
freshness: timeless
last_checked: 2026-08-14
sources:
  - 04-Sources/Knowledge/LLM-Wiki-Architecture-Guide.md
  - https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
tags:
  - domain/knowledge
  - status/stable
  - source/local-authority
  - source/web
  - topic/knowledge-management
  - topic/llm-wiki
---

# LLM-Wiki核心理念

## 核心摘要

LLM-Wiki 理念源自对传统 RAG 局限性的反思。与其每次临时检索切片碎片，不如让 Agent 作为“数字园丁”，持续将原始资料（Sources）消化、提炼并编译为结构清晰、具备双向语义链接的静态 Markdown 知识图谱。

## 核心机制

1. **证据与主张分离**：不可变来源层存放原始字节；主图谱层存放由 Agent 综合提炼的原子卡片。
2. **确定性编译与治理**：采用自动化脚本对知识图谱进行连通性审计、哈希校验与派生索引重编。
3. **人类与 Agent 共建**：人类专注于高价值决策与战略方向，Agent 负责繁琐的关系维护与图谱审计。

## 关系

- **上位概念**：[[个人AI基底架构]]
- **支撑**：[[原子化知识构建原则]]
- **应用场景**：[[跨Agent协作规范]]

## 来源双链

- [[04-Sources/Knowledge/LLM-Wiki-Architecture-Guide.md|LLM Wiki 架构指南]]

## 更新记录

- 2026-08-14：建立 LLM Wiki 核心理念节点。
