// ============================================================
//  Story.fun - Privy 模拟登录/注册系统（账号 + 内嵌钱包）
// ============================================================

// ============================================================
//  用户数据（演示账户模板；Privy 模拟登录后按账号派生内嵌钱包）
// ============================================================
const PRIVY_MOCK_USER = {
  id: 'user_storyfun_001',
  name: '故事玩家',
  bio: '在 Story.fun 上创作与观看 AI 短剧。创作者、收藏家、梦想家。',
  email: 'demo@story.fun',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  isLoggedIn: false,
  // 登录方式：'email' | 'google' | 'twitter' | 'wallet' | null
  authMethod: null
};

// ============================================================
//  内嵌钱包地址（单一来源）：同账号永远同一串，全站统一取用
//  full = 40 位地址；masked = 0x1234…abcd
// ============================================================
function sfWalletAddress(seed) {
  const str = 'storyfun:wallet:' + (seed || 'guest');
  let h = 2166136261 >>> 0, hex = '';
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  for (let j = 0; j < 40; j++) { h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0; hex += '0123456789abcdef'.charAt(h & 15); }
  return '0x' + hex;
}
function sfAccountSeed() {
  if (typeof currentUser !== 'undefined' && currentUser && currentUser.id) return currentUser.id;
  return 'guest';
}
// 取地址一律经 window.currentWallet（避免依赖裸全局别名）
function sfWalletRef() {
  return (typeof window !== 'undefined' && window.currentWallet) ? window.currentWallet : null;
}
function sfWalletMasked() {
  const w = sfWalletRef();
  return (w && typeof w.masked === 'function') ? w.masked() : '0x…';
}
function sfWalletFull() {
  const w = sfWalletRef();
  return (w && typeof w.address === 'function') ? w.address() : '';
}
window.currentWallet = {
  address: function () { return sfWalletAddress(sfAccountSeed()); },
  masked: function () { const a = sfWalletAddress(sfAccountSeed()); return a.slice(0, 6) + '\u2026' + a.slice(-4); },
  isConnected: function () {
    return !!(typeof currentUser !== 'undefined' && currentUser && currentUser.isLoggedIn);
  }
};

// ============================================================
//  状态管理 — 从 localStorage 恢复登录态
// ============================================================
function loadUserFromStorage() {
  try {
    const saved = localStorage.getItem('storyfun_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.isLoggedIn) return parsed;
    }
  } catch (e) {}
  return null;
}

function saveUserToStorage(user) {
  try {
    localStorage.setItem('storyfun_user', JSON.stringify(user));
  } catch (e) {}
}

function clearUserFromStorage() {
  try {
    localStorage.removeItem('storyfun_user');
  } catch (e) {}
}

const storedUser = loadUserFromStorage();
let currentUser = storedUser ? { ...PRIVY_MOCK_USER, ...storedUser } : { ...PRIVY_MOCK_USER, isLoggedIn: false };

// ============================================================
//  DOM 就绪后初始化
// ============================================================
function initAuth() {
  injectAuthStyles();
  const containers = document.querySelectorAll('.auth-container');
  containers.forEach(container => {
    renderAuthUI(container);
  });
}

