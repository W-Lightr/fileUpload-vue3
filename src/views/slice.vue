<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Uploader from 'simple-uploader.js'
import type { UploadInstance, ElMessage } from 'element-plus'
import { uploadUtils, taskFileList, fileListUtils } from '../utils/common.ts'
import Progress from '@/views/progress.vue'
import fileServer from '@/api/modules/fileService'
// 一些配置
const uploadRef = ref<UploadInstance>()
const urlPrefix = import.meta.env.VITE_APP_API_BASEURL
const blockSize = 1024 * 1024 * 2 // 2MB 分块大小

const fileOptions = {
  // 根据文件片段大小决定上传目标URL
  target(file, chunk) {
    // 如果设置了片段大小且大于0，则使用片段上传的URL，否则使用普通上传URL
    if (blockSize && blockSize > 0) {
      return `${urlPrefix}/file/chunk-upload`
    }
    return `${urlPrefix}/file/upload`
  },
  // 当未设置片段大小或片段大小小于等于0时，禁止上传多个文件
  singleFile: !blockSize || blockSize <= 0,
  // 设置文件片段大小
  chunkSize: blockSize,
  // 强制设置文件片段大小，此处设置为false
  forceChunkSize: false,
  // 同时上传的文件片段数量
  simultaneousUploads: 3,
  // 文件参数名
  fileParameterName: 'file',
  // 上传查询参数，此处为空
  query(file, chunk) {
    return {}
  },
  // 根据响应检查文件片段是否已上传 对应 GET chunk-upload
  checkChunkUploadedByResponse: function (chunk, message) {
    let objMessage = {}
    try {
      objMessage = JSON.parse(message)
    }
    catch (e) {
      // 解析响应消息为JSON，失败时objMessage保持为空对象
    }
    // 检查当前片段是否已上传
    return (objMessage.data.uploadedChunks || []).indexOf(chunk.offset + 1) >= 0
  },
  // 最大重试次数，设置为0表示不重试
  maxChunkRetries: 0,
  // 片段重试间隔，null表示无间隔
  chunkRetryInterval: null,
  // 进度回调间隔
  progressCallbacksInterval: 500,
  // 成功上传的状态码列表
  successStatuses: [200, 201, 202],
  // 永久性错误状态码列表
  permanentErrors: [404, 415, 500, 501],
  // 上传初始状态是否暂停
  initialPaused: false,
}

// 初始化上传对象
let uploader
function initUploader() {
  // 实例化上传对象
  uploader = new Uploader(fileOptions)
  // 绑定上传DOM
  uploader.assignBrowse(document.getElementById('upload-content'))
  uploader.assignDrop(document.getElementById('upload-content'))
  // 添加文件监听
  uploader.on('filesAdded', filesAdded)
  // 上传成功监听
  uploader.on('fileSuccess', fileUploaded)
  // 上传进度，上传完一个分片调用一次
  uploader.on('fileProgress', uploadProgress)
}

