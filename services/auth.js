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
