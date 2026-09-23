/**
 * admin/admin-mock-data.js
 * Storyfun 数据后台 — 共享 Mock 数据（演示原型）
 *
 * 特性：
 *  - 固定 seed（mulberry32），每次打开页面数据完全一致，可复现
 *  - 800 个用户、约 500 个 NFT、120 部作品、120 天按日指标、约 17 个周数据
 *  - "今天"固定为 2025-08-31（UTC），所有日期展示以 UTC 为准，避免时区漂移
 *
 * 用法：页面先 <script src="admin-mock-data.js"></script>，随后可访问 window.SFMock
 *
 * 数据关系（演示自洽）：
 *  - NFT 算力单位：积分/小时。持 NFT 的用户每小时产出积分（points）
 *  - 每周日结算：本周全站积分 瓜分 本周 STORY 奖池 → distributed（结算发放）
 *  - daily[i].settled = 当日结算的 STORY（按当日积分占本周比例分摊周奖池）
 *  - 用户级 storyProduced 为近似累计结算值；storyExtracted ≤ storyProduced
 */
(function (root, factory) {
  const build = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else root.SFMock = build;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ───────────────────────── 常量 ─────────────────────────
  const DAY = 86400000;
  const NOW = Date.UTC(2025, 7, 31, 12, 0, 0);      // 2025-08-31 12:00 UTC（演示“今天”）
  const DAYS = 7 * 17;                                // 119 天 = 17 个完整自然周
  const USER_COUNT = 800;
  const STORY_PER_POINT_BASE = 176;                 // 演示用积分→STORY 数量级参考（不直接用于周池）

  // ───────────────────────── 伪随机（固定 seed） ─────────────────────────
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(20250831);

  // ───────────────────────── 工具 ─────────────────────────
  function utc(ts) { return new Date(ts); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function dayStart(ts) { const d = utc(ts); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); }
  function fmtDay(ts) { const d = utc(ts); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
  function fmtMD(ts) { const d = utc(ts); return `${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}`; }
  function fmtTs(ts) {
    const d = utc(ts);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }
  function fmtNum(n) {
    n = Math.round(n);
    const abs = Math.abs(n);
    const trim = (s) => s.replace(/\.?0+$/, '');
    if (abs >= 1e8) return trim((n / 1e8).toFixed(2)) + '亿';
    if (abs >= 1e4) return trim((n / 1e4).toFixed(1)) + '万';
    return n.toLocaleString('en-US');
  }
  function pct(a, b) {
    if (!b) return '0.0%';
    return (a / b * 100).toFixed(1) + '%';
  }
  function pickW(total, list) {
    let r = rnd() * total, acc = 0;
    for (let i = 0; i < list.length; i++) { acc += list[i].w; if (r < acc) return list[i]; }
    return list[list.length - 1];
  }

  // ───────────────────────── 国家 / 地区（IP 归属演示） ─────────────────────────
  const REGIONS = ['北美', '欧洲', '亚洲', '拉美', '中东', '非洲', '大洋洲'];
  const COUNTRIES = [
    { name: '美国', region: '北美', w: 175 },
    { name: '加拿大', region: '北美', w: 26 },
    { name: '墨西哥', region: '北美', w: 18 },
    { name: '英国', region: '欧洲', w: 52 },
    { name: '德国', region: '欧洲', w: 33 },
    { name: '法国', region: '欧洲', w: 28 },
    { name: '西班牙', region: '欧洲', w: 20 },
    { name: '荷兰', region: '欧洲', w: 11 },
    { name: '葡萄牙', region: '欧洲', w: 8 },
    { name: '意大利', region: '欧洲', w: 12 },
    { name: '波兰', region: '欧洲', w: 9 },
    { name: '印度', region: '亚洲', w: 80 },
    { name: '印度尼西亚', region: '亚洲', w: 38 },
    { name: '菲律宾', region: '亚洲', w: 32 },
    { name: '越南', region: '亚洲', w: 20 },
    { name: '泰国', region: '亚洲', w: 15 },
    { name: '日本', region: '亚洲', w: 17 },
    { name: '韩国', region: '亚洲', w: 16 },
    { name: '马来西亚', region: '亚洲', w: 11 },
    { name: '新加坡', region: '亚洲', w: 7 },
    { name: '巴西', region: '拉美', w: 55 },
    { name: '阿根廷', region: '拉美', w: 17 },
    { name: '哥伦比亚', region: '拉美', w: 13 },
    { name: '智利', region: '拉美', w: 7 },
    { name: '土耳其', region: '中东', w: 22 },
    { name: '沙特阿拉伯', region: '中东', w: 12 },
    { name: '阿联酋', region: '中东', w: 9 },
    { name: '以色列', region: '中东', w: 6 },
    { name: '埃及', region: '非洲', w: 15 },
    { name: '尼日利亚', region: '非洲', w: 24 },
    { name: '南非', region: '非洲', w: 13 },
    { name: '肯尼亚', region: '非洲', w: 8 },
    { name: '澳大利亚', region: '大洋洲', w: 20 },
    { name: '新西兰', region: '大洋洲', w: 7 },
  ];
  const TOTAL_COUNTRY_W = COUNTRIES.reduce((s, c) => s + c.w, 0);
  const countryOf = (name) => COUNTRIES.find(c => c.name === name) || { region: '其他' };

  // ───────────────────────── 日序（120 天，从旧到新） ─────────────────────────
  const DAY_STARTS = [];
  for (let i = DAYS - 1; i >= 0; i--) DAY_STARTS.push(dayStart(NOW) - i * DAY);
  const dayIndex = (ts) => Math.floor((dayStart(ts) - DAY_STARTS[0]) / DAY);

  // ───────────────────────── 1. 用户 ─────────────────────────
  // 用户名词库（确定性组合，后缀保证唯一，不消耗随机流）
  const NAME_A = ['aaron','bella','crypto','doge','echo','frost','ghost','hunter','iris','jade','karma','luna','moon','nova','onyx','pixel','quantum','raven','solar','titan','ultra','venus','wolf','zen'];
  const NAME_B = ['alpha','beta','fox','hawk','king','leo','max','neo','oak','panda','queen','rain','star','tiger','unicorn','violet','willow','xeno','yuki','zebra'];
  function genUsername(id) {
    const a = NAME_A[(id * 7) % NAME_A.length];
    const b = NAME_B[(id * 11) % NAME_B.length];
    const suffix = 100 + ((id * 13) % 900);
    return a + '_' + b + '_' + suffix;
  }
  // users: { id, addr, regTs, activeTs, nftCount, power, storyProduced, storyExtracted,
  //           isCreator, isNftPublisher, country, region }
  const users = [];
  const nftHolders = [];      // 按用户收集其 NFT（稍后生成 NFT 对象）
  const regByDay = new Array(DAYS).fill(0);
  let preWindowReg = 0;       // 统计窗口（119 天）之前注册的用户数
  for (let i = 0; i < USER_COUNT; i++) {
    const id = i + 1;
    let addr = '0x';
    for (let k = 0; k < 40; k++) addr += '0123456789abcdef'[Math.floor(rnd() * 16)];

    // 注册时间：近期偏多（平台增长），最老 ~400 天前
    const ageDays = Math.pow(rnd(), 1.55) * 400;
    const regTs = NOW - Math.floor(ageDays * DAY) - Math.floor(rnd() * DAY);
    const regIdx = dayIndex(regTs);
    if (regIdx < 0) preWindowReg++;
    else regByDay[Math.min(DAYS - 1, regIdx)]++;

    // 最后活跃：约 78% 为活跃用户（集中在最近 0~16 天），其余为流失/沉睡（15~160 天前）
    let activeTs;
    if (rnd() < 0.78) {
      const ago = Math.pow(rnd(), 2.6) * 16;
      activeTs = NOW - Math.floor(ago * DAY) - Math.floor(rnd() * DAY * 0.5);
    } else {
      activeTs = NOW - Math.floor((15 + rnd() * 145) * DAY);
    }
    // 保底：注册后至少活跃 2 天；且不晚于"现在"
    if (activeTs < regTs + 2 * DAY) {
      activeTs = regTs + 2 * DAY + Math.floor(rnd() * Math.max(DAY, (NOW - regTs) * 0.6));
    }
    if (activeTs > NOW - 0.3 * DAY) activeTs = NOW - 0.3 * DAY - Math.floor(rnd() * DAY);
    if (activeTs < regTs) activeTs = Math.min(NOW - DAY, regTs + DAY);

    // NFT 持有（约 46% 持有，主流 1~3 个，少量大户）
    const countRoll = rnd();
    let nftCount = 0;
    if (countRoll > 0.54) {
      const r2 = rnd();
      if (r2 < 0.66) nftCount = 1;
      else if (r2 < 0.90) nftCount = 2;
      else if (r2 < 0.98) nftCount = 3;
      else nftCount = 4 + Math.floor(rnd() * 4);
    }

    // 角色：创作者 = 发布过内容的用户；IP 发行者 ⊂ 创作者（发行 IP 需先有内容）
    const isCreator = rnd() < 0.155;        // 发布过内容 ≈ 15.5%
    const isNftPublisher = isCreator && rnd() < 0.36;   // 创作者中约 36% 发行过 IP

    const countryObj = pickW(TOTAL_COUNTRY_W, COUNTRIES);
    users.push({
      id, addr, regTs, activeTs, nftCount, power: 0,
      storyProduced: 0, storyExtracted: 0,
      isCreator, isNftPublisher,
      country: countryObj.name, region: countryObj.region,
    });
    // 展示用 UID（8 位）与用户名：确定性生成（不消耗随机流，保证全链演示数值稳定）
    users[users.length - 1].uid = 10000000 + id;
    users[users.length - 1].username = genUsername(id);
    nftHolders.push([]);
  }

  // ───────────────────────── 2. NFT（与用户持有对应） ─────────────────────────
  // nfts: { id, name, power, holderId, mintTs }   power: 积分/小时
  const nfts = [];
  const mintByDay = new Array(DAYS).fill(0);
  let nftSeq = 1;
  users.forEach(u => {
    for (let c = 0; c < u.nftCount; c++) {
      const id = nftSeq++;
      const power = Math.round(60 + Math.pow(rnd(), 1.6) * 740); // 60~800
      const mintTs = u.regTs + Math.floor(rnd() * (Math.max(1, u.activeTs - u.regTs - DAY))) + Math.floor(rnd() * DAY);
      const midx = Math.max(0, Math.min(DAYS - 1, dayIndex(mintTs)));
      mintByDay[midx]++;
      nfts.push({ id, name: 'StoryFun #' + String(id).padStart(4, '0'), power, holderId: u.id, mintTs });
      nftHolders[u.id - 1].push(nfts[nfts.length - 1]);
      u.power += power;
    }
  });
  // 无 NFT 的少量用户也可能有 0 算力 —— 保持原样

  // ───────────────────────── 2.5 IP 合集层级 ─────────────────────────
  // 业务结构：IP 合集（1 次发行）下含多个 NFT，NFT 可分散在不同用户手中。
  // 用确定性分段分配（不消耗随机流，保证既有演示数值稳定），大 IP 多卡、小 IP 少卡。
  const IP_META = [
    { name: '都市战神', w: 110 },
    { name: '重生之医妃', w: 92 },
    { name: '霸总的契约新娘', w: 70 },
    { name: '龙国战神', w: 55 },
    { name: '豪门千金', w: 46 },
    { name: '兵王归来', w: 40 },
    { name: '夜少的甜妻', w: 32 },
    { name: '镇国神将', w: 28 },
    { name: '影后重生', w: 24 },
    { name: '死神降临', w: 18 },
    { name: '都市医仙', w: 14 },
    { name: '电竞王者', w: 10 },
  ];
  {
    const totalW = IP_META.reduce((s, m) => s + m.w, 0);
    const N = nfts.length;
    let nextId = 1, assigned = 0;
    IP_META.forEach((m, idx) => {
      const size = idx === IP_META.length - 1 ? N - assigned : Math.round(N * m.w / totalW);
      for (let k = 0; k < size && nextId <= N; k++, nextId++) {
        const nft = nfts[nextId - 1];
        nft.ipId = idx;
        nft.ipName = m.name;
      }
      assigned += size;
    });
  }

  // ───────────────────────── 3. 按日挖矿 / 结算（自洽） ─────────────────────────
  // dailyEffort: 全站运行因子 0.55~0.92
  const dailyEffort = [];
  for (let i = 0; i < DAYS; i++) dailyEffort.push(0.55 + rnd() * 0.37);

  // 每日全站活跃总算力（NFT 当日已 mint 才计入）
  const activePowerByDay = new Array(DAYS).fill(0);
  nfts.forEach(n => {
    const idx = Math.max(0, Math.min(DAYS - 1, dayIndex(n.mintTs)));
    for (let d = idx; d < DAYS; d++) activePowerByDay[d] += n.power;
  });
  // 每日积分产出 = 总算力 × 24h × 运行因子
  const dailyPoints = [];
  for (let d = 0; d < DAYS; d++) dailyPoints.push(Math.round(activePowerByDay[d] * 24 * dailyEffort[d]));

  // 周切分（从末尾向前每 7 天一周，最旧一段不足 7 天）
  const weeklyRanges = [];
  {
    let end = DAYS - 1;
    while (end >= 0) {
      const start = Math.max(0, end - 6);
      weeklyRanges.unshift({ s: start, e: end });
      end = start - 1;
    }
  }
  const WEEKS = weeklyRanges.length;
  const weeklyPoints = weeklyRanges.map(r => {
    let s = 0; for (let d = r.s; d <= r.e; d++) s += dailyPoints[d];
    return s;
  });

  // 每周 STORY 奖池（由旧到新增长）+ 瓜分结算
  // 注意：最后一段为「本周（进行中）」——积分可实时累计，但奖池/结算要等周期结束后才确定
  const weeklyPool = [], weeklyDistributed = [], weeklyMiners = [];
  const dailySettled = new Array(DAYS).fill(0);   // 结算在每周结算日一次性入账（脉冲），非每日产出
  const dailyExtracted = new Array(DAYS).fill(0); // 提取：结算日后数天内陆续领取
  weeklyRanges.forEach((r, wi) => {
    const isOpen = wi === weeklyRanges.length - 1;
    // 保持随机流调用顺序与数量不变（演示数据可复现），进行中周的结果仅丢弃不落库
    const pool = Math.round((82000 + wi * 4200) * (0.94 + rnd() * 0.12));            // ~8.2万 → ~15万
    const rate = 0.90 + rnd() * 0.08;                                                // 结算率 90%~98%
    const distributed = Math.round(pool * rate);
    const holderCount = users.filter(u => u.nftCount > 0).length;
    const progress = WEEKS <= 1 ? 1 : wi / (WEEKS - 1);
    const miners = Math.round(holderCount * (0.28 + 0.62 * progress) * (0.93 + rnd() * 0.14));
    if (isOpen) {
      weeklyPool.push(null);
      weeklyDistributed.push(null);
      weeklyMiners.push(null);
      return; // 本周未结束：不产生结算
    }
    weeklyPool.push(pool);
    weeklyDistributed.push(distributed);
    weeklyMiners.push(miners);
    // 结算日（该周最后一天）一次性入账整周发放；结算后 4 天内用户陆续提取 ~85%
    dailySettled[r.e] = distributed;
    let left = Math.round(distributed * 0.85);
    for (let k = 0; k < 4; k++) {
      const idx = r.e + k;
      if (idx >= DAYS) break;
      const take = k === 3 ? left : Math.round(left * 0.32);
      dailyExtracted[idx] += take;
      left -= take;
    }
  });

  // 保持随机流节奏：原“按日平滑提取”模拟消耗 2 次/天，此处置弃值以维持全链演示数值稳定
  for (let d = 0; d < DAYS; d++) { rnd(); rnd(); }

  // 用户级累计（近似：按持有时长 × 积分/小时 × 系数 / 每 STORY 积分当量）
  users.forEach(u => {
    if (u.nftCount === 0) return;
    const holdDays = Math.max(2, Math.min(120, Math.max(0, (u.activeTs - Math.max(u.regTs, NOW - 120 * DAY)) / DAY)));
    const points = u.power * 24 * holdDays * 0.72;
    u.storyProduced = Math.round(points / STORY_PER_POINT_BASE);
    u.storyExtracted = Math.round(u.storyProduced * (0.35 + rnd() * 0.55));
  });

  // ───────────────────────── 4. 按日活跃/留存类指标 ─────────────────────────
  const daily = [];
  const regCountSoFar = []; // 累计注册（含窗口前）
  let cum = preWindowReg;
  for (let d = 0; d < DAYS; d++) { cum += regByDay[d]; regCountSoFar.push(cum); }

  const dauArr = [];
  for (let d = 0; d < DAYS; d++) {
    const progress = d / (DAYS - 1);
    const dow = utc(DAY_STARTS[d]).getUTCDay();
    const weekend = (dow === 0 || dow === 6) ? 0.82 + rnd() * 0.1 : 0.97 + rnd() * 0.06;
    const base = regCountSoFar[d] * (0.62 + progress * 0.2);          // 活跃率随产品成熟略升
    const dau = Math.max(20, Math.round(base * weekend * (0.94 + rnd() * 0.12)));
    dauArr.push(Math.min(dau, regCountSoFar[d] || 1));
  }
  const avgOnlineArr = [];
  const avgLoginArr = [];
  for (let d = 0; d < DAYS; d++) {
    const progress = d / (DAYS - 1);
    avgOnlineArr.push(Math.round((38 + progress * 30) * (0.92 + rnd() * 0.16)));   // 分钟
    avgLoginArr.push(+(1.4 + progress * 1.1 + rnd() * 0.7).toFixed(2));             // 次
  }

  // NFT 市场日事件（独立随机，含增长；发布数量与 NFT 对象不必严格一致——含增发/流转等）
  const nftMintedArr = [], nftBoughtArr = [], nftEnergyArr = [];
  for (let d = 0; d < DAYS; d++) {
    const progress = d / (DAYS - 1);
    const grow = 0.6 + progress * 0.9;
    nftMintedArr.push(Math.max(0, Math.round((2 + grow * 6) * (0.6 + rnd() * 0.8))));
    nftBoughtArr.push(Math.max(0, Math.round((3 + grow * 9) * (0.6 + rnd() * 0.8))));
    nftEnergyArr.push(Math.max(0, Math.round((1 + grow * 5) * (0.6 + rnd() * 0.8))));
  }
  // 购买经验包：确定性派生（叠加轻微周期波动），不额外消耗随机流，避免扰动既有 seed 序列
  const nftExpArr = [];
  for (let d = 0; d < DAYS; d++) {
    const wave = 1 + 0.18 * Math.sin(d / 4.7) + 0.08 * Math.cos(d / 9.1);
    nftExpArr.push(Math.max(0, Math.round((nftBoughtArr[d] * 0.5 + nftEnergyArr[d] * 0.9) * wave)));
  }

  // 站外触达（注册转化的分母源）：网站访问 UV / App 安装，确定性派生（不消耗随机流）
  // 口径：新用户注册来自站外触达转化——注册转化率 = 当日注册 ÷ 当日访问(或安装)
  const visitsArr = [], installsArr = [];
  for (let d = 0; d < DAYS; d++) {
    const progress = d / (DAYS - 1);
    const dow = utc(DAY_STARTS[d]).getUTCDay();
    const weekend = (dow === 0 || dow === 6) ? 0.86 : 1;
    const wave = 0.8 + 0.35 * Math.sin(d / 5.1) + 0.15 * Math.cos(d / 13);
    const visits = Math.round((140 + progress * 340) * weekend * wave);
    const installs = Math.round(visits * (0.20 + 0.07 * Math.sin(d / 3.7)) * weekend);
    visitsArr.push(Math.max(40, visits));
    installsArr.push(Math.max(6, installs));
  }

  for (let d = 0; d < DAYS; d++) {
    daily.push({
      ts: DAY_STARTS[d],
      newUsers: regByDay[d],
      totalUsers: regCountSoFar[d],
      dau: dauArr[d],
      avgOnline: avgOnlineArr[d],
      avgLogin: avgLoginArr[d],
      visits: visitsArr[d],
      installs: installsArr[d],
      nftMinted: nftMintedArr[d],
      nftBought: nftBoughtArr[d],
      nftBoughtEnergy: nftEnergyArr[d],
      nftBoughtExp: nftExpArr[d],
      points: dailyPoints[d],
      settled: dailySettled[d],
      extracted: dailyExtracted[d],
    });
  }

  // WAU / MAU（由 DAU 派生，周/月粒度）
  const weekly = weeklyRanges.map((r, wi) => {
    let dauSum = 0;
    for (let d = r.s; d <= r.e; d++) dauSum += dauArr[d];
    const days = r.e - r.s + 1;
    const avgDau = dauSum / days;
    return {
      s: r.s, e: r.e,
      label: fmtMD(DAY_STARTS[r.s]) + ' ~ ' + fmtMD(DAY_STARTS[r.e]),
      dauAvg: Math.round(avgDau),
      wau: Math.round(avgDau * (2.4 + rnd() * 0.8)),
      points: weeklyPoints[wi],
      pool: weeklyPool[wi],
      distributed: weeklyDistributed[wi],
      miners: weeklyMiners[wi],
    };
  });
  const months = [];
  {
    let end = DAYS - 1;
    const monthRanges = [];
    while (end >= 0) {
      const d = utc(DAY_STARTS[end]);
      const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
      const start = Math.max(0, Math.floor((monthStart - DAY_STARTS[0]) / DAY));
      monthRanges.unshift({ s: start, e: end });
      end = start - 1;
    }
    monthRanges.forEach((r, mi) => {
      let dauSum = 0, mauUniq = 0;
      for (let d = r.s; d <= r.e; d++) dauSum += dauArr[d];
      const d0 = utc(DAY_STARTS[r.s]);
      months.push({
        s: r.s, e: r.e,
        label: `${d0.getUTCFullYear()}-${pad(d0.getUTCMonth() + 1)}`,
        dauAvg: Math.round(dauSum / (r.e - r.s + 1)),
        mau: Math.round((dauSum / (r.e - r.s + 1)) * (3.4 + rnd() * 1.2)),
      });
    });
  }

  // ───────────────────────── 5. 留存（按日 cohort，D2~D30） ─────────────────────────
  // retentionByDay: dayIndex → [d2..d30] 共 29 个留存率（0~1）
  const retentionByDay = {};
  const COHORT_DAYS = 60;
  for (let off = 1; off <= COHORT_DAYS; off++) {
    const d = DAYS - off;
    const idx = dayIndex(DAY_STARTS[d]);
    const d2 = 0.30 + rnd() * 0.24;                                   // 次日留存 30~54%
    const arr = [];
    for (let k = 2; k <= 30; k++) {
      const decay = Math.pow(k / 2, -0.55);
      arr.push(+(d2 * decay * (0.9 + rnd() * 0.2)).toFixed(4));
    }
    retentionByDay[idx] = arr;
  }

  // ───────────────────────── 6. 作品 / 内容 ─────────────────────────
  // works: { id, title, cat, publishTs, plays, finished, heat, comments }
  const TITLE_BANK = {
    '战神': {
      p: ['都市战神', '龙国战神', '兵王归来', '隐世战神', '狂龙战神', '无双战神', '镇国战神', '死神归来'],
      s: ['之再战江湖', '之龙王降临', '之都市狂龙', '之我不装了', '之护国神威', '之只手遮天', '之横扫千军', '之都市医仙'],
    },
    '重生': {
      p: ['重生之逆天改命', '重生之豪门千金', '重生之医妃倾世', '重生之电竞王者', '重生之我是首富', '重生之复仇归来', '重生之嫡女翻身', '重生之影后逆袭'],
      s: ['不再当炮灰', '开局签到万亿', '这一次我要赢', '大佬求我别死', '带球跑后翻红', '我的系统成精', '渣男追悔莫及', '一路开挂到巅峰'],
    },
    '霸总': {
      p: ['霸总的契约新娘', '腹黑总裁的', '冷面总裁的', '豪门总裁的', '冰山霸总的', '替嫁新娘与', '霸道总裁的', '夜少的'],
      s: ['心头宝', '隐婚甜妻', '掌上明珠', '小娇妻', '白月光替身', '甜蜜陷阱', '追妻火葬场', '纯情小助理'],
    },
  };
  const CATS = Object.keys(TITLE_BANK);
  const creators = users.filter(u => u.isCreator);
  const works = [];
  {
    let wid = 1;
    CATS.forEach(cat => {
      const bank = TITLE_BANK[cat];
      for (let k = 0; k < 40; k++) {
        const p = bank.p[k % 8];
        const s = bank.s[(k * 3 + Math.floor(k / 8)) % 8];
        const title = (cat === '霸总' && k % 8 === 7) ? p + s : p + s;
        const publishTs = NOW - Math.floor(Math.pow(rnd(), 1.3) * 120 * DAY);
        const plays = Math.round(800 + Math.pow(rnd(), 2.4) * 2600000);
        const finishRate = 0.30 + rnd() * 0.34;
        const finished = Math.round(plays * finishRate);
        const heat = Math.round(plays * (0.02 + rnd() * 0.09));       // 点赞+收藏+分享
        const comments = Math.round(plays * (0.001 + rnd() * 0.008));
        const creator = creators[Math.floor(rnd() * creators.length)];
        const LNK = ['SUN', 'MOON', 'NEB', 'EMBER', 'FROST'];
        works.push({
          id: wid++,
          title: title,
          cat,
          type: wid % 3 === 0 ? 'video' : 'drama',   // 短剧单集 / 短视频 同一“内容单元”维度
          publishTs,
          creatorAddr: creator.addr,
          coinLinked: wid % 7 === 0,
          coinSym: wid % 7 === 0 ? LNK[wid % LNK.length] : '',
          plays, finished, heat, comments,
        });
      }
    });
  }
  const workByDay = new Array(DAYS).fill(0);
  works.forEach(w => { const idx = Math.max(0, Math.min(DAYS - 1, dayIndex(w.publishTs))); workByDay[idx]++; });

  // ───────────────────────── 7. 功能参与（以人为单位，漏斗嵌套抽样） ─────────────────────────
  // features: { id, name, icon, stage, total, users: [{u,c,f,l}] }
  // 漏斗嵌套（参与率分母体系）：观看⊂注册；举报/不感兴趣⊂观看；购买能量包/经验包⊂观看（消费场景）；
  // 发行 IP ⊂ 创作者（isNftPublisher 已保证 ⊂ isCreator）；购买 NFT 为市场行为⊂注册
  function genOverCands(cands, countFn, spanDays) {
    const list = [];
    cands.forEach(u => {
      const c = countFn();
      const f = Math.max(u.regTs, NOW - spanDays * DAY) + Math.floor(rnd() * Math.min(spanDays * DAY, Math.max(1, u.activeTs - u.regTs)) * 0.6);
      const l = Math.min(NOW - Math.floor(rnd() * 2 * DAY), f + Math.floor(rnd() * Math.max(DAY, c * 0.5 * DAY)));
      list.push({ u: u.id, c: Math.max(1, Math.round(c)), f: Math.max(f, u.regTs), l: Math.max(f, l) });
    });
    return list;
  }
  function genActionUsers(sampleFn, countFn, spanDays) {
    return genOverCands(users.filter(sampleFn), countFn, spanDays);
  }
  // 在给定候选池内按概率参与（池内概率 p 命中才计一次）
  function sampleIn(cands, p, countFn, spanDays) {
    return genOverCands(cands.filter(() => rnd() < p), countFn, spanDays);
  }
  // 功能顺序 = Web2 行为 → Web3 行为；stage: 'web2'（内容消费/创作） | 'web3'（链上经济）
  const FEATURE_META = [
    { id: 'register', name: '注册', icon: '📝', stage: 'web2', kind: 'signup' },
    { id: 'view', name: '观看', icon: '🎬', stage: 'web2' },
    { id: 'report', name: '举报', icon: '🚩', stage: 'web2' },
    { id: 'dislike', name: '不感兴趣', icon: '🙅', stage: 'web2' },
    { id: 'publish', name: '发布内容', icon: '✍️', stage: 'web2' },
    { id: 'createNft', name: '发行 IP', icon: '🏛️', stage: 'web3' },
    { id: 'buyNft', name: '购买 NFT', icon: '🛒', stage: 'web3' },
    { id: 'buyEnergy', name: '购买能量包', icon: '⚡', stage: 'web3' },
    { id: 'buyExp', name: '购买经验包', icon: '📈', stage: 'web3' },
  ];
  const registerList = users.map(u => ({ u: u.id, c: 1, f: u.regTs, l: u.regTs }));
  // 先抽「观看」，后续 举报/不感兴趣/购买能量包/经验包 从观看者中嵌套抽样
  const viewList = genActionUsers(() => rnd() < 0.70, () => 3 + Math.floor(rnd() * 30), 70);
  const viewSet = {};
  viewList.forEach(x => { viewSet[x.u] = 1; });
  const viewers = users.filter(u => viewSet[u.id]);
  const ipPublishers = users.filter(u => u.isNftPublisher);

  const features = FEATURE_META.map((meta) => {
    let list;
    switch (meta.id) {
      case 'register':  list = registerList; break;
      case 'view':      list = viewList; break;
      case 'report':    list = sampleIn(viewers, 0.055, () => 1 + Math.floor(rnd() * 2), 70); break;
      case 'dislike':   list = sampleIn(viewers, 0.085, () => 1 + Math.floor(rnd() * 4), 70); break;
      case 'publish':   list = genOverCands(creators, () => 1 + Math.floor(rnd() * 3), 110); break;
      case 'createNft': list = genOverCands(ipPublishers, () => 1 + Math.floor(rnd() * 3), 110); break;
      case 'buyNft':    list = genActionUsers(() => rnd() < 0.085, () => 1 + Math.floor(rnd() * 4), 90); break;
      case 'buyEnergy': list = sampleIn(viewers, 0.28, () => 1 + Math.floor(rnd() * 14), 70); break;
      case 'buyExp':    list = sampleIn(viewers, 0.21, () => 1 + Math.floor(rnd() * 12), 70); break;
      default: list = [];
    }
    return Object.assign({}, meta, { total: list.length, users: list });
  });
  const userIdSet = (list) => {
    const s = new Set();
    list.forEach(x => s.add(x.u));
    return s;
  };
  const userById = {}; users.forEach(u => userById[u.id] = u);
  users.forEach(u => { u.isLauncher = (u.uid % 11 === 0); });

  // ───────────────────────── 8. 按对象挖矿（与日积分一致分摊） ─────────────────────────
  // 积分链路：NFT 按算力每小时产积分 → 按日/周累计；周结算 STORY = 周发放 × 对象积分 ÷ 全站积分
  // 对象类型：'all' 全站 | 'ip' IP 合集 | 'nft' 单个 NFT
  function dailyPointsOfObj(type, id) {
    const arr = new Array(DAYS).fill(0);
    if (type === 'all') {
      for (let d = 0; d < DAYS; d++) arr[d] = dailyPoints[d];
      return arr;
    }
    let pool;
    if (type === 'ip') pool = nfts.filter(n => n.ipId === id);
    else if (type === 'nft') pool = nfts.filter(n => n.id === id);
    else return arr;
    if (!pool.length) return arr;
    // 每日活跃幂（按日汇总该池子中已 mint NFT 的算力）→ 积分 = 全站日积分 × 池活跃算力/全站活跃算力
    const activeByDay = new Array(DAYS).fill(0);
    pool.forEach(n => {
      const idx = Math.max(0, Math.min(DAYS - 1, dayIndex(n.mintTs)));
      for (let d = idx; d < DAYS; d++) activeByDay[d] += n.power;
    });
    for (let d = 0; d < DAYS; d++) {
      arr[d] = Math.round(dailyPoints[d] * (activeByDay[d] || 0) / (activePowerByDay[d] || 1));
    }
    return arr;
  }

  // 对象每日积分（ts/label/value），gran: 'day'|'week'
  function nftMiningSeries(nftId, gran) {
    const dailyArr = dailyPointsOfObj('nft', nftId);
    const out = [];
    if (gran === 'week') {
      weeklyRanges.forEach((r, wi) => {
        let s = 0;
        for (let d = r.s; d <= r.e; d++) s += dailyArr[d];
        if (s > 0) out.push({ ts: DAY_STARTS[r.s], label: weekly[wi].label, value: s });
      });
    } else {
      for (let d = 0; d < DAYS; d++) {
        if (dailyArr[d] > 0) out.push({ ts: DAY_STARTS[d], label: fmtMD(DAY_STARTS[d]), value: dailyArr[d] });
      }
    }
    return out;
  }


  // ───────────────────────── 9. 内容+发射 新业务（独立 mock，不依赖主站引擎） ─────────────────────────
  // Protocol 指标（口径与前台 analytics 对齐，但数值独立演示）
  const protocol = {
    vol24: 1280000, volAll: 24600000,        // 24h / All-time 成交量（USD）
    launch24: 19, launchAll: 1204,            // 24h / All-time 发射数
    devs24: 12, devsAll: 384,                 // 24h(最近完整UTC日) / All-time 去重创建者
    grad24: 3,                                // 24h 毕业数
    note: '独立演示口径 · 与前台数据不同步'
  };

  // 代币管理列表（curve / graduated；路线 holders|wallet）
  const tokens = [
    { id:'t_feng', name:'凤骨琉璃', sym:'FENGGU', pair:'ETH', status:'curve', progress:0.94, mc:46719, tax:2, route:'holders', exempts:0, vol24:12400, creator:'林晚棠', creatorAddr:'0x7A2b…fD81', created:'2025-08-20', banned:false },
    { id:'t_xiang', name:'丞相府今日开饭', sym:'XIANG', pair:'ETH', status:'graduated', progress:1, mc:389000, tax:0, route:'wallet', exempts:1, vol24:65200, creator:'厨子老王', creatorAddr:'0x9F3c…aa12', created:'2025-06-10', graduated:'2025-07-02', banned:false },
    { id:'t_xie', name:'我卸甲后天下大乱了', sym:'XIEJIA', pair:'ETH', status:'curve', progress:0.71, mc:156000, tax:3, route:'holders', exempts:2, vol24:8800, creator:'慕容战', creatorAddr:'0x1D8a…b40e', created:'2025-08-02', banned:false },
    { id:'t_moon', name:'月球打碟猫', sym:'MOONCAT', pair:'NVDA', status:'curve', progress:0.12, mc:4200, tax:1, route:'holders', exempts:0, vol24:3300, creator:'Astra', creatorAddr:'0xE45b…77c9', created:'2025-08-28', banned:false },
    { id:'t_candle', name:'烛火与王冠', sym:'CANDLE', pair:'GLD', status:'curve', progress:0.28, mc:12060, tax:0, route:'wallet', exempts:0, vol24:2100, creator:'Sylvan', creatorAddr:'0xB20f…9e01', created:'2025-08-22', banned:false },
    { id:'t_surv', name:'末日幸存指南', sym:'SURVIVE', pair:'ETH', status:'graduated', progress:1, mc:88000, tax:3, route:'holders', exempts:3, vol24:9100, creator:'Noah', creatorAddr:'0x57C9…f1a3', created:'2025-07-22', graduated:'2025-08-10', banned:false },
    { id:'t_zero', name:'零点计划', sym:'ZERO', pair:'SPY', status:'curve', progress:0.06, mc:31200, tax:0, route:'wallet', exempts:0, vol24:400, creator:'Kai', creatorAddr:'0x08eD…31b6', created:'2025-08-30', banned:false },
    { id:'t_names', name:'无名者档案', sym:'NAMES', pair:'ETH', status:'graduated', progress:1, mc:67100, tax:0, route:'holders', exempts:0, vol24:2100, creator:'白鹭', creatorAddr:'0x33A1…c8f0', created:'2025-06-26', graduated:'2025-07-13', banned:false },
    { id:'t_pyr', name:'金字塔之梦', sym:'PYRAMID', pair:'ETH', status:'curve', progress:0.03, mc:8900, tax:0, route:'holders', exempts:0, vol24:310, creator:'Ramesh', creatorAddr:'0xF90C…d2e8', created:'2025-08-31', banned:false },
    { id:'t_hero', name:'孤胆英雄传', sym:'HERO', pair:'ETH', status:'curve', progress:0.42, mc:24000, tax:2, route:'holders', exempts:1, vol24:5100, creator:'陈破晓', creatorAddr:'0x6E2b…a4d7', created:'2025-08-14', banned:false },
    { id:'t_luoyang', name:'风起洛阳', sym:'LUOYANG', pair:'ETH', status:'curve', progress:0.55, mc:31000, tax:1, route:'wallet', exempts:0, vol24:2700, creator:'白鹿行', creatorAddr:'0x4C1a…90f2', created:'2025-08-09', banned:false },
    { id:'t_neb', name:'Nebula Fox', sym:'NEBBY', pair:'TSLA', status:'curve', progress:0.18, mc:5600, tax:0, route:'holders', exempts:0, vol24:900, creator:'Orion', creatorAddr:'0x87D3…5ba6', created:'2025-08-27', banned:false },
    { id:'t_qcat', name:'Quantum Cat', sym:'QCAT', pair:'AAPL', status:'graduated', progress:1, mc:122000, tax:1, route:'wallet', exempts:2, vol24:18000, creator:'Dr.Meow', creatorAddr:'0x2F9b…c7d1', created:'2025-06-01', graduated:'2025-06-20', banned:false },
    { id:'t_ember', name:'Ember Wolf', sym:'EMBER', pair:'ETH', status:'curve', progress:0.09, mc:3100, tax:0, route:'wallet', exempts:0, vol24:220, creator:'Frost', creatorAddr:'0xB7e0…48c3', created:'2025-08-31', banned:false },
    { id:'t_banned', name:'灰烬档案', sym:'ASHES', pair:'ETH', status:'graduated', progress:1, mc:9800, tax:0, route:'wallet', exempts:0, vol24:0, creator:'TBD', creatorAddr:'0x00E1…92ab', created:'2025-07-30', graduated:'2025-08-15', banned:true }
  ];

  // 近 30 日 发射 / 毕业 日序列（确定性演示，时间轴从 NOW 回推）
  const launchDaily = [];
  const gradDaily = [];
  const volDaily = [];
  (function () {
    for (let k = 29; k >= 0; k--) {
      const ts = NOW - k * DAY;
      const d = new Date(ts);
      const label = (d.getUTCMonth() + 1) + '/' + d.getUTCDate();
      const pos = 29 - k;
      const lv = pos === 29 ? 19 : Math.round(8 + 10 * Math.sin(pos * 0.7) + (pos % 7 === 0 ? 7 : 0) + (pos >= 26 ? (pos - 26) * 2 : 0));
      const gv = pos === 29 ? 3 : Math.max(1, Math.round(1.5 + Math.sin(pos * 0.55) * 2.2));
      launchDaily.push({ ts, label, value: lv });
      gradDaily.push({ ts, label, value: gv });
      volDaily.push({ ts, label, value: Math.round(260000 + 480000 * Math.abs(Math.sin(pos * 0.7)) + 90000 * Math.sin(pos * 0.9) + (pos >= 24 ? (pos - 24) * 22000 : 0)) });
    }
  })();

  // ───────────────────────── 导出 ─────────────────────────
  return {
    DAY, NOW, DAYS,
    USER_COUNT,
    REGIONS, COUNTRIES, TOTAL_COUNTRY_W,
    users, nfts, works, features,
    tokens, protocol,
    launchDaily, gradDaily, volDaily,
    daily, weekly, months, workByDay,
    retentionByDay,
    IP_META, dailyPointsOfObj, nftMiningSeries,
    helpers: { fmtDay, fmtMD, fmtTs, fmtNum, pct },
    util: { utc, pad, dayStart, dayIndex, userById, userIdSet, countryOf },
  };
});
