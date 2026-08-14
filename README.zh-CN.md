<div align="center">

<img src="docs/assets/tony-system-builder-banner.png" alt="TonyRainforest — System Builder" width="100%" />

<h1>ContextCanopy</h1>

<p><strong>换 Agent，不必换掉它已经认识的你。</strong></p>

<p>
  面向个人 AI 的可迁移、本地优先上下文层：<br />
  同一个人，多个 Agent，不再被 Memory 锁定。
</p>

<p>
  <a href="https://github.com/YusenZhang0601/context-canopy/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/YusenZhang0601/context-canopy/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-2ea44f.svg" /></a>
  <a href="https://modelcontextprotocol.io"><img alt="MCP" src="https://img.shields.io/badge/MCP-compatible-6f42c1.svg" /></a>
  <a href="https://obsidian.md"><img alt="Obsidian" src="https://img.shields.io/badge/Obsidian-ready-7c3aed.svg" /></a>
  <img alt="Portable context" src="https://img.shields.io/badge/context-portable-0ea5e9.svg" />
  <img alt="Local-first" src="https://img.shields.io/badge/authority-local--first-111827.svg" />
</p>

<p>
  <a href="#换-agent-的隐形成本">为什么要可迁移？</a> ·
  <a href="#迁移是怎么实现的">工作原理</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#今天实际提供什么">当前能力</a> ·
  <a href="README.md">English</a>
</p>

</div>

---

## 换 Agent 的隐形成本

一个 AI Agent 越了解你，你就越难离开它。

你花了几个月教会某个工具你的偏好、项目、术语、决策方式、工作习惯和长期目标。后来出现了更强的 Agent，但换过去意味着从头再解释一遍。于是，你积累的上下文反而变成了一种无意间形成的厂商锁定。

ContextCanopy 要改变的是：**这份上下文究竟属于谁。**

| 没有可迁移层 | 使用 ContextCanopy |
|---|---|
| 每个 Agent 都建立一份割裂、随时可能丢失的“你”。 | 所有 Agent 都从同一份用户所有的连续性基底读取。 |
| 换工具等于重新解释几个月甚至几年的背景。 | 把新宿主接到同一份长期 authority。 |
| 重要 Memory 藏在对话、缓存或厂商状态里。 | 长期上下文保存在可检查的 Markdown 与 Git 友好产物中。 |
| 共享记忆容易把所有 Agent 压成同一种角色。 | 通用用户上下文与 Agent 独立角色明确分开。 |
| “学习”可能悄悄积累矛盾和错误。 | 来源、唯一 owner、新鲜度、检查与回滚约束每次变化。 |

> **ContextCanopy 不声称搬走模型隐藏的“灵魂”；它迁移的是本来就应该属于你的长期上下文。**

持久记忆、有边界的学习和 Agent 自我改进仍然重要，但它们都围绕同一个承诺组织：你可以换 AI 工具，而不必把长期积累的“自己”留在旧工具里。

## 迁移是怎么实现的

```text
  Claude Memory · 对话导出 · 项目规则 · 笔记 · 研究 · 决策
                                  │
                         Capture / Learn / Distill
                                  │
                 ┌────────────────▼────────────────┐
                 │      CONTEXTCANOPY CORE         │
                 │ 身份 · 偏好 · 规则 · 知识       │
                 │ 目标 · 证据 · Skills · 历史     │
                 └───────┬─────────┬─────────┬─────┘
                         │         │         │
                   Attach + Sync   │    Attach + Sync
                         │         │         │
                      Claude     Codex    未来 Agent
                    保留自身角色  保留自身角色  保留自身角色
```

这份可迁移核心不是一段越来越长的 system prompt，而是一个小而受治理的三层系统：

1. **证据层**：不可变的原始材料，例如对话、论文、手册和导出文件。
2. **Canonical 上下文层**：原子化的 Markdown 知识、洞见、个人上下文和长期“山脉”；每项只有一个 owner，并保留来源链。
3. **宿主投影层**：所有 Agent 共享的用户规则，加上每个 Agent 独立的角色；通过宿主原生 Skills 和轻量 MCP 接入。

### 一个具体的交接

假设 Claude 已经学会你如何审查科研证据，现在你希望 Codex 接手下一轮实验实现：

