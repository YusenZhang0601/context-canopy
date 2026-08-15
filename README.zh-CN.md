<div align="center">

<img src="docs/assets/tony-system-builder-banner.png" alt="TonyRainforest — System Builder" width="100%" />

<h1>ContextCanopy</h1>

<p><strong>换 Agent，不必换掉它已经认识的你。</strong></p>

<p>
  面向个人 AI 的可迁移、本地优先记忆与上下文层：<br />
  同一个人，多个 Agent，不再被 Memory 锁定。
</p>

<p>
  <a href="https://github.com/YusenZhang0601/context-canopy/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/YusenZhang0601/context-canopy/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://github.com/YusenZhang0601/context-canopy/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/YusenZhang0601/context-canopy" /></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-2ea44f.svg" /></a>
  <a href="https://modelcontextprotocol.io"><img alt="MCP" src="https://img.shields.io/badge/MCP-compatible-6f42c1.svg" /></a>
  <a href="https://obsidian.md"><img alt="Obsidian" src="https://img.shields.io/badge/Obsidian-ready-7c3aed.svg" /></a>
  <img alt="Local-first" src="https://img.shields.io/badge/authority-local--first-111827.svg" />
</p>

<p>
  迁移痛点 · 真实证据 · 三步上手 ·
  <a href="docs/landscape.zh-CN.md">对标研究</a> ·
  <a href="README.md">English</a>
</p>

</div>

---

## 为什么需要 ContextCanopy？

一个 AI Agent 越了解你，你就越难离开它。

你的偏好、项目历史、术语、决策方式、工作习惯和长期目标不断积累在对话与厂商 Memory 中。更好的 Agent 出现了，但迁移意味着重新教它一遍“你是谁”。于是，记忆变成了无意形成的厂商锁定。

**ContextCanopy 把长期上下文变成用户自己拥有的基础设施。**

| 没有它 | 使用 ContextCanopy |
|---|---|
| 每个 Agent 都建立一份割裂的“你”。 | 不同 Agent 认识同一个有证据的你。 |
| 换工具等于重建几个月的上下文。 | 新宿主接入同一份可迁移核心。 |
| Memory 藏在对话、缓存和厂商状态里。 | 长期上下文是可检查的 Markdown。 |
| 共享记忆容易把所有 Agent 压成一种角色。 | 共同上下文与 Agent 独立角色分开。 |

> ContextCanopy 不声称搬走模型隐藏的“灵魂”；它迁移的是本来就应该属于你的长期上下文。

## 迁移如何工作

```text
 对话 · 导出 · 笔记 · 研究 · 决策
                    │
           Capture / Learn / Distill
                    │
        ┌───────────▼───────────┐
        │  CONTEXTCANOPY CORE   │
        │ 身份 · 知识 · 目标    │
        │ 规则 · Skills · 证据  │
        └──────┬────────┬───────┘
               │        │
         Attach + Sync   │
               │        │
            Claude     Codex     未来 Agent
            独立角色    独立角色   独立角色
```

这份核心不是一段越来越长的 system prompt，而是三个边界清楚的层：

1. **证据层**：不可变原始材料，例如对话、论文、手册和导出文件。
2. **Canonical 上下文层**：原子化知识、偏好、决策和长期方向；每项只有一个 owner，并带来源、关系和诚实的新鲜度。
3. **宿主投影层**：共同用户规则加上每个 Agent 的独立角色，通过 Agent Skills 和轻量本地 MCP 接入。

它更像是**上下文的护照**：身份与经历可以迁移，但每个 Agent 仍保留自己的工作。

## 不是承诺，是证据

`npm run smoke` 会复制种子 Vault，先以 Claude 身份启动一个全新 MCP 进程，写入一次性知识卡，随后彻底关闭；再以 Codex 身份启动第二个进程。Codex 必须加载同一份共同规则、保留不同角色、搜索到并读回这张卡。Compiler 在前后运行，SHA-256 守卫证明原 Vault 字节完全未变。

```json
{
  "success": true,
  "cross_agent_handoff": {
    "source_agent": "claude",
    "target_agent": "codex",
    "fresh_server_processes": 2,
    "shared_common_rules": true,
    "distinct_agent_profiles": true,
    "entry_found_by_target": true,
    "entry_read_by_target": true
  },
  "copied_vault_compiler_check": "passed",
  "live_vault_unchanged": true,
  "temporary_copy_removed": true
}
```

这证明了可迁移核心能够跨越彼此隔离的本地客户端生命周期；它**不等于**已经能一键导入所有封闭厂商的原生 Memory。

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.10+ 与 PyYAML（`python3 -m pip install pyyaml`）
- 推荐使用 GitHub CLI 创建私人模板仓库
- Obsidian 可选；任意 Markdown 编辑器均可

### 1. 先建立安全的私人 authority

必须在写入个人信息**之前**完成。推荐做法会创建一个独立私有仓库，并把它作为唯一可写的 `origin`：

```bash
gh repo create my-context-canopy --private --template YusenZhang0601/context-canopy --clone
cd my-context-canopy
git remote add upstream https://github.com/YusenZhang0601/context-canopy.git

gh repo view --json nameWithOwner,visibility
git remote -v
```

确认 `visibility` 为 `PRIVATE`，且 `origin` 指向你的私有仓库。也可以点击 GitHub 的 **Use this template**，并选择 **Private**。

如果只在本地使用，应明确禁用向公开仓库推送：

```bash
git clone https://github.com/YusenZhang0601/context-canopy.git
cd context-canopy
git remote rename origin upstream
git remote set-url --push upstream DISABLED
git remote -v
```

不要用公开 fork 存放个人 Vault。

### 2. 安装并验证

