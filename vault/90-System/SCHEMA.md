---
type: system/schema
created: 2026-06-25
updated: 2026-07-31
tags:
  - system/schema
---

# Second Brain Schema

这个库采用 LLM Wiki 管理方式：原始材料保持可追溯，LLM 把材料持续编译成 Markdown 主图谱，Obsidian 用于浏览和检查图谱形状。

## 设计原则

- 默认中文写作；专有名词、代码/API、文件路径、命令、论文题名、产品名、人名地名和不适合硬翻译的术语可保留原文
- 原始材料和编译后的 wiki 分离
- 主图谱只包含真实内容节点，不包含目录结构
- 一张 canonical 卡片只负责一个稳定概念、主张、方法、事件或实体
- 优先更新已有节点，避免为同一概念创建重复页面
- 所有重要判断都要标注来源、置信度或不确定性
- 链接代表真实关系，而不是导航
- 每次维护都要更新索引和日志
- `INDEX.md`、来源覆盖账本和健康报告是可重建的派生层，不能反过来充当图谱关系
- 任何“重编译”必须默认只读；未经快照和显式写入模式，不得删除或覆盖主图谱目录

## 四层结构

### 1. Inbox

`00-Inbox` 是临时捕捉层。这里可以杂乱，但不能长期堆积。

### 2. Sources

`04-Sources` 是只读来源层。默认不改写来源，除非用户明确要求做文件整理。

子目录：

- `Knowledge`：学术、技术、项目、课程、工程材料
- `Insights`：观点、社会观察、理念、书摘、访谈
- `Personal`：履历、关系、人脉、地点、个人经历证据
- `General`：暂不分类来源
- `Assets`：图片和附件

### 3. Canonical Graph

主图谱只放三类内容：

- `01-Knowledge`：客观知识、学术、技术、项目经验、踩坑教训
- `02-Insights`：人生观、社会理解、职场判断、政治经济理解、哲学和理念
- `03-Personal`：个人档案、社会关系、人脉、履历经历、地点和时间线

这些目录里的页面可以主动使用 Obsidian 双链。系统页、模板页、日记页、项目管理页尽量不用双链污染主图谱。

### 4. System

`90-System` 是维护层：

- `SCHEMA.md`：本规则
- `INDEX.md`：主图谱目录和摘要
- `LOG.md`：append-only 操作日志
- `LINT.md`：健康检查记录
- `ONTOLOGY.md`：节点类型、关系类型和分类边界
- `WORKFLOWS.md`：ingest/query/lint/review 流程
- `ATOMICITY-REVIEW.json`：逐页原子性复核输入，保存当前内容哈希、卡片形态、唯一主题和复核日期
- `SOURCE-DISPOSITIONS.json`：未被 canonical 消费的来源处置输入

## 页面 Frontmatter

主图谱页面至少包含：

```yaml
type: knowledge | insight | personal
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: seed | active | stable | deprecated
summary: 一句话摘要
confidence: low | medium | high
aliases: []
freshness: timeless | current | stale | blocked
last_checked: YYYY-MM-DD
review_after: YYYY-MM-DD # 仅 freshness: current
sources: []
tags: []
```

- `aliases` 保存旧标题、常用简称和重命名前的链接目标；文件名与一级标题有意不同时必须提供 alias。
- `freshness` 描述事实新鲜度：`timeless` 为不依赖当前状态的稳定知识，`current` 为本轮已由权威来源核验，`stale` 为仅能确认历史时点，`blocked` 为权威来源当前不可访问。
- `last_checked` 记录页面最近一次事实、结构和来源审查日期；它不等同于正文最后变化的 `updated`。
- `review_after` 只允许用于 `current`，且不得早于 `last_checked`；检查日超过该日期后，页面必须重新核验或改为 `stale/blocked`。安全、网络、运行配置和项目状态默认 7 天，产品/API/工具版本默认 30 天，外部研究与平台政策默认 90 天。
- `status` 描述页面生命周期：`seed` 尚待培育，`active` 持续演化，`stable` 已成熟，`deprecated` 已被其他页面替代。

主图谱页面还应包含页面内更新记录：

```markdown
## 更新记录

- YYYY-MM-DD：说明本次事实、来源、结构或维护规则的变化。
```

`updated` 表示页面最后一次维护日期；`## 更新记录` 说明变化内容、来源批次和是否替代旧结论。全局 `90-System/LOG.md` 记录批量操作，页面内更新记录记录该概念自身的演变。

个人信息页面还应包含：

```yaml
privacy: private | sensitive | shareable
```

## 链接规则

- 用双链连接主图谱节点，例如一个技术教训连接一个项目经验
- 不为了导航创建链接
- 跨类链接是允许的，但必须真实
- 每个 canonical 页面至少有 2 条正文 `## 关系` 中的真实 canonical 关系，并至少有 1 条来自其他 canonical 页的入链
- `上位概念` 与对应页面的 `组成部分` 必须双向闭合；其他有方向的关系不机械要求对称，但必须经过审查
- 如果暂时无法建立真实关系，页面必须保持 `seed`，并在 `90-System/LINT.md` 记录原因和复查日期
- `INDEX.md` 中的普通路径不是 Obsidian 图谱边，不能用于“修复”孤儿

