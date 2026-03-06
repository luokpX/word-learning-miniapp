# 单词图片功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在单词学习小程序中实现图片功能，自动录入时异步获取 Unsplash 图片，在学习和练习页面展示。

**Architecture:** 新增 ImageService 处理图片搜索和下载，修改 WordBookService 在导入完成后异步获取图片，修改学习/练习页面添加图片展示。图片永久存储在本地，不阻塞导入流程。

**Tech Stack:** 微信小程序原生开发 (WXML/WXSS/JavaScript), Unsplash API, wx.downloadFile, wx.saveFile

---

## 前置准备

### 任务 0：配置 Unsplash API Key

**文件:**
- 修改：`app.js:1-30`

**步骤 1：在 app.js 的 globalData 中添加 Unsplash 配置**

```javascript
// app.js
App({
  globalData: {
    // ... 现有配置 ...
    
    // Unsplash API 配置
    unsplashApiKey: 'Iig_zrzRIDqCUH8qvw4e8p5tDC_mttzUw_vx0WvOn2I',
    unsplashMaxWidth: 400
  }
})
```

**步骤 2：验证配置**

在微信开发者工具控制台运行：
```javascript
getApp().globalData.unsplashApiKey
```
预期输出：`Iig_zrzRIDqCUH8qvw4e8p5tDC_mttzUw_vx0WvOn2I`

**步骤 3：提交**

```bash
git add app.js
git commit -m "config: Add Unsplash API key configuration"
```

---

## 第一阶段：核心服务

### 任务 1：创建 ImageService

**文件:**
- 创建：`services/image.js`

**步骤 1：创建基础服务结构**

```javascript
/**
 * 图片服务 - Unsplash API 集成
 * 功能：搜索图片、下载到本地、返回本地路径
 */
const app = getApp()

class ImageService {
  /**
   * 搜索并下载图片
   * @param {string} keyword - 搜索关键词（英文单词）
   * @returns {Promise<string|null>} 本地文件路径，失败返回 null
   */
  async searchAndDownload(keyword) {
    const imageUrl = await this.searchImage(keyword)
    if (!imageUrl) return null
    
    const localPath = await this.downloadImage(imageUrl)
    return localPath
  }

  /**
   * 搜索图片
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<string|null>} 图片 URL，失败返回 null
   */
  async searchImage(keyword) {
    return new Promise((resolve) => {
      wx.request({
        url: 'https://api.unsplash.com/search/photos',
        data: {
          query: keyword,
          client_id: app.globalData.unsplashApiKey,
          per_page: 1
        },
        timeout: 10000,
        success: (res) => {
          if (res.data.results && res.data.results.length > 0) {
            resolve(res.data.results[0].urls.regular)
          } else {
            resolve(null)
          }
        },
        fail: () => {
          console.error('Search image failed:', keyword)
          resolve(null)
        }
      })
    })
  }

  /**
   * 下载图片到本地
   * @param {string} url - 图片 URL
   * @returns {Promise<string|null>} 本地文件路径，失败返回 null
   */
  async downloadImage(url) {
    return new Promise((resolve) => {
      wx.downloadFile({
        url,
        timeout: 10000,
        success: (res) => {
          if (res.statusCode === 200) {
            wx.saveFile({
              tempFilePath: res.tempFilePath,
              success: (saveRes) => {
                resolve(saveRes.savedFilePath)
              },
              fail: (err) => {
                console.error('Save file failed:', err)
                resolve(null)
              }
            })
          } else {
            console.error('Download failed, status:', res.statusCode)
            resolve(null)
          }
        },
        fail: (err) => {
          console.error('Download file failed:', err)
          resolve(null)
        }
      })
    })
  }
}

module.exports = new ImageService()
```

**步骤 2：验证服务可加载**

在微信开发者工具控制台运行：
```javascript
const ImageService = require('./services/image.js')
console.log('ImageService loaded:', ImageService)
```
预期输出：显示 ImageService 对象

**步骤 3：提交**

```bash
git add services/image.js
git commit -m "feat: Create ImageService for Unsplash integration"
```

---

### 任务 2：修改 WordBookService 添加异步图片获取

**文件:**
- 修改：`services/wordBook.js`

**步骤 1：导入 ImageService**

```javascript
// services/wordBook.js 顶部
const WordBook = require('../models/wordBook')
const StorageService = require('../utils/storage')
const DictionaryService = require('./dictionary')
const ImageService = require('./image')  // 新增
```

