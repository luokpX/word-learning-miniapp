class AudioService {
  constructor() {
    this.bgAudioManager = wx.getBackgroundAudioManager()
  }

  playWordAudio(url, options = {}) {
    if (!url) {
      return
    }

    const self = this
    this.bgAudioManager.title = '单词发音'
    this.bgAudioManager.epname = '单词发音'
    this.bgAudioManager.singer = '单词学习'
    this.bgAudioManager.src = url
    this.bgAudioManager.play()

    this.bgAudioManager.onEnded(function() {
      if (options.onEnded) {
        options.onEnded()
      }
    })

    this.bgAudioManager.onError(function(err) {
      console.error('Audio error:', err)
      if (options.onError) {
        options.onError(err)
      }
      if (options.onEnded) {
        options.onEnded()
      }
    })

    setTimeout(function() {
      if (options.onEnded) {
        options.onEnded()
      }
    }, 3000)
  }

  stopAudio() {
    this.bgAudioManager.stop()
  }

  setPlaybackRate(rate) {
    this.bgAudioManager.playbackRate = rate
  }
}

module.exports = new AudioService()
