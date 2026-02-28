/**
 * Dictionary Service - 有道词典公开接口
 * 接口：https://dict.youdao.com/jsonapi?jsonversion=2&client=mobile&q=单词
 * 特点：完全免费、无需密钥、直接 GET、自带中文释义
 */
const BASE_URL = 'https://dict.youdao.com/jsonapi'

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
      return this.parseWordData(res.data, trimmedWord)
    } catch (err) {
      console.error('查询单词失败:', err)
      return { error: '查询失败，请检查网络', data: null }
    }
  }

  request(word) {
    return new Promise((resolve) => {
      wx.request({
        url: `${BASE_URL}?jsonversion=2&client=mobile&q=${encodeURIComponent(word)}`,
        method: 'GET',
        timeout: 10000,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve({ error: null, data: res.data })
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

  parseWordData(data, word) {
    if (!data) {
      return { error: '数据解析失败', data: null }
    }

    // 优先使用 ec（英文翻译）数据
    const ec = data.ec
    const fanyi = data.fanyi

    let phonetic = ''
    let meaning = ''
    const examples = []

    // 解析 ec 数据（有道词典英文翻译）
    if (ec && ec.word) {
      const wordData = ec.word[0]
      
      // 获取音标
      if (wordData.usphone) {
        phonetic = '/' + wordData.usphone + '/'
      } else if (wordData.ukphone) {
        phonetic = '/' + wordData.ukphone + '/'
      }

      // 获取中文释义 - 取第一个
      if (wordData.trs && wordData.trs.length > 0) {
        for (const trGroup of wordData.trs) {
          if (trGroup.tr && trGroup.tr.length > 0) {
            const firstTrItem = trGroup.tr[0]
            if (firstTrItem.l && firstTrItem.l.i) {
              const i = firstTrItem.l.i
              if (Array.isArray(i) && i.length > 0) {
                meaning = i[0].split(';')[0].split('，')[0].trim()
              } else if (typeof i === 'string') {
                meaning = i.split(';')[0].split('，')[0].trim()
              }
              break
            }
          }
          if (meaning) break
        }
      }

      // 获取例句 - 从 blng_sents_part 取（英文 + 中文）
      if (!examples.length) {
        const blng = data.blng_sents_part
        if (blng && blng['sentence-pair']) {
          const sentencePairs = blng['sentence-pair']
          for (let i = 0; i < Math.min(3, sentencePairs.length); i++) {
            const pair = sentencePairs[i]
            const eng = pair['sentence'] || pair['sentence-eng'] || ''
            const cn = pair['sentence-translation'] || ''
            if (eng && cn) {
              // 去掉英文中的 <b> 标签
              const cleanEng = eng.replace(/<[^>]+>/g, '')
              examples.push(cleanEng + '\n' + cn)
            }
          }
        }
      }
    }

    // 如果没有 ec 数据，尝试使用 fanyi（翻译）数据
    if (!meaning && fanyi && fanyi.translate) {
      const translate = fanyi.translate[0]
      if (translate && translate.tgt) {
        meaning = translate.tgt
      }
    }

    // 如果仍然没有释义，返回错误
    if (!meaning) {
      return { error: '未找到该单词', data: null }
    }

    const result = {
      text: word,
      phonetic: phonetic,
      meaning: meaning,
      examples: examples.slice(0, 3),
      audioUrl: ''  // 有道接口不提供音频，需另想办法
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
