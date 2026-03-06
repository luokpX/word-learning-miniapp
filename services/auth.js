const StorageService = require('../utils/storage')

const AUTH_KEYS = {
  USER_INFO: 'userInfo',
  OPENID: 'openid',
  LOGIN_TIME: 'loginTime'
}

class AuthService {
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

  checkSessionValid() {
    return new Promise((resolve) => {
      wx.checkSession({
        success: () => resolve(true),
        fail: () => resolve(false)
      })
    })
  }

  async silentLogin() {
    try {
      // 1. 检查本地是否有用户信息
      const userInfo = StorageService.get(AUTH_KEYS.USER_INFO, null)

      // 2. 检查微信 session 是否有效
      const sessionValid = await this.checkSessionValid()

      if (sessionValid && userInfo) {
        // Session 有效且有用户信息，登录成功
        return { success: true, userInfo }
      }

      // 3. Session 失效或无用户信息，清除旧数据
      this.clearAuth()

      // 4. 调用 wx.login 获取 code (纯前端无法调用 code2Session，仅存储)
      return new Promise((resolve) => {
        wx.login({
          success: (res) => {
            if (res.code) {
              // 纯前端架构：仅存储 code，无法获取 openid
              StorageService.set(AUTH_KEYS.OPENID, res.code)
              StorageService.set(AUTH_KEYS.LOGIN_TIME, Date.now())

              // 使用默认用户信息
              const defaultInfo = this.getDefaultUserInfo()
              this.saveUserInfo(defaultInfo)

              resolve({ success: true, userInfo: defaultInfo, code: res.code })
            } else {
              resolve({ success: false, error: 'login code 获取失败' })
            }
          },
          fail: (err) => {
            resolve({ success: false, error: err.errMsg })
          }
        })
      })
    } catch (error) {
      console.error('silentLogin error:', error)
      return { success: false, error: error.message }
    }
  }

  saveUserInfo(userInfo) {
    StorageService.set(AUTH_KEYS.USER_INFO, userInfo)
  }

  getUserInfo() {
    return StorageService.get(AUTH_KEYS.USER_INFO, null)
  }

  getDefaultUserInfo() {
    return {
      avatarUrl: '/assets/icons/default-avatar.png',
      nickName: '桃桃'
    }
  }

  clearAuth() {
    StorageService.remove(AUTH_KEYS.USER_INFO)
    StorageService.remove(AUTH_KEYS.OPENID)
    StorageService.remove(AUTH_KEYS.LOGIN_TIME)
  }

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
}

module.exports = new AuthService()
