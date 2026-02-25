const WordBook = require('../models/wordBook')
const StorageService = require('../utils/storage')

class WordBookService {
  constructor() {
    this.storageKey = 'wordBooks'
  }

  getAllWordBooks() {
    const data = StorageService.get(this.storageKey, [])
    return data.map(book => WordBook.fromJSON(book))
  }

  getWordBookById(id) {
    const books = this.getAllWordBooks()
    return books.find(book => book.id === id)
  }

  createWordBook(name, description = '') {
    const books = this.getAllWordBooks()
    const newBook = new WordBook({ name, description })
    books.push(newBook)
    this.saveBooks(books)
    return newBook
  }

  updateWordBook(id, name, description) {
    const books = this.getAllWordBooks()
    const book = books.find(b => b.id === id)
    if (book) {
      book.name = name
      book.description = description
      book.updatedAt = Date.now()
      this.saveBooks(books)
    }
    return book
  }

  deleteWordBook(id) {
    const books = this.getAllWordBooks()
    const filtered = books.filter(b => b.id !== id)
    this.saveBooks(filtered)
  }

  addWordToBook(bookId, wordData) {
    const books = this.getAllWordBooks()
    const book = books.find(b => b.id === bookId)
    if (book) {
      const text = wordData.text && wordData.text.trim() ? wordData.text.trim() : ''
      const audioUrl = wordData.audioUrl || (text ? `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=1` : '')
      const word = {
        id: 'word_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        text: text,
        phonetic: wordData.phonetic || '',
        meaning: wordData.meaning || '',
        audioUrl: audioUrl,
        examples: wordData.examples || []
      }
      book.addWord(word)
      this.saveBooks(books)
      return word
    }
    return null
  }

  removeWordFromBook(bookId, wordId) {
    const books = this.getAllWordBooks()
    const book = books.find(b => b.id === bookId)
    if (book) {
      book.removeWord(wordId)
      this.saveBooks(books)
    }
  }

  importWordsFromText(bookId, text) {
    const lines = text.split('\n').filter(line => line.trim())
    const addedWords = []
    
    lines.forEach(line => {
      const parts = line.split(/[,，、\t]+/).map(p => p.trim()).filter(p => p)
      if (parts.length >= 2) {
        const word = this.addWordToBook(bookId, {
          text: parts[0],
          phonetic: parts[1] || '',
          meaning: parts[2] || ''
        })
        if (word) {
          addedWords.push(word)
        }
      }
    })
    
    return addedWords
  }

  saveBooks(books) {
    const data = books.map(book => book.toJSON())
    StorageService.set(this.storageKey, data)
  }
}

module.exports = new WordBookService()
