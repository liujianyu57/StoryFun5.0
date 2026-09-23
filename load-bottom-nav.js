// ============================================================
//  Story.fun - 底部导航栏加载脚本 (H5 手机端)
//  在屏幕宽度 ≤ 768px 时自动显示
// ============================================================

(function() {
  'use strict';

  let currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (!currentPage || currentPage === '' || currentPage.endsWith('/')) {
    currentPage = 'index.html';
  }

  // ============================================================
  //  注入底部导航样式（仅一次）
  // ============================================================
  function injectBottomNavStyles() {
    if (document.getElementById('story-bottom-nav-styles')) return;

    const css = `
/* ── Story.fun Bottom Navigation ── */
.bottom-nav-wrapper {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
}

.bottom-nav {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 52px;
  padding-bottom: env(safe-area-inset-bottom, 0);
  max-width: 100%;
  margin: 0 auto;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  flex: 1;
  height: 100%;
  padding: 0 0 6px;
  text-decoration: none;
  color: #8E8E93;
  transition: color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav-item.active {
  color: #ff3b30;
}

.bottom-nav-icon {
  width: 26px;
  height: 26px;
  display: block;
  flex-shrink: 0;
}

.bottom-nav-label {
  font-family: "SF Pro", "PingFang SC", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-weight: 500;
  font-size: 10px;
  line-height: 1;
  letter-spacing: 0.02em;
  text-align: center;
}

.bottom-nav-item.active .bottom-nav-label {
  font-weight: 600;
}

/* 创作 - 仅加号，无文字，垂直居中 */
.bottom-nav-item.bottom-nav-create {
  justify-content: center;
  width: 36px;
  height: 39px;
  margin-bottom: 6px;
  background: #ff3b30;
  border-radius: 11px;
  box-shadow: 0 4px 10px rgba(255, 59, 48, 0.4);
  padding-bottom: 0;
}

.bottom-nav-icon-create {
  width: 28px;
  height: 28px;
  display: block;
  flex-shrink: 0;
}

/* 暗色导航 - 首页视频沉浸 */
.bottom-nav-wrapper.nav-dark {
  background: rgba(15, 24, 37, 0.82);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-top: 0.5px solid rgba(255, 255, 255, 0.08);
}

.bottom-nav-wrapper.nav-dark .bottom-nav-item {
  color: rgba(255, 255, 255, 0.55);
}

.bottom-nav-wrapper.nav-dark .bottom-nav-item.active {
  color: #ff3b30;
}

/* ── 只在 H5 手机宽度下显示 ── */
@media (max-width: 768px) {
  .bottom-nav-wrapper {
    display: block;
  }

  body {
    padding-bottom: 60px;
  }
}

/* ── 加号弹出菜单 Overlay（浅色 iOS 观感） ── */
.create-action-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(10, 11, 13, 0.36);
  opacity: 0;
  transition: opacity 0.25s ease;
}
.create-action-overlay.active {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  opacity: 1;
}
.create-action-sheet {
  width: 100%;
  max-width: 520px;
  background: #FFFFFF;
  border-radius: 22px 22px 0 0;
  border-top: 0.5px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.1);
  padding: 10px 18px calc(14px + env(safe-area-inset-bottom, 0px));
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.create-action-overlay.active .create-action-sheet {
  transform: translateY(0);
}
.create-action-sheet-grip {
  width: 40px; height: 5px; border-radius: 3px; margin: 2px auto 2px;
  background: rgba(10, 11, 13, 0.16);
}
.create-action-option {
  display: flex; align-items: center; gap: 13px; padding: 15px 16px;
  background: rgba(10, 11, 13, 0.045); border: 1px solid rgba(10, 11, 13, 0.06);
  border-radius: 16px; text-decoration: none; color: #0A0B0D;
  transition: background 0.15s ease, transform 0.1s ease;
  -webkit-tap-highlight-color: transparent;
}
.create-action-option:active { background: rgba(10, 11, 13, 0.09); transform: scale(0.985); }
.create-action-option.is-primary {
  background: rgba(14, 159, 110, 0.09);
  border-color: rgba(14, 159, 110, 0.24);
}
.create-action-option-icon {
  width: 46px; height: 46px; border-radius: 14px; flex: none;
  display: flex; align-items: center; justify-content: center;
  background: rgba(10, 11, 13, 0.05); color: #0A0B0D;
}
.create-action-option.is-primary .create-action-option-icon {
  background: #0E9F6E; color: #fff;
}
.create-action-option-text { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.create-action-option-label {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", Roboto, sans-serif;
  font-size: 1rem; font-weight: 600; letter-spacing: -0.01em; color: #0A0B0D;
}
.create-action-option.is-primary .create-action-option-label { color: #0B7A4B; }
.create-action-option-desc {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", Roboto, sans-serif;
  font-size: 0.8rem; font-weight: 400; color: rgba(10, 11, 13, 0.5); line-height: 1.4;
}
.create-action-option > svg:last-child { flex: none; color: rgba(10, 11, 13, 0.3); }
.create-action-cancel {
  width: 100%; padding: 15px 16px; background: rgba(10, 11, 13, 0.05);
  border: none; border-radius: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", Roboto, sans-serif;
  font-size: 1rem; font-weight: 600; color: #0A0B0D; cursor: pointer;
  transition: background 0.15s ease; letter-spacing: -0.01em;
  -webkit-tap-highlight-color: transparent;
}
.create-action-cancel:active { background: rgba(10, 11, 13, 0.09); }
`;

    const style = document.createElement('style');
    style.id = 'story-bottom-nav-styles';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  // ============================================================
  //  激活当前页面对应的 tab 项
  // ============================================================
  function activateCurrentTab() {
    const items = document.querySelectorAll('.bottom-nav-item');
    items.forEach(item => {
      const href = item.getAttribute('href');
      // 发布按钮（实心红色）无选中态
      if (href === currentPage && !item.classList.contains('bottom-nav-create')) {
        item.classList.add('active');
      }
    });
  }

  // ============================================================
  //  插入底部导航 HTML
  // ============================================================
  function insertBottomNav(html) {
    injectBottomNavStyles();

    const wrappedHtml = '<div class="story-bottom-nav-wrapper">' + html + '</div>';

    const placeholders = document.querySelectorAll('#bottom-nav-placeholder');
    if (placeholders.length > 0) {
      placeholders.forEach(placeholder => {
        placeholder.outerHTML = wrappedHtml;
      });
    } else if (!document.querySelector('.story-bottom-nav-wrapper')) {
      // 无占位页（如发射台系页面）：直接追加到 body 末尾
      const host = document.createElement('div');
      host.innerHTML = wrappedHtml;
      const node = host.firstChild;
      if (node) document.body.appendChild(node);
    }

    activateCurrentTab();
    // updateHomeNavItem(); // 双模式已注释：首页按钮不再切换"首页/返回"
    applyNavTheme();
    // bindHomeToggle(); // 双模式已注释
    bindCreateActionSheet();
    document.dispatchEvent(new CustomEvent('bottom-nav-loaded'));
  }

  // ============================================================
  //  首页按钮双页面模式 (已注释)
  //  - recommend.html → 显示"首页" → 跳转 index.html
  //  - index.html → 显示"返回" → 跳转 recommend.html
  //  保留注释以备后续需要恢复
  // ============================================================
  // function updateHomeNavItem() {
  //   var navHome = document.getElementById('navHome');
  //   if (!navHome) return;
  //
  //   var label = navHome.querySelector('.bottom-nav-label');
  //
  //   if (currentPage === 'index.html') {
  //     sessionStorage.setItem('nav_return_mode', '1');
  //     label.textContent = '返回';
  //     navHome.setAttribute('href', 'recommend.html');
  //     navHome.classList.add('active');
  //   } else if (currentPage === 'recommend.html') {
  //     sessionStorage.removeItem('nav_return_mode');
  //     label.textContent = '首页';
  //     navHome.setAttribute('href', 'index.html');
  //   } else if (sessionStorage.getItem('nav_return_mode') === '1') {
  //     label.textContent = '返回';
  //     navHome.setAttribute('href', 'index.html');
  //   } else {
  //     label.textContent = '首页';
  //     navHome.setAttribute('href', 'recommend.html');
  //   }
  // }

  // ============================================================
  //  首页点击切换 Feed/列表 (已注释)
  // ============================================================
  // function bindHomeToggle() {
  //   // 首页按钮已改为双页面跳转模式，不再拦截点击做 feed/list 切换
  // }

  // ============================================================
  //  加号按钮 → 弹出 Action Sheet（仅移动端）
  // ============================================================
  function bindCreateActionSheet() {
    var createBtn = document.querySelector('.bottom-nav-create');
    var overlay = document.getElementById('createActionOverlay');
    var cancelBtn = document.getElementById('createActionCancel');
    if (!createBtn || !overlay) return;

    // 点击加号 → 显示弹窗
    createBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    // 关闭弹窗
    function closeSheet() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    // 点击遮罩关闭
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeSheet();
      }
    });

    // 取消按钮关闭
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        closeSheet();
      });
    }

  }

  // ============================================================
  //  首页暗色导航
  // ============================================================
  function applyNavTheme() {
    const isHome = currentPage === 'recommend.html';
    const wrapper = document.querySelector('.bottom-nav-wrapper');
    if (wrapper) {
      wrapper.classList.toggle('nav-dark', isHome);
    }
  }

  // ============================================================
  //  Fallback HTML
  // ============================================================
  function insertFallbackBottomNav() {
    const html = `<div class="bottom-nav-wrapper">
    <div class="bottom-nav">
    <a class="bottom-nav-item" href="recommend.html" data-tab="home" id="navHome">
      <svg class="bottom-nav-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform:rotate(90deg)">
        <path d="M20 8l-4-4m0 0l-4 4m4-4v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4 16l4 4m0 0l4-4m-4 4V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="bottom-nav-label">首页</span>
    </a>
    <a class="bottom-nav-item" href="launchpad.html" data-tab="market">
      <svg class="bottom-nav-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      <span class="bottom-nav-label">市场</span>
    </a>
    <a class="bottom-nav-item bottom-nav-create" href="launch.html" data-tab="create" aria-label="发射">
      <svg class="bottom-nav-icon-create" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </a>
    <a class="bottom-nav-item" href="coin-detail.html" data-tab="trade">
      <svg class="bottom-nav-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="7" width="4" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
        <rect x="10" y="4" width="4" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/>
        <rect x="17" y="10" width="4" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5 3.5V7M5 16v4.5M12 3.5v.5M12 16v4.5M19 3.5v6.5M19 18v2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span class="bottom-nav-label">交易</span>
    </a>
    <a class="bottom-nav-item" href="assets.html" data-tab="assets">
      <svg class="bottom-nav-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
      <span class="bottom-nav-label">资产</span>
    </a>
  </div>

  <!-- 加号弹出菜单 Overlay (fallback) -->
  <div class="create-action-overlay" id="createActionOverlay">
    <div class="create-action-sheet">
      <div class="create-action-sheet-grip"></div>
      <a class="create-action-option is-primary" href="launch.html">
        <span class="create-action-option-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2l2.4 6.2L21 9.3l-5 4.9 1.2 6.8L12 17.8l-5.2 3.2L8 14.2l-5-4.9 6.6-1.1L12 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="create-action-option-text">
          <span class="create-action-option-label">发射代币</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </a><a class="create-action-option" href="publish.html">
        <span class="create-action-option-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="1.5"/>
            <path d="M3 9h18" stroke="currentColor" stroke-width="1.5"/>
            <path d="M9 21V9" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 7v2M16 5v2M8 5v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </span>
        <span class="create-action-option-text">
          <span class="create-action-option-label">发布短剧</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </a>
      <a class="create-action-option" href="publish-video.html">
        <span class="create-action-option-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" stroke-width="1.5"/>
            <polygon points="10,8 10,16 17,12" fill="currentColor"/>
          </svg>
        </span>
        <span class="create-action-option-text">
          <span class="create-action-option-label">发布视频</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </a>
      
      <button class="create-action-cancel" id="createActionCancel">取消</button>
    </div>
  </div>
</div>`;
    insertBottomNav(html);

  }

  // ============================================================
  //  XHR 回退加载
  // ============================================================
  function tryLoadByXHR() {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'bottom-nav.html');
      xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 0) {
          insertBottomNav(xhr.responseText);
        } else {
          console.warn('Bottom nav XHR 状态异常:', xhr.status);
          insertFallbackBottomNav();
        }
      };
      xhr.onerror = function() {
        console.warn('Bottom nav XHR 失败');
        insertFallbackBottomNav();
      };
      xhr.send();
    } catch (error) {
      console.warn('Bottom nav XHR 异常:', error);
      insertFallbackBottomNav();
    }
  }

  // ============================================================
  //  主加载流程
  // ============================================================
  fetch('bottom-nav.html')
    .then(response => {
      if (!response.ok) throw new Error('Bottom nav 加载失败');
      return response.text();
    })
    .then(insertBottomNav)
    .catch(err => {
      console.warn('Bottom nav fetch 失败，尝试 XHR 或直接回退:', err);
      tryLoadByXHR();
    });
})();