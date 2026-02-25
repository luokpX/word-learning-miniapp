const Word = require('../models/word')

const sampleWords = [
  {
    id: 'word_001',
    text: 'apple',
    phonetic: '/ˈæpl/',
    meaning: '苹果',
    examples: ['I eat an apple every day.'],
    audioUrl: 'https://dict.youdao.com/dictvoice?audio=apple&type=1',
    category: 'fruit',
    unit: 1,
    difficulty: 1
  },
  {
    id: 'word_002',
    text: 'banana',
    phonetic: '/bəˈnɑːnə/',
    meaning: '香蕉',
    examples: ['Monkeys like bananas.'],
    audioUrl: 'https://dict.youdao.com/dictvoice?audio=banana&type=1',
    category: 'fruit',
    unit: 1,
    difficulty: 1
  },
  {
    id: 'word_003',
    text: 'orange',
    phonetic: '/ˈɒrɪndʒ/',
    meaning: '橙子',
    examples: ['I want to drink orange juice.'],
    audioUrl: 'https://dict.youdao.com/dictvoice?audio=orange&type=1',
    category: 'fruit',
    unit: 1,
    difficulty: 1
  },
  {
    id: 'word_004',
    text: 'book',
    phonetic: '/bʊk/',
    meaning: '书本',
    examples: ['This is a good book.'],
    audioUrl: 'https://dict.youdao.com/dictvoice?audio=book&type=1',
    category: 'school',
    unit: 1,
    difficulty: 1
  },
  {
    id: 'word_005',
    text: 'pen',
    phonetic: '/pen/',
    meaning: '钢笔',
    examples: ['I write with a pen.'],
    audioUrl: 'https://dict.youdao.com/dictvoice?audio=pen&type=1',
    category: 'school',
    unit: 1,
    difficulty: 1
  },
  {
    id: 'word_006',
    text: 'teacher',
    phonetic: '/ˈtiːtʃə/',
    meaning: '老师',
    examples: ['My teacher is very kind.'],
    audioUrl: 'https://dict.youdao.com/dictvoice?audio=teacher&type=1',
    category: 'school',
    unit: 1,
    difficulty: 1
  },
  {
    id: 'word_007',
    text: 'student',
    phonetic: '/ˈstjuːdnt/',
    meaning: '学生',
    examples: ['I am a student.'],
    audioUrl: 'https://dict.youdao.com/dictvoice?audio=student&type=1',
    category: 'school',
    unit: 1,
    difficulty: 1
  },
  {
    id: 'word_008',
    text: 'cat',
    phonetic: '/kæt/',
    meaning: '猫',
    examples: ['I have a cute cat.'],
    audioUrl: 'https://dict.youdao.com/dictvoice?audio=cat&type=1',
    category: 'animal',
    unit: 2,
    difficulty: 1
  },
  {
    id: 'word_009',
    text: 'dog',
    phonetic: '/dɒɡ/',
    meaning: '狗',
    examples: ['The dog is running.'],
    audioUrl: 'https://dict.youdao.com/dictvoice?audio=dog&type=1',
    category: 'animal',
    unit: 2,
    difficulty: 1
  },
  {
    id: 'word_010',
    text: 'bird',
    phonetic: '/bɜːd/',
    meaning: '鸟',
    examples: ['The bird can fly.'],
    audioUrl: 'https://dict.youdao.com/dictvoice?audio=bird&type=1',
    category: 'animal',
    unit: 2,
    difficulty: 1
  }
]

class WordService {
  constructor() {
    this.words = sampleWords.map(w => Word.fromJSON(w))
  }

  getWordsByUnit(unit) {
    return this.words.filter(w => w.unit === unit)
  }

  getWordsByCategory(category) {
    return this.words.filter(w => w.category === category)
  }

  getWordById(id) {
    return this.words.find(w => w.id === id)
  }

  getRandomWords(count = 10) {
    const shuffled = [...this.words].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  getAllWords() {
    return this.words
  }

  searchWords(keyword) {
    const lower = keyword.toLowerCase()
    return this.words.filter(w => 
      w.text.toLowerCase().includes(lower) ||
      w.meaning.includes(keyword)
    )
  }
}

module.exports = new WordService()
