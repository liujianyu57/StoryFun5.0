// Screen Fullscreen - system-level fullscreen via requestFullscreen API
function toggleScreenFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen().catch(function(){});
  }
}
document.addEventListener('fullscreenchange', function() {
  document.body.classList.toggle('screen-fullscreen', !!document.fullscreenElement);
});

// Inject screen-fullscreen CSS dynamically
(function(){
  var style = document.createElement('style');
  style.textContent = 
    '.screen-fullscreen #app{position:fixed!important;left:0!important;right:0!important;top:0!important;bottom:0!important;z-index:1000!important;border-radius:0!important}' +
    '.screen-fullscreen #desktopToolbar{position:fixed!important;left:0!important;right:0!important;bottom:0!important;height:48px!important;z-index:1002!important;display:flex!important}' +
    '.screen-fullscreen #playerProgress{position:fixed!important;left:0!important;right:0!important;bottom:48px!important;height:8px!important;z-index:1003!important}' +
    '.screen-fullscreen #watchBar{position:fixed!important;left:0!important;right:0!important;bottom:56px!important;height:44px!important;z-index:1002!important}' +
    '.screen-fullscreen #dtPageNav{position:fixed!important;right:12px!important;top:auto!important;bottom:calc(68px + 44px + 54px + 350px + env(safe-area-inset-bottom,0px))!important;z-index:1005!important;display:flex!important}' +
    '.screen-fullscreen .desktop-header,.screen-fullscreen .bnav,.screen-fullscreen .top-tab-bar,.screen-fullscreen .side-drawer,.screen-fullscreen .side-overlay{display:none!important}' +
    '.screen-fullscreen .slide{height:100vh!important}' +
    '.screen-fullscreen .info{bottom:calc(56px + 44px + 12px + env(safe-area-inset-bottom,0px))!important}' +
    '.screen-fullscreen .actions{bottom:calc(68px + 44px + 54px + env(safe-area-inset-bottom,0px))!important}' +
    '@media(min-width:769px){.screen-fullscreen #playerProgress{left:0!important;right:0!important;bottom:48px!important}.screen-fullscreen #desktopToolbar{left:0!important;right:0!important;bottom:0!important}.screen-fullscreen #app{left:0!important;right:0!important}.screen-fullscreen .desktop-header{display:none!important}}';
  document.head.appendChild(style);
})();