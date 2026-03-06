# 单词图片功能设计文档

**创建日期**: 2026-03-06  
**状态**: 待实现  
**作者**: Sisyphus

---

## 1. 需求概述

在单词学习小程序中增加图片功能，提升小学生的学习体验：

1. **自动录入时**：后台异步获取与单词匹配的图片
2. **学习页面**：展示单词图片，帮助理解记忆
3. **练习页面**：展示图片作为视觉提示

---

## 2. 技术方案

### 2.1 图片来源

**选择**: Unsplash API

**理由**:
- 免费、高质量摄影图片
- API 简单，只需 Client-ID
- 已有微信小程序集成案例（WeUnsplash）
- 国内访问稳定

**API 配置**:
```javascript
// app.js
globalData: {
  unsplashApiKey: 'Iig_zrzRIDqCUH8qvw4e8p5tDC_mttzUw_vx0WvOn2I',
  unsplashMaxWidth: 400
}
```

**API 端点**:
```
GET https://api.unsplash.com/search/photos
参数:
  - query: 单词（英文）
  - client_id: API Key
  - per_page: 1
```

**返回图片 URL**:
```javascript
res.data.results[0].urls.regular  // 400px 宽
```

### 2.2 异步图片获取流程

```
用户导入单词
    ↓
查询词典（阻塞，获取释义/音标/例句）
    ↓
存入单词本（imageUrl = ""）
    ↓
导入完成，用户可立即使用
    ↓
后台异步任务（setTimeout）
    ↓
遍历新单词 → 调用 Unsplash API → 下载图片 → 保存到本地
    ↓
更新单词 imageUrl
```

**关键设计决策**:
- 图片获取不阻塞导入流程
- 用户导入后可立即学习，图片稍后出现
- 失败不重试（保持为空），避免无限等待

### 2.3 超时策略

| 阶段 | 超时 | 重试 |
|------|------|------|
| 搜索图片 | 10 秒 | 失败后重试 1 次 |
| 下载图片 | 10 秒 | 不重试 |

**总耗时**:
- 成功：10-15 秒/词
- 失败：约 20 秒/词（重试后放弃）

### 2.4 存储策略

**永久存储**：
- 不实现清理逻辑
- 小学生单词量约 1000-2000 词
- 预估占用：1000 词 × 100KB ≈ 100MB

**存储方式**:
- 使用 `wx.saveFile` 保存到本地
- 路径：`wxfile://xxx.jpg`
- 路径存入 `word.imageUrl`

---

## 3. 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `app.js` | 修改 | 添加 Unsplash API Key 配置 |
| `services/image.js` | 新建 | 图片搜索和下载服务 |
| `services/wordBook.js` | 修改 | 添加后台异步获取图片方法 |
| `pages/study/study.wxml` | 修改 | 卡片正面添加图片展示 |
| `pages/study/study.wxss` | 修改 | 添加图片样式 |
| `pages/choice/choice.wxml` | 修改 | 添加图片提示 |
| `pages/choice/choice.wxss` | 修改 | 添加图片样式 |
| `pages/spelling/spelling.wxml` | 修改 | 添加图片提示 |
| `pages/spelling/spelling.wxss` | 修改 | 添加图片样式 |

---

## 4. 关键实现

### 4.1 ImageService

```javascript
// services/image.js
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
        fail: () => resolve(null)
      })
    })
  }

  /**
   * 下载图片到本地
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
              fail: () => resolve(null)
            })
          } else {
            resolve(null)
          }
        },
        fail: () => resolve(null)
      })
    })
  }
}

module.exports = new ImageService()
```

### 4.2 WordBookService 异步获取

```javascript
// services/wordBook.js - 新增方法

/**
 * 后台异步获取单词图片
 * @param {Array} words - 单词数组 [{id, text, ...}]
 */
async fetchImagesInBackground(words) {
  // 放入下一个事件循环，不阻塞 UI
  setTimeout(async () => {
    for (const word of words) {
      try {
        const imageUrl = await ImageService.searchAndDownload(word.text)
        if (imageUrl) {
          this.updateWordImageUrl(word.id, imageUrl)
        }
      } catch (error) {
        console.error(`Failed to fetch image for ${word.text}:`, error)
      }
    }
  }, 100)
}

/**
 * 更新单词的 imageUrl
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
```

