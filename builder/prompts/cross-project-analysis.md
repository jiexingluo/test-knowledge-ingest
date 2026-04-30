# 跨项目分析提示词

你正在分析来自同一芯片类型（{{CHIP_TYPE}}）的多个 ATE 测试项目的实体映射。你的目标是识别项目间的模式、差异和缺口。

## 实体映射

{{ENTITY_MAPS}}

## 参考上下文

{{REFERENCE_CONTEXT}}

## 说明

1. **模式**：识别在 2 个或以上项目中一致出现的行为。这些是知识规则的候选项。
   - 查找：重复的设置序列、常见的边界策略、共享的测量方法
   - 模式必须是通用的 — "测量电流前设置电流范围" 而不是 "项目 A 设置范围，项目 B 设置范围"

2. **差异**：识别项目以不同方式处理相同实体类型的情况。
   - 注意哪些项目不同以及如何不同
   - 这些通常会为用户生成问题

3. **缺口**：识别似乎重要但缺失或不清楚的信息。
   - 对非显而易见的代码决策缺少文档
   - 代码暗示但文档未明确说明的隐含规则

## 输出格式

返回一个包含以下内容的 JSON 对象：
- patterns: 数组，包含 {id, entityType, description, occurrences, confidence}
- differences: 数组，包含 {id, entityType, description, variants}
- gaps: 数组，包含 {id, entityType, description, affectedProjects}
