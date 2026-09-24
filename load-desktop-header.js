// ============================================================
// StoryFun 桌面端顶栏加载器
// 自包含 Desktop Header 样式 + HTML + 交互逻辑
// 所有页面统一引入此脚本即可
// ============================================================

(function() {
    'use strict';

    // 内嵌 Desktop Header 样式
    function injectStyles() {
        if (document.getElementById('dh-injected-styles')) return;
        var style = document.createElement('style');
        style.id = 'dh-injected-styles';
        style.textContent = [
            '.desktop-header{position:fixed;top:0;left:0;right:0;justify-content:flex-end;z-index:151;height:56px;padding:0 20px;display:flex;align-items:center;gap:12px;background:#fff;border-bottom:none}',
            '.desktop-header .dh-search{position:absolute;left:50%;transform:translateX(-50%);width:520px;min-width:0;display:flex;align-items:center;gap:8px;padding:4px 14px;border-radius:999px;background:rgba(0,0,0,0.04);border:1px solid transparent;transition:all .2s}',
            '.desktop-header .dh-search:focus-within{border-color:#000000;background:#fff;box-shadow:0 0 0 3px rgba(0, 0, 0,.12)}',
            '.desktop-header .dh-search svg{width:16px;height:16px;flex-shrink:0;color:rgba(0,0,0,.35)}',
            '.desktop-header .dh-search input{flex:1;border:none;outline:none;background:none;font-size:13px;color:#13202e;font-family:inherit}',
            '.desktop-header .dh-search input::placeholder{color:rgba(0,0,0,.35)}',
            '.desktop-header .dh-search-btn{padding:3px 12px;height:auto;border-radius:999px;border:none;background:rgba(0,0,0,.06);color:rgba(0,0,0,.5);font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;margin-right:-4px}',
            '.desktop-header .dh-search-btn:hover{background:#000000;color:#fff;border-color:#000000}',
            '.desktop-header .dh-search-btn svg{width:18px;height:18px}',
            '.dh-search-dropdown{display:none;position:absolute;left:0;right:0;top:100%;margin-top:6px;background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.1);border:1px solid rgba(0,0,0,.06);padding:16px;z-index:200;max-height:360px;overflow-y:auto}',
            '.dh-search-dropdown.show{display:block}',
            '.dh-search-dropdown .sd-section{margin-bottom:14px}',
            '.dh-search-dropdown .sd-section:last-child{margin-bottom:0}',
            '.dh-search-dropdown .sd-section-title{font-size:12px;font-weight:600;color:#5e6f83;margin-bottom:8px}',

            '.dh-search-dropdown .sd-list{display:flex;flex-direction:column;gap:2px}',
            '.dh-search-dropdown .sd-item{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;font-size:13px;color:#13202e;cursor:pointer;transition:background .1s}',
            '.dh-search-dropdown .sd-item:hover{background:rgba(0,0,0,.03)}',
            '.dh-search-dropdown .sd-item .sd-del{color:#5e6f83;font-size:11px;padding:2px 6px;border-radius:4px;cursor:pointer;border:none;background:none}',
            '.dh-search-dropdown .sd-item .sd-del:hover{color:#f45b69}',
            '.desktop-header .dh-icon-btn{width:36px;height:36px;border-radius:50%;border:none;background:none;color:rgba(0,0,0,.55);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;position:relative;flex-shrink:0}',
            '.desktop-header .dh-icon-btn:hover{background:rgba(0,0,0,.06);color:#13202e}',
            '.desktop-header .dh-icon-btn svg{width:20px;height:20px}',
            '.desktop-header .dh-notify-dot{position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:#ff2d55;border:1.5px solid #fff}',
            '.desktop-header .dh-launch-link{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:999px;border:1px solid var(--border,#e5e7eb);color:#13202e;font-size:12.5px;font-weight:600;text-decoration:none;cursor:pointer;transition:all .15s;flex-shrink:0;white-space:nowrap}',
            '.desktop-header .dh-launch-link:hover{background:rgba(0,0,0,.05)}',
            '.desktop-header .dh-publish-btn{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 16px;border-radius:999px;border:none;background:#000000;color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;flex-shrink:0}',
            '.desktop-header .dh-publish-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0, 0, 0,.3)}',
            '.desktop-header .dh-publish-btn svg{width:15px;height:15px}',
            '.desktop-header .dh-publish-btn .dh-publish-caret{width:11px;height:11px;opacity:.8;transition:transform .2s ease}',
            /* hover 展开：透明桥接区避免鼠标从按钮移入菜单时收起 */
            '.dh-publish-wrap{position:relative;flex-shrink:0;z-index:420}',
            '.dh-publish-wrap::after{content:"";position:absolute;left:0;right:0;top:100%;height:8px}',
            '.dh-publish-dropdown{position:absolute;top:calc(100% + 8px);right:0;min-width:168px;background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.1);padding:4px;opacity:0;visibility:hidden;transform:translateY(-6px);transition:all .22s ease;z-index:300}',
            '.dh-publish-wrap:hover .dh-publish-dropdown,.dh-publish-wrap:focus-within .dh-publish-dropdown{opacity:1;visibility:visible;transform:translateY(0)}',
            '.dh-publish-wrap:hover .dh-publish-caret,.dh-publish-wrap:focus-within .dh-publish-caret{transform:rotate(180deg)}',
            '.dh-publish-item{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;color:#1C1C1E;text-decoration:none;font-size:13px;font-weight:600;transition:background .15s;white-space:nowrap}',
            '.dh-publish-item:hover{background:rgba(0,0,0,.04)}',
            '.dh-publish-item svg{width:16px;height:16px;flex-shrink:0;color:#8E8E93}',
            '.dh-publish-item.is-primary{color:#000}',
            '.dh-publish-item.is-primary svg{color:#000;stroke-width:1.6}',
            '.desktop-header .dh-avatar{width:34px;height:34px;border-radius:50%;object-fit:contain;cursor:pointer;border:1.5px solid rgba(0,0,0,.08);flex-shrink:0;transition:border-color .15s}',
            '.desktop-header .dh-avatar:hover{border-color:#000000}',
            '.desktop-header .dh-login-btn{padding:6px 16px;border-radius:999px;border:1px solid #000000;background:none;color:#000000;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;transition:all .15s}',
            '.desktop-header .dh-login-btn:hover{background:rgba(0, 0, 0,.12)}',
            '.desktop-header .dh-usdc-badge{display:inline-flex;align-items:center;gap:6px;padding:3px 4px 3px 14px;border-radius:999px;background:rgba(0,0,0,.04);font-size:12px;font-weight:600;color:#13202e;flex-shrink:0;cursor:pointer;position:relative}',
            '.desktop-header .dh-usdc-badge svg{width:14px;height:14px;flex-shrink:0}',
            '.desktop-header .dh-usdc-badge .dh-avatar-wrap{margin:0}',
            '.desktop-header .dh-usdc-badge .dh-avatar{width:30px;height:30px;border:none}',
            '.desktop-header .auth-login-btn{margin-left:auto}',
            '@media(min-width:769px){.desktop-header{left:160px;right:0}body{padding-top:56px}}',
            '.dh-eth-wrap{position:relative;flex-shrink:0;z-index:400;pointer-events:auto}',
            '.dh-eth{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 10px 0 6px;border-radius:999px;border:1px solid rgba(0,0,0,.08);background:rgba(0,0,0,.03);color:#13202e;font-size:12.5px;font-weight:700;cursor:pointer;user-select:none;-webkit-user-select:none}',
            '.dh-eth .dh-eth-coin{width:22px;height:22px;border-radius:50%;background:#627EEA;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800}',
            '.dh-eth-drop{position:absolute;top:calc(100% + 8px);right:0;min-width:200px;background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.1);padding:10px;opacity:0;visibility:hidden;transform:translateY(-6px);transition:all .22s ease;z-index:300}',
            '.dh-eth-wrap.open .dh-eth-drop{opacity:1;visibility:visible;transform:translateY(0)}',
            '.dh-eth-row{display:flex;justify-content:space-between;gap:10px;padding:6px 4px;font-size:12.5px;color:#13202e}',
            '.dh-eth-row span{color:#8896a8}',
            '.dh-eth-give{margin-top:6px;width:100%;height:32px;border:none;border-radius:9px;background:#000;color:#fff;font-size:12.5px;font-weight:600;cursor:pointer}',
            '@media(max-width:768px){.desktop-header{display:none}}',
            '/* ── 商店 hover 下拉（无遮罩）── */',
            '@media(min-width:769px){',
            '.dh-shop-wrap{position:relative;flex-shrink:0;display:flex;align-items:center}',
            '.dh-shop-dropdown{position:absolute;top:calc(100% + 8px);right:0;width:340px;background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.1);padding:12px;opacity:0;visibility:hidden;transform:translateY(-6px);transition:all .22s ease;z-index:300}',
            '.dh-shop-wrap:hover .dh-shop-dropdown{opacity:1;visibility:visible;transform:translateY(0)}',
            '}',
            '/* ── Notify Dropdown (matches notifications.html cards) ── */',
            '@media(min-width:769px){',
            '.dh-notify-wrap{position:relative;flex-shrink:0;display:flex;align-items:center;gap:4px}',
            '.dh-notify-dropdown{position:absolute;top:calc(100% + 8px);right:0;width:460px;max-height:540px;background:#f8f9fb;border:1px solid rgba(0,0,0,.06);border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.1);opacity:0;visibility:hidden;transform:translateY(-6px);transition:all .22s ease;z-index:300;overflow:hidden;display:flex;flex-direction:column}',
            '.dh-notify-wrap:hover .dh-notify-dropdown{opacity:1;visibility:visible;transform:translateY(0)}',
'.dh-notify-dropdown .dn-header{display:flex;align-items:center;justify-content:center;padding:12px 16px 8px;flex-shrink:0;gap:24px}',
'.dh-notify-dropdown .dn-tab{padding:6px 0 4px;border:none;background:none;font-size:13px;font-weight:500;color:#8896a8;cursor:pointer;position:relative;transition:color .2s}',
'.dh-notify-dropdown .dn-tab.active{color:#1a1a2e;font-weight:600}',
'.dh-notify-dropdown .dn-tab.active::after{content:"";position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:16px;height:2.5px;border-radius:2px;background:#000000}',
            '.dh-notify-dropdown .dn-scroll{flex:1;overflow-y:auto;padding:4px 8px 8px}',
'.dh-notify-dropdown .notify-item[data-category="social"]{display:none}',
            '.dh-notify-dropdown .dn-scroll::-webkit-scrollbar{width:0}',
            '/* mirror notifications.html card styles */',
            '.dh-notify-dropdown .notify-item{display:flex;flex-direction:column;gap:0;padding:12px 14px 8px;position:relative;background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.03);margin-bottom:8px;transition:box-shadow .15s;cursor:pointer}',
            '.dh-notify-dropdown .notify-item:active{box-shadow:0 2px 8px rgba(0,0,0,.06)}',
            '.dh-notify-dropdown .notify-item[data-category="revenue"]{padding:12px 16px 10px}',
            '.dh-notify-dropdown .revenue-row{display:flex;align-items:flex-start;gap:12px}',
            '.dh-notify-dropdown .social-row{display:flex;align-items:center;gap:12px;}',
            '.dh-notify-dropdown .notify-icon{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:17px}',
            '.dh-notify-dropdown .notify-icon.avatar{overflow:hidden;background:#f0f2f5}',
            '.dh-notify-dropdown .notify-icon.avatar img{width:100%;height:100%;object-fit:cover}',
            '.dh-notify-dropdown .notify-icon.revenue{background:rgba(0, 0, 0,.08)}',
            '.dh-notify-dropdown .notify-content{flex:1;min-width:0}',
            '.dh-notify-dropdown .revenue-title{display:inline-block;font-size:9px;font-weight:600;color:#000000;background:rgba(0, 0, 0,.08);padding:2px 7px;border-radius:5px;margin-bottom:5px}',
            '.dh-notify-dropdown .notify-desc{font-size:13px;color:#1a1a2e;line-height:1.45;font-weight:400}',
            '.dh-notify-dropdown .notify-desc strong{font-weight:700}',
            '.dh-notify-dropdown .revenue-amount{font-size:13px;font-weight:700;margin-top:3px}',
            '.dh-notify-dropdown .rcv-usdc{color:#000000}',
            '.dh-notify-dropdown .rcv-story{color:#000000}',
            '.dh-notify-dropdown .notify-meta{font-size:10px;color:#8896a8;margin-top:5px}',
            '.dh-notify-dropdown .notify-time{font-size:10px;color:#8896a8;opacity:.7;margin-top:2px}',
            '.dh-notify-dropdown .notify-thumb{width:36px;height:36px;border-radius:7px;flex-shrink:0;overflow:hidden;background:#f0f2f5}',
            '.dh-notify-dropdown .notify-thumb img{width:100%;height:100%;object-fit:cover}',
            '.dh-notify-dropdown .notify-item.unread::before{content:\'\';position:absolute;left:7px;top:18px;width:5px;height:5px;border-radius:50%;background:#000000}',
            '.dh-notify-dropdown .rev-act-btn{flex-shrink:0;padding:5px 12px;border-radius:999px;border:none;background:#000000;color:#fff;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;align-self:center}',
            '.dh-notify-dropdown .follow-btn{flex-shrink:0;padding:4px 10px;border-radius:999px;border:1px solid #000000;background:transparent;color:#000000;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap}',
            '.dh-notify-dropdown .follow-btn.mutual{background:rgba(0, 0, 0,.08);border-color:transparent}',
            '.dh-notify-dropdown .sact-btn{display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:999px;border:1px solid #eef0f4;background:transparent;color:#5e6f83;font-size:11px;font-weight:500;cursor:pointer}',
            '.dh-notify-dropdown .social-actions{display:flex;gap:6px;margin-top:8px}',
            '.dh-notify-dropdown .notify-footer{display:flex;justify-content:flex-end;margin-top:6px}',
            '.dh-notify-dropdown .notify-more{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;border:none;background:transparent;color:#8896a8;font-size:13px;cursor:pointer;letter-spacing:1px}',
            '.dh-notify-dropdown .delete-dropdown{position:absolute;top:100%;right:0;margin-top:3px;background:#fff;border:1px solid #eef0f4;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,.08);padding:3px 0;min-width:64px;z-index:5;display:none;text-align:center}',
            '.dh-notify-dropdown .delete-dropdown.show{display:block}',
            '.dh-notify-dropdown .delete-btn{display:block;width:100%;padding:6px 12px;border:none;background:transparent;color:#f45b69;font-size:11px;font-weight:500;cursor:pointer}',
            '/* ── 账户（头像+地址）── */',
            '.dh-acct-wrap{position:relative;flex-shrink:0;z-index:500;pointer-events:auto}',
            '.dh-acct-pill{display:inline-flex;align-items:center;gap:8px;height:38px;padding:2px 6px 2px 4px;border:1px solid rgba(0,0,0,.08);border-radius:999px;background:rgba(0,0,0,.03);cursor:pointer;transition:all .15s}',
            '.dh-acct-pill:hover{border-color:rgba(0,0,0,.22)}',
            '.dh-acct-avatar{width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0}',
            '.dh-acct-addr{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;font-weight:600;color:#13202e;white-space:nowrap}',
            '.dh-acct-drop{position:absolute;top:calc(100% + 8px);right:0;min-width:250px;background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.1);padding:8px;opacity:0;visibility:hidden;transform:translateY(-6px);transition:all .2s ease;z-index:600}',
            '.dh-acct-wrap.open .dh-acct-drop{opacity:1;visibility:visible;transform:translateY(0)}',
            '.dh-acct-head{display:flex;align-items:center;gap:10px;padding:6px 6px 10px}',
            '.dh-acct-head img{width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0}',
            '.dh-acct-head b{flex:1;min-width:0;font-size:13.5px;color:#13202e;font-family:ui-monospace,Menlo,Consolas,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
            '.dh-acct-copy{width:30px;height:30px;border-radius:8px;border:none;background:rgba(0,0,0,.04);color:#5e6f83;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}',
            '.dh-acct-copy:hover{background:rgba(0,0,0,.08);color:#13202e}',
            '.dh-acct-item{display:flex;align-items:center;gap:8px;width:100%;padding:10px 8px;border:none;background:none;border-top:1px solid #f0f2f4;color:#13202e;font-size:13px;font-weight:500;cursor:pointer;text-align:left}',
            '.dh-acct-item:hover{color:#f45b69}',
            '}'
        ].join('');
        document.head.appendChild(style);
    }

    // 内嵌 Desktop Header HTML
    function buildHeaderHTML() {
        return '' +
            '<div class="desktop-header" id="desktopHeader">' +
                '<div class="dh-search" id="dhSearch">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
                    '<input type="text" id="dhSearchInput" placeholder="搜索有趣的内容" autocomplete="off"><button class="dh-search-btn" id="dhSearchBtn">搜索</button>' +
                    '<div class="dh-search-dropdown" id="dhSearchDropdown">' +
                        '<div class="sd-section" id="sdRecentSection" style="display:none">' +
                            '<div class="sd-section-title">🕐 最近搜索</div>' +
                            '<div class="sd-list" id="sdRecentList"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="dh-notify-wrap">' +
                    '<button class="dh-icon-btn" title="通知">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
                        '<span class="dh-notify-dot"></span>' +
                    '</button>' +
                    '<div class="dh-notify-dropdown" id="dhNotifyDropdown">' +
                        '<div class="dn-header"><button class="dn-tab active" onclick="dhSwitchTab(event,\'social\')">互动<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#ff2d55;margin-left:5px;vertical-align:middle"></span></button></div>' +
                        '<div class="dn-scroll">' +
                            '<!-- 点赞视频 -->' +
                            '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>李云飞</strong></div><div class="notify-desc" style="font-weight:400">赞了你的视频</div><div class="notify-time">18分钟前</div></div><div class="notify-thumb"><img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=200&q=80" alt=""></div></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                            '<!-- 点赞短剧 -->' +
                            '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>苏婉清</strong></div><div class="notify-desc" style="font-weight:400">赞了你的短剧 《凤骨琉璃》</div><div class="notify-time">42分钟前</div></div><div class="notify-thumb"><img src="https://images.unsplash.com/photo-1512070679279-8988d32161be?auto=format&fit=crop&w=200&q=80" alt=""></div></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                            '<!-- 收藏视频 -->' +
                            '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>林梦瑶</strong></div><div class="notify-desc" style="font-weight:400">收藏了你的视频</div><div class="notify-time">1小时前</div></div><div class="notify-thumb"><img src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=200&q=80" alt=""></div></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                            '<!-- 收藏短剧 -->' +
                            '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>苏婉清</strong></div><div class="notify-desc" style="font-weight:400">收藏了你的短剧 《凤骨琉璃》</div><div class="notify-time">42分钟前</div></div><div class="notify-thumb"><img src="https://images.unsplash.com/photo-1512070679279-8988d32161be?auto=format&fit=crop&w=200&q=80" alt=""></div></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                            '<!-- 收到评论 -->' +
                            '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>赵无极</strong></div><div class="notify-desc" style="font-weight:400">评论了你：剧情太精彩了，期待下一集！</div><div class="notify-time">1小时前</div></div><div class="notify-thumb"><img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=200&q=80" alt=""></div></div><div class="social-actions"><button class="sact-btn">回复评论</button><button class="sact-btn">♡ 赞</button></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                            '<!-- 互相关注 -->' +
                            '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>苏婉清</strong></div><div class="notify-desc" style="font-weight:400">关注了你</div><div class="notify-time">5小时前</div></div><button class="follow-btn mutual">互关</button></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                            '<!-- 有人关注我 -->' +
                            '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>林梦瑶</strong></div><div class="notify-desc" style="font-weight:400">关注了你</div><div class="notify-time">3小时前</div></div><button class="follow-btn" >关注</button></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                // ── 发布（hover 展开：发射代币 / 发布短剧 / 发布视频）──
                '<div class="dh-publish-wrap">' +
                  '<button type="button" class="dh-publish-btn">' +
                    '发布' +
                    '<svg class="dh-publish-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
                  '</button>' +
                  '<div class="dh-publish-dropdown">' +
                    '<a class="dh-publish-item is-primary" href="publish-center.html">' +
                      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l2.4 6.2L21 9.3l-5 4.9 1.2 6.8L12 17.8l-5.2 3.2L8 14.2l-5-4.9 6.6-1.1L12 2z"/></svg>发布中心' +
                    '</a>' +
                  '</div>' +
                '</div>' +
                '<div class="dh-acct-wrap" id="dhAcct">' +
                    '<button type="button" class="dh-acct-pill" id="dhAcctPill">' +
                      '<img class="dh-acct-avatar" id="dhAcctAvatar" alt="" />' +
                      '<span class="dh-acct-addr num" id="dhAcctAddr">0x…</span>' +
                    '</button>' +
                    '<div class="dh-acct-drop">' +
                      '<div class="dh-acct-head">' +
                        '<img id="dhAcctDropAvatar" alt="" />' +
                        '<b id="dhAcctDropAddr">—</b>' +
                        '<button type="button" class="dh-acct-copy" id="dhAcctCopy" title="复制地址">' +
                          '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="9" height="9" rx="2"/><path d="M12 6h.5A1.5 1.5 0 0 1 14 7.5v5A1.5 1.5 0 0 1 12.5 14h-5A1.5 1.5 0 0 1 6 12.5V12"/></svg>' +
                        '</button>' +
                      '</div>' +
                      '<button type="button" class="dh-acct-item" id="dhDisconnect">Disconnect</button>' +
                    '</div>' +
                  '</div>' +

            '</div>';
    }

    // 注入 HTML 到 body 最前面（如果已存在则跳过渲染）
    function injectHeaderHTML() {
        if (!document.getElementById('desktopHeader')) {
            var html = buildHeaderHTML();
            var temp = document.createElement('div');
            temp.innerHTML = html;
            var header = temp.querySelector('.desktop-header');
            if (header) {
                document.body.insertBefore(header, document.body.firstChild);
            }
        }
    }

    // 绑定搜索交互
    function bindSearch() {
        var inp = document.getElementById('dhSearchInput');
        var dropdown = document.getElementById('dhSearchDropdown');
        var searchBox = document.getElementById('dhSearch');
        var searchBtn = document.getElementById('dhSearchBtn');
        if (!inp || !dropdown || !searchBox) return;

        renderSearchDropdown();

        inp.addEventListener('focus', function() {
            renderSearchDropdown();
            dropdown.classList.add('show');
        });

        inp.addEventListener('input', function() {
            if (inp.value.trim()) {
                dropdown.classList.remove('show');
            } else {
                renderSearchDropdown();
                dropdown.classList.add('show');
            }
        });

        inp.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                var q = inp.value.trim();
                if (q) doSearch(q);
            }
        });

        searchBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var q = inp.value.trim();
            if (q) doSearch(q);
        });

        document.addEventListener('click', function(e) {
            if (!searchBox.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    function doSearch(query) {
        if (!query || !query.trim()) return;
        query = query.trim();
        saveRecentSearch(query);
        location.href = 'search-results.html?q=' + encodeURIComponent(query);
    }

    function saveRecentSearch(q) {
        var list = JSON.parse(localStorage.getItem('dh_recent_searches') || '[]');
        list = list.filter(function(item) { return item !== q; });
        list.unshift(q);
        if (list.length > 8) list.pop();
        localStorage.setItem('dh_recent_searches', JSON.stringify(list));
    }

    function renderSearchDropdown() {
        var recent = JSON.parse(localStorage.getItem('dh_recent_searches') || '[]');
        var recentSection = document.getElementById('sdRecentSection');
        var recentList = document.getElementById('sdRecentList');
        if (recentSection && recentList && recent.length > 0) {
            recentSection.style.display = '';
            recentList.innerHTML = recent.map(function(r) {
                return '<div class="sd-item"><span>' + r + '</span><button class="sd-del">✕</button></div>';
            }).join('');
        } else if (recentSection) {
            recentSection.style.display = 'none';
        }
    }

    // 绑定搜索下拉的点击事件（通过事件委托）
    document.addEventListener('click', function(e) {
        var sdItem = e.target.closest('.sd-item');
        if (sdItem && !e.target.closest('.sd-del')) {
            var span = sdItem.querySelector('span');
            if (span) doSearch(span.textContent);
        }
        var sdDel = e.target.closest('.sd-del');
        if (sdDel) {
            var item = sdDel.closest('.sd-item');
            if (item) {
                var q = item.querySelector('span').textContent;
                var list = JSON.parse(localStorage.getItem('dh_recent_searches') || '[]');
                list = list.filter(function(i) { return i !== q; });
                localStorage.setItem('dh_recent_searches', JSON.stringify(list));
                renderSearchDropdown();
            }
        }
    });

    // 增强已有 header：给通知按钮添加下拉菜单
    // （发布按钮已由 buildHeaderHTML 直接输出，见 buildHeaderHTML 里的 dh-publish-wrap）
    function enhanceExistingHeader() {
        var header = document.getElementById('desktopHeader');
        if (!header) return false;

        // --- Notify button wrap ---
        var notifyBtn = header.querySelector('.dh-icon-btn[title="通知"]');
        if (notifyBtn && !(notifyBtn.parentNode && notifyBtn.parentNode.classList.contains('dh-notify-wrap'))) {
            var nWrap = document.createElement('div');
            nWrap.className = 'dh-notify-wrap';

            var nDropdown = document.createElement('div');
            nDropdown.className = 'dh-notify-dropdown';
            nDropdown.innerHTML =
                '<div class="dn-header"><button class="dn-tab active" onclick="dhSwitchTab(event,\'social\')">互动</button></div>' +
                '<div class="dn-scroll">' +
                    '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>李云飞</strong></div><div class="notify-desc" style="font-weight:400">赞了你的视频</div><div class="notify-time">18分钟前</div></div><div class="notify-thumb"><img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=200&q=80" alt=""></div></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                    '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>苏婉清</strong></div><div class="notify-desc" style="font-weight:400">赞了你的短剧 《凤骨琉璃》</div><div class="notify-time">42分钟前</div></div><div class="notify-thumb"><img src="https://images.unsplash.com/photo-1512070679279-8988d32161be?auto=format&fit=crop&w=200&q=80" alt=""></div></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                    '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>林梦瑶</strong></div><div class="notify-desc" style="font-weight:400">收藏了你的视频</div><div class="notify-time">1小时前</div></div><div class="notify-thumb"><img src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=200&q=80" alt=""></div></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                    '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>苏婉清</strong></div><div class="notify-desc" style="font-weight:400">收藏了你的短剧 《凤骨琉璃》</div><div class="notify-time">42分钟前</div></div><div class="notify-thumb"><img src="https://images.unsplash.com/photo-1512070679279-8988d32161be?auto=format&fit=crop&w=200&q=80" alt=""></div></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                    '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>赵无极</strong></div><div class="notify-desc" style="font-weight:400">评论了你：剧情太精彩了，期待下一集！</div><div class="notify-time">1小时前</div></div><div class="notify-thumb"><img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=200&q=80" alt=""></div></div><div class="social-actions"><button class="sact-btn">回复评论</button><button class="sact-btn">♡ 赞</button></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                    '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>苏婉清</strong></div><div class="notify-desc" style="font-weight:400">关注了你</div><div class="notify-time">5小时前</div></div><button class="follow-btn mutual">互关</button></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                    '<div class="notify-item unread" data-category="social"><div class="social-row"><div class="notify-icon avatar"><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" alt=""></div><div class="notify-content"><div class="notify-desc"><strong>林梦瑶</strong></div><div class="notify-desc" style="font-weight:400">关注了你</div><div class="notify-time">3小时前</div></div><button class="follow-btn">关注</button></div><div class="notify-footer"><button class="notify-more" onclick="dhToggleDelete(event,this)">···</button><div class="delete-dropdown"><button class="delete-btn" onclick="dhDeleteNotify(event,this)">删除</button></div></div></div>' +
                '</div>';

            notifyBtn.parentNode.insertBefore(nWrap, notifyBtn);
            nWrap.appendChild(notifyBtn);
            nWrap.appendChild(nDropdown);
        }

        return true;
    }

    // 动态加载 auth.js（如果尚未加载）
    function ensureAuthScript(callback) {
        if (typeof initAuth === 'function') { callback(); return; }
        var script = document.createElement('script');
        script.src = 'auth.js';
        script.onload = callback;
        script.onerror = callback;
        document.head.appendChild(script);
    }

    // 给 header 通知下拉条目打上子类型标记（social: like/save/comment/follow）
    // 依据条目内文本判断，避免逐条改写长 HTML 字符串
    function classifyHeaderNotifyItems() {
        document.querySelectorAll('.dh-notify-dropdown .notify-item').forEach(function(item) {
            var cat = item.getAttribute('data-category');
            if (!cat) return;
            var text = item.textContent || '';
            var st = 'like';
            if (text.indexOf('收藏') !== -1) st = 'save';
            else if (text.indexOf('评论') !== -1) st = 'comment';
            else if (text.indexOf('关注') !== -1) st = 'follow';
            item.setAttribute('data-sotype', st);
        });
    }

    // 通知设置联动：按「激活 tab + 通知设置」统一计算 header 下拉条目可见性，并刷新红点
    function dhApplyNotifyFilter() {
        var dd = document.querySelector('.dh-notify-dropdown');
        if (!dd) return;
        var settings = (typeof window.StoryFunNotify !== 'undefined') ? window.StoryFunNotify.getSettings() : null;
        var activeTabEl = dd.querySelector('.dn-tab.active');
        var tabText = activeTabEl ? (activeTabEl.textContent || '').trim() : '互动';
        var tabCat = 'social';

        var anyUnreadVisible = false;
        dd.querySelectorAll('.notify-item').forEach(function(item) {
            var cat = item.getAttribute('data-category');
            var sub = item.getAttribute('data-sotype');
            var enabled = true;
            if (settings) {
                enabled = settings.master && window.StoryFunNotify.isNotifyEnabled(cat, sub);
            }
            if (!enabled || cat !== tabCat) { item.style.display = 'none'; return; }
            item.style.display = 'flex';
            if (item.classList.contains('unread')) anyUnreadVisible = true;
        });

        var dot = document.querySelector('.desktop-header .dh-notify-dot');
        if (dot) dot.style.display = anyUnreadVisible ? '' : 'none';
    }

    // 动态加载 notify-settings.js（如果尚未加载）
    function ensureNotifySettingsScript(callback) {
        if (typeof window.StoryFunNotify !== 'undefined') { callback(); return; }
        var script = document.createElement('script');
        script.src = 'notify-settings.js';
        script.onload = callback;
        script.onerror = callback;
        document.head.appendChild(script);
    }

    // Tab switch in notify dropdown
    window.dhSwitchTab = function(e, cat) {
        e.stopPropagation();
        var btn = e.target;
        var dd = btn.closest('.dh-notify-dropdown');
        if (!dd) return;
        // Toggle active
        dd.querySelectorAll('.dn-tab').forEach(function(t){t.classList.remove('active')});
        btn.classList.add('active');
        dhApplyNotifyFilter();
    };

    // Delete helpers for notify dropdown
    window.dhToggleDelete = function(e, btn) {
        e.stopPropagation();
        var dd = btn.parentElement.querySelector('.delete-dropdown');
        if (!dd) return;
        // Close all other dropdowns in the notify panel
        var panel = btn.closest('.dh-notify-dropdown');
        if (panel) {
            panel.querySelectorAll('.delete-dropdown.show').forEach(function(d) { d.classList.remove('show'); });
        }
        dd.classList.toggle('show');
    };
    window.dhDeleteNotify = function(e, btn) {
        e.stopPropagation();
        var item = btn.closest('.notify-item');
        if (item) item.remove();
    };

    // ── 账户区：头像 + 脱敏地址（模拟钱包直连；无 Privy 登录） ──
    var DH_FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
    function dhIsConnected() {
        if (window.currentWallet && typeof window.currentWallet.isConnected === 'function') return window.currentWallet.isConnected();
        try {
            var saved = JSON.parse(localStorage.getItem('storyfun_user') || 'null');
            return !!(saved && saved.isLoggedIn);
        } catch (e) { return false; }
    }
    function dhMaskAddr(seed) {
        var h = 2166136261, i = 0;
        var src = seed || 'demo';
        for (i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
        var hex = ('00000000' + (h >>> 0).toString(16)).slice(-8);
        return '0x' + hex.slice(0, 2).toUpperCase() + hex.slice(2, 4) + '…' + hex.slice(4, 6) + hex.slice(6, 8).toUpperCase();
    }
    function dhAvatar() {
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.avatar) return currentUser.avatar;
        return DH_FALLBACK_AVATAR;
    }
    function dhWalletText() {
        if (window.currentWallet && typeof window.currentWallet.masked === 'function') return window.currentWallet.masked();
        if (typeof window.Launch !== 'undefined' && Launch && Launch.walletText) return Launch.walletText();
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.id) return dhMaskAddr(currentUser.id);
        return '0xBD7e…bf0A';
    }
    function fillDhEth() {   // 兼容旧调用：渲染账户
        var addr = dhWalletText();
        var connected = dhIsConnected();
        var av = dhAvatar();
        var pillAv = document.getElementById('dhAcctAvatar');
        var pillAddr = document.getElementById('dhAcctAddr');
        var dropAv = document.getElementById('dhAcctDropAvatar');
        var dropAddr = document.getElementById('dhAcctDropAddr');
        if (!connected) {
            if (pillAv) pillAv.style.display = 'none';
            if (pillAddr) { pillAddr.textContent = '登录 / 注册'; pillAddr.classList.add('is-null'); }
            if (dropAv) dropAv.src = av;
            if (dropAddr) dropAddr.textContent = '—';
            return;
        }
        if (pillAv) { pillAv.style.display = ''; pillAv.src = av; }
        if (pillAddr) { pillAddr.textContent = addr; pillAddr.classList.remove('is-null'); }
        if (dropAv) dropAv.src = av;
        if (dropAddr) dropAddr.textContent = addr;
    }
    function bindLaunchEth() {   // 委托式账户交互（防重复）
        var wrap = document.getElementById('dhAcct');
        if (!wrap) return;
        fillDhEth();
        if (window.__dhAcctBound) return;
        window.__dhAcctBound = true;
        document.addEventListener('click', function (e) {
            var t = e.target;
            if (!t || !t.closest) return;
            var w = document.getElementById('dhAcct');
            if (!w) return;
            if (t.closest('#dhAcctPill')) {
                e.preventDefault();
                e.stopPropagation();
                if (!dhIsConnected()) {
                    if (typeof window.openLoginModal === 'function') window.openLoginModal();
                    return;
                }
                w.classList.toggle('open');
                return;
            }
            if (t.id === 'dhAcctCopy') {
                e.preventDefault();
                e.stopPropagation();
                var addr = (window.currentWallet && typeof window.currentWallet.address === 'function') ? window.currentWallet.address() : dhWalletText();
                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).catch(function () {});
                if (typeof showToast === 'function') showToast('钱包地址已复制', '⧉');
                return;
            }
            if (t.id === 'dhDisconnect') {
                e.preventDefault();
                e.stopPropagation();
                w.classList.remove('open');
                if (typeof window.doLogout === 'function') {
                    window.doLogout();          // 同步内存态 + 清存档 + 重渲染顶栏（无需整页刷新）
                } else {
                    try { localStorage.setItem('storyfun_user', JSON.stringify({ isLoggedIn: false, authMethod: null })); } catch (err) {}
                    setTimeout(function () { location.reload(); }, 120);
                }
                return;
            }
            if (!t.closest('.dh-acct-wrap')) w.classList.remove('open');
        }, true);
    }
    window.refreshDhEth = fillDhEth;

    // 主流程
    function init() {
        injectStyles();
        if (!enhanceExistingHeader()) {
            injectHeaderHTML();
        }
        bindSearch();
        // 通知设置联动：打标 + 按设置过滤下拉条目与红点
        ensureNotifySettingsScript(function() {
            classifyHeaderNotifyItems();
            dhApplyNotifyFilter();
        });
        // 确保 auth.js 已加载，然后渲染头像
        ensureAuthScript(function() {
            setTimeout(function() {
                if (typeof initAuth === 'function') initAuth();
            }, 50);
        });
        // Launch ETH pill（可能在 auth 后可用，做一次带重试的绑定）
        bindLaunchEth();
        if (typeof window.Launch === 'undefined') {
            var tries = 0;
            var tmr = setInterval(function () {
                tries++;
                if (typeof window.Launch !== 'undefined' || tries > 10) { clearInterval(tmr); bindLaunchEth(); }
            }, 120);
        }
        window.addEventListener('auth-ready', function () { fillDhEth(); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();