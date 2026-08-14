# Personal AI Git 汇合合同

## 目标

个人 authority 有两种合规模式：`local-only` 使用本地 Git 历史与可恢复备份，不做远端写入；`private-remote` 使用用户控制且实时验证为 private 的唯一可写 `origin` 做跨设备汇合。公开 Release 仓库只分发代码与种子模板，可作为只读 `upstream`，绝不能接收个人画像、历史、规则或山脉。Git 负责版本、分支与文本 merge；Agent 负责 authority、语义、隐私和门禁。

## 初始化模式

1. 在首次写入个人数据前，让用户选择 `local-only` 或 `private-remote`。
2. 若 clone 来自公开 Release，先把它识别为 distribution remote。未经用户授权，不创建私有仓库、不改可写远端，也绝不把个人变化 push 回公开仓库。
3. `private-remote` 应使用新建或既有的私有个人仓库作为 `origin`，公开 Release 可保留为只读 `upstream`；写前通过托管平台 API/CLI 验证 private，不能只看 URL 猜测。
4. `local-only` 必须有本地 commit 与 Vault 外可恢复备份；该模式不声称远端灾备或跨设备同步已经完成。

## 每次写入前

1. 确认工作目录和当前项目 authority。
2. `git status --short` 检查用户未提交工作；不得覆盖或夹带无关变化。
3. `private-remote` 获取 `origin/main`；`local-only` 使用本地已验收 main。从该基线建立短期意图分支：`learn/*`、`distill/*`、`sync/*`、`climb/*` 或 `system/*`。
4. `private-remote` 确认可写 `origin` 唯一且为 private，Git 活动账号为用户已验证账号，author/committer 使用该账号已验证邮箱。公开 `upstream` 不计作可写镜像。

## 提交与 PR

1. 先运行目标 owner 的本地门禁。
2. 只暂存精确范围；检查 staged paths、diff 和 secrets，不盲目暂存整棵树。
3. 一个 commit 只表达一个可回滚变化。
4. `private-remote` 推送短期分支并创建 PR，说明意图、owner、证据、风险和真实检查；`local-only` 不运行 push 或 PR，只保存本地已验收 commit 和备份证据。
5. 低风险、无冲突、门禁全绿的普通沉淀可按当前模式自动合并；权限、隐私、删除范围、核心 Agent 定位、山顶定义或语义冲突必须等待用户。
6. 合并后删除短期分支。公开 Release remote 始终保持只读。

## 冲突

- 同一行冲突：读取共同祖先和两边完整上下文，不机械选一边。
- 文本不冲突但 owner、标题、alias、规则范围或核心主张重叠：按语义冲突停止自动合并。
- `LOG.md` 并行追加：两边都保留，按真实事件顺序整理。
- `INDEX.md` / `SOURCE-COVERAGE.md`：不拼结果，先合正文和治理输入，再由 compiler 重建。
- 分支落后：先整合 `origin/main`，重建派生视图并重跑门禁。

## 明确边界

- 不建长期设备分支，不配置常驻 sync 或 force push 工作流。
- 原始对话、附件原料、缓存、凭据和不宜永久保存的敏感原文不进入 Git 历史。
- private-remote 无平台级 branch protection 时，由 Skills 共同执行本合同；local-only 的缺点是没有远端灾备和跨设备汇合，必须诚实报告。
