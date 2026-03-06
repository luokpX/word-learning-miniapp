# 微信登录功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal**: 实现微信小程序静默登录功能，支持头像昵称设置和登录态管理。

**Architecture**: 纯前端架构，基于 `wx.checkSession()` 验证登录态，用户信息存储在本地 `wx.Storage`。

**Tech Stack**: 微信小程序原生 API (JavaScript), StorageService, AuthService

**Design Doc**: `docs/plans/2026-03-07-wechat-login-design.md`

---

## Task 1: 创建 AuthService 基础框架

**Files:**
- Create: `services/auth.js`
- Test: 无（手动验证语法）

**Step 1: 创建 AuthService 骨架**

```javascript
const StorageService = require('../utils/storage')

const AUTH_KEYS = {
  USER_INFO: 'userInfo',
  OPENID: 'openid',
  LOGIN_TIME: 'loginTime'
}

class AuthService {
  async checkLoginStatus() {
    // TODO: 实现
  }

  checkSessionValid() {
    // TODO: 实现
  }

  async silentLogin() {
    // TODO: 实现
  }

  saveUserInfo(userInfo) {
    // TODO: 实现
  }

  getUserInfo() {
    // TODO: 实现
  }

  getDefaultUserInfo() {
    // TODO: 实现
  }

  clearAuth() {
    // TODO: 实现
  }
}

module.exports = new AuthService()
```

**Step 2: 验证语法**

Run: `node --check services/auth.js`
Expected: 无输出（语法正确）

**Step 3: 提交**

```bash
git add services/auth.js
git commit -m "feat(auth): 创建 AuthService 骨架"
```

---

## Task 2: 实现 checkSessionValid 和 checkLoginStatus

**Files:**
- Modify: `services/auth.js:20-45`

**Step 1: 实现 checkSessionValid**

```javascript
checkSessionValid() {
  return new Promise((resolve) => {
    wx.checkSession({
      success: () => resolve(true),
      fail: () => resolve(false)
    })
  })
}
```

**Step 2: 实现 checkLoginStatus**

```javascript
async checkLoginStatus() {
  try {
    const userInfo = StorageService.get(AUTH_KEYS.USER_INFO, null)
    if (!userInfo) {
      return false
    }

    const sessionValid = await this.checkSessionValid()
    if (!sessionValid) {
      this.clearAuth()
      return false
    }

    return true
  } catch (error) {
    console.error('checkLoginStatus error:', error)
    return false
  }
}
```

**Step 3: 验证语法**

Run: `node --check services/auth.js`
Expected: 无输出

**Step 4: 提交**

```bash
git add services/auth.js
git commit -m "feat(auth): 实现 session 检查和登录状态验证"
```

---

## Task 3: 实现 silentLogin 方法

**Files:**
- Modify: `services/auth.js:47-80`

**Step 1: 实现 wxLogin 封装**

```javascript
wxLogin() {
  return new Promise((resolve) => {
    wx.login({
      timeout: 10000,
      success: (res) => resolve(res),
      fail: () => resolve({ code: null })
    })
  })
}
```

**Step 2: 实现 silentLogin**

```javascript
async silentLogin() {
  try {
    const sessionValid = await this.checkSessionValid()
    if (sessionValid) {
      const openid = StorageService.get(AUTH_KEYS.OPENID, null)
      if (openid) {
        return { success: true, openid }
      }
    }

    const loginResult = await this.wxLogin()
    if (!loginResult.code) {
      return { success: false, error: '获取 code 失败' }
    }

    console.log('静默登录：获取到 code，需要后端配合获取 openid')
    StorageService.set(AUTH_KEYS.LOGIN_TIME, Date.now())

    return { 
      success: true, 
      code: loginResult.code,
      message: '需要后端配合获取 openid'
    }
  } catch (error) {
    console.error('silentLogin error:', error)
    return { success: false, error: error.message || '登录失败' }
  }
}
```

**Step 3: 验证语法**

Run: `node --check services/auth.js`
Expected: 无输出

**Step 4: 提交**

```bash
git add services/auth.js
git commit -m "feat(auth): 实现静默登录获取 code"
```

