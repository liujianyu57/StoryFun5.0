// ============================================================
//  Story.fun - 短剧卡片公共组件 (drama-card.js)
//
//  功能：
//    1. 自动注入短剧卡片完整 CSS（含移动端适配）
//    2. 提供卡片渲染 API renderDramaCard / renderDramaCardList
//
//  用法：
//    <script src="drama-card.js"></script>
//    <script>
//      document.querySelector('.gallery').innerHTML = renderDramaCardList([...]);
//    </script>
//
//  卡片数据结构（renderDramaCard 入参）：
//    {
//      title:  '凤骨琉璃',                 // 标题（必填）
//      cover:  'image/fenggu_cover.jpg',   // 封面图
//      category: '古风',                    // 分类（data-category，用于筛选）
//      sort:   'recommended',              // 排序标记（data-sort，用于筛选）
//      certType: 'official',               // 认证类型：official/partner/creator/community
//      views:  '22.3万',                   // 观看数
//      heat:   '333.2万',                  // 热度
//      rating: '4.8',                      // 评分
//      badge:  '古风',                     // 角标文本（默认取 category）
//      episodes: '全44集',                 // 集数
//      creator: 'JACK',                    // 创作者昵称
//      creatorAvatar: 'https://...',       // 创作者头像
//      link:   'drama-player.html'         // 卡片点击跳转（默认 drama-player.html）
//    }
// ============================================================

