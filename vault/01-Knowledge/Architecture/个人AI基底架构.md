---
type: knowledge
created: 2026-08-14
updated: 2026-08-14
status: stable
summary: 跨 Agent、跨宿主、由用户完全自主掌控的本地个人 AI 基础设施架构规范。
confidence: high
aliases:
  - 个人AI基底体系
freshness: timeless
last_checked: 2026-08-14
sources:
  - 04-Sources/Knowledge/LLM-Wiki-Architecture-Guide.md
  - 04-Sources/README.md
tags:
  - domain/knowledge
  - status/stable
  - source/local-authority
  - topic/architecture
  - topic/second-brain
---

# 个人AI基底架构

## 核心摘要

个人 AI 基底（Personal AI Substrate）是一套解耦特定厂商与宿主模型的本地个人知识基础设施。它将长期知识、工程经验、个人偏好与战略方向持久化为标准 Markdown Wiki，通过统一 Model Context Protocol (MCP) 接口与规范 Multi-Agent Skills 赋能所有协作 Agent。

## 架构特征

1. **厂商中立**：所有长期知识保存在本地 Markdown 文件中，不依赖特定 AI 厂商的专有格式。
2. **单一可信源**：每个稳定概念拥有唯一的 Canonical Note 作为 Owner，杜绝信息碎片化与同义冲突。
3. **闭环双向网络**：通过严格的编译器与关系校验，保证知识节点的高内聚与可检索性。

## 关系

- **组成部分**：[[LLM-Wiki核心理念]]、[[原子化知识构建原则]]
- **支撑**：[[个人AI基底]]
- **应用场景**：[[跨Agent协作规范]]

## 来源双链

- [[04-Sources/Knowledge/LLM-Wiki-Architecture-Guide.md|LLM Wiki 架构指南]]
- [[04-Sources/README.md|来源层目录与边界说明]]

## 更新记录

- 2026-08-14：初始化个人 AI 基底架构核心规范。
- 2026-08-14：将稳定架构原则标为 timeless，并把 Release 来源层说明纳入实现证据，避免公开种子依赖任意到期日。
