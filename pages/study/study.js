const wordService = require('../../services/word')
const audioService = require('../../services/audio')
const StorageService = require('../../utils/storage')

Page({
  data: {
    mode: 'learn',
    wordList: [],
    currentIndex: 0,
    currentWord: {},
    isFlipped: false,
    progressPercent: 0,
    sessionComplete: false,
    stats: {
      easy: 0,
      hard: 0,
      wrong: 0
    },
    isPlaying: false,
    playSpeed: 1
  },

  onLoad(options) {
    const mode = options.mode || 'learn'
    this.setData({ mode })
    this.loadWordList()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentIndex: 2
      })
    }
  },

  onUnload() {
    audioService.stopAudio()
  },

  loadWordList() {
    let words = []
    
    if (this.data.mode === 'learn') {
      words = wordService.getRandomWords(10)
    } else if (this.data.mode === 'review') {
      const recent = StorageService.getRecentWords(20)
      words = recent.length > 0 ? recent : wordService.getRandomWords(10)
    } else {
      words = wordService.getRandomWords(10)
    }

    if (words.length > 0) {
      this.setData({
        wordList: words,
        currentWord: words[0],
        progressPercent: 0
      })
    }
  },

  flipCard() {
    this.setData({
      isFlipped: !this.data.isFlipped
    })
  },

  playAudio(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      this.setData({ isPlaying: true })
      audioService.setPlaybackRate(this.data.playSpeed)
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

  toggleSpeed() {
    const newSpeed = this.data.playSpeed === 1 ? 0.5 : 1
    this.setData({ playSpeed: newSpeed })
    wx.showToast({
      title: newSpeed === 0.5 ? '慢速播放' : '正常速度',
      icon: 'none',
      duration: 1000
    })
  },

  markEasy() {
    this.recordResult('easy')
    this.updateStats('easy')
    this.nextWord()
  },

  markHard() {
    this.recordResult('hard')
    this.updateStats('hard')
    this.nextWord()
  },

  markWrong() {
    this.recordResult('wrong')
    this.updateStats('wrong')
    this.nextWord()
  },

  updateStats(type) {
    const stats = { ...this.data.stats }
    stats[type]++
    this.setData({ stats })
  },

  recordResult(result) {
    const word = this.data.currentWord
    StorageService.setStudyRecord(word.id, {
      result,
      timestamp: Date.now()
    })

    if (result === 'easy') {
      let mastered = StorageService.get('masteredWords', [])
      if (!mastered.includes(word.id)) {
        mastered.push(word.id)
        StorageService.set('masteredWords', mastered)
      }
    }

    StorageService.addRecentWord(word)
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
      isFlipped: false,
      progressPercent: progress
    })
  },

  prevWord() {
    if (this.data.currentIndex > 0) {
      const prevIndex = this.data.currentIndex - 1
      const progress = ((prevIndex + 1) / this.data.wordList.length) * 100

      this.setData({
        currentIndex: prevIndex,
        currentWord: this.data.wordList[prevIndex],
        isFlipped: false,
        progressPercent: progress
      })
    }
  },

  completeSession() {
    const app = getApp()
    app.updateTodayStudied(this.data.wordList.length)

    this.setData({
      sessionComplete: true
    })
  },

  restartStudy() {
    this.setData({
      currentIndex: 0,
      currentWord: this.data.wordList[0],
      isFlipped: false,
      progressPercent: 0,
      sessionComplete: false,
      stats: { easy: 0, hard: 0, wrong: 0 }
    })
  },

  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
