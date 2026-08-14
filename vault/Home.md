---
type: hub
created: 2026-08-14
tags:
  - system/home
---

# Second Brain

这里是这个 Obsidian 库的入口。先把材料放进 Inbox，再把稳定内容沉淀成三类图谱节点：知识、感悟、个人信息。

## 快速入口

- `00-Inbox/Inbox.md`：临时捕捉
- `01-Knowledge`：知识，包含学术、技术、项目经验、教训和客观方法
- `02-Insights`：感悟，包含人生观、社会理解、职场判断、政治经济理解和理念
- `03-Personal`：个人信息，包含长期方向与山脉、个人档案、协作体系
- `04-Sources`：不可变原始材料，供 LLM ingest 时读取
- `05-Queries`：值得保留但还没有转成主图谱节点的问答/分析
- `10-Projects/`：项目管理目录
- `20-Areas/`：长期领域
- `30-Resources/`：资料和资源
- `40-Daily/`：日常记录
- `60-Reviews/`：阶段复盘
- `90-System`：schema、索引、日志、lint 和本库维护规则
- `90-Templates/`：模板

## 三类图谱

### 01-Knowledge

客观意义上的知识和可复用经验。这里放学术概念、技术方案、项目复盘沉淀、方法论、踩坑教训、可验证的判断。

常用子目录：

- `Architecture`：系统架构、知识体系设计
- `Methodology`：原子化方法论、工程规范
- `Technical`：技术概念、工程方案、工具链
- `Experience`：踩坑、教训、操作经验

### 02-Insights

偏形而上和价值判断的内容。这里放人生观、世界观、社会观察、职场理解、政治经济判断、认可的理念和哲学。

常用子目录：

- `Philosophy`：人生观、价值观、工程哲学
- `Workplace`：职场、组织、跨 Agent 协作、合作原则

### 03-Personal

关于用户个人的事实、协作体系与长期规划。

常用子目录：

- `Profile`：个人档案、能力、协作体系
- `Mountains`：长期战略方向与爬山模型

## LLM Wiki 管理层

这个库参考 Karpathy LLM Wiki 的思路：不要只把材料拿来临时检索，而是让 LLM 把原始材料逐步编译成可维护、可追溯、可互相链接的 Markdown wiki。

- 原始材料放在 `04-Sources`，默认只读，不直接改写
- 主图谱节点放在 `01-Knowledge`、`02-Insights`、`03-Personal`
- 管理规则放在 `90-System/SCHEMA.md`
- 内容索引放在 `90-System/INDEX.md`
- 操作记录放在 `90-System/LOG.md`
- 健康检查放在 `90-System/LINT.md`
- 给 Agent 的长期操作说明放在 `AGENTS.md`

## 约定

- 临时捕捉放在 `00-Inbox`
- 原始材料放在 `04-Sources`
- 知识放在 `01-Knowledge`
- 感悟放在 `02-Insights`
- 个人信息放在 `03-Personal`
- 有明确目标和结束条件的事情放在 `10-Projects`
- 需要长期维护的责任范围放在 `20-Areas`
- 可复用知识、资料和引用放在 `30-Resources`
- 每日记录放在 `40-Daily`
- 周/月/阶段复盘放在 `60-Reviews`
- 完成或暂不活跃的内容放在 `80-Archive`

## 图谱规则

Obsidian 的关系图谱来自笔记之间的链接。这个库的主图谱只显示 `01-Knowledge`、`02-Insights`、`03-Personal` 三类内容，目录页、模板页和日记尽量只写普通路径或文字说明，避免把管理结构画进图谱。
