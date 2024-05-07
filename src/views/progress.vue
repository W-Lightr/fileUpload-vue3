<script setup lang="ts">
import {
  CircleCheckFilled,
  CircleCloseFilled,
  InfoFilled,
  Loading,
  Refresh,
  Sort,
  SuccessFilled,
  UploadFilled,
  VideoPause,
  VideoPlay,
} from '@element-plus/icons-vue'
import { fileListUtils, uploadUtils } from '../utils/common.ts'

// 接收外部传来参数
const { uploadTaskList } = defineProps({
  uploadTaskList: {
    type: Array,
    default: () => [],
  },
})

// const uploadUtils.fileStatus = uploadUtils.uploadUtils.fileStatus
const colors = '#409EFF'

console.log('uploadTaskList', uploadTaskList)

// 定义上传过程的方法
function pauseUpload(filename) {
  console.log('暂停上传')
  fileListUtils.pause(filename)
}
function resumeUpload(filename) {
  console.log('继续上传')
  fileListUtils.resume(filename)
}
function retryUpload(filename) {
  console.log('重新上传')
  fileListUtils.retry(filename)
}
function cancelUpload(filename) {
  console.log('取消上传')
  fileListUtils.cancel(filename)
}
function deleteFile(filename) {
  console.log('删除文件')
  fileListUtils.remove(filename)
}
</script>

<template>
  <el-table
    empty-text="暂无传输任务"
    :data="uploadTaskList"
    height="300px"
    style="width: 100%">
    <el-table-column
      align="center"
      header-align="center"
      label="文件名称"
      prop="filename"
      width="240"
      :show-overflow-tooltip="true"
    >
    </el-table-column>
    <el-table-column
      align="center"
      header-align="center"
      label="文件状态"
      width="120">
      <template #default="scope">
        <el-popover trigger="hover" placement="top">
          <p>状态: {{ scope.row.statusText }}</p>
          <template #reference>
            <div  class="name-wrapper">
              <div v-show="scope.row.status === uploadUtils.fileStatus.WAITING.code">
                <el-button size="default" :icon="InfoFilled" circle></el-button>
              </div>
              <div v-show="scope.row.status === uploadUtils.fileStatus.PARSING.code">
                <el-button size="default" :icon="Loading" circle></el-button>
              </div>
              <div v-show="scope.row.status === uploadUtils.fileStatus.PAUSE.code">
                <el-button size="default" :icon="VideoPlay" circle></el-button>
              </div>
              <div v-show="scope.row.status === uploadUtils.fileStatus.UPLOADING.code">
                <el-button size="default" :icon="UploadFilled" circle></el-button>
              </div>
              <div v-show="scope.row.status === uploadUtils.fileStatus.FAIL.code">
                <el-button size="default" :icon="CircleCloseFilled" circle></el-button>
              </div>
              <div v-show="scope.row.status === uploadUtils.fileStatus.MERGE.code">
                <el-button size="default" :icon="Sort" circle></el-button>
              </div>
              <div v-show="scope.row.status === uploadUtils.fileStatus.SUCCESS.code">
                <el-button size="default" :icon="CircleCheckFilled" circle></el-button>
              </div>
            </div>
          </template>
        </el-popover>
      </template>
    </el-table-column>
    <el-table-column
      align="center"
      header-align="center"
      label="上传进度"
      width="180">
      <template #default="scope">
        <el-popover trigger="hover" placement="top">
          <p>上传速度: {{ scope.row.speed }} </p>
          <p>上传大小: {{ scope.row.uploadedSize }}/{{ scope.row.fileSize }} </p>
          <p>剩余时间: {{ scope.row.timeRemaining }} </p>
          <template #reference>
            <div  class="name-wrapper">
              <el-progress :stroke-width="13" :color="colors" :percentage="scope.row.percentage"></el-progress>
            </div>
          </template>
        </el-popover>
      </template>
    </el-table-column>
    <el-table-column
      align="center"
      header-align="center"
      label="操作"
      width="180">
      <template #default="scope">
        <div v-show="scope.row.status === uploadUtils.fileStatus.UPLOADING.code">
          <el-tooltip
            class="item"
            effect="light" content="暂停上传" placement="top">
            <el-button
              size="default" type="info" :icon="VideoPause"
              circle @click="pauseUpload(scope.row.filename)"></el-button>
          </el-tooltip>
        </div>
        <div v-show="scope.row.status === uploadUtils.fileStatus.PAUSE.code || scope.row.status === uploadUtils.fileStatus.FAIL.code">
          <el-tooltip
            class="item"
            effect="light" content="继续上传" placement="top">
            <el-button
              type="success" :icon="VideoPlay" circle
              size="default" @click="resumeUpload(scope.row.filename)"></el-button>
          </el-tooltip>
        </div>
        <div v-show="scope.row.status === uploadUtils.fileStatus.FAIL.code">
          <el-tooltip
            class="item"
            effect="light" content="重新上传" placement="top">
            <el-button
              type="success" :icon="Refresh" circle
              size="default" @click="retryUpload(scope.row.filename)"></el-button>
          </el-tooltip>
        </div>
        <div v-show="scope.row.status === uploadUtils.fileStatus.MERGE.code || scope.row.status === uploadUtils.fileStatus.SUCCESS.code">
          <el-tooltip
            class="item"
            effect="light" content="上传完成" placement="top">
            <el-button
              type="success" :icon="SuccessFilled" circle
              size="default"></el-button>
          </el-tooltip>
        </div>
        <div v-show="scope.row.status === uploadUtils.fileStatus.WAITING.code">
          <el-tooltip
            class="item"
            effect="light" content="删除" placement="top">
            <el-button
              type="danger" :icon="CircleCloseFilled" circle
              size="default" @click="deleteFile(scope.row.filename)"></el-button>
          </el-tooltip>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>

</style>
