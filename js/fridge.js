
/* ============ 我的冰箱功能 ============ */
const FRIDGE_KEY = "eat-ai-fridge";
let fridgeCurrentCat = "all";

const FRIDGE_QUICK_PICKS = [
  { name: "西红柿", cat: "蔬菜菌菇" },
  { name: "鸡蛋", cat: "肉蛋类" },
  { name: "土豆", cat: "蔬菜菌菇" },
  { name: "鸡胸肉", cat: "肉蛋类" },
  { name: "西兰花", cat: "蔬菜菌菇" },
  { name: "豆腐", cat: "豆制品" },
  { name: "虾", cat: "水产" },
  { name: "牛肉", cat: "肉蛋类" },
  { name: "青椒", cat: "蔬菜菌菇" },
  { name: "菌菇", cat: "蔬菜菌菇" },
  { name: "胡萝卜", cat: "蔬菜菌菇" },
  { name: "洋葱", cat: "蔬菜菌菇" },
  { name: "大蒜", cat: "调料" },
  { name: "生姜", cat: "调料" },
  { name: "葱", cat: "调料" },
  { name: "牛奶", cat: "乳制品" },
  { name: "苹果", cat: "水果" },
  { name: "香蕉", cat: "水果" },
  { name: "米饭", cat: "主食/烘焙" },
  { name: "面条", cat: "主食/烘焙" }
];

const FRIDGE_CAT_ICONS = {
  "蔬菜菌菇": "🥬",
  "肉蛋类": "🥩",
  "水产": "🐟",
  "豆制品": "🧈",
  "主食/烘焙": "🍞",
  "调料": "🧂",
  "水果": "🍎",
  "乳制品": "🥛",
  "其他": "📦"
};

function getFridge() {
  try {
    const data = localStorage.getItem(FRIDGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
}

function saveFridge(items) {
  localStorage.setItem(FRIDGE_KEY, JSON.stringify(items));
}

function getDaysLeft(expireDate) {
  if (!expireDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expire = new Date(expireDate);
  expire.setHours(0, 0, 0, 0);
  return Math.ceil((expire - today) / (1000 * 60 * 60 * 24));
}

function getExpireStatus(daysLeft) {
  if (daysLeft === null) return { class: "fresh", text: "长期" };
  if (daysLeft < 0) return { class: "expired", text: "已过期" };
  if (daysLeft === 0) return { class: "danger", text: "今天到期" };
  if (daysLeft <= 3) return { class: "danger", text: "剩" + daysLeft + "天" };
  if (daysLeft <= 7) return { class: "warning", text: "剩" + daysLeft + "天" };
  return { class: "fresh", text: "剩" + daysLeft + "天" };
}

function renderFridge() {
  const items = getFridge();
  const listEl = document.getElementById("fridgeList");
  const emptyEl = document.getElementById("fridgeEmpty");
  
  let expiring = 0, expired = 0;
  items.forEach(item => {
    const days = getDaysLeft(item.expireDate);
    if (days !== null) {
      if (days < 0) expired++;
      else if (days <= 7) expiring++;
    }
  });
  
  document.getElementById("fridgeTotal").textContent = items.length;
  document.getElementById("fridgeExpiring").textContent = expiring;
  document.getElementById("fridgeExpired").textContent = expired;
  
  const meFridgeSub = document.getElementById("meFridgeSub");
  if (meFridgeSub) meFridgeSub.textContent = items.length + " 样食材";
  
  let filtered = items;
  if (fridgeCurrentCat !== "all") {
    filtered = items.filter(item => item.category === fridgeCurrentCat);
  }
  
  filtered.sort((a, b) => {
    const daysA = getDaysLeft(a.expireDate);
    const daysB = getDaysLeft(b.expireDate);
    if (daysA === null && daysB === null) return 0;
    if (daysA === null) return 1;
    if (daysB === null) return -1;
    return daysA - daysB;
  });
  
  if (filtered.length === 0) {
    listEl.innerHTML = "";
    emptyEl.classList.remove("hidden");
    if (items.length > 0 && fridgeCurrentCat !== "all") {
      emptyEl.querySelector(".fridge-empty-text").textContent = "该分类暂无食材";
      emptyEl.querySelector(".fridge-empty-hint").textContent = "切换其他分类或添加新食材";
    } else {
      emptyEl.querySelector(".fridge-empty-text").textContent = "冰箱还是空的";
      emptyEl.querySelector(".fridge-empty-hint").textContent = "点击上方\"添加食材\"开始管理你的冰箱";
    }
    return;
  }
  
  emptyEl.classList.add("hidden");
  listEl.innerHTML = filtered.map(item => {
    const days = getDaysLeft(item.expireDate);
    const status = getExpireStatus(days);
    const itemClass = days !== null && days <= 7 && days >= 0 ? "expiring" : (days !== null && days < 0 ? "expired" : "");
    const icon = FRIDGE_CAT_ICONS[item.category] || "📦";
    return '<div class="fridge-item ' + itemClass + '" data-id="' + item.id + '">' +
      '<div class="fridge-item-ico">' + icon + '</div>' +
      '<div class="fridge-item-body">' +
        '<div class="fridge-item-name">' + item.name + '</div>' +
        '<div class="fridge-item-meta">' +
          '<span class="fridge-item-qty">' + item.quantity + item.unit + '</span>' +
          '<span class="fridge-item-expire ' + status.class + '">' + status.text + '</span>' +
        '</div>' +
      '</div>' +
      '<button class="fridge-item-del" data-id="' + item.id + '" title="删除">×</button>' +
    '</div>';
  }).join("");
  
  listEl.querySelectorAll(".fridge-item-del").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteFridgeItem(btn.getAttribute("data-id"));
    });
  });
}