**步骤 2：添加 fetchImagesInBackground 方法**

在 `importWordsAuto` 方法后面添加：

```javascript
/**
 * 后台异步获取单词图片
 * @param {Array} words - 单词数组 [{id, text, ...}]
 */
async fetchImagesInBackground(words) {
  // 放入下一个事件循环，不阻塞 UI
  setTimeout(async () => {
    console.log(`[ImageService] Starting background image fetch for ${words.length} words`)
    
    for (const word of words) {
      try {
        console.log(`[ImageService] Fetching image for: ${word.text}`)
        const imageUrl = await ImageService.searchAndDownload(word.text)
        
        if (imageUrl) {
          console.log(`[ImageService] Success: ${word.text}`)
          this.updateWordImageUrl(word.id, imageUrl)
        } else {
          console.log(`[ImageService] No image found for: ${word.text}`)
        }
      } catch (error) {
        console.error(`[ImageService] Failed to fetch image for ${word.text}:`, error)
      }
      
      // 每个单词之间延迟 100ms，避免请求过快
      await this.delay(100)
    }
    
    console.log('[ImageService] Background image fetch completed')
  }, 100)
}

/**
 * 更新单词的 imageUrl
 * @param {string} wordId - 单词 ID
 * @param {string} imageUrl - 本地图片路径
 */
updateWordImageUrl(wordId, imageUrl) {
  const books = this.getAllWordBooks()
  books.forEach(book => {
    const wordIndex = book.words.findIndex(w => w.id === wordId)
    if (wordIndex !== -1) {
      book.words[wordIndex].imageUrl = imageUrl
      book.updatedAt = Date.now()
    }
  })
  this.saveBooks(books)
}

/**
 * 延迟函数
 * @param {number} ms - 毫秒数
 */
delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

**步骤 3：修改 importWordsAuto 方法调用异步获取**

在 `importWordsAuto` 方法的 return 之前添加：

```javascript
// ... 现有代码 ...

// 后台异步获取图片
this.fetchImagesInBackground(addedWords)

return { addedWords, failedWords }
```

**完整方法应该是：**
```javascript
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
      // imageUrl 默认为空，后台异步获取
      result.data.imageUrl = ''
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

  // 后台异步获取图片
  this.fetchImagesInBackground(addedWords)

  return { addedWords, failedWords }
}
```

**步骤 4：验证**

在单词本详情页面，使用自动补全功能导入几个常见单词（如：apple, cat, dog）。

打开控制台查看日志：
```
[ImageService] Starting background image fetch for 3 words
[ImageService] Fetching image for: apple
[ImageService] Success: apple
[ImageService] Fetching image for: cat
...
```

**步骤 5：提交**

```bash
git add services/wordBook.js
git commit -m "feat: Add background image fetch for auto-import"
```

---

## 第二阶段：学习页面

### 任务 3：修改学习页面 WXML 添加图片展示

**文件:**
- 修改：`pages/study/study.wxml`

**步骤 1：找到卡片正面区域**

定位到第 39-66 行的 `.card-front` 区域

**步骤 2：在 word-main 上方添加图片元素**

```xml
<view class="card-front">
  <!-- 新增：单词图片 -->
  <image 
    class="word-image" 
    src="{{currentWord.imageUrl}}" 
    mode="aspectFill"
    wx:if="{{currentWord.imageUrl}}"
  />
  
  <view class="word-main">
    <text class="word-text">{{currentWord.text}}</text>
    <text class="word-phonetic">{{currentWord.phonetic}}</text>
  </view>
  <!-- ... 后面的音频控制等保持不变 ... -->