// ============================================================
//  注入全局样式（仅保留内容社区所需）
// ============================================================
function injectAuthStyles() {
  if (document.getElementById('authStyles')) return;
  const css = `
  /* ===== Login Modal Styles (shared across all pages) ===== */
  .auth-modal-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(15,23,42,0.4); backdrop-filter: blur(4px); opacity: 0; visibility: hidden; transition: all 0.3s ease; }
  .auth-modal-overlay.active { opacity: 1; visibility: visible; }
  .auth-modal { background: var(--surface, #ffffff); border-radius: 28px; width: 100%; max-width: 420px; box-shadow: 0 40px 80px rgba(27,45,71,0.2); overflow: hidden; transform: scale(0.95) translateY(10px); transition: transform 0.3s ease; }
  .auth-modal-overlay.active .auth-modal { transform: scale(1) translateY(0); }
  .auth-modal-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(0,0,0,0.04); cursor: pointer; display: grid; place-items: center; font-size: 1.1rem; color: var(--text-muted, #5e6f83); transition: all 0.2s; z-index: 1; }
  .auth-modal-close:hover { background: rgba(0,0,0,0.08); color: var(--text, #13202e); }
  .auth-modal-header { text-align: center; padding: 36px 28px 20px; position: relative; }
  .auth-modal-logo { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, var(--accent, #000000), #000000); display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 1.3rem; margin: 0 auto 16px; box-shadow: 0 4px 16px rgba(0, 0, 0,0.3); }
  .auth-modal-header h2 { margin: 0 0 6px; font-size: 1.4rem; color: var(--text, #13202e); }
  .auth-modal-header p { margin: 0; color: var(--text-muted, #5e6f83); font-size: 0.92rem; }
  .auth-modal-body { padding: 8px 28px 32px; display: flex; flex-direction: column; gap: 12px; }
  .auth-social-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 14px; border-radius:999px; border: 1px solid var(--border, #deeaf7); background: var(--surface, #ffffff); color: var(--text, #13202e); font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
  .auth-social-btn:hover { border-color: var(--accent, #000000); background: var(--accent-soft, rgba(0, 0, 0, 0.12)); }
  .auth-social-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .auth-modal-tos { text-align: center; color: var(--text-muted, #5e6f83); font-size: 0.82rem; line-height: 1.6; margin: 4px 0 0; }
  .auth-modal-tos a { color: var(--accent, #000000); text-decoration: none; }
  .auth-modal-tos a:hover { text-decoration: underline; }

  /* ===== Auth Login Button ===== */
  .auth-login-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:999px;border:1px solid var(--border,#deeaf7);background:var(--surface,#fff);color:var(--text,#13202e);font-size:0.88rem;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;font-family:inherit}
  .auth-login-btn:hover{border-color:var(--accent,#000000);color:var(--accent,#000000);background:rgba(0, 0, 0,.08)}
  .auth-login-btn .auth-login-icon{font-size:1rem}

  /* ===== Auth Dropdown Styles ===== */
  .auth-user-menu{position:relative;display:inline-block}
  .auth-avatar-trigger{width:36px;height:36px;border-radius:50%;overflow:hidden;cursor:pointer;border:1.5px solid rgba(0,0,0,.08);flex-shrink:0;transition:border-color .15s;background:#f0f2f5}
  .auth-avatar-trigger:hover{border-color:#000000}
  .auth-avatar-trigger img{width:100%;height:100%;object-fit:cover;display:block}

  .auth-dropdown{position:absolute;right:0;top:64px;width:300px;background:#fff;border-radius:16px;padding:18px;box-shadow:0 18px 40px rgba(22,33,51,0.08);border:1px solid rgba(22,33,51,0.04);opacity:0;transform:translateY(-8px);pointer-events:none;transition:all 220ms ease;z-index:9999}
  .auth-dropdown.active{opacity:1;transform:translateY(0);pointer-events:auto}

  .auth-dropdown-top{display:flex;cursor:pointer;gap:12px;align-items:center;padding-bottom:12px}
  .auth-dropdown-top-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0}
  .auth-dropdown-top-left{flex-shrink:0}
  .auth-dropdown-top-right{min-width:0}
  .auth-dropdown-main{font-weight:700;font-size:16px;color:#0b1720;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .auth-dropdown-sub{color:#8b98a6;margin-top:4px;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

  .auth-dropdown-divider{height:1px;background:#eef2f4;margin:8px 0;border-radius:1px}
  .auth-dropdown-item{display:flex;align-items:center;gap:10px;padding:12px 6px;color:#0b1720;text-decoration:none;font-size:14px;font-weight:500}
  .auth-dropdown-item:hover{opacity:.7}
  .auth-dropdown-item span{font-size:18px}
  .auth-dropdown-logout{color:#0b1720}

  /* ===== Logout Confirm ===== */
  .logout-confirm-overlay{position:fixed;inset:0;z-index:10002;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(15,23,42,0.4);backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:all .3s ease}
  .logout-confirm-overlay.active{opacity:1;visibility:visible}
  .logout-confirm-card{background:#fff;border-radius:20px;width:100%;max-width:320px;padding:24px;text-align:center;box-shadow:0 20px 60px rgba(27,45,71,0.2);transform:scale(.95) translateY(10px);transition:transform .3s ease}
  .logout-confirm-overlay.active .logout-confirm-card{transform:scale(1) translateY(0)}
  .logout-confirm-icon{font-size:40px;margin-bottom:12px}
  .logout-confirm-title{font-size:17px;font-weight:700;color:#13202e;margin-bottom:6px}
  .logout-confirm-desc{font-size:14px;color:#5e6f83;margin-bottom:24px}
  .logout-confirm-actions{display:flex;gap:12px}
  .logout-confirm-actions button{flex:1;padding:12px;border-radius:999px;border:none;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}
  .logout-confirm-actions .btn-cancel{background:rgba(0,0,0,.06);color:#13202e}
  .logout-confirm-actions .btn-cancel:active{background:rgba(0,0,0,.12)}
  .logout-confirm-actions .btn-confirm{background:#f45b69;color:#fff}
  .logout-confirm-actions .btn-confirm:active{background:#d94355}

  /* ===== Privy 登录：邮箱两步 / 社交 / 钱包 / 签名 ===== */
  .auth-field-label{display:block;font-size:12px;font-weight:600;color:#5e6f83;margin:2px 0 6px}
  .auth-input{width:100%;height:48px;padding:0 16px;border-radius:14px;border:1px solid #e3e8ef;background:#fff;
    color:#13202e;font-size:15px;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box}
  .auth-input:focus{border-color:#0b1720;box-shadow:0 0 0 3px rgba(11,23,32,.06)}
  .auth-input.num{font-family:var(--mono,ui-monospace,monospace);letter-spacing:.24em;font-variant-numeric:tabular-nums}
  .auth-input::placeholder{color:#9aa7b4;letter-spacing:normal}
  .auth-hint{font-size:12px;color:#8b98a6;margin:8px 0 2px}
  .auth-hint b{color:#13202e;font-family:var(--mono,ui-monospace,monospace)}
  .auth-err{display:none;color:#f45b69;font-size:12.5px;margin-top:8px}
  .auth-err.show{display:block}
  .auth-text-btn{display:block;width:100%;margin-top:10px;padding:10px;border:none;background:none;color:#5e6f83;
    font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:underline}
  .auth-text-btn:disabled{color:#b3bcc6;cursor:default;text-decoration:none}
  .auth-social-btn + .auth-social-btn{margin-top:10px}
  #authEmailStep1 .auth-social-btn,#authEmailStep2 .auth-social-btn{margin-top:14px}
  .auth-divider{display:flex;align-items:center;gap:12px;margin:16px 0 14px;color:#9aa7b4;font-size:12px}
  .auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:#eef2f4}
  .auth-wallet-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;
    border-radius:999px;border:1px solid #e3e8ef;background:#fff;color:#13202e;font-size:.95rem;font-weight:600;
    cursor:pointer;font-family:inherit;transition:all .2s ease}
  .auth-wallet-btn:hover{border-color:#0b1720;background:rgba(0,0,0,.03)}
  .auth-modal-privy{text-align:center;font-size:11px;color:#9aa7b4;margin:14px 0 0}
  .auth-wallet-item{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:14px 16px;
    border-radius:14px;border:1px solid #e3e8ef;background:#fff;cursor:pointer;font-family:inherit;transition:all .15s}
  .auth-wallet-item + .auth-wallet-item{margin-top:10px}
  .auth-wallet-item:hover{border-color:#0b1720;background:rgba(0,0,0,.03)}
  .auth-wallet-name{font-size:14.5px;font-weight:700;color:#13202e}
  .auth-wallet-note{font-size:11.5px;color:#8b98a6}
  .auth-sign-msg{background:#f7f8f9;border-radius:14px;padding:14px 16px}
  .auth-sign-title{font-size:13.5px;font-weight:700;color:#13202e}
  .auth-sign-body{font-size:12.5px;color:#5e6f83;line-height:1.6;margin-top:6px}
  .auth-sign-addr{margin-top:10px;font-size:12.5px;color:#8b98a6}
  .auth-sign-actions{display:flex;gap:10px;margin-top:16px}
  .auth-sign-actions button{flex:1;height:46px;border-radius:999px;border:none;font-size:14px;font-weight:700;
    cursor:pointer;font-family:inherit;transition:all .15s}
  .auth-sign-reject{background:rgba(0,0,0,.06);color:#13202e}
  .auth-sign-reject:hover{background:rgba(0,0,0,.12)}
  .auth-sign-ok{background:#0b1720;color:#fff}
  .auth-sign-ok:hover{opacity:.9}
  .auth-sign-ok:disabled{opacity:.6;cursor:default}
  .auth-dd-addr{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0 2px;padding:8px 10px;
    border-radius:10px;background:#f7f8f9}
  .auth-dd-addr span{font-size:12.5px;color:#13202e;font-weight:600}
  .auth-dd-addr button{border:none;background:none;color:#5e6f83;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit}
  .auth-dd-addr button:hover{color:#0b1720}
  `;

  const style = document.createElement('style');
  style.id = 'authStyles';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
}

