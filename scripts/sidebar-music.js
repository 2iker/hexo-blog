'use strict'

// 音频文件走 serve-static，提供 Content-Length + Range 支持，
// 否则 hexo route 流式输出会让浏览器把 MP3 当无限时长流（duration=Infinity）
hexo.extend.filter.register('server_middleware', (app) => {
  let staticHandler = null
  const serveStatic = () => {
    if (!staticHandler) {
      staticHandler = require('serve-static')(hexo.public_dir)
    }
    return staticHandler
  }
  app.use(hexo.config.root, (req, res, next) => {
    if (/\.mp3$/i.test(req.url)) {
      return serveStatic()(req, res, next)
    }
    next()
  })
}, 1)

hexo.extend.filter.register('theme_inject', (injects) => {
  injects.head.raw('sidebar-music-style', '<link rel="stylesheet" href="/hexo-blog/css/sidebar-music.css">')
  injects.sidebar.raw('sidebar-music', `
    <div class="sidebar-music">
      <div class="sidebar-music-title">我的音乐</div>
      <div id="sidebar-music-player"></div>
    </div>
  `)
  injects.bodyEnd.raw('sidebar-music-script', '<script src="/hexo-blog/js/sidebar-music.js" defer></script>')
  injects.bodyEnd.raw('quick-nav', `
    <div class="quick-nav">
      <button type="button" class="quick-nav-btn quick-nav-top" title="返回顶部">
        <i class="fa fa-chevron-up"></i>
      </button>
      <button type="button" class="quick-nav-btn quick-nav-back" title="返回上页">
        <i class="fa fa-arrow-left"></i>
      </button>
    </div>
  `)
  injects.bodyEnd.raw('quick-nav-script', '<script src="/hexo-blog/js/quick-nav.js" defer></script>')
})
