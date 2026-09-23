(function(){
  function getCurrentIdx(){
    var track = document.getElementById('track');
    if (!track) return 0;
    var t = track.style.transform;
    var m = t && t.match(/translateY\((-?\d+)px\)/);
    if (m) return Math.round(Math.abs(parseInt(m[1])) / window.innerHeight);
    return 0;
  }

  window.togglePlayPause = function(){
    var idx = getCurrentIdx();
    var curV = document.querySelector('#track .slide:nth-child('+(idx+1)+') .slide-video, #track .slide:nth-child('+(idx+1)+') .slide-img');
    if (!curV) return;
    var wasPaused = curV.paused;
    var btn = document.getElementById('dtPlayPauseBtn');

    if (typeof window.playerPaused !== 'undefined') {
      window.playerPaused = !wasPaused;
    }

    if (wasPaused) {
      curV.play().catch(function(){});
      if (btn) btn.innerHTML = '<svg viewBox="0 0 16 16" fill="none"><path d="M3 2h3v12H3zM10 2h3v12h-3z" fill="currentColor"/></svg>';
    } else {
      curV.pause();
      if (btn) btn.innerHTML = '<svg viewBox="0 0 16 16" fill="none"><path d="M4 3v10l9-5z" fill="currentColor"/></svg>';
    }
    var dm = document.getElementById('dm_'+idx);
    if (dm) dm.querySelectorAll('.dm-item').forEach(function(el){ el.style.animationPlayState = !wasPaused ? 'paused' : 'running'; });
  };

  function fmtTimeText(progress){
    var t = Math.round(progress * 45);
    var m = Math.floor(t/60), s = t%60;
    return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+' / 45:00';
  }

  setInterval(function(){
    var pp = document.getElementById('ppFill');
    var tt = document.getElementById('dtTimeText');
    if (!pp || !tt) return;
    var w = parseFloat(pp.style.width) || 0;
    tt.textContent = fmtTimeText(Math.min(1, w/100));
  }, 250);
})();