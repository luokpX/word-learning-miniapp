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

    if (this.audioContext) {
      this.audioContext.stop()
      this.audioContext.destroy()
      this.audioContext = null
    }

    this.audioContext = wx.createInnerAudioContext()
    this.audioContext.src = url
    this.audioContext.autoplay = true
    this.currentUrl = url

    this.audioContext.onPlay(() => {
      console.log('Audio started playing')
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

    setTimeout(() => {
      if (options.onEnded) {
        options.onEnded()
      }
    }, 3000)
  }

  stopAudio() {
    if (this.audioContext) {
      try {
        this.audioContext.stop()
      } catch (e) {
        console.log('Stop error:', e)
      }
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
