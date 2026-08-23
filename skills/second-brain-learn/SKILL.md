---
name: second-brain-learn
description: "从当前 Agent 对话和工作轨迹中挖掘可长期保留的偏好、方法、Agent 角色事实、项目规则、知识与山脉进展；审计现有 owner，新增、纠错、缩限、替代、合并、迁移或退役规则，自动合并有证据的低风险变化，高风险变更先询问用户，并同步当前 Agent。用户说学习、记住、采纳或停止某种行为、修正规则、保存本次经验、从当前对话改进、运行 /learn，或要求未来 Agent 遵守某项教训时使用。"
metadata:
  display_name: "Second Brain - Learn（沉淀当前对话与工作经验）"
---

# Second Brain - Learn（沉淀当前对话与工作经验）

从当前对话里提炼可复用的“油”，由当前 Agent 自己完成证据审计、owner 路由、写入和验证。SkillOpt 只提供“从历史工作中学习并迭代”的理念，不运行或依赖 SkillOpt/Sleep 的程序、API、评分数据库或自动优化器。

## 显式调用

- Codex：`$second-brain-learn`，或从 `/skills` 选择。历史 `/learn` 入口应薄重定向到本 Skill。
- Claude、Hermes、AntiGravity：`/second-brain-learn`。

## 范围

默认只审计当前父对话及其直接工作证据。不要自行扩展为全历史扫描；历史批量榨取使用 `second-brain-distill`。

可学习对象包括：

- 用户明确表达的跨 Agent 偏好。
- 当前 Agent 独有角色、分工或宿主限制。
- 可复用的 Skill 流程或现有 Skill 改进。
- 项目局部规则、失败教训、验收标准及其实际自动注入入口。
- 可成为 canonical 的知识、洞见或个人事实。
- 对某座山的证据、阻点、路线变化和下一信息动作。

闲聊、一次性措辞、秘密值、模型自我评价、无证据人格推断、工具噪声和已被 owner 覆盖的重复内容不沉淀。

## Authority 路由

