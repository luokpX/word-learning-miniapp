class StudyRecord {
  constructor(data) {
    this.id = data.id || this.generateId()
    this.wordId = data.wordId
    this.studyMode = data.studyMode
    this.result = data.result
    this.score = data.score || 0
    this.duration = data.duration || 0
    this.createdAt = data.createdAt || Date.now()
  }

  generateId() {
    return 'record_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  toJSON() {
    return {
      id: this.id,
      wordId: this.wordId,
      studyMode: this.studyMode,
      result: this.result,
      score: this.score,
      duration: this.duration,
      createdAt: this.createdAt
    }
  }

  static fromJSON(json) {
    return new StudyRecord(json)
  }
}

module.exports = StudyRecord
