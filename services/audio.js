class AudioService {
  constructor() {
    this.audioContext = null
    this.currentUrl = ''
    this.onEndedCallback = null
  }

  playWordAudio(url, options = {}) {
    if (!url) {
      console.warn('Audio URL is empty')
      return
    }

    const self = this

    wx.stopBackgroundAudio({
      success: function() {
        self.play(url, options)
      },
      fail: function() {
        self.play(url, options)
      }
    })
  }

  play(url, options = {}) {
    const self = this

    this.audioContext = wx.createInnerAudioContext()
    this.audioContext.src = url
    this.audioContext.autoplay = true
    this.currentUrl = url

    this.audioContext.onPlay(() => {
      console.log('Audio started playing')
    })

    this.audioContext.onEnded(() => {
      console.log('Audio ended')
      self.audioContext.destroy()
      self.audioContext = null
      if (options.onEnded) {
        options.onEnded()
      }
    })

    this.audioContext.onError((err) => {
      console.error('Audio error:', err)
      self.audioContext.destroy()
      self.audioContext = null
      if (options.onError) {
        options.onError(err)
      }
      if (options.onEnded) {
        options.onEnded()
      }
    })
  }

  stopAudio() {
    if (this.audioContext) {
      this.audioContext.stop()
      this.audioContext.destroy()
      this.audioContext = null
      this.currentUrl = ''
    }
  }

  pauseAudio() {
    if (this.audioContext) {
      this.audioContext.pause()
    }
  }

  resumeAudio() {
    if (this.audioContext) {
      this.audioContext.play()
    }
  }

  setPlaybackRate(rate) {
    if (this.audioContext) {
      this.audioContext.playbackRate = rate
    }
  }
}

module.exports = new AudioService()
