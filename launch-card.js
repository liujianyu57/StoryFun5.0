// ============================================================
// Story.fun 共享币卡片模块
// 市场页（launchpad.html）与全局搜索结果页（search-results.html）共用同一种币卡片
// 用法：<script src="launch-coin.js"></script><script src="launch-card.js"></script>
//   window.LaunchCard.html(coin)        → 卡片 HTML 字符串（<li class="px-grid-item">…）
//   window.LaunchCard.grid(list)        → 整段 <li> 列表 HTML
//   window.LaunchCard.bindVideos(root)  → 给容器内已渲染的卡片绑定 hover 播视频
//   window.LaunchCard.setLang(fn)       → 可选：自定义中英判定函数（默认读 localStorage.storyfun_lang）
// 宿主页面需要提供全局 openCoin(id) 与 goAddr(addr)（卡片内联 onclick 使用）
// ============================================================
(function () {
  'use strict';

  var STYLE_ID = 'sf-launch-card-styles';

  // ---- 卡片样式（自带 token fallback，未加载 launch.css 的页面也正常） ----
  var CSS = [
    '.px-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:0;padding:0;list-style:none}',
    '.px-grid-item{display:block;margin:0;padding:0;list-style:none}',
    '.px-card{display:grid;grid-template-rows:auto 1fr;gap:12px;padding:14px;border-radius:22px;cursor:pointer;text-decoration:none;background:var(--surface,#fff);border:1px solid var(--border,#E5E7EB);color:inherit;position:relative;font-family:var(--font,-apple-system,"PingFang SC","Helvetica Neue",Arial,sans-serif);transition:transform .16s ease,background .16s ease,border-color .16s ease}',
    '.px-card:hover{transform:translateY(-2px);border-color:var(--border-strong,#D1D5DB);background:var(--surface-2,#FBFBFC);z-index:5}',
    '.px-media{position:relative}',
    '.px-logo{position:relative;display:block;aspect-ratio:16 / 9;width:100%;border-radius:16px;background:var(--surface-2,#FBFBFC);border:1px solid var(--border,#E5E7EB);overflow:hidden}',
    '.px-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}',
    '.px-generic{position:absolute;inset:0;display:grid;place-items:center;background:linear-gradient(135deg,#f2f3f6 0%,#e6e9ee 100%);color:rgba(10,11,13,.07);font-weight:800;font-size:64px;letter-spacing:-.04em}',
    '.px-generic b{font-weight:800}',
    /* 播放标记：仅关联了视频的币显示，固定在币图正中 */
    '.px-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2;width:42px;height:42px;border-radius:50%;background:rgba(10,11,13,.55);color:#fff;display:grid;place-items:center;font-size:13px;font-style:normal;pointer-events:none;border:.5px solid rgba(255,255,255,.4);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);box-shadow:0 2px 10px rgba(0,0,0,.18)}',
    '.px-hover-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}',
    '.px-badges{position:absolute;top:8px;left:8px;right:8px;z-index:1;display:flex;flex-wrap:wrap;align-items:center;gap:4px}',
    '.px-badge{font-size:10px;font-weight:600;letter-spacing:.02em;line-height:1.2;padding:4px 8px;border-radius:999px}',
    '.px-badge.grad{background:rgba(14,159,110,.9);color:#fff}',
    '.px-badge.og{background:rgba(10,11,13,.82);color:#fff}',
    '.px-badge.warn{background:rgba(246,70,93,.9);color:#fff}',
    '.px-badge.new{background:rgba(10,11,13,.82);color:#fff}',
    /* 创建者持仓警示（pons creator-warn-badge）：黄色三角，hover 提示 */
    '.px-warn-badge{width:20px;height:20px;border-radius:999px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;background:#eab308;color:#1c1917;cursor:help;position:relative;line-height:1;box-shadow:0 1px 4px rgba(0,0,0,.12)}',
    '.px-warn-badge:hover::after{content:attr(data-tip);position:absolute;z-index:30;left:50%;transform:translateX(-50%);top:calc(100% + 8px);width:max-content;max-width:min(220px,60vw);background:#1c1c1c;color:#fff;border-radius:10px;padding:7px 10px;font-size:11px;line-height:1.45;font-weight:500;box-shadow:0 12px 30px rgba(0,0,0,.3);letter-spacing:0}',
    '.px-warn-badge:hover::before{content:"";position:absolute;z-index:30;left:50%;margin-left:-4px;top:calc(100% + 3px);width:8px;height:8px;background:#1c1c1c;transform:rotate(45deg)}',
    '.px-card-body{display:grid;gap:3px;min-width:0;padding:0 2px 2px}',
    '.px-card-body strong,.px-card-body>small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}',
    '.px-name-row{display:flex;align-items:center;gap:6px;min-width:0}',
    '.px-name{font-size:14px;font-weight:500;letter-spacing:-0.01em;color:var(--text,#0A0B0D)}',
    /* 收益共享徽章（pons community-badge）：创作者收益归持有者 */
    '.px-share-badge{width:18px;height:18px;border-radius:999px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;background:#facc15;color:#1c1917;cursor:help;position:relative;line-height:1}',
    '.px-share-badge:hover::after{content:attr(data-tip);position:absolute;z-index:30;left:50%;transform:translateX(-50%);bottom:calc(100% + 8px);width:max-content;max-width:min(200px,60vw);background:#1c1c1c;color:#fff;border-radius:10px;padding:7px 10px;font-size:11px;line-height:1.45;font-weight:500;box-shadow:0 12px 30px rgba(0,0,0,.3);letter-spacing:0}',
    '.px-share-badge:hover::before{content:"";position:absolute;z-index:30;left:50%;margin-left:-4px;bottom:calc(100% + 4px);width:8px;height:8px;background:#1c1c1c;transform:rotate(45deg)}',
    '.px-sym{color:var(--text-2,#6B7280);font-size:12px;font-weight:600}',
    '.px-sym .px-pair{font-style:normal;color:var(--text-3,#9CA3AF);font-weight:600;font-size:11px}',
    '.px-mcap{display:flex;align-items:baseline;gap:5px;margin-top:2px;font-variant-numeric:tabular-nums}',
    '.px-mcap-value{color:var(--text,#0A0B0D);font-size:14px;font-weight:700;letter-spacing:-0.01em}',
    '.px-mcap-label{color:var(--text-3,#9CA3AF);font-size:11px;font-weight:600;letter-spacing:.03em}',
    '.px-grad{display:flex;align-items:center;gap:8px;min-width:0;margin-top:4px}',
    '.px-grad-track{flex:auto;height:4px;border-radius:999px;background:var(--accent-soft,#F3F4F6);overflow:hidden}',
    '.px-grad-fill{display:block;height:100%;border-radius:inherit;background:var(--text,#0A0B0D)}',
    '.px-grad-pct{flex:none;font-size:11px;font-weight:600;color:var(--text-2,#6B7280);font-variant-numeric:tabular-nums}',
    '.px-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px;font-size:11px;color:var(--text-3,#9CA3AF);font-variant-numeric:tabular-nums}',
    '.px-deployer{color:inherit;font:inherit;background:none;border:0;padding:0;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--mono,ui-monospace,Menlo,Consolas,monospace)}',
    '.px-deployer:hover{color:var(--text,#0A0B0D)}',
    '.px-time{color:var(--text-3,#9CA3AF);flex-shrink:0}',
    '.px-card .num{font-family:var(--mono,ui-monospace,Menlo,Consolas,monospace);font-variant-numeric:tabular-nums}',
    '.px-empty{text-align:center;padding:40px 12px;color:var(--text-3,#9CA3AF)}',
    '.px-empty b{color:var(--text-2,#6B7280);font-weight:600}',
    '@media (max-width:1060px){.px-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '@media (max-width:640px){.px-grid{grid-template-columns:repeat(2,1fr)}}',
    '@media (max-width:420px){.px-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.px-card{padding:8px;border-radius:16px}.px-logo{border-radius:12px}.px-play{width:32px;height:32px;font-size:11px}}'
  ].join('');

  function injectStyles() {
    if (typeof document === 'undefined' || !document.head) return;
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ---- 中英文（zh 基准 / en 卡片内文案） ----
  var langFn = function () {
    try { return localStorage.getItem('storyfun_lang') === 'en'; } catch (e) { return false; }
  };
  function langIsEn() { try { return !!langFn(); } catch (e) { return false; } }
  function setLang(fn) { if (typeof fn === 'function') langFn = fn; }

  var CARD_I18N = {
    '已毕业': 'Graduated',
    '本币名与代号首次发行': 'First launch of this name & ticker',
    '创作者收益归该币持有者': "Creator rewards go to this token's holders.",
    '创作者收益归该币的持有者领取': "Creator rewards go to this token's holders."
  };
  function tt(zh) {
    if (!langIsEn() || zh == null) return zh;
    return (CARD_I18N[zh] != null) ? CARD_I18N[zh] : zh;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function engine() { return (typeof window !== 'undefined' && window.Launch) ? window.Launch : null; }
  function mcTxt(u) { var L = engine(); return L ? L.fmtUsd(u).replace(/\.0(K|M)$/, '$1') : '—'; }
  function pctText(p) {
    if (p == null) return '—';
    var v = (p * 100).toFixed(2);
    return v.replace(/\.?0+$/, '') + '%';
  }
  function warnTip(c) {
    var p = Math.round(c.creatorHoldsPct);
    return langIsEn()
      ? 'Creator holds ' + p + '% of the token — creator holdings are high, watch for sell pressure'
      : '创建者持仓 ' + p + '% —— 谨防抛压';
  }

  // ---- 占位风控/徽章元数据（原型：确定性生成，无链上数据） ----
  function metaOf(c) {
    if (c._meta) return c._meta;
    var h = 0, s = c.id || 'x';
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    var m = {
      og: (h % 10) < 3,               // 30% 视为首发名
      official: (h % 10) < 2,          // 20% 视为官方
      warn: (h % 10) < 1,              // 10% 触发创建者持有>20% 警示
      burnPct: Math.round((h % 1000) / 100) / 10  // 0–9.9% 假 burn
    };
    c._meta = m;
    return m;
  }

  // ============================================================
  //  卡片（pons 结构：币图 + 徽章 + 名 + $TICKER + MC + 进度% + deployer + ago）
  // ============================================================
  function html(c) {
    if (!c) return '';
    var L = engine();
    var grad = !!c.graduated;
    var warn = (c.creatorHoldsPct || 0) > 20;
    // 徽章（用户实测 pons）：已毕业卡=Graduated；Explore 活跃卡=OG → !（V2 排除）
    var badge = '';
    if (grad) {
      badge += '<span class="px-badge grad">' + (langIsEn() ? 'Graduated' : '已毕业') + '</span>';
    } else {
      if (c.isOriginal) badge += '<span class="px-badge og" title="' + tt('本币名与代号首次发行') + '">OG</span>';
      if (warn) badge += '<span class="px-warn-badge" role="img" data-tip="' + warnTip(c) + '">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" color="currentColor" stroke-width="1.75" stroke="currentColor" aria-hidden="true"><path d="M13.9248 21H10.0752C5.44476 21 3.12955 21 2.27636 19.4939C1.42317 17.9879 2.60736 15.9914 4.97574 11.9985L6.90057 8.75333C9.17559 4.91778 10.3131 3 12 3C13.6869 3 14.8244 4.91777 17.0994 8.75332L19.0243 11.9985C21.3926 15.9914 22.5768 17.9879 21.7236 19.4939C20.8704 21 18.5552 21 13.9248 21Z"/><path d="M12 9V13"/><path d="M12.125 16.75H12M12.25 16.75C12.25 16.8881 12.1381 17 12 17C11.8619 17 11.75 16.8881 11.75 16.75C11.75 16.6119 11.8619 16.5 12 16.5C12.1381 16.5 12.25 16.6119 12.25 16.75Z"/></svg>' +
        '</span>';
    }
    var ago = grad
      ? (c.launchedAt ? L.timeAgo(c.launchedAt) + (langIsEn() ? ' ago' : ' 前发行') : '—')
      : (c.lastBuyAt ? L.timeAgo(c.lastBuyAt) + (langIsEn() ? ' ago' : ' 前') : '—');
    var addr = c.creatorAddr || '—';
    // v2 语义：卡片只展示 MC（市值）；MC/FDV 拆分为 v1 池口径，不做
    var mcLine = c.marketCap
      ? '<span class="px-mcap-value num">' + mcTxt(c.marketCap) + '</span><span class="px-mcap-label">MC</span>'
      : '<span class="px-mcap-label">—</span>';
    var hasVid = !!c.video;
    var vAttr = hasVid ? ' data-video="' + esc(c.video) + '"' : '';
    var vHint = hasVid ? '<i class="px-play" aria-hidden="true">▶</i>' : '';
    // 币图：无论是否关联视频，卡片大图固定显示币图（无图才回退通用底图）
    var stageIn = c.cover
      ? '<img class="px-poster" src="' + esc(c.cover) + '" alt="" loading="lazy">'
      : '<span class="px-generic"><b>$' + esc(c.symbol) + '</b></span>';
    var mid = grad ? '' :
      '<div class="px-grad">' +
        '<div class="px-grad-track"><i class="px-grad-fill" style="width:' + Math.min(100, Math.max(0, (c.progress || 0) * 100)).toFixed(2) + '%"></i></div>' +
        '<span class="px-grad-pct">' + pctText(c.progress) + '</span>' +
      '</div>';
    return '' +
      '<li class="px-grid-item"><a class="px-card" data-id="' + esc(c.id) + '" onclick="openCoin(\'' + esc(c.id) + '\')">' +
        '<span class="px-media">' +
          '<span class="px-logo"' + vAttr + '>' + stageIn + vHint + '</span>' +
          '<span class="px-badges">' + badge + '</span>' +
        '</span>' +
        '<span class="px-card-body">' +
          '<span class="px-name-row">' +
            '<strong class="px-name">' + esc(c.name) + '</strong>' +
            (c.shareToHolders
              ? '<span class="px-share-badge" role="img" title="' + tt('创作者收益归该币持有者') + '" data-tip="' + tt('创作者收益归该币的持有者领取') + '">' +
                  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" color="currentColor" stroke-width="1.75" stroke="currentColor" aria-hidden="true"><path d="M15.5 11C15.5 9.067 13.933 7.5 12 7.5C10.067 7.5 8.5 9.067 8.5 11C8.5 12.933 10.067 14.5 12 14.5C13.933 14.5 15.5 12.933 15.5 11Z"/><path d="M15.4827 11.3499C15.8047 11.4475 16.1462 11.5 16.5 11.5C18.433 11.5 20 9.933 20 8C20 6.067 18.433 4.5 16.5 4.5C14.6851 4.5 13.1928 5.8814 13.0173 7.65013"/><path d="M10.9827 7.65013C10.8072 5.8814 9.31492 4.5 7.5 4.5C5.567 4.5 4 6.067 4 8C4 9.933 5.567 11.5 7.5 11.5C7.8538 11.5 8.1953 11.4475 8.5173 11.3499"/><path d="M12 14.5V20.5M8.5 17.5H15.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
                '</span>'
              : '') +
          '</span>' +
          '<small class="px-sym">$' + esc(c.symbol) +
            (c.pair ? ' <span class="px-pair">· ' + esc(c.pair) + '</span>' : '') +
          '</small>' +
          '<span class="px-mcap">' + mcLine + '</span>' +
          mid +
          '<span class="px-meta">' +
            '<button class="px-deployer" title="' + tt('查看该地址档案') + '" onclick="event.stopPropagation();goAddr(\'' + esc(addr) + '\')">' + esc(addr) + '</button>' +
            '<time class="px-time">' + ago + '</time>' +
          '</span>' +
        '</span>' +
      '</a></li>';
  }

  function grid(list) {
    return (list || []).map(html).join('');
  }

  // ---- hover 播放关联视频（仅精确指针设备；离开即停） ----
  var VIDEO_OK = (function () {
    try { return window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) { return true; }
  })();
  function vidRemove(logo) {
    if (!logo || !logo.__pv) return;
    try { logo.__pv.pause(); } catch (e) {}
    try { if (logo.__pv.parentNode) logo.__pv.parentNode.removeChild(logo.__pv); } catch (e) {}
    logo.__pv = null;
  }
  function vidEnter(e) {
    var logo = e.currentTarget;
    if (!logo || logo.__pv) return;
    var src = logo.getAttribute('data-video');
    if (!src) return;
    var v = document.createElement('video');
    v.className = 'px-hover-video';
    v.src = src;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('preload', 'metadata');
    v.addEventListener('error', function () { vidRemove(logo); });
    logo.appendChild(v);
    logo.__pv = v;
    var p = v.play();
    if (p && p.catch) p.catch(function () { vidRemove(logo); });
  }
  function vidLeave(e) { vidRemove(e.currentTarget); }
  function bindVideos(root) {
    if (!VIDEO_OK || !root || !root.querySelectorAll) return;
    Array.prototype.forEach.call(root.querySelectorAll('.px-logo[data-video]'), function (logo) {
      if (logo.__pxBound) return;
      logo.__pxBound = true;
      logo.addEventListener('mouseenter', vidEnter);
      logo.addEventListener('mouseleave', vidLeave);
    });
  }

  injectStyles();

  window.LaunchCard = {
    html: html,
    grid: grid,
    bindVideos: bindVideos,
    setLang: setLang,
    esc: esc
  };
})();
