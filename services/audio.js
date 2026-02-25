class AudioService {
  constructor() {
    this.audioContext = null
    this.currentUrl = ''
  }

  playWordAudio(url, options = {}) {
    if (!url) {
      console.warn('Audio URL is empty')
      return Promise.reject(new Error('Audio URL is empty'))
    }

    const self = this

    if (this.audioContext && this.currentUrl === url) {
      this.audioContext.stop()
    }

    if (this.audioContext) {
      this.audioContext.destroy()
    }

    this.audioContext = wx.createInnerAudioContext()
    this.audioContext.src = url
    this.audioContext.autoplay = true
    this.currentUrl = url

    this.audioContext.onPlay(() => {
      console.log('Audio started playing')
      if (options.onPlay) {
        options.onPlay()
      }
    })

    this.audioContext.onEnded(() => {
      console.log('Audio ended')
      if (options.onEnded) {
        options.onEnded()
      }
    })

    this.audioContext.onError((err) => {
      console.error('Audio error:', err)
      if (options.onError) {
        options.onError(err)
      }
    })

    this.audioContext.onStop(() => {
      console.log('Audio stopped')
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
