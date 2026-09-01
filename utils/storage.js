/**
 * 今天吃啥 AI 版 · 本地存储工具
 * 
 * 统一管理 localStorage 操作，后续接入后端时可平滑替换。
 */

const Storage = {
  /** 读取数据 */
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      console.warn(`[Storage] 读取失败: ${key}`, e);
      return defaultValue;
    }
  },

  /** 写入数据 */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[Storage] 写入失败: ${key}`, e);
      return false;
    }
  },

  /** 删除数据 */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[Storage] 删除失败: ${key}`, e);
      return false;
    }
  },

  /** 清空所有数据 */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.warn("[Storage] 清空失败", e);
      return false;
    }
  },

  /** 获取所有存储的键 */
  keys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    return keys;
  }
};

window.Storage = Storage;
