/**
 * Dictionary Service - Free Dictionary API
 */
const BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en'

class DictionaryService {
  async lookup(word) {
    if (!word || !word.trim()) {
      return { error: '单词不能为空', data: null }
    }

    const trimmedWord = word.trim().toLowerCase()

    try {
      const res = await this.request(trimmedWord)
      if (res.error) {
        return res
      }
      return this.parseWordData(res.data)
    } catch (err) {
      console.error('查询单词失败:', err)
      return { error: '查询失败，请检查网络', data: null }
    }
  }

  request(word) {
    return new Promise((resolve) => {
      wx.request({
        url: `${BASE_URL}/${encodeURIComponent(word)}`,
        method: 'GET',
        timeout: 10000,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve({ error: null, data: res.data })
          } else if (res.statusCode === 404) {
            resolve({ error: '未找到该单词', data: null })
          } else {
            resolve({ error: `请求失败(${res.statusCode})`, data: null })
          }
        },
        fail: () => {
          resolve({ error: '网络请求失败', data: null })
        }
      })
    })
  }

  parseWordData(data) {
    if (!data || !data[0]) {
      return { error: '数据解析失败', data: null }
    }

    const entry = data[0]
    const word = entry.word || ''
    let phonetic = ''
    if (entry.phonetics && entry.phonetics.length > 0) {
      const phoneticWithText = entry.phonetics.find(p => p.text && p.text.trim())
      phonetic = phoneticWithText ? phoneticWithText.text : (entry.phonetics[0].text || '')
    }

    let meaning = ''
    const examples = []

    if (entry.meanings && entry.meanings.length > 0) {
      let foundChinese = false
      for (const meaningItem of entry.meanings) {
        if (meaningItem.partOfSpeech && !foundChinese) {
          const definitions = meaningItem.definitions || []
          for (const def of definitions) {
            if (def.definition) {
              const hasChinese = /[\u4e00-\u9fa5]/.test(def.definition)
              if (hasChinese) {
                meaning = `${meaningItem.partOfSpeech}. ${def.definition}`
                foundChinese = true
                if (def.example) examples.push(def.example)
                break
              }
            }
          }
        }
        if (foundChinese) break
      }

      if (!meaning) {
        const firstMeaning = entry.meanings[0]
        if (firstMeaning.definitions && firstMeaning.definitions[0]) {
          meaning = `${firstMeaning.partOfSpeech}. ${firstMeaning.definitions[0].definition}`
          if (firstMeaning.definitions[0].example) {
            examples.push(firstMeaning.definitions[0].example)
          }
        }
      }

      if (examples.length < 3) {
        for (const meaningItem of entry.meanings) {
          if (meaningItem.definitions) {
            for (const def of meaningItem.definitions) {
              if (def.example && !examples.includes(def.example)) {
                examples.push(def.example)
                if (examples.length >= 3) break
              }
            }
          }
          if (examples.length >= 3) break
        }
      }
    }

    let audioUrl = ''
    if (entry.phonetics) {
      const audioPhonetic = entry.phonetics.find(p => p.audio && p.audio.length > 0)
      if (audioPhonetic) audioUrl = audioPhonetic.audio
    }

    const result = {
      text: word,
      phonetic: phonetic,
      meaning: meaning,
      examples: examples.slice(0, 3),
      audioUrl: audioUrl
    }

    return { error: null, data: result }
  }

  async batchLookup(words, onProgress) {
    const results = []
    const uniqueWords = [...new Set(words.map(w => w.trim().toLowerCase()).filter(w => w))]

    for (let i = 0; i < uniqueWords.length; i++) {
      const word = uniqueWords[i]
      const result = await this.lookup(word)
      
      results.push({ word: word, ...result })

      if (onProgress) {
        onProgress(i + 1, uniqueWords.length, word, result)
      }

      if (i < uniqueWords.length - 1) {
        await this.delay(300)
      }
    }

    return results
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = new DictionaryService()
