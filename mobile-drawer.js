(function(){
  if (window.innerWidth >= 769) return; // Desktop: skip completely

  var drawerHTML = '<div class="mobile-quick-drawer" id="mobileQuickDrawer">' +
    '<div class="mq-overlay" id="mqOverlay"></div>' +
    '<div class="mq-panel">' +
    '<div class="mq-handle"></div>' +
    '<div class="mq-row" data-mq="not-interested">不感兴趣</div>' +
    '<div class="mq-row" data-mq="report">举报</div>' +
    '<div class="mq-row" data-mq="clean">清屏</div>' +
    '<div class="mq-row">连播<div class="mq-switch" id="mqAutoPlay"></div></div>' +
    '<div class="mq-row">弹幕<div class="mq-switch on" id="mqDanmaku"></div></div>' +
    '</div></div>';
  document.body.insertAdjacentHTML('beforeend', drawerHTML);

  var drawer = document.getElementById('mobileQuickDrawer');
  var overlay = document.getElementById('mqOverlay');

  function openMQ(){ drawer.classList.add('open'); }
  function closeMQ(){ drawer.classList.remove('open'); }

  overlay.addEventListener('click', closeMQ);
  drawer.querySelector('.mq-handle').addEventListener('click', closeMQ);

  drawer.querySelector('.mq-panel').addEventListener('click', function(e){
    var row = e.target.closest('.mq-row');
    if (!row) return;
    var act = row.getAttribute('data-mq');
    var sw = e.target.closest('.mq-switch');
    if (sw) {
      var id = sw.id;
      // 先调用 toggle 函数改变全局状态，再用新状态同步 UI
      if (id === 'mqAutoPlay' && typeof toggleAutoPlayNext === 'function') {
        toggleAutoPlayNext();
        sw.classList.toggle('on', !!window.autoPlayNext);
      } else if (id === 'mqDanmaku' && typeof toggleDesktopDanmaku === 'function') {
        toggleDesktopDanmaku();
        sw.classList.toggle('on', !!window.desktopDanmakuOn);
      }
      return;
    }
    if (act === 'not-interested') { if (typeof showToast === 'function') showToast('已反馈，将减少此类推荐'); }
    else if (act === 'report') { if (typeof openLpDrawer === 'function') openLpDrawer(); }
    else if (act === 'clean') { if (typeof toggleCleanMode === 'function') toggleCleanMode(); }
    closeMQ();
  });

  // Long press → open MQ drawer
  var longTimer = null, startY = 0;
  document.addEventListener('touchstart', function(e){
    if (e.target.closest('.actions') || e.target.closest('.info') ||
        e.target.closest('.bnav') || e.target.closest('.player-progress') ||
        e.target.closest('#cmDrawer') || e.target.closest('#dmSendDrawer') ||
        e.target.closest('.side-drawer') || e.target.closest('.lp-drawer') ||
        e.target.closest('.mobile-quick-drawer')) return;
    startY = e.touches[0].clientY;
    longTimer = setTimeout(function(){ openMQ(); }, 600);
  }, {passive: true});
  document.addEventListener('touchmove', function(e){
    if (!longTimer) return;
    if (Math.abs(e.touches[0].clientY - startY) > 10) { clearTimeout(longTimer); longTimer = null; }
  }, {passive: true});
  document.addEventListener('touchend', function(){ clearTimeout(longTimer); longTimer = null; }, {passive: true});

  // Sync switch states from desktop toolbar (fallback / other state changes)
  setInterval(function(){
    var mqAuto = document.getElementById('mqAutoPlay');
    var mqDanmaku = document.getElementById('mqDanmaku');
    if (mqAuto) {
      var on = !!(window.autoPlayNext);
      if (on) mqAuto.classList.add('on'); else mqAuto.classList.remove('on');
    }
    if (mqDanmaku) {
      var on = !!(window.desktopDanmakuOn);
      if (on) mqDanmaku.classList.add('on'); else mqDanmaku.classList.remove('on');
    }
  }, 500);
})();