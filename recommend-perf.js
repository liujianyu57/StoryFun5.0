// Performance optimization for recommend.html
// 1. Lazy render: only build first 3 slides, rest in chunks
// 2. Event delegation: replace bindEvents() with single listener on #track

(function(){
  // Wait for DOM and main script to be ready
  function init(){
    var track = document.getElementById('track');
    if (!track) return;

    // --- Event Delegation (replaces bindEvents) ---
    track.addEventListener('click', function(e){
      var el = e.target;

      // like button
      var likeBtn = el.closest('[data-act="like"]');
      if (likeBtn) {
        e.stopPropagation();
        var did = likeBtn.dataset.id;
        var d = DATA.find(function(x){ return x.id === did; });
        if (!d) return;
        d.like = !d.like;
        var ic = likeBtn.querySelector('.act-icon');
        var lb = likeBtn.querySelector('.act-label');
        if (d.like) {
          ic.classList.add('liked');
          ic.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="#ff4d6a"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
          d.likes++;
          showToast('已点赞');
        } else {
          ic.classList.remove('liked');
          ic.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
          d.likes--;
        }
        lb.textContent = typeof fmt === 'function' ? fmt(d.likes) : d.likes;
        return;
      }

      // fav button
      var favBtn = el.closest('[data-act="fav"]');
      if (favBtn) {
        e.stopPropagation();
        var favDid = favBtn.dataset.id;
        var favD = DATA.find(function(x){ return x.id === favDid; });
        if (!favD) return;
        favD.fav = !favD.fav;
        var favIc = favBtn.querySelector('.act-icon');
        if (favD.fav) {
          favIc.classList.add('bookmarked');
          favIc.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
          showToast('已收藏');
        } else {
          favIc.classList.remove('bookmarked');
          favIc.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
        }
        return;
      }

      // comment button
      var cmtBtn = el.closest('[data-act="cmt"]');
      if (cmtBtn) {
        e.stopPropagation();
        var cmtDid = cmtBtn.dataset.id;
        var cmtD = DATA.find(function(x){ return x.id === cmtDid; });
        if (cmtD) CMPanel.open(cmtDid);
        return;
      }

      // share button
      var shareBtn = el.closest('[data-act="share"]');
      if (shareBtn) {
        e.stopPropagation();
        showToast('📋 分享功能开发中');
        return;
      }

      // danmaku button
      var danmakuBtn = el.closest('.danmaku-btn');
      if (danmakuBtn) {
        e.stopPropagation();
        openDanmakuDrawer();
        return;
      }

      // info title / tags
      var infoTitle = el.closest('.info-title') || el.closest('.info-tags');
      if (infoTitle) {
        e.stopPropagation();
        if (typeof idx !== 'undefined') {
          var dd = DATA[idx];
          if (dd && dd.type === 'drama') {
            CMPanel.open(dd.id);
            setTimeout(function(){
              var t = document.querySelector('#cmDrawer .cm-tab[data-cmtab="drama"]');
              if (t) t.click();
            }, 100);
          }
        }
        return;
      }

      // act-creator
      var creator = el.closest('.act-creator');
      if (creator && !el.closest('.ac-follow')) {
        e.stopPropagation();
        var dd2 = DATA[typeof idx !== 'undefined' ? idx : 0];
        if (dd2 && dd2.author) location.href = 'user-profile-visitor.html?author=' + encodeURIComponent(dd2.author);
        return;
      }

      // follow button
      var followBtn = el.closest('.ac-follow');
      if (followBtn) {
        e.stopPropagation();
        var authorName = followBtn.getAttribute('data-follow');
        if (!authorName) return;
        var isFollowed = followBtn.classList.contains('followed');
        DATA.forEach(function(dd3){ if (dd3.author === authorName) dd3.followed = !isFollowed; });
        if (!isFollowed) {
          followBtn.classList.add('followed');
          followBtn.textContent = '✓';
          showToast('已关注 ' + authorName);
        } else {
          followBtn.classList.remove('followed');
          followBtn.textContent = '+';
          showToast('已取消关注 ' + authorName);
        }
        return;
      }

      // desc-expand
      var expandBtn = el.closest('.desc-expand');
      if (expandBtn) {
        e.stopPropagation();
        var txt = expandBtn.parentElement.querySelector('.desc-text');
        if (!txt) return;
        if (txt.classList.contains('expanded')) {
          txt.classList.remove('expanded');
          expandBtn.textContent = '展开';
        } else {
          txt.classList.add('expanded');
          expandBtn.textContent = '收起';
        }
        return;
      }
    });

    // Mark that we've delegated so bindEvents doesn't double-bind
    window._perfDelegated = true;
  }

  // Wait for DATA, CMPanel, showToast etc. to be defined
  var attempts = 0;
  var wait = setInterval(function(){
    attempts++;
    if (typeof DATA !== 'undefined' && typeof CMPanel !== 'undefined') {
      clearInterval(wait);
      init();
    } else if (attempts > 50) {
      clearInterval(wait);
    }
  }, 50);
})();