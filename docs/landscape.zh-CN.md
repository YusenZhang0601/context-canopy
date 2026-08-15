# ContextCanopy 对标项目研究

最后复核：2026-08-15

这是一张定位地图，不是在声称 ContextCanopy 发明了 Agent Memory 或可迁移性。下面这些项目在不同层面解决相邻问题。链接只指向项目的一手来源；本文刻意不记录容易过时的 star 数。

## 最接近的对标

| 项目 | 核心重心 | 实质重叠 | ContextCanopy 的不同押注 |
|---|---|---|---|
| [Basic Memory](https://github.com/basicmachines-co/basic-memory) | 通过 MCP 暴露本地 Markdown 知识图谱 | 人类可读文件、知识关系、多 AI 客户端 | 迁移完整的受治理个人 AI 上下文：共同规则、独立 Agent 角色、长期方向、Skills、证据与新鲜度 |
| [AgentCairn](https://github.com/ccf/agentcairn) | 多个 coding Agent 共享的 Git-backed Memory | 跨 Agent 召回、本地所有权、宿主接入与迁移 | 不只覆盖 coding Memory，还维护个人连续性、canonical owner 与独立不可变证据层 |
| [Memorix](https://github.com/AVIDS2/memorix) | 通过 MCP 共享 coding Agent Memory | 跨工具项目记忆与 Agent 交接 | 把用户身份和个人上下文作为一等对象，同时保留 Agent 独立角色合同 |
| [Dory](https://github.com/deeflect/dory) | AI coding 工作流的持久 Memory | 跨会话、跨工具的长期召回 | 目标是受证据治理的个人基底，而不只是 coding Memory 服务 |
| [EIDARA](https://github.com/jrotllant/eidara) | 面向 Agent 的 Markdown Memory | 明文所有权与结构化 Memory | 事务 capture、可编译图谱治理、宿主投影，以及明确的隐私与 authority 边界 |
| [Agent Memory Protocol](https://github.com/agentmemoryprotocol/agentmemoryprotocol) | Agent Memory 的拟议交换协议 | 把可迁移性视为生态问题 | ContextCanopy 是今天可运行的本地个人上下文系统；未来协议适配器可以补充它，而不是取代它 |

如果只问“coding Agent 的记忆能不能互相迁移”，AgentCairn 是当前最接近的对标。ContextCanopy 的押注更宽：真正需要迁移的不只是被召回的项目事实，还包括这个人的受治理上下文、证据、长期方向、共同规则，以及让不同 Agent 保持差异的边界。

## 相邻的 Memory 基础设施

| 项目 | 值得借鉴之处 | 为什么产品中心不同 |
|---|---|---|
| [Mem0](https://github.com/mem0ai/mem0) | 应用 Memory API 与抽取、检索管线 | 它主要优化应用 Memory 基础设施；ContextCanopy 的 authority 是用户可读的个人仓库 |
| [Graphiti](https://github.com/getzep/graphiti) | 时序知识图谱与变化事实 | 它聚焦图检索基础设施；ContextCanopy 还治理来源、角色、Skills 与个人连续性 |
| [Letta](https://github.com/letta-ai/letta) | 带托管 Memory 的长期 stateful Agent | 它维护某个 Agent 的状态；ContextCanopy 设计上要能经历 Agent 本身被替换 |

这些系统未来可能成为可选检索层或运行时邻居，但 ContextCanopy 的 Markdown authority 应保持 canonical，任何生成索引都必须可删除、可重建。

## 相邻的个人知识系统

- [LifeOS](https://github.com/danielmiessler/LifeOS) 展示了“可由 AI 操作的人生系统”这一雄心。ContextCanopy 借鉴个人上下文的广度，但产品中心是迁移、证据与 Agent 独立角色，而不是生活规划界面。
- [Andrej Karpathy 的 LLM Wiki 构想](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)强调维护紧凑、模型可读的知识。ContextCanopy 进一步加入来源、唯一 owner、新鲜度、图谱检查、事务写入与宿主投影。
- Stanford 的 [Portable Memory for AI Agents](https://digitaleconomy.stanford.edu/project/portable-memory/)把可迁移 Memory 放在用户选择与市场竞争的框架中。ContextCanopy 是个人上下文层的一项开源实现实验，并不声称已经实现通用标准。

## 一句话定位

**ContextCanopy 是一份本地优先、用户自有的“上下文护照”：让彼此独立的 AI Agent 认识同一个人，而不必变成同一个 Agent。**

## 什么时候需要重做这张地图

出现以下变化时应重新复核：

- 相邻项目开始同时治理个人身份、来源链与 Agent 独立角色；
- ContextCanopy 发布真实的厂商原生导入适配器；
- 某项交换协议稳定到足以实现；
- 全新宿主兼容性证据实质改变支持范围。

在此之前，不得宣称通用导入、自动迁移封闭厂商 Memory，或“全领域唯一”。