- 跨 Agent 稳定规则 → `90-System/Personal-AI/COMMON-RULES.md`
- 当前 Agent 的独特角色 → `90-System/Personal-AI/AGENTS/<agent-id>.md`
- 标准化执行流程 → 对应 `90-System/Personal-AI/SKILLS/<skill-id>/SKILL.md`
- 项目局部约束 → 项目唯一 authority；若 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md` 等是实际自动注入入口或受管投影，必须按项目合同同步它们，不能只写 Second Brain 卡片或自然语言指针
- 客观知识/洞见/个人事实 → Vault 对应 canonical owner
- 长期方向进度 → `03-Personal/Profile/长期方向与山脉.md` 或具体 mountain 页面
- 无持久价值或已覆盖 → `no-op`

宿主记忆和自动摘要只可作为待核验证据，不是 owner。

## 学习流程

### 1. 建立证据账本

按对话顺序复核：用户要求、Agent 行动、工具证据、用户纠正、最终结果、尚未解决项。对每个候选记录：

- 可检索来源位置或消息摘要。
- 候选主张，不超过一个稳定主题。
- 适用范围和目标 owner。
- `explicit`、`supported inference`、`assumption` 或 `unknown`。
- 风险级别、新颖性和是否与现有 owner 冲突。
- 相对旧规则的转换类型、旧/新预期行为，以及需要进入或退出的注入面。

不要只读最终回答；真正有价值的学习常在用户纠正、失败原因和验证差异中。

### 2. 查重、反证与状态转换

先读 INDEX、相关 canonical、COMMON-RULES、当前 Agent profile 和相关 Skills。检查文件名、H1、alias、核心主张与现有规则，优先更新唯一 owner。主动寻找：

- 这是不是已有规则的具体例子，而不是新规则？
- 用户后来是否撤销或缩小了先前要求？
- 成功来自哪一步，还是只是时间相关？
- 失败教训是否只适用于当前项目或宿主？

每个候选必须且只能裁决为一种主要转换：`add`、`reinforce/no-op`、`correct`、`narrow`、`broaden`、`replace`、`merge`、`relocate` 或 `retire`。判断依据是证据强度、authority、适用范围和反例，不是“新消息天然更真”。若新结论修正旧规则，必须指出旧规则位置、仍保留的有效部分、退出活动注入链的部分和历史证据去向。

把相关活动 owner 作为一个整体审计：删除语义重复，合并可由一条更精确规则表达的内容，把细节迁回项目或 Skill，退役已失效正文。除非宿主或项目有可验证硬限制，不设任意行数或字节上限；目标是当前有效性与信息密度，不是只增不减或机械压缩。

### 3. 风险分级与批准

可自动合并的低风险学习：

- 用户当前明确陈述、适用范围清楚的格式或协作偏好。
- 有两处独立工作证据支持、且不涉及权限的稳定方法偏好。
- 现有 owner 的去重、勘误、精确化或验证状态更新。
- 有更强证据支持、范围明确且不改变高风险边界的旧规则缩限、替代、迁移或退役。
- 当前 Agent profile 的已验证宿主事实。
- mountain 的新证据、普通 checkpoint 或已执行工作链接，但不改变 summit。

必须先问用户的高风险学习：

- 权限、安全、隐私、外部写入、自动删除或凭据处理。
- 核心身份、价值观、关系定义或把 Agent-specific 规则升级为 common。
- mountain summit、重大 active bet 或角色职责的实质重写。
- 来源矛盾、分类不清或可能覆盖用户现有手写规则。
- 规则扩域、撤销仍有独特价值的长期资产，或无法证明新证据强于旧规则。

低风险推断可以自动进入 owner，但必须保留证据和推断标签；不能把推断写成用户原话。

### 4. 原子写入

1. 检查 capture lock 与 compiler 基线。
2. 每个候选只写入最窄 owner；项目规则先改唯一 owner，再更新项目实际自动注入面或既有投影。不要用一张“本次对话总结”大卡承载多个主题。
3. canonical 变化遵守来源、关系、reciprocal、freshness、privacy、原子性登记和 LOG 顺序。
4. 规则或 Skill 变化以当前有效状态重写 owner：同步移除被替代、迁移或退役的活动正文；变更依据和历史保留在 Git、LOG、receipt 或不可变来源，不把 tombstone 堆进活动文件。
5. 所有 authority 变化先经本地短任务分支、秘密扫描与门禁；`private-remote` 再通过已验证为 private 的 `origin` PR 汇合，`local-only` 只保留本地 commit 与可恢复备份，禁止 push 到公开 Release remote。

### 5. 反向同步

写入完成后立即执行 `second-brain-sync` 的必要部分：更新当前宿主的 common/profile 短投影、Skill 副本哈希和 receipt。若本次学习改变项目级规则，还要按项目合同更新当前范围内实际注入的项目入口。其他 Agent 下次同步时从相同 owner 获取变化，不需要当前 Agent 逐台修改。

反向同步是 Learn 的完成门禁，不是可选收尾：

- 宿主投影必须包含当前 common/profile 的可执行短摘要与 SHA；只有 owner 路径指针不算已注入。
- 宿主使用物理 Skill 副本时必须核对全部七个 authority 哈希，不能只更新本次直接调用的 Skill。
- 必须在全新宿主会话验证新增或修正规则能被触发；当前会话自述、旧 receipt、文件存在或 MCP 可读都不能替代。
- 对 `correct`、`narrow`、`replace`、`merge`、`relocate` 或 `retire`，必须使用配对场景证明新行为生效，并证明旧行为不再被活动规则选中；只做正向复述不算完成。
- 任一反向同步门禁未完成时，结果必须标记为 `degraded`、`blocked` 或“等待新会话验收”，不得写成 `completed` 或“已学习”。

### 6. 验证

运行所有受影响门禁，并在全新会话检查新增规则能被正确触发。发生规则转换时，同时检查旧行为已经退出；项目级规则从对应项目 cwd 启动 fresh session，不能用全局会话代替。若只形成高风险候选而用户未批准，完成状态是“等待裁决”，不是“已学习”。

## 输出格式

按以下顺序报告：

1. 已自动采纳的学习：证据、owner、风险。
2. 已更新但仍标为推断的内容。
3. 等待用户裁决的高风险候选。
4. 被纠错、缩限、替代、合并、迁移、退役、去重或拒绝的旧内容及原因。
5. Git/门禁、正向新行为、负向旧行为退出证据与一个确切下一步。

没有新知识时返回证据支持的 `no-op`；不要为了证明 Skill 有用而制造规则。
