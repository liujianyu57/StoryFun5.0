/* ================================================================
   cm-panel.js - 通用评论/详情抽屉面板组件
   用法：
     CMPanel.init({
       drawerId: 'cmDrawer',          // 抽屉容器 ID
       theme: 'dark',                 // 'dark' | 'light'
       hasDrama: true,               // 是否有短剧详情 tab
       defaultTab: 'drama',          // 默认展开 tab: 'cmt' | 'drama'
       getData: function(id) { ... }, // 根据 id 获取数据对象
       buildDetailHTML: function(d) { return { html, epClick } },
       getComments: function(id) { return [] },
       addComment: function(id, comment) {},
       onOpen: function(data) {},
       onClose: function() {},
       squashTargets: [],              // 打开时需添加 'sqz' 类的元素 ID 列表
       epClickHandler: function(epNum) {} // 剧集点击回调
     })

   CMPanel.open(id)   — 打开面板
   CMPanel.close()    — 关闭面板
   CMPanel.isOpen()   — 是否打开
   ================================================================ */

var CMPanel = (function() {
  var _config = {};
  var _isOpen = false;
  var _currentId = null;
  var _commentsCache = {};

  var _defaultNames = ['清风','明月','繁星','晨曦','暮雪','城北','城南','夜雨','晓风','归燕'];
  var _defaultTexts = [
    '好剧！剧情节奏把控得太好，已经追起来了。',
    '期待更新🔥 每一集都很有代入感。',
    '这部剧绝了，演技和剧情都在线。',
    '追剧中…画面太美了！',
    '剧情太精彩了，人物冲突很带感。',
    '赞赞赞👍 这是今年最好看的AI短剧之一。',
    '对白写得很棒，感情线也很细腻。',
    '世界观很有意思，想多看几集。',
    '节奏紧凑，反转不断，强烈推荐。',
    '剧情扎实，演技和台词都在线。'
  ];

  function _fmt(n) {
    return n >= 1e4 ? (n/1e4).toFixed(1)+'w' : n >= 1e3 ? (n/1e3).toFixed(1)+'k' : n;
  }

  function _toast(msg) {
    var el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
    if (!el._styleInited) {
      el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.85);z-index:9998;background:rgba(255,255,255,.95);backdrop-filter:blur(14px);color:#13202e;padding:12px 26px;border-radius:12px;font-size:14px;font-weight:500;opacity:0;pointer-events:none;transition:all .22s;white-space:nowrap';
      el._styleInited = true;
    }
    el.textContent = msg;
    el.classList.add('show'); el.style.opacity = '1'; el.style.transform = 'translate(-50%,-50%) scale(1)';
    clearTimeout(el._t);
    el._t = setTimeout(function() { el.classList.remove('show'); el.style.opacity = '0'; el.style.transform = 'translate(-50%,-50%) scale(.85)'; }, 1600);
  }

  function _ensureComments(id) {
    if (_commentsCache[id]) return;
    var idNum = parseInt(String(id).replace(/\D/g,'')) || String(id).length;
    _commentsCache[id] = Array.from({length:5}, function(_, i) {
      var cid = Date.now() + i;
      var replies = [];
      if (i < 2) {
        replies = [
          { id: cid * 10 + 1, name: _defaultNames[(i + 3) % _defaultNames.length], text: '说得好！同感 👍', time: ((i+1)*2) + '分钟前', likes: 2 + i },
          { id: cid * 10 + 2, name: _defaultNames[(i + 5) % _defaultNames.length], text: '确实，这一集太精彩了', time: (i+1) + '分钟前', likes: 1 }
        ];
      }
      return {
        id: cid,
        name: _defaultNames[(i + idNum) % _defaultNames.length],
        text: _defaultTexts[(i + idNum) % _defaultTexts.length],
        time: ((i+1)*3) + '分钟前',
        likes: 5 + i * 3,
        replies: replies
      };
    });
  }

  function _renderComments(id) {
    var data = _config.getData ? _config.getData(id) : null;
    var comments;
    if (_config.getComments) {
      comments = _config.getComments(id);
    } else if (data && data.comments) {
      comments = data.comments;
    } else {
      _ensureComments(id);
      comments = _commentsCache[id] || [];
    }
    var listEl = document.getElementById('drawerCommentList');
    var countEl = document.getElementById('drawerCommentCount');
    if (!listEl || !countEl) return;
    var totalCount = comments.length;
    listEl.innerHTML = comments.map(function(c, ci) {
      var replies = c.replies || [];
      totalCount += replies.length;
      var replyHTML = '';
      if (replies.length > 0) {
        replyHTML = '<div class="cm-sub-list">' +
          replies.map(function(r) {
            return '<div class="cm-sub-item"><img class="cm-avatar cm-sub-avatar" src="https://api.dicebear.com/7.x/thumbs/svg?seed=' + encodeURIComponent(r.name) + '" alt="' + r.name + '"><div class="cm-content"><div class="cm-meta"><span class="cm-name">' + r.name + '</span><span class="cm-time">' + r.time + '</span></div><div class="cm-text">' + r.text + '</div><div class="cm-actions"><button>👍 ' + r.likes + '</button></div></div></div>';
          }).join('') +
          '</div>';
      }
      return '<div class="cm-item"><img class="cm-avatar" src="https://api.dicebear.com/7.x/thumbs/svg?seed=' + encodeURIComponent(c.name) + '" alt="' + c.name + '"><div class="cm-content"><div class="cm-meta"><span class="cm-name">' + c.name + '</span><span class="cm-time">' + c.time + '</span></div><div class="cm-text">' + c.text + '</div><div class="cm-actions"><button>👍 ' + c.likes + '</button><button class="cm-reply-btn" data-cid="' + c.id + '">💬 回复</button></div>' + replyHTML + '<div class="cm-reply-box" id="cmReplyBox_' + c.id + '" style="display:none"><input class="cm-reply-input" id="cmReplyInput_' + c.id + '" placeholder="回复 ' + c.name + '..." maxlength="200" /><button class="cm-reply-send" data-cid="' + c.id + '">发送</button></div></div></div>';
    }).join('');
    countEl.textContent = totalCount;
    // 绑定回复按钮
    setTimeout(function() {
      listEl.querySelectorAll('.cm-reply-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var cid = this.dataset.cid;
          var box = document.getElementById('cmReplyBox_' + cid);
          if (box) {
            var isVisible = box.style.display !== 'none';
            box.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) document.getElementById('cmReplyInput_' + cid).focus();
          }
        });
      });
      listEl.querySelectorAll('.cm-reply-send').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var cid = this.dataset.cid;
          var input = document.getElementById('cmReplyInput_' + cid);
          if (!input) return;
          var text = input.value.trim();
          if (!text) { _toast('请输入回复内容'); return; }
          if (text.length > 200) { _toast('回复不能超过200字'); return; }
          var reply = { id: Date.now(), name: '我', text: text, time: '刚刚', likes: 0 };
          var commentsData = _commentsCache[id] || [];
          var parent = null;
          for (var i = 0; i < commentsData.length; i++) {
            if (commentsData[i].id == cid) { parent = commentsData[i]; break; }
          }
          if (parent) {
            if (!parent.replies) parent.replies = [];
            parent.replies.push(reply);
          }
          input.value = '';
          document.getElementById('cmReplyBox_' + cid).style.display = 'none';
          _renderComments(id);
          _toast('✅ 回复已发送');
        });
      });
    }, 100);
  }

  function _postComment() {
    var input = document.getElementById('drawerCommentInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) { _toast('请输入评论内容'); return; }
    if (text.length > 200) { _toast('评论不能超过200字'); return; }
    var comment = { id: Date.now(), name: '我', text: text, time: '刚刚', likes: 0 };
    if (_config.addComment) {
      _config.addComment(_currentId, comment);
    } else {
      if (!_commentsCache[_currentId]) _ensureComments(_currentId);
      _commentsCache[_currentId].unshift(comment);
    }
    input.value = '';
    _renderComments(_currentId);
    _toast('✅ 评论已发布');
  }

  function _setRating(did, star) {
    var stars = document.querySelectorAll('#ratingStars_' + did + ' .cr-star');
    var scoreEl = document.getElementById('ratingScore_' + did);
    for (var i = 0; i < stars.length; i++) {
      stars[i].classList.toggle('active', i < star);
    }
    if (scoreEl) scoreEl.textContent = star + '星';
    localStorage.setItem('drama_rating_' + did, star);
    _toast('已评分 ' + star + ' 星');
  }

  function _switchTab(tabName) {
    var showCmt = tabName === 'cmt';
    var cp = document.getElementById('commentPanel');
    var ft = document.getElementById('cmFooter');
    if (cp) cp.style.display = showCmt ? '' : 'none';
    if (ft) ft.style.display = showCmt ? '' : 'none';
    var dp = document.getElementById('cmDetailPanel');
    if (dp) dp.classList.toggle('show', tabName === 'drama');
  }

  function _setupTabEvents() {
    var drawer = document.getElementById(_config.drawerId || 'cmDrawer');
    if (!drawer) return;
    drawer.querySelectorAll('.cm-tab').forEach(function(t) {
      t.addEventListener('click', function(e) {
        e.stopPropagation();
        var tab = this.dataset.cmtab;
        drawer.querySelectorAll('.cm-tab').forEach(function(b) { b.classList.toggle('active', b === t); });
        _switchTab(tab);
      });
    });
  }

  function open(id) {
    if (id === undefined || id === null) return;
    _currentId = id;
    var data = _config.getData ? _config.getData(id) : null;
    if (!data) { console.warn('CMPanel: no data for id', id); return; }

    var drawer = document.getElementById(_config.drawerId || 'cmDrawer');
    var cmBody = document.getElementById('cmBody');
    var cmTitle = document.getElementById('cmTitle');
    if (!drawer || !cmBody || !cmTitle) return;

    // 短视频：隐藏「短剧」页签，仅保留评论
    var isVideo = data.type === 'video';
    var hasDrama = !isVideo && _config.hasDrama !== false;
    var defaultTab = isVideo ? 'cmt' : (_config.defaultTab === 'drama' ? 'drama' : 'cmt');

    // 构建 tabs
    cmTitle.innerHTML = '<div class="cm-tabs">' +
      '<button class="cm-tab ' + (defaultTab === 'cmt' ? 'active' : '') + '" data-cmtab="cmt">评论</button>' +
      (hasDrama ? '<button class="cm-tab ' + (defaultTab === 'drama' ? 'active' : '') + '" data-cmtab="drama">短剧</button>' : '') +
      '</div>';

    // 构建详情 HTML
    var detailHTML = '';
    if (hasDrama) {
      detailHTML = _config.buildDetailHTML ? _config.buildDetailHTML(data) : '';
    }

    cmBody.innerHTML = '<div class="comment-panel" id="commentPanel"><div class="comment-header"><span class="comment-title">用户评论</span><span class="comment-count">(<span id="drawerCommentCount">0</span>)</span></div><div id="drawerCommentList"></div></div>' + detailHTML;

    // 注入 footer（评论输入框）
    var existingFooter = document.getElementById('cmFooter');
    if (!existingFooter) {
      drawer.querySelector('.cm-panel').insertAdjacentHTML('beforeend', '<div class="cm-footer" id="cmFooter"><div class="comment-input-wrap"><input id="drawerCommentInput" placeholder="写下你的评论..." maxlength="200" /><button class="send-btn" id="drawerSendBtn">发送</button></div></div>');
    }

    _renderComments(id);
    _setupTabEvents();

    // 如果默认 tab 不是评论，隐藏评论区和 footer
    if (defaultTab !== 'cmt') {
      _switchTab(defaultTab);
    }

    // 绑定额外事件
    var sendBtn = document.getElementById('drawerSendBtn');
    if (sendBtn) { sendBtn.addEventListener('click', function(e) { e.stopPropagation(); _postComment(); }); }

    var inp = document.getElementById('drawerCommentInput');
    if (inp) { inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); _postComment(); } }); }

    // 绑定剧集点击
    if (_config.epClickHandler) {
      var panel = document.getElementById('cmDetailPanel');
      if (panel && !panel._epBound) {
        panel._epBound = true;
        panel.addEventListener('click', function(e) {
          var item = e.target.closest('.cm-ep-item');
          if (item) {
            var epNum = parseInt(item.getAttribute('data-ep'));
            if (epNum >= 1) {
              var old = panel.querySelector('.cm-ep-item.active');
              if (old) old.classList.remove('active');
              item.classList.add('active');
              _config.epClickHandler(epNum);
            }
          }
        });
      }
    }

    // 绑定评分点击
    var detailPanel = document.getElementById('cmDetailPanel');
    if (detailPanel) {
      detailPanel.addEventListener('click', function(e) {
        var star = e.target.closest('.cr-star');
        if (!star) return;
        var starsContainer = star.parentElement;
        if (!starsContainer) return;
        var allStars = starsContainer.querySelectorAll('.cr-star');
        var idx = -1;
        for (var si = 0; si < allStars.length; si++) {
          if (allStars[si] === star) { idx = si; break; }
        }
        if (idx >= 0) {
          var did = starsContainer.id.replace('ratingStars_', '');
          _setRating(did, idx + 1);
        }
      });
    }

    drawer.classList.add('open');
    _isOpen = true;

    // squash 效果
    if (_config.squashTargets && _config.squashTargets.length) {
      _config.squashTargets.forEach(function(targetId) {
        var el = document.getElementById(targetId);
        if (el) el.classList.add('sqz');
      });
    }

    if (_config.onOpen) _config.onOpen(data);
  }

  function close() {
    var drawer = document.getElementById(_config.drawerId || 'cmDrawer');
    if (!drawer) return;
    drawer.classList.remove('open');
    _isOpen = false;

    // 清理 footer
    var ft = document.getElementById('cmFooter');
    if (ft) ft.remove();

    // squash 恢复
    if (_config.squashTargets && _config.squashTargets.length) {
      _config.squashTargets.forEach(function(targetId) {
        var el = document.getElementById(targetId);
        if (el) el.classList.remove('sqz');
      });
    }

    if (_config.onClose) _config.onClose();
  }

  function isOpen() { return _isOpen; }

  function init(options) {
    _config = options || {};

    // 应用主题
    if (_config.theme === 'dark') {
      document.body.setAttribute('data-cm-theme', 'dark');
    } else {
      document.body.removeAttribute('data-cm-theme');
    }

    // 绑定关闭按钮
    var drawer = document.getElementById(_config.drawerId || 'cmDrawer');
    if (drawer) {
      var closeBtn = drawer.querySelector('.cm-close');
      var overlay = drawer.querySelector('.cm-overlay');
      if (closeBtn) closeBtn.addEventListener('click', close);
      if (overlay) overlay.addEventListener('click', close);
    }
  }

  return {
    init: init,
    open: open,
    close: close,
    isOpen: isOpen,
    toast: _toast,
    fmt: _fmt
  };
})();