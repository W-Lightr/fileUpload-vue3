import sparkMD5 from 'spark-md5'
import { ref } from 'vue'

export const taskFileList = ref([])
// 操作taskFileList的
export const fileListUtils = {
  getTask: (filename: string) => {
    return taskFileList.value.find(taskItem => filename === taskItem.filename)
  },
  remove: (filename: string) => {
    for (let i = 0; i < taskFileList.value.length; i++) {
      if (filename === taskFileList.value[i].filename) {
        taskFileList.value[i].target.cancel()
        taskFileList.value.splice(i, 1)
        break
      }
    }
  },
  add: (taskItem) => {
    taskFileList.value.push(taskItem)
  },
  clear: () => {
    taskFileList.value = []
  },
  pause: (filename: string) => {
    // 找到要暂停上传的对象
    const taskItem = fileListUtils.getTask(filename)
    // 暂停和修改状态值
    taskItem.target.pause()
    taskItem.status = uploadUtils.fileStatus.PAUSE.code
    taskItem.statusText = uploadUtils.fileStatus.PAUSE.text
  },
  resume: (filename: string) => {
    // 找到文件恢复上传
    const taskItem = fileListUtils.getTask(filename)
    taskItem.target.resume()
    taskItem.status = uploadUtils.fileStatus.UPLOADING.code
    taskItem.statusText = uploadUtils.fileStatus.UPLOADING.text
  },
  cancel: (filename: string) => {
    // 取消上传文件
    for (let i = 0; i < taskFileList.value.length; i++) {
      if (filename === taskFileList.value[i].filename) {
        taskFileList.value[i].target.cancel()
        taskFileList.value.splice(i, 1)
        break
      }
    }
  },
  retry: (filename: string) => {
    // 重新上传
    const taskItem = fileListUtils.getTask(filename)
    taskItem.target.bootstrap()
    taskItem.target.resume()
  },
  updateStatus: (param) => {
    const taskItem = fileListUtils.getTask(param.filename)
    taskItem.status = param.status
    taskItem.statusText = param.statusText
  },
  updateProcess: (param) => {
    const taskItem = fileListUtils.getTask(param.filename)
    taskItem.speed = param.speed
    taskItem.percentage = param.percentage
    taskItem.uploadedSize = param.uploadedSize
    taskItem.timeRemaining = param.timeRemaining
  },
}
export const uploadUtils = {
  translateFileSize(fileSize) {
    const KB_STR = 'K'
    const MB_STR = 'M'
    const GB_STR = 'G'
    const UNIT = 1024
    let fileSizeSuffix = KB_STR
    fileSize = fileSize / UNIT
    if (fileSize >= UNIT) {
      fileSize = fileSize / UNIT
      fileSizeSuffix = MB_STR
    }
    if (fileSize >= UNIT) {
      fileSize = fileSize / UNIT
      fileSizeSuffix = GB_STR
    }
    return fileSize.toFixed(2) + fileSizeSuffix
  },
  // 当前文件状态list
  fileStatus: {
    PARSING: {
      code: 1,
      text: '解析中',
    },
    WAITING: {
      code: 2,
      text: '等待上传',
    },
    UPLOADING: {
      code: 3,
      text: '正在上传',
    },
    PAUSE: {
      code: 4,
      text: '暂停上传',
    },
    SUCCESS: {
      code: 5,
      text: '上传成功',
    },
    FAIL: {
      code: 6,
      text: '上传失败',
    },
    MERGE: {
      code: 7,
      text: '服务器处理中',
    },
  },
  translateTime(timeRemaining) {
    // 计算耗时
    if (!timeRemaining || Number.POSITIVE_INFINITY === timeRemaining) {
      return '--:--:--'
    }
    let timeRemainingInt = Number.parseInt(timeRemaining),
      hNum = Math.floor(timeRemainingInt / 3600),
      mNum = Math.floor((timeRemainingInt / 60 % 60)),
      sNum = Math.floor((timeRemainingInt % 60)),
      h = hNum < 10 ? '0' + hNum : hNum,
      m = mNum < 10 ? '0' + mNum : mNum,
      s = sNum < 10 ? '0' + sNum : sNum
    return h + ':' + m + ':' + s
  },
  translateSpeed(byteSpeed) {
    return `${uploadUtils.translateFileSize(byteSpeed)}/s`
  },
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },
  MD5(file, callback) {
    // 文件切片方法，兼容不同浏览器
    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
    const file1 = file
    const chunkSize = 1024 * 1024 * 2 // 每个切片的大小
    const chunks = Math.ceil(file1.size / chunkSize) // 需要切分的切片数
    let currentChunk = 0 // 当前处理的切片编号
    const spark = new sparkMD5.ArrayBuffer() // MD5计算工具实例
    const fileReader = new FileReader() // 文件读取器

    fileReader.onload = function (e) {
      spark.append(e.target.result) // 将读取的数据用于MD5计算
      currentChunk++
      if (currentChunk < chunks) {
        loadNext() // 加载下一个切片
      }
      else {
        callback(null, spark.end()) // 计算完成，回调返回MD5值
      }
    }

    fileReader.onerror = function () {
      callback('[文件读取失败]oops, something went wrong.') // 文件读取失败，回调返回错误信息
    }

    /**
     * 加载并读取下一个文件切片。
     */
    function loadNext() {
      const start = currentChunk * chunkSize // 当前切片的起始位置
      const end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize // 当前切片的结束位置
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end)) // 读取文件切片
    }

    loadNext() // 开始处理第一个文件切片
  },
}
