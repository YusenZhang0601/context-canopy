---
name: second-brain-climb
description: "为一个长期方向维护深入、由证据支撑的‘爬山’模型，包括山顶、当前位置、差距、路线、约束、阻点、证据、不确定性、下一信息行动、当前押注、决策标准、检查点、反思和真实工作链接。用户讨论长期追求、人生方向、山、山顶、战略、路线选择、进展停滞、继续还是转向，或要求更新个人 AI 基底中的山脉时使用。"
metadata:
  display_name: "Second Brain - Climb（维护长期方向与爬山状态）"
---

# Second Brain - Climb（维护长期方向与爬山状态）

让长期方向成为持续可导航的山，而不是口号、任务清单或静态愿望。当前 Agent 负责基于实际工作证据维护 mountain 页面；不建立目标数据库、常驻追踪器、统一评分器或标准角色库。

## 显式调用

- Codex：`$second-brain-climb`，或从 `/skills` 选择。
- Claude、Hermes、AntiGravity：`/second-brain-climb`。

## Authority

- 山脉总览：`03-Personal/Profile/长期方向与山脉.md`
- 单座山：`03-Personal/Mountains/<山名>.md`
- 读取可优先使用 MCP `get_mountain_context`。
- 实际工作状态仍由各项目自己的 authority 拥有；mountain 只链接和解释，不复制项目状态。

一座山表达一个长期方向。角色分工写入 Agent profile，不把 Agent 当成山；短期项目也不必都升级为山。

## 证据层级

清楚区分：

- `verified`：有当前项目产物、用户明确陈述、真实结果或可重放验证。
- `supported inference`：证据支持但仍需判断。
- `assumption`：暂为行动所需，列出替换或敏感性计划。
- `unknown`：信息不足，不虚构精确状态。

山的“当前位置”不是情绪估计，也不是完成百分比；它由已经具备的能力、资产、验证和可见阻点组成。

## 深度 mountain 模型

每次维护都逐项检查，允许没有变化，但不得跳过未审计项：

### 1. Summit

定义最终想抵达的可识别状态：为谁服务、具备什么持续能力、保持哪些边界、什么证据表示“真的到了”。Summit 是方向，不是固定实现或某个厂商产品。

修改 summit 会改变长期身份和资源取舍，属于高风险；无论推断多合理，都先向用户展示旧/新差异、原因和后果并取得确认。

### 2. Current position

列出当前真实资产、已验证能力、尚未验证能力和最近证据日期。链接实际项目、commit、报告、对话学习或外部结果。

### 3. Gap

说明 summit 与 current 之间缺少的能力、信息、信誉、基础设施、习惯或资源。避免把“任务未完成”误写成根本差距。

### 4. Candidate routes

维护至少一个主路线和有证据时的替代路线。每条路线写清机制、依赖、可逆性、成本、反馈速度和最早可证伪点；不要为了形式凑路线。

### 5. Constraints

记录真实硬约束与软偏好，例如时间、资金、隐私、本地优先、供应商独立、设备可用性和维护负担。标明来源及是否仍有效。

### 6. Blockers

阻点是当前不能前进的具体因果条件，不是“还没做”。区分外部阻点、知识阻点、决策阻点和执行阻点，并写出解除它所需证据。

### 7. Evidence

把支持或反驳路线的观察连到真实工作。证据既包括成功，也包括失败、用户纠正和未达到的验收标准。历史管理标签只作辅助，不替代事实。

### 8. Uncertainty

列出会改变路线选择的关键未知、置信度和影响范围。不要把所有不确定性都变成任务；优先处理决策价值高的未知。

### 9. Next information action

指定一个最小动作，用最少成本减少最关键未知。它应写清：要观察什么、结果 A/B 分别意味着什么、何时停止。单纯“继续研究”不合格。

### 10. Active bet

明确当前正在押注的路线、为何此刻值得押、投入上限、预期反馈时间和失败信号。一次只保留少量真实 active bets，避免把愿望清单都标为进行中。

### 11. Switch criteria

写明哪些可观测证据触发切换路线，以及切换到哪条候选路线。不要因一次挫折就切换，也不要因沉没成本永远坚持。

### 12. Pause criteria

写明资源冲突、外部依赖或信息不足到何种程度应暂缓；暂停时保留恢复条件和最小维护动作。

### 13. Abandon criteria

写明什么证据说明 summit 本身不再值得、不可行或与更高优先级方向冲突。达到条件仍属于高风险决策，只提出并请求用户确认，不自动放弃。

### 14. Checkpoints and reflection

checkpoint 记录“发生了什么、什么预期被验证/反驳、对路线意味着什么、下一信息动作”。reflection 审计判断质量，不用励志措辞遮盖停滞。保留日期和来源，但不复制完整项目日志。

### 15. Link to work

每个 active bet 和 next information action 都链接到一个真实项目、任务或证据 owner。工作完成后，由 `second-brain-learn` 或本 Skill 把结果反向写回山；山不替代项目任务系统。

## 更新流程

1. 识别目标山；不存在时先检查是否真是长期方向，再按 Vault schema 创建唯一 owner 和 reciprocal 关系。任何写入前完整读取 Vault 根 `AGENTS.md`，检查 `90-System/.capture.lock`，并运行只读 compiler 基线；锁存在或基线有未理解错误时停止。
2. 读取山脉总览、单山、关联项目状态、最近工作证据和上次 checkpoint。
3. 用上述十五项做差异审计，标出证据、新推断、假设和未知。
4. 普通证据、current、blocker、checkpoint、reflection 和工作链接的低风险更新可自动合并。
5. summit、重大身份含义、放弃决定或跨山资源重分配先请求用户确认。
6. 更新单山与必要 reciprocal，不把多个方向混进一张卡。
7. 运行 Vault 原子性、关系、freshness、privacy、compiler、lint 和图谱门禁。
8. authority 变化先通过本地短任务分支与门禁；`private-remote` 再经私有 `origin` PR 汇合，`local-only` 保留本地 commit 与备份，并在当前 Agent 中同步必要投影。

## 输出

先给一句“山现在在哪里”。随后只突出：本次新证据、路线含义、当前 active bet、最大不确定性、next information action 及其判定结果、触发中的 switch/pause/abandon 条件、需要用户确认的 summit/重大决策。附 owner、authority 模式、本地 commit、适用时的私有 PR 和门禁证据。
