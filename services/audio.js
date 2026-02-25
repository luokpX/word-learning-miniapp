class AudioService {
  constructor() {
    this.audioContext = null
    this.currentAudio = null
  }

  playWordAudio(url, options = {}) {
    if (!url) {
      console.warn('Audio URL is empty')
      return Promise.reject(new Error('Audio URL is empty'))
    }

    return new Promise((resolve, reject) => {
      if (this.audioContext) {
        this.audioContext.destroy()
      }

      this.audioContext = wx.createInnerAudioContext()
      this.audioContext.src = url
      this.audioContext.autoplay = true

      this.audioContext.onPlay(() => {
        console.log('Audio started playing')
        if (options.onPlay) {
          options.onPlay()
        }
      })

      this.audioContext.onEnded(() => {
        console.log('Audio ended')
        resolve()
        if (options.onEnded) {
          options.onEnded()
        }
      })

      this.audioContext.onError((err) => {
        console.error('Audio error:', err)
        reject(err)
        if (options.onError) {
          options.onError(err)
        }
      })

      this.currentAudio = this.audioContext
    })
  }

  stopAudio() {
    if (this.audioContext) {
      this.audioContext.stop()
      this.audioContext.destroy()
      this.audioContext = null
      this.currentAudio = null
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