// ============================================================
//  渲染登录/用户菜单
// ============================================================
function renderAuthUI(container) {
  if (currentUser.isLoggedIn) {
    const isEmail = currentUser.authMethod === 'email';
    var displayName = currentUser.name || (isEmail ? currentUser.email : 'User');
    var methodLabel = currentUser.authMethodLabel || (isEmail ? '邮箱登录' : '外部钱包');
    var subLabel = methodLabel + (isEmail && currentUser.email ? ' · ' + currentUser.email : '');
    var addrText = sfWalletMasked();
    container.innerHTML = `
      <div class="auth-user-menu">
        <div class="auth-avatar-trigger" onclick="toggleDropdown(event)">
          <img src="${currentUser.avatar}" alt="${currentUser.name}" />
        </div>
        <div class="auth-dropdown" id="authDropdown">
          <div class="auth-dropdown-top" onclick="openProfileCenter()">
            <div class="auth-dropdown-top-left">
              <img class="auth-dropdown-top-avatar" src="${currentUser.avatar}" alt="${currentUser.name}" />
            </div>
            <div class="auth-dropdown-top-right">
              <div class="auth-dropdown-main">${displayName}</div>
              <div class="auth-dropdown-sub">${subLabel}</div>
            </div>
          </div>
          <div class="auth-dd-addr">
            <span class="num" title="钱包地址">${addrText}</span>
            <button type="button" onclick="copyAuthAddress(event)">复制</button>
          </div>

          <div class="auth-dropdown-divider"></div>
             <a class="auth-dropdown-item" href="assets.html">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            我的资产
          </a>
             <a class="auth-dropdown-item" href="narrator.html">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            创作管理
          </a>
          <a class="auth-dropdown-item" href="watch-history.html">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M3 12s4-8 9-8 9 8 9 8-4 8-9 8-9-8-9-8z"/><circle cx="12" cy="12" r="3"/></svg>
            观看历史
          </a>
          <a class="auth-dropdown-item auth-dropdown-logout" href="#" onclick="handleLogout()">

            <span>🚪</span> Logout
          </a>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="auth-login-btn" onclick="openLoginModal()">
        <span class="auth-login-icon">🔑</span>
        登录 / 注册
      </button>
    `;
  }
}