1. 把选中的对话或规则作为证据保存下来。
2. 将真正长期有效的方法提炼进 ContextCanopy canonical 核心。
3. 接入 Codex，同步共同规则，同时保留 Codex 自己的执行角色。
4. 在全新会话中运行 Doctor，证明 Codex 确实读到了 authority，而不是依靠旧对话猜答案。

Claude 仍然是 Claude，Codex 仍然是 Codex；但它们认识的是同一个人，也遵循同一份有证据的方法。

### 什么能迁移，什么不能

| 设计上可迁移 | 明确不冒充可迁移 |
|---|---|
| 偏好、术语、协作规则 | 模型权重或厂商隐藏实现 |
| Canonical 知识、决策和来源链 | 凭据、权限或秘密值 |
| 长期目标和有证据的进展 | 当前对话的瞬时运行状态 |
| 选定对话中的学习与项目经验 | 厂商不提供、不允许导出的 Memory |
| 可复用 Skills 和宿主独立角色 | 没有明确适配器支持的宿主 UI 设置 |

## 不只是“记得更久”

| 能力 | 在 ContextCanopy 中的含义 |
|---|---|
| 🔄 **可迁移连续性** | 更换或增加 Agent 时，不必从零重建长期用户上下文。 |
| 🌱 **有边界的学习** | Agent 可以吸收有证据的经验，但不能暗中改写身份、权限或隐私边界。 |
| 🧭 **同一个人，不同 Agent** | 用户上下文共享；每个 Agent 的职责与长处保持独立。 |
| 🔎 **先有证据，再谈置信度** | 原始来源与结论分离，每项长期主张都能回到证据。 |
| 🕸️ **可编译知识图谱** | 原子 Markdown owner、类型关系、新鲜度、反链与确定性派生视图，替代一堆无结构对话切片。 |
| 🛡️ **本地 authority** | 不强制依赖云端 Memory、专有数据库、后台 daemon 或外部推理 API。 |
| ↩️ **可恢复写入** | 主页面、关系更新、编译、最终检查和回滚共用一个事务失败边界。 |
| 🧰 **宿主原生运行** | Skills 负责判断与流程；MCP 只提供窄而明确的 allowlist 数据面。 |

## 它在这个领域里的位置

ContextCanopy 与几类优秀项目相邻，但重心不同：

| 类别 | 常见强项 | ContextCanopy 的重心 |
|---|---|---|
| 厂商内置 Memory | 在单个产品内使用顺滑 | 能够比该产品活得更久的用户自有上下文 |
| 向量 Memory 服务 | 为应用提供快速语义召回 | 人类可读 authority、来源链和治理 |
| 跨 Agent Markdown Memory | 共享事实与项目回忆 | 完整个人 AI 基底：身份、规则、目标、证据、角色与 Skills |
| Stateful Agent 平台 | 保持单个长期 Agent 的内部状态 | 在彼此独立的 Agent 和厂商之间保持连续性 |
| Obsidian / LifeOS 模板 | 个人组织与可视化面板 | 可由 Agent 操作、可编译的上下文层，而不是生活规划 UI |

### 值得对照研究的项目

