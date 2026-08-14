<div align="center">

<img src="docs/assets/tony-system-builder-banner.png" alt="TonyRainforest — System Builder" width="100%" />

<h1>ContextCanopy</h1>

<p><strong>同一个人，多个 Agent，一份持续生长的共同上下文。</strong></p>

<p>
  一个本地优先、可编译的个人 AI 基底：让你使用的每个 Agent 共享记忆、身份、目标、规则与证据，<br />
  同时不依赖不可见的云端黑箱 Memory。
</p>

<p>
  <a href="https://github.com/YusenZhang0601/context-canopy/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/YusenZhang0601/context-canopy/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-2ea44f.svg" /></a>
  <a href="https://modelcontextprotocol.io"><img alt="MCP" src="https://img.shields.io/badge/MCP-compatible-6f42c1.svg" /></a>
  <a href="https://obsidian.md"><img alt="Obsidian" src="https://img.shields.io/badge/Obsidian-ready-7c3aed.svg" /></a>
  <img alt="Local-first" src="https://img.shields.io/badge/local--first-Markdown-111827.svg" />
</p>

<p>
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a>
</p>

</div>

---

你的 AI 工具会变，但你的上下文不应该随之消失。

Claude、Codex、Cursor、ChatGPT、AntiGravity 以及未来的 Agent，不应该各自学习出一个彼此割裂、随时会丢失的“你”。ContextCanopy 给它们提供同一份可检查、可治理的持续上下文，同时保留每个 Agent 自己的角色与长处。

它是一个开源的个人 AI 记忆与知识系统，由纯 Markdown、兼容 Obsidian 的 Vault、宿主原生 Agent Skills、轻量 MCP 服务和确定性完整性检查共同组成。

## 为什么需要 ContextCanopy

多数 AI Memory 产品优化的是“找回来”。ContextCanopy 优化的是**你能亲自检查和治理的连续性**：

- **同一个你，不同 Agent 的自己。** Agent 共享用户上下文、长期方向和通用规则，但不被压成没有差异的同一种工具。
- **先保存证据，再提炼结论。** 原始材料与 canonical 图谱分离，每个结论都可以追溯，而不是只剩一句“AI 记得”。
- **先编译，再检索。** Agent 持续维护原子化、互相链接的 Markdown 知识，不把所有旧材料只当成向量切片。
- **有边界的学习。** 低风险、可复用经验可以沉淀；身份、隐私、权限和高影响变更仍由 owner 决定。
- **文件才是 authority。** 不强制依赖托管服务、专有 Memory、模型厂商或后台常驻进程。

## 它与常见方案有什么不同

| 对比对象 | ContextCanopy 的定位 |
|---|---|
| 闭源 AI Memory | 人类可读的 Markdown 才是 authority；模型和宿主随时可以更换。 |
| 向量记忆 / 临时 RAG | 检索仍然有用，但长期结论会被编译进带来源的 canonical 图谱。 |
| Obsidian 模板 | Vault 之外还有 Agent Skills、MCP 工具、事务写入器和编译器。 |
| LifeOS 或任务面板 | 它是连续性与知识基底，不是生活规划 UI，也不是自动任务编排器。 |
| 基础 LLM Wiki | 它增加了共享用户身份、独立 Agent 角色、长期“山脉”、跨宿主同步与写入门禁。 |
| 无边界的 Agent 自进化 | 学习必须有证据、受 owner 范围约束、可以恢复；不会暗中训练模型或改写核心身份。 |

