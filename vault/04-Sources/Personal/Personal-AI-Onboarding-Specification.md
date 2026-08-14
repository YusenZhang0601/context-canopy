# 个人 AI 接入与配置规范 (Personal AI Onboarding Specification)

本文档规范用户本地环境接入个人 AI 基底的标准流程与多 Agent 协同体系。

## 1. 多 Agent 协作范式

在现代工程实践中，用户通常会使用多种 AI 工具（如 Claude Code, Cursor, AntiGravity, Codex, Hermes）。
- **共同的“我”**：所有 Agent 共享同一个用户身份事实库、长期目标（山脉）与全局约束（COMMON-RULES）。
- **各自的“自己”**：每个 Agent 根据自身平台特色承担特定职责（例如：IDE 内浏览与操作、高强度 CLI 编译与重构、长篇架构分析）。

## 2. 爬山模型 (Climb Model)

长期目标管理采用结构化的 15 项爬山模型：
1. 山顶定义（Summit）
2. 当前位置（Current Height）
3. 差距与阻力（Gaps & Blockers）
4. 候选路线（Candidate Routes）
5. 关键验证行动（Next Information Action）
6. 检查点与真实工作链接

## 3. 安全与权限准则

- 敏感凭据（Token, API Key, 私钥）严禁进入知识库主图谱与 Git 追踪。
- 所有 Agent 对外部系统的写操作均遵循最小权限与用户授权原则。
