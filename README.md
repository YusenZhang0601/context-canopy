# Second Brain

> **厂商无关的个人 AI 基底与 Obsidian 知识库 (Vendor-Independent Personal AI Substrate & Obsidian Knowledge Vault)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.9-blue.svg)](vault/90-System/scripts/compile_vault.py)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.29.0-orange.svg)](https://modelcontextprotocol.io)

[English Documentation](README_EN.md) | [简体中文文档](README.md)

---

## 🌟 核心理念与设计哲学

在多 AI Agent 协同时代，每个人都会使用多种模型与工具（如 Claude Code, Cursor, Codex, AntiGravity, Hermes, ChatGPT）。但绝大多数 AI 工具存在两大痛点：
1. **数据与记忆孤岛**：各厂商各自维护闭源或碎片化的 Memory，一旦更换平台，历史经验与工作流全部丢失。
2. **传统 RAG 的局限**：单纯依靠临时向量切片检索无法建立清晰的全局概念图谱与长远因果网络。

**Second Brain** 借鉴 **Karpathy LLM-Wiki** 思想，建立了一套完全由本地 Markdown 驱动、厂商中立、由用户完全自主掌控的个人 AI 基底系统：

* **同一个“我”，不同 Agent 的“自己”**：所有 Agent 共享统一的用户画像、长期目标（山脉模型）与全局协作规则（`COMMON-RULES.md`），同时保留各自在 IDE、CLI、长文分析或自动化编排上的独特宿主优势。
* **不可变证据与可编译图谱分离**：原始论文、手册、对话和代码快照沉淀至 `04-Sources`；由 Agent 提炼并维护高内聚的原子知识卡片（`01-Knowledge`、`02-Insights`、`03-Personal`）。
* **严格的图谱编译器与静态门禁**：通过 `compile_vault.py` 自动化检测孤岛节点、死链、歧义链接与弱连通分量，杜绝知识库腐化。
* **ACID 事务写入与回滚机制**：MCP 服务提供带写前基线检查、对称反向链接更新与失败全量回滚的知识沉淀引擎。
* **8 大多 Agent 核心技能**：提供开箱即用的跨宿主标准化技能套件。

---

## 🏗️ 整体架构

```
                     ┌─────────────────────────────────────────────────────────┐
                     │               用户 (Human User / Developer)              │
                     └────────────┬───────────────────────────────┬────────────┘
                                  │                               │
                                  ▼                               ▼
                     ┌────────────────────────┐      ┌─────────────────────────┐
                     │   Obsidian GUI / App   │      │   AI Agents & Hosts     │
                     │  (可视化主图谱浏览与编辑) │      │ Claude / Codex / Cursor │
                     └────────────┬───────────┘      │ AntiGravity / Hermes    │
                                  │                  └────────────┬────────────┘
                                  │                               │ MCP / Skills
                                  │                               ▼
                                  │                  ┌─────────────────────────┐
                                  │                  │    Second Brain MCP     │
                                  │                  │  (Node.js stdio Server) │
                                  │                  └────────────┬────────────┘
                                  │                               │
                                  ▼                               ▼
    ┌──────────────────────────────────────────────────────────────────────────────────────────┐
    │                                Second Brain Knowledge Vault                              │
    ├─────────────────────────────┬──────────────────────────────┬─────────────────────────────┤
    │  00-Inbox / 05-Queries      │  01-Knowledge / 02-Insights  │  04-Sources (不可变证据层)   │
    │  (临时捕捉与问答暂存)         │  03-Personal (原子主图谱)     │  (论文、手册、原始会话)      │
    ├─────────────────────────────┴──────────────────────────────┴─────────────────────────────┤
    │  90-System (治理规范、SCHEMA、ONTOLOGY、编译器 compile_vault.py、LOG.md、Personal-AI 规则)   │
    └──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Monorepo 目录结构

```text
second-brain-release/
├── vault/                      # Obsidian 知识库与图谱治理
│   ├── 00-Inbox/               # 临时灵感与未分流材料
│   ├── 01-Knowledge/           # 客观知识、技术架构与方法论原子卡片
│   ├── 02-Insights/            # 价值判断、工程哲学与深度洞察
│   ├── 03-Personal/            # 个人档案、协作体系与长期登山模型 (Mountains)
│   ├── 04-Sources/             # 不可变原始证据层 (文档、论文、对话快照)
│   ├── 05-Queries/             # 结构化问答与阶段性综合
│   ├── 90-System/              # 模式定义 (SCHEMA)、本体 (ONTOLOGY)、日志与编译工具
│   │   ├── Personal-AI/        # 跨 Agent 通用规则 (COMMON-RULES) 与角色档案 (AGENTS)
│   │   └── scripts/            # 知识图谱编译器 (compile_vault.py) 与门禁套件
│   └── 90-Templates/           # 11 种标准笔记模板
├── mcp/                        # Node.js Model Context Protocol 服务端
│   ├── index.js                # 9 个核心 MCP 工具注册与自适应路径解析
│   ├── lib/vault-writer.js     # 8 步 ACID 事务写入器与编译回滚守卫
│   ├── scripts/                # 独立全库 stdio 冒烟测试
│   └── test/                   # 24 项自动化单元测试
├── skills/                     # 8 个跨 Agent 标准化技能包
│   ├── capture-knowledge/      # 原子知识卡片提取与沉淀
│   ├── second-brain-attach/    # 全新 Agent 接入与初始化
│   ├── second-brain-climb/     # 15 项要素长期登山模型维护
│   ├── second-brain-distill/   # 历史对话批次全量榨取与清理
│   ├── second-brain-doctor/    # 全系统健康与连通性只读诊断
│   ├── second-brain-help/      # 技能目录与意图智能路由
│   ├── second-brain-learn/     # 从当前对话沉淀偏好与低风险自动合并
│   └── second-brain-sync/      # 双向同步通用规则与宿主配置
├── package.json                # Monorepo 统一构建与测试脚本
└── LICENSE                     # MIT License
```

---

## ⚡ Agent-First 单 Prompt Bootstrap（智能冷启动）

将以下 Prompt 发送给任意兼容 Agent（Claude Code、Cursor、AntiGravity、Codex、Hermes 等），Agent 会自动完成可安全执行的本地步骤；创建私有仓库、改变远端或扩大权限时必须停下取得你的授权。

重要边界：这个公开仓库是分发模板，不是你的个人 authority 写入远端。个性化之前必须选择 `local-only` 或 `private-remote`；绝不能把个人画像、历史、规则或山脉 push 回公开 Release 仓库。

```markdown
你现在负责把当前环境初始化并接入 Second Brain（个人 AI 基底与知识库系统）。
本仓库根目录为当前工作目录。请按以下六个步骤完成冷启动：

1. [语言与环境检测]：检测用户交互语言（中文/英文）并以对应语言交互。识别当前宿主平台（Claude Code / Claude Desktop / AntiGravity / Codex / Cursor / Hermes）。
2. [个人 authority 边界]：在写入个人信息前让用户选择 `local-only` 或 `private-remote`。local-only 禁止任何远端 push；private-remote 只允许使用用户授权且实时验证为 private 的 `origin`，公开 Release remote 只能作为只读 upstream。创建仓库或改变远端前先确认。
3. [Skills 注册]：将本仓库 `skills/` 下的 8 个技能（独立的 capture-knowledge，以及 7 个 second-brain-* Skills）安装或链接到当前宿主的技能目录。
4. [MCP 配置生成]：根据当前宿主生成或更新 MCP 配置文件，指向 `mcp/index.js`，设置 `SECOND_BRAIN_VAULT_PATH` 为本仓库 `vault/` 的绝对路径；不扩大到 Vault 外任意文件。
5. [协作身份初始化]：阅读 `vault/03-Personal/Profile/user-profile.template.md.example` 的问卷，但不要把它复制成 canonical 页面。只更新现有唯一 owner `个人AI协作体系.md` 与 `Mountains/个人AI基底.md`，同步原子性登记并保留用户确认边界。
6. [系统体检与验证]：在 `vault/` 运行 compiler 与 lint；在 `mcp/` 运行 `npm test` 和 `npm audit --audit-level=low`；调用 `second-brain-doctor`。只有当前 authority 模式所需项目都通过才报告健康。

完成后以结构化表格汇报各步骤状态，并按当前宿主的真实 Skill 语法提示如何记录第一条笔记或维护第一座长期目标。
```

---

## 🚀 人类开发者快速上手

### 1. 环境准备
- **Node.js**: `>= 18.0.0` (推荐 Node.js 20+ LTS)
- **Python**: `>= 3.9` (需安装 `pyyaml`: `pip install pyyaml`)
- **Obsidian**: 可选，用于可视化双向关系图谱。

### 2. 克隆与安装

从本项目托管页面的 **Code** 按钮复制公开 clone URL，再运行：

```bash
git clone <PUBLIC_REPOSITORY_URL> second-brain
cd second-brain

# 安装 MCP 依赖
cd mcp && npm install && cd ..
```

clone 后的公开 remote 只是分发来源。个性化前选择：

- `local-only`：不 push，使用本地 Git commit 与 Vault 外备份。
- `private-remote`：经你明确授权后，把公开 remote 改为只读 `upstream`，并把你自己控制、已验证为 private 的仓库设为唯一可写 `origin`。不要使用公开 fork 保存个人数据。

### 3. 一键全库验证

在仓库根目录下运行统一测试套件：

```bash
# 运行完整测试（包含 Vault 编译器门禁、静态 Linter 与 MCP 单元测试）
npm test

# 运行真实 Vault 隔离副本 stdio 冒烟测试
npm run smoke

# 仅运行 Vault 图谱编译器检查
npm run compile

# 重建派生索引 (INDEX.md & SOURCE-COVERAGE.md)
npm run compile:write
```

### 4. 在 Obsidian 中打开

1. 打开 Obsidian，选择 **"Open folder as vault"**。
2. 选择本仓库下的 `vault/` 目录。
3. 点击左侧边栏的 **"关系图谱" (Graph View)**，即可看到 7 张预置种子卡片构成的连通知识网络！

### 5. 手动配置 MCP 客户端

#### Claude Desktop
编辑 `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) 或 `%APPDATA%\Claude\claude_desktop_config.json` (Windows)：

