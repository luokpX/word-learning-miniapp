const StorageService = require('../utils/storage')

class AudioService {
  constructor() {
    this.bgAudioManager = wx.getBackgroundAudioManager()
  }

  getAudioUrl(text) {
    if (!text) return ''
    const type = StorageService.getPronunciationType()
    return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`
  }

  playWordByText(text, options = {}) {
    const url = this.getAudioUrl(text)
    this.playWordAudio(url, options)
  }

  playWordFromObject(word, options = {}) {
    if (!word) return
    this.playWordByText(word.text || word.word, options)
  }

  playWordAudio(url, options = {}) {
    if (!url) {
      return
    }

    this.bgAudioManager.title = '单词发音'
    this.bgAudioManager.epname = '单词发音'
    this.bgAudioManager.singer = '单词学习'
    this.bgAudioManager.src = url

    if (options.playbackRate) {
      this.bgAudioManager.playbackRate = options.playbackRate
    }

    this.bgAudioManager.onEnded(() => {
      if (options.onEnded) {
        options.onEnded()
      }
    })

    this.bgAudioManager.onError((err) => {
      console.error('Audio error:', err)
      if (options.onError) {
        options.onError(err)
      }
      if (options.onEnded) {
        options.onEnded()
      }
    })

    this.bgAudioManager.play()
  }

  stopAudio() {
    this.bgAudioManager.stop()
  }

  setPlaybackRate(rate) {
    this.bgAudioManager.playbackRate = rate
  }
}

module.exports = new AudioService()
