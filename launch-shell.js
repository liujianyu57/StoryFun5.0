// ============================================================
//  Story.fun 发射台 · 页面外壳（顶栏/通知/ETH/调试面板）
//  依赖 launch-coin.js
// ============================================================
(function () {
  'use strict';

  function activePage() {
    var p = window.location.pathname.split('/').pop() || '';
    return p;
  }

  // ============================================================
  //  顶栏 HTML
  // ============================================================
  function headerHTML() {
    var page = activePage();
    return '' +
      '<header class="lp-header">' +
        '<div class="lp-header-inner">' +
          '<a class="lp-brand" href="index.html">' +
            '<img src="image/storyfun-logo-icon.png" width="22" height="22" alt="Story.fun" style="border-radius:6px" />' +
            'Story.fun' +
            '<span class="lp-brand-badge">Launch</span>' +
          '</a>' +
          '<a href="launchpad.html" class="lp-nav-link' + (page === 'launchpad.html' ? ' on' : '') + '">市场</a>' +
          '<a href="analytics.html" class="lp-nav-link' + (page === 'analytics.html' ? ' on' : '') + '">数据</a>' +
          '<a href="assets.html" class="lp-nav-link' + (page === 'assets.html' ? ' on' : '') + '">资产</a>' +
          '<div class="lp-header-spacer"></div>' +
          '<div class="lp-header-actions">' +
            ethHTML() +
            bellHTML() +
            '<div class="auth-container" id="authContainer"></div>' +
          '</div>' +
        '</div>' +
      '</header>';
  }

  function ethHTML() {
    return '<div class="lp-eth-wrap" id="ethWrap">' +
      '<div class="lp-eth" id="ethPill">' +
        '<span class="lp-eth-coin">Ξ</span>' +
        '<span class="num" id="ethAmount">0.0000</span>' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="margin-right:4px"><path d="M6 9l6 6 6-6"/></svg>' +
      '</div>' +
      '<div class="lp-eth-drop">' +
        '<div class="lp-eth-title">账户</div>' +
        '<div class="lp-eth-row"><span>地址</span><b id="ethAddr">—</b></div>' +
        '<div class="lp-eth-row"><span>余额</span><b><span class="num" id="ethDropAmount">0</span> ETH</b></div>' +
        '<button class="lp-eth-give" id="ethGiveBtn">领取测试 ETH</button>' +
      '</div>' +
    '</div>';
  }

  function bellHTML() {
    return '<button class="lp-bell" id="lpBell" title="通知">' +
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
      '<span class="lp-bell-dot"></span>' +
    '</button>';
  }

  // ============================================================
  //  调试面板
  // ============================================================
  function debugHTML() {
    return '<button class="debug-fab" id="debugFab" title="演示调试">⚙</button>' +
      '<div class="debug-panel" id="debugPanel">' +
        '<h4>演示调试</h4>' +
        '<button data-act="eth">补充 1 ETH</button>' +
        '<button data-act="giveaway">清空余额（演示余额不足）</button>' +
        '<button data-act="reset">重置全部数据</button>' +
        '<button data-act="notify">触发一条通知</button>' +
      '</div>';
  }

  // ============================================================
  //  渲染
  // ============================================================
  function refreshETH() {
    // ETH 显示已迁移到通用顶栏（load-desktop-header 的 dhEth*）
    if (typeof window.refreshDhEth === 'function') window.refreshDhEth();
  }

  function refreshBell() {
    // 通知入口已由通用顶栏提供，无需旧 lpBell 红点
  }

  function initDebug() {
    var fab = document.getElementById('debugFab');
    var panel = document.getElementById('debugPanel');
    if (!fab || !panel) return;
    fab.addEventListener('click', function () { panel.classList.toggle('open'); });
    panel.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      if (act === 'eth') {
        Launch.debug.setEth((Launch.USER.eth || 0) + 1);
        Launch.toast('已补充 1 ETH', 'ok'); refreshETH();
      } else if (act === 'giveaway') {
        Launch.debug.setEth(0);
        Launch.toast('余额已清空', 'warn'); refreshETH();
      } else if (act === 'reset') {
        Launch.debug.resetAll();
      } else if (act === 'notify') {
        var any = Launch.coins[0];
        if (any) { Launch.notifyGraduated(any); Launch.toast('通知已触发', 'ok'); refreshBell(); }
      }
      panel.classList.remove('open');
    });
  }

  function initHeader() {
    var host = document.getElementById('launch-header-host');
    if (host) host.innerHTML = '';
    // 通用顶栏已由 load-desktop-header 提供（ETH pill/通知/登录/发币）
    if (typeof window.refreshDhEth === 'function') window.refreshDhEth();
    if (typeof initAuth === 'function') { try { initAuth(); } catch (e) {} }
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('auth-ready', function () {
        if (typeof initAuth === 'function') { try { initAuth(); } catch (e) {} }
      });
    }
  }

  // 登录态联动后刷新余额显示（auth 可能改写 id）
  function bindRefresh() {
    if (window.Launch && typeof window.addEventListener === 'function') {
      window.addEventListener('auth-ready', function () {
        if (Launch && typeof Launch.persist === 'function') Launch.persist();
      });
    }
  }

  function boot() {
    var url = (window.location.search || '');
    var debugMode = url.indexOf('debug=1') !== -1 || (typeof localStorage !== 'undefined' && localStorage.getItem('sf_debug') === '1');
    initHeader();
    if (debugMode) {
      var wrap2 = document.createElement('div');
      wrap2.style.display = 'contents';
      wrap2.innerHTML = debugHTML();
      while (wrap2.firstChild) document.body.appendChild(wrap2.firstChild);
      initDebug();
    }
    bindRefresh();
    // 页面自定义 init
    if (typeof window.onLaunchShellReady === 'function') {
      try { window.onLaunchShellReady(); } catch (e) { console.error(e); }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
