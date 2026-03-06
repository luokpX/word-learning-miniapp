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
