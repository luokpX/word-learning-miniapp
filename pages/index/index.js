const app = getApp()
const audioService = require('../../services/audio')

Page({
  data: {
    studyProgress: {
      todayStudied: 0,
      masteredWords: 0,
      learningWords: 0,
      dailyGoal: 20
    },
    progressPercent: 0,
    recentWords: []
  },

  onLoad() {
    this.loadProgress()
    this.loadRecentWords()
  },

  onShow() {
    this.loadProgress()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentIndex: 0
      })
    }
  },

  loadProgress() {
    const progress = app.globalData.studyProgress
    const percent = Math.min((progress.todayStudied / progress.dailyGoal) * 100, 100)
    
    this.setData({
      studyProgress: progress,
      progressPercent: percent
    })
  },

  loadRecentWords() {
    const words = wx.getStorageSync('recentWords') || []
    this.setData({
      recentWords: words.slice(0, 5)
    })
  },

  startQuickStudy() {
    wx.navigateTo({
      url: '/pages/study/study?mode=learn'
    })
  },

  startReview() {
    wx.navigateTo({
      url: '/pages/study/study?mode=review'
    })
  },

  startTest() {
    wx.navigateTo({
      url: '/pages/study/study?mode=test'
    })
  },

  viewAllWords() {
    wx.switchTab({
      url: '/pages/wordbook/wordbook'
    })
  },

  playWord(e) {
    const word = e.currentTarget.dataset.word
    audioService.playWordAudio(word.audioUrl)
  }
})