function addFridgeItem(name, category, quantity, unit, expireDate) {
  const items = getFridge();
  items.push({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    name: name.trim(),
    category,
    quantity: parseFloat(quantity) || 1,
    unit,
    expireDate: expireDate || null,
    addDate: new Date().toISOString()
  });
  saveFridge(items);
  renderFridge();
}

function deleteFridgeItem(id) {
  let items = getFridge();
  items = items.filter(item => item.id !== id);
  saveFridge(items);
  renderFridge();
}

function openFridgeModal() {
  document.getElementById("fridgeModal").classList.remove("hidden");
  document.getElementById("fridgeInputName").value = "";
  document.getElementById("fridgeInputCategory").value = "蔬菜菌菇";
  document.getElementById("fridgeInputQty").value = "1";
  document.getElementById("fridgeInputUnit").value = "个";
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  document.getElementById("fridgeInputExpire").value = defaultDate.toISOString().split("T")[0];
  renderQuickPicks();
  setTimeout(() => document.getElementById("fridgeInputName").focus(), 100);
}

function closeFridgeModal() {
  document.getElementById("fridgeModal").classList.add("hidden");
}

function renderQuickPicks() {
  const container = document.getElementById("fridgeQuickPicks");
  container.innerHTML = FRIDGE_QUICK_PICKS.map(item => 
    '<button class="fridge-quick-pick" data-name="' + item.name + '" data-cat="' + item.cat + '">' + item.name + '</button>'
  ).join("");
  container.querySelectorAll(".fridge-quick-pick").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("fridgeInputName").value = btn.getAttribute("data-name");
      document.getElementById("fridgeInputCategory").value = btn.getAttribute("data-cat");
    });
  });
}

function importFridgeToCalc() {
  const items = getFridge();
  if (items.length === 0) { alert("冰箱是空的，先添加一些食材吧！"); return; }
  const freshItems = items.filter(item => {
    const days = getDaysLeft(item.expireDate);
    return days === null || days >= 0;
  });
  if (freshItems.length === 0) { alert("冰箱里的食材都过期了，先添加一些新鲜食材吧！"); return; }
  const names = freshItems.map(item => item.name);
  showView("home");
  setTimeout(() => {
    alert("已导入 " + freshItems.length + " 样食材到推算页面：\n" + names.join("、") + "\n\n请在\"冰箱里有什么？\"区域确认或调整食材。");
  }, 300);
}

