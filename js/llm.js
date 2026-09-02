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
  async function generateMenu(params) {
    if (!configured()) return null;

    const {
      people = 2,
      cooker = "normal",
      spicyTarget = "medium",
      health = "normal",
      ingredients = [],
      cuisine = "",
      scene = "home",
      mode = "home", // home/couple/out/takeout
      dishCount = 0,
      occasion = "daily"
    } = params || {};

    // 根据人数确定菜品数量
    const count = dishCount || (people <= 1 ? 3 : people <= 2 ? 4 : people <= 4 ? 5 : 6);

    // 辣度描述
    const spicyDesc = {
      none: "完全不辣",
      mild: "微辣",
      medium: "中等辣度",
      hot: "比较辣",
      crazy: "重辣"
    }[spicyTarget] || "中等辣度";

    // 健康目标描述
    const healthDesc = {
      normal: "正常饮食",
      light: "清淡健康",
      fitness: "健身塑型",
      lowcal: "低卡减脂",
      highprotein: "高蛋白增肌"
    }[health] || "正常饮食";

    // 做饭水平描述
    const cookerDesc = {
      lazy: "懒人快手",
      newbie: "新手入门",
      normal: "普通水平",
      expert: "厨艺高手"
    }[cooker] || "普通水平";

    // 场景描述
    const sceneDesc = {
      home: "在家做饭",
      couple: "情侣一起做饭",
      out: "出去下馆子",
      takeout: "点外卖"
    }[mode] || "在家做饭";

    // 构建系统提示
    const sysPrompt = `你是一个专业的中国美食推荐助手，精通八大菜系和家常菜。根据用户需求推荐真实存在的中国菜，返回严格的JSON格式。

要求：
1. 必须是真实存在的中国菜，不能编造菜名
2. 食材要常见、容易买到
3. 卡路里和蛋白质数据要合理（每份/每100g）
4. 做法步骤要简洁实用，每步不超过20字
5. 菜品搭配要合理，有荤有素，可加汤
6. 根据人数确定菜品数量，不要太多也不要太少
7. 严格返回JSON，不要有任何额外文字、解释或markdown标记

返回JSON格式：
{
  "dishes": [
    {
      "name": "菜名",
      "type": "hot|veg|cold|soup",
      "cuisine": "菜系",
      "spicy": 0-3,
      "flavor": "口味",
      "time": 分钟数,
      "diff": "简单|中等|较难",
      "kcal": 卡路里,
      "protein": 蛋白质克数,
      "ing": ["食材1", "食材2"],
      "steps": ["步骤1", "步骤2"],
      "desc": "一句话描述"
    }
  ],
  "reason": "整体推荐理由，不超过80字"
}`;

    // 构建用户提示
    let userPrompt = `用户需求：
- 人数：${people}人
- 场景：${sceneDesc}
- 做饭水平：${cookerDesc}
- 辣度：${spicyDesc}
- 健康目标：${healthDesc}
- 推荐菜品数量：${count}道`;

    if (ingredients && ingredients.length > 0) {
      userPrompt += `\n- 冰箱现有食材：${ingredients.join("、")}（优先使用这些食材）`;
    }
    if (cuisine) {
      userPrompt += `\n- 偏好菜系：${cuisine}`;
    }
    if (mode === "couple") {
      userPrompt += `\n- 情侣一起做饭，菜品要适合两人协作，有氛围感`;
      if (occasion && occasion !== "daily") {
        const occDesc = { anniversary: "纪念日", weekend: "周末", birthday: "生日" }[occasion] || occasion;
        userPrompt += `\n- 今天是${occDesc}，可以推荐一些有仪式感的菜`;
      }
    }
    if (mode === "takeout") {
      userPrompt += `\n- 点外卖，推荐适合外卖的菜品，不要推荐需要现做现吃口感变化大的菜`;
    }
    if (mode === "out") {
      userPrompt += `\n- 出去下馆子，推荐餐厅常见菜品`;
    }
    if (health === "fitness" || health === "highprotein") {
      userPrompt += `\n- 重点：高蛋白、低脂、适合健身人群`;
    }
    if (health === "lowcal") {
      userPrompt += `\n- 重点：低卡路里、低碳水、适合减脂`;
    }

    userPrompt += `\n\n请返回JSON格式的推荐菜单。`;

    try {
      const cfg = getConfig();
      const res = await fetch(cfg.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + cfg.apiKey
        },
        body: JSON.stringify({
          model: cfg.model || "doubao-seed-1-6-250615",
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: cfg.temperature !== undefined ? cfg.temperature : 0.7,
          max_tokens: cfg.maxTokens || 2000,
          response_format: { type: "json_object" }
        })
      });

      if (!res.ok) {
        console.warn("AI生成菜单失败:", res.status);
        return null;
      }

      const data = await res.json();
      const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

      if (!text) return null;

      // 解析JSON
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        // 尝试提取JSON部分
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (e2) {
            console.warn("AI返回JSON解析失败:", e2);
            return null;
          }
        } else {
          console.warn("AI返回无JSON:", text.substring(0, 200));
          return null;
        }
      }

      // 验证结果
      if (!result || !result.dishes || !Array.isArray(result.dishes) || result.dishes.length === 0) {
        console.warn("AI返回菜品为空");
        return null;
      }

      // 规范化菜品数据
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
        desc: d.desc || "",
        coop: mode === "couple" ? (i % 2 === 0 ? 2 : 1) : 1,
        aiGenerated: true
      }));

      return {
        dishes,
        reason: result.reason || "",
        aiGenerated: true
      };

    } catch (e) {
      console.warn("AI生成菜单异常:", e);
      return null;
    }
  }

  return { getConfig, saveConfig, clearConfig, configured, chat, enhanceReason, enhanceLoveTask, testConnection, getStatus, getEndpoints, generateMenu };
})();
