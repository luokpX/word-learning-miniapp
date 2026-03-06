# 微信登录功能设计文档

**日期**: 2026-03-07  
**功能**: 微信小程序静默登录 + 头像昵称设置  
**状态**: 已批准  

---

## 目标

实现符合微信 2024+ 规范的登录功能：
1. 静默登录检查（基于 `wx.checkSession()`）
2. 用户头像设置（`open-type="chooseAvatar"`）
3. 用户昵称设置（`type="nickname"` input）
4. 登录态管理（本地存储 + session 验证）
5. 可选的页面登录拦截

---

## 架构

### 方案选择：纯前端静默登录

**决策理由**:
- 项目当前为纯前端架构，无后端服务器
- YAGNI 原则：不提前引入复杂度
- 可迁移：未来需要时可切换到云开发/自建后端

**核心约束**:
- 无法获取 openid（需要后端调用 code2Session）
- 数据存储在本地 `wx.Storage`
- 卸载小程序后数据丢失

---

## 系统流程

```
┌─────────────────────────────────────────────────────────────┐
│                     小程序启动 (app.js)                      │
├─────────────────────────────────────────────────────────────┤
│  onLaunch() → AuthService.initAuth()                        │
│                      ↓                                       │
│         ┌────────────┴────────────┐                         │
│         │                         │                         │
│    检查本地用户信息           wx.checkSession()             │
│         │                         │                         │
│    有 → 直接加载              有效 → 标记已登录              │
│    无 → 调用 silentLogin()      无效 → 清除本地数据          │
│                      ↓                                       │
│              用户进入"我的"页面                               │
│                      ↓                                       │
│    ┌───────────────┴───────────────┐                        │
│    │                               │                        │
│    ↓                               ↓                        │
│ 点击头像 (chooseAvatar)       输入昵称 (type="nickname")     │
│    ↓                               ↓                        │
│  AuthService.saveUserInfo() ← 合并保存                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 组件设计

### 1. AuthService (`services/auth.js`)

**职责**: 封装所有认证相关操作

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `checkLoginStatus()` | 无 | `Promise<boolean>` | 检查是否已登录 |
| `checkSessionValid()` | 无 | `Promise<boolean>` | 验证 session_key |
| `silentLogin()` | 无 | `Promise<{success, openid?, error?}>` | 静默登录 |
| `saveUserInfo(userInfo)` | `Object` | 无 | 保存用户信息 |
| `getUserInfo()` | 无 | `Object\|null` | 获取用户信息 |
| `getDefaultUserInfo()` | 无 | `Object` | 默认用户信息 |
| `clearAuth()` | 无 | 无 | 清除认证数据 |
| `requireAuth(currentPage)` | `string` | `boolean` | 登录拦截 |

### 2. app.js 修改

**新增全局状态**:
```javascript
globalData: {
  isLoggedIn: false,  // 登录状态
  userInfo: null      // 用户信息
}
```

**新增方法**:
```javascript
async initAuth()         // 启动时初始化认证
refreshUserInfo()        // 刷新用户信息
```

### 3. Profile 页面修改

**UI 变更**:
- 头像从 `<image>` 改为 `<button open-type="chooseAvatar">`
- 昵称从 `<text>` 改为 `<input type="nickname">`

**新增方法**:
```javascript
onChooseAvatar(e)     // 处理头像选择
onNicknameInput(e)    // 处理昵称输入
```

---

## 数据存储

### Key 定义

```javascript
const AUTH_KEYS = {
  USER_INFO: 'userInfo',      // 用户信息对象
  OPENID: 'openid',           // 用户 openid（预留）
  LOGIN_TIME: 'loginTime'     // 登录时间戳（预留）
}
```

### 数据结构

```javascript
// userInfo 对象
{
  avatarUrl: string,    // 头像 URL（本地路径或临时路径）
  nickName: string      // 用户昵称
}
```

---

## 错误处理

| 场景 | 错误类型 | 处理方式 |
|------|----------|----------|
| `wx.checkSession()` 失败 | session 失效 | 清除本地数据，允许继续使用 |
| `wx.login()` 超时 | 网络/权限问题 | 记录日志，未登录状态可用 |
| 头像选择取消 | 用户操作 | 无提示，保持原头像 |
| 昵称为空 | 验证失败 | Toast 提示"昵称不能为空" |
| 存储失败 | Storage 异常 | console.error，降级处理 |

---

## 安全注意事项

### 当前方案（纯前端）的局限

1. **无 openid**: 无法唯一标识用户
2. **本地存储**: 用户可篡改数据
3. **无后端验证**: 无法防止作弊

### 未来升级路径

如需获取 openid，升级到云开发方案：

```javascript
// services/auth.js 修改 silentLogin()
async silentLogin() {
  const { code } = await wx.login()
  
  // 调用云函数
  const result = await wx.cloud.callFunction({
    name: 'login',
    data: { code }
  })
  
  return {
    success: true,
    openid: result.result.openid,
    token: result.result.token
  }
}
```

---

## 测试策略

### 自动化验证

```bash
# 语法检查
node --check services/auth.js
node --check app.js
node --check pages/profile/profile.js
```

### 手动测试清单

- [ ] 首次打开小程序，静默登录成功
- [ ] 点击头像，能选择新头像
- [ ] 输入昵称，能保存
- [ ] 清除缓存后重新打开，需要重新设置头像昵称
- [ ] 其他页面不受影响

---

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `services/auth.js` | 新建 | 认证服务层 |
| `app.js` | 修改 | 添加 initAuth() |
| `pages/profile/profile.js` | 修改 | 头像昵称处理 |
| `pages/profile/profile.wxml` | 修改 | UI 组件更新 |
| `pages/profile/profile.wxss` | 修改 | 样式更新 |

---

## 后续工作

1. 调用 `writing-plans` 技能创建实现计划
2. 使用 TDD 流程逐个实现功能
3. 验证完成后提交 git
