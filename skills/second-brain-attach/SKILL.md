---
name: second-brain-attach
description: "把全新、重装或重置后的 AI Agent 接入用户本地 Second Brain：安装七个 Second Brain Skills，连接薄 MCP，注入通用规则与该 Agent 的独立身份，并在全新会话中验证。用户要求安装、接入、迁移、初始化、恢复 Codex、Claude、AntiGravity、Hermes 或兼容 Agent，或者希望一个新 Agent‘变成我的形状’时使用，即使用户没有说出本 Skill 名称。"
metadata:
  display_name: "Second Brain - Attach（接入并注入新 Agent）"
---

# Second Brain - Attach（接入并注入新 Agent）

把一个陌生 Agent 接到同一个个人 AI 基底上。你负责执行宿主原生操作、留下证据并自检；本 Skill 只固化流程，不启动安装服务，不引入数据库、守护进程、外部推理 API 或规则编译器。

## 显式调用

- Codex：使用 `$second-brain-attach`；也可通过 `/skills` 选择本 Skill。不要声称 Codex 原生支持字面量 `/second-brain-attach`。
- Claude、Hermes、AntiGravity：使用 `/second-brain-attach`。
- 其他宿主：使用其原生 Skill 选择器，并报告真实调用方式。

## Authority

优先通过 MCP 的 `get_common_rules`、`get_agent_profile`、`list_second_brain_skills` 和 `read_second_brain_skill` 读取；MCP 尚未接通时，从本地 Vault 读取：

- `90-System/Personal-AI/COMMON-RULES.md`：跨 Agent 通用规则唯一 owner。
- `90-System/Personal-AI/AGENTS/<agent-id>.md`：该 Agent 的角色、能力边界和差异化配置唯一 owner。
- `03-Personal/Profile/个人AI协作体系.md`：用户与 AI 的长期协作身份。
- `90-System/Personal-AI/SKILLS/`：七个规范 Skill 的唯一 owner。
- 根 `AGENTS.md`：Vault 写入边界、门禁与指令层级。

宿主配置只是投影，缓存或宿主记忆只是候选，不得反向冒充 authority。更高优先级指令与用户当前明确要求始终优先。

## 输入与停止条件

确认或可靠发现以下信息：目标宿主、目标设备、Vault 本地路径、MCP 源码路径、宿主 Skill 目录和身份文件。只有会 materially 改变权限、隐私或账号的未知项才询问用户。

遇到以下情况立即停止写入并报告证据：

- Vault 的 `90-System/.capture.lock` 已存在。
- 已选择远端写入，但 Git/GitHub 写身份无法证明为用户授权账号。
- 将要覆盖不属于 Second Brain 管理块的宿主规则。
- 配置中出现 token、密码、私钥或恢复凭据，且操作会复制、打印或提交它们。
- 安装需要修改代理/TUN、系统保护或第三方账号权限，但本次未获明确授权。

## 接入流程

### 1. 发现而不是假定

1. 识别宿主和版本，读取其真实 Skill、全局规则与 MCP 配置机制。
2. 搜索现有 Second Brain Skill、MCP 和身份投影，区分“首次安装”“修复”“升级”。
3. 优先复用宿主原生注册机制。不要改造 Agent、fork Agent 或修改其 vendor 源码。
4. 区分公开分发仓库与个人 authority。公开 Release clone 只能作为模板或只读 `upstream`，不得接收个人画像、历史、规则或山脉的 push。
5. 在写入个人信息前确认 authority 模式：`local-only` 不做任何远端写入；`private-remote` 使用用户自己控制且已验证为 private 的唯一 `origin`。创建私有仓库或改变远端需要用户授权；未获授权时保留 local-only，不把远端缺失伪装成跨设备同步已完成。

### 2. 建立可恢复基线

