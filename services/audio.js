class AudioService {
  constructor() {
    this.audioContext = null
  }

  playWordAudio(url, options = {}) {
    if (!url) {
      return
    }

    if (this.audioContext) {
      this.audioContext.stop()
      this.audioContext = null
    }

    const ctx = wx.createInnerAudioContext()
    ctx.src = url
    ctx.autoplay = true

    ctx.onPlay(() => {
    })

    ctx.onEnded(() => {
      ctx.destroy()
      if (options.onEnded) {
        options.onEnded()
      }
    })

    ctx.onError((err) => {
      ctx.destroy()
      if (options.onError) {
        options.onError(err)
      }
      if (options.onEnded) {
        options.onEnded()
      }
    })

    this.audioContext = ctx
  }

  stopAudio() {
    if (this.audioContext) {
      this.audioContext.stop()
      this.audioContext.destroy()
      this.audioContext = null
    }
  }

  setPlaybackRate(rate) {
  }
}

module.exports = new AudioService()
