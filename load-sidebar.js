// ============================================================
// StoryFun 侧边导航栏加载器 (桌面端)
// 替代顶部 header，参考抖音 Web 侧边导航风格
// 自动注入 sidebar 到页面中（内嵌模式，不依赖 fetch）
// ============================================================

(function() {
    'use strict';

    // 内嵌侧边栏样式
    function injectStyles() {
        if (document.getElementById('sb-injected-styles')) return;
        var style = document.createElement('style');
        style.id = 'sb-injected-styles';
        style.textContent = [
            '.app-sidebar{position:fixed;top:0;left:0;bottom:0;z-index:900;width:160px;background:rgba(255,255,255,0.95);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);display:flex;flex-direction:column;padding:0 12px;transition:transform 0.3s ease;overflow-y:auto}',
            '.sb-logo{display:flex;align-items:center;gap:10px;padding:20px 12px 24px;text-decoration:none;flex-shrink:0}',
            '.sb-logo-img{width:32px;height:32px;border-radius:8px;flex-shrink:0}',
            '.sb-logo-text{font-size:18px;font-weight:700;background:linear-gradient(135deg,#ff3b30,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.3px;white-space:nowrap}',
            '.sb-logo-sub{font-size:10px;color:#7c3aed;font-weight:400;line-height:1.2}',
            '.sb-nav{display:flex;flex-direction:column;gap:2px;flex:1;padding:4px 0}',
            '.sb-nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;color:#5e6f83;text-decoration:none;font-size:15px;font-weight:500;transition:all 0.2s ease;cursor:pointer;border:none;background:none;text-align:left;width:100%}',
            '.sb-nav-item:hover{background:rgba(0,0,0,0.04);color:#13202e}',
            '.sb-nav-item.active{color:#13202e;background:rgba(167,139,250,0.12)}',
            '.sb-nav-item svg{width:22px;height:22px;flex-shrink:0;stroke:currentColor;fill:none}',
            '.sb-nav-item .sb-label{white-space:nowrap}',
            '.sb-divider{height:1px;background:rgba(0,0,0,.06);margin:4px 8px}',
            '.sb-nav-dropdown{position:relative}',
            '.sb-submenu{position:absolute;left:100%;top:0;background:rgba(255,255,255,0.97);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-radius:10px;padding:4px;min-width:140px;box-shadow:0 8px 30px rgba(0,0,0,0.1);border:1px solid rgba(0,0,0,0.06);opacity:0;visibility:hidden;transform:translateX(-6px);transition:all 0.2s ease;pointer-events:none;z-index:9999}',
            '.app-sidebar{position:fixed;top:0;left:0;bottom:0;z-index:900;width:160px;background:rgba(255,255,255,0.95);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);display:flex;flex-direction:column;padding:0 12px;transition:transform 0.3s ease;overflow:visible}',
            '.sb-nav-dropdown:hover .sb-submenu{opacity:1;visibility:visible;transform:translateX(0);pointer-events:auto}',
            '.sb-submenu::before{content:"";position:absolute;right:100%;top:0;width:8px;height:100%}.sb-submenu a{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:7px;color:#5e6f83;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.15s;white-space:nowrap}',
            '.sb-submenu a:hover{background:rgba(0,0,0,0.04);color:#13202e}',
            '.sb-submenu a svg{width:16px;height:16px;flex-shrink:0;stroke:currentColor;fill:none}',
            '.sb-settings{position:relative;margin-top:auto;padding:8px 0 12px;border-top:1px solid rgba(0,0,0,.06)}',
            '.sb-settings-trigger{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;color:#5e6f83;cursor:pointer;transition:all .2s}',
            '.sb-settings-trigger:hover{background:rgba(0,0,0,.04);color:#13202e}',
            '.sb-settings-trigger svg{width:22px;height:22px;flex-shrink:0;stroke:currentColor;fill:none}',
            '.sb-settings-menu{position:absolute;left:0;bottom:100%;margin-bottom:4px;background:rgba(255,255,255,.97);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-radius:10px;padding:4px;min-width:140px;box-shadow:0 8px 30px rgba(0,0,0,.1);border:1px solid rgba(0,0,0,.06);opacity:0;visibility:hidden;transform:translateY(6px);transition:all .2s ease;pointer-events:none;z-index:9999}',
            '.sb-settings:hover .sb-settings-menu{opacity:1;visibility:visible;transform:translateY(0);pointer-events:auto}',
            '.sb-settings-menu::after{content:"";position:absolute;left:0;top:100%;width:100%;height:8px}',
            '.sb-settings-item{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:7px;color:#5e6f83;text-decoration:none;font-size:14px;font-weight:500;cursor:pointer;transition:all .15s;white-space:nowrap;border:none;background:none;width:100%;text-align:left;font-family:inherit}',
            '.sb-settings-item:hover{background:rgba(0,0,0,.04);color:#13202e}',
            '.sb-settings-item svg{width:16px;height:16px;flex-shrink:0;stroke:currentColor;fill:none}',
            '.sb-main-offset{margin-left:160px}',
            '@media(max-width:768px){.app-sidebar{display:none}.sb-main-offset{margin-left:0!important}}'
        ].join('');
        document.head.appendChild(style);
    }

    // 内嵌侧边栏 HTML
    function buildSidebarHTML() {
        return '' +
            '<aside class="app-sidebar" id="appSidebar">' +
                '<a href="index.html" class="sb-logo">' +
                    '<img src="image/storyfun-logo-icon-red.png" alt="StoryFun" class="sb-logo-img">' +
                    '<div>' +
                        '<div class="sb-logo-text">StoryFun</div>' +
                    '</div>' +
                '</a>' +
                '<nav class="sb-nav" id="sbNav">' +
                    // —— 组 1：市场 / 资产 / 数据 ——
                    '<a href="launchpad.html" class="sb-nav-item" data-page="launchpad.html">' +
                      '<svg viewBox="0 0 24 24" stroke-width="1.8"><path d="M5 3v18M5 3l14 5-14 5M19 21l-1-6-4-2 4-2 1-6"/><path d="M5 3v6m0 6v6"/></svg>' +
                      '<span class="sb-label">市场</span>' +
                    '</a>' +
                    '<a href="assets.html" class="sb-nav-item" data-page="assets.html">' +
                      '<svg viewBox="0 0 24 24" stroke-width="1.8"><rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M2.5 10h19"/><path d="M16 14.5h2"/></svg>' +
                      '<span class="sb-label">资产</span>' +
                    '</a>' +
                    '<a href="analytics.html" class="sb-nav-item" data-page="analytics.html">' +
                      '<svg viewBox="0 0 24 24" stroke-width="1.8"><path d="M4 20V14m5 6V9m6 11V4m5 16v-8"/></svg>' +
                      '<span class="sb-label">数据</span>' +
                    '</a>' +
                    '<div class="sb-divider"></div>' +
                    // —— 组 2：推荐 / 短剧 / 创作 / 我的 ——
                    '<a href="recommend.html" class="sb-nav-item" data-page="recommend.html">' +
                      '<svg viewBox="0 0 24 24" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>' +
                      '<span class="sb-label">推荐</span>' +
                    '</a>' +
                    '<a href="index.html" class="sb-nav-item" data-page="index.html">' +
                      '<svg viewBox="0 0 24 24" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
                      '<span class="sb-label">短剧</span>' +
                    '</a>' +
                    '<a href="narrator.html" class="sb-nav-item" data-page="narrator.html">' +
                      '<svg viewBox="0 0 24 24" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' +
                      '<span class="sb-label">创作</span>' +
                    '</a>' +
                    '<a href="profile-center.html" class="sb-nav-item" data-page="profile-center.html">' +
                      '<svg viewBox="0 0 24 24" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
                      '<span class="sb-label">我的</span>' +
                    '</a>' +
                  '</nav>' +
                '<div class="sb-settings">' +
                    '<div class="sb-settings-trigger">' +
                        '<svg viewBox="0 0 24 24" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' +
                        '<span class="sb-label">设置</span>' +
                    '</div>' +
                    '<div class="sb-settings-menu">' +
                        '<button class="sb-settings-item" onclick="openNotifySettingsFromSidebar()"><svg viewBox="0 0 24 24" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>通知设置</button>' +
                        '<button class="sb-settings-item" onclick="showToast(\'浅色模式暂未开放\')"><svg viewBox="0 0 24 24" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>浅色模式</button>' +
                        '<button class="sb-settings-item" onclick="showToast(\'深色模式暂未开放\')"><svg viewBox="0 0 24 24" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>深色模式</button>' +
                        '<button class="sb-settings-item" onclick="showToast(\'语言切换暂未开放\')"><svg viewBox="0 0 24 24" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>语言</button>' +
                    '</div>' +
                '</div>' +
            '</aside>';
    }

    // 注入 sidebar HTML 到 body 最前面
    function injectSidebarHTML() {
        var html = buildSidebarHTML();
        var temp = document.createElement('div');
        temp.innerHTML = html;
        var sidebar = temp.querySelector('.app-sidebar');
        if (sidebar) {
            document.body.insertBefore(sidebar, document.body.firstChild);
        }
    }

    // 执行 sidebar 中的脚本逻辑
    function runSidebarScripts() {
        // 高亮当前页面
        var path = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.sb-nav-item').forEach(function(item) {
            var href = item.getAttribute('href');
            if (href === path) {
                item.classList.add('active');
            }
        });

        // 给 body 添加偏移 class
        document.body.classList.add('sb-main-offset');
    }

    // 主流程
    function init() {
        injectStyles();
        injectSidebarHTML();
        runSidebarScripts();
        ensureNotifySettings();
    }

    // 确保 notify-settings.js 已加载（侧边栏「通知设置」弹窗依赖）
    function ensureNotifySettings() {
        if (typeof window.StoryFunNotify !== 'undefined') return;
        var script = document.createElement('script');
        script.src = 'notify-settings.js';
        document.head.appendChild(script);
    }

    // 侧边栏「通知设置」：打开弹窗
    window.openNotifySettingsFromSidebar = function () {
        if (typeof window.StoryFunNotify !== 'undefined' && window.StoryFunNotify.openNotifySettingsModal) {
            window.StoryFunNotify.openNotifySettingsModal();
            return;
        }
        // 尚未加载完成时兜底：加载后再打开
        ensureNotifySettings();
        var tries = 0;
        var timer = setInterval(function () {
            tries++;
            if (typeof window.StoryFunNotify !== 'undefined' && window.StoryFunNotify.openNotifySettingsModal) {
                clearInterval(timer);
                window.StoryFunNotify.openNotifySettingsModal();
            } else if (tries > 20) {
                clearInterval(timer);
                if (typeof showToast === 'function') showToast('设置加载失败，请刷新重试');
            }
        }, 100);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();