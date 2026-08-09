---
title: 在 Next.js 中构建 Markdown 博客
date: 2026-08-07
categories: [技术]
tags: [Next.js, Markdown, 教程]
description: 介绍这个博客的技术架构：文件系统存储文章、API 路由、管理后台认证。
published: true
---

# 在 Next.js 中构建 Markdown 博客

这个博客的后端非常简单：**文章就是 `content/posts` 目录下的 Markdown 文件**，配合 `gray-matter` 解析 frontmatter 元数据。

## 文章存储

每篇文章是一个 `.md` 文件：

```markdown
---
title: "文章标题"
date: 2026-08-07
description: "摘要"
category: "技术"
tags: [Next.js]
published: true
---

这里是正文内容……
```

## 渲染管线

文章正文使用 `react-markdown` + `remark-gfm` + `rehype-highlight` 渲染，支持表格、任务列表和代码高亮。

## 管理后台

- 登录使用密码（配置在 `ADMIN_PASSWORD` 环境变量）
- 登录后发放一个带签名的 HTTP-only Cookie
- 所有写操作 API 都会校验管理员身份

## 评论存储

评论写入 `data/comments.json`，通过 `/api/comments` 接口读写，适合轻量部署场景。

```ts
const postsDir = path.join(process.cwd(), BLOG_DIR);

export function getAllPosts(): PostMeta[] {
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  // ...
}
```

## 总结

这套架构的优点：**零数据库依赖、内容即文件、易于迁移和备份**。对于个人博客来说非常够用了。