1. 检查 Vault lock，并运行根 `AGENTS.md` 规定的只读 compiler 基线。
2. 对将修改的宿主配置逐文件备份到 Vault 外，保持原权限；只记录路径、大小和 SHA-256，不记录秘密值。
3. 检查 Git 工作树、当前分支、远端、authority 模式和认证身份。不要在脏工作树里吞掉用户变化，也不要把公开分发 `origin` 当成个人 authority remote。

### 3. 注册七个 Skills

使宿主发现以下规范 Skill，名称不可改写：

- `second-brain-attach`
- `second-brain-sync`
- `second-brain-learn`
- `second-brain-distill`
- `second-brain-climb`
- `second-brain-doctor`
- `second-brain-help`

优先使用指向 Vault authority 的链接或宿主支持的外部 Skill 目录；宿主只能使用物理副本时，复制后记录每个文件的源 SHA-256 和投影 SHA-256。不要让副本成为独立 owner。

### 4. 连接薄 MCP

用宿主原生 MCP 配置接入 `second-brain-mcp`。MCP 只负责受限读取、捕捉事务、锁和确定性校验；知识裁决、规则合并、爬山判断仍由当前 Agent 根据 Skills 执行。

验证至少包括：

- MCP server 可连接且协议握手成功。
- 工具清单包含通用规则、Agent profile、mountain、Skill 列表/读取与既有知识工具。
- 读取只能落在声明的 allowlist；不得扩大到任意本地文件。
- 不调用外部推理 API，不启动常驻进程。

### 5. 注入身份和规则

1. 读取 COMMON-RULES 与当前 Agent profile。
2. 只更新可识别的 Second Brain 管理块；首次接入时在宿主官方全局身份文件中创建短而清晰的管理块。
3. 注入内容必须包含 authority 指针、用户协作身份摘要、当前 Agent 的独特角色、Skill 显式触发方式、学习/同步路由和委派传播要求。
4. 保留宿主原有非冲突规则。发现冲突时，低风险的措辞去重可自动处理；权限、隐私、核心身份、删除策略或职责冲突属于高风险，先请用户裁决。
5. 不把 COMMON-RULES 全文复制到所有宿主；注入短投影并让 Agent 在任务开始时按需读取 owner。

### 6. 记录接入事实

在 `90-System/Personal-AI/RECEIPTS/` 写一份不含秘密的接入 receipt，至少包括：

- UTC 时间、设备标识、宿主和版本。
- Vault 与 MCP 路径、authority 模式、Git commit，以及公开 `upstream`/私有 `origin` 的实际边界。
- Skill 注册方式和七个 authority SHA-256。
- COMMON-RULES、Agent profile 与宿主管理块 SHA-256。
- MCP、Skill 发现、身份投影、Vault 门禁和新会话测试结果。
- 备份位置、已知限制、一个确切后续动作。

Receipt 是审计证据，不是配置 owner。

### 7. 新会话验收

启动全新宿主会话，显式调用 `second-brain-doctor`，并验证 Agent 能：

1. 说出通用 owner 与自己的 profile owner。
2. 正确区分通用偏好和本 Agent 角色。
3. 列出七个 Skills 及本宿主真实调用语法。
4. 经 MCP 读取通用规则和 profile。
5. 不把宿主记忆、旧 SkillOpt 程序或历史插件说成 authority。

只有新会话通过才宣布 attach 完成。

## Git 汇合

Vault authority 的变化先通过本地短期任务分支、diff、秘密扫描和门禁。`private-remote` 模式再通过私有 `origin` 的 PR 汇合，并验证远端 commit 归属授权账号；`local-only` 模式只保留本地 commit 与可恢复备份，远端同步标为 `NOT-APPLICABLE`，不得 push 到公开分发仓库。宿主本地配置不应误提交进 Vault。首次 authority bootstrap 可以直接建立主分支；之后不使用永久设备分支，也不运行常驻同步服务。

## 输出

先给结论，再列：已接入表面、验证证据、保留的宿主差异、未解决风险和确切下一步。不得把“文件已复制”当作“新 Agent 已接入”。
