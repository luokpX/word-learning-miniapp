const wordService = require('../../services/word')
const audioService = require('../../services/audio')
const StorageService = require('../../utils/storage')

Page({
  data: {
    currentTab: 'all',
    allWords: [],
    filteredWords: [],
    masteredWords: []
  },

  onLoad() {
    this.loadWords()
  },

  onShow() {
    this.loadMasteredStatus()
  },

  loadWords() {
    const words = wordService.getAllWords()
    this.setData({
      allWords: words,
      filteredWords: words
    })
  },

  loadMasteredStatus() {
    const mastered = StorageService.get('masteredWords', [])
    const updatedWords = this.data.allWords.map(w => ({
      ...w,
      mastered: mastered.includes(w.id)
    }))
    
    this.setData({
      allWords: updatedWords,
      filteredWords: this.data.currentTab === 'all' 
        ? updatedWords 
        : updatedWords.filter(w => w.category === this.data.currentTab)
    })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    const filtered = tab === 'all' 
      ? this.data.allWords 
      : this.data.allWords.filter(w => w.category === tab)
    
    this.setData({
      currentTab: tab,
      filteredWords: filtered
    })
  },

  showWordDetail(e) {
    const word = e.currentTarget.dataset.word
    StorageService.addRecentWord(word)
    
    wx.showModal({
      title: word.text,
      content: `${word.phonetic}\n\n${word.meaning}\n\n例句：${word.examples[0] || '暂无例句'}`,
      showCancel: false,
      confirmText: '关闭',
      success: () => {
        if (word.audioUrl) {
          this.playWordAudio({ currentTarget: { dataset: { url: word.audioUrl } } })
        }
      }
    })
  },

  playWordAudio(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      audioService.playWordAudio(url)
    }
  },

  addCustomWord() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
})