## 来源规则

- 知识类主张优先 source-backed
- 感悟类主张可以来自个人判断，但要写清来源、边界或反例
- 个人信息类内容要尽量区分事实、解释和情绪
- 来源材料不等于结论；结论进入主图谱前必须压缩、归纳、连接
- `sources:` 只写普通 vault 相对路径、绝对本地路径或 URL，不在 YAML 中写 `[[wikilink]]`
- vault 内本地 Markdown 来源必须同时在正文 `## 来源双链` 中建立真实 wikilink；URL、PDF 和 vault 外路径不强行转成图谱边
- 集合 README 只能说明资料批次存在，不能作为高置信具体断言的唯一证据
- `Current conversation` 不能作为 `high` 置信页面的唯一来源；应保存不可变来源记录，或降低置信度并登记缺口
- canonical 页面不得保存明文密码、token、API key 或私钥；敏感原始证据只在来源层保留，并在覆盖账本标记为 `敏感保留`
- `04-Sources/Personal` 表示个人信息的 provenance 分类，不自动等于 `敏感保留`；普通个人画像可按 `private` 被 canonical 消费，含凭据、联系方式、身份证明或明确敏感内容的原始材料仍按内容保守判定
- `90-System/SOURCE-COVERAGE.md` 必须对每个来源给出已编译、仅供参考、重复快照、敏感保留或延期处置
- `SOURCE-COVERAGE.md` 是确定性派生文件；路径、kind、处置、理由、consumer 与 SHA 必须和编译结果精确一致
- 未被 canonical 消费的来源必须在 `SOURCE-DISPOSITIONS.json` 写明具体理由、复核日期和下次复核日；禁止使用统一占位理由
- `LOG.md`、`INDEX.md`、`LINT.md`、`SOURCE-COVERAGE.md` 等持续变化的管理页不得作为 canonical 来源；需要引用时保存日期化不可变快照
- Vault 外可变 authority path 只保留在需要持续复核的状态 owner；`timeless` 或历史结论页引用日期化不可变快照，避免把同一 live pointer 复制到多个 owner
- 来源目录采用“领域 + provenance batch”：单领域批次进入 `Knowledge/Imported`、`Insights/Imported` 或 `Personal/Imported`，跨领域历史批次整体进入 `General/Imported`，不得为分类而改写来源正文

## 原子卡规则

- `atomic` 页只表达一个稳定概念、主张、方法或事件；所有实质章节必须解释、限制、验证或应用同一主题
- `entity` 页只用于人物、项目或系统，保留身份、边界、当前状态、来源和原子子卡链接；不得承载完整手册、历史流水或命令目录
- README、完整指南、报告、会话复盘、运行日志、时间线和纯导航页进入 Sources、项目层、系统日志或 Archive
- 一项主张只能有一个 canonical owner；案例页只作证据或应用，不重复通用方法
- alias 只能表示同一概念；宽泛旧标题无法唯一映射时保留在可追溯归档，不强行指向某个子卡
- 每张 canonical 页必须在 `ATOMICITY-REVIEW.json` 登记当前文件 SHA、`atomic|entity`、一句话唯一主题、复核日期和复核者；新增或修改后哈希失配即视为未复核
- 长度和标题数量只能触发候选审查，不能代替语义判断

## 语言规则

- 主图谱正文、摘要、索引、日志和复盘默认使用中文
- 专有名词、代码/API 名称、命令、文件路径、论文题名、模型名、产品名、人名地名可以保留原文
- 不为了“全中文”牺牲准确性；术语强行翻译会造成误解时保留原文，并可在中文后括注
- 从英文来源 ingest 时，结论层用中文重写，来源标题和关键术语可保留原文

## 命名规则

- 文件名用清晰标题，不追求过短
- 同名概念冲突时加限定词，例如 `缓存失效-工程经验`
- 重复页面合并后，权威页吸收有价值内容、来源与更新史；旧页移入 `80-Archive/Deduplicated/YYYY-MM-DD`，并通过 alias 兼容旧标题
- 人物页面建议放在 `03-Personal/People`
- 事件或经历建议放在 `03-Personal/Timeline`
- 地点建议放在 `03-Personal/Places`

## 规模规则

- 单页尽量保持原子化
- 页面过长、二级标题过多或高链接低正文时必须复核，但拆分依据始终是主题边界
- `90-System/INDEX.md` 超过约 300 行时，拆成分区索引
- 页面越多，越依赖 frontmatter 摘要和索引
- `90-System/INDEX.md` 必须由已通过校验的 canonical frontmatter 确定性生成，并与实际文件集合完全一致
