# 今天吃啥 AI版 · 项目部署与访问文档

> 版本：v4.2.0
> 更新日期：2026-09-03
> 维护者：Myronouba

---

## 🌐 站点访问地址

### 公网访问（GitHub Pages）

**主站地址：** https://myronouba.github.io/today-eat-ai/

- **平台：** GitHub Pages
- **分支：** main
- **状态：** ✅ 已部署
- **更新时间：** 2026-09-02 17:57:51

### 代码仓库

| 平台 | 地址 | 状态 |
|------|------|------|
| **GitHub（主仓库）** | https://github.com/Myronouba/today-eat-ai | ✅ 已同步 |
| **Gitee（国内备份）** | https://gitee.com/jtcsai/today-eat-ai | ✅ 已同步 |

### 本地开发环境

| 环境 | 地址 | 说明 |
|------|------|------|
| **本机访问** | http://127.0.0.1:8765 | 开发调试用 |
| **局域网手机访问** | http://192.168.1.206:8765 | 手机连同一WiFi |

---

## 📱 版本信息

### 当前版本

- **版本号：** v4.2.0
- **缓存版本：** 20260903f
- **发布日期：** 2026-09-03

### 版本历史

| 版本 | 日期 | 主要内容 |
|------|------|----------|
| **v4.2.0** | 2026-09-03 | 我的冰箱功能 + 冰箱联动 + 全面移动端适配 + 底部导航优化 |
| v4.1.0 | 2026-08下旬 | 在家吃/情侣双线 + 豆包大模型接入 + 性能优化 |
| v4.0.0 | 2026-08 | 基础框架 + 5大场景 + 本地推荐引擎 |

---

## ✨ 当前功能清单

### 核心功能

1. **多场景推荐**
   - 在家吃（自己做 / 点外卖）
   - 情侣一起做（一起做 / 一起点）
   - 出去吃
   - 发现
   - 我的

2. **AI智能推荐**
   - 接入豆包大模型（doubao-seed-2.1-pro-260628）
   - 全AI创意菜品生成
   - 用户API Key配置与连接测试
   - 30s问答资料全量接入

3. **我的冰箱**
   - 食材库存管理（添加/删除/分类）
   - 9大分类（蔬菜菌菇、肉蛋类、水产、豆制品、主食/烘焙、调料、水果、乳制品、其他）
   - 保质期管理（新鲜/7天内/3天内/今天到期/已过期）
   - 快过期提醒（红色边框高亮）
   - 统计卡片（总数/快过期/已过期）
   - 20种常用食材快捷添加
   - 一键导入到AI推算

4. **在家吃冰箱联动**
   - "冰箱里有什么？"区域导入按钮
   - 管理按钮快速跳转冰箱页面
   - 自动筛选未过期食材导入

5. **买菜清单**
   - 自动生成按分类整理的购物清单
   - 调料优先匹配分类算法
   - 价格估算

6. **历史记录**
   - 保存推荐历史
   - 方便回顾和再次选择

### 设计特色

1. **毛玻璃质感**：内容卡片统一毛玻璃效果
2. **渐变朦胧背景**：随机光斑渐变背景
3. **统一设计Token**：CSS变量管理颜色/圆角/阴影
4. **全面移动端适配**：响应式布局、最小44px点击区域
5. **底部导航优化**：固定高度64px、正方形选中框、图标28px

---

## 🚀 本地开发指南

### 启动开发服务器

```bash
# 进入项目目录
cd "C:\Users\86177\Desktop\今天吃啥\20260831迭代版本"

# 启动开发服务器（端口8765）
python dev_server.py 8765
```

### 访问地址

- 本机：http://127.0.0.1:8765
- 局域网：http://[你的IP]:8765

### 构建与部署

```bash
# 1. 合并JS（手动构建）
# 合并顺序：recipes.js → recipes2-4.js → restaurants.js → takeout.js → 
#           engine.js → llm.js → china.js → moments.js → social.js → 
#           storage.js → api/index.js → app.js → fridge.js → mini-program-bridge.js

# 2. 压缩JS
npx terser dist\app.bundle.js -o app.bundle.js --compress --mangle

# 3. 合并CSS
# 合并顺序：style.css → mini-program-adapter.css → mobile-adapter.css

# 4. 更新版本号（强制浏览器刷新缓存）
# 修改 index.html 中的 app.bundle.js?v=xxx 和 style.bundle.css?v=xxx

# 5. 提交并推送
git add -A
git commit -m "feat: xxx"
git push github master:main   # Pages用的main分支
git push github master         # master分支
git push origin master         # Gitee备份
```

---

## 📂 项目结构

```
today-eat-ai/
├── index.html              # 主入口（单页应用）
├── app.bundle.js           # 合并压缩后的JS（约486KB）
├── style.bundle.css        # 合并后的CSS（约160KB）
├── dev_server.py           # 本地开发服务器
├── AGENTS.md               # 项目开发规范
├── DEVELOPMENT_PLAN.md     # 开发规划文档
├── README.md               # 本文档（部署与访问）
├── css/
│   ├── style.css           # 主样式
│   ├── mobile-adapter.css  # 移动端适配样式
│   └── mini-program-adapter.css
├── js/
│   ├── app.js              # 主逻辑
│   ├── engine.js           # 推荐引擎
│   ├── llm.js              # LLM接口封装
│   ├── fridge.js           # 我的冰箱功能
│   ├── recipes.js          # 菜谱数据
│   ├── recipes2-4.js       # 菜谱数据扩展
│   ├── restaurants.js      # 餐厅数据
│   ├── takeout.js          # 外卖商家数据
│   └── data/china.js       # 中国城市数据
├── api/                    # 接口定义层（预留）
├── utils/                  # 工具函数
└── assets/icons/           # 图标资源
```

---

## 🔧 技术栈

- **前端：** HTML5 + CSS3 + Vanilla JS（无框架依赖）
- **存储：** localStorage（本地存储）
- **AI模型：** 豆包大模型（doubao-seed-2.1-pro-260628）
- **部署：** GitHub Pages（静态托管）
- **备份：** Gitee（国内镜像）
- **构建：** 手动合并 + terser压缩

---

## ⚠️ 注意事项

### GitHub Pages访问

1. **国内访问可能较慢**：GitHub Pages在国内访问速度不稳定，建议使用局域网地址测试
2. **缓存更新**：更新代码后，GitHub Pages可能需要1-2分钟才能生效，浏览器可能缓存旧版本
3. **强制刷新**：手机端可杀掉浏览器进程重新打开，或在地址后加 `?v=随机数` 强制刷新

### 本地开发

1. **手机访问**：手机和电脑需连同一WiFi，使用电脑的局域网IP访问
2. **端口占用**：如果8765端口被占用，可修改 `dev_server.py` 中的端口号
3. **防火墙**：确保电脑防火墙允许8765端口的入站连接

### API Key安全

- 当前API Key存储在浏览器localStorage中，前端直接调用
- 后续需要后端代理，避免Key泄露
- 详见 `DEVELOPMENT_PLAN.md` 中的技术债务部分

---

## 📞 相关链接

- **项目主站：** https://myronouba.github.io/today-eat-ai/
- **GitHub仓库：** https://github.com/Myronouba/today-eat-ai
- **Gitee备份：** https://gitee.com/jtcsai/today-eat-ai
- **开发规划：** DEVELOPMENT_PLAN.md
- **开发规范：** AGENTS.md

---

**文档结束**
*本文档随项目发展持续更新，最后更新：2026-09-03*
