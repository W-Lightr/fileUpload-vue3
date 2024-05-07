<route lang="yaml">
  meta:
    layout: false
  </route>

<script lang="ts" setup>
import Slice from '@/views/slice.vue'
import Filelist from '@/views/filelist.vue'
</script>

<template>
  <div class="flex-col-center">
    <el-tabs type="border-card" class="demo-tabs">
      <el-tab-pane label="分片上传">
        <Slice/>
      </el-tab-pane>
      <el-tab-pane label="文件列表">
        <Filelist/>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style>
.demo-tabs > .el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}
.demo-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}
.demo-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}
</style>
