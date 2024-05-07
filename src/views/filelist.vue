<script setup lang="ts">
import fileServer from '@/api/modules/fileService'
import { ElMessage } from "element-plus";

const tableData = ref([])
function ts(obj){
  console.log(obj)
}
function deleteFile(fileId: string) {
  console.log(fileId)
  fileServer.delete(fileId, (res) => {
    if (res.data.result) {
      ElMessage.success('删除成功')
    }else {
      ElMessage.error('删除失败')
    }
    refresh()
  }, (err) => { ElMessage.error('删除失败') })
}
function DownloadFile(item) {
  console.log('DownloadFile')
  // 直接调用后台接口下载，注意跨域，后台要处理
  const baseURL = import.meta.env.VITE_APP_API_BASEURL
  const url = `${baseURL}/file/download?fileId=${item.fileId}`
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  link.target = '_blank'
  link.setAttribute('download', item.fileSourceName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
function refresh() {
  fileServer.getFileList((res) => {
    tableData.value = res.data
  }, (err) => {})
}
refresh()
</script>

<template>
  <el-button class="right-50%" type="primary" @click="refresh">
    刷新
  </el-button>
  <el-table :data="tableData" style="width: 100%">
    <el-table-column fixed prop="fileSourceName" label="文件名称" width="300" />
    <el-table-column prop="fileSizeDesc" label="文件大小" width="100" />
    <el-table-column prop="createTime" label="上传时间" width="200" />
    <el-table-column fixed="right" label="操作" width="120">
      <template #default="scope">
        <el-button link type="primary" size="small" @click="DownloadFile(scope.row)">
          下载
        </el-button>
        <el-button link type="primary" size="small" @click="deleteFile(scope.row.fileId)">
          删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>

</style>
