App({
  globalData: {
    userInfo: null,
    studyProgress: {
      totalWords: 0,
      masteredWords: 0,
      learningWords: 0,
      dailyGoal: 20,
      todayStudied: 0
    }
  },

  onLaunch() {
    // TODO: Uncomment when using cloud development
    // wx.cloud.init({
    //   env: 'your-env-id',
    //   traceUser: true
    // })

    this.checkLoginStatus()
    this.loadStudyProgress()
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }
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
