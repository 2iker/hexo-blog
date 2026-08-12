---
title: APlayer + 开源 API：音乐播放器搭建笔记
date: 2026-08-13 03:40:00
categories: [技术]
tags: [音乐, API, JavaScript, Vercel]
description: 用 APlayer 和开源 API 搭建在线音乐播放器，纯静态页面，零运维部署。
published: true
---

# APlayer + 开源 API：音乐播放器搭建笔记

一直想做个在线听歌的页面，不想装客户端，也不想去各种音乐网站来回切。正好 APlayer 开源播放器做得不错，就动手搭了一个。

## 整体思路

拆成两个独立项目：

- **music-api**：部署在 Vercel 的 Serverless Function，负责调用上游音乐 API 拿搜索结果和播放链接
- **html5-music-player**：纯静态前端，调用 API 搜索，用 APlayer 播放

前后端分离，各自独立部署，互不影响。

## music-api：搜索接口

整个项目就一个文件 `api/search.js`，177 行。支持网易云、QQ 音乐、酷狗、酷我四个平台。

### 用法

```
GET /api/search?keyword=周杰伦&type=netease&page=1
```

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `keyword` | 搜索关键词 | 必填 |
| `type` | 平台 | `netease` |
| `page` | 页码 | 1 |

返回统一格式：

```json
{
  "code": 200,
  "data": [
    { "id": "xxx", "name": "晴天", "artist": "周杰伦", "album": "叶惠美", "url": "播放链接", "platform": "netease" }
  ],
  "total": 10
}
```

### 怎么实现的

每个平台有自己未公开的搜索 API，直接调用会被跨域和 Referer 校验拦住。所以用 Vercel Serverless Function 做中转：服务端请求上游接口，伪装 Referer 和 User-Agent，拿到结果后归一化成统一格式返回给前端。CORS 头手动设置 `Access-Control-Allow-Origin: *`，前端直接 fetch 就行。

## html5-music-player：播放器

纯静态页面，不需要 Node 环境，不需要 `npm install`，双击 `index.html` 就能跑。

### 技术选型

- **APlayer 1.10.1**：开源 HTML5 音乐播放器，支持列表模式和滚动歌词
- **原生 JS**：没有用框架，逻辑都在一个 `script.js` 里，266 行
- **深色毛玻璃 UI**：`backdrop-filter: blur` + 三层旋转渐变动画

### 核心功能

1. **搜索**：输入关键词回车，调 API 拿结果
2. **播放**：APlayer 接管，自动开始播放搜索结果
3. **歌词**：每首歌异步请求 LRC 歌词，APlayer 内置歌词滚动同步
4. **分页**：点"载入更多"加载下一页，动态追加到播放列表
5. **容错**：播放失败自动跳下一首，搜索超时 15 秒

### 界面效果

深色主题，半透明卡片加模糊背景，三层渐变色做动态背景。响应式布局，手机上也能正常用。支持 `prefers-reduced-motion` 媒体查询，系统设置了减少动画会自动关闭背景动效。

## 部署

两个项目都扔在 Vercel 上，push 到 GitHub 自动部署，免费额度完全够用。前端直接调后端 API，不需要额外配置代理。

整个方案零运维，适合个人自用。
