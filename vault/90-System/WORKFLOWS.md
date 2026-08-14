---
type: system/workflows
created: 2026-06-25
updated: 2026-08-09
tags:
  - system/workflows
---

# 维护流程

## Ingest（导入）

用于把一个来源或一批 Inbox 内容转成主图谱。

1. 读取来源或 Inbox 内容
2. 判断它属于知识、感悟、个人信息，或只是项目/日记/资源
3. 编译到主图谱时默认用中文写作，专有名词和不宜硬翻的术语保留原文
4. 原始材料先原样保存到 `04-Sources` 的领域与 provenance batch，不把整份 README、报告、故事或运行日志直接做成 canonical 页
5. 提取概念、实体、经历、主张、关系、反例和开放问题；每个候选必须能用一句话声明唯一主题
6. 搜索标题、alias 和核心主张，优先更新已有 owner
7. 只有确实新主题才创建新页面；项目、人物和系统实体页保持简洁
8. `sources:` 使用普通路径或 URL；本地 Markdown 证据同时写入正文 `## 来源双链`
9. 更新页面 `updated`、`freshness`、`last_checked` 和 `## 更新记录`，写清来源批次、事实变化和替代关系
10. 更新 `ATOMICITY-REVIEW.json` 中该页及 reciprocal 变更页的哈希、形态、唯一主题和复核信息
11. 先将本次 LOG 纳入同一可回滚事务，再用 `--write-derived` 确定性重建 INDEX 与来源覆盖账本
12. 运行 `python3 90-System/scripts/compile_vault.py --check`；失败时回滚页面、关系、复核登记、LOG 和派生文件
13. 如有不确定分类、来源或实时核验阻塞，记录到 `90-System/LINT.md`

## Query（查询）

用于回答“这个库怎么看某个问题”。

1. 先读 `90-System/INDEX.md`
2. 再读候选页面，不直接从聊天记忆臆测
3. 回答时区分事实、解释、感悟和不确定性
4. 只有用户明确要求保存时，才把有长期价值的回答保存到 `05-Queries`；未要求保存的只读查询不得产生文件、LOG 或 Query 副作用
5. 只有用户明确要求沉淀且回答产生稳定新节点时，才按 Ingest 流程拆入 `01-Knowledge`、`02-Insights` 或 `03-Personal`
6. 仅在发生获批写入时更新相关页面的 `updated`、`## 更新记录` 和全局日志；纯查询保持零写入

## Lint（健康检查）

用于定期健康检查。

1. 先对 Vault 和所有会被修改的写入器建立可恢复快照
2. 运行 `python3 90-System/scripts/compile_vault.py --check --format json`，同时检查 YAML、必填字段、INDEX、正文链接、alias、组件、来源声明与来源双链
3. 分开判断 INDEX 漏追踪、canonical 图谱孤儿和 source 未编译项，禁止互相替代
4. 检查重复主题、冲突结论、原子性登记、过时断言、管理页污染和个人信息隐私
5. 修复后再运行 `--write-derived`，随后重新执行只读检查和 `bash 90-System/scripts/lint_vault.sh`
6. 把仍未解决或权威来源受阻的问题写入 `90-System/LINT.md`；已解决问题只进入维护报告与 LOG

## Review（复盘）

用于周/月/阶段复盘。

1. 从 `40-Daily`、`10-Projects`、`60-Reviews` 找近期材料
2. 抽取稳定经验、感悟和个人轨迹
3. 分别沉淀到三类主图谱
4. 删除或归档已经处理的临时捕捉
5. 更新索引和日志

## Full Recompile（全量重编）

1. 冻结自动 capture，验证 Vault 外快照可恢复
2. 从 canonical、来源层、INDEX、LINT 和写入端生成只读基线
3. 先修编译器和写入契约，再修内容，禁止运行 legacy 迁移脚本
4. 按主题簇审查重复、冲突、原子性、来源和关系；合并页进入可追溯归档
5. 物理迁移来源时按清单原样移动；canonical `sources:` 更新带 `.md` 的普通路径，正文 `## 来源双链` 同步更新无扩展名 Wikilink target（保留 alias），迁移后只以 compiler 判定
6. 对时间敏感断言使用本地权威文件或官方一手来源核验；不可访问时标记 `stale` 或 `blocked`
7. 扫描 canonical 明文凭据；移除具体值，敏感原证据只在不可变来源层保留并标记 `敏感保留`
8. 先追加 append-only LOG，再生成 INDEX、SOURCE-COVERAGE 和维护报告，并以确定性重跑无差异及全量门禁退出 0 为完成标准
