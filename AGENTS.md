# AGENTS.md - 单词学习微信小程序

**项目类型**: 微信小程序 (WeChat Mini Program)  
**目标用户**: 小学生英语单词学习  
**技术栈**: 微信小程序原生开发 (WXML/WXSS/JavaScript)

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

**详细目录文档**:
- `services/AGENTS.md` - 服务层 API 集成规范

## 开发命令

微信小程序无需构建命令，直接在微信开发者工具中编译。

```bash
npm run build        #  echo (无实际构建)
npm run lint         #  echo (无 linter 配置)
npm test             #  echo (无测试配置)
npm install          # 安装依赖 (当前无依赖)
```

## 代码风格指南

### 文件命名
- 页面文件夹使用 kebab-case：`word-book/`、`daily-study/`
- 组件使用 kebab-case：`word-card/`、`progress-bar/`
- JS 文件使用 camelCase：`wordService.js`、`studyHelper.js`
- 样式文件与页面/组件同名：`index.wxss`

### 导入规范
```javascript
// 1. 标准库/第三方模块
import { promisify } from 'util'

// 2. 项目内部模块（使用相对路径）
import { wordApi } from '../../services/word'
import { formatDate } from '../../utils/date'
```

### 代码格式化
- 缩进：2 空格
- 字符串：优先使用单引号
- 分号：不强制
- 最大行宽：100 字符
- 大括号：同一行开启

### 命名规范
- 变量/函数：camelCase - `wordList`、`fetchWords`
- 常量：UPPER_SNAKE_CASE - `MAX_DAILY_WORDS`、`API_BASE_URL`
- 类/构造函数：PascalCase - `WordService`、`StudyManager`
- 私有属性：下划线前缀 - `_cache`、`_initData`

### Page 方法排列顺序
```javascript
Page({
  data: { ... },

  // 1. 生命周期方法
  onLoad(options) {},
  onShow() {},

  // 2. 事件处理方法
  handleWordTap(e) {},
  handleNext() {},

  // 3. 私有方法
  _loadWords() {},
  _updateProgress() {}
})
```

### 组件规范
```javascript
Component({
  options: {
    multipleSlots: true,
    styleIsolation: 'apply-shared'
  },

  properties: {
    word: { type: Object, value: {} }
  },

  data: { isFlipped: false },

  methods: {
    handleTap() {
      this.triggerEvent('flip', { flipped: !this.data.isFlipped })
    }
  }
})
```

### 错误处理
```javascript
// 异步错误使用 try-catch
async function fetchWordList() {
  try {
    const res = await wordApi.getList()
    return res.data
  } catch (error) {
    console.error('获取单词列表失败:', error)
    wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    return []
  }
}
```

## 注意事项

1. **微信小程序 API** 使用 `wx.` 前缀，如 `wx.request`、`wx.navigateTo`
2. **页面跳转**: `wx.navigateTo` (普通页面), `wx.switchTab` (tab 切换)
3. **数据更新**: 必须使用 `this.setData()`, 禁止直接修改 `this.data`
4. **图片资源**: 放 `assets/` 目录，大图考虑使用 CDN
5. **敏感信息**: 不要提交到仓库，使用 `wx.getStorageSync` 管理本地数据
6. **网络请求**: 需在微信公众平台配置 request 合法域名
7. **音频播放**: 使用 `wx.getBackgroundAudioManager()` 支持后台播放

## 服务层架构

| 服务 | 文件 | 功能 |
|------|------|------|
| `audio.js` | 音频服务 | 有道 TTS 发音播放 |
| `dictionary.js` | 词典服务 | 有道词典 API 查询 |
| `word.js` | 单词服务 | 单词数据管理 |
| `wordBook.js` | 单词本服务 | 单词本 CRUD 操作 |

## 数据模型

| 模型 | 文件 | 字段 |
|------|------|------|
| `Word` | `models/word.js` | id, text, phonetic, meaning, examples, audioUrl |
| `WordBook` | `models/wordBook.js` | id, name, description, words[], createdAt, updatedAt |
| `StudyRecord` | `models/studyRecord.js` | wordId, result, timestamp |

## 页面路由

| 页面 | 路径 | 功能 |
|------|------|------|
| 首页 | `pages/index/index` | 入口导航 |
| 单词本 | `pages/wordbook/wordbook` | 单词本列表 |
| 单词本详情 | `pages/wordbook-detail/wordbook-detail` | 编辑单词本 |
| 学习选择 | `pages/study-select/study-select` | 选择学习模式 |
| 学习 | `pages/study/study` | 单词卡片学习 |
| 练习 | `pages/practice/practice` | 练习选择 |
| 拼写 | `pages/spelling/spelling` | 汉英拼写练习 |
| 选择 | `pages/choice/choice` | 英汉选择练习 |
| 我的 | `pages/profile/profile` | 个人中心