---

## Task 4: 实现用户信息管理方法

**Files:**
- Modify: `services/auth.js:82-130`

**Step 1: 实现 saveUserInfo 和 getUserInfo**

```javascript
saveUserInfo(userInfo) {
  StorageService.set(AUTH_KEYS.USER_INFO, userInfo)
}

getUserInfo() {
  return StorageService.get(AUTH_KEYS.USER_INFO, null)
}
```

**Step 2: 实现 clearAuth 和 getDefaultUserInfo**

```javascript
clearAuth() {
  StorageService.remove(AUTH_KEYS.USER_INFO)
  StorageService.remove(AUTH_KEYS.OPENID)
  StorageService.remove(AUTH_KEYS.LOGIN_TIME)
}

getDefaultUserInfo() {
  return {
    avatarUrl: '/assets/icons/default-avatar.png',
    nickName: '桃桃'
  }
}
```

**Step 3: 验证语法**

Run: `node --check services/auth.js`
Expected: 无输出

**Step 4: 提交**

```bash
git add services/auth.js
git commit -m "feat(auth): 实现用户信息管理方法"
```

---

## Task 5: 实现登录拦截器 requireAuth

**Files:**
- Modify: `services/auth.js:132-165`

**Step 1: 实现 requireAuth 方法**

```javascript
requireAuth(currentPage) {
  const publicPages = ['/pages/index/index', '/pages/profile/profile']
  
  if (publicPages.includes(currentPage)) {
    return true
  }

  if (!this.getUserInfo()) {
    wx.showModal({
      title: '需要登录',
      content: '请先登录以继续使用',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/profile/profile'
          })
        }
      }
    })
    return false
  }

  return true
}
```

**Step 2: 验证语法**

Run: `node --check services/auth.js`
Expected: 无输出

**Step 3: 提交**

```bash
git add services/auth.js
git commit -m "feat(auth): 实现登录拦截器"
```

---

## Task 6: 更新 app.js 添加 initAuth

**Files:**
- Modify: `app.js`

**Step 1: 导入 AuthService**

```javascript
const AuthService = require('./services/auth')

App({
```

**Step 2: 添加 isLoggedIn 全局状态**

```javascript
globalData: {
  userInfo: null,
  isLoggedIn: false,
  studyProgress: {
    // ...existing
  },
```

**Step 3: 替换 checkLoginStatus 为 initAuth**

```javascript
onLaunch() {
  this.initAuth()
  this.loadStudyProgress()
},

async initAuth() {
  const isLoggedIn = await AuthService.checkLoginStatus()
  
  if (isLoggedIn) {
    const userInfo = AuthService.getUserInfo()
    this.globalData.userInfo = userInfo
    this.globalData.isLoggedIn = true
    console.log('用户已登录')
  } else {
    const result = await AuthService.silentLogin()
    if (result.success) {
      this.globalData.isLoggedIn = true
      console.log('静默登录成功')
    } else {
      this.globalData.isLoggedIn = false
      console.log('静默登录失败:', result.error)
    }
  }
},

refreshUserInfo() {
  const userInfo = AuthService.getUserInfo()
  this.globalData.userInfo = userInfo
  this.globalData.isLoggedIn = !!userInfo
}
```

**Step 4: 验证语法**

Run: `node --check app.js`
Expected: 无输出

**Step 5: 提交**

```bash
git add app.js
git commit -m "feat(auth): app.js 集成 AuthService 静默登录"
```

---

## Task 7: 更新 Profile 页面 WXML

**Files:**
- Modify: `pages/profile/profile.wxml:1-10`

**Step 1: 修改头像为 chooseAvatar 按钮**

```xml
<view class="profile-header">
  <view class="avatar-section">
    <!-- 头像选择：使用新的 chooseAvatar 能力 -->
    <button class="avatar-btn" open-type="chooseAvatar" bind:chooseavatar="onChooseAvatar">
      <image class="avatar" src="{{userInfo.avatarUrl || '/assets/icons/default-avatar.png'}}" mode="aspectFill"></image>
    </button>
    <!-- 昵称输入：使用新的 nickname input 能力 -->
    <input class="nickname-input" type="nickname" value="{{userInfo.nickName || '桃桃'}}" bindblur="onNicknameInput" placeholder="点击设置昵称" />
    <text class="user-level">Lv.{{level}}</text>
  </view>
</view>
```

