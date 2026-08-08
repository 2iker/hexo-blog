(function () {
  var nav = document.querySelector('.quick-nav')
  if (!nav) return

  var topBtn = nav.querySelector('.quick-nav-top')
  var backBtn = nav.querySelector('.quick-nav-back')

  function toggleShow() {
    var top = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    nav.classList.toggle('show', top > 300)
  }

  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })

  backBtn.addEventListener('click', function () {
    if (history.length > 1) {
      history.back()
    }
  })

  window.addEventListener('scroll', toggleShow, { passive: true })
  toggleShow()
})()