### 4.3 页面展示

**学习页面 (study.wxml)**:
```xml
<view class="card-front">
  <!-- 图片区域 -->
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
  <!-- ... 其他内容 ... -->
</view>
```

**学习页面样式 (study.wxss)**:
```css
.word-image {
  width: 100%;
  height: 200rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  background-color: #f5f5f5;
}
```

**练习页面 (choice.wxml / spelling.wxml)**:
```xml
<view class="word-card">
  <!-- 图片提示 -->
  <image 
    class="hint-image" 
    src="{{currentWord.imageUrl}}" 
    mode="aspectFill"
    wx:if="{{currentWord.imageUrl}}"
  />
  
  <view class="word-text">{{currentWord.text}}</view>
  <!-- ... 其他内容 ... -->
</view>
```

**练习页面样式**:
```css
.hint-image {
  width: 100%;
  height: 150rpx;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
  background-color: #f5f5f5;
}
```

---

## 5. 测试计划

### 5.1 功能测试

| 测试用例 | 输入 | 预期输出 | 验证方法 |
|----------|------|----------|----------|
| 导入常见单词（有图） | apple, book, cat | 导入成功，稍后图片出现 | 进入单词本查看 |
| 导入抽象单词（无图） | love, freedom | 导入成功，imageUrl 为空 | 进入学习页面验证无图片区域 |
| 学习页面展示图片 | 有 imageUrl 的单词 | 图片正常显示 | 视觉检查 |
| 练习页面展示图片 | 有 imageUrl 的单词 | 图片作为提示显示 | 视觉检查 |
| 网络超时处理 | 断网状态导入 | 导入成功，无图片 | 检查 imageUrl 为空 |

### 5.2 性能测试

| 测试用例 | 指标 | 预期值 |
|----------|------|--------|
| 导入 10 个单词 | 总耗时 | < 5 秒（不含图片） |
| 图片获取速度 | 单张图片 | 10-20 秒（后台） |
| 页面图片加载 | 加载时间 | < 500ms（本地） |
| 50 个单词存储 | 占用空间 | < 10MB |

---

## 6. 降级处理

| 场景 | 行为 |
|------|------|
| Unsplash API 失败 | imageUrl 保持空字符串 |
| 图片下载超时 | imageUrl 保持空字符串 |
| 本地存储失败 | imageUrl 保持空字符串 |
| 旧单词无图片 | 正常显示，不渲染图片区域 |

**原则**: 图片是增强功能，不影响核心学习流程。

---

## 7. 注意事项

### 7.1 API Key 安全

当前 API Key 直接写入 `app.js`，存在以下风险：
- Key 可能被他人滥用
- 无法设置 Referer 限制（小程序特性）

**缓解措施**:
- 监控 Unsplash 后台使用量
- 发现异常时重新生成 Key

**长期方案**（可选）:
- 迁移到微信云开发环境变量
- 或使用后端代理请求

### 7.2 微信域名配置

需在微信公众平台配置以下域名：
- `https://api.unsplash.com`（request 合法域名）
- `https://images.unsplash.com`（downloadFile 合法域名）
- `https://cdn.pixabay.com`（备用）

### 7.3 图片版权

Unsplash 图片可自由使用，无需署名，但建议：
- 在"关于"页面提及图片来源
- 不用于商业用途

---

## 8. 后续扩展

1. **图片缓存优化**: 使用 CDN 缓存常用单词图片
2. **手动更换图片**: 允许用户为单词更换更匹配的图片
3. **图片分类**: 为图片打标签（动物/水果/学习用品等）
4. **离线包**: 预置常用单词的图片包

---

## 9. 验收标准

- [ ] 自动录入后，常见单词（apple, cat, dog 等）有图片
- [ ] 学习页面正确展示图片
- [ ] 拼写练习正确展示图片作为提示
- [ ] 英汉选择正确展示图片作为提示
- [ ] 无图片的单词正常显示（无图片区域）
- [ ] 导入流程不阻塞（图片后台获取）
- [ ] 网络超时/失败时正常降级
