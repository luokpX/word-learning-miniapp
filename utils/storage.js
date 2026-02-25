class StorageService {
  static set(key, value) {
    try {
      wx.setStorageSync(key, value)
      return true
    } catch (err) {
      console.error('Storage set error:', err)
      return false
    }
  }

  static get(key, defaultValue = null) {
    try {
      const value = wx.getStorageSync(key)
      return value || defaultValue
    } catch (err) {
      console.error('Storage get error:', err)
      return defaultValue
    }
  }

  static remove(key) {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (err) {
      console.error('Storage remove error:', err)
      return false
    }
  }

  static clear() {
    try {
      wx.clearStorageSync()
      return true
    } catch (err) {
      console.error('Storage clear error:', err)
      return false
    }
  }

  static setStudyRecord(wordId, record) {
    const records = this.get('studyRecords', {})
    if (!records[wordId]) {
      records[wordId] = []
    }
    records[wordId].push(record)
    this.set('studyRecords', records)
  }

  static getStudyRecords(wordId) {
    const records = this.get('studyRecords', {})
    return records[wordId] || []
  }

  static addRecentWord(word) {
    let recentWords = this.get('recentWords', [])
    recentWords = recentWords.filter(w => w.id !== word.id)
    recentWords.unshift(word)
    recentWords = recentWords.slice(0, 20)
    this.set('recentWords', recentWords)
  }

  static getRecentWords(limit = 10) {
    const words = this.get('recentWords', [])
    return words.slice(0, limit)
  }
}

module.exports = StorageService
