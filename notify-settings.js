// ============================================================
//  Story.fun - 通知设置公共模块 (notify-settings.js)
//
//  功能：
//    1. 提供通知偏好读写（localStorage: storyfun_notify_settings）
//    2. 提供类型开关查询 isNotifyEnabled(type, sub)
//    3. 提供变更监听 onNotifySettingsChange
//
//  类型结构（与 notifications.html 的 data-sotype 对应）：
//    master               总开关
//    social.like          互动 - 点赞
//    social.save          互动 - 收藏
//    social.comment       互动 - 评论
//    social.follow        互动 - 关注
// ============================================================

(function () {
  'use strict';

  var STORAGE_KEY = 'storyfun_notify_settings';

  // 默认设置：全部开启
  var DEFAULT_SETTINGS = {
    master: true,
    social: { like: true, save: true, comment: true, follow: true }
  };

  var listeners = [];

  // 深合并：以 defaults 为骨架，用 saved 覆盖，新增字段自动取默认值
  function deepMerge(defaults, saved) {
    var out = {};
    for (var k in defaults) {
      if (!Object.prototype.hasOwnProperty.call(defaults, k)) continue;
      var dv = defaults[k];
      var sv = saved && Object.prototype.hasOwnProperty.call(saved, k) ? saved[k] : undefined;
      if (dv && typeof dv === 'object' && !Array.isArray(dv)) {
        out[k] = deepMerge(dv, sv && typeof sv === 'object' ? sv : {});
      } else {
        out[k] = typeof sv === 'boolean' ? sv : dv;
      }
    }
    return out;
  }

  function loadRaw() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function getSettings() {
    return deepMerge(DEFAULT_SETTINGS, loadRaw());
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  // 更新某一项开关，立即持久化并通知监听者
  // setNotifySetting('social.like', false) / setNotifySetting('master', false)
  function setNotifySetting(path, value) {
    var settings = getSettings();
    var parts = path.split('.');
    var node = settings;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]] || typeof node[parts[i]] !== 'object') node[parts[i]] = {};
      node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = !!value;
    saveSettings(settings);
    listeners.forEach(function (cb) { try { cb(settings); } catch (e) {} });
  }

  // 查询某一类型是否开启；master 关闭时一切关闭
  function isNotifyEnabled(type, sub) {
    var s = getSettings();
    if (!s.master) return false;
    if (!type) return true;
    if (type === 'master') return !!s.master;
    var group = s[type];
    if (!group) return true;
    if (!sub) {
      // 组内任意一项开启即视为该组开启
      for (var k in group) {
        if (Object.prototype.hasOwnProperty.call(group, k) && group[k]) return true;
      }
      return false;
    }
    return group[sub] !== false;
  }

  // 重置为默认（全部开启）
  function resetNotifySettings() {
    saveSettings(deepMerge(DEFAULT_SETTINGS, {}));
    listeners.forEach(function (cb) { try { cb(getSettings()); } catch (e) {} });
  }

  function onNotifySettingsChange(cb) {
    if (typeof cb === 'function') listeners.push(cb);
  }

  // ============================================================
  //  通知设置弹窗（桌面端侧边栏入口）
  // ============================================================
  var MODAL_STYLE_ID = 'storyfun-notify-modal-styles';
  function injectModalStyles() {
    if (document.getElementById(MODAL_STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = MODAL_STYLE_ID;
    style.textContent = [
      '.sf-notify-overlay{position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.4);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;animation:sfNotifyFade .2s ease}',
      '@keyframes sfNotifyFade{from{opacity:0}to{opacity:1}}',
      '.sf-notify-modal{background:#fff;border-radius:18px;width:100%;max-width:420px;max-height:82vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.16);animation:sfNotifyUp .25s ease;padding:22px 24px;position:relative}',
      '@keyframes sfNotifyUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}',
      '.sf-notify-modal::-webkit-scrollbar{width:0}',
      '.sf-notify-close{position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:50%;border:none;background:rgba(0,0,0,.05);color:#5e6f83;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s}',
      '.sf-notify-close:hover{background:rgba(0,0,0,.1);color:#13202e}',
      '.sf-notify-title{margin:0 0 4px;font-size:1.05rem;font-weight:700;color:#13202e}',
      '.sf-notify-sub{margin:0 0 16px;font-size:.78rem;color:#8b8d98}',
      '.sf-notify-group{margin-bottom:8px}',
      '.sf-notify-group-title{font-size:.72rem;font-weight:600;color:#8b8d98;letter-spacing:.04em;margin:14px 0 2px}',
      '.sf-notify-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 2px;border-bottom:1px solid #f0f4fa}',
      '.sf-notify-row:last-child{border-bottom:none}',
      '.sf-notify-row .sf-n-label{font-size:.88rem;font-weight:500;color:#13202e}',
      '.sf-notify-row .sf-n-desc{font-size:.72rem;color:#8b8d98;margin-top:2px}',
      '.sf-notify-row.dim{opacity:.45;pointer-events:none}',
      '.sf-notify-switch{position:relative;display:inline-block;width:42px;height:25px;flex-shrink:0}',
      '.sf-notify-switch input{opacity:0;width:0;height:0;position:absolute}',
      '.sf-notify-switch .sf-track{position:absolute;inset:0;border-radius:999px;background:rgba(0,0,0,.16);transition:background .2s;cursor:pointer}',
      '.sf-notify-switch .sf-thumb{position:absolute;top:2px;left:2px;width:21px;height:21px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .2s}',
      '.sf-notify-switch input:checked + .sf-track{background:#34c759}',
      '.sf-notify-switch input:checked + .sf-track .sf-thumb{transform:translateX(17px)}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // 打开通知设置弹窗（重复调用时先移除旧弹窗）
  function openNotifySettingsModal() {
    var existing = document.getElementById('sf-notify-overlay');
    if (existing) existing.remove();
    injectModalStyles();

    var s = getSettings();
    var rows = '';
    function switchHTML(path, checked, label, desc) {
      return '<div class="sf-notify-row" data-path="' + path + '">' +
        '<div><div class="sf-n-label">' + label + '</div>' + (desc ? '<div class="sf-n-desc">' + desc + '</div>' : '') + '</div>' +
        '<label class="sf-notify-switch"><input type="checkbox" data-path="' + path + '"' + (checked ? ' checked' : '') + '><span class="sf-track"><span class="sf-thumb"></span></span></label>' +
        '</div>';
    }
    // 组开关状态：组内任意一项开启即开
    function groupOn(group) {
      var g = s[group] || {};
      for (var k in g) { if (Object.prototype.hasOwnProperty.call(g, k) && g[k]) return true; }
      return false;
    }

    rows += switchHTML('master', !!s.master, '接收通知', '');
    rows += '<div class="sf-notify-group-title">互动通知</div>';
    rows += switchHTML('social', groupOn('social'), '互动通知（总）', '');
    rows += switchHTML('social.like', !!s.social.like, '点赞', '');
    rows += switchHTML('social.save', !!s.social.save, '收藏', '');
    rows += switchHTML('social.comment', !!s.social.comment, '评论', '');
    rows += switchHTML('social.follow', !!s.social.follow, '关注', '');

    var overlay = document.createElement('div');
    overlay.className = 'sf-notify-overlay';
    overlay.id = 'sf-notify-overlay';
    overlay.innerHTML =
      '<div class="sf-notify-modal">' +
        '<button class="sf-notify-close">✕</button>' +
        '<h3 class="sf-notify-title">🔔 通知设置</h3>' +
        '<p class="sf-notify-sub">选择要接收的站内通知类型</p>' +
        '<div id="sf-notify-rows">' + rows + '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    // 关闭
    overlay.querySelector('.sf-notify-close').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    // 交互：叶子开关直接保存；组开关统一保存组内子项；master 关闭置灰所有
    var groupDefs = { social: ['like', 'save', 'comment', 'follow'] };
    overlay.querySelectorAll('input[type=checkbox]').forEach(function (input) {
      input.addEventListener('change', function () {
        var path = this.getAttribute('data-path');
        if (path === 'master') {
          setNotifySetting('master', this.checked);
          applyDim();
          return;
        }
        if (groupDefs[path]) {
          groupDefs[path].forEach(function (k) { setNotifySetting(path + '.' + k, input.checked); });
          applyDim();
          return;
        }
        setNotifySetting(path, this.checked);
      });
    });

    function applyDim() {
      var cur = getSettings();
      var masterOn = !!cur.master;
      overlay.querySelectorAll('.sf-notify-row').forEach(function (row) {
        var p = row.getAttribute('data-path');
        if (p === 'master') return;
        row.classList.toggle('dim', !masterOn);
      });
      // 同步组开关的勾选态
      overlay.querySelectorAll('input[type=checkbox]').forEach(function (input) {
        var p = input.getAttribute('data-path');
        if (p === 'master') return;
        if (groupDefs[p]) {
          var g = cur[p] || {};
          input.checked = Object.keys(g).some(function (k) { return g[k]; });
        } else {
          var parts = p.split('.');
          var node = cur[parts[0]];
          input.checked = !!(node && node[parts[1]]);
        }
      });
    }
    applyDim();
  }

  // 暴露全局 API
  window.StoryFunNotify = {
    STORAGE_KEY: STORAGE_KEY,
    getSettings: getSettings,
    setNotifySetting: setNotifySetting,
    isNotifyEnabled: isNotifyEnabled,
    resetNotifySettings: resetNotifySettings,
    onNotifySettingsChange: onNotifySettingsChange,
    openNotifySettingsModal: openNotifySettingsModal
  };
})();
