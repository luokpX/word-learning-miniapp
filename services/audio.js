class AudioService {
  constructor() {
    this.bgAudioManager = wx.getBackgroundAudioManager()
    this.innerAudioContext = null
  }

  playWordAudio(url, options = {}) {
    if (!url) {
      console.log('AudioService: No URL provided')
      return
    }

    console.log('AudioService: Playing URL:', url)

    // Use InnerAudioContext for word pronunciation (better for short audio)
    if (!this.innerAudioContext) {
      this.innerAudioContext = wx.createInnerAudioContext()
    }

    this.innerAudioContext.src = url
    this.innerAudioContext.playbackRate(options.playbackRate || 1)

    this.innerAudioContext.onPlay(() => {
      console.log('AudioService: Playing')
    })

    this.innerAudioContext.onEnded(() => {
      console.log('AudioService: Ended')
      if (options.onEnded) {
        options.onEnded()
      }
    })

    this.innerAudioContext.onError((err) => {
      console.error('AudioService: Error', err)
      if (options.onError) {
        options.onError(err)
      }
      if (options.onEnded) {
        options.onEnded()
      }
    })

    this.innerAudioContext.play()
  }

  stopAudio() {
    if (this.innerAudioContext) {
      this.innerAudioContext.stop()
    }
    this.bgAudioManager.stop()
  }

  setPlaybackRate(rate) {
    if (this.innerAudioContext) {
      this.innerAudioContext.playbackRate(rate)
    }
    this.bgAudioManager.playbackRate = rate
  }
}

module.exports = new AudioService()
