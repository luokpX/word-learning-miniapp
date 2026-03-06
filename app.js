const AuthService = require('./services/auth')

App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    studyProgress: {
      totalWords: 0,
      masteredWords: 0,
      learningWords: 0,
      dailyGoal: 20,
      todayStudied: 0
    },
    // Unsplash API 配置
    unsplashApiKey: 'Iig_zrzRIDqCUH8qvw4e8p5tDC_mttzUw_vx0WvOn2I',
    unsplashMaxWidth: 400
  },

  async onLaunch() {
    // 1. 优先执行登录检查
    const loginResult = await AuthService.silentLogin()
    if (loginResult.success) {
      this.globalData.userInfo = loginResult.userInfo
      this.globalData.isLoggedIn = true
      console.log('静默登录成功:', loginResult.userInfo)
    }

    // 2. 加载学习进度
    this.loadStudyProgress()
  },

  checkLoginStatus() {
    // 保留兼容性，实际逻辑已移至 onLaunch
    return AuthService.checkLoginStatus()
  },

  loadStudyProgress() {
    const progress = wx.getStorageSync('studyProgress')
    if (progress) {
      this.globalData.studyProgress = progress
    }
  },

  saveStudyProgress() {
    wx.setStorageSync('studyProgress', this.globalData.studyProgress)
  },

  updateTodayStudied(count) {
    this.globalData.studyProgress.todayStudied += count
    this.saveStudyProgress()
  },

  updateMasteredWords(count) {
    this.globalData.studyProgress.masteredWords += count
    this.saveStudyProgress()
  }
})