ContextCanopy 受到 [Andrej Karpathy 的 LLM Wiki 构想](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)中“长期可复用产物”方向的启发，也参考了 [LifeOS](https://github.com/danielmiessler/LifeOS) 等项目对个人 AI 基础设施的探索。它是独立实现，重心不同：多 Agent 连续性、证据治理和可编译的个人知识图谱。

## 工作原理

```text
        Claude · Codex · Cursor · ChatGPT · AntiGravity · 其他宿主
                              │
                    宿主原生 Skills + MCP
                              │
                  ┌───────────▼───────────┐
                  │     ContextCanopy      │
                  │  规则 · 角色 · 目标    │
                  └───────────┬───────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
   不可变来源层           canonical Markdown       确定性检查
  论文 · 对话 · 手册      知识 · 感悟 · 个人信息    链接 · 新鲜度
      原始证据                共同上下文            来源 · 回滚
```

公开仓库只是干净的分发模板。个性化后的 Vault 才是你的 authority，它必须留在本地或单独的私有仓库中。

## 快速开始

### 环境要求

- Node.js 18 或更高版本
- Python 3.9 或更高版本，并安装 PyYAML（`python3 -m pip install pyyaml`）
- Obsidian 可选；任意 Markdown 编辑器均可

### 安装并验证

```bash
git clone https://github.com/YusenZhang0601/context-canopy.git
cd context-canopy

cd mcp
npm ci
cd ..

npm test
npm run smoke
```

随后可以把 `vault/` 作为 Obsidian Vault 打开，也可以直接在支持 Agent 的工作区中打开整个仓库。

### 让 Agent 自己完成接入

在仓库根目录把下面这段话交给兼容 Agent：

```text
请阅读本仓库的操作规则，把当前宿主接入 ContextCanopy。
写入个人信息前，先让我选择 local-only 或 private-remote authority。
安装仓库自带 Skills，配置本地 MCP，运行文档规定的检查，
并且只汇报真实验证过的结果。
```

Agent 应当自行识别宿主的真实调用语法。例如 Codex 使用 `$skill-name` 或 `/skills` 选择器；只有宿主确实支持时，字面斜杠命令才有效。

## 保护你的私人上下文

这个公开仓库是**分发源，不是个人 authority**。

添加个人画像、历史、规则或长期目标前，选择一种模式：

1. **Local-only**：个人 commit 与备份只留在自己的设备上，不执行 push。
2. **Private-remote**：公开仓库只作为只读 upstream；唯一可写 origin 必须是用户控制并已实时验证为 private 的独立仓库。

不要用公开 fork 存放个人 Vault。ContextCanopy 的工具会拒绝路径穿越和逃逸 symlink，但仓库隐私与 remote 配置仍由使用者负责。

## 内置能力

### 八个 Agent Skills

| Skill | 用途 |
|---|---|
| `capture-knowledge` | 先固化来源，再新建或更新一个原子主题。 |
| `second-brain-attach` | 接入全新或重装后的 Agent 宿主。 |
| `second-brain-sync` | 对齐共同规则，同时保留 Agent 独立角色。 |
| `second-brain-learn` | 从当前工作轨迹中提炼可复用经验。 |
| `second-brain-distill` | 从明确选择的历史对话中榨取长期价值。 |
| `second-brain-climb` | 维护有证据支撑的长期方向“爬山”模型。 |
| `second-brain-doctor` | 只读诊断安装、authority 和配置漂移。 |
| `second-brain-help` | 解释整个系统，并把需求路由到最小正确 Skill。 |

### 九个 MCP 工具

- **知识工具：** `search_knowledge`、`get_entry`、`list_entries`、`capture_from_conversation`
- **个人 AI authority：** `get_common_rules`、`get_agent_profile`、`get_mountain_context`
- **Skill 发现：** `list_second_brain_skills`、`read_second_brain_skill`

MCP 只开放固定根目录，不提供任意文件系统读取。Canonical 知识写入是一个事务：预检、来源保存、关系校验、反向关系更新、派生视图重建、最终编译检查和失败回滚处于同一失败边界。

### 可编译的 Vault 治理

内置编译器会检查：

- 必填 frontmatter 与诚实的 freshness；
- 唯一 canonical owner 与原子主题；
- 未解析、歧义、自环、无入链和无出链；
- 图谱连通性与孤岛节点；
- 来源覆盖、来源双链和内容哈希；
- `INDEX.md` 与 `SOURCE-COVERAGE.md` 的确定性一致；
- 所有变更 canonical 页的原子性复核登记。

## 仓库结构

```text
context-canopy/
├── vault/          # 兼容 Obsidian 的证据层与 canonical 知识图谱
├── mcp/            # 本地 stdio MCP 服务与事务写入器
├── skills/         # 八个跨宿主 Agent Skills
├── docs/assets/    # TonyRainforest 品牌资产
└── .github/        # CI 与贡献模板
```

## 验证

```bash
# Vault 编译器、linter 与 MCP 单元测试
npm test

# 隔离的完整 Vault stdio smoke test
npm run smoke

# 模块与打包检查
cd mcp
node --check index.js
node --check lib/vault-writer.js
npm pack --dry-run
npm audit --audit-level=low
```

测试只允许操作临时副本，不得修改真实的个性化 Vault。

## 项目名称与兼容命名

**ContextCanopy** 是公开项目和产品名称。v1 仍保留现有 `second-brain-*` Skill ID、MCP 配置 key 和 `SECOND_BRAIN_*` 环境变量作为兼容协议命名。它们是接口，不是公开品牌；没有迁移路径之前不会为了表面统一而贸然改名。

## 参与贡献

特别欢迎宿主适配、对抗性文件系统测试、更清晰的 onboarding、真实的种子图谱示例和跨平台修复。

请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，遵守 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)，安全问题按照 [SECURITY.md](SECURITY.md) 私下报告。功能建议与设计讨论可提交到 [GitHub Issues](https://github.com/YusenZhang0601/context-canopy/issues)。

## 开源协议

[MIT](LICENSE) © 2026 [TonyRainforest](https://github.com/YusenZhang0601)。

<div align="center">

由 **TonyRainforest · System Builder** 构建<br />
连接复杂，构建秩序，超越创造。

</div>
