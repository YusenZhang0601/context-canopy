---
type: system
created: 2026-08-14
tags:
  - system/sources
---

# Sources

这里存放不可变原始材料。LLM 可以读取、摘要、引用和归档它们，但默认不直接改写原始文件。

## 子目录

- `Knowledge`：论文、技术文档、项目材料、课程资料、工程记录
- `Insights`：文章、访谈、书摘、社会/职场/政治经济观察材料
- `Personal`：履历材料、个人经历、关系资料、地点和时间线证据
- `General`：暂时无法分类但值得保留的来源
- `Assets`：图片、附件、截图、网页剪藏资源

## 规则

- 原始材料尽量保留来源、日期和上下文
- 批次迁移只改变路径，不改变文件字节、权限和内部结构；迁移清单记录旧路径、新路径与 SHA-256
- 从来源抽取出的长期内容进入 `01-Knowledge`、`02-Insights`、`03-Personal`
- 完整 README、报告、日志和故事不是一张 canonical 卡；只提取其中稳定的原子概念
- 未被 canonical 消费的来源必须在 `90-System/SOURCE-DISPOSITIONS.json` 写明具体处置理由和复查日期
- 每次处理来源后，运行 compiler，并更新派生 INDEX、来源账本和 append-only LOG
