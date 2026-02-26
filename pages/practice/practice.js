const wordBookService = require('../../services/wordBook')

Page({
  data: {
    wordBooks: []
  },

  onLoad() {
    this.loadWordBooks()
  },

  onShow() {
    this.loadWordBooks()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentIndex: 3
      })
    }
  },

  loadWordBooks() {
    const books = wordBookService.getAllWordBooks()
    this.setData({
      wordBooks: books.map(b => b.toJSON ? b.toJSON() : b)
    })
  },

  startQuickPractice() {
    const allBooks = wordBookService.getAllWordBooks()
    let allWords = []
    allBooks.forEach(book => {
      const bookData = book.toJSON ? book.toJSON() : book
      if (bookData.words && bookData.words.length > 0) {
        allWords = allWords.concat(bookData.words)
      }
    })

    if (allWords.length === 0) {
      wx.showToast({
        title: '单词本为空',
        icon: 'none'
      })
      return
    }

    const randomWords = allWords.sort(() => Math.random() - 0.5).slice(0, 10)
    wx.navigateTo({
      url: '/pages/spelling/spelling?words=' + encodeURIComponent(JSON.stringify(randomWords))
    })
  },

  startYingHanPractice() {
    const allBooks = wordBookService.getAllWordBooks()
    let allWords = []
    allBooks.forEach(book => {
      const bookData = book.toJSON ? book.toJSON() : book
      if (bookData.words && bookData.words.length > 0) {
        allWords = allWords.concat(bookData.words)
      }
    })

    if (allWords.length < 4) {
      wx.showToast({
        title: '至少需要4个单词',
        icon: 'none'
      })
      return
    }

    const randomWords = allWords.sort(() => Math.random() - 0.5).slice(0, 10)
    wx.navigateTo({
      url: '/pages/choice/choice?words=' + encodeURIComponent(JSON.stringify(randomWords))
    })
  },

  practiceFromBook(e) {
    const bookId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/spelling/spelling?bookId=' + bookId
    })
  }
})