**Step 2: 提交**

```bash
git add pages/profile/profile.wxml
git commit -m "feat(profile): 更新头像昵称为新的微信 API"
```

---

## Task 8: 更新 Profile 页面 WXSS

**Files:**
- Modify: `pages/profile/profile.wxss:13-45`

**Step 1: 添加 avatar-btn 样式**

```css
.avatar-btn {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  line-height: inherit;
}

.avatar-btn::after {
  border: none;
}
```

**Step 2: 添加 nickname-input 样式**

```css
.nickname-input {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
  margin-bottom: 10rpx;
  padding: 10rpx 20rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  min-width: 200rpx;
}

.nickname-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
  font-size: 28rpx;
}
```

**Step 3: 删除 username 样式**

删除：
```css
.username {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 10rpx;
}
```

**Step 4: 提交**

```bash
git add pages/profile/profile.wxss
git commit -m "feat(profile): 添加头像昵称按钮样式"
```

---

## Task 9: 更新 Profile 页面 JS

**Files:**
- Modify: `pages/profile/profile.js`

**Step 1: 导入 AuthService**

```javascript
const AuthService = require('../../services/auth')
const StorageService = require('../../utils/storage')
```

**Step 2: 添加 isLoggedIn 到 data**

```javascript
data: {
  userInfo: null,
  isLoggedIn: false,
  level: 99,
  // ...existing
}
```

**Step 3: 更新 loadUserInfo 方法**

```javascript
loadUserInfo() {
  const userInfo = AuthService.getUserInfo()
  const isLoggedIn = !!userInfo
  this.setData({ 
    userInfo: userInfo || AuthService.getDefaultUserInfo(),
    isLoggedIn
  })
}
```

**Step 4: 添加 onChooseAvatar 方法**

```javascript
onChooseAvatar(e) {
  const { avatarUrl } = e.detail
  
  const userInfo = this.data.userInfo || AuthService.getDefaultUserInfo()
  userInfo.avatarUrl = avatarUrl
  
  AuthService.saveUserInfo(userInfo)
  this.setData({ userInfo })
  
  wx.showToast({
    title: '头像已更新',
    icon: 'success'
  })
}
```

**Step 5: 添加 onNicknameInput 方法**

```javascript
onNicknameInput(e) {
  const nickName = e.detail.value.trim()
  
  if (!nickName) {
    wx.showToast({
      title: '昵称不能为空',
      icon: 'none'
    })
    return
  }

  const userInfo = this.data.userInfo || AuthService.getDefaultUserInfo()
  userInfo.nickName = nickName
  
  AuthService.saveUserInfo(userInfo)
  this.setData({ userInfo })
  
  wx.showToast({
    title: '昵称已更新',
    icon: 'success'
  })
}
```

**Step 6: 删除 getUserProfile 方法**

删除旧的 `getUserProfile()` 方法。

**Step 7: 验证语法**

Run: `node --check pages/profile/profile.js`
Expected: 无输出

**Step 8: 提交**

```bash
git add pages/profile/profile.js
git commit -m "feat(profile): 实现头像昵称设置逻辑"
```

---

## Task 10: 最终验证

**Files:**
- All modified files

**Step 1: 验证所有文件语法**

```bash
node --check services/auth.js && echo "auth.js: OK"
node --check app.js && echo "app.js: OK"
node --check pages/profile/profile.js && echo "profile.js: OK"
```

Expected: 全部输出 "OK"

**Step 2: 检查 git 状态**

```bash
git status
```

Expected: 显示所有修改的文件

**Step 3: 提交所有剩余变更**

```bash
git add -A
git commit -m "feat(auth): 微信登录功能完成"
```

---

## 完成

**调用技能**: `superpowers:finishing-a-development-branch`

验证所有任务完成，提供合并/PR 选项。
