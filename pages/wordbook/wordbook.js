const wordBookService = require('../../services/wordBook')

Page({
  data: {
    wordBooks: [],
    showModal: false,
    newBook: {
      name: '',
      description: ''
    }
  },

  onLoad() {
  },

  onShow() {
    this.loadWordBooks()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentIndex: 1
      })
    }
  },

  loadWordBooks() {
    const books = wordBookService.getAllWordBooks()
    this.setData({
      wordBooks: books.map(b => b.toJSON ? b.toJSON() : b)
    })
  },

  showCreateModal() {
    this.setData({
      showModal: true,
      newBook: { name: '', description: '' }
    })
  },

  closeModal() {
    this.setData({ showModal: false })
  },

  onNameInput(e) {
    this.setData({
      'newBook.name': e.detail.value
    })
  },

  onDescInput(e) {
    this.setData({
      'newBook.description': e.detail.value
    })
  },

  createBook() {
    const { name, description } = this.data.newBook
    if (!name) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }

    wordBookService.createWordBook(name, description)
    this.loadWordBooks()
    this.setData({ showModal: false })
    wx.showToast({ title: '创建成功' })
  },

  goToBookDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/wordbook-detail/wordbook-detail?id=${id}`
    })
  }
})