- [Basic Memory](https://github.com/basicmachines-co/basic-memory) 将本地 Markdown、知识图谱和广泛 MCP 接入结合起来。
- [AgentCairn](https://github.com/ccf/agentcairn)、[Dory](https://github.com/deeflect/dory) 与 [Memorix](https://github.com/AVIDS2/memorix) 分别以不同存储和检索合同解决 coding Agent 之间的共享记忆。
- [EIDARA](https://github.com/jrotllant/eidara) 探索可编译 Markdown Memory；仍处草案阶段的 [Agent Memory Protocol](https://github.com/agentmemoryprotocol/agentmemoryprotocol) 探索可移植交换标准。
- [Mem0](https://github.com/mem0ai/mem0)、[Graphiti](https://github.com/getzep/graphiti) 和 [Letta](https://github.com/letta-ai/letta) 是应用 Memory、时序图谱与 stateful Agent 的重要参考。

ContextCanopy 不会声称“别人都没有做迁移”。它真正独特的押注是：迁移时需要携带的是**这个人的受治理上下文**，不只是几条检索出来的事实；同时还要保留不同 Agent 的差异。

项目也受到 [Andrej Karpathy 的 LLM Wiki 构想](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)与 [LifeOS](https://github.com/danielmiessler/LifeOS) 等个人 AI 探索的启发。

## 快速开始

### 环境要求

- Node.js 18 或更高版本
- Python 3.9 或更高版本，并安装 PyYAML（`python3 -m pip install pyyaml`）
- Obsidian 可选；任意 Markdown 编辑器均可

### 1. 克隆并验证

```bash
git clone https://github.com/YusenZhang0601/context-canopy.git
cd context-canopy

npm ci --prefix mcp
npm test
npm run smoke
```

### 2. 决定私人 authority 放在哪里

写入真实个人上下文前，先选择一种模式：

- **Local-only**：个人 commit 和备份只留在自己的设备上，不推送任何个人内容。
- **Private-remote**：公开仓库只作为只读 `upstream`；另建一个已经实时验证为 private 的独立仓库，作为唯一可写 `origin`。

不要使用公开 fork 存放个人 Vault。

### 3. 让 Agent 接入当前宿主

在兼容 Agent 中打开仓库根目录，然后发送：

```text
请阅读 AGENTS.md 和 skills/second-brain-attach/SKILL.md，然后把当前宿主接入 ContextCanopy。
写入个人信息前，先让我选择 local-only 或 private-remote authority。
安装仓库自带 Skills，配置本地 MCP，运行文档规定的检查，
只汇报真实验证过的结果，并以全新会话 Doctor 检查收尾。
```

根目录合同会把 Agent 路由到 Vault 或 MCP 的正确说明。Agent 必须识别宿主真实支持的 Skill 语法；例如 Codex 使用 `$skill-name` 或 `/skills` 选择器，不能假装所有宿主都支持字面斜杠命令。

## 今天实际提供什么

### 可迁移能力状态

| 表面 | 当前状态 |
|---|---|
| 多宿主共享的用户自有 Markdown authority | ✅ 已内置 |
| Attach、Sync、Learn、Distill、Doctor 与长期方向工作流 | ✅ 以 Agent Skills 形式内置 |
| 选定对话或历史档案迁移 | ✅ Agent 引导式；前提是能取得导出或原始来源 |
| Codex、Claude、AntiGravity、Hermes 独立角色合同 | ✅ 已内置；每个真实宿主仍须做全新会话验证 |
| 通用 MCP 客户端读取与 capture | ✅ 协议表面已内置；生命周期接入取决于宿主 |
| 从所有厂商原生 Memory 一键导入 | 🧭 路线图；当前不作此承诺 |

这个区别很重要：ContextCanopy 已经能避免采用之后产生的新长期上下文继续被厂商锁定，也支持保留证据的引导式历史迁移；面向封闭 Memory 格式的自动导入器，是下一阶段最关键的迁移能力。

### 八个 Agent Skills

| Skill | 用途 |
|---|---|
| `capture-knowledge` | 先固化来源，再新建或更新一个原子 canonical 主题。 |
| `second-brain-attach` | 接入全新、重装或重置后的 Agent 宿主。 |
| `second-brain-sync` | 对齐共同规则，同时保留 Agent 独立角色。 |
| `second-brain-learn` | 从当前工作轨迹中吸收可复用经验。 |
| `second-brain-distill` | 从明确选中的历史对话中榨取长期价值。 |
| `second-brain-climb` | 维护有证据支撑的长期方向模型。 |
| `second-brain-doctor` | 只读诊断安装、authority 和漂移。 |
| `second-brain-help` | 解释系统，并把需求路由到最小正确 Skill。 |

### 九个 MCP 工具

- **知识：**`search_knowledge`、`get_entry`、`list_entries`、`capture_from_conversation`
- **个人 AI authority：**`get_common_rules`、`get_agent_profile`、`get_mountain_context`
- **Skill 发现：**`list_second_brain_skills`、`read_second_brain_skill`

MCP 只暴露固定根目录，不提供任意文件系统访问，并拒绝路径穿越与逃逸 symlink。语义判断仍由 Skills 与当前 Agent 负责；服务端不会调用外部模型，也不会成为第二套 authority。

### 可编译 Vault 治理

内置 compiler 会检查：

- 必要元数据和诚实的新鲜度；
- canonical 唯一 owner 与原子范围；
- unresolved、ambiguous、self、inbound 与 outbound 链接；
- 图谱连通性和 orphan；
- 来源覆盖、反链与内容哈希；
- 确定性的 `INDEX.md` 和 `SOURCE-COVERAGE.md`；
- 所有变更 canonical 页的原子性复核记录。

## 仓库结构

```text
context-canopy/
├── AGENTS.md       # 公开根入口与隐私边界
├── vault/          # Obsidian 兼容证据层 + canonical 上下文图谱
├── mcp/            # 本地 stdio MCP 服务 + 事务写入器
├── skills/         # 八个可迁移 Agent Skills
├── docs/assets/    # TonyRainforest 品牌资产
└── .github/        # CI、安全与贡献表面
```

公开仓库只是干净的分发模板。个性化 Vault 会成为独立 authority，应当只留在本地或使用单独的私有 remote。

## 你可以亲自运行的验证

```bash
# Vault compiler + lint + MCP 测试套件
npm test

# 复制完整种子 Vault，通过 stdio 操作 MCP，并证明原 Vault 字节未改变
npm run smoke

# 模块、打包与依赖检查
cd mcp
node --check index.js
node --check lib/vault-writer.js
npm pack --dry-run
npm audit --audit-level=low
```

所有测试均在临时副本上执行，不得修改真实个性化 Vault。CI 会在每次 push 和 pull request 上运行同一组核心检查。

## 诚实的限制与路线图

- **导入适配器：**为厂商导出包和原生 Memory 文件增加 preview-first 导入器，并保留来源身份与 supersession 历史。
- **宿主证据：**基于真实全新宿主安装证据发布带版本的兼容矩阵，而不是只看配置文件是否存在。
- **迁移 fixture：**增加可复现的 Agent A → ContextCanopy → Agent B 验收场景。
- **大规模检索：**保持 Markdown 图谱为 canonical，同时允许更大 Vault 使用可删除、可重建的可选索引。

ContextCanopy 有意使用明文文件，它不是加密存储。Local-first 能减少暴露面，但不能替代文件系统权限、加密备份、秘密卫生和谨慎的 remote 配置。

## 常见问题

<details>
<summary><strong>这是不是又一个向量数据库？</strong></summary>

不是。可以增加检索层，但长期 authority 是带来源、owner、关系和新鲜度的可编译 Markdown；任何未来索引都必须可以删除和重建。
</details>

<details>
<summary><strong>所有 Agent 最后会不会变成同一个 Agent？</strong></summary>

不会。通用用户上下文与 Agent 独立角色分别有自己的 owner。共享“你是谁”不应该抹掉每个 Agent 擅长什么。
</details>

<details>
<summary><strong>现在能自动导入我所有 ChatGPT 或 Claude Memory 吗？</strong></summary>

还不是通用的一键导入。当前可以对能够取得的对话、导出、规则和笔记进行保存与引导式榨取；厂商原生导入适配器属于路线图。
</details>

<details>
<summary><strong>为什么不直接维护一段很长的 system prompt？</strong></summary>

因为 prompt 无法提供来源链、唯一 owner、原子更新、新鲜度、图谱完整性、事务回滚，以及通用上下文与 Agent 角色的安全分离。
</details>

## 项目名称与兼容性

**ContextCanopy** 是公开品牌。v1 继续保留现有 `second-brain-*` Skill ID、MCP 配置键和 `SECOND_BRAIN_*` 环境变量作为兼容 namespace；没有迁移路径时不会随意改名。

## 参与贡献

当前最有价值的贡献方向是：导入适配器、带全新会话证据的宿主接入说明、跨 Agent 迁移 fixture、对抗性文件系统测试和更清楚的 onboarding。

如果 Memory 锁定曾经让你不敢换到更好的 Agent，欢迎[告诉我们你最想先迁移哪一种上下文来源](https://github.com/YusenZhang0601/context-canopy/issues/new?template=feature_request.yml)。如果你认同这个方向，一个 ⭐ 会帮助更多人发现这条用户自有的替代路线。

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，遵守 [Code of Conduct](CODE_OF_CONDUCT.md)，并通过 [SECURITY.md](SECURITY.md) 报告安全问题。欢迎在 [GitHub Issues](https://github.com/YusenZhang0601/context-canopy/issues) 中提出功能需求和设计讨论。

## License

[MIT](LICENSE) © 2026 [TonyRainforest](https://github.com/YusenZhang0601)。

<div align="center">

**Agent 可以更换，你的上下文永远属于你。**

Built by **TonyRainforest · System Builder**<br />
Connect complexity. Create order. Evolve continuously.

</div>
