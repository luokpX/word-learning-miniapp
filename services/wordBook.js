const WordBook = require('../models/wordBook')
const StorageService = require('../utils/storage')
const DictionaryService = require('./dictionary')

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
      const trimmed = line.trim()
      if (!trimmed) return
      
      const firstDelim = trimmed.search(/[,，\t]/)
      if (firstDelim === -1) return
      
      const text = trimmed.substring(0, firstDelim).trim()
      if (!text) return
      
      const rest = trimmed.substring(firstDelim + 1)
      const secondDelim = rest.search(/[,，\t]/)
      
      let phonetic = ''
      let meaning = ''
      let examplePart = ''
      
      if (secondDelim === -1) {
        phonetic = rest.trim()
      } else {
        phonetic = rest.substring(0, secondDelim).trim()
        const remaining = rest.substring(secondDelim + 1)
        const thirdDelim = remaining.search(/[,，\t]/)
        if (thirdDelim === -1) {
          meaning = remaining.trim()
        } else {
          meaning = remaining.substring(0, thirdDelim).trim()
          examplePart = remaining.substring(thirdDelim + 1).trim()
        }
      }
      
      const word = this.addWordToBook(bookId, {
        text: text,
        phonetic: phonetic,
        meaning: meaning,
        examples: examplePart ? [examplePart] : []
      })
      if (word) {
        addedWords.push(word)
      }
    })
    
    return addedWords
  }

  async importWordsAuto(bookId, text, onProgress) {
    const lines = text.split('\n').filter(line => line.trim())
    const words = lines.map(line => {
      const trimmed = line.trim()
      const firstDelim = trimmed.search(/[,，\t]/)
      if (firstDelim === -1) {
        return trimmed
      }
      return trimmed.substring(0, firstDelim).trim()
    }).filter(w => w)

    const addedWords = []
    const failedWords = []

    await DictionaryService.batchLookup(words, async (current, total, word, result) => {
      if (result.error) {
        failedWords.push(word)
      } else if (result.data) {
        const wordData = this.addWordToBook(bookId, result.data)
        if (wordData) {
          addedWords.push(wordData)
        }
      }

      if (onProgress) {
        onProgress({
          current,
          total,
          success: addedWords.length,
          failed: failedWords.length,
          currentWord: word
        })
      }
    })

    return { addedWords, failedWords }
  }

  saveBooks(books) {
    const data = books.map(book => book.toJSON())
    StorageService.set(this.storageKey, data)
  }
}

module.exports = new WordBookService()
