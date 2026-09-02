/* ============================================================
   今天吃啥 AI 版 · 本地 AI 推荐引擎
   基于「用户基本情况 + 当次输入」的多因子推算
   无 key 时本地兜底，有 key 时由 llm.js 升级渲染
   ============================================================ */
window.Engine = (function () {

  /* ---------- 地区 → 口味倾向推算 ---------- */
  const REGION_FLAVOR = {
    sichuan:  { spicy: 2, desc: "你来自川渝，口味偏麻辣鲜香" },
    central:  { spicy: 2, desc: "你来自两湖，口味偏辣香浓郁" },
    north:    { spicy: 1, desc: "你来自北方，口味偏咸鲜、爱面食" },
    northeast:{ spicy: 0, desc: "你来自东北，口味偏咸鲜豪爽、爱炖菜" },
    northwest:{ spicy: 1, desc: "你来自西北，口味偏咸鲜、爱牛羊肉和面食" },
    jiangnan: { spicy: 0, desc: "你来自江浙，口味偏清淡甜鲜" },
    guangdong:{ spicy: 0, desc: "你来自广东，口味偏清淡、重原味" },
    southwest:{ spicy: 2, desc: "你来自云贵，口味偏酸辣、风味多变" },
    other:    { spicy: 1, desc: "口味不拘一格，为你均衡搭配" }
  };

  const AVOID_MAP = {
    cilantro: ["香菜"],
    pork:     ["猪肉", "猪里脊", "五花肉", "猪"],
    seafood:  ["虾", "鱼", "蟹", "贝", "鱿", "海", "鲍", "参"],
    vegetarian: [], // 特殊处理
    garlic:   ["葱", "蒜", "洋葱", "韭", "香葱"],
    beef:     ["牛肉", "牛腩", "牛排", "肥牛", "牛", "羊肉", "羊排", "肥羊", "羊"],
    egg:      ["鸡蛋", "鸭蛋", "鹌鹑蛋", "蛋"],
    lactose:  ["牛奶", "酸奶", "奶酪", "芝士", "淡奶油", "奶油", "奶粉"],
    organ:    ["猪肝", "牛肝", "鸡肝", "鸭肠", "肥肠", "猪肚", "腰花", "毛肚", "鹅肝", "鸭血", "猪血"],
    mushroom: ["香菇", "金针菇", "杏鲍菇", "平菇", "口蘑", "木耳", "茶树菇", "菌"],
    soy:      ["豆腐", "豆干", "豆皮", "腐竹", "黄豆", "毛豆", "豆浆", "千张", "香干"]
  };

  /* ---------- 工具 ---------- */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rand(min, max) { return Math.random() * (max - min) + min; }

  /* ---------- 季节感知 ---------- */
  function getSeason() {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return "spring";
    if (m >= 6 && m <= 8) return "summer";
    if (m >= 9 && m <= 11) return "autumn";
    return "winter";
  }
  const SEASON_INFO = {
    spring: { name: "春", tip: "万物复苏，适合吃点鲜爽开胃、养肝护肝的菜", bonus: /春笋|韭菜|菠菜|香椿|荠菜|豆芽|豌豆|芦笋|莴笋|茼蒿|马兰头|蒲公英|蕨菜|槐花|榆钱/, penalty: /火锅|炖菜|红烧|麻辣|干锅/ },
    summer: { name: "夏", tip: "天气炎热，推荐清淡解暑、补充水分和电解质的菜", bonus: /冬瓜|苦瓜|黄瓜|丝瓜|茄子|番茄|绿豆|莲子|百合|银耳|秋葵|空心菜|苋菜|茭白|莲藕|薄荷|紫苏/, penalty: /火锅|红烧|麻辣|干锅|油炸|肥肉|五花肉/ },
    autumn: { name: "秋", tip: "秋高气爽，适合滋阴润燥、贴秋膘的菜", bonus: /南瓜|山药|莲藕|百合|银耳|梨|板栗|核桃|芝麻|蜂蜜|萝卜|白菜|菠菜|西兰花|胡萝卜|红薯/, penalty: /生冷|凉拌|冰|刺身/ },
    winter: { name: "冬", tip: "天寒地冻，来道暖身暖胃、补充能量的菜", bonus: /羊肉|牛肉|萝卜|白菜|土豆|红薯|山药|板栗|核桃|芝麻|火锅|炖菜|红烧|煲汤|砂锅/, penalty: /生冷|凉拌|冰|刺身|苦瓜|冬瓜|黄瓜/ }
  };

  /* ---------- 历史学习：记录用户不喜欢的菜，降低评分 ---------- */
  function getDislikeHistory() {
    try { return JSON.parse(localStorage.getItem("eat-ai-dislikes") || "[]"); } catch(e) { return []; }
  }
  function addDislike(dishId) {
    const list = getDislikeHistory();
    if (!list.includes(dishId)) {
      list.push(dishId);
      localStorage.setItem("eat-ai-dislikes", JSON.stringify(list.slice(-50)));
    }
  }
  function isDisliked(dishId) {
    return getDislikeHistory().includes(dishId);
  }

  /* ---------- 今日运势菜：趣味推荐 ---------- */
  const LUCKY_DISHES = [
    { name: "麻婆豆腐", fortune: "今天会遇到让你心跳加速的事", emoji: "🌶️" },
    { name: "番茄炒蛋", fortune: "平凡的一天里藏着小确幸", emoji: "🍅" },
    { name: "红烧肉", fortune: "财运亨通，想吃的都能吃到", emoji: "🥩" },
    { name: "酸菜鱼", fortune: "酸酸甜甜就是今天的你", emoji: "🐟" },
    { name: "宫保鸡丁", fortune: "工作学习效率爆表，事半功倍", emoji: "🍗" },
    { name: "蒜蓉西兰花", fortune: "健康运up，身体轻盈有活力", emoji: "🥦" },
    { name: "可乐鸡翅", fortune: "快乐值拉满，烦恼全飞走", emoji: "🍗" },
    { name: "蛋炒饭", fortune: "简单即幸福，一碗饭治愈一切", emoji: "🍚" },
    { name: "水煮肉片", fortune: "热情似火，魅力值MAX", emoji: "🌶️" },
    { name: "清炒时蔬", fortune: "心静自然凉，万事顺意", emoji: "🥬" },
    { name: "糖醋排骨", fortune: "甜甜蜜蜜，人缘爆棚", emoji: "🍖" },
    { name: "紫菜蛋花汤", fortune: "温暖治愈，被爱包围", emoji: "🍲" }
  ];
  function getLuckyDish() {
    const today = new Date().toDateString();
    const seed = today.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return LUCKY_DISHES[seed % LUCKY_DISHES.length];
  }

  /* ---------- 营养搭配分析：整桌菜的营养均衡度 ---------- */
  function analyzeMenuNutrition(dishes) {
    try {
    const totalKcal = dishes.reduce((s, d) => s + (d.kcal || 0), 0);
    const totalProtein = dishes.reduce((s, d) => s + (d.protein || 0), 0);
    const hasVeg = dishes.some(d => d.type === "veg");
    const hasSoup = dishes.some(d => d.type === "soup");
    const hasHot = dishes.some(d => d.type === "hot");
    const allBenefits = new Set();
    (dishes || []).filter(d => d).forEach(d => {
      try {
        const n = assessNutrition(d);
        (n.benefits || []).forEach(b => allBenefits.add(String(b || "").split("，")[0].split("、")[0]));
      } catch(e) { console.warn("analyze dish error:", d && d.name, e); }
    });
    let score = 60;
    if (hasVeg) score += 10;
    if (hasSoup) score += 8;
    if (hasHot) score += 5;
    if (totalProtein >= 40) score += 8;
    if (totalKcal <= 1200 && dishes.length <= 3) score += 5;
    if (totalKcal > 1800) score -= 8;
    score = Math.max(55, Math.min(98, score));
    const level = score >= 85 ? "营养很均衡" : score >= 75 ? "搭配比较合理" : score >= 65 ? "还可以更均衡" : "建议加点蔬菜";
    const tips = [];
    if (!hasVeg) tips.push("建议加一道绿叶菜，补充膳食纤维和维生素");
    if (!hasSoup) tips.push("配碗汤，用餐更滋润");
    if (totalKcal > 1800) tips.push("今天热量偏高，注意适量哦");
    if (totalProtein >= 50) tips.push("蛋白质充足，很适合健身塑形");
    return { score, level, tips, totalKcal, totalProtein, benefits: [...allBenefits].slice(0, 3) };
    } catch (e) {
      console.error("analyzeMenuNutrition error:", e);
      return { score: 70, level: "搭配合理", tips: [], totalKcal: 0, totalProtein: 0, benefits: [] };
    }
  }

  /* 忌口过滤 */
  function passesAvoid(dish, avoid) {
    if (!avoid || avoid.length === 0 || avoid.includes("none")) return true;
    if (!dish || !Array.isArray(dish.ing)) return true;
    const ingList = dish.ing.map(i => Array.isArray(i) ? String(i[0] || "") : String(i || ""));
    const ingText = ingList.join(" ");
    for (const a of avoid) {
      if (a === "vegetarian") {
        if (dish.type === "hot") {
          const isPorkFreeHot = !ingList.some(x => /猪|肉|牛|鸡|鸭|羊|虾|鱼|蟹/.test(x) && !/肉末|鸡蛋/.test(x));
          if (!isPorkFreeHot) return false;
        }
        continue;
      }
      if (a === "noSpicy") { if (dish.spicy > 0) return false; continue; }
      if (a === "lowOil") { if (dish.kcal > 480 || /炸|肥肉|五花|酥/.test(ingText)) return false; continue; }
      if (a === "lowSalt") { if (/酸菜|腊|咸鱼|榨菜|腌|火腿|香肠|腊肉/.test(ingText)) return false; continue; }
      if (a === "lowSugar") { if (dish.flavor === "sweet" || /糖|冰糖|蜂蜜|可乐|白糖|炼乳/.test(ingText)) return false; continue; }
      const keys = AVOID_MAP[a] || [];
      for (const k of keys) {
        if (ingList.some(x => x.includes(k))) return false;
      }
    }
    return true;
  }

  /* 食材重复检测（防止一桌菜都是茄子土豆） */
  function overlap(d1, d2) {
    if (!d1 || !d2 || !Array.isArray(d1.ing) || !Array.isArray(d2.ing)) return false;
    const set = new Set(d1.ing.map(i => Array.isArray(i) ? String(i[0] || "") : String(i || "")));
    return d2.ing.some(i => set.has(Array.isArray(i) ? String(i[0] || "") : String(i || "")));
  }

  /* ---------- 多因子评分 ---------- */
  function score(dish, ctx) {
    let s = 50;
    const targetSpicy = ctx.spicyTarget;

    // 辣度匹配
    s -= Math.abs(dish.spicy - targetSpicy) * 12;
    // 口味倾向
    if (ctx.flavor) {
      if (dish.flavor === ctx.flavor) s += 10;
      else if (ctx.flavor === "light" && ["heavy", "spicy"].includes(dish.flavor)) s -= 8;
      else if (ctx.flavor === "spicy" && dish.flavor === "light") s -= 6;
    }
    // 难度匹配（谁做）
    if (ctx.cooker === "lazy") {
      if (dish.time <= 20) s += 12;
      else if (dish.time > 35) s -= 14;
      if (dish.diff === 3) s -= 10;
    } else if (ctx.cooker === "newbie") {
      if (dish.diff <= 2) s += 10;
      else s -= 12;
      if (dish.time > 45) s -= 8;
    } else { // pro 老手
      if (dish.diff === 3) s += 6;
    }
    // 健康目标
    if (ctx.health === "fitness") {
      if (dish.health.includes("fitness")) s += 16;
      if (dish.kcal > 500) s -= 12;
      if (dish.protein >= 28) s += 6;
      if (dish.flavor === "sweet") s -= 6;
    } else if (ctx.health === "sugar") {
      if (dish.flavor === "sweet") s -= 20;
      if (dish.health.includes("sugar")) s += 14;
      if (dish.health.includes("light")) s += 6;
    } else if (ctx.health === "light") {
      if (dish.health.includes("light")) s += 14;
      if (["heavy", "spicy"].includes(dish.flavor)) s -= 8;
    }
    // 场景/心情
    if (ctx.mood === "spicy" && dish.spicy >= 2) s += 8;
    if (ctx.mood === "light" && dish.spicy === 0 && dish.flavor !== "sweet") s += 8;
    if (ctx.mood === "comfort" && ["soup", "staple"].includes(dish.type)) s += 6;
    if (ctx.scene && dish.scene.includes(ctx.scene)) s += 6;
    // 季节感知：应季菜品加分，反季菜品减分
    const season = getSeason();
    const si = SEASON_INFO[season];
    const dishText = dish.name + (Array.isArray(dish.ing) ? dish.ing.map(i => Array.isArray(i) ? String(i[0] || "") : String(i || "")).join(" ") : "");
    if (si.bonus.test(dishText)) s += 8;
    if (si.penalty.test(dishText)) s -= 5;
    // 历史学习：用户之前不喜欢的菜大幅降分
    if (isDisliked(dish.id)) s -= 25;
    // 随机扰动（保证换一批有变化）
    s += rand(-6, 6);
    return s;
  }

  /* ---------- 在家吃菜单生成 ---------- */
  function genHomeMenu(opts, prefs) {
    const ctx = buildCtx(opts, prefs, "home");
    let pool = window.RECIPES.filter(d =>
      passesAvoid(d, ctx.avoid) && d.coop <= 1 && d.type !== "staple" && d.type !== "cold"
    );

    // 品类筛选
    const cat = opts.category || "all";
    const isFitness = cat === "fitness" || cat === "fitness-protein" || cat === "fitness-lowcarb" || cat === "fitness-lowfat";
    if (isFitness) {
      pool = pool.filter(d => d.health && d.health.includes("fitness"));
      if (cat === "fitness-protein") {
        // 高蛋白增肌：荤菜强制>=20g蛋白，素菜和汤不强制但高蛋白加分
        pool = pool.filter(d => d.type !== "hot" || (d.protein || 0) >= 20);
        pool.forEach(d => {
          d._proteinBonus = (d.protein || 0) * 1.5;
          if (d.type === "hot" && (d.protein || 0) >= 30) d._proteinBonus += 20;
        });
      } else if (cat === "fitness-lowcarb") {
        const highCarbIngs = ["土豆","马铃薯","南瓜","红薯","地瓜","玉米","面条","面","米饭","米","燕麦","藜麦","面包","馒头","粉"];
        pool = pool.filter(d => {
          const dishIngs = (d.ing || []).map(x => x[0]);
          return !dishIngs.some(di => highCarbIngs.some(hc => di.includes(hc)));
        });
      } else if (cat === "fitness-lowfat") {
        const lowFatIngs = ["鸡胸肉","龙利鱼","虾","虾仁","豆腐","西兰花","菌菇","蘑菇","香菇","金针菇","魔芋","黄瓜","番茄","生菜","菠菜","白菜"];
        pool.forEach(d => {
          const dishIngs = (d.ing || []).map(x => x[0]);
          const lowFatCount = dishIngs.filter(di => lowFatIngs.some(lf => di.includes(lf))).length;
          d._lowFatBonus = lowFatCount * 10;
        });
      }
    } else if (cat === "veg") {
      pool = pool.filter(d => d.type === "veg" || d.type === "soup");
    } else if (cat === "soup") {
      pool = pool.filter(d => d.type === "soup" || (d.scene && d.scene.includes("汤")) || d.name.includes("汤"));
    } else if (cat === "quick") {
      pool = pool.filter(d => d.time <= 20);
    }

    // 食材匹配：包含用户输入食材的菜加分
    const userIngs = opts.ingredients || [];
    if (userIngs.length > 0) {
      pool.forEach(d => {
        const dishIngs = (d.ing || []).map(x => x[0]);
        const matchCount = userIngs.filter(ui => dishIngs.some(di => di.includes(ui) || ui.includes(di))).length;
        if (matchCount > 0) d._ingredientBonus = matchCount * 15;
      });
    }

    const people = ctx.people;
    // 按人数定菜品构成（塑型餐调整为高蛋白为主）
    const plan = isFitness
      ? (cat === "fitness-protein"
          ? { hot: 3, veg: 1, soup: people >= 2 ? 1 : 0 }
          : cat === "fitness-lowcarb"
          ? { hot: 2, veg: 2, soup: people >= 2 ? 1 : 0 }
          : { hot: 2, veg: 1, soup: people >= 2 ? 1 : 0 })
      : people === 1 ? { hot: 1, veg: 1, soup: 0 }
      : people === 1 ? { hot: 1, veg: 1, soup: 0 }
      : people === 2 ? { hot: 1, veg: 1, soup: 1 }
      : people === 3 ? { hot: 2, veg: 1, soup: 1 }
      : { hot: 2, veg: 2, soup: 1 };

    const chosen = [];
    for (const type of ["hot", "veg", "soup"]) {
      const need = plan[type];
      if (!need) continue;
      const candidates = pool.filter(d => d.type === type).map(d => ({ d, s: score(d, ctx) + (d._ingredientBonus || 0) + (d._lowFatBonus || 0) + (d._proteinBonus || 0) }))
        .filter(x => !chosen.some(c => overlap(c, x.d)))
        .sort((a, b) => b.s - a.s);
      for (let i = 0; i < need && i < candidates.length; i++) {
        chosen.push(candidates[i].d);
      }
    }
    if (chosen.filter(c => c.type === "soup").length < plan.soup) {
      const alt = pool.filter(d => d.type === "veg").map(d => ({ d, s: score(d, ctx) + (d._ingredientBonus || 0) }))
        .filter(x => !chosen.some(c => overlap(c, x.d))).sort((a, b) => b.s - a.s);
      if (alt && alt[0]) chosen.push(alt[0].d);
    }
    pool.forEach(d => {
      delete d._ingredientBonus;
      delete d._lowFatBonus;
      delete d._proteinBonus;
    });
    return { dishes: chosen, ctx, pool };
  }

  /* ---------- 情侣协作菜单生成 ---------- */
  function genCoupleMenu(opts, prefs) {
    const ctx = buildCtx(opts, prefs, "couple");
    let pool = window.RECIPES.filter(d => passesAvoid(d, ctx.avoid));

    if (opts.occasion === "anniversary") {
      // 纪念日：优先协作强度高的、有仪式感的
      pool = pool.filter(d => d.coop >= 2 || d.type === "soup" || d.scene.includes("纪念日") || d.scene.includes("情侣"));
    } else if (opts.occasion === "weekend") {
      pool = pool.filter(d => d.coop >= 2 || d.scene.includes("周末") || d.type === "hot");
    } else {
      pool = pool.filter(d => d.coop >= 1);
    }

    const plan = { hot: 1, veg: 1, soup: 1 };
    const chosen = [];
    for (const type of ["hot", "veg", "soup"]) {
      const need = plan[type];
      if (!need) continue;
      let candidates = pool.filter(d => d.type === type).map(d => ({ d, s: score(d, ctx) }));
      // 情侣模式给协作强度额外加分
      candidates.forEach(x => { if (x.d.coop >= 2) x.s += 10; if (x.d.coop === 3) x.s += 6; });
      candidates = candidates.filter(x => !chosen.some(c => overlap(c, x.d))).sort((a, b) => b.s - a.s);
      for (let i = 0; i < need && i < candidates.length; i++) chosen.push(candidates[i].d);
    }
    return { dishes: chosen, ctx, pool };
  }

  /* 把「口味圈 key」或「省份名」统一解析成口味 key（支持数组多选） */
  function resolveFlavorKeys(region) {
    if (!region) return ["other"];
    const arr = Array.isArray(region) ? region : [region];
    const keys = arr.map(r => {
      if (REGION_FLAVOR[r]) return r;
      if (window.CHINA && window.CHINA.flavors && window.CHINA.flavors[r]) return window.CHINA.flavors[r];
      return null;
    }).filter(Boolean);
    return keys.length ? keys : ["other"];
  }
  function resolveFlavorKey(region) {
    return resolveFlavorKeys(region)[0];
  }
  /* 多口味 → 默认辣度（取平均，用户后续可单独覆盖） */
  function defaultSpicyFromRegions(keys) {
    const vals = keys.map(k => REGION_FLAVOR[k] ? REGION_FLAVOR[k].spicy : 1);
    if (!vals.length) return 1;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  /* 多口味 → 风格倾向（纯辣 / 纯清淡 / 混合则中立） */
  function resolveFlavorFromRegions(keys) {
    const map = { sichuan: "spicy", central: "spicy", jiangnan: "light", guangdong: "light" };
    const set = new Set(keys.map(k => map[k]).filter(Boolean));
    if (set.size === 1) return [...set][0];
    return null;
  }
  /* 多口味 → 推荐语 */
  function regionDesc(region) {
    const keys = resolveFlavorKeys(region);
    const real = keys.filter(k => REGION_FLAVOR[k]);
    if (!real.length) return "口味均衡";
    if (real.length === 1) return REGION_FLAVOR[real[0]].desc;
    const short = real.map(k => REGION_FLAVOR[k].desc.replace(/^你来自[^，]*，/, "").replace(/^口味偏/, "").replace(/^偏/, ""));
    return "你兼容" + short.join("、") + "，口味很百搭";
  }

  function buildCtx(opts, prefs, mode) {
    const people = opts.people || prefs.people || 2;
    const cooker = opts.cooker || prefs.cooker || "newbie";
    const regionKeys = resolveFlavorKeys(prefs.region);
    let spicyTarget = opts.spicyTarget !== undefined ? opts.spicyTarget
      : (opts.spicy !== undefined ? opts.spicy : defaultSpicyFromRegions(regionKeys));

    if (opts.mood === "spicy") spicyTarget = Math.max(spicyTarget, 2);
    if (opts.mood === "light") spicyTarget = 0;

    const health = prefs.health || "none";
    return {
      people, cooker, region: regionKeys.join("+"), spicyTarget, health,
      mood: opts.mood || "balance",
      scene: opts.scene,
      avoid: prefs.avoid || [],
      flavor: opts.flavor || resolveFlavorFromRegions(regionKeys),
      mode
    };
  }

  /* ---------- 推荐理由（AI 推算文案 · 升级版） ---------- */
  function buildReason(dishes, ctx, mode, opts, prefs) {
    try {
    opts = opts || {};
    const people = ctx.people;
    const season = getSeason();
    const si = SEASON_INFO[season];
    const nutrition = analyzeMenuNutrition(dishes);
    const lucky = getLuckyDish();

    const cookerText = ctx.cooker === "lazy" ? "懒人友好，都控制在 20 分钟左右" :
      ctx.cooker === "newbie" ? "新手掌勺，选的都是不易翻车的菜" : "老手上阵，给你上了几道有底气的硬菜";
    const regionText = regionDesc(prefs.region);
    const spicyText = ctx.spicyTarget === 0 ? "你不太吃辣" : ctx.spicyTarget === 1 ? "微辣刚刚好" : ctx.spicyTarget === 2 ? "够味的辣度安排上" : "无辣不欢，爽";

    /* 开场：更有温度的AI语气 */
    let head;
    const greetings = ["我帮你想好了", "今天就这么吃", "为你精心挑选了", "AI推算结果出炉"];
    const greet = pick(greetings);
    if (mode === "couple") {
      const occText = opts.occasion === "anniversary" ? "今天是你们的纪念日，要有点仪式感" :
        opts.occasion === "weekend" ? "周末啦，一起做饭增进感情" : "日常的二人食，也要吃得开心";
      head = `${occText}。${greet}：结合你俩的口味（${spicyText}）、协作强度和${si.name}季养生，这几道菜很适合一起动手。`;
    } else {
      head = `${greet}，${people}人份：${cookerText}，${regionText}，${spicyText}。现在是${si.name}天，${si.tip}。`;
    }

    /* 菜品亮点：每道菜的特色 */
    const dishTips = (dishes || []).filter(d => d && d.name).map(d => {
      const n = assessNutrition(d);
      let tag = "";
      if (d.coop >= 2) tag = `协作度${"★".repeat(d.coop)}，两人配合更出彩`;
      else if (d.type === "soup") tag = "暖胃收尾，汤汤水水最舒服";
      else if (d.type === "veg") tag = (n.benefits && n.benefits[0]) ? n.benefits[0].split("，")[0] : "清爽解腻";
      else if (n.score >= 85) tag = "营养满分，健康首选";
      else if (d.kcal <= 350) tag = "低卡轻负担";
      return tag ? `${d.name}（${tag}）` : d.name;
    }).join(" · ");

    /* 营养搭配总结 */
    let nutritionText = "";
    if (nutrition.tips.length > 0) {
      nutritionText = ` 小建议：${nutrition.tips[0]}。`;
    } else {
      nutritionText = ` 整桌${nutrition.level}，约${nutrition.totalKcal}千卡，蛋白质${nutrition.totalProtein}g。`;
    }

    /* 今日运势菜（趣味彩蛋） */
    const luckyText = ` 对了，今日运势菜是${lucky.emoji}${lucky.name}——${lucky.fortune}。`;

    return `${head} 今晚主打：${dishTips}。${nutritionText}${luckyText}`;
    } catch (e) {
      console.error("buildReason error:", e);
      const people = (ctx && ctx.people) || 2;
      const names = Array.isArray(dishes) ? dishes.map(d => d && d.name ? d.name : "神秘菜品").join("、") : "今日特选";
      return `为你${people}人推荐：${names}。AI精心搭配，营养均衡，祝你用餐愉快！`;
    }
  }

  /* ---------- 买菜清单 ---------- */
  function buildList(dishes, people) {
    const scale = people <= 1 ? 0.6 : people === 2 ? 1 : people === 3 ? 1.4 : 1.8;
    // 主清单只保留真正需要采购的分类；调料归入"厨房常备"
    const groups = { "蔬菜菌菇": [], "肉蛋类": [], "豆制品": [], "水产": [], "主食/烘焙": [] };
    const pantry = [];

    const classify = (name) => {
      // 调料优先匹配（避免"鱼香汁"被分到水产、"辣椒粉"被分到主食）
      if (/油|盐|酱|醋|糖|粉|料|椒|豆瓣|豆豉|葱|姜|蒜|八角|花椒|桂皮|香叶|料酒|蜂蜜|生抽|老抽|蚝油|孜然|咖喱|辣椒|淀粉|豆瓣酱|甜面酱|番茄酱|辣椒油|花椒粉|辣椒面|辣椒粉|咖喱块|蒸鱼豉油|黑胡椒|白胡椒|白芝麻|花生米|葡萄干|红枣|枸杞|莲子|银耳|薏米|桂花|干桂花|香菇\(干\)|木耳\(干\)|榛蘑|酵母|奶油|淡奶油|黄油|麻油|香油|橄榄油|沙拉酱|油醋汁|烤肉酱|火锅底料|蘸料|煲仔饭酱油|寿司醋|孜然粒|孜然粉|芽菜|酸菜|酸豆角|泡椒|剁椒|腌菜|泡菜|蒜瓣|姜片|姜丝|葱段|青红椒|青椒丝|高汤|芝麻|白芝麻|鱼香汁|鱼香|红烧|清蒸|水煮|凉拌|干锅|铁板|白灼|椒盐|糖醋|酸辣|麻辣|香辣|五香|十三香|味精|鸡精|小苏打|泡打粉|酵母粉|吉利丁|片栗粉|玉米淀粉|土豆淀粉|红薯淀粉|木薯粉|糯米粉|粘米粉|低筋粉|高筋粉|中筋粉|面包糠|吉士粉|可可粉|抹茶粉|肉桂粉|丁香|草果|肉蔻|白蔻|香果|砂仁|甘草|陈皮|罗汉果|薄荷|紫苏|香菜|芹菜|香葱|大葱|小葱|洋葱|韭菜|蒜薹|蒜苗|姜|蒜|辣椒|青椒|红椒|小米辣|朝天椒|二荆条|灯笼椒|花椒|麻椒|胡椒|八角|桂皮|香叶|草果|肉蔻|白蔻|丁香|小茴香|孜然|咖喱|芥末|沙姜|南姜|高良姜|山柰|五香料|十三香|五香粉|椒盐|味精|鸡精|蚝油|生抽|老抽|酱油|蒸鱼豉油|味极鲜|一品鲜|海鲜酱|排骨酱|蒜蓉酱|辣椒酱|豆瓣酱|甜面酱|番茄酱|沙拉酱|芝麻酱|花生酱|韭花酱|腐乳|南乳|红曲米|料酒|黄酒|白酒|啤酒|米酒|醪糟|酒酿|醋|香醋|陈醋|米醋|白醋|果醋|糖|白糖|冰糖|红糖|黑糖|麦芽糖|蜂蜜|枫糖|盐|海盐|岩盐|低钠盐|加碘盐|油|食用油|花生油|菜籽油|玉米油|大豆油|葵花籽油|橄榄油|茶油|芝麻油|香油|花椒油|辣椒油|葱油|蒜油|姜油|黄油|奶油|淡奶油|炼乳|芝士|奶酪|起司|沙拉酱|千岛酱|蛋黄酱|芥末酱|番茄酱|辣椒酱|豆瓣酱|甜面酱|海鲜酱|排骨酱|蒜蓉酱|韭花酱|腐乳|南乳|红曲米|料酒|黄酒|白酒|啤酒|米酒|醪糟|酒酿|醋|香醋|陈醋|米醋|白醋|果醋|糖|白糖|冰糖|红糖|黑糖|麦芽糖|蜂蜜|枫糖|盐|海盐|岩盐|低钠盐|加碘盐|油|食用油|花生油|菜籽油|玉米油|大豆油|葵花籽油|橄榄油|茶油|芝麻油|香油|花椒油|辣椒油|葱油|蒜油|姜油|黄油|奶油|淡奶油|炼乳|芝士|奶酪|起司/.test(name)) return "调料";
      if (/豆腐|豆干|香干|腐竹|豆皮|魔芋|千张|百叶结|油豆腐/.test(name)) return "豆制品";
      if (/肉|排骨|里脊|五花|瘦肉|肥肉|肉末|肉片|肉丝|肉丁|肉糜|鸡|鸭|鹅|牛|羊|猪|培根|火腿|肥牛|肥羊|丸子|肠|蛋|皮蛋|咸蛋|鸡蛋|鸭蛋|鹌鹑蛋|腰花|肝|肚|心|舌|脑|筋|蹄|爪|翅|腿|脯|柳|排|骨|皮|头|尾/.test(name)) return "肉蛋类";
      if (/虾|鱼|蟹|贝|鱿|海|蚌|蛤|蛏|蚝|螺|鲍|参|仁|滑|丸/.test(name)) return "水产";
      if (/米|面|粉|饺子|馄饨|馒头|面包|糖|蛋挞皮|海苔|棉花糖|奶粉|饼干|藕|栗子|板栗|年糕|糯米|糙米|藜麦|燕麦|小米|面粉|面条|河粉|米粉|凉皮|饺子皮|馄饨皮|寿司米饭|杂粮|荞麦面|粉丝|粉条|红薯粉|宽面|细面|小饼干|皮冻|黑糖珍珠|可乐|啤酒|红茶|米酒/.test(name)) return "主食/烘焙";
      return "蔬菜菌菇";
    };

    const seen = {};
    const NON_ITEM = /温水|冷水|清水|开水|热水|^水$|蛋液|油\(|高汤|面糊水/;
    (dishes || []).filter(d => d && Array.isArray(d.ing)).forEach(d => {
      d.ing.forEach(item => {
        if (!Array.isArray(item)) return;
        const name = String(item[0] || "");
        const qty = item[1];
        if (!name || seen[name]) return;
        if (NON_ITEM.test(name)) return;
        seen[name] = true;
        const g = classify(name);
        const scaled = scaleQty(qty, scale);
        const itemObj = { name, qty, scaled, price: priceOf(name, scaled) };
        if (g === "调料") { pantry.push(itemObj); return; }
        groups[g].push(itemObj);
      });
    });
    // 去掉空组，并计算每类小计与总计
    let total = 0;
    const out = Object.entries(groups).filter(([, v]) => v.length > 0).map(([g, items]) => {
      const subtotal = Math.round(items.reduce((s, it) => s + it.price, 0) * 10) / 10;
      total += subtotal;
      return { g, items, subtotal };
    });
    const pantryTotal = Math.round(pantry.reduce((s, it) => s + it.price, 0) * 10) / 10;
    return { out, scale, total: Math.round(total * 10) / 10, pantry, pantryTotal };
  }

  function scaleQty(qty, scale) {
    const m = qty.match(/^(\d+(?:\.\d+)?)(g|克|个|根|把|勺|碗|盒|张|块|瓣|片|粒|颗|条|包|只|听|罐|颗)$/);
    if (m) {
      const n = Math.round(m[1] * scale);
      return String(n) + m[2];
    }
    if (qty === "适量") return "适量";
    return qty;
  }

  /* ---------- 买菜金额估算 ---------- */
  // 常见食材市场参考价（元 / 公斤），未收录的按默认价
  const PRICE_MAP = {
    // 蔬菜菌菇
    "西兰花": 10, "胡萝卜": 5, "番茄": 8, "西红柿": 8, "金针菇": 12, "黄瓜": 6, "茄子": 8,
    "青椒": 7, "土豆": 5, "苦瓜": 8, "冬瓜": 4, "丝瓜": 7, "韭菜": 7, "菠菜": 7, "油麦菜": 6,
    "生菜": 6, "娃娃菜": 8, "包菜": 4, "白菜": 4, "菜花": 7, "花菜": 7, "豆苗": 10, "豌豆苗": 12,
    "春笋": 20, "冬笋": 24, "芦笋": 22, "西芹": 7, "芹菜": 6, "洋葱": 5, "大葱": 6, "小葱": 8,
    "香葱": 10, "蒜薹": 9, "藕": 9, "莲藕": 9, "西葫芦": 6, "山药": 10, "南瓜": 5, "红薯": 5,
    "玉米": 6, "甜玉米": 6, "香菇": 18, "杏鲍菇": 10, "蘑菇": 12, "木耳": 8, "海带": 8, "海带丝": 8,
    "海带结": 8, "豆芽": 4, "圣女果": 12, "牛油果": 20, "青菜": 6, "时蔬": 6, "蔬菜": 6, "绿叶菜": 8,
    "莴笋": 6, "萝卜": 4, "白萝卜": 4, "青笋": 7, "笋": 18, "藕丁": 10, "番茄(大)": 8,
    // 肉蛋
    "猪肉": 28, "五花肉": 30, "猪里脊": 34, "猪": 30, "肉末": 28, "猪肉末": 28, "牛肉末": 70,
    "肋排": 44, "排骨": 44, "鸡": 22, "鸡腿": 22, "鸡腿肉": 22, "鸡胸": 22, "鸡胸肉": 22,
    "鸡翅": 34, "鸡翅中": 34, "鸡蛋": 12, "咸鸭蛋": 16, "皮蛋": 16, "鸭": 26, "鸭肉": 26,
    "牛肉": 76, "牛腩": 70, "牛里脊": 80, "肥牛": 90, "肥牛片": 90, "羊肉": 80, "羊排": 84,
    "羊腿肉": 84, "羊肉片": 84, "火腿": 50, "培根": 60, "虾滑": 70, "丸子": 40, "香肠": 40,
    "腊肠": 70, "五花": 30, "猪五花": 30, "肉片": 28, "羊": 80,
    // 水产
    "虾": 70, "大虾": 70, "河虾": 60, "草鱼": 24, "鲈鱼": 50, "巴沙鱼": 36, "巴沙鱼柳": 36,
    "鲫鱼": 30, "大闸蟹": 120, "扇贝": 60, "鱿鱼": 40, "鱼头": 24, "紫菜": 60, "虾皮": 60,
    "三黄鸡": 30, "鲜虾": 70, "小鱼": 30, "虾仁": 80,
    // 豆制品
    "豆腐": 6, "嫩豆腐": 6, "老豆腐": 6, "内酯豆腐": 6, "北豆腐": 6, "豆腐皮": 16, "香干": 16,
    "豆干": 16, "腐竹": 20, "魔芋": 10, "油豆腐": 14, "千张": 16, "百叶结": 14, "豆制品": 8,
    // 主食
    "大米": 8, "米饭": 8, "糙米": 10, "藜麦": 40, "燕麦米": 12, "小米": 12, "面粉": 8, "面条": 8,
    "河粉": 10, "米粉": 12, "凉皮": 10, "馒头": 10, "饺子皮": 10, "馄饨皮": 12, "蛋挞皮": 30,
    "面包": 20, "海苔": 80, "寿司米饭": 10, "板栗": 24, "栗子": 24, "年糕": 10, "宽面": 10,
    "细面": 10, "杂粮": 12, "咖喱": 20, "荞麦面": 14, "小饼干": 30, "糯米": 12, "粉丝": 16,
    "粉条": 12, "红薯粉": 10,
    // 调料 / 烘焙
    "油": 20, "生抽": 12, "老抽": 14, "香醋": 10, "料酒": 10, "糖": 8, "白糖": 8, "冰糖": 12,
    "盐": 4, "淀粉": 10, "豆瓣酱": 16, "甜面酱": 14, "豆豉": 20, "番茄酱": 16, "蚝油": 16,
    "蜂蜜": 30, "辣椒油": 20, "孜然": 30, "花椒": 40, "八角": 50, "桂皮": 40, "香叶": 60,
    "蒜末": 12, "姜末": 12, "葱花": 8, "辣椒": 20, "干辣椒": 30, "花椒粉": 40, "辣椒面": 24,
    "辣椒粉": 24, "咖喱块": 40, "蒸鱼豉油": 14, "黑胡椒": 40, "白胡椒": 40, "白芝麻": 30,
    "花生米": 20, "葡萄干": 30, "红枣": 30, "枸杞": 60, "莲子": 40, "银耳": 60, "薏米": 14,
    "桂花": 100, "干桂花": 100, "香菇(干)": 80, "木耳(干)": 90, "榛蘑": 100, "酵母": 60,
    "奶油": 40, "淡奶油": 40, "棉花糖": 30, "奶粉": 40, "黄油": 60, "米酒": 12, "麻油": 30,
    "香油": 40, "橄榄油": 60, "可乐": 6, "啤酒": 6, "红茶": 60, "黑糖珍珠": 20, "皮冻": 20,
    "沙拉酱": 24, "油醋汁": 30, "烤肉酱": 24, "火锅底料": 24, "蘸料": 16, "煲仔饭酱油": 14,
    "寿司醋": 20, "孜然粒": 30, "孜然粉": 30, "芽菜": 24, "酸菜": 10, "酸豆角": 12, "泡椒": 16,
    "剁椒": 16, "腌菜": 10, "泡菜": 14, "蒜瓣": 12, "蒜": 12, "姜": 12, "姜片": 12, "姜丝": 12,
    "葱段": 8, "洋葱": 5, "青红椒": 8, "青椒丝": 7, "高汤": 10, "芝麻": 30, "白芝麻": 30
  };
  const DEFAULT_PRICE = 12;          // 未收录食材默认 元/kg
  const MIN_PRICE = 1;               // 单项最低估价 元
  const UNIT_KG = { 个: 0.15, 根: 0.2, 把: 0.2, 瓣: 0.01, 勺: 0.015, 碗: 0.2, 盒: 0.3, 张: 0.03,
    块: 0.2, 片: 0.02, 粒: 0.01, 颗: 0.05, 条: 0.4, 包: 0.3, 只: 0.2, 听: 0.33, 罐: 0.33,
    杯: 0.25, 碟: 0.05, 份: 0.25, 颗: 0.05 };

  function parseQtyKgs(qty) {
    let m = qty.match(/^(\d+(?:\.\d+)?)\s*(g|克|斤)$/);
    if (m) { const n = parseFloat(m[1]); return m[2] === "斤" ? n * 0.5 : n / 1000; }
    m = qty.match(/^(\d+(?:\.\d+)?)\s*(个|根|把|瓣|勺|碗|盒|张|块|片|粒|颗|条|包|只|听|罐|杯|碟|份)$/);
    if (m) return parseFloat(m[1]) * (UNIT_KG[m[2]] || 0.15);
    if (qty === "适量") return 0.15;
    m = qty.match(/^半(个|根|把|盒|颗|块|片|碗)$/);
    if (m) return 0.5 * (UNIT_KG[m[1]] || 0.15);
    if (/^几/.test(qty)) return 0.1;
    if (/小把/.test(qty)) return 0.15;
    if (/小勺/.test(qty)) return 0.02;
    return 0.1;
  }
  function priceOf(name, qty) {
    const kg = parseQtyKgs(qty);
    const unit = PRICE_MAP[name] !== undefined ? PRICE_MAP[name] : DEFAULT_PRICE;
    let p = kg * unit;
    if (qty === "适量" || /^几/.test(qty)) p = Math.min(p, 3);
    p = Math.max(MIN_PRICE, p);
    return Math.round(p * 10) / 10;
  }

  function channelAdvice(people) {
    const base = [
      { icon: "🦛", name: "盒马", sub: "App / 官网下单 · 最快30分达", url: "https://www.freshippo.com/" },
      { icon: "🛒", name: "永辉", sub: "永辉生活 · 超市到家", url: "https://www.yonghui.com.cn/" },
      { icon: "🥬", name: "菜市场", sub: "地图找附近 · 可挑可讲价", url: "https://ditu.amap.com/search?query=菜市场" },
      { icon: "🏪", name: "社区生鲜", sub: "地图找附近 · 临时补货", url: "https://ditu.amap.com/search?query=生鲜超市" }
    ];
    return base;
  }

  /* ---------- 情侣分工卡 ---------- */
  const ROLE_PAIRS = [
    { a: "掌勺大厨", aDuty: "负责炒、煎、炖全程火候", b: "备料助手", bDuty: "洗菜、切菜、递调料、盯火候" },
    { a: "主厨", aDuty: "调味与出锅的关键时刻都由你掌控", b: "调味师", bDuty: "咸淡生死由你定，主厨必须听你的" },
    { a: "刀工担当", aDuty: "所有切配你来，切得好不好看决定颜值", b: "火候大师", bDuty: "掌握火候与翻锅，糊不糊就看你了" },
    { a: "创意总监", aDuty: "决定摆盘、配色和这道菜的名字", b: "执行主厨", bDuty: "把创意落地，负责味道好不好吃" }
  ];
  function drawRoles() {
    const pair = pick(ROLE_PAIRS);
    return {
      a: { label: "TA", name: pair.a, duty: pair.aDuty },
      b: { label: "你", name: pair.b, duty: pair.bDuty }
    };
  }

  /* 默契小插曲 */
  const QUIZES = [
    "TA 刚切完洋葱，猜 TA 现在最想要什么？递水、递纸巾、还是夸一句？",
    "菜快出锅了，TA 最想先尝哪一口？猜对了这局你赢。",
    "如果这道菜是一个形容词，TA 会觉得是「惊艳」「家常」还是「翻车」？",
    "你觉得 TA 更喜欢你掌勺，还是更喜欢看你专注切菜的样子？"
  ];

  /* ---------- 感情任务 ---------- */
  const LOVE_TASKS = {
    daily: [
      "把第一口菜喂给对方吃，并说一句今天辛苦啦",
      "给这道菜起一个只属于你俩的名字，记住它",
      "猜对方最喜欢这道菜的哪个味道，猜错的人洗碗",
      "给对方配一杯饮品，并说一句为什么配这个",
      "用一句话夸夸对方今天的刀工/火候"
    ],
    weekend: [
      "一起摆盘拍照，发一张只属于你俩的饭桌照",
      "饭后一起收拾，边收拾边聊一件最近想做的事",
      "为对方挑一个「今晚专属」的菜，说出理由",
      "猜拳决定谁刷碗，输的人要讲一个开心的秘密"
    ],
    anniversary: [
      "举杯说一句真心话，纪念日快乐",
      "复刻你们第一次约会/第一次吃饭时的心情",
      "写下给彼此的一个小心愿，放进罐子里",
      "许一个关于明年的约定，一起贴在冰箱上"
    ]
  };
  function loveTask(occasion) {
    const list = LOVE_TASKS[occasion] || LOVE_TASKS.daily;
    return pick(list);
  }

  /* ---------- 纪念卡 ---------- */
  function buildMemorial(dishes, roles, task) {
    const now = new Date();
    const date = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日`;
    const names = dishes.map(d => d.name).join(" · ");
    return {
      date,
      title: "一起做饭纪念卡",
      dishes: names,
      roles: `${roles.a.name}（${roles.a.label}） & ${roles.b.name}（${roles.b.label}）`,
      task,
      foot: "今天吃啥 AI 版 · 用一顿饭的时间好好相爱"
    };
  }

  /* ---------- 营养健康评估 ---------- */
  function assessNutrition(d) {
    if (!d) return { score: 70, level: "普通", benefits: [], cautions: ["数据缺失"], summary: "普通" };
    const ing = Array.isArray(d.ing) ? d.ing.map(i => Array.isArray(i) ? String(i[0] || "") : String(i || "")).join(" ") : "";
    const benefits = [];
    const cautions = [];
    let score = 72;

    /* 营养补充 */
    if (d.protein >= 28 || /牛|鸡|鸭|鱼|虾|蟹|瘦/.test(ing)) { benefits.push("补充优质蛋白，助力肌肉与体力"); score += 4; }
    if (/番茄|西红柿/.test(ing)) benefits.push("富含维生素C与番茄红素");
    if (/菠菜|青菜|小白菜|油麦菜|生菜|西兰花|豆苗|芥蓝|茼蒿/.test(ing)) benefits.push("提供膳食纤维与多种维生素");
    if (/胡萝卜|南瓜|彩椒/.test(ing)) benefits.push("β-胡萝卜素，有益眼睛");
    if (/香菇|金针菇|杏鲍菇|木耳|平菇|口蘑/.test(ing)) benefits.push("菌菇多糖与膳食纤维，增强饱腹感");
    if (/豆腐|豆干|豆皮|香干|腐竹|黄豆|毛豆/.test(ing)) { benefits.push("植物蛋白与钙质，补钙友好"); score += 3; }
    if (/虾|鱼|鱿|贝|海带|紫菜/.test(ing)) benefits.push("富含DHA、碘与锌，益智补碘");
    if (/鸡蛋|鸭蛋|蛋/.test(ing)) benefits.push("卵磷脂与优质蛋白，护脑");
    if (/花生|芝麻|核桃|腰果|杏仁/.test(ing)) benefits.push("不饱和脂肪酸与维生素E");
    if (/牛奶|酸奶|奶酪|芝士/.test(ing)) benefits.push("直接补钙，强健骨骼");
    if (/海带|紫菜/.test(ing)) benefits.push("天然补碘");
    if (/红枣|枸杞|山药|红薯|玉米/.test(ing)) benefits.push("温和滋养，兼顾碳水与膳食纤维");
    if (/洋葱|葱|蒜|姜/.test(ing)) benefits.push("天然香辛，富含硫化物抗氧化");
    if (d.type === "veg") score += 8;
    if (d.type === "soup") score += 4;
    if (d.health.includes("light")) score += 6;
    if (d.health.includes("fitness")) score += 5;

    /* 注意事项（忌什么 / 谁不适合） */
    if (d.kcal > 550 || /炸|五花|肥肉|肥牛|红烧/.test(ing)) {
      cautions.push("热量与油脂偏高，减脂或血脂偏高人群适量"); score -= 12;
    }
    if (/酸菜|腊|咸鱼|榨菜|腌|火腿|香肠/.test(ing)) {
      cautions.push("腌制类较咸，钠偏高，高血压人群注意控盐"); score -= 6;
    }
    if (/虾|蟹|鱿|贝|鱼|海带|紫菜|内脏|浓汤/.test(ing)) {
      cautions.push("嘌呤中等偏高，痛风或高尿酸人群适量"); score -= 5;
    }
    if (d.spicy >= 2) { cautions.push("偏辣，肠胃敏感或哺乳期注意适量"); score -= 4; }
    if (d.flavor === "sweet" || /糖|冰糖|蜂蜜|可乐|白糖/.test(ing)) { cautions.push("含糖偏高，控糖人群注意"); score -= 4; }
    if (/菠菜|苋菜|空心菜|笋/.test(ing) && /豆腐|豆干|牛奶|虾皮/.test(ing)) {
      cautions.push("绿叶菜含草酸，与豆腐/高钙同食会降低钙吸收，想补钙可错开食用");
    }
    if (d.type === "cold") { cautions.push("凉菜偏凉，脾胃虚寒者少食"); score -= 2; }
    if (!cautions.length) cautions.push("整体较均衡，适合日常食用");

    score = Math.max(55, Math.min(98, score));
    const level = score >= 85 ? "很健康" : score >= 75 ? "比较均衡" : score >= 65 ? "普通" : "建议适量";
    const summary = [level, ...benefits.slice(0, 1), ...cautions.slice(0, 1)].join(" · ");
    return { score, level, benefits, cautions, summary };
  }

  /* ---------- 单菜换一换 ---------- */
  function altDish(dishes, index, opts, prefs, mode) {
    const ctx = buildCtx(opts, prefs, mode || "home");
    const d = dishes[index];
    if (!d) return null;
    let pool;
    if (mode === "couple") {
      pool = window.RECIPES.filter(x => passesAvoid(x, ctx.avoid));
      const occ = opts.occasion;
      if (occ === "anniversary") pool = pool.filter(x => x.coop >= 2 || x.type === "soup" || x.scene.includes("纪念日") || x.scene.includes("情侣"));
      else if (occ === "weekend") pool = pool.filter(x => x.coop >= 2 || x.scene.includes("周末") || x.type === "hot");
      else pool = pool.filter(x => x.coop >= 1);
    } else {
      pool = window.RECIPES.filter(x => passesAvoid(x, ctx.avoid) && x.coop <= 1 && x.type !== "staple" && x.type !== "cold");
    }
    let cands = pool.filter(x => x.type === d.type).map(x => ({ d: x, s: score(x, ctx) }));
    if (mode === "couple") cands.forEach(x => { if (x.d.coop >= 2) x.s += 10; if (x.d.coop === 3) x.s += 6; });
    cands = cands.filter(x => !dishes.some(c => c && c.id === x.d.id)).sort((a, b) => b.s - a.s);
    if (!cands.length) return null;
    const top = cands.slice(0, Math.min(8, cands.length));
    return pick(top).d;
  }

  // 食物相克知识库（常见搭配禁忌）
  const FOOD_CONFLICT_MAP = {
    "菠菜": { "豆腐": "菠菜含草酸，豆腐含钙，同食易形成草酸钙结石，建议菠菜先焯水", "牛奶": "菠菜与牛奶同食影响钙吸收" },
    "豆腐": { "菠菜": "豆腐含钙，菠菜含草酸，同食易形成草酸钙结石", "蜂蜜": "豆腐与蜂蜜同食易引起腹泻" },
    "螃蟹": { "柿子": "螃蟹与柿子同食易引起腹痛、腹泻，建议错开2小时以上", "梨": "螃蟹与梨同食伤肠胃", "花生": "螃蟹与花生同食易引起腹泻" },
    "柿子": { "螃蟹": "柿子与螃蟹同食易引起腹痛、腹泻", "红薯": "柿子与红薯同食易形成胃结石", "白酒": "柿子与白酒同食易形成结石" },
    "红薯": { "柿子": "红薯与柿子同食易形成胃结石", "香蕉": "红薯与香蕉同食易引起腹胀" },
    "牛奶": { "菠菜": "牛奶与菠菜同食影响钙吸收", "巧克力": "牛奶与巧克力同食影响钙吸收，易腹泻", "橘子": "牛奶与橘子同食影响蛋白质消化" },
    "鸡蛋": { "豆浆": "鸡蛋与豆浆同食影响蛋白质吸收，建议鸡蛋煮熟", "白糖": "鸡蛋与白糖同煮易形成不易吸收的物质" },
    "豆浆": { "鸡蛋": "豆浆与鸡蛋同食影响蛋白质吸收", "红糖": "豆浆与红糖同食影响营养吸收" },
    "猪肉": { "菊花": "猪肉与菊花同食易引起中毒", "香菜": "猪肉与香菜同食耗气" },
    "牛肉": { "栗子": "牛肉与栗子同食不易消化，易引起呕吐", "韭菜": "牛肉与韭菜同食易上火" },
    "羊肉": { "西瓜": "羊肉与西瓜同食伤元气", "南瓜": "羊肉与南瓜同食易上火和黄疸" },
    "鸡肉": { "芹菜": "鸡肉与芹菜同食伤元气", "芥末": "鸡肉与芥末同食伤元气" },
    "鸭肉": { "甲鱼": "鸭肉与甲鱼同食易引起水肿、腹泻", "栗子": "鸭肉与栗子同食易中毒" },
    "鲫鱼": { "芥菜": "鲫鱼与芥菜同食易引起水肿", "蜂蜜": "鲫鱼与蜂蜜同食易中毒" },
    "虾": { "维生素C": "虾与大量维生素C同食易生成三价砷（砒霜），建议避免同时服用维C片", "南瓜": "虾与南瓜同食易引起痢疾" },
    "黄瓜": { "花生": "黄瓜与花生同食易引起腹泻", "辣椒": "黄瓜与辣椒同食破坏维生素C" },
    "萝卜": { "水果": "萝卜与水果同食易诱发甲状腺肿大", "木耳": "萝卜与木耳同食易引起皮炎" },
    "土豆": { "香蕉": "土豆与香蕉同食易引起面部生斑", "柿子": "土豆与柿子同食易形成胃结石" },
    "西红柿": { "黄瓜": "西红柿与黄瓜同食破坏维生素C", "鱼肉": "西红柿与鱼肉同食影响铜吸收" },
    "茶": { "肉类": "茶与肉类同食影响铁吸收", "酒": "茶与酒同食伤肾", "药": "茶与药同食影响药效" },
    "酒": { "茶": "酒与茶同食伤肾", "胡萝卜": "酒与胡萝卜同食易引起肝损伤", "柿子": "酒与柿子同食易形成结石" },
    "胡萝卜": { "酒": "胡萝卜与酒同食易引起肝损伤", "白萝卜": "胡萝卜与白萝卜同食破坏维生素C" },
    "白萝卜": { "胡萝卜": "白萝卜与胡萝卜同食破坏维生素C", "水果": "白萝卜与水果同食易诱发甲状腺肿大" },
    "韭菜": { "牛肉": "韭菜与牛肉同食易上火", "蜂蜜": "韭菜与蜂蜜同食易引起腹泻" },
    "芹菜": { "鸡肉": "芹菜与鸡肉同食伤元气", "黄瓜": "芹菜与黄瓜同食破坏维生素C" },
    "花生": { "黄瓜": "花生与黄瓜同食易引起腹泻", "螃蟹": "花生与螃蟹同食易引起腹泻" },
    "蜂蜜": { "豆腐": "蜂蜜与豆腐同食易引起腹泻", "韭菜": "蜂蜜与韭菜同食易引起腹泻", "鲫鱼": "蜂蜜与鲫鱼同食易中毒" },
    "香蕉": { "红薯": "香蕉与红薯同食易引起腹胀", "土豆": "香蕉与土豆同食易引起面部生斑" },
    "西瓜": { "羊肉": "西瓜与羊肉同食伤元气", "油果子": "西瓜与油果子同食易引起呕吐" },
    "梨": { "螃蟹": "梨与螃蟹同食伤肠胃", "开水": "梨与开水同食易引起腹泻" },
    "橘子": { "牛奶": "橘子与牛奶同食影响蛋白质消化", "萝卜": "橘子与萝卜同食易诱发甲状腺肿大" },
    "巧克力": { "牛奶": "巧克力与牛奶同食影响钙吸收，易腹泻", "面包": "巧克力与面包同食易引起血糖升高" }
  };

  // 分析菜单中的食物相克
  function analyzeFoodConflict(dishes) {
    if (!dishes || !dishes.length) return { conflicts: [], tip: "" };
    
    // 收集所有菜品中的食材关键词
    const allIngredients = [];
    dishes.forEach(d => {
      if (d.ing && Array.isArray(d.ing)) {
        d.ing.forEach(([name, qty]) => {
          allIngredients.push({ name: name, dish: d.name });
        });
      }
      // 也检查菜名中是否包含相克食材
      Object.keys(FOOD_CONFLICT_MAP).forEach(ing => {
        if (d.name && d.name.includes(ing) && !allIngredients.find(i => i.name === ing)) {
          allIngredients.push({ name: ing, dish: d.name });
        }
      });
    });

    const conflicts = [];
    const seen = new Set();
    
    // 检查食材之间的相克关系
    for (let i = 0; i < allIngredients.length; i++) {
      for (let j = i + 1; j < allIngredients.length; j++) {
        const a = allIngredients[i];
        const b = allIngredients[j];
        const conflict = FOOD_CONFLICT_MAP[a.name] && FOOD_CONFLICT_MAP[a.name][b.name];
        const conflict2 = FOOD_CONFLICT_MAP[b.name] && FOOD_CONFLICT_MAP[b.name][a.name];
        const desc = conflict || conflict2;
        
        if (desc) {
          const key = [a.name, b.name].sort().join("+");
          if (!seen.has(key)) {
            seen.add(key);
            conflicts.push({
              pair: `${a.name} + ${b.name}`,
              dishes: `${a.dish} / ${b.dish}`,
              desc: desc
            });
          }
        }
      }
    }

    let tip = "";
    if (conflicts.length > 0) {
      tip = `检测到${conflicts.length}组需要注意的搭配，建议错开食用时间或调整做法`;
    } else {
      tip = "今日菜单食材搭配合理，无明显相克问题";
    }

    return { conflicts, tip };
  }

  return {
    REGION_FLAVOR, AVOID_MAP,
    genHomeMenu, genCoupleMenu, buildCtx, score,
    buildReason, buildList, channelAdvice,
    drawRoles, loveTask, buildMemorial,
    assessNutrition, altDish,
    priceOf, PRICE_MAP,
    QUIZES,
    getSeason, SEASON_INFO, getLuckyDish,
    analyzeMenuNutrition, addDislike, getDislikeHistory, isDisliked,
    analyzeFoodConflict
  };
})();
