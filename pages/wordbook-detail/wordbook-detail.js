const wordBookService = require('../../services/wordBook')
const audioService = require('../../services/audio')

Page({
  data: {
    bookId: '',
    book: {
      name: '',
      words: []
    },
    showAddModal: false,
    showImportModal: false,
    isEdit: false,
    formData: {
      text: '',
      phonetic: '',
      meaning: ''
    },
    importText: '',
    importMode: 'auto',
    importProgress: null,
    isImporting: false
  },

  onLoad(options) {
    const bookId = options.id
    if (bookId) {
      this.setData({ bookId })
      this.loadBook(bookId)
    }
  },

  onShow() {
    if (this.data.bookId) {
      this.loadBook(this.data.bookId)
    }
  },

  loadBook(bookId) {
    const book = wordBookService.getWordBookById(bookId)
    if (book) {
      this.setData({ book: book.toJSON ? book : book })
    } else {
      wx.showToast({
        title: '单词本不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  addWord() {
    this.setData({
      showAddModal: true,
      isEdit: false,
      formData: { text: '', phonetic: '', meaning: '' }
    })
  },

  editBook() {
    wx.showActionSheet({
      itemList: ['重命名', '修改描述'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.renameBook()
        } else if (res.tapIndex === 1) {
          this.editDescription()
        }
      }
    })
  },

  renameBook() {
    wx.showModal({
      title: '重命名',
      editable: true,
      placeholderText: '请输入单词本名称',
      success: (res) => {
        if (res.confirm && res.content) {
          wordBookService.updateWordBook(this.data.bookId, res.content, this.data.book.description)
          this.loadBook(this.data.bookId)
          wx.showToast({ title: '已重命名' })
        }
      }
    })
  },

  editDescription() {
    wx.showModal({
      title: '修改描述',
      editable: true,
      placeholderText: '请输入描述',
      success: (res) => {
        if (res.confirm) {
          wordBookService.updateWordBook(this.data.bookId, this.data.book.name, res.content || '')
          this.loadBook(this.data.bookId)
        }
      }
    })
  },

  deleteBook() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个单词本吗？',
      success: (res) => {
        if (res.confirm) {
          wordBookService.deleteWordBook(this.data.bookId)
          wx.showToast({ title: '已删除' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    })
  },

  importWords() {
    this.setData({
      showImportModal: true,
      importText: ''
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`formData.${field}`]: value
    })
  },

  onImportInput(e) {
    this.setData({
      importText: e.detail.value
    })
  },

  closeModal() {
    this.setData({ showAddModal: false })
  },

  closeImportModal() {
    this.setData({ showImportModal: false })
  },

  confirmAddWord() {
    const { text, phonetic, meaning } = this.data.formData
    if (!text) {
      wx.showToast({ title: '请输入单词', icon: 'none' })
      return
    }

    wordBookService.addWordToBook(this.data.bookId, { text, phonetic, meaning })
    this.loadBook(this.data.bookId)
    this.setData({ showAddModal: false })
    wx.showToast({ title: '添加成功' })
  },

  confirmImport() {
    const text = this.data.importText
    if (!text) {
      wx.showToast({ title: '请输入单词', icon: 'none' })
      return
    }

    if (this.data.importMode === 'auto') {
      this.doAutoImport(text)
    } else {
      const added = wordBookService.importWordsFromText(this.data.bookId, text)
      this.loadBook(this.data.bookId)
      this.setData({ showImportModal: false })
      wx.showToast({ title: `已导入 ${added.length} 个单词` })
    }
  },

  doAutoImport(text) {
    this.setData({ isImporting: true, importProgress: { current: 0, total: 0, success: 0, failed: 0 } })

    wordBookService.importWordsAuto(this.data.bookId, text, (progress) => {
      this.setData({
        importProgress: progress
      })
    }).then((result) => {
      this.setData({ isImporting: false, showImportModal: false, importProgress: null })
      this.loadBook(this.data.bookId)
      
      let message = `成功导入 ${result.addedWords.length} 个单词`
      if (result.failedWords.length > 0) {
        message += `，${result.failedWords.length} 个失败`
      }
      wx.showToast({ title: message, icon: 'none' })
    }).catch((err) => {
      this.setData({ isImporting: false, importProgress: null })
      wx.showToast({ title: '导入失败', icon: 'none' })
      console.error('Auto import error:', err)
    })
  },

  switchImportMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ importMode: mode })
  },

  deleteWord(e) {
    const wordId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个单词吗？',
      success: (res) => {
        if (res.confirm) {
          wordBookService.removeWordFromBook(this.data.bookId, wordId)
          this.loadBook(this.data.bookId)
          wx.showToast({ title: '已删除' })
        }
      }
    })
  },

  playWord(e) {
    const word = e.currentTarget.dataset.word
    if (word) {
      audioService.playWordFromObject(word)
    } else {
      wx.showToast({ title: '无法播放发音', icon: 'none' })
    }
  }
})
