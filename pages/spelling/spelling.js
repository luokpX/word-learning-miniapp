const wordBookService = require('../../services/wordBook')

Page({
  data: {
    wordList: [],
    currentIndex: 0,
    currentWord: {},
    userInput: '',
    showResult: false,
    isCorrect: false,
    progressPercent: 0,
    sessionComplete: false,
    stats: {
      correct: 0,
      wrong: 0
    }
  },

  onLoad(options) {
    if (options.words) {
      try {
        const words = JSON.parse(decodeURIComponent(options.words))
        this.setData({
          wordList: words,
          currentWord: words[0]
        })
      } catch (e) {
        wx.showToast({ title: '加载失败', icon: 'none' })
        wx.navigateBack()
      }
    } else if (options.bookId) {
      const book = wordBookService.getWordBookById(options.bookId)
      if (book) {
        const bookData = book.toJSON ? book.toJSON() : book
        const words = bookData.words || []
        if (words.length > 0) {
          this.setData({
            wordList: words,
            currentWord: words[0]
          })
        } else {
          wx.showToast({ title: '单词本为空', icon: 'none' })
          wx.navigateBack()
        }
      }
    } else {
      wx.navigateBack()
    }
  },

  onInput(e) {
    this.setData({
      userInput: e.detail.value
    })
  },

  checkAnswer() {
    const { userInput, currentWord, stats } = this.data
    if (!userInput.trim()) {
      wx.showToast({ title: '请输入拼写', icon: 'none' })
      return
    }

    const isCorrect = userInput.trim().toLowerCase() === currentWord.text.toLowerCase()
    this.setData({
      showResult: true,
      isCorrect: isCorrect,
      stats: {
        correct: stats.correct + (isCorrect ? 1 : 0),
        wrong: stats.wrong + (isCorrect ? 0 : 1)
      }
    })
  },

  nextWord() {
    if (this.data.currentIndex >= this.data.wordList.length - 1) {
      this.completeSession()
      return
    }

    const nextIndex = this.data.currentIndex + 1
    const progress = ((nextIndex + 1) / this.data.wordList.length) * 100

    this.setData({
      currentIndex: nextIndex,
      currentWord: this.data.wordList[nextIndex],
      userInput: '',
      showResult: false,
      isCorrect: false,
      progressPercent: progress
    })
  },

  completeSession() {
    this.setData({
      sessionComplete: true
    })
  },

  restartPractice() {
    const shuffled = [...this.data.wordList].sort(() => Math.random() - 0.5)
    this.setData({
      wordList: shuffled,
      currentIndex: 0,
      currentWord: shuffled[0],
      userInput: '',
      showResult: false,
      isCorrect: false,
      progressPercent: 0,
      sessionComplete: false,
      stats: {
        correct: 0,
        wrong: 0
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
