const wordBookService = require('../../services/wordBook')
const audioService = require('../../services/audio')

Page({
  data: {
    wordList: [],
    currentIndex: 0,
    currentWord: {},
    userInput: '',
    letterCount: 0,
    inputFocused: true,
    showResult: false,
    isCorrect: false,
    isPlaying: false,
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
        const letterCount = words[0] ? words[0].text.length : 0
        this.setData({
          wordList: words,
          currentWord: words[0],
          letterCount: letterCount
        }, () => {
          this.autoPlayAudio()
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
            currentWord: words[0],
            letterCount: words[0].text.length
          }, () => {
            this.autoPlayAudio()
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

  onUnload() {
    audioService.stopAudio()
  },

  onInput(e) {
    this.setData({
      userInput: e.detail.value
    })
  },

  focusInput() {
    this.setData({ inputFocused: true })
  },

  autoPlayAudio() {
    const url = this.data.currentWord.audioUrl
    if (url) {
      this.setData({ isPlaying: true })
      audioService.playWordAudio(url, {
        onEnded: () => {
          this.setData({ isPlaying: false })
        },
        onError: () => {
          this.setData({ isPlaying: false })
        }
      })
    }
  },

  playAudio(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      this.setData({ isPlaying: true })
      audioService.playWordAudio(url, {
        onEnded: () => {
          this.setData({ isPlaying: false })
        },
        onError: () => {
          this.setData({ isPlaying: false })
        }
      })
    }
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
    const nextWord = this.data.wordList[nextIndex]

    this.setData({
      currentIndex: nextIndex,
      currentWord: nextWord,
      userInput: '',
      letterCount: nextWord.text.length,
      showResult: false,
      isCorrect: false,
      progressPercent: progress,
      inputFocused: true
    }, () => {
      this.autoPlayAudio()
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
      letterCount: shuffled[0].text.length,
      showResult: false,
      isCorrect: false,
      progressPercent: 0,
      sessionComplete: false,
      inputFocused: true,
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
