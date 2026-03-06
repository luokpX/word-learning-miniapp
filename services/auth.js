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