// ============================================================
//  登录弹窗（Privy 模拟：邮箱验证码 / Google / X / 外部钱包）
// ============================================================
const AUTH_METHOD_LABEL = { email: '邮箱登录', google: 'Google', twitter: 'X (Twitter)', wallet: '外部钱包' };
const AUTH_DEMO_CODE = '123456';
const WALLET_OPTIONS = [
  { id: 'metamask', name: 'MetaMask', note: '浏览器扩展' },
  { id: 'walletconnect', name: 'WalletConnect', note: '扫码连接' },
  { id: 'coinbase', name: 'Coinbase Wallet', note: '移动端 App' }
];
let authEmailPending = '';

function openLoginModal() {
  const existing = document.getElementById('authLoginModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'auth-modal-overlay';
  modal.id = 'authLoginModal';
  modal.innerHTML = `
    <div class="auth-modal">
      <button class="auth-modal-close" onclick="closeLoginModal()">✕</button>
      <div class="auth-modal-header">
        <div class="auth-modal-logo">SF</div>
        <h2>欢迎来到 Story.fun</h2>
        <p>登录即创建你的链上钱包</p>
      </div>
      <div class="auth-modal-body">
        <div id="authEmailStep1">
          <label class="auth-field-label" for="authEmailInput">邮箱地址</label>
          <input class="auth-input" id="authEmailInput" type="email" autocomplete="email" placeholder="you@example.com" />
          <button class="auth-social-btn auth-social-email" id="authSendBtn" onclick="authSendCode()">发送验证码</button>
        </div>
        <div id="authEmailStep2" style="display:none">
          <label class="auth-field-label" for="authCodeInput">验证码</label>
          <input class="auth-input num" id="authCodeInput" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6 位验证码" />
          <div class="auth-hint">演示环境：验证码固定为 <b>${AUTH_DEMO_CODE}</b></div>
          <button class="auth-social-btn auth-social-email" id="authVerifyBtn" onclick="authVerifyCode()">验证并登录</button>
          <button class="auth-text-btn" id="authResendBtn" onclick="authResendCode()">重新发送验证码</button>
        </div>
        <div class="auth-err" id="authEmailErr"></div>
        <div class="auth-divider"><span>或使用其他方式</span></div>
        <button class="auth-social-btn" id="authGoogleBtn" onclick="authSocial('google')">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/></svg>
          使用 Google 登录
        </button>
        <button class="auth-social-btn" id="authTwitterBtn" onclick="authSocial('twitter')">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l16 16M20 4L4 20"/></svg>
          使用 X 登录
        </button>
        <div class="auth-divider"><span>或使用钱包连接</span></div>
        <button class="auth-wallet-btn" onclick="openWalletPicker()">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/><circle cx="18" cy="12" r="2"/></svg>
          连接钱包
        </button>
        <p class="auth-modal-tos">继续即表示同意 <a href="#">服务条款</a> 和 <a href="#">隐私政策</a></p>
        <p class="auth-modal-privy">由 Privy 提供（模拟）</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => { modal.classList.add('active'); });
  document.body.style.overflow = 'hidden';
  const inp = document.getElementById('authEmailInput');
  if (inp) setTimeout(() => { try { inp.focus(); } catch (e) {} }, 150);
}

function closeLoginModal() {
  clearInterval(window._authCodeTimer);
  const modal = document.getElementById('authLoginModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => { modal.remove(); document.body.style.overflow = ''; }, 300);
  }
}

// ---- 邮箱两步：邮箱 → 验证码 ----
function authSetErr(msg) {
  const el = document.getElementById('authEmailErr');
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('show', !!msg);
}

function authSendCode() {
  const inp = document.getElementById('authEmailInput');
  const v = ((inp && inp.value) || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { authSetErr('请输入有效的邮箱地址'); return; }
  authSetErr('');
  authEmailPending = v;
  const s1 = document.getElementById('authEmailStep1');
  const s2 = document.getElementById('authEmailStep2');
  if (s1) s1.style.display = 'none';
  if (s2) s2.style.display = '';
  const c = document.getElementById('authCodeInput');
  if (c) { c.value = ''; try { c.focus(); } catch (e) {} }
  authStartCountdown();
  showToast('验证码已发送（演示：' + AUTH_DEMO_CODE + '）', '📧');
}

function authStartCountdown() {
  const btn = document.getElementById('authResendBtn');
  if (!btn) return;
  let left = 60;
  clearInterval(window._authCodeTimer);
  const paint = () => {
    btn.disabled = left > 0;
    btn.textContent = left > 0 ? ('重新发送（' + left + 's）') : '重新发送验证码';
  };
  paint();
  window._authCodeTimer = setInterval(() => {
    left -= 1;
    if (left <= 0) { left = 0; clearInterval(window._authCodeTimer); }
    paint();
  }, 1000);
}

function authResendCode() {
  const btn = document.getElementById('authResendBtn');
  if (btn && btn.disabled) return;
  authStartCountdown();
  showToast('验证码已重新发送（演示：' + AUTH_DEMO_CODE + '）', '📧');
}

function authVerifyCode() {
  const el = document.getElementById('authCodeInput');
  const v = ((el && el.value) || '').trim();
  if (!/^\d{6}$/.test(v)) { authSetErr('请输入 6 位数字验证码'); return; }
  if (v !== AUTH_DEMO_CODE) { authSetErr('验证码不正确，请重新输入'); return; }
  authSetErr('');
  authBusyAll(true);
  setTimeout(() => { authBusyAll(false); finishLogin('email', { email: authEmailPending }); }, 700);
}

function authBusyAll(on) {
  const modal = document.getElementById('authLoginModal');
  if (!modal) return;
  modal.querySelectorAll('button').forEach((b) => {
    if (b.id === 'authResendBtn') return;   // 倒计时自行管理
    b.disabled = !!on;
  });
}

// ---- 社交登录（Google / X）：一步完成 ----
function authSocial(method) {
  authSetErr('');
  authBusyAll(true);
  setTimeout(() => { authBusyAll(false); finishLogin(method); }, 800);
}

// ---- 外部钱包：选择钱包 → 签名确认（可拒绝） ----
function openWalletPicker() {
  closeWalletPicker();
  const el = document.createElement('div');
  el.className = 'auth-modal-overlay';
  el.id = 'authWalletModal';
  el.innerHTML = `
    <div class="auth-modal">
      <button class="auth-modal-close" onclick="closeWalletPicker()">✕</button>
      <div class="auth-modal-header">
        <div class="auth-modal-logo">🔗</div>
        <h2>连接钱包</h2>
        <p>选择一个钱包完成连接</p>
      </div>
      <div class="auth-modal-body">
        ${WALLET_OPTIONS.map((w) => `<button class="auth-wallet-item" onclick="openWalletSign('${w.id}')"><span class="auth-wallet-name">${w.name}</span><span class="auth-wallet-note">${w.note}</span></button>`).join('')}
      </div>
      <div class="auth-modal-privy">由 Privy 提供（模拟）</div>
    </div>
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.classList.add('active'); });
}

