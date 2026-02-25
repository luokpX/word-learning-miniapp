class WordBook {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.name = data.name || '新建单词本'
    this.description = data.description || ''
    this.words = data.words || []
    this.createdAt = data.createdAt || Date.now()
    this.updatedAt = data.updatedAt || Date.now()
  }

  generateId() {
    return 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  addWord(word) {
    if (!this.words.find(w => w.text === word.text)) {
      this.words.push(word)
      this.updatedAt = Date.now()
    }
  }

  removeWord(wordId) {
    this.words = this.words.filter(w => w.id !== wordId)
    this.updatedAt = Date.now()
  }

  getWordCount() {
    return this.words.length
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      words: this.words,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  static fromJSON(json) {
    return new WordBook(json)
  }
}

module.exports = WordBook
