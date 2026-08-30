/* ============================================================
 * mini-program-bridge.js
 * H5 与微信小程序 web-view 的通信桥接
 * 作用：检测小程序环境、调用小程序 API、向小程序发消息
 * 使用：在 index.html 的 <body> 末尾，在其他 JS 之后引入
 * ============================================================ */

(function () {
  'use strict';

  /**
   * 检测当前是否在微信小程序 web-view 中
   * @returns {boolean}
   */
  function isInMiniProgram() {
    // 方式1：通过 userAgent 检测
    const ua = navigator.userAgent || '';
    if (/miniProgram/i.test(ua) || /MicroMessenger/i.test(ua)) {
      // 微信环境下，进一步检测是否为小程序
      // 微信浏览器也包含 MicroMessenger，需要结合 wx.miniProgram 判断
      if (window.wx && window.wx.miniProgram) {
        return true;
      }
      // 某些情况下 wx 对象可能未就绪，通过 URL 参数判断
      const params = new URLSearchParams(window.location.search);
      if (params.get('from') === 'miniprogram' || params.get('mp') === '1') {
        return true;
      }
    }
    return false;
  }

  /**
   * 动态加载微信 JSSDK
   * @returns {Promise}
   */
  function loadWxSDK() {
    return new Promise(function (resolve, reject) {
      if (window.wx && window.wx.miniProgram) {
        resolve(window.wx);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
      script.onload = function () {
        resolve(window.wx);
      };
      script.onerror = function () {
        reject(new Error('微信JSSDK加载失败'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * 向小程序发送消息
   * 注意：postMessage 仅在小程序后退、组件销毁、分享时触发
   * @param {string} action - 消息类型
   * @param {Object} payload - 消息数据
   */
  function postMessage(action, payload) {
    if (!window.wx || !window.wx.miniProgram) {
      console.warn('[Bridge] 不在小程序环境中，无法发送消息');
      return;
    }
    window.wx.miniProgram.postMessage({
      data: {
        action: action,
        payload: payload || {},
        timestamp: Date.now()
      }
    });
    console.log('[Bridge] 发送消息:', action, payload);
  }

  /**
   * 跳转到小程序原生页面
   * @param {string} url - 小程序页面路径，如 '/pages/xxx/xxx'
   */
  function navigateTo(url) {
    if (window.wx && window.wx.miniProgram) {
      window.wx.miniProgram.navigateTo({ url: url });
    } else {
      console.warn('[Bridge] 不在小程序环境中');
    }
  }

  /**
   * 小程序页面重定向
   * @param {string} url
   */
  function redirectTo(url) {
    if (window.wx && window.wx.miniProgram) {
      window.wx.miniProgram.redirectTo({ url: url });
    }
  }

  /**
   * 切换小程序 Tab
   * @param {string} url
   */
  function switchTab(url) {
    if (window.wx && window.wx.miniProgram) {
      window.wx.miniProgram.switchTab({ url: url });
    }
  }

  /**
   * 返回上一页
   * @param {number} delta - 返回层数
   */
  function navigateBack(delta) {
    if (window.wx && window.wx.miniProgram) {
      window.wx.miniProgram.navigateBack({ delta: delta || 1 });
    }
  }

  /**
   * 获取小程序环境信息
   * @returns {Object}
   */
  function getEnv() {
    return new Promise(function (resolve) {
      if (window.wx && window.wx.miniProgram) {
        window.wx.miniProgram.getEnv(function (res) {
          resolve(res);
        });
      } else {
        resolve({ miniprogram: false });
      }
    });
  }

  /**
   * 初始化桥接
   */
  async function init() {
    const inMp = isInMiniProgram();

    if (inMp) {
      console.log('[Bridge] 检测到小程序 web-view 环境');

      // 给 body 添加标记类，触发 CSS 适配
      document.body.classList.add('in-miniprogram');

      // 加载微信 JSSDK
      try {
        await loadWxSDK();
        console.log('[Bridge] 微信 JSSDK 加载成功');

        // 获取环境信息
        const env = await getEnv();
        console.log('[Bridge] 小程序环境:', env);

        // 通知小程序：H5 已加载完成
        postMessage('h5Ready', {
          url: window.location.href,
          title: document.title,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('[Bridge] 初始化失败:', err);
      }
    } else {
      console.log('[Bridge] 非小程序环境，跳过桥接初始化');
    }
  }

  // 暴露全局对象
  window.MiniProgramBridge = {
    isInMiniProgram: isInMiniProgram,
    postMessage: postMessage,
    navigateTo: navigateTo,
    redirectTo: redirectTo,
    switchTab: switchTab,
    navigateBack: navigateBack,
    getEnv: getEnv,
    loadWxSDK: loadWxSDK
  };

  // DOM 就绪后自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