function closeWalletPicker() {
  const el = document.getElementById('authWalletModal');
  if (el) { el.classList.remove('active'); setTimeout(() => el.remove(), 250); }
}

function openWalletSign(walletId) {
  const w = WALLET_OPTIONS.filter((x) => x.id === walletId)[0] || WALLET_OPTIONS[0];
  closeWalletPicker();
  window._authSignWallet = w;
  const el = document.createElement('div');
  el.className = 'auth-modal-overlay';
  el.id = 'authSignModal';
  el.innerHTML = `
    <div class="auth-modal">
      <div class="auth-modal-header">
        <div class="auth-modal-logo">✍️</div>
        <h2>签名确认</h2>
        <p>${w.name} 请求你签名以连接 Story.fun</p>
      </div>
      <div class="auth-modal-body">
        <div class="auth-sign-msg">
          <div class="auth-sign-title">Story.fun 想要连接你的钱包</div>
          <div class="auth-sign-body">此操作仅用于身份验证，不会产生链上交易，也不收取费用。</div>
          <div class="auth-sign-addr num">${sfWalletMasked()}</div>
        </div>
        <div class="auth-sign-actions">
          <button class="auth-sign-reject" onclick="authSignResult(false)">拒绝</button>
          <button class="auth-sign-ok" id="authSignOkBtn" onclick="authSignResult(true)">签名并连接</button>
        </div>
      </div>
      <div class="auth-modal-privy">由 Privy 提供（模拟）</div>
    </div>
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.classList.add('active'); });
}

function closeWalletSign() {
  const el = document.getElementById('authSignModal');
  if (el) { el.classList.remove('active'); setTimeout(() => el.remove(), 250); }
}

function authSignResult(ok) {
  if (!ok) { closeWalletSign(); showToast('已取消钱包连接', '🚫'); return; }
  const btn = document.getElementById('authSignOkBtn');
  if (btn) { btn.disabled = true; btn.textContent = '等待钱包确认…'; }
  setTimeout(() => {
    const w = window._authSignWallet || WALLET_OPTIONS[0];
    closeWalletSign();
    finishLogin('wallet', { walletName: w.name });
  }, 900);
}

// ---- 统一登录出口：写登录态 → 重渲染 → toast → auth-ready ----
function finishLogin(method, opts) {
  opts = opts || {};
  currentUser.isLoggedIn = true;
  currentUser.authMethod = method;
  currentUser.authMethodLabel = AUTH_METHOD_LABEL[method] || 'Privy';
  if (!currentUser.name) currentUser.name = '故事玩家';
  if (!currentUser.avatar) currentUser.avatar = PRIVY_MOCK_USER.avatar;
  if (method === 'email') currentUser.email = opts.email || currentUser.email || 'user@example.com';
  if (opts.walletName) currentUser.walletName = opts.walletName;
  saveUserToStorage(currentUser);

  closeLoginModal();
  closeWalletPicker();
  closeWalletSign();
  refreshAccountSurfaces();

  const addr = sfWalletMasked();
  const msg = method === 'wallet'
    ? ('已连接 ' + (opts.walletName || '外部钱包') + ' · ' + addr)
    : ('已通过' + (AUTH_METHOD_LABEL[method] || 'Privy') + '登录 · 已创建内嵌钱包 ' + addr);
  showToast('✅ ' + msg, '🎉');
  document.dispatchEvent(new CustomEvent('auth-ready', { bubbles: true }));
}

// 登录 / 退出后刷新所有账户面（含只监听 window 的顶栏账户胶囊）
function refreshAccountSurfaces() {
  document.querySelectorAll('.auth-container').forEach(function (c) { renderAuthUI(c); });
  if (typeof window.refreshDhEth === 'function') {
    try { window.refreshDhEth(); } catch (e) {}
  }
}

// ---- 兼容旧调用 ----
function simulateWalletConnect() { openWalletPicker(); }

function mockLogin(method) {
  if (method === 'email') { openLoginModal(); return; }
  if (method === 'wallet') { openWalletPicker(); return; }
  authSocial(method);
}

// ============================================================
//  退出登录
// ============================================================
function showLogoutConfirm() {
  var existing = document.getElementById('logoutConfirmOverlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.className = 'logout-confirm-overlay';
  overlay.id = 'logoutConfirmOverlay';
  overlay.innerHTML = '<div class="logout-confirm-card">'
    + '<div class="logout-confirm-icon">🚪</div>'
    + '<div class="logout-confirm-title">退出登录</div>'
    + '<div class="logout-confirm-desc">确定要退出登录吗？</div>'
    + '<div class="logout-confirm-actions">'
    + '<button class="btn-cancel" id="logoutCancelBtn">取消</button>'
    + '<button class="btn-confirm" id="logoutConfirmBtn">确定</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(function() { overlay.classList.add('active'); });

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeLogoutConfirm();
  });
  document.getElementById('logoutCancelBtn').addEventListener('click', closeLogoutConfirm);
  document.getElementById('logoutConfirmBtn').addEventListener('click', function() {
    closeLogoutConfirm();
    doLogout();
  });
}

function closeLogoutConfirm() {
  var overlay = document.getElementById('logoutConfirmOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(function() { overlay.remove(); document.body.style.overflow = ''; }, 300);
  }
}

function doLogout() {
  currentUser.isLoggedIn = false;
  currentUser.authMethod = null;
  clearUserFromStorage();
  closeDropdown();
  refreshAccountSurfaces();
  showToast('👋 已退出登录', '👋');
  document.dispatchEvent(new CustomEvent('auth-ready', { bubbles: true }));
}

function handleLogout() {
  closeDropdown();
  showLogoutConfirm();
}

// ============================================================
//  下拉菜单
// ============================================================
function toggleDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('authDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

function closeDropdown() {
  const dropdown = document.getElementById('authDropdown');
  if (dropdown) {
    dropdown.classList.remove('active');
  }
}

// 点击外部关闭下拉菜单
document.addEventListener('click', function(e){
  const dropdown = document.getElementById('authDropdown');
  if (dropdown && dropdown.classList.contains('active')) {
    const userMenu = dropdown.closest('.auth-user-menu');
    if (userMenu && !userMenu.contains(e.target)) {
      closeDropdown();
    }
  }
});

// ============================================================
//  复制钱包地址（全站唯一地址来源）
// ============================================================
function copyAuthAddress(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const a = sfWalletFull();
  if (!a) { showToast('暂无可复制的钱包地址', '💡'); return; }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(a).then(
        () => showToast('钱包地址已复制', '📋'),
        () => showToast('复制失败，请手动选择地址', '💡')
      );
      return;
    }
  } catch (err) {}
  showToast('当前环境不支持自动复制，请手动选择地址', '💡');
}

// ============================================================
//  个人中心
// ============================================================
function openProfileCenter() {
  closeDropdown();
  window.location.href = 'profile-center.html';
}

// ============================================================
//  Toast 提示（页面可复用）
// ============================================================
function showToast(msg, icon) {

  // 尝试使用页面已有的 toast 系统
  const existingToast = document.getElementById('toastNotification');
  if (existingToast) {
    const msgEl = document.getElementById('toastMessage');
    const iconEl = existingToast.querySelector('.toast-icon');
    if (msgEl) msgEl.textContent = msg;
    if (iconEl && icon) iconEl.textContent = icon;
    existingToast.classList.add('show');
    clearTimeout(window._authToastTimer);
    window._authToastTimer = setTimeout(() => {
      existingToast.classList.remove('show');
    }, 3000);
    return;
  }

  // 如果没有 toast 系统，创建一个临时的
  let toast = document.getElementById('authTempToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'authTempToast';
    toast.style.cssText = `
      position: fixed; top: 24px; left: 50%; transform: translateX(-50%) translateY(-100px);
      z-index: 99999; background: rgba(26, 35, 47, 0.95); backdrop-filter: blur(8px);
      color: #fff; padding: 16px 24px; border-radius: 16px; font-size: 0.92rem;
      line-height: 1.6; box-shadow: 0 12px 40px rgba(27, 45, 71, 0.25);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
      opacity: 0; pointer-events: none; max-width: 420px; text-align: center; font-weight: 500;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = (icon || '💡') + ' ' + msg;
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  });
  clearTimeout(window._authToastTimer);
  window._authToastTimer = setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(-100px)';
    toast.style.opacity = '0';
  }, 3000);
}

// ============================================================
//  初始化（确保 auth-container 渲染）
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}

