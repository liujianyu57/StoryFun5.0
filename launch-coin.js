// ============================================================
//  Story.fun 发射台 · 数据与规则引擎（纯前端 mock 原型）
//  pons v2 语义：curve 阶段 → 毕业 → Uniswap 池
//  全部数值为演示 mock，集中在 CONFIG 中
// ============================================================

(function () {
  'use strict';

  // ============================================================
  //  CONFIG — 演示经济参数（集中可调）
  // ============================================================
  var CONFIG = {
    ETH_USD: 3200,            // 演示汇率 1 ETH = $3200
    totalSupply: 1000000000,  // 发行总量 10 亿
    curveK: 20,               // 毕业时价格 ≈ 初始价 × (1+20) = 21x
    feeRate: 0.01,            // 交易费 1%
    creatorShare: 0.70,       // 创作者分成 70%（协议 30%）
    launchFeeUsd: 1.6,        // 发行费 $1.6 ≈ 0.0005 ETH
    genFeeUsd: 64,            // AI 生成费 $64 ≈ 0.02 ETH
    gradThresholdUsd: 13440,  // 毕业池阈值 ≈ 4.2 ETH
    quick: [0.25, 0.5, 1]     // 快捷比例
  };
  var K = CONFIG;

  // ============================================================
  //  全局可用：余额 / 持仓 / 关注 / 通知 / 交易历史
  // ============================================================
  var USER = {
    id: 'u_' + (typeof currentUser !== 'undefined' && currentUser.id ? currentUser.id : 'demo'),
    eth: 2.5,                  // 可用 ETH（含已用？简化：可用）
    holdings: {},              // coinId -> {amount, avgUsd}
    created: [],               // 我创建的 coinId
    watch: [],                 // 关注列表
    claimable: {},             // coinId -> usd 可领取创作者收益
    claimed: {},               // coinId -> 已领取 usd
    tx: [],                    // 我的交易历史
    realizedPnl: 0,            // 账户级已实现盈亏（USD，卖出时结算）
    realizedByCoin: {}         // coinId -> 已实现盈亏（USD）
  };
  var STORE_KEY = 'storyfun_launch_v1';
  var SCHEMA_VERSION = 15;

  // ============================================================
  //  配对资产（quote）：ETH + 股票代币
  //  顺序必须与市场 Pair 筛选按钮一致（launchpad 动态注入同一列表）
  // ============================================================
  var PAIR_STOCKS = ['AAPL','AMD','AMZN','BB','COIN','COST','CRCL','DELL','DJT','FIG','GLD','GME','GOOGL','HIMS','JNJ','LLY','LULU','META','MRNA','MRVL','MSFT','MSTR','MU','NVDA','PFE','PLTR','QQQ','RBLX','RDDT','RIVN','SKHY','SNAP','SNDK','SPCX','SPY','TSLA','TSM','TTWO','USO','WYFI'];
  // pons v2 quote 资产：原生 ETH + 稳定币/封装/加密（USDG、cbBTC…）+ 通证化股票
  var QUOTE_CRYPTO = ['WETH', 'USDG', 'cbBTC'];
  // 演示美元价（≈真实价位）：用于毕业阈值换算 / 演示钱包余额与水龙头
  var ASSET_PRICES = {
    ETH: 3200, WETH: 3200, USDG: 1, cbBTC: 98000,
    AAPL: 210, AMD: 160, AMZN: 205, BB: 4.2, COIN: 265, COST: 940,
    CRCL: 150, DELL: 130, DJT: 30, FIG: 95, GLD: 255, GME: 26, GOOGL: 192,
    HIMS: 62, JNJ: 148, LLY: 820, LULU: 245, META: 555, MRNA: 42, MRVL: 108,
    MSFT: 462, MSTR: 420, MU: 132, NVDA: 175, PFE: 27, PLTR: 118, QQQ: 470,
    RBLX: 78, RDDT: 245, RIVN: 21, SKHY: 145, SNAP: 12, SNDK: 128, SPCX: 340,
    SPY: 560, TSLA: 350, TSM: 195, TTWO: 152, USO: 88, WYFI: 34
  };
  var ALL_PAIRS = ['ETH'].concat(PAIR_STOCKS);
  // 全部可计价/可支付资产（含 ETH 镜像钱包）；顺序 = 各页面支付选择器的默认顺序
  var ALL_ASSETS = ALL_PAIRS.concat(QUOTE_CRYPTO);
  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
  // 确定性随机配对：同一 id 永远得到同一 pair（演示数据稳定）
  // ETH 判定与股票取模互质（%7 与 %40）→ 40 个股票桶均会被覆盖，筛选不会出现空桶
  function pairOf(id) {
    var h = hashStr(id || '');
    if (h % 7 === 0) return 'ETH';
    return PAIR_STOCKS[Math.floor(h / 7) % PAIR_STOCKS.length];
  }

  // ============================================================
  //  种子币（演示数据 12 个，覆盖全部状态）
  // ============================================================
  var now = Date.now();
  var D = function (h) { return now - h * 3600000; };

  function seedCoin(o) {
    var graduated = !!o.graduated;
    var gradT = o.gradThresholdUsd || K.gradThresholdUsd;
    var pool0 = o.poolUsd || 0;
    var prog0 = graduated ? 1 : clamp(pool0 / gradT, 0.01, 0.99); // 下限 1%（与详情页/模拟引擎一致，避免模拟买入时进度“倒退”）
    // 固定初始价：由种子价倒推（毕业币的 p0 视为毕业价基准，买卖在其附近波动）
    var p0 = graduated ? o.priceUsd : (o.priceUsd / (1 + K.curveK * prog0));
    var price = graduated ? o.priceUsd : (p0 * (1 + K.curveK * prog0));
    // 锁仓：部分币有一定比例供应锁定/预留 → FDV > MC；流通供应 = 总量 × (1−lockedPct)
    var lockedPct = o.lockedPct || 0;
    var circulating = K.totalSupply * (1 - lockedPct);
    var fdv = price * K.totalSupply;          // 总市值（完全稀释）
    var marketCap = price * circulating;      // 流通市值 MC
    return {
      id: o.id,
      name: o.name,
      symbol: o.symbol,
      tagline: o.tagline,
      creator: o.creator,
      creatorAddr: o.creatorAddr,
      creatorWallet: o.creatorWallet || '',   // 高级设置：创作者费收款钱包（留空=连接钱包）
      cover: o.cover,
      video: o.video || '',
      sourceType: o.sourceType || 'ai',   // ai | work
      sourceTitle: o.sourceTitle || '',
      pair: o.pair || 'ETH',           // 配对资产：ETH 或股票代币（由创建时选择/演示分配）
      supply: K.totalSupply,
      circulating: circulating,               // 流通供应量
      lockedPct: lockedPct,                   // 锁定/预留比例 0–1
      p0: p0,
      priceUsd: price,
      marketCap: marketCap,                   // 流通市值 MC
      fdv: fdv,                               // 完全稀释 FDV
      holders: o.holders,
      volumeUsd: o.volumeUsd,
      // 成交量时间窗（Volume 排序语义用）：无真实分窗时派生；冷门币（总量 0）约 1/4 24h 无量
      vol24hUsd: (function () {
        if (o.vol24hUsd != null) return o.vol24hUsd;
        var seed = ((o.id || '').length * 7919 + ((o.id || '').charCodeAt(0) || 0) * 131) % 100;
        if (!o.volumeUsd && seed < 25) return 0;   // 冷门币 24h 无成交 → 会被 volume+24h 过滤
        return Math.max((o.volumeUsd || 0) * (0.12 + ((o.id || '').length % 4) * 0.09), 300 + seed * 137);
      })(),
      vol7dUsd: (function () {
        if (o.vol7dUsd != null) return o.vol7dUsd;
        var seed = ((o.id || '').length * 104729 + ((o.id || '').charCodeAt(0) || 0) * 233) % 97;
        return Math.max((o.volumeUsd || 0) * 0.85, 900 + seed * 620);
      })(),
      launchedAt: o.launchedAt,
      graduated: graduated,
      gradAt: o.gradAt || null,
      gradThresholdUsd: gradT,
      progress: prog0,                     // curve 池额比例（毕业=1）
      poolUsd: pool0,                      // curve/池 收集金额
      change24h: o.change24h,
      isNew: o.isNew || false,
      lastBuyAt: o.lastBuyAt || o.launchedAt || Date.now(),  // 最近一次买入时间（市场排序用）
      buyerAddr: o.buyerAddr || walletFrom('seed:' + o.id),       // 最近买入钱包（展示用，确定性模拟）
      creatorHoldsPct: o.creatorHoldsPct == null ? 0 : o.creatorHoldsPct, // 创建者持仓占比 %（>20 触发警示）
      isOriginal: !!o.isOriginal,         // OG：本币名/代号首次发行
      buybackLockedPct: o.buybackLockedPct || null, // 锁入创建者回购的比例
      // 创建页扩展字段
      social: o.social || null,          // {x, tg}
      creatorTaxPct: o.creatorTaxPct || 0, // 创作者税：1% 基础费之上叠加的额外百分比（0–10，2 位小数；演示经济仍按基础费计）
      shareToHolders: !!o.shareToHolders,  // 是否将 creator 费分给持有者
      devBuyEth: o.devBuyEth || 0,       // 开发者预买（ETH，兼容旧字段）
      devBuyQty: o.devBuyQty || 0,       // 开发者预买数量（按配对资产单位）
      devBuyPair: o.devBuyPair || 'ETH', // 开发者预买的计价资产
      snipeExempts: o.snipeExempts || [],  // 狙击税豁免钱包列表
      // 演示静态 K 线（svg 折线用 0..1 归一化）
      spark: o.spark || [0.3, 0.4, 0.35, 0.5, 0.6, 0.55, 0.7, 0.8, 0.9]
    };
  }

  // 素材资源
  var IMG = {
    feng: 'image/fenggu_cover.jpg',
    cheng: 'image/chengxiangfu_cover.jpg',
    xie: 'image/xiejia_cover.jpg',
    allin: 'image/cover-allin.jpg',
    candle: 'image/cover-candle.jpg',
    names: 'image/cover-names.jpg',
    pyramid: 'image/cover-pyramid.jpg',
    survivor: 'image/cover-survivor.jpg',
    zero: 'image/cover-zero-night.jpg',
    hero: 'image/hero-bg-blur.jpg',
    poster: 'image/trailer-poster.jpg'
  };
  var VID = {
    feng: 'video/凤骨琉璃.mp4',
    cheng: 'video/丞相府今日开饭.mp4',
    fight: 'video/打斗视频.mp4',
    xie: 'video/我卸甲后天下大乱了.mp4'
  };

  var SEED = [
    seedCoin({
      id: 'c_feng', name: '凤骨琉璃', symbol: 'FENGGU', tagline: '琉璃易碎，凤骨不折。', shareToHolders: true, creatorHoldsPct: 12,
      creator: '林晚棠', creatorAddr: '0x7A2b…fD81', cover: IMG.feng, video: VID.feng, sourceType: 'work', sourceTitle: '短剧《凤骨琉璃》',
      priceUsd: 0.0009, holders: 2841, volumeUsd: 124000, launchedAt: D(52), graduated: false, progress: 0.94,
      poolUsd: 12650, change24h: 0.42, lastBuyAt: D(1.2), spark: [0.2, 0.35, 0.3, 0.45, 0.6, 0.72, 0.8, 0.94],
      social: { x: 'lintang_fenggu', tg: 'fenggu_official' },
      creatorTaxPct: 2,
    }),
    seedCoin({
      id: 'c_cheng', name: '丞相府今日开饭', symbol: 'XIANG', tagline: '天下粮仓，开饭为敬。', lockedPct: 0.30,
      creator: '厨子老王', creatorAddr: '0x9F3c…aa12', cover: IMG.cheng, video: VID.cheng, sourceType: 'work', sourceTitle: '短剧《丞相府今日开饭》',
      priceUsd: 0.0021, holders: 5210, volumeUsd: 389000, launchedAt: D(120), graduated: true, gradAt: D(88),
      poolUsd: 61200, change24h: 0.68, lastBuyAt: D(26), spark: [0.1, 0.2, 0.5, 0.45, 0.7, 0.85, 0.9, 1],
      social: { x: 'xiangfu_daily', tg: 'xiangfu_kitchen' }
    }),
    seedCoin({
      id: 'c_xie', name: '我卸甲后天下大乱了', symbol: 'XIEJIA', tagline: '卸甲归田，天下却需要我。', creatorHoldsPct: 38,
      creator: '慕容战', creatorAddr: '0x1D8a…b40e', cover: IMG.xie, video: VID.xie, sourceType: 'work', sourceTitle: '短剧《我卸甲后天下大乱了》',
      priceUsd: 0.0014, holders: 1976, volumeUsd: 156000, launchedAt: D(30), graduated: false, progress: 0.71,
      poolUsd: 9660, change24h: -0.12, lastBuyAt: D(5), spark: [0.3, 0.5, 0.62, 0.55, 0.7, 0.66, 0.74, 0.71],
      social: { x: 'mofu_xiejia', tg: 'xiejia_warriors' }
    }),
    seedCoin({
      id: 'c_mooncat', name: '月球打碟猫', symbol: 'MOONCAT', tagline: '一只穿西装的猫，在月球打碟。', lockedPct: 0.12,
      creator: 'Astra', creatorAddr: '0xE45b…77c9', cover: IMG.zero, video: VID.fight, sourceType: 'ai', sourceTitle: 'AI 叙事 · 15s',
      priceUsd: 0.000042, holders: 318, volumeUsd: 12000, launchedAt: D(3), graduated: false, progress: 0.12,
      poolUsd: 890, change24h: 2.31, isNew: true, lastBuyAt: D(0.3), spark: [0.4, 0.6, 0.5, 0.8, 0.7, 1],
      social: { x: 'mooncat_eth', tg: '' },
      pair: 'NVDA',
      creatorTaxPct: 1,
      shareToHolders: true,
    }),
    seedCoin({
      id: 'c_candle', name: '烛火与王冠', symbol: 'CANDLE', tagline: '在权力的烛光里，谁先燃尽。',
      creator: 'Sylvan', creatorAddr: '0xB20f…9e01', cover: IMG.candle, video: 'video/打斗视频.mp4', sourceType: 'ai', sourceTitle: 'AI 叙事 · 15s',
      priceUsd: 0.0001, holders: 1206, volumeUsd: 22000, launchedAt: D(10), graduated: false, progress: 0.28,
      poolUsd: 2210, change24h: 0.05, lastBuyAt: D(4), spark: [0.3, 0.35, 0.4, 0.38, 0.45],
      pair: 'GLD',
      social: { x: 'candle_crown', tg: '' }
    }),
    seedCoin({
      id: 'c_survivor', name: '末日幸存指南', symbol: 'SURVIVE', tagline: '天亮之前，先活过今晚。', lockedPct: 0.18, creatorHoldsPct: 29,
      creator: 'Noah', creatorAddr: '0x57C9…f1a3', cover: IMG.survivor, video: 'video/丞相府今日开饭.mp4', sourceType: 'ai', sourceTitle: 'AI 叙事 · 15s',
      priceUsd: 0.00018, holders: 2304, volumeUsd: 88000, launchedAt: D(40), graduated: true, gradAt: D(21),
      poolUsd: 15400, change24h: -0.24, lastBuyAt: D(12), spark: [0.3, 0.5, 0.8, 0.9, 0.7, 0.6, 0.62, 0.5],
      social: { x: 'noah_survive', tg: 'noah_bunker' },
      creatorTaxPct: 3,
    }),
    seedCoin({
      id: 'c_zero', name: '零点计划', symbol: 'ZERO', tagline: '世界重置前的最后一分钟。',
      creator: 'Kai', creatorAddr: '0x08eD…31b6', cover: IMG.zero, video: VID.xie, sourceType: 'ai', sourceTitle: 'AI 叙事 · 15s',
      priceUsd: 0.00032, holders: 884, volumeUsd: 31200, launchedAt: D(2), graduated: false, progress: 0.06,
      poolUsd: 420, change24h: 0.84, isNew: true, lastBuyAt: D(0.6), spark: [0.5, 0.6, 0.55, 0.7],
      pair: 'SPY'
    }),
    seedCoin({
      id: 'c_names', name: '无名者档案', symbol: 'NAMES', tagline: '名字被夺走的人，自己写回自己的名字。', shareToHolders: true,
      creator: '白鹭', creatorAddr: '0x33A1…c8f0', cover: IMG.names, video: 'video/凤骨琉璃.mp4', sourceType: 'work', sourceTitle: '短剧《无名者档案》',
      priceUsd: 0.00055, holders: 1732, volumeUsd: 67100, launchedAt: D(66), graduated: true, gradAt: D(49),
      poolUsd: 20300, change24h: 0.11, lastBuyAt: D(30), spark: [0.2, 0.3, 0.5, 0.55, 0.8, 0.75],
      social: { x: 'wuming_archives', tg: 'wuming_archives' }
    }),
    seedCoin({
      id: 'c_pyramid', name: '金字塔之梦', symbol: 'PYRAMID', tagline: '梦境深处，法老仍在等待。',
      creator: 'Ramesh', creatorAddr: '0xF90C…d2e8', cover: IMG.pyramid, video: 'video/我卸甲后天下大乱了.mp4', sourceType: 'ai', sourceTitle: 'AI 叙事 · 15s',
      priceUsd: 0.000078, holders: 501, volumeUsd: 8900, launchedAt: D(1), graduated: false, progress: 0.03,
      poolUsd: 190, change24h: 0.15, isNew: true, lastBuyAt: D(0.4), spark: [0.4, 0.45],
      social: { x: '', tg: 'pyramid_dreams' }
    }),
    seedCoin({
      id: 'c_hero', name: '孤胆英雄传', symbol: 'HERO', tagline: '无人记得的名字，撑起整座城。', shareToHolders: true,
      creator: '陈破晓', creatorAddr: '0x6E2b…a4d7', cover: IMG.hero, video: VID.fight, sourceType: 'work', sourceTitle: '短剧《孤胆英雄传》',
      priceUsd: 0.00041, holders: 958, volumeUsd: 24000, launchedAt: D(18), graduated: false, progress: 0.42,
      poolUsd: 4800, change24h: -0.08, lastBuyAt: D(14), spark: [0.4, 0.6, 0.5, 0.55, 0.48, 0.45],
      social: { x: 'hero_liulang', tg: 'hero_liulang' }
    })
  ];

  // ============================================================
  //  批量模拟数据：Explore 分页（50/页）与 Graduated（10/页）
  //  为展示分页器生成足量确定性伪币，id/symbol/名称均唯一稳定
  // ============================================================
  (function () {
    var NAMES = [
      ['Quantum','Nebula','Turbo','Lunar','Cosmic','Neon','Crypto','Mega','Hyper','Rocket','Astro','Solar','Pixel','Cyber','Zen','Golden','Storm','Frost','Ember','Nova','Vapor','Orbit','Prism','Echo','Apex'],
      ['Cat','Dog','Frog','Duck','Wolf','Fox','Panda','Whale','Dragon','Phoenix','Raven','Otter','Bunny','Koala','Yeti','Moose','Shark','Lynx','Hawk','Wombat','Mantis','Tiger','Owl','Crab','Lion']
    ];
    var COVERS = [IMG.feng, IMG.cheng, IMG.xie, IMG.allin, IMG.candle, IMG.names, IMG.pyramid, IMG.survivor, IMG.zero, IMG.hero];
    var TAGLINES = ['故事开始前，价格先起步。','把名字写回历史。','天亮前的一笔。','一个人的孤勇。','梦醒之前的赌注。','守住最后的光。','风向变了。','曲线之上是新的曲线。','谁先燃尽，谁先封神。','没有人记得，不代表没有发生。'];
    var usedSym = {};
    SEED.forEach(function (c) { usedSym[c.symbol] = true; });
    // 打散序号 → 唯一名组合：j 以 257 步进遍历 0..624（与 625 互质），A/B 双词表共 625 种组合
    function nm(i0) {
      var j = (257 * (i0 + 13)) % 625;
      return { A: NAMES[0][j % 25], B: NAMES[1][Math.floor(j / 25) % 25] };
    }
    // gen 参数：count、毕业比例、ID 前缀
    function gen(count, gradShare, i0) {
      for (var n = 0; n < count; n++, i0++) {
        var nb = nm(i0);
        var A = nb.A, B = nb.B;
        var baseSym = (A.slice(0, 3) + B.slice(0, 3)).toUpperCase();
        var sym = baseSym;
        var k = 1;
        while (usedSym[sym]) sym = baseSym + k++;
        usedSym[sym] = true;
        var graduated = (i0 % 100) < gradShare;
        var launchH = graduated ? (2 + (i0 * 13) % 2880) : (0.1 + (i0 * 7) % 720); // 发行于 N 小时前
        var isNew = !graduated && launchH < 20;
        // 毕业发生在发行之后（gradH < launchH）；池内最近成交在毕业之后（lastH < gradH）
        var gradH = graduated ? Math.max(0.5, launchH * (0.4 + ((i0 * 11) % 50) / 100)) : null;
        var lastH = graduated
          ? Math.max(0.05, gradH * (0.1 + ((i0 * 7) % 80) / 100))
          : Math.min((i0 % 48) * 0.05, Math.max(0.02, launchH * 0.9));
        var mc = graduated
          ? (2 + (i0 * 37) % 900) * 1e6           // FDV 目标 $2M–$900M+
          : (1 + (i0 * 53) % 900) * 1000;          // FDV 目标 $1K–$900K
        // 锁定比例：已毕业更常见锁仓（团队/预留），活跃币少数带锁
        var lockedPct = graduated
          ? ((i0 * 7) % 5 === 0 ? (10 + (i0 % 26)) / 100 : 0)   // 约 1/5 已毕业带 10–35% 锁
          : ((i0 * 11) % 9 === 0 ? (5 + (i0 % 15)) / 100 : 0);  // 约 1/9 活跃带 5–19% 锁
        // 收益共享（Creator rewards → holders）：毕业/活跃都会出现（pons 两区均有该徽章）
        var shareToHolders = ((i0 * 13) % 7) < 2;               // 约 2/7 开启费共享
        // 创建者持仓占比：约 1/8 币 >20%（触发左上角警示）
        var creatorHoldsPct = ((i0 * 17) % 8) === 0
          ? 22 + (i0 % 45)                                       // 22–66%
          : 1 + (i0 % 18);                                       // 1–18%（正常区间）
        // OG：约 1/6 币视为本名首次发行（毕业/活跃均可能）；buyback：约 1/10 有回购锁仓
        var isOriginal = ((i0 * 19) % 6) === 0;
        var buybackLockedPct = ((i0 * 23) % 10) === 0 ? (3 + (i0 % 15)) / 100 : null;
        var price = mc / K.totalSupply;
        var pool = graduated
          ? (K.gradThresholdUsd + (i0 * 29) % 400000)
          : Math.max((K.gradThresholdUsd * (0.02 + (i0 * 11) % 90) / 100), 200);
        SEED.push(seedCoin({
          id: 'gen_' + i0, name: A + ' ' + B, symbol: sym,
          tagline: TAGLINES[(i0 * 13 + 5) % TAGLINES.length],
          creator: 'Creator' + (i0 % 97), creatorAddr: walletFrom('genc:' + i0),
          cover: COVERS[i0 % COVERS.length],
          video: (i0 % 4 === 3 ? '' : ['video/凤骨琉璃.mp4','video/丞相府今日开饭.mp4','video/打斗视频.mp4','video/我卸甲后天下大乱了.mp4'][i0 % 4]),
          sourceType: (i0 % 3 === 0 ? 'ai' : 'work'),
          sourceTitle: '', supply: K.totalSupply,
          social: (function () {
            var slug = (A + B).toLowerCase();
            var sn = i0 % 5;
            if (sn === 0 || sn === 1) return { x: slug.slice(0, 15), tg: slug.slice(0, 32) };
            if (sn === 2) return { x: slug.slice(0, 15) };
            if (sn === 3) return { tg: slug.slice(0, 32) };
            return null;
          })(),
          pair: pairOf('gen_' + i0),   // 确定性随机配对资产（含约 1/5 ETH）
          lockedPct: lockedPct,
          shareToHolders: shareToHolders,
          creatorHoldsPct: creatorHoldsPct,
          isOriginal: isOriginal,
          buybackLockedPct: buybackLockedPct,
          priceUsd: price, holders: graduated ? (200 + (i0 * 47) % 9000) : (2 + (i0 * 19) % 600),
          volumeUsd: graduated ? (100000 + (i0 * 911) % 9000000) : (i0 * 97) % 50000,
          // 部分冷门活跃币近 24h 无成交（演示 Volume+24h 窗口过滤）
          vol24hUsd: (!graduated && (i0 * 29) % 8 === 0) ? 0 : undefined,
          launchedAt: D(launchH), graduated: graduated, gradAt: graduated ? D(gradH) : null,
          poolUsd: pool, change24h: ((i0 * 7) % 100) / 100 - 0.3,
          isNew: isNew, lastBuyAt: D(lastH),
          spark: [0.3, 0.5, 0.4, 0.6, 0.5, 0.7, 0.6, 0.8, 0.9]
        }));
      }
    }
    // 名字组合上限 625（25×25）：Graduated 160（16 页 ×10）+ Explore 460（9.2 页 ×50）→ 全唯一
    gen(160, 100, 9000);   // 160 个已毕业（9000–9159）
    gen(460, 0, 9160);     // 460 个活跃（9160–9619），与上段连续 → 620 个唯一名
  })();

  // ============================================================
  //  存储
  // ============================================================
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) { var s = JSON.parse(raw); if (s && s.user) return s; }
    } catch (e) {}
    return null;
  }
  var persisted = load();
  // 版本一致才恢复 coins（避免旧缓存种子缺新字段）；user 始终恢复
  if (persisted) {
    USER = persisted.user;
    if (persisted.v === SCHEMA_VERSION && Array.isArray(persisted.coins) && persisted.coins.length) {
      SEED = persisted.coins;
    }
  }
  // 旧存档迁移：补齐已实现盈亏字段
  USER.realizedPnl = USER.realizedPnl || 0;
  USER.realizedByCoin = USER.realizedByCoin || {};
  USER.closed = USER.closed || [];   // Closed positions（完整退出记录，pons History）

  // ============================================================
  //  演示钱包：各计价/支付资产余额（开发者预买/水龙头/交易用）
  //  ETH 双字段锁定：USER.eth（旧 UI 读取）== balances.ETH（权威）
  // ============================================================
  var DEFAULT_CREDIT_USD = 500; // 兜底额度（ETH 例外：沿用旧 2.5 ETH）
  // 差异化演示额度：按符号确定性分档（各资产金额不同、均非零），避免列表里 44 行金额一模一样
  var SEED_USD_BUCKETS = [30, 75, 160, 320, 560, 880];
  // 演示用灰尘余额：固定 8 个资产（不含 ETH）给 $1 以下余额，便于走查「隐藏 $1 以下资产」
  var SEED_DUST_COUNT = 8;
  var SEED_DUST_USD = [0.18, 0.32, 0.45, 0.58, 0.66, 0.74, 0.83, 0.95];
  var SEED_DUST_SET = (function () {
    var syms = ALL_ASSETS.filter(function (x) { return x !== 'ETH'; });
    syms.sort(function (a, b) { return hashStr('dust:' + a) - hashStr('dust:' + b); });
    var set = {};
    for (var i = 0; i < Math.min(SEED_DUST_COUNT, syms.length); i++) {
      set[syms[i]] = SEED_DUST_USD[i % SEED_DUST_USD.length];
    }
    return set;
  })();
  function seedUsd(sym) {
    if (SEED_DUST_SET[sym] != null) return SEED_DUST_SET[sym];
    return SEED_USD_BUCKETS[hashStr('seed:' + sym) % SEED_USD_BUCKETS.length];
  }
  var FAUCET_USD = 250;         // 每次领取等值 250 美元
  function assetPrice(sym) { return (sym && ASSET_PRICES[sym] != null) ? ASSET_PRICES[sym] : null; }
  // 计价资产分组（钱包面板用：加密 4 种 + 股票 40 种）
  function quoteGroups() {
    return [
      { g: '加密资产', rows: ['ETH', 'WETH', 'USDG', 'cbBTC'] },
      { g: '股票', rows: PAIR_STOCKS.slice() }
    ];
  }
  // 资产友好名称（股票用代码本身）
  // 计价资产全称（单一来源：资产面板 / 创建页配对下拉共用；与创建页原表一致）
  var ASSET_NAMES = {
      ETH: 'Ether', AAPL: 'Apple', AMD: 'Advanced Micro Devices', AMZN: 'Amazon',
      BB: 'BlackBerry', COIN: 'Coinbase', COST: 'Costco', CRCL: 'Circle Internet Group',
      DELL: 'Dell Technologies', DJT: 'Trump Media & Technology Group', FIG: 'Figma',
      GLD: 'SPDR Gold Shares', GME: 'GameStop', GOOGL: 'Alphabet Class A',
      HIMS: 'Hims & Hers Health', JNJ: 'Johnson & Johnson', LLY: 'Eli Lilly',
      LULU: 'Lululemon Athletica', META: 'Meta Platforms', MRNA: 'Moderna',
      MRVL: 'Marvell Technology', MSFT: 'Microsoft', MSTR: 'Strategy',
      MU: 'Micron Technology', NVDA: 'NVIDIA', PFE: 'Pfizer', PLTR: 'Palantir Technologies',
      QQQ: 'Invesco QQQ', RBLX: 'Roblox', RDDT: 'Reddit', RIVN: 'Rivian Automotive',
      SKHY: 'SK hynix', SNAP: 'Snap', SNDK: 'SanDisk', SPCX: 'SpaceX Class A',
      SPY: 'SPDR S&P 500 ETF', TSLA: 'Tesla', TSM: 'Taiwan Semiconductor Manufacturing',
      TTWO: 'Take-Two Interactive', USO: 'United States Oil Fund', WYFI: 'WhiteFiber',
      WETH: 'Wrapped Ether', USDG: 'USD Global', cbBTC: 'Coinbase Wrapped BTC'
      };
  function assetName(sym) { return ASSET_NAMES[sym] || sym; }
  // 合约地址：原生 ETH 无合约（返回空），其余给确定性演示地址
  function assetContract(sym) {
    if (!sym || sym === 'ETH') return '';
    var h1 = hashStr('contract:' + sym), hex = '';
    for (var i = 0; i < 40; i++) { h1 = (Math.imul(h1 ^ (h1 >>> 11), 2654435761) >>> 0); hex += '0123456789abcdef'.charAt(h1 & 15); }
    return '0x' + hex;
  }
  // 币合约地址（全量 40 位）：按币 id 确定性生成，行情搜索与详情页共用同一来源
  function coinContract(id) {
    var seed = 'token:' + (id || 'x'), h = 2166136261 >>> 0, hex = '';
    for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    for (var j = 0; j < 40; j++) { h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0; hex += '0123456789abcdef'.charAt(h & 15); }
    return '0x' + hex;
  }
  // 钱包总览：Σ 计价资产 USD、非零资产数、全部资产数
  function walletSummary() {
    ensureBalances();
    var total = 0, held = 0;
    ALL_ASSETS.forEach(function (sym) {
      var q = USER.balances[sym] || 0;
      var px = assetPrice(sym);
      if (q > 0 && px) { total += q * px; held += 1; }
    });
    return { totalUsd: total, heldCount: held, allCount: ALL_ASSETS.length };
  }
  function ensureBalances() {
    if (!USER.balances) USER.balances = {};
    // 旧档迁移：首见 ETH 时沿用旧 USER.eth（默认 2.5），避免余额跳水；
    // 若两者都曾有记录，取更大者（旧版交易走 USER.eth、新版走 balances.ETH，可能分叉）
    if (USER.balances.ETH == null && USER.eth != null && USER.eth > 0) USER.balances.ETH = USER.eth;
    else if (USER.balances.ETH != null && USER.eth != null && USER.eth > USER.balances.ETH) USER.balances.ETH = USER.eth;
    for (var i = 0; i < ALL_ASSETS.length; i++) {
      var s = ALL_ASSETS[i];
      if (USER.balances[s] == null) {
        var px = assetPrice(s);
        USER.balances[s] = px ? seedUsd(s) / px : 0;
      }
    }
    USER.eth = USER.balances.ETH; // ETH 锁定镜像
  }
  ensureBalances();
  function balanceOf(sym) { ensureBalances(); return USER.balances[sym] || 0; }
  // 加/扣资产余额（ETH 时同步 USER.eth 镜像）
  function credit(sym, qty) {
    if (!(qty > 0)) return;
    ensureBalances();
    USER.balances[sym] = (USER.balances[sym] || 0) + qty;
    if (sym === 'ETH') USER.eth = USER.balances.ETH;
  }
  // 模拟水龙头：领取等值 FAUCET_USD 的指定资产，返回领取数量（单位）
  function faucet(sym) {
    ensureBalances();
    var px = assetPrice(sym);
    var amt = px ? FAUCET_USD / px : 0;
    USER.balances[sym] = (USER.balances[sym] || 0) + amt;
    if (sym === 'ETH') USER.eth = USER.balances.ETH;
    persist();
    return amt;
  }

  // ---- quote / 折算 / 展示 ----
  // 资产数量 ↔ USD（内部统一 USD 记账；价格与毕业按配对资产计价展示）
  function usdOfQty(q, sym) { var p = assetPrice(sym); return p ? q * p : q; }
  function qtyOfUsd(u, sym) { var p = assetPrice(sym); return p ? u / p : u; }
  // 各资产的展示图标/前缀
  function assetIcon(sym) {
    if (sym === 'ETH' || sym === 'WETH') return 'Ξ';
    if (sym === 'USDG') return '$';
    if (sym === 'cbBTC') return '₿';
    return '$';
  }
  // 支付候选资产（顺序：加密优先 + 股票）；币的计价始终是其配对资产
  function payAssets() { return ['ETH', 'WETH', 'USDG', 'cbBTC'].concat(PAIR_STOCKS); }
  // 自适应小数（不带货币符号）
  function fmtQty(q) {
    if (q == null || isNaN(q)) return '—';
    var a = Math.abs(q);
    var s;
    if (a >= 1e6) s = (q / 1e6).toFixed(2) + 'M';
    else if (a >= 1e3) s = (q / 1e3).toFixed(2) + 'K';
    else if (a >= 1) s = q.toFixed(4);
    else if (a >= 1e-4) s = q.toFixed(8);
    else s = q.toFixed(12);
    s = s.replace(/\.?0+$/, '');
    return (s === '' || s === '-' || s === '.') ? '0' : s;
  }

  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ v: SCHEMA_VERSION, user: USER, coins: SEED }));
    } catch (e) {}
  }
  // 登录态联动：auth.js 若已登录，保持同一 userId（演示简化，不强制）
  function syncUser() {
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.id) {
      USER.id = 'u_' + currentUser.id;
    }
  }
  syncUser();
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('auth-ready', syncUser);
  }

  // ============================================================
  //  工具
  // ============================================================
  function coinById(id) {
    for (var i = 0; i < SEED.length; i++) if (SEED[i].id === id) return SEED[i];
    return null;
  }
  // 最热币（确定性）：成交量降序，并列取较新发行 —— 供“交易”tab 无 id 时的默认盘口
  function topCoin() {
    var best = null;
    for (var i = 0; i < SEED.length; i++) {
      var c = SEED[i];
      if (!c) continue;
      var v = c.volumeUsd || 0;
      if (!best || v > (best.volumeUsd || 0) ||
          (v === (best.volumeUsd || 0) && (c.launchedAt || 0) > (best.launchedAt || 0))) best = c;
    }
    return best || SEED[0] || null;
  }
  function fmtPrice(u) {
    if (u == null || isNaN(u)) return '—';
    if (u >= 1) return '$' + u.toFixed(2);
    if (u >= 0.01) return '$' + u.toFixed(3);
    if (u >= 0.0001) return '$' + u.toFixed(6);
    // 极小价格：固定 10 位小数并去掉尾零
    var s = u.toFixed(10).replace(/0+$/, '');
    if (s.charAt(s.length - 1) === '.') s = s.slice(0, -1);
    return '$' + s;
  }
  function fmtUsd(u) {
    if (u == null) return '—';
    if (u >= 1000000) return '$' + (u / 1000000).toFixed(1) + 'M';
    if (u >= 1000) return '$' + (u / 1000).toFixed(1) + 'K';
    if (u >= 1) return '$' + u.toFixed(2);
    return '$' + u.toFixed(2);
  }
  function fmtNum(n) {
    if (n == null) return '—';
    return n.toLocaleString('en-US');
  }
  function fmtEth(eth) { return eth.toFixed(4) + ' ETH'; }
  function pct(n) {
    var p = (n * 100);
    return (p >= 0 ? '+' : '') + (p >= 10 || p <= -10 ? p.toFixed(0) : p.toFixed(1)) + '%';
  }
  function timeAgo(ts) {
    var s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60); if (m < 60) return m + 'm';
    var h = Math.floor(m / 60); if (h < 24) return h + 'h';
    var d = Math.floor(h / 24); return d + 'd';
  }
  function shortAddr(a) { return a || '—'; }
  function walletFrom(seed) {
    var h = 2166136261;
    for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var hex = ('00000000' + (h >>> 0).toString(16)).slice(-8).toUpperCase();
    return '0x' + hex.slice(0, 2) + hex.slice(2, 4).toLowerCase() + '…' + hex.slice(4, 6).toLowerCase() + hex.slice(6, 8).toUpperCase();
  }
  // 创建者完整地址（收款人默认值）：同一账户永远同一串
  function fullWallet(seed) {
    var h = 2166136261, i;
    for (i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var hex = '';
    for (i = 0; i < 40; i++) { h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0; hex += '0123456789abcdef'.charAt(h & 15); }
    return '0x' + hex;
  }
  function usdToEth(u) { return u / K.ETH_USD; }
  function ethToUsd(e) { return e * K.ETH_USD; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  // 涨跌色
  function dirClass(n) { return n >= 0 ? 'up' : 'down'; }
  function dirSign(n) { return n >= 0 ? '+' : '-'; }

  // ============================================================
  //  Toast（自绘，无浏览器弹窗）
  // ============================================================
  var toastTimer = null;
  function toast(msg, type) {
    type = type || 'ok'; // ok | err | warn
    var host = document.getElementById('launch-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'launch-toast-host';
      host.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;';
      document.body.appendChild(host);
    }
    var el = document.createElement('div');
    el.style.cssText =
      'min-width:220px;max-width:420px;padding:12px 18px;border-radius:14px;background:#0A0B0D;color:#fff;' +
      'font-size:13px;font-weight:500;line-height:1.5;box-shadow:0 10px 30px rgba(0,0,0,.18);' +
      'opacity:0;transform:translateY(-8px);transition:all .25s ease;text-align:center;';
    if (type === 'err') el.style.background = '#1C1012';
    if (type === 'warn') el.style.background = '#1A1608';
    el.textContent = msg;
    host.appendChild(el);
    requestAnimationFrame(function () { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    setTimeout(function () {
      el.style.opacity = '0'; el.style.transform = 'translateY(-8px)';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    }, 2600);
  }

  // ============================================================
  //  Curve / 价格规则引擎
  //  简化 AMM：价格随池内资金单调上升（买入推价、卖出压价）
  //  progress ≈ 池额/毕业阈值，price = p0 × (1 + K × progress)
  // ============================================================
  function progressOf(coin) {
    if (coin.graduated) return 1;
    var t = coin.gradThresholdUsd || K.gradThresholdUsd;
    return clamp((coin.poolUsd || 0) / t, 0.001, 1);
  }
  function priceAt(coin) {
    if (coin.graduated) return coin.priceUsd; // 毕业后按池现价
    var p0 = coin.p0 || (coin.priceUsd / (1 + K.curveK * progressOf(coin)));
    return p0 * (1 + K.curveK * progressOf(coin));
  }
  // 毕业时的理论价格（curve 售罄）
  function priceAtGraduation(coin) {
    if (coin.graduated) return coin.priceUsd;
    var p0 = coin.p0 || (coin.priceUsd / (1 + K.curveK * progressOf(coin)));
    return p0 * (1 + K.curveK);
  }
  // 买入：ethInUsd → 获得币数，推进池额
  function buy(coinId, ethInUsd) {
    var c = coinById(coinId);
    if (!c) return { ok: false, msg: '币不存在' };
    if (c.graduated) return { ok: false, msg: '已毕业，请在池中交易' };
    if (ethInUsd <= 0) return { ok: false, msg: '金额无效' };
    var fee = ethInUsd * K.feeRate;
    var net = ethInUsd - fee;
    var pNow = priceAt(c);
    var p0 = c.p0 || (pNow / (1 + K.curveK * progressOf(c)));
    var poolAfter = (c.poolUsd || 0) + net;
    var pAfter = p0 * (1 + K.curveK * clamp(poolAfter / (c.gradThresholdUsd || K.gradThresholdUsd), 0.001, 1));
    var avgP = (pNow + pAfter) / 2;
    var coins = net / Math.max(avgP, 1e-12);
    // 更新
    c.poolUsd = poolAfter;
    c.progress = progressOf(c);
    c.priceUsd = priceAt(c);
    c.marketCap = c.priceUsd * (c.circulating || c.supply);
    c.fdv = c.priceUsd * c.supply;
    c.volumeUsd = (c.volumeUsd || 0) + net;
    c.lastBuyAt = Date.now();
    c.buyerAddr = userWalletAddr();
    c.holders = (c.holders || 1) + Math.floor(Math.random() * 2);
    if (typeof c.spark === 'undefined') c.spark = [];
    c.spark.push(c.progress);
    if (c.spark.length > 40) c.spark.shift();
    // 费用：creator 与 protocol
    addFee(c, fee);
    addTx(c, 'buy', ethInUsd, net, coins, '我');
    // 毕业检测
    var grad = tryGraduate(c);
    persist();
    return { ok: true, coins: coins, fee: fee, net: net, avgP: avgP, graduated: grad, impact: net / Math.max((c.poolUsd - net) || 100, 100) };
  }
  // 卖出：卖出 coins → 得到 usd（curve 与毕业池统一：扣持仓 + 结算已实现盈亏）
  function sell(coinId, coins) {
    var c = coinById(coinId);
    if (!c) return { ok: false, msg: '币不存在' };
    var h = USER.holdings[coinId];
    if (!h || h.amount < 1) return { ok: false, msg: '无持仓' };
    if (coins > h.amount) coins = h.amount;
    var graduated = !!c.graduated;
    var pNow = graduated ? c.priceUsd : priceAt(c);
    var gross = coins * pNow;
    var fee = gross * K.feeRate;
    var net = gross - fee;
    if (!graduated) {
      // curve：池内资金防线（防归零超卖）
      if (gross > (c.poolUsd || 0)) {
        coins = (c.poolUsd || 0) / Math.max(pNow, 1e-12);
        gross = coins * pNow;
        fee = gross * K.feeRate;
        net = gross - fee;
      }
      c.poolUsd = Math.max(0, (c.poolUsd || 0) - gross);
      c.progress = progressOf(c);
      c.priceUsd = priceAt(c);
    } else {
      // 池内：价格微幅下行 + 噪声
      var wiggle = -(0.004 + Math.random() * 0.02);
      c.priceUsd = Math.max(c.priceUsd * (1 + wiggle), 1e-10);
    }
    c.marketCap = c.priceUsd * (c.circulating || c.supply);
    c.fdv = c.priceUsd * c.supply;
    c.volumeUsd = (c.volumeUsd || 0) + gross;
    if (typeof c.spark === 'undefined') c.spark = [];
    c.spark.push(graduated ? 1 : c.progress);
    if (c.spark.length > 40) c.spark.shift();
    // 已实现盈亏 = 卖出净得 − 卖出币数 × 平均成本（成本含费口径）
    var realized = net - coins * (h.avgUsd || 0);
    USER.realizedPnl = (USER.realizedPnl || 0) + realized;
    USER.realizedByCoin[coinId] = (USER.realizedByCoin[coinId] || 0) + realized;
    // 扣持仓
    var prevAvgPx = h.avgUsd || 0;
    var wasHeld = h.amount;
    h.amount -= coins;
    if (h.amount < 0.000001) delete USER.holdings[coinId];
    addFee(c, fee);
    addTx(c, 'sell', gross, net, coins, '我');
    if (USER.tx.length) USER.tx[0].realizedUsd = realized; // 供资产页逐笔标记
    // 完整退出 → 记录 Closed position（pons History: fully exited with realized PnL）
    if (wasHeld > 0 && h.amount < 0.000001) {
      if (!USER.closed) USER.closed = [];
      var prevCyc = 0, lastExit = 0;
      USER.closed.forEach(function (r) {
        if (r.coinId === coinId) {
          prevCyc += r.realizedPnlUsd || 0;
          if ((r.exitAt || 0) > lastExit) lastExit = r.exitAt;
        }
      });
      var cycRealized = (USER.realizedByCoin[coinId] || 0) - prevCyc;
      var buysN = 0, buysNet = 0, sellsN = 0;
      (USER.tx || []).forEach(function (t) {
        if (t.coinId !== coinId || (t.at || 0) <= lastExit) return;
        if (t.side === 'buy') { buysN++; buysNet += t.netUsd || t.grossUsd || 0; }
        else if (t.side === 'sell') sellsN++;
      });
      var entryMcapUsd = c.marketCap
        ? (c.marketCap * prevAvgPx / Math.max(c.priceUsd, 1e-12)) : 0;
      var pnlPct = buysNet > 0 ? (cycRealized / buysNet) * 100 : 0;
      USER.closed.unshift({
        coinId: coinId, name: c.name, symbol: c.symbol, state: 'closed',
        entryMcapUsd: entryMcapUsd, investedUsd: buysNet,
        realizedPnlUsd: cycRealized, totalPnlUsd: cycRealized, totalPnlPct: pnlPct,
        buys: buysN, sells: sellsN, exitAt: Date.now()
      });
      if (USER.closed.length > 40) USER.closed.pop();
    }
    persist();
    return { ok: true, proceedsUsd: net, fee: fee, coins: coins, realizedUsd: realized };
  }
  function addFee(coin, feeUsd) {
    if (USER.created.indexOf(coin.id) !== -1) {
      // 创作者税（创建页设置的额外比例）归创作者；若开启共享则进入持有者分红池
      var taxShare = coin.creatorTaxPct ? (feeUsd * 0.01 * coin.creatorTaxPct) : 0;
      var baseShare = feeUsd * K.creatorShare;
      if (coin.shareToHolders) {
        // 共享模式：基础分成与税均进入持有者分红（原型从简：计入 claimable，由"持有者"身份领取演示）
        USER.claimable[coin.id] = (USER.claimable[coin.id] || 0) + baseShare * 0.5 + taxShare;
      } else {
        USER.claimable[coin.id] = (USER.claimable[coin.id] || 0) + baseShare + taxShare;
      }
    }
    // 协议侧（buyback）— 演示不展开
  }
  function addTx(coin, side, grossUsd, netUsd, amount, who) {
    USER.tx.unshift({
      at: Date.now(), coinId: coin.id, symbol: coin.symbol, side: side,
      grossUsd: grossUsd, netUsd: netUsd, amount: amount, who: who
    });
    if (USER.tx.length > 60) USER.tx.pop();
  }
  function tryGraduate(coin) {
    if (coin.graduated) return false;
    var threshold = coin.gradThresholdUsd || K.gradThresholdUsd;
    if ((coin.poolUsd || 0) >= threshold || coin.progress >= 1) {
      coin.graduated = true;
      coin.gradAt = Date.now();
      coin.progress = 1;
      coin.poolUsd = Math.max(coin.poolUsd || 0, threshold);
      return true;
    }
    return false;
  }

  // 交易（毕业池内：按现价成交 + 轻微随机波动模拟自由市场）
  function tradePool(coinId, side, ethUsd) {
    var c = coinById(coinId);
    if (!c) return { ok: false, msg: '币不存在' };
    var fee = ethUsd * K.feeRate;
    var net = ethUsd - fee;
    var coins = net / Math.max(c.priceUsd, 1e-9);
    // 价格微幅波动（方向偏向成交方向 + 噪声）
    var dir = side === 'buy' ? 1 : -1;
    var wiggle = dir * (0.004 + Math.random() * 0.02);
    c.priceUsd = Math.max(c.priceUsd * (1 + wiggle), 1e-10);
    c.marketCap = c.priceUsd * (c.circulating || c.supply);
    c.fdv = c.priceUsd * c.supply;
    c.volumeUsd = (c.volumeUsd || 0) + net;
    if (side === 'buy') { c.lastBuyAt = Date.now(); c.buyerAddr = userWalletAddr(); }
    c.holders = (c.holders || 1) + Math.floor(Math.random() * 2);
    if (typeof c.spark === 'undefined') c.spark = [];
    c.spark.push(1);
    if (c.spark.length > 40) c.spark.shift();
    if (side === 'buy') {
      addFee(c, fee);
      addTx(c, 'buy', ethUsd, net, coins, '我');
    } else {
      addFee(c, fee);
      addTx(c, 'sell', ethUsd, net, coins, '我');
    }
    persist();
    return { ok: true, coins: coins, fee: fee, proceedsUsd: net };
  }

  // 纯预览（不落盘/不改价）：返回按配对资产计价的估算
  //  buy: amt = 支付资产数量(paySym, 默认=币的配对资产)；sell: amt = 币数量
  function preview(coinId, side, amt, paySym) {
    var c = coinById(coinId);
    if (!c) return { ok: false, msg: '币不存在' };
    var quote = c.pair || 'ETH';
    var out = { ok: true, pair: quote, priceUsd: c.priceUsd, priceQty: qtyOfUsd(c.priceUsd, quote), quotePx: assetPrice(quote) };
    if (!(amt > 0)) { out.zero = true; return out; }
    if (side === 'buy') {
      paySym = paySym || quote;
      var ppx = assetPrice(paySym);
      if (!ppx) return { ok: false, msg: '不支持的支付资产' };
      var usd = amt * ppx;
      var net = usd * (1 - K.feeRate);
      var pNow = c.graduated ? c.priceUsd : priceAt(c);
      var coins;
      if (c.graduated) coins = net / Math.max(pNow, 1e-9);
      else {
        var p0 = c.p0 || (pNow / (1 + K.curveK * progressOf(c)));
        var poolAfter = (c.poolUsd || 0) + net;
        var pAfter = p0 * (1 + K.curveK * clamp(poolAfter / (c.gradThresholdUsd || K.gradThresholdUsd), 0.001, 1));
        coins = net / Math.max((pNow + pAfter) / 2, 1e-12);
      }
      out.paySym = paySym;
      out.usd = usd;
      out.coins = coins;
      out.feeQty = qtyOfUsd(usd * K.feeRate, paySym);
      out.balanceOk = (USER.balances[paySym] || 0) + 1e-9 >= amt;
      out.balance = USER.balances[paySym] || 0;
      out.impact = Math.min(3, usd / Math.max((c.poolUsd || 0) + 100, 100));
    } else {
      // 卖出：按现价折算（curve 受池内资金防线约束），净得按配对资产结算
      var h = USER.holdings[coinId];
      var toSell = h ? Math.min(amt, h.amount) : 0;
      var pNow2 = c.graduated ? c.priceUsd : priceAt(c);
      var gross = toSell * pNow2;
      if (!c.graduated && gross > (c.poolUsd || 0)) {
        toSell = (c.poolUsd || 0) / Math.max(pNow2, 1e-12);
        gross = toSell * pNow2;
      }
      var netUsd = gross * (1 - K.feeRate);
      out.sellable = toSell;
      out.held = h ? h.amount : 0;
      out.grossUsd = gross;
      out.proceedsUsd = netUsd;
      out.coins = toSell;
      out.proceedsQty = qtyOfUsd(netUsd, quote);
      out.impact = Math.min(3, gross / Math.max((c.poolUsd || 0) + 100, 100));
    }
    return out;
  }

  // 交易入口：买卖一律按币的配对资产（quote）结算；买入可用任一受支持资产支付（自动折算）
  function swap(coinId, side, amt, paySym) {
    if (!isLoggedIn()) return { ok: false, msg: 'need_login' };
    if (!(amt > 0)) return { ok: false, msg: '金额无效' };
    var c = coinById(coinId);
    if (!c) return { ok: false, msg: '币不存在' };
    var quote = c.pair || 'ETH';
    ensureBalances();
    if (side === 'buy') {
      paySym = paySym || quote;
      var ppx = assetPrice(paySym);
      if (!ppx) return { ok: false, msg: '不支持的支付资产' };
      if ((USER.balances[paySym] || 0) < amt - 1e-9) return { ok: false, msg: paySym + ' 余额不足' };
      var usd = amt * ppx;
      var r = c.graduated ? tradePool(coinId, 'buy', usd) : buy(coinId, usd);
      if (!r.ok) return r;
      USER.balances[paySym] -= amt;
      if (paySym === 'ETH') USER.eth = USER.balances.ETH;
      var feeUsd = r.fee || (usd * K.feeRate);
      var netUsd = usd - feeUsd;
      var h = USER.holdings[coinId] || { amount: 0, avgUsd: 0 };
      var totalAmt = h.amount + r.coins;
      h.avgUsd = totalAmt > 0 ? (h.avgUsd * h.amount + netUsd) / totalAmt : netUsd;
      h.amount = totalAmt;
      USER.holdings[coinId] = h;
      persist();
      return { ok: true, coins: r.coins, usd: usd, paySym: paySym, pair: quote,
        priceQty: qtyOfUsd(c.priceUsd, quote), proceedsQty: qtyOfUsd(feeUsd, quote), graduated: !!r.graduated };
    }
    // sell：amt = 币数量
    var h0 = USER.holdings[coinId];
    if (!h0 || h0.amount < 1) return { ok: false, msg: '无持仓' };
    var toSell = Math.min(amt, h0.amount);
    var r2 = sell(coinId, toSell);
    if (!r2.ok) return r2;
    var proceedsUsd = r2.proceedsUsd || 0;
    USER.balances[quote] = (USER.balances[quote] || 0) + qtyOfUsd(proceedsUsd, quote);
    if (quote === 'ETH') USER.eth = USER.balances.ETH;
    persist();
    return { ok: true, coins: r2.coins, proceedsUsd: proceedsUsd, proceedsQty: qtyOfUsd(proceedsUsd, quote),
      pair: quote, priceQty: qtyOfUsd(c.priceUsd, quote), realizedUsd: r2.realizedUsd };
  }

  // 创建币
  function createCoin(data) {
    var id = 'c_' + Math.random().toString(36).slice(2, 9);
    var coin = seedCoin({
      id: id, name: data.name, symbol: (data.symbol || '').toUpperCase(),
      tagline: data.tagline || '', creator: data.creator || currentUserName(),
      creatorAddr: '0x' + Math.random().toString(16).slice(2, 6) + '…' + Math.random().toString(16).slice(2, 6),
      cover: data.cover || IMG.hero, video: data.video || '',
      sourceType: data.sourceType || 'ai', sourceTitle: data.sourceTitle || '',
      priceUsd: data.priceUsd || 0.0001, holders: 1, volumeUsd: 0,
      launchedAt: Date.now(), graduated: false, progress: 0.001, poolUsd: 0,
      change24h: 0, isNew: true, spark: [0.05],
      pair: data.pair || 'ETH',
      social: data.social || null,
      creatorTaxPct: data.creatorTaxPct || 0,
      shareToHolders: !!data.shareToHolders,
      creatorWallet: data.creatorWallet || fullWallet('user:' + (USER.id || 'demo')),
      devBuyEth: data.devBuyEth || 0,
      devBuyQty: data.devBuyQty || 0,
      devBuyPair: data.devBuyPair || 'ETH',
      snipeExempts: data.snipeExempts || []
    });
    // 开发者预买：从演示钱包扣减配对资产（防御：超出部分按余额封顶）
    ensureBalances();
    var dbQty = Number(data.devBuyQty != null ? data.devBuyQty : 0) || 0;
    var dbPair = data.devBuyPair || 'ETH';
    if (dbQty > 0) {
      var bal = USER.balances[dbPair] || 0;
      var use = Math.min(dbQty, bal);
      USER.balances[dbPair] = bal - use;
      coin.devBuyQty = use;
      if (dbPair === 'ETH') coin.devBuyEth = use;
    }
    // 发行费（ETH）
    ensureBalances();
    var feeEth = usdToEth(K.launchFeeUsd + (data.sourceType === 'ai' ? K.genFeeUsd : 0));
    USER.balances.ETH = Math.max(0, (USER.balances.ETH || 0) - feeEth);
    USER.eth = USER.balances.ETH;
    // 开发者预买 = 真实持仓（pons：随发射交易完成，随后可交易）
    if (dbQty > 0 && USER.holdings[coin.id]) { /* noop */ }
    if (dbQty > 0) {
      var hh = USER.holdings[coin.id] || { amount: 0, avgUsd: 0 };
      var costPx = coin.priceUsd || data.priceUsd || 0.0001;
      var totalAmt = hh.amount + dbQty;
      hh.avgUsd = totalAmt > 0 ? (hh.avgUsd * hh.amount + dbQty * costPx) / totalAmt : costPx;
      hh.amount = totalAmt;
      USER.holdings[coin.id] = hh;
      addTx(coin, 'buy', dbQty * costPx, dbQty * costPx, dbQty, '我');
    }
    SEED.unshift(coin);
    USER.created.unshift(id);
    persist();
    return coin;
  }
  function currentUserName() {
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.name) return currentUser.name;
    return '创作者';
  }
  // 当前用户钱包全量地址：统一取 auth.js 的单一地址来源，兜底用本地派生
  function userWalletAddr() {
    if (typeof window !== 'undefined' && window.currentWallet && typeof window.currentWallet.address === 'function') {
      return window.currentWallet.address();
    }
    return walletFrom('user:' + (USER && USER.id ? USER.id : 'demo'));
  }
  // 当前用户钱包（脱敏地址）：统一取 auth.js 的单一地址来源，兜底用本地派生
  function walletText() {
    if (typeof window !== 'undefined' && window.currentWallet && typeof window.currentWallet.masked === 'function') {
      return window.currentWallet.masked();
    }
    return walletFrom('user:' + (USER && USER.id ? USER.id : 'demo'));
  }
  function isLoggedIn() {
    return typeof currentUser !== 'undefined' && currentUser && currentUser.isLoggedIn;
  }
  // 领取创作者收益：按币的配对资产结算（pons：creator 以 quote 收款）
  function claim(coinId) {
    var v = USER.claimable[coinId] || 0;
    if (v <= 0) return { ok: false, msg: '暂无可领取收益' };
    var c = coinById(coinId);
    var quote = (c && c.pair) || 'ETH';
    ensureBalances();
    var qty = qtyOfUsd(v, quote);
    USER.balances[quote] = (USER.balances[quote] || 0) + qty;
    if (quote === 'ETH') USER.eth = USER.balances.ETH;
    USER.claimed[coinId] = (USER.claimed[coinId] || 0) + v;
    USER.claimable[coinId] = 0;
    persist();
    return { ok: true, usd: v, pair: quote, qty: qty };
  }

  // 关注 / 通知
  function toggleWatch(coinId) {
    var i = USER.watch.indexOf(coinId);
    if (i >= 0) USER.watch.splice(i, 1); else USER.watch.unshift(coinId);
    persist();
    return i < 0;
  }
  var notifications = [];
  function notifyGraduated(coin) {
    if (!coin) return;
    notifications.unshift({ at: Date.now(), kind: 'grad', coinId: coin.id, symbol: coin.symbol });
    if (notifications.length > 20) notifications.pop();
    persist();
  }
  function notifyBigTrade(coin, usd) {
    notifications.unshift({ at: Date.now(), kind: 'trade', coinId: coin.id, symbol: coin.symbol, usd: usd });
    if (notifications.length > 20) notifications.pop();
    persist();
  }

  // ============================================================
  //  Debug 面板辅助
  // ============================================================
  function setEth(v) { ensureBalances(); USER.balances.ETH = v; USER.eth = v; persist(); }
  function forceGraduate(id) { var c = coinById(id); if (!c) return false; c.graduated = true; c.progress = 1; c.gradAt = Date.now(); c.poolUsd = Math.max(c.poolUsd||0, c.gradThresholdUsd||K.gradThresholdUsd); notifyGraduated(c); persist(); return true; }
  function forceUngraduate(id) { var c = coinById(id); if (!c) return false; c.graduated = false; c.progress = 0.5; c.gradAt = null; persist(); return true; }
  function resetAll() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    location.reload();
  }
  function watchNotifCount() { return notifications.length; }

  // ============================================================
  //  Analytics 聚合
  // ============================================================
  function analytics(mode) {
    // mode: '24h' | 'all'
    var coins = SEED || [];
    var is24h = mode === '24h';
    var cutoff = is24h ? Date.now() - 86400000 : 0;
    var totalCap = 0, totalVol = 0, holdersTotal = 0, createdToday = 0;
    var graduatedToday = 0, graduations = [], newCoins = [];
    var recentTrades = [];
    coins.forEach(function (c) {
      totalCap += c.marketCap || 0;
      var vol = c.volumeUsd || 0;
      if (is24h) vol = Math.round(vol * 0.2); // 演示：24h 占总量的约 20%
      totalVol += vol;
      holdersTotal += c.holders || 0;
      if (c.launchedAt >= cutoff) { createdToday++; newCoins.push(c); }
      if (c.graduated && c.gradAt && c.gradAt >= cutoff) { graduatedToday++; }
      if (c.graduated) graduations.push(c);
    });
    // 发行趋势 + 交易量趋势（演示 mock：近 14 天）
    var DAYS = 14;
    var trend = [];
    var volTrend = [];
    var realTotalVol = coins.reduce(function (s, c) { return s + (c.volumeUsd || 0); }, 0);
    for (var d = DAYS - 1; d >= 0; d--) {
      var day = Date.now() - d * 86400000;
      var n = 0;
      coins.forEach(function (c) { if (c.launchedAt >= day && c.launchedAt < day + 86400000) n++; });
      // 用确定性伪随机补一点趋势（原型演示）
      n = Math.max(n, Math.round((d === DAYS - 1 ? 1 : 2) + Math.sin(d * 0.9) * 0.8 + 1));
      trend.push({ label: fmtDay(day), value: n });
      // 交易量：以平台总量按 14 天分配，近期温和抬升 + 波形（确定性，刷新不跳）
      var volBase = Math.max(realTotalVol, 4000) / DAYS;
      var lift = d < 3 ? (3 - d) * 0.25 : 0;            // 最近三天抬升
      var wave = 0.8 + Math.abs(Math.sin(d * 1.3)) * 0.6;
      volTrend.push({ label: fmtDay(day), value: Math.round(volBase * wave * (1 + lift)) });
    }
    graduations.sort(function (a, b) { return (b.gradAt || 0) - (a.gradAt || 0); });
    newCoins.sort(function (a, b) { return b.launchedAt - a.launchedAt; });
    // 交易历史（演示用 tx 池汇总）
    var txPool = USER.tx || [];
    recentTrades = txPool.slice(0, 8);
    return {
      totalCap: totalCap,
      totalVol: totalVol,
      holders: holdersTotal,
      launched: coins.length,
      createdToday: createdToday,
      graduatedToday: graduatedToday,
      graduations: graduations.slice(0, 6),
      newCoins: newCoins.slice(0, 6),
      trend: trend,
      volTrend: volTrend,
      recentTrades: recentTrades,
      gradThresholdUsd: K.gradThresholdUsd
    };
  }
  function fmtDay(ts) {
    var dt = new Date(ts);
    return (dt.getMonth() + 1) + '/' + dt.getDate();
  }


  // ============================================================
  //  暴露 API
  // ============================================================
  window.Launch = {
    CONFIG: K,
    USER: USER,
    coins: SEED,
    coinById: coinById,
    fmtPrice: fmtPrice, fmtUsd: fmtUsd, fmtNum: fmtNum, fmtEth: fmtEth,
    pct: pct, timeAgo: timeAgo, shortAddr: shortAddr,
    usdToEth: usdToEth, ethToUsd: ethToUsd,
    dirClass: dirClass, dirSign: dirSign,
    toast: toast,
    priceAt: priceAt,
    topCoin: topCoin,
    priceAtGraduation: priceAtGraduation,
    swap: swap,
    createCoin: createCoin,
    claim: claim,
    toggleWatch: toggleWatch,
    isLoggedIn: isLoggedIn,
    currentUserName: currentUserName,
    walletText: walletText,
    buy: buy, sell: sell, tradePool: tradePool,
    tryGraduate: tryGraduate,
    notifyGraduated: notifyGraduated,
    notifyBigTrade: notifyBigTrade,
    notifications: notifications,
    watchNotifCount: watchNotifCount,
    analytics: analytics,
    // 配对资产（quote 股票代币表，顺序=市场 Pair 按钮顺序）
    pairStocks: PAIR_STOCKS.slice(),
    quoteCrypto: QUOTE_CRYPTO.slice(),
    // 演示钱包：资产美元价 / 余额 / 水龙头 / 折算 / 支付候选
    assetPrice: assetPrice,
    balanceOf: balanceOf,
    faucet: faucet,
    credit: credit,
    usdOfQty: usdOfQty, qtyOfUsd: qtyOfUsd,
    assetIcon: assetIcon,
    quoteGroups: quoteGroups,
    assetName: assetName,
    assetContract: assetContract,
    walletSummary: walletSummary,
    coinContract: coinContract,
    payAssets: payAssets,
    fmtQty: fmtQty,
    preview: preview,
    fmtDay: fmtDay,
    persist: persist,
    // debug
    debug: { setEth: setEth, forceGraduate: forceGraduate, forceUngraduate: forceUngraduate, resetAll: resetAll }
  };
  window.__sf_launch = { toast: toast }; // 兼容老引用
})();
