---
title: Karpathy 的 AI 编程四原则
date: 2026-08-11
categories: [技术]
tags: [AI, Claude Code, Karpathy, 编程方法论]
description: 基于 Andrej Karpathy 对 LLM 编程的观察，提炼出四条实用原则，以及它们如何改变你与 AI 协作的方式。
published: true
---

# Karpathy 的 AI 编程四原则

Andrej Karpathy（前 Tesla AI 总监、OpenAI 创始成员）在 X 上分享了他对 LLM 编程的观察，有人据此整理了一套 `CLAUDE.md` 指南。这四条原则不复杂，但每一条都直击 LLM 协作的痛点。

## 背景

Karpathy 的核心观点是：

> "模型会猜测你的意图，然后不假思索地执行。它不会质疑你的要求，不会发现矛盾，不会展示不确定性，在应该说'我不知道'的时候也会编造答案。"

> "最好的合作者会让复杂的 API 变得简单。最差的合作者让简单的任务变复杂。一个 100 行能搞定的需求，不应该被实现成 1000 行的防御性架构。"

> "经常会在对话中删除自己看不惯的大段注释，即使这些注释与当前任务无关。"

这些观察指向一个事实：**LLM 是高效的执行者，但不是好的思考者**。你需要用明确的规则来弥补这个差距。

## 四条原则

### 1. 先想再写

**不要假设。不要隐藏困惑。明确说出不确定的地方。**

LLM 的默认行为是选一个方案然后直接执行。这条原则强迫你停下来：

- **有不确定的地方就说**，而不是默默选择一个假设
- **有多种方案时列出来**，而不是悄悄选一个
- **更简单的方案存在时指出来**，而不是过度设计
- **不确定时停下来问**，而不是硬着头皮继续

实际操作：在让 AI 写代码之前，先问自己——"我真的知道要什么吗？"如果答案是"大概知道"，先把"大概"的部分搞清楚。

### 2. 简单优先

**最少代码解决问题。不要过度设计。**

对「简单」的定义：

- 不做请求之外的功能
- 不为一次性的代码创建抽象
- 不预留未来可能的"扩展"或"配置项"
- 不为不可能出错的场景写错误处理
- 如果 200 行能写完，就不要写 500 行

**自检标准**：资深工程师看到这段代码会不会觉得"过度设计了"？如果会，简化。

这一条在 AI 编程中尤其重要。LLM 倾向于"防御性编程"——它会假设一切可能出错，然后为每种情况写处理逻辑。结果就是代码膨胀、难以理解。你需要明确告诉它：不要这样做。

### 3. 精确改动

**只动必须动的。只清理自己造成的混乱。**

编辑已有代码时：

- 不要"顺手改进"旁边的代码、注释或格式
- 不要重构没有坏掉的东西
- 匹配现有风格，即使你更喜欢另一种
- 如果看到无关的死代码，提一下但不要删除

当你的改动产生孤儿代码时：

- 删除你的改动导致的无用导入/变量/函数
- 不要删除预先存在的死代码，除非被要求

**自检标准**：每一行改动都应该能直接追溯到用户的需求。

这一条对抗的是 LLM 的"洁癖"——它看到代码就想重构，看到注释就想改写，看到格式不统一就想格式化。结果一个简单的改动变成了大规模重构，引入新的 bug。

### 4. 目标驱动执行

**定义成功标准。循环直到验证通过。**

把任务转化为可验证的目标：

| 原始需求 | 转化为 |
|---------|-------|
| "加上验证" | "为无效输入写测试，然后让它们通过" |
| "修复 bug" | "写一个复现 bug 的测试，然后让它通过" |
| "重构 X" | "确保重构前后测试都通过" |

对于多步骤任务，说清楚计划：

```
1. [步骤] → 验证: [检查项]
2. [步骤] → 验证: [检查项]
3. [步骤] → 验证: [检查项]
```

明确的成功标准让 LLM 能够独立循环执行。模糊的标准（"让它能用"）需要不断澄清。

## 为什么这些原则有效

LLM 是一个"目标导向的循环执行器"——你给它一个目标，它会反复尝试直到达到（或它认为达到了）。关键在于：

1. **你定义的目标必须精确**，否则它会在错误的方向上越走越远
2. **你必须提供验证方式**，否则它无法判断自己是否成功
3. **你必须限制它的自由度**，否则它会添加不必要的复杂性

这四条原则本质上是在做一件事：**用人类的判断力约束 AI 的执行力**。

## 实际应用

我在自己的博客项目中实践了这些原则，效果明显：

- **先想再写**：在让 AI 改 CSS 之前，先让它读完整的 DOM 结构，理解堆叠上下文再动手
- **简单优先**：AI 想给播放器加移动端底部栏，我拒绝了——问题只是侧边栏没显示，不需要新组件
- **精确改动**：AI 改 CSS 时重复执行了三次导致代码重复，这正是违反"精确改动"的典型例子
- **目标驱动**：明确说"文章目录模式隐藏播放器，站点概览模式显示"，而不是"让播放器显示正常"

## 写在最后

这些原则不是什么高深的理论，就是好的工程习惯。只不过在 AI 时代，这些习惯变得更加重要——因为你面对的不是人类同事（会自己判断、会质疑、会说"这太复杂了"），而是一个**全力执行你所有指令**的机器。

你给它模糊的指令，它给你模糊的结果。你给它精确的指令，它给你精确的结果。

问题从来不在 AI 能力不够，而在**你的指令不够好**。

## 附：CLAUDE.md 完整模板

以下是可以直接复制到你项目根目录的 `CLAUDE.md` 文件内容（英文原版）：

```markdown
# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
```

使用方式：将上述内容保存为项目根目录下的 `CLAUDE.md` 文件即可。Claude Code 会自动读取并遵循这些规则。

> 原始仓库：[andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)
