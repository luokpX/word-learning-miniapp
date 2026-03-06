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
