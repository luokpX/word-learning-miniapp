const AuthService = require('../../services/auth')
const wordBookService = require('../../services/wordBook')

Page({
  data: {
    wordBooks: []
  },

  onLoad() {
    // 添加登录检查
    if (!AuthService.requireAuth(this.route)) {
      return
    }
    this.loadWordBooks()
  },

  onShow() {
    this.loadWordBooks()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentIndex: 2
      })
    }
  },

  loadWordBooks() {
    const books = wordBookService.getAllWordBooks()
    this.setData({
      wordBooks: books.map(b => b.toJSON ? b.toJSON() : b)
    })
  },

  startLearn(e) {
    const mode = e.currentTarget.dataset.mode
    wx.navigateTo({
      url: `/pages/study/study?mode=${mode}`
    })
  },

  studyFromBook(e) {
    const bookId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/study/study?mode=book&bookId=${bookId}`
    })
  }
})
