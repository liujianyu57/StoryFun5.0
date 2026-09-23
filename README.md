# Story.fun 产品原型 Demo

> AI 短剧内容社区 + 叙事币发射台 的产品原型。纯前端 HTML 原型，无需安装任何环境，用浏览器直接打开即可演示。

## 🚀 怎么打开

直接用浏览器（Chrome / Edge / Safari 均可）打开根目录下的任意 `.html` 文件即可。
建议从 **`index.html`**（短剧）或 **`recommend.html`**（推荐）开始演示。

> 提示：`video/` 文件夹里的视频较大（共 84MB），如果只是看页面效果可以不用管它。

## 📄 页面清单

### 内容主线

| 页面 | 说明 |
|---|---|
| `recommend.html` | 推荐 · 短视频信息流 + 榜单 |
| `index.html` | 短剧 · 短剧库与内容卡片 |
| `drama-player.html` | 短剧/视频播放器（点击任意内容封面进入） |
| `social.html` | 社区动态 / 关注流 |

### 创作与发布

| 页面 | 说明 |
|---|---|
| `narrator.html` | 创作中心 · 我的短剧/视频管理 |
| `publish.html` | 发布短剧 |
| `publish-video.html` | 发布视频 |
| `edit-drama.html` | 编辑短剧 |
| `edit-video.html` | 编辑视频 |

### 用户中心

| 页面 | 说明 |
|---|---|
| `profile-center.html` | 个人中心（桌面/移动通用版） |
| `user-profile-visitor.html` | 访客视角的他人主页 |
| `watch-history.html` | 观看历史 |
| `notifications.html` | 通知中心（互动类） |
| `search.html` / `search-results.html` | 搜索（结果页四页签：代币（默认）+ 短剧 + 视频 + 用户） |
| `mobile-login.html` | 登录页 |
| `settings.html` | 设置 |
| `notify-settings.html` | 通知设置 |

### 公共组件（被多个页面共用，一般无需直接打开）

| 文件 | 说明 |
|---|---|
| `auth.js` | 登录/用户状态（全站共用，邮箱模拟登录） |
| `load-sidebar.js` | 侧边栏导航（桌面端） |
| `load-desktop-header.js` | 顶部导航（桌面端：搜索 · 通知 · 「发布」hover 菜单 · 账户；菜单 → 发射代币/发布短剧/发布视频） |
| `load-bottom-nav.js` + `bottom-nav.html` | 底部导航（H5 手机端） |
| `drama-card.js` | 短剧卡片渲染组件 |
| `launch-card.js` | 币卡片渲染组件（市场页与搜索结果页「代币」页签共用，含卡片样式与 hover 播视频） |
| `cm-panel.js` / `cm-panel.css` | 评论面板（评论区、弹幕等） |
| `search.js` | 全局搜索逻辑 |
| `notify-settings.js` | 通知设置弹窗逻辑 |
| `player-controls.js` / `screen-fullscreen.js` | 播放器控件 / 全屏 |
| `recommend-perf.js` | 推荐页性能优化 |
| `mobile-drawer.js` / `mobile-drawer.css` | 移动抽屉组件 |

### 发射台（Launch · 短视频叙事的代币发射）

| 页面 | 说明 |
|---|---|
| `launchpad.html` | 市场总览 · 浏览未毕业/已毕业的叙事币（无自有搜索/创建入口，统一走顶栏全局搜索与「发布」菜单） |
| `launch.html` | 创建 · 用 AI 生成或我的作品做叙事，三步发币 |
| `coin-detail.html` | 交易 · curve/池 两阶段 K 线、Swap、持有者、聊天 |
| `assets.html` | 我的资产 · 持仓/创建的币/交易历史/AI 叙事 |
| `launch-coin.js` | 发射台数据与规则引擎（mock：curve、毕业、费用） |
| `launch.css` | 发射台设计系统（浅色 · 黑主色） |
| `launch-shell.js` | 发射台顶栏/通知/调试面板 |
| `coin-link.js` | 播放页「已上链」反链徽标 |

> 演示提示：URL 加 `?debug=1` 可打开调试面板（补 ETH / 一键毕业 / 重置数据）。

## 🗂 目录说明

- `image/` — 页面图片（已优化压缩为 JPG）
- `video/` — 演示视频（4 个，共约 84MB）
- `App 多语言/`、`Web多语言/` — 多语言文案资产（未被页面引用，为后续 App/Web 多语言预留）

## ℹ️ 说明

- 本仓库为纯前端 Demo，所有数据均为前端 mock，无后端依赖。
- 页面图片部分使用 Unsplash 外链，需要联网才可完整显示。