(function () {
  'use strict';

  // ============================================================
  //  卡片样式注入（仅注入一次）
  // ============================================================
  function injectStyles() {
    if (document.getElementById('story-drama-card-styles')) return;

    var css = `
/* ── Story.fun Drama Card (by drama-card.js) ── */

/* ═══ 卡片骨架 ═══ */
.card { position: relative; }
.card-wrapper { display: flex; flex-direction: column; cursor: pointer; }
.card {
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  box-shadow: 0 2px 12px rgba(27, 45, 71, 0.06);
  border: 1px solid var(--border);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
}
.card:hover { transform: translateY(-5px); box-shadow: 0 4px 20px rgba(27, 45, 71, 0.10); }
.card-thumb-wrap { position: relative; overflow: hidden; }
.card-thumb { width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block; }
.card-body { display: none; }

/* ═══ 卡片角标（标题/分类/集数/创作者） ═══ */
.card-caption { padding: 8px 2px 0; }
.card-caption h3 { margin: 0; font-size: 0.95rem; line-height: 1.25; font-weight: 600; color: var(--text); }
.card-caption .caption-row { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.card-caption .caption-row .caption-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.card-caption .caption-row .caption-right { flex-shrink: 0; margin-left: 12px; font-size: 0.72rem; color: var(--text-muted); font-weight: 500; white-space: nowrap; display: flex; align-items: center; gap: 4px; }
.caption-creator { display: flex; align-items: center; gap: 4px; }
.caption-creator-avatar { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid var(--border); }
.card-caption .badge, .card-caption .episode {
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  padding: 3px 7px;
  font-size: 0.68rem;
  font-weight: 500;
  border: 1px solid var(--border);
  color: var(--text-muted);
  background: transparent;
}

/* ═══ 卡片统计层（左下角） ═══ */
.card-stats {
  position: absolute;
  bottom: 8px;
  left: 10px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.7rem;
  font-weight: 500;
  color: #fff;
  pointer-events: none;
}
.card-stats .cs-stat { display: inline-flex; align-items: center; gap: 3px; color: #fff; }
.card-stats .cs-stat svg { width: 12px; height: 12px; flex-shrink: 0; opacity: 0.9; stroke: #fff; }
.card-stats .cs-rating { color: #fff; }
.card-stats .cs-rating svg { stroke: #fff; opacity: 1; }

/* ═══ 移动端适配 ═══ */
@media (max-width: 768px) {
  .card-wrapper { flex-direction: column; }
}
`;

    var style = document.createElement('style');
    style.id = 'story-drama-card-styles';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  // ============================================================
  //  图标集合
  // ============================================================
  var ICONS = {
    views: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    heat: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 22c4.4 0 8-3.6 8-8 0-5.4-8-12-8-12S4 8.6 4 14c0 4.4 3.6 8 8 8z"/><path d="M12 22c-1.5 0-3-1-3-3 0-1.5 1.2-2.6 3-4 1.8 1.4 3 2.5 3 4 0 2-1.5 3-3 3z"/></svg>',
    rating: '<svg viewBox="0 0 24 24" fill="currentColor" stroke-width="0"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
  };

  function escapeHTML(str) {
    var entityMap = {
      '&': '\x26amp;',
      '<': '\x26lt;',
      '>': '\x26gt;',
      '"': '\x26quot;',
      "'": '\x26#39;'
    };
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return entityMap[c];
    });
  }

  /**
   * 渲染一张短剧卡片
   * @param {Object} data 卡片数据（字段见文件头注释）
   * @returns {string} 卡片 HTML 字符串
   */
  function renderDramaCard(data) {
    data = data || {};
    var title = escapeHTML(data.title || '');
    var cover = escapeHTML(data.cover || '');
    var category = escapeHTML(data.category || '');
    var sort = escapeHTML(data.sort || '');
    var views = escapeHTML(data.views || '');
    var heat = escapeHTML(data.heat || '');
    var rating = escapeHTML(data.rating || '');
    var badge = escapeHTML(data.badge || data.category || '');
    var episodes = escapeHTML(data.episodes || '');
    var creator = escapeHTML(data.creator || '');
    var creatorAvatar = escapeHTML(data.creatorAvatar || '');
    var link = escapeHTML(data.link || 'drama-player.html');

    var statsHTML = '';
    if (views || heat || rating) {
      statsHTML = '<div class="card-stats">' +
        (views ? '<span class="cs-stat">' + ICONS.views + views + '</span>' : '') +
        (heat ? '<span class="cs-stat">' + ICONS.heat + heat + '</span>' : '') +
        (rating ? '<span class="cs-stat cs-rating">' + ICONS.rating + '<span>' + rating + '</span></span>' : '') +
      '</div>';
    }

    var captionLeft = '';
    if (badge) captionLeft += '<span class="badge">' + badge + '</span>';
    if (episodes) captionLeft += '<span class="episode">' + episodes + '</span>';

    var creatorHTML = '';
    if (creator || creatorAvatar) {
      creatorHTML = '<div class="caption-right">' +
        (creatorAvatar ? '<img class="caption-creator-avatar" src="' + creatorAvatar + '" alt="' + creator + '" loading="lazy" />' : '') +
        (creator ? '<span class="caption-creator">@' + creator + '</span>' : '') +
      '</div>';
    }

    return '<div class="card-wrapper" onclick="location.href=\'' + link + '\'">' +
      '<article class="card" data-category="' + category + '" data-sort="' + sort + '">' +
        '<div class="card-thumb-wrap">' +
          '<img class="card-thumb" src="' + cover + '" alt="' + title + '" />' +
          statsHTML +
        '</div>' +
      '</article>' +
      '<div class="card-caption">' + (window.CoinLink ? window.CoinLink.chip(data.title, { light: true, size: 'sm' }) : '') +
      '<h3>' + title + '</h3>' +
        '<div class="caption-row">' +
          '<div class="caption-left">' + captionLeft + '</div>' +
          creatorHTML +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /**
   * 批量渲染多张短剧卡片
   * @param {Array} items 卡片数据数组
   * @returns {string} 卡片 HTML 拼接字符串
   */
  function renderDramaCardList(items) {
    items = Array.isArray(items) ? items : [];
    return items.map(renderDramaCard).join('');
  }

  // ============================================================
  //  暴露全局 API（供各页面直接调用）
  // ============================================================
  window.renderDramaCard = renderDramaCard;
  window.renderDramaCardList = renderDramaCardList;

  // 自动注入样式
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }
})();
