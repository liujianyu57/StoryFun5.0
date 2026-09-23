// ============================================================
//  Story.fun · 「已上链」代币 chip 组件（内联，可嵌入任何列表/播放器/横幅）
//  用法：
//    window.CoinLink.chip(title|coin, { light:false, size:'sm'|'md' }) → HTML 或 ''
//    window.CoinLink.render(el, title, opts)                        → 填充元素
//  样式自动注入一次；点击 chip 进入币详情（capture 拦截，避免冒泡到卡片跳转）
// ============================================================
(function () {
  'use strict';

  function ensureStyles() {
    if (document.getElementById('coinlink-styles')) return;
    var st = document.createElement('style');
    st.id = 'coinlink-styles';
    st.textContent = '' +
      '.cl-chip{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px 0 3px;border-radius:999px;' +
        'text-decoration:none;color:#fff;background:rgba(0,0,0,.32);border:1px solid rgba(255,255,255,.22);' +
        'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);cursor:pointer;transition:background .15s,transform .15s;' +
        'box-shadow:0 4px 14px rgba(0,0,0,.18);vertical-align:middle}' +
      '.cl-chip:hover{background:rgba(0,0,0,.48);transform:translateY(-1px)}' +
      '.cl-chip .cl-cover{width:24px;height:24px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#F3F0FF,#E7F6EF);display:grid;place-items:center;flex-shrink:0}' +
      '.cl-chip .cl-cover img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.cl-chip .cl-cover b{font-size:11px;color:#0A0B0D}' +
      '.cl-chip .cl-txt{display:inline-flex;flex-direction:column;line-height:1.12;text-align:left}' +
      '.cl-chip .cl-sym{font-size:12.5px;font-weight:800;letter-spacing:-.01em;white-space:nowrap}' +
      '.cl-chip .cl-mc{font-size:10px;opacity:.72;font-weight:600;white-space:nowrap}' +
      '.cl-chip--light{color:#0A0B0D;background:rgba(255,255,255,.95);border-color:rgba(10,11,13,.1);box-shadow:0 4px 14px rgba(16,24,40,.1)}' +
      '.cl-chip--light:hover{background:#fff}' +
      '.cl-chip--sm{height:24px;padding:0 9px 0 3px;gap:5px}' +
      '.cl-chip--sm .cl-cover{width:18px;height:18px}' +
      '.cl-chip--sm .cl-sym{font-size:11px}' +
      '.cl-chip--sm .cl-mc{font-size:9px}' +
      '.cl-chip--sm .cl-txt{line-height:1.05}';
    document.head.appendChild(st);
  }

  function fmtMcap(u) {
    var n = Number(u) || 0;
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(2);
  }

  function norm(s) {
    return String(s || '').replace(/《|》|「|」|短剧|·|／|\//g, '').trim().toLowerCase();
  }

  // 按标题找币（读共用 localStorage）
  function findCoinForTitle(title) {
    if (!title) return null;
    var raw = null;
    try { raw = localStorage.getItem('storyfun_launch_v1'); } catch (e) {}
    if (!raw) return null;
    var data = null;
    try { data = JSON.parse(raw); } catch (e) {}
    if (!data || !data.coins) return null;
    var t = norm(title);
    if (!t) return null;
    for (var i = 0; i < data.coins.length; i++) {
      var c = data.coins[i];
      var src = norm(c.sourceTitle || '');
      var nm = norm(c.name || '');
      if ((src && (t.indexOf(src) !== -1 || src.indexOf(t) !== -1)) ||
          (nm && (t.indexOf(nm) !== -1 || nm.indexOf(t) !== -1))) {
        return c;
      }
    }
    return null;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  // titleOrCoin：标题字符串 或 币对象
  function chip(titleOrCoin, opts) {
    ensureStyles();
    opts = opts || {};
    var coin = (titleOrCoin && typeof titleOrCoin === 'object') ? titleOrCoin : findCoinForTitle(titleOrCoin);
    if (!coin) return '';
    var cover = coin.cover
      ? '<img src="' + esc(coin.cover) + '" alt="" />'
      : '<b>' + esc(String(coin.symbol || '?').charAt(0).toUpperCase()) + '</b>';
    var mc = fmtMcap(coin.marketCap != null ? coin.marketCap : coin.fdv);
    return '<a class="cl-chip' + (opts.light ? ' cl-chip--light' : '') + (opts.size === 'sm' ? ' cl-chip--sm' : '') + '" ' +
      'href="coin-detail.html?id=' + encodeURIComponent(coin.id) + '" aria-label="查看代币 ' + esc(coin.symbol) + '">' +
        '<span class="cl-cover">' + cover + '</span>' +
        '<span class="cl-txt"><span class="cl-sym">$' + esc(String(coin.symbol || '').toUpperCase()) + '</span>' +
        '<span class="cl-mc num">' + mc + ' MC</span></span>' +
      '</a>';
  }

  function render(el, titleOrCoin, opts) {
    if (!el) return '';
    var html = chip(titleOrCoin, opts);
    el.innerHTML = html;
    return html;
  }

  // 点击 chip：capture 阶段拦截（防止外层卡片 onclick 抢跳），直达币详情
  function bindChipClicks() {
    if (window.__clChipBound) return;
    window.__clChipBound = true;
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('.cl-chip') : null;
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      window.location.href = a.getAttribute('href');
    }, true);
  }

  function boot() {
    if (typeof document === 'undefined') return;
    ensureStyles();
    bindChipClicks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // 导出
  window.CoinLink = { chip: chip, render: render, find: findCoinForTitle };
})();