function initFridge() {
  const btnMeFridge = document.getElementById("btnMeFridge");
  if (btnMeFridge) btnMeFridge.addEventListener("click", () => { showView("fridge"); renderFridge(); });
  
  const btnFridgeAdd = document.getElementById("btnFridgeAdd");
  if (btnFridgeAdd) btnFridgeAdd.addEventListener("click", openFridgeModal);
  
  const btnFridgeImport = document.getElementById("btnFridgeImport");
  if (btnFridgeImport) btnFridgeImport.addEventListener("click", importFridgeToCalc);
  
  const btnFridgeModalClose = document.getElementById("btnFridgeModalClose");
  if (btnFridgeModalClose) btnFridgeModalClose.addEventListener("click", closeFridgeModal);
  
  const btnFridgeCancel = document.getElementById("btnFridgeCancel");
  if (btnFridgeCancel) btnFridgeCancel.addEventListener("click", closeFridgeModal);
  
  const btnFridgeConfirm = document.getElementById("btnFridgeConfirm");
  if (btnFridgeConfirm) btnFridgeConfirm.addEventListener("click", () => {
    const name = document.getElementById("fridgeInputName").value.trim();
    const category = document.getElementById("fridgeInputCategory").value;
    const quantity = document.getElementById("fridgeInputQty").value;
    const unit = document.getElementById("fridgeInputUnit").value;
    const expireDate = document.getElementById("fridgeInputExpire").value;
    if (!name) { alert("请输入食材名称"); document.getElementById("fridgeInputName").focus(); return; }
    addFridgeItem(name, category, quantity, unit, expireDate);
    closeFridgeModal();
  });
  
  const fridgeCategories = document.getElementById("fridgeCategories");
  if (fridgeCategories) {
    fridgeCategories.querySelectorAll(".fridge-cat").forEach(cat => {
      cat.addEventListener("click", () => {
        fridgeCategories.querySelectorAll(".fridge-cat").forEach(c => c.classList.remove("active"));
        cat.classList.add("active");
        fridgeCurrentCat = cat.getAttribute("data-cat");
        renderFridge();
      });
    });
  }
  
  const fridgeModal = document.getElementById("fridgeModal");
  if (fridgeModal) fridgeModal.addEventListener("click", (e) => { if (e.target === fridgeModal) closeFridgeModal(); });
  
  const fridgeInputName = document.getElementById("fridgeInputName");
  if (fridgeInputName) fridgeInputName.addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("btnFridgeConfirm").click();
  });
}

if (document.readyState !== "loading") {
  initFridge();
} else {
  document.addEventListener("DOMContentLoaded", initFridge);
}

// 在家吃页面冰箱联动：导入冰箱食材到当前选择区域
function importFridgeToHomeIngredients() {
  const items = getFridge();
  if (items.length === 0) {
    alert("冰箱是空的，先去我的冰箱添加一些食材吧！");
    return;
  }
  
  // 筛选未过期的食材
  const freshItems = items.filter(item => {
    const days = getDaysLeft(item.expireDate);
    return days === null || days >= 0;
  });
  
  if (freshItems.length === 0) {
    alert("冰箱里的食材都过期了，先去我的冰箱添加一些新鲜食材吧！");
    return;
  }
  
  const names = freshItems.map(item => item.name);
  
  // 找到食材选择区域并点击对应的chip
  const chipsContainer = document.getElementById("hmIngredients");
  if (chipsContainer) {
    let imported = 0;
    names.forEach(name => {
      // 尝试找到匹配的chip
      const chip = Array.from(chipsContainer.querySelectorAll(".chip")).find(c => {
        const val = c.getAttribute("data-val") || c.textContent;
        return val.includes(name) || name.includes(val);
      });
      if (chip && !chip.classList.contains("active")) {
        chip.click();
        imported++;
      }
    });
    
    // 如果没有匹配到预设的chip，就用输入框添加
    if (imported === 0) {
      const input = document.getElementById("hmIngredientInput");
      const addBtn = document.getElementById("hmAddIngredient");
      if (input && addBtn) {
        names.forEach((name, index) => {
          setTimeout(() => {
            input.value = name;
            addBtn.click();
          }, index * 100);
        });
        imported = names.length;
      }
    }
    
    alert("已从冰箱导入 " + imported + " 样食材：\n" + names.join("、"));
  } else {
    alert("已从冰箱导入 " + names.length + " 样食材：\n" + names.join("、") + "\n\n请在食材选择区域确认。");
  }
}

// 跳转到我的冰箱页面
function goToFridgePage() {
  showView("fridge");
  renderFridge();
}

// 绑定在家吃页面的冰箱联动按钮
function initFridgeLinkButtons() {
  const btnImport = document.getElementById("btnImportFridgeHere");
  if (btnImport) {
    btnImport.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      importFridgeToHomeIngredients();
    });
  }
  
  const btnGo = document.getElementById("btnGoFridge");
  if (btnGo) {
    btnGo.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToFridgePage();
    });
  }
}

// 页面加载后绑定
if (document.readyState !== "loading") {
  initFridgeLinkButtons();
} else {
  document.addEventListener("DOMContentLoaded", initFridgeLinkButtons);
}