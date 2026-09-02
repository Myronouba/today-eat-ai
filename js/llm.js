/* ============================================================
   今天吃啥 AI 版 · LLM 接入层（可配置升级）
   - 未配置 key  → 返回 null，由本地引擎兜底
   - 配置 key 后 → 调用 OpenAI 兼容接口做 AI 增强渲染
   兼容：豆包/火山方舟、DeepSeek、通义千问等（OpenAI 格式）

   ⚠️ 【安全警告】当前 API Key 存储在 localStorage 前端直接调用，生产环境必须改为后端代理，详见 api/API_DESIGN.md
   ============================================================ */
window.AI = (function () {
  const CFG_KEY = "eat-ai-config";

  function getConfig() {
    try { return JSON.parse(localStorage.getItem(CFG_KEY) || "null"); } catch (e) { return null; }
  }
  function saveConfig(cfg) { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); }
  function clearConfig() { localStorage.removeItem(CFG_KEY); }
  function configured() {
    const c = getConfig();
    return !!(c && c.apiKey && c.endpoint);
  }

  /* 调用 OpenAI 兼容 chat/completions */
  async function chat(messages, opts) {
    const cfg = getConfig();
    if (!cfg || !cfg.apiKey || !cfg.endpoint) return null;
    const res = await fetch(cfg.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + cfg.apiKey
      },
      body: JSON.stringify({
        model: cfg.model || "doubao-seed-1-6-250615",
        messages,
        temperature: opts && opts.temperature !== undefined ? opts.temperature : 0.8,
        max_tokens: opts && opts.max_tokens || 400
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return text || null;
  }

  /* 增强：生成推荐理由文案（失败/未配置 → null，调用方用本地文案） */
  async function enhanceReason(dishes, ctx, mode, opts, prefs) {
    if (!configured()) return null;
    const list = dishes.map(d => d.name + (d.coop >= 2 ? "(协作" + d.coop + ")" : "")).join("、");
    const sys = "你是一个懂生活、懂口味的中国美食推荐助手，用自然、亲切、不油腻的中文写推荐语，不超过 80 字。";
    const user = `用户情况：${prefs.region ? "来自" + prefs.region : "地区未知"}，${ctx.people}人吃，${ctx.cooker === "lazy" ? "懒人" : ctx.cooker === "newbie" ? "新手" : "老手"}做饭，辣度${ctx.spicyTarget}，健康目标${ctx.health}。${mode === "couple" ? "情侣一起做饭" : "在家吃饭"}。推荐了：${list}。请写一句推荐理由。`;
    return chat([{ role: "system", content: sys }, { role: "user", content: user }]);
  }

  /* 增强：生成感情任务（纪念日升级） */
  async function enhanceLoveTask(occasion, dishes) {
    if (!configured()) return null;
    const sys = "你是一个浪漫但不肉麻的情感助手，写一句简短有温度的情侣互动小任务，不超过 40 字，不含称呼。";
    const user = `今天是${occasion === "anniversary" ? "纪念日" : occasion === "weekend" ? "周末" : "日常"}，一起做了：${dishes.map(d => d.name).join("、")}。请给一句增进感情的互动任务。`;
    return chat([{ role: "system", content: sys }, { role: "user", content: user }]);
  }

  /* 预设的Endpoint配置 */
  const ENDPOINTS = {
    doubao: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    deepseek: "https://api.deepseek.com/chat/completions",
    custom: ""
  };

  /* 测试连接 */
  async function testConnection() {
    const cfg = getConfig();
    if (!cfg || !cfg.apiKey || !cfg.endpoint) {
      return { success: false, error: "请先填写API Key和地址" };
    }
    try {
      const startTime = Date.now();
      const res = await fetch(cfg.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + cfg.apiKey
        },
        body: JSON.stringify({
          model: cfg.model || "doubao-seed-1-6-250615",
          messages: [{ role: "user", content: "你好，请回复'连接成功'" }],
          temperature: 0.1,
          max_tokens: 50
        })
      });
      const elapsed = Date.now() - startTime;
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return { success: false, error: `HTTP ${res.status}: ${errText.substring(0, 100)}`, elapsed };
      }
      const data = await res.json();
      const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      return { success: true, message: text || "连接成功", elapsed, model: data.model || cfg.model };
    } catch (e) {
      return { success: false, error: e.message || "网络错误" };
    }
  }

  /* 获取当前配置状态 */
  function getStatus() {
    const cfg = getConfig();
    if (!cfg || !cfg.apiKey || !cfg.endpoint) {
      return { configured: false, model: null, endpoint: null };
    }
    return {
      configured: true,
      model: cfg.model || "doubao-seed-1-6-250615",
      endpoint: cfg.endpoint,
      temperature: cfg.temperature !== undefined ? cfg.temperature : 0.8,
      maxTokens: cfg.maxTokens || 400
    };
  }

  /* 获取预设Endpoint */
  function getEndpoints() { return ENDPOINTS; }


  /* ========== 全AI模式：生成菜单 ========== */
  /* ========== 全AI模式：生成菜单（创意版） ========== */
  async function generateMenu(params) {
    if (!configured()) return null;

    const {
      people = 2, cooker = "normal", spicyTarget = "medium",
      health = "normal", ingredients = [], cuisine = "",
      scene = "home", mode = "home", dishCount = 0, occasion = "daily",
      tastePrefs = [], dislikes = [], history = [], season = "", mood = ""
    } = params || {};

    const count = dishCount || (people <= 1 ? 3 : people <= 2 ? 4 : people <= 4 ? 5 : 6);
    const spicyDesc = { none: "完全不辣", mild: "微辣", medium: "中等辣度", hot: "比较辣", crazy: "重辣" }[spicyTarget] || "中等辣度";
    const healthDesc = { normal: "正常饮食", light: "清淡健康", fitness: "健身塑型", lowcal: "低卡减脂", highprotein: "高蛋白增肌" }[health] || "正常饮食";
    const cookerDesc = { lazy: "懒人快手", newbie: "新手入门", normal: "普通水平", expert: "厨艺高手" }[cooker] || "普通水平";
    const sceneDesc = { home: "在家做饭", couple: "情侣一起做饭", out: "出去下馆子", takeout: "点外卖" }[mode] || "在家做饭";

    const sysPrompt = `你是一位创意中国美食推荐师，精通八大菜系、地方特色菜和创意融合菜。你的任务是为用户推荐一桌有特色、不重样、让人眼前一亮的菜单。

【核心原则】
1. 拒绝平庸：不要推荐番茄炒蛋、红烧肉、宫保鸡丁这种烂大街的菜。优先推荐有地方特色、有故事、有创意的菜。
2. 真实存在：所有菜品必须是真实存在的中国菜，不能编造。可以是地方小众菜、老字号招牌菜、创意融合菜。
3. 搭配合理：整桌菜要有荤有素、有冷有热、可加汤，口味层次丰富。
4. 食材常见：食材要能在普通菜市场或超市买到。
5. 难度匹配：根据用户做饭水平推荐相应难度的菜。

【每道菜必须包含】
- name: 菜名（可以带地方前缀）
- type: hot(荤菜)|veg(素菜)|cold(凉菜)|soup(汤)
- cuisine: 菜系/地方特色
- spicy: 0-3辣度
- flavor: 主要味型
- time: 预计分钟数
- diff: 简单|中等|较难
- kcal: 每份卡路里
- protein: 每份蛋白质克数
- ing: 主要食材列表（5-8种）
- steps: 做法步骤（4-6步，每步不超过20字）
- reason: 为什么推荐这道菜（20-40字）
- tip: 烹饪小贴士（15-30字）
- pairing: 搭配建议（15-30字）

【整体信息】
- reason: 整桌菜的推荐理由（60-100字）
- theme: 这桌菜的主题
- analysis: 整桌菜的搭配分析（80-120字）
- nutrition: 营养总结（40-60字）

【重要提醒】
- 严格返回JSON，不要有任何额外文字
- 每道菜的reason、tip、pairing必须填写
- 菜品之间不要重复食材太多
- 如果用户提供了冰箱食材，至少2-3道菜要用到`;

    let userPrompt = `【用户画像】
- 人数：${people}人
- 场景：${sceneDesc}
- 做饭水平：${cookerDesc}
- 辣度：${spicyDesc}
- 健康目标：${healthDesc}
- 推荐菜品数量：${count}道`;

    if (ingredients && ingredients.length > 0) userPrompt += `\n- 冰箱现有食材：${ingredients.join("、")}（至少2-3道菜用到）`;
    if (cuisine) userPrompt += `\n- 偏好菜系：${cuisine}`;
    if (tastePrefs && tastePrefs.length > 0) userPrompt += `\n- 口味偏好：${tastePrefs.join("、")}`;
    if (dislikes && dislikes.length > 0) userPrompt += `\n- 忌口：${dislikes.join("、")}（绝对不要推荐）`;
    if (history && history.length > 0) userPrompt += `\n- 最近吃过：${history.join("、")}（尽量不要重复）`;
    if (season) userPrompt += `\n- 当前季节：${season}（推荐应季菜）`;
    if (mode === "couple") {
      userPrompt += `\n- 情侣一起做饭，要有氛围感和仪式感`;
      if (occasion && occasion !== "daily") {
        const occDesc = { anniversary: "纪念日", weekend: "周末", birthday: "生日" }[occasion] || occasion;
        userPrompt += `\n- 今天是${occDesc}，推荐有仪式感的菜`;
      }
    }
    if (mode === "takeout") userPrompt += `\n- 点外卖，推荐适合外卖的菜品`;
    if (mode === "out") userPrompt += `\n- 出去下馆子，推荐餐厅常见且有特色的菜`;
    if (health === "fitness" || health === "highprotein") userPrompt += `\n- 重点：高蛋白、低脂，推荐鸡胸肉、鱼虾、牛肉`;
    if (health === "lowcal") userPrompt += `\n- 重点：低卡路里、低碳水，推荐清蒸、水煮、凉拌`;

    userPrompt += `\n\n【要求】推荐一桌有特色、不重样、让人眼前一亮的菜单。不要推荐烂大街的家常菜，要有地方特色或创意。每道菜都要有推荐理由、烹饪小贴士和搭配建议。返回JSON。`;

    try {
      const cfg = getConfig();
      const res = await fetch(cfg.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.apiKey },
        body: JSON.stringify({
          model: cfg.model || "doubao-seed-1-6-250615",
          messages: [{ role: "system", content: sysPrompt }, { role: "user", content: userPrompt }],
          temperature: 0.9,
          max_tokens: 3000,
          response_format: { type: "json_object" }
        })
      });

      if (!res.ok) { console.warn("AI生成菜单失败:", res.status); return null; }
      const data = await res.json();
      const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!text) return null;

      let result;
      try { result = JSON.parse(text); }
      catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) { try { result = JSON.parse(jsonMatch[0]); } catch (e2) { return null; } }
        else return null;
      }

      if (!result || !result.dishes || !Array.isArray(result.dishes) || result.dishes.length === 0) return null;

      const dishes = result.dishes.map((d, i) => ({
        id: "ai_" + Date.now() + "_" + i,
        name: d.name || "未知菜品",
        type: d.type || "hot",
        cuisine: d.cuisine || "家常菜",
        spicy: typeof d.spicy === "number" ? d.spicy : 0,
        flavor: d.flavor || "咸鲜",
        time: d.time || 20,
        diff: d.diff || "中等",
        kcal: d.kcal || 200,
        protein: d.protein || 10,
        ing: Array.isArray(d.ing) ? d.ing : [],
        steps: Array.isArray(d.steps) ? d.steps : [],
        desc: d.desc || d.reason || "",
        reason: d.reason || "",
        tip: d.tip || "",
        pairing: d.pairing || "",
        coop: mode === "couple" ? (i % 2 === 0 ? 2 : 1) : 1,
        aiGenerated: true
      }));

      return { dishes, reason: result.reason || "", theme: result.theme || "", analysis: result.analysis || "", nutrition: result.nutrition || "", aiGenerated: true };
    } catch (e) { console.warn("AI生成菜单异常:", e); return null; }
  }

  return { getConfig, saveConfig, clearConfig, configured, chat, enhanceReason, enhanceLoveTask, testConnection, getStatus, getEndpoints, generateMenu };
})();
