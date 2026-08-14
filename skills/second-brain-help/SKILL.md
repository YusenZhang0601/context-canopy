---
name: second-brain-help
description: "说明完整的 Second Brain 个人 AI 基底，列出七个统一命名且带中文注释的 Skills 与各宿主真实调用语法，并把模糊需求路由到最小且正确的 Skill。用户询问 Second Brain 能做什么、忘记 Skill 名称、想看命令清单、问‘该用哪个’，或描述 Attach、Sync、Learn、Distill、Climb、Doctor 类任务但不知道入口时使用。"
metadata:
  display_name: "Second Brain - Help（查看全部能力并选择正确 Skill）"
---

# Second Brain - Help（查看全部能力并选择正确 Skill）

这是随手可取的工具目录。默认只读，不执行安装、同步、知识写入、历史删除或山脉修改；选定后显式转交相应 Skill。

## 真实调用语法

- Codex：使用 `$second-brain-<name>`；也可打开 `/skills` 选择。Codex 不应被告知字面量 `/second-brain-<name>` 是原生命令。
- Claude、Hermes、AntiGravity：使用 `/second-brain-<name>`。
- 其他宿主：先查其原生 Skill 机制，再给真实语法。

可以通过 MCP `list_second_brain_skills` 查看当前 authority 清单、通过 `read_second_brain_skill` 读取所选流程；不要用缓存列表冒充当前清单。

## 七个入口

| Skill | 中文显示 | 什么时候用 | 是否默认写入 |
|---|---|---|---|
| `second-brain-attach` | Second Brain - Attach（接入并注入新 Agent） | 新 Agent/新设备首次接入、迁移、重装或残缺安装 | 是，先备份与基线 |
| `second-brain-sync` | Second Brain - Sync（同步通用规则与 Agent 配置） | common、Agent profile 与当前宿主投影出现漂移或需要传播偏好 | 是，低风险可自动合并 |
| `second-brain-learn` | Second Brain - Learn（沉淀当前对话与工作经验） | 从当前对话学习偏好、方法、知识、失败教训或山脉进展 | 视候选风险而定 |
| `second-brain-distill` | Second Brain - Distill（榨取历史对话并清理原始数据） | 批量挖掘历史会话，晋升附件，门禁通过后删除 allowlist 原文 | 是，删除需精确授权 |
| `second-brain-climb` | Second Brain - Climb（维护长期方向与爬山状态） | 维护长期方向的 summit、位置、路线、阻点、证据和下一信息动作 | 是，summit 高风险 |
| `second-brain-doctor` | Second Brain - Doctor（检查接入、注入和同步状态） | 检查 Skills、MCP、身份注入、Git 和 fresh-session 是否真实健康 | 否，只读诊断 |
| `second-brain-help` | Second Brain - Help（查看全部能力并选择正确 Skill） | 忘记名称、想看能力或任务意图不清 | 否 |

## 快速选择

- “给一个全新 Agent 穿上我的外骨骼” → Attach。
- “它已经接入，但规则/角色/Skill 版本不一致” → Sync。
- “从我们正在进行的这次对话里记住东西” → Learn。
- “批量挖旧聊天并在完整榨取后腾空间” → Distill。
- “这个长期方向现在走到哪、接下来验证什么” → Climb。
- “别改东西，只告诉我现在是否装好” → Doctor。

边界情况：

- Attach 结束必须调用 Doctor；Doctor 本身不修复。
- Learn 只处理当前对话；历史批次使用 Distill。
- Learn 写入 common/profile 后包含必要 Sync，但不逐台修改其他 Agent。
- Distill 可以调用 Learn 的候选路由和 Climb 的山脉更新，但只有 Distill 拥有原始会话删除门禁。
- Sync 处理规则漂移；项目代码或普通知识检索仍使用项目流程或 MCP 知识工具。

## 共同理念

- COMMON-RULES 是跨 Agent 通用规则唯一 owner；每个 Agent profile 保持独立角色。
- Agent 根据 Skills 自己执行，MCP 只是薄传输与确定性门禁。
- 低风险、有证据的学习可自动合并；权限、隐私、核心身份、summit 和冲突先问用户。
- authority 变化先保留本地可恢复历史；`private-remote` 经私有 `origin` PR 汇合，`local-only` 不远端写入，公开 Release remote 只读；不用数据库、守护进程、规则编译器或外部推理 API。
- 原始对话不进 Git；完整榨取、附件晋升、receipt 和恢复验证通过后，才删除精确 allowlist。
- SkillOpt 的程序不是依赖，只吸收其从工作轨迹中学习的理念。

## 输出

如果用户只是要列表，给七项和当前宿主语法即可。如果用户描述了具体任务，回答：

1. 推荐的唯一主 Skill。
2. 为什么它匹配、为什么相邻 Skill 不是主入口。
3. 本宿主的显式调用命令。
4. 是否会写入、删除或需要用户确认高风险项。

用户同时明确要求执行时，加载所选 Skill 并按其完整门禁继续；不要只停在介绍。
