# hexo-blog

个人博客，基于 [Hexo](https://hexo.io/) 搭建，使用 [NexT](https://theme-next.js.org/) 主题（Gemini 方案），通过 GitHub Actions 自动部署到 GitHub Pages。

在线访问：[https://2iker.github.io/hexo-blog/](https://2iker.github.io/hexo-blog/)

## 功能特性

- **主题**：NexT（Gemini），暗色模式自适应
- **自研侧边栏音乐播放器**（原生 JS 实现，无第三方依赖）
  - 播放 / 暂停、上一首 / 下一首、进度条拖拽
  - 播放模式切换：列表循环 / 随机播放 / 单曲循环
  - 歌单列表，点击封面可播放 / 暂停
  - 配合 PJAX 切换页面时音乐不中断
- **PJAX 无刷新导航**：切换页面不打断音乐播放
- **右下角快捷按钮**：返回顶部、返回上页（带 tooltip 与动效）
- **本地搜索**：站内全文搜索（searchdb 生成索引）
- **数学公式**：KaTeX（构建期渲染）
- **流程图**：Mermaid 图表
- **任务列表**：markdown-it-task-lists

## 技术栈

| 组件 | 版本/说明 |
| --- | --- |
| Hexo | 8.x |
| 主题 | hexo-theme-next 8.x（Gemini） |
| Markdown 渲染 | markdown-it + KaTeX + task-lists |
| 搜索 | hexo-generator-searchdb |
| 播放器 | 自研（source/js/sidebar-music.js） |
| 部署 | GitHub Actions → GitHub Pages（项目页） |

## 目录结构

```text
.
├── _config.yml          # Hexo 站点配置
├── _config.next.yml     # NexT 主题配置（Alternate Theme Config）
├── scaffolds/           # 文章脚手架
├── scripts/             # Hexo 插件脚本（播放器注入 + 音频 Range 支持）
├── source/
│   ├── _data/           # 自定义样式 styles.styl
│   ├── _posts/          # 文章
│   ├── css/             # 播放器 / 快捷按钮样式
│   ├── js/              # 播放器、快捷按钮脚本
│   └── music/           # 音频与封面
├── .github/workflows/   # GitHub Pages 部署
└── public/              # 构建产物（不入库）
```

## 本地开发

```bash
# 安装依赖
npm install

# 本地预览（http://localhost:4000/hexo-blog/）
npx hexo server

# 生成静态文件
npx hexo generate

# 清空缓存
npx hexo clean
```

> 提示：修改 `scripts/` 目录下的插件脚本后，需要重启 `hexo server` 才会生效（服务内存会缓存旧产物）。

## 添加歌曲

把 MP3 放到 `source/music/`，封面放到 `source/music/covers/`，然后在 `source/js/sidebar-music.js` 的 `tracks` 数组中加入对应条目：

```js
{ name: '歌名', artist: '歌手', url: root + 'music/xxx.mp3', cover: root + 'music/covers/xxx.jpg' }
```

## 部署

推送 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages（项目页路径 `/hexo-blog/`）。也可在 Actions 页面手动触发 `Deploy to GitHub Pages` 工作流。

## 许可

本仓库内容版权归作者所有，仅供学习参考。
