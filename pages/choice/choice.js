const audioService = require('../../services/audio')
const wordBookService = require('../../services/wordBook')

Page({
  data: {
    wordList: [],
    allWords: [],
    currentIndex: 0,
    currentWord: {},
    currentOptions: [],
    correctIndex: -1,
    selectedIndex: -1,
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
        const wordList = JSON.parse(decodeURIComponent(options.words))
        this.setData({
          wordList: wordList,
          allWords: wordList,
          currentWord: wordList[0]
        })
        this.generateOptions()
      } catch (e) {
        wx.showToast({ title: '加载失败', icon: 'none' })
        wx.navigateBack()
      }
    } else if (options.bookId) {
      const book = wordBookService.getWordBookById(options.bookId)
      if (book) {
        const bookData = book.toJSON ? book.toJSON() : book
        const words = bookData.words || []
        if (words.length >= 4) {
          this.setData({
            wordList: words,
            allWords: words,
            currentWord: words[0]
          })
          this.generateOptions()
        } else {
          wx.showToast({ title: '至少需要4个单词', icon: 'none' })
          wx.navigateBack()
        }
      } else {
        wx.navigateBack()
      }
    } else {
      wx.navigateBack()
    }
  },

  onUnload() {
    audioService.stopAudio()
  },

  generateOptions() {
    const { currentWord, allWords } = this.data
    const correctMeaning = currentWord.meaning
    
    const otherWords = allWords.filter(w => w.id !== currentWord.id)
    const shuffled = otherWords.sort(() => Math.random() - 0.5).slice(0, 3)
    
    const wrongOptions = shuffled.map(w => w.meaning)
    
    const allOptions = [correctMeaning, ...wrongOptions]
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5)
    
    const correctIndex = shuffledOptions.indexOf(correctMeaning)
    
    this.setData({
      currentOptions: shuffledOptions,
      correctIndex: correctIndex
    })
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

  selectOption(e) {
    if (this.data.showResult) return

    const selectedIndex = e.currentTarget.dataset.index
    const { correctIndex, stats } = this.data
    const isCorrect = selectedIndex === correctIndex

    this.setData({
      selectedIndex: selectedIndex,
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
      selectedIndex: -1,
      showResult: false,
      isCorrect: false,
      progressPercent: progress
    })

    this.generateOptions()
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
      allWords: shuffled,
      currentIndex: 0,
      currentWord: shuffled[0],
      selectedIndex: -1,
      showResult: false,
      isCorrect: false,
      progressPercent: 0,
      sessionComplete: false,
      stats: {
        correct: 0,
        wrong: 0
      }
    })

    this.generateOptions()
  },

  goBack() {
    wx.navigateBack()
  }
})
