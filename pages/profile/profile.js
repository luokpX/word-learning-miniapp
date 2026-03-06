const AuthService = require('../../services/auth')
const StorageService = require('../../utils/storage')

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    level: 99,
    isParentBound: false,
    pronunciationType: 2,
    studyStats: {
      totalDays: 0,
      masteredCount: 0,
      currentStreak: 0
    },
    achievements: [
      { id: 1, name: '首次学习', icon: '🌟', unlocked: true },
      { id: 2, name: '学习达人', icon: '📚', unlocked: false },
      { id: 3, name: '坚持7天', icon: '🔥', unlocked: false },
      { id: 4, name: '单词大师', icon: '🏆', unlocked: false },
      { id: 5, name: '满分小能手', icon: '💯', unlocked: false },
      { id: 6, name: '背诵高手', icon: '📖', unlocked: false },
      { id: 7, name: '默写冠军', icon: '✍️', unlocked: false },
      { id: 8, name: '全勤宝宝', icon: '🎯', unlocked: false }
    ]
  },

  onLoad() {
    this.loadUserInfo()
    this.loadStats()
    this.loadPronunciationType()
  },

  onShow() {
    this.loadStats()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentIndex: 3
      })
    }
  },

  loadUserInfo() {
    const userInfo = AuthService.getUserInfo()
    const isLoggedIn = !!userInfo
    this.setData({ 
      userInfo: userInfo || AuthService.getDefaultUserInfo(),
      isLoggedIn
    })
  },

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
  },

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
  },

  loadStats() {
    const mastered = StorageService.get('masteredWords', [])
    const streak = StorageService.get('streak', 0)
    const totalDays = StorageService.get('totalStudyDays', 0)
    
    this.setData({
      studyStats: {
        totalDays,
        masteredCount: mastered.length,
        currentStreak: streak
      },
      level: Math.floor(mastered.length / 10) + 1
    })
  },

  loadPronunciationType() {
    const pronunciationType = StorageService.getPronunciationType()
    this.setData({ pronunciationType })
  },

  togglePronunciation() {
    const newType = this.data.pronunciationType === 2 ? 1 : 2
    StorageService.setPronunciationType(newType)
    this.setData({ pronunciationType: newType })
    wx.showToast({
      title: newType === 2 ? '已切换为美式发音' : '已切换为英式发音',
      icon: 'none'
    })
  },

  showDeveloping() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  bindParent() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
})
