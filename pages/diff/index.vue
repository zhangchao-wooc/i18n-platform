<template>
  <div class="diff">
    <div class="diff-upload">
      <w-upload v-if="fileList.length !== 2" class="diff-upload-button" type="button" :buttonText="buttonText" :accept="accept" :fileUpload="fileUpload"  />
      <el-button v-else type="primary" class="diff-upload-button" @click="clearFile">
        清空文件
        <el-icon  class="diff-upload-button-icon"><Delete /></el-icon>
      </el-button>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="Diff 结果"
      width="80%"
      :before-close="handleClose"
    >
      <template #header>
        <el-select v-model="exportDiffType" class="diff-dialog-select" placeholder="请选择导出的 Diff 数据类型">
          <el-option
            v-for="item in exportDiffTypeList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-select v-model="exportFileType" class="diff-dialog-select" placeholder="请选择导出的文件类型">
          <el-option
            v-for="item in exportFileTypeList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-button type="primary" class="diff-upload-export" @click="exportFile">
          导出增量文件
          <el-icon  class="diff-upload-button-icon"><Folder /></el-icon>
        </el-button>
      </template>
      <div class="diff-dialog-info">
        <div class="diff-dialog-info-item" v-for="item in Object.keys(JSON.parse(diffResult))" :key="item">
        {{ exportDiffTypeList.filter(d => d.value === item)[0].label }} : {{ JSON.parse(diffResult)[item].length }}</div>
      </div>
      <el-input
        v-model="diffResult"
        autosize
        type="textarea"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { diffJson } from '../../utils/diff'

  interface FileListType {
    data: Record<string, string>
    type: string
    name: string
  }
  const accept = ref('.xml,.json')
  const fileList = ref<FileListType[]>([])
  const diffResult = ref('')
  const dialogVisible = ref(false)
  const exportFileType = ref('.json')
  const exportFileTypeList = ref<Record<string, string>[]>([
    {
      label: 'json',
      value: '.json'
    },
    {
      label: 'xml',
      value: '.xml'
    },
    {
      label: 'xlsx',
      value: '.xlsx'
    },
  ])
  const exportDiffType = ref<'add' | 'remove' | 'change' | 'empty'>('add')
  const exportDiffTypeList = ref<Record<string, string>[]>([
    {
      label: '增量数据',
      value: 'add'
    },
    {
      label: '减少数据',
      value: 'remove'
    },
    {
      label: '变更数据',
      value: 'change'
    },
    {
      label: '空数据',
      value: 'empty'
    }
  ])


  const buttonText = computed(() => {
    switch(fileList.value.length) {
      case 0:
        return '原始文件'
      case 1:
        return '最新文件'
    }
  })

  const fileUpload = (file: any) => {
    
    const loading = ElLoading.service({
      lock: true,
      text: '文件处理中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })

    const fielData = file[file.length - 1]
    const type = fielData['file']['type']
    const data = JSON.parse(fielData['fileContent'])
    const name = fielData['file']['name'].split('.')[0]

    fileList.value.push({
      type,
      data,
      name
    })

    if(fileList.value.length === 2) {
      console.log(1)
      dialogVisible.value = true
      diffResult.value = JSON.stringify(diffJson(fileList.value[0].data, fileList.value[1].data), null, 4)
      
    }

    loading.close()
  }

  const clearFile = () => {
    fileList.value = []
    dialogVisible.value = false
  }

  const exportFile = async () => {
    const data = JSON.parse(diffResult.value)
    const newData: Record<string, string> = {}

    data[exportDiffType.value].forEach((item:Record<string, string>) => {
      Object.assign(newData, item)
    });

    if(Object.keys(newData).length === 0) return 

    var blob = new Blob([JSON.stringify(newData, null, 4)]);
    // 创建一个URL对象
    var url = window.URL.createObjectURL(blob);
    // 创建一个a标签
    var a = document.createElement("a");
    a.href = url;
    a.download = `${exportDiffType.value}-${new Date().getTime()}${exportFileType.value}`;// 这里指定下载文件的文件名
    a.click();
    // 释放之前创建的URL对象
    window.URL.revokeObjectURL(url);
  }

  const handleClose = () => {
    dialogVisible.value = false
    diffResult.value = JSON.stringify({}, null, 4)
  }
</script>

<style lang="scss" scoped>
  .diff {
    &-upload {
      display: flex;
      justify-content: flex-end;
      &-button {
        width: 120px;
        &-icon {
          margin-left: 3px;
        }
      }
      &-export {
        margin: 10px 0;
      }
    }

    &-dialog {
      
      &-info {
        display: flex;
        justify-content: center;
        &-item {
          margin: 0 10px 10px;
        }
      }
      &-select {
        margin-right: 10px;
      }
    }
  }

  ::v-deep(.el-dialog__header) {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
