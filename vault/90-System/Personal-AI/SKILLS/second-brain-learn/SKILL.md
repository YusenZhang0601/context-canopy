---
name: second-brain-learn
description: "从当前 Agent 对话和工作轨迹中挖掘可长期保留的偏好、可复用方法、Agent 专属角色事实、项目规则、知识与山脉进展；与现有 owner 查重，自动合并有证据的低风险学习，高风险变更先询问用户，并同步当前 Agent。用户说学习、记住、采纳这种行为、保存本次经验、从当前对话改进、运行 /learn，或要求未来 Agent 遵守某项教训时使用。"
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
- 项目局部规则、失败教训与验收标准。
- 可成为 canonical 的知识、洞见或个人事实。
- 对某座山的证据、阻点、路线变化和下一信息动作。

闲聊、一次性措辞、秘密值、模型自我评价、无证据人格推断、工具噪声和已被 owner 覆盖的重复内容不沉淀。

## Authority 路由

- 跨 Agent 稳定规则 → `90-System/Personal-AI/COMMON-RULES.md`
- 当前 Agent 的独特角色 → `90-System/Personal-AI/AGENTS/<agent-id>.md`
- 标准化执行流程 → 对应 `90-System/Personal-AI/SKILLS/<skill-id>/SKILL.md`
- 项目局部约束 → 项目的 AGENTS/authority 文件
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

不要只读最终回答；真正有价值的学习常在用户纠正、失败原因和验证差异中。

### 2. 查重与反证

先读 INDEX、相关 canonical、COMMON-RULES、当前 Agent profile 和相关 Skills。检查文件名、H1、alias、核心主张与现有规则，优先更新唯一 owner。主动寻找：

- 这是不是已有规则的具体例子，而不是新规则？
- 用户后来是否撤销或缩小了先前要求？
- 成功来自哪一步，还是只是时间相关？
- 失败教训是否只适用于当前项目或宿主？

### 3. 风险分级与批准

可自动合并的低风险学习：

- 用户当前明确陈述、适用范围清楚的格式或协作偏好。
- 有两处独立工作证据支持、且不涉及权限的稳定方法偏好。
- 现有 owner 的去重、勘误、精确化或验证状态更新。
- 当前 Agent profile 的已验证宿主事实。
- mountain 的新证据、普通 checkpoint 或已执行工作链接，但不改变 summit。

必须先问用户的高风险学习：

- 权限、安全、隐私、外部写入、自动删除或凭据处理。
- 核心身份、价值观、关系定义或把 Agent-specific 规则升级为 common。
- mountain summit、重大 active bet 或角色职责的实质重写。
- 来源矛盾、分类不清或可能覆盖用户现有手写规则。

低风险推断可以自动进入 owner，但必须保留证据和推断标签；不能把推断写成用户原话。

### 4. 原子写入

1. 检查 capture lock 与 compiler 基线。
2. 每个候选只写入最窄 owner；不要用一张“本次对话总结”大卡承载多个主题。
3. canonical 变化遵守来源、关系、reciprocal、freshness、privacy、原子性登记和 LOG 顺序。
4. 规则或 Skill 变化保留变更依据、风险裁决与兼容入口。
5. 所有 authority 变化先经本地短任务分支、秘密扫描与门禁；`private-remote` 再通过已验证为 private 的 `origin` PR 汇合，`local-only` 只保留本地 commit 与可恢复备份，禁止 push 到公开 Release remote。

### 5. 反向同步

写入完成后立即执行 `second-brain-sync` 的必要部分：更新当前宿主的 common/profile 短投影、Skill 副本哈希和 receipt。其他 Agent 下次同步时从相同 owner 获取变化，不需要当前 Agent逐台修改。

### 6. 验证

运行所有受影响门禁，并在全新会话检查新增规则能被正确触发。若只形成高风险候选而用户未批准，完成状态是“等待裁决”，不是“已学习”。

## 输出格式

按以下顺序报告：

1. 已自动采纳的学习：证据、owner、风险。
2. 已更新但仍标为推断的内容。
3. 等待用户裁决的高风险候选。
4. 去重或拒绝的候选及原因。
5. Git/门禁/新会话验证与一个确切下一步。

没有新知识时返回证据支持的 `no-op`；不要为了证明 Skill 有用而制造规则。