</view>
```

**步骤 3：验证 WXML 语法**

在微信开发者工具中编译，检查无报错。

**步骤 4：提交**

```bash
git add pages/study/study.wxml
git commit -m "feat: Add image display to study page card"
```

---

### 任务 4：添加学习页面图片样式

**文件:**
- 修改：`pages/study/study.wxss`

**步骤 1：在文件末尾添加图片样式**

```css
/* 单词图片样式 */
.word-image {
  width: 100%;
  height: 200rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  background-color: #f5f5f5;
  object-fit: cover;
}
```

**步骤 2：验证样式**

在微信开发者工具中预览，有图片的单词应显示图片区域。

**步骤 3：提交**

```bash
git add pages/study/study.wxss
git commit -m "style: Add word image styles for study page"
```

---

## 第三阶段：练习页面

### 任务 5：修改拼写练习页面 WXML

**文件:**
- 修改：`pages/spelling/spelling.wxml`

**步骤 1：找到 word-card 区域**

定位到第 9 行左右的 `<view class="word-card">`

**步骤 2：在 word-meaning 上方添加图片元素**

```xml
<view class="word-card" wx:if="{{!sessionComplete}}">
  <!-- 新增：图片提示 -->
  <image 
    class="hint-image" 
    src="{{currentWord.imageUrl}}" 
    mode="aspectFill"
    wx:if="{{currentWord.imageUrl}}"
  />
  
  <view class="word-meaning">{{currentWord.meaning}}</view>
  <!-- ... 后面的内容保持不变 ... -->
</view>
```

**步骤 3：验证 WXML 语法**

在微信开发者工具中编译，检查无报错。

**步骤 4：提交**

```bash
git add pages/spelling/spelling.wxml
git commit -m "feat: Add image hint to spelling practice page"
```

---

### 任务 6：添加拼写练习页面图片样式

**文件:**
- 修改：`pages/spelling/spelling.wxss`

**步骤 1：在文件末尾添加图片样式**

```css
/* 图片提示样式 */
.hint-image {
  width: 100%;
  height: 150rpx;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
  background-color: #f5f5f5;
  object-fit: cover;
}
```

**步骤 2：验证样式**

在微信开发者工具中预览，拼写练习应显示图片作为提示。

**步骤 3：提交**

```bash
git add pages/spelling/spelling.wxss
git commit -m "style: Add hint image styles for spelling page"
```

---

### 任务 7：修改英汉选择练习页面 WXML

**文件:**
- 修改：`pages/choice/choice.wxml`

**步骤 1：找到 word-card 区域**

定位到第 9 行左右的 `<view class="word-card">`

**步骤 2：在 word-text 上方添加图片元素**

```xml
<view class="word-card" wx:if="{{!sessionComplete}}">
  <!-- 新增：图片提示 -->
  <image 
    class="hint-image" 
    src="{{currentWord.imageUrl}}" 
    mode="aspectFill"
    wx:if="{{currentWord.imageUrl}}"
  />
  
  <view class="word-text">{{currentWord.text}}</view>
  <view class="word-phonetic-row" wx:if="{{currentWord.phonetic || currentWord.audioUrl}}">
    <!-- ... 保持不变 ... -->
  </view>
  <!-- ... 后面的选项列表保持不变 ... -->
