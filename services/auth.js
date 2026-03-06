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
}

module.exports = new AuthService()
