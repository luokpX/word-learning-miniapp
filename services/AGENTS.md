# Services 层 AGENTS.md

**职责**: 封装外部 API 调用和数据操作，为页面提供统一的数据接口

## 目录结构

```
services/
├── audio.js           # 音频服务 (有道 TTS)
├── dictionary.js      # 词典服务 (有道词典 API)
├── word.js            # 单词数据服务
└── wordBook.js        # 单词本 CRUD 服务
```

## 服务概览

| 服务 | 依赖 | 功能 |
|------|------|------|
| `audio.js` | `utils/storage.js` | 播放单词发音 (有道 TTS) |
| `dictionary.js` | 无 | 查询单词释义、音标、词性 |
| `word.js` | `dictionary.js` | 单词数据管理、随机获取 |
| `wordBook.js` | `dictionary.js`, `models/` | 单词本 CRUD、批量导入 |

## 使用模式

### 1. 词典查询 (dictionary.js)

```javascript
const DictionaryService = require('../../services/dictionary')

// 单个单词查询
const result = await DictionaryService.lookup('apple')
// 返回：{ error: null, data: { text, phonetic, meaning, pos, examples, audioUrl } }

// 批量查询 (带进度回调)
await DictionaryService.batchLookup(words, (current, total, word, result) => {
  console.log(`进度：${current}/${total}, 当前：${word}`)
})
```

**API 端点**: `https://dict.youdao.com/jsonapi?jsonversion=2&client=mobile&q={word}`

**返回数据结构**:
```javascript
{
  text: 'apple',           // 单词
  phonetic: '/ˈæp(ə)l/',   // 音标
  meaning: '苹果',         // 中文释义
  pos: 'n.',               // 词性 (n./v./adj. 等)
  examples: [...],         // 例句数组
  audioUrl: '...'          // 发音 URL
}
```

### 2. 音频播放 (audio.js)

```javascript
const audioService = require('../../services/audio')

// 从单词对象播放
audioService.playWordFromObject(word, {
  playbackRate: 1.0,      // 播放速度 (0.5 或 1)
  onEnded: () => {},      // 播放结束回调
  onError: (err) => {}    // 错误回调
})

// 停止播放
audioService.stopAudio()
```

**特点**:
- 使用 `wx.getBackgroundAudioManager()` 支持后台播放
- 发音类型 (英音/美音) 存储在 `storage.js` 中
- 单例模式，全局唯一实例

### 3. 单词本操作 (wordBook.js)

```javascript
const wordBookService = require('../../services/wordBook')

// 获取所有单词本
const books = wordBookService.getAllWordBooks()

// 创建单词本
const newBook = wordBookService.createWordBook('小学词汇', '三年级上册')

// 添加单词
wordBookService.addWordToBook(bookId, {
  text: 'apple',
  phonetic: '/ˈæp(ə)l/',
  meaning: '苹果'
})

// 批量导入 (自动查询词典)
await wordBookService.importWordsAuto(bookId, text, (progress) => {
  console.log(`导入进度：${progress.current}/${progress.total}`)
})
```

**导入格式支持**:
```
单词，音标，释义，例句
apple,/ˈæp(ə)l/,苹果，She ate an apple.
```

## 数据存储

- **单词本数据**: 存储在 `wx.Storage` 中，key 为 `wordBooks`
- **学习记录**: 存储在 `wx.Storage` 中，key 为 `studyRecords`
- **最近单词**: 存储在 `wx.Storage` 中，key 为 `recentWords`

## 错误处理

所有服务统一返回格式：
```javascript
// 成功
{ error: null, data: {...} }

// 失败
{ error: '错误信息', data: null }
```

**常见错误**:
- `查询失败，请检查网络` - 网络请求失败
- `未找到该单词` - 词典无此单词
- `数据解析失败` - API 返回格式异常

## 注意事项

1. **词典 API 限制**: 有道词典公开接口，无明确调用限制，建议添加延迟避免被封
2. **音频服务**: 必须用户交互后才能播放 (微信小程序限制)
3. **存储同步**: 所有 Storage 操作使用同步方法 (`setStorageSync`)
4. **单例模式**: 所有服务导出单例实例，不要重复 `new`

## 扩展新服务

```javascript
const StorageService = require('../utils/storage')

class NewService {
  async fetchData(param) {
    try {
      const res = await wx.request({ ... })
      return { error: null, data: res.data }
    } catch (err) {
      console.error('NewService error:', err)
      return { error: '请求失败', data: null }
    }
  }
}

module.exports = new NewService()
```
