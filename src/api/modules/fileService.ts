import api from '../index'

const headers= {
  'Content-Type': 'application/x-www-form-urlencoded',
}
export default {
  // 检查是否上传
  secUpload: (data, resolve: Function, reject: Function) => {
    api.post('/file/sec-upload', data)
      .then(res => resolve(res)).catch(err => reject(err))
  },
  // 合并
  merge: (data, resolve: Function, reject: Function) => {
    api.post('/file/merge', data)
      .then(res => resolve(res)).catch(err => reject(err))
  },
  // 获取文件列表
  getFileList: (resolve: Function, reject: Function) => {
    api.get('/file/list')
      .then(res => resolve(res)).catch(err => reject(err))
  },
  // 删除
  delete: (fileId, resolve: Function, reject: Function) => {
    const data = {
      fileId: fileId,
    }
    api.post('/file/delete', data, { headers })
      .then(res => resolve(res)).catch(err => reject(err))
  },

}
