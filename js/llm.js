/* ============================================================
   今天吃啥 AI 版 · LLM 接入层（可配置升级）
   - 未配置 key  → 返回 null，由本地引擎兜底
   - 配置 key 后 → 调用 OpenAI 兼容接口做 AI 增强渲染
   兼容：豆包/火山方舟、DeepSeek、通义千问等（OpenAI 格式）
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

  return { getConfig, saveConfig, clearConfig, configured, chat, enhanceReason, enhanceLoveTask };
})();
