class Word {
  constructor(data) {
    this.id = data.id || this.generateId()
    this.text = data.text
    this.phonetic = data.phonetic || ''
    this.meaning = data.meaning
    this.examples = data.examples || []
    this.audioUrl = data.audioUrl || ''
    this.imageUrl = data.imageUrl || ''
    this.category = data.category || 'general'
    this.unit = data.unit || 1
    this.difficulty = data.difficulty || 1
    this.createdAt = data.createdAt || Date.now()
  }

  generateId() {
    return 'word_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  toJSON() {
    return {
      id: this.id,
      text: this.text,
      phonetic: this.phonetic,
      meaning: this.meaning,
      examples: this.examples,
      audioUrl: this.audioUrl,
      imageUrl: this.imageUrl,
      category: this.category,
      unit: this.unit,
      difficulty: this.difficulty,
      createdAt: this.createdAt
    }
  }

  static fromJSON(json) {
    return new Word(json)
  }
}

module.exports = Word
