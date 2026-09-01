/**
 * 今天吃啥 AI 版 · 接口层
 * 
 * 【设计目的】
 * 统一管理所有数据获取接口，当前使用前端假数据，
 * 后续接入后端时只需修改此文件，无需改动业务逻辑。
 * 
 * 【接口规范】
 * - 统一返回格式：{ code: 0, message: "success", data: {} }
 * - 所有接口返回 Promise
 * - 错误码：0成功，40001参数错误，40101未登录，40301无权限，50000服务器错误
 * 
 * 【后端接入指引】
 * 1. 将 mock 数据替换为真实 API 请求（fetch/axios）
 * 2. 敏感操作（支付、删除、修改）必须走后端校验
 * 3. API Key 等密钥必须由后端代理，不能暴露在前端
 */

// ==================== 统一响应封装 ====================
function success(data, message = "success") {
  return Promise.resolve({ code: 0, message, data });
}

function fail(code, message) {
  return Promise.reject({ code, message, data: null });
}

// ==================== 用户相关接口 ====================
const UserAPI = {
  /** 微信登录（后端接入时使用） */
  login(code) {
    // TODO: 后端接入 - 调用 wx.login 获取 code，后端 code2session 换取 openid
    return success({ userId: "local_user", token: "local_token" });
  },

  /** 获取用户信息 */
  getUserInfo(userId) {
    // 当前从 localStorage 读取
    const userInfo = JSON.parse(localStorage.getItem("eat-ai-user") || "{}");
    return success(userInfo);
  },

  /** 更新用户信息 */
  updateUserInfo(userId, userInfo) {
    localStorage.setItem("eat-ai-user", JSON.stringify(userInfo));
    return success(userInfo);
  },

  /** 获取用户口味偏好 */
  getUserPrefs(userId) {
    const prefs = JSON.parse(localStorage.getItem("eat-ai-prefs") || "null");
    return success(prefs);
  },

  /** 更新用户口味偏好 */
  updateUserPrefs(userId, prefs) {
    localStorage.setItem("eat-ai-prefs", JSON.stringify(prefs));
    return success(prefs);
  }
};

// ==================== 菜谱相关接口 ====================
const RecipeAPI = {
  /** 获取菜谱列表（在家做） */
  getRecipeList(filters = {}) {
    // 当前从前端数据获取，后续走后端分页查询
    const allRecipes = [...(window.RECIPES || []), ...(window.RECIPES2 || []), ...(window.RECIPES3 || []), ...(window.RECIPES4 || [])];
    let list = allRecipes;
    
    // 简单过滤
    if (filters.category && filters.category !== "any") {
      list = list.filter(r => r.tags && r.tags.includes(filters.category));
    }
    
    return success({ list, total: list.length });
  },

  /** 获取菜谱详情 */
  getRecipeDetail(recipeId) {
    const allRecipes = [...(window.RECIPES || []), ...(window.RECIPES2 || []), ...(window.RECIPES3 || []), ...(window.RECIPES4 || [])];
    const recipe = allRecipes.find(r => r.id === recipeId || r.name === recipeId);
    if (!recipe) return fail(40401, "菜谱不存在");
    return success(recipe);
  },

  /** AI推算菜单 */
  generateMenu(params) {
    // 当前调用前端引擎，后续走后端 AI 接口
    // 注意：LLM API Key 必须由后端代理，不能在前端直接调用
    return success({ dishes: [], reason: "", nutrition: {} });
  }
};

// ==================== 外卖相关接口 ====================
const TakeoutAPI = {
  /** 获取外卖商家列表 */
  getTakeoutList(filters = {}) {
    const allShops = window.TAKEOUT_SHOPS || [];
    let list = allShops;
    
    if (filters.category && filters.category !== "any") {
      list = list.filter(s => s.category === filters.category);
    }
    
    return success({ list, total: list.length });
  },

  /** 获取商家详情 */
  getTakeoutDetail(shopId) {
    const allShops = window.TAKEOUT_SHOPS || [];
    const shop = allShops.find(s => s.id === shopId);
    if (!shop) return fail(40402, "商家不存在");
    return success(shop);
  }
};

// ==================== 餐厅相关接口 ====================
const RestaurantAPI = {
  /** 获取餐厅列表（出去吃） */
  getRestaurantList(filters = {}) {
    const allRestaurants = window.RESTAURANTS || [];
    let list = allRestaurants;
    
    if (filters.scene && filters.scene !== "any") {
      list = list.filter(r => r.tags && r.tags.includes(filters.scene));
    }
    
    return success({ list, total: list.length });
  },

  /** 获取餐厅详情 */
  getRestaurantDetail(restaurantId) {
    const allRestaurants = window.RESTAURANTS || [];
    const restaurant = allRestaurants.find(r => r.id === restaurantId);
    if (!restaurant) return fail(40403, "餐厅不存在");
    return success(restaurant);
  }
};

// ==================== 记录/历史接口 ====================
const RecordAPI = {
  /** 获取历史记录 */
  getHistory(userId, filters = {}) {
    const history = JSON.parse(localStorage.getItem("eat-ai-history") || "[]");
    let list = history;
    
    if (filters.type && filters.type !== "all") {
      list = list.filter(h => h.type === filters.type);
    }
    
    return success({ list, total: list.length });
  },

  /** 添加记录 */
  addRecord(userId, record) {
    const history = JSON.parse(localStorage.getItem("eat-ai-history") || "[]");
    record.id = Date.now();
    record.userId = userId;
    record.createdAt = new Date().toISOString();
    history.unshift(record);
    localStorage.setItem("eat-ai-history", JSON.stringify(history.slice(0, 100)));
    return success(record);
  },

  /** 删除记录（软删除） */
  deleteRecord(userId, recordId) {
    const history = JSON.parse(localStorage.getItem("eat-ai-history") || "[]");
    const idx = history.findIndex(h => h.id === recordId && h.userId === userId);
    if (idx >= 0) {
      history[idx].deleted = true;
      history[idx].deletedAt = new Date().toISOString();
      localStorage.setItem("eat-ai-history", JSON.stringify(history));
    }
    return success({ deleted: true });
  }
};

// ==================== 收藏接口 ====================
const FavoriteAPI = {
  /** 获取收藏列表 */
  getFavorites(userId, type = "all") {
    const favorites = JSON.parse(localStorage.getItem("eat-ai-favorites") || "[]");
    let list = favorites;
    if (type !== "all") {
      list = list.filter(f => f.type === type);
    }
    return success({ list, total: list.length });
  },

  /** 添加收藏 */
  addFavorite(userId, item) {
    const favorites = JSON.parse(localStorage.getItem("eat-ai-favorites") || "[]");
    item.id = Date.now();
    item.userId = userId;
    item.createdAt = new Date().toISOString();
    favorites.unshift(item);
    localStorage.setItem("eat-ai-favorites", JSON.stringify(favorites.slice(0, 100)));
    return success(item);
  },

  /** 取消收藏 */
  removeFavorite(userId, favoriteId) {
    let favorites = JSON.parse(localStorage.getItem("eat-ai-favorites") || "[]");
    favorites = favorites.filter(f => !(f.id === favoriteId && f.userId === userId));
    localStorage.setItem("eat-ai-favorites", JSON.stringify(favorites));
    return success({ removed: true });
  }
};

// ==================== 导出 ====================
window.API = {
  user: UserAPI,
  recipe: RecipeAPI,
  takeout: TakeoutAPI,
  restaurant: RestaurantAPI,
  record: RecordAPI,
  favorite: FavoriteAPI
};

console.log("[API] 接口层已加载（当前使用前端假数据，后端接入时修改此文件）");
