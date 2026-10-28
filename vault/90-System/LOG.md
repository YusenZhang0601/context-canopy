---
type: system/log
created: 2026-08-14
tags:
  - system/log
---

# Log

## [2026-10-27] release | ContextCanopy v1.1.0 三层主图谱 BM25F 检索引擎与 1-Hop 关系感知升级

- `mcp/` 升级至 `v1.1.0`：新增零外部依赖 `mcp/lib/search-engine.js`，基于 Node 原生 `Intl.Segmenter('zh-CN', { granularity: 'word' })` + CJK Bigram 回退与英文词干归一化，构建 6 域 BM25F（`title`/`aliases`/`summary`/`headings`/`tags`/`body`）加权检索引擎与进程内 `mtimeMs` 图谱缓存。
- `search_knowledge`、`get_entry`、`list_entries` 只读检索与读取范围正式覆盖三层 canonical 主图谱（`01-Knowledge`、`02-Insights`、`03-Personal`），严格校验各层根目录 `realpathSync` 防越界；公共 MCP 写入仍严格锁定在 `01-Knowledge`。
- `search_knowledge` 彻底剥离 YAML frontmatter 噪音，返回纯净正文高密度片段与 `layer`、`freshness`、`review_after`、`confidence`、`card_form`、`summary`、`matched_fields`；`get_entry` 新增 1-Hop `outbound_relations` 与 `inbound_relations` 双向关系展开。
- 更新 `COMMON-RULES.md` 的 MCP 检索路由指引，并同步收敛 `second-brain-learn` 的宿主原生 `/learn` 边界。

**状态**: ✅ 公开模板 compiler/lint、25 项 MCP 单测、隔离 full-Vault stdio smoke 与 Skill 双镜像一致性全部通过

## [2026-08-23] governance | Learn 活动规则净优化进入公开模板

- 将 Learn 从只追加经验改为显式状态转换：`add`、`reinforce/no-op`、`correct`、`narrow`、`broaden`、`replace`、`merge`、`relocate` 或 `retire`；新证据必须按 authority、范围与证明强度审计，不能只凭时间覆盖旧证据。
- 项目级学习必须进入项目唯一 owner 和真实自动注入入口；被替代正文退出活动投影，历史保留在 Git、LOG、receipt 或不可变来源。
- Sync 同步清理失效投影；Doctor 新增重复 owner、旧规则残留、tombstone、任意体积阈值与缺少负向退出测试的诊断。
- 公开模板继续保持 `local-only` / `private-remote`、公开 Release 只读、隐私、权限与凭据边界；没有复制任何私有 Vault 规则、个人画像或项目事实。

**状态**: ⏳ 等待 Skill 双镜像、行为 eval、全量 Release 门禁、公开 PR 与 v1.0.2 新鲜克隆验收

**状态更新（2026-08-23）**: ✅ Release 候选已完成 16 个 Skill 包校验、Vault compiler/lint/graph、27 项 compiler 单测、24 项 MCP 单测、隔离 full-Vault stdio smoke、Node syntax、MCP 1.0.2 dry-run 打包与 `npm audit`；七个 installable/Vault Skill 镜像均字节一致。全新 Vault cwd 的直接注入实验输出 `RELEASE_ACTIVE_RULE_NET_OPT_PASS`，实际读取 Release Learn Skill 的独立只读评估也正确选择 `correct/replace`、唯一 `AGENTS.md` owner、`CLAUDE.md` 薄导入和正负向 fresh-session 验收。变更 diff 未命中凭据形状或私有绝对路径；全树唯一 secret-shape 命中来自 compiler 的合成秘密拒绝测试，未安装 gitleaks，因此不声称完成 gitleaks 扫描。等待公开 PR、远端 CI、tag、Release asset 与 tag 新鲜克隆复验。

## [2026-08-15] release | ContextCanopy 公开仓库完成发布

- 公开仓库已发布至 `https://github.com/YusenZhang0601/context-canopy`，默认分支为 `main`，仓库保持 public，并启用 Template repository 属性。
- GitHub 已将首个公开提交 `8e24c645635887cff9f0a0bc4a62b0d4d59eb69e` 的 author 与 committer 关联到 `YusenZhang0601`；对应主分支 CI 与依赖更新检查均成功。
- 配置 17 个检索 topics，覆盖 personal AI、Agent memory、second brain、local-first、Markdown、knowledge graph、LLM Wiki、Obsidian、MCP、多 Agent 与 privacy-first 等实际定位。
- Dependabot 的 MCP SDK `1.29.0` → `1.30.0` 更新仅改 package 与 lockfile，Pull Request #1 独立 CI 成功后以 squash 合并为 `d6d9694e68d4b4871bb7a50e85c37221a0720bae`。
- TonyRainforest GitHub 个人主页已新增 ContextCanopy 入口；README 首屏已在 GitHub 确认横幅、项目名、定位、徽章与中英文入口可渲染。
- 本次未执行 npm publish、GitHub Release、真实个人 Vault 上传或陌生设备安装；这些状态不得由本条发布记录替代。

**状态**: ✅ GitHub 公开发布完成；⏳ npm 发布与陌生设备安装未执行

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