```json
{
  "mcpServers": {
    "second-brain": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/second-brain/mcp/index.js"],
      "env": {
        "SECOND_BRAIN_VAULT_PATH": "/ABSOLUTE/PATH/TO/second-brain/vault"
      }
    }
  }
}
```

#### Cursor
在 `.cursor/mcp.json` 或 `~/.cursor/mcp.json` 中配置：

```json
{
  "mcpServers": {
    "second-brain": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/second-brain/mcp/index.js"],
      "env": {
        "SECOND_BRAIN_VAULT_PATH": "/ABSOLUTE/PATH/TO/second-brain/vault"
      }
    }
  }
}
```

---

## 🛠️ 8 大核心 Multi-Agent Skills

调用语法以宿主为准：Codex 使用 `$skill-name` 或 `/skills` 选择器，不声称支持字面的 `/skill-name`；其他兼容宿主可按其原生斜杠或技能选择界面调用。下表同时列出常见形式，接入后应由 `second-brain-help` 返回当前宿主的真实语法。

| Skill 名称 | 触发方式 | 功能描述 | 交互输入 | 输出结果 |
|---|---|---|---|---|
| `capture-knowledge` | `/capture-knowledge`<br>`$capture-knowledge` | 将对话、文档或调试经验沉淀为原子知识卡片，维护对称关系与来源双链。 | 标题、内容、分类、`card_form` (`atomic`/`entity`)、`atomic_scope`、关系 | 事务更新主图谱、更新 `ATOMICITY-REVIEW.json` 与派生索引 |
| `second-brain-attach` | `/second-brain-attach`<br>`$second-brain-attach` | 将全新或重装后的 AI Agent 接入 Second Brain，配置 MCP 并注入身份。 | 目标宿主平台、Vault 路径 | 宿主配置文件受管标记块、注册技能、安装收据 |
| `second-brain-climb` | `/second-brain-climb`<br>`$second-brain-climb` | 维护 15 项要素的长期战略方向登山模型（山顶、差距、当前押注、信息行动）。 | 山脉名称、新进展证据 | 更新 `03-Personal/Mountains/<山名>.md`，高风险山顶变更确认 |
| `second-brain-distill` | `/second-brain-distill`<br>`$second-brain-distill` | 完整榨取历史对话批次，沉淀规则与知识，在完整性门禁通过后清理原始数据。 | 对话批次白名单、导出数据 | 提炼卡片、项目资产晋升、删除收据 |
| `second-brain-doctor` | `/second-brain-doctor`<br>`$second-brain-doctor` | 只读诊断 Agent 是否正确接入：检查 7 个 Second Brain Skills、独立 capture Skill、MCP、authority 模式与漂移。 | 无（只读审计） | 结构化体检诊断表格（PASS/DRIFT/BLOCKED/UNKNOWN） |
| `second-brain-help` | `/second-brain-help`<br>`$second-brain-help` | Second Brain 全景使用指南，提供宿主专属调用语法并将模糊需求路由到最小 Skill。 | 用户意图描述 | 推荐 Skill、调用命令、副作用提示 |
| `second-brain-learn` | `/second-brain-learn`<br>`$second-brain-learn` | 从当前对话挖掘偏好、项目经验与规则；低风险自动合并，高风险请求确认。 | 当前对话轨迹、用户修正 | 更新 COMMON-RULES、Agent profile 或主图谱卡片 |
| `second-brain-sync` | `/second-brain-sync`<br>`$second-brain-sync` | 双向同步通用规则与各 Agent 独立角色；local-only 保留本地历史，private-remote 通过私有 PR 汇合。 | 宿主配置、Vault 规则 | 同步受管区块、解决规则漂移、输出同步报告 |

