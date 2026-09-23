/* ============================================================
   Story.fun 通用确认/结果弹窗组件（sign-modal.js）
   自包含样式 + 结构 + 确认/成功状态流转
   任何页面可调用：window.SignModal.open(config) / SignModal.close()

   config 字段（均可选）：
     title          标题，默认「提示」
     name           次要标题（兼容旧调用方，作为标题候补）
     message        正文说明（可含 HTML）
     icon           图标 emoji，默认「❗」
     confirmText    确认按钮文案，默认「确认」
     cancelText     取消按钮文案，默认「取消」
     showCancel     是否显示取消按钮，默认 true
     onConfirm(done)  点「确认」→ 业务完成后调 done() → 切成功态/关闭
     success: {
       text (HTML),
       primary:  { label, href? | onClick? },
       secondary:{ label, onClick? }，传 null 只留主按钮
     }
   ============================================================ */
window.SignModal = (function () {
  var current = null; // { overlay, config }

  function injectStyles() {
    if (document.getElementById('sfSignStyles')) return;
    var s = document.createElement('style');
    s.id = 'sfSignStyles';
    s.textContent = [
      '.sf-confirm-overlay{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(15,23,42,0.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
      '.sf-confirm-overlay.active{display:flex}',
      '.sf-confirm-modal{width:min(420px,100%);background:var(--surface,#fff);border-radius:24px;box-shadow:0 32px 64px rgba(15,23,42,0.18);overflow:hidden;transform:scale(0.94) translateY(10px);opacity:0;transition:all .3s cubic-bezier(0.22,1,0.36,1);position:relative}',
      '.sf-confirm-overlay.active .sf-confirm-modal{transform:scale(1) translateY(0);opacity:1}',
      '.sf-confirm-close{position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:50%;border:none;background:rgba(0,0,0,0.05);color:var(--text-muted,#8b8d98);font-size:1rem;cursor:pointer;display:grid;place-items:center;transition:all .2s ease;z-index:2}',
      '.sf-confirm-close:hover{background:rgba(0,0,0,0.1);color:var(--text,#13202e)}',
      '.sf-confirm-body{padding:28px 26px 22px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center}',
      '.sf-confirm-icon{width:56px;height:56px;border-radius:50%;background:rgba(0,0,0,0.06);display:grid;place-items:center;font-size:1.6rem;margin-bottom:2px}',
      '.sf-confirm-title{margin:0;font-size:1.15rem;font-weight:700;color:var(--text,#13202e);line-height:1.4;word-break:break-all}',
      '.sf-confirm-msg{margin:0;color:var(--text-muted,#5e6f83);font-size:0.88rem;line-height:1.7;word-break:break-all}',
      '.sf-confirm-actions{display:flex;flex-direction:column;gap:10px;padding:0 26px 24px}',
      '.sf-confirm-actions .sf-confirm-btn{width:100%;padding:14px;border-radius:999px;border:none;font-size:0.98rem;font-weight:700;cursor:pointer;transition:all .2s ease;font-family:inherit}',
      '.sf-confirm-actions .sf-confirm-btn.primary{background:#000000;color:#fff}',
      '.sf-confirm-actions .sf-confirm-btn.primary:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,0.25)}',
      '.sf-confirm-actions .sf-confirm-btn.primary:disabled{opacity:0.5;cursor:not-allowed;transform:none !important;box-shadow:none !important}',
      '.sf-confirm-actions .sf-confirm-btn.secondary{background:transparent;color:var(--text-muted,#5e6f83);font-weight:600;font-size:0.9rem;padding:11px}',
      '.sf-confirm-actions .sf-confirm-btn.secondary:hover{color:var(--text,#13202e);background:rgba(0,0,0,0.04)}',
      '.sf-confirm-success{display:none;flex-direction:column;align-items:center;gap:8px;padding:44px 28px 30px;text-align:center}',
      '.sf-confirm-success.show{display:flex}',
      '.sf-confirm-check{width:72px;height:72px;border-radius:50%;background:#34c759;color:#fff;display:grid;place-items:center;font-size:2rem;font-weight:900;margin-bottom:8px;box-shadow:0 10px 26px rgba(52,199,89,0.32)}',
      '.sf-confirm-success h3{margin:0;font-size:1.25rem;font-weight:700;color:var(--text,#13202e)}',
      '.sf-confirm-success p{margin:0;color:var(--text-muted,#5e6f83);font-size:0.9rem;line-height:1.7;width:100%}',
      '.sf-confirm-success .success-actions{display:flex;flex-direction:column;gap:10px;margin-top:14px;width:100%}',
      '.sf-confirm-success .success-btn{width:100%;padding:13px;border-radius:999px;border:none;font-size:0.95rem;font-weight:700;cursor:pointer;transition:all .2s ease;font-family:inherit}',
      '.sf-confirm-success .success-btn.primary{background:#000000;color:#fff}',
      '.sf-confirm-success .success-btn.primary:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(0,0,0,0.25)}',
      '.sf-confirm-success .success-btn.secondary{background:transparent;color:var(--text-muted,#5e6f83);font-weight:600;padding:10px}',
      '.sf-confirm-success .success-btn.secondary:hover{color:var(--text,#13202e);background:rgba(0,0,0,0.04)}',
      '@media (max-width:599px){',
      '.sf-confirm-overlay{padding:0;align-items:flex-end}',
      '.sf-confirm-modal{border-radius:20px 20px 0 0;width:100%}',
      '.sf-confirm-body{padding:26px 20px 18px}',
      '.sf-confirm-actions{padding:0 20px 20px}',
      '}'
    ].join('');
    document.head.appendChild(s);
  }

  function open(config) {
    injectStyles();
    close();

    config = config || {};
    var title = config.title || config.name || '提示';
    var message = config.message || config.desc || config.text || '';
    var icon = config.icon || '❗';
    var confirmText = config.confirmText || '确认';
    var cancelText = config.cancelText || '取消';
    var showCancel = config.showCancel !== false;

    var overlay = document.createElement('div');
    overlay.className = 'sf-confirm-overlay';
    overlay.innerHTML =
      '<div class="sf-confirm-modal" role="dialog" aria-modal="true">' +
        '<button class="sf-confirm-close" type="button" aria-label="关闭弹窗">✕</button>' +
        '<div class="sf-confirm-body">' +
          '<div class="sf-confirm-icon">' + icon + '</div>' +
          '<h3 class="sf-confirm-title"></h3>' +
          '<p class="sf-confirm-msg"></p>' +
        '</div>' +
        '<div class="sf-confirm-actions">' +
          (showCancel ? '<button class="sf-confirm-btn secondary" type="button"></button>' : '') +
          '<button class="sf-confirm-btn primary" type="button"></button>' +
        '</div>' +
        '<div class="sf-confirm-success">' +
          '<div class="sf-confirm-check">✓</div>' +
          '<h3>已完成</h3>' +
          '<p class="success-text"></p>' +
          '<div class="success-actions">' +
            '<button class="success-btn primary" type="button"></button>' +
            '<button class="success-btn secondary" type="button"></button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    current = { overlay: overlay, config: config };

    overlay.querySelector('.sf-confirm-title').textContent = title;
    var msgEl = overlay.querySelector('.sf-confirm-msg');
    if (message) { msgEl.innerHTML = message; } else { msgEl.style.display = 'none'; }
    overlay.querySelector('.sf-confirm-actions .primary').textContent = confirmText;
    var cancelBtn = overlay.querySelector('.sf-confirm-actions .secondary');
    if (cancelBtn) cancelBtn.textContent = cancelText;

    // 关闭相关
    overlay.querySelector('.sf-confirm-close').addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && current && current.overlay === overlay) close(); });

    // 确认 → 业务 → 成功态/关闭
    var confirmBtn = overlay.querySelector('.sf-confirm-actions .primary');
    confirmBtn.addEventListener('click', function () {
      if (confirmBtn.disabled) return;
      confirmBtn.disabled = true;
      var orig = confirmBtn.textContent;
      confirmBtn.textContent = '处理中…';
      var done = function () {
        var success = config.success;
        if (success && (success.text || success.primary || success.secondary)) {
          showSuccess(overlay, config);
        } else {
          close();
        }
      };
      if (typeof config.onConfirm === 'function') {
        try {
          config.onConfirm(done);
        } catch (e) {
          confirmBtn.disabled = false;
          confirmBtn.textContent = orig;
        }
      } else {
        done();
      }
    });

    overlay.classList.add('active');
  }

  function showSuccess(overlay, config) {
    var body = overlay.querySelector('.sf-confirm-body');
    var actions = overlay.querySelector('.sf-confirm-actions');
    var success = overlay.querySelector('.sf-confirm-success');
    if (body) body.style.display = 'none';
    if (actions) actions.style.display = 'none';

    var s = config.success || {};
    if (s.text) success.querySelector('.success-text').innerHTML = s.text;
    else success.querySelector('.success-text').style.display = 'none';

    var primary = success.querySelector('.success-btn.primary');
    var secondary = success.querySelector('.success-btn.secondary');
    primary.style.display = s.primary ? '' : 'none';
    secondary.style.display = s.secondary ? '' : 'none';
    if (s.primary) {
      primary.textContent = s.primary.label || '好的';
      primary.addEventListener('click', function () {
        if (typeof s.primary.onClick === 'function') s.primary.onClick();
        if (s.primary.href) { window.location.href = s.primary.href; return; }
        close();
      });
    }
    if (s.secondary) {
      secondary.textContent = s.secondary.label || '关闭';
      secondary.addEventListener('click', function () {
        if (typeof s.secondary.onClick === 'function') s.secondary.onClick();
        close();
      });
    }

    success.classList.add('show');
  }

  function close() {
    if (current) {
      var o = current.overlay;
      current = null;
      if (o && o.parentNode) o.parentNode.removeChild(o);
    }
  }

  return { open: open, close: close };
})();
