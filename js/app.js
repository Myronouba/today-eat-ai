/* ============================================================
   今天吃啥 AI 版 · 主应用逻辑 · build v4
   ============================================================ */
(function () {
  "use strict";
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const LS_PREFS = "eat-ai-prefs";
  const LS_ANNIV = "eat-ai-anniv";
  const LS_ACH_TIP = "eat-ai-ach-tip";
  const LS_LOVER_NAME = "eat-ai-lover-name";
  const LS_MY_NAME = "eat-ai-my-name";
  const LS_USER = "eat-ai-user";
  const LS_FIRST = "eat-ai-first-seen";

  /* 调试开关：URL 带 ?reset=1 或 ?fresh=1 → 清空本地数据，模拟全新用户首次进入 */
  (function debugReset() {
    var p = new URLSearchParams(location.search);
    if (p.has("reset") || p.has("fresh")) {
      localStorage.clear();
      window.__freshReset = true;
      try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
    }
  })();

  /* ---------- 账号 ---------- */
  function loadUser() { try { return JSON.parse(localStorage.getItem(LS_USER) || "null"); } catch (e) { return null; } }
  function saveUser(u) { localStorage.setItem(LS_USER, JSON.stringify(u)); }
  function maskPhone(p) {
    if (!p) return "";
    return p.length >= 7 ? p.slice(0, 3) + "****" + p.slice(-4) : p;
  }
  function applyUserShell() {
    const u = loadUser();
    const wu = $("#welcomeUser");
    const gl = $("#btnGoLogin");
    if (u) {
      if (wu) {
        wu.classList.remove("hidden");
        wu.innerHTML = `<div class="wu-avatar">${u.avatar || "🍅"}</div>
          <div class="wu-body"><div class="wu-name">${u.nickname ? ("你好，" + u.nickname) : "欢迎回来"}</div>
          <div class="wu-phone">${maskPhone(u.phone)}</div></div>`;
      }
      if (gl) gl.textContent = "退出登录";
    } else {
      if (wu) wu.classList.add("hidden");
      if (gl) gl.textContent = "登录 / 注册";
    }
    renderMeView();
  }
  function renderMeView() {
    const u = loadUser();
    const av = $("#meAvatar"), nm = $("#meName"), ph = $("#mePhone"), nick = $("#meNickname");
    if (!av) return;
    if (u) {
      av.textContent = u.avatar || "🍅";
      nm.textContent = u.nickname || "欢迎回来";
      ph.textContent = maskPhone(u.phone);
      nick.value = u.nickname || "";
      const lb = $("#meLoginBox");
      if (lb) lb.classList.add("hidden");
      const lo = $("#btnLogoutMe");
      if (lo) lo.classList.remove("hidden");
    } else {
      av.textContent = "🍅";
      nm.textContent = "未登录";
      ph.textContent = "登录后解锁账号功能";
      nick.value = "";
      const lb = $("#meLoginBox");
      if (lb) lb.classList.remove("hidden");
      const lo = $("#btnLogoutMe");
      if (lo) lo.classList.add("hidden");
    }
  }
  function logoutUser() {
    if (confirm("确定退出登录吗？")) {
      localStorage.removeItem(LS_USER);
      applyUserShell();
      showView("welcome");
      window.scrollTo({ top: 0 });
      toast("已退出登录");
    }
  }

  /* ---------- 状态 ---------- */
  let prefs = loadPrefs();
  let homeState = null;    // {dishes, ctx}
  let coupleState = null;  // {dishes, ctx, roles, task, memorial}
  let listState = null;    // {dishes, people}
  let viewingRecipe = null;

  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(LS_PREFS) || "null"); } catch (e) { return null; }
  }
  function savePrefs() { localStorage.setItem(LS_PREFS, JSON.stringify(prefs)); }

  /* ---------- 工具 ---------- */
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  const TYPE_META = {
    hot: { label: "荤菜", cls: "hot", emoji: "🍖" },
    veg: { label: "素菜", cls: "veg", emoji: "🥬" },
    soup: { label: "汤", cls: "soup", emoji: "🍲" },
    staple: { label: "主食", cls: "staple", emoji: "🍚" },
    cold: { label: "凉菜", cls: "cold", emoji: "🥗" }
  };
  const DIFF_TEXT = { 1: "新手友好", 2: "略有挑战", 3: "需要功底" };

  /* ---------- 情侣成就 ---------- */
  const COUPLE_ACHIEVEMENTS = [
    { need: 1,   icon: "❤️", name: "爱心起灶",   desc: "第一次一起下厨" },
    { need: 3,   icon: "🔥", name: "三日之约",   desc: "累计一起做饭 3 次" },
    { need: 7,   icon: "🌹", name: "一周浪漫",   desc: "累计一起做饭 7 次" },
    { need: 15,  icon: "💞", name: "半月默契",   desc: "累计一起做饭 15 次" },
    { need: 30,  icon: "👩‍❤️‍👨", name: "满月热恋",   desc: "累计一起做饭 30 次" },
    { need: 50,  icon: "💍", name: "金婚厨房",   desc: "累计一起做饭 50 次" },
    { need: 100, icon: "👑", name: "一生之约",   desc: "累计一起做饭 100 次" }
  ];

  /* ---------- 今日默契一问 ---------- */
  const QUIZ_POOL = [
    { q: "今晚这顿饭，TA 最想听到的评价是？",
      o: ["“太好吃了”", "“有你真好”", "“再来一碗”"],
      r: ["TA 会假装谦虚，其实嘴角已经翘起来了", "TA 会回一句“你也是”，然后给你夹菜", "这是 TA 心里的最高赞美"] },
    { q: "TA 帮你试菜，第一口会先尝哪道？",
      o: ["荤菜", "素菜", "汤"],
      r: ["果然是肉食主义，肉就是 TA 的快乐", "TA 说荤素搭配才健康", "懂生活的人，先喝一口汤"] },
    { q: "猜猜 TA 最怕你把哪道菜做翻车？",
      o: ["最贵那道", "TA 最爱的拿手菜", "任何菜"],
      r: ["贵的不敢，怕你心疼钱包", "TA 表面担心，其实对你信心十足", "其实在 TA 心里，你做的都好吃"] },
    { q: "吃到一半，TA 会先做什么？",
      o: ["拍照发朋友圈", "给你夹菜", "夸你"],
      r: ["TA 说必须记录下这顿“高光时刻”", "夹到你碗里的，是 TA 没说出口的话", "夸完还不忘补一句：明天还做吗"] },
    { q: "如果 TA 来当主厨，最可能是哪种画风？",
      o: ["大厨上身，仪式感拉满", "边做边吃，快乐厨房", "手忙脚乱但可爱"],
      r: ["TA 会提前列好清单，连摆盘都安排上", "进厨房等于进了自助餐", "笨拙的样子，是你最爱的样子"] },
    { q: "饭后猜拳洗碗，TA 心里想的是？",
      o: ["“我肯定赢”", "“输了就让给你赢”", "“一起洗多好”"],
      r: ["TA 手气向来不错，胜券在握", "TA 早就想好了要让你", "这才是 TA 真正的目的"] },
    { q: "这道菜 TA 会起什么名字？",
      o: ["浪漫的名字", "只属于你俩的暗号", "随便，好吃就行"],
      r: ["TA 的仪式感不允许普通名字", "比如“第一次约会的味道”", "务实派，但记得住你爱吃什么"] },
    { q: "TA 最想在这顿饭里加什么？",
      o: ["一杯小酒", "一首歌", "一个拥抱"],
      r: ["微醺时刻，话自然就多了", "BGM 是 TA 的浪漫开关", "拥抱才是这顿饭最想吃的“主菜”"] },
    { q: "如果你偷偷藏了一颗糖，TA 会发现吗？",
      o: ["一眼就发现", "看到甜食才想起", "永远发现不了"],
      r: ["你对 TA 的任何细节，TA 都门儿清", "TA 的雷达只对甜的东西启动", "那更好，正好留作惊喜"] },
    { q: "这顿饭结束时，TA 最可能说什么？",
      o: ["“下次换我做”", "“我们明天吃什么”", "“辛苦了”"],
      r: ["立 flag 专业户，但说到做到", "TA 已经在为下次约会做铺垫", "最朴实，也最戳心"] },
    { q: "TA 偷偷给这道菜打几分？",
      o: ["满分", "98，留一分下次进步", "100+1"],
      r: ["满分是对这顿饭的尊重", "留一分，是想让你再来一次", "多出来的那 1 分，是爱"] },
    { q: "如果今天是 TA 的生日，TA 最想吃什么？",
      o: ["你做的任何一道菜", "TA 的童年味道", "你俩第一次吃的那道"],
      r: ["有你在，就是最好的菜", "回忆杀永远最致命", "那是最初心动时的味道"] },
    { q: "TA 洗碗时，心里大概率在盘算什么？",
      o: ["明天怎么再做一顿", "周末去哪约会", "你刚才那句话真好听"],
      r: ["TA 的下一顿，已经在计划里", "饭桌是讨论约会的最佳地点", "你随口的话，TA 记得很清楚"] },
    { q: "饭后散步，TA 会牵你的哪只手？",
      o: ["左手", "右手", "十指相扣"],
      r: ["靠近心脏的那只手", "写字吃饭的那只手", "成年人早就不做选择了"] },
    { q: "如果给你们这顿饭配一首歌，会是？",
      o: ["慢歌", "欢乐的歌", "没有词的纯音乐"],
      r: ["适合慢慢吃、慢慢聊", "快乐就是你们的底色", "一切尽在不言中"] }
  ];

  /* ---------- 视图切换 ---------- */
  let backStack = [];   // 子页面返回栈（顶部固定返回按钮使用）
  const VIEW_TITLES = {
    home: { e: "🍳", t: "在家吃" }, couple: { e: "💞", t: "情侣一起做" },
    out: { e: "🍽️", t: "出去吃" }, history: { e: "📖", t: "历史" },
    me: { e: "🙂", t: "我的" }, settings: { e: "⚙️", t: "设置" },
    login: { e: "", t: "登录" }, onboard: { e: "✨", t: "口味问答" },
    "home-result": { e: "🍽️", t: "今天吃这些" }, list: { e: "🧺", t: "买菜清单" },
    recipe: { e: "📜", t: "菜谱详情" }, "couple-result": { e: "💞", t: "约会菜单" },
    "out-result": { e: "🍽️", t: "出去吃" }, welcome: { e: "", t: "今天吃啥" }
  };
  function showView(id, fromBack) {
    let v = $("#view-" + id);
    if (!v) { id = "home"; v = $("#view-home"); }  // 视图不存在 → 安全回退首页，避免空白
    /* 顶部栏：显示当前页面标题（渐变文字 + emoji，替代品牌 LOGO） */
    const vt = VIEW_TITLES[id] || { e: "", t: "" };
    const tte = $("#topTitleEmoji"), ttt = $("#topTitleText");
    if (ttt) ttt.textContent = vt.t;
    if (tte) tte.textContent = vt.e;
    /* 返回栈：进入子页面时记住上一个视图，顶部固定返回按钮由此弹出 */
    const MAIN_VIEWS = ["home", "couple", "out", "history"];
    const NO_BACK = ["welcome", "onboard", "login"];
    const prevEl = document.querySelector(".view.active");
    const prevId = prevEl ? prevEl.id.replace("view-", "") : null;
    const isSub = !MAIN_VIEWS.includes(id) && !NO_BACK.includes(id);
    if (isSub && !fromBack && prevId && prevId !== id) {
      backStack.push(prevId);
      if (backStack.length > 10) backStack.shift();
    }
    const tb = $("#btnTopBack");
    if (tb) tb.hidden = !isSub;   // 仅子页面显示固定返回按钮
    $$(".view").forEach(x => x.classList.remove("active"));
    v.classList.add("active");
    /* 强制重播进入动画：子元素依次柔和浮现（返回菜单更细腻） */
    v.querySelectorAll(":scope > *").forEach((el, i) => {
      el.classList.remove("view-enter");
      void el.offsetWidth;  // 强制 reflow，确保动画重播
      el.style.animationDelay = Math.min(i * 0.05, 0.45) + "s";
      el.classList.add("view-enter");
    });
    $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === id));
    document.body.classList.toggle("hide-shell", id === "welcome" || id === "login");
    if (id !== "welcome" && id !== "login") window.scrollTo({ top: 0, behavior: "smooth" });
    if (id === "couple") renderCoupleProgress();
    if (id === "me") renderMeView();
    if (id === "history") renderHistory();
  }

  /* ---------- 芯片选择器 ---------- */
  function bindChips(el, onChange) {
    el.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const multiselect = el.dataset.multi === "1";
      if (multiselect) {
        chip.classList.toggle("active");
        if (chip.dataset.val === "none") {
          $$(".chip", el).forEach(c => { if (c.dataset.val !== "none") c.classList.remove("active"); });
        } else {
          const none = el.querySelector('.chip[data-val="none"]');
          if (none) none.classList.remove("active");
        }
      } else {
        $$(".chip", el).forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
      }
      onChange && onChange();
    });
  }
  function chipVal(el) {
    const act = el.querySelector(".chip.active");
    return act ? act.dataset.val : null;
  }
  function chipVals(el) {
    return $$(".chip.active", el).map(c => c.dataset.val);
  }
  function setChip(el, val) {
    $$(".chip", el).forEach(c => c.classList.toggle("active", c.dataset.val === String(val)));
  }

  /* ============================================================
     ① 30 秒问答（onboarding）
     ============================================================ */
  const OB_STEPS = [
    { key: "region", title: "最想宠哪一口？", multi: true, custom: "cuisine",
      hint: "菜系可以多选，菜品池会把你爱吃的都记下，AI 只宠你一个人" },
    { key: "people", title: "平时几个人吃？", multi: false, custom: "people",
      hint: "告诉我几个人，分量和搭配我都给你安排妥妥的",
      options: [
        { v: "1", emoji: "🍚", label: "一个人", sub: "给自己做顿好的" },
        { v: "2", emoji: "👫", label: "两个人", sub: "朋友 · 情侣 · 搭子" },
        { v: "3", emoji: "👨👩👧", label: "一家三口", sub: "温馨小家庭" },
        { v: "4", emoji: "🎉", label: "四人以上", sub: "朋友局 · 大家庭" } ] },
    { key: "cooker", title: "家里谁掌勺？", multi: false,
      options: [
        { v: "lazy", emoji: "🛋️", label: "躺平懒人", sub: "能少一步是一步" },
        { v: "newbie", emoji: "🥄", label: "厨房新手", sub: "不翻车就算赢" },
        { v: "pro", emoji: "👨‍🍳", label: "老手大厨", sub: "硬菜随便拿捏" },
        { v: "none", emoji: "🍽️", label: "没人做", sub: "出门觅食去" } ] },
    { key: "spicy", title: "你能吃多辣？", multi: false,
      options: [
        { v: "0", emoji: "🌿", label: "不吃辣", sub: "一滴辣都不碰" },
        { v: "1", emoji: "🌶️", label: "微辣", sub: "意思一下" },
        { v: "2", emoji: "🌶️🌶️", label: "中辣", sub: "越吃越过瘾" },
        { v: "3", emoji: "🌶️🌶️🌶️", label: "无辣不欢", sub: "辣才是灵魂" } ] },
    { key: "avoid", title: "有什么要避开的？", multi: true, custom: "avoid",
      hint: "多选都行，你的忌口我都记在小本本上了，放心",
      options: [
        { v: "none", emoji: "🙆", label: "没有忌口", sub: "什么都吃" },
        { v: "cilantro", emoji: "🌿", label: "不吃香菜", sub: "香菜一生之敌" },
        { v: "pork", emoji: "🐷", label: "不吃猪肉" },
        { v: "seafood", emoji: "🦐", label: "海鲜过敏" },
        { v: "vegetarian", emoji: "🥦", label: "素食主义" },
        { v: "garlic", emoji: "🧄", label: "不吃葱蒜" } ] },
    { key: "health", title: "吃饭有没有小目标？", multi: false,
      options: [
        { v: "none", emoji: "🛌", label: "吃好就行", sub: "躺平快乐干饭" },
        { v: "fitness", emoji: "💪", label: "减脂塑形", sub: "自律给我自由" },
        { v: "muscle", emoji: "🏋️", label: "增肌高蛋白", sub: "肉蛋奶管够" },
        { v: "bone", emoji: "🦴", label: "补钙强骨", sub: "奶豆常备" },
        { v: "sugar", emoji: "🍬", label: "控糖中", sub: "甜要适度" },
        { v: "light", emoji: "🍵", label: "清淡养生", sub: "佛系轻负担" } ] }
  ];

  /* ---------- 自定义步骤数据：6 框 + 更多展开 ---------- */
  const CUISINE = {
    mains: [
      { v: "sichuan", emoji: "🌶️", label: "川菜", sub: "麻辣鲜香 · 下饭顶流" },
      { v: "guangdong", emoji: "🍲", label: "粤菜", sub: "清淡原味 · 鲜到眉毛" },
      { v: "central", emoji: "🔥", label: "湘菜", sub: "香辣浓郁 · 越吃越上瘾" },
      { v: "jiangnan", emoji: "🐟", label: "江浙菜", sub: "清淡甜鲜 · 讲究本味" },
      { v: "other", emoji: "🍚", label: "全国通吃", sub: "佛系 · 什么都能宠" },
      { v: "__more__", emoji: "🗺️", label: "更多菜系", sub: "八大菜系 + 环球风味", more: true }
    ],
    more: [
      { v: "lu", emoji: "🥟", label: "鲁菜", sub: "咸鲜厚重", flavor: "north" },
      { v: "dongbei", emoji: "🥘", label: "东北菜", sub: "豪爽炖菜", flavor: "northeast" },
      { v: "xibei", emoji: "🍖", label: "西北菜", sub: "牛羊面食", flavor: "northwest" },
      { v: "yungui", emoji: "🍜", label: "云贵菜", sub: "酸辣多民族", flavor: "southwest" },
      { v: "e", emoji: "🦆", label: "鄂菜", sub: "江湖鲜香", flavor: "central" },
      { v: "hui", emoji: "🏮", label: "徽菜", sub: "重油重色", flavor: "north" },
      { v: "min", emoji: "🍤", label: "闽菜", sub: "清鲜和醇", flavor: "guangdong" },
      { v: "jing", emoji: "🍲", label: "京菜", sub: "官府风味", flavor: "north" },
      { v: "french", emoji: "🥐", label: "法式西餐", sub: "精致浪漫", flavor: "other" },
      { v: "italy", emoji: "🍕", label: "意大利菜", sub: "奶酪番茄", flavor: "other" },
      { v: "japan", emoji: "🍣", label: "日式料理", sub: "清淡鲜甜", flavor: "other" },
      { v: "korea", emoji: "🥘", label: "韩式料理", sub: "辣爽烤肉", flavor: "other" },
      { v: "thai", emoji: "🍜", label: "泰式料理", sub: "酸辣开胃", flavor: "other" },
      { v: "seasia", emoji: "🍛", label: "东南亚菜", sub: "香料风味", flavor: "other" },
      { v: "america", emoji: "🍔", label: "美式料理", sub: "硬核热量", flavor: "other" }
    ]
  };
  const PEOPLE = {
    mains: [
      { v: "1", emoji: "🍚", label: "一个人", sub: "独享小确幸" },
      { v: "2", emoji: "👫", label: "两个人", sub: "情侣 · 闺蜜 · 好兄弟" },
      { v: "3", emoji: "👨‍👩‍👧", label: "一家三口", sub: "温馨小家庭" },
      { v: "8", emoji: "🏠", label: "大家庭", sub: "默认八人 · 团圆饭" },
      { v: "__custom__", emoji: "🎉", label: "聚会人数自定义", sub: "点这里自己定", custom: true },
      { v: "__more__", emoji: "🔢", label: "更多人数", sub: "预设 + 自定义", more: true }
    ],
    more: [
      { v: "4", emoji: "👨‍👩‍👧‍👦", label: "一家四口" },
      { v: "5", emoji: "🎊", label: "一家五口" },
      { v: "6", emoji: "🎊", label: "六人局" },
      { v: "10", emoji: "🎊", label: "十人以上" }
    ]
  };
  const AVOID = {
    mains: [
      { v: "cilantro", emoji: "🌿", label: "不吃香菜", sub: "香菜一生之敌" },
      { v: "garlic", emoji: "🧄", label: "不吃葱蒜", sub: "葱蒜退散" },
      { v: "pork", emoji: "🐷", label: "不吃猪肉", sub: "猪肉拜拜" },
      { v: "seafood", emoji: "🦐", label: "海鲜过敏", sub: "虾蟹避开" },
      { v: "vegetarian", emoji: "🥦", label: "素食主义", sub: "素净也精彩" },
      { v: "__more__", emoji: "⋯", label: "更多忌口", sub: "牛羊肉 · 蛋 · 乳糖等", more: true }
    ],
    more: [
      { v: "beef", emoji: "🐂", label: "不吃牛羊肉", sub: "牛羊避开" },
      { v: "egg", emoji: "🥚", label: "不吃蛋", sub: "蛋类避开" },
      { v: "lactose", emoji: "🥛", label: "乳糖不耐", sub: "奶制品避开" },
      { v: "organ", emoji: "🍖", label: "不吃内脏", sub: "肝腰肠肚避开" },
      { v: "mushroom", emoji: "🍄", label: "不吃菌菇", sub: "香菇木耳避开" },
      { v: "soy", emoji: "🫘", label: "不吃豆制品", sub: "豆腐豆干避开" },
      { v: "noSpicy", emoji: "🌶️", label: "一点辣不碰", sub: "零辣度" },
      { v: "lowOil", emoji: "🫒", label: "少油少脂", sub: "清淡饮食" },
      { v: "lowSalt", emoji: "🧂", label: "少盐控钠", sub: "低盐饮食" },
      { v: "lowSugar", emoji: "🍬", label: "控糖戒甜", sub: "低糖饮食" }
    ]
  };
  const CUSTOM = { cuisine: CUISINE, people: PEOPLE, avoid: AVOID };
  let obStep = 0;
  const obState = {};

  function currentQStep() { return OB_STEPS[obStep]; }

  /* 进度条：百分比 + 小番茄随进度移动 */
  function updateQProgress() {
    const pct = Math.round((obStep + 1) / OB_STEPS.length * 100);
    const f = $("#qFill");
    if (f) f.style.width = pct + "%";
    const dot = $("#qFillDot");
    if (dot) dot.style.left = pct + "%";
    const c = $("#qCount");
    if (c) c.textContent = (obStep + 1) + " / " + OB_STEPS.length + " · " + pct + "%";
  }

  function renderQStep() {
    const s = currentQStep();
    if (s.custom) { renderQCustom(s); return; }
    if (s.region) { renderQRegions(s); return; }
    if (s.map) { renderQMap(s); return; }
    const qCard = $("#qCard");
    const opts = s.options.map(o => {
      let active = false;
      if (s.multi) active = (obState[s.key] || []).includes(o.v);
      else active = obState[s.key] === o.v;
      const emoji = o.emoji ? `<span class="qc-emoji">${o.emoji}</span>` : "";
      const sub = o.sub ? `<span class="qc-sub">${o.sub}</span>` : "";
      return `<button class="qc-opt ${active ? "active" : ""}" data-val="${o.v}">${emoji}<span class="qc-label">${o.label}</span>${sub}</button>`;
    }).join("");
    const hint = s.hint ? `<p class="field-hint" id="qHint">${s.hint}</p>` : "";
    qCard.innerHTML = `
      <div class="q-step">${String(obStep + 1).padStart(2, "0")}<span>/ ${OB_STEPS.length}</span></div>
      <h3 class="q-title serif">${s.title}</h3>
      <div class="qc-grid" id="qOpts" data-multi="${s.multi ? "1" : ""}">${opts}</div>
      ${hint}`;
    bindQOpts();
    updateQProgress();
    updateQNav();
  }

  function renderQCustom(s) {
    const D = CUSTOM[s.custom];
    const qCard = $("#qCard");
    const mainsHtml = D.mains.map(o => {
      return `<button class="rc-card ${o.more ? "rc-more" : ""} ${o.custom ? "rc-custom" : ""}" data-v="${o.v}" data-more="${o.more ? "1" : "0"}" data-custom="${o.custom ? "1" : "0"}">
        <span class="rc-emoji">${o.emoji}</span>
        <span class="rc-name">${o.label}</span>
        <span class="rc-words">${o.sub}</span>
      </button>`;
    }).join("");
    qCard.innerHTML = `
      <div class="q-step">${String(obStep + 1).padStart(2, "0")}<span>/ ${OB_STEPS.length}</span></div>
      <h3 class="q-title serif">${s.title}</h3>
      <div class="rc-grid" id="rcGrid">${mainsHtml}</div>
      <div id="qMoreZone"></div>
      <div id="qCustomZone"></div>
      <p class="field-hint" id="qHint"></p>`;
    /* 主卡片：事件委托，只切 class，不重建 */
    $("#rcGrid").addEventListener("click", e => {
      const c = e.target.closest(".rc-card");
      if (!c) return;
      if (c.dataset.more === "1") {
        obState["__more_" + s.key] = !obState["__more_" + s.key];
        c.classList.toggle("active", !!obState["__more_" + s.key]);
        renderMoreZone(s);
        return;
      }
      if (c.dataset.custom === "1") {
        obState["__custom_" + s.key] = !obState["__custom_" + s.key];
        c.classList.toggle("active", !!obState["__custom_" + s.key]);
        renderCustomZone(s);
        return;
      }
      toggleQVal(s, c.dataset.v);
      syncQStates(s);
      updateQHint(s);
      updateQNav();
    });
    syncQStates(s);
    renderMoreZone(s);
    renderCustomZone(s);
    updateQHint(s);
    updateQProgress();
    updateQNav();
  }

  function syncQStates(s) {
    const D = CUSTOM[s.custom];
    const cur = obState[s.key];
    const arr = s.multi ? (Array.isArray(cur) ? cur : []) : (cur ? [cur] : []);
    document.querySelectorAll("#rcGrid .rc-card").forEach(c => {
      if (c.dataset.more === "1") { c.classList.toggle("active", !!obState["__more_" + s.key]); return; }
      if (c.dataset.custom === "1") { c.classList.toggle("active", !!obState["__custom_" + s.key]); return; }
      c.classList.toggle("active", arr.includes(c.dataset.v));
    });
    document.querySelectorAll("#qMoreZone .qc-opt").forEach(c => {
      c.classList.toggle("active", arr.includes(c.dataset.v));
    });
  }

  function renderMoreZone(s) {
    const D = CUSTOM[s.custom];
    const zone = $("#qMoreZone");
    if (!zone) return;
    const moreOpen = !!obState["__more_" + s.key];
    if (!moreOpen) { zone.innerHTML = ""; return; }
    const moreHtml = D.more.length ? `<div class="qc-grid qc-grid-more" id="qMore">${D.more.map(o =>
      `<button class="qc-opt" data-v="${o.v}"><span class="qc-emoji">${o.emoji}</span><span class="qc-label">${o.label}</span>${o.sub ? `<span class="qc-sub">${o.sub}</span>` : ""}</button>`).join("")}</div>` : "";
    const moreCustomHtml = s.custom === "people" ? `
      <div class="q-custom q-custom-more">
        <span class="q-custom-tip">这些还不够？点一个或直接输入</span>
        <div class="q-custom-chips">${[6, 8, 10, 12, 15, 20].map(n => `<button class="chip" data-n="${n}">${n} 人</button>`).join("")}</div>
        <div class="q-custom-row"><input type="number" id="qMoreCustomNum" min="1" max="30" placeholder="如 12"><button class="ghost-btn" id="qMoreCustomOk">确定</button></div>
      </div>` : "";
    zone.innerHTML = moreHtml + moreCustomHtml;
    zone.querySelectorAll(".qc-opt").forEach(c => {
      c.addEventListener("click", () => { toggleQVal(s, c.dataset.v); syncQStates(s); updateQHint(s); updateQNav(); });
    });
    const setN = (n) => {
      if (n >= 1 && n <= 30) {
        obState[s.key] = String(n);
        obState["__custom_" + s.key] = false;
        syncQStates(s); updateQHint(s); updateQNav();
        toast("已设定 " + n + " 人一起吃");
      }
    };
    zone.querySelectorAll(".q-custom-chips .chip").forEach(ch => {
      ch.addEventListener("click", () => setN(Number(ch.dataset.n)));
    });
    const ok2 = $("#qMoreCustomOk");
    if (ok2) {
      const doSet2 = () => setN(parseInt($("#qMoreCustomNum").value, 10));
      ok2.addEventListener("click", doSet2);
      const inp2 = $("#qMoreCustomNum");
      if (inp2) inp2.addEventListener("keydown", e => { if (e.key === "Enter") doSet2(); });
    }
    syncQStates(s);
  }

  function renderCustomZone(s) {
    const zone = $("#qCustomZone");
    if (!zone) return;
    if (s.custom !== "people" || !obState["__custom_" + s.key]) { zone.innerHTML = ""; return; }
    zone.innerHTML = `<div class="q-custom" id="qCustom">
      <span class="q-custom-tip">🎉 一共有几个人吃？</span>
      <div class="q-custom-chips" id="qCustomChips">${[6, 8, 10, 12, 15, 20].map(n => `<button class="chip" data-n="${n}">${n} 人</button>`).join("")}</div>
      <div class="q-custom-row"><input type="number" id="qCustomNum" min="1" max="30" placeholder="或直接输入，如 7"><button class="btn-primary" id="qCustomOk">确定</button></div>
    </div>`;
    const setN = (n) => {
      if (n >= 1 && n <= 30) {
        obState[s.key] = String(n);
        obState["__custom_" + s.key] = false;
        renderCustomZone(s); syncQStates(s); updateQHint(s); updateQNav();
        toast("已设定 " + n + " 人一起吃");
      }
    };
    $("#qCustomChips").querySelectorAll(".chip").forEach(ch => {
      ch.addEventListener("click", () => setN(Number(ch.dataset.n)));
    });
    const ok = $("#qCustomOk");
    ok.addEventListener("click", () => setN(parseInt($("#qCustomNum").value, 10)));
    const inp = $("#qCustomNum");
    if (inp) inp.addEventListener("keydown", e => { if (e.key === "Enter") setN(parseInt(inp.value, 10)); });
  }

  function updateQHint(s) {
    const cur = obState[s.key];
    const arr = s.multi ? (Array.isArray(cur) ? cur : []) : (cur ? [cur] : []);
    const hintEl = $("#qHint");
    if (hintEl) hintEl.textContent = fmtQHint(s, arr);
  }

  function toggleQVal(s, v) {
    if (s.multi) {
      const arr = Array.isArray(obState[s.key]) ? obState[s.key].slice() : [];
      const i = arr.indexOf(v);
      if (i >= 0) arr.splice(i, 1); else arr.push(v);
      obState[s.key] = arr;
    } else {
      obState[s.key] = obState[s.key] === v ? null : v;
    }
  }

  function fmtQHint(s, arr) {
    if (!arr.length) return s.hint;
    const D = CUSTOM[s.custom];
    const names = arr.map(v => { const o = [...D.mains, ...D.more].find(x => x.v === v); return o ? o.emoji + o.label : v; }).join(" ");
    if (s.custom === "cuisine") return "已宠： " + names + " · 菜品池按这些口味来安排";
    if (s.custom === "people") {
      if (arr.length === 1 && /^\d+$/.test(arr[0])) return "👥 " + arr[0] + " 人 · 分量按这个来";
      return "👥 " + names + " · 分量按这个来";
    }
    if (s.custom === "avoid") return "已记下忌口： " + names + " · 放心，都避开";
    return names;
  }

  function bindQOpts() {
    const el = $("#qOpts");
    el.addEventListener("click", (e) => {
      const chip = e.target.closest(".qc-opt");
      if (!chip) return;
      const multi = el.dataset.multi === "1";
      if (multi) {
        chip.classList.toggle("active");
        if (chip.dataset.val === "none") {
          el.querySelectorAll(".qc-opt").forEach(x => { if (x.dataset.val !== "none") x.classList.remove("active"); });
        } else {
          const none = el.querySelector('.qc-opt[data-val="none"]');
          if (none) none.classList.remove("active");
        }
      } else {
        const was = chip.classList.contains("active");
        el.querySelectorAll(".qc-opt").forEach(x => x.classList.remove("active"));
        if (!was) chip.classList.add("active");
      }
      // 同步写入本次选择，立即启用「下一步」
      obState[currentQStep().key] = multi
        ? Array.from(el.querySelectorAll(".qc-opt.active")).map(x => x.dataset.val)
        : (el.querySelector(".qc-opt.active") ? el.querySelector(".qc-opt.active").dataset.val : null);
      updateQNav();
    });
  }

  function flavorDesc(provinceName) {
    const fk = window.CHINA.flavors[provinceName];
    const rf = Engine.REGION_FLAVOR[fk];
    if (!rf) return "";
    return rf.desc.replace(/^你来自[^，]*，/, "");
  }

  /* ---------- 第一步：口味派系（8 大口味圈 + 省份精修） ---------- */
  const REGION_CIRCLES = [
    { key: "sichuan", emoji: "🌶️", name: "川渝派", words: "麻辣鲜香", dish: "火锅 · 回锅肉", provs: ["四川省", "重庆市"] },
    { key: "central", emoji: "🥘", name: "两湖派", words: "辣香浓郁", dish: "剁椒鱼头", provs: ["湖南省", "湖北省", "江西省"] },
    { key: "north", emoji: "🍜", name: "北方派", words: "咸鲜 · 爱面食", dish: "炸酱面 · 饺子", provs: ["北京市", "天津市", "河北省", "山东省", "河南省", "山西省"] },
    { key: "northeast", emoji: "🥟", name: "东北派", words: "咸鲜豪爽 · 炖菜", dish: "锅包肉 · 炖鸡", provs: ["辽宁省", "吉林省", "黑龙江省"] },
    { key: "northwest", emoji: "🍖", name: "西北派", words: "牛羊 · 面食", dish: "羊肉泡馍", provs: ["陕西省", "甘肃省", "宁夏回族自治区", "青海省", "新疆维吾尔自治区", "内蒙古自治区"] },
    { key: "jiangnan", emoji: "🍲", name: "江浙派", words: "清淡甜鲜", dish: "清蒸鱼 · 糖醋", provs: ["上海市", "江苏省", "浙江省", "安徽省", "福建省"] },
    { key: "guangdong", emoji: "🍵", name: "广粤派", words: "原味 · 爱喝汤", dish: "白切鸡 · 靓汤", provs: ["广东省", "广西壮族自治区", "海南省"] },
    { key: "southwest", emoji: "🍚", name: "云贵派", words: "酸辣 · 多民族", dish: "酸汤鱼", provs: ["贵州省", "云南省", "西藏自治区"] }
  ];

  function circleOfRegion(val) {
    if (!val) return null;
    return REGION_CIRCLES.find(c => c.key === val || c.provs.includes(val)) || null;
  }

  function renderQRegions(s) {
    const qCard = $("#qCard");
    const selArr = Array.isArray(obState.region) ? obState.region.slice() : (obState.region ? [obState.region] : []);
    const cards = REGION_CIRCLES.map(c => {
      const active = selArr.includes(c.key) || selArr.some(v => c.provs.includes(v));
      return `<button class="rc-card ${active ? "active" : ""}" data-key="${c.key}">
        <span class="rc-emoji">${c.emoji}</span>
        <span class="rc-name">${c.name}</span>
        <span class="rc-words">${c.words}</span>
        <span class="rc-dish">${c.dish}</span>
      </button>`;
    }).join("");
    // 省份精修：仅当「只选了一个派系且没落到具体省份」时展示
    const singleCircle = REGION_CIRCLES.find(c => selArr.length === 1 && (c.key === selArr[0] || c.provs.includes(selArr[0])));
    const showProvs = selArr.length === 1 && singleCircle && !singleCircle.provs.includes(selArr[0]);
    const provs = showProvs ? singleCircle.provs.map(p => {
      const active = selArr.includes(p);
      return `<button class="chip rc-prov ${active ? "active" : ""}" data-p="${p}">${p.replace(/省|市|自治区|壮族|回族|维吾尔|特别行政区/g, "")}</button>`;
    }).join("") : "";
    qCard.innerHTML = `
      <div class="q-step">${String(obStep + 1).padStart(2, "0")}<span>/ ${OB_STEPS.length}</span></div>
      <h3 class="q-title serif">${s.title}</h3>
      <div class="rc-grid">${cards}</div>
      <div class="rc-prov-wrap" id="rcProvWrap" ${showProvs ? "" : "style='display:none'"}>
        <p class="rc-prov-tip">再选个省份更精准 <em>（不选就用派系口味）</em></p>
        <div class="chips rc-prov-list">${provs}</div>
      </div>
      <p class="field-hint" id="qHint"></p>`;
    function updateHint() {
      const h = $("#qHint");
      if (!selArr.length) {
        h.textContent = "口味可以多选哦，都吃都爱就都点上，菜品池会按你的混搭口味来 👇";
        return;
      }
      const desc = selArr.map(v => {
        const c = REGION_CIRCLES.find(x => x.key === v);
        if (c) return c.emoji + c.name;
        return "📍" + v;
      }).join(" + ");
      h.textContent = "已选 " + desc
        + (selArr.length > 1 ? " · 多口味混合，菜品池会兼顾你的偏好" : " · 再选个省份更精准（可选）");
    }
    qCard.querySelectorAll(".rc-card").forEach(c => {
      c.addEventListener("click", () => {
        const key = c.dataset.key;
        let arr = selArr.slice();
        // 若当前落在该圈省份上 → 归并为圈本身
        const cObj = REGION_CIRCLES.find(x => x.key === key);
        if (arr.some(v => cObj.provs.includes(v))) {
          arr = arr.filter(v => !cObj.provs.includes(v));
          arr.push(key);
        } else if (arr.includes(key)) {
          arr = arr.filter(k => k !== key);
        } else {
          arr.push(key);
        }
        obState.region = arr;
        renderQRegions(s);
        updateQNav();
      });
    });
    qCard.querySelectorAll(".rc-prov").forEach(p => {
      p.addEventListener("click", () => {
        obState.region = [p.dataset.p];
        renderQRegions(s);
        updateQNav();
      });
    });
    updateHint();
    updateQProgress();
    updateQNav();
  }

  function renderQMap(s) {
    const qCard = $("#qCard");
    const sel = obState.region || "";
    const paths = window.CHINA.provinces.map(p =>
      `<path class="china-p ${sel === p.n ? "sel" : ""}" data-name="${p.n}" d="${p.d}"/>`
    ).join("");
    const hintTxt = sel ? ("📍 " + sel + " · " + flavorDesc(sel)) : "点一下你的家乡 👆";
    qCard.innerHTML = `
      <div class="q-step">${String(obStep + 1).padStart(2, "0")}<span>/ ${OB_STEPS.length}</span></div>
      <h3 class="q-title serif">${s.title}</h3>
      <div class="china-box">
        <svg viewBox="0 0 740 430" class="china-map" preserveAspectRatio="xMidYMid meet">${paths}</svg>
      </div>
      <p class="field-hint" id="qHint">${hintTxt}</p>`;
    qCard.querySelectorAll(".china-p").forEach(p => {
      p.addEventListener("click", () => {
        obState.region = p.dataset.name;
        qCard.querySelectorAll(".china-p").forEach(x => x.classList.toggle("sel", x === p));
        const h = $("#qHint");
        h.textContent = "📍 " + p.dataset.name + " · " + flavorDesc(p.dataset.name);
        updateQNav();
      });
      p.addEventListener("mouseenter", () => {
        const h = $("#qHint");
        const fk = window.CHINA.flavors[p.dataset.name];
        h.textContent = "📍 " + p.dataset.name + (fk ? " · " + flavorDesc(p.dataset.name) : "");
      });
      p.addEventListener("mouseleave", () => {
        const h = $("#qHint");
        h.textContent = sel ? ("📍 " + sel + " · " + flavorDesc(sel)) : "点一下你的家乡 👆";
      });
    });
    updateQProgress();
    updateQNav();
  }

  function updateQNav() {
    $("#btnQPrev").disabled = obStep === 0;
    const s = currentQStep();
    let has;
    if (s.multi) has = (obState[s.key] || []).length > 0;
    else has = !!obState[s.key];
    $("#btnQNext").disabled = !has;
    $("#btnQNext").textContent = obStep === OB_STEPS.length - 1 ? "开始使用" : "下一步";
  }

  function goQNext() {
    const s = currentQStep();
    if (!s.custom && !s.map && !s.region) {
      const el = $("#qOpts");
      obState[s.key] = s.multi
        ? Array.from(el.querySelectorAll(".qc-opt.active")).map(x => x.dataset.val)
        : (el.querySelector(".qc-opt.active") ? el.querySelector(".qc-opt.active").dataset.val : null);
    }
    if (obStep === OB_STEPS.length - 1) { finishOnboard(); return; }
    obStep++;
    renderQStep();
  }
  function goQPrev() {
    if (obStep === 0) return;
    obStep--;
    renderQStep();
  }
  $("#btnQNext").addEventListener("click", goQNext);
  $("#btnQPrev").addEventListener("click", goQPrev);

  $("#btnSkipOnboard").addEventListener("click", () => {
    prefs = { region: "other", people: 2, cooker: "newbie", spicy: 1, avoid: ["none"], health: "none" };
    savePrefs(); enterApp(); toast("已按大众口味为你推算");
  });

  function cuisineToFlavor(v) {
    if (!v) return "other";
    if (["sichuan", "guangdong", "central", "jiangnan", "other"].includes(v)) return v;
    const o = CUISINE.more.find(x => x.v === v);
    return o ? o.flavor : "other";
  }
  function finishOnboard() {
    const regArr = (Array.isArray(obState.region) ? obState.region : (obState.region ? [obState.region] : []))
      .map(cuisineToFlavor).filter((v, i, a) => a.indexOf(v) === i);
    prefs = {
      region: regArr.length ? regArr : "other",
      people: Number(obState.people || 2),
      cooker: obState.cooker || "newbie",
      spicy: Number(obState.spicy || 1),
      avoid: obState.avoid && obState.avoid.length ? obState.avoid : ["none"],
      health: obState.health || "none"
    };
    savePrefs();
    enterApp();
    toast("记住了，以后都按你的口味来 🍅");
  }

  /* ============================================================
     ② 在家吃
     ============================================================ */
  bindChips($("#hmPeople"), updateHmSummary);
  bindChips($("#hmCooker"), updateHmSummary);
  bindChips($("#hmMood"));

  /* 在家吃：当前设定摘要 + 临时调整折叠 */
  function hmChipLabel(group, key) {
    const map = {
      people: { "1": "1 人", "2": "2 人", "3": "3 人", "4": "4 人", "5": "5 人", "6": "6 人", "8": "8 人", "10": "10 人" },
      cooker: { "lazy": "懒人掌勺", "newbie": "新手掌勺", "pro": "老手掌勺" }
    };
    if (group === "people") return map.people[key] || (key ? key + " 人" : "");
    return (map[group] && map[group][key]) || "";
  }
  function regionSummary() {
    const arr = (Array.isArray(prefs.region) ? prefs.region : (prefs.region ? [prefs.region] : [])).filter(v => v !== "other");
    if (!arr.length) return "大众口味";
    const names = arr.map(v => {
      const c = REGION_CIRCLES.find(x => x.key === v);
      if (c) return c.emoji + c.name;
      const fc = REGION_CIRCLES.find(x => x.provs.includes(v));
      return (fc ? fc.emoji : "📍") + v;
    });
    return names.join(" + ");
  }
  function updateHmSummary() {
    const p = Number(chipVal($("#hmPeople")) || prefs.people || 2);
    const c = chipVal($("#hmCooker")) || prefs.cooker || "newbie";
    const el = $("#hmSummary");
    if (el) el.innerHTML = `<b>👥 ${hmChipLabel("people", String(p))}</b>　<b>${hmChipLabel("cooker", c)}</b>　<span class="hm-taste">${regionSummary()}</span>`;
  }
  $("#btnHmAdjust").addEventListener("click", () => {
    $("#hmExtra").classList.toggle("open");
    const open = $("#hmExtra").classList.contains("open");
    $("#btnHmAdjust .hm-caret").textContent = open ? "▴" : "▾";
  });

  async function generateHome(showToast) {
    const opts = {
      people: Number(chipVal($("#hmPeople")) || prefs.people || 2),
      cooker: chipVal($("#hmCooker")) || prefs.cooker || "newbie",
      mood: chipVal($("#hmMood")) || "balance",
      spicyTarget: prefs.spicy
    };
    const res = Engine.genHomeMenu(opts, prefs);
    homeState = res;
    let reason = Engine.buildReason(res.dishes, res.ctx, "home", opts, prefs);
    try {
      const aiReason = await Promise.race([
        window.AI.enhanceReason(res.dishes, res.ctx, "home", opts, prefs),
        new Promise(r => setTimeout(() => r(null), 6000))   // AI 挂起 6 秒超时兜底
      ]);
      if (aiReason) reason = aiReason;
    } catch (e) { /* AI 异常 → 用本地文案 */ }

    $("#homeReason").textContent = reason;
    renderMenuList($("#homeMenuList"), res.dishes, "home");
    showView("home-result");
    window.scrollTo({ top: 0 });
    if (showToast) toast("已为你推算今日菜单");
  }

  $("#btnGenHome").addEventListener("click", () => generateHome(true));
  $("#btnShuffleHome").addEventListener("click", () => generateHome(false));

  /* ---------- 菜单卡片渲染 ---------- */
  function renderMenuList(el, dishes, mode) {
    el.innerHTML = dishes.map((d, i) => {
      const t = TYPE_META[d.type];
      const tags = [
        { text: d.cuisine + "菜", cls: "ghost" },
        { text: d.time + " 分钟", cls: "ghost" },
        { text: DIFF_TEXT[d.diff], cls: d.diff === 1 ? "green" : "accent" },
        { text: d.kcal + " 千卡", cls: "ghost" }
      ];
      if (d.protein >= 25) tags.push({ text: "高蛋白 " + d.protein + "g", cls: "green" });
      if (d.coop >= 2) tags.push({ text: "协作 " + "★".repeat(d.coop), cls: "accent" });
      const coopLine = mode === "couple" && d.coop > 0
        ? `<div class="coop">协作强度 <span class="stars">${"★".repeat(d.coop)}${"☆".repeat(3 - d.coop)}</span> 两人配合更出彩</div>` : "";
      const nh = Engine.assessNutrition(d);
      const swapBtn = (mode === "home" || mode === "couple")
        ? `<button class="mc-swap" data-idx="${i}" data-mode="${mode}">↻ 换一换</button>` : "";
      return `
        <div class="menu-card" data-id="${d.id}" data-mode="${mode}">
          <div class="mc-top">
            <div>
              <div class="mc-name">${d.name}</div>
              <div class="mc-sub">${d.desc}</div>
            </div>
            <span class="mc-type ${t.cls}">${t.emoji} ${t.label}</span>
          </div>
          <div class="mc-tags">${tags.map(x => `<span class="tag ${x.cls}">${x.text}</span>`).join("")}</div>
          ${coopLine}
          <div class="mc-health" title="点开菜名查看完整健康档案">🌿 ${nh.summary}</div>
          ${swapBtn}
        </div>`;
    }).join("");
    el.querySelectorAll(".menu-card").forEach(card => {
      card.addEventListener("click", () => openRecipe(Number(card.dataset.id), card.dataset.mode));
    });
    el.querySelectorAll(".mc-swap").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        swapDish(btn.dataset.mode, Number(btn.dataset.idx));
      });
    });
  }

  /* ---------- 单菜换一换 ---------- */
  function swapDish(mode, index) {
    let dishes, opts, el;
    if (mode === "home") {
      if (!homeState || !homeState.dishes.length) { toast("先推算菜单吧"); return; }
      dishes = homeState.dishes;
      opts = { people: Number(chipVal($("#hmPeople")) || 2), cooker: chipVal($("#hmCooker")) || "newbie", mood: chipVal($("#hmMood")) || "balance", spicyTarget: prefs.spicy };
      el = $("#homeMenuList");
    } else if (mode === "couple") {
      if (!coupleState || !coupleState.dishes.length) { toast("先推算协作菜单吧"); return; }
      dishes = coupleState.dishes;
      opts = { occasion: chipVal($("#cpOccasion")) || "daily", spicy: Number(chipVal($("#cpSpicy")) || 0), people: 2 };
      el = $("#coupleMenuList");
    } else return;
    const nd = Engine.altDish(dishes, index, opts, prefs, mode);
    if (!nd) { toast("同类菜都换过了，试试「换一批」"); return; }
    dishes[index] = nd;
    renderMenuList(el, dishes, mode);
    toast("已换一道：" + nd.name);
  }

  /* ============================================================
     ③ 菜谱详情
     ============================================================ */
  function openRecipe(id, mode) {
    const d = window.RECIPES.find(r => r.id === id);
    if (!d) return;
    viewingRecipe = d;
    const t = TYPE_META[d.type];
    $("#recipeHead").innerHTML = `
      <div class="recipe-hero">
        <span class="mc-type ${t.cls}" style="display:inline-block;margin-bottom:10px">${t.emoji} ${t.label}</span>
        <h2 class="serif recipe-name">${d.name}</h2>
        <p class="recipe-sub">${d.cuisine}菜 · ${d.desc}</p>
        <div class="recipe-stats">
          <div class="stat"><b>${d.time}′</b><span>分钟</span></div>
          <div class="stat"><b>${DIFF_TEXT[d.diff]}</b><span>难度</span></div>
          <div class="stat"><b>${d.kcal}</b><span>千卡/份</span></div>
        </div>
        <div class="mc-tags" style="margin-top:14px">
          ${d.protein >= 20 ? `<span class="tag green">蛋白质 ${d.protein}g</span>` : ""}
          ${d.coop >= 2 ? `<span class="tag accent">协作 ${"★".repeat(d.coop)}</span>` : ""}
          ${d.health.map(h => `<span class="tag green">${h === "fitness" ? "减脂友好" : h === "sugar" ? "控糖友好" : "清淡"}</span>`).join("")}
        </div>
      </div>`;
    const nh = Engine.assessNutrition(d);
    $("#recipeBody").innerHTML = `
      <div class="section-block health-block">
        <h3>🥗 健康档案 <span class="health-level">${nh.level}</span></h3>
        <div class="health-score"><span>综合健康度</span><b>${nh.score}</b></div>
        <div class="health-list">
          <div class="hl-title">🌿 有助于补充</div>
          <ul>${nh.benefits.map(b => `<li>${b}</li>`).join("")}</ul>
        </div>
        <div class="health-list">
          <div class="hl-title">⚠️ 注意事项</div>
          <ul class="hl-warn">${nh.cautions.map(c => `<li>${c}</li>`).join("")}</ul>
        </div>
      </div>
      <div class="section-block">
        <h3>食材（${prefs.people || 2}人份）</h3>
        <ul class="ingredient-list">${d.ing.map(([n, q]) => `<li><span>${n}</span><span class="qty">${q}</span></li>`).join("")}</ul>
      </div>
      <div class="section-block">
        <h3>做法</h3>
        <ol class="step-list">${d.steps.map(s => `<li>${s}</li>`).join("")}</ol>
      </div>`;
    showView("recipe");
  }

  /* ============================================================
     ④ 买菜清单
     ============================================================ */
  $("#btnGoList").addEventListener("click", () => {
    if (!homeState || !homeState.dishes.length) { toast("先为你推算菜单吧"); return; }
    const hid = saveHistory("home", homeState.ctx.people, homeState.dishes);
    listState = { dishes: homeState.dishes, people: homeState.ctx.people, historyId: hid };
    renderList();
    showView("list");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* 情侣一起做的买菜清单 */
  $("#btnCoupleList").addEventListener("click", () => {
    if (!coupleState || !coupleState.dishes.length) { toast("先推算协作菜单吧"); return; }
    listState = { dishes: coupleState.dishes, people: 2, historyId: coupleState.historyId };
    renderList();
    showView("list");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  function renderList() {
    const { out, scale, total, pantry, pantryTotal } = Engine.buildList(listState.dishes, listState.people);
    const low = Math.round(total * 0.85);
    const high = Math.round(total * 1.2);
    const count = out.reduce((s, g) => s + g.items.length, 0);
    $("#listMeta").textContent = `按 ${listState.people} 人份 · 建议购买量已换算`;
    $("#shoppingList").innerHTML = `
      <div class="list-summary">
        <span>需要采购 <b id="buyCount">${count} 样</b></span>
        <span class="sum-price" id="buyPrice">约 ¥${low}–${high}</span>
      </div>
      ${out.map(({ g, items, subtotal }) => `
        <div class="shop-group">
          <h4>${g}<span class="grp-total">约 ¥${subtotal}</span></h4>
          ${items.map(it => `
            <div class="shop-item" data-price="${it.price}" data-name="${it.name}">
              <span class="name">${it.name}</span>
              <span class="qty">${it.scaled}<em class="est">≈¥${it.price}</em></span>
              <span class="tick" title="点我标记已买到"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5 9-10"/></svg></span>
            </div>`).join("")}
        </div>`).join("")}
      ${pantry.length ? `
        <div class="pantry">
          <button class="pantry-head" id="pantryToggle" type="button">
            <span class="ph-ico">🧂</span>
            <span class="ph-txt">厨房常备<b>${pantry.length} 样 · 家里大概率有</b></span>
            <i class="ph-arrow">▾</i>
          </button>
          <div class="pantry-body" id="pantryBody" hidden>
            <div class="pantry-items">${pantry.map(it => it.name).join(" · ")}</div>
            <p class="pantry-note">这些调料一般家里都有，不用特意买；缺哪样路过顺手带一下即可（若全补齐约 ¥${pantryTotal}）</p>
          </div>
        </div>` : ""}
      <p class="list-tip">点右侧 <i>○</i> 标记已买到 · 待买金额会跟着扣减</p>`;

    // 勾选联动：勾掉一项 → 待采购数量与金额实时扣减
    function refreshTotals() {
      let remain = 0, remainCount = 0, bought = 0;
      $$("#shoppingList .shop-item").forEach(it => {
        const p = parseFloat(it.dataset.price || 0);
        if (it.classList.contains("checked")) bought += p;
        else { remain += p; remainCount++; }
      });
      remain = Math.round(remain * 10) / 10;
      bought = Math.round(bought * 10) / 10;
      const lo = Math.max(0, Math.round(remain * 0.85));
      const hi = Math.max(0, Math.round(remain * 1.2));
      const bc = document.getElementById("buyCount");
      const bp = document.getElementById("buyPrice");
      const bt = document.getElementById("buyTotal");
      const pl = document.getElementById("ptLabel");
      if (remainCount === 0) {
        if (bc) bc.textContent = "全部买齐";
        if (bp) bp.textContent = "✓ 合计 ¥" + bought;
        if (pl) pl.innerHTML = "本次合计<em>已全部勾选，以下为精确金额</em>";
        if (bt) bt.innerHTML = "¥" + bought;
      } else {
        if (bc) bc.textContent = remainCount + " 样";
        if (bp) bp.textContent = "约 ¥" + lo + "–" + hi;
        if (pl) pl.innerHTML = "剩余待买<em>勾选已买项，金额自动扣减</em>";
        if (bt) bt.innerHTML = "¥" + lo + "<span>–</span>¥" + hi;
      }
      // 更新分组小计
      $$("#shoppingList .shop-group").forEach(grp => {
        let s = 0;
        grp.querySelectorAll(".shop-item:not(.checked)").forEach(it => s += parseFloat(it.dataset.price || 0));
        const el = grp.querySelector(".grp-total");
        if (el) el.textContent = "约 ¥" + (Math.round(s * 10) / 10);
      });
    }
    $$("#shoppingList .shop-item").forEach(item => {
      const tick = item.querySelector(".tick");
      tick.addEventListener("click", () => {
        item.classList.toggle("checked");
        refreshTotals();
      });
    });
    // 折叠/展开厨房常备
    const pt = document.getElementById("pantryToggle");
    if (pt) pt.addEventListener("click", () => {
      const body = document.getElementById("pantryBody");
      const open = body.hidden;
      body.hidden = !open;
      pt.querySelector(".ph-arrow").textContent = open ? "▴" : "▾";
    });
    $("#priceTotal").innerHTML = `
      <div class="pt-label" id="ptLabel">剩余待买<em>勾选已买项，金额自动扣减</em></div>
      <div class="pt-num" id="buyTotal">¥${low}<span>–</span>¥${high}</div>`;
    $("#channelAdvice").innerHTML = Engine.channelAdvice(listState.people).map(c => `
      <a class="channel" href="${c.url}" target="_blank" rel="noopener noreferrer">
        <span class="ch-icon">${c.icon}</span>
        <b>${c.name}<i class="ch-go">↗</i></b>
        <span class="ch-sub">${c.sub}</span>
      </a>`).join("");
  }

  $("#btnCopyList").addEventListener("click", () => {
    if (!listState) return;
    const { out, total, pantry } = Engine.buildList(listState.dishes, listState.people);
    let text = "🛒 今晚买菜清单（预估 ¥" + Math.round(total * 0.85) + "–" + Math.round(total * 1.2) + "）\n";
    out.forEach(({ g, items }) => {
      text += `【${g}】\n`;
      items.forEach(it => text += `☐ ${it.name} ${it.scaled} ≈¥${it.price}\n`);
    });
    if (pantry.length) text += `\n🧂 厨房常备（大概率有，缺了顺手带）：${pantry.map(p => p.name).join("、")}\n`;
    text += "\n—— 来自「今天吃啥 AI 版」";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast("清单已复制，发给你家买菜的人吧")).catch(() => fallbackCopy(text));
    } else { fallbackCopy(text); }
  });
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); document.body.removeChild(ta);
    toast("清单已复制");
  }

  $("#btnClearList").addEventListener("click", () => {
    $("#shoppingList").innerHTML = "";
    $("#channelAdvice").innerHTML = "";
    $("#priceTotal").innerHTML = "";
    listState = null;
    toast("已清空");
  });

  /* ============================================================
     ⑤ 情侣一起做
     ============================================================ */
  bindChips($("#cpOccasion"));
  bindChips($("#cpSpicy"));

  async function generateCouple(showToast) {
    const opts = {
      occasion: chipVal($("#cpOccasion")) || "daily",
      spicy: Number(chipVal($("#cpSpicy")) || 0),
      people: 2
    };
    const res = Engine.genCoupleMenu(opts, prefs);
    coupleState = res;
    let reason = Engine.buildReason(res.dishes, res.ctx, "couple", opts, prefs);
    try {
      const aiReason = await Promise.race([
        window.AI.enhanceReason(res.dishes, res.ctx, "couple", opts, prefs),
        new Promise(r => setTimeout(() => r(null), 6000))
      ]);
      if (aiReason) reason = aiReason;
    } catch (e) { /* AI 异常 → 用本地文案 */ }

    $("#coupleReason").textContent = reason;
    renderMenuList($("#coupleMenuList"), res.dishes, "couple");
    $("#coupleResult").classList.remove("hidden");
    $("#couplePlay").classList.add("hidden");
    if (showToast) toast("为你们挑了适合一起做的菜");
  }

  $("#btnGenCouple").addEventListener("click", () => generateCouple(true));
  $("#btnShuffleCouple").addEventListener("click", () => generateCouple(false));

  /* 分工卡 */
  $("#btnDrawRoles").addEventListener("click", drawRolesPlay);
  function drawRolesPlay() {
    if (!coupleState || !coupleState.dishes.length) { toast("先推算协作菜单吧"); return; }
    const roles = Engine.drawRoles();
    coupleState.roles = roles;
    coupleState.task = null;
    coupleState.historyId = saveHistory("couple", 2, coupleState.dishes, chipVal($("#cpOccasion")) || "daily");
    const nm = loverName();
    $("#roleCards").innerHTML = `
      <div class="role-card person-a">
        <span class="rc-person">${nm || roles.a.label}</span>
        <div class="rc-label">分工卡 A</div>
        <div class="rc-name">${roles.a.name}</div>
        <div class="rc-duty">${roles.a.duty}</div>
      </div>
      <div class="role-card person-b">
        <span class="rc-person">${myName() || roles.b.label}</span>
        <div class="rc-label">分工卡 B</div>
        <div class="rc-name">${roles.b.name}</div>
        <div class="rc-duty">${roles.b.duty}</div>
      </div>`;
    $("#loveTask").innerHTML = "";
    showQuiz();
    $("#couplePlay").classList.remove("hidden");
    toast("分工卡已抽出");
    // 更新恋爱进度，解锁成就则提示
    const ach = renderCoupleProgress();
    if (ach) setTimeout(() => toast(ach), 400);
  }

  /* ---------- 今日默契一问 ---------- */
  let curQuiz = null;
  function showQuiz() {
    const card = $("#quizCard");
    card.classList.remove("hidden");
    curQuiz = QUIZ_POOL[Math.floor(Math.random() * QUIZ_POOL.length)];
    const nm = loverName();
    const rep = (t) => nm ? t.replace(/\s*TA\s*/g, nm) : t;
    $("#qText").textContent = rep(curQuiz.q);
    $("#qOpts").innerHTML = curQuiz.o.map((o, i) =>
      `<button class="q-opt" data-i="${i}">${o}</button>`).join("");
    $("#qReveal").textContent = "";
    $("#qReveal").classList.add("hidden");
    $("#btnNextQuiz").classList.add("hidden");
  }
  function bindQuiz() {
    $("#qOpts").addEventListener("click", (e) => {
      const btn = e.target.closest(".q-opt");
      if (!btn || !curQuiz) return;
      const i = Number(btn.dataset.i);
      $$(".q-opt").forEach(b => b.classList.remove("chosen"));
      btn.classList.add("chosen");
      const nm = loverName();
      const rep = (t) => nm ? t.replace(/\s*TA\s*/g, nm) : t;
      $("#qReveal").textContent = rep(curQuiz.r[i]);
      $("#qReveal").classList.remove("hidden");
      $("#btnNextQuiz").classList.remove("hidden");
    });
    $("#btnNextQuiz").addEventListener("click", showQuiz);
  }
  bindQuiz();

  /* ---------- 恋爱进度 / 成就 ---------- */
  function daysTogether() {
    const anniv = localStorage.getItem(LS_ANNIV);
    if (!anniv) return null;
    const parts = anniv.split("-").map(Number);
    let y, m, d;
    if (parts.length === 3) { y = parts[0]; m = parts[1]; d = parts[2]; }
    else { m = parts[0]; d = parts[1]; y = new Date().getFullYear(); }
    const now = new Date();
    let ann = new Date(y, m - 1, d);
    if (ann > now && parts.length === 2) ann = new Date(y - 1, m - 1, d);
    return Math.max(1, Math.floor((now - ann) / 86400000) + 1);
  }
  function coupleCookCount() {
    return loadHistory().filter(r => r.theme === "couple").length;
  }
  function renderCoupleProgress() {
    const box = $("#loveProgress");
    if (!box) return null;
    box.classList.remove("hidden");
    const nm = loverName();
    const days = daysTogether();
    $("#lpDays").textContent = days || "—";
    $("#lpLabel").textContent = nm ? ("和 " + nm + " 在一起 · 天") : "在一起 · 天";
    $("#btnSetAnniv").textContent = "💗 纪念日";
    $("#btnSetName").textContent = nm ? ("✏️ " + nm) : "✏️ TA 的名字";
    $("#btnSetMyName").textContent = myName() ? ("✏️ " + myName()) : "✏️ 我的名字";
    const count = coupleCookCount();
    $("#lpCount").textContent = count;
    const reached = COUPLE_ACHIEVEMENTS.filter(a => count >= a.need);
    const next = COUPLE_ACHIEVEMENTS.find(a => count < a.need);
    $("#lpNext").textContent = next ? `距「${next.name}」还差 ${next.need - count} 次` : "全部成就已达成 🏆";
    $("#lpFill").style.width = next ? Math.min(100, Math.round(count / next.need * 100)) + "%" : "100%";
    let badgesHTML = COUPLE_ACHIEVEMENTS.map(a => {
      const got = count >= a.need;
      return `<span class="badge ${got ? "got" : ""}" title="${a.desc}"><span class="bd-ico">${got ? a.icon : "🔒"}</span>${a.name}</span>`;
    }).join("");
    if (localStorage.getItem(LS_ANNIV)) {
      badgesHTML += `<span class="badge got" title="纪念日已设置，每天帮你算在一起多少天"><span class="bd-ico">📅</span>纪念日</span>`;
    }
    $("#lpBadges").innerHTML = badgesHTML;
    let tipped = [];
    try { tipped = JSON.parse(localStorage.getItem(LS_ACH_TIP) || "[]"); } catch (e) {}
    const fresh = reached.filter(a => !tipped.includes(a.need));
    if (fresh.length) {
      localStorage.setItem(LS_ACH_TIP, JSON.stringify([...tipped, ...fresh.map(a => a.need)]));
      return `🎉 解锁成就「${fresh[fresh.length - 1].name}」${fresh[fresh.length - 1].icon}`;
    }
    return null;
  }

  /* 纪念日设置 */
  function loverName() { return (localStorage.getItem(LS_LOVER_NAME) || "").trim(); }
  function myName() { return (localStorage.getItem(LS_MY_NAME) || "").trim(); }
  function initAnnivSelects() {
    const nowY = new Date().getFullYear();
    const y = $("#anYear"), m = $("#anMonth"), d = $("#anDay");
    y.innerHTML = Array.from({ length: nowY - 1989 }, (_, i) => `<option value="${nowY - i}">${nowY - i} 年</option>`).join("");
    m.innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1} 月</option>`).join("");
    d.innerHTML = Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1} 日</option>`).join("");
    y.value = nowY; m.value = 1; d.value = 1;
  }
  initAnnivSelects();
  $("#btnSetAnniv").addEventListener("click", () => {
    $("#loveProgress").classList.add("hidden");
    $("#nameSet").classList.add("hidden");
    $("#annivSet").classList.remove("hidden");
  });
  $("#btnSaveAnniv").addEventListener("click", () => {
    const val = $("#anYear").value + "-" + $("#anMonth").value + "-" + $("#anDay").value;
    localStorage.setItem(LS_ANNIV, val);
    $("#annivSet").classList.add("hidden");
    renderCoupleProgress();
    toast("纪念日已记住，往后每天帮你算在一起多少天 💗");
  });
  $("#btnSkipAnniv").addEventListener("click", () => {
    $("#annivSet").classList.add("hidden");
    renderCoupleProgress();
  });
  $("#btnSetName").addEventListener("click", () => openNameSet("ta"));
  $("#btnSetMyName").addEventListener("click", () => openNameSet("me"));
  let nameMode = "ta";
  function openNameSet(mode) {
    nameMode = mode;
    $("#loveProgress").classList.add("hidden");
    $("#annivSet").classList.add("hidden");
    $("#nameSet").classList.remove("hidden");
    if (mode === "ta") {
      $("#nameSetLabel").textContent = "TA 怎么称呼？";
      $("#nameInput").placeholder = "输入 TA 的名字或昵称，如：小美";
      $("#nameInput").value = loverName();
    } else {
      $("#nameSetLabel").textContent = "你怎么称呼？";
      $("#nameInput").placeholder = "输入你的名字或昵称，如：阿明";
      $("#nameInput").value = myName();
    }
  }
  $("#btnSaveName").addEventListener("click", () => {
    const v = $("#nameInput").value.trim();
    if (!v) { toast(nameMode === "ta" ? "先输入 TA 的名字吧" : "先输入你的名字吧"); return; }
    localStorage.setItem(nameMode === "ta" ? LS_LOVER_NAME : LS_MY_NAME, v);
    $("#nameSet").classList.add("hidden");
    renderCoupleProgress();
    toast(nameMode === "ta" ? ("记住啦，TA 的名字是" + v + " 💗") : ("记住啦，你的名字是" + v + " 💗"));
  });
  $("#btnCancelName").addEventListener("click", () => {
    $("#nameSet").classList.add("hidden");
    renderCoupleProgress();
  });

  /* 感情任务 + 纪念卡 */
  $("#btnMakeCard").addEventListener("click", async () => {
    if (!coupleState || !coupleState.dishes.length) return;
    const occasion = chipVal($("#cpOccasion")) || "daily";
    let task = Engine.loveTask(occasion);
    const aiTask = await window.AI.enhanceLoveTask(occasion, coupleState.dishes);
    if (aiTask) task = aiTask;

    const roles = coupleState.roles || Engine.drawRoles();
    const mem = Engine.buildMemorial(coupleState.dishes, roles, task);
    coupleState.memorial = mem;
    const nm = loverName(), mn = myName();
    const rolesHTML = (nm || mn)
      ? `${roles.a.name}（${nm ? `<span class="grad-name">${nm}</span>` : roles.a.label}）& ${roles.b.name}（${mn ? `<span class="grad-name">${mn}</span>` : roles.b.label}）`
      : mem.roles;
    $("#loveTask").innerHTML = `
      <div class="task-card">
        <div class="tk-label">💝 感情任务</div>
        <div class="tk-text">${task}</div>
      </div>`;
    $("#memorial").innerHTML = `
      <div class="m-date">${mem.date}</div>
      <div class="m-title serif">${mem.title}</div>
      <div class="m-dishes">${mem.dishes}</div>
      <div class="m-roles">${rolesHTML}</div>
      <div class="m-foot">${mem.foot}</div>
      <div class="m-heart">♥</div>
      <button class="btn-primary btn-block" id="btnSaveMemorial">保存图片 · 发朋友圈</button>`;
    $("#memorial").classList.remove("hidden");
    $("#btnSaveMemorial").addEventListener("click", () => {
      if (coupleState.memorial) drawMemorialCard(coupleState.memorial, coupleState.dishes, coupleState.roles);
    });
    toast("纪念卡已生成，可保存为图片");
  });

  /* ============================================================
     ⑥ Tab 与返回
     ============================================================ */
  $("#tabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    showView(tab.dataset.view);
  });
  /* 顶部固定返回按钮：弹出返回栈回到上一个视图 */
  $("#btnTopBack").addEventListener("click", () => {
    const target = backStack.pop() || "home";
    showView(target, true);
  });
  $$(".back-btn").forEach(btn => {
    if (btn.id === "btnTopBack") return;   // 顶部返回按钮单独处理
    btn.addEventListener("click", () => showView(btn.dataset.back, true));
  });

  /* 进入主流程：没做过口味问答 → 先走 30 秒问答；做过 → 直接进主页 */
  function enterWithOnboard() {
    if (!prefs) {
      obStep = 0;
      renderQStep();
      showView("onboard");
      window.scrollTo({ top: 0 });
    } else {
      enterApp();
    }
  }

  /* 欢迎页入口（保留） */
  $("#btnGuestStart").addEventListener("click", () => {
    if (prefs) {
      enterApp();
      toast("已进入 · 按你的口味推算");
    } else {
      enterWithOnboard();
      toast("先回答 30 秒，为你定制口味");
    }
  });
  $("#btnReOnboard").addEventListener("click", () => {
    obStep = 0;
    renderQStep();
    showView("onboard");
    window.scrollTo({ top: 0 });
  });
  $("#btnGoLogin").addEventListener("click", () => {
    if (loadUser()) { logoutUser(); return; }
    $("#loginPhone").value = "";
    $("#loginCode").value = "";
    showView("login");
  });

  /* 登录（演示版：本地模拟） */
  $("#btnSendCode").addEventListener("click", () => {
    const p = $("#loginPhone").value.trim();
    if (!/^1\d{10}$/.test(p)) { toast("请先输入正确的 11 位手机号"); return; }
    toast("验证码已发送（演示：任意 6 位即可）");
  });
  $("#btnDoLogin").addEventListener("click", () => {
    const p = $("#loginPhone").value.trim();
    const c = $("#loginCode").value.trim();
    if (!/^1\d{10}$/.test(p)) { toast("请输入正确的 11 位手机号"); return; }
    if (!/^\d{6}$/.test(c)) { toast("请输入 6 位验证码"); return; }
    saveUser({ phone: p, nickname: "", avatar: "🍅" });
    applyUserShell();
    enterWithOnboard();
    toast("登录成功，欢迎回来 🍅");
  });

  /* ---------- 我的页（入口：底部导航「我的」tab → showView 里已 renderMeView） ---------- */
  $("#btnMeLogin").addEventListener("click", () => {
    $("#loginPhone").value = "";
    $("#loginCode").value = "";
    showView("login");
  });
  $("#btnLogoutMe").addEventListener("click", logoutUser);
  $("#btnSaveMe").addEventListener("click", () => {
    const u = loadUser();
    if (!u) { toast("请先登录后再设置昵称"); return; }
    u.nickname = $("#meNickname").value.trim();
    saveUser(u);
    applyUserShell();
    toast(u.nickname ? ("昵称已更新：" + u.nickname) : "已保存");
  });

  /* ---------- 设置中心（入口：我的页「设置」项） ---------- */
  $("#btnMeSettings").addEventListener("click", () => {
    showView("settings");
  });
  $("#setItemMe").addEventListener("click", () => {
    renderMeView();
    showView("me");
    window.scrollTo({ top: 0 });
  });
  $("#setItemOnboard").addEventListener("click", () => {
    obStep = 0;
    renderQStep();
    showView("onboard");
    window.scrollTo({ top: 0 });
  });
  $("#setItemClearHis").addEventListener("click", () => {
    if (confirm("确定清空历史记录吗？")) {
      localStorage.removeItem(LS_HISTORY);
      toast("历史记录已清空");
    }
  });
  $("#setItemClearAll").addEventListener("click", () => {
    if (confirm("确定清空全部数据吗？将删除账号、口味、历史、纪念日等所有本地数据。")) {
      localStorage.clear();
      location.reload();
    }
  });

  /* ---------- 主题 ---------- */
  const LS_THEME = "eat-ai-theme";
  function applyTheme(t) {
    const th = t || "tomato";
    document.body.setAttribute("data-theme", th);
    localStorage.setItem(LS_THEME, th);
    $$("#themeRow .theme-dot").forEach(d => d.classList.toggle("active", d.dataset.theme === th));
  }
  $("#themeRow").addEventListener("click", (e) => {
    const dot = e.target.closest(".theme-dot");
    if (!dot) return;
    applyTheme(dot.dataset.theme);
    toast("主题已切换");
  });

  /* ============================================================
     ⑧ 历史记录
     ============================================================ */
  const LS_HISTORY = "eat-ai-history";
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(LS_HISTORY) || "[]"); } catch (e) { return []; }
  }
  function persistHistory(h) { localStorage.setItem(LS_HISTORY, JSON.stringify(h)); }
  function saveHistory(theme, people, dishes, occasion) {
    const h = loadHistory();
    const rec = {
      id: "h" + Date.now(),
      ts: Date.now(),
      theme, people, occasion: occasion || "",
      ids: dishes.map(d => d.id),
      names: dishes.map(d => d.name),
      checkedIn: false
    };
    h.unshift(rec);
    persistHistory(h.slice(0, 200));
    return rec.id;
  }
  function markCheckedIn(id) {
    const h = loadHistory();
    const r = h.find(x => x.id === id);
    if (r) { r.checkedIn = true; persistHistory(h); }
  }
  function deleteHistory(id) {
    persistHistory(loadHistory().filter(x => x.id !== id));
  }
  function restoreDishes(rec) {
    return rec.ids.map(id => (window.RECIPES || []).find(r => r.id === id)).filter(Boolean);
  }
  function fmtDate(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

  function hisItemHTML(r) {
    const themeLabel = r.theme === "couple" ? "情侣" : "在家吃";
    const themeCls = r.theme === "couple" ? "couple" : "";
    const d = new Date(r.ts);
    const time = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    const status = r.checkedIn
      ? '<span class="his-status done">✓ 已打卡</span>'
      : '<span class="his-status">未打卡</span>';
    const names = r.names.slice(0, 4).map(n => `<span class="tag ghost">${n}</span>`).join("");
    const more = r.names.length > 4 ? `<span class="tag ghost">+${r.names.length - 4}</span>` : "";
    return `
      <div class="his-item" data-id="${r.id}">
        <button class="his-head" type="button">
          <span class="his-theme ${themeCls}">${themeLabel}</span>
          <span class="his-info">${r.people} 人食<small>${d.getMonth() + 1}月${d.getDate()}日 ${time}</small></span>
          ${status}
          <i class="his-arrow">▾</i>
        </button>
        <div class="his-body" hidden>
          <div class="his-dishes">${names}${more}</div>
          <div class="his-actions">
            <button class="ghost-btn" data-act="buy">再去买菜</button>
            <button class="ghost-btn" data-act="share">晒一晒</button>
            <button class="ghost-btn danger" data-act="del">删除</button>
          </div>
        </div>
      </div>`;
  }

  function renderHistory() {
    const h = loadHistory();
    const el = $("#historyList");
    if (!h.length) {
      $("#historyMeta").textContent = "还没有记录，去推算一顿吧";
      el.innerHTML = `<div class="his-empty"><div class="he-ico">🍽️</div><p>生成菜单后会在这里留档</p></div>`;
      return;
    }
    $("#historyMeta").textContent = "共 " + h.length + " 顿 · 生成菜单后自动记录";
    const now = new Date();
    const todayStr = fmtDate(now);
    const yestStr = fmtDate(new Date(now.getTime() - 86400000));
    const groups = {};
    h.forEach(r => {
      const d = new Date(r.ts);
      const ds = fmtDate(d);
      let label;
      if (ds === todayStr) label = "今天";
      else if (ds === yestStr) label = "昨天";
      else label = d.getMonth() + 1 + "月" + d.getDate() + "日";
      (groups[label] = groups[label] || []).push(r);
    });
    el.innerHTML = Object.entries(groups).map(([label, list]) => `
      <div class="his-day">${label}</div>
      ${list.map(hisItemHTML).join("")}
    `).join("");

    $$("#historyList .his-head").forEach(btn => {
      btn.addEventListener("click", () => {
        const item = btn.closest(".his-item");
        item.classList.toggle("open");
        const body = item.querySelector(".his-body");
        body.hidden = !body.hidden;
      });
    });
    $$("#historyList [data-act]").forEach(b => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const rec = loadHistory().find(x => x.id === b.closest(".his-item").dataset.id);
        if (!rec) return;
        const act = b.dataset.act;
        if (act === "buy") {
          const dishes = restoreDishes(rec);
          if (!dishes.length) { toast("菜品数据缺失"); return; }
          listState = { dishes, people: rec.people || 2 };
          renderList(); showView("list");
        } else if (act === "share") {
          openShareFromHistory(rec);
        } else if (act === "del") {
          deleteHistory(rec.id); renderHistory(); toast("已删除");
        }
      });
    });
  }

  /* ============================================================
     ⑨ 晒一晒（饭桌打卡 · 发朋友圈）
     ============================================================ */
  let shareState = null;   // {theme, dishes, people, historyId, photo, caption}

  function openShare(theme) {
    const dishes = theme === "couple" ? (coupleState && coupleState.dishes) : (homeState && homeState.dishes);
    if (!dishes || !dishes.length) { toast("先推算菜单吧"); return; }
    const people = theme === "couple" ? 2 : (homeState && homeState.ctx.people) || 2;
    let historyId = theme === "couple"
      ? (coupleState.historyId || saveHistory("couple", 2, dishes))
      : ((listState && listState.historyId) || saveHistory("home", people, dishes));
    shareState = { theme, dishes, people, historyId, caption: "" };
    renderShare();
    showView("share");
  }
  function openShareFromHistory(rec) {
    const dishes = restoreDishes(rec);
    if (!dishes.length) { toast("菜品数据缺失"); return; }
    shareState = { theme: rec.theme, dishes, people: rec.people || 2, historyId: rec.id, caption: "" };
    renderShare();
    showView("share");
  }

  function renderShare() {
    const s = shareState;
    $("#shareMeta").textContent = s.people + " 人 · " + s.dishes.map(d => d.name).join("、");
    drawShareCard();
    updateCaption();
  }

  async function drawShareCard() {
    // 确保品牌衬线字体已加载再绘制
    try {
      await document.fonts.load('700 84px "Noto Serif SC"');
      await document.fonts.ready;
    } catch (e) { /* 字体不可用时回退 */ }

    const s = shareState;
    const dishes = s.dishes.slice(0, 4);
    const canvas = document.createElement("canvas");
    canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const SERIF = '"Noto Serif SC", "Songti SC", "STSong", serif';
    const SANS = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 整体米白背景 + 留白点缀
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#FBF7F1");
    bg.addColorStop(1, "#F0E3D4");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(225,77,42,.05)";
    ctx.beginPath(); ctx.arc(W * 0.90, H * 0.13, 180, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W * 0.08, H * 0.90, 230, 0, Math.PI * 2); ctx.fill();

    // 品牌
    ctx.fillStyle = "#E14D2A";
    ctx.font = "600 28px " + SANS;
    ctx.fillText("今 天 吃 啥 · A I 版", W / 2, 92);
    ctx.strokeStyle = "rgba(225,77,42,.4)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2 - 120, 150); ctx.lineTo(W / 2 + 120, 150); ctx.stroke();

    // 大标题（衬线）+ 日期
    ctx.fillStyle = "#241D17";
    ctx.font = "700 88px " + SERIF;
    ctx.fillText(s.theme === "couple" ? "我们的饭桌" : "今日菜单", W / 2, 452);
    const d = new Date();
    ctx.fillStyle = "rgba(36,29,23,.6)";
    ctx.font = "400 34px " + SANS;
    ctx.fillText(d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日 · 星期" + "日一二三四五六"[d.getDay()], W / 2, 528);

    // 菜单横排列表：图标 | 菜名 | 类型，三列对齐 + 虚线分隔
    const rowTop = 646;
    const rowH = dishes.length <= 3 ? 152 : 120;
    ctx.textAlign = "left";
    dishes.forEach((dish, i) => {
      const cy = rowTop + i * rowH;
      const emoji = TYPE_META[dish.type] ? TYPE_META[dish.type].emoji : "🍽️";
      const t = TYPE_META[dish.type] ? TYPE_META[dish.type].label : "";
      ctx.fillStyle = "#241D17";
      ctx.font = "54px " + SANS;
      ctx.fillText(emoji, 176, cy);
      ctx.font = "600 46px " + SANS;
      ctx.fillText(dish.name, 330, cy);
      ctx.fillStyle = "rgba(36,29,23,.55)";
      ctx.font = "400 28px " + SANS;
      ctx.textAlign = "right";
      ctx.fillText(t, W - 180, cy);
      ctx.textAlign = "left";
      if (i < dishes.length - 1) {
        ctx.strokeStyle = "rgba(225,77,42,.18)";
        ctx.setLineDash([5, 9]);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(140, cy + rowH * 0.5); ctx.lineTo(W - 140, cy + rowH * 0.5); ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    ctx.textAlign = "center";

    // 动态标语：按日期轮换，每天一句
    const SLOGANS = [
      "认真吃饭的日子，也值得认真记录",
      "好好吃饭，是治愈生活的最小单位",
      "烟火气里，藏着日子的回甘",
      "一荤一素，就是稳稳的幸福",
      "食物会记得，今天你好好爱自己了",
      "人间烟火气，最抚凡人心",
      "把日子过得有滋有味，从认真吃饭开始",
      "热气腾腾的晚餐，是平凡日子里的小确幸"
    ];
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    const slogan = SLOGANS[seed % SLOGANS.length];
    const menuEnd = rowTop + dishes.length * rowH;
    const capY = Math.min(H - 128, menuEnd + 108);
    ctx.fillStyle = "#E14D2A";
    ctx.font = "500 34px " + SERIF;
    ctx.fillText(slogan, W / 2, capY);
    ctx.fillStyle = "rgba(36,29,23,.5)";
    ctx.font = "400 26px " + SANS;
    ctx.fillText("—— 来自「今天吃啥 AI 版」", W / 2, capY + 58);

    const wrap = $("#shareCardWrap");
    wrap.innerHTML = "";
    wrap.appendChild(canvas);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- 纪念卡导出图片 ---------- */
  function wrapText(ctx, text, font, maxWidth) {
    ctx.font = font;
    const chars = String(text).split("");
    const lines = [];
    let cur = "";
    for (const ch of chars) {
      if (cur && ctx.measureText(cur + ch).width > maxWidth) { lines.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  async function drawMemorialCard(mem, dishes, roles) {
    try {
      await document.fonts.load('700 66px "Noto Sans SC"');
      await document.fonts.ready;
    } catch (e) { /* 字体回退 */ }
    const c = document.createElement("canvas");
    c.width = 1080; c.height = 1440;
    const ctx = c.getContext("2d");
    const W = c.width, H = c.height;
    const SANS = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";

    // 米白渐变底
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#FBF7F1");
    bg.addColorStop(1, "#F0E2CE");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // 金色双线边框
    ctx.strokeStyle = "rgba(199,139,74,.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.strokeStyle = "rgba(199,139,74,.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(52, 52, W - 104, H - 104);

    // 品牌
    ctx.fillStyle = "#C78B4A";
    ctx.font = "600 30px " + SANS;
    ctx.fillText("今 天 吃 啥 · A I 版", W / 2, 132);
    ctx.fillStyle = "rgba(36,29,23,.5)";
    ctx.font = "400 26px " + SANS;
    ctx.fillText("用一顿饭的时间，好好相爱", W / 2, 198);

    // 大标题 + 日期
    ctx.fillStyle = "#241D17";
    ctx.font = "700 64px " + SANS;
    ctx.fillText(mem.title, W / 2, 318);
    ctx.fillStyle = "#C78B4A";
    ctx.font = "500 30px " + SANS;
    ctx.fillText(mem.date, W / 2, 398);

    // 爱心分隔
    ctx.fillStyle = "#E14D2A";
    ctx.font = "42px " + SANS;
    ctx.fillText("♥", W / 2, 468);

    // 菜名区（带图标）
    const list = (dishes || []).slice(0, 4);
    const rowTop = 566, rowH = 96;
    list.forEach((d, i) => {
      const cy = rowTop + i * rowH;
      const emoji = TYPE_META[d.type] ? TYPE_META[d.type].emoji : "🍽️";
      const t = TYPE_META[d.type] ? TYPE_META[d.type].label : "";
      ctx.textAlign = "left";
      ctx.fillStyle = "#241D17";
      ctx.font = "46px " + SANS;
      ctx.fillText(emoji + "  " + d.name, 190, cy);
      ctx.fillStyle = "rgba(36,29,23,.55)";
      ctx.font = "400 26px " + SANS;
      ctx.textAlign = "right";
      ctx.fillText(t, W - 190, cy);
    });
    ctx.textAlign = "center";

    // 分工（金色 + 两人名字炫彩渐变）
    const nm = loverName(), mn = myName();
    const roleY = rowTop + list.length * rowH + 36;
    ctx.font = "600 32px " + SANS;
    if ((nm || mn) && roles && roles.a) {
      const seg = [
        { t: roles.a.name + "（", gold: true },
        { t: nm || roles.a.label, grad: true },
        { t: "）& " + roles.b.name + "（", gold: true },
        { t: mn || roles.b.label, grad: true },
        { t: "）", gold: true }
      ];
      const widths = seg.map(s => ctx.measureText(s.t).width);
      const total = widths.reduce((a, b) => a + b, 0);
      let x = W / 2 - total / 2;
      ctx.textAlign = "left";
      seg.forEach((s, i) => {
        if (s.gold) {
          ctx.fillStyle = "#C78B4A";
        } else {
          const grad = ctx.createLinearGradient(x, 0, x + widths[i], 0);
          grad.addColorStop(0, "#E14D2A");
          grad.addColorStop(0.5, "#C78B4A");
          grad.addColorStop(1, "#E14D2A");
          ctx.fillStyle = grad;
        }
        ctx.fillText(s.t, x, roleY);
        x += widths[i];
      });
      ctx.textAlign = "center";
    } else {
      ctx.fillStyle = "#C78B4A";
      ctx.fillText(mem.roles, W / 2, roleY);
    }

    // 感情任务引用框
    const bw = 760, bh = 150;
    const bx = (W - bw) / 2, by = roleY + 66;
    ctx.fillStyle = "rgba(199,139,74,.10)";
    roundRect(ctx, bx, by, bw, bh, 24); ctx.fill();
    ctx.strokeStyle = "rgba(199,139,74,.42)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, bw, bh, 24); ctx.stroke();
    const lines = wrapText(ctx, mem.task, "400 34px " + SANS, 690);
    lines.forEach((ln, i) => {
      ctx.fillStyle = "#5C4632";
      ctx.font = "400 34px " + SANS;
      ctx.fillText(ln, W / 2, by + bh / 2 - ((lines.length - 1) / 2) * 46 + i * 46);
    });

    // 底部
    ctx.fillStyle = "#C78B4A";
    ctx.font = "500 28px " + SANS;
    ctx.fillText(mem.foot, W / 2, H - 152);
    ctx.fillStyle = "#E14D2A";
    ctx.font = "34px " + SANS;
    ctx.fillText("♥ 以后每一顿，都一起 ♥", W / 2, H - 96);

    c.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "恋爱纪念卡_" + Date.now() + ".png";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("纪念卡图片已保存 💕");
    }, "image/png");
  }
  function updateCaption() {
    const s = shareState;
    const d = new Date();
    let txt = "🍅 " + (s.theme === "couple" ? "今天和 TA 一起做了这顿" : "今天做了这顿") + "（" + s.people + " 人）\n";
    s.dishes.forEach(x => txt += "• " + x.name + "\n");
    txt += d.getMonth() + 1 + "月" + d.getDate() + "日 · 认真吃饭打卡\n—— 来自「今天吃啥 AI 版」";
    shareState.caption = txt;
  }

  $("#btnShareHome").addEventListener("click", () => openShare("home"));
  $("#btnShareCouple").addEventListener("click", () => openShare("couple"));
  $("#btnSaveCardImage").addEventListener("click", () => {
    const canvas = $("#shareCardWrap canvas");
    if (!canvas) { toast("卡片还没生成"); return; }
    if (shareState && shareState.historyId) markCheckedIn(shareState.historyId);
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "今日饭桌_" + Date.now() + ".png";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("图片已保存，去朋友圈打卡吧 🍅");
    }, "image/png");
  });
  $("#btnCopyCaption").addEventListener("click", () => {
    if (!shareState) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareState.caption || "").then(() => toast("文案已复制，粘贴到朋友圈吧"));
    } else { fallbackCopy(shareState.caption || ""); }
  });

  /* ============================================================
    ⑦ 初始化
     ============================================================ */
  function enterApp() {
    updateHmSummary();
    showView("home");
  }
  function init() {
    applyTheme(localStorage.getItem(LS_THEME) || "tomato");
    applyUserShell();
    if (!localStorage.getItem(LS_FIRST)) {
      // 首次进入：先到品牌欢迎页
      localStorage.setItem(LS_FIRST, "1");
      showView("welcome");
      if (window.__freshReset) toast("已重置为全新用户状态 · 数据已清空");
      return;
    }
    // 老用户 / 游客：直接进主页；没有口味档案时用大众口味兜底
    if (!prefs) {
      prefs = { region: "other", people: 2, cooker: "newbie", spicy: 1, avoid: ["none"], health: "none" };
    }
    enterApp();
    if (window.__freshReset) toast("已重置为全新用户状态 · 数据已清空");
  }
  init();
})();