---

## 🔌 MCP 工具矩阵 (9 Tools)

| 工具名称 | 权限 | 访问路径 / Authority | 说明 |
|---|---|---|---|
| `get_common_rules` | 只读 | `90-System/Personal-AI/COMMON-RULES.md` | 获取所有 Agent 必须遵守的通用规则唯一源。 |
| `get_agent_profile` | 只读 | `90-System/Personal-AI/AGENTS/{agent_id}.md` | 获取指定 Agent 实例的角色定位与分工合同。 |
| `get_mountain_context`| 只读 | `03-Personal/Profile/` 或 `03-Personal/Mountains/` | 读取长期登山总览或指定山脉的 15 要素模型。 |
| `list_second_brain_skills` | 只读 | `90-System/Personal-AI/SKILLS/` | 扫描并列出 Vault 拥有的技能清单及 SHA-256 哈希。 |
| `read_second_brain_skill` | 只读 | `90-System/Personal-AI/SKILLS/{id}/SKILL.md` | 读取指定技能的完整前言与工作流定义。 |
| `search_knowledge` | 只读 | `01-Knowledge/**/*.md` | 多关键词加权搜索知识库，返回高相关度摘要。 |
| `get_entry` | 只读 | `01-Knowledge/{path}` | 获取指定知识卡片的完整 Markdown、元数据与双链。 |
| `list_entries` | 只读 | `01-Knowledge/` 各子目录 | 按分类、标签、更新时间浏览与分页知识卡片。 |
| `capture_from_conversation` | 事务写入 | `01-Knowledge/` + `90-System/` | 8 步 ACID 事务写入器：模式验证、对称反向更新、编译器门禁、全量回滚保障。 |

---

## 🛡️ 知识治理与编译器门禁

为了确保知识库在长达数年、成千上万次 Agent 写入后依然健康不腐化，Second Brain 建立了严密的编译与校验体系：

1. **原子性卡片约束**：每张卡片必须声明 `card_form: atomic|entity` 与 200 字以内的 `atomic_scope`。正文严禁大而全的多级标题文档。
2. **闭环关系网**：新建卡片必须至少包含 2 个关联目标，且关键关系必须对称维护（如：`上位概念` ↔ `组成部分`）。
3. **单一弱连通图谱**：编译器强制全库主图谱为一个连通分量，杜绝不可触达的孤岛笔记（Orphans）。
4. **确定性派生层**：`INDEX.md` 与 `SOURCE-COVERAGE.md` 完全由编译器确定性生成，严禁人工篡改。
5. **哈希注册表**：`ATOMICITY-REVIEW.json` 实时记录所有卡片的 SHA-256 哈希，任何非法篡改将被编译器拦截。

---

## 🤝 贡献与开源协议

欢迎为 Second Brain 贡献新的 Multi-Agent Skills、领域种子知识库或 MCP 工具适配！

本项目采用 [MIT License](LICENSE) 开源协议。
