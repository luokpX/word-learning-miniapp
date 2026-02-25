Component({
  data: {
    currentIndex: 0
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const path = e.currentTarget.dataset.path
      
      this.setData({
        currentIndex: index
      })

      wx.switchTab({
        url: '/' + path
      })
    }
  }
})