// 添加文件后的操作
function filesAdded(files, fileList, event) {
  console.log('files', files)
  files.forEach((f) => {
    // id
    const uuid = uploadUtils.generateUUID()
    // 定义数据的结构
    const taskItem = {
      target: f,
      filename: f.name,
      fileSize: uploadUtils.translateFileSize(f.size),
      uploadedSize: uploadUtils.translateFileSize(0),
      status: uploadUtils.fileStatus.WAITING.code,
      statusText: uploadUtils.fileStatus.WAITING.text,
      timeRemaining: uploadUtils.translateTime(Number.POSITIVE_INFINITY),
      speed: uploadUtils.translateSpeed(f.averageSpeed),
      percentage: 0,
      parentId: uuid,
    }
    fileListUtils.add(taskItem)
  })
}
// 上传操作
function uploadSubmit() {
  try {
    taskFileList.value.forEach((taskItem) => {
      const f = taskItem.target
      // 解析文件状态
      fileListUtils.updateStatus(
        {
          filename: f.name,
          status: uploadUtils.fileStatus.PARSING.code,
          statusText: uploadUtils.fileStatus.PARSING.text,
        },
      )
      // MD5解析
      uploadUtils.MD5(f.file, (e, md5) => {
        f.uniqueIdentifier = md5
        // 通过MD5校验是否上传过
        fileServer.secUpload({
          filename: f.name,
          identifier: md5,
          parentId: taskItem.parentId,
        }, (res) => {
          if (res.data.result == true) {
            // 后台存在就直接成功，同时取消上传
            ElMessage({
              message: `文件${f.name}上传成功!`,
              type: 'success',
            })
            f.cancel() // 取消上传
            // 删除列表文件
            // fileListUtils.remove(f.name)
            // 修改文件状态
            fileListUtils.updateStatus({
              filename: f.name,
              status: uploadUtils.fileStatus.SUCCESS.code,
              statusText: uploadUtils.fileStatus.SUCCESS.text,
            })
          }
          else {
            // 否则上传
            f.resume()
            // 更新状态
            fileListUtils.updateStatus({
              filename: f.name,
              status: uploadUtils.fileStatus.PARSING.code,
              statusText: uploadUtils.fileStatus.PARSING.text,
            })
          }
        }, (err) => {
          // 错误重新上传
          f.resume()
          // 更新状态
          fileListUtils.updateStatus({
            filename: f.name,
            status: uploadUtils.fileStatus.WAITING.code,
            statusText: uploadUtils.fileStatus.WAITING.text,
          })
        },
        )
      })
    })
  }
  catch (e) {

  }
}
// 上传完成操作
function fileUploaded(rootFile, file, message){
  // 上传完成响应结果
  let res = {
    code: undefined,
    data: undefined,
    msg: undefined,
  }
  try {
    res = JSON.parse(message)
  }
  catch (e) {
  }
  // 需要合并
  if (res.code == '200') {
    if (res.data.mergeFlag) {
      doMerge(file)
    }
  }
  else {
    // 上传失败暂停
    file.pause()
    file.updateTaskStatus({
      filename: file.name,
      status: uploadUtils.fileStatus.FAIL.code,
      statusText: uploadUtils.fileStatus.FAIL.text,
    })
  }
}
function doMerge(file) {
  // 获取当前上传文件，修改状态为合并
  const taskItem = fileListUtils.getTask(file.name)
  fileListUtils.updateStatus({
    filename: file.name,
    status: uploadUtils.fileStatus.MERGE.code,
    statusText: uploadUtils.fileStatus.MERGE.text,
  })
  // 更新进度条
  fileListUtils.updateProcess({
    filename: file.name,
    speed: uploadUtils.translateSpeed(file.averageSpeed),
    percentage: 99,
    uploadedSize: uploadUtils.translateFileSize(file.sizeUploaded()),
    timeRemaining: uploadUtils.translateTime(file.timeRemaining()),
  })
  // 调用后端合并接口
  fileServer.merge({
    filename: taskItem.filename,
    identifier: taskItem.target.uniqueIdentifier,
    totalSize: taskItem.target.size,
  }, res => {
    console.log('合并成功', res)
    // ElMessage({
    //   message: `文件${file.name}上传成功!`,
    //   type: 'success',
    // })
    // 上传完成更新进度
    fileListUtils.updateProcess({
      filename: file.name,
      speed: uploadUtils.translateSpeed(file.averageSpeed),
      percentage: 100,
      uploadedSize: uploadUtils.translateFileSize(file.sizeUploaded()),
      timeRemaining: uploadUtils.translateTime(file.timeRemaining()),
    })
    // 更新状态
    fileListUtils.updateStatus({
      filename: file.name,
      status: uploadUtils.fileStatus.SUCCESS.code,
      statusText: uploadUtils.fileStatus.SUCCESS.text,
    })
    // 从uploader任务列表剔除该文件

    // uploader.removeFile(file)
    // 从本地任务列表剔除该文件
    // fileListUtils.remove(file.name)
  }, res => {
    console.log('合并错误', res)
    file.pause()
    fileListUtils.updateStatus({
      filename: file.name,
      status: uploadUtils.fileStatus.FAIL.code,
      statusText: uploadUtils.fileStatus.FAIL.text,
    })
  })
}
// 上传进度
function uploadProgress(rootFile, file, chunk) {
  const taskItem = fileListUtils.getTask(file.name)
  if (file.isUploading()) {
    // 更新为正在上传状态
    if (taskItem.status !== uploadUtils.fileStatus.UPLOADING.code) {
      fileListUtils.updateStatus({
        filename: file.name,
        status: uploadUtils.fileStatus.UPLOADING.code,
        statusText: uploadUtils.fileStatus.UPLOADING.text,
      })
    }
    // 更新进度条
    fileListUtils.updateProcess({
      filename: file.name,
      speed: uploadUtils.translateSpeed(file.averageSpeed),
      percentage: Math.floor(file.progress() * 100),
      uploadedSize: uploadUtils.translateFileSize(file.sizeUploaded()),
      timeRemaining: uploadUtils.translateTime(file.timeRemaining()),
    })
  }
}
onMounted(() => {
  initUploader()
})
</script>

<template>
  <div ref="uploadRef" class="upload-content" id="upload-content">
    <div class="drag-content">
      <div class="drag-icon-content">
        <SvgIcon name="upload" />
      </div>
      <div class="drag-text-content">
        <el-link :underline="false" type="info">将文件拖到此处,或</el-link>
        <el-link :underline="false" type="primary">点击上传</el-link>
      </div>
    </div>
  </div>
  <div class="drag-text-content">
    <Progress :uploadTaskList="taskFileList"/>
  </div>
  <div class="drag-text-content">
    <el-button type="primary" @click="uploadSubmit">开始上传</el-button>
  </div>
</template>

<style scoped lang="scss">
.drag-icon-content{
  text-align: center;
}
.drag-text-content{
  text-align: center;
}
</style>
