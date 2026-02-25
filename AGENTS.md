# AGENTS.md - 单词学习微信小程序

本项目是一个微信小程序，用于单词学习功能。

## 项目结构

```
word-learning-miniapp/
├── app.js                 # 小程序入口文件
├── app.json               # 小程序全局配置
├── app.wxss               # 全局样式
├── pages/                 # 页面目录
│   ├── index/             # 首页
│   ├── wordbook/          # 单词本页面
│   ├── study/             # 学习页面
│   └── profile/           # 个人中心
├── components/            # 公共组件
├── utils/                 # 工具函数
├── services/              # API 服务层
├── models/                # 数据模型
└── assets/                # 静态资源
```

## 开发命令

### 构建
```bash
# 微信小程序无需构建命令，直接在微信开发者工具中编译
# 如使用 TypeScript，需编译：
npm run build        # 编译 TS 到 JS
npm run build:watch  # 监听模式编译
```

### 代码检查
```bash
npm run lint         # 运行 ESLint 检查
npm run lint:fix     # 自动修复 ESLint 问题
```

### 测试
```bash
npm test             # 运行所有测试
npm test -- path/to/test.spec.js   # 运行单个测试文件
npm run test:coverage              # 运行测试并生成覆盖率报告
```

### 安装依赖
```bash
npm install          # 安装项目依赖
```

## 代码风格指南

### 文件命名
- 页面文件夹使用 kebab-case：`word-book/`、`daily-study/`
- 组件使用 kebab-case：`word-card/`、`progress-bar/`
- JS/TS 文件使用 camelCase：`wordService.js`、`studyHelper.js`
- 样式文件与页面/组件同名：`index.wxss`

### 导入规范
```javascript
// 1. 标准库/第三方模块
import { promisify } from 'util'

// 2. 项目内部模块（使用相对路径或别名）
import { wordApi } from '../../services/word'
import { formatDate } from '../../utils/date'

// 3. 类型导入（TypeScript）
import type { Word, StudyRecord } from '../../models/types'
```

### 代码格式化
- 缩进：2 空格
- 字符串：优先使用单引号
- 分号：不强制使用分号
- 最大行宽：100 字符
- 大括号：同一行开启

```javascript
// 推荐
function getWordDetail(wordId) {
  const word = await wordApi.getWord(wordId)
  return {
    ...word,
    studyCount: word.studyCount + 1
  }
}
```

### TypeScript 类型规范
```typescript
// 接口定义使用 interface
interface Word {
  id: string
  text: string
  phonetic: string
  meaning: string
  examples: string[]
}

// 类型别名用于联合类型或工具类型
type StudyStatus = 'new' | 'learning' | 'mastered'
type PartialWord = Partial<Word>

// 函数参数和返回值必须标注类型
function createWord(data: Omit<Word, 'id'>): Word {
  // ...
}
```

### 命名规范
- 变量/函数：camelCase - `wordList`、`fetchWords`
- 常量：UPPER_SNAKE_CASE - `MAX_DAILY_WORDS`、`API_BASE_URL`
- 类/构造函数：PascalCase - `WordService`、`StudyManager`
- 私有属性：下划线前缀 - `_cache`、`_initData`
- 页面/组件方法：按生命周期顺序排列

```javascript
Page({
  data: {
    words: [],
    currentIndex: 0
  },

  // 生命周期方法在前
  onLoad(options) {},

  onShow() {},

  // 事件处理方法
  handleWordTap(e) {},

  handleNext() {},

  // 私有方法
  _loadWords() {},

  _updateProgress() {}
})
```

### 错误处理
```javascript
// 使用 try-catch 处理异步错误
async function fetchWordList() {
  try {
    const res = await wordApi.getList()
    return res.data
  } catch (error) {
    console.error('获取单词列表失败:', error)
    wx.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
    return []
  }
}

// 工具函数返回错误对象
function parseWordData(raw) {
  if (!raw || typeof raw !== 'string') {
    return { error: 'Invalid input', data: null }
  }
  return { error: null, data: parsedData }
}
```

### 组件规范
```javascript
Component({
  options: {
    multipleSlots: true,
    styleIsolation: 'apply-shared'
  },

  properties: {
    word: {
      type: Object,
      value: {}
    },
    showPhonetic: {
      type: Boolean,
      value: true
    }
  },

  data: {
    isFlipped: false
  },

  methods: {
    handleTap() {
      this.triggerEvent('flip', { flipped: !this.data.isFlipped })
    }
  }
})
```

### API 请求规范
```javascript
// services/request.js - 封装请求方法
const BASE_URL = 'https://api.example.com'

export async function request(options) {
  const { url, method = 'GET', data } = options

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(res.data.message || '请求失败'))
        }
      },
      fail: reject
    })
  })
}
```

### 注释规范
```javascript
/**
 * 获取用户学习统计
 * @param {string} userId - 用户ID
 * @param {Date} date - 统计日期
 * @returns {Promise<StudyStats>} 学习统计对象
 */
async function getUserStudyStats(userId, date) {
  // 实现...
}
```

## 注意事项

1. 微信小程序 API 使用 `wx.` 前缀，如 `wx.request`、`wx.navigateTo`
2. 页面跳转使用 `wx.navigateTo`，tab 切换使用 `wx.switchTab`
3. 数据更新必须使用 `this.setData()`，不要直接修改 `this.data`
4. 图片资源放 `assets/` 目录，大图考虑使用 CDN
5. 敏感信息不要提交到仓库，使用 `wx.getStorageSync` 管理本地数据
