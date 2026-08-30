/* ============================================================
   今天吃啥 AI 版 · 菜友圈（吃货朋友圈）
   ============================================================ */
(function () {
  "use strict";
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const LS_MOMENTS = "eat-ai-moments";
  const LS_MOMENTS_LIKES = "eat-ai-moments-likes";

  // 模拟用户数据
  const MOCK_USERS = [
    { name: "吃货小王", avatar: "🍳" },
    { name: "美食家小李", avatar: "🍜" },
    { name: "厨房新手", avatar: "🥘" },
    { name: "健康饮食达人", avatar: "🥗" },
    { name: "川菜爱好者", avatar: "🌶️" },
    { name: "甜品控", avatar: "🍰" },
    { name: "深夜食堂", avatar: "🍱" },
    { name: "素食主义", avatar: "🥬" },
  ];

  // 模拟动态数据
  const MOCK_MOMENTS = [
    {
      id: "m1",
      user: MOCK_USERS[0],
      text: "今天做了番茄牛腩，炖了两个小时，入口即化！配米饭绝了🍚",
      dish: "番茄牛腩",
      images: ["🍅", "🥩", "🍚"],
      likes: ["美食家小李", "厨房新手"],
      comments: [
        { user: "美食家小李", text: "看着就好吃！求教程" },
        { user: "厨房新手", text: "番茄要炒出沙吗？" },
      ],
      ts: Date.now() - 3600000,
    },
    {
      id: "m2",
      user: MOCK_USERS[1],
      text: "周末和朋友一起做了满汉全席，从下午忙到晚上，累并快乐着！",
      dish: "家庭聚餐",
      images: ["🦐", "🐟", "🍗", "🥬", "🍲", "🍚"],
      likes: ["吃货小王", "健康饮食达人", "川菜爱好者"],
      comments: [
        { user: "吃货小王", text: "太丰盛了吧！" },
      ],
      ts: Date.now() - 7200000,
    },
    {
      id: "m3",
      user: MOCK_USERS[2],
      text: "第一次做可乐鸡翅，虽然有点糊了，但是味道还不错！继续加油💪",
      dish: "可乐鸡翅",
      images: ["🍗"],
      likes: ["甜品控"],
      comments: [],
      ts: Date.now() - 10800000,
    },
    {
      id: "m4",
      user: MOCK_USERS[3],
      text: "今日健康餐：鸡胸肉沙拉 + 藜麦饭，低卡高蛋白，减脂期必备！",
      dish: "鸡胸肉沙拉",
      images: ["🥗", "🍚"],
      likes: ["素食主义", "深夜食堂"],
      comments: [
        { user: "素食主义", text: "可以把鸡胸肉换成豆腐哦" },
      ],
      ts: Date.now() - 14400000,
    },
    {
      id: "m5",
      user: MOCK_USERS[4],
      text: "麻婆豆腐+水煮鱼，辣得过瘾！四川人的快乐就是这么简单🌶️",
      dish: "麻婆豆腐",
      images: ["🌶️", "🐟", "🍚"],
      likes: ["吃货小王", "美食家小李"],
      comments: [
        { user: "美食家小李", text: "看着就流口水了" },
        { user: "甜品控", text: "太辣了不敢吃😂" },
      ],
      ts: Date.now() - 18000000,
    },
  ];

  // 加载动态数据
  function loadMoments() {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_MOMENTS) || "null");
      if (saved && saved.length) return saved;
    } catch (e) {}
    // 首次使用，保存模拟数据
    localStorage.setItem(LS_MOMENTS, JSON.stringify(MOCK_MOMENTS));
    return MOCK_MOMENTS;
  }

  function saveMoments(moments) {
    localStorage.setItem(LS_MOMENTS, JSON.stringify(moments.slice(0, 50)));
  }

  // 加载点赞状态
  function loadLikes() {
    try { return JSON.parse(localStorage.getItem(LS_MOMENTS_LIKES) || "{}"); }
    catch (e) { return {}; }
  }

  function saveLikes(likes) {
    localStorage.setItem(LS_MOMENTS_LIKES, JSON.stringify(likes));
  }

  // 格式化时间
  function formatTime(ts) {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "刚刚";
    if (min < 60) return min + "分钟前";
    const hour = Math.floor(min / 60);
    if (hour < 24) return hour + "小时前";
    const day = Math.floor(hour / 24);
    if (day < 7) return day + "天前";
    const d = new Date(ts);
    return (d.getMonth() + 1) + "月" + d.getDate() + "日";
  }

  // 渲染动态列表
  function renderMoments() {
    const moments = loadMoments();
    const likes = loadLikes();
    const listEl = $("#momentsList");
    if (!listEl) return;

    listEl.innerHTML = moments.map(m => {
      const isLiked = likes[m.id];
      const likeCount = m.likes.length + (isLiked ? 1 : 0);
      const imagesHTML = m.images && m.images.length
        ? `<div class="moment-images">${m.images.slice(0, 9).map(img => `<div class="moment-img">${img}</div>`).join("")}</div>`
        : "";
      const dishHTML = m.dish ? `<span class="moment-dish-tag">🍽️ ${m.dish}</span>` : "";
      const likesHTML = likeCount > 0
        ? `<div class="moment-likes">❤️ ${m.likes.join("、")}${isLiked ? "、我" : ""} 等${likeCount}人觉得很赞</div>`
        : "";
      const commentsHTML = m.comments && m.comments.length
        ? `<div class="moment-comments">${m.comments.map(c => `<div class="moment-comment"><b>${c.user}</b>：${c.text}</div>`).join("")}</div>`
        : "";

      return `
        <div class="moment-item" data-id="${m.id}">
          <div class="moment-avatar">${m.user.avatar}</div>
          <div class="moment-body">
            <div class="moment-name">${m.user.name}</div>
            <div class="moment-text">${m.text}</div>
            ${dishHTML}
            ${imagesHTML}
            <div class="moment-footer">
              <span class="moment-time">${formatTime(m.ts)}</span>
              <div class="moment-actions">
                <button class="moment-action-btn btn-like ${isLiked ? "liked" : ""}" data-id="${m.id}">
                  ${isLiked ? "❤️" : "🤍"} ${likeCount || ""}
                </button>
                <button class="moment-action-btn btn-comment" data-id="${m.id}">
                  💬 ${m.comments.length || ""}
                </button>
              </div>
            </div>
            ${likesHTML}
            ${commentsHTML}
            <div class="moment-comment-input hidden" data-id="${m.id}">
              <input type="text" placeholder="说点什么..." class="comment-input">
              <button class="comment-submit">发送</button>
            </div>
          </div>
        </div>`;
    }).join("");

    // 绑定点赞事件
    $$(".btn-like", listEl).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const likes = loadLikes();
        likes[id] = !likes[id];
        saveLikes(likes);
        renderMoments();
      });
    });

    // 绑定评论按钮事件
    $$(".btn-comment", listEl).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const inputEl = $(`.moment-comment-input[data-id="${id}"]`);
        if (inputEl) {
          inputEl.classList.toggle("hidden");
          if (!inputEl.classList.contains("hidden")) {
            inputEl.querySelector("input").focus();
          }
        }
      });
    });

    // 绑定评论提交事件
    $$(".comment-submit", listEl).forEach(btn => {
      btn.addEventListener("click", () => {
        const inputWrap = btn.closest(".moment-comment-input");
        const id = inputWrap.dataset.id;
        const input = inputWrap.querySelector("input");
        const text = input.value.trim();
        if (!text) return;

        const moments = loadMoments();
        const m = moments.find(x => x.id === id);
        if (m) {
          m.comments.push({ user: "我", text });
          saveMoments(moments);
          renderMoments();
        }
      });
    });
  }

  // 发布动态
  function postMoment(text, dish) {
    const moments = loadMoments();
    const user = loadUser() || { name: "吃货", avatar: "🍅" };
    const newMoment = {
      id: "m" + Date.now(),
      user: { name: user.nickname || "吃货", avatar: user.avatar || "🍅" },
      text,
      dish: dish || "",
      images: [],
      likes: [],
      comments: [],
      ts: Date.now(),
    };
    moments.unshift(newMoment);
    saveMoments(moments);
    renderMoments();
  }

  function loadUser() {
    try { return JSON.parse(localStorage.getItem("eat-ai-user") || "null"); }
    catch (e) { return null; }
  }

  // 初始化
  function init() {
    // 渲染菜友圈
    renderMoments();

    // 更新用户信息
    const user = loadUser();
    const avatarEl = $("#momentsAvatar");
    const nameEl = $("#momentsName");
    if (avatarEl) avatarEl.textContent = user && user.avatar ? user.avatar : "🍅";
    if (nameEl) nameEl.textContent = user && user.nickname ? user.nickname : "吃货";

    // 发布动态按钮
    const postBtn = $("#btnMomentsPost");
    if (postBtn) {
      postBtn.addEventListener("click", () => {
        $("#momentsPostModal").classList.remove("hidden");
        $("#momentsPostText").value = "";
        $("#momentsPostDishName").textContent = "未关联";
      });
    }

    // 取消发布
    const cancelBtn = $("#btnMomentsPostCancel");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        $("#momentsPostModal").classList.add("hidden");
      });
    }

    // 提交发布
    const submitBtn = $("#btnMomentsPostSubmit");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        const text = $("#momentsPostText").value.trim();
        const dish = $("#momentsPostDishName").textContent;
        if (!text) { alert("说点什么吧~"); return; }
        postMoment(text, dish === "未关联" ? "" : dish);
        $("#momentsPostModal").classList.add("hidden");
        if (window.toast) window.toast("发布成功！");
      });
    }

    // 点击弹层背景关闭
    const modal = $("#momentsPostModal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      });
    }

    // 选择关联菜品（简单实现，随机选一个）
    const pickDishBtn = $("#btnMomentsPickDish");
    if (pickDishBtn) {
      pickDishBtn.addEventListener("click", () => {
        const dishes = ["番茄炒蛋", "红烧肉", "可乐鸡翅", "麻婆豆腐", "清蒸鲈鱼", "宫保鸡丁", "糖醋里脊", "蒜蓉西兰花"];
        const dish = dishes[Math.floor(Math.random() * dishes.length)];
        $("#momentsPostDishName").textContent = dish;
      });
    }
  }

  // 暴露给全局
  window.renderMoments = renderMoments;
  window.momentsInit = init;

  // DOM加载完成后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
