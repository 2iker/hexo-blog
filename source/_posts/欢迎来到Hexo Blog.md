---
title: 欢迎来到Hexo Blog
categories:
  - 随笔
tags:
  - 博客
  - 入门
description: 这是博客的第一篇文章，介绍本站的使用方式。
published: true
date: 2026-08-08 00:00:00
---
# 欢迎来到Hexo Blog

欢迎！这是你的个人博客网站。本站基于 **Hexo** 构建，支持：

- 📝 使用 Markdown 撰写文章
- 🏷️ 标签与分类浏览
- 🔍 站内搜索
- 💬 评论区（Giscus）
- 📊 Mermaid 流程图
- ➗ LaTeX 数学公式
- 🌙 黑夜/白天模式切换

## 如何写文章

在仓库的 `source/_posts/` 目录下新建 `.md` 文件，写好文章后提交推送到 GitHub，即可自动重新部署。

## Markdown 示例

### 代码块（支持一键复制）

```js
function greeting(name) {
  return `Hello, ${name}!`;
}

console.log(greeting("world"));
```

### 表格


| 功能     | 支持 |
| -------- | ---- |
| Markdown | ✅   |
| 代码高亮 | ✅   |
| 一键复制 | ✅   |
| 标签分类 | ✅   |
| 评论     | ✅   |

### 任务列表

- [X]  迁移到 Hexo
- [ ]  部署到 GitHub Pages
- [X]  配置主题

### 流程图（Mermaid）

{% mermaid %}
graph TD
A[写文章] --> B{是否发布?}
B -- 是 --> C[首页展示]
B -- 否 --> D[保存为草稿]
C --> E[读者评论]
{% endmermaid %}

### 数学公式（LaTeX）

行内公式：质能方程 $E = mc^2$，以及欧拉恒等式 $e^{i\pi} + 1 = 0$。

块级公式：

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

祝写作愉快！
