---
name: second-brain-doctor
description: "诊断一个 Agent 是否正确接入用户的 Second Brain：检查权威文件、通用与 Agent 专属投影、全部七个 Second Brain Skills、薄 MCP 连通性与 allowlist、local-only 或 private-remote Git 边界、漂移、过时旧 owner 和全新会话行为。用户询问是否健康、装好、连接、同步、可迁移或正常工作，完成 Attach/Sync 后，或 Agent 行为不符合既有偏好时使用。默认只读。"
metadata:
  display_name: "Second Brain - Doctor（检查接入、注入和同步状态）"
---

# Second Brain - Doctor（检查接入、注入和同步状态）

用真实证据判断当前 Agent 是否接到了同一个“我”。默认只读：不要自动修复、写 LOG、重建派生文件、修改宿主配置、提交 Git 或更新 receipt。发现 drift 后把修复路由给 `second-brain-attach` 或 `second-brain-sync`。

## 显式调用

- Codex：`$second-brain-doctor`，或从 `/skills` 选择。不要把字面量 `/second-brain-doctor` 报告为 Codex 原生命令。
- Claude、Hermes、AntiGravity：`/second-brain-doctor`。

## 状态词

每项只使用：

- `PASS`：用当前命令或内容证据证明符合 contract。
- `DRIFT`：authority 可读，但投影、版本或哈希不一致。
- `BLOCKED`：已知阻点使检查或能力不可用。
- `UNKNOWN`：没有足够证据，不猜测。
- `NOT-APPLICABLE`：当前宿主确实不使用该表面。

不要把“文件存在”提升为 `PASS`，也不要用旧 receipt 代替实时检查。

## 检查顺序

### 1. 识别现场

记录当前设备、宿主、版本、会话是否为 fresh session、Vault 路径和 MCP 路径。优先使用宿主官方版本/配置查询；不要输出可能含 token 的完整进程命令行或配置文件。

### 2. Vault authority

检查：

- 根 `AGENTS.md`、`90-System/SCHEMA.md`、`ONTOLOGY.md`、`WORKFLOWS.md`、`INDEX.md` 可读。
- `90-System/.capture.lock` 是否存在；存在只报告，不删除。
- `90-System/Personal-AI/COMMON-RULES.md` 可读且是唯一通用 owner。
- 当前 `90-System/Personal-AI/AGENTS/<agent-id>.md` 可读且保持独立角色。
- `03-Personal/Profile/个人AI协作体系.md` 与山脉 owner 可按权限最小读取。
- 实时 compiler、lint 和图谱检查结果。只读 Doctor 使用 `--check`，不使用 `--write-derived`。

### 3. 七个 Skills

以 Vault `90-System/Personal-AI/SKILLS/` 为 authority，验证七个精确 ID：

- `second-brain-attach`
- `second-brain-sync`
- `second-brain-learn`
- `second-brain-distill`
- `second-brain-climb`
- `second-brain-doctor`
- `second-brain-help`

逐个检查 frontmatter、宿主发现状态和 authority SHA。符号链接应解析到 owner；物理副本应与记录哈希一致。少一个就不是完整接入。检查宿主显示名带 `Second Brain -` 和中文注释。

### 4. 薄 MCP

调用 MCP 初始化与工具列表，再安全调用读取工具。预期能力包括：

- `get_common_rules`
- `get_agent_profile`
- `get_mountain_context`
- `list_second_brain_skills`
- `read_second_brain_skill`
- 既有知识搜索、捕捉和条目读取能力

验证 MCP 版本、Vault root、allowlist 越界拒绝、读取内容与 authority SHA。MCP 不应成为语义裁决器，不应调用外部推理 API、持有独立数据库或启动守护进程。只握手成功但无法读取 owner 应标为 `DRIFT` 或 `BLOCKED`。

### 5. 身份注入

读取宿主官方全局身份表面，只审计 Second Brain 管理块：

- 是否指向 COMMON-RULES 和当前 Agent profile。
- common 与 Agent-specific 是否分开。
- 是否写明本宿主真实 Skill 调用语法。
- 是否声明宿主记忆/cache 不是 authority。
- 委派给子 Agent 时是否传播必要的个人基底约束。
- 管理块外用户规则是否保持完整。

检查旧 `learn-from-conversations`、SkillOpt/Sleep、旧 second-brain 插件或宿主 memory 是否仍在竞争写入。兼容入口可以存在，但必须薄重定向到 `second-brain-learn`；旧程序不得自动运行。

### 6. Git authority 边界

只读检查：

- Vault 的 authority 模式明确为 `local-only` 或 `private-remote`。
- `local-only` 不发生远端写入，并有本地 commit 或可恢复备份；远端汇合标为 `NOT-APPLICABLE`，不能声称已具备跨设备同步。
- `private-remote` 的唯一可写 `origin` 已实时验证为 private，默认分支和本地基线关系明确，最近 authority 变化有短任务分支/PR 证据且 commit 归属授权账号。
- 公开 Release remote 只能作为只读 `upstream`；若它仍是个人数据的 push target，状态为 `BLOCKED`。
- 无永久设备分支、无第二个可写镜像远端、无后台同步进程。
- 工作树漂移和未跟踪文件已被明确分类；不要为“干净”擅自丢弃用户变化。
- 原始对话、秘密和 Git-external evidence 未被跟踪。

网络或认证不可用时标 `UNKNOWN/BLOCKED`，不要把本地 remote URL 当作远端隐私的证明；local-only 不因缺少 GitHub 账号而降级。

### 7. Fresh-session 行为

Attach 或 Sync 的完成门禁要求一个全新宿主会话。若当前就是专门启动的验收会话，验证它能：

1. 正确说出通用 owner、自己的 profile 和角色。
2. 列出七个 Skill 及真实显式调用语法。
3. 通过 MCP 读取 common/profile，而不是靠旧上下文背答案。
4. 将学习路由到 `second-brain-learn`，将历史批量清理路由到 `second-brain-distill`。
5. 不把缓存、SkillOpt 或某个厂商 Agent 当成长期“我”。

当前会话不是 fresh session 时，不要自证通过；把该项标 `UNKNOWN` 并给出宿主原生的新会话测试动作。

### 8. 秘密与权限卫生

检查配置权限和 Git tracked 内容是否可能泄露 token、密码、私钥或个人敏感原件。扫描结果只报告路径、类型和计数，不打印匹配值。凭据轮换是外部账号变化；除非用户明确授权，本 Skill 只报告应轮换的系统，不执行轮换。

## 宿主最小证据

- Codex：原生 Skill 列表/`/skills`、`$second-brain-doctor`、MCP 配置查询和全新 Codex run。
- Claude：`/skills`、`/mcp`、上下文规则来源和全新 Claude session。
- Hermes：`hermes skills list`、`hermes mcp test second-brain`、prompt size 与全新 CLI session。
- AntiGravity：插件目录结构、运行时新对话中的 Skill/MCP 实际调用；缓存文件只能作辅助证据。

只使用当前可用的宿主证据，不伪造跨宿主等价命令。

## 输出格式

先给一句总判定：`HEALTHY` 仅在全部必要项为 PASS；否则用 `DEGRADED` 或 `BLOCKED`。

随后给紧凑表格：检查面、状态、实时证据、影响、修复 Skill。最后列出：

- 当前 Agent 的独特角色是否保留。
- 哪些事实尚未验证。
- 最小修复动作与 fresh-session 验收命令。
- 是否存在需用户亲自处理的凭据轮换。

不要在 Doctor 中执行建议的修复。
