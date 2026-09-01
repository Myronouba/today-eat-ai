# 今天吃啥 AI 版 · 后端接口设计文档

> 基于前端页面推导的后端需求，后续接入后端时按此文档开发。

## 接口规范

### 统一返回格式

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 40001 | 参数错误 |
| 40101 | 未登录 |
| 40301 | 无权限 |
| 40401 | 菜谱不存在 |
| 40402 | 商家不存在 |
| 40403 | 餐厅不存在 |
| 50000 | 服务器错误 |

### 安全要求

- 所有接口必须验证登录态（除公开接口外）
- 敏感操作（支付、删除、修改）必须验证用户权限
- 用户数据按用户ID隔离，只能操作自己的数据
- 删除操作用软删除，记录操作日志
- API Key、支付密钥等必须放在后端环境变量，绝对不能出现在前端

---

## 一、用户模块

### 1.1 微信登录

- **接口**：`POST /api/user/login`
- **权限**：公开
- **请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | wx.login 获取的 code |

- **成功返回**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "userId": "u_123456",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "isNewUser": false
  }
}
```

### 1.2 获取用户信息

- **接口**：`GET /api/user/info`
- **权限**：需登录
- **成功返回**：

```json
{
  "code": 0,
  "data": {
    "userId": "u_123456",
    "nickname": "吃货",
    "avatar": "https://...",
    "phone": "138****8888",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

### 1.3 更新用户信息

- **接口**：`PUT /api/user/info`
- **权限**：需登录
- **请求参数**：nickname、avatar、phone（可选）

### 1.4 获取口味偏好

- **接口**：`GET /api/user/prefs`
- **权限**：需登录

### 1.5 更新口味偏好

- **接口**：`PUT /api/user/prefs`
- **权限**：需登录

---

## 二、菜谱模块（在家做）

### 2.1 获取菜谱列表

- **接口**：`GET /api/recipes`
- **权限**：公开
- **请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 否 | 分类：home/cook/light/fitness/soup/quick |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |

### 2.2 获取菜谱详情

- **接口**：`GET /api/recipes/:id`
- **权限**：公开

### 2.3 AI推算菜单

- **接口**：`POST /api/recipes/generate`
- **权限**：需登录
- **请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| people | number | 是 | 人数 |
| cooker | string | 是 | 厨艺：lazy/beginner/pro |
| category | string | 否 | 品类偏好 |
| ingredients | array | 否 | 现有食材 |
| mood | string | 否 | 口味偏好 |

- **安全说明**：LLM API Key 由后端代理调用，前端不接触密钥

---

## 三、外卖模块

### 3.1 获取外卖商家列表

- **接口**：`GET /api/takeout/shops`
- **权限**：公开
- **请求参数**：category、budget、delivery、mood、page、pageSize

### 3.2 获取商家详情

- **接口**：`GET /api/takeout/shops/:id`
- **权限**：公开

### 3.3 AI推荐外卖

- **接口**：`POST /api/takeout/recommend`
- **权限**：需登录

---

## 四、餐厅模块（出去吃）

### 4.1 获取餐厅列表

- **接口**：`GET /api/restaurants`
- **权限**：公开
- **请求参数**：scene、people、radius、budget、mood、page、pageSize

### 4.2 获取餐厅详情

- **接口**：`GET /api/restaurants/:id`
- **权限**：公开

### 4.3 AI推荐餐厅

- **接口**：`POST /api/restaurants/recommend`
- **权限**：需登录

---

## 五、记录模块

### 5.1 获取历史记录

- **接口**：`GET /api/records`
- **权限**：需登录
- **请求参数**：type（home/couple/out）、page、pageSize

### 5.2 添加记录

- **接口**：`POST /api/records`
- **权限**：需登录
- **请求参数**：type、name、dishes、people、date

### 5.3 删除记录（软删除）

- **接口**：`DELETE /api/records/:id`
- **权限**：需登录（只能删自己的）
- **安全说明**：软删除 + 操作日志，不物理删除

---

## 六、收藏模块

### 6.1 获取收藏列表

- **接口**：`GET /api/favorites`
- **权限**：需登录
- **请求参数**：type（recipe/shop/restaurant）

### 6.2 添加收藏

- **接口**：`POST /api/favorites`
- **权限**：需登录

### 6.3 取消收藏

- **接口**：`DELETE /api/favorites/:id`
- **权限**：需登录

---

## 七、情侣模块

### 7.1 获取情侣信息

- **接口**：`GET /api/couple/info`
- **权限**：需登录

### 7.2 绑定情侣关系

- **接口**：`POST /api/couple/bind`
- **权限**：需登录

### 7.3 获取协作菜单

- **接口**：`POST /api/couple/menu/generate`
- **权限**：需登录

### 7.4 获取情侣外卖推荐

- **接口**：`POST /api/couple/takeout/recommend`
- **权限**：需登录

---

## 八、数据模型设计

### users 用户表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| openid | string | 微信openid（唯一） |
| nickname | string | 昵称 |
| avatar | string | 头像URL |
| phone | string | 手机号（加密存储） |
| prefs | json | 口味偏好 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |
| deleted | boolean | 软删除标记 |

### recipes 菜谱表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| name | string | 菜名 |
| category | string | 分类 |
| tags | array | 标签 |
| ingredients | array | 食材 |
| steps | array | 步骤 |
| nutrition | json | 营养信息 |
| difficulty | string | 难度 |
| time | number | 用时（分钟） |
| created_at | datetime | 创建时间 |

### records 记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| user_id | string | 用户ID（索引） |
| type | string | 类型：home/couple/out |
| name | string | 名称 |
| dishes | json | 菜品列表 |
| people | number | 人数 |
| date | date | 日期 |
| created_at | datetime | 创建时间 |
| deleted | boolean | 软删除标记 |
| deleted_at | datetime | 删除时间 |

### operation_logs 操作日志表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| user_id | string | 用户ID |
| action | string | 操作类型：login/delete/pay/update |
| content | json | 操作内容 |
| ip | string | IP地址 |
| created_at | datetime | 操作时间 |

---

## 九、安全检查清单

- [ ] 所有密钥（API Key、支付密钥、数据库密码）放在后端环境变量
- [ ] 微信登录 code2session 在后端完成
- [ ] 支付金额后端计算，不相信前端传值
- [ ] 支付结果以微信回调为准，有对账机制
- [ ] 每个接口验证登录态
- [ ] 敏感操作验证用户权限（只能操作自己的数据）
- [ ] 所有入参校验类型、格式、范围
- [ ] 删除操作用软删除 + 操作日志
- [ ] SQL 注入防护（参数化查询或 ORM）
- [ ] 接口限流（登录、发送验证码、下单等）
- [ ] 错误处理统一，不暴露数据库错误/堆栈
- [ ] HTTPS 域名已配置并备案
- [ ] 敏感字段（手机号、身份证）加密存储

---

## 十、技术选型建议

### 推荐方案：微信云开发

- **优势**：无需搭服务器、无需域名备案、AI 生成质量高、微信登录和支付集成简单
- **适用**：小型项目、快速原型
- **数据库**：云数据库（MongoDB 风格）
- **后端**：云函数（Node.js）

### 备选方案：Node.js 自建

- **技术栈**：Express/NestJS + MySQL/PostgreSQL
- **适用**：中型项目、需要灵活控制
- **部署**：云服务器 + 域名 + ICP备案

---

**文档版本**：v1.0
**创建时间**：2026-09-01
**说明**：基于当前前端页面推导，后端接入时按此文档开发接口
