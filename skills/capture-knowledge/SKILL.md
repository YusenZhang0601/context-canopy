---
name: capture-knowledge
description: 将对话、项目文档、调试经验或用户指定材料沉淀到 Second Brain。用于“保存知识”“提取经验”“导入文档”“记录到知识库”“capture knowledge”等请求；先保存可追溯来源，再按一个稳定主题一张卡提取或更新 canonical 页面，禁止把 README、报告、故事或整段会话直接做成一张大卡。
---

# Capture Knowledge

把材料保存为可追溯来源，并只将稳定、可复用的原子知识写入 canonical 图谱。

## 必读规则

先读 Vault 中的：

- `90-System/SCHEMA.md`
- `90-System/ONTOLOGY.md`
- `90-System/WORKFLOWS.md`
- `90-System/INDEX.md`

遵守以下边界：

- `04-Sources` 保存原始文档、完整报告、对话记录、运行日志和证据快照。
- `01-Knowledge` 只保存一个稳定概念、主张、方法、事件或合规实体。
- 一个项目、人物或系统可以有简洁实体页，但只能包含身份、边界、当前状态、来源和原子子卡链接。
- README、CHANGELOG、API 手册、故事、会议记录、时间线、命令大全和纯导航页不得直接成为 canonical 卡片。
- 只更新已有概念；确认是新主题后才新建。
- `aliases` 只能表示同一概念，不能容纳拆分后的不同主题。
- 不复制密码、token、API key 或私钥。

## 工作流

### 1. 固化来源

若材料尚无持久来源：

1. 将完整原文保存到 `04-Sources` 的相应领域和 provenance 批次。
2. 保留标题、日期、原路径或 URL；外部活文件的高置信结论要保存不可变快照和 SHA。
3. 若只有当前会话，使用 `Current conversation`，置信度不得为 `high`；有长期价值时优先生成会话来源记录。

不得为了建卡而改写既有来源文件。

### 2. 提取原子候选

先把材料拆成候选主题。每项必须能用一句话填写 `atomic_scope`，并通过：

1. 主题是一个稳定概念、主张、方法、事件，或一个简洁实体。
2. 所有实质段落都解释、限制、验证或应用同一主题。
3. 与其他候选不存在同一主张的重复 owner。
4. 有真实来源、置信度和至少两条 canonical 关系。

整份文档本身不是候选。没有稳定主题时，只保存来源，不创建卡片。

### 3. 查重和裁决

对每个候选串行执行：

1. 用 `search_knowledge` 搜索标题、别名和核心主张。
2. 找到同一概念时使用返回的 `target_path` 更新。
3. 精确重复或疑似重复返回裁决时，先决定更新既有页还是放弃候选；不得自动加时间戳制造重复卡。
4. 使用 `ONTOLOGY.md` 中已注册的标签和关系语义。

### 4. 用户确认

展示候选时逐项给出：

- 标题
- `card_form`: `atomic` 或 `entity`
- `atomic_scope`: 一句话唯一主题
- 新建或更新目标
- 来源
- 置信度与 freshness
- 关系

用户要求直接保存时可以继续执行；存在影响主题边界的歧义时才询问。

### 5. 串行写入

逐个调用 `capture_from_conversation`，不要使用 `Promise.all`。每次写入至少传入：

```json
{
  "title": "页面标题",
  "content": "只服务于一个主题的正文",
  "category": "Technical",
  "summary": "一句话摘要",
  "card_form": "atomic",
  "atomic_scope": "本页唯一负责解释的稳定主题",
  "tags": ["topic/knowledge-management"],
  "confidence": "medium",
  "freshness": "timeless",
  "source_refs": ["04-Sources/Knowledge/example.md"],
  "relations": [
    {
      "target": "上位页面",
      "label": "上位概念",
      "reciprocal_label": "组成部分"
    },
    {
      "target": "相关页面",
      "label": "支撑"
    }
  ]
}
```

`content` 不使用任何 Markdown 标题。需要展开时，以一个核心说明为主，后续只用 `**边界**：`、`**限制**：`、`**验证**：`、`**应用**：`、`**证据**：` 等标签解释同一 `atomic_scope`；并列主题必须拆卡。

时间敏感页面使用：

- 安全、网络、运行配置、项目状态：默认 7 天复查。
- 产品、API、工具版本：默认 30 天复查。
- 外部研究或平台政策：默认 90 天复查。
- `timeless`、`stale`、`blocked` 不设置 `review_after`。

只有本轮由权威来源核验的事实使用 `freshness: current` 和 `review_after`。

### 6. 完成报告

报告：

- 固化了哪些来源。
- 新建、更新或放弃了哪些原子候选。
- 每张卡的路径、唯一主题、来源和门禁结果。
- 未解决的证据、重复或 freshness 问题。

写入器会事务式更新正文、关系、原子性登记、派生层和 LOG，并在编译检查失败时回滚。不得把健康检查描述为可选步骤。