</view>
```

**步骤 3：验证 WXML 语法**

在微信开发者工具中编译，检查无报错。

**步骤 4：提交**

```bash
git add pages/choice/choice.wxml
git commit -m "feat: Add image hint to choice practice page"
```

---

### 任务 8：添加英汉选择练习页面图片样式

**文件:**
- 修改：`pages/choice/choice.wxss`

**步骤 1：在文件末尾添加图片样式**

```css
/* 图片提示样式 */
.hint-image {
  width: 100%;
  height: 150rpx;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
  background-color: #f5f5f5;
  object-fit: cover;
}
```

**步骤 2：验证样式**

在微信开发者工具中预览，英汉选择练习应显示图片作为提示。

**步骤 3：提交**

```bash
git add pages/choice/choice.wxss
git commit -m "style: Add hint image styles for choice page"
```

---

## 第四阶段：测试验证

### 任务 9：功能测试 - 自动录入

**文件:**
- 测试：手动测试

**步骤 1：准备测试单词**

准备以下测试单词列表（每行一个）：
```
apple
cat
dog
tree
book
```

**步骤 2：执行自动录入**

1. 打开单词本详情页面
2. 点击"导入单词"
3. 切换到"自动补全"模式
4. 粘贴测试单词列表
5. 点击"导入"

**步骤 3：验证导入流程**

预期：
- 导入过程 < 5 秒完成（不含图片）
- 控制台显示 `[ImageService] Starting background image fetch for 5 words`
- 每个单词依次显示 fetching/success/no image

**步骤 4：等待图片获取完成**

等待约 30-60 秒，观察控制台日志显示所有图片获取完成。

---

### 任务 10：功能测试 - 学习页面

**文件:**
- 测试：手动测试

**步骤 1：进入学习页面**

1. 返回首页
2. 点击"快速学习"或"单词本学习"
3. 选择包含测试单词的单词本

**步骤 2：验证图片展示**

预期：
- apple: 显示苹果图片
- cat: 显示猫图片
- dog: 显示狗图片
- tree: 显示树图片
- book: 显示书本图片

**步骤 3：验证无图片降级**

如果某个单词无图片：
- 卡片正常显示
- 不显示图片区域
- 文字内容正常

---

### 任务 11：功能测试 - 练习页面

**文件:**
- 测试：手动测试

**步骤 1：测试拼写练习**

1. 进入"练习"页面
2. 选择"汉英练习"（拼写）
3. 选择测试单词

预期：
- 显示中文释义
- 上方显示对应图片作为提示
- 拼写正确/错误提示正常

**步骤 2：测试英汉选择**

1. 进入"练习"页面
2. 选择"英汉选择"
3. 选择测试单词

预期：
- 显示英文单词
- 上方显示对应图片作为提示
- 选项和判分正常

---

### 任务 12：边界测试

**文件:**
- 测试：手动测试

**步骤 1：测试抽象单词**

导入抽象单词：
```
love
freedom
idea
beautiful
```

预期：
- 导入成功
- imageUrl 保持为空
- 页面正常显示（无图片区域）

**步骤 2：测试网络超时**

1. 关闭网络
2. 执行自动录入

预期：
- 导入流程正常完成
- 控制台显示图片获取失败
- 所有单词 imageUrl 为空

**步骤 3：测试重复导入**

再次导入相同单词：

预期：
- 新单词正常获取图片
- 旧单词图片保留

---

### 任务 13：性能测试

**文件:**
- 测试：手动测试

**步骤 1：测试导入速度**

导入 20 个单词，记录时间：

预期：
- 导入完成时间 < 10 秒（不含图片）
- 图片后台获取持续进行

**步骤 2：测试图片加载速度**

进入学习页面，切换单词：

预期：
- 图片加载时间 < 500ms（本地加载）
- 无卡顿

**步骤 3：检查存储空间**

在微信开发者工具 → Storage 中查看：

预期：
- 图片文件存储在 wxfile://
- 20 个单词占用 < 5MB

---

### 任务 14：最终验证和提交

**文件:**
- 全部修改文件

**步骤 1：检查所有修改**

```bash
git status
```

预期输出应包含：
- app.js
- services/image.js
- services/wordBook.js
- pages/study/study.wxml
- pages/study/study.wxss
- pages/spelling/spelling.wxml
- pages/spelling/spelling.wxss
- pages/choice/choice.wxml
- pages/choice/choice.wxss

**步骤 2：运行 LSP 诊断**

在微信开发者工具中检查所有修改文件无错误。

**步骤 3：最终提交**

```bash
git add .
git commit -m "feat: Complete word image feature with async fetch and display"
```

---

## 验收标准

完成所有任务后，验证以下标准：

- [ ] 自动录入后，常见单词（apple, cat, dog）有图片
- [ ] 抽象单词（love, freedom）正常导入，无图片
- [ ] 学习页面正确展示图片（200rpx 高）
- [ ] 拼写练习正确展示图片（150rpx 高）
- [ ] 英汉选择正确展示图片（150rpx 高）
- [ ] 无图片的单词正常显示（不渲染图片区域）
- [ ] 导入流程不阻塞（图片后台获取）
- [ ] 网络超时/失败时正常降级
- [ ] 所有代码无 lint 错误
- [ ] git 提交历史清晰

---

## 回滚计划

如果功能出现问题，回滚步骤：

```bash
# 回滚到最后一次正常提交
git log --oneline  # 找到问题提交前的 commit hash
git revert <commit-hash>  # 或 git reset --hard <commit-hash>
```

关键回滚点：
1. 如果图片服务导致崩溃：回滚 `services/image.js` 和相关调用
2. 如果页面样式问题：回滚 wxss 修改
3. 如果 API Key 问题：回滚 `app.js` 配置

---

## 后续优化建议

功能完成后，可考虑：

1. **图片加载指示器**：后台获取时显示"获取图片中..."
2. **手动更换图片**：允许用户为单词更换图片
3. **图片缓存统计**：显示图片占用空间，提供清理选项
4. **批量预加载**：学习前预加载所有单词图片
