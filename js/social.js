/* ============================================================
 * 今天吃啥AI版 - 社交功能（通讯录/个人资料/聊天/好友关系）
 * ============================================================ */

(function () {
  "use strict";

  // ========== 模拟用户数据 ==========
  const MOCK_USERS = [
    { id: "u001", name: "吃货小王", avatar: "🍔", signature: "人生苦短，必须吃饱", location: "上海", dishes: ["红烧肉", "麻婆豆腐"], isFriend: true },
    { id: "u002", name: "美食家小李", avatar: "🍜", signature: "吃遍天下美食", location: "北京", dishes: ["北京烤鸭", "炸酱面"], isFriend: true },
    { id: "u003", name: "厨房小白", avatar: "🥗", signature: "正在学做饭", location: "广州", dishes: ["白切鸡", "煲仔饭"], isFriend: true },
    { id: "u004", name: "辣妹子", avatar: "🌶️", signature: "无辣不欢", location: "成都", dishes: ["火锅", "水煮鱼"], isFriend: false },
    { id: "u005", name: "甜品控", avatar: "🍰", signature: "甜品是另一个胃", location: "杭州", dishes: ["西湖醋鱼", "龙井虾仁"], isFriend: false },
    { id: "u006", name: "健身达人", avatar: "💪", signature: "吃健康的，练最狠的", location: "深圳", dishes: ["鸡胸肉沙拉", "糙米饭"], isFriend: false },
    { id: "u007", name: "夜宵王者", avatar: "🍢", signature: "深夜放毒", location: "长沙", dishes: ["小龙虾", "臭豆腐"], isFriend: false },
    { id: "u008", name: "素食主义", avatar: "🥦", signature: "吃素也能很美味", location: "南京", dishes: ["素什锦", "豆腐煲"], isFriend: false }
  ];

  // ========== localStorage keys ==========
  const LS_FRIENDS = "eat-ai-friends";
  const LS_CHAT_PREFIX = "eat-ai-chat-";
  const LS_FRIEND_REQUESTS = "eat-ai-friend-requests";

  // ========== 当前查看的用户 ==========
  let currentProfileUser = null;
  let currentChatUser = null;

  // ========== 工具函数 ==========
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

  function getFriends() {
    try {
      const data = localStorage.getItem(LS_FRIENDS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    // 默认好友
    return MOCK_USERS.filter(u => u.isFriend).map(u => u.id);
  }

  function saveFriends(friends) {
    localStorage.setItem(LS_FRIENDS, JSON.stringify(friends));
  }

  function isFriend(userId) {
    return getFriends().includes(userId);
  }

  function addFriend(userId) {
    const friends = getFriends();
    if (!friends.includes(userId)) {
      friends.push(userId);
      saveFriends(friends);
    }
  }

  function getUserById(userId) {
    return MOCK_USERS.find(u => u.id === userId);
  }

  function getChatMessages(userId) {
    try {
      const data = localStorage.getItem(LS_CHAT_PREFIX + userId);
      if (data) return JSON.parse(data);
    } catch (e) {}
    // 默认消息
    const user = getUserById(userId);
    if (user) {
      return [
        { from: userId, text: "你好呀！我是" + user.name + "，很高兴认识你！", time: Date.now() - 3600000 },
        { from: userId, text: "你平时喜欢吃什么呀？", time: Date.now() - 3500000 }
      ];
    }
    return [];
  }

  function saveChatMessages(userId, messages) {
    localStorage.setItem(LS_CHAT_PREFIX + userId, JSON.stringify(messages));
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0");
    }
    return (d.getMonth() + 1) + "/" + d.getDate() + " " + d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0");
  }

  // ========== 通讯录页面渲染 ==========
  function renderContacts() {
    const list = $("#contactsList");
    if (!list) return;

    const searchInput = $("#contactsSearchInput");
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const friends = getFriends();
    let friendUsers = MOCK_USERS.filter(u => friends.includes(u.id));

    if (keyword) {
      friendUsers = friendUsers.filter(u =>
        u.name.toLowerCase().includes(keyword) ||
        u.signature.toLowerCase().includes(keyword)
      );
    }

    if (friendUsers.length === 0) {
      list.innerHTML = '<div class="contacts-empty">还没有菜友，点击下方按钮添加吧～</div>';
      return;
    }

    list.innerHTML = friendUsers.map(u => `
      <div class="contact-item" data-user-id="${u.id}">
        <div class="contact-avatar">${u.avatar}</div>
        <div class="contact-info">
          <div class="contact-name">${u.name}</div>
          <div class="contact-signature">${u.signature}</div>
        </div>
        <div class="contact-arrow">›</div>
      </div>
    `).join("");

    // 绑定点击事件
    $$(".contact-item").forEach(item => {
      item.addEventListener("click", () => {
        const userId = item.dataset.userId;
        showUserProfile(userId);
      });
    });
  }

  // ========== 显示用户个人资料 ==========
  function showUserProfile(userId) {
    const user = getUserById(userId);
    if (!user) return;

    currentProfileUser = user;

    const card = $("#profileCard");
    const actions = $("#profileActions");
    if (!card || !actions) return;

    const friend = isFriend(userId);

    card.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${user.avatar}</div>
        <div class="profile-info">
          <div class="profile-name">${user.name}</div>
          <div class="profile-location">📍 ${user.location}</div>
          <div class="profile-signature">${user.signature}</div>
        </div>
      </div>
      <div class="profile-dishes">
        <div class="profile-dishes-title">拿手菜</div>
        <div class="profile-dishes-list">
          ${user.dishes.map(d => `<span class="profile-dish-tag">${d}</span>`).join("")}
        </div>
      </div>
      <div class="profile-stats">
        <div class="profile-stat">
          <div class="profile-stat-num">${Math.floor(Math.random() * 50) + 10}</div>
          <div class="profile-stat-label">动态</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-num">${friends.length || 0}</div>
          <div class="profile-stat-label">菜友</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-num">${Math.floor(Math.random() * 100) + 20}</div>
          <div class="profile-stat-label">获赞</div>
        </div>
      </div>
    `;

    if (friend) {
      actions.innerHTML = `
        <button class="profile-action-btn primary" id="profileSendMsgBtn">💬 发消息</button>
      `;
      $("#profileSendMsgBtn").addEventListener("click", () => {
        startChat(userId);
      });
    } else {
      actions.innerHTML = `
        <button class="profile-action-btn primary" id="profileAddFriendBtn">➕ 加菜友</button>
      `;
      $("#profileAddFriendBtn").addEventListener("click", () => {
        addFriend(userId);
        alert("已添加" + user.name + "为菜友！");
        showUserProfile(userId); // 刷新
      });
    }

    if (window.showView) window.showView("user-profile");
  }

  // ========== 开始聊天 ==========
  function startChat(userId) {
    const user = getUserById(userId);
    if (!user) return;

    currentChatUser = user;

    const title = $("#chatTitle");
    if (title) title.textContent = user.name;

    renderChatMessages();

    if (window.showView) window.showView("chat");
  }

  // ========== 渲染聊天消息 ==========
  function renderChatMessages() {
    const container = $("#chatMessages");
    if (!container || !currentChatUser) return;

    const messages = getChatMessages(currentChatUser.id);
    const currentUser = getCurrentUser();

    container.innerHTML = messages.map(msg => {
      const isMe = msg.from === "me";
      return `
        <div class="chat-msg ${isMe ? "mine" : "other"}">
          ${!isMe ? `<div class="chat-msg-avatar">${currentChatUser.avatar}</div>` : ""}
          <div class="chat-msg-bubble">
            <div class="chat-msg-text">${msg.text}</div>
            <div class="chat-msg-time">${formatTime(msg.time)}</div>
          </div>
          ${isMe ? `<div class="chat-msg-avatar">${currentUser.avatar}</div>` : ""}
        </div>
      `;
    }).join("");

    // 滚动到底部
    container.scrollTop = container.scrollHeight;
  }

  // ========== 发送消息 ==========
  function sendMessage() {
    const input = $("#chatInput");
    if (!input || !currentChatUser) return;

    const text = input.value.trim();
    if (!text) return;

    const messages = getChatMessages(currentChatUser.id);
    messages.push({
      from: "me",
      text: text,
      time: Date.now()
    });
    saveChatMessages(currentChatUser.id, messages);

    input.value = "";
    renderChatMessages();

    // 模拟自动回复
    setTimeout(() => {
      const replies = [
        "哈哈，说得对！",
        "这个我也喜欢吃！",
        "下次一起做饭呀～",
        "你推荐的菜我试试",
        "好呀好呀！",
        "听起来很不错！"
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const msgs = getChatMessages(currentChatUser.id);
      msgs.push({
        from: currentChatUser.id,
        text: reply,
        time: Date.now()
      });
      saveChatMessages(currentChatUser.id, msgs);
      renderChatMessages();
    }, 1000 + Math.random() * 1000);
  }

  // ========== 获取当前用户 ==========
  function getCurrentUser() {
    try {
      const data = localStorage.getItem("eat-ai-user");
      if (data) {
        const user = JSON.parse(data);
        return {
          name: user.nickname || user.name || "吃货",
          avatar: user.avatar || "🍅"
        };
      }
    } catch (e) {}
    return { name: "吃货", avatar: "🍅" };
  }

  // ========== 添加菜友弹层 ==========
  function showAddFriendModal() {
    const mask = $("#addFriendMask");
    if (!mask) return;
    mask.classList.remove("hidden");
    renderAddFriendResults("");
  }

  function hideAddFriendModal() {
    const mask = $("#addFriendMask");
    if (mask) mask.classList.add("hidden");
  }

  function renderAddFriendResults(keyword) {
    const results = $("#addFriendResults");
    if (!results) return;

    let users = MOCK_USERS.filter(u => !isFriend(u.id));
    if (keyword) {
      users = users.filter(u =>
        u.name.toLowerCase().includes(keyword.toLowerCase()) ||
        u.id.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    if (users.length === 0) {
      results.innerHTML = '<div class="add-friend-empty">没有找到相关菜友</div>';
      return;
    }

    results.innerHTML = users.map(u => `
      <div class="add-friend-item" data-user-id="${u.id}">
        <div class="add-friend-avatar">${u.avatar}</div>
        <div class="add-friend-info">
          <div class="add-friend-name">${u.name}</div>
          <div class="add-friend-signature">${u.signature}</div>
        </div>
        <button class="add-friend-add-btn" data-add-id="${u.id}">添加</button>
      </div>
    `).join("");

    // 绑定添加按钮
    $$(".add-friend-add-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const userId = btn.dataset.addId;
        const user = getUserById(userId);
        addFriend(userId);
        btn.textContent = "已添加";
        btn.disabled = true;
        btn.classList.add("added");
        if (user) alert("已添加" + user.name + "为菜友！");
        renderAddFriendResults($("#addFriendInput").value.trim());
      });
    });

    // 绑定点击用户查看资料
    $$(".add-friend-item").forEach(item => {
      item.addEventListener("click", () => {
        const userId = item.dataset.userId;
        hideAddFriendModal();
        showUserProfile(userId);
      });
    });
  }

  // ========== 初始化事件绑定 ==========
  function initEvents() {
    // 通讯录搜索
    const searchInput = $("#contactsSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        renderContacts();
      });
    }

    // 添加菜友按钮
    const addBtn = $("#contactsAddBtn");
    if (addBtn) {
      addBtn.addEventListener("click", showAddFriendModal);
    }

    // 添加菜友弹层取消
    const cancelBtn = $("#addFriendCancel");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", hideAddFriendModal);
    }

    // 点击遮罩关闭
    const mask = $("#addFriendMask");
    if (mask) {
      mask.addEventListener("click", (e) => {
        if (e.target === mask) hideAddFriendModal();
      });
    }

    // 添加菜友搜索
    const addInput = $("#addFriendInput");
    if (addInput) {
      addInput.addEventListener("input", () => {
        renderAddFriendResults(addInput.value.trim());
      });
    }

    // 聊天发送按钮
    const sendBtn = $("#chatSendBtn");
    if (sendBtn) {
      sendBtn.addEventListener("click", sendMessage);
    }

    // 聊天输入回车发送
    const chatInput = $("#chatInput");
    if (chatInput) {
      chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
      });
    }
  }

  // ========== 暴露到全局 ==========
  window.renderContacts = renderContacts;
  window.showUserProfile = showUserProfile;
  window.startChat = startChat;
  window.socialInit = function () {
    initEvents();
  };

  // 页面加载完成后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEvents);
  } else {
    initEvents();
  }

})();