```bash
python3 -m pip install pyyaml
npm ci --prefix mcp
npm test
npm run smoke
```

v1.0.1 的 MCP 包从仓库内 `mcp/` 源码安装；本项目不会把它宣传成已发布到 npm 的包。

### 3. 接入 Agent

在兼容 Agent 中打开仓库根目录，然后发送：

```text
请阅读 AGENTS.md 和 skills/second-brain-attach/SKILL.md，然后把当前宿主接入 ContextCanopy。
在确认 private 或 local-only authority 之前，不要写入个人信息。
安装仓库内置 Skills，配置本地 MCP，运行文档规定的检查，
最后用全新会话执行 Doctor 检查，并且只汇报真实验证过的结果。
```

## v1.0.1 实际提供什么

| 能力 | 已包含 |
|---|---|
| 可迁移连续性 | 多个独立 Agent 共享用户自有 Markdown authority |
| 有边界的学习 | Learn 与 Distill 只吸收有证据经验，并保护身份、隐私和权限边界 |
| 同一个人，不同 Agent | 共同规则加 Claude、Codex、AntiGravity、Hermes 独立角色 |
| 可编译知识图谱 | 原子 owner、类型关系、新鲜度、反链、来源链与确定性视图 |
| 本地 MCP 桥 | 9 个 allowlist 工具，覆盖知识、个人 AI authority 与 Skill 发现 |
| Agent 工作流 | 8 个 Skills：capture、attach、sync、learn、distill、climb、doctor、help |
| 可恢复 capture | 主页面、reciprocal、复核登记、编译与回滚处于一个事务中 |
| 隔离迁移证据 | 可复现的 Claude → ContextCanopy → Codex 双进程 smoke |

<details>
<summary><strong>展开查看 8 个 Skills 与 9 个 MCP 工具</strong></summary>

**Skills：**`capture-knowledge`、`second-brain-attach`、`second-brain-sync`、`second-brain-learn`、`second-brain-distill`、`second-brain-climb`、`second-brain-doctor`、`second-brain-help`。

**MCP 工具：**`search_knowledge`、`get_entry`、`list_entries`、`capture_from_conversation`、`get_common_rules`、`get_agent_profile`、`get_mountain_context`、`list_second_brain_skills`、`read_second_brain_skill`。

</details>

### 什么能迁移，什么不能

| 设计上可迁移 | 不会冒充可迁移 |
|---|---|
| 偏好、术语、规则和 Agent 角色 | 模型权重或厂商隐藏实现 |
| Canonical 知识、决策和来源链 | 凭据、权限或秘密值 |
| 长期目标和有证据的进展 | 当前对话的瞬时运行状态 |
| 可取得的导出、选定对话与笔记 | 厂商不提供的 Memory |
| 可复用 Skills 与宿主投影 | 未适配的宿主 UI 设置 |

## 它在这个领域的位置

ContextCanopy 不想成为又一个托管向量 Memory API，也不是 LifeOS 面板。它的核心定位是：**在彼此独立的 Agent 之间迁移一个人的受治理上下文**。

| 相邻类别 | ContextCanopy 的差异 |
|---|---|
| 厂商内置 Memory | 能比单一产品活得更久的用户自有上下文 |
| 向量 / 图 Memory | 人类可读 authority 与证据，而不只是检索 |
| 跨 Agent coding Memory | 不只迁移项目事实，还保持个人连续性 |
| Stateful Agent 平台 | 跨 Agent 连续性，而不是单个 Agent 的内部状态 |
| Obsidian / LifeOS 模板 | 可由 Agent 操作的上下文基底，而不是规划 UI |

详见带日期的[对标项目研究](docs/landscape.zh-CN.md)，其中对照了 Basic Memory、AgentCairn、Memorix、AMP、Mem0、Graphiti、Letta、LifeOS 等项目。

## 验证

```bash
# Vault compiler、lint 与 MCP 测试
npm test

# 在一次性完整 Vault 副本上执行双进程跨 Agent 交接
npm run smoke

# 打包与依赖卫生
cd mcp
node --check index.js
node --check lib/vault-writer.js
npm pack --dry-run
npm audit --audit-level=low
```

CI 直接验证声明的最低版本：Node.js 18 与 Python 3.10。

## 诚实的限制

- 历史迁移目前是有引导、保留来源的工作流；尚未提供通用的一键厂商导入。
- 每个真实宿主仍需要自己的全新会话接入证据。
- Canonical 层是明文文件，不是加密存储；请使用私有 remote、文件权限、加密备份与秘密卫生。
- v1.0.1 的搜索刻意保持简单；未来可以增加可删除的索引，但不能取代 Markdown authority。

## 项目名称与兼容性

**ContextCanopy** 是公开品牌。v1 保留 `second-brain-*` Skill ID 和 `SECOND_BRAIN_*` 环境变量作为兼容 namespace。

## 参与贡献

当前最有价值的贡献是 preview-first 导入适配器、带全新宿主证据的接入说明、迁移 fixture、对抗性文件系统测试和更简单的 onboarding。

如果 Memory 锁定曾阻止你尝试更好的 Agent，欢迎[告诉我们你最想先迁移哪一种上下文](https://github.com/YusenZhang0601/context-canopy/issues/new?template=feature_request.yml)。请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，遵守 [Code of Conduct](CODE_OF_CONDUCT.md)，并通过 [SECURITY.md](SECURITY.md) 报告安全问题。

## License

[MIT](LICENSE) © 2026 [TonyRainforest](https://github.com/YusenZhang0601)。

<div align="center">

**Agent 可以更换，你的上下文永远属于你。**

Built by **TonyRainforest · System Builder**<br />
Connect complexity. Create order. Evolve continuously.

</div>
