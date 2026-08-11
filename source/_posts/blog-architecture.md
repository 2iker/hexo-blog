---
title: 博客技术架构介绍
date: 2026-08-09 14:00:00
categories: [技术]
tags: [Hexo, NexT, 博客搭建, hexo-pro]
description: 介绍本站的技术架构、hexo-pro 后台管理、自写音乐播放器和部署流程。
published: true
---

# 博客技术架构介绍

本站基于 **Hexo** 静态博客框架构建，使用 **NexT v8** 主题，通过 **hexo-pro** 实现后台管理。这篇文章记录博客的整体架构和核心功能。

## 技术栈

| 组件 | 技术选型 |
|------|---------|
| 博客框架 | Hexo 8.1.2 |
| 主题 | NexT v8.29 |
| 后台管理 | hexo-pro 2.0.0 |
| 部署 | GitHub Actions → GitHub Pages |
| 音乐播放器 | 自写无依赖 |
| 音乐源 | 本地文件 + 网易云音乐 API |
| CDN | jsdelivr（国内可访问） |

## 项目结构

```
blog-hexo/
├── _config.yml              # Hexo 站点配置
├── _config.next.yml         # NexT 主题配置（含 CDN 切换）
├── source/
│   ├── _posts/              # 文章 Markdown
│   ├── _discarded/          # 已删除文章归档
│   ├── music/               # 音乐文件（MP3）
│   ├── css/sidebar-music.css # 播放器样式
│   ├── js/sidebar-music.js  # 播放器逻辑
│   ├── _data/styles.styl    # 自定义样式（侧边栏布局等）
│   └── images/              # 图片资源
├── scripts/
│   ├── sidebar-music.js     # 侧边栏注入 + Range 中间件
│   └── patch-hexo-pro.js    # hexo-pro 全量兼容性修复
├── hexo-pro-custom/         # hexo-pro 自定义文件
│   ├── index.html           # 带音乐管理入口的主页
│   ├── music-inject.js      # 侧边栏菜单注入 + 页面嵌入
│   ├── music.html           # 音乐管理页面
│   ├── music_api.js         # 音乐 CRUD API
│   └── music_netease_api.js # 网易云音乐搜索 API
├── music_data.json          # 歌曲元数据
└── public/                  # 生成的静态文件
```

## hexo-pro 后台管理

通过 `hexo-pro` 实现博客的可视化管理，支持文章编辑、图床、部署、音乐管理等功能。

### 访问方式

本地启动后访问 `http://localhost:4000/hexo-blog/pro/`，首次使用需注册管理员账号。

### 主要功能

- **仪表盘**：文章统计、分类标签、系统信息
- **内容管理**：文章/页面的增删改查、草稿箱、回收站
- **图床**：图片上传、管理、引用
- **YAML 配置**：在线编辑主题和站点配置
- **音乐管理**：上传/搜索/编辑/删除歌曲，内嵌播放器预览
- **部署**：一键推送到 GitHub Pages

## hexo-pro 兼容性修复

hexo-pro 原生不支持自定义 root 路径（如 `/hexo-blog/`），通过 `scripts/patch-hexo-pro.js` 实现全量自动修复，每次 `npm install` 后自动执行。

### 修复内容

1. **SPA 路由**：`index.js` 的路径检测适配 root
2. **静态资源**：`index.html` 的资源路径改为相对路径
3. **React Router basename**：动态计算而非硬编码
4. **路由重写**：`/hexopro/api/*` → `/hexo-blog/hexopro/api/*`（同时更新 `req.url` 和 `req.originalUrl`）
5. **body-parser**：添加 root 前缀的请求体解析（修复 POST/UPDATE 400 错误）
6. **自动重新生成**：文章保存后自动触发 `hexo.generate()`
7. **自定义文件注入**：自动复制 `hexo-pro-custom/` 下的自定义文件
8. **API 注册**：注册音乐管理 API 和网易云搜索 API

### 实现原理

```js
// scripts/patch-hexo-pro.js - postinstall 幂等补丁
const proDir = path.join(root, 'node_modules', 'hexo-pro');

// 1. index.js 路径适配
c = c.replace(
  /req\.originalUrl\.startsWith\('\/pro'\)/g,
  "req.originalUrl.startsWith(hexo.config.root + 'pro')"
);

// 2. 添加 root 前缀的 body-parser
if (_root !== '/') {
  app.use(_root + 'hexopro/api', bodyParser.json({ limit: '50mb' }));
  app.use(_root + 'hexopro/api', bodyParser.urlencoded({ extended: true }));
}

// 3. 保存后自动重新生成
u = u.replace(
  "hexo.log.info('文章保存成功！');",
  "hexo.log.info('文章保存成功！');\n    hexo.generate().catch(err => {});"
);
```

## 侧边栏布局

### flex 兄弟布局

`.sidebar` 使用 flex 列布局，`.sidebar-inner` 和 `.sidebar-music` 作为兄弟元素并列显示：

```css
/* source/_data/styles.styl */
.sidebar {
  display: flex;
  flex-direction: column;
}

.sidebar-inner {
  flex: 1;
  min-height: 0;
}
```

### 播放器显示逻辑

- **站点概览模式**：显示播放器（`.sidebar-overview-active`）
- **文章目录模式**：隐藏播放器（`.sidebar-toc-active .sidebar-music { display: none }`）

