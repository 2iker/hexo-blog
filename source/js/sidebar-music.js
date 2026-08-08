(function () {
  var container = document.getElementById('sidebar-music-player')
  if (!container) return

  var root = (window.CONFIG && CONFIG.root) || '/hexo-blog/'

      var tracks = [
    { name: '烟火里的尘埃', artist: '黄霄雲', url: root + 'music/bg-music.mp3', cover: root + 'music/covers/bg-music.jpg' },
    { name: 'Got It (PHONK)', artist: 'Lunak,VZEUS', url: 'http://music.163.com/song/media/outer/url?id=2679634795.mp3', cover: 'http://p1.music.126.net/1Mzs04Qi_k9KY3RvZaggSw==/109951170525558620.jpg' },
    { name: '????', artist: '????', url: 'http://example.com/test-sync.mp3', cover: '' }
  ]

  var ICON_PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5.14v13.72c0 .6.66.97 1.17.65l11.17-6.86a.77.77 0 0 0 0-1.3L9.17 4.49A.77.77 0 0 0 8 5.14z"/></svg>'
  var ICON_PAUSE = '<svg viewBox="0 0 24 24"><path d="M7 5h3.4v14H7V5zm6.6 0H17v14h-3.4V5z"/></svg>'
  var ICON_PREV = '<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/></svg>'
  var ICON_NEXT = '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z"/></svg>'
  var ICON_MODE_LIST = '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>'
  var ICON_MODE_SHUFFLE = '<svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>'
  var ICON_MODE_LOOP = '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>'
  var MODES = [
    { key: 'list', title: '列表循环', icon: ICON_MODE_LIST },
    { key: 'shuffle', title: '随机播放', icon: ICON_MODE_SHUFFLE },
    { key: 'loop', title: '单曲循环', icon: ICON_MODE_LOOP }
  ]
  var ICON_LIST = '<svg viewBox="0 0 24 24"><path d="M3 6h4v4H3V6zm0 8h4v4H3v-4zm6 0h12v4H9v-4zm0-8h12v4H9V6z"/></svg>'

  function el(tag, cls, html) {
    var e = document.createElement(tag)
    if (cls) e.className = cls
    if (html) e.innerHTML = html
    return e
  }

  function fmt(sec) {
    sec = Math.floor(sec)
    if (!isFinite(sec) || sec < 0) sec = 0
    var m = Math.floor(sec / 60)
    var s = sec % 60
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s
  }

  /* ---------- 构建 DOM ---------- */
  var cover = el('img', 'sm-cover')
  cover.alt = ''

  var nameEl = el('div', 'sm-name')
  var artistEl = el('div', 'sm-artist')
  var timeEl = el('span', 'sm-time', '00:00')
  var meta = el('div', 'sm-meta')
  meta.appendChild(nameEl)
  meta.appendChild(artistEl)
  meta.appendChild(timeEl)

  var head = el('div', 'sm-head')
  head.appendChild(cover)
  head.appendChild(meta)

  var bar = el('div', 'sm-bar')
  var played = el('div', 'sm-played')
  bar.appendChild(played)
  var barWrap = el('div', 'sm-bar-wrap')
  barWrap.appendChild(bar)
  var progress = el('div', 'sm-progress')
  progress.appendChild(barWrap)

  var btnPrev = el('button', 'sm-btn sm-prev', ICON_PREV)
  btnPrev.type = 'button'
  var btnToggle = el('button', 'sm-btn sm-toggle', ICON_PLAY)
  btnToggle.type = 'button'
  var btnNext = el('button', 'sm-btn sm-next', ICON_NEXT)
  btnNext.type = 'button'
  var btnShuffle = el('button', 'sm-btn sm-mode', ICON_MODE_LIST)
  btnShuffle.type = 'button'
  btnShuffle.title = MODES[0].title
  var btnList = el('button', 'sm-btn sm-list-toggle', ICON_LIST)
  btnList.type = 'button'

  var controls = el('div', 'sm-controls')
  controls.appendChild(btnPrev)
  controls.appendChild(btnToggle)
  controls.appendChild(btnNext)
  controls.appendChild(el('span', 'sm-spacer'))
  controls.appendChild(btnShuffle)
  controls.appendChild(btnList)

  var listEl = el('div', 'sm-list')
  var player = el('div', 'sm-player')
  player.appendChild(head)
  player.appendChild(progress)
  player.appendChild(controls)
  player.appendChild(listEl)
  container.appendChild(player)

  /* ---------- 播放逻辑 ---------- */
  var audio = new Audio()
  audio.preload = 'metadata'
  var index = 0
  var modeIdx = 0
  var dragging = false

  function buildList() {
    listEl.innerHTML = ''
    tracks.forEach(function (t, i) {
      var line = el('span', 'sm-list-line')
      line.textContent = t.name + ' - ' + t.artist
      var item = el('button', 'sm-list-item' + (i === index ? ' current' : ''))
      item.type = 'button'
      item.appendChild(line)
      item.addEventListener('click', function () {
        load(i)
        audio.play()
      })
      listEl.appendChild(item)
    })
  }

  function setPlaying(playing) {
    btnToggle.classList.toggle('playing', playing)
    btnToggle.innerHTML = playing ? ICON_PAUSE : ICON_PLAY
  }

  function load(i) {
    index = i
    audio.src = tracks[i].url
    cover.src = tracks[i].cover
    nameEl.textContent = tracks[i].name
    artistEl.textContent = tracks[i].artist
    played.style.width = '0%'
    timeEl.textContent = '00:00'
    setPlaying(false)
    buildList()
    audio.load()
  }

  function next() {
    var n
    var mode = MODES[modeIdx].key
    if (mode === 'shuffle' && tracks.length > 1) {
      do { n = Math.floor(Math.random() * tracks.length) } while (n === index)
    } else if (mode === 'loop') {
      n = index
    } else {
      n = (index + 1) % tracks.length
    }
    load(n)
    audio.play()
  }

  function prev() {
    var n = (index - 1 + tracks.length) % tracks.length
    load(n)
    audio.play()
  }

  function ratioFromEvent(e) {
    var rect = barWrap.getBoundingClientRect()
    var r = (e.clientX - rect.left) / rect.width
    return Math.max(0, Math.min(1, r))
  }

  function seek(ratio) {
    var d = audio.duration
    if (!d || !isFinite(d)) return
    audio.currentTime = ratio * d
    played.style.width = (ratio * 100) + '%'
    timeEl.textContent = fmt(ratio * d)
  }

  function togglePlay() {
    if (audio.paused) { audio.play() } else { audio.pause() }
  }

  btnToggle.addEventListener('click', togglePlay)
  cover.addEventListener('click', togglePlay)
  btnPrev.addEventListener('click', prev)
  btnNext.addEventListener('click', next)
  btnShuffle.addEventListener('click', function () {
    modeIdx = (modeIdx + 1) % MODES.length
    var m = MODES[modeIdx]
    btnShuffle.innerHTML = m.icon
    btnShuffle.title = m.title
    btnShuffle.classList.toggle('on', m.key !== 'list')
  })
  btnList.addEventListener('click', function () {
    listEl.classList.toggle('open')
    btnList.classList.toggle('on', listEl.classList.contains('open'))
  })

  barWrap.addEventListener('pointerdown', function (e) {
    if (!audio.src) return
    e.preventDefault()
    dragging = true
    barWrap.setPointerCapture(e.pointerId)
    seek(ratioFromEvent(e))
  })
  barWrap.addEventListener('pointermove', function (e) {
    if (dragging) seek(ratioFromEvent(e))
  })
  barWrap.addEventListener('pointerup', function () { dragging = false })
  barWrap.addEventListener('pointercancel', function () { dragging = false })

  audio.addEventListener('play', function () { setPlaying(true) })
  audio.addEventListener('pause', function () { setPlaying(false) })
  audio.addEventListener('timeupdate', function () {
    if (dragging) return
    var d = audio.duration
    if (!d || !isFinite(d)) return
    played.style.width = (audio.currentTime / d * 100) + '%'
    timeEl.textContent = fmt(audio.currentTime)
  })
  audio.addEventListener('ended', next)

  load(0)

  /* ---------- 融入侧边栏 ---------- */
  var sidebar = document.querySelector('.sidebar')
  var musicEl = container.closest('.sidebar-music')
  if (sidebar && musicEl && musicEl.parentElement !== sidebar) {
    sidebar.appendChild(musicEl)
  }

  var motionOk = window.NexT && NexT.motion && window.CONFIG && CONFIG.motion && CONFIG.motion.enable && typeof Element.prototype.animate === 'function'
  var sidebarInner = document.querySelector('.sidebar-inner')
  if (motionOk && sidebarInner && typeof MutationObserver === 'function') {
    var revealed = false
    var reveal = function () {
      if (revealed) return
      revealed = true
      setTimeout(function () { musicEl.classList.add('animated', 'fadeInUp') }, 150)
    }
    if (sidebarInner.classList.contains('animated')) {
      reveal()
    } else {
      var observer = new MutationObserver(function () {
        if (sidebarInner.classList.contains('animated')) {
          observer.disconnect()
          reveal()
        }
      })
      observer.observe(sidebarInner, { attributes: true, attributeFilter: ['class'] })
    }
  } else {
    musicEl.style.visibility = 'visible'
  }
})()
