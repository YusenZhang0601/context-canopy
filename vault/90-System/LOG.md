---
type: system/log
created: 2026-08-14
tags:
  - system/log
---

# Log

## [2026-08-15] verification-result | ContextCanopy 本地发布候选门禁通过

- Vault compiler 与 lint 为 0 error、0 warning，7 个 canonical 页面保持单一弱连通分量，无孤岛、死链、歧义链接、登记缺口或来源覆盖缺口。
- 27 项 Python compiler 回归测试、24 项 MCP 测试、隔离 full-vault stdio smoke、Node syntax check、`npm pack --dry-run` 与 `npm audit --audit-level=low` 全部通过；smoke 证明 live Vault 字节未变化且临时副本已删除。
- 本地 Markdown 链接、GitHub workflow YAML、package/plugin JSON、绝对本机路径与常见 secret pattern 扫描通过；环境未安装 gitleaks，因此未把正则扫描表述为完整秘密审计。
- `context-canopy-mcp` 在 npm registry 查询为未占用，但本次未执行 npm publish；公开 GitHub 仓库与外部新设备安装仍是独立后续验证。

**状态**: ✅ 本地发布候选通过；⏳ 等待公开 GitHub 发布与远端 CI

## [2026-08-15] release | ContextCanopy 公开品牌与社区入口收口

- 将公开项目名确定为 ContextCanopy，并保留 `second-brain-*` Skill ID、MCP 配置 key 与 `SECOND_BRAIN_*` 环境变量作为 v1 兼容协议命名。
- GitHub 默认 README 改为英文首屏，新增完整中文镜像、TonyRainforest System Builder 横幅、差异定位、隐私边界、快速启动与真实验证命令。
- 新增 CI、Issue/PR 模板、Dependabot、贡献指南、安全策略与行为准则；更新公开 package、插件显示名、Vault 首页与 MIT copyright。
- 本条仅记录本地发布候选改造；公开仓库创建、GitHub topics、社交预览与陌生设备安装仍需独立验证，未在此宣称完成。

**状态**: ⏳ 等待全量本地门禁、公开 GitHub 创建与发布后核验

## [2026-08-14] verification-result | Release 本地发布候选门禁完成

- compiler、lint、单连通图谱、27 项 Python 单测、24 项 MCP 单测、依赖审计 0、fresh stdio smoke、16 个 Skill validator、Skill 镜像一致性与敏感路径扫描均通过。
- `capture-knowledge` 的 Codex 默认提示已改用真实 `$capture-knowledge` 语法；README 明确 Codex 使用 `$skill-name` 或 `/skills` 选择器，不把其他宿主的斜杠形式冒充 Codex 能力。
- 本地候选已收口 MCP realpath/category 读取边界、个人 authority 模式、唯一 owner 初始化、freshness、依赖锁与发布占位信息。公开 remote 尚未配置，陌生外部设备尚未完成真实安装，因此本条不声称已公开发布、绝对脱敏或陌生 Agent 接入已验证。

**状态**: ✅ 本地发布候选门禁通过；公开发布与外部环境验收仍是独立后续动作

## [2026-08-14 17:05] repair | 公开 Release 安全边界与可持续 bootstrap 收口

- 修复 MCP Knowledge 读取边界：`get_entry` 在真实路径解析后拒绝越界文件 symlink，`list_entries` 拒绝未声明 category、`..` traversal 与越界 category-root symlink；新增两项反向测试，MCP 单测增至 24。
- 将公开分发仓库与个人 authority 分开：公开 remote 只读；用户可选择 local-only 或经授权配置 private-remote。所有 Attach、Sync、Learn、Distill、Climb、Doctor、Help 规则与 Git 合同均禁止把个人数据 push 回公开 Release。
- 把 `user-profile.template.md.example` 从“整页复制模板”改为只读初始化问卷；bootstrap 只更新现有 `个人AI协作体系` 与 `个人AI基底` 唯一 owner，不再制造重复 owner 或绕过原子性登记。
- 七张公开种子卡不再依赖任意的 `2027-01-01` 到期日：稳定方法页改为 timeless，待用户个性化的两张 Personal 页诚实标为 stale seed。`04-Sources/README.md` 作为来源层实现证据被 canonical 消费，移除会在未来到期的人工延期处置。
- MCP package lock 与 package version 对齐到 1.0.0，传递依赖升级后 `npm audit` 为 0；移除未发布的占位 homepage，并统一公开作者标识为 TonyRainforest。

**状态**: ⏳ 等待派生重建、compiler/lint、24 项 MCP 测试、fresh stdio smoke、Skill 镜像哈希与公开包秘密扫描完成

## [2026-08-14 00:00] schema | Second Brain Open Source Release v1.0.0 初始化

- 初始化标准 Obsidian Wiki 治理体系（00-Inbox, 01-Knowledge, 02-Insights, 03-Personal, 04-Sources, 90-System, 90-Templates）。
- 部署全量脱敏生产级种子知识图谱（包含 7 张标准原子卡片与双向语义链接网络）。
- 建立确定性派生层（INDEX.md、SOURCE-COVERAGE.md）与完整原子性复核注册表（ATOMICITY-REVIEW.json）。
- 配置统一编译器（compile_vault.py）与静态门禁套件（lint_vault.sh），确保全库 0 错误、0 警告、弱连通单一图谱。