## 自写音乐播放器

本站最大的自定义功能是**从零手写的侧边音乐播放器**，无任何外部依赖。

### 核心特性

- **播放控制**：上一曲/下一曲/播放暂停/模式切换
- **播放模式**：列表循环 → 随机播放 → 单曲循环
- **随机播放**：每次打开博客随机显示一首歌曲
- **封面动画**：播放时圆形旋转（12s 一圈），切歌时淡入淡出
- **进度条**：支持点击跳转和拖拽快进
- **歌曲列表**：点击直接播放，当前播放高亮
- **移动端适配**：播放器在侧边栏内，通过汉堡菜单访问

### 实现原理

播放器通过 Hexo 的 `theme_inject` 机制注入到 NexT 侧边栏，API 中间件处理 `.mp3` 文件的 Range 请求（支持 206 Partial Content），确保进度条和时长正常工作。

```js
// scripts/sidebar-music.js - 注入播放器 + Range 中间件
hexo.extend.filter.register('theme_inject', (injects) => {
  injects.sidebar.raw('sidebar-music', `
    <div class="sidebar-music">
      <div class="sidebar-music-title">音乐电台</div>
      <div id="sidebar-music-player"></div>
    </div>
  `);
});

// Range 中间件 - 支持拖动进度条
hexo.extend.filter.register('server_middleware', (app) => {
  app.use((req, res, next) => {
    if (req.path.endsWith('.mp3') && req.headers.range) {
      // 处理 Range 请求，返回 206 Partial Content
    }
    next();
  });
});
```

播放器注入后，JS 会自动将 `.sidebar-music` 移入 `.sidebar-inner` 内部，确保在 Pisces 主题的 flex 布局中正确显示。

## 音乐管理（hexo-pro 集成）

在 hexo-pro 后台侧边栏添加了「音乐管理」入口，以内嵌方式显示在内容区域（非全屏覆盖）。

### 功能特性

- **本地上传**：上传 MP3 文件到 `source/music/` 目录
- **网易云搜索**：搜索网易云音乐并直接添加（无需下载）
- **封面上传**：上传歌曲封面图片
- **编辑歌曲**：修改标题、歌手、封面、URL
- **删除歌曲**：删除本地文件和元数据
- **播放预览**：内嵌播放器，支持播放/暂停切换
- **进度条**：只有播放中的歌曲显示进度条，其余显示时长

### API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/hexopro/api/music/list` | GET | 获取歌曲列表 |
| `/hexopro/api/music/upload` | POST | 上传 MP3 文件 |
| `/hexopro/api/music/add-url` | POST | 添加外部链接 |
| `/hexopro/api/music/upload-cover` | POST | 上传封面图片 |
| `/hexopro/api/music/update` | POST | 更新歌曲信息 |
| `/hexopro/api/music/delete` | POST | 删除歌曲 |
| `/hexopro/api/music/search` | GET | 搜索网易云音乐 |
| `/hexopro/api/music/song-url` | GET | 获取歌曲播放地址 |

### 网易云音乐集成

通过 `music_netease_api.js` 集成网易云音乐 API，支持搜索和直链播放：

```js
// 搜索接口 - 使用 cloudsearch
const data = await fetchJSON(
  API_BASE + '/cloudsearch?keywords=' + encodeURIComponent(keywords) + '&limit=20&type=1&offset=0'
);

// 播放直链 - 使用网易云外链格式
const url = 'https://music.163.com/song/media/outer/url?id=' + id + '.mp3';
```

### 数据同步

歌曲修改后自动同步到 `source/js/sidebar-music.js`，确保博客侧边栏播放器显示最新歌曲列表。

## 主题定制

### CDN 切换

默认 CDN（cdnjs.cloudflare.com）在国内访问不稳定，切换为 jsdelivr：

```yaml
# _config.next.yml
vendors:
  plugins: jsdelivr
  mermaid: https://cdn.jsdelivr.net/npm/mermaid@11.10.1/dist/mermaid.min.js
```

### 封面旋转动画

播放时封面变圆形并旋转，切歌时淡入淡出过渡：

```css
.sm-cover.playing {
  border-radius: 50%;
  animation: sm-rotate 12s linear infinite;
}

.sm-cover.switching {
  opacity: 0;
  transform: scale(0.8);
}
```

### 快捷导航按钮

右下角浮动按钮，支持返回顶部和返回上页，带 tooltip 提示。

### 搜索弹窗

添加了搜索图标文字提示，优化搜索体验。

## 部署流程

> hexo-pro 编辑 → 自动保存 → hexo generate → git push → GitHub Actions → GitHub Pages

1. 在 hexo-pro 后台编辑文章
2. 保存后自动触发 `hexo.generate()` 重新生成
3. 通过 hexo-pro 部署功能推送到 GitHub
4. GitHub Actions 自动构建部署
5. 几分钟后在 `https://2iker.github.io/hexo-blog/` 查看

## 总结

这套架构的优点是**零数据库依赖、内容即文件、可视化管理**。通过 hexo-pro 和自定义脚本，实现了完整的博客管理体验，包括文章编辑、音乐管理（含网易云搜索）、一键部署。

如果你也在搭建博客，欢迎参考本站的配置和源码。
